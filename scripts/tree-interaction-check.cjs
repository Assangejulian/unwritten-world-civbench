// Universe is mounted by startup; retired style switching has been removed.
// Isolated real-browser checks: pointer corridor, fitted branches and wheel routing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.HCX_CHECK_OUTPUT||'output/playwright/tree-interaction-20261018'),before=process.argv.includes('--before');
fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],metrics=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2'};
const check=(name,ok,data)=>{checks.push({name,passed:!!ok,data});if(!before)assert(ok,name+' '+JSON.stringify(data));};
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),{RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs')));
 const browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
 try{for(const [width,height] of before?[[1280,720]]:[[1920,1080],[1440,900],[1280,720],[390,844]]){
  const g=E.createGame({seed:'TREE-POINTER',players:12,size:'small',barbarians:false});
  for(const p of g.players)E.foundCity(g,p,g.units.find(u=>u.owner===p.id&&u.type==='settler'));
  g.players[0].manual=true;g.players[0].met=g.players.slice(1,11).map(p=>p.id);g.players[11].name='UNMET-SENTINEL';
  const sim=new RealtimeSimulation(g),page=await browser.newPage({viewport:{width,height}}),origin='http://tree-check.local';
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{localStorage.setItem('hex.uiStyle','B');localStorage.setItem('hex.audio.music','0');});
  await page.route(origin+'/**',async route=>{const u=new URL(route.request().url());let result;
   if(u.pathname==='/health')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({app:'hex-civilizations'})});
   if(!u.pathname.startsWith('/api/')){
    const n=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname),files=[...(before?[path.join(out,'before/web',n)]:[]),path.join(root,'web',n),path.join(root,'src',n)],file=files.find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
    return route.fulfill(file?{contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)}:{status:404,body:''});}
   if(u.pathname==='/api/state')result={game:E.snapshot(g,Number(u.searchParams.get('view')??-1),{manualOptionsOnly:true}),session:{...sim.state(),revision:1,busy:false}};
   else if(u.pathname==='/api/saves')result={entries:[],files:[]};else if(u.pathname==='/api/drivers')result={drivers:[]};else if(u.pathname==='/api/pause')result={ok:true};
   else if(u.pathname==='/api/observation')result=E.observation(g,g.players[+(u.searchParams.get('player')||0)]);
   else throw Error('Unexpected isolated API '+u.pathname);
   return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  try{
   await page.goto(origin);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForSelector('#b4-tracker');
   await page.evaluate(()=>{window.__civ.focusPlayer(0);const e=document.getElementById('perspective');e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.waitForFunction(()=>window.__civ.game.visuals.view===0);
   for(const tab of ['tech','civic']){
    await page.locator(`[data-b4-codex="${tab}"]`).first().click();await page.waitForSelector('.b5-node');await wait(400);
    const body=page.locator('#b4-codex .b4-cx-body');
    const geometry=await body.evaluate(b=>{const r=b.getBoundingClientRect(),ns=[...b.querySelectorAll('.b5-node')].map(n=>n.getBoundingClientRect());return {client:b.clientHeight,scroll:b.scrollHeight,top:b.scrollTop,low:Math.min(...ns.map(n=>n.top-r.top)),high:Math.max(...ns.map(n=>n.bottom-r.top)),count:ns.length,font:getComputedStyle(b.querySelector('.b5-name')).fontSize,lanes:document.querySelectorAll('.b5-rl').length};});
    metrics.push({width,height,tab,geometry});check(`${width}/${tab}: all branches visible without vertical scrolling`,geometry.scroll<=geometry.client+2&&geometry.top===0&&geometry.low>=0&&geometry.high<=geometry.client+1,geometry);
    check(`${width}/${tab}: readable text and five complete lanes`,geometry.font==='14px'&&geometry.lanes===5,geometry);
    await body.evaluate(b=>{b.scrollLeft=0;b.scrollTop=0;});const br=await body.boundingBox();await page.mouse.move(br.x+br.width*.55,br.y+br.height*.5);await page.mouse.wheel(0,240);await wait(150);
    const wheel=await body.evaluate(b=>({left:b.scrollLeft,top:b.scrollTop}));check(`${width}/${tab}: vertical wheel pans horizontally`,wheel.left>100&&wheel.top===0,wheel);
    await page.mouse.wheel(0,-240);await wait(100);await body.evaluate(b=>b.scrollLeft=0);await wait(120);
    const marker=page.locator('.b4-pm.b6').first(),m=await marker.boundingBox();await page.mouse.move(m.x+m.width*.6,m.y+m.height/2);await wait(150);
    const pop=marker.locator('.b4-pm-pop'),pr=await pop.boundingBox();assert(pr,'Marker opens its list');
    let stable=true;const px=m.x+m.width*.6,from=m.y+2,to=pr.y+pr.height-24;
    for(let i=0;i<=12;i++){await page.mouse.move(px,from+(to-from)*i/12);await wait(22);stable&&=await pop.isVisible();}
    check(`${width}/${tab}: continuous pointer passage into list`,stable);
    if(stable){
     await page.mouse.move(pr.x+pr.width*.5,pr.y+pr.height*.6);const list=pop.locator('ul'),left=await body.evaluate(b=>b.scrollLeft);
     await page.mouse.wheel(0,230);await wait(120);const scroll=await list.evaluate(l=>l.scrollTop);
     check(`${width}/${tab}: list scroll stays local`,scroll>0&&(await body.evaluate(b=>b.scrollLeft))===left,{scroll});
     await page.mouse.move(pr.x-5,pr.y+pr.height/2);await wait(120);check(`${width}/${tab}: small edge tolerance`,await pop.isVisible());
     await page.mouse.move(pr.x+pr.width+75,pr.y+pr.height*.5);await wait(180);check(`${width}/${tab}: closes outside tolerance`,!(await pop.isVisible()));
    }
    check(`${width}/${tab}: unseen civilization stays private`,!(await page.locator('#b4-codex').textContent()).includes('UNMET-SENTINEL'));
    await page.screenshot({path:path.join(out,`${before?'before':'after'}-${width}-${tab}.png`)});
    if(!before){
     await page.locator('.b5-node').first().click();await wait(300);
     const detail=await body.evaluate(b=>({client:b.clientHeight,scroll:b.scrollHeight,top:b.scrollTop,tree:b.querySelector('.b5-tree').getAttribute('style'),budget:b.querySelector('.b5-tree').dataset.heightBudget,off:b.offsetHeight,pad:getComputedStyle(b).padding,children:[...b.children].map(x=>[x.className,x.getBoundingClientRect().height]),max:Math.max(...[...b.querySelectorAll('.b5-node')].map(n=>n.offsetTop+n.offsetHeight))}));check(`${width}/${tab}: selected detail keeps tree fitted`,detail.scroll<=detail.client+2&&detail.top===0,detail);
     await page.screenshot({path:path.join(out,`after-${width}-${tab}-selected.png`)});
     await page.locator('[data-b4-desel]').click();await wait(120);
    }
    await page.locator('[data-b4-close]').click();
   }
   if(!before){await wait(100);check(`${width}: Universe codex stays mounted`,await page.locator('#b4-codex').count()===1);await page.waitForSelector('#b4-tracker');await page.locator('[data-b4-codex="civic"]').first().click();await page.locator('[data-b4-tab="gov"]').click();check(`${width}: government retains vertical scrolling`,await page.locator('.b4-cx-body').evaluate(b=>getComputedStyle(b).overflowY==='auto'));}
  }finally{sim.dispose();await page.close();}
 }}finally{await browser.close();fs.writeFileSync(path.join(out,before?'before-checks.json':'checks.json'),JSON.stringify({checks,errors,metrics},null,2));}
 assert.equal(errors.length,0,JSON.stringify(errors));console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.passed).length,errors},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
