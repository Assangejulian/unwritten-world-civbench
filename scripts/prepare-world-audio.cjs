const fs=require('node:fs'),crypto=require('node:crypto');
const files=[];
// Original seeded motor ignition, turbulent flight and bass impact layers.
for(let variant=0;variant<2;variant++){
 const rate=22050,seconds=1.7+variant*.16,n=Math.round(rate*seconds),data=Buffer.alloc(44+n*2);
 data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(n*2,40);
 let seed=0x173821+variant,low=0,mid=0;
 for(let i=0;i<n;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1,t=i/rate;
  low=low*.992+noise*.008;mid=mid*.72+noise*.28;
  const ignition=Math.exp(-t*18),flight=Math.min(1,t/.09)*Math.exp(-t*2.3),impact=Math.exp(-Math.max(0,t-1.04)*9)*(t>=1.04?1:0);
  const value=flight*(mid*.48+low*3+noise*.05)+ignition*noise*.4+impact*(low*4+noise*.18+Math.sin(t*2*Math.PI*(49+variant*8))*.25);
  data.writeInt16LE(Math.round(Math.max(-.9,Math.min(.9,value))*32767),44+i*2);
 }
 const file=`web/assets/audio/sfx/missile-${variant}.wav`;fs.writeFileSync(file,data);files.push({file,seconds,sampleRate:rate,channels:1,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
fs.writeFileSync('art-source/world-systems-20261007/audio.json',JSON.stringify({author:'Original synthesis for Hex Civilizations',license:'CC0-1.0',files},null,2)+'\n');console.log(files.map(({file,bytes})=>({file,bytes})));
