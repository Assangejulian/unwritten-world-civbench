import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,addUnit,foundCity,refreshVisibility,observation,event,restore,attackTargets,canOccupyCity,applyAction,reachable} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {CIVS,UNITS,dist,isWater} from '../src/rules.mjs';
import {beginWar,protectedEnvoy} from '../src/warfare.mjs';
import {neighbors} from '../src/world.mjs';
const checks=[],metrics={},pass=s=>{checks.push(s);console.log('PASS '+s);};
const pool=new NativeDriverPool();
function field(){
 const g=createGame({players:2,size:'small',seed:'COASTAL-OCCUPATION',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,riverEdges:[],cityId:null,owner:null,district:null,improvement:null,camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 for(const p of g.players){p.manual=true;p.met=[1-p.id];p.techs=['sailing','celestial','archery','machinery','engineering'];foundCity(g,p,addUnit(g,p.id,'settler',tile(10+8*p.id,12).id));}
 g.units=[];g.turn=40;const sim=new RealtimeSimulation(g);beginWar(g,g.players[0],g.players[1],event);return {g,sim,p:g.players[0],q:g.players[1],city:g.cities[1],tile};
}
function see(g){refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:!!c.isCapital}]));}}
async function orders(g,p,filter){const obs=observation(g,p);if(filter)obs.legalActions=obs.legalActions.filter(filter);const r=await pool.execute(p,obs);p.memory=r.memory;return r.orders;}
try{
 const driverCases=[];
 for(const civ of CIVS){
  const {g,sim,p,q,city,tile}=field();p.driver.file=civ.file;q.driver.file=CIVS[0].file;city.hp=0;city.walls=0;
  const ring=neighbors(g.map,g.map.tiles[city.tile]);for(const t of ring)t.terrain='mountain';
  const shore=ring.find(t=>t.col===17&&t.row===12),water=neighbors(g.map,shore).find(t=>dist(t,g.map.tiles[city.tile],g.map)===2&&t.row===12);
  ring.find(t=>t.id!==shore.id&&t.row===11).terrain='coast';
  shore.terrain='grass';water.terrain='coast';const escape=neighbors(g.map,shore).find(t=>dist(t,g.map.tiles[city.tile],g.map)===2&&t.id!==water.id);escape.terrain='grass';
  const guard=addUnit(g,0,'crossbow',shore.id),infantry=addUnit(g,0,'warrior',water.id),envoy=addUnit(g,1,'envoy',city.tile);
  envoy.envoy={protected:true,state:'travelling',capital:g.cities[0].id,target:0,sentAt:0};see(g);
  assert(!canOccupyCity(g,infantry,city));assert(!attackTargets(g,p,guard).some(a=>a.targetUnit===envoy.id));
  let vacant=false,landed=false;
  for(let cycle=0;cycle<60&&city.owner===1;cycle++){
   see(g);for(const nation of [q,p])sim.enqueue(nation,await orders(g,nation,a=>a.unit!==undefined&&['move','attack','fortify'].includes(a.type)));
   sim.tick(.5);vacant||=envoy.tile!==city.tile;landed||=!isWater(g.map.tiles[infantry.tile]);
  }
  assert(vacant,civ.file+' must evacuate the protected envoy');assert(landed,civ.file+' must yield and disembark');assert.equal(city.owner,0,civ.file+' must capture the coastal city');assert.equal(envoy.hp,100);assert(g.units.includes(envoy));
  driverCases.push({driver:civ.file,seconds:g.realtime.time,envoyAlive:envoy.hp,infantry:infantry.tile});sim.dispose();
 }
 metrics.drivers=driverCases;pass('All eight native armies yield a one-tile beach, land infantry and capture a city previously blocked by an invulnerable living envoy');
 {
  const {g,sim,p,city,tile}=field();city.hp=0;for(const t of neighbors(g.map,g.map.tiles[city.tile]))t.terrain='coast';const u=addUnit(g,0,'warrior',tile(16,12).id);see(g);
  assert(!reachable(g,p,u,true).some(a=>a.tile===city.tile));sim.dispose();pass('A planned multi-step land path cannot cross water and falsely promise direct enemy-city occupation without disembarking first');
 }
 {
  const {g,sim,p,city,tile}=field(),shooter=addUnit(g,0,'crossbow',tile(16,12).id);
  const rear=[];for(let i=0;i<40;i++)rear.push(addUnit(g,0,'warrior',tile(30+i%10,25+Math.floor(i/10)).id));see(g);
  sim.enqueue(p,rear.map(u=>({type:'fortify',unit:u.id})));sim.enqueue(p,[{type:'attack',unit:shooter.id,targetCity:city.id,priority:1800}]);sim.enqueue(p,[{type:'fortify',unit:shooter.id,priority:0}]);
  assert.equal(g.realtime.queues[0].find(q=>q.action.unit===shooter.id).action.type,'attack');sim.tick(.05);assert.equal(shooter.activity?.action.type,'attack');sim.tick(1.2);assert(city.hp<200);sim.dispose();
  pass('A legal pending shot survives an idle replan and starts ahead of forty older rear-unit orders through the actual scheduler');
 }
 {
  const {g,sim,p,q,city}=field();city.hp=0;const ring=neighbors(g.map,g.map.tiles[city.tile]);for(const t of ring)t.terrain='mountain';ring[0].terrain='grass';const attacker=addUnit(g,0,'warrior',ring[0].id),envoy=addUnit(g,1,'envoy',city.tile);envoy.envoy={protected:true,state:'travelling',capital:g.cities[0].id,target:0,sentAt:0};see(g);
  for(const civ of CIVS){q.driver.file=civ.file;const response=await orders(g,q,a=>a.unit===envoy.id);assert(response.some(a=>a.type==='recallEnvoy'),'A completely trapped protected delegation must voluntarily recall instead of becoming an immortal garrison');}
  assert(!canOccupyCity(g,attacker,city));applyAction(g,q,{type:'recallEnvoy',unit:envoy.id});assert.equal(envoy.hp,100);assert(!g.units.includes(envoy));assert(canOccupyCity(g,attacker,city));sim.dispose();pass('A completely encircled protected delegation voluntarily recalls alive; this opens occupation without attacking an invulnerable unit');
 }
 {
  const {g,sim,p,city,tile}=field();p.driver.file=CIVS[0].file;city.hp=100;city.walls=0;
  for(let i=0;i<160;i++){const u=addUnit(g,0,'warrior',tile(30+i%20,20+Math.floor(i/20)).id);u.fortified=true;}
  const shooter=addUnit(g,0,'crossbow',tile(16,12).id);shooter.id=999999;see(g);const response=await orders(g,p);
  assert(response.length<=128);const index=response.findIndex(a=>a.unit===shooter.id&&a.type==='attack');assert(index>=0&&index<10,'Frontline attacks must precede idle unit IDs under the command cap');metrics.commandBudget={units:g.units.length,orders:response.length,attackIndex:index};sim.dispose();pass('A real 161-unit army schedules its high-ID frontline shooter ahead of background orders while retaining the 128-order limit');
 }
 {
  const g=restore(await readFile(new URL('../output/coastal-combat-save-input.json',import.meta.url),'utf8')),city=g.cities.find(c=>c.id===916),envoy=g.units.find(u=>u.id===1454),p=g.players[9],q=g.players[0],initial={hp:city.hp,envoy:envoy.tile};
  for(const player of g.players)player.manual=true;const sim=new RealtimeSimulation(g);let evacuated=false,landed=0,decisions=0;
  for(let cycle=0;cycle<180&&city.owner===0;cycle++){
   for(const nation of [q,p])sim.enqueue(nation,await orders(g,nation,a=>a.unit!==undefined&&['move','attack','fortify','rebase','recallEnvoy'].includes(a.type)));
   sim.tick(.5);evacuated||=envoy.tile!==initial.envoy;decisions+=2;
   landed=g.units.filter(u=>u.owner===9&&!UNITS[u.type].ranged&&!UNITS[u.type].civilian&&!isWater(g.map.tiles[u.tile])&&dist(g.map.tiles[u.tile],g.map.tiles[city.tile],g.map)<=2).length;
   if(cycle%20===0)console.log('Frozen coast '+JSON.stringify({cycle,seconds:g.realtime.time-5740,hp:city.hp,owner:city.owner,envoy:envoy.tile,landed}));
  }
  metrics.frozen={world:g.id,startPeriod:288,initial,owner:city.owner,envoyHp:envoy.hp,evacuated,landed,decisions,seconds:g.realtime.time-5740,rejected:sim.stats.rejected};
  await writeFile(new URL('../output/coastal-combat-reproduction.json',import.meta.url),JSON.stringify(metrics.frozen,null,2));
  assert(evacuated,'The actual protected envoy must vacate the captured city');assert.equal(envoy.hp,100);assert.equal(city.owner,9,'The original crowded coastline must be captured by its existing Han army');sim.dispose();pass('The frozen period-288 user world actually evacuates the protected envoy and captures Kaesong using its existing army without a forced occupation or extra troops');
 }
 await writeFile(new URL('../output/coastal-combat-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
}finally{pool.dispose();}
