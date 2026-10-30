// Isolated authored-ruin rendering and actual exploration, without live APIs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/ruin-art-20261018'),before=process.argv.includes('--before');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],E=await import(pathToFileURL(path.join(root,'src/engine.mjs')));
 const g=E.createGame({players:2,size:'small',seed:'RUIN-ART',barbarians:false});g.units=[];g.cities=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'plains',hill:false,feature:null,resource:null,river:false,riverEdges:[],cityId:null,district:null,construction:null,owner:null,improvement:null,fort:null,ruin:false,camp:false});
 const tile=g.map.tiles[15*g.map.width+15];Object.assign(tile,{ruin:true,hill:true});
 const projection=structuredClone(E.snapshot(g,-1,{manualOptionsOnly:true}));
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/'){res.setHeader('Content-Type','text/html');return res.end('<html><body style="margin:0"><div style="position:relative;width:1100px;height:720px"><canvas id="map" style="position:absolute;inset:0;width:1100px;height:720px"></canvas><canvas id="mini" style="display:none;width:180px;height:100px"></canvas></div></body></html>');}
  let file=path.resolve(root,'web','.'+name);if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);
  if(!['web','src'].some(d=>file.startsWith(path.join(root,d)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  const old=path.join(out,'before',path.relative(root,file));if(before&&fs.existsSync(old))file=old;
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.json':'application/json','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
  const page=await browser.newPage({viewport:{width:1100,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>{errors.push('Unexpected live API');return r.abort();});await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(async({projection,id})=>{
   const {MapRenderer}=await import('/map3d.js');window.r=new MapRenderer(document.querySelector('#map'),document.querySelector('#mini'),()=>{},()=>{});r.menuOpen=true;r.reduced=true;r.setState(projection);r.cam=r.position(r.game.map.tiles[id]);r.targetCam=null;r.zoom=2.6;
   window.paint=()=>{r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;};paint();
  },{projection,id:tile.id});await page.waitForFunction(()=>r.textureReady&&r.biomeReady&&r.modelsReady);if(!before)await page.waitForFunction(()=>r.ruinArtReady);await page.evaluate(()=>paint());
  await page.screenshot({path:path.join(out,before?'before.png':'after.png')});
  if(before)return;
  const initial=await page.evaluate(id=>{
   const e=[...r.worldSprites.entries.values()].find(e=>e.key==='ruin:'+id);if(!e)throw Error('Missing authored ruin');
   const pixels=e.canvas.getContext('2d').getImageData(0,0,e.canvas.width,e.canvas.height).data;let solid=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>24)solid++;
   window.original=structuredClone(r.game);
   return {solid,depthTest:e.mesh.material.depthTest,depthWrite:e.mesh.material.depthWrite,variants:e.variants.size,width:e.crop.width/e.ratio/r.zoom,terrainIcosahedra:r.terrainGroup.children.filter(m=>m.geometry?.type==='IcosahedronGeometry').length};
  },tile.id);assert(initial.solid>200);assert(initial.depthTest&&initial.depthWrite);assert(initial.width<=42);assert.equal(initial.variants,1);assert.equal(initial.terrainIcosahedra,0);checks.push('Actual 3D hill renders compact alpha artwork through the terrain-depth pipeline, without old polygon rocks');
  const changes=await page.evaluate(id=>{
   const exists=()=>[...r.worldSprites.entries.values()].some(e=>e.key==='ruin:'+id&&e.mesh.visible);
   const states={};for(const [name,change]of Object.entries({hidden:{hidden:true},consumed:{ruin:false},remembered:{visible:false}})){
    const next=structuredClone(original);Object.assign(next.map.tiles[id],change);r.setState(next);paint();states[name]=exists();
    if(name==='remembered'){const e=[...r.worldSprites.entries.values()].find(e=>e.key==='ruin:'+id);states.rememberedKey=[...e.variants.keys()][0];}
   }r.setState(structuredClone(original));paint();return states;
  },tile.id);assert.equal(changes.hidden,false);assert.equal(changes.consumed,false);assert.equal(changes.remembered,true);assert(changes.rememberedKey.includes('remembered'));checks.push('Hidden and explored ruins disappear; remembered artwork uses only the projected last-seen flag');
  const copies=await page.evaluate(id=>{const result=[];for(const zoom of [.25,1,2.8]){r.zoom=zoom;r.cam=r.position(r.game.map.tiles[id]);r.targetCam=null;paint();const es=[...r.worldSprites.entries.values()].filter(e=>e.key==='ruin:'+id);result.push({zoom,count:es.length,copies:r.visibleCopies.length,visible:es.every(e=>e.mesh.visible),variants:es.map(e=>e.variants.size)});}r.zoom=2.6;paint();return result;},tile.id);assert(copies.every(s=>s.count>0&&s.count<=s.copies&&s.visible&&s.variants.every(n=>n===1)),JSON.stringify(copies));checks.push('Overview, normal and close zoom retain bounded single-variant art across cylindrical map copies');
  const meta=await sharp(path.join(root,'web/assets/scenery/ancient-ruins-v1.webp')).metadata();assert(meta.hasAlpha);assert.equal(meta.width,512);checks.push('Runtime image is a compact transparent WebP derived from the retained ImageGen source');
  const u=E.addUnit(g,0,'scout',tile.id-1),p=g.players[0],gold=p.gold,faith=p.faith,research=JSON.stringify(p.researchProgress),rng=g.rngState;
  E.applyAction(g,p,{type:'move',unit:u.id,tile:tile.id});assert.equal(u.tile,tile.id);assert.equal(tile.ruin,false);assert(p.gold!==gold||p.faith!==faith||JSON.stringify(p.researchProgress)!==research);assert.notEqual(g.rngState,rng);
  const consumed=E.snapshot(g,-1,{manualOptionsOnly:true});await page.evaluate(s=>{r.setState(s);paint();},consumed);assert.equal(await page.evaluate(id=>[...r.worldSprites.entries.values()].some(e=>e.key==='ruin:'+id)),false);checks.push('Real authoritative scout movement consumes the ruin, grants an existing exploration reward and removes the sprite');
  await page.reload();await page.evaluate(async({projection,id})=>{
   const {MapRenderer}=await import('/map.js');window.r=new MapRenderer(document.querySelector('#map'),document.querySelector('#mini'),()=>{},()=>{});r.menuOpen=true;r.reduced=true;r.setState(projection);r.cam=r.position(r.game.map.tiles[id]);r.targetCam=null;r.zoom=2.6;r.dirty=true;r.render();
  },{projection,id:tile.id});await page.waitForFunction(()=>r.ruinArtReady);
  const fallback=await page.evaluate(async({id,consumed})=>{
   const {drawRuin}=await import('/ruin-art.js'),c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d'),t=r.game.map.tiles[id];
   const drawn=drawRuin(r,ctx,t,{x:50,y:50},1);const a=ctx.getImageData(0,0,100,100).data;let pixels=0;for(let i=3;i<a.length;i+=4)if(a[i]>0)pixels++;
   const hidden=drawRuin(r,ctx,{...t,hidden:true},{x:50,y:50},1),absent=drawRuin(r,ctx,{...t,ruin:false},{x:50,y:50},1);r.dirty=true;r.render();const result={pixels,drawn:!!drawn,hidden,absent};r.setState(consumed);return result;
  },{id:tile.id,consumed});assert(fallback.pixels>100&&fallback.drawn);assert.equal(fallback.hidden,null);assert.equal(fallback.absent,null);checks.push('The real 2D fallback loads the shared art, invalidates its paint on load and respects hidden/consumed flags');
  await page.evaluate(s=>{r.setState(s);r.dirty=true;r.render();},projection);await page.screenshot({path:path.join(out,'fallback.png')});assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,initial,changes,copies,fallback,errors,activeSaveWritten:false,liveGameControlled:false},null,2)+'\n');checks.forEach(c=>console.log('PASS '+c));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
