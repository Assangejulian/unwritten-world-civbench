import {NATURAL_WONDERS} from '/rules.mjs';
const images=new WeakMap();
export function drawNaturalWonder(renderer,context,tile,point=renderer.screen(tile),zoom=renderer.zoom){
  const key=tile.naturalWonder;
  if(tile.hidden||!NATURAL_WONDERS[key])return null;
  let collection=images.get(renderer);if(!collection){collection=new Map();images.set(renderer,collection);}
  let image=collection.get(key);
  if(!image){
    image=new Image();image.decoding='async';collection.set(key,image);
    image.onload=()=>{renderer.naturalArtRevision=(renderer.naturalArtRevision||0)+1;renderer.dirty=true;};
    image.onerror=()=>{renderer.naturalArtErrors??=[];renderer.naturalArtErrors.push(key);};
    image.src='/assets/natural-wonders/'+key+'.webp';
  }
  context.save();
  if(tile.visible===false)context.globalAlpha*=.62;
  if(image.complete&&image.naturalWidth){
    const width=(NATURAL_WONDERS[key].workable?58:68)*zoom,height=width*image.naturalHeight/image.naturalWidth;
    context.drawImage(image,point.x-width/2,point.y-height*.82,width,height);
  }else{
    context.strokeStyle='#d4b46d';context.lineWidth=1.2;context.beginPath();context.moveTo(point.x,point.y-10*zoom);context.lineTo(point.x+7*zoom,point.y);context.lineTo(point.x,point.y+5*zoom);context.lineTo(point.x-7*zoom,point.y);context.closePath();context.stroke();
  }
  context.restore();
  return {source:image.complete&&image.naturalWidth?image:null,key:key+':'+(tile.visible===false?'remembered':'visible')+':'+!!image.naturalWidth};
}
