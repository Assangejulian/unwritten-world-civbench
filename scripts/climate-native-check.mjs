import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as C from '../src/climate.mjs';
import {CIVS,TECHS,CIVICS} from '../src/rules.mjs';
import {tilesInRange} from '../src/world.mjs';
import {driverInfo,executeDriver} from '../src/drivers.mjs';
import {field} from './imperial-fixture.mjs';

function fixture(){
  const f=field(),{g,p,home,tile}=f;g.settings.climateEnabled=true;g.settings.disasterIntensity=0;
  tile(4,3).river=true;tile(4,3).owner=0;tile(4,3).territoryCity=home.id;
  for(const t of tilesInRange(g.map,tile(14,10),1))t.terrain='snow';
  p.techs=Object.keys(TECHS);p.civics=Object.keys(CIVICS);home.population=8;home.buildings.push('campus','industrial','workshop','factory');
  C.initializeClimate(g);return f;
}
const results=[];
for(const civ of CIVS){
  assert.equal((await driverInfo(civ.file)).status,'ready');
  const f=fixture();f.p.driver.file=civ.file;const observation=E.observation(f.g,f.p);
  observation.legalActions=observation.legalActions.filter(a=>a.type==='produce'&&a.city===f.home.id&&['dam','research'].includes(a.item));
  assert(observation.legalActions.some(a=>a.item==='dam'&&a.hint.climateUtility>0));
  const response=await executeDriver(f.p,observation),order=response.orders.find(a=>a.type==='produce');
  assert.equal(order?.item,'dam',civ.file+' prioritizes useful flood prevention');E.applyAction(f.g,f.p,order);assert.equal(f.home.production.item,'dam');
  const h=fixture(),unit=E.addUnit(h.g,0,'warrior',h.tile(13,10).id);h.p.driver.file=civ.file;
  E.refreshVisibility(h.g);h.p.visible=h.p.explored=h.g.map.tiles.map(t=>t.id);C.startDisaster(h.g,'blizzard',h.tile(14,10).id,{severity:2});
  const obs=E.observation(h.g,h.p);obs.legalActions=obs.legalActions.filter(a=>a.type==='move'&&a.unit===unit.id&&[h.tile(12,10).id,h.tile(14,10).id].includes(a.tile));
  assert.equal(obs.legalActions.length,2);assert(obs.legalActions.some(a=>a.hint.hazardDamage===28));
  const moved=await executeDriver(h.p,obs),move=moved.orders.find(a=>a.unit===unit.id);
  assert.equal(move?.tile,h.tile(12,10).id,civ.file+' avoids the visible damaging storm');E.applyAction(h.g,h.p,move);
  Object.assign(unit,{tile:h.tile(13,10).id,hp:20,moves:2,acted:false,fortified:false});
  const critical=E.observation(h.g,h.p);critical.legalActions=critical.legalActions.filter(a=>a.unit===unit.id&&(a.type==='fortify'||a.type==='move'&&[h.tile(12,10).id,h.tile(14,10).id].includes(a.tile)));
  assert(critical.legalActions.some(a=>a.type==='fortify'&&a.hint.currentIncomingDamage===28));
  const evacuated=await executeDriver(h.p,critical),escape=evacuated.orders.find(a=>a.unit===unit.id);assert.equal(escape?.tile,h.tile(12,10).id,civ.file+' evacuates lethal weather rather than healing in place');E.applyAction(h.g,h.p,escape);
  results.push({driver:civ.file,dam:order.item,safeMove:true,criticalEvacuation:true,calls:3});
}
await mkdir(new URL('../output/climate-20261029/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/climate-20261029/native.json',import.meta.url),JSON.stringify({passed:true,results,calls:results.length*3,paidModel:false},null,2));
console.log(JSON.stringify({passed:true,drivers:results.length,actualCalls:results.length*3,appliedLegalOrders:results.length*3}));
