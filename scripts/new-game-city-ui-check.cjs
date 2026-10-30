// Load captured campaign copies through isolated APIs; never control the live game.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/new-game-length-20261017');
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),captured=JSON.parse(fs.readFileSync(path.join(out,'live-state.json'))),checks=[],errors=[];
 const fixed=E.snapshot(E.restore(fs.readFileSync(path.join(out,'live-save.json'),'utf8')),-1,{manualOptionsOnly:true});
 const old=E.snapshot(E.restore(fs.readFileSync(path.join(root,'saves/before-new-mvbyj9z3.json'),'utf8')),-1,{manualOptionsOnly:true});
 const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/')name='/index.html';let file=path.resolve(root,'web','.'+name);if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);if(!['web','src'].some(d=>file.startsWith(path.join(root,d)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
  for(const style of ['A','B'])for(const transition of [false,true]){
   const target=transition?fixed:captured.game,label=style+(transition?'-new-world':'-missing-field');let current=transition?old:target;
   const page=await browser.newPage({viewport:{width:1440,height:900}});
   page.on('pageerror',e=>errors.push({label,stack:e.stack}));page.on('console',m=>{if(m.type()==='error')errors.push({label,text:m.text()});});
   await page.addInitScript(style=>localStorage.setItem('hex.uiStyle',style),style);
   await page.route('**/api/**',async route=>{
    const name=new URL(route.request().url()).pathname;let result;
    if(name==='/api/state')result={game:current,session:{...captured.session,world:current===old?1:2,running:false}};
    else if(name==='/api/new'){current=target;result={ok:true};}
    else if(name==='/api/saves')result={entries:[],files:[]};
    else if(name==='/api/drivers')result={drivers:[]};
    else if(name==='/api/execution')result=JSON.parse(fs.readFileSync(path.join(out,'execution.json')));
    else if(name==='/api/observation')result=JSON.parse(fs.readFileSync(path.join(out,'observation-unit.json')));
    else if(name==='/api/pause')result={ok:true};
    else {errors.push({label,unexpectedAPI:name});result={ok:true};}
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
   });
   await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown);
   if(transition)await page.evaluate(async()=>{await window.__civ.api('new',{});await window.__civ.refresh(true);});
   await page.evaluate(()=>window.__civ.focusPlayer(0));
   if(style==='B')await page.locator('#inspector [data-b-more]').click();
   const cityText=await page.locator('#inspector').innerText();assert(cityText.includes('人口增长'),label+' must finish rendering the city panel: '+cityText.slice(0,600));
   assert(cityText.includes(transition?'块土地由居民工作':'居民工作地块信息待刷新'),label+' must show accurate assignment availability');
   for(let i=0;i<3;i++)await page.evaluate(()=>window.__civ.refresh(true));
   await page.screenshot({path:path.join(out,label+'-city.png')});
   await page.evaluate(()=>{const a=window.__civ,u=a.game.units.find(u=>u.owner===0&&u.type==='scout');a.selectTile(a.game.map.tiles[u.tile],null,u);a.renderer.focus(u.tile);});
   await page.waitForTimeout(1000);assert((await page.locator('#inspector').innerText()).includes('侦察兵'));assert(!(await page.locator('#toast').innerText()).includes('Cannot read'));
   await page.screenshot({path:path.join(out,label+'-scout.png')});checks.push(label+': city growth, work assignment status, three refreshes and scout selection');await page.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks}));
 }finally{
  fs.writeFileSync(path.join(out,'ui-checks.json'),JSON.stringify({passed:checks.length===4&&errors.length===0,checks,errors,liveAPIsUsed:false,activeSaveWritten:false},null,2));
  await browser?.close();await new Promise(r=>server.close(r));
 }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
