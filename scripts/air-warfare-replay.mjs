import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {beginWar,ACTION_LIMITS} from '../src/warfare.mjs';
const pool=new NativeDriverPool(),results=[];
function modernWorld(){
 const g=E.createGame({players:12,size:'huge',maxTurns:960,seed:'TWELVE-AIR-WARFARE-CONTROLLED',barbarians:false});g.units=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,territoryCity:null,owner:null,river:false,riverEdges:[],camp:false,ruin:false});
 const tile=(x,y)=>g.map.tiles[y*g.map.width+x];
 for(const p of g.players){p.techs=Object.keys(R.TECHS);p.civics=['empire','training','civilservice'];p.met=g.players.filter(q=>q!==p).map(q=>q.id);p.gold=10000;p.manual=false;p.nuclearStockpile=2;
  const x=10+16*(p.id%3),y=10+14*Math.floor(p.id/3),city=E.foundCity(g,p,E.addUnit(g,p.id,'settler',tile(x,y).id));city.population=8;city.buildings.push('airport','missilesilo','walls');city.walls=100;
  for(const [i,item]of ['airport','missilesilo'].entries()){const t=tile(x+1,y+i);t.owner=p.id;t.territoryCity=city.id;t.district={item,city:city.id,kind:'district'};city.districts.push({item,tile:t.id});}
  for(const [i,resource]of ['oil','uranium'].entries()){const t=tile(x-1,y+i);t.owner=p.id;t.resource=resource;t.improvement=resource==='oil'?'well':'mine';}
  E.addUnit(g,p.id,p.id%2?'stealthfighter':'stealthbomber',tile(x+1,y).id);E.addUnit(g,p.id,'modernarmor',tile(x,y+1).id);
 }
 g.units=g.units.filter(u=>u.type!=='settler');g.turn=120;const boot=new RealtimeSimulation(g);g.realtime.time=2380;g.realtime.nextEconomy=2400;boot.dispose();
 for(let id=0;id<12;id+=2)beginWar(g,g.players[id],g.players[id+1],E.event);
 for(const p of g.players){const enemy=g.cities.find(c=>c.owner===(p.id^1)),target=g.map.tiles[enemy.tile];E.addUnit(g,p.id,'scout',tile(target.col+3,target.row).id);}
 E.refreshVisibility(g);return g;
}
async function run(g,label,seconds){
 const rejected=[];const sim=new RealtimeSimulation(g,{onRejected:record=>rejected.push(record)}),initial={turn:g.turn,time:g.realtime.time,players:g.players.length,living:g.players.filter(p=>p.alive).length},counts={},shots=[],patrols=new Map();let calls=0,maxActive=0,maxMoving=0,maxNation=0,patrolChanges=0;
 try{
  for(let elapsed=0;elapsed<seconds&&!g.winner;elapsed+=5){
   const players=g.players.filter(p=>p.alive);
   for(let i=0;i<players.length;i+=2){const pair=players.slice(i,i+2),observations=pair.map(p=>E.observation(g,p)),responses=await Promise.all(pair.map((p,j)=>pool.execute(p,observations[j])));
    for(let j=0;j<pair.length;j++){const p=pair[j],r=responses[j];calls++;p.memory=r.memory;for(const action of r.orders){counts[action.type]=(counts[action.type]||0)+1;if(action.type==='nuke'){const quote=observations[j].legalActions.find(a=>a.type==='nuke'&&a.unit===action.unit&&a.city===action.city&&a.tile===action.tile);assert(quote);assert.equal(quote.hint.friendlyCities+quote.hint.friendlyUnits,0);assert(!quote.hint.neutral);shots.push({owner:p.id,carrier:action.unit??action.city,tile:action.tile});}}
     sim.enqueue(p,r.orders);
    }
   }
   for(let step=0;step<20&&!g.winner;step++){sim.tick(.25);const active=g.units.filter(u=>u.activity);maxActive=Math.max(maxActive,active.length);maxMoving=Math.max(maxMoving,active.filter(u=>['move','rebase'].includes(u.activity.action.type)).length);maxNation=Math.max(maxNation,...g.players.map(p=>active.filter(u=>u.owner===p.id).length));
    for(const unit of g.units)if(unit.airPatrolCity!==undefined){if(patrols.has(unit.id)&&patrols.get(unit.id)!==unit.airPatrolCity)patrolChanges++;patrols.set(unit.id,unit.airPatrolCity);}
   }
   assert(g.units.every(u=>Number.isFinite(u.hp)&&u.hp>0&&u.hp<=(R.UNITS[u.type].maxHp||100)));assert(g.players.every(p=>(p.nuclearStockpile||0)>=0&&(p.nuclearStockpile||0)<=3));
  }
  assert(maxActive<=ACTION_LIMITS.active&&maxMoving<=ACTION_LIMITS.moving&&maxNation<=ACTION_LIMITS.perNation);
  const saved=E.serialize(g);assert.equal(E.serialize(E.restore(saved)),saved);
  const result={label,initial,simulatedSeconds:g.realtime.time-initial.time,calls,counts,maxActive,maxMoving,maxNation,patrolChanges,shots,rejected,rejectionReasons:rejected.reduce((counts,r)=>{const key=r.stage+"/"+r.type+"/"+r.reason;counts[key]=(counts[key]||0)+1;return counts;},{}),stats:sim.stats,winner:g.winner,finalTurn:g.turn};results.push(result);await writeFile(new URL('../output/'+label+'-final.json',import.meta.url),saved);console.log(JSON.stringify({...result,rejected:undefined}));
 }finally{sim.dispose();}
}
try{
 const input=JSON.parse(await readFile(new URL('../output/air-warfare-inspection.json',import.meta.url),'utf8')),bytes=await readFile(new URL('../'+input.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256);
 await run(E.restore(bytes.toString()),'air-warfare-frozen-world',60);
 await run(modernWorld(),'air-warfare-controlled-twelve',60);
 const controlled=results.at(-1);assert(controlled.counts.nuke>0&&controlled.counts.patrol>0);assert.equal(controlled.patrolChanges,0);assert(!controlled.rejected.some(r=>r.type==='nuke'));
 const report={passed:true,input,results,activeSaveWritten:false,gameLaunched:false};await writeFile(new URL('../output/air-warfare-replay-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}finally{pool.dispose();}
