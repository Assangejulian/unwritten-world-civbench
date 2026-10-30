// Renderer-only changes must preserve complete ordered AI inputs, outputs and settlement.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import * as current from '../src/engine.mjs';
import {RealtimeSimulation as CurrentSimulation,developmentAIOrders as currentDevelopment} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/playwright/render-cache-trial-20261017');
const frozen=await import(pathToFileURL(path.join(out,'frozen/src/engine.mjs')));
const {RealtimeSimulation:FrozenSimulation,developmentAIOrders:frozenDevelopment}=await import(pathToFileURL(path.join(out,'frozen/src/realtime.mjs')));
const manifest=JSON.parse(await fs.readFile(path.join(out,'capture-manifest.json'),'utf8')),checks=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const [file,digest]of Object.entries(manifest.sources).filter(([p])=>p.startsWith('src/')))assert.equal(hash(await fs.readFile(path.join(root,file))),digest,'Backend changed during renderer-only trial: '+file);
for(const name of ['fresh','midgame']){
 const raw=await fs.readFile(path.join(out,'fixtures',name+'.json'),'utf8'),scan=JSON.parse(raw),alive=scan.players.filter(p=>p.alive);
 const largest=[...alive].sort((a,b)=>scan.units.filter(u=>u.owner===b.id).length-scan.units.filter(u=>u.owner===a.id).length).find(p=>p.id!==0);
 for(const algorithm of ['A','B'])for(const playerId of [0,largest.id]){
  const cases=[];
  for(const [E,Simulation,development]of [[frozen,FrozenSimulation,frozenDevelopment],[current,CurrentSimulation,currentDevelopment]]){
   const game=E.restore(raw);game.settings.aiAlgorithm=algorithm;const player=game.players[playerId];
   const obs=E.observation(game,player),heritage=development(obs),committedFaith=heritage.reduce((n,a)=>n+(a.hint?.faithCost||0),0);
   const input={...obs,player:{...obs.player,committedFaith}},pool=new NativeDriverPool();let response;
   try{response=await pool.execute(player,input);}finally{pool.dispose();}
   const sim=new Simulation(game);
   try{player.memory=response.memory;sim.enqueue(player,response.orders);sim.enqueue(player,heritage);for(let i=0;i<40;i++)sim.advance(.05);}
   finally{sim.dispose();}
   cases.push({input:JSON.stringify(input),orders:JSON.stringify(response.orders),memory:JSON.stringify(response.memory),development:JSON.stringify(heritage),settled:E.serialize(game),snapshot:JSON.stringify(E.snapshot(game,playerId,{manualOptionsOnly:true}))});
  }
  assert.deepEqual(cases[0],cases[1],name+' '+algorithm+' player '+playerId+' must preserve order, hints, memory, priority and exact simulation result');
  checks.push({fixture:name,algorithm,player:playerId,legalActions:JSON.parse(cases[0].input).legalActions.length,nativeOrders:JSON.parse(cases[0].orders).length,memoryBytes:Buffer.byteLength(cases[0].memory),inputSha256:hash(cases[0].input),ordersSha256:hash(cases[0].orders),memorySha256:hash(cases[0].memory),snapshotSha256:hash(cases[0].snapshot),settledSha256:hash(cases[0].settled)});
  console.log('PASS '+name+' '+algorithm+' player '+playerId+': ordered full input, native orders/memory, development orders and 40 settled steps');
 }
}
for(const [name,fixture]of Object.entries(manifest.fixtures))assert.equal(hash(await fs.readFile(fixture.source)),fixture.sha256,'Original save changed during isolated tests: '+name);
await fs.writeFile(path.join(out,'ai-parity.json'),JSON.stringify({passed:true,checks,sourceBackendUnchanged:true,originalSavesUnchanged:true,liveAPIsUsed:false,scope:'Two frozen worlds, algorithms A/B, two player perspectives; not a full-campaign strength evaluation.'},null,2));
