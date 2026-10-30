import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {generateMap} from '../src/world.mjs';
import {createGame,applyAction,applyOrders,finishTurn,observation,serialize,restore,cityYields,snapshot,addUnit,refreshVisibility,attackTargets,legalActions} from '../src/engine.mjs';
import {executeDriver,runProcess,compileDriver,ROOT} from '../src/drivers.mjs';
import {UNITS,dist} from '../src/rules.mjs';
import path from 'node:path';

const report={checks:[],native:{},errors:[]};
function check(name,fn){fn();report.checks.push(name);console.log(`PASS ${name}`);}
check('Seeded maps reproduce exactly and distinct seeds differ',()=>{assert.deepEqual(generateMap('SAME',30,20,8),generateMap('SAME',30,20,8));assert.notDeepEqual(generateMap('A',30,20,8).tiles.map(t=>t.terrain),generateMap('B',30,20,8).tiles.map(t=>t.terrain));});
check('Forty random maps support eight separated land starts',()=>{for(let i=0;i<40;i++){const map=generateMap('CHECK-'+i,38,26,8);assert.equal(new Set(map.starts).size,8);for(const id of map.starts){assert(!['ocean','coast','mountain'].includes(map.tiles[id].terrain));for(const other of map.starts)if(other!==id)assert(dist(map.tiles[id],map.tiles[other])>=4);}}});
const basic=createGame({seed:'RULES',players:2,barbarians:false});
check('Founding creates territory, capital, population and finite economy',()=>{for(const p of basic.players){const u=basic.units.find(u=>u.owner===p.id&&u.type==='settler');applyAction(basic,p,{type:'found',unit:u.id});}assert.equal(basic.cities.length,2);for(const c of basic.cities){assert.equal(c.population,1);assert.equal(basic.map.tiles[c.tile].owner,c.owner);assert(Number.isFinite(cityYields(basic,c).science));}});
check('Illegal orders are rejected without blocking later valid orders',()=>{const p=basic.players[0],report=applyOrders(basic,p,[{type:'research',item:'nanotech'},{type:'research',item:'mining'}]);assert.equal(report.rejected.length,1);assert.equal(report.accepted,1);assert.equal(p.research,'mining');});
check('Production, research and city growth advance through real turns',()=>{const p=basic.players[0],c=basic.cities[0];applyAction(basic,p,{type:'produce',city:c.id,item:'monument'});for(let i=0;i<40;i++)finishTurn(basic);assert(c.buildings.includes('monument'));assert(p.techs.includes('mining'));assert(c.population>1);});
check('Fog projection hides unexplored tiles and unseen opponents',()=>{const p=basic.players[0],obs=observation(basic,p),visible=new Set(p.visible),snap=snapshot(basic,0);assert(snap.map.tiles.some(t=>t.hidden));assert(obs.enemies.every(u=>visible.has(u.tile)));assert(snap.units.every(u=>u.owner===0||visible.has(u.tile)));assert.equal(snap.players[1].gold,undefined);});
check('Save round trip preserves random state and next-turn outcome',()=>{const copy=restore(serialize(basic));assert.equal(serialize(copy),serialize(basic));finishTurn(copy);finishTurn(basic);assert.equal(serialize(copy),serialize(basic));});
check('War is required for combat and ranged attacks cannot capture cities',()=>{const g=createGame({seed:'BATTLE',players:2,barbarians:false});for(const p of g.players)applyAction(g,p,{type:'found',unit:g.units.find(u=>u.owner===p.id&&u.type==='settler').id});const enemy=g.cities[1],t=g.map.tiles[enemy.tile],adj=g.map.tiles.find(n=>dist(n,t)===1&&!['ocean','coast','mountain'].includes(n.terrain));const archer=addUnit(g,0,'archer',adj.id);refreshVisibility(g);assert(!attackTargets(g,g.players[0],archer).some(a=>a.targetCity===enemy.id));g.players[0].relations[1].status='war';g.players[1].relations[0].status='war';enemy.hp=1;applyAction(g,g.players[0],{type:'attack',unit:archer.id,targetCity:enemy.id});assert.equal(enemy.owner,1);assert.equal(enemy.hp,0);});
check('All legal actions have valid referenced entities',()=>{for(const p of basic.players)for(const a of legalActions(basic,p)){if(a.unit!==undefined)assert(basic.units.some(u=>u.id===a.unit&&u.owner===p.id));if(a.city!==undefined)assert(basic.cities.some(c=>c.id===a.city&&c.owner===p.id));}});
const timeout=await runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{timeout:80}).then(()=>false,e=>e.message.includes('80ms'));
assert(timeout);report.checks.push('Driver timeouts terminate execution');console.log('PASS Driver timeouts terminate execution');

// Include late cultural/religious development instead of assuming it finishes by period 120.
const turns=Number(process.env.CIV_CHECK_TURNS)||180;
const g=createGame({seed:'EIGHT-NATIVE-PLAYERS',players:8,maxTurns:180});
for(const p of g.players)await compileDriver(p.driver.file);
console.log(`Running ${turns} rounds with eight native C++ executables...`);
const started=performance.now();let calls=0,rejected=0;
for(let turn=0;turn<turns&&!g.winner;turn++){
  const first=(g.turn-1)%g.players.length;
  for(let i=0;i<g.players.length;i++){
    const p=g.players[(first+i)%g.players.length];if(!p.alive)continue;
    const response=await executeDriver(p,observation(g,p));calls++;p.memory=response.memory;p.driver.calls++;p.driver.lastMs=response.ms;
    const applied=applyOrders(g,p,response.orders);rejected+=applied.rejected.length;
    if(applied.rejected.length)report.errors.push({turn:g.turn,player:p.id,rejected:applied.rejected});
  }
  finishTurn(g);
  for(const p of g.players){assert(Number.isFinite(p.gold)&&p.gold>=0);assert(Number.isFinite(p.faith));assert(g.units.filter(u=>u.owner===p.id).every(u=>u.hp>0&&u.hp<=100&&g.map.tiles[u.tile]));}
  for(const c of g.cities){assert(c.hp>=0&&c.hp<=200);assert(c.population>=1);assert(c.buildings.length===new Set(c.buildings).size);}
  if((turn+1)%20===0)console.log(`Round ${g.turn}: ${g.cities.length} cities, ${g.units.length} units, ${Object.keys(g.wonders).length} wonders.`);
}
assert(g.players.every(p=>p.driver.calls>0));assert(g.cities.length>=8);assert(g.players.filter(p=>p.techs.length>=3).length>=6);assert(g.players.filter(p=>p.civics.length>=2).length>=6);
if(turns>=80){assert(g.cities.length>8);assert(Object.keys(g.wonders).length>0);assert(g.players.some(p=>p.religion));}
report.native={turn:g.turn,calls,rejected,elapsedSeconds:Math.round((performance.now()-started)/1000),cities:g.cities.length,units:g.units.length,wonders:Object.keys(g.wonders),religions:g.players.filter(p=>p.religion).map(p=>p.short),wars:g.players.flatMap(p=>Object.entries(p.relations).filter(([,r])=>r.grievances>0).map(([id])=>[p.id,Number(id)])).filter(([a,b])=>a<b),players:g.players.map(p=>({name:p.name,calls:p.driver.calls,cities:g.cities.filter(c=>c.owner===p.id).length,technologies:p.techs.length,civics:p.civics.length,gold:p.gold})),winner:g.winner};
report.passed=true;await mkdir(path.join(ROOT,'output'),{recursive:true});await writeFile(path.join(ROOT,'output','engine-checks.json'),JSON.stringify(report,null,2));await writeFile(path.join(ROOT,'output','verified-game.json'),serialize(g));console.log(JSON.stringify(report.native,null,2));console.log('All engine and native-driver checks passed.');
