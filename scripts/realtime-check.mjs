import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,applyAction,reachable,attackTargets,snapshot,observation,serialize,restore,refreshVisibility} from '../src/engine.mjs';
import {RealtimeSimulation,migrateRealtime} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {UNITS,dist} from '../src/rules.mjs';
import {tileYield} from '../src/world.mjs';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(seed='RT-RULES',players=2){const g=createGame({seed,players,size:'small',barbarians:false});for(const t of g.map.tiles){t.terrain='grass';t.hill=false;t.feature=null;t.river=false;t.camp=false;t.ruin=false;}for(const p of g.players){p.explored=g.map.tiles.map(t=>t.id);p.visible=[...p.explored];}return g;}
const warrior=(g,owner,tile,type='warrior')=>{const template=g.units.find(u=>!UNITS[u.type].civilian);const u={...template,id:g.nextId++,owner,tile,type,hp:100,moves:UNITS[type].moves,acted:false,fortified:false};delete u.activity;delete u.linkedUnit;g.units.push(u);return u;};
{
 const g=createGame({seed:'SNOW-HILLS-0',players:8,size:'small',barbarians:false}),polar=g.map.tiles.filter(t=>t.terrain==='snow');assert(polar.some(t=>t.hill));assert(polar.some(t=>!t.hill));
 const tile={...polar[0],feature:null,resource:null,improvement:null,river:false};assert.equal(tileYield({...tile,hill:true}).production,tileYield({...tile,hill:false}).production+1);metrics.polar={snow:polar.length,snowHills:polar.filter(t=>t.hill).length};pass('New worlds contain flat snow and snow hills, with the existing hill production and movement rules');
}
{
 const g=field(),sim=new RealtimeSimulation(g),p=g.players[0],center=g.map.tiles.find(t=>t.q===10&&t.r===10),n=g.map.tiles.filter(t=>dist(t,center)===1),a=warrior(g,0,n[0].id),b=warrior(g,1,n[3].id);sim.ready();
 sim.enqueue(p,[{type:'move',unit:a.id,tile:center.id}],{manual:true});sim.enqueue(g.players[1],[{type:'move',unit:b.id,tile:center.id}]);sim.tick(.1);
 assert(a.activity);assert(!b.activity,'A conflicting reservation cannot begin');assert.equal(a.tile,n[0].id);sim.tick(1.1);assert.equal(a.tile,center.id);assert.equal(b.tile,n[3].id);pass('Movement consumes time; simultaneous enemy requests reserve one tile without overlap or teleportation');
 const c=warrior(g,1,n[2].id);sim.ready();sim.enqueue(g.players[1],[{type:'move',unit:c.id,tile:g.map.tiles.find(t=>dist(t,n[2])===1&&t.id!==center.id&&!g.units.some(u=>u.tile===t.id)).id}]);sim.tick(.05);assert(c.activity);refreshVisibility(g);const saved=serialize(g),restored=restore(saved),copy=new RealtimeSimulation(restored);sim.tick(2);copy.tick(2);assert.deepEqual(JSON.parse(serialize(g)),JSON.parse(serialize(restored)));pass('Saving during movement resumes the same authoritative path, cooldown and RNG sequence');
 sim.dispose();copy.dispose();
}
{
 const g=field('RT-COMBAT'),s=new RealtimeSimulation(g),p=g.players[0],q=g.players[1];p.relations[1]={status:'war',since:1};q.relations[0]={status:'war',since:1};const tile=g.map.tiles.find(t=>t.q===10&&t.r===10),other=g.map.tiles.find(t=>dist(t,tile)===1),a=warrior(g,0,tile.id,'archer'),b=warrior(g,1,other.id,'archer');s.ready();p.visible=g.map.tiles.map(t=>t.id);q.visible=[...p.visible];
 s.enqueue(p,[{type:'attack',unit:a.id,targetUnit:b.id}]);s.enqueue(q,[{type:'attack',unit:b.id,targetUnit:a.id}]);s.tick(.1);assert.equal(a.hp,100);assert.equal(b.hp,100);assert(a.activity&&b.activity);s.tick(.9);assert(a.hp<100&&b.hp<100);assert(!a.activity&&!b.activity);s.tick(Math.max(0,a.cooldownUntil-g.realtime.time)+.05);assert(a.moves>0);assert.equal(attackTargets(g,p,a).length,0);assert(a.attackUntil>g.realtime.time);pass('Opposing civilizations attack concurrently, apply damage at impact, and may move during independent attack cooldown');
 s.enqueue(p,[{type:'attack',unit:a.id,targetUnit:b.id}]);s.tick(Math.max(0,a.attackUntil-g.realtime.time)+.05);assert(a.activity);g.units=g.units.filter(u=>u.id!==b.id);const hp=a.hp;s.tick(1);assert.equal(a.hp,hp);assert(!a.activity);pass('Targets removed during windup cause a harmless cancellation instead of duplicate damage');
 s.dispose();
}
{
 const g=field('RT-ECONOMY',1);applyAction(g,g.players[0],{type:'found',unit:g.units.find(u=>u.type==='settler').id});const s=new RealtimeSimulation(g),p=g.players[0],u=g.units.find(u=>!UNITS[u.type].civilian),c=g.cities[0],startGold=p.gold,startTurn=g.turn;
 s.enqueue(p,[{type:'fortify',unit:u.id}]);s.tick(2);assert(u.healUntil>g.realtime.time);assert(!u.acted);s.tick(17.9);assert.equal(g.turn,startTurn);assert.equal(p.gold,startGold);s.tick(.1);assert.equal(g.turn,startTurn+1);assert(p.gold!==startGold);pass('Production/research/income settle every 20 game seconds, while fortification permits movement and limits repeated healing');
 const invalid=JSON.parse(serialize(g));invalid.realtime.time=Infinity;assert.throws(()=>migrateRealtime(invalid));const forged=restore(serialize(g));forged.units[0].activity={action:{type:'move'},started:g.realtime.time,ends:21,path:[0,999999],index:1,from:0,to:999999};assert.throws(()=>migrateRealtime(forged));pass('Clock, queue, movement and cooldown data are validated before save migration');s.dispose();
}
{
 const g=field('RT-STALE',2);let finish;const pending=new Promise(resolve=>{finish=resolve;});const s=new RealtimeSimulation(g,{execute:()=>pending,maxDrivers:1});s.play();await s.plan();assert.equal(s.jobs.size,1);s.pause();const time=g.realtime.time;finish({orders:[{type:'research',item:'pottery'}],memory:{bad:'stale'},ms:1,stderr:''});await Promise.all([...s.jobs.values()]);assert.equal(g.realtime.time,time);assert.equal(g.realtime.queues[0]?.length||0,0);assert.equal(g.players[0].memory,null);pass('Pause freezes simulation; outstanding decisions are discarded after a generation change');s.dispose();
}
{
 const g=field('RT-FOG',2),s=new RealtimeSimulation(g),p=g.players[0],q=g.players[1],u=g.units.find(u=>u.owner===1&&!UNITS[u.type].civilian),move=reachable(g,q,u,true).find(m=>m.path.length>=3);assert(move);s.enqueue(q,[{type:'move',unit:u.id,tile:move.tile}]);s.tick(.05);p.visible=[u.tile];p.explored=[u.tile];assert.equal(snapshot(g,0).units.find(e=>e.id===u.id).activity,null);assert.equal(observation(g,p).enemies.find(e=>e.id===u.id).activity,null);assert.equal(s.state(0).players.length,1);assert(!snapshot(g,0).realtime.queues);pass('Fog views conceal enemy routes, queued commands and decision status');s.dispose();
}
{
 const pool=new NativeDriverPool(),g=createGame({seed:'RT-NATIVE-SOAK',players:8,size:'small',barbarians:true,maxTurns:500}),s=new RealtimeSimulation(g,{execute:(p,o)=>pool.execute(p,o)});let peakActiveOwners=0,start=performance.now();
 try{for(let cycle=0;cycle<100;cycle++){for(let batch=0;batch<4;batch++)await s.plan({force:true});s.tick(2);peakActiveOwners=Math.max(peakActiveOwners,new Set(g.units.filter(u=>u.activity).map(u=>u.owner)).size);if(cycle===8){const clone=new RealtimeSimulation(restore(serialize(g)));assert.equal(clone.game.realtime.time,g.realtime.time);clone.dispose();}}
  assert.equal(g.turn,11);assert(g.players.every(p=>p.driver.calls>=90&&p.driver.failures===0));assert.equal(pool.spawnCount,8);assert(s.stats.peakDrivers<=2);assert(peakActiveOwners>=4);assert(g.units.every(u=>Number.isFinite(u.hp)&&g.map.tiles[u.tile]));metrics.native={milliseconds:Math.round(performance.now()-start),calls:g.players.reduce((n,p)=>n+p.driver.calls,0),processSpawns:pool.spawnCount,peakActiveOwners,stats:s.stats,units:g.units.length,cities:g.cities.length};pass('Eight native C++ strategies complete 200 seconds / ten economy periods with persistent processes, bounded concurrency and overlapping actions');
 }finally{s.dispose();pool.dispose();}
}
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));pass('Current autosave remains byte-exact; no game server or desktop was launched');
await writeFile(new URL('../output/realtime-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics},null,2));
