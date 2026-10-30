import auditBrowserRuntime from './browser-runtime.cjs';
// Disposable native game hosts and deterministic local providers; no paid API or production saves.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {ModelConversation, normalizeModelApi} from '../src/environment/model-api.mjs';
import {AgentLauncher} from '../src/environment/agent-launcher.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {listen} from '../src/environment/http.mjs';
import * as E from '../src/engine.mjs';
import {field} from './imperial-fixture.mjs';

const output=path.resolve(process.env.UI_CHECK_OUTPUT||'output/playwright/model-observer-20261021'), checks=[];
await mkdir(output,{recursive:true});
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const wait=async(test,label,timeout=60000)=>{const end=Date.now()+timeout;while(Date.now()<end){if(await test())return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Timeout: '+label);};
const config=protocol=>normalizeModelApi({baseUrl:'http://localhost:12345/v1',model:'test',protocol,contextTokens:4096,compressionTokens:2000});
for(const protocol of ['chat-completions','responses']) {
  const conversation=new ModelConversation(config(protocol),[],'test',JSON.stringify({session:{seat:0},summary:{observation_token:'latest-authority'},objective:'Keep the capital safe'}));
  for(let i=0;i<30;i++){
    const call={id:'call_'+i,name:'game_act',arguments:JSON.stringify({action:{type:'hold',unit:i}})};
    if(protocol==='responses')conversation.messages.push({type:'reasoning',id:'reason_'+i,encrypted_content:'PRIVATE-ENCRYPTED'},{type:'function_call',call_id:call.id,name:call.name,arguments:call.arguments});
    else conversation.messages.push({role:'assistant',content:'Public strategy '+i,reasoning_content:'PRIVATE-RAW',tool_calls:[{id:call.id,type:'function',function:{name:call.name,arguments:call.arguments}}]});
    conversation.result(call,{result:{applied:true,next_observation_token:'receipt-'+i,large:'x'.repeat(1000)}});
  }
  const before=JSON.stringify(conversation.messages).length, result=conversation.compact();
  assert(result&&JSON.stringify(conversation.messages).length<before/2);
  const first=JSON.parse(conversation.messages[0].content);
  assert.equal(first.objective,'Keep the capital safe');assert.equal(first.session.seat,0);
  assert(!JSON.stringify(first.contextMemory).includes('PRIVATE-'));
  const calls=new Set();
  for(const message of conversation.messages){for(const tool of message.tool_calls||[])calls.add(tool.id);if(message.type==='function_call')calls.add(message.call_id);if(message.role==='tool')assert(calls.has(message.tool_call_id));if(message.type==='function_call_output')assert(calls.has(message.call_id));}
  let payload;await conversation.complete({fetcher:async(url,options)=>{payload=JSON.parse(options.body);return Response.json(protocol==='responses'?{status:'completed',output:[]}:{choices:[{message:{role:'assistant',content:'ready'}}]});}});
  assert(!('max_tokens' in payload)&&!('max_output_tokens' in payload)&&!('max_completion_tokens' in payload));
}
pass('Both protocols compact completed exchanges without orphaned tool results, exposing encrypted reasoning or adding output token limits');

const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
let fault=true, stage=0;const received=[];
const provider=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks).toString());received.push(body);
  const responses=req.url.endsWith('/responses'), context=JSON.parse((responses?body.input:body.messages).find(item=>item.role==='user').content);
  if(body.model==='Alpha'&&(fault||stage<2)){
    if(fault){res.writeHead(503);res.end('{}');return;}
    if(stage++===0){res.writeHead(400);res.end(JSON.stringify({error:{code:'context_length_exceeded'}}));return;}
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({choices:[{finish_reason:'length',message:{role:'assistant',content:'unfinished',tool_calls:[{id:'partial',type:'function',function:{name:'game_end_turn',arguments:'{'}}]}}]}));return;
  }
  await new Promise(resolve=>setTimeout(resolve,150));if(res.destroyed)return;
  const id='call_'+received.length,args=JSON.stringify({force:true,observation_token:context.observation_token});
  const text=body.model+' public plan <script>bad()</script> '+(body.model==='Alpha'?'SYNTHETIC_SECRET_A':'BETA_ONLY');
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(responses?{status:'completed',output:[{type:'reasoning',id:'r_'+id,encrypted_content:'DO_NOT_DISPLAY_ENCRYPTED',summary:[{type:'summary_text',text:'Beta provider reasoning summary'}]},{type:'message',role:'assistant',content:[{type:'output_text',text}]},{type:'function_call',call_id:id,name:'game_end_turn',arguments:args}]}:{choices:[{finish_reason:'tool_calls',message:{role:'assistant',content:text,reasoning_content:'Alpha provider reasoning text',tool_calls:[{id,type:'function',function:{name:'game_end_turn',arguments:args}}]}}]}));
});
await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
const launcher=new AgentLauncher({outputRoot:path.join(output,'clients')}),lobby=new Lobby({stub:true,launcher});
let host, runtime, movementHost, proxy, interruptedCommands=0, lostReceiptKey;const attemptedKeys=[];
try {
  if(!process.argv.includes('--movement-only')) {
  host=await listen(null,{port:0,lobby});lobby.server=host.server;lobby.url=host.url;
  // Lose a receipt after the authoritative host applied it. A retry must use
  // exactly the same request key, never apply a second end-turn command.
  proxy=http.createServer(async(req,res)=>{
    try {
      const chunks=[];for await(const chunk of req)chunks.push(chunk);const payload=Buffer.concat(chunks);
      if(req.url==='/v1/end-turn')attemptedKeys.push(JSON.parse(payload.toString()).request_id);
      const response=await fetch(host.url+req.url,{method:req.method,headers:{Authorization:req.headers.authorization||'',...(payload.length?{'Content-Type':'application/json'}:{})},...(payload.length?{body:payload}:{})});
      const text=await response.text();
      if(req.url==='/v1/end-turn'&&response.ok&&!interruptedCommands++){lostReceiptKey=JSON.parse(payload.toString()).request_id;res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'unreachable'}));return;}
      res.writeHead(response.status,{'Content-Type':'application/json'});res.end(text);
    } catch {res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'unreachable'}));}
  });
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
  const copy=lobby.copy.bind(lobby);lobby.copy=seat=>{const card=copy(seat);card.env.CIV_MATCH_URL='http://127.0.0.1:'+proxy.address().port;return card;};
  await lobby.prepare({players:2,size:'small',seed:'MODEL-OBSERVATION',barbarians:false,seats:[{seat:0,kind:'agent',displayName:'Alpha'},{seat:1,kind:'agent',displayName:'Beta'}]});
  for(const seat of [0,1])await launcher.start(lobby,{seat,rounds:null,provider:'api',api:{baseUrl:'http://127.0.0.1:'+provider.address().port+'/v1',model:seat?'Beta':'Alpha',protocol:seat?'responses':'chat-completions',apiKey:seat?'SYNTHETIC_SECRET_B':'SYNTHETIC_SECRET_A',timeoutSeconds:10}});
  await wait(()=>lobby.status().externalConnected===2,'both MCP clients');await lobby.start({observer:true});
  await wait(()=>!!launcher.status(0).error,'visible transient fault');
  assert.equal(launcher.status(0).state,'running');
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(token=>{sessionStorage.setItem('hex-civ-host',token);localStorage.setItem('hex.audio.music','0');},lobby.hostCapability);
  await page.goto(host.url+'/?access='+lobby.runtime.observerToken,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
  // Park only this disposable software-rendered map while checking observer controls.
  await page.evaluate(()=>{window.__civ.renderer.menuOpen=true;});
  assert.equal(await page.locator('#managed-play-status').count(),0);
  assert.equal(await page.locator('#model-observer-panel').isHidden(),true);
  await page.locator('[data-b4-leader="0"] .b4-model-error').waitFor();
  await page.locator('[data-b4-leader="0"] .b4-model-error').click();
  await page.locator('#model-observer-panel').waitFor();
  assert.equal(await page.locator('#model-observer-civ').inputValue(),'0');
  assert.match(await page.locator('#model-observer-health').innerText(),/503/);
  assert.match(await page.locator('#model-observer-panel').evaluate(el=>getComputedStyle(el).backgroundColor),/rgba\(40, 44, 45, 0\.82\)/);
  await page.screenshot({path:path.join(output,'connection-error.png')});
  fault=false;
  await wait(()=>lobby.runtime.managedPlayProgress(0).completed>=3&&lobby.runtime.managedPlayProgress(1).completed>=3,'automatic recovery through HTTP/context/truncation',180000);
  for(const seat of [0,1]){await page.locator('#model-observer-civ').selectOption(String(seat));await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-stop="'+seat+'"]').click();}
  await page.waitForFunction(()=>!document.querySelector('[data-b4-leader="0"] .b4-model-error'));
  assert.equal(launcher.status(0).error,null);assert.equal(launcher.status(0).state,'stopped');
  assert(received.every(body=>!('max_tokens' in body)&&!('max_output_tokens' in body)));
  assert(!lobby.runtime.commands.some(command=>command.requestId==='partial'));
  assert(interruptedCommands>0);assert(attemptedKeys.filter(key=>key===lostReceiptKey).length>=2);
  assert.equal(lobby.runtime.commands.filter(command=>command.requestId===lostReceiptKey).length,1);
  await page.locator('#model-observer-civ').selectOption('0');
  await page.waitForFunction(()=>document.getElementById('model-observer-entries')?.textContent.includes('Alpha public plan'));
  assert(!(await page.locator('#model-observer-entries').innerText()).includes('SYNTHETIC_SECRET'));
  assert(!(await page.locator('#model-observer-entries').innerText()).includes('BETA_ONLY'));
  assert.equal(await page.locator('#model-observer-entries script').count(),0);
  await page.locator('#model-observer-mode').selectOption('reasoning');await page.waitForFunction(()=>document.getElementById('model-observer-entries')?.textContent.includes('Alpha provider reasoning text'));
  await page.locator('#model-observer-civ').selectOption('1');await page.waitForFunction(()=>document.getElementById('model-observer-entries')?.textContent.includes('Beta provider reasoning summary'));
  assert(!(await page.locator('#model-observer-entries').innerText()).includes('DO_NOT_DISPLAY_ENCRYPTED'));
  await page.screenshot({path:path.join(output,'transparent-reasoning.png')});
  await page.locator('#model-observer-close').click();assert(await page.locator('#model-observer-panel').isHidden());
  await page.locator('#model-observer-toggle').click();await page.keyboard.press('Escape');assert(await page.locator('#model-observer-panel').isHidden());
  const request=async(token)=>fetch(host.url+'/api/lobby/agent/trace',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({seat:0})});
  for(const token of ['',lobby.runtime.seatTokens.get(0),lobby.runtime.observerToken])assert.equal((await request(token)).status,401);
  assert.equal((await request(lobby.hostCapability)).status,200);
  await page.setViewportSize({width:390,height:844});await page.locator('#model-observer-toggle').click();
  const bounds=await page.locator('#model-observer-panel').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=391);
  await page.screenshot({path:path.join(output,'observer-390.png')});
  assert.deepEqual(errors,[]);await context.close();
  pass('Actual Chat/Responses workers recover from HTTP 503, context overflow, truncated calls and a lost MCP command receipt without output caps or duplicated state changes');
  pass('Model picker, translucent content selector, escaped/redacted records, close/Escape, per-civilization fault badges and host-only authorization work in a real browser at 1440/390px');

  }
  const {g,p,tile}=field(),unit=E.addUnit(g,p.id,'warrior',tile(10,10).id);E.refreshVisibility(g);
  for(const player of g.players)assignController(player,player.id===0?'human':'inactive');
  runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
  await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});movementHost=await listen(runtime,{port:0});
  const movement=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),view=await movement.newPage();
  await movement.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
  await view.goto(movementHost.url+'/?access='+token,{waitUntil:'domcontentloaded'});await view.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
  await view.evaluate(()=>{window.__civ.renderer.menuOpen=true;});
  await view.evaluate(id=>{window.__civ.selectTile(window.__civ.game.map.tiles[id]);},tile(4,4).id);
  await view.locator('#inspector>.selection-close').click();assert.equal(await view.locator('#inspector').getAttribute('aria-hidden'),'true');
  await view.evaluate(id=>window.__civ.selectTile(window.__civ.game.map.tiles[id]),tile(10,10).id);await view.locator('#inspector>.selection-close').click();assert.equal(await view.locator('#inspector').getAttribute('aria-hidden'),'true');
  const evidence=await view.evaluate(async({id,to})=>{
    const c=window.__civ,r=c.renderer;await c.refresh(true);r.menuOpen=false;r.focus(to);await new Promise(resolve=>{const settled=()=>!r.targetCam?resolve():requestAnimationFrame(settled);settled();});r.menuOpen=true;
    const state=structuredClone(c.game),u=state.units.find(item=>item.id===id);u.tile=to;r.reduced=false;r.setState(state);r.selected={type:'unit',id,tile:to};
    const journey=r.unitJourneys.get(id);if(!journey)throw Error('Missing animated journey');Object.defineProperty(r,'actionTime',{value:r.actionTime,configurable:true});journey.started=r.actionTime-journey.duration*.45;
    const pose=r.unitPose(u),position=r.projectGround(pose.position.x,pose.position.y),destination=r.screen(state.map.tiles[to]);
    r.hovered=to;r.hoveredUnit=id;const highlighted=[],highlight=r.highlight;r.highlight=function(ctx,tile,...args){highlighted.push(tile);return highlight.call(this,ctx,tile,...args);};r.dirty=true;r.menuOpen=false;r.render();r.menuOpen=true;r.highlight=highlight;
    const sprite=r.unitHits.find(item=>item.unit.id===id&&item.kind==='sprite');if(!sprite)throw Error('Animated sprite missing');
    const rect=document.getElementById('map').getBoundingClientRect();
    const selected=r.hitUnit(rect.left+sprite.x+sprite.width/2,rect.top+sprite.y+sprite.height/2,true);
    return {distanceFromDestination:Math.hypot(position.x-destination.x,position.y-destination.y),groundDistance:Math.hypot(sprite.ground.x-position.x,sprite.ground.y-position.y),selected:selected?.id,unit:id,highlighted,destination:to};
  },{id:unit.id,to:tile(12,10).id});
  await writeFile(path.join(output,'movement-evidence.json'),JSON.stringify(evidence,null,2));
  assert(evidence.distanceFromDestination>20);assert(evidence.groundDistance<1);assert.equal(evidence.selected,unit.id);assert(!evidence.highlighted.includes(evidence.destination));
  await view.screenshot({path:path.join(output,'unit-animation-selection.png')});await writeFile(path.join(output,'movement-evidence.json'),JSON.stringify(evidence,null,2));
  await movement.close();pass('Tile/unit inspectors close from their visible header, and an interpolated moving sprite stays selectable without outlining its destination resource');
  await writeFile(path.join(output,'checks.json'),JSON.stringify({passed:true,checks,modelRequests:received.length,paidModel:false,productionWrites:false},null,2));
} finally {
  await browser.close();lobby.dispose();runtime?.dispose?.();
  for(const server of [proxy,host?.server,movementHost?.server,provider])if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
