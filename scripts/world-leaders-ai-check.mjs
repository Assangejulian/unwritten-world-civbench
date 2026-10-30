// Real engine/native checks use disposable worlds and never start the game server.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createGame,addUnit,applyAction,reachable,attackTargets,refreshVisibility,observation,snapshot,serialize,restore,cityYields,housing,unitStrength,productionMultiplier,tradeCapacity} from '../src/engine.mjs';
import {neighbors,tilesInRange} from '../src/world.mjs';
import {LEGACY_LEADERS as LEADERS,dist,UNITS} from '../src/rules.mjs';
import {developmentPlan,militaryAssessment} from '../src/strategy.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(players=2){const g=createGame({seed:'WORLD-LEADERS-ONLY',players,size:'small',barbarians:false});for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,camp:false,ruin:false});return g;}
{
 const g=field(),row=20,left=g.map.tiles[row*g.map.width],right=g.map.tiles[row*g.map.width+g.map.width-1];
 assert.equal(dist(left,right,g.map),1);assert(neighbors(g.map,left).some(t=>t.id===right.id));assert(tilesInRange(g.map,left,2).some(t=>t.id===right.id));assert(!neighbors(g.map,g.map.tiles[0]).some(t=>t.row===g.map.height-1));
 const unit=g.units.find(u=>u.owner===0&&u.type==='warrior');g.units=[unit];delete unit.linkedUnit;unit.tile=left.id;refreshVisibility(g);assert(g.players[0].visible.includes(right.id));
 const move=reachable(g,g.players[0],unit,true).find(m=>m.tile===right.id);assert.equal(move.cost,1);assert.deepEqual(move.path,[left.id,right.id]);
 const sim=new RealtimeSimulation(g);sim.enqueue(g.players[0],[{type:'move',unit:unit.id,tile:right.id}]);sim.tick(.05);assert(unit.activity);const clone=restore(serialize(g)),copy=new RealtimeSimulation(clone);sim.tick(2);copy.tick(2);assert.equal(unit.tile,right.id);assert.deepEqual(JSON.parse(serialize(g)),JSON.parse(serialize(clone)));sim.dispose();copy.dispose();
 const foe=addUnit(g,1,'warrior',left.id);unit.type='archer';unit.acted=false;unit.moves=2;g.players[0].relations[1]={status:'war'};refreshVisibility(g);assert(attackTargets(g,g.players[0],unit).some(a=>a.targetUnit===foe.id));
 g.map.wrapX=false;assert.equal(dist(left,right,g.map),g.map.width-1);assert(!neighbors(g.map,left).some(t=>t.id===right.id));pass('Seam neighbors, visibility, movement, ranged attacks and saved active paths share the same horizontal topology; poles stay bounded');
}
{
 const g=field(8);for(const p of g.players)assert.doesNotThrow(()=>applyAction(g,p,{type:'found',unit:g.units.find(u=>u.owner===p.id&&u.type==='settler').id}));
 for(const p of g.players)p.leaderKey=LEADERS[p.id].key;
 const sim=new RealtimeSimulation(g),baseline=g.players.map(p=>{const c=g.cities.find(c=>c.owner===p.id);c.buildings.push('shrine','amphitheater','museum');return {y:cityYields(g,c),housing:housing(g,c),combat:unitStrength(g,g.units.find(u=>u.owner===p.id&&u.type==='warrior')),production:productionMultiplier(p,'warrior',0),trade:tradeCapacity(g,p)};});
 assert.equal(new Set(g.players.map(p=>p.leaderKey)).size,8);assert.equal(new Set(LEADERS.map(l=>l.skill)).size,8);
 for(const p of g.players){assert.doesNotThrow(()=>applyAction(g,p,{type:'leaderAbility'}));assert.throws(()=>applyAction(g,p,{type:'leaderAbility'}));const c=g.cities.find(c=>c.owner===p.id),y=cityYields(g,c),effects=LEADERS[p.id].effects,b=baseline[p.id];for(const key of ['science','food','gold','culture','faith','production','tourism'])if(effects[key])assert(y[key]>b.y[key],key+' must affect actual yields');if(effects.housing)assert.equal(housing(g,c),b.housing+1);if(effects.combat)assert.equal(unitStrength(g,g.units.find(u=>u.owner===p.id&&u.type==='warrior')),b.combat+effects.combat);if(effects.tradeCapacity)assert.equal(tradeCapacity(g,p),b.trade+1);if(effects.militaryProduction)assert(productionMultiplier(p,'warrior',0)>b.production);}
 const sea=addUnit(g,5,'galley',g.units.find(u=>u.owner===5).tile),boosted=unitStrength(g,sea),boostedProduction=productionMultiplier(g.players[5],'galley',0);
 const restored=restore(serialize(g));assert.deepEqual(restored.players.map(p=>p.leaderAbility),g.players.map(p=>p.leaderAbility));assert.equal(snapshot(g,0).players[1].leaderAbility,undefined);assert.equal(snapshot(g,0).players[1].doctrine,undefined);
 g.realtime.time=40;sim.ready();assert.equal(cityYields(g,g.cities.find(c=>c.owner===0)).science,baseline[0].y.science);assert.equal(unitStrength(g,sea),boosted-5);assert(productionMultiplier(g.players[5],'galley',40)<boostedProduction);assert.throws(()=>applyAction(g,g.players[0],{type:'leaderAbility'}));g.realtime.time=120;assert.doesNotThrow(()=>applyAction(g,g.players[0],{type:'leaderAbility'}));
 const bad=JSON.parse(serialize(g));bad.players[0].leaderKey='legion';assert.throws(()=>restore(JSON.stringify(bad)));bad.players[0].leaderKey='astral';bad.players[0].doctrineReadyAt=-1;assert.throws(()=>restore(JSON.stringify(bad)));sim.dispose();pass('All eight unique leader skills affect real yields/combat/housing/trade/production, expire at 40 seconds, cool down for 120, save correctly and protect private state');
}
{
 const g=field(3),p=g.players[0];for(const owner of g.players)applyAction(g,owner,{type:'found',unit:g.units.find(u=>u.owner===owner.id&&u.type==='settler').id});
 const own=g.cities[0],other=g.cities[1];own.tile=20*g.map.width;other.tile=own.tile+g.map.width-3;g.units=[];
 for(let i=0;i<6;i++)addUnit(g,0,'swordsman',own.tile+i);const enemy=addUnit(g,1,'warrior',other.tile);refreshVisibility(g);
 p.explored=g.map.tiles.map(t=>t.id);p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));p.knownCities={[other.id]:{...other}};p.visible=[other.tile];
 const weak=militaryAssessment(g,p,g.players[1],u=>unitStrength(g,u));assert(weak.landTarget&&weak.distance===3&&weak.ratio>1);
 const hidden=addUnit(g,1,'tank',3*g.map.width+40),unchanged=militaryAssessment(g,p,g.players[1],u=>unitStrength(g,u));assert.deepEqual(unchanged,weak);enemy.type='tank';const strong=militaryAssessment(g,p,g.players[1],u=>unitStrength(g,u));assert(strong.opportunity<weak.opportunity);
 for(const t of g.map.tiles.filter(t=>t.col===g.map.width-2||t.col===1))t.terrain='ocean';p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,{...t}]));g.turn++;assert(!militaryAssessment(g,p,g.players[1],u=>unitStrength(g,u)).landTarget);p.techs.push('sailing');assert(!militaryAssessment(g,p,g.players[1],u=>unitStrength(g,u)).seaTarget);p.techs.push('celestial');assert(militaryAssessment(g,p,g.players[1],u=>unitStrength(g,u)).seaTarget);g.units=g.units.filter(u=>u.id!==hidden.id);
 const beforeScience=cityYields(g,own).science;p.doctrine='academy';p.strategy='science';const science=developmentPlan(g,p);assert.equal(science.goal,'science');assert(cityYields(g,own).science>beforeScience);p.doctrine='devotion';p.strategy='religion';const religion=developmentPlan(g,p);assert.equal(religion.goal,'religion');assert(religion.weights.faith>science.weights.faith);p.strategy='adaptive';p.doctrine='balanced';p.spaceStage=2;assert(developmentPlan(g,p).weights.science>=3);
 pass('Nearby weak known enemies rank above strong armies; hidden reinforcements do not leak, sea barriers block land war planning, and doctrine/victory plans change actual priorities and yields');
 metrics.military={weak,strong};
}
{
 const g=field(2),p=g.players[1];applyAction(g,p,{type:'found',unit:g.units.find(u=>u.owner===p.id&&u.type==='settler').id});for(let i=0;i<5;i++)addUnit(g,p.id,'warrior',g.units.find(u=>u.owner===p.id).tile+i);g.turn=40;refreshVisibility(g);
 const pool=new NativeDriverPool();try{
  const base=observation(g,p),near={type:'war',player:0,hint:{distance:4,nearbyPower:400,theirPower:70,confidence:.65,opportunity:62,landTarget:true}},far={type:'war',player:2,hint:{distance:28,nearbyPower:400,theirPower:40,confidence:.65,opportunity:45,landTarget:true}},strong={type:'war',player:3,hint:{distance:3,nearbyPower:400,theirPower:700,confidence:.65,opportunity:15,landTarget:true}};
  const result=await pool.execute(p,{...base,legalActions:[far,strong,near]});assert.equal(result.orders.find(a=>a.type==='war')?.player,0);
  const isolated=await pool.execute(p,{...base,legalActions:[{...near,hint:{...near.hint,landTarget:false}}]});assert(!isolated.orders.some(a=>a.type==='war'));
  const unit=base.units.find(u=>u.type==='warrior');unit.hp=35;const suicide={type:'attack',unit:unit.id,targetUnit:999,hint:{health:100,expectedDamage:9,retaliation:80,ranged:false}},heal={type:'fortify',unit:unit.id};const retreat=await pool.execute(p,{...base,legalActions:[suicide,heal]});assert(!retreat.orders.some(a=>a.type==='attack'));assert(retreat.orders.some(a=>a.type==='fortify'));
  const city=base.cities[0],campus={type:'produce',city:city.id,item:'campus',hint:{kind:'district',cost:60,adjacency:0,population:4}},holy={...campus,item:'holy'};
  const plan=weights=>({...base,player:{...base.player,plan:{weights,maxCities:5}},legalActions:[campus,holy]});
  const academic=await pool.execute(p,plan({science:3.5,faith:.1,culture:1,growth:1,commerce:1,industry:1,aggression:.5,naval:.2})),religious=await pool.execute(p,plan({science:.1,faith:3.5,culture:1,growth:1,commerce:1,industry:1,aggression:.5,naval:.2}));assert.equal(academic.orders[0]?.item,'campus');assert.equal(religious.orders[0]?.item,'holy');assert(result.orders.length<=128);
  const academicPlayer=g.players[0];applyAction(g,academicPlayer,{type:'found',unit:g.units.find(u=>u.owner===0&&u.type==='settler').id});academicPlayer.strategy='religion';const actual=observation(g,academicPlayer),ownCity=actual.cities[0];const directed=await pool.execute(academicPlayer,{...actual,legalActions:[{...campus,city:ownCity.id},{...holy,city:ownCity.id}]});assert.equal(directed.orders[0]?.item,'holy');
  const site=g.map.tiles[20*g.map.width+20],nearSite=g.map.tiles[site.id+2],settlers=[{id:500,type:'settler',owner:p.id,tile:site.id},{id:501,type:'settler',owner:p.id,tile:nearSite.id}],foundation=await pool.execute(p,{...base,tiles:[site,nearSite],units:settlers,legalActions:settlers.map(u=>({type:'found',unit:u.id,hint:{settlement:90}}))});assert.equal(foundation.orders.filter(a=>a.type==='found').length,1);
  pass('Compiled C++ drivers select nearby weaker opponents, reject unreachable wars and suicidal attacks, follow explicit development plans and reserve spacing between simultaneous new cities');
 }finally{pool.dispose();}
 let finish;const pending=new Promise(resolve=>{finish=resolve;}),sim=new RealtimeSimulation(g,{execute:()=>pending,maxDrivers:1});sim.play();await sim.plan();p.planRevision++;g.players[0].planRevision++;finish({orders:[{type:'leaderAbility'}],memory:{stale:true},ms:1,stderr:''});await Promise.all([...sim.jobs.values()]);assert.equal(Object.values(g.realtime.queues).flat().length,0);sim.dispose();pass('Changing national plans rejects an already running stale C++ response');
}
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));pass('Current turn-'+JSON.parse(before).turn+' save remains byte-identical with no actual server or desktop');
await writeFile(new URL('../output/world-leaders-ai-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics},null,2));
