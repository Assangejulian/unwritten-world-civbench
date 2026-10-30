const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/modernization-20261006'),target=path.join(root,'web/assets/modernization');
const names=['spaceport','nuclear','market','exchange','lighthouse','shipyard','seaport','amphitheater','museum','opera','broadcast','coalplant','oilplant','powerplant','entertainment','stadium','city-ancient','city-classical','city-medieval','city-industrial','city-modern','city-information'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 await fs.mkdir(source,{recursive:true});await fs.mkdir(target,{recursive:true});const frames=[],records=[];
 for(const [file,columns,rows,offset]of [['districts.png',4,4,0],['cities.png',3,2,16]]){
  const raw=await fs.readFile(path.join(source,file)),meta=await sharp(raw).metadata(),rgba=await sharp(raw).ensureAlpha().raw().toBuffer();if(!meta.hasAlpha)throw Error('Missing alpha '+file);let clear=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]<20)clear++;if(clear/(rgba.length/4)<.2)throw Error('Opaque atlas '+file);
  for(let i=0;i<columns*rows;i++){
   const left=Math.round(i%columns*meta.width/columns),right=Math.round((i%columns+1)*meta.width/columns),top=Math.round(Math.floor(i/columns)*meta.height/rows),bottom=Math.round((Math.floor(i/columns)+1)*meta.height/rows);let x0=right,x1=left,y0=bottom,y1=top,count=0;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(rgba[(y*meta.width+x)*4+3]>=24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}if(count<1000)throw Error('Empty cell '+i);
   const width=x1-x0+1,height=y1-y0+1,scale=Math.min(236/width,236/height),w=Math.round(width*scale),h=Math.round(height*scale),index=offset+i;
   const input=await sharp(raw).extract({left:x0,top:y0,width,height}).resize(w,h).toBuffer();frames.push({input,left:index%6*256+Math.floor((256-w)/2),top:Math.floor(index/6)*256+Math.floor((256-h)/2)});records.push({key:names[index],cell:index,source:file,sourceBounds:{left:x0,top:y0,width,height},bounds:{left:index%6*256+Math.floor((256-w)/2),right:index%6*256+Math.floor((256-w)/2)+w,top:Math.floor(index/6)*256+Math.floor((256-h)/2),bottom:Math.floor(index/6)*256+Math.floor((256-h)/2)+h},opaque:count,sourceSha256:hash(raw)});
  }
 }
 const encoded=await sharp({create:{width:1536,height:1024,channels:4,background:'#00000000'}}).composite(frames).webp({quality:86,alphaQuality:100}).toBuffer();await fs.writeFile(path.join(target,'atlas.webp'),encoded);await fs.writeFile(path.join(target,'frames.json'),JSON.stringify(records.map(r=>r.bounds)));
 const manifest={version:1,date:'2026-10-06',generator:'Built-in ImageGen',provenance:'Original generated game artwork; prompts and full originals retained in art-source/modernization-20261006.',runtime:'web/assets/modernization/atlas.webp',bytes:encoded.length,sha256:hash(encoded),frames:records};await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify(manifest,null,2));console.log({frames:records.length,bytes:encoded.length,transparent:true});
})().catch(e=>{console.error(e);process.exitCode=1;});
