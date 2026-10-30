// Viewport-loaded authored world scenery; reuse existing depth-tested sprites.
import {uniqueDistrictKey} from './unique-structures.js';
const cache=new WeakMap();
const specs={citystate:{file:'citystate-v1.webp',width:57,anchor:.8},village:{file:'tribal-village-v1.webp',width:42,anchor:.8},aqueduct:{file:'aqueduct-v1.webp',width:51,anchor:.81}};
export function encounterArtKind(renderer,tile){
 if(tile.hidden)return null;
 if(tile.cityState)return 'citystate';
 if(tile.village)return 'village';
 if(tile.district?.item!=='aqueduct')return null;
 const city=renderer.game?.cities.find(c=>c.id===tile.district.city);
 return uniqueDistrictKey(tile,city)?null:'aqueduct';
}
export function drawEncounterArt(renderer,context,tile){
 const kind=encounterArtKind(renderer,tile);if(!kind)return null;
 let images=cache.get(renderer);if(!images){images=new Map();cache.set(renderer,images);}
 let image=images.get(kind);if(!image){
  image=new Image();images.set(kind,image);
  image.onload=()=>{renderer.encounterArtReady??={};renderer.encounterArtReady[kind]=true;renderer.dirty=true;};
  image.onerror=()=>{renderer.encounterArtErrors??=[];renderer.encounterArtErrors.push(kind);};
  image.src='/assets/scenery/'+specs[kind].file;
 }
 if(!image.complete||!image.naturalWidth)return null;
 const p=renderer.screen(tile),spec=specs[kind],width=spec.width*renderer.zoom,height=width*image.naturalHeight/image.naturalWidth;
 context.save();if(tile.visible===false)context.globalAlpha*=.62;if(tile.pillaged)context.filter='grayscale(1) brightness(.55)';
 context.drawImage(image,p.x-width/2,p.y-height*spec.anchor,width,height);context.restore();
 return {source:image,key:kind+':'+(tile.visible===false?'memory':'visible')+':'+!!tile.pillaged};
}

export function drawCityStateLabel(renderer,context,tile){if(!tile.cityState||tile.hidden)return;const s=renderer.game.cityStates?.states.find(s=>s.id===tile.cityState);if(!s)return;const p=renderer.screen(tile);context.save();context.font='11px Georgia,serif';context.textAlign='center';context.lineWidth=3;context.strokeStyle='#152a2be8';context.fillStyle='#f1dfab';context.strokeText('♜ '+s.name,p.x,p.y-44*renderer.zoom);context.fillText('♜ '+s.name,p.x,p.y-44*renderer.zoom);context.restore();}
