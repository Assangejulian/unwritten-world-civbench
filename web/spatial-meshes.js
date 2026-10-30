import * as THREE from './vendor/three/three.module.js';

export function addSpatialMeshes(group,source){for(const mesh of spatialMeshes(source))group.add(mesh);}

// Keep complete primitives together. Attribute values and precomputed normals
// stay unchanged at chunk seams; each chunk has its own frustum bounds.
export function spatialMeshes(source,width=480,depth=360){
  const geometry=source.geometry,index=geometry.index,position=geometry.getAttribute('position'),stride=source.isLineSegments?2:3;
  const buckets=new Map(),count=index?index.count:position.count;
  for(let offset=0;offset<count;offset+=stride){
    let x=0,z=0;const vertices=[];
    for(let i=0;i<stride;i++){const vertex=index?index.getX(offset+i):offset+i;vertices.push(vertex);x+=position.getX(vertex);z+=position.getZ(vertex);}
    const key=Math.floor(x/stride/width)+':'+Math.floor(z/stride/depth);
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(...vertices);
  }
  const meshes=[];
  for(const [key,vertices]of buckets){
    const chunk=new THREE.BufferGeometry();
    for(const [name,attribute]of Object.entries(geometry.attributes)){
      const values=new attribute.array.constructor(vertices.length*attribute.itemSize);
      for(let i=0;i<vertices.length;i++)for(let j=0;j<attribute.itemSize;j++)values[i*attribute.itemSize+j]=attribute.array[vertices[i]*attribute.itemSize+j];
      chunk.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
    }
    chunk.computeBoundingBox();chunk.computeBoundingSphere();
    const mesh=source.isLineSegments?new THREE.LineSegments(chunk,source.material):new THREE.Mesh(chunk,source.material);
    mesh.name=source.name;mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;
    mesh.userData={...source.userData,spatialChunk:key};meshes.push(mesh);
  }
  geometry.dispose();return meshes;
}
