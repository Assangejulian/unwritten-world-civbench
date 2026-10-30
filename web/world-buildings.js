import {WONDER_STRUCTURE_ART,uniqueDistrictKey} from './unique-structures.js';
import * as THREE from './vendor/three/three.module.js';
import {TECHS,DIRECTIONS,dist,isWater,civilizationEra,cityEraStyle} from '/rules.mjs';
import {facilityFrame,facilityMeshes,MODERNIZATION_FRAMES,ensureModernization} from './facility-art.js';
import {sceneryClearance} from './world-clearance.js';
import {addSpatialMeshes} from './spatial-meshes.js';
import {wallRearMeshes,cityCorePlacement,missileSiloArtReady} from './siege-art.js';
const random=n=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};

export function populateStructures(renderer){
  const {game,structureGroup:group,models}=renderer;models.begin();
  ensureModernization(renderer);
  const shapes=new Map(),roads=[],roadColors=[],facilities=[],modernFacilities=[],clearance=sceneryClearance(renderer);
  const period=game.map.wrapX?35*Math.sqrt(3)*game.map.width:0,left=75-35*Math.sqrt(3)/2;
  const add=(kind,x,y,z,sx,sy,sz,color,angle=0)=>{const key=kind+':'+Math.floor(x/480)+':'+Math.floor(z/360);if(!shapes.has(key))shapes.set(key,[]);shapes.get(key).push({x,y,z,sx,sy,sz,color,angle});};
  const road=(a,b,width=2,color='#a89670')=>{
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1,nx=-dz/length*width/2,nz=dx/length*width/2,c=new THREE.Color(color),steps=Math.ceil(length/2.5);
    for(let i=0;i<steps;i++){
      const f=i/steps,g=(i+1)/steps,z=a.z+dz*f,zz=a.z+dz*g;let x=a.x+dx*f,xx=a.x+dx*g;if(period){const shift=Math.floor(((x+xx)/2-left)/period)*period;x-=shift;xx-=shift;}
      if(!clearance.roadAllowed((x+xx)/2,(z+zz)/2))continue;
      for(const [px,pz]of [[x+nx,z+nz],[x-nx,z-nz],[xx+nx,zz+nz],[xx+nx,zz+nz],[x-nx,z-nz],[xx-nx,zz-nz]]){roads.push(px,renderer.surfaceHeight(px,pz)+.38,pz);roadColors.push(c.r,c.g,c.b);}
    }
  };
  const connect=(start,end)=>{
    const queue=[start],previous=new Map([[start,null]]);let head=0;
    while(head<queue.length&&head<700){const id=queue[head++];if(id===end)break;const tile=game.map.tiles[id];if(tile.roadPillaged)continue;const near=DIRECTIONS.map(([q,r])=>renderer.index.get(`${tile.q+q},${tile.r+r}`)).filter(t=>t&&!t.hidden&&!t.roadPillaged&&!isWater(t)&&t.terrain!=='mountain'&&!previous.has(t.id));near.sort((a,b)=>dist(a,game.map.tiles[end],game.map)-dist(b,game.map.tiles[end],game.map));for(const t of near){previous.set(t.id,id);queue.push(t.id);}}
    if(!previous.has(end))return;const path=[];let id=end;while(id!==null){const t=game.map.tiles[id],p=renderer.position(t);if(period&&path.length)p.x+=Math.round((path.at(-1).x-p.x)/period)*period;path.push({x:p.x,y:renderer.heightAt(t)+.65,z:p.y});id=previous.get(id);}const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(p.x,p.y,p.z)),false,'centripetal');const points=curve.getPoints(Math.max(4,path.length*4));for(let i=1;i<points.length;i++)road({x:points[i-1].x,y:points[i-1].y,z:points[i-1].z},{x:points[i].x,y:points[i].y,z:points[i].z},2.1);
  };
  for(const t of game.map.tiles)if(!t.hidden&&t.road&&!t.roadPillaged)for(const [dq,dr]of DIRECTIONS){const n=renderer.index.get(`${t.q+dq},${t.r+dr}`);if(n&&n.id>t.id&&n.road&&!n.roadPillaged&&!n.hidden){const a=renderer.position(t),b=renderer.position(n);if(period)b.x+=Math.round((a.x-b.x)/period)*period;road({x:a.x,y:renderer.heightAt(t),z:a.y},{x:b.x,y:renderer.heightAt(n),z:b.y},2.8);}}
  const cathedral=(x,y,z,color)=>{
    models.house(x,y,z,1.65,0);models.place('tower',x-9,y,z+2,7,28,7);models.place('tower',x+9,y,z+2,7,28,7);models.place('keep',x,y+10,z-5,9,17,9);add('cylinder',x,y+21,z-5,5,4,5,'#d2b270');add('dome',x,y+23,z-5,5,5,5,'#cfb867');
    add('box',x,y+30,z-5,.6,5,.6,color);add('box',x,y+31,z-5,3,.5,.5,color);
  };
  const classical=(x,y,z,color)=>{
    add('cylinder',x,y+1,z,16,2,16,'#cfc7b0');add('cylinder',x,y+2,z,13,2,13,'#e5dcc4');
    for(let i=0;i<12;i++){const a=i*Math.PI/6;add('column',x+Math.cos(a)*10,y+8,z+Math.sin(a)*10,1,13,1,'#e8e0cf');}add('cylinder',x,y+15,z,12,2,12,'#d1c5aa');add('dome',x,y+16,z,11,8,11,color);
  };
  for(const city of renderer.structureCities||game.cities){const tile=game.map.tiles[city.tile];if(tile.hidden)continue;const p=renderer.position(tile),y=renderer.heightAt(tile),owner=game.players[city.owner],era=city.visualEra??civilizationEra(owner);
    if(renderer.modernizationReady){modernFacilities.push({frame:'city-'+cityEraStyle(era),x:p.x,y:y+.35,z:p.y,remembered:!!city.remembered,...cityCorePlacement(city)});continue;}
    add('cylinder',p.x,y+.2,p.y,19,.4,19,'#c3b896');
    for(let j=0;j<Math.min(22,city.population*2+5);j++){const angle=j*2.399,ring=11+Math.floor(j/7)*7,x=p.x+Math.cos(angle)*ring,z=p.y+Math.sin(angle)*ring,size=.58+random(city.id*17+j)*.32;models.house(x,y+.4,z,size,angle,j%3===0,j<3?0:j<7?.3:.65);if(j<7)road({x:p.x,y:y+.65,z:p.y},{x,y:y+.65,z},1.5,'#beb298');}
    if(era>=4){for(let j=0;j<4;j++)add('box',p.x+(j%2-.5)*12,y+9+j*2,p.y+(Math.floor(j/2)-.5)*12,9,18+j*4,9,'#a6b4af');}
    else if(era<2){models.place('tower',p.x,y,p.y,11,23,11);models.place('keep',p.x,y+15,p.y,10,13,10);}
    else if(owner.id===6)cathedral(p.x,y,p.y,owner.color);
    else if(owner.id===4||owner.id===3)classical(p.x,y,p.y,owner.color);
    else if(owner.id===2){models.house(p.x,y,p.y,1.8,0,true);models.place('tower',p.x+8,y,p.y-6,6,22,6);add('box',p.x+8,y+20,p.y-10,14,1.2,1.2,'#eee0b4',.5);add('box',p.x+8,y+20,p.y-10,1.2,14,1.2,'#eee0b4',.5);}
    else {models.house(p.x,y,p.y,1.9,0);models.place('keep',p.x+6,y,p.y-7,8,20,8);add('dome',p.x+6,y+20,p.y-7,5,4,5,owner.color);}
    models.place('fountain',p.x-10,y+.5,p.y+10,6,2.5,6);
    // Generated tier-specific wall rings are cached by the map overlay.
  }
  for(const tile of game.map.tiles){if(tile.hidden||tile.cityId)continue;const p=renderer.position(tile),y=renderer.heightAt(tile),x=p.x,z=p.y;
    const city=game.cities.find(c=>c.id===tile.district?.city),frame=facilityFrame(tile,city);
    if(uniqueDistrictKey(tile,city)){
      const atlasReady=frame&&(MODERNIZATION_FRAMES.includes(frame)?renderer.modernizationReady:renderer.facilityReady);
      if(city&&!isWater(tile)&&(!game.map.roadRules||!atlasReady))connect(city.tile,tile.id);
      continue;
    }
    if(frame&&MODERNIZATION_FRAMES.includes(frame)&&renderer.modernizationReady){modernFacilities.push({frame,x,y:y+.35,z});if(!game.map.roadRules&&city&&!isWater(tile))connect(city.tile,tile.id);continue;}
    if(frame&&renderer.facilityReady&&!MODERNIZATION_FRAMES.includes(frame)){facilities.push({frame,x,y:y+.35,z});if(!game.map.roadRules&&city&&!isWater(tile))connect(city.tile,tile.id);continue;}
    if(['barracks','airport','aqueduct'].includes(tile.district?.item))continue;
    if(tile.district?.kind==='wonder'&&WONDER_STRUCTURE_ART[tile.district.item]&&tile.visible!==false)continue;
    if(tile.district){const item=tile.district.item,city=game.cities.find(c=>c.id===tile.district.city),color=game.players[tile.owner]?.color||'#8baaaa';
      if(city&&!isWater(tile))connect(city.tile,tile.id);
      if(item==='holy'||item==='oracle')cathedral(x,y,z,color);
      else if(['campus','greatlibrary','oxford','observatory'].includes(item)){models.house(x-9,y,z,1.6,0);models.house(x+11,y,z+5,1.1,Math.PI/2);models.place('keep',x+7,y,z-10,8,22,8);add('dome',x+7,y+22,z-10,6,5,6,'#879d9c');models.place('fountain',x-2,y,z+11,7,2.5,7);}
      else if(['theater','entertainment','colosseum'].includes(item)){add('cylinder',x,y+3,z,20,6,20,'#c2b599');add('cylinder',x,y+6,z,17,3,17,'#e3d3aa');add('cylinder',x,y+7.7,z,12,.5,12,'#9c967d');for(let i=0;i<18;i++){const a=i*Math.PI/9;add('column',x+Math.cos(a)*17,y+8,z+Math.sin(a)*17,.8,8,.8,'#f0dec0');}models.house(x+18,y,z+8,.8,0);}
      else if(item==='commercial'){for(let j=0;j<6;j++){const a=j*Math.PI/3;models.house(x+Math.cos(a)*13,y,z+Math.sin(a)*13,.8,-a,true);add('box',x+Math.cos(a)*9,y+5,z+Math.sin(a)*9,6,1,4,color,a);}models.place('cart',x,y,z,5,3.5,5);}
      else if(item==='industrial'){models.house(x,y,z,1.8,0);for(let j=0;j<3;j++){models.place('chimney',x-10+j*8,y+5,z-8,3,21+j*4,3);add('cylinder',x-12+j*10,y+6,z+12,3.5,12,3.5,'#8c9385');}add('box',x+12,y+5,z,12,10,9,'#af9f89');}
      else if(item==='harbor'){add('box',x,y+1,z,35,2,5,'#9c8865');add('box',x-8,y+1,z+10,5,2,22,'#9c8865');models.house(x+10,y,z-8,1.2,0);models.place('tower',x-14,y,z-8,6,22,6);}
      else if(item==='missilesilo'){if(!missileSiloArtReady()){add('cylinder',x,y+1,z,15,2,15,'#657778');add('cylinder',x,y+2,z,8,1,8,'#353f43');add('box',x+12,y+4,z+6,7,8,9,'#84927f');}}
      else if(item==='spaceport'){add('cylinder',x,y+.5,z,21,1,21,'#888f86');add('cylinder',x,y+16,z,3,32,3,'#e6e1d1');add('cone',x,y+35,z,3,7,3,'#d3b995');add('box',x+8,y+14,z,3,28,3,'#7b8c84');models.house(x-13,y,z+11,1,0);}
      else if(item==='pyramids'){for(let i=0;i<7;i++){const w=30-i*3.7;add('box',x,y+i*3+1.5,z,w,3,w,'#cfb67e');}}
      else if(item==='eiffel'){add('cone',x,y+24,z,14,48,14,'#948e76');add('box',x,y+9,z,23,2,23,'#b4a88a');}
      else {classical(x,y,z,color);models.house(x-17,y,z+9,.65,0);}
    }
    if(['farm','plantation'].includes(tile.improvement)){for(let row=0;row<10;row++){const xx=x-21+row*4.6;add('box',xx,y+.3,z,2.8,.6,34,row%3?'#9baf4a':'#d1bb66');for(let j=0;j<9;j++)add('cone',xx,y+1.5,z-16+j*4,.5,2,.5,row%2?'#d6c873':'#819a37');}models.house(x-16,y,z-13,.5,0,true);}
    if(['mine','quarry','well'].includes(tile.improvement)){models.house(x-8,y,z,1,0,true);models.place('cart',x+8,y,z+5,5,3,5);add('box',x+5,y+10,z-5,1.7,20,1.7,'#7d725d');add('box',x+10,y+16,z-5,14,1.5,1.5,'#887252');}
    if(tile.camp){models.house(x,y,z,.8,0,true);models.place('cart',x+9,y,z+8,5,3,5);}
  }
  for(const route of game.routes){const a=game.cities.find(c=>c.id===route.from),b=game.cities.find(c=>c.id===route.to);if(!game.map.roadRules&&a&&b)connect(a.tile,b.tile);}
  models.finish(group);wallRearMeshes(renderer);
  const geometries={box:()=>new THREE.BoxGeometry(1,1,1),cylinder:()=>new THREE.CylinderGeometry(1,1,1,24),column:()=>new THREE.CylinderGeometry(.85,1,1,8),dome:()=>new THREE.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),cone:()=>new THREE.ConeGeometry(1,1,12)};
  const object=new THREE.Object3D(),color=new THREE.Color();
  for(const [kind,entries]of shapes){const mesh=new THREE.InstancedMesh(geometries[kind.split(':')[0]](),new THREE.MeshStandardMaterial({roughness:.86,color:'#ffffff'}),entries.length);entries.forEach((e,i)=>{object.position.set(e.x,e.y,e.z);object.scale.set(e.sx,e.sy,e.sz);object.rotation.set(0,e.angle,0);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);mesh.setColorAt(i,color.set(e.color));});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);}
  if(roads.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(roads,3));g.setAttribute('color',new THREE.Float32BufferAttribute(roadColors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));mesh.name='terrain-roads';mesh.receiveShadow=true;addSpatialMeshes(group,mesh);}
  renderer.roadSegments=roads.length/18;
  if(renderer.facilityReady)facilityMeshes(renderer,facilities);
  if(renderer.modernizationReady)facilityMeshes(renderer,modernFacilities,true);
}
