import * as THREE from './vendor/three/three.module.js';
import {districtStage} from '/rules.mjs';

export const FACILITY_FRAMES=['farm','pasture','camp','plantation','mine','quarry','fishery','well','lumbermill','campus','library','university','lab','holy','shrine','temple','industrial','workshop','factory','powerplant','commercial','bank','harbor','theater'];
export const MODERNIZATION_FRAMES=['spaceport','nuclear','market','exchange','lighthouse','shipyard','seaport','amphitheater','museum','opera','broadcast','coalplant','oilplant','powerplant','entertainment','stadium','city-ancient','city-classical','city-medieval','city-industrial','city-modern','city-information','horse-ranch','sericulture'];
export function ensureModernization(renderer){
  if(renderer.modernizationLoading)return;
  if(!renderer.game?.cities.some(c=>!renderer.game.map.tiles[c.tile].hidden)&&!renderer.game?.map.tiles.some(t=>!t.hidden&&MODERNIZATION_FRAMES.includes(facilityFrame(t))))return;
  renderer.modernizationLoading=true;
  const art=new Promise((resolve,reject)=>{renderer.modernizationTexture=new THREE.TextureLoader().load('/assets/modernization/atlas-v2.webp',resolve,undefined,reject);}),texture=renderer.modernizationTexture;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.gpu.capabilities.getMaxAnisotropy());
  Promise.all([art,fetch('/assets/modernization/frames-v2.json').then(r=>{if(!r.ok)throw Error('Modernization frame metadata failed');return r.json();})]).then(([,bounds])=>{if(bounds.length!==MODERNIZATION_FRAMES.length)throw Error('Invalid modernization frames');renderer.modernizationBounds=bounds;renderer.modernizationReady=true;if(renderer.game)renderer.buildStructures();renderer.dirty=true;}).catch(error=>{renderer.modernizationError=true;console.error(error);});
}
const groundCover=new Set(['farm','pasture','camp','plantation','quarry','fishery','horse-ranch','sericulture']);
export function facilityPlacement(frame){return {width:frame?.startsWith('city-')?55:frame==='spaceport'?43:groundCover.has(frame)?38:39,anchorY:groundCover.has(frame)?.59:.80};}
export function billboardDepthLift(renderer,x,y,z,width,groundOffset){
  let depthLift=8;
  for(let sample=0;sample<2;sample++){const bottomZ=z+groundOffset*.6+depthLift*.8,surface=Math.max(...[-.45,0,.45].map(f=>renderer.surfaceHeight(x+width*f,bottomZ)));depthLift=Math.max(depthLift,(surface-y+groundOffset*.8+.45)/.6);}
  return depthLift;
}
export function facilityBounds(image){
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,w=canvas.width,h=canvas.height,visited=new Uint8Array(w*h),queue=new Int32Array(w*h),bounds=[];
  for(let start=0;start<w*h;start++){
    if(visited[start]||pixels[start*4+3]<28)continue;
    let count=1,sumX=0,sumY=0,left=w,right=0,top=h,bottom=0;queue[0]=start;visited[start]=1;
    for(let j=0;j<count;j++){const id=queue[j],x=id%w,y=Math.floor(id/w);sumX+=x;sumY+=y;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(const next of [x? id-1:-1,x<w-1?id+1:-1,y?id-w:-1,y<h-1?id+w:-1])if(next>=0&&!visited[next]&&pixels[next*4+3]>=28){visited[next]=1;queue[count++]=next;}
    }
    if(count<120)continue;const col=Math.min(5,Math.floor(sumX/count/(w/6))),row=Math.min(3,Math.floor(sumY/count/(h/4))),cell=row*6+col;
    if(!bounds[cell]||bounds[cell].count<count)bounds[cell]={left:Math.max(0,left-2),right:Math.min(w,right+3),top:Math.max(0,top-2),bottom:Math.min(h,bottom+3),count};
  }
  return FACILITY_FRAMES.map((_,i)=>bounds[i]||{left:i%6*w/6,right:(i%6+1)*w/6,top:Math.floor(i/6)*h/4,bottom:(Math.floor(i/6)+1)*h/4});
}
export function facilityFrame(tile,city){
  if(tile.improvement==='pasture'&&tile.resource==='horses')return 'horse-ranch';
  if(tile.improvement==='plantation'&&tile.resource==='silk')return 'sericulture';
  const item=tile.district?.item||tile.improvement,stage=tile.district?.stage||districtStage(item,city);
  return FACILITY_FRAMES.includes(stage)||MODERNIZATION_FRAMES.includes(stage)?stage:null;
}

// Shared atlas billboards sit in the 3D world and retain terrain depth and shadows.
export function facilityMeshes(renderer,entries,modern=false){
  const frames=modern?MODERNIZATION_FRAMES:FACILITY_FRAMES,atlasBounds=modern?renderer.modernizationBounds:renderer.facilityBounds;
  const positions=[],uvs=[],normals=[],cos=Math.sqrt(1-.6*.6),texture=modern?renderer.modernizationTexture:renderer.facilityTexture;
  const uv=texture.image?{x:.5/texture.image.width,y:.5/texture.image.height}:{x:0,y:0};
  const counts=Object.fromEntries(frames.map(name=>[name,0]));if(modern)renderer.modernizationFrameCounts=counts;else renderer.facilityFrameCounts=counts;
  const buckets=new Map();
  for(const entry of entries){const key=Math.floor(entry.x/480)+':'+Math.floor(entry.z/360)+':'+!!entry.remembered;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(entry);counts[entry.frame]++;}
  for(const bucket of buckets.values()){
    positions.length=uvs.length=normals.length=0;
    for(const e of bucket){
      const cell=frames.indexOf(e.frame),bounds=atlasBounds[cell],left=bounds.left/texture.image.width+uv.x,right=bounds.right/texture.image.width-uv.x,top=1-bounds.top/texture.image.height-uv.y,bottom=1-bounds.bottom/texture.image.height+uv.y;
      const placement=facilityPlacement(e.frame),width=e.width??placement.width,anchorY=e.anchorY??placement.anchorY,height=width*(bounds.bottom-bounds.top)/(bounds.right-bounds.left),groundOffset=height*(1-anchorY);
      // Move along the viewing axis: projected scale/anchor stay identical while
      // the complete painted ground footprint clears the actual terrain depth.
      const depthLift=billboardDepthLift(renderer,e.x,e.y,e.z,width,groundOffset);
      const corners=[[-width/2,0,left,bottom],[width/2,0,right,bottom],[-width/2,height,left,top],[width/2,height,right,top]];
      for(const i of [0,1,2,2,1,3]){const [x,h,u,v]=corners[i],rise=h-groundOffset;positions.push(e.x+x,e.y+rise*cos+depthLift*.6,e.z-rise*.6+depthLift*cos);normals.push(0,.6,cos);uvs.push(u,v);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,toneMapped:false});
    if(bucket[0].remembered){material.opacity=.65;material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=vec3(dot(diffuseColor.rgb,vec3(.299,.587,.114)));');};}
    const mesh=new THREE.Mesh(geometry,material);mesh.name=modern?'modernization-atlas':'facility-atlas';mesh.castShadow=true;renderer.structureGroup.add(mesh);
    mesh.userData.remembered=!!bucket[0].remembered;
  }
}
