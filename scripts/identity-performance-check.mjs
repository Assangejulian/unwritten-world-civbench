import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import * as engine from '../src/engine.mjs';
import {DEFAULT_LEADER_KEYS,leaderFor} from '../src/rules.mjs';
import {historicalIdentity,historicalNation} from '../src/nations.mjs';
const save=new URL('../saves/autosave.json',import.meta.url),before=await readFile(save);
let baselineSource=await readFile(new URL('../output/before-yield-sort-engine.mjs.txt',import.meta.url),'utf8');
baselineSource=baselineSource.replaceAll(/from '(\.\/[^']+)'/g,(_,relative)=>`from '${new URL('../src/'+relative.slice(2),import.meta.url).href}'`);
const baseline=await import('data:text/javascript;base64,'+Buffer.from(baselineSource).toString('base64'));
const raw=JSON.parse(before);for(const p of raw.players){p.leaderKey=DEFAULT_LEADER_KEYS[p.id];p.leader=leaderFor(p).name;Object.assign(p,historicalIdentity(p.leaderKey,p.id));}
const old=baseline.restore(JSON.stringify(raw)),current=engine.restore(JSON.stringify(raw));
for(const view of [-1,...current.players.map(p=>p.id)])assert.deepEqual(engine.snapshot(current,view,{manualOptionsOnly:true}),baseline.snapshot(old,view,{manualOptionsOnly:true}));
for(const p of current.players)assert.deepEqual(engine.observation(current,p),baseline.observation(old,old.players[p.id]));
console.log('PASS Every perspective snapshot and all eight native observations match the previous yield calculation exactly');
for(const key of Object.keys((await import('../src/nations.mjs')).HISTORICAL_NATIONS)){
 const g=engine.createGame({seed:'NATIONAL-IDENTITY',players:1,size:'small',barbarians:false,leaders:[key]}),p=g.players[0];assert.equal(p.name,historicalNation(key).name);assert.equal(p.capitalName,historicalNation(key).capital);
 const c=engine.foundCity(g,p,g.units.find(u=>u.type==='settler'));assert.equal(c.name,historicalNation(key).capital);assert.equal(engine.restore(engine.serialize(g)).players[0].name,p.name);
}
console.log('PASS All 25 historical countries and capital names follow the selected leader and survive save/load');
const times={before:[],after:[]};
for(let i=0;i<16;i++)for(const name of i%2?['after','before']:['before','after']){
 const module=name==='before'?baseline:engine,g=name==='before'?old:current,start=performance.now();module.snapshot(g,-1,{manualOptionsOnly:true});for(const p of g.players)module.observation(g,p);if(i>=8)times[name].push(performance.now()-start);
}
function summarize(samples){const sorted=samples.toSorted((a,b)=>a-b);return {samples,median:sorted[Math.floor(sorted.length/2)],mean:samples.reduce((a,b)=>a+b,0)/samples.length};}
const result={before:summarize(times.before),after:summarize(times.after),save:{turn:raw.turn,clock:raw.realtime.time,cities:raw.cities.length,units:raw.units.length},scope:'Alternating baseline/optimized full snapshot plus eight observations after eight warmup pairs; in-memory historical migration, not physical GPU/FPS'};
result.medianReduction=1-result.after.median/result.before.median;
assert((await readFile(save)).equals(before));await writeFile(new URL('../output/identity-performance-checks.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
