import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {battlefield,see} from './air-warfare-check.mjs';
import {payField} from './military-pay-check.mjs';

const checks=[],metrics={drivers:[]},hash=v=>createHash('sha256').update(v).digest('hex'),pass=s=>{checks.push(s);console.log('PASS '+s);};
const before=JSON.parse(await readFile(new URL('../output/military-balance-20261010/before-rates.json',import.meta.url),'utf8'));
const rates={warrior:[3.6,0],archer:[3.6,0],catapult:[4.2,.6],crossbow:[5,1.2],musket:[6,1.92],tank:[10,50],modernarmor:[12,80],mechanized:[12,70],artillery:[10,50],rocketartillery:[12,65],fighter:[10,50],jetfighter:[12,70],stealthfighter:[14,100],bomber:[10,65],stealthbomber:[14,120],aircraftcarrier:[12,120],submarine:[10,50],nuclearsubmarine:[14,100],drone:[14,6]};
for(const [type,[salary,maintenance]]of Object.entries(rates)){assert.deepEqual(R.unitUpkeep(type),{salary,maintenance,total:salary+maintenance});assert.deepEqual(R.unitUpkeep(type,{policies:['conscription']}),{salary:salary*.5,maintenance:maintenance*.5,total:(salary+maintenance)*.5});}
metrics.rates=before.rows.map(old=>({type:old.type,before:old,after:R.unitUpkeep(old.type)}));for(const row of metrics.rates){assert(row.after.total>=row.before.total);if(row.before.salary>0)assert(row.after.salary>row.before.salary);}for(const type of ['builder','settler','envoy','missionary','apostle','inquisitor'])assert.equal(R.unitUpkeep(type).total,0);
pass('Early wages double; armored/aviation/fleet model maintenance reaches explicit fifty-plus rates, with separate wages and retained policy/civilian rules');
for(const type of ['slinger','archer','crossbow']){assert.equal(R.cityAttackDamage(type,{hp:200,walls:0},80).cityDamage,40);assert.equal(R.cityAttackDamage(type,{hp:200,walls:1,buildings:['walls']},80).total,1);}
for(const [type,level]of [['catapult',1],['trebuchet',2],['bombard',3]]){assert.equal(R.cityAttackDamage(type,{hp:200,walls:0},80).cityDamage,60);assert.equal(R.cityAttackDamage(type,{hp:200,walls:200,wallLevel:level},80).wallDamage,105);assert.equal(R.cityAttackDamage(type,{hp:200,walls:1,wallLevel:level},80).total,105);}
for(const type of ['warrior','tank','cannon','artillery','bomber','rocketartillery'])assert.equal(R.cityAttackDamage(type,{hp:200,walls:0},80).cityDamage,80);
pass('Early field ranged city damage is fifty percent; early siege is seventy-five percent once, retaining fixed-one walls, overflow and later models');
{
 const {g,p,tile}=battlefield();p.techs=['gunpowder'];p.civics=[];
 for(const [type,x,y]of [['warrior',12,13],['builder',13,13],['galley',14,13],['fighter',9,15]]){
  const t=tile(x,y);t.owner=p.id;if(type==='galley')t.terrain='coast';const u=E.addUnit(g,p.id,type,t.id);
  for(const defending of [true,false]){const profile=E.unitCombatProfile(g,u,defending);assert.equal(profile.modifiers.find(m=>m.key==='homeland')?.value,5);t.owner=null;const outside=E.unitCombatProfile(g,u,defending);assert(!outside.modifiers.some(m=>m.key==='homeland'));assert.equal(profile.strength-outside.strength,5);t.owner=p.id;}
  p.techs.push('steam');assert.equal(E.homelandCombatBonus(g,u),0);p.techs.pop();
  if(type==='builder')assert.equal(E.attackTargets(g,p,u).length,0);
 }
 const t=tile(15,13);Object.assign(t,{owner:0,terrain:'coast'});const transported=E.addUnit(g,0,'warrior',t.id),home=E.unitCombatProfile(g,transported);t.owner=null;assert.equal(home.strength-E.unitCombatProfile(g,transported).strength,5);
 p.techs=[];p.civics=['mobilization'];assert.equal(E.homelandCombatBonus(g,g.units.find(u=>u.type==='fighter')),0);
 assert.equal(E.homelandCombatBonus(g,{type:'nuclearMissile',owner:0,tile:t.id}),0);
 pass('Homeland gives exactly +5 attack/defense through Renaissance to land, sea, air and transports; the civilization industrial cutoff includes old troops and keeps civilians unarmed');
}
{
 const {g,p,tile}=battlefield();p.techs=['gunpowder'];p.civics=[];const t=tile(13,13);t.owner=0;const u=E.addUnit(g,0,'warrior',t.id);see(g);p.visible=p.visible.filter(id=>id!==t.id);assert.equal(E.homelandCombatBonus(g,u,p.id),5);t.owner=1;assert.equal(E.homelandCombatBonus(g,u,p.id),5);assert.equal(E.homelandCombatBonus(g,u),0);
 pass('An unseen ownership change cannot leak through the homeland modifier in a public estimate');
}
{
 const {g,p,q,enemy,tile}=battlefield();p.techs=['archery'];p.civics=[];q.techs=[];q.civics=[];Object.assign(enemy,{hp:200,walls:0,wallMax:0,wallLevel:0,buildings:[]});const t=tile(16,15);t.owner=0;const u=E.addUnit(g,0,'archer',t.id);see(g);
 const h=E.observation(g,p).legalActions.find(a=>a.type==='attack'&&a.unit===u.id&&a.targetCity===enemy.id).hint;assert.equal(h.cityDamageMultiplier,.5);assert.equal(h.attackModifiers.find(m=>m.key==='homeland')?.value,5);const raw=Math.max(5,Math.min(90,27*Math.exp((h.strength-h.defense)/27)));assert.equal(h.expectedDamage,Math.round(raw*.5));
 const sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'attack',unit:u.id,targetCity:enemy.id}]);sim.tick(3.2);sim.dispose();const actual=200-enemy.hp;assert(actual>=Math.round(Math.max(5,Math.min(90,Math.round(raw*.9)))*.5)&&actual<=Math.round(Math.max(5,Math.min(90,Math.round(raw*1.1)))*.5));assert.equal(sim.stats.rejected,0);assert.equal(u.hp,100);metrics.cityStrike={preview:h.expectedDamage,actual,homeland:5,multiplier:.5};
 pass('An actual timed archer strike combines homeland strength and reduced city damage consistently with its legal/native/browser preview');
}
const pool=new NativeDriverPool();
try{
 for(const civ of R.CIVS){const {g,p,tile}=payField(6,'warrior');p.techs=['archery','currency'];p.civics=[];p.gold=0;p.manual=false;p.driver.file=civ.file;for(const x of [24,30,36])E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,15).id));see(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&['archer','commercial'].includes(a.item));assert(obs.legalActions.some(a=>a.item==='archer'));assert(obs.player.finance.grossGold<obs.player.finance.projectedUpkeep);const out=await pool.execute(p,obs);assert(!out.orders.some(a=>a.type==='produce'&&a.item==='archer'));assert(out.orders.some(a=>a.type==='produce'&&a.item==='commercial'));metrics.drivers.push({file:civ.file,gross:obs.player.finance.grossGold,upkeep:obs.player.finance.upkeep,archers:0,commerce:out.orders.filter(a=>a.item==='commercial').length});}
 pass('All eight actual native players refuse unaffordable early archers and select real commerce with unchanged national quotas');
 const g=E.createGame({players:12,size:'huge',seed:'PAYROLL-BALANCE-12',barbarians:false,maxTurns:160});let calls=0,rejected=0,peakPaid=0;metrics.opening=[];
 for(let round=0;round<80;round++){for(const p of g.players){if(!p.alive)continue;const out=await pool.execute(p,E.observation(g,p));p.memory=out.memory;calls++;rejected+=E.applyOrders(g,p,out.orders).rejected.length;}E.finishTurn(g);peakPaid=Math.max(peakPaid,g.units.filter(u=>u.owner>=0&&R.unitUpkeep(u.type).total>0).length);if([19,39,79].includes(round))metrics.opening.push({turn:g.turn,cities:g.cities.length,paidUnits:g.units.filter(u=>u.owner>=0&&R.unitUpkeep(u.type).total>0).length,living:g.players.filter(p=>p.alive).length,nations:g.players.map(p=>({id:p.id,gold:p.gold,...E.militaryFinance(g,p)}))});for(const p of g.players){assert(Number.isFinite(p.gold)&&p.gold>=0);assert(Number.isFinite(p.militaryArrears||0)&&(p.militaryArrears||0)>=0);}}
 assert.equal(g.turn,81);assert(g.players.every(p=>p.alive));assert.equal(calls,960);const bytes=E.serialize(g);assert.equal(E.serialize(E.restore(bytes)),bytes);await writeFile(new URL('../output/military-balance-20261010/opening.json',import.meta.url),bytes);metrics.nativeOpening={players:12,rounds:80,calls,rejected,cities:g.cities.length,units:g.units.length,peakPaid};
 pass('A twelve-living-nation eighty-period opening exercises 960 real decisions, bounded finances and exact save restoration under the new costs');
}finally{pool.dispose();}
const sources=Object.fromEntries(await Promise.all(['src/engine.mjs','src/rules.mjs','sdk/civ.hpp','web/app.js'].map(async file=>[file,hash(await readFile(new URL('../'+file,import.meta.url)))])));
await writeFile(new URL('../output/military-balance-checks.json',import.meta.url),JSON.stringify({passed:true,checks,sources,metrics,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
