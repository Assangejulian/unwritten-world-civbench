import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {field} from './imperial-fixture.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {driverInfo} from '../src/drivers.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const calls=[],pool=new NativeDriverPool();
try{for(const algorithm of ['A','B'])for(const driver of R.CIVS){assert.equal((await driverInfo(driver.file)).status,'ready');for(const category of ['governor','court','envoy','spy','plunder']){const {g,p,q,home,other,tile}=field();g.settings.aiAlgorithm=algorithm;p.driver.file=driver.file;p.manual=false;let wanted;
 if(category==='governor')wanted=['appointGovernor'];if(category==='court')wanted=['friendship'];if(category==='spy')wanted=['recruitSpy'];
 if(category==='envoy'){p.envoys=1;g.cityStates.states.push({id:1,name:'日内瓦',tile:tile(12,10).id,type:'science',hp:200,envoys:{},met:[0],wars:[],capturedBy:null,levyUntil:0});wanted=['sendCityEnvoy'];}
 if(category==='plunder'){E.applyAction(g,p,{type:'surpriseWar',player:1});const u=E.addUnit(g,0,'warrior',tile(10,8).id);g.routes.push({id:9000,owner:1,from:other.id,to:home.id,path:[u.tile],remaining:20});wanted=['plunderTrade'];}
 E.refreshVisibility(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>wanted.includes(a.type));assert(obs.legalActions.length,category);const response=await pool.execute(p,obs),order=response.orders.find(a=>wanted.includes(a.type));assert(order,`${algorithm} ${driver.file} ${category}`);E.applyAction(g,p,order);calls.push({algorithm,driver:driver.file,category,ms:response.ms});}
 console.log('PASS '+algorithm+' '+driver.file+' five actual new-system decisions');}
 const g=E.createGame({players:8,size:'small',seed:'IMPERIAL-NATIVE-CAMPAIGN',barbarians:false,aiAlgorithm:'B'});for(const p of g.players){E.foundCity(g,p,g.units.find(u=>u.owner===p.id&&u.type==='settler'));p.civics=Object.keys(R.CIVICS);p.techs=['pottery','writing','mining','bronze','ironwork'];p.gold=1500;p.met=g.players.filter(o=>o!==p).map(o=>o.id);}E.refreshVisibility(g);const rejected=[],sim=new RealtimeSimulation(g,{execute:(p,obs)=>pool.execute(p,obs),onRejected:e=>rejected.push(e)});try{for(let i=0;i<110;i++){await sim.plan({force:true});sim.tick(2);}assert(g.turn>=11);assert(g.players.some(p=>Object.keys(p.governors.roster).length));assert(g.espionage.agents.length);assert(!rejected.some(e=>e.type==='spyMission'&&e.reason==='指令对象已不存在。'));const restored=E.restore(E.serialize(g));assert.equal(restored.turn,g.turn);fs.writeFileSync('output/diplomacy-governors-20261018/native-checks.json',JSON.stringify({realFocusedCalls:calls.length,calls,campaign:{turn:g.turn,players:8,spies:g.espionage.agents.length,offers:g.court.offers.length,governors:g.players.reduce((n,p)=>n+Object.keys(p.governors.roster).length,0),rejected:rejected.map(e=>({type:e.type,reason:e.reason}))}},null,2));}finally{sim.dispose();}
}finally{pool.dispose();}
