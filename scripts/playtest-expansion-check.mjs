import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as H from '../src/heritage.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {unitRoute,settlementLens} from '../src/player-planning.mjs';
import * as CS from '../src/city-states.mjs';
import {congressTurn,validateCongress} from '../src/congress.mjs';
import {spyCapacity,counterspyStrength} from '../src/espionage.mjs';
import {specialistSlots,assignSpecialists} from '../src/citizens-tourism.mjs';
import {barbarianPlayer} from '../src/encounters.mjs';
import {beginWar} from '../src/warfare.mjs';
import {incomingBattles} from '../web/player-tasks.js';
import {field} from './imperial-fixture.mjs';
const out='output/playtest-expansion-20261019',checks=[];
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS '+name);};
function seen(g,p){p.explored=g.map.tiles.map(t=>t.id);p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));}
function humanField(){const f=field();f.q.manual=f.z.manual=false;return f;}
function gp(f,key,city=f.home){const v=H.GREAT_PEOPLE.find(v=>v.key===key),u=E.addUnit(f.g,f.p.id,v.classKey==='admiral'?'great_admiral':'great_person',city.tile);Object.assign(u,{greatPerson:key,charges:v.charges,activations:0});f.p.greatPeople.owned.push({key,unit:u.id});f.g.heritage.recruited[key]={owner:f.p.id,turn:f.g.turn};return u;}
await check('Current science really accumulates; the legacy tech fill lacks its required color variable',()=>{
 const g=E.restore(fs.readFileSync(out+'/world-input.json','utf8')),p=g.players[0],before=p.researchProgress[p.research],key=p.research;E.finishTurn(g,{actions:false});assert(p.techs.includes(key)||p.researchProgress[key]>before);assert(fs.readFileSync('web/ui-b/ui-b-v4.css','utf8').includes('.b4-tr{--trc:#3f78a8;'));
});
await check('Congress no longer establishes contact, creates capital reports or unlocks bilateral diplomacy',()=>{
 const {g}=field();for(const p of g.players){p.met=[];p.contacts={};}g.turn=g.congress.nextTurn;congressTurn(g,E.event);assert(g.congress.current);for(const p of g.players)assert.deepEqual(p.met,[]);validateCongress(g);
});
await check('Legacy congress contact repair retains real meetings, removes only synthetic reports, and is idempotent',()=>{
 const input=JSON.parse(fs.readFileSync(out+'/world-input.json','utf8')),g=E.restore(JSON.stringify(input));assert.deepEqual(g.players[0].met,[10,11,6]);const before=E.serialize(g);assert.equal(E.serialize(E.restore(before)),before);assert(g.players[0].explored.length<input.players[0].explored.length);assert.equal(g.settings.contactRulesVersion,2);
});
await check('City-center garrisons are sheltered from unit and city shots; stale direct attacks reject atomically',()=>{
 const {g,p,q,home,tile}=field();beginWar(g,p,q,E.event);const guard=E.addUnit(g,p.id,'warrior',home.tile),enemy=E.addUnit(g,q.id,'archer',tile(4,3).id);E.refreshVisibility(g);q.visible.push(home.tile);const choices=E.attackTargets(g,q,enemy);assert(!choices.some(a=>a.targetUnit===guard.id));assert(choices.some(a=>a.targetCity===home.id));const before=E.serialize(g);assert.throws(()=>E.applyAction(g,q,{type:'attack',unit:enemy.id,targetUnit:guard.id}));assert.equal(E.serialize(g),before);E.applyAction(g,q,{type:'attack',unit:enemy.id,targetCity:home.id});assert(home.hp<200);assert.equal(guard.hp,100);
});
await check('A breached city can be occupied through its garrison; military dies and the builder is captured alive',()=>{
 const {g,p,q,tile}=field();beginWar(g,p,q,E.event);const c=E.foundCity(g,q,E.addUnit(g,q.id,'settler',tile(15,8).id)),guard=E.addUnit(g,q.id,'warrior',c.tile),worker=E.addUnit(g,q.id,'builder',c.tile),u=E.addUnit(g,p.id,'warrior',tile(14,8).id);guard.linkedUnit=worker.id;worker.linkedUnit=guard.id;worker.charges=1;c.hp=c.walls=0;E.refreshVisibility(g);assert(E.canOccupyCity(g,u,c));E.applyAction(g,p,{type:'move',unit:u.id,tile:c.tile});assert.equal(c.owner,p.id);assert(!g.units.includes(guard));assert.equal(worker.owner,p.id);assert.equal(worker.charges,1);assert.equal(worker.hp,100);E.restore(E.serialize(g));
});
await check('Barbarian city fire preserves capital ownership and one HP, without damaging sheltered troops',()=>{
 const {g,p,home,tile}=field();home.hp=1;home.walls=0;const u=E.addUnit(g,-1,'warrior',tile(4,3).id),guard=E.addUnit(g,p.id,'warrior',home.tile),b=barbarianPlayer(g,u);E.refreshVisibility(g);assert(!E.canOccupyCity(g,u,{...home,hp:0}));E.applyAction(g,b,{type:'attack',unit:u.id,targetCity:home.id});assert.equal(home.hp,1);assert.equal(home.owner,p.id);assert.equal(guard.hp,100);
});
await check('Move and melee capture preserve settlers and builder charges, enforce two-unit links, and restore',()=>{
 for(const type of ['settler','builder'])for(const action of ['move','attack']){const {g,p,q,tile}=field();beginWar(g,p,q,E.event);const a=E.addUnit(g,p.id,'warrior',tile(8,8).id),b=E.addUnit(g,q.id,type,tile(9,8).id);if(type==='builder')b.charges=1;E.refreshVisibility(g);const previous=E.snapshot(g,q.id);E.applyAction(g,p,action==='move'?{type:'move',unit:a.id,tile:b.tile}:{type:'attack',unit:a.id,targetUnit:b.id});assert.equal(b.owner,p.id);assert.equal(b.type,type);assert.equal(b.hp,100);if(type==='builder')assert.equal(b.charges,1);assert.equal(E.linkedPartner(g,a),b);assert.equal(incomingBattles(previous,E.snapshot(g,q.id),q.id)[0].captured,true);E.restore(E.serialize(g));}
});
await check('Peace, a military escort and an already-linked captor prevent free civilian capture',()=>{
 const {g,p,q,tile}=field(),a=E.addUnit(g,p.id,'warrior',tile(8,8).id),b=E.addUnit(g,q.id,'builder',tile(9,8).id);E.refreshVisibility(g);assert(!E.canCaptureCivilian(g,a,b));beginWar(g,p,q,E.event);const guard=E.addUnit(g,q.id,'warrior',b.tile);guard.linkedUnit=b.id;b.linkedUnit=guard.id;assert(!E.canCaptureCivilian(g,a,b));assert(!E.reachable(g,p,a).some(m=>m.tile===b.tile));
});
await check('City-states receive distinct bounded territories, immediate border contact and neutral passage restrictions',()=>{
 const {g,p,tile}=field();g.cityStates.states.push({id:1,name:'Test state',tile:tile(12,10).id,type:'science',hp:200,envoys:{},met:[],wars:[],capturedBy:null,levyUntil:0});g.map.tiles[tile(12,10).id].cityState=1;CS.initializeCityStates(g);const s=g.cityStates.states[0];assert.equal(s.territory.length,7);const u=E.addUnit(g,p.id,'warrior',tile(10,10).id);E.refreshVisibility(g);assert(s.met.includes(p.id));const border=g.map.tiles[s.territory.find(id=>id!==s.tile)];assert(!Number.isFinite(E.movementCost(g,p,u,g.map.tiles[u.tile],border)));s.envoys[p.id]=3;assert(Number.isFinite(E.movementCost(g,p,u,g.map.tiles[u.tile],border)));assert(!E.canSettle(g,p,g.map.tiles[s.tile]));assert(!E.canSettle(g,p,tile(14,10)));E.restore(E.serialize(g));
});
await check('City-state growth stays inside two rings and never creates a settler or a second city',()=>{
 const {g,p,tile}=field();g.cityStates.states.push({id:1,name:'Test state',tile:tile(12,10).id,type:'science',hp:200,envoys:{[p.id]:3},met:[p.id],wars:[],capturedBy:null,levyUntil:0});CS.initializeCityStates(g);const cities=g.cities.length;for(let i=0;i<120;i++){g.turn++;CS.cityStatesTurn(g,{addUnit:E.addUnit,deploymentFree:E.deploymentFree,event:E.event,damage:()=>10});}const s=g.cityStates.states[0];assert.equal(s.territory.length,19);assert.equal(g.cities.length,cities);assert(!g.units.some(u=>u.type==='settler'));E.restore(E.serialize(g));
});
await check('Neutral city-state conquest supports Keep/Raze and restores its exact pending provenance',()=>{
 for(const disposition of ['keepCity','razeCity']){const {g,p,tile}=humanField(),s={id:1,name:'Test state',tile:tile(12,10).id,type:'science',hp:1,envoys:{},met:[p.id],wars:[p.id],capturedBy:null,levyUntil:0};g.cityStates.states.push(s);g.map.tiles[s.tile].cityState=s.id;CS.initializeCityStates(g);const u=E.addUnit(g,p.id,'warrior',tile(11,10).id);E.refreshVisibility(g);E.applyAction(g,p,{type:'attackCityState',state:s.id,unit:u.id});const c=g.cities.find(c=>c.cityStateOrigin===s.id);assert(c?.capturePending);assert.equal(c.capturePending.previousOwner,null);const copy=E.restore(E.serialize(g)),owner=copy.players[p.id];E.applyAction(copy,owner,{type:disposition,city:c.id});assert.equal(copy.cities.some(v=>v.id===c.id),disposition==='keepCity');if(disposition==='razeCity')assert(copy.cityStates.states[0].razed);E.restore(E.serialize(copy));}
});
await check('Returning to realtime clears human travel/alert state instead of creating an invalid save',()=>{
 const {g,p,tile}=humanField(),u=E.addUnit(g,p.id,'warrior',tile(6,9).id);seen(g,p);E.refreshVisibility(g);const sim=new GameSimulation(g);sim.command(p,{type:'route',unit:u.id,tile:tile(12,9).id});assert(u.moveOrder);sim.setControl(p,false);assert(!u.moveOrder);assert.equal(g.settings.playMode,'realtime');E.restore(E.serialize(g));sim.dispose();
});
await check('Settlement lens scores remembered yields and rejects blocked sites without revealing hidden changes',()=>{
 const {g,p,tile}=field();seen(g,p);const t=tile(10,10);t.river=true;p.knownTiles[t.id]={...t};const sites=settlementLens(g,p),good=sites.find(s=>s.tile===t.id);assert(good.legal);assert(!sites.find(s=>s.tile===g.cities[0].tile).legal);const before=JSON.stringify(sites);t.resource='uranium';t.owner=1;assert.equal(JSON.stringify(settlementLens(g,p)),before);
});
await check('Multi-turn route estimates actual per-round budgets, respects fog, and does not read hidden occupancy',()=>{
 const {g,p,q,tile}=field(),u=E.addUnit(g,p.id,'warrior',tile(5,9).id);seen(g,p);E.refreshVisibility(g);const to=tile(11,9).id,route=unitRoute(g,p,u,to);assert.equal(route.turns,3);assert.deepEqual(route.arrivals,[1,1,1,2,2,3,3]);const hidden=E.addUnit(g,q.id,'warrior',tile(9,9).id);assert(!p.visible.includes(hidden.tile));assert.deepEqual(unitRoute(g,p,u,to),route);p.explored=p.explored.filter(id=>id!==to);assert.equal(unitRoute(g,p,u,to),null);
});
await check('Continuous movement executes real legs, survives a mid-route save and stops exactly at destination',async()=>{
 const {g,p,tile}=humanField(),u=E.addUnit(g,p.id,'warrior',tile(5,9).id);seen(g,p);E.refreshVisibility(g);const s=new GameSimulation(g);s.command(p,{type:'route',unit:u.id,tile:tile(11,9).id});assert.equal(u.tile,tile(7,9).id);const clone=E.restore(E.serialize(g)),other=new GameSimulation(clone);await s.endTurn(p.id);await other.endTurn(p.id);assert.equal(u.tile,tile(9,9).id);assert.equal(clone.units.find(v=>v.id===u.id).tile,u.tile);await s.endTurn(p.id);assert.equal(u.tile,tile(11,9).id);assert(!u.moveOrder);s.dispose();other.dispose();
});
await check('New visible enemies interrupt automatic travel; alert stays asleep and wakes on nearby threats',async()=>{
 const {g,p,q,tile}=humanField(),u=E.addUnit(g,p.id,'warrior',tile(5,9).id);seen(g,p);E.refreshVisibility(g);const s=new GameSimulation(g);s.command(p,{type:'route',unit:u.id,tile:tile(11,9).id});beginWar(g,p,q,E.event);const enemy=E.addUnit(g,q.id,'warrior',tile(8,9).id);E.refreshVisibility(g);await s.endTurn(p.id);assert(!u.moveOrder);assert.equal(u.tile,tile(7,9).id);g.units=g.units.filter(v=>v!==enemy);E.refreshVisibility(g);s.command(p,{type:'alert',unit:u.id});await s.endTurn(p.id);assert.equal(u.stance,'alert');assert(u.acted);E.addUnit(g,q.id,'warrior',tile(8,9).id);E.refreshVisibility(g);await s.endTurn(p.id);assert(!u.stance);assert(!u.acted);s.dispose();
});
await check('Shift-style force end resolves pending occupation as Keep and skips tasks without prompting',async()=>{
 const {g,p,q,tile}=humanField();beginWar(g,p,q,E.event);const c=E.foundCity(g,q,E.addUnit(g,q.id,'settler',tile(15,8).id));c.hp=c.walls=0;const u=E.addUnit(g,p.id,'warrior',tile(14,8).id);E.refreshVisibility(g);const s=new GameSimulation(g);s.command(p,{type:'move',unit:u.id,tile:c.tile});await assert.rejects(s.endTurn(p.id));await s.endTurn(p.id,{force:true});assert.equal(g.turn,2);assert.equal(c.owner,p.id);assert(!c.capturePending);s.dispose();
});
await check('Heritage adaptation preserves the roster and grants Crassus only one extra envoy',()=>{
 assert.equal(H.GREAT_PEOPLE.length,256);assert.equal(H.HERITAGE_WONDERS.length,64);const f=field(),u=gp(f,'marcus_licinius_crassus'),before=f.p.envoys;E.applyAction(f.g,f.p,{type:'activateGreatPerson',unit:u.id,city:f.home.id});assert.equal(f.p.envoys,before+1);assert.throws(()=>E.applyAction(f.g,f.p,{type:'activateGreatPerson',unit:u.id,city:f.home.id}));assert.equal(f.p.envoys,before+1);E.restore(E.serialize(f.g));
});
await check('Potala completion envoy is once-only; congress locks one extra legal vote and restores',()=>{
 const {g,p,home}=field();g.wonders.potala_palace={owner:p.id,city:home.id,tile:home.tile,birthGranted:false};const before=p.envoys;H.heritageCompleted(g,p,home,'potala_palace',{addUnit:E.addUnit,event:E.event,boost:E.boost});H.heritageCompleted(g,p,home,'potala_palace',{addUnit:E.addUnit,event:E.event,boost:E.boost});assert.equal(p.envoys,before+1);g.turn=g.congress.nextTurn;congressTurn(g,E.event);assert.equal(g.congress.current.weights[p.id],2);validateCongress(g);
});
await check('Forbidden City capacity and counterspy benefits follow actual city ownership',()=>{
 const {g,p,q,home}=field(),base=spyCapacity(p,g);g.wonders.forbidden={owner:p.id,city:home.id,tile:home.tile};assert.equal(spyCapacity(p,g),base+1);assert.equal(counterspyStrength(g,home).multiplier,.8);home.owner=q.id;assert.equal(spyCapacity(p,g),base);assert.equal(spyCapacity(q,g),base+1);
});
await check('Fugger specialist bonus needs an actual operational assigned commercial slot',()=>{
 const f=field(),{g,p,home,tile}=f;home.population=3;home.buildings.push('commercial','market');tile(4,3).district={item:'commercial',city:home.id,kind:'district'};tile(4,3).owner=p.id;home.districts.push({item:'commercial',tile:tile(4,3).id});assert(specialistSlots(g,home).commercial>0);home.specialistMode='manual';home.specialists={commercial:1};const u=gp(f,'jakob_fugger'),before=assignSpecialists(g,home,[]).flat.gold;E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,city:home.id});assert.equal(assignSpecialists(g,home,[]).flat.gold,before+1);tile(4,3).pillaged=true;assert.equal(assignSpecialists(g,home,[]).flat.gold||0,0);E.restore(E.serialize(g));
});
await check('Scipio levy discount persists past movement expiry and takes the best discount instead of stacking',()=>{
 const f=field(),{g,p,tile}=f,target=E.addUnit(g,p.id,'warrior',tile(4,3).id),u=gp(f,'scipio_africanus');const state={};const before=CS.levyCost(g,p,state);E.applyAction(g,p,{type:'activateGreatPerson',unit:u.id,targetUnit:target.id,city:f.home.id});assert.equal(CS.levyCost(g,p,state),Math.ceil(before*.75));g.turn=8;assert.equal(CS.levyCost(g,p,state),Math.ceil(before*.75));p.governors.roster.gov_diplomat={city:f.home.id,establishedAt:0,promotions:['a','b']};assert.equal(CS.levyCost(g,p,state),Math.ceil(before*.7));
});
fs.writeFileSync(out+'/engine-checks.json',JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,groups:checks.length}));
