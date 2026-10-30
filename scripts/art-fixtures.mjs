import {writeFile} from 'node:fs/promises';
import {createGame,applyAction,addUnit,refreshVisibility,snapshot,serialize} from '../src/engine.mjs';
import {TECHS,CIVICS,dist,isWater} from '../src/rules.mjs';

const g=createGame({players:1,seed:'BUILDER-INTERACTION',barbarians:false}),p=g.players[0];
applyAction(g,p,{type:'found',unit:g.units.find(u=>u.type==='settler').id});
const city=g.cities[0],tile=g.map.tiles.find(t=>t.owner===0&&dist(t,g.map.tiles[city.tile])===1&&!isWater(t)&&t.terrain!=='mountain');
Object.assign(tile,{terrain:'grass',hill:false,feature:'forest',resource:null,improvement:null,district:null,cityId:null});
p.manual=true;p.techs=['mining'];const builder=addUnit(g,0,'builder',tile.id);refreshVisibility(g);
await writeFile(new URL('../output/builder-interaction-fixture.json',import.meta.url),serialize(g));
await writeFile(new URL('../output/builder-interaction-ids.json',import.meta.url),JSON.stringify({tile:tile.id,builder:builder.id}));

// This gallery fixture exercises each atlas cell in the actual map renderer.
const gallery=createGame({players:1,seed:'FACILITY-ART-GALLERY',barbarians:false}),owner=gallery.players[0];
applyAction(gallery,owner,{type:'found',unit:gallery.units.find(u=>u.type==='settler').id});
owner.techs=Object.keys(TECHS);owner.civics=Object.keys(CIVICS);gallery.units=[];gallery.routes=[];
for(const t of gallery.map.tiles)if(t.col>=40&&t.col<=59&&t.row>=22&&t.row<=39)Object.assign(t,{terrain:'grass',hill:false,feature:null,resource:null,improvement:null,district:null,cityId:null,owner:0,river:false,riverEdges:[],camp:false,ruin:false});
const frames=['farm','pasture','camp','plantation','mine','quarry','fishery','well','lumbermill','campus','library','university','lab','holy','shrine','temple','industrial','workshop','factory','powerplant','commercial','bank','harbor','theater'];
const stages={library:'campus',university:'campus',lab:'campus',shrine:'holy',temple:'holy',workshop:'industrial',factory:'industrial',powerplant:'industrial',bank:'commercial'};
const improvements=new Set(frames.slice(0,9)),template=gallery.cities[0];
gallery.cities=[];
const samples=[];
for(let i=0;i<frames.length;i++){
  const frame=frames[i],row=26+Math.floor(i/6)*3,col=44+i%6*2,t=gallery.map.tiles[row*gallery.map.width+col];
  if(improvements.has(frame)){t.improvement=frame;if(frame==='lumbermill'||frame==='camp')t.feature='forest';if(frame==='fishery')t.terrain='coast';}
  else{const item=stages[frame]||frame,id=1000+i,home=gallery.map.tiles[(gallery.map.height-3)*gallery.map.width+2+i*3];home.cityId=id;home.owner=0;home.terrain='grass';const c={...template,id,tile:home.id,name:'Art '+frame,isCapital:i===9,buildings:[item,...(frame!==item?[frame]:[])],districts:[{item,tile:t.id}]};gallery.cities.push(c);t.district={item,city:id,kind:'district'};if(frame==='harbor')t.terrain='coast';}
  samples.push({frame,tile:t.id});
}
refreshVisibility(gallery);
await writeFile(new URL('../output/facility-gallery-fixture.json',import.meta.url),JSON.stringify({state:snapshot(gallery,-1),samples,center:gallery.map.tiles[30*gallery.map.width+49].id}));
console.log('Prepared isolated builder and 24-cell renderer fixtures.');
