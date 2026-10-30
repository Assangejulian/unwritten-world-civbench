// Review matched, frozen native openings rather than treating policy scores as evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'output/early-balance-20261011');
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f)));
const baseline=read('baseline-opening.json'),candidate=read('candidate-opening.json'),manifest=read('baseline-hashes.json');
for(const [file,expected] of Object.entries(manifest.files))assert.equal(hash(path.join(manifest.root,file)),expected,file+' baseline changed');
for(const [file,expected] of Object.entries(baseline.sources))assert.equal(hash(path.join(manifest.root,file)),expected);
for(const [file,expected] of Object.entries(candidate.sources))assert.equal(hash(path.join(root,file)),expected);
assert(baseline.completed&&candidate.completed);assert.equal(candidate.results.length,2);
const summary={baseline:{guarded:0,cities:0,military:0,economic:0},candidate:{guarded:0,cities:0,military:0,economic:0},attacked:[],rejections:[]};
for(const [index,run] of candidate.results.entries()){
 const old=baseline.results[index];assert.equal(run.seed,old.seed);assert.equal(run.calls,1200);assert.equal(old.calls,1200);assert.equal(run.turn,old.turn);assert.equal(run.turn,101);
 assert.deepEqual(run.records.map(r=>r.period),old.records.map(r=>r.period));assert.equal(run.records.at(-1).nations.length,12);
 for(const [label,data] of [['baseline',old],['candidate',run]]){
  for(const p of data.records.at(-1).nations){summary[label].guarded+=p.guards>0;summary[label].cities+=p.cities;if(label==='candidate'){assert(p.alive);assert(p.guards>=2);}}
  for(const p of Object.values(data.productionOrders)){summary[label].military+=p.military;summary[label].economic+=p.economic;if(label==='candidate')assert(p.economic>p.military,'Development must continue for every country');}
 }
 for(const [player,attack] of Object.entries(run.firstAttacked)){assert(attack.guards>=2);summary.attacked.push({seed:run.seed,player:Number(player),...attack});}
 for(const rejection of run.rejections){assert.equal(rejection.type,'move');summary.rejections.push({seed:run.seed,...rejection});}
}
assert.equal(summary.candidate.guarded,24);assert(summary.candidate.guarded>summary.baseline.guarded);
assert(summary.candidate.cities>=summary.baseline.cities*.9);assert(summary.candidate.economic>=summary.baseline.economic*.9);
const reports=Object.fromEntries(['baseline-opening.json','candidate-opening.json','baseline-hashes.json'].map(file=>['output/early-balance-20261011/'+file,hash(path.join(dir,file))]));
const sources=Object.fromEntries(['src/engine.mjs','src/rules.mjs','src/domestic.mjs','sdk/civ.hpp','scripts/early-opening-review.mjs'].map(file=>[file,hash(path.join(root,file))]));
const report={passed:true,summary,sources,reports,scope:candidate.scope,checks:['Two matched twelve-country, 100-period openings use native decisions and preserved baselines','Every country retains a guard and continues more development orders than military orders','Countries attacked in the observed openings already had at least two defenders','Aggregate expansion and development remain within ten percent of the baseline','Only reachability-related movement refusals occur; these are recorded, not claimed as zero stale moves'],activeSaveWritten:false,gameLaunched:false};
fs.writeFileSync(path.join(root,'output/early-opening-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,...summary}));
