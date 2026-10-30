import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {ObservationPool} from '../src/observation-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {carrierField} from './carrier-check.mjs';
const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);},pool=new ObservationPool(2),metrics={};
try{
 const {g,p,carrier,plane}=carrierField();E.applyAction(g,p,{type:'rebase',unit:plane.id,tile:carrier.tile,carrier:carrier.id});const expected=E.observation(g,p),actual=await pool.prepare(g,p);assert.deepEqual(actual,expected);assert.equal(pool.workers.length,1);assert.equal(g.units.find(u=>u.id===plane.id),plane);
 pass('Detached worker observation matches authoritative legal actions, fog, carrier groups, strength previews and native route hints exactly');
 const saved=await readFile(new URL('../output/performance-audit-20261009/live-input.json',import.meta.url),'utf8'),world=E.restore(saved),player=world.players[9];let beats=0,maxGap=0,last=performance.now();const timer=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;beats++;},10);
 try{const start=performance.now(),job=pool.prepare(world,player);metrics.mainThreadCloneMs=performance.now()-start;const worker=await job;metrics.totalMs=performance.now()-start;assert(beats>=3);assert.deepEqual(worker,E.observation(world,player));metrics.timerBeats=beats;metrics.maxTimerGapMs=maxGap;}finally{clearInterval(timer);}
 pass('Real captured twelve-nation AI preparation leaves the server event loop responsive and matches synchronous results');
 const controlled=carrierField(),sim=new RealtimeSimulation(controlled.g,{prepareObservation:(game,p)=>pool.prepare(game,p),execute:async()=>({orders:[],memory:null,ms:1,stderr:''})});controlled.p.manual=false;await sim.plan({force:true});assert.equal(controlled.p.driver.status,'ready');assert.equal(controlled.p.driver.failures,0);sim.dispose();assert(pool.workers.length<=2);
 pass('The real realtime planning pipeline awaits bounded observation workers and preserves driver success accounting');
 const late=pool.prepare(world,player);pool.dispose();await assert.rejects(late,/disposed/);await assert.rejects(pool.prepare(world,player),/disposed/);
 pass('Disposal rejects outstanding copies and prevents worker resurrection or late authoritative orders');
 await writeFile(new URL('../output/observation-worker-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');console.log(JSON.stringify(metrics));
}finally{pool.dispose();}
