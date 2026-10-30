import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),baseline=path.resolve(process.env.P2_BASELINE||path.join(root,'output/p23-integration-20261011/baseline'));
const hash=v=>createHash('sha256').update(v).digest('hex');
const [A,B]=await Promise.all([baseline,root].map(r=>import(pathToFileURL(path.join(r,'src/engine.mjs')).href)));
const frozen=await readFile(path.join(root,'output/p2-fixtures/heavy-turn306.json'),'utf8');
const checks=[],records=[];
for(const name of (await readdir(path.join(baseline,'src'))).filter(n=>n.endsWith('.mjs'))){assert.equal(hash(await readFile(path.join(root,'src',name))),hash(await readFile(path.join(baseline,'src',name))),name+' must remain unchanged');}
checks.push('All authoritative source modules remain byte-identical to the retained pre-P2 baseline');
for(let view=0;view<A.restore(frozen).players.length;view++){
  const a=A.restore(frozen),b=B.restore(frozen);
  const oa=JSON.stringify(A.observation(a,a.players[view])),ob=JSON.stringify(B.observation(b,b.players[view]));
  assert.equal(ob,oa,'Native observation and legal actions changed for player '+view);
  const sa=JSON.stringify(A.snapshot(a,view,{manualOptionsOnly:true})),sb=JSON.stringify(B.snapshot(b,view,{manualOptionsOnly:true}));
  assert.equal(sb,sa,'Player snapshot changed for view '+view);
  records.push({view,observationHash:hash(oa),snapshotHash:hash(sa)});
}
const a=A.restore(frozen),b=B.restore(frozen);assert.equal(JSON.stringify(B.snapshot(b,-1,{manualOptionsOnly:true})),JSON.stringify(A.snapshot(a,-1,{manualOptionsOnly:true})));
checks.push('All twelve actual native observations/legal-action lists and player snapshots plus observer snapshot remain byte-identical');
const result={passed:true,checks,records,fixtureHash:hash(frozen),activeSaveWritten:false,gameLaunched:false};
await writeFile(path.join(root,'output/p2-parity-checks.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
