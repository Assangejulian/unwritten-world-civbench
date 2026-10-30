import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {replacementFor} from '../src/unique-content.mjs';
import * as W from '../src/warfare.mjs';
import * as P from '../src/peace-terms.mjs';
import {beginWar} from '../src/warfare.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const pool=new NativeDriverPool(),checks=[],metrics={defense:[],quotes:[]},pass=s=>{checks.push(s);console.log('PASS '+s);};
function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:!!c.isCapital}]));}}
function field(){
 const g=E.createGame({players:3,size:'small',seed:'AIR-RECRUITMENT',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];for(const p of g.players)Object.assign(p,{manual:true,gold:10000,met:g.players.filter(o=>o!==p).map(o=>o.id),techs:Object.keys(R.TECHS),civics:['empire','training','civilservice'],strategy:'science',spaceStage:1});
 const p=g.players[0],q=g.players[1],cities=[10,26,42].map(x=>E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,12).id)));
 for(const [i,c]of cities.entries()){c.population=8;for(const [j,item]of ['airport','spaceport'].entries()){const t=tile(11+i*16,12+j);t.owner=0;t.territoryCity=c.id;t.district={item,city:c.id,kind:'district'};c.districts.push({item,tile:t.id});c.buildings.push(item);}c.buildings.push('campus');}
 const enemy=E.foundCity(g,q,E.addUnit(g,1,'settler',tile(17,12).id));enemy.population=8;enemy.buildings=['walls','medievalwalls','renaissancewalls','steelwalls'];enemy.walls=450;E.foundCity(g,g.players[2],E.addUnit(g,2,'settler',tile(50,30).id));g.units=[];g.turn=120;
 Object.assign(tile(9,12),{owner:0,resource:'oil',improvement:'well'});for(let i=0;i<18;i++)E.addUnit(g,0,'rocketartillery',tile(8+i,30).id);
 const sim=new RealtimeSimulation(g);beginWar(g,p,q,E.event);see(g);return {g,p,q,cities,enemy,tile,sim};
}
const hash=s=>createHash('sha256').update(s).digest('hex');
const budget=f=>E.observation(f.g,f.p).player.committedGold;
function empty(){const f=field();f.g.units=[];see(f.g);return f;}
function send(f,terms={mode:'concession',gold:200},target=2){return W.sendEnvoy(f.g,f.p,target,E.addUnit,E.event,terms,target===2?1:undefined);}
function arrival(f,u){u.tile=f.g.cities.find(c=>c.id===u.envoy.capital).tile;W.envoyArrival(f.g,u,E.event);see(f.g);return f.g.diplomacy.proposals.find(o=>o.id===u.envoy.proposal);}
function recovered({invasion=true,multiple=false,scout=false,army=false}={}){
 const f=empty();f.p.gold=0;f.p.militaryArrears=7000;
 for(const [i,c]of f.cities.entries()){
  const t=f.tile(12+i*16,12);Object.assign(t,{owner:0,territoryCity:c.id,district:{item:'commercial',city:c.id,kind:'district'}});c.districts.push({item:'commercial',tile:t.id});c.buildings.push('commercial','market','bank','exchange');c.production=null;
 }
 if(army)for(let i=0;i<18;i++)E.addUnit(f.g,0,'rocketartillery',f.tile(8+i,30).id);
 if(invasion)for(const c of multiple?f.cities:[f.cities[0]]){
  const t=f.g.map.tiles[c.tile];for(const [dx,dy]of scout?[[0,3]]:[[-1,0],[-2,0],[-1,1],[-2,1],[0,2]])E.addUnit(f.g,1,scout?'scout':'modernarmor',f.tile(t.col+dx,t.row+dy).id);
 }
 see(f.g);return f;
}
async function response(f,file,transform=o=>o){f.p.driver.file=file;return (await pool.execute(f.p,transform(E.observation(f.g,f.p)))).orders;}
try{
 {const f=empty();try{const u=send(f);assert.equal(f.p.gold,9990);assert.equal(budget(f),200);const o=arrival(f,u);assert.equal(budget(f),200);E.refreshVisibility(f.g);const bytes=E.serialize(f.g),restored=E.restore(bytes);const after=E.serialize(restored);function diff(a,b,path='root'){if(JSON.stringify(a)===JSON.stringify(b))return null;if(a&&b&&typeof a==='object'&&typeof b==='object')for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const d=diff(a[k],b[k],path+'.'+k);if(d)return d;}return {path,before:a,after:b};}assert(hash(bytes)===hash(after),'Restore difference: '+JSON.stringify(diff(JSON.parse(bytes),JSON.parse(after))));assert.equal(E.observation(restored,restored.players[0]).player.committedGold,200);assert.equal(E.observation(f.g,f.g.players[2]).player.committedGold,0);W.answerProposal(f.g,f.g.players[2],o.id,true,E.event);assert.equal(budget(f),0);assert.equal(f.p.gold,9790);}finally{f.sim.dispose();}}
 pass('Travelling and arrived aid quotes reserve once, remain private, restore exactly and release on actual payment');
 for(const mode of ['concession','surrender','demand']){const f=empty();try{const u=send(f,{mode,gold:200,...(mode==='surrender'?{tradeShare:20,durationTurns:20}:{})},1);assert.equal(budget(f),mode==='demand'?0:200);E.applyAction(f.g,f.p,{type:'recallEnvoy',unit:u.id});assert.equal(budget(f),0);}finally{f.sim.dispose();}}
 pass('Voluntary peace/surrender payments reserve gold while outgoing demands do not, and real recall releases it');
 for(const outcome of ['reject','expire','cancel','warEnd','capitalLoss']){const f=empty();try{const u=send(f);if(outcome==='cancel')E.applyAction(f.g,f.p,{type:'recallEnvoy',unit:u.id});else if(outcome==='warEnd'){const w=f.g.diplomacy.wars.find(w=>w.id===u.envoy.warId);w.status='closed';for(const [a,b]of [[0,1],[1,0]])f.g.players[a].relations[b].status='peace';}else if(outcome==='capitalLoss')f.g.cities.find(c=>c.id===u.envoy.capital).owner=1;else{const o=arrival(f,u);if(outcome==='reject')W.answerProposal(f.g,f.g.players[2],o.id,false,E.event);else{f.g.realtime.time=o.expiresAt+1;f.g.realtime.nextEconomy=f.g.realtime.time+20;}}assert.equal(budget(f),0);}finally{f.sim.dispose();}}
 {const f=empty();try{const u=send(f,{mode:'concession',gold:200},1);W.propose(f.g,f.p,1,'peace',E.event);arrival(f,u);assert.equal(u.envoy.state,'arrived');assert(!u.envoy.proposal,'A legacy pending proposal must leave the arrived envoy available for a later diplomatic retry');assert.equal(budget(f),200);const legacy=f.g.diplomacy.proposals.find(o=>o.kind==='peace'&&!o.envoy);legacy.status='expired';W.diplomacyTurn(f.g,E.event);assert(f.g.diplomacy.proposals.some(o=>o.id===u.envoy.proposal&&o.envoy===u.id&&o.status==='pending'),'A real diplomacy retry must create the envoy proposal after the blocking legacy offer ends');assert.equal(budget(f),200,'Retry must reserve once, not double the carried quote');assert.equal(f.p.gold,9990,'Proposal retry does not charge another dispatch fee');E.applyAction(f.g,f.p,{type:'recallEnvoy',unit:u.id});assert.equal(budget(f),0);}finally{f.sim.dispose();}}
 pass('Rejected, expired, recalled and invalid campaign/capital quotes release their reservations');
 {const f=empty();try{W.sendEnvoy(f.g,f.g.players[1],0,E.addUnit,E.event,{mode:'demand',gold:5000});assert.equal(budget(f),0);f.g.realtime.time=201;f.g.realtime.nextEconomy=220;send(f);assert.equal(budget(f),200);}finally{f.sim.dispose();}}
 pass('An unaccepted foreign demand cannot freeze the recipient wallet or inflate an independent outgoing quote');
 {const f=empty();try{f.sim.enqueue(f.p,[{type:'sendEnvoy',player:2,enemy:1,terms:{mode:'concession',gold:200}}]);assert.equal(budget(f),210);f.sim.tick(.1);assert.equal(f.p.gold,9990);assert.equal(budget(f),200);}finally{f.sim.dispose();}}
 pass('A queued dispatch reserves quote and fee, then releases the fee exactly when dispatch actually charges it');
 for(const civ of R.CIVS){const f=empty();try{f.p.techs=['archery','machinery','currency','writing'];f.p.spaceStage=0;const u=E.addUnit(f.g,0,'archer',f.tile(11,12).id);f.sim.ready();see(f.g);send(f);const upgraded=replacementFor(f.p,'crossbow'),cost=E.unitUpgradeOptions(f.g,f.p,u).find(o=>o.item===upgraded).goldCost;f.p.gold=200+cost-1;const filter=o=>{o.legalActions=o.legalActions.filter(a=>a.type==='upgrade');return o;};const actual=await response(f,civ.file,filter);assert(!actual.some(a=>a.type==='upgrade'));const control=await response(f,civ.file,o=>{filter(o);o.player.committedGold=0;return o;});assert(control.some(a=>a.type==='upgrade'),'The same upgrade must be selected without a reserved quote: '+civ.file);f.sim.enqueue(f.p,[{type:'upgrade',unit:u.id,item:upgraded}]);assert.equal(budget(f),200+cost);metrics.quotes.push({driver:civ.file,reserved:200,cost,selectedActual:actual.length,selectedControl:control.length});}finally{f.sim.dispose();}}
 pass('All eight real drivers preserve envoy money across responses; queued refits add their independent commitment');
 for(const civ of R.CIVS){const f=recovered();try{const before=f.p.militaryArrears,obs=E.observation(f.g,f.p),orders=await response(f,civ.file),military=orders.filter(a=>a.type==='produce'&&R.UNITS[a.item]&&!R.UNITS[a.item].civilian);assert.equal(military.length,1,civ.file+' must recover one affordable homeland defender');const defender=military[0];assert.equal(defender.city,f.cities[0].id);assert(!R.UNITS[defender.item].siege);assert.equal(R.UNITS[defender.item].domain??'land','land');const bill=R.unitUpkeep(defender.item,f.p).total;assert(bill<=obs.player.finance.domesticGold-Math.max(5,obs.player.finance.domesticGold*.2));for(const a of orders)E.applyAction(f.g,f.p,a);const city=f.g.cities.find(c=>c.id===defender.city);city.production.progress=E.orderCost(f.g,city)-1;let previous=before;for(let i=0;i<5;i++){E.finishTurn(f.g,{actions:false});assert(f.p.militaryArrears<=previous);previous=f.p.militaryArrears;}assert(f.g.units.some(u=>u.owner===0&&u.type===defender.item));assert(previous<before);metrics.defense.push({driver:civ.file,item:defender.item,bill,income:obs.player.finance.domesticGold,debtBefore:before,debtAfter:previous});}finally{f.sim.dispose();}}
 pass('All eight strategies build and maintain an affordable defender after income recovery while old debt decreases');
 for(const mode of ['deficit','scout','peace','multiple'])for(const civ of R.CIVS){const f=recovered({army:mode==='deficit',scout:mode==='scout',invasion:mode!=='peace',multiple:mode==='multiple'});try{const obs=E.observation(f.g,f.p),orders=await response(f,civ.file),military=orders.filter(a=>a.type==='produce'&&R.UNITS[a.item]&&!R.UNITS[a.item].civilian);if(mode==='multiple'){assert(military.length>=1);const bill=military.reduce((n,a)=>n+R.unitUpkeep(a.item,f.p).total,obs.player.finance.projectedUpkeep);assert(bill<=obs.player.finance.domesticGold-Math.max(5,obs.player.finance.domesticGold*.2));}else assert.equal(military.length,0,mode+' must not bypass debt admission: '+civ.file);}finally{f.sim.dispose();}}
 pass('Deficits, a lone scout and absent invasion keep debt admission strict; simultaneous fronts share one funded budget');
 {const f=recovered();try{const helper=f.g.players[2],home=f.g.cities.find(c=>c.owner===helper.id);f.g.routes.push({id:f.g.nextId++,owner:helper.id,from:home.id,to:f.cities[0].id});f.g.diplomacy.pacts.push({id:f.g.diplomacy.nextId++,from:2,to:0,tradeShare:40,resource:null,resourceAmount:0,surrender:false,startsAt:0,endsAt:20,status:'active'});const finance=E.militaryFinance(f.g,f.p);assert(finance.grossGold>finance.domesticGold);const domestic=finance.domesticGold;f.g.realtime.time=21;f.g.realtime.nextEconomy=40;P.expirePacts(f.g);assert.equal(E.militaryFinance(f.g,f.p).domesticGold,domestic);assert.equal(E.militaryFinance(f.g,f.p).grossGold,domestic);}finally{f.sim.dispose();}}
 pass('Temporary incoming treaty money is excluded from defense funding before and after actual expiry');
 const sources=Object.fromEntries(await Promise.all(['src/engine.mjs','src/warfare.mjs','src/peace-terms.mjs','src/military-economy.mjs','src/rules.mjs','sdk/civ.hpp','scripts/review-ai-check.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
 await writeFile(new URL('../output/review-ai-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,sources,activeSaveWritten:false,gameLaunched:false},null,2));
}finally{pool.dispose();}
