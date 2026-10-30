import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {beginWar} from '../src/warfare.mjs';
import {neighbors} from '../src/world.mjs';
import {driverInfo,executeDriver} from '../src/drivers.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {field} from './imperial-fixture.mjs';
const calls=[],hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const algorithm of ['A','B'])for(const civ of R.CIVS){
 const {g,p,q,tile}=field();g.settings.aiAlgorithm=algorithm;p.techs=Object.keys(R.TECHS);p.strategy='domination';p.driver.file=civ.file;beginWar(g,p,q,E.event);
 const robot=E.addUnit(g,p.id,'giantdeathrobot',tile(8,8).id);for(const t of neighbors(g.map,g.map.tiles[robot.tile]))t.terrain='mountain';
 E.addUnit(g,p.id,'scout',tile(13,7).id);E.addUnit(g,q.id,'warrior',tile(14,8).id);E.refreshVisibility(g);
 const obs=E.observation(g,p),jump=obs.legalActions.filter(a=>a.type==='jump'&&a.unit===robot.id);assert(jump.length);assert(!obs.legalActions.some(a=>a.type==='move'&&a.unit===robot.id));
 // Retain the real engine-authored movement hints; isolate the stranded robot's choice.
 const legal=obs.legalActions.filter(a=>a.unit===robot.id&&['jump','fortify'].includes(a.type));
 const info=await driverInfo(civ.file);assert.equal(info.status,'ready');
 const response=await executeDriver(p,{...obs,legalActions:legal}),action=response.orders.find(a=>a.unit===robot.id);
 assert.equal(action?.type,'jump',algorithm+' '+civ.file);assert(jump.some(a=>a.tile===action.tile));const from=robot.tile;E.applyAction(g,p,action);assert.notEqual(robot.tile,from);assert.equal(robot.moves,2);
 calls.push({algorithm,file:civ.file,binary:info.binary,sha256:hash(info.binary),action});
}
const campaigns=[];
for(const algorithm of ['A','B']){
 const g=E.createGame({players:8,size:'small',seed:'TURN-NATIVE-'+algorithm,playMode:'turns',barbarians:true,aiAlgorithm:algorithm}),pool=new NativeDriverPool();let concurrent=0,peak=0;
 const s=new GameSimulation(g,{execute:async(p,o)=>{concurrent++;peak=Math.max(peak,concurrent);try{return await pool.execute(p,o);}finally{concurrent--;}}});
 try{for(let i=0;i<4;i++)await s.endTurn(0);assert.equal(g.turn,5);assert.equal(g.realtime.time,80);assert.equal(peak,1);assert(g.players.slice(1).every(p=>p.driver.calls>=4&&p.driver.failures===0));campaigns.push({algorithm,rounds:4,time:g.realtime.time,peakConcurrent:peak,calls:g.players.map(p=>p.driver.calls),units:g.units.length,cities:g.cities.length});}finally{s.dispose();pool.dispose();}
}
fs.writeFileSync('output/player-feedback-20261019/native-checks.json',JSON.stringify({passed:true,sdkSha256:hash('sdk/civ.hpp'),robotJumpCalls:calls,campaigns},null,2));console.log(JSON.stringify({passed:true,robotJumpCalls:calls.length,campaigns}));
