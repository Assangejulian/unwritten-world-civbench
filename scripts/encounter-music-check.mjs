import auditBrowserRuntime from './browser-runtime.cjs';
// Exercise the actual streaming audio controller in Chromium without the desktop game.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {TRACKS,PLAYLISTS} from '../web/audio-catalogue.js';
const require=createRequire(import.meta.url),{chromium}=auditBrowserRuntime.load('playwright');
const root=path.resolve(import.meta.dirname,'..'),hash=b=>createHash('sha256').update(b).digest('hex'),checks=[],errors=[],requests=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'web/assets/audio/manifest.json')));
const refreshed=JSON.parse(fs.readFileSync(path.join(root,'art-source/audio/refresh-20261011.json')));
for(const r of refreshed.records){
 const runtime=fs.readFileSync(path.join(root,'web/assets/audio',r.file));assert.equal(hash(runtime),r.sha256);assert.equal(runtime.length,r.bytes);
 assert.equal(hash(fs.readFileSync(path.join(root,r.original))),r.originalSha256);
 const probe=spawnSync('C:/ffmpeg/ffmpeg-2025-08-07-git-fa458c7243-full_build/bin/ffprobe.exe',['-v','error','-show_entries','stream=sample_rate,channels:format=duration','-of','json',path.join(root,'web/assets/audio',r.file)],{encoding:'utf8',windowsHide:true});assert.equal(probe.status,0,probe.stderr);
 const data=JSON.parse(probe.stdout);assert.equal(data.streams[0].sample_rate,'44100');assert.equal(data.streams[0].channels,2);assert(Number(data.format.duration)>30);
 assert(manifest.records.some(item=>item.key===r.key&&item.sha256===r.sha256));
}
assert.equal(refreshed.records.length,8);const credits=fs.readFileSync(path.join(root,'web/assets/audio/CREDITS.md'),'utf8');
for(const r of refreshed.records)assert(credits.includes(TRACKS.find(t=>t.key===r.key).title));
for(const moods of Object.values(PLAYLISTS))for(const ids of Object.values(moods)){assert(ids.length>=3);for(const id of ids){assert(TRACKS.some(t=>t.key===id));assert(fs.existsSync(path.join(root,'web/assets/audio/music',id+'.ogg')));assert(!['kalinka','arirang','eastminster','ancient-rite','intrepid','anglo-zulu','heroic-age'].includes(id));}}
pass('Eight licensed replacements have valid stereo Vorbis, source/runtime hashes, attribution and complete regional playlists');
const files=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x');if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<button id="unlock">Play</button><script type="module">import {GameAudio,encounteredMusicPlayers} from "/audio.js";window.audio=new GameAudio();audio.preferences.effects=0;window.pool=encounteredMusicPlayers;document.querySelector("button").onclick=()=>audio.unlock();</script>');}
 const base=u.pathname==='/nations.mjs'?'src':'web',file=path.resolve(root,base,'.'+decodeURIComponent(u.pathname));
 if(!file.startsWith(path.join(root,base)+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const bytes=fs.readFileSync(file),type=file.endsWith('.ogg')?'audio/ogg':'text/javascript';
 const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
 if(range){const from=+range[1],to=range[2]?Math.min(+range[2],bytes.length-1):bytes.length-1;res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${from}-${to}/${bytes.length}`,'Content-Length':to-from+1});res.end(bytes.subarray(from,to+1));}
 else {res.writeHead(200,{'Content-Type':type,'Content-Length':bytes.length,'Accept-Ranges':'bytes'});res.end(bytes);}
});
await new Promise(r=>files.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:auditBrowserRuntime.chromiumExecutable()});
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/assets/audio/music/'))requests.push(r.url());});
 await page.goto('http://127.0.0.1:'+files.address().port);await page.waitForFunction(()=>window.audio);
 await page.evaluate(()=>{
  window.g={id:'music-test',players:[{id:0,leaderKey:'sejong',short:'朝鲜',alive:true,met:[],relations:{}},{id:1,leaderKey:'taizong',short:'唐',alive:true},{id:2,leaderKey:'cleopatra',short:'埃及',alive:true},{id:3,leaderKey:'caesar',short:'罗马',alive:false}],cities:[],events:[],map:{tiles:[]},visuals:{view:0,epoch:1,sequence:0}};
  window.session={world:'epoch-a',running:true};audio.sync(g,session,0,false,null,0);
 });
 assert.deepEqual(await page.evaluate(()=>pool(g,0).map(p=>p.id)),[0]);assert.deepEqual(await page.evaluate(()=>pool(g,-1).map(p=>p.id)),[0,1,2]);assert.deepEqual(await page.evaluate(()=>pool(g,99).map(p=>p.id)),[]);
 await page.locator('#unlock').click();await page.waitForFunction(()=>audio.track?.nationId===0&&!audio.music.paused&&audio.music.readyState>=2);
 pass('Actual initial playback uses only the owner; observer excludes eliminated nations and invalid views have no pool');
 const initial=await page.evaluate(()=>audio.track.key);
 await page.evaluate(()=>{g.players[0].met=[1];audio.sync(g,session,0,false,null,0);});await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>audio.track.key),initial);
 // Interrupt a pending fade before its media switch. First-contact priority must survive.
 await page.evaluate(()=>audio.nextTrack());await page.waitForTimeout(220);await page.evaluate(()=>audio.setPreferences({muted:true}));assert.deepEqual(await page.evaluate(()=>audio.contactQueue),[1]);
 await page.evaluate(()=>audio.setPreferences({muted:false}));await page.waitForFunction(()=>!audio.music.paused);assert.equal(await page.evaluate(()=>audio.track.key),initial);
 await page.evaluate(()=>{audio.music.currentTime=audio.music.duration-.07;});
 await page.waitForFunction(()=>audio.track?.nationId===1&&!audio.music.paused&&audio.music.readyState>=2);
 pass('First contact leaves the song intact, survives an interrupted fade and wins priority on real media completion');
 const selection=await page.evaluate(()=>{
  audio.transition++;clearTimeout(audio.switchTimer);clearInterval(audio.fadeTimer);audio.music.pause();g.players[0].met=[1,2,1,3];audio.sync(g,session,0,false,null,0);
  const out=[],draw=()=>{const t=audio.chooseTrack();out.push({id:t.nationId,key:t.key});audio.track=t;};draw();while(audio.nationBag.length)draw();const boundary=out.length;for(let i=0;i<150;i++)draw();return {draws:out,boundary};
 });
 assert(selection.draws.every(t=>[0,1,2].includes(t.id)));assert.equal(selection.draws[0].id,2);
 const steady=selection.draws.slice(selection.boundary);for(const id of [0,1,2])assert.equal(steady.filter(t=>t.id===id).length,50);
 for(let i=0;i<steady.length;i+=3)assert.equal(new Set(steady.slice(i,i+3).map(t=>t.id)).size,3);
 for(let i=1;i<selection.draws.length;i++){assert.notEqual(selection.draws[i].key,selection.draws[i-1].key);assert.notEqual(selection.draws[i].id,selection.draws[i-1].id);}
 pass('Civilization-level shuffle is fair for 150 steady draws, avoids adjacent repeats and excludes unseen or eliminated countries');
 await page.evaluate(()=>{session.world='epoch-b';audio.sync(g,session,0,false,null,0);});await page.waitForFunction(()=>audio.track&&!audio.music.paused&&audio.music.readyState>=2);
 const beforeMute=await page.evaluate(()=>({key:audio.track.key,time:audio.music.currentTime,view:audio.view}));
 await page.evaluate(()=>audio.setPreferences({muted:true}));assert(await page.evaluate(()=>audio.music.paused));await page.evaluate(()=>audio.setPreferences({muted:false}));await page.waitForFunction(()=>!audio.music.paused);assert.equal(await page.evaluate(()=>audio.track.key),beforeMute.key);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert(await page.evaluate(()=>audio.music.paused));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>!audio.music.paused);assert.equal(await page.evaluate(()=>audio.track.key),beforeMute.key);
 pass('Mute and hidden-tab suspension resume the same stream and preserve the explicit music perspective');
 const failed=await page.evaluate(()=>{const key=audio.track.key;audio.music.dispatchEvent(new Event('error'));return key;});await page.waitForFunction(key=>audio.track?.key!==key&&!audio.music.paused,failed);assert(await page.evaluate(key=>audio.failed.has(key),failed));
 pass('Unavailable songs are skipped without stalling the remaining civilization playlist');
 await page.evaluate(()=>{g.players[0].met=[];session.world='epoch-c';audio.sync(g,session,0,false,null,0);});assert.equal(await page.evaluate(()=>audio.track),null);await page.waitForFunction(()=>audio.track?.nationId===0&&!audio.music.paused);
 assert.deepEqual(await page.evaluate(()=>audio.contactQueue),[]);assert.equal(await page.evaluate(()=>audio.failed.size),0);
 await page.evaluate(()=>{audio.sync(g,session,0,false,null,-1);audio.setPreferences({music:.15});});assert.equal(await page.evaluate(()=>audio.view),-1);assert.deepEqual(await page.evaluate(()=>audio.nations.map(p=>p.id)),[0,1,2]);
 pass('Same-id world replacement clears contacts, shuffle and errors; preference changes retain observer scope');
 assert.equal(await page.evaluate(()=>audio.buffers.size),0);assert.equal(await page.evaluate(()=>audio.pending.size),0);assert.equal(await page.evaluate(()=>audio.context),null);assert.equal(errors.length,0,errors.join('\n'));assert(requests.length>=3);
 pass('Real Vorbis streaming uses one media element and does not decode music into the bounded effect cache');
}finally{await browser.close();await new Promise(r=>files.close(r));}
const sources={};for(const f of ['web/audio.js','web/audio-catalogue.js','web/app.js','art-source/audio/playlists.json','scripts/encounter-music-check.mjs'])sources[f]=hash(fs.readFileSync(path.join(root,f)));
fs.writeFileSync(path.join(root,'output/encounter-music-checks.json'),JSON.stringify({passed:true,checks,errors,sources,newTracks:8,streamingRequests:requests.length,activeSaveWritten:false,gameLaunched:false},null,2)+'\n');
