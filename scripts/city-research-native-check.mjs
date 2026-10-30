import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {field,spaceField} from './imperial-fixture.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const pool=new NativeDriverPool(),calls=[];
try{for(const algorithm of ['A','B'])for(const driver of R.CIVS)for(const kind of ['purchase','excavate','establishPark','concert','religiousHeal']){
 const {g,p,home,other,tile}=field();g.settings.aiAlgorithm=algorithm;p.driver.file=driver.file;p.manual=false;home.population=10;p.techs=['pottery'];let actor;
 if(kind==='purchase')home.production={item:'warrior',tile:null,progress:0,cost:10000};
 if(kind==='excavate'){const d=tile(4,3);d.owner=0;d.district={item:'theater',city:home.id,kind:'district'};home.districts.push({item:'theater',tile:d.id});home.buildings.push('theater','amphitheater','museum');const t=tile(5,3);t.ruin=true;actor=E.addUnit(g,0,'archaeologist',t.id);}
 if(kind==='establishPark')actor=E.addUnit(g,0,'naturalist',tile(4,3).id);
 if(kind==='concert'){actor=E.addUnit(g,0,'rockband',other.tile);p.knownCities[other.id]={id:other.id,owner:other.owner,tile:other.tile};}
 if(kind==='religiousHeal'){p.religion='wisdom';actor=E.addUnit(g,0,'guru',tile(4,3).id);const v=E.addUnit(g,0,'apostle',tile(5,3).id);actor.religionOwner=v.religionOwner=0;v.hp=30;}
 E.refreshVisibility(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type===kind);assert(obs.legalActions.length,kind);const response=await pool.execute(p,obs),order=response.orders.find(a=>a.type===kind);assert(order,algorithm+' '+driver.file+' '+kind);const before=kind==='purchase'?structuredClone(home.production):null;E.applyAction(g,p,order);if(before){assert.deepEqual(home.production,before);assert(g.units.some(u=>u.type==='warrior'));}calls.push({algorithm,driver:driver.file,kind,ms:response.ms});
 }for(const algorithm of ['A','B'])for(const driver of R.CIVS){const {g,p,blocked}=spaceField();g.settings.aiAlgorithm=algorithm;p.driver.file=driver.file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&a.item==='spaceport');const response=await pool.execute(p,obs),order=response.orders.find(a=>a.item==='spaceport');assert(order,algorithm+' '+driver.file+' safe spaceport');assert.notEqual(order.city,blocked.id);assert(!obs.legalActions.find(a=>a.city===order.city).hint.strategicDeposit);E.applyAction(g,p,order);calls.push({algorithm,driver:driver.file,kind:'safe-spaceport',ms:response.ms});}console.log(calls.length+' real native A/B purchase and civilian mission decisions passed');fs.writeFileSync('output/city-research-20261019/native-checks.json',JSON.stringify({calls,scope:'Focused synthetic worlds using all eight rebuilt C++ drivers, both algorithms; not a complete match'},null,2));
}finally{pool.dispose();}
