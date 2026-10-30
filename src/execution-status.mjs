// P1 execution status: derived only from current runtime data; nothing here is saved or sent to drivers.
// Player perspective (view>=0) reports own units only and never global-cap or foreign-sensitive state.
import {UNITS} from './rules.mjs';
import {ACTION_LIMITS} from './warfare.mjs';
import {linkedPartner} from './engine.mjs';
import {admissionUrgency,admissionCandidates,timed} from './realtime.mjs';

export const STATUS_UNIT_LIMIT=64;
// Which cooldown field gates which action family (mirrors admissionCandidates/start()).
const COOLDOWNS=[['cooldownUntil','general'],['moveUntil','move'],['attackUntil','attack'],['healUntil','fortify'],['supportUntil','heal']];
const round=n=>Math.round(n*100)/100;
const gate=(u,a,time)=>(u.cooldownUntil||0)>time||a.type==='attack'&&(u.attackUntil||0)>time||a.type==='move'&&(u.moveUntil||0)>time||a.type==='fortify'&&(u.healUntil||0)>time||a.type==='heal'&&(u.supportUntil||0)>time;

// Current national priority order: own queue sorted by the scheduler's urgency (priority band + age), ties by
// queue position. This is not FIFO and not a promise of execution order.
export function nationalPriorityOrder(queue,time){
  return (queue||[]).map((q,index)=>({q,index,urgency:admissionUrgency(q,time)})).sort((a,b)=>b.urgency-a.urgency||a.index-b.index);
}

export function executionStatus(g,view,{units:only=null,rejections=null,cursor=g.realtime?.cursor??0}={}){
  const r=g.realtime,time=r.time,observer=view<0;
  const active=g.units.filter(u=>u.activity),activeByOwner=new Map(),reservedBy=new Map(),patients=new Map();let moving=0;
  for(const v of active){activeByOwner.set(v.owner,(activeByOwner.get(v.owner)||0)+1);const t=v.activity.action.type;if(t==='move'||t==='rebase'){moving++;const list=reservedBy.get(v.activity.to)||[];list.push(v);reservedBy.set(v.activity.to,list);}if(t==='heal')patients.set(v.activity.action.targetUnit,v);}
  const queued=new Map(),ranks=new Map();
  for(const [owner,queue]of Object.entries(r.queues||{})){if(!observer&&Number(owner)!==view)continue;nationalPriorityOrder(queue,time).forEach((item,i)=>{ranks.set(item.q.id,{rank:i+1,urgency:item.urgency});if(item.q.action.unit!==undefined&&!queued.has(item.q.action.unit))queued.set(item.q.action.unit,item.q);});}
  const wanted=only?new Set(only):null,result=[];
  for(const u of g.units){
    if(!observer&&u.owner!==view)continue;if(wanted&&!wanted.has(u.id))continue;
    const partner=linkedPartner(g,u),entry={id:u.id,type:u.type,owner:u.owner,name:UNITS[u.type]?.name||u.type,state:'idle',cooldowns:[]};
    if(partner)entry.partner=partner.id;
    for(const [key,action]of COOLDOWNS)if((u[key]||0)>time)entry.cooldowns.push({action,remaining:round(u[key]-time)});
    const healer=patients.get(u.id),healerVisible=healer&&(observer||healer.owner===view);
    if(healer&&healer.owner===u.owner)entry.treatment={remaining:round(Math.max(0,healer.activity.ends-time)),...(healerVisible?{healer:healer.id}:{})};
    if(u.activity){const a=u.activity;entry.activity={type:a.action.type,manual:a.manual!==false};
      if(a.action.type==='move'&&Array.isArray(a.path)){entry.activity.segment={index:a.index,total:a.path.length-1};entry.activity.segmentRemaining=round(Math.max(0,a.ends-time));entry.activity.to=a.to;}
      else entry.activity.remaining=round(Math.max(0,a.ends-time));}
    const q=queued.get(u.id);
    if(q){const need=q.action.type==='move'&&!q.action.detach&&partner?.tile===u.tile?2:1,own=activeByOwner.get(u.owner)||0;
      let waiting='scheduling';
      if(u.activity)waiting='currentAction';else if(gate(u,q.action,time))waiting='cooldown';else if(entry.treatment)waiting='treatment';
      else if(timed.has(q.action.type)&&own+need>ACTION_LIMITS.perNation)waiting='nationalLimit';
      else if(q.action.type==='move'&&(reservedBy.get(q.action.tile)||[]).some(v=>v.owner===u.owner&&v.id!==u.id&&v.id!==partner?.id))waiting='ownReservation';
      entry.queue={type:q.action.type,manual:!!q.manual,nationalPriority:ranks.get(q.id)?.rank??null,waiting,...(q.action.tile!==undefined?{tile:q.action.tile}:{})};
      if(observer){const blockers=[];if(active.length>=ACTION_LIMITS.active)blockers.push('globalActive');if(['move','rebase'].includes(q.action.type)&&moving>=ACTION_LIMITS.moving)blockers.push('globalMoving');if(q.action.type==='move'&&(reservedBy.get(q.action.tile)||[]).some(v=>v.owner!==u.owner))blockers.push('foreignReservation');entry.queue.debug={urgency:ranks.get(q.id)?.urgency,priority:q.priority||0,queuedAt:q.queuedAt,blockers};}
    }
    entry.state=u.activity?'active':entry.treatment?'treatment':q?'queued':entry.cooldowns.length?'cooling':'idle';
    if(g.settings.playMode==='turns')entry.state=g.turnOrder.order[g.turnOrder.index]!==u.owner?'waitingTurn':u.acted||u.moves<=0?'spent':entry.state;
    result.push(entry);
  }
  const out={time,units:result};
  if(rejections)out.rejections=rejections;
  if(observer){
    // Observer-only estimate of this tick's scheduler candidates; start() may still decline or reject them.
    const forecast=admissionCandidates(g,cursor).map(c=>({owner:c.p.id,entry:c.queue[c.index].id,unit:c.queue[c.index].action.unit,type:c.queue[c.index].action.type,score:c.score}));
    out.diagnostics={estimatedAt:time,estimate:true,active:active.length,moving,limits:{...ACTION_LIMITS},perOwner:Object.fromEntries(activeByOwner),candidates:forecast,budgetPerTick:4};
  }
  return out;
}