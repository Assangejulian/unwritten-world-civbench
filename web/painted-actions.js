import {UNIT_ETCHINGS,UNIT_ANIMATION_HINTS} from './unit-etchings.js';
// Real ImageGen pose sheets. Original portrait atlases remain available as fallbacks.
export const PAINTED_UNITS={
  knight:{file:'knight-painted-v2.png',baseSign:1,size:64},
  archer:{file:'archer-painted-v3.png',baseSign:1,size:54,muzzle:[.84,.52],normalize:'height'},
  tank:{file:'tank-painted-v2.png',baseSign:1,size:66,muzzle:[.91,.57]},
  battleship:{file:'battleship-painted-v2.png',baseSign:1,size:72,muzzle:[.83,.73]}
};
const people=['settler','builder','scout','warrior','spearman','swordsman','crossbow','musket','missionary','rifleman','slinger','pikeman','manatarms','envoy'];
const riders=['horseman','courser','cuirassier','cavalry'];
const equipment=['catapult','cannon','bombard','artillery'];
for(const type of people)PAINTED_UNITS[type]={file:type+'-painted-v3.png',baseSign:1,size:54,normalize:['settler','builder','missionary'].includes(type)?null:'height',muzzle:['crossbow','musket','rifleman','slinger'].includes(type)?[.85,.47]:null};
for(const type of riders)PAINTED_UNITS[type]={file:type+'-painted-v3.png',baseSign:1,size:66};
for(const type of equipment)PAINTED_UNITS[type]={file:type+'-painted-v3.png',baseSign:1,size:66,muzzle:[.84,.48]};
for(const type of ['galley','frigate','destroyer'])PAINTED_UNITS[type]={file:type+'-painted-v3.png',baseSign:1,size:72,muzzle:type==='galley'?null:[.82,.60]};
PAINTED_UNITS.roman_legion={file:'leader-rework/roman_legion-living.png',deathFile:'leader-rework/roman_legion-death.png',baseSign:1,size:54,normalize:'height',lazy:true,deathDuration:2.4};
PAINTED_UNITS.qin_crossbow={file:'leader-rework/qin_crossbow-living.png',deathFile:'leader-rework/qin_crossbow-death.png',baseSign:1,size:54,normalize:'height',muzzle:[.85,.47],lazy:true,deathDuration:2.4};
PAINTED_UNITS.han_cavalry={file:'leader-rework/han_cavalry-living.png',deathFile:'leader-rework/han_cavalry-death.png',baseSign:1,size:66,lazy:true,deathDuration:2.4};
PAINTED_UNITS.xuanjia_knight={file:'leader-rework/xuanjia_knight-living.png',deathFile:'leader-rework/xuanjia_knight-death.png',baseSign:1,size:66,lazy:true,deathDuration:2.4};
PAINTED_UNITS.wuju_guard={file:'leader-rework/wuju_guard-living-v2.png',deathFile:'leader-rework/wuju_guard-death.png',baseSign:1,size:54,normalize:'height',lazy:true,deathDuration:2.4};
PAINTED_UNITS.hwacha={file:'leader-rework/hwacha-living.png',deathFile:'leader-rework/hwacha-death.png',baseSign:1,size:72,lazy:true,deathDuration:2.4,muzzle:[.85,.35]};
PAINTED_UNITS.hatamoto_samurai={file:'leader-rework/hatamoto_samurai-living.png',deathFile:'leader-rework/hatamoto_samurai-death.png',baseSign:1,size:62,normalize:'height',lazy:true,deathDuration:2.4};
PAINTED_UNITS.hetairoi={file:'leader-rework/hetairoi-living.png',deathFile:'leader-rework/hetairoi-death-v2.png',baseSign:1,size:66,lazy:true,deathDuration:2.4};
PAINTED_UNITS.praetorian_guard={file:'leader-rework/praetorian_guard-living.png',deathFile:'leader-rework/praetorian_guard-death.png',baseSign:1,size:54,normalize:'height',lazy:true,deathDuration:2.4};
PAINTED_UNITS.athenian_trireme={file:'leader-rework/athenian_trireme-living-v4.png',deathFile:'leader-rework/athenian_trireme-death.png',baseSign:1,size:76,lazy:true,deathDuration:2.4};
PAINTED_UNITS.persian_immortal={file:'leader-rework/persian_immortal-living.png',deathFile:'leader-rework/persian_immortal-death.png',baseSign:1,size:54,normalize:'height',lazy:true,deathDuration:2.4,muzzle:[.85,.47]};
PAINTED_UNITS.scythed_chariot={file:'leader-rework/scythed_chariot-living.png',deathFile:'leader-rework/scythed_chariot-death.png',baseSign:1,size:72,lazy:true,deathDuration:2.4};
PAINTED_UNITS.ptolemaic_flagship={file:'leader-rework/ptolemaic_flagship-living.png',deathFile:'leader-rework/ptolemaic_flagship-death.png',baseSign:1,size:76,lazy:true,deathDuration:2.4};
PAINTED_UNITS.punt_expedition_ship={file:'leader-rework/punt_expedition_ship-living.png',deathFile:'leader-rework/punt_expedition_ship-death.png',baseSign:1,size:76,lazy:true,deathDuration:2.4};
PAINTED_UNITS.maryannu_chariot={file:'leader-rework/maryannu_chariot-living.png',deathFile:'leader-rework/maryannu_chariot-death.png',baseSign:1,size:72,lazy:true,deathDuration:2.4,muzzle:[.85,.47]};
PAINTED_UNITS.dharma_elephant={file:'leader-rework/dharma_elephant-living.png',deathFile:'leader-rework/dharma_elephant-death.png',baseSign:1,size:72,lazy:true,deathDuration:2.4};
PAINTED_UNITS.maurya_war_elephant={file:'leader-rework/maurya_war_elephant-living.png',deathFile:'leader-rework/maurya_war_elephant-death.png',baseSign:1,size:76,lazy:true,deathDuration:2.4};
PAINTED_UNITS.mamluk_knight={file:'leader-rework/mamluk_knight-living.png',deathFile:'leader-rework/mamluk_knight-death.png',baseSign:1,size:66,lazy:true,deathDuration:2.4};
PAINTED_UNITS.janissary={file:'leader-rework/janissary-living.png',deathFile:'leader-rework/janissary-death.png',baseSign:1,size:60,normalize:'height',lazy:true,deathDuration:2.4,muzzle:[.85,.47]};
PAINTED_UNITS.keshig={file:'leader-rework/keshig-living.png',deathFile:'leader-rework/keshig-death.png',baseSign:1,size:66,lazy:true,deathDuration:2.4,muzzle:[.85,.47]};
PAINTED_UNITS.mandekalu_cavalry={file:'leader-rework/mandekalu_cavalry-living.png',deathFile:'leader-rework/mandekalu_cavalry-death.png',baseSign:1,size:66,lazy:true,deathDuration:2.4};
PAINTED_UNITS.zulu_impi={file:'leader-rework/zulu_impi-living.png',deathFile:'leader-rework/zulu_impi-death.png',baseSign:1,size:58,normalize:'height',lazy:true,deathDuration:2.4};
PAINTED_UNITS.sea_dog={file:'leader-rework/sea_dog-living.png',deathFile:'leader-rework/sea_dog-death.png',baseSign:1,size:76,lazy:true,deathDuration:2.4,muzzle:[.85,.60]};
PAINTED_UNITS.cossack={file:'leader-rework/cossack-living.png',deathFile:'leader-rework/cossack-death.png',baseSign:1,size:66,lazy:true,deathDuration:2.4};
PAINTED_UNITS.warakaq={file:'leader-rework/warakaq-living.png',deathFile:'leader-rework/warakaq-death.png',baseSign:1,size:54,normalize:'height',lazy:true,deathDuration:2.4,muzzle:[.85,.47]};

// Bowing changes posture, not character scale; use one fit for all envoy poses.
PAINTED_UNITS.envoy={file:'envoy-painted-v1.webp',deathFile:'negotiation/envoy-death.webp',baseSign:1,size:54,normalize:null};
PAINTED_UNITS.bomber={file:'siege-aviation/bomber.webp',baseSign:1,size:76,normalize:null,muzzle:[.55,.78]};
for(const type of ['submarine','nuclearsubmarine'])PAINTED_UNITS[type]={file:`naval-warfare/${type}.webp`,baseSign:1,size:76,normalize:null,grid:true,lazy:true,muzzle:[.86,.72]};
PAINTED_UNITS.aircraftcarrier={file:'carrier/aircraftcarrier.webp',deathFile:'carrier/aircraftcarrier-death.webp',baseSign:1,size:82,normalize:null,grid:true,lazy:true,deathGrid:true,deathPrepared:true,deathDuration:2.4};
for(const type of ['fighter','jetfighter','stealthfighter','stealthbomber','antiair','sam'])PAINTED_UNITS[type]={file:`air-warfare/${type}.webp`,baseSign:1,size:['antiair','sam'].includes(type)?70:76,normalize:null,grid:true,lazy:true,muzzle:type==='stealthbomber'?[.55,.78]:[.85,.45]};
// Independently calibrated deaths preserve the existing living-frame geometry.
for(const type of ['fighter','jetfighter','stealthfighter','bomber','stealthbomber','antiair','sam','submarine','nuclearsubmarine'])Object.assign(PAINTED_UNITS[type],{deathFile:`unit-deaths/${type}-death.webp`,deathGrid:true,deathPrepared:true,deathDuration:2.4});
PAINTED_UNITS.trebuchet={file:'siege-aviation/trebuchet.webp',baseSign:1,size:70,normalize:null,muzzle:[.84,.48]};
for(const type of ['herbalist','surgeon','fieldmedic','ambulance'])PAINTED_UNITS[type]={file:`medical/${type}.webp`,deathFile:`medical/${type}-death.webp`,baseSign:1,size:type==='ambulance'?70:54,normalize:null,grid:true,lazy:true};
for(const key of Object.keys(UNIT_ETCHINGS)){const hint=UNIT_ANIMATION_HINTS[key];PAINTED_UNITS[key]={file:'unit-poses/'+key+'.webp',deathFile:'unit-poses/'+key+'-death.webp',baseSign:1,size:['quadrireme','caravel','privateer','ironclad','helicopter','giantdeathrobot'].includes(key)?76:['heavychariot','machinegun','atcrew','modernat','batteringram','siegetower','balloon','observationdrone','rockband'].includes(key)?70:54,normalize:null,grid:true,lazy:true,deathGrid:true,deathPrepared:true,coherentScale:true,deathDuration:2.4,muzzle:hint.muzzle,muzzleHeight:hint.muzzleHeight,workFrames:hint.family==='civilian'?null:[0,1,2,3,2,1,0,1]};}
export const PAINTED_ACTIONS={idle:[0,1,2,3],move:[4,5,6,7,8,9,10,11],attack:[12,13,14,15,16,17,18,19]};
for(const type of ['infantry','mechanized','modernarmor','rocketartillery','missilecruiser','assaultship','drone','apostle','inquisitor'])PAINTED_UNITS[type]={file:`world-systems/${type}.webp`,deathFile:`world-systems/${type}-death.webp`,baseSign:1,size:['infantry','apostle','inquisitor'].includes(type)?54:['missilecruiser','assaultship','drone'].includes(type)?76:70,normalize:null,grid:true,lazy:true,muzzle:type==='drone'?[.5,.75]:['infantry','mechanized','modernarmor'].includes(type)?[.86,.48]:null};
// Both drone roles use the approved new airframe; the attack role retains its real bomb projectile.
PAINTED_UNITS.drone={...PAINTED_UNITS.observationdrone,muzzle:[.5,.75],workFrames:[0,1,2,3,2,1,0,1]};
// The selected archer releases at pose 16, after two full-draw poses.
const attackTimes={archer:[0,.0625,.125,.1875,.375,.625,.75,.875],knight:[0,.08,.18,.30,.43,.54,.71,.87],tank:[0,.12,.26,.34,.46,.60,.73,.86],battleship:[0,.12,.26,.34,.43,.60,.75,.87]};
for(const type of ['fighter','jetfighter','antiair','submarine','nuclearsubmarine'])attackTimes[type]=[0,.375,.48,.60,.72,.8125,.875,.9375];
for(const type of ['stealthfighter','stealthbomber','sam'])attackTimes[type]=[0,.10,.375,.48,.60,.72,.8125,.875];
for(const type of [...people,...riders,...equipment,'galley','frigate','destroyer'])attackTimes[type]=[0,.10,.22,.375,.50,.625,.75,.875];
// These sheets ignite at pose 14. Preserve anticipation while synchronizing release.
for(const type of ['artillery','bombard'])attackTimes[type]=[0,.10,.375,.48,.60,.72,.8125,.875];
// New atlases paint release in cell 16; align it to the shared ranged release phase.
for(const [type,hint]of Object.entries(UNIT_ANIMATION_HINTS))if(['arrow','bullet','shell','missile'].includes(hint.family))attackTimes[type]=[0,.09,.18,.28,.375,.53,.70,.87];
export function paintedFrameIndex(type,action,index,slots=16){
  if(!Number.isFinite(index))return PAINTED_ACTIONS.idle[0];
  const list=PAINTED_ACTIONS[action]||PAINTED_ACTIONS.idle;if(index<0)return PAINTED_ACTIONS.idle[0];
  const phase=((index%slots)+slots)%slots/slots;
  if(action==='work')return (PAINTED_UNITS[type]?.workFrames||(['settler','builder','missionary','envoy','apostle','inquisitor','herbalist','surgeon','fieldmedic','ambulance'].includes(type)||UNIT_ANIMATION_HINTS[type]?.family==='civilian'?PAINTED_ACTIONS.attack:[0,1,2,3,2,1,0,1]))[Math.min(7,Math.floor(phase*8))];
  if(action==='attack'){const times=attackTimes[type];if(times)return list[Math.max(0,times.findLastIndex(t=>phase>=t))];}
  return list[Math.min(list.length-1,Math.floor(phase*list.length))];
}
function canvas(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
function loadImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not load '+url));image.src=url;});}
// New prepared atlases retain fixed cell anchors, including disconnected kits and crews.
export function splitGridPoses(image,count,columns){
 const w=image.width/columns,h=image.height/(count/columns),poses=[];
 for(let i=0;i<count;i++){const crop=canvas(w);crop.height=h;const c=crop.getContext('2d',{willReadFrequently:true});c.drawImage(image,i%columns*w,Math.floor(i/columns)*h,w,h,0,0,w,h);const rgba=c.getImageData(0,0,w,h).data;let left=w,right=0,top=h,bottom=0;for(let p=0;p<w*h;p++)if(rgba[p*4+3]>=24){const x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right<=left||bottom<=top)throw Error('Empty prepared medical pose '+i);poses.push({canvas:crop,bounds:{left:0,right:w-1,top:0,bottom:h-1,visibleLeft:left,visibleRight:right,visibleTop:top,coreTop:top,coreBottom:bottom,anchorX:w/2,anchorY:h*.88}});}
 return {scale:1,poses,count};
}
// Recover complete silhouettes even when artwork extends across nominal cells.
// Original PNGs are preserved; masks and aligned frames exist only in memory.
export function splitPoses(image,count,columns,resolution,usedCount=count,software=true){
  const source=canvas(Math.max(image.width,image.height));source.width=image.width;source.height=image.height;const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const w=image.width,h=image.height,rgba=ctx.getImageData(0,0,w,h).data,labels=new Int16Array(w*h),components=[],queue=new Int32Array(w*h);
  for(let p=0;p<labels.length;p++){
    if(labels[p]||rgba[p*4+3]<48)continue;
    const id=components.length+1;let head=0,tail=1,left=w,right=0,top=h,bottom=0;queue[0]=p;labels[p]=id;
    while(head<tail){const at=queue[head++],x=at%w,y=Math.floor(at/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(const next of [at-1,at+1,at-w,at+w])if(next>=0&&next<labels.length&&!labels[next]&&rgba[next*4+3]>=48&&Math.abs(next%w-x)<=1){labels[next]=id;queue[tail++]=next;}}
    components.push({id,left,right,top,bottom,count:tail});
  }
  const bodies=components.filter(c=>c.count>2000).sort((a,b)=>b.count-a.count).slice(0,count).sort((a,b)=>(a.top+a.bottom)-(b.top+b.bottom));
  if(bodies.length!==count)throw new Error(`Expected ${count} complete poses, found ${bodies.length}`);
  const ordered=[];for(let row=0;row<count/columns;row++)ordered.push(...bodies.slice(row*columns,(row+1)*columns).sort((a,b)=>a.left-b.left));
  const bodyLabels=new Map(ordered.map((b,i)=>[b.id,i+1])),owners=new Uint8Array(w*h);let head=0,tail=0;
  for(let p=0;p<labels.length;p++){const owner=bodyLabels.get(labels[p]);if(owner){owners[p]=owner;queue[tail++]=p;}}
  // Expand from opaque cores into their own soft alpha edges and connected smoke.
  while(head<tail){const at=queue[head++],x=at%w;for(const next of [at-1,at+1,at-w,at+w])if(next>=0&&next<owners.length&&!owners[next]&&rgba[next*4+3]>0&&Math.abs(next%w-x)<=1){owners[next]=owners[at];queue[tail++]=next;}}
  const bounds=ordered.map(b=>({...b,visibleLeft:b.left,visibleRight:b.right,visibleTop:b.top,coreTop:b.top,coreBottom:b.bottom,anchorX:0,anchorY:b.bottom+1}));
  // Unconnected flecks belong to the nearest silhouette, rather than the next row.
  for(let p=0;p<owners.length;p++)if(rgba[p*4+3]>0&&!owners[p]){const x=p%w,y=Math.floor(p/w);let best=0,distance=Infinity;for(let i=0;i<bounds.length;i++){const b=bounds[i],dx=Math.max(b.left-x,0,x-b.right),dy=Math.max(b.top-y,0,y-b.bottom),d=dx*dx+dy*dy;if(d<distance){best=i;distance=d;}}owners[p]=best+1;}
  const weights=bounds.map(()=>({x:0,total:0}));
  for(let p=0;p<owners.length;p++)if(owners[p]){const i=owners[p]-1,b=bounds[i],x=p%w,y=Math.floor(p/w),alpha=rgba[p*4+3];if(labels[p]===b.id&&y>b.coreBottom-(b.coreBottom-b.coreTop)*.35){weights[i].x+=x*alpha;weights[i].total+=alpha;}b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);if(alpha>=24){b.visibleLeft=Math.min(b.visibleLeft,x);b.visibleRight=Math.max(b.visibleRight,x);b.visibleTop=Math.min(b.visibleTop,y);}}
  bounds.forEach((b,i)=>b.anchorX=weights[i].total?weights[i].x/weights[i].total:(b.left+b.right)/2);
  const used=bounds.slice(0,usedCount),half=Math.max(...used.map(b=>Math.max(b.anchorX-b.visibleLeft,b.visibleRight-b.anchorX))),up=Math.max(...used.map(b=>b.anchorY-b.visibleTop)),scale=Math.min(resolution*.46/half,resolution*.83/up);
  const crops=bounds.map(b=>{const crop=document.createElement('canvas');crop.width=b.right-b.left+1;crop.height=b.bottom-b.top+1;return {canvas:crop,pixels:crop.getContext('2d',software?{willReadFrequently:true}:undefined).createImageData(crop.width,crop.height),bounds:b};});
  for(let p=0;p<owners.length;p++)if(owners[p]){const {canvas:crop,pixels,bounds:b}=crops[owners[p]-1],out=((Math.floor(p/w)-b.top)*crop.width+p%w-b.left)*4;pixels.data.set(rgba.subarray(p*4,p*4+4),out);}
  for(const crop of crops)crop.canvas.getContext('2d').putImageData(crop.pixels,0,0);
  // Cropped poses own their pixels; release the decoded full atlas reference.
  return {scale,poses:crops.map(({canvas,bounds})=>({canvas,bounds})),count};
}
function quantile(values,fraction){const total=values.reduce((a,b)=>a+b,0);let sum=0;for(let i=0;i<values.length;i++){sum+=values[i];if(sum>=total*fraction)return i;}return values.length-1;}
// Body dimensions exclude thin raised weapons, smoke and separated particles.
// A single conservative fit then applies to every pose; no per-action zoom.
function normalizeBody(sheet,spec,resolution){
  const measures=sheet.poses.map(({canvas:crop,bounds:b})=>{
    const c=crop.getContext('2d'),pixels=c.getImageData(0,0,crop.width,crop.height).data;
    const rows=new Array(crop.height).fill(0),columns=new Array(crop.width).fill(0);
    for(let y=0;y<crop.height;y++)for(let x=0;x<crop.width;x++){const a=pixels[(y*crop.width+x)*4+3];if(a<80)continue;rows[y]+=a;if(y>crop.height*.46&&y<crop.height*.90)columns[x]+=a;}
    const height=quantile(rows,.975)-quantile(rows,.025),width=quantile(columns,.98)-quantile(columns,.02);
    return {height,width,bounds:b};
  });
  const metric=spec.normalize==='chassis'?'width':'height',reference=measures.slice(0,4).map(m=>m[metric]).sort((a,b)=>a-b)[2];
  const factors=measures.map(m=>spec.normalize?Math.max(.94,Math.min(1.06,reference/Math.max(1,m[metric]))):1);
  const half=Math.max(...sheet.poses.map(({bounds:b},i)=>Math.max(b.anchorX-b.visibleLeft,b.visibleRight-b.anchorX)*factors[i]));
  const up=Math.max(...sheet.poses.map(({bounds:b},i)=>(b.anchorY-b.visibleTop)*factors[i]));
  const fit=Math.min(resolution*.46/half,resolution*.83/up);
  sheet.poses.forEach((pose,i)=>{pose.scale=fit*factors[i];pose.bodyMetric=measures[i][metric]*pose.scale;pose.bodyHeight=measures[i].height*pose.scale;});
  sheet.normalization={metric,reference,factors,fit};
}
export class PaintedUnitAtlas{
  constructor(){this.sheets=new Map();this.frames=new Map();this.errors=[];this.resolution=128;this.pending=new Map();}
  async load(onReady=()=>{}){
    await Promise.allSettled(Object.entries(PAINTED_UNITS).filter(([,spec])=>!spec.lazy).map(([type])=>this.ensure(type,onReady)));
    this.loaded=true;
  }
  ensure(type,onReady=()=>{}){
    if(this.sheets.has(type))return Promise.resolve();if(this.pending.has(type))return this.pending.get(type);const spec=PAINTED_UNITS[type];if(!spec)return Promise.resolve();
    const task=(async()=>{
      try{
        const images=await Promise.all([loadImage('/assets/'+spec.file),spec.attackFile?loadImage('/assets/'+spec.attackFile):null,spec.deathFile?loadImage('/assets/'+spec.deathFile):null]);
        // The legacy bomber retains its calibrated GPU crop path and exact living pixels.
        const split=spec.grid?splitGridPoses:(image,count,columns,resolution,usedCount=count)=>splitPoses(image,count,columns,resolution,usedCount,type!=='bomber'),sheet=split(images[0],20,4,this.resolution,spec.attackFile?12:20),attack=images[1]?split(images[1],8,4,this.resolution):null,death=images[2]?(spec.deathGrid?splitGridPoses:split)(images[2],8,4,this.resolution):null;
        if(attack){const a=sheet.poses[0].bounds,b=attack.poses[0].bounds;attack.scale=Math.min(attack.scale,(a.coreBottom-a.coreTop)*sheet.scale/(b.coreBottom-b.coreTop));}
        normalizeBody(sheet,spec,this.resolution);
        if(death&&spec.deathPrepared){
          // These fixed-cell frames already match the measured living body scale.
          let scale=1;if(spec.coherentScale){const half=Math.max(...death.poses.map(({bounds:b})=>Math.max(b.anchorX-b.visibleLeft,b.visibleRight-b.anchorX))),up=Math.max(...death.poses.map(({bounds:b})=>b.anchorY-b.visibleTop));scale=Math.min(sheet.normalization.fit,this.resolution*.46/half,this.resolution*.83/up);const factor=scale/sheet.normalization.fit;for(const pose of sheet.poses){pose.scale*=factor;pose.bodyMetric*=factor;pose.bodyHeight*=factor;}sheet.normalization.fit=scale;}
          for(const pose of death.poses){pose.scale=scale;pose.bodyMetric=pose.bodyHeight=(pose.bounds.coreBottom-pose.bounds.coreTop)*scale;}death.calibration=1;
        }else if(death){
          // Calibrate the standing death pose once, then fit both sources together.
          const a=sheet.poses[0].bounds,b=death.poses[0].bounds,ratio=spec.grid?1:(a.coreBottom-a.coreTop)/(b.coreBottom-b.coreTop);
          const half=Math.max(...death.poses.map(({bounds:b})=>Math.max(b.anchorX-b.visibleLeft,b.visibleRight-b.anchorX)*ratio)),up=Math.max(...death.poses.map(({bounds:b})=>(b.anchorY-b.visibleTop)*ratio));
          const fit=Math.min(sheet.normalization.fit,this.resolution*.46/half,this.resolution*.83/up),factor=fit/sheet.normalization.fit;
          for(const pose of sheet.poses){pose.scale*=factor;pose.bodyMetric*=factor;pose.bodyHeight*=factor;}sheet.normalization.fit=fit;
          for(const pose of death.poses){pose.scale=fit*ratio;pose.bodyMetric=pose.bodyHeight=(pose.bounds.coreBottom-pose.bounds.coreTop)*pose.scale;}death.calibration=ratio;
        }
        if(people.includes(type)||type==='archer'||spec.grid&&spec.size===54)spec.size=54*76/sheet.poses.slice(0,4).map(p=>p.bodyHeight).sort((a,b)=>a-b)[2];
        this.sheets.set(type,{...sheet,spec,attack,death});onReady(type);
      }catch(e){this.errors.push(type+': '+e.message);console.error(type+': '+e.message);}
    })();this.pending.set(type,task);return task;
  }
  frame(type,index,action,slots=16){
    const sheet=this.sheets.get(type);if(!sheet)return null;
    const dying=action==='death'&&sheet.death,pose=dying?index<0?7:Math.min(7,Math.floor(Math.max(0,index)/slots*8)):paintedFrameIndex(type,action,index,slots),key=type+':'+(dying?'death:':'')+pose;
    if(!this.frames.has(key)){
      const {spec}=sheet,source=dying?sheet.death:pose>=12&&sheet.attack?sheet.attack:sheet,sourcePose=source.poses[source===sheet||dying?pose:pose-12],{canvas:crop,bounds:b}=sourcePose,scale=sourcePose.scale??source.scale,n=this.resolution,result=canvas(n),c=result.getContext('2d',{willReadFrequently:true});
      c.drawImage(crop,n/2+(b.left-b.anchorX)*scale,n*.88+(b.top-b.anchorY)*scale,crop.width*scale,crop.height*scale);
      const pixels=c.getImageData(0,0,n,n).data,alpha=new Uint8Array(n*n);for(let i=0;i<alpha.length;i++)alpha[i]=pixels[i*4+3];
      let muzzle=spec.muzzle;
      if(muzzle){
        const bodyHeight=sourcePose.bodyHeight??65;
        const center=Math.round(n*.88-bodyHeight*(spec.muzzleHeight??(people.includes(type)||type==='archer'?.63:.50)));
        let right=0,sumY=0,total=0;
        for(let y=Math.max(0,center-6);y<Math.min(n,center+7);y++)for(let x=n/2;x<n;x++)if(alpha[y*n+x]>80){if(x>right){right=x;sumY=y;total=1;}else if(x===right){sumY+=y;total++;}}
        if(total)muzzle=[(right+1)/n,sumY/total/n];
      }
      this.frames.set(key,{canvas:result,alpha,resolution:n,painted:true,paintedIndex:pose,baseSign:spec.baseSign,size:spec.size,muzzle,bodyMetric:sourcePose.bodyMetric,bodyHeight:sourcePose.bodyHeight,baseline:.88,asset:dying?spec.deathFile:source===sheet?spec.file:spec.attackFile});
      if(this.frames.size>256)this.frames.delete(this.frames.keys().next().value);
    }
    const cached=this.frames.get(key);this.frames.delete(key);this.frames.set(key,cached);
    return {...cached,index,action};
  }
}

const effectCells={tankShell:0,navalShell:1,stone:2,arrow:3,muzzle:[4,5,6,7],explosion:[8,9,10,11],splash:[12,13,14,15],slash:16,sparks:17,dust:18,smoke:19};
const projectileCells={torpedo:[0,1,2],cannonball:3,bullet:4,missile:5,bomb:6,bolt:7};
export class PaintedCombatAtlas{
  constructor(){this.ready=false;this.projectilesReady=false;this.errors=[];this.used=new Set();}
  async load(onReady=()=>{}){
    await Promise.all([['image','ready','/assets/combat-painted-v1.png'],['projectiles','projectilesReady','/assets/projectiles/projectiles-painted-v1.webp']].map(async([field,flag,url])=>{try{this[field]=await loadImage(url);this[flag]=true;onReady();}catch(e){this.errors.push(e.message);console.error(e.message);}}));
  }
  draw(c,name,p,width,phase=0,angle=0,anchor=[.5,.5]){
    const projectile=projectileCells[name]!==undefined,entry=projectile?projectileCells[name]:effectCells[name],image=projectile?this.projectiles:this.image;if(!image||entry===undefined)return false;
    const frame=Array.isArray(entry)?entry[Math.min(entry.length-1,Math.max(0,Math.floor(phase*entry.length)))]:entry,sw=image.width/4,sh=image.height/(projectile?2:5),height=width*sh/sw;
    c.save();c.translate(p.x,p.y);c.rotate(angle);c.drawImage(image,frame%4*sw,Math.floor(frame/4)*sh,sw,sh,-width*anchor[0],-height*anchor[1],width,height);c.restore();this.used.add(name);return true;
  }
}
