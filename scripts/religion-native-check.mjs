import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';
import * as F from '../src/religion.mjs';
import {neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
for(const algorithm of ['A','B'])for(const mode of ['root','affiliate']){
 const g=E.createGame({players:4,size:'small',seed:'RELIGION-NATIVE-'+algorithm+mode,aiAlgorithm:algorithm,barbarians:false}),p=g.players[0];
 for(const player of g.players){E.foundCity(g,player,g.units.find(u=>u.owner===player.id&&u.type==='settler'));player.manual=player.id!==0;player.faith=5000;player.gold=0;player.techs=['pottery','writing'];player.civics=['code','mysticism','theology'];}
 g.units=[];const c=g.cities[0],tile=neighbors(g.map,g.map.tiles[c.tile])[0];Object.assign(tile,{terrain:'grass',owner:0,territoryCity:c.id,district:{city:c.id,item:'holy',kind:'district'}});c.buildings.push('holy','shrine','temple');c.districts.push({item:'holy',tile:tile.id});p.focus='science';
 if(mode==='affiliate')for(const [i,key]of ['wisdom','harvest','industry'].entries()){g.players[i+1].religion=key;g.players[i+1].beliefs={follower:'work_ethic',worship:'wat'};const other=g.cities.find(c=>c.owner===i+1);other.population=10;other.faithPressure={secular:0,[i+1]:1000};F.updateFollowers(g,other);}
 else {p.religion='wisdom';c.faithPressure={secular:0,0:1000};F.updateFollowers(g,c);}
 E.refreshVisibility(g);const pool=new NativeDriverPool(),errors=[];const sim=new RealtimeSimulation(g,{execute:(player,obs)=>pool.execute(player,obs),decisionInterval:0,onRejected:r=>errors.push(r)});
 try{for(let round=0;round<5;round++){await sim.plan({force:true});sim.tick(1);}assert(p.driver.calls>0);assert(p.pantheon);if(mode==='affiliate'){assert.equal(p.religionParent,1);assert.equal(F.religionBelief(g,p,'follower').key,'work_ethic');}else{assert.equal(Object.keys(p.beliefs).length,4);assert(c.worship);}assert.equal(p.driver.failures,0);E.restore(E.serialize(g));console.log('PASS '+algorithm+' real native '+mode+' religion planner: '+p.driver.calls+' calls, pantheon '+p.pantheon+', beliefs '+JSON.stringify(p.beliefs)+', affiliation '+(p.religionParent??'none'));}finally{sim.dispose();pool.dispose();}
}
