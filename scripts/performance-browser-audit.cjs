const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),directory=path.join(root,process.env.CIV_AUDIT_DIRECTORY||'output/performance-audit-20261009'),snapshot=JSON.parse(fs.readFileSync(path.join(directory,'observer-snapshot.json'))),errors=[];
const summarize=values=>{const sorted=[...values].sort((a,b)=>a-b);return {count:values.length,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:0,median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))],max:sorted.at(-1)};};
// All API traffic is a frozen fixture; this browser never contacts the running game.
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);let file=path.resolve(root,'web','.'+name);if(!file.startsWith(path.join(root,'web')+path.sep)){res.writeHead(403);return res.end();}if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);if(!file.startsWith(path.join(root,'src')+path.sep)&&!file.startsWith(path.join(root,'web')+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
 let mode='idle',revision=1,startTime=performance.now(),requests=0;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{const url=new URL(route.request().url());let result;const clock=snapshot.realtime.time+(performance.now()-startTime)/1000,session={mode:'realtime',running:mode==='updates',rate:1,time:clock,nextEconomy:clock+20,period:20,players:[],revision,busy:false};
   if(url.pathname==='/api/state'){
    requests++;if(mode==='updates'){revision++;session.revision=revision;snapshot.units[0].hp=99+(revision%100)/100;}
    const since=Number(url.searchParams.get('since'));
    result=url.searchParams.get('game')!==snapshot.id?{game:snapshot,session}:mode==='updates'?{delta:{baseRevision:since,id:snapshot.id,view:-1,fields:{units:snapshot.units,realtime:{...snapshot.realtime,time:clock}},tiles:[]},session}:{unchanged:true,session};
   }else if(url.pathname==='/api/pause')result={ok:true};
   else if(url.pathname==='/api/saves')result={entries:[],files:[]};
   else if(url.pathname==='/api/drivers')result={drivers:[]};
   else throw Error('Unexpected fixture request '+url.pathname);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  const launchStart=performance.now();await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForFunction(()=>!window.__civ.menuShown&&window.__civ.renderer.gpu);
  const readyMs=performance.now()-launchStart;
  const focus=await page.evaluate(async()=>{const a=window.__civ,r=a.renderer,{dist}=await import('/rules.mjs'),owner=9,cities=a.game.cities.filter(c=>c.owner===owner),score=c=>a.game.units.filter(u=>dist(a.game.map.tiles[u.tile],a.game.map.tiles[c.tile],a.game.map)<=6).length;cities.sort((x,y)=>score(y)-score(x));const c=cities[0];r.cam=r.position(a.game.map.tiles[c.tile]);r.targetCam=null;r.dirty=true;return {owner,city:c.name,tile:c.tile,nearbyUnits:score(c)};});
  await page.waitForTimeout(4000);
  await page.evaluate(()=>{const r=window.__civ.renderer,metrics={methods:{},frames:[],marks:[],longTasks:[],pixelReads:[],slowFrames:[]};window.__performanceAudit={r,metrics,base:{...r.cam}};
   for(const [object,name,label]of [[r,'render','render'],[r,'setState','setState'],[r,'cullScenery','cullScenery'],[r,'drawUnits','drawUnits'],[r,'drawMinimap','drawMinimap'],[r.contactPass,'render','terrainPass']]){const original=object[name];object[name]=function(...args){const begin=performance.now(),result=original.apply(this,args);(metrics.methods[label]??=[]).push(performance.now()-begin);return result;};}
   const originalFrame=r.unitSprites.frame;r.unitSprites.frame=function(type,index,action,transport){const start=performance.now();metrics.currentFrame={type,index,action,transport};try{const result=originalFrame.call(this,type,index,action,transport),ms=performance.now()-start;if(ms>10)metrics.slowFrames.push({type,index,action,transport,ms,painted:!!result?.painted,asset:result?.asset});return result;}finally{metrics.currentFrame=null;}};
   const originalRead=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(...args){const start=performance.now(),result=originalRead.apply(this,args);metrics.pixelReads.push({ms:performance.now()-start,frame:metrics.currentFrame});return result;};
   let previous=performance.now();const frame=now=>{metrics.frames.push(now-previous);previous=now;if(metrics.panning){const t=(now-metrics.panningStart)/1000;r.cam.x=window.__performanceAudit.base.x+Math.sin(t*1.8)*220;r.cam.y=window.__performanceAudit.base.y+Math.cos(t*1.8)*100;r.targetCam=null;r.dirty=true;}requestAnimationFrame(frame);};requestAnimationFrame(frame);
   new PerformanceObserver(list=>{for(const e of list.getEntries())metrics.longTasks.push({start:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:false});
  });
  const client=await page.context().newCDPSession(page);await client.send('Profiler.enable');await client.send('Profiler.start');
  const cases=[];
  for(const name of ['idle','updates','panning','reduced-idle']){
   mode=name==='updates'?'updates':'idle';const beforeRequests=requests;
   await page.evaluate(name=>{const {r,metrics,base}=window.__performanceAudit;metrics.methods={};metrics.frames=[];metrics.longTasks=[];metrics.pixelReads=[];metrics.slowFrames=[];metrics.panning=name==='panning';metrics.panningStart=performance.now();r.reduced=name==='reduced-idle';r.cam={...base};r.targetCam=null;r.dirty=true;metrics.begin=performance.now();metrics.initialRendered=r.renderedFrames;metrics.initialGpu=r.gpuFrames||0;},name);
   await page.waitForTimeout(6500);
   const raw=await page.evaluate(()=>{const {r,metrics}=window.__performanceAudit;return {elapsedMs:performance.now()-metrics.begin,methods:metrics.methods,frames:metrics.frames,longTasks:metrics.longTasks,pixelReads:metrics.pixelReads,slowFrames:metrics.slowFrames,rendered:r.renderedFrames-metrics.initialRendered,gpuFrames:(r.gpuFrames||0)-metrics.initialGpu,diagnostics:r.diagnostics};});
   cases.push({name,elapsedMs:raw.elapsedMs,requests:requests-beforeRequests,animationFrames:summarize(raw.frames.slice(2)),methods:Object.fromEntries(Object.entries(raw.methods).map(([key,values])=>[key,summarize(values)])),longTasks:raw.longTasks,pixelReads:raw.pixelReads,slowFrames:raw.slowFrames,frameCache:{fallback:raw.diagnostics.unitAnimation.cachedFrames,painted:raw.diagnostics.unitAnimation.paintedFrames},rendered:raw.rendered,gpuFrames:raw.gpuFrames,drawCalls:raw.diagnostics.drawCalls,triangles:raw.diagnostics.triangles,unitCandidates:raw.diagnostics.culling.units,geometries:raw.diagnostics.geometries});console.log('MEASURED browser '+name);
  }
  const {profile}=await client.send('Profiler.stop');fs.writeFileSync(path.join(directory,'browser.cpuprofile'),JSON.stringify(profile));
  const nodes=new Map(profile.nodes.map(n=>[n.id,n])),totals=new Map();for(let i=0;i<(profile.samples||[]).length;i++){const f=nodes.get(profile.samples[i])?.callFrame;if(!f)continue;const key=f.functionName+'|'+f.url+'|'+f.lineNumber,entry=totals.get(key)||{function:f.functionName,file:f.url,line:f.lineNumber+1,selfMs:0};entry.selfMs+=(profile.timeDeltas?.[i]||1000)/1000;totals.set(key,entry);}
  const environment=await page.evaluate(()=>{const r=window.__civ.renderer,gl=r.gpu.getContext(),extension=gl.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,devicePixelRatio,webglRenderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),renderer:r.diagnostics.engine,width:innerWidth,height:innerHeight};});
  await page.screenshot({path:path.join(directory,'browser-view.png')});assert.deepEqual(errors,[]);
  const report={frozenInput:true,headless:true,actualDesktopFpsMeasured:false,readyMs,focus,environment,cases,cpuTop:[...totals.values()].sort((a,b)=>b.selfMs-a.selfMs).slice(0,20),errors,runningGameCommands:false,activeSaveWritten:false};fs.writeFileSync(path.join(directory,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,cpuTop:report.cpuTop.slice(0,10),cases:cases.map(c=>({...c,longTasks:c.longTasks.length,pixelReads:c.pixelReads.length,slowFrames:c.slowFrames.slice(0,6)}))},null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
