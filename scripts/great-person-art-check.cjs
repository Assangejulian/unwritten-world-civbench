const {chromium}=require('./browser-runtime.cjs').load('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.GREAT_PERSON_ART_CHECK_OUTPUT||'output/great-person-protection-20261016');
(async()=>{
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),H=await import(pathToFileURL(path.join(root,'src/heritage.mjs'))),R=await import(pathToFileURL(path.join(root,'src/rules.mjs'))),{RealtimeSimulation}=await import(pathToFileURL(path.join(root,'src/realtime.mjs')));
 const classes=['general','admiral','engineer','scientist','merchant','prophet','writer','artist','musician'];
 const g=E.createGame({players:2,size:'huge',seed:'GREAT-PERSON-ART',barbarians:false});g.units=[];g.cities=[];
 for(const t of g.map.tiles)Object.assign(t,{terrain:'grass',hill:false,feature:null,river:false,riverEdges:[],resource:null,cityId:null,district:null,owner:null,improvement:null});
 for(const p of g.players){p.manual=true;E.foundCity(g,p,E.addUnit(g,p.id,'settler',g.map.tiles[(p.id?35:8)*g.map.width+10].id));}g.units=[];
 const fixtures=classes.map((cls,i)=>{
  const spec=H.GREAT_PEOPLE.find(p=>p.classKey===cls),tile=g.map.tiles[(12+Math.floor(i/3)*3)*g.map.width+23+i%3*5];
  if(cls==='admiral')for(const t of g.map.tiles)if(R.dist(t,tile,g.map)<=1)t.terrain='coast';
  const u=E.addUnit(g,0,cls==='admiral'?'great_admiral':'great_person',tile.id);Object.assign(u,{greatPerson:spec.key,charges:spec.charges,activations:0});
  g.players[0].greatPeople.owned.push({key:spec.key,unit:u.id});g.heritage.recruited[spec.key]={owner:0,turn:g.turn};return {id:u.id,tile:tile.id,cls,name:spec.name};
 });
 E.refreshVisibility(g);const sim=new RealtimeSimulation(g),projection=E.snapshot(g,-1,{manualOptionsOnly:true}),errors=[];
 const server=http.createServer((req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname,name=route==='/'?'/index.html':decodeURIComponent(route);let file=path.resolve(root,'web','.'+name);if(!fs.existsSync(file))file=path.resolve(root,'src','.'+name);
  if(!['web','src'].some(dir=>file.startsWith(path.join(root,dir)+path.sep))||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable()});
  const page=await browser.newPage({viewport:{width:1500,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{
   const url=new URL(route.request().url());let result={ok:true};
   if(url.pathname==='/api/state')result={game:projection,session:{...sim.state(),revision:1,busy:false}};
   else if(url.pathname==='/api/drivers')result={drivers:R.CIVS.map(c=>({file:c.file,status:'ready'}))};
   else if(url.pathname==='/api/saves')result={entries:[],files:[]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__civ?.menuShown);await page.locator('#menu-continue').click();await page.locator('#toggle-panels').click();
  await page.evaluate(tile=>{const r=window.__civ.renderer;r.focus(window.__civ.game.map.tiles[tile],1.5);r.dirty=true;},g.map.tiles[15*g.map.width+28].id);
  await page.waitForFunction(fixtures=>fixtures.every(f=>window.__civ.renderer.unitHits?.some(h=>h.unit.id===f.id&&h.art?.frame?.asset==='great-people/'+f.cls+'.webp')),fixtures,{timeout:30000});
  const hits=await page.evaluate(fixtures=>fixtures.map(f=>{const h=window.__civ.renderer.unitHits.find(h=>h.unit.id===f.id&&h.art);return {cls:f.cls,asset:h.art.frame.asset,visiblePixels:h.art.frame.alpha.filter(a=>a>80).length,bounds:{x:h.x,y:h.y,width:h.width,height:h.height}};}),fixtures);
  assert(hits.every(h=>h.visiblePixels>500));await page.screenshot({path:path.join(out,'great-people-map-3d.png')});
  const animation=await page.evaluate(async()=>{
   const {ensureGreatPersonMoveArt}=await import("/great-person-art.js");await Promise.all(window.__civ.game.units.map(ensureGreatPersonMoveArt));
   const lib=window.__civ.renderer.unitSprites,result=[];
   for(const u of window.__civ.game.units){const idle=lib.frame(u.type,-1,'idle',null,u),move=lib.frame(u.type,4,'move',null,u),other=lib.frame(u.type,12,'move',null,u),work=lib.frame(u.type,8,'work',null,u),transport=u.type==='great_person'?lib.frame(u.type,4,'move','boat',u):null;
    result.push({cls:u.greatPersonClass,idle:idle.asset,moving:move.asset,distinct:move.canvas.toDataURL()!==other.canvas.toDataURL(),poses:[0,4,8,12].map(i=>lib.frame(u.type,i,'move',null,u).paintedIndex),uniqueFrames:new Set([0,4,8,12].map(i=>lib.frame(u.type,i,'move',null,u).canvas.toDataURL())).size,work:work.alpha.some(v=>v>80),transport:u.type==='great_admiral'||!!transport?.alpha.some(v=>v>80)});
   }return result;
  });assert(animation.every(v=>v.idle==='great-people/'+v.cls+'.webp'&&v.moving==='great-people/'+v.cls+'-move.webp'&&v.poses.join(',')==='0,1,2,3'&&v.uniqueFrames===4&&v.distinct&&v.work&&v.transport),JSON.stringify(animation));
  const movingMap=await page.evaluate(()=>{
   const r=window.__civ.renderer,game=structuredClone(window.__civ.game);game.realtime.time=.25;
   for(const u of game.units)u.activity={owner:u.owner,action:{type:'move',unit:u.id,tile:u.tile+1},path:[u.tile,u.tile+1],index:1,from:u.tile,to:u.tile+1,started:0,ends:2};
   r.setState(game);r.setSimulationState({time:.25,rate:1,running:false});r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;
   return r.unitHits.filter(h=>h.kind==='sprite').map(h=>({id:h.unit.id,asset:h.art?.frame.asset,pose:h.art?.frame.paintedIndex,action:h.pose.action}));
  });assert.equal(movingMap.length,9);assert(movingMap.every(v=>v.asset?.endsWith('-move.webp')&&v.action==='move'&&v.pose>=0&&v.pose<4),JSON.stringify(movingMap));
  await page.screenshot({path:path.join(out,'great-people-map-moving.png')});
  const gallery=await browser.newPage({viewport:{width:1000,height:720}});await gallery.goto('http://127.0.0.1:'+server.address().port+'/great-person-art.js');
  await gallery.setContent('<style>body{margin:22px;background:#e9dfc7;color:#3e3526;font:16px Georgia,serif}h1{font-size:24px;font-weight:400}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0;display:flex;align-items:center;border-bottom:1px solid #b29b6c}img{width:140px;height:172px;object-fit:contain}span{line-height:1.8}small{color:#8d724a}</style><h1>伟人 · 历史人物地图形象</h1><div class="grid"></div>');
  await gallery.evaluate(fixtures=>{const names={general:'大将军',admiral:'海军统帅',engineer:'大工程师',scientist:'大科学家',merchant:'大商人',prophet:'大预言家',writer:'大作家',artist:'大艺术家',musician:'大音乐家'};for(const f of fixtures){const fig=document.createElement('figure');fig.innerHTML='<img src="/assets/great-people/'+f.cls+'.webp"><span>'+f.name+'<br><small>'+names[f.cls]+'</small></span>';document.querySelector('.grid').append(fig);}},fixtures);
  await gallery.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));await gallery.screenshot({path:path.join(out,'great-people-preview.png')});await gallery.close();
  const requests=[];page.on('request',r=>{if(r.url().includes('/assets/great-people/'))requests.push(r.url());});
  const twoD=await page.evaluate(async()=>{
   window.__greatDraws=[];const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.src?.includes("/assets/great-people/"))window.__greatDraws.push(new URL(image.src).pathname);return draw.call(this,image,...args);};
   const {MapRenderer}=await import('/map.js');window.__civ.renderer.menuOpen=true;
   const canvas=document.createElement('canvas'),mini=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:1500px;height:1000px';document.body.append(canvas);
   const r=new MapRenderer(canvas,mini,()=>{},()=>{});r.menuOpen=true;r.setState(window.__civ.game);r.focus(r.game.map.tiles[15*r.game.map.width+28],1.5);r.cam={...r.targetCam};r.zoom=r.targetZoom;r.targetCam=null;window.__great2D=r;r.render();return true;
  });assert(twoD);await page.waitForTimeout(100);await page.evaluate(()=>window.__great2D.render());const twoDClasses=await page.evaluate(()=>[...new Set(window.__greatDraws)]);assert.equal(twoDClasses.length,9,JSON.stringify(twoDClasses));await page.screenshot({path:path.join(out,'great-people-map-2d.png')});
  const twoDMoving=await page.evaluate(async()=>{
   const {greatPersonMoveSource}=await import('/great-person-art.js'),r=window.__great2D,game=structuredClone(window.__civ.game),sources=new Map();
   for(const u of game.units){u.activity={action:{type:'move'}};for(let i=0;i<4;i++)sources.set(greatPersonMoveSource(u,i,4).canvas,u.greatPersonClass);}
   const seen=new Set(),draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(sources.has(image))seen.add(sources.get(image));return draw.call(this,image,...args);};
   r.setState(game);r.time=.75;r.render();return [...seen];
  });assert.equal(twoDMoving.length,9,JSON.stringify(twoDMoving));await page.screenshot({path:path.join(out,'great-people-map-2d-moving.png')});
  const returnVisual=await page.evaluate(async()=>{
   const r3=window.__civ.renderer,r2=window.__great2D,base=structuredClone(window.__civ.game),id=base.units[0].id;
   const {createJourney}=await import('/unit-animation.js');
   const from=base.map.tiles[base.units[0].tile],to=base.map.tiles[from.id+1];
   r3.setState(base);r2.setState(base);
   r3.unitJourneys.set(id,createJourney(base.units[0].type,[r3.position(from),r3.position(to)],0,0));
   r2.animations.set(id,{from:r2.position(from),to:r2.position(to),started:performance.now()/1000});
   const home=base.cities.find(c=>c.owner===0),returned=structuredClone(base);returned.units[0].tile=home.tile;returned.units[0].returnSequence=1;delete returned.units[0].activity;
   r3.setState(returned);r2.setState(returned);
   const instant=!r3.unitJourneys.has(id)&&!r3.unitTurns.has(id)&&!r2.animations.has(id)&&JSON.stringify(r3.unitPose(returned.units[0]).position)===JSON.stringify(r3.position(returned.map.tiles[home.tile]));
   const classic=structuredClone(returned);delete classic.realtime;r3.setState(classic);
   const again=structuredClone(classic);again.units[0].tile=from.id;again.units[0].returnSequence=2;r3.setState(again);
   return {instant,classic:!r3.unitJourneys.has(id)};
  });assert(returnVisual.instant&&returnVisual.classic,JSON.stringify(returnVisual));
  const fog=await page.evaluate(async()=>{
   const {greatPersonSource}=await import('/great-person-art.js');let result=true;
   for(const r of [window.__great2D,window.__civ.renderer]){const game=structuredClone(window.__civ.game);game.units=[];r.setState(game);r.menuOpen=false;r.dirty=true;r.render();result&&=!r.unitHits.some(h=>h.unit?.greatPerson);}return result;
  });assert(fog);assert.deepEqual(errors,[]);
  const report={ok:true,fixtures,hits,animation,movingMap,twoDClasses,twoDMoving,returnVisual,fog,errors,scope:'Actual isolated 2D/3D map renderers, all class painted movement frames and instant repatriation; no active game mutation'};
  fs.writeFileSync(path.join(out,'art-check.json'),JSON.stringify(report,null,2));console.log('PASS all nine classes draw distinct visible map art, move/work/transport frames and fog-safe unit removal in actual 2D/3D renderers');
 }finally{sim.dispose();if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
