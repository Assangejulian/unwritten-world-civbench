// Import a private imagegen receipt; retain originals and publish relative provenance.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
  const out='output/natural-wonders-real35-20261030',source='art-source/natural-wonders-real35-20261030',runtime='web/assets/natural-wonders';
  const plan=JSON.parse(await fs.readFile(path.join(out,'art-import.json'),'utf8'));
  const previous=JSON.parse(await fs.readFile('art-source/natural-wonders-20261030/manifest.json','utf8'));
  for(const key of ['zhangjiajie','great_barrier_reef','iguazu_falls','eye_of_the_sahara']){const old=previous.assets.find(a=>a.key===key);plan[key]={source:old.source,subject:old.subject,reused:true};}
  if(Object.keys(plan).length!==35)throw Error('Expected exactly 35 real sites');
  await fs.mkdir(source,{recursive:true});await fs.mkdir(runtime,{recursive:true});
  const assets=[],cells=[];
  for(const [key,item]of Object.entries(plan)){
    const original=await fs.readFile(item.source),meta=await sharp(original).metadata();
    if(!meta.hasAlpha)throw Error('Missing source alpha: '+key);
    const webp=await sharp(original).resize(384,384,{fit:'inside'}).webp({quality:88,alphaQuality:100}).toBuffer();
    const sourceFile=item.reused?item.source:`${source}/${key}.png`;
    if(!item.reused)await fs.writeFile(sourceFile,original);await fs.writeFile(path.join(runtime,key+'.webp'),webp);
    const stats=await sharp(webp).stats();if(stats.channels[3].min!==0||stats.channels[3].max<128)throw Error('Invalid alpha: '+key);
    assets.push({key,source:sourceFile,runtime:`${runtime}/${key}.webp`,sourceWidth:meta.width,sourceHeight:meta.height,sourceSha256:hash(original),runtimeSha256:hash(webp),runtimeBytes:webp.length,hasAlpha:true,subject:item.subject,reused:!!item.reused});
    const thumb=await sharp(webp).resize(250,240,{fit:'inside'}).png().toBuffer();
    const i=(assets.length-1)%12;cells.push({input:thumb,left:(i%4)*300+25,top:Math.floor(i/4)*290+10});
    const label=Buffer.from(`<svg width="300" height="32"><text x="150" y="23" fill="#e3d8bc" font-family="sans-serif" font-size="14" text-anchor="middle">${key}</text></svg>`);
    cells.push({input:label,left:(i%4)*300,top:Math.floor(i/4)*290+250});
    if(assets.length%12===0||assets.length===35){await sharp({create:{width:1200,height:870,channels:3,background:'#282c31'}}).composite(cells).jpeg({quality:84}).toFile(path.join(out,`art-contact-${Math.ceil(assets.length/12)}.jpg`));cells.length=0;}
  }
  await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({generator:'built-in imagegen',transparentBackground:true,assets,totalRuntimeBytes:assets.reduce((n,a)=>n+a.runtimeBytes,0)},null,2)+'\n');
  console.log(JSON.stringify({assets:assets.length,bytes:assets.reduce((n,a)=>n+a.runtimeBytes,0)}));
})();
