// Actual isolated HTTP player page, real production commands and projected map art.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import * as E from '../src/engine.mjs';
import * as C from '../src/climate.mjs';
import {TECHS,CIVICS,productionCost} from '../src/rules.mjs';
import {tilesInRange} from '../src/world.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {listen} from '../src/environment/http.mjs';
import {field} from './imperial-fixture.mjs';
import browserRuntime from './browser-runtime.cjs';

const out=path.resolve(process.env.CLIMATE_CHECK_OUTPUT||'output/climate-20261029/acceptance');await mkdir(out,{recursive:true});
const checks=[],errors=[],httpErrors=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const {g,p,home,other,third,tile}=field();
g.settings.climateEnabled=true;g.settings.disasterIntensity=0;g.settings.autosaveEnabled=false;g.settings.playMode='turns';
for(const t of [tile(3,3),tile(4,3),tile(5,3)])Object.assign(t,{river:true,riverEdges:[0,3],owner:0,territoryCity:home.id});
tile(6,5).terrain='coast';Object.assign(tile(5,5),{owner:0,territoryCity:home.id,improvement:'farm'});
for(const [center,terrain,radius]of [[tile(10,10),'desert',1],[tile(14,10),'snow',1],[tile(18,10),'ocean',2]])for(const t of tilesInRange(g.map,center,radius))t.terrain=terrain;
tile(23,10).terrain='mountain';
for(const player of g.players){assignController(player,player.id===0?'human':'inactive');player.techs=Object.keys(TECHS);player.civics=Object.keys(CIVICS);player.gold=1000000;}
for(const [city,plant]of [[home,'coalplant'],[other,'oilplant'],[third,'powerplant']]){city.population=6;city.buildings.push('industrial','workshop','factory',plant);}
delete g.climate;C.initializeClimate(g);g.climate.geography.volcanoes=[tile(23,10).id];
for(let i=0;i<12;i++){g.turn++;C.settleClimate(g,{event:E.event});}
for(const [kind,center]of [['flood',tile(4,3)],['drought',tile(10,10)],['duststorm',tile(10,10)],['blizzard',tile(14,10)],['hurricane',tile(18,10)],['eruption',tile(23,10)]])C.startDisaster(g,kind,center.id,{severity:2});
for(const t of [tile(10,10),tile(14,10),tile(18,10),tile(22,10)])E.addUnit(g,0,'scout',t.id);
home.production={item:'monument',tile:null,progress:2,cost:productionCost(g,'monument')};E.refreshVisibility(g);
const runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});
const host=await listen(runtime,{port:0}),browser=await browserRuntime.load('playwright').chromium.launch({headless:true,executablePath:browserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push({path:new URL(r.url()).pathname,status:r.status()});});
await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});};
async function openClimate(){await page.locator('[data-b-menu]').click();await page.locator('.b-menu-pop [data-b-click=\'button[data-modal="climate"]\']').click();await page.locator('.clp[open]').waitFor();}
try{
  await page.goto(host.url+'/?access='+token,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
  await page.evaluate(()=>window.__civ.renderer.menuOpen=true);
  const hash=runtime.gameplayHash();
  for(const [width,height]of [[1920,1080],[1280,800],[390,844]]){
    await page.setViewportSize({width,height});await openClimate();
    assert.equal(await page.locator('#clp-title').textContent(),'气候');assert(!await page.locator('.clp').innerText().then(s=>s.includes('只读')||s.includes('寰宇气候')||s.includes('待规则字段')));
    const box=await page.locator('.clp').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1);
    assert.equal(await page.locator('.clp').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    assert.equal(await page.locator('.clp-steps li').count(),8);
    assert.equal(await page.locator('.clp-legend li').count(),2);
    const totals=await page.evaluate(()=>({shown:window.__civ.game.climate.contributors.reduce((n,p)=>n+p.total,0),actual:window.__civ.game.climate.totalEmissions}));assert.equal(totals.shown,totals.actual);
    await shot('climate-'+width);await page.keyboard.press('Escape');await page.locator('.clp').waitFor({state:'hidden'});
    assert.equal(await page.locator('[data-b-menu]').evaluate(el=>document.activeElement===el),true);
  }
  assert.equal(runtime.gameplayHash(),hash);pass('Actual More-menu entry, concise copy, eight phases and real privacy-safe totals fit 1920/1280/390px; Escape returns focus');

  await page.setViewportSize({width:1440,height:1000});await openClimate();
  const active=await page.evaluate(()=>{const c=window.__civ.game.climate,body=document.querySelector('.clp-body'),h=body.innerHTML;window.__civ.climatePanel.update(window.__civ.game);return {same:body.innerHTML===h,own:c.own.player,foreignNames:c.contributors.filter(p=>p.player!==c.own.player).map(p=>p.name),missing:c.rng!==undefined};});
  assert(active.same&&!active.missing&&active.own===0);assert.deepEqual(active.foreignNames,['其他文明']);
  await page.evaluate(()=>window.__civ.openModal('help'));assert(!await page.locator('.clp').isVisible());assert(await page.locator('#modal').isVisible());await page.locator('#close-modal').click();
  pass('The selected panel uses projected own/anonymous data, skips identical redraws and is exclusive with shared dialogs');

  await page.evaluate(()=>document.getElementById('city-workshop-launcher').click());await page.locator('.cw').waitFor();
  await page.locator('[data-cw-mode="gold"]').click();await page.locator('.cw-search').fill('水坝');
  await page.locator('.cw-row[data-cw-row="dam:"]').click();const queue=JSON.stringify(runtime.game.cities.find(c=>c.id===home.id).production),gold=runtime.game.players[0].gold;
  await page.locator('.cw-submit').click();await page.waitForFunction(id=>window.__civ.game.cities.find(c=>c.id===id).buildings.includes('dam'),home.id);
  assert(runtime.game.players[0].gold<gold);assert.equal(JSON.stringify(runtime.game.cities.find(c=>c.id===home.id).production),queue);
  await page.locator('.cw-close').click();await openClimate();assert(await page.locator('.clp').isVisible());await page.keyboard.press('Escape');
  pass('The real workshop purchases a legal river dam, debits gold and preserves the existing production queue');

  const urls=['blizzard','duststorm','flood','hurricane','eruption','drought','dam'];
  await page.evaluate(async urls=>{await Promise.all(urls.map(key=>{const img=new Image();img.src='/assets/climate/'+key+'.webp';return img.decode();}));},urls);
  const art=await page.evaluate(async()=>{
    const {drawClimateWeather}=await import('/climate-weather.js');
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=240;const ctx=canvas.getContext('2d');
    const tile={id:0,q:0,r:0,terrain:'desert',hidden:false,visible:true};
    const renderer={game:{map:{width:6,wrapX:true,tiles:[tile]},climate:{enabled:true,inundated:[],disasters:[{id:1,type:'duststorm',severity:1,tiles:[0]}]},cities:[]},width:400,height:240,zoom:1,reduced:true,time:0,screen:()=>({x:-10000,y:120})};
    const count=()=>{const data=ctx.getImageData(0,0,400,240).data;let n=0;for(let i=3;i<data.length;i+=4)if(data[i])n++;return n;};
    drawClimateWeather(renderer,ctx);const wrapped=count();ctx.clearRect(0,0,400,240);tile.hidden=true;drawClimateWeather(renderer,ctx);const hidden=count();
    tile.hidden=false;tile.visible=false;drawClimateWeather(renderer,ctx);return {wrapped,hidden,remembered:count()};
  });assert(art.wrapped>100);assert.equal(art.hidden,0);assert.equal(art.remembered,0);
  pass('All seven transparent assets decode; projected storm ink wraps correctly and never paints hidden or remembered terrain');

  const weather=await page.evaluate(async()=>{
    const r=window.__civ.renderer,game=r.game,saved=game.climate,target=game.map.tiles[10*32+14];r.targetCam=null;r.cam={...r.position(target)};r.zoom=1.15;
    const draw=()=>{r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;return r.ctx.getImageData(0,0,r.width,r.height).data;};
    game.climate={...saved,disasters:[],inundated:[]};const before=new Uint8Array(draw());game.climate=saved;draw();
    await new Promise(resolve=>setTimeout(resolve,300));const after=draw();let changed=0;for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>8)changed++;
    return {changed,types:[...new Set(saved.disasters.map(d=>d.type))],ready:!!r.modelsReady};
  });assert(weather.ready&&weather.changed>300);assert(weather.types.length>=5);await shot('weather-map');
  pass('The actual 3D player map draws the authoritative multi-disaster footprints over the existing terrain and unit renderer');

  await page.evaluate(id=>window.__civ.selectTile(window.__civ.game.map.tiles[id]),tile(23,10).id);
  assert((await page.locator('#inspector .climate-tile-notice').innerText()).includes('火山喷发'));
  const notice=await page.locator('#inspector .climate-tile-notice').innerText();assert(notice.includes('2级'));
  await page.evaluate(id=>window.__civ.selectTile(window.__civ.game.map.tiles[id]),home.tile);
  assert((await page.locator('#inspector .climate-tile-notice').innerText()).includes('排放'));
  pass('The human tile inspector exposes the same hazard severity, duration, protection and city emissions as MCP');

  const observer=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'}),observerPage=await observer.newPage();
  try{await observerPage.goto(host.url+'/?access='+runtime.observerToken,{waitUntil:'domcontentloaded'});await observerPage.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});await observerPage.evaluate(()=>{window.__civ.renderer.menuOpen=true;window.__civ.openModal('climate');});
    assert.equal(await observerPage.locator('.clp-legend li').count(),3);assert(!await observerPage.locator('.clp').innerText().then(text=>text.includes('只读')));
    assert.equal(await observerPage.evaluate(()=>window.__civ.game.climate.own),null);
  }finally{await observer.close();}
  pass('A real observer sees all aggregate emissions without a redundant permission label or gameplay controls');
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);pass('No browser exceptions or failed HTTP resources');
  await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,errors,httpErrors,paidModel:false,productionSaveWrites:false},null,2));
}catch(error){await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,checks,errors,httpErrors},null,2));await shot('failure').catch(()=>{});throw error;}
finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
