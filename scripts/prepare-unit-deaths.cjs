const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const source=JSON.parse(await fs.readFile(path.join(root,'art-source/unit-deaths-20261008/generation.json'))),baseline=JSON.parse(await fs.readFile(path.join(root,'output/unit-death-baseline.json'))),records=[],gallery=[];
 const target=path.join(root,'web/assets/unit-deaths');await fs.mkdir(target,{recursive:true});
 for(const entry of source.records){
  const raw=await fs.readFile(path.join(root,entry.original)),{data,info}=await sharp(raw).ensureAlpha().raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height,cells=[];
  // Authored 4x2 gutters are deliberately clear; final sinking remnants need no connected-body size threshold.
  for(let i=0;i<8;i++){const x0=Math.round(i%4*w/4),x1=Math.round((i%4+1)*w/4),y0=Math.round(Math.floor(i/4)*h/2),y1=Math.round((Math.floor(i/4)+1)*h/2);let left=x1,right=x0,top=y1,bottom=y0,bodyLeft=x1,bodyRight=x0,bodyBottom=y0,opaque=0;
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const a=data[(y*w+x)*4+3];if(a>=24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(a>=80){bodyLeft=Math.min(bodyLeft,x);bodyRight=Math.max(bodyRight,x);bodyBottom=Math.max(bodyBottom,y);opaque++;}}
   if(opaque<100||right<=left)throw Error('Empty authored death frame '+entry.key+':'+i);cells.push({index:i,left,right,top,bottom,opaque,bodyWidth:bodyRight-bodyLeft+1,anchorX:(bodyLeft+bodyRight)/2,anchorY:bodyBottom+1});
  }
  const reference=baseline.types.find(u=>u.type===entry.key).alive[0].bounds,requestedScale=reference.width/cells[0].bodyWidth,center=(reference.left+reference.right)/2;
  const half=Math.max(...cells.map(c=>Math.max(c.anchorX-c.left,c.right-c.anchorX)+2)),up=Math.max(...cells.map(c=>c.anchorY-c.top+2));
  const scale=Math.min(requestedScale,(Math.min(center,128-center)-4)/half,108/up),frames=[];
  if(scale/requestedScale<.86)throw Error('Death smoke would change physical scale '+entry.key+': '+scale/requestedScale);
  for(const c of cells){const width=c.right-c.left+1,height=c.bottom-c.top+1,input=await sharp(raw).extract({left:c.left,top:c.top,width,height}).resize(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))).png().toBuffer();frames.push({input,left:Math.round(center+(c.left-c.anchorX)*scale),top:Math.round(112+(c.top-c.anchorY)*scale)});}
  const runtime='web/assets/unit-deaths/'+entry.key+'-death.webp',image=await sharp({create:{width:512,height:256,channels:4,background:'#00000000'}}).composite(frames.map((f,i)=>({...f,left:f.left+i%4*128,top:f.top+Math.floor(i/4)*128}))).webp({quality:92,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(root,runtime),image);
  records.push({key:entry.key,source:'Built-in ImageGen',original:entry.original,sourceSha256:hash(raw),runtime,runtimeSha256:hash(image),bytes:image.length,poses:8,cellSize:128,anchor:[64,112],scale,requestedScale,livingReference:reference,sourceCells:cells});
  gallery.push({input:Buffer.from(`<svg width="190" height="128"><text x="14" y="68" fill="#eadbc6" font-family="sans-serif" font-size="17">${entry.key}</text></svg>`),left:0,top:records.length*128-128});
  for(let i=0;i<8;i++){const frame=await sharp(image).extract({left:i%4*128,top:Math.floor(i/4)*128,width:128,height:128}).png().toBuffer();gallery.push({input:frame,left:190+i*128,top:records.length*128-128});}
 }
 await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,date:'2026-10-08',deathPoses:72,records},null,2)+'\n');
 await sharp({create:{width:1214,height:1152,channels:4,background:'#193239'}}).composite(gallery).png().toFile(path.join(root,'output/playwright/unit-death-gallery.png'));
 console.log(JSON.stringify({assets:records.length,deathPoses:72,bytes:records.reduce((n,r)=>n+r.bytes,0)}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
