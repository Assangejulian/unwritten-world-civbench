import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,addUnit,reachable,attackTargets,applyAction,snapshot,serialize,restore,refreshVisibility,unitStrength,observation} from '../src/engine.mjs';
import {UNITS,unitTransport,canEmbark,transportKind} from '../src/rules.mjs';
import {indexMap} from '../src/world.mjs';
import {worldBounds,constrainCamera,visibleWorldCopies,canonicalColumn} from '../web/world-camera.js';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
function fixture(type,techs){
  const g=createGame({seed:'TRANSPORT-RULE-FIXTURE',players:2,size:'small',barbarians:false}),width=7,height=5;
  g.cities=[];g.units=[];g.map=indexMap({width,height,wrapX:false,tiles:Array.from({length:35},(_,id)=>{const row=Math.floor(id/width),col=id%width;return {id,q:col-Math.floor(row/2),r:row,col,row,terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[]};})});
  g.map.tiles[17].terrain='coast';g.map.tiles[18].terrain='ocean';g.map.roadRules=1;const p=g.players[0];p.techs=techs;p.relations[1].status='war';g.players[1].relations[0].status='war';p.relations[1].warStartedAt=20;g.players[1].relations[0].warStartedAt=20;
  const u=addUnit(g,0,type,16);u.moves=2;refreshVisibility(g);return {g,p,u};
}
for(const type of Object.keys(UNITS).filter(k=>!['sea','air'].includes(UNITS[k].domain)&&k!=='envoy')){
  const heavy=transportKind(type)==='cargo',{g,p,u}=fixture(type,[]);
  assert(!reachable(g,p,u).some(m=>m.tile===17));p.techs=['sailing'];assert.equal(reachable(g,p,u).some(m=>m.tile===17),!heavy);
  p.techs=['sailing','steam'];assert(reachable(g,p,u).some(m=>m.tile===17));assert(!reachable(g,p,u).some(m=>m.tile===18));
  p.techs.push('celestial');assert(reachable(g,p,u).some(m=>m.tile===18));applyAction(g,p,{type:'move',unit:u.id,tile:17});
  assert.equal(unitTransport(u,g.map.tiles[u.tile]),heavy?'cargo':'wood');const state=snapshot(g).units.find(n=>n.id===u.id);assert(state.embarked);assert.equal(state.transport,heavy?'cargo':'wood');assert(!Object.hasOwn(u,'transport'));
  assert.equal(observation(g,p).units.find(n=>n.id===u.id).transport,state.transport);
  const enemy=addUnit(g,1,'galley',18);refreshVisibility(g);u.acted=false;u.moves=2;
  // Modern air-only defenses retain their target restrictions while embarked.
  if(UNITS[type].civilian||UNITS[type].airOnly){assert.equal(attackTargets(g,p,u).length,0);assert.throws(()=>applyAction(g,p,{type:'attack',unit:u.id,targetUnit:enemy.id}));}else{assert(attackTargets(g,p,u).some(a=>a.targetUnit===enemy.id),type);assert(attackTargets(g,p,u).every(a=>a.distance<=1));}assert(unitStrength(g,u)<=18);
  p.techs=[];assert(reachable(g,p,u).some(m=>m.tile===16),'A legacy transport must be able to land');applyAction(g,p,{type:'move',unit:u.id,tile:16});assert.equal(unitTransport(u,g.map.tiles[16]),null);
  u.acted=false;u.moves=2;enemy.tile=15;g.map.tiles[15].terrain='coast';refreshVisibility(g);if(!UNITS[type].civilian)assert.equal(attackTargets(g,p,u).some(t=>t.targetUnit===enemy.id),!!UNITS[type].ranged&&!UNITS[type].airOnly,type);
  const reloaded=restore(serialize(g));assert.deepEqual(reloaded.units,g.units);assert.equal(reloaded.rngState,g.rngState);assert.equal(serialize(restore(serialize(reloaded))),serialize(reloaded));
}
pass('All land units require transport technology; tanks, heavy artillery and medical vehicles require steam-powered cargo ships');
pass('Embarked troops have reduced strength and water-only melee; landing restores their role and cross-domain ranged rules');
for(const type of Object.keys(UNITS).filter(k=>UNITS[k].domain==='sea')){const {g,p,u}=fixture(type,['sailing','celestial']);u.tile=17;assert.equal(unitTransport(u,g.map.tiles[17]),null);assert(!reachable(g,p,u).some(m=>m.tile===16));addUnit(g,1,'galley',18);refreshVisibility(g);assert(attackTargets(g,p,u).length);}
pass('Naval units stay on water and retain normal attacks');
const bounds=worldBounds({width:106,height:66});
for(const wrap of [true,false])for(const zoom of [.15,1.98,2.8])for(const x of [-1e5,1e5])for(const y of [-1e5,1e5]){
  const cam=constrainCamera({x,y},zoom,1920,1080,bounds,wrap);assert(cam.y>=bounds.top&&cam.y<=bounds.bottom);
  assert(cam.x>=bounds.left&&cam.x<=bounds.right);
  if(!wrap&&bounds.period>1920/zoom){assert(cam.x-1920/(2*zoom)>=bounds.left-1e-8);assert(cam.x+1920/(2*zoom)<=bounds.right+1e-8);}
  if(bounds.bottom-bounds.top>1080/(zoom*.6)){assert(cam.y-1080/(2*zoom*.6)>=bounds.top-1e-8);assert(cam.y+1080/(2*zoom*.6)<=bounds.bottom+1e-8);}
}
assert.equal(canonicalColumn(-1,106),105);assert.equal(canonicalColumn(106,106),0);assert.deepEqual(visibleWorldCopies({x:bounds.left+50},1.98,1920,bounds,true),[-1,0]);assert.deepEqual(visibleWorldCopies({x:bounds.left},1.98,1920,bounds,false),[0]);
const a=constrainCamera({x:bounds.left+45,y:900},1.98,1920,1080,bounds,true),b=constrainCamera({x:bounds.left+45+bounds.period*3,y:900},1.98,1920,1080,bounds,true);assert(Math.abs(a.x-b.x)<1e-8);
pass('Global vision wraps horizontally; fog vision clamps horizontally; vertical limits hold at every zoom');
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));pass('The current player autosave remains byte-for-byte unchanged');
await writeFile(new URL('../output/transport-boundary-checks.json',import.meta.url),JSON.stringify({passed:true,checks,unitTypes:Object.keys(UNITS).length,saveTurn:JSON.parse(before).turn},null,2));
