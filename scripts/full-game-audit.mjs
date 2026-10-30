import assert from 'node:assert/strict';
import {mkdir,readdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createGame,observation,serialize,restore,score,cityYields,productionRate,legalActions} from '../src/engine.mjs';
import {UNITS,TECHS,WONDERS,productionCost} from '../src/rules.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {ACTION_LIMITS} from '../src/warfare.mjs';

// Observer-only diagnostics never enter a native observation or alter gameplay.
const label=process.argv[2]||'audit-'+Date.now();assert(/^[a-z0-9-]+$/.test(label));
const limit=Number(process.env.CIV_AUDIT_LIMIT)||960,decisionSeconds=Number(process.env.CIV_AUDIT_DECISION_SECONDS)||5;
assert(Number.isInteger(limit)&&limit>=40&&limit<=2000,'Invalid audit period cap');assert(decisionSeconds>0&&Number.isFinite(decisionSeconds)&&20%decisionSeconds===0&&decisionSeconds%.25===0,'Planning cadence must divide the economy period and align to quarter seconds');
const dir=new URL('../output/full-game-'+label+'/',import.meta.url);await mkdir(dir,{recursive:true});assert.equal((await readdir(dir)).length,0,'Choose an unused audit label to preserve existing evidence');console.log('AUDIT '+dir.href);
const activeURL=new URL('../saves/autosave.json',import.meta.url),activeBytes=await readFile(activeURL),hash=b=>createHash('sha256').update(b).digest('hex');
const resumeURL=process.env.CIV_AUDIT_RESUME?pathToFileURL(process.env.CIV_AUDIT_RESUME):null,resumeDir=resumeURL?new URL('./',resumeURL):null;
const prefix=resumeDir?JSON.parse(await readFile(new URL('status.json',resumeDir),'utf8')):null;
const g=resumeURL?restore(await readFile(resumeURL,'utf8')):createGame({players:12,size:'huge',seed:'TWELVE-AUDIT-20261007',maxTurns:limit,gameSpeed:'standard',barbarians:true,autosaveEnabled:false});
const resumedFromTurn=resumeURL?g.turn:null;
const pool=new NativeDriverPool(),sim=new RealtimeSimulation(g),started=performance.now(),counts={},failures={},milestones=[],issues=[],history=new Map(),unitHistory=new Map(),lastActions=new Map(),captured=new Set();
let calls=prefix?.calls||0,maxActive=0,maxMoving=0,maxNation=0,maxUnits=0,lastEvent=resumeURL?Math.max(0,...g.events.map(e=>e.id)):0,lastTurn=g.turn;
if(prefix){Object.assign(counts,prefix.counts);Object.assign(failures,prefix.failures);Object.assign(sim.stats,prefix.stats);}
const activityCounts={},rejections=[],blockedHistory=new Map();
const startAction=sim.start.bind(sim);sim.start=(p,a)=>{try{const result=startAction(p,a);if(result){counts[a.type]=(counts[a.type]||0)+1;if(a.unit!==undefined)lastActions.set(a.unit,g.turn);}return result;}catch(e){const key=a.type+': '+e.message;failures[key]=(failures[key]||0)+1;if(rejections.length<80)rejections.push({turn:g.turn,player:p.id,action:a,error:e.message});throw e;}};
const completeAction=sim.complete.bind(sim);sim.complete=entity=>{const a=entity.activity?.action,old=sim.stats.rejected;completeAction(entity);if(a&&old!==sim.stats.rejected){const key='impact:'+a.type;failures[key]=(failures[key]||0)+1;if(rejections.length<80)rejections.push({turn:g.turn,player:entity.owner,action:a,error:'Impact revalidation rejected'});}else if(a){activityCounts[a.type]=(activityCounts[a.type]||0)+1;lastActions.set(entity.id,g.turn);}};
async function issue(kind,entity,details){const key=kind+':'+entity;if(captured.has(key))return;captured.add(key);const entry={turn:g.turn,time:g.realtime.time,kind,entity,...details};issues.push(entry);await appendFile(new URL('issues.jsonl',dir),JSON.stringify(entry)+'\n');if(issues.length<=12)await writeFile(new URL('issue-'+issues.length+'-turn-'+g.turn+'.json',dir),serialize(g));console.log('OBSERVE '+JSON.stringify(entry));}
function nation(p){const cities=g.cities.filter(c=>c.owner===p.id),units=g.units.filter(u=>u.owner===p.id);return {id:p.id,name:p.short,alive:p.alive,score:score(g,p),cities:cities.length,population:cities.reduce((n,c)=>n+c.population,0),units:units.length,military:units.filter(u=>!UNITS[u.type].civilian).length,settlers:units.filter(u=>u.type==='settler').length,builders:units.filter(u=>u.type==='builder').length,techs:p.techs.length,civics:p.civics.length,technologyEra:Math.max(0,...p.techs.map(k=>TECHS[k].era)),gold:Math.round(p.gold),science:Math.round(p.scienceTotal),culture:Math.round(p.cultureTotal),tourism:Math.round(p.tourism),space:p.spaceStage,wars:Object.entries(p.relations).filter(([,r])=>r.status==='war').map(([id])=>+id),religion:p.religion,lowLoyalty:cities.filter(c=>c.loyalty<50).length,queue:g.realtime.queues[p.id]?.length||0};}
async function inspect(){
 assert.equal(g.players.length,12);assert.equal(g.maxTurns,limit);
 for(const p of g.players){assert(Number.isFinite(p.gold)&&p.gold>=0);assert(Number.isFinite(p.faith)&&p.faith>=0);if(p.alive&&!g.cities.some(c=>c.owner===p.id)&&!g.units.some(u=>u.owner===p.id&&u.type==='settler'))await issue('alive-without-settlement',p.id,{});}
 for(const u of g.units){assert(UNITS[u.type]&&g.map.tiles[u.tile]);assert(u.hp>0&&u.hp<=100);const old=unitHistory.get(u.id),unchanged=old&&old.tile===u.tile&&old.owner===u.owner;unitHistory.set(u.id,{tile:u.tile,owner:u.owner,since:unchanged?old.since:g.turn});
  if(u.owner>=0&&['settler','builder'].includes(u.type)&&unchanged&&g.turn-old.since>=35&&!u.activity&&g.turn-(lastActions.get(u.id)||0)>=20){await issue('idle-civilian',u.id,{owner:u.owner,type:u.type,tile:u.tile,since:old.since,charges:u.charges,queue:(g.realtime.queues[u.owner]||[]).filter(q=>q.action.unit===u.id).map(q=>q.action)});}
 }
 const liveIds=new Set(g.units.map(u=>u.id));for(const id of unitHistory.keys())if(!liveIds.has(id))unitHistory.delete(id);
 for(const c of g.cities){assert(Number.isInteger(c.population)&&c.population>=1);assert(Number.isFinite(c.loyalty)&&c.loyalty>=0&&c.loyalty<=100);assert(c.hp>=0&&c.hp<=200);assert(c.walls>=0);const work=c.production,token=JSON.stringify([c.owner,work?.item,work?.fortress,work?.progress,work?.funded]),old=history.get(c.id),same=old?.token===token;history.set(c.id,{token,since:same?old.since:g.turn});
  if(work&&work.progress>=(work.cost??productionCost(g,work.item))){const key=JSON.stringify([c.owner,work.item,work.tile,work.fortress]),prior=blockedHistory.get(c.id),since=prior?.key===key?prior.since:g.turn;blockedHistory.set(c.id,{key,since});if(g.turn-since>=12)await issue('blocked-completed-production',c.id,{owner:c.owner,item:work.item,progress:work.progress,since,fortress:work.fortress});}else blockedHistory.delete(c.id);
  if(same&&g.turn-old.since>=12&&work){const cost=work.cost??productionCost(g,work.item),rate=productionRate(g,c);if(work.progress>=cost-.001||rate>0)await issue('stalled-production',c.id,{owner:c.owner,item:work.item,progress:work.progress,cost,rate,since:old.since,fortress:work.fortress});}
  if(same&&g.turn-old.since>=8&&!work)await issue('idle-city',c.id,{owner:c.owner,population:c.population,since:old.since,yields:cityYields(g,c)});
 }
 const active=g.units.filter(u=>u.activity),moving=active.filter(u=>['move','rebase'].includes(u.activity.action.type));maxUnits=Math.max(maxUnits,g.units.length);maxActive=Math.max(maxActive,active.length);maxMoving=Math.max(maxMoving,moving.length);maxNation=Math.max(maxNation,...g.players.map(p=>active.filter(u=>u.owner===p.id).length));assert(maxActive<=ACTION_LIMITS.active&&maxMoving<=ACTION_LIMITS.moving&&maxNation<=ACTION_LIMITS.perNation);
 const events=g.events.filter(e=>e.id>lastEvent).sort((a,b)=>a.id-b.id);lastEvent=Math.max(lastEvent,...events.map(e=>e.id));if(events.length)await appendFile(new URL('events.jsonl',dir),events.map(e=>JSON.stringify(e)).join('\n')+'\n');
 if(g.turn%20===0||g.winner){const record={turn:g.turn,time:g.realtime.time,ms:Math.round(performance.now()-started),cities:g.cities.length,units:g.units.length,alive:g.players.filter(p=>p.alive).length,winner:g.winner,calls,stats:{...sim.stats},nations:g.players.map(nation),counts:{...counts},failures:{...failures},issues:issues.length};milestones.push(record);await appendFile(new URL('timeline.jsonl',dir),JSON.stringify(record)+'\n');await writeFile(new URL('status.json',dir),JSON.stringify(record,null,2));console.log('TURN '+JSON.stringify({turn:g.turn,cities:g.cities.length,units:g.units.length,alive:record.alive,calls,rejected:sim.stats.rejected,issues:issues.length,ms:record.ms,winner:g.winner}));}
 if(g.turn%40===0){await writeFile(new URL('checkpoint.json',dir),serialize(g));const resumed=restore(serialize(g));new RealtimeSimulation(resumed).dispose();assert.equal(hash(serialize(resumed)),hash(serialize(g)),'Restore must preserve the ongoing realtime world');}
}
try{
 await writeFile(new URL('initial.json',dir),resumeDir?await readFile(new URL('initial.json',resumeDir)):serialize(g));
 if(resumeURL)await writeFile(new URL('resume-input.json',dir),serialize(g));
 for(const name of ['events.jsonl','timeline.jsonl','issues.jsonl']){let content=resumeDir?await readFile(new URL(name,resumeDir),'utf8'):'';if(resumeDir)content=content.split('\n').filter(Boolean).map(JSON.parse).filter(e=>name==='events.jsonl'?e.id<=lastEvent:e.turn<=g.turn).map(e=>JSON.stringify(e)+'\n').join('');await writeFile(new URL(name,dir),content);}
 if(resumeDir)for(const entry of (await readFile(new URL('issues.jsonl',dir),'utf8')).split('\n').filter(Boolean).map(JSON.parse)){issues.push(entry);captured.add(entry.kind+':'+entry.entity);}
 await writeFile(new URL('provenance.json',dir),JSON.stringify({label,resumedFromTurn,resumedFrom:resumeURL?.href||null,seed:g.seed,decisionSeconds},null,2));
 while(!g.winner&&g.turn<limit){
  // Planning cadence is configurable; physical action and economy clocks retain native timing.
  for(let slice=0;slice<20/decisionSeconds&&!g.winner;slice++){
   const players=g.players.filter(p=>p.alive),offset=(g.turn+slice)%players.length,ordered=players.slice(offset).concat(players.slice(0,offset));
   for(let i=0;i<ordered.length;i+=2){const batch=ordered.slice(i,i+2);const responses=await Promise.all(batch.map(p=>pool.execute(p,observation(g,p))));for(let j=0;j<batch.length;j++){const p=batch[j],response=responses[j];p.memory=response.memory;p.driver.calls++;calls++;sim.enqueue(p,response.orders);}}
   for(let step=0;step<decisionSeconds/.25&&!g.winner;step++)sim.tick(.25);
   if(g.turn!==lastTurn){lastTurn=g.turn;await inspect();}
  }
 }
 assert(g.winner,'The game must reach a normal victory or its score limit');
 await writeFile(new URL('final.json',dir),serialize(g));assert.equal(hash(await readFile(activeURL)),hash(activeBytes),'The user save must remain unchanged');
 const result={completed:true,label,resumedFromTurn,seed:g.seed,players:12,map:{width:g.map.width,height:g.map.height},limit,decisionSeconds,turn:g.turn,winner:g.winner,calls,stats:sim.stats,maxActive,maxMoving,maxNation,maxUnits,counts,activityCounts,failures,rejections,issues,nations:g.players.map(nation),milestones:milestones.length,ms:Math.round(performance.now()-started),activeSaveWritten:false,gameLaunched:false,activeSaveSha256:hash(activeBytes)};
 await writeFile(new URL('report.json',dir),JSON.stringify(result,null,2)+'\n');console.log('COMPLETE '+JSON.stringify({turn:g.turn,winner:g.winner,calls,rejected:sim.stats.rejected,issues:issues.length,ms:result.ms}));
}catch(error){await writeFile(new URL('failure-state.json',dir),serialize(g));await writeFile(new URL('failure.json',dir),JSON.stringify({turn:g.turn,calls,error:error.stack,failures,issues},null,2));throw error;}finally{sim.dispose();pool.dispose();}
