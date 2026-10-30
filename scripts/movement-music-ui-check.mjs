// Reuse the actual handler/browser fixture; extend its final UI inspection only.
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),target=pathToFileURL(path.join(root,'scripts/p1-execution-ui-check.mjs')).href;
process.env.P1_UI_OUT=path.join(root,'output/movement-music-ui-checks.json');
const extension=`
 const sample=A.world.units.find(u=>u.owner===P&&UNITS[u.type].domain!=='air');assert(sample);
 await page.evaluate(id=>{const a=window.__civ,u=a.game.units.find(v=>v.id===id);a.selectTile(a.game.map.tiles[u.tile],null,u);},sample.id);
 await page.waitForFunction(()=>document.querySelector('.unit-movement'));
 assert.match(await page.locator('.unit-movement').innerText(),new RegExp('单次移动上限：'+UNITS[sample.type].moves+' 格'));pass('Actual inspector reports the selected unit model cell limit');
 await page.screenshot({path:path.join(root,'output/movement-music-20261011/unit-desktop.png')});
 await page.locator('[data-modal="audio"]').click();await page.waitForFunction(()=>document.getElementById('audio-next'));
 assert.match(await page.locator('#modal-body').innerText(),/已遇见文明随机轮播/);assert.match(await page.locator('#modal-body').innerText(),/特色器乐和电影感配乐/);
 await page.evaluate(()=>{const a=window.__civ.audio;a.setPreferences({effects:0,music:.15,muted:false});void a.unlock();});
 await page.waitForFunction(()=>window.__civ.audio.track?.nationName&&document.getElementById('audio-now').textContent.includes(window.__civ.audio.track.nationName));
 assert.equal(await page.locator('#audio-next').isDisabled(),false);await page.screenshot({path:path.join(root,'output/movement-music-20261011/music-desktop.png')});pass('Actual audio modal explains encountered shuffle and names the playing civilization');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 const fit=await page.locator('.audio-settings').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth,screen:innerWidth,right:e.getBoundingClientRect().right}));assert(fit.scroll<=fit.client+1&&fit.right<=fit.screen+1,JSON.stringify(fit));
 await page.screenshot({path:path.join(root,'output/movement-music-20261011/music-mobile.png')});await page.locator('#close-modal').click();
 const unitFit=await page.locator('.unit-movement').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth,screen:innerWidth,right:e.getBoundingClientRect().right}));assert(unitFit.scroll<=unitFit.client+1&&unitFit.right<=unitFit.screen+1,JSON.stringify(unitFit));
 await page.screenshot({path:path.join(root,'output/movement-music-20261011/unit-mobile.png')});pass('Movement explanation and streaming music controls fit the 390px mobile viewport');
`;
const hook=registerHooks({load(url,context,next){const result=next(url,context);if(url!==target)return result;const text=result.source.toString(),marker=" assert.deepEqual(errors,[]);pass('No browser errors');";if(!text.includes(marker))throw Error('UI fixture marker missing');return {...result,source:text.replace(marker,extension+marker)};}});
try{await import(target);}finally{hook.deregister();}
const result=JSON.parse(fs.readFileSync(process.env.P1_UI_OUT));result.sources={};
for(const file of ['web/app.js','web/audio.js','web/audio-catalogue.js','src/rules.mjs','scripts/movement-music-ui-check.mjs','scripts/p1-execution-ui-check.mjs'])result.sources[file]=createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
fs.writeFileSync(process.env.P1_UI_OUT,JSON.stringify(result,null,2)+'\n');
