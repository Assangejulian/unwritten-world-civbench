import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,applyAction,addUnit,finishTurn,refreshVisibility,productionOptions,legalActions,unitStrength,observation,snapshot,serialize,restore} from '../src/engine.mjs';
import {UNITS,TECHS,CIVICS,RESOURCES,dist,productionCost} from '../src/rules.mjs';
import {executeDriver} from '../src/drivers.mjs';

const extra=['slinger','pikeman','manatarms','courser','cuirassier','cavalry','artillery','battleship'],checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const g=createGame({players:2,seed:'UNIT-EXPANSION-RULES',barbarians:false}),p=g.players[0];
for(const owner of g.players)applyAction(g,owner,{type:'found',unit:g.units.find(u=>u.owner===owner.id&&u.type==='settler').id});
const city=g.cities[0],home=g.map.tiles[city.tile],around=g.map.tiles.filter(t=>dist(t,home)<=2&&t.id!==home.id);
for(const t of [home,...around])Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,owner:0});
around.find(t=>dist(t,home)===1&&![around[1].id,around[2].id,around[3].id].includes(t.id)).terrain='coast';
for(const [i,resource]of ['iron','horses','oil'].entries())Object.assign(around[i+1],{resource,improvement:RESOURCES[resource].improvement});
p.techs=Object.keys(TECHS);p.civics=Object.keys(CIVICS);p.gold=100000;g.units=[];refreshVisibility(g);
for(const type of extra){
  const spec=UNITS[type];city.production=null;
  if(spec.tech){p.techs=p.techs.filter(k=>k!==spec.tech);assert(!productionOptions(g,p,city).some(a=>a.item===type));assert.throws(()=>applyAction(g,p,{type:'produce',city:city.id,item:type}));p.techs.push(spec.tech);}
  if(spec.resource){const deposit=around.find(t=>t.resource===spec.resource),old=deposit.improvement;deposit.improvement=null;assert(!productionOptions(g,p,city).some(a=>a.item===type));deposit.improvement=old;}
  const action=legalActions(g,p).find(a=>a.type==='produce'&&a.item===type);assert(action,type);assert.equal(action.hint.domain,spec.domain||'land');assert.equal(action.hint.ranged,spec.ranged||0);assert.equal(action.hint.military,true);
  applyAction(g,p,action);city.production.progress=productionCost(g,type)-1;finishTurn(g);
  const unit=g.units.find(u=>u.owner===0&&u.type===type);assert(unit,'Production must create '+type);
  assert.equal(['coast','ocean'].includes(g.map.tiles[unit.tile].terrain),spec.domain==='sea');
  const info=observation(g,p).units.find(u=>u.id===unit.id);assert.equal(info.domain,spec.domain||'land');
  metrics[type]={cost:productionCost(g,type),strength:spec.strength,ranged:spec.ranged||0,tech:spec.tech||null,domain:info.domain};
  g.units=[];pass(type+' has real technology, resource, production, and spawn rules');
}

const spear=addUnit(g,0,'pikeman',home.id),horse=addUnit(g,1,'cavalry',around[2].id);
assert.equal(unitStrength(g,spear,false,horse)-unitStrength(g,spear),10);
const infantry=addUnit(g,1,'rifleman',around[3].id);assert.equal(unitStrength(g,spear,false,infantry),unitStrength(g,spear));
pass('Anti-cavalry bonuses apply to cavalry opponents only');
const slinger=addUnit(g,0,'slinger',home.id);const upgrade=legalActions(g,p).find(a=>a.type==='upgrade'&&a.unit===slinger.id&&a.item==='archer');assert(upgrade);applyAction(g,p,upgrade);assert.equal(slinger.type,'archer');assert(slinger.acted&&slinger.moves===0);pass('Slingers upgrade through the real action system');
g.units=[];const artillery=addUnit(g,0,'artillery',home.id),targetTile=around.find(t=>dist(t,home)===2&&t.terrain==='grass'),enemy=addUnit(g,1,'pikeman',targetTile.id);
p.relations[1].status='war';g.players[1].relations[0].status='war';refreshVisibility(g);
applyAction(g,p,{type:'attack',unit:artillery.id,targetUnit:enemy.id});assert(enemy.hp<100);assert(artillery.acted&&artillery.moves===0);assert(snapshot(g,-1).visuals.events.some(e=>e.kind==='attack'&&e.actor.type==='artillery'));pass('New artillery deals damage and emits actual combat animations');
p.driver.file='06_mariner.cpp';city.production=null;
let obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&a.item==='battleship');
const trained=await executeDriver(p,obs),order=trained.orders.find(a=>a.type==='produce'&&a.item==='battleship');assert(order);applyAction(g,p,order);city.production.progress=productionCost(g,'battleship')-1;finishTurn(g);
const ship=g.units.find(u=>u.owner===0&&u.type==='battleship');assert(ship);
const water=g.map.tiles.filter(t=>dist(t,g.map.tiles[ship.tile])===1&&!t.cityId&&!t.resource);for(const t of water)Object.assign(t,{terrain:'coast',hill:false,feature:null,owner:0});refreshVisibility(g);
obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===ship.id&&a.type==='move');assert(obs.legalActions.length);
const sailed=await executeDriver(p,obs),move=sailed.orders.find(a=>a.type==='move'&&a.unit===ship.id);assert(move,'Native naval strategy must recognize the new ship domain');applyAction(g,p,move);assert.equal(ship.tile,move.tile);metrics.nativeBattleship={training:true,movement:true};pass('A real native C++ driver trains a battleship and sails it legally');
const current=await readFile(new URL('../output/before-alignment-water-update.json',import.meta.url),'utf8');assert.equal(serialize(restore(current)),current);metrics.savedTurn=JSON.parse(current).turn;pass('The current save remains byte exact through restore');

// Renderer-only gallery; no changes to player saves or river generation rules.
const gallery=createGame({players:1,seed:'ALIGNMENT-ART-GALLERY',barbarians:false});gallery.units=[];gallery.cities=[];gallery.routes=[];
const samples=[],resources=Object.keys(RESOURCES);for(const t of gallery.map.tiles)t.resource=null;
for(const t of gallery.map.tiles)if(t.col>=36&&t.col<=65&&t.row>=18&&t.row<=41)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
for(let i=0;i<resources.length;i++){const t=gallery.map.tiles[(25+Math.floor(i/7)*3)*gallery.map.width+42+(i%7)*2];t.resource=resources[i];if(t.resource==='fish')t.terrain='coast';samples.push({kind:'resource',type:t.resource,tile:t.id});}
for(let i=0;i<extra.length;i++){const t=gallery.map.tiles[(33+Math.floor(i/4)*3)*gallery.map.width+44+(i%4)*3];if(UNITS[extra[i]].domain==='sea')t.terrain='coast';const u=addUnit(gallery,0,extra[i],t.id);samples.push({kind:'unit',type:extra[i],tile:t.id,unit:u.id});}
refreshVisibility(gallery);await writeFile(new URL('../output/alignment-gallery-fixture.json',import.meta.url),JSON.stringify({state:snapshot(gallery,-1),samples,center:gallery.map.tiles[30*gallery.map.width+49].id}));
await writeFile(new URL('../output/alignment-expansion-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics},null,2));
