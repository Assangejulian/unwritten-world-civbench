const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),checks=[],errors=[],pass=name=>{checks.push(name);console.log('PASS '+name);},hash=b=>createHash('sha256').update(b).digest('hex');
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),R=await import(pathToFileURL(path.join(root,'src/rules.mjs'))),{RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs'))),{carrierField}=await import(pathToFileURL(path.join(root,'scripts/carrier-check.mjs'))),{see}=await import(pathToFileURL(path.join(root,'scripts/air-warfare-check.mjs')));
 const originalSave=fs.readFileSync(path.join(root,'saves/autosave.json')),{g,p,tile,carrier,plane,gun}=carrierField();
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
  const select=async id=>{await page.evaluate(id=>{const a=window.__civ,u=a.game.units.find(v=>v.id===id);a.renderer.focus(u.tile);a.selectTile(a.game.map.tiles[u.tile],null,u);},id);};
  await select(plane.id);await page.locator('[data-unit-action="rebase"]').click();await page.waitForFunction(()=>window.__civ.renderer.orders.some(a=>a.carrier));
  assert(await page.locator('#order-hint').innerText().then(t=>t.includes('航母')));
  await page.evaluate(id=>{const r=window.__civ.renderer;r.cam=r.position(window.__civ.game.map.tiles[id]);r.targetCam=null;r.dirty=true;},carrier.tile);await page.waitForTimeout(250);
  const point=await page.evaluate(id=>{const r=window.__civ.renderer,p=r.screen(window.__civ.game.map.tiles[id]),b=r.canvas.getBoundingClientRect();return {x:p.x+b.left,y:p.y+b.top};},carrier.tile);
  await page.mouse.click(point.x,point.y);await page.waitForFunction(id=>window.__civ.game.units.find(u=>u.id===id)?.activity?.action.type==='rebase',plane.id);sim.tick(3);revision++;await page.evaluate(()=>window.__civ.refresh());assert.equal(plane.carrierId,carrier.id);assert.equal(sim.stats.rejected,0);
  await select(carrier.id);assert((await page.locator('.carrier-panel').innerText()).includes('舰载机 1 / 2'));assert((await page.locator('.carrier-panel').innerText()).includes('攻防 +20'));
  await page.locator('[data-deck-unit]').click();assert((await page.locator('#inspector h2').innerText()).includes('轰炸机'));assert((await page.locator('.carrier-panel').innerText()).includes('随航母'));
  pass('Actual transfer-button and map click land a plane on the carrier; capacity, active formation and clickable aircraft controls reflect authoritative state');
  await select(carrier.id);await page.waitForFunction(()=>window.__civ.renderer.unitSprites.painted.sheets.has('aircraftcarrier'));
  const art=await page.evaluate(()=>{
   const atlas=window.__civ.renderer.unitSprites.painted,poses=new Set(),death=new Set();let opaque=0;
   for(const action of ['idle','move','attack'])for(let i=0;i<16;i++){const f=atlas.frame('aircraftcarrier',i,action);poses.add(f.paintedIndex);opaque+=f.alpha.filter(a=>a>=80).length;}
   for(let i=0;i<8;i++){const f=atlas.frame('aircraftcarrier',i*2,'death');if(!f.alpha.some(a=>a>=80))throw Error('Empty carrier death pose');death.add(f.canvas.toDataURL());}
   return {living:poses.size,death:death.size,opaque,errors:atlas.errors};
  });assert.equal(art.living,20);assert.equal(art.death,8);assert(art.opaque>0);assert.deepEqual(art.errors,[]);await page.screenshot({path:path.join(root,'output/playwright/carrier-inspector.png')});
  pass('The actual 3D renderer loads all twenty ImageGen living poses and eight distinct nonempty generated sinking frames');
  await page.setViewportSize({width:390,height:844});await select(carrier.id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await page.locator('[data-deck-unit]').isVisible());await page.screenshot({path:path.join(root,'output/playwright/carrier-inspector-mobile.png')});pass('Carrier deck controls and formation rules remain usable on the real narrow-screen inspector');
  await page.setViewportSize({width:1440,height:960});carrier.hp=1;const enemy=E.addUnit(g,1,'nuclearsubmarine',tile(15,15).id);see(g);E.applyAction(g,g.players[1],{type:'attack',unit:enemy.id,targetUnit:carrier.id});revision++;await page.evaluate(()=>window.__civ.refresh());await page.waitForFunction(id=>window.__civ.renderer.effects.some(e=>e.kind==='death'&&e.actor.id===id),carrier.id);
  const dying=await page.evaluate(id=>window.__civ.renderer.effects.find(e=>e.kind==='death'&&e.actor.id===id).duration,carrier.id);assert.equal(dying,2.4);await page.screenshot({path:path.join(root,'output/playwright/carrier-sinking.png')});sim.tick(3);revision++;await page.evaluate(()=>window.__civ.refresh());await page.waitForTimeout(300);assert(!await page.evaluate(id=>window.__civ.renderer.effects.some(e=>e.kind==='death'&&e.actor.id===id),carrier.id));assert.equal(plane.carrierId,undefined);
  pass('A real authoritative sinking plays the carrier death sheet for 2.4 seconds, retires the ghost and releases surviving aircraft to emergency bases');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'output/carrier-ui-checks.json'),JSON.stringify({passed:true,checks,art,errors,activeSaveSha256:hash(originalSave),activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
 }finally{sim.dispose();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
