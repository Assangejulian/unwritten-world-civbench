import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const out=new URL('../output/resume-pause-20261016/',import.meta.url);await fs.mkdir(out,{recursive:true});
const original=await fs.readFile(new URL('../saves/autosave.json',import.meta.url));await fs.writeFile(new URL('autosave-before.json',out),original);
const live=await fetch('http://127.0.0.1:43821/api/save').then(r=>r.text());await fs.writeFile(new URL('live-before.json',out),live);
console.log('Live capture hash',createHash('sha256').update(live).digest('hex'));
let sim;
try {const g=E.restore(live);sim=new RealtimeSimulation(g);console.log('Restored',g.turn,g.realtime.time,g.realtime.nextEconomy);sim.play();for(let i=0;i<50;i++)sim.tick(.05);console.log('Advanced',g.turn,g.realtime.time);}
catch(error){console.error(error.stack);await fs.writeFile(new URL('reproduction-error.txt',out),error.stack);process.exitCode=1;}
finally{sim?.dispose();}
