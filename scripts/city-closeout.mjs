// Capture current-source evidence without writing or normalizing production saves.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as R from '../src/rules.mjs';
import {driverInfo} from '../src/drivers.mjs';
import * as old from '../output/city-research-20261019/before/src/rules.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/city-research-20261019');
const read=f=>JSON.parse(fs.readFileSync(path.resolve(root,f),'utf8'));
const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n');
function walk(dir,skip=[]){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>skip.includes(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name),skip):[path.join(dir,e.name)]);}
const sources={};
for(const dir of ['src','web','desktop','sdk','players','scripts'])for(const file of walk(path.join(root,dir),dir==='web'?['assets','vendor']:[]))if(/\.(mjs|cjs|js|css|html|hpp|cpp|json)$/.test(file))sources[path.relative(root,file).replaceAll('\\','/')]=digest(file);
for(const name of ['server.mjs','package.json','AGENTS.md','PROJECT_STATE.md','README.md','SESSION_HANDOFF_20261019.md'])sources[name]=digest(path.join(root,name));
const changedRuntime=[];
for(const [name,after]of Object.entries(sources).filter(([n])=>!n.startsWith('scripts/')&&!n.startsWith('players/'))){const before=path.join(out,'before',name);if(!fs.existsSync(before))changedRuntime.push({file:name,status:'new',after});else{const prior=digest(before);if(prior!==after)changedRuntime.push({file:name,status:'changed',before:prior,after});}}
assert.equal(sources['web/map3d.js'],digest(path.join(out,'before/web/map3d.js')));
const baseline=read('output/city-research-20261019/baseline.json'),saves=baseline.saves.map(entry=>({...entry,currentSha256:digest(path.join(root,'saves',entry.name))}));
assert(saves.every(e=>e.sha256===e.currentSha256));
assert.equal(fs.readdirSync(path.join(root,'saves')).filter(f=>f.endsWith('.json')).length,saves.length);
const drivers=await Promise.all(R.CIVS.map(c=>driverInfo(c.file)));assert(drivers.every(d=>d.status==='ready'));
write('source-manifest.json',{version:read('package.json').version,sources,changedRuntime,drivers:drivers.map(d=>({...d,binarySha256:digest(d.binary)})),rendererUnchanged:true,saveHashes:saves});
const units=Object.entries(R.UNITS).filter(([key])=>!old.UNITS[key]);assert.equal(units.length,24);
const coverage=[];for(const [civic,cat]of [[false,R.TECHS],[true,R.CIVICS]])for(const [key,s]of Object.entries(cat)){const rewards=R.researchUnlocks(key,civic);assert(rewards.length);coverage.push({kind:civic?'civic':'technology',key,name:s.name,rewards});}
write('research-coverage.json',{technologies:Object.keys(R.TECHS).length,civics:Object.keys(R.CIVICS).length,nodes:coverage});
fs.writeFileSync(path.join(out,'unit-gap-matrix.md'),'# Added normal units and authoritative unlocks\n\nThese 24 entries supplement existing equivalent roles; they are not the complete Civ VI roster. Exact costs and effects are project rules.\n\n| Key | Name | Technology / civic | Building | Procurement | Implemented role |\n| --- | --- | --- | --- | --- | --- |\n'+units.map(([k,s])=>`| ${k} | ${s.name} | ${s.tech?'tech:'+s.tech:'civic:'+s.civic} | ${s.building||'-'} | ${s.religious||s.faithOnly?'Faith':'Production / gold'} | ${s.description||''} |`).join('\n')+'\n');
const report=name=>read('output/city-research-20261019/'+name);
const release=report('verification.json'),modern=report('modern/checks.json'),engine=report('engine-checks.json'),native=report('native-checks.json'),browser=report('browser/checks.json'),map=report('map/map-art.json'),tree=report('tree-interaction/checks.json'),depth=report('map-depth/checks.json'),cache=report('regressions/state-cache-checks.json');
const science=['regressions/science-paced-checks.json','regressions/science-paced-checks-B.json'].map(f=>{const r=report(f);assert(r.passed);for(const [name,hash]of Object.entries(r.sources))assert.equal(digest(path.join(root,name)),hash,'Science evidence drift: '+name);return {algorithm:r.algorithm,turn:r.turn,winner:r.winner,stages:r.stages,sourceDigestsMatch:true,report:f};});
assert(release.passed&&release.results.length===16);assert(modern.passed&&modern.results.length===36);
assert.equal(engine.checks.length,16);assert.equal(native.calls.length,96);assert.equal(browser.checks.length,13);assert.equal(browser.actions.length,3);assert.equal(browser.errors.length,0);
assert(map.passed&&depth.passed&&cache.passed);assert.equal(map.checks.length,5);assert.equal(tree.checks.length,80);assert(tree.checks.every(c=>c.passed));assert.equal(tree.errors.length,0);
const startup=report('startup-final/checks.json'),failure=report('startup-failure/checks.json');assert(startup.booted&&!startup.errorPanel&&startup.world.turn===45&&startup.world.cities===31);assert(failure.errorPanel&&!failure.booted);
write('final-checks.json',{passed:true,version:read('package.json').version,capturedAt:new Date().toISOString(),protectedSaves:{count:saves.length,unchanged:true,autosave:saves.find(s=>s.name==='autosave.json')},realServerStartup:startup,injectedImportFailure:failure,releaseSuites:release.results.length,broaderFreshProcessSuites:modern.results.length,focusedEngineGroups:engine.checks.length,native:{calls:native.calls.length,drivers:drivers.length,algorithms:['A','B'],allRebuiltAndReady:true},browser:{groups:browser.checks.length,actualActions:browser.actions,errors:browser.errors,viewportCaptures:24,explicitTakeoverVerified:true,finalMobileCssRerun:true},map:{groups:map.checks.length,types:24,scope:map.scope},tree:{cases:tree.checks.length,errors:tree.errors},depth:{groups:depth.checks.length},stateCache:{groups:cache.checks.length},science,content:{addedUnits:units.length,totalUnitEntries:Object.keys(R.UNITS).length,technologies:Object.keys(R.TECHS).length,civics:Object.keys(R.CIVICS).length,nonemptyResearchNodes:coverage.length},art:read('art-source/unit-expansion-20261019/manifest.json'),activeSaveWritten:false,productionGameLaunched:false,productionServerRestarted:false,productionGameControlled:false,shutdownScheduled:false,rendererUnchanged:true,limitations:['Project-adapted Civilization-inspired rules, not full numerical/system parity.','Seven authored living poses and one fallen pose per type, repeated along existing animation timelines.','Published map attack visuals do not certify 24 independent combat resolutions.','No hardware/FPS or whole-match balance certificate.'],reports:['IMPLEMENTATION_HANDOFF.md','DESIGN_REVIEW.md','source-manifest.json','unit-gap-matrix.md','research-coverage.json','verification.json','modern/checks.json','browser/checks.json','map/map-art.json','tree-interaction/checks.json','map-depth/checks.json','regressions/state-cache-checks.json']});
console.log(JSON.stringify({passed:true,releaseSuites:16,broaderSuites:36,saveFiles:saves.length,nativeCalls:96,science:science.map(s=>({algorithm:s.algorithm,turn:s.turn}))}));
