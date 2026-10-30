import * as E from './engine.mjs';
import {UNITS,isWater,dist} from './rules.mjs';
import {neighbors,indexMap} from './world.mjs';
import {unitDetected,zocField,movementBlocked} from './movement-rules.mjs';

// Planning reads remembered geography and visible occupancy, never hidden live entities.
function planningWorld(g,p){
 const known=new Set(p.explored),visible=new Set(p.visible),tiles=g.map.tiles.map(t=>visible.has(t.id)?{...t}:known.has(t.id)&&p.knownTiles?.[t.id]?{...p.knownTiles[t.id]}:{id:t.id,q:t.q,r:t.r,col:t.col,row:t.row,terrain:'mountain',owner:null,cityId:null,hidden:true});
 const cities=[...g.cities.filter(c=>c.owner===p.id||visible.has(c.tile)),...Object.values(p.knownCities||{}).filter(c=>c.owner!==p.id&&!visible.has(c.tile)).map(c=>({...c,hp:200,walls:100,buildings:[],districts:[]}))];
 return {...g,map:indexMap({...g.map,tiles}),cities,units:g.units.filter(u=>u.owner===p.id||visible.has(u.tile)&&unitDetected(g,u,p.id)),known};
}
export function settlementLens(g,p){
 const world=planningWorld(g,p);return world.map.tiles.filter(t=>world.known.has(t.id)&&t.terrain).map(t=>{const legal=E.settlementValue(world,p,t,world.known,true)>-100;return {tile:t.id,legal,score:legal?E.settlementValue(world,p,t,world.known,true):null,reason:legal?'':isWater(t)?'水面不可建城':t.terrain==='mountain'?'山脉不可建城':t.cityState||t.cityStateTerritory?'城邦领地':t.owner!==null&&t.owner!==p.id?'他国领地':t.fort||t.district?'已有设施':'距离已知城市不足四格'};});
}
class Queue{
 constructor(){this.nodes=[];}
 push(node){const a=this.nodes;a.push(node);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(a[j].rank<=node.rank)break;a[i]=a[j];i=j;}a[i]=node;}
 pop(){const a=this.nodes,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].rank<a[j].rank)j++;if(a[j].rank>=last.rank)break;a[i]=a[j];i=j;}a[i]=last;}return first;}
}
export function unitRoute(g,p,u,destination){
 if(!u||u.owner!==p.id||u.hp<=0||UNITS[u.type].domain==='air'||u.type==='envoy'||!Number.isInteger(destination)||!p.explored.includes(destination))return null;
 const w=planningWorld(g,p),actor=w.units.find(v=>v.id===u.id),partner=E.linkedPartner(w,actor),escort=partner?.tile===actor.tile,limit=Math.min(E.movementAllowance(w,actor),escort?E.movementAllowance(w,partner):Infinity),controls=zocField(w,actor),otherControls=escort?zocField(w,partner):new Set();
 if(!Number.isFinite(limit)||limit<=0)return null;
 const remaining=u.acted||movementBlocked(g,u)?0:Math.min(u.moves,escort?partner.moves:Infinity,limit),round=remaining>0?0:1,start={tile:u.tile,round,remaining:remaining||limit,steps:0,parent:null,rank:round*(limit+1)},queue=new Queue(),best=new Map();queue.push(start);let reached;
 const key=n=>n.tile+':'+n.steps+':'+Math.round(n.remaining*1000);best.set(key(start),start.rank);
 for(let visited=0;queue.nodes.length&&visited<Math.min(120000,g.map.tiles.length*40);visited++){
  const n=queue.pop();if(n.rank>best.get(key(n))+1e-9)continue;if(n.tile===destination){reached=n;break;}if(n.round>=100)continue;
  const from=w.map.tiles[n.tile];if(n.tile!==u.tile&&from.cityId!==null&&from.owner!==p.id)continue;
  for(const raw of neighbors(w.map,from)){const to=w.map.tiles[raw.id];if(!w.known.has(to.id))continue;const step=Math.max(E.movementCost(w,p,actor,from,to),escort?E.movementCost(w,p,partner,from,to):0);if(!Number.isFinite(step)||step>limit+1e-9)continue;
   let turn=n.round,left=n.remaining,steps=n.steps;if(step>left+1e-9||steps>=limit){turn++;left=limit;steps=0;}
   left=Math.max(0,left-step);steps++;if(controls.has(to.id)||otherControls.has(to.id)||w.units.some(v=>v.tile===to.id&&E.canCaptureCivilian(w,actor,v)))left=0;
   const next={tile:to.id,round:turn,remaining:left,steps,parent:n,rank:turn*(limit+1)+limit-left+steps*.00001},k=key(next);if(next.rank>=(best.get(k)??Infinity)-1e-9)continue;best.set(k,next.rank);queue.push(next);
  }
 }
 if(!reached)return null;const nodes=[];for(let n=reached;n;n=n.parent)nodes.unshift(n);return {path:nodes.map(n=>n.tile),arrivals:nodes.map(n=>n.round+1),turns:reached.round+1,destination,knownOnly:true};
}

// Each leg is admitted again using the real engine, including new blockers and fog discoveries.
export function advanceMoveOrder(g,p,u,command){
 if(!u.moveOrder||u.acted||u.moves<=0)return false;
 if(g.units.some(v=>v.owner!==p.id&&!UNITS[v.type].civilian&&p.visible.includes(v.tile)&&unitDetected(g,v,p.id)&&E.atWar(g,p.id,v.owner)&&dist(g.map.tiles[v.tile],g.map.tiles[u.tile],g.map)<=2)){delete u.moveOrder;E.event(g,'military','自动行军因附近敌军而暂停。',p.id,u.tile);return false;}
 const route=unitRoute(g,p,u,u.moveOrder.destination);if(!route){delete u.moveOrder;E.event(g,'military','路线已受阻，请重新下达行军命令。',p.id,u.tile);return false;}
 let moved=false;for(let i=1;i<route.path.length;i++){if(u.acted||u.moves<=0||route.arrivals[i]>1)break;const tile=route.path[i];if(!E.reachable(g,p,u).some(v=>v.tile===tile)){delete u.moveOrder;E.event(g,'military','前方出现新的阻碍，自动行军已停止。',p.id,u.tile);break;}command({type:'move',unit:u.id,tile,continueRoute:true});moved=true;if(u.tile===route.destination){delete u.moveOrder;break;}}
 return moved;
}
