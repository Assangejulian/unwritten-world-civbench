// A cached cartographic veil. Only projected, discovered hexagons enter the mask.
// The noise is anchored to world space. A sheet larger than the viewport is reused
// while panning or playing idle units; visibility, terrain and large zoom changes rebuild it.
const fract=x=>x-Math.floor(x);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
const mix=(a,b,t)=>a+(b-a)*t;
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
export function paintChartPaper(c,w,h){
 c.save();const image=c.createImageData(w,h),d=image.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,grain=(hash(x,y)-.5)*9,cloud=(noise(x/120,y/120)-.5)*20+(noise(x/31,y/31)-.5)*8,edge=Math.pow(Math.hypot((x-w/2)/w,(y-h/2)/h),2)*13;d[i]=218+cloud+grain-edge;d[i+1]=201+cloud+grain-edge;d[i+2]=161+cloud+grain-edge;d[i+3]=255;}c.putImageData(image,0,0);
 // Sparse navigation lines and paper folds, rather than a square screen grid.
 c.lineWidth=.65;c.strokeStyle='#69582f24';const cx=w*.19,cy=h*.72;
 for(let i=0;i<12;i++){const a=i*Math.PI/12;c.beginPath();c.moveTo(cx-Math.cos(a)*w*2,cy-Math.sin(a)*w*2);c.lineTo(cx+Math.cos(a)*w*2,cy+Math.sin(a)*w*2);c.stroke();}
 for(const x of [w*.32,w*.67]){const fold=c.createLinearGradient(x-8,0,x+9,0);fold.addColorStop(0,'#75603500');fold.addColorStop(.44,'#75603519');fold.addColorStop(.52,'#fff6d525');fold.addColorStop(1,'#fff6d500');c.fillStyle=fold;c.fillRect(x-8,0,17,h);}
 c.translate(cx,cy);c.strokeStyle='#69582f38';c.fillStyle='#69582f25';c.beginPath();c.arc(0,0,47,0,Math.PI*2);c.stroke();
 for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?30:59;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a+.35)*10,Math.sin(a+.35)*10);c.lineTo(0,0);c.closePath();c.fill();c.stroke();}c.restore();
}
const SCALE=.5,SY=.6,SHEET_PAD=.5,MAX_SHEET=2200;
function sheetSize(viewW,viewH){
 let padX=Math.ceil(viewW*SHEET_PAD),padY=Math.ceil(viewH*SHEET_PAD),sheetW=viewW+padX*2,sheetH=viewH+padY*2;
 if(sheetW>MAX_SHEET){padX=Math.max(8,Math.floor((MAX_SHEET-viewW)/2));sheetW=viewW+padX*2;}
 if(sheetH>MAX_SHEET){padY=Math.max(8,Math.floor((MAX_SHEET-viewH)/2));sheetH=viewH+padY*2;}
 return {padX,padY,sheetW,sheetH};
}
function sheetWindow(cache,r){
 const zoomRatio=cache.zoom/r.zoom;
 if(zoomRatio<.92||zoomRatio>1.08)return null;
 const srcW=cache.viewW*zoomRatio,srcH=cache.viewH*zoomRatio;
 const srcX=cache.sheetW/2+(r.cam.x-cache.camX)*cache.zoom*SCALE-srcW/2;
 const srcY=cache.sheetH/2+(r.cam.y-cache.camY)*cache.zoom*SY*SCALE-srcH/2;
 if(srcX<1||srcY<1||srcX+srcW>cache.sheetW-1||srcY+srcH>cache.sheetH-1)return null;
 return {x:srcX,y:srcY,w:srcW,h:srcH};
}
function presentFog(r,c,cache,src){
 const frame=cache.frame;
 if(frame.width!==cache.viewW||frame.height!==cache.viewH){frame.width=cache.viewW;frame.height=cache.viewH;}
 const p=frame.getContext('2d');p.setTransform(1,0,0,1,0,0);p.globalCompositeOperation='source-over';p.clearRect(0,0,frame.width,frame.height);
 if(r.chartCanvas)p.drawImage(r.chartCanvas,0,0,frame.width,frame.height);
 else{if(cache.paper.width!==frame.width||cache.paper.height!==frame.height){cache.paper.width=frame.width;cache.paper.height=frame.height;paintChartPaper(cache.paper.getContext('2d'),frame.width,frame.height);}p.drawImage(cache.paper,0,0);}
 p.globalCompositeOperation='destination-in';p.drawImage(cache.soft,src.x,src.y,src.w,src.h,0,0,frame.width,frame.height);p.globalCompositeOperation='source-over';
 c.save();c.drawImage(frame,0,0,r.width,r.height);c.restore();
}
export function drawChartFog(r,c){
 if(!r.game.map.tiles.some(t=>t.hidden||t.visible===false))return;
 const viewW=Math.max(1,Math.ceil(r.width*SCALE)),viewH=Math.max(1,Math.ceil(r.height*SCALE));
 if(r.chartFogTiles!==r.game.map.tiles){r.chartFogTiles=r.game.map.tiles;r.chartFogVisibility=r.game.map.tiles.map(t=>t.hidden?'0':t.visible===false?'2':'1').join('');}
 const revision=r.chartFogVisibility;
 let cache=r.chartFog;
 const window=cache&&cache.gameId===r.game.id&&cache.revision===revision&&cache.terrain===r.terrainRevision&&cache.viewW===viewW&&cache.viewH===viewH?sheetWindow(cache,r):null;
 if(window){presentFog(r,c,cache,window);return;}
 const size=sheetSize(viewW,viewH);
 cache=r.chartFog||{frame:document.createElement('canvas'),paper:document.createElement('canvas'),mask:document.createElement('canvas'),memory:document.createElement('canvas'),soft:document.createElement('canvas'),builds:0};
 const {mask,soft,memory}=cache;
 for(const el of [mask,soft,memory])if(el.width!==size.sheetW||el.height!==size.sheetH){el.width=size.sheetW;el.height=size.sheetH;}
 const m=mask.getContext('2d',{willReadFrequently:true}),s=soft.getContext('2d',{willReadFrequently:true}),mc=memory.getContext('2d',{willReadFrequently:true});
 const savedWidth=r.width,savedHeight=r.height,savedOffset=r.renderOffset||0;
 r.width=savedWidth+size.padX/SCALE*2;r.height=savedHeight+size.padY/SCALE*2;
 try{
  m.setTransform(SCALE,0,0,SCALE,0,0);m.clearRect(0,0,r.width,r.height);m.fillStyle='#fff';mc.setTransform(SCALE,0,0,SCALE,0,0);mc.clearRect(0,0,r.width,r.height);
  for(const cycle of r.visibleCopies||[0]){r.renderOffset=cycle*(r.cameraBounds?.period||0);for(const t of r.viewportTiles()){
   if(t.hidden)continue;
   if(r.fillTile){r.fillTile(m,t.id,'#fff');if(t.visible===false)r.fillTile(mc,t.id,'#fff');}else{const a=r.screen(t);m.beginPath();for(let k=0;k<6;k++){const angle=(k*60-30)*Math.PI/180,x=a.x+Math.cos(angle)*35*r.zoom,y=a.y+Math.sin(angle)*35*r.zoom*SY;(k?m.lineTo:m.moveTo).call(m,x,y);}m.closePath();m.fill();}
  }}
  const blur=Math.max(3,Math.min(32,24*r.zoom))*SCALE;s.setTransform(1,0,0,1,0,0);s.clearRect(0,0,size.sheetW,size.sheetH);s.filter=`blur(${blur}px)`;s.drawImage(mask,0,0);s.filter='none';
  const image=s.getImageData(0,0,size.sheetW,size.sheetH),d=image.data,remembered=mc.getImageData(0,0,size.sheetW,size.sheetH).data;
  let edgePixels=0;for(let y=0;y<size.sheetH;y++)for(let x=0;x<size.sheetW;x++){const i=(y*size.sheetW+x)*4,a=d[i+3]/255,memoryAlpha=Math.round(remembered[i+3]*.38);if(a===0){d[i+3]=255;continue;}if(a===1){d[i+3]=memoryAlpha;continue;}
   const wx=r.cam.x+(x/SCALE-r.width/2)/r.zoom,wy=r.cam.y+(y/SCALE-r.height/2)/(r.zoom*SY),n=noise(wx/17,wy/17)*.65+noise(wx/6,wy/6)*.35;
   // Fully cover the original polygon boundary; feather entirely into known land.
   const feather=Math.max(0,Math.min(1,(a-(.60+n*.14))/.22));d[i+3]=Math.max(memoryAlpha,Math.round(255*(1-feather*feather*(3-2*feather))));if(d[i+3]>0&&d[i+3]<255)edgePixels++;
  }s.putImageData(image,0,0);cache.edgePixels=edgePixels;
 }finally{r.width=savedWidth;r.height=savedHeight;r.renderOffset=savedOffset;}
 Object.assign(cache,{gameId:r.game.id,revision,terrain:r.terrainRevision,viewW,viewH,camX:r.cam.x,camY:r.cam.y,zoom:r.zoom,...size,builds:cache.builds+1});
 r.chartFog=cache;presentFog(r,c,cache,{x:size.padX,y:size.padY,w:viewW,h:viewH});
}
