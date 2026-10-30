import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {replacementFor} from '../src/unique-content.mjs';
import * as W from '../src/warfare.mjs';
import {citizenPressures,loyaltyStatus,domesticSituation,localRecruitment} from '../src/domestic.mjs';
import {defenseSituation} from '../src/campaign.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(){
 const g=E.createGame({players:2,size:'small',seed:'DOMESTIC-DEFENSE',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 for(const p of g.players){p.manual=true;p.gold=2000;p.met=[1-p.id];p.techs=Object.keys(R.TECHS);p.civics=['empire','training','civilservice'];}
 const p=g.players[0],q=g.players[1],home=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(10,12).id));home.population=8;
 for(const x of [17,24]){const c=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,12).id));c.population=6;}
 const enemy=E.foundCity(g,q,E.addUnit(g,1,'settler',tile(40,26).id));enemy.population=8;g.units=[];
 const sim=new RealtimeSimulation(g);see(g);return {g,p,q,home,enemy,tile,sim};
}
function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile}]));}}
function fort(g,c,t){Object.assign(t,{owner:c.owner,territoryCity:c.id,fort:{owner:c.owner,hp:160,style:g.players[c.owner].leaderKey}});return t;}
const pool=new NativeDriverPool();
async function decide(g,p,file,filter){p.driver.file=file;const obs=E.observation(g,p);if(filter)obs.legalActions=obs.legalActions.filter(filter);return (await pool.execute(p,obs)).orders;}
try{
 {
  const {g,p,q,home,tile,sim}=field(),f=fort(g,home,tile(11,12));
  p.techs=p.techs.filter(k=>!['ballistics','steel','rocketry','advballistics'].includes(k));const base=E.productionRate(g,home,{item:replacementFor(p,'crossbow')});E.applyAction(g,p,{type:'produce',city:home.id,item:replacementFor(p,'crossbow'),fortress:f.id});
  assert.equal(E.productionRate(g,home),base*1.25);W.beginWar(g,q,p,E.event);E.addUnit(g,1,'warrior',tile(9,12).id);see(g);assert.equal(E.productionRate(g,home),base*2);
  const saved=E.serialize(g),loaded=E.restore(saved);assert.equal(loaded.cities[0].production.fortress,f.id);
  assert.throws(()=>E.applyAction(g,p,{type:'produce',city:home.id,item:'settler',fortress:f.id}),/堡垒/);
  assert.throws(()=>E.applyAction(g,p,{type:'produce',city:g.cities[1].id,item:replacementFor(p,'crossbow'),fortress:f.id}),/堡垒/);
  const production=home.production;production.progress=E.orderCost(g,home)-1;E.finishTurn(g,{actions:false});assert(g.units.some(u=>u.owner===0&&u.type===replacementFor(p,'crossbow')&&u.tile===f.id));assert.equal(home.production,null);
  p.techs=p.techs.filter(k=>!['ballistics','steel','rocketry','advballistics'].includes(k));E.applyAction(g,p,{type:'produce',city:home.id,item:replacementFor(p,'crossbow'),fortress:f.id});home.production.progress=10;delete f.fort;assert.equal(E.productionRate(g,home),E.productionRate(g,home,{item:replacementFor(p,'crossbow')}));assert.equal(home.production.progress,10);
  home.production.progress=E.orderCost(g,home)-1;E.finishTurn(g,{actions:false});assert(g.units.filter(u=>u.owner===0&&u.type===replacementFor(p,'crossbow')).length===2);sim.dispose();
  pass('Actual fortress recruitment shares one city order, gives +25% / +100%, validates ownership/role, survives save/load and falls back after destruction without lost progress');
 }
 {
  const {g,p,home,tile,sim}=field(),f=fort(g,home,tile(11,12));p.techs=p.techs.filter(k=>!['ballistics','steel','rocketry','advballistics'].includes(k));E.applyAction(g,p,{type:'produce',city:home.id,item:replacementFor(p,'crossbow'),fortress:f.id});home.production.progress=E.orderCost(g,home);for(const t of [f,...g.map.tiles.filter(t=>R.dist(t,f,g.map)<=2&&t.owner===0)])if(!g.units.some(u=>u.tile===t.id))E.addUnit(g,0,'warrior',t.id);
  E.finishTurn(g,{actions:false});assert(home.production);assert(!g.units.some(u=>u.type===replacementFor(p,'crossbow')));g.units=g.units.filter(u=>u.tile!==f.id);E.finishTurn(g,{actions:false});assert.equal(g.units.filter(u=>u.type===replacementFor(p,'crossbow')).length,1);sim.dispose();pass('Congested fortress deployment waits for a genuinely free cell and never stacks units or duplicates recruitment');
 }
 const decisions=[];
 for(const civ of R.CIVS){
  const {g,p,q,home,tile,sim}=field();W.beginWar(g,q,p,E.event);for(const [x,y]of [[9,12],[10,11],[11,11]])E.addUnit(g,1,'warrior',tile(x,y).id);see(g);
  const f=fort(g,home,tile(11,12));const space=E.productionOptions(g,p,home).find(o=>o.item==='spaceport');assert(space);E.applyAction(g,p,{type:'produce',city:home.id,item:'spaceport',tile:space.tile});home.production.progress=20;
  const orders=await decide(g,p,civ.file,a=>a.city===home.id&&a.type==='produce'),order=orders.find(a=>a.city===home.id);assert(order,civ.file);assert(R.UNITS[order.item]&&!R.UNITS[order.item].civilian&&(R.UNITS[order.item].domain||'land')==='land',civ.file+' must recruit a defender');assert.equal(order.fortress,f.id,civ.file+' uses accelerated fortress recruitment');E.applyAction(g,p,order);assert(home.production.progress>=10);decisions.push({driver:civ.file,item:order.item,fortress:order.fortress});sim.dispose();
 }
 metrics.defenders=decisions;pass('All eight rebuilt native drivers interrupt an actual spaceport order under invasion, recruit combat defenders at a fortress and retain normal switching carryover');
 for(const civ of R.CIVS){const {g,p,sim}=field();const orders=await decide(g,p,civ.file,a=>a.type==='produce'&&a.item==='spaceport');assert.equal(orders.length,1,civ.file+' reserves one national spaceport');sim.dispose();}
 pass('All eight actual native responses reserve one productive spaceport instead of one per city');
 for(const civ of R.CIVS){const {g,p,tile,sim}=field();for(const [i,c]of g.cities.filter(c=>c.owner===0).entries()){const t=tile(10+i*7,13);Object.assign(t,{owner:0,district:{item:'spaceport',city:c.id,kind:'district'}});c.districts.push({item:'spaceport',tile:t.id});c.buildings.push('spaceport');}const orders=await decide(g,p,civ.file,a=>a.type==='produce'&&a.item==='satellite');assert.equal(orders.length,1,civ.file+' reserves one national space project');sim.dispose();}
 pass('All eight actual native responses reserve a single national space-project stage across several completed spaceports');
 {
  const {g,p,home,sim}=field();home.production={item:'satellite',progress:30,tile:null,cost:R.productionCost(g,'satellite')};p.spaceStage=1;const orders=await decide(g,p,R.CIVS[0].file,a=>a.type==='produce'&&a.city===home.id);assert(orders.some(a=>a.item!=='satellite'));sim.dispose();pass('A legacy duplicate completed space stage is replanned rather than hanging in production forever');
 }
 {
  const {g,p,home,sim}=field();for(const c of g.cities.filter(c=>c.owner===0)){const op=E.productionOptions(g,p,c).find(o=>o.item==='spaceport');E.applyAction(g,p,{type:'produce',city:c.id,item:'spaceport',tile:op.tile});}
  const orders=await decide(g,p,R.CIVS[0].file,a=>a.type==='produce');assert(orders.some(a=>a.item!=='spaceport'));assert(!orders.some(a=>a.item==='spaceport'));assert(home.production);sim.dispose();pass('An old nationwide spaceport backlog can be replanned even before an invasion');
 }
 {
  const {g,p,q,home,sim}=field();W.beginWar(g,q,p,E.event);W.cityAttacked(g,1,home,E.event);g.realtime.time=160;g.realtime.nextEconomy=180;g.turn=9;
  const proposal=W.propose(g,q,p.id,'peace',E.event);W.answerProposal(g,p,proposal.id,true,E.event);assert.equal(p.defensePreparationUntil,560);assert(!q.defensePreparationUntil);
  let state=domesticSituation(g,p);assert(localRecruitment(g,home,state)>0);for(let i=0;i<30;i++)E.addUnit(g,0,'warrior',g.map.tiles[200+i].id);state=domesticSituation(g,p);assert.equal(state.shortage,0);assert.equal(localRecruitment(g,home,state),0);
  g.realtime.time=560;g.realtime.nextEconomy=580;g.units=[];assert.equal(domesticSituation(g,p).recovery,0);sim.dispose();pass('Only the actually invaded side rebuilds after peace, with a 20-period decaying preference that disappears when its army is sufficient');
 }
 {
  const {g,p,q,home,enemy,tile,sim}=field();g.cities=g.cities.filter(c=>c===home||c===enemy);const retained=new Set(g.cities.map(c=>c.id));for(const t of g.map.tiles)if(t.territoryCity!=null&&!retained.has(t.territoryCity)){t.territoryCity=null;t.cityId=null;t.owner=null;}g.map.tiles[enemy.tile].cityId=null;enemy.tile=tile(16,12).id;g.map.tiles[enemy.tile].cityId=enemy.id;g.map.tiles[enemy.tile].owner=1;home.population=1;enemy.population=22;
  let pressure=citizenPressures(g).get(home.id),status=loyaltyStatus(g,home,E.cityYields(g,home),pressure);assert.equal(pressure.source.city,enemy.id);assert(status.change<0);const first=status.change;
  const enemyTile=enemy.tile;enemy.tile=tile(19,12).id;assert(citizenPressures(g).get(home.id).foreign<pressure.foreign);enemy.tile=tile(20,12).id;assert.equal(citizenPressures(g).get(home.id).foreign,0);enemy.tile=enemyTile;
  E.addUnit(g,0,'warrior',home.tile);status=loyaltyStatus(g,home,E.cityYields(g,home),pressure);assert.equal(status.change,first+2);g.units=[];
  home.loyalty=38;home.loyaltyStatus=status;p.knownCities={};const hidden=E.snapshot(g,0).cities.find(c=>c.id===home.id).loyaltyStatus;assert.equal(hidden.source.name,'未知城市');assert(!JSON.stringify(hidden).includes(enemy.name));assert.equal(E.observation(g,p).cities.find(c=>c.id===home.id).loyaltyStatus.source.name,'未知城市');
  see(g);assert.equal(E.snapshot(g,0).cities.find(c=>c.id===home.id).loyaltyStatus.source.name,enemy.name);
  const rememberedName=enemy.name;p.visible=p.visible.filter(id=>id!==enemy.tile);enemy.name='UNSEEN CITY RENAME';home.loyaltyStatus=loyaltyStatus(g,home,E.cityYields(g,home),citizenPressures(g).get(home.id));assert.equal(E.snapshot(g,0).cities.find(c=>c.id===home.id).loyaltyStatus.source.name,rememberedName);enemy.name=rememberedName;
  const normal=E.cityYields(g,{...home,loyalty:100});assert.equal(E.cityYields(g,home).production,Math.round(normal.production*.5*100)/100);
  const f=fort(g,home,tile(11,12));home.loyalty=1;E.finishTurn(g,{actions:false});assert.equal(home.owner,q.id);assert.equal(f.owner,q.id);assert.equal(f.fort.owner,q.id);assert.equal(home.production,null);
  enemy.tile=tile(26,12).id;assert.equal(citizenPressures(g).get(home.id).source,null);sim.dispose();pass('Distance-weighted population pressure, garrison support, low-loyalty yields, safe labels/native privacy and complete territorial allegiance work together');
 }
 for(let tier=1;tier<=4;tier++){const city={hp:200,walls:450,buildings:[R.WALL_TIERS[tier].building]};for(const [type,spec]of Object.entries(R.UNITS))if(!spec.civilian)assert.equal(R.cityAttackDamage(type,city,40).wallDamage,spec.siege?Math.round(40*(spec.siegeTier===tier?1.75:.875)*(['catapult','trebuchet','bombard'].includes(type)?.75:1)):1);}
 pass('Siege wall specialties include the early seventy-five-percent reduction once, while field cannons and other non-siege units retain fixed-one wall damage');
 const bytes=await readFile(new URL('../saves/autosave.json',import.meta.url));const frozen=E.restore(bytes.toString());metrics.compatibility={id:frozen.id,turn:frozen.turn,cities:frozen.cities.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 await writeFile(new URL('../output/domestic-defense-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
}finally{pool.dispose();}
