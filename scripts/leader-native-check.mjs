// Real calls to every rebuilt driver; no live server, game or active-save writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createGame,foundCity,addUnit,observation} from '../src/engine.mjs';
import {CIVS,UNITS} from '../src/rules.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {driverInfo} from '../src/drivers.mjs';
import {UNIQUE_UNITS,UNIQUE_BUILDINGS} from '../src/unique-content.mjs';
const checks=[],evidence=[],pool=new NativeDriverPool();
function field(mode='A'){
 const g=createGame({seed:'NATIVE-LEADER-REWORK',players:2,barbarians:false,leaders:['sejong','qin'],aiAlgorithm:mode});for(const p of g.players)foundCity(g,p,g.units.find(u=>u.owner===p.id&&u.type==='settler'));const p=g.players[0];p.gold=10000;g.turn=60;return {g,p};
}
try{
 for(const civ of CIVS){
  const {g,p}=field();p.driver.file=civ.file;const obs=observation(g,p);obs.player.finance.grossGold=1000;obs.player.finance.projectedUpkeep=10;obs.player.finance.arrears=0;
  const city=obs.cities[0],hint={kind:'building',turns:2,upkeep:0,baseItem:'university',population:city.population,housing:10};
  obs.legalActions=[{type:'produce',city:city.id,item:'jiphyeonjeon',hint},{type:'produce',city:city.id,item:'research',hint:{kind:'project',turns:2,upkeep:0}}];
  const unique=await pool.execute(p,obs);assert(unique.orders.some(a=>a.type==='produce'&&a.item==='jiphyeonjeon'),civ.file+' recognizes the unique university');
  obs.legalActions[0].item='university';delete obs.legalActions[0].hint.baseItem;const base=await pool.execute(p,obs);assert.deepEqual(unique.orders.map(a=>({...a,item:a.item==='jiphyeonjeon'?'university':a.item})),base.orders);evidence.push({driver:civ.file,building:unique.orders[0].item});
 }
 checks.push('All eight native policies inherit unique building preferences while preserving the actual production key');
 let aliasCalls=0;
 for(const civ of CIVS){
  const {g,p}=field();p.driver.file=civ.file;const template=observation(g,p);Object.assign(template.player.finance,{grossGold:1000,projectedUpkeep:10,arrears:0});template.opponents=[{id:1,alive:true,relation:{status:'war'}}];
  for(const [key,spec]of Object.entries({...UNIQUE_UNITS,...UNIQUE_BUILDINGS})){
   const obs=structuredClone(template),model=UNITS[key],hint={baseItem:spec.replaces,kind:model?'unit':'building',turns:2,upkeep:1,military:!!model,domain:model?.domain||'land',strength:model?.strength||0,ranged:model?.ranged||0,canCapture:!!model&&!model.ranged,navalTargets:1,militaryTarget:8,upkeepDelta:0,population:8,housing:12};
   obs.legalActions=[{type:'produce',city:obs.cities[0].id,item:key,hint}];const unique=await pool.execute(p,obs);obs.legalActions[0].item=spec.replaces;delete obs.legalActions[0].hint.baseItem;const base=await pool.execute(p,obs);aliasCalls+=2;
   assert.deepEqual(unique.orders.map(a=>({...a,item:a.item===key?spec.replaces:a.item})),base.orders,civ.file+' scores '+key+' through its canonical role');
   assert(unique.orders.some(a=>a.type==='produce'&&a.item===key),'Accepted unique order retains '+key);
  }
 }
 checks.push('All 50 replacements retain canonical native production preferences and exact serialized keys across all eight drivers');
 for(const civ of CIVS){
  const {g,p}=field();p.driver.file=civ.file;for(let i=0;i<5;i++)addUnit(g,p.id,'warrior',g.cities[0].tile);const obs=observation(g,p);Object.assign(obs.player.finance,{grossGold:1000,projectedUpkeep:10,arrears:0});
  obs.legalActions=[{type:'war',player:1,hint:{nearbyPower:500,theirPower:50,powerRatio:5,empireRatio:2,confidence:1,distance:6,landTarget:true,opportunity:80,discontent:90,warWeariness:0,aVictoryThreat:1}}];
  obs.memory=null;const first=await pool.execute(p,obs);assert(!first.orders.some(a=>a.type==='war'));assert.equal(first.memory.warIntent['1'].count,1);
  obs.memory=first.memory;const same=await pool.execute(p,obs);assert(!same.orders.some(a=>a.type==='war'));assert.equal(same.memory.warIntent['1'].count,1);
  obs.turn++;obs.memory=same.memory;const second=await pool.execute(p,obs);assert(second.orders.some(a=>a.type==='war'),civ.file+' commits after a second consecutive period');
  obs.player.finance.arrears=20;obs.memory=second.memory;obs.turn++;const debt=await pool.execute(p,obs);assert(!debt.orders.some(a=>a.type==='war'));assert.equal(debt.memory.warIntent['1'].count,0);assert(Buffer.byteLength(JSON.stringify(debt.memory))<=32*1024);
  evidence.push({driver:civ.file,warFirst:false,warSecond:true,debtVeto:true,memoryBytes:Buffer.byteLength(JSON.stringify(debt.memory))});
 }
 checks.push('All eight A policies require consecutive periods, do not count repeat decisions twice and retain the debt veto');
 for(const mode of ['A','B']){const {g,p}=field(mode);p.driver.file=CIVS[0].file;const result=await pool.execute(p,observation(g,p));assert(Array.isArray(result.orders));assert.equal(!!result.memory.warIntent,mode==='A');evidence.push({mode,orders:result.orders.length});}
 checks.push('A upgrades and B remain independently selected by the actual saved-world observation');
 const sourceFiles=[...fs.readdirSync('src').filter(f=>f.endsWith('.mjs')).map(f=>'src/'+f),'web/visuals.js','web/unit-combat.js','sdk/civ.hpp','scripts/leader-native-check.mjs'];
const sources=Object.fromEntries(sourceFiles.map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const binaries=await Promise.all(CIVS.map(async c=>{const d=await driverInfo(c.file);assert.equal(d.status,'ready');return {file:c.file,path:d.binary,sha256:createHash('sha256').update(fs.readFileSync(d.binary)).digest('hex'),sourceHash:d.hash};}));
 fs.writeFileSync('output/leader-rework-20261012/native.json',JSON.stringify({passed:true,calls:50+aliasCalls,checks,evidence,sources,binaries},null,2));for(const name of checks)console.log('PASS '+name);
}finally{pool.dispose();}
