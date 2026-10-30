import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
const root=fileURLToPath(new URL('../',import.meta.url)),out=new URL('../output/wonder-lifecycle-ai-20261016/',import.meta.url);
await mkdir(new URL('logs/',out),{recursive:true});
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
async function sources(){const files=['package.json','server.mjs'];for(const dir of ['src','web','sdk','players'])for(const file of await readdir(new URL('../'+dir+'/',import.meta.url),{recursive:true}))if(/\.(mjs|js|css|html|hpp|cpp)$/.test(file))files.push(dir+'/'+file.replaceAll('\\','/'));const result={};for(const file of files.sort())result[file]=await hash(new URL('../'+file,import.meta.url));return result;}
const save=new URL('../saves/autosave.json',import.meta.url),saveBefore=await hash(save),before=await sources();
const tests=['wonder-lifecycle-ai-check.mjs','heritage-check.mjs','heritage-native-check.mjs','beliefs-check.mjs','religion-movement-check.mjs','religion-affiliation-check.mjs','religion-native-check.mjs','ai-v2-focused-check.mjs','ai-algorithm-check.mjs','review-ai-check.mjs','world-systems-check.mjs','realtime-check.mjs','naval-warfare-check.mjs','military-pay-check.mjs','city-combat-check.mjs','leader-rework-check.mjs','state-cache-check.mjs','heritage-map-check.cjs','heritage-ui-check.cjs','religion-ui-check.cjs'];
const results=[];let cursor=0;
async function worker(){while(cursor<tests.length){const script=tests[cursor++],start=performance.now();let output='';const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/'+script],{cwd:root,windowsHide:true});child.stdout.on('data',v=>output+=v);child.stderr.on('data',v=>output+=v);child.on('error',reject);child.on('close',resolve);});await writeFile(new URL('logs/'+script+'.log',out),output);const result={script,code,seconds:Math.round((performance.now()-start)/10)/100,reportedPassLines:output.split('\n').filter(v=>v.startsWith('PASS ')).length};results.push(result);console.log((code===0?'PASS ':'FAIL ')+script+' ('+result.seconds+'s)');if(code!==0)console.log(output.slice(-3000));}}
await Promise.all([worker(),worker()]);
const after=await sources(),saveAfter=await hash(save),unchanged=JSON.stringify(before)===JSON.stringify(after);
const summary={version:'2.29.0',at:new Date().toISOString(),passed:results.every(r=>r.code===0)&&unchanged&&saveBefore===saveAfter,results,sourceUnchangedDuringChecks:unchanged,sourceHashes:after,saveBefore,saveAfter,activeSaveWritten:false,liveGameRestarted:false};
await writeFile(new URL('final-checks.json',out),JSON.stringify(summary,null,2)+'\n');
if(!summary.passed)process.exitCode=1;
console.log(summary.passed?'PASS Final release checks and unchanged active-save bytes':'FAIL Release verification; inspect final-checks.json');
