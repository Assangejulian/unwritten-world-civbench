import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {historicalNation,NATIONAL_TRADITIONS} from '../src/nations.mjs';
import {battlefield,see} from './air-warfare-check.mjs';
const save=process.env.CIV_TEST_SAVE||new URL('../saves/autosave.json',import.meta.url),before=await readFile(save),checks=[],metrics={};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),pass=name=>{checks.push(name);console.log('PASS '+name);};
export function tacticalField(){const f=battlefield();for(const p of f.g.players){p.techs=[];p.civics=['militarytradition'];p.leaderAbility=undefined;}f.enemy.walls=0;f.enemy.buildings=f.enemy.buildings.filter(k=>k==='airport');return f;}
const bonus=(profile,key)=>profile.modifiers.find(m=>m.key===key)?.value||0;
const preview=(g,p,u,target)=>E.observation(g,p).legalActions.find(a=>a.type==='attack'&&a.unit===u.id&&a.targetUnit===target.id)?.hint;

async function check(){
{
  const {g,p,tile}=tacticalField(),a=E.addUnit(g,p.id,'infantry',tile(13,15).id),b=E.addUnit(g,1,'infantry',tile(14,15).id);
  Object.assign(tile(14,15),{hill:true,feature:'forest',fort:{owner:1,hp:160}});b.fortified=true;
  const profile=E.unitCombatProfile(g,b,true,a);assert.equal(bonus(profile,'hill'),3);assert.equal(bonus(profile,'woods'),3);assert.equal(bonus(profile,'fort'),6);assert.equal(bonus(profile,'fortified'),5);assert.equal(profile.strength,profile.base+profile.modifiers.reduce((n,m)=>n+m.value,0));
  tile(14,15).feature='jungle';assert.equal(bonus(E.unitCombatProfile(g,b,true,a),'woods'),3);
  const air={...b,type:'fighter',veteranTraits:['terrain']},sea={...b,type:'battleship'};
  for(const u of [air,sea])for(const key of ['hill','woods','fort','fortified','terrainTraining'])assert.equal(bonus(E.unitCombatProfile(g,u,true,a),key),0);
  const embarked={...b,tile:tile(14,16).id};tile(14,16).terrain='coast';assert(bonus(E.unitCombatProfile(g,embarked,true,a),'embarked')<0);assert(!E.unitCombatProfile(g,embarked,true,a).modifiers.some(m=>m.key==='hill'));
  a.tile=tile(17,15).id;tile(18,15).hill=true;const cityAttack=E.observation(g,p).legalActions.find(v=>v.type==='attack'&&v.unit===a.id&&v.targetCity===g.cities[1].id);assert.equal(bonus({modifiers:cityAttack.hint.defenseModifiers},'hill'),3);
  pass('Ground hills, woods, active owned forts and fortification stack once; aircraft, fleets and transports receive no ground-cover bonus');
}
{
  const {g,p,tile}=tacticalField(),a=E.addUnit(g,p.id,'infantry',tile(13,15).id),b=E.addUnit(g,1,'infantry',tile(14,15).id),from=tile(13,15),to=tile(14,15);
  from.river=to.river=true;from.riverEdges=[1];assert(!E.riverBetween(g,from,to));from.riverEdges=[0];assert(E.riverBetween(g,from,to));assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'river'),-5);
  from.riverEdges=[];to.riverEdges=[3];assert(E.riverBetween(g,from,to));assert.equal(bonus(E.unitCombatProfile(g,{...a,type:'artillery'},false,b),'river'),0);
  const left=tile(0,20),right=tile(g.map.width-1,20);left.riverEdges=[3];assert(E.riverBetween(g,left,right));assert(!E.riverBetween(g,left,tile(3,20)));
  pass('Melee river penalties use the actual shared edge, including wrapped seams; same-bank and ranged attacks are exempt');
}
{
  const {g,p,q,tile}=tacticalField(),a=E.addUnit(g,0,'infantry',tile(13,15).id),b=E.addUnit(g,1,'infantry',tile(14,15).id);
  E.addUnit(g,0,'infantry',tile(14,16).id);assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'flanking'),2);
  p.civics=[];assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'flanking'),0);p.civics=['militarytradition'];
  E.addUnit(g,0,'artillery',tile(14,16).id);assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'flanking'),2);
  const near=R.DIRECTIONS.map(([dq,dr])=>g.map.index[R.canonicalTileKey(tile(14,15).q+dq,tile(14,15).r+dr,g.map)]).filter(t=>t&&t.id!==a.tile);
  for(const t of near)E.addUnit(g,0,'infantry',t.id);assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'flanking'),6);
  assert.equal(bonus(E.unitCombatProfile(g,{...a,type:'artillery'},false,b),'flanking'),0);assert.equal(bonus(E.unitCombatProfile(g,a,false,g.cities[1]),'flanking'),0);
  g.units=[a,b];E.addUnit(g,q.id,'archer',tile(14,16).id);assert.equal(bonus(E.unitCombatProfile(g,b,true,a),'support'),2);
  E.addUnit(g,q.id,'builder',tile(14,16).id);E.addUnit(g,2,'infantry',tile(14,14).id);assert.equal(bonus(E.unitCombatProfile(g,b,true,a),'support'),2);
  assert.equal(bonus(E.unitCombatProfile(g,b,true,{...a,type:'archer'}),'support'),0);
  g.units=[];for(const [x,y]of [[13,15],[14,15],[14,16],[14,14]])tile(x,y).terrain='coast';
  const ship=E.addUnit(g,0,'galley',tile(13,15).id),enemyShip=E.addUnit(g,1,'galley',tile(14,15).id);E.addUnit(g,0,'galley',tile(14,16).id);E.addUnit(g,1,'frigate',tile(14,14).id);
  assert.equal(bonus(E.unitCombatProfile(g,ship,false,enemyShip),'flanking'),2);assert.equal(bonus(E.unitCombatProfile(g,enemyShip,true,ship),'support'),2);
  E.addUnit(g,0,'infantry',tile(14,14).id);assert.equal(bonus(E.unitCombatProfile(g,ship,false,enemyShip),'flanking'),2);
  pass('Military Tradition gates distinct-cell +2 flank/support contributions capped at +6; ranged attacks, cities, civilians and foreign armies cannot inflate them');
}
{
  const {g,p,q,tile}=tacticalField(),a=E.addUnit(g,0,'infantry',tile(13,15).id),b=E.addUnit(g,1,'infantry',tile(14,15).id);
  p.techs=['printing','computers','telecommunications'];assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),9);
  q.techs=['printing'];assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),6);
  const scout=E.addUnit(g,0,'scout',tile(13,16).id);assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),9);q.techs=[];assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),12);
  scout.hp=0;assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),9);p.techs=[];
  const fighter=E.addUnit(g,0,'fighter',tile(9,15).id);fighter.airPatrolCity=g.cities[0].id;assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),0);b.tile=tile(13,15).id;assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),3);
  tile(9,15).pillaged=true;assert.equal(bonus(E.unitCombatProfile(g,a,false,b),'intelligence'),0);tile(9,15).pillaged=false;
  q.techs=['printing','computers'];p.techs=[];assert.equal(bonus(E.unitCombatProfile(g,b,true,a),'intelligence'),3);
  pass('Intel compares both nations: printing/computers/telecom plus real living reconnaissance or operational patrol, +3 per advantage level capped at +12');
}
{
  const {g,p,tile}=tacticalField(),a=E.addUnit(g,0,'infantry',tile(13,15).id),b=E.addUnit(g,1,'infantry',tile(14,15).id);see(g);
  const hidden=tile(15,16);p.visible=p.visible.filter(id=>id!==hidden.id);const baseline=preview(g,p,a,b);
  E.addUnit(g,1,'infantry',hidden.id);E.addUnit(g,1,'scout',hidden.id);assert.deepEqual(preview(g,p,a,b),baseline);
  const real=E.unitCombatProfile(g,b,true,a);assert(real.strength>baseline.defense);assert.equal(bonus(E.unitCombatProfile(g,b,true,a,{viewer:p.id}),'support'),0);
  g.units=[a,b];a.tile=tile(16,15).id;b.tile=tile(17,15).id;
  const fighter=E.addUnit(g,1,'fighter',tile(19,15).id),publicHint=preview(g,p,a,b),unassigned=E.unitCombatProfile(g,b,true,a).strength;
  fighter.airPatrolCity=g.cities[1].id;assert.deepEqual(preview(g,p,a,b),publicHint);assert(E.unitCombatProfile(g,b,true,a).strength>unassigned);
  pass('Hidden reinforcements/scouts and private fighter patrol assignments never leak through visible-only estimates; actual combat retains real reconnaissance');
}
{
  const {g,p,tile}=tacticalField(),a=E.addUnit(g,0,'infantry',tile(13,15).id),b=E.addUnit(g,1,'infantry',tile(14,15).id);
  E.addUnit(g,0,'infantry',tile(14,16).id);p.techs=['printing'];tile(13,15).riverEdges=[0];tile(14,15).hill=true;see(g);
  const h=preview(g,p,a,b),expected=27*Math.exp((h.strength-h.defense)/27);assert(h.attackModifiers.some(m=>m.key==='flanking'));assert(h.attackModifiers.some(m=>m.key==='river'));assert(h.defenseModifiers.some(m=>m.key==='hill'));
  const sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'attack',unit:a.id,targetUnit:b.id}]);sim.tick(3.2);sim.dispose();const dealt=100-b.hp;
  assert(dealt>=Math.floor(expected*.9)&&dealt<=Math.ceil(expected*1.1));assert(a.hp<100);assert.equal(sim.stats.rejected,0);metrics.realStrike={strength:h.strength,defense:h.defense,expected:h.expectedDamage,dealt,retaliation:100-a.hp};
  pass('A real timed strike combines river, flank, intel and hill cover using the same strengths as its preview and bounded seeded damage rolls');
}
const pool=new NativeDriverPool();
try{
  metrics.drivers=[];
  for(const civ of R.CIVS){
    const {g,p,tile}=tacticalField(),a=E.addUnit(g,0,'tank',tile(11,15).id),enemy=E.addUnit(g,1,'infantry',tile(15,15).id),good=tile(13,15),bad=tile(14,14);tile(15,15).owner=0;
    E.addUnit(g,0,'infantry',tile(13,16).id);E.addUnit(g,0,'infantry',tile(14,16).id);see(g);p.driver.file=civ.file;
    // Compare equally useful routes to the visible enemy without a competing city assault.
    p.knownCities={};p.visible=p.visible.filter(id=>!g.cities.some(c=>c.owner!==p.id&&c.tile===id));
    const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(v=>v.type==='move'&&v.unit===a.id&&[good.id,bad.id].includes(v.tile));assert.equal(obs.legalActions.length,2);
    assert.equal(obs.legalActions.find(v=>v.tile===good.id).hint.supportGain,4);assert.equal(obs.legalActions.find(v=>v.tile===bad.id).hint.supportGain,0);
    const order=(await pool.execute(p,obs)).orders.find(v=>v.unit===a.id);assert.equal(order?.tile,good.id,civ.file+' should prefer supported staging');
    const sim=new RealtimeSimulation(g);sim.enqueue(p,[order]);sim.tick(8);sim.dispose();assert.equal(a.tile,good.id);metrics.drivers.push({file:civ.file,supportGain:4});
  }
  pass('All eight rebuilt native drivers choose and physically reach a supported staging position using real movement hints');
}finally{pool.dispose();}
assert.equal(hash(await readFile(save)),hash(before));const expected=JSON.parse(before.toString());expected.settings.aiAlgorithm='unified';for(const p of expected.players){if(p.aiState===undefined&&p.aiV2!==undefined)p.aiState=p.aiV2;delete p.aiV2;}expected.settings.leaderRulesVersion??=1;for(const p of expected.players){p.leaderRulesVersion??=expected.settings.leaderRulesVersion;if(p.leaderRulesVersion===1&&historicalNation(p))p.trait=NATIONAL_TRADITIONS[p.id%8];}const normalized=E.serialize(E.restore(before.toString()));assert.deepEqual(JSON.parse(normalized),expected);assert.equal(E.serialize(E.restore(normalized)),normalized);
await writeFile(new URL('../output/tactical-combat-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveSha256:hash(before),activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
}
if(process.argv[1]?.endsWith('tactical-combat-check.mjs'))await check();
