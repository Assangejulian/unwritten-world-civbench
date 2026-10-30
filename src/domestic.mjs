import {governorLoyalty,governorHas} from './governors.mjs';
import {operationalWonder} from './heritage.mjs';
import {nationalEffects} from './rules.mjs';
import {hasBuilding} from './unique-content.mjs';
import {UNITS,dist,isWater} from './rules.mjs';

const hostile=(p,id)=>id===-1||p.relations[id]?.status==='war';
const timeOf=g=>g.realtime?.time??g.turn*20;
// Public wars and recent public incidents are signals, not access to hidden armies.
export function regionalThreat(g,p){
 const cities=g.cities.filter(c=>c.owner===p.id),visible=new Set(p.visible),time=timeOf(g),met=new Set(p.met);
 const potential=id=>id>=0&&id!==p.id&&met.has(id)&&p.relations[id]?.status!=='alliance'&&(p.relations[id]?.truceUntil||0)<=time;
 const known=Object.values(p.knownCities||{}),troops=g.units.filter(u=>u.hp>0&&visible.has(u.tile)&&potential(u.owner)&&!UNITS[u.type].civilian&&!UNITS[u.type].navalOnly);
 const near=(a,b)=>dist(g.map.tiles[a],g.map.tiles[b],g.map),power=u=>Math.max(UNITS[u.type].ranged||0,UNITS[u.type].strength||0)*u.hp/(UNITS[u.type].maxHp||100);
 const ourPower=g.units.filter(u=>u.owner===p.id&&u.hp>0&&!UNITS[u.type].civilian&&!UNITS[u.type].siege&&!UNITS[u.type].airOnly&&u.type!=='scout'&&(UNITS[u.type].domain||'land')==='land'&&!isWater(g.map.tiles[u.tile])).reduce((sum,u)=>sum+power(u),0);
 const signals=[];
 for(const attacker of p.met){if(!potential(attacker))continue;
  for(const victim of p.met){if(victim===attacker||victim===p.id||g.players[attacker]?.relations[victim]?.status!=='war')continue;
   const incidents=(g.diplomacy?.agendas||[]).filter(a=>a.attacker===attacker&&a.defender===victim&&time>=a.createdAt&&time-a.createdAt<800&&p.knownCities?.[a.city]);
   for(const city of known.filter(c=>c.owner===victim&&g.map.tiles[c.tile])){
    const home=cities.map(c=>({city:c,distance:near(c.tile,city.tile)})).sort((a,b)=>a.distance-b.distance||a.city.id-b.city.id)[0];if(!home||home.distance>14)continue;
    const force=troops.filter(u=>u.owner===attacker&&near(u.tile,city.tile)<=5),foreignPower=force.reduce((sum,u)=>sum+power(u),0);
    const incident=incidents.filter(a=>a.city===city.id).reduce((max,a)=>Math.max(max,.5*(1-(time-a.createdAt)/800)),0);
    const live=visible.has(city.tile)?g.cities.find(c=>c.id===city.id&&c.owner===victim):null;
    const damage=live?Math.min(.2,Math.max(0,(200-live.hp)/200)*.2):0;
    const proximity=home.distance<=8?1:1-(home.distance-8)*.06;
    const strength=foreignPower?Math.min(.25,foreignPower/Math.max(30,ourPower)*.12):0;
    const risk=Math.min(1,(.2+incident+damage+strength)*proximity);
    signals.push({attacker,victim,city:city.id,frontierCity:home.city.id,risk});
   }
  }
 }
 // A visible occupied city is direct evidence of a recent nearby conquest.
 for(const c of g.cities)if(visible.has(c.tile)&&potential(c.owner)&&c.occupation>0){
  const home=cities.map(home=>({city:home,distance:near(home.tile,c.tile)})).sort((a,b)=>a.distance-b.distance||a.city.id-b.city.id)[0];
  if(home&&home.distance<=12)signals.push({attacker:c.owner,city:c.id,frontierCity:home.city.id,risk:.65*(home.distance<=8?1:.8)});
 }
 // Multiple cities attacked by the same country are one regional threat.
 const byAttacker=new Map();for(const s of signals)if(s.risk>(byAttacker.get(s.attacker)?.risk??-1))byAttacker.set(s.attacker,s);
 const threats=[...byAttacker.values()].sort((a,b)=>b.risk-a.risk||a.attacker-b.attacker),top=threats[0];
 return {risk:Math.round(Math.min(1,(top?.risk||0)+Math.max(0,threats.length-1)*.05)*100)/100,frontierCity:top?.frontierCity??null,threats};
}
export function domesticSituation(g,p,defenses=new Map(),plan={}){
 const visible=new Set(p.visible),army=g.units.filter(u=>u.owner===p.id&&u.hp>0&&!UNITS[u.type].civilian);
 const invaders=g.units.filter(u=>u.hp>0&&u.owner!==p.id&&hostile(p,u.owner)&&visible.has(u.tile)&&!UNITS[u.type].civilian&&g.map.tiles[u.tile].owner===p.id);
 const cities=g.cities.filter(c=>c.owner===p.id),attacked=cities.filter(c=>c.lastAttackedAt!==undefined&&timeOf(g)-c.lastAttackedAt<60);
 const invaded=invaders.length>0||attacked.length>0;
 const threatened=cities.filter(c=>attacked.includes(c)||(defenses.get(c.id)?.urgency||0)>=.4);
 const threatIds=new Set([...defenses.values()].flatMap(d=>d.threats||[]));
 const power=u=>Math.max(5,UNITS[u.type].strength||0,UNITS[u.type].ranged||0)*u.hp/100;
 // One raiding force may threaten several cities; count its strength only once.
 const localThreatPower=g.units.filter(u=>threatIds.has(u.id)).reduce((n,u)=>n+power(u),0);
 const shortfall=Math.min(localThreatPower*1.15,[...defenses.values()].reduce((n,d)=>n+d.shortfall,0));
 const pending=cities.filter(c=>UNITS[c.production?.item]&&!UNITS[c.production.item].civilian).length;
 const war=Object.values(p.relations).some(r=>r.status==='war');
 // A small standing guard is independent of aggression and victory preference.
 // Potential foreign pressure uses remembered cities and visible troops only.
 const potential=owner=>owner>=0&&owner!==p.id&&p.met.includes(owner)&&p.relations[owner]?.status!=='alliance'&&(p.relations[owner]?.truceUntil||0)<=timeOf(g);
 const borderCities=Object.values(p.knownCities||{}).filter(c=>potential(c.owner));
 const exposed=cities.some(c=>borderCities.some(other=>g.map.tiles[other.tile]&&dist(g.map.tiles[c.tile],g.map.tiles[other.tile],g.map)<=10));
 const buildup=g.units.filter(u=>u.hp>0&&potential(u.owner)&&visible.has(u.tile)&&!UNITS[u.type].civilian&&cities.some(c=>dist(g.map.tiles[c.tile],g.map.tiles[u.tile],g.map)<=8)).length;
 const regional=regionalThreat(g,p),preparation=Math.max(exposed||buildup>=3?1:0,regional.risk>=.5?2:0);
 const reserveRole=type=>{const spec=UNITS[type];return !!spec&&!spec.civilian&&(spec.domain||'land')==='land'&&!spec.siege&&!spec.airOnly&&type!=='scout';};
 const reserveReady=army.filter(u=>reserveRole(u.type)&&!isWater(g.map.tiles[u.tile])).reduce((n,u)=>n+u.hp/(UNITS[u.type].maxHp||100),0);
 const reservePending=cities.filter(c=>reserveRole(c.production?.item)).length;
 const baseReserve=Math.min(6,1+Math.ceil(cities.length*.65)+(exposed||buildup>=3?1:0));
 const reserveTarget=cities.length?Math.min(8,baseReserve+(regional.risk>=.5?Math.ceil(regional.risk*3):0)):0;
 const typicalPower=army.length?army.reduce((n,u)=>n+Math.max(5,UNITS[u.type].strength||0,UNITS[u.type].ranged||0),0)/army.length:30;
 const enemyPower=g.units.filter(u=>u.hp>0&&visible.has(u.tile)&&!UNITS[u.type].civilian&&(p.relations[u.owner]?.status==='war'||threatIds.has(u.id))).reduce((n,u)=>n+power(u),0);
 const target=Math.ceil(Math.max(cities.length*((plan.goal||p.strategy)==='domination'?2.4:1.8)+2+(war?Math.ceil(cities.length*.3):0),Math.ceil(Math.max(shortfall,enemyPower*1.3)/typicalPower)+cities.length));
 const ready=army.reduce((n,u)=>n+u.hp/100,0);
 const shortage=Math.max(0,(target-ready-pending)/Math.max(1,target));
 const recovery=Math.max(0,Math.min(1,((p.defensePreparationUntil||0)-timeOf(g))/400));
 return {invaded,invaders,attacked,threatened,shortfall,shortage,recovery,army:army.length,ready,pending,target,reserveTarget,reserveReady,reservePending,preparation,regional};
}
export function localRecruitment(g,c,situation){
 const center=g.map.tiles[c.tile];
 const distance=situation.threatened.length?Math.min(...situation.threatened.map(o=>dist(center,g.map.tiles[o.tile],g.map))):99;
 return Math.min(1,(distance===0?.8:Math.max(0,1-distance/10)*.55)*situation.shortage+situation.recovery*situation.shortage*.6);
}
export function operationalFortress(g,c,id){
 const t=g.map.tiles[id];return !!t&&t.owner===c.owner&&t.fort?.owner===c.owner&&t.fort.hp>0&&!t.pillaged&&t.territoryCity===c.id&&!isWater(t);
}
// Compare all cities from one population/ownership snapshot, independent of turn order.
export function citizenPressures(g){
 const result=new Map();
 for(const c of g.cities){const totals=new Map(),sources=[];
  for(const other of g.cities){if(!g.players[other.owner]?.alive)continue;const d=dist(g.map.tiles[c.tile],g.map.tiles[other.tile],g.map);if(d>9)continue;
   const pressure=(other.owner!==c.owner&&governorHas(g,other,'gov_curator','bb')?1.5:1)*other.population*(1-d*.1)*(other.isCapital&&other.originalOwner===other.owner?1.25:1)*(d<=6&&operationalWonder(g,'forbidden',other.owner)&&g.wonders.forbidden.city===other.id?1.25:1);totals.set(other.owner,(totals.get(other.owner)||0)+pressure);
   if(other.owner!==c.owner)sources.push({city:other.id,owner:other.owner,name:other.name,pressure});
  }
  const foreign=[...totals].filter(([id])=>id!==c.owner).sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0],own=totals.get(c.owner)||0;
  sources.sort((a,b)=>b.pressure-a.pressure||a.city-b.city);
  result.set(c.id,{own,foreign:foreign?.[1]||0,foreignOwner:foreign?.[0]??null,foreignPressures:[...totals].filter(([owner])=>owner!==c.owner).map(([owner,pressure])=>({owner,pressure})),source:sources[0]||null});
 }
 return result;
}
export function loyaltyStatus(g,c,y,pressure){
 const p=g.players[c.owner],garrison=g.units.some(u=>u.owner===c.owner&&u.hp>0&&u.tile===c.tile&&!UNITS[u.type].civilian&&!isWater(g.map.tiles[u.tile]));
 let population=Math.max(-20,Math.min(20,20*(pressure.own-pressure.foreign)/Math.max(1,pressure.own,pressure.foreign)));
 const effects=nationalEffects(p,timeOf(g));if(population<0&&effects.foreignPressureReduction&&(garrison||g.routes.some(r=>r.owner===p.id&&r.from===c.id&&g.cities.some(o=>o.id===r.to&&o.owner===p.id))))population*=1-effects.foreignPressureReduction;
 const amenities=Math.max(-4,Math.min(3,y.amenities||0))*1.5;
 const uniqueGarrison=Math.max(0,...g.units.filter(u=>u.owner===c.owner&&u.hp>0&&u.tile===c.tile&&!isWater(g.map.tiles[u.tile])).map(u=>UNITS[u.type].garrisonLoyalty||0));
 const domestic=governorLoyalty(g,c)+(y.religionLoyalty||0)+uniqueGarrison+(garrison?2:0)+(hasBuilding(c,'monument')?1:0)+(c.isCapital&&c.originalOwner===c.owner?3:0)+amenities-(c.occupation>0?5:0)-(effects.cityWearinessImmunity?0:Math.min(3,(p.warWeariness||0)/20));
 return {...pressure,population:Math.round(population*10)/10,domestic:Math.round(domestic*10)/10,change:Math.round((population+domestic)*10)/10,garrison};
}
export function loyaltyView(g,c,view){
 const state=c.loyaltyStatus;if(!state)return null;
 // Foreign city pressure is an aggregate, not permission to reveal hidden cities.
 if(view>=0&&c.owner!==view)return null;
 const source=state.source,record=source&&g.players[view]?.knownCities?.[source.city],knownSource=view<0?source:record?{...source,name:g.players[view].visible.includes(record.tile)?source.name:record.name||'已知城市',owner:record.owner}:source?{name:'未知城市',pressure:source.pressure}:null;
 return {...state,foreignPressures:(state.foreignPressures||[]).map(x=>({...x,owner:view<0||g.players[view]?.met.includes(x.owner)?x.owner:null})),foreignOwner:view<0||g.players[view]?.met.includes(state.foreignOwner)?state.foreignOwner:null,source:knownSource};
}
