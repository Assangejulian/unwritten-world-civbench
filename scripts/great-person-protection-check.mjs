import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as H from '../src/heritage.mjs';
import {neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const out=new URL('../output/great-person-protection-20261016/',import.meta.url),checks=[];
await fs.mkdir(out,{recursive:true});
function fixture(){
 const g=E.createGame({players:2,size:'small',seed:'GREAT-PERSON-PROTECTION',barbarians:false});
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,riverEdges:[],camp:false});
 g.units=[];g.cities=[];
 const center=g.map.tiles.find(t=>t.q===10&&t.r===10);
 const c=E.foundCity(g,g.players[0],E.addUnit(g,0,'settler',center.id));c.buildings.push('walls');c.walls=100;
 E.foundCity(g,g.players[1],E.addUnit(g,1,'settler',g.map.tiles.find(t=>t.q===22&&t.r===10).id));
 g.units=[];
 for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=p.visible.slice();p.met=[1-p.id];p.relations[1-p.id].status='war';}
 return {g,c,ring:neighbors(g.map,center),p:g.players[0],q:g.players[1]};
}
function person(g,owner,spec,tile){
 const u=E.addUnit(g,owner,spec.classKey==='admiral'?'great_admiral':'great_person',tile);
 Object.assign(u,{greatPerson:spec.key,charges:spec.charges,activations:0});
 g.players[owner].greatPeople.owned.push({key:spec.key,unit:u.id});g.heritage.recruited[spec.key]={owner,turn:g.turn};return u;
}
function pass(name){checks.push(name);console.log('PASS '+name);}

for(const cls of H.GREAT_PERSON_CLASSES){
 const {g,p,q,c,ring}=fixture(),spec=H.GREAT_PEOPLE.find(v=>v.classKey===cls.key),gp=person(g,1,spec,ring[0].id);
 if(cls.key==='admiral')g.map.tiles[gp.tile].terrain='coast';
 const attacker=E.addUnit(g,0,'archer',c.tile),builder=E.addUnit(g,1,'builder',ring[1].id);
 assert(!E.legalActions(g,p).some(a=>['attack','cityAttack'].includes(a.type)&&a.targetUnit===gp.id),'City AI must not target '+spec.key);
 assert(E.legalActions(g,p).some(a=>a.type==='cityAttack'&&a.targetUnit===builder.id),'Ordinary civilian targets remain legal');
 assert(!E.attackTargets(g,p,attacker).some(a=>a.targetUnit===gp.id));
 assert.throws(()=>E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:gp.id}));
 const sim=new RealtimeSimulation(g);
 try{
  const before=E.serialize(g);
  assert.throws(()=>sim.start(p,{type:'cityAttack',city:c.id,targetUnit:gp.id}),'Admission must reject before emitting an attack animation');
  assert.equal(E.serialize(g),before,'Rejected admission must not spend city readiness or add visuals');
  sim.enqueue(p,[{type:'cityAttack',city:c.id,targetUnit:gp.id}]);sim.tick(1.2);
  assert(!c.activity);assert.equal(gp.hp,100);assert(!g.visuals?.events?.some(e=>e.kind==='attack'&&e.target?.id===gp.id));
  c.activity={owner:p.id,action:{type:'cityAttack',city:c.id,targetUnit:gp.id},started:g.realtime.time,ends:g.realtime.time+.1};
  sim.tick(.2);assert.equal(gp.hp,100);assert(!c.activity,'An old in-flight invalid attack must cancel at impact');
  assert.equal(H.heritageDamage(g,gp,999,attacker),0);assert.equal(gp.hp,100);
  c.activity={owner:p.id,action:{type:'cityAttack',city:c.id,targetUnit:gp.id},started:g.realtime.time,ends:g.realtime.time+.5};
  const loaded=E.restore(E.serialize(g)),resumed=new RealtimeSimulation(loaded);
  try{assert(!loaded.cities.find(v=>v.id===c.id).activity,'Loading an old invalid attack must cancel it before rendering');}finally{resumed.dispose();}
  delete c.activity;
 }finally{sim.dispose();}
 const projected=E.snapshot(g,0).units.find(u=>u.id===gp.id);
 assert.equal(projected.greatPersonClass,cls.key);assert.equal(projected.greatPersonName,spec.name);
 const destination=neighbors(g.map,g.map.tiles[gp.tile]).find(t=>!g.units.some(u=>u.tile===t.id)&&t.cityId===null);
 if(cls.key==='admiral')destination.terrain='coast';
 gp.acted=false;gp.moves=3;
 const move=E.reachable(g,q,gp,true).find(a=>a.tile===destination.id);assert(move,'A valid Great Person must retain legal movement');
 E.applyAction(g,q,{type:'move',unit:gp.id,tile:move.tile});assert.equal(gp.tile,destination.id);
 assert.equal(E.restore(E.serialize(g)).units.find(u=>u.id===gp.id).greatPerson,gp.greatPerson);
}
pass('All nine Great Person classes reject city AI, unit targeting, queued/forged admission and old impacts without damage or attack animation');
pass('Visible Great People expose only their public class and historical name for map artwork');
pass('All nine classes retain real movement and valid save restoration after protected attacks cancel');
const pool=new NativeDriverPool();
try{
 for(const algorithm of ['A','B']){
  const {g,p,c,ring}=fixture();g.settings.aiAlgorithm=algorithm;
  const gp=person(g,1,H.GREAT_PEOPLE.find(v=>v.classKey==='scientist'),ring[0].id);
  E.addUnit(g,0,'archer',c.tile);E.addUnit(g,1,'warrior',ring[1].id);
  const obs=E.observation(g,p),result=await pool.execute(p,obs);
  assert(!obs.legalActions.some(a=>a.targetUnit===gp.id&&['attack','cityAttack'].includes(a.type)));
  assert(!result.orders.some(a=>a.targetUnit===gp.id&&['attack','cityAttack'].includes(a.type)));
 }
}finally{pool.dispose();}
pass('Actual native A/B drivers receive no Great Person attack options and do not issue those orders');
await fs.writeFile(new URL('protection-check.json',out),JSON.stringify({ok:true,checks},null,2));
