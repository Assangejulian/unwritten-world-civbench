import auditBrowserRuntime from './browser-runtime.cjs';
// Pan reuse of the parchment fog sheet, and no automatic camera jump between unit tasks.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PlayerTaskDock,shouldMoveCameraToTask} from '../web/player-tasks.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const out=join(root,'output','pan-task-focus-20261022');
await mkdir(out,{recursive:true});
const checks=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};

const unitA={id:'unit:1',kind:'unit'},unitB={id:'unit:2',kind:'unit'},capture={id:'capture:9',kind:'capture'},production={id:'production:3',kind:'production'};
assert.equal(shouldMoveCameraToTask(null,unitA,false),true);
assert.equal(shouldMoveCameraToTask(unitA,unitB,false),false);
assert.equal(shouldMoveCameraToTask(unitA,unitA,false),false);
assert.equal(shouldMoveCameraToTask(unitA,unitB,true),true);
assert.equal(shouldMoveCameraToTask(unitA,capture,false),true);
assert.equal(shouldMoveCameraToTask(unitA,production,false),true);
assert.equal(shouldMoveCameraToTask(capture,unitB,false),false);
pass('Automatic unit tasks stay put after the first one; manual cycles and city tasks still focus');

function element(){return {hidden:false,className:'',id:'',innerHTML:'',classList:{toggle(){}},querySelector(){return null;},querySelectorAll(){return [];}};}
globalThis.document={getElementById:()=>element(),querySelector:()=>null,createElement:()=>element()};
const focused=[];
const state={game:{id:'g1',turn:4,units:[],players:[{manual:true}]},session:{role:'player',world:'w',revision:1,mode:'turns',busy:false,canEndTurn:true},view:0,selection:null,menuShown:false};
const dock=new PlayerTaskDock(element(),{state:()=>state,focusTask:task=>focused.push(task.id)});
const show=tasks=>{dock.data={active:true,tasks};dock.index=0;dock.focusCurrent();};
show([{id:'unit:1',kind:'unit',tile:1,title:'Scout'}]);
assert.deepEqual(focused,['unit:1']);
show([{id:'unit:2',kind:'unit',tile:2,title:'Warrior'}]);
assert.deepEqual(focused,['unit:1']);
state.game={...state.game,turn:5};
dock.focusCurrent();
assert.deepEqual(focused,['unit:1']);
dock.focusCurrent(true);
assert.deepEqual(focused,['unit:1','unit:2']);
show([{id:'capture:9',kind:'capture',tile:4,title:'Keep'}]);
assert.deepEqual(focused,['unit:1','unit:2','capture:9']);
show([{id:'unit:3',kind:'unit',tile:5,title:'Archer'}]);
assert.deepEqual(focused,['unit:1','unit:2','capture:9']);
dock.focusStamp='stale';dock.focusTask={id:'unit:9',kind:'unit'};dock.identity='other';
state.session={...state.session,role:'observer'};
dock.sync();
assert.equal(dock.focusTask,null);
assert.equal(dock.focusStamp,'');
pass('The task dock records the next unit without selecting it, and a view change arms the first focus again');

const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html'};
const server=createServer(async (req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><title>fog</title>');return;}
 const file=join(root,'web',decodeURIComponent(url.pathname));
 try{const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(body);}
 catch{res.writeHead(404);res.end('missing');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const require=createRequire(import.meta.url);
const {chromium}=auditBrowserRuntime.load('playwright');
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable(),args:['--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:900,height:700}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+port+'/');
 const fog=await page.evaluate(async()=>{
  const {drawChartFog}=await import('/chart-fog.js');
  const R=35,SQ=Math.sqrt(3),SY=.6,tiles=[];
  for(let r=0;r<26;r++)for(let q=0;q<32;q++){const id=tiles.length,dist=Math.hypot(q-16,r-13);tiles.push({id,q,r,hidden:dist>=5,visible:dist<3});}
  const pos=t=>({x:R*SQ*(t.q+t.r/2)+75,y:R*1.5*t.r+90});
  const seen=[];
  const renderer={game:{id:'fog-game',map:{tiles}},width:800,height:500,zoom:1,cam:pos(tiles.find(t=>t.q===16&&t.r===13)),terrainRevision:1,renderOffset:12,visibleCopies:[0,1],cameraBounds:{period:100}};
  renderer.screen=function(t){const w=pos(t);return {x:(w.x-this.cam.x)*this.zoom+this.width/2,y:(w.y-this.cam.y)*this.zoom*SY+this.height/2};};
  renderer.viewportTiles=function(){seen.push({width:this.width,height:this.height,offset:this.renderOffset});return this.game.map.tiles;};
  renderer.fillTile=function(c,id){const t=this.game.map.tiles[id],p=this.screen(t);c.save();c.translate(p.x,p.y);c.scale(this.zoom,this.zoom*SY);c.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;(i?c.lineTo:c.moveTo).call(c,Math.cos(a)*R,Math.sin(a)*R);}c.closePath();c.fillStyle='#fff';c.fill();c.restore();};
  const canvas=document.createElement('canvas');canvas.width=renderer.width;canvas.height=renderer.height;const ctx=canvas.getContext('2d');
  const draw=()=>drawChartFog(renderer,ctx);
  const alphaAt=(x,y)=>{const d=renderer.chartFog.frame.getContext('2d').getImageData(x,y,1,1).data;return d[3];};
  draw();
  const first={builds:renderer.chartFog.builds,edge:renderer.chartFog.edgePixels,width:renderer.width,height:renderer.height,offset:renderer.renderOffset,seen:seen.slice(),center:alphaAt(200,125),corner:alphaAt(4,4)};
  const seenCount=seen.length;
  const reuseStart=performance.now();for(let i=0;i<8;i++){renderer.cam.x+=12;renderer.cam.y+=8;draw();}const reuseMs=performance.now()-reuseStart;
  const afterPan={builds:renderer.chartFog.builds,seen:seen.length,width:renderer.width,offset:renderer.renderOffset};
  renderer.zoom=1.05;draw();const mildZoom=renderer.chartFog.builds;
  renderer.zoom=1.2;draw();const hardZoom=renderer.chartFog.builds;
  renderer.cam.x+=4000;draw();const farPan=renderer.chartFog.builds;
  const rebuilt=renderer.game.map.tiles.map(t=>({...t}));rebuilt.find(t=>t.q===16&&t.r===13).hidden=true;renderer.game.map.tiles=rebuilt;draw();const revealed=renderer.chartFog.builds;
  const rebuildStart=performance.now();for(let i=0;i<4;i++){renderer.terrainRevision++;draw();}const rebuildMs=performance.now()-rebuildStart;
  return {first,afterPan,mildZoom,hardZoom,farPan,revealed,seenCount,reuseMs,rebuildMs};
 });
 assert.equal(fog.first.builds,1);
 assert.ok(fog.first.edge>100, 'edge '+fog.first.edge);
 assert.equal(fog.first.width,800);
 assert.equal(fog.first.height,500);
 assert.equal(fog.first.offset,12);
 assert.ok(fog.first.seen.every(row=>row.width>800&&row.height>500));
 assert.deepEqual(fog.first.seen.map(row=>row.offset),[0,100]);
 assert.ok(fog.first.center<40, 'center alpha '+fog.first.center);
 assert.ok(fog.first.corner>200, 'corner alpha '+fog.first.corner);
 assert.equal(fog.afterPan.builds,1);
 assert.equal(fog.afterPan.seen,fog.seenCount);
 assert.equal(fog.afterPan.width,800);
 assert.equal(fog.afterPan.offset,12);
 assert.equal(fog.mildZoom,1);
 assert.equal(fog.hardZoom,2);
 assert.equal(fog.farPan,3);
 assert.equal(fog.revealed,4);
 assert.ok(fog.reuseMs*2<fog.rebuildMs, 'reuse '+fog.reuseMs+' rebuild '+fog.rebuildMs);
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'fog-metrics.json'),JSON.stringify(fog,null,2));
 pass('A padded fog sheet is reused for small pans and mild zoom, then rebuilt for a large move, a zoom step, or a new visibility array');
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
await writeFile(join(out,'checks.json'),JSON.stringify({passed:true,checks,at:new Date().toISOString()},null,2));
console.log('ALL PASS');
