import {Worker} from 'node:worker_threads';
// Other nations' remembered terrain (about 1.2 MB each late game) is private and not read by
// one player's observation; omitting it shrinks the structured clone on the main thread.
export function slimObservationWorld(game,map,player){return {...game,map,players:game.players.map(o=>o.id===player||!o.knownTiles?o:(({knownTiles,...rest})=>rest)(o))};}
// Workers receive detached world copies; authoritative admission and impact remain on the server.
export class ObservationPool{
 constructor(limit=2){this.limit=limit;this.workers=[];this.queue=[];this.sequence=0;this.disposed=false;this.stats={jobs:0,cloneMs:0,computeMs:0};}
 prepare(game,player,options={}){
  if(this.disposed)return Promise.reject(Error('Observation pool has been disposed.'));
  return new Promise((resolve,reject)=>{this.queue.push({id:++this.sequence,game,player:player.id,options,resolve,reject});this.pump();});
 }
 spawn(){
  const worker=new Worker(new URL('./observation-worker.mjs',import.meta.url)),slot={worker,job:null};worker.unref();
  worker.on('message',message=>{const job=slot.job;if(!job||message.id!==job.id)return;slot.job=null;worker.unref();if(message.error)job.reject(Error(message.error));else {this.stats.jobs++;this.stats.computeMs+=message.ms;job.resolve(message.result);}this.pump();});
  const failed=error=>{const index=this.workers.indexOf(slot);if(index<0)return;this.workers.splice(index,1);slot.job?.reject(error);slot.job=null;void worker.terminate();this.pump();};
  worker.on('error',failed);worker.on('exit',code=>{if(!this.disposed)failed(Error('Observation worker exited: '+code));});this.workers.push(slot);return slot;
 }
 pump(){
  if(this.disposed)return;
  while(this.queue.length){let slot=this.workers.find(s=>!s.job);if(!slot&&this.workers.length<this.limit)slot=this.spawn();if(!slot)return;
   const job=this.queue.shift(),{index,...map}=job.game.map;slot.job=job;slot.worker.ref();
   try{const start=performance.now();slot.worker.postMessage({id:job.id,game:slimObservationWorld(job.game,map,job.player),player:job.player,options:job.options});this.stats.cloneMs+=performance.now()-start;}
   catch(error){slot.job=null;slot.worker.unref();job.reject(error);}
  }
 }
 dispose(){this.disposed=true;for(const job of this.queue.splice(0))job.reject(Error('Observation pool has been disposed.'));for(const slot of this.workers.splice(0)){slot.job?.reject(Error('Observation pool has been disposed.'));void slot.worker.terminate();}}
}
