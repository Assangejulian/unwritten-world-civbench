import {ALLIANCES} from '../src/court.mjs';
import {initializeGovernors} from '../src/governors.mjs';
import {congressTurn} from '../src/congress.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as W from '../src/warfare.mjs';
import * as F from '../src/religion.mjs';
import {initializeTerritories,transferCityTerritory} from '../src/territory.mjs';
import {diplomaticIntelligence} from '../src/intelligence.mjs';
import {geopoliticalPressure} from '../src/geopolitics.mjs';
import {peaceAssessment,effectiveSupplies,normalizeTerms,validateTerms} from '../src/peace-terms.mjs';
import {indexMap,neighbors,tilesInRange} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(n=2){
 const g=E.createGame({players:n,size:'small',seed:'WORLD-SYSTEMS',barbarians:false});g.units=[];g.cities=[];g.cityStates={version:1,seeded:true,states:[]};
 const width=36,height=24;g.map=indexMap({width,height,wrapX:false,roadRules:1,tiles:Array.from({length:width*height},(_,id)=>{const row=Math.floor(id/width),col=id%width;return {id,col,row,q:col-Math.floor(row/2),r:row,terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[]};})});
 for(const p of g.players){p.manual=true;p.gold=100000;p.faith=5000;p.techs=Object.keys(R.TECHS);p.civics=Object.keys(R.CIVICS);p.met=g.players.filter(o=>o!==p).map(o=>o.id);p.capital=null;E.foundCity(g,p,E.addUnit(g,p.id,'settler',(5+Math.floor(p.id/4)*7)*width+6+(p.id%4)*6));g.map.tiles[g.cities.at(-1).tile].territoryCity=g.cities.at(-1).id;}
 g.units=[];see(g);return {g,p:g.players[0],q:g.players[1],c:g.cities[0],enemy:g.cities[1]};
}
function see(g){initializeGovernors(g);E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile}]));}}
function ready(g,u){delete u.activity;u.moves=R.UNITS[u.type].moves;u.acted=false;u.attackUntil=u.moveUntil=u.cooldownUntil=0;}
const pool=new NativeDriverPool();
try{
 for(const [size,spec]of Object.entries(R.MAP_SIZES)){const g=E.createGame({size,seed:'SIZE-'+size,barbarians:false});assert.equal(g.players.length,spec.players);assert.equal(new Set(g.players.map(p=>p.leaderKey)).size,spec.players);assert.equal(new Set(g.players.map(p=>p.color)).size,spec.players);assert(g.players.every(p=>R.CIVS.some(c=>c.file===p.driver.file)));assert.equal(E.restore(E.serialize(g)).players.length,spec.players);}
 pass('Map defaults are 6/8/10/12/16 distinct historical leaders with valid native drivers, colors, starts and save support');
 {
  const {g,p,enemy}=field(),center=g.map.tiles[enemy.tile],near=neighbors(g.map,center)[0];near.terrain='coast';g.players[1].techs=['sailing'];enemy.hp=70;W.beginWar(g,p,g.players[1],E.event);const boat=E.addUnit(g,0,'assaultship',near.id);see(g);const sim=new RealtimeSimulation(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===boat.id);const response=await pool.execute(p,obs);assert(response.orders.some(a=>a.type==='attack'&&a.targetCity===enemy.id));sim.enqueue(p,response.orders);sim.tick(2);assert.equal(enemy.owner,0);assert.equal(boat.tile,enemy.tile);sim.dispose();
  pass('An actual native naval melee decision breaches and occupies a coastal city through timed combat');
 }
 {
  const {g,p,enemy}=field(3),center=g.map.tiles[enemy.tile],area=tilesInRange(g.map,center,3).filter(t=>!t.cityId&&t.owner==null);for(const t of area)Object.assign(t,{owner:1,territoryCity:enemy.id});const edge=area.find(t=>R.dist(t,center,g.map)===3);edge.fort={owner:1,hp:160};const neighborCity=g.cities[2],kept=tilesInRange(g.map,g.map.tiles[neighborCity.tile],1).find(t=>t.owner===2);const near=neighbors(g.map,center)[0];enemy.hp=0;W.beginWar(g,p,g.players[1],E.event);const ship=E.addUnit(g,0,'warrior',near.id);see(g);E.applyAction(g,p,{type:'move',unit:ship.id,tile:enemy.tile});assert.equal(enemy.owner,0);assert(area.every(t=>t.owner===0));assert.equal(edge.fort.owner,0);assert.equal(kept.owner,2);assert.equal(E.restore(E.serialize(g)).map.tiles[edge.id].owner,0);
  pass('Actual capture transfers every bound city tile through radius three and its fortress without stealing an adjacent civilization');
 }
 {
  const {g,enemy}=field(3),center=g.map.tiles[enemy.tile],tile=tilesInRange(g.map,center,3).find(t=>R.dist(t,center,g.map)===2&&t.owner==null);tile.owner=1;delete tile.territoryCity;enemy.originalOwner=1;enemy.owner=0;initializeTerritories(g);assert.equal(tile.owner,0);assert.equal(tile.territoryCity,enemy.id);const other=g.cities[2];assert.equal(g.map.tiles[other.tile].owner,2);
  pass('Legacy partial conquest is repaired in memory from the nearest original city, keeping other cities intact');
 }
 {
  const {g,p,enemy}=field(),center=g.map.tiles[enemy.tile],shore=neighbors(g.map,center)[0];shore.terrain='coast';W.beginWar(g,p,g.players[1],E.event);const ship=E.addUnit(g,0,'assaultship',shore.id);enemy.hp=0;see(g);assert(E.attackTargets(g,p,ship).some(a=>a.targetCity===enemy.id));E.applyAction(g,p,{type:'attack',unit:ship.id,targetCity:enemy.id});assert.equal(enemy.owner,0);assert.equal(ship.tile,enemy.tile);
  const opponent=E.addUnit(g,1,'warrior',shore.id);shore.terrain='grass';ready(g,ship);see(g);assert(!E.attackTargets(g,p,ship).some(a=>a.targetUnit===opponent.id));opponent.type='archer';assert(E.attackTargets(g,g.players[1],opponent).some(a=>a.targetUnit===ship.id));
  pass('Naval melee really occupies a land coastal city and remains a sea combatant there; only land ranged can hit it');
 }
 {
  const {g,p,enemy}=field(),center=g.map.tiles[enemy.tile],ring=neighbors(g.map,center);ring[0].terrain=ring[1].terrain='coast';W.beginWar(g,p,g.players[1],E.event);const bow=E.addUnit(g,0,'archer',ring[0].id),boat=E.addUnit(g,1,'galley',ring[1].id);see(g);assert(E.unitStrength(g,bow)<=18);const transported=E.observation(g,p).units.find(u=>u.id===bow.id);assert.equal(transported.range,1);assert.equal(transported.ranged,false);assert(E.attackTargets(g,p,bow).some(a=>a.targetUnit===boat.id));assert(!E.attackTargets(g,p,bow).some(a=>a.targetCity===enemy.id));const land=E.addUnit(g,1,'warrior',center.id);assert(!E.attackTargets(g,p,bow).some(a=>a.targetUnit===land.id));
  pass('Embarked ranged troops become weakened water melee with range one and cannot bombard or occupy cities');
 }
 {
  const {g,p,q,enemy}=field();p.strategy='domination';p.planRevision++;W.beginWar(g,p,q,E.event);const shore=neighbors(g.map,g.map.tiles[enemy.tile])[0];shore.terrain='coast';const soldier=E.addUnit(g,0,'infantry',shore.id);see(g);const sim=new RealtimeSimulation(g),obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='move'&&a.unit===soldier.id);const response=await pool.execute(p,obs),move=response.orders.find(a=>a.type==='move');assert(move);assert(!R.isWater(g.map.tiles[move.tile]),'Native city assault should land before attacking');sim.enqueue(p,[move]);sim.tick(10);assert(!R.isWater(g.map.tiles[soldier.tile]));assert(!E.observation(g,p).units.find(u=>u.id===soldier.id).transport);sim.dispose();
  pass('A real native embarked infantry assault chooses remembered shore land and disembarks through timed movement');
 }
 {
  const {g,p,c}=field();p.techs=['mining'];p.civics=['code'];g.turn=1;const early=R.productionCost(g,'warrior'),buy=R.purchaseCost(g,'warrior');E.applyAction(g,p,{type:'produce',city:c.id,item:'warrior'});const locked=E.orderCost(g,c);g.turn=300;assert(R.productionCost(g,'warrior')>early);assert(R.purchaseCost(g,'warrior')>buy);assert.equal(E.orderCost(g,c),locked);const gold=p.gold;E.applyAction(g,p,{type:'purchase',city:c.id,item:'warrior'});assert.equal(gold-p.gold,R.purchaseCost(g,'warrior'));assert.equal(E.orderCost(g,c),locked);assert(!c.production.funded);assert.equal(g.units.length,1);E.refreshVisibility(g);assert.equal(E.serialize(E.restore(E.serialize(g))),E.serialize(g));metrics.costs={early,late:R.productionCost(g,'warrior'),buy,lateBuy:R.purchaseCost(g,'warrior')};
  pass('Production and gold costs rise over time; an existing order keeps its locked cost and gold purchasing immediately deploys while retaining the original order');
 }
 {
  const {g,p,c}=field();p.techs=['mining'];p.civics=['code'];E.applyAction(g,p,{type:'produce',city:c.id,item:'warrior'});const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='purchase');const response=await pool.execute(p,obs);assert(response.orders.some(a=>a.type==='purchase'));const gold=p.gold;E.applyOrders(g,p,response.orders);assert(p.gold<gold&&!c.production.funded&&g.units.length===1);
  pass('An actual native C++ decision spends surplus treasury on a real city order');
 }
 {
  const {g,p,c}=field();const oil=neighbors(g.map,g.map.tiles[c.tile])[0];oil.resource='oil';oil.improvement='well';oil.owner=0;const horses=neighbors(g.map,g.map.tiles[c.tile])[1];horses.owner=0;horses.resource='horses';horses.improvement='pasture';const obs=E.observation(g,p);const options=obs.legalActions.filter(a=>a.type==='produce'&&a.city===c.id&&['cuirassier','cavalry','modernarmor'].includes(a.hint.baseItem||a.item));assert(options.some(a=>(a.hint.baseItem||a.item)==='modernarmor'));assert(options.every(a=>(a.hint.baseItem||a.item)==='modernarmor'),'retired cavalry stays unavailable under the existing retirement rule');obs.legalActions=options;const response=await pool.execute(p,obs);assert(response.orders.some(a=>a.item==='modernarmor'));
  pass('With modern technology and oil the real native driver selects a main battle tank instead of obsolete cavalry');
 }
 {
  const {g,p,q,c,enemy}=field();c.population=8;enemy.population=8;p.religion='wisdom';q.religion='harvest';c.faithPressure={secular:0,0:700,1:100};enemy.faithPressure={secular:60,0:100,1:700};F.initializeReligion(g);assert.equal(c.religion,0);assert.equal(enemy.religion,1);const apostle=E.addUnit(g,0,'apostle',neighbors(g.map,g.map.tiles[enemy.tile])[0].id);see(g);E.applyAction(g,p,{type:'spread',unit:apostle.id,targetCity:enemy.id});assert.equal(enemy.religion,1);assert.equal(apostle.charges,3);assert.equal(Object.values(enemy.followers).reduce((a,b)=>a+b,0),8);enemy.faithPressure={secular:0,0:100,1:100};F.updateFollowers(g,enemy);assert.equal(enemy.religion,null);c.faithPressure={secular:20,0:100,1:500};F.updateFollowers(g,c);const inquisitor=E.addUnit(g,0,'inquisitor',neighbors(g.map,g.map.tiles[c.tile])[0].id);see(g);E.applyAction(g,p,{type:'spread',unit:inquisitor.id,targetCity:c.id});assert.equal(c.faithPressure[1],125);assert.equal(c.religion,0);assert(!F.religionTargets(g,p,inquisitor).some(t=>t.id===enemy.id));
  pass('Competing faith pressures preserve follower totals, require strict majority, resist one-click conversion and support domestic inquisition');
 }
 {
  const {g,p,c}=field();p.strategy='religion';p.planRevision++;p.religion='wisdom';c.religion=0;c.faithPressure={secular:0,0:300};c.buildings.push('holy','shrine','temple');const holy=neighbors(g.map,g.map.tiles[c.tile])[0];holy.owner=0;holy.district={item:'holy',city:c.id,kind:'district'};c.districts.push({item:'holy',tile:holy.id});const prior=F.religiousRecruitmentCost(g,p,'apostle',c),obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='recruitFaith');const response=await pool.execute(p,obs),order=response.orders.find(a=>a.type==='recruitFaith');assert(order);E.applyAction(g,p,order);assert.equal(g.units.length,1);assert.equal(p.faith,5000-obs.legalActions.find(a=>a.type===order.type&&a.item===order.item&&a.city===order.city).hint.faithCost);assert(F.religiousRecruitmentCost(g,p,order.item,c)>prior);
  pass('A native religious strategy recruits with actual faith, escalating prices and a safe deployment slot');
 }
 {
  const {g,p,c,enemy}=field();p.religion='wisdom';p.strategy='religion';p.planRevision++;g.turn=60;c.population=enemy.population=3;c.faithPressure={secular:0,0:300};enemy.faithPressure={secular:90};F.initializeReligion(g);const unit=E.addUnit(g,0,'apostle',neighbors(g.map,g.map.tiles[enemy.tile])[0].id);see(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===unit.id&&a.type==='spread');const response=await pool.execute(p,obs);assert(response.orders.some(a=>a.type==='spread'));E.applyOrders(g,p,response.orders);E.finishTurn(g,{actions:false});assert.equal(g.winner?.type,'religion');assert.equal(g.winner.player,0);
  pass('A real native spreading order changes followers and completes religious victory through the normal economy settlement');
 }
 {
  const {g,p,c,enemy}=field();g.turn=60;p.religion='wisdom';c.faithPressure={secular:300};enemy.faithPressure={secular:0,0:300};F.initializeReligion(g);E.finishTurn(g,{actions:false});assert(!g.winner);c.faithPressure={secular:0};F.updateFollowers(g,c);assert.equal(c.religion,null);assert.equal(c.followers.secular,c.population);
  pass('Foreign conversion alone cannot win without the founder’s domestic majority; zero pressure becomes secular population');
 }
 {
  const {g,p,c,enemy}=field();p.religion='wisdom';c.population=8;c.faithPressure={secular:0,0:1000};enemy.faithPressure={secular:300};F.initializeReligion(g);g.routes=[{id:999,owner:0,from:c.id,to:enemy.id,remaining:20}];F.religionTurn(g);assert.equal(enemy.faithPressure[0],4);
  pass('A real trade route carries pressure beyond the local neighbor radius');
 }
 {
  const {g,p,q,c,enemy}=field();p.techs=['mining'];q.techs=['mining'];p.civics=q.civics=['code'];p.visible=[];p.explored=[];p.knownTiles={};p.knownCities={};p.contacts={};g.turn=1;diplomaticIntelligence(g);assert.equal(p.knownCities[enemy.id].tile,enemy.tile);assert(p.explored.includes(enemy.tile));assert(!p.visible.includes(enemy.tile));const out=E.snapshot(g,0);assert.equal(out.players[1].eraScore,R.eraScore(q));assert.equal(out.players[1].gold,undefined);assert.deepEqual(out.players[1].capitalIntelligence,{tile:enemy.tile,name:enemy.name,owner:1});assert(!out.cities.some(n=>n.id===enemy.id));
  const near=neighbors(g.map,g.map.tiles[c.tile])[0];near.owner=1;near.resource='oil';near.improvement='well';near.district={item:'industrial',city:enemy.id};g.turn=5;diplomaticIntelligence(g);assert(!p.knownTiles[near.id]);g.turn=10;diplomaticIntelligence(g);assert.equal(p.knownTiles[near.id].owner,1);assert.equal(p.knownTiles[near.id].resource,null);assert.equal(p.knownTiles[near.id].district,null);assert(!p.visible.includes(near.id));assert(!E.observation(g,p).enemies.length);
  pass('Meeting reveals capital location and era score; timed frontier reports disclose static ownership without troops, facilities, finances or city HP');
 }
 {
  const {g,p,q,c}=field();p.techs=['mining'];q.techs=['mining'];p.civics=['code'];q.civics=['code'];see(g);const similar=geopoliticalPressure(g,p,q);p.techs=Object.keys(R.TECHS);p.civics=Object.keys(R.CIVICS);see(g);const weak=geopoliticalPressure(g,p,q);assert(weak.eraPressure>similar.eraPressure);assert(weak.nearbyWeakRival);W.beginWar(g,p,q,E.event);for(const t of neighbors(g.map,g.map.tiles[c.tile]).slice(0,4))E.addUnit(g,0,'modernarmor',t.id);see(g);const offer={from:q.id,to:p.id,terms:normalizeTerms({mode:'white'})};assert.doesNotThrow(()=>validateTerms(g,offer,{accept:true}));const a=peaceAssessment(g,p,offer);assert(!a.accept);assert.notEqual(a.reason,'目前无法兑现条款。');q.techs=[...p.techs];q.civics=[...p.civics];p.planRevision++;see(g);const peer=peaceAssessment(g,p,offer);assert(peer.score>a.score,'A comparable rival has more peace leverage than the weaker state');metrics.geopolitics={similar,weak,peace:a,peerPeace:peer};
  pass('Comparable nearby eras create rivalry; a much weaker nearby state raises pressure and reduces the stronger native state’s willingness to settle');
 }
 {
  const {g,p,q,enemy}=field(4),ally=g.players[2],helper=g.players[3];const sim=new RealtimeSimulation(g);g.realtime.time=100;g.realtime.nextEconomy=120;ally.relations[1].status=q.relations[2].status='alliance';W.beginWar(g,p,q,E.event);const before=ally.relations[0].grievances;const attacker=E.addUnit(g,0,'artillery',neighbors(g.map,g.map.tiles[enemy.tile])[0].id);see(g);E.applyAction(g,p,{type:'attack',unit:attacker.id,targetCity:enemy.id});assert(ally.relations[0].grievances>=before+45);assert(helper.relations[0].condemnedUntil>100);assert.equal(g.diplomacy.agendas.length,1);const amount=helper.relations[0].grievances;ready(g,attacker);E.applyAction(g,p,{type:'attack',unit:attacker.id,targetCity:enemy.id});assert.equal(helper.relations[0].grievances,amount);
  const agenda=g.diplomacy.agendas[0],aidGold=helper.gold,receiver=q.gold;const mine=neighbors(g.map,g.map.tiles[g.cities[3].tile])[0];mine.owner=3;mine.resource='iron';mine.improvement='mine';const mine2=neighbors(g.map,mine).find(t=>t.id!==g.cities[3].tile);mine2.owner=3;mine2.resource='iron';mine2.improvement='mine';W.voteAid(g,helper,agenda.id,'aid',E.event);for(const t of neighbors(g.map,g.map.tiles[g.cities[2].tile]).slice(0,4))E.addUnit(g,2,'infantry',t.id);ally.manual=false;W.diplomacyTurn(g,E.event);assert.equal(agenda.votes[2].choice,'join');g.realtime.time=160;g.realtime.nextEconomy=180;W.diplomacyTurn(g,E.event);assert(helper.gold<aidGold&&q.gold>receiver);assert.equal(agenda.votes[3].deliveredResource,'iron');assert.equal(effectiveSupplies(g)[q.id].iron,1);assert.equal(ally.relations[0].status,'war');assert.equal(E.restore(E.serialize(g)).diplomacy.agendas[0].votes[3].deliveredResource,'iron');sim.dispose();
  pass('Actual city damage triggers throttled condemnation, strong allied grievances, native coalition intervention and real gold/strategic resource aid');
 }
 {
  const g=E.createGame({size:'massive',seed:'SIXTEEN-COUNCIL',barbarians:false});for(const p of g.players){E.foundCity(g,p,g.units.find(u=>u.owner===p.id&&u.type==='settler'));p.manual=false;}g.units=[];g.turn=41;congressTurn(g,E.event);assert.equal(g.congress.current.participants.length,16);assert.equal(E.restore(E.serialize(g)).congress.current.participants.length,16);g.turn=45;congressTurn(g,E.event);assert.equal(g.congress.history[0].participants.length,16);assert.equal(E.restore(E.serialize(g)).congress.history[0].participants.length,16);
  pass('All sixteen nations participate in live and resolved congresses that validate and resume from saves');
 }
 {
  const {g,p}=field(6);const types=Object.keys(ALLIANCES);for(let id=1;id<=5;id++){E.applyAction(g,p,{type:'friendship',player:id});const friend=g.court.offers.find(o=>o.from===0&&o.to===id&&o.kind==='friendship'&&o.status==='pending');E.applyAction(g,g.players[id],{type:'acceptCourt',offer:friend.id});}g.turn+=6;for(let id=1;id<=5;id++){E.applyAction(g,p,{type:'typedAlliance',player:id,allianceType:types[id-1]});const offer=g.court.offers.find(o=>o.from===0&&o.to===id&&o.kind==='typedAlliance'&&o.status==='pending');E.applyAction(g,g.players[id],{type:'acceptCourt',offer:offer.id});}assert.equal(Object.values(p.relations).filter(r=>r.status==='alliance').length,5);assert.equal(new Set(Object.values(p.relations).filter(r=>r.status==='alliance').map(r=>r.allianceType)).size,5);assert.throws(()=>E.applyAction(g,p,{type:'typedAlliance',player:1,allianceType:'military'}));
  pass('Five distinct typed alliances require bilateral friendship and consent; duplicate alliance proposals reject');
 }
 {
  const {g,p,c}=field();assert(!E.buildable(g,p,c,'satellite'));const pad=neighbors(g.map,g.map.tiles[c.tile])[0];pad.owner=0;pad.district={item:'spaceport',city:c.id};c.districts.push({item:'spaceport',tile:pad.id});c.buildings.push('spaceport');assert(E.buildable(g,p,c,'satellite'));pad.pillaged=true;assert(!E.buildable(g,p,c,'satellite'));pad.pillaged=false;
  for(const item of ['satellite','moon','colony']){E.applyAction(g,p,{type:'produce',city:c.id,item});c.production.progress=E.orderCost(g,c);E.finishTurn(g,{actions:false});}
  assert.equal(p.spaceStage,3);assert.equal(E.snapshot(g).visuals.events.filter(e=>e.kind==='launch').length,1);assert(p.spaceLaunchDone);assert(E.restore(E.serialize(g)).players[0].spaceLaunchDone);const legacy=JSON.parse(E.serialize(g));delete legacy.players[0].spaceLaunchDone;assert(E.restore(JSON.stringify(legacy)).players[0].spaceLaunchDone);
  pass('Only a functioning owned spaceport enables projects; all three milestones progress but the nation launches exactly once, including after save/load');
 }
 {
  const g=E.restore(before.toString());assert.equal(g.turn,JSON.parse(before).turn);assert.equal(g.players.length,JSON.parse(before).players.length);assert.equal(g.maxTurns,JSON.parse(before).maxTurns);assert(g.players.every(p=>Object.values(p.relations).filter(r=>r.status==='alliance').length<=5));assert.equal(g.units.length,JSON.parse(before).units.length);assert.equal(g.map.tiles.length,JSON.parse(before).map.tiles.length);assert.equal(E.serialize(E.restore(E.serialize(g))),E.serialize(g));const bad=JSON.parse(E.serialize(g));bad.players[0].spaceLaunchDone='yes';assert.throws(()=>E.restore(JSON.stringify(bad)));bad.players[0].spaceLaunchDone=false;bad.cities[0].faithPressure={secular:-1};assert.throws(()=>E.restore(JSON.stringify(bad)));bad.cities[0].faithPressure={secular:0};bad.players[0].religion='invalid';assert.throws(()=>E.restore(JSON.stringify(bad)));
  pass('Current saved world migrates in memory without losing entities or progress; invalid religion and launch states are rejected');
 }
 assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));pass('Current active save remains byte-identical; no desktop or actual game server was launched');
 await writeFile(new URL('../output/world-systems-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,units:Object.keys(R.UNITS).length,techs:Object.keys(R.TECHS).length,activeSaveSha256:createHash('sha256').update(before).digest('hex'),activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
}finally{pool.dispose();}
