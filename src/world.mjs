import {DIRECTIONS,dist,tileKey,isWater,waterDepths,SHALLOW_WATER_LIMIT,tileYield,canonicalTileKey,WORLD_RAINFALL,RESOURCE_ABUNDANCE} from './rules.mjs';
import {generateRivers} from './river-network.mjs';
export {tileYield} from './rules.mjs';

export function seedNumber(seed) {
  let h=2166136261;
  for(const c of String(seed)) h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}
export function random(seed) {
  let a=seedNumber(seed);
  const next=()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
  return next;
}
export function gameRandom(game) {
  let t=game.rngState+=0x6D2B79F5;
  t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
  game.rngState>>>=0;
  return ((t^t>>>14)>>>0)/4294967296;
}
export const neighbors = (map,t) => DIRECTIONS.map(([dq,dr])=>map.index[canonicalTileKey(t.q+dq,t.r+dr,map)]).filter(Boolean);
export function indexMap(map) {map.index=Object.fromEntries(map.tiles.map(t=>[tileKey(t.q,t.r),t]));return map;}
export function tilesInRange(map,center,radius) {
  const result=[],seen=new Set();
  for(let dq=-radius;dq<=radius;dq++)for(let dr=Math.max(-radius,-dq-radius);dr<=Math.min(radius,-dq+radius);dr++){
    const tile=map.index[canonicalTileKey(center.q+dq,center.r+dr,map)];if(tile&&!seen.has(tile.id)){seen.add(tile.id);result.push(tile);}
  }
  return result.sort((a,b)=>a.id-b.id);
}

// Smooth, periodic fields keep coastlines and biomes coherent across the cylinder seam.
function noiseField(rng,width,height,wrapX,columns,rows){
  const grid=Array.from({length:(columns+1)*(rows+1)},()=>rng()),smooth=v=>v*v*(3-2*v);
  const sample=(x,y)=>grid[Math.max(0,Math.min(rows,y))*(columns+1)+(wrapX?(x%columns+columns)%columns:Math.max(0,Math.min(columns,x)))];
  return (x,y)=>{const gx=x/width*columns,gy=y/height*rows,ix=Math.floor(gx),iy=Math.floor(gy),fx=smooth(gx-ix),fy=smooth(gy-iy),a=sample(ix,iy)*(1-fx)+sample(ix+1,iy)*fx,b=sample(ix,iy+1)*(1-fx)+sample(ix+1,iy+1)*fx;return a*(1-fy)+b*fy;};
}

export function generateMap(seed,width=106,height=66,count=8,type='random',wrapX=true,options={}) {
  const rainfall=options.rainfall===undefined?'standard':options.rainfall,abundance=options.resourceAbundance===undefined?'standard':options.resourceAbundance;
  if(typeof rainfall!=='string'||!Object.hasOwn(WORLD_RAINFALL,rainfall)||typeof abundance!=='string'||!Object.hasOwn(RESOURCE_ABUNDANCE,abundance))throw Error('Invalid world generation settings.');
  const rng=random(seed),tiles=[],centers=[],ranges=[],basins=[],topology={width,wrapX},distance=(a,b)=>dist(a,b,topology);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dx=(x,c)=>wrapX?(x-c+width*1.5)%width-width*.5:x-c;
  // Random worlds sample continuous geography controls, never one of the preset profiles.
  const shapeRng=type==='random'?random(seed+'world-shape'):null;
  const shape=shapeRng?{landFraction:.27+shapeRng()*.37,connectivity:shapeRng(),massCount:2+Math.floor(shapeRng()*11),massSize:.6+shapeRng()*.75,dominance:shapeRng()**2,coastStrength:.5+shapeRng()*.9,warpStrength:.02+shapeRng()*.07,riftStrength:shapeRng()**2*.45,mountainWidth:.7+shapeRng()*.8,mountainThreshold:.32+shapeRng()*.14,temperatureShift:(shapeRng()-.5)*.14,rainShift:(shapeRng()-.5)*.2}:null;
  const coast=noiseField(rng,width,height,wrapX,8,6),detail=noiseField(rng,width,height,wrapX,24,16),warp=noiseField(rng,width,height,wrapX,4,4),rain=noiseField(rng,width,height,wrapX,7,5),heat=noiseField(rng,width,height,wrapX,5,4),rough=noiseField(rng,width,height,wrapX,18,12);
  const phase=wrapX?rng()*width:0;
  const broad=shape?noiseField(rng,width,height,wrapX,2+Math.floor(shape.connectivity*5),2+Math.floor(shape.massCount/4)):null;
  if(shape){
    for(let i=0;i<shape.massCount;i++){
      let best=null,score=-Infinity;
      for(let j=0;j<20;j++){const candidate={x:rng()*width,y:height*(.1+rng()*.8)},nearest=centers.length?Math.min(...centers.map(c=>Math.hypot(dx(candidate.x,c.x),candidate.y-c.y))):0,value=nearest+rng()*Math.min(width,height)*.12;if(value>score){score=value;best=candidate;}}
      const radius=Math.min(width,height)/Math.sqrt(shape.massCount)*shape.massSize*(i===0?1+shape.dominance*2.4:.7+rng()*.6);
      centers.push({...best,rx:radius*(.75+rng()*.8),ry:radius*(.65+rng()*.8),angle:rng()*Math.PI});
    }
  }else if(type==='pangaea'){
    const n=3+Math.floor(rng()*3),angle=rng()*Math.PI,span=.24+rng()*.13,cx=wrapX?phase:width*.5,cy=height*(.43+rng()*.14);
    for(let i=0;i<n;i++){const along=(i/(n-1)-.5)*2;centers.push({x:cx+Math.cos(angle)*width*span*along,y:clamp(cy+Math.sin(angle)*height*span*along,height*.18,height*.82),rx:width*(.23+rng()*.06),ry:height*(.27+rng()*.07),angle:(rng()-.5)*.6});}
  }else if(type==='islands'){
    const n=Math.max(10,Math.ceil(count*.8))+Math.floor(rng()*6);
    // Farthest-point sampling scatters unequal islands without a visible rectangular grid.
    for(let i=0;i<n;i++){let best=null,score=-Infinity;for(let j=0;j<20;j++){const candidate={x:rng()*width,y:height*(.12+rng()*.76)},nearest=centers.length?Math.min(...centers.map(c=>Math.hypot(dx(candidate.x,c.x),candidate.y-c.y))):0,value=nearest+rng()*Math.min(width,height)*.09;if(value>score){score=value;best=candidate;}}centers.push(best);}
    for(const c of centers){const nearest=Math.min(...centers.filter(o=>o!==c).map(o=>Math.hypot(dx(c.x,o.x),c.y-o.y))),radius=nearest*(.36+rng()*.2);Object.assign(c,{rx:radius*(.85+rng()*.35),ry:radius*(.75+rng()*.4),angle:(rng()-.5)*Math.PI});}
  }else{
    const n=2+Math.floor(rng()*3);
    const columns=n===2?(rng()<.5?2:1):n===3?3:2,rows=Math.ceil(n/columns);
    const cells=Array.from({length:columns*rows},(_,i)=>i);for(let i=cells.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
    for(const cell of cells.slice(0,n)){
      const scale=.39+rng()*.1;
      centers.push({x:phase+width*((cell%columns+.5+(rng()-.5)*.4)/columns),y:height*((Math.floor(cell/columns)+.5+(rng()-.5)*.4)/rows),rx:width/columns*scale,ry:height/rows*(scale*(.85+rng()*.3)),angle:(rng()-.5)*1.1});
    }
  }
  for(const c of centers){
    c.x=wrapX?(c.x%width+width)%width:clamp(c.x,width*.12,width*.88);
    c.lobes=Array.from({length:1+Math.floor(rng()*3)},()=>{const a=rng()*Math.PI*2;return {x:c.x+Math.cos(a)*c.rx*.65,y:c.y+Math.sin(a)*c.ry*.65,rx:c.rx*(.35+rng()*.3),ry:c.ry*(.35+rng()*.3)};});
    for(let i=0;i<(type==='islands'?1:2+Math.floor(rng()*2));i++)ranges.push({x:c.x+(rng()-.5)*c.rx,y:c.y+(height*.5-c.y)*(.2+rng()*.45)+(rng()-.5)*c.ry,angle:rng()*Math.PI,length:Math.min(c.rx,c.ry)*(1+rng()*.65),width:Math.max(.8,Math.min(width,height)*(.018+rng()*.02))*(shape?.mountainWidth??1),phase:rng()*Math.PI*2,pass:.4+rng()*.45});
    if(rng()<.55)basins.push({x:c.x+(rng()-.5)*c.rx,y:c.y+(rng()-.5)*c.ry,rx:Math.max(1.5,c.rx*(.13+rng()*.12)),ry:Math.max(1.5,c.ry*(.15+rng()*.12))});
    if(rng()<.7){const a=rng()*Math.PI*2;basins.push({x:c.x+Math.cos(a)*c.rx*.85,y:c.y+Math.sin(a)*c.ry*.85,rx:Math.max(1,c.rx*(.25+rng()*.18)),ry:Math.max(1,c.ry*(.25+rng()*.18))});}
  }
  const separation=type==='islands'?Math.max(1.1,Math.min(width,height)*.025):Math.max(1.5,Math.min(width,height)*.04);
  const elevationAt=(col,row)=>{
    const bend=warp(col,row)-.5,xx=col+bend*width*(shape?.warpStrength??.045),yy=row+(coast(col,row)-.5)*height*.07;
    let elevation=-1,nearest=Infinity,second=Infinity;
    for(const c of centers){const x=dx(xx,c.x),y=yy-c.y,ca=Math.cos(c.angle),sa=Math.sin(c.angle),d=Math.hypot(dx(col,c.x),row-c.y);elevation=Math.max(elevation,1-Math.hypot((x*ca+y*sa)/c.rx,(-x*sa+y*ca)/c.ry));for(const lobe of c.lobes)elevation=Math.max(elevation,.75*(1-Math.hypot(dx(xx,lobe.x)/lobe.rx,(yy-lobe.y)/lobe.ry)));if(d<nearest){second=nearest;nearest=d;}else second=Math.min(second,d);}
    if(shape)elevation=elevation*(.45+shape.connectivity*.5)+(broad(col,row)-.5)*(.5+shape.coastStrength);
    elevation+=(coast(col,row)-.5)*.37+(detail(col,row)-.5)*.13;
    // Explicit profiles protect straits; unrestricted worlds vary the strength of separation.
    if(shape)elevation-=shape.riftStrength*Math.max(0,1-(second-nearest)/separation);
    else if(type!=='pangaea'&&second-nearest<separation)elevation=Math.min(elevation,-.1);
    for(const b of basins)if(Math.hypot(dx(col,b.x)/b.rx,(row-b.y)/b.ry)<.8+(detail(col,row)-.5)*.2)elevation=shape?elevation-.3:Math.min(elevation,-.1);
    if(row===0||row===height-1||!wrapX&&(col===0||col===width-1))elevation-=.18;
    return elevation;
  };
  // A seeded sea level varies water coverage while retaining enough land for expansion.
  const heights=shape?Array.from({length:width*height},(_,id)=>elevationAt(id%width,Math.floor(id/width))):null;
  const seaLevel=shape?[...heights].sort((a,b)=>a-b)[Math.floor(heights.length*(1-shape.landFraction))]:.03;
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
    const q=col-Math.floor(row/2),r=row,elevation=heights?heights[row*width+col]:elevationAt(col,row);
    let ridge=0;
    for(const chain of ranges){const x=dx(col,chain.x),y=row-chain.y,along=x*Math.cos(chain.angle)+y*Math.sin(chain.angle),across=-x*Math.sin(chain.angle)+y*Math.cos(chain.angle),bend=Math.sin(along/Math.max(2,chain.length)*3+chain.phase)*chain.width*.8,pass=Math.sin(along/Math.max(2,chain.length)*8+chain.phase);const strength=Math.max(0,1-Math.abs(across-bend)/chain.width)*Math.max(0,1-Math.abs(along)/chain.length);ridge=Math.max(ridge,strength*(pass>chain.pass?.35:1));}
    const latitude=clamp(Math.abs(row/(height-1)*2-1)+(heat(col,row)-.5)*.2+(shape?.temperatureShift??0),0,1),moisture=rain(col,row)*.85+detail(col,row)*.15+(shape?.rainShift??0)+WORLD_RAINFALL[rainfall].moistureShift;
    let terrain=elevation<seaLevel?'ocean':ridge>(shape?.mountainThreshold??.38)&&rough(col,row)>.25?'mountain':latitude>.91?'snow':latitude>.73?'tundra':moisture<.32?'desert':moisture<.56?'plains':'grass';
    const hill=!['ocean','mountain'].includes(terrain)&&(ridge>.16||rough(col,row)>.66);
    const feature=!['ocean','mountain','snow','desert'].includes(terrain)&&moisture>.48&&rng()<.62?(latitude<.4&&moisture>.67?'jungle':'forest'):null;
    tiles.push({id:tiles.length,q,r,col,row,terrain,hill,feature,resource:null,river:false,riverEdges:[],owner:null,cityId:null,district:null,improvement:null,ruin:false,camp:false,variant:Math.floor(rng()*1000)});
  }
  const map=indexMap({width,height,tiles,seed:String(seed),type,wrapX});
  // Classify all water from an immutable land mask; coast must not propagate into ocean.
  const markCoasts=()=>{const depths=waterDepths(map);for(const t of tiles)if(isWater(t))t.terrain=depths.get(t.id)<=SHALLOW_WATER_LIMIT?'coast':'ocean';};
  markCoasts();
  for(const t of tiles){
    if(t.terrain==='mountain')continue;
    if(isWater(t)){if(t.terrain==='coast'&&rng()<.23)t.resource='fish';continue;}
    if(rng()<.28){
      const pool=t.terrain==='snow'?['uranium','oil']:t.terrain==='tundra'?['deer','iron','uranium']:t.terrain==='desert'?['gold','oil','stone']:t.hill?['iron','stone','gems','gold']:t.feature?['deer','spices','silk']:['wheat','cattle','horses'];
      t.resource=pool[Math.floor(rng()*pool.length)];
    }
    if(rng()<.014&&!['snow','desert'].includes(t.terrain))t.ruin=true;
  }
  const fertile=t=>!isWater(t)&&!['mountain','snow','desert'].includes(t.terrain)&&t.col>2&&t.col<width-3&&t.row>2&&t.row<height-3;
  const walkable=t=>!isWater(t)&&t.terrain!=='mountain',componentArea=new Map();
  for(const t of tiles){if(!walkable(t)||componentArea.has(t.id))continue;const group=[t];componentArea.set(t.id,0);for(let i=0;i<group.length;i++)for(const n of neighbors(map,group[i]))if(walkable(n)&&!componentArea.has(n.id)){componentArea.set(n.id,0);group.push(n);}for(const n of group)componentArea.set(n.id,group.length);}
  const adjacentLand=t=>neighbors(map,t).filter(n=>!isWater(n)&&n.terrain!=='mountain').length;
  const roomy=tiles.filter(t=>walkable(t)&&componentArea.get(t.id)>=Math.min(48,Math.max(8,Math.floor(width*height/count*.14)))&&adjacentLand(t)>=3);
  const viable=roomy.length>=count?roomy:tiles.filter(t=>walkable(t)&&adjacentLand(t)>=3),warm=viable.filter(fertile);
  const candidates=warm.length>=count?warm:viable;
  const starts=[],guaranteedResources=new Set();
  const startPools=[candidates,viable,tiles.filter(t=>!isWater(t))];
  const spacing=Math.max(13,Math.min(28,Math.round(Math.sqrt(width*height/count)*.9)));
  for(let i=0;i<count;i++){
    let best=null,bestScore=-Infinity;
    for(const pool of startPools){
      for(const t of pool){
        if(starts.includes(t.id))continue;
        const nearest=starts.length?Math.min(...starts.map(id=>distance(t,tiles[id]))):spacing;
        if(nearest<4)continue;
        const score=Math.min(nearest,spacing)*10+neighbors(map,t).filter(fertile).length*1.7+rng()*2;
        if(score>bestScore){bestScore=score;best=t;}
      }
      if(best)break;
    }
    if(!best)throw new RangeError('Not enough separated starting land for this map size.');
    // Improve starting land without filling the straits that define an island world.
    best.terrain='grass';best.feature=null;best.camp=false;best.ruin=false;
    const ns=neighbors(map,best);
    for(const t of ns.filter(t=>!isWater(t)).slice(0,4)){if(t.terrain==='mountain'||t.terrain==='snow')t.terrain='plains';t.camp=false;}
    const food=ns.find(t=>!isWater(t)&&t.terrain!=='mountain');if(food){food.resource='wheat';guaranteedResources.add(food.id);}
    const strategic=ns.find(t=>t!==food&&!isWater(t)&&t.terrain!=='mountain');if(strategic){strategic.resource=i%2?'iron':'horses';guaranteedResources.add(strategic.id);}
    starts.push(best.id);
  }
  // Starting neighborhoods can create land and therefore change nearby water depth.
  markCoasts();
  for(const t of tiles)if(t.resource==='fish'&&!isWater(t))t.resource=null;
  generateRivers(map,rng,WORLD_RAINFALL[rainfall].riverDensity);
  for(const t of tiles){if(!isWater(t)&&!['mountain','snow'].includes(t.terrain)&&starts.every(id=>distance(t,tiles[id])>5)&&rng()<.015){t.camp=true;t.ruin=false;}}
  // Thin the original deposits independently after all geography/start RNG is consumed.
  const retention=RESOURCE_ABUNDANCE[abundance].retention;
  for(const t of tiles)if(t.resource&&!guaranteedResources.has(t.id)&&seedNumber(seed+':resource-abundance:v1:'+t.id)/4294967296>=retention)t.resource=null;
  map.starts=starts;return map;
}
