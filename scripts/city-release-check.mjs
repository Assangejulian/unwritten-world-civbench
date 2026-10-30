import fs from 'node:fs';
import {spawn} from 'node:child_process';
const out='output/city-research-20261019',dir=out+'/verification';fs.mkdirSync(dir,{recursive:true});
const cases=[
 ['engine',['scripts/city-research-check.mjs']],['native',['scripts/city-research-native-check.mjs']],
 ['browser',['scripts/city-research-ui-check.cjs']],['map',['scripts/unit-expansion-map-check.cjs']],
 ['startup',['scripts/startup-production-check.cjs','final']],['startup-failure',['scripts/startup-production-check.cjs','failure']],
 ['realtime',['--import','./scripts/city-regression-fixture.mjs','scripts/realtime-check.mjs']],
 ...['medical','technology-tree','city-combat','unit-upgrade','encounters-faith','world-systems','diplomacy-governors','committed-gold','occupancy'].map(n=>[n,['--import','./scripts/city-regression-fixture.mjs','scripts/'+n+'-check.mjs']])
];
let cursor=0;const results=[];
async function worker(){while(cursor<cases.length){const [name,args]=cases[cursor++],start=Date.now();let log='';const child=spawn(process.execPath,args,{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const code=await new Promise(r=>child.on('exit',r));fs.writeFileSync(dir+'/'+name+'.log',log);results.push({name,code,ms:Date.now()-start,log:dir+'/'+name+'.log'});console.log((code===0?'PASS ':'FAIL ')+name+' '+Math.round((Date.now()-start)/1000)+'s');fs.writeFileSync(out+'/verification-status.json',JSON.stringify({done:results.length,total:cases.length,results},null,2));}}
await Promise.all([worker(),worker()]);fs.writeFileSync(out+'/verification.json',JSON.stringify({results,passed:results.every(r=>r.code===0)},null,2));if(results.some(r=>r.code!==0))process.exitCode=1;
