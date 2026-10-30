import auditBrowserRuntime from './browser-runtime.cjs';
// Real mouse/DOM checks against disposable hosts. Never starts the desktop or writes saves.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {Lobby} from '../src/environment/lobby.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {assignController} from '../src/environment/controllers.mjs';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {field} from './imperial-fixture.mjs';

const require=createRequire(import.meta.url);
const {chromium}=auditBrowserRuntime.load('playwright');
const base=path.resolve(process.env.UI_CHECK_OUTPUT||'output/playwright/classic-repair-20261020'),baseline=process.argv.includes('--baseline');
const candidate=process.env.UI_CHECK_CANDIDATE?path.resolve(process.env.UI_CHECK_CANDIDATE):null;
const candidateFiles=candidate?new Set(JSON.parse(await readFile(path.join(candidate,'UI_CHANGED_FILES.json'),'utf8')).files.map(file=>file.path)):null;
const out=path.join(base,baseline?'baseline':'after'),checks=[],errors=[],metrics=[];
await mkdir(out,{recursive:true});
async function saveHashes(){const result={};for(const name of await readdir('saves'))if(name.endsWith('.json'))result[name]=createHash('sha256').update(await readFile(path.join('saves',name))).digest('hex');return result;}
const beforeSaves=await saveHashes();
function check(name,passed,details){checks.push({name,passed,details});console.log((passed?'PASS ':'FAIL ')+name);}
async function screenshot(page,name){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>{const r=image.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}).map(image=>image.decode().catch(()=>{})));});await page.screenshot({path:path.join(out,name+'.png')});}
async function closeHost(host){host.server.closeAllConnections();await new Promise(resolve=>host.server.close(resolve));}
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
async function context(width,height){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await ctx.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));
  if(baseline)for(const file of ['ui-b/classic.css','app.js'])await ctx.route('**/'+file,async route=>route.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:await readFile(path.join(base,'before/web',file))}));
  if(candidate)await ctx.route('**/*',async route=>{
    const pathname=new URL(route.request().url()).pathname,relative='web/'+(pathname==='/'?'index.html':pathname.slice(1));
    if(!candidateFiles.has(relative))return route.continue();
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.txt':'text/plain'}[path.extname(relative)]||'application/octet-stream';
    return route.fulfill({contentType:type,body:await readFile(path.join(candidate,'candidate',relative))});
  });
  const page=await ctx.newPage();page.on('pageerror',error=>errors.push(error.message));
  return {ctx,page};
}
async function geometry(page,selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,scroll:el.scrollHeight,height:el.clientHeight,width:el.clientWidth,scrollWidth:el.scrollWidth};});}
try{
  if(!process.argv.includes('--game-only')){
  const lobby=new Lobby({stub:true}),front=await listen(null,{port:0,lobby});
  try{
    for(const [width,height] of [[1920,1080],[1280,720],[390,844]]){
      const {ctx,page}=await context(width,height);
      try{
        await page.goto(front.url+'/#setup='+lobby.hostCapability,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__civ?.menuShown);
        await page.locator('#menu-new').click();await page.locator('#setup-count').selectOption('16');
        if(width<=900)await page.locator('[data-setup-tab="leaders"]').click();
        const roster=await geometry(page,'.setup-roster-panel');metrics.push({width,roster});
        check(width+': roster stays inside the dialog and has no horizontal overflow',roster.left>=0&&roster.right<=width&&roster.top>=0&&roster.bottom<=height&&roster.scrollWidth<=roster.width+1,roster);
        check(width+': eight visible slots and bottom launch control',await page.locator('.setup-roster-row:visible').count()===8&&await page.locator('#create-world').isVisible());
        await page.locator('#setup-next').click();check(width+': the sixteenth civilization is reachable',await page.locator('[data-setup-leader="15"]').isVisible());await page.locator('#setup-prev').click();
        check(width+': retired Grok/trial/seat controls are absent',await page.locator('#setup-agent-launch,#setup-agent-rounds,#setup-agent-stop,#setup-mcp-seat').count()===0);
        await page.locator('[data-controller="0"]').selectOption('api');await page.locator('[data-setup-client="0"]').click();
        check(width+': API civilization opens its configuration',await page.locator('#setup-model-api').isVisible());
        await page.locator('#setup-api-url').fill('http://127.0.0.1:12345/v1');await page.locator('#setup-api-model').fill('local-test');
        await page.locator('#setup-details-close').click();check(width+': connection settings close',await page.locator('#setup-connection-details').isHidden());
        await page.locator('[data-setup-client="0"]').click();check(width+': reopening preserves API form values',await page.locator('#setup-api-model').inputValue()==='local-test');
        await screenshot(page,'setup-api-'+width);
        await page.locator('#close-modal').click();
      }finally{await ctx.close();}
    }
  }finally{lobby.dispose();await closeHost(front);}
  }

  const fixture=field(),{g,p,tile}=fixture;
  for(const player of g.players)assignController(player,player.id===0?'human':'inactive');
  const terrain=tile(4,4);terrain.resource=Object.keys(R.RESOURCES).find(key=>/小麦/.test(R.RESOURCES[key].name))||'wheat';terrain.hill=true;terrain.improvement='farm';
  const warrior=E.addUnit(g,0,'warrior',tile(5,4).id);p.techs=Object.keys(R.TECHS);g.settings.autosaveEnabled=false;E.refreshVisibility(g);
  const runtime=await MatchRuntime.create({players:3,size:'small',seats:[{seat:0,kind:'human'},{seat:1,kind:'inactive'},{seat:2,kind:'inactive'}],execute:async()=>({orders:[],memory:null,ms:0,stderr:''}),prepareObservation:async()=>({player:{faith:0,beliefs:{}},legalActions:[],units:[],cities:[],greatPeople:{candidates:[]}})});
  await runtime.hostLoad(runtime.hostToken,E.serialize(g),{record:false});
  const {token}=await runtime.reassign(runtime.hostToken,0,{kind:'human'},{record:false});
  const host=await listen(runtime,{port:0});
  const {ctx,page}=await context(1440,1000);
  const initialWorld=runtime.gameplayHash();
  try{
    await page.goto(host.url+'/?access='+token,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__civ?.renderer?.renderedFrames>0,null,{timeout:120000});
    async function hover(id,unit=false){
      await page.evaluate(id=>window.__civ.renderer.focus(id),id);
      await page.waitForFunction(()=>!window.__civ.renderer.targetCam,null,{timeout:20000});
      const point=await page.evaluate(({id,unit})=>{const c=window.__civ,r=c.renderer,rect=document.getElementById('map').getBoundingClientRect(),s=r.screen(c.game.map.tiles[id]);for(const [dx,dy]of(unit?[[0,-18],[0,0],[10,-20]]:[[23,16],[-27,16],[0,22],[-16,-16]])){const x=rect.left+s.x+dx,y=rect.top+s.y+dy;if(r.pick(x,y)?.id===id&&(!r.hitUnit(x,y)||unit)&&!r.hitCityLabel(x,y)&&document.elementFromPoint(x,y)?.id==='map')return {x,y};}throw Error('No exposed hover point');},{id,unit});
      await page.mouse.move(point.x-3,point.y-3);await page.mouse.move(point.x,point.y);
      try{await page.locator('#hover').waitFor({state:'visible',timeout:5000});}catch(error){await screenshot(page,'hover-failure');await writeFile(path.join(out,'hover-failure.json'),JSON.stringify(await page.evaluate(({id,point})=>{const r=window.__civ.renderer,e=document.getElementById('hover');return {point,tile:window.__civ.game.map.tiles[id],pick:r.pick(point.x,point.y)?.id,hovered:r.hovered,pointers:r.pointers.size,element:document.elementFromPoint(point.x,point.y)?.outerHTML.slice(0,300),tooltip:e.outerHTML,style:{display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility},menu:window.__civ.menuShown};},{id,point}),null,2));throw error;}return point;
    }
    await hover(terrain.id);
    const detail=await page.locator('#hover').innerText();
    check('A real terrain hover includes coordinates, yields and resource/improvement details',detail.includes('坐标')&&detail.includes('食物')&&detail.includes('生产')&&detail.includes(R.RESOURCES[terrain.resource]?.name||'小麦'),detail);
    async function contrast(){return page.locator('#hover').evaluate(el=>{const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),luma=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),background=getComputedStyle(document.documentElement).getPropertyValue('--cx-u1').trim(),bg=luma([20,15,10]);return [...el.querySelectorAll('strong,span,small,p')].filter(e=>e.textContent.trim()).map(e=>{const foreground=getComputedStyle(e).color,lum=luma(rgb(foreground));return {text:e.textContent.slice(0,90),foreground,background,ratio:(Math.max(lum,bg)+.05)/(Math.min(lum,bg)+.05)};});});}
    const colors=await contrast();metrics.push({terrainColors:colors});check('Every terrain-tooltip text line has readable contrast on lacquer',colors.every(c=>c.ratio>=4.5),colors);
    await screenshot(page,'terrain-hover');
    await hover(warrior.tile,true);const unitText=await page.locator('#hover').innerText();check('Unit hover retains health, civilization and action information',unitText.includes('勇士')&&unitText.includes('生命')&&unitText.includes('右键'),unitText);check('Unit-hover descendants share the readable tooltip palette',(await contrast()).every(c=>c.ratio>=4.5));await screenshot(page,'unit-hover');
    await page.mouse.move(700,50);check('Leaving the map clears its tooltip',await page.locator('#hover').isHidden());
    for(const name of ['diplomacy','governors','religion']){
      await page.evaluate(name=>window.__civ.openModal(name),name);await page.locator('#modal[open]').waitFor();
      check(name+': parchment panel remains reachable',await page.locator('#modal-title').innerText()!=='');await screenshot(page,name);if(name==='governors')check('All eight governor portraits load in the classical roster',await page.locator('.ic-governor-roster img').evaluateAll(images=>images.length===8&&images.every(image=>image.complete&&image.naturalWidth>0)));await page.locator('#close-modal').click();
    }
    check('UI inspection never changes authoritative gameplay',runtime.gameplayHash()===initialWorld);
  }finally{await ctx.close();runtime.dispose?.();await closeHost(host);}
  check('No browser script exceptions',errors.length===0,errors);
}finally{
  await browser.close();
  const afterSaves=await saveHashes(),changed=Object.keys(beforeSaves).filter(name=>beforeSaves[name]!==afterSaves[name]);
  await writeFile(path.join(out,'checks.json'),JSON.stringify({passed:checks.every(c=>c.passed),baseline,checks,metrics,errors,saves:{count:Object.keys(beforeSaves).length,changed,productionWrites:false}},null,2));
}
if(!baseline)assert(checks.every(c=>c.passed),'One or more classical UI checks failed');
