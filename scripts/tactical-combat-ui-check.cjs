const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),checks=[],errors=[],pass=name=>{checks.push(name);console.log('PASS '+name);},hash=b=>createHash('sha256').update(b).digest('hex');
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),R=await import(pathToFileURL(path.join(root,'src/rules.mjs'))),{RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs'))),{tacticalField}=await import(pathToFileURL(path.join(root,'scripts/tactical-combat-check.mjs'))),{see}=await import(pathToFileURL(path.join(root,'scripts/air-warfare-check.mjs')));
 const originalSave=fs.readFileSync(process.env.CIV_TEST_SAVE||path.join(root,'saves/autosave.json')),{g,p,tile}=tacticalField();
 const actor=E.addUnit(g,0,'infantry',tile(13,15).id),target=E.addUnit(g,1,'infantry',tile(14,15).id);
 E.addUnit(g,0,'infantry',tile(14,16).id);E.addUnit(g,0,'scout',tile(12,15).id);E.addUnit(g,1,'infantry',tile(14,14).id);
 p.techs=['printing'];Object.assign(tile(13,15),{owner:0,river:true,riverEdges:[0]});Object.assign(tile(14,15),{owner:1,river:true,riverEdges:[3],hill:true,feature:'forest'});target.fortified=true;see(g);
 const sim=new RealtimeSimulation(g);let revision=1;
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);let file=path.resolve(root,'web','.'+name);if(!file.startsWith(path.join(root,'web')+path.sep)){res.writeHead(403);return res.end();}if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);if(!file.startsWith(path.join(root,'src')+path.sep)&&!file.startsWith(path.join(root,'web')+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{let result;const url=new URL(route.request().url());try{
   if(url.pathname==='/api/state')result={game:E.snapshot(g,Number(url.searchParams.get('view')??-1),{manualOptionsOnly:true}),session:{...sim.state(),revision,busy:false}};
   else if(url.pathname==='/api/observation')result=E.observation(g,g.players[Number(url.searchParams.get('player')||0)]);
   else if(url.pathname==='/api/saves')result={entries:[],files:[]};
   else if(url.pathname==='/api/drivers')result={drivers:R.CIVS.map(c=>({file:c.file,status:'ready'}))};
   else if(url.pathname==='/api/action'){const body=route.request().postDataJSON();sim.enqueue(g.players[body.player],[body.action],{manual:true});sim.tick(.05);revision++;result={ok:true};}
   else if(url.pathname==='/api/pause'){sim.pause();result={ok:true};}
   else throw Error('Unexpected fixture API '+url.pathname);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  }catch(error){errors.push(error.message);await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:error.message})});}});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown&&typeof window.__civ.renderer.position==='function');
  await page.evaluate(id=>{const a=window.__civ,u=a.game.units.find(v=>v.id===id);a.renderer.focus(u.tile);a.selectTile(a.game.map.tiles[u.tile],null,u);},actor.id);
  await page.locator('[data-unit-action="attack"]').click();await page.waitForFunction(()=>window.__civ.renderer.orders.some(a=>a.type==='attack'));
  const hover=async()=>{await page.evaluate(async id=>{const r=window.__civ.renderer,t=window.__civ.game.map.tiles[id],{SY}=await import('/map.js');r.cam=r.position(t);r.targetCam=null;if(innerWidth<760){const at=r.screen(t);r.cam.y+=(at.y-130)/(r.zoom*SY);}r.dirty=true;},target.tile);await page.waitForTimeout(300);const point=await page.evaluate(id=>{const r=window.__civ.renderer,p=r.screen(window.__civ.game.map.tiles[id]),rect=r.canvas.getBoundingClientRect();return {x:p.x+rect.left,y:p.y+rect.top};},target.tile);await page.mouse.move(point.x-12,point.y);await page.mouse.move(point.x,point.y);await page.waitForFunction(()=>document.querySelector('#order-hint').classList.contains('combat-preview'));return point;};
  const preview=await page.evaluate(id=>window.__civ.renderer.orders.find(a=>a.targetUnit===id).hint,target.id);
  await hover();const text=await page.locator('#order-hint').innerText();
  for(const term of ['本土防卫 +5','渡河 -5','夹击 +2','情报优势 +6','丘陵 +3','树林 +3','友军支援 +2','依据当前可见情报估算'])assert(text.includes(term),term+' missing from '+text);
  assert(text.includes('战斗力 '+Number(preview.strength.toFixed(1))+' 对 '+Number(preview.defense.toFixed(1))));
  await page.screenshot({path:path.join(root,'output/playwright/tactical-combat-preview.png')});pass('The actual desktop attack hover displays backend strengths, terrain, river, flanking, support and visible intelligence modifiers');
  await page.setViewportSize({width:390,height:844});await hover();
  const box=await page.locator('#order-hint').boundingBox();assert(box.x>=0&&box.y>=62&&box.x+box.width<=391&&box.y+box.height<=844);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await page.locator('#order-hint').evaluate(el=>getComputedStyle(el).whiteSpace),'pre-line');
  await page.screenshot({path:path.join(root,'output/playwright/tactical-combat-preview-mobile.png')});pass('The actual narrow-screen combat breakdown stays readable inside the viewport without horizontal overflow');
  await page.setViewportSize({width:1440,height:960});const point=await hover();await page.mouse.click(point.x,point.y);await page.waitForFunction(id=>!!window.__civ.game.units.find(u=>u.id===id)?.activity,actor.id);
  sim.tick(3.2);revision++;await page.evaluate(()=>window.__civ.refresh());assert.equal(sim.stats.rejected,0);assert(target.hp<100&&actor.hp<100);assert(await page.locator('#order-hint').isHidden());assert.deepEqual(errors,[]);
  assert.equal(hash(fs.readFileSync(process.env.CIV_TEST_SAVE||path.join(root,'saves/autosave.json'))),hash(originalSave));pass('Clicking the actual preview target completes authoritative melee damage and retaliation, closes the hint and preserves the active save');
  fs.writeFileSync(path.join(root,'output/tactical-combat-ui-checks.json'),JSON.stringify({passed:true,checks,preview,damage:{dealt:100-target.hp,retaliation:100-actor.hp},errors,activeSaveSha256:hash(originalSave),activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
 }finally{sim.dispose();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
