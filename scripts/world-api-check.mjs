// Dispatch the real server handler without a listening socket or live-save access.
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {Readable} from 'node:stream';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),fixture=path.join(root,'output','world-api-fixture'),before=await readFile(path.join(root,'saves','autosave.json')),checks=[];
await mkdir(fixture,{recursive:true});await writeFile(path.join(fixture,'autosave.json'),before);
globalThis.__worldFakeServer=handler=>{globalThis.__worldHandler=handler;return {on(){},listen(){}};};
const serverUrl=pathToFileURL(path.join(root,'server.mjs')).href;
const hooks=registerHooks({load(url,context,next){const result=next(url,context);if(url!==serverUrl)return result;let source=result.source.toString().replaceAll('\r\n','\n');const old="const saveDir=path.join(ROOT,'saves')";assert(source.includes(old));source=source.replace(old,'const saveDir='+JSON.stringify(fixture));source=source.replace('http.createServer(', 'globalThis.__worldFakeServer(');source=source.replace(/^const timer=setInterval[^\n]+$/m,'const timer=undefined;');source=source.replace(/^for\(const signal of \['SIGINT','SIGTERM'\]\)[^\n]+$/m,'export function disposeFixture(){simulation.dispose();pool.dispose();}');return {...result,source};}});
const server=await import(serverUrl);hooks.deregister();
async function request(route,data){const req=Readable.from(data===undefined?[]:[Buffer.from(JSON.stringify(data))]);Object.assign(req,{url:route,method:data===undefined?'GET':'POST',headers:{host:'127.0.0.1:43821',...(data===undefined?{}:{'content-type':'application/json'})}});let status,body;await globalThis.__worldHandler(req,{writeHead(code){status=code;},end(bytes){body=String(bytes);}});return {status,body:JSON.parse(body)};}
try{
 const created=await request('/api/new',{size:'massive',seed:'ISOLATED-API-SIXTEEN',barbarians:false});assert.equal(created.status,200);
 const state=await request('/api/state');assert.equal(state.status,200);assert.equal(state.body.game.players.length,16);assert.equal(new Set(state.body.game.players.map(p=>p.leaderKey)).size,16);assert(state.body.game.players.every(p=>p.driver.file&&p.driver.status==='ready'));checks.push('The real new-game handler defaults a massive world to sixteen unique leaders and verified native driver files');
 const saved=await readFile(path.join(fixture,'autosave.json'));assert.equal(JSON.parse(saved).players.length,16);assert.equal(JSON.parse(saved).maxTurns,650);checks.push('The real handler saves the new world exclusively into its redirected fixture directory');
 const rejected=await request('/api/new',{size:'massive',players:2,leaders:['qin','qin']});assert.equal(rejected.status,400);assert((await readFile(path.join(fixture,'autosave.json'))).equals(saved));checks.push('An invalid duplicate leader request fails without replacing the fixture world or save');
 assert((await readFile(path.join(root,'saves','autosave.json'))).equals(before));checks.push('The active autosave remains byte-identical; no actual game server or desktop was launched');
 await writeFile(path.join(root,'output','world-api-checks.json'),JSON.stringify({passed:true,checks,listeningSocket:false,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');for(const name of checks)console.log('PASS '+name);
}finally{server.disposeFixture();delete globalThis.__worldFakeServer;delete globalThis.__worldHandler;}
