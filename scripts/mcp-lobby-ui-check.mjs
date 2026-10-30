import auditBrowserRuntime from './browser-runtime.cjs';
// Generic MCP identities, unbounded API players and responsive portraits on disposable hosts.
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';
import {LEADERS} from '../src/rules.mjs';
const require=createRequire(import.meta.url),sdk=createRequire(path.resolve('environment/mcp/package.json'));
const {chromium}=auditBrowserRuntime.load('playwright');
const {Client}=sdk('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=sdk('@modelcontextprotocol/sdk/client/stdio.js');
const out=path.resolve(process.env.UI_CHECK_OUTPUT||'output/playwright/mcp-lobby-20261020');await mkdir(out,{recursive:true});
const checks=[],errors=[],lobbies=[],clients=[],transports=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const wait=async(fn,label)=>{const end=Date.now()+90000;while(Date.now()<end){if(await fn())return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Timeout: '+label);};
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
async function front(width=1440,height=1000){const lobby=new Lobby({stub:true});lobbies.push(lobby);const host=await listen(null,{port:0,lobby});lobby.server=host.server;lobby.url=host.url;const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await ctx.newPage();page.setDefaultTimeout(45000);page.on('pageerror',error=>errors.push(error.message));await page.goto(host.url+'/#setup='+lobby.hostCapability);await page.locator('#menu-new').click();await page.locator('#setup-count').selectOption('2');await page.locator('#setup-size').selectOption('small');await page.locator('#setup-count').selectOption('2');if(width<=900)await page.locator('[data-setup-tab="leaders"]').click();return {lobby,host,ctx,page};}
async function call(client,name,args={}){const result=await client.callTool({name,arguments:args});return {...result,value:JSON.parse(result.content.find(c=>c.type==='text').text)};}
async function attach(lobby,seat,name){const card=lobby.copy(seat),client=new Client({name,version:'test-1'});clients.push(client);const transport=new StdioClientTransport({command:process.execPath,args:[path.resolve('environment/mcp/server.mjs')],env:card.env,stderr:'pipe'});transports.push(transport);await client.connect(transport);await call(client,'game_session');return client;}
async function shot(page,name){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight&&r.bottom>0;}).map(e=>e.decode().catch(()=>{})));});await page.screenshot({path:path.join(out,name+'.png')});}
const provider=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const body=JSON.parse(Buffer.concat(chunks).toString()),context=JSON.parse(body.messages.find(m=>m.role==='user').content),id=randomUUID();
  const previous=body.messages.filter(m=>m.role==='assistant').flatMap(m=>m.tool_calls||[]).at(-1),reply=body.messages.filter(m=>m.role==='tool').at(-1),result=reply?JSON.parse(reply.content).result:null;
  const token=previous?.function.name==='game_end_turn'?context.observation_token:result?.next_observation_token||context.observation_token;
  let name='game_end_turn',args={force:true,observation_token:token};
  if(context.session.turn===1&&!previous){name='game_options';args={type:'found',limit:1};}
  else if(previous?.function.name==='game_options'&&result?.actions?.length){const {preview,...action}=result.actions[0];name='game_act';args={action,observation_token:result.observation_token};}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({choices:[{message:{role:'assistant',content:null,tool_calls:[{id,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}],usage:{prompt_tokens:5,completion_tokens:5}}));
});
await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
try{
  const {lobby,ctx,page}=await front();
  try{
    assert.equal(await page.locator('#setup-game-speed').inputValue(),'standard');
    for(const [key,turns] of [['blitz',163],['online',325],['quick',433],['standard',650],['epic',975],['marathon',1950]]){
      await page.locator('#setup-game-speed').selectOption(key);
      assert.equal(await page.locator('#setup-turns').inputValue(),String(turns));
    }
    await page.locator('#setup-game-speed').selectOption('blitz');
    await page.locator('#setup-turns').selectOption('200');
    assert.equal(await page.locator('#setup-turns').inputValue(),'200');
    await page.locator('#setup-game-speed').selectOption('standard');
    pass('Six game paces preserve the standard default, select valid score limits and allow a custom 200-round blitz match');
    assert.equal(await page.locator('#setup-agent-launch,#setup-agent-rounds,#setup-agent-stop,#setup-mcp-seat,#setup-wait-policy').count(),0);
    assert(!await page.locator('.setup-mcp').innerText().then(text=>/一键接入|试玩目标|当前席位|当前外部席位|未连接时/.test(text)));
    await page.locator('[data-controller="0"]').selectOption('agent');assert.equal(await page.locator('[data-ai-name="0"]').getAttribute('readonly'),'');
    await page.locator('[data-controller="1"]').selectOption('agent');assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'),'');
    await page.locator('#setup-prepare').click();await wait(()=>lobby.runtime,'prepared match');
    const a=await attach(lobby,0,'Claude Code'),b=await attach(lobby,1,'Grok Build');
    await page.waitForFunction(()=>document.querySelector('#setup-client-list')?.textContent.includes('Claude Code')&&document.querySelector('#setup-client-list')?.textContent.includes('Grok Build'));
    assert.equal(await page.locator('.setup-client-dot.online').count(),2);
    assert(!await page.locator('.setup-client-list').innerText().then(text=>text.includes(lobby.runtime.hostToken)||text.includes(lobby.runtime.observerToken)));
    const card=lobby.copy(0),json=JSON.parse(card.json);assert.equal(json.mcpServers.hex_seat_0.env.CIV_MATCH_TOKEN,card.env.CIV_MATCH_TOKEN);assert(!card.json.includes(lobby.runtime.seatTokens.get(1)));
    await page.locator('[data-setup-client="1"]').click();await page.locator('#setup-mcp-format').selectOption('toml');await page.locator('#setup-copy').click();await page.waitForFunction(()=>/复制|就绪/.test(document.querySelector('#setup-mcp-readiness')?.textContent));await page.locator('#setup-details-close').click();assert.equal(await page.locator('#setup-mcp-export').textContent(),'');
    await shot(page,'connected-clients');
    pass('The lobby reports two actual stdio MCP initialize identities, hides retired controls, and exports only the selected civilization credential');
    for(const token of [lobby.hostCapability,lobby.runtime.hostToken,lobby.runtime.observerToken]){const response=await fetch(lobby.url+'/v1/client',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({id:'untrusted_client',name:'Impersonation'})});assert(response.status>=400);}
    const presence=lobby.runtime.presence.get(1);presence.client.seen=Date.now()-46000;assert.equal(lobby.runtime.connectionState(1).state,'disconnected');await call(b,'game_session');assert.equal(lobby.runtime.connectionState(1).state,'disconnected','Browser/tool requests cannot refresh a stale MCP heartbeat');presence.client.seen=Date.now();
    pass('Client metadata is authority-bound and expires independently from ordinary seat/browser traffic');
    await page.locator('#setup-observer').check();await page.locator('#create-world').click();await page.waitForFunction(()=>window.__civ?.session?.role==='observer'&&!window.__civ.menuShown&&window.__civ.renderer.renderedFrames>0,null,{timeout:120000});await page.locator('#model-observer-toggle').waitFor({timeout:15000}).catch(async error=>{await writeFile(path.join(out,'observer-diagnostic.json'),JSON.stringify({url:page.url(),errors,state:await page.evaluate(()=>({root:document.getElementById('model-observer')?.outerHTML,session:window.__civ?.session,frames:window.__civ?.renderer?.renderedFrames,body:document.body.textContent.slice(-2000)}))},null,2));await shot(page,'observer-diagnostic');throw error;});await page.locator('#model-observer-toggle').click();await page.locator('#model-observer-civ').selectOption('0');await page.locator('[data-managed-stop="0"]').waitFor({state:'attached'});
    await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-stop="0"]').click();await wait(()=>lobby.runtime.managedPlayProgress(0).paused,'manual MCP pause');
    const pausedObservation=await call(a,'game_observe');const denied=await call(a,'game_end_turn',{force:true,request_id:randomUUID(),observation_token:pausedObservation.value.observation_token});assert.equal(denied.value.code,'managed_paused');
    await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-resume="0"]').click();await wait(()=>!lobby.runtime.managedPlayProgress(0).paused,'manual MCP resume');
    const observation=await call(a,'game_observe');const resumed=await call(a,'game_end_turn',{force:true,request_id:randomUUID(),observation_token:observation.value.observation_token});assert.equal(resumed.isError,false,resumed.value.code+': '+resumed.value.error);
    pass('In-game stop/resume gates an external harness without killing it or replacing the world');
    for(const [width,height] of [[1440,1000],[1280,720],[390,844]]){
      await page.setViewportSize({width,height});await page.evaluate(()=>window.__civ.openModal('leaders'));await page.locator('#historical-preview').waitFor({state:'attached'});
      await page.locator(width<=900?'button[data-leader-pane="strategy"]':'button[data-leader-pane="abilities"]').click();
      const main=page.locator('.leader-management>.leader-portrait');await main.evaluate(e=>e.decode());assert.equal(await main.evaluate(e=>getComputedStyle(e).objectFit),'contain');
      await main.scrollIntoViewIfNeeded();await shot(page,'portrait-main-'+width);
      await page.locator('button[data-leader-pane="catalog"]').click();
      for(const leader of LEADERS){await page.locator('#historical-preview').selectOption(leader.key);const image=page.locator('#historical-profile>.leader-portrait');await image.evaluate(e=>e.decode());assert(await image.evaluate(e=>e.naturalWidth>0&&getComputedStyle(e).objectFit==='contain'));}
      await page.locator('#historical-preview').selectOption('suleiman');await page.locator('#historical-profile>.leader-portrait').scrollIntoViewIfNeeded();await shot(page,'portrait-suleiman-'+width);await page.locator('#close-modal').click();
    }
    pass('Every historical portrait loads without cropping at desktop, short desktop and narrow widths; the main portrait adapts with it');
  }finally{await ctx.close();}

  const api=await front(1280,800);
  try{
    for(const seat of [0,1]){await api.page.locator('[data-controller="'+seat+'"]').selectOption('api');await api.page.locator('[data-ai-name="'+seat+'"]').fill('API Model '+seat);await api.page.locator('[data-setup-client="'+seat+'"]').click();await api.page.locator('#setup-api-url').fill('http://127.0.0.1:'+provider.address().port+'/v1');await api.page.locator('#setup-api-model').fill('Test Model '+seat);}
    for(const seat of [0,1]){await api.page.locator('[data-setup-client="'+seat+'"]').click();await api.page.locator('#setup-api-launch').click();await wait(()=>api.lobby.status().seats[seat]?.managed?.state==='starting'||api.lobby.status().seats[seat]?.managed?.state==='running','API launched');}
    await wait(()=>api.lobby.status().externalConnected===2,'API connected');for(const seat of [0,1])assert.equal(api.lobby.launcher.status(seat).target,null);
    await api.page.locator('#setup-observer').check();await api.page.locator('#create-world').click();await api.page.waitForFunction(()=>window.__civ?.session?.role==='observer'&&!window.__civ.menuShown&&window.__civ.renderer.renderedFrames>0,null,{timeout:120000});
    await wait(()=>[0,1].every(seat=>api.lobby.runtime.managedPlayProgress(seat).completed>=52),'past the former fifty-turn target');
    assert([0,1].every(seat=>!api.lobby.runtime.managedPlayProgress(seat).complete));
    await api.page.locator('#model-observer-toggle').click();for(const seat of [0,1]){await api.page.locator('#model-observer-civ').selectOption(String(seat));await api.page.locator('#model-observer-menu>summary').click();await api.page.locator('[data-managed-stop="'+seat+'"]').click();}await wait(()=>[0,1].every(seat=>api.lobby.runtime.managedPlayProgress(seat).paused),'API stopped');
    const counts=[0,1].map(seat=>api.lobby.runtime.managedPlayProgress(seat).completed);await new Promise(resolve=>setTimeout(resolve,500));assert.deepEqual([0,1].map(seat=>api.lobby.runtime.managedPlayProgress(seat).completed),counts);assert.equal(await api.page.locator('#managed-play-status').count(),0);await shot(api.page,'unbounded-api-stopped');
    pass('Two real API/MCP workers continue beyond fifty turns with no hidden goal, then stop only from the in-game controls');
    api.lobby.runtime.game.winner={player:0,type:'score',turn:api.lobby.runtime.game.turn,score:0};
    await api.lobby.launcher.resume(api.lobby,0);await wait(()=>api.lobby.launcher.status(0).state==='ended','clean terminal exit');assert.equal(api.lobby.launcher.status(0).error,null);
    pass('A continuous API worker recognizes a terminal match without reporting a missing trial goal');
  }finally{await api.ctx.close();}
  const narrow=await front(390,844);try{await narrow.page.locator('[data-controller="0"]').selectOption('agent');assert.equal(await narrow.page.locator('[data-ai-name="0"]').getAttribute('readonly'),'');await narrow.page.locator('#setup-prepare').click();await narrow.page.locator('#setup-copy').scrollIntoViewIfNeeded();const box=await narrow.page.locator('.setup-mcp').boundingBox();assert(box.x>=0&&box.x+box.width<=390);await shot(narrow.page,'lobby-390');pass('The compact connection ledger and configuration actions remain reachable at 390px');}finally{await narrow.ctx.close();}
  assert.deepEqual(errors,[]);await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,errors,paidModels:false,productionSaveWrites:false},null,2));
}finally{for(const client of clients)await client.close().catch(()=>{});for(const transport of transports)await transport.close().catch(()=>{});await browser.close();for(const lobby of lobbies)lobby.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));}
