// Export generated poses with one physical scale and fixed anchors per identity.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/medical-20261006'),target=path.join(root,'web/assets/medical');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 await fs.mkdir(target,{recursive:true});const records=[];
 for(const key of ['herbalist','surgeon','fieldmedic','ambulance']){
  const raw=await fs.readFile(path.join(source,key+'.png')),meta=await sharp(raw).metadata(),rgba=await sharp(raw).ensureAlpha().raw().toBuffer();
  if(!meta.hasAlpha)throw Error('Missing alpha: '+key);const cells=[],bands=[];let start=null,maxWidth=0,maxHeight=0;
  // Generated rows have different posture heights; use actual transparent gutters.
  for(let y=0;y<meta.height;y++){let count=0;for(let x=0;x<meta.width;x++)if(rgba[(y*meta.width+x)*4+3]>48)count++;if(count>8){if(start===null)start=y;}else if(start!==null){if(y-start>8)bands.push([Math.max(0,start-3),Math.min(meta.height,y+3)]);start=null;}}
  if(start!==null)bands.push([Math.max(0,start-3),meta.height]);if(bands.length!==7)throw Error('Expected seven separate painted rows: '+key+' '+bands.length);
  for(let i=0;i<28;i++){
   const left=Math.round(i%4*meta.width/4),right=Math.round((i%4+1)*meta.width/4),[top,bottom]=bands[Math.floor(i/4)];
   let x0=right,y0=bottom,x1=left,y1=top,opaque=0;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(rgba[(y*meta.width+x)*4+3]>=24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);opaque++;}
   if(opaque<500)throw Error('Empty pose: '+key+' '+i);const width=x1-x0+1,height=y1-y0+1;maxWidth=Math.max(maxWidth,width);maxHeight=Math.max(maxHeight,height);cells.push({index:i,left:x0,top:y0,width,height,opaque});
  }
  const scale=Math.min(112/maxWidth,104/maxHeight),frames=[];
  for(const cell of cells){const width=Math.max(1,Math.round(cell.width*scale)),height=Math.max(1,Math.round(cell.height*scale)),buf=await sharp(raw).extract({left:cell.left,top:cell.top,width:cell.width,height:cell.height}).resize(width,height).toBuffer();frames.push({input:buf,left:Math.floor(64-width/2),top:Math.floor(112-height)});}
  const order=key==='herbalist'?[20,21,22,24,23,25,26,27]:key==='fieldmedic'?[20,21,22,24,23,25,26,27]:[20,21,22,23,24,25,26,27];
  for(const [suffix,indices]of [['',Array.from({length:20},(_,i)=>i)],['-death',order]]){const height=indices.length/4*128,encoded=await sharp({create:{width:512,height,channels:4,background:'#00000000'}}).composite(indices.map((pose,i)=>({...frames[pose],left:frames[pose].left+i%4*128,top:frames[pose].top+Math.floor(i/4)*128}))).webp({quality:86,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,key+suffix+'.webp'),encoded);records.push({key:key+suffix,poses:indices.length,source:'Built-in ImageGen',original:`art-source/medical-20261006/${key}.png`,sourceSha256:hash(raw),runtime:`web/assets/medical/${key+suffix}.webp`,runtimeSha256:hash(encoded),bytes:encoded.length,scale,cellSize:128,anchor:[64,112],sourceBands:bands,sourceOrder:indices});}
  const icon=await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([frames[0]]).webp({quality:86,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,key+'-icon.webp'),icon);records.push({key:key+'-icon',bytes:icon.length,runtime:`web/assets/medical/${key}-icon.webp`,runtimeSha256:hash(icon)});
 }
 await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,date:'2026-10-06',mainPoses:80,deathPoses:32,records},null,2));console.log({assets:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),mainPoses:80,deathPoses:32});
})().catch(e=>{console.error(e);process.exitCode=1;});
