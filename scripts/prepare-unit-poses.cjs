// Technical alpha-aware atlas export; generated original artwork remains untouched.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/unit-poses-20261019'),target=path.join(root,'web/assets/unit-poses'),out=path.join(root,'output/unit-poses-20261019');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const partial=process.argv.includes('--partial'),wanted=process.argv.find(a=>a.startsWith('--unit='))?.slice(7);
function cut(hist,nominal,radius){let best=Math.round(nominal),score=Infinity;for(let i=Math.max(1,Math.floor(nominal-radius));i<Math.min(hist.length-1,nominal+radius);i++){const v=hist[i]+Math.abs(i-nominal)*.06;if(v<score){best=i;score=v;}}return best;}
function silhouetteCells(rgba,width,height){
 const labels=new Int32Array(width*height),queue=new Int32Array(width*height),components=[];
 for(let p=0;p<labels.length;p++)if(!labels[p]&&rgba[p*4+3]>=32){const id=components.length+1;let head=0,tail=1,left=width,right=0,top=height,bottom=0;queue[0]=p;labels[p]=id;while(head<tail){const at=queue[head++],x=at%width,y=Math.floor(at/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(const next of [at-1,at+1,at-width,at+width])if(next>=0&&next<labels.length&&!labels[next]&&rgba[next*4+3]>=32&&Math.abs(next%width-x)<=1){labels[next]=id;queue[tail++]=next;}}components.push({id,left,right,top,bottom,pixels:tail});}
 const main=components.toSorted((a,b)=>b.pixels-a.pixels).slice(0,28).sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom)),ordered=[];
 if(main.length!==28)throw Error('Expected28 complete body silhouettes');for(let row=0;row<7;row++)ordered.push(...main.slice(row*4,row*4+4).sort((a,b)=>a.left-b.left));
 const ids=new Map(ordered.map((c,i)=>[c.id,i+1])),nearest=(x,y)=>{let best=0,score=Infinity;for(let i=0;i<ordered.length;i++){const c=ordered[i],dx=Math.max(c.left-x,0,x-c.right),dy=Math.max(c.top-y,0,y-c.bottom),d=dx*dx+dy*dy;if(d<score){score=d;best=i+1;}}return best;};
 for(const c of components)if(!ids.has(c.id))ids.set(c.id,nearest((c.left+c.right)/2,(c.top+c.bottom)/2));
 const owners=new Uint8Array(width*height),cells=ordered.map((_,i)=>({left:width,top:height,right:0,bottom:0,pixels:0,row:Math.floor(i/4),col:i%4,sourceEdges:{}}));
 for(let p=0;p<labels.length;p++)if(rgba[p*4+3]>=16){const x=p%width,y=Math.floor(p/width),owner=ids.get(labels[p])||nearest(x,y),c=cells[owner-1];owners[p]=owner;c.left=Math.min(c.left,x);c.right=Math.max(c.right,x);c.top=Math.min(c.top,y);c.bottom=Math.max(c.bottom,y);c.pixels++;}
 for(const [i,c]of cells.entries()){let mass=0,moment=0;for(let y=Math.round(c.bottom-(c.bottom-c.top)*.35);y<=c.bottom;y++)for(let x=c.left;x<=c.right;x++){const p=y*width+x,a=rgba[p*4+3];if(owners[p]===i+1&&a>=80){mass+=a;moment+=x*a;}}c.width=c.right-c.left+1;c.height=c.bottom-c.top+1;c.anchorX=mass?moment/mass:(c.left+c.right)/2;c.anchorY=c.bottom+1;}
 return {cells,owners,yCuts:null,method:'connected complete body silhouettes'};
}
function cellsFor(rgba,width,height,key){
 if(['skirmisher','ranger','specops','heavychariot','pikeandshot','militaryengineer','guru','archaeologist','naturalist','rockband','warriormonk'].includes(key))return silhouetteCells(rgba,width,height);
 const rowCount=7,colCount=4,rows=new Array(height).fill(0);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=40)rows[y]++;
 const gaps=[];let start=-1;for(let y=0;y<=height;y++){const empty=y<height&&rows[y]<=2;if(empty&&start<0)start=y;if(!empty&&start>=0){if(y-start>=4&&start>0&&y<height)gaps.push((start+y-1)/2);start=-1;}}
 const pitch=gaps.length>=2?gaps[1]-gaps[0]:height/7;
 const yCuts=gaps.length===6?[0,...gaps.map(Math.round),height]:[0,...Array.from({length:6},(_,i)=>cut(rows,(gaps[0]||height/7)+i*pitch,height/7*.29)),height],cells=[];
 for(let row=0;row<rowCount;row++){
  const top=yCuts[row],bottom=yCuts[row+1],columns=new Array(width).fill(0);
  for(let y=top;y<bottom;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=40)columns[x]++;
  const xCuts=[0,...Array.from({length:3},(_,i)=>cut(columns,(i+1)*width/colCount,width/colCount*.26)),width];
  for(let col=0;col<colCount;col++){
   const left=xCuts[col],right=xCuts[col+1];let x0=right,x1=left,y0=bottom,y1=top,pixels=0;
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(rgba[(y*width+x)*4+3]>=32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);pixels++;}
   if(pixels<200||x1<=x0||y1<=y0)throw Error('Empty/incomplete generated cell '+(row*4+col));
   // Lower silhouette mass follows feet, carriage/winch and hull instead of muzzle smoke.
   let mass=0,moment=0;for(let y=Math.round(y1-(y1-y0)*.35);y<=y1;y++)for(let x=x0;x<=x1;x++){const a=rgba[(y*width+x)*4+3];if(a>=80){mass+=a;moment+=x*a;}}
   const anchorX=mass?moment/mass:(x0+x1)/2,anchorY=y1+1;
   cells.push({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1,anchorX,anchorY,pixels,row,col,sourceEdges:{left:columns[left]||0,right:columns[right-1]||0,top:rows[top]||0,bottom:rows[bottom-1]||0}});
  }
 }
 return {cells,yCuts,method:'transparent gutter bands'};
}
(async()=>{
 fs.mkdirSync(target,{recursive:true});fs.mkdirSync(out+'/gallery',{recursive:true});
 const jobs=JSON.parse(fs.readFileSync(source+'/jobs.json')),generated=JSON.parse(fs.readFileSync(source+'/generation.json')),repairs=fs.existsSync(source+'/repairs.json')?JSON.parse(fs.readFileSync(source+'/repairs.json')):[];
 const records=[],overview=[];
 for(const job of jobs){
  if(wanted&&job.key!==wanted)continue;
  const g=generated.find(j=>j.key===job.key);if(!g){if(partial)continue;throw Error('Missing generation '+job.key);}
  const repaired=repairs.findLast(j=>j.key===job.key&&!j.superseded),file=path.join(source,job.key+(repaired?'-repaired':'-raw')+'.png'),originalRaw=fs.readFileSync(file);let raw=originalRaw,m=await sharp(raw).metadata(),rgba=await sharp(raw).ensureAlpha().raw().toBuffer();
  let lx=m.width,rx=0,ty=m.height,by=0;for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++)if(rgba[(y*m.width+x)*4+3]>=32){lx=Math.min(lx,x);rx=Math.max(rx,x);ty=Math.min(ty,y);by=Math.max(by,y);}const trim={left:Math.max(0,lx-4),top:Math.max(0,ty-4),width:Math.min(m.width,rx+5)-Math.max(0,lx-4),height:Math.min(m.height,by+5)-Math.max(0,ty-4)};raw=await sharp(raw).extract(trim).png().toBuffer();m=await sharp(raw).metadata();rgba=await sharp(raw).ensureAlpha().raw().toBuffer();
  if(!m.hasAlpha)throw Error('Missing transparent alpha '+job.key);
  const transparent=Array.from({length:m.width*m.height},(_,i)=>rgba[i*4+3]<24?1:0).reduce((a,b)=>a+b,0)/(m.width*m.height);if(transparent<.2)throw Error('Opaque backdrop '+job.key);
  const {cells,yCuts,owners,method}=cellsFor(rgba,m.width,m.height,job.key),half=Math.max(...cells.map(c=>Math.max(c.anchorX-c.left,c.left+c.width-c.anchorX))),up=Math.max(...cells.map(c=>c.anchorY-c.top)),scale=Math.min(55/half,104/up),frames=[];
  for(const cell of cells){const width=Math.max(1,Math.round(cell.width*scale)),height=Math.max(1,Math.round(cell.height*scale)),left=Math.round(64+(cell.left-cell.anchorX)*scale),top=Math.round(112+(cell.top-cell.anchorY)*scale);if(left<1||top<1||left+width>127||top+height>114)throw Error('Out-of-cell export '+job.key);let crop;if(owners){const pixels=Buffer.alloc(cell.width*cell.height*4),own=cell.row*4+cell.col+1;for(let y=0;y<cell.height;y++)for(let x=0;x<cell.width;x++){const src=((cell.top+y)*m.width+cell.left+x);if(owners[src]===own)rgba.copy(pixels,(y*cell.width+x)*4,src*4,src*4+4);}crop=await sharp(pixels,{raw:{width:cell.width,height:cell.height,channels:4}}).png().toBuffer();}else crop=await sharp(raw).extract({left:cell.left,top:cell.top,width:cell.width,height:cell.height}).png().toBuffer();frames.push({input:await sharp(crop).resize(width,height).png().toBuffer(),left,top,sourceSha256:hash(crop)});}
  const sourceIndices=Array.from({length:28},(_,i)=>i);if(job.key==='helicopter')sourceIndices.splice(12,8,13,14,18,19,12,15,16,17);frames.splice(0,frames.length,...sourceIndices.map(i=>frames[i]));
  const runtime=[];
  for(const [suffix,list]of [['',frames.slice(0,20)],['-death',frames.slice(20)]]){const bytes=await sharp({create:{width:512,height:list.length/4*128,channels:4,background:'#00000000'}}).composite(list.map((f,i)=>({input:f.input,left:f.left+i%4*128,top:f.top+Math.floor(i/4)*128}))).webp({quality:94,alphaQuality:100}).toBuffer(),relative='web/assets/unit-poses/'+job.key+suffix+'.webp';fs.writeFileSync(path.join(root,relative),bytes);runtime.push({file:relative,sha256:hash(bytes),poses:list.length,bytes:bytes.length});}
  const contact=await sharp({create:{width:512,height:896,channels:4,background:'#213936'}}).composite(frames.map((f,i)=>({input:f.input,left:f.left+i%4*128,top:f.top+Math.floor(i/4)*128}))).png().toBuffer();fs.writeFileSync(out+'/gallery/'+job.key+'.png',contact);
  const sampled=[0,3,4,7,11,12,15,16,18,19,20,23,25,27],strip=await sharp({create:{width:14*96,height:112,channels:4,background:'#213936'}}).composite(await Promise.all(sampled.map(async(f,i)=>({input:await sharp(frames[f].input).resize(Math.max(1,Math.round((await sharp(frames[f].input).metadata()).width*.75)),Math.max(1,Math.round((await sharp(frames[f].input).metadata()).height*.75))).png().toBuffer(),left:i*96+Math.round(frames[f].left*.75),top:Math.round(frames[f].top*.75)})))).png().toBuffer();
  overview.push({key:job.key,input:strip});records.push({key:job.key,source:path.relative(root,file).replaceAll('\\','/'),sourceSha256:hash(originalRaw),trim,original:g.original,repairedOriginal:repaired?.original,prompt:repaired?.prompt||g.prompt,transparentFraction:transparent,authoredLiving:20,authoredDeath:8,uniqueSourceCrops:new Set(frames.map(f=>f.sourceSha256)).size,scale,commonAnchor:[64,112],sourceIndices,method,yCuts,cells,sourceCropHashes:frames.map(f=>f.sourceSha256),runtime});
  console.log('Exported '+job.key+' 20+8 poses');
 }
 for(let i=0;i<overview.length;i+=4){const group=overview.slice(i,i+4);await sharp({create:{width:14*96,height:group.length*138,channels:4,background:'#213936'}}).composite(group.flatMap((v,j)=>[{input:Buffer.from(`<svg width="1344" height="26"><text x="10" y="20" fill="#e5d5ad" font-family="sans-serif" font-size="15">${v.key}: idle / move / action / death</text></svg>`),left:0,top:j*138},{input:v.input,left:0,top:j*138+26}])).png().toFile(out+'/gallery/group-'+(i/4+1)+'.png');}
 const manifest={generator:'Built-in ImageGen',version:2,requestedUnitTypes:24,completedUnitTypes:records.length,originalV1Preserved:true,livingPerType:20,deathPerType:8,authoredPaintings:records.length*28,cellSize:128,layout:{living:[4,5],death:[4,2]},notes:'All28 original source paintings per type are individually exported without repeated timeline cells. Source crop uniqueness is a byte check, not a substitute for visual pose review. One common physical scale is applied to living and death; code must retain that shared normalization.',records};
 fs.writeFileSync(source+'/manifest'+(partial||wanted?'-partial':'')+'.json',JSON.stringify(manifest,null,2)+'\n');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
