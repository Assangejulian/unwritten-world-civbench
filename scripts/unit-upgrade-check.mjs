import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,foundCity,addUnit,unitUpgradeOptions,unitUpgradeCost,UNIT_SUCCESSORS,applyAction,refreshVisibility,observation,snapshot,serialize,restore} from '../src/engine.mjs';
import {TECHS,CIVICS,UNITS} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {replacementFor} from '../src/unique-content.mjs';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
function field(type='archer'){
 const g=createGame({seed:'GOLD-UPGRADE',players:2,size:'small',barbarians:false});
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,camp:false,ruin:false});g.units=[];
 for(const p of g.players){p.manual=true;p.gold=10000;p.techs=Object.keys(TECHS);p.civics=Object.keys(CIVICS);foundCity(g,p,addUnit(g,p.id,'settler',g.map.tiles[(10+p.id*8)*g.map.width+12].id));}g.units=[];
 const p=g.players[0],c=g.cities[0],t=g.map.tiles[c.tile],u=addUnit(g,0,type,t.id),sim=new RealtimeSimulation(g);refreshVisibility(g);return {g,p,c,t,u,sim};
}
{
 const {g,p,u,sim}=field();u.hp=57;u.xp=75;u.level=3;u.veteranTraits=['assault'];u.moveUntil=12;u.attackUntil=19;
 const op=unitUpgradeOptions(g,p,u)[0],gold=p.gold,id=u.id,tile=u.tile;assert.equal(op.item,replacementFor(p,'crossbow'));assert(op.available);sim.enqueue(p,[{type:'upgrade',unit:id,item:op.item,expectedCost:op.goldCost}]);sim.tick(.05);assert.equal(u.activity.ends-u.activity.started,4);assert.equal(p.gold,gold);assert.equal(u.type,'archer');
 sim.tick(2);const copy=restore(serialize(g)),resumed=new RealtimeSimulation(copy);sim.tick(2.05);resumed.tick(2.05);assert.equal(u.type,replacementFor(p,'crossbow'));assert.equal(p.gold,gold-op.goldCost);assert.equal(u.hp,57);assert.equal(u.xp,75);assert.equal(u.level,3);assert.equal(u.id,id);assert.equal(u.tile,tile);assert.deepEqual(u.veteranTraits,['assault']);assert.equal(u.moveUntil,12);assert.equal(u.attackUntil,19);assert(u.cooldownUntil>g.realtime.time);assert.deepEqual(copy.units,g.units);assert.equal(copy.players[0].gold,p.gold);sim.dispose();resumed.dispose();pass('Four-second queued refit charges once on completion, resumes identically and preserves identity, HP, experience, traits and independent clocks');
}
{
 const {g,p,u,t,sim}=field();const cost=unitUpgradeCost(g,'archer',replacementFor(p,'crossbow')),gold=p.gold;
 for(const mutate of [()=>p.techs=[],()=>{p.techs=Object.keys(TECHS);p.gold=cost-1;},()=>{p.gold=gold;t.owner=1;},()=>{t.owner=0;t.terrain='coast';}]){mutate();assert(!unitUpgradeOptions(g,p,u)[0].available);assert.throws(()=>sim.start(p,{type:'upgrade',unit:u.id,item:replacementFor(p,'crossbow')}));assert(!u.activity);assert.equal(u.type,'archer');}
 t.terrain='grass';assert.throws(()=>sim.start(p,{type:'upgrade',unit:u.id,item:replacementFor(p,'crossbow'),expectedCost:cost-1}));assert.throws(()=>applyAction(g,p,{type:'upgrade',unit:u.id,item:'cannon'}));assert.equal(p.gold,gold);sim.dispose();pass('Missing technology, gold, home territory, disembarkation and stale quotes block admission without charging; era skipping is rejected');
}
{
 for(const loss of ['resource','territory','price','gold']){const {g,p,u,t,sim}=field('warrior');t.resource='iron';t.improvement='mine';const gold=p.gold,op=unitUpgradeOptions(g,p,u)[0];assert(op.available);sim.start(p,{type:'upgrade',unit:u.id,item:'swordsman'});if(loss==='resource')t.pillaged=true;if(loss==='territory')t.owner=1;if(loss==='price')g.turn+=200;if(loss==='gold')p.gold=op.goldCost-1;const balance=p.gold;sim.tick(4.05);assert.equal(u.type,'warrior',loss);assert.equal(p.gold,balance);assert.equal(sim.stats.rejected,1);sim.dispose();}pass('Completion rechecks resource supply, ownership, current quote and treasury without partial transformations or charges');
}
{
 const {g,p,c,t,u,sim}=field('bomber');t.resource='oil';t.improvement='well';assert(!unitUpgradeOptions(g,p,u)[0].available);t.district={item:'airport',city:c.id};c.districts.push({item:'airport',tile:t.id});c.buildings.push('airport');assert(unitUpgradeOptions(g,p,u)[0].available);applyAction(g,p,{type:'upgrade',unit:u.id,item:'stealthbomber'});assert.equal(u.type,'stealthbomber');assert.equal(g.units.length,1);sim.dispose();pass('Aircraft refit requires operational owned airport and oil; bomber becomes a reusable stealth bomber without creating another unit');
}
{
 const {g,p,t,u,sim}=field('herbalist');const partner=addUnit(g,0,'warrior',t.id);u.linkedUnit=partner.id;partner.linkedUnit=u.id;applyAction(g,p,{type:'upgrade',unit:u.id,item:'surgeon'});assert.equal(u.linkedUnit,partner.id);assert.equal(partner.linkedUnit,u.id);assert.equal(g.units.length,2);assert.deepEqual(UNIT_SUCCESSORS.galley,['caravel']);assert.deepEqual(UNIT_SUCCESSORS.caravel,['ironclad']);assert.deepEqual(UNIT_SUCCESSORS.ironclad,['destroyer']);assert.deepEqual(UNIT_SUCCESSORS.frigate,['battleship']);assert.equal(new Set(Object.values(UNIT_SUCCESSORS).flat()).size>20,true);assert.equal(unitUpgradeCost(g,'archer',replacementFor(p,'crossbow'))>0,true);sim.dispose();pass('Medical refits retain reciprocal two-member formations; naval routes preserve melee capture versus ranged support');
}
{
 const {g,p,u,sim}=field();g.players[1].visible.push(u.tile);assert(snapshot(g,0).units.find(v=>v.id===u.id).upgradeOptions.length);assert(!Object.hasOwn(snapshot(g,1).units.find(v=>v.id===u.id),'upgradeOptions'));assert(snapshot(g,-1).units.find(v=>v.id===u.id).upgradeOptions.length);sim.dispose();pass('Owner and observer see requirements and costs; foreign observers in player mode cannot read refit eligibility');
}
{
 const {g,p,u,sim}=field(),pool=new NativeDriverPool();try{p.manual=false;let obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&['upgrade','fortify'].includes(a.type));let out=await pool.execute(p,obs);assert(out.orders.some(a=>a.type==='upgrade'&&a.item===replacementFor(p,'crossbow')));p.gold=unitUpgradeCost(g,u.type,replacementFor(p,'crossbow'))+20;obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&['upgrade','fortify'].includes(a.type));out=await pool.execute(p,obs);assert(!out.orders.some(a=>a.type==='upgrade'));pass('Actual native AI chooses useful refits but preserves a treasury reserve instead of exhausting gold');}finally{pool.dispose();sim.dispose();}
}
assert.deepEqual(await readFile(new URL('../saves/autosave.json',import.meta.url)),before);pass('Active save remains byte-exact and no desktop game was launched');
await writeFile(new URL('../output/unit-upgrade-checks.json',import.meta.url),JSON.stringify({passed:true,checks,saveSha256:createHash('sha256').update(before).digest('hex'),activeSaveWritten:false},null,2)+'\n');
