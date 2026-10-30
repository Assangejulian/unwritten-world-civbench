import {unitDetected} from './movement-rules.mjs';
import {eraScore,DIRECTIONS,RESOURCES,UNITS,TECHS,BUILDINGS,dist,isWater,canonicalTileKey} from './rules.mjs';
import {baseItem} from './unique-content.mjs';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const contexts=new WeakMap();
export const technologyEra=p=>Math.max(0,...p.techs.map(k=>TECHS[k]?.era||0));
// Empire totals and era scores are public after contact; army estimates remain sight-scoped.
export function scoreBreakdown(g,p){
 const cities=g.cities.filter(c=>c.owner===p.id),wonders=Object.values(g.wonders).filter(w=>g.cities.find(c=>c.id===w.city)?.owner===p.id),people=Object.values(g.heritage?.recruited||{}).filter(v=>v.owner===p.id);
 const counts={cities:cities.length,population:cities.reduce((n,c)=>n+c.population,0),districts:cities.reduce((n,c)=>n+new Set(c.districts.map(d=>d.tile)).size,0),uniqueDistricts:cities.reduce((n,c)=>n+c.districts.filter(d=>baseItem(d.item)!==d.item).length,0),buildings:cities.reduce((n,c)=>n+c.buildings.filter(k=>BUILDINGS[k]&&BUILDINGS[k].kind!=='district').length,0),technologies:p.techs.length,civics:p.civics.length,wonders:wonders.length,greatPeople:people.length,religion:p.religion?1:0,foreignReligion:p.religion?g.cities.filter(c=>c.owner!==p.id&&c.religion===p.id).length:0,era:Math.round((p.age?.score||0)+(p.age?.archivedScore||0)+(p.age?.history||[]).reduce((n,a)=>n+a.score,0))};
 const weights={cities:5,population:1,districts:2,uniqueDistricts:2,buildings:1,technologies:2,civics:3,wonders:15,greatPeople:5,religion:10,foreignReligion:2,era:1},parts=Object.entries(counts).map(([key,count])=>({key,count,weight:weights[key],score:count*weights[key]}));
 return {version:2,total:parts.reduce((n,p)=>n+p.score,0),parts};
}
export function publicEmpireScore(g,p){return scoreBreakdown(g,p).total;}
export function compareEmpireScore(g,a,b){
 const x=scoreBreakdown(g,a),y=scoreBreakdown(g,b),count=(s,k)=>s.parts.find(p=>p.key===k).count;
 return y.total-x.total||['civics','cities','districts','population','greatPeople','religion','technologies','wonders'].map(k=>count(y,k)-count(x,k)).find(n=>n!==0)||a.id-b.id;
}
export function strategicBalance(g,p,other){
 const visible=new Set(p.visible),own=g.units.filter(u=>u.owner===p.id&&u.hp>0&&!UNITS[u.type].civilian),seen=g.units.filter(u=>u.owner===other.id&&u.hp>0&&(visible.has(u.tile)&&unitDetected(g,u,p.id))&&!UNITS[u.type].civilian);
 const power=units=>units.reduce((s,u)=>s+Math.max(UNITS[u.type].strength||0,UNITS[u.type].ranged||0)*u.hp/100,0);
 const known=Object.values(p.knownCities||{}).filter(c=>c.owner===other.id).length,confidence=Math.min(.9,.25+seen.length*.1);
 const estimatedPower=Math.max(35,power(seen)+known*(12+technologyEra(other)*3))*(1+(1-confidence)*.35);
 const empireRatio=(publicEmpireScore(g,p)+40)/(publicEmpireScore(g,other)+40),eraGap=technologyEra(p)-technologyEra(other);
 return {ourPower:power(own),estimatedPower,powerRatio:(power(own)+10)/(estimatedPower+10),empireRatio,technologyGap:eraGap,colonialEligible:eraGap>=3,confidence};
}
// Build once per evaluation, not per pair or render frame. All foreign inputs are remembered or visible.
export function geopoliticalContext(g,p,{cached=false}={}){
  let entries=contexts.get(g);if(!entries){entries=new Map();contexts.set(g,entries);}const old=entries.get(p.id),stamp=[g.turn,p.planRevision||0,p.techs.length,g.cities.length].join(':');
  if(cached&&old?.stamp===stamp&&old.visible===p.visible&&old.memory===p.knownTiles){const token=old.value.troops.map(u=>[u.id,u.tile,u.hp]).join('|');if(token!==old.token){old.value.pressures.clear();old.token=token;}return old.value;}
  const own=g.map.tiles.filter(t=>t.owner===p.id),ownIds=new Set(own.map(t=>t.id)),known=new Map(Object.values(p.knownTiles||{}).map(t=>[canonicalTileKey(t.q,t.r,g.map),t]));
  for(const t of own)known.set(canonicalTileKey(t.q,t.r,g.map),t);
  const adjacent=t=>DIRECTIONS.map(([q,r])=>known.get(canonicalTileKey(t.q+q,t.r+r,g.map))).filter(Boolean),frontier=new Map(),boundary=new Set();
  for(const t of own)for(const n of adjacent(t))if(!ownIds.has(n.id)){boundary.add(t.id);if(n.owner!=null&&n.owner>=0){if(!frontier.has(n.owner))frontier.set(n.owner,new Map());const contacts=frontier.get(n.owner);contacts.set(n.id,(contacts.get(n.id)||0)+(t.terrain==='mountain'||n.terrain==='mountain'?.18:isWater(t)||isWater(n)?.65:1));}}
  const visible=new Set(p.visible||[]),troops=g.units.filter(u=>(visible.has(u.tile)&&unitDetected(g,u,p.id))&&u.hp>0&&!UNITS[u.type]?.civilian),cities=g.cities.filter(c=>c.owner===p.id),knownCities=Object.values(p.knownCities||{}).filter(c=>known.has(canonicalTileKey(g.map.tiles[c.tile]?.q,g.map.tiles[c.tile]?.r,g.map)));
  const value={own,ownIds,known,adjacent,frontier,boundary,troops,cities,knownCities,pressures:new Map()};if(cached)entries.set(p.id,{stamp,visible:p.visible,memory:p.knownTiles,value,token:troops.map(u=>[u.id,u.tile,u.hp]).join('|')});return value;
}
export function geopoliticalPressure(g,p,other,context=geopoliticalContext(g,p)){
  const r=p.relations[other.id]||{},x=context,contacts=x.frontier.get(other.id)||new Map(),foreign=x.knownCities.filter(c=>c.owner===other.id);
  const stamp=r.status+':'+!!r.openBorders+':'+eraScore(p)+':'+eraScore(other),previous=x.pressures.get(other.id);if(previous?.stamp===stamp)return previous.value;
  let sharedEdges=0,interleaving=0,resourceCompetition=0,cityProximity=0,coastalRivalry=0;
  for(const [id,weight]of contacts){sharedEdges+=weight;const tile=x.known.get(canonicalTileKey(g.map.tiles[id].q,g.map.tiles[id].r,g.map));const near=x.adjacent(tile).filter(t=>x.ownIds.has(t.id)&&t.terrain!=='mountain');if(near.length>=3)interleaving+=near.length-2;}
  const cityPairs=[];
  for(const a of x.cities){let nearest=Infinity,enemy=null;for(const b of foreign){const d=dist(g.map.tiles[a.tile],g.map.tiles[b.tile],g.map);if(d<nearest){nearest=d;enemy=b;}}if(nearest<=9){const pressure=clamp((9-nearest)*2.3,0,14);cityPairs.push(pressure);if(enemy&&x.adjacent(g.map.tiles[a.tile]).some(isWater)&&x.adjacent(g.map.tiles[enemy.tile]).some(isWater))coastalRivalry+=pressure*.3;}}
  cityProximity=cityPairs.length?Math.max(...cityPairs)+Math.min(12,cityPairs.reduce((a,b)=>a+b,0)*.2):0;
  for(const tile of x.known.values()){const resource=RESOURCES[tile.resource];if(!resource||!['strategic','luxury'].includes(resource.category)||resource.tech&&!p.techs.includes(resource.tech)||![p.id,other.id,null].includes(tile.owner))continue;if(x.cities.some(c=>dist(tile,g.map.tiles[c.tile],g.map)<=3)&&foreign.some(c=>dist(tile,g.map.tiles[c.tile],g.map)<=3))resourceCompetition+=resource.category==='strategic'?2:1;}
  const extent=clamp(sharedEdges*.7,0,24),exposure=sharedEdges?clamp(contacts.size/Math.max(8,x.boundary.size)*20,0,12):0;
  const rawBorder=clamp(extent+exposure+Math.min(18,interleaving*1.7)+cityProximity+Math.min(8,resourceCompetition)+Math.min(8,coastalRivalry),0,75);
  const nearest=foreign.length&&x.cities.length?Math.min(...foreign.flatMap(b=>x.cities.map(a=>dist(g.map.tiles[a.tile],g.map.tiles[b.tile],g.map)))):99,closeness=Math.max(sharedEdges>0?1:0,clamp((14-nearest)/10,0,1)),eraRatio=(eraScore(p)+20)/(eraScore(other)+20),eraPressure=closeness*(eraRatio>1.7?35:eraRatio>=.7&&eraRatio<=1.45?18:8);
  const borderPressure=Math.min(95,rawBorder+eraPressure)*(r.status==='alliance'?.78:r.openBorders?.90:1);
  let military=0,nearbyTroops=0;
  for(const u of x.troops){if(u.owner!==other.id)continue;const tile=g.map.tiles[u.tile],nearest=x.cities.length?Math.min(...x.cities.map(c=>dist(tile,g.map.tiles[c.tile],g.map))):Infinity,atBorder=contacts.has(u.tile)||x.ownIds.has(u.tile);if(!atBorder&&nearest>4)continue;nearbyTroops++;const spec=UNITS[u.type],era=Math.max(0,...p.techs.map(k=>TECHS[k]?.era||0)),weight=clamp((spec.strength||0)/Math.max(15,20+era*6),.5,1.8);military+=weight*(x.ownIds.has(u.tile)?9:nearest<=2?7:atBorder?5:2.5)*(u.hp/100)*(spec.siege||spec.ranged?1.15:1);}
  const militaryPressure=clamp(military*(r.status==='alliance'?.4:r.openBorders?.65:1),0,40);
  const value={version:3,eraPressure:Math.round(eraPressure),eraRatio:Number(eraRatio.toFixed(2)),nearbyWeakRival:closeness>.4&&eraRatio>1.7,borderPressure:Number(borderPressure.toFixed(1)),militaryPressure:Number(militaryPressure.toFixed(1)),sharedEdges:Math.round(sharedEdges),interleaving,cityProximity:Math.round(cityProximity),resourceCompetition:Math.min(8,resourceCompetition),coastalRivalry:Math.round(Math.min(8,coastalRivalry)),nearbyTroops,allianceMitigation:r.status==='alliance',rawBorder:Math.round(rawBorder)};x.pressures.set(other.id,{stamp,value});return value;
}
