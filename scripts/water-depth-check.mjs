import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {waterDepths,SHALLOW_WATER_LIMIT,isWater,dist} from '../src/rules.mjs';
import {generateMap} from '../src/world.mjs';

const checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const strip={tiles:Array.from({length:7},(_,id)=>({id,q:id,r:0,terrain:id?'coast':'grass'}))},original=JSON.stringify(strip),depths=waterDepths(strip);
assert(depths.get(1)<=SHALLOW_WATER_LIMIT);assert(depths.get(2)<=SHALLOW_WATER_LIMIT);assert(depths.get(3)>SHALLOW_WATER_LIMIT);assert.equal(depths.get(4),1);assert.equal(depths.get(6),1);assert.equal(JSON.stringify(strip),original);
pass('Legacy coast labels do not turn an entire ocean into shallow water');
const reverse={tiles:[...strip.tiles].reverse()};assert.deepEqual([...waterDepths(reverse)].sort((a,b)=>a[0]-b[0]),[...depths].sort((a,b)=>a[0]-b[0]));
pass('Depth classification is independent of tile iteration order');
const fog={tiles:strip.tiles.map(t=>({...t,hidden:t.id===0}))},hidden=waterDepths(fog);assert(!hidden.has(0));assert([...hidden.values()].every(d=>d===1));
pass('Hidden land does not reveal coastlines through water colors');
const island={tiles:Array.from({length:11},(_,id)=>({id,q:id,r:0,terrain:id===5?'grass':'ocean'}))},islandDepths=waterDepths(island);assert.equal(islandDepths.get(4),islandDepths.get(6));assert.equal(islandDepths.get(3),islandDepths.get(7));assert(islandDepths.get(0)>islandDepths.get(4));
pass('Islands have symmetric shallow shelves and deeper offshore water');
metrics.maps=[];
for(const type of ['continents','pangaea','islands'])for(let i=0;i<4;i++){
  const seed='WATER-DEPTH-'+type+'-'+i,map=generateMap(seed,106,66,8,type),copy=generateMap(seed,106,66,8,type),computed=waterDepths(map),counts={coast:0,ocean:0};
  assert.equal(JSON.stringify(map),JSON.stringify(copy));
  for(const tile of map.tiles)if(isWater(tile)){counts[tile.terrain]++;assert.equal(tile.terrain==='coast',computed.get(tile.id)<=SHALLOW_WATER_LIMIT);}
  assert(counts.coast>0&&counts.ocean>0);assert.equal(new Set(map.starts).size,8);
  for(const id of map.starts){assert(!isWater(map.tiles[id]));for(const other of map.starts)if(id!==other)assert(dist(map.tiles[id],map.tiles[other],map)>=4);}
  assert(map.tiles.filter(t=>t.resource==='fish').every(isWater));metrics.maps.push({seed,...counts});
}
pass('Twelve seeded huge maps keep real shallow and deep zones, valid starts, and water-only fish');

const savePath=process.env.CIV_TEST_SAVE||new URL('../saves/autosave.json',import.meta.url),bytes=await readFile(savePath),save=JSON.parse(bytes),currentDepths=waterDepths(save.map),zones={shallow:0,transition:0,deep:0};
for(const depth of currentDepths.values())zones[depth<=SHALLOW_WATER_LIMIT?'shallow':depth<1?'transition':'deep']++;
assert(zones.shallow>0&&zones.deep>0);metrics.current={turn:save.turn,seed:save.seed,zones,sha256:createHash('sha256').update(bytes).digest('hex')};
assert((await readFile(savePath)).equals(bytes));const backup=await readFile(new URL('../saves/before-water-depth-update-20261004.json',import.meta.url));const legacy=JSON.parse(backup);assert([...waterDepths(legacy.map).values()].some(depth=>depth===1));metrics.legacyBackupTurn=legacy.turn;
pass('The current world gains visual depth zones without changing save bytes');
await writeFile(new URL('../output/water-depth-checks.json',import.meta.url),JSON.stringify({passed:true,gameLaunched:false,checks,metrics},null,2));
console.log(JSON.stringify(metrics.current));
