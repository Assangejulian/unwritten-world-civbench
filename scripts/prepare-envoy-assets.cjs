const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'art-source/envoy-20261006'),target=path.join(root,'web/assets');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 await fs.mkdir(source,{recursive:true});
 const initial=await fs.readFile(process.argv[2]),raw=await fs.readFile(process.argv[3]);
 await fs.writeFile(path.join(source,'envoy-initial.png'),initial);await fs.writeFile(path.join(source,'envoy-sheet.png'),raw);
 const meta=await sharp(raw).metadata(),stats=await sharp(raw).stats();
 if(!meta.hasAlpha||stats.channels.at(-1).min!==0)throw Error('Envoy sheet must have true transparent alpha.');
 const runtime=await sharp(raw).webp({quality:88,alphaQuality:100}).toBuffer();
 await fs.writeFile(path.join(target,'envoy-painted-v1.webp'),runtime);
 const icon=await sharp(raw).extract({left:0,top:0,width:Math.floor(meta.width/4),height:Math.floor(meta.height/5)}).trim({threshold:5}).resize(128,128,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:88,alphaQuality:100}).toBuffer();
 await fs.writeFile(path.join(target,'envoy-icon-v1.webp'),icon);
 const record={version:1,date:'2026-10-06',generator:'Built-in ImageGen',type:'envoy',original:'art-source/envoy-20261006/envoy-sheet.png',initialOriginal:'art-source/envoy-20261006/envoy-initial.png',prompt:'art-source/envoy-20261006/prompt.txt',walkEditPrompt:'art-source/envoy-20261006/walk-edit-prompt.txt',sourceSha256:hash(raw),initialSha256:hash(initial),width:meta.width,height:meta.height,alpha:true,columns:4,rows:5,poses:20,actions:{idle:[0,1,2,3],move:[4,5,6,7,8,9,10,11],work:[12,13,14,15,16,17,18,19]},baseSign:1,normalization:'One shared fit and foot baseline; bowing is a posture change.',runtime:[{file:'web/assets/envoy-painted-v1.webp',bytes:runtime.length,sha256:hash(runtime)},{file:'web/assets/envoy-icon-v1.webp',bytes:icon.length,sha256:hash(icon)}],notes:'Original generated artwork. No religious identity or combat weapons. Dynamic gold protection is rendered by game state, not baked into the source. Icon is a crop of the same idle figure.'};
 await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));
})().catch(error=>{console.error(error);process.exitCode=1;});
