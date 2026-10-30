// Immutable landmarks, independently seeded placement and view-filtered local bonuses.
import {NATURAL_WONDERS,naturalAuraYield,isWater,dist,gamePace} from './rules.mjs';
import {neighbors,tilesInRange,random} from './world.mjs';
const caches=new WeakMap();
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const fail=()=>{throw Error('Invalid natural wonder state.');};
const sourceKnown=(p,key)=>!p||(p.naturalDiscoveries||[]).includes(key);
const land=t=>!isWater(t)&&t.terrain!=='mountain';

function rebuild(g){
  const landmarks=g.map.tiles.filter(t=>NATURAL_WONDERS[t.naturalWonder]),plots=new Map();
  for(const t of g.map.tiles)if(Object.hasOwn(t,'naturalAuras'))delete t.naturalAuras;
  for(const source of landmarks)if(NATURAL_WONDERS[source.naturalWonder].aura)for(const t of neighbors(g.map,source)){
    if(!plots.has(t.id))plots.set(t.id,[]);plots.get(t.id).push(source.naturalWonder);
  }
  for(const [id,keys]of plots){keys.sort();Object.defineProperty(g.map.tiles[id],'naturalAuras',{value:keys,enumerable:false,configurable:true});}
  const result={landmarks,plots};caches.set(g.map.tiles,result);return result;
}
const geometry=g=>caches.get(g.map.tiles)||rebuild(g);

function eligible(g,key,t){
  const spec=NATURAL_WONDERS[key];if(!spec?.terrains.includes(t.terrain))return false;
  const ns=neighbors(g.map,t),rule=spec.placement||{};
  if(rule.hill!==undefined&&!!t.hill!==rule.hill)return false;
  if(rule.river&&!t.river||rule.noRiver&&t.river)return false;
  if(rule.minLand&&ns.filter(land).length<rule.minLand||rule.minWater&&ns.filter(isWater).length<rule.minWater)return false;
  if(rule.minRock&&ns.filter(n=>n.hill||n.terrain==='mountain').length<rule.minRock)return false;
  if(rule.minTemperate&&ns.filter(n=>['grass','plains'].includes(n.terrain)||n.feature==='jungle').length<rule.minTemperate)return false;
  if(rule.minFlat&&ns.filter(n=>land(n)&&!n.hill).length<rule.minFlat)return false;
  if(rule.noWater&&ns.some(isWater))return false;
  if(rule.connectedRiver&&!ns.some(n=>n.river&&land(n)))return false;
  if(rule.nearRiver&&!t.river&&!ns.some(n=>n.river&&land(n)))return false;
  if(rule.nearCold&&!ns.some(n=>['snow','tundra','mountain'].includes(n.terrain)))return false;
  if(rule.nearDesert&&!ns.some(n=>n.terrain==='desert'))return false;
  if(rule.nearValley&&!t.river&&!ns.some(n=>n.river||['forest','jungle'].includes(n.feature)))return false;
  if(rule.nearWoodOrHill&&!ns.some(n=>n.hill||['forest','jungle'].includes(n.feature)))return false;
  if(rule.coastWithin&&!tilesInRange(g.map,t,rule.coastWithin).some(n=>n.terrain==='coast'))return false;
  return true;
}

// Host-side generation/test primitive; never registered as a player action.
export function placeNaturalWonder(g,key,id){
  const t=g.map.tiles[id];
  if(!g.naturalWonders?.enabled||!t||!eligible(g,key,t)||geometry(g).landmarks.some(n=>n.naturalWonder===key)||t.naturalWonder||t.cityId!=null||t.district||t.construction||t.improvement||t.fort||t.road||t.resource||t.camp||t.village||t.ruin||t.cityState||t.cityStateTerritory)throw Error('Invalid natural wonder placement.');
  t.naturalWonder=key;
  if(g.climate?.geography){const origins=g.climate.geography.volcanoes;if(NATURAL_WONDERS[key].volcano){if(!origins.includes(id))origins.push(id);}else g.climate.geography.volcanoes=origins.filter(value=>value!==id);}
  rebuild(g);return t;
}

export function initializeNaturalWonders(g,{populate=false,legacy=false}={}){
  if(g.naturalWonders){rebuild(g);return g.naturalWonders;}
  if(legacy)return undefined;
  const enabled=!legacy&&g.settings.naturalWondersEnabled!==false;
  g.naturalWonders={version:1,enabled};
  for(const p of g.players)p.naturalDiscoveries=[];
  if(populate&&enabled){
    const rng=random(g.seed+':natural-wonders:real35:v1'),keys=Object.keys(NATURAL_WONDERS);
    for(let i=keys.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[keys[i],keys[j]]=[keys[j],keys[i]];}
    const target=Math.max(2,Math.min(8,Math.round(Math.sqrt(g.map.tiles.length)/14)));
    const candidates=g.map.tiles.filter(t=>t.owner==null&&!t.cityState&&!t.cityStateTerritory&&!t.cityId&&!t.district&&!t.construction&&!t.improvement&&!t.fort&&!t.resource&&!t.camp&&!t.village&&!t.ruin&&g.map.starts.every(id=>dist(t,g.map.tiles[id],g.map)>5)&&!g.units.some(u=>u.tile===t.id));
    let count=0;
    for(const key of keys){
      if(count>=target)break;
      const available=candidates.filter(t=>eligible(g,key,t)&&!t.naturalWonder&&geometry(g).landmarks.every(n=>dist(t,n,g.map)>=8));
      if(available.length){placeNaturalWonder(g,key,available[Math.floor(rng()*available.length)].id);count++;}
    }
  }
  rebuild(g);return g.naturalWonders;
}

export function naturalTileProjection(g,p,tile){
  if(!g.naturalWonders?.enabled)return {};
  const original=g.map.tiles[tile.id],keys=(original?.naturalAuras||[]).filter(key=>sourceKnown(p,key));
  const naturalYield=naturalAuraYield({...tile,naturalYield:undefined,naturalAuras:keys},p||{});
  return {naturalWonder:tile.naturalWonder&&sourceKnown(p,tile.naturalWonder)?tile.naturalWonder:undefined,naturalYield:Object.keys(naturalYield).length?naturalYield:undefined};
}

export function discoverNaturalWonders(g,p,known,{event,era}={}){
  if(!g.naturalWonders?.enabled)return [];
  const found=geometry(g).landmarks.filter(t=>known.has(t.id)&&!p.naturalDiscoveries.includes(t.naturalWonder));
  for(const t of found){
    const key=t.naturalWonder;p.naturalDiscoveries.push(key);
    p.cultureBank=(p.cultureBank||0)+Math.round(10*gamePace(g).factor);
    era?.(g,p,key);event?.(g,'natural_wonder',`${p.short} 发现了自然奇观：${NATURAL_WONDERS[key].name}。`,p.id,t.id);
  }
  if(found.length)refreshNaturalKnowledge(g,p);
  return found.map(t=>t.naturalWonder);
}

function refreshNaturalKnowledge(g,p){
  if(!p.knownTiles)return;
  for(const id of geometry(g).plots.keys())if(p.knownTiles[id])Object.assign(p.knownTiles[id],naturalTileProjection(g,p,p.knownTiles[id]));
}

export function naturalAdjacency(g,p,tile,item){
  if(!g.naturalWonders?.enabled)return 0;
  return Math.min(4,neighbors(g.map,tile).reduce((sum,t)=>sum+(sourceKnown(p,t.naturalWonder)?NATURAL_WONDERS[t.naturalWonder]?.adjacency?.[item]||0:0),0));
}

export function cityHasNaturalWonder(g,p,city){
  return !!g.naturalWonders?.enabled&&geometry(g).landmarks.some(t=>sourceKnown(p,t.naturalWonder)&&t.owner===p.id&&dist(t,g.map.tiles[city.tile],g.map)<=3);
}

export function naturalWonderView(g,view=-1){
  const p=view>=0?g.players[view]:null,enabled=!!g.naturalWonders?.enabled;
  return {enabled,discovered:p?(p.naturalDiscoveries||[]).length:null,discoveryReward:{culture:Math.round(10*gamePace(g).factor),eraPoints:2},landmarks:enabled?geometry(g).landmarks.filter(t=>sourceKnown(p,t.naturalWonder)).map(t=>({key:t.naturalWonder,tile:t.id,...NATURAL_WONDERS[t.naturalWonder]})):[]};
}

export function validateNaturalWonders(g){
  if(g.settings.naturalWondersEnabled!==undefined&&typeof g.settings.naturalWondersEnabled!=='boolean')fail();
  const state=g.naturalWonders,seen=new Set();
  if(state!==undefined&&(!plain(state)||state.version!==1||typeof state.enabled!=='boolean'))fail();
  for(const t of g.map.tiles){
    if(Object.hasOwn(t,'naturalYield')||Object.getOwnPropertyDescriptor(t,'naturalAuras')?.enumerable)fail();
    if(t.naturalWonder==null)continue;
    if(!state?.enabled||!NATURAL_WONDERS[t.naturalWonder]||seen.has(t.naturalWonder)||!NATURAL_WONDERS[t.naturalWonder].terrains.includes(t.terrain)||t.cityId!=null||t.district||t.construction||t.improvement||t.fort||t.road||t.resource||t.camp||t.village||t.ruin||t.cityState)fail();
    seen.add(t.naturalWonder);
  }
  for(const p of g.players){
    if(!state){if(p.naturalDiscoveries!==undefined)fail();continue;}
    if(!Array.isArray(p.naturalDiscoveries)||new Set(p.naturalDiscoveries).size!==p.naturalDiscoveries.length||p.naturalDiscoveries.some(key=>!seen.has(key)))fail();
  }
  if(state?.enabled&&g.settings.naturalWondersEnabled===false)fail();
  if(state){rebuild(g);for(const p of g.players)refreshNaturalKnowledge(g,p);}
}
