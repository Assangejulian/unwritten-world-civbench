import {spawn} from 'node:child_process';
import {mkdir,appendFile,stat,rename} from 'node:fs/promises';
import path from 'node:path';
import {driverInfo,readSource,executeDriver,ROOT} from './drivers.mjs';

// Only SDK run() opts into the newline streaming protocol. Custom programs
// that consume stdin to EOF retain the bounded one-shot protocol.
export class NativeDriverPool{
  constructor({traceDir=process.env.CIV_AI_TRACE_DIR||null}={}){this.entries=new Map();this.info=new Map();this.disposed=false;this.spawnCount=0;this.traceDir=traceDir?path.resolve(traceDir):null;this.traceWrites=Promise.resolve();this.traceFailures=0;this.tracePending=0;this.traceDropped=0;}
  async execute(p,obs){
    if(this.disposed)throw new Error('Driver pool is closed.');
    const file=p.driver.file;let cache=this.info.get(file);
    if(!cache||Date.now()-cache.checked>3000){const info=await driverInfo(file),source=await readSource(file);cache={...info,stream:/\bciv::run\s*\(/.test(source),checked:Date.now()};this.info.set(file,cache);}
    if(cache.status!=='ready'){this.invalidate(file);throw new Error('源码已变更，请重新编译驱动。');}
    if(!cache.stream)return executeDriver(p,obs);
    const key=p.id+':'+file;let entry=this.entries.get(key);
    for(const other of [...this.entries.values()])if(other.key.startsWith(p.id+':')&&other.key!==key)this.close(other);
    if(entry&&entry.hash!==cache.hash){this.close(entry);entry=null;}
    if(!entry){
      const child=spawn(cache.binary,[],{cwd:ROOT,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,CIV_DRIVER_STREAM:'1',CIV_AI_TRACE:this.traceDir?'1':'0'}});
      entry={key,file,child,hash:cache.hash,buffer:'',stderr:'',pending:null,closed:false};this.entries.set(key,entry);this.spawnCount++;
      child.stdout.on('data',bytes=>{
        entry.buffer+=bytes.toString('utf8');if(Buffer.byteLength(entry.buffer)>256*1024){this.close(entry,new Error('驱动输出超过上限。'));return;}
        let index;while((index=entry.buffer.indexOf('\n'))>=0){const line=entry.buffer.slice(0,index);entry.buffer=entry.buffer.slice(index+1);const request=entry.pending;if(!request){this.close(entry,new Error('驱动输出了未经请求的响应。'));return;}
          entry.pending=null;clearTimeout(request.timer);
          try{const response=JSON.parse(line);if(!Array.isArray(response.orders)||response.orders.length>128||Buffer.byteLength(JSON.stringify(response.memory??null))>32768)throw new Error('驱动响应格式或长度无效。');const ms=Math.round(performance.now()-request.started);this.recordTrace(p,request.observation,response.diagnostics,ms);request.resolve({orders:response.orders,memory:response.memory??null,ms,stderr:entry.stderr});entry.stderr='';}catch(error){request.reject(error);this.close(entry);}
        }
      });
      child.stderr.on('data',bytes=>{entry.stderr=(entry.stderr+bytes.toString('utf8')).slice(-1500);});
      child.on('error',error=>this.close(entry,error));child.on('close',code=>this.close(entry,new Error('C++ 驱动已退出：'+code)));child.stdin.on('error',error=>this.close(entry,error));
    }
    if(this.disposed){this.close(entry);throw new Error('Driver pool is closed.');}
    if(entry.pending)throw new Error('Driver already has a pending observation.');
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>this.close(entry,new Error('C++ 决策超过 2000ms 限制。')),2000);
      entry.pending={resolve,reject,timer,observation:obs,started:performance.now()};entry.child.stdin.write(JSON.stringify(obs)+'\n');
    });
  }
  recordTrace(p,obs,diagnostics,ms){
    if(!this.traceDir||diagnostics?.version!==1||Buffer.byteLength(JSON.stringify(diagnostics))>192*1024)return;
    if(this.tracePending>=16){this.traceDropped++;return;}this.tracePending++;
    const line=JSON.stringify({version:1,driver:p.driver.file,turn:obs.turn,player:p.id,ms,diagnostics})+'\n';
    // Host-only bounded diagnostics: never serialize into player memory or public state.
    this.traceWrites=this.traceWrites.then(async()=>{await mkdir(this.traceDir,{recursive:true});const file=path.join(this.traceDir,'native-decisions.jsonl'),size=await stat(file).then(s=>s.size).catch(()=>0);if(size+Buffer.byteLength(line)>4*1024*1024)await rename(file,path.join(this.traceDir,'native-decisions.previous.jsonl'));await appendFile(file,line);}).catch(()=>{this.traceFailures++;}).finally(()=>{this.tracePending--;});
  }
  close(entry,error=new Error('Driver session invalidated.')){if(entry.closed)return;entry.closed=true;this.entries.delete(entry.key);if(entry.pending){clearTimeout(entry.pending.timer);entry.pending.reject(error);entry.pending=null;}entry.child.kill();}
  invalidate(file){this.info.delete(file);for(const entry of [...this.entries.values()])if(!file||entry.file===file)this.close(entry);}
  dispose(){this.disposed=true;this.invalidate();}
}
