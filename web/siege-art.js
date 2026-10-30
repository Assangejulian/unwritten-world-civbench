import {cityWallTier} from '/rules.mjs';
import * as THREE from './vendor/three/three.module.js';
const images=new Map();
const textures=new WeakMap();
export const WALL_SPLIT=.55;
export function cityCorePlacement(city){return cityWallTier(city)?{width:46,anchorY:.74}:{width:55,anchorY:.80};}
function asset(renderer,key){let image=images.get(key);if(image===undefined){image=new Image();images.set(key,image);image.onload=()=>{if(key==='missilesilo'&&renderer.buildStructures)renderer.buildStructures();renderer.dirty=true;};image.onerror=()=>images.set(key,null);image.src='/assets/'+(key==='missilesilo'?'air-warfare':'siege-aviation')+'/'+key+'.webp';}return image?.complete&&image.naturalWidth?image:null;}
// Shared cached bitmaps are requested only when a structure enters the viewport.
export function drawCityWalls(renderer,c,city){const tier=cityWallTier(city);if(!tier||renderer.zoom<.35)return;const image=asset(renderer,tier.key);if(!image)return;const p=renderer.screen(renderer.game.map.tiles[city.tile]),width=70*renderer.zoom,height=width*image.naturalHeight/image.naturalWidth;c.save();c.globalAlpha*=city.walls>0?1:.32;if(city.walls<=0)c.filter='grayscale(1)';c.drawImage(image,0,image.naturalHeight*WALL_SPLIT,image.naturalWidth,image.naturalHeight*(1-WALL_SPLIT),p.x-width/2,p.y+height*(WALL_SPLIT-.54),width,height*(1-WALL_SPLIT));c.restore();}
export function ensureWallArt(renderer){
  let owned=textures.get(renderer);if(!owned){owned=new Map();textures.set(renderer,owned);}
  for(const city of (renderer.structureCities||renderer.game.cities)){const tile=renderer.game.map.tiles[city.tile],key=cityWallTier(city)?.key;if(!key||owned.has(key)||tile.hidden||!renderer.inView(tile))continue;const texture=new THREE.TextureLoader().load('/assets/siege-aviation/'+key+'.webp',()=>{images.set(key,texture.image);if(renderer.game)renderer.buildStructures();renderer.dirty=true;});texture.colorSpace=THREE.SRGBColorSpace;owned.set(key,texture);}
  return owned;
}
export function wallRearMeshes(renderer){
  for(const [tierKey,texture]of ensureWallArt(renderer)){
    if(!texture.image?.width)continue;const buckets=new Map(),height=70*texture.image.height/texture.image.width;
    for(const city of (renderer.structureCities||renderer.game.cities)){const tile=renderer.game.map.tiles[city.tile];if(tile.hidden||cityWallTier(city)?.key!==tierKey)continue;const p=renderer.position(tile),key=Math.floor(p.x/480)+':'+Math.floor(p.y/360),vertices=buckets.get(key)||[];buckets.set(key,vertices);for(const [x,v]of [[-35,WALL_SPLIT],[35,WALL_SPLIT],[-35,0],[-35,0],[35,WALL_SPLIT],[35,0]]){const rise=height*(.54-v);vertices.push(p.x+x,renderer.heightAt(tile)+rise*.8+4.8,p.y-rise*.6+6.4,(x+35)/70,1-v);}}
    for(const [key,vertices]of buckets){const positions=[],uvs=[];for(let i=0;i<vertices.length;i+=5){positions.push(...vertices.slice(i,i+3));uvs.push(...vertices.slice(i+3,i+5));}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3*4).fill(1),4));geometry.computeBoundingSphere();const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,toneMapped:false,vertexColors:true});material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n#ifdef USE_COLOR_ALPHA\nif(vColor.a<.5)diffuseColor.rgb=vec3(dot(diffuseColor.rgb,vec3(.299,.587,.114)));\n#endif');};const mesh=new THREE.Mesh(geometry,material);mesh.name='city-wall-rear';mesh.userData.wallCities=(renderer.structureCities||renderer.game.cities).filter(city=>{const tile=renderer.game.map.tiles[city.tile],p=renderer.position(tile);return !tile.hidden&&cityWallTier(city)?.key===tierKey&&Math.floor(p.x/480)+':'+Math.floor(p.y/360)===key;}).map(city=>city.id);renderer.structureGroup.add(mesh);}
  }
  updateWallRearHealth(renderer);
}
export function updateWallRearHealth(renderer){
  const cities=new Map((renderer.structureCities||renderer.game.cities).map(city=>[city.id,city]));
  for(const mesh of renderer.structureGroup.children){if(mesh.name!=='city-wall-rear')continue;const flags=mesh.userData.wallCities.map(id=>cities.get(id)?.walls>0),key=flags.join(':');if(mesh.userData.wallHealth===key)continue;mesh.userData.wallHealth=key;const color=mesh.geometry.attributes.color;flags.forEach((intact,index)=>{for(let vertex=0;vertex<6;vertex++)color.setW(index*6+vertex,intact?1:.32);});color.needsUpdate=true;}
}
export function drawAirport(renderer,c,t){if(t.district?.item!=='airport'||renderer.zoom<.35)return;const image=asset(renderer,'airport');if(!image)return;const p=renderer.screen(t),width=53*renderer.zoom,height=width*image.naturalHeight/image.naturalWidth;c.save();if(t.pillaged)c.filter='grayscale(1) brightness(.55)';c.globalAlpha=t.visible===false?.65:1;c.drawImage(image,p.x-width/2,p.y-height*.70,width,height);c.restore();}
export function missileSiloArtReady(){const image=images.get('missilesilo');return !!image?.complete&&!!image.naturalWidth;}
export function drawMissileSilo(renderer,c,t){if(t.hidden||t.district?.item!=='missilesilo'||renderer.zoom<.35)return false;const image=asset(renderer,'missilesilo');if(!image)return false;const p=renderer.screen(t),width=49*renderer.zoom,height=width*image.naturalHeight/image.naturalWidth;c.save();if(t.pillaged)c.filter='grayscale(1) brightness(.55)';c.globalAlpha=t.visible===false?.65:1;c.drawImage(image,p.x-width/2,p.y-height*.80,width,height);c.restore();return true;}
export function siegeArtStatus(){return Object.fromEntries([...images].map(([key,image])=>[key,!!image?.complete&&!!image.naturalWidth]));}
