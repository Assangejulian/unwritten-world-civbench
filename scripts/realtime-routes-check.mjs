// Exercise the exact server route source in memory: no listener, actual server,
// desktop, real save writes, or background simulation timer is started.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {Readable,Writable} from 'node:stream';
import {createGame,serialize,event,addUnit,foundCity} from '../src/engine.mjs';
import * as W from '../src/warfare.mjs';
const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);},before=await readFile(new URL('../saves/autosave.json',import.meta.url)),initial=createGame({seed:'RT-ROUTES-ONLY',players:2,size:'small',barbarians:false}),files=new Map([['autosave.json',serialize(initial)]]);let handler,tick,wall=0;
globalThis.__RealtimeRoutesFixture={
 http:{createServer(fn){handler=fn;return {on(){},listen(){},close(done){done?.();}};}},
 fs:{readFile:async file=>{if(files.has(String(file).split(/[\\/]/).at(-1)))return files.get(String(file).split(/[\\/]/).at(-1));throw Object.assign(new Error('Fixture file missing'),{code:'ENOENT'});},writeFile:async(file,data)=>files.set(String(file).split(/[\\/]/).at(-1),data),mkdir:async()=>{},readdir:async()=>[...files.keys()]},
 Pool:class{async execute(){return {orders:[],memory:null,ms:1,stderr:''};}invalidate(){}dispose(){}},
 clock:{now:()=>wall},interval(fn){tick=fn;return 1;},clearInterval(){},
};
const fixtureName=file=>String(file).split(/[\\/]/).at(-1);
Object.assign(globalThis.__RealtimeRoutesFixture.fs,{
 createReadStream:(file,{start,end})=>Readable.from([Buffer.from(files.get(fixtureName(file))).subarray(start,end+1)]),
 rename:async(from,to)=>{files.set(fixtureName(to),files.get(fixtureName(from)));files.delete(fixtureName(from));},
 stat:async file=>({mtimeMs:Date.now(),size:Buffer.byteLength(files.get(fixtureName(file))||'')}),
 unlink:async file=>{files.delete(fixtureName(file));},
});
let source=await readFile(new URL('../server.mjs',import.meta.url),'utf8');
source=source.replace("import http from 'node:http';","const http=globalThis.__RealtimeRoutesFixture.http;")
 .replace("import {readFile,writeFile,mkdir,readdir,rename,stat,unlink} from 'node:fs/promises';","const {readFile,writeFile,mkdir,readdir,rename,stat,unlink}=globalThis.__RealtimeRoutesFixture.fs;")
 .replace("import {createReadStream} from 'node:fs';","const {createReadStream}=globalThis.__RealtimeRoutesFixture.fs;")
 .replace("import {NativeDriverPool} from './src/driver-pool.mjs';","const NativeDriverPool=globalThis.__RealtimeRoutesFixture.Pool;")
 .replaceAll(/from '([.][/]src[/][^']+)'/g,(_,relative)=>`from '${new URL('../'+relative,import.meta.url).href}'`);
source="const performance=globalThis.__RealtimeRoutesFixture.clock,setInterval=globalThis.__RealtimeRoutesFixture.interval,clearInterval=globalThis.__RealtimeRoutesFixture.clearInterval;\n"+source;
assert(!/from 'node:fs(?:\/promises)?'/.test(source),'Every filesystem operation must remain isolated');
source+="\nexport const inspect=()=>({game,simulation,revision,setupLobby});export const cleanup=()=>{simulation.dispose();pool.dispose();};";
const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
async function request(route,data,headers={}){const req=Readable.from(data===undefined?[]:[Buffer.from(JSON.stringify(data))]);Object.assign(req,{url:route,method:data===undefined?'GET':'POST',headers:{host:'127.0.0.1:43821','content-type':'application/json',...headers}});let status,bytes='';const res={writeHead(code){status=code;return this;},end(body=''){bytes+=body;}};await handler(req,res);return {status,body:JSON.parse(bytes)};}
async function assetRequest(range){const req=Readable.from([]);Object.assign(req,{url:'/assets/audio/music/range-test.ogg',method:'GET',headers:{host:'127.0.0.1:43821',...(range?{range}:{})}});let status,headers;const chunks=[],res=new Writable({write(chunk,encoding,done){chunks.push(chunk);done();}});res.writeHead=(code,value)=>{status=code;headers=value;return res;};const finished=new Promise(resolve=>res.once('finish',resolve));await handler(req,res);await finished;return {status,headers,bytes:Buffer.concat(chunks).toString()};}
try{
 const {setupLobby}=module.inspect(),launches=[],stops=[],apiChecks=[],resumes=[],worldBeforeLaunch=serialize(module.inspect().game),originalLauncher=setupLobby.launcher;
 setupLobby.launcher={async start(lobby,options){assert.equal(lobby,setupLobby);launches.push(options);return {state:'starting',seat:options.seat};},stop(seat){stops.push(seat);return {state:'stopped',seat};},checkApi(api){apiChecks.push(api);return {ok:true};},resume(lobby,seat){assert.equal(lobby,setupLobby);resumes.push(seat);return {state:'starting',seat};},apiProfile(lobby,seat){assert.equal(lobby,setupLobby);return {seat,hasKey:true};},updateApi(lobby,body){assert.equal(lobby,setupLobby);return {seat:body.seat,state:'starting'};}};
 try{
  for(const route of ['/api/lobby/agent/start','/api/lobby/agent/stop','/api/lobby/agent/check','/api/lobby/agent/resume','/api/lobby/agent/profile','/api/lobby/agent/update']){
   assert.equal((await request(route,{seat:0})).status,401);
   assert.equal((await request(route,{seat:0},{authorization:'Bearer '+ '0'.repeat(48)})).status,401);
  }
  assert.equal(launches.length,0);assert.equal(stops.length,0);assert.equal(apiChecks.length,0);assert.equal(resumes.length,0);
  const hostHeaders={authorization:'Bearer '+setupLobby.hostCapability};
  const launched=await request('/api/lobby/agent/start',{seat:0,provider:'grok',rounds:50},hostHeaders);
  assert.equal(launched.status,200,'Desktop server must route the one-click launcher request');
  assert.deepEqual(launched.body,{state:'starting',seat:0});
  assert.deepEqual(launches,[{seat:0,provider:'grok',rounds:50}]);
  const stopped=await request('/api/lobby/agent/stop',{seat:0},hostHeaders);
  assert.equal(stopped.status,200);assert.deepEqual(stopped.body,{state:'stopped',seat:0});assert.deepEqual(stops,[0]);
  assert.equal((await request('/api/lobby/agent/check',{api:{model:'Test Model'}},hostHeaders)).status,200);assert.deepEqual(apiChecks,[{model:'Test Model'}]);
  assert.equal((await request('/api/lobby/agent/resume',{seat:0},hostHeaders)).status,200);assert.deepEqual(resumes,[0]);
  assert.deepEqual((await request('/api/lobby/agent/profile',{seat:0},hostHeaders)).body,{seat:0,hasKey:true});
  assert.equal((await request('/api/lobby/agent/update',{seat:0,api:{model:'Updated'}},hostHeaders)).status,200);
  assert.equal(serialize(module.inspect().game),worldBeforeLaunch);
  pass('Desktop one-click launch and stop reach the selected-seat manager only with host authorization and preserve the current world');
 }finally{setupLobby.launcher=originalLauncher;}
 files.set('range-test.ogg',Buffer.from('0123456789'));
 let audioAsset=await assetRequest();assert.equal(audioAsset.status,200);assert.equal(audioAsset.bytes,'0123456789');assert.equal(audioAsset.headers['Content-Type'],'audio/ogg');
 audioAsset=await assetRequest('bytes=2-5');assert.equal(audioAsset.status,206);assert.equal(audioAsset.bytes,'2345');assert.equal(audioAsset.headers['Content-Range'],'bytes 2-5/10');
 assert.equal((await assetRequest('bytes=-2')).bytes,'89');assert.equal((await assetRequest('bytes=9-99')).bytes,'9');
 for(const invalid of ['bytes=10-','bytes=3-1','bytes=-0','bytes=0-2,4-6','bytes=-','other=1-2'])assert.equal((await assetRequest(invalid)).status,416);
 pass('Audio streams use the exact server route with bounded chunks, correct Ogg MIME, seek/suffix ranges and invalid-range rejection');
 let state=await request('/api/state');assert.equal(state.status,200);assert.equal(state.body.session.mode,'realtime');assert.equal(state.body.session.time,0);assert(!JSON.parse(files.get('autosave.json')).realtime);pass('Startup migrates a legacy save in memory and starts paused without writing it');
 assert.equal((await request('/api/state',undefined,{host:'evil.example'})).status,403);assert.equal((await request('/api/state?view=99')).status,400);assert.equal((await request('/api/play',{}, {'content-type':'text/plain'})).status,415);pass('Host/origin, perspective and JSON request validation remain enforced');
 assert.equal((await request('/api/play',{})).status,200);await request('/api/speed',{rate:4});assert.equal((await request('/api/speed',{rate:100})).status,400);wall+=1000;tick();await new Promise(r=>setImmediate(r));state=await request('/api/state');assert.equal(state.body.session.time,1);assert.equal(state.body.session.rate,4);assert(state.body.session.running);pass('Spectator realtime uses bounded speed scaling and long stalls cannot cause a catch-up spiral');
 const u=module.inspect().game.units.find(u=>u.owner===0&&u.type==='warrior');assert.equal((await request('/api/action',{player:0,action:{type:'fortify',unit:u.id}})).status,400);assert.equal((await request('/api/action',{player:1,action:{type:'fortify',unit:u.id}})).status,400);pass('Spectator action routes reject commands without an owned human controller');
 const ownUnitObservation=await request('/api/observation?player=0&unit='+u.id);assert.equal(ownUnitObservation.status,200);assert.equal((await request('/api/observation?player=1&unit='+u.id)).status,400);assert.equal((await request('/api/observation?player=0&unit=invalid')).status,400);pass('Optional path observations accept owned units and reject foreign or malformed unit identifiers');
 const revision=state.body.session.revision,world=state.body.game.id;await request('/api/pause',{});const paused=module.inspect().game.realtime.time;wall+=1000;tick();assert.equal(module.inspect().game.realtime.time,paused);await request('/api/step',{seconds:1});assert.equal(module.inspect().game.realtime.time,paused+1);assert(!module.inspect().simulation.running);pass('Pause freezes the exact server clock and single-step advances one second while staying paused');
 const delta=await request(`/api/state?since=${revision}&game=${world}`);assert(delta.body.delta);const own=await request('/api/state?view=0');assert.equal(own.body.session.players.length,1);assert(!own.body.game.realtime.queues);pass('Realtime route responses preserve revision deltas and perspective-local queue privacy');
 const exported=await request('/api/save');assert(exported.body.realtime);await request('/api/save',{name:'autosave'});const current=module.inspect().game.id;const forged=JSON.parse(files.get('autosave.json'));forged.realtime.nextEconomy=-1;assert.equal((await request('/api/load',{save:forged})).status,400);assert.equal(module.inspect().game.id,current);assert.equal((await request('/api/load',{file:'autosave.json'})).status,200);assert.equal(module.inspect().game.realtime.time,paused+1);assert(!module.inspect().simulation.running);pass('New clock/activities export and reload; malformed loads leave the current world intact');
 const policy=await request('/api/strategy',{player:0,doctrine:'academy',strategy:'science'});assert.equal(policy.status,200);assert.equal(module.inspect().game.players[0].strategy,'science');assert.equal((await request('/api/strategy',{player:0,doctrine:'mobilization',strategy:'domination'})).status,400);assert.equal((await request('/api/strategy',{player:0,doctrine:'academy',strategy:'culture'})).status,200);assert.equal((await request('/api/strategy',{player:0,doctrine:'invalid',strategy:'science'})).status,400);pass('Nation plans apply through the actual route and policy swaps respect their 60-second cooldown');
 await request('/api/settings',{autosaveEnabled:false,autosaveEvery:3});const automaticBefore=files.get('autosave.json');module.inspect().simulation.tick(60);await new Promise(r=>setImmediate(r));assert.equal(files.get('autosave.json'),automaticBefore);
 const named=await request('/api/save',{label:'A preserved era'});assert.equal(named.status,200);const saved=JSON.parse(files.get(named.body.file));assert.equal(saved.saveLabel,'A preserved era');assert.equal(saved.players[0].strategy,'culture');assert.equal(saved.map.wrapX,true);assert.equal(saved.realtime.time,module.inspect().game.realtime.time);
 const catalogue=await request('/api/saves');assert(catalogue.body.entries.some(e=>e.file===named.body.file&&e.label==='A preserved era'&&e.valid));assert(!catalogue.body.files.some(f=>f.endsWith('.pending')));assert.equal((await request('/api/load',{file:'../autosave.json'})).status,400);
 await request('/api/settings',{autosaveEnabled:true,autosaveEvery:3});module.inspect().simulation.tick(60);await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));assert.notEqual(files.get('autosave.json'),automaticBefore);assert.equal((await request('/api/settings',{autosaveEnabled:true,autosaveEvery:1})).status,400);pass('Named saves and metadata, atomic file completion, path validation and configurable automatic saves execute against the exact server source');
 const identity=module.inspect().game.id,filesBefore=files.size;assert.equal((await request('/api/new',{players:2,leaders:['qin','qin']})).status,400);assert.equal((await request('/api/new',{players:2,leaders:['qin','invented']})).status,400);assert.equal(module.inspect().game.id,identity);assert.equal(files.size,filesBefore);pass('Invalid or duplicate historical leaders cannot replace a world or write a new backup');
 const preserved=serialize(module.inspect().game);assert.equal((await request('/api/new',{seed:'RT-NEW-ONLY',players:2,leaders:['qin','pachacuti'],size:'small',barbarians:false,doctrines:['academy','mobilization'],strategies:['science','domination']})).status,200);assert.equal(module.inspect().game.realtime.time,0);assert.equal(module.inspect().game.realtime.period,20);assert.notEqual(module.inspect().game.id,current);assert.equal(module.inspect().game.players[1].strategy,'domination');assert.deepEqual(module.inspect().game.players.map(p=>p.leaderKey),['qin','pachacuti']);const backup=[...files.keys()].find(f=>f.startsWith('before-new-'));assert(backup);assert.equal(JSON.parse(files.get(backup)).id,JSON.parse(preserved).id);assert.equal(JSON.parse(files.get(backup)).turn,JSON.parse(preserved).turn);pass('New-world replacement preserves the previous world in a separate save and starts with selected national plans');
 const live=module.inspect().game,sim=module.inspect().simulation;live.players.forEach(p=>{foundCity(live,p,live.units.find(u=>u.owner===p.id&&u.type==='settler'));p.manual=true;p.gold=500;p.met=live.players.filter(o=>o!==p).map(o=>o.id);});W.beginWar(live,live.players[0],live.players[1],event);live.realtime.time=160;live.realtime.nextEconomy=180;const cap=live.cities.find(c=>c.id===live.players[1].capital);live.players[0].knownCities[cap.id]={id:cap.id,owner:1,tile:cap.tile};const envoy=W.sendEnvoy(live,live.players[0],1,addUnit,event,{mode:'concession',gold:50});envoy.tile=cap.tile;W.envoyArrival(live,envoy,event);sim.enqueue(live.players[0],[{type:'fortify',unit:live.units.find(u=>u.owner===0&&u.type==='warrior').id}],{manual:true});const proposal=live.diplomacy.proposals.find(o=>o.envoy===envoy.id),frozen=live.realtime.time,queues=JSON.stringify(live.realtime.queues),response=await request('/api/action',{player:1,action:{type:'acceptDiplomacy',proposal:proposal.id}});assert.equal(response.status,200);assert.equal(response.body.immediate,true);assert.equal(response.body.queued,0);assert.equal(live.realtime.time,frozen);assert.equal(JSON.stringify(live.realtime.queues),queues);assert.equal(live.players[1].gold,550);assert.equal(live.players[0].relations[1].status,'peace');assert(!sim.running);pass('The exact paused action route signs envoy terms immediately without enqueuing, advancing the clock or losing existing orders');
 await request('/api/control',{player:0,manual:true});assert.equal(module.inspect().simulation.turnBased,true);assert.equal((await request('/api/play',{})).status,400);const turnClock=live.realtime.time;wall+=1000;tick();assert.equal(live.realtime.time,turnClock);assert.equal((await request('/api/action',{player:0,action:{type:'fortify',unit:live.units.find(u=>u.owner===0&&u.type==='warrior').id}})).status,200);pass('Human takeover enters sequential turns, rejects Play, freezes wall time and accepts owned turn commands');
 assert((await readFile(new URL('../saves/autosave.json',import.meta.url))).equals(before));pass('Server routes execute only against in-memory files, with no listener or active-save change');
 await writeFile(new URL('../output/realtime-route-checks.json',import.meta.url),JSON.stringify({passed:true,checks},null,2));
}finally{module.cleanup();delete globalThis.__RealtimeRoutesFixture;}
