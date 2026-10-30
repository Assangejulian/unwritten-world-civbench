// Actual model-HTTP -> tool loop -> stdio MCP -> authoritative engine checks. No paid model or production world.
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {CIVS} from '../src/rules.mjs';
import {serialize} from '../src/engine.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {AgentLauncher} from '../src/environment/agent-launcher.mjs';
import {normalizeModelApi,checkModelApi,ModelConversation} from '../src/environment/model-api.mjs';

const output=path.resolve(process.env.UI_CHECK_OUTPUT||'output/playwright/model-api-20261020'),checks=[],requests=[];
await mkdir(output,{recursive:true});
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const wait=async(test,label,timeout=90000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await test())return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Timeout: '+label);};
const toolList=body=>body.tools.map(tool=>tool.function?.name||tool.name);
let hold=false,holdTurn=0;
const provider=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString()),names=toolList(body),responses=req.url.endsWith('/responses');
  requests.push({body,authorization:req.headers.authorization,route:req.url});
  const send=value=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  const answer=(name,args,text='')=>{
    const id='call_'+requests.length;
    if(responses)send({status:'completed',output:[{type:'reasoning',id:'reason_'+requests.length,encrypted_content:'opaque-reasoning'},...(name?[{type:'function_call',call_id:id,name,arguments:JSON.stringify(args)}]:[{type:'message',role:'assistant',content:[{type:'output_text',text}]}])],usage:{input_tokens:12,output_tokens:8}});
    else send({choices:[{message:{role:'assistant',content:name?null:text,reasoning_content:'reasoning-must-roundtrip',...(name?{tool_calls:[{id,type:'function',function:{name,arguments:JSON.stringify(args)}}]}:{})}}],usage:{prompt_tokens:12,completion_tokens:8}});
  };
  if(body.model==='unauthorized'){res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'reflected '+req.headers.authorization}));return;}
  if(body.model==='no-tools'){answer(null,null,'I will play soon.');return;}
  if(names.includes('connection_ready')){answer('connection_ready',{});return;}
  const history=responses?body.input:body.messages.filter(message=>message.role!=='system');
  const first=history.find(message=>message.role==='user');
  const context=JSON.parse(first.content);
  assert(body.model.endsWith(String(context.session.seat)), 'Each model uses only its assigned seat');
  if(hold&&context.session.turn>=holdTurn){await new Promise(resolve=>{const timer=setTimeout(resolve,30000);req.on('close',()=>{clearTimeout(timer);resolve();});res.on('close',()=>{clearTimeout(timer);resolve();});});if(res.destroyed)return;}
  const calls=responses?history.filter(item=>item.type==='function_call').map(item=>({name:item.name,args:JSON.parse(item.arguments)})):history.filter(item=>item.role==='assistant').flatMap(item=>(item.tool_calls||[]).map(call=>({name:call.function.name,args:JSON.parse(call.function.arguments)})));
  const results=responses?history.filter(item=>item.type==='function_call_output').map(item=>JSON.parse(item.output)):history.filter(item=>item.role==='tool').map(item=>JSON.parse(item.content));
  if(calls.length){if(responses)assert(history.some(item=>item.type==='reasoning'&&item.encrypted_content));else assert(history.some(item=>item.role==='assistant'&&item.reasoning_content));}
  const latest=calls.at(-1),result=results.at(-1)?.result;
  const next=type=>type==='found'?'research':type==='research'?'civic':null;
  const options=type=>answer('game_options',{type,limit:10});
  const end=()=>answer('game_end_turn',{force:true,...(result?.next_observation_token?{observation_token:result.next_observation_token}:{})});
  if(!latest){answer('game_act',{action:{type:'move',unit:-98765,tile:0},observation_token:context.observation_token});return;}
  if(latest.name==='game_options'){
    if(result?.actions?.length){const {preview,...action}=result.actions[0];answer('game_act',{action,observation_token:result.observation_token});return;}
    const type=next(latest.args.type);if(type)options(type);else end();return;
  }
  if(latest.name==='game_act'){
    assert.equal(results.at(-1).isError,false,JSON.stringify(result));
    if(latest.args.action.unit===-98765){assert.equal(result.status,'rejected');options('found');return;}
    const type=next(latest.args.action.type);if(type)options(type);else end();return;
  }
  end();
});
await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
const baseUrl='http://127.0.0.1:'+provider.address().port+'/v1';
const config=(model,protocol='chat-completions',apiKey='SYNTHETIC_API_KEY')=>({baseUrl,model,protocol,apiKey,maxOutputTokens:512,timeoutSeconds:10});
const lobbies=[];
try{
  for(const input of [{baseUrl:'file:///tmp/key',model:'x'},{baseUrl:'http://example.com/v1',model:'x',apiKey:'x'},{baseUrl:baseUrl+'?key=bad',model:'x'},{baseUrl,model:'bad\nmodel'},{baseUrl,model:'x',apiKey:'bad\nkey'}])assert.throws(()=>normalizeModelApi(input));
  assert.equal(normalizeModelApi(config('x')).endpoint,baseUrl+'/chat/completions');
  assert.equal(normalizeModelApi(config('x','responses')).endpoint,baseUrl+'/responses');
  for(const protocol of ['chat-completions','responses'])assert.equal((await checkModelApi(config('check',protocol))).ok,true);
  await checkModelApi({...config('check'),maxOutputTokens:2048});
  assert.equal(requests.at(-1).body.max_tokens,2048,'Connection checks must honor raised reasoning/output limits');
  await assert.rejects(()=>checkModelApi(config('unauthorized')),error=>error.code==='api_http_401'&&!error.message.includes('SYNTHETIC_API_KEY'));
  await assert.rejects(()=>checkModelApi(config('no-tools')),error=>error.code==='api_tools_required');
  const invalid=new ModelConversation(normalizeModelApi(config('check')),[], 'test','test');
  await assert.rejects(()=>invalid.complete({fetcher:async()=>new Response('not json')}),error=>error.code==='api_invalid_json');
  pass('Configuration, HTTPS/local transport, tool checks, both protocols and redacted provider failures');

  const launcher=new AgentLauncher({outputRoot:path.join(output,'multi-clients')});
  const lobby=new Lobby({launcher});lobbies.push(lobby);
  await lobby.prepare({players:3,size:'small',seed:'API-MULTI',barbarians:false,drivers:CIVS.slice(0,3).map(civ=>civ.file),seats:[{seat:0,kind:'agent',displayName:'Chat Model'},{seat:1,kind:'agent',displayName:'Responses Model'},{seat:2,kind:'native'}]});
  const natives=[],execute=lobby.pool.execute.bind(lobby.pool);lobby.pool.execute=async(player,...args)=>{natives.push(player.id);return execute(player,...args);};
  requests.length=0;
  await launcher.start(lobby,{seat:0,rounds:3,provider:'api',api:config('seat0','chat-completions','SYNTHETIC_KEY_A')});
  const publicProfile=launcher.apiProfile(lobby,0);assert.equal(publicProfile.hasKey,true);assert(!JSON.stringify(publicProfile).includes('SYNTHETIC_KEY'));
  const originalRun=launcher.status(0).id;
  await assert.rejects(()=>launcher.updateApi(lobby,{seat:0,api:{...config('seat0'),baseUrl:'file:///bad'}}),error=>error.code==='invalid_api');
  assert.equal(launcher.status(0).id,originalRun);
  await assert.rejects(()=>launcher.start(lobby,{seat:0,rounds:3,provider:'api',api:{...config('seat0','chat-completions','SYNTHETIC_KEY_A'),maxOutputTokens:1024}}),error=>error.code==='client_running');
  await launcher.start(lobby,{seat:1,rounds:3,provider:'api',api:config('seat1','responses','SYNTHETIC_KEY_B')});
  await wait(()=>lobby.status().externalConnected===2,'both MCP clients ready');
  assert.equal(requests.length,0,'Waiting in the lobby must not make paid model requests');
  assert(!JSON.stringify(lobby.status()).includes('SYNTHETIC_KEY'));
  await lobby.start({observer:true});
  await wait(()=>[0,1].every(seat=>launcher.status(seat)?.state==='completed'),'both API goals');
  for(const seat of [0,1]){
    assert.equal(lobby.runtime.managedPlayProgress(seat).completed,3);
    assert(lobby.runtime.commands.some(command=>command.seat===seat&&command.status==='applied'&&command.action?.type==='found'));
    assert(lobby.runtime.game.cities.some(city=>city.owner===seat));
    assert(launcher.status(seat).requests>0);assert(launcher.status(seat).inputTokens>0);
    const rejected=launcher.trace(lobby,seat).entries.filter(entry=>entry.type==='tool'&&entry.text.includes('-98765'));
    assert(rejected.length>0&&rejected.every(entry=>entry.ok===false),'Rejected gameplay orders must appear as failures despite MCP transport success');
  }
  assert(natives.length>=3&&natives.every(seat=>seat===2));
  const secrets=[...lobby.runtime.seatTokens.values(),lobby.runtime.observerToken,lobby.runtime.hostToken,lobby.hostCapability,'SYNTHETIC_KEY_A','SYNTHETIC_KEY_B'];
  for(const request of requests){const encoded=JSON.stringify(request.body);for(const secret of secrets)assert(!encoded.includes(secret),'Model payload must never contain a credential');assert.equal(request.authorization,request.body.model==='seat0'?'Bearer SYNTHETIC_KEY_A':'Bearer SYNTHETIC_KEY_B');}
  assert(!serialize(lobby.runtime.game).includes('SYNTHETIC_KEY'));
  assert.throws(()=>launcher.resume(lobby,0),error=>error.code==='managed_complete');
  pass('Two real stdio MCP API players execute found/research/civic/three turns against a real C++ seat; goals and credentials stay separate');

  const pauseLauncher=new AgentLauncher({outputRoot:path.join(output,'resume-clients')});
  const pauseLobby=new Lobby({stub:true,launcher:pauseLauncher});lobbies.push(pauseLobby);
  await pauseLobby.prepare({players:2,size:'small',seed:'API-RESUME',barbarians:false,seats:[{seat:0,kind:'agent',displayName:'Resume Model'},{seat:1,kind:'native'}]});
  hold=true;holdTurn=2;
  await pauseLauncher.start(pauseLobby,{seat:0,rounds:3,provider:'api',api:config('seat0')});
  await wait(()=>pauseLobby.status().externalConnected===1,'resume client ready');await pauseLobby.start({observer:true});
  await wait(()=>pauseLobby.runtime.managedPlayProgress(0).completed===1,'first completed turn');
  pauseLauncher.stop(0);assert.equal(pauseLauncher.status(0).state,'stopped');assert.equal(pauseLobby.runtime.managedPlayProgress(0).completed,1);
  await pauseLauncher.resume(pauseLobby,0);
  await wait(()=>pauseLauncher.status(0).requests>=1,'resumed client is waiting on its next model call');
  const beforeEdit=pauseLobby.runtime.managedPlayProgress(0).completed;
  await pauseLauncher.updateApi(pauseLobby,{seat:0,api:{...config('seat0'),apiKey:'SYNTHETIC_UPDATED_KEY',maxOutputTokens:768},keepExistingKey:false});
  hold=false;
  await wait(()=>pauseLauncher.status(0).state==='completed','resumed remaining turns');
  assert.equal(beforeEdit,1);assert(requests.some(request=>request.authorization==='Bearer SYNTHETIC_UPDATED_KEY'));
  assert.equal(pauseLobby.runtime.managedPlayProgress(0).completed,3);
  pass('Stop/resume and live key/limit edits close the previous worker and preserve completed turns; public profiles never return keys');

  const failingLauncher=new AgentLauncher({outputRoot:path.join(output,'failed-clients')});
  const failing=new Lobby({stub:true,launcher:failingLauncher});lobbies.push(failing);
  await failing.prepare({players:2,size:'small',seed:'API-NO-TOOLS',barbarians:false,seats:[{seat:0,kind:'agent',displayName:'Failure Model'},{seat:1,kind:'native'}]});
  await failingLauncher.start(failing,{seat:0,rounds:2,provider:'api',api:config('no-tools')});await wait(()=>failing.status().externalConnected===1,'failing client ready');await failing.start({observer:true});
  await wait(()=>!!failingLauncher.status(0).error,'no tools warning');assert.equal(failingLauncher.status(0).state,'running');
  assert.equal(failing.runtime.managedPlayProgress(0).completed,0);assert.equal(failing.runtime.game.turn,1);assert.match(failingLauncher.status(0).error,/工具/);
  failingLauncher.stop(0);pass('A chat-only response warns and waits without inventing turns or terminating the match');

  const defeatLauncher=new AgentLauncher({outputRoot:path.join(output,'eliminated-clients')});
  const defeatLobby=new Lobby({stub:true,launcher:defeatLauncher});lobbies.push(defeatLobby);
  await defeatLobby.prepare({players:2,size:'small',seed:'API-ELIMINATED',barbarians:false,seats:[{seat:0,kind:'agent',displayName:'Defeated Model'},{seat:1,kind:'agent',displayName:'Survivor'}]});
  const beforeDefeatRequests=requests.length;
  await defeatLauncher.start(defeatLobby,{seat:0,rounds:200,provider:'api',api:config('seat0')});
  await wait(()=>defeatLobby.status().externalConnected===1,'defeat client ready');
  await defeatLobby.runtime.read(()=>{
    defeatLobby.runtime.game.players[0].alive=false;
    defeatLobby.runtime.game.units=defeatLobby.runtime.game.units.filter(unit=>unit.owner!==0);
    defeatLobby.runtime.started=true;
  });
  await wait(()=>defeatLauncher.status(0).state==='ended','eliminated API player exits');
  assert.equal(defeatLauncher.status(0).error,null);
  assert.equal(defeatLobby.runtime.game.winner,null);
  assert.equal(requests.length,beforeDefeatRequests,'Elimination must not trigger further paid model requests');
  // The launcher's timer must agree with worker exit even if it observes defeat first.
  const timerRun=defeatLauncher.runs.get(0),oldFinish=defeatLauncher.finish;
  let timerFinish;
  defeatLauncher.finish=(run,state,error=null)=>{timerFinish={state,error};};
  try {defeatLauncher.tick({...timerRun,state:'running'});} finally {defeatLauncher.finish=oldFinish;}
  assert.deepEqual(timerFinish,{state:'ended',error:null});
  pass('A defeated API civilization exits cleanly while the world continues, without provider calls or a connection warning');

  async function scan(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())await scan(file);else if(/\.(json|jsonl|toml|txt|log)$/.test(file)){const text=await readFile(file,'utf8');for(const key of ['SYNTHETIC_KEY_A','SYNTHETIC_KEY_B','SYNTHETIC_API_KEY','SYNTHETIC_UPDATED_KEY'])assert(!text.includes(key),file+' contains an API key');}}}
  for(const directory of ['multi-clients','resume-clients','failed-clients','eliminated-clients'])await scan(path.join(output,directory));
  pass('Generated worker activity/status/configuration contain no model API credentials');
  await writeFile(path.join(output,'engine-checks.json'),JSON.stringify({passed:true,checks,nativeCalls:natives.length,modelRequests:requests.length},null,2));
}finally{
  for(const lobby of lobbies)lobby.dispose();
  provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));
}
