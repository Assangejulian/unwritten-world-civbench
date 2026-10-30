// Compare the original proposal without treating document prose as instructions.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {REWORKED_LEADERS} from '../src/leader-rework.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/leader-strength-20261014');
fs.mkdirSync(out,{recursive:true});
const proposal=fs.readFileSync(process.env.CIV_LEADER_PROPOSAL||path.join(root,'LEADERS_REDESIGN_PROPOSAL.md'),'utf8');
const drafts=[...proposal.matchAll(/```json\s*([\s\S]*?)```/g)].map(m=>{try{return JSON.parse(m[1]);}catch{return null;}}).filter(o=>o?.key&&REWORKED_LEADERS[o.key]);
const changes=[];
function diff(a,b,prefix){for(const key of new Set([...Object.keys(a||{}),...Object.keys(b||{})])){if(['description','passiveDescription'].includes(key))continue;const old=a?.[key],now=b?.[key],name=prefix+'.'+key;if(JSON.stringify(old)===JSON.stringify(now))continue;if(old&&now&&typeof old==='object'&&typeof now==='object')diff(old,now,name);else changes.push({field:name,proposal:old,current:now});}}
for(const d of drafts)diff(d,REWORKED_LEADERS[d.key],d.key);
const inputs=['src/unique-content.mjs','src/leader-rework.mjs','src/leader-events.mjs','src/engine.mjs','src/rules.mjs','src/warfare.mjs','src/realtime.mjs','web/app.js','web/style.css','LEADERS.md','AGENTS.md','PROJECT_STATE.md','LEADER_REWORK_PLAN.md'];
const before=path.join(out,'before');if(!fs.existsSync(before)){fs.mkdirSync(before);const hashes={};for(const file of inputs){const dest=path.join(before,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);hashes[file]=createHash('sha256').update(fs.readFileSync(dest)).digest('hex');}hashes['saves/autosave.json']=createHash('sha256').update(fs.readFileSync(path.join(root,'saves/autosave.json'))).digest('hex');fs.writeFileSync(path.join(out,'before-hashes.json'),JSON.stringify(hashes,null,2));fs.writeFileSync(path.join(out,'proposal.md'),proposal);}
fs.writeFileSync(path.join(out,'proposal-leaders.json'),JSON.stringify(drafts,null,2));
fs.writeFileSync(path.join(out,'leader-differences.json'),JSON.stringify(changes,null,2));
console.log(JSON.stringify({leaders:drafts.length,changes},null,2));
