import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as C from '../src/congress.mjs';
import * as CS from '../src/city-states.mjs';
import {awardDiplomaticPoints} from '../src/victory-rules.mjs';
import {executeDriver,driverInfo} from '../src/drivers.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {field} from './imperial-fixture.mjs';
const calls=[];
for(const algorithm of ['A','B'])for(const civ of R.CIVS)for(const scenario of ['blockLeader','electSelf','suzerainty']){
 const {g,p,q,tile}=field();g.settings.aiAlgorithm=algorithm;p.driver.file=civ.file;p.strategy='diplomacy';p.diplomaticFavor=100;p.met=[];
 if(scenario==='suzerainty'){
  g.cityStates.states.push(...[5,0].map((n,i)=>({id:i+1,name:'State '+i,tile:tile(12+i*5,10).id,type:'science',hp:200,envoys:{1:n},met:[0],wars:[],capturedBy:null,levyUntil:0})));CS.initializeCityStates(g);p.envoys=1;
 }else{
  p.techs=['combustion'];g.turn=g.congress.nextTurn;C.congressTurn(g,E.event);awardDiplomaticPoints(g,scenario==='blockLeader'?q:p,18,'test:seed','Test seed');
 }
 E.refreshVisibility(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>scenario==='suzerainty'?a.type==='sendCityEnvoy':a.type==='voteCongress');assert(obs.legalActions.length);
 const response=await executeDriver(p,obs),orders=response.orders.filter(a=>scenario==='suzerainty'?a.type==='sendCityEnvoy':a.type==='voteCongress');assert(orders.length);
 for(const a of orders)E.applyAction(g,p,a);
 if(scenario==='suzerainty')assert.equal(orders[0].state,2);
 else{const lead=orders.find(a=>a.topic==='leadership');assert(lead);assert.equal(lead.choice,scenario==='blockLeader'?'lose':'gain');assert.equal(lead.target,scenario==='blockLeader'?q.id:p.id);assert(p.diplomaticFavor>=0);assert.equal(C.congressActions(g,p).length,0);C.validateCongress(g);}
 E.restore(E.serialize(g));calls.push({algorithm,file:civ.file,scenario,orders});
}
const campaigns=[];
for(const algorithm of ['A','B']){
 const g=E.createGame({players:8,size:'small',seed:'VICTORY-NATIVE-'+algorithm,playMode:'turns',aiAlgorithm:algorithm,strategies:Array(8).fill('diplomacy')}),pool=new NativeDriverPool();let active=0,peak=0;
 const sim=new GameSimulation(g,{execute:async(p,obs)=>{active++;peak=Math.max(peak,active);try{return await pool.execute(p,obs);}finally{active--;}}});
 try{for(let i=0;i<6;i++)await sim.endTurn(0,{force:true});assert.equal(g.turn,7);assert.equal(peak,1);assert(g.players.slice(1).every(p=>p.driver.failures===0));const saved=E.serialize(g);assert.equal(E.serialize(E.restore(saved)),saved);campaigns.push({algorithm,rounds:6,peakNativeConcurrency:peak,failures:g.players.map(p=>p.driver.failures)});}finally{sim.dispose();pool.dispose();}
}
const binaries=await Promise.all(R.CIVS.map(async c=>{const d=await driverInfo(c.file);assert.equal(d.status,'ready');return {file:c.file,status:d.status,binary:d.binary,sha256:crypto.createHash('sha256').update(fs.readFileSync(d.binary)).digest('hex')};}));
fs.writeFileSync('output/victories-20261019/native-checks.json',JSON.stringify({passed:true,calls,campaigns,binaries},null,2));console.log(JSON.stringify({passed:true,calls:calls.length,campaigns}));
