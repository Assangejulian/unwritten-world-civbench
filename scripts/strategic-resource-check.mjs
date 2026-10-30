import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {battlefield,see} from './air-warfare-check.mjs';
const checks=[],metrics={drivers:[]},pass=s=>{checks.push(s);console.log('PASS '+s);};
const input=JSON.parse(await readFile(new URL('../output/han-modernization-inspection.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../'+input.file,import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
function field(){
 const f=battlefield();f.p.manual=false;for(const t of f.g.map.tiles)if(t.owner===0&&!t.district&&t.cityId==null&&!t.resource)t.improvement='farm';
 f.tile(8,15).improvement=null;f.home.production={item:'festival',progress:0,cost:R.productionCost(f.g,'festival')};see(f.g);return f;
}
export function economicField(population=10){
 const f=battlefield();f.p.manual=false;f.home.population=population;f.home.production={item:'festival',progress:0,cost:R.productionCost(f.g,'festival')};
 for(const t of f.g.map.tiles)if(t.owner===0&&!t.resource&&!t.district&&t.cityId==null)Object.assign(t,{terrain:'desert',hill:true,improvement:'mine'});
 const food=f.tile(12,15),stone=f.tile(9,14);for(const [t,resource]of [[food,'wheat'],[stone,'stone']])Object.assign(t,{owner:0,territoryCity:f.home.id,terrain:'plains',hill:false,resource,improvement:null,feature:null});
 if(population===2)f.home.buildings.push('granary','watermill');see(f.g);return {...f,food,stone};
}
export function luxuryField(){const f=economicField(2);f.food.resource='silk';f.stone.resource='gems';Object.assign(f.tile(8,13),{owner:0,territoryCity:f.home.id,resource:'gems',improvement:'mine'});see(f.g);return f;}
function unitObservation(g,p,id){const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===id);return obs;}
export async function check(){const pool=new NativeDriverPool();try{
 {
  const g=E.restore(bytes.toString()),p=g.players[9],oil=g.map.tiles.filter(t=>t.owner===p.id&&t.resource==='oil');assert.equal(oil.length,16);assert.equal(g.units.filter(u=>u.owner===p.id&&u.type==='builder').length,0);assert(!E.playerResources(g,p).oil);
  const obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'&&a.hint.resourceWorkerTarget===1));assert(!obs.legalActions.some(a=>a.type==='produce'&&['catapult','trebuchet','bombard','cavalry'].includes(a.item)));
  for(const civ of R.CIVS){p.driver.file=civ.file;const result=await pool.execute(p,obs),workers=result.orders.filter(a=>a.type==='produce'&&a.item==='builder');assert.equal(workers.length,1,civ.file+' must reserve one missing-oil worker instead of ordinary culture');metrics.drivers.push({file:civ.file,builders:workers.length,city:workers[0].city});}
  pass('The frozen real Han world has sixteen undeveloped oil tiles; all eight native drivers reserve exactly one supply worker and cannot newly recruit retired models');
 }
 {
  const {g,p,home,tile}=field();assert(g.map.tiles.filter(t=>t.owner===0&&t.improvement).length>=5);const sim=new RealtimeSimulation(g);let builder,worked=false,seconds=0;
  try{for(;seconds<160;seconds+=2){const obs=E.observation(g,p),out=await pool.execute(p,obs);sim.enqueue(p,out.orders);sim.tick(2);builder=g.units.find(u=>u.owner===0&&u.type==='builder');if(E.playerResources(g,p).oil){worked=true;break;}}
   assert(worked,'The real native worker did not complete an oil well');assert.equal(tile(8,15).improvement,'well');assert(builder&&builder.charges<3);assert(g.events.some(e=>e.player===0&&e.type==='build'&&e.text.includes('油井')));
   const options=E.productionOptions(g,p,home);assert(options.some(o=>o.item==='stealthbomber'));assert(options.some(o=>o.item==='modernarmor'));assert(options.some(o=>o.item==='rocketartillery'));metrics.controlledSeconds=seconds+2;metrics.unlocked=options.filter(o=>['stealthbomber','modernarmor','rocketartillery'].includes(o.item)).map(o=>o.item);
  }finally{sim.dispose();}
  pass('With ordinary farms already saturated, actual recruitment, timed worker movement and charge-paid oil development restore legal modern aircraft, armor and artillery');
 }
 {
  const {g,p,home}=field();home.production={item:'builder',progress:0,cost:R.productionCost(g,'builder')};let obs=E.observation(g,p);let out=await pool.execute(p,obs);assert(!out.orders.some(a=>a.type==='produce'&&a.item==='builder'));
  for(const [label,work,manual]of [['funded',{item:'festival',progress:0,cost:100,funded:true},false],['half-complete',{item:'festival',progress:60,cost:100},false],['space-stage',{item:'satellite',progress:0,cost:R.productionCost(g,'satellite')},false],['manual',{item:'festival',progress:0,cost:100},true]]){home.production=work;p.manual=manual;obs=E.observation(g,p);assert(!obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'),label+' production was displaced');}
 pass('An existing worker queue satisfies the bounded supply reservation; manual, funded, half-complete and scientific-stage work is protected');
 }
 {
  const {g,p,home,tile}=field();p.techs=p.techs.filter(k=>k!=='celestial');for(let y=8;y<=12;y++)for(let x=28;x<=32;x++)tile(x,y).terrain='ocean';Object.assign(tile(30,10),{terrain:'grass',owner:0});const worker=E.addUnit(g,0,'builder',tile(30,10).id);see(g);
  let obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'&&a.hint.resourceWorkerTarget===2));
  for(const civ of R.CIVS){p.driver.file=civ.file;const out=await pool.execute(p,obs);assert.equal(out.orders.filter(a=>a.type==='produce'&&a.item==='builder').length,1,civ.file+' counted a disconnected worker as oil coverage');}
  worker.tile=tile(12,15).id;see(g);obs=E.observation(g,p);assert(!obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'));
  g.realtime.queues[0]=[{manual:true,action:{type:'move',unit:worker.id,tile:tile(11,15).id}}];obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'&&a.hint.resourceWorkerTarget===2));
  pass('All eight native players recruit one reachable supply worker when an island worker cannot cross ocean; reachable workers satisfy coverage and manual unit orders remain reserved');
 }
 {
  const {g,p,home,tile}=field(),oil=tile(8,15);oil.feature='forest';const worker=E.addUnit(g,0,'builder',tile(12,15).id);worker.charges=1;see(g);let obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'&&a.hint.resourceWorkerTarget===2));assert((await pool.execute(p,obs)).orders.some(a=>a.type==='produce'&&a.item==='builder'));
  worker.charges=2;obs=E.observation(g,p);assert(!obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'));g.units=g.units.filter(u=>u!==worker);g.realtime.queues[0]=[{action:{type:'produce',city:home.id,item:'builder'}}];obs=E.observation(g,p);assert(!obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'));
  g.realtime.queues[0]=[];p.techs=p.techs.filter(k=>k!=='celestial');for(let y=8;y<=12;y++)for(let x=28;x<=32;x++)tile(x,y).terrain='ocean';tile(30,10).terrain='grass';const remote=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(30,10).id));remote.production={item:'builder',progress:0,cost:R.productionCost(g,'builder')};see(g);obs=E.observation(g,p);assert.equal((await pool.execute(p,obs)).orders.filter(a=>a.type==='produce'&&a.item==='builder').length,1);
  pass('Forest clearing requires two actual charges; a reachable queued worker covers demand while a disconnected city queue does not suppress local recruitment');
 }
 {
  const {g,p,home,tile}=field();for(const d of home.districts)tile(g.map.tiles[d.tile].col,g.map.tiles[d.tile].row).district=null;home.districts=[];home.buildings=home.buildings.filter(k=>k!=='airport');home.production=null;tile(8,15).resource=null;const oil=tile(12,15);Object.assign(oil,{owner:0,resource:'oil',improvement:'well'});see(g);
  assert(E.buildable(g,p,home,'airport',oil.id));assert(E.productionOptions(g,p,home).filter(a=>a.item==='airport').every(a=>a.tile!==oil.id));
  const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&a.item==='airport');assert(obs.legalActions.length);const fuel={...obs.legalActions[0],tile:oil.id,hint:{...obs.legalActions[0].hint,strategicDeposit:true}};obs.legalActions.unshift(fuel);let chosen;
  for(const civ of R.CIVS){p.driver.file=civ.file;chosen=(await pool.execute(p,obs)).orders.find(a=>a.type==='produce');assert(chosen&&chosen.tile!==oil.id,civ.file+' destroyed its only oil supply for an airport');}
  home.storedProduction=R.productionCost(g,'airport');E.applyAction(g,p,chosen);E.finishTurn(g,{actions:false});assert(home.buildings.includes('airport'));assert.equal(oil.improvement,'well');assert(E.playerResources(g,p).oil>0);
  home.buildings=home.buildings.filter(k=>k!=='airport');home.production=null;p.manual=true;assert(E.buildable(g,p,home,'airport',oil.id));E.applyAction(g,p,{type:'produce',city:home.id,item:'airport',tile:oil.id});assert.equal(home.production.tile,oil.id);
  p.techs=p.techs.filter(k=>k!==R.RESOURCES.oil.tech);p.manual=false;assert(E.productionOptions(g,p,home).filter(a=>a.item==='spaceport').every(a=>!a.strategicDeposit));
  pass('All eight native players preserve revealed strategic deposits even among legal high-value airport sites; completed construction retains real oil, manual placement stays legal and unrevealed oil creates no preference');
 }
 {
  const {g,p,home,food,stone}=economicField(),worker=E.addUnit(g,0,'builder',stone.id);see(g);let obs=unitObservation(g,p,worker.id);assert(obs.cities.find(c=>c.id===home.id).yields.netFood<0);assert(obs.legalActions.some(a=>a.type==='move'&&a.hint.improveTarget===food.id&&a.hint.resourceCategory==='bonus'));
  metrics.resourceDrivers=[];for(const civ of R.CIVS){p.driver.file=civ.file;assert.equal((await pool.execute(p,obs)).orders.find(a=>a.unit===worker.id)?.type,'move',civ.file+' improved stone while the city was starving');metrics.resourceDrivers.push({file:civ.file,starvation:'food'});}
  home.population=2;home.buildings.push('granary','watermill');see(g);obs=unitObservation(g,p,worker.id);assert(obs.cities.find(c=>c.id===home.id).yields.netFood>=2);for(const civ of R.CIVS){p.driver.file=civ.file;const a=(await pool.execute(p,obs)).orders.find(a=>a.unit===worker.id);assert.equal(a?.type,'improve');assert.equal(a.item,'quarry');}
  pass('All eight native drivers travel past nearby stone to recover a genuinely starving city, then prefer local production when real food income is healthy');
 }
 {
  const {g,p,food,stone}=luxuryField(),worker=E.addUnit(g,0,'builder',stone.id);see(g);const obs=unitObservation(g,p,worker.id),local=obs.legalActions.find(a=>a.type==='improve');assert.equal(local.hint.resourceCategory,'luxury');assert.equal(local.hint.resourceCopies,1);assert.equal(local.hint.resourceFirstValue,0);assert(obs.legalActions.some(a=>a.type==='move'&&a.hint.improveTarget===food.id&&a.hint.resourceType==='silk'&&a.hint.resourceFirstValue>0));
  for(const civ of R.CIVS){p.driver.file=civ.file;assert.equal((await pool.execute(p,obs)).orders.find(a=>a.unit===worker.id)?.type,'move',civ.file+' preferred duplicate gems to the first silk supply');metrics.resourceDrivers.find(d=>d.file===civ.file).luxury='first type';}
  pass('All eight native drivers value first extracted silk above a nearer duplicate gem deposit while retaining the actual yields of both luxury improvements');
 }
 {
  const {g,p,home,food,stone,tile}=luxuryField(),worker=E.addUnit(g,0,'builder',food.id);see(g);let obs=unitObservation(g,p,worker.id),normal=obs.legalActions.find(a=>a.type==='improve').hint.resourceFirstValue;home.population=12;see(g);obs=unitObservation(g,p,worker.id);assert(obs.legalActions.find(a=>a.type==='improve').hint.resourceFirstValue>normal,'Unhappy cities should increase the first luxury benefit');
  Object.assign(tile(49,35),{owner:2,resource:'silk',improvement:'plantation'});g.diplomacy.pacts.push({id:g.diplomacy.nextId++,from:2,to:0,tradeShare:0,resource:'silk',resourceAmount:1,startsAt:0,endsAt:g.realtime.time+1000,status:'active',surrender:false});see(g);assert.equal(E.playerResources(g,p).silk,1);obs=unitObservation(g,p,worker.id);assert.equal(obs.legalActions.find(a=>a.type==='improve').hint.resourceFirstValue,0,'Borrowed silk already supplies amenities');
  g.diplomacy.pacts.push({id:g.diplomacy.nextId++,from:0,to:2,tradeShare:0,resource:'gems',resourceAmount:1,startsAt:0,endsAt:g.realtime.time+1000,status:'active',surrender:false});worker.tile=stone.id;see(g);assert(!E.playerResources(g,p).gems);assert(unitObservation(g,p,worker.id).legalActions.find(a=>a.type==='improve').hint.resourceFirstValue>0,'Exporting the only gem supply makes another deposit useful');
  pass('First-luxury value grows with actual amenity deficits and respects incoming supplies and exported last copies instead of raw owned deposit counts');
 }
 {
  const {g,p,food,stone}=luxuryField(),worker=E.addUnit(g,0,'builder',stone.id);food.feature='forest';worker.charges=1;see(g);assert(unitObservation(g,p,worker.id).legalActions.filter(a=>a.type==='move').every(a=>a.hint.improveTarget!==food.id));worker.charges=3;see(g);const sim=new RealtimeSimulation(g);try{for(let elapsed=0;elapsed<100&&!E.playerResources(g,p).silk;elapsed+=5){const out=await pool.execute(p,unitObservation(g,p,worker.id));sim.enqueue(p,out.orders);sim.tick(5);}assert.equal(food.feature,null);assert.equal(food.improvement,'plantation');assert(E.playerResources(g,p).silk>0);assert(worker.charges<=1);}finally{sim.dispose();}
  pass('A first luxury behind forest requires two real charges and a reachable plan; the native worker actually clears it and completes an extracted plantation');
 }
 {
  for(const setup of [()=>economicField(),()=>luxuryField()]){const {g,p}=setup();if(g.cities.find(c=>c.owner===p.id).population===2)p.techs=p.techs.filter(k=>k!=='rocketry');assert.equal(g.units.filter(u=>u.owner===0&&u.type==='builder').length,0);assert(g.map.tiles.filter(t=>t.owner===0&&t.improvement).length>=5);const obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.type==='produce'&&a.item==='builder'&&a.hint.economicWorkerTarget===1));for(const civ of R.CIVS){p.driver.file=civ.file;assert.equal((await pool.execute(p,obs)).orders.filter(a=>a.type==='produce'&&a.item==='builder').length,1,civ.file+' failed bounded economic recruitment');}}
  const {g,p}=economicField(2);assert(!E.observation(g,p).legalActions.some(a=>a.type==='produce'&&a.item==='builder'));
  const late=luxuryField(),science=E.observation(late.g,late.p);for(const civ of R.CIVS){late.p.driver.file=civ.file;const out=await pool.execute(late.p,science);assert(!out.orders.some(a=>a.type==='produce'&&a.item==='builder'));assert(out.orders.some(a=>a.type==='produce'&&a.item==='spaceport'));}
  const island=economicField();island.tile(8,15).resource=null;island.tile(8,15).improvement=null;island.p.techs=island.p.techs.filter(k=>k!=='celestial');for(let y=8;y<=12;y++)for(let x=28;x<=32;x++)island.tile(x,y).terrain='ocean';Object.assign(island.tile(30,10),{terrain:'grass',owner:0,resource:'oil',improvement:null});see(island.g);const isolated=E.observation(island.g,island.p);assert(isolated.legalActions.some(a=>a.type==='produce'&&a.item==='builder'&&a.hint.economicWorkerTarget===1));for(const civ of R.CIVS){island.p.driver.file=civ.file;assert.equal((await pool.execute(island.p,isolated)).orders.filter(a=>a.type==='produce'&&a.item==='builder').length,1);}
  pass('All eight drivers reserve one economic worker for real food shortages or a missing luxury despite ordinary saturation, and healthy supplied cities do not invent rescue demand');
 }
 {
  const {g,p,food,stone,tile}=luxuryField(),first=E.addUnit(g,0,'builder',stone.id),second=E.addUnit(g,0,'builder',tile(10,14).id);Object.assign(tile(11,14),{owner:0,territoryCity:g.cities[0].id,resource:'silk',improvement:null,feature:null});see(g);const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>[first.id,second.id].includes(a.unit));const out=await pool.execute(p,obs),targets=out.orders.map(a=>obs.legalActions.find(legal=>legal.type===a.type&&legal.unit===a.unit&&legal.tile===a.tile&&legal.item===a.item)?.hint).filter(Boolean);assert.equal(targets.length,2);assert(targets.filter(h=>h.resourceType==='silk'&&h.resourceFirstValue>0).length<=1);assert(new Set(targets.map(h=>h.improveTarget??h.tile)).size===2);
  pass('Simultaneous workers reserve distinct projects and cannot count the same first luxury benefit twice in one native response');
 }
 {
  const {g,p,food,stone,tile}=luxuryField(),worker=E.addUnit(g,0,'builder',stone.id);see(g);p.visible=p.visible.filter(id=>id!==food.id);p.knownTiles[food.id]={...p.knownTiles[food.id],resource:null};let obs=unitObservation(g,p,worker.id);assert(obs.legalActions.every(a=>a.hint?.resourceType!=='silk'));assert(obs.legalActions.filter(a=>a.type==='move'&&a.hint.improveTarget===food.id).every(a=>a.hint.resourceCategory==null));
  see(g);food.owner=1;see(g);obs=unitObservation(g,p,worker.id);assert(obs.legalActions.filter(a=>a.type==='move').every(a=>a.hint.improveTarget!==food.id));
  Object.assign(tile(10,14),{owner:0,road:true,roadPillaged:true});worker.tile=tile(10,14).id;see(g);obs=unitObservation(g,p,worker.id);assert(obs.legalActions.some(a=>a.type==='repair'));
  pass('Resource categories and economic routes use remembered revealed owner deposits only, exclude foreign luxuries and retain ordinary road repair');
 }
 {
  const {g,p,home,tile}=field(),oil=tile(8,15);p.visible=p.visible.filter(id=>id!==oil.id);p.knownTiles[oil.id]={...p.knownTiles[oil.id],resource:null,improvement:null};const obs=E.observation(g,p);assert(obs.legalActions.filter(a=>a.type==='produce'&&a.item==='builder').every(a=>a.hint.resourceWorkerTarget===0));
  see(g);oil.resource=null;see(g);const privateTile=g.map.tiles.find(t=>t.owner!==0&&t.cityId==null&&!t.district);privateTile.resource='oil';assert(E.observation(g,p).legalActions.filter(a=>a.type==='produce'&&a.item==='builder').every(a=>a.hint.resourceWorkerTarget===0));
  pass('Undiscovered live oil and foreign resources cannot create owner supply hints or reveal hidden deposit locations');
 }
 {
  const {g,p,home,tile}=field(),oil=tile(8,15);oil.improvement='well';oil.pillaged=true;const worker=E.addUnit(g,0,'builder',oil.id);see(g);let obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.type==='repair'&&a.unit===worker.id&&a.hint.strategicResource));let result=await pool.execute(p,obs);const repair=result.orders.find(a=>a.unit===worker.id);assert.equal(repair.type,'repair');assert(repair.priority>=2050);E.applyAction(g,p,repair);assert(E.playerResources(g,p).oil>0);
  oil.improvement=null;oil.feature='forest';worker.acted=false;worker.moves=R.UNITS.builder.moves;see(g);obs=E.observation(g,p);result=await pool.execute(p,obs);assert.equal(result.orders.find(a=>a.unit===worker.id)?.type,'chop');
  pass('Existing workers prioritize genuine oil-well repair and required forest clearing, with strategic orders admitted ahead of routine marching');
 }
 {
  const g=E.restore(bytes.toString()),p=g.players[9],sim=new RealtimeSimulation(g),start=g.realtime.time;let developed=false,calls=0;
  try{for(let elapsed=0;elapsed<120;elapsed+=5){const out=await pool.execute(p,E.observation(g,p));calls++;sim.enqueue(p,out.orders);sim.tick(5);if(g.map.tiles.some(t=>t.owner===9&&t.resource==='oil'&&t.improvement==='well'&&!t.pillaged)){developed=true;break;}}
   assert(developed,'The frozen live Han army starved its new supply worker');assert(E.playerResources(g,p).oil>0);metrics.realWorld={seconds:g.realtime.time-start,calls,oil:E.playerResources(g,p).oil};
  }finally{sim.dispose();}
  pass('An isolated replay of the actual large Han army recruits and completes a real oil well within two minutes without changing the desktop world');
 }
}finally{pool.dispose();}await writeFile(new URL('../output/strategic-resource-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,input,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/strategic-resource-check.mjs'))await check();
