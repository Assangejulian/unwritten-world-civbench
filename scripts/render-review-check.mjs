import auditBrowserRuntime from './browser-runtime.cjs';
// Isolated raster checks and cold/cache timings. No game host, saves or paid model.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.resolve(process.env.UI_CHECK_OUTPUT||'output/universe-review-20261023/render');fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><meta charset="utf-8"><title>Raster review</title>');}let file;for(const folder of ['web','src']){const candidate=path.resolve(root,folder,'.'+pathname);if(candidate.startsWith(path.join(root,folder)+path.sep)&&fs.existsSync(candidate)&&fs.statSync(candidate).isFile()){file=candidate;break;}}if(!file){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright'),browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:'+server.address().port);
 const result=await page.evaluate(async()=>{
  const {drawUnitBadge}=await import('/map.js'),{relitFrame,silhouetteShadow,relightStats,RELIGHT_CACHE_LIMITS}=await import('/sprite-relight.js'),bounds=[];
  for(const type of ['warrior','settler','horseman'])for(const active of [false,true])for(const scale of [.72,1,1.18]){
   const c=document.createElement('canvas');c.width=c.height=120;const ctx=c.getContext('2d'),rect=drawUnitBadge(ctx,type,60,60,'#5182cd',{scale,active,secondary:'#b5cce3'}),data=ctx.getImageData(0,0,120,120).data;let painted=0;
   for(let y=0;y<120;y++)for(let x=0;x<120;x++)if(data[(y*120+x)*4+3]>128)painted=Math.max(painted,Math.hypot(x+.5-60,y+.5-60));bounds.push({type,active,scale,hit:rect.width/2,painted});
  }
  const img=new Image();img.src='/assets/warrior-painted-v3.png';await img.decode();const source=document.createElement('canvas');source.width=source.height=128;const c=source.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,img.width/5,img.height/4,0,0,128,128);const before=c.getImageData(0,0,128,128).data.slice();
  const start=performance.now(),lit=relitFrame(source,false),coldMs=performance.now()-start,after=c.getImageData(0,0,128,128).data,rgba=lit.getContext('2d').getImageData(0,0,128,128).data;
  let unchanged=true,alphaSame=true,changedRGB=0;for(let i=0;i<before.length;i++){if(before[i]!==after[i])unchanged=false;if(i%4===3&&before[i]!==rgba[i])alphaSame=false;if(i%4!==3&&before[i]!==rgba[i])changedRGB++;}
  const frames=relightStats.frames,t=performance.now();let cacheSame=true;for(let i=0;i<1000;i++)cacheSame&&=relitFrame(source,false)===lit;const cacheMs=(performance.now()-t)/1000,afterFrames=relightStats.frames,shadow=silhouetteShadow(source),shadowSame=shadow===silhouetteShadow(source),mirrored=relitFrame(source,true);
  for(let i=0;i<300;i++){const frame=document.createElement('canvas');frame.width=frame.height=16;frame.getContext('2d').drawImage(source,0,0,16,16);relitFrame(frame,false);}
  const bounded=relightStats.cacheFrames<=RELIGHT_CACHE_LIMITS.frames&&relightStats.cacheBytes<=RELIGHT_CACHE_LIMITS.bytes,evicted=relitFrame(source,false)!==lit;
  return {bounds,relight:{unchanged,alphaSame,changedRGB,cacheSame,frames,afterFrames,coldMs,cacheMs,shadowSame,mirroredSeparate:mirrored!==lit,sourceSize:[128,128],cachedSurfaceBytes:lit.width*lit.height*4+mirrored.width*mirrored.height*4+shadow.width*shadow.height*4,bounded,evicted,stats:{...relightStats}}};
 });
 assert(result.bounds.every(b=>b.painted<=b.hit+.8),'Badge hit bounds must cover the solid painted ring and chevrons');
 const r=result.relight;assert(r.unchanged&&r.alphaSame&&r.changedRGB>0&&r.cacheSame&&r.shadowSame&&r.mirroredSeparate&&r.bounded&&r.evicted);assert.equal(r.frames,r.afterFrames);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({passed:true,...result,errors,timingScope:'Headless software rendering; not a real-device FPS comparison'},null,2));
 console.log('PASS Eighteen real raster badge bounds cover normal and selected paint');console.log('PASS Relighting preserves source bytes and alpha, separates facing, and reuses relight/shadow surfaces');console.log(JSON.stringify({coldMs:r.coldMs,cacheMs:r.cacheMs,cachedSurfaceBytes:r.cachedSurfaceBytes}));
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
