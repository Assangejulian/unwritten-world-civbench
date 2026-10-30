import {splitPoses} from './painted-actions.js';

// Embarkation is a visual state of the passenger, never a second game unit.
export class PaintedTransportAtlas{
  constructor(){this.ready=false;this.errors=[];this.frames=new Map();}
  async load(onReady=()=>{}){
    try{const image=new Image();image.src='/assets/transports-painted-v2.png';await image.decode();this.sheet=splitPoses(image,16,4,128);this.ready=true;onReady();}catch(error){this.errors.push(error.message);console.error('Transport artwork: '+error.message);}
  }
  draw(c,passenger,kind,index,action){
    if(!this.ready)return false;
    const pose=(kind==='cargo'?8:0)+(action==='move'?4:0)+(index<0?0:Math.floor(index/4)%4);
    if(!this.frames.has(pose)){
      const {canvas:source,bounds:b}=this.sheet.poses[pose],scale=this.sheet.scale,frame=document.createElement('canvas');frame.width=frame.height=128;
      frame.getContext('2d',{willReadFrequently:true}).drawImage(source,64+(b.left-b.anchorX)*scale,112.64+(b.top-b.anchorY)*scale,source.width*scale,source.height*scale);this.frames.set(pose,frame);
    }
    const hull=this.frames.get(pose);c.drawImage(hull,0,0);
    const size=kind==='cargo'?53:43,deck=kind==='cargo'?96:96;
    c.drawImage(passenger,kind==='cargo'?57:61,deck-size*.88,size,size);
    // The front rail occludes the passenger's feet/vehicle tracks on deck.
    c.save();c.beginPath();c.rect(0,deck+1,128,128-deck-1);c.clip();c.drawImage(hull,0,0);c.restore();
    return true;
  }
}
