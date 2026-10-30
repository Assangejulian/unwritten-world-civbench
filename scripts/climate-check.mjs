import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as C from '../src/climate.mjs';
import {TECHS, CIVICS, BUILDINGS, PROJECTS, POWER_PLANTS, tileYield, gamePace} from '../src/rules.mjs';
import {tilesInRange} from '../src/world.mjs';
import {projectSeat, readSection} from '../src/environment/projection.mjs';
import {field} from './imperial-fixture.mjs';

const checks = [], pass = name => {checks.push(name); console.log('PASS ' + name);};
function fixture() {
  const f = field(), {g, p, home, tile} = f;
  g.settings.climateEnabled = true; g.settings.disasterIntensity = 0;
  for (const t of [tile(3,3), tile(4,3), tile(5,3)]) Object.assign(t, {river:true, riverEdges:[0,3], owner:p.id, territoryCity:home.id, improvement:t.cityId ? null : 'farm'});
  for (const t of tilesInRange(g.map,tile(10,10),1)) t.terrain = 'desert';
  for (const t of tilesInRange(g.map,tile(14,10),1)) t.terrain = 'snow';
  for (const t of tilesInRange(g.map,tile(18,10),2)) t.terrain = 'ocean';
  tile(23,10).terrain = 'mountain'; tile(6,5).terrain = 'coast';
  Object.assign(tile(5,5), {owner:p.id, territoryCity:home.id, improvement:'farm'});
  delete g.climate; C.initializeClimate(g); g.climate.geography.volcanoes = [tile(23,10).id];
  g.climate.geography.rainfall[home.tile] = 15;
  const coast=g.climate.geography.coastal.find(row=>row[0]===tile(5,5).id);assert(coast);coast[1]=1;
  E.refreshVisibility(g); return f;
}
function step(g, count=1) {for(let i=0;i<count;i++){g.turn++;C.settleClimate(g,{event:E.event});}}

{
  const {g}=fixture(), combat=g.rngState, initial=E.serialize(g);
  assert.equal(C.settleClimate(g),false);assert.equal(E.serialize(g),initial);
  step(g);assert.equal(g.rngState,combat);const settled=E.serialize(g);C.settleClimate(g);assert.equal(E.serialize(g),settled);
  assert.deepEqual(E.restore(E.serialize(g)).climate,g.climate);
  pass('One complete-round settlement, independent weather RNG and exact climate round-trip');
}
{
  const {g,p,home}=fixture(); home.buildings.push('industrial','workshop','factory','coalplant');
  assert.equal(C.climateCityEmissions(g,home).current,10);step(g);assert.equal(g.climate.accounts[p.id].current,10);
  home.buildings.push('oilplant');assert.equal(C.climateCityEmissions(g,home).current,7);
  home.buildings.push('powerplant');assert.equal(C.climateCityEmissions(g,home).current,2);
  home.buildings.push('dam','hydroplant');assert.equal(C.climateCityEmissions(g,home).current,.5);
  assert.equal(POWER_PLANTS.at(-1),'solarplant');
  step(g);assert.equal(g.climate.totalEmissions,10.5);
  pass('Only the highest operational plant emits; nuclear and renewable replacements retain real accounting');
}
{
  const normal=fixture(),fast=fixture();normal.home.buildings.push('factory','coalplant');fast.home.buildings.push('factory','coalplant');fast.g.settings.gameSpeed='blitz';
  step(normal.g,4);step(fast.g);assert.equal(normal.g.climate.co2,fast.g.climate.co2);
  fast.g.climate.co2=10000;step(fast.g);assert.equal(fast.g.climate.phase,7);assert.equal(fast.g.climate.temperatureRise,2.8);assert.equal(fast.g.climate.seaLevel,3);
  const phase=fast.g.climate.phase,removed=C.recaptureCarbon(fast.g,fast.p);assert.equal(removed,80/gamePace(fast.g).factor);assert.equal(fast.g.climate.phase,phase);
  pass('Pace-normalized emissions, warming thresholds, sea rise and irreversible-stage carbon recapture');
}
{
  const f=fixture(),{g,p,home,tile}=f,cell=tile(4,3);const unit=E.addUnit(g,p.id,'warrior',cell.id);unit.hp=100;
  C.startDisaster(g,'flood',cell.id,{severity:2});step(g);
  assert.equal(cell.pillaged,true);assert.equal(unit.hp,76);assert(home.hp<200);assert(g.climate.disasters[0].tiles.includes(home.tile));
  const safe=fixture();safe.home.buildings.push('dam');const protectedTile=safe.tile(4,3),guard=E.addUnit(safe.g,0,'warrior',protectedTile.id);const health=guard.hp;
  C.startDisaster(safe.g,'flood',protectedTile.id,{severity:3});step(safe.g);assert(!protectedTile.pillaged);assert.equal(guard.hp,health);assert.equal(safe.home.hp,200);
  pass('Connected river floods cause real damage; operational city dams protect tiles, cities and garrisons');
}
{
  const {g,home,tile}=fixture();home.hp=0;tile(4,3).fort={hp:8,owner:0};
  C.startDisaster(g,'flood',tile(4,3).id,{severity:3});step(g);
  assert.equal(home.hp,0);assert.equal(tile(4,3).fort.hp,1);
  pass('Weather never heals a breached zero-HP city or bypasses fortress destruction and rebuilding authority');
}
{
  const {g,p,home}=fixture(),original=E.cityYields(g,home).food;
  C.startDisaster(g,'drought',home.tile);const dry=E.cityYields(g,home).food;assert(dry<original);
  home.buildings.push('reservoir');const protectedYield=E.cityYields(g,home).food;g.climate.disasters=[];assert.equal(E.cityYields(g,home).food,protectedYield);
  assert(protectedYield>dry);assert.equal(C.climateBuildReason(g,p,home,'reservoir'),null);
  pass('Drought changes authoritative growth food; reservoirs remove the penalty without fabricated yields');
}
{
  const {g,tile}=fixture();const snow=C.startDisaster(g,'blizzard',tile(14,10).id),dust=C.startDisaster(g,'duststorm',tile(10,10).id),storm=C.startDisaster(g,'hurricane',tile(18,10).id);
  assert(snow.tiles.every(id=>g.map.tiles[id].terrain==='snow'));assert(dust.tiles.every(id=>g.map.tiles[id].terrain==='desert'));
  const centers=[snow.center,dust.center,storm.center];step(g);assert([snow,dust,storm].some((d,i)=>d.center!==centers[i]));
  assert.throws(()=>C.startDisaster(g,'blizzard',tile(3,3).id),/geography/);
  assert.throws(()=>C.startDisaster(g,'flood',tile(18,10).id),/geography/);
  C.startDisaster(g,'eruption',tile(23,10).id,{severity:3});step(g,4);assert.equal(g.climate.disasters.length,0);assert(g.climate.recent.length>=4);
  pass('Snow/desert/ocean/volcanic geography, moving footprints, bounded lifetimes and history');
}
{
  const {g,p,home,tile}=fixture(),coast=tile(5,5);g.climate.co2=10000;step(g);
  assert(g.climate.inundated.includes(coast.id));assert(coast.pillaged);
  const builder=E.addUnit(g,p.id,'builder',coast.id),charges=builder.charges;
  assert.throws(()=>E.applyAction(g,p,{type:'repair',unit:builder.id}),/防洪屏障/);assert.equal(builder.charges,charges);
  assert(!E.legalActions(g,p).some(a=>a.type==='repair'&&a.unit===builder.id));
  home.buildings.push('floodbarrier');E.applyAction(g,p,{type:'repair',unit:builder.id});assert(!coast.pillaged);step(g);assert(!coast.pillaged);
  assert.equal(coast.terrain,'grass');assert.equal(g.cities.length,3);
  pass('Flood barriers prevent recurring coastal infrastructure damage without deleting cities or changing topology');
}
{
  const {g,p,home,other,tile}=fixture();p.techs=Object.keys(TECHS);p.civics=Object.keys(CIVICS);p.gold=1000000;home.buildings.push('factory');
  assert(E.buildable(g,p,home,'dam'));assert(!E.buildable(g,p,home,'hydroplant'));assert(!E.buildable(g,g.players[other.owner],other,'dam'));
  E.applyAction(g,p,{type:'purchase',city:home.id,item:'dam'});assert(home.buildings.includes('dam'));assert(E.buildable(g,p,home,'hydroplant'));
  E.applyAction(g,p,{type:'purchase',city:home.id,item:'hydroplant'});assert(home.buildings.includes('hydroplant'));
  E.applyAction(g,p,{type:'purchase',city:home.id,item:'floodbarrier'});assert(home.buildings.includes('floodbarrier'));
  assert(E.productionOptions(g,p,home).some(op=>op.item==='carbonrecapture'));
  for(const key of ['dam','reservoir','floodbarrier','hydroplant','windplant','solarplant'])assert(BUILDINGS[key].tech&&TECHS[BUILDINGS[key].tech]);
  assert(PROJECTS.carbonrecapture.civic==='conservation');
  pass('Actual production/purchases enforce geography and prerequisites for prevention, clean power and carbon projects');
}
{
  const {g,p,q,tile}=fixture();const hidden=tile(14,10).id,shown=tile(4,3).id;
  C.startDisaster(g,'blizzard',hidden);C.startDisaster(g,'flood',shown);
  p.visible=p.explored=[shown];const view=C.climateView(g,p.id);assert.equal(view.disasters.length,1);assert(view.disasters[0].tiles.every(id=>id===shown||g.map.tiles[id].owner===p.id));assert.equal(view.disasters[0].center,shown);
  assert(!JSON.stringify(view).includes('rng'));assert.equal(view.contributors.length,2);assert.equal(view.contributors[1].player,null);assert.equal(view.contributors[0].player,p.id);assert(!view.own.cities.some(city=>city.id===g.cities.find(c=>c.owner===q.id).id));
  const observer=C.climateView(g,-1);assert.equal(observer.disasters.length,2);assert.equal(observer.contributors.length,3);assert.equal(observer.own,null);
  const original=JSON.stringify(view);g.climate.disasters.find(d=>d.type==='blizzard').center=tile(15,10).id;assert.equal(JSON.stringify(C.climateView(g,p.id)),original);
  pass('Unknown hazards and foreign emissions stay private; clipped footprints cannot reveal hidden centers');
}
{
  const {g,p,tile}=fixture();C.startDisaster(g,'flood',tile(4,3).id);E.refreshVisibility(g);
  const snap=E.snapshot(g,p.id),native=E.observation(g,p),projected=projectSeat(g,p.id,{profile:'benchmark'});
  assert.deepEqual(snap.climate,native.climate);assert.deepEqual(snap.climate,projected.climate);
  assert.deepEqual(readSection(projected,'climate').value,snap.climate);assert(readSection(projected,'summary').value.climate.disasters.length);
  const produce=native.legalActions.filter(a=>a.type==='produce'&&a.item==='dam');p.techs=Object.keys(TECHS);
  assert(E.observation(g,p).legalActions.some(a=>a.type==='produce'&&a.item==='dam'&&a.hint.climateUtility>0));
  pass('Browser, native and MCP climate views agree; summary/section and native mitigation scores are connected');
}
{
  const {g}=fixture();g.turn=12;C.startDisaster(g,'drought',g.climate.geography.floodplains[0]);
  const clone=E.restore(E.serialize(g));for(let i=0;i<12;i++){step(g);step(clone);assert.deepEqual(g.climate,clone.climate);}
  pass('Active hazard continuation and subsequent weather replay exactly after authoritative save restore');
}
{
  const {g}=fixture(),save=JSON.parse(E.serialize(g));
  const mutations=[s=>s.climate.rng=-1,s=>s.climate.phase=8,s=>s.climate.co2=-1,s=>s.climate.geography.rainfall.pop(),s=>s.climate.accounts[0].total=Infinity,s=>s.climate.fertility[99999]={food:1,production:0},s=>s.climate.disasters.push({id:1,type:'flood',tiles:[999999]})];
  for(const mutation of mutations){const changed=structuredClone(save);mutation(changed);assert.throws(()=>E.restore(JSON.stringify(changed)),/climate/);}
  delete save.climate;delete save.settings.climateEnabled;delete save.settings.disasterIntensity;const legacy=E.restore(JSON.stringify(save));assert(legacy.climate.enabled);assert.equal(legacy.turn,g.turn);assert.deepEqual(legacy.units,g.units);
  pass('Malformed climate saves reject; old worlds initialize without resetting geography, units or turns');
}
{
  const g=E.createGame({players:2,size:'small',seed:'NO-CLIMATE',barbarians:false,climateEnabled:false}),before=JSON.stringify(g.climate);
  assert.deepEqual(C.climateView(g,0),{version:1,enabled:false});g.turn++;C.settleClimate(g);assert.equal(JSON.stringify(g.climate),before);
  assert.throws(()=>E.createGame({disasterIntensity:5}),/intensity/);
  pass('Disabled climate remains inert; invalid new-world settings reject');
}
{
  const {g,p,tile}=fixture(),cell=tile(4,3);cell.feature='forest';cell.improvement=null;p.techs=['mining'];
  const builder=E.addUnit(g,p.id,'builder',cell.id),charges=builder.charges;
  E.applyAction(g,p,{type:'chop',unit:builder.id});assert.equal(builder.charges,charges-1);
  assert.equal(g.climate.accounts[p.id].pendingDeforestation,3);assert.equal(g.climate.totalEmissions,0);
  E.finishTurn(g,{actions:false});assert.equal(g.climate.lastTurn,g.turn);assert.equal(g.climate.sources.deforestation,3);
  assert.equal(g.climate.accounts[p.id].total,3);assert.equal(g.climate.accounts[p.id].pendingDeforestation,0);
  const settled=JSON.stringify(g.climate);C.settleClimate(g);assert.equal(JSON.stringify(g.climate),settled);
  pass('A real builder chop emits once at economic settlement and updates the displayed source ledger');
}
{
  const {g,p,home,tile}=fixture(),cell=tile(4,3);g.climate.geography.rainfall[cell.id]=15;
  C.startDisaster(g,'drought',cell.id);g.climate.fertility[cell.id]={food:1,production:0};
  E.refreshVisibility(g);const view=E.snapshot(g,p.id),projected=view.map.tiles[cell.id];
  assert.deepEqual(tileYield(projected,view.players[p.id]),C.climateTileYield(g,cell,tileYield(cell,p)));
  p.knownTiles[cell.id]={...cell};p.visible=[];const remembered=E.snapshot(g,p.id).map.tiles[cell.id];assert.equal(remembered.weather,undefined);
  pass('Human map yields use the same weather arithmetic as settlement; unseen remembered tiles carry no live weather');
}

await mkdir(new URL('../output/climate-20261029/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/climate-20261029/rules.json',import.meta.url),JSON.stringify({passed:true,checks,liveSaveWritten:false},null,2));
console.log(JSON.stringify({passed:true,groups:checks.length}));
