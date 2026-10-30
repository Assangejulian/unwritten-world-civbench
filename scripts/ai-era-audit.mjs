import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {beginWar} from '../src/warfare.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';

// Controlled native observations measure choices, not population-wide production rates.
const pool=new NativeDriverPool(),rows=[],checks=[],probe=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
function see(g){E.refreshVisibility(g);for(const p of g.players){p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,{id:c.id,owner:c.owner,name:c.name,tile:c.tile}]));}}
function field(era,{war=true,oil=true,walls=0}={}){
 const g=E.createGame({players:2,size:'small',seed:'AI-ERA-AUDIT',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 for(const p of g.players)Object.assign(p,{manual:true,gold:5000,met:[1-p.id],strategy:'domination',doctrine:'balanced',techs:Object.keys(R.TECHS).filter(k=>R.TECHS[k].era<=era),civics:Object.keys(R.CIVICS).filter(k=>R.CIVICS[k].era<=era)});
 const p=g.players[0],q=g.players[1],home=E.foundCity(g,p,E.addUnit(g,0,'settler',tile(10,12).id)),enemy=E.foundCity(g,q,E.addUnit(g,1,'settler',tile(17,12).id));home.population=8;enemy.population=8;g.units=[];g.turn=120;
 for(const [i,key]of ['iron','horses',...(oil?['oil']:[])].entries())Object.assign(tile(10+i,13),{owner:0,resource:key,improvement:key==='oil'?'well':key==='horses'?'pasture':'mine'});
 if(era>=5){const base=tile(11,12);Object.assign(base,{owner:0,district:{item:'airport',city:home.id,kind:'district'}});home.districts.push({item:'airport',tile:base.id});home.buildings.push('airport');}
 if(walls){enemy.buildings=R.WALL_TIERS.slice(1,walls+1).map(t=>t.building);enemy.walls=R.cityWallCapacity(enemy);}
 const sim=new RealtimeSimulation(g);if(war)beginWar(g,p,q,E.event);see(g);return {g,p,q,home,enemy,tile,sim};
}
async function decide(g,p,file,filter){p.driver.file=file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(filter);return {obs,orders:(await pool.execute(p,obs)).orders};}
try{
 for(const era of [0,1,2,3,4,5,6,7])for(const war of [false,true]){
  const {g,p,home,sim}=field(era,{war});
  try{for(const civ of R.CIVS){
   const filter=a=>a.type==='produce'&&a.city===home.id;
   const full=await decide(g,p,civ.file,filter),military=await decide(g,p,civ.file,a=>filter(a)&&a.hint.military&&a.item!=='scout');
   rows.push({era,eraName:R.ERAS[era],war,driver:civ.file,goal:full.obs.player.plan.goal,target:full.obs.legalActions[0]?.hint.militaryTarget,allProductionChoice:full.orders[0]?.item||null,militaryOnlyChoice:military.orders[0]?.item||null,options:military.obs.legalActions.map(a=>({item:a.item,strength:Math.max(a.hint.strength,a.hint.ranged),turns:a.hint.turns,obsolete:a.hint.obsolete}))});
  }}finally{sim.dispose();}
 }
 assert.equal(rows.length,128);assert(rows.every(r=>r.target===(r.war?6:5)));pass('Eight actual drivers complete 128 controlled era/peace/war scenarios; era alone does not change the national recruitment target');
 for(const walls of [1,2,3,4]){
  const {g,p,home,sim}=field(7,{walls});try{for(const civ of R.CIVS){const {orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&a.city===home.id&&a.hint.siege);probe.push({kind:'matching-wall',walls,driver:civ.file,choice:orders[0]?.item||null});assert.equal(R.UNITS[orders[0]?.item]?.siegeTier,walls);}}finally{sim.dispose();}
 }
 pass('All eight information-era drivers retain lower-era siege equipment when it matches the observed wall tier');
 {
  const {g,p,home,sim}=field(7,{oil:false});const unavailable=E.productionOptions(g,p,home).map(a=>a.item);for(const type of ['tank','modernarmor','artillery','rocketartillery','bomber','drone'])assert(!unavailable.includes(type));sim.dispose();pass('Missing strategic oil excludes advanced armor, oil siege and aircraft instead of merely reducing their scores');
 }
 {
  const {g,p,home,enemy,tile,sim}=field(7,{walls:4}),base=tile(11,12),plane=E.addUnit(g,0,'drone',base.id);see(g);assert(E.attackTargets(g,p,plane).some(a=>a.targetCity===enemy.id));assert.equal(R.UNITS.drone.range,8);assert.equal(R.UNITS.drone.rebaseRange,16);assert.equal(R.UNITS.drone.ranged,118);assert.equal(R.wallDamageMultiplier('drone',enemy),1.75);assert.equal(R.occupationUnit('drone'),false);
  const action={type:'attack',unit:plane.id,targetCity:enemy.id},before=enemy.walls;sim.enqueue(p,[action]);sim.tick(2);assert(enemy.walls<before);assert.equal(plane.tile,base.id);probe.push({kind:'actual-drone-sortie',wallsBefore:before,wallsAfter:enemy.walls,hpAfter:enemy.hp,planeHp:plane.hp,base:base.id,attackUntil:plane.attackUntil,time:g.realtime.time});
  plane.acted=false;plane.moves=1;plane.attackUntil=plane.cooldownUntil=0;enemy.walls=0;enemy.hp=200;see(g);E.applyAction(g,p,action);assert(enemy.hp<200);enemy.walls=enemy.hp=0;plane.acted=false;plane.moves=1;plane.attackUntil=plane.cooldownUntil=0;assert(!E.attackTargets(g,p,plane).some(a=>a.targetCity===enemy.id));assert.equal(enemy.owner,1);
  sim.dispose();pass('A real drone sortie damages concrete walls, stays at its airport, damages an unwalled city and cannot occupy a breached city');
 }
 for(const civ of R.CIVS){const {g,p,enemy,tile,sim}=field(7,{walls:4});try{const plane=E.addUnit(g,0,'drone',tile(11,12).id);see(g);const {orders}=await decide(g,p,civ.file,a=>a.unit===plane.id);assert(orders.some(a=>a.type==='attack'&&a.targetCity===enemy.id));}finally{sim.dispose();}}
 pass('All eight actual native drivers select an available drone bombing run against concrete walls');
 for(const civ of R.CIVS){const {g,p,home,tile,sim}=field(7);try{E.addUnit(g,1,'modernarmor',tile(9,12).id);see(g);const {obs,orders}=await decide(g,p,civ.file,a=>a.type==='produce'&&a.city===home.id&&a.hint.military&&a.hint.domain==='land');probe.push({kind:'emergency-modern-invader',driver:civ.file,choice:orders[0]?.item||null,options:obs.legalActions.map(a=>({item:a.item,strength:Math.max(a.hint.strength,a.hint.ranged),turns:a.hint.turns,obsolete:a.hint.obsolete,minStrength:a.hint.minDefenseStrength,urgency:a.hint.defenseUrgency}))});}finally{sim.dispose();}}
 const bytes=await readFile(new URL('../saves/autosave.json',import.meta.url)),g=E.restore(bytes.toString());
 const live={world:g.id,turn:g.turn,sha256AtRead:createHash('sha256').update(bytes).digest('hex'),players:g.players.filter(p=>p.alive).map(p=>{const units=g.units.filter(u=>u.owner===p.id&&!R.UNITS[u.type].civilian),counts=Object.fromEntries([...new Set(units.map(u=>u.type))].map(k=>[k,units.filter(u=>u.type===k).length]));return {id:p.id,name:p.name,era:R.civilizationEra(p),units:counts,queued:g.cities.filter(c=>c.owner===p.id&&R.UNITS[c.production?.item]&&!R.UNITS[c.production.item].civilian).map(c=>({city:c.id,item:c.production.item})),gold:p.gold};})};
 await writeFile(new URL('../output/ai-era-audit.json',import.meta.url),JSON.stringify({passed:true,version:'2.15.3',checks,rows,probe,live,findings:[{code:'emergency-speed-dominance',status:'observed',scoringChanged:false,drivers:probe.filter(p=>p.kind==='emergency-modern-invader').map(p=>({driver:p.driver,choice:p.choice})),description:'An obsolete two-period warrior beats a fifty-period modernarmor against a visible modernarmor under maximum defense urgency.'}],gameLaunched:false,activeSaveWritten:false},null,2)+'\n');
 console.log(JSON.stringify({rows:rows.length,checks,byEra:[0,1,2,3,4,5,6,7].map(era=>({era:R.ERAS[era],peace:rows.filter(r=>r.era===era&&!r.war).map(r=>r.militaryOnlyChoice),war:rows.filter(r=>r.era===era&&r.war).map(r=>r.militaryOnlyChoice),fullWar:rows.filter(r=>r.era===era&&r.war).map(r=>r.allProductionChoice)})),live},null,2));
}finally{pool.dispose();}
