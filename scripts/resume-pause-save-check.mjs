import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {restore,serialize} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const input=process.argv[2],report=process.argv[3];
if(!input||!report)throw Error('Usage: node scripts/resume-pause-save-check.mjs <save-copy> <report.json>');
const bytes=await fs.readFile(input),hash=b=>createHash('sha256').update(b).digest('hex');
const game=restore(bytes.toString('utf8')),pool=new NativeDriverPool(),errors=[],checkpoints=[];
const start={turn:game.turn,time:game.realtime.time},started=performance.now();
const sim=new RealtimeSimulation(game,{execute:(p,o)=>pool.execute(p,o),onEconomy:()=>{
 const checkpoint=restore(serialize(game)),copy=new RealtimeSimulation(checkpoint);
 copy.dispose();checkpoints.push({turn:game.turn,time:game.realtime.time,commanders:game.units.filter(u=>u.greatPerson).map(u=>u.greatPerson)});
 console.log('PASS saved-game economy and restore at turn '+game.turn);
}});
try{
 for(let cycle=0;cycle<60&&!game.winner;cycle++){
  for(let batch=0;batch<6;batch++)await sim.plan({force:true});
  sim.tick(2);
  for(const p of game.players)if(p.driver.status==='error')errors.push({player:p.id,message:p.driver.message});
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 assert(game.turn>=start.turn+6,'The real save must advance at least six economic periods');
 assert.equal(hash(await fs.readFile(input)),hash(bytes),'The input save copy must remain unchanged');
 await fs.writeFile(report,JSON.stringify({ok:true,start,end:{turn:game.turn,time:game.realtime.time},seconds:(performance.now()-started)/1000,inputSha256:hash(bytes),nativeProcesses:pool.spawnCount,checkpoints,errors},null,2));
 console.log('PASS native AI save continuation: '+start.turn+' -> '+game.turn+'; input unchanged');
}finally{sim.dispose();pool.dispose();}
