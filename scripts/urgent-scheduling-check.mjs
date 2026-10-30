import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {beginWar,ACTION_LIMITS} from '../src/warfare.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
const checks=[],metrics={},pass=s=>{checks.push(s);console.log('PASS '+s);};
function field(){
 const g=E.createGame({players:12,size:'small',seed:'URGENT-ADMISSION',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 for(const p of g.players)Object.assign(p,{manual:true,gold:1000000,met:g.players.filter(o=>o.id!==p.id).map(o=>o.id),visible:g.map.tiles.map(t=>t.id),explored:g.map.tiles.map(t=>t.id)});
 const sim=new RealtimeSimulation(g),tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 const add=(owner,slot,type='warrior')=>E.addUnit(g,owner,type,tile(4+owner*5+slot%4,4+Math.floor(slot/4)*4).id);
 return {g,sim,tile,add};
}
function occupied(f){
 for(let owner=0;owner<4;owner++)for(let slot=0;slot<4;slot++){const u=f.add(owner,slot);assert(f.sim.start(f.g.players[owner],{type:'move',unit:u.id,tile:f.tile(f.g.map.tiles[u.tile].col,5).id}));}
 for(let owner=4;owner<6;owner++)for(let slot=0;slot<4;slot++){const u=f.add(owner,slot);assert(f.sim.start(f.g.players[owner],{type:'fortify',unit:u.id}));}
}
function caps(f){const active=f.g.units.filter(u=>u.activity),moving=active.filter(u=>['move','rebase'].includes(u.activity.action.type));assert(active.length<=ACTION_LIMITS.active);assert(moving.length<=ACTION_LIMITS.moving);for(const p of f.g.players)assert(active.filter(u=>u.owner===p.id).length<=ACTION_LIMITS.perNation);return {active:active.length,moving:moving.length};}
for(const mode of ['urgent','manual','aged']){
 const manual=mode==='manual',f=field();try{if(mode==='aged'){f.g.realtime.time=150;f.g.realtime.nextEconomy=170;}occupied(f);const opening=f.g.units.find(u=>u.owner===0&&u.activity);opening.activity.ends=f.g.realtime.time+.05;const low=f.add(0,4),urgent=f.add(11,4);
 f.sim.enqueue(f.g.players[0],[{type:'move',unit:low.id,tile:f.tile(f.g.map.tiles[low.tile].col,9).id}],{manual});if(mode==='aged')f.g.realtime.queues[0][0].queuedAt=0;
 f.sim.enqueue(f.g.players[11],[{type:'move',unit:urgent.id,tile:f.tile(f.g.map.tiles[urgent.tile].col,9).id,priority:2350}]);f.sim.tick(.05);caps(f);
 assert(!!(manual?low:urgent).activity,'The one free global slot must honor '+(manual?'manual precedence':'homeland urgency across countries'));
 assert(!(manual?urgent:low).activity);assert.equal(f.sim.stats.rejected,0);
 }finally{f.sim.dispose();}
}
pass('A single free slot honors homeland urgency across nations and manual precedence without reserved idle capacity');
for(const manual of [false,true]){
 const f=field();try{const u=f.add(0,0),urgent=f.add(0,4),goal=f.tile(f.g.map.tiles[u.tile].col,6).id;
 f.sim.enqueue(f.g.players[0],[{type:'move',unit:u.id,tile:goal}],{manual});f.sim.tick(.05);const first=u.activity.to,firstEnd=u.activity.ends;
 for(let slot=1;slot<4;slot++){const blocker=f.add(0,slot);assert(f.sim.start(f.g.players[0],{type:'fortify',unit:blocker.id}));blocker.activity.ends=15;}
 f.sim.enqueue(f.g.players[0],[{type:'move',unit:urgent.id,tile:f.tile(f.g.map.tiles[urgent.tile].col,9).id,priority:2450}]);
 E.refreshVisibility(f.g);const copy=E.restore(E.serialize(f.g)),other=new RealtimeSimulation(copy);
 const seconds=firstEnd-f.g.realtime.time+.05;f.sim.tick(seconds);other.tick(seconds);assert.equal(E.serialize(f.g),E.serialize(copy),'A mid-route save must preserve scheduling and continuation');other.dispose();caps(f);
 if(manual){assert(u.activity&&u.tile===first);assert(!urgent.activity);f.sim.tick(u.activity.ends-f.g.realtime.time+.05);assert.equal(u.tile,goal);assert(urgent.activity);}
 else{assert.equal(u.tile,first);assert(!u.activity);assert(urgent.activity);assert(f.g.realtime.queues[0].some(q=>q.action.unit===u.id&&q.action.tile===goal&&q.queuedAt>=firstEnd-1e-9&&q.queuedAt<=f.g.realtime.time));}
 }finally{f.sim.dispose();}
}
for(const fill of [0,1800,'manual']){
 const f=field();try{const u=f.add(0,0),goal=f.tile(4,6).id;f.sim.enqueue(f.g.players[0],[{type:'move',unit:u.id,tile:goal}]);f.sim.tick(.05);
 for(let slot=1;slot<4;slot++){const blocker=f.add(0,slot);assert(f.sim.start(f.g.players[0],{type:'fortify',unit:blocker.id}));blocker.activity.ends=15;}
 const count=fill==='manual'?128:112,spots=f.g.map.tiles.filter(t=>t.col>20&&!f.g.units.some(u=>u.tile===t.id));
 for(let i=0;i<count;i++){const other=E.addUnit(f.g,0,'warrior',spots[i].id);other.cooldownUntil=100;f.sim.enqueue(f.g.players[0],[{type:'fortify',unit:other.id,priority:fill==='manual'?0:fill}],{manual:fill==='manual'});}
 assert.equal(f.g.realtime.queues[0].length,count);f.sim.tick(3);assert.equal(u.tile,goal,'A full '+fill+' backlog must not silently discard an admitted route');assert(f.g.realtime.queues[0].length<=count);assert.equal(f.sim.stats.rejected,0);caps(f);
 }finally{f.sim.dispose();}
}
pass('AI paths yield at cell boundaries for same-country retreat; manual routes continue and both resume identically after saving');
{
 const f=field();try{occupied(f);for(const p of f.g.players.slice(0,6))beginWar(f.g,p,f.g.players[11],E.event);
 const shots=[],starts=[],base=f.sim.start.bind(f.sim);f.sim.start=(p,a)=>{const q=f.g.realtime.queues[p.id]?.find(q=>q.action===a),ok=base(p,a);if(ok&&a.type==='attack')starts.push(f.g.realtime.time-q.queuedAt);return ok;};
 for(let i=0;i<60;i++){const x=4+i%15*4,y=18+Math.floor(i/15)*6,u=E.addUnit(f.g,i%6,'archer',f.tile(x,y).id),target=E.addUnit(f.g,11,'warrior',f.tile(x,y+1).id);shots.push(u);f.sim.enqueue(f.g.players[u.owner],[{type:'attack',unit:u.id,targetUnit:target.id,priority:1800}]);}
 for(let owner=6;owner<11;owner++)for(let slot=0;slot<8;slot++){const u=f.add(owner,slot);f.sim.enqueue(f.g.players[owner],[{type:'move',unit:u.id,tile:f.tile(f.g.map.tiles[u.tile].col,f.g.map.tiles[u.tile].row+1).id}]);}
 let maxActive=0,maxMoving=0;for(let i=0;i<200;i++){f.sim.tick(.05);const c=caps(f);maxActive=Math.max(maxActive,c.active);maxMoving=Math.max(maxMoving,c.moving);if(starts.length===60)break;}
 assert.equal(starts.length,60);assert.equal(f.sim.stats.rejected,0);starts.sort((a,b)=>a-b);const p90=starts[Math.floor(starts.length*.9)],max=starts.at(-1);assert(p90<=3&&max<=5,'Urgent attacks must avoid a long movement backlog');
 metrics.war={players:12,actualAttackStarts:starts.length,p90Seconds:p90,maxSeconds:max,maxActive,maxMoving,limits:ACTION_LIMITS};
 }finally{f.sim.dispose();}
}
pass('Sixty real wartime attacks enter under a saturated movement backlog with bounded latency and unchanged 24/16/4 caps');
{
 const f=field();try{const units=[];for(let owner=0;owner<12;owner++){const u=f.add(owner,0);units.push(u);f.sim.enqueue(f.g.players[owner],[{type:'move',unit:u.id,tile:f.tile(f.g.map.tiles[u.tile].col,5).id}]);}for(let i=0;i<5;i++)f.sim.tick(.05);assert(units.every(u=>u.activity),'Equal-priority countries must retain round-robin access');assert.equal(f.g.units.filter(u=>u.activity?.action.type==='move').length,12);caps(f);}finally{f.sim.dispose();}
}
pass('All twelve equal-priority countries retain access and ordinary movement can use slots without emergency reservations');
const sources=Object.fromEntries(await Promise.all(['src/engine.mjs','src/realtime.mjs','src/warfare.mjs','scripts/urgent-scheduling-check.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
await writeFile(new URL('../output/urgent-scheduling-checks.json',import.meta.url),JSON.stringify({passed:true,checks,metrics,sources,activeSaveWritten:false,gameLaunched:false},null,2));
