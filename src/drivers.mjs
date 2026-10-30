import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,readdir,rename,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {CIVS} from './rules.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const playerDir=path.join(ROOT,'players'),binDir=path.join(ROOT,'bin');
let compilerPromise;
export function validFile(file){return typeof file==='string'&&/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,90}\.cpp$/.test(file);}
export async function compiler(){
  return compilerPromise??=(async()=>{
    const override=process.env.CIV_CPP_COMPILER;
    if(override)return {executable:override,prefix:[],name:path.basename(override)};
    const dirs=await readdir(path.join(ROOT,'tools')).catch(()=>[]);
    const folder=dirs.find(d=>d.startsWith('zig-windows-x86_64-')||d.startsWith('zig-x86_64-windows-'));
    if(folder)return {executable:path.join(ROOT,'tools',folder,'zig.exe'),prefix:['c++'],name:folder};
    throw new Error('未找到 C++ 编译器。请运行 Setup-Compiler.ps1，或设置 CIV_CPP_COMPILER。');
  })();
}
export async function runProcess(executable,args,{input='',timeout=1500,maxOutput=256*1024,env={}}={}){
  return new Promise((resolve,reject)=>{
    const started=performance.now(),child=spawn(executable,args,{cwd:ROOT,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,...env}});
    let stdout='',stderr='',finished=false,bytes=0;
    const done=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve(result);};
    const timer=setTimeout(()=>{child.kill();done(new Error(`进程超过 ${timeout}ms 限制。`));},timeout);
    child.on('error',e=>done(e));
    child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>maxOutput){child.kill();done(new Error('驱动输出超过上限。'));}else stdout+=chunk.toString('utf8');});
    child.stderr.on('data',chunk=>{if(stderr.length<6000)stderr+=chunk.toString('utf8');});
    child.on('close',code=>done(null,{code,stdout,stderr,ms:Math.round(performance.now()-started)}));
    child.stdin.on('error',()=>{});child.stdin.end(input);
  });
}
async function fingerprint(file){return createHash('sha256').update(await readFile(path.join(playerDir,file))).update(await readFile(path.join(ROOT,'sdk','civ.hpp'))).update((await compiler()).name).digest('hex');}
export async function driverInfo(file){
  if(!validFile(file))throw new Error('Invalid player filename');
  const stem=file.replace(/\.cpp$/,''),legacyBinary=path.join(binDir,stem+(process.platform==='win32'?'.exe':''));
  const meta=JSON.parse(await readFile(legacyBinary+'.json','utf8').catch(()=>'{}'));
  const published=typeof meta.binary==='string'&&/^[A-Za-z0-9_.-]+\.exe$/.test(meta.binary)&&meta.binary.startsWith(stem+'.'+String(meta.hash).slice(0,16)+'.');
  const binary=published?path.join(binDir,meta.binary):legacyBinary;
  let sourceHash;try{sourceHash=await fingerprint(file);}catch{return {file,status:'unavailable',message:'Compiler or source unavailable'};}
  const exists=await stat(binary).then(()=>true).catch(()=>false);
  return {file,status:exists&&meta.hash===sourceHash?'ready':'uncompiled',binary,hash:sourceHash,builtAt:meta.builtAt,compiler:meta.compiler};
}
const compiling=new Map();
async function publishMetadata(pending,metadata){
  // Live readers can briefly deny Windows replacement; retain atomic publication and bounded retries.
  for(let attempt=0;;attempt++){try{await rename(pending,metadata);return;}catch(error){if(process.platform!=='win32'||!['EPERM','EBUSY'].includes(error.code)||attempt>=9)throw error;await delay(50*(attempt+1));}}
}
export async function compileDriver(file,force=false){
  if(!validFile(file))throw new Error('Invalid player filename');
  if(compiling.has(file))return compiling.get(file);
  const promise=(async()=>{
    const info=await driverInfo(file);if(!force&&info.status==='ready')return info;
    const tool=await compiler();await mkdir(binDir,{recursive:true});
    const binary=path.join(binDir,file.replace(/\.cpp$/,process.platform==='win32'?'.exe':'')),temporary=binary.replace(/\.exe$/,'')+'.building.exe';
    const args=[...tool.prefix,'-std=c++17','-O2','-DNDEBUG','-I',path.join(ROOT,'sdk'),path.join(playerDir,file),'-o',temporary];
    const result=await runProcess(tool.executable,args,{timeout:180000,maxOutput:256*1024,env:{ZIG_LOCAL_CACHE_DIR:path.join(ROOT,'tools','cache'),ZIG_GLOBAL_CACHE_DIR:path.join(ROOT,'tools','global-cache')}});
    if(result.code!==0)throw new Error(result.stderr||result.stdout||`Compiler exited with ${result.code}`);
    const builtHash=await fingerprint(file);if(builtHash!==info.hash)throw new Error('编译过程中源码发生变化，请重新编译。');
    let published;
    try{await rename(temporary,binary);}catch(error){
      if(!['EPERM','EBUSY'].includes(error.code)||process.platform!=='win32')throw error;
      // A live Windows process locks its executable. Publish a new artifact
      // rather than terminating the user's game or replacing its running file.
      published=file.replace(/\.cpp$/,'')+'.'+builtHash.slice(0,16)+'.'+Date.now().toString(36)+'.exe';
      await rename(temporary,path.join(binDir,published));
    }
    const metadata=binary+'.json',pending=metadata+'.pending';
    await writeFile(pending,JSON.stringify({hash:builtHash,builtAt:new Date().toISOString(),compiler:tool.name,ms:result.ms,...(published?{binary:published}:{})},null,2));
    await publishMetadata(pending,metadata);
    return {...await driverInfo(file),ms:result.ms};
  })();
  compiling.set(file,promise);try{return await promise;}finally{compiling.delete(file);}
}
export async function buildPlayers(){const results=[];for(const civ of CIVS){process.stdout.write(`Compiling ${civ.file} ... `);const result=await compileDriver(civ.file);process.stdout.write(`ready${result.ms?` (${result.ms}ms)`:''}\n`);results.push(result);}return results;}
export async function listDrivers(){const files=(await readdir(playerDir)).filter(validFile).sort();return Promise.all(files.map(async file=>{const info=await driverInfo(file);const {binary,hash,...publicInfo}=info;return publicInfo;}));}
export async function readSource(file){if(!validFile(file))throw new Error('Invalid player filename');return readFile(path.join(playerDir,file),'utf8');}
export async function importSource(name,source){
  if(typeof source!=='string'||Buffer.byteLength(source)>512*1024)throw new Error('C++ 源码不得超过 512 KB。');
  const safe=path.basename(String(name||'player.cpp')).replace(/\.cpp$/i,'').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,45)||'player';
  const file=`user_${Date.now().toString(36)}_${safe}.cpp`;await writeFile(path.join(playerDir,file),source,'utf8');return file;
}
export async function executeDriver(p,obs){
  const info=await driverInfo(p.driver.file);if(info.status!=='ready')throw new Error('源码已变更或尚未编译，请重新编译此驱动。');
  const result=await runProcess(info.binary,[],{input:JSON.stringify(obs)+'\n',timeout:2000});
  if(result.code!==0)throw new Error(result.stderr||`驱动异常退出：${result.code}`);
  let response;try{response=JSON.parse(result.stdout.trim());}catch{throw new Error('驱动必须向 stdout 输出一个 JSON 对象。');}
  if(!response||!Array.isArray(response.orders))throw new Error('驱动响应必须包含 orders 数组。');
  if(response.orders.length>128)throw new Error('每回合最多提交 128 个指令。');
  if(response.memory!==undefined&&Buffer.byteLength(JSON.stringify(response.memory))>32768)throw new Error('memory 不得超过 32 KB。');
  return {orders:response.orders,memory:response.memory??null,ms:result.ms,stderr:result.stderr};
}
