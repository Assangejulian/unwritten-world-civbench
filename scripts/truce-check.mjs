import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,foundCity,addUnit,applyAction,legalActions,attackTargets,serialize,restore,refreshVisibility,snapshot,event} from '../src/engine.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {neighbors} from '../src/world.mjs';
import * as W from '../src/warfare.mjs';

function alliedFixture(g,p,id){const other=g.players[id],time=g.realtime?.time??g.turn*20;p.relations[id].friendUntil=other.relations[p.id].friendUntil=time+600;g.court.ready[p.id+':'+id]=0;applyAction(g,p,{type:'typedAlliance',player:id,allianceType:'military'});applyAction(g,other,{type:'acceptCourt',offer:g.court.offers.at(-1).id});}
const before=await readFile(new URL('../saves/autosave.json',import.meta.url)),checks=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
function clock(g,t){g.realtime.time=t;g.realtime.nextEconomy=(Math.floor(t/20)+1)*20;g.turn=Math.floor(t/20)+1;}
function field(){
 const g=createGame({seed:'TRUCE-EXPERIENCE',players:3,size:'small',barbarians:false});
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,river:false,riverEdges:[],cityId:null,owner:null,district:null,improvement:null,camp:false,ruin:false});g.units=[];
 for(const p of g.players){p.manual=true;p.gold=1000;p.civics=['civilservice'];p.met=g.players.filter(o=>o!==p).map(o=>o.id);foundCity(g,p,addUnit(g,p.id,'settler',(10+p.id*8)*g.map.width+12));}
 g.units=[];const sim=new RealtimeSimulation(g);clock(g,0);see(g);return {g,sim,p:g.players[0],q:g.players[1]};
}
function see(g){refreshVisibility(g);for(const p of g.players){p.explored=g.map.tiles.map(t=>t.id);p.visible=[...p.explored];p.knownTiles=Object.fromEntries(g.map.tiles.map(t=>[t.id,structuredClone(t)]));p.knownCities=Object.fromEntries(g.cities.map(c=>[c.id,structuredClone(c)]));}}
function peace(g,p,q){const offer=W.propose(g,p,q.id,'peace',event);W.answerProposal(g,q,offer.id,true,event);}
{
 const {g,sim,p,q}=field();W.beginWar(g,p,q,event);clock(g,160);peace(g,p,q);const ends=560;
 assert.equal(W.WAR_RULES.truceSeconds,400);assert.equal(W.WAR_RULES.trucePeriods,20);
 assert.equal(p.relations[q.id].truceUntil,ends);assert.equal(q.relations[p.id].truceUntil,ends);
 const s=g.cities[1],tile=neighbors(g.map,g.map.tiles[s.tile])[0],attacker=addUnit(g,0,'archer',tile.id),victim=addUnit(g,1,'warrior',neighbors(g.map,g.map.tiles[s.tile]).find(t=>t.id!==tile.id).id);see(g);
 for(const t of [160,240,559.95]){clock(g,t);for(const [a,b]of [[p,q],[q,p]]){assert.throws(()=>applyAction(g,a,{type:'war',player:b.id}),/停战/);assert(!legalActions(g,a).some(o=>o.type==='war'&&o.player===b.id));}assert(!attackTargets(g,p,attacker).some(o=>o.targetUnit===victim.id));assert.throws(()=>applyAction(g,p,{type:'attack',unit:attacker.id,targetUnit:victim.id}));}
 clock(g,560);assert.equal(W.truceRemaining(g,0,1),0);assert(legalActions(g,p).some(o=>o.type==='war'&&o.player===1));applyAction(g,p,{type:'war',player:1});assert(attackTargets(g,p,attacker).some(o=>o.targetUnit===victim.id));sim.dispose();
 pass('Both nations are barred from declaring war and attacking for exactly 20 periods; the 400-second boundary unlocks a new war');
}
{
 const {g,sim,p,q}=field();W.beginWar(g,p,q,event);clock(g,160);const city=g.cities[1],near=neighbors(g.map,g.map.tiles[city.tile])[0],archer=addUnit(g,0,'archer',near.id),target=addUnit(g,1,'warrior',neighbors(g.map,g.map.tiles[city.tile]).find(t=>t.id!==near.id).id);see(g);
 sim.enqueue(p,[{type:'attack',unit:archer.id,targetUnit:target.id}]);sim.tick(.05);assert(archer.activity);const hp=target.hp;peace(g,p,q);const saved=serialize(g),resumed=new RealtimeSimulation(restore(saved));sim.tick(3);resumed.tick(3);assert.equal(target.hp,hp);assert.equal(resumed.game.units.find(u=>u.id===target.id).hp,hp);assert.equal(p.relations[q.id].status,'peace');assert(!archer.activity);const combatState=w=>({time:w.realtime.time,rng:w.rngState,units:w.units,relations:w.players.map(p=>p.relations),queues:w.realtime.queues});assert.deepEqual(combatState(g),combatState(resumed.game));resumed.dispose();sim.dispose();
 pass('An attack already winding up when peace is signed cannot land, including after saving and resuming');
}
{
 const {g,sim,p,q}=field();W.beginWar(g,p,q,event);clock(g,160);peace(g,p,q);alliedFixture(g,p,1);clock(g,200);applyAction(g,p,{type:'endAlliance',player:1});assert.equal(W.truceRemaining(g,0,1),360);assert.equal(p.relations[1].truceUntil,560);assert.equal(q.relations[0].truceUntil,560);assert.throws(()=>W.beginWar(g,p,q,event),/停战/);sim.dispose();
 pass('Making and breaking an alliance cannot shorten a post-peace truce');
}
{
 const {g,sim,p,q}=field();W.beginWar(g,p,q,event);clock(g,160);peace(g,p,q);g.diplomacy.agendas.push({id:g.diplomacy.nextId++,city:g.cities[2].id,attacker:1,defender:2,status:'voting',createdAt:160,endsAt:220,votes:{}});const agenda=g.diplomacy.agendas.at(-1);assert.throws(()=>W.voteAid(g,p,agenda.id,'join',event),/停战/);assert(!legalActions(g,p).some(o=>o.type==='voteAid'&&o.choice==='join'));assert(legalActions(g,p).some(o=>o.type==='voteAid'&&o.choice==='aid'));sim.dispose();
 pass('Capital-aid military intervention cannot bypass protection; economic aid remains available');
}
{
 const {g,sim,p,q}=field();W.beginWar(g,p,q,event);clock(g,160);peace(g,p,q);for(const r of [p.relations[1],q.relations[0]])r.truceUntil=240;
 const old=serialize(g),upgraded=restore(old);assert.equal(upgraded.players[0].relations[1].truceUntil,560);assert.equal(upgraded.players[1].relations[0].truceUntil,560);assert.equal(upgraded.realtime.time,160);assert.deepEqual(upgraded.map.tiles,g.map.tiles);assert.deepEqual(JSON.parse(serialize(restore(serialize(upgraded)))),JSON.parse(serialize(upgraded)));
 const bad=JSON.parse(old);bad.diplomacy.wars[0].closedAt=-1;assert.throws(()=>restore(JSON.stringify(bad)));sim.dispose();
 pass('Recorded legacy peace upgrades idempotently in memory, preserves clocks/geography and rejects invalid signing timestamps');
}
{
 const {g,sim,p,q}=field();p.relations[1].truceUntil=0;q.relations[0].truceUntil=300;clock(g,200);assert.equal(W.truceRemaining(g,0,1),100);assert.throws(()=>W.beginWar(g,p,q,event),/停战/);assert(!legalActions(g,p).some(o=>o.type==='war'&&o.player===1));sim.dispose();
 pass('An asymmetric saved relation cannot bypass the longer bilateral protection');
}
{
 const {g,sim,p,q}=field();W.beginWar(g,p,q,event);clock(g,160);peace(g,p,q);const view=snapshot(g,2),treaty=view.diplomacy.treaties.find(t=>t.from===0&&t.to===1);assert.equal(treaty.status,'peace');assert.equal(treaty.truceUntil,560);assert.equal(view.players[0].gold,undefined);sim.pause();const until=p.relations[1].truceUntil;await new Promise(resolve=>setTimeout(resolve,25));assert.equal(W.truceRemaining(g,0,1),400);assert.equal(p.relations[1].truceUntil,until);sim.dispose();
 pass('Known third parties see the public truce without private finances, and real wall time cannot consume paused protection');
}
assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));
await writeFile(new URL('../output/truce-checks.json',import.meta.url),JSON.stringify({passed:true,checks,gameLaunched:false,save:{turn:JSON.parse(before).turn,unchanged:true,sha256:createHash('sha256').update(before).digest('hex')}},null,2));
