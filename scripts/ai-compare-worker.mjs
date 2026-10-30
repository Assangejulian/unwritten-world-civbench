import assert from 'node:assert/strict';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {digest, quantiles} from './ai-compare.mjs';

const [mode, root, configFile, ...args] = process.argv.slice(2);
const config = JSON.parse(await readFile(configFile, 'utf8'));
const load = file => import(pathToFileURL(path.join(root, file)).href);
const engine = await load('src/engine.mjs'), rules = await load('src/rules.mjs');
const {RealtimeSimulation, STEP, ECONOMY_PERIOD} = await load('src/realtime.mjs');
const {NativeDriverPool} = await load('src/driver-pool.mjs');
const {driverInfo} = await load('src/drivers.mjs');
assert(Object.hasOwn(rules.MAP_SIZES, config.size), 'Unknown map size');
assert.equal(STEP,.05,'Physical clock incompatible with this comparison model');
assert.equal(ECONOMY_PERIOD,20,'Economic clock incompatible with this comparison model');
const hashFile = async file => digest(await readFile(path.join(root, file)));
async function provenance(g) {
  const files = ['package.json', 'sdk/civ.hpp'];
  const scan=async dir=>{for(const entry of (await readdir(path.join(root,dir),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=dir+'/'+entry.name;if(entry.isDirectory())await scan(file);else if(entry.isFile())files.push(file);}};await scan('src');
  for (const file of (await readdir(path.join(root,'web'))).sort()) if (/\.(mjs|js)$/.test(file)) files.push('web/' + file);
  const sources = Object.fromEntries(await Promise.all(files.map(async file => [file, await hashFile(file)])));
  const drivers = {};
  for (const file of new Set(g.players.map(p => p.driver.file))) {
    const info = await driverInfo(file); assert.equal(info.status, 'ready', 'Driver must already be built: ' + file);
    drivers[file] = {...info, sourceHash: await hashFile('players/' + file), executableHash: digest(await readFile(info.binary))};
  }
  const tooling = Object.fromEntries(await Promise.all(['ai-compare.mjs','ai-compare-worker.mjs'].map(async file=>[file,digest(await readFile(new URL(file,import.meta.url)))])));
  return {root, sources, drivers, tooling, node: process.version, platform: process.platform, arch: process.arch};
}
const assignments = g => g.players.map(p => ({id: p.id, leaderKey: p.leaderKey, doctrine: p.doctrine, strategy: p.strategy, driver: p.driver.file}));
if (mode === 'prepare') {
  const [seedIndex, rotationText, output] = args, rotation = Number(rotationText), seed = config.seeds[Number(seedIndex)];
  const g = engine.createGame({seed,players:config.players,size:config.size,mapType:config.mapType,gameSpeed:config.gameSpeed,barbarians:config.barbarians,maxTurns:config.maxTurns,autosaveEnabled:false});
  // Rotate geographic formations, retaining each country's identity and native driver.
  const slots = g.players.map(p => g.units.filter(u => u.owner === p.id).map(u => ({type: u.type, tile: u.tile})));
  for (const p of g.players) {
    const target = slots[(p.id + rotation) % g.players.length], own = g.units.filter(u => u.owner === p.id);
    assert.deepEqual(own.map(u => u.type), target.map(u => u.type), 'Opening formations must match to rotate slots');
    own.forEach((u, i) => {u.tile = target[i].tile;});
    p.explored = []; p.visible = []; delete p.knownTiles; delete p.knownCities; delete p.cityAppearances;
  }
  g.map.starts = g.map.starts.slice(rotation).concat(g.map.starts.slice(0, rotation));
  g.id = 'ai-compare-' + digest(seed + ':' + rotation).slice(0,20);
  engine.refreshVisibility(g); const sim = new RealtimeSimulation(g); sim.dispose();
  const initialProvenance=await provenance(g); // Validate all binaries before either arm starts.
  const initial=engine.serialize(g);await writeFile(output,initial);
  await writeFile(output+'.provenance.json',JSON.stringify({initialHash:digest(initial),seed,rotation,assignments:assignments(g),provenance:initialProvenance},null,2));
} else if (mode === 'run') {
  const [input, dir, caseId, arm, repeatText] = args;
  const bytes = await readFile(input), g = engine.restore(bytes.toString('utf8')), initialHash = digest(bytes);
  const initialProvenance=JSON.parse(await readFile(input+'.provenance.json','utf8'));assert.equal(initialProvenance.initialHash,initialHash,'Frozen preparation provenance mismatch');
  assert.equal(g.players.length,config.players); assert.equal(g.maxTurns,config.maxTurns); assert.equal(g.settings.gameSpeed,config.gameSpeed);
  assert.equal(g.settings.barbarians,config.barbarians); assert.equal(g.map.type,config.mapType);
  const pool = new NativeDriverPool(), before = await provenance(g), start = performance.now();
  const schedule = {mode: 'offline-fixed-simulation', decisionSeconds: config.decisionSeconds, tickSeconds:STEP, physicalStep:STEP, economySeconds:ECONOMY_PERIOD, concurrentDrivers:config.driverConcurrency, observation: 'real player perspective', order: 'rotating player batches; responses applied in player order', liveWallClockEquivalent: false};
  const metrics = {driverCalls: 0, submitted: 0, insertedRetained: 0, changedExistingRetained: 0, submittedNotRetainedAfterBatch: 0, malformedSubmitted: 0, admitted: 0, admittedTimed: 0, admittedInstant: 0, admissionRejected: 0, impactRejected: 0, successfulImpactCalls: 0, discardedImpactCalls: 0, peakActive: 0, peakMoving: 0, peakNation: 0};
  const admissionWaits = [], queueAges = [], combatWaits = [], executionTimes = [], rejects = [], timeline = [], trace = [], intents = new Map();
  const decisionTrace = createHash('sha256');
  const driverMilliseconds=[];
  const finance = new Map(g.players.map(p => [p.id, {defaultEpisodes: 0, recoveryEpisodes: 0, periodsInDefault: 0, inDefault: false}]));
  const sim = new RealtimeSimulation(g, {onRejected: e => {if (e.stage === 'admission') metrics.admissionRejected++; else metrics.impactRejected++; if (rejects.length < 100) rejects.push({...e});}});
  const enqueue = sim.enqueue.bind(sim);
  sim.enqueue = (p,orders,options) => {
    const oldRejected=sim.stats.rejected,result=enqueue(p,orders,options);
    metrics.malformedSubmitted+=sim.stats.rejected-oldRejected;
    for(const q of g.realtime.queues[p.id]||[]){const signature=JSON.stringify(q.action),old=intents.get(q.id);if(!old||old.signature!==signature)intents.set(q.id,{signature,since:g.realtime.time});}
    return result;
  };
  const startAction = sim.start.bind(sim), complete = sim.complete.bind(sim);
  sim.start = (p, action) => {
    const q = g.realtime.queues[p.id]?.find(e => e.action === action), result = startAction(p, action);
    if (result && q) {metrics.admitted++; const wait = Math.max(0, g.realtime.time - (intents.get(q.id)?.since ?? q.queuedAt ?? g.realtime.time)); admissionWaits.push(wait); queueAges.push(Math.max(0,g.realtime.time-(q.queuedAt??g.realtime.time))); if (['attack', 'cityAttack', 'nuke'].includes(action.type)) combatWaits.push(wait); if ((action.unit !== undefined ? g.units.find(u => u.id === action.unit) : g.cities.find(c => c.id === action.city))?.activity) metrics.admittedTimed++; else metrics.admittedInstant++;}
    return result;
  };
  sim.complete = entity => {
    const a = entity.activity, prior = sim.stats.rejected;
    const discarded = a && (a.owner !== entity.owner || entity.hp <= 0 || entity.type && !g.units.includes(entity));
    complete(entity);
    if (!a) return;
    if (discarded) metrics.discardedImpactCalls++;
    else if (prior === sim.stats.rejected) {metrics.successfulImpactCalls++; executionTimes.push(g.realtime.time - a.started);}
  };
  function sample() {
    const nations = g.players.map(p => {
      const state = engine.militaryFinance(g,p), f = finance.get(p.id), insolvent = state.arrears > 0 || state.unpaidPeriods > 0;
      if (insolvent) f.periodsInDefault++;
      if (!f.inDefault && insolvent) f.defaultEpisodes++;
      if (f.inDefault && !insolvent) f.recoveryEpisodes++;
      f.inDefault = insolvent;
      return {id:p.id,alive:p.alive,cities:g.cities.filter(c=>c.owner===p.id).length,units:g.units.filter(u=>u.owner===p.id).length,gold:p.gold,finance:state,defaultEpisodes:f.defaultEpisodes,recoveryEpisodes:f.recoveryEpisodes,periodsInDefault:f.periodsInDefault,techs:p.techs.length,civics:p.civics.length,spaceStage:p.spaceStage,victory:engine.victoryProgress(g,p)};
    });
    timeline.push({turn:g.turn,time:g.realtime.time,winner:g.winner,nations});
    trace.push(digest(engine.serialize(g)));
    const liveQueueIds=new Set(Object.values(g.realtime.queues).flatMap(q=>q.map(e=>e.id)));for(const id of intents.keys())if(!liveQueueIds.has(id))intents.delete(id);
  }
  try {
    sample(); const initialTurn = g.turn;
    for (let period = 0; period < config.periods && !g.winner; period++) {
      for (let slice = 0; slice < 20 / config.decisionSeconds && !g.winner; slice++) {
        const living = g.players.filter(p=>p.alive), offset = (period + slice) % Math.max(1,living.length), order = living.slice(offset).concat(living.slice(0,offset));
        for (let i = 0; i < order.length; i += config.driverConcurrency) {
          const pair = order.slice(i,i+config.driverConcurrency), responses = await Promise.all(pair.map(p=>pool.execute(p,engine.observation(g,p))));
          for (let j = 0; j < pair.length; j++) {
            const p = pair[j], response = responses[j], prior = new Map((g.realtime.queues[p.id]||[]).map(q=>[q.id,JSON.stringify(q.action)]));
            assert(Number.isFinite(response.ms)&&response.ms>=0,'Invalid driver wall-clock duration');driverMilliseconds.push(response.ms);
            decisionTrace.update(JSON.stringify({time:g.realtime.time,player:p.id,orders:response.orders,memory:response.memory}));
            p.memory = response.memory; p.driver.calls++; metrics.driverCalls++; metrics.submitted += response.orders.length; sim.enqueue(p,response.orders);
            const queue = g.realtime.queues[p.id]||[];
            for (const q of queue) {if (!prior.has(q.id)) metrics.insertedRetained++; else if (prior.get(q.id)!==JSON.stringify(q.action)) metrics.changedExistingRetained++;}
            for (const a of response.orders) if (!queue.some(q=>JSON.stringify(q.action)===JSON.stringify(a))) metrics.submittedNotRetainedAfterBatch++;
          }
        }
        for (let step = 0; step < Math.round(config.decisionSeconds/STEP) && !g.winner; step++) {
          sim.tick(STEP); const active = g.units.filter(u=>u.activity);
          metrics.peakActive = Math.max(metrics.peakActive,active.length); metrics.peakMoving = Math.max(metrics.peakMoving,active.filter(u=>['move','rebase'].includes(u.activity.action.type)).length); metrics.peakNation = Math.max(metrics.peakNation,...g.players.map(p=>active.filter(u=>u.owner===p.id).length));
          assert(metrics.peakActive<=24 && metrics.peakMoving<=16 && metrics.peakNation<=4, 'Action caps exceeded');
        }
      }
      sample();
    }
    const after = await provenance(g);
    assert.deepEqual(after.sources,before.sources,'Sources changed during run'); assert.deepEqual(after.drivers,before.drivers,'Driver artifacts changed during run');
    assert.deepEqual(after.tooling,before.tooling,'Comparison tooling changed during run');
    assert.equal(digest(await readFile(input)),initialHash,'Frozen input changed');
    const stepRound=values=>values.map(v=>Math.round(v/STEP)*STEP).map(v=>Number(v.toFixed(3)));
    metrics.admissionLatency = quantiles(stepRound(admissionWaits)); metrics.queueEntryAgeAtAdmission = quantiles(stepRound(queueAges)); metrics.combatAdmissionLatency = quantiles(stepRound(combatWaits)); metrics.segmentExecutionTime = quantiles(stepRound(executionTimes)); metrics.queueDeferredEvents=sim.stats.deferred||0;
    metrics.pendingAtEnd = Object.values(g.realtime.queues).reduce((n,q)=>n+q.length,0); metrics.activeAtEnd = [...g.units,...g.cities].filter(e=>e.activity).length;
    const final = engine.serialize(g);
    const report = {caseId,arm,repeat:Number(repeatText),initialHash,initialProvenanceHash:digest(JSON.stringify(initialProvenance)),assignments:assignments(g),settings:{...g.settings,map:{width:g.map.width,height:g.map.height,type:g.map.type,wrapX:g.map.wrapX},maxTurns:g.maxTurns},schedule,provenance:before,traceHash:digest(JSON.stringify(trace)),decisionTraceHash:decisionTrace.digest('hex'),finalHash:digest(final),metrics,turn:g.turn,completedPeriods:g.turn-initialTurn,finished:!!g.winner,winner:g.winner,termination:g.winner?'victory':'observation-cap',elapsedMs:Math.round(performance.now()-start),wallClock:{driverCallMilliseconds:quantiles(driverMilliseconds),timeoutMilliseconds:2000,smallestTimeoutMargin:driverMilliseconds.length?2000-Math.max(...driverMilliseconds):null},rejections:rejects,nations:timeline.at(-1).nations,activeSaveWritten:false,gameLaunched:false};
    await writeFile(path.join(dir,'final.json'),final); await writeFile(path.join(dir,'timeline.json'),JSON.stringify(timeline,null,2)); await writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));
  } catch (error) {await writeFile(path.join(dir,'failure-state.json'),engine.serialize(g)); throw error;}
  finally {sim.dispose();pool.dispose();}
} else throw Error('Unknown worker mode');
