import {unitHasRanged} from './rules.mjs';
import {civilianMissionActions} from './civilian-missions.mjs';
import {buildable} from './engine.mjs';
import {plunderOptions,plunderTrade} from './trade-security.mjs';
import {barbarianPlayer,isCampGuard} from './encounters.mjs';
import {religionAIOrders} from './religion.mjs';
import {movementBlocked} from './movement-rules.mjs';
import {heritageAIOrders} from './heritage.mjs';
import {nuclearTargets} from './engine.mjs';
import {nuclearStock} from './air-warfare.mjs';
import {carrierFor,carrierBusy,validateDecks} from './carrier-groups.mjs';
import {applyAction,finishTurn,reachable,movementCost,attackTargets,canCityAttackUnit,observation,event,visual,withVisibilityBatch,canOccupyCity,rebaseTargets,flightAllowed,healingTargets,receivingTreatment,linkedPartner,tileReserved,movementAllowance} from './engine.mjs';
import {UNITS,dist,movementDuration} from './rules.mjs';
import {VETERAN_TRAINING_SECONDS,veteranChoices} from './rules.mjs';
import {canTrainVeteran,unitUpgradeOptions,UNIT_UPGRADE_SECONDS} from './engine.mjs';
import {attackTiming} from '../web/unit-combat.js';
import {UNIT_MOTIONS} from '../web/visuals.js';
import {unitCooldown,ACTION_LIMITS,fortConstructionSeconds,maintainFortresses,protectedEnvoy} from './warfare.mjs';

export const ECONOMY_PERIOD=20,STEP=.05;
export const timed=new Set(['excavate','establishPark','concert','religiousHeal','nuke','move','rebase','attack','cityAttack','found','improve','chop','fortify','upgrade','spread','buildFort','buildRoad','repair','pillage','destroyRoad','destroyFort','trainVeteran','heal']);
const entityKey=a=>a.spy!==undefined?'spy'+a.spy:a.unit!==undefined?'u'+a.unit:a.city!==undefined?'c'+a.city:['government','policies'].includes(a.type)?'constitution':a.type==='voteCongress'?'congress:'+a.topic:a.type;
const cooldown=a=>['move','attack','cityAttack','fortify'].includes(a.type)?.4:2;
const NATIVE_UNIT_QUEUE_LIMIT=112;
export const admissionUrgency=(q,time)=>{
  const priority=q.priority||0,wait=Math.max(0,time-(q.queuedAt??time));
  // Combat outranks background aging; age still orders ordinary work within its priority band.
  return q.manual?15000:(priority>=1800?6000:0)+priority+Math.min(3000,wait*20);
};
// Physical impact uses the same authored release/flight timing as the renderer.
const impactDuration=(a,type)=>a.type==='nuke'?3:a.type==='upgrade'?UNIT_UPGRADE_SECONDS:['attack','cityAttack'].includes(a.type)?attackTiming(type,UNIT_MOTIONS[type]?.family||'shell').impact*1.1:1.25;

// Migration is in memory. The original save is never overwritten by construction.
export function migrateRealtime(g){
  if(!g.realtime){g.realtime={version:1,time:0,period:ECONOMY_PERIOD,nextEconomy:ECONOMY_PERIOD,queues:{},sequence:0};for(const u of g.units){u.acted=false;u.moves=movementAllowance(g,u);u.cooldownUntil=0;}for(const c of g.cities){c.attacked=false;c.cooldownUntil=0;}}
  const r=g.realtime;
  r.cursor??=0;r.accumulator??=0;
  if(r.version!==1||!Number.isFinite(r.time)||r.time<0||r.period!==ECONOMY_PERIOD||!Number.isFinite(r.nextEconomy)||r.nextEconomy<r.time||r.nextEconomy>r.time+ECONOMY_PERIOD+.001||!r.queues||typeof r.queues!=='object'||Array.isArray(r.queues)||!Number.isInteger(r.sequence)||r.sequence<0)throw new Error('Invalid realtime save clock.');
  if(!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>=g.players.length||!Number.isFinite(r.accumulator)||r.accumulator<0||r.accumulator>=STEP)throw new Error('Invalid realtime scheduler state.');
  for(const [owner,queue]of Object.entries(r.queues))if(!g.players[owner]||!Array.isArray(queue)||queue.length>128||queue.some(q=>!q||!q.action||typeof q.action.type!=='string'||q.priority!==undefined&&(!Number.isFinite(q.priority)||q.priority<0||q.priority>3000)||q.queuedAt!==undefined&&(!Number.isFinite(q.queuedAt)||q.queuedAt<0||q.queuedAt>r.time)))throw new Error('Invalid realtime save queue.');
  for(const u of [...g.units,...g.cities]){
    if(['cooldownUntil','moveUntil','attackUntil','healUntil','supportUntil','medicalUntil','zocUntil','revealedUntil'].some(key=>u[key]!==undefined&&(!Number.isFinite(u[key])||u[key]<0)))throw new Error('Invalid realtime cooldown.');
    const a=u.activity;if(!a)continue;
    if(a.action?.type==='nuke'&&(a.nuclearReserved!==true||a.owner!==u.owner||!Number.isInteger(a.action.tile)||!g.map.tiles[a.action.tile]||(a.action.unit??a.action.city)!==u.id))throw Error('Invalid reserved nuclear activity.');
    if(!a.action||!timed.has(a.action.type)||!Number.isFinite(a.started)||!Number.isFinite(a.ends)||a.started>r.time||a.ends<a.started||a.ends>r.time+180)throw new Error('Invalid realtime activity.');
    if(['attack','cityAttack'].includes(a.action.type)&&g.units.some(target=>target.id===a.action.targetUnit&&(target.greatPerson||UNITS[target.type]?.heritage))){delete u.activity;u.acted=false;if(u.attacked!==undefined)u.attacked=false;continue;}
    if(a.action.type==='rebase'&&(UNITS[u.type].domain!=='air'||a.action.unit!==u.id||a.from!==u.tile||!g.map.tiles[a.from]||a.to!==a.action.tile||!g.map.tiles[a.to]||dist(g.map.tiles[a.from],g.map.tiles[a.to],g.map)>UNITS[u.type].rebaseRange))throw new Error('Invalid aircraft transfer.');
    if(a.action.type==='heal'&&(!UNITS[u.type]?.medical||a.action.unit!==u.id||!Number.isInteger(a.action.targetUnit)||Math.abs(a.ends-a.started-2)>.001))throw Error('Invalid medical treatment activity.');
    if(a.action.type==='trainVeteran'&&(a.action.unit!==u.id||!veteranChoices(u).includes(a.action.item)||Math.abs(a.ends-a.started-VETERAN_TRAINING_SECONDS)>.001))throw new Error('Invalid veteran training activity.');
    if(a.action.type==='move'&&(!Array.isArray(a.path)||a.path.length<2||a.path.length>32||!Number.isInteger(a.index)||a.index<1||a.index>=a.path.length||a.path.some(t=>!g.map.tiles[t])||a.from!==u.tile||a.to!==a.path[a.index]||dist(g.map.tiles[a.from],g.map.tiles[a.to],g.map)!==1))throw new Error('Invalid realtime movement.');
    const partner=linkedPartner(g,u),other=partner?.activity;
    if(a.action.type==='move'&&!a.action.detach&&partner?.tile===u.tile&&(!other||other.action.type!=='move'||other.action.detach||other.from!==a.from||other.to!==a.to||other.started!==a.started||other.ends!==a.ends||other.index!==a.index||JSON.stringify(other.path)!==JSON.stringify(a.path)))throw Error('Invalid formation movement.');
  }
  return g;
}

// Scheduler candidate selection shared by advance() and read-only diagnostics. It reflects the current
// tick only: start() may still return false or reject, so it is never a guarantee of future execution.
export function admissionCandidates(g,cursor){
  const r=g.realtime,players=g.players,admissionUnits=new Map(g.units.map(u=>[u.id,u])),active=g.units.filter(u=>u.activity),patients=new Set(active.filter(u=>u.activity.action.type==='heal').map(u=>u.activity.action.targetUnit));const activeOwners=new Map(),reservedCells=new Map();let moving=0;for(const v of active){activeOwners.set(v.owner,(activeOwners.get(v.owner)||0)+1);if(['move','rebase'].includes(v.activity.action.type)){moving++;const ids=reservedCells.get(v.activity.to)||[];ids.push(v.id);reservedCells.set(v.activity.to,ids);}}
  const candidates=[];
  for(let n=0;n<players.length;n++){const p=players[(cursor+n)%players.length],queue=r.queues[p.id];if(!p.alive||!queue?.length)continue;
    let index=-1,score=-Infinity;
    for(let i=0;i<queue.length;i++){
      const q=queue[i],a=q.action,u=admissionUnits.get(a.unit);
      if(u&&(u.activity||(u.cooldownUntil||0)>r.time||patients.has(u.id)||a.type==='attack'&&(u.attackUntil||0)>r.time||a.type==='move'&&(u.moveUntil||0)>r.time||a.type==='fortify'&&(u.healUntil||0)>r.time||a.type==='heal'&&(u.supportUntil||0)>r.time))continue;
      if(u&&timed.has(a.type)&&(active.length>=ACTION_LIMITS.active||(activeOwners.get(p.id)||0)>=ACTION_LIMITS.perNation||['move','rebase'].includes(a.type)&&moving>=ACTION_LIMITS.moving))continue;
      if(u&&a.type==='move'&&(reservedCells.get(a.tile)||[]).some(id=>id!==u.id&&id!==u.linkedUnit))continue;
      const urgency=admissionUrgency(q,r.time);
      if(urgency>score){score=urgency;index=i;}
    }
    if(index<0)continue;
    candidates.push({p,queue,index,score,order:n});
  }
  candidates.sort((a,b)=>b.score-a.score||a.order-b.order);
  return candidates;
}

export function developmentAIOrders(obs){
 const religion=religionAIOrders(obs),spent=religion.reduce((n,a)=>n+(a.hint?.faithCost||0),0);
 return [...religion,...heritageAIOrders(obs,{faithBudget:Math.max(0,(obs.player.faith||0)-spent)})];
}

export class RealtimeSimulation{
  constructor(game,{execute,prepareObservation=observation,onChange=()=>{},onEconomy=()=>{},onRejected,maxDrivers=2,decisionInterval=1500,now=()=>performance.now()}={}){
    this.game=migrateRealtime(game);this.execute=execute;this.prepareObservation=prepareObservation;this.onChange=onChange;this.onEconomy=onEconomy;this.onRejected=onRejected;this.maxDrivers=maxDrivers;this.decisionInterval=decisionInterval;this.now=now;this.running=false;this.rate=1;this.jobs=new Map();this.nextDecision=new Map();this.generation=0;this.cursor=game.realtime.cursor;this.accumulator=game.realtime.accumulator;this.disposed=false;this.stats={ticks:0,accepted:0,rejected:0,peakDrivers:0};this.ready();
  }
  play(){if(this.game.winner)throw new Error('本局已结束。');this.running=true;}
  pause(){this.running=false;this.generation++;this.nextDecision.clear();}
  dispose(){this.pause();this.disposed=true;}
  enqueue(p,orders,{manual=false,continuation=false}={}){
    if(!p?.alive||this.game.winner)throw new Error('文明已覆灭或对局已结束。');
    if(!Array.isArray(orders)||orders.length>128)throw new Error('最多提交 128 条指令。');
    const r=this.game.realtime,queue=r.queues[p.id]??=[];
    const lowest=(unitsOnly=false)=>{let index=-1;for(let i=0;i<queue.length;i++){const entry=queue[i];if(entry.manual||unitsOnly&&entry.action.unit===undefined)continue;const value=entry.priority??(entry.action.type==='attack'?1800:0),old=index<0?Infinity:queue[index].priority??(queue[index].action.type==='attack'?1800:0);if(value<old)index=i;}return index;};
    const defer=()=>{this.stats.deferred=(this.stats.deferred||0)+1;};
    // Reserve national planning space without cancelling actions already in flight.
    if(!manual)while(queue.filter(q=>!q.manual&&q.action.unit!==undefined).length>NATIVE_UNIT_QUEUE_LIMIT){const index=lowest(true);if(index<0)break;queue.splice(index,1);defer();}
    for(const action of orders){
      if(!action||typeof action.type!=='string'){this.stats.rejected++;continue;}
      const key=entityKey(action),existing=queue.findIndex(q=>entityKey(q.action)===key),priority=manual?0:Math.max(0,Math.min(3000,Number.isFinite(action.priority)?action.priority:action.type==='attack'?1800:0));
      if(existing>=0){
        if(manual)queue.splice(existing,1);
        // Keep legal pending combat when another shooter's reservation produces an idle fallback.
        else {const old=queue[existing];if(action.unit!==undefined&&!old.manual){
          const unit=this.game.units.find(u=>u.id===action.unit&&u.owner===p.id),pendingAttack=old.action.type==='attack'&&unit&&!unit.activity&&attackTargets(this.game,p,unit).some(t=>old.action.targetUnit!==undefined?t.targetUnit===old.action.targetUnit:t.targetCity===old.action.targetCity);
          const destination=old.action.type==='move'?this.game.cities.find(c=>c.tile===old.action.tile):null,pendingCapture=unit&&destination&&canOccupyCity(this.game,unit,destination)&&reachable(this.game,p,unit).some(m=>m.tile===destination.tile);
          if(!(pendingAttack||pendingCapture)||priority>=(old.priority??(pendingCapture?2600:1800))){old.action={...action};old.priority=priority;}
          else old.priority??=pendingCapture?2600:1800;
          old.queuedAt??=r.time;
        }continue;}
      }
      const unitFull=!manual&&action.unit!==undefined&&queue.filter(q=>!q.manual&&q.action.unit!==undefined).length>=NATIVE_UNIT_QUEUE_LIMIT;
      if(unitFull||queue.length>=128){const index=lowest(unitFull),old=index<0?Infinity:queue[index].priority??(queue[index].action.type==='attack'?1800:0);if(index<0||!manual&&(priority<old||priority===old&&!continuation)){if(manual)throw new Error('此文明的指令队列已满。');defer();continue;}queue.splice(index,1);defer();}
      queue.push({id:++r.sequence,action:{...action},manual,priority,queuedAt:r.time});
    }
    this.onChange();return queue.length;
  }
  cancel(p,unit){const u=this.game.units.find(u=>u.id===unit&&u.owner===p.id);if(!u)throw new Error('单位不存在。');const v=linkedPartner(this.game,u),pair=v&&u.activity?.action.type==='move'&&!u.activity.action.detach&&v.activity?.from===u.activity.from&&v.activity?.to===u.activity.to?[u,v]:[u],ids=new Set(pair.map(x=>x.id));this.game.realtime.queues[p.id]=(this.game.realtime.queues[p.id]||[]).filter(q=>!ids.has(q.action.unit));for(const x of pair)if(['move','rebase'].includes(x.activity?.action.type)){const action=x.activity.action.type;delete x.activity;x.cooldownUntil=this.game.realtime.time+unitCooldown(x.type,action);x.moveUntil=x.cooldownUntil;}this.ready();this.onChange();}
  ready(){const t=this.game.realtime.time;let changed=false;for(const u of this.game.units){const ready=!u.activity&&(u.cooldownUntil||0)<=t&&!(UNITS[u.type].civilian&&movementBlocked(this.game,u)),moves=ready?movementAllowance(this.game,u):0;changed||=u.acted!==!ready||u.moves!==moves;u.acted=!ready;u.moves=moves;}for(const c of this.game.cities){const attacked=!!c.activity||Math.max(c.cooldownUntil||0,c.attackUntil||0)>t;changed||=c.attacked!==attacked;c.attacked=attacked;}this.leaderStates??=new Map();for(const p of this.game.players){const key=String((p.leaderAbility?.activeUntil||0)>t)+':'+String((p.leaderAbility?.readyAt||0)<=t);if(this.leaderStates.has(p.id)&&this.leaderStates.get(p.id)!==key)changed=true;this.leaderStates.set(p.id,key);}return changed;}
  reserved(unit,to){const partner=linkedPartner(this.game,unit);return tileReserved(this.game,to,[unit.id,...(partner?[partner.id]:[])]);}
  moveSegment(u,a,p){
    const g=this.game,r=g.realtime,from=g.map.tiles[u.tile],to=g.map.tiles[a.path[a.index]],cost=movementCost(g,p,u,from,to);
    if(!Number.isFinite(cost)||this.reserved(u,to.id))throw new Error('行进路径被其他单位占用。');
    a.owner=u.owner;a.from=from.id;a.to=to.id;a.started=r.time;a.ends=r.time+movementDuration(u.type,cost,!a.action.detach&&(UNITS[u.type].escortMovement||UNITS[linkedPartner(g,u)?.type]?.escortMovement)?movementAllowance(g,u):UNITS[u.type].moves);u.activity=a;u.acted=true;u.moves=0;u.fortified=false;
  }
  start(p,a){
    if(a.type==='jump'){applyAction(this.game,p,a);const u=this.game.units.find(u=>u.id===a.unit);if(u){u.moveUntil=this.game.realtime.time+unitCooldown(u.type,'move');u.cooldownUntil=this.game.realtime.time+.4;}return true;}
    if(a.type==='separate')a={...a,type:'move',detach:true};
    const g=this.game,r=g.realtime,u=a.unit!==undefined?g.units.find(u=>u.id===a.unit&&u.owner===p.id):null,c=a.city!==undefined?g.cities.find(c=>c.id===a.city&&c.owner===p.id):null;
    if(a.unit!==undefined&&!u||a.city!==undefined&&a.type!=='spyMission'&&!c)throw new Error('指令对象已不存在。');
    const entity=u||(['cityAttack','nuke'].includes(a.type)?c:null);
    if(entity&&(entity.activity||(entity.cooldownUntil||0)>r.time))return false;
    if((a.type==='attack'||a.type==='cityAttack'||a.type==='nuke')&&(entity.attackUntil||0)>r.time)return false;
    if(u&&receivingTreatment(g,u))return false;
    if(a.type==='heal'&&(u.supportUntil||0)>r.time)return false;
    if(a.type==='fortify'&&(u.healUntil||0)>r.time)return false;
    if(!timed.has(a.type)){applyAction(g,p,a);return true;}
    if(entity){const active=g.units.filter(x=>x.activity);if(active.length>=ACTION_LIMITS.active||active.filter(x=>x.owner===p.id).length>=ACTION_LIMITS.perNation||['move','rebase'].includes(a.type)&&active.filter(x=>['move','rebase'].includes(x.activity.action.type)).length>=ACTION_LIMITS.moving)return false;}
    if(a.type==='rebase'){const base=rebaseTargets(g,p,u).find(t=>t.tile===a.tile&&t.carrier===a.carrier);if(!base||!flightAllowed(g,p,u,g.map.tiles[a.tile]))throw new Error('无法转场到此机场或航母。');u.activity={owner:p.id,action:a,from:u.tile,to:a.tile,started:r.time,ends:r.time+base.seconds};u.acted=true;u.moves=0;u.fortified=false;return true;}
    if(a.type==='move'){
      if(UNITS[u.type].airCapacity&&carrierBusy(g,u))return false;
      if((u.moveUntil||0)>r.time)return false;
      const partner=linkedPartner(g,u),escort=partner?.tile===u.tile&&!a.detach;
      if(escort&&(partner.activity||partner.acted||receivingTreatment(g,partner)||(partner.moveUntil||0)>r.time))return false;
      if(escort&&(g.units.filter(x=>x.activity).length+2>ACTION_LIMITS.active||g.units.filter(x=>x.owner===p.id&&x.activity).length+2>ACTION_LIMITS.perNation||g.units.filter(x=>['move','rebase'].includes(x.activity?.action.type)).length+2>ACTION_LIMITS.moving))return false;
      if(this.reserved(u,a.tile))return false;
      const move=reachable(g,p,u,true,!a.detach).find(m=>m.tile===a.tile);if(!move||a.detach&&(!partner||partner.activity||a.tile===partner.tile))throw new Error('目的地不可到达。');
      const queued=r.queues[p.id]?.find(q=>q.action===a);
      this.moveSegment(u,{action:a,path:move.path,index:1,manual:queued?.manual??true,priority:queued?.priority??0,queuedAt:queued?.queuedAt??r.time},p);
      if(escort){this.moveSegment(partner,{action:{...a,unit:partner.id},path:move.path.slice(),index:1},p);const ends=Math.max(u.activity.ends,partner.activity.ends);u.activity.ends=partner.activity.ends=ends;}
      return true;
    }
    // Admission validates without consuming resources; impact validates again.
    if(a.type==='attack'&&!attackTargets(g,p,u).some(t=>a.targetUnit!==undefined?t.targetUnit===a.targetUnit:t.targetCity===a.targetCity))throw new Error('目标不在射程内或尚未宣战。');
    if(a.type==='attack'&&UNITS[u.type].domain==='air'){const target=g.units.find(t=>t.id===a.targetUnit)||g.cities.find(t=>t.id===a.targetCity);if(!flightAllowed(g,p,u,g.map.tiles[target.tile]))throw new Error('飞行路线经过未开放的中立领空。');}
    if(a.type==='cityAttack'&&!canCityAttackUnit(g,p,c,g.units.find(target=>target.id===a.targetUnit)))throw new Error('城市无法攻击。');
    if(['excavate','establishPark','concert','religiousHeal'].includes(a.type)&&!civilianMissionActions(g,p,u,{buildable}).some(v=>v.type===a.type&&(v.targetUnit===undefined||v.targetUnit===a.targetUnit)&&(v.city===undefined||v.city===a.city)))throw Error('平民任务条件已变化。');
    if(a.type==='heal'&&!healingTargets(g,p,u).some(t=>t.targetUnit===a.targetUnit))throw Error('伤员无法接受治疗。');
    if(a.type==='trainVeteran'&&!canTrainVeteran(g,p,u,a.item))throw new Error('训练需要可用专长名额、空闲部队及本国领土。');
    if(a.type==='upgrade'){const op=unitUpgradeOptions(g,p,u).find(o=>o.item===a.item);if(!op?.available)throw Error(op?.reasons.join('；')||'不能跳级或跨兵种路线升级。');if(a.expectedCost!==undefined&&a.expectedCost!==op.goldCost)throw Error('升级价格已变化，请重新选择。');a={...a,expectedCost:op.goldCost};}
    if(!entity)throw new Error('此动作缺少单位或城市。');
    if(a.type==='nuke'){if((entity.attackUntil||0)>r.time)throw Error('核载具正在冷却。');if(!nuclearTargets(g,p,entity).some(t=>t.tile===a.tile))throw Error('核打击不可用。');p.nuclearStockpile=nuclearStock(p)-1;}
    entity.activity={owner:p.id,...(a.type==='nuke'?{nuclearReserved:true}:{}),action:a,started:r.time,ends:r.time+(['heal','religiousHeal'].includes(a.type)?2:a.type==='trainVeteran'?VETERAN_TRAINING_SECONDS:a.type==='buildFort'?fortConstructionSeconds(g,p,u):a.type==='destroyFort'?6:impactDuration(a,u?.type==='giantdeathrobot'&&!unitHasRanged(p,u.type)?'warrior':u?.type||'city'))};
    if(u){u.acted=true;u.moves=0;}else c.attacked=true;
    const target=g.units.find(t=>t.id===a.targetUnit)||g.cities.find(t=>t.id===a.targetCity);
    if(a.type==='attack'||a.type==='cityAttack'){if(target)visual(g,'attack',u||{...c,type:'city'},{target:{...target},duration:1.1});}
    else visual(g,'work',u||{...c,type:'city'},{action:a.type,duration:['heal','religiousHeal'].includes(a.type)?2:impactDuration(a,u?.type||'city'),...(a.type==='heal'?{target:{...target}}:{})});
    return true;
  }
  barbarianPlayer(unit={}){return barbarianPlayer(this.game,unit);}
  complete(entity){
    const g=this.game,r=g.realtime,a=entity.activity,p=entity.owner===-1?this.barbarianPlayer(entity):g.players[entity.owner];
    if(a.owner!==entity.owner||entity.hp<=0||entity.type&&!g.units.includes(entity)){delete entity.activity;return;}
    const partner=linkedPartner(g,entity),paired=a.action.type==='move'&&!a.action.detach&&partner?.activity?.action.type==='move'&&partner.activity.from===a.from&&partner.activity.to===a.to&&partner.activity.started===a.started;
    if(paired){const b=partner.activity;delete entity.activity;delete partner.activity;for(const u of [entity,partner]){u.acted=false;u.moves=movementAllowance(g,u);}
      try{if(entity.tile!==a.from||partner.tile!==b.from||this.reserved(entity,a.to))throw Error('编队路径已被占用。');applyAction(g,p,{type:'move',unit:entity.id,tile:a.to},{presentation:false});a.index++;b.index++;if(a.index<a.path.length&&![entity,partner].some(u=>movementBlocked(g,u))){for(const [u,path] of [[entity,a],[partner,b]]){u.acted=false;u.moves=movementAllowance(g,u);this.moveSegment(u,path,p);}const ends=Math.max(entity.activity.ends,partner.activity.ends);entity.activity.ends=partner.activity.ends=ends;}else for(const u of [entity,partner]){u.cooldownUntil=r.time+.4;u.moveUntil=r.time+unitCooldown(u.type,'move');}}
      catch(error){delete entity.activity;delete partner.activity;for(const u of [entity,partner])u.cooldownUntil=r.time+.5;this.stats.rejected++;this.onRejected?.({stage:"impact",owner:p.id,type:a.action.type,unit:entity.id,partner:partner.id,reason:error.message,time:r.time});if(p.manual)event(g,'order',error.message,p.id,entity.tile);}return;
    }
    delete entity.activity;entity.acted=false;entity.moves=UNITS[entity.type]?.moves||0;entity.attacked=false;
    try{
      const action=a.action.type==='move'?{type:'move',unit:entity.id,tile:a.to,...(a.action.detach?{detach:true}:{})}:a.action;
      if(a.action.type==='move'&&(entity.tile!==a.from||this.reserved(entity,a.to)))throw new Error('移动目的地已被占用。');
      const returnSequence=entity.returnSequence||0;
      applyAction(g,p,action,{presentation:false,nuclearReserved:a.action.type==='nuke'&&a.nuclearReserved===true});
      if((entity.returnSequence||0)!==returnSequence)return;
      if(a.action.detach)delete a.action.detach;
      if(a.action.type==='move'&&++a.index<a.path.length&&!movementBlocked(g,entity)){
        // AI routes yield at completed cells; manual and linked movements keep their continuous path.
        if(a.manual===false&&!linkedPartner(g,entity)){
          const queue=r.queues[p.id]??=[];
          if(!queue.some(q=>q.action.unit===entity.id)){
            this.enqueue(p,[{...a.action,priority:a.priority??0}],{continuation:true});
            const continuation=queue.find(q=>q.action.unit===entity.id);
            // A serviced segment starts a fresh wait; admitted routes may replace equal-priority backlog.
            if(!continuation){this.moveSegment(entity,a,p);return;}
          }
          return;
        }
        this.moveSegment(entity,a,p);return;
      }
      entity.cooldownUntil=r.time+cooldown(a.action);if(['move','rebase'].includes(a.action.type))entity.moveUntil=r.time+unitCooldown(entity.type,a.action.type);if(a.action.type==='nuke')entity.attackUntil=r.time+20;else if(['attack','cityAttack'].includes(a.action.type))entity.attackUntil=r.time+unitCooldown(entity.type||'city','attack');if(a.action.type==='fortify')entity.healUntil=r.time+20;
    }catch(error){entity.cooldownUntil=r.time+.5;this.stats.rejected++;this.onRejected?.({stage:"impact",owner:p?.id,type:a.action.type,...(a.action.unit!==undefined?{unit:a.action.unit}:{city:a.action.city}),reason:error.message,time:r.time});if(p?.manual)event(g,'order',error.message,p.id,entity.tile);}
  }
  tick(seconds){return this.advance(seconds);}
  advance(seconds){
    if(!Number.isFinite(seconds)||seconds<0||seconds>60)throw new Error('Invalid simulation time step.');
    if(this.disposed||this.game.winner)return;
    this.accumulator+=seconds;let changed=false;
    while(this.accumulator+1e-9>=STEP&&!this.game.winner){this.accumulator-=STEP;const g=this.game,r=g.realtime;r.time=Math.round((r.time+STEP)*1000)/1000;this.stats.ticks++;
      withVisibilityBatch(g,()=>{
      for(const entity of [...g.units,...g.cities])if(entity.activity&&entity.activity.ends<=r.time+1e-9) {this.complete(entity);changed=true;}
      if(this.ready())changed=true;
      if(Math.round(r.time/STEP)%20===0&&maintainFortresses(g))changed=true;
      // Global urgency precedes admission; round-robin breaks ties without raising concurrency limits.
      const players=g.players;let budget=4;
      const candidates=admissionCandidates(g,this.cursor);
      for(const {p,queue,index}of candidates){
        if(!budget)break;
        const q=queue[index];try{if(!this.start(p,q.action)){queue.push(...queue.splice(index,1));continue;}this.stats.accepted++;}catch(error){this.stats.rejected++;this.onRejected?.({stage:'admission',owner:p.id,type:q.action.type,entry:q.id,...(q.action.unit!==undefined?{unit:q.action.unit}:{}),...(q.action.city!==undefined?{city:q.action.city}:{}),reason:error.message,time:r.time});if(q.manual)event(g,'order',error.message,p.id);}
        queue.splice(index,1);budget--;changed=true;
      }
      this.cursor=(this.cursor+1)%players.length;r.cursor=this.cursor;
      if(r.time>=r.nextEconomy){const before=g.players.map(p=>({id:p.id,gold:p.gold,faith:p.faith,science:p.scienceTotal,culture:p.cultureTotal,techs:[...p.techs],civics:[...p.civics],cities:g.cities.filter(c=>c.owner===p.id).length,population:g.cities.filter(c=>c.owner===p.id).reduce((n,c)=>n+c.population,0),units:g.units.filter(u=>u.owner===p.id).length}));finishTurn(g,{actions:false});r.nextEconomy+=ECONOMY_PERIOD;this.onEconomy(before);changed=true;}
      if((g.settings.barbarians||g.units.some(u=>u.owner===-1&&u.mutiny))&&Math.round(r.time/STEP)%20===0){for(const u of g.units.filter(u=>u.owner===-1&&!UNITS[u.type].civilian&&!u.acted&&(g.settings.barbarians||u.mutiny))){const p=this.barbarianPlayer(u),raid=plunderOptions(g,p,u)[0];if(raid){plunderTrade(g,p,raid,event);changed=true;continue;}const targets=attackTargets(g,p,u);if(targets.length){try{this.start(p,{type:'attack',unit:u.id,...targets.sort((a,b)=>a.health-b.health)[0]});changed=true;}catch{}}else if(!isCampGuard(g,u)){const prey=g.units.filter(e=>e.owner>=0&&!e.greatPerson&&!protectedEnvoy(e)&&dist(g.map.tiles[u.tile],g.map.tiles[e.tile],g.map)<=6);if(prey.length){const moves=reachable(g,p,u).sort((a,b)=>Math.min(...prey.map(e=>dist(g.map.tiles[a.tile],g.map.tiles[e.tile],g.map)))-Math.min(...prey.map(e=>dist(g.map.tiles[b.tile],g.map.tiles[e.tile],g.map))));if(moves[0])try{this.start(p,{type:'move',unit:u.id,tile:moves[0].tile});changed=true;}catch{}}}}}
      });
    }
    this.accumulator=this.game.winner?0:Math.max(0,Math.round(this.accumulator*1e12)/1e12);this.game.realtime.accumulator=this.accumulator;if(this.ready())changed=true;if(changed)this.onChange();if(this.game.winner)this.pause();
  }
  async plan({force=false}={}){
    if(!this.execute||this.disposed||this.game.winner||!force&&!this.running)return;
    const wall=this.now(),generation=this.generation,started=[];
    for(const p of [...this.game.players].sort((a,b)=>(this.nextDecision.get(a.id)||0)-(this.nextDecision.get(b.id)||0))){
      if(this.jobs.size>=this.maxDrivers)break;
      if(!p.alive||p.manual||this.jobs.has(p.id)||!force&&(this.nextDecision.get(p.id)||0)>wall)continue;
      this.nextDecision.set(p.id,wall+this.decisionInterval);
      let heritageOrders=[];const file=p.driver.file,planRevision=p.planRevision||0,prepared=this.prepareObservation(this.game,p);
      const job=Promise.resolve(prepared).then(obs=>{
        if(this.disposed||generation!==this.generation||p.manual||!p.alive||file!==p.driver.file||planRevision!==(p.planRevision||0))return null;
        heritageOrders=developmentAIOrders(obs);const committedFaith=heritageOrders.reduce((n,a)=>n+(a.hint?.faithCost||0),0);return this.execute(p,{...obs,player:{...obs.player,committedFaith}});
      }).then(response=>{
        if(!response)return;
        if(this.disposed||generation!==this.generation||p.manual||!p.alive||file!==p.driver.file||planRevision!==(p.planRevision||0))return;
        p.driver.calls++;p.driver.lastMs=response.ms;p.driver.status='ready';p.driver.message=response.stderr;p.memory=response.memory;this.enqueue(p,response.orders);this.enqueue(p,heritageOrders);
      }).catch(error=>{if(this.disposed||generation!==this.generation)return;p.driver.calls++;p.driver.failures++;p.driver.status='error';p.driver.message=error.message.slice(0,1500);if(p.driver.failures<=3)event(this.game,'driver',`${p.short} 驱动执行失败：${p.driver.message}`,p.id);this.onChange();}).finally(()=>{this.jobs.delete(p.id);});
      this.jobs.set(p.id,job);started.push(job);this.stats.peakDrivers=Math.max(this.stats.peakDrivers,this.jobs.size);
    }
    if(force)await Promise.all(started);
  }
  state(view=-1){const r=this.game.realtime;return {mode:'realtime',running:this.running,rate:this.rate,time:r.time,nextEconomy:r.nextEconomy,period:r.period,players:this.game.players.filter(p=>view<0||p.id===view).map(p=>({id:p.id,planning:this.jobs.has(p.id),queued:r.queues[p.id]?.length||0,active:this.game.units.filter(u=>u.owner===p.id&&u.activity).length}))};}
}
