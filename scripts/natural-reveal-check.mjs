// Actual Hanno activation must preserve known auras in newly surveyed remembered terrain.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as N from '../src/natural-wonders.mjs';
import * as C from '../src/climate.mjs';
import * as H from '../src/heritage.mjs';
import {TECHS,dist} from '../src/rules.mjs';
import {neighbors} from '../src/world.mjs';
import {field} from './imperial-fixture.mjs';
import {prepareSite} from './natural-wonders-fixture.mjs';
const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
function fixture(sourceX=10){
  const f=field(),{g,p,home,tile}=f;p.techs=Object.keys(TECHS);
  const district=tile(4,3);district.district={item:'commercial',kind:'district',city:home.id};home.districts.push({item:'commercial',tile:district.id});home.buildings.push('commercial');
  g.settings.naturalWondersEnabled=true;delete g.naturalWonders;N.initializeNaturalWonders(g);const source=prepareSite(g,'mount_etna',tile(sourceX,5));N.placeNaturalWonder(g,'mount_etna',source.id);C.initializeClimate(g);
  const plot=neighbors(g.map,source).find(t=>t.terrain==='grass'&&dist(t,g.map.tiles[home.tile],g.map)<=8&&dist(t,g.map.tiles[home.tile],g.map)>3);assert(plot);
  const unit=E.addUnit(g,p.id,'great_person',home.tile);Object.assign(unit,{greatPerson:'hanno_the_navigator',charges:1,activations:0});p.greatPeople.owned.push({key:unit.greatPerson,unit:unit.id});g.heritage.recruited[unit.greatPerson]={owner:p.id,turn:g.turn};E.refreshVisibility(g);
  assert.equal(H.activationError(g,p,unit,{city:home.id}),null);return {...f,source,plot,unit};
}
function activate(f){E.applyAction(f.g,f.p,{type:'activateGreatPerson',unit:f.unit.id,city:f.home.id});}
function roundtrip(g){const saved=E.serialize(g),again=E.serialize(E.restore(saved));if(saved!==again){const diffs=[];function walk(a,b,path=''){if(a===b||diffs.length>=8)return;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[k],b[k],path+'/'+k);}else diffs.push({path,before:a,after:b});}walk(JSON.parse(saved),JSON.parse(again));assert.fail('Save roundtrip differences: '+JSON.stringify(diffs));}}
{
  const f=fixture(),{g,p,source,plot}=f;p.explored=[...new Set([...p.explored,source.id,plot.id])];p.knownTiles[source.id]=structuredClone(source);p.knownTiles[plot.id]=structuredClone(plot);E.refreshVisibility(g);
  assert(!p.visible.includes(plot.id));assert.deepEqual(p.knownTiles[plot.id].naturalYield,{food:1,production:1});const culture=p.cultureBank||0;
  activate(f);assert.deepEqual(p.knownTiles[plot.id].naturalYield,{food:1,production:1});assert.equal(p.cultureBank||0,culture);roundtrip(g);
  pass('Resurveying a known remote aura preserves its numeric bonus and exact save state without duplicate discovery rewards');
}
{
  const f=fixture(),{g,p,source,plot}=f;assert(!p.explored.includes(source.id));const culture=p.cultureBank||0;
  activate(f);assert(p.naturalDiscoveries.includes('mount_etna'));assert.deepEqual(p.knownTiles[plot.id].naturalYield,{food:1,production:1});assert(p.cultureBank>culture);
  const earned=p.cultureBank;E.refreshVisibility(g);assert.equal(p.cultureBank,earned);roundtrip(g);
  pass('Surveying a new source grants one normal discovery and adds its aura to revealed remembered neighbors');
}
{
  const f=fixture(11),{g,p,source,plot,home}=f;assert(dist(source,g.map.tiles[home.tile],g.map)>8);assert(dist(plot,g.map.tiles[home.tile],g.map)<=8);const culture=p.cultureBank||0;
  activate(f);assert(!p.explored.includes(source.id));assert(!p.naturalDiscoveries.includes('mount_etna'));assert.equal(p.knownTiles[plot.id].naturalYield,undefined);assert.equal(p.cultureBank||0,culture);roundtrip(g);
  pass('A source beyond survey range stays hidden and grants neither aura nor discovery rewards');
}
const out='output/parallel-quick-20261030';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/reveal-checks.json',JSON.stringify({passed:true,checks,productionSaveWrites:false,paidModelCalls:0},null,2));
