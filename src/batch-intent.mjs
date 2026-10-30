// P1 batch intent: one request expands into ordinary per-unit orders that go through the normal manual
// enqueue path (same replacement/eviction/128-entry rules, same 24/16/4 admission, reservations and legal
// revalidation at start/impact). There is no army entity and no merged capacity slot.
import {UNITS,dist} from './rules.mjs';
import {reachable,linkedPartner} from './engine.mjs';

export const BATCH_LIMIT=64,BATCH_KINDS=['move','fortify','cancel'];
const entityKey=a=>a.unit!==undefined?'u'+a.unit:a.city!==undefined?'c'+a.city:a.type;

// Throws (=> zero mutation) for a malformed envelope or oversized request.
export function validateBatchEnvelope(data,{game,worldToken}){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new BatchError(400,'批量请求格式无效。');
  if(data.game===undefined||data.world===undefined)throw new BatchError(400,'批量请求缺少世界标识。');
  if(data.game!==game.id||data.world!==worldToken)throw new BatchError(409,'世界已更换，请重新选择单位。');
  const p=Number.isInteger(data.player)?game.players[data.player]:null;if(!p)throw new BatchError(400,'玩家不存在。');if(!p.manual)throw new BatchError(400,'请先接管此玩家。');
  const intent=data.intent;if(!intent||typeof intent!=='object'||!BATCH_KINDS.includes(intent.kind))throw new BatchError(400,'未知的批量意图。');
  if(!Array.isArray(intent.units)||intent.units.length<1)throw new BatchError(400,'请至少选择一个单位。');
  if(intent.units.length>BATCH_LIMIT)throw new BatchError(400,'每次最多提交 '+BATCH_LIMIT+' 个单位。');
  if(intent.kind==='move'&&(!Number.isInteger(intent.tile)||!game.map.tiles[intent.tile]))throw new BatchError(400,'目标地块无效。');
  return {p,intent};
}
export class BatchError extends Error{constructor(status,message){super(message);this.status=status;}}

// Perspective world for destination planning: tiles outside current vision are impassable, foreign units are
// limited to currently visible ones and carry no activity/reservation. Hidden-only changes cannot alter plans.
export function perspectiveWorld(g,p){
  const visible=new Set(p.visible||[]),tiles=g.map.tiles.map(t=>visible.has(t.id)?t:{...t,terrain:'mountain'}),index={};
  for(const [key,t]of Object.entries(g.map.index||{}))index[key]=tiles[t.id];
  const units=g.units.filter(u=>u.owner===p.id||visible.has(u.tile)).map(u=>u.owner===p.id?u:{...u,activity:undefined});
  return {world:{...g,map:{...g.map,tiles,index},units},visible};
}

// Per-item parsing: malformed, duplicate and not-own IDs get explicit outcomes; unknown and foreign IDs share
// one wording so existence of foreign units is not revealed.
function parseItems(g,p,ids){
  const seen=new Set(),results=[],units=[];
  ids.forEach((raw,position)=>{
    if(!Number.isInteger(raw)){results.push({position,unit:null,status:'rejected',reason:'malformed'});return;}
    if(seen.has(raw)){results.push({position,unit:raw,status:'rejected',reason:'duplicate'});return;}seen.add(raw);
    const u=g.units.find(v=>v.id===raw);if(!u||u.owner!==p.id||u.hp<=0){results.push({position,unit:raw,status:'rejected',reason:'notOwnUnit'});return;}
    const r={position,unit:raw,status:'pending'};results.push(r);units.push({u,r});
  });
  return {results,units};
}

// Linked formations move as one physical pair with one destination: the lower id is the operative unit.
function operative(g,list){
  const byId=new Map(list.map(x=>[x.u.id,x])),ops=[];
  for(const x of list){const v=linkedPartner(g,x.u),together=v&&v.tile===x.u.tile;
    if(!together){ops.push({u:x.u,r:x.r});continue;}
    const lead=x.u.id<v.id?x.u:v;
    if(x.u!==lead){if(byId.has(lead.id)){x.r.status='merged';x.r.with=lead.id;continue;}ops.push({u:lead,r:x.r,implicitLead:true,partner:x.u.id});continue;}
    ops.push({u:x.u,r:x.r,partner:v.id});
  }
  return ops;
}

export function planBatchMoves(g,p,ids,target){
  const {results,units}=parseItems(g,p,ids),{world,visible}=perspectiveWorld(g,p),assignments=[];
  if(!visible.has(target)){for(const x of units){x.r.status='rejected';x.r.reason='targetNotVisible';}return {results,assignments};}
  const T=g.map.tiles[target],ops=operative(g,units).sort((a,b)=>dist(g.map.tiles[a.u.tile],T,g.map)-dist(g.map.tiles[b.u.tile],T,g.map)||a.u.id-b.u.id),taken=new Set();
  for(const op of ops){
    const options=reachable(world,p,op.u,true).filter(m=>!taken.has(m.tile)&&m.path.every(t=>visible.has(t)));
    options.sort((a,b)=>dist(g.map.tiles[a.tile],T,g.map)-dist(g.map.tiles[b.tile],T,g.map)||a.cost-b.cost||a.tile-b.tile);
    const pick=options[0];
    const busy=op.u.activity||(op.u.moveUntil||0)>g.realtime.time||(op.u.cooldownUntil||0)>g.realtime.time;
    if(!pick){op.r.status='rejected';op.r.reason=UNITS[op.u.type]?.domain==='air'||op.u.type==='envoy'?'cannotMove':busy?'unitBusy':'noVisibleDestination';continue;}
    taken.add(pick.tile);op.r.tile=pick.tile;if(op.partner!==undefined)op.r.partner=op.partner;if(op.implicitLead)op.r.operativeUnit=op.u.id;
    assignments.push({r:op.r,action:{type:'move',unit:op.u.id,tile:pick.tile}});
  }
  return {results,assignments};
}

// Enqueue each expanded order individually through the unchanged manual path so replacement, native eviction
// and full-queue rejection behave exactly like separate manual orders, and later items keep processing.
function enqueueEach(sim,p,assignments){
  const queue=()=>sim.game.realtime.queues[p.id]||[];
  for(const {r,action}of assignments){
    const before=queue().map(q=>({id:q.id,key:entityKey(q.action),manual:q.manual})),replaced=before.find(q=>q.key===entityKey(action));
    try{sim.enqueue(p,[action],{manual:true});}catch(error){r.status='rejected';r.reason='queueFull';r.message=error.message;continue;}
    const after=new Set(queue().map(q=>q.id)),evicted=before.filter(q=>!after.has(q.id)&&q.id!==replaced?.id).length;
    r.status=sim.turnBased?'completed':'queued';if(replaced)r.replaced=replaced.manual?'manual':'native';if(evicted)r.evictedNative=evicted;
  }
}

export function executeBatch(sim,g,p,intent){
  let results;
  if(intent.kind==='move'){const plan=planBatchMoves(g,p,intent.units,intent.tile);results=plan.results;enqueueEach(sim,p,plan.assignments);
    // A merged member shares its lead's single order: if that order was not queued, the member failed too.
    for(const r of results)if(r.status==='merged'){const lead=results.find(x=>x.unit===r.with&&x!==r);if(!['queued','completed'].includes(lead?.status)){r.status='rejected';r.reason=lead?.reason||'notPlanned';delete r.with;if(lead)r.partnerOf=lead.unit;}}}
  else{const parsed=parseItems(g,p,intent.units);results=parsed.results;
    if(intent.kind==='fortify')enqueueEach(sim,p,parsed.units.map(({u,r})=>({r,action:{type:'fortify',unit:u.id}})));
    // Cancel each selected unit through the unchanged runtime path; a moving linked pair is cancelled together.
    else for(const {u,r}of parsed.units){
      const v=linkedPartner(g,u),pairMoving=v&&u.activity?.action.type==='move'&&!u.activity.action.detach&&v.activity?.from===u.activity.from&&v.activity?.to===u.activity.to;
      const had=(g.realtime.queues[p.id]||[]).some(e=>e.action.unit===u.id)||['move','rebase'].includes(u.activity?.action.type);
      sim.cancel(p,u.id);r.status='cancelled';r.hadOrder=had;if(pairMoving)r.partner=v.id;
    }}
  for(const r of results)if(r.status==='pending'){r.status='rejected';r.reason='notPlanned';}
  const summary={submitted:intent.units.length};for(const r of results)summary[r.status]=(summary[r.status]||0)+1;
  return {results,summary};
}