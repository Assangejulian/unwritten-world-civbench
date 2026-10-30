import auditBrowserRuntime from './browser-runtime.cjs';
// Actual desktop handlers and real browser UI, with a private fixture save directory.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire,registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import {Readable} from 'node:stream';
import * as E from '../src/engine.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/unified-ai-20261021/browser');
fs.mkdirSync(out,{recursive:true});const work=fs.mkdtempSync(path.join(out,'fixture-'));
const initial=E.createGame({players:2,size:'small',seed:'UNIFIED-UI',barbarians:false});
initial.settings.aiAlgorithm='A';fs.writeFileSync(path.join(work,'autosave.json'),E.serialize(initial));
globalThis.__unifiedServer=handler=>{globalThis.__unifiedHandler=handler;return{on(){},listen(){}};};
const serverURL=pathToFileURL(path.join(root,'server.mjs')).href;
const hooks=registerHooks({load(url,context,next){const result=next(url,context);if(url!==serverURL)return result;
  let source=result.source.toString().replaceAll('\r\n','\n');
  source=source.replace("const saveDir=path.join(ROOT,'saves')",'const saveDir='+JSON.stringify(work)).replace('http.createServer(','globalThis.__unifiedServer(');
  source=source.replace(/^const timer=setInterval[^\n]+$/m,'const timer=undefined;').replace(/^for\(const signal of \['SIGINT','SIGTERM'\]\)[^\n]+$/m,'export function disposeFixture(){simulation.dispose();pool.dispose();observations.dispose();setupLobby.dispose();}');
  source+='\nexport const fixture={get world(){return game;},get simulation(){return simulation;}};\n';return{...result,source};
}});
let server;try{server=await import(serverURL);}finally{hooks.deregister();}
async function call(method,url,data){const body=data===undefined?undefined:JSON.stringify(data),req=Readable.from(body===undefined?[]:[Buffer.from(body)]);
  Object.assign(req,{url,method,headers:{host:'127.0.0.1:43821',...(body===undefined?{}:{'content-type':'application/json'})}});
  let status,text;await globalThis.__unifiedHandler(req,{writeHead(code){status=code;},end(value){text=String(value);}});return{status,body:text};
}
const checks=[],errors=[],requests=[];const pass=name=>{checks.push(name);console.log('PASS '+name);};
const assets=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://fixture').pathname),relative=name==='/'?'/index.html':name;
  for(const dir of ['web','src']){const file=path.resolve(root,dir,'.'+relative);if(file.startsWith(path.join(root,dir)+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()){
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.ttf':'font/ttf','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);return;}}
  res.writeHead(404);res.end();});
await new Promise(resolve=>assets.listen(0,'127.0.0.1',resolve));
const {chromium}=auditBrowserRuntime.load('playwright');
let browser;
try{
  assert.equal(server.fixture.world.settings.aiAlgorithm,'unified');
  for(const data of [{aiAlgorithm:'C'},{aiAlgorithm:null},{aiAlgorithm:'B',autosaveEvery:4}]){const before=E.serialize(server.fixture.world);assert((await call('POST','/api/settings',data)).status>=400);assert.equal(E.serialize(server.fixture.world),before);}
  for(const legacy of ['A','B','unified']){const before=E.serialize(server.fixture.world);assert.equal((await call('POST','/api/settings',{aiAlgorithm:legacy})).status,200);assert.equal(E.serialize(server.fixture.world),before);}
  pass('Actual desktop handler loads old A saves and accepts legacy setting requests as no-ops, with atomic validation');
  browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'reduce'}),page=await context.newPage();
  await context.addInitScript(()=>localStorage.setItem('hex.audio.music','0'));page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/**',async route=>{const req=route.request();let data;try{data=req.postData()?JSON.parse(req.postData()):undefined;}catch{}
    requests.push({route:new URL(req.url()).pathname,data});const result=await call(req.method(),new URL(req.url()).pathname+new URL(req.url()).search,data);await route.fulfill({status:result.status,contentType:'application/json',body:result.body});});
  await page.goto('http://127.0.0.1:'+assets.address().port);await page.waitForFunction(()=>window.__civ?.menuShown,null,{timeout:120000});
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:960});await page.locator('#menu-load').click();await page.locator('.save-options > summary').click();
    assert.equal(await page.locator('#save-ai-algorithm').count(),0);await page.locator('#save-auto-every').selectOption('5');
    await page.waitForFunction(()=>window.__civ.game.settings.autosaveEvery===5);
    const bounds=await page.locator('.autosave-settings').boundingBox();assert(bounds.x>=-1&&bounds.x+bounds.width<=width+1);
    await page.screenshot({path:path.join(out,'saves-'+width+'.png')});await page.locator('#close-modal').click();
    await page.locator('#menu-new').click();assert.equal(await page.locator('#setup-ai-algorithm').count(),0);
    await page.locator('#setup-count').selectOption('2');await page.locator('#setup-size').selectOption('small');await page.locator('#setup-count').selectOption('2');await page.locator('#setup-seed').fill('UNIFIED-UI-'+width);
    await page.screenshot({path:path.join(out,'setup-'+width+'.png')});
    if(width===1440){await page.locator('#close-modal').click();continue;}
    await page.locator('#create-world').click();await page.waitForFunction(()=>!window.__civ.menuShown&&window.__civ.game.seed==='UNIFIED-UI-390',null,{timeout:60000});
    assert.equal(server.fixture.world.settings.aiAlgorithm,'unified');
    assert.equal(JSON.parse(fs.readFileSync(path.join(work,'autosave.json'),'utf8')).settings.aiAlgorithm,'unified');
  }
  const creation=requests.find(req=>req.route==='/api/new');assert(creation);assert(!Object.hasOwn(creation.data,'aiAlgorithm'));
  assert.deepEqual(errors,[]);pass('Desktop/mobile setup and save pages have no algorithm selector; autosave and actual new-game creation still work');
  await context.close();await fs.promises.writeFile(path.join(out,'checks.json'),JSON.stringify({passed:true,checks,errors,productionWrites:false,requests:requests.filter(r=>r.route==='/api/new'||r.route==='/api/settings')},null,2));
}finally{await browser?.close();assets.closeAllConnections();await new Promise(resolve=>assets.close(resolve));server.disposeFixture();}
