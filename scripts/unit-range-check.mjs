import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {attackRange,airDefenders} from '../src/air-warfare.mjs';
import {battlefield,see} from './air-warfare-check.mjs';

const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const before=fs.readFileSync('output/unit-range-20261014/before/rules.mjs','utf8');
const expected=before.replace(/(rocketartillery:\{[^\n]*?range:)8/,'$14').replace(/(antiair:\{[^\n]*?range:)3/,'$14');
assert.equal(fs.readFileSync('src/rules.mjs','utf8'),expected);
assert.equal(R.UNITS.sam.range,6);
pass('Only rocket-artillery and anti-air ranges change; all damage, costs and other units remain exact');

for(const type of ['rocketartillery','antiair'])for(const restored of [false,true]){
  let {g,p,tile}=battlefield();
  const shooter=E.addUnit(g,0,type,tile(30,15).id);
  const targetType=type==='antiair'?'drone':'infantry';
  const edge=E.addUnit(g,1,targetType,tile(34,15).id),outside=E.addUnit(g,1,targetType,tile(35,15).id);
  see(g);
  if(restored){g=E.restore(E.serialize(g));p=g.players[0];see(g);}
  const unit=g.units.find(u=>u.id===shooter.id),target=g.units.find(u=>u.id===edge.id);
  assert.equal(attackRange(g,unit),4);
  assert.equal(R.dist(g.map.tiles[unit.tile],g.map.tiles[target.tile],g.map),4);
  const targets=E.attackTargets(g,p,unit);
  assert(targets.some(t=>t.targetUnit===edge.id));
  assert(!targets.some(t=>t.targetUnit===outside.id));
  const observation=E.observation(g,p);
  assert.equal(observation.units.find(u=>u.id===unit.id).range,4);
  assert(observation.legalActions.some(a=>a.type==='attack'&&a.unit===unit.id&&a.targetUnit===edge.id));
  assert(!observation.legalActions.some(a=>a.type==='attack'&&a.unit===unit.id&&a.targetUnit===outside.id));
  assert.equal(E.snapshot(g,p.id).units.find(u=>u.id===unit.id).range,4);
  assert.throws(()=>E.applyAction(g,p,{type:'attack',unit:unit.id,targetUnit:outside.id}),/射程/);
  const priorHp=target.hp;
  E.applyAction(g,p,{type:'attack',unit:unit.id,targetUnit:edge.id});
  assert(!g.units.some(u=>u.id===edge.id)||target.hp<priorHp);
  pass(`${type}: real attack at four, rejection at five, AI/UI projections${restored?' after save restoration':''}`);
}

for(const distance of [4,5]){
  const {g,p,q,home,tile}=battlefield();q.spaceStage=1;
  const defender=E.addUnit(g,0,'antiair',tile(10+distance,15).id);
  const drone=E.addUnit(g,1,'drone',tile(19,15).id);see(g);
  assert.equal(R.dist(g.map.tiles[defender.tile],g.map.tiles[home.tile],g.map),distance);
  assert.equal(airDefenders(g,q.id,g.map.tiles[home.tile]).some(u=>u.id===defender.id),distance===4);
  assert.equal(airDefenders(g,q.id,g.map.tiles[home.tile],{visibleOnly:true}).some(u=>u.id===defender.id),distance===4);
  assert(!airDefenders(g,q.id,g.map.tiles[home.tile],{ballistic:true}).some(u=>u.id===defender.id));
  E.applyAction(g,q,{type:'attack',unit:drone.id,targetCity:home.id});
  assert.equal((defender.attackUntil||0)>(g.realtime?.time||0),distance===4);
}
pass('Actual anti-air interception covers four cells, excludes five and retains the ballistic restriction');
fs.writeFileSync('output/unit-range-20261014/ranges.json',JSON.stringify({passed:true,checks,gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
