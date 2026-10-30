import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {beginWar} from '../src/warfare.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {baseRange} from '../src/carrier-groups.mjs';

const checks=[],metrics={},pool=new NativeDriverPool(),air=a=>['bomber','drone'].includes(a.item),pass=name=>{checks.push(name);console.log('PASS '+name);};
function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,name:c.name,owner:c.owner,tile:c.tile}]));}}
function field(mode='funded'){
 const rich=['funded','debt'].includes(mode);
 const g=E.createGame({players:3,size:'small',seed:'AIR-RECRUITMENT',barbarians:false});g.units=[];g.cityStates={version:1,seeded:true,states:[]};
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];for(const p of g.players)Object.assign(p,{manual:true,gold:10000,met:g.players.filter(o=>o!==p).map(o=>o.id),techs:Object.keys(R.TECHS),civics:['empire','training','civilservice'],strategy:'science',spaceStage:1});
 const p=g.players[0],q=g.players[1],cities=[10,26,42].map(x=>E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,12).id)));
 for(const [i,c]of cities.entries()){c.population=8;for(const [j,item]of ['airport','spaceport'].entries()){const t=tile(11+i*16,12+j);t.owner=0;t.territoryCity=c.id;t.district={item,city:c.id,kind:'district'};c.districts.push({item,tile:t.id});c.buildings.push(item);}c.buildings.push('campus');}
 const enemy=E.foundCity(g,q,E.addUnit(g,1,'settler',tile(17,12).id));enemy.population=8;enemy.buildings=['walls','medievalwalls','renaissancewalls','steelwalls'];enemy.walls=450;E.foundCity(g,g.players[2],E.addUnit(g,2,'settler',tile(50,30).id));g.units=[];g.turn=120;
 Object.assign(tile(9,12),{owner:0,resource:'oil',improvement:'well'});for(let i=0;i<18;i++)E.addUnit(g,0,'rocketartillery',tile(8+i,30).id);
 if(rich)economy(g,p,cities,tile);const sim=new RealtimeSimulation(g);beginWar(g,p,q,E.event);see(g);const funding=fund(g,p,mode);return {g,p,q,cities,enemy,tile,sim,funding};
}
// Real income for the positive/debt fixtures, built only from engine-computed yields (no grossGold override):
//  * conscription (engine policy: halves unit salary+maintenance in rules.unitUpkeep) and internationaltrade (+5 gold per city);
//  * COMMERCE_CITIES extra rear cities with population and every gold building in rules.BUILDINGS;
//  * population 30 and improved gold mines (rules.RESOURCES.gold, improvement 'mine') on free land within 3 tiles of every own city.
//  Three commerce cities is the measured minimum that covers the bill (two fall short) while keeping the engine's
//  domestic militaryTarget (15) below the 18 existing artillery, so no ground-shortage recruitment is triggered.
// The fixture asserts grossGold >= projectedUpkeep(18 rocket artillery) + drone upkeep, i.e. deficit = 0 at sdk/civ.hpp:568-572.
const COMMERCE_CITIES=[[10,40],[26,40],[42,40]];
function economy(g,p,cities,tile){
 p.civics=[...new Set([...p.civics,'state','globalization'])];
 E.applyAction(g,p,{type:'policies',items:['conscription','internationaltrade']});
 const gold=Object.entries(R.BUILDINGS).filter(([k,b])=>b.kind!=='district'&&JSON.stringify(b).includes('gold')).map(([k])=>k);
 for(const [x,y]of COMMERCE_CITIES)cities.push(E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,y).id)));g.units=g.units.filter(u=>u.type!=='settler');
 for(const c of cities){c.population=Math.max(c.population,30);c.buildings=[...new Set([...c.buildings,...gold])];const center=g.map.tiles[c.tile];
  for(const t of g.map.tiles)if(t.id!==c.tile&&!t.district&&!t.resource&&R.dist(t,center,g.map)<=3&&(t.owner===null||t.owner===0)&&!g.cities.some(o=>o.tile===t.id))Object.assign(t,{resource:'gold',improvement:'mine',hill:true,owner:0});}
 cities.splice(3);
}
// Gold-gate funding (deficit economy only) derived from sdk/civ.hpp:571-574 with the engine's finance view:
//   bill = projectedUpkeep + unitUpkeep(air item); deficit = max(0, bill - grossGold); blocked if arrears>0.01 or deficit>0 && goldBudget < bill*3 + deficit*8;
//   commerce bias if grossGold < projectedUpkeep && goldBudget < projectedUpkeep*5. goldBudget = gold - committedGold.
function payrollRequirement(g,p){
 const obs=E.observation(g,p),f=obs.player.finance,gateFor=item=>{const delta=R.unitUpkeep(item,p).total,bill=Math.max(0,f.projectedUpkeep+delta),deficit=Math.max(0,bill-f.grossGold);return {item,upkeep:delta,bill,deficit,gate:deficit>0?bill*3+deficit*8:0};};
 const items=['drone','bomber'].map(gateFor),commerce=f.grossGold<f.projectedUpkeep?f.projectedUpkeep*5:0;
 return {projectedUpkeep:f.projectedUpkeep,grossGold:f.grossGold,items,fundedGate:Math.max(...items.map(i=>i.gate)),lowestGate:Math.min(...items.map(i=>i.gate)),commerce,committedGold:obs.player.committedGold};
}
function fund(g,p,mode){
 const req=payrollRequirement(g,p);p.militaryArrears=0;p.unpaidPeriods=0;
 if(mode==='funded'||mode==='debt'){const drone=req.items.find(i=>i.item==='drone');assert.equal(drone.deficit,0,'fixture income must cover 18 rocket artillery + one drone');if(mode==='debt'){p.militaryArrears=1;p.unpaidPeriods=1;}}
 else if(mode==='gate-insufficient')p.gold=Math.max(0,Math.ceil(req.lowestGate+req.committedGold)-1);
 else if(mode==='gate-funded')p.gold=Math.ceil(Math.max(req.fundedGate,req.commerce)+req.committedGold)+1;
 else assert.equal(mode,'structural');
 return {mode,...req,gold:p.gold,arrears:p.militaryArrears};
}
async function decide(g,p,file,filter=a=>a.type==='produce'){p.driver.file=file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(filter);return {obs,orders:(await pool.execute(p,obs)).orders};}
try{
 metrics.production=[];metrics.drivers={};const failures=[];const record=(file,scenario,ok,detail)=>{(metrics.drivers[file]??={})[scenario]=ok?'PASS':'FAIL';console.log(`${ok?'PASS':'FAIL'} [${scenario}] ${file}${detail?' '+detail:''}`);};
 for(const civ of R.CIVS){const {g,p,cities,sim,funding}=field();try{const {orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&['moon','research','bomber','drone','rocketartillery','modernarmor'].includes(a.item));metrics.funding??=funding;const planes=orders.filter(air);assert.equal(planes.length,1,civ.file+' reserves one aircraft despite the full artillery army');assert.equal(planes[0].item,'drone');assert.equal(orders.filter(a=>a.item==='moon').length,1,'Science work must remain first');assert(!orders.some(a=>['rocketartillery','modernarmor'].includes(a.item)));for(const a of orders)E.applyAction(g,p,a);const c=cities.find(c=>c.id===planes[0].city);c.production.progress=E.orderCost(g,c)-1;E.finishTurn(g,{actions:false});const plane=g.units.find(u=>u.owner===0&&u.type==='drone');assert(plane&&g.map.tiles[plane.tile].district.item==='airport');metrics.production.push({driver:civ.file,orders,plane:plane.id});record(civ.file,'funded-recruits-one-drone',true,JSON.stringify(orders.map(o=>o.item)));}catch(e){record(civ.file,'funded-recruits-one-drone',false,e.message.split('\n')[0]+' @'+(e.stack.match(/check\.mjs:(\d+:\d+)/)||[])[1]);failures.push(civ.file+' funded: '+e.message.split('\n')[0]);}finally{sim.dispose();}}
 if(!failures.length)pass('All eight actual drivers supplement full rocket-artillery armies with one real drone, reserve the slot across cities and preserve one lunar project');
 // Air-only probes on the deficit economy isolate the treasury gate from city-level competition with research/moon (otherwise the negatives would pass vacuously).
 for(const mode of ['gate-funded','gate-insufficient'])for(const civ of R.CIVS){const {g,p,sim}=field(mode);try{const {orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&air(a));const planes=orders.filter(air);const ok=mode==='gate-funded'?planes.length===1&&planes[0].item==='drone':planes.length===0;record(civ.file,mode+'-air-only',ok,JSON.stringify(orders.map(o=>o.item)));if(!ok)failures.push(civ.file+' '+mode+'-air-only');}finally{sim.dispose();}}
 for(const mode of ['structural','debt'])for(const civ of R.CIVS){const {g,p,sim,funding}=field(mode);try{const {orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&['moon','research','bomber','drone','rocketartillery','modernarmor'].includes(a.item));
  const ok=!orders.some(air)&&orders.filter(a=>a.item==='moon').length===1&&!orders.some(a=>['rocketartillery','modernarmor'].includes(a.item));(metrics.negative??={})[mode]=funding;record(civ.file,mode+'-no-expansion',ok,JSON.stringify(orders.map(o=>o.item)));if(!ok)failures.push(civ.file+' '+mode+'-no-expansion');}finally{sim.dispose();}}
 pass('A structural payroll deficit and outstanding military arrears both block air and ground expansion while research work continues');
 for(const civ of R.CIVS)for(const pending of [false,true]){const {g,p,cities,tile,sim}=field();try{if(pending)E.applyAction(g,p,{type:'produce',city:cities[0].id,item:'drone'});else E.addUnit(g,0,'bomber',tile(11,12).id);see(g);const {orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&air(a));assert.equal(orders.length,0,civ.file+' respects existing/pending aircraft');}finally{sim.dispose();}}
 pass('Owned bombers and queued drones both consume the shared aircraft slot, preventing batch-by-batch fleet inflation');
 {
  const {g,p,cities,enemy,tile,sim}=field();try{
   let obs=E.observation(g,p),rear=obs.legalActions.find(a=>a.city===cities[1].id&&a.item==='drone');assert(rear.hint.airTargets>0,'A rear airport can transfer to the reachable front airport');
   p.visible=p.visible.filter(id=>id!==enemy.tile);assert(E.observation(g,p).legalActions.some(a=>air(a)&&a.hint.airTargets>0),'Remembered war cities may inform production without granting a shot');delete p.knownCities[enemy.id];assert(E.observation(g,p).legalActions.filter(a=>air(a)).every(a=>a.hint.airTargets===0));enemy.hp=1;enemy.walls=0;assert(E.observation(g,p).legalActions.filter(a=>air(a)).every(a=>a.hint.airTargets===0));
   see(g);for(const t of g.map.tiles.filter(t=>t.col>=13&&t.col<=15||t.col>=19&&t.col<=23))t.owner=2;see(g);obs=E.observation(g,p);assert(obs.legalActions.filter(a=>air(a)).every(a=>a.hint.airTargets===0),'Closed neutral airspace blocks operational need');p.relations[2].openBorders=true;assert(E.observation(g,p).legalActions.some(a=>air(a)&&a.hint.airTargets>0));
   pass('Aircraft production requires a visible direct or legal one-transfer mission; unseen targets, isolated bases and closed neutral airspace do not create air demand');
  }catch(e){const m=e.message.split('\n')[0];console.log('FAIL [air-mission-reachability] '+m);failures.push('air-mission-reachability: '+m);}finally{sim.dispose();}
 }
 // Range boundaries derived from the real rules: strike range = carrier-groups baseRange (drone 8, or 24 once spaceStage>0),
 // one transfer = UNITS.drone.rebaseRange. The third city's airport is moved along its row to tiles chosen by measured distance.
 {
  const moveAirport=(g,c,t)=>{const d=c.districts.find(d=>d.item==='airport');const old=g.map.tiles[d.tile];if(old.id===t.id)return;old.district=null;Object.assign(t,{district:{item:'airport',city:c.id,kind:'district'},owner:0,resource:null,improvement:null});d.tile=t.id;};
  const droneTargets=(g,p,c)=>E.observation(g,p).legalActions.find(a=>a.city===c.id&&a.item==='drone')?.hint.airTargets||0;
  const cases=[];
  for(const kind of ['transfer','direct'])for(const inside of [true,false]){const {g,p,cities,enemy,sim}=field();try{
   const strike=baseRange(g,{type:'drone',owner:p.id}),rebase=R.UNITS.drone.rebaseRange,target=g.map.tiles[enemy.tile],c=cities[2],row=g.map.tiles[c.tile].row;
   const others=cities.slice(0,2).map(o=>g.map.tiles[o.districts.find(d=>d.item==='airport').tile]);
   if(kind==='direct')for(const o of cities.slice(0,2)){const d=o.districts.find(d=>d.item==='airport');g.map.tiles[d.tile].district=null;o.districts=o.districts.filter(x=>x!==d);o.buildings=o.buildings.filter(k=>k!=='airport');}
   const own=c.districts.find(d=>d.item==='airport').tile,ok=t=>!R.isWater(t)&&(!t.district||t.id===own)&&!g.cities.some(o=>o.tile===t.id)&&R.dist(t,g.map.tiles[c.tile],g.map)<=3&&!g.units.some(u=>u.tile===t.id);
   const reach=t=>kind==='direct'?R.dist(t,target,g.map)-strike:Math.min(...others.map(o=>R.dist(t,o,g.map)))-rebase;
   // inside: exactly at the limit (reach 0); outside: one tile beyond (reach 1). Transfer cases also stay beyond direct strike range.
   const spot=g.map.tiles.filter(t=>ok(t)&&reach(t)===(inside?0:1)&&(kind==='direct'||R.dist(t,target,g.map)>strike)).sort((a,b)=>(a.id===own?-1:0)-(b.id===own?-1:0)||a.id-b.id)[0];assert(spot,'boundary tile for '+kind);
   moveAirport(g,c,spot);see(g);const n=droneTargets(g,p,c);cases.push({kind,inside,strike,rebase,tile:spot.id,targetDistance:R.dist(spot,target,g.map),airTargets:n});
   assert(inside?n>0:n===0,`${kind} boundary ${inside?'inside':'outside'}: airTargets=${n}`);
  }catch(e){const m=e.message.split('\n')[0];console.log('FAIL [air-range-boundary] '+m);failures.push('air-range-boundary: '+m);}finally{sim.dispose();}}
  metrics.rangeBoundary=cases;console.log('RANGE-BOUNDARY '+JSON.stringify(cases));
  if(cases.length===4&&!failures.some(f=>f.startsWith('air-range-boundary')))pass('A far rear airport gains a drone mission exactly at the direct strike or one-transfer limit and none one tile beyond it');
 }
 for(const condition of ['peace','no-oil','disabled-airports']){const {g,p,cities,tile,sim}=field();try{if(condition==='peace')for(const player of g.players)for(const r of Object.values(player.relations))r.status='peace';if(condition==='no-oil')tile(9,12).resource=null;if(condition==='disabled-airports')for(const c of cities)g.map.tiles[c.districts.find(d=>d.item==='airport').tile].pillaged=true;see(g);const {orders}=await decide(g,p,R.CIVS[0].file,a=>a.type==='produce'&&air(a));assert.equal(orders.length,0,condition);}finally{sim.dispose();}}
 pass('Peace, missing oil and pillaged airports cannot trigger a new independent aircraft commitment');
 for(const civ of R.CIVS){const {g,p,cities,sim}=field('structural');try{for(const c of cities){const base=c.districts.find(d=>d.item==='airport');g.map.tiles[base.tile].district=null;c.districts=c.districts.filter(d=>d.item!=='airport');c.buildings=c.buildings.filter(k=>k!=='airport');}see(g);const {obs,orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&['airport','research'].includes(a.item));const forward=orders.filter(a=>a.item==='airport');assert.equal(forward.length,1,civ.file+' reserves just one useful forward-base priority');assert(obs.legalActions.some(a=>a.item==='airport'&&a.tile===forward[0].tile&&a.hint.airTargets>0));E.applyAction(g,p,forward[0]);const next=await decide(g,p,civ.file,a=>a.type==='produce'&&['airport','research'].includes(a.item));assert(!next.orders.some(a=>a.item==='airport'));}finally{sim.dispose();}}
 pass('All eight drivers reserve one useful forward airport and account for its pending construction instead of repeatedly mobilizing rear airports');
 const input=JSON.parse(await readFile(new URL('../output/air-recruitment-inspection.json',import.meta.url),'utf8'));
 const bytes=await readFile(new URL('../'+input.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
 const g=E.restore(bytes.toString()),p=g.players[2],original=await decide(g,p,p.driver.file);assert(!original.orders.some(air),'The actual isolated airports must not trigger useless aircraft');
 const targets=Object.values(p.knownCities||{}).filter(c=>c.owner!==p.id&&E.atWar(g,p.id,c.owner)).map(c=>g.map.tiles[c.tile]);
 const candidate=g.cities.filter(c=>c.owner===p.id).flatMap(c=>E.productionOptions(g,p,c).filter(o=>o.item==='airport'&&E.deploymentFree(g,o.tile)).map(o=>({c,o,distance:Math.min(...targets.map(t=>R.dist(g.map.tiles[o.tile],t,g.map)))}))).sort((a,b)=>a.distance-b.distance)[0];assert(candidate&&candidate.distance<=R.UNITS.drone.range);
 E.applyAction(g,p,{type:'produce',city:candidate.c.id,item:'airport',tile:candidate.o.tile});candidate.c.production.progress=E.orderCost(g,candidate.c)-1;E.finishTurn(g,{actions:false});
 const {obs,orders}=await decide(g,p,p.driver.file),planes=orders.filter(air);assert(planes.length<=3);assert(obs.legalActions.some(a=>air(a)&&a.hint.airTargets>0),'The completed forward airport creates a real mission independently of affordability');const finance=obs.player.finance;if(finance.arrears>.01||finance.projectedUpkeep>finance.grossGold)assert.equal(planes.length,0,'A structurally insolvent historical army must not expand merely because a mission becomes reachable');assert(planes.every(a=>a.item==='drone'));assert(!orders.some(a=>a.item==='rocketartillery'||a.item==='modernarmor'));assert(planes.every(a=>obs.legalActions.some(l=>l.type==='produce'&&l.city===a.city&&l.item===a.item&&l.hint.airTargets>0)));
 metrics.actualWorld={world:g.id,input:input.file,sha256:input.sha256,periodAtInput:input.turn,before:input.rows.find(r=>r.player===2),originalOrders:original.orders,scenario:'Frozen-save variant with one legally completed forward airport; the original input is unchanged',finance,forwardAirport:{city:candidate.c.id,tile:candidate.o.tile,distance:candidate.distance},planes,orders};
 pass('The frozen Tang input distinguishes airport reachability from actual payroll solvency without expanding its existing siege army');
 console.log('PER-DRIVER '+JSON.stringify(metrics.drivers,null,1));
 assert.deepEqual(failures,[],'Scenario failures: '+failures.join('; '));
 const sources=Object.fromEntries(await Promise.all(['src/engine.mjs','src/warfare.mjs','src/peace-terms.mjs','src/military-economy.mjs','src/realtime.mjs','src/carrier-groups.mjs','src/rules.mjs','sdk/civ.hpp','scripts/air-recruitment-check.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
 await writeFile(new URL('../output/air-recruitment-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,sources,gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
}finally{pool.dispose();}
