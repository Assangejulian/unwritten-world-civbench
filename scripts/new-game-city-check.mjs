// Exercise new-city publication with warm detail caches and private projections.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGame,applyAction,snapshot,restore,serialize} from '../src/engine.mjs';
import {StateTransport} from '../src/state-transport.mjs';
import {mergeStateDelta} from '../web/state-sync.js';

const checks=[];
for(const view of [-1,0]){
  const g=createGame({seed:'NEW-CITY-WORKED-'+view,players:2,size:'small',barbarians:false}),memo=new Map(),transport=new StateTransport();
  const make=()=>snapshot(g,view,{manualOptionsOnly:true,memo});
  const initial=transport.response(g.id,1,view,0,'',make);
  for(const p of g.players)applyAction(g,p,{type:'found',unit:g.units.find(u=>u.owner===p.id&&u.type==='settler').id});
  assert(g.cities.every(c=>!Object.hasOwn(c,'worked')),'Fixture must reproduce an uncomputed new city');
  const changed=transport.response(g.id,2,view,1,g.id,make),published=mergeStateDelta(initial.game,changed.delta,1,view);
  for(const c of published.cities){assert(c.yields);assert(Array.isArray(c.worked));assert(c.worked.length>0);assert.deepEqual(c.worked,g.cities.find(x=>x.id===c.id).worked);assert(c.worked.length<=c.population);}
  checks.push('Newly founded cities publish matching yields and worked tiles through a warm-cache delta, view '+view);
  const again=make(),stable=JSON.stringify(again.cities.map(c=>c.worked));
  for(const c of g.cities)c.worked=[];
  assert.equal(JSON.stringify(again.cities.map(c=>c.worked)),stable,'Published assignments must not alias mutable engine arrays');
  assert.equal(JSON.stringify(make().cities.map(c=>c.worked)),stable,'Memo hits retain the assignments paired with cached yields');
  checks.push('Memoized city details retain detached assignments, view '+view);
  memo.clear();
  const legacy=JSON.parse(serialize(g));for(const c of legacy.cities)delete c.worked;
  const loaded=snapshot(restore(JSON.stringify(legacy)),view,{manualOptionsOnly:true,memo:new Map()});
  assert(loaded.cities.every(c=>Array.isArray(c.worked)&&c.yields));
  checks.push('Legacy city data without worked tiles publishes safely, view '+view);
  if(view===0){
    g.players[0].visible=g.map.tiles.map(t=>t.id);g.players[0].explored=[...g.players[0].visible];
    const foreign=snapshot(g,0,{memo:new Map()}).cities.find(c=>c.owner!==0);
    assert(foreign);assert.deepEqual(foreign.worked,[]);assert.equal(foreign.yields,undefined);assert.equal(foreign.food,null);
    checks.push('Visible foreign cities keep private work assignments and yields redacted');
  }
}
await mkdir(new URL('../output/new-game-length-20261017/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/new-game-length-20261017/engine-checks.json',import.meta.url),JSON.stringify({passed:true,checks,liveAPIsUsed:false,activeSaveWritten:false},null,2));
for(const check of checks)console.log('PASS '+check);
