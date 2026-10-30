import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import {UNITS} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const input=JSON.parse(await readFile(new URL('../output/production-balance-inspection.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../'+input.file,import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
const g=E.restore(bytes.toString()),pool=new NativeDriverPool(),sim=new RealtimeSimulation(g),start=g.realtime.time,trace=[],decisions=[];
let calls=0,maxActive=0,maxMoving=0,maxNation=0;
function record(){const p=g.players[input.player],cities=g.cities.filter(c=>c.owner===p.id);trace.push({time:g.realtime.time,turn:g.turn,army:g.units.filter(u=>u.owner===p.id&&!UNITS[u.type].civilian).length,spaceStage:p.spaceStage,production:Object.fromEntries([...new Set(cities.map(c=>c.production?.item||'idle'))].map(k=>[k,cities.filter(c=>(c.production?.item||'idle')===k).length]))});}
try{record();for(let sweep=0;sweep<12&&!g.winner;sweep++){
 const players=g.players.filter(p=>p.alive);for(let i=0;i<players.length;i+=2){const batch=players.slice(i,i+2),obs=batch.map(p=>E.observation(g,p)),responses=await Promise.all(batch.map((p,j)=>pool.execute(p,obs[j])));
  for(let j=0;j<batch.length;j++){const p=batch[j];p.memory=responses[j].memory;sim.enqueue(p,responses[j].orders);calls++;
   if(p.id===input.player){assert.equal(obs[j].player.plan.goal,'science');const production=responses[j].orders.filter(a=>a.type==='produce').map(a=>({...a,hint:obs[j].legalActions.find(l=>l.type==='produce'&&l.city===a.city&&l.item===a.item&&l.tile===a.tile&&l.fortress===a.fortress)?.hint}));assert(production.every(a=>!['tank','modernarmor'].includes(a.item)||a.hint?.defenseUrgency>0||a.hint?.captureNeeded),'No unneeded rear armor during the replay');decisions.push({time:g.realtime.time,goal:obs[j].player.plan.goal,production});}
  }
 }
 for(let step=0;step<20&&!g.winner;step++){sim.tick(.25);const active=g.units.filter(u=>u.activity);maxActive=Math.max(maxActive,active.length);maxMoving=Math.max(maxMoving,active.filter(u=>['move','rebase'].includes(u.activity.action.type)).length);maxNation=Math.max(maxNation,...g.players.map(p=>active.filter(u=>u.owner===p.id).length));assert(maxActive<=24&&maxMoving<=16&&maxNation<=4);assert(g.players.every(p=>p.gold>=0&&Number.isFinite(p.gold)));}
 record();
 }
 const report={passed:true,world:g.id,input:input.file,sha256:input.sha256,players:g.players.length,livingAtStart:input.alive,calls,simulatedSeconds:g.realtime.time-start,maxActive,maxMoving,maxNation,stats:sim.stats,decisions,trace,gameLaunched:false,activeSaveWritten:false};assert(decisions.length>0);assert(trace.at(-1).production.modernarmor<trace[0].production.modernarmor);assert(trace.at(-1).production.moon===1||g.players[input.player].spaceStage>input.spaceStage);
 await writeFile(new URL('../output/production-world-replay-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,decisions:undefined,trace:[trace[0],trace.at(-1)]},null,2));
}finally{pool.dispose();sim.dispose();}
