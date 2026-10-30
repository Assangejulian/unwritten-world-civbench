import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {playerTasks} from '../src/player-tasks.mjs';
import {beginWar,canEnterTerritory} from '../src/warfare.mjs';
import {paintedFrameIndex} from '../web/painted-actions.js';
import {incomingBattles} from '../web/player-tasks.js';
import {scheduleActions} from '../web/action-schedule.js';
import {workSlots} from '../src/heritage.mjs';
import {field} from './imperial-fixture.mjs';
const out='output/player-feedback-20261019',checks=[];const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS '+name);};
const capture=(manual=true,{capital=false,far=false}={})=>{const f=field(),{g,p,q,tile}=f;p.manual=manual;p.strategy='domination';q.manual=false;beginWar(g,p,q,E.event);const c=capital?f.other:E.foundCity(g,q,E.addUnit(g,q.id,'settler',tile(far?22:15,far?9:8).id));c.hp=0;c.walls=0;const t=g.map.tiles[c.tile],u=E.addUnit(g,p.id,'warrior',g.map.index[`${t.q-1},${t.r}`].id);E.refreshVisibility(g);return {...f,c,u};};
await check('Current copied warrior can enter neutral land; no national-boundary movement rule exists',()=>{
 const g=E.restore(fs.readFileSync(out+'/world-input.json','utf8')),p=g.players.find(p=>p.manual),u=g.units.find(u=>u.owner===p.id&&u.type==='warrior');assert(u);const moves=E.reachable(g,p,u,true),neutral=moves.find(m=>g.map.tiles[m.tile].owner===null);assert(neutral);assert(canEnterTerritory(g,u,g.map.tiles[neutral.tile]));E.applyAction(g,p,{type:'move',unit:u.id,tile:neutral.tile});assert.equal(u.tile,neutral.tile);fs.writeFileSync(out+'/movement-diagnosis.json',JSON.stringify({inputTurn:g.turn,unit:u.id,legalNeutralDestination:neutral.tile,cost:neutral.cost,borderRule:false,sourceIssue:'Right pointer-up selected the destination before contextmenu attempted movement; terrain cost still limits each turn.'},null,2));
});
await check('Neutral forest/hill costs and closed foreign borders are preserved',()=>{
 const {g,p,q,tile}=field(),u=E.addUnit(g,p.id,'warrior',tile(8,8).id),to=tile(9,8);to.feature='forest';to.hill=true;assert.equal(E.movementCost(g,p,u,g.map.tiles[u.tile],to),2);assert(E.reachable(g,p,u).some(v=>v.tile===to.id));u.moves=1;assert(!E.reachable(g,p,u).some(v=>v.tile===to.id));to.owner=q.id;assert(!canEnterTerritory(g,u,to));
});
await check('Owner task ledger exposes real founding, equipment upgrades and veteran promotions',()=>{
 const {g,p,tile}=field();p.techs=Object.keys(R.TECHS);const settler=E.addUnit(g,p.id,'settler',tile(9,12).id),scout=E.addUnit(g,p.id,'scout',tile(4,3).id);scout.level=1;scout.xp=25;E.refreshVisibility(g);const tasks=playerTasks(g,p.id);assert(tasks.unitActions[settler.id].some(a=>a.action?.type==='found'));assert(tasks.unitActions[scout.id].some(a=>a.action?.type==='upgrade'));assert(tasks.unitActions[scout.id].some(a=>a.command==='trainVeteran'));scout.acted=true;assert.deepEqual(playerTasks(g,p.id).unitActions[scout.id],[]);assert.deepEqual(playerTasks(g,-1).tasks,[]);
});
await check('Task ledger switches between pantheon, production and actual city-defense targets without hidden units',()=>{
 const {g,p,q,home,tile}=field();p.faith=100;beginWar(g,p,q,E.event);home.walls=100;const enemy=E.addUnit(g,q.id,'warrior',tile(4,3).id);E.refreshVisibility(g);let t=playerTasks(g,p.id).tasks;assert(t.some(v=>v.kind==='pantheon'));assert(t.some(v=>v.kind==='production'));assert(t.find(v=>v.kind==='defense').targets.includes(enemy.id));home.attacked=true;assert.equal(playerTasks(g,p.id).tasks.find(v=>v.kind==='defense').targets.length,0);p.visible=p.visible.filter(id=>id!==enemy.tile);assert(!playerTasks(g,p.id).tasks.some(v=>v.kind==='defense'));
});
await check('Capture creates an owned pending decision and blocks End Turn until resolved',async()=>{
 const {g,p,c,u}=capture(),s=new GameSimulation(g);s.command(p,{type:'move',unit:u.id,tile:c.tile});assert.equal(c.owner,p.id);assert(c.capturePending);assert(playerTasks(g,p.id).tasks.some(t=>t.kind==='capture'&&t.city===c.id));await assert.rejects(s.endTurn(p.id),/请先决定/);s.command(p,{type:'keepCity',city:c.id});assert(!c.capturePending);assert.equal(c.owner,p.id);assert.throws(()=>s.command(p,{type:'razeCity',city:c.id}));s.dispose();
});
await check('Razing removes only the captured city and its territory, facilities and routes; unit remains legal',()=>{
 const {g,p,c,u,home}=capture(),s=new GameSimulation(g);s.command(p,{type:'move',unit:u.id,tile:c.tile});const owned=g.map.tiles.filter(t=>t.territoryCity===c.id).map(t=>t.id),homeTiles=g.map.tiles.filter(t=>t.territoryCity===home.id).map(t=>t.id);g.routes.push({id:g.nextId++,owner:p.id,from:home.id,to:c.id,remaining:10,path:[]});s.command(p,{type:'razeCity',city:c.id});assert(!g.cities.some(v=>v.id===c.id));assert(!g.routes.some(r=>r.to===c.id||r.from===c.id));assert(g.units.includes(u)&&u.tile===c.tile);for(const id of owned){assert.equal(g.map.tiles[id].owner,null);assert.notEqual(g.map.tiles[id].territoryCity,c.id);}for(const id of homeTiles)assert.equal(g.map.tiles[id].owner,p.id);assert.equal(g.map.tiles[c.tile].cityId,null);E.restore(E.serialize(g));s.dispose();
});
await check('Razing cancels Great Work transfers and clears governor, spy, patrol and legacy references before saving',()=>{
 const {g,p,c,u,home}=capture(),s=new GameSimulation(g);s.command(p,{type:'move',unit:u.id,tile:c.tile});c.buildings.push('amphitheater');const slot=city=>workSlots(g,city)[0];
 const local={id:g.heritage.nextWork++,type:'writing',title:'Local record',city:c.id,slot:slot(c).id,culture:1},inbound={id:g.heritage.nextWork++,type:'writing',title:'Inbound record',city:home.id,slot:slot(home).id,culture:1,transfer:{city:c.id,slot:slot(c).id,arrives:100}};g.heritage.works.push(local,inbound);g.heritage.pendingGrants=[{owner:p.id,city:c.id,type:'warrior'}];g.heritage.legacyOrders={[c.id]:{owner:p.id,item:'pyramids',tile:c.tile}};
 p.governors.roster.gov_educator={promotions:[],city:c.id,establishedAt:80};const spy={id:g.espionage.nextId++,owner:p.id,status:'mission',city:c.id,mission:'counterspy',readyAt:320,level:0,successes:0};g.espionage.agents.push(spy);u.airPatrolCity=c.id;s.command(p,{type:'razeCity',city:c.id});
 assert.deepEqual(g.heritage.works,[{...inbound,transfer:undefined}].map(({transfer,...w})=>w));assert.equal(g.heritage.pendingGrants.length,0);assert(!g.heritage.legacyOrders[c.id]);assert.equal(p.governors.roster.gov_educator.city,null);assert.equal(p.governors.roster.gov_educator.establishedAt,0);assert.equal(spy.status,'idle');assert.equal(spy.city,null);assert(!u.airPatrolCity);E.restore(E.serialize(g));s.dispose();
});
await check('Original capitals and indestructible wonder cities reject razing without partial changes',()=>{
 for(const capital of [true,false]){const {g,p,c,u}=capture(true,{capital}),s=new GameSimulation(g);s.command(p,{type:'move',unit:u.id,tile:c.tile});if(!capital)g.wonders[Object.keys(R.WONDERS)[0]]={city:c.id,owner:p.id,tile:c.tile};const before=E.serialize(g);assert(!E.cityDispositionOptions(g,p).find(v=>v.city===c.id).canRaze);assert.throws(()=>s.command(p,{type:'razeCity',city:c.id}));assert.equal(E.serialize(g),before);s.dispose();}
});
await check('Capture decisions survive reload and malformed ownership is rejected',()=>{
 const {g,p,c,u}=capture(),s=new GameSimulation(g);s.command(p,{type:'move',unit:u.id,tile:c.tile});const restored=E.restore(E.serialize(g)),r=new GameSimulation(restored);assert(restored.cities.find(v=>v.id===c.id).capturePending);r.command(restored.players[p.id],{type:'keepCity',city:c.id});r.dispose();c.capturePending.previousOwner=p.id;assert.throws(()=>E.restore(E.serialize(g)));s.dispose();
});
await check('AI can raze remote minor conquests and keep normal cities through the same disposition validator',()=>{
 for(const raze of [true,false]){const {g,p,c,u}=capture(false,{far:true});p.strategy=raze?'domination':'adaptive';E.applyAction(g,p,{type:'move',unit:u.id,tile:c.tile});assert.equal(g.cities.includes(c),!raze);if(!raze)assert(!c.capturePending);}
});
await check('Old military fortify/refit poses use idle cells; civilian work and real attacks retain authored action cells',()=>{
 for(const type of ['warrior','scout','archer','tank','battleship','infantry','roman_legion'])for(let i=0;i<32;i++)assert(paintedFrameIndex(type,'work',i,32)<=3,type);for(let i=0;i<16;i++)assert(paintedFrameIndex('builder','work',i,16)>=12);assert(paintedFrameIndex('warrior','attack',8,16)>=12);
 const {g,p,tile}=field(),u=E.addUnit(g,p.id,'warrior',tile(8,8).id);E.applyAction(g,p,{type:'fortify',unit:u.id});const events=E.snapshot(g,p.id).visuals.events;assert(events.some(e=>e.kind==='work'&&e.actor.id===u.id));assert(!events.some(e=>e.kind==='attack'&&e.actor.id===u.id));
});
await check('One actor finishes movement before attack/work while presentation retains its three-action bound',()=>{
 const events=[{id:1,kind:'move',actor:{id:11}},{id:2,kind:'attack',actor:{id:11}},{id:3,kind:'work',actor:{id:11}},{id:4,kind:'attack',actor:{id:12}},{id:5,kind:'attack',actor:{id:13}},{id:6,kind:'attack',actor:{id:14}}],starts=scheduleActions(events,10);assert(starts.get(2)>=starts.get(1)+3);assert(starts.get(3)>=starts.get(2)+1.95);
 for(const start of starts.values()){const active=events.filter(e=>starts.get(e.id)<=start&&starts.get(e.id)+(e.kind==='move'?3:e.kind==='attack'?1.95:1.25)>start);assert(active.length<=3);}assert.equal(scheduleActions([{id:7,kind:'attack',actor:{id:1}}],10,[11,12,13]).get(7),11);
});
await check('Incoming real damage/death yields one location alert and refresh never replays it',()=>{
 const {g,p,q,tile}=field();beginWar(g,p,q,E.event);const victim=E.addUnit(g,p.id,'warrior',tile(8,8).id),enemy=E.addUnit(g,q.id,'archer',tile(9,8).id);victim.hp=5;E.refreshVisibility(g);const before=E.snapshot(g,p.id);E.applyAction(g,q,{type:'attack',unit:enemy.id,targetUnit:victim.id});const after=E.snapshot(g,p.id),alerts=incomingBattles(before,after,p.id);assert.equal(alerts.length,1);assert(alerts[0].dead);assert.equal(alerts[0].tile,victim.tile);assert.deepEqual(incomingBattles(after,after,p.id),[]);assert.deepEqual(incomingBattles(before,{...after,visuals:{...after.visuals,epoch:9999}},p.id),[]);
});
await check('Founding consumes a settler without a false death/attack alert',()=>{
 const {g,p,tile}=field(),u=E.addUnit(g,p.id,'settler',tile(10,12).id);E.refreshVisibility(g);const before=E.snapshot(g,p.id);E.applyAction(g,p,{type:'found',unit:u.id});assert.deepEqual(incomingBattles(before,E.snapshot(g,p.id),p.id),[]);
});
fs.writeFileSync(out+'/engine-checks.json',JSON.stringify({passed:true,checks,nativeSdkChanged:false},null,2));console.log(JSON.stringify({passed:true,checks:checks.length}));
