// Build an offline Windows candidate from an explicit allowlist, never from Git history or saves.
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {CIVS} from '../src/rules.mjs';
import {driverInfo} from '../src/drivers.mjs';
import {publicationExclusion} from './publication-policy.mjs';
const exec=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.platform!=='win32')throw Error('This packager requires Windows x64 runtimes.');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const sourceCommitIndex=process.argv.indexOf('--source-commit'),sourceCommit=sourceCommitIndex<0?null:process.argv[sourceCommitIndex+1];
if(sourceCommitIndex>=0&&!/^[a-f0-9]{40}$/.test(sourceCommit||''))throw Error('--source-commit requires a complete public commit SHA.');
const name=`UnwrittenWorld-CivBench-${pkg.version}-preview-win-x64`,parent=path.join(root,'dist'),dest=path.join(parent,name),zip=dest+'.zip';
const finalize=process.argv.includes('--finalize-staging'),resume=process.argv.includes('--resume-staging')||finalize;
if(finalize&&!existsSync(dest))throw Error('No staging directory to finalize.');
if(existsSync(zip)||existsSync(dest)&&!resume)throw Error('Candidate already exists; preserve it and select a new release version, or resume an unarchived staging directory explicitly.');
const toolchain=(await fs.readdir(path.join(root,'tools'))).find(v=>v.startsWith('zig-windows-x86_64-')||v.startsWith('zig-x86_64-windows-'));
if(!toolchain)throw Error('Bundled compiler is missing.');
for(const file of ['tools/node.exe','tools/electron/electron.exe','HexCivilizations.exe','environment/mcp/package-lock.json','environment/mcp/node_modules/@modelcontextprotocol/sdk/package.json'])if(!existsSync(path.join(root,file)))throw Error('Required distribution input missing: '+file);
const originalDrivers=await Promise.all(CIVS.map(c=>driverInfo(c.file)));if(originalDrivers.some(d=>d.status!=='ready'))throw Error('Source checkout drivers must be ready before packaging.');
await fs.mkdir(dest,{recursive:true});
if(!finalize){
const inputs=['web','src','sdk','players','desktop','docs','environment/mcp','server.mjs','README.md','LICENSE','NOTICE','launch.ps1','stop.ps1','Start.cmd','Stop.cmd','Setup-Compiler.ps1','HexCivilizations.exe','tools/node.exe','tools/NODE-LICENSE.txt','tools/desktop-runtime.json','tools/electron-SHASUMS256.txt','tools/toolchain.json','tools/electron','tools/'+toolchain,'scripts/build.mjs'];
for(const file of inputs){await fs.cp(path.join(root,file),path.join(dest,file),{recursive:true,errorOnExist:!resume,force:resume,filter:source=>!['.git','.npmrc','.env','__pycache__'].includes(path.basename(source))});}
await fs.writeFile(path.join(dest,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,license:pkg.license,private:true,type:'module',description:pkg.description,scripts:{start:'node server.mjs','build:players':'node scripts/build.mjs'}},null,2)+'\n');
await fs.writeFile(path.join(dest,'READ_THIS_FIRST.md'),(await fs.readFile(path.join(root,'docs/PLAYABLE_PREVIEW.md'),'utf8')).replace('](MCP_QUICKSTART.md)','](docs/MCP_QUICKSTART.md)'));
await fs.mkdir(path.join(dest,'bin'),{recursive:true});
const compiler=path.join(dest,'tools',toolchain,'zig.exe'),env={...process.env,ZIG_LOCAL_CACHE_DIR:path.join(parent,'packaging-cache'),ZIG_GLOBAL_CACHE_DIR:path.join(root,'tools/global-cache')};
// Strip native debug records and remap source paths without touching checkout binaries.
for(let i=0;i<CIVS.length;i+=2)await Promise.all(CIVS.slice(i,i+2).map(async civ=>{
  const binary=path.join(dest,'bin',civ.file.replace(/\.cpp$/,'.exe')),before=originalDrivers.find(d=>d.file===civ.file);
  await exec(compiler,['c++','-std=c++17','-O2','-DNDEBUG','-s','-ffile-prefix-map='+dest+'=.','-I','sdk',path.join('players',civ.file),'-o',binary],{cwd:dest,env,windowsHide:true,timeout:240000,maxBuffer:1024*1024});
  // The Windows linker also emits an import library; it is not a runtime dependency.
  await fs.unlink(binary.replace(/\.exe$/,'.lib')).catch(error=>{if(error.code!=='ENOENT')throw error;});
  await fs.writeFile(binary+'.json',JSON.stringify({hash:before.hash,builtAt:new Date().toISOString(),compiler:toolchain,release:true,flags:['-O2','-DNDEBUG','-s','-ffile-prefix-map']},null,2));
  console.log('PACK driver ready: '+civ.file);
}));
}else{
  for(const info of originalDrivers){const stem=info.file.replace(/\.cpp$/,'.exe'),meta=JSON.parse(await fs.readFile(path.join(dest,'bin',stem+'.json'),'utf8'));if(meta.hash!==info.hash||!meta.release)throw Error('Staged native build is stale: '+info.file);}
  for(const file of ['README.md','docs','LICENSE','NOTICE','environment/mcp/package.json','environment/mcp/package-lock.json'])await fs.cp(path.join(root,file),path.join(dest,file),{recursive:true,force:true});
  const stagedPackage=JSON.parse(await fs.readFile(path.join(dest,'package.json'),'utf8'));stagedPackage.license=pkg.license;await fs.writeFile(path.join(dest,'package.json'),JSON.stringify(stagedPackage,null,2)+'\n');
  await fs.writeFile(path.join(dest,'READ_THIS_FIRST.md'),(await fs.readFile(path.join(root,'docs/PLAYABLE_PREVIEW.md'),'utf8')).replace('](MCP_QUICKSTART.md)','](docs/MCP_QUICKSTART.md)'));
}
// Remove legacy documents only from this generated staging tree; local originals stay intact.
for(const entry of await fs.readdir(dest,{withFileTypes:true}))if(entry.isFile()&&publicationExclusion(entry.name,{distribution:true})==='legacy root development or review document')await fs.unlink(path.join(dest,entry.name));
const files=[];
const paths=[];
async function walk(dir){for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const absolute=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Distribution symlinks are not permitted.');if(entry.isDirectory())await walk(absolute);else if(entry.isFile()&&entry.name!=='RELEASE-MANIFEST.json')paths.push(absolute);}}
await walk(dest);
for(let i=0;i<paths.length;i+=16){const batch=await Promise.all(paths.slice(i,i+16).map(async absolute=>{
  const relative=path.relative(dest,absolute).replaceAll('\\','/');
  const excluded=publicationExclusion(relative,{distribution:true});if(excluded)throw Error('Publication boundary: '+relative+' ('+excluded+')');
  // OBJ files under web/assets are legitimate 3D models, not compiler objects.
  if(/^(?:\.git|saves|logs|output|Model_work|art-source)(?:\/|$)|\.(?:pdb|sqlite|db)$|^bin\/.*\.(?:lib|obj)$|(?:^|\/)\.env(?:\.|$)/i.test(relative))throw Error('Private/generated path in candidate: '+relative);
  const bytes=await fs.readFile(absolute);
  if(relative.startsWith('bin/')&&relative.endsWith('.exe')&&[bytes.toString('latin1'),bytes.toString('utf16le')].some(text=>text.includes(root)||text.includes(dest)))throw Error('Local debug path in candidate native binary: '+relative);
  return {path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}));files.push(...batch);if(i%2048===0)console.log('PACK hashed '+Math.min(i+16,paths.length)+'/'+paths.length);}
const commit=sourceCommit||(await exec('git',['rev-parse','--short','HEAD'],{cwd:root,windowsHide:true})).stdout.trim();
await fs.writeFile(path.join(dest,'RELEASE-MANIFEST.json'),JSON.stringify({name,version:pkg.version,channel:'playable-preview',platform:'win32-x64',builtAt:new Date().toISOString(),baseCommit:commit,workingTreeSnapshot:!sourceCommit,totalBytes:files.reduce((n,f)=>n+f.bytes,0),files,projectLicense:pkg.license,excluded:['.git','saves','logs','output','Model_work','art-source','legacy root development/review documents','compiler caches','debug artifacts','obsolete native binaries']},null,2));
console.log('PACK staging ready; creating ZIP.');
await exec('tar.exe',['-a','-cf',zip,'-C',parent,name],{cwd:root,windowsHide:true,timeout:600000,maxBuffer:1024*1024});
const zipBytes=await fs.readFile(zip),sha256=createHash('sha256').update(zipBytes).digest('hex');
await fs.writeFile(zip+'.sha256',sha256+'  '+path.basename(zip)+'\n');
console.log(JSON.stringify({directory:dest,zip,files:files.length+1,uncompressedBytes:files.reduce((n,f)=>n+f.bytes,0)+(await fs.stat(path.join(dest,'RELEASE-MANIFEST.json'))).size,zipBytes:zipBytes.length,sha256}));
