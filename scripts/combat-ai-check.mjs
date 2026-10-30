import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,addUnit,foundCity,refreshVisibility,observation,attackTargets,applyAction,event,restore} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {CIVS,UNITS,dist,occupationUnit} from '../src/rules.mjs';
import {beginWar,ACTION_LIMITS} from '../src/warfare.mjs';

const checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(){
 const g=createGame({players:2,size:'small',seed:'COMBAT-AI-READINESS',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(col,row)=>g.map.tiles[row*g.map.width+col];
 for(const p of g.players){p.manual=true;p.gold=800;p.met=[1-p.id];p.techs=['mining','masonry','bronze','iron','archery','machinery','engineering'];foundCity(g,p,addUnit(g,p.id,'settler',tile(10+p.id*8,12).id));}
 g.units=[];g.turn=40;const sim=new RealtimeSimulation(g);beginWar(g,g.players[0],g.players[1],event);
 return {g,sim,p:g.players[0],q:g.players[1],home:g.cities[0],city:g.cities[1],tile};
}
function see(g){
 refreshVisibility(g);
 for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile}]));}
}
const pool=new NativeDriverPool();
async function decide(g,p,file,filter){p.driver.file=file;const obs=observation(g,p);if(filter)obs.legalActions=obs.legalActions.filter(filter);const result=await pool.execute(p,obs);p.memory=result.memory;return result.orders;}
try{
 const shots=[];
 for(const civ of CIVS){
  const {g,sim,p,city,tile}=field();city.buildings=['walls'];city.walls=100;const u=addUnit(g,0,'crossbow',tile(16,12).id);see(g);
  const action=(await decide(g,p,civ.file,a=>a.unit===u.id)).find(a=>a.unit===u.id);assert.equal(action?.type,'attack',civ.file+' must shoot rather than fortify/train/move');assert.equal(action.targetCity,city.id);
  sim.enqueue(p,[{type:'fortify',unit:u.id}]);const queueId=g.realtime.queues[0][0].id;sim.enqueue(p,[action]);assert.equal(g.realtime.queues[0][0].id,queueId);assert.equal(g.realtime.queues[0][0].action.type,'attack');
  sim.tick(.05);assert.equal(u.activity?.action.type,'attack');assert.equal(city.walls,100);sim.tick(1.2);assert.equal(city.walls,99);assert.equal(city.hp,200);assert(u.attackUntil>g.realtime.time);
  assert(!attackTargets(g,p,u).some(a=>a.targetCity===city.id));sim.tick(Math.max(0,u.attackUntil-g.realtime.time)+.1);see(g);
  assert.equal((await decide(g,p,civ.file,a=>a.unit===u.id)).find(a=>a.unit===u.id)?.type,'attack');shots.push({driver:civ.file,wallDamage:1});sim.dispose();
 }
 metrics.shots=shots;pass('Eight actual native drivers fire at a walled city, inflict exactly one non-siege wall damage, respect cooldown and choose fire again when ready');
 {
  const {g,sim,p,tile}=field(),u=addUnit(g,0,'crossbow',tile(16,12).id),v=addUnit(g,1,'warrior',tile(17,12).id);see(g);
  sim.enqueue(p,[{type:'fortify',unit:u.id}],{manual:true});sim.enqueue(p,[{type:'attack',unit:u.id,targetUnit:v.id}]);assert.equal(g.realtime.queues[0][0].action.type,'fortify');sim.cancel(p,u.id);
  sim.enqueue(p,[{type:'attack',unit:u.id,targetUnit:v.id}]);sim.tick(.05);const active=u.activity;sim.enqueue(p,[{type:'fortify',unit:u.id}]);assert.equal(u.activity,active);sim.tick(1.2);assert(v.hp<100);sim.dispose();
  pass('Native replacement preserves queue position, explicit human orders and already-running attack work');
 }
 {
  const {g,sim,p,tile}=field(),v=addUnit(g,1,'warrior',tile(16,12).id);v.hp=1;const a=addUnit(g,0,'crossbow',tile(15,12).id),b=addUnit(g,0,'crossbow',tile(16,13).id);see(g);
  const orders=await decide(g,p,CIVS[0].file,x=>[a.id,b.id].includes(x.unit));assert.equal(orders.filter(x=>x.type==='attack'&&x.targetUnit===v.id).length,1);sim.dispose();pass('Safe fire still reserves lethal damage once rather than assigning every shooter to the same dying target');
 }
 const captures=[];
 for(const civ of CIVS){
  const {g,sim,p,city,tile}=field();city.hp=0;city.walls=0;const u=addUnit(g,0,'warrior',tile(14,12).id);see(g);let commands=0;
  for(let cycle=0;cycle<16&&city.owner===1;cycle++){
   see(g);const orders=await decide(g,p,civ.file,a=>a.unit===u.id);if(orders.length){sim.enqueue(p,orders);commands++;}sim.tick(1);
  }
  assert.equal(city.owner,0,civ.file+' must enter the breached city');assert.equal(u.tile,city.tile);assert.equal(sim.stats.rejected,0);captures.push({driver:civ.file,commands,seconds:g.realtime.time});sim.dispose();
 }
 metrics.captures=captures;pass('Eight native drivers march from four tiles away and actually occupy a zero-HP city through timed movement');
 const recruitment=[];
 for(const civ of CIVS){
  const {g,sim,p,home,city,tile}=field();p.gold=2000;city.hp=0;home.production={item:'settler',progress:12,tile:null};addUnit(g,0,'crossbow',tile(16,12).id);
  for(let i=0;i<33;i++){const t=tile(25+i%10,25+Math.floor(i/10));t.terrain='coast';addUnit(g,0,'galley',t.id);}see(g);
  const command=(await decide(g,p,civ.file,a=>a.city===home.id&&a.type==='produce')).find(a=>a.type==='produce');assert(command&&occupationUnit(command.item)&&(UNITS[command.item].domain||'land')==='land'&&command.item!=='scout',civ.file+' must recruit ground occupation troops despite its fleet');
  applyAction(g,p,command);assert.equal(home.production.progress,6);assert.equal(g.units.filter(u=>u.owner===0&&(UNITS[u.type].domain||'land')==='land'&&!UNITS[u.type].ranged&&!UNITS[u.type].civilian).length,0);
  const next=observation(g,p);assert.equal(next.cities[0].productionDomain,'land');assert(!next.legalActions.some(a=>a.type==='produce'&&a.city===home.id));recruitment.push({driver:civ.file,item:command.item});sim.dispose();
 }
 metrics.recruitment=recruitment;pass('Eight adequately funded drivers replace irrelevant production with real land capture recruitment, exclude naval melee from ground strength, preserve carryover and avoid repeated switching');
 {
  const {g,sim,p,city,tile}=field();const u=addUnit(g,0,'warrior',tile(14,12).id);see(g);p.visible=p.visible.filter(id=>dist(g.map.tiles[id],g.map.tiles[city.tile],g.map)>1);
  const before=observation(g,p).legalActions.filter(a=>a.unit===u.id||a.type==='produce');city.hp=0;city.walls=0;
  assert.deepEqual(observation(g,p).legalActions.filter(a=>a.unit===u.id||a.type==='produce'),before);p.visible=g.map.tiles.map(t=>t.id);const guard=addUnit(g,1,'warrior',city.tile);see(g);
  assert(!observation(g,p).legalActions.some(a=>a.unit===u.id&&a.hint?.captureProgress>0));guard.hp=0;g.units=g.units.filter(v=>v!==guard);city.walls=1;see(g);
  assert(!observation(g,p).legalActions.some(a=>a.unit===u.id&&a.hint?.captureProgress>0));p.relations[1].status='peace';g.players[1].relations[0].status='peace';city.walls=0;see(g);assert(!attackTargets(g,p,u).some(a=>a.targetCity===city.id));sim.dispose();
  pass('Hidden city damage does not leak into tactics; surviving walls, military garrisons and peace continue to forbid occupation');
 }
 {
  const g=restore(await readFile(new URL('../output/combat-ai-save-input.json',import.meta.url),'utf8')),p=g.players[5],obs=observation(g,p),ready=new Set(obs.legalActions.filter(a=>a.type==='attack'&&a.hint.ranged&&a.hint.retaliation===0&&a.hint.expectedDamage>0).map(a=>a.unit));
  const result=await pool.execute(p,obs);const shots=result.orders.filter(a=>a.type==='attack'&&ready.has(a.unit));assert(shots.length>0);metrics.frozen={world:g.id,period:g.turn,readyShooters:ready.size,chosenShots:shots.length,nativeMilliseconds:result.ms};
  assert.equal(ACTION_LIMITS.active,24);assert.equal(ACTION_LIMITS.moving,16);assert.equal(ACTION_LIMITS.perNation,4);pass('Frozen twelve-nation reported world selects real available attacks without changing scheduler concurrency limits');
 }
 await writeFile(new URL('../output/combat-ai-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
}finally{pool.dispose();}
