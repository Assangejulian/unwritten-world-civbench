// Presentation reservations also cover snapshots received after a slow/hidden tab.
export function scheduleActions(events,now,occupied=[],{limit=3,gap=.12}={}){
  const ends=occupied.filter(end=>end>now).sort((a,b)=>a-b),starts=new Map(),actorEnds=new Map();let cursor=now;
  for(const event of events){
    if(!['move','attack','work'].includes(event.kind))continue;
    cursor=Math.max(cursor,actorEnds.get(event.actor?.id)||now);
    while(ends.length&&ends[0]<=cursor)ends.shift();
    if(ends.length>=limit){cursor=Math.max(cursor,ends[0]);while(ends.length&&ends[0]<=cursor)ends.shift();}
    starts.set(event.id,cursor);const end=cursor+(event.kind==='move'?3:event.kind==='attack'?1.95:1.25);if(event.actor?.id!==undefined)actorEnds.set(event.actor.id,end);ends.push(end);ends.sort((a,b)=>a-b);cursor+=gap;
  }
  return starts;
}
