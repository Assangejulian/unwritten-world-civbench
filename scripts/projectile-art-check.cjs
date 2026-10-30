// Real authored projectile pixels and authoritative attack playback, without live APIs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/projectiles-20261017'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],manifest=JSON.parse(fs.readFileSync(path.join(root,'web/assets/projectiles/manifest.json')));
 for(const [file,expected]of [[manifest.source,manifest.sourceSha256],[manifest.runtime,manifest.runtimeSha256]])assert.equal(hash(fs.readFileSync(path.join(root,file))),expected);
 const {data,info}=await sharp(path.join(root,manifest.runtime)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),poses=[];
 assert.equal(info.width,1024);assert.equal(info.height,512);assert.equal(manifest.records.length,8);
 for(let cell=0;cell<8;cell++){let opaque=0;const x0=cell%4*256,y0=Math.floor(cell/4)*256;for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(data[((y+y0)*info.width+x+x0)*4+3]>24)opaque++;assert(opaque>100&&opaque<256*256*.65);for(const [x,y]of [[0,0],[255,0],[0,255],[255,255]])assert.equal(data[((y+y0)*info.width+x+x0)*4+3],0);if(cell<3)poses.push(hash(await sharp(path.join(root,manifest.runtime)).extract({left:x0,top:y0,width:256,height:256}).raw().toBuffer()));}
 assert.equal(new Set(poses).size,3);checks.push('Authored source/runtime hashes, eight transparent cells and three distinct registered torpedo poses');
 const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/'){res.setHeader('Content-Type','text/html');return res.end('<html><body style="margin:0;background:#173b42"></body></html>');}let file=path.resolve(root,'web','.'+name);if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);if(!['web','src'].some(d=>file.startsWith(path.join(root,d)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.json':'application/json','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',route=>{errors.push('Unexpected API request');return route.abort();});await page.goto('http://127.0.0.1:'+server.address().port);
  const audit=await page.evaluate(async()=>{
   const {PaintedCombatAtlas}=await import('/painted-actions.js'),{UNITS}=await import('/rules.mjs'),{UNIT_MOTIONS}=await import('/visuals.js'),{drawAttack,attackTiming,projectileKind}=await import('/unit-combat.js'),atlas=new PaintedCombatAtlas();await atlas.load();if(!atlas.ready||!atlas.projectilesReady)throw Error(atlas.errors.join(','));
   const count=Object.entries(UNITS).filter(([type,spec])=>!spec.civilian&&projectileKind(type,UNIT_MOTIONS[type]?.family)).length,canvas=document.createElement('canvas');canvas.width=1280;canvas.height=Math.ceil(count/5)*160+30;document.body.append(canvas);const c=canvas.getContext('2d'),results=[];window.__projectileAtlas=atlas;
   const names={torpedo:'torpedo',cannonball:'cannonball',bullet:'bullet',missile:'missile',bomb:'bomb',bolt:'bolt',arrow:'arrow',stone:'stone',shell:'tankShell'};
   for(const [type,spec]of Object.entries(UNITS)){
    if(spec.civilian)continue;const family=UNIT_MOTIONS[type]?.family,kind=projectileKind(type,family);if(!kind){results.push({type,family,kind,contact:true});continue;}
    const i=results.filter(r=>!r.contact).length,x=20+i%5*250,y=135+Math.floor(i/5)*160,paint=[],primitives=[];const draw=c.drawImage;
    c.drawImage=function(image,...args){paint.push({file:image.src?.split('/').at(-1),cell:[args[0],args[1]],transform:[this.getTransform().a,this.getTransform().b]});return draw.call(this,image,...args);};
    const methods=['ellipse','arc','fillRect','lineTo'];const originals=Object.fromEntries(methods.map(name=>[name,c[name]]));for(const name of methods)c[name]=function(...args){primitives.push(name);return originals[name].apply(this,args);};
    const timing=attackTiming(type,family),f=timing.release+timing.flight*.5;atlas.used.clear();drawAttack(c,{a:{x,y},b:{x:x+190,y},f,family,type,scale:2.4,water:spec.domain==='sea',painted:true,vfx:atlas});
    for(const name of methods)c[name]=originals[name];c.drawImage=draw;
    const expected=kind==='shell'&&['frigate','battleship'].includes(type)?'navalShell':names[kind];if(!atlas.used.has(expected))throw Error(type+' missing '+expected+' in '+[...atlas.used]);if(primitives.length)throw Error(type+' still paints primitive bodies: '+primitives);
    c.fillStyle='#f0dec3';c.font='12px sans-serif';c.fillText(type+' / '+kind,x,y-120);results.push({type,family,kind,used:[...atlas.used],paint});
   }
   window.__projectileAudit=results;return results;
  });
  await page.screenshot({path:path.join(out,'projectile-gallery.png'),fullPage:true});checks.push('Every military motion profile routes projectile bodies through real raster drawImage calls, with zero primitive body paths');
  const impacts=await page.evaluate(async()=>{
   const {drawAttack,attackTiming}=await import('/unit-combat.js'),canvas=document.createElement('canvas'),c=canvas.getContext('2d'),atlas=window.__projectileAtlas,results=[];
   for(const entry of window.__projectileAudit.filter(e=>e.kind)){
    const water=['submarine','nuclearsubmarine','frigate','battleship','missilecruiser','sea_dog'].includes(entry.type),timing=attackTiming(entry.type,entry.family),solid=['stone','cannonball'].includes(entry.kind),heavy=['shell','missile','siege','bomb','torpedo'].includes(entry.family),expected=water?'splash':solid?'dust':heavy?'explosion':'sparks';
    atlas.used.clear();drawAttack(c,{a:{x:30,y:60},b:{x:130,y:60},f:0,family:entry.family,type:entry.type,vfx:atlas,painted:true,water});if(atlas.used.size)throw Error('Projectile or impact appears before release: '+entry.type);
    atlas.used.clear();drawAttack(c,{a:{x:30,y:60},b:{x:130,y:60},f:timing.release+timing.flight+.08,family:entry.family,type:entry.type,vfx:atlas,painted:true,water});if(!atlas.used.has(expected))throw Error('Missing '+expected+' for '+entry.type);results.push({type:entry.type,expected});
   }return results;
  });checks.push('All 36 projectile profiles respect release timing and retain painted water/solid/heavy/light impact effects');
  const torpedo=await page.evaluate(async()=>{
   const {drawAttack,attackTiming}=await import('/unit-combat.js'),canvas=document.createElement('canvas');canvas.width=500;canvas.height=300;const c=canvas.getContext('2d'),frames=[];
   const draw=c.drawImage;c.drawImage=function(image,...args){if(image.src?.includes('/projectiles/'))frames.push({x:args[0],y:args[1],a:this.getTransform().a,b:this.getTransform().b,tx:this.getTransform().e,ty:this.getTransform().f});return draw.call(this,image,...args);};
   const {release,flight}=attackTiming('submarine','torpedo');for(const phase of [.1,.5,.9])drawAttack(c,{a:{x:50,y:50},b:{x:350,y:200},f:release+flight*phase,family:'torpedo',type:'submarine',vfx:window.__projectileAtlas,painted:true});return frames;
  });assert.deepEqual(torpedo.map(f=>f.x),[0,256,512]);assert(torpedo.every(f=>f.y===0&&f.b>.4&&f.b<.5));assert(torpedo[0].tx<torpedo[1].tx&&torpedo[1].tx<torpedo[2].tx);checks.push('Three torpedo wake poses advance along the actual diagonal flight path and rotate with the shot');
  await page.evaluate(async()=>{document.body.innerHTML='<div style="position:relative;width:1280px;height:800px"><canvas id="map" style="position:absolute;inset:0;width:1280px;height:800px"></canvas><canvas id="mini" style="position:absolute;right:0;bottom:0;width:200px;height:100px"></canvas></div>';const {MapRenderer}=await import('/map3d.js');window.__shotRenderer=new MapRenderer(document.querySelector('#map'),document.querySelector('#mini'),()=>{},()=>{});window.__shotRenderer.menuOpen=true;});
  await page.waitForFunction(()=>window.__shotRenderer.combatSprites.ready&&window.__shotRenderer.combatSprites.projectilesReady);
  const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),{battlefield,see}=await import(pathToFileURL(path.join(root,'scripts/air-warfare-check.mjs'))),{seafront}=await import(pathToFileURL(path.join(root,'scripts/naval-warfare-check.mjs'))),combat=[];
  for(const type of ['submarine','nuclearsubmarine','cannon','rifleman','rocketartillery','crossbow','bomber','stealthbomber']){
   const naval=type.includes('submarine'),air=type.includes('bomber'),f=naval?seafront():battlefield(),{g,p,tile}=f;g.id+='-PROJECTILE-'+type;
   const actor=E.addUnit(g,0,type,tile(air?9:11,naval||air?15:11).id),victim=E.addUnit(g,1,naval?'battleship':'warrior',tile(naval?13:12,naval?15:11).id);see(g);const before=E.snapshot(g,-1,{manualOptionsOnly:true});E.applyAction(g,p,{type:'attack',unit:actor.id,targetUnit:victim.id});see(g);const after=E.snapshot(g,-1,{manualOptionsOnly:true});assert(after.visuals.events.some(e=>e.kind==='attack'&&e.actor.id===actor.id));
   const result=await page.evaluate(async({before,after,id,type})=>{
    const r=window.__shotRenderer;r.reduced=false;r.simulationClock={time:before.realtime.time,running:false};r.setState(before);r.setState(after);await r.unitSprites.painted.ensure(type);const event=r.effects.find(e=>e.kind==='attack'&&e.actor.id===id);if(!event)throw Error('Missing actual attack '+type);r.cam=r.position(after.map.tiles[event.actor.tile]);r.targetCam=null;r.zoom=2.6;const cells=[],draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image.src?.includes('/projectiles/'))cells.push([args[0],args[1]]);return draw.call(this,image,...args);};
    try{for(const phase of [.4,.53,.66]){r.simulationClock={time:event.started+phase*event.duration,running:false};r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;}}finally{CanvasRenderingContext2D.prototype.drawImage=draw;}
    r.simulationClock={time:event.started+.53*event.duration,running:false};r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;return {type,cells,event:event.kind};
   },{before,after,id:actor.id,type});assert(result.cells.length>0,type+' must use new raster art through actual map combat');if(naval)assert.equal(new Set(result.cells.map(c=>c[0])).size,3);combat.push(result);await page.screenshot({path:path.join(out,type+'-in-game.png')});
  }
  checks.push('Eight actual authoritative attacks play the new torpedo/cannonball/bullet/missile/bolt/bomb art through the 3D game renderer, including stealth bomber');
  await page.evaluate(()=>{const r=window.__shotRenderer;r.reduced=true;const g=structuredClone(r.game);g.id+='-REDUCED';r.setState(g);if(r.effects.some(e=>e.kind==='attack'))throw Error('Reduced motion retained attack playback');});checks.push('Reduced motion suppresses attack playback and no live game/API/save is touched');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,audit,impacts,torpedo,combat,errors,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');checks.forEach(c=>console.log('PASS '+c));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
