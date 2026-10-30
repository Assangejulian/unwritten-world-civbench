import auditBrowserRuntime from './browser-runtime.cjs';
// Disposable real HTTP/gameplay checks. No live desktop, paid model or production save.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import * as E from '../src/engine.mjs';
import {field} from './imperial-fixture.mjs';

const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const out=path.resolve(process.env.UI_CHECK_OUTPUT||'output/ui-renaissance-20261022/acceptance'),checks=[],errors=[],failedRequests=[];
await mkdir(out,{recursive:true});
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const {g,p,home}=field();home.population=4;p.civics=['code'];g.settings.autosaveEnabled=false;
for(const player of g.players)assignController(player,player.id===0?'human':'inactive');
const runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''})});
await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});
const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});
const host=await listen(runtime,{port:0});
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400)failedRequests.push({path:new URL(response.url()).pathname,status:response.status()});});
await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,name+'.png')});};
async function readable(selector, minimum = 4.5){
 const rows=await page.locator(selector).evaluateAll(elements=>{
  const rgb=value=>{const m=value.match(/^rgba?\(([^)]+)\)$/);return m?m[1].split(',').map(Number):null;};
  const lum=c=>c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  return elements.filter(el=>el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&el.textContent.trim()).map(el=>{
   const style=getComputedStyle(el),fg=rgb(style.webkitTextFillColor)||rgb(style.color);let backgrounds=[];
   for(let parent=el;parent;parent=parent.parentElement){
    const css=getComputedStyle(parent),bg=rgb(css.backgroundColor);
    if(bg&&(bg[3]??1)>.95){backgrounds=[bg];break;}
    if(css.backgroundImage.startsWith('linear-gradient(')){
     backgrounds=[...css.backgroundImage.matchAll(/rgb\(([^)]+)\)/g)].map(m=>m[1].split(',').map(Number));
     if(backgrounds.length)break;
    }
   }
   return {text:el.textContent.trim().slice(0,80),ratio:fg&&backgrounds.length?Math.min(...backgrounds.map(bg=>ratio(fg,bg))):null};
  });
 });
 assert(rows.length,'Visible labels must exist: '+selector);
 for(const row of rows)assert(row.ratio!==null&&row.ratio>=minimum,JSON.stringify({selector,...row}));
 return rows;
}
async function centeredGlyphs(selector, buttonCenter = true){
 const rows=await page.locator(selector).evaluateAll((buttons,buttonCenter)=>buttons.map(button=>{
  const svg=button.querySelector('svg');if(!svg)return {svg:false,label:button.getAttribute('aria-label')};
  const b=button.getBoundingClientRect(),s=svg.getBoundingClientRect(),ink=svg.getBBox(),v=svg.viewBox.baseVal,point=new DOMPoint(ink.x+ink.width/2,ink.y+ink.height/2).matrixTransform(svg.getScreenCTM());
  const center=buttonCenter?b:s;
  return {svg:true,label:button.getAttribute('aria-label'),dx:point.x-center.x-center.width/2,dy:point.y-center.y-center.height/2,
   clipped:ink.x<v.x||ink.y<v.y||ink.x+ink.width>v.x+v.width||ink.y+ink.height>v.y+v.height,
   outside:s.left<b.left||s.top<b.top||s.right>b.right||s.bottom>b.bottom};
 }),buttonCenter);
 assert(rows.length,'Expected visible controls: '+selector);
 for(const row of rows)assert(row.svg&&!row.clipped&&!row.outside&&Math.abs(row.dx)<.75&&Math.abs(row.dy)<.75,JSON.stringify(row));
 return rows;
}
try{
  await page.goto(host.url+'/?access='+token,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
  await page.evaluate(()=>{window.__civ.renderer.menuOpen=true;});
  assert.equal(await page.locator('html').getAttribute('data-theme'),'renaissance');
  const fonts=await page.evaluate(async()=>{await Promise.all([document.fonts.load('16px "RN Newsreader"'),document.fonts.load('16px "RN Source Sans"')]);return ['RN Newsreader','RN Source Sans'].map(font=>document.fonts.check(`16px "${font}"`));});
  assert(fonts.every(Boolean));pass('The sole frontend loads its local licensed fonts and theme');

  await page.locator('.pt-main').waitFor();
  for(let index=0;index<15&&!await page.locator('.pt-main.k-production').isVisible();index++)await page.locator('[data-pt-cycle="1"]').click();
  await page.locator('.pt-main.k-production').waitFor();
  const taskHash=runtime.gameplayHash();
  for(const [width,height] of [[1920,1080],[1280,720],[390,844]]){
    await page.setViewportSize({width,height});
    await centeredGlyphs('.pt-main.k-production,.pt-cycle');
    await page.locator('[data-pt-cycle="1"]').click();await page.locator('[data-pt-cycle="-1"]').click();
    assert.equal(await page.locator('.pt-main.k-production').count(),1);
    await shot('production-instrument-'+width);
  }
  assert.equal(runtime.gameplayHash(),taskHash);
  pass('Production gear and SVG task arrows remain centered and unclipped at 1920/1280/390px; task cycling preserves game state');

  for(const [width,height] of [[1920,1080],[1280,720],[390,844]]){
    await page.setViewportSize({width,height});
    await page.locator('[data-b-menu]').click();
    await page.locator('#b-menu.open .b-menu-pop').waitFor();
    const items=page.locator('.b-menu-pop [role="menuitem"]');assert.equal(await items.count(),9);
    await readable('.b-menu-pop button>span');
    const box=await page.locator('.b-menu-pop').boundingBox();
    assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'Menu stays inside viewport');
    const clear=await page.evaluate(()=>{
      const menu=document.querySelector('.b-menu-pop'),m=menu.getBoundingClientRect(),rank=document.getElementById('civ-rankings-btn')?.getBoundingClientRect();
      const clean=[...menu.querySelectorAll('button')].every(button=>getComputedStyle(button,'::after').content==='none');
      if(!rank)return clean;
      const left=Math.max(m.left,rank.left),right=Math.min(m.right,rank.right),top=Math.max(m.top,rank.top),bottom=Math.min(m.bottom,rank.bottom);
      return clean&&(left>=right||top>=bottom||!!document.elementFromPoint((left+right)/2,(top+bottom)/2)?.closest('#b-menu'));
    });assert(clear,'Open menu is above floating controls and has no primary-nav underlines');
    await items.nth(1).hover();await readable('.b-menu-pop button>span');
    await items.nth(1).focus();assert.equal(await items.nth(1).evaluate(el=>document.activeElement===el),true);
    await shot('more-menu-'+width);
    await page.locator('[data-b-menu]').click();
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-b-menu]').click();await page.locator('.b-menu-pop [data-b-click=\'button[data-modal="help"]\']').click();
  await page.locator('#modal[open]').waitFor();assert.equal(await page.locator('#b-menu.open').count(),0);await page.locator('#close-modal').click();
  pass('Nine menu labels retain contrast, hover/focus and real navigation at 1920/1280/390px; floating controls cannot cover them');

  for(const [name,hue] of [['diplomacy','diplomacy'],['governors','civics'],['religion','faith'],['wonders','heritage'],['saves','archive'],['audio','archive']]){
    await page.evaluate(name=>window.__civ.openModal(name),name);
    await page.locator('#modal[open]').waitFor();
    await page.waitForFunction(hue=>document.getElementById('modal').dataset.rnPanel===hue,hue);
    const before=runtime.gameplayHash();await shot(name+'-1440');
    await page.locator('#close-modal').click();assert.equal(runtime.gameplayHash(),before);
  }
  pass('Six shared panel families route, receive distinct hues and close without changing game state');

  for(const [name,selector] of [
    ['congress','.congress-scene-caption :is(small,h3,p),.congress-history summary'],
    ['governors','.ic-governor-roster button>span :is(b,small)'],
    ['wonders','.heritage-entry.selected :is(span,strong,small)'],
    ['leaders','#leader-tabs button.active strong,.replacement-origin'],
    ['drivers','#modal-body td[style*="color"]']
  ]){
    await page.evaluate(name=>window.__civ.openModal(name),name);await page.locator('#modal[open]').waitFor();
    await readable(selector);
    if(name==='wonders'){
      for(const [width,height] of [[1440,1000],[1280,720],[390,844]]){
        await page.setViewportSize({width,height});await centeredGlyphs('.heritage-pagination button');
        const before=await page.locator('[data-heritage-page]').innerText();
        await page.locator('[data-heritage-next]').click();assert.notEqual(await page.locator('[data-heritage-page]').innerText(),before);
        await page.locator('[data-heritage-prev]').click();assert.equal(await page.locator('[data-heritage-page]').innerText(),before);
      }
      await page.setViewportSize({width:1440,height:1000});
    }
    await shot(name+'-contrast-1440');await page.locator('#close-modal').click();
  }
  pass('Congress image captions, governor portrait ribbons, selected wonder/leader labels and driver names remain readable');

  for(const [name,key] of [['tech','mining'],['civic','craftsmanship']]){
    await page.evaluate(name=>window.__civ.openModal(name),name);
    await page.locator('#b4-codex:not([hidden])').waitFor();
    const node=page.locator(`[data-b4-item="${key}"]`);await node.scrollIntoViewIfNeeded();await node.click();
    const evidence=await page.locator('#b4-codex').evaluate(el=>{
      const label=el.querySelector('.b5-node.s-locked .b5-name'),fade=el.querySelector('.b5-node.fade'),emblem=el.querySelector('.b5-emb-i');
      return {labelColor:label&&getComputedStyle(label).color,fadeOpacity:fade&&getComputedStyle(fade).opacity,emblemColor:emblem&&getComputedStyle(emblem).color,animation:getComputedStyle(el).animationName};
    });
    if(evidence.fadeOpacity)assert(Number(evidence.fadeOpacity)>=.85);
    assert.equal(evidence.animation,'none');await shot(name+'-1440');
    const action=page.locator(`[data-b4-research="${key}"]`);
    assert(await action.isEnabled());
    await action.click();await page.waitForFunction(({name,key})=>window.__civ.game.players[0][name==='tech'?'research':'civic']===key,{name,key});
    await page.locator('[data-b4-close]').click();
  }
  pass('Science/civic trees keep readable selection context, reduced motion and actual research controls');

  // Exercise the actual gear handler and real workshop actions, not a standalone mock component.
  await page.evaluate(()=>document.getElementById('city-workshop-launcher').click());
  await page.locator('.cw').waitFor();assert.equal(await page.locator('#modal').getAttribute('data-rn-panel'),'cities');
  assert.equal(await page.locator('.cw-heading h2').evaluate(el=>getComputedStyle(el).color),'rgb(251, 246, 234)');
  await page.locator('.cw-search').fill('建造者');await page.locator('.cw-row').first().click();await page.locator('.cw-submit').click();
  await page.waitForFunction(()=>window.__civ.game.cities.some(city=>city.owner===0&&city.production?.item==='builder'));
  const city=runtime.game.cities.find(city=>city.owner===0),queue=JSON.stringify(city.production),gold=runtime.game.players[0].gold,count=runtime.game.units.length;
  await page.locator('[data-cw-mode="gold"]').click();await page.locator('.cw-row[data-cw-row="builder:"]').click();await page.locator('.cw-submit').click();
  await page.waitForFunction(count=>window.__civ.game.units.length>count,count);
  assert(runtime.game.players[0].gold<gold);assert.equal(JSON.stringify(city.production),queue);
  await shot('workshop-gold-1440');
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:width===390?844:900});
    await page.locator('[data-cw-mode="faith"]').click();
    const bounds=await page.locator('.cw').boundingBox(),close=await page.locator('.cw-close').boundingBox();
    assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);assert(close.x>=0&&close.x+close.width<=width+1);
    await shot('workshop-faith-'+width);
  }
  await page.locator('.cw-close').click();pass('Three workshop tabs stay reachable at 1440/1280/390px; real gold purchase preserves the production queue');
  const observer=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),observerPage=await observer.newPage();
  await observer.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
  try{
    await observerPage.goto(host.url+'/?access='+runtime.observerToken,{waitUntil:'domcontentloaded'});
    await observerPage.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
    const offsets=await observerPage.locator('#city-workshop-launcher').evaluate(button=>{
      const svg=button.querySelector('svg'),b=svg.getBBox(),r=svg.getBoundingClientRect(),p=new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(svg.getScreenCTM());
      return {x:p.x-r.x-r.width/2,y:p.y-r.y-r.height/2};
    });assert(Math.abs(offsets.x)<.75&&Math.abs(offsets.y)<.75);
    await observerPage.locator('#city-workshop-launcher').click();await observerPage.locator('.cw-readonly').waitFor();
  }finally{await observer.close();}
  pass('Observer production launcher reuses the concentric gear and still opens the readonly workshop');
  assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);pass('No browser exceptions or failed HTTP resources');
  await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,errors,failedRequests,acceptedActions:runtime.commands.filter(command=>command.status==='applied').length,paidModel:false,productionWrites:false},null,2));
}catch(error){await shot('failure');await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.message,checks,errors,failedRequests},null,2));throw error;}
finally{await browser.close();host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
