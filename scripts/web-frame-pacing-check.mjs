// Isolated renderer comparison; no running game, saved worlds or paid model requests.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import runtime from './browser-runtime.cjs';
import {field} from './imperial-fixture.mjs';
import {addUnit,foundCity,snapshot,refreshVisibility} from '../src/engine.mjs';
import {frameDeadline,cameraElapsed,cameraEase} from '../web/frame-pacing.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(process.env.CIV_FRAME_OUTPUT||'output/web-experience-20261024');fs.mkdirSync(out,{recursive:true});
const pacing=[];
for(const refresh of [30,60,120,144]){let previous=0,frames=0;for(let i=1;i<=refresh*3;i++){const due=frameDeadline(previous,i*1000/refresh);if(due!==null){previous=due;frames++;}}assert(Math.abs(frames-Math.min(refresh,60)*3)<=1);pacing.push({refresh,frames,seconds:3});}
const eased=hz=>{let x=0,last=0;for(let i=1;i<=hz;i++){const t=i/hz;x+=(100-x)*cameraEase(cameraElapsed(last,t));last=t;}return x;};assert(Math.abs(eased(30)-eased(60))<1e-8);assert(Math.abs(eased(60)-eased(144))<1e-8);
const f=field();foundCity(f.g,f.p,addUnit(f.g,0,'settler',f.tile(16,11).id));for(const [i,type]of ['warrior','settler','archer','builder'].entries())addUnit(f.g,0,type,f.tile(17+i,11).id);f.tile(16,10).resource='iron';refreshVisibility(f.g);const game=snapshot(f.g,-1,{manualOptionsOnly:true});
const html=variant=>`<!doctype html><style>html,body{margin:0;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%}#minimap{display:none}</style><canvas id="map"></canvas><canvas id="minimap" width="200" height="120"></canvas><script type="module">
import {MapRenderer} from '/${variant}/map3d.js';
const game=await fetch('/fixture').then(r=>r.json());const r=window.r=new MapRenderer(document.querySelector('#map'),document.querySelector('#minimap'),()=>{},()=>{});r.menuOpen=true;r.setState(game);r.reduced=true;r.zoom=1.1;r.cam=r.position(game.map.tiles[game.cities.at(-1).tile]);r.targetCam=null;window.baseCam={...r.cam};
window.step=(time=11)=>{r.menuOpen=false;r.time=time;r.setSimulationState({time,running:false});try{r.render();}finally{r.menuOpen=true;}};
window.capture=()=>{const c=document.createElement('canvas');c.width=r.width;c.height=r.height;const x=c.getContext('2d');x.drawImage(r.groundCanvas,0,0,c.width,c.height);x.drawImage(r.canvas,0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];};window.ready=true;
</script>`;
const server=createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname);if(name==='/fixture'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(game));return;}if(name==='/'){res.setHeader('Content-Type','text/html');res.end(html(url.searchParams.get('variant')||'candidate'));return;}
 let file;const match=name.match(/^\/(baseline|candidate)\/(.+)$/);if(match){const before=path.join(out,'before/web',match[2]);file=match[1]==='baseline'&&fs.existsSync(before)?before:path.join(root,'web',match[2]);}else for(const base of ['web','src']){const p=path.resolve(root,base,'.'+name);if(p.startsWith(path.join(root,base)+path.sep)&&fs.existsSync(p)&&fs.statSync(p).isFile()){file=p;break;}}
 if(!file||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await runtime.load('playwright').chromium.launch({headless:true,executablePath:runtime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const results=[],errors=[];
try{for(const variant of ['baseline','candidate']){
 if(variant==='baseline'&&!fs.existsSync(path.join(out,'before/web/map3d.js')))continue;
 const page=await browser.newPage({viewport:{width:960,height:640}});page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/?variant=${variant}`);await page.waitForFunction(()=>window.ready,{timeout:30000});
 for(let i=0;i<8;i++){await page.evaluate(()=>window.step());await page.waitForTimeout(500);if(i>3&&!await page.evaluate(()=>r.dirty))break;}
 const data=await page.evaluate(()=>{const initial=r.staticFrames||0,reference=r.contactPass.captureGround.bind(r.contactPass);let captures=0,paintMs=0,paints=0;const draw=r.drawStaticOverlay.bind(r);r.drawStaticOverlay=(...args)=>{const begin=performance.now();draw(...args);paintMs+=performance.now()-begin;paints++;};r.contactPass.captureGround=(...args)=>{captures++;return reference(...args);};
 const timings=[];for(let i=1;i<=12;i++){r.cam={x:baseCam.x-i*4/r.zoom,y:baseCam.y-i*2/(r.zoom*.6)};if(r.markCameraDirty)r.markCameraDirty();else r.dirty=true;const begin=performance.now();window.step();timings.push(performance.now()-begin);}
 const cached=window.capture(),beforeBlocks=r.labelBlocks.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height}));r.dirty=true;window.step();const fresh=window.capture(),afterBlocks=r.labelBlocks.map(b=>({x:b.x,y:b.y,width:b.width,height:b.height}));return {staticFrames:(r.staticFrames||0)-initial,panPaints:paints-1,panPaintMs:paintMs,timings,captures,cached,fresh,beforeBlocks,afterBlocks,terrainBakes:r.lightingBakeCount};});
 for(const key of ['cached','fresh'])fs.writeFileSync(path.join(out,`${variant}-${key}.png`),Buffer.from(data[key],'base64'));
 if(variant==='candidate'){
  assert(data.panPaints<4,'Short pans must reuse the static sheet');assert(data.captures>=12,'Panning must refresh the ground depth reference');assert.equal(data.beforeBlocks.length,data.afterBlocks.length,'Cached city hit regions were lost');for(let i=0;i<data.beforeBlocks.length;i++)for(const key of ['x','y','width','height'])assert(Math.abs(data.beforeBlocks[i][key]-data.afterBlocks[i][key])<.001,'Cached label hit region drift');
  const sharp=runtime.load('sharp'),a=await sharp(Buffer.from(data.cached,'base64')).raw().toBuffer(),b=await sharp(Buffer.from(data.fresh,'base64')).raw().toBuffer();let changed=0,total=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d>12)changed++;total+=d;}data.rasterDifference={mean:total/a.length,largeFraction:changed/a.length};assert(data.rasterDifference.mean<2&&data.rasterDifference.largeFraction<.02,'Pan cache changed the visible image');
  data.invalidations=await page.evaluate(()=>{
    const samples=[];const check=(name,change)=>{const before=r.staticFrames||0;change();window.step();samples.push({name,rebuilt:(r.staticFrames||0)>before});};
    check('asset-or-content-arrival',()=>{r.dirty=true;r.cam.x+=2/r.zoom;});
    check('resource-layer',()=>{r.showResources=!r.showResources;r.unitFrame=true;});
    check('hover',()=>{r.hovered=1;r.unitFrame=true;});
    check('selection',()=>{r.selected={type:'city',id:r.game.cities.at(-1).id,tile:r.game.cities.at(-1).tile};r.unitFrame=true;});
    check('zoom',()=>{r.zoom*=1.05;r.markCameraDirty();});
    check('sheet-boundary',()=>{r.cam.x+=160/r.zoom;r.markCameraDirty();});
    check('new-state',()=>{r.setState({...r.game,cities:r.game.cities.map(c=>({...c,hp:Math.max(1,c.hp-1)}))});});
    return samples;
  });assert(data.invalidations.every(s=>s.rebuilt),'Content, visibility-affecting state or camera boundaries reused stale paint');
  await page.mouse.move(460,300);await page.evaluate(()=>window.step());await page.mouse.down();
  const dragStart=await page.evaluate(()=>({cam:{...r.cam},static:r.staticFrames||0}));
  for(let i=1;i<=6;i++){await page.mouse.move(460+i*5,300+i*2);await page.evaluate(()=>window.step());}
  data.pointerDrag=await page.evaluate(start=>({moved:Math.hypot(r.cam.x-start.cam.x,r.cam.y-start.cam.y),staticPaints:(r.staticFrames||0)-start.static}),dragStart);await page.mouse.up();assert(data.pointerDrag.moved>10&&data.pointerDrag.staticPaints<3,'Real pointer dragging did not reuse the static overlay');
  data.motion=await page.evaluate(async()=>{
    const {createJourney}=await import('/unit-animation.js'),unit=r.game.units.find(u=>u.type==='warrior'),start=r.position(r.game.map.tiles[unit.tile]);
    r.reduced=false;r.effects=[];r.unitJourneys.clear();r.unitTurns.clear();r.unitJourneys.set(unit.id,createJourney(unit.type,[start,{x:start.x+61,y:start.y}],0,11));
    const positions=[];for(let i=1;i<=30;i++){window.step(11+i/60);const hit=r.unitHits.find(h=>h.unit.id===unit.id&&h.kind==='sprite');if(hit?.ground)positions.push(hit.ground.x);}
    return {samples:positions.length,distinct:new Set(positions.map(x=>x.toFixed(5))).size,monotonic:positions.every((x,i)=>!i||x>=positions[i-1]-.0001)};
  });assert(data.motion.samples===30&&data.motion.distinct>18&&data.motion.monotonic,'Actual rendered marching positions lost interpolation or advanced inconsistently');
 }
 delete data.cached;delete data.fresh;results.push({variant,...data});await page.close();
}assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'frame-checks.json'),JSON.stringify({passed:true,pacing,easeInvariant:true,results,errors,scope:'Deterministic isolated raster/CPU comparison with software WebGL; not a real-device 60 FPS guarantee'},null,2));console.log(JSON.stringify({passed:true,pacing,results:results.map(({variant,panPaints,panPaintMs,rasterDifference})=>({variant,panPaints,panPaintMs,rasterDifference}))}));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
