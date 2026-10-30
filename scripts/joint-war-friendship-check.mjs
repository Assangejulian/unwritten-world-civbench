// Joint-war eligibility must honor the same friendship protection as ordinary declarations.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as W from '../src/warfare.mjs';
import {field} from './imperial-fixture.mjs';
const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
function fixture(){const f=field(),{g,p,q,z}=f;W.beginWar(g,q,z,E.event);q.knownCities[f.home.id]={id:f.home.id,name:f.home.name,owner:p.id,tile:f.home.tile};return f;}
function friends(g,a,b){a.relations[b.id].friendUntil=b.relations[a.id].friendUntil=W.timeOf(g)+600;}
function offer(f){const {g,p,q,z}=f,envoy=W.sendEnvoy(g,q,p.id,E.addUnit,E.event,{mode:'concession',gold:40},z.id);envoy.tile=f.home.tile;W.envoyArrival(g,envoy,E.event);const proposal=g.diplomacy.proposals.find(o=>o.envoy===envoy.id);assert(proposal);return {envoy,proposal};}
{
  const {g,p,q,z}=fixture();assert(W.jointWarAllowed(g,q.id,p.id,z.id));friends(g,p,z);const gold=q.gold;
  assert.equal(W.jointWarAllowed(g,q.id,p.id,z.id),false);
  assert.throws(()=>W.sendEnvoy(g,q,p.id,E.addUnit,E.event,{mode:'concession',gold:40},z.id));assert.equal(q.gold,gold);
  pass('A protected friend cannot be recruited as a joint-war target; a blocked mission spends no gold');
}
{
  const f=fixture(),{g,p,q,z}=f,{envoy,proposal}=offer(f);friends(g,p,z);
  const gold=[p.gold,q.gold];assert.equal(W.jointWarAssessment(g,p,proposal,E.militaryFinance(g,p)).accept,false);
  assert.throws(()=>W.answerProposal(g,p,proposal.id,true,E.event));assert.equal(proposal.status,'pending');assert.deepEqual([p.gold,q.gold],gold);
  p.manual=false;assert.doesNotThrow(()=>W.diplomacyTurn(g,E.event,{finance:owner=>E.militaryFinance(g,owner)}));
  assert.equal(proposal.status,'expired');assert.equal(p.relations[z.id].status,'peace');assert(!g.units.some(u=>u.id===envoy.id));assert.deepEqual([p.gold,q.gold],gold);
  pass('Friendship formed after arrival expires an obsolete mission without partial acceptance, payment or round-ending exceptions');
}
{
  const f=fixture(),{g,p,q,z}=f;friends(g,p,q);assert(W.jointWarAllowed(g,q.id,p.id,z.id));const {proposal}=offer(f),gold=[p.gold,q.gold];
  W.answerProposal(g,p,proposal.id,true,E.event);assert.equal(proposal.status,'accepted');assert.equal(p.relations[z.id].status,'war');assert.deepEqual([p.gold,q.gold],[gold[0]+40,gold[1]-40]);
  pass('A friendly sender can still recruit valid aid against an unprotected enemy and pay the agreed terms');
}
await mkdir('output/quick-eight-20261030',{recursive:true});await writeFile('output/quick-eight-20261030/friendship-checks.json',JSON.stringify({passed:true,checks,productionSaveWrites:false},null,2));
