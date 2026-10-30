import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as CS from '../src/city-states.mjs';
import {beginWar} from '../src/warfare.mjs';
import {driverInfo,executeDriver} from '../src/drivers.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {field} from './imperial-fixture.mjs';
const calls=[];
for(const algorithm of ['A','B'])for(const civ of R.CIVS)for(const scenario of ['capture','garrison','envoys']){
 const f=field(),{g,p,q,home,tile}=f;p.manual=false;p.driver.file=civ.file;g.settings.aiAlgorithm=algorithm;const info=await driverInfo(civ.file);assert.equal(info.status,'ready');let actor,victim;
 if(scenario==='capture'){beginWar(g,p,q,E.event);actor=E.addUnit(g,p.id,'warrior',tile(8,8).id);victim=E.addUnit(g,q.id,'settler',tile(9,8).id);}
 if(scenario==='garrison'){beginWar(g,p,q,E.event);actor=E.addUnit(g,p.id,'warrior',home.tile);E.addUnit(g,q.id,'warrior',tile(4,4).id);}
 if(scenario==='envoys'){p.strategy='science';p.envoys=1;for(const [i,type]of ['trade','science'].entries())g.cityStates.states.push({id:i+1,name:'State '+type,tile:tile(12+i*5,10).id,type,hp:200,envoys:{},met:[p.id],wars:[],capturedBy:null,levyUntil:0});CS.initializeCityStates(g);}
 E.refreshVisibility(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>scenario==='envoys'?a.type==='sendCityEnvoy':a.unit===actor.id&&(scenario==='capture'?['attack','move','fortify']:['move','fortify']).includes(a.type));assert(obs.legalActions.length);
 const response=await executeDriver(p,obs),action=response.orders.find(a=>scenario==='envoys'?a.type==='sendCityEnvoy':a.unit===actor.id);assert(action,algorithm+' '+civ.file+' '+scenario);E.applyAction(g,p,action);
 if(scenario==='capture')assert.equal(victim.owner,p.id,JSON.stringify(action));if(scenario==='garrison'){assert.equal(action.type,'fortify');assert.equal(actor.tile,home.tile);}if(scenario==='envoys')assert.equal(action.state,2);calls.push({algorithm,file:civ.file,scenario,action});
}
const campaigns=[];
for(const algorithm of ['A','B']){const g=E.createGame({players:8,size:'small',seed:'PLAYTEST-NATIVE-'+algorithm,playMode:'turns',barbarians:true,aiAlgorithm:algorithm}),pool=new NativeDriverPool();let active=0,peak=0;const sim=new GameSimulation(g,{execute:async(p,obs)=>{active++;peak=Math.max(peak,active);try{return await pool.execute(p,obs);}finally{active--;}}});try{for(let i=0;i<6;i++)await sim.endTurn(0,{force:true});assert.equal(g.turn,7);assert.equal(peak,1);assert(g.players.slice(1).every(p=>p.driver.failures===0));E.restore(E.serialize(g));campaigns.push({algorithm,rounds:6,peakNativeConcurrency:peak,failures:g.players.map(p=>p.driver.failures),units:g.units.length,cities:g.cities.length});}finally{sim.dispose();pool.dispose();}}
const binaries=await Promise.all(R.CIVS.map(async c=>{const d=await driverInfo(c.file);return {file:c.file,status:d.status,binary:d.binary,sha256:crypto.createHash('sha256').update(fs.readFileSync(d.binary)).digest('hex')};}));fs.writeFileSync('output/playtest-expansion-20261019/native-checks.json',JSON.stringify({passed:true,calls,campaigns,binaries},null,2));console.log(JSON.stringify({passed:true,calls:calls.length,campaigns}));
