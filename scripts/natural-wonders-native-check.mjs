// Actual compiled-driver compatibility with discovered/hidden landmarks.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as N from '../src/natural-wonders.mjs';
import {CIVS} from '../src/rules.mjs';
import {driverInfo,executeDriver} from '../src/drivers.mjs';
import {field} from './imperial-fixture.mjs';
const results=[];
for(const civ of CIVS){
  assert.equal((await driverInfo(civ.file)).status,'ready');
  const {g,p,tile}=field();g.settings.naturalWondersEnabled=true;delete g.naturalWonders;N.initializeNaturalWonders(g);
  tile(6,3).terrain='desert';N.placeNaturalWonder(g,'eye_of_the_sahara',tile(6,3).id);
  tile(20,10).terrain='tundra';tile(20,11).terrain='snow';N.placeNaturalWonder(g,'vatnajokull_glacier',tile(20,10).id);
  const unit=E.addUnit(g,0,'warrior',tile(4,4).id);p.driver.file=civ.file;E.refreshVisibility(g);
  const observation=E.observation(g,p);
  assert.equal(observation.naturalWonders.landmarks.length,1);assert.equal(observation.naturalWonders.landmarks[0].key,'eye_of_the_sahara');
  assert.ok(observation.tiles.find(t=>t.id===tile(6,3).id).yields.science>=2);
  observation.legalActions=observation.legalActions.filter(a=>a.type==='move'&&a.unit===unit.id&&[tile(4,5).id,tile(5,4).id].includes(a.tile));
  assert.equal(observation.legalActions.length,2);
  const response=await executeDriver(p,observation),order=response.orders.find(a=>a.unit===unit.id);
  assert.equal(order?.type,'move');assert.ok(observation.legalActions.some(a=>a.tile===order.tile));E.applyAction(g,p,order);assert.equal(unit.tile,order.tile);
  results.push({driver:civ.file,discovered:1,hidden:1,legalOrderApplied:true});
}
await mkdir('output/natural-wonders-real35-20261030',{recursive:true});await writeFile('output/natural-wonders-real35-20261030/native.json',JSON.stringify({passed:true,actualCalls:results.length,results,paidModelCalls:false,productionSaveWrites:false},null,2));
console.log(JSON.stringify({passed:true,actualDrivers:results.length,actualCalls:results.length}));
