import auditBrowserRuntime from './browser-runtime.cjs';
// Real-host presentation/privacy checks with twelve civilizations; no production saves or paid model.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import * as E from '../src/engine.mjs';
import {TECHS,CIVICS} from '../src/rules.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
const out=path.resolve(process.env.UI_CHECK_OUTPUT||'output/rankings-art-20261022/acceptance');await mkdir(out,{recursive:true});
const checks=[],errors=[],badResources=[],pass=s=>{checks.push(s);console.log('PASS '+s);};
const g=E.createGame({players:12,size:'small',seed:'RANKINGS-ATLAS-ART',barbarians:false,playMode:'turns'});
g.settings.playMode='turns';g.settings.autosaveEnabled=false;
for(const p of g.players){assignController(p,p.id===0?'human':'inactive');p.techs=Object.keys(TECHS).slice(0,p.id*2);p.civics=Object.keys(CIVICS).slice(0,p.id);p.spaceStage=p.id%3;}
g.players[0].spaceStage=1;g.players[0].met=g.players.slice(1,10).map(p=>p.id);
const runtime=await MatchRuntime.create({players:12,size:'small',seats:g.players.map(p=>({seat:p.id,kind:p.id===0?'human':'inactive'})),execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});
const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});const host=await listen(runtime,{port:0});
const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResources.push({path:new URL(r.url()).pathname,status:r.status()});});
await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png')});};
try{
 await page.goto(host.url+'/?access='+token,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
 await page.waitForFunction(()=>{const r=window.__civ.renderer;return r.textureReady&&r.biomeReady&&r.modelsReady;},null,{timeout:90000});
 await page.evaluate(()=>{const r=window.__civ.renderer;r.dirty=true;r.render();r.menuOpen=true;});
 const hash=runtime.gameplayHash(),privacy=await page.evaluate(()=>({unknown:window.__civ.game.players.filter(p=>!p.victory).length,known:window.__civ.game.players.filter(p=>p.victory).length}));assert(privacy.known>=9);assert(privacy.unknown>0);
 for(const [width,height]of[[1600,1000],[1280,900],[390,844]]){
  await page.setViewportSize({width,height});await page.locator('#civ-rankings-btn').click();
  for(const tab of ['overview','science','culture','domination','religion','diplomacy','score']){
   await page.locator(`.cr-tabs [data-cr-tab="${tab}"]`).click();
   const geometry=await page.locator('#civ-rankings').evaluate(el=>{const r=el.getBoundingClientRect(),body=el.querySelector('.cr-body');return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:body.scrollWidth>body.clientWidth+1};});
   assert(geometry.left>=0&&geometry.right<=width+1&&geometry.top>=0&&geometry.bottom<=height+1);assert(!geometry.overflow,tab+' must not overflow');
   if(tab==='overview'){assert.equal(await page.locator('.cr-race').count(),6);assert.equal(await page.locator('.cr-cards').count(),0);assert((await page.locator('.cr-race[data-cr-tab="science"] .cr-race-value').innerText()).trim().startsWith('2'),'Overview metric must belong to the pictured known leader, not the selected civilization');}else{
    assert.equal(await page.locator('.cr-rank li:not(.cr-unknown)').count(),privacy.known);assert.equal(await page.locator('.cr-unknown').getAttribute('data-count'),String(privacy.unknown));
    assert.equal(await page.locator('.cr-rules[open]').count(),0);assert.equal(await page.locator('.cr-breakdown[open]').count(),0);assert.equal(await page.locator('.cr-migrated,.vp-detail').count(),0);
   }
   if(['overview','science','score'].includes(tab)){await shot(tab+'-'+width);if(width===1600)await page.locator('#civ-rankings').screenshot({path:path.join(out,tab+'-panel.png')});}
  }
  await page.keyboard.press('Escape');assert.equal(await page.locator('#civ-rankings.open').count(),0);
 }
 pass('Twelve-civilization rankings fit 1600/1280/390 across seven tabs, with a single ledger and collapsed rules');
 await page.setViewportSize({width:1600,height:1000});await page.locator('#civ-rankings-btn').click();await page.locator('.cr-t-score').click();
 await page.locator('.cr-breakdown summary').click();assert.equal(await page.locator('.cr-breakdown[open]').count(),1);
 await page.evaluate(()=>window.__civ.refresh(true));assert.equal(await page.locator('.cr-breakdown[open]').count(),1);
 await shot('score-expanded-1600');await page.locator('[data-cr-close]').click();
 await page.locator('[data-b-vic]').click();await page.locator('#civ-rankings.open').waitFor();assert.equal(await page.locator('.b-vpop').count(),0);await page.keyboard.press('Escape');
 await page.evaluate(()=>window.__civ.openModal('diplomacy'));await page.locator('[data-dip-tab="victories"]').click();await page.locator('#civ-rankings.open').waitFor();assert.equal(await page.locator('#modal[open]').count(),0);
 pass('HUD and diplomacy victory links use the same drawer; score details preserve their state across live polls');
 await page.locator('.cr-t-science').click();await page.waitForFunction(()=>!!document.querySelector('.cr-t-science')?.dataset.uiId);const ranks=await page.locator('.cr-value').allTextContents();assert(ranks[0].trim().startsWith('2'));assert.equal(await page.locator('.cr-stage-line>i').count(),privacy.known*3);
 await page.locator('.cr-t-science').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#civ-rankings').getAttribute('data-tab'),'culture');
 await page.keyboard.press('Escape');assert.equal(runtime.gameplayHash(),hash);assert.deepEqual(errors,[]);assert.deepEqual(badResources,[]);
 pass('Authoritative progress ordering, stage markers, keyboard tabs and unknown aggregates remain private and read-only');
 await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,privacy,errors,badResources,gameplayUnchanged:true,paidApi:false},null,2));
}catch(error){await shot('failure');await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,checks,errors,badResources},null,2));throw error;}
finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
