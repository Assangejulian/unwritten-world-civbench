import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {beginWar} from '../src/warfare.mjs';
import {developmentPlan} from '../src/strategy.mjs';
import {domesticSituation} from '../src/domestic.mjs';
import {defenseSituation} from '../src/campaign.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';

const checks=[],metrics={},pool=new NativeDriverPool(),pass=name=>{checks.push(name);console.log('PASS '+name);};
function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,owner:c.owner,name:c.name,tile:c.tile}]));}}
function field(){
 const g=E.createGame({players:2,size:'small',seed:'PRODUCTION-BALANCE',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];for(const p of g.players)Object.assign(p,{manual:false,gold:20000,met:[1-p.id],techs:Object.keys(R.TECHS),civics:['empire','training','civilservice'],strategy:'adaptive',doctrine:'mobilization',spaceStage:1});
 const p=g.players[0],q=g.players[1],cities=[10,17,24].map(x=>E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,12).id)));
 for(const [i,c] of cities.entries()){c.population=8;const t=tile(10+i*7,13);t.owner=0;t.district={item:'spaceport',city:c.id,kind:'district'};c.districts.push({item:'spaceport',tile:t.id});c.buildings.push('spaceport','campus');}
 E.foundCity(g,q,E.addUnit(g,1,'settler',tile(40,26).id));g.units=[];g.turn=120;
 Object.assign(tile(11,12),{owner:0,resource:'oil',improvement:'well'});
 const sim=new RealtimeSimulation(g);beginWar(g,p,q,E.event);see(g);return {g,p,q,cities,tile,sim};
}
function army(g,count,type='modernarmor'){for(let i=0;i<count;i++)E.addUnit(g,0,type,g.map.tiles[(22+Math.floor(i/15))*g.map.width+8+i%15].id);see(g);}
async function decide(g,p,file,filter=a=>a.type==='produce'){p.driver.file=file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(filter);return (await pool.execute(p,obs)).orders;}
try{
 {
  const {g,p,sim}=field();assert.equal(developmentPlan(g,p).goal,'science');p.strategy='domination';p.planRevision++;assert.equal(developmentPlan(g,p).goal,'domination');sim.dispose();
  pass('Completed space investment survives wartime mobilization, while an explicit domination strategy still overrides it');
 }
 for(const civ of R.CIVS){const {g,p,sim}=field();army(g,18);const orders=await decide(g,p,civ.file,a=>a.type==='produce'&&['moon','research','tank','modernarmor'].includes(a.item));assert.equal(orders.filter(a=>a.item==='moon').length,1,civ.file);assert(!orders.some(a=>R.UNITS[a.item]),civ.file);assert.equal(orders.length,3);sim.dispose();}
 pass('All eight actual drivers continue one national lunar project and rear research when the army already exceeds its war budget');
 metrics.fronts=[];
 for(const civ of R.CIVS){const {g,p,cities,tile,sim}=field();army(g,18);for(const [x,y]of [[9,12],[10,11],[11,11]])E.addUnit(g,1,'rifleman',tile(x,y).id);see(g);E.applyAction(g,p,{type:'produce',city:cities[0].id,item:'moon'});cities[0].production.progress=10;
  const obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.city===cities[0].id&&a.hint?.emergency));
  const orders=await decide(g,p,civ.file,a=>a.type==='produce'&&(a.city===cities[0].id||['moon','research','tank','modernarmor'].includes(a.item)));
  const home=orders.find(a=>a.city===cities[0].id);assert(home&&R.UNITS[home.item]&&!R.UNITS[home.item].civilian,civ.file+' must defend the attacked city');assert.equal(orders.filter(a=>a.item==='moon').length,1,civ.file+' must transfer science work to a safe city in the same response');assert(!orders.some(a=>a.city!==cities[0].id&&R.UNITS[a.item]),civ.file+' must keep rear cities productive');for(const a of orders)E.applyAction(g,p,a);assert(g.cities.some(c=>c.owner===0&&c.id!==cities[0].id&&c.production?.item==='moon'));metrics.fronts.push({driver:civ.file,orders});sim.dispose();}
 pass('All eight real responses defend the invaded city and transfer its interrupted lunar project to a safe rear city without nationwide mobilization');
 for(const civ of R.CIVS){const {g,p,cities,sim}=field();p.strategy='domination';p.planRevision++;const initial=E.observation(g,p).legalActions.find(a=>a.type==='produce').hint.militaryTarget;army(g,initial-2);E.applyAction(g,p,{type:'produce',city:cities[0].id,item:'modernarmor'});const orders=await decide(g,p,civ.file,a=>a.type==='produce'&&a.hint.military&&a.hint.domain==='land');assert.equal(orders.length,1,civ.file+' must include the existing tank queue and the new order in one budget');sim.dispose();}
 pass('All eight driver batches count both pending and newly selected military orders against the remaining national shortage');
 {
  const {g,p,cities,sim}=field();army(g,18);for(const c of cities){E.applyAction(g,p,{type:'produce',city:c.id,item:'modernarmor'});c.production.progress=E.orderCost(g,c)*.2;}cities[1].production.funded=true;cities[2].production.progress=E.orderCost(g,cities[2])*.8;
  let obs=E.observation(g,p);assert(obs.legalActions.some(a=>a.city===cities[0].id&&a.hint?.surplusMilitary));assert(!obs.legalActions.some(a=>a.type==='produce'&&a.city===cities[1].id));assert(!obs.legalActions.some(a=>a.type==='produce'&&a.city===cities[2].id));
  const before=cities[0].production.progress,orders=await decide(g,p,R.CIVS[0].file);const next=orders.find(a=>a.city===cities[0].id);assert(next&&!R.UNITS[next.item]?.strength&&!R.UNITS[next.item]?.ranged);E.applyAction(g,p,next);assert(cities[0].production.progress>=before*.5);
  p.manual=true;cities[0].production={item:'modernarmor',progress:0,cost:R.productionCost(g,'modernarmor')};assert(!E.observation(g,p).legalActions.some(a=>a.type==='produce'&&a.city===cities[0].id));sim.dispose();
  pass('Early unfunded surplus military queues recover normal carryover; manual, funded and nearly finished orders remain protected');
 }
 {
  const {g,p,tile,cities,sim}=field();army(g,2,'warrior');const enemy=E.addUnit(g,1,'modernarmor',tile(12,12).id);see(g);
  const defenses=new Map(cities.map(c=>[c.id,defenseSituation(g,p,c)])),state=domesticSituation(g,p,defenses,developmentPlan(g,p));assert(state.shortfall>0);assert(state.shortfall<=Math.max(R.UNITS.modernarmor.strength,R.UNITS.modernarmor.ranged||0)*1.15+.001);assert(state.target>9);
  p.visible=p.visible.filter(id=>id!==enemy.tile);const hidden=E.observation(g,p).legalActions.filter(a=>a.type==='produce').map(a=>[a.city,a.item,a.hint.militaryTarget,a.hint.defenseUrgency]);enemy.type='warrior';enemy.hp=1;assert.deepEqual(E.observation(g,p).legalActions.filter(a=>a.type==='produce').map(a=>[a.city,a.item,a.hint.militaryTarget,a.hint.defenseUrgency]),hidden);sim.dispose();
  pass('Visible superior enemies increase genuine military need; overlapping city threats are bounded and unseen strength cannot change the budget');
 }
 const input=JSON.parse(await readFile(new URL('../output/production-balance-inspection.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../'+input.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
 const g=E.restore(bytes.toString()),p=g.players[input.player],obs=E.observation(g,p),orders=await decide(g,p,p.driver.file);const recovery=orders.filter(a=>a.type==='produce'&&g.cities.find(c=>c.id===a.city)?.production?.item==='modernarmor'&&!R.UNITS[a.item]?.strength&&!R.UNITS[a.item]?.ranged);assert.equal(obs.player.plan.goal,'science');assert(recovery.length>0);assert(!orders.some(a=>a.type==='produce'&&['tank','modernarmor'].includes(a.item)));metrics.actualWorld={world:g.id,turn:g.turn,input:input.file,sha256:input.sha256,army:input.military,beforeProduction:input.productionCounts,goal:obs.player.plan.goal,militaryTarget:obs.legalActions.find(a=>a.type==='produce').hint.militaryTarget,recoveredCities:recovery.map(a=>({city:a.city,item:a.item})),orders};
 pass('The exact frozen Tang save retains its science objective, stops additional armor and replans actual early surplus queues');
 await writeFile(new URL('../output/production-balance-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
}finally{pool.dispose();}
