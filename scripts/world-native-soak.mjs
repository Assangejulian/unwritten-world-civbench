import assert from 'node:assert/strict';
import {writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,observation,snapshot,serialize,restore} from '../src/engine.mjs';
import {UNITS,TECHS,LEADERS} from '../src/rules.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {ACTION_LIMITS} from '../src/warfare.mjs';
const tail=process.argv.includes('--tail'),algorithm=process.argv.includes('--B')?'B':'A',suffix=(algorithm==='B'?'-B':'')+(tail?'-tail':'');
const sourceFiles=[...(await readdir(new URL('../src/',import.meta.url))).filter(f=>f.endsWith('.mjs')).map(f=>'src/'+f),'web/visuals.js','web/unit-combat.js','sdk/civ.hpp','scripts/world-native-soak.mjs'];
const sources=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
const g=createGame({size:'massive',seed:'SIXTEEN-NATIVE-WORLD',barbarians:false,leaders:LEADERS.slice(tail?9:0,tail?25:16).map(l=>l.key),aiAlgorithm:algorithm}),pool=new NativeDriverPool(),sim=new RealtimeSimulation(g),start=performance.now();
const rounds=Number(process.argv[2]||process.env.CIV_WORLD_SOAK_ROUNDS)||32,counts={},milestones=[];let calls=0,maxActive=0,maxMoving=0,maxNation=0;
try{
 for(let round=0;round<rounds;round++){
  const players=g.players.filter(p=>p.alive);
  for(let i=0;i<players.length;i+=2){const pair=players.slice(i,i+2),responses=await Promise.all(pair.map(p=>pool.execute(p,observation(g,p))));for(let j=0;j<pair.length;j++){const p=pair[j],response=responses[j];p.memory=response.memory;sim.enqueue(p,response.orders);calls++;for(const a of response.orders)counts[a.type]=(counts[a.type]||0)+1;}}
  for(let step=0;step<80;step++){sim.tick(.25);const active=g.units.filter(u=>u.activity);maxActive=Math.max(maxActive,active.length);maxMoving=Math.max(maxMoving,active.filter(u=>u.activity.action.type==='move').length);maxNation=Math.max(maxNation,...g.players.map(p=>active.filter(u=>u.owner===p.id).length));}
  if(round%8===7){console.log('PERIOD '+g.turn+' / '+rounds+' mode '+algorithm+(tail?' tail':''));milestones.push({turn:g.turn,cities:g.cities.length,units:g.units.length,techs:g.players.map(p=>p.techs.length),winner:g.winner});}
 }
 assert(g.players.every(p=>g.cities.some(c=>c.owner===p.id)));assert.equal(g.players.length,16);assert(maxActive<=ACTION_LIMITS.active&&maxMoving<=ACTION_LIMITS.moving&&maxNation<=ACTION_LIMITS.perNation);assert(!g.winner);assert(g.units.every(u=>u.hp>0&&UNITS[u.type]));assert.equal(serialize(restore(serialize(g))),serialize(g));assert(Math.max(...g.players.flatMap(p=>p.techs.map(k=>TECHS[k].era)))<=2);
 for(const [file,before]of Object.entries(sources))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),before,'Source drift during native world run: '+file);
 const report={passed:true,algorithm,leaderRulesVersion:g.settings.leaderRulesVersion,leaders:g.players.map(p=>p.leaderKey),sources,rounds,calls,counts,maxActive,maxMoving,maxNation,ms:Math.round(performance.now()-start),milestones,activeSaveWritten:false,gameLaunched:false};await writeFile(new URL('../output/world-native-soak'+suffix+'.json',import.meta.url),JSON.stringify(report,null,2)+'\n');await writeFile(new URL('../output/world-native-soak-game'+suffix+'.json',import.meta.url),serialize(g));console.log(JSON.stringify(report));
}finally{pool.dispose();sim.dispose();}
