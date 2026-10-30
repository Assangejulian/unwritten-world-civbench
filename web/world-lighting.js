import * as THREE from './vendor/three/three.module.js';
import {isWater} from '/rules.mjs';

// One shared sun direction keeps cached ground shadows aligned with live geometry.
export const WORLD_LIGHTING=Object.freeze({sun:[-420,680,-530],sky:'#d7e0ef',bounce:'#46533c',skyIntensity:1.2,sunColor:'#ffe6ba',sunIntensity:2.5,exposure:1.02});

// Ground triangles keep separate fog/material attributes but share lighting
// normals at coincident vertices, avoiding dark triangulation across gentle hills.
export function smoothGroundNormals(geometry){
  const positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal'),sums=new Map(),keys=[];
  for(let i=0;i<positions.count;i++){
    const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(value=>Math.round(value*100)).join(':');keys.push(key);
    const sum=sums.get(key)||[0,0,0];sum[0]+=normals.getX(i);sum[1]+=normals.getY(i);sum[2]+=normals.getZ(i);sums.set(key,sum);
  }
  for(let i=0;i<positions.count;i++){const n=sums.get(keys[i]),length=Math.hypot(...n)||1;normals.setXYZ(i,n[0]/length,n[1]/length,n[2]/length);}
}

export function bakeWorldLighting(renderer){
  const started=performance.now(),{game}=renderer,tiles=game.map.tiles,R=35,period=Math.sqrt(3)*R*game.map.width;
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const tile of tiles){const p=renderer.position(tile);left=Math.min(left,p.x-R);right=Math.max(right,p.x+R);top=Math.min(top,p.y-R);bottom=Math.max(bottom,p.y+R);}
  if(game.map.wrapX){left=75-period/game.map.width/2;right=left+period;}
  const width=right-left,height=bottom-top,scale=Math.min(.55,2048/width,2048/height),w=Math.max(1,Math.ceil(width*scale)),h=Math.max(1,Math.ceil(height*scale));
  const canvases=Array.from({length:2},()=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;});
  const contexts=canvases.map(canvas=>canvas.getContext('2d',{willReadFrequently:true}));
  const stats={trees:0,mountains:0,structures:0,resources:0,stamps:0,width:w,height:h};
  function stamp(channel,x,z,rx,rz,angle,strength){
    const ctx=contexts[channel];
    for(const offset of game.map.wrapX?[-period,0,period]:[0]){
      const px=(x+offset-left)*scale,pz=(z-top)*scale,apron=Math.max(rx,rz)*scale;
      if(px+apron<0||px-apron>w||pz+apron<0||pz-apron>h)continue;
      ctx.save();ctx.translate(px,pz);ctx.rotate(angle);ctx.scale(Math.max(.5,rx*scale),Math.max(.5,rz*scale));
      const gradient=ctx.createRadialGradient(0,0,0,0,0,1);gradient.addColorStop(0,`rgba(255,255,255,${strength})`);gradient.addColorStop(.35,`rgba(255,255,255,${strength*.72})`);gradient.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();stats.stamps++;
    }
  }
  function caster(x,z,radius,height,ambient=.25,shadow=.26){
    stamp(0,x,z,radius,radius*.85,0,ambient);
    const dx=-WORLD_LIGHTING.sun[0]/WORLD_LIGHTING.sun[1]*height,dz=-WORLD_LIGHTING.sun[2]/WORLD_LIGHTING.sun[1]*height;
    stamp(1,x+dx*.55,z+dz*.55,Math.hypot(dx,dz)*.55+radius*.6,radius*.55,Math.atan2(dz,dx),shadow);
  }
  // Geometry entries already passed the renderer's fog and scenery-clearance tests.
  for(const entries of renderer.lightingCasters?.trees.values()||[])for(const entry of entries){caster(entry.x,entry.z,entry.radius,entry.height,.27,.26);stats.trees++;}
  for(const entries of renderer.lightingCasters?.mountains.values()||[])for(const entry of entries){caster(entry.x,entry.z,entry.radius,entry.height,.31,.34);stats.mountains++;}
  for(const city of renderer.structureCities||[]){const tile=tiles[city.tile];if(!tile||tile.hidden)continue;const p=renderer.position(tile);caster(p.x,p.y,34,25,.38,.23);stats.structures++;}
  for(const tile of tiles){
    if(tile.hidden||isWater(tile)||tile.cityId!=null)continue;const p=renderer.position(tile);
    if(tile.district||tile.fort||tile.improvement&& !['farm','pasture','plantation','fishingboats'].includes(tile.improvement)){caster(p.x,p.y,tile.district?23:12,tile.district?19:11,.26,.20);stats.structures++;}
    else if(tile.resource&&!tile.improvement&&!['wheat','rice','fish','crabs','cattle','horses','sheep','deer','bananas'].includes(tile.resource)){caster(p.x,p.y,12,9,.18,.13);stats.resources++;}
  }
  const a=contexts[0].getImageData(0,0,w,h).data,b=contexts[1].getImageData(0,0,w,h).data,data=new Uint8Array(w*h*4);
  // Study: blue channel = baked macro albedo variation (seamless along wrapX), breaks visible texture tiling at zero per-frame cost.
  const macro=new Float32Array(w*h),TAU=Math.PI*2;let seed=(game.seed?String(game.seed).split('').reduce((s,c)=>s*31+c.charCodeAt(0)|0,7):7);const rnd=()=>((seed=Math.imul(seed^seed>>>15,2246822507)+1013904223|0)>>>0)/4294967296;
  const waves=Array.from({length:14},(_,i)=>{const k=Math.max(1,Math.round(game.map.width/(3+i*0.9)*(0.7+rnd()*.6)/4)),ang=rnd()*TAU;return {fx:k*TAU/width,fz:k*TAU/width*Math.tan((rnd()-.5)*1.2),ph:rnd()*TAU,ph2:rnd()*TAU,amp:1/(1+i*.45)};});
  let lo=Infinity,hi=-Infinity;const S=8,gw=Math.ceil(w/S)+1,gh=Math.ceil(h/S)+1,grid=new Float32Array(gw*gh);
  for(let gy=0;gy<gh;gy++){const z=gy*S/scale;for(let gx=0;gx<gw;gx++){const X=gx*S/scale;let v=0;for(const q of waves)v+=q.amp*Math.sin(X*q.fx+z*q.fz+q.ph)*Math.cos(z*q.fx*.83+q.ph2);grid[gy*gw+gx]=v;if(v<lo)lo=v;if(v>hi)hi=v;}}
  for(let y=0;y<h;y++){const fy=y/S,y0=fy|0,ty=fy-y0;for(let x=0;x<w;x++){const fx=x/S,x0=fx|0,tx=fx-x0,i=y0*gw+x0;macro[y*w+x]=(grid[i]*(1-tx)+grid[i+1]*tx)*(1-ty)+(grid[i+gw]*(1-tx)+grid[i+gw+1]*tx)*ty;}}
  // Round 2: alpha channel = baked relief light (hillshade from smoothed tile elevation + concavity occlusion), 128 = neutral.
  const relief=bakeRelief(renderer,tiles,left,top,width,height,w,h,period);stats.reliefMs=relief.ms;
  for(let i=0,j=0;i<data.length;i+=4,j++){data[i]=a[i+3];data[i+1]=b[i+3];data[i+2]=Math.round(255*(macro[j]-lo)/(hi-lo||1));data[i+3]=relief.values[j];}
  const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);texture.name='cached-world-ground-lighting';texture.flipY=false;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
  return {texture,bounds:new THREE.Vector4(left,top,width,height),stats:{...stats,milliseconds:performance.now()-started,bytes:data.byteLength},dispose:()=>texture.dispose()};
}

export function bindWorldLighting(material,bake,nearShadows=true){
  const uniforms=material.userData.bakedLighting;
  if(uniforms){uniforms.map.value=bake.texture;uniforms.bounds.value.copy(bake.bounds);uniforms.shadow.value=nearShadows?.36:.68;}
  else material.userData.bakedLighting={map:{value:bake.texture},bounds:{value:bake.bounds.clone()},shadow:{value:nearShadows?.36:.68}};
}

// Splat Gaussian elevation per tile onto a coarse grid (no hex-shaped steps), blur, then derive
// sun-facing hillshade and large-scale concavity. Runs once per bake; zero per-frame cost.
export function bakeRelief(renderer,tiles,left,top,width,height,w,h,period){
  const t0=performance.now(),CELL=6,gw=Math.ceil(width/CELL)+1,gh=Math.ceil(height/CELL)+1,sum=new Float32Array(gw*gh),wt=new Float32Array(gw*gh),R=35,wrap=renderer.game.map.wrapX;
  const hash=(x,y)=>{let n=Math.imul(x*374761393+y*668265263|0,1274126177);n^=n>>>13;return ((n>>>0)%1000)/1000;};
  for(const t of tiles){if(t.hidden)continue; // hidden placeholder tiles carry no real terrain (match caster pass)
    const p=renderer.position(t);let e=isWater(t)?-6:renderer.heightAt(t);if(t.terrain==='mountain')e+=34;else if(t.hill)e+=7;
    const sig=t.terrain==='mountain'?R*.62:R*.78,rad=Math.ceil(sig*2.2/CELL);
    for(const off of wrap?[-period,0,period]:[0]){const cx=(p.x+off-left)/CELL,cz=(p.y-top)/CELL;if(cx+rad<0||cx-rad>gw||cz+rad<0||cz-rad>gh)continue;
      for(let gy=Math.max(0,Math.floor(cz-rad));gy<=Math.min(gh-1,Math.ceil(cz+rad));gy++)for(let gx=Math.max(0,Math.floor(cx-rad));gx<=Math.min(gw-1,Math.ceil(cx+rad));gx++){
        const d2=((gx-cx)**2+(gy-cz)**2)*CELL*CELL,k=Math.exp(-d2/(2*sig*sig));const i=gy*gw+gx;sum[i]+=e*k;wt[i]+=k;}}
  }
  let hf=new Float32Array(gw*gh);for(let i=0;i<hf.length;i++){const x=i%gw,y=(i/gw)|0;hf[i]=wt[i]>1e-4?sum[i]/wt[i]:0;hf[i]+=(hash(x,y)-.5)*.0;}
  const blur=(src,r)=>{const tmp=new Float32Array(src.length),out=new Float32Array(src.length);
    for(let y=0;y<gh;y++){let acc=0;for(let x=-r;x<=r;x++)acc+=src[y*gw+Math.min(gw-1,Math.max(0,x))];for(let x=0;x<gw;x++){tmp[y*gw+x]=acc/(2*r+1);acc+=src[y*gw+Math.min(gw-1,x+r+1)]-src[y*gw+Math.max(0,x-r)];}}
    for(let x=0;x<gw;x++){let acc=0;for(let y=-r;y<=r;y++)acc+=tmp[Math.min(gh-1,Math.max(0,y))*gw+x];for(let y=0;y<gh;y++){out[y*gw+x]=acc/(2*r+1);acc+=tmp[Math.min(gh-1,y+r+1)*gw+x]-tmp[Math.max(0,y-r)*gw+x];}}return out;};
  hf=blur(blur(hf,1),1);const broad=blur(blur(hf,6),6);
  const L=WORLD_LIGHTING.sun,ll=Math.hypot(...L),lx=L[0]/ll,ly=L[1]/ll,lz=L[2]/ll,EX=2.2,grid=new Float32Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x,dx=(hf[y*gw+Math.min(gw-1,x+1)]-hf[y*gw+Math.max(0,x-1)])/(2*CELL)*EX,dz=(hf[Math.min(gh-1,y+1)*gw+x]-hf[Math.max(0,y-1)*gw+x])/(2*CELL)*EX;
    const nl=Math.hypot(dx,1,dz),shade=(-dx*lx+ly-dz*lz)/nl-ly,cav=Math.max(-.6,Math.min(1,(broad[i]-hf[i])/9));
    grid[i]=Math.max(-1,Math.min(1,shade*1.25-Math.max(0,cav)*.55+Math.max(0,-cav)*.12));}
  const values=new Uint8Array(w*h),sx=gw/(width),sz=gh/(height);
  for(let y=0;y<h;y++){const fy=Math.min(gh-1.001,y/h*height/CELL),y0=fy|0,ty=fy-y0;for(let x=0;x<w;x++){const fx=Math.min(gw-1.001,x/w*width/CELL),x0=fx|0,tx=fx-x0,i=y0*gw+x0;
    const v=(grid[i]*(1-tx)+grid[i+1]*tx)*(1-ty)+(grid[i+gw]*(1-tx)+grid[i+gw+1]*tx)*ty;values[y*w+x]=Math.max(0,Math.min(255,Math.round(128+v*127)));}}
  return {values,ms:performance.now()-t0};
}
