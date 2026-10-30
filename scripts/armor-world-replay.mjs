import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {UNITS} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const input=JSON.parse(await readFile(new URL('../output/armor-ai-inspection.json',import.meta.url),'utf8')),g=E.restore(await readFile(new URL('../'+input.file,import.meta.url),'utf8')),pool=new NativeDriverPool(),sim=new RealtimeSimulation(g),start=g.realtime.time,started=performance.now(),trace=[],operations={},observations=[];
let calls=0,maxActive=0,maxMoving=0,maxNation=0;
const startAction=sim.start.bind(sim);sim.start=(p,a)=>{const ok=startAction(p,a);if(ok&&a.unit!==undefined){operations[a.unit]??={};operations[a.unit][a.type]=(operations[a.unit][a.type]||0)+1;}return ok;};
function record(){const armor=g.units.filter(u=>u.owner===input.player&&['tank','modernarmor','mechanized'].includes(u.type));trace.push({time:g.realtime.time,turn:g.turn,armor:armor.map(u=>({id:u.id,hp:u.hp,tile:u.tile,action:u.activity?.action.type})),reportedTank:g.units.find(u=>u.id===1369)?.hp??null});}
try{record();for(let sweep=0;sweep<12&&!g.winner;sweep++){
 const players=g.players.filter(p=>p.alive);for(let i=0;i<players.length;i+=2){const batch=players.slice(i,i+2),obs=batch.map(p=>{const before=performance.now(),o=E.observation(g,p);observations.push(performance.now()-before);return o;}),responses=await Promise.all(batch.map((p,j)=>pool.execute(p,obs[j])));for(let j=0;j<batch.length;j++){batch[j].memory=responses[j].memory;sim.enqueue(batch[j],responses[j].orders);calls++;}}
 for(let step=0;step<20&&!g.winner;step++){sim.tick(.25);const active=g.units.filter(u=>u.activity);maxActive=Math.max(maxActive,active.length);maxMoving=Math.max(maxMoving,active.filter(u=>['move','rebase'].includes(u.activity.action.type)).length);maxNation=Math.max(maxNation,...g.players.map(p=>active.filter(u=>u.owner===p.id).length));assert(maxActive<=24&&maxMoving<=16&&maxNation<=4);assert(g.players.every(p=>p.gold>=0&&Number.isFinite(p.gold)));}
 record();
 }
 const actingArmor=Object.entries(operations).filter(([id])=>trace[0].armor.some(u=>u.id===+id));assert(actingArmor.length>0);assert(operations[1369]?.move>0||operations[1369]?.attack>0,'The reported tank must actually act in the simultaneous world');
 const report={passed:true,world:g.id,input:input.file,periodAtStart:JSON.parse(await readFile(new URL('../'+input.file,import.meta.url),'utf8')).turn,periodAtEnd:g.turn,simulatedSeconds:g.realtime.time-start,calls,maxActive,maxMoving,maxNation,stats:sim.stats,armorOperations:Object.fromEntries(actingArmor),trace,observationMilliseconds:{mean:observations.reduce((s,n)=>s+n,0)/observations.length,max:Math.max(...observations)},wallMilliseconds:performance.now()-started,gameLaunched:false,activeSaveWritten:false};await writeFile(new URL('../output/armor-world-replay-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,simulatedSeconds:report.simulatedSeconds,calls,armorUnitsActing:actingArmor.length,reportedTankActions:operations[1369],reportedTankFinalHp:trace.at(-1).reportedTank,maxActive,maxMoving,maxNation,stats:sim.stats},null,2));
}finally{pool.dispose();sim.dispose();}
