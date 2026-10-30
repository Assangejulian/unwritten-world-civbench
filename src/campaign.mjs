import {unitDetected} from './movement-rules.mjs';
import {UNITS,DIRECTIONS,canonicalTileKey,dist,isWater,canEmbark,leaderFor} from './rules.mjs';
import {canEnterTerritory,protectedEnvoy} from './warfare.mjs';

const hostile=(p,owner)=>owner===-1||p.relations[owner]?.status==='war';
const power=u=>Math.max(5,UNITS[u.type].ranged||UNITS[u.type].strength||0)*u.hp/100;
export function defenseSituation(g,p,c,visible=new Set(p.visible)){
  const center=g.map.tiles[c.tile];
  const threats=g.units.filter(u=>u.hp>0&&u.owner!==p.id&&hostile(p,u.owner)&&(visible.has(u.tile)&&unitDetected(g,u,p.id))&&!UNITS[u.type].civilian&&!UNITS[u.type].navalOnly&&!protectedEnvoy(u)&&dist(center,g.map.tiles[u.tile],g.map)<=5);
  const close=threats.filter(u=>dist(center,g.map.tiles[u.tile],g.map)<=3);
  const defenders=g.units.filter(u=>u.hp>20&&u.owner===p.id&&!UNITS[u.type].civilian&&UNITS[u.type].domain!=='air'&&!isWater(g.map.tiles[u.tile])&&dist(center,g.map.tiles[u.tile],g.map)<=3);
  const threatPower=threats.reduce((s,u)=>s+power(u)*(dist(center,g.map.tiles[u.tile],g.map)<=3?1:.4),0);
  const defensivePower=defenders.reduce((s,u)=>s+power(u),0)+(c.walls>0?14:0);
  const shortfall=Math.max(0,threatPower*1.15-defensivePower);
  const urgency=threats.length&&shortfall>0?Math.min(3,(close.length?1:0.4)+shortfall/35+(c.hp<100?.6:0)):0;
  return {urgency,shortfall,threatPower,defensivePower,frontline:defenders.filter(u=>!UNITS[u.type].ranged&&!UNITS[u.type].siege&&u.hp>35).length,minStrength:Math.max(0,...threats.map(u=>(UNITS[u.type].strength||0)*.7)),close:close.length,required:Math.max(1,Math.ceil(threatPower/25)),threats:threats.map(u=>u.id)};
}
export function campaignPosture(g,p,plan){
  const visible=new Set(p.visible),army=g.units.filter(u=>u.owner===p.id&&u.hp>0&&!UNITS[u.type].civilian);
  const wars=Object.entries(p.relations).filter(([,r])=>r.status==='war').map(([id])=>+id);
  const spotted=g.units.filter(u=>wars.includes(u.owner)&&(visible.has(u.tile)&&unitDetected(g,u,p.id))&&!UNITS[u.type].civilian);
  const known=Object.values(p.knownCities||{}).filter(c=>wars.includes(c.owner));
  const ourPower=army.reduce((s,u)=>s+power(u),0),theirPower=Math.max(35,spotted.reduce((s,u)=>s+power(u),0)+known.length*12);
  const ratio=ourPower/theirPower,health=army.length?army.reduce((s,u)=>s+u.hp,0)/army.length/100:0;
  const temperament=leaderFor(p).weights?.aggression||0;
  const temperature=Math.max(.18,Math.min(.92,.42+temperament*.14+(ratio-1)*.16+(health-.7)*.2-(p.warWeariness||0)*.008-(p.gold<20?.12:0)-(wars.length>1?.08:0)+(plan.goal==='domination'?.1:0)));
  return {temperature:Number(temperature.toFixed(2)),stance:!wars.length?'peace':ratio<.7||health<.45?'recover':temperature>.6?'assault':'advance',ratio:Number(ratio.toFixed(2)),knownTargets:known.length};
}

// Reverse Dijkstra fields use remembered terrain only. Dynamic occupancy stays
// in authoritative reachable(), so a moving friendly unit cannot seal a corridor.
export const CAMPAIGN_LIMITS=Object.freeze({fieldsPerNation:24});
export function settlementGuidance(g,p,u,sites){
  if(sites.length){
    const best=Math.max(...sites.map(site=>site.score));
    const route=routeGuidance(g,p,u,sites.map(site=>({tile:site.t.id,cost:(best-site.score)*.12})),{explore:false});
    if(route.distance(u.tile)<900)return {route,exploring:false};
  }
  // Discover land from reachable remembered frontiers, without inspecting what
  // lies beyond the fog. An isolated nation must not wait for a known colony.
  const tiles=p.knownTiles||{},goals=Object.values(tiles).filter(t=>DIRECTIONS.some(([dq,dr])=>{
    const next=g.map.index[canonicalTileKey(t.q+dq,t.r+dr,g.map)];return next&&!tiles[next.id];
  })).map(t=>({tile:t.id}));
  const route=routeGuidance(g,p,u,goals,{explore:false});
  return {route:route&&route.distance(u.tile)<900?route:null,exploring:true};
}
const caches=new WeakMap();
const knowledgeVersions=new WeakMap();
const neighborCaches=new WeakMap();
function routeNeighbors(map){
 let cache=neighborCaches.get(map);const geometry=[map.width,map.height,map.wrapX,map.tiles.length].join(':');
 if(!cache||cache.index!==map.index||cache.geometry!==geometry){
  cache={index:map.index,geometry,ids:map.tiles.map(t=>DIRECTIONS.map(([dq,dr])=>map.index[canonicalTileKey(t.q+dq,t.r+dr,map)]?.id).filter(id=>id!==undefined))};neighborCaches.set(map,cache);
 }
 return cache.ids;
}
export function routeKnowledgeChanged(g,p){let versions=knowledgeVersions.get(g);if(!versions){versions=new Map();knowledgeVersions.set(g,versions);}versions.set(p.id,(versions.get(p.id)||0)+1);}
export function routeGuidance(g,p,u,goals,{explore=true,avoidOccupied=false}={}){
  if(!goals.length)return null;
  let nations=caches.get(g);if(!nations){nations=new Map();caches.set(g,nations);}
  const revision=[g.turn,p.planRevision||0,p.techs.length,p.explored.length,knowledgeVersions.get(g)?.get(p.id)||0,JSON.stringify(p.relations)].join(':');
  let cache=nations.get(p.id);if(!cache||cache.revision!==revision||cache.visible!==p.visible||cache.known!==p.knownTiles){cache={revision,visible:p.visible,known:p.knownTiles,fields:new Map()};nations.set(p.id,cache);}
  const visibleTiles=cache.visibleSet||(cache.visibleSet=new Set(p.visible));
  const occupancy=avoidOccupied?g.units.filter(v=>v.hp>0&&(v.owner===p.id||visibleTiles.has(v.tile))).map(v=>v.id+','+v.owner+','+v.tile).join(';'):'';
  const embark=canEmbark(p,u.type),sea=UNITS[u.type].domain==='sea';
  const key=[UNITS[u.type].domain||'land',embark,u.veteranTraits?.includes('terrain'),u.borderExitOwner,u.envoy?.capital,explore,avoidOccupied,occupancy,goals.map(t=>t.tile+','+(t.range||0)+','+(t.cost||0)+','+!!t.capture).sort().join(';')].join(':');
  if(cache.fields.has(key))return cache.fields.get(key);
  const captureGoals=new Set(goals.filter(goal=>goal.capture).map(goal=>goal.tile)),tiles=p.knownTiles||{},neighbors=routeNeighbors(g.map),blocked=avoidOccupied?new Set(g.units.filter(v=>v.hp>0&&(v.owner===p.id||visibleTiles.has(v.tile))&&!captureGoals.has(v.tile)).map(v=>v.tile)):new Set(),pass=t=>!!t&&!blocked.has(t.id)&&t.terrain!=='mountain'&&canEnterTerritory(g,u,t)&&(sea?isWater(t)||t.cityId!=null&&neighbors[t.id].some(id=>isWater(tiles[id])):!isWater(t)||embark)&&(t.terrain!=='ocean'||p.techs.includes('celestial'))&&(t.cityId==null||t.owner===p.id||captureGoals.has(t.id)||sea&&p.relations[t.owner]?.status==='war'||u.type==='envoy'&&u.envoy?.capital===t.cityId);
  const adjacent=t=>neighbors[t.id].map(id=>tiles[id]).filter(Boolean);
  const costs=new Float64Array(g.map.tiles.length).fill(Infinity),targets=new Int32Array(g.map.tiles.length).fill(-1),heap=[];
  const push=(id,cost,target)=>{costs[id]=cost;targets[id]=target;let i=heap.length;heap.push({id,cost,target});while(i){const parent=(i-1)>>1;if(heap[parent].cost<=cost)break;heap[i]=heap[parent];i=parent;}heap[i]={id,cost,target};};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].cost<heap[child].cost)child++;if(heap[child].cost>=last.cost)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
  for(const goal of goals){const center=tiles[goal.tile];if(!center)continue;const seeds=[center],seen=new Set([center.id]);for(let i=0;i<seeds.length;i++)if(dist(center,seeds[i],g.map)<(goal.range||0))for(const t of adjacent(seeds[i]))if(!seen.has(t.id)){seen.add(t.id);seeds.push(t);}for(const t of seeds)if(pass(t)&&(goal.cost||0)<costs[t.id])push(t.id,goal.cost||0,goal.tile);}
  while(heap.length){const node=pop();if(node.cost!==costs[node.id])continue;const to=tiles[node.id];for(const from of adjacent(to)){if(!pass(from))continue;let step=isWater(to)?1:1+((to.hill||to.feature)&&!u.veteranTraits?.includes('terrain')?1:0)+(to.river&&!from.river&&!p.techs.includes('engineering')?1:0);if(to.road&&from.road&&!to.roadPillaged&&!from.roadPillaged)step*=.6;const next=node.cost+step;if(next<costs[from.id])push(from.id,next,node.target);}}
  let frontier,frontierChecked=false;
  // Occupancy must not turn an already reached attack ring into another move goal.
  const reachedGoal=id=>avoidOccupied&&blocked.has(id)&&tiles[id]&&canEnterTerritory(g,u,tiles[id])?goals.filter(goal=>(goal.range||0)>0&&tiles[goal.tile]&&dist(tiles[id],tiles[goal.tile],g.map)<=goal.range).reduce((best,goal)=>!best||(goal.cost||0)<(best.cost||0)?goal:best,null):null;
  const distance=id=>{
    if(Number.isFinite(costs[id]))return costs[id];
    const reached=reachedGoal(id);if(reached)return reached.cost||0;
    // A shared field excludes occupied transit tiles; each unit reads its source
    // through a free neighboring cell without a separate field per unit.
    if(avoidOccupied&&blocked.has(id)){const best=Math.min(999,...adjacent(tiles[id]).filter(pass).map(to=>costs[to.id]+(isWater(to)?1:1+((to.hill||to.feature)&&!u.veteranTraits?.includes('terrain')?1:0))));if(best<999)return best;}
    // A remembered capital can be separated by unexplored terrain. Approach a
    // reachable exploration frontier instead of reading live hidden geography.
    if(explore&&!frontierChecked){frontierChecked=true;const frontiers=Object.values(tiles).filter(t=>pass(t)&&DIRECTIONS.some(([dq,dr])=>{const next=g.map.index[canonicalTileKey(t.q+dq,t.r+dr,g.map)];return next&&!tiles[next.id];})).map(t=>({tile:t.id,cost:Math.min(...goals.map(goal=>dist(t,g.map.tiles[goal.tile],g.map)))*1.4}));frontier=frontiers.length?routeGuidance(g,p,u,frontiers,{explore:false,avoidOccupied}):null;}
    return frontier?.distance(id)??999;
  };
  const result={distance,progress:(from,to)=>distance(from)-distance(to),target:id=>{if(targets[id]>=0)return targets[id];const reached=reachedGoal(id);if(reached)return reached.tile;if(avoidOccupied&&blocked.has(id)){const best=adjacent(tiles[id]).filter(pass).reduce((a,t)=>!a||costs[t.id]<costs[a.id]?t:a,null);if(best&&Number.isFinite(costs[best.id]))return targets[best.id];}return undefined;}};
  if(cache.fields.size>=CAMPAIGN_LIMITS.fieldsPerNation)cache.fields.delete(cache.fields.keys().next().value);cache.fields.set(key,result);return result;
}
