import {UNITS,unitUpkeep,dist} from './rules.mjs';
import {gameRandom} from './world.mjs';
import {operationalWonder} from './heritage.mjs';
const money=n=>Math.round(n*100)/100;
export function productionUpkeep(g,p,type){return unitUpkeep(type,p).total*(UNITS[type]?.domain==='sea'&&!UNITS[type]?.civilian&&operationalWonder(g,'venetian_arsenal',p.id)?2:1);}
export function militaryCosts(g,p){
 const units=g.units.filter(u=>u.owner===p.id&&u.hp>0),costs=units.map(u=>unitUpkeep(u.type,p));
 return {salary:money(costs.reduce((n,c)=>n+c.salary,0)),maintenance:money(costs.reduce((n,c)=>n+c.maintenance,0)),upkeep:money(costs.reduce((n,c)=>n+c.total,0)),paidUnits:costs.filter(c=>c.total>0).length};
}
// Existing, active and queued commitments are counted once per city/unit identity.
export function militaryCommitments(g,p){
 const cities=new Map(g.cities.filter(c=>c.owner===p.id).map(c=>[c.id,c.production?.item])),refits=new Map();
 for(const u of g.units.filter(u=>u.owner===p.id&&u.hp>0))if(u.activity?.action.type==='upgrade')refits.set(u.id,u.activity.action.item);
 for(const q of g.realtime?.queues?.[p.id]||[]){const a=q.action;if(['produce','purchase'].includes(a.type)&&cities.has(a.city))cities.set(a.city,a.item);if(a.type==='upgrade')refits.set(a.unit,a.item);}
 let upkeep=militaryCosts(g,p).upkeep+(g.heritage?.pendingGrants||[]).filter(v=>v.owner===p.id&&g.cities.some(c=>c.id===v.city&&c.owner===p.id)).reduce((n,v)=>n+unitUpkeep(v.type,p).total,0);const cityCommitments=[...cities].map(([id,item])=>({id,item:item??null,upkeep:productionUpkeep(g,p,item)}));for(const city of cityCommitments)upkeep+=city.upkeep;
 for(const [id,item]of refits){const u=g.units.find(u=>u.id===id&&u.owner===p.id&&u.hp>0);if(u)upkeep+=Math.max(0,unitUpkeep(item,p).total-unitUpkeep(u.type,p).total);}
 return {projectedUpkeep:money(upkeep),cityCommitments};
}
export function committedMilitaryUpkeep(g,p){return militaryCommitments(g,p).projectedUpkeep;}
export function militaryFinance(g,p,yields){const costs=militaryCosts(g,p),commitments=militaryCommitments(g,p);return {...costs,...commitments,grossGold:yields.grossGold,domesticGold:Math.min(yields.grossGold,yields.domesticGold??yields.grossGold),netGold:yields.gold,projectedNet:money(yields.grossGold-commitments.projectedUpkeep),arrears:p.militaryArrears||0,unpaidPeriods:p.unpaidPeriods||0,reserve:money(commitments.projectedUpkeep*3+(p.militaryArrears||0))};}
export function settleMilitaryPay(g,p,yields,{event,visual,unlink}){
 const upkeep=yields.militaryUpkeep,available=money(Math.max(0,p.gold+yields.grossGold)),shortfall=money(Math.max(0,upkeep-available)),surplus=money(Math.max(0,available-upkeep));
 const oldDebt=p.militaryArrears||0,repayment=Math.min(oldDebt,surplus);
 p.gold=money(surplus-repayment);p.militaryArrears=money(oldDebt-repayment+shortfall);
 p.unpaidPeriods=shortfall>.01?(p.unpaidPeriods||0)+1:0;
 if(shortfall<=.01)return;
 event(g,'military',`${p.short} 军费不足：本周期欠饷 ${shortfall} 金币，累计 ${p.militaryArrears}，连续欠饷 ${p.unpaidPeriods} 周期。`,p.id);
 if(p.unpaidPeriods<2)return;
 const candidates=g.units.filter(u=>u.owner===p.id&&u.hp>0&&unitUpkeep(u.type,p).total>0),cities=g.cities.filter(c=>c.owner===p.id),visible=new Set(p.visible);
 const value=u=>{const spec=UNITS[u.type],t=g.map.tiles[u.tile],defending=cities.some(c=>dist(t,g.map.tiles[c.tile],g.map)<=3)&&g.units.some(e=>e.hp>0&&!UNITS[e.type].civilian&&e.owner!==p.id&&(e.owner<0||p.relations[e.owner]?.status==='war')&&visible.has(e.tile)&&dist(t,g.map.tiles[e.tile],g.map)<=4);return (defending?10000:0)+Math.max(spec.strength,spec.ranged||0)*.8+(u.xp||0)*.3-unitUpkeep(u.type,p).total*18;};
 candidates.sort((a,b)=>value(a)-value(b)||a.id-b.id);const cap=Math.min(3,Math.max(1,Math.ceil(candidates.length*.1))),removed=new Set();let relief=0;
 for(const u of candidates.slice(0,cap)){
  const cost=unitUpkeep(u.type,p).total,old={...u},spec=UNITS[u.type],rebel=p.unpaidPeriods>=4&&u.linkedUnit===undefined&&!spec.civilian&&(spec.domain||'land')==='land'&&!spec.ranged&&u.type!=='scout'&&gameRandom(g)<Math.min(.6,.25+p.militaryArrears/Math.max(1,upkeep)*.05);
  unlink(g,u);delete u.activity;delete u.airPatrolCity;removed.add(u.id);
  if(rebel){u.owner=-1;u.mutiny=true;u.fortified=false;u.acted=true;u.moves=0;u.cooldownUntil=(g.realtime?.time??g.turn*20)+5;visual(g,'work',old,{action:'mutiny'});event(g,'military',`${p.short} 的 ${spec.name} 因长期欠饷叛变为叛军。`,p.id,u.tile);}
  else{g.units=g.units.filter(v=>v!==u);visual(g,'work',old,{action:'disband',retired:true});event(g,'military',`${p.short} 的 ${spec.name} 因欠饷遣散，每周期减支 ${cost} 金币。`,p.id,u.tile);}
  relief+=cost;if(relief>=shortfall)break;
 }
 if(g.realtime)for(const [owner,queue]of Object.entries(g.realtime.queues))g.realtime.queues[owner]=queue.filter(q=>!removed.has(q.action.unit)&&!(removed.has(q.action.targetUnit)&&(!g.units.some(u=>u.id===q.action.targetUnit)||['heal','linkUnits','unlinkUnits','trainVeteran'].includes(q.action.type))));
}
