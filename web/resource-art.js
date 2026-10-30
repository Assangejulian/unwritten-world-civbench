import * as THREE from './vendor/three/three.module.js';
import {isWater} from '/rules.mjs';
import {billboardDepthLift} from './facility-art.js';

export const RESOURCE_FRAMES=['wheat','cattle','deer','fish','stone','iron','horses','gold','gems','spices','silk','oil','uranium'];
export function resourceSceneryVisible(tile){return !!tile.resource&&!tile.hidden&&tile.cityId==null&&!tile.district&&!tile.fort&&!tile.improvement&&(tile.resource!=='fish'||isWater(tile));}

// Preserve disconnected animals and plants within each atlas cell.
export function resourceBounds(image){
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,image.width,image.height).data,w=image.width,h=image.height;
  return RESOURCE_FRAMES.map((_,i)=>{
    const x0=Math.round(i%4*w/4),x1=Math.round((i%4+1)*w/4),y0=Math.round(Math.floor(i/4)*h/4),y1=Math.round((Math.floor(i/4)+1)*h/4);
    let left=x1,right=x0,top=y1,bottom=y0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*w+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    return {left,right,top,bottom};
  });
}

export function populateResources(renderer){
  renderer.resourceFrameCounts=Object.fromEntries(RESOURCE_FRAMES.map(name=>[name,0]));
  if(!renderer.resourceReady)return;
  const texture=renderer.resourceTexture,buckets=new Map(),cos=.8;
  for(const tile of renderer.game.map.tiles){
    if(!resourceSceneryVisible(tile))continue;
    // Fish shadows are part of the water shader; the atlas pool is never displayed.
    if(tile.resource==='fish'){renderer.resourceFrameCounts.fish++;continue;}
    const p=renderer.position(tile),cell=RESOURCE_FRAMES.indexOf(tile.resource);if(cell<0)continue;
    const chunk=Math.floor(p.x/480)+':'+Math.floor(p.y/360);if(!buckets.has(chunk))buckets.set(chunk,[]);
    buckets.get(chunk).push({tile,p,cell});renderer.resourceFrameCounts[tile.resource]++;
  }
  for(const bucket of buckets.values()){
    const positions=[],uvs=[];
    for(const {tile,p,cell}of bucket){
      const bounds=renderer.resourceBounds[cell],width=['horses','cattle','deer'].includes(tile.resource)?33:28,height=width*(bounds.bottom-bounds.top)/(bounds.right-bounds.left),offset=height*.24;
      const left=(bounds.left+.5)/texture.image.width,right=(bounds.right-.5)/texture.image.width,top=1-(bounds.top+.5)/texture.image.height,bottom=1-(bounds.bottom-.5)/texture.image.height;
      const corners=[[-width/2,0,left,bottom],[width/2,0,right,bottom],[-width/2,height,left,top],[width/2,height,right,top]];
      const groundY=renderer.heightAt(tile)+.3,depthLift=billboardDepthLift(renderer,p.x,groundY,p.y,width,offset);
      for(const i of [0,1,2,2,1,3]){const [x,y,u,v]=corners[i],rise=y-offset;positions.push(p.x+x,groundY+rise*cos+depthLift*.6,p.y-rise*.6+depthLift*cos);uvs.push(u,v);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.15,side:THREE.DoubleSide,toneMapped:false});
    const mesh=new THREE.Mesh(geometry,material);mesh.name='resource-atlas';renderer.resourceGroup.add(mesh);
  }
}
