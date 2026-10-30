// Check clock-only publication and immutable perspective-local delta history.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,snapshot,restore,serialize} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {StateTransport} from '../src/state-transport.mjs';
import {mergeStateDelta} from '../web/state-sync.js';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[];
const game=createGame({seed:'VIEWPORT-STATE',players:2,size:'small',barbarians:false});
for(const p of game.players)p.manual=true;
let changes=0;const sim=new RealtimeSimulation(game,{onChange:()=>changes++});sim.ready();changes=0;
sim.tick(1);assert.equal(changes,0);assert.equal(sim.state().time,1);checks.push('Clock-only heartbeats advance session time without invalidating the world snapshot');
const unit=game.units.find(u=>u.owner===0&&u.type==='warrior');
sim.enqueue(game.players[0],[{type:'fortify',unit:unit.id}],{manual:true});changes=0;sim.tick(.05);assert.equal(changes,1);assert(unit.activity);changes=0;sim.tick(.05);assert.equal(changes,0);
sim.tick(1.2);assert(changes>0);assert(!unit.activity);assert(unit.cooldownUntil>game.realtime.time);changes=0;sim.tick(2);assert(changes>0);assert(unit.moves>0);checks.push('Admission, impact and cooldown expiry still publish authoritative unit changes');
const cache=new StateTransport(),legacy=createGame({seed:'VIEWPORT-LEGACY',players:2,size:'small'}),golden=value=>JSON.parse(JSON.stringify(value));
let revision=1,full=cache.response(legacy.id,revision,-1,0,null,()=>snapshot(legacy));assert.deepEqual(full.game,golden(snapshot(legacy)));
const frozen=JSON.stringify(full.game);legacy.players[0].driver.calls++;legacy.units[0].hp=89;
const response=cache.response(legacy.id,++revision,-1,revision-1,legacy.id,()=>snapshot(legacy));assert.equal(JSON.stringify(full.game),frozen);assert.equal(response.delta.tiles.length,0);assert.deepEqual(mergeStateDelta(full.game,response.delta,revision-1,-1),golden(snapshot(legacy)));
checks.push('Cached snapshots detach live driver/unit references and reconstruct exact legacy snapshots');
const fog=cache.response(legacy.id,revision,0,0,null,()=>snapshot(legacy,0));assert(fog.game.map.tiles.some(t=>t.hidden));assert.equal(fog.game.players[1].gold,undefined);assert.throws(()=>mergeStateDelta(full.game,response.delta,revision-1,0));
const world=restore(before.toString()),samples=[];
for(let i=0;i<12;i++){const start=performance.now();cache.response(world.id,i,-1,i-1,world.id,()=>snapshot(world,-1,{manualOptionsOnly:true}));samples.push(performance.now()-start);}
checks.push('State caches remain bounded by perspective and retain fog/full-snapshot protections');
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));assert(serialize(game).includes('VIEWPORT-STATE'));sim.dispose();
const report={passed:true,checks,transportMilliseconds:{mean:samples.reduce((a,b)=>a+b)/samples.length,max:Math.max(...samples)},unchangedSave:true};
await writeFile(new URL('../output/viewport-state-checks.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
