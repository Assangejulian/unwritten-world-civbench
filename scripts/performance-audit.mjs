import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Session} from 'node:inspector';
import * as E from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {StateTransport} from '../src/state-transport.mjs';

// Profile a captured world only. No running-game commands, saves or gameplay sources are changed.
const directory=new URL('../output/performance-audit-20261009/',import.meta.url),input=await readFile(new URL('live-input.json',directory));
const digest=b=>createHash('sha256').update(b).digest('hex');
const summarize=values=>{const sorted=[...values].sort((a,b)=>a-b);return {count:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))],max:sorted.at(-1)};};
const inspector=new Session();inspector.connect();const post=(method,params={})=>new Promise((resolve,reject)=>inspector.post(method,params,(error,result)=>error?reject(error):resolve(result)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});await post('Profiler.start');
const metrics={inputSha256:digest(input),version:JSON.parse(await readFile(new URL('../package.json',import.meta.url))).version,observations:[],snapshots:[],transport:[],phases:[],ticks:[],planning:[],activeSaveWritten:false,runningGameCommands:false};
const phase=async(name,run)=>{const start=performance.now(),result=await run();metrics.phases.push({name,elapsedMs:performance.now()-start});return result;};
let pool,sim;
try{
 const g=await phase('restore',()=>E.restore(input.toString()));pool=new NativeDriverPool();sim=new RealtimeSimulation(g,{execute:(p,o)=>pool.execute(p,o)});
 metrics.world={turn:g.turn,time:g.realtime.time,mapTiles:g.map.tiles.length,players:g.players.length,living:g.players.filter(p=>p.alive).length,cities:g.cities.length,units:g.units.length};
 const players=g.players.filter(p=>p.alive),largest=players.toSorted((a,b)=>g.units.filter(u=>u.owner===b.id).length-g.units.filter(u=>u.owner===a.id).length)[0];
 metrics.queues=players.map(p=>{const q=g.realtime.queues[p.id]||[],ages=q.map(x=>g.realtime.time-(x.queuedAt??g.realtime.time));return {id:p.id,name:p.short,units:g.units.filter(u=>u.owner===p.id).length,cities:g.cities.filter(c=>c.owner===p.id).length,active:g.units.filter(u=>u.owner===p.id&&u.activity).length,queued:q.length,maxWaitSeconds:ages.length?Math.max(...ages):0};});
 for(const p of players){
  await phase('observation:'+p.id,async()=>{
   const durations=[],jsonTimes=[],calls=[];let obs;
   for(let i=0;i<3;i++){let start=performance.now();obs=E.observation(g,p);durations.push(performance.now()-start);start=performance.now();const text=JSON.stringify(obs);jsonTimes.push(performance.now()-start);if(i===0)calls.push({bytes:Buffer.byteLength(text),actions:obs.legalActions.length});await new Promise(setImmediate);}
   const cold=await pool.execute(p,obs),native=[];for(let i=0;i<3;i++){const start=performance.now(),result=await pool.execute(p,obs);native.push({totalMs:performance.now()-start,driverMs:result.ms,orders:result.orders.length});}
   metrics.observations.push({id:p.id,name:p.short,units:g.units.filter(u=>u.owner===p.id).length,cities:g.cities.filter(c=>c.owner===p.id).length,generateMs:summarize(durations),serializeMs:summarize(jsonTimes),...calls[0],nativeColdMs:cold.ms,nativeWarm:native});
  });
  console.log('MEASURED observation '+p.id);
 }
 for(const view of [-1,largest.id])await phase('snapshot:'+view,()=>{
  const samples=[];let snapshot;
  for(let i=0;i<3;i++){const start=performance.now();snapshot=E.snapshot(g,view,{manualOptionsOnly:true});samples.push(performance.now()-start);}
  const jsonStart=performance.now(),text=JSON.stringify(snapshot);metrics.snapshots.push({view,generateMs:summarize(samples),serializeMs:performance.now()-jsonStart,bytes:Buffer.byteLength(text)});
  if(view===-1)metrics.observerSnapshot=snapshot;
 });
 await phase('transport',()=>{
  const transport=new StateTransport(),view=-1;let start=performance.now();const full=transport.response(g.id,1,view,0,null,()=>E.snapshot(g,view,{manualOptionsOnly:true}));metrics.transport.push({kind:'full',ms:performance.now()-start,bytes:Buffer.byteLength(JSON.stringify(full))});
  for(let revision=2;revision<=7;revision++){g.realtime.time+=.05;g.units[0].hp=Math.max(1,g.units[0].hp-.01);start=performance.now();const delta=transport.response(g.id,revision,view,revision-1,g.id,()=>E.snapshot(g,view,{manualOptionsOnly:true}));metrics.transport.push({kind:'one-unit-delta',ms:performance.now()-start,bytes:Buffer.byteLength(JSON.stringify(delta)),tileChanges:delta.delta?.tiles.length});}
 });
 // Restore an independent copy before timed movement, planning and an economy-boundary sample.
 sim.dispose();sim=new RealtimeSimulation(E.restore(input.toString()),{execute:(p,o)=>pool.execute(p,o)});
 await phase('simulated-20-seconds',async()=>{
  for(let i=0;i<400;i++){const previousTurn=sim.game.turn,start=performance.now();sim.tick(.05);metrics.ticks.push({ms:performance.now()-start,economy:sim.game.turn!==previousTurn});if(i%40===0)await new Promise(setImmediate);}
  for(let round=0;round<3;round++){const start=performance.now();await sim.plan({force:true});metrics.planning.push(performance.now()-start);}
 });
 metrics.tickSummary=summarize(metrics.ticks.map(t=>t.ms));metrics.ordinaryTickSummary=summarize(metrics.ticks.filter(t=>!t.economy).map(t=>t.ms));metrics.economyTicks=metrics.ticks.filter(t=>t.economy);metrics.planningSummary=summarize(metrics.planning);metrics.driverProcessSpawns=pool.spawnCount;metrics.simulationStats=sim.stats;
 await writeFile(new URL('observer-snapshot.json',directory),JSON.stringify(metrics.observerSnapshot));delete metrics.observerSnapshot;delete metrics.ticks;
 const {profile}=await post('Profiler.stop');await writeFile(new URL('backend.cpuprofile',directory),JSON.stringify(profile));
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),totals=new Map();
 for(let i=0;i<(profile.samples||[]).length;i++){const n=nodes.get(profile.samples[i]);if(!n)continue;const f=n.callFrame,key=f.functionName+'|'+f.url+'|'+f.lineNumber,entry=totals.get(key)||{function:f.functionName,file:f.url,line:f.lineNumber+1,selfMs:0};entry.selfMs+=(profile.timeDeltas?.[i]||1000)/1000;totals.set(key,entry);}
 metrics.cpuTop=[...totals.values()].sort((a,b)=>b.selfMs-a.selfMs).slice(0,24);assert.equal(digest(await readFile(new URL('live-input.json',directory))),metrics.inputSha256);
 await writeFile(new URL('backend.json',directory),JSON.stringify(metrics,null,2)+'\n');console.log(JSON.stringify({...metrics,observations:metrics.observations.map(o=>({id:o.id,units:o.units,actions:o.actions,generateMs:o.generateMs,bytes:o.bytes,nativeWarmMs:o.nativeWarm.map(n=>n.totalMs)})),cpuTop:metrics.cpuTop.slice(0,14)},null,2));
}finally{sim?.dispose();pool?.dispose();inspector.disconnect();}
