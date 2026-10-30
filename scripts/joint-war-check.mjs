import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as W from '../src/warfare.mjs';
import * as P from '../src/peace-terms.mjs';
import * as R from '../src/rules.mjs';
import {neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {see} from './air-warfare-check.mjs';

const checks=[],metrics={drivers:[]},pass=s=>{checks.push(s);console.log('PASS '+s);};
const hash=s=>createHash('sha256').update(s).digest('hex');
function exactSave(g){
 E.refreshVisibility(g);const bytes=E.serialize(g),resumed=E.serialize(E.restore(bytes));
 function difference(a,b,path='root'){if(JSON.stringify(a)===JSON.stringify(b))return null;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const d=difference(a[key],b[key],path+'.'+key);if(d)return d;}}return {path,before:a,after:b};}
 assert.equal(hash(resumed),hash(bytes),'Current authoritative save must restore exactly: '+JSON.stringify(difference(JSON.parse(bytes),JSON.parse(resumed))));return bytes;
}
const inspection=JSON.parse(await readFile(new URL('../output/air-warfare-inspection.json',import.meta.url))),input=new URL('../'+inspection.file,import.meta.url),before=await readFile(input);
function field(){
 const g=E.createGame({seed:'JOINT-WAR-ENVOY',players:4,size:'small',barbarians:false});
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,riverEdges:[],cityId:null,owner:null,district:null,improvement:null,camp:false,ruin:false});
 g.units=[];const positions=[[8,8],[20,8],[12,18],[30,22]];
 for(const p of g.players){Object.assign(p,{manual:true,gold:1000,met:g.players.filter(q=>q!==p).map(q=>q.id),techs:Object.keys(R.TECHS),civics:['civilservice'],strategy:'adaptive'});const [x,y]=positions[p.id];E.foundCity(g,p,E.addUnit(g,p.id,'settler',y*g.map.width+x));}
 g.units=[];const [p,enemy,helper,third]=g.players,home=g.cities[0],host=g.cities[2];
 E.addUnit(g,p.id,'warrior',home.tile);
 for(let i=0;i<6;i++){E.addUnit(g,enemy.id,'warrior',g.cities[1].tile+i+1);E.addUnit(g,helper.id,'warrior',host.tile+g.map.width*2+i-2);}
 const sim=new RealtimeSimulation(g);clock(g,100);W.beginWar(g,p,enemy,E.event);see(g);return {g,sim,p,enemy,helper,third,home,host};
}
function clock(g,t){g.realtime.time=t;g.realtime.nextEconomy=(Math.floor(t/20)+1)*20;g.turn=Math.floor(t/20)+1;}
function send(f,terms={mode:'concession',gold:200}){E.applyAction(f.g,f.p,{type:'sendEnvoy',player:f.helper.id,enemy:f.enemy.id,terms});return f.g.units.find(u=>u.type==='envoy');}
function arrive(f,u){u.tile=f.host.tile;W.envoyArrival(f.g,u,E.event);E.refreshVisibility(f.g);return f.g.diplomacy.proposals.find(o=>o.id===u.envoy.proposal);}
function supply(f,key,amount=1){const cells=f.g.map.tiles.filter(t=>t.owner===f.p.id&&t.cityId==null);for(let i=0;i<amount;i++)Object.assign(cells[i],{resource:key,improvement:R.RESOURCES[key].improvement,pillaged:false});see(f.g);return cells[0];}

{
 const f=field();try{const u=send(f);assert.equal(f.p.gold,990);assert.equal(u.envoy.purpose,'jointWar');assert.equal(u.envoy.target,2);assert.equal(u.envoy.enemy,1);assert.equal(P.envoyBudget(f.g,0,1).used,1);assert.equal(P.envoyBudget(f.g,1,0).remaining,2);assert.equal(P.envoyBudget(f.g,0,2).warId,null);assert(W.canEnterTerritory(f.g,u,f.g.map.tiles[f.host.tile]));assert.equal(f.helper.relations[1].status,'peace');assert.equal(f.g.diplomacy.proposals.length,0);const offer=arrive(f,u);assert.equal(offer.kind,'jointWar');assert.equal(offer.enemy,1);assert.equal(f.p.gold,990);assert.equal(u.envoy.protected,false);assert.equal(f.helper.relations[1].status,'peace');W.answerProposal(f.g,f.helper,offer.id,true,E.event);assert.equal(f.p.gold,790);assert.equal(f.helper.gold,1200);assert.equal(f.helper.relations[1].status,'war');assert.equal(f.enemy.relations[2].status,'war');assert.equal(f.p.relations[2].status,'peace');assert.equal(f.p.relations[1].status,'war');assert(!f.g.units.some(x=>x.id===u.id));assert.equal(offer.status,'accepted');exactSave(f.g);pass('A real aid envoy carries sealed terms to a third-party capital, spends the original shared war budget and settles compensation with bilateral war only on acceptance');}finally{f.sim.dispose();}
}
{
 const f=field();try{let u=send(f);E.applyAction(f.g,f.p,{type:'recallEnvoy',unit:u.id});assert.equal(f.p.gold,990);assert.throws(()=>W.sendEnvoy(f.g,f.enemy,0,E.addUnit,E.event));clock(f.g,300);u=W.sendEnvoy(f.g,f.enemy,0,E.addUnit,E.event);E.applyAction(f.g,f.enemy,{type:'recallEnvoy',unit:u.id});clock(f.g,500);u=send(f);W.answerProposal(f.g,f.helper,arrive(f,u).id,false,E.event);clock(f.g,700);assert.equal(P.envoyBudget(f.g,0,1).remaining,0);assert.equal(P.envoyBudget(f.g,1,0).used,3);assert.throws(()=>send(f));assert.equal(f.helper.gold,1000);assert.equal(f.helper.relations[1].status,'peace');pass('Seeking aid and negotiating peace share three launches and exact cooldown in both directions; recall and rejection never refund launches or pay the quoted price');}finally{f.sim.dispose();}
}
{
 for(const key of ['iron','wheat','silk']){const f=field();try{supply(f,key,2);const cell=f.g.map.tiles.find(t=>t.owner===f.p.id&&t.resource===key);const colony=E.foundCity(f.g,f.p,E.addUnit(f.g,0,'settler',26*f.g.map.width+8));see(f.g);const offer=arrive(f,send(f,{mode:'concession',gold:50,resource:key,resourceAmount:1,tradeShare:10,durationTurns:10,cities:[colony.id]}));W.answerProposal(f.g,f.helper,offer.id,true,E.event);assert.equal(colony.owner,2);assert.equal(f.g.map.tiles[colony.tile].owner,2);assert.equal(P.effectiveSupplies(f.g)[2][key],1);assert.equal(P.effectiveSupplies(f.g)[0][key],1);assert.equal(f.g.diplomacy.pacts[0].kind,'jointWar');assert.equal(f.g.diplomacy.pacts[0].enemy,1);cell.pillaged=true;assert.equal(P.effectiveSupplies(f.g)[2][key],1);const other=f.g.map.tiles.find(t=>t.owner===0&&t.resource===key&&!t.pillaged);other.pillaged=true;assert.equal(P.effectiveSupplies(f.g)[2][key],undefined);cell.pillaged=false;assert.equal(P.effectiveSupplies(f.g)[2][key],1);clock(f.g,300);W.diplomacyTurn(f.g,E.event);assert.equal(f.g.diplomacy.pacts[0].status,'ended');assert.equal(P.effectiveSupplies(f.g)[2][key],undefined);assert.equal(P.effectiveSupplies(f.g)[0][key],1);}finally{f.sim.dispose();}}
 pass('Strategic, bonus and luxury supplies, gold, trade shares and noncapital territory use actual existing settlement rules and limited obligations expire');
}
{
 const f=field();try{supply(f,'iron');const offer=arrive(f,send(f,{mode:'concession',resource:'iron',resourceAmount:1,tradeShare:10}));W.answerProposal(f.g,f.helper,offer.id,true,E.event);clock(f.g,300);const peace=W.propose(f.g,f.helper,1,'peace',E.event);W.answerProposal(f.g,f.enemy,peace.id,true,E.event);assert.equal(P.effectiveSupplies(f.g)[2].iron,undefined);assert.equal(P.effectiveSupplies(f.g)[0].iron,1);assert.equal(f.p.relations[1].status,'war');assert(W.truceRemaining(f.g,2,1)>0);pass('A helper leaving the common war stops ongoing aid compensation immediately and receives normal peace protection');}finally{f.sim.dispose();}
}
{
 const f=field();try{const soldiers=f.g.units.filter(u=>u.owner===2),entry=f.g.map.tiles[f.home.tile+1];assert(!W.canEnterTerritory(f.g,soldiers[0],entry));const offer=arrive(f,send(f));W.answerProposal(f.g,f.helper,offer.id,true,E.event);assert(P.jointWarPassage(f.g,0,2));assert(W.canEnterTerritory(f.g,soldiers[0],entry));assert.equal(!!f.p.relations[2].openBorders,false);soldiers[0].tile=entry.id;clock(f.g,500);P.expirePacts(f.g);assert(!P.jointWarPassage(f.g,0,2));assert.equal(soldiers[0].borderExitOwner,0);assert(!W.canEnterTerritory(f.g,soldiers[1],entry));assert(W.canEnterTerritory(f.g,soldiers[0],f.g.map.tiles[f.home.tile]));pass('A signed joint-war contract grants temporary shared-border passage, ends exactly and permits stranded troops to withdraw without a permanent alliance');}finally{f.sim.dispose();}
}
{
 for(const change of [f=>{f.p.gold=0;},f=>{f.helper.relations[1].truceUntil=500;},f=>{f.helper.relations[1].status=f.enemy.relations[2].status='alliance';},f=>{f.g.map.tiles.find(t=>t.resource==='iron').pillaged=true;},f=>{f.host.owner=3;}]){const f=field();try{supply(f,'iron');const offer=arrive(f,send(f,{mode:'concession',gold:50,resource:'iron',resourceAmount:1}));change(f);const bytes=E.serialize(f.g);assert.throws(()=>W.answerProposal(f.g,f.helper,offer.id,true,E.event));assert.equal(E.serialize(f.g),bytes);assert.equal(f.helper.relations[1].status==='war',false);assert.equal(offer.status,'pending');}finally{f.sim.dispose();}}
 const f=field();try{for(const terms of [{mode:'demand',gold:100},{mode:'white'},{mode:'concession',cities:[f.home.id]},{mode:'concession',resource:'uranium',resourceAmount:1}]){const bytes=E.serialize(f.g);assert.throws(()=>send(f,terms));assert.equal(E.serialize(f.g),bytes);}assert.throws(()=>W.propose(f.g,f.p,2,'jointWar',E.event,{enemy:1}));pass('Unpayable, pillaged, capital, demand, alliance and truce cases fail before any payment or war; direct proposals cannot bypass the physical envoy');}finally{f.sim.dispose();}
}
{
 const f=field();try{const u=send(f);clock(f.g,300);const peace=W.propose(f.g,f.p,1,'peace',E.event);W.answerProposal(f.g,f.enemy,peace.id,true,E.event);W.diplomacyTurn(f.g,E.event);assert(!f.g.units.some(x=>x.id===u.id));assert.equal(f.p.gold,990);assert.equal(f.helper.gold,1000);assert.equal(f.helper.relations[1].status,'peace');pass('Ending the original war cancels its travelling aid mission without later charging compensation or launching a phantom war');}finally{f.sim.dispose();}
}
{
 const f=field();try{const u=send(f);let bytes=exactSave(f.g);const offer=arrive(f,u);bytes=exactSave(f.g);for(const mutate of [s=>{s.units.find(v=>v.id===u.id).envoy.enemy=0;},s=>{s.diplomacy.proposals[0].enemy=2;},s=>{s.units.find(v=>v.id===u.id).envoy.purpose='invalid';}]){const copy=JSON.parse(bytes);mutate(copy);assert.throws(()=>E.restore(JSON.stringify(copy)));}const third=E.snapshot(f.g,3);assert(!third.diplomacy.proposals.some(o=>o.id===offer.id));assert.equal(third.units.find(v=>v.id===u.id)?.envoy.terms,undefined);assert(!third.diplomacy.negotiators.some(o=>o.player===0));pass('Travelling and arrived aid missions save exactly, forged identities fail validation and third-party observations conceal terms and budgets');}finally{f.sim.dispose();}
}
{
 const f=field();try{const free={from:0,to:2,kind:'jointWar',enemy:1,warId:P.envoyBudget(f.g,0,1).warId,terms:P.normalizeTerms({mode:'concession'})},paid={...free,terms:P.normalizeTerms({mode:'concession',gold:400})};const a=W.jointWarAssessment(f.g,f.helper,free,E.militaryFinance(f.g,f.helper)),b=W.jointWarAssessment(f.g,f.helper,paid,E.militaryFinance(f.g,f.helper));assert(b.score>a.score);assert(b.accept);f.helper.militaryArrears=1;assert(!W.jointWarAssessment(f.g,f.helper,paid).accept);f.helper.militaryArrears=0;f.g.units.filter(u=>u.owner===2).forEach(u=>{u.hp=40;});assert(!W.jointWarAssessment(f.g,f.helper,paid).accept);metrics.assessments={free:a,paid:b};pass('The authoritative recipient weighs compensation and visible coalition strength, while arrears and unready armies reject even a high offer');}finally{f.sim.dispose();}
}
{
 const f=field();try{f.helper.visible=[];const offer={from:0,to:2,kind:'jointWar',enemy:1,warId:P.envoyBudget(f.g,0,1).warId,terms:P.normalizeTerms({mode:'concession',gold:200})};const beforeAssessment=W.jointWarAssessment(f.g,f.helper,offer,E.militaryFinance(f.g,f.helper));for(let i=0;i<40;i++){E.addUnit(f.g,0,'tank',f.home.tile);E.addUnit(f.g,1,'modernarmor',f.g.cities[1].tile);}assert.deepEqual(W.jointWarAssessment(f.g,f.helper,offer,E.militaryFinance(f.g,f.helper)),beforeAssessment);pass('Unseen requesting and opposing armies cannot change the recipient assessment or leak their live strength');}finally{f.sim.dispose();}
}
{
 const f=field();try{const offer=arrive(f,send(f,{mode:'concession',gold:400}));f.helper.manual=false;f.helper.militaryArrears=1;W.diplomacyTurn(f.g,E.event,{finance:p=>E.militaryFinance(f.g,p)});assert.equal(offer.status,'rejected');assert.equal(f.p.gold,990);assert.equal(f.helper.gold,1000);assert.equal(f.helper.relations[1].status,'peace');assert(!f.g.units.some(u=>u.type==='envoy'));assert(offer.decisionReason);pass('An autonomous indebted recipient actually rejects, retires the mission and leaves quoted compensation and peace intact');}finally{f.sim.dispose();}
}
const pool=new NativeDriverPool();
try{
 for(const civ of R.CIVS){const f=field();try{f.p.driver.file=civ.file;f.p.manual=false;const obs=E.observation(f.g,f.p);obs.legalActions=obs.legalActions.filter(a=>['sendEnvoy','war','alliance'].includes(a.type));const out=await pool.execute(f.p,obs),request=out.orders.find(a=>a.type==='sendEnvoy'&&a.enemy===1&&a.player===2);assert(request,JSON.stringify({file:civ.file,orders:out.orders,actions:obs.legalActions}));assert.equal(E.applyOrders(f.g,f.p,[request]).rejected.length,0);f.helper.manual=false;const offer=arrive(f,f.g.units.find(u=>u.type==='envoy'));W.diplomacyTurn(f.g,E.event,{finance:p=>E.militaryFinance(f.g,p)});assert.equal(offer.status,'accepted');assert.equal(f.helper.relations[1].status,'war');const attacker=f.g.units.find(u=>u.owner===2);attacker.tile=neighbors(f.g.map,f.g.map.tiles[f.g.units.find(u=>u.owner===1).tile])[0].id;see(f.g);const target=E.attackTargets(f.g,f.helper,attacker)[0];assert(target);E.applyAction(f.g,f.helper,{type:'attack',unit:attacker.id,...target});metrics.drivers.push({file:civ.file,soughtAid:true,accepted:true,combat:true});}finally{f.sim.dispose();}}
 pass('All eight actual native strategies seek useful paid aid; the autonomous recipient accepts and its army can actually attack the common enemy');
 const f=field();try{f.p.manual=false;const u=send(f),start=u.tile;for(let i=0;i<80&&u.envoy.state==='travelling';i++){const obs=E.observation(f.g,f.p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&['move','fortify'].includes(a.type));const out=await pool.execute(f.p,obs);f.p.memory=out.memory;f.sim.enqueue(f.p,out.orders);f.sim.tick(3);}assert.notEqual(u.tile,start);assert.equal(u.tile,f.host.tile);assert.equal(u.envoy.state,'arrived');assert.equal(f.sim.stats.rejected,0);assert(f.g.diplomacy.proposals.some(o=>o.kind==='jointWar'));metrics.route={arrived:true,rejected:0};pass('An actual native envoy follows protected closed-border routes and timed movement to a third-party reception capital');}finally{f.sim.dispose();}
}finally{pool.dispose();}
assert((await readFile(input)).equals(before));
const sources=Object.fromEntries(await Promise.all(['src/engine.mjs','src/warfare.mjs','src/peace-terms.mjs','sdk/civ.hpp','web/app.js','web/peace-negotiation.js','web/diplomacy-panel.js'].map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
await writeFile(new URL('../output/joint-war-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,sources,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
