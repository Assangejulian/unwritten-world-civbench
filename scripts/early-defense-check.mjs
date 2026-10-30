// Real combat and all eight native policies: fund a bounded guard without erasing development.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {domesticSituation} from '../src/domestic.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
const root=path.resolve(import.meta.dirname,'..'),baseline=path.join(root,'output/early-balance-20261011/baseline');
const old=await import(pathToFileURL(path.join(baseline,'src/engine.mjs')).href),oldRules=await import(pathToFileURL(path.join(baseline,'src/rules.mjs')).href);
const checks=[],metrics={damage:[],drivers:[],economy:[]},pool=new NativeDriverPool(),pass=n=>{checks.push(n);console.log('PASS '+n);};
function field(count=2,engine=E){
 const g=engine.createGame({players:3,barbarians:false,seed:'EARLY-GUARD'});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false,road:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 for(const p of g.players)Object.assign(p,{manual:false,gold:400,techs:['archery','bronze','writing','currency'],civics:[],met:[],strategy:'adaptive',doctrine:'balanced'});
 const p=g.players[0];for(let i=0;i<count;i++){const c=engine.foundCity(g,p,engine.addUnit(g,0,'settler',tile(8+i*8,12).id));c.population=4;}
 engine.foundCity(g,g.players[1],engine.addUnit(g,1,'settler',tile(45,30).id));g.units=[];g.turn=12;engine.refreshVisibility(g);
 return {g,p,tile};
}
async function decide(g,p,file,keep){p.driver.file=file;const obs=E.observation(g,p);obs.legalActions=obs.legalActions.filter(keep);return {obs,out:await pool.execute(p,obs)};}
const military=a=>a.type==='produce'&&R.UNITS[a.item]&&!R.UNITS[a.item].civilian&&(R.UNITS[a.item].domain||'land')==='land'&&!R.UNITS[a.item].siege&&!R.UNITS[a.item].airOnly&&a.item!=='scout';
const choices=a=>military(a)||a.type==='produce'&&['campus','monument','granary','commercial','library'].includes(a.item);
try{
 for(const target of ['warrior','spearman'])for(const territory of ['neutral','attacker','defender']){
  const hits=[];for(const engine of [old,E]){
   const samples=[];for(let i=0;i<32;i++){
    const {g,tile}=field(1,engine),attacker=g.players[1],defender=g.players[0];attacker.techs=['archery'];defender.techs=['bronze'];attacker.civics=defender.civics=[];
    attacker.relations[0].status=defender.relations[1].status='war';const a=engine.addUnit(g,1,'archer',tile(15,18).id),b=engine.addUnit(g,0,target,tile(17,18).id);g.rngState=1000+i*7919;
    tile(15,18).owner=territory==='attacker'?1:null;tile(17,18).owner=territory==='defender'?0:null;engine.refreshVisibility(g);
    const hint=engine.legalActions(g,attacker).find(x=>x.type==='attack'&&x.unit===a.id&&x.targetUnit===b.id)?.hint;assert(hint);
    const hp=b.hp;engine.applyAction(g,attacker,{type:'attack',unit:a.id,targetUnit:b.id});samples.push(hp-b.hp);
    if(engine===E){assert(Math.abs(hp-b.hp-hint.expectedDamage)<=hint.expectedDamage*.13+1);assert.equal(a.hp,100);}
   }hits.push({mean:samples.reduce((n,s)=>n+s,0)/samples.length,min:Math.min(...samples),max:Math.max(...samples)});
  }
  assert(hits[1].mean<hits[0].mean*.85);assert(hits[1].mean>hits[0].mean*.7);assert(hits[1].max<45);metrics.damage.push({target,territory,before:hits[0],after:hits[1]});
 }
 assert.equal(R.UNITS.archer.ranged,22);assert.equal(R.UNITS.archer.range,oldRules.UNITS.archer.range);assert.equal(R.UNITS.crossbow.ranged,oldRules.UNITS.crossbow.ranged);
 pass('Real seeded archer strikes against fresh warriors/spearmen lose about twenty percent damage, preserve range and match native previews');
 {
  for(const engine of [old,E]){const g=engine.createGame({players:2,barbarians:false,seed:'STARTER-PAY'}),p=g.players[0];engine.applyAction(g,p,{type:'found',unit:g.units.find(u=>u.owner===0&&u.type==='settler').id});const f=engine.militaryFinance(g,p);metrics.economy.push({version:engine===old?'baseline':'candidate',...f});if(engine===E){assert(f.grossGold>=f.upkeep);const capital=g.cities.find(c=>c.id===p.capital),base=engine.cityYields(g,capital).gold;p.capital=null;const without=engine.cityYields(g,capital).gold;assert(base>without+5.9);p.capital=capital.id;}}
  assert.equal(R.unitUpkeep('warrior').total,3.6);assert.equal(R.unitUpkeep('tank').maintenance,50);
 }
 pass('A starting capital sustains its real warrior/scout payroll; only the active capital receives the grant and model costs stay intact');
 for(const civ of R.CIVS){
  const {g,p,tile}=field(4);E.addUnit(g,0,'warrior',tile(9,13).id);E.addUnit(g,0,'scout',tile(10,13).id);E.refreshVisibility(g);
  const {obs,out}=await decide(g,p,civ.file,choices),target=domesticSituation(g,p).reserveTarget,recruits=out.orders.filter(military);assert(recruits.length>0,civ.file+' must maintain a peace guard');assert.equal(recruits.length,target-1,civ.file+' counts same-response recruits');assert(out.orders.filter(a=>a.type==='produce'&&!military(a)).length>0,civ.file+' retains development');
  for(const a of recruits)E.applyAction(g,p,a);assert.equal(domesticSituation(g,p).reservePending+domesticSituation(g,p).reserveReady,target);
  metrics.drivers.push({file:civ.file,target,recruits:recruits.map(a=>({city:a.city,item:a.item})),development:out.orders.filter(a=>a.type==='produce'&&!military(a)).map(a=>a.item)});
 }
 pass('All eight real drivers fund a small peacetime guard, count scouts separately and retain nonmilitary city production');
 for(const civ of R.CIVS){
  const {g,p,tile}=field(4),target=domesticSituation(g,p).reserveTarget;for(let i=0;i<target;i++)E.addUnit(g,0,i%2?'archer':'warrior',tile(8+i,15).id);E.refreshVisibility(g);
  const {out}=await decide(g,p,civ.file,choices);assert(out.orders.some(a=>a.type==='produce'&&!military(a)),civ.file+' resumes development after covering guard');
  assert(out.orders.filter(military).length<=Math.max(0,2),civ.file+' does not convert every city to military');
 }
 pass('Covered reserves remove the recruitment bonus for every driver; development continues instead of an all-city military switch');
 for(const civ of R.CIVS){
  const {g,p,tile}=field(2);p.gold=2000;const home=E.addUnit(g,0,'warrior',tile(9,13).id);home.hp=50;
  const water=tile(10,13);water.terrain='coast';E.addUnit(g,0,'warrior',water.id);p.techs.push('sailing');E.refreshVisibility(g);
  assert.equal(domesticSituation(g,p).reserveReady,.5);const {out}=await decide(g,p,civ.file,choices);assert.equal(out.orders.filter(military).length,2,civ.file+' discounts damaged and embarked guards');
 }
 pass('All eight policies discount wounded defenders and exclude embarked land units from the homeland guard');
 for(const civ of R.CIVS){
  const {g,p,tile}=field(4);p.gold=0;E.addUnit(g,0,'warrior',tile(9,13).id);E.refreshVisibility(g);const obs=E.observation(g,p);obs.player.finance.grossGold=0;obs.player.finance.domesticGold=0;obs.player.finance.projectedUpkeep=3.6;obs.player.finance.arrears=50;obs.legalActions=obs.legalActions.filter(choices);p.driver.file=civ.file;
  const out=await pool.execute(p,obs);assert(!out.orders.some(military),civ.file+' must not fund an insolvent peace army');assert(out.orders.some(a=>a.type==='produce'&&a.item==='commercial'),civ.file+' repairs income');
 }
 pass('Every driver rejects insolvent or indebted peace recruitment and repairs the economy instead');
 {
  const {g,p,tile}=field(2);p.met=[1];p.knownCities={999:{id:999,owner:1,tile:tile(18,18).id}};const enemy=E.addUnit(g,1,'archer',tile(15,18).id);p.visible=p.visible.filter(id=>id!==enemy.tile);const a=domesticSituation(g,p);enemy.type='modernarmor';enemy.hp=1;assert.equal(domesticSituation(g,p).reserveTarget,a.reserveTarget);assert.equal(domesticSituation(g,p).preparation,a.preparation);
  assert.equal(a.preparation,1);p.knownCities={};assert.equal(domesticSituation(g,p).preparation,0);
  for(const [x,y]of [[10,16],[11,16],[12,16]]){const u=E.addUnit(g,1,'warrior',tile(x,y).id);p.visible.push(u.tile);}assert.equal(domesticSituation(g,p).preparation,1);
  p.relations[1].status='alliance';assert.equal(domesticSituation(g,p).preparation,0);p.relations[1].status='peace';p.relations[1].truceUntil=1000;assert.equal(domesticSituation(g,p).preparation,0);
  const large=field(8);assert(domesticSituation(large.g,large.p).reserveTarget<=6);
 }
 pass('Preparation uses sighted troops and remembered borders only, respects alliances/truces and caps the standing guard at six');
}finally{pool.dispose();}
await mkdir(path.join(root,'output/early-balance-20261011'),{recursive:true});const sources={};for(const f of ['src/rules.mjs','src/engine.mjs','src/domestic.mjs','sdk/civ.hpp','scripts/early-defense-check.mjs'])sources[f]=createHash('sha256').update(await readFile(path.join(root,f))).digest('hex');
await writeFile(path.join(root,'output/early-defense-checks.json'),JSON.stringify({passed:true,checks,metrics,sources,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
