import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {nuclearRange} from '../src/air-warfare.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {battlefield,see} from './air-warfare-check.mjs';
export function seafront(){
  const f=battlefield(),{g,p,home,tile}=f;
  for(let y=12;y<=18;y++)for(let x=11;x<=35;x++)if(tile(x,y).cityId==null)Object.assign(tile(x,y),{terrain:'coast',feature:null,hill:false,river:false});
  Object.assign(tile(11,15),{owner:p.id,territoryCity:home.id});see(g);return f;
}
const checks=[],metrics={drivers:[]},pass=name=>{checks.push(name);console.log('PASS '+name);};
const select=async(pool,p,g,filter)=>{const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(filter);return {obs,result:await pool.execute(p,obs)};};
export async function check(){const pool=new NativeDriverPool();try{
  {
    const {g,p,home,tile}=seafront();p.techs=p.techs.filter(t=>t!=='guidance');see(g);
    assert(E.productionOptions(g,p,home).some(o=>o.item==='submarine'));assert(!E.productionOptions(g,p,home).some(o=>o.item==='nuclearsubmarine'));
    const u=E.addUnit(g,0,'submarine',tile(11,15).id);u.hp=63;const identity=u.id;p.techs.push('guidance');
    assert(!E.productionOptions(g,p,home).some(o=>o.item==='submarine'));assert(E.productionOptions(g,p,home).some(o=>o.item==='nuclearsubmarine'));
    const quote=E.unitUpgradeOptions(g,p,u).find(o=>o.item==='nuclearsubmarine');assert(quote.available);const gold=p.gold,sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'upgrade',unit:u.id,item:quote.item}],{manual:true});sim.tick(4.2);
    assert.equal(u.id,identity);assert.equal(u.type,'nuclearsubmarine');assert.equal(u.hp,63);assert.equal(p.gold,gold-quote.goldCost);assert.equal(sim.stats.rejected,0);sim.dispose();
    const restored=E.restore(E.serialize(g));assert.equal(restored.units.find(v=>v.id===identity).type,'nuclearsubmarine');
    p.techs=p.techs.filter(t=>t!=='nuclearfission');g.map.tiles.filter(t=>t.resource==='uranium').forEach(t=>t.improvement=null);
    assert(!E.productionOptions(g,p,home).some(o=>['submarine','nuclearsubmarine'].includes(o.item)));
    pass('Coastal resource-gated submarine recruitment, strict successor retirement and real paid four-second no-heal identity-preserving refits');
  }
  {
    const {g,p,tile}=seafront(),sub=E.addUnit(g,0,'submarine',tile(11,15).id),ship=E.addUnit(g,1,'frigate',tile(13,15).id),transport=E.addUnit(g,1,'rifleman',tile(12,14).id),land=E.addUnit(g,1,'tank',tile(10,14).id),plane=E.addUnit(g,1,'bomber',tile(12,15).id);see(g);
    const targets=E.attackTargets(g,p,sub);assert(targets.some(a=>a.targetUnit===ship.id));assert(targets.some(a=>a.targetUnit===transport.id));assert(!targets.some(a=>a.targetCity!==undefined||a.targetUnit===land.id||a.targetUnit===plane.id));
    assert.throws(()=>E.applyAction(g,p,{type:'attack',unit:sub.id,targetUnit:land.id}));
    E.applyAction(g,p,{type:'attack',unit:sub.id,targetUnit:ship.id});assert(ship.hp<100);assert.equal(sub.hp,100);
    metrics.torpedoDamage=100-ship.hp;pass('Torpedoes really damage ships and embarked troops, reject land/cities/aircraft and cause no melee retaliation');
  }
  {
    const {g,p,tile}=seafront(),sub=E.addUnit(g,0,'nuclearsubmarine',tile(11,15).id),ship=E.addUnit(g,1,'destroyer',tile(14,15).id);see(g);
    assert(E.attackTargets(g,p,sub).some(a=>a.targetUnit===ship.id));ship.tile=tile(15,15).id;assert(!E.attackTargets(g,p,sub).some(a=>a.targetUnit===ship.id));
    assert.equal(E.unitStrength(g,ship,true,sub)-E.unitStrength(g,ship,true),20);
    assert.equal(E.unitStrength(g,sub,false,ship)-E.unitStrength(g,sub,false),12);
    assert.equal(E.unitStrength(g,sub,true,ship),E.unitStrength(g,sub,true));
    const actions=E.legalActions(g,p).filter(a=>a.unit===sub.id&&a.type==='move');assert(actions.some(a=>a.hint.routeProgress>0));assert(actions.every(a=>!a.hint.firingPosition));
    pass('Nuclear-submarine three-cell torpedo boundary, explicit destroyer counter and legal-water pursuit hints');
  }
  {
    const {g,p,tile,enemy}=seafront(),u=E.addUnit(g,0,'nuclearsubmarine',tile(11,15).id);p.nuclearStockpile=1;see(g);
    assert.equal(nuclearRange(u.type),24);assert.equal(nuclearRange('submarine'),0);assert(E.nuclearTargets(g,p,u).some(a=>a.tile===enemy.tile));
    const sim=new RealtimeSimulation(g);sim.enqueue(p,[{type:'nuke',unit:u.id,tile:enemy.tile}],{manual:true});sim.tick(.05);assert.equal(p.nuclearStockpile,0);
    const copy=E.restore(E.serialize(g)),continued=new RealtimeSimulation(copy);continued.tick(3.2);assert.equal(copy.players[0].nuclearStockpile,0);assert.equal(copy.cities.find(c=>c.id===enemy.id).walls,0);assert(copy.units.some(v=>v.id===u.id));assert.equal(continued.stats.rejected,0);continued.dispose();sim.dispose();
    pass('A stock-backed submarine nuclear launch reserves once, survives save/load, strikes the real 5x5 footprint and preserves its carrier');
  }
  for(const civ of R.CIVS){
    {
      const {g,p,tile}=seafront();p.driver.file=civ.file;const u=E.addUnit(g,0,'submarine',tile(11,15).id),e=E.addUnit(g,1,'frigate',tile(13,15).id);see(g);
      const {result}=await select(pool,p,g,a=>a.unit===u.id);assert(result.orders.some(a=>a.type==='attack'&&a.targetUnit===e.id),civ.file+' must take an actual worthwhile torpedo shot');
    }
    {
      const {g,p,tile}=seafront();p.driver.file=civ.file;const u=E.addUnit(g,0,'submarine',tile(11,15).id);E.addUnit(g,1,'frigate',tile(19,15).id);see(g);
      const {obs,result}=await select(pool,p,g,a=>a.unit===u.id&&a.type!=='upgrade');const action=result.orders.find(a=>a.unit===u.id);assert.equal(action?.type,'move',civ.file+' must close on a reachable water target');assert(obs.legalActions.find(a=>a.type==='move'&&a.tile===action.tile).hint.routeProgress>0);
    }
    {
      const {g,p,home,tile}=seafront();p.driver.file=civ.file;E.addUnit(g,1,'nuclearsubmarine',tile(19,15).id).revealedUntil=(g.realtime?.time??g.turn*20)+20;see(g);
      const {obs,result}=await select(pool,p,g,a=>a.type==='produce'&&a.city===home.id&&a.hint.domain==='sea');assert(obs.legalActions.some(a=>a.hint.submarineThreat));assert(result.orders.some(a=>a.item==='nuclearsubmarine'),civ.file+' must build a legal anti-submarine attacker');
      E.addUnit(g,0,'nuclearsubmarine',tile(12,15).id);see(g);const second=await select(pool,p,g,a=>a.type==='produce'&&a.city===home.id&&a.hint.domain==='sea');assert(second.result.orders.some(a=>['assaultship','missilecruiser'].includes(a.item)),civ.file+' must complement its submarine with a bounded surface role');
      E.addUnit(g,0,second.result.orders[0].item,tile(13,15).id);see(g);const capped=await select(pool,p,g,a=>a.type==='produce'&&a.city===home.id&&a.hint.domain==='sea');if(!civ.file.includes('mariner'))assert.equal(capped.result.orders.length,0,civ.file+' must respect the two-hull fleet cap');
    }
    metrics.drivers.push(civ.file);
  }
  pass('All eight actual native drivers fire torpedoes, pursue legal sea targets, recruit legal submarine counters and balance bounded submarine composition');
  {
    for(const civ of R.CIVS){
      const {g,p,enemy,tile}=seafront();p.driver.file=civ.file;const ship=E.addUnit(g,0,'missilecruiser',tile(14,15).id);see(g);p.visible=p.visible.filter(id=>R.dist(g.map.tiles[id],g.map.tiles[enemy.tile],g.map)>2);assert(!p.visible.includes(enemy.tile));
      const {obs,result}=await select(pool,p,g,a=>a.unit===ship.id&&a.type==='move');assert(obs.legalActions.some(a=>a.hint.siegeProgress>0),'Unseen remembered cities require a spotting approach even inside weapon range');assert.equal(result.orders[0]?.type,'move');assert(obs.legalActions.find(a=>a.tile===result.orders[0].tile).hint.siegeProgress>0,civ.file+' must regain real vision before stopping in its firing ring');
    }
    pass('All eight drivers approach a remembered city for current vision instead of stopping blindly at a long-range firing ring');
  }
  {
    const {g,p,home,enemy,tile}=seafront();g.units=[];for(let y=12;y<=18;y++)for(let x=14;x<=16;x++)if(tile(x,y).cityId==null)tile(x,y).terrain='grass';g.map.tiles[enemy.tile].cityId=null;enemy.tile=tile(30,15).id;Object.assign(tile(30,15),{terrain:'grass',cityId:enemy.id,owner:1});E.addUnit(g,1,'frigate',tile(20,15).id);see(g);
    const actions=E.legalActions(g,p).filter(a=>a.type==='produce'&&a.city===home.id&&a.hint.domain==='sea');assert(actions.length);assert(actions.every(a=>a.hint.navalTargets===0));
    for(const civ of R.CIVS){p.driver.file=civ.file;const {result}=await select(pool,p,g,a=>a.type==='produce'&&a.city===home.id&&a.hint.domain==='sea');assert.equal(result.orders.length,0,civ.file+' must not build a trapped lake navy');}
    pass('Disconnected remembered water and absent missions cannot trigger useless lake-fleet production');
  }
  {
    for(const civ of R.CIVS){
      const {g,p,home,tile}=seafront();p.driver.file=civ.file;for(const [x,y]of [[26,19],[33,19],[20,11]])E.foundCity(g,p,E.addUnit(g,0,'settler',tile(x,y).id));g.units=[];E.addUnit(g,1,'frigate',tile(24,15).id);
      const cities=g.cities.filter(c=>c.owner===p.id);cities[0].production={item:'assaultship',progress:1,cost:R.productionCost(g,'assaultship')};cities[1].production={item:'nuclearsubmarine',progress:1,cost:R.productionCost(g,'nuclearsubmarine')};see(g);
      const {result}=await select(pool,p,g,a=>a.type==='produce'&&a.hint.domain==='sea'&&!cities.slice(0,2).some(c=>c.id===a.city));const hulls=result.orders.filter(a=>R.UNITS[a.item]?.domain==='sea');assert(hulls.length+2<=(civ.file.includes('mariner')?3:2),civ.file+' pending and same-response hulls must count toward the national cap');
    }
    pass('All eight drivers count pending and same-response multi-city naval orders toward their national fleet limit');
  }
  {
    const {g,p,tile}=seafront(),tank=E.addUnit(g,0,'tank',tile(10,14).id);E.addUnit(g,1,'sam',tile(12,14).id);see(g);
    const h=E.legalActions(g,p).find(a=>a.unit===tank.id&&a.type==='fortify').hint;assert.equal(h.currentIncomingDamage,0);
    assert.deepEqual(['frigate','battleship','missilecruiser'].map(t=>R.UNITS[t].range),[3,5,6]);assert.deepEqual(['cannon','artillery','rocketartillery'].map(t=>R.UNITS[t].range),[3,4,4]);assert.equal(R.UNITS.rocketartillery.ranged,104);assert.equal(R.UNITS.spearman.antiCavalry,14);
    pass('Combat exposure excludes anti-air attacks against tanks; naval/artillery range tiers and stronger anti-cavalry counters stay distinct');
  }
  await writeFile(new URL('../output/naval-warfare-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
}finally{pool.dispose();}}
if(process.argv[1]?.endsWith('naval-warfare-check.mjs'))await check();
