import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {attackRange} from '../src/air-warfare.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {battlefield,see} from './air-warfare-check.mjs';

const save=new URL('../saves/autosave.json',import.meta.url),before=await readFile(save),checks=[],metrics={};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const pass=name=>{checks.push(name);console.log('PASS '+name);};
function ancestors(key,catalog=R.TECHS,path=[]){
  assert(catalog[key],'Missing prerequisite '+key);
  assert(!path.includes(key),'Research cycle '+[...path,key].join(' -> '));
  return new Set(catalog[key].requires.flatMap(k=>{assert(catalog[k].era<=catalog[key].era,key+' depends on a later era');return [k,...ancestors(k,catalog,[...path,key])];}));
}
const completedThrough=key=>[...ancestors(key),key];
for(const catalog of [R.TECHS,R.CIVICS])for(const key of Object.keys(catalog))ancestors(key,catalog);
for(const spec of Object.values(R.PRODUCTION)){if(spec.tech)assert(R.TECHS[spec.tech]);if(spec.civic)assert(R.CIVICS[spec.civic]);}
assert.equal(Object.keys(R.TECHS).length,64);
pass('Both research graphs are acyclic, reference real prerequisites and never depend on a later era; all production unlocks exist');

const droneTech=R.UNITS.drone.tech,chain=['flight','rocketry','satellites','telecommunications','guidance',droneTech];
for(let i=1;i<chain.length;i++)assert(R.TECHS[chain[i]].requires.includes(chain[i-1]));
assert(ancestors(droneTech).has('advflight'));
assert.equal(R.TECHS.flight.era,5);assert.equal(R.TECHS.advflight.era,6);assert.equal(R.TECHS[droneTech].era,7);
metrics.dronePath=chain;metrics.postFlightNodes=chain.length-1;
pass('Drone admission requires five successive post-flight nodes and advanced aviation, across modern, atomic and information eras');

{
  const {g,p,home,tile}=battlefield();p.techs=completedThrough('flight');see(g);
  assert(E.buildable(g,p,home,'fighter'));assert(E.buildable(g,p,home,'bomber'));assert(E.buildable(g,p,home,'antiair'));
  assert(!E.buildable(g,p,home,'jetfighter'));assert(!E.buildable(g,p,home,'drone'));
  const old=E.addUnit(g,0,'fighter',tile(10,16).id);
  p.techs=[...new Set([...p.techs,...completedThrough('advflight')])];
  assert(!E.buildable(g,p,home,'fighter'));assert(E.buildable(g,p,home,'jetfighter'));assert(E.buildable(g,p,home,'bomber'));
  const later=[...ancestors(droneTech)];p.techs=later;assert(!E.buildable(g,p,home,'drone'));
  assert(!E.observation(g,p).legalActions.some(a=>a.type==='produce'&&a.item==='drone'));
  assert.throws(()=>E.applyAction(g,p,{type:'produce',city:home.id,item:'drone'}));
  p.techs.push(droneTech);assert(E.buildable(g,p,home,'drone'));assert(E.buildable(g,p,home,'stealthfighter'));assert(E.buildable(g,p,home,'stealthbomber'));
  assert(!E.buildable(g,p,home,'bomber'));assert(!E.buildable(g,p,home,'jetfighter'));assert(g.units.includes(old));assert.equal(old.type,'fighter');
  pass('Actual production and native legal actions admit each aviation generation in order; retirement preserves existing older aircraft');
}

{
  const {g,p,home}=battlefield();p.techs=completedThrough('printing');home.buildings.push('commercial','market');
  assert(!E.buildable(g,p,home,'bank'));p.techs.push(...completedThrough('banking').filter(k=>!p.techs.includes(k)));assert(E.buildable(g,p,home,'bank'));
  const industrial=ancestors('industrial');assert(!industrial.has('stirrups'));assert(!industrial.has('gunpowder'));assert(!industrial.has('shipbuilding'));
  p.techs=[...ancestors('radio')];assert(!p.techs.includes('flight'));E.applyAction(g,p,{type:'research',item:'radio'});
  p.techs=[...ancestors('nuclearfission')];assert(!p.techs.includes('combinedarms'));E.applyAction(g,p,{type:'research',item:'nuclearfission'});
  p.techs=[...ancestors('flight')].filter(k=>k!=='combustion');assert.throws(()=>E.applyAction(g,p,{type:'research',item:'flight'}));
  assert(!ancestors('atomic').has('ballistics'));
  pass('Banking unlocks banks, manufacturing avoids cavalry/shipbuilding, radio avoids flight, nuclear physics avoids ballistics/combined arms and aviation requires engines');
}

{
  const {g,p,home,tile}=battlefield();p.techs=completedThrough('rocketry');home.buildings.push('spaceport');
  const launch=tile(11,15);Object.assign(launch,{owner:p.id,district:{item:'spaceport',kind:'district',city:home.id}});home.districts.push({item:'spaceport',tile:launch.id});
  assert(!E.buildable(g,p,home,'satellite'));assert(!E.buildable(g,p,home,'moon'));
  p.techs.push(...completedThrough('satellites').filter(k=>!p.techs.includes(k)));assert(E.buildable(g,p,home,'satellite'));assert(!E.buildable(g,p,home,'moon'));
  const drone=E.addUnit(g,p.id,'drone',tile(9,16).id);assert.equal(attackRange(g,drone),8);
  E.applyAction(g,p,{type:'produce',city:home.id,item:'satellite'});home.production.progress=E.orderCost(g,home);E.finishTurn(g,{actions:false});
  assert.equal(p.spaceStage,1);assert.equal(attackRange(g,drone),24);assert(E.buildable(g,p,home,'moon'));
  E.applyAction(g,p,{type:'produce',city:home.id,item:'moon'});home.production.progress=E.orderCost(g,home);E.finishTurn(g,{actions:false});assert.equal(p.spaceStage,2);
  pass('Actual satellite and moon production require satellite research and sequential launches; only the completed launch grants drone range 24');
}

{
  const {g,p,home,tile}=battlefield();p.techs=['flight','robotics','combustion'];
  const drone=E.addUnit(g,p.id,'drone',tile(10,16).id);p.research='telecommunications';p.researchProgress.telecommunications=R.researchCost(g,'telecommunications')-1;
  const text=E.serialize(g),copy=E.restore(text);assert.deepEqual(copy.players[0].techs,p.techs);assert.equal(copy.players[0].research,p.research);assert.deepEqual(copy.players[0].researchProgress,p.researchProgress);
  assert(E.buildable(copy,copy.players[0],copy.cities.find(c=>c.id===home.id),'drone'));assert(copy.units.some(u=>u.id===drone.id));
  E.finishTurn(copy,{actions:false});assert(copy.players[0].techs.includes('telecommunications'));
  pass('Legacy completed unlocks, live units and admitted in-progress research survive restore and finish without retroactive prerequisite removal');
}

const pool=new NativeDriverPool();
try{
  metrics.drivers=[];
  for(const civ of R.CIVS){
    const {g,p}=battlefield();p.driver.file=civ.file;p.techs=completedThrough('flight');p.research=null;p.manual=false;
    const needed=new Set([...ancestors(droneTech),droneTech]);let calls=0;
    while(!p.techs.includes(droneTech)){
      const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='research'&&needed.has(a.item));
      assert(obs.legalActions.length,'No legal path to drone research');
      const order=(await pool.execute(p,obs)).orders.find(a=>a.type==='research');assert(order,civ.file+' fails to research a legal prerequisite');
      E.applyAction(g,p,order);p.scienceBank=R.researchCost(g,order.item);E.finishTurn(g,{actions:false});assert(p.techs.includes(order.item));
      assert(++calls<=64,'Native prerequisite loop');
    }
    assert(E.buildable(g,p,g.cities.find(c=>c.owner===p.id),'drone'));metrics.drivers.push({file:civ.file,researchSteps:calls});
  }
  pass('All eight actual native drivers traverse legal prerequisites to drone production without a research dead end');
}finally{pool.dispose();}
assert.equal(hash(await readFile(save)),hash(before));
const {historicalNation}=await import('../src/nations.mjs'),legacyExpected=JSON.parse(before.toString());legacyExpected.settings.leaderRulesVersion??=1;
for(const p of legacyExpected.players){p.leaderRulesVersion??=legacyExpected.settings.leaderRulesVersion;if(p.leaderRulesVersion===1&&historicalNation(p))p.trait=['学术传统','军务传统','农耕传统','商贸传统','艺文传统','航海传统','信仰传统','工造传统'][p.id%8];}
const normalized=E.serialize(E.restore(before.toString()));assert.deepEqual(JSON.parse(normalized),legacyExpected,'Only explicit legacy leader-version metadata and historical tradition labels may normalize');
assert.equal(E.serialize(E.restore(normalized)),normalized,'The normalized saved world must restore byte-exactly');
await writeFile(new URL('../output/technology-tree-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveSha256:hash(before),activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
