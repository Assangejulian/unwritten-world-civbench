// Same-brand clients with separate configurations; no installed profiles or models.
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,writeFile,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {HARNESS_CLIENTS} from '../src/environment/harness-catalog.mjs';
import {HarnessConnections} from '../src/environment/harnesses.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';
const output=path.resolve('output/harness-instances-20261029');await mkdir(path.join(output,'private'),{recursive:true});
const home=await mkdtemp(path.join(output,'private','home-')),dataRoot=path.join(home,'.civbench','connections');
const manager=new HarnessConnections({home,dataRoot,env:{},discoverExecutables:async()=>({})});
const checks=[],clients=[],lobbies=[],pass=label=>{checks.push(label);console.log('PASS '+label);};
const require=createRequire(path.resolve('environment/mcp/package.json'));
const {Client}=require('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=require('@modelcontextprotocol/sdk/client/stdio.js');
const load=async file=>JSON.parse(await readFile(file,'utf8'));
async function call(client,name,args={}){const response=await client.callTool({name,arguments:args});return {error:!!response.isError,value:JSON.parse(response.content[0].text)};}
async function ok(client,name,args={}){const result=await call(client,name,args);assert.equal(result.error,false,JSON.stringify(result.value));return result.value;}
async function fixture(){const lobby=new Lobby({stub:true,harnesses:manager});lobbies.push(lobby);const host=await listen(null,{port:0,lobby});lobby.server=host.server;lobby.url=host.url;await lobby.prepare({players:4,size:'small',seed:'SAME-HARNESS-SESSIONS',barbarians:false,seats:Array.from({length:4},(_,seat)=>({seat,kind:'agent',autoName:true}))});return lobby;}
function serverEntry(client,text){
  if(client.format==='codex'){
    const command=JSON.parse(text.match(/^command = (.+)$/m)[1]),args=JSON.parse(text.match(/^args = (.+)$/m)[1]);
    return {command,args,env:{CIV_BINDING_FILE:JSON.parse(text.match(/^CIV_BINDING_FILE = (.+)$/m)[1])}};
  }
  const config=JSON.parse(text);
  if(client.format==='opencode'){const entry=config.mcp.civbench_game;return {command:entry.command[0],args:entry.command.slice(1),env:entry.environment};}
  if(client.patch)return config[0].insert[0].config;
  let entries=config;for(const key of client.serverPath||['mcpServers'])entries=entries[key];return entries.civbench_game;
}
async function attach(reply,brand){
  const client=HARNESS_CLIENTS.find(c=>c.id===reply.harness),text=await readFile(path.join(reply.workspace,client.workspace),'utf8');
  const entry=serverEntry(client,text),binding=await load(entry.env.CIV_BINDING_FILE);
  assert.equal(text.includes(binding.token),false,'Generated client configurations contain binding paths, never seat credentials');
  const sdk=new Client({name:brand,version:'same-brand'});clients.push(sdk);await sdk.connect(new StdioClientTransport({...entry,stderr:'pipe'}));return sdk;
}
try{
  const catalogHome=await mkdtemp(path.join(output,'private','catalog-'));
  for(const client of HARNESS_CLIENTS){
    await mkdir(path.join(catalogHome,client.directory),{recursive:true});
    if(client.fileOnly){const file=path.join(catalogHome,...client.config);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,'{}');}
  }
  const catalog=new HarnessConnections({home:catalogHome,env:{},discoverExecutables:async()=>({})});
  const scan=await catalog.scan({runtime:null});
  assert.equal(new Set(scan.clients.map(c=>c.id)).size,HARNESS_CLIENTS.length);assert.equal(scan.clients.length,40);
  for(const entry of scan.clients){assert.equal(entry.canIsolate,!!HARNESS_CLIENTS.find(c=>c.id===entry.id).workspace);if(HARNESS_CLIENTS.find(c=>c.id===entry.id).manual)assert.equal(entry.setup,'manual');}
  assert.equal(JSON.stringify(scan).includes(catalogHome),false);
  await assert.rejects(catalog.bind({},{harness:'cherry-studio',seat:0}),e=>e.code==='client_manual_required');
  const sparseHome=await mkdtemp(path.join(output,'private','sparse-'));await mkdir(path.join(sparseHome,'.gemini'));
  const sparse=new HarnessConnections({home:sparseHome,env:{},discoverExecutables:async()=>({'claude.exe':process.execPath})});
  assert.deepEqual((await sparse.scan({runtime:null})).clients.map(c=>c.id),['claude-code']);
  pass('Forty explicit local families expose honest config/workspace/manual capabilities; shared .gemini roots and Claude CLI do not invent other installed clients');

  const lobby=await fixture(),replies=[];
  for(const [seat,harness]of ['workbuddy','workbuddy','codex','codex'].entries())replies.push(await manager.bind(lobby,{harness,seat,isolated:true}));
  assert.equal(new Set(replies.map(r=>r.instance)).size,4);assert.equal(new Set(replies.map(r=>r.workspace)).size,4);
  for(const reply of replies){assert.equal(reply.connected,false);assert.ok(path.isAbsolute(reply.workspace));}
  assert.equal((await readdir(home)).includes('.workbuddy'),false,'Isolated setup cannot create a global WorkBuddy configuration');
  const workspaces=await Promise.all(replies.map(async reply=>({reply,text:await readFile(path.join(reply.workspace,HARNESS_CLIENTS.find(c=>c.id===reply.harness).workspace),'utf8')})));
  for(const row of workspaces)for(const other of workspaces)if(other!==row)assert.equal(row.text.includes(other.reply.instance),false);
  const bindings=await Promise.all(replies.map(r=>load(path.join(path.dirname(r.workspace),'binding.json'))));
  assert.equal(new Set(bindings.map(b=>b.token)).size,4);
  assert.ok(bindings.every(b=>b.token!==lobby.runtime.hostToken&&b.token!==lobby.runtime.observerToken));
  pass('Two WorkBuddy and two Codex instances receive four separate workspaces/binding files and only their own civilization credentials');
  for(const reply of replies){const client=await attach(reply,reply.harness);const model=reply.seat===0?'deepseek-fixture':reply.seat===1?'kimi-fixture':'identical-codex-model';const session=await ok(client,'game_session',{model});assert.equal(session.seat,reply.seat);}
  const ownClients=clients.slice(-4);
  const projected=await manager.scan(lobby);
  for(const id of ['workbuddy','codex']){const entry=projected.clients.find(c=>c.id===id);assert.equal(entry.instances.length,2);assert.equal(entry.seat,null);}
  assert.equal(JSON.stringify(projected).includes(dataRoot),false);
  assert.ok(bindings.every(b=>!JSON.stringify(projected).includes(b.token)));
  await lobby.start({observer:true});
  for(let round=0;round<2;round++)for(const client of ownClients){
    if(!round){const options=await ok(client,'game_options',{type:'found',limit:1});assert.ok(options.actions.length);const {preview,...action}=options.actions[0];assert.equal((await ok(client,'game_act',{action,observation_token:options.observation_token})).status,'applied');}
    const observation=await ok(client,'game_observe',{section:'summary'});assert.equal((await ok(client,'game_end_turn',{force:true,observation_token:observation.observation_token})).status,'applied');
  }
  assert.equal(lobby.runtime.game.turn,3);
  pass('Four real SDK processes with repeated client brands and identical/different reported models found cities and alternate two complete rounds without routing by model name');
  const a=await ok(ownClients[0],'game_observe',{section:'summary'}),b=await ok(ownClients[1],'game_observe',{section:'summary'});
  const hash=lobby.runtime.gameplayHash();
  assert.equal((await call(ownClients[1],'game_end_turn',{force:true,observation_token:a.observation_ref})).value.code,'unknown_observation_reference');
  assert.equal((await call(ownClients[1],'game_end_turn',{force:true,observation_token:a.observation_token})).value.code,'stale_observation');
  assert.equal((await call(ownClients[0],'game_observe',{view:1})).value.code,'forbidden');
  assert.equal(lobby.runtime.gameplayHash(),hash);
  assert.notEqual(a.observation_ref,b.observation_ref);
  pass('Same-brand sessions cannot exchange short/full observation tokens, mutate the other seat or bypass fog');

  const configFile=path.join(replies[0].workspace,'.workbuddy','mcp.json'),mtime=(await stat(configFile)).mtimeMs;
  const again=await manager.bind(lobby,{harness:'workbuddy',seat:0,isolated:true});assert.equal(again.instance,replies[0].instance);assert.equal((await stat(configFile)).mtimeMs,mtime);
  await assert.rejects(manager.bind(lobby,{harness:'workbuddy',seat:1,instance:replies[0].instance}),e=>e.code==='harness_in_use');
  for(const bad of ['../outside','',42])await assert.rejects(manager.bind(lobby,{harness:'workbuddy',seat:0,instance:bad}),e=>e.code==='invalid_instance');
  await assert.rejects(manager.bind(lobby,{harness:'codex',seat:2,instance:replies[0].instance}),e=>e.code==='invalid_instance');
  const original=await readFile(configFile,'utf8');await writeFile(configFile,original+'\n');
  await assert.rejects(manager.bind(lobby,{harness:'workbuddy',seat:0,instance:replies[0].instance}),e=>e.code==='client_config_conflict');
  assert.equal(await readFile(configFile,'utf8'),original+'\n');await writeFile(configFile,original);
  pass('Repeated setup preserves workspace identity/mtime; active reassignment, traversal, wrong families and edited generated configs reject');

  const other=await fixture();lobby.runtime.game.players[0].alive=false;
  await manager.bind(other,{harness:'workbuddy',seat:0,instance:replies[0].instance});
  assert.equal((await ok(ownClients[0],'game_session')).match_id,other.runtime.id);
  assert.equal((await ok(ownClients[1],'game_session')).match_id,lobby.runtime.id);
  await other.start({observer:true,waitPolicy:'wait'});
  assert.equal((await call(ownClients[0],'game_end_turn',{force:true,observation_token:a.observation_token})).value.code,'stale_observation');
  await manager.unbind(lobby,{harness:'codex',instance:replies[2].instance,seat:2});
  assert.equal((await call(ownClients[2],'game_session')).error,true);assert.equal((await ok(ownClients[3],'game_session')).seat,3);
  await manager.releaseMatch(lobby.runtime.id);
  assert.equal((await call(ownClients[1],'game_session')).error,true);assert.equal((await call(ownClients[3],'game_session')).error,true);
  assert.equal((await ok(ownClients[0],'game_session')).match_id,other.runtime.id);
  pass('A single instance can change worlds without moving sibling sessions; selective unbind/world cleanup revoke only matching bindings and reject stale orders');

  for(const definition of HARNESS_CLIENTS.filter(c=>c.workspace)){
    const reply=await manager.bind(other,{harness:definition.id,seat:1,isolated:true});
    const client=await attach(reply,definition.id+' format check');assert.equal((await ok(client,'game_session')).seat,1);
  }
  pass('All twelve generated workspace formats launch the real game MCP transport, including Codex TOML, VS Code servers, OpenCode local and DSH patches');
  await writeFile(path.join(output,'checks.json'),JSON.stringify({passed:true,checks,catalogFamilies:40,workspaceFamilies:12,realSDKClients:clients.length,installedHarnessModelSessions:false,paidModelCalls:false,actualClientProfileWrites:false,productionSaveWrites:false},null,2)+'\n');
}finally{await Promise.all(clients.map(c=>c.close().catch(()=>{})));for(const lobby of lobbies)lobby.dispose();}
