import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, cp, mkdir, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseOptions, compareRuns, quantiles, main, digest,runWorker,failureReport} from './ai-compare.mjs';

const checks = [];
function test(name, fn) {fn(); checks.push(name);}
test('Reject invalid cadence, duplicate seeds and unsafe output',()=>{
  assert.throws(()=>parseOptions(['--decisionSeconds','1.5']));
  assert.throws(()=>parseOptions(['--seeds','A,A']));
  assert.throws(()=>parseOptions(['--out',path.resolve('saves/new-output')]));
  assert.throws(()=>parseOptions(['--out',path.resolve('web/new-output')]));
  assert.throws(()=>parseOptions(['--repeats','1']));
  assert.throws(()=>parseOptions(['--rotations','0,0']));
  assert.throws(()=>parseOptions(['--gameSpeed','quick']));
});
test('Empty latency samples are unknown, not fabricated zeros',()=>{
  assert.deepEqual(quantiles([]),{samples:0,p50:null,p90:null,max:null});
  assert.deepEqual(quantiles([4,1,2,3]),{samples:4,p50:2,p90:4,max:4});
});
const base={caseId:'test',initialHash:'same',schedule:{mode:'fixed'},assignments:[{id:0,driver:'x.cpp'}],settings:{maxTurns:960},traceHash:'same',decisionTraceHash:'same',finalHash:'same',metrics:{admitted:2,admissionRejected:0,impactRejected:0},provenance:{sources:{engine:'x'},drivers:{driver:'x'}}};
const entries = () => ['baseline','candidate'].flatMap(arm=>[0,1].map(repeat=>({...structuredClone(base),arm,repeat})));
test('A/A stable repeated evidence is comparable',()=>assert(compareRuns(entries())[0].comparable));
test('Divergent decisions invalidate repeatability even with the same final state',()=>{const runs=entries();runs[3].decisionTraceHash='different';assert.equal(compareRuns(runs)[0].comparable,false);});
test('Source or executable drift between repeats invalidates comparison',()=>{const runs=entries();runs[3].provenance.drivers.driver='changed';assert.equal(compareRuns(runs)[0].comparable,false);});
test('Changing the comparison tool between arms is rejected',()=>{const runs=entries();runs[3].provenance.tooling={worker:'changed'};assert.throws(()=>compareRuns(runs));});
test('Mismatched initial state and roster are rejected',()=>{let runs=entries();runs[3].initialHash='bad';assert.throws(()=>compareRuns(runs));runs=entries();runs[3].assignments=[];assert.throws(()=>compareRuns(runs));});
test('A different stable candidate is a valid comparison, not a demanded tie',()=>{const runs=entries();for(const r of runs.filter(r=>r.arm==='candidate')){r.finalHash='new';r.traceHash='new';r.metrics.admitted=3;}const result=compareRuns(runs)[0];assert(result.comparable);assert.equal(result.identicalOutcome,false);assert.equal(result.delta.admitted,1);});
test('A complete divergent comparison retains its case table and is not marked incomplete',()=>{const runs=entries();runs[3].traceHash='diverged';const cases=compareRuns(runs),comparison={options:{},cases,aggregate:{cases:1}},failed=failureReport({},runs,null,Error('Repeated runs diverged'),comparison);assert.equal(failed.passed,false);assert.equal(failed.incomplete,false);assert.equal(failed.cases[0].stableCandidate,false);assert.equal(failed.completedRuns.length,4);assert.deepEqual(failed.aggregate,comparison.aggregate);});

const dir=await mkdtemp(path.join(tmpdir(),'hex-p3-check-'));
const report=await main(['--seeds','P3-REPRO-CHECK','--rotations','0,1','--players','4','--periods','2','--decisionSeconds','20','--size','small','--out',path.join(dir,'comparison')]);
assert(report.passed);assert(report.cases.every(c=>c.identicalOutcome));
const timingMarkdown=await readFile(path.join(dir,'comparison/TIMING.md'),'utf8');assert(!timingMarkdown.includes('undefined'));
assert(report.cases.every(c=>[c.baseline,c.candidate].every(r=>r.wallClock.smallestTimeoutMargin===2000-r.wallClock.driverCallMilliseconds.max)));
const a=JSON.parse(await readFile(path.join(dir,'comparison/seed-0-rotation-0-baseline-0/final.json'),'utf8'));
const b=JSON.parse(await readFile(path.join(dir,'comparison/seed-0-rotation-1-baseline-0/final.json'),'utf8'));
assert.notDeepEqual(a.map.starts,b.map.starts,'Rotation must actually alter geography assignments');
checks.push('Eight actual native A/A runs repeat exactly across two real slot rotations');
await assert.rejects(()=>main(['--seeds','P3-REPRO-CHECK','--out',path.join(dir,'comparison')]));
checks.push('Existing evidence directory is preserved');
// Controlled fixture perturbation verifies that --candidate really loads the other runtime.
// The extra treasury grant exists only in a temporary probe, never in the project.
const root=path.resolve(import.meta.dirname,'..'),probe=path.join(dir,'probe');await mkdir(probe);
await cp(path.join(root,'src'),path.join(probe,'src'),{recursive:true});await cp(path.join(root,'package.json'),path.join(probe,'package.json'));
for(const folder of ['web','sdk','players','bin','tools'])await symlink(path.join(root,folder),path.join(probe,folder),process.platform==='win32'?'junction':'dir');
const probeRealtime=path.join(probe,'src/realtime.mjs'),source=await readFile(probeRealtime,'utf8'),needle='this.onEconomy(before);';
assert(source.includes(needle));await writeFile(probeRealtime,source.replace(needle,'for(const probePlayer of g.players)probePlayer.gold+=1; '+needle));
const different=await main(['--candidate',probe,'--seeds','P3-CONTROLLED-PROBE','--rotations','0','--players','4','--periods','2','--decisionSeconds','20','--size','small','--out',path.join(dir,'different-runtime')]);
assert(different.passed);assert.equal(different.cases[0].identicalOutcome,false);assert.notEqual(different.cases[0].baseline.provenance.sources['src/realtime.mjs'],different.cases[0].candidate.provenance.sources['src/realtime.mjs']);
checks.push('Four real native A/B runs load a controlled alternate runtime and detect its reproducible difference');
const failureDir=path.join(dir,'partial-failure');
await assert.rejects(()=>main(['--candidate',path.join(dir,'missing-project'),'--seeds','P3-PARTIAL','--rotations','0','--players','4','--periods','1','--decisionSeconds','20','--size','small','--out',failureDir]));
const partial=JSON.parse(await readFile(path.join(failureDir,'comparison.json'),'utf8'));assert.equal(partial.incomplete,true);assert.equal(partial.passed,false);assert.equal(partial.completedRuns.length,1);assert.equal(partial.failure.activeCase.arm,'candidate');
checks.push('A failed candidate retains the completed baseline run and names the failed arm/case');
const hangFile=path.join(dir,'owned-hang.mjs'),pidFile=path.join(dir,'owned-hang-pids.json');
await writeFile(hangFile,"import {spawn} from 'node:child_process'; import {writeFileSync} from 'node:fs'; const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'}); writeFileSync(process.argv[2],JSON.stringify({worker:process.pid,child:child.pid})); setInterval(()=>{},1000);\n");
await assert.rejects(()=>runWorker(hangFile,[pidFile],{timeoutSeconds:1}),error=>error.kind==='worker-timeout');
const ownedPids=JSON.parse(await readFile(pidFile,'utf8'));
for(const pid of Object.values(ownedPids))assert.throws(()=>process.kill(pid,0),'Owned worker tree must exit after timeout');
checks.push('Controller timeout terminates only its own deliberately hung worker and nested child');
const result={passed:true,checks,comparisonDirectory:path.join(dir,'comparison'),comparisonHash:digest(await readFile(path.join(dir,'comparison/comparison.json')))};
await writeFile(new URL('../output/p3-compare-check.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
