import auditBrowserRuntime from './browser-runtime.cjs';
// Fixed disposable worlds, real browser pointers and renderer measurements.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {field} from './imperial-fixture.mjs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';

const out=path.resolve('output/playwright/yields-lighting-20261021'),checks=[],metrics={},errors=[];
await mkdir(out,{recursive:true});
const baseline=process.argv.includes('--baseline'),require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const {g,p,q,tile}=field();g.settings.autosaveEnabled=false;p.short='朝鲜';q.short='罗马';p.techs=['apprenticeship'];p.civics=[];q.techs=[];q.civics=[];
for(const player of g.players)assignController(player,player.id<2?'agent':'inactive',{displayName:player.id?'Model B':'Model A'});
for(let row=5;row<18;row++)for(let col=6;col<25;col++){
  const t=tile(col,row);t.terrain=col<12?'plains':'grass';t.feature=(row%4<2&&col>10)?'forest':null;t.hill=col%5===0;
  if(col>20&&row<10){t.terrain='mountain';t.feature=null;}
}
const neutral=tile(14,11),foreign=tile(16,11);for(const t of [neutral,foreign]){t.terrain='grass';t.hill=false;t.feature=null;t.improvement='mine';}foreign.owner=q.id;neutral.owner=null;
E.addUnit(g,p.id,'scout',tile(14,12).id);E.refreshVisibility(g);
const runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'agent',displayName:'Model A'},{seat:1,kind:'agent',displayName:'Model B'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});runtime.setManagedPlay(0,null);runtime.managedPlay.get(0).client={provider:'api',model:'Model A',state:'running',error:null};
const host=await listen(runtime,{port:0}),beforeHash=runtime.gameplayHash();
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const pass=name=>{checks.push(name);console.log('PASS '+name);};
try{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await ctx.addInitScript(token=>{sessionStorage.setItem('hex-civ-host',token);localStorage.setItem('hex.audio.music','0');},runtime.hostToken);
  if(baseline)for(const file of ['app.js','map.js','map3d.js','lazy-map.js','model-observer.js','ui-b/classic.css','terrain-art.js'])await ctx.route('**/'+file,async route=>route.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:await readFile(path.join(out,'before/web',file))}));
  await ctx.route('**/api/lobby/agent/trace',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({run:'ui-sample',source:'api',next:2,entries:[{id:1,type:'dialogue',turn:14,text:'先完成首都的生产，再派侦察兵探索东侧河谷。边境部队保持防守。'},{id:2,type:'reasoning',turn:14,text:'河谷有淡水与平原，适合继续侦察；先确认道路和周围资源，再决定下一座城市的位置。'}]})}));
  const page=await ctx.newPage();page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'&&/Shader Error|VALIDATE_STATUS|shader.*error/i.test(message.text()))errors.push(message.text());});
  await page.goto(host.url+'/?access='+runtime.observerToken,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0&&window.__civ.renderer.modelsReady&&window.__civ.renderer.biomeReady&&window.__civ.renderer.textureReady,null,{timeout:120000});
  await page.evaluate(id=>{const r=window.__civ.renderer;r.focus(id,1.65);},tile(16,10).id);await page.waitForFunction(()=>!window.__civ.renderer.targetCam);
  await page.evaluate(()=>{const r=window.__civ.renderer;r.dirty=true;r.render();});await page.screenshot({path:path.join(out,baseline?'lighting-before.png':'lighting-after.png')});
  metrics.renderer=await page.evaluate(()=>{const r=window.__civ.renderer;return {diagnostics:r.diagnostics,sceneCalls:r.worldRenderStats?.calls,triangles:r.worldRenderStats?.triangles};});
  if(!baseline){
    const inspected=async id=>{await page.evaluate(id=>window.__civ.selectTile(window.__civ.game.map.tiles[id]),id);return page.locator('#inspector').innerText();};
    const neutralText=await inspected(neutral.id),foreignText=await inspected(foreign.id);
    assert.match(neutralText,/地块产出 · 基础产出/);assert(!neutralText.includes('地块产出 · 朝鲜'));assert(foreignText.includes('地块产出 · '+runtime.game.players[q.id].short));
    const values=await page.evaluate(({neutral,foreign})=>{const r=window.__civ.renderer,c=window.__civ;return {neutral:r.tileYields(c.game.map.tiles[neutral]),foreign:r.tileYields(c.game.map.tiles[foreign])};},{neutral:neutral.id,foreign:foreign.id});
    assert.deepEqual(values.neutral,R.tileYield(neutral));assert.deepEqual(values.foreign,R.tileYield(foreign,q));
    const owner=runtime.game.players[q.id],priorTechs=[...owner.techs];owner.techs.push('apprenticeship');
    await page.evaluate(()=>window.__civ.refresh());
    assert.equal(Number(await page.locator('#inspector .yield-grid [title="生产力"] b').innerText()),values.foreign.production+1);
    owner.techs=priorTechs;await page.evaluate(()=>window.__civ.refresh());
    pass('Observer neutral tiles show base yields and owned tiles use their owner, instead of inheriting the selected Korean civilization');
    await page.locator('#model-observer-toggle').click();await page.waitForFunction(()=>document.getElementById('model-observer-entries')?.textContent.includes('先完成首都'));
    assert.equal(await page.locator('#model-observer-panel').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(40, 44, 45, 0.82)');
    assert.equal(await page.locator('#model-observer-panel button:visible').count(),1);
    await page.locator('#model-observer-mode').selectOption('reasoning');assert.match(await page.locator('#model-observer-entries').innerText(),/河谷有淡水/);
    await page.screenshot({path:path.join(out,'observer-gray.png')});
    await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-config="0"]').waitFor();await page.locator('#model-observer-menu>summary').click();
    await page.setViewportSize({width:390,height:844});const bounds=await page.locator('#model-observer-panel').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=391);await page.screenshot({path:path.join(out,'observer-gray-390.png')});
    await page.locator('#model-observer-close').click();assert(await page.locator('#model-observer-panel').isHidden());await page.setViewportSize({width:1440,height:1000});
    pass('Translucent gray observation uses two selectors and a closed management menu, preserves mode switching and fits 390px');
    const lighting=await page.evaluate(async()=>{
      const r=window.__civ.renderer,bakes=r.lightingBakeCount,id=r.lightingBake.texture.uuid;const {bakeWorldLighting}=await import('/world-lighting.js');
      for(const zoom of [1.1,.55,1.65]){r.zoom=zoom;r.cam.x+=25;r.dirty=true;r.render();}
      r.buildStructures();r.dirty=true;r.render();
      const same=r.lightingBakeCount===bakes&&r.lightingBake.texture.uuid===id;
      const data=r.lightingBake.texture.image.data;let occupied=0;for(let i=0;i<data.length;i+=4)if(data[i]||data[i+1])occupied++;
      const fake={...r,game:structuredClone(r.game),position:r.position.bind(r),heightAt:r.heightAt.bind(r),structureCities:r.structureCities,lightingCasters:r.lightingCasters};
      const unknown=fake.game.map.tiles.find(tile=>tile.hidden);if(unknown){unknown.resource='uranium';unknown.feature='forest';unknown.terrain='mountain';}
      const b=bakeWorldLighting(fake),fogSafe=b.texture.image.data.every((value,index)=>value===data[index]);b.dispose();
      return {same,occupied,fogSafe,baked:r.lightingBake.stats,bakes,shaderBound:!!r.groundMaterial.userData.bakedLighting};
    });
    assert(lighting.same&&lighting.occupied>100&&lighting.shaderBound&&lighting.fogSafe);assert(lighting.baked.bytes<=2048*2048*4);metrics.lighting=lighting;
    pass('Ground lighting is baked once per static revision, reused across pan/zoom, bounded in memory and ignores hidden resource/terrain data');
    const player=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'}),view=await player.newPage();
    await view.goto(host.url+'/?access='+runtime.seatTokens.get(0),{waitUntil:'domcontentloaded'});await view.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
    await view.evaluate(id=>window.__civ.selectTile(window.__civ.game.map.tiles[id]),foreign.id);assert.match(await view.locator('#inspector').innerText(),/地块产出 · 朝鲜/);
    const own=await view.evaluate(id=>window.__civ.renderer.tileYields(window.__civ.game.map.tiles[id]),foreign.id);assert.deepEqual(own,R.tileYield(foreign,p));assert(own.production>values.foreign.production);
    metrics.fog=await view.evaluate(async()=>{
      const r=window.__civ.renderer,{bakeWorldLighting}=await import('/world-lighting.js'),copy=structuredClone(r.game),hidden=copy.map.tiles.filter(tile=>tile.hidden);
      for(const tile of hidden){tile.feature='forest';tile.terrain='mountain';tile.resource='uranium';tile.improvement='mine';}
      const a=r.lightingBake.texture.image.data,b=bakeWorldLighting({...r,game:copy,position:r.position.bind(r),heightAt:r.heightAt.bind(r)}),same=b.texture.image.data.every((value,index)=>value===a[index]);b.dispose();return {hidden:hidden.length,same};
    });assert(metrics.fog.hidden>0&&metrics.fog.same);await player.close();
    pass('A seated player still sees their own known technology bonuses, and labels and numerical yields agree');
  }
  assert.deepEqual(errors,[]);assert.equal(runtime.gameplayHash(),beforeHash);pass('Browser has no shader/script errors and inspection leaves authoritative gameplay unchanged');
  await ctx.close();await writeFile(path.join(out,baseline?'baseline-metrics.json':'checks.json'),JSON.stringify({passed:true,checks,metrics,errors,productionWrites:false},null,2));
}finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
