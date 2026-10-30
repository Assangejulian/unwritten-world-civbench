// Package authored ImageGen poses without changing their relative scale.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const folder='carrier';
const root=path.resolve(__dirname,'..'),source=path.join(root,`art-source/${folder}-20261010`),target=path.join(root,'web/assets/'+folder);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const units=['aircraftcarrier'],staticAssets=[];
(async()=>{
 await fs.mkdir(target,{recursive:true});await fs.mkdir(path.join(root,'output/playwright'),{recursive:true});const records=[],gallery=[];
 for(const key of [...units,...staticAssets]){
  const raw=await fs.readFile(path.join(source,key+'.png')),meta=await sharp(raw).metadata(),rgba=await sharp(raw).ensureAlpha().raw().toBuffer();
  if(!meta.hasAlpha)throw Error('Missing generated alpha: '+key);
  let transparent=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]===0)transparent++;
  if(transparent/(meta.width*meta.height)<.20)throw Error('Background is not transparent: '+key);
  const common={source:'Built-in ImageGen',original:`art-source/${folder}-20261010/${key}.png`,sourceSha256:hash(raw)};
  const write=async(suffix,image,extra={})=>{const file=key+suffix+'.webp';await fs.writeFile(path.join(target,file),image);records.push({key:key+suffix,...common,runtime:'web/assets/'+folder+'/'+file,runtimeSha256:hash(image),bytes:image.length,...extra});};
  let icon;
  if(units.includes(key)){
   const w=meta.width,h=meta.height,labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[];
   // Opaque connected bodies determine ownership, including effects that cross row/column gutters.
   for(let p=0;p<labels.length;p++){
    if(labels[p]||rgba[p*4+3]<48)continue;const id=components.length+1;let head=0,tail=1,left=w,right=0,top=h,bottom=0;queue[0]=p;labels[p]=id;
    while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(const next of [at-1,at+1,at-w,at+w])if(next>=0&&next<labels.length&&!labels[next]&&rgba[next*4+3]>=48&&Math.abs(next%w-x)<=1){labels[next]=id;queue[tail++]=next;}}
    components.push({id,left,right,top,bottom,count:tail});
   }
   const bodies=components.filter(c=>c.count>2000).sort((a,b)=>b.count-a.count).slice(0,20).sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom));if(bodies.length!==20)throw Error('Expected twenty connected bodies: '+key);
   const ordered=[];for(let row=0;row<5;row++)ordered.push(...bodies.slice(row*4,row*4+4).sort((a,b)=>a.left-b.left));
   const bands=Array.from({length:5},(_,row)=>[Math.min(...ordered.slice(row*4,row*4+4).map(b=>b.top)),Math.max(...ordered.slice(row*4,row*4+4).map(b=>b.bottom))+1]);
   const bodyLabels=new Map(ordered.map((b,i)=>[b.id,i+1])),owners=new Uint8Array(w*h);let head=0,tail=0;
   for(let p=0;p<labels.length;p++){const owner=bodyLabels.get(labels[p]);if(owner){owners[p]=owner;queue[tail++]=p;}}
   while(head<tail){const at=queue[head++],x=at%w;for(const next of [at-1,at+1,at-w,at+w])if(next>=0&&next<owners.length&&!owners[next]&&rgba[next*4+3]>0&&Math.abs(next%w-x)<=1){owners[next]=owners[at];queue[tail++]=next;}}
   for(let p=0;p<owners.length;p++)if(rgba[p*4+3]>0&&!owners[p]){const x=p%w,y=Math.floor(p/w);let best=0,distance=Infinity;for(let i=0;i<ordered.length;i++){const b=ordered[i],dx=Math.max(b.left-x,0,x-b.right),dy=Math.max(b.top-y,0,y-b.bottom),d=dx*dx+dy*dy;if(d<distance){best=i;distance=d;}}owners[p]=best+1;}
   const cells=ordered.map((body,index)=>({index,left:body.left,top:body.top,right:body.right,bottom:body.bottom,opaque:body.count,anchorY:body.bottom+1,weight:0,sumX:0}));
   for(let p=0;p<owners.length;p++)if(owners[p]){const i=owners[p]-1,c=cells[i],b=ordered[i],x=p%w,y=Math.floor(p/w),alpha=rgba[p*4+3];if(alpha>=24){c.left=Math.min(c.left,x);c.right=Math.max(c.right,x);c.top=Math.min(c.top,y);c.bottom=Math.max(c.bottom,y);}if(labels[p]===b.id&&y>b.bottom-(b.bottom-b.top)*.35){c.sumX+=x*alpha;c.weight+=alpha;}}
   for(const c of cells){c.anchorX=c.weight?c.sumX/c.weight:(c.left+c.right)/2;c.left=Math.max(0,c.left-3);c.top=Math.max(0,c.top-3);c.right=Math.min(w-1,c.right+3);c.bottom=Math.min(h-1,c.bottom+3);c.width=c.right-c.left+1;c.height=c.bottom-c.top+1;delete c.weight;delete c.sumX;}
   const half=Math.max(...cells.map(c=>Math.max(c.anchorX-c.left,c.right-c.anchorX))),up=Math.max(...cells.map(c=>c.anchorY-c.top)),down=Math.max(1,...cells.map(c=>c.bottom-c.anchorY)),scale=Math.min(56/half,104/up,12/down),frames=[];
   const crops=cells.map(c=>Buffer.alloc(c.width*c.height*4));
   for(let p=0;p<owners.length;p++)if(owners[p]){const i=owners[p]-1,c=cells[i],x=p%w,y=Math.floor(p/w);if(x<c.left||x>c.right||y<c.top||y>c.bottom)continue;rgba.copy(crops[i],((y-c.top)*c.width+x-c.left)*4,p*4,p*4+4);}
   for(const c of cells){const width=Math.max(1,Math.round(c.width*scale)),height=Math.max(1,Math.round(c.height*scale)),input=await sharp(crops[c.index],{raw:{width:c.width,height:c.height,channels:4}}).resize(width,height).png().toBuffer();frames.push({input,left:Math.round(64+(c.left-c.anchorX)*scale),top:Math.round(112+(c.top-c.anchorY)*scale)});}
   const image=await sharp({create:{width:512,height:640,channels:4,background:'#00000000'}}).composite(frames.map((frame,i)=>({...frame,left:frame.left+i%4*128,top:frame.top+Math.floor(i/4)*128}))).webp({quality:90,alphaQuality:100}).toBuffer();
   await write('',image,{poses:20,actions:{idle:4,move:8,attack:8},cellSize:128,anchor:[64,112],scale,sourceBands:bands,sourceCells:cells,extraction:"connected opaque bodies with alpha ownership and nearest-body detached effects"});
   icon=await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([frames[0]]).webp({quality:90,alphaQuality:100}).toBuffer();
  }else{
   const trimmed=await sharp(raw).trim({threshold:10}).png().toBuffer(),image=await sharp(trimmed).resize(384,384,{fit:'inside',withoutEnlargement:true}).extend({top:12,bottom:12,left:12,right:12,background:'#00000000'}).webp({quality:92,alphaQuality:100}).toBuffer();await write('',image,{poses:1});
   icon=await sharp(image).resize(128,128,{fit:'contain',background:'#00000000'}).webp({quality:92,alphaQuality:100}).toBuffer();
  }
  await write('-icon',icon,{poses:1});gallery.push({key,icon});
 }
 const layers=[];for(let i=0;i<gallery.length;i++){const {key,icon}=gallery[i],left=i%4*240,top=Math.floor(i/4)*220;layers.push({input:await sharp(icon).resize(190,160,{fit:'contain',background:'#193239'}).png().toBuffer(),left:left+25,top:top+12});layers.push({input:Buffer.from(`<svg width="240" height="30"><text x="120" y="20" text-anchor="middle" fill="#eadbc0" font-family="sans-serif" font-size="15">${key}</text></svg>`),left,top:top+180});}
 await sharp({create:{width:960,height:Math.ceil(gallery.length/4)*220,channels:4,background:'#193239'}}).composite(layers).png().toFile(path.join(root,`output/playwright/${folder}-art-gallery.png`));
 await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,date:'2026-10-10',mainPoses:units.length*20,newUnitTypes:units,staticAssets,records},null,2)+'\n');console.log(JSON.stringify({assets:records.length,mainPoses:units.length*20,bytes:records.reduce((n,r)=>n+r.bytes,0)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
