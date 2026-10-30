// Universe is mounted by startup; retired style switching has been removed.
// Real HTTP/browser regression for task, shortcut and presentation-specific page routing.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('./browser-runtime.cjs').load('playwright');
const root=path.resolve(__dirname,'..'),before=process.argv.includes('--before');
const out=path.join(root,'output/panel-routing-20261019',before?'reproduction':'browser'),copy=path.join(out,'server');
const checks=[],errors=[],modules=[],dialogs=[];
(async()=>{
 fs.mkdirSync(copy,{recursive:true});
 for(const name of ['src','web','players','sdk'])fs.cpSync(path.join(root,name),path.join(copy,name),{recursive:true,filter:p=>!['assets','vendor'].includes(path.basename(p))});
 for(const name of ['assets','vendor'])if(!fs.existsSync(path.join(copy,'web',name)))fs.symlinkSync(path.join(root,'web',name),path.join(copy,'web',name),'junction');
 for(const name of ['server.mjs','package.json'])fs.copyFileSync(path.join(root,name),path.join(copy,name));
 if(before)for(const name of ['web/app.js','web/ui-b/ui-b-v4.js'])fs.copyFileSync(path.join(root,'output/panel-routing-20261019/before',name),path.join(copy,name));
 const E=await import(pathToFileURL(path.join(root,'src/engine.mjs'))),F=await import(pathToFileURL(path.join(root,'scripts/imperial-fixture.mjs')));
 const {g,p}=F.field();p.techs=[];p.civics=['code'];p.research=p.civic=null;p.gold=1000;p.faith=0;g.settings.autosaveEnabled=false;
 E.refreshVisibility(g);fs.mkdirSync(path.join(copy,'saves'),{recursive:true});fs.writeFileSync(path.join(copy,'saves/autosave.json'),E.serialize(g));
 const probe=http.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 let log='',browser,page;const child=spawn(process.execPath,['server.mjs'],{cwd:copy,env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 const pass=name=>{checks.push(name);console.log('PASS '+name);};
 try{
  const base='http://127.0.0.1:'+port;let ready=false;
  for(let i=0;i<150;i++){try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready,log);
  browser=await chromium.launch({headless:true,executablePath:require('./browser-runtime.cjs').chromiumExecutable(),args:['--use-angle=swiftshader']});
  page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(30000);
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});page.on('response',r=>{if(r.status()>=400&&/\.m?js(?:\?|$)/.test(r.url()))modules.push(r.url());});
  await page.addInitScript(()=>{localStorage.setItem('hex.uiStyle','B');localStorage.setItem('hex.audio.music','0');});
  await page.goto(base);await page.waitForFunction(()=>!!window.__civ?.game);await page.locator('#menu-continue').click();await page.waitForFunction(()=>window.__civ.session.canEndTurn&&!!document.querySelector('#b4-tracker'));await page.locator('.pt-main').waitFor();
  await page.evaluate(()=>{const r=window.__civ.renderer;r.menuOpen=true;r.reduced=true;});
  async function task(kind){for(let i=0;i<12;i++){if(await page.locator('.pt-main.k-'+kind).count())return;await page.locator('[data-pt-cycle="1"]').click();await page.waitForTimeout(100);}throw Error('Missing task '+kind);}
  async function codex(tab){await page.waitForFunction(tab=>{const el=document.getElementById('b4-codex');return el&&!el.hidden&&el.dataset.tab===tab&&!document.getElementById('modal').open;},tab);}
  async function close(){await page.locator('[data-b4-close]').click();}
  await task('civic');await page.locator('.pt-main').click();
  if(before){await page.locator('#modal[open] .tree-node').first().waitFor();await page.screenshot({path:path.join(out,'old-civic-task.png')});pass('Reproduced: real civic task opens legacy modal while B presentation is active');return;}
  await codex('civic');await page.screenshot({path:path.join(out,'civic-task-B.png')});
  const civic=await page.locator('.b5-node.s-avail').first().getAttribute('data-b4-item');await page.locator('.b5-node.s-avail').first().click();await page.locator('[data-b4-research]').click();await page.waitForFunction(k=>window.__civ.game.players[0].civic===k,civic);await codex('civic');await close();pass('Real civic task opens B tree and research stays in B after the actual command');
  await task('research');await page.locator('.pt-main').click();await codex('tech');
  const tech=await page.locator('.b5-node.s-avail').first().getAttribute('data-b4-item');await page.locator('.b5-node.s-avail').first().click();await page.locator('[data-b4-research]').click();await page.waitForFunction(k=>window.__civ.game.players[0].research===k,tech);await codex('tech');await close();pass('Real science task opens B tree and applies the actual research command');
  for(const tab of ['tech','civic']){await page.locator('#b4-tracker [data-b4-codex="'+tab+'"]').click();await codex(tab);await close();await page.locator('.b-nav [data-b4-codex="'+tab+'"]').click();await codex(tab);await close();}pass('Tracker and navigation use the same current science/civic pages');
  for(const [name,tab]of [['tech','tech'],['civic','civic'],['greatpeople','gp']]){await page.evaluate(n=>window.__hexUi.openModal(n),name);await codex(tab);await close();}pass('Programmatic/internal modal links route tech, civic and Great People to B pages');
  await page.locator('.b-nav [data-b4-codex="gp"]').click();await codex('gp');await close();pass('Great People navigation retains its current B page');
  await page.locator('#b4-tracker [data-b4-codex="civic"]').click();await page.evaluate(()=>window.__hexUi.openModal('religion'));await page.locator('#modal[open]').waitFor();assert(await page.locator('#b4-codex').isHidden());
  await page.evaluate(()=>window.__hexUi.openModal('civic'));await codex('civic');await close();pass('Switching shared religion and B civic pages never leaves the legacy modal or codex stacked');
  for(const name of ['age']){await page.evaluate(n=>window.__hexUi.openModal(n),name);await page.locator('#b4-age[open]').waitFor();assert(!await page.locator('#modal').evaluate(el=>el.open));await page.evaluate(()=>window.__hexUi.openModal('tech'));await codex('tech');assert(!await page.locator('#b4-age').evaluate(el=>el.open));await close();}pass('Internal age links use B history and release it when switching to research');
  await task('production');await page.locator('.pt-main').click();await page.locator('.cw-search').waitFor();assert(await page.locator('[data-cw-mode="gold"]').isVisible());await page.locator('.cw-close').click();pass('Production task still opens the current three-mode city workshop');
  for(const name of ['leaders','governors','worldsystems','wonders','congress','diplomacy','help']){await page.evaluate(n=>window.__hexUi.openModal(n),name);await page.locator('#modal[open][data-page="'+name+'"]').waitFor();assert(await page.locator('#b4-codex').isHidden());assert.equal(await page.locator('.driver-error').count(),0);await page.locator('#close-modal').click();}pass('Seven shared council/help destinations retain their existing panels without a research overlay');
  for(const tab of ['tech','civic']){await page.evaluate(name=>window.__hexUi.openModal(name),tab);await codex(tab);assert.equal(await page.locator('.tree-node').count(),0);await close();}pass('Science and civic shared entry points only open Universe pages');
  for(let i=0;i<2;i++){await page.evaluate(()=>window.__hexUi.openModal('civic'));await codex('civic');await close();assert.equal(await page.locator('#b4-codex').count(),1);}pass('Repeated page opening retains one Universe codex without duplicate routing');
  await page.waitForSelector('#b4-tracker');await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__hexUi.openModal('civic'));await codex('civic');const bounds=await page.locator('#b4-codex').boundingBox();assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=391);await page.screenshot({path:path.join(out,'civic-B-390.png')});pass('Current civic panel remains bounded at 390px after routed opening');
  assert.deepEqual(errors,[]);assert.deepEqual(modules,[]);assert.deepEqual(dialogs,[]);
 }catch(e){if(page)await page.screenshot({path:path.join(out,'FAILED.png')}).catch(()=>{});throw e;}
 finally{await browser?.close();child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));fs.writeFileSync(path.join(out,'server.log'),log);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({passed:checks.length===(before?1:12)&&!errors.length&&!modules.length&&!dialogs.length,checks,errors,modules,dialogs,scope:'Disposable actual HTTP server and actual engine commands. Reduced motion and frozen map render after initialization. No production game or save control.'},null,2));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
