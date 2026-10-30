// Isolated configurations, no installed harness profiles or paid models.
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, writeFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {HarnessConnections} from '../src/environment/harnesses.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';

const out=path.resolve('output/harness-expansion-20261029');
await mkdir(path.join(out,'private'),{recursive:true});
const home=await mkdtemp(path.join(out,'private','home-')), dataRoot=path.join(home,'.civbench','connections');
const files={
  'claude-code':path.join(home,'.claude.json'),
  'kimi-code':path.join(home,'.kimi-code','mcp.json'),
  zcode:path.join(home,'.zcode','cli','config.json'),
  'deepseek-harness':path.join(dataRoot,'deepseek-harness.patch.json')
};
const unrelated={command:'unrelated-tool',args:['keep'],env:{TEST_MARKER:'preserve-other-settings'}};
for(const [id,file] of Object.entries(files)){
  if(id==='deepseek-harness'){await mkdir(path.join(home,'.dsh','profiles'),{recursive:true});continue;}
  await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,JSON.stringify(id==='zcode'?{theme:'existing',mcp:{policy:'keep',servers:{other:unrelated}}}:{preference:'keep',mcpServers:{other:unrelated}}));
}
const manager=new HarnessConnections({home,dataRoot,env:{},discoverExecutables:async()=>({})});
const lobby=new Lobby({stub:true,harnesses:manager});
const host=await listen(null,{port:0,lobby});lobby.server=host.server;lobby.url=host.url;
const require=createRequire(path.resolve('environment/mcp/package.json'));
const {Client}=require('@modelcontextprotocol/sdk/client/index.js');
const {StdioClientTransport}=require('@modelcontextprotocol/sdk/client/stdio.js');
const clients=[],checks=[],pass=label=>{checks.push(label);console.log('PASS '+label);};
const read=async file=>JSON.parse(await readFile(file,'utf8'));
function entry(id,config){return id==='zcode'?config.mcp.servers.civbench_game:id==='deepseek-harness'?config[0].insert[0].config:config.mcpServers.civbench_game;}
async function tool(client,name,args={}){const response=await client.callTool({name,arguments:args});const value=JSON.parse(response.content[0].text);assert.ok(!response.isError,JSON.stringify(value));return value;}
try{
  let scan=await manager.scan(lobby);
  assert.deepEqual(scan.clients.map(c=>c.id),Object.keys(files));
  assert.ok(scan.clients.every(c=>!c.configured&&!c.canOpen&&!c.running));
  assert.equal(JSON.stringify(scan).includes(home),false);
  pass('Four new profiles are discovered before a world exists without leaking paths or pretending CLI sessions are GUI launches');
  await lobby.prepare({players:4,size:'small',seed:'HARNESS-EXPANSION',barbarians:false,seats:Object.keys(files).map((id,seat)=>({seat,kind:'agent',displayName:id}))});
  const originals=Object.fromEntries(await Promise.all(Object.entries(files).filter(([id])=>id!=='deepseek-harness').map(async([id,file])=>[id,await readFile(file,'utf8')])));
  for(const [seat,id] of Object.keys(files).entries()){
    const reply=await manager.bind(lobby,{harness:id,seat});
    assert.equal(reply.configured,true);assert.equal(reply.connected,false);
    const config=await read(files[id]),server=entry(id,config);
    assert.equal(server.env.CIV_MATCH_TOKEN,undefined);assert.ok(server.env.CIV_BINDING_FILE);
    assert.equal(JSON.stringify(reply).includes(lobby.runtime.seatTokens.get(seat)),false);
    if(id==='claude-code'){assert.equal(server.type,'stdio');assert.deepEqual(config.mcpServers.other,unrelated);assert.equal(config.preference,'keep');}
    if(id==='kimi-code'){assert.deepEqual(config.mcpServers.other,unrelated);assert.equal(config.preference,'keep');}
    if(id==='zcode'){assert.deepEqual(config.mcp.servers.other,unrelated);assert.equal(config.mcp.policy,'keep');assert.equal(config.theme,'existing');assert.equal(config.mcpServers,undefined);}
    if(id==='deepseek-harness'){
      assert.equal(server.transport,'stdio');assert.equal(server.serverName,'civbench_game');
      assert.deepEqual(await readdir(path.join(home,'.dsh','profiles')),[],'DSH profiles must not be modified');
      assert.match(reply.message,/--patch/);
    }
    const transportConfig={command:server.command,args:server.args,env:server.env,stderr:'pipe'};
    const client=new Client({name:id+' isolated check',version:'1'});clients.push(client);
    await client.connect(new StdioClientTransport(transportConfig));
    const session=await tool(client,'game_session');assert.equal(session.seat,seat);
    const binding=await read(server.env.CIV_BINDING_FILE);assert.equal(binding.token,lobby.runtime.seatTokens.get(seat));
    assert.notEqual(binding.token,lobby.runtime.hostToken);assert.notEqual(binding.token,lobby.runtime.observerToken);
    const denied=await client.callTool({name:'game_observe',arguments:{view:(seat+1)%4}});
    assert.equal(JSON.parse(denied.content[0].text).code,'forbidden');
  }
  const backups=(await readdir(dataRoot)).filter(f=>f.endsWith('.backup.json'));
  const savedBackups=await Promise.all(backups.map(f=>readFile(path.join(dataRoot,f),'utf8')));
  for(const original of Object.values(originals))assert.ok(savedBackups.includes(original));
  pass('Claude/Kimi flat JSON, ZCode nested JSON and isolated DSH patch retain settings, exact backups and seat-only bindings');
  await lobby.start({observer:true});
  for(let round=0;round<2;round++)for(const client of clients){
    if(!round){const options=await tool(client,'game_options',{type:'found',limit:1});assert.ok(options.actions.length);const {preview,...action}=options.actions[0];assert.equal((await tool(client,'game_act',{action,observation_token:options.observation_token})).status,'applied');}
    const observation=await tool(client,'game_observe',{section:'summary'});
    assert.equal((await tool(client,'game_end_turn',{force:true,observation_token:observation.observation_token})).status,'applied');
  }
  assert.equal(lobby.runtime.game.turn,3);
  scan=await manager.scan(lobby);assert.ok(scan.clients.every(c=>c.configured&&Number.isInteger(c.seat)));
  pass('Four real SDK subprocesses use emitted configurations to found cities and alternate two complete rounds with fog enforced');
  await assert.rejects(manager.bind(lobby,{harness:'claude-code',seat:1}),e=>e.code==='harness_in_use');
  for(const id of ['claude-code','kimi-code','deepseek-harness'])await assert.rejects(manager.open({harness:id}),e=>e.code==='client_terminal_required');
  await manager.unbind(lobby,{harness:'deepseek-harness'});
  assert.equal((await clients[3].callTool({name:'game_session',arguments:{}})).isError,true);
  assert.equal((await tool(clients[0],'game_session')).seat,0);
  pass('Expanded adapters preserve exclusive seats, reject implicit terminal launches and revoke only the selected binding');

  const fallbackHome=await mkdtemp(path.join(out,'private','fallback-'));
  const fallbackFile=path.join(fallbackHome,'.agents','mcp.json'),nativeFile=path.join(fallbackHome,'.zcode','cli','config.json');
  await mkdir(path.dirname(fallbackFile),{recursive:true});await mkdir(path.dirname(nativeFile),{recursive:true});
  const fallbackBytes=JSON.stringify({mcpServers:{other:unrelated}});
  await writeFile(fallbackFile,fallbackBytes);await writeFile(nativeFile,JSON.stringify({mcp:{policy:'keep'}}));
  const fallback=new HarnessConnections({home:fallbackHome,env:{},discoverExecutables:async()=>({})});
  await fallback.bind(lobby,{harness:'zcode',seat:0});
  assert.deepEqual((await read(nativeFile)).mcp.servers.other,unrelated);
  assert.equal((await read(nativeFile)).mcp.policy,'keep');assert.equal(await readFile(fallbackFile,'utf8'),fallbackBytes);
  pass('Creating native ZCode settings preserves effective .agents fallback servers instead of silently disabling them');
  for(const [id,bad]of [['claude-code','{ invalid'],['kimi-code','{"mcpServers":[]}'],['zcode','{"mcp":null}'],['deepseek-harness','[{"insert":[]}]']]){
    const current=await readFile(files[id],'utf8');await writeFile(files[id],bad);
    await assert.rejects(manager.bind(lobby,{harness:id,seat:Object.keys(files).indexOf(id)}),e=>['client_config_invalid','client_config_conflict'].includes(e.code));
    assert.equal(await readFile(files[id],'utf8'),bad);await writeFile(files[id],current);
  }
  pass('Malformed/nonnative client structures and conflicting DSH patches reject without overwriting bytes');
  const customHome=await mkdtemp(path.join(out,'private','custom-'));
  const customRoots={CLAUDE_CONFIG_DIR:path.join(customHome,'claude-data'),KIMI_CODE_HOME:path.join(customHome,'kimi-data'),DSH_HOME:path.join(customHome,'dsh-data')};
  for(const value of Object.values(customRoots))await mkdir(value,{recursive:true});
  const custom=new HarnessConnections({home:customHome,env:customRoots,discoverExecutables:async()=>({})});
  assert.deepEqual((await custom.scan(lobby)).clients.map(c=>c.id),['claude-code','kimi-code','deepseek-harness']);
  await custom.bind(lobby,{harness:'claude-code',seat:0});await custom.bind(lobby,{harness:'kimi-code',seat:1});
  assert.ok((await read(path.join(customRoots.CLAUDE_CONFIG_DIR,'.claude.json'))).mcpServers.civbench_game);
  assert.ok((await read(path.join(customRoots.KIMI_CODE_HOME,'mcp.json'))).mcpServers.civbench_game);
  const bin=path.join(customHome,'bin');await mkdir(bin);await writeFile(path.join(bin,'kimi.exe'),'discovery fixture only');
  const cliOnly=new HarnessConnections({home:path.join(customHome,'empty-home'),env:{PATH:bin},discoverExecutables:async()=>({})});
  assert.deepEqual((await cliOnly.scan(lobby)).clients.map(c=>c.id),['kimi-code']);
  pass('Documented custom data roots and PATH-only CLI installations are discovered without consulting real profiles');
  await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,realSDKClients:4,installedHarnessModelSessions:false,paidModelCalls:false,productionProfileWrites:false,productionSaveWrites:false},null,2)+'\n');
}finally{await Promise.all(clients.map(c=>c.close().catch(()=>{})));lobby.dispose();}
