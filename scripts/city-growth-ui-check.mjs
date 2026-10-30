// Real player-page hover, cached pan hit regions and responsive population banners.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as E from '../src/engine.mjs';
import {DIRECTIONS} from '../src/rules.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {field} from './imperial-fixture.mjs';
import runtimeBrowser from './browser-runtime.cjs';

const out=new URL('../output/river-growth-20261025/',import.meta.url);await mkdir(out,{recursive:true});
const {g,p,tile}=field(),home=E.foundCity(g,p,E.addUnit(g,p.id,'settler',tile(12,10).id)),starving=E.foundCity(g,p,E.addUnit(g,p.id,'settler',tile(20,10).id));
const from=tile(14,12),to=tile(15,12),direction=DIRECTIONS.findIndex(([q,r])=>from.q+q===to.q&&from.r+r===to.r),warrior=E.addUnit(g,p.id,'warrior',from.id);
Object.assign(from,{river:true,riverEdges:[direction]});Object.assign(to,{river:true,riverEdges:[(direction+3)%6],feature:'forest',hill:true});
home.food=4;starving.population=30;starving.food=1;g.settings.autosaveEnabled=false;g.settings.playMode='turns';
for(const player of g.players)assignController(player,player.id===p.id?'human':'inactive');
E.refreshVisibility(g);p.visible=p.explored=g.map.tiles.map(t=>t.id);
const match=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},...[1,2].map(seat=>({seat,kind:'inactive'}))],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await match.hostLoad(match.hostToken,E.serialize(g),{record:false});const {token}=await match.reassign(match.hostToken,0,{kind:'human'},{record:false});const host=await listen(match,{port:0});
const browser=await runtimeBrowser.load('playwright').chromium.launch({headless:true,executablePath:runtimeBrowser.chromiumExecutable(),args:['--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
await page.addInitScript(()=>{if(location.protocol==='http:')localStorage.setItem('hex.audio.music','0');});
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const banner=async id=>page.evaluate(id=>{const r=window.__civ.renderer,c=window.__civ.game.cities.find(c=>c.id===id);r.menuOpen=false;r.targetCam=null;r.cam={...r.position(r.game.map.tiles[c.tile])};r.zoom=1.4;r.dirty=true;r.render();r.menuOpen=true;return r.labelBlocks.find(b=>b.city===id&&b.growth);},id);
try{
 await page.goto(host.url+'/?access='+token);await page.waitForFunction(()=>window.__civ?.renderer?.modelsReady&&window.__civ.renderer.textureReady&&!window.__civ.renderer.targetCam&&!window.__civ.menuShown,null,{timeout:120000});
 for(const [id,sign]of [[home.id,'+'],[starving.id,'−']]){
  const hit=await banner(id);assert(hit);assert(hit.growth.label.startsWith(sign));assert.equal(await page.evaluate(h=>document.elementFromPoint(h.x+17,h.y+41)?.id,hit),'map');await page.mouse.move(hit.x+17,hit.y+41);
  await page.waitForFunction(text=>!document.getElementById('hover').hidden&&document.getElementById('hover').textContent.includes(text),hit.growth.text);
  await page.screenshot({path:fileURLToPath(new URL(sign==='+'?'growth-1600.png':'starvation-1600.png',out))});
 }
 pass('Actual city banners show signed growth and starvation ETAs; pointer hover displays the exact population change');
 let hit=await banner(home.id);
 hit=await page.evaluate(id=>{const r=window.__civ.renderer;r.cam.x+=8/r.zoom;r.markCameraDirty();r.menuOpen=false;r.render();r.menuOpen=true;const hit=r.labelBlocks.find(b=>b.city===id&&b.growth);return {...hit,correct:r.hitCityLabel(hit.x+17,hit.y+41,'growth')?.id===hit.tile};},home.id);
 assert(hit.correct);await page.mouse.move(hit.x+17,hit.y+41);await page.waitForFunction(()=>!document.getElementById('hover').hidden&&document.getElementById('hover').textContent.includes('人口 +1'));
 pass('Short cached pans shift population hover targets along with their painted banner');
 for(const width of [1280,390]){await page.setViewportSize({width,height:width===390?844:900});if(width===390){const tracker=page.locator('[data-b4-tracker][aria-expanded="true"]');if(await tracker.count())await tracker.click();}const hit=await banner(home.id);assert(hit.x>=0&&hit.x+hit.width<=width);await page.mouse.move(hit.x+17,hit.y+41);if(width>=760){await page.waitForFunction(()=>!document.getElementById('hover').hidden&&document.getElementById('hover').textContent.includes('人口 +1'));assert(await page.locator('#hover').isVisible());}await page.screenshot({path:fileURLToPath(new URL('growth-'+width+'.png',out))});}
 pass('Population badges fit 1280px and 390px widths; desktop hover is visible (mobile keeps the existing tooltip-hiding policy)');
 const helpers=await page.evaluate(async()=>{const {cityBannerGrowth}=await import('/city-label.js');return {private:cityBannerGrowth({food:null}),stable:cityBannerGrowth({growthStatus:{rate:0}}),minimum:cityBannerGrowth({growthStatus:{rate:-2,starvationTurns:null}})};});
 assert.equal(helpers.private,null);assert.equal(helpers.stable.label,'—');assert.equal(helpers.minimum.change,0);
 await page.setViewportSize({width:1600,height:1000});
 const badge=await page.evaluate(id=>{const r=window.__civ.renderer,u=r.game.units.find(u=>u.id===id);r.menuOpen=false;r.focus(u.tile,1.4);r.dirty=true;r.render();return r.unitHits.find(h=>h.kind==='badge'&&h.unit.id===id);},warrior.id);assert(badge);
 await page.mouse.click(badge.x+badge.width/2,badge.y+badge.height/2,{button:'right'});
 await page.waitForFunction(id=>window.__civ.renderer.orders.some(a=>a.type==='move'&&a.tile===id),to.id);
 const destination=await page.evaluate(id=>window.__civ.renderer.screen(window.__civ.game.map.tiles[id]),to.id);await page.mouse.click(destination.x,destination.y,{button:'right'});
 await page.waitForFunction(({unit,tile})=>window.__civ.game.units.find(u=>u.id===unit)?.tile===tile,{unit:warrior.id,tile:to.id});
 assert.equal(match.game.units.find(u=>u.id===warrior.id).tile,to.id);assert.equal(match.game.units.find(u=>u.id===warrior.id).moves,0);
 pass('Selecting the warrior and right-clicking the opposite rough riverbank executes a direct crossing through the real page and host');
 assert.deepEqual(errors,[]);await writeFile(new URL('ui.json',out),JSON.stringify({passed:true,checks,errors,activeSaveWritten:false},null,2));
}catch(error){await writeFile(new URL('failure.json',out),JSON.stringify(await page.evaluate(()=>({hover:{hidden:document.getElementById('hover').hidden,text:document.getElementById('hover').textContent},banners:window.__civ.renderer.labelBlocks})),null,2));await page.screenshot({path:fileURLToPath(new URL('failure.png',out))});throw error;}finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
