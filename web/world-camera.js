const mod=(v,n)=>((v%n)+n)%n;
export function worldBounds(map,r=35){const pitch=r*Math.sqrt(3);return {left:75-pitch/2,right:75+pitch*(map.width-.5),top:90-r,bottom:90+r*1.5*(map.height-1)+r,period:pitch*map.width};}
// Only projected, discovered tiles define a player's chart. Full observers keep the globe.
export function exploredBounds(game,r=35){
  const map=game.map,full=worldBounds(map,r);
  if(game.visuals?.view===-1||!map.tiles.some(t=>t.hidden))return full;
  const known=map.tiles.filter(t=>!t.hidden),pitch=r*Math.sqrt(3),margin=pitch*2;
  if(!known.length)return {...full,left:75-margin,right:75+margin,top:90-margin,bottom:90+margin,explored:true,worldLeft:full.left,wrapX:!!map.wrapX};
  const xs=[...new Set(known.map(t=>75+pitch*(t.q+t.r/2)))].sort((a,b)=>a-b);
  let left=xs[0],right=xs.at(-1);
  if(map.wrapX&&xs.length>1){
    let gap=-1,start=0;
    for(let i=0;i<xs.length;i++){const next=xs[(i+1)%xs.length]+(i===xs.length-1?full.period:0),size=next-xs[i];if(size>gap){gap=size;start=(i+1)%xs.length;}}
    left=xs[start];right=left+full.period-gap;
  }
  const ys=known.map(t=>90+r*1.5*t.r);
  return {...full,left:left-margin,right:right+margin,top:Math.min(...ys)-r*3,bottom:Math.max(...ys)+r*3,explored:true,worldLeft:full.left,wrapX:!!map.wrapX};
}
export function chartX(x,bounds){return bounds.explored&&bounds.wrapX?x+Math.round(((bounds.left+bounds.right)/2-x)/bounds.period)*bounds.period:x;}
export function chartMargin(height){return Math.min(24,height*.03);}
export function wholeWorldZoom(bounds,width,height,sy=.6){return bounds.explored?Math.max(.03,Math.min(1.45,width/(bounds.right-bounds.left),height/((bounds.bottom-bounds.top)*sy))):Math.max(.01,width/bounds.period);}
export function constrainCamera(cam,zoom,width,height,bounds,wrap,sy=.6,insets={top:0,bottom:0}){
  const axis=(v,lo,hi,half)=>hi-lo<=half*2?(lo+hi)/2:Math.max(lo+half,Math.min(hi-half,v));
  const top=(chartMargin(height)+insets.top)/(zoom*sy),bottom=(chartMargin(height)+insets.bottom)/(zoom*sy);
  return {x:wrap&&!bounds.explored?bounds.left+mod(cam.x-bounds.left,bounds.period):axis(chartX(cam.x,bounds),bounds.left,bounds.right,width/(2*zoom)),y:axis(cam.y,bounds.top-top,bounds.bottom+bottom,height/(2*zoom*sy))};
}
export function visibleWorldCopies(cam,zoom,width,bounds,wrap){
  if(!wrap)return [0];
  const origin=bounds.worldLeft??bounds.left,lo=Math.floor((cam.x-width/(2*zoom)-origin)/bounds.period+1e-9),hi=Math.ceil((cam.x+width/(2*zoom)-origin)/bounds.period-1e-9)-1;
  return Array.from({length:hi-lo+1},(_,i)=>lo+i);
}
export function canonicalColumn(col,width){return mod(col,width);}
