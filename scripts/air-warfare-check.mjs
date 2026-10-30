import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {attackRange,nuclearFootprint,nuclearStock} from '../src/air-warfare.mjs';
import {beginWar} from '../src/warfare.mjs';
import {RealtimeSimulation,migrateRealtime} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

export function battlefield(){
  const g=E.createGame({players:3,size:'small',seed:'AIR-WARFARE-216',barbarians:false});g.units=[];
  for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
  const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
  for(const p of g.players)Object.assign(p,{manual:true,gold:10000,met:g.players.filter(q=>q!==p).map(q=>q.id),techs:Object.keys(R.TECHS),civics:['empire','training','civilservice'],strategy:'science',spaceStage:0,spaceLaunchDone:false});
  const p=g.players[0],q=g.players[1];
  const home=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(10,15).id));
  const enemy=E.foundCity(g,q,E.addUnit(g,1,'settler',tile(18,15).id));
  E.foundCity(g,g.players[2],E.addUnit(g,2,'settler',tile(50,35).id));g.units=[];
  for(const [c,positions] of [[home,[[9,15],[10,16],[9,16]]],[enemy,[[19,15],[19,16]]]])for(const [x,y]of positions){const t=tile(x,y);t.owner=c.owner;t.territoryCity=c.id;t.district={item:'airport',city:c.id,kind:'district'};c.districts.push({item:'airport',tile:t.id});if(!c.buildings.includes('airport'))c.buildings.push('airport');}
  for(const [id,x]of [[0,8],[1,20]]){Object.assign(tile(x,15),{owner:id,resource:'oil',improvement:'well'});Object.assign(tile(x,14),{owner:id,resource:'uranium',improvement:'mine'});}
  enemy.population=12;enemy.buildings.push('walls','medievalwalls','renaissancewalls','steelwalls');enemy.walls=450;enemy.wallLevel=4;
  g.turn=120;const boot=new RealtimeSimulation(g);g.realtime.time=2380;g.realtime.nextEconomy=2400;boot.dispose();beginWar(g,p,q,E.event);see(g);
  return {g,p,q,home,enemy,tile};
}
export function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile}]));}}
const checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
export async function check(){
  const pool=new NativeDriverPool();
  try{
    {
      const {g,p,home,tile}=battlefield(),drone=E.addUnit(g,0,'drone',tile(10,16).id);
      assert.equal(drone.hp,40);assert.equal(attackRange(g,drone),8);p.techs.push('satellites');assert.equal(attackRange(g,drone),8);p.spaceStage=1;assert.equal(attackRange(g,drone),24);
      const targets=E.attackTargets(g,p,drone);assert(targets.some(t=>t.targetCity===g.cities[1].id));
      assert(!E.productionOptions(g,p,home).some(o=>['warrior','catapult','trebuchet','bomber','fighter','antiair'].includes(o.item)));
      assert(E.productionOptions(g,p,home).some(o=>o.item==='sam'));assert.equal(R.UNITS.rocketartillery.range,4);
      pass('Drone 40 HP, launch-gated 8/24 range, rocket range four and strict successor retirement');
    }
    {
      const {g,p,enemy,tile}=battlefield(),u=E.addUnit(g,0,'drone',tile(10,16).id),before=enemy.walls;p.spaceStage=1;
      E.applyAction(g,p,{type:'attack',unit:u.id,targetCity:enemy.id});assert(!g.units.some(v=>v.id===u.id));assert(enemy.walls<before);assert(g.events.some(e=>e.text?.includes('二次伤害')||e.message?.includes('二次伤害'))||g.events.some(e=>JSON.stringify(e).includes('二次伤害')));
      metrics.droneWallDamage=before-enemy.walls;
      pass('A drone actually bombs, applies a second explosion and consumes its identity');
    }
    {
      const {g,p,q,home,enemy,tile}=battlefield(),attacker=E.addUnit(g,1,'drone',tile(19,15).id),fighter=E.addUnit(g,0,'jetfighter',tile(10,16).id);
      q.spaceStage=1;E.applyAction(g,p,{type:'patrol',unit:fighter.id,targetCity:home.id});see(g);
      const old=home.hp;E.applyAction(g,q,{type:'attack',unit:attacker.id,targetCity:home.id});assert.equal(home.hp,old);assert(!g.units.some(u=>u.id===attacker.id));assert(fighter.attackUntil>0);
      const restored=E.restore(E.serialize(g));assert.equal(restored.units.find(u=>u.id===fighter.id).airPatrolCity,home.id);
      E.applyAction(g,p,{type:'cancelPatrol',unit:fighter.id});assert.equal(fighter.airPatrolCity,undefined);
      pass('Persistent fighter patrol intercepts before bomb release, uses cooldown and survives save/load');
    }
    {
      const {g,p,q,tile}=battlefield(),drone=E.addUnit(g,1,'drone',tile(19,15).id),ground=E.addUnit(g,0,'rocketartillery',tile(17,15).id),aa=E.addUnit(g,0,'sam',tile(17,16).id);see(g);
      assert(!E.attackTargets(g,p,ground).some(t=>t.targetUnit===drone.id));assert(E.attackTargets(g,p,aa).some(t=>t.targetUnit===drone.id));
      E.applyAction(g,p,{type:'attack',unit:aa.id,targetUnit:drone.id});assert(!g.units.some(u=>u.id===drone.id));
      pass('Ground artillery cannot shoot aircraft; anti-air can execute a real air kill');
    }
    {
      const {g,p,home,enemy,tile}=battlefield();const t=tile(11,15);t.owner=0;t.district={item:'missilesilo',city:home.id};home.buildings.push('missilesilo');home.districts.push({item:'missilesilo',tile:t.id});p.nuclearStockpile=1;
      assert.equal(nuclearFootprint(g,enemy.tile).length,25);assert.equal(nuclearFootprint(g,tile(0,15).id).length,25);assert.equal(nuclearFootprint(g,tile(0,0).id).length,15);
      const center=E.addUnit(g,1,'infantry',enemy.tile),edge=E.addUnit(g,1,'infantry',tile(20,17).id),outside=E.addUnit(g,1,'infantry',tile(21,17).id);
      see(g);const sim=new RealtimeSimulation(g);assert(sim.start(p,{type:'nuke',city:home.id,tile:enemy.tile}));assert.equal(nuclearStock(p),0);assert.equal(center.hp,100);
      const loaded=E.restore(E.serialize(g));migrateRealtime(loaded);const replay=new RealtimeSimulation(loaded);replay.advance(3.2);const c=loaded.cities.find(c=>c.id===enemy.id);
      assert(!loaded.players[0].visible.includes(enemy.tile));assert.equal(c.walls,0);assert.equal(c.population,6);assert(!loaded.units.some(u=>u.id===center.id));assert.equal(loaded.units.find(u=>u.id===edge.id).hp,35);assert.equal(loaded.units.find(u=>u.id===outside.id).hp,100);assert.equal(nuclearStock(loaded.players[0]),0);assert.equal(replay.stats.rejected,0);sim.dispose();replay.dispose();
      pass('Silo strike reserves one warhead, restores in flight, hits exactly 5x5 with center/edge falloff');
    }
    metrics.drivers=[];
    for(const civ of R.CIVS){
      const {g,p,tile}=battlefield();p.driver.file=civ.file;const tank=E.addUnit(g,0,'tank',tile(13,15).id),rocket=E.addUnit(g,1,'rocketartillery',tile(17,15).id);tank.hp=55;see(g);
      const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===tank.id);
      assert.equal(R.dist(g.map.tiles[tank.tile],g.map.tiles[rocket.tile],g.map),attackRange(g,rocket),'The tank starts at the rocket battery firing boundary');
      const action=(await pool.execute(p,obs)).orders.find(a=>a.unit===tank.id),quote=obs.legalActions.find(a=>a.type===action?.type&&a.tile===action?.tile);
      assert.equal(action?.type,'move');
      const safeEscape=R.dist(g.map.tiles[action.tile],g.map.tiles[rocket.tile],g.map)>attackRange(g,rocket)&&quote.hint.rangedThreat===0;
      assert(quote.hint.routeProgress>0||safeEscape,civ.file+' must close on the rocket battery or escape its shorter firing ring');
      const old=R.dist(g.map.tiles[tank.tile],g.map.tiles[rocket.tile],g.map),sim=new RealtimeSimulation(g);sim.enqueue(p,[action]);sim.tick(6);
      const after=R.dist(g.map.tiles[tank.tile],g.map.tiles[rocket.tile],g.map);
      assert(after<old||after>attackRange(g,rocket),civ.file+' must close or leave the firing ring rather than rest under fire');sim.dispose();
    }
    pass('All eight drivers physically close on a four-range rocket battery or leave its firing ring');
    for(const civ of R.CIVS){
      const {g,p,home,enemy,tile}=battlefield();p.driver.file=civ.file;E.addUnit(g,1,'bomber',tile(19,15).id);see(g);
      const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&['drone','stealthbomber','stealthfighter','sam'].includes(a.item));
      const result=await pool.execute(p,obs);assert(result.orders.some(a=>['stealthfighter','sam'].includes(a.item)),civ.file+' must answer observed air threats');assert(!result.orders.some(a=>['warrior','catapult'].includes(a.item)));
      const fighter=E.addUnit(g,0,'stealthfighter',tile(10,16).id);see(g);const patrol=E.observation(g,p);patrol.legalActions=patrol.legalActions.filter(a=>a.unit===fighter.id&&a.type==='patrol');const decision=await pool.execute(p,patrol);assert(decision.orders.some(a=>a.type==='patrol'));
      metrics.drivers.push({driver:civ.file,production:result.orders,patrol:decision.orders});
    }
    pass('All eight actual native drivers recruit air defense and issue persistent fighter patrols');
    for(const civ of R.CIVS){
      const {g,p,home,enemy,tile}=battlefield();p.driver.file=civ.file;p.nuclearStockpile=1;
      const silo=tile(11,15);silo.owner=0;silo.district={item:'missilesilo',city:home.id};home.buildings.push('missilesilo');home.districts.push({item:'missilesilo',tile:silo.id});see(g);
      const decide=async()=>{const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='nuke');return (await pool.execute(p,obs)).orders;};
      assert.equal((await decide()).filter(a=>a.type==='nuke').length,1,civ.file+' must use a safe city strike');
      E.addUnit(g,0,'infantry',tile(19,15).id);see(g);assert.equal((await decide()).length,0,civ.file+' rejects friendly collateral');
      g.units=[];E.addUnit(g,2,'infantry',tile(19,15).id);see(g);assert.equal((await decide()).length,0,civ.file+' rejects neutral collateral');
      g.units=[];const facility=tile(20,16),savedFacility=structuredClone(facility);facility.owner=0;facility.improvement='mine';see(g);assert.equal((await decide()).length,0,civ.file+' protects friendly infrastructure');
      facility.owner=2;see(g);assert.equal((await decide()).length,0,civ.file+' protects visible neutral infrastructure');
      p.visible=p.visible.filter(id=>id!==facility.id);assert.throws(()=>E.applyAction(g,p,{type:'nuke',city:home.id,tile:enemy.tile}),/未交战/);assert.equal(p.nuclearStockpile,1);Object.assign(facility,savedFacility);
      g.units=[];E.addUnit(g,1,'sam',tile(19,15).id);see(g);assert.equal((await decide()).length,0,civ.file+' rejects an observed ballistic interception network');
    }
    pass('All eight drivers use a safe silo strike and reject friendly, neutral and intercepted nuclear targets');
    for(const civ of R.CIVS){
      const {g,p,home,enemy,tile}=battlefield();p.driver.file=civ.file;p.spaceStage=1;enemy.population=2;
      const drone=E.addUnit(g,0,'drone',tile(10,16).id);see(g);let obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===drone.id&&['attack','fortify'].includes(a.type));
      assert((await pool.execute(p,obs)).orders.some(a=>a.type==='attack'),civ.file+' uses a worthwhile one-shot drone');
      drone.fortified=true;obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===drone.id&&a.type==='fortify');assert.equal((await pool.execute(p,obs)).orders.length,0,civ.file+' must not repeatedly repair a full 40-HP drone');
      const fighter=E.addUnit(g,0,'stealthfighter',tile(9,15).id);E.foundCity(g,p,E.addUnit(g,0,'settler',tile(10,25).id));E.applyAction(g,p,{type:'patrol',unit:fighter.id,targetCity:home.id});see(g);obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===fighter.id&&a.type==='patrol');assert(obs.legalActions.length);assert.equal((await pool.execute(p,obs)).orders.length,0,civ.file+' maintains its chosen city instead of shuffling patrols');
    }
    pass('All eight drivers use viable drones, recognize full 40-HP health and keep existing city patrols stable');
    for(const civ of R.CIVS){
      const {g,p,home,enemy,tile}=battlefield();p.driver.file=civ.file;p.nuclearStockpile=2;
      const t=tile(11,15);t.owner=0;t.district={item:'missilesilo',city:home.id};home.buildings.push('missilesilo');home.districts.push({item:'missilesilo',tile:t.id});E.addUnit(g,0,'stealthbomber',tile(10,16).id);see(g);
      const decide=async()=>{const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='nuke');return (await pool.execute(p,obs)).orders;};
      const orders=await decide();assert.equal(orders.length,1,civ.file+' must reserve overlapping bomber/silo target footprints');
      const sim=new RealtimeSimulation(g);sim.start(p,orders[0]);assert.equal((await decide()).length,0,civ.file+' accounts for the in-flight blast footprint');sim.dispose();
      for(const entity of [...g.units,...g.cities]){delete entity.activity;entity.acted=false;entity.moves=R.UNITS[entity.type]?.moves||0;entity.attacked=false;}
      enemy.hp=10;enemy.walls=0;see(g);assert.equal((await decide()).length,0,civ.file+' saves a costly warhead against a barely defended city');
    }
    pass('All eight drivers reserve pending and same-batch blast areas and conserve warheads against low-value cities');
    {
      const {g,p,home,enemy,tile}=battlefield();p.nuclearStockpile=1;const bomber=E.addUnit(g,0,'stealthbomber',tile(10,16).id);see(g);
      assert(E.nuclearTargets(g,p,bomber).some(t=>t.tile===enemy.tile));E.applyAction(g,p,{type:'nuke',unit:bomber.id,tile:enemy.tile});assert.equal(p.nuclearStockpile,0);assert.equal(enemy.walls,0);
      for(const type of ['battleship','missilecruiser']){p.nuclearStockpile=1;const ship=E.addUnit(g,0,type,tile(12,15).id);see(g);assert(E.nuclearTargets(g,p,ship).some(t=>t.tile===enemy.tile));}
      p.nuclearStockpile=-1;assert.throws(()=>E.restore(E.serialize(g)),/stockpile/);
      pass('Bomber nuclear delivery is real; both warship carriers have legal quotes and invalid inventories fail load');
    }
    {
      const {g,p,home,tile}=battlefield();home.buildings=[];home.districts=[];p.nuclearStockpile=0;
      E.applyAction(g,p,{type:'produce',city:home.id,item:'atomicbomb'});home.production.progress=E.orderCost(g,home)-1;E.finishTurn(g,{actions:false});assert.equal(p.nuclearStockpile,1);
      p.nuclearStockpile=3;assert(!E.buildable(g,p,home,'atomicbomb'));
      p.techs=['masonry','engineering'];E.applyAction(g,p,{type:'produce',city:home.id,item:'catapult'});const progress=home.production.progress=12;p.techs=Object.keys(R.TECHS);
      const legal=E.legalActions(g,p).filter(a=>a.type==='produce'&&a.city===home.id);assert(legal.length);assert(!legal.some(a=>a.item==='catapult'));assert.equal(home.production.progress,progress);
      E.applyAction(g,p,legal.find(a=>a.item==='rocketartillery'));assert(home.production.carryover>0||home.production.progress>0||home.storedProduction>0);
      pass('Atomic projects create real capped stocks; newly retired production yields with existing carryover');
    }
    await writeFile(new URL('../output/air-warfare-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
  }finally{pool.dispose();}
}
if(process.argv[1]?.endsWith('air-warfare-check.mjs'))await check();
