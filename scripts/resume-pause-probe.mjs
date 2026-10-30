import fs from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {indexMap} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const out=new URL('../output/resume-pause-20261016/',import.meta.url);
for(const file of ['autosave-before.json','live-before.json']){
 const bytes=await fs.readFile(new URL(file,out),'utf8');let sim;
 try{let g;try{g=E.restore(bytes);console.log(file,'full restore OK');}catch(error){console.log(file,'restore:',error.message);g=JSON.parse(bytes);g.map=indexMap(g.map);}
 sim=new RealtimeSimulation(g);console.log('Before',g.turn,g.realtime.time,g.realtime.nextEconomy);sim.play();for(let i=0;i<500;i++)sim.tick(.05);console.log('Advanced',g.turn,g.realtime.time);}
 catch(error){console.error(file,error.stack);await fs.writeFile(new URL(file+'.error.txt',out),error.stack);}
 finally{sim?.dispose();}
}
