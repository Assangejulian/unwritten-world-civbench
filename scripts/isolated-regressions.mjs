import {registerHooks,syncBuiltinESMExports} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';

// A running user game may autosave independently. Redirect legacy test reads to a frozen fixture.
const root=path.resolve(import.meta.dirname,'..'),fixture=pathToFileURL(path.join(root,'output/modernization-save-input.json')).href,worldFixture=pathToFileURL(path.join(root,'output/world-systems-save-input.json')).href;
// Cover sync/async reads, URL quoting variants and path.join calls alike.
const livePath=path.join(root,'saves/autosave.json').toLowerCase(),frozenPath=fileURLToPath(fixture);
const isLive=file=>{try{return path.resolve(file instanceof URL?fileURLToPath(file):Buffer.isBuffer(file)?file.toString():file).toLowerCase()===livePath;}catch{return false;}};
let redirectedReads=0,blockedWrites=0;
for(const [api,methods]of [[fs,['readFileSync','readFile']],[fs.promises,['readFile']]])for(const method of methods){const original=api[method];api[method]=function(file,...args){if(isLive(file)){redirectedReads++;file=frozenPath;}return original.call(this,file,...args);};}
for(const [api,methods]of [[fs,['writeFileSync','writeFile','appendFileSync','appendFile','unlinkSync','unlink']],[fs.promises,['writeFile','appendFile','unlink']]])for(const method of methods){const original=api[method];api[method]=function(file,...args){if(isLive(file)){blockedWrites++;throw Error('Isolated checks cannot write the active autosave.');}return original.call(this,file,...args);};}
syncBuiltinESMExports();
registerHooks({load(url,context,next){const result=next(url,context);if(result.source&&url.startsWith(pathToFileURL(path.join(root,'scripts')).href)){let source=result.source.toString();source=source.replaceAll("new URL('../saves/autosave.json',import.meta.url)",`new URL('${url.endsWith('/world-systems-check.mjs')?worldFixture:fixture}')`).replaceAll('The actual turn-182 save','The isolated captured save').replaceAll('The real current world','The isolated captured world').replaceAll('The active autosave','The isolated captured save').replaceAll('Current autosave','Isolated captured save').replaceAll('Real save remains','Isolated captured save remains');return {...result,source};}return result;}});
for(const file of process.argv.slice(2)){if(!/^[a-z-]+-?check\.(?:mjs|cjs)$/.test(file)&&file!=='check.mjs')throw Error('Invalid test filename');console.log('RUN '+file+' (frozen fixture)');process.argv[1]=path.join(root,'scripts',file);await import(pathToFileURL(process.argv[1]));const report=path.join(root,'output',file.replace(/-check\.(?:mjs|cjs)$/, '-checks.json'));try{const parsed=JSON.parse(await readFile(report,'utf8'));parsed.saveScope='Frozen output/'+(file==='world-systems-check.mjs'?'world-systems-save-input.json':'modernization-save-input.json')+'; live autosave may advance independently';parsed.activeSaveWritten=false;parsed.saveReadRedirects=redirectedReads;parsed.blockedActiveSaveWrites=blockedWrites;await writeFile(report,JSON.stringify(parsed,null,2));}catch(error){if(error.code!=='ENOENT')throw error;}}
