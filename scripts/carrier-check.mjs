import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as F from '../src/carrier-groups.mjs';
import {attackRange,airDefenders} from '../src/air-warfare.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {seafront} from './naval-warfare-check.mjs';
import {see} from './air-warfare-check.mjs';

export function carrierField(){
 const f=seafront(),{g,p,tile}=f;
 const carrier=E.addUnit(g,p.id,'aircraftcarrier',tile(14,15).id),gun=E.addUnit(g,p.id,'battleship',tile(15,16).id),escort=E.addUnit(g,p.id,'destroyer',tile(13,16).id),sub=E.addUnit(g,p.id,'submarine',tile(15,14).id),plane=E.addUnit(g,p.id,'bomber',tile(9,15).id);
 see(g);return {...f,carrier,gun,escort,sub,plane};
}
const checks=[],metrics={drivers:[]},pass=name=>{checks.push(name);console.log('PASS '+name);};
const ready=(g,u)=>{u.acted=false;u.moves=R.UNITS[u.type].moves;u.cooldownUntil=u.moveUntil=u.attackUntil=0;};
export async function check(){
 {
  const {g,p,home,carrier,plane,tile}=carrierField();assert.equal(R.UNITS.aircraftcarrier.tech,'combinedarms');assert.equal(R.UNITS.aircraftcarrier.airCapacity,2);assert.equal(R.unitUpkeep('aircraftcarrier',p).maintenance,120);
  p.techs=p.techs.filter(t=>t!=='combinedarms');assert(!E.productionOptions(g,p,home).some(o=>o.item==='aircraftcarrier'));p.techs.push('combinedarms');assert(E.productionOptions(g,p,home).some(o=>o.item==='aircraftcarrier'));
  const target=E.rebaseTargets(g,p,plane).find(b=>b.carrier===carrier.id);assert(target);const sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'rebase',unit:plane.id,tile:target.tile,carrier:carrier.id}],{manual:true});sim.tick(target.seconds+.1);
  assert.equal(plane.carrierId,carrier.id);assert.equal(plane.tile,carrier.tile);assert.equal(sim.stats.rejected,0);ready(g,carrier);
  sim.enqueue(p,[{type:'move',unit:carrier.id,tile:tile(15,15).id}],{manual:true});sim.tick(4);assert.equal(plane.tile,carrier.tile);assert.equal(carrier.tile,tile(15,15).id);assert.equal(sim.stats.rejected,0);sim.dispose();
  const copy=E.restore(E.serialize(g));F.validateDecks(copy);assert.equal(copy.units.find(u=>u.id===plane.id).carrierId,carrier.id);
  const bad=JSON.parse(E.serialize(copy));bad.units.find(u=>u.id===plane.id).carrierId=999999;assert.throws(()=>E.restore(JSON.stringify(bad)),/assignment/);
  pass('Combined Arms/resource/payroll admission, real timed deck transfer, passenger movement and exact persistent aircraft identity');
 }
 {
  const {g,p,carrier,plane,tile}=carrierField();const second=E.addUnit(g,0,'fighter',tile(10,16).id),third=E.addUnit(g,0,'jetfighter',tile(9,16).id);see(g);
  const sim=new RealtimeSimulation(g);for(const u of [plane,second]){const b=E.rebaseTargets(g,p,u).find(b=>b.carrier===carrier.id);sim.enqueue(p,[{type:'rebase',unit:u.id,tile:b.tile,carrier:carrier.id}],{manual:true});}sim.tick(.1);
  assert.equal(E.rebaseTargets(g,p,third).some(b=>b.carrier===carrier.id),false);assert.equal(E.reachable(g,p,carrier).length,0);const copy=E.restore(E.serialize(g));const continued=new RealtimeSimulation(copy);continued.tick(3);assert.equal(F.deckAircraft(copy,copy.units.find(u=>u.id===carrier.id)).length,2);assert.equal(continued.stats.rejected,0);continued.dispose();sim.dispose();
  const fake=JSON.parse(E.serialize(copy));fake.units.push({...fake.units.find(u=>u.id===plane.id),id:fake.nextId++});assert.throws(()=>E.restore(JSON.stringify(fake)),/capacity/);
  pass('Two simultaneous inbound reservations exclude a third plane; pending landing freezes the carrier and survives save/load; overfilled saves are rejected');
 }
 {
  const {g,p,carrier,plane,gun,escort,sub,tile}=carrierField();E.applyAction(g,p,{type:'rebase',unit:plane.id,tile:carrier.tile,carrier:carrier.id});ready(g,plane);see(g);
  for(const u of [carrier,plane,gun,escort,sub]){const profile=E.unitCombatProfile(g,u,false);assert.equal(profile.modifiers.find(m=>m.key==='carrierGroup').value,20);assert.equal(E.unitCombatProfile(g,u,true).modifiers.find(m=>m.key==='carrierGroup').value,20);assert.equal(attackRange(g,u),F.baseRange(g,u)+2);}
  const target=E.addUnit(g,1,'frigate',tile(23,15).id);see(g);assert(R.dist(g.map.tiles[gun.tile],g.map.tiles[target.tile],g.map)>attackRange(g,gun));assert(E.attackTargets(g,p,gun).some(a=>a.targetUnit===target.id));
  const hint=E.observation(g,p).legalActions.find(a=>a.type==='attack'&&a.unit===gun.id&&a.targetUnit===target.id).hint;assert(hint.attackModifiers.some(m=>m.key==='carrierGroup'&&m.value===20));const sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'attack',unit:gun.id,targetUnit:target.id}],{manual:true});sim.tick(2);assert(target.hp<100);assert.equal(gun.hp,100);assert.equal(sim.stats.rejected,0);sim.dispose();
  const strength=E.unitStrength(g,gun);sub.tile=tile(30,14).id;see(g);assert.equal(E.unitStrength(g,gun),strength-20);assert(!E.attackTargets(g,p,gun).some(a=>a.targetUnit===target.id));
  pass('All five roles receive exactly +20 attack/defense and +2 range; overlap union authorizes real remote fire and immediately disappears when a prerequisite leaves');
 }
 {
  const {g,p,carrier,plane,escort,tile}=carrierField();E.applyAction(g,p,{type:'rebase',unit:plane.id,tile:carrier.tile,carrier:carrier.id});ready(g,plane);escort.type='assaultship';see(g);assert(F.groupFor(g,carrier));
  const submarine=E.addUnit(g,1,'submarine',tile(16,15).id),tank=E.addUnit(g,0,'tank',tile(16,14).id),rocket=E.addUnit(g,0,'rocketartillery',tile(17,14).id),fighter=E.addUnit(g,0,'fighter',tile(10,16).id);see(g);
  for(const u of [carrier,tank,rocket,fighter])assert(!E.attackTargets(g,p,u).some(a=>a.targetUnit===submarine.id));assert(E.attackTargets(g,p,escort).some(a=>a.targetUnit===submarine.id));assert(E.attackTargets(g,p,plane).some(a=>a.targetUnit===submarine.id));assert(!E.legalActions(g,p).some(a=>a.type==='cityAttack'&&a.targetUnit===submarine.id));
  assert.throws(()=>E.applyAction(g,p,{type:'attack',unit:rocket.id,targetUnit:submarine.id}));E.applyAction(g,p,{type:'attack',unit:plane.id,targetUnit:submarine.id});assert(submarine.hp<100);
  const exposed=carrierField();exposed.sub.tile=exposed.tile(17,15).id;exposed.carrier.tile=exposed.tile(17,14).id;exposed.plane.tile=exposed.carrier.tile;exposed.plane.carrierId=exposed.carrier.id;see(exposed.g);
  const danger=E.observation(exposed.g,exposed.p).legalActions;
  for(const u of [exposed.sub,exposed.plane]){const choices=danger.filter(a=>a.unit===u.id&&a.hint?.currentIncomingDamage!==undefined);assert(choices.length);assert(choices.every(a=>a.hint.currentIncomingDamage===0),'City guns must not create imaginary submarine or aircraft danger');}
  pass('Destroyer successors preserve formation; non-ASW surface/land/city attacks cannot target submarines; ASW escorts can attack detected submarines, while actual submarine and bomber roles retain lawful targets');
 }
 {
  const {g,p,q,carrier,plane,sub,tile}=carrierField();E.applyAction(g,p,{type:'rebase',unit:plane.id,tile:carrier.tile,carrier:carrier.id});ready(g,plane);see(g);
  sub.revealedUntil=(g.realtime?.time??g.turn*20)+60;const before=E.snapshot(g,q.id),friendly=before.units.find(u=>u.id===carrier.id);q.visible=q.visible.filter(id=>id!==sub.tile);F.invalidateFleets(g);assert.equal(E.snapshot(g,q.id).units.find(u=>u.id===carrier.id).fleet,null);assert(friendly.fleet);assert(F.groupFor(g,carrier));
  assert.equal(E.snapshot(g,q.id).units.find(u=>u.id===carrier.id).range,1);p.visible=[carrier.tile];const hidden=E.addUnit(g,1,'frigate',tile(23,15).id);assert(!E.attackTargets(g,p,plane).some(a=>a.targetUnit===hidden.id));
  for(const [x,y]of [[9,15],[10,16],[9,16]])E.addUnit(g,p.id,'jetfighter',tile(x,y).id);
  const deckFighter=E.addUnit(g,p.id,'jetfighter',carrier.tile);deckFighter.carrierId=carrier.id;F.invalidateFleets(g);
  const interceptors=airDefenders(g,q.id,g.map.tiles[carrier.tile],{visibleOnly:true}).map(u=>u.id);
  assert.equal(interceptors.length,3);g.units=g.units.filter(u=>u.id!==sub.id);F.invalidateFleets(g);
  assert.deepEqual(airDefenders(g,q.id,g.map.tiles[carrier.tile],{visibleOnly:true}).map(u=>u.id),interceptors,'Unseen members cannot alter public interceptor priority');
  pass('Shared range never discovers hidden targets; unseen enemy formation members cannot leak bonuses or identities through player snapshots');
 }
 {
  const {g,p,carrier,plane,tile}=carrierField();E.applyAction(g,p,{type:'rebase',unit:plane.id,tile:carrier.tile,carrier:carrier.id});ready(g,plane);plane.hp=63;carrier.hp=1;
  const enemy=E.addUnit(g,1,'nuclearsubmarine',tile(15,15).id);see(g);E.applyAction(g,g.players[1],{type:'attack',unit:enemy.id,targetUnit:carrier.id});assert(!g.units.some(u=>u.id===carrier.id));assert(g.units.some(u=>u.id===plane.id));assert.equal(plane.hp,63);assert.equal(plane.carrierId,undefined);assert(E.operationalAirBase(g,p,plane));E.restore(E.serialize(g));
  const stranded=carrierField();E.applyAction(stranded.g,stranded.p,{type:'rebase',unit:stranded.plane.id,tile:stranded.carrier.tile,carrier:stranded.carrier.id});stranded.carrier.hp=1;for(const t of stranded.g.map.tiles)if(t.district?.item==='airport')t.pillaged=true;const hunter=E.addUnit(stranded.g,1,'nuclearsubmarine',stranded.tile(15,15).id);see(stranded.g);E.applyAction(stranded.g,stranded.q,{type:'attack',unit:hunter.id,targetUnit:stranded.carrier.id});assert(!stranded.g.units.some(u=>u.id===stranded.plane.id));E.restore(E.serialize(stranded.g));
  pass('Sinking forces a legal emergency landing, preserves surviving aircraft identity and HP, clears deck state and restores cleanly');
 }
 const pool=new NativeDriverPool();try{for(const civ of R.CIVS){
  const {g,p,carrier,plane,gun,tile}=carrierField();p.driver.file=civ.file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(a=>a.unit===plane.id);const result=await pool.execute(p,obs),rebase=result.orders.find(a=>a.type==='rebase'&&a.carrier===carrier.id);assert(rebase,civ.file+' loads a real aircraft carrier');E.applyAction(g,p,rebase);ready(g,plane);see(g);
  const target=E.addUnit(g,1,'frigate',tile(23,15).id);see(g);const armed=E.observation(g,p);armed.legalActions=armed.legalActions.filter(a=>a.unit===gun.id);const shot=await pool.execute(p,armed);assert(shot.orders.some(a=>a.type==='attack'&&a.targetUnit===target.id),civ.file+' uses shared firing range');
  const build=carrierField();build.p.driver.file=civ.file;build.g.units=build.g.units.filter(u=>u.id!==build.carrier.id);see(build.g);const planned=E.observation(build.g,build.p);planned.legalActions=planned.legalActions.filter(a=>a.type==='produce'&&a.hint.domain==='sea');const commission=await pool.execute(build.p,planned);assert(commission.orders.some(a=>a.item==='aircraftcarrier'),civ.file+' commissions one supported carrier');
  build.g.units=build.g.units.filter(u=>R.UNITS[u.type].domain!=='air');see(build.g);const unsupported=E.observation(build.g,build.p);unsupported.legalActions=unsupported.legalActions.filter(a=>a.type==='produce'&&a.item==='aircraftcarrier');assert.equal((await pool.execute(build.p,unsupported)).orders.length,0,civ.file+' avoids an unsupported carrier');metrics.drivers.push(civ.file);
 }}finally{pool.dispose();}
 pass('All eight compiled native players load a real deck and select a worthwhile target reachable through the actual shared range');
 await writeFile(new URL('../output/carrier-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
}
if(process.argv[1]?.endsWith('carrier-check.mjs'))await check();
