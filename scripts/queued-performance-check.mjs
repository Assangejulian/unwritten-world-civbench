import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,applyOrders,applyAction,observation,finishTurn,snapshot,serialize,restore,addUnit,refreshVisibility,reachable} from '../src/engine.mjs';
import {executeDriver} from '../src/drivers.mjs';
import {executeOrderQueue} from '../src/order-queue.mjs';
import {StateTransport} from '../src/state-transport.mjs';
import {mergeStateDelta} from '../web/state-sync.js';
import {scheduleActions} from '../web/action-schedule.js';

const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
let clock=0;const wait=async ms=>{clock+=ms;},now=()=>clock;
const seed=createGame({seed:'QUEUED-CHECK',players:2,size:'small',barbarians:false}),sync=restore(serialize(seed)),queued=restore(serialize(seed)),p=seed.players[0];
const orders=[{type:'research',item:'nanotech'},null,{type:'found',unit:seed.units.find(u=>u.owner===0&&u.type==='settler').id},{type:'research',item:'mining'},...seed.units.filter(u=>u.owner===0&&u.type!=='settler').map(u=>({type:'fortify',unit:u.id}))],progress=[];
const expected=applyOrders(sync,sync.players[0],orders),actual=await executeOrderQueue(queued,queued.players[0],orders,{wait,now,onProgress:item=>progress.push({...item,time:clock})});
assert.deepEqual(actual,expected);assert.equal(serialize(queued),serialize(sync));assert.equal(progress.length,orders.length);assert(progress.every((item,i)=>item.processed===i+1&&item.total===orders.length));assert(clock>=1250);
pass('Queued commands preserve driver order, rejected-order handling, reports and exact engine outcome');
const army=createGame({seed:'QUEUE-LARGE-ARMY',players:1,size:'small',barbarians:false});
for(let i=0;i<40;i++)addUnit(army,0,'warrior',army.units[0].tile);
clock=0;const starts=[];await executeOrderQueue(army,army.players[0],army.units.map(u=>({type:'fortify',unit:u.id})),{wait,now,interval:220,onProgress:()=>starts.push(clock)});
const concurrency=Math.max(...starts.map(time=>starts.filter(start=>start<=time&&start+1250>time).length));assert.equal(concurrency,3);assert(starts.slice(1).every((t,i)=>t-starts[i]>=220));metrics.largeArmy={units:starts.length,maxConcurrent:concurrency,presentationMilliseconds:clock};
pass('A 43-unit army is paced with at least 220 ms spacing and at most three active presentation reservations');
const limited=createGame({seed:'QUEUE-LIMIT',players:1,size:'small',barbarians:false});
const cap=await executeOrderQueue(limited,limited.players[0],Array.from({length:140},()=>({type:'research',item:'mining'})),{wait,now});assert.equal(cap.accepted,128);
assert.deepEqual(await executeOrderQueue(limited,limited.players[0],null,{wait,now}),{accepted:0,rejected:[{reason:'orders must be an array'}]});
let yielded=false;setTimeout(()=>{yielded=true;},0);await executeOrderQueue(limited,limited.players[0],[{type:'research',item:'mining'}]);assert(yielded);
pass('The existing 128-command cap is preserved and asynchronous execution yields to pending event-loop work');
const cache=new StateTransport(),world=restore(serialize(seed));let revision=1;
const full=cache.response(world.id,revision,-1,0,null,()=>snapshot(world,-1,{manualOptionsOnly:true}));assert(full.game);
applyAction(world,world.players[0],{type:'found',unit:world.units.find(u=>u.owner===0&&u.type==='settler').id});
const changed=cache.response(world.id,++revision,-1,1,world.id,()=>snapshot(world,-1,{manualOptionsOnly:true}));const merged=mergeStateDelta(full.game,changed.delta,1,-1);
assert.deepEqual(merged,JSON.parse(JSON.stringify(snapshot(world,-1,{manualOptionsOnly:true}))));assert(changed.delta.tiles.length>0);
world.units[0].hp=97;
const compact=cache.response(world.id,++revision,-1,2,world.id,()=>snapshot(world,-1,{manualOptionsOnly:true}));assert.equal(compact.delta.tiles.length,0);
assert.deepEqual(mergeStateDelta(merged,compact.delta,2,-1),JSON.parse(JSON.stringify(snapshot(world,-1,{manualOptionsOnly:true}))));
metrics.transfer={fullBytes:Buffer.byteLength(JSON.stringify(full)),unitDeltaBytes:Buffer.byteLength(JSON.stringify(compact)),unchangedTiles:world.map.tiles.length};assert(metrics.transfer.unitDeltaBytes<metrics.transfer.fullBytes*.1);
assert.throws(()=>mergeStateDelta(merged,compact.delta,1,-1));assert.throws(()=>mergeStateDelta(merged,compact.delta,2,0));
const fog=cache.response(world.id,revision,0,2,world.id,()=>snapshot(world,0,{manualOptionsOnly:true}));assert(fog.game);assert(fog.game.map.tiles.some(t=>t.hidden));assert(fog.game.players[1].gold===undefined);
for(let i=0;i<7;i++)cache.response(world.id,++revision,-1,-1,null,()=>snapshot(world,-1,{manualOptionsOnly:true}));assert.equal(cache.views.get('-1').length,4);assert(cache.response(world.id,revision,-1,1,world.id,()=>{throw Error('Cached snapshot expected');}).game);
world.players[0].manual=true;assert(snapshot(world,-1,{manualOptionsOnly:true}).cities[0].options.length>0);
pass('State deltas reconstruct exact snapshots, retain fog/manual options, reject stale bases and fall back after bounded history eviction');
const events=Array.from({length:20},(_,i)=>({id:i+1,kind:i%3===0?'attack':'move'})),scheduled=scheduleActions(events,10,[11,12,13]);
const reservations=[[10,11],[10,12],[10,13],...events.map(e=>[scheduled.get(e.id),scheduled.get(e.id)+(e.kind==='move'?3:1.95)])];
assert(reservations.every(([start])=>reservations.filter(([a,b])=>a<=start&&b>start).length<=3));assert([...scheduled.values()].every((t,i,a)=>!i||t>a[i-1]));
pass('Batched or resumed snapshots also schedule visual actions in order with a three-action limit');
const native=createGame({seed:'QUEUED-NATIVE',players:8,size:'huge',barbarians:false}),golden=restore(serialize(native));let calls=0,totalRejected=0;
const started=performance.now();for(let round=0;round<20;round++){
  const first=(native.turn-1)%native.players.length;
  for(let i=0;i<native.players.length;i++){
    const player=native.players[(first+i)%native.players.length],reference=golden.players[player.id],response=await executeDriver(player,observation(native,player));calls++;
    player.memory=structuredClone(response.memory);reference.memory=structuredClone(response.memory);
    const a=applyOrders(golden,reference,response.orders),b=await executeOrderQueue(native,player,response.orders,{wait,now});assert.deepEqual(a,b);totalRejected+=b.rejected.length;assert.equal(serialize(native),serialize(golden));
  }
  finishTurn(native);finishTurn(golden);assert.equal(serialize(native),serialize(golden));
}
metrics.native={rounds:20,calls,rejected:totalRejected,turn:native.turn,cities:native.cities.length,units:native.units.length,elapsedMilliseconds:performance.now()-started};assert.equal(totalRejected,0);
pass('Twenty rounds with eight real native C++ drivers produce byte-identical queued/synchronous worlds after every player and settlement');
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));pass('The active autosave remains byte-exact; no actual game API or desktop launched');
await writeFile(new URL('../output/queued-performance-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,saveTurn:JSON.parse(before).turn},null,2));
