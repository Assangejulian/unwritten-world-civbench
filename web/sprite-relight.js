// CPU sprite lighting reuses the existing world-sprite draw path.
// Source frames are relit on first CPU use (bounded LRU per frame and facing): pseudo-normals from
// blurred alpha (silhouette "pillow" height) + luminance, lit by the world sun projected to screen,
// rim only on the sun-facing edge, darkened shadow-side edge, foot occlusion. Also a sun-consistent
// ground shadow built from the silhouette.
export const RELIGHT_CACHE_LIMITS=Object.freeze({frames:256,bytes:48*1024*1024});
const cache=new Map();
export const relightStats={frames:0,ms:0,hits:0,shadowFrames:0,cacheFrames:0,cacheBytes:0,evictions:0};
function trim(){while(cache.size>RELIGHT_CACHE_LIMITS.frames||relightStats.cacheBytes>RELIGHT_CACHE_LIMITS.bytes){const [canvas,entry]=cache.entries().next().value;cache.delete(canvas);entry.live=false;relightStats.cacheBytes-=entry.bytes;relightStats.evictions++;}relightStats.cacheFrames=cache.size;}
function cached(canvas){let entry=cache.get(canvas);if(entry){cache.delete(canvas);cache.set(canvas,entry);return entry;}entry={live:true,bytes:canvas.width*canvas.height*4};cache.set(canvas,entry);relightStats.cacheBytes+=entry.bytes;trim();return entry;}
function retain(entry,key,surface){entry[key]=surface;if(entry.live){const bytes=surface.width*surface.height*4;entry.bytes+=bytes;relightStats.cacheBytes+=bytes;trim();}return surface;}
function blur(src,w,h,r){const tmp=new Float32Array(src.length),out=new Float32Array(src.length),n=2*r+1;
  for(let y=0;y<h;y++){let acc=0;for(let x=-r;x<=r;x++)acc+=src[y*w+Math.min(w-1,Math.max(0,x))];for(let x=0;x<w;x++){tmp[y*w+x]=acc/n;acc+=src[y*w+Math.min(w-1,x+r+1)]-src[y*w+Math.max(0,x-r)];}}
  for(let x=0;x<w;x++){let acc=0;for(let y=-r;y<=r;y++)acc+=tmp[Math.min(h-1,Math.max(0,y))*w+x];for(let y=0;y<h;y++){out[y*w+x]=acc/n;acc+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x];}}return out;}
export function relitFrame(canvas,mirrored){
  if(!canvas?.width)return canvas;const entry=cached(canvas),key=mirrored?'m':'n';if(entry[key]){relightStats.hits++;return entry[key];}
  const t0=performance.now(),w=canvas.width,h=canvas.height;let img;try{img=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h);}catch{return canvas;}
  const d=img.data,a=new Float32Array(w*h),lum=new Float32Array(w*h);let top=h,bottom=0;
  for(let i=0;i<w*h;i++){a[i]=d[i*4+3]/255;lum[i]=(d[i*4]*.3+d[i*4+1]*.55+d[i*4+2]*.15)/255;if(a[i]>.3){const y=(i/w)|0;if(y<top)top=y;if(y>bottom)bottom=y;}}
  const r=Math.max(2,Math.round(Math.min(w,h)/28)),soft=blur(blur(a,w,h,r),w,h,r),fine=blur(lum,w,h,1);
  const H=new Float32Array(w*h);for(let i=0;i<w*h;i++)H[i]=Math.sqrt(soft[i])*.8+fine[i]*.15*a[i];
  // Sun [-420,680,-530] seen from the map camera: comes from the left and from behind/up. Mirrored frames flip x before drawing.
  let lx=mirrored?.55:-.55,ly=-.62,lz=.56;const ll=Math.hypot(lx,ly,lz);lx/=ll;ly/=ll;lz/=ll;const K=Math.max(4,r*1.3),span=Math.max(1,bottom-top);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(a[i]<.02)continue;
    const gx=(H[i+1]-H[i-1])*K,gy=(H[i+w]-H[i-w])*K,nl=Math.hypot(gx,gy,1),nx=-gx/nl,ny=-gy/nl,nz=1/nl;
    const diff=nx*lx+ny*ly+nz*lz,edge=Math.max(0,Math.min(1,(1-soft[i])*1.6-.25))*a[i],facing=(nx*lx+ny*ly)/(Math.hypot(nx,ny)*Math.hypot(lx,ly)+1e-5);
    let f=Math.max(.72,.96+.45*(diff-lz));f*=1-edge*Math.max(0,-facing)*.38;
    const foot=Math.max(0,Math.min(1,((y-top)/span-.80)/.20));f*=1-foot*.18;
    const rim=edge*Math.max(0,facing)*.16;
    for(let c=0;c<3;c++){const v=d[i*4+c]*f+rim*(c===0?205:c===1?180:140);d[i*4+c]=v<0?0:v>255?255:v;}}
  const out=document.createElement('canvas');out.width=w;out.height=h;out.getContext('2d').putImageData(img,0,0);retain(entry,key,out);
  relightStats.frames++;relightStats.ms+=performance.now()-t0;return out;}
export function silhouetteShadow(canvas){
  if(!canvas?.width)return null;const entry=cached(canvas);if(entry.shadow){relightStats.hits++;return entry.shadow;}const pad=12;const s=document.createElement('canvas');s.width=canvas.width+pad*2;s.height=canvas.height+pad*2;
  const ctx=s.getContext('2d');ctx.filter='blur(3px)';ctx.drawImage(canvas,pad,pad);ctx.filter='none';ctx.globalCompositeOperation='source-in';ctx.fillStyle='#0b0f0c';ctx.fillRect(0,0,s.width,s.height);s.pad=pad;retain(entry,'shadow',s);relightStats.shadowFrames++;return s;}
// Draw the shadow on the ground plane: flatten the silhouette and shear it away from the sun (to screen lower-right).
export function drawSunShadow(c,frameCanvas,art,scale){
  const s=silhouetteShadow(frameCanvas);if(!s)return;const feet=art.top+art.size-6*scale,k=art.size/frameCanvas.width,pad=s.pad*k;
  c.save();c.translate(art.anchor.x,art.anchor.y+feet);c.globalAlpha=.48;c.transform(1,0,-.75,-.34,0,0);c.scale(art.scaleX,1);
  c.drawImage(s,art.left-pad,art.top-feet-pad,art.size+2*pad,art.size+2*pad);c.restore();}
