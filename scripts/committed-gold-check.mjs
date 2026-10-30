import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {CIVS} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {replacementFor} from '../src/unique-content.mjs';
const pool=new NativeDriverPool(),checks=[];
try{
 for(const civ of CIVS)for(const mode of ['queued','active']){
  const g=E.createGame({players:2,size:'small',seed:'COMMITTED-GOLD',barbarians:false}),p=g.players[0];
  g.units=[];for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,territoryCity:null,district:null,improvement:null,camp:false,ruin:false});
  for(const q of g.players){q.manual=true;q.techs=['machinery'];q.met=[1-q.id];E.foundCity(g,q,E.addUnit(g,q.id,'settler',g.map.tiles[(10+q.id*12)*g.map.width+12].id));}g.units=[];
  const c=g.cities[0],tile=g.map.tiles[c.tile],units=[tile,...g.map.tiles.filter(t=>t.owner===0&&t.id!==tile.id).slice(0,2)].map(t=>E.addUnit(g,p.id,'archer',t.id)),cost=E.unitUpgradeCost(g,'archer',replacementFor(p,'crossbow'),p);p.gold=cost*2+90;p.driver.file=civ.file;const sim=new RealtimeSimulation(g);
  try{sim.enqueue(p,[{type:'upgrade',unit:units[0].id,item:replacementFor(p,'crossbow'),expectedCost:cost}]);if(mode==='active')sim.tick(.05);else {units[0].cooldownUntil=10;sim.ready();}E.refreshVisibility(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='upgrade'&&a.unit!==units[0].id);const response=await pool.execute(p,obs),committed=cost+response.orders.filter(a=>a.type==='upgrade').length*cost;assert(committed+90<=p.gold,`${civ.file} ${mode} overcommits ${committed} plus reserve against ${p.gold}`);assert(response.orders.some(a=>a.type==='upgrade'),'A remaining affordable upgrade is still selected');assert.equal(obs.player.committedGold,cost);assert.equal(E.observation(g,g.players[1]).player.committedGold,0);}
  finally{sim.dispose();}
 }
 checks.push('All eight native drivers reserve both queued and active refit costs without exposing foreign commitments');console.log('PASS '+checks[0]);
 await writeFile(new URL('../output/committed-gold-checks.json',import.meta.url),JSON.stringify({passed:true,checks},null,2)+'\n');
}finally{pool.dispose();}
