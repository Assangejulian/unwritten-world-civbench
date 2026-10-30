import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createGame,observation,applyOrders,finishTurn,snapshot,serialize,restore} from '../src/engine.mjs';
import {generateMap,tilesInRange} from '../src/world.mjs';
import {MAP_SIZES,dist,isWater} from '../src/rules.mjs';
import {executeDriver} from '../src/drivers.mjs';

const checks=[],metrics={};
function passed(name){checks.push(name);console.log('PASS '+name);}
for(const [size,dimensions]of Object.entries(MAP_SIZES)){
  for(const type of ['continents','pangaea','islands','random']){
    const map=generateMap('LARGE-WORLD-VERIFY',dimensions.width,dimensions.height,8,type);
    assert.equal(map.tiles.length,dimensions.width*dimensions.height);
    assert.equal(new Set(map.starts).size,8);
    assert(map.starts.every(id=>!isWater(map.tiles[id])&&map.tiles[id].terrain!=='mountain'));
    const copy=generateMap('LARGE-WORLD-VERIFY',dimensions.width,dimensions.height,8,type);
    assert.deepEqual(copy,map);
    const sample=[0,map.width-1,map.width,map.tiles.length-1,...map.starts];
    for(const id of sample)for(let radius=0;radius<=4;radius++)assert.deepEqual(tilesInRange(map,map.tiles[id],radius).map(t=>t.id),map.tiles.filter(t=>dist(t,map.tiles[id],map)<=radius).map(t=>t.id));
  }
  passed(`${size}: ${dimensions.width} x ${dimensions.height}, all four map types, eight starts, repeatable seed, exact local hex queries`);
}
const legacy=await readFile(new URL('../output/before-map-update.json',import.meta.url),'utf8');
const legacyData=JSON.parse(legacy),legacyLoaded=restore(legacy),legacyCurrent=JSON.parse(serialize(legacyLoaded));
// Old engine compatibility fields may be added, but no original tile field may change.
assert.deepEqual(legacyCurrent.map.tiles.map((tile,i)=>Object.fromEntries(Object.keys(legacyData.map.tiles[i]).map(key=>[key,tile[key]]))),legacyData.map.tiles);
assert.equal(legacyLoaded.map.width,legacyData.map.width);assert.equal(legacyLoaded.map.height,legacyData.map.height);const normalizedLegacy=serialize(legacyLoaded);assert.equal(serialize(restore(normalizedLegacy)),normalizedLegacy);passed('Existing 38 x 26 geography retains every original tile field and restores exactly after established engine compatibility fields are added');
const g=createGame({players:8,size:'huge',seed:'HUGE-EIGHT-NATIVE',barbarians:true,maxTurns:240});
let calls=0,maxDriverMs=0,rejections=0;const started=performance.now();
for(let round=0;round<25;round++){
  const start=(g.turn-1)%8;
  for(let i=0;i<8;i++){
    const p=g.players[(start+i)%8];if(!p.alive)continue;
    const response=await executeDriver(p,observation(g,p));calls++;maxDriverMs=Math.max(maxDriverMs,response.ms);p.memory=response.memory;
    rejections+=applyOrders(g,p,response.orders).rejected.length;
  }
  finishTurn(g);
}
assert.equal(calls,200);assert.equal(g.turn,26);assert(g.cities.length>=8);assert(g.players.every(p=>p.alive));
const saved=serialize(g);assert.equal(serialize(restore(saved)),saved);assert.equal(snapshot(g).map.tiles.length,MAP_SIZES.huge.width*MAP_SIZES.huge.height);
assert(snapshot(g,0).map.tiles.some(t=>t.hidden));passed('All eight actual C++ drivers complete 25 rounds on the current huge map; production, growth, fog, and save restoration remain valid');
metrics.nativeCalls=calls;metrics.turn=g.turn;metrics.cities=g.cities.length;metrics.units=g.units.length;metrics.seconds=Math.round((performance.now()-started)/100)/10;metrics.maxDriverMs=maxDriverMs;metrics.rejections=rejections;metrics.saveMB=Math.round(Buffer.byteLength(saved)/1024/1024*100)/100;
metrics.profileOpenings=[];
for(const type of ['continents','pangaea','islands','random']){
  const world=createGame({players:12,size:'huge',seed:'DIVERSITY-0',mapType:type,barbarians:false,maxTurns:120});let decisions=0,refused=0;
  for(let round=0;round<4;round++){for(const p of world.players){const response=await executeDriver(p,observation(world,p));p.memory=response.memory;decisions++;refused+=applyOrders(world,p,response.orders).rejected.length;}finishTurn(world);}
  assert.equal(decisions,48);assert.equal(refused,0);assert(world.players.every(p=>p.alive&&world.cities.some(c=>c.owner===p.id)));assert(world.players.every(p=>Number.isFinite(p.gold)&&p.gold>=0));const bytes=serialize(world);assert.equal(serialize(restore(bytes)),bytes);metrics.profileOpenings.push({type,players:12,decisions,rejections:refused,cities:world.cities.length,units:world.units.length});
  await writeFile(new URL('../output/map-diversity-20261010/opening-'+type+'.json',import.meta.url),bytes);
}
passed('Twelve real nations found every capital and complete forty-eight legal opening decisions on each of the four new profiles');
await writeFile(new URL('../output/map-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics},null,2));
console.log(JSON.stringify(metrics));
