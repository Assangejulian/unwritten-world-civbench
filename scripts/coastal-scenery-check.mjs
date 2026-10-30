import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../web/vendor/three/three.module.js';
import {RESOURCES} from '../src/rules.mjs';

// Load browser modules without a DOM, using their actual geometry and visibility logic.
async function browserModule(name){
  const source=(await readFile(new URL('../web/'+name,import.meta.url),'utf8'))
    .replace("'./vendor/three/three.module.js'",JSON.stringify(new URL('../web/vendor/three/three.module.js',import.meta.url).href))
    .replace("'/rules.mjs'",JSON.stringify(new URL('../src/rules.mjs',import.meta.url).href));
  return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const {resourceSceneryVisible,populateResources,RESOURCE_FRAMES}=await browserModule('resource-art.js'),{shoreProfile,groundMaterial}=await browserModule('terrain-art.js');
const checks=[],metrics={},pass=name=>{checks.push(name);console.log('PASS '+name);};
for(const [resource,spec]of Object.entries(RESOURCES)){
  const tile={resource,terrain:resource==='fish'?'coast':'grass',cityId:null,district:null,improvement:null};assert(resourceSceneryVisible(tile));
  assert(!resourceSceneryVisible({...tile,improvement:spec.improvement}));assert(!resourceSceneryVisible({...tile,improvement:'lumbermill'}));assert(!resourceSceneryVisible({...tile,hidden:true}));assert(!resourceSceneryVisible({...tile,cityId:0}));assert(!resourceSceneryVisible({...tile,district:{item:'campus'}}));
}
assert(!resourceSceneryVisible({resource:'fish',terrain:'grass'}));pass('Every completed improvement hides resource scenery; hidden, city, district, and dry fish plots stay clear');
const image={width:1280,height:1280},renderer={resourceReady:true,resourceTexture:new THREE.Texture(image),resourceBounds:RESOURCE_FRAMES.map((_,i)=>({left:i%4*320,right:i%4*320+320,top:Math.floor(i/4)*320,bottom:Math.floor(i/4)*320+320})),resourceGroup:new THREE.Group(),position:t=>({x:t.id*65,y:0}),heightAt:()=>3,game:{map:{tiles:RESOURCE_FRAMES.map((resource,id)=>({id,resource,terrain:resource==='fish'?'coast':'grass'}))}}};
populateResources(renderer);const vertices=renderer.resourceGroup.children.reduce((sum,mesh)=>sum+mesh.geometry.attributes.position.count,0);assert.equal(vertices,12*6);assert.equal(renderer.resourceFrameCounts.fish,1);assert(RESOURCE_FRAMES.every(key=>renderer.resourceFrameCounts[key]===1));pass('The fish pool has no billboard geometry; the twelve land resources retain their own artwork');
for(const tile of renderer.game.map.tiles)tile.improvement=RESOURCES[tile.resource].improvement;renderer.resourceGroup.clear();populateResources(renderer);assert.equal(renderer.resourceGroup.children.length,0);assert(Object.values(renderer.resourceFrameCounts).every(n=>n===0));pass('Completed quarries, mines, farms, and fisheries have no duplicate resource meshes');
globalThis.Path2D=class{constructor(path){this.path=path;}};const {drawResource}=await import('../web/visuals.js');const circles=[],context=new Proxy({},{get:(_,name)=>name==='arc'?(...args)=>circles.push(args):()=>{},set:()=>true});drawResource(context,{resource:'stone',improvement:'quarry'},{x:100,y:100},1.98,'');assert.equal(circles.length,1);assert(circles[0][2]<11);pass('A completed quarry still draws its small circular stone badge');
const radius=35,tiles=[{id:0,q:0,r:0,terrain:'grass'},{id:1,q:1,r:0,terrain:'coast'}],index=new Map(tiles.map(t=>[t.q+','+t.r,t])),position=t=>({x:radius*Math.sqrt(3)*(t.q+t.r/2),y:radius*1.5*t.r}),shore=shoreProfile(tiles,index,position,radius),edge=radius*Math.sqrt(3)/2;
assert.equal(shore.edges,1);assert(Math.abs(shore.distanceAt(edge,0,true))<.00001);assert(Math.abs(shore.distanceAt(edge+5,0,true)-5)<.00001);assert(Math.abs(shore.distanceAt(edge-5,0,false)+5)<.00001);assert(Math.abs(shore.distanceAt(edge+5,0,true)+shore.distanceAt(edge-5,0,false))<.00001);pass('Shore distances meet continuously across adjacent land and water tiles');
const unknown=tiles.map(t=>({...t,hidden:t.id===0})),unknownShore=shoreProfile(unknown,new Map(unknown.map(t=>[t.q+','+t.r,t])),position,radius);assert.equal(unknownShore.edges,0);assert.equal(unknownShore.distanceAt(edge,0,true),120);pass('Unknown shores do not appear as sand or surf through the fog');
const material=groundMaterial(new THREE.Texture(),new THREE.Texture()),shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);assert.equal(material.userData.resources,shader.uniforms.showResourceScenery);assert.equal(material.userData.time,shader.uniforms.waterTime);metrics.shader={vertexLength:shader.vertexShader.length,fragmentLength:shader.fragmentShader.length,cacheKey:material.customProgramCacheKey()};pass('Water animation and fish visibility controls reach the actual material uniforms');
const bytes=await readFile(new URL('../saves/autosave.json',import.meta.url)),backup=await readFile(new URL('../output/before-shore-resource-update.json',import.meta.url));metrics.save={turn:JSON.parse(bytes).turn,sha256:createHash('sha256').update(bytes).digest('hex'),matchesBackup:bytes.equals(backup)};
await writeFile(new URL('../output/coastal-scenery-checks.json',import.meta.url),JSON.stringify({passed:true,gameLaunched:false,checks,metrics},null,2));
