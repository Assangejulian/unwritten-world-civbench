// Exercise the real server and its static module allowlist in a disposable world.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
async function main(){
 const root=process.cwd(),label=process.argv[2]||'after',out=path.join(root,'output/unit-poses-20261019/startup-'+label),copy=path.join(out,'server');fs.mkdirSync(copy,{recursive:true});
 for(const name of ['src','web','players'])fs.cpSync(path.join(root,name),path.join(copy,name),{recursive:true,filter:p=>!p.includes(path.sep+'assets')&&!p.includes(path.sep+'vendor')});
 for(const name of ['assets','vendor'])if(!fs.existsSync(path.join(copy,'web',name)))fs.symlinkSync(path.join(root,'web',name),path.join(copy,'web',name),'junction');
 for(const name of ['server.mjs','package.json'])fs.copyFileSync(path.join(root,name),path.join(copy,name));
 fs.mkdirSync(path.join(copy,'saves'),{recursive:true});fs.copyFileSync(path.join(root,'saves/autosave.json'),path.join(copy,'saves/autosave.json'));
 const stub=http.createServer();await new Promise(r=>stub.listen(0,'127.0.0.1',r));const port=stub.address().port;await new Promise(r=>stub.close(r));
 let log='';const child=spawn(process.execPath,['server.mjs'],{cwd:copy,env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 let browser;const report={errors:[],failedRequests:[],label};try{
  const base='http://127.0.0.1:'+port;let ready=false;for(let i=0;i<100;i++){try{ready=(await fetch(base+'/health')).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error(log);
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable(),args:['--use-angle=swiftshader']});const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedRequests.push({url:r.url().replace(base,''),status:r.status()});});
  if(label==='failure')await page.route('**/app.js',route=>route.abort());
  await page.addInitScript(()=>localStorage.setItem('hex.uiStyle','B'));await page.goto(base);await page.waitForTimeout(2500);report.errorPanel=await page.locator('#startup-error').isVisible();report.booted=await page.evaluate(()=>!!window.__civ?.game);report.menu=await page.evaluate(()=>!!window.__civ?.menuShown);await page.screenshot({path:path.join(out,'startup.png')});
  if(report.booted){await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown&&!!window.__civ.renderer?.scene,{timeout:30000});await page.waitForTimeout(2500);report.world=await page.evaluate(()=>({seed:window.__civ.game.seed,turn:window.__civ.game.turn,cities:window.__civ.game.cities.length}));await page.evaluate(()=>{window.__civ.renderer.menuOpen=true;});report.captureMapPaused=true;await page.screenshot({path:path.join(out,'world.png'),timeout:60000});}
 }finally{await browser?.close();child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));fs.writeFileSync(path.join(out,'server.log'),log);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report));if(label==='failure'&&(!report.errorPanel||report.booted))process.exitCode=1;else if(!['before','failure'].includes(label)&&(!report.booted||report.errors.length||report.failedRequests.some(r=>/\.m?js/.test(r.url))))process.exitCode=1;
}main().catch(e=>{console.error(e);process.exitCode=1;});
