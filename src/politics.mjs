import {GOVERNMENTS,POLICIES,UNITS,unitUpkeep,governmentSlots,assignPolicyCards,civilizationEra,leaderFor,dist} from './rules.mjs';

export const POLITICAL_LIMITS={governmentPeriods:12,policyReviewPeriods:3};
export function initializePolitics(g,p){
  if(p.politics!==undefined)return;
  const fitted=assignPolicyCards(g,p,p.policies.filter(k=>POLICIES[k]&&p.civics.includes(POLICIES[k].civic)));
  p.policies=fitted.slots.map(s=>s.card).filter(Boolean);
  p.politics={version:1,freeTurn:g.turn,usedFreeTurn:-1,lastGovernmentTurn:g.turn-12,lastPolicyTurn:g.turn-3};
}
export function politicalStatus(g,p,government=p.government){
  const state=p.politics||{},free=state.freeTurn===g.turn&&state.usedFreeTurn!==g.turn,change=government!==p.government;
  const cities=g.cities.filter(c=>c.owner===p.id).length,era=civilizationEra(p);
  return {free,cost:free?0:Math.round((change?40:20)+era*(change?12:8)+cities*(change?4:3)),governmentCost:free?0:40+era*12+cities*4,governmentReadyTurn:(state.lastGovernmentTurn??g.turn-12)+12,slots:governmentSlots(g,p,government),lastPolicyTurn:state.lastPolicyTurn??-3};
}
export function changePolitics(g,p,action,event){
  initializePolitics(g,p);const government=action.type==='government'?action.item:p.government,spec=GOVERNMENTS[government];
  if(!Object.hasOwn(GOVERNMENTS,government)||spec.civic&&!p.civics.includes(spec.civic))throw Error('政府尚未解锁。');
  const items=action.items??assignPolicyCards(g,p,p.policies,government).slots.map(s=>s.card).filter(Boolean);
  if(!Array.isArray(items)||items.length>governmentSlots(g,p,government).length||new Set(items).size!==items.length||items.some(k=>!POLICIES[k]||!p.civics.includes(POLICIES[k].civic))||assignPolicyCards(g,p,items,government).remaining.length)throw Error('政策卡类型与槽位不匹配，或政策尚未解锁。');
  const changed=government!==p.government,identical=!changed&&items.length===p.policies.length&&items.every(k=>p.policies.includes(k));if(identical)return;
  const status=politicalStatus(g,p,government);if(changed&&g.turn<status.governmentReadyTurn)throw Error(`政体尚在稳定期，第 ${status.governmentReadyTurn} 周期可再次调整。`);
  if(action.expectedCost!==undefined&&action.expectedCost!==status.cost)throw Error('调整费用已随周期变化，请刷新政策面板后重新提交。');
  if(p.gold<status.cost)throw Error(`调整政策需要 ${status.cost} 金币。`);
  p.gold-=status.cost;p.government=government;p.policies=items.slice();p.politics.lastPolicyTurn=g.turn;if(changed)p.politics.lastGovernmentTurn=g.turn;if(status.free)p.politics.usedFreeTurn=g.turn;
  p.planRevision=(p.planRevision||0)+1;
  event(g,'culture',`${p.short} ${changed?'采用 '+spec.name+' 并':''}调整政策：${items.map(k=>POLICIES[k].name).join('、')||'空槽'}（${status.free?'新市政免费调整':status.cost+' 金币'}）。`,p.id);
}
export function politicsContext(g,p,plan,yields){
  const cities=g.cities.filter(c=>c.owner===p.id),units=g.units.filter(u=>u.owner===p.id),visible=new Set(p.visible),war=Object.values(p.relations).some(r=>r.status==='war');
  const barbarian=g.units.some(u=>u.owner===-1&&visible.has(u.tile)&&cities.some(c=>dist(g.map.tiles[u.tile],g.map.tiles[c.tile],g.map)<=5));
  const frontline=g.units.some(u=>u.owner!==p.id&&u.owner>=0&&p.relations[u.owner]?.status==='war'&&visible.has(u.tile)&&cities.some(c=>dist(g.map.tiles[u.tile],g.map.tiles[c.tile],g.map)<=4));
  const weights={science:1,culture:1,gold:1,faith:.8,production:1.5,food:1};
  const goals={science:'science',culture:'culture',gold:'gold',faith:'faith',industry:'production',growth:'food',domination:'production'};
  weights[goals[plan.goal]||goals[p.focus]||'production']+=1.4;
  for(const [k,n]of Object.entries(leaderFor(p).effects||{}))if(k in weights)weights[k]+=Math.min(.8,Math.abs(n));
  if(yields.gold<0||p.gold<40)weights.gold+=2;
  if(cities.reduce((n,c)=>n+c.population*2,0)>yields.food)weights.food+=2;
  const pending=key=>cities.filter(c=>c.production?.item===key).length;
  return {cities,units,routes:g.routes.filter(r=>r.owner===p.id).length,war,barbarian,frontline,weights,yields,pending,goal:plan.goal};
}
export function policyUtility(key,ctx){
  const spec=POLICIES[key],n=ctx.cities.length,w=ctx.weights;let value=3;
  for(const [k,a]of Object.entries(spec.effects||{}))value+=a*(w[k]||1)*n;
  const extras={urban:2*w.production*n,agriculture:2*w.food*n,revelation:2*w.faith*n,discipline:ctx.barbarian?65:1,bastions:ctx.frontline?45:ctx.war?18:1,conscription:ctx.units.reduce((n,u)=>n+unitUpkeep(u.type).total*.5,0)*w.gold*6,colonization:ctx.pending('settler')*22+(!ctx.war&&ctx.goal==='growth'?12:0),craftsmen:ctx.pending('builder')*22,serfdom:ctx.pending('builder')*26,natural:ctx.cities.reduce((s,c)=>s+c.districts.filter(d=>d.item==='campus').length,0)*6*w.science,caravans:w.gold*ctx.routes*3,specialists:ctx.cities.reduce((s,c)=>s+c.districts.length,0)*(w.science+w.culture),capitalism:Math.max(0,ctx.yields.gold)*.25*w.gold,rationalism:ctx.yields.science*.25*w.science,heritage:ctx.goal==='culture'?40:7};
  value+=extras[key]||0;if(spec.productionMilitary)value+=(ctx.war||ctx.barbarian?36:4)*spec.productionMilitary/.2;
  if(key==='grandarmy')value+=ctx.war||ctx.barbarian?52:4;
  if(spec.congressVotes)value+=ctx.war?15:10;return value;
}
function bestCards(g,p,government,ctx){const available=Object.keys(POLICIES).filter(k=>p.civics.includes(POLICIES[k].civic)).sort((a,b)=>policyUtility(b,ctx)-policyUtility(a,ctx)||a.localeCompare(b)),used=new Set(),items=[];for(const type of governmentSlots(g,p,government)){const card=available.find(k=>!used.has(k)&&(type==='wildcard'||POLICIES[k].type===type));if(card){used.add(card);items.push(card);}}return items;}
function governmentUtility(g,p,key,ctx,items){const spec=GOVERNMENTS[key],w=ctx.weights;let score=governmentSlots(g,p,key).length*18;for(const k of ['science','culture','gold','faith','production'])score+=(spec[k]||0)*w[k]*70;score+=(spec.combat||0)*(ctx.war?7:2);if(key==='republic')score+=ctx.cities.length*2;return score+items.reduce((s,k)=>s+policyUtility(k,ctx),0);}
export function politicalActions(g,p,ctx){
  initializePolitics(g,p);const result=[],current=governmentUtility(g,p,p.government,ctx,p.policies),status=politicalStatus(g,p),review=status.free||g.turn-status.lastPolicyTurn>=3;
  if(!review)return result;
  for(const [key,spec]of Object.entries(GOVERNMENTS)){
    if(spec.civic&&!p.civics.includes(spec.civic)||key!==p.government&&g.turn<status.governmentReadyTurn)continue;
    const items=bestCards(g,p,key,ctx),next=politicalStatus(g,p,key),gain=governmentUtility(g,p,key,ctx,items)-current,changed=key!==p.government;
    if(!changed&&items.length===p.policies.length&&items.every(k=>p.policies.includes(k)))continue;
    const threshold=(changed?18:6)+(next.free?0:next.cost*.3);if(gain<threshold||p.gold<next.cost)continue;
    result.push({type:changed?'government':'policies',...(changed?{item:key}:{}),items,hint:{slots:next.slots.length,goldCost:next.cost,free:next.free,netBenefit:gain-threshold,reason:ctx.barbarian?'barbarian defense':ctx.frontline?'border defense':ctx.war?'war mobilization':ctx.yields.gold<0?'treasury recovery':'national development'}});
  }
  return result;
}
export function validatePolitics(g){for(const p of g.players){const s=p.politics;if(s===undefined)continue;if(!Object.hasOwn(GOVERNMENTS,p.government)||!s||s.version!==1||['freeTurn','usedFreeTurn','lastGovernmentTurn','lastPolicyTurn'].some(k=>!Number.isInteger(s[k])||s[k]<-12||s[k]>g.turn)||new Set(p.policies).size!==p.policies.length||p.policies.some(k=>!POLICIES[k]||!p.civics.includes(POLICIES[k].civic))||assignPolicyCards(g,p,p.policies).remaining.length)throw Error('Invalid political policy state.');}}
