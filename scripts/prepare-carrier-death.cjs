const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/carrier-20261010/aircraftcarrier-death.png'),target=path.join(root,'web/assets/carrier');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const raw=await fs.readFile(source),meta=await sharp(raw).metadata(),pixels=await sharp(raw).ensureAlpha().raw().toBuffer();if(!meta.hasAlpha)throw Error('Generated death sheet must retain alpha.');
 const width=meta.width/4,height=meta.height/2,cells=[];
 for(let i=0;i<8;i++){
  const x0=Math.floor(i%4*width),y0=Math.floor(Math.floor(i/4)*height),x1=Math.floor((i%4+1)*width),y1=Math.floor((Math.floor(i/4)+1)*height);let left=x1,top=y1,right=x0,bottom=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*meta.width+x)*4+3]>=24){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(right<=left||bottom<=top)throw Error('Empty death pose '+i);cells.push({left,top,width:right-left+1,height:bottom-top+1});
 }
 // One scale across all frames: wrecks sink rather than expanding to fill their cells.
 const scale=Math.min(108/cells[0].width,106/Math.max(...cells.map(c=>c.height)),120/Math.max(...cells.map(c=>c.width))),frames=[];
 for(const [i,c] of cells.entries()){
  const w=Math.round(c.width*scale),h=Math.round(c.height*scale),input=await sharp(raw).extract(c).resize(w,h).png().toBuffer();
  frames.push({input,left:i%4*128+Math.round(64-w/2),top:Math.floor(i/4)*128+112-h});
 }
 const image=await sharp({create:{width:512,height:256,channels:4,background:'#00000000'}}).composite(frames).webp({quality:90,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,'aircraftcarrier-death.webp'),image);
 const manifest=JSON.parse(await fs.readFile(path.join(target,'manifest.json')));manifest.deathPoses=8;manifest.records.push({key:'aircraftcarrier-death',source:'Built-in ImageGen',original:'art-source/carrier-20261010/aircraftcarrier-death.png',sourceSha256:hash(raw),runtime:'web/assets/carrier/aircraftcarrier-death.webp',runtimeSha256:hash(image),bytes:image.length,poses:8,cellSize:128,anchor:[64,112],scale});await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({poses:8,bytes:image.length,scale}));
})().catch(error=>{console.error(error);process.exitCode=1;});
