import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,addUnit,foundCity,applyAction,applyOrders,legalActions,healingTargets,productionRate,productionOptions,cityYields,finishTurn,buildable,attackTargets,refreshVisibility,serialize,restore,observation,event} from '../src/engine.mjs';
import {UNITS,TECHS,productionCost,purchaseCost,occupationUnit} from '../src/rules.mjs';
import {neighbors} from '../src/world.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {beginWar} from '../src/warfare.mjs';
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
function field(){const g=createGame({seed:'MEDICAL-PRODUCTION',players:2,size:'small',barbarians:false});for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,riverEdges:[],owner:null,cityId:null,camp:false,ruin:false,district:null,improvement:null});g.units=[];for(const p of g.players){p.manual=true;p.gold=100000;p.met=[1-p.id];const t=g.map.tiles[(10+p.id*8)*g.map.width+12];foundCity(g,p,addUnit(g,p.id,'settler',t.id));}g.units=[];const p=g.players[0],c=g.cities[0],t=g.map.tiles[c.tile],u=addUnit(g,0,'herbalist',t.id),v=addUnit(g,0,'warrior',t.id);v.hp=40;const sim=new RealtimeSimulation(g);refreshVisibility(g);return {g,sim,p,c,t,u,v};}
const ready=u=>{delete u.activity;u.acted=false;u.moves=UNITS[u.type].moves;u.cooldownUntil=0;};
{
 const {g,sim,p,u,v}=field();v.moveUntil=20;v.attackUntil=30;sim.enqueue(p,[{type:'heal',unit:u.id,targetUnit:v.id}]);sim.tick(.05);assert(Math.abs(u.activity.ends-u.activity.started-2)<1e-9);sim.tick(1.9);assert.equal(v.hp,40);const clone=restore(serialize(g)),resumed=new RealtimeSimulation(clone);sim.tick(.15);resumed.tick(.15);assert.equal(v.hp,52);assert.deepEqual(clone.units,g.units);assert.equal(v.moveUntil,20);assert.equal(v.attackUntil,30);assert(v.medicalUntil>g.realtime.time&&u.supportUntil>g.realtime.time);sim.dispose();resumed.dispose();pass('Two-second treatment heals only at completion, resumes exactly from a save and preserves patient movement/attack clocks');
}
{
 const {g,sim,p,t,u,v}=field(),other=addUnit(g,0,'herbalist',neighbors(g.map,t)[0].id);sim.start(p,{type:'heal',unit:u.id,targetUnit:v.id});assert.throws(()=>sim.start(p,{type:'heal',unit:other.id,targetUnit:v.id}));sim.tick(2);ready(other);assert.equal(healingTargets(g,p,other).length,0);sim.tick(11.95);assert.equal(healingTargets(g,p,other).length,0);sim.tick(.05);assert.equal(healingTargets(g,p,other).length,1);sim.dispose();pass('Active treatment reserves one patient; different medics cannot stack healing during the shared twelve-second patient interval');
}
{
 const {g,sim,p,u,v}=field();sim.start(p,{type:'heal',unit:u.id,targetUnit:v.id});v.tile=g.cities[1].tile;sim.tick(2);assert.equal(v.hp,40);assert.equal(sim.stats.rejected,1);assert(!v.medicalUntil);sim.dispose();pass('A patient moving out of reach cancels treatment without distant healing or consuming its treatment interval');
}
{
 const {g,sim,p,u,v}=field();for(const type of ['herbalist','surgeon','fieldmedic','ambulance']){u.type=type;ready(u);u.supportUntil=0;v.medicalUntil=0;v.hp=40;applyAction(g,p,{type:'heal',unit:u.id,targetUnit:v.id});assert.equal(v.hp,40+UNITS[type].medical);v.hp=99;v.medicalUntil=0;u.supportUntil=0;ready(u);applyAction(g,p,{type:'heal',unit:u.id,targetUnit:v.id});assert.equal(v.hp,100);assert.equal(attackTargets(g,p,u).length,0);assert(!occupationUnit(type));}sim.dispose();pass('Four era roles restore 12/18/24/32 actual HP with a 100-HP cap and cannot attack or occupy cities');
}
{
 const {g,sim,p,u,v,t}=field();for(const type of ['builder','galley','bomber']){v.type=type;assert.equal(healingTargets(g,p,u).length,0);}v.type='warrior';v.owner=1;assert.equal(healingTargets(g,p,u).length,0);v.owner=0;t.terrain='coast';assert.equal(healingTargets(g,p,u).length,0);t.terrain='grass';v.hp=0;assert.equal(healingTargets(g,p,u).length,0);sim.dispose();pass('Treatment rejects civilians, ships, aircraft, foreign soldiers, embarked units and dead patients');
}
{
 const {g,sim,p,u,v,t}=field();u.supportUntil=100;const dest=neighbors(g.map,t)[0];dest.owner=0;assert(legalActions(g,p).some(a=>a.unit===u.id&&a.type==='move'));assert(!legalActions(g,p).some(a=>a.unit===u.id&&a.type==='heal'));beginWar(g,p,g.players[1],event);u.tile=neighbors(g.map,t).find(n=>!g.units.some(v=>v.tile===n.id)).id;const enemy=addUnit(g,1,'warrior',neighbors(g.map,g.map.tiles[u.tile]).find(n=>!g.units.some(v=>v.tile===n.id)&&!n.cityId).id);refreshVisibility(g);assert(attackTargets(g,g.players[1],enemy).some(a=>a.targetUnit===u.id));for(const bad of [NaN,-1]){const saved=JSON.parse(serialize(g));saved.units.find(x=>x.id===u.id).supportUntil=bad;assert.throws(()=>new RealtimeSimulation(restore(JSON.stringify(saved))));}sim.dispose();pass('Medical cooldown permits separate movement; support units remain vulnerable and malformed support clocks are rejected');
}
{
 const {g,sim,p,c,t}=field();p.techs=[];assert(!buildable(g,p,c,'herbalist'));for(const type of ['herbalist','surgeon','fieldmedic']){p.techs=[UNITS[type].tech];assert(buildable(g,p,c,type));}p.techs=Object.keys(TECHS);assert(!buildable(g,p,c,'ambulance'));t.resource='oil';t.improvement='well';assert(buildable(g,p,c,'ambulance'));sim.dispose();pass('Medical eras require their actual technologies; mechanized support also requires an operating oil supply');
}
{
 const {g,sim,p,c}=field();g.units=[];applyAction(g,p,{type:'produce',city:c.id,item:'warrior'});const initial=g.units.length;sim.tick(19.95);assert.equal(c.production.progress,0);assert.equal(g.units.length,initial);sim.tick(.05);assert(c.production.progress>0);assert.equal(c.production.progress,productionRate(g,c));assert.equal(g.units.length,initial);c.production.progress=productionCost(g,'warrior')-1;sim.tick(20);assert(g.units.some(u=>u.type==='warrior'));sim.dispose();pass('Ordinary recruitment accumulates city production only at economic settlement and deploys only after reaching its actual cost');
}
{
 const {g,sim,p,c}=field();g.units=[];p.techs=[UNITS.surgeon.tech];for(const tile of g.map.tiles.filter(t=>t.owner===p.id)){tile.hill=true;tile.improvement='mine';}const rates=[];for(const pop of [1,6]){c.population=pop;applyAction(g,p,{type:'produce',city:c.id,item:'surgeon'});c.production.progress=0;const rate=productionRate(g,c);finishTurn(g,{actions:false});assert.equal(c.production.progress,rate);rates.push(rate);c.production=null;}assert(rates[1]>rates[0]);sim.dispose();pass('Higher productive population yields a higher actual recruitment rate, with identical item costs');
}
{
 const {g,sim,p,c}=field();g.units=[];const gold=p.gold;applyAction(g,p,{type:'produce',city:c.id,item:'monument'});const queue=structuredClone(c.production);applyAction(g,p,{type:'purchase',city:c.id,item:'warrior'});assert.equal(g.units.length,1);assert.equal(p.gold,gold-purchaseCost(g,'warrior'));assert.deepEqual(c.production,queue);const clone=restore(serialize(g));finishTurn(g,{actions:false});finishTurn(clone,{actions:false});assert.equal(serialize(clone),serialize(g));sim.dispose();pass('Gold immediately purchases a unit without replacing production and survives saves');
}
{
 const {g,sim,p,c}=field();g.units=[];c.buildings.push('campus');for(const item of ['monument','research']){applyAction(g,p,{type:'produce',city:c.id,item});const rate=productionRate(g,c);finishTurn(g,{actions:false});assert.equal(c.production.progress,rate);assert(!c.buildings.includes('monument'));c.production=null;}applyAction(g,p,{type:'purchase',city:c.id,item:'monument'});assert(c.buildings.includes('monument'));assert.equal(c.production,null);sim.dispose();pass('Buildings and repeatable projects use the same city production rule, with immediate gold purchases');
}
{
 const {g,sim,p,c,t}=field();g.units=[];p.techs=Object.keys(TECHS);t.resource='oil';t.improvement='well';applyAction(g,p,{type:'produce',city:c.id,item:'ambulance'});c.production.progress=productionCost(g,'ambulance');t.pillaged=true;finishTurn(g,{actions:false});assert(!g.units.some(u=>u.type==='ambulance'));assert(c.production);t.pillaged=false;finishTurn(g,{actions:false});assert(g.units.some(u=>u.type==='ambulance'));sim.dispose();pass('Production completion revalidates resource availability and waits safely when oil supply is pillaged');
}
{
 const {g,sim,p,u}=field();p.techs=Object.keys(TECHS);for(const item of ['surgeon','fieldmedic']){ready(u);assert(legalActions(g,p).some(a=>a.type==='upgrade'&&a.unit===u.id&&a.item===item));applyAction(g,p,{type:'upgrade',unit:u.id,item});assert.equal(u.type,item);}sim.dispose();pass('The medical equipment ladder upgrades through actual technology/gold checks without creating another unit');
}
{
 const {g,sim,p,c,u,v}=field(),pool=new NativeDriverPool();try{let obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&['heal','fortify','move'].includes(a.type));let result=await pool.execute(p,obs);assert(result.orders.some(a=>a.type==='heal'&&a.targetUnit===v.id));g.units=g.units.filter(x=>x!==u);p.techs=Object.keys(TECHS).filter(k=>k!==UNITS.ambulance.tech);c.buildings.push('commercial','market','bank','exchange');beginWar(g,p,g.players[1],event);obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.type==='produce'&&(['herbalist','surgeon','fieldmedic','monument'].includes(a.item)));const medicalOrder=obs.legalActions.find(a=>a.item==='fieldmedic');assert(medicalOrder&&obs.player.finance.grossGold>=obs.player.finance.projectedUpkeep+medicalOrder.hint.upkeep,'Medical recruitment fixture must sustain its actual payroll');result=await pool.execute(p,obs);assert(result.orders.some(a=>a.type==='produce'&&a.item==='fieldmedic'),JSON.stringify({orders:result.orders,actions:obs.legalActions}));pass('Real native C++ treats wounded soldiers and recruits the best available medical tier when support is missing and income covers its actual payroll');}finally{pool.dispose();sim.dispose();}
}
{
 const {g,sim,p,c,t,u}=field();u.type='builder';u.charges=3;u.tile=neighbors(g.map,t)[0].id;g.map.tiles[u.tile].feature='forest';p.techs.push('mining');applyAction(g,p,{type:'produce',city:c.id,item:'warrior'});c.production.progress=productionCost(g,'warrior')-1;const count=g.units.length;applyAction(g,p,{type:'chop',unit:u.id});assert.equal(g.units.length,count+1);assert.equal(u.charges,2);assert.equal(g.map.tiles[u.tile].feature,null);sim.dispose();pass('A real charged builder chop remains an explicit production-completion exception rather than being converted into a long city order');
}
{
 const {g,sim,p,u,v}=field(),pool=new NativeDriverPool();try{const obs=observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===u.id&&a.type==='heal'||a.unit===v.id&&['move','fortify'].includes(a.type));const result=await pool.execute(p,obs);assert(result.orders.some(a=>a.type==='heal'));assert(!result.orders.some(a=>a.unit===v.id));assert.equal(applyOrders(g,p,result.orders).rejected.length,0);pass('Native treatment reserves the patient and never simultaneously orders that patient to march or act');}finally{pool.dispose();sim.dispose();}
}
{
 const {g,sim,p,t,u,v}=field(),dest=neighbors(g.map,t)[0];dest.owner=0;sim.start(p,{type:'heal',unit:u.id,targetUnit:v.id});assert(!legalActions(g,p).some(a=>a.unit===v.id));sim.enqueue(p,[{type:'move',unit:v.id,tile:dest.id}]);sim.tick(1.95);assert.equal(v.tile,t.id);assert(!v.activity);sim.tick(.1);assert.equal(v.hp,52);assert.equal(v.activity?.action.type,'move');sim.dispose();pass('An active patient holds still for two seconds, then its queued movement resumes normally after treatment');
}
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));await writeFile(new URL('../output/medical-checks.json',import.meta.url),JSON.stringify({passed:true,checks,gameLaunched:false,saveUnchanged:true,sha256:createHash('sha256').update(before).digest('hex')},null,2));
