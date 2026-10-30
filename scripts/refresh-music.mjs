// Integrate the selected licensed music without re-encoding unrelated sound effects.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PLAYLISTS as oldPlaylists,SOUND_SETS} from '../web/audio-catalogue.js';
const root=path.resolve(import.meta.dirname,'..'),sourceRoot=path.join(root,'art-source/audio'),audioRoot=path.join(root,'web/assets/audio');
const hash=b=>createHash('sha256').update(b).digest('hex');
const album='https://opengameart.org/content/chasing-the-leviathan-adventure-world-music-album';
const albumFiles=[
 ['rachels-weave',"Rachel's Weave",'02-0x2a722-rachels_weave.ogg'],
 ['sun-cave-village','Sun Cave Village','03-0x2a723-sun_cave_village_1.ogg'],
 ['skypole-gorge','Skypole Gorge','04-0x2a724-skypole_gorge.ogg'],
 ['moon-cave','Moon Cave','05-0x2a725-moon_cave.ogg'],
 ['forgotten-shrine','Forgotten Shrine in the Forest','07-0x2a727-forgotten_shrine_in_the_forest.ogg'],
 ['city-leviathan','City of the Leviathan','08-0x2a728-city_of_the_leviathan.ogg']
];
const additions=albumFiles.map(([key,title,file])=>({key,title,artist:'John Oestmann',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:album,url:'https://opengameart.org/sites/default/files/'+file,extension:'.ogg'}));
const authorResponse=await fetch('https://incompetech.com/music/royalty-free/pieces.json');if(!authorResponse.ok)throw Error('Author catalogue unavailable');
const authorCatalogue=await authorResponse.json();
for(const [key,title] of [['eastern-thought','Eastern Thought'],['accralate','Accralate']]){
 const piece=authorCatalogue.find(p=>p.title===title);if(!piece)throw Error('Missing author metadata: '+title);
 additions.push({key,title,artist:'Kevin MacLeod',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',source:'https://incompetech.com/music/royalty-free/index.html?isrc='+piece.isrc,url:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+encodeURIComponent(piece.filename),extension:'.mp3',instruments:piece.instruments,description:piece.description});
}
const history=JSON.parse((await fs.readFile(path.join(sourceRoot,'music-sources.json'),'utf8')).replace(/^\uFEFF/,''));
const manifest=JSON.parse(await fs.readFile(path.join(audioRoot,'manifest.json'),'utf8'));
const playlists=JSON.parse(await fs.readFile(path.join(sourceRoot,'playlists.json'),'utf8'));
const records=[];
for(const track of additions){
 const original=path.join(sourceRoot,track.key+track.extension),destination=path.join(audioRoot,'music',track.key+'.ogg');
 let bytes;try{bytes=await fs.readFile(original);}catch{
  const response=await fetch(track.url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Download failed: '+track.key+' '+response.status);
  bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100000)throw Error('Unexpected audio download: '+track.key);
  await fs.writeFile(original,bytes);
 }
 await new Promise((resolve,reject)=>{
  const child=spawn('C:/ffmpeg/ffmpeg-2025-08-07-git-fa458c7243-full_build/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-y','-i',original,'-vn','-af','loudnorm=I=-22:TP=-2:LRA=9','-ar','44100','-ac','2','-c:a','libvorbis','-q:a','2',destination],{windowsHide:true});let error='';child.stderr.on('data',b=>error+=b);child.on('error',reject);child.on('close',code=>code?reject(Error(error)):resolve());
 });
 const runtime=await fs.readFile(destination);records.push({...track,kind:'music',file:'music/'+track.key+'.ogg',original:path.relative(root,original).replaceAll('\\','/'),originalSha256:hash(bytes),sha256:hash(runtime),bytes:runtime.length});
 console.log('Prepared '+track.key);
}
const tracks=[...history.filter(t=>!additions.some(a=>a.key===t.key)),...additions];
for(const ids of Object.values(playlists).flatMap(moods=>Object.values(moods)))for(const id of ids)if(!tracks.some(t=>t.key===id))throw Error('Unresolved playlist track: '+id);
await fs.writeFile(path.join(sourceRoot,'music-sources.json'),JSON.stringify(tracks,null,2)+'\n');
manifest.records=manifest.records.filter(r=>!additions.some(a=>a.key===r.key)).concat(records);manifest.date='2026-10-11';
await fs.writeFile(path.join(audioRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(root,'web/audio-catalogue.js'),'// Public recordings and cultural-style instrumentals; see assets/audio/CREDITS.md.\nexport const TRACKS='+JSON.stringify(tracks)+';\nexport const PLAYLISTS='+JSON.stringify(playlists)+';\nexport const SOUND_SETS='+JSON.stringify(SOUND_SETS)+';\n');
let credits=await fs.readFile(path.join(audioRoot,'CREDITS.md'),'utf8');
const section='## Instrumental soundtrack refresh - 2026-10-11\n\n'+additions.map(t=>`- "${t.title}" by ${t.artist}. ${t.license}. Source: ${t.source}. License: ${t.licenseUrl}. Adaptation: Ogg Vorbis, 44.1 kHz stereo, loudness normalized to -22 LUFS.`).join('\n')+'\n\nRegional associations are artistic programming choices, not historical or ethnic authenticity claims. Superseded songs and their attribution remain archived; they are no longer in the active playlists.\n\n';
if(!credits.includes('## Instrumental soundtrack refresh - 2026-10-11'))credits=credits.replace('## Sound effects',section+'## Sound effects');
await fs.writeFile(path.join(audioRoot,'CREDITS.md'),credits);
await fs.writeFile(path.join(sourceRoot,'refresh-20261011.json'),JSON.stringify({date:'2026-10-11',sourceAlbum:album,previousPlaylists:oldPlaylists,playlists,records},null,2)+'\n');
