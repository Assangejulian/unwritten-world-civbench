import {cameraElapsed,cameraEase} from './frame-pacing.js';
import {drawChartFog} from './chart-fog.js';
import {veteranChoices} from '/rules.mjs';
import {drawEncounterArt,drawCityStateLabel,encounterArtKind} from './encounter-art.js';
import {drawRuin} from './ruin-art.js';
import {drawNaturalWonder} from './natural-wonder-art.js';
import {drawWorldWonder,drawUniqueDistrictStructure,drawUniqueCityStructures,uniqueDistrictKey,UNIQUE_STRUCTURE_ART} from './unique-structures.js';
import {cityLabelSize,drawCityLabel,drawCityPressure} from './city-label.js';
import * as THREE from './vendor/three/three.module.js';
import {MapRenderer as BaseRenderer,R,SQ,SY,DEFAULT_ZOOM,UNIT_ATLAS_TYPES,EXTRA_UNIT_TYPES,UNIT_SYMBOLS,unitGlyph,drawUnitBadge} from './map.js';
import {TERRAINS,RESOURCES,UNITS,TECHS,DIRECTIONS,civilizationEra,isWater,unitTransport,cityWallTier} from '/rules.mjs';
import {UNIT_MOTIONS,RESOURCE_MARKS,drawResource} from './visuals.js';
import {ModelLibrary} from './model-library.js';
import {mountainGeometry,pineGeometry,leafGeometry,groundMaterial,mountainMaterial,surfaceWeights,surfaceDetail,hillRelief,TERRAIN_MATERIALS,ContactPass,waterways,shoreProfile} from './terrain-art.js';
import {populateStructures} from './world-buildings.js';
import {drawCityWalls,drawAirport,drawMissileSilo,updateWallRearHealth,ensureWallArt} from './siege-art.js';
import {drawSpaceLaunch} from './space-launch.js';
import {drawFortification} from './fortification-art.js';
import {visibleRiverEdges} from '/river-network.mjs';
import {facilityBounds} from './facility-art.js';
import {resourceBounds,populateResources,resourceSceneryVisible} from './resource-art.js';
import {UNIT_RIGS,UnitSpriteLibrary,initialHeading,createJourney,sampleJourney,facingTransform,angleDelta,drawTravelEffects,aircraftAltitude} from './unit-animation.js';
import {sceneryClearance} from './world-clearance.js';
import {worldBounds,wholeWorldZoom,constrainCamera,visibleWorldCopies,canonicalColumn} from './world-camera.js';
import {drawAttack,attackTiming,meleeApproach} from './unit-combat.js';
import {PaintedCombatAtlas,PAINTED_UNITS} from './painted-actions.js';
import {scheduleActions} from './action-schedule.js';
import {spatialMeshes,addSpatialMeshes} from './spatial-meshes.js';
import {WorldSprites} from './world-sprites.js';
import {relitFrame,drawSunShadow,relightStats} from './sprite-relight.js';
import {WORLD_LIGHTING,bakeWorldLighting,bindWorldLighting,smoothGroundNormals} from './world-lighting.js';
// Idle poses retain their low cadence; active positions may refresh at the presentation ceiling.
const IDLE_FPS=12,ROUTE_FPS=8,IDLE_MIN_ZOOM=.35;
export {UNIT_SYMBOLS,unitGlyph,drawUnitBadge};

const palette={ocean:'#173e58',coast:'#459f9f',grass:'#8eaa56',plains:'#baa45d',desert:'#c8b077',tundra:'#839577',snow:'#dedfd3',mountain:'#8b9271'};
const random=n=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
const COS=Math.sqrt(1-SY*SY);
const temporary=new THREE.Object3D();
const shade=new THREE.Color();
const key=(x,z)=>`${Math.round(x*100)},${Math.round(z*100)}`;
const elevation=t=>t.hidden?0:isWater(t)?0:3+(t.hill?9:0)+(t.terrain==='mountain'?10:0);
const LAND_SUBDIVISIONS=4;
const SHORE_WATER_SUBDIVISIONS=2;

function release(group){
  for(const item of [...group.children]){if(item.children?.length)release(item);group.remove(item);item.dispose?.();item.geometry?.dispose();if(Array.isArray(item.material))item.material.forEach(m=>m.dispose());else item.material?.dispose();}
}
function segments(points,color,opacity=1){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  return new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
}
function instances(geometry,entries,material){
  if(!entries.length){geometry.dispose();material.dispose();return null;}
  const mesh=new THREE.InstancedMesh(geometry,material,entries.length);
  entries.forEach((entry,index)=>{temporary.position.set(...entry.position);temporary.scale.set(...(entry.scale||[1,1,1]));temporary.rotation.set(...(entry.rotation||[0,0,0]));temporary.updateMatrix();mesh.setMatrixAt(index,temporary.matrix);if(entry.color)mesh.setColorAt(index,shade.set(entry.color));});
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();return mesh;
}

export class MapRenderer extends BaseRenderer{
  constructor(canvas,minimap,onSelect,onHover){
    super(canvas,minimap,onSelect,onHover);
    this.cityTerritory=new Map();this.cityEdges=[];this.unitsById=new Map();this.movingUnits=[];
    this.groundCanvas=document.createElement('canvas');this.groundCanvas.id='terrain-3d';this.groundCanvas.setAttribute('aria-hidden','true');canvas.before(this.groundCanvas);
    this.gpu=new THREE.WebGLRenderer({canvas:this.groundCanvas,antialias:true,powerPreference:'high-performance'});
    this.gpu.setPixelRatio(Math.min(devicePixelRatio,1.75));this.gpu.outputColorSpace=THREE.SRGBColorSpace;this.gpu.shadowMap.enabled=true;this.gpu.shadowMap.type=THREE.PCFSoftShadowMap;this.gpu.shadowMap.autoUpdate=false;
    this.gpu.toneMapping=THREE.ACESFilmicToneMapping;this.gpu.toneMappingExposure=WORLD_LIGHTING.exposure;this.contactPass=new ContactPass(this.gpu);
    this.scene=new THREE.Scene();this.chartCanvas=document.createElement('canvas');this.chartTexture=new THREE.CanvasTexture(this.chartCanvas);this.chartTexture.colorSpace=THREE.SRGBColorSpace;this.scene.background=this.chartTexture;
    this.camera=new THREE.OrthographicCamera(-500,500,300,-300,1,16000);
    this.scene.add(new THREE.HemisphereLight(WORLD_LIGHTING.sky,WORLD_LIGHTING.bounce,WORLD_LIGHTING.skyIntensity));
    this.sun=new THREE.DirectionalLight(WORLD_LIGHTING.sunColor,WORLD_LIGHTING.sunIntensity);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-480;this.sun.shadow.camera.right=480;this.sun.shadow.camera.top=480;this.sun.shadow.camera.bottom=-480;this.sun.shadow.camera.far=2500;this.sun.shadow.normalBias=1.5;this.sun.shadow.bias=-.0003;
    this.scene.add(this.sun,this.sun.target);
    this.terrainGroup=new THREE.Group();this.structureGroup=new THREE.Group();this.borderGroup=new THREE.Group();this.resourceGroup=new THREE.Group();this.scene.add(this.terrainGroup,this.structureGroup,this.borderGroup,this.resourceGroup);
    this.worldSprites=new WorldSprites(this);this.groundMarksCanvas=document.createElement('canvas');
    this.terrainTexture=new THREE.TextureLoader().load('/assets/terrain-materials.png',()=>{this.textureReady=true;this.dirty=true;});this.terrainTexture.colorSpace=THREE.SRGBColorSpace;this.terrainTexture.anisotropy=Math.min(8,this.gpu.capabilities.getMaxAnisotropy());
    this.biomeTexture=new THREE.TextureLoader().load('/assets/terrain-biomes-v2.png',()=>{this.biomeReady=true;this.dirty=true;});this.biomeTexture.colorSpace=THREE.SRGBColorSpace;this.biomeTexture.anisotropy=this.terrainTexture.anisotropy;
    this.facilityTexture=new THREE.TextureLoader().load('/assets/facility-atlas.png',()=>{this.facilityBounds=facilityBounds(this.facilityTexture.image);this.facilityReady=true;if(this.game)this.buildStructures();this.dirty=true;});this.facilityTexture.colorSpace=THREE.SRGBColorSpace;this.facilityTexture.anisotropy=Math.min(8,this.gpu.capabilities.getMaxAnisotropy());
    this.waterTexture=new THREE.TextureLoader().load('/assets/water-normal.jpg',()=>{this.waterReady=true;this.dirty=true;});this.waterTexture.wrapS=this.waterTexture.wrapT=THREE.RepeatWrapping;
    this.resourceTexture=new THREE.TextureLoader().load('/assets/resource-atlas.png',()=>{this.resourceBounds=resourceBounds(this.resourceTexture.image);this.resourceReady=true;if(this.game)this.buildResources();this.dirty=true;});this.resourceTexture.colorSpace=THREE.SRGBColorSpace;
    this.models=new ModelLibrary();this.models.load().then(()=>{this.modelsReady=true;if(this.game)this.buildStructures();this.dirty=true;});
    this.unitSprites=new UnitSpriteLibrary(!this.reduced);this.unitSprites.onReady=()=>{this.dirty=true;};this.unitJourneys=new Map();this.unitFacings=new Map();this.unitTurns=new Map();
    this.unitSprites.painted.load(type=>{for(const [key,frame]of this.unitSprites.frames)if(key.startsWith(type+':')&&!frame.transport)this.unitSprites.frames.delete(key);this.dirty=true;});this.unitSprites.transports.load(()=>{this.dirty=true;});this.combatSprites=new PaintedCombatAtlas();this.combatSprites.load(()=>{this.dirty=true;});
    this.atlas=new Image();this.atlas.onload=()=>{this.unitSprites.register(this.atlas,UNIT_ATLAS_TYPES,5,4);this.artReady=true;this.dirty=true;};this.atlas.onerror=()=>{this.artError=true;console.error('The generated unit atlas could not be loaded.');};this.atlas.src='/assets/unit-atlas.png';
    this.extraAtlas=new Image();this.extraAtlas.onload=()=>{this.unitSprites.register(this.extraAtlas,EXTRA_UNIT_TYPES,4,2);this.extraArtReady=true;this.dirty=true;};this.extraAtlas.src='/assets/unit-extra-atlas.png';
    this.showGrid=false;this.showResources=true;this.setBorderStyle(localStorage.getItem('hex-civilizations-border-style')||'soft');this.effects=[];this.renderedFrames=0;this.resize();
  }
  resize(){super.resize();if(this.gpu){const ratio=Math.min(devicePixelRatio||1,1.75,Math.sqrt(2400000/Math.max(1,this.width*this.height)));this.gpu.setPixelRatio(ratio);this.gpu.setSize(this.width,this.height,false);const size=this.gpu.getDrawingBufferSize(new THREE.Vector2());this.contactPass?.resize(size.x,size.y);if(this.chartCanvas){this.chartCanvas.width=Math.min(1400,Math.max(1,this.width));this.chartCanvas.height=Math.max(1,Math.round(this.height*this.chartCanvas.width/Math.max(1,this.width)));this.drawChartBackdrop(this.chartCanvas.getContext('2d'),this.chartCanvas.width,this.chartCanvas.height);this.chartTexture.needsUpdate=true;}this.groundFrameKey=null;this.dirty=true;}}
  heightAt(t){return this.heights?.get(t.id)??elevation(t);}
  surfaceHeight(x,z){
    const r=(z-90)/(R*1.5),q=(x-75)/(R*SQ)-r/2;let rx=Math.round(q),rz=Math.round(r),ry=Math.round(-q-r);const dx=Math.abs(rx-q),dy=Math.abs(ry+q+r),dz=Math.abs(rz-r);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dz>dy)rz=-rx-ry;
    const tile=this.index.get(`${rx},${rz}`);if(!tile)return 0;const p=this.position(tile);if(this.game.map.wrapX){const period=R*SQ*this.game.map.width;x-=Math.round((x-p.x)/period)*period;}const px=x-p.x,pz=z-p.y;
    for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180,b=(i*60+30)*Math.PI/180,ax=Math.cos(a)*R,az=Math.sin(a)*R,bx=Math.cos(b)*R,bz=Math.sin(b)*R,det=ax*bz-bx*az,u=(px*bz-bx*pz)/det,v=(ax*pz-px*az)/det;if(u>=-.0001&&v>=-.0001&&u+v<=1.0001){const va=this.cornerVertices.get(key(p.x+ax,p.y+az)),vb=this.cornerVertices.get(key(p.x+bx,p.y+bz));return this.triangleHeight(tile,p,va,vb,Math.max(0,u),Math.max(0,v));}}
    return this.heightAt(tile);
  }
  triangleHeight(tile,p,a,b,u,v){
    const n=!tile.hidden&&!isWater(tile)&&tile.hill?LAND_SUBDIVISIONS:1;
    const sample=(uu,vv)=>this.heightAt(tile)*(1-uu-vv)+a.height*uu+b.height*vv+hillRelief(tile,uu,vv,(a.x-p.x)*uu+(b.x-p.x)*vv,(a.z-p.y)*uu+(b.z-p.y)*vv);
    if(n===1)return sample(u,v);
    const i=Math.min(n-1,Math.floor(u*n)),j=Math.min(n-1-i,Math.floor(v*n)),fu=u*n-i,fv=v*n-j;
    if(fu+fv<=1)return sample(i/n,j/n)*(1-fu-fv)+sample((i+1)/n,j/n)*fu+sample(i/n,(j+1)/n)*fv;
    return sample((i+1)/n,(j+1)/n)*(fu+fv-1)+sample((i+1)/n,j/n)*(1-fv)+sample(i/n,(j+1)/n)*(1-fu);
  }
  screen(t){const p=super.screen(t);p.x+=(this.renderOffset||0)*this.zoom;p.y-=this.heightAt(t)*COS*this.zoom;return p;}
  projectGround(x,z){return {x:(x+(this.renderOffset||0)-this.cam.x)*this.zoom+this.width/2,y:(z-this.cam.y)*this.zoom*SY+this.height/2-this.surfaceHeight(x,z)*COS*this.zoom};}
  screenNear(tile,reference){const p=this.screen(tile);if(this.game.map.wrapX){const period=R*SQ*this.game.map.width*this.zoom;p.x+=Math.round((reference.x-p.x)/period)*period;}return p;}
  resourceAnchor(tile){const p=this.position(tile);return this.projectGround(p.x,p.y+17);}
  applyCameraBounds(){
    this.cameraBounds=this.chartBounds||worldBounds(this.game.map,R);this.wrapWorld=this.game.map.wrapX??(this.game.visuals?.view===-1&&!this.game.map.tiles.some(t=>t.hidden||t.visible===false));
    this.minimumZoom=wholeWorldZoom(this.cameraBounds,this.width,this.height,SY);this.zoom=Math.max(this.minimumZoom,Math.min(2.8,this.zoom));
    this.cam=constrainCamera(this.cam,this.zoom,this.width,this.height,this.cameraBounds,this.wrapWorld,SY,this.chartInsets);
    this.visibleCopies=visibleWorldCopies(this.cam,this.zoom,this.width,this.cameraBounds,this.wrapWorld);
  }
  syncWorldCopies(){
    const revision=[this.terrainRevision,this.structureRevision,this.resourceRevision,this.borderRevision].join(':');
    this.worldCopies??=new Map();
    for(const [cycle,root]of this.worldCopies)if(revision!==this.copyRevision||!this.visibleCopies.includes(cycle)){
      root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});this.scene.remove(root);this.worldCopies.delete(cycle);
    }
    this.copyRevision=revision;
    for(const cycle of this.visibleCopies){
      if(!cycle)continue;
      if(!this.worldCopies.has(cycle)){const root=new THREE.Group();root.position.x=cycle*this.cameraBounds.period;for(const group of [this.terrainGroup,this.structureGroup,this.resourceGroup])root.add(group.clone(true));this.scene.add(root);this.worldCopies.set(cycle,root);this.gpu.shadowMap.needsUpdate=true;}
      const root=this.worldCopies.get(cycle);root.children[2].visible=this.showResources;
      // Replica meshes keep their own frustum result; the original may be off-screen.
      root.children[0].children.forEach((o,i)=>{if(this.terrainGroup.children[i]===this.gridMesh)o.visible=this.showGrid;});
    }
  }
  viewportTiles(padding=0){
    const a=this.world(-120-padding,-150-padding),b=this.world(this.width+120+padding,this.height+150+padding),map=this.game.map,offset=this.renderOffset||0,result=[];
    const lo=Math.max(0,Math.floor((a.y-90)/(R*1.5))-1),hi=Math.min(map.height-1,Math.ceil((b.y-90)/(R*1.5))+1);
    const left=Math.max(0,Math.floor((a.x-offset-75)/(R*SQ))-1),right=Math.min(map.width-1,Math.ceil((b.x-offset-75)/(R*SQ))+1);
    for(let row=lo;row<=hi;row++)for(let col=left;col<=right;col++)result.push(map.tiles[row*map.width+col]);return result;
  }
  inView(tile,padding=100){return super.inView(tile,padding+(this.staticPaintingPad||0));}
  setBorderStyle(style){super.setBorderStyle(style);}
  buildResources(){release(this.resourceGroup);populateResources(this);this.resourceRevision=(this.resourceRevision||0)+1;this.dirty=true;}
  pick(x,y){
    if(!this.game)return null;
    const w=this.world(x,y),r=(w.y-90)/(R*1.5),q=(w.x-75)/(R*SQ)-r/2;
    let rx=Math.round(q),rz=Math.round(r),ry=Math.round(-q-r);const dx=Math.abs(rx-q),dy=Math.abs(ry+q+r),dz=Math.abs(rz-r);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dz>dy)rz=-rx-ry;
    const rawCol=rx+Math.floor(rz/2),col=this.wrapWorld?canonicalColumn(rawCol,this.game.map.width):rawCol;
    if(rz<0||rz>=this.game.map.height||col<0||col>=this.game.map.width)return null;
    const guess=this.game.map.tiles[rz*this.game.map.width+col];if(!this.cornerVertices)return guess;
    const oldOffset=this.renderOffset;this.renderOffset=this.wrapWorld?(rawCol-col)*R*SQ:0;
    const candidates=[];
    for(let dq=-2;dq<=2;dq++)for(let dr=-2;dr<=2;dr++){const t=this.index.get(`${guess.q+dq},${guess.r+dr}`);if(t)candidates.push(t);}
    candidates.sort((a,b)=>this.position(b).y-this.position(a).y);
    for(const tile of candidates){const p=this.position(tile);if(this.wrapWorld){const period=R*SQ*this.game.map.width;this.renderOffset=Math.round((w.x-p.x)/period)*period;}const points=[];for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;points.push(this.projectGround(p.x+Math.cos(a)*R,p.y+Math.sin(a)*R));}
      const center=this.screen(tile);
      for(let i=0;i<6;i++){const a=center,b=points[i],d=points[(i+1)%6],cross=(u,v)=>(v.x-u.x)*(y-u.y)-(v.y-u.y)*(x-u.x),v=[cross(a,b),cross(b,d),cross(d,a)];if(v.every(n=>n>=-.001)||v.every(n=>n<=.001)){this.renderOffset=oldOffset;return tile;}}
    }this.renderOffset=oldOffset;return guess;
  }
  hitUnit(x,y,duringOrders=false){
    if(this.orders.length&&!duringOrders)return null;
    let depth;
    for(const hit of [...this.unitHits].reverse()){
      if(x<hit.x||x>hit.x+hit.width||y<hit.y||y>hit.y+hit.height)continue;
      if(hit.kind==='label')return hit.unit;
      if(Number.isFinite(hit.worldDepth)){depth??=this.contactPass.depthAt(x/this.width,1-y/this.height);if(depth+0.000002<hit.worldDepth)continue;}
      if(hit.kind==='badge'||hit.kind==='promotion'){const dx=(x-hit.x-hit.width/2)/(hit.width/2),dy=(y-hit.y-hit.height/2)/(hit.height/2);if(dx*dx+dy*dy<=1)return hit.unit;continue;}
      if(hit.kind==='shadow'){const dx=(x-hit.x-hit.width/2)/(hit.width/2),dy=(y-hit.y-hit.height/2)/(hit.height/2);if(dx*dx+dy*dy<=1)return hit.unit;continue;}
      if(!hit.art)continue;
      const art=hit.art,angle=-art.rotation,dx=x-art.anchor.x,dy=y-art.anchor.y,ry=dx*Math.sin(angle)+dy*Math.cos(angle),rx=(dx*Math.cos(angle)-dy*Math.sin(angle)-art.shear*ry)/art.scaleX;
      const fx=(rx-art.left)/art.size,fy=(ry-art.top)/art.size;if(fx<0||fx>=1||fy<0||fy>=1)continue;
      const n=art.frame.resolution;if(art.frame.alpha[Math.floor(fy*n)*n+Math.floor(fx*n)]>35)return hit.unit;
    }
    return null;
  }
  buildTerrain(changedTiles=null){
    this.base={width:R*SQ*(this.game.map.width+.8)+150,height:R*1.5*(this.game.map.height+1)+160};
    if(!this.gpu)return;
    const network=visibleRiverEdges(this.game.map),riverKey=network.edges.map(e=>`${e.a}/${e.b}`).join('|'),riversChanged=riverKey!==this.riverNetworkKey;
    this.riverNetworkKey=riverKey;
    let chunks=null;
    const tileChunks=t=>{const p=this.position(t),keys=[];for(let x=Math.floor((p.x-R)/480);x<=Math.floor((p.x+R)/480);x++)for(let z=Math.floor((p.y-R)/360);z<=Math.floor((p.y+R)/360);z++)keys.push(x+':'+z);return keys;};
    if(changedTiles?.length&&this.cornerVertices){
      chunks=new Set();
      for(const id of changedTiles){const t=this.game.map.tiles[id];for(let dq=-3;dq<=3;dq++)for(let dr=-3;dr<=3;dr++){const near=this.index.get(`${t.q+dq},${t.r+dr}`);if(near)for(const key of tileChunks(near))chunks.add(key);}}
      const removed=[];for(const mesh of [...this.terrainGroup.children])if(mesh.name==='river-channel-and-banks'?riversChanged:chunks.has(mesh.userData.spatialChunk)){this.terrainGroup.remove(mesh);removed.push(mesh);}
      const retainedGeometry=new Set(),retainedMaterial=new Set([this.groundMaterial]);this.terrainGroup.traverse(mesh=>{if(mesh.geometry)retainedGeometry.add(mesh.geometry);if(mesh.material)retainedMaterial.add(mesh.material);});
      for(const mesh of removed){mesh.dispose?.();if(!retainedGeometry.has(mesh.geometry))mesh.geometry?.dispose();if(!retainedMaterial.has(mesh.material))mesh.material?.dispose();}
    }else release(this.terrainGroup);
    this.heights=new Map();
    const vertices=new Map(),tiles=this.game.map.tiles,shore=shoreProfile(tiles,this.index,t=>this.position(t),R,this.game.map.wrapX?R*SQ*this.game.map.width:0),seamGroups=[];this.shoreStats={edges:shore.edges,beaches:true,wetSand:true};this.materialTileCounts=Object.fromEntries(TERRAIN_MATERIALS.map(name=>[name,0]));
    for(const t of tiles){const p=this.position(t),height=elevation(t),color=new THREE.Color(t.hidden?'#30484b':palette[t.terrain]);
      const weights=surfaceWeights(t);weights.forEach((weight,i)=>{if(weight>.001)this.materialTileCounts[TERRAIN_MATERIALS[i]]++;});
      this.heights.set(t.id,height);
      for(let i=0;i<6;i++){const angle=(i*60-30)*Math.PI/180,x=p.x+Math.cos(angle)*R,z=p.y+Math.sin(angle)*R,k=key(x,z);let vertex=vertices.get(k);if(!vertex){vertex={x,z,height:0,color:new THREE.Color(0,0,0),weights:[0,0,0,0,0,0],detail:[0,0],count:0,water:false,waterDepth:0,waterCount:0};vertices.set(k,vertex);}vertex.height+=height;vertex.color.add(color);for(let j=0;j<6;j++)vertex.weights[j]+=weights[j];surfaceDetail(t).forEach((value,j)=>vertex.detail[j]+=value);vertex.count++;vertex.water||=isWater(t);if(!t.hidden&&isWater(t)){vertex.waterDepth+=this.waterDepths.get(t.id)??1;vertex.waterCount++;}}
    }
    if(this.game.map.wrapX){
      const period=R*SQ*this.game.map.width,left=75-R*SQ/2,seams=new Map();
      for(const v of vertices.values()){
        if(v.x>left+R*2&&v.x<left+period-R*2)continue;
        const x=left+((v.x-left)%period+period)%period,k=key(x,v.z);if(!seams.has(k))seams.set(k,[]);seams.get(k).push(v);
      }
      for(const group of seams.values())if(group.length>1){
        seamGroups.push(group);
        const sum={height:0,color:new THREE.Color(0,0,0),weights:[0,0,0,0,0,0],detail:[0,0],count:0,water:false,waterDepth:0,waterCount:0};
        for(const v of group){sum.height+=v.height;sum.color.add(v.color);sum.count+=v.count;sum.water||=v.water;sum.waterDepth+=v.waterDepth;sum.waterCount+=v.waterCount;v.weights.forEach((n,i)=>sum.weights[i]+=n);v.detail.forEach((n,i)=>sum.detail[i]+=n);}
        for(const v of group)Object.assign(v,{...sum,color:sum.color.clone(),weights:[...sum.weights],detail:[...sum.detail]});
      }
    }
    for(const vertex of vertices.values()){vertex.height=vertex.water?0:vertex.height/vertex.count;vertex.color.multiplyScalar(1/vertex.count);vertex.weights=vertex.weights.map(weight=>weight/vertex.count);vertex.detail=vertex.detail.map(value=>value/vertex.count);}
    for(const node of network.vertices.values()){const v=vertices.get(key(node.x*R+75,node.z*R+90));if(v&&!v.water)v.height=Math.max(.35,v.height-2.2);}
    for(const group of seamGroups){const height=Math.min(...group.map(v=>v.height));for(const v of group)v.height=height;}
    this.cornerVertices=vertices;
    if(!chunks||!this.lightingCasters)this.lightingCasters={trees:new Map(),mountains:new Map()};
    const clearance=sceneryClearance(this);this.sceneryStats={treesPlaced:0,treesCleared:0};
    const positions=[],colors=[],surfaceA=[],surfaceB=[],surfaceLight=[],details=[],waterData=[],shoreDistance=[],fishData=[],tileIds=[],rivers=[],coasts=[],trunks=[],leaves=[],jungle=[],peaks=[],snow=[];
    let terrainTileId;
    const addVertex=(x,y,z,color,weights,light,water,fish,hidden,detail)=>{tileIds.push(terrainTileId);positions.push(x,y,z);colors.push(color.r,color.g,color.b);surfaceA.push(...weights.slice(0,3));surfaceB.push(...weights.slice(3));details.push(...detail);surfaceLight.push(light);waterData.push(...water);shoreDistance.push(hidden?-120:shore.distanceAt(x,z,water[0]>.5));fishData.push(...fish);};
    for(const t of tiles){if(t.hidden||chunks&&!tileChunks(t).some(key=>chunks.has(key)))continue;terrainTileId=t.id;this.lightingCasters.trees.set(t.id,[]);this.lightingCasters.mountains.set(t.id,[]);const p=this.position(t),height=this.heightAt(t),color=new THREE.Color(t.hidden?'#30484b':palette[t.terrain]);if(t.visible===false)color.multiplyScalar(.62);
      const weights=surfaceWeights(t),masked=t.hidden||isWater(t),light=t.visible===false?.62:1,water=[!t.hidden&&isWater(t)?1:0,this.waterDepths.get(t.id)??1],fish=[p.x,p.y,t.resource==='fish'&&resourceSceneryVisible(t)?1:0];
      // Corner-only shoreline interpolation paints sand across narrow water bridges.
      // Sample shared edge midpoints near known shores; keep distant water inexpensive.
      const subdivisions=water[0]&&shore.distanceAt(p.x,p.y,true)<R*2?SHORE_WATER_SUBDIVISIONS:!masked&&t.hill?LAND_SUBDIVISIONS:1;
      for(let i=0;i<6;i++){
        const angle=(i*60-30)*Math.PI/180,next=(i*60+30)*Math.PI/180,a=vertices.get(key(p.x+Math.cos(angle)*R,p.y+Math.sin(angle)*R)),b=vertices.get(key(p.x+Math.cos(next)*R,p.y+Math.sin(next)*R)),n=subdivisions,centerDetail=surfaceDetail(t);
        const point=(iu,iv)=>{const u=iu/n,v=iv/n,w=1-u-v,x=p.x*w+a.x*u+b.x*v,z=p.y*w+a.z*u+b.z*v,c=color.clone().multiplyScalar(w).add(a.color.clone().multiplyScalar(u*light)).add(b.color.clone().multiplyScalar(v*light)),ww=weights.map((value,j)=>masked?value:value*w+a.weights[j]*u+b.weights[j]*v),dd=centerDetail.map((value,j)=>masked?value:value*w+a.detail[j]*u+b.detail[j]*v);return [x,this.triangleHeight(t,p,a,b,u,v),z,c,ww,light,[water[0],water[1]*w+(a.waterCount?a.waterDepth/a.waterCount:water[1])*u+(b.waterCount?b.waterDepth/b.waterCount:water[1])*v],fish,t.hidden,dd];};
        for(let u=0;u<n;u++)for(let v=0;v<n-u;v++){addVertex(...point(u,v));addVertex(...point(u,v+1));addVertex(...point(u+1,v));if(u+v<n-1){addVertex(...point(u+1,v));addVertex(...point(u,v+1));addVertex(...point(u+1,v+1));}}
      }
      if(t.hidden)continue;
      if(t.terrain==='coast')for(let i=0;i<6;i++){const n=this.index.get(`${t.q+DIRECTIONS[i][0]},${t.r+DIRECTIONS[i][1]}`);if(n&&!n.hidden&&!isWater(n)){const a=(-30-i*60)*Math.PI/180,b=(30-i*60)*Math.PI/180;coasts.push(p.x+Math.cos(a)*R,.6,p.y+Math.sin(a)*R,p.x+Math.cos(b)*R,.6,p.y+Math.sin(b)*R);}}
      if(t.terrain==='mountain'&&!t.naturalWonder)for(let j=0;j<2;j++){const n=t.id*13+j,h=37+random(n)*30,x=p.x+(random(n+2)-.5)*20,z=p.y+(random(n+4)-.5)*18;this.lightingCasters.mountains.get(t.id).push({x,z,height:h,radius:28});peaks.push({position:[x,height-10,z],scale:[27+random(n+3)*7,h,25+random(n+5)*8],rotation:[0,random(n+5)*6.28,0],color:'#ffffff'});}
      if(t.feature&&!t.cityId&&!t.naturalWonder&&!isWater(t))for(let j=0;j<15;j++){const n=t.id*19+j,angle=j*2.399+(random(n+6)-.5)*.6,radius=['lumbermill','camp'].includes(t.improvement)?24+random(n)*8:Math.sqrt(random(n))*35,x=p.x+Math.cos(angle)*radius,z=p.y+Math.sin(angle)*radius,h=9+random(n+5)*10;const base=this.surfaceHeight(x,z);if(!clearance.treeAllowed(x,z,base,h)){this.sceneryStats.treesCleared++;continue;}this.sceneryStats.treesPlaced++;this.lightingCasters.trees.get(t.id).push({x,z,height:h,radius:h*.52});trunks.push({position:[x,base+h*.2,z],scale:[.55,h*.4,.55],color:'#655132',distant:j%4===0});const entry={distant:j%4===0,position:[x,base+(t.feature==='jungle'?h*.62:h*.07),z],scale:t.feature==='jungle'?[h*.35,h*.4,h*.35]:[h*.62,h*.92,h*.62],rotation:[0,random(n+2)*6.28,0],color:random(n+8)>.5?'#8aab66':'#b0bb73'};(t.feature==='jungle'?jungle:leaves).push(entry);}

    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('surfaceA',new THREE.Float32BufferAttribute(surfaceA,3));geometry.setAttribute('surfaceB',new THREE.Float32BufferAttribute(surfaceB,3));geometry.setAttribute('shoreDistance',new THREE.Float32BufferAttribute(shoreDistance,1));geometry.setAttribute('fishData',new THREE.Float32BufferAttribute(fishData,3));geometry.setAttribute('waterData',new THREE.Float32BufferAttribute(waterData,2));geometry.setAttribute('surfaceLight',new THREE.Float32BufferAttribute(surfaceLight,1));geometry.computeVertexNormals();smoothGroundNormals(geometry);
    geometry.setAttribute('surfaceDetail',new THREE.Float32BufferAttribute(details,2));geometry.setAttribute('tileId',new THREE.Uint16BufferAttribute(tileIds,1));
    const material=chunks?this.groundMaterial:groundMaterial(this.terrainTexture,this.waterTexture,this.biomeTexture);
    const ground=new THREE.Mesh(geometry,material);ground.receiveShadow=true;ground.name='terrain-ground';
    for(const mesh of spatialMeshes(ground)){if(!chunks||chunks.has(mesh.userData.spatialChunk))this.terrainGroup.add(mesh);else mesh.geometry.dispose();}
    this.groundMaterial=material;this.indexFogRanges();
    const add=(shape,entries,rockDetail=false)=>{if(!entries.length){shape.dispose();return;}const buckets=new Map(),material=rockDetail?mountainMaterial(this.terrainTexture):new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,vertexColors:!!shape.attributes.color,flatShading:false});for(const e of entries){const k=Math.floor(e.position[0]/480)+':'+Math.floor(e.position[2]/360);if(chunks&&!chunks.has(k))continue;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(e);}if(!buckets.size){shape.dispose();material.dispose();return;}for(const [key,chunk]of buckets){const mesh=instances(shape,chunk,material);if(mesh){mesh.userData.spatialChunk=key;mesh.userData.minZoom=rockDetail?0:.65;this.terrainGroup.add(mesh);if(!rockDetail){const entries=chunk.filter((e,i)=>e.distant??i%4===0);if(entries.length){const distant=instances(shape,entries,material);distant.castShadow=false;distant.userData.spatialChunk=key;distant.userData.maxZoom=.65;this.terrainGroup.add(distant);}}}}};
    add(new THREE.CylinderGeometry(1,1,1,5),trunks);add(pineGeometry(),leaves);add(leafGeometry(),jungle);add(mountainGeometry(),peaks,true);
    if(!chunks||riversChanged){
      for(const edge of network.edges){const a=network.vertices.get(edge.a),b=network.vertices.get(edge.b),va=vertices.get(key(a.x*R+75,a.z*R+90)),vb=vertices.get(key(b.x*R+75,b.z*R+90));if(va&&vb)rivers.push(va.x,va.height,va.z,vb.x,vb.height,vb.z);}
      this.riverMesh=waterways(rivers,(x,z)=>this.surfaceHeight(x,z),this.waterTexture);addSpatialMeshes(this.terrainGroup,this.riverMesh);this.riverStats=this.riverMesh.userData;
    }else for(const mesh of this.terrainGroup.children)if(mesh.name==='river-channel-and-banks'&&chunks.has(mesh.userData.spatialChunk)){
      const position=mesh.geometry.getAttribute('position'),offset=mesh.geometry.getAttribute('surfaceOffset');
      for(let i=0;i<position.count;i++)position.setY(i,this.surfaceHeight(position.getX(i),position.getZ(i))+offset.getX(i));
      position.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
    }

    this.terrainBuildStats={partial:!!chunks,replacedChunks:chunks?.size??null};
    this.gpu.shadowMap.needsUpdate=true;this.terrainRevision=(this.terrainRevision||0)+1;this.buildResources();
  }
  // Clock and transient animation updates repaint units; authoritative state still invalidates static layers.
  setSimulationState(session){this.turnPresentation=session.mode==='turns';this.simulationClock={time:session.time??this.game?.realtime?.time??0,rate:session.rate||1,running:!!session.running,received:performance.now()/1000};this.unitFrame=true;}
  indexFogRanges(){
    this.fogRanges=new Map();
    for(const mesh of this.terrainGroup.children){
      const ids=mesh.geometry?.getAttribute('tileId');if(!ids)continue;
      for(let start=0;start<ids.count;){const id=ids.getX(start);let end=start+1;while(end<ids.count&&ids.getX(end)===id)end++;
        if(!this.fogRanges.has(id))this.fogRanges.set(id,[]);this.fogRanges.get(id).push({mesh,start,end});start=end;
      }
    }
  }
  updateFog(previous){
    if(!previous)return;let changed=false;
    for(const tile of this.game.map.tiles){
      if((tile.visible===false)===(previous[tile.id]?.visible===false))continue;
      const brightness=tile.visible===false?.62:1;
      for(const {mesh,start,end}of this.fogRanges.get(tile.id)||[]){
        const color=mesh.geometry.getAttribute('color'),light=mesh.geometry.getAttribute('surfaceLight');
        for(let i=start;i<end;i++){const ratio=brightness/light.getX(i);color.setXYZ(i,color.getX(i)*ratio,color.getY(i)*ratio,color.getZ(i)*ratio);light.setX(i,brightness);}
        color.addUpdateRange(start*3,(end-start)*3);light.addUpdateRange(start,end-start);color.needsUpdate=light.needsUpdate=true;
      }
      changed=true;
    }
    if(changed){this.fogRevision=(this.fogRevision||0)+1;this.groundFrameKey=null;this.dirty=true;}
  }
  get actionTime(){if(this.turnPresentation)return performance.now()/1000;if(!this.game?.realtime)return this.time;const clock=this.simulationClock;if(!clock)return this.game.realtime.time;return clock.time+(clock.running?Math.max(0,Math.min(.3,performance.now()/1000-clock.received))*clock.rate:0);}
  setState(game){
    for(const u of [...game.units,...(game.visuals?.events||[]).map(e=>e.actor)])if(UNITS[u.type]?.medical)this.unitSprites.painted.ensure(u.type,()=>{this.dirty=true;});
    const oldTiles=this.game?.map.tiles;
    const tilesChanged=this.game?.id!==game.id||oldTiles!==game.map.tiles;
    const journal=game.visuals,journalKey=game.id+'|'+journal?.epoch+'|'+journal?.view;
    const pending=this.visualKey===journalKey?(journal?.events||[]).filter(e=>e.id>this.visualSequence):[];
    // A newly seen casualty can disappear before the lazy living sheet is loaded.
    for(const event of pending)if(!this.reduced&&event.kind==='death'&&PAINTED_UNITS[event.actor.type]?.deathPrepared)this.unitSprites.painted.ensure(event.actor.type,()=>{this.dirty=true;});
    const reset=this.visualKey!==journalKey,previous=new Map((this.game?.units||[]).map(u=>[u.id,u])),now=game.realtime?this.actionTime:performance.now()/1000,poses=new Map();
    const returned=new Set(game.units.filter(u=>previous.has(u.id)&&(u.returnSequence||0)!==(previous.get(u.id).returnSequence||0)).map(u=>u.id));
    for(const id of returned){this.unitJourneys.delete(id);this.unitTurns.delete(id);}
    for(let i=pending.length-1;i>=0;i--)if(returned.has(pending[i].actor.id)&&pending[i].kind==='move')pending.splice(i,1);
    // Transient journals are absent after load. Resume currently active poses
    // from persisted activity without replaying old completed battles.
    if(game.realtime&&reset)for(const entity of [...game.units,...game.cities]){
      const a=entity.activity;if(!a||['move','rebase'].includes(a.action.type))continue;
      const attacking=['attack','cityAttack'].includes(a.action.type),target=attacking||a.action.type==='heal'?(game.units.find(u=>u.id===a.action.targetUnit)||game.cities.find(c=>c.id===a.action.targetCity)):null;
      if(attacking&&!target)continue;
      pending.push({id:-entity.id,kind:attacking?'attack':'work',actor:{...entity,type:entity.type||'city'},target:target?{...target}:undefined,action:a.action.type,time:a.started,duration:attacking?1.1:a.action.type==='heal'?2:1.25});
    }
    for(const [id,journey]of this.unitJourneys)poses.set(id,sampleJourney(journey,now));
    for(const u of previous.values())if(this.unitTurns.has(u.id)&&!poses.has(u.id))poses.set(u.id,this.unitPose(u,now));
    if(reset){this.effects=[];this.unitJourneys.clear();this.unitFacings.clear();this.unitTurns.clear();}
    const occupied=[...[...this.unitJourneys.values()].map(j=>j.started+j.duration),...this.effects.filter(e=>['attack','work'].includes(e.kind)).map(e=>e.started+(e.kind==='attack'?1.95:1.25))];
    const inferred=reset?[]:game.units.filter(u=>!returned.has(u.id)&&UNITS[u.type].domain!=='air'&&previous.has(u.id)&&previous.get(u.id).tile!==u.tile&&!pending.some(e=>['move','attack'].includes(e.kind)&&e.actor.id===u.id)&&(journal?.view<0||journal?.view===undefined||u.owner===journal.view)).map(u=>({id:-u.id,kind:'move',actor:u}));
    const starts=game.realtime&&game.settings?.playMode!=='turns'?new Map(pending.map(e=>[e.id,e.time??now])):this.reduced?new Map():scheduleActions([...pending,...inferred],now,occupied);
    this.visualKey=journalKey;this.visualSequence=journal?.sequence||0;
    super.setState(game);
    this.unitsById=new Map(game.units.map(u=>[u.id,u]));this.movingUnits=game.units.filter(u=>['move','rebase'].includes(u.activity?.action.type));this.airUnits=game.units.filter(u=>UNITS[u.type].domain==='air');
    if(tilesChanged)this.updateFog(oldTiles);
    this.animations.clear();
    const alive=new Set(game.units.map(u=>u.id));for(const map of [this.unitJourneys,this.unitFacings,this.unitTurns])for(const id of map.keys())if(!alive.has(id))map.delete(id);
    for(const u of game.units){
      if(!this.unitFacings.has(u.id))this.unitFacings.set(u.id,initialHeading(u.type));
      const old=previous.get(u.id);if(game.realtime&&game.settings?.playMode!=='turns'||reset||returned.has(u.id)||!old||old.tile===u.tile)continue;
      if(journal?.view>=0&&u.owner!==journal.view&&!pending.some(e=>e.kind==='move'&&e.actor.id===u.id))continue;
      const events=pending.filter(e=>e.kind==='move'&&e.actor.id===u.id),ids=[old.tile];
      for(const event of events){const path=event.path||[event.from,event.actor.tile];if(ids.at(-1)===path[0])ids.push(...path.slice(1));}
      if(ids.at(-1)!==u.tile){ids.length=1;ids.push(u.tile);}
      let points=ids.map(id=>this.position(game.map.tiles[id]));if(poses.has(u.id)){const pose=poses.get(u.id),oldJourney=this.unitJourneys.get(u.id);points=[pose.position,...(oldJourney&&['turn','move'].includes(pose.stage)?oldJourney.points.slice(pose.segment+1):[]),...points.slice(1)];}
      if(game.map.wrapX){const period=R*SQ*game.map.width;for(let i=1;i<points.length;i++)points[i].x+=Math.round((points[i-1].x-points[i].x)/period)*period;}
      const heading=poses.get(u.id)?.heading??this.unitFacings.get(u.id),attackEvent=pending.find(e=>e.kind==='attack'&&e.actor.id===u.id),journey=createJourney(u.type,points,heading,starts.get(events[0]?.id??attackEvent?.id??-u.id)??now);
      if(!journey)continue;journey.jump=events.some(e=>e.jump);this.unitTurns.delete(u.id);
      if(this.reduced)this.unitFacings.set(u.id,journey.headings.at(-1));else this.unitJourneys.set(u.id,journey);
    }
    const lastAttack=new Map();for(const event of pending){
      const start=starts.get(event.id)??now;
      if(event.kind==='attack'){lastAttack.set(event.actor.id,event);if(event.target)lastAttack.set(event.target.id,event);}
      if((event.kind==='attack'||event.kind==='work'&&event.action==='heal'&&event.target)&&UNIT_RIGS[event.actor.type]&&!this.unitJourneys.has(event.actor.id)){
        const from=this.position(game.map.tiles[event.actor.tile]),to=this.position(game.map.tiles[event.target.tile]);if(game.map.wrapX){const period=R*SQ*game.map.width;to.x+=Math.round((from.x-to.x)/period)*period;}const heading=Math.atan2(to.y-from.y,to.x-from.x),startHeading=this.unitFacings.get(event.actor.id)??initialHeading(event.actor.type);
        if(this.reduced)this.unitFacings.set(event.actor.id,heading);else this.unitTurns.set(event.actor.id,{from:startHeading,to:heading,started:start,duration:.18});
      }
      if((!this.reduced||event.kind==='launch')&&event.kind!=='move'){const duration=event.duration??(event.kind==='death'?PAINTED_UNITS[event.actor.type]?.deathDuration??(event.actor.type==='envoy'||UNITS[event.actor.type]?.medical?2.4:1.15):event.kind==='work'?1:event.kind==='attack'?1.1:.7),hit=lastAttack.get(event.actor.id),impact=hit?attackTiming(hit.actor.type,UNIT_MOTIONS[hit.actor.type]?.family).impact*1.1:.78,delay=game.realtime&&game.settings?.playMode!=='turns'?0:event.kind==='death'?impact+.12:event.kind==='hurt'?impact:0;this.effects.push({...event,started:((!game.realtime||game.settings?.playMode==='turns')&&hit&&['hurt','death'].includes(event.kind)?starts.get(hit.id)??now:start)+delay,duration});}
    }
    if(tilesChanged)this.structureTilesKey=game.map.tiles.filter(t=>!t.hidden&&(t.district||t.construction||t.improvement||t.camp||t.road||t.fort)).map(t=>`${t.id}:${t.district?.item}:${t.district?.stage}:${t.construction?.item}:${t.construction?.stage}:${t.improvement}:${t.camp}:${t.terrain}:${t.hill}:${t.road}:${t.roadPillaged}:${t.pillaged}:${t.fort?.hp}`).join('|');
    if(tilesChanged)this.lightingTileKey=game.map.tiles.filter(t=>!t.hidden&&(t.district||t.fort||t.improvement||t.resource||t.cityId!=null)).map(t=>[t.id,t.district?.item,!!t.fort,t.improvement,t.resource,t.cityId]).join('|');
    const structureKey=game.id+'|'+this.structureCities.map(c=>`${c.id}:${c.owner}:${c.tile}:${c.population}:${c.visualEra??civilizationEra(game.players[c.owner])}:${game.map.tiles[c.tile]?.hidden}:${game.map.tiles[c.tile]?.terrain}:${game.map.tiles[c.tile]?.hill}:${c.buildings.join(',')}`).join('|')+'|'+game.players.map(p=>`${p.id}:${p.color}:${civilizationEra(p)}`).join('|')+'|'+this.structureTilesKey+'|'+JSON.stringify(game.routes);
    if(this.structureKey!==structureKey){this.structureKey=structureKey;this.buildStructures();}
    updateWallRearHealth(this);
    if(tilesChanged)this.borderTilesKey=JSON.stringify(game.map.tiles.map(t=>[t.hidden,t.owner]));
    const borderKey=this.terrainRevision+'|'+game.id+'|'+this.borderTilesKey+'|'+JSON.stringify([game.cities.map(c=>[c.id,c.owner,c.tile]),game.players.map(p=>p.color)]);
    if(this.borderKey!==borderKey){this.borderKey=borderKey;this.buildBorders();}
    this.lightingStateKey=[game.id,this.terrainRevision,this.lightingTileKey,JSON.stringify(this.structureCities.map(c=>[c.tile,game.map.tiles[c.tile]?.hidden]))].join(':');this.dirty=true;
  }
  buildStructures(){
    release(this.structureGroup);populateStructures(this);this.structureRevision=(this.structureRevision||0)+1;this.gpu.shadowMap.needsUpdate=true;
  }
  buildBorders(){
    release(this.borderGroup);if(this.gridMesh){this.terrainGroup.remove(this.gridMesh);release(this.gridMesh);}const byOwner=new Map(),grid=[];
    this.cityTerritory=new Map();this.cityEdges=[];const citiesByOwner=new Map();for(const city of this.game.cities){if(!citiesByOwner.has(city.owner))citiesByOwner.set(city.owner,[]);citiesByOwner.get(city.owner).push(city);}
    for(const t of this.game.map.tiles){if(t.hidden||t.owner==null)continue;const cities=citiesByOwner.get(t.owner)||[];let nearest=null,best=Infinity;for(const city of cities){const home=this.game.map.tiles[city.tile],dq=t.q-home.q,dr=t.r-home.r,distance=(Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2;if(distance<best){best=distance;nearest=city;}}if(nearest)this.cityTerritory.set(t.id,nearest.id);}
    for(const t of this.game.map.tiles){if(t.hidden)continue;const p=this.position(t);for(let i=0;i<6;i++){
      const [dq,dr]=DIRECTIONS[i],n=this.index.get(`${t.q+dq},${t.r+dr}`),a=(-30-i*60)*Math.PI/180,b=(30-i*60)*Math.PI/180,va=this.cornerVertices?.get(key(p.x+Math.cos(a)*R,p.y+Math.sin(a)*R)),vb=this.cornerVertices?.get(key(p.x+Math.cos(b)*R,p.y+Math.sin(b)*R));if(!va||!vb)continue;
      const edge=[va.x,va.height+1.1,va.z,vb.x,vb.height+1.1,vb.z];if(!n||n.id>t.id)grid.push(...edge);
      const city=this.cityTerritory.get(t.id),other=n?this.cityTerritory.get(n.id):undefined;
      if(city!==undefined&&(!n||n.owner!==t.owner||other!==city&&n.id>t.id))this.cityEdges.push({edge,owner:t.owner,cities:[city,other],internal:!!n&&n.owner===t.owner});
      if(t.owner!==null&&t.owner!==undefined&&(!n||n.owner!==t.owner)){if(!byOwner.has(t.owner))byOwner.set(t.owner,[]);byOwner.get(t.owner).push(...edge);}
    }}
    for(const [owner,points]of byOwner)this.borderGroup.add(segments(points,this.game.players[owner]?.color||'#df8875',.88));
    this.countryBorderPaths=this.traceBorderEdges(this.cityEdges.filter(e=>!e.internal));this.selectedBorderKey=null;
    this.gridMesh=new THREE.Group();addSpatialMeshes(this.gridMesh,segments(grid,'#dae3c1',.18));this.gridMesh.visible=this.showGrid;this.terrainGroup.add(this.gridMesh);
    this.borderRevision=(this.borderRevision||0)+1;
  }
  updateLightingBake(){
    if(!this.groundMaterial)return;
    const key=this.lightingStateKey;
    if(this.lightingBakeKey!==key){
      const bake=bakeWorldLighting(this);this.lightingBake?.dispose();this.lightingBake=bake;this.lightingBakeKey=key;this.lightingBakeCount=(this.lightingBakeCount||0)+1;
    }
    bindWorldLighting(this.groundMaterial,this.lightingBake,this.nearShadows);
  }
  updateCamera(){
    const halfW=this.width/(2*this.zoom),halfH=this.height/(2*this.zoom);this.camera.left=-halfW;this.camera.right=halfW;this.camera.top=halfH;this.camera.bottom=-halfH;
    this.camera.position.set(this.cam.x,2400*SY,this.cam.y+2400*COS);this.camera.lookAt(this.cam.x,0,this.cam.y);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    // Stable light cells avoid redrawing the shadow map for every drag pixel.
    const x=Math.round(this.cam.x/96)*96,z=Math.round(this.cam.y/96)*96,lightKey=`${x}:${z}`;if(this.lightKey===lightKey)return;this.lightKey=lightKey;
    this.sun.position.set(x+WORLD_LIGHTING.sun[0],WORLD_LIGHTING.sun[1],z+WORLD_LIGHTING.sun[2]);this.sun.target.position.set(x,0,z);this.sun.target.updateMatrixWorld();this.gpu.shadowMap.needsUpdate=true;
  }
  cullScenery(){
    const key=[this.cam.x,this.cam.y,this.zoom,this.width,this.height,this.copyRevision,this.visibleCopies.join(','),this.showGrid,this.showResources].join(':');
    if(key===this.cullKey)return;this.cullKey=key;
    const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));
    // A small apron retains entering objects and nearby shadow casters.
    for(const plane of frustum.planes)plane.constant+=80/this.zoom;
    const sphere=new THREE.Sphere();let total=0,visible=0;
    this.scene.updateMatrixWorld(true);
    const visit=group=>group.traverse(mesh=>{
      if(!mesh.isMesh&&!mesh.isLineSegments)return;
      total++;const detail=mesh.userData;
      detail.receivesShadow??=mesh.receiveShadow;mesh.receiveShadow=this.zoom>=.65&&detail.receivesShadow;
      const lod=(detail.minZoom===undefined||this.zoom>=detail.minZoom)&&(detail.maxZoom===undefined||this.zoom<detail.maxZoom);
      if(mesh.isInstancedMesh){if(!mesh.boundingSphere)mesh.computeBoundingSphere();sphere.copy(mesh.boundingSphere);}else{if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();sphere.copy(mesh.geometry.boundingSphere);}
      sphere.applyMatrix4(mesh.matrixWorld);
      const next=lod&&frustum.intersectsSphere(sphere);
      if(mesh.visible!==next&&mesh.castShadow)this.gpu.shadowMap.needsUpdate=true;
      mesh.visible=next;if(next)visible++;
    });
    for(const group of [this.terrainGroup,this.structureGroup,this.resourceGroup,...this.worldCopies.values()])visit(group);
    // Keep the light/shader layout stable when zooming. Changing castShadow
    // would compile a second set of terrain shaders and stall the first overview.
    const shadows=this.zoom>=.65;if(shadows!==this.nearShadows){this.nearShadows=shadows;this.gpu.shadowMap.needsUpdate=true;}this.sun.shadow.intensity=shadows?1:0;
    this.cullingStats={totalChunks:total,visibleChunks:visible,culledChunks:total-visible,apronPixels:80,detail:this.zoom<.65?'distant':'near',shadows};
  }
  render(){
    if(!this.game||!this.gpu)return;
    if(this.menuOpen)return;
    const delta=cameraElapsed(this.renderTime,this.time);this.renderTime=this.time;

    if(this.keys.size&&!document.querySelector('dialog[open]')){const step=16*delta*30/this.zoom;this.cam.x+=((this.keys.has('ArrowRight')||this.keys.has('KeyD')?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('KeyA')?1:0))*step;this.cam.y+=((this.keys.has('ArrowDown')||this.keys.has('KeyS')?1:0)-(this.keys.has('ArrowUp')||this.keys.has('KeyW')?1:0))*step/SY;this.markCameraDirty();}
    for(const [id,journey]of this.unitJourneys){if(this.reduced||this.actionTime-journey.started>=journey.duration){this.unitFacings.set(id,journey.headings.at(-1));this.unitJourneys.delete(id);}this.unitFrame=true;}
    for(const [id,turn]of this.unitTurns){if(this.reduced||this.actionTime-turn.started>=turn.duration){this.unitFacings.set(id,turn.to);this.unitTurns.delete(id);}this.unitFrame=true;}
    {const unitMotion=this.movingUnits.length>0||this.unitJourneys.size>0||this.unitTurns.size>0||this.effects.length>0,idleVisible=this.zoom>=IDLE_MIN_ZOOM&&(this.unitCullingStats?.candidates??1)>0;
    if(!this.reduced&&this.game.units.length&&(unitMotion||idleVisible)&&this.time-(this.lastUnitFrame||0)>=(unitMotion?1/60-.0001:1/IDLE_FPS)){this.lastUnitFrame=this.time;this.unitFrame=true;}}
    if(!this.reduced&&this.game.climate?.disasters?.length&&this.time-(this.lastWeatherFrame||0)>=1/8){this.lastWeatherFrame=this.time;this.unitFrame=true;}
    const oldEffects=this.effects.length;this.effects=this.effects.filter(e=>this.actionTime-e.started<e.duration);if(oldEffects||this.effects.length)this.unitFrame=true;
    if(this.targetCam){this.applyCameraBounds();this.targetZoom=Math.max(this.minimumZoom,Math.min(2.8,this.targetZoom));this.targetCam=constrainCamera(this.targetCam,this.targetZoom,this.width,this.height,this.cameraBounds,this.wrapWorld,SY,this.chartInsets);if(this.wrapWorld)this.targetCam.x+=Math.round((this.cam.x-this.targetCam.x)/this.cameraBounds.period)*this.cameraBounds.period;}
    if(this.targetCam){const f=this.reduced?1:cameraEase(delta);this.cam.x+=(this.targetCam.x-this.cam.x)*f;this.cam.y+=(this.targetCam.y-this.cam.y)*f;this.zoom+=(this.targetZoom-this.zoom)*f;if(Math.abs(this.cam.x-this.targetCam.x)+Math.abs(this.cam.y-this.targetCam.y)<.7&&Math.abs(this.zoom-this.targetZoom)<.002){this.cam={...this.targetCam};this.zoom=this.targetZoom;this.targetCam=null;}this.markCameraDirty();}
    if(!this.reduced&&(this.riverStats?.segments||this.waterReady)&&this.time-(this.lastRiverFrame||0)>=1/12){this.waterFrame=true;this.lastRiverFrame=this.time;}
    if(this.game.routes.length&&!this.reduced&&this.time-(this.lastRouteFrame||0)>=(this.zoom>=IDLE_MIN_ZOOM?1/ROUTE_FPS:2/ROUTE_FPS)){this.lastRouteFrame=this.time;this.unitFrame=true;}
    // Keep the original repaint path for overview and wrapped multi-copy views.
    if(this.unitFrame&&(this.zoom<IDLE_MIN_ZOOM||(this.visibleCopies?.length||0)>1))this.dirty=true;
    if(!this.dirty&&!this.unitFrame&&!this.waterFrame)return;const overlayFrame=this.dirty||this.unitFrame;this.dirty=false;this.unitFrame=false;this.waterFrame=false;this.applyCameraBounds();this.updateCamera();this.syncWorldCopies();ensureWallArt(this);
    if(this.groundMaterial?.userData.resources)this.groundMaterial.userData.resources.value=this.showResources?1:0;
    this.borderGroup.visible=false;this.resourceGroup.visible=this.showResources;if(this.gridMesh)this.gridMesh.visible=this.showGrid;
    this.cullScenery();this.updateLightingBake();
    // Unit bodies share scene depth. Water-only ticks reuse their cached paint;
    // reduced motion freezes water and all idle animation.
    const waterTick=this.reduced?0:Math.floor(this.time*12),groundKey=[this.cam.x,this.cam.y,this.zoom,this.width,this.height,this.copyRevision,this.visibleCopies.join(','),this.showGrid,this.showResources,this.textureReady,this.biomeReady,this.waterReady,this.terrainTexture.version,this.biomeTexture.version,this.waterTexture.version,waterTick].join(':');
    const renderWorld=()=>{if(this.groundMaterial?.userData.time)this.groundMaterial.userData.time.value=this.reduced?0:this.time;if(this.riverMesh)this.riverMesh.material.uniforms.time.value=this.reduced?0:this.time;if(!this.nearShadows)this.gpu.shadowMap.needsUpdate=false;this.worldRenderStats=this.contactPass.render(this.scene,this.camera);this.gpuFrames=(this.gpuFrames||0)+1;};
    this.renderedFrames++;
    // Water-only ticks refresh the WebGL terrain; the 2D overlay canvas above it is left untouched.
    if(!overlayFrame){if(groundKey!==this.groundFrameKey){this.groundFrameKey=groundKey;renderWorld();}this.waterOnlyFrames=(this.waterOnlyFrames||0)+1;return;}
    const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);this.labelBlocks=[];this.unitLabels=[];this.unitHits=[];
    this.effectsByUnit=new Map();for(const effect of this.effects){if(this.actionTime<effect.started)continue;if(!this.effectsByUnit.has(effect.actor.id))this.effectsByUnit.set(effect.actor.id,[]);this.effectsByUnit.get(effect.actor.id).push(effect);}
    const vignette=c.createRadialGradient(this.width/2,this.height/2,Math.min(this.width,this.height)*.3,this.width/2,this.height/2,this.width*.8);vignette.addColorStop(0,'#5e432000');vignette.addColorStop(1,'#5e432025');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
    drawChartFog(this,c);
    // World paint uses scene depth; information labels stay on the HUD canvas.
    const staticKey=[this.staticRevision,this.zoom,this.width,this.height,this.dpr,this.visibleCopies.join(','),this.cameraBounds?.period,this.borderStyle,this.showBorders,this.showResources,this.showYields,this.hovered,this.selected?.type,this.selected?.id,this.selected?.tile].join(':');
    this.staticLayers??=new Map();
    // Extra pixels cover short pans. Keep large/high-DPI and wrapped views on the conservative path.
    const pad=this.visibleCopies.length===1&&this.width*this.dpr<=3200&&this.height*this.dpr<=2000?96:0;
    const beyond=()=>this.visibleCopies.some(cycle=>{const layer=this.staticLayers.get(cycle);return !layer?.ready||layer.pad!==pad||Math.abs((this.cam.x-layer.cam.x)*this.zoom)>pad||Math.abs((this.cam.y-layer.cam.y)*this.zoom*SY)>pad;});
    const rebuildStatic=staticKey!==this.staticKey||beyond();this.staticKey=staticKey;
    const depthCameraKey=[this.cam.x,this.cam.y,this.zoom,this.width,this.height,this.dpr,this.visibleCopies.join(',')].join(':');
    const marks=this.groundMarksCanvas,w=Math.max(1,Math.round(this.width*this.dpr)),h=Math.max(1,Math.round(this.height*this.dpr));if(marks.width!==w||marks.height!==h){marks.width=w;marks.height=h;}
    const gc=marks.getContext('2d',{willReadFrequently:true});gc.setTransform(this.dpr,0,0,this.dpr,0,0);gc.clearRect(0,0,this.width,this.height);
    if(rebuildStatic)this.worldSprites.begin('static');this.worldSprites.begin('dynamic');
    for(const cycle of this.visibleCopies){this.renderOffset=cycle*this.cameraBounds.period;
    const viewport=this.viewportTiles();
    let layer=this.staticLayers.get(cycle);if(!layer){layer={canvas:document.createElement('canvas'),ground:document.createElement('canvas'),labels:[],ready:false};this.staticLayers.set(cycle,layer);}
    if(rebuildStatic||!layer.ready){
      const lc=layer.canvas,w=Math.max(1,Math.ceil((this.width+2*pad)*this.dpr)),h=Math.max(1,Math.ceil((this.height+2*pad)*this.dpr));if(lc.width!==w||lc.height!==h){lc.width=w;lc.height=h;}
      const sc=lc.getContext('2d');sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,w,h);sc.setTransform(this.dpr,0,0,this.dpr,pad*this.dpr,pad*this.dpr);const start=this.labelBlocks.length;
      const ground=layer.ground;if(ground.width!==w||ground.height!==h){ground.width=w;ground.height=h;}this.groundCtx=ground.getContext('2d',{willReadFrequently:true});this.groundCtx.setTransform(1,0,0,1,0,0);this.groundCtx.clearRect(0,0,w,h);this.groundCtx.setTransform(this.dpr,0,0,this.dpr,pad*this.dpr,pad*this.dpr);
      this.staticPaintingPad=pad;try{this.drawStaticOverlay(sc,this.viewportTiles(pad));}finally{this.staticPaintingPad=0;}layer.labels=this.labelBlocks.splice(start);layer.cam={...this.cam};layer.pad=pad;layer.ready=true;this.staticFrames=(this.staticFrames||0)+1;
    }else{this.unitOnlyFrames=(this.unitOnlyFrames||0)+1;}
    const dx=(layer.cam.x-this.cam.x)*this.zoom,dy=(layer.cam.y-this.cam.y)*this.zoom*SY;
    this.labelBlocks.push(...layer.labels.map(rect=>({...rect,x:rect.x+dx,y:rect.y+dy})));
    c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(layer.canvas,(dx-layer.pad)*this.dpr,(dy-layer.pad)*this.dpr);c.restore();
    gc.save();gc.setTransform(1,0,0,1,0,0);gc.drawImage(layer.ground,(dx-layer.pad)*this.dpr,(dy-layer.pad)*this.dpr);gc.restore();
    // Trade routes and nuclear previews form a light animated layer above the cached overlay.
    this.drawRouteOverlay(gc);
    const unitTiles=new Set(viewport.map(t=>t.id));
    // Elevated idle aircraft can be visible above an off-screen ground tile.
    for(const u of this.airUnits||[])unitTiles.add(u.tile);
    for(const u of this.movingUnits)if(UNITS[u.type]?.domain==='air'||unitTiles.has(u.activity.to))unitTiles.add(u.tile);
    for(const e of this.effects)if(e.kind==='attack'&&UNITS[e.actor.type]?.domain==='air')unitTiles.add(e.actor.tile);
    // Legacy multi-tile journeys can cross the viewport while their logical
    // destination lies outside it. Keep these moving groups as candidates.
    for(const id of this.unitJourneys.keys()){const u=this.unitsById.get(id);if(u)unitTiles.add(u.tile);}
    let candidates=0;for(const tile of unitTiles){const units=this.unitIndex.get(tile);if(units){candidates+=units.length;this.drawUnits(c,tile,units);}}
    this.unitCullingStats={total:this.game.units.length,candidates};
    for(const effect of this.effects.filter(e=>e.kind==='death'||e.kind==='work'&&e.retired))this.drawUnits(c,effect.actor.tile,[effect.actor],effect);
    this.drawActionEffects(c);
    this.drawPlanning(gc,viewport);
    // Unit rings are painted at the interpolated sprite position in drawUnits.
    // A tile outline here would jump ahead to the authoritative destination.
    const selected=this.selected?.type==='unit'?null:this.selected?.tile??this.selected;if(typeof selected==='number')this.highlight(gc,selected,'#ffe0a0',2.2);
    if(this.hovered!==null&&this.hovered!==selected&&!this.hoveredUnit)this.highlight(gc,this.hovered,'#f1ecd1',1);
    for(const order of this.orders){const id=typeof order==='number'?order:order.tile;this.highlight(gc,id,order.type==='attack'?'#f49676':'#d8e9af',1.8);}
    const city=this.selected?.type==='city'?this.game.cities.find(c=>c.id===this.selected.id):null;
    if(city&&this.zoom>.5)for(const id of city.worked||[]){const tile=this.game.map.tiles[id];if(!tile||tile.hidden||!this.inView(tile))continue;const p=this.screen(tile);c.fillStyle='#dbe9b7';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('●',p.x,p.y-20*this.zoom);}
    this.drawOrderPreview(gc);
    }this.renderOffset=0;
    if(rebuildStatic)this.worldSprites.end('static');this.worldSprites.end('dynamic');
    if(rebuildStatic||!this.groundDepthReady||this.depthCameraKey!==depthCameraKey){
      // The reference depth contains the ground surface, without mountain peaks,
      // trees or structures. Ground ink is then hidden by every raised object.
      const scenery=group=>group.children.filter(mesh=>mesh.isInstancedMesh);
      this.contactPass.captureGround(this.scene,this.camera,[this.structureGroup,this.resourceGroup,this.worldSprites.group,...scenery(this.terrainGroup),...[...this.worldCopies.values()].flatMap(root=>[root.children[1],root.children[2],...scenery(root.children[0])])]);this.groundDepthReady=true;this.depthCameraKey=depthCameraKey;
    }
    for(const cycle of this.staticLayers.keys())if(!this.visibleCopies.includes(cycle))this.staticLayers.delete(cycle);
    this.contactPass.setGroundMarks(marks);this.groundFrameKey=groundKey;renderWorld();this.drawUnitLabels(c);this.drawMinimap();
  }
  drawStaticOverlay(c,viewport){
    if(this.showBorders)this.drawCityBorders(this.groundCtx);
    for(const t of viewport)if(!t.hidden&&this.inView(t)){
      const p=this.screen(t),item=t.district?.item,city=t.district&&this.game.cities.find(c=>c.id===t.district.city),painted=t.fort||['barracks','airport','missilesilo'].includes(item)||t.district?.kind==='wonder'||t.construction?.kind==='wonder'||uniqueDistrictKey(t,city);
      if(painted)this.worldSprites.draw('static','tile:'+t.id,this.position(t),{x:p.x-80*this.zoom,y:p.y-95*this.zoom,width:160*this.zoom,height:135*this.zoom},sc=>{drawFortification(this,sc,t);if((t.district||t.construction)&&!drawWorldWonder(this,sc,t))drawUniqueDistrictStructure(this,sc,t);drawAirport(this,sc,t);drawMissileSilo(this,sc,t);return {key:JSON.stringify([t,city?.buildings,city?.hp])};},{bottom:12});
      if(encounterArtKind(this,t))this.worldSprites.draw('static','encounter:'+t.id,this.position(t),{x:p.x-33*this.zoom,y:p.y-52*this.zoom,width:66*this.zoom,height:65*this.zoom},sc=>drawEncounterArt(this,sc,t),{bottom:10});
      if(t.cityState)drawCityStateLabel(this,c,t);
      if(t.ruin)this.worldSprites.draw('static','ruin:'+t.id,this.position(t),{x:p.x-26*this.zoom,y:p.y-42*this.zoom,width:52*this.zoom,height:54*this.zoom},sc=>drawRuin(this,sc,t,p),{bottom:8});
      if(t.naturalWonder)this.worldSprites.draw('static','natural:'+t.id,this.position(t),{x:p.x-45*this.zoom,y:p.y-82*this.zoom,width:90*this.zoom,height:104*this.zoom},sc=>drawNaturalWonder(this,sc,t,p),{bottom:12});
      if(t.pillaged&&t.district?.kind!=='wonder'||t.roadPillaged){c.fillStyle='#dca38b';c.font='12px sans-serif';c.fillText('×',p.x+18*this.zoom,p.y+5);}
      if(this.showResources&&t.resource&&this.zoom>.55)drawResource(c,t,this.resourceAnchor(t),this.zoom,(this.hovered===t.id||this.selected?.tile===t.id)?RESOURCES[t.resource]?.name||t.resource:'');
      if(this.showYields&&this.zoom>.5&&!t.cityId&&!t.district){c.font='10px Georgia';c.textAlign='center';c.fillStyle=t.visible===false?'#b9c2ae':'#f5e9c3';c.fillText(this.yieldLabel(t),p.x,p.y+25*this.zoom);}
      if(t.camp){c.fillStyle='#d5866f';c.font='15px Georgia';c.fillText('⚑',p.x+12,p.y-18*this.zoom);}
    }
    for(const city of this.game.cities)if(this.inView(this.game.map.tiles[city.tile]))this.drawCityOverlay(c,city);
    for(const city of this.structureCities||[])if(city.remembered&&this.inView(this.game.map.tiles[city.tile]))this.drawCityPhysical(city);
    this.drawRememberedCities(c);
  }
  drawOrderPreview(c){
    const route=this.orderPreview?.path;if(!route?.length)return;
    c.save();c.strokeStyle='#ffe4a3';c.fillStyle='#ffe4a3';c.lineWidth=2.5;c.setLineDash([6,4]);c.beginPath();
    let previous;const points=route.map(id=>{const p=previous?this.screenNear(this.game.map.tiles[id],previous):this.screen(this.game.map.tiles[id]);previous=p;return p;});
    points.forEach((p,i)=>{if(i)c.lineTo(p.x,p.y);else c.moveTo(p.x,p.y);});c.stroke();c.setLineDash([]);
    for(let i=1;i<route.length;i++){const p=points[i];c.beginPath();c.arc(p.x,p.y,9,0,Math.PI*2);c.fill();c.fillStyle='#203b36';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText(String(this.orderPreview.arrivals?.[i]??i),p.x,p.y+3);c.fillStyle='#ffe4a3';}c.restore();
  }
  drawCityBorders(c){
    const selected=this.selected?.type==='city'?this.selected.id:null;
    this.strokeBorderPaths(c,this.countryBorderPaths||[]);
    if(selected!==null){if(this.selectedBorderKey!==selected){this.selectedBorderKey=selected;this.selectedBorderPaths=this.traceBorderEdges(this.cityEdges.filter(e=>e.cities.includes(selected)));}this.strokeBorderPaths(c,this.selectedBorderPaths,true);}
  }
  projectBorderVertex(p){return {x:(p[0]+(this.renderOffset||0)-this.cam.x)*this.zoom+this.width/2,y:(p[2]-this.cam.y)*this.zoom*SY+this.height/2-p[1]*COS*this.zoom};}
  fillTile(c,id,color){const t=this.game.map.tiles[id],p=this.position(t);c.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180,x=p.x+Math.cos(a)*R,z=p.y+Math.sin(a)*R,v=this.cornerVertices.get(key(x,z)),sx=(x+(this.renderOffset||0)-this.cam.x)*this.zoom+this.width/2,sy=(z-this.cam.y)*this.zoom*SY+this.height/2-(v?.height||0)*COS*this.zoom;(i?c.lineTo:c.moveTo).call(c,sx,sy);}c.closePath();c.fillStyle=color;c.fill();}
  highlight(c,id,color,width){const t=this.game.map.tiles[id];if(!t)return;const p=this.position(t);c.beginPath();for(let i=0;i<6;i++){const angle=(i*60-30)*Math.PI/180,x=p.x+Math.cos(angle)*R,z=p.y+Math.sin(angle)*R,v=this.cornerVertices?.get(key(x,z)),sx=(x+(this.renderOffset||0)-this.cam.x)*this.zoom+this.width/2,sy=(z-this.cam.y)*this.zoom*SY+this.height/2-(v?.height||0)*COS*this.zoom;(i?c.lineTo:c.moveTo).call(c,sx,sy);}c.closePath();c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  drawCityOverlay(c,city){
    this.drawCityPhysical(city);const p=this.screen(this.game.map.tiles[city.tile]),owner=this.game.players[city.owner];if(this.zoom<.35){c.beginPath();c.arc(p.x,p.y,3.5,0,Math.PI*2);c.fillStyle=owner.color;c.fill();return;}
    const size=cityLabelSize(c,city),x=p.x-size.width/2,y=p.y-40*this.zoom-size.height+12;this.labelBlocks.push(drawCityLabel(c,city,owner,x,y,()=>{this.dirty=true;}));
    const pressure=drawCityPressure(c,city,p.x,p.y+30*this.zoom);if(pressure)this.labelBlocks.push(pressure);
  }
  drawCityPhysical(city){
    const tile=this.game.map.tiles[city.tile];if(!tile||tile.hidden)return;const p=this.screen(tile);
    if((this.zoom<.35||!cityWallTier(city))&&!city.buildings.some(key=>UNIQUE_STRUCTURE_ART[key]))return;
    this.worldSprites.draw('static','city:'+city.id,this.position(tile),{x:p.x-80*this.zoom,y:p.y-95*this.zoom,width:160*this.zoom,height:140*this.zoom},sc=>{sc.save();if(city.remembered)sc.globalAlpha=.65;drawCityWalls(this,sc,city);drawUniqueCityStructures(this,sc,city);sc.restore();return {key:JSON.stringify(city)};},{bottom:28,lift:1});
  }
  unitPose(unit,time=this.actionTime){
    const carrier=unit.carrierId===undefined?null:this.unitsById?.get(unit.carrierId);
    if(carrier&&!unit.activity)return {...this.unitPose(carrier,time),stage:'idle',weight:0};
    if(this.game.realtime&&['move','rebase'].includes(unit.activity?.action.type)){
      const a=unit.activity,from=this.position(this.game.map.tiles[a.from]),to=this.position(this.game.map.tiles[a.to]),f=Math.max(0,Math.min(1,(time-a.started)/Math.max(.001,a.ends-a.started))),heading=Math.atan2(to.y-from.y,this.game.map.wrapX?to.x-from.x-Math.round((to.x-from.x)/(R*SQ*this.game.map.width))*R*SQ*this.game.map.width:to.x-from.x);
      if(this.game.map.wrapX)to.x+=Math.round((from.x-to.x)/(R*SQ*this.game.map.width))*R*SQ*this.game.map.width;
      this.unitFacings.set(unit.id,heading);return {position:{x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f},heading,stage:f<1?'move':'idle',weight:f<1?1:0,phase:Math.max(0,time-a.started)*Math.PI*3.4,settle:0,done:f===1};
    }
    const journey=this.unitJourneys.get(unit.id);if(journey)return sampleJourney(journey,time);
    const turn=this.unitTurns.get(unit.id),f=turn?Math.max(0,Math.min(1,(time-turn.started)/turn.duration)):1;
    return {position:this.position(this.game.map.tiles[unit.tile]),heading:turn?turn.from+angleDelta(turn.from,turn.to)*f*f*(3-2*f):this.unitFacings.get(unit.id)??initialHeading(unit.type),stage:turn&&f<1?'turn':'idle',weight:0,phase:0,settle:0,done:!turn||f===1};
  }
  tileAtWorld(x,z){
    const r=(z-90)/(R*1.5),q=(x-75)/(R*SQ)-r/2;let rx=Math.round(q),rz=Math.round(r),ry=Math.round(-q-r);const dx=Math.abs(rx-q),dy=Math.abs(ry+q+r),dz=Math.abs(rz-r);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dz>dy)rz=-rx-ry;return this.index.get(`${rx},${rz}`);
  }
  drawUnits(c,tile,units,ghost=null,onlyIndex=null){
    const t=this.game.map.tiles[tile];if(!t||t.hidden)return;
    const names=!ghost&&this.showUnitNames&&this.zoom>.5,baseScale=Math.max(.12,1.15*this.zoom/DEFAULT_ZOOM),spread=56*this.zoom/DEFAULT_ZOOM;
    for(let index=0;index<units.length;index++){
      if(onlyIndex!==null&&onlyIndex!==index)continue;
      const u=units[index],spec=UNITS[u.type],profile=u.type==='giantdeathrobot'&&!u.ranged?UNIT_MOTIONS.warrior:UNIT_MOTIONS[u.type],color=this.game.players[u.owner]?.color||(u.cityState?'#adbdc1':'#de806c'),effects=this.effectsByUnit?.get(u.id)||this.effects.filter(e=>e.actor.id===u.id&&this.actionTime>=e.started),attack=effects.findLast(e=>e.kind==='attack'),hurt=effects.findLast(e=>e.kind==='hurt'),work=effects.findLast(e=>e.kind==='work'),pose=this.unitPose(u),ground=pose.position;
      const deckHost=!ghost&&u.carrierId!==undefined?this.unitsById?.get(u.carrierId):null,scale=baseScale*(deckHost&&!attack?.42:1);
      if(u.type==='drone'&&attack){const target=this.position(this.game.map.tiles[attack.target.tile]);if(this.game.map.wrapX)target.x+=Math.round((ground.x-target.x)/(R*SQ*this.game.map.width))*R*SQ*this.game.map.width;pose.heading=Math.atan2(target.y-ground.y,target.x-ground.x);}
      let flightGround=ground;if(['bomber','stealthbomber','fighter','jetfighter','stealthfighter'].includes(u.type)&&attack&&!this.reduced){const f=Math.max(0,Math.min(1,(this.actionTime-attack.started)/1.1)),dest=this.position(this.game.map.tiles[attack.target.tile]);if(this.game.map.wrapX)dest.x+=Math.round((ground.x-dest.x)/(R*SQ*this.game.map.width))*R*SQ*this.game.map.width;pose.heading=Math.atan2(dest.y-ground.y,dest.x-ground.x)+(f>.70?Math.PI:0);const reach=f<.375?f/.375:f<.70?1:(1-f)/.30;flightGround={x:ground.x+(dest.x-ground.x)*reach,y:ground.y+(dest.y-ground.y)*reach};}if(spec.domain==='air'&&this.tileAtWorld(flightGround.x,flightGround.y)?.hidden)continue;
      const p=this.projectGround(flightGround.x,flightGround.y),altitude=aircraftAltitude(u.type,{time:this.actionTime,stage:pose.stage,attack,ghost,reduced:this.reduced})*scale;const companion=this.unitById?.get(u.linkedUnit),moving=u.activity?.action.type==='move'?u.activity:null,otherMove=companion?.activity?.action.type==='move'?companion.activity:null,progress=a=>Math.max(0,Math.min(1,(this.actionTime-a.started)/Math.max(.001,a.ends-a.started)));let pairing=companion?.tile===u.tile?1:0;if(moving?.action.detach&&pairing)pairing=1-progress(moving);else if(otherMove?.action.detach&&pairing)pairing=1-progress(otherMove);else if(moving&&companion?.tile===moving.to)pairing=progress(moving);else if(otherMove&&otherMove.to===u.tile)pairing=progress(otherMove);p.x+=companion?(u.id<companion.id?-1:1)*spread*.5*pairing:(index-(units.length-1)/2)*spread;const clearance=id=>{const n=this.game.map.tiles[id];return n&&(this.cityIndex.has(id)||n.district||n.improvement||n.fort)?22*scale:0;};if(spec.domain!=='air')p.y+=moving?clearance(moving.from)*(1-progress(moving))+clearance(moving.to)*progress(moving):clearance(tile);
      if(deckHost&&!attack){const host=this.projectGround(ground.x,ground.y),hostIndex=units.findIndex(v=>v.id===deckHost.id),slot=units.filter(v=>v.carrierId===deckHost.id).findIndex(v=>v.id===u.id);p.x=host.x+(hostIndex-(units.length-1)/2)*spread+(slot?12:-8)*baseScale;p.y=host.y-15*baseScale;}
      if(p.x<-160||p.x>this.width+160||p.y<-160||p.y-altitude>this.height+160)continue;
      if(PAINTED_UNITS[u.type]?.lazy&&!this.unitSprites.painted.sheets.has(u.type)&&!this.unitSprites.painted.pending.has(u.type))this.unitSprites.painted.ensure(u.type,()=>{this.dirty=true;});
      const transport=unitTransport(u,this.tileAtWorld(ground.x,ground.y)||t),active=!ghost&&this.selected?.type==='unit'&&this.selected.id===u.id,ready=u.moves>0&&!u.acted,rig=UNIT_RIGS[u.type],naval=spec.domain==='sea'||!!transport;
      const hasPainted=this.unitSprites.painted.sheets.has(u.type);let dx=0,dy=0,rotation=0,alpha=1;
      if(!this.reduced&&!ghost){
        const step=pose.phase;dy=-Math.abs(Math.sin(step))*profile.bob*scale*pose.weight;rotation=Math.sin(step)*Math.min(profile.swing,.08)*.3*pose.weight;
        if(pose.stage==='idle'&&this.zoom>=IDLE_MIN_ZOOM){dy+=Math.sin(this.actionTime*(naval?1.8:2.3)+u.id)*scale*(naval?.65:.28);if(naval)rotation+=Math.sin(this.actionTime*1.4+u.id)*.015;}
        if(pose.stage==='stop')rotation+=(pose.settle||0)*(rig.kind==='tracked'?.035:.018);dy+=(pose.settle||0)*scale*.55;
      }
      if(hasPainted){dy=0;rotation=0;}
      if(attack){const attackF=Math.max(0,Math.min(1,(this.actionTime-attack.started)/attack.duration)),target=this.screenNear(this.game.map.tiles[attack.target.tile],p),direction=Math.sign(target.x-p.x)||1,pulse=Math.sin(attackF*Math.PI);if(['melee','cavalry','naval'].includes(profile.family)){const reach=meleeApproach(attackF)*.52;dx=(target.x-p.x)*reach;dy+=(target.y-p.y)*reach;rotation=hasPainted?0:direction*pulse*profile.swing*.35;}else {dx=-direction*pulse*(hasPainted?1.5:4)*scale;rotation=hasPainted?0:-direction*pulse*profile.swing;}}
      const jump=this.unitJourneys.get(u.id);if(jump?.jump&&!this.reduced)dy-=Math.sin(Math.max(0,Math.min(1,(this.actionTime-jump.started)/jump.duration))*Math.PI)*48*scale;
      if(work&&!hasPainted){const workF=Math.max(0,(this.actionTime-work.started)/work.duration);dy-=Math.abs(Math.sin(workF*Math.PI*4))*2*scale;rotation+=Math.sin(workF*Math.PI*4)*.08;}
      if(hurt){const hurtF=Math.max(0,(this.actionTime-hurt.started)/hurt.duration);dx+=Math.sin(hurtF*32)*3*(1-hurtF);}
      const paintedDeath=ghost?.kind==='death'&&!!this.unitSprites.painted.sheets.get(u.type)?.death;
      if(ghost){const fade=Math.max(0,Math.min(1,(this.actionTime-ghost.started)/ghost.duration));alpha=paintedDeath?Math.min(1,(1-fade)/.28):(1-fade)**1.5;if(!hasPainted){dy+=fade*12;rotation+=ghost.kind==='death'?fade*.85:0;}}
      if(onlyIndex===null){
        const left=Math.min(p.x,p.x+dx)-90*scale,top=Math.min(p.y,p.y+dy-altitude)-110*scale;
        const first=this.unitHits.length,entry=this.worldSprites.draw('dynamic',(ghost?'ghost:'+ghost.kind+':':'unit:')+u.id,flightGround,{x:left,y:top,width:180*scale+Math.abs(dx),height:155*scale+Math.abs(dy)+altitude},sc=>this.drawUnits(sc,tile,units,ghost,index),{bottom:20*scale/this.zoom,lift:altitude/this.zoom*SY+2});
        for(let i=first;i<this.unitHits.length;i++)this.unitHits[i].worldDepth=entry.clipDepth;continue;
      }
      c.save();c.globalAlpha=alpha;if(!ghost)drawTravelEffects(c,p,u.type,pose,scale,naval||isWater(t),this.combatSprites);c.fillStyle=u.type==='drone'?'#142f3575':'#142f3555';c.beginPath();if(u.type==='drone'){c.save();c.translate(p.x,p.y+4*scale);c.transform(Math.cos(pose.heading)*scale,Math.sin(pose.heading)*SY*scale,-Math.sin(pose.heading)*scale,Math.cos(pose.heading)*SY*scale,0,0);for(const [x,y]of [[-9,-9],[9,-9],[-9,9],[9,9]]){c.moveTo(x+5,y);c.arc(x,y,5,0,Math.PI*2);}c.rect(-4,-4,8,8);c.fill();c.restore();}else{c.ellipse(p.x,p.y+4*scale,15*scale,5*scale,0,0,Math.PI*2);c.fill();}if(active){c.strokeStyle='#ffe4a3';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y+4*scale,20*scale,7*scale,0,0,Math.PI*2);c.stroke();}
      let art=null;
      // Arrived envoys periodically present their document while awaiting negotiations.
      const envoyPhase=u.type==='envoy'&&u.envoy?.state==='arrived'&&pose.stage==='idle'?Math.max(0,this.actionTime-(u.envoy.arrivedAt||0))%16/4.8:null;
      const action=paintedDeath&&!transport?'death':attack&&!transport?'attack':!transport&&(work||envoyPhase!==null&&envoyPhase<1)?'work':pose.stage==='move'&&pose.weight>.12?'move':'idle';
      const phase=action==='death'?Math.max(0,Math.min(.999,(this.actionTime-ghost.started)/ghost.duration)):action==='attack'?Math.max(0,Math.min(.999,(this.actionTime-attack.started)/attack.duration)):action==='work'?work?Math.max(0,Math.min(.999,(this.actionTime-work.started)/work.duration)):envoyPhase:action==='move'?pose.phase/(Math.PI*2):((this.actionTime*.24+u.id*.173)%1);
      const frameIndex=this.reduced||ghost&&!paintedDeath?-1:Math.floor(phase*this.unitSprites.frameCount)%this.unitSprites.frameCount,frame=this.unitSprites.frame(u.type,frameIndex,u.type==='giantdeathrobot'&&!u.ranged&&action==='attack'?'move':action,transport,u);
      if(frame&&this.zoom>.25){const size=(transport==='cargo'?70:transport?57:frame.size||(naval?57:48))*scale,facing=frame.painted?{scaleX:(Math.cos(pose.heading)<0?-1:1)*frame.baseSign,shear:0}:facingTransform(u.type,pose.heading,transport?1:frame.baseSign??rig.baseSign),{scaleX,shear}=facing;art={frame,size,rotation,scaleX,shear,left:-size/2,top:frame.baseline?-size*frame.baseline:-size+11*scale,anchor:{x:p.x+dx,y:p.y+dy-altitude}};if(!window.__noRelight&&!altitude&&u.type!=='drone')drawSunShadow(c,frame.canvas,art,scale);c.save();c.translate(art.anchor.x,art.anchor.y);c.rotate(rotation);c.transform(scaleX,0,shear,1,0,0);if(hurt&&this.actionTime-hurt.started<.35)c.filter='brightness(1.7)';if(u.type==='envoy'&&u.envoy?.protected){c.shadowColor='#ffd35e';c.shadowBlur=20*scale;c.filter='brightness(1.25) sepia(.2)';}c.drawImage(window.__noRelight?frame.canvas:relitFrame(frame.canvas,scaleX<0),art.left,art.top,size,size);c.restore();}

      const badgeScale=Math.max(.72,Math.min(1.18,scale)),badgeY=p.y-68*scale,badge=!ghost?drawUnitBadge(c,u.type,p.x,badgeY,color,{scale:badgeScale,active,ready,secondary:this.game.players[u.owner]?.secondaryColor}):null;
      if(u.hp<(u.maxHp||spec.maxHp||100)){c.fillStyle='#593d33';c.fillRect(p.x-15*scale,p.y+9*scale,30*scale,3);c.fillStyle='#bcdb91';c.fillRect(p.x-15*scale,p.y+9*scale,30*scale*Math.max(0,u.hp)/(u.maxHp||spec.maxHp||100),3);}c.restore();
      if(!ghost){
        let bounds={x:p.x-34*scale,y:p.y-55*scale,width:68*scale,height:69*scale};
        if(art){const corners=[];for(const x of [art.left,art.left+art.size])for(const y of [art.top,art.top+art.size]){const xx=art.scaleX*x+art.shear*y;corners.push({x:art.anchor.x+xx*Math.cos(rotation)-y*Math.sin(rotation),y:art.anchor.y+xx*Math.sin(rotation)+y*Math.cos(rotation)});}const xs=corners.map(v=>v.x),ys=corners.map(v=>v.y),left=Math.min(...xs)-1,top=Math.min(...ys)-1;bounds={x:left,y:top,width:Math.max(...xs)-left+1,height:Math.max(...ys)-top+1};}
        const hit={unit:u,kind:'sprite',...bounds,art,ground:{x:p.x,y:p.y},altitude,pose:{stage:pose.stage,heading:pose.heading,frame:frameIndex,action,transport}};this.unitHits.push(hit);if(u.type==='drone')this.unitHits.push({unit:u,kind:'shadow',x:p.x-18*scale,y:p.y-3*scale,width:36*scale,height:14*scale});if(badge){const badgeHit={unit:u,kind:'badge',...badge};this.unitHits.push(badgeHit);this.labelBlocks.push(badgeHit);}this.labelBlocks.push(hit);if(names&&!deckHost)this.unitLabels.push({unit:u,screen:p,color,active,ready,transport});
      }
      // Reuse repeated idle pose textures while their geometry moves in the scene.
      if(!ghost&&this.game.players[u.owner]?.manual&&this.game.visuals?.view===u.owner&&(u.upgradeOptions?.some(o=>o.available)||veteranChoices(u).length)){const bx=p.x+23*badgeScale,by=badgeY;c.save();c.fillStyle='#173135';c.strokeStyle='#f3d38e';c.lineWidth=1.3*scale;c.beginPath();c.arc(bx,by,7*scale,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(bx-4*scale,by+1*scale);c.lineTo(bx,by-3*scale);c.lineTo(bx+4*scale,by+1*scale);c.moveTo(bx,by-3*scale);c.lineTo(bx,by+4*scale);c.stroke();c.restore();this.unitHits.push({unit:u,kind:'promotion',x:bx-8*scale,y:by-8*scale,width:16*scale,height:16*scale});}
      if(onlyIndex!==null)return {source:frame?.canvas,key:[scale,color,ready,active,u.hp,u.maxHp,transport,altitude,art?.scaleX,art?.shear,rotation,dx,dy,alpha,hurt?this.actionTime:0,u.envoy?.protected,pose.stage==='idle'?0:this.actionTime].join(',')};
    }
  }
  drawActionEffects(c){
    for(const e of this.effects){const elapsed=this.actionTime-e.started;if(elapsed<0)continue;const f=Math.min(1,elapsed/e.duration),a=this.screen(this.game.map.tiles[e.actor.tile]),profile=e.actor.type==='giantdeathrobot'&&e.actor.ranged===false?UNIT_MOTIONS.warrior:UNIT_MOTIONS[e.actor.type]||{family:'shell'};
      c.save();c.globalAlpha=Math.sin(f*Math.PI);c.lineCap='round';
      if(e.kind==='launch'){drawSpaceLaunch(this,c,e,f);c.restore();continue;}
      if(e.kind==='attack'){
        const b=this.screenNear(this.game.map.tiles[e.target.tile],a),scale=Math.max(.4,1.15*this.zoom/DEFAULT_ZOOM),art=this.unitHits.find(h=>h.kind==='sprite'&&h.unit.id===e.actor.id)?.art;let painted=false;a.y-=23*scale;b.y-=16*scale;
        if(art?.frame.painted&&art.frame.muzzle){const [mx,my]=art.frame.muzzle,lx=art.left+art.size*mx,ly=art.top+art.size*my,xx=art.scaleX*lx+art.shear*ly;a.x=art.anchor.x+xx*Math.cos(art.rotation)-ly*Math.sin(art.rotation);a.y=art.anchor.y+xx*Math.sin(art.rotation)+ly*Math.cos(art.rotation);painted=true;}
        drawAttack(c,{a,b,f,family:profile.family,type:e.actor.type,scale,water:isWater(this.game.map.tiles[e.target.tile]),vfx:this.combatSprites,painted});
      }else if(e.kind==='nuke'){const b=this.screenNear(this.game.map.tiles[e.target.tile],a);c.fillStyle='#ffdca8';c.globalAlpha=(1-f)*.8;c.beginPath();c.ellipse(b.x,b.y-40*f,20+f*100,12+f*65,0,0,Math.PI*2);c.fill();}else if(e.kind==='hurt'){c.font='bold 13px Georgia';c.textAlign='center';c.fillStyle='#ffe1c3';c.shadowColor='#421e15';c.shadowBlur=4;c.fillText('-'+Math.round(e.damage),a.x,a.y-46-f*20);}
      else if(e.kind==='work'){const p=e.action==='heal'&&e.target?this.screenNear(this.game.map.tiles[e.target.tile],a):a;c.strokeStyle=e.action==='heal'?'#a4d5a9':e.actor.type==='missionary'?'#dab3ef':'#ffe3aa';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,8+f*24,3+f*9,0,0,Math.PI*2);c.stroke();}
      c.restore();
    }
  }
  drawRouteOverlay(c){
    for(const id of this.orderPreview?.nuclear||[]){const p=this.screen(this.game.map.tiles[id]);c.fillStyle='#df764950';c.strokeStyle='#ffd0a2';c.beginPath();c.ellipse(p.x,p.y,25*this.zoom,14*this.zoom,0,0,Math.PI*2);c.fill();c.stroke();}
    const cityById=new Map(this.game.cities.map(city=>[city.id,city]));for(const route of this.game.routes){const from=cityById.get(route.from),to=cityById.get(route.to);if(!from||!to)continue;const a=this.screen(this.game.map.tiles[from.tile]),b=this.screenNear(this.game.map.tiles[to.tile],a);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle='#e9d2a57a';c.lineWidth=1;c.setLineDash([4,6]);c.stroke();c.setLineDash([]);const f=this.reduced?.5:(this.actionTime*.07+route.id*.13)%1;c.beginPath();c.arc(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,2.5,0,Math.PI*2);c.fillStyle='#ffe0a3';c.fill();}
  }
  get diagnostics(){return {engine:'Three.js',relight:relightStats,lighting:{baked:true,bakes:this.lightingBakeCount,...this.lightingBake?.stats},culling:{...this.cullingStats,units:this.unitCullingStats},terrainBuild:this.terrainBuildStats,shore:this.shoreStats,fishStyle:'submerged-shadows',borderStyle:this.borderStyle,resourceReady:!!this.resourceReady,resourceFrames:this.resourceFrameCounts,waterReady:!!this.waterReady,extraArtReady:!!this.extraArtReady,version:THREE.REVISION,tiles:this.game?.map.tiles.length,artReady:!!this.artReady,renderedFrames:this.renderedFrames,drawCalls:(this.worldRenderStats?.calls||0)+1,triangles:this.worldRenderStats?.triangles||0,geometries:this.gpu.info.memory.geometries,tilePixels:{width:R*SQ*this.zoom,height:R*2*SY*this.zoom},motionTypes:Object.keys(UNIT_MOTIONS).length,scenery:this.sceneryStats,camera:{wrap:this.wrapWorld,copies:this.visibleCopies,bounds:this.cameraBounds,minimumZoom:this.minimumZoom},unitAnimation:{rigs:Object.keys(UNIT_RIGS).length,framesPerCycle:this.unitSprites.frameCount,cachedFrames:this.unitSprites.frames.size,paintedTypes:[...this.unitSprites.painted.sheets.keys()],paintedFrames:this.unitSprites.painted.frames.size,paintedErrors:this.unitSprites.painted.errors,combatAtlasReady:this.combatSprites.ready,activeJourneys:this.unitJourneys.size,activeTurns:this.unitTurns.size},resourceTypes:Object.keys(RESOURCE_MARKS).length,activeEffects:[...this.effects.map(e=>({kind:e.kind,type:e.actor.type,id:e.actor.id})),...[...this.unitJourneys].map(([id,j])=>({kind:'move',type:j.type,id}))],cityEdges:this.cityEdges?.length,modelsReady:!!this.modelsReady,modelsLoaded:this.models.models.size,modelErrors:this.models.errors,buildingInstances:this.models.instanceCount,facilityReady:!!this.facilityReady,facilityFrames:this.facilityFrameCounts,modernizationReady:!!this.modernizationReady,modernizationFrames:this.modernizationFrameCounts,rivers:this.riverStats,unitScale:1.15*this.zoom/DEFAULT_ZOOM,borderWidths:this.borderMetrics,textureReady:!!this.textureReady,terrainMaterials:this.materialTileCounts,mountainMaterials:['rock','snow'],roadSegments:this.roadSegments,contactShadows:true};}
}
