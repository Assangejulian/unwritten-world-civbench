import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createGame,observation,applyOrders,finishTurn,serialize} from '../src/engine.mjs';
import {executeDriver} from '../src/drivers.mjs';
const algorithm=process.argv.includes('--B')?'B':'A',suffix=algorithm==='B'?'-B':'';
const artifact=name=>new URL('../output/'+name+suffix+'.json',import.meta.url);
const sources=Object.fromEntries(await Promise.all([...(await readdir(new URL('../src/',import.meta.url))).filter(f=>f.endsWith('.mjs')).map(f=>'src/'+f),'web/visuals.js','web/unit-combat.js','sdk/civ.hpp','scripts/science-marathon-check.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex')])));
const g=createGame({aiAlgorithm:algorithm,players:1,size:'huge',seed:'SCIENCE-LONG-FORM',gameSpeed:'standard',barbarians:false,maxTurns:650}),stages=[];
let lastStage=0;const start=performance.now();
for(let round=0;round<650&&!g.winner;round++){
  const p=g.players[0],response=await executeDriver(p,observation(g,p));p.memory=response.memory;applyOrders(g,p,response.orders);finishTurn(g);
  if(p.spaceStage!==lastStage){lastStage=p.spaceStage;stages.push({stage:lastStage,turn:g.turn,techs:p.techs.length});console.log(JSON.stringify(stages.at(-1)));}
  if(round%50===49)await writeFile(artifact('science-pace-checkpoint'),serialize(g));
}
assert.equal(g.winner?.type,'science','All three standard-speed space projects must remain achievable before the score limit');assert(g.turn>180);assert.equal(stages.length,3);
await writeFile(artifact('science-paced-game'),serialize(g));await writeFile(artifact('science-paced-checks'),JSON.stringify({passed:true,algorithm,leaderRulesVersion:g.settings.leaderRulesVersion,sources,turn:g.turn,winner:g.winner,stages,activeSaveWritten:false,ms:Math.round(performance.now()-start)},null,2));console.log(JSON.stringify({passed:true,algorithm,turn:g.turn,winner:g.winner},null,2));
