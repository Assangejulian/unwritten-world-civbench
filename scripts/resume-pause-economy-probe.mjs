import fs from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {indexMap} from '../src/world.mjs';
const out=new URL('../output/resume-pause-20261016/',import.meta.url);
for(const file of ['autosave-before.json','live-before.json']){
 const g=JSON.parse(await fs.readFile(new URL(file,out),'utf8'));g.map=indexMap(g.map);
 try{for(let i=0;i<6;i++){console.log(file,'economy',g.turn);E.finishTurn(g,{actions:false});}console.log('OK');}catch(error){console.error(error.stack);await fs.writeFile(new URL(file+'.economy-error.txt',out),error.stack);}
}
