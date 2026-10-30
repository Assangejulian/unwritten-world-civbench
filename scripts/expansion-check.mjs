import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {TECHS,CIVICS,UNITS,BUILDINGS,MAP_SIZES} from '../src/rules.mjs';
import {createGame,applyAction,applyOrders,observation,finishTurn,cityYields,housing,unitStrength,buildable,serialize,restore} from '../src/engine.mjs';
import {executeDriver} from '../src/drivers.mjs';
const checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
for(const catalog of [TECHS,CIVICS]){
  const visited=new Set(),stack=new Set();
  function visit(key){assert(catalog[key],`Unknown prerequisite ${key}`);assert(!stack.has(key),`Research cycle at ${key}`);if(visited.has(key))return;stack.add(key);for(const prerequisite of catalog[key].requires)visit(prerequisite);stack.delete(key);visited.add(key);}
  Object.keys(catalog).forEach(visit);
}
assert.equal(Object.keys(TECHS).length,62);assert.equal(Object.keys(CIVICS).length,47);pass('All 109 research nodes have valid acyclic prerequisites');
const g=createGame({seed:'RESEARCH-MECHANICS',players:2,barbarians:false}),p=g.players[0];assert.deepEqual([g.map.width,g.map.height],[106,66]);assert.equal(g.map.tiles.length,6996);pass('New games default to the exact CIV VI huge dimensions');
applyAction(g,p,{type:'found',unit:g.units.find(u=>u.owner===0&&u.type==='settler').id});const city=g.cities[0];
let before=cityYields(g,city);p.techs.push('wheel');let after=cityYields(g,city);assert(after.production>before.production+.64&&after.production<before.production+1.5);p.techs.push('astrology');assert(cityYields(g,city).faith>after.faith);p.techs.push('mathematics');assert(buildable(g,p,city,'watermill'));pass('New technologies change actual city yields and unlock production');
before=housing(g,city);p.civics.push('urbanization');assert.equal(housing(g,city),before+2);assert(buildable(g,p,city,'neighborhood',g.map.tiles.find(t=>t.owner===0&&t.id!==city.tile&&!t.district&&t.terrain!=='mountain'&&!['ocean','coast'].includes(t.terrain))?.id));
const warrior=g.units.find(u=>u.owner===0&&u.type==='warrior');before=unitStrength(g,warrior);p.civics.push('militarytradition');assert.equal(unitStrength(g,warrior),before+1);pass('New civics affect housing, district availability, and military strength');
p.techs.push('rifling','siege');assert(buildable(g,p,city,'rifleman'));assert(buildable(g,p,city,'bombard'));p.civics.push('enlightenment');before=cityYields(g,city).science;applyAction(g,p,{type:'policies',items:['publiceducation']});assert(cityYields(g,city).science>before+2.9);pass('New riflemen, bombards, and policy bonuses use the existing legal action system');
p.gold=10000;p.techs.push('masonry','buttress','steel');for(const item of ['walls','medievalwalls','steelwalls'])applyAction(g,p,{type:'purchase',city:city.id,item});assert.equal(city.walls,350);city.walls=340;finishTurn(g);assert.equal(city.walls,345);finishTurn(g);assert.equal(city.walls,350);pass('Purchased wall upgrades increase real durability and recover up to the upgraded limit');
const original=await readFile(new URL('../output/before-3d-update.json',import.meta.url),'utf8');assert.equal(serialize(restore(original)),original);pass('The current turn 57 save and C++ memories restore exactly');
const huge=createGame({seed:'DESKTOP-HUGE-EIGHT',players:8,barbarians:false,maxTurns:400});const started=performance.now();let calls=0;
for(let round=0;round<12;round++){for(const player of huge.players){const result=await executeDriver(player,observation(huge,player));player.memory=result.memory;applyOrders(huge,player,result.orders);player.driver.calls++;calls++;}finishTurn(huge);}
assert(huge.cities.length>=8);assert.equal(huge.turn,13);assert.equal(serialize(restore(serialize(huge))),serialize(huge));metrics.huge={tiles:huge.map.tiles.length,calls,turn:huge.turn,cities:huge.cities.length,units:huge.units.length,ms:Math.round(performance.now()-started)};pass('Eight real native C++ drivers complete twelve rounds on the huge map');
const massive=createGame({size:'massive',players:8,seed:'MASSIVE-RESTORE'});assert.equal(massive.map.tiles.length,10240);assert.equal(serialize(restore(serialize(massive))),serialize(massive));pass('The optional 128 by 80 world generates and restores');
await writeFile(new URL('../output/expansion-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics},null,2));
