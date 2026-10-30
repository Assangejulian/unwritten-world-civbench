// Reproduce unlimited veteran damage with frozen code, then exercise actual hits.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as Old from '../output/combat-balance-20261013/before/src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {beginWar} from '../src/warfare.mjs';
const out=new URL('../output/combat-balance-20261013/',import.meta.url),checks=[],metrics={matrix:[]},hash=b=>createHash('sha256').update(b).digest('hex'),save=await fs.readFile(new URL('../saves/autosave.json',import.meta.url));
function field(engine=E,version=1){
 const g=engine.createGame({seed:'VETERAN-EQUIPMENT',players:2,size:'small',barbarians:false,leaders:['sejong','ashoka'],leaderRulesVersion:version});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,riverEdges:[],resource:null,improvement:null,owner:null,territoryCity:null,cityId:null,district:null,camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];for(const p of g.players)Object.assign(p,{manual:true,met:[1-p.id],techs:['archery','combinedarms'],civics:[],policies:[],gold:10000});
 for(const [id,x]of [[0,6],[1,18]])engine.foundCity(g,g.players[id],engine.addUnit(g,id,'settler',tile(x,15).id));g.units=[];g.turn=20;
 beginWar(g,g.players[0],g.players[1],engine.event);return {g,p:g.players[0],q:g.players[1],tile};
}
function pair(engine,attacker,defender,rank=0,version=1){const f=field(engine,version),a=engine.addUnit(f.g,0,attacker,f.tile(13,15).id),b=engine.addUnit(f.g,1,defender,f.tile(14,15).id);Object.assign(a,{level:rank,xp:rank*25});engine.refreshVisibility(f.g);return {...f,a,b};}
function hit(engine,f){const before=f.b.hp;engine.applyAction(f.g,f.p,{type:'attack',unit:f.a.id,targetUnit:f.b.id});return before-f.b.hp;}
const pass=name=>{checks.push(name);console.log('PASS '+name);};
for(const type of ['archer','crossbow']){
 const old=pair(Old,type,'infantry',34),current=pair(E,type,'infantry',34),before=hit(Old,old),after=hit(E,current);assert.equal(before,90);assert(after<15);metrics[type]={rank:34,before,after};
}pass('Actual frozen rank-34 archer/crossbow hits reproduce 90 HP against infantry; current hits remain below 15');
for(const type of Object.keys(R.UNITS).filter(k=>!R.UNITS[k].civilian)){
 const {g,a}=pair(E,type,'infantry',5),at5=E.unitCombatProfile(g,a,false,null,{ranged:!!R.UNITS[type].ranged});a.level=34;assert.deepEqual(E.unitCombatProfile(g,a,false,null,{ranged:!!R.UNITS[type].ranged}),at5,type+' bounded veteran strength');assert.equal(at5.modifiers.find(m=>m.key==='experience')?.value,15);
}pass('Every base and unique combat model retains earned ranks while combat experience stops at +15');
for(const [attacker,defender,rank,max]of [['archer','infantry',0,5],['archer','mechanized',34,5],['archer','modernarmor',34,3],['crossbow','infantry',34,15],['crossbow','modernarmor',34,6],['musket','infantry',5,20],['infantry','archer',0,90],['infantry','infantry',0,35]]){
 const samples=[];for(const version of [1,2])for(let i=0;i<24;i++){const f=pair(E,attacker,defender,rank,version);f.g.rngState=9173+i*7919;const hint=E.observation(f.g,f.p).legalActions.find(a=>a.type==='attack'&&a.unit===f.a.id&&a.targetUnit===f.b.id)?.hint;assert(hint);const actual=hit(E,f);assert(actual>=1&&actual<=max,attacker+' -> '+defender+': '+actual);assert(Math.abs(actual-hint.expectedDamage)<=hint.expectedDamage*.11+1);samples.push(actual);}metrics.matrix.push({attacker,defender,rank,min:Math.min(...samples),max:Math.max(...samples)});
}pass('384 authoritative strikes across old/new worlds preserve equipment advantage and match public damage estimates');
{
 const f=pair(E,'archer','modernarmor');f.a.hp=40;f.b.hp=40;const h=E.observation(f.g,f.p).legalActions.find(a=>a.type==='attack'&&a.unit===f.a.id&&a.targetUnit===f.b.id).hint;assert(h.expectedDamage<2);assert.equal(hit(E,f),1);assert.equal(f.a.xp,1);
}pass('Very obsolete low-damage attacks no longer force five HP or grant six XP for a one-HP hit');
{
 const exercise=engine=>{const f=field(engine),a=engine.addUnit(f.g,0,'archer',f.tile(16,15).id),city=f.g.cities.find(c=>c.owner===1);city.buildings=['walls'];city.walls=100;a.hp=60;engine.refreshVisibility(f.g);for(let i=0;i<60;i++){a.acted=false;a.moves=2;engine.applyAction(f.g,f.p,{type:'attack',unit:a.id,targetCity:city.id});}return {xp:a.xp,rank:a.level,hp:a.hp,walls:city.walls};};
 const before=exercise(Old),after=exercise(E);assert(before.xp>=480);assert.equal(after.xp,0);assert.equal(after.rank,0);assert.equal(after.hp,60);assert.equal(after.walls,40);metrics.wallFarming={before,after};
}pass('Sixty one-HP wall hits cannot farm ranks or repeated promotion healing; wall damage remains one');
{
 const f=pair(E,'archer','infantry',34);f.a.xp=862;const copy=E.restore(E.serialize(f.g)),u=copy.units.find(u=>u.id===f.a.id);assert.equal(u.level,34);assert.equal(u.xp,862);assert.equal(R.veteranCombatBonus(u),15);assert.equal(E.serialize(E.restore(E.serialize(copy))),E.serialize(copy));
}pass('Legacy rank-34 units retain their recorded XP/rank and restore exactly without rewriting the save');
{
 const f=pair(E,'crossbow','infantry',34),hint=E.observation(f.g,f.p).legalActions.find(a=>a.type==='attack'&&a.unit===f.a.id&&a.targetUnit===f.b.id).hint,sim=new RealtimeSimulation(f.g);try{sim.enqueue(f.p,[{type:'attack',unit:f.a.id,targetUnit:f.b.id}]);sim.tick(.05);assert(f.a.activity);const copy=E.restore(E.serialize(f.g)),resumed=new RealtimeSimulation(copy);try{sim.tick(3);resumed.tick(3);assert.equal(sim.stats.rejected,0);assert.equal(E.serialize(copy),E.serialize(f.g));const dealt=100-f.b.hp;assert(Math.abs(dealt-hint.expectedDamage)<=hint.expectedDamage*.11+1);metrics.timed={expected:hint.expectedDamage,actual:dealt};}finally{resumed.dispose();}}finally{sim.dispose();}
}pass('Real timed admission/completion and mid-attack save/resume use the same bounded damage');
{
 const f=pair(E,'archer','infantry',34);f.tile(14,15).terrain='coast';const land=E.unitCombatProfile(f.g,{...f.b,tile:f.tile(15,15).id},true,f.a).strength,sea=E.unitCombatProfile(f.g,f.b,true,f.a).strength;assert(sea<land);metrics.transport={land,sea};
}pass('Transport vulnerability remains separate from the land equipment/experience balance');
assert((await fs.readFile(new URL('../saves/autosave.json',import.meta.url))).equals(save));const files=['src/engine.mjs','src/rules.mjs','scripts/combat-balance-check.mjs'],sources=Object.fromEntries(await Promise.all(files.map(async f=>[f,hash(await fs.readFile(new URL('../'+f,import.meta.url)))])));
await fs.writeFile(new URL('checks.json',out),JSON.stringify({passed:true,checks,metrics,sources,activeSaveWritten:false,gameLaunched:false,saveSha256:hash(save)},null,2)+'\n');
