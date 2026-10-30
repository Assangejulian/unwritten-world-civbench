const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('./browser-runtime.cjs').load('sharp');
const root=path.resolve(__dirname,'..');
const sourceDir=path.join(root,'art-source/portraits-branding');
const portraits=path.join(root,'web/assets/leaders');
const branding=path.join(root,'web/assets/branding');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function main(){
  await Promise.all([fs.mkdir(portraits,{recursive:true}),fs.mkdir(branding,{recursive:true}),fs.mkdir(path.join(root,'output/playwright'),{recursive:true})]);
  const records=JSON.parse(await fs.readFile(path.join(sourceDir,'prompts.json'),'utf8')),manifest=[];
  for(const record of records){
    const original=path.join(sourceDir,record.key+'.png'),raw=await fs.readFile(original).catch(()=>fs.readFile(record.source));
    await fs.writeFile(original,raw);const meta=await sharp(raw).metadata();
    if(record.key==='cover'){await sharp(raw).resize({width:1920,withoutEnlargement:true}).webp({quality:84}).toFile(path.join(branding,'cover.webp'));}
    else if(record.key==='icon'){
      const sizes=[16,24,32,48,64,128,256],buffers=[];
      for(const size of sizes)buffers.push(await sharp(raw).resize(size,size).png().toBuffer());
      const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
      sizes.forEach((size,i)=>{const at=6+16*i;header[at]=header[at+1]=size===256?0:size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(buffers[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=buffers[i].length;});
      await fs.writeFile(path.join(branding,'game-icon.ico'),Buffer.concat([header,...buffers]));
      await sharp(raw).resize(256,256).png().toFile(path.join(branding,'game-icon.png'));
      await sharp(raw).resize(64,64).png().toFile(path.join(branding,'favicon.png'));
    }else{
      await sharp(raw).resize(640,800,{fit:'cover'}).webp({quality:83}).toFile(path.join(portraits,record.key+'.webp'));
      const side=Math.round(meta.width*.70),left=Math.round((meta.width-side)/2),top=Math.round(meta.height*.06);
      await sharp(raw).extract({left,top,width:side,height:side}).resize(128,128).webp({quality:84}).toFile(path.join(portraits,record.key+'-small.webp'));
    }
    manifest.push({key:record.key,source:'Built-in ImageGen',original:'art-source/portraits-branding/'+record.key+'.png',sha256:hash(raw),width:meta.width,height:meta.height,prompt:record.prompt});
  }
  await fs.writeFile(path.join(root,'web/assets/portraits-branding-manifest.json'),JSON.stringify({version:1,generatedAt:'2026-10-05',artDirection:'Historical oil and gouache, deep teal and antique gold',records:manifest},null,2));
  const leaders=manifest.filter(x=>!['cover','icon'].includes(x.key)),composites=[];
  for(let i=0;i<leaders.length;i++){
    const r=leaders[i],tile=await sharp(path.join(portraits,r.key+'.webp')).resize(190,238).toBuffer();composites.push({input:tile,left:(i%5)*200,top:Math.floor(i/5)*280});
    const label=Buffer.from(`<svg width="200" height="30"><text x="95" y="20" text-anchor="middle" fill="#ecd6a4" font-family="Arial" font-size="13">${r.key}</text></svg>`);composites.push({input:label,left:(i%5)*200,top:Math.floor(i/5)*280+239});
    const avatar=await sharp(path.join(portraits,r.key+'-small.webp')).resize(40,40).png().toBuffer();composites.push({input:avatar,left:(i%5)*200+150,top:Math.floor(i/5)*280+200});
  }
  await sharp({create:{width:1000,height:1400,channels:3,background:'#102b31'}}).composite(composites).png().toFile(path.join(root,'output/playwright/leader-portrait-gallery.png'));
  console.log(JSON.stringify({portraits:leaders.length,avatars:leaders.length,branding:2}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
