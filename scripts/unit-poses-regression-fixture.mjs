import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {syncBuiltinESMExports,registerHooks} from 'node:module';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/unit-poses-20261019/regressions'),fixture=path.join(root,'output/city-research-20261019/save-fixture.json'),saves=path.join(root,'saves');
fs.mkdirSync(out,{recursive:true});
const filePath=f=>{try{return path.resolve(f instanceof URL?fileURLToPath(f):Buffer.isBuffer(f)?f.toString():f);}catch{return '';}};
const nativeExists=fs.existsSync;
for(const [api,names]of [[fs,['readFileSync','readFile']],[fs.promises,['readFile']]])for(const name of names){const fn=api[name];api[name]=function(file,...args){const p=filePath(file);if(p.toLowerCase()===path.join(saves,'autosave.json').toLowerCase())file=fixture;else if(p.startsWith(out+path.sep)&&!nativeExists(p))file=path.join(root,'output',path.relative(out,p));return fn.call(this,file,...args);};}
for(const [api,names]of [[fs,['writeFileSync','writeFile','appendFileSync','appendFile','unlinkSync','unlink','renameSync','rename']],[fs.promises,['writeFile','appendFile','unlink','rename']]])for(const name of names){const fn=api[name];api[name]=function(file,...args){const p=filePath(file);if(p.toLowerCase().startsWith(saves.toLowerCase()+path.sep))throw Error('Regression attempted a production save write.');const direct=path.join(root,'output');if(path.dirname(p)===direct)file=path.join(out,path.basename(p));return fn.call(this,file,...args);};}
syncBuiltinESMExports();
registerHooks({load(url,context,next){const r=next(url,context);if(r.source&&url.startsWith(pathToFileURL(path.join(root,'scripts')).href)){let s=r.source.toString();s=s.replaceAll("output/playwright/tree-interaction-20261018","output/city-research-20261019/tree-interaction").replaceAll("output/playwright/map-depth-20261016","output/city-research-20261019/map-depth");s=s.replaceAll("new URL('../output/", "new URL('../output/unit-poses-20261019/regressions/");if(url.endsWith('.mjs')&&s.includes('E.refreshVisibility(g)')){s="import {initializeGovernors as initializeFixtureGovernors} from '../src/governors.mjs';\n"+s;s=s.replaceAll('E.refreshVisibility(g);','initializeFixtureGovernors(g);E.refreshVisibility(g);');}return {...r,source:s};}return r;}});
