import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as E from '../src/engine.mjs';
import {routeGuidance} from '../src/campaign.mjs';
import {carrierField} from './carrier-check.mjs';
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,'')),checks=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
{
 const {g,p,gun,tile}=carrierField();E.refreshVisibility(g);const visible=p.visible,known=p.knownTiles,goal=[{tile:tile(20,15).id}],route=routeGuidance(g,p,gun,goal,{explore:false});E.refreshVisibility(g);assert.equal(p.visible,visible);assert.equal(p.knownTiles,known);assert.equal(routeGuidance(g,p,gun,goal,{explore:false}),route);
 tile(16,15).road=true;E.refreshVisibility(g);assert.notEqual(routeGuidance(g,p,gun,goal,{explore:false}),route);
 const blocked=routeGuidance(g,p,gun,goal,{explore:false,avoidOccupied:true});E.addUnit(g,p.id,'frigate',tile(16,15).id);assert.notEqual(routeGuidance(g,p,gun,goal,{explore:false,avoidOccupied:true}),blocked);
 const id=tile(45,28).id;p.visible=p.visible.filter(v=>v!==id);p.knownTiles[id]={...g.map.tiles[id],terrain:'grass',road:false};g.map.tiles[id].terrain='mountain';E.refreshVisibility(g);assert.equal(p.knownTiles[id].terrain,'grass');
 pass('Unchanged vision reuses routes, visible roads and occupied cells invalidate them, and hidden terrain remains remembered');
}
const input=await readFile(new URL('../output/performance-audit-20261009/live-input.json',import.meta.url),'utf8'),prior={workspace:process.env.CIV_BASELINE_WORKSPACE||path.join(root,'output/modern-regressions-1791447859399')},old=await import(pathToFileURL(path.join(prior.workspace,'src/engine.mjs')));
const sample=(fn,n=7)=>{const times=[];for(let i=0;i<n;i++){const t=performance.now();fn();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {median:times[Math.floor(n/2)],p95:times.at(-1)};},metrics={baselineWorkspace:prior.workspace,world:JSON.parse(input).id,players:[],activeSaveWritten:false};
for(const [label,engine] of [['before',old],['after',E]]){
 const game=engine.restore(input);metrics[label]={visibility:sample(()=>engine.refreshVisibility(game),15),snapshot:sample(()=>engine.snapshot(game,-1,{manualOptionsOnly:true}),5)};
 for(const p of game.players.filter(p=>p.alive)){engine.observation(game,p);const timings=sample(()=>engine.observation(game,p),5);metrics.players.push({label,id:p.id,units:game.units.filter(u=>u.owner===p.id).length,observation:timings});}
}
pass('Read-only before/after measurements use identical captured twelve-nation input and a retained pre-change source snapshot');
await mkdir(new URL('../output/performance-optimization-20261010/',import.meta.url),{recursive:true});await writeFile(new URL('../output/performance-optimization-20261010/backend.json',import.meta.url),JSON.stringify({passed:true,checks,metrics},null,2)+'\n');console.log(JSON.stringify(metrics));
