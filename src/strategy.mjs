import {unitDetected} from './movement-rules.mjs';
import {CIVS,dist,isWater,canonicalTileKey,DIRECTIONS,RESOURCES,UNITS,TECHS,GOVERNMENTS,NATIONAL_POLICIES,NATIONAL_STRATEGIES,leaderFor,nationalEffects,gamePace} from './rules.mjs';

import {geopoliticalContext,geopoliticalPressure} from './geopolitics.mjs';
import {personality} from './ai.mjs';

const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const cache=new WeakMap();
const landRoutes=new WeakMap();
export function developmentPlan(g,p){
  let players=cache.get(g);if(!players){players=new Map();cache.set(g,players);}
  const time=g.realtime?.time??g.turn*20,cities=g.cities.filter(c=>c.owner===p.id),key=JSON.stringify([g.settings?.aiAlgorithm,p.leaderRulesVersion,p.driver?.file,g.turn,p.planRevision||0,p.leaderKey,p.strategy,p.doctrine,p.government,p.policies,p.techs.length,p.civics.length,p.explored.length,cities.map(c=>[c.id,c.population]),p.spaceStage,p.religion,(p.leaderAbility?.activeUntil||0)>time]);
  if(players.get(p.id)?.key===key)return players.get(p.id).value;
  const known=p.explored.map(id=>p.knownTiles?.[id]).filter(Boolean),land=known.filter(t=>!isWater(t)),owned=known.filter(t=>t.owner===p.id),coastal=cities.filter(c=>known.some(t=>isWater(t)&&dist(t,g.map.tiles[c.tile],g.map)<=1)).length;
  const weights={science:1,culture:1,growth:1,commerce:1,industry:1,faith:.65,aggression:.5,naval:.2};
  const driverFocus=p.leaderRulesVersion===2?(CIVS.find(c=>c.file===p.driver?.file)?.focus||p.focus):p.focus;
  const focus={science:'science',military:'aggression',growth:'growth',gold:'commerce',culture:'culture',naval:'naval',faith:'faith',industry:'industry'}[driverFocus];weights[focus]+=1.1;
  weights.naval+=Math.min(1.2,coastal*.35+known.filter(isWater).length/Math.max(1,known.length)*.7);
  weights.industry+=Math.min(.5,owned.filter(t=>t.hill||t.improvement==='mine').length/Math.max(1,owned.length));
  weights.science+=Math.min(.45,land.filter(t=>t.terrain==='mountain').length/Math.max(1,land.length)*3);
  weights.commerce+=Math.min(.4,owned.filter(t=>RESOURCES[t.resource]?.category==='luxury').length*.07);
  weights.growth+=cities.length<3?.5:0;weights.science+=p.spaceStage*.35;if(p.spaceStage>=2)weights.science+=1;if(p.tourism>=(gamePace(g).legacy?1500:4000)*gamePace(g).factor*.65)weights.culture+=1;
  weights.aggression+=Math.min(1,cities.filter(c=>c.isCapital&&c.originalOwner!==p.id).length*.5);
  if(p.religion&&Object.values(p.knownCities||{}).some(c=>c.owner!==p.id&&c.religion===p.id))weights.faith+=.4;
  if(p.religion)weights.faith+=.35;
  for(const [k,n]of Object.entries(leaderFor(p).weights||{}))weights[k]+=n;
  const nation=NATIONAL_POLICIES[p.doctrine||'balanced'];for(const [k,n]of Object.entries(nation?.weights||{}))weights[k]+=n;
  const selected=NATIONAL_STRATEGIES[p.strategy||'adaptive'];for(const [k,n]of Object.entries(selected?.weights||{}))weights[k]+=n;
  const bonuses=nationalEffects(p,time),government=GOVERNMENTS[p.government]||{};for(const [effect,weight]of Object.entries({science:'science',culture:'culture',food:'growth',gold:'commerce',production:'industry',faith:'faith',tourism:'culture',militaryProduction:'aggression',navalProduction:'naval'}))weights[weight]+=((bonuses[effect]||0)+(government[effect]||0))*.6;
  for(const [policy,weight]of Object.entries({rationalism:'science',natural:'science',heritage:'culture',capitalism:'commerce',caravans:'commerce',colonization:'growth',grandarmy:'aggression',revelation:'faith',urban:'industry'}))if(p.policies.includes(policy))weights[weight]+=.15;
  // Unified personality: multiplicative economic biases and an aggression offset (seeded, reproducible).
  const pers=personality(g,p);if(pers){for(const [k,w]of Object.entries({science:'science',culture:'culture',growth:'growth',gold:'commerce',industry:'industry',faith:'faith',naval:'naval'}))weights[w]*=pers[k];weights.aggression=weights.aggression*pers.aggression+(pers.aggression-1)*.6;}
  const context=geopoliticalContext(g,p,{cached:true}),frontierThreat=Math.max(0,...p.met.filter(id=>g.players[id]?.alive).map(id=>{const r=p.relations[id],geo=geopoliticalPressure(g,p,g.players[id],context);return geo.borderPressure+geo.militaryPressure+(r?.status==='war'?30:0);}));
  const readiness=g.units.filter(u=>u.owner===p.id&&!UNITS[u.type].civilian).reduce((n,u)=>n+u.hp/100,0);
  // Temporary danger changes tactical spending, not the nation's victory objective.
  const victoryWeights={...weights};
  if(pers&&p.aiState?.alert!==undefined?p.aiState.alert:frontierThreat>35){weights.industry+=Math.min(.65,frontierThreat/100);weights.aggression+=Math.min(.8,frontierThreat/90);weights.growth-=.2;}
  const directed={science:'science',domination:'aggression',culture:'culture',religion:'faith',economy:'commerce',naval:'naval'}[p.strategy];if(directed){for(const k of Object.keys(weights))if(k!==directed)weights[k]=Math.min(weights[k],2.1);weights[directed]=Math.max(3.5,weights[directed]);}
  for(const k of Object.keys(weights))weights[k]=Number(clamp(weights[k],.1,3.5).toFixed(2));
  const goal=p.strategy&&p.strategy!=='adaptive'?p.strategy:p.spaceStage>0?'science':Object.entries(victoryWeights).filter(([k])=>!['growth','industry'].includes(k)).sort((a,b)=>b[1]-a[1])[0][0];
  const victoryGoal={aggression:'domination',commerce:'economy',faith:'religion',science:'science',culture:'culture'}[goal]||goal;
  const committed=pers&&!(p.strategy&&p.strategy!=='adaptive')&&p.aiState?.goal?p.aiState.goal:victoryGoal;
  const value={goal:committed,rawGoal:victoryGoal,weights,frontierThreat:Math.round(frontierThreat),readiness:Math.round(readiness),coastalCities:coastal,knownTiles:known.length,maxCities:Math.min(12,4+Math.floor(g.turn/35)+(weights.growth>1.7?2:0)+(pers?Math.round((pers.expansion-1)*3):0)),leader:leaderFor(p).key,doctrine:p.doctrine||'balanced',strategy:p.strategy||'adaptive'};
  players.set(p.id,{key,value});return value;
}

export function militaryAssessment(g,p,other,strength){
  const ours=g.units.filter(u=>u.owner===p.id&&!UNITS[u.type].civilian),visible=new Set(p.visible),spotted=g.units.filter(u=>u.owner===other.id&&(visible.has(u.tile)&&unitDetected(g,u,p.id))&&!UNITS[u.type].civilian);
  const knownCities=Object.values(p.knownCities||{}).filter(c=>c.owner===other.id),bases=g.cities.filter(c=>c.owner===p.id).map(c=>g.map.tiles[c.tile]);
  let nearest=60,landTarget=false;
  let routes=landRoutes.get(g);if(!routes){routes=new Map();landRoutes.set(g,routes);}
  const routeKey=[g.turn,p.explored.length,p.planRevision||0,p.techs.length,bases.map(t=>t.id).join(',')].join(':');let reach=routes.get(p.id);
  if(reach?.key!==routeKey){
    const known=new Map(Object.values(p.knownTiles||{}).map(t=>[`${t.q},${t.r}`,t]));
    const connected=sea=>{const reached=new Set(bases.map(t=>t.id)),queue=[...bases];for(let i=0;i<queue.length;i++)for(const [dq,dr]of DIRECTIONS){const t=known.get(canonicalTileKey(queue[i].q+dq,queue[i].r+dr,g.map));if(t&&t.terrain!=='mountain'&&(!isWater(t)||sea&&p.techs.includes('sailing')&&(t.terrain!=='ocean'||p.techs.includes('celestial')))&&!reached.has(t.id)){reached.add(t.id);queue.push(t);}}return reached;};
    reach={key:routeKey,reached:connected(false),seaReached:connected(true)};routes.set(p.id,reach);
  }
  let seaTarget=false;for(const c of knownCities)for(const from of bases){const t=p.knownTiles?.[c.tile];if(!t)continue;const d=dist(from,t,g.map);if(d<nearest){nearest=d;landTarget=reach.reached.has(t.id);seaTarget=reach.seaReached.has(t.id);}}
  const local=ours.filter(u=>knownCities.some(c=>dist(g.map.tiles[u.tile],g.map.tiles[c.tile],g.map)<=12));
  const ourPower=ours.reduce((s,u)=>s+strength(u)*(u.hp/100),0),observedPower=spotted.reduce((s,u)=>s+strength(u)*(u.hp/100),0);
  // Missing enemy units are uncertain, not zero. No hidden strength is read.
  const visibleCities=knownCities.filter(c=>visible.has(c.tile)).length,confidence=clamp(.2+spotted.length*.1+visibleCities*.15,.2,.85);
  // Infer equipment only from remembered appearances and actually detected units.
  const knownEra=Math.max(0,...knownCities.map(c=>p.cityAppearances?.[c.id]?.visualEra||0),...spotted.map(u=>TECHS[UNITS[u.type].tech]?.era||0));
  const eraStrength=[18,25,35,45,55,65,75,85,95][Math.min(8,knownEra)],powerFloor=eraStrength*2.2;
  const estimatedPower=Math.max(powerFloor,observedPower+knownCities.length*eraStrength)*(1+(1-confidence)*.55);
  const nearbyPower=local.reduce((s,u)=>s+strength(u)*(u.hp/100),0),ratio=nearbyPower/Math.max(40,estimatedPower);
  const otherWars=Object.entries(p.relations).filter(([id,r])=>+id!==other.id&&r.status==='war').length,unrest=g.cities.filter(c=>c.owner===p.id&&c.loyalty<60).length;
  const supplyPenalty=otherWars*16+unrest*7+(p.gold<40?12:0)+(p.warWeariness||0)*.35;
  const opportunity=Math.max(0,clamp((ratio-1.05)*35,0,45)+clamp(16-nearest,0,16)*1.6+confidence*8-supplyPenalty);
  return {ourPower,theirPower:estimatedPower,observedPower,knownEra,eraStrength,nearbyPower,distance:nearest,confidence,opportunity,landTarget,seaTarget,ratio,supplyPenalty,otherWars};
}
