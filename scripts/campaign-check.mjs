import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,addUnit,foundCity,refreshVisibility,observation,applyAction,finishTurn,serialize,snapshot,event,legalActions} from '../src/engine.mjs';
import {UNITS,CIVS,TECHS,CIVICS,dist,productionCost,improvementName} from '../src/rules.mjs';
import {defenseSituation,campaignPosture,routeGuidance} from '../src/campaign.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {beginWar} from '../src/warfare.mjs';
const active=new URL('../saves/autosave.json',import.meta.url),before=await readFile(active),checks=[],metrics={},pass=s=>{checks.push(s);console.log('PASS '+s);};
function field(){const g=createGame({players:2,size:'small',seed:'CAMPAIGN-READABILITY',barbarians:false});g.units=[];for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});for(const p of g.players){const tile=g.map.tiles[12*g.map.width+14+p.id*16];foundCity(g,p,addUnit(g,p.id,'settler',tile.id));p.met=[1-p.id];p.gold=500;p.manual=true;}g.units=[];g.turn=40;refreshVisibility(g);return {g,p:g.players[0],q:g.players[1],c:g.cities[0],enemy:g.cities[1],tile:(col,row)=>g.map.tiles[row*g.map.width+col]};}
const pool=new NativeDriverPool();
try{
 {
  const {g,p,c,tile}=field();c.population=6;p.techs=['animal','archery','pottery'];c.production={item:'settler',progress:20,tile:null};addUnit(g,-1,'warrior',tile(13,12).id);addUnit(g,-1,'warrior',tile(14,11).id);addUnit(g,0,'herbalist',tile(15,12).id);refreshVisibility(g);assert(defenseSituation(g,p,c).urgency>=1);
  const selections=[];for(const civ of CIVS){p.driver.file=civ.file;const response=await pool.execute(p,observation(g,p));const production=response.orders.find(a=>a.type==='produce'&&a.city===c.id);assert(production&&UNITS[production.item]&&!UNITS[production.item].civilian&&!UNITS[production.item].ranged,'Emergency frontline defender missing for '+civ.file);selections.push({driver:civ.file,item:production.item});}metrics.emergencyDrivers=selections;pass('All eight actual native C++ drivers interrupt an unsafe settler order to recruit frontline combat defenders against two nearby barbarians');
  const command=(await pool.execute(p,observation(g,p))).orders.find(a=>a.type==='produce');applyAction(g,p,command);assert.equal(c.production.progress,10);assert.equal(c.production.item,command.item);pass('Emergency switching uses existing half-progress carryover and real city production, without instant spawning');
  const guard=addUnit(g,0,'warrior',c.tile);refreshVisibility(g);const responseObs=observation(g,p);responseObs.legalActions=responseObs.legalActions.filter(a=>a.unit===guard.id&&['attack','move','fortify'].includes(a.type));const fight=(await pool.execute(p,responseObs)).orders.find(a=>a.unit===guard.id);assert.equal(fight.type,'attack');assert.equal(g.units.find(u=>u.id===fight.targetUnit).owner,-1);applyAction(g,p,fight);pass('A healthy recruited frontline defender actually attacks a nearby barbarian rather than wandering or fortifying');
 }
 {
  const {g,p,c,tile}=field();addUnit(g,-1,'warrior',tile(60,30).id);const prior=defenseSituation(g,p,c);addUnit(g,1,'tank',tile(65,35).id);assert.deepEqual(defenseSituation(g,p,c),prior);assert.equal(prior.urgency,0);pass('Unseen barbarians and enemy reserves cannot trigger invented emergency recruitment');
 }
 {
  const {g,p,q,c,enemy,tile}=field();beginWar(g,p,q,event);p.driver.file=CIVS[0].file;p.techs=['animal','archery','mining','masonry','engineering'];p.explored=g.map.tiles.map(t=>t.id);p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities[enemy.id]={id:enemy.id,owner:1,name:enemy.name,tile:enemy.tile};
  const troops=[addUnit(g,0,'warrior',tile(16,12).id),addUnit(g,0,'warrior',tile(16,13).id),addUnit(g,0,'catapult',tile(15,11).id),addUnit(g,0,'archer',tile(16,11).id)];refreshVisibility(g);
  const initial=Math.min(...troops.map(u=>dist(g.map.tiles[u.tile],g.map.tiles[enemy.tile],g.map)));let attacked=0,firstDeparture=null;
  for(let cycle=0;cycle<24&&enemy.owner===1;cycle++){
   for(const u of troops.filter(u=>g.units.includes(u))){u.acted=false;u.moves=UNITS[u.type].moves;}
   refreshVisibility(g);const obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit!==undefined&&['move','attack','fortify'].includes(a.type));const response=await pool.execute(p,obs);p.memory=response.memory;
   // Capture completes this mission; remaining pre-capture quotes are stale.
   for(const action of response.orders){if(enemy.owner!==q.id)break;try{applyAction(g,p,action);if(action.type==='attack'&&action.targetCity===enemy.id)attacked++;}catch(error){throw new Error(action.type+': '+error.message);}}
   if(firstDeparture===null&&troops.some(u=>g.map.tiles[u.tile].owner!==0))firstDeparture=cycle+1;
   g.turn++;
  }
  assert(firstDeparture!==null);assert(attacked>0);assert.equal(enemy.owner,p.id);assert(Math.min(...troops.map(u=>dist(g.map.tiles[u.tile],g.map.tiles[enemy.tile],g.map)))<initial);metrics.offensive={firstDeparture,cityAttacks:attacked,owner:enemy.owner};pass('Actual native soldiers leave home territory, approach a remembered unseen enemy city and capture it without executing stale post-capture quotes');
  assert(Buffer.byteLength(JSON.stringify(p.memory))<32768);pass('Route history remains bounded inside the native 32 KB memory limit');
 }
 {
  const {g,p,q,c,enemy,tile}=field();beginWar(g,p,q,event);p.techs=['animal'];const u=addUnit(g,0,'envoy',tile(16,12).id);u.envoy={protected:true,state:'travelling',capital:enemy.id,target:1};
  for(let row=8;row<=17;row++)tile(20,row).terrain='mountain';for(let col=16;col<20;col++)tile(col,8).terrain='mountain';
  p.explored=g.map.tiles.map(t=>t.id);p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities[enemy.id]={id:enemy.id,name:enemy.name,owner:1,tile:enemy.tile};p.visible=[...p.explored];p.driver.file=CIVS[1].file;
  const visited=[],initial=u.tile;for(let cycle=0;cycle<40&&u.tile!==enemy.tile;cycle++){u.acted=false;u.moves=UNITS.envoy.moves;const obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&a.type==='move');const response=await pool.execute(p,obs);p.memory=response.memory;const command=response.orders.find(a=>a.unit===u.id);assert(command,'Envoy has a valid detour but stops moving');applyAction(g,p,command);visited.push(u.tile);g.turn++;p.visible=[...p.explored];}
  assert.equal(u.tile,enemy.tile);assert(!visited.slice(0,4).includes(initial));metrics.envoySteps=visited.length;pass('A real protected native envoy traverses a mountain detour that initially increases straight-line distance and reaches the capital');
 }
 {
  const {g,p,q,enemy,tile}=field();beginWar(g,p,q,event);p.techs=['animal'];const u=addUnit(g,0,'envoy',tile(16,12).id);u.envoy={protected:true,state:'travelling',capital:enemy.id,target:1};
  refreshVisibility(g);for(const t of g.map.tiles.filter(t=>dist(t,g.map.tiles[enemy.tile],g.map)<=2)){p.knownTiles[t.id]={...t};if(!p.explored.includes(t.id))p.explored.push(t.id);}p.knownCities[enemy.id]={id:enemy.id,name:enemy.name,owner:1,tile:enemy.tile};p.driver.file=CIVS[0].file;
  let steps=0;while(u.tile!==enemy.tile&&steps<30){u.acted=false;u.moves=UNITS.envoy.moves;refreshVisibility(g);const obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='move'&&a.unit===u.id);const response=await pool.execute(p,obs);p.memory=response.memory;const move=response.orders.find(a=>a.unit===u.id);assert(move,'An unseen gap must permit a known exploration frontier');applyAction(g,p,move);steps++;g.turn++;}
  assert.equal(u.tile,enemy.tile);metrics.fogEnvoySteps=steps;pass('A native envoy crosses an unexplored gap by following visible exploration frontiers without receiving hidden terrain');
 }
 {
  const {g,p,q,enemy,tile}=field();beginWar(g,p,q,event);const u=addUnit(g,0,'warrior',tile(16,12).id);p.explored=g.map.tiles.map(t=>t.id);p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities[enemy.id]={id:enemy.id,owner:1,tile:enemy.tile};refreshVisibility(g);
  const before=legalActions(g,p).filter(a=>a.unit===u.id&&a.type==='move');enemy.hp=1;enemy.walls=400;tile(60,30).terrain='mountain';addUnit(g,1,'tank',tile(60,31).id);assert.deepEqual(legalActions(g,p).filter(a=>a.unit===u.id&&a.type==='move'),before);pass('Hidden city health, wall tiers and live terrain changes cannot alter remembered offensive route hints');
  const base=campaignPosture(g,p,{goal:'science'});p.gold=0;p.warWeariness=50;u.hp=25;assert(campaignPosture(g,p,{goal:'science'}).temperature<base.temperature);pass('Attack temperature falls with treasury stress, casualties and war weariness');
 }
 {
  const {g,p,c,enemy,tile}=field();p.techs=Object.keys(TECHS);p.civics=Object.keys(CIVICS);const pad=tile(15,12);pad.owner=0;pad.district={item:'spaceport',city:c.id,kind:'district'};c.districts=[{item:'spaceport',tile:pad.id}];c.buildings=['spaceport'];c.production={item:'satellite',tile:null,progress:productionCost(g,'satellite')};refreshVisibility(g);finishTurn(g);
  assert.equal(p.spaceStage,1);const omni=snapshot(g,-1);assert(omni.visuals.events.some(e=>e.kind==='launch'&&e.actor.tile===pad.id&&e.duration===12));assert(snapshot(g,1).events.some(e=>e.type==='space'&&e.tile===null));assert(!snapshot(g,1).visuals.events.some(e=>e.kind==='launch'));pass('Real space-project completion emits a twelve-second map launch, global public notice and fog-protected launch coordinates');
  enemy.production={item:'warrior',tile:null,progress:3};const own=snapshot(g,-1),foreign=snapshot(g,0);assert(own.cities.find(c=>c.id===enemy.id).production);assert(foreign.players[1].resources===undefined&&foreign.players[1].policies===undefined);pass('Observer projection exposes city production and national resources while player projection redacts foreign private data');
 }
 assert.equal(improvementName({resource:'horses',improvement:'pasture'}),'养马场');assert.equal(improvementName({resource:'silk',improvement:'plantation'}),'桑园与蚕舍');pass('Resource-specific facility names derive from existing improvements without changing save keys');
 const after=await readFile(active);assert(before.equals(after));pass('Active save remains byte-identical; tests launch neither desktop nor real game server');
 await writeFile(new URL('../output/campaign-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveSha256:createHash('sha256').update(after).digest('hex'),activeSaveWritten:false,gameLaunched:false},null,2));
}finally{pool.dispose();}
