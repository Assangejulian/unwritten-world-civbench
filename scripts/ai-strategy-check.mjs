import {courtTurn} from '../src/court.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import {initializeClimate} from '../src/climate.mjs';
import * as AI from '../src/ai.mjs';
import * as W from '../src/warfare.mjs';
import * as P from '../src/peace-terms.mjs';
import {UNITS,RELIGIONS,dist,CIVS} from '../src/rules.mjs';
import {executeDriver,listDrivers} from '../src/drivers.mjs';
// Unified strategy fixtures use independent worlds.
const checks=[],evidence=[];
function field(){
 const g=E.createGame({aiAlgorithm:'unified',seed:'REV2-INDEPENDENT',players:4,size:'small',barbarians:false,naturalWondersEnabled:false,climateEnabled:false});
 g.cityStates={version:1,states:[],seeded:true};
 for(const t of g.map.tiles){Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,cityId:null,owner:null,district:null,improvement:null,camp:false,ruin:false});delete t.cityStateTerritory;}
 // Rebuild geography after flattening the artificial diplomatic test map.
 delete g.climate;initializeClimate(g);
 g.units=[];for(const p of g.players){p.manual=true;p.gold=500;p.met=g.players.filter(o=>o!==p).map(o=>o.id);E.foundCity(g,p,E.addUnit(g,p.id,'settler',(8+Math.floor(p.id/2)*10)*g.map.width+8+(p.id%2)*10));}
 g.units=[];E.refreshVisibility(g);for(const p of g.players)p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:c.isCapital}]));return g;
}
function context(g,ratio=1){return {personality:()=>({aggression:1,naval:1,grudge:.5,forgiveness:.5,trust:.5,competitiveness:1,commitment:.5,victory:'any'}),score:E.score,finance:p=>E.militaryFinance(g,p),assess:()=>({ratio,ourPower:ratio*100,theirPower:100,distance:10,landTarget:true,seaTarget:false}),plan:()=>({goal:'science',rawGoal:'science',frontierThreat:0}),victory:o=>E.victoryProgress(g,o),yields:p=>E.empireYields(g,p)};}
async function check(name,fn){try{await fn();checks.push({name,passed:true});console.log('PASS '+name);}catch(error){checks.push({name,passed:false,error:error.message});console.log('FAIL '+name+': '+error.message);}}
await check('Personality remains deterministic, seed-sensitive and within documented jitter bounds',()=>{const g=field();for(const p of g.players){assert.deepEqual(AI.personality(g,p),AI.personality(g,p));assert.notDeepEqual(AI.personality(g,p),AI.personality({...g,seed:g.seed+'x'},p));assert(AI.jitter(g.seed,p.id,'risk')>=.92&&AI.jitter(g.seed,p.id,'risk')<=1.08);}});
await check('Prospective production increases war value without requiring an existing army',()=>{
 const g=field(),p=g.players[0],o=g.players[1],ctx=context(g);ctx.assess=()=>({ourPower:0,theirPower:100,ratio:0,distance:10,landTarget:true});
 const att={opinion:-60,threat:{value:1},assess:ctx.assess()};ctx.yields=()=>({production:0});const low=AI.warValue(g,p,o,att,ctx);ctx.yields=()=>({production:100});const high=AI.warValue(g,p,o,att,ctx);
 assert(high.value>low.value);assert(high.ratio>0);assert.equal(g.units.length,0);g.turn=30;assert(E.legalActions(g,p).some(a=>a.type==='war'&&a.player===o.id));evidence.push({case:'prospective',low,high});
});
await check('Real winning-side white-peace assessment stays rejected despite peace intent',()=>{
 const g=field(),p=g.players[0],o=g.players[1];p.visible=g.map.tiles.map(t=>t.id);for(let i=0;i<8;i++)E.addUnit(g,p.id,'tank',g.cities[0].tile+i+1);E.addUnit(g,o.id,'warrior',g.cities[1].tile+1);W.beginWar(g,o,p,E.event);g.turn+=10;
 const offer={from:o.id,to:p.id,kind:'peace',terms:P.normalizeTerms({mode:'white'})},assessment=P.peaceAssessment(g,p,offer);p.attitudes={[o.id]:{intent:'peace',minWar:6}};assert(!assessment.accept);assert.equal(AI.proposalAcceptance(g,p,offer,assessment),false);evidence.push({case:'white-peace',assessment});
});
await check('Unpayable real settlement is rejected even with a positive discretionary score',()=>{
 const g=field(),p=g.players[0],o=g.players[1];W.beginWar(g,o,p,E.event);o.gold=0;const offer={from:o.id,to:p.id,kind:'peace',terms:P.normalizeTerms({mode:'concession',gold:100})},assessment=P.peaceAssessment(g,p,offer);assert.equal(assessment.payable,false);p.attitudes={[o.id]:{intent:'peace'}};assert.equal(AI.proposalAcceptance(g,p,offer,{...assessment,score:1000}),false);
});
await check('Indebted joint-war recipient rejects real offer despite friendship and dislike',()=>{
 const g=field(),p=g.players[0],o=g.players[1],enemy=g.players[2];W.beginWar(g,o,enemy,E.event);p.militaryArrears=100;for(let i=0;i<5;i++)E.addUnit(g,p.id,'tank',g.cities[0].tile+i+1);p.attitudes={[o.id]:{opinion:100},[enemy.id]:{opinion:-100}};
 const offer={from:o.id,to:p.id,kind:'jointWar',enemy:enemy.id,warId:P.envoyBudget(g,o.id,enemy.id).warId,terms:P.normalizeTerms({mode:'concession',gold:20})};const assessment=W.jointWarAssessment(g,p,offer,{projectedUpkeep:100,grossGold:10});assert(!assessment.accept);assert.equal(AI.proposalAcceptance(g,p,offer,assessment),false);assert.equal(AI.proposalAcceptance(g,p,offer,{score:100}),false);evidence.push({case:'arrears',assessment});
});
await check('Both player orderings learn same-period declarations next period exactly once',()=>{
 const g=field();g.turn=30;for(const p of g.players){p.manual=false;for(const id of p.met)p.relations[id].grievances=200;}AI.attitudeTurn(g,context(g));courtTurn(g,E.event);const a=g.players[0].attitudes[1],b=g.players[1].attitudes[0];assert.equal(a.mem.denouncedBy,0);assert.equal(b.mem.denouncedBy,0);
 g.turn++;AI.attitudeTurn(g,context(g));assert.equal(a.mem.denouncedBy,25);assert.equal(b.mem.denouncedBy,25);g.turn++;AI.attitudeTurn(g,context(g));assert.equal(a.mem.denouncedBy,b.mem.denouncedBy);assert(a.mem.denouncedBy<25);
 const restored=E.restore(E.serialize(g));g.turn++;restored.turn++;AI.attitudeTurn(g,context(g));AI.attitudeTurn(restored,context(restored));assert.equal(restored.players[0].attitudes[1].mem.denouncedBy,g.players[0].attitudes[1].mem.denouncedBy);
});
await check('Stable friendship identities are consumed once and decay on later periods',()=>{
 const g=field(),p=g.players[0],o=g.players[1];o.attitudes={[p.id]:{friendSeq:1,streak:{war:0,peace:0},intent:'none'}};AI.attitudeTurn(g,context(g));assert.equal(p.attitudes[o.id].mem.friendBy,20);g.turn++;AI.attitudeTurn(g,context(g));assert(p.attitudes[o.id].mem.friendBy<20);
});
await check('Rejected-proposal memory decays after consuming the full retained 64-offer ledger',()=>{
 const g=field(),p=g.players[0],o=g.players[1];g.diplomacy.proposals=Array.from({length:64},(_,i)=>({id:i+1,from:p.id,to:o.id,status:'rejected',kind:'alliance'}));AI.attitudeTurn(g,context(g));const initial=p.attitudes[o.id].mem.denied;g.turn++;AI.attitudeTurn(g,context(g));const next=p.attitudes[o.id].mem.denied;evidence.push({case:'proposal-memory',initial,next,retained:g.diplomacy.proposals.length,seen:p.attitudes[o.id].seen.proposals.length});assert(next<initial,'Already consumed rejected offers must not be counted again');
});
await check('Own-city conversion causes a diplomatic missionary grievance and public religion threat',()=>{
 const g=field(),p=g.players[0],o=g.players[1];[p.religion,o.religion]=Object.keys(RELIGIONS).slice(0,2);for(const c of g.cities)c.religion=o.id;const ctx=context(g),att=AI.computeAttitude(g,p,o,ctx);assert(att.mods.some(m=>m.key==='missionary'&&m.value<0));assert(AI.victoryThreat(g,p,o,ctx).parts.religion>0);assert.deepEqual(E.observation(g,p).opponents.find(x=>x.id===o.id).victory,E.snapshot(g,p.id).players[o.id].victory);
});
await check('Unacquired hidden government never changes diplomatic opinion',()=>{
 const g=field(),p=g.players[0],o=g.players[1],ctx=context(g);p.visible=[];AI.acquireIntel(g);assert.equal(AI.knownGovernment(g,p,o.id),null);const before=AI.computeAttitude(g,p,o,ctx).opinion;o.government='republic';AI.acquireIntel(g);assert.equal(AI.computeAttitude(g,p,o,ctx).opinion,before);
});
await check('Human and AI acquire equal government records; hidden changes retain the learned value and age',()=>{
 const g=field(),p=g.players[0],o=g.players[1];p.visible=[g.cities[1].tile];p.manual=true;AI.acquireIntel(g);const first=AI.knownGovernment(g,p,o.id);p.manual=false;AI.acquireIntel(g);assert.deepEqual(AI.knownGovernment(g,p,o.id),first);p.visible=[];o.government='republic';g.turn+=5;AI.acquireIntel(g);const known=AI.knownGovernment(g,p,o.id);assert.equal(known.value,first.value);assert.equal(known.age,5);const snap=E.snapshot(g,p.id);assert.deepEqual(snap.players[p.id].intel[o.id].government,known);assert(!Object.hasOwn(snap.players[o.id],'intel'));const restored=E.restore(E.serialize(g));assert.deepEqual(AI.knownGovernment(restored,restored.players[p.id],o.id),known);
});
await check('Stale government knowledge reduces its modifier without reading a hidden update',()=>{
 const g=field(),p=g.players[0],o=g.players[1];p.visible=[g.cities[1].tile];AI.acquireIntel(g);p.visible=[];const fresh=AI.computeAttitude(g,p,o,context(g)).mods.find(m=>m.key==='government');g.turn+=21;o.government='republic';const stale=AI.computeAttitude(g,p,o,context(g)).mods.find(m=>m.key==='government');assert.equal(stale.value,fresh.value/2);
});
await check('A negative commitment period resets declaration streak; only three subsequent positives declare',()=>{
 const g=field(),p=g.players[0],o=g.players[1],rec={streak:{war:0,peace:0},intent:'none',threatValue:0};const intents=[];for(const value of [10,10,-1,10,10,10]){rec.warValue=value;AI.updateIntent(g,p,o,rec,context(g));intents.push(rec.intent);}assert.notEqual(intents[4],'declare');assert.equal(intents[5],'declare');
});
await check('Local weakness alone cannot trigger early peace; peace needs sustained recovery before resuming fight',()=>{
 const g=field(),p=g.players[0],o=g.players[1];W.beginWar(g,o,p,E.event);const rec={streak:{war:0,peace:0},intent:'fight',warValue:-30,national:1,mods:[]};g.turn+=2;AI.updateIntent(g,p,o,rec,context(g,.01));assert.equal(rec.intent,'fight');g.turn+=8;AI.updateIntent(g,p,o,rec,context(g,.01));assert.equal(rec.intent,'peace');rec.warValue=10;AI.updateIntent(g,p,o,rec,context(g));assert.equal(rec.intent,'peace');rec.warValue=30;AI.updateIntent(g,p,o,rec,context(g));assert.equal(rec.intent,'peace');AI.updateIntent(g,p,o,rec,context(g));assert.equal(rec.intent,'fight');
});
await check('Operations cap membership, stay disjoint from reserves and dissolve on peace',()=>{
 const g=field(),p=g.players[0];for(const o of g.players.slice(1))W.beginWar(g,p,o,E.event);for(let i=0;i<40;i++)E.addUnit(g,p.id,'warrior',g.cities[0].tile+i+1);const army=g.units.filter(u=>u.owner===p.id),reserve=AI.homeReserve(g,p,army);AI.updateOperations(g,p,context(g));assert(p.aiState.ops.length<=2);const members=p.aiState.ops.flatMap(o=>o.members);assert.equal(new Set(members).size,members.length);assert(p.aiState.ops.every(o=>o.members.length<=12));assert(members.every(id=>!reserve.has(id)));for(const r of Object.values(p.relations))r.status='peace';AI.updateOperations(g,p,context(g));assert.equal(p.aiState.ops.length,0);
});
await check('Pure medical support cannot substitute for the only real city defender in the reserve',()=>{
 const g=field(),p=g.players[0],city=g.cities[0],o=g.players[1];W.beginWar(g,p,o,E.event);const medical=Object.keys(UNITS).find(t=>UNITS[t].medical);assert(medical);const support=E.addUnit(g,p.id,medical,city.tile),guard=E.addUnit(g,p.id,'warrior',city.tile+1);for(let i=0;i<8;i++)E.addUnit(g,p.id,'warrior',city.tile+10+i);const army=g.units.filter(u=>!UNITS[u.type].civilian),reserve=AI.homeReserve(g,p,army);AI.updateOperations(g,p,context(g));evidence.push({case:'support-as-city-guard',medical,support:support.id,guard:guard.id,reserve:[...reserve]});assert(reserve.has(guard.id),'A medical support unit cannot satisfy the per-city fighting guard');assert(!p.aiState.ops.some(op=>op.members.includes(support.id)));
});
await check('Reserve excludes embarked units from satisfying a home-city guard',()=>{
 const g=field(),p=g.players[0],city=g.cities[0];p.techs.push('cartography');const ship=E.addUnit(g,p.id,'warrior',city.tile+1);g.map.tiles[ship.tile].terrain='coast';ship.embarked=true;for(let i=0;i<8;i++)E.addUnit(g,p.id,'warrior',city.tile+g.map.width*6+i);const guard=E.addUnit(g,p.id,'warrior',city.tile+2);const reserve=AI.homeReserve(g,p,g.units);evidence.push({case:'embarked-as-city-guard',embarked:ship.id,guard:guard.id,reserve:[...reserve]});assert(reserve.has(guard.id),'An embarked unit cannot satisfy the per-city fighting guard');
});
await check('Real native drivers do not send reserved troops beyond home coverage on generic siege routes',async()=>{
 const g=field(),p=g.players[0],o=g.players[1],city=g.cities[0];g.turn=40;p.gold=10000;W.beginWar(g,p,o,E.event);
 for(const t of g.map.tiles.filter(t=>dist(t,g.map.tiles[city.tile],g.map)>0&&dist(t,g.map.tiles[city.tile],g.map)<=4).slice(0,30))E.addUnit(g,p.id,'warrior',t.id);
 p.explored=g.map.tiles.map(t=>t.id);p.visible=[...p.explored];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));AI.updateOperations(g,p,context(g));p.manual=false;
 const reserve=AI.homeReserve(g,p,g.units),results=[];
 const drivers=(await listDrivers()).filter(d=>CIVS.some(c=>c.file===d.file));assert.equal(drivers.length,8);assert(drivers.every(d=>d.status==='ready'));
 for(const driver of drivers){p.driver={...p.driver,file:driver.file};const obs=E.observation(g,p),native=await executeDriver(p,obs);const outgoing=native.orders.filter(a=>a.type==='move'&&reserve.has(a.unit)&&dist(g.map.tiles[a.tile],g.map.tiles[city.tile],g.map)>4).filter(a=>{const h=obs.legalActions.find(x=>x.type===a.type&&x.unit===a.unit&&x.tile===a.tile)?.hint;return h?.siegeProgress>0&&!h.defenseDuty&&!h.homeDefenseProgress&&!h.danger;});results.push({driver:driver.file,outgoing});}
 evidence.push({case:'native-reserve-routing',army:g.units.length,reserve:[...reserve],drivers:results});assert(results.every(r=>!r.outgoing.length),'Reserve membership currently does not constrain ordinary native siege movement');
});
const files=['src/ai.mjs','src/engine.mjs','src/strategy.mjs','src/peace-terms.mjs','src/warfare.mjs','sdk/civ.hpp'];const sources=Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
await writeFile(new URL('../'+(process.env.AI_CHECK_OUTPUT||'output/unified-ai-20261021')+'/strategy-checks.json',import.meta.url),JSON.stringify({completed:true,passed:checks.every(c=>c.passed),checks,evidence,sources,liveSaveWritten:false,formalRuntimeIntegrated:true},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed)}));process.exitCode=checks.some(c=>!c.passed)?1:0;
