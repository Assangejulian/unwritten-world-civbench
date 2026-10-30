// Compare a frozen renderer with a four-site candidate; no live APIs or save writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/playwright/render-cache-trial-20261017'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const quick=process.argv.includes('--quick'),checks=[],errors=[],assets=new Map(),projections={};
const reportFile=process.argv.includes('--control')?'control-checks.json':process.argv.includes('--pan-only')?'pan-recheck.json':quick?'pilot.json':'trial-checks.json';
const network=new WeakMap();
async function settle(page,time=11){
 const state=network.get(page),deadline=Date.now()+30000;
 for(let pass=0;pass<8;pass++){
  const version=state.version;await page.evaluate(time=>window.frame(time),time);
  while(state.active.size||Date.now()-state.changed<500){if(Date.now()>deadline)throw Error('Asset loading did not settle');await new Promise(r=>setTimeout(r,50));}
  if(version===state.version&&!await page.evaluate(()=>!!r.dirty))return;
 }
 throw Error('Asset invalidations did not settle');
}
const stats=a=>{const v=[...a].sort((a,b)=>a-b);return {n:v.length,median:v[Math.floor(v.length*.5)],p95:v[Math.min(v.length-1,Math.floor(v.length*.95))],max:v.at(-1),mean:v.reduce((a,b)=>a+b,0)/v.length};};

const html=variant=>`<!doctype html><html><head><style>html,body{margin:0;overflow:hidden;background:#173b42}#terrain-3d,#map{position:absolute;inset:0;width:100vw;height:100vh}#map{z-index:1}#minimap{position:absolute;right:0;bottom:0;width:200px;height:120px;z-index:2}</style></head><body><canvas id="map"></canvas><canvas id="minimap" width="200" height="120"></canvas><script type="module">
import {MapRenderer} from '/${variant}/map3d.js';
import {mergeStateDelta} from '/${variant}/state-sync.js';
import {createJourney} from '/${variant}/unit-animation.js';window.makeJourney=createJourney;
const fixture=new URL(location.href).searchParams.get('fixture');
const input=await fetch('/fixture/'+fixture).then(r=>r.json());
const r=window.r=new MapRenderer(document.querySelector('#map'),document.querySelector('#minimap'),()=>{},()=>{});r.menuOpen=true;
window.input=input;window.merge=mergeStateDelta;window.original=JSON.stringify(input.game);
r.setSimulationState({time:input.game.realtime.time,running:false});r.setState(input.game);r.setYieldPlayer(input.game.players[0]);r.reduced=true;r.targetCam=null;
const home=input.game.cities.find(c=>c.owner===0)||input.game.cities[0];r.cam=r.position(input.game.map.tiles[home.tile]);r.zoom=1.1;r.selected={type:'city',id:home.id,tile:home.tile};
window.draw=()=>{r.menuOpen=false;try{r.render();}finally{r.menuOpen=true;}};
window.baseTime=input.game.realtime.time;
window.frame=(time,force=false)=>{r.time=window.baseTime+time;r.setSimulationState({time:window.baseTime+time,running:false});if(force)r.dirty=true;window.draw();};
window.capture=()=>{const c=document.createElement('canvas');c.width=r.width;c.height=r.height;const ctx=c.getContext('2d');ctx.drawImage(r.groundCanvas,0,0,c.width,c.height);ctx.drawImage(r.canvas,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];};
window.ready=true;
</script></body></html>`;

async function prepare(){
 const E=await import(pathToFileURL(path.join(out,'frozen/src/engine.mjs'))),{RealtimeSimulation}=await import(pathToFileURL(path.join(out,'frozen/src/realtime.mjs'))),{StateTransport}=await import(pathToFileURL(path.join(out,'frozen/src/state-transport.mjs')));
 for(const name of ['fresh','midgame']){
  const game=E.restore(fs.readFileSync(path.join(out,'fixtures',name+'.json'),'utf8')),cache=new StateTransport(),initial=cache.response(game.id,1,-1,0,null,()=>E.snapshot(game,-1,{manualOptionsOnly:true})).game;
  const sim=new RealtimeSimulation(game),trace=[];let revision=1;
  try{
   // Replay existing authoritative activity. Add one legal scout move to the fresh world if possible.
   if(name==='fresh'){
    sim.advance(1);const u=game.units.find(u=>u.owner===0&&u.type==='scout'&&!u.activity);
    if(u){const p=game.players[0],move=E.reachable(game,p,u).find(m=>m.cost>0);if(move)sim.enqueue(p,[{type:'move',unit:u.id,tile:move.tile}],{manual:true});}
   }
   for(let i=0;i<40;i++){sim.advance(.05);if(i%4===3){const result=cache.response(game.id,++revision,-1,revision-1,game.id,()=>E.snapshot(game,-1,{manualOptionsOnly:true}));trace.push(result.delta);}}
  }finally{sim.dispose();}
  const fog=E.snapshot(E.restore(fs.readFileSync(path.join(out,'fixtures',name+'.json'),'utf8')),0,{manualOptionsOnly:true});
  projections[name]={game:initial,trace,fog};
 }
}

(async()=>{
 await prepare();
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname);
  if(name==='/harness'){res.setHeader('Content-Type','text/html');return res.end(html(url.searchParams.get('variant')==='baseline'?'baseline':'candidate'));}
  if(name.startsWith('/fixture/')){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(projections[name.slice(9)]));}
  if(name.startsWith('/api/')){errors.push('Unexpected game API: '+name);res.writeHead(403);return res.end();}
  const match=name.match(/^\/(baseline|candidate)\/(.+)$/);let file;
  if(match){const candidate=path.join(out,'candidate/web',match[2]);file=match[1]==='candidate'&&!process.argv.includes('--control')&&fs.existsSync(candidate)?candidate:path.join(out,'frozen/web',match[2]);}
  else {file=path.join(out,'frozen/web','.'+name);if(!fs.existsSync(file))file=path.join(out,'frozen/src','.'+name);if(!fs.existsSync(file))file=path.join(root,'web','.'+name);}
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  const data=fs.readFileSync(file),digest=hash(data);if(assets.has(file)&&assets.get(file)!==digest){errors.push('Asset changed during comparison: '+file);res.writeHead(409);return res.end();}assets.set(file,digest);
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');res.end(data);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const report={passed:false,scope:'Isolated real Three.js renderer; elapsed render submission and forced GPU completion, not desktop FPS.',benchmarks:[],pixels:[],checks,errors};
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
  for(const fixture of (process.argv.includes('--mid-only')?['midgame']:['fresh','midgame'])){
   const pages={};
   for(const variant of ['baseline','candidate']){
    const page=pages[variant]=await browser.newPage({viewport:{width:1280,height:900}});
    const net={active:new Set(),changed:Date.now(),version:0};network.set(page,net);
    page.on('request',request=>{net.active.add(request);net.changed=Date.now();net.version++;});
    const finished=request=>{net.active.delete(request);net.changed=Date.now();};page.on('requestfinished',finished);page.on('requestfailed',finished);
    page.on('pageerror',e=>errors.push({fixture,variant,error:e.stack}));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push({fixture,variant,error:m.text()});});
    await page.goto('http://127.0.0.1:'+server.address().port+'/harness?variant='+variant+'&fixture='+fixture);await page.waitForFunction(()=>window.ready);
    await page.evaluate(()=>window.frame(10,true));await page.waitForFunction(()=>r.modelsReady&&r.textureReady&&r.facilityReady&&r.artReady&&r.extraArtReady&&r.resourceReady,{timeout:30000});await settle(page,10);
    await page.evaluate(()=>window.frame(10,true));await page.waitForTimeout(1000);await page.evaluate(()=>{window.frame(10,true);const capture=r.contactPass.captureGround.bind(r.contactPass);r.referenceCaptures=0;r.contactPass.captureGround=(...a)=>{r.referenceCaptures++;return capture(...a);};window.baseCam={...r.cam};window.baseGame=r.game;window.baseRevision=1;});
   }
   for(const scenario of (process.argv.includes('--pixels-only')?[]:process.argv.includes('--pan-only')?['pan']:['clock','movement','effects','pan'])){
    for(let round=0;round<(quick?1:5);round++)for(const variant of (round%2?['candidate','baseline']:['baseline','candidate'])){
     const page=pages[variant];
     const result=await page.evaluate(({scenario,count})=>{
      r.setState(window.baseGame);r.cam={...window.baseCam};r.zoom=1.1;r.targetCam=null;r.effects=[];r.unitJourneys.clear();r.unitTurns.clear();r.reduced=false;r.lastUnitFrame=r.lastRiverFrame=r.lastRouteFrame=-Infinity;window.frame(0,true);
      const before={static:r.staticFrames||0,captures:r.referenceCaptures,unit:r.unitOnlyFrames||0,gpu:r.gpuFrames||0},render=[],complete=[],start=window.baseGame.realtime.time,trace=window.input.trace;let game=window.baseGame,revision=1,moved=0,lastApplied=0;const poses=[];
      if(scenario==='effects'){
       const actor=game.units.find(u=>u.owner===0&&u.type==='warrior')||game.units.find(u=>u.owner===0),target=game.units.find(u=>u.id!==actor.id);
       r.effects.push({kind:'attack',actor:{...actor},target:{...target},started:start,duration:10});
      }
      for(let i=0;i<count;i++){
       const time=start+i/30;r.time=time;
       // Match the 160 ms client poll cadence at a 30 Hz display, with deterministic interpolation.
       if(i%5===0)r.setSimulationState({time,running:false});else r.simulationClock.time=time;
       if(scenario==='pan'){r.cam.x=window.baseCam.x+i*2;r.dirty=true;}
       if(scenario==='movement'&&i%6===0&&trace.length){const delta=trace[Math.min(trace.length-1,Math.floor(i/6))];if(delta.baseRevision===revision){game=window.merge(game,delta,revision,-1);revision++;r.setState(game);moved++;lastApplied=i;}}
       if(scenario==='movement'){r.simulationClock.time=game.realtime.time+Math.min(.3,(i-lastApplied)/30);const unit=game.units.find(u=>u.activity?.action.type==='move');if(unit)poses.push(JSON.stringify(r.unitPose(unit).position));}
       const begin=performance.now();window.draw();const submitted=performance.now();r.gpu.getContext().finish();const finished=performance.now();if(i>=12){render.push(submitted-begin);complete.push(finished-begin);}
      }
      return {render,complete,renderElapsedTotal:render.reduce((a,b)=>a+b,0),forcedGPUElapsedTotal:complete.reduce((a,b)=>a+b,0),staticFrames:(r.staticFrames||0)-before.static,referenceCaptures:r.referenceCaptures-before.captures,unitOnlyFrames:(r.unitOnlyFrames||0)-before.unit,gpuFrames:(r.gpuFrames||0)-before.gpu,appliedDeltas:moved,distinctMovingPoses:new Set(poses).size,geometry:r.gpu.info.memory.geometries,textures:r.gpu.info.memory.textures};
     },{scenario,count:quick?30:72});
     if(scenario==='movement')assert(result.distinctMovingPoses>1,fixture+' movement replay must exercise interpolated movement');
     report.benchmarks.push({fixture,variant,scenario,round,render:stats(result.render),forcedGPUCompletion:stats(result.complete),...Object.fromEntries(Object.entries(result).filter(([k])=>!['render','complete'].includes(k)))});
    }
   }
   // Compare actual pixels and hit metadata after both transient and authoritative changes.
   for(const state of (process.argv.includes('--benchmark-only')?[]:['clock','city-health','city-walls','trace','perspective','effects','legacy-journey','turning','construction','mobile','wrap'])){
    const pictures={};const metadata={};
    for(const variant of ['baseline','candidate']){
     const page=pages[variant];await page.setViewportSize(state==='mobile'?{width:390,height:844}:{width:1280,height:900});
     await page.evaluate(state=>{
      r.setState(window.baseGame);r.cam={...window.baseCam};r.zoom=1.1;r.targetCam=null;r.effects=[];r.unitJourneys.clear();r.unitTurns.clear();r.reduced=true;window.frame(10,true);let game=window.baseGame,revision=1;
      const home=game.cities.find(c=>c.owner===0),homeIndex=game.cities.indexOf(home);
      if(state==='city-health'||state==='city-walls'){game={...game,cities:game.cities.map((c,i)=>i!==homeIndex?c:{...c,hp:73,walls:19,...(state==='city-walls'?{buildings:[...new Set([...c.buildings,'walls'])]}:{})})};r.setState(game);}
      if(state==='trace')for(const delta of window.input.trace){game=window.merge(game,delta,revision++,-1);r.setState(game);}
      if(state==='perspective'){game=window.input.fog;r.setState(game);}
      if(state==='effects'){r.reduced=false;const actor=game.units.find(u=>u.owner===0&&u.type==='warrior')||game.units.find(u=>u.owner===0),target=game.units.find(u=>u.id!==actor.id);r.effects.push({kind:'attack',actor:{...actor},target:{...target},started:window.baseTime+10,duration:3});}
      if(state==='legacy-journey'||state==='turning'){game={...game,units:game.units.map(u=>({...u,activity:undefined}))};delete game.realtime;r.setState(game);r.reduced=false;const actor=game.units.find(u=>u.owner===0),point=r.position(game.map.tiles[actor.tile]);r.cam={...point};r.zoom=1.1;if(state==='legacy-journey')r.unitJourneys.set(actor.id,window.makeJourney(actor.type,[point,{x:point.x+400,y:point.y}],0,window.baseTime+10.8));else r.unitTurns.set(actor.id,{from:0,to:1.5,started:window.baseTime+10.7,duration:1.2});}
      if(state==='construction'){const t=game.map.tiles.find(t=>t.id!==home.tile&&Math.abs(t.row-game.map.tiles[home.tile].row)<=1&&Math.abs(t.col-game.map.tiles[home.tile].col)<=1&&!t.cityId&&!t.district&&t.terrain!=='mountain');if(!t)throw Error('Missing construction test tile');game={...game,map:{...game.map,tiles:game.map.tiles.map(x=>x.id===t.id?{...x,owner:0,construction:{kind:'wonder',item:'pyramids',city:home.id,stage:'building'}}:x)}};r.setState(game);}
      if(state==='wrap'){r.zoom=r.minimumZoom;r.cam.x=r.cameraBounds.right;}
      window.frame(11);
     },state);
     await settle(page,11);
     const capture=await page.evaluate(()=>{
      for(let i=0;i<4;i++)window.frame(11);
      const details=()=>({labels:r.labelBlocks,hits:r.unitHits.map(h=>({kind:h.kind,id:h.unit.id,x:h.x,y:h.y,width:h.width,height:h.height})),sprites:[...r.worldSprites.entries].map(([key,e])=>({key,visible:e.mesh.visible,vertices:[...e.geometry.attributes.position.array]})).sort((a,b)=>a.key.localeCompare(b.key)),unchangedInput:JSON.stringify(window.input.game)===window.original});
      const png=window.capture(),metadata=details();window.frame(11,true);return {png,forced:window.capture(),...metadata,forcedMetadata:details()};
     });
     pictures[variant]=Buffer.from(capture.png,'base64');const forced=await sharp(Buffer.from(capture.forced,'base64')).ensureAlpha().raw().toBuffer(),cached=await sharp(pictures[variant]).ensureAlpha().raw().toBuffer();let referencePixels=0,referenceMax=0;for(let i=0;i<cached.length;i+=4){let diff=false;for(let k=0;k<4;k++){const d=Math.abs(cached[i+k]-forced[i+k]);referenceMax=Math.max(referenceMax,d);if(d)diff=true;}if(diff)referencePixels++;}
     assert(referenceMax<=1,fixture+' '+state+' '+variant+' cache differs from same-scene complete repaint');
     assert.deepEqual(capture.forcedMetadata,Object.fromEntries(Object.entries(capture).filter(([k])=>!['png','forced','forcedMetadata'].includes(k))));
     delete capture.png;delete capture.forced;delete capture.forcedMetadata;metadata[variant]=capture;
     report.reference??=[];report.reference.push({fixture,state,variant,changedPixels:referencePixels,maxChannelDifference:referenceMax});
     fs.writeFileSync(path.join(out,fixture+'-'+variant+'-'+state+'.png'),pictures[variant]);
    }
    const a=await sharp(pictures.baseline).ensureAlpha().raw().toBuffer(),b=await sharp(pictures.candidate).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);let changed=0,maxChannelDifference=0;for(let i=0;i<a.length;i+=4){let different=false;for(let k=0;k<4;k++){const d=Math.abs(a[i+k]-b[i+k]);if(d)different=true;maxChannelDifference=Math.max(maxChannelDifference,d);}if(different)changed++;}
    report.pixels.push({fixture,state,changedPixels:changed,maxChannelDifference,baselineSha256:hash(a),candidateSha256:hash(b)});
    if(changed&&maxChannelDifference>1&&process.argv.includes('--debug-cross-page')){
     const debug={};for(const variant of ['baseline','candidate'])debug[variant]=await pages[variant].evaluate(()=>{const details=()=>({camera:r.cam,zoom:r.zoom,staticKey:r.staticKey,layers:[...r.staticLayers].map(([key,l])=>({key,ready:l.ready})),sprites:[...r.worldSprites.entries].filter(([,e])=>e.kind==='static').map(([key,e])=>({key,bounds:e.bounds,crop:e.crop,visible:e.mesh.visible,depth:e.clipDepth,vertices:[...e.geometry.attributes.position.array],token:[...e.variants.keys()]}))});const before=details();window.frame(11,true);return {before,after:details(),forced:window.capture()};});
     for(const variant of ['baseline','candidate']){fs.writeFileSync(path.join(out,fixture+'-'+variant+'-'+state+'-forced.png'),Buffer.from(debug[variant].forced,'base64'));delete debug[variant].forced;}
     fs.writeFileSync(path.join(out,'pixel-debug.json'),JSON.stringify(debug,null,2));
    }
    // Cross-context transparent-object order can change pixels even after full repaint.
    // Same-context reference comparisons above are the cache equivalence gate.
    assert.deepEqual(metadata.baseline,metadata.candidate);assert(metadata.candidate.unchangedInput);
    if(state==='city-health')assert.notEqual(hash(a),report.pixels.find(p=>p.fixture===fixture&&p.state==='clock').baselineSha256,'Health change must be visible in the tested viewport');
   }
   for(const page of Object.values(pages))await page.close();
   checks.push(fixture+(process.argv.includes('--benchmark-only')?': performance control only':': 11 states retain exact geometry/hits and unchanged input; same-scene cached/full-repaint pixels differ by at most one 8-bit level; cross-context differences recorded separately'));
   fs.writeFileSync(path.join(out,reportFile),JSON.stringify(report,null,2));console.log('Completed '+fixture);
  }
  assert.deepEqual(errors,[]);report.passed=true;
 }finally{
  report.servedSources=Object.fromEntries(assets);fs.writeFileSync(path.join(out,reportFile),JSON.stringify(report,null,2));await browser?.close();await new Promise(r=>server.close(r));
 }
 console.log(JSON.stringify({passed:report.passed,pixels:report.pixels,checks}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
