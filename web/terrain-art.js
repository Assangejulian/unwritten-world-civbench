import * as THREE from './vendor/three/three.module.js';
import {DIRECTIONS,isWater} from '/rules.mjs';
const rand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const TERRAIN_MATERIALS=['grass','meadow','rock','sand','forest','snow'];
export const BIOME_VARIANTS=['grass','plains','desert','tundra','snow'];
// Measured boundaries of the selected ImageGen atlas, not an assumed even grid.
export const BIOME_ATLAS_GRID={width:1122,height:1402,columns:[0,273,561,848,1122],rows:[0,263,524,797,1073,1402],padding:5};
export function surfaceDetail(tile){return tile.hidden||isWater(tile)?[0,0]:[tile.hill&&tile.terrain!=='mountain'?1:0,tile.terrain==='tundra'?1:0];}
// Interior ridges vanish at shared borders and at the unit contact anchor.
export function hillRelief(tile,u,v,x,z){
  if(!tile.hill||tile.hidden||isWater(tile)||tile.terrain==='mountain')return 0;
  const edge=u+v,seed=(tile.variant??tile.id??0)*.71;
  return Math.sin(Math.PI*edge)*Math.sin(Math.PI*edge)*
    (3.8*Math.sin(x*.10+seed)*Math.cos(z*.085-seed*.7)+2.4*Math.sin(x*.16+z*.13+seed));
}
export function surfaceWeights(tile){
  const weights=[0,0,0,0,0,0];
  if(tile.hidden||tile.terrain==='ocean'||tile.terrain==='coast')return weights;
  if(tile.terrain==='tundra'){weights[1]=.45;weights[2]=.25;weights[5]=.3;}
  else weights[({grass:0,plains:1,mountain:2,desert:3,snow:5})[tile.terrain]??0]=1;
  if(tile.feature==='forest'||tile.feature==='jungle'){for(let i=0;i<6;i++)weights[i]*=.2;weights[4]+=.8;}
  return weights;
}
const atlasShader=`
  uniform sampler2D terrainAtlas;
  vec3 terrainSample(float materialId,vec2 coordinates){
    vec2 cell=vec2(mod(materialId,3.0),1.0-floor(materialId/3.0));
    vec2 uv=cell*vec2(1.0/3.0,.5)+vec2(.002,.003)+fract(coordinates)*vec2(1.0/3.0-.004,.494);
    vec2 scale=vec2(1.0/3.0-.004,.494);
    return textureGrad(terrainAtlas,uv,dFdx(coordinates)*scale,dFdy(coordinates)*scale).rgb;
  }
`;
export function mountainGeometry(seed=0){
  const n=14,vertices=[],uv=[],indices=[],colors=[];
  for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){
    const u=x/n*2-1,v=z/n*2-1,edge=Math.max(0,1-Math.max(Math.abs(u),Math.abs(v))**2),ridge=Math.exp(-Math.abs(u*.8+v*.24)*3.8),noise=(rand(x*19+z*53+seed)-.5)*.2,h=Math.max(0,(ridge*.66+Math.exp(-((u-.15)**2+(v+.2)**2)*4)*.43+noise)*edge);
    vertices.push(u,h,v);uv.push((u+1)*.165+.667,(v+1)*.245+.505);
    const color=new THREE.Color(h>.71?'#f3f0e7':h>.58?'#a9abb0':h>.3?'#86898e':'#777b70');color.multiplyScalar(.87+rand(x*41+z*13)*.25);colors.push(color.r,color.g,color.b);
    if(x<n&&z<n){const a=z*(n+1)+x,b=a+1,c=a+n+1,d=c+1;indices.push(a,c,b,b,c,d);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function pineGeometry(){
  const positions=[],colors=[],indices=[];
  const color=new THREE.Color();
  for(let tier=0;tier<4;tier++){
    const base=tier*.18+.08,radius=.47-tier*.09,height=.48-tier*.045,offset=positions.length/3;
    for(let ring=0;ring<2;ring++)for(let i=0;i<10;i++){const angle=i*Math.PI/5,r=ring?radius*.025:radius*(.82+rand(i+tier*11)*.25);positions.push(Math.cos(angle)*r,base+(ring?height:rand(i*19+tier)*.08),Math.sin(angle)*r);color.set(ring?'#8eaa52':'#477d34').multiplyScalar(.7+rand(i*17+tier)*.5);colors.push(color.r,color.g,color.b);}
    for(let i=0;i<10;i++){const j=(i+1)%10;indices.push(offset+i,offset+10+i,offset+j,offset+j,offset+10+i,offset+10+j);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function leafGeometry(){
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,colors=[],color=new THREE.Color();
  for(let i=0;i<p.count;i++){const n=rand(i*31),scale=.88+n*.18;p.setXYZ(i,p.getX(i)*scale,p.getY(i)*scale,p.getZ(i)*scale);color.set(p.getY(i)>.1?'#86a444':'#426c32').multiplyScalar(.75+n*.3);colors.push(color.r,color.g,color.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
// A spatial index keeps distance sampling local on huge maps and ignores hidden shores.
export function shoreProfile(tiles,index,position,radius,period=0){
  const edges=[],bins=new Map(),cache=new Map(),cellSize=120;
  for(const tile of tiles){
    if(tile.hidden||isWater(tile))continue;const p=position(tile);
    for(let i=0;i<6;i++){
      const [dq,dr]=DIRECTIONS[i],neighbor=index.get(`${tile.q+dq},${tile.r+dr}`);if(!neighbor||neighbor.hidden||!isWater(neighbor))continue;
      const a=(-30-i*60)*Math.PI/180,b=(30-i*60)*Math.PI/180,edge={ax:p.x+Math.cos(a)*radius,az:p.y+Math.sin(a)*radius,bx:p.x+Math.cos(b)*radius,bz:p.y+Math.sin(b)*radius};edges.push(edge);
      for(const offset of period?[-period,0,period]:[0]){
        if(offset&&Math.min(edge.ax,edge.bx)+offset>75+period+radius||offset&&Math.max(edge.ax,edge.bx)+offset<75-radius)continue;
        const copy=offset?{ax:edge.ax+offset,az:edge.az,bx:edge.bx+offset,bz:edge.bz}:edge;
        for(let x=Math.floor((Math.min(copy.ax,copy.bx)-40)/cellSize);x<=Math.floor((Math.max(copy.ax,copy.bx)+40)/cellSize);x++)for(let z=Math.floor((Math.min(copy.az,copy.bz)-40)/cellSize);z<=Math.floor((Math.max(copy.az,copy.bz)+40)/cellSize);z++){const key=x+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(copy);}
      }
    }
  }
  return {edges:edges.length,distanceAt(x,z,water){
    const key=Math.round(x*100)+':'+Math.round(z*100);let nearest=cache.get(key);
    if(nearest===undefined){nearest=120;for(const edge of bins.get(Math.floor(x/cellSize)+':'+Math.floor(z/cellSize))||[]){const dx=edge.bx-edge.ax,dz=edge.bz-edge.az,t=Math.max(0,Math.min(1,((x-edge.ax)*dx+(z-edge.az)*dz)/(dx*dx+dz*dz)));nearest=Math.min(nearest,Math.hypot(x-edge.ax-t*dx,z-edge.az-t*dz));}cache.set(key,nearest);}
    return water?nearest:-nearest;
  }};
}

const fishShader=`
  float fishShadow(vec2 point,vec2 center,float angle){
    float c=cos(angle),s=sin(angle);vec2 p=mat2(c,-s,s,c)*(point-center);
    float body=1.0-smoothstep(.85,1.12,length(p/vec2(3.5,1.1)));
    float tail=1.0-smoothstep(-.05,.3,max(abs(p.x+4.3)-1.4,abs(p.y)+.55*p.x+1.7));
    return max(body,tail*.85);
  }
`;
const biomeShader=`
  uniform sampler2D biomeAtlas;
  float terrainNoise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float terrainBlend(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(terrainNoise(i),terrainNoise(i+vec2(1.,0.)),f.x),mix(terrainNoise(i+vec2(0.,1.)),terrainNoise(i+vec2(1.)),f.x),f.y);}
  vec3 biomeCell(float biome,float variant,vec2 p){
    float left=variant<.5?0.0:variant<1.5?273.0:variant<2.5?561.0:848.0;
    float right=variant<.5?273.0:variant<1.5?561.0:variant<2.5?848.0:1122.0;
    float top=biome<.5?0.0:biome<1.5?263.0:biome<2.5?524.0:biome<3.5?797.0:1073.0;
    float bottom=biome<.5?263.0:biome<1.5?524.0:biome<2.5?797.0:biome<3.5?1073.0:1402.0;
    vec2 origin=vec2(left+5.0,1402.0-bottom+5.0)/vec2(1122.0,1402.0);
    vec2 scale=vec2(right-left-10.0,bottom-top-10.0)/vec2(1122.0,1402.0);
    // Mirrored sampling meets continuously even when generated tile edges differ.
    vec2 mirrored=1.0-abs(fract(p*.5)*2.0-1.0);
    vec2 uv=origin+mirrored*scale;
    return textureGrad(biomeAtlas,uv,dFdx(p)*scale,dFdy(p)*scale).rgb;
  }
  vec3 biomeSurface(float biome,vec2 p,float hill){
    p+=vec2(sin(vGround.z*.019+sin(vGround.x*.013)),cos(vGround.x*.017+sin(vGround.z*.011)))*.28;
    float patches=smoothstep(.20,.80,terrainBlend(vGround.xz/93.0+biome*7.0));
    vec3 flatSurface=mix(biomeCell(biome,0.0,p),biomeCell(biome,1.0,p+vec2(.37,.61)),patches);
    if(hill<.005)return flatSurface;
    vec3 slope=mix(biomeCell(biome,2.0,p),biomeCell(biome,3.0,p+vec2(.61,.29)),patches);
    return mix(flatSurface,slope,clamp(hill,0.0,1.0));
  }
`;
export function groundMaterial(texture,waterTexture,biomeTexture=null){
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94});
  material.customProgramCacheKey=()=> 'biome-hills-cached-ground-lighting-v6';
  material.onBeforeCompile=shader=>{
    shader.uniforms.terrainAtlas={value:texture};shader.uniforms.biomeAtlas={value:biomeTexture||texture};shader.uniforms.useBiomeAtlas={value:biomeTexture?1:0};shader.uniforms.waterNormal={value:waterTexture};shader.uniforms.waterTime={value:0};shader.uniforms.showResourceScenery={value:1};material.userData.time=shader.uniforms.waterTime;material.userData.resources=shader.uniforms.showResourceScenery;
    const bake=material.userData.bakedLighting;
    if(bake){shader.uniforms.bakedLightMap=bake.map;shader.uniforms.bakedLightBounds=bake.bounds;shader.uniforms.bakedShadowStrength=bake.shadow;}
    const varyings='varying vec2 vSurfaceDetail;varying vec2 vWaterData;varying vec3 vGround;varying vec3 vSurfaceA;varying vec3 vSurfaceB;varying float vSurfaceLight;varying float vShoreDistance;varying vec3 vFishData;\n';
    shader.vertexShader='attribute vec2 surfaceDetail;attribute float shoreDistance;attribute vec3 fishData;attribute vec2 waterData;attribute vec3 surfaceA;attribute vec3 surfaceB;attribute float surfaceLight;\n'+varyings+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfaceDetail=surfaceDetail;vShoreDistance=shoreDistance;vFishData=fishData;vWaterData=waterData;vGround=position;vSurfaceA=surfaceA;vSurfaceB=surfaceB;vSurfaceLight=surfaceLight;');
    shader.fragmentShader='float bhash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float bnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(bhash(i),bhash(i+vec2(1,0)),f.x),mix(bhash(i+vec2(0,1)),bhash(i+1.0),f.x),f.y);}\n'+'uniform float useBiomeAtlas;uniform sampler2D waterNormal;uniform float waterTime;uniform float showResourceScenery;\n'+atlasShader+varyings+biomeShader+fishShader+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 coordinates=vGround.xz/68.0;
      // Round 2: perturb blend weights with ALU value noise (no texture fetch); only acts where weights are mixed.
      vec3 sA=vSurfaceA,sB=vSurfaceB;{
        float total=dot(sA+sB,vec3(1.0));
        if(total>.001){vec2 q=vGround.xz*.045;
          float n1=bnoise(q)*.65+bnoise(q*2.7+17.3)*.35,n2=bnoise(q+41.7)*.65+bnoise(q*2.7+5.1)*.35;
          vec3 pa=vec3(n1,n2,1.0-n1)-.5,pb=vec3(1.0-n2,.5*(n1+n2),n1*.6+n2*.4)-.5;
          vec3 a=sA/total,b=sB/total;
          a=max(a+pa*a*(1.0-a)*3.2,0.0);b=max(b+pb*b*(1.0-b)*3.2,0.0);
          // fix-specks: no cubing - it pushed forest floor (slot 4) from .8 to ~.98 and exposed its green speckle.
          float t2=dot(a+b,vec3(1.0));sA=a/max(t2,1e-4)*total;sB=b/max(t2,1e-4)*total;}
      }
      vec3 surface=vec3(0.0);
      if(sA.x>.001)surface+=terrainSample(0.0,coordinates)*sA.x;
      if(sA.y>.001)surface+=terrainSample(1.0,coordinates)*sA.y;
      if(sA.z>.001)surface+=terrainSample(2.0,coordinates)*sA.z;
      if(sB.x>.001)surface+=terrainSample(3.0,coordinates)*sB.x;
      if(sB.y>.001)surface+=terrainSample(4.0,coordinates)*sB.y;
      if(sB.z>.001)surface+=terrainSample(5.0,coordinates)*sB.z;
      float coverage=dot(sA+sB,vec3(1.0));
      surface/=max(coverage,.001);
      if(useBiomeAtlas>.5&&coverage>.001){
        float hill=clamp(vSurfaceDetail.x,0.0,1.0),tundra=clamp(vSurfaceDetail.y,0.0,1.0);
        vec3 detail=vec3(0.0);
        if(sA.x>.001)detail+=biomeSurface(0.0,coordinates,hill)*sA.x;
        if(sA.y>.001)detail+=biomeSurface(1.0,coordinates,hill)*sA.y;
        if(sA.z>.001)detail+=terrainSample(2.0,coordinates)*sA.z;
        if(sB.x>.001)detail+=biomeSurface(2.0,coordinates,hill)*sB.x;
        if(sB.y>.001)detail+=terrainSample(4.0,coordinates)*sB.y;
        if(sB.z>.001)detail+=biomeSurface(4.0,coordinates,hill)*sB.z;
        surface=mix(detail/max(coverage,.001),biomeSurface(3.0,coordinates,hill),tundra*(1.0-sB.y));
      }
      float broad=sin(vGround.x*.023+sin(vGround.z*.017))*cos(vGround.z*.021);
      diffuseColor.rgb=mix(diffuseColor.rgb,surface*vSurfaceLight*(.86+broad*.025)+diffuseColor.rgb*.14,clamp(coverage,0.0,1.0));
      float shore=vShoreDistance+sin(vGround.x*.23+sin(vGround.z*.14))*1.7+sin(vGround.z*.37+vGround.x*.17)*.6;
      if(vWaterData.x>.5||shore>-16.0){
        vec2 uv=vGround.xz/110.0;
        vec3 waves=texture2D(waterNormal,uv+vec2(waterTime*.003,waterTime*.0015)).rgb;
        vec3 crossing=texture2D(waterNormal,uv*1.73-vec2(waterTime*.0017,waterTime*.002)).rgb;
        float depth=clamp(vWaterData.y,0.0,1.0);
        vec3 shallow=vec3(.075,.36,.32),shelf=vec3(.025,.17,.23),deep=vec3(.006,.027,.075);
        float glint=pow(max(0.0,(waves.r+crossing.g)*.5-.42),3.0)*.32;
        vec3 sea=mix(mix(shallow,shelf,smoothstep(.05,.58,depth)),deep,smoothstep(.58,1.0,depth))+vec3(.06,.09,.10)*glint+vec3(.008,.011,.014)*(waves.b-.7);
        if(vWaterData.x>.5&&vFishData.z>.5&&showResourceScenery>.5){
          float phase=fract(sin(dot(vFishData.xy,vec2(.13,.17)))*43758.5)*6.283;
          vec2 local=vGround.xz-vFishData.xy-vec2(sin(waterTime*.30+phase)*1.2,cos(waterTime*.23+phase)*.8);
          float fish=max(fishShadow(local,vec2(-7.0,-3.0),phase*.15+.3),max(fishShadow(local,vec2(1.0,4.0),phase*.15+.1),fishShadow(local,vec2(8.0,-1.0),phase*.15+.5)));
          sea=mix(sea,mix(vec3(.025,.15,.15),vec3(.028,.075,.10),depth),fish*.28);
          float ripple=sin(length(local*vec2(.8,1.2))*.9-waterTime*.65+phase);
          float wake=smoothstep(.94,1.0,ripple)*exp(-length(local)*.13)*.012;
          sea+=vec3(.5,.65,.65)*wake;
        }
        vec3 drySand=terrainSample(3.0,coordinates)*.86;
        drySand=mix(drySand,terrainSample(2.0,coordinates)*.8,clamp(vSurfaceB.z,0.0,.75));
        vec3 wetSand=mix(drySand*.60,shallow,.28);
        vec3 beach=mix(drySand,wetSand,smoothstep(-2.5,2.5,shore));
        if(vWaterData.x>.5)diffuseColor.rgb=mix(beach,sea,smoothstep(1.2,7.5,shore))*vSurfaceLight;
        else diffuseColor.rgb=mix(diffuseColor.rgb,beach*vSurfaceLight,smoothstep(-14.0,-4.0,shore));
        float foam=exp(-pow((shore-5.5-sin(waterTime*.6)*.35)*1.3,2.0))*smoothstep(.35,.75,waves.r)*.025;
        diffuseColor.rgb+=vec3(.6,.65,.60)*foam*vSurfaceLight;
      }

    `);
    if(bake){
      shader.fragmentShader='uniform sampler2D bakedLightMap;uniform vec4 bakedLightBounds;uniform float bakedShadowStrength;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
        vec2 lightUV=(vGround.xz-bakedLightBounds.xy)/bakedLightBounds.zw;

        float landMask=1.0-step(.5,vWaterData.x);
        vec4 bakedFull=texture2D(bakedLightMap,clamp(lightUV,0.0,1.0));vec2 groundShade=bakedFull.rg;
        float macro=(bakedFull.b-.5)*2.0,relief=(bakedFull.a-.5)*2.0;
        reflectedLight.indirectDiffuse*=(1.0-groundShade.r*.78*landMask)*(1.0+macro*.16*landMask)*(1.0+min(relief,0.0)*.55*landMask);
        reflectedLight.directDiffuse*=(1.0+macro*.12*landMask)*clamp(1.0+relief*(relief>0.0?.35:.85)*landMask,.12,1.4);
        reflectedLight.directDiffuse*=1.0-groundShade.g*bakedShadowStrength*landMask;
      `);
    }
  };return material;
}

export function mountainMaterial(texture){
  const material=new THREE.MeshStandardMaterial({roughness:.97,bumpMap:texture,bumpScale:.26});
  material.customProgramCacheKey=()=> 'rock-and-snow-surfaces-v1';
  material.onBeforeCompile=shader=>{
    shader.uniforms.terrainAtlas={value:texture};
    const varyings='varying vec3 vMountainPosition;varying vec3 vMountainNormal;\n';
    shader.vertexShader=varyings+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMountainPosition=position;vMountainNormal=normal;');
    shader.fragmentShader=atlasShader+varyings+`
      vec3 mountainSample(float materialId){
        vec3 weights=pow(abs(normalize(vMountainNormal)),vec3(4.0));
        weights/=max(dot(weights,vec3(1.0)),.001);
        vec3 p=vMountainPosition*1.6;
        return terrainSample(materialId,p.zy)*weights.x+terrainSample(materialId,p.xz)*weights.y+terrainSample(materialId,p.xy)*weights.z;
      }
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float snowLine=.63+sin(vMountainPosition.x*14.0+vMountainPosition.z*9.0)*.035;
      float snowCover=smoothstep(snowLine,snowLine+.16,vMountainPosition.y);
      vec3 rock=mountainSample(2.0),snow=mountainSample(5.0);
      diffuseColor.rgb*=mix(rock*.92,snow*1.08,snowCover);
    `);
  };return material;
}

export function waterways(segments,heightAt,waterTexture){
  const points=new Map(),edges=[],neighbors=new Map(),seen=new Set(),positions=[],uvs=[],offsets=[];
  const key=(x,z)=>Math.round(x*100)+','+Math.round(z*100);
  for(let i=0;i<segments.length;i+=6){
    const a=key(segments[i],segments[i+2]),b=key(segments[i+3],segments[i+5]),pair=[a,b].sort().join('|');if(seen.has(pair))continue;seen.add(pair);
    points.set(a,new THREE.Vector3(segments[i],segments[i+1],segments[i+2]));points.set(b,new THREE.Vector3(segments[i+3],segments[i+4],segments[i+5]));
    const id=edges.length;edges.push([a,b]);for(const p of [a,b]){if(!neighbors.has(p))neighbors.set(p,[]);neighbors.get(p).push(id);}
  }
  const used=new Set();let chains=0;
  const vertex=(x,z,u,v,offset=.28)=>{positions.push(x,heightAt(x,z)+offset,z);uvs.push(u,v);offsets.push(offset);};
  for(let edge=0;edge<edges.length;edge++){
    if(used.has(edge))continue;let [a,b]=edges[edge];const chain=[a,b];used.add(edge);
    for(const front of [true,false]){let end=front?a:b;while(neighbors.get(end)?.length===2){const next=neighbors.get(end).find(i=>!used.has(i));if(next===undefined)break;used.add(next);end=edges[next].find(p=>p!==end);if(front)chain.unshift(end);else chain.push(end);}}
    chains++;const curve=new THREE.CatmullRomCurve3(chain.map(k=>points.get(k)),false,'centripetal'),samples=curve.getPoints(Math.max(8,chain.length*10));let distance=0;
    const sections=samples.map((p,i)=>{if(i)distance+=p.distanceTo(samples[i-1]);const previous=samples[Math.max(0,i-1)],next=samples[Math.min(samples.length-1,i+1)],dx=next.x-previous.x,dz=next.z-previous.z,length=Math.hypot(dx,dz)||1,halfWidth=3.9+Math.sin(p.x*.051+p.z*.033)*.75+Math.sin(distance*.093+p.z*.013)*.4;return {x:p.x,z:p.z,nx:-dz/length*halfWidth,nz:dx/length*halfWidth,d:distance};});
    for(let i=1;i<sections.length;i++){const p=sections[i-1],q=sections[i];for(const [s,side]of [[p,1],[p,-1],[q,1],[q,1],[p,-1],[q,-1]])vertex(s.x+s.nx*side,s.z+s.nz*side,side,s.d);}
  }
  // Small confluence pools join branches; source caps blend into the bank.
  for(const [id,near]of neighbors){if(near.length===2)continue;const p=points.get(id),radius=near.length===1?1.65:2.9;for(let j=0;j<20;j++){const a=j*Math.PI/10,b=(j+1)*Math.PI/10;vertex(p.x,p.z,0,0,.3);vertex(p.x+Math.cos(a)*radius,p.z+Math.sin(a)*radius,0,0,.3);vertex(p.x+Math.cos(b)*radius,p.z+Math.sin(b)*radius,0,0,.3);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('surfaceOffset',new THREE.Float32BufferAttribute(offsets,1));geometry.computeVertexNormals();
  const material=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0},waterNormal:{value:waterTexture}},vertexShader:'varying vec2 vRiver;varying vec2 vWorld;void main(){vRiver=uv;vWorld=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
    uniform float time;uniform sampler2D waterNormal;varying vec2 vRiver;varying vec2 vWorld;
    void main(){
      float irregular=sin(vWorld.x*.33+sin(vWorld.y*.19))*sin(vWorld.y*.41+vWorld.x*.09)*.035;
      float edge=abs(vRiver.x+irregular),water=1.0-smoothstep(.70,.88,edge);
      vec3 wave=texture2D(waterNormal,vWorld/58.0+vec2(time*.005,-time*.002)).rgb;
      vec3 crossing=texture2D(waterNormal,vWorld/33.0-vec2(time*.001,time*.003)).rgb;
      float ripple=(wave.r+crossing.g-1.0)*.022;
      vec3 silt=vec3(.17,.145,.085),channel=vec3(.030,.102,.095);
      vec3 surface=mix(channel,silt,smoothstep(.15,.92,edge)*.48)+vec3(.7,1.0,.9)*ripple;
      float fleck=pow(max(0.0,wave.r*crossing.g-.65),3.0)*.10;
      surface+=vec3(.52,.59,.48)*fleck;
      float alpha=(1.0-smoothstep(.85,1.0,edge))*mix(.52,1.0,water);
      gl_FragColor=vec4(mix(silt*.7,surface,water),alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='river-channel-and-banks';mesh.userData={segments:edges.length,chains,junctions:[...neighbors.values()].filter(a=>a.length>2).length,width:5.9,widthRange:[4.1,7.6],banks:true,carved:true,normalTexture:true,animated:true};return mesh;
}

export class ContactPass{
  constructor(renderer){
    this.renderer=renderer;this.target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});this.target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.groundTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});this.groundTarget.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    this.groundDepthMaterial=new THREE.MeshBasicMaterial({colorWrite:false});
    this.groundCanvas=document.createElement('canvas');this.groundCanvas.width=this.groundCanvas.height=1;this.groundTexture=new THREE.CanvasTexture(this.groundCanvas);this.groundTexture.colorSpace=THREE.SRGBColorSpace;
    this.material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{colorMap:{value:this.target.texture},depthMap:{value:this.target.depthTexture},groundDepth:{value:this.groundTarget.depthTexture},groundMarks:{value:this.groundTexture},pixel:{value:new THREE.Vector2(1,1)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
      uniform sampler2D colorMap;uniform sampler2D depthMap;uniform sampler2D groundDepth;uniform sampler2D groundMarks;uniform vec2 pixel;varying vec2 vUv;
      void main(){vec4 color=texture2D(colorMap,vUv);float depth=texture2D(depthMap,vUv).x,occlusion=0.0;
        for(int i=0;i<12;i++){float angle=float(i)*2.399963;vec2 offset=vec2(cos(angle),sin(angle))*pixel*(2.0+float(i)*.55);float sampleDepth=texture2D(depthMap,vUv+offset).x;float delta=depth-sampleDepth;occlusion+=step(.00003,delta)*(1.0-smoothstep(.0003,.003,delta));}
        color.rgb*=1.0-occlusion*.018;
        vec4 marks=texture2D(groundMarks,vUv);float ground=texture2D(groundDepth,vUv).x;
        // Ground ink cannot paint over a structure closer than the terrain.
        color.rgb=mix(color.rgb,marks.rgb,marks.a*step(ground-.000005,depth));gl_FragColor=color;
        #include <tonemapping_fragment>
        // Study: restrained colour grade (display space) - slight desaturation, cool shadows / warm mids, soft shoulder, vignette, fine grain.
        vec3 g=gl_FragColor.rgb;float luma=dot(g,vec3(.2126,.7152,.0722));
        g=mix(vec3(luma),g,.88);
        g*=mix(vec3(.94,.97,1.03),vec3(1.03,1.0,.95),smoothstep(.12,.62,luma));
        g=g*(1.0+.06)-.03*smoothstep(.0,.25,luma);
        vec2 vc=vUv-.5;vc.x*=pixel.y/pixel.x;float vig=1.0-smoothstep(.32,.95,length(vc));
        g*=mix(.80,1.0,vig);
        g+=(fract(sin(dot(vUv,vec2(12.9898,78.233)))*43758.5453)-.5)*.012;
        gl_FragColor.rgb=clamp(g,0.0,1.0);
        #include <colorspace_fragment>
      }`});this.material.toneMapped=true;this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material));
  }
  resize(width,height){this.target.setSize(width,height);this.groundTarget.setSize(width,height);this.material.uniforms.pixel.value.set(1/width,1/height);}
  setGroundMarks(canvas){const size=canvas.width+':'+canvas.height;if(this.groundSize!==size){this.groundTexture.dispose();this.groundSize=size;}this.groundTexture.image=canvas;this.groundTexture.needsUpdate=true;}
  depthAt(x,y){
    // Read one encoded pixel only when pointer picking reaches a world sprite.
    if(!this.pickTarget){
      this.pickTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});this.pickScene=new THREE.Scene();
      this.pickMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{depth:{value:this.target.depthTexture},point:{value:new THREE.Vector2()}},vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D depth;uniform vec2 point;void main(){float d=min(texture2D(depth,point).x,.9999999);vec3 v=fract(d*vec3(1.,255.,65025.));v-=v.yzz*vec3(1./255.,1./255.,0.);gl_FragColor=vec4(v,1.);}'});
      this.pickScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.pickMaterial));this.pickBytes=new Uint8Array(4);
    }
    this.pickMaterial.uniforms.point.value.set(x,y);const target=this.renderer.getRenderTarget();
    try{this.renderer.setRenderTarget(this.pickTarget);this.renderer.render(this.pickScene,this.camera);this.renderer.readRenderTargetPixels(this.pickTarget,0,0,1,1,this.pickBytes);}finally{this.renderer.setRenderTarget(target);}
    return this.pickBytes[0]/255+this.pickBytes[1]/65025+this.pickBytes[2]/16581375;
  }
  captureGround(scene,camera,groups){const visible=groups.map(g=>g.visible),shadow=this.renderer.shadowMap.needsUpdate,override=scene.overrideMaterial;try{this.renderer.shadowMap.needsUpdate=false;groups.forEach(g=>g.visible=false);scene.overrideMaterial=this.groundDepthMaterial;this.renderer.setRenderTarget(this.groundTarget);this.renderer.render(scene,camera);}finally{groups.forEach((g,i)=>g.visible=visible[i]);scene.overrideMaterial=override;this.renderer.shadowMap.needsUpdate=shadow;this.renderer.setRenderTarget(null);}}
  present(){this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);}
  render(scene,camera){this.renderer.setRenderTarget(this.target);this.renderer.render(scene,camera);const info={calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles};this.present();return info;}
}
