// Real rebuilt C++ calls for village exploration and religious recruitment identity.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as F from '../src/religion.mjs';
import {neighbors} from '../src/world.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {driverInfo} from '../src/drivers.mjs';
const pool=new NativeDriverPool(),checks=[],calls=[];
try{
 for(const algorithm of ['A','B'])for(const driver of R.CIVS){
  assert.equal((await driverInfo(driver.file)).status,'ready');
  const g=E.createGame({players:2,size:'small',seed:'ENCOUNTER-NATIVE',barbarians:false,aiAlgorithm:algorithm});for(const p of g.players)E.foundCity(g,p,g.units.find(u=>u.owner===p.id&&u.type==='settler'));g.units=[];
  const p=g.players[0],c=g.cities.find(c=>c.owner===0),holy=neighbors(g.map,g.map.tiles[c.tile]).find(t=>!R.isWater(t)&&t.terrain!=='mountain');p.driver.file=driver.file;p.gold=0;p.faith=10000;p.techs=['pottery','writing'];p.civics=['code','mysticism','theology'];p.religion='wisdom';g.players[1].religion='harvest';
  Object.assign(holy,{terrain:'grass',owner:0,ruin:false,village:false,camp:false,district:{item:'holy',kind:'district',city:c.id}});c.districts.push({item:'holy',tile:holy.id});c.buildings.push('holy','shrine','temple');c.faithPressure={secular:0,1:1000};F.updateFollowers(g,c);E.refreshVisibility(g);
  let obs=E.observation(g,p);obs.player.plan.goal='religion';obs.legalActions=obs.legalActions.filter(a=>a.type==='recruitFaith'&&a.item==='missionary');assert.equal(obs.legalActions.length,1);const foreign=await pool.execute(p,obs);assert(!foreign.orders.some(a=>a.type==='recruitFaith'));
  c.faithPressure={secular:0,0:1000};F.updateFollowers(g,c);obs=E.observation(g,p);obs.player.plan.goal='religion';obs.legalActions=obs.legalActions.filter(a=>a.type==='recruitFaith'&&a.item==='missionary');const own=await pool.execute(p,obs);assert(own.orders.some(a=>a.type==='recruitFaith'&&a.city===c.id));
  const origin=neighbors(g.map,g.map.tiles[c.tile]).find(t=>t!==holy&&!R.isWater(t)&&t.terrain!=='mountain'),target=neighbors(g.map,origin).find(t=>t!==holy&&t.cityId==null&&!R.isWater(t)&&t.terrain!=='mountain');Object.assign(origin,{feature:null});Object.assign(target,{village:true,ruin:false,camp:false,feature:null,owner:null});const scout=E.addUnit(g,0,'scout',origin.id);E.refreshVisibility(g);obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='move'&&a.unit===scout.id&&a.tile===target.id);assert.equal(obs.legalActions.length,1);assert(obs.legalActions[0].hint.village&&obs.legalActions[0].hint.ruin);const village=await pool.execute(p,obs),move=village.orders.find(a=>a.type==='move');assert(move);E.applyAction(g,p,move);assert.equal(target.village,false);
  calls.push({algorithm,driver:driver.file,foreignFaithRefused:true,ownFaithRecruited:true,villageVisited:true});checks.push(algorithm+' '+driver.file);console.log('PASS '+algorithm+' '+driver.file+' village exploration and faith ownership');
 }
 await writeFile(new URL('../output/encounters-faith-20261018/native-checks.json',import.meta.url),JSON.stringify({passed:true,checks,calls,realNativeCalls:calls.length*3,saveWritten:false,liveGameControlled:false},null,2)+'\n');
}finally{pool.dispose();}
