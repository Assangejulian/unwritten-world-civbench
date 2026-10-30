// Exercise the real map renderers in a disposable world; never contact the live game.
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.HCX_CHECK_OUTPUT||'output/playwright/map-depth-20261016'),before=process.argv.includes('--before');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),R=await import(pathToFileURL(path.join(root,'src/rules.mjs')));
 const g=E.createGame({players:2,size:'huge',seed:'WORLD-DEPTH',barbarians:false});g.units=[];g.cities=[];g.cityStates={version:1,seeded:true,states:[]};for(const tile of g.map.tiles){delete tile.cityState;delete tile.cityStateTerritory;}
 for(const t of g.map.tiles)Object.assign(t,{terrain:'plains',hill:false,feature:null,river:false,riverEdges:[],resource:null,cityId:null,district:null,owner:null,improvement:null,fort:null});
 const tile=(row,col)=>g.map.tiles[row*g.map.width+col],city=E.foundCity(g,g.players[0],E.addUnit(g,0,'settler',tile(24,30).id));
 city.name='阿奎莱亚';city.population=11;g.players[0].techs=Object.keys(R.TECHS).filter(key=>R.TECHS[key].era<=5);city.buildings=['walls','medievalwalls','renaissancewalls'];city.walls=100;city.hp=200;
 const wonder=tile(25,30);wonder.owner=0;wonder.district={kind:'wonder',item:'chichen_itza',city:city.id};g.wonders.chichen_itza={item:'chichen_itza',city:city.id,owner:0,tile:wonder.id,birthGranted:true};
 const back=tile(23,30);back.owner=0;back.district={kind:'wonder',item:'temple_of_heaven',city:city.id};g.wonders.temple_of_heaven={item:'temple_of_heaven',city:city.id,owner:0,tile:back.id,birthGranted:true};
 tile(26,29).terrain='mountain';tile(25,29).fort={owner:0,hp:160};tile(25,29).owner=0;
 g.units=[];const unit=E.addUnit(g,0,'warrior',tile(24,31).id);E.refreshVisibility(g);const projection=E.snapshot(g,-1,{manualOptionsOnly:true});
 const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/')name='/index.html';let file=path.resolve(root,'web','.'+name);if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);if(!['web','src'].some(d=>file.startsWith(path.join(root,d)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}const previous=path.join(out,'before',path.relative(root,file));if(before&&fs.existsSync(previous))file=previous;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;const errors=[],checks=[];let metrics={};
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
  await page.addInitScript(()=>{localStorage.setItem('hex.uiStyle','B');});
  await page.route('**/api/**',async route=>{const name=new URL(route.request().url()).pathname;const body=name==='/api/state'?{game:projection,session:{time:0,paused:true,running:false,busy:false,revision:1,speed:1,world:1}}:name==='/api/drivers'?{drivers:R.CIVS.map(c=>({file:c.file,status:'ready'}))}:name==='/api/saves'?{entries:[],files:[]}:{ok:true};await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.waitForFunction(()=>window.__civ.renderer?.camera);await page.keyboard.press('Tab');
  await page.evaluate(id=>{const r=window.__civ.renderer;window.__depthRender=()=>{r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;};r.reduced=true;r.targetCam=null;r.cam=r.position(r.game.map.tiles[id]);r.zoom=2.8;r.selected={type:'city',id:r.game.cities[0].id};window.__depthRender();},city.tile);
  await page.waitForFunction(()=>window.__civ.renderer.modernizationReady&&window.__civ.renderer.modelsReady);await page.waitForTimeout(1200);
  await page.evaluate(()=>window.__depthRender());await page.waitForTimeout(1200);await page.evaluate(()=>window.__depthRender());await page.screenshot({path:path.join(out,before?'before.png':'after.png')});
  if(!before){
   metrics=await page.evaluate(async({city,wonder,unit})=>{
    const r=window.__civ.renderer,THREE=await import('/vendor/three/three.module.js');
    const entries=[...r.worldSprites.entries.values()],cityArt=entries.find(e=>e.key==='city:'+city.id),wonderArt=entries.find(e=>e.key==='tile:'+wonder.id),unitArt=entries.find(e=>e.key==='unit:'+unit.id);
    if(!cityArt||!wonderArt||!unitArt)throw Error('Missing depth-tested scene objects');
    const target=new THREE.WebGLRenderTarget(1280,900),scene=new THREE.Scene(),pixels=()=>{r.gpu.setRenderTarget(target);r.gpu.setClearColor(0,0);r.gpu.render(scene,r.camera);const data=new Uint8Array(1280*900*4);r.gpu.readRenderTargetPixels(target,0,0,1280,900,data);return data;};
    // Disable blending only in this reference pass, keeping the real artwork
    // alpha cutout and geometry. This isolates depth from edge transparency.
    const ca=cityArt.mesh.clone(),wa=wonderArt.mesh.clone();ca.material=ca.material.clone();wa.material=wa.material.clone();ca.material.transparent=wa.material.transparent=false;
    scene.add(ca);const a=pixels();scene.remove(ca);scene.add(wa);const b=pixels();scene.add(ca);const combined=pixels();scene.remove(ca,wa);scene.add(ca,wa);const reversed=pixels();
    let overlap=0,mismatches=0;for(let i=0;i<a.length;i+=4)if(a[i+3]>200&&b[i+3]>200){overlap++;if([0,1,2].some(k=>Math.abs(combined[i+k]-b[i+k])>1)||[0,1,2,3].some(k=>Math.abs(combined[i+k]-reversed[i+k])>1))mismatches++;}
    ca.material.dispose();wa.material.dispose();target.dispose();r.gpu.setRenderTarget(null);window.__depthRender();
    const materials=entries.map(e=>e.mesh.material);
    return {overlap,mismatches,sceneObjects:entries.length,depthEnabled:materials.every(m=>m.depthTest&&m.depthWrite),labels:r.labelBlocks.filter(l=>l.city!==undefined).length,unitHits:r.unitHits.length,diagnostics:r.diagnostics};
   },{city,wonder,unit});
   assert(metrics.overlap>30,JSON.stringify(metrics));assert.equal(metrics.mismatches,0,'Foreground wonder must cover the rear wall, independent of submission order');assert(metrics.depthEnabled);assert(metrics.labels>0&&metrics.unitHits>0);checks.push('Real overlapping city-wall and wonder opaque pixels respect world depth in both submission orders');checks.push('Units and static artwork share depth testing while city labels retain HUD hit boxes');
   metrics.picking=await page.evaluate(async id=>{
    const r=window.__civ.renderer,THREE=await import('/vendor/three/three.module.js'),hit=r.unitHits.find(h=>h.kind==='sprite'&&h.unit.id===id),art=hit.art;
    let point;for(let y=.2;y<.85&&!point;y+=.025)for(let x=.2;x<.8&&!point;x+=.025){const n=art.frame.resolution;if(art.frame.alpha[Math.floor(y*n)*n+Math.floor(x*n)]<200)continue;const lx=art.left+x*art.size,ly=art.top+y*art.size,xx=art.scaleX*lx+art.shear*ly,sx=art.anchor.x+xx*Math.cos(art.rotation)-ly*Math.sin(art.rotation),sy=art.anchor.y+xx*Math.sin(art.rotation)+ly*Math.cos(art.rotation);if(r.hitUnit(sx,sy)?.id===id)point={x:sx,y:sy};}
    if(!point)throw Error('Visible unit is not selectable');
    const entry=[...r.worldSprites.entries.values()].find(e=>e.key==='unit:'+id),block=new THREE.Mesh(entry.geometry.clone(),new THREE.MeshBasicMaterial({color:0x617351,side:THREE.DoubleSide}));block.geometry.translate(0,36,48);r.scene.add(block);r.contactPass.render(r.scene,r.camera);
    const hidden=r.hitUnit(point.x,point.y)?.id!==id,label=r.unitHits.find(h=>h.kind==='label'&&h.unit.id===id),labelWorks=!label||r.hitUnit(label.x+label.width/2,label.y+label.height/2)?.id===id;
    r.scene.remove(block);block.geometry.dispose();block.material.dispose();window.__depthRender();return {visible:true,hidden,labelWorks};
   },unit.id);assert(metrics.picking.hidden&&metrics.picking.labelWorks,JSON.stringify(metrics.picking));checks.push('Actual GPU depth blocks clicking a unit behind an opaque foreground mesh; HUD name remains selectable');
   metrics.groundInk=await page.evaluate(async()=>{
    const r=window.__civ.renderer,THREE=await import('/vendor/three/three.module.js'),w=Math.round(r.width),h=Math.round(r.height),target=new THREE.WebGLRenderTarget(w,h),sample=()=>{r.gpu.setRenderTarget(target);r.gpu.render(r.contactPass.scene,r.contactPass.camera);const pixels=new Uint8Array(w*h*4);r.gpu.readRenderTargetPixels(target,0,0,w,h,pixels);return pixels;},withMarks=sample(),original=r.contactPass.material.uniforms.groundMarks.value,emptyCanvas=document.createElement('canvas');emptyCanvas.width=emptyCanvas.height=1;const empty=new THREE.CanvasTexture(emptyCanvas);r.contactPass.material.uniforms.groundMarks.value=empty;const without=sample();r.contactPass.material.uniforms.groundMarks.value=original;
    const gc=r.groundMarksCanvas.getContext('2d'),marks=gc.getImageData(0,0,r.groundMarksCanvas.width,r.groundMarksCanvas.height),ratio=r.dpr;let tested=0,bad=0;
    for(const e of r.worldSprites.entries.values()){if(e.kind!=='static')continue;const data=e.canvas.getContext('2d').getImageData(0,0,e.canvas.width,e.canvas.height).data;for(let y=1;y<e.canvas.height-1;y++)for(let x=1;x<e.canvas.width-1;x++){
      if(data[(y*e.canvas.width+x)*4+3]<240)continue;const sx=e.bounds.x+x/e.ratio,sy=e.bounds.y+y/e.ratio,mx=Math.floor(sx*ratio),my=Math.floor(sy*ratio);if(mx<0||my<0||mx>=marks.width||my>=marks.height||marks.data[(my*marks.width+mx)*4+3]<200)continue;
      const i=((h-1-Math.floor(sy))*w+Math.floor(sx))*4;if(i<0||i>=withMarks.length)continue;tested++;if([0,1,2].some(k=>Math.abs(withMarks[i+k]-without[i+k])>1))bad++;
    }}empty.dispose();target.dispose();r.gpu.setRenderTarget(null);window.__depthRender();return {tested,bad};
   });assert(metrics.groundInk.tested>5&&metrics.groundInk.bad===0,JSON.stringify(metrics.groundInk));checks.push('Territory/highlight pixels overlapping opaque building art are suppressed by the ground-depth mask');
   metrics.cache=await page.evaluate(({city,unit})=>{
    const r=window.__civ.renderer;r.reduced=true;window.__depthRender();
    const find=key=>[...r.worldSprites.entries.values()].find(e=>e.key===key),wall=find('city:'+city.id),soldier=find('unit:'+unit.id),wallTexture=wall.mesh.material.map,unitTexture=soldier.mesh.material.map;
    r.cam.x+=24;window.__depthRender();const panReuse=wallTexture===wall.mesh.material.map&&unitTexture===soldier.mesh.material.map;
    const c=r.game.cities.find(c=>c.id===city.id),u=r.game.units.find(u=>u.id===unit.id),walls=c.walls,hp=u.hp;c.walls=0;u.hp=39;window.__depthRender();
    const invalidates=wallTexture!==wall.mesh.material.map&&unitTexture!==soldier.mesh.material.map;c.walls=walls;u.hp=hp;window.__depthRender();
    return {panReuse,invalidates,bounded:[...r.worldSprites.entries.values()].every(e=>e.variants.size<=(e.kind==='static'?1:4))};
   },{city,unit});assert(metrics.cache.panReuse&&metrics.cache.invalidates&&metrics.cache.bounded,JSON.stringify(metrics.cache));checks.push('Camera panning reuses scene textures; actual wall damage and unit health invalidate paint, with bounded pose caches');
   metrics.layouts=[];
   for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(100);
    for(const zoom of [.4,1.1,2.8]){const info=await page.evaluate(zoom=>{const r=window.__civ.renderer;r.zoom=zoom;window.__depthRender();return {zoom:r.zoom,objects:r.worldSprites.entries.size,groundWidth:r.groundMarksCanvas.width,width:r.width,copies:r.visibleCopies};},zoom);assert(info.objects>0);metrics.layouts.push({...viewport,...info});}
   }
   await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(100);metrics.wrap=await page.evaluate(()=>{const r=window.__civ.renderer;r.zoom=r.minimumZoom;r.cam.x=r.cameraBounds.right;window.__depthRender();const count=r.worldSprites.entries.size,copies=[...r.visibleCopies];r.cam.x-=r.cameraBounds.period*3;window.__depthRender();return {copies,count,after:r.worldSprites.entries.size,layers:r.staticLayers.size,visible:r.visibleCopies.length};});assert(metrics.wrap.copies.length>1);assert(metrics.wrap.layers<=metrics.wrap.visible);checks.push('Desktop/mobile resizing, repeated texture reallocations, zoom and wrapped copies retain bounded caches');
   metrics.twoD=await page.evaluate(async()=>{
    const source=window.__civ.renderer;source.menuOpen=true;const {MapRenderer}=await import('/map.js'),canvas=document.createElement('canvas'),mini=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:1280px;height:900px';document.body.append(canvas);const r=new MapRenderer(canvas,mini,()=>{},()=>{});r.menuOpen=true;r.reduced=true;r.setState(window.__civ.game);r.cam=r.position(r.game.map.tiles[r.game.cities[0].tile]);r.targetCam=null;r.zoom=2.8;const calls=[],draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image.src)calls.push(new URL(image.src).pathname);return draw.call(this,image,...args);};try{r.render();}finally{CanvasRenderingContext2D.prototype.drawImage=draw;}const rear=calls.findIndex(p=>p.includes('temple_of_heaven')),wall=calls.findIndex(p=>p.includes('/siege-aviation/')&&p.includes('renaissance')),front=calls.findIndex(p=>p.includes('chichen_itza'));canvas.remove();return {rear,wall,front,labels:r.labelBlocks.filter(b=>b.city!==undefined).length};
   });assert(metrics.twoD.rear<metrics.twoD.wall&&metrics.twoD.wall<metrics.twoD.front&&metrics.twoD.labels>0,JSON.stringify(metrics.twoD));checks.push('Retained 2D paints rear wonder, city wall and front wonder in geographic order before information labels');
   await page.evaluate(()=>{const r=window.__civ.renderer;r.zoom=2.8;r.cam=r.position(r.game.map.tiles[r.game.cities[0].tile]);window.__depthRender();});await page.screenshot({path:path.join(out,'after.png')});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,before?'baseline.json':'checks.json'),JSON.stringify({passed:true,checks,metrics,errors,scope:'Isolated synthetic renderer; no live game/save requests.'},null,2));checks.forEach(c=>console.log('PASS '+c));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
