// Test-only geography. Production placement never transforms terrain.
import * as E from '../src/engine.mjs';
import * as N from '../src/natural-wonders.mjs';
import * as C from '../src/climate.mjs';
import {NATURAL_WONDERS} from '../src/rules.mjs';
import {neighbors,indexMap} from '../src/world.mjs';
import {field} from './imperial-fixture.mjs';

export function prepareSite(g,key,t){
  const spec=NATURAL_WONDERS[key],p=spec.placement||{},ns=neighbors(g.map,t);
  Object.assign(t,{terrain:spec.terrains[0],hill:!!p.hill,river:!!p.river,feature:null,resource:null,cityId:null,owner:null,district:null,improvement:null});
  for(const n of ns)Object.assign(n,{terrain:'grass',hill:false,feature:null,resource:null,river:false});
  if(p.minRock)for(const n of ns.slice(0,p.minRock))n.hill=true;
  if(p.connectedRiver)ns[0].river=true;
  if(p.nearRiver||p.nearValley)t.river=true;
  if(p.nearWoodOrHill)ns[0].feature='forest';
  if(p.nearCold)ns[0].terrain='tundra';
  if(p.nearDesert)ns[0].terrain='desert';
  if(t.terrain==='coast')for(const n of ns.slice(3))n.terrain='coast';
  if(p.minWater)for(const n of ns.slice(-p.minWater))n.terrain='coast';
  if(p.coastWithin)ns[5].terrain='coast';
  if(t.river)t.riverEdges=[0,3];
  return t;
}

export function naturalWorld(){
  const f=field(),{g,p}=f,width=88,height=70;
  g.units=[];g.cities=[];g.routes=[];g.wonders={};g.settings.naturalWondersEnabled=true;g.settings.autosaveEnabled=false;g.settings.playMode='turns';
  g.map=indexMap({width,height,wrapX:false,roadRules:1,starts:[3*width+3,3*width+82,65*width+82],tiles:Array.from({length:width*height},(_,id)=>({id,col:id%width,row:Math.floor(id/width),q:id%width-Math.floor(Math.floor(id/width)/2),r:Math.floor(id/width),terrain:'grass',hill:false,feature:null,resource:null,owner:null,cityId:null,district:null,improvement:null,river:false,riverEdges:[],camp:false,ruin:false,village:false}))});
  const tile=(x,y)=>g.map.tiles[y*width+x];
  for(const player of g.players){player.explored=[];player.visible=[];player.knownTiles={};player.knownCities={};player.cityAppearances={};player.capital=null;player.citySequence=0;E.foundCity(g,player,E.addUnit(g,player.id,'settler',g.map.starts[player.id]));}
  g.units=[];delete g.naturalWonders;delete g.climate;N.initializeNaturalWonders(g);
  const cells={};let i=0;
  for(const key of Object.keys(NATURAL_WONDERS)){const t=tile(9+(i%6)*12,10+Math.floor(i/6)*10);prepareSite(g,key,t);N.placeNaturalWonder(g,key,t.id);cells[key]=t;i++;}
  C.initializeClimate(g);p.explored=g.map.tiles.map(t=>t.id);E.refreshVisibility(g);
  return {...f,g,p,tile,cells,home:g.cities.find(c=>c.owner===0)};
}
