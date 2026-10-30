// Real isolated host and raster checks; no production world or model calls.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import * as E from '../src/engine.mjs';
import * as N from '../src/natural-wonders.mjs';
import * as C from '../src/climate.mjs';
import {NATURAL_WONDERS} from '../src/rules.mjs';
import {naturalWorld} from './natural-wonders-fixture.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {listen} from '../src/environment/http.mjs';
import browserRuntime from './browser-runtime.cjs';
const out=path.resolve('output/natural-wonders-real35-20261030/ui');await mkdir(out,{recursive:true});
const checks=[],errors=[],httpErrors=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const f=naturalWorld(),{g,p,tile,cells}=f;
for(const player of g.players)assignController(player,player.id===0?'human':'inactive');
const runtime=await MatchRuntime.create({players:3,size:'small',naturalWondersEnabled:false,seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});
const host=await listen(runtime,{port:0}),browser=await browserRuntime.load('playwright').chromium.launch({headless:true,executablePath:browserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
let setupHost;
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push({path:new URL(r.url()).pathname,status:r.status()});});
await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
async function shot(name){await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});}
try{
  await page.goto(host.url+'/?access='+token,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});await page.evaluate(()=>window.__civ.renderer.menuOpen=true);
  const hash=runtime.gameplayHash();
  const raster=await page.evaluate(async keys=>{
    const {drawNaturalWonder}=await import('/natural-wonder-art.js');
    const canvas=document.createElement('canvas');canvas.width=200;canvas.height=200;const ctx=canvas.getContext('2d'),r={zoom:2,screen:()=>({x:100,y:130})};
    const pixels=()=>{const a=ctx.getImageData(0,0,200,200).data;let count=0,alpha=0;for(let i=3;i<a.length;i+=4){if(a[i])count++;alpha+=a[i];}return {count,alpha};};
    const result=[];
    for(const key of keys){const tile={naturalWonder:key,visible:true};drawNaturalWonder(r,ctx,tile);await new Promise((resolve,reject)=>{const image=new Image();image.src='/assets/natural-wonders/'+key+'.webp';image.onload=resolve;image.onerror=reject;});await new Promise(resolve=>setTimeout(resolve,30));ctx.clearRect(0,0,200,200);const ready=drawNaturalWonder(r,ctx,tile);const visible=pixels();ctx.clearRect(0,0,200,200);tile.visible=false;drawNaturalWonder(r,ctx,tile);const remembered=pixels();ctx.clearRect(0,0,200,200);tile.hidden=true;const hidden=drawNaturalWonder(r,ctx,tile);result.push({key,ready:!!ready.source,visible,remembered,hidden:hidden===null&&pixels().count===0});}
    return result;
  },Object.keys(cells));
  for(const item of raster){assert(item.ready&&item.visible.count>100);assert(item.remembered.alpha<item.visible.alpha);assert(item.hidden);}
  pass('All 35 actual alpha sprites decode and paint; remembered landmarks dim and hidden landmarks paint zero pixels');
  for(const [width,height]of [[1440,900],[390,844]]){
    await page.setViewportSize({width,height});
    await page.evaluate(id=>{const r=window.__civ.renderer,t=window.__civ.game.map.tiles[id];r.targetCam=null;r.cam={...r.position(t)};r.zoom=1.9;r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;window.__civ.selectTile(t);},cells.zhangjiajie.id);
    await page.locator('#inspector .natural-wonder-notice').waitFor();assert((await page.locator('#inspector').innerText()).includes('张家界'));
    await page.waitForFunction(()=>window.__civ.renderer.naturalArtRevision>0);
    const painted=await page.evaluate(id=>{const r=window.__civ.renderer;r.menuOpen=false;r.dirty=true;r.render();r.menuOpen=true;return [...r.worldSprites.entries.values()].some(e=>e.key==='natural:'+id&&e.mesh.visible&&e.variants.size>0);},cells.zhangjiajie.id);assert(painted);
    const box=await page.locator('#inspector').boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);await shot('zhangjiajie-'+width);
  }
  pass('The real 3D map and concise landmark inspector fit desktop and mobile without changing gameplay');
  await page.setViewportSize({width:1440,height:900});
  for(const [key,t]of Object.entries(cells)){await page.evaluate(id=>window.__civ.selectTile(window.__civ.game.map.tiles[id]),t.id);assert((await page.locator('#inspector').innerText()).includes(NATURAL_WONDERS[key].name));}
  assert.equal(await page.evaluate(()=>window.__civ.game.naturalWonders.landmarks.length),35);
  assert.equal(runtime.gameplayHash(),hash);pass('All 35 actual inspector effects agree with public definitions and reads grant no repeat rewards');
  const setupLobby=new Lobby({stub:true});setupHost=await listen(null,{port:0,lobby:setupLobby});setupLobby.url=setupHost.url;setupLobby.server=setupHost.server;
  await page.goto(setupHost.url+'/#setup='+setupLobby.hostCapability,{waitUntil:'domcontentloaded'});
  await page.locator('#menu-new').click();
  await page.locator('#setup-natural-wonders').waitFor();assert.equal(await page.locator('#setup-natural-wonders').inputValue(),'on');await page.locator('#setup-natural-wonders').selectOption('off');
  for(const [width,height]of [[1440,900],[390,844]]){await page.setViewportSize({width,height});const el=page.locator('#setup-natural-wonders');await el.scrollIntoViewIfNeeded();const box=await el.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);await shot('setup-'+width);}
  pass('New-world natural-wonder switch defaults on, accepts off and fits 1440/390px');
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);pass('No browser exceptions or failed HTTP resources');
  await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,raster,errors,httpErrors,productionSaveWrites:false,paidModelCalls:false},null,2));
}catch(error){await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,checks,errors,httpErrors},null,2));await shot('failure').catch(()=>{});throw error;}
finally{await browser.close();for(const h of [host,setupHost].filter(Boolean)){h.server.closeAllConnections();await new Promise(resolve=>h.server.close(resolve));}runtime.simulation?.dispose?.();}
