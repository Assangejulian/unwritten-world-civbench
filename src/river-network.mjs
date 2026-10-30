import {isWater} from './rules.mjs';

const vertexKey=(x,z)=>`${Math.round(x*100000)},${Math.round(z*100000)}`;
export function riverTopology(tiles){
  const vertices=new Map(),edges=new Map(),tileEdges=new Map();
  for(const tile of tiles){
    if(tile.hidden)continue;
    const x=Math.sqrt(3)*(tile.q+tile.r/2),z=1.5*tile.r,corners=[];
    for(let i=0;i<6;i++){const angle=(i*60-30)*Math.PI/180,vx=x+Math.cos(angle),vz=z+Math.sin(angle),key=vertexKey(vx,vz);if(!vertices.has(key))vertices.set(key,{key,x:vx,z:vz,water:false,edges:[],tiles:[]});const v=vertices.get(key);v.water||=isWater(tile);v.tiles.push(tile);corners.push(key);}
    const local=[];
    for(let dir=0;dir<6;dir++){const i=(6-dir)%6,a=corners[i],b=corners[(i+1)%6],key=[a,b].sort().join('|');if(!edges.has(key)){edges.set(key,{key,a,b,tiles:[],selected:false});vertices.get(a).edges.push(key);vertices.get(b).edges.push(key);}const edge=edges.get(key);edge.tiles.push({tile,dir});edge.selected||=!!tile.riverEdges?.includes(dir);local.push(key);}
    tileEdges.set(tile.id,local);
  }
  return {vertices,edges,tileEdges};
}

// Route along shared hex corners, rather than treating a cell walk as an edge path.
export function generateRivers(map,rng,density=1){
  const graph=riverTopology(map.tiles),distance=new Map(),queue=[];
  const allowed=edge=>edge.tiles.some(({tile})=>!isWater(tile))&&!edge.tiles.some(({tile})=>tile.terrain==='mountain');
  for(const v of graph.vertices.values())if(v.water){distance.set(v.key,0);queue.push(v.key);}
  for(let i=0;i<queue.length;i++){const v=graph.vertices.get(queue[i]);for(const id of v.edges){const edge=graph.edges.get(id);if(!allowed(edge))continue;const next=edge.a===v.key?edge.b:edge.a;if(distance.has(next))continue;distance.set(next,distance.get(v.key)+1);queue.push(next);}}
  const sources=[...graph.vertices.values()].filter(v=>v.tiles.some(t=>t.hill||t.terrain==='mountain')&&distance.get(v.key)>=6&&distance.get(v.key)<100);
  for(let i=sources.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[sources[i],sources[j]]=[sources[j],sources[i]];}
  const used=new Set();let rivers=0;
  for(const spring of sources){
    if(rivers>=Math.floor(map.tiles.length/160*density)||used.has(spring.key)||spring.edges.some(id=>graph.edges.get(id).selected))continue;
    let current=spring;
    while(!current.water){
      const candidates=current.edges.map(id=>graph.edges.get(id)).filter(allowed).map(edge=>({edge,next:graph.vertices.get(edge.a===current.key?edge.b:edge.a)})).filter(({next})=>distance.get(next.key)<distance.get(current.key));
      if(!candidates.length)break;
      const {edge,next}=candidates[Math.floor(rng()*candidates.length)];edge.selected=true;used.add(current.key);
      for(const {tile,dir}of edge.tiles)if(!isWater(tile)){tile.river=true;if(!tile.riverEdges.includes(dir))tile.riverEdges.push(dir);}
      current=next;if(used.has(current.key))break;
    }
    used.add(current.key);rivers++;
  }
  map.riverVersion=2;
}

// Older saves contain separated edge bars. Bridge gaps on the hex perimeter in the view.
export function visibleRiverEdges(map){
  const graph=riverTopology(map.tiles);
  if(map.riverVersion!==2)for(const tile of map.tiles){
    if(tile.hidden||isWater(tile)||!tile.riverEdges||tile.riverEdges.length<2)continue;
    const selected=[...new Set(tile.riverEdges)].sort((a,b)=>a-b);let gap=-1,start=0;
    for(let i=0;i<selected.length;i++){const next=selected[(i+1)%selected.length]+(i===selected.length-1?6:0),length=next-selected[i];if(length>gap){gap=length;start=next%6;}}
    const span=6-gap;for(let i=0;i<=span;i++){const edge=graph.edges.get(graph.tileEdges.get(tile.id)[(start+i)%6]);edge.selected=true;}
  }
  return {vertices:graph.vertices,edges:[...graph.edges.values()].filter(edge=>edge.selected)};
}
