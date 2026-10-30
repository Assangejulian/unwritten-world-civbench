import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as H from '../src/heritage.mjs';
import * as R from '../src/rules.mjs';
import {indexMap,neighbors,tilesInRange} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {initializeWarfare} from '../src/warfare.mjs';
const out=new URL('../output/great-person-return-20261016/',import.meta.url),checks=[];await fs.mkdir(out,{recursive:true});
function field(){
 const g=E.createGame({players:2,size:'small',seed:'GREAT-PERSON-RETURN',barbarians:false});g.units=[];g.cities=[];
 g.map=indexMap({width:28,height:20,wrapX:false,roadRules:1,tiles:Array.from({length:560},(_,id)=>({id,col:id%28,row:Math.floor(id/28),q:id%28-Math.floor(Math.floor(id/28)/2),r:Math.floor(id/28),terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[]}))});
 const p=g.players[0],q=g.players[1],capital=E.foundCity(g,p,E.addUnit(g,0,'settler',87)),home=E.foundCity(g,p,E.addUnit(g,0,'settler',108));E.foundCity(g,q,E.addUnit(g,1,'settler',451));g.units=[];
 for(const player of g.players){player.manual=true;player.visible=g.map.tiles.map(t=>t.id);player.explored=player.visible.slice();player.met=[1-player.id];player.relations[1-player.id].status='war';}
 const clock=new RealtimeSimulation(g);clock.dispose();initializeWarfare(g);
 return {g,p,q,capital,home,battle:g.map.tiles[231]};
}
function person(f,cls='scientist'){
 const spec=H.GREAT_PEOPLE.find(v=>v.classKey===cls),u=E.addUnit(f.g,0,cls==='admiral'?'great_admiral':'great_person',f.battle.id);
 Object.assign(u,{greatPerson:spec.key,recruitmentCity:f.home.id,charges:spec.charges,activations:0});f.p.greatPeople.owned.push({key:spec.key,unit:u.id});f.g.heritage.recruited[spec.key]={owner:0,turn:f.g.turn,city:f.home.id};return u;
}
function invader(f,type='warrior'){const t=neighbors(f.g.map,f.battle)[0];return E.addUnit(f.g,1,type,t.id);}
function pass(name){checks.push(name);console.log('PASS '+name);}
{
 const f=field(),spec=H.greatPersonCandidate(f.g,'scientist');
 for(const t of tilesInRange(f.g.map,f.g.map.tiles[f.capital.tile],2))E.addUnit(f.g,0,'warrior',t.id);
 f.p.greatPeople.points.scientist=10000;E.applyAction(f.g,f.p,{type:'recruitGreatPerson',item:spec.key});
 const u=f.g.units.find(u=>u.greatPerson===spec.key);assert.equal(u.recruitmentCity,f.home.id);assert.equal(f.g.heritage.recruited[spec.key].city,f.home.id);
 const copy=E.restore(E.serialize(f.g));assert.equal(copy.units.find(v=>v.id===u.id).recruitmentCity,f.home.id);
}
pass('Real recruitment records the actual spawning city, including a blocked capital and save restoration');
for(const type of ['warrior','archer','knight']){
 const f=field(),u=person(f),enemy=invader(f,type),charges=u.charges;
 E.addUnit(f.g,0,'warrior',f.home.tile);
 assert(E.reachable(f.g,f.q,enemy).some(a=>a.tile===u.tile));
 E.applyAction(f.g,f.q,{type:'move',unit:enemy.id,tile:u.tile});
 assert.equal(enemy.tile,f.battle.id);assert.equal(u.tile,f.home.tile,'Return must use the recruitment city, not the nearer capital or a free adjacent tile');
 assert.equal(u.hp,100);assert.equal(u.charges,charges);assert.equal(u.returnSequence,1);assert(!E.snapshot(f.g,-1).visuals.events.some(e=>e.kind==='death'&&e.actor.id===u.id));
 assert.equal(E.snapshot(f.g,1).units.find(v=>v.id===u.id)?.recruitmentCity,undefined);
}
pass('Melee, ranged and cavalry entry instantly return the unharmed Great Person to its exact recruitment city, even with a friendly garrison');
{
 const f=field(),u=person(f),civilian=invader(f,'builder');assert(!E.reachable(f.g,f.q,civilian).some(a=>a.tile===u.tile));
 civilian.tile=u.tile;assert.equal(H.evacuateGreatPeople(f.g),false);assert.equal(u.tile,f.battle.id);
 civilian.type='warrior';f.p.relations[1].status=f.q.relations[0].status='peace';assert.equal(H.evacuateGreatPeople(f.g),false);
 f.p.relations[1].status=f.q.relations[0].status='alliance';assert.equal(H.evacuateGreatPeople(f.g),false);
}
pass('Ordinary civilians cannot displace a Great Person; peace and allied combat units do not trigger returns');
{
 const f=field(),u=person(f),enemy=invader(f),sim=new RealtimeSimulation(f.g);
 try{
  const to=neighbors(f.g.map,f.battle).find(t=>t.id!==enemy.tile);
  sim.start(f.p,{type:'move',unit:u.id,tile:to.id});u.activity.ends=5;
  sim.enqueue(f.p,[{type:'move',unit:u.id,tile:to.id}]);sim.start(f.q,{type:'move',unit:enemy.id,tile:f.battle.id});
  assert(enemy.activity.ends<5);sim.tick(2);assert.equal(u.tile,f.home.tile);assert(!u.activity);assert(!f.g.realtime.queues[0].some(q=>q.action.unit===u.id));
  E.refreshVisibility(f.g);const clone=new RealtimeSimulation(E.restore(E.serialize(f.g)));
  try{sim.tick(5);clone.tick(5);assert.equal(u.tile,f.home.tile);const a=JSON.parse(E.serialize(f.g)),b=JSON.parse(E.serialize(clone.game));const differences=[];function diff(x,y,path=''){if(JSON.stringify(x)===JSON.stringify(y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const key of new Set([...Object.keys(x),...Object.keys(y)]))if(differences.length<8)diff(x[key],y[key],path+'.'+key);}else differences.push({path,a:x,b:y});}diff(a,b);assert.deepEqual(differences,[]);}finally{clone.dispose();}
 }finally{sim.dispose();}
}
pass('Realtime contact cancels an in-flight Great Person path and queued orders; no stale continuation survives saving or subsequent ticks');
{
 const f=field(),u=person(f),enemy=invader(f);f.p.manual=false;
 let resolveDriver,entered;const executing=new Promise(resolve=>entered=resolve),response=new Promise(resolve=>resolveDriver=resolve);
 const sim=new RealtimeSimulation(f.g,{execute:()=>{entered();return response;},maxDrivers:1});
 try{
  sim.play();await sim.plan();await executing;
  E.applyAction(f.g,f.q,{type:'move',unit:enemy.id,tile:u.tile});
  resolveDriver({orders:[{type:'move',unit:u.id,tile:f.battle.id}],memory:{stale:true},ms:1,stderr:''});await Promise.all([...sim.jobs.values()]);
  assert(!f.g.realtime.queues[0]?.some(q=>q.action.unit===u.id));assert.notEqual(f.p.memory?.stale,true);
 }finally{sim.dispose();}
}
pass('A driver response planned before repatriation is discarded rather than restoring stale Great Person orders');
{
 const f=field(),u=person(f,'admiral'),enemy=invader(f,'galley');f.battle.terrain='coast';f.g.map.tiles[enemy.tile].terrain='coast';
 const harbor=neighbors(f.g.map,f.g.map.tiles[f.home.tile])[0];Object.assign(harbor,{terrain:'coast',owner:0,district:{item:'harbor',city:f.home.id,kind:'district'}});f.home.buildings.push('harbor');f.home.districts.push({item:'harbor',tile:harbor.id});
 E.addUnit(f.g,0,'galley',harbor.id);E.applyAction(f.g,f.q,{type:'move',unit:enemy.id,tile:u.tile});assert.equal(u.tile,harbor.id);assert.equal(u.hp,100);
 assert.equal(E.restore(E.serialize(f.g)).units.find(v=>v.id===u.id).tile,harbor.id);
}
pass('Enemy naval entry returns an admiral to its recruitment city harbor while preserving its legal sea placement');
{
 const f=field(),u=person(f),enemy=invader(f);f.home.owner=1;
 E.applyAction(f.g,f.q,{type:'move',unit:enemy.id,tile:u.tile});assert.equal(u.tile,f.capital.tile);assert.equal(u.recruitmentCity,f.home.id);
}
pass('A lost recruitment city falls back to an owned capital without rewriting the original recruitment city');
{
 const f=field(),u=person(f);delete u.recruitmentCity;delete f.g.heritage.recruited[u.greatPerson].city;
 const bytes=E.serialize(f.g),loaded=E.restore(bytes),legacy=loaded.units.find(v=>v.id===u.id);assert.equal(legacy.recruitmentCity,f.capital.id);assert.equal(u.recruitmentCity,undefined);
 legacy.tile=f.home.tile;assert.equal(E.restore(E.serialize(loaded)).units.find(v=>v.id===u.id).recruitmentCity,f.capital.id);
 const invalid=JSON.parse(E.serialize(loaded));invalid.units.find(v=>v.id===u.id).recruitmentCity='invalid';assert.throws(()=>E.restore(JSON.stringify(invalid)));
}
pass('Legacy saves bind once to a deterministic owned city in memory; malformed return metadata is rejected');
{
 const f=field(),u=person(f);f.g.cities=f.g.cities.filter(c=>c.owner!==0);H.evacuateGreatPeople(f.g);assert(!f.g.units.includes(u));assert(f.p.greatPeople.retired.some(v=>v.key===u.greatPerson&&v.dispersed));H.evacuateGreatPeople(f.g);assert.equal(f.p.greatPeople.retired.length,1);
}
pass('A civilization without a remaining city retains the existing once-only Great Person dispersal rule');
await fs.writeFile(new URL('return-check.json',out),JSON.stringify({passed:true,checks},null,2));
