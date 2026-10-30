import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,addUnit,reachable,movementCost,applyAction,serialize,restore,refreshVisibility,legalActions} from '../src/engine.mjs';
import {UNITS,movementStepLimit,dist} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {neighbors} from '../src/world.mjs';
const checks=[];
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
function field(type='warrior',{roads=false,sea=false}={}){
 let g=createGame({seed:'MOVEMENT-LIMITS',players:2,size:'small',barbarians:false});
 g.units=[];g.cities=[];g.players.forEach(p=>{p.manual=true;p.techs=['sailing','celestial','steam'];p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];});
 for(const t of g.map.tiles)Object.assign(t,{terrain:sea?'coast':'grass',hill:false,feature:null,river:false,road:roads,roadPillaged:false,owner:null,cityId:null,district:null,fort:null,resource:null,improvement:null});
 const p=g.players[0],start=g.map.tiles.find(t=>t.col===10&&t.row===10),u=addUnit(g,0,type,start.id);u.acted=false;u.moves=UNITS[type].moves;
 if(type==='envoy')u.envoy={state:'travelling',capital:999};
 return {g,p,u};
}
check('Every ground/naval model has a distinct existing mobility limit; aircraft use transfer range',()=>{
 assert.equal(movementStepLimit('warrior'),2);assert.equal(movementStepLimit('scout'),3);assert.equal(movementStepLimit('tank'),4);assert.equal(movementStepLimit('modernarmor'),5);assert.equal(movementStepLimit('fighter'),0);
 for(const [type,spec]of Object.entries(UNITS)){
  if(spec.domain==='air')continue;
  const {g,p,u}=field(type,{roads:true,sea:spec.domain==='sea'}),moves=reachable(g,p,u,true);assert(moves.length,type);
  assert.equal(Math.max(...moves.map(m=>m.path.length-1)),spec.moves,type);
  for(const move of moves){assert(move.cost<=spec.moves+1e-9);assert.equal(move.path[0],u.tile);assert.equal(move.path.at(-1),move.tile);for(let i=1;i<move.path.length;i++)assert.equal(dist(g.map.tiles[move.path[i-1]],g.map.tiles[move.path[i]],g.map),1);}
 }
});
check('Roads cannot extend a single infantry order beyond two cells; unbounded saved moves are clamped',()=>{
 const {g,p,u}=field('warrior',{roads:true});u.moves=100;
 assert(reachable(g,p,u,true).every(m=>m.path.length<=3));
 const far=g.map.tiles.find(t=>t.q===g.map.tiles[u.tile].q+3&&t.r===g.map.tiles[u.tile].r);
 assert.throws(()=>applyAction(g,p,{type:'move',unit:u.id,tile:far.id}));assert.equal(u.tile,g.map.tiles.find(t=>t.col===10&&t.row===10).id);
});
check('Rough terrain still consumes points and roads still reduce cost without granting extra cells',()=>{
 const {g,p,u}=field();for(const t of g.map.tiles)t.hill=true;
 assert.equal(Math.max(...reachable(g,p,u,true).map(m=>m.path.length-1)),1);
 for(const t of g.map.tiles)t.road=true;
 assert.equal(Math.max(...reachable(g,p,u,true).map(m=>m.path.length-1)),1);
 for(const t of g.map.tiles)t.hill=false;
 const move=reachable(g,p,u,true).find(m=>m.path.length===3);assert(move);assert(Math.abs(move.cost-1.2)<1e-8);
});
check('Cheaper road detours do not suppress shorter admissible paths; all returned path costs match',()=>{
 const {g,p,u}=field('tank',{roads:true});for(const t of g.map.tiles)if((t.col+t.row)%3===0){t.road=false;t.hill=true;}
 const moves=reachable(g,p,u,true);assert(moves.some(m=>m.path.length===5));
 const oracle=new Map();
 // Exhaustively enumerate short simple routes, independently of the search frontier.
 function enumerate(tile,cost,steps,visited){if(steps===UNITS[u.type].moves)return;for(const t of neighbors(g.map,g.map.tiles[tile])){if(visited.has(t.id))continue;const next=cost+movementCost(g,p,u,g.map.tiles[tile],t);if(next>u.moves+1e-9||!Number.isFinite(next))continue;oracle.set(t.id,Math.min(oracle.get(t.id)??Infinity,next));enumerate(t.id,next,steps+1,new Set([...visited,t.id]));}}
 enumerate(u.tile,0,0,new Set([u.tile]));assert.equal(moves.length,oracle.size);
 for(const m of moves)assert(Math.abs(m.cost-oracle.get(m.tile))<1e-8,'Minimum bounded route cost for cell '+m.tile);
 for(const m of moves){const cost=m.path.slice(1).reduce((sum,id,i)=>sum+movementCost(g,p,u,g.map.tiles[m.path[i]],g.map.tiles[id]),0);assert(Math.abs(cost-m.cost)<1e-8);assert(m.path.length<=5);}
});
check('Wrapped map seams count as ordinary cells and retain the hard model limit',()=>{
 const {g,p,u}=field('warrior',{roads:true});g.map.wrapX=true;u.tile=g.map.tiles.find(t=>t.col===0&&t.row===10).id;
 const moves=reachable(g,p,u,true);assert(moves.some(m=>g.map.tiles[m.tile].col===g.map.width-1));assert(moves.every(m=>m.path.length<=3));
});
check('Linked tank and medical support share the slower member limit and legal simultaneous arrival',()=>{
 const {g,p,u}=field('tank',{roads:true}),medic=addUnit(g,0,'herbalist',u.tile);u.linkedUnit=medic.id;medic.linkedUnit=u.id;
 const moves=reachable(g,p,u,true);assert.equal(Math.max(...moves.map(m=>m.path.length-1)),2);
 const destination=moves.find(m=>m.path.length===3).tile,sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'move',unit:u.id,tile:destination}],{manual:true});sim.play();sim.tick(4);
 assert.equal(u.tile,destination);assert.equal(medic.tile,destination);assert(!u.activity&&!medic.activity);sim.dispose();
});
check('Manual timed commands, native yielding continuations and save/resume retain the bounded destination',()=>{
 for(const manual of [true,false]){
  const initial=field('tank',{roads:true}),g=restore(serialize(initial.g)),p=g.players[0],u=g.units.find(unit=>unit.id===initial.u.id),moves=reachable(g,p,u,true),move=moves.find(m=>m.path.length===5),sim=new RealtimeSimulation(g);
  assert(move);sim.enqueue(p,[{type:'move',unit:u.id,tile:move.tile}],{manual});sim.play();sim.tick(.2);assert(u.activity);
  const copy=restore(serialize(g)),resumed=new RealtimeSimulation(copy);resumed.play();sim.tick(5);resumed.tick(5);
  assert.equal(u.tile,move.tile);assert.equal(copy.units.find(v=>v.id===u.id).tile,move.tile);
  assert.equal(createHash('sha256').update(serialize(copy)).digest('hex'),createHash('sha256').update(serialize(g)).digest('hex'),'Exact resumed movement state');
  assert.equal(sim.stats.rejected,0);sim.dispose();resumed.dispose();
 }
});
check('Native and selected-unit observations expose only bounded optional paths',()=>{
 const {g,p,u}=field('warrior',{roads:true});refreshVisibility(g);
 const actions=legalActions(g,p,{pathsForUnit:u.id,nativeRoutes:true}).filter(a=>a.type==='move'&&a.unit===u.id);
 assert(actions.length);assert(actions.every(a=>!a.path||a.path.length<=3));
});
await mkdir(new URL('../output/',import.meta.url),{recursive:true});
const sources={};for(const f of ['src/engine.mjs','src/rules.mjs','src/realtime.mjs','scripts/movement-limits-check.mjs'])sources[f]=createHash('sha256').update(await readFile(new URL('../'+f,import.meta.url))).digest('hex');
await writeFile(new URL('../output/movement-limits-checks.json',import.meta.url),JSON.stringify({passed:true,checks,sources,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
