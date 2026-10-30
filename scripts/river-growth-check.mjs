// Shared river movement costs and private, authoritative population estimates.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {DIRECTIONS,cityGrowth} from '../src/rules.mjs';
import {riverBlocks} from '../src/movement-rules.mjs';
import {unitRoute,advanceMoveOrder} from '../src/player-planning.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {field} from './imperial-fixture.mjs';

const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
function crossing(){
 const f=field(),{g,p,tile}=f,from=tile(12,10),to=tile(13,10),direction=DIRECTIONS.findIndex(([q,r])=>from.q+q===to.q&&from.r+r===to.r);
 Object.assign(from,{river:true,riverEdges:[direction]});Object.assign(to,{river:true,riverEdges:[(direction+3)%6],feature:'forest'});
 const unit=E.addUnit(g,p.id,'warrior',from.id);p.visible=p.explored=g.map.tiles.map(t=>t.id);return {...f,from,to,unit};
}
{
 const {g,p,from,to,unit}=crossing();assert(riverBlocks(g,from,to));assert.equal(E.movementCost(g,p,unit,from,to),2);
 const move=E.reachable(g,p,unit,true).find(m=>m.tile===to.id);assert.deepEqual(move.path,[from.id,to.id]);assert.equal(move.cost,2);
 assert.deepEqual(unitRoute(g,p,unit,to.id).path,[from.id,to.id]);assert.equal(unitRoute(g,p,unit,to.id).turns,1);
 E.applyAction(g,p,{type:'move',unit:unit.id,tile:to.id});assert.equal(unit.tile,to.id);assert.equal(unit.moves,0);
 pass('A full-movement warrior crosses directly onto a wooded riverbank in one turn and spends its allowance');
}
{
 const {g,p,from,to,unit}=crossing();unit.moves=1;assert(!E.reachable(g,p,unit).some(m=>m.tile===to.id));assert.equal(unitRoute(g,p,unit,to.id).turns,2);
 assert.throws(()=>E.applyAction(g,p,{type:'move',unit:unit.id,tile:to.id}));assert.equal(unit.tile,from.id);
 unit.moves=2;to.terrain='mountain';assert.equal(E.movementCost(g,p,unit,from,to),Infinity);assert.equal(unitRoute(g,p,unit,to.id),null);
 to.terrain='grass';E.addUnit(g,p.id,'warrior',to.id);assert.equal(E.movementCost(g,p,unit,from,to),Infinity);
 pass('Spent movement waits until next turn; mountains and occupied riverbanks still reject passage');
}
{
 const {g,p,from,to,unit}=crossing(),support=E.addUnit(g,p.id,'herbalist',from.id);unit.linkedUnit=support.id;support.linkedUnit=unit.id;
 assert.equal(E.reachable(g,p,unit).find(m=>m.tile===to.id).cost,2);E.applyAction(g,p,{type:'move',unit:unit.id,tile:to.id});assert.equal(support.tile,to.id);assert.equal(support.moves,0);
 const f=crossing();f.unit.moveOrder={destination:f.to.id};assert(advanceMoveOrder(f.g,f.p,f.unit,a=>E.applyAction(f.g,f.p,a)));assert.equal(f.unit.tile,f.to.id);
 pass('Linked support and persistent marching use the same direct river crossing without abandoning the route');
}
{
 const {g,p,to,unit}=crossing(),sim=new RealtimeSimulation(g);try{sim.enqueue(p,[{type:'move',unit:unit.id,tile:to.id}],{manual:true});sim.play();sim.tick(4);assert.equal(unit.tile,to.id);assert.equal(sim.stats.rejected,0);}finally{sim.dispose();}
 pass('Timed movement admits and completes the same river crossing');
}
{
 const {g,p,home,other}=field();home.food=4;E.refreshVisibility(g);p.visible=p.explored=g.map.tiles.map(t=>t.id);
 let expected=cityGrowth(g,home,E.cityYields(g,home));assert(expected.rate>0);let view=E.snapshot(g,p.id);
 assert.deepEqual(view.cities.find(c=>c.id===home.id).growthStatus,expected);assert.deepEqual(E.observation(g,p).cities.find(c=>c.id===home.id).growthStatus,expected);
 assert.equal(view.cities.find(c=>c.id===other.id).growthStatus,undefined);assert.equal(view.cities.find(c=>c.id===other.id).food,null);
 home.population=30;home.food=1;expected=cityGrowth(g,home,E.cityYields(g,home));assert(expected.rate<0);assert.equal(expected.starvationTurns,1);
 view=E.snapshot(g,-1);assert.deepEqual(view.cities.find(c=>c.id===home.id).growthStatus,expected);E.finishTurn(g);assert.equal(home.population,29);
 assert(!Object.hasOwn(home,'growthStatus'));assert(!JSON.parse(E.serialize(g)).cities.some(c=>Object.hasOwn(c,'growthStatus')));
 pass('Human and MCP views agree with actual population settlement; foreign food stays private and saves gain no derived fields');
}
await mkdir(new URL('../output/river-growth-20261025/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/river-growth-20261025/rules.json',import.meta.url),JSON.stringify({passed:true,checks,activeSaveWritten:false},null,2));
