// Bounded delivery checks and read-only production-save integrity.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import * as E from '../src/engine.mjs';
import {NATURAL_WONDERS} from '../src/rules.mjs';
const out='output/natural-wonders-real35-20261030',hash=b=>createHash('sha256').update(b).digest('hex');
const before=JSON.parse(fs.readFileSync(out+'/saves-before.json','utf8'));
for(const [file,expected]of Object.entries(before))assert.equal(hash(fs.readFileSync(file)),expected,file+' changed');
const saveCount=fs.readdirSync('saves',{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).length;
assert.equal(saveCount,Object.keys(before).length);
const restored=[];
for(const file of [Object.keys(before).find(f=>f.endsWith('autosave.json')),...Object.keys(before).filter(f=>!f.endsWith('autosave.json')).slice(0,3)]){const g=E.restore(fs.readFileSync(file,'utf8'));assert.equal(g.naturalWonders,undefined);restored.push(file.replaceAll('\\','/'));}
const assets=JSON.parse(fs.readFileSync('art-source/natural-wonders-real35-20261030/manifest.json','utf8'));
assert.equal(assets.assets.length,35);assert.deepEqual(assets.assets.map(a=>a.key).sort(),Object.keys(NATURAL_WONDERS).sort());
assert.deepEqual(fs.readdirSync('web/assets/natural-wonders').filter(f=>f.endsWith('.webp')).sort(),Object.keys(NATURAL_WONDERS).map(k=>k+'.webp').sort());
for(const a of assets.assets){assert.equal(hash(fs.readFileSync(a.source)),a.sourceSha256);assert.equal(hash(fs.readFileSync(a.runtime)),a.runtimeSha256);}
const original=JSON.parse(fs.readFileSync(out+'/sources-before.json','utf8'));
const syntax=[...new Set([...Object.keys(original).filter(f=>/\.(m?js|cjs)$/.test(f)),'src/warfare.mjs','src/natural-wonders.mjs','web/natural-wonder-art.js','scripts/natural-wonders-check.mjs','scripts/natural-wonders-fixture.mjs','scripts/natural-wonders-ui-check.mjs','scripts/natural-wonders-native-check.mjs','scripts/natural-wonders-art-import.cjs','scripts/natural-wonders-release-check.mjs','environment/mcp/check.mjs'])];
for(const file of syntax){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(r.status,0,file+': '+r.stderr.slice(0,500));}
const privacy=spawnSync(process.execPath,['scripts/privacy-check.mjs'],{encoding:'utf8'});assert.equal(privacy.status,0,privacy.stdout+privacy.stderr);
const diff=spawnSync('git',['-c','core.safecrlf=false','diff','--check'],{encoding:'utf8'});assert.equal(diff.status,0,diff.stdout);
const docs=['docs/NATURAL_WONDERS.md','docs/MCP_QUERY_GUIDE.md','docs/README.md','art-source/natural-wonders-20261030/README.md','art-source/natural-wonders-real35-20261030/README.md'];
for(const file of docs)for(const match of fs.readFileSync(file,'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const ref=match[1];if(!/^(?:https?:|#)/.test(ref))assert(fs.existsSync(path.resolve(path.dirname(file),ref.split('#')[0])),file+': '+ref);}
const rules=JSON.parse(fs.readFileSync(out+'/rules.json','utf8')),ui=JSON.parse(fs.readFileSync(out+'/ui/checks.json','utf8')),native=JSON.parse(fs.readFileSync(out+'/native.json','utf8'));
assert(rules.passed&&ui.passed&&native.passed);
const logs={mcp:'regression-mcp.log',climate:'regression-climate.log',climateNative:'regression-climate-native.log',ages:'regression-ages.log',boundary:'regression-boundary.log'};
const markers={mcp:'MCP CHECK PASSED',climate:'"passed":true',climateNative:'"passed":true',ages:'26/26 pass',boundary:'ENVIRONMENT BOUNDARY CHECK PASSED'};
for(const [key,file]of Object.entries(logs))assert(fs.readFileSync(out+'/'+file,'utf8').includes(markers[key]),key+' regression failed');
const heritageBaseline=fs.readFileSync('output/natural-wonders-20261030/baseline-heritage.log','utf8'),heritageCurrent=fs.readFileSync(out+'/regression-heritage.log','utf8');
assert(heritageBaseline.includes('Invalid saved climate state.')&&heritageCurrent.includes('Invalid saved climate state.'));
const coverage=JSON.parse(fs.readFileSync(out+'/coverage.json','utf8')),references=JSON.parse(fs.readFileSync(out+'/source-review.json','utf8'));
assert.equal(coverage.seen,35);assert.equal(references.sites,35);assert.equal(references.allReal,true);
const report={passed:true,scope:'35-real-site focused delivery, not a clean whole-project suite',rules:rules.checks.length,ui:ui.checks.length,actualNativeCalls:native.actualCalls,coverage,primaryReferences:references.sites,regressions:logs,knownRegression:{name:'heritage-check',baselineAndCurrent:'Four groups pass, then Invalid saved climate state in old synthetic map fixture'},syntax:syntax.length,privacy:privacy.stdout.trim(),whitespace:true,docLinks:true,art:{count:assets.assets.length,new:31,reused:4,runtimeBytes:assets.totalRuntimeBytes,hashes:true},productionSaves:{count:saveCount,hashesUnchanged:true,legacyRestored:restored},paidModelCalls:false,liveServerRestarted:false,committed:false,pushed:false};
fs.writeFileSync(out+'/final-checks.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
