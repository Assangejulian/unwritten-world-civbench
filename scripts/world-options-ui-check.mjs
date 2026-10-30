// Exercise the real setup flow and GPU resource refresh in isolated HTTP hosts.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as E from '../src/engine.mjs';
import {RESOURCES} from '../src/rules.mjs';
import {field} from './imperial-fixture.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import browserRuntime from './browser-runtime.cjs';
const out=path.resolve('output/world-options-20261030/ui');await fs.mkdir(out,{recursive:true});
const checks=[],errors=[],httpErrors=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const lobby=new Lobby({stub:true}),setupHost=await listen(null,{port:0,lobby});lobby.url=setupHost.url;lobby.server=setupHost.server;
const browser=await browserRuntime.load('playwright').chromium.launch({headless:true,executablePath:browserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push({path:new URL(r.url()).pathname,status:r.status()});});
await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
let mapHost,runtime;
const shot=async name=>page.screenshot({path:path.join(out,name+'.jpg'),type:'jpeg',quality:78,animations:'disabled'});
try{
  await page.goto(setupHost.url+'/#setup='+lobby.hostCapability,{waitUntil:'domcontentloaded'});await page.locator('#menu-new').click();
  assert.equal(await page.locator('#setup-rainfall').inputValue(),'standard');assert.equal(await page.locator('#setup-resources').inputValue(),'standard');assert(await page.locator('#setup-barbarians').isChecked());
  await page.locator('#setup-size').selectOption('small');await page.locator('#setup-count').selectOption('3');await page.locator('#setup-rainfall').selectOption('dry');await page.locator('#setup-resources').selectOption('sparse');await page.locator('#setup-barbarians').uncheck();await page.locator('#setup-autosave').uncheck();
  for(const [width,height]of [[1440,900],[390,844]]){
    await page.setViewportSize({width,height});
    for(const id of ['setup-rainfall','setup-resources','setup-barbarians']){const el=page.locator('#'+id);await el.scrollIntoViewIfNeeded();const box=await el.boundingBox();assert(box.width>0&&box.x>=0&&box.x+box.width<=width+1);}
    await page.locator('#setup-rainfall').scrollIntoViewIfNeeded();await shot('setup-'+width);
  }
  pass('Rainfall/resource/barbarian controls default correctly, accept selections and fit 1440px/390px layouts');
  await page.setViewportSize({width:1440,height:900});await page.locator('#create-world').click();
  await page.waitForFunction(()=>window.__civ?.game?.settings?.rainfall==='dry',null,{timeout:120000});
  assert(lobby.runtime?.started);assert.equal(lobby.runtime.game.settings.resourceAbundance,'sparse');assert.equal(lobby.runtime.game.settings.barbarians,false);assert.equal(lobby.runtime.game.players.length,3);
  pass('The actual Start button creates an isolated host game with all selected world options');
  const {g,p,q,tile}=field(),strategic=Object.entries(RESOURCES).filter(([,s])=>s.tech);
  for(const [i,[key]]of strategic.entries())Object.assign(tile(4+i,4),{resource:key});
  for(const player of g.players)assignController(player,player.id===0?'human':'inactive');E.refreshVisibility(g);
  runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
  await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});mapHost=await listen(runtime,{port:0});
  await page.goto(mapHost.url+'/?access='+runtime.observerToken,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__civ?.renderer?.resourceReady&&window.__civ.renderer.renderedFrames>0,null,{timeout:120000});
  const counts=()=>page.evaluate(()=>({...window.__civ.renderer.resourceFrameCounts}));
  for(const [key]of strategic)assert.equal((await counts())[key],0);
  q.techs=strategic.map(([,s])=>s.tech);
  const revealed=JSON.parse(JSON.stringify(E.snapshot(g,-1))),own=JSON.parse(JSON.stringify(E.snapshot(g,p.id)));
  await page.evaluate(game=>{const r=window.__civ.renderer;r.menuOpen=true;r.setState(game);r.dirty=true;r.render();},revealed);
  for(const [key]of strategic)assert.equal((await counts())[key],1);
  await page.evaluate(game=>window.__civ.renderer.setState(game),own);for(const [key]of strategic)assert.equal((await counts())[key],0);
  p.techs=[...q.techs];E.refreshVisibility(g);
  await page.evaluate(game=>window.__civ.renderer.setState(game),JSON.parse(JSON.stringify(E.snapshot(g,p.id))));
  assert.equal((await counts()).horses,1);assert.equal((await counts()).iron,1);
  pass('Real GPU resource sprites refresh on research and disappear when switching to a civilization without the technology');
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);pass('No browser exceptions or HTTP failures');
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,errors,httpErrors,productionSaveWrites:false,paidModelCalls:0},null,2));
}catch(error){await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,checks,errors,httpErrors},null,2));await shot('failure').catch(()=>{});throw error;}
finally{await browser.close();lobby.runtime?.simulation?.dispose?.();lobby.dispose();runtime?.simulation?.dispose?.();for(const host of [setupHost,mapHost].filter(Boolean)){host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}}
