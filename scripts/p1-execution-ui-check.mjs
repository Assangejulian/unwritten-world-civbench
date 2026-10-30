import auditBrowserRuntime from './browser-runtime.cjs';
// P1 real-browser check: actual UI + actual server handler (hooked, socket-free API) on a frozen fixture copy.
import assert from 'node:assert/strict';
import {createRequire,registerHooks} from 'node:module';
import {Readable} from 'node:stream';
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const root=path.resolve(import.meta.dirname,'..'),work=path.join(root,'output','p1-ui-run'),P=Number(process.env.P1_PLAYER??5);
fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work,{recursive:true});const frozen=fs.readFileSync(path.join(root,'output/p1-fixtures/heavy-turn306.json'));fs.writeFileSync(path.join(work,'autosave.json'),frozen);
globalThis.__p1Server=h=>{globalThis.__p1Handler=h;return {on(){},listen(){}};};
const serverUrl=pathToFileURL(path.join(root,'server.mjs')).href;
const hooks=registerHooks({load(url,c,next){const r=next(url,c);if(url!==serverUrl)return r;let s=r.source.toString().replaceAll('\r\n','\n');s=s.replace("const saveDir=path.join(ROOT,'saves')",'const saveDir='+JSON.stringify(work)).replace('http.createServer(','globalThis.__p1Server(');s=s.replace(/^const timer=setInterval[^\n]+$/m,'const timer=undefined;').replace(/^for\(const signal of \['SIGINT','SIGTERM'\]\)[^\n]+$/m,'export function disposeFixture(){simulation.dispose();pool.dispose();observations.dispose();}');s+='\nexport const p1={get world(){return game;},get simulation(){return simulation;}};\n';return {...r,source:s};}});
const server=await import(serverUrl);hooks.deregister();const A=server.p1,E=await import(pathToFileURL(path.join(root,'src/engine.mjs')).href),{UNITS}=await import(pathToFileURL(path.join(root,'src/rules.mjs')).href);
async function call(method,route,body){const r=Readable.from(body===undefined?[]:[Buffer.from(body)]);Object.assign(r,{url:route,method,headers:{host:'127.0.0.1:43821',...(body===undefined?{}:{'content-type':'application/json'})}});let status,out;await globalThis.__p1Handler(r,{writeHead(c){status=c;},end(b){out=String(b);}});return {status,body:out};}
const checks=[],errors=[];const pass=n=>{checks.push(n);console.log('PASS '+n);};
const files=http.createServer((req,res)=>{const u=new URL(req.url,'http://x'),name=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);for(const dir of ['web','src']){const f=path.resolve(root,dir,'.'+name);if(f.startsWith(path.join(root,dir)+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile()){const ext=path.extname(f);res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'}[ext]||'application/octet-stream'});return fs.createReadStream(f).pipe(res);}}res.writeHead(404);res.end();});
await new Promise(r=>files.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable()});
try{
 assert.equal((await call('POST','/api/control',JSON.stringify({player:P,manual:true}))).status,200);
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));if(process.env.P1_DEBUG){page.on('console',m=>console.log('console',m.type(),m.text().slice(0,200)));page.on('requestfailed',r=>console.log('reqfail',r.url()));page.on('response',r=>{if(r.status()>=400)console.log('http',r.status(),r.url());});page.on('pageerror',e=>console.log('pageerror',e.message));}
 let gate=null;const execViews=[];await page.route('**/api/**',async route=>{const u=new URL(route.request().url()),q=route.request();if(u.pathname==='/api/execution')execViews.push(Number(u.searchParams.get('view')));if(u.pathname==='/api/batch'&&gate)await gate.promise;const r=await call(q.method(),u.pathname+u.search,q.method()==='POST'?q.postData():undefined);await route.fulfill({status:r.status,contentType:'application/json',body:r.body});});
 await page.goto('http://127.0.0.1:'+files.address().port);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown&&window.__civ.game);
 await page.evaluate(p=>window.__civ.focusPlayer(p),P);
 const g=A.world,p=g.players[P],vis=new Set(p.visible),movable=g.units.filter(u=>u.owner===P&&!['sea','air'].includes(UNITS[u.type].domain)&&u.type!=='envoy'&&!u.activity&&E.reachable(g,p,u).length).sort((a,b)=>a.id-b.id).slice(0,2);assert.equal(movable.length,2);
 const foreign=g.units.find(u=>u.owner!==P&&vis.has(u.tile));
 const ctrl=async u=>page.evaluate(([id])=>{const a=window.__civ,v=a.game.units.find(x=>x.id===id);a.selectTile(a.game.map.tiles[v.tile],{ctrlKey:true},v);},[u.id]);
 for(const u of movable)await ctrl(u);
 await page.waitForFunction(()=>!document.getElementById('force-panel').hidden&&document.querySelectorAll('#force-panel li[data-unit]').length===2);
 assert.match(await page.locator('#force-panel .force-head').innerText(),/已选：2 个单位/);pass('Ctrl+click adds two own units; panel shows truthful per-unit status rows');
 if(foreign){await ctrl(foreign);await page.waitForTimeout(150);assert.match(await page.locator('#force-panel .force-head').innerText(),/已选：2 个单位/);pass('Ctrl+click on a foreign unit does not add it');}
 const target=E.reachable(g,p,movable[0]).map(m=>m.tile).filter(t=>vis.has(t)).sort((a,b)=>a-b)[0];
 await page.evaluate(t=>{const a=window.__civ;a.selectTile(a.game.map.tiles[t],null,null);},target);assert.equal(await page.evaluate(()=>window.__civ.force.ids.size),2);pass('Ordinary click selects the target tile and keeps the force selection');
 await page.locator('#force-panel [data-force="move"]').click();if(process.env.P1_DEBUG){await page.waitForTimeout(1500);console.log('toast',await page.locator('#toast').innerText().catch(()=>''),'panel',(await page.locator('#force-panel').innerText()).slice(0,300));}await page.waitForFunction(()=>/已入队/.test(document.querySelector('#force-panel .force-last')?.textContent||''));
 const q=A.world.realtime.queues[P].map(e=>e.action);assert(q.some(a=>a.type==='move'&&movable.some(u=>u.id===a.unit)));assert.equal(new Set(q.filter(a=>a.type==='move').map(a=>a.tile)).size,q.filter(a=>a.type==='move').length);
 await page.waitForFunction(()=>/排队中；本国当前优先序 #\d/.test(document.getElementById('force-panel').textContent));const text=await page.locator('#force-panel').innerText();assert(!/紧迫度|urgency|全局/.test(text));assert.match(text,/已入队的指令在开始前可能被重新校验/);
 pass('Move button submits /api/batch; ordinary queued orders appear with national priority order and no raw scores/global caps');
 await page.screenshot({path:path.join(root,'output','p1-ui-queued.png')});
 await page.locator('#force-panel [data-force="cancel"]').click();await page.waitForFunction(()=>/取消 2/.test(document.querySelector('#force-panel .force-last')?.textContent||''));assert(!A.world.realtime.queues[P].some(e=>movable.some(u=>u.id===e.action.unit)));pass('Cancel button cancels through the runtime path');
 const save=(await call('GET','/api/save')).body;assert.equal((await call('POST','/api/load',JSON.stringify({save:JSON.parse(save)}))).status,200);await call('POST','/api/control',JSON.stringify({player:P,manual:true}));
 await page.evaluate(()=>window.__civ.refresh(true));await page.waitForFunction(()=>document.getElementById('force-panel').hidden&&window.__civ.force.ids.size===0);pass('Same-save reload (new world token) clears selection and batch results');
 await page.evaluate(p=>window.__civ.focusPlayer(p),P);for(const u of movable)await ctrl(u);await page.waitForFunction(()=>window.__civ.force.ids.size===2);
 await page.evaluate(p=>window.__civ.focusPlayer(p),(P+1)%A.world.players.length);await page.evaluate(()=>window.__civ.refresh(true));await page.waitForFunction(()=>window.__civ.force.ids.size===0&&document.getElementById('force-panel').hidden);pass('Perspective/player change resets the selection');
 await page.evaluate(p=>window.__civ.focusPlayer(p),P);await ctrl(movable[0]);await page.waitForFunction(()=>window.__civ.force.ids.size===1);await page.locator('#force-panel [data-force="clear"]').click();await page.waitForFunction(()=>document.getElementById('force-panel').hidden);pass('Visible clear-selection action works');
 // Finding 7: panel must not cover the turnbar's primary simulation controls.
 const hold=()=>{let release;const promise=new Promise(r=>release=r);gate={promise,release};return ()=>{const g=gate;gate=null;g.release();};};
 for(const [w,h] of [[1440,960],[1280,720]]){await page.setViewportSize({width:w,height:h});await page.evaluate(p=>window.__civ.focusPlayer(p),P);for(const u of movable)await ctrl(u);await page.waitForFunction(()=>document.querySelectorAll('#force-panel li[data-unit]').length===2);
  const hit=await page.evaluate(()=>{const panel=document.getElementById('force-panel').getBoundingClientRect(),bar=document.querySelector('.turnbar').getBoundingClientRect();return {ids:['speed','play','step'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return [id,!!t&&(t===e||e.contains(t))];}),panelBottom:panel.bottom,barTop:bar.top,panelTop:panel.top};});
  assert(hit.ids.every(x=>x[1]),JSON.stringify(hit));assert(hit.panelBottom<=hit.barTop,JSON.stringify(hit));assert(hit.panelTop>=0);await page.screenshot({path:path.join(root,'output','p1-ui-layout-'+w+'x'+h+'.png')});
  await page.locator('#play').click({trial:true});await page.locator('#step').click({trial:true});await page.locator('#speed').click({trial:true});
  await page.locator('#force-panel [data-force="clear"]').click();await page.waitForFunction(()=>document.getElementById('force-panel').hidden);pass('Panel sits above the turnbar at '+w+'x'+h+'; speed/play/step pass elementFromPoint hit-tests and remain clickable');}
 await page.setViewportSize({width:1440,height:960});
 // Finding 1: read-only inspection of an AI-controlled country in explicit observer view, without taking control.
 const Q=A.world.players.find(p=>p.id!==P&&!p.manual&&p.alive!==false&&A.world.units.some(u=>u.owner===p.id)).id,qUnit=A.world.units.find(u=>u.owner===Q&&u.hp>0),qQueue=A.world.realtime.queues[Q].length;
 await page.evaluate(p=>window.__civ.focusPlayer(p),Q);await ctrl(qUnit);await page.waitForFunction(()=>document.querySelectorAll('#force-panel li[data-unit]').length===1);
 assert.equal(await page.locator('#force-panel [data-force="move"]').count(),0);assert.match(await page.locator('#force-panel').innerText(),/只读查看/);assert.equal(A.world.players[Q].manual,false);assert.equal(A.world.realtime.queues[Q].length,qQueue);
 pass('Observer can read-only inspect an AI-controlled country\'s units; no batch controls; AI control and queue untouched');
 await page.locator('#force-panel [data-force="clear"]').click();await page.waitForFunction(()=>document.getElementById('force-panel').hidden);
 // Finding 2: under player P's actual perspective, a foreign selected country cannot be inspected.
 await page.evaluate(p=>{const s=document.getElementById('perspective');s.value=String(p);s.dispatchEvent(new Event('change'));},P);await page.waitForFunction(p=>window.__civ.view===undefined||true,P);await page.waitForTimeout(300);
 await page.evaluate(q=>window.__civ.focusPlayer(q),Q);execViews.length=0;await page.evaluate(u=>{const a=window.__civ;a.selectTile(a.game.map.tiles[u.tile],{ctrlKey:true},u);},{id:qUnit.id,owner:qUnit.owner,tile:qUnit.tile,type:qUnit.type});await page.waitForTimeout(700);
 assert.equal(await page.evaluate(()=>window.__civ.force.ids.size),0);assert(!execViews.includes(Q)&&!execViews.includes(-1),JSON.stringify(execViews));assert(await page.locator('#force-panel').isHidden());
 pass('Under a player perspective, a foreign country selected by other means cannot be inspected and no foreign status request is made');
 await page.evaluate(()=>{const s=document.getElementById('perspective');s.value='-1';s.dispatchEvent(new Event('change'));});await page.waitForTimeout(300);
 // Findings 3/4: delayed batch responses after Clear selection and after same-id world replacement.
 await page.evaluate(p=>window.__civ.focusPlayer(p),P);await ctrl(movable[0]);await page.waitForFunction(()=>window.__civ.force.ids.size===1);
 let release=hold();await page.locator('#force-panel [data-force="fortify"]').click();await page.waitForFunction(()=>document.querySelector('#force-panel [data-force="fortify"]')?.disabled===true);
 assert.equal(await page.locator('#force-panel [data-force="cancel"]').isDisabled(),true);await page.locator('#force-panel [data-force="clear"]').click();release();await page.waitForTimeout(800);
 assert(await page.locator('#force-panel').isHidden());assert.equal(await page.evaluate(()=>window.__civ.force.last),null);pass('Pending submission disables conflicting actions; a delayed response after Clear selection is discarded');
 await ctrl(movable[0]);await page.waitForFunction(()=>window.__civ.force.ids.size===1);release=hold();await page.locator('#force-panel [data-force="fortify"]').click();await page.waitForTimeout(200);
 const snap=(await call('GET','/api/save')).body;assert.equal((await call('POST','/api/load',JSON.stringify({save:JSON.parse(snap)}))).status,200);await call('POST','/api/control',JSON.stringify({player:P,manual:true}));await page.evaluate(()=>window.__civ.refresh(true));release();await page.waitForTimeout(800);await page.evaluate(()=>window.__civ.refresh(true));
 assert(await page.locator('#force-panel').isHidden());assert.equal(await page.evaluate(()=>window.__civ.force.last),null);assert.equal(await page.evaluate(()=>window.__civ.force.results),null);pass('A delayed response after same-id world replacement is discarded and not republished by refresh');
 // Codex lifecycle hardening: selection changes release their stale request marker.
 await ctrl(movable[0]);await page.waitForFunction(()=>window.__civ.force.ids.size===1);
 release=hold();await page.locator('#force-panel [data-force="fortify"]').click();await page.waitForTimeout(150);
 await ctrl(movable[0]);release();await page.waitForFunction(()=>window.__civ.force.pending===null);
 await ctrl(movable[0]);await page.waitForFunction(()=>window.__civ.force.ids.size===1);
 assert.equal(await page.locator('#force-panel [data-force="fortify"]').isDisabled(),false);
 pass('Changing Ctrl-selection during submission releases the old pending marker and allows another batch');
 // Returning control to AI changes context even if the world, perspective and country IDs are unchanged.
 release=hold();await page.locator('#force-panel [data-force="fortify"]').click();await page.waitForTimeout(150);
 assert.equal((await call('POST','/api/control',JSON.stringify({player:P,manual:false}))).status,200);
 await page.evaluate(()=>window.__civ.refresh(true));release();await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>window.__civ.force.ids.size),0);
 assert.equal(await page.evaluate(()=>window.__civ.force.last),null);
 assert.equal(await page.evaluate(()=>window.__civ.force.pending),null);
 pass('Returning control to AI invalidates pending manual results and clears the previous selection');
 assert.equal((await call('POST','/api/control',JSON.stringify({player:P,manual:true}))).status,200);
 await page.evaluate(()=>window.__civ.refresh(true));
 // Finding 6: recent own-unit admission rejection is rendered for the selected unit.
 { const g2=A.world,p2=g2.players[P],mv=g2.units.filter(u=>u.owner===P&&!['sea','air'].includes(UNITS[u.type].domain)&&u.type!=='envoy'&&!u.activity&&E.reachable(g2,p2,u).length).sort((a,b)=>a.id-b.id),a=mv[0],b=mv[1];
  const r=JSON.parse((await call('POST','/api/batch',JSON.stringify({player:P,game:g2.id,world:JSON.parse((await call('GET','/api/state?view='+P)).body).session.world,intent:{kind:'move',units:[a.id],tile:E.reachable(g2,p2,a).map(m=>m.tile).filter(t=>p2.visible.includes(t)).sort((x,y)=>x-y)[0]}}))).body);
  const tr=r.results[0].tile;b.tile=tr;for(let i=0;i<5;i++)A.simulation.advance(.05);
  await page.evaluate(id=>{const a=window.__civ,v=a.game.units.find(x=>x.id===id);a.selectTile(a.game.map.tiles[v.tile],{ctrlKey:true},v);},a.id);await page.waitForFunction(()=>/最近拒绝/.test(document.getElementById('force-panel').textContent),null,{timeout:10000});
  const t=await page.locator('#force-panel').innerText();assert.match(t,new RegExp('#'+a.id+' 移动（入场时'));await page.screenshot({path:path.join(root,'output','p1-ui-rejection.png')});pass('Recent own-unit admission rejection is rendered with identity, stage and time'); }
 assert.deepEqual(errors,[]);pass('No browser errors');
}finally{await browser.close();files.close();server.disposeFixture();}
fs.writeFileSync(process.env.P1_UI_OUT||path.join(root,'output/p1-execution-ui-checks.json'),JSON.stringify({passed:true,checks,errors,liveSaveTouched:false},null,2));
