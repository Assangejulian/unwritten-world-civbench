// Exercise the actual server without listening sockets or live-save access.
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {Readable} from 'node:stream';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
// Retain the six independent findings and Universe's five hardening checks against a frozen input.
const root=path.resolve(import.meta.dirname,'..');
const fixture=path.join(root,'output','state-cache-fixture-'+Date.now());
const sources=Object.fromEntries(await Promise.all(['server.mjs','src/state-transport.mjs','src/engine.mjs','scripts/state-cache-check.mjs'].map(async file=>[file,createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')])));
await mkdir(fixture,{recursive:true});
await writeFile(path.join(fixture,'autosave.json'),await readFile(path.join(root,'output/world-systems-save-input.json')));
globalThis.__reviewNow=0;
globalThis.__reviewFakeServer=handler=>{globalThis.__reviewHandler=handler;return {on(){},listen(){}};};
const serverUrl=pathToFileURL(path.join(root,'server.mjs')).href;
const hooks=registerHooks({load(url,context,next){
 const result=next(url,context);if(url!==serverUrl)return result;
 let source=result.source.toString().replaceAll('\r\n','\n');
 for(const anchor of ["const saveDir=path.join(ROOT,'saves')",'http.createServer(','const now=performance.now(),hasSince='])assert(source.includes(anchor),'Missing isolation hook: '+anchor);
 assert(/^const timer=setInterval[^\n]+$/m.test(source),'Missing timer isolation hook');
 assert(/^for\(const signal of \['SIGINT','SIGTERM'\]\)[^\n]+$/m.test(source),'Missing disposal isolation hook');
 source=source.replace("const saveDir=path.join(ROOT,'saves')",'const saveDir='+JSON.stringify(fixture));
 source=source.replace('http.createServer(', 'globalThis.__reviewFakeServer(');
 source=source.replace('const now=performance.now(),hasSince=', 'const now=globalThis.__reviewNow,hasSince=');
 source=source.replace(/^const timer=setInterval[^\n]+$/m,'const timer=undefined;');
 source=source.replace(/^for\(const signal of \['SIGINT','SIGTERM'\]\)[^\n]+$/m,'export function disposeFixture(){simulation.dispose();pool.dispose();observations.dispose();}');
 source+='\nexport const reviewAccess={get world(){return game;},get revision(){return revision;},changed,transport,snapshotViews,replaceGame};\n';
 return {...result,source};
}});
const server=await import(serverUrl);hooks.deregister();
async function request(route,data){
 const req=Readable.from(data===undefined?[]:[Buffer.from(JSON.stringify(data))]);
 Object.assign(req,{url:route,method:data===undefined?'GET':'POST',headers:{host:'127.0.0.1:43821',...(data===undefined?{}:{'content-type':'application/json'})}});
 let status,body;await globalThis.__reviewHandler(req,{writeHead(code){status=code;},end(bytes){body=String(bytes);}});
 return {status,body:JSON.parse(body)};
}
const checks=[],findings=[];
function check(name,fn){try{fn();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});findings.push({name,error:error.message});}}
try{
 const A=server.reviewAccess,g=A.world;
 const initial=await request('/api/state?view=-1');
 assert.equal(initial.status,200);
 const id=g.id,revision=initial.body.session.revision,oldGold=initial.body.game.players[0].gold;
 g.players[0].gold+=123;A.changed();globalThis.__reviewNow=50;
 const paced=await request('/api/state?view=-1&game='+id+'&since='+revision);
 check('Within 200 ms, unchanged response retains the last built revision',()=>{assert.equal(paced.body.unchanged,true);assert.equal(paced.body.session.revision,revision);});
 globalThis.__reviewNow=201;
 const refreshed=await request('/api/state?view=-1&game='+id+'&since='+revision);
 check('After 200 ms, delta has the exact base revision and current gold',()=>{assert.equal(refreshed.body.delta.baseRevision,revision);assert.equal(refreshed.body.delta.fields.players[0].gold,oldGold+123);assert.equal(refreshed.body.session.revision,A.revision);});
 const own=await request('/api/state?view=0');
 check('Player perspective does not publish foreign treasury or terrain memories',()=>{assert(!('gold' in own.body.game.players[1]));assert(!('visible' in own.body.game.players[1]));assert(!('knownTiles' in own.body.game.players[1]));});
 const originalView=await request('/api/state?view=-1');
 const changedSave=JSON.parse(await request('/api/save').then(r=>JSON.stringify(r.body)));
 changedSave.players[0].gold+=456;
 globalThis.__reviewNow=210;
 const loaded=await request('/api/load',{save:changedSave});assert.equal(loaded.status,200,JSON.stringify(loaded));
 const forced=await request('/api/state?view=-1');
 check('Force refresh after loading the same game id serves loaded contents',()=>{assert.equal(forced.body.game.players[0].gold,oldGold+123+456);assert.equal(forced.body.session.revision,A.revision);});
 // A supported transport history clear must not relabel new contents as an old revision.
 const stable=await request('/api/state?view=-1');
 const stableRevision=stable.body.session.revision,stableGold=stable.body.game.players[0].gold;
 A.world.players[0].gold+=789;A.changed();globalThis.__reviewNow=220;
 A.transport.clear();
 const rebuilt=await request('/api/state?view=-1&game='+id+'&since='+(stableRevision-1));
 check('History reset never tags new contents with a previously built revision',()=>{if(rebuilt.body.session.revision===stableRevision)assert.equal(rebuilt.body.game.players[0].gold,stableGold);});
 // New game ids isolate detail memos and do not accumulate every previous world.
 const countBefore=A.snapshotViews.size;
 for(let i=0;i<8;i++){
   const text=JSON.parse(JSON.stringify(changedSave));text.id=id+'-review-'+i;
   const result=await request('/api/load',{save:text});assert.equal(result.status,200);
   await request('/api/state?view=-1');
 }
 check('Obsolete view caches are released when replacing worlds',()=>{assert(A.snapshotViews.size<=countBefore);assert([...A.snapshotViews.values()].every(entry=>entry.game===A.world.id));});
 // HARDENING B2: transport history reset inside the pacing window must force the live revision.
 globalThis.__reviewNow=300;
 const base2=await request('/api/state?view=-1');
 const base2Rev=base2.body.session.revision;
 A.world.players[0].gold+=11;A.changed();globalThis.__reviewNow=310;A.transport.clear();
 const afterClear=await request('/api/state?view=-1&game='+A.world.id+'&since='+(base2Rev-1));
 check('B2: after transport.clear() within 200 ms, response carries the live revision and live gold',()=>{assert.equal(afterClear.body.session.revision,A.revision);assert.notEqual(afterClear.body.session.revision,base2Rev);assert.equal(afterClear.body.game.players[0].gold,A.world.players[0].gold);});
 globalThis.__reviewNow=400;
 const base3=await request('/api/state?view=-1');
 const base3Rev=base3.body.session.revision;
 A.world.players[0].gold+=13;A.changed();globalThis.__reviewNow=410;A.transport.clear();
 const sameBase=await request('/api/state?view=-1&game='+A.world.id+'&since='+base3Rev);
 check('B2: a paced revision no longer held by transport is never reused (not even as unchanged)',()=>{assert.notEqual(sameBase.body.unchanged,true);assert.equal(sameBase.body.session.revision,A.revision);assert.equal(sameBase.body.game.players[0].gold,A.world.players[0].gold);});
 globalThis.__reviewNow=420;
 const pacedAgain=await request('/api/state?view=-1&game='+A.world.id+'&since='+A.revision);
 A.world.players[0].gold+=1;A.changed();globalThis.__reviewNow=430;
 const pacedKept=await request('/api/state?view=-1&game='+A.world.id+'&since='+(A.revision-1));
 check('B2: ordinary 200 ms pacing still holds once history is consistent',()=>{assert.equal(pacedAgain.body.unchanged,true);assert.equal(pacedKept.body.unchanged,true);assert.equal(pacedKept.body.session.revision,A.revision-1);});
 // A bounded history may evict a revision without changing its generation.
 globalThis.__reviewNow=500;
 const evictionBase=await request('/api/state?view=-1');
 const evictionRevision=evictionBase.body.session.revision,generation=A.transport.generation;
 for(let i=1;i<=4;i++)A.transport.response(A.world.id,evictionRevision-100-i,-1,-1000,'',()=>evictionBase.body.game);
 assert.equal(A.transport.generation,generation);
 assert.equal(A.transport.has(A.world.id,-1,evictionRevision),false,'Fixture must evict the paced revision');
 A.world.players[0].gold+=17;A.changed();globalThis.__reviewNow=510;
 const afterEviction=await request('/api/state?view=-1&game='+A.world.id+'&since='+evictionRevision);
 check('History eviction without clear never reuses an absent paced revision',()=>{assert.notEqual(afterEviction.body.unchanged,true);assert.equal(afterEviction.body.session.revision,A.revision);assert.equal(afterEviction.body.game.players[0].gold,A.world.players[0].gold);});
 // HARDENING B1: replaceGame clears transport history and every perspective cache in one path.
 await request('/api/state?view=0');await request('/api/state?view=1');await request('/api/state?view=-1');
 const other=JSON.parse(JSON.stringify(changedSave));other.id=A.world.id+'-hardening';
 const swapped=await request('/api/load',{save:other});assert.equal(swapped.status,200);
 check('B1: replaceGame (new world) empties all snapshotViews and transport history at once',()=>{assert.equal(A.snapshotViews.size,0);assert.equal(A.transport.views.size,0);});
 await request('/api/state?view=0');
 const same=JSON.parse(JSON.stringify(other));
 const sameLoad=await request('/api/load',{save:same});assert.equal(sameLoad.status,200);
 check('B1: same-id load uses the same cleanup path',()=>{assert.equal(A.snapshotViews.size,0);assert.equal(A.transport.views.size,0);});
}finally{server.disposeFixture();delete globalThis.__reviewNow;delete globalThis.__reviewFakeServer;delete globalThis.__reviewHandler;}
await writeFile(path.join(root,'output/state-cache-checks.json'),JSON.stringify({passed:findings.length===0,checks,findings,sources,fixture,activeSaveWritten:false,gameLaunched:false,listeningSocket:false},null,2)+'\n');
for(const item of checks)console.log(item.passed?'PASS':'FAIL',item.name,item.error??'');
process.exitCode=findings.length?1:0;
