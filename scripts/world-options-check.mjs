// World generation and resource visibility contracts; no production saves or model calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as C from '../src/climate.mjs';
import * as R from '../src/rules.mjs';
import {generateMap,neighbors} from '../src/world.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {projectSeat,readSection} from '../src/environment/projection.mjs';
import {field} from './imperial-fixture.mjs';
const checks=[],measurements={},pass=name=>{checks.push(name);console.log('PASS '+name);};
const strategic=Object.entries(R.RESOURCES).filter(([,v])=>v.tech);
{
  const {g,p,q,tile}=field(),plots=strategic.map(([key],i)=>Object.assign(tile(4+i,4),{resource:key}));
  E.refreshVisibility(g);for(const t of plots){p.explored.push(t.id);p.knownTiles[t.id]=structuredClone(t);}
  const assertView=(view,revealed)=>{for(const [i,[key]]of strategic.entries())assert.equal((view.map?.tiles||view.tiles).find(t=>t.id===plots[i].id).resource,revealed?key:null);};
  const raw=plots.map(t=>[t.id,t.resource]);
  assertView(E.snapshot(g,0),false);assertView(E.observation(g,p),false);assertView(projectSeat(g,0),false);assertView(E.snapshot(g,-1),false);
  const section=readSection(projectSeat(g,0),'map',0,704);assert(!section.items?.some(t=>plots.some(v=>v.id===t.id)&&t.resource));
  q.techs=strategic.map(([,s])=>s.tech);assertView(E.snapshot(g,-1),true);assertView(E.snapshot(g,0),false);
  q.alive=false;assertView(E.snapshot(g,-1),true);
  p.techs=[...q.techs];assertView(E.snapshot(g,0),true);assertView(E.observation(g,p),true);assertView(projectSeat(g,0),true);
  assert.deepEqual(plots.map(t=>[t.id,t.resource]),raw);
  for(const [key,spec]of Object.entries(R.RESOURCES))assert.equal(R.resourceRevealed(key,{techs:[]}),!spec.tech);
  pass('All strategic deposits stay hidden in human/native/MCP maps until own technology; observer uses discovered global technology');
  p.visible=[];for(const t of plots)p.knownTiles[t.id]=structuredClone(t);
  assertView(E.snapshot(g,0),true);p.techs=[];assertView(E.snapshot(g,0),false);
  p.techs=strategic.map(([,s])=>s.tech);delete p.knownTiles[plots[0].id];assert.equal(E.snapshot(g,0).map.tiles[plots[0].id].resource,null);
  pass('Research reveals remembered deposits without rescouting and does not invent resources on intelligence-only unknown plots');
}
{
  const {g,p,tile}=field(),t=Object.assign(tile(4,3),{resource:'iron',hill:true,owner:p.id});p.techs=['mining'];
  assert.deepEqual(R.tileYield(t,p),R.tileYield({...t,resource:null},p));assert.equal(R.improvementFor(p,t),'mine');
  const u=E.addUnit(g,p.id,'builder',t.id);u.charges=3;E.refreshVisibility(g);
  E.applyAction(g,p,{type:'improve',unit:u.id,item:'mine'});assert(!p.boosts.includes('ironwork'));assert.equal(E.snapshot(g,p.id).map.tiles[t.id].resource,null);
  const h=Object.assign(tile(4,4),{resource:'horses'});p.research='pottery';p.boosts=[];E.refreshVisibility(g);E.finishTurn(g,{actions:false});assert(!p.boosts.includes('animal'));
  h.resource='cattle';E.refreshVisibility(g);E.finishTurn(g,{actions:false});assert(p.boosts.includes('animal'));
  pass('Unknown deposits give no bonus yields or resource-specific boosts; ordinary improvements and cattle discovery still work');
}
{
  const totals={sparse:0,standard:0,abundant:0};
  for(const type of ['pangaea','continents','islands'])for(let seed=0;seed<3;seed++){
    const maps=Object.fromEntries(Object.keys(totals).map(resourceAbundance=>[resourceAbundance,generateMap('OPTIONS-'+seed,64,44,8,type,true,{resourceAbundance})]));
    const geography=map=>JSON.stringify({starts:map.starts,tiles:map.tiles.map(({resource,...rest})=>rest)});
    assert.equal(geography(maps.sparse),geography(maps.abundant));assert.equal(geography(maps.standard),geography(maps.abundant));
    for(const [name,map]of Object.entries(maps)){
      totals[name]+=map.tiles.filter(t=>t.resource).length;
      for(const t of map.tiles)if(t.resource)assert.equal(maps.abundant.tiles[t.id].resource,t.resource);
      if(name==='sparse')for(const t of map.tiles)if(t.resource)assert.equal(maps.standard.tiles[t.id].resource,t.resource);
      for(const id of map.starts){const ns=neighbors(map,map.tiles[id]);assert(ns.some(t=>t.resource==='wheat'));assert(ns.some(t=>['iron','horses'].includes(t.resource)));}
    }
    assert.deepEqual(generateMap('OPTIONS-'+seed,64,44,8,type,true,{resourceAbundance:'standard'}),maps.standard);
  }
  measurements.resources=totals;assert(totals.sparse<totals.standard&&totals.standard<totals.abundant);assert(totals.standard/totals.abundant<.7);
  pass('Nine worlds have deterministic nested resource densities, identical geography/starts/rivers and protected starting resources');
}
{
  const totals={};
  for(const rainfall of ['dry','standard','wet']){
    totals[rainfall]={desert:0,vegetation:0,rivers:0};
    for(let seed=0;seed<4;seed++)for(const t of generateMap('RAIN-'+seed,64,44,8,'continents',true,{rainfall}).tiles){totals[rainfall].desert+=t.terrain==='desert';totals[rainfall].vegetation+=['forest','jungle'].includes(t.feature);totals[rainfall].rivers+=!!t.river;}
    const g=E.createGame({players:3,size:'small',seed:'RAIN-BASE',rainfall,disasterIntensity:0});assert.equal(g.climate.rainfall,R.WORLD_RAINFALL[rainfall].rainfall);
    const recorded=[];for(let turn=2;turn<=8;turn++){g.turn=turn;C.settleClimate(g);recorded.push(g.climate.rainfall);}measurements[rainfall]=recorded;
  }
  measurements.geography=totals;
  assert(totals.dry.desert>totals.standard.desert&&totals.standard.desert>totals.wet.desert);
  assert(totals.dry.vegetation<totals.standard.vegetation&&totals.standard.vegetation<totals.wet.vegetation);
  assert(totals.dry.rivers<totals.standard.rivers&&totals.standard.rivers<totals.wet.rivers);
  for(let i=0;i<7;i++){assert(measurements.dry[i]<measurements.standard[i]);assert(measurements.standard[i]<measurements.wet[i]);}
  pass('Rainfall changes actual vegetation/deserts/rivers and retains distinct climate baselines over later turns');
}
{
  for(const rainfall of ['dry','standard','wet'])for(const resourceAbundance of ['sparse','standard','abundant']){
    const g=E.createGame({players:3,size:'small',seed:'SAVE-OPTIONS',rainfall,resourceAbundance,barbarians:false});
    assert(!g.map.tiles.some(t=>t.camp));assert(!g.units.some(u=>u.owner<0));const save=E.serialize(g);assert.equal(E.serialize(E.restore(save)),save);
    delete g.settings.rainfall;delete g.settings.resourceAbundance;const legacy=E.serialize(g);assert.equal(E.serialize(E.restore(legacy)),legacy);
  }
  for(const key of ['rainfall','resourceAbundance','barbarians'])for(const value of [null,[],{},'invalid',42])assert.throws(()=>E.createGame({players:2,size:'small',[key]:value}));
  for(const key of ['rainfall','resourceAbundance','barbarians'])for(const value of [null,'invalid',42])await assert.rejects(()=>MatchRuntime.create({players:2,size:'small',[key]:value}));
  const save=JSON.parse(E.serialize(E.createGame({players:2,size:'small'})));save.settings.rainfall='invalid';assert.throws(()=>E.restore(JSON.stringify(save)));
  pass('All nine combinations roundtrip exactly, legacy settings stay absent, barbarians disable camps, and invalid values are rejected');
}
{
  const lobby=new Lobby({stub:true});
  try{
    const config={players:3,size:'small',seed:'LOBBY-OPTIONS',rainfall:'dry',resourceAbundance:'sparse',barbarians:false,seats:[{seat:0,kind:'human'},{seat:1,kind:'agent',displayName:'Test Agent'},{seat:2,kind:'native'}]};
    await lobby.prepare(config);const first=lobby.runtime;assert.equal(first.game.settings.rainfall,'dry');assert.equal(first.game.settings.resourceAbundance,'sparse');assert.equal(first.game.settings.barbarians,false);
    await lobby.prepare(config);assert.equal(lobby.runtime,first);
    await lobby.prepare({...config,rainfall:'wet'});assert.notEqual(lobby.runtime,first);assert.equal(lobby.runtime.game.settings.rainfall,'wet');
    await assert.rejects(()=>lobby.prepare({...config,resourceAbundance:'invalid'}));
    pass('Real pending MCP lobby forwards options and recreates the world when its rainfall fingerprint changes');
  }finally{lobby.dispose();}
}
fs.mkdirSync('output/world-options-20261030',{recursive:true});fs.writeFileSync('output/world-options-20261030/checks.json',JSON.stringify({passed:true,checks,measurements,productionSaveWrites:false,paidModelCalls:0},null,2));
