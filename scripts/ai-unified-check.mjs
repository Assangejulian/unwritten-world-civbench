// One native algorithm: migration, merged safeguards and actual sequential-turn execution.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {AI_ALGORITHM,normalizeAiAlgorithm,operationFor} from '../src/ai.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {CIVS} from '../src/rules.mjs';
import {maxUnitHp} from '../src/air-warfare.mjs';

const out=process.env.AI_CHECK_OUTPUT||'output/unified-ai-20261021';await mkdir(out,{recursive:true});
const checks=[],evidence=[];const pass=name=>{checks.push(name);console.log('PASS '+name);};
for(const input of [undefined,'A','B','unified'])assert.equal(normalizeAiAlgorithm(input),AI_ALGORITHM);
for(const invalid of [null,'C',false,{},''])assert.throws(()=>E.createGame({aiAlgorithm:invalid}));
const canonical=E.createGame({players:4,size:'small',seed:'UNIFIED-MIGRATION',barbarians:false});
for(const legacy of [undefined,'A','B','unified']){
  const save=JSON.parse(E.serialize(canonical));if(legacy===undefined)delete save.settings.aiAlgorithm;else save.settings.aiAlgorithm=legacy;
  save.players[1].aiV2={goal:'science',goalSince:1,ops:[]};
  const loaded=E.restore(JSON.stringify(save));assert.equal(loaded.settings.aiAlgorithm,AI_ALGORITHM);
  assert.deepEqual(loaded.units,canonical.units);assert.equal(loaded.rngState,canonical.rngState);
  assert.deepEqual(loaded.players[1].aiState,{goal:'science',goalSince:1,ops:[]});assert(!Object.hasOwn(loaded.players[1],'aiV2'));
  assert.equal(E.serialize(E.restore(E.serialize(loaded))),E.serialize(loaded));
}
pass('A/B/unmarked saves migrate in memory without moving units, advancing RNG or losing strategic state');
assert.equal(typeof RealtimeSimulation.prototype.switchAlgorithm,'undefined');
const human={manual:true,aiState:{ops:[{members:[9]}]}};assert.equal(operationFor(canonical,human,9),null);
pass('There is no runtime algorithm switch and native operations cannot steer a human/API seat');

const pool=new NativeDriverPool();
try{
  for(const civ of CIVS){
    const p=canonical.players[1];p.driver.file=civ.file;
    const obs=E.observation(canonical,p),replies=[];
    for(const id of ['A','B',AI_ALGORITHM]){const input=structuredClone(obs);input.player.aiAlgorithm=id;replies.push(await pool.execute(p,input));}
    assert.deepEqual(replies[0].orders,replies[1].orders);assert.deepEqual(replies[1].orders,replies[2].orders);
    assert.deepEqual(replies[0].memory,replies[2].memory);
    const unit=obs.units.find(unit=>unit.type==='warrior');assert(unit);
    const remembered=structuredClone(obs);remembered.memory={objectives:{[unit.id]:{city:12345,until:canonical.turn+3}}};
    const reply=await pool.execute(p,remembered);assert.deepEqual(reply.memory.objectives[String(unit.id)],remembered.memory.objectives[unit.id]);
    const war=structuredClone(obs);war.legalActions=[{type:'war',player:0,hint:{warPlan:{declare:true,value:80}}}];
    war.player.finance={arrears:100,projectedUpkeep:10,grossGold:100};war.player.gold=500;
    assert(!(await pool.execute(p,war)).orders.some(a=>a.type==='war'));
    war.player.finance.arrears=0;assert((await pool.execute(p,war)).orders.some(a=>a.type==='war'));
    evidence.push({driver:civ.file,legacyLabelsEquivalent:true,retainedTacticalMemory:true,solvencyGate:true});
  }
}finally{pool.dispose();}
pass('All eight real C++ drivers share one path, retain tactical objectives and honor diplomatic intent plus solvency');

for(const barbarians of [false,true]){
  const game=E.createGame({players:4,size:'small',seed:'UNIFIED-SOAK-'+barbarians,playMode:'turns',barbarians,autosaveEnabled:false}),drivers=new NativeDriverPool();
  let calls=0,concurrent=0,peak=0;const rejected=[];
  const simulation=new GameSimulation(game,{execute:async(p,obs)=>{concurrent++;peak=Math.max(peak,concurrent);try{calls++;return await drivers.execute(p,obs);}finally{concurrent--;}},onRejected:entry=>rejected.push(entry.type)});
  try{
    for(let round=0;round<60&&!game.winner;round++){
      await simulation.endTurn(0,{force:true});
      for(const p of game.players){assert(Number.isFinite(p.gold)&&p.gold>=0);assert.equal(p.driver.failures,0);}
      for(const u of game.units)assert(u.hp>0&&u.hp<=maxUnitHp(u.type));
      if((round+1)%20===0)console.log('SOAK '+JSON.stringify({barbarians,round:game.turn,cities:game.cities.length,calls}));
    }
    assert.equal(peak,1);assert(game.players.slice(1).every(p=>p.driver.calls>0));assert(game.cities.length>=3);
    assert(game.players.slice(1).some(p=>p.techs.length>=3));
    evidence.push({barbarians,turn:game.turn,calls,peakConcurrent:peak,rejected:rejected.length,
      players:game.players.slice(1).map(p=>({id:p.id,cities:game.cities.filter(c=>c.owner===p.id).length,techs:p.techs.length,civics:p.civics.length,units:game.units.filter(u=>u.owner===p.id).length}))});
  }finally{simulation.dispose();drivers.dispose();}
}
pass('Two isolated 60-round games execute real native turns with finite economies and no driver failures');
await writeFile(out+'/unified-checks.json',JSON.stringify({passed:true,checks,evidence,paidRequests:0,productionWrites:false},null,2));
await import('./ai-strategy-check.mjs');
