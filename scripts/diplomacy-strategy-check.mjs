import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as W from '../src/warfare.mjs';
import * as P from '../src/peace-terms.mjs';
import {rememberCityAppearance} from '../src/intelligence.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const checks=[],pool=new NativeDriverPool(),save=await readFile(new URL('../saves/autosave.json',import.meta.url));
const pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(){
 const g=E.createGame({players:3,size:'small',seed:'DIPLOMACY-STRATEGY',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 for(const p of g.players)Object.assign(p,{manual:true,gold:2000,techs:[],civics:[],met:g.players.filter(q=>q!==p).map(q=>q.id)});
 const [p,q,third]=g.players,home=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(10,12).id)),enemy=E.foundCity(g,q,E.addUnit(g,1,'settler',tile(16,12).id));
 E.foundCity(g,third,E.addUnit(g,2,'settler',tile(40,26).id));g.units=[];home.population=4;enemy.population=22;g.turn=1;
 const sim=new RealtimeSimulation(g);see(g);return {g,p,q,third,home,enemy,tile,sim};
}
function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:c.isCapital}]));for(const c of g.cities)rememberCityAppearance(g,p,c);}}
async function decide(g,p,civ){p.driver.file=civ.file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='war');const response=await pool.execute(p,obs);p.memory=response.memory;return response.orders;}
function army(g,p,tile,count=16){for(let i=0;i<count;i++)E.addUnit(g,p.id,'warrior',tile(9+i%5,15+Math.floor(i/5)).id);}
try{
 for(const civ of R.CIVS){const {g,p,q,third,home,tile,sim}=field();try{
  p.gold=5000;p.relations[q.id].grievances=35;army(g,p,tile);see(g);assert.equal((await decide(g,p,civ)).length,0);
  for(let i=0;i<5;i++)E.finishTurn(g,{actions:false});
  assert(home.loyalty<100);assert(p.relations[q.id].loyaltyPressure>0);assert(p.relations[q.id].loyaltyGrievances>0);assert.equal(p.relations[third.id].loyaltyPressure,0);
  const grievance=p.relations[q.id].grievances;E.snapshot(g,0);E.observation(g,p);assert.equal(p.relations[q.id].grievances,grievance);
  assert.equal((await decide(g,p,civ)).length,0,'One positive assessment must wait for the next economic period');E.finishTurn(g,{actions:false});
  const orders=await decide(g,p,civ);assert(orders.some(a=>a.player===q.id),civ.file+' reacts to sustained loyalty pressure when prepared: '+JSON.stringify(E.legalActions(g,p).filter(a=>a.type==='war')));
  E.applyAction(g,p,orders.find(a=>a.player===q.id));assert.equal(p.relations[q.id].status,'war');
 }finally{sim.dispose();}}
 pass('All eight actual drivers accumulate source-specific loyalty resentment only at settlement and can execute a prepared retaliatory war');
 {const {g,p,q,tile,sim}=field();try{army(g,p,tile);p.relations[q.id].loyaltyPressure=5;p.relations[q.id].grievances=100;g.units=[];assert.equal((await decide(g,p,R.CIVS[1])).length,0);p.relations[q.id].truceUntil=100;assert(!E.legalActions(g,p).some(a=>a.type==='war'&&a.player===q.id));assert.throws(()=>W.beginWar(g,p,q,E.event),/停战/);}finally{sim.dispose();}}
 pass('Resentment alone cannot overcome a missing army or an active truce');
 for(const civ of R.CIVS){const {g,p,q,tile,sim}=field();try{
  p.techs=Object.entries(R.TECHS).filter(([,s])=>s.era<=3).map(([k])=>k);q.techs=[];assert.equal((await decide(g,p,civ)).length,0);army(g,p,tile,20);E.finishTurn(g,{actions:false});see(g);
  assert.equal((await decide(g,p,civ)).length,0,'Prepared colonial war also requires consecutive periods');E.finishTurn(g,{actions:false});
  const orders=await decide(g,p,civ),war=orders.find(a=>a.player===q.id);assert.equal(war?.warKind,'colonial',civ.file+' selects the three-tech-era casus belli after consecutive positive assessments');E.applyAction(g,p,war);assert.equal(p.relations[q.id].warKind,'colonial');
 }finally{sim.dispose();}}
 pass('All eight actual drivers execute three-tech-era colonial wars after consecutive positive assessments and authoritative classification');
 {const {g,p,q,sim}=field();try{
  p.techs=Object.entries(R.TECHS).filter(([,s])=>s.era<=2).map(([k])=>k);p.civics=Object.keys(R.CIVICS);see(g);
  assert(!E.legalActions(g,p).some(a=>a.type==='war'&&a.player===q.id));assert.throws(()=>W.beginWar(g,p,q,E.event,{kind:'colonial'}),/三个科技时代/);
  p.techs.push(Object.keys(R.TECHS).find(k=>R.TECHS[k].era===3));p.relations[q.id].status=q.relations[p.id].status='alliance';assert(!E.legalActions(g,p).some(a=>a.type==='war'&&a.player===q.id));assert.throws(()=>W.beginWar(g,p,q,E.event,{kind:'colonial'}));
 }finally{sim.dispose();}}
 pass('Two technology eras and a high civic era cannot forge colonial eligibility; alliances retain war protection');
 {const {g,p,q,home,enemy,tile,sim}=field();try{
  home.population=20;enemy.population=3;army(g,p,tile,20);E.addUnit(g,1,'warrior',tile(15,12).id);see(g);W.beginWar(g,p,q,E.event);g.realtime.time=200;
  const white={from:q.id,to:p.id,kind:'peace',terms:P.normalizeTerms()};
  const small={...white,terms:P.normalizeTerms({mode:'concession',gold:20})},large={...white,terms:P.normalizeTerms({mode:'concession',gold:1900})};
  assert(!P.peaceAssessment(g,p,white).accept);assert(!P.peaceAssessment(g,p,small).accept);assert(P.peaceAssessment(g,p,large).accept);
  const weakScore=P.peaceAssessment(g,p,small).score;enemy.population=100;assert(P.peaceAssessment(g,p,small).score>weakScore);enemy.population=3;assert(!P.peaceAssessment(g,p,{...large,terms:P.normalizeTerms({mode:'concession',gold:5000})}).accept);
  p.warWeariness=65;for(const u of g.units.filter(u=>u.owner===p.id))u.hp=30;assert(P.peaceAssessment(g,p,white).accept);p.warWeariness=0;for(const u of g.units.filter(u=>u.owner===p.id))u.hp=100;
  const hiddenTiles=Array.from({length:20},(_,i)=>tile(40+i%5,22+Math.floor(i/5)).id);p.visible=p.visible.filter(id=>!hiddenTiles.includes(id));
  const original=P.peaceAssessment(g,p,small);for(const id of hiddenTiles)E.addUnit(g,1,'tank',id);assert.deepEqual(P.peaceAssessment(g,p,small),original);
  p.manual=false;const bare=W.propose(g,q,p.id,'peace',E.event);W.diplomacyTurn(g,E.event);assert.equal(bare.status,'rejected');assert(bare.decisionReason);
  p.manual=true;const offer=W.propose(g,q,p.id,'peace',E.event);offer.terms=large.terms;const gold=p.gold;W.answerProposal(g,p,offer.id,true,E.event);assert.equal(p.gold,gold+1900);assert.equal(q.gold,100);assert.equal(p.relations[q.id].status,'peace');
 }finally{sim.dispose();}}
 pass('A strong recipient rejects weak white/small offers, accepts sufficient payable compensation and settles real gold; hidden armies never change its assessment');
 assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(save));
 await writeFile(new URL('../output/diplomacy-strategy-checks.json',import.meta.url),JSON.stringify({passed:true,checks,activeSaveWritten:false,gameLaunched:false,saveSha256:createHash('sha256').update(save).digest('hex')},null,2)+'\n');
}finally{pool.dispose();}
