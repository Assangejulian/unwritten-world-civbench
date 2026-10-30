// Reproduce a peaceful observer seeing a neighbour besieged while all cities are busy.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {regionalThreat,domesticSituation} from '../src/domestic.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const checks=[],metrics={drivers:[]},pool=new NativeDriverPool(),pass=name=>{checks.push(name);console.log('PASS '+name);};
function field(count=3,players=3){
 const g=E.createGame({players,seed:'NEIGHBOUR-SIEGE',barbarians:false}),tile=(x,y)=>g.map.tiles[y*g.map.width+x];g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false,road:false});
 for(const p of g.players)Object.assign(p,{manual:false,gold:1000,techs:['archery','writing','bronze','currency'],civics:[],met:g.players.filter(o=>o.id!==p.id).map(o=>o.id),strategy:'adaptive',doctrine:'balanced'});
 const p=g.players[0],cities=[];for(let i=0;i<count;i++){const c=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(10+i*8,14).id));c.population=4;c.buildings.push('campus');c.production={item:'library',progress:0,cost:R.PRODUCTION.library.cost};cities.push(c);}
 const victim=E.foundCity(g,g.players[2],E.addUnit(g,2,'settler',tile(18,24).id));E.foundCity(g,g.players[1],E.addUnit(g,1,'settler',tile(48,24).id));g.units=[];g.turn=40;
 const guard=E.addUnit(g,0,'warrior',tile(10,14).id);for(const [x,y]of [[16,24],[17,22],[19,22],[20,24]])E.addUnit(g,1,'archer',tile(x,y).id);
 E.refreshVisibility(g);E.applyAction(g,g.players[1],{type:'war',player:2});
 for(const u of g.units.filter(u=>u.owner===1))if(E.attackTargets(g,g.players[1],u).some(a=>a.targetCity===victim.id))E.applyAction(g,g.players[1],{type:'attack',unit:u.id,targetCity:victim.id});
 E.refreshVisibility(g);p.knownCities[victim.id]={id:victim.id,owner:2,name:victim.name,tile:victim.tile};
 for(const t of g.map.tiles.filter(t=>t.col>=7&&t.col<=34&&t.row>=11&&t.row<=26)){p.visible.push(t.id);p.explored.push(t.id);p.knownTiles[t.id]=structuredClone(t);}p.visible=[...new Set(p.visible)];p.explored=[...new Set(p.explored)];
 return {g,p,cities,victim,guard,tile};
}
const guardOrder=a=>a.type==='produce'&&R.UNITS[a.item]&&!R.UNITS[a.item].civilian&&(R.UNITS[a.item].domain||'land')==='land'&&!R.UNITS[a.item].siege&&!R.UNITS[a.item].airOnly&&a.item!=='scout';
try{
 const f=field(),risk=regionalThreat(f.g,f.p);assert(risk.risk>=.5);assert.equal(f.p.relations[1].status,'peace');assert(domesticSituation(f.g,f.p).reserveTarget>4);pass('A real observed third-party siege raises national preparedness before the observer is attacked');
 {const {g,p,victim,tile}=field();victim.hp=0;victim.walls=0;const invader=E.addUnit(g,1,'warrior',tile(18,23).id);E.refreshVisibility(g);E.applyAction(g,g.players[1],{type:'move',unit:invader.id,tile:victim.tile});assert.equal(victim.owner,1);assert(victim.occupation>0);p.visible.push(victim.tile);p.knownCities[victim.id]={id:victim.id,owner:1,name:victim.name,tile:victim.tile};assert(regionalThreat(g,p).risk>=.5);}
 pass('A real nearby city capture remains a preparation signal when its newly occupied state is visible');
 for(const civ of R.CIVS){const {g,p,cities}=field();p.driver.file=civ.file;const obs=E.observation(g,p),offered=obs.legalActions.filter(a=>a.type==='produce'&&a.hint.preparationSwitch);
  assert.equal(new Set(offered.map(a=>a.city)).size,1);const out=await pool.execute(p,obs),recruits=out.orders.filter(guardOrder);assert.equal(recruits.length,1,civ.file+' must replan one busy city');assert(!out.orders.some(a=>a.type==='war'),'Prepare without declaring a speculative war');
  E.applyAction(g,p,recruits[0]);assert.equal(cities.filter(c=>R.UNITS[c.production?.item]&&!R.UNITS[c.production.item].civilian).length,1);assert(!E.legalActions(g,p).some(a=>a.type==='produce'&&a.hint.preparationSwitch),'Pending guard prevents cascading interruptions');
  metrics.drivers.push({file:civ.file,regionalRisk:offered[0].hint.regionalRisk,item:recruits[0].item,city:recruits[0].city});
 }pass('All eight native policies replan one early development queue, preserve other cities and count pending recruitment');
 for(const civ of R.CIVS){const {g,p,cities}=field(5);for(const c of cities)c.production=null;p.driver.file=civ.file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&(guardOrder(a)||a.item==='library'));const quiet=structuredClone(obs);for(const a of quiet.legalActions)Object.assign(a.hint,{regionalRisk:0,reserveTarget:1,preparation:0});const normal=await pool.execute(p,quiet),out=await pool.execute(p,obs);assert(out.orders.filter(guardOrder).length<=normal.orders.filter(guardOrder).length+2,civ.file+' bounded additional regional mobilisation');assert(out.orders.some(a=>a.item==='library'));}
 pass('Regional recruitment preference is limited to two selections per response and every native strategy continues development');
 {const {g,p,guard}=field();p.driver.file=R.CIVS[0].file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===guard.id&&['move','fortify'].includes(a.type));const out=await pool.execute(p,obs),move=out.orders.find(a=>a.type==='move');assert(move);const match=obs.legalActions.find(a=>a.type==='move'&&a.tile===move.tile);assert(match.hint.defenseDuty&&match.hint.homeDefenseProgress>0);E.applyAction(g,p,move);assert.equal(p.relations[1].status,'peace');}
 pass('An existing healthy defender advances toward the threatened home frontier using legal movement, without attacking the neighbour');
 {const {g,p,tile}=field();const far=E.addUnit(g,0,'warrior',tile(26,14).id);E.addUnit(g,-1,'warrior',tile(10,15).id);E.refreshVisibility(g);const actions=E.legalActions(g,p);assert(!actions.some(a=>a.hint?.preparationSwitch));assert(!actions.some(a=>a.type==='move'&&a.unit===far.id&&a.hint.defenseDuty));}
 pass('An actual homeland invasion takes priority over regional staging and precautionary production');
 {const {g,p,cities}=field();for(const c of cities)c.production.progress=c.production.cost*.8;assert(!E.legalActions(g,p).some(a=>a.hint?.preparationSwitch));for(const c of cities)c.production={item:'colony',progress:0,cost:R.PRODUCTION.colony.cost};assert(!E.legalActions(g,p).some(a=>a.hint?.preparationSwitch));for(const c of cities)c.production={item:'library',progress:0,cost:R.PRODUCTION.library.cost,funded:true};assert(!E.legalActions(g,p).some(a=>a.hint?.preparationSwitch));p.manual=true;for(const c of cities)c.production.funded=false;assert(!E.legalActions(g,p).some(a=>a.hint?.preparationSwitch));}
 pass('Almost-completed work, funded work, space projects and manual control are protected from precautionary queue replacement');
 {const {g,p,tile}=field(),a=regionalThreat(g,p);p.visible=p.visible.filter(id=>id!==tile(48,24).id);const hidden=E.addUnit(g,1,'modernarmor',tile(48,24).id);hidden.hp=1;const foreign=g.cities.find(c=>c.owner===1);foreign.occupation=10;foreign.hp=1;g.players[1].techs=Object.keys(R.TECHS);assert.deepEqual(regionalThreat(g,p),a);for(const u of g.units.filter(u=>u.owner===1))p.visible=p.visible.filter(id=>id!==u.tile);p.visible=p.visible.filter(id=>id!==g.cities.find(c=>c.owner===2).tile);const b=regionalThreat(g,p);for(const u of g.units.filter(u=>u.owner===1))u.hp=100;g.cities.find(c=>c.owner===2).hp=1;assert.deepEqual(regionalThreat(g,p),b);}
 pass('Hidden armies, technology, city damage and conquest state cannot alter the same public regional assessment');
 {const {g,p}=field();p.relations[1].status='alliance';assert.equal(regionalThreat(g,p).risk,0);p.relations[1].status='peace';p.relations[1].truceUntil=g.turn*20+100;assert.equal(regionalThreat(g,p).risk,0);p.relations[1].truceUntil=0;g.players[1].relations[2].status=g.players[2].relations[1].status='peace';assert.equal(regionalThreat(g,p).risk,0);assert(!E.legalActions(g,p).some(a=>a.hint?.preparationSwitch));}
 pass('Alliance and truce safety apply, and ended neighbouring wars remove mobilisation and proactive interruptions');
 for(const civ of R.CIVS){const {g,p,cities}=field();p.gold=0;p.militaryArrears=50;p.driver.file=civ.file;assert(!E.legalActions(g,p).some(a=>a.hint?.preparationSwitch));for(const c of cities)c.production=null;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&(guardOrder(a)||a.item==='commercial'));const out=await pool.execute(p,obs);assert(!out.orders.some(guardOrder));assert(out.orders.some(a=>a.item==='commercial'));}
 pass('All eight indebted policies preserve strict recruitment budgets and repair income despite regional alarm');
 {const {g,p}=field();const count=g.diplomacy.agendas.length,a=regionalThreat(g,p);g.diplomacy.agendas.push(...structuredClone(g.diplomacy.agendas));assert.equal(regionalThreat(g,p).risk,a.risk);g.diplomacy.agendas.length=count;g.turn+=50;p.visible=p.visible.filter(id=>!g.units.some(u=>u.owner===1&&u.tile===id)&&!g.cities.some(c=>c.owner===2&&c.tile===id));assert(regionalThreat(g,p).risk<.5);const normalized=E.restore(E.serialize(g)),saved=E.serialize(normalized),restored=E.restore(saved);const digest=s=>createHash('sha256').update(s).digest('hex');assert.equal(digest(E.serialize(restored)),digest(saved));}
 pass('Repeated incidents do not multiply threat, old news cools down, and regional preparation adds no save fields');
 {const {g,p,tile,cities}=field(3,12);for(const other of g.players.slice(3))E.foundCity(g,other,E.addUnit(g,other.id,'settler',tile(60+(other.id-3)*4,44).id));
  const sim=new RealtimeSimulation(g);g.realtime.time=800;g.realtime.nextEconomy=820;sim.play();let calls=0,peakActive=0,peakMoving=0,peakNation=0;const refusals=[];sim.onRejected=r=>refusals.push(r);
  try{for(let decision=0;decision<12;decision++){
   const living=g.players.filter(p=>p.alive);for(let i=0;i<living.length;i+=2){const batch=living.slice(i,i+2),responses=await Promise.all(batch.map(p=>pool.execute(p,E.observation(g,p))));for(let j=0;j<batch.length;j++){batch[j].memory=responses[j].memory;sim.enqueue(batch[j],responses[j].orders);calls++;}}
   for(let tick=0;tick<20;tick++){sim.tick(.25);const active=[...g.units,...g.cities].filter(e=>e.activity);peakActive=Math.max(peakActive,active.length);peakMoving=Math.max(peakMoving,active.filter(e=>e.activity.action.type==='move').length);for(const p of g.players)peakNation=Math.max(peakNation,active.filter(e=>e.owner===p.id).length);}
   if(decision===0)assert(cities.some(c=>R.UNITS[c.production?.item]&&!R.UNITS[c.production.item].civilian),'Real scheduler must admit precautionary production');
  }assert(peakActive<=24&&peakMoving<=16&&peakNation<=4);assert(calls>=120);metrics.realtime={initialPlayers:12,seconds:60,calls,peakActive,peakMoving,peakNation,rejected:sim.stats.rejected,refusals,scope:'Controlled neighbour-siege replay; native decisions every five simulation seconds, not live wall-clock cadence'};
  }finally{sim.dispose();}
 }
 pass('A controlled twelve-country sixty-second native replay admits preparation through the real scheduler under unchanged action caps');
}finally{pool.dispose();}
const sources={};for(const f of ['src/domestic.mjs','src/engine.mjs','src/realtime.mjs','sdk/civ.hpp','scripts/regional-defense-check.mjs'])sources[f]=createHash('sha256').update(await fs.readFile(new URL('../'+f,import.meta.url))).digest('hex');
await fs.writeFile(new URL('../output/regional-defense-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,sources,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
