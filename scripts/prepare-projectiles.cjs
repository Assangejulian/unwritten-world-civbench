const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source='art-source/projectiles-20261017/projectiles-original.png',target='web/assets/projectiles/projectiles-painted-v1.webp';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const raw=await fs.readFile(path.join(root,source)),meta=await sharp(raw).metadata(),{data,info}=await sharp(raw).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(!meta.hasAlpha)throw Error('Authored projectiles require genuine transparency');
 const names=['torpedo-0','torpedo-1','torpedo-2','cannonball','bullet','missile','bomb','bolt'],cells=[];
 // The first torpedo's nose extends slightly over the nominal quarter boundary.
 const edges=[0,Math.round(meta.width*460/1792),Math.round(meta.width/2),Math.round(meta.width*.78),meta.width],lowerEdges=[0,Math.round(meta.width*400/1774),Math.round(meta.width/2),Math.round(meta.width*.756),meta.width];
 for(let i=0;i<8;i++){
  const row=Math.floor(i/4),columns=row?lowerEdges:edges,x0=columns[i%4],x1=columns[i%4+1],y0=Math.round(row*meta.height/2),y1=Math.round((row+1)*meta.height/2);
  let left=x1,top=y1,right=x0,bottom=y0,count=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*info.width+x)*4+3]>12){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;}
  if(count<100)throw Error('Empty projectile '+names[i]);cells.push({key:names[i],left,top,width:right-left+1,height:bottom-top+1,opaque:count});
 }
 const torpedoScale=240/Math.max(...cells.slice(0,3).map(c=>c.width)),frames=[],records=[];
 for(const [i,c]of cells.entries()){
  const scale=i<3?torpedoScale:Math.min((i===3?196:236)/c.width,196/c.height),w=Math.round(c.width*scale),h=Math.round(c.height*scale);
  let x=Math.round((256-w)/2),y=Math.round((256-h)/2);
  if(i<3){let weight=0,center=0;for(let yy=c.top;yy<c.top+c.height;yy++)for(let xx=Math.floor(c.left+c.width*.75);xx<c.left+c.width;xx++){const a=data[(yy*info.width+xx)*4+3];center+=yy*a;weight+=a;}x=246-w;y=Math.round(128-(center/weight-c.top)*scale);}
  if(x<0||y<0||x+w>256||y+h>256)throw Error('Projectile exceeds its cell: '+c.key);
  const crop={left:c.left,top:c.top,width:c.width,height:c.height},input=await sharp(raw).extract(crop).resize(w,h).png().toBuffer();frames.push({input,left:i%4*256+x,top:Math.floor(i/4)*256+y});records.push({...c,scale,runtime:{x:i%4*256,y:Math.floor(i/4)*256,width:256,height:256},anchor:i<3?[.7,.5]:[.5,.5]});
 }
 await fs.mkdir(path.dirname(path.join(root,target)),{recursive:true});
 const image=await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(frames).webp({lossless:true}).toBuffer();await fs.writeFile(path.join(root,target),image);
 await fs.writeFile(path.join(root,'web/assets/projectiles/manifest.json'),JSON.stringify({generator:'Built-in ImageGen',source,sourceSha256:hash(raw),runtime:target,runtimeSha256:hash(image),bytes:image.length,grid:{columns:4,rows:2,cell:256},torpedoPoses:3,records},null,2)+'\n');console.log(JSON.stringify({sourceSize:[meta.width,meta.height],bytes:image.length,frames:records.length}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
