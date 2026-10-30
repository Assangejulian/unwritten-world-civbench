import {applyAction} from './engine.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const animationDuration=order=>order.type==='move'?3000:['attack','cityAttack'].includes(order.type)?1950:order.unit!==undefined?1250:0;

// Preserve driver order and rules while spreading work across event-loop turns.
// A small presentation window prevents large armies from animating all at once.
export async function executeOrderQueue(game,player,orders,{interval=220,maxConcurrent=3,wait=sleep,now=()=>performance.now(),onProgress=()=>{}}={}){
  const report={accepted:0,rejected:[]};
  if(!Array.isArray(orders)){report.rejected.push({reason:'orders must be an array'});return report;}
  const queue=orders.slice(0,128),slots=[];
  interval=Math.max(100,Number(interval)||220);maxConcurrent=Math.max(1,Math.min(3,Math.floor(maxConcurrent)||3));
  for(let index=0;index<queue.length;index++){
    const order=queue[index],duration=order&&typeof order==='object'?animationDuration(order):0;
    let time=now();
    while(slots.length&&slots[0]<=time)slots.shift();
    if(duration&&slots.length>=maxConcurrent){await wait(Math.max(0,slots[0]-time));time=now();while(slots.length&&slots[0]<=time)slots.shift();}
    let accepted=false;
    try{applyAction(game,player,order);report.accepted++;accepted=true;}catch(error){report.rejected.push({type:order?.type,reason:error.message});}
    if(accepted&&duration){slots.push(now()+duration);slots.sort((a,b)=>a-b);}
    onProgress({processed:index+1,total:queue.length,orders:report.accepted,rejected:report.rejected.length,current:accepted?{type:order.type,unit:order.unit??null,city:order.city??null}:null});
    // Even administrative/rejected orders yield so state/pause requests remain responsive.
    await wait(accepted&&duration?interval:0);
  }
  if(slots.length)await wait(Math.max(0,slots.at(-1)-now())+160);
  return record();
  function record(){game.lastActions.push({turn:game.turn,player:player.id,...report});game.lastActions=game.lastActions.slice(-32);return report;}
}
