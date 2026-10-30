// Explicitly authorized identity-only migration. No simulation step is run.
import assert from 'node:assert/strict';
import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import net from 'node:net';
import {DEFAULT_LEADER_KEYS,leaderFor} from '../src/rules.mjs';
import {historicalIdentity} from '../src/nations.mjs';
import {restore} from '../src/engine.mjs';
export function migrateIdentities(original){
 const result=structuredClone(original);
 for(const p of result.players){p.leaderKey=DEFAULT_LEADER_KEYS[p.id];p.leader=leaderFor(p).name;Object.assign(p,historicalIdentity(p.leaderKey,p.id));}
 const allowed=['leaderKey','leader','name','short','capitalName','cityNames','trait'];
 const redact=world=>({...world,players:world.players.map(p=>Object.fromEntries(Object.entries(p).filter(([key])=>!allowed.includes(key))))});
 assert.deepEqual(redact(result),redact(original),'Migration must preserve every non-identity field');
 // Validate a separate clone; never serialize restore() visibility repairs into this file.
 const validated=restore(JSON.stringify(result));assert.equal(validated.turn,original.turn);assert.equal(validated.realtime.time,original.realtime.time);
 return result;
}
const hash=b=>createHash('sha256').update(b).digest('hex');
async function listening(){return new Promise(resolve=>{const socket=net.connect({host:'127.0.0.1',port:43821});socket.setTimeout(400);socket.once('connect',()=>{socket.destroy();resolve(true);});socket.once('error',()=>resolve(false));socket.once('timeout',()=>{socket.destroy();resolve(false);});});}
async function main(){
 const active=new URL('../saves/autosave.json',import.meta.url),before=await readFile(active),raw=JSON.parse(before),migrated=migrateIdentities(raw),after=Buffer.from(JSON.stringify(migrated));
 const report={authorizedBy:'User explicitly requested historical leaders/countries and new skills in the old save, while preserving map and progress',turn:raw.turn,clock:raw.realtime.time,tiles:raw.map.tiles.length,cities:raw.cities.length,units:raw.units.length,beforeSha256:hash(before),afterSha256:hash(after),players:migrated.players.map(p=>({id:p.id,name:p.name,leader:p.leader,key:p.leaderKey})),unchangedNonIdentityFields:true,applied:false};
 if(process.argv.includes('--apply')){
  if(await listening())throw new Error('A game is listening on port 43821. Do not migrate a live world.');
  const backup=new URL('../saves/before-portraits-audio-20261005.json',import.meta.url);
  assert((await readFile(backup)).equals(before),'The verified backup must match the current active save');
  const named=new URL('../saves/save-historical-leaders-20261005.json',import.meta.url),temporary=new URL('../saves/autosave.historical-migration.pending',import.meta.url);
  await writeFile(named,after,{flag:'wx'});
  try{await writeFile(temporary,after,{flag:'wx'});assert((await readFile(active)).equals(before),'The active save advanced during migration');if(await listening())throw new Error('The game opened during migration');await rename(temporary,active);}finally{await unlink(temporary).catch(()=>{});}
  assert((await readFile(active)).equals(after));assert((await readFile(backup)).equals(before));report.applied=true;
 }
 await writeFile(new URL('../output/save-identity-migration.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/migrate-save-identity.mjs'))main().catch(error=>{console.error(error);process.exitCode=1;});
