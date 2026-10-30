// Independent proposal expectations and real disposable-world event assertions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as L from '../src/leader-events.mjs';
import {REWORKED_LEADERS} from '../src/leader-rework.mjs';
import {UNIQUE_UNITS,UNIQUE_BUILDINGS} from '../src/unique-content.mjs';
import {neighbors,tilesInRange} from '../src/world.mjs';
import {fortConstructionSeconds,beginWar} from '../src/warfare.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const out='output/leader-strength-20261014',proposal=fs.readFileSync(out+'/proposal.md','utf8'),checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const headings=[...proposal.matchAll(/^  - \*\*专属特色(?:兵种|建筑).*?（`([^`]+)`，[\s\S]*?(?=^  - \*\*专属|^- \*\*AI|^<details>)/gm)];
assert.equal(headings.length,50,'All proposal replacement blocks were parsed');
const yieldKeys={'科技':'science','文化':'culture','金币':'gold','生产力':'production','信仰':'faith','食物':'food','旅游':'tourism'};
for(const match of headings){const key=match[1],unit=R.UNITS[key],building=R.BUILDINGS[key],spec=unit||building;assert(spec,key);if(key==='sea_dog')continue;
 const attributes=match[0].match(/属性：([^\n]+)/)[1].replace(/（[^）]*）/g,'').replaceAll('**','');
 for(const [label,field]of [['造价','cost'],['移动','moves'],['近战','strength'],['远程','ranged'],['射程','range']]){const n=attributes.match(new RegExp(label+'\\s*`(\\d+)`'));if(n)assert.equal(spec[field],Number(n[1]),key+' '+field+' matches detailed Gemini proposal');}
 if(building){for(const n of attributes.matchAll(/\+(\d+)\s*(科技|文化|金币|生产力|信仰|食物|旅游)/g)){const yieldKey=yieldKeys[n[2]],actual=key==='great_wall_bastion'&&yieldKey==='tourism'?spec.flightTourism:key==='suguba_market'&&yieldKey==='science'?spec.holyOrRiverScience:key==='obelisk'&&['production','tourism'].includes(yieldKey)?spec.riverYields[yieldKey]:spec.yields[yieldKey];assert.equal(actual,Number(n[1]),key+' yield '+n[2]);}const housing=attributes.match(/\+(\d+)\s*住房/);if(housing)assert.equal(spec.housing,Number(housing[1]));}
}
pass('All 50 proposal blocks audited: 24 unique units and 25 structures match detailed original costs, strength, movement and listed base yields; Sea Dog retains its explicit exception');
const accepted=new Set(['tokugawa.passive.effects.loyaltyImmunity','alexander.passive.effects.noWarWeariness','alexander.passive.effects.captureHeal','genghis.passive.effects.cavalryUpkeepDiscount','genghis.passive.units.0.combat','genghis.passive.units.1.combat','genghis.active.units.0.combat']);
function numbers(a,b,name){for(const [key,value]of Object.entries(a)){const field=name+'.'+key,actualKey=key==='bonusMove'?(name.startsWith('genghis.')?'cavalryMove':'landMove'):key;if(accepted.has(field))continue;if(value&&typeof value==='object')numbers(value,b?.[actualKey]||{},field);else if(typeof value==='number')assert.equal(b?.[actualKey],value,field+' retains proposal strength');}}
for(const draft of JSON.parse(fs.readFileSync(out+'/proposal-leaders.json','utf8'))){if(draft.key==='qin')draft.passive.cities=[{when:'capitalOrWalls',flat:{culture:2,production:1},multipliers:{}}];numbers(draft,REWORKED_LEADERS[draft.key],draft.key);}
pass('All 25 leader numeric drafts retain original strength except the documented immunity/healing/Genghis exceptions');
function field(key='saladin'){
 const g=E.createGame({seed:'STRENGTH-RESTORE',size:'small',players:4,barbarians:false,leaders:[key,...R.LEADERS.filter(l=>l.key!==key).slice(0,3).map(l=>l.key)]});
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,resource:null,owner:null,cityId:null,district:null,improvement:null,fort:null});
 g.realtime={version:1,time:0,period:20,nextEconomy:20,queues:{},sequence:0};const p=g.players[0],q=g.players[1];for(const [i,player]of g.players.entries()){const settler=g.units.find(u=>u.owner===player.id&&u.type==='settler');settler.tile=(18+i*4)*g.map.width+18;E.foundCity(g,player,settler);}const c=g.cities[0],enemy=g.cities[1];g.units=[];p.gold=10000;c.population=8;for(const t of tilesInRange(g.map,g.map.tiles[c.tile],3))Object.assign(t,{owner:p.id,territoryCity:c.id});p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];return {g,p,q,c,enemy};
}
{
 const {g,p,c}=field(),u=E.addUnit(g,p.id,'mamluk_knight',c.tile);Object.assign(u,{hp:40,acted:true,moves:0,attackUntil:4});L.uniquePeriod(g,p);assert.equal(u.hp,50);assert.equal(u.moves,0);assert.equal(u.attackUntil,4);u.hp=97;L.uniquePeriod(g,p);assert.equal(u.hp,100);
 const holy=neighbors(g.map,g.map.tiles[c.tile])[0];c.buildings=['campus','library','ayyubid_madrasa','holy'];c.districts=[{item:'holy',tile:holy.id}];holy.district={item:'holy',city:c.id};assert.equal(L.uniqueCityBonuses(g,p,c,()=>4).flat.science,4);holy.pillaged=true;assert(!L.uniqueCityBonuses(g,p,c,()=>4).flat.science);
 pass('Mamluk heals 10 after action without resetting movement/cooldowns; Madrasa converts 100% adjacency and respects pillage');
}
{
 const {g,p,c}=field('taizong');p.met=[1,2,3];for(const id of p.met)p.relations[id]={status:'alliance'};c.buildings=['theater','honglu_pavilion'];let bonus=L.uniqueCityBonuses(g,p,c,()=>0);assert.equal(bonus.flat.science,6);assert.equal(bonus.flat.culture,6);
 p.leaderKey='han-wudi';c.buildings=['commercial','salt_iron_office'];const plots=neighbors(g.map,g.map.tiles[c.tile]);for(const t of plots.slice(0,4))Object.assign(t,{owner:p.id,territoryCity:c.id,improvement:'mine'});bonus=L.uniqueCityBonuses(g,p,c,()=>0);assert.equal(bonus.flat.gold,6);
 p.leaderKey='cleopatra';c.buildings=['campus','library','ptolemaic_mouseion'];g.routes=[{owner:p.id,from:c.id,to:g.cities[1].id},{owner:p.id,from:c.id,to:g.cities[2].id}];bonus=L.uniqueCityBonuses(g,p,c,()=>0);assert.equal(bonus.flat.science,2);assert.equal(bonus.flat.culture,2);
 pass('Restored diplomatic/resource values and foreign-route culture execute, with original proposal caps');
}
{
 const {g,p,c}=field('pericles'),t=neighbors(g.map,g.map.tiles[c.tile])[0];c.buildings=['theater','acropolis_odeon'];c.districts=[{item:'theater',tile:t.id}];Object.assign(t,{hill:true,district:{item:'theater',city:c.id}});const bonus=L.uniqueCityBonuses(g,p,c,()=>0);assert.equal(bonus.flat.culture,2);assert.equal(bonus.flat.gold,2);
 p.leaderKey='mansa-musa';c.buildings=['commercial','suguba_market'];c.districts=[];g.map.tiles[c.tile].river=true;assert.equal(L.uniqueCityBonuses(g,p,c,()=>0).flat.science,2);g.map.tiles[c.tile].river=false;assert(!L.uniqueCityBonuses(g,p,c,()=>0).flat.science);Object.assign(t,{hill:false,district:{item:'holy',city:c.id},owner:p.id});assert.equal(L.uniqueCityBonuses(g,p,c,()=>0).flat.science,2);t.pillaged=true;assert(!L.uniqueCityBonuses(g,p,c,()=>0).flat.science);
 pass('Acropolis hill/city-center rewards and Suguba river/adjacent-holy science execute with operational territory checks');
}
{
 const {g,p,c}=field('qin');p.techs=['masonry'];p.manual=true;c.buildings=['great_wall_bastion'];const tile=neighbors(g.map,g.map.tiles[c.tile])[0],builder=E.addUnit(g,p.id,'builder',tile.id);assert.equal(fortConstructionSeconds(g,p,builder),6);c.buildings=[];assert.equal(fortConstructionSeconds(g,p,builder),12);c.buildings=['great_wall_bastion'];const sim=new RealtimeSimulation(g);sim.ready();sim.enqueue(p,[{type:'buildFort',unit:builder.id}],{manual:true});sim.play();sim.tick(.05);assert.equal(builder.activity.ends-builder.activity.started,6);const clone=E.restore(E.serialize(g)),resumed=new RealtimeSimulation(clone);sim.tick(7);resumed.play();resumed.tick(7);assert(tile.fort);assert.deepEqual(clone.map.tiles[tile.id].fort,tile.fort);assert.equal(builder.charges,clone.units.find(u=>u.id===builder.id).charges);sim.dispose();resumed.dispose();
 pass('Great Wall builder fort construction actually takes half time and resumes exactly from a timed save');
}
{
 const {g,p,c}=field('elizabeth');c.buildings=['harbor','lighthouse','royal_dockyard'];const ship=E.addUnit(g,p.id,'sea_dog',c.tile);L.unitProduced(g,p,c,ship);assert.equal(ship.xp,15);assert.equal(R.unitMovement(ship,p),6);assert.equal(ship.movementBonus,1);assert.equal(E.restore(E.serialize(g)).units.find(u=>u.id===ship.id).movementBonus,1);
 const {g:h,p:r,c:d}=field('genghis');d.buildings=['mongol_ordu'];const rider=E.addUnit(h,r.id,'keshig',d.tile);L.unitProduced(h,r,d,rider);assert.equal(rider.xp,15);assert.equal(R.unitMovement(rider,r),6);
 pass('Dockyard ships and Ordu cavalry receive actual +1 movement/+15 XP, retaining save metadata');
}
{
 const {g,p,q,c}=field('alexander'),tile=neighbors(g.map,g.map.tiles[c.tile])[0],rider=E.addUnit(g,p.id,'hetairoi',c.tile),foot=E.addUnit(g,p.id,'warrior',tile.id);assert.equal(L.uniqueCombatBonus(g,rider,false,null,p.id,false),3);assert.equal(L.uniqueCombatBonus(g,foot,false,null,p.id,false),3);assert.equal(L.uniqueCombatBonus(g,foot,true,null,p.id,false),0);p.visible=[foot.tile];assert.equal(L.uniqueCombatBonus(g,foot,false,null,p.id,false),0);
 p.leaderKey='qin';p.visible=g.map.tiles.map(t=>t.id);rider.type='qin_crossbow';assert.equal(L.uniqueCombatBonus(g,rider,false,null,p.id,true),4);assert.equal(L.uniqueCombatBonus(g,rider,false,null,p.id,false),0);
 pass('Hetairoi grants +3 to both adjacent partners on offense; Qin cohesion grants ranged-only +4 and hidden units never affect previews');
}
{
 const {g,p,q,c,enemy}=field('suleiman');p.met.push(q.id);q.met.push(p.id);beginWar(g,p,q,()=>{});const spot=neighbors(g.map,g.map.tiles[enemy.tile])[0],u=E.addUnit(g,p.id,'janissary',spot.id);assert.equal(L.uniqueCombatBonus(g,u,false,null,p.id,false),3);p.visible=[u.tile];delete p.knownCities[enemy.id];assert.equal(L.uniqueCombatBonus(g,u,false,null,p.id,false),0);p.visible=g.map.tiles.map(t=>t.id);p.relations[q.id].status='peace';assert.equal(L.uniqueCombatBonus(g,u,false,null,p.id,false),0);
 pass('Janissary uses original +3 near an enemy city, requires war and hides unseen city bonuses in previews');
}
{
 const {g,p,c}=field('mansa-musa'),u=E.addUnit(g,p.id,'mandekalu_cavalry',c.tile),enemy={type:'modernarmor'};g.map.tiles[c.tile].owner=null;let gold=p.gold;L.killEffects(g,p,u,enemy);assert.equal(p.gold-gold,110);
 p.leaderKey='elizabeth';u.type='sea_dog';gold=p.gold;L.killEffects(g,p,u,enemy);assert.equal(p.gold,gold);u.type='galley';L.killEffects(g,p,u,enemy);assert.equal(p.gold-gold,15*(1+R.civilizationEra(p)*.5));
 pass('Mandekalu receives full victim strength outside home territory; Sea Dog receives no unique or leader bounty');
}
{
 const {g,p,q,c,enemy}=field('hatshepsut'),spot=neighbors(g.map,g.map.tiles[enemy.tile])[0];spot.terrain='coast';E.addUnit(g,p.id,'punt_expedition_ship',spot.id);delete p.knownCities[enemy.id];const gold=p.gold,faith=p.faith;E.refreshVisibility(g);assert.equal(p.gold-gold,15);assert.equal(p.faith-faith,15);E.refreshVisibility(g);assert.equal(p.gold-gold,15);
 pass('Punt discovery grants actual 15 gold/faith once, using current model values');
}
{
 const {g,p,c}=field('wu-zetian');c.buildings=['holy','shrine','mingtang_hall'];const gold=p.gold,culture=p.cultureBank||0;L.productionCompleted(g,p,c,'festival');assert.equal(p.gold-gold,25);assert.equal(p.cultureBank-culture,15);
 p.leaderKey='alexander';c.buildings=['basilikoi_paides'];const science=p.scienceBank||0;L.productionCompleted(g,p,c,'warrior');assert.equal(p.scienceBank-science,R.UNITS.warrior.cost*.25);
 p.leaderKey='peter';c.buildings=['industrial','peter_arsenal','harbor'];for(const type of ['galley','cannon']){const work={item:type},boosted=E.productionRate(g,c,work,10);c.buildings=c.buildings.filter(k=>k!=='peter_arsenal');const ordinary=E.productionRate(g,c,work,10);c.buildings.push('peter_arsenal');assert(Math.abs(boosted/ordinary-1.2)<1e-9);}const work={item:'warrior'},normal=E.productionRate(g,c,work,10);c.buildings=c.buildings.filter(k=>k!=='peter_arsenal');assert.equal(E.productionRate(g,c,work,10),normal);
 c.buildings.push('peter_arsenal');const harbor=neighbors(g.map,g.map.tiles[c.tile])[0];c.districts=[{item:'harbor',tile:harbor.id}];harbor.pillaged=true;const without=E.productionRate(g,c,{item:'galley'},10);harbor.pillaged=false;assert(Math.abs(E.productionRate(g,c,{item:'galley'},10)/without-1.2)<1e-9);
 pass('Mingtang project refunds, military science refunds and Peter naval/artillery production execute with exact original values and pillage scope');
}
{
 const {g,p,c}=field('sejong');p.techs=Object.keys(R.TECHS);const before=p.scienceBank||0;L.leaderInstant(g,p,{scienceBurst:25},E.cityYields,E.orderCost);assert.equal(p.scienceBank-before,25*(1+R.civilizationEra(p)*.5));
 for(const type of Object.keys(R.UNITS)){const ordinary=R.UNITS[R.UNITS[type].replaces||type];if(!ordinary.salary)continue;for(const policies of [[],['conscription']]){const actual=R.unitUpkeep(type,{...p,leaderKey:'shaka',policies}),base=R.unitUpkeep(R.UNITS[type].replaces||type,{leaderRulesVersion:1,policies:[]});assert(actual.total+.02>=base.total*(policies.length?.2:.4));}}
 assert.equal(R.UNITS.qin_crossbow.ancientWallDamage,.2);assert.equal(R.UNITS.maurya_war_elephant.ancientWallDamage,.3);assert.equal(REWORKED_LEADERS.genghis.passive.units[0].combat,2);assert.equal(REWORKED_LEADERS.alexander.passive.effects.captureHeal,12);
 pass('Original era burst executes; all military models retain multiplicative upkeep floors and accepted wall/Genghis/Alexander caps');
}
const files=['src/unique-content.mjs','src/leader-rework.mjs','src/leader-events.mjs','src/engine.mjs','src/rules.mjs','src/warfare.mjs','src/realtime.mjs','scripts/leader-strength-check.mjs'];
const sources=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.writeFileSync(out+'/rules.json',JSON.stringify({passed:true,checks,sources,metrics,scope:'Original proposal values and disposable authoritative effects, saves, privacy and accepted constraints; no live game or save writes'},null,2));
