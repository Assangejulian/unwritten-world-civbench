import {normalizeAiAlgorithm} from './src/ai.mjs';
import {playerTasks} from './src/player-tasks.mjs';
import {unitRoute,settlementLens} from './src/player-planning.mjs';
import http from 'node:http';
import {readFile,writeFile,mkdir,readdir,rename,stat,unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createGame,observation,snapshot,serialize,restore,applyAction} from './src/engine.mjs';
import {migrateRealtime} from './src/realtime.mjs';
import {GameSimulation} from './src/turns.mjs';
import {NativeDriverPool} from './src/driver-pool.mjs';
import {ObservationPool} from './src/observation-pool.mjs';
import {StateTransport} from './src/state-transport.mjs';
import {executionStatus,STATUS_UNIT_LIMIT} from './src/execution-status.mjs';
import {validateBatchEnvelope,executeBatch} from './src/batch-intent.mjs';
import {ROOT,listDrivers,compileDriver,validFile,readSource,importSource} from './src/drivers.mjs';
import {MAP_SIZES,CIVS,selectLeaderKeys,NATIONAL_POLICIES,NATIONAL_STRATEGIES} from './src/rules.mjs';
import {publicControllers} from './src/environment/controllers.mjs';
import {Lobby} from './src/environment/lobby.mjs';

const PORT=Number(process.env.PORT)||43821,HOST='127.0.0.1';
const saveDir=path.join(ROOT,'saves');await mkdir(saveDir,{recursive:true});
let game=createGame({seed:'FIRST-HORIZON',players:8}),busy=false,speed=1,revision=1,lastError='',lastRound=null,lastSaved=null;
try{const saved=restore(await readFile(path.join(saveDir,'autosave.json'),'utf8'));if(saved.players.every(p=>validFile(p.driver?.file)))game=migrateRealtime(saved);}catch(e){if(e.code!=='ENOENT')console.warn(`Autosave could not be restored: ${e.message}`);}
const transport=new StateTransport(),pool=new NativeDriverPool(),observations=new ObservationPool(2);
// Isolated pending match for the New Game screen. It never replaces `game` or writes saves.
const setupLobby=new Lobby({stub:false});
const changed=()=>{revision++;};
// Snapshot pacing: at most one rebuild per view every SNAPSHOT_INTERVAL ms; in between the newest
// built revision is served (deltas stay exact). Economy/diplomacy details are memoized for at most
// DETAIL_MAX_AGE ms and are discarded on any period change or user mutation.
const SNAPSHOT_INTERVAL=200,DETAIL_MAX_AGE=1000,snapshotViews=new Map();let detailEpoch=0;
function stateResponse(view,url){
  const now=performance.now(),hasSince=url.searchParams.has('since'),since=Number(url.searchParams.get('since')),clientGame=url.searchParams.get('game');
  let entry=snapshotViews.get(view);if(!entry||entry.game!==game.id){entry={game:game.id,revision:0,at:-Infinity,memo:new Map(),memoAt:now,memoTurn:game.turn,epoch:detailEpoch,generation:transport.generation};snapshotViews.set(view,entry);}
  // A paced revision is reusable only while transport still holds its exact history (same generation, not evicted).
  const paceable=entry.revision&&entry.generation===transport.generation&&transport.has(game.id,view,entry.revision);
  const served=hasSince&&clientGame===game.id&&paceable&&entry.revision!==revision&&now-entry.at<SNAPSHOT_INTERVAL?entry.revision:revision;
  const session={...sessionState(view),revision:served};
  if(hasSince&&since===served&&clientGame===game.id)return {unchanged:true,session};
  const result=transport.response(game.id,served,view,since,clientGame,()=>{
    if(now-entry.memoAt>DETAIL_MAX_AGE||entry.memoTurn!==game.turn||entry.epoch!==detailEpoch||game.winner){entry.memo=new Map();entry.memoAt=now;entry.memoTurn=game.turn;entry.epoch=detailEpoch;}
    return snapshot(game,view,{manualOptionsOnly:true,memo:entry.memo});
  });
  if(served===revision){entry.revision=revision;entry.at=now;entry.generation=transport.generation;}
  return {...result,session};
}
// Single cleanup path for world replacement: transport history, every perspective cache and detail memos go together.
function resetStateCaches(){transport.clear();snapshotViews.clear();detailEpoch++;worldToken++;rejections.clear();}
// Server-lifetime world token: changes on every world replacement, including a same-id save reload.
let worldToken=1;
// Bounded in-memory rejection history per country (never saved); identity is captured at the rejection site.
const rejections=new Map(),REJECTION_LIMIT=32;
function recordRejection(e){if(!e||!Number.isInteger(e.owner)||e.owner<0)return;const list=rejections.get(e.owner)||[];list.push({stage:String(e.stage),type:String(e.type),...(Number.isInteger(e.unit)?{unit:e.unit}:{}),...(Number.isInteger(e.partner)?{partner:e.partner}:{}),...(Number.isInteger(e.city)?{city:e.city}:{}),reason:String(e.reason||'').slice(0,160),time:Number(e.time)||0});if(list.length>REJECTION_LIMIT)list.splice(0,list.length-REJECTION_LIMIT);rejections.set(e.owner,list);}
let saving=Promise.resolve();
const saveMetadata=new Map();
function writeSave(file,contents){
  const task=saving.catch(()=>{}).then(async()=>{const destination=path.join(saveDir,file),temporary=destination+'.pending';try{await writeFile(temporary,contents);await rename(temporary,destination);saveMetadata.delete(file);lastSaved={file,at:new Date().toISOString()};}finally{await unlink(temporary).catch(()=>{});}});
  saving=task;return task;
}
async function listSaves(){
  const files=(await readdir(saveDir)).filter(f=>/^[A-Za-z0-9_-]+\.json$/.test(f)),entries=[];
  for(const file of files){try{const info=await stat(path.join(saveDir,file)),key=info.mtimeMs+':'+info.size;let entry=saveMetadata.get(file);if(entry?.key!==key){const saved=JSON.parse(await readFile(path.join(saveDir,file),'utf8'));entry={key,file,label:saved.saveLabel||(file==='autosave.json'?'自动存档':file.startsWith('save-before-world-leaders-')?'重构前保留存档':file.startsWith('before-new-')?'新游戏前保留存档':'手动存档'),turn:saved.turn,seed:saved.seed,time:saved.realtime?.time||0,players:saved.players?.length,updatedAt:new Date(info.mtimeMs).toISOString(),valid:saved.version===1&&Array.isArray(saved.map?.tiles)&&Array.isArray(saved.players)};saveMetadata.set(file,entry);}const {key:_,...metadata}=entry;entries.push(metadata);}catch{entries.push({file,label:'无法读取的存档',valid:false});}}
  entries.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));return {files:entries.map(e=>e.file),entries};
}
function makeSimulation(world){return new GameSimulation(world,{execute:(p,obs)=>pool.execute(p,obs),prepareObservation:(world,p)=>observations.prepare(world,p),onChange:changed,onRejected:recordRejection,onEconomy:before=>{
  lastRound={turn:world.turn-1,finishedAt:Date.now(),players:before.map(b=>{const p=world.players[b.id];return {id:p.id,gold:p.gold-b.gold,faith:p.faith-b.faith,science:p.scienceTotal-b.science,culture:p.cultureTotal-b.culture,cities:world.cities.filter(c=>c.owner===p.id).length-b.cities,population:world.cities.filter(c=>c.owner===p.id).reduce((n,c)=>n+c.population,0)-b.population,units:world.units.filter(u=>u.owner===p.id).length-b.units,techs:p.techs.filter(k=>!b.techs.includes(k)),civics:p.civics.filter(k=>!b.civics.includes(k))};})};
  if(world.settings.autosaveEnabled!==false&&(world.turn%(world.settings.autosaveEvery||3)===0||world.winner)){const contents=serialize(world);void writeSave('autosave.json',contents).catch(error=>{lastError=error.message;changed();});}
}});}
let simulation=makeSimulation(game),lastTick=performance.now();
function sessionState(view=-1){return {...simulation.state(view),busy,speed,revision,world:worldToken,lastError,lastSaved,nextTurnAt:null,controllers:publicControllers(game,view),lastRound:lastRound?{...lastRound,players:lastRound.players.filter(p=>view<0||p.id===view)}:null};}
function replaceGame(world){const next=makeSimulation(world);simulation.dispose();pool.invalidate();simulation=next;simulation.rate=speed;game=world;resetStateCaches();lastRound=null;lastError='';changed();}
function pause(){simulation.pause();changed();}
async function lobbyPost(route,data){
  if(route==='/api/lobby/prepare')return setupLobby.prepare(data);
  if(route==='/api/lobby/start')return setupLobby.start(data||{});
  if(route==='/api/lobby/cancel')return setupLobby.cancel();
  if(route==='/api/lobby/copy')return setupLobby.copy(Number(data?.seat));
  if(route==='/api/lobby/harness/scan')return setupLobby.harnesses.scan(setupLobby);
  if(route==='/api/lobby/harness/bind')return setupLobby.harnesses.bind(setupLobby,data);
  if(route==='/api/lobby/harness/unbind')return setupLobby.harnesses.unbind(setupLobby,data);
  if(route==='/api/lobby/harness/open')return setupLobby.harnesses.open(data);
  if(route==='/api/lobby/disconnect')return setupLobby.disconnect(Number(data?.seat));
  if(route==='/api/lobby/agent/start')return setupLobby.launcher.start(setupLobby,data);
  if(route==='/api/lobby/agent/check')return setupLobby.launcher.checkApi(data?.api,{lobby:setupLobby,seat:Number(data?.seat),keepExistingKey:data?.keepExistingKey===true});
  if(route==='/api/lobby/agent/profile')return setupLobby.launcher.apiProfile(setupLobby,Number(data?.seat));
  if(route==='/api/lobby/agent/trace')return setupLobby.launcher.trace(setupLobby,Number(data?.seat),data?.after);
  if(route==='/api/lobby/agent/update')return setupLobby.launcher.updateApi(setupLobby,data);
  if(route==='/api/lobby/agent/resume')return setupLobby.launcher.resume(setupLobby,Number(data?.seat));
  if(route==='/api/lobby/agent/stop')return setupLobby.launcher.stop(Number(data?.seat),setupLobby);
  const error=new Error('Unknown API route');error.status=404;throw error;
}
function schedule(){lastTick=performance.now();simulation.rate=speed;simulation.play();}
const timer=setInterval(()=>{const now=performance.now(),elapsed=Math.max(0,Math.min(.25,(now-lastTick)/1000));lastTick=now;if(!simulation.running||busy)return;try{simulation.tick(elapsed*speed);const active=simulation;void active.plan().catch(error=>{if(active!==simulation)return;pause();lastError=error.message;changed();});if(game.winner)pause();}catch(error){pause();lastError=error.message;changed();}},50);
const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req){const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>64*1024*1024)throw new Error('请求超过 64 MB 上限。');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
function safeLocal(req){const host=req.headers.host;if(![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(host))return false;const origin=req.headers.origin;if(origin&&![`http://127.0.0.1:${PORT}`,`http://localhost:${PORT}`].includes(origin))return false;return true;}
const server=http.createServer(async(req,res)=>{
  try{
    if(!safeLocal(req)){json(res,403,{error:'This server accepts local requests only.'});return;}
    const url=new URL(req.url,`http://${HOST}:${PORT}`),route=url.pathname;
    if(req.method==='GET'&&route==='/health'){json(res,200,{app:'hex-civilizations',version:1,port:PORT,project:ROOT,features:{modelApi:true,mcpClients:true,unboundedAgents:true,modelObserver:true}});return;}
    if(req.method==='GET'&&route==='/api/state'){
      const view=Number(url.searchParams.get('view')??-1);
      if(!Number.isInteger(view)||view < -1||view>=game.players.length)throw new Error('无效的玩家视野。');
      json(res,200,stateResponse(view,url));return;
    }
    if(req.method==='GET'&&route==='/api/unit-plan'){const view=Number(url.searchParams.get('view')),id=Number(url.searchParams.get('unit')),p=game.players[view],u=game.units.find(u=>u.id===id&&u.owner===view);if(!Number.isInteger(view)||view<0||!p?.manual||!u)throw Error('只能规划己方单位。');const destination=url.searchParams.has('tile')?Number(url.searchParams.get('tile')):null;json(res,200,{game:game.id,world:worldToken,revision,unit:id,...(destination===null?{sites:u.type==='settler'?settlementLens(game,p):[]}:{route:unitRoute(game,p,u,destination)})});return;}
    if(req.method==='GET'&&route==='/api/tasks'){const view=Number(url.searchParams.get('view'));if(!Number.isInteger(view)||view<0||!game.players[view])throw Error('任务仅对玩家视角开放。');json(res,200,{game:game.id,revision,world:worldToken,...playerTasks(game,view)});return;}
    if(req.method==='GET'&&route==='/api/execution'){
      const view=Number(url.searchParams.get('view')??-1),raw=url.searchParams.get('units');
      if(!Number.isInteger(view)||view < -1||view>=game.players.length)throw new Error('无效的玩家视野。');
      const units=raw===null||raw===''?null:raw.split(',').map(Number);if(units&&(units.length>STATUS_UNIT_LIMIT||units.some(id=>!Number.isInteger(id))))throw new Error('单位列表无效。');
      const history=view<0?Object.fromEntries([...rejections].map(([k,v])=>[k,v.map(x=>({...x}))])):(rejections.get(view)||[]).map(x=>({...x}));
      json(res,200,{world:worldToken,game:game.id,revision,...executionStatus(game,view,{units,rejections:history})});return;
    }
    if(req.method==='GET'&&route==='/api/drivers'){json(res,200,{drivers:await listDrivers()});return;}
    if(req.method==='GET'&&route==='/api/lobby'){if(!setupLobby.authorize((/^Bearer ([A-Fa-f0-9]{16,128})$/.exec(req.headers.authorization||'')||[])[1]||'')){json(res,401,{error:'只有主机可以管理准备中的对局。',code:'unauthorized'});return;}json(res,200,setupLobby.status());return;}
    if(req.method==='GET'&&route==='/api/source'){json(res,200,{file:url.searchParams.get('file'),source:await readSource(url.searchParams.get('file'))});return;}
    if(req.method==='GET'&&route==='/api/observation'){const p=game.players[Number(url.searchParams.get('player'))];if(!p)throw new Error('玩家不存在。');const target=url.searchParams.get('unit'),unit=target===null?undefined:Number(target);if(target!==null&&(!Number.isInteger(unit)||!game.units.some(u=>u.id===unit&&u.owner===p.id)))throw new Error('单位不存在。');json(res,200,await observations.prepare(game,p,{pathsForUnit:unit,nativeRoutes:false}));return;}
    if(req.method==='GET'&&route==='/api/saves'){json(res,200,await listSaves());return;}
    if(req.method==='GET'&&route==='/api/save'){
      const name=url.searchParams.get('name');if(name&&!/^[A-Za-z0-9_-]+\.json$/.test(name))throw new Error('Invalid save filename');
      const contents=name?await readFile(path.join(saveDir,name),'utf8'):serialize(game);
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="civilization-${game.seed.replace(/[^A-Za-z0-9_-]/g,'_')}-turn-${game.turn}.json"`});res.end(contents);return;
    }
    if(req.method==='POST'&&route.startsWith('/api/')){
      if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'JSON content type required.'});return;}
      const data=await body(req);
      if(route.startsWith('/api/lobby/')){
        if(!setupLobby.authorize((/^Bearer ([A-Fa-f0-9]{16,128})$/.exec(req.headers.authorization||'')||[])[1]||'')){json(res,401,{error:'只有主机可以管理准备中的对局。',code:'unauthorized'});return;}
        try{json(res,200,await lobbyPost(route,data));}
        catch(error){json(res,error.status||400,{error:error.message,code:error.code||'invalid_action'});}
        return;
      }
      detailEpoch++;
      if(route==='/api/pause'){pause();json(res,200,{ok:true});return;}
      if(route==='/api/speed'){const rate=Number(data.rate);if(![.5,1,2,4].includes(rate))throw new Error('无效的模拟速度。');speed=rate;simulation.rate=rate;changed();json(res,200,{ok:true});return;}
      if(busy){json(res,409,{error:'正在准备世界或驱动，请稍后重试。'});return;}
      if(route==='/api/end-turn'){if(!simulation.turnBased)throw Error('当前为实时观战。');if(data.view!==data.player||!Number.isInteger(data.view)||data.view<0)throw Error('观察者不能结束回合。');busy=true;changed();try{await simulation.endTurn(data.player,{force:data.force===true});}finally{busy=false;changed();}json(res,200,{ok:true,turn:game.turn});return;}
      if(route==='/api/play'){if(game.winner)throw new Error('本局已结束。');changed();schedule();json(res,200,{ok:true});return;}
      if(route==='/api/step'){
        if(simulation.turnBased)throw Error('回合制对局请结束回合。');pause();busy=true;const seconds=Math.max(.1,Math.min(10,Number(data.seconds)||1));try{for(let i=0;i<Math.ceil(game.players.length/2);i++)await simulation.plan({force:true});simulation.tick(seconds);}finally{busy=false;}json(res,200,{ok:true,turn:game.turn,winner:game.winner});return;
      }
      if(route==='/api/new'){
        pause();busy=true;try{
          const count=Math.max(1,Math.min(16,Math.floor(Number(data.players)||(MAP_SIZES[data.size]||MAP_SIZES.huge).players))),files=Array.from({length:count},(_,i)=>data.drivers?.[i]||CIVS[i%8].file);
          normalizeAiAlgorithm(data.aiAlgorithm);
          selectLeaderKeys(count,data.leaders);
          for(const file of files){if(!validFile(file))throw new Error('无效的 C++ 驱动文件。');await compileDriver(file);}
          await writeSave('before-new-'+Date.now().toString(36)+'.json',serialize({...game,saveLabel:'新游戏前保留 · 第 '+game.turn+' 周期'}));const created=createGame(data);for(let i=0;i<count;i++)created.players[i].driver.file=files[i];replaceGame(created);await writeSave('autosave.json',serialize(game));
        }finally{busy=false;}json(res,200,{ok:true});return;
      }
      if(route==='/api/settings'){
        if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!['autosaveEnabled','autosaveEvery','aiAlgorithm'].includes(k)))throw new Error('游戏设置无效。');
        if(data.autosaveEnabled!==undefined&&typeof data.autosaveEnabled!=='boolean'||data.autosaveEvery!==undefined&&![3,5,10].includes(data.autosaveEvery))throw new Error('自动保存设置无效。');
        normalizeAiAlgorithm(data.aiAlgorithm);
        if(data.autosaveEnabled!==undefined)game.settings.autosaveEnabled=data.autosaveEnabled;
        if(data.autosaveEvery!==undefined)game.settings.autosaveEvery=data.autosaveEvery;
        changed();json(res,200,{ok:true,aiAlgorithm:game.settings.aiAlgorithm,running:simulation.running});return;
      }
      if(route==='/api/strategy'){
        const p=game.players[Number(data.player)];if(!p?.alive||!Object.hasOwn(NATIONAL_POLICIES,data.doctrine)||!Object.hasOwn(NATIONAL_STRATEGIES,data.strategy))throw new Error('国家战略或国策无效。');
        const time=game.realtime.time;if(p.doctrine!==data.doctrine&&(p.doctrineReadyAt||0)>time)throw new Error('国策调整仍在冷却。');
        if(p.doctrine!==data.doctrine)p.doctrineReadyAt=time+60;
        p.doctrine=data.doctrine;p.strategy=data.strategy;p.planRevision=(p.planRevision||0)+1;
        if(!p.manual)game.realtime.queues[p.id]=[];changed();json(res,200,{ok:true});return;
      }
      if(route==='/api/action'){
        const p=game.players[Number(data.player)];if(!p?.manual)throw new Error('请先接管此玩家。');if(data.view!==undefined&&(!Number.isInteger(data.view)||data.view<0||data.view!==p.id))throw Error('观察者不能下达国家命令。');if(simulation.turnBased){simulation.command(p,data.action);changed();json(res,200,{ok:true,queued:0,immediate:true});return;}if(['acceptCourt','rejectCourt','friendship','delegation','embassy','typedAlliance','tradeDeal','demand','denounce','formalWar','surpriseWar','appointGovernor','promoteGovernor','assignGovernor','unassignGovernor','sendCityEnvoy','levyCityState','warCityState','peaceCityState','recruitSpy','spyMission','recallSpy','setSpecialists','liberateCityState','acceptDiplomacy','rejectDiplomacy','government','policies','voteCongress','ageBonus'].includes(data.action?.type)){applyAction(game,p,data.action);changed();json(res,200,{ok:true,queued:0,immediate:true});return;}const queued=simulation.enqueue(p,[data.action],{manual:true});json(res,200,{ok:true,queued});return;
      }
      if(route==='/api/batch'){let checked;try{checked=validateBatchEnvelope(data,{game,worldToken});}catch(error){json(res,error.status||400,{error:error.message,world:worldToken});return;}
        const outcome=executeBatch(simulation,game,checked.p,checked.intent);json(res,200,{ok:true,world:worldToken,...outcome});return;}
      if(route==='/api/cancel-order'){const p=game.players[Number(data.player)];if(!p?.manual)throw new Error('请先接管此玩家。');simulation.cancel(p,Number(data.unit));json(res,200,{ok:true});return;}
      if(route==='/api/control'){
        pause();const p=game.players[Number(data.player)];if(!p)throw new Error('玩家不存在。');simulation.setControl(p,Boolean(data.manual));changed();json(res,200,{ok:true});return;
      }
      if(route==='/api/compile'){
        pause();busy=true;try{pool.invalidate(data.file);const result=await compileDriver(data.file,true);for(const p of game.players.filter(p=>p.driver.file===data.file)){p.driver.status='ready';p.driver.message='';}changed();json(res,200,{ok:true,file:result.file,ms:result.ms});}finally{busy=false;}return;
      }
      if(route==='/api/import-driver'){
        pause();busy=true;try{const file=await importSource(data.name,data.source);await compileDriver(file);changed();json(res,200,{ok:true,file});}finally{busy=false;}return;
      }
      if(route==='/api/set-driver'){
        pause();const p=game.players[Number(data.player)];if(!p||!validFile(data.file))throw new Error('无效的玩家或驱动。');busy=true;try{const previousFile=p.driver.file;await compileDriver(data.file);pool.invalidate(previousFile);game.realtime.queues[p.id]=[];p.driver.file=data.file;p.driver.status='ready';p.driver.message='';p.memory=null;changed();}finally{busy=false;}json(res,200,{ok:true});return;
      }
      if(route==='/api/save'){if(data.label!==undefined&&(typeof data.label!=='string'||data.label.length>80))throw new Error('存档名称最多 80 个字符。');const name=data.name==='autosave'?'autosave.json':`save-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}.json`;await writeSave(name,serialize({...game,saveLabel:data.label?.trim()||(data.name==='autosave'?'自动存档':'手动存档 · 第 '+game.turn+' 周期')}));json(res,200,{ok:true,file:name});return;}
      if(route==='/api/load'){
        pause();busy=true;try{let saved=data.save;
          if(data.file){if(!/^[A-Za-z0-9_-]+\.json$/.test(data.file))throw new Error('无效存档名称。');saved=JSON.parse(await readFile(path.join(saveDir,data.file),'utf8'));}
          const loaded=restore(JSON.stringify(saved));for(const p of loaded.players){if(!validFile(p.driver.file))throw new Error('存档中的驱动路径无效。');await compileDriver(p.driver.file);}
          migrateRealtime(loaded);replaceGame(loaded);json(res,200,{ok:true});
        }finally{busy=false;}return;
      }
      json(res,404,{error:'Unknown API route'});return;
    }
    if(req.method!=='GET'){json(res,405,{error:'Method not allowed'});return;}
    const staticPath=route==='/'?'web/index.html':['/heritage-data.mjs','/age-data.mjs','/governor-data.mjs','/rules.mjs','/river-network.mjs','/nations.mjs','/congress.mjs','/victory-rules.mjs','/leader-rework.mjs','/unique-content.mjs','/leader-badge.mjs'].includes(route)?'src'+route:`web${decodeURIComponent(route)}`;
    const file=path.resolve(ROOT,staticPath);if(!file.startsWith(path.join(ROOT,'web')+path.sep)&&!['heritage-data.mjs','age-data.mjs','governor-data.mjs','rules.mjs','river-network.mjs','nations.mjs','congress.mjs','victory-rules.mjs','leader-rework.mjs','unique-content.mjs','leader-badge.mjs'].some(name=>file===path.join(ROOT,'src',name))){json(res,404,{error:'Not found'});return;}
    const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
    const headers={'Content-Type':mime,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'"};
    if(mime.startsWith('audio/')){
      const info=await stat(file);let start=0,end=info.size-1,status=200;headers['Accept-Ranges']='bytes';
      if(req.headers.range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if(!match||!match[1]&&!match[2]){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}
        if(!match[1]){start=Math.max(0,info.size-Number(match[2]));}else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
        if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}
        status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
      }
      headers['Content-Length']=end-start+1;res.writeHead(status,headers);
      const stream=createReadStream(file,{start,end,highWaterMark:64*1024});stream.on('error',error=>res.destroy(error));res.on('close',()=>stream.destroy());stream.pipe(res);return;
    }
    const content=await readFile(file);res.writeHead(200,headers);res.end(content);
  }catch(e){if(e.code==='ENOENT')json(res,404,{error:'文件不存在。'});else json(res,400,{error:e.message});}
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
server.listen(PORT,HOST,()=>{if(process.send)process.send({type:'desktop-setup',url:`http://${HOST}:${PORT}/#setup=${setupLobby.hostCapability}`});console.log(`Hex Civilizations is ready: http://${HOST}:${PORT}/\nNative C++ players, deterministic hex world. Press Ctrl+C to stop.`);console.error(`New Game host setup (operator only, not an agent credential): http://${HOST}:${PORT}/#setup=${setupLobby.hostCapability}`);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{pause();clearInterval(timer);simulation.dispose();pool.dispose();observations.dispose();setupLobby.dispose();saving.finally(()=>server.close(()=>process.exit()));});
