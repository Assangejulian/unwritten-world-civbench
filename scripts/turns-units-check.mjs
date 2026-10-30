import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {attackRange} from '../src/air-warfare.mjs';
import {beginWar} from '../src/warfare.mjs';
import {PAINTED_UNITS} from '../web/painted-actions.js';
import {UNIT_ETCHINGS} from '../web/unit-etchings.js';
import {gameTimeText} from '../web/game-time.js';
import {field} from './imperial-fixture.mjs';
import {executeBatch} from '../src/batch-intent.mjs';
import {executionStatus} from '../src/execution-status.mjs';
const out='output/turns-units-20261019';fs.mkdirSync(out,{recursive:true});
const checks=[];async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name);}
const saveBaseline=fs.readdirSync('saves').filter(f=>f.endsWith('.json')).map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync('saves/'+file)).digest('hex')}));
const fixture=()=>{const f=field();f.q.manual=f.z.manual=false;return f;};
await check('Human thinking and presentation ticks never advance time, economy or AI',async()=>{
 const {g,p}=fixture();let calls=0;const s=new GameSimulation(g,{execute:async()=>{calls++;return {orders:[]};}}),before=E.serialize(g);
 s.tick(60);await s.plan({force:true});assert.equal(calls,0);assert.equal(E.serialize(g),before);assert.equal(s.state(p.id).mode,'turns');assert.throws(()=>s.play());s.dispose();
});
await check('AI nations are observed and executed sequentially; one settlement per round',async()=>{
 const {g,p}=fixture();let active=0,peak=0;const order=[],seen=[];let economy=0;
 const s=new GameSimulation(g,{prepareObservation:(world,nation)=>{seen.push({id:nation.id,previousCalls:order.length});return {...E.observation(world,nation),legalActions:[]};},execute:async nation=>{active++;peak=Math.max(peak,active);order.push(nation.id);await new Promise(r=>setTimeout(r,5));active--;return {orders:[],ms:1};},onEconomy:()=>economy++});
 const gold=p.gold,turn=g.turn;await s.endTurn(p.id);assert.deepEqual(order,[1,2]);assert.equal(peak,1);assert.deepEqual(seen.map(v=>v.previousCalls),[0,1]);assert.equal(economy,1);assert.equal(g.turn,turn+1);assert.equal(g.realtime.time,20);assert.notEqual(p.gold,gold);assert.equal(s.activePlayer,0);assert(s.state(0).canEndTurn);assert(!s.state(-1).canEndTurn);s.dispose();
});
await check('Wrong nation, duplicate end-turn and concurrent human command are rejected',async()=>{
 const {g,p,q}=fixture();let release,entered;const wait=new Promise(r=>release=r),started=new Promise(r=>entered=r);
 const s=new GameSimulation(g,{execute:async()=>{entered();await wait;return {orders:[]};}});
 assert.throws(()=>s.command(q,{type:'research',item:'pottery'}));await assert.rejects(s.endTurn(q.id));
 const job=s.endTurn(p.id);await started;await assert.rejects(s.endTurn(p.id));assert.throws(()=>s.command(p,{type:'research',item:'pottery'}));release();await job;s.dispose();
});
await check('Moves consume the remaining budget and cannot regenerate through ready/tick/save',()=>{
 const {g,p,tile}=fixture(),u=E.addUnit(g,p.id,'warrior',tile(8,8).id);E.refreshVisibility(g);const s=new GameSimulation(g);const budget=u.moves;
 const first=E.reachable(g,p,u).find(v=>v.cost===1);assert(first);s.command(p,{type:'move',unit:u.id,tile:first.tile});assert.equal(u.moves,budget-1);assert.equal(u.acted,false);s.ready();s.tick(60);assert.equal(u.moves,budget-1);
 const copy=E.restore(E.serialize(g)),other=new GameSimulation(copy);assert.equal(copy.units.find(v=>v.id===u.id).moves,budget-1);assert.equal(copy.units.find(v=>v.id===u.id).acted,false);
 const second=E.reachable(g,p,u).find(v=>v.cost===1);s.command(p,{type:'move',unit:u.id,tile:second.tile});assert.equal(u.moves,0);assert(u.acted);assert.throws(()=>s.command(p,{type:'move',unit:u.id,tile:first.tile}));other.dispose();s.dispose();
});
await check('Attack/work/city fire cannot repeat within the same nation turn',()=>{
 const {g,p,q,tile,home}=fixture();beginWar(g,p,q,E.event);const a=E.addUnit(g,p.id,'archer',tile(8,8).id),b=E.addUnit(g,q.id,'warrior',tile(9,8).id);E.refreshVisibility(g);const s=new GameSimulation(g);s.command(p,{type:'attack',unit:a.id,targetUnit:b.id});const hp=b.hp;assert(hp<100);assert.throws(()=>s.command(p,{type:'attack',unit:a.id,targetUnit:b.id}));assert.equal(b.hp,hp);const worker=E.addUnit(g,p.id,'warrior',tile(7,7).id);worker.hp=70;s.command(p,{type:'fortify',unit:worker.id});const healed=worker.hp;assert.throws(()=>s.command(p,{type:'fortify',unit:worker.id}));assert.equal(worker.hp,healed);home.walls=100;const invader=E.addUnit(g,q.id,'warrior',tile(4,3).id);E.refreshVisibility(g);s.command(p,{type:'cityAttack',city:home.id,targetUnit:invader.id});assert(home.attacked);assert.throws(()=>s.command(p,{type:'cityAttack',city:home.id,targetUnit:invader.id}));s.dispose();
});
await check('Multiple humans get separate turns and only the complete round settles',async()=>{
 const {g,p,q}=fixture();q.manual=true;const s=new GameSimulation(g,{execute:async()=>({orders:[]})});await s.endTurn(p.id);assert.equal(s.activePlayer,q.id);assert.equal(g.turn,1);assert.equal(g.realtime.time,0);await s.endTurn(q.id);assert.equal(g.turn,2);assert.equal(s.activePlayer,p.id);s.dispose();
});
await check('Load preserves active nation and spent actions; malformed turn order is rejected',async()=>{
 const {g,p,q,tile}=fixture();q.manual=true;const u=E.addUnit(g,q.id,'warrior',tile(8,8).id),s=new GameSimulation(g);await s.endTurn(p.id);s.command(q,{type:'fortify',unit:u.id});const copy=E.restore(E.serialize(g)),restored=new GameSimulation(copy);assert.equal(restored.activePlayer,q.id);assert(copy.units.find(v=>v.id===u.id).acted);assert.equal(copy.units.find(v=>v.id===u.id).moves,0);restored.dispose();s.dispose();copy.turnOrder.index=99;assert.throws(()=>new GameSimulation(copy));
});
await check('Taking over cancels legacy queues/activities and refunds a reserved nuke once',()=>{
 const {g,p,tile}=fixture();p.manual=false;const u=E.addUnit(g,p.id,'warrior',tile(8,8).id),s=new GameSimulation(g);g.realtime.queues[p.id]=[{action:{type:'fortify',unit:u.id},id:1}];u.activity={nuclearReserved:true};p.nuclearStockpile=0;s.setControl(p,true);assert.equal(p.nuclearStockpile,1);assert(!u.activity);assert.deepEqual(g.realtime.queues,{});s.enterTurns();assert.equal(p.nuclearStockpile,1);s.setControl(p,false);assert.equal(s.state(0).mode,'realtime');s.tick(1);assert.equal(g.realtime.time,1);s.dispose();
});
await check('Pre-future robot is melee; future research grants real ranged targets and no retaliation',()=>{
 for(const unlocked of [false,true]){const {g,p,q,tile}=fixture();p.techs=['fusion',...(unlocked?['futuretech']:[])];beginWar(g,p,q,E.event);const u=E.addUnit(g,p.id,'giantdeathrobot',tile(8,8).id),near=E.addUnit(g,q.id,'warrior',tile(9,8).id),far=E.addUnit(g,q.id,'warrior',tile(11,8).id);E.addUnit(g,p.id,'scout',tile(10,7).id);E.refreshVisibility(g);assert.equal(attackRange(g,u),unlocked?3:1);const targets=E.attackTargets(g,p,u);assert.equal(targets.some(a=>a.targetUnit===far.id),unlocked);assert.equal(E.snapshot(g,p.id).units.find(v=>v.id===u.id).ranged,unlocked);const before=u.hp;E.applyAction(g,p,{type:'attack',unit:u.id,targetUnit:near.id});assert(unlocked?u.hp===before:u.hp<before);}
});
await check('Robot jump unlocks through the real legal-action path and spends two movement points',()=>{
 const {g,p,tile}=fixture();p.techs=['fusion'];const u=E.addUnit(g,p.id,'giantdeathrobot',tile(8,8).id),to=tile(10,8);tile(9,8).terrain='mountain';E.refreshVisibility(g);const s=new GameSimulation(g);assert.equal(E.jumpTargets(g,p,u).length,0);assert.throws(()=>s.command(p,{type:'jump',unit:u.id,tile:to.id}));p.techs.push('futuretech');assert(E.observation(g,p).legalActions.some(a=>a.type==='jump'&&a.unit===u.id&&a.tile===to.id));s.command(p,{type:'jump',unit:u.id,tile:to.id});assert.equal(u.tile,to.id);assert.equal(u.moves,2);assert(!u.acted);const e=E.snapshot(g,p.id).visuals.events.find(e=>e.jump);assert(e);s.dispose();
});
await check('Jump forbids hidden, occupied, water, mountain, treaty-closed or linked landing',()=>{
 const {g,p,q,tile}=fixture();p.techs=['fusion','futuretech'];const u=E.addUnit(g,p.id,'giantdeathrobot',tile(8,8).id),to=tile(10,8);E.refreshVisibility(g);const legal=()=>E.jumpTargets(g,p,u).some(v=>v.tile===to.id);assert(legal());
 const visible=p.visible;p.visible=p.visible.filter(id=>id!==to.id);assert(!legal());p.visible=visible;to.terrain='mountain';assert(!legal());to.terrain='coast';assert(!legal());to.terrain='grass';const blocker=E.addUnit(g,p.id,'scout',to.id);assert(!legal());g.units=g.units.filter(v=>v!==blocker);to.owner=q.id;assert(!legal());to.owner=null;const partner=E.addUnit(g,p.id,'builder',u.tile);u.linkedUnit=partner.id;partner.linkedUnit=u.id;assert(!legal());delete u.linkedUnit;delete partner.linkedUnit;u.moves=1;assert(!legal());
});
await check('Future technology tree lists both working robot abilities',()=>{
 const rewards=R.researchUnlocks('futuretech');assert(rewards.some(v=>v.n.includes('远程火炮')));assert(rewards.some(v=>v.n.includes('动力跳跃')));assert.equal(R.TECHS.futuretech.era,8);
});
await check('Drone roles retain separate mechanics and reuse exactly the approved new sheets',()=>{
 assert(R.UNITS.drone.consumable&&R.UNITS.drone.ranged&&R.UNITS.drone.domain==='air');assert(R.UNITS.observationdrone.civilian&&R.UNITS.observationdrone.support==='spotter');assert.equal(PAINTED_UNITS.drone.file,PAINTED_UNITS.observationdrone.file);assert.equal(PAINTED_UNITS.drone.deathFile,PAINTED_UNITS.observationdrone.deathFile);assert(!PAINTED_UNITS.drone.file.includes('world-systems'));
});
await check('Time labels express economy/timers in rounds and keep realtime wording reversible',()=>{
 assert.equal(gameTimeText('每周期 +12 · 冷却 21 秒 · 持续 40 游戏秒',true),'每回合 +12 · 冷却 2 回合 · 持续 2 回合');assert.equal(gameTimeText('冷却 21 秒',false),'冷却 21 秒');
 assert.equal(gameTimeText('1,200 模拟秒',true),'60 回合');
});
await check('Human new-game mode is explicit and rejects unknown modes',()=>{
 const g=E.createGame({players:2,size:'small',seed:'TURN-MODE',playMode:'turns'}),s=new GameSimulation(g);assert(g.players[0].manual);assert(!g.players[1].manual);assert.equal(s.state(0).mode,'turns');assert.throws(()=>E.createGame({playMode:'parallel-human'}));s.dispose();
});
await check('Batch actions and execution status respect spent turns; cancel never refunds movement',()=>{
 const {g,p,q,tile}=fixture(),u=E.addUnit(g,p.id,'warrior',tile(8,8).id),foreign=E.addUnit(g,q.id,'warrior',tile(12,8).id),s=new GameSimulation(g);
 const result=executeBatch(s,g,p,{kind:'fortify',units:[u.id]});assert.equal(result.summary.completed,1);assert.equal(executionStatus(g,p.id).units.find(v=>v.id===u.id).state,'spent');assert.equal(executionStatus(g,-1).units.find(v=>v.id===foreign.id).state,'waitingTurn');s.cancel(p,u.id);assert.equal(u.moves,0);assert(u.acted);s.dispose();
});
await check('Unit catalogue has no duplicate canonical names or exact capability records',()=>{
 const all=Object.entries(R.UNITS);assert.equal(new Set(all.map(([,v])=>v.name)).size,all.length,'Duplicate name across unique and heritage units');
 const rows=Object.entries(R.UNITS).filter(([,s])=>!s.replaces&&!s.heritage),names=new Map(),signatures=new Map();
 for(const [key,s]of rows){assert(!names.has(s.name),'Duplicate name '+key);names.set(s.name,key);const {name,icon,description,...mechanics}=s,signature=JSON.stringify(Object.keys(mechanics).sort().map(k=>[k,mechanics[k]]));assert(!signatures.has(signature),'Duplicate mechanics '+key+' / '+signatures.get(signature));signatures.set(signature,key);}
 const audit={allUnitRecords:all.length,uniqueReplacements:all.filter(([,v])=>v.replaces).length,heritageArchetypes:all.filter(([,v])=>v.heritage).length,canonicalUnits:rows.length,expansionUnits:Object.keys(UNIT_ETCHINGS).length,duplicateNames:[],duplicateCapabilityRecords:[],decisions:[{types:['drone','observationdrone'],decision:'Retain separate consumable air strike and noncombat artillery spotting; share the new approved airframe art. Old art remains archived.'},{types:['militaryengineer','builder'],decision:'Retain military road/repair/fort engineer versus resource-improvement and clearing builder.'},{types:['guru','herbalist','surgeon','fieldmedic','ambulance'],decision:'Retain faith-identity religious healer versus successive military medical equipment tiers.'},{types:['batteringram','siegetower'],decision:'Retain different wall-tier support mechanics and direct upgrade path.'},{types:['balloon','observationdrone'],decision:'Retain earlier/later spotting technology tiers and one-way upgrade.'},{types:['scout','skirmisher','ranger','specops'],decision:'Retain successive reconnaissance eras and their one-way upgrades.'}],catalogue:rows.map(([key,s])=>({key,name:s.name,unlock:s.tech||s.civic||null,successors:E.UNIT_SUCCESSORS[key]||[]}))};
 fs.writeFileSync(out+'/unit-audit.json',JSON.stringify(audit,null,2));
});
await check('All production saves remain byte-identical',()=>{
 const base={saves:saveBaseline};assert.equal(fs.readdirSync('saves').filter(f=>f.endsWith('.json')).length,base.saves.length);for(const row of base.saves)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('saves/'+row.file)).digest('hex'),row.sha256,row.file);
});
fs.writeFileSync(out+'/engine-checks.json',JSON.stringify({passed:true,checks:checks.length,names:checks},null,2));console.log(JSON.stringify({passed:true,checks:checks.length}));
