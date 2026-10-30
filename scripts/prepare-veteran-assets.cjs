const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/veterans-20261006'),target=path.join(root,'web/assets/veterans');
(async()=>{
 await fs.mkdir(target,{recursive:true});const raw=await fs.readFile(path.join(source,'insignia-atlas.png')),meta=await sharp(raw).metadata(),records=[];
 if(!meta.hasAlpha)throw Error('Generated atlas must retain transparent alpha.');
 for(const [i,key]of ['assault','bastion','terrain','medicine'].entries()){
  const width=Math.floor(meta.width/2),height=Math.floor(meta.height/2),cell={left:i%2*width,top:Math.floor(i/2)*height,width,height};
  const extracted=await sharp(raw).extract(cell).toBuffer();
  const icon=await sharp(extracted).trim({threshold:5}).resize({width:128,height:128,fit:'contain',background:'#00000000'}).webp({quality:86,alphaQuality:100}).toBuffer();
  const stats=await sharp(icon).stats();if(stats.channels.at(-1).min!==0)throw Error('Missing transparent padding: '+key);
  await fs.writeFile(path.join(target,key+'.webp'),icon);records.push({key,cell,bytes:icon.length,sha256:crypto.createHash('sha256').update(icon).digest('hex'),runtime:'web/assets/veterans/'+key+'.webp'});
 }
 await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify({version:1,source:'Built-in ImageGen',original:'art-source/veterans-20261006/insignia-atlas.png',sourceSha256:crypto.createHash('sha256').update(raw).digest('hex'),records},null,2));
 console.log(JSON.stringify({icons:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
