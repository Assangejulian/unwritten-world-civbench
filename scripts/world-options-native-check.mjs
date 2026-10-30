// Short native games exercise the production planner across the new world presets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {assignController} from '../src/environment/controllers.mjs';
const results=[];
for(const [rainfall,resourceAbundance,barbarians,mapType]of [['dry','sparse',false,'pangaea'],['standard','standard',true,'continents'],['wet','abundant',true,'islands']]){
  const g=E.createGame({players:8,size:'small',seed:'NATIVE-OPTIONS-'+rainfall,gameSpeed:'blitz',rainfall,resourceAbundance,barbarians,mapType,autosaveEnabled:false});
  for(const p of g.players)assignController(p,'native');
  const pool=new NativeDriverPool(),rejected={},sim=new RealtimeSimulation(g,{onRejected:row=>{const key=row.stage+'/'+row.type+': '+row.reason;rejected[key]=(rejected[key]||0)+1;}});let calls=0;
  try{
    for(let round=0;round<24&&!g.winner;round++){
      const players=g.players.filter(p=>p.alive);
      for(let i=0;i<players.length;i+=2){const pair=players.slice(i,i+2),responses=await Promise.all(pair.map(p=>pool.execute(p,E.observation(g,p))));for(let j=0;j<pair.length;j++){const p=pair[j],response=responses[j];p.memory=response.memory;sim.enqueue(p,response.orders);calls++;}}
      for(let step=0;step<80;step++)sim.tick(.25);
      if((round+1)%8===0){const save=E.serialize(g);assert.equal(E.serialize(E.restore(save)),save);}
      assert(g.units.every(u=>u.hp>0));
    }
    if(!barbarians)assert(!g.map.tiles.some(t=>t.camp));
    const result={rainfall,resourceAbundance,barbarians,mapType,turn:g.turn,calls,cities:g.cities.length,driverFailures:g.players.reduce((n,p)=>n+(p.driver.failures||0),0),rejected};assert.equal(result.driverFailures,0);results.push(result);console.log('PASS '+JSON.stringify(result));
  }finally{pool.dispose();sim.dispose();}
}
fs.mkdirSync('output/world-options-20261030',{recursive:true});fs.writeFileSync('output/world-options-20261030/native-checks.json',JSON.stringify({passed:true,results,productionSaveWrites:false,paidModelCalls:0},null,2));
