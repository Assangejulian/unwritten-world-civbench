// Public class identity selects shared map art; no private gameplay state is needed.
export const GREAT_PERSON_ART_CLASSES=['general','admiral','engineer','scientist','merchant','prophet','writer','artist','musician'];
export const GREAT_PERSON_CLASS_NAMES={general:'大将军',admiral:'海军统帅',engineer:'大工程师',scientist:'大科学家',merchant:'大商人',prophet:'大预言家',writer:'大作家',artist:'大艺术家',musician:'大音乐家'};
const images=new Map();
const movementFrames=new Map();
export function greatPersonArtClass(unit){
 if(!['great_person','great_admiral'].includes(unit?.type))return null;
 return GREAT_PERSON_ART_CLASSES.includes(unit.greatPersonClass)?unit.greatPersonClass:unit.type==='great_admiral'?'admiral':'prophet';
}
function artImage(unit,onReady,movement=false){
 const cls=greatPersonArtClass(unit);if(!cls)return null;const key=cls+(movement?'-move':'');
 let entry=images.get(key);
 if(!entry){
  const image=new Image();entry={image,listeners:new Set(),ready:false};images.set(key,entry);
  image.onload=()=>{entry.ready=true;for(const fn of entry.listeners)fn();entry.listeners.clear();};
  image.onerror=()=>{entry.listeners.clear();console.error('Great Person artwork failed: '+key);};
  image.src='/assets/great-people/'+key+'.webp';
 }
 if(!entry.ready&&onReady)entry.listeners.add(onReady);
 return entry;
}
export function greatPersonSource(unit,onReady){const entry=artImage(unit,onReady);return entry?.ready?entry.image:null;}
export async function ensureGreatPersonMoveArt(unit){const entry=artImage(unit,null,true);if(entry){await entry.image.decode();entry.ready=true;}}
export function greatPersonMoveSource(unit,index,slots=16,onReady){
 const entry=artImage(unit,onReady,true);if(!entry?.ready)return null;
 const pose=Math.floor((((index%slots)+slots)%slots)/slots*4),cls=greatPersonArtClass(unit),key=cls+':'+pose;
 if(!movementFrames.has(key)){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const image=entry.image,w=image.naturalWidth/4;canvas.getContext('2d').drawImage(image,pose*w,0,w,image.naturalHeight,0,0,128,128);movementFrames.set(key,canvas);}
 return {canvas:movementFrames.get(key),pose};
}
