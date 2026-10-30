import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import {GREAT_PEOPLE} from '../src/heritage-data.mjs';
import {TECHS,UNITS,dist} from '../src/rules.mjs';
import {neighbors} from '../src/world.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const save=new URL('../saves/autosave.json',import.meta.url),before=createHash('sha256').update(await readFile(save)).digest('hex'),results=[];
for(const algorithm of ['A','B']){
 const g=E.createGame({players:2,size:'small',seed:'HERITAGE-NATIVE-'+algorithm,barbarians:false,aiAlgorithm:algorithm}),p=g.players[0];for(const player of g.players){E.foundCity(g,player,g.units.find(u=>u.owner===player.id&&u.type==='settler'));player.manual=player.id!==0;}
 const c=g.cities.find(c=>c.owner===0),site=neighbors(g.map,g.map.tiles[c.tile]).find(t=>t.owner===0&&!t.cityId&&!g.units.some(u=>u.tile===t.id));Object.assign(site,{terrain:'grass',hill:false,feature:null,resource:null,district:{item:'campus',city:c.id,kind:'district'}});c.districts.push({item:'campus',tile:site.id});c.buildings.push('campus','library');c.population=3;p.techs=['pottery','writing','mining','bronze','ironwork'];p.greatPeople.points.scientist=120;p.gold=300;g.heritage.skipped=GREAT_PEOPLE.slice(0,GREAT_PEOPLE.findIndex(v=>v.key==='zhang_heng')).filter(v=>v.classKey==='scientist').map(v=>v.key);
 E.refreshVisibility(g);const pool=new NativeDriverPool(),seen=[],errors=[];let active=0,moving=0,perNation=0;
 const sim=new RealtimeSimulation(g,{execute:async(player,obs)=>{assert.equal(obs.opponents.some(o=>o.greatPeople),false);assert.equal(obs.greatPeople.catalogue,undefined);seen.push({units:obs.units.filter(u=>u.greatPerson).map(u=>u.greatPerson),recruit:obs.legalActions.filter(a=>a.type==='recruitGreatPerson').map(a=>a.item),activate:obs.legalActions.filter(a=>a.type==='activateGreatPerson').length});return pool.execute(player,obs);},onRejected:entry=>errors.push(entry),maxDrivers:2,decisionInterval:0});
 try{
  for(let round=0;round<10&&!p.greatPeople.retired.some(v=>v.key==='zhang_heng');round++){await sim.plan({force:true});for(let step=0;step<80;step++){sim.tick(.1);const list=g.units.filter(u=>u.activity);active=Math.max(active,list.length);moving=Math.max(moving,list.filter(u=>u.activity.action.type==='move').length);perNation=Math.max(perNation,...g.players.map(p=>list.filter(u=>u.owner===p.id).length));}}
  if(!p.greatPeople.retired.length)console.log(JSON.stringify({seen,driver:p.driver,points:p.greatPeople.points,owned:p.greatPeople.owned,queue:g.realtime.queues[0],units:g.units.filter(u=>u.greatPerson),errors,stats:sim.stats}));assert(p.greatPeople.retired.some(v=>v.key==='zhang_heng'),algorithm+' failed to activate its recruited scientist');assert(p.boosts.includes('engineering'));assert(p.boosts.includes('astronomy'));assert(seen.length>=2);assert(active<=24&&moving<=16&&perNation<=4);assert(g.units.every(u=>u.hp>0&&UNITS[u.type]));E.restore(E.serialize(g));results.push({algorithm,nativeCalls:p.driver.calls,states:seen,maxActive:active,maxMoving:moving,maxNation:perNation,retired:p.greatPeople.retired.map(v=>v.key),rejected:errors});console.log('PASS '+algorithm+' real native decisions plus shared authoritative heritage planner recruit and activate Zhang Heng');
 }finally{sim.dispose();pool.dispose();}
}
assert.equal(createHash('sha256').update(await readFile(save)).digest('hex'),before);
await writeFile(new URL('../output/wonder-lifecycle-ai-20261016/native-checks.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),results,activeSaveWritten:false,liveGameRestarted:false},null,2));
