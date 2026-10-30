import * as THREE from './vendor/three/three.module.js';
import {GLTFLoader} from './vendor/three/addons/loaders/GLTFLoader.js';

const ASSETS={
  wall:['fantasy-town-source','wall-window-stone'],wood:['fantasy-town-source','wall-wood-window-shutters'],door:['fantasy-town-source','wall-door'],
  roof:['fantasy-town-source','roof-gable'],highRoof:['fantasy-town-source','roof-high-gable'],pointRoof:['fantasy-town-source','roof-point'],
  fountain:['fantasy-town-source','fountain-round-detail'],chimney:['fantasy-town-source','chimney'],cart:['fantasy-town-source','cart'],
  tower:['castle-kit-source','tower-square-roof'],keep:['castle-kit-source','tower-square-top-roof-high-windows'],castleWall:['castle-kit-source','wall'],
  rampart:['castle-kit-source','wall-narrow'],tree:['castle-kit-source','tree-large']
};
export class ModelLibrary{
  constructor(){this.models=new Map();this.pending=new Map();this.errors=[];}
  async load(){
    const loader=new GLTFLoader();
    await Promise.all(Object.entries(ASSETS).map(async([name,[folder,file]])=>{
      try{const gltf=await loader.loadAsync(`/assets/${folder}/Models/GLB%20format/${file}.glb`),root=gltf.scene;root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),parts=[];
        root.traverse(mesh=>{if(!mesh.isMesh)return;const geometry=mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);parts.push({geometry,material:mesh.material});});this.models.set(name,{parts,size});
      }catch(error){this.errors.push(name+': '+error.message);console.error('Model loading failed',name,error);}
    }));
  }
  begin(){this.pending.clear();}
  place(name,x,y,z,width,height,depth,angle=0){
    const model=this.models.get(name);if(!model)return;const object=new THREE.Object3D();object.position.set(x,y,z);object.rotation.y=angle;object.scale.set(width/model.size.x,height/model.size.y,depth/model.size.z);object.updateMatrix();
    for(const part of model.parts){const key=part.geometry.uuid+':'+Math.floor(x/480)+':'+Math.floor(z/360)+':'+(this.detail||0);if(!this.pending.has(key))this.pending.set(key,{part,detail:this.detail||0,matrices:[]});this.pending.get(key).matrices.push(object.matrix.clone());}
  }
  finish(group){
    for(const {part,matrices,detail}of this.pending.values()){const material=part.material.clone();material.roughness=.86;material.metalness=0;const mesh=new THREE.InstancedMesh(part.geometry.clone(),material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.name='city-model';mesh.userData.minZoom=detail;group.add(mesh);}
    this.instanceCount=[...this.pending.values()].reduce((n,b)=>n+b.matrices.length,0);
  }
  house(x,y,z,size=1,angle=0,timber=false,detail=0){
    const previous=this.detail;this.detail=detail;
    const width=7*size,height=7*size,depth=7*size;
    for(let i=0;i<4;i++){const a=angle+i*Math.PI/2;this.place(i===0?'door':timber?'wood':'wall',x+Math.cos(a)*width*.48,y,z+Math.sin(a)*depth*.48,.8*size,height,depth,-a);}
    this.place(timber?'highRoof':'roof',x,y+height,z,width*1.12,(timber?6:4)*size,depth*1.12,angle+Math.PI/2);
    if(timber)this.place('chimney',x+width*.2,y+height+2*size,z-depth*.2,1.2*size,5*size,1.2*size);
    this.detail=previous;
  }
}
