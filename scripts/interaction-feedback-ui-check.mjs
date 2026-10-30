// Exercise real command receipts, modal feedback, input buttons and Web Audio in isolation.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as E from '../src/engine.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import {field} from './imperial-fixture.mjs';
import runtimeBrowser from './browser-runtime.cjs';

const out=new URL('../output/interaction-feedback-20261026/',import.meta.url);await mkdir(out,{recursive:true});
const {g,p,q,z,tile}=field(),home=E.foundCity(g,p,E.addUnit(g,p.id,'settler',tile(12,10).id)),unit=E.addUnit(g,p.id,'warrior',tile(14,12).id),target=tile(15,12);
p.civics=[];g.settings.playMode='turns';g.settings.autosaveEnabled=false;
for(const player of g.players)assignController(player,player===p?'human':'native');
for(const [player,opinion]of [[q,80],[z,-80]])player.attitudes={...(player.attitudes||{}),[p.id]:{...(player.attitudes?.[p.id]||{}),opinion,mods:[]}};
E.refreshVisibility(g);p.visible=p.explored=g.map.tiles.map(t=>t.id);
const match=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'native'},{seat:2,kind:'native'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await match.hostLoad(match.hostToken,E.serialize(g),{record:false});const {token}=await match.reassign(match.hostToken,0,{kind:'human'},{record:false});const host=await listen(match,{port:0});
const browser=await runtimeBrowser.load('playwright').chromium.launch({headless:true,executablePath:runtimeBrowser.chromiumExecutable(),args:['--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'}),errors=[],checks=[],requests=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('hex-civilizations-audio',JSON.stringify({music:0,effects:.4,muted:false,mood:'auto'})));
await page.route('**/api/action',async route=>{requests.push(route.request().postDataJSON().action);await new Promise(resolve=>setTimeout(resolve,240));await route.continue();});
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const shot=async name=>page.screenshot({path:fileURLToPath(new URL(name+'.png',out))});
try{
 await page.goto(host.url+'/?access='+token);await page.waitForFunction(()=>window.__civ?.renderer?.modelsReady&&!window.__civ.renderer.targetCam&&!window.__civ.menuShown,null,{timeout:120000});
 assert.equal(await page.evaluate(()=>window.__civ.game.players[0].research),null);assert.equal(await page.evaluate(()=>window.__civ.game.players[0].civic),'code');
 for(const [player,expected]of [[q,'accepted'],[z,'rejected']]){
  await page.evaluate(id=>window.__hexUi.openLeader(id),player.id);const button=page.locator('[data-lm-kind="friendship"]');await button.waitFor();await button.click();
  await page.waitForFunction(()=>document.querySelector('[data-lm-kind="friendship"][aria-busy="true"]'));
  await page.waitForFunction(({id,status})=>window.__civ.game.court.offers.some(o=>o.from===0&&o.to===id&&o.kind==='friendship'&&o.status===status),{id:player.id,status:expected});
  assert.equal(match.game.court.offers.findLast(o=>o.from===0&&o.to===player.id).status,expected);assert(await page.locator('#toast').isVisible());assert(await page.locator('#toast').evaluate(el=>el.matches(':popover-open')));
  assert((await page.locator('#toast').textContent()).includes(expected==='accepted'?'接受':'拒绝'));
  if(expected==='accepted'){assert(await button.isDisabled());assert((await button.textContent()).includes('已宣布友谊'));}
  const layout=await page.evaluate(()=>({speech:document.querySelector('.ic-dialogue').getBoundingClientRect().toJSON(),grievance:document.querySelector('.ic-grievances').getBoundingClientRect().toJSON()}));assert(layout.speech.bottom<=layout.grievance.top+1,'Leader reply must not overlap the grievance row');
  await shot('friendship-'+expected);
 }
 pass('Friendship accepts or declines immediately with a visible modal-safe receipt, pending button and nonoverlapping reply');
 await page.evaluate(id=>{window.__hexUi.closeModal();window.__hexUi.selectTile(window.__civ.game.map.tiles[id]);window.__hexUi.openModal('cityWorkshop');},home.tile);
 await page.locator('[data-cw-row="warrior:"]').click();await page.locator('.cw-submit').click();await page.waitForFunction(()=>document.querySelector('.cw-submit[aria-busy="true"]'));
 await page.waitForFunction(()=>document.querySelector('.cw-row.current[data-cw-row="warrior:"]'));
 assert(await page.locator('.cw-submit').isDisabled());assert((await page.locator('.cw-submit').textContent()).includes('当前生产'));assert.equal(match.game.cities.find(c=>c.id===home.id).production.item,'warrior');await shot('production-confirmed');
 pass('Production visibly enters a pending state, marks its actual current project and disables repeat submission');
 const before=requests.filter(a=>a.type==='purchase').length;
 await page.evaluate(async id=>{const action={type:'purchase',city:id,item:'warrior'};await Promise.all([window.__hexUi.act(action,0),window.__hexUi.act(action,0)]);},home.id);
 assert.equal(requests.filter(a=>a.type==='purchase').length-before,1);
 pass('Two simultaneous identical purchase submissions share one request');
 await page.evaluate(()=>window.__hexUi.act({type:'research',item:'not-a-technology'},0));
 assert(await page.locator('#toast').isVisible());assert.equal(await page.locator('#toast').getAttribute('aria-live'),'assertive');
 pass('A rejected command displays its actual error above the open modal');
 await page.evaluate(()=>{window.__hexUi.closeModal();window.__hexUi.openModal('tech');});await page.locator('[data-b4-item="mining"]').first().click();await page.locator('[data-b4-research="mining"]').click();
 await page.waitForFunction(()=>window.__civ.game.players[0].research==='mining');assert.equal(match.game.players[0].research,'mining');
 pass('The initially empty science tree accepts the player choice and shows current research');
 await page.evaluate(()=>window.__hexUi.closeModal());
 const badge=await page.evaluate(id=>{const r=window.__civ.renderer,u=r.game.units.find(u=>u.id===id);r.menuOpen=false;r.focus(u.tile,1.4);r.dirty=true;r.render();return r.unitHits.find(h=>h.kind==='badge'&&h.unit.id===id);},unit.id);assert(badge);
 await page.mouse.click(badge.x+badge.width/2,badge.y+badge.height/2);assert.equal(await page.evaluate(()=>window.__civ.selection.id),unit.id);
 await page.mouse.click(badge.x+badge.width/2,badge.y+badge.height/2,{button:'right'});await page.waitForFunction(()=>window.__civ.renderer.orders.length>0);await page.mouse.click(badge.x+badge.width/2,badge.y+badge.height/2);assert.equal(await page.evaluate(()=>window.__civ.selection.id),unit.id);assert.equal(await page.evaluate(()=>window.__civ.renderer.orders.length),0);
 const point=await page.evaluate(id=>window.__civ.renderer.screen(window.__civ.game.map.tiles[id]),target.id);await page.mouse.click(point.x,point.y);assert.equal(match.game.units.find(u=>u.id===unit.id).tile,unit.tile);
 await page.mouse.click(badge.x+badge.width/2,badge.y+badge.height/2);await page.mouse.click(point.x,point.y,{button:'right'});await page.waitForFunction(({id,tile})=>window.__civ.game.units.find(u=>u.id===id)?.tile===tile,{id:unit.id,tile:target.id});
 const moved=await page.evaluate(id=>{const r=window.__civ.renderer;r.dirty=true;r.render();return r.unitHits.find(h=>h.kind==='badge'&&h.unit.id===id);},unit.id);assert(moved);await page.mouse.click(moved.x+moved.width/2,moved.y+moved.height/2,{button:'right'});assert.equal(await page.evaluate(()=>window.__civ.selection.id),unit.id);
 pass('Left and right clicks select units; a left-click destination never moves, while a right-click destination does');
 const sound=await page.evaluate(async()=>{const a=window.__civ.audio;await new Promise(r=>setTimeout(r,100));const before=a.uiPlayed;await a.feedback('confirm');const enabled=a.uiPlayed;const state=a.context?.state;a.setPreferences({muted:true});await a.feedback('click');const muted=a.uiPlayed;a.setPreferences({muted:false,effects:0});await a.feedback('confirm');return {before,enabled,muted,silent:a.uiPlayed,state};});
 assert.equal(sound.state,'running');assert(sound.before>0&&sound.enabled>sound.before);assert.equal(sound.enabled,sound.muted);assert.equal(sound.enabled,sound.silent);
 pass('Actual Web Audio confirmation works in paused turns; global mute and effects volume zero suppress it');
 await page.evaluate(()=>{window.__civ.audio.setPreferences({effects:.4});return window.__hexUi.openModal('audio');});await page.waitForTimeout(100);const previewBefore=await page.evaluate(()=>window.__civ.audio.uiPlayed);await page.locator('#audio-preview').click();await page.waitForFunction(before=>window.__civ.audio.uiPlayed>before,previewBefore);
 pass('The sound-settings preview plays the new quiet confirmation instead of a combat effect');
 assert.deepEqual(errors,[]);await writeFile(new URL('ui.json',out),JSON.stringify({passed:true,checks,errors,sound,actionRequests:requests.map(a=>a.type),activeSaveWritten:false},null,2));
}catch(error){await shot('failure');await writeFile(new URL('failure.json',out),JSON.stringify({error:error.message,errors,checks,requests:requests.map(a=>a.type)},null,2));throw error;}finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
