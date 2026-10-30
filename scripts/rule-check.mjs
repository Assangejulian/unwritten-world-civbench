import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {productionCost,purchaseCost} from '../src/rules.mjs';
import {createGame,addUnit,applyAction,finishTurn,canSettle,refreshVisibility,observation,snapshot,serialize,restore} from '../src/engine.mjs';
import {dist,isWater} from '../src/rules.mjs';
import {ROOT} from '../src/drivers.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {createHash} from 'node:crypto';
const checks=[];
function initial(count=2){const g=createGame({players:count,seed:'VICTORY-RULES',barbarians:false,maxTurns:40});for(const p of g.players){const u=g.units.find(u=>u.owner===p.id&&u.type==='settler');applyAction(g,p,{type:'found',unit:u.id});}return g;}
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
check('A successful melee assault captures the original capital and wins domination',()=>{const g=initial(),p=g.players[0],enemy=g.cities[1],tile=g.map.tiles[enemy.tile],adj=g.map.tiles.find(t=>!isWater(t)&&t.terrain!=='mountain'&&dist(t,tile)===1);const unit=addUnit(g,0,'musket',adj.id);p.relations[1].status='war';g.players[1].relations[0].status='war';enemy.hp=1;g.units=g.units.filter(u=>u.owner!==enemy.owner||u.tile!==enemy.tile);refreshVisibility(g);applyAction(g,p,{type:'attack',unit:unit.id,targetCity:enemy.id});assert.equal(enemy.owner,0);finishTurn(g);assert.equal(g.winner.type,'domination');assert.equal(g.winner.player,0);});
check('The turn limit declares a score victory with an intact multi-player game',()=>{const g=initial();for(let i=0;i<42&&!g.winner;i++)finishTurn(g);assert.equal(g.winner.type,'score');assert.equal(g.winner.turn,40);assert(g.players.every(p=>p.alive));});
check('A completed cultural project crosses the tourism target and wins culture',()=>{const g=initial(),p=g.players[0],city=g.cities[0];g.turn=70;g.maxTurns=240;p.tourism=3990;city.buildings.push('theater');applyAction(g,p,{type:'produce',city:city.id,item:'festival'});city.production.progress=productionCost(g,'festival')-1;finishTurn(g);assert.equal(g.winner.type,'culture');assert(p.tourism>=4000);});
check('Missionary actions convert foreign majorities and win religion',()=>{const g=initial(3),p=g.players[0];g.maxTurns=240;g.turn=50;
  for(const other of g.players.slice(1)){const tile=g.map.tiles.find(t=>canSettle(g,other,t));const unit=addUnit(g,other.id,'settler',tile.id);applyAction(g,other,{type:'found',unit:unit.id});}
  g.cities[0].buildings.push('holy');p.faith=120;applyAction(g,p,{type:'religion',item:'wisdom'});
  for(const c of g.cities.filter(c=>c.owner!==0)){const target=g.map.tiles[c.tile],tile=g.map.tiles.find(t=>!isWater(t)&&t.terrain!=='mountain'&&dist(t,target)===1);const unit=addUnit(g,0,'missionary',tile.id);refreshVisibility(g);applyAction(g,p,{type:'spread',unit:unit.id,targetCity:c.id});}
  finishTurn(g);assert.equal(g.winner.type,'religion');assert.equal(g.winner.player,0);
});
check('The final space project wins science only after actual production completion',()=>{const g=initial(),p=g.players[0],c=g.cities[0];p.techs.push('rocketry','satellites','nanotech');p.spaceStage=2;c.buildings.push('spaceport');const launch=g.map.tiles.find(t=>t.owner===p.id&&!t.cityId&&!t.district&&!isWater(t)&&t.terrain!=='mountain');launch.district={item:'spaceport',kind:'district',city:c.id};c.districts.push({item:'spaceport',tile:launch.id});applyAction(g,p,{type:'produce',city:c.id,item:'colony'});c.production.progress=productionCost(g,'colony')-1;assert.equal(g.winner,null);finishTurn(g);assert.equal(p.spaceStage,3);assert.equal(g.winner.type,'science');});
check('A blocked immediate unit purchase never charges or changes production',()=>{const g=initial(),p=g.players[0],c=g.cities[0];p.gold=10000;for(const t of g.map.tiles.filter(t=>t.owner===0&&dist(t,g.map.tiles[c.tile])<=2&&!isWater(t)&&t.terrain!=='mountain'))if(!g.units.some(u=>u.tile===t.id))addUnit(g,0,'builder',t.id);const before=p.gold,count=g.units.length;assert.throws(()=>applyAction(g,p,{type:'purchase',city:c.id,item:'builder'}));assert.equal(g.units.length,count);assert.equal(p.gold,before);assert.equal(c.production,null);});
const complete=await readFile(process.env.CIV_TEST_SAVE||path.join(ROOT,'saves','autosave.json'),'utf8');
check('The actual saved world restores exactly and hidden changes do not leak through fog',()=>{const g=restore(complete),sim=new RealtimeSimulation(g);sim.dispose();const hash=text=>createHash('sha256').update(text).digest('hex');assert.equal(hash(serialize(g)),hash(complete));const p=g.players[0],t=g.map.tiles.find(t=>p.explored.includes(t.id)&&!p.visible.includes(t.id));assert(t);const old=observation(g,p).tiles.find(tile=>tile.id===t.id);const before=JSON.stringify(old);t.owner=7;t.improvement='farm';t.camp=true;assert.equal(JSON.stringify(observation(g,p).tiles.find(tile=>tile.id===t.id)),before);assert.equal(snapshot(g,0).map.tiles[t.id].improvement,old.improvement);assert.throws(()=>restore('{}'));});
await mkdir(path.join(ROOT,'output'),{recursive:true});await writeFile(path.join(ROOT,'output','rule-checks.json'),JSON.stringify({passed:true,checks},null,2));
