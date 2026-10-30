// Focused browser checks for Codex review fixes R2 (A-style age dedication entry) and R4 (390px codex close).
// Isolated: in-memory engine + mocked API routes, no game server, no save writes. Based on Codex's browser-audit harness.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const root=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.resolve(root,'output/playwright/age-review');fs.mkdirSync(OUT,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2','.jpg':'image/jpeg'};
const checks=[],errors=[],geo={};const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),A=await import(pathToFileURL(path.join(root,'src/ages.mjs')));
 const {RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs')));
 const browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
 const origin='http://ui-review.local';
 async function pageFor(style,width=1440,height=900){
  const g=E.createGame({seed:'UI4-REVIEW-FIX',players:4,size:'small',barbarians:false});
  for(const p of g.players){const u=g.units.find(u=>u.owner===p.id&&u.type==='settler');E.applyAction(g,p,{type:'found',unit:u.id});}
  g.players[0].manual=true;g.players[0].met=[1];
  const sim=new RealtimeSimulation(g),page=await browser.newPage({viewport:{width,height}}),requests=[];
  page.on('pageerror',e=>errors.push({style,width,stack:String(e.stack).slice(0,400)}));page.on('console',m=>{if(m.type()==='error')errors.push({style,width,text:m.text().slice(0,300)});});
  await page.addInitScript(s=>{localStorage.setItem('hex.uiStyle',s);localStorage.setItem('hex.audio.music','0');},style);
  await page.route(origin+'/**',async route=>{const url=new URL(route.request().url());
   if(!url.pathname.startsWith('/api/')){const n=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=['web','src'].map(d=>path.join(root,d,n)).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    if(file)return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});return route.fulfill({status:404,body:''});}
   let result,status=200;try{
    if(url.pathname==='/api/state')result={game:E.snapshot(g,Number(url.searchParams.get('view')??-1),{manualOptionsOnly:true}),session:{...sim.state(),revision:1,busy:false}};
    else if(url.pathname==='/api/saves')result={entries:[],files:[]};else if(url.pathname==='/api/drivers')result={drivers:[]};else if(url.pathname==='/api/pause'){sim.pause();result={ok:true};}
    else if(url.pathname==='/api/action'){const body=route.request().postDataJSON();requests.push(body);try{E.applyAction(g,g.players[body.player],body.action);result={ok:true,immediate:true};}catch(e){status=400;result={error:e.message};}}
    else if(url.pathname==='/api/observation')result=E.observation(g,g.players[+(url.searchParams.get('player')||0)]);
    else throw Error('Unexpected isolated API: '+url.pathname);
   }catch(e){status=400;result={error:e.message};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});});
  await page.goto(origin+'/');await page.waitForFunction(()=>window.__civ?.menuShown);
  await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown);await page.evaluate(()=>window.__civ.focusPlayer(0));
  if(style==='B')await page.waitForSelector('#b4-tracker');
  return {page,g,sim,requests};}
 const shot=async(page,name)=>{await wait(400);await page.screenshot({path:path.join(OUT,name+'.png')});};
 try{
  // R2: style A gets a minimal age-dedication entry only while a manual choice is pending.
  const a=await pageFor('A');
  assert.equal(await a.page.locator('[data-age-entry]').count(),0);checks.push('A: no age entry without a pending choice (layout unchanged).');
  a.g.players[0].age.score=30;a.g.turn=61;A.ageTurn(a.g,{event:E.event});assert(a.g.players[0].age.pending);await a.page.evaluate(()=>window.__civ.refresh(true));
  await a.page.waitForSelector('.topbar nav [data-age-entry]');await shot(a.page,'R2-01-A-pending-entry');
  await a.page.locator('[data-age-entry]').click();await a.page.waitForSelector('[data-age-pick]');assert.equal(await a.page.locator('[data-age-submit]').isDisabled(),true);
  const k0=a.g.players[0].age.pending.options[0];await a.page.locator(`[data-age-pick="${k0}"]`).click();await shot(a.page,'R2-02-A-age-modal-selected');
  await a.page.locator('[data-age-submit]').click();await wait(500);
  assert.deepEqual(a.g.players[0].age.bonuses,[k0]);assert.equal(a.g.players[0].age.pending,null);assert(a.requests.some(r=>r.action.type==='ageBonus'&&r.action.items[0]===k0));
  await a.page.waitForFunction(()=>!document.querySelector('[data-age-entry]'));await shot(a.page,'R2-03-A-after-choice');
  checks.push('A: pending golden age shows a nav entry; modal choice submits an accepted ageBonus action; entry disappears afterwards.');
  await a.page.close();a.sim.dispose();
  // B unaffected: no A entry while B is active, B keeps its own chooser.
  const b=await pageFor('B');b.g.players[0].age.score=30;b.g.turn=61;A.ageTurn(b.g,{event:E.event});await b.page.evaluate(()=>window.__civ.refresh(true));await b.page.waitForFunction(()=>document.getElementById('b4-age')?.open);
  assert.equal(await b.page.locator('[data-age-entry]').count(),0);checks.push('B: A entry is not injected; B age dialog still opens.');
  await b.page.keyboard.press('Escape');await wait(300);
  // R4: close button reachable at narrow width; desktop unchanged.
  for(const [w,h] of [[1440,900],[1280,720],[390,844]]){await b.page.setViewportSize({width:w,height:h});await wait(300);
   if(await b.page.evaluate(()=>document.getElementById('b4-age')?.open))await b.page.evaluate(()=>document.getElementById('b4-age').close());
   await b.page.locator('[data-b4-codex="tech"]').first().click();await b.page.waitForSelector('.b5-node');await shot(b.page,`R4-tree-${w}`);
   const r=await b.page.evaluate(()=>{const d=document.querySelector('#b4-codex'),x=d.querySelector('[data-b4-close]').getBoundingClientRect(),h2=d.querySelector('.b4-cx-head h2').getBoundingClientRect(),k=d.querySelector('.b4-keyd');return {vw:innerWidth,close:[x.left,x.right,x.top,x.bottom].map(v=>+v.toFixed(1)),title:[h2.width,h2.height].map(v=>+v.toFixed(1)),legendOpen:!!k?.open,docOverflowX:document.documentElement.scrollWidth>innerWidth};});
   geo[w]=r;assert(r.close[0]>=0&&r.close[1]<=r.vw&&r.close[2]>=0,`close outside viewport at ${w}`);assert(r.title[0]>r.title[1],'title should be horizontal');assert(r.close[1]>=r.vw-80,'close should sit at the right edge of the header');
   if(w===390){assert.equal(r.legendOpen,false);await b.page.locator('.b4-keyd>summary').click();await wait(250);const kr=await b.page.evaluate(()=>{const e=document.querySelector('.b4-keyd>.b4-key').getBoundingClientRect();return [e.left,e.right];});geo.legend390=kr;assert(kr[0]>=0&&kr[1]<=390,'legend popover outside viewport');await shot(b.page,'R4-tree-390-legend');}
   else assert.equal(r.legendOpen,true);
   await b.page.locator('[data-b4-close]').click({timeout:3000});await b.page.waitForFunction(()=>document.getElementById('b4-codex')?.hidden!==false||!document.querySelector('#b4-codex .b5-node'));
   checks.push(`R4: ${w}px close button inside viewport and a real click closes the codex.`);}
  await b.page.close();b.sim.dispose();
 }finally{await browser.close();fs.writeFileSync(path.join(OUT,'age-ui-review-check.json'),JSON.stringify({checks,errors,geo},null,2));}
 console.log(JSON.stringify({checks,errors,geo},null,1));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
