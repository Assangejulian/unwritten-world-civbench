import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const script = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(script), '..');
export const digest = value => createHash('sha256').update(value).digest('hex');
export function parseOptions(args) {
  const options = {baseline: defaultRoot, candidate: defaultRoot, seeds: ['AI-PAIR-A', 'AI-PAIR-B'], rotations: [0, 1], repeats: 2, players: 12, periods: 20, maxTurns: 960, size: 'huge', mapType: 'random', gameSpeed: 'standard', barbarians: false, decisionSeconds: 5, driverConcurrency: 2, workerTimeoutSeconds: 3600};
  const integers = new Set(['repeats', 'players', 'periods', 'maxTurns', 'driverConcurrency', 'workerTimeoutSeconds']);
  const names = new Set([...Object.keys(options), 'out']);
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    assert(args[i].startsWith('--') && names.has(key), 'Unknown option: ' + args[i]);
    const value = args[++i];
    assert(value && !value.startsWith('--'), 'Missing value for ' + key);
    if (integers.has(key) || key === 'decisionSeconds') options[key] = Number(value);
    else if (key === 'rotations') options[key] = value.split(',').map(Number);
    else if (key === 'seeds') options[key] = value.split(',');
    else if (key === 'barbarians') {assert(['true', 'false'].includes(value)); options[key] = value === 'true';}
    else options[key] = value;
  }
  assert(Number.isInteger(options.players) && options.players >= 2 && options.players <= 16, 'Players: 2..16');
  assert(Number.isInteger(options.repeats) && options.repeats >= 2 && options.repeats <= 4, 'Repeats: 2..4');
  assert(Number.isInteger(options.periods) && options.periods >= 1 && options.periods <= 960, 'Periods: 1..960');
  assert(Number.isInteger(options.maxTurns) && options.maxTurns >= 40 && options.maxTurns <= 960, 'maxTurns: 40..960');
  assert(options.periods <= options.maxTurns, 'Observation cap cannot exceed game limit');
  assert([1, 2, 4, 5, 10, 20].includes(options.decisionSeconds), 'Decision cadence must divide 20 simulation seconds');
  assert([1,2].includes(options.driverConcurrency),'Driver concurrency: 1 or 2');
  assert(Number.isInteger(options.workerTimeoutSeconds)&&options.workerTimeoutSeconds>=1&&options.workerTimeoutSeconds<=43200,'Worker timeout: 1..43200 seconds');
  assert(options.seeds.length >= 1 && options.seeds.length <= 8 && options.seeds.every(s => s.length > 0 && s.length <= 100) && new Set(options.seeds).size === options.seeds.length, 'Distinct bounded seeds required');
  assert(options.rotations.length >= 1 && options.rotations.length <= options.players && options.rotations.every(r => Number.isInteger(r) && r >= 0 && r < options.players) && new Set(options.rotations).size === options.rotations.length, 'Distinct valid slot rotations required');
  assert(['random', 'continents', 'pangaea', 'islands'].includes(options.mapType));
  assert(['standard', 'epic', 'marathon'].includes(options.gameSpeed));
  options.baseline = path.resolve(options.baseline); options.candidate = path.resolve(options.candidate);
  options.out = path.resolve(options.out || path.join(defaultRoot, 'output', 'ai-compare-' + Date.now()));
  for (const root of [options.baseline, options.candidate]) {
    const relative = path.relative(root, options.out);
    assert(relative && (relative==='..'||relative.startsWith('..'+path.sep) || path.isAbsolute(relative) || relative.startsWith('output' + path.sep)), 'In-project output must be under output/');
    const ancestor = path.relative(options.out, root);
    assert(ancestor==='..'||ancestor.startsWith('..'+path.sep) || path.isAbsolute(ancestor), 'Output cannot contain a project root');
  }
  return options;
}
export function runWorker(file,args,{timeoutSeconds=3600,cwd=defaultRoot}={}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {windowsHide: true, cwd, detached:process.platform!=='win32', stdio: ['ignore', 'pipe', 'pipe']});
    let output = '',timedOut=false,graceTimer;
    const timer=setTimeout(()=>{timedOut=true;
      graceTimer=setTimeout(()=>{child.unref();child.stdout.destroy();child.stderr.destroy();const error=Error('Owned worker tree did not confirm exit after timeout cleanup; PID '+child.pid);error.kind='worker-timeout-unkilled';reject(error);},5000);
      if(process.platform==='win32'){
      // Kill only this controller-owned worker tree, including its native child sessions.
      const killer=spawn(path.join(process.env.SystemRoot||'C:/Windows','System32/taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});killer.on('error',()=>child.kill('SIGKILL'));killer.on('exit',code=>{if(code!==0)child.kill('SIGKILL');});
    }else{try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}}},timeoutSeconds*1000);
    child.stdout.on('data', b => {output = (output + b).slice(-8000);});
    child.stderr.on('data', b => {output = (output + b).slice(-8000);});
    child.once('error', error=>{clearTimeout(timer);clearTimeout(graceTimer);reject(error);});
    child.once('close', code => {clearTimeout(timer);clearTimeout(graceTimer);if(code===0&&!timedOut)return resolve();const error=Error(timedOut?'Worker exceeded '+timeoutSeconds+'s wall-clock limit.':'Worker failed ('+code+'): '+output);error.kind=timedOut?'worker-timeout':/2000ms|2000 ms|超过.*ms|timed out/i.test(output)?'driver-timeout':'worker-failure';reject(error);});
  });
}
const worker=(args,options)=>runWorker(path.join(path.dirname(script),'ai-compare-worker.mjs'),args,{timeoutSeconds:options.workerTimeoutSeconds});
export function quantiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = q => sorted.length ? sorted[Math.ceil(q * sorted.length) - 1] : null;
  return {samples: sorted.length, p50: pick(.5), p90: pick(.9), max: sorted.at(-1) ?? null};
}
export function compareRuns(runs) {
  const cases = new Map();
  for (const run of runs) {
    const key = run.caseId; const entries = cases.get(key) || []; entries.push(run); cases.set(key, entries);
  }
  return [...cases].map(([caseId, entries]) => {
    const a = entries.filter(e => e.arm === 'baseline'), b = entries.filter(e => e.arm === 'candidate');
    assert(a.length >= 2 && b.length === a.length, 'Both arms require identical repeat counts');
    assert(new Set(entries.map(e => e.initialHash)).size === 1, 'Initial states differ');
    assert(new Set(entries.map(e=>e.initialProvenanceHash)).size===1,'Initial preparation provenance differs');
    assert(new Set(entries.map(e => JSON.stringify(e.schedule))).size === 1, 'Scheduling differs');
    assert(new Set(entries.map(e => JSON.stringify(e.assignments))).size === 1, 'Leader/strategy/driver assignments differ');
    assert(new Set(entries.map(e => JSON.stringify(e.settings))).size === 1, 'Actual settings differ');
    assert(new Set(entries.map(e => JSON.stringify(e.provenance.tooling))).size === 1, 'Comparison tooling changed between runs');
    const reproducible = arm => arm.every(r => r.traceHash === arm[0].traceHash && r.decisionTraceHash === arm[0].decisionTraceHash && r.finalHash === arm[0].finalHash && JSON.stringify(r.metrics) === JSON.stringify(arm[0].metrics) && JSON.stringify(r.provenance.sources) === JSON.stringify(arm[0].provenance.sources) && JSON.stringify(r.provenance.drivers) === JSON.stringify(arm[0].provenance.drivers));
    const stableBaseline = reproducible(a), stableCandidate = reproducible(b);
    const outcomeDeltas=(a[0].nations||[]).map(n=>{const other=(b[0].nations||[]).find(o=>o.id===n.id);assert(other,'Missing country in candidate outcomes');return {id:n.id,score:other.victory.score-n.victory.score,cities:other.cities-n.cities,units:other.units-n.units,gold:other.gold-n.gold,techs:other.techs-n.techs,civics:other.civics-n.civics,spaceStage:other.spaceStage-n.spaceStage,arrears:other.finance.arrears-n.finance.arrears,defaultEpisodes:other.defaultEpisodes-n.defaultEpisodes,recoveryEpisodes:other.recoveryEpisodes-n.recoveryEpisodes};});
    return {caseId, stableBaseline, stableCandidate, comparable: stableBaseline && stableCandidate, identicalOutcome: a[0].finalHash === b[0].finalHash, delta: {admitted: b[0].metrics.admitted - a[0].metrics.admitted, admissionRejected: b[0].metrics.admissionRejected - a[0].metrics.admissionRejected, impactRejected: b[0].metrics.impactRejected - a[0].metrics.impactRejected}, outcomeDeltas, baseline: a[0], candidate: b[0]};
  });
}
export function failureReport(options,runs,activeCase,error,comparison=null){
  const failure={kind:error.kind||'comparison-failure',activeCase,error:error.stack,completedRuns:runs.length};
  return {...(comparison||{options}),passed:false,incomplete:comparison===null,failure,completedRuns:runs};
}
export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {console.log('node scripts/ai-compare.mjs --baseline <root> --candidate <root> --seeds A,B --rotations 0,1 --players 12 --periods 20 --maxTurns 960 --decisionSeconds 5 --repeats 2 --driverConcurrency 2 --workerTimeoutSeconds 3600 --out <unused-directory>'); return;}
  const options = parseOptions(args);
  await mkdir(path.dirname(options.out), {recursive: true});
  await mkdir(options.out); // Existing evidence is never overwritten.
  await writeFile(path.join(options.out, 'config.json'), JSON.stringify(options, null, 2));
  const runs = [];let activeCase=null,comparison=null;
  try {
    for (let si = 0; si < options.seeds.length; si++) for (const rotation of options.rotations) {
      const caseId = 'seed-' + si + '-rotation-' + rotation;
      const input = path.join(options.out, caseId + '-initial.json');
      activeCase={caseId,phase:'prepare',root:options.baseline};
      await worker(['prepare', options.baseline, path.join(options.out, 'config.json'), String(si), String(rotation), input],options);
      for (let repeat = 0; repeat < options.repeats; repeat++) {
        // Alternation reduces systematic wall-clock/hardware ordering bias. Game clocks remain offline.
        const arms = repeat % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate'];
        for (const arm of arms) {
          const dir = path.join(options.out, caseId + '-' + arm + '-' + repeat); await mkdir(dir);
          activeCase={caseId,arm,repeat,phase:'run',root:options[arm],output:dir};
          await worker(['run', options[arm], path.join(options.out, 'config.json'), input, dir, caseId, arm, String(repeat)],options);
          runs.push(JSON.parse(await readFile(path.join(dir, 'report.json'), 'utf8')));
          console.log(JSON.stringify({caseId, arm, repeat, turn: runs.at(-1).turn, finished: runs.at(-1).finished, admitted: runs.at(-1).metrics.admitted}));
        }
      }
    }
    const cases = compareRuns(runs), passed = cases.every(c => c.comparable);
    const median=values=>quantiles(values).p50;
    const outcomeRows=cases.flatMap(c=>c.outcomeDeltas);
    const aggregate={cases:cases.length,countryCaseRows:outcomeRows.length,winnerChangedCases:cases.filter(c=>JSON.stringify(c.baseline.winner)!==JSON.stringify(c.candidate.winner)).length,finishedBaselineCases:cases.filter(c=>c.baseline.finished).length,finishedCandidateCases:cases.filter(c=>c.candidate.finished).length,medianCountryScoreDelta:median(outcomeRows.map(r=>r.score)),medianCountryTechDelta:median(outcomeRows.map(r=>r.techs)),medianCountryArrearsDelta:median(outcomeRows.map(r=>r.arrears)),inference:'Descriptive matched cases only; no better/worse or statistical strength conclusion.'};
    const report = {passed, options, cases,aggregate, scope: 'Offline fixed simulation cadence; does not certify live 1500-ms wall-clock scheduling or desktop FPS. No Elo, policy changes or cross-game memory.'};comparison=report;
    await writeFile(path.join(options.out, 'comparison.json'), JSON.stringify(report, null, 2));
    await writeFile(path.join(options.out, 'REPORT.md'), '# Paired AI comparison\n\n' + 'Reproducible: ' + passed + '. Seeds and rotations: ' + cases.length + '. Runs: ' + runs.length + '.\n\n' + 'Each arm restores the same frozen baseline initial world. This evaluates simulation and AI policy, not differences in map generation. Identity, driver filenames and settings are matched; source and binary hashes are recorded per arm.\n\n' + '| Case | Baseline repeatable | Candidate repeatable | Same final state | Admission delta | Admission rejection delta | Impact rejection delta |\n| --- | --- | --- | --- | --- | --- | --- |\n' + cases.map(c => `| ${c.caseId} | ${c.stableBaseline} | ${c.stableCandidate} | ${c.identicalOutcome} | ${c.delta.admitted} | ${c.delta.admissionRejected} | ${c.delta.impactRejected} |`).join('\n') + '\n\n' + report.scope + '\n\n' + 'Queue retention is measured after a complete native batch. A replaced/evicted/superseded intent is not mislabeled as an illegal action. Admission latency starts when the currently retained intent changes; queue-entry age is reported separately. Latency samples cover actual successful admissions; pending queues are censored and reported separately. Movement completion samples represent completed cell segments, not whole routes. Recovery means arrears and unpaid-period state return to zero. A capped opening is not a full match. See report.json and timeline.json per run for denominators, nation finances/progress and termination.\n');
    await writeFile(path.join(options.out,'TIMING.md'),'# Infrastructure timing\n\nWall-clock values are diagnostic and excluded from deterministic equality. Driver timeout is 2000 ms.\n\n| Case | Arm | Repeat | Calls | P50 ms | P90 ms | Max ms | Minimum margin ms |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n'+runs.map(r=>{const t=r.wallClock.driverCallMilliseconds;return `| ${r.caseId} | ${r.arm} | ${r.repeat} | ${t.samples} | ${t.p50} | ${t.p90} | ${t.max} | ${r.wallClock.smallestTimeoutMargin} |`;}).join('\n')+'\n');
    assert(passed, 'Repeated runs diverged; comparison is not trustworthy');
    await writeFile(path.join(options.out,'OUTCOMES.md'),'# Descriptive outcome deltas\n\n'+JSON.stringify(aggregate,null,2)+'\n\n| Case | Country | Score | Cities | Units | Gold | Techs | Civics | Space | Arrears | Defaults | Recoveries |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n'+cases.flatMap(c=>c.outcomeDeltas.map(r=>`| ${c.caseId} | ${r.id} | ${r.score} | ${r.cities} | ${r.units} | ${r.gold.toFixed(2)} | ${r.techs} | ${r.civics} | ${r.spaceStage} | ${r.arrears.toFixed(2)} | ${r.defaultEpisodes} | ${r.recoveryEpisodes} |`)).join('\n')+'\n\nDriver-call wall-clock quantiles and timeout margins are in each report.json. Defaults cover only two of twelve slots per seed; use all rotations for balanced slot coverage. A +1 gold perturbation is an actual economic change, not an estimate of chaos/noise.\n');
    return report;
  } catch (error) {
    const failed=failureReport(options,runs,activeCase,error,comparison);
    await writeFile(path.join(options.out,'failure.json'),JSON.stringify(failed.failure,null,2));
    await writeFile(path.join(options.out,'comparison.json'),JSON.stringify(failed,null,2));throw error;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === script) main().catch(e => {console.error(e.stack); process.exitCode = 1;});
