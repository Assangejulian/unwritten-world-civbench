import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import * as H from '../src/heritage.mjs';
import * as F from '../src/religion.mjs';
import {indexMap,neighbors} from '../src/world.mjs';
import {fieldActions} from '../src/warfare.mjs';
import {developmentAIOrders} from '../src/realtime.mjs';
import {executeDriver} from '../src/drivers.mjs';
const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const save=new URL('../saves/autosave.json',import.meta.url),hash=buffer=>createHash('sha256').update(buffer).digest('hex'),before=hash(await readFile(save));
function field(){
 const g=E.createGame({players:2,size:'small',seed:'WONDER-LIFECYCLE',barbarians:false});g.units=[];g.cities=[];
 g.map=indexMap({width:24,height:18,wrapX:false,roadRules:1,tiles:Array.from({length:432},(_,id)=>({id,col:id%24,row:Math.floor(id/24),q:id%24-Math.floor(Math.floor(id/24)/2),r:Math.floor(id/24),terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[]}))});
 for(const p of g.players){p.gold=10000;p.faith=10000;p.techs=Object.keys(R.TECHS);p.civics=Object.keys(R.CIVICS);p.manual=true;E.foundCity(g,p,E.addUnit(g,p.id,'settler',p.id?230:125));}g.units=[];E.refreshVisibility(g);return {g,p:g.players[0],q:g.players[1],c:g.cities[0],d:g.cities[1]};
}
{
 const {g,p,q,c}=field(),tile=neighbors(g.map,g.map.tiles[c.tile])[0];Object.assign(tile,{terrain:'desert',hill:false,owner:0,territoryCity:c.id});
 E.applyAction(g,p,{type:'produce',city:c.id,item:'pyramids',tile:tile.id});
 assert.equal(E.snapshot(g,0).map.tiles[tile.id].construction.stage,'started');
 assert.equal(E.snapshot(g,1).map.tiles[tile.id].construction,undefined);
 q.explored.push(tile.id);q.knownTiles[tile.id]=structuredClone(tile);q.visible=[];
 assert.equal(E.snapshot(g,1).map.tiles[tile.id].construction,undefined);
 c.production.progress=c.production.cost*.5;assert.equal(E.snapshot(g,0).map.tiles[tile.id].construction.stage,'building');
 c.production.progress=c.production.cost;E.finishTurn(g,{actions:false});
 assert(g.wonders.pyramids);assert.equal(E.snapshot(g,0).map.tiles[tile.id].construction,undefined);assert.equal(tile.district.kind,'wonder');
 const grants=g.units.length;H.heritageCompleted(g,p,c,'pyramids',{});assert.equal(g.units.length,grants);
 pass('Actual construction progresses started -> building -> complete without hidden-site disclosure or repeated completion gifts');
}
{
 const {g,c}=field(),t=neighbors(g.map,g.map.tiles[c.tile])[0];t.district={kind:'wonder',item:'pyramids',city:c.id};t.pillaged=true;g.wonders.pyramids={item:'pyramids',city:c.id,tile:t.id,owner:0,birthGranted:true};
 c.production={item:'pyramids',tile:t.id,repair:true,cost:30,progress:17};c.storedProduction=9;
 const restored=E.restore(E.serialize(g)),city=restored.cities.find(v=>v.id===c.id);assert.equal(city.production,null);assert.equal(city.storedProduction,26);assert.equal(restored.map.tiles[t.id].pillaged,false);
 assert.equal(E.restore(E.serialize(restored)).cities.find(v=>v.id===c.id).storedProduction,26);
 pass('Old damaged wonders restore intact and obsolete repair progress is refunded exactly once');
}
{
 const {g,p,q,c,d}=field(),own=neighbors(g.map,g.map.tiles[c.tile])[0],ring=neighbors(g.map,g.map.tiles[d.tile]),t=ring[0],ordinary=ring[1];
 own.owner=0;own.district={kind:'district',item:'missilesilo',city:c.id};c.districts.push({item:'missilesilo',tile:own.id});c.buildings.push('missilesilo');
 t.owner=1;t.district={kind:'wonder',item:'petra',city:d.id};g.wonders.petra={item:'petra',city:d.id,tile:t.id,owner:1,birthGranted:true};d.buildings.push('petra');
 ordinary.owner=1;ordinary.district={kind:'district',item:'campus',city:d.id};d.districts.push({item:'campus',tile:ordinary.id});d.buildings.push('campus');
 p.relations[1].status=q.relations[0].status='war';p.nuclearStockpile=1;p.visible=g.map.tiles.map(t=>t.id);p.explored=[...p.visible];
 const invader=E.addUnit(g,0,'infantry',t.id);assert(!fieldActions(g,p,invader).some(a=>a.type==='pillage'));assert.throws(()=>E.applyAction(g,p,{type:'pillage',unit:invader.id}));g.units=[];
 E.applyAction(g,p,{type:'nuke',city:c.id,tile:d.tile});assert(!t.pillaged);assert.equal(ordinary.pillaged,true);assert(H.operationalWonder(g,'petra',1));
 d.hp=0;d.walls=0;const soldier=E.addUnit(g,0,'infantry',ring[2].id);soldier.moves=3;p.visible=g.map.tiles.map(t=>t.id);
 E.applyAction(g,p,{type:'attack',unit:soldier.id,targetCity:d.id});assert.equal(d.owner,0);assert(H.operationalWonder(g,'petra',0));assert(!H.operationalWonder(g,'petra',1));
 pass('Real pillage is rejected and nuclear strikes preserve wonders while damaging ordinary districts; actual conquest transfers their benefits');
}
{
 const obs={turn:20,player:{faith:200,beliefs:{},focus:'science'},units:[],cities:[],legalActions:[{type:'belief',item:'a',category:'enhancer',hint:{faithCost:100}},{type:'belief',item:'b',category:'worship',hint:{faithCost:100}},{type:'patronizeGreatPerson',item:'gp',currency:'faith'}],greatPeople:{candidates:[{key:'gp',points:70,threshold:100,faith:90}]}};
 const orders=developmentAIOrders(obs);assert.equal(orders.filter(a=>a.type==='belief').length,2);assert(!orders.some(a=>a.type==='patronizeGreatPerson'));assert.equal(orders.reduce((n,a)=>n+(a.hint?.faithCost||0),0),200);
 obs.legalActions=[{type:'affiliateReligion',player:1}];obs.player.faith=120;assert.equal(developmentAIOrders(obs)[0].hint.faithCost,120);
 const patron={player:{faith:100},units:[],cities:[],greatPeople:{candidates:['a','b'].map(key=>({key,points:70,threshold:100,faith:80}))},legalActions:['a','b'].map(item=>({type:'patronizeGreatPerson',item,currency:'faith'}))};assert.equal(H.heritageAIOrders(patron).length,1);
 pass('Religion, affiliation and multiple Great Person sponsors share a bounded national faith budget');
}
{
 const gp={id:1,greatPerson:'chandragupta_maurya'},fresh={id:2,type:'warrior',hp:100},buffed={id:3,type:'infantry',hp:100,heritageEffects:{sun_tzu:{combat:10}}};
 const obs={turn:20,player:{faith:0},cities:[],units:[gp,fresh,buffed],legalActions:[{type:'activateGreatPerson',unit:1,targetUnit:3},{type:'activateGreatPerson',unit:1,targetUnit:2}]};
 assert.equal(H.heritageAIOrders(obs)[0].targetUnit,2);
 obs.legalActions=[{type:'move',unit:1,tile:1,hint:{greatPersonProgress:5,danger:1}},{type:'move',unit:1,tile:2,hint:{greatPersonProgress:2,danger:0,rangedThreat:0}}];assert.equal(H.heritageAIOrders(obs)[0].tile,2);
 pass('Commander targeting accounts for highest-only gains and Great People avoid known hostile routes');
}
{
 const {g,p,c}=field(),t=neighbors(g.map,g.map.tiles[c.tile])[0];t.district={kind:'district',item:'holy',city:c.id};t.owner=0;t.river=true;c.districts.push({item:'holy',tile:t.id});c.buildings.push('holy');
 for(const n of neighbors(g.map,t))n.terrain='tundra';const aurora=F.PANTHEONS.find(x=>x.key==='dance_of_the_aurora');const rich=F.religionChoiceUtility(g,p,aurora);for(const n of neighbors(g.map,t))n.terrain='grass';assert(rich>F.religionChoiceUtility(g,p,aurora));
 assert.equal(H.wonderAIUtility(g,p,c,'oxford')>=0,true);
 pass('Pantheon utility follows actual holy-site adjacency and wonder utility reads the real catalogue');
}
for(const algorithm of ['A','B']){
 const {g,p,c}=field();g.settings.aiAlgorithm=algorithm;p.religion='wisdom';c.buildings.push('holy','shrine','temple');
 let obs=E.observation(g,p);const recruit=obs.legalActions.find(a=>a.type==='recruitFaith'&&a.item==='missionary');assert(recruit);
 obs.player.plan={...obs.player.plan,goal:'religion'};obs.legalActions=[recruit];obs.player.faith=recruit.hint.faithCost;obs.player.committedFaith=obs.player.faith;
 assert(!(await executeDriver(p,obs)).orders.some(a=>a.type==='recruitFaith'));
 obs.player.committedFaith=0;assert((await executeDriver(p,obs)).orders.some(a=>a.type==='recruitFaith'));
 const low={type:'produce',city:c.id,item:'pyramids',tile:1,hint:{kind:'wonder',turns:10,wonderUtility:0}},high={...low,item:'oxford',hint:{...low.hint,wonderUtility:40}};
 obs.legalActions=[low,high];assert.equal((await executeDriver(p,obs)).orders.find(a=>a.type==='produce')?.item,'oxford');
 pass(algorithm+' native executable honors committed faith and actual wonder suitability hints');
}
assert.equal(hash(await readFile(save)),before);
await writeFile(new URL('../output/wonder-lifecycle-ai-20261016/focused-checks.json',import.meta.url),JSON.stringify({checks,activeSaveHash:before,activeSaveWritten:false},null,2));
