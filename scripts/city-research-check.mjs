import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {field,spaceField} from './imperial-fixture.mjs';
import {siegeSupport,civilianMissionActions} from '../src/civilian-missions.mjs';
import {attackRange} from '../src/air-warfare.mjs';
import {workSlots} from '../src/heritage.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const out='output/city-research-20261019',checks=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const setup=()=>{const f=field();f.home.population=12;return f;};
{
 const {g,p,home:c}=setup();E.applyAction(g,p,{type:'produce',city:c.id,item:'monument'});c.production.progress=7;const work=structuredClone(c.production),stored=c.storedProduction,gold=p.gold;
 E.applyAction(g,p,{type:'purchase',city:c.id,item:'builder'});assert.equal(g.units.filter(u=>u.type==='builder').length,1);assert.equal(p.gold,gold-R.purchaseCost(g,'builder',p,c));assert.deepEqual(c.production,work);assert.equal(c.storedProduction,stored);assert.equal(g.units[0].moves,0);
 pass('Gold immediately deploys one unit, charges exact quoted cost, and preserves production progress/reserves');
 const gold2=p.gold;E.applyAction(g,p,{type:'purchase',city:c.id,item:'monument'});assert(c.buildings.includes('monument'));assert.equal(c.production,null);assert(p.gold<gold2);assert.throws(()=>E.applyAction(g,p,{type:'purchase',city:c.id,item:'monument'}));pass('Ordinary buildings complete immediately; duplicate buildings cannot charge twice');
}
{
 const {g,p,home:c}=setup();for(const t of g.map.tiles.filter(t=>t.owner===0&&R.dist(t,g.map.tiles[c.tile],g.map)<=2&&!R.isWater(t)&&t.terrain!=='mountain'))E.addUnit(g,0,'builder',t.id);const gold=p.gold,count=g.units.length;assert.throws(()=>E.applyAction(g,p,{type:'purchase',city:c.id,item:'builder'}));assert.equal(p.gold,gold);assert.equal(g.units.length,count);assert(E.cityPurchases(g,p,c).find(r=>r.item==='builder').reasons.some(r=>r.includes('部署')));
 pass('Blocked deployment rejects atomically and returns the same actionable quote reason');
}
{
 const {g,p,q,home:c}=setup();p.gold=0;assert.throws(()=>E.applyAction(g,p,{type:'purchase',city:c.id,item:'builder'}));assert.equal(g.units.length,0);assert.throws(()=>E.applyAction(g,q,{type:'purchase',city:c.id,item:'builder'}));assert.throws(()=>E.applyAction(g,p,{type:'purchase',city:c.id,item:'campus',tile:c.tile}));
 assert(!E.snapshot(g,1).cities.find(v=>v.id===c.id)?.purchases);pass('Insufficient funds, foreign ownership and district purchasing reject; enemy quotes remain private');
}
{
 const {g,p,home:c}=setup();const faith=p.faith;E.applyAction(g,p,{type:'recruitFaith',city:c.id,item:'naturalist'});assert.equal(g.units[0].type,'naturalist');assert(p.faith<faith);assert.equal(p.faithOrdersByType.naturalist,1);assert.equal(g.units[0].charges,1);const saved=E.serialize(g),restored=E.restore(saved);assert.equal(restored.players[0].faithOrdersByType.naturalist,1);assert.equal(E.serialize(E.restore(E.serialize(restored))),E.serialize(restored));assert.throws(()=>E.applyAction(g,p,{type:'purchase',city:c.id,item:'naturalist'}));
 pass('Secular naturalists use faith only and per-type recruitment counts survive restoration');
}
{
 const {g,p,home:c,tile}=setup();p.techs=['mining'];c.production={item:'builder',tile:null,progress:5,cost:R.productionCost(g,'builder'),funded:true};const before=E.productionRate(g,c);assert.equal(before,E.cityYields(g,c).production*1.5);const clone=E.restore(E.serialize(g));assert(clone.cities[0].production.funded);pass('Previously funded save orders retain their paid production multiplier');
 const unit=E.addUnit(g,0,'naturalist',tile(4,3).id);const a=civilianMissionActions(g,p,unit,{buildable:E.buildable}).find(a=>a.type==='establishPark');assert(a);const queue=structuredClone(c.production);E.applyAction(g,p,a);assert(tile(4,3).district?.item==='nationalpark');assert(c.buildings.includes('nationalpark'));assert(!g.units.includes(unit));assert.deepEqual(c.production,queue);pass('Naturalist establishes an actual park and consumes itself without replacing city production');
}
{
 const {g,p,home:c,tile}=setup();const d=tile(4,3);d.owner=0;d.district={city:c.id,item:'theater',kind:'district'};c.districts.push({item:'theater',tile:d.id});c.buildings.push('theater','amphitheater','museum');const ruin=tile(5,3);ruin.ruin=true;const u=E.addUnit(g,0,'archaeologist',ruin.id);E.applyAction(g,p,{type:'excavate',unit:u.id});assert(!ruin.ruin);assert.equal(u.charges,2);assert(g.heritage.works.some(w=>w.origin==='archaeology'&&workSlots(g,c).some(s=>s.id===w.slot)));E.restore(E.serialize(g));assert.throws(()=>E.applyAction(g,p,{type:'excavate',unit:u.id}));pass('Archaeology consumes a real ruin once and places a persistent work in an actual active museum slot');
}
{
 const {g,p,q,other,tile}=setup();p.visible.push(other.tile);p.knownCities[other.id]={id:other.id,owner:q.id,tile:other.tile};const u=E.addUnit(g,0,'rockband',other.tile),otherBefore=q.tourists.visiting[0]||0,ownBefore=p.tourists.visiting[1]||0;E.applyAction(g,p,{type:'concert',unit:u.id});assert(p.tourists.visiting[1]>ownBefore);assert.equal(q.tourists.visiting[0]||0,otherBefore);assert.equal(u.charges,2);assert.throws(()=>E.applyAction(g,p,{type:'concert',unit:u.id}));E.restore(E.serialize(g));pass('Concerts create targeted tourism, consume charges and reject immediate repeated performance');
}
{
 const {g,p,tile}=setup();p.religion='wisdom';const u=E.addUnit(g,0,'guru',tile(4,3).id),v=E.addUnit(g,0,'apostle',tile(5,3).id);u.religionOwner=v.religionOwner=0;v.hp=30;const sim=new RealtimeSimulation(g);assert(sim.start(p,{type:'religiousHeal',unit:u.id,targetUnit:v.id}));assert.equal(v.hp,30);sim.advance(1);assert.equal(v.hp,30);const restored=E.restore(E.serialize(g)),second=new RealtimeSimulation(restored);sim.advance(1.2);second.advance(1.2);assert.equal(v.hp,70);assert.equal(u.charges,2);assert.equal(restored.units.find(x=>x.id===v.id).hp,70);sim.dispose();second.dispose();pass('Guru healing resolves after its actual two-second cast, including save/resume mid-cast');
}
{
 const {g,p,home:c,tile}=setup();const u=E.addUnit(g,0,'warrior',tile(4,3).id);E.addUnit(g,0,'batteringram',tile(5,3).id);const city={...c,walls:100,hp:200,buildings:['walls']};let ctx=siegeSupport(g,u);assert(ctx.ram);assert.equal(R.cityAttackDamage('warrior',city,30,p,ctx).wallDamage,30);E.addUnit(g,0,'siegetower',tile(4,4).id);ctx=siegeSupport(g,u);assert.equal(R.cityAttackDamage('warrior',city,30,p,ctx).cityDamage,30);assert.equal(R.cityAttackDamage('warrior',{...city,buildings:['walls','medievalwalls','renaissancewalls']},30,p,ctx).cityDamage,0);pass('Ram and tower modify the real shared wall formula and respect wall-tier limits');
 const gun=E.addUnit(g,0,'artillery',tile(8,8).id),range=attackRange(g,gun);E.addUnit(g,0,'balloon',tile(9,8).id);assert.equal(attackRange(g,gun),range+1);E.addUnit(g,0,'observationdrone',tile(8,9).id);assert.equal(attackRange(g,gun),range+1);pass('Adjacent spotters improve actual artillery range once without stacking');
}
{
 const {g,p,tile}=setup();p.techs=Object.keys(R.TECHS);const anti=E.addUnit(g,0,'modernat',tile(4,3).id),tank=E.addUnit(g,1,'modernarmor',tile(5,3).id);const profile=E.unitCombatProfile(g,anti,false,tank);assert(profile.modifiers.some(v=>v.key==='antiCavalry'&&v.value===32));assert.equal(E.UNIT_SUCCESSORS.pikeman[0],'pikeandshot');assert.equal(E.UNIT_SUCCESSORS.galley[0],'caravel');assert.equal(E.UNIT_SUCCESSORS.scout[0],'skirmisher');pass('Recon/naval/anti-cavalry upgrade chains are closed and anti-tank bonuses recognize armored targets');
}
{const {g,p,blocked}=spaceField();const opts=E.observation(g,p).legalActions.filter(a=>a.type==='produce'&&a.item==='spaceport');assert(opts.some(a=>a.city===blocked.id&&a.hint.strategicDeposit));const top=opts.find(a=>a.hint.spaceRank===0);assert(top);assert.notEqual(top.city,blocked.id);assert(!top.hint.strategicDeposit);pass('A resource-blocked leading city yields the spaceport rank to a genuinely safe legal city');}
assert.equal(Object.keys(R.TECHS).length,64);assert.equal(Object.keys(R.CIVICS).length,47);for(const [civic,cat]of [[false,R.TECHS],[true,R.CIVICS]])for(const k of Object.keys(cat))assert(R.researchUnlocks(k,civic).length,k);pass('All 64 technologies and 47 civics expose real unlocks or implemented effects');
const baseline=JSON.parse(fs.readFileSync(out+'/baseline.json'));for(const entry of baseline.saves){const bytes=fs.readFileSync('saves/'+entry.name);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);const g=E.restore(bytes.toString());E.restore(E.serialize(g));}pass('All protected save files remain byte-identical and restore with the new source');
fs.writeFileSync(out+'/engine-checks.json',JSON.stringify({checks},null,2));console.log(checks.length+' focused engine groups passed');
