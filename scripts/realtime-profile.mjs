import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {restore} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const url=new URL('../saves/autosave.json',import.meta.url),before=await readFile(url),g=restore(before.toString()),pool=new NativeDriverPool(),sim=new RealtimeSimulation(g,{execute:(p,o)=>pool.execute(p,o)}),ticks=[],plans=[],baseNativeCalls=g.players.reduce((n,p)=>n+p.driver.calls,0),baseFailures=g.players.reduce((n,p)=>n+p.driver.failures,0);
const summarize=values=>{const sorted=[...values].sort((a,b)=>a-b);return {count:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)};};
try{
 for(let cycle=0;cycle<20&&!g.winner;cycle++){
  const planning=performance.now();for(let batch=0;batch<4;batch++)await sim.plan({force:true});plans.push(performance.now()-planning);
  for(let frame=0;frame<40;frame++){const start=performance.now();sim.tick(.05);ticks.push(performance.now()-start);}
 }
 const result={mapTiles:g.map.tiles.length,units:g.units.length,cities:g.cities.length,simulatedSeconds:g.realtime.time,tickMilliseconds:summarize(ticks),eightPlayerPlanningMilliseconds:summarize(plans),nativeCalls:g.players.reduce((n,p)=>n+p.driver.calls,0)-baseNativeCalls,nativeCallsTotal:g.players.reduce((n,p)=>n+p.driver.calls,0),newProcessSpawns:pool.spawnCount,stats:sim.stats};
 assert.equal(g.players.reduce((n,p)=>n+p.driver.failures,0),baseFailures,'Performance samples must use successful native decisions');assert((await readFile(url)).equals(before));await writeFile(new URL('../output/realtime-performance.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{sim.dispose();pool.dispose();}
