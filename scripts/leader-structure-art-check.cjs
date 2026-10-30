// Isolated browser evidence for authored structure frames and projection guards.
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/leader-rework-20261012');
const hash=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
(async()=>{
 const server=http.createServer((req,res)=>{const route=new URL(req.url,'http://localhost').pathname;if(route==='/'){res.setHeader('Content-Type','text/html');return res.end('<html><body style="margin:0;background:#dfd3bc"><canvas width="900" height="600"></canvas></body></html>');}let file=path.resolve(root,'web','.'+decodeURIComponent(route));if(!fs.existsSync(file))file=path.resolve(root,'src','.'+decodeURIComponent(route));if(!['web','src'].some(dir=>file.startsWith(path.join(root,dir)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',/\.(?:js|mjs)$/.test(file)?'text/javascript':'image/png');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});const page=await browser.newPage({viewport:{width:900,height:600}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/assets/'))requests.push(new URL(r.url()).pathname);});await page.goto('http://127.0.0.1:'+server.address().port);
  const guards=await page.evaluate(async()=>{const m=await import('/unique-structures.js'),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),tile={id:0},renderer={zoom:1,screen:()=>({x:150,y:160}),game:{map:{tiles:[tile]}}};const key=Object.keys(m.UNIQUE_STRUCTURE_ART)[0];return {hidden:m.drawUniqueStructure(renderer,ctx,key,{hidden:true}),remembered:m.drawUniqueCityStructures(renderer,ctx,{tile:0,remembered:true,buildings:[key],districts:[]}),unknown:m.drawUniqueStructure(renderer,ctx,'unknown',tile),keys:Object.keys(m.UNIQUE_STRUCTURE_ART)};});
  assert.equal(requests.length,0);assert.equal(guards.hidden,false);assert.equal(guards.remembered,false);assert.equal(guards.unknown,false);
  const result=await page.evaluate(async()=>{
   const m=await import('/unique-structures.js'),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),keys=Object.keys(m.UNIQUE_STRUCTURE_ART),frames=[];canvas.height=keys.length*200;
   for(const [row,key]of keys.entries()){
    const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/assets/'+m.UNIQUE_STRUCTURE_ART[key];});
    const scratch=document.createElement('canvas');scratch.width=image.width;scratch.height=image.height;const sc=scratch.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0);const alpha=sc.getImageData(0,0,image.width,image.height).data;
    for(let state=0;state<3;state++){
     let opaque=0,clear=0;const left=Math.floor(state*image.width/3),right=Math.floor((state+1)*image.width/3);for(let y=0;y<image.height;y++)for(let x=left;x<right;x++){const a=alpha[(y*image.width+x)*4+3];opaque+=a>=48;clear+=a===0;}frames.push({key,state,opaque,transparentFraction:clear/((right-left)*image.height)});
     const renderer={zoom:1.4,screen:()=>({x:state*300+150,y:row*200+165})};m.drawUniqueStructure(renderer,ctx,key,{id:0},state);
    }
   }
   await new Promise(resolve=>setTimeout(resolve,30));ctx.clearRect(0,0,canvas.width,canvas.height);
   for(const [row,key]of keys.entries())for(let state=0;state<3;state++){ctx.fillStyle='#554638';ctx.font='14px sans-serif';ctx.fillText(key+' / '+state,state*300+10,row*200+20);if(!m.drawUniqueStructure({zoom:1.4,screen:()=>({x:state*300+150,y:row*200+165})},ctx,key,{id:0},state))throw Error('Runtime draw failed '+key);}
   return {keys,frames,assets:m.UNIQUE_STRUCTURE_ART};
  });
  assert.deepEqual(errors,[]);assert.equal(result.keys.length,25);assert(result.frames.every(f=>f.opaque>500&&f.transparentFraction>.3));assert(result.keys.every(key=>requests.some(p=>p.includes(key))));
  await page.screenshot({path:path.join(out,'structure-frames.png'),fullPage:true});
  const sources={'web/unique-structures.js':hash('web/unique-structures.js'),'scripts/leader-structure-art-check.cjs':hash('scripts/leader-structure-art-check.cjs')};for(const file of Object.values(result.assets))sources['web/assets/'+file]=hash('web/assets/'+file);
  fs.writeFileSync(path.join(out,'structure-art.json'),JSON.stringify({passed:true,result,guards,errors,sources,scope:'Registered structure atlas states and lazy projected-state guards; complete 2D/3D map integration pending'},null,2));console.log('PASS '+result.keys.length+' structure sheets: three nonempty transparent states, runtime drawing and lazy hidden/remembered guards.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
