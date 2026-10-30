// Interaction semantics with disposable worlds; no production process or save writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as C from '../src/court.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {field} from './imperial-fixture.mjs';

const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
{
 const {g,p}=field();assert.equal(p.research,null);assert.equal(p.civic,'code');const before={...p.researchProgress};E.finishTurn(g);assert.deepEqual(p.researchProgress,before);assert(p.scienceBank>0);
 E.applyAction(g,p,{type:'research',item:'mining'});E.finishTurn(g);assert((p.researchProgress.mining||0)>0);assert.equal(p.researchProgress.pottery,undefined);
 const save=JSON.parse(E.serialize(g));save.players[0].research='pottery';const restored=E.restore(JSON.stringify(save));assert.equal(restored.players[0].research,'pottery');
 pass('New worlds await a science choice, keep Code of Laws, bank unassigned science and preserve existing saved research');
}
for(const accepted of [true,false]){
 const {g,p,q}=field();assignController(p,'human');assignController(q,'native');q.attitudes={...(q.attitudes||{}),[p.id]:{...(q.attitudes?.[p.id]||{}),opinion:accepted?80:-80,mods:[]}};
 const turn=g.turn;E.applyAction(g,p,{type:'friendship',player:q.id});const offer=g.court.offers.at(-1);assert.equal(offer.status,accepted?'accepted':'rejected');assert.equal(C.isFriend(g,p.id,q.id),accepted);assert.equal(g.turn,turn);assert(g.court.dialogues.some(d=>d.accepted===accepted));
 const view=E.snapshot(g,p.id);assert(view.court.ready[p.id+':'+q.id]>0);assert(!Object.keys(E.snapshot(g,2).court.ready).some(k=>k.startsWith(p.id+':')));
 assert.throws(()=>E.applyAction(g,p,{type:'delegation',player:q.id}));
 pass('Native friendship '+(accepted?'acceptance':'rejection')+' is immediate, uses actual opinion and retains private cooldowns');
}
for(const kind of ['human','agent','inactive']){
 const {g,p,q}=field();assignController(q,kind,kind==='agent'?{displayName:'Test Agent',agentId:'test'}:{});E.applyAction(g,p,{type:'friendship',player:q.id});const offer=g.court.offers.at(-1);assert.equal(offer.status,'pending');assert(!C.isFriend(g,p.id,q.id));
 if(kind!=='inactive'){E.applyAction(g,q,{type:'acceptCourt',offer:offer.id});assert(C.isFriend(g,p.id,q.id));}
}
pass('Human and external-agent offers wait for explicit consent; inactive controllers are not answered on submission');
{
 const {g,p,q}=field();assignController(q,'native');const total=p.gold+q.gold;E.applyAction(g,p,{type:'tradeDeal',player:q.id,deal:{give:{gold:50},receive:{faith:1}}});assert.equal(g.court.offers.at(-1).status,'accepted');assert.equal(p.gold+q.gold,total);const paid=p.gold;C.courtTurn(g,E.event);assert.equal(p.gold,paid);
 pass('Immediate fair trades transfer assets exactly once; later economy processing never charges them twice');
}
await mkdir(new URL('../output/interaction-feedback-20261026/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/interaction-feedback-20261026/rules.json',import.meta.url),JSON.stringify({passed:true,checks,activeSaveWritten:false},null,2));
