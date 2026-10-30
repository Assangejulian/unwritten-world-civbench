import auditBrowserRuntime from './browser-runtime.cjs';
// Real Universe controls and actual API-worker processes, backed by a local deterministic provider.
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {Lobby} from '../src/environment/lobby.mjs';
import {AgentLauncher} from '../src/environment/agent-launcher.mjs';
import {listen} from '../src/environment/http.mjs';

const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const output=path.resolve(process.env.UI_CHECK_OUTPUT||'output/playwright/model-api-20261020');await mkdir(output,{recursive:true});
const checks=[],providerRequests=[],providerHeaders=[];let failModel=false;
const provider=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks).toString());providerRequests.push(body);
  providerHeaders.push(req.headers.authorization);
  if(failModel&&body.model==='UI Model 0'&&!body.tools.some(tool=>(tool.function?.name||tool.name)==='connection_ready')){res.writeHead(401);res.end('{}');return;}
  const tools=body.tools.map(tool=>tool.function?.name||tool.name),check=tools.includes('connection_ready'),responses=req.url.endsWith('/responses');
  const context=check?null:JSON.parse((responses?body.input:body.messages).find(message=>message.role==='user').content);
  const name=check?'connection_ready':'game_end_turn',args=check?{}:{force:true,observation_token:context.summary.observation_token},id='ui_call_'+providerRequests.length;
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(responses?{status:'completed',output:[{type:'function_call',call_id:id,name,arguments:JSON.stringify(args)}],usage:{input_tokens:10,output_tokens:5}}:{choices:[{message:{role:'assistant',content:null,tool_calls:[{id,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}],usage:{prompt_tokens:10,completion_tokens:5}}));
});
await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+provider.address().port+'/v1';
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
try{
  for(const width of [1440,390]){
    const launcher=new AgentLauncher({outputRoot:path.join(output,'ui-clients-'+width)}),lobby=new Lobby({stub:true,launcher});
    const host=await listen(null,{port:0,lobby});lobby.server=host.server;lobby.url=host.url;
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],calls=[];
    page.setDefaultTimeout(45000);page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(request.url().includes('/api/'))calls.push({route:new URL(request.url()).pathname,body:request.postData()});});
    try{
      await page.goto(host.url+'/#setup='+lobby.hostCapability,{waitUntil:'domcontentloaded'});
      await page.locator('#menu-new').click();await page.locator('#setup-count').selectOption('2');await page.locator('#setup-size').selectOption('small');await page.locator('#setup-count').selectOption('2');
      if(width<900)await page.locator('[data-setup-tab="leaders"]').click();
      await page.locator('[data-controller="0"]').selectOption('api');await page.locator('[data-ai-name="0"]').fill('API Model 0');await page.locator('[data-setup-client="0"]').click();
      await page.locator('#setup-api-url').fill(base);await page.locator('#setup-api-model').fill('UI Model 0');await page.locator('#setup-api-key').fill('UI_SYNTHETIC_KEY_A');
      await page.locator('#setup-api-check').click();await page.waitForFunction(()=>document.getElementById('setup-api-status')?.textContent.includes('连接成功'));
      assert.equal(await page.locator('html').getAttribute('data-ui'),'b');
      assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('UI_SYNTHETIC_KEY')),false);
      assert.equal(await page.evaluate(()=>document.documentElement.innerHTML.includes('UI_SYNTHETIC_KEY')),false);
      if(width===1440){
        await page.locator('[data-controller="1"]').selectOption('api');await page.locator('[data-ai-name="1"]').fill('API Model 1');await page.locator('[data-setup-client="1"]').click();
        assert.equal(await page.locator('#setup-api-key').inputValue(),'');
        await page.locator('#setup-api-protocol').selectOption('responses');await page.locator('#setup-api-url').fill(base);await page.locator('#setup-api-model').fill('UI Model 1');await page.locator('#setup-api-key').fill('UI_SYNTHETIC_KEY_B');
        await page.locator('#setup-api-check').click();await page.waitForFunction(()=>document.getElementById('setup-api-status')?.textContent.includes('连接成功'));
        await page.locator('[data-setup-client="0"]').click();assert.equal(await page.locator('#setup-api-key').inputValue(),'UI_SYNTHETIC_KEY_A');assert.equal(await page.locator('#setup-api-model').inputValue(),'UI Model 0');
        await page.locator('#setup-observer').check();
        await page.locator('#setup-api-launch').click();await page.waitForFunction(()=>document.querySelectorAll('.setup-client-dot.online').length===1);
        const beforeRequests=providerRequests.length;
        for(const token of ['',lobby.runtime.seatTokens.get(0),lobby.runtime.observerToken])for(const route of ['check','resume','start','stop','profile','update']){
          const response=await fetch(host.url+'/api/lobby/agent/'+route,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({seat:0,api:{baseUrl:base,model:'UI Model 0',apiKey:'DO_NOT_SEND'}})});assert.equal(response.status,401);
        }
        assert.equal(providerRequests.length,beforeRequests);
        await page.locator('[data-setup-client="1"]').click();assert.equal(await page.locator('#setup-api-key').inputValue(),'UI_SYNTHETIC_KEY_B');
        await page.locator('#setup-api-launch').click();await page.waitForFunction(()=>document.querySelectorAll('.setup-client-dot.online').length===2);
        assert(!JSON.stringify(lobby.status()).includes('UI_SYNTHETIC_KEY'));
        for(const call of calls.filter(call=>call.route==='/api/lobby/prepare'))assert(!call.body.includes('UI_SYNTHETIC_KEY'));
        failModel=true;
        await page.locator('#create-world').click();
        await page.waitForFunction(()=>window.__civ?.session?.managedRuns?.some(run=>run.seat===0&&run.error),null,{timeout:90000});
        await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
        await page.evaluate(()=>{window.__civ.renderer.menuOpen=true;});
        assert.equal(lobby.runtime.managedPlayProgress(0).completed,0);
        await page.screenshot({path:path.join(output,'api-failed-resume.png')});
        failModel=false;
        await page.locator('#model-observer-toggle').click();await page.locator('#model-observer-civ').selectOption('0');assert.equal(await page.locator('[data-managed-stop="0"]').count(),1);
        await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-config="0"]').click();await page.locator('#live-model-api').waitFor();
        assert.equal(await page.locator('#setup-api-key').inputValue(),'');assert.equal(await page.locator('#setup-api-model').inputValue(),'UI Model 0');
        await page.locator('#setup-api-key').fill('UI_SYNTHETIC_KEY_A_UPDATED');await page.locator('#live-model-api summary').click();await page.locator('#setup-api-tokens').fill('1024');
        await page.locator('#setup-api-launch').click();
        await page.waitForFunction(()=>window.__civ?.session?.managedRuns?.length===2&&window.__civ.session.managedRuns.every(run=>run.completed>=10),null,{timeout:90000});
        for(const seat of [0,1]){assert.equal(lobby.runtime.managedPlayProgress(seat).target,null);await page.locator('#model-observer-civ').selectOption(String(seat));await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-stop="'+seat+'"]').click();}
        assert(lobby.runtime.managedPlayProgress(0).completed>=10);assert(lobby.runtime.managedPlayProgress(1).completed>=10);
        assert(providerHeaders.includes('Bearer UI_SYNTHETIC_KEY_A_UPDATED'));
        assert.equal(await page.evaluate(()=>window.__hexUi.canControl(0)),false);
        await page.screenshot({path:path.join(output,'api-two-models-completed.png')});
        checks.push('Actual protocol/key forms, per-seat isolation, host-only API routes, two API players, visible failure, in-game repair and manual stop without trial goals');
      }else{
        for(const id of ['setup-api-url','setup-api-model','setup-api-key','setup-api-launch']){const bounds=await page.locator('#'+id).boundingBox();assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+1);}
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
        await page.screenshot({path:path.join(output,'api-setup-390.png')});
        checks.push('390px Universe configuration fields, check action, hidden key and launch button remain reachable without overflow');
        await page.route('**/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({service:'match-host',features:{modelApi:true}})}));
        await page.reload({waitUntil:'domcontentloaded'});await page.locator('#menu-new').click();await page.locator('[data-setup-tab="leaders"]').click();await page.locator('[data-controller="0"]').selectOption('api');await page.locator('[data-ai-name="0"]').fill('API Model 0');await page.locator('[data-setup-client="0"]').click();
        await page.waitForFunction(()=>document.getElementById('setup-api-status')?.textContent.includes('当前后台尚未加载'));
        assert.equal(await page.locator('#setup-api-launch').isDisabled(),true);assert.equal(await page.locator('#setup-api-check').isDisabled(),true);assert.equal(await page.locator('#setup-api-key').inputValue(),'');
        checks.push('An old backend shows a clear restart notice and never sends an unsupported API request; keys do not survive a page reload');
      }
      assert.deepEqual(errors,[]);console.log('PASS '+checks.at(-1));
    }finally{failModel=false;await context.close();lobby.dispose();}
  }
  await writeFile(path.join(output,'ui-checks.json'),JSON.stringify({passed:true,checks},null,2));
}finally{await browser.close();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));}
