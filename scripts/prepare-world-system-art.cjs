const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/world-systems-20261007'),target=path.join(root,'web/assets/world-systems');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 await fs.mkdir(target,{recursive:true});const records=[],gallery=[];
 for(const {key}of JSON.parse(await fs.readFile(path.join(source,'generation.json'),'utf8'))){
  const raw=await fs.readFile(path.join(source,key+'.png')),meta=await sharp(raw).metadata(),rgba=await sharp(raw).ensureAlpha().raw().toBuffer(),rows=key==='rocket'?2:7,count=rows*4;
  if(!meta.hasAlpha)throw Error('Missing generated transparency: '+key);
  const bands=[];let start=null;
  for(let y=0;y<meta.height;y++){let n=0;for(let x=0;x<meta.width;x++)if(rgba[(y*meta.width+x)*4+3]>48)n++;if(n>8){if(start===null)start=y;}else if(start!==null){if(y-start>8)bands.push([Math.max(0,start-3),Math.min(meta.height,y+3)]);start=null;}}
  if(start!==null)bands.push([Math.max(0,start-3),meta.height]);
  if(bands.length!==rows){
   // Soft missile smoke can bridge two otherwise separate rows. Find the
   // narrowest alpha-density valley near each expected painted row gutter.
   const cuts=[0];for(let row=1;row<rows;row++){const center=row*meta.height/rows,span=meta.height/rows*.22;let best=Math.round(center),score=Infinity;for(let y=Math.floor(center-span);y<=Math.ceil(center+span);y++){let n=0;for(let x=0;x<meta.width;x++)if(rgba[(y*meta.width+x)*4+3]>80)n++;const candidate=n+Math.abs(y-center)*.15;if(candidate<score){score=candidate;best=y;}}cuts.push(best);}cuts.push(meta.height);bands.splice(0,bands.length,...Array.from({length:rows},(_,i)=>[cuts[i],cuts[i+1]]));
  }
  const cells=[];
  for(let i=0;i<count;i++){
   const left=Math.round(i%4*meta.width/4),right=Math.round((i%4+1)*meta.width/4),[top,bottom]=bands[Math.floor(i/4)];let x0=right,y0=bottom,x1=left,y1=top,n=0;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(rgba[(y*meta.width+x)*4+3]>=24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);n++;}
   if(n<200)throw Error('Empty authored pose: '+key+' '+i);cells.push({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1,opaque:n});
  }
  if(key==='rocket'){
   // A single authored ascending vehicle keeps physical scale fixed throughout
   // the ascent; exhaust animation uses the existing effect atlas separately.
   const c=cells[7],image=await sharp(raw).extract({left:c.left,top:c.top,width:c.width,height:c.height}).resize({height:384}).webp({quality:90,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,'rocket.webp'),image);records.push({key,original:'art-source/world-systems-20261007/rocket.png',sourceSha256:hash(raw),runtime:'web/assets/world-systems/rocket.webp',runtimeSha256:hash(image),bytes:image.length,sourcePose:7,bands});continue;
  }
  const scale=Math.min(112/Math.max(...cells.map(c=>c.width)),104/Math.max(...cells.map(c=>c.height))),frames=[];
  for(const c of cells){const width=Math.max(1,Math.round(c.width*scale)),height=Math.max(1,Math.round(c.height*scale)),input=await sharp(raw).extract({left:c.left,top:c.top,width:c.width,height:c.height}).resize(width,height).png().toBuffer();frames.push({input,left:Math.floor(64-width/2),top:112-height});}
  for(const [suffix,indices]of [['',Array.from({length:20},(_,i)=>i)],['-death',Array.from({length:8},(_,i)=>i+20)]]){const image=await sharp({create:{width:512,height:indices.length/4*128,channels:4,background:'#00000000'}}).composite(indices.map((pose,i)=>({...frames[pose],left:frames[pose].left+i%4*128,top:frames[pose].top+Math.floor(i/4)*128}))).webp({quality:88,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,key+suffix+'.webp'),image);records.push({key:key+suffix,poses:indices.length,original:`art-source/world-systems-20261007/${key}.png`,sourceSha256:hash(raw),runtime:`web/assets/world-systems/${key+suffix}.webp`,runtimeSha256:hash(image),bytes:image.length,scale,cellSize:128,anchor:[64,112],sourceBands:bands});}
  const icon=await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([frames[0]]).webp({quality:88,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,key+'-icon.webp'),icon);gallery.push(icon);records.push({key:key+'-icon',bytes:icon.length,runtime:`web/assets/world-systems/${key}-icon.webp`,runtimeSha256:hash(icon)});
 }
 await sharp({create:{width:9*128,height:128,channels:4,background:'#193239'}}).composite(gallery.map((input,i)=>({input,left:i*128,top:0}))).png().toFile(path.join(root,'output/playwright/world-unit-icons.png'));
 await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,date:'2026-10-07',mainPoses:180,deathPoses:72,records},null,2));console.log({assets:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),mainPoses:180,deathPoses:72});
})().catch(error=>{console.error(error);process.exitCode=1;});
