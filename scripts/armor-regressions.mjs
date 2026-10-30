import assert from 'node:assert/strict';
import {cp,mkdir,readdir,readFile,writeFile,appendFile,symlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {listDrivers,ROOT} from '../src/drivers.mjs';
import {CIVS} from '../src/rules.mjs';
// Frozen regression workspace prevents a legitimately advancing desktop autosave from invalidating read-only tests.
assert((await listDrivers()).filter(d=>CIVS.some(c=>c.file===d.file)).every(d=>d.status==='ready'));
const modern=process.argv.includes('--modern'),air=process.argv.includes('--air'),production=modern||air||process.argv.includes('--production'),profile=modern?'modern':air?'air':production?'production':'armor';
const resume=process.argv.includes('--resume')?JSON.parse(await readFile(path.join(ROOT,'output',profile+'-regression-status.json'),'utf8')):null;
const label=profile+'-regressions-'+Date.now(),workspace=resume?.workspace||path.join(ROOT,'output',label),log=path.join(ROOT,'output',profile+'-ai-regressions.log');
const runLog=path.join(workspace,'regressions.log');
await mkdir(workspace,{recursive:true});for(const folder of ['src','sdk','players','bin','scripts'])await cp(path.join(ROOT,folder),path.join(workspace,folder),{recursive:true});
if(!resume)await symlink(path.join(ROOT,'tools'),path.join(workspace,'tools'),'junction');
for(const folder of ['output','saves','web'])await mkdir(path.join(workspace,folder),{recursive:true});
for(const file of await readdir(path.join(ROOT,'web'),{withFileTypes:true}))if(file.isFile())await cp(path.join(ROOT,'web',file.name),path.join(workspace,'web',file.name));
for(const file of await readdir(path.join(ROOT,'output'),{withFileTypes:true}))if(file.isFile()&&file.name.endsWith('.json'))await cp(path.join(ROOT,'output',file.name),path.join(workspace,'output',file.name));
for(const file of ['performance-audit-20261009/live-input.json','full-game-baseline/parallel-wonder-input.json','full-game-final/checkpoint.json','full-game-fixed/checkpoint.json','full-game-result/failure-state.json','full-game-victory/issue-11-turn-476.json','full-game-complete/issue-3-turn-280.json','full-game-complete/issue-9-turn-306.json']){await mkdir(path.dirname(path.join(workspace,'output',file)),{recursive:true});await cp(path.join(ROOT,'output',file),path.join(workspace,'output',file));}
const input=JSON.parse(await readFile(path.join(ROOT,'output',modern?'air-warfare-inspection.json':air?'air-recruitment-inspection.json':production?'production-balance-inspection.json':'armor-ai-inspection.json'),'utf8'));
await cp(path.join(ROOT,input.file),path.join(workspace,'saves','autosave.json'));
// Normalize legacy visible caches once in the copied fixture, preserving the original input.
const fixtureEngine=await import(pathToFileURL(path.join(workspace,'src','engine.mjs')));
const fixtureSave=path.join(workspace,'saves','autosave.json');await writeFile(fixtureSave,fixtureEngine.serialize(fixtureEngine.restore(await readFile(fixtureSave,'utf8'))));
await writeFile(path.join(workspace,'package.json'),'{"type":"module"}\n');await writeFile(runLog,'Frozen workspace: '+workspace+'\n');
const suites=['armor-ai','combat-ai','coastal-combat','domestic-defense','ai-coordination','unit-upgrade','queue-backpressure','builder-routing','long-game-ai','resource-queue','elimination-war','committed-gold','city-memory','campaign','warfare','truce','realtime','medical','siege-aviation','seafaring','occupancy','city-combat','driver','diplomacy-strategy'];
if(modern)suites.unshift('review-ai','urgent-scheduling','air-recruitment','joint-war','carrier','observation-worker','tactical-combat','strategic-resource','military-pay','naval-warfare','air-warfare');if(production)suites.unshift('production-balance');if(air)suites.unshift('air-recruitment');
const results=resume?.results.filter(r=>r.code===0)||[];
for(const name of suites){if(results.some(r=>r.name===name&&r.code===0))continue;const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(workspace,'scripts',name+'-check.mjs')],{cwd:workspace,windowsHide:true}),chunks=[];child.stdout.on('data',b=>chunks.push(b));child.stderr.on('data',b=>chunks.push(b));child.on('error',reject);child.on('close',code=>resolve({name,code,output:Buffer.concat(chunks).toString()}));});results.push({name,code:result.code});await appendFile(runLog,'RUN '+name+'\n'+result.output);await cp(runLog,log);await writeFile(path.join(ROOT,'output',profile+'-regression-status.json'),JSON.stringify({workspace,results},null,2));assert.equal(result.code,0,result.output);await cp(path.join(workspace,'output',name+'-checks.json'),path.join(ROOT,'output',name+'-checks.json'));console.log('PASS '+name);}
if(modern)await cp(path.join(ROOT,'server.mjs'),path.join(workspace,'server.mjs'));
const sources=modern?Object.fromEntries(await Promise.all(['src/engine.mjs','src/warfare.mjs','src/peace-terms.mjs','src/rules.mjs','src/world.mjs','src/river-network.mjs','src/realtime.mjs','src/air-warfare.mjs','src/carrier-groups.mjs','src/observation-worker.mjs','src/observation-pool.mjs','server.mjs','src/campaign.mjs','src/military-economy.mjs','src/politics.mjs','sdk/civ.hpp','scripts/review-ai-check.mjs','scripts/urgent-scheduling-check.mjs','scripts/air-recruitment-check.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(path.join(workspace,file))).digest('hex')]))):undefined;
await writeFile(path.join(ROOT,'output',profile+'-regression-summary.json'),JSON.stringify({passed:true,workspace,input:input.file,sources,suites:results,gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
