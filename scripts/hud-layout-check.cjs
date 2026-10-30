// Universe is mounted by startup; retired style switching has been removed.
// Isolated physical-wheel and HUD geometry checks; never calls the live game API.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/playwright/hud-layout-20261018'),before=process.argv.includes('--before');
fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],metrics=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const check=(name,ok,data)=>{checks.push({name,passed:!!ok,data});if(!before)assert(ok,name+' '+JSON.stringify(data));};
(async()=>{
 const R=await import(pathToFileURL(path.join(root,'src/rules.mjs'))),E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),{RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs')));
 const browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
 try{for(const [width,height] of before?[[1280,720]]:process.argv.includes('--mobile')?[[390,844]]:[[1920,1080],[1440,900],[1280,720],[390,844]]){
  const g=E.createGame({seed:'HUD-LAYOUT',players:12,size:'small',barbarians:false});for(const p of g.players)E.foundCity(g,p,g.units.find(u=>u.owner===p.id&&u.type==='settler'));
  g.players[0].manual=true;g.players[0].met=g.players.slice(1).map(p=>p.id);
  let resourceCase='owned';const sim=new RealtimeSimulation(g),page=await browser.newPage({viewport:{width,height}}),origin='http://hud-check.local';
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{localStorage.setItem('hex.uiStyle','B');localStorage.setItem('hex.uiB.rosterCollapsed','1');localStorage.setItem('hex.audio.music','0');});
  await page.route(origin+'/**',async route=>{const u=new URL(route.request().url());let result;
   if(!u.pathname.startsWith('/api/')){const n=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname),files=[...(before?[path.join(out,'before/web',n)]:[]),path.join(root,'web',n),path.join(root,'src',n)],file=files.find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());return route.fulfill(file?{contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)}:{status:404,body:''});}
   if(u.pathname==='/api/state'){const view=Number(u.searchParams.get('view')??-1),snap=E.snapshot(g,view,{manualOptionsOnly:true});if(view===0)snap.players[0].resources=resourceCase==='empty'?{}:resourceCase==='unknown'?null:{horses:3,iron:2,oil:1,uranium:0,gold:2,gems:1,spices:3,silk:2};result={game:snap,session:{...sim.state(),revision:1,busy:false}};}
   else if(u.pathname==='/api/saves')result={entries:[],files:[]};else if(u.pathname==='/api/drivers')result={drivers:[]};else if(u.pathname==='/api/pause')result={ok:true};else if(u.pathname==='/api/observation')result=E.observation(g,g.players[+(u.searchParams.get('player')||0)]);else throw Error('Unexpected isolated API '+u.pathname);
   return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  try{
   await page.goto(origin);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForSelector('#b4-tracker');
   await page.evaluate(()=>{window.__civ.focusPlayer(0);const e=document.getElementById('perspective');e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForFunction(()=>window.__civ.game.visuals.view===0);await wait(200);
   await page.locator('[data-b4-roster]').click();await page.waitForSelector('#b4-rpanel',{state:'visible'});const rows=page.locator('#b-rows'),r=await rows.boundingBox();
   const old=await rows.evaluate(e=>({client:e.clientHeight,scroll:e.scrollHeight,pointer:getComputedStyle(e).pointerEvents}));await page.mouse.move(r.x+r.width*.6,r.y+Math.min(r.height/2,70));await page.mouse.wheel(0,260);await wait(180);const top=await rows.evaluate(e=>e.scrollTop);
   check(`${width}: physical roster wheel scrolls despite legacy collapsed flag`,top>20,{...old,top});
   g.players[0].score+=1;await page.evaluate(()=>window.__civ.refresh(true));await wait(150);check(`${width}: state refresh preserves roster scroll`,await rows.evaluate(e=>e.scrollTop)>20);
   if(!before){await rows.evaluate(e=>e.scrollTop=e.scrollHeight);await wait(60);const last=page.locator('#b-rows li').last();check(`${width}: last nation reachable`,await last.evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentNode.getBoundingClientRect();return a.bottom<=b.bottom+1&&a.top>=b.top-1;}));}
   await page.screenshot({path:path.join(out,`${before?'before':'after'}-${width}-roster.png`)});
   if(before)await page.locator('[data-b4-roster]').evaluate(e=>e.click());else await page.locator('[data-b4-roster]').click();
   const geo=await page.evaluate(()=>{const box=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};};return {map:box('.minimap-wrap'),tools:box('.map-tools'),search:box('#b4-mmsearch'),age:box('#b4-agemeter'),dock:box('#b4-age-dock'),hud:box('#b-hud'),lux:box('.b4-ylux'),strat:box('.b4-ystrat'),viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth};});metrics.push({width,geo});
   check(`${width}: map at bottom left`,geo.map.x<30&&geo.map.bottom>height*.6&&geo.map.right<width*.6,geo.map);
   check(`${width}: era at bottom right outside resource bar`,geo.age.x>width*.45&&geo.age.y>height*.65,geo.age);
   check(`${width}: map controls/search remain above map`,geo.search.bottom<=geo.map.y-2&&geo.tools.bottom<=geo.search.y+1,{tools:geo.tools,search:geo.search,map:geo.map});
   if(!before){
    check(`${width}: corner docks do not overlap`,geo.map.right+4<=geo.dock.x,geo);
    check(`${width}: atlas fully visible above simulation controls`,geo.map.bottom<=height-60&&await page.locator('#minimap').evaluate(e=>e.getBoundingClientRect().bottom<=e.parentNode.getBoundingClientRect().bottom-6),geo.map);
    check(`${width}: resource region stays inside header`,geo.strat.x>=geo.hud.x&&geo.strat.right<=geo.hud.right&&geo.lux.right<=geo.hud.right&&!geo.overflow,geo);
    fs.writeFileSync(path.join(out,`computed-${width}.json`),JSON.stringify(await page.evaluate(()=>['#b-hud','#b-yields','.b-nav','.b4-ylux'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return {s,x:r.x,y:r.y,w:r.width,h:r.height,display:c.display,position:c.position,grid:c.gridArea,template:c.gridTemplateRows,transform:c.transform,style:e.getAttribute('style')};})),null,2));
    await page.locator('.b4-ylux').hover();await wait(100);const pop=page.locator('.b4-lux-pop');check(`${width}: luxury details visible on hover`,await pop.isVisible());
    const text=await pop.textContent(),total=await page.locator('.b4-lux-total').textContent();check(`${width}: grouped luxury list has exact own quantities`,['gold','gems','spices','silk'].every(k=>text.includes(R.RESOURCES[k].name))&&total==='8',{text,total});
    await page.screenshot({path:path.join(out,`after-${width}-luxuries.png`)});await page.mouse.move(width*.55,height*.5);await page.locator('.b4-ylux').focus();check(`${width}: luxury keyboard focus opens details`,await pop.isVisible());
    await page.locator('.b4-ylux').evaluate(e=>e.blur());await page.screenshot({path:path.join(out,`after-${width}-hud.png`)});
    await page.locator('#b4-agemeter button').click();check(`${width}: moved era opens real history dialog`,await page.locator('#b4-age').isVisible());await page.keyboard.press('Escape');
    const map=await page.locator('#minimap').boundingBox();await page.mouse.click(map.x+map.width*.6,map.y+map.height*.5);check(`${width}: relocated map receives pointer`,await page.locator('#minimap').evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width*.6,r.y+r.height*.5)===e;}));
    for(const state of ['empty','unknown']){resourceCase=state;await page.evaluate(()=>window.__civ.refresh(true));const expected=state==='empty'?'0':'\u2014';await page.waitForFunction(v=>document.querySelector('.b4-lux-total')?.textContent===v,expected,{timeout:5000});await page.locator('.b4-ylux').focus();const value=await page.evaluate(()=>({total:document.querySelector('.b4-lux-total').textContent,items:document.querySelectorAll('.b4-lux-pop li').length,resources:window.__civ.game.players[0].resources}));check(`${width}: ${state} resources stay distinct and do not expose luxury names`,value.total===expected&&value.items===0,value);}
    await wait(100);check(`${width}: Universe retains one set of docks`,await page.locator('#b4-age-dock').count()===1&&await page.locator('#b4-agemeter').count()===1);
   }
  }finally{sim.dispose();await page.close();}
 }}finally{await browser.close();fs.writeFileSync(path.join(out,before?'before-checks.json':'checks.json'),JSON.stringify({checks,errors,metrics},null,2));}
 assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.passed).length,errors},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
