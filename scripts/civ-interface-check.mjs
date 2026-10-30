import auditBrowserRuntime from './browser-runtime.cjs';
// Disposable player-view validation; no production host, saves or paid API.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {exploredBounds,worldBounds,wholeWorldZoom,constrainCamera,chartX} from '../web/world-camera.js';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import * as E from '../src/engine.mjs';
import {field} from './imperial-fixture.mjs';

const out=path.resolve(process.env.UI_CHECK_OUTPUT||'output/civ-interface-20261022/acceptance');
await mkdir(out,{recursive:true});
const checks=[],errors=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const model={width:100,height:66,wrapX:true,tiles:Array.from({length:6600},(_,id)=>({id,q:id%100-Math.floor(Math.floor(id/100)/2),r:Math.floor(id/100),hidden:true}))};
for(const row of [20,21,22])for(const col of [98,99,0,1])model.tiles[row*100+col].hidden=false;
const projected={map:model,visuals:{view:0}},a=exploredBounds(projected),full=worldBounds(model);
assert(a.right-a.left<full.period*.15);assert(a.bottom-a.top<full.bottom-full.top);
for(const t of model.tiles.filter(t=>!t.hidden)){const x=chartX(75+35*Math.sqrt(3)*(t.q+t.r/2),a);assert(x>a.left&&x<a.right);}
const clamped=constrainCamera({x:-1e6,y:-1e6},1.98,1440,900,a,true);
assert(clamped.x>=a.left&&clamped.x<=a.right);assert(clamped.y>=a.top-100&&clamped.y<=a.bottom+100);
for(const col of [10,11,12])model.tiles[21*100+col].hidden=false;
const expanded=exploredBounds(projected);assert(expanded.right-expanded.left>a.right-a.left);
assert(wholeWorldZoom(expanded,1440,900)<=wholeWorldZoom(a,1440,900));
assert.deepEqual(exploredBounds({...projected,visuals:{view:-1}}),full);
pass('Exploration bounds grow across a wrapped seam, constrain cameras and preserve full observers');

const {g,p,tile}=field();g.settings.playMode='turns';g.settings.autosaveEnabled=false;p.civics=['code'];p.met=[];p.explored=[];p.knownTiles={};p.knownCities={};
const warrior=E.addUnit(g,0,'warrior',tile(5,3).id);E.addUnit(g,0,'scout',tile(3,5).id);E.addUnit(g,0,'builder',tile(3,4).id);
for(const player of g.players)assignController(player,player.id===0?'human':'inactive');
E.refreshVisibility(g);
const runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});
const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});
const host=await listen(runtime,{port:0});
const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));
await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
const shot=async name=>page.screenshot({path:path.join(out,name+'.png')});
try{
 await page.goto(host.url+'/?access='+token,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
 await page.evaluate(()=>{window.__civ.renderer.menuOpen=true;});
 const icons=await page.evaluate(async()=>{const {UNIT_SYMBOLS,unitGlyph}=await import('/map.js'),{UNIT_INSIGNIA}=await import('/unit-etchings.js'),{UNITS}=await import('/rules.mjs');const keys=Object.keys(UNITS);return {count:keys.length,missing:keys.filter(k=>!UNIT_SYMBOLS[k]?.path||!UNIT_INSIGNIA[k]?.[0]),paths:keys.map(k=>[k,UNIT_INSIGNIA[k]?.join('|')]),allSvg:keys.every(k=>/fill-rule="(?:evenodd|nonzero)"/.test(unitGlyph(k))),researchParity:keys.every(k=>document.querySelector(`#b4-unit-${k} path`)?.getAttribute('d')===UNIT_INSIGNIA[k]?.[0])};});
 assert.deepEqual(icons.missing,[]);assert(icons.allSvg);assert(icons.researchParity);
 const families=new Map();for(const [type,d]of icons.paths){if(!families.has(d))families.set(d,[]);families.get(d).push(type);}
 assert.deepEqual([...families.values()].filter(x=>x.length>1),[]);
 pass(`All ${icons.count} unit types have distinct solid insignia shared across panels and map markers`);
 const map=await page.evaluate(()=>{const r=window.__civ.renderer;return {bounds:r.cameraBounds,fullWidth:r.game.map.width*35*Math.sqrt(3),zoom:r.zoom,miniScale:r.miniScale,miniWidth:r.mini.width,hits:r.unitHits.filter(h=>h.kind==='badge').map(h=>({id:h.unit.id,x:h.x,y:h.y,width:h.width,height:h.height})),flags:r.unitHits.filter(h=>h.kind==='flag').length};});
 assert(map.bounds.explored);assert(map.bounds.right-map.bounds.left<map.fullWidth*.8);assert.equal(map.flags,0);assert(map.hits.length>=3);
 const hit=map.hits.find(h=>h.id===warrior.id);assert(hit);await page.mouse.click(hit.x+hit.width/2,hit.y+hit.height/2,{button:'right'});
 await page.waitForFunction(id=>window.__civ.selection?.type==='unit'&&window.__civ.selection.id===id,warrior.id);
 await page.waitForFunction(()=>{const r=window.__civ.renderer;return r.textureReady&&r.biomeReady&&r.modelsReady;},null,{timeout:90000});
 await page.evaluate(()=>{const r=window.__civ.renderer;r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;});
 await page.mouse.move(720,700);await shot('player-unit-badges');
 assert.equal(await page.evaluate(()=>window.__civ.game.units.find(u=>u.id===window.__civ.selection.id).type),'warrior');
 pass('The actual circular marker selects its moving-unit identity by right click and no flag hit zones remain');
 await page.locator('#civ-unit-dock:not([hidden])').waitFor();
 assert.equal(await page.locator('#inspector').evaluate(el=>getComputedStyle(el).visibility),'hidden');
 const stat=await page.locator('.cud-stats .cud-hp').boundingBox();assert(stat.height>=14);
 const dockBox=await page.locator('#civ-unit-dock').boundingBox(),taskBox=await page.locator('.pt-dock').boundingBox();assert(dockBox.x+dockBox.width<=taskBox.x-6,'Unit card and task orb must sit side by side without overlap');
 assert.equal(await page.locator('#civ-unit-dock button:disabled').count(),0);assert.equal(await page.locator('.cud-attack,.cud-pillage,.cud-destroyRoad,.cud-linkUnits').count(),0,'Unavailable commands must be absent');
 const paper=await page.evaluate(()=>{const r=window.__civ.renderer,before=r.chartFog.builds;r.dirty=false;r.unitFrame=true;r.menuOpen=false;r.render();r.menuOpen=true;return {before,after:r.chartFog.builds,edge:r.chartFog.edgePixels};});assert.equal(paper.before,paper.after);assert(paper.edge>100,'The fog edge must have translucent pixels');
 pass('Unit actions are target-aware, controls sit side by side, and fog is feathered and cached on idle frames');
 await page.locator('[data-cud-details]').click();assert.equal(await page.locator('#inspector').evaluate(el=>getComputedStyle(el).visibility),'visible');await page.locator('[data-cud-details]').click();
 await page.locator('#civ-unit-dock .cud-fortify').click();
 await page.waitForFunction(id=>window.__civ.game.units.find(u=>u.id===id)?.fortified,warrior.id);assert(runtime.game.units.find(u=>u.id===warrior.id).fortified);
 pass('Compact unit commands execute a real fortify order; full details remain optional and health text stays visible');
 assert.equal(await page.locator('#civ-rankings.open').count(),0);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  await page.locator('#civ-rankings-btn').click();
  for(const key of ['overview','science','culture','domination','religion','diplomacy','score']){
   await page.locator(`[data-cr-tab="${key}"]`).first().click();
   if(key!=='overview'){assert.equal(await page.locator('#civ-rankings .cr-unknown').getAttribute('data-count'),'2');assert.equal(await page.locator('#civ-rankings .cr-rank li:not(.cr-unknown)').count(),1);}
   const size=await page.locator('#civ-rankings').boundingBox();assert(size.x>=-1&&size.x+size.width<=width+1);
  }
  await page.locator('[data-cr-tab="science"]').first().click();
  assert((await page.locator('#civ-rankings .cr-next').innerText()).includes('发射人造卫星'));assert((await page.locator('.cr-rules').innerText()).includes('胜利条件'));assert.equal(await page.locator('.cr-rules').getAttribute('open'),null);
  await page.evaluate(()=>{const el=document.querySelector('.cr-body');el.dataset.probe='preserved';el.scrollTop=10;});
  await page.evaluate(()=>window.__civ.refresh(true));assert.equal(await page.locator('.cr-body').getAttribute('data-probe'),'preserved');
  await shot('rankings-science-'+width);await page.keyboard.press('Escape');assert.equal(await page.locator('#civ-rankings.open').count(),0);
  await page.locator('#civ-rankings-btn').click();await page.locator('[data-cr-close]').click();
 }
 const narrowDock=await page.locator('#civ-unit-dock').boundingBox();assert(narrowDock.x>=0&&narrowDock.x+narrowDock.width<=391,'Compact commands fit the narrow viewport');await shot('unit-console-390');
 await page.setViewportSize({width:1440,height:1000});
 pass('Real seat rankings switch all seven views, keep unknown opponents anonymous, fit desktop/mobile and close by Escape or cross');

 await page.mouse.click(700,500);await page.waitForFunction(()=>!window.__civ.selection);
 const initial=await page.evaluate(()=>{const r=window.__civ.renderer;r.fit();r.menuOpen=false;r.render();r.menuOpen=true;return {width:r.cameraBounds.right-r.cameraBounds.left,revision:r.minimapRevision};});
 E.addUnit(g,0,'scout',tile(14,10).id);E.refreshVisibility(g);
 const after=await page.evaluate(snapshot=>{const r=window.__civ.renderer;r.setState(snapshot);r.fit();r.menuOpen=false;r.render();r.menuOpen=true;return {width:r.cameraBounds.right-r.cameraBounds.left,revision:r.minimapRevision};},E.snapshot(g,0,{manualOptionsOnly:true}));
 assert(after.width>initial.width);assert(after.revision>initial.revision);await shot('exploration-expanded');
 pass('A newly explored distant region expands both the actual camera domain and minimap without exposing hidden terrain');
 // Visual matrix uses the production SVG and raster painter, including minimum zoom.
 const gallery=await context.newPage();await gallery.goto(host.url+'/unit-etchings.js');
 await gallery.setViewportSize({width:1320,height:1360});
 const glyphCheck=await gallery.evaluate(async()=>{
  const {drawUnitBadge,unitGlyph}=await import('/map.js'),{UNITS}=await import('/rules.mjs');
  document.head.innerHTML='<style>body{margin:0;padding:24px;background:#122330;color:#e9e5d7;font:12px "Microsoft YaHei",sans-serif}h1{font:24px Georgia,serif;margin:0 0 20px}main{display:grid;grid-template-columns:repeat(10,1fr);gap:8px}article{min-width:0;height:104px;border-bottom:1px solid #728fa244;text-align:center}.symbols{display:flex;align-items:center;justify-content:center;height:69px;gap:5px}svg{width:48px;height:48px}canvas{width:63px;height:63px}span{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#c1cbd0}</style>';
  document.body.innerHTML='<h1>Unit insignia · 104 types · panel / minimum map zoom</h1><main></main>';
  const fingerprints=new Map(),empty=[];
  for(const [type,spec]of Object.entries(UNITS)){
   const card=document.createElement('article');card.innerHTML=`<div class="symbols">${unitGlyph(type)}<canvas width="126" height="126"></canvas></div><span title="${spec.name}">${spec.name}</span>`;document.querySelector('main').append(card);
   const canvas=card.querySelector('canvas'),c=canvas.getContext('2d');c.scale(2,2);drawUnitBadge(c,type,31,31,'#6aaeba',{scale:.72});
   // Fingerprint only the glyph center; the common rim must not count as identity.
   const pixels=c.getImageData(42,42,40,40).data;let dark=0,signature='';for(let i=0;i<pixels.length;i+=4){const ink=pixels[i]>90&&pixels[i]>pixels[i+1]*1.06&&pixels[i+1]>pixels[i+2]*1.05;signature+=ink?'1':'0';if(ink)dark++;}
   if(dark<35)empty.push(type);const group=fingerprints.get(signature)||[];group.push(type);fingerprints.set(signature,group);
  }
  return {count:Object.keys(UNITS).length,empty,duplicates:[...fingerprints.values()].filter(a=>a.length>1)};
 });
 assert.deepEqual(glyphCheck.empty,[]);assert.deepEqual(glyphCheck.duplicates,[]);await gallery.screenshot({path:path.join(out,'unit-insignia-atlas.png'),fullPage:true});await gallery.close();
 pass('All insignia produce nonempty and distinct actual raster glyphs at the minimum map marker scale');
 assert.deepEqual(errors,[]);
 await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,errors,paidApi:false,productionWrites:false},null,2));
}catch(error){await shot('failure');await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,checks,errors},null,2));throw error;}
finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
