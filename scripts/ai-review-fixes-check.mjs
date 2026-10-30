// Cross-review regressions use disposable observations and isolated game worlds.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,mkdtemp} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as AI from '../src/ai.mjs';
import {militaryAssessment} from '../src/strategy.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {CIVS,UNITS,researchCost} from '../src/rules.mjs';
import {STRATEGY_HINT_KEYS} from '../src/environment/catalog.mjs';

const out=process.env.AI_REVIEW_OUTPUT||'output/ai-review-fixes-20261021';await mkdir(out,{recursive:true});
const checks=[];async function check(name,fn){try{await fn();checks.push({name,passed:true});console.log('PASS '+name);}catch(error){checks.push({name,passed:false,error:error.stack});console.error('FAIL '+name+': '+error.message);}}
function world(){
  const g=E.createGame({players:2,size:'small',seed:'AI-REVIEW-FIXES',playMode:'turns',barbarians:false,autosaveEnabled:false});
  g.cityStates={version:1,states:[],seeded:true};g.units=[];
  for(const t of g.map.tiles){Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,cityId:null,owner:null,district:null,improvement:null,camp:false,ruin:false});delete t.cityStateTerritory;}
  for(const p of g.players){p.manual=false;p.met=[1-p.id];E.foundCity(g,p,E.addUnit(g,p.id,'settler',g.map.width*12+12+p.id*12));}
  g.units=[];E.refreshVisibility(g);
  for(const p of g.players)p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,owner:c.owner,name:c.name,tile:c.tile,isCapital:true}]));
  g.players[0].relations[1].status=g.players[1].relations[0].status='war';return g;
}
function troops(g,types){const p=g.players[0],city=g.cities[0];for(let i=0;i<3;i++)E.addUnit(g,p.id,'warrior',city.tile+i+1);return types.map((type,i)=>E.addUnit(g,p.id,type,city.tile+g.map.width*2+i));}
const context={};
await check('Singletons cannot march; timed-out operations retreat and respect retry cooldown',()=>{
  const g=world(),p=g.players[0];troops(g,['warrior']);AI.updateOperations(g,p,context);const op=p.aiState.ops[0];assert(op);assert.equal(op.state,'gather');
  g.turn=op.gatherDeadline;AI.updateOperations(g,p,context);assert.equal(p.aiState.ops.length,0);assert(p.aiState.operationCooldowns[op.city]>g.turn);assert(Object.values(p.aiState.fallbackUnits).some(x=>x.state==='retreat'));
  g.turn++;AI.updateOperations(g,p,context);assert.equal(p.aiState.ops.length,0);assert(AI.reserveFor(g,p).size>=4);
  const restored=E.restore(E.serialize(g));assert.deepEqual(restored.players[0].aiState,p.aiState);
});
await check('Prepared combined arms march, lose capture capability, and route home',()=>{
  const g=world(),p=g.players[0],units=troops(g,['warrior','archer','archer','catapult','warrior']);AI.updateOperations(g,p,context);let op=p.aiState.ops[0];assert(op);assert.equal(op.state,'march');assert(op.initialStrength>0);
  g.units=g.units.filter(u=>!op.members.includes(u.id)||!UNITS[u.type].strength||UNITS[u.type].ranged);g.turn++;AI.updateOperations(g,p,context);assert.equal(p.aiState.ops.length,0);
  const survivor=units.find(u=>g.units.includes(u)&&AI.operationFor(g,p,u.id));assert(survivor);assert.equal(AI.operationFor(g,p,survivor.id).state,'retreat');
  p.explored=g.map.tiles.map(t=>t.id);p.visible=[...p.explored];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));
  const moves=E.legalActions(g,p).filter(a=>a.unit===survivor.id&&a.type==='move');assert(moves.some(a=>a.hint.defenseDuty));assert(moves.every(a=>a.hint.routeProgress===0));
});
await check('A ready occupation can use a singleton; wall assaults require breaking capability',()=>{
  const g=world(),p=g.players[0],enemy=g.cities[1],units=troops(g,['warrior']);p.visible=[enemy.tile];enemy.hp=0;enemy.walls=0;
  AI.updateOperations(g,p,context);assert.equal(p.aiState.ops[0].state,'march');
  const op={enemy:1,city:enemy.id,tile:enemy.tile,members:units.map(u=>u.id)};enemy.hp=200;enemy.wallLevel=1;enemy.walls=100;
  const extra=troops(g,['warrior','warrior']).slice(-2);op.members.push(...extra.map(u=>u.id));assert.equal(AI.operationReadiness(g,p,op).wallReady,false);
  const siege=E.addUnit(g,p.id,'catapult',g.cities[0].tile+g.map.width*3);op.members.push(siege.id);assert.equal(AI.operationReadiness(g,p,op).wallReady,true);
});
await check('Hidden city health and hidden equipment cannot alter readiness or inferred strength',()=>{
  const g=world(),p=g.players[0],o=g.players[1],units=troops(g,['warrior','warrior','warrior']),enemy=g.cities[1];p.visible=[];
  const op={enemy:1,city:enemy.id,tile:enemy.tile,members:units.map(u=>u.id)};const before=AI.operationReadiness(g,p,op),estimate=militaryAssessment(g,p,o,u=>UNITS[u.type].strength||0);
  enemy.hp=0;enemy.walls=500;enemy.wallLevel=4;o.techs.push('combustion');E.addUnit(g,o.id,'tank',enemy.tile);
  assert.deepEqual(AI.operationReadiness(g,p,op),before);assert.equal(militaryAssessment(g,p,o,u=>UNITS[u.type].strength||0).theirPower,estimate.theirPower);
  p.cityAppearances={[enemy.id]:{visualEra:6}};assert(militaryAssessment(g,p,o,u=>UNITS[u.type].strength||0).theirPower>estimate.theirPower);
});
await check('Diplomatic threat honors enabled victories and war utility counts leader threat once',()=>{
  const g=world(),p=g.players[0],o=g.players[1],ctx={victory:()=>({diplomacy:{points:19,target:20}}),score:()=>100,personality:()=>({aggression:1,naval:1,competitiveness:1}),finance:()=>({grossGold:0,projectedUpkeep:0}),yields:()=>({production:0})};
  g.settings.victories=['diplomacy'];assert.equal(AI.victoryThreat(g,p,o,ctx).parts.diplomacy,.95);g.settings.victories=['science'];assert.equal(AI.victoryThreat(g,p,o,ctx).value,0);
  const att={opinion:-44,relationshipOpinion:0,threat:{value:.8},assess:{ourPower:100,theirPower:100,distance:1,landTarget:true}};
  const a=AI.warValue(g,p,o,att,ctx),b=AI.warValue(g,p,o,{...att,opinion:-100},ctx);assert.equal(a.value,b.value);
});
await check('Actual engine candidates carry purchase roles and the exact effective research cost',()=>{
  const g=world(),p=g.players[0],city=g.cities[0];p.gold=1500;p.boosts.push('pottery');
  E.applyAction(g,p,{type:'produce',city:city.id,item:'warrior'});
  const actions=E.legalActions(g,p),buy=actions.find(a=>a.type==='purchase'&&a.item==='warrior');assert(buy);assert.equal(buy.hint.domain,'land');assert.equal(buy.hint.canCapture,true);assert.equal(buy.hint.baseItem,'warrior');
  const research=actions.find(a=>a.type==='research'&&a.item==='pottery');assert(research);assert.equal(research.hint.effectiveCost,researchCost(g,'pottery',false,true));
});
const traceDir=await mkdtemp(out+'/native-trace-'),pool=new NativeDriverPool({traceDir});
function observation(){const g=world(),p=g.players[0],obs=E.observation(g,p);obs.units=[];obs.legalActions=[];obs.player.gold=1500;obs.player.finance={arrears:0,projectedUpkeep:0,grossGold:100};obs.player.plan={goal:'science'};obs.memory=null;return {g,p,obs};}
try{
  await check('All eight drivers reserve purchased soldiers, upkeep and cash across city groups',async()=>{
    for(const civ of CIVS){const {p,obs}=observation();p.driver.file=civ.file;obs.player.id=p.id;obs.cities=[101,102,103].map(id=>({id,population:3,production:null}));
      obs.legalActions=[{type:'produce',city:101,item:'warrior',hint:{militaryTarget:1,military:true,domain:'land',strength:20,turns:1000}},...obs.cities.map(c=>({type:'purchase',city:c.id,item:'warrior',hint:{unit:true,military:true,domain:'land',canCapture:true,remaining:5,goldCost:100,upkeep:5}}))];
      const result=await pool.execute(p,obs);assert.equal(result.orders.filter(a=>a.type==='purchase').length,1,civ.file);assert(!Object.hasOwn(result,'diagnostics'));assert(!Object.hasOwn(result.memory,'diagnostics'));
    }
  });
  await check('Research uses actual boosted cost with bounded progress and can switch for urgent defense',async()=>{
    const {g,p,obs}=observation();p.driver.file='01_astra.cpp';g.turn=30;g.settings.gameSpeed='marathon';
    const actual=researchCost(g,'writing',false,true);obs.player.research='writing';obs.legalActions=[{type:'research',item:'writing',hint:{baseCost:38,cost:actual/.65,effectiveCost:actual,progress:actual*.5}},{type:'research',item:'archery',hint:{baseCost:25,effectiveCost:100,urgentValue:90,strategicValue:35}}];
    assert.equal((await pool.execute(p,obs)).orders.find(a=>a.type==='research').item,'archery');
    obs.legalActions[1].hint.urgentValue=0;obs.legalActions[1].hint.strategicValue=0;assert.equal((await pool.execute(p,obs)).orders.find(a=>a.type==='research').item,'writing');
    assert(STRATEGY_HINT_KEYS.has('urgentValue'));
  });
  await check('Tracing is bounded, current per request, additive, private and behavior-neutral',async()=>{
    const {p,obs}=observation();p.driver.file='01_astra.cpp';obs.player.research=null;obs.legalActions=[{type:'research',item:'writing',hint:{baseCost:38,effectiveCost:138,progress:69}},{type:'research',item:'mining',hint:{baseCost:25,effectiveCost:100,progress:100000}},{type:'upgrade',unit:987,item:'warrior',hint:{goldCost:9999}}];
    const plain=new NativeDriverPool();try{const a=await pool.execute(p,obs),b=await plain.execute(p,obs);assert.deepEqual(a.orders,b.orders);assert.deepEqual(a.memory,b.memory);}finally{plain.dispose();}
    obs.turn=41;await pool.execute(p,obs);await pool.traceWrites;assert.equal(pool.traceFailures,0);
    const records=(await readFile(traceDir+'/native-decisions.jsonl','utf8')).trim().split('\n').map(JSON.parse);assert.equal(records.at(-1).turn,41);assert.equal(records.at(-1).diagnostics.turn,41);
    for(const record of records){assert(record.diagnostics.groups.length<=32);for(const group of record.diagnostics.groups){assert(group.top.length<=3);for(const candidate of group.top){const sum=Object.values(candidate.components).reduce((a,b)=>a+b,0);assert(Math.abs(sum-candidate.score)<1e-6);assert(!candidate.action.hint);}}}
    const purchase=records.find(r=>r.diagnostics.groups.some(g=>g.selected?.type==='purchase'));const group=purchase.diagnostics.groups.find(g=>g.selected?.type==='purchase');assert.equal(group.budgetAfter.upkeep-group.budgetBefore.upkeep,5);assert.equal(group.budgetBefore.gold-group.budgetAfter.gold,100);
    const latest=records.at(-1).diagnostics.groups.find(g=>g.group==='research');assert.equal(latest.top.find(x=>x.action.item==='mining').components.primary,101.375);
  });
  await check('Trace rotation and logging errors cannot break gameplay decisions',async()=>{
    const {p,obs}=observation(),sample={version:1,turn:obs.turn,groups:[]};
    await writeFile(traceDir+'/native-decisions.jsonl','x'.repeat(4*1024*1024));pool.recordTrace(p,obs,sample,1);await pool.traceWrites;assert.equal(pool.traceFailures,0);assert((await readFile(traceDir+'/native-decisions.previous.jsonl')).length>=4*1024*1024);
    for(let i=0;i<100;i++)pool.recordTrace(p,obs,sample,1);assert.equal(pool.tracePending,16);assert.equal(pool.traceDropped,84);await pool.traceWrites;assert.equal(pool.tracePending,0);
    const blocked=traceDir+'/blocked';await writeFile(blocked,'not a directory');const failure=new NativeDriverPool({traceDir:blocked});try{const result=await failure.execute(p,obs);assert(Array.isArray(result.orders));await failure.traceWrites;assert.equal(failure.traceFailures,1);}finally{failure.dispose();}
  });
}finally{pool.dispose();await pool.traceWrites;}
await writeFile(out+'/focused-checks.json',JSON.stringify({passed:checks.every(c=>c.passed),checks,traceDir,paidRequests:0,productionWrites:false},null,2));
if(checks.some(c=>!c.passed))process.exitCode=1;
