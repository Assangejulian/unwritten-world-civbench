import * as THREE from './vendor/three/three.module.js';
import {billboardDepthLift} from './facility-art.js';

// Painted world objects share terrain depth; information labels stay on the HUD.
const SIN=.6,COS=.8;
function textureFor(canvas){
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.generateMipmaps=false;texture.minFilter=texture.magFilter=THREE.LinearFilter;return texture;
}
export class WorldSprites{
  constructor(renderer){
    this.renderer=renderer;this.group=new THREE.Group();this.group.name='painted-world';
    this.entries=new Map();this.sources=new WeakMap();this.nextSource=0;renderer.scene.add(this.group);
  }
  begin(kind){this.seen??={};this.seen[kind]=new Set();}
  draw(kind,key,anchor,bounds,paint,{bottom=6,lift=0}={}){
    const r=this.renderer,id=kind+':'+(r.renderOffset||0)+':'+key;this.seen[kind].add(id);
    let e=this.entries.get(id);
    if(!e){
      const canvas=document.createElement('canvas'),geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(18),3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,1,1,0,1,1],2));
      const material=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.08,depthTest:true,depthWrite:true,toneMapped:false,side:THREE.DoubleSide});
      const mesh=new THREE.Mesh(geometry,material);mesh.name='painted-'+key;
      e={canvas,mesh,geometry,kind,key,variants:new Map()};this.entries.set(id,e);this.group.add(mesh);
    }
    const ratio=Math.min(r.dpr||1,1.75),w=Math.max(1,Math.ceil(bounds.width*ratio)),h=Math.max(1,Math.ceil(bounds.height*ratio));
    if(e.canvas.width!==w||e.canvas.height!==h){e.texture?.dispose();e.texture=null;for(const variant of e.variants.values())variant.texture.dispose();e.variants.clear();e.canvas.width=w;e.canvas.height=h;}
    const ctx=e.canvas.getContext('2d',{willReadFrequently:true});ctx.setTransform(ratio,0,0,ratio,-bounds.x*ratio,-bounds.y*ratio);ctx.clearRect(bounds.x,bounds.y,w/ratio,h/ratio);
    const images=[],drawImage=ctx.drawImage;
    ctx.drawImage=(source,...args)=>{if(!this.sources.has(source))this.sources.set(source,++this.nextSource);images.push(this.sources.get(source));return drawImage.call(ctx,source,...args);};
    let appearance;try{appearance=paint(ctx);}finally{ctx.drawImage=drawImage;}
    e.mesh.visible=kind!=='static'||images.length>0;
    if(appearance&&e.mesh.visible){
      if(appearance.source&&!this.sources.has(appearance.source))this.sources.set(appearance.source,++this.nextSource);
      const token=[w,h,ratio,r.zoom,images.join(','),this.sources.get(appearance.source)||0,appearance.key].join(':');
      let variant=e.variants.get(token);
      if(!variant){
        // Scan only a new pose, so transparent capture margins never consume
        // fragment work or GPU texture memory on every subsequent frame.
        const pixels=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=0,bottom=0;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
        if(left>=right){left=top=0;right=bottom=1;}
        const crop={x:Math.max(0,left-1),y:Math.max(0,top-1),width:Math.min(w,right+1)-Math.max(0,left-1),height:Math.min(h,bottom+1)-Math.max(0,top-1)};
        const copy=document.createElement('canvas');copy.width=crop.width;copy.height=crop.height;copy.getContext('2d',{willReadFrequently:true}).drawImage(e.canvas,crop.x,crop.y,crop.width,crop.height,0,0,crop.width,crop.height);
        variant={texture:textureFor(copy),crop};e.variants.set(token,variant);
      }else{e.variants.delete(token);e.variants.set(token,variant);}
      while(e.variants.size>(kind==='static'?1:4)){const oldest=e.variants.keys().next().value;e.variants.get(oldest).texture.dispose();e.variants.delete(oldest);}
      e.mesh.material.map=variant.texture;e.crop=variant.crop;
    }else if(e.mesh.visible){
      e.texture??=textureFor(e.canvas);e.texture.needsUpdate=true;e.mesh.material.map=e.texture;
    }
    const p=r.projectGround(anchor.x,anchor.y),height=r.surfaceHeight(anchor.x,anchor.y),zoom=r.zoom;
    const depth=billboardDepthLift(r,anchor.x,height,anchor.y,Math.min(70,bounds.width/zoom),bottom)+lift;
    const crop=e.crop||{x:0,y:0,width:w,height:h},drawBounds={x:bounds.x+crop.x/ratio,y:bounds.y+crop.y/ratio,width:crop.width/ratio,height:crop.height/ratio};
    const left=(drawBounds.x-p.x)/zoom,right=(drawBounds.x+drawBounds.width-p.x)/zoom;
    const top=(p.y-drawBounds.y)/zoom,low=(p.y-drawBounds.y-drawBounds.height)/zoom,positions=e.geometry.attributes.position;
    const corners=[[left,low],[right,low],[left,top],[left,top],[right,low],[right,top]];
    corners.forEach(([x,rise],i)=>positions.setXYZ(i,anchor.x+(r.renderOffset||0)+x,height+rise*COS+depth*SIN,anchor.y-rise*SIN+depth*COS));
    positions.needsUpdate=true;e.geometry.computeBoundingSphere();e.depth=depth;e.anchor={...anchor};
    e.bounds={...bounds};e.ratio=ratio;e.clipDepth=new THREE.Vector3(anchor.x+(r.renderOffset||0),height+depth*SIN,anchor.y+depth*COS).project(r.camera).z*.5+.5;
    return e;
  }
  end(kind){
    for(const [key,e]of this.entries)if(e.kind===kind&&!this.seen[kind].has(key)){
      this.group.remove(e.mesh);e.geometry.dispose();e.mesh.material.dispose();e.texture?.dispose();for(const variant of e.variants.values())variant.texture.dispose();this.entries.delete(key);
    }
  }
}
