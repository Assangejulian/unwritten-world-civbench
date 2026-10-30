// Use disposable engine worlds; never run a listener or write the active save.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,foundCity,addUnit,applyAction,cityYields,unitStrength,productionMultiplier,leaderAbilityUtility,serialize,restore,snapshot,refreshVisibility} from '../src/engine.mjs';
import {LEADERS,LEGACY_LEADERS,UNITS,PRODUCTION,nationalEffects} from '../src/rules.mjs';
import {neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {developmentPlan} from '../src/strategy.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],coverage=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(key='qin'){
  const g=createGame({leaderRulesVersion:1,seed:'HISTORY-RULES',players:2,size:'small',barbarians:false,leaders:[key,key==='sejong'?'qin':'sejong']});
  for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,resource:null,owner:null,cityId:null,district:null,improvement:null});
  g.realtime={version:1,time:0,period:20,nextEconomy:20,queues:{},sequence:0};const p=g.players[0];const settler=g.units.find(u=>u.owner===0&&u.type==='settler');settler.tile=20*g.map.width+20;
  const c=foundCity(g,p,settler),other=foundCity(g,g.players[1],g.units.find(u=>u.owner===1&&u.type==='settler'));g.units=[];
  return {g,p,c,other};
}
assert.equal(LEADERS.length,25);assert.equal(new Set(LEADERS.map(l=>l.key)).size,25);assert.equal(new Set(LEADERS.map(l=>l.name)).size,25);
assert.throws(()=>createGame({players:2,leaders:['qin','qin']}));assert.throws(()=>createGame({players:2,leaders:['qin','unknown']}));assert.throws(()=>createGame({players:2,leaders:['qin']}));
pass('Exactly 25 historical identities; new-world configuration validates the pool, count and uniqueness');
for(const leader of LEADERS){
  const {g,p,c,other}=field(leader.key);assert.equal(p.leader,leader.name);const home=g.map.tiles[c.tile];home.river=true;neighbors(g.map,home)[0].terrain='coast';
  c.population=5;c.buildings=['campus','holy','industrial','commercial','theater','harbor','walls','museum'];c.religion=p.id;p.religion='wisdom';
  const cells=neighbors(g.map,home).filter(t=>t.terrain==='grass');cells.forEach((t,i)=>Object.assign(t,{owner:p.id,hill:true,improvement:['mine','farm','pasture','farm','mine'][i]}));
  g.routes=[{owner:p.id,from:c.id,to:c.id},{owner:p.id,from:c.id,to:other.id}];
  const army=['warrior','horseman','catapult','galley','pikeman'].map(type=>addUnit(g,p.id,type,c.tile));army.forEach(u=>u.hp=65);
  const measure=()=>[...Object.values(cityYields(g,c)),...army.flatMap(u=>[unitStrength(g,u),unitStrength(g,u,true)]),...Object.keys(PRODUCTION).map(item=>productionMultiplier(p,item,g.realtime.time)),addUnit(g,p.id,'builder',c.tile).charges,addUnit(g,p.id,'missionary',c.tile).charges];
  p.leaderKey='astral';const legacy=measure();p.leaderKey=leader.key;const baseline=measure();assert(baseline.some((n,i)=>n!==legacy[i]),leader.key+' passive must affect engine outputs');
  const sim=new RealtimeSimulation(g);const activity={action:{type:'move',unit:army[0].id,tile:cells[0].id},path:[c.tile,cells[0].id],index:1,from:c.tile,to:cells[0].id,started:0,ends:2};army[0].activity=activity;const moves=army[0].moves;
  p.relations[1].status='war';assert(Number.isFinite(leaderAbilityUtility(g,p)));const wartime=measure();
  applyAction(g,p,{type:'leaderAbility'});const boosted=measure();assert(boosted.some((n,i)=>n!==wartime[i])||army.some(u=>u.hp>65),leader.key+' active must affect real outputs');
  assert.equal(army[0].activity,activity);assert.equal(army[0].moves,moves);assert.equal(p.leaderAbility.activeUntil,leader.duration);assert.equal(p.leaderAbility.readyAt,leader.cooldown);assert.throws(()=>applyAction(g,p,{type:'leaderAbility'}));
  const saved=restore(serialize(g));assert.equal(saved.players[0].leaderKey,leader.key);assert.deepEqual(saved.players[0].leaderAbility,p.leaderAbility);assert.equal(snapshot(g,1).players[0].leaderAbility,undefined);assert.equal(snapshot(g,1).players[0].leaderKey,leader.key);
  g.realtime.time=leader.duration;army.forEach(u=>u.hp=65);const expired=measure();assert.deepEqual(expired,wartime,leader.key+' expires without losing permanent effects');
  assert.throws(()=>applyAction(g,p,{type:'leaderAbility'}));g.realtime.time=leader.cooldown;assert.doesNotThrow(()=>applyAction(g,p,{type:'leaderAbility'}));
  coverage.push({key:leader.key,name:leader.name,duration:leader.duration,cooldown:leader.cooldown});sim.dispose();
}
pass('All 25 passives and actives affect authoritative yields, production, combat or charges; expiry, cooldown, save identity and fog privacy hold for every leader');
{
  const {g,p,c}=field();assert.equal(addUnit(g,0,'builder',c.tile).charges,4);assert.equal(productionMultiplier(p,'pyramids',0),1.15);applyAction(g,p,{type:'leaderAbility'});assert.equal(productionMultiplier(p,'pyramids',0),1.5);assert.equal(productionMultiplier(p,'warrior',0),1);assert.equal(productionMultiplier(p,'builder',0),1.3);
  p.leaderKey='genghis';p.leaderAbility=null;const combatTile=g.map.tiles.find(t=>t.owner===null&&t.terrain==='grass'),mounted=addUnit(g,0,'horseman',combatTile.id),infantry=addUnit(g,0,'warrior',combatTile.id);assert.equal(unitStrength(g,mounted),40);combatTile.hill=true;assert.equal(unitStrength(g,mounted),36);assert.equal(unitStrength(g,infantry),23);combatTile.terrain='coast';p.techs=['sailing'];assert(unitStrength(g,mounted)<24);applyAction(g,p,{type:'leaderAbility'});assert(unitStrength(g,mounted)<24);
  pass('Qin wonder/builder specialization is selective; Mongol terrain cavalry bonuses exclude infantry and embarked transports');
}
{
  const {g,p,c,other}=field('pachacuti');c.population=1;const farm=neighbors(g.map,g.map.tiles[c.tile])[0];Object.assign(farm,{owner:0,hill:true,improvement:'farm'});p.leaderKey='astral';const baseline=cityYields(g,c).food;p.leaderKey='pachacuti';assert.equal(Math.round((cityYields(g,c).food-baseline)*100),212);farm.hill=false;assert.equal(cityYields(g,c).food,baseline);farm.hill=true;
  p.leaderKey='darius';g.routes=Array.from({length:7},()=>({owner:0,from:c.id,to:c.id}));p.leaderKey='astral';const normal=cityYields(g,c);p.leaderKey='darius';const enhanced=cityYields(g,c);assert.equal(Math.round((enhanced.gold-normal.gold)*100),848);assert.equal(Math.round((enhanced.production-normal.production)*100),424);
  p.leaderKey='tokugawa';g.routes=[];const peaceful=cityYields(g,c);p.relations[1].status='war';const war=cityYields(g,c);applyAction(g,p,{type:'leaderAbility'});assert.equal(cityYields(g,c).production,war.production);assert(peaceful.production>=war.production);
  p.leaderKey='saladin';p.leaderAbility=null;c.buildings=['holy'];p.religion='wisdom';c.religion=other.owner;const foreign=cityYields(g,c).faith;c.religion=p.id;assert(cityYields(g,c).faith>foreign);applyAction(g,p,{type:'leaderAbility'});assert(nationalEffects(p,0).science===undefined);
  pass('Hill farms require actual worked hills; route bonus caps hold; peace-only skills stop in war and religion bonuses require the national religion');
}
{
  for(const [key,bank,gold]of [['alexander',8,0],['caesar',0,12],['genghis',0,10]]){
    const {g,p,c}=field(key);p.relations[1].status='war';const attacker=addUnit(g,0,'archer',c.tile),foe=addUnit(g,1,'warrior',neighbors(g.map,g.map.tiles[c.tile])[0].id);foe.hp=1;refreshVisibility(g);const money=p.gold;applyAction(g,p,{type:'attack',unit:attacker.id,targetUnit:foe.id});assert.equal(p.scienceBank||0,bank);assert.equal(p.gold-money,gold);assert.throws(()=>applyAction(g,p,{type:'attack',unit:attacker.id,targetUnit:foe.id}));assert.equal(p.gold-money,gold);
  }
  const {g,p,c,other}=field('cyrus');g.units=[];p.relations[1].status='war';other.tile=neighbors(g.map,g.map.tiles[c.tile])[0].id;g.map.tiles[other.tile].owner=1;g.map.tiles[other.tile].cityId=other.id;other.hp=1;const attacker=addUnit(g,0,'tank',c.tile);refreshVisibility(g);applyAction(g,p,{type:'attack',unit:attacker.id,targetCity:other.id});assert.equal(other.owner,0);assert.equal(other.occupation,2);applyAction(g,p,{type:'leaderAbility'});assert.equal(other.occupation,1);assert.equal(other.loyalty,80);
  pass('Kills award science/gold exactly once; actual conquest and Cyrus activation reduce occupation without instant capture or action reset');
}
{
  const legacyBytes=await readFile(new URL('../saves/before-historical-leaders-20261005.json',import.meta.url)),raw=JSON.parse(legacyBytes),old=restore(legacyBytes.toString());assert.deepEqual(old.players.map(p=>p.leaderKey),LEGACY_LEADERS.map(l=>l.key));assert.equal(old.turn,raw.turn);assert.equal(old.realtime.time,raw.realtime.time);assert.deepEqual(old.units,raw.units);const cities=cs=>cs.map(({faithPressure,followers,religionPressure,production,...c})=>({...c,production:production?{...production,cost:undefined}:null}));assert.deepEqual(cities(old.cities),cities(raw.cities));assert.deepEqual(old.map.tiles.map(t=>Object.fromEntries(Object.entries(t).filter(([k])=>!['road','territoryCity','owner'].includes(k)))),raw.map.tiles.map(t=>Object.fromEntries(Object.entries(t).filter(([k])=>!['road','territoryCity','owner'].includes(k)))));assert(old.map.tiles.some(t=>t.road));for(const p of old.players){p.leaderAbility={activeUntil:old.realtime.time+40,readyAt:old.realtime.time+120};assert.deepEqual(nationalEffects(p,old.realtime.time),LEGACY_LEADERS[p.id].effects);}
  const {g,p,c}=field('qin');let bad=JSON.parse(serialize(g));bad.players[1].leaderKey='qin';assert.throws(()=>restore(JSON.stringify(bad)));bad.players[1].leaderKey='invented';assert.throws(()=>restore(JSON.stringify(bad)));bad.players[1].leaderKey='astral';assert.throws(()=>restore(JSON.stringify(bad)));
  p.leaderKey='sejong';const academic=developmentPlan(g,p);p.leaderKey='genghis';const military=developmentPlan(g,p);assert(military.weights.aggression>academic.weights.aggression);
  p.leaderKey='qin';assert.equal(leaderAbilityUtility(g,p),-100);c.production={item:'pyramids',progress:0};assert(leaderAbilityUtility(g,p)>0);const pool=new NativeDriverPool();try{const base={player:{...p,plan:developmentPlan(g,p)},cities:[c],units:[],tiles:[],legalActions:[{type:'leaderAbility',hint:{utility:-100}}]};const idle=await pool.execute(p,base);assert(!idle.orders.some(o=>o.type==='leaderAbility'));base.legalActions[0].hint.utility=120;const construction=await pool.execute(p,base);assert(construction.orders.some(o=>o.type==='leaderAbility'));}finally{pool.dispose();}
  pass('Legacy world and skills preserve geometry/entities/clock; forged leaders are rejected; native AI follows leader tendencies and waits for useful skill conditions');
}
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));
await writeFile(new URL('../output/historical-leaders-checks.json',import.meta.url),JSON.stringify({passed:true,checks,coverage},null,2));
pass('The active save remains byte-identical');
