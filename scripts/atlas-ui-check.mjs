import auditBrowserRuntime from './browser-runtime.cjs';
// Real generated terrain, isolated HTTP host and actual production/command actions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import * as E from '../src/engine.mjs';
import {neighbors} from '../src/world.mjs';
const submitted=[];
const out='output/atlas-controls-20261022/atlas';await mkdir(out,{recursive:true});const checks=[],errors=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
const g=E.createGame({players:4,size:'small',seed:'ATLAS-PARCHMENT-3',playMode:'turns',barbarians:false}),p=g.players[0];
const settler=g.units.find(u=>u.owner===0&&u.type==='settler');E.applyAction(g,p,{type:'found',unit:settler.id});g.settings.autosaveEnabled=false;
for(const player of g.players)assignController(player,player.id===0?'human':'inactive');
E.refreshVisibility(g);
const runtime=await MatchRuntime.create({players:4,size:'small',seats:[{seat:0,kind:'human'},...[1,2,3].map(seat=>({seat,kind:'inactive'}))],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});const host=await listen(runtime,{port:0});
const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/action')submitted.push(r.postDataJSON().action);});
await context.addInitScript(()=>{if(location.protocol==='http:')localStorage.setItem('hex.audio.music','0');});
const render=()=>page.evaluate(()=>{const r=window.__civ.renderer;r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;});
const shot=async name=>{await render();await page.mouse.move(1580,22);await page.screenshot({path:out+'/'+name+'.png'});};
try{
 await page.goto(host.url+'/?access='+token);await page.waitForFunction(()=>window.__civ?.renderer?.modelsReady&&window.__civ.renderer.textureReady&&window.__civ.renderer.biomeReady,null,{timeout:120000});
 await page.evaluate(()=>{const r=window.__civ.renderer;r.menuOpen=true;r.fit();});await render();
 const before=await page.evaluate(async()=>{const {cityBannerProduction}=await import('/city-label.js');return cityBannerProduction(window.__civ.game.cities.find(c=>c.owner===0));});assert.equal(before.item,null);assert.equal(before.turns,null);
 await page.evaluate(()=>window.__hexUi.act({type:'produce',city:window.__civ.game.cities.find(c=>c.owner===0).id,item:'scout'}));
 await page.waitForFunction(()=>window.__civ.game.cities.find(c=>c.owner===0).production?.item==='scout');await render();
 const work=await page.evaluate(async()=>{const {cityBannerProduction}=await import('/city-label.js'),c=window.__civ.game.cities.find(c=>c.owner===0);return {work:cityBannerProduction(c),turns:c.productionStatus.turns,banner:window.__civ.renderer.labelBlocks.find(h=>h.city===c.id),enemy:cityBannerProduction({production:null,owner:1})};});
 assert.equal(work.work.item,'scout');assert.equal(work.work.turns,work.turns);assert.equal(work.banner.production,'scout');assert.equal(work.banner.productionTurns,work.turns);assert.equal(work.enemy,null);
 pass('An actual production command replaces the idle gear with its unit icon and exact authoritative ETA; enemy queues stay private');
 const warrior=await page.evaluate(()=>window.__civ.game.units.find(u=>u.owner===0&&u.type==='warrior')?.id??window.__civ.game.units.find(u=>u.owner===0).id);
 await page.evaluate(id=>{const r=window.__civ.renderer;r.selected=null;r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;},warrior);
 const hit=await page.evaluate(id=>window.__civ.renderer.unitHits.find(h=>h.kind==='badge'&&h.unit.id===id),warrior);assert(hit);await page.mouse.click(hit.x+hit.width/2,hit.y+hit.height/2,{button:'right'});await page.waitForSelector('.cud-fortify');
 await page.keyboard.press('Escape');await shot('world-1600');
 const fog=await page.evaluate(()=>{const r=window.__civ.renderer,builds=r.chartFog.builds;r.dirty=false;r.unitFrame=true;r.menuOpen=false;let start=performance.now();for(let i=0;i<6;i++){r.unitFrame=true;r.render();}const elapsed=performance.now()-start;r.menuOpen=true;return {edge:r.chartFog.edgePixels,builds,after:r.chartFog.builds,overlayFramesMs:elapsed/6};});assert(fog.edge>100);assert.equal(fog.builds,fog.after);await writeFile(out+'/fog-metrics.json',JSON.stringify(fog,null,2));
 pass('Generated mountains, shores and resources keep a feathered fog boundary; idle render frames reuse the cached veil');
 for(const width of [1280,390]){await page.setViewportSize({width,height:width===390?844:900});await page.evaluate(()=>window.__civ.renderer.fit());await render();await shot('world-'+width);
 const a=await page.locator('#civ-unit-dock').boundingBox(),b=await page.locator('.pt-dock').boundingBox();assert(a.x>=0&&a.x+a.width<b.x);const main=await page.locator('.pt-main').evaluate(el=>({radius:getComputedStyle(el).borderTopLeftRadius,width:el.offsetWidth,height:el.offsetHeight}));assert.equal(main.radius,'50%');assert.equal(main.width,main.height);
 const age=await page.locator('#b4-age-dock').evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),children:[...el.querySelectorAll('button')].map(b=>b.getBoundingClientRect().toJSON())}));for(const b of age.children)assert(b.bottom<=844||width!==390,'Age controls must remain on screen');
 }
 pass('The command instrument stays compact at 1600/1280/390px with a circular task button and visible age controls');
 // A second isolated admission proves contextual hiding does not remove real combat.
 await page.goto('about:blank');const combat=E.restore(E.serialize(runtime.game)),actor=combat.units.find(u=>u.id===warrior);
 Object.assign(actor,{acted:false,moves:2});const ground=neighbors(combat.map,combat.map.tiles[actor.tile]).find(t=>!['ocean','coast','mountain'].includes(t.terrain)&&!t.cityId&&!combat.units.some(u=>u.tile===t.id));assert(ground);
 const enemy=E.addUnit(combat,1,'warrior',ground.id);combat.players[0].relations[1].status='war';combat.players[1].relations[0].status='war';combat.players[0].met=[1];E.refreshVisibility(combat);
 await runtime.hostLoad(runtime.hostToken,E.serialize(combat),{record:false});const combatSeat=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});await page.setViewportSize({width:1440,height:1000});await page.goto(host.url+'/?access='+combatSeat.token);
 await page.waitForFunction(()=>window.__civ?.renderer?.modelsReady,null,{timeout:120000});await page.evaluate(id=>{const r=window.__civ.renderer;r.focus(window.__civ.game.units.find(u=>u.id===id).tile,1.3);},actor.id);
 await page.waitForFunction(()=>!window.__civ.renderer.targetCam);await render();
 const actorHit=await page.evaluate(id=>window.__civ.renderer.unitHits.find(h=>h.kind==='badge'&&h.unit.id===id),actor.id);assert(actorHit);await page.mouse.click(actorHit.x+actorHit.width/2,actorHit.y+actorHit.height/2,{button:'right'});
 await page.locator('#civ-unit-dock .cud-attack').waitFor();await page.locator('#civ-unit-dock .cud-attack').click();
 // Move mode already contains attacks; wait for the asynchronous attack-only mode.
 await page.waitForFunction(id=>{const a=window.__civ.renderer.orders;return a.some(x=>x.targetUnit===id)&&a.every(x=>['attack','attackCityState'].includes(x.type));},enemy.id);await render();const target=await page.evaluate(id=>window.__civ.renderer.screen(window.__civ.game.map.tiles[id]),ground.id);await page.mouse.click(target.x,target.y,{button:'right'});
 await page.waitForFunction(id=>{const enemy=window.__civ.game.units.find(u=>u.id===id);return !enemy||enemy.hp<100;},enemy.id);assert((runtime.game.units.find(u=>u.id===enemy.id)?.hp??0)<100);
 const attack=submitted.find(a=>a.type==='attack'&&a.targetUnit===enemy.id);assert(attack);assert(!Object.hasOwn(attack,'tile')&&!Object.hasOwn(attack,'command')&&!Object.hasOwn(attack,'hint'));
 pass('A visible hostile target restores the attack button; its actual target selection resolves real combat');
 assert.deepEqual(errors,[]);await writeFile(out+'/checks.json',JSON.stringify({passed:true,checks,errors},null,2));
}catch(e){await page.screenshot({path:out+'/failure.png'});throw e;}finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
