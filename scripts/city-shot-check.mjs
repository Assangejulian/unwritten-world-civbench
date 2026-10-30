import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as H from '../src/heritage.mjs';
import {neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';

const out=new URL('../output/city-shot-20261016/',import.meta.url),checks=[];
await fs.mkdir(out,{recursive:true});
function field(type='manatarms'){
 const g=E.createGame({players:2,size:'small',seed:'CITY-SHOT',barbarians:false});g.units=[];g.cities=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,riverEdges:[],camp:false});
 const t=g.map.tiles.find(t=>t.q===10&&t.r===10),p=g.players[0],q=g.players[1];
 const c=E.foundCity(g,p,E.addUnit(g,0,'settler',t.id));c.buildings.push('walls');c.walls=100;
 E.foundCity(g,q,E.addUnit(g,1,'settler',g.map.tiles.find(t=>t.q===22&&t.r===10).id));g.units=[];
 const target=E.addUnit(g,1,type,neighbors(g.map,t)[0].id);target.hp=71;
 if(type==='galley')g.map.tiles[target.tile].terrain='coast';
 for(const player of g.players){player.manual=true;player.visible=g.map.tiles.map(t=>t.id);player.explored=player.visible.slice();player.met=[1-player.id];player.relations[1-player.id].status='war';}
 const canonical=E.restore(E.serialize(g));
 return {g:canonical,p:canonical.players[0],q:canonical.players[1],c:canonical.cities.find(v=>v.id===c.id),target:canonical.units.find(v=>v.id===target.id)};
}
function pass(name){checks.push(name);console.log('PASS '+name);}
for(const type of ['warrior','manatarms','galley']){
 const {g,p,c,target}=field(type),before=target.hp;
 E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:target.id});
 assert(target.hp<before&&target.hp>0,type+' must receive actual city damage');assert(c.attacked);
 assert(E.snapshot(g,-1).visuals.events.some(e=>e.kind==='hurt'&&e.actor.id===target.id&&e.damage===before-target.hp));
}
pass('Direct city fire deals actual HP damage and publishes matching hurt events for infantry, men-at-arms and ships');
{
 const {g,p,c,target}=field(),rejections=[],sim=new RealtimeSimulation(g,{onRejected:e=>rejections.push(e)});
 try{
  sim.start(p,{type:'cityAttack',city:c.id,targetUnit:target.id});const before=target.hp;assert.equal(before,71);assert(c.activity);
  const copy=E.restore(E.serialize(g)),resumed=new RealtimeSimulation(copy);
  try{
   sim.tick(1.2);resumed.tick(1.2);assert(target.hp<before);assert.equal(rejections.length,0);assert(!c.activity);assert(c.attackUntil>g.realtime.time);
   assert.equal(E.serialize(g),E.serialize(copy),'In-flight city fire must resume deterministically');
  }finally{resumed.dispose();}
  sim.tick(21);const next=target.hp;sim.start(p,{type:'cityAttack',city:c.id,targetUnit:target.id});sim.tick(1.2);assert(target.hp<next,'Repeated shots must deal damage rather than reject after animation');
 }finally{sim.dispose();}
}
pass('Realtime and restored in-flight city fire both hit, retain cooldowns, repeat successfully and produce no impact rejection');
{
 const {g,p,c,target}=field('galley');p.heritageEffects={navalGrant:{boardingCaptureChance:1}};target.hp=1;
 E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:target.id});assert.equal(target.owner,1);assert(!g.units.includes(target),'Cities must destroy rather than board enemy ships');
}
pass('Empire naval boarding effects do not turn a city into a ship or capture its naval target');
{
 const {g,p,c,target}=field('galley');p.heritageEffects={navalGrant:{boardingCaptureChance:1}};g.map.tiles[c.tile].terrain='coast';
 const ship=E.addUnit(g,p.id,'galley',c.tile);H.heritageDamage(g,target,999,ship);assert.equal(target.owner,p.id);assert.equal(target.hp,30);
}
pass('Real naval boarding still captures an enemy vessel with the original effect and survivor HP');
{
 const {g,p,c,target}=field();target.heritageShieldUntil=100;
 E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:target.id});assert.equal(target.hp,71,'Legitimate temporary immunity remains effective');
 c.attacked=false;delete target.heritageShieldUntil;E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:target.id});assert(target.hp<71);
 const gp=E.addUnit(g,1,'great_person',target.tile);gp.greatPerson='thales';c.attacked=false;assert.throws(()=>E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:gp.id}));assert.equal(gp.hp,100);
}
pass('Legitimate shields and Great Person protection remain distinct from the fixed city-source exception');
const copyFile=new URL('live-before.json',out);
try{
 const raw=await fs.readFile(copyFile),g=E.restore(raw.toString()),p=g.players[0],q=g.players[3],c=g.cities.find(c=>c.owner===p.id&&c.walls>0);
 const t=neighbors(g.map,g.map.tiles[c.tile]).find(t=>t.terrain!=='mountain'&&!g.units.some(u=>u.tile===t.id));assert(t);t.terrain='grass';
 const target=E.addUnit(g,q.id,'manatarms',t.id);target.hp=71;c.attacked=false;p.relations[q.id].status='war';q.relations[p.id].status='war';p.visible=[...new Set([...p.visible,t.id])];
 E.applyAction(g,p,{type:'cityAttack',city:c.id,targetUnit:target.id});assert(target.hp<71);
 assert((await fs.readFile(copyFile)).equals(raw));
 pass('The captured real campaign copy also damages a 71-HP Inca man-at-arms from a Roman city; original input stays byte-identical');
}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.writeFile(new URL('checks.json',out),JSON.stringify({passed:true,checks},null,2));
