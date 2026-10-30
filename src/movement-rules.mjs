import {canEnterTerritory} from './warfare.mjs';
import {ownersAtWar} from './city-states.mjs';
import {unitHasRanged} from './rules.mjs';
import {baseItem} from './unique-content.mjs';
import {UNITS,dist,isWater,unitTransport,canonicalTileKey,DIRECTIONS} from './rules.mjs';
import {neighbors} from './world.mjs';
import {heritageAura,heritageEffects} from './heritage.mjs';
import {religionIntelAllowed,unitReligionSource} from './religion.mjs';

const time=g=>g.realtime?.time??g.turn*20;
const hostile=ownersAtWar;
const effects=(g,u)=>({...heritageEffects(g,g.players[u.owner]),...heritageEffects(g,u),...heritageAura(g,u)});
const tacticalCaches=new WeakMap();
export function withTacticalCache(g,fn){if(tacticalCaches.has(g))return fn();tacticalCaches.set(g,{fields:new Map()});try{return fn();}finally{tacticalCaches.delete(g);}}
export function riverBlocks(g,a,b){
 if(!a||!b||isWater(a)||isWater(b))return false;
 const d=DIRECTIONS.findIndex(([q,r])=>g.map.index[canonicalTileKey(a.q+q,a.r+r,g.map)]?.id===b.id);
 return d>=0&&(a.riverEdges?.includes(d)||b.riverEdges?.includes((d+3)%6))||false;
}
export function unitDetected(g,u,viewer){
 if(viewer==null||viewer<0||u.owner===viewer||religionIntelAllowed(g,viewer,u.owner))return true;
 const p=g.players[viewer];if(!p?.visible.includes(u.tile))return false;
 if(!UNITS[u.type]?.submarine||(u.revealedUntil||0)>time(g))return true;
 const concealed=heritageEffects(g,g.players[u.owner]).submarineStealth||0;
 return g.units.some(d=>d.owner===viewer&&d.hp>0&&(()=>{
  const s=UNITS[d.type],distance=dist(g.map.tiles[d.tile],g.map.tiles[u.tile],g.map);
  const sonar=s.submarine||s.antiSubmarine||['destroyer','assaultship','missilecruiser'].includes(d.type);
  const radius=sonar?Math.max(1,2-Math.min(1,concealed)):1;
  return s.domain!=='air'&&distance<=radius||s.domain==='air'&&s.antiAir&&distance<=radius;
 })());
}
export function ignoresZoc(g,u){const s=UNITS[u.type],escort=s.civilian&&g.units.find(v=>v.id===u.linkedUnit&&v.linkedUnit===u.id&&v.owner===u.owner&&v.tile===u.tile&&v.hp>0&&!UNITS[v.type].civilian);return s.domain==='air'||s.class==='cavalry'||!!s.submarine||!!effects(g,u).ignoreZoc||!!s.ignoreZoc||!!escort&&ignoresZoc(g,escort);}
const defensiveSites=g=>{const cache=tacticalCaches.get(g);if(cache?.sites)return cache.sites;const sites=g.map.tiles.filter(t=>!t.pillaged&&(t.fort?.hp>0||baseItem(t.district?.item)==='barracks'));if(cache)cache.sites=sites;return sites;};
export function zocSources(g,u,t,{known=true,respectImmunity=true}={}){
 if(respectImmunity&&ignoresZoc(g,u))return [];
 const s=UNITS[u.type],water=isWater(t),religious=!!s.religious;
 const result=[];
 for(const enemy of g.units){
  const e=UNITS[enemy.type],a=g.map.tiles[enemy.tile];if(enemy.hp<=0||enemy.owner===u.owner||known&&!unitDetected(g,enemy,u.owner)||dist(a,t,g.map)!==1||riverBlocks(g,a,t)||e.domain==='air'||unitTransport(enemy,a))continue;
  if(religious){if(e.religious&&unitReligionSource(g,enemy)&&unitReligionSource(g,u)&&unitReligionSource(g,enemy).id!==unitReligionSource(g,u).id)result.push(enemy.id);continue;}
  if(e.civilian||e.submarine||!hostile(g,u.owner,enemy.owner)||e.domain!=='sea'&&(unitHasRanged(g.players[enemy.owner],enemy.type)||e.siege)||isWater(a)!==water)continue;
  result.push(enemy.id);
 }
 if(!religious)for(const c of g.cities){const a=g.map.tiles[c.tile];if(c.hp<=0||!hostile(g,u.owner,c.owner)||known&&!g.players[u.owner]?.visible.includes(c.tile)||dist(a,t,g.map)!==1||riverBlocks(g,a,t))continue;result.push('city:'+c.id);}
 if(!religious)for(const a of defensiveSites(g))if(hostile(g,u.owner,a.fort?.owner??a.owner)&&(!known||g.players[u.owner]?.visible.includes(a.id))&&dist(a,t,g.map)===1&&!riverBlocks(g,a,t))result.push('defense:'+a.id);
 return result;
}
export function movementBlocked(g,u){return (u.zocUntil||0)>time(g);}
export function zocField(g,u){
 const field=new Set();if(ignoresZoc(g,u))return field;const religious=!!UNITS[u.type].religious;
 const cache=tacticalCaches.get(g),key=u.owner+':'+religious+':'+(religious?unitReligionSource(g,u)?.id:'');if(cache?.fields.has(key))return cache.fields.get(key);
 for(const e of g.units){const s=UNITS[e.type],a=g.map.tiles[e.tile];if(e.owner===u.owner||e.hp<=0||!unitDetected(g,e,u.owner)||s.domain==='air'||unitTransport(e,a))continue;
  if(religious?!(s.religious&&unitReligionSource(g,e)&&unitReligionSource(g,u)&&unitReligionSource(g,e).id!==unitReligionSource(g,u).id):s.civilian||s.submarine||!hostile(g,u.owner,e.owner)||s.domain!=='sea'&&(unitHasRanged(g.players[e.owner],e.type)||s.siege))continue;
  for(const t of neighbors(g.map,a))if(!riverBlocks(g,a,t)&&(religious||isWater(a)===isWater(t)))field.add(t.id);
 }
 if(!religious)for(const c of g.cities)if(c.hp>0&&hostile(g,u.owner,c.owner)&&g.players[u.owner]?.visible.includes(c.tile))for(const t of neighbors(g.map,g.map.tiles[c.tile]))if(!riverBlocks(g,g.map.tiles[c.tile],t))field.add(t.id);
 if(!religious)for(const a of defensiveSites(g))if(hostile(g,u.owner,a.fort?.owner??a.owner)&&g.players[u.owner]?.visible.includes(a.id))for(const t of neighbors(g.map,a))if(!riverBlocks(g,a,t))field.add(t.id);
 cache?.fields.set(key,field);return field;
}
export function stopInZoc(g,u){if(zocSources(g,u,g.map.tiles[u.tile],{known:false}).length){u.zocUntil=g.realtime?.nextEconomy??(g.turn+1)*20;return true;}return false;}
export function hostileSeaCost(g,u,to){return isWater(to)&&to.owner!=null&&hostile(g,u.owner,to.owner)&&!effects(g,u).ignoreEnemyTerritoryWaterPenalty?1:0;}
export function cityUnderSiege(g,c){
 const ring=neighbors(g.map,g.map.tiles[c.tile]).filter(t=>t.terrain!=='mountain');
 // A city checks physical control of its exits; unit movement immunities do not lift a siege.
 return ring.length>0&&ring.every(t=>g.units.some(u=>u.hp>0&&hostile(g,c.owner,u.owner)&&u.tile===t.id&&!UNITS[u.type].civilian&&UNITS[u.type].domain!=='air')||zocSources(g,{owner:c.owner,type:isWater(t)?'galley':'warrior',tile:t.id},t,{known:false,respectImmunity:false}).length);
}
export function retreatDestination(g,u,source){
 if(!source||UNITS[u.type]?.domain!=='sea'||u.activity||UNITS[u.type]?.airCapacity)return null;
 const start=g.map.tiles[u.tile],threat=g.map.tiles[source.tile];if(!threat)return null;
 return neighbors(g.map,start).filter(t=>isWater(t)&&t.terrain!=='mountain'&&(t.terrain!=='ocean'||g.players[u.owner]?.techs.includes('celestial'))&&canEnterTerritory(g,u,t)&&!g.units.some(v=>v.hp>0&&(v.tile===t.id||v.activity?.to===t.id))&&dist(t,threat,g.map)>dist(start,threat,g.map)).sort((a,b)=>dist(b,threat,g.map)-dist(a,threat,g.map)||a.id-b.id)[0]||null;
}
