import {drawClimateWeather} from './climate-weather.js';
import {frameDeadline,cameraElapsed,cameraEase} from './frame-pacing.js';
import {paintChartPaper,drawChartFog} from './chart-fog.js';
import {UNIT_ETCHINGS,UNIT_BADGE_OVERRIDES,UNIT_INSIGNIA,insigniaMarkup,etchingSvg} from './unit-etchings.js';
import {drawEncounterArt,drawCityStateLabel} from './encounter-art.js';
import {drawRuin} from './ruin-art.js';
import {drawNaturalWonder} from './natural-wonder-art.js';
import {drawWorldWonder,drawUniqueDistrictStructure,drawUniqueCityStructures} from './unique-structures.js';
import {worldBounds,exploredBounds,chartX,wholeWorldZoom,constrainCamera} from './world-camera.js';
import {greatPersonSource,greatPersonMoveSource,GREAT_PERSON_CLASS_NAMES} from './great-person-art.js';
import {drawCityWalls,drawAirport,drawMissileSilo} from './siege-art.js';
const airBadgeImages=new Map();
function airBadge(renderer,type){if(!['fighter','jetfighter','stealthfighter','stealthbomber','antiair','sam','submarine','nuclearsubmarine','aircraftcarrier'].includes(type))return null;let image=airBadgeImages.get(type);if(!image){image=new Image();image.onload=()=>renderer.dirty=true;image.src='/assets/'+(type==='aircraftcarrier'?'carrier':UNITS[type].submarine?'naval-warfare':'air-warfare')+'/'+type+'-icon.webp';airBadgeImages.set(type,image);}return image.complete&&image.naturalWidth?image:null;}
import {cityLabelSize,drawCityLabel,drawRememberedCityMarker,drawCityPressure} from './city-label.js';
import {rememberedCityModels} from './city-memory.js';
import {tileYieldPerspective} from './tile-yields.js';
import {TERRAINS,RESOURCES,UNITS,CIVS,dist,isWater,DIRECTIONS,waterDepths,SHALLOW_WATER_LIMIT,tileYield,YIELD_KEYS} from '/rules.mjs';
export const R=35,SQ=Math.sqrt(3),SY=.6,DEFAULT_ZOOM=1.98;
const colors={ocean:'#143550',coast:'#4faeaa',grass:'#839c70',plains:'#aca079',desert:'#cbb187',tundra:'#8e9c93',snow:'#cbd6cf',mountain:'#8b9989'};
function polygon(ctx,x,y,r=R){ctx.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;(i?ctx.lineTo:ctx.moveTo).call(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();}
function hash(a){let n=Math.sin(a*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function line(ctx,points,color,width=1){ctx.beginPath();points.forEach(([x,y],i)=>(i?ctx.lineTo:ctx.moveTo).call(ctx,x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function mountain(ctx,x,y,size,v){
  ctx.fillStyle='#273c3640';ctx.beginPath();ctx.ellipse(x+5,y+6,size*.72,8,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(x-size*.85,y+5);ctx.lineTo(x-size*.12,y-size);ctx.lineTo(x+size*.83,y+7);ctx.closePath();ctx.fillStyle='#b0b5a0';ctx.fill();
  ctx.beginPath();ctx.moveTo(x-size*.12,y-size);ctx.lineTo(x+size*.83,y+7);ctx.lineTo(x+size*.17,y+2);ctx.closePath();ctx.fillStyle='#67786e';ctx.fill();
  ctx.beginPath();ctx.moveTo(x-size*.12,y-size);ctx.lineTo(x-size*.34,y-size*.63);ctx.lineTo(x-size*.09,y-size*.71);ctx.lineTo(x+size*.12,y-size*.59);ctx.closePath();ctx.fillStyle='#e2e4cd';ctx.fill();
  line(ctx,[[x-size*.7,y+4],[x-size*.12,y-size],[x+size*.83,y+7]],'#d4d9bf70',.6);
}
function tree(ctx,x,y,size,jungle=false){
  ctx.fillStyle='#263f3540';ctx.beginPath();ctx.ellipse(x+3,y+4,size*.7,2.4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#756844';ctx.fillRect(x-.7,y-size*.2,1.4,size*.4);
  if(jungle){ctx.fillStyle='#426647';ctx.beginPath();ctx.ellipse(x,y-size*.68,size*.63,size*.62,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#688152';ctx.beginPath();ctx.ellipse(x-size*.18,y-size*.82,size*.47,size*.35,-.3,0,Math.PI*2);ctx.fill();}
  else{for(let j=0;j<3;j++){const s=size*(.65-j*.13),top=y-size*(1.05+j*.14);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x-s,top+size*.65);ctx.lineTo(x+s,top+size*.65);ctx.closePath();ctx.fillStyle=j===2?'#65815b':j===1?'#496b51':'#365744';ctx.fill();}}
}
function house(ctx,x,y,scale,color='#d5c5a0',roof='#727d70'){
  const w=7*scale,h=9*scale;ctx.fillStyle='#173b344d';ctx.fillRect(x-w+3,y+1,w*2,3);
  ctx.fillStyle=color;ctx.fillRect(x-w,y-h,w*1.2,h);ctx.fillStyle='#aeab90';ctx.fillRect(x+w*.2,y-h,w*.8,h);
  ctx.beginPath();ctx.moveTo(x-w-1,y-h);ctx.lineTo(x-w*.3,y-h-4*scale);ctx.lineTo(x+w+1,y-h);ctx.closePath();ctx.fillStyle=roof;ctx.fill();
  ctx.fillStyle='#4c6560';ctx.fillRect(x-w*.45,y-h*.55,2*scale,3*scale);
}
export const UNIT_SYMBOLS={
  trebuchet:{role:'中世纪攻城',path:'M-12 9H12 M-10 9L0-12 10 9 M0-12L13-8 M-8 9V13 M8 9V13'},
  bomber:{role:'空中攻城',path:'M0-14L3-2 14 5V8L3 5 2 13H-2L-3 5-14 8V5L-3-2Z'},
  envoy:{role:'和谈使者',path:'M0-12V12 M-10 0H10 M-8-8L8 8 M8-8L-8 8'},
  settler:{role:'建城',path:'M-8 12V-12 M-8-10Q-1-15 7-9L7 1Q0-5-8 0 M-12 12H-3'},
  builder:{role:'改良',path:'M-10 11L3-3 M-1-8L4-13 13-4 8 1Z M-12-10L10 12 M-12-10L-8-12-5-7-8-5Z'},
  scout:{role:'侦察',path:'M-13-3L8-11 12-1-9 7Z M-10-4L-6 7 M4-9L8 1 M-2 5L-5 12H4'},
  warrior:{role:'近战',path:'M-8 10L7-5 9-13 1-11-12 3 M-9-1L-2 6 M-10 6L-6 10 M-13 9L-9 13'},
  spearman:{role:'反骑兵',path:'M-6 13L6-8 M3-7L7-14 9-5Z M-11-2L-5-4 0-1-1 6-5 10-10 6Z'},
  swordsman:{role:'近战',path:'M-9 12L7-7 7-14 1-10-13 6 M-10 0L-3 7 M-1 0L12-2 11 8 5 13-1 7Z'},
  archer:{role:'远程',path:'M-6-13Q12 0-6 13L-6-13 M-12 0H14 M9-5L14 0 9 5 M-10-3L-7 0-10 3'},
  horseman:{role:'轻骑兵',path:'M-10 12H11L6 4 8-3 13-3 11-9 5-12 5-15 1-12-4-10-8 2 M-8 2L-2 0 2-6 M7-7H8'},
  catapult:{role:'攻城',path:'M-11 8H12 M-8 8L-2-6 7 8 M-4 4L7-13 12-12 11-8H5 M-7 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6 M8 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6'},
  crossbow:{role:'远程',path:'M0 14V-13 M-13-5Q0-15 13-5L0 3Z M-8-6H8 M-4-9L0-13 4-9 M-3 9H3'},
  knight:{role:'重骑兵',path:'M-10 13H11L7 6 8-1 13-2 10-8 4-11-4-8-8 3 M-8 3L-2 1 1-5 M-4-10L-1-15 6-14 8-10 M-1-11H7 M-3 5L3 8 2 13'},
  musket:{role:'火器近战',path:'M-13 9L-9 13-4 7-5 4 12-13 14-11-2 6 M1 4L4 7 7 4 M7-7L10-4 M-10 10L-7 7'},
  cannon:{role:'野战远程',path:'M-11-2L12-10 14-4-7 4Z M-5 3L2 9H11 M-6 6a5 5 0 1 0 0 10a5 5 0 1 0 0-10 M8 7a4 4 0 1 0 0 8a4 4 0 1 0 0-8'},
  tank:{role:'装甲',path:'M-13 3H11L14 8 11 13H-11L-14 8Z M-8 3V-4H5L8 3 M2-3V-8H7L9-4 16-6 M-9 8H9 M-9 7V9 M-3 7V9 M3 7V9 M9 7V9'},
  galley:{role:'近战海军',path:'M-14 6H13L8 12H-8Z M0 6V-14L10 3H0 M-3-10L-11 3H-3Z M-12 15Q-5 12 0 15Q6 12 12 15'},
  frigate:{role:'远程海军',path:'M-15 7H14L9 13H-9Z M-8 7V-9L-1 3H-8 M1 7V-15L9 2H1 M10 7V-9L16 4H10 M-12 16Q-5 13 0 16Q6 13 12 16'},
  missionary:{role:'传教',path:'M-5 14V-12 M-5-9a4 4 0 1 0 0-8a4 4 0 1 0 0 8 M6-4a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M6-8V-6 M6 6V8 M0 0H-2 M12 0H14 M1-5L0-6 M11 5L12 6'},
};
for(const type of ['herbalist','surgeon','fieldmedic','ambulance'])UNIT_SYMBOLS[type]={role:'医疗支援',path:'M-10 8Q-10-12 10-8Q10 12-10 8 M-8 8L8-7'};
UNIT_SYMBOLS.great_person={role:'伟人',path:'M-9 12L9-10 M-5 8Q-4-6 12-13Q15 0-5 8Z'};
UNIT_SYMBOLS.great_admiral={role:'海军统帅',path:'M0-14V11 M-12 2Q-12 14 0 14Q12 14 12 2 M-8-6H8 M-4-14H4'};
for(const [key,v]of Object.entries(UNIT_ETCHINGS))UNIT_SYMBOLS[key]={role:v[1],path:v[2]};
const symbolPaths=Object.fromEntries(Object.entries(UNIT_SYMBOLS).map(([type,s])=>[type,new Path2D(s.path)]));
export const UNIT_ATLAS_TYPES=['settler','builder','scout','warrior','archer','spearman','swordsman','horseman','catapult','crossbow','knight','musket','cannon','tank','galley','frigate','missionary','rifleman','bombard','destroyer'];
Object.assign(UNIT_SYMBOLS,{rifleman:{role:'工业近战',path:'M-12 10L12-12 M-8 11L-12 7 M0 0L5 5 M5-6L10-1'},bombard:{role:'攻城',path:'M-12 0L9-9 14-1-8 8Z M-8 8H12 M-9 10H-5 M6 10H10'},destroyer:{role:'现代海军',path:'M-15 5H15L10 13H-10Z M-7 5V-3H8V5 M0-3V-11 M-4-7H4 M8 2L15-1'}});
export const EXTRA_UNIT_TYPES=['slinger','pikeman','manatarms','courser','cuirassier','cavalry','artillery','battleship'];
Object.assign(UNIT_SYMBOLS,Object.fromEntries(EXTRA_UNIT_TYPES.map(type=>[type,{role:type==='pikeman'?'反骑兵':type==='artillery'?'攻城':type==='battleship'?'远程海军':['courser','cuirassier','cavalry'].includes(type)?'骑兵':type==='slinger'?'远程':'近战',path:UNIT_SYMBOLS[type==='slinger'?'archer':type==='battleship'?'destroyer':type==='artillery'?'cannon':['courser','cuirassier','cavalry'].includes(type)?'knight':'spearman'].path}])));
for(const type of ['infantry','mechanized','modernarmor','rocketartillery','missilecruiser','assaultship','drone','apostle','inquisitor'])UNIT_SYMBOLS[type]={role:UNITS[type].religious?'宗教传播':UNITS[type].domain==='sea'?UNITS[type].ranged?'远程海军':'近战海军':UNITS[type].domain==='air'?'空中攻城':UNITS[type].siege?'现代攻城':UNITS[type].ranged?'现代远程':'现代近战',path:UNIT_SYMBOLS[UNITS[type].religious?'missionary':UNITS[type].domain==='sea'?'destroyer':UNITS[type].domain==='air'?'bomber':'tank'].path};
for(const type of ['fighter','jetfighter','stealthfighter','stealthbomber','antiair','sam'])UNIT_SYMBOLS[type]={role:UNITS[type].antiAir?'防空拦截':'空中轰炸',path:UNITS[type].domain==='air'?'M0-15L4-3 13 5 4 3 3 13 0 9-3 13-4 3-13 5-4-3Z':'M-12 9H12V3H-12Z M-3 3V-3L6-13 M3 3V-2L12-11'};
Object.assign(UNIT_SYMBOLS,{fighter:{role:'防空巡逻',path:'M14 0H-12 M10-6V6 M1-11V11 M-8-5V5'},jetfighter:{role:'防空巡逻',path:'M15 0L-13-9-8 0-13 9Z M-10-4L-16-6 M-10 4L-16 6'},stealthfighter:{role:'隐身防空',path:'M14 0L-7-9-13-9-7-2-14-3-17-7-17 7-14 3-7 2-13 9-7 9Z'},stealthbomber:{role:'隐身轰炸',path:'M14 0L-11-15-5-3-9 0-5 3-11 15Z'},antiair:{role:'地面防空',path:'M-13 9H13V3H-13Z M-4 3V-3L6-13 M2 3V-3L12-11'},sam:{role:'导弹防空',path:'M-13 9H13V3H-13Z M-7 3L-2-13 1-11-3 3 M2 3L7-13 10-11 6 3'}});
for(const type of ['submarine','nuclearsubmarine'])UNIT_SYMBOLS[type]={role:UNITS[type].name+' · 鱼雷海战',path:'M-15 5Q-15-3 0-3H9Q16-3 16 5Q16 10 0 10H-9Q-15 10-15 5Z M-4-3V-9H3V-3 M0-9V-14'};
UNIT_SYMBOLS.destroyer.role='近战海军 · 反潜';
UNIT_SYMBOLS.aircraftcarrier={role:'舰载航空平台',path:UNIT_SYMBOLS.battleship.path};
// Replacements retain their base pictogram and derive their actual combat role.
for(const [type,spec]of Object.entries(UNITS))if(spec.replaces){const base=UNIT_SYMBOLS[spec.replaces];UNIT_SYMBOLS[type]={...base,role:spec.ranged&&!UNITS[spec.replaces].ranged?(spec.class==='cavalry'?'远程骑兵':'远近双修'):base.role};}
for(const [type,path]of Object.entries(UNIT_BADGE_OVERRIDES))if(UNIT_SYMBOLS[type])UNIT_SYMBOLS[type].path=path;
for(const [type,symbol]of Object.entries(UNIT_SYMBOLS))symbolPaths[type]=new Path2D(symbol.path);
const insigniaPaths=Object.fromEntries(Object.entries(UNIT_INSIGNIA).map(([key,[body,line,detail]])=>[key,[new Path2D(body),new Path2D(line||''),detail?new Path2D(detail):null]]));
export function unitBadgeSvg(type,cls=''){return `<svg class="${cls} unit-insignia" viewBox="-23 -23 46 46" fill="none" stroke="none" role="img" aria-label="${UNITS[type]?.name||'单位'}">${insigniaMarkup(type)}</svg>`;}
const badgeCache=new Map();
const mixHex=(a,b,t)=>{const p=h=>{h=h.replace("#","");if(h.length===3)h=[...h].map(x=>x+x).join("");return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));},A=p(a),B=p(b);return "#"+A.map((v,i)=>Math.round(v*(1-t)+B[i]*t).toString(16).padStart(2,"0")).join("");};
function badgeArt(type,color,active,ready,secondary){
 const key=[type,color,active,ready,secondary||''].join('|');if(badgeCache.has(key))return badgeCache.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=144;const c=canvas.getContext('2d');c.translate(72,72);c.scale(3,3);
 const TAU=Math.PI*2,disk=(r,fill)=>{c.beginPath();c.arc(0,0,r,0,TAU);c.fillStyle=fill;c.fill();},ring=(r,w,s,a0=0,a1=TAU)=>{c.beginPath();c.arc(0,0,r,a0,a1);c.strokeStyle=s;c.lineWidth=w;c.stroke();};
 // Engraved medal: dark iron/bronze bezel, muted owner band, dark enamel field; light only on rims (no glow).
 c.save();c.shadowColor='#000000a0';c.shadowBlur=2;c.shadowOffsetY=1;disk(20,active?'#3a2c18':'#101315');c.restore();
 ring(19.55,.7,active?'#d2b077':'#6d5a3c',-Math.PI*.95,-Math.PI*.05);ring(19.55,.5,'#00000090',Math.PI*.05,Math.PI*.95);
 const cc=color||'#6a8091';disk(18.7,mixHex(cc,'#0a0d0f',.38));ring(18.25,.45,mixHex(cc,'#fff4dc',.25)+'aa',-Math.PI*.9,-Math.PI*.15);
 // Two-tone: inner stripe of the civ secondary colour (derived from primary when absent, e.g. old saves).
 const sc=secondary||mixHex(cc,'#e8dcbe',.55);ring(17.05,1.25,mixHex(sc,'#0a0d0f',.42));ring(16.4,.3,'#000000a0');
 const bz=c.createLinearGradient(-12,-16,12,16);bz.addColorStop(0,'#7a5f37');bz.addColorStop(.45,'#4a3820');bz.addColorStop(1,'#21180d');disk(16.3,bz);
 c.strokeStyle='#120c0699';c.lineWidth=.32;for(let i=0;i<60;i++){const a=i/60*TAU;c.beginPath();c.moveTo(Math.cos(a)*14.7,Math.sin(a)*14.7);c.lineTo(Math.cos(a)*16,Math.sin(a)*16);c.stroke();}
 ring(16.1,.45,'#d9bb8299',-Math.PI*.92,-Math.PI*.3);
 const en=c.createRadialGradient(-3,-4,1,0,0,14.4);en.addColorStop(0,mixHex(cc,'#141b20',.66));en.addColorStop(1,mixHex(cc,'#05080a',.86));disk(14.4,en);
 c.save();c.beginPath();c.arc(0,0,14.4,0,TAU);c.clip();c.strokeStyle='#9fb3b80f';c.lineWidth=.3;for(let r=1.6;r<14.4;r+=1.3)ring(r,.3,'#a8bcc012');for(let i=-16;i<16;i+=1.2){c.beginPath();c.moveTo(i,-16);c.lineTo(i+16,16);c.strokeStyle='#00000022';c.stroke();}c.restore();
 ring(13.7,1.4,'#00000075');ring(14.45,.5,'#000000c0');ring(14.3,.35,'#c9a56a55',Math.PI*.1,Math.PI*.6);
 const [body,line,detail]=insigniaPaths[type]||insigniaPaths.warrior,draw=(fill,stroke,w)=>{c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.fill(body);c.stroke(line);};
 c.save();c.scale(.7,.7);c.save();c.translate(.8,1);draw('#000000b0','#000000b0',2.6);c.restore();
 const g=c.createLinearGradient(-14,-16,12,16);g.addColorStop(0,'#dcbd86');g.addColorStop(.5,'#b08d57');g.addColorStop(1,'#6b4f2d');draw(g,g,2.3);
 c.save();c.clip(body);c.strokeStyle='#2a1c0d55';c.lineWidth=.55;for(let i=-26;i<26;i+=1.9){c.beginPath();c.moveTo(i,-22);c.lineTo(i+22,22);c.stroke();}c.restore();
 c.strokeStyle='#0d0904e6';c.lineWidth=1.05;c.stroke(body);c.strokeStyle='#e6cc9a40';c.lineWidth=.35;c.save();c.translate(-.35,-.35);c.stroke(body);c.restore();if(detail){c.strokeStyle='#1e1409c8';c.lineWidth=.85;c.stroke(detail);}c.restore();
 // Selected: pale-bronze notched outer ring + four inward chevrons (matte, no glow).
 if(active){c.lineCap='butt';for(let i=0;i<16;i++){const a=i/16*TAU+.1;ring(22,1.3,'#d8c08e',a,a+TAU/16-.2);}ring(22.9,.4,'#00000080');c.fillStyle='#d8c08e';c.strokeStyle='#1a1208';c.lineWidth=.5;for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);c.beginPath();c.moveTo(-2.6,-23.6);c.lineTo(0,-20.4);c.lineTo(2.6,-23.6);c.lineTo(0,-22.4);c.closePath();c.fill();c.stroke();c.restore();}}
 c.beginPath();c.arc(12.5,12.5,3.4,0,TAU);c.fillStyle=ready?'#5f8a5c':'#22292d';c.fill();c.strokeStyle='#0a0d0e';c.lineWidth=.9;c.stroke();c.beginPath();c.arc(12.5,12.5,3,Math.PI*1.05,Math.PI*1.6);c.strokeStyle=ready?'#b9d6a066':'#8a979c55';c.lineWidth=.5;c.stroke();
 if(!ready){c.strokeStyle='#8f9ca1';c.lineWidth=1;c.beginPath();c.moveTo(11,12.5);c.lineTo(14,12.5);c.stroke();}
 // Bounded cache: paint geometry once, then blit it during pan/zoom/animation.
 if(badgeCache.size>=256)badgeCache.delete(badgeCache.keys().next().value);badgeCache.set(key,canvas);return canvas;
}
export function drawUnitBadge(c,type,x,y,color,{scale=1,active=false,ready=true,secondary=null}={}){
  // Selected art paints the notched ring/chevrons out to r~23.6 (art units); hit bounds follow the painted extent (normal: ready dot reaches r~21.5).
  const radius=(active?24:21.6)*scale;c.drawImage(badgeArt(type,color,active,ready,secondary),x-24*scale,y-24*scale,48*scale,48*scale);return {x:x-radius,y:y-radius,width:radius*2,height:radius*2};
}
export const unitGlyph=type=>unitBadgeSvg(type,'unit-art');

export class MapRenderer{
  get dirty(){return this._dirty;}
  set dirty(value){this._dirty=value;if(value)this.staticRevision=(this.staticRevision||0)+1;}
  markCameraDirty(){this._dirty=true;}
  constructor(canvas,minimap,onSelect,onHover){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mini=minimap;this.mc=minimap.getContext('2d');this.onSelect=onSelect;this.onHover=onHover;this.zoom=.75;this.cam={x:800,y:700};this.selected=null;this.hovered=null;this.showYields=false;this.showBorders=true;this.orders=[];this.time=0;this.base=document.createElement('canvas');this.width=1;this.height=1;this.pointers=new Map();this.pointerStart=null;this.lastFrame=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.showUnitNames=true;this.unitHits=[];this.animations=new Map();this.keys=new Set();this.miniBase=document.createElement('canvas');this.borderStyle='soft';
    new ResizeObserver(()=>this.resize()).observe(canvas);this.resize();
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0012));},{passive:false});
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;this.targetCam=null;this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);this.pointerStart={x:e.clientX,y:e.clientY,cam:{...this.cam},moved:false};if(this.pointers.size===2){const [a,b]=[...this.pointers.values()];this.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:this.zoom};}canvas.classList.add('dragging');});
    canvas.addEventListener('pointermove',e=>{
      if(this.pointers.has(e.pointerId)){
        this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(this.pointers.size===2){const [a,b]=[...this.pointers.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinch)this.zoom=Math.max(.03,Math.min(2.8,this.pinch.zoom*distance/this.pinch.distance));if(this.pointerStart)this.pointerStart.moved=true;}
        else if(this.pointerStart){const dx=e.clientX-this.pointerStart.x,dy=e.clientY-this.pointerStart.y;if(Math.hypot(dx,dy)>5)this.pointerStart.moved=true;this.cam.x=this.pointerStart.cam.x-dx/this.zoom;this.cam.y=this.pointerStart.cam.y-dy/(this.zoom*SY);}
        this.markCameraDirty();
      }else{const growth=this.hitCityLabel(e.clientX,e.clientY,'growth'),unit=growth?null:this.hitUnit(e.clientX,e.clientY),t=growth||(unit?this.game.map.tiles[unit.tile]:this.hitCityLabel(e.clientX,e.clientY)||this.pick(e.clientX,e.clientY));if(this.hovered!==t?.id||this.hoveredUnit!==unit?.id){this.hovered=t?.id??null;this.hoveredUnit=unit?.id;this.dirty=true;}this.onHover(t,e,unit);}
    });
    const end=e=>{if(e.type==='pointerup'&&e.button!==0&&e.pointerType!=='touch')return;const click=e.type!=='pointercancel'&&this.pointerStart&&!this.pointerStart.moved&&this.pointers.size===1;this.pointers.delete(e.pointerId);if(click){const unit=this.hitUnit(e.clientX,e.clientY,true),tile=unit?this.game.map.tiles[unit.tile]:this.hitCityLabel(e.clientX,e.clientY)||this.pick(e.clientX,e.clientY);if(tile)this.onSelect(tile,e,unit);}this.pointerStart=null;this.pinch=null;canvas.classList.remove('dragging');this.dirty=true;};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('pointerleave',()=>{if(!this.pointers.size){this.hovered=null;this.onHover(null);this.dirty=true;}});
    const miniPan=e=>{if(!this.game)return;this.targetCam=null;const rect=minimap.getBoundingClientRect(),scale=this.miniScale;this.cam={x:((e.clientX-rect.left)*minimap.width/rect.width-this.miniOffset.x)/scale,y:((e.clientY-rect.top)*minimap.height/rect.height-this.miniOffset.y)/(scale*SY)};this.applyCameraBounds();this.markCameraDirty();};
    minimap.style.touchAction='none';minimap.style.cursor='grab';
    minimap.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();this.miniPointer=e.pointerId;minimap.setPointerCapture(e.pointerId);minimap.style.cursor='grabbing';miniPan(e);});
    minimap.addEventListener('pointermove',e=>{if(this.miniPointer===e.pointerId)miniPan(e);});
    const miniEnd=e=>{if(this.miniPointer!==e.pointerId)return;this.miniPointer=null;minimap.style.cursor='grab';if(minimap.hasPointerCapture(e.pointerId))minimap.releasePointerCapture(e.pointerId);};
    minimap.addEventListener('pointerup',miniEnd);minimap.addEventListener('pointercancel',miniEnd);
    addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(document.querySelector('dialog[open]')||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();this.keys.add(e.code);this.targetCam=null;}});
    addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>this.keys.clear());
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){this.dirty=true;this.lastFrame=0;}});
    this.tick=timestamp=>{if(this.menuOpen||document.hidden){this.lastFrame=timestamp;this.renderTime=null;}else{const next=frameDeadline(this.lastFrame,timestamp);if(next!==null){this.time=timestamp/1000;this.lastFrame=next;this.render();}}requestAnimationFrame(this.tick);};requestAnimationFrame(this.tick);
  }
  resize(){const dpr=Math.min(devicePixelRatio||1,2),rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;this.canvas.width=Math.round(rect.width*dpr);this.canvas.height=Math.round(rect.height*dpr);this.dpr=dpr;this.dirty=true;}
  position(t){return {x:R*SQ*(t.q+t.r/2)+75,y:R*1.5*t.r+90};}
  screen(t){const w=this.position(t);return {x:(w.x-this.cam.x)*this.zoom+this.width/2,y:(w.y-this.cam.y)*this.zoom*SY+this.height/2};}
  world(x,y){return {x:(x-this.width/2)/this.zoom+this.cam.x,y:(y-this.height/2)/(this.zoom*SY)+this.cam.y};}
  hitCityLabel(x,y,part=null){
    const box=this.canvas.getBoundingClientRect(),hits=this.labelBlocks||[];x-=box.left;y-=box.top;
    for(let i=hits.length-1;i>=0;i--){const hit=hits[i];if(part==='growth'&&(!hit.growth||x<hit.x+2||x>hit.x+32||y<hit.y+35||y>hit.y+47))continue;if(hit.city!==undefined&&x>=hit.x&&x<=hit.x+hit.width&&y>=hit.y&&y<=hit.y+hit.height&&(this.cityIndex?.get(hit.tile)?.id===hit.city||this.rememberedCityIndex?.get(hit.tile)?.id===hit.city))return this.game.map.tiles[hit.tile];}
    return null;
  }
  pick(x,y){if(!this.game)return null;const w=this.world(x,y),r=(w.y-90)/(R*1.5),q=(w.x-75)/(R*SQ)-r/2;let cx=q,cz=r,cy=-cx-cz;let rx=Math.round(cx),ry=Math.round(cy),rz=Math.round(cz);const dx=Math.abs(rx-cx),dy=Math.abs(ry-cy),dz=Math.abs(rz-cz);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;const col=rx+Math.floor(rz/2);return col<0||col>=this.game.map.width||rz<0||rz>=this.game.map.height?null:this.index?.get(`${rx},${rz}`)||null;}
  hitUnit(x,y,duringOrders=false){if(this.orders.length&&!duringOrders)return null;return this.unitHits.findLast(h=>x>=h.x&&x<=h.x+h.width&&y>=h.y&&y<=h.y+h.height)?.unit||null;}
  viewportTiles(){const a=this.world(-120,-120),b=this.world(this.width+120,this.height+120),result=[],map=this.game.map;
    const rowMin=Math.max(0,Math.floor((a.y-90)/(R*1.5))),rowMax=Math.min(map.height-1,Math.ceil((b.y-90)/(R*1.5))),colMin=Math.max(0,Math.floor((a.x-75)/(R*SQ))-1),colMax=Math.min(map.width-1,Math.ceil((b.x-75)/(R*SQ))+1);
    for(let row=rowMin;row<=rowMax;row++)for(let col=colMin;col<=colMax;col++){const t=map.tiles[row*map.width+col];if(t)result.push(t);}return result;
  }
  indexTile(tile){this.index.set(`${tile.q},${tile.r}`,tile);if(this.game.map.wrapX)for(const shift of [-this.game.map.width,this.game.map.width])this.index.set(`${tile.q+shift},${tile.r}`,tile);}
  inView(tile,padding=100){const p=this.screen(tile);return p.x>-padding&&p.x<this.width+padding&&p.y>-padding&&p.y<this.height+padding;}
  setYieldPlayer(player,view=player?.id??-1){
    const key=JSON.stringify([view,player?.id,player?.techs,player?.civics,view<0?this.game?.players.map(p=>[p.id,p.techs,p.civics]):null]);
    if(key!==this.yieldPlayerKey){this.yieldPlayerKey=key;this.yieldCache=new WeakMap();this.dirty=true;}
    this.yieldPlayer=player||{id:-1,techs:[],civics:[]};
    this.yieldView=view;
  }
  tileYields(tile){
    this.yieldCache??=new WeakMap();let y=this.yieldCache.get(tile);
    if(!y){y=tileYield(tile,tileYieldPerspective(this.game,tile,this.yieldView??this.yieldPlayer?.id??-1,this.yieldPlayer).player);this.yieldCache.set(tile,y);}return y;
  }
  yieldLabel(tile){const marks=['●','◆','¤','⚗','♫','☀'],y=this.tileYields(tile);return YIELD_KEYS.map((k,i)=>y[k]?`${y[k]}${marks[i]}`:'').filter(Boolean).join(' ');}
  setState(game){
    const isNew=this.game?.id!==game.id||this.game?.map.wrapX!==game.map.wrapX,previous=new Map((this.game?.units||[]).map(u=>[u.id,u]));
    if(isNew)this.animations.clear();else if(!this.reduced)for(const u of game.units){const old=previous.get(u.id);if(old&&(old.returnSequence||0)!==(u.returnSequence||0))this.animations.delete(u.id);else if(old&&old.tile!==u.tile)this.animations.set(u.id,{from:this.position(this.game.map.tiles[old.tile]),to:this.position(game.map.tiles[u.tile]),started:performance.now()/1000});}
    const oldTiles=this.game?.map.tiles;this.game=game;this.chartBounds=exploredBounds(game,R);if(isNew||!this.index){this.index=new Map();for(const t of game.map.tiles)this.indexTile(t);}else if(oldTiles!==game.map.tiles)for(const t of game.map.tiles)if(t!==oldTiles[t.id])this.indexTile(t);this.cityIndex=new Map(game.cities.map(c=>[c.tile,c]));this.unitById=new Map(game.units.map(u=>[u.id,u]));this.unitIndex=new Map();for(const u of game.units){if(!this.unitIndex.has(u.tile))this.unitIndex.set(u.tile,[]);this.unitIndex.get(u.tile).push(u);}
    this.rememberedCityIndex=new Map((game.rememberedCities||[]).map(c=>[c.tile,c]));this.cityMemoryKey=JSON.stringify((game.rememberedCities||[]).map(c=>[c.id,c.tile,c.owner,c.name,c.isCapital]));
    this.structureCities=[...game.cities,...rememberedCityModels(game)];
    const tilesChanged=isNew||oldTiles!==game.map.tiles;
    const tileKeys=tilesChanged?game.map.tiles.map((t,i)=>!isNew&&t===oldTiles?.[i]?this.tileTerrainKeys?.[i]:JSON.stringify(t.hidden?'h':[t.terrain,t.hill,t.feature,t.improvement,t.resource,t.cityId,t.district?.item,t.district?.stage,t.construction?.item,t.construction?.stage,!!t.fort,t.ruin,t.village,t.cityState,t.camp,t.variant,t.riverEdges])):this.tileTerrainKeys;
    const changedTiles=isNew?null:tilesChanged?tileKeys.flatMap((key,i)=>key!==this.tileTerrainKeys?.[i]?[i]:[]):[];
    const key=tilesChanged?game.id+'|'+tileKeys.join('|'):this.baseKey;this.tileTerrainKeys=tileKeys;
    if(key!==this.baseKey){this.baseKey=key;const oldDepths=this.waterDepths;this.waterDepths=waterDepths(game.map);if(changedTiles&&oldDepths)for(const [id,depth]of this.waterDepths)if(depth!==oldDepths.get(id))changedTiles.push(id);this.buildTerrain(changedTiles);}
    const playerColors=game.players.map(p=>p.color).join('|');
    const miniKey=tilesChanged||playerColors!==this.miniColors?game.id+'|'+JSON.stringify([game.map.tiles.map(t=>[t.hidden,t.owner,t.terrain]),playerColors]):this.miniKey;this.miniColors=playerColors;
    if(miniKey!==this.miniKey){this.miniKey=miniKey;this.buildMinimap();this.minimapRevision=(this.minimapRevision||0)+1;}
    if(isNew){const home=game.cities.find(c=>c.owner===0&&c.isCapital)||game.units.find(u=>u.owner===0);if(home){this.targetCam=null;this.cam=this.position(game.map.tiles[home.tile]);this.zoom=DEFAULT_ZOOM;}}
    this.dirty=true;
  }
  get chartInsets(){const rect=this.canvas.getBoundingClientRect(),top=document.querySelector(document.documentElement.dataset.ui==='b'?'#b-hud':'.topbar')?.getBoundingClientRect(),bottom=document.querySelector('.turnbar')?.getBoundingClientRect();return {top:top?.height?Math.max(0,top.bottom-rect.top):0,bottom:bottom?.height?Math.max(0,rect.bottom-bottom.top):0};}
  applyCameraBounds(){if(!this.game)return;this.cameraBounds=this.chartBounds||worldBounds(this.game.map,R);this.minimumZoom=wholeWorldZoom(this.cameraBounds,this.width,this.height,SY);this.zoom=Math.max(this.minimumZoom,Math.min(2.8,this.zoom));this.cam=constrainCamera(this.cam,this.zoom,this.width,this.height,this.cameraBounds,false,SY,this.chartInsets);}
  fit(){if(!this.game)return;this.targetCam=null;const b=this.chartBounds||worldBounds(this.game.map,R);this.zoom=wholeWorldZoom(b,this.width,this.height,SY);this.cam={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};this.applyCameraBounds();this.dirty=true;
  }
  focus(tile,zoom){if(!this.game)return;this.applyCameraBounds();const t=typeof tile==='number'?this.game.map.tiles[tile]:tile;if(!t)return;this.targetZoom=Math.max(this.minimumZoom,Math.min(2.8,zoom||Math.max(this.zoom,DEFAULT_ZOOM)));this.targetCam=constrainCamera(this.position(t),this.targetZoom,this.width,this.height,this.cameraBounds,!!this.wrapWorld,SY,this.chartInsets);this.dirty=true;}
  zoomAt(x,y,factor){if(this.game)this.applyCameraBounds();const before=this.world(x,y);this.zoom=Math.max(this.minimumZoom||.03,Math.min(2.8,this.zoom*factor));const after=this.world(x,y);this.cam.x+=before.x-after.x;this.cam.y+=before.y-after.y;this.targetCam=null;this.applyCameraBounds();this.dirty=true;}
  terrainType(tile){return !tile.hidden&&isWater(tile)&&this.waterDepths?.has(tile.id)?this.waterDepths.get(tile.id)<=SHALLOW_WATER_LIMIT?'coast':'ocean':tile.terrain;}
  setBorderStyle(style){this.borderStyle=style==='hidden'?'hidden':'soft';this.showBorders=this.borderStyle!=='hidden';this.dirty=true;}
  drawChartBackdrop(c,width=this.width,height=this.height){
    paintChartPaper(c,Math.round(width),Math.round(height));
  }
  traceBorderEdges(edges){
    const groups=new Map(),key=p=>Math.round(p[0]*100)+':'+Math.round(p[2]*100);
    for(const e of edges){if(!groups.has(e.owner))groups.set(e.owner,[]);groups.get(e.owner).push({a:e.edge.slice(0,3),b:e.edge.slice(3,6)});}const paths=[];
    for(const [owner,list]of groups){const nodes=new Map(),remaining=new Set(list.map((_,i)=>i));list.forEach((e,i)=>{for(const p of [e.a,e.b]){const k=key(p);if(!nodes.has(k))nodes.set(k,[]);nodes.get(k).push(i);}});
      while(remaining.size){let i=remaining.values().next().value,e=list[i],start=e.a;const ends=[e.a,e.b];for(const p of ends)if(nodes.get(key(p)).filter(i=>remaining.has(i)).length===1)start=p;const points=[start];let at=key(start);
        while(i!==undefined){remaining.delete(i);e=list[i];const next=key(e.a)===at?e.b:e.a;points.push(next);at=key(next);i=nodes.get(at).find(i=>remaining.has(i));}paths.push({owner,points});
      }
    }return paths;
  }
  get borderMetrics(){const scale=Math.sqrt(this.zoom/DEFAULT_ZOOM);return {normal:Math.max(1.3,Math.min(3.5,2.8*scale)),selected:Math.max(2.3,Math.min(4.8,4*scale)),dash:[Math.max(6,Math.min(14,10*scale)),Math.max(5,Math.min(10,7*scale))]};}
  projectBorderVertex(p){return {x:(p[0]-this.cam.x)*this.zoom+this.width/2,y:(p[2]-this.cam.y)*this.zoom*SY+this.height/2};}
  strokeBorderPaths(c,paths,selected=false){
    const style=this.borderMetrics;c.save();c.lineCap='round';c.lineJoin='round';c.setLineDash(style.dash);
    for(const {owner,points}of paths){const projected=points.map(p=>this.projectBorderVertex(p));if(projected.every(p=>p.x<-30)||projected.every(p=>p.x>this.width+30)||projected.every(p=>p.y<-30)||projected.every(p=>p.y>this.height+30))continue;c.beginPath();projected.forEach((p,i)=>(i?c.lineTo:c.moveTo).call(c,p.x,p.y));c.lineWidth=(selected?style.selected:style.normal)+1.3;c.strokeStyle='#f4e6cba0';c.stroke();c.lineWidth=selected?style.selected:style.normal;c.strokeStyle=selected?'#fce3a1':this.game.players[owner]?.color||'#b48756';c.stroke();}c.restore();
  }
  drawBaseBorders(c){
    const key=this.game.id+'|'+this.game.map.tiles.map(t=>t.hidden?'h':t.owner??'-').join(',');if(key!==this.baseBorderKey){this.baseBorderKey=key;const edges=[];for(const t of this.game.map.tiles){if(t.hidden||t.owner==null)continue;const p=this.position(t);for(let i=0;i<6;i++){const [dq,dr]=DIRECTIONS[i],n=this.index.get(`${t.q+dq},${t.r+dr}`);if(n?.owner===t.owner)continue;const a=(-30-i*60)*Math.PI/180,b=(30-i*60)*Math.PI/180;edges.push({owner:t.owner,edge:[p.x+Math.cos(a)*R,0,p.y+Math.sin(a)*R,p.x+Math.cos(b)*R,0,p.y+Math.sin(b)*R]});}}this.baseBorderPaths=this.traceBorderEdges(edges);}this.strokeBorderPaths(c,this.baseBorderPaths);
  }
  buildTerrain(){
    const g=this.game;this.base.width=R*SQ*(g.map.width+.8)+150;this.base.height=R*1.5*(g.map.height+1)+160;const c=this.base.getContext('2d');c.clearRect(0,0,this.base.width,this.base.height);
    for(const t of g.map.tiles){if(t.hidden)continue;const {x,y}=this.position(t);polygon(c,x,y);c.fillStyle=t.hidden?'#142e36':colors[t.terrain];c.fill();if(t.hidden)continue;
      if(!isWater(t)){
        c.fillStyle=hash(t.variant)>.5?`rgba(235,239,196,${hash(t.variant+1)*.06})`:`rgba(14,53,43,${hash(t.variant+2)*.1})`;c.fill();
        c.strokeStyle='#dbe5b712';c.lineWidth=.6;c.stroke();
      }
      if(isWater(t)){
        for(let j=0;j<3;j++){const wx=x-18+hash(t.variant+j)*32,wy=y-18+hash(t.variant+j+9)*34;c.beginPath();c.moveTo(wx-5,wy);c.quadraticCurveTo(wx,wy-1.2,wx+5,wy);c.strokeStyle=t.terrain==='coast'?'#acccc338':'#70989922';c.lineWidth=.7;c.stroke();}
        for(let dir=0;dir<6;dir++){const [dq,dr]=DIRECTIONS[dir],n=this.index.get(`${t.q+dq},${t.r+dr}`);if(n&&!n.hidden&&!isWater(n)){const a=(-30-dir*60)*Math.PI/180,b=(30-dir*60)*Math.PI/180;line(c,[[x+Math.cos(a)*R*.94,y+Math.sin(a)*R*.94],[x+Math.cos(b)*R*.94,y+Math.sin(b)*R*.94]],'#c3d7b660',1.5);}}
      }else{
        if(t.terrain==='desert'){for(let j=0;j<3;j++){const yy=y-9+j*9;c.beginPath();c.moveTo(x-17,yy+2);c.quadraticCurveTo(x,yy-7,x+19,yy+1);c.strokeStyle='#ead5a850';c.lineWidth=.9;c.stroke();}}
        else if(t.hill){for(let j=0;j<2;j++){const xx=x+(j-.5)*17,yy=y+5+j*7;c.beginPath();c.moveTo(xx-12,yy);c.quadraticCurveTo(xx-1,yy-20,xx+14,yy);c.closePath();c.fillStyle=j?'#6d82634a':'#e2e1b040';c.fill();line(c,[[xx-12,yy],[xx-2,yy-9],[xx+14,yy]],'#63785950',.7);}}
        else if(['grass','plains'].includes(t.terrain)){for(let j=0;j<5;j++){const xx=x-24+hash(t.variant+j)*48,yy=y-15+hash(t.variant+j+20)*30;line(c,[[xx-2,yy],[xx-1,yy-3],[xx,yy],[xx+2,yy-2]],'#536f4830',.65);}}
        if(t.riverEdges)for(const dir of t.riverEdges){const a=(-30-dir*60)*Math.PI/180,b=(30-dir*60)*Math.PI/180;const pa=[x+Math.cos(a)*R,y+Math.sin(a)*R],pb=[x+Math.cos(b)*R,y+Math.sin(b)*R];line(c,[pa,pb],'#526f6666',4);line(c,[pa,pb],'#9bb7ac',2.3);}
      }
    }
    for(const t of g.map.tiles){if(t.hidden)continue;const {x,y}=this.position(t);if(t.terrain==='mountain'){mountain(c,x-8,y+4,31,t.variant);mountain(c,x+12,y+12,23,t.variant+1);}if(t.feature)for(let i=0;i<5;i++){const tx=x-17+hash(t.variant+i*11)*34,ty=y-7+hash(t.variant+i*9)*22;tree(c,tx,ty,10+hash(t.variant+i+7)*5,t.feature==='jungle');}}
  }
  render(){
    if(!this.game)return;
    const delta=cameraElapsed(this.renderTime,this.time);this.renderTime=this.time;
    if(this.keys.size&&!document.querySelector('dialog[open]')){const step=18*delta*30/this.zoom,x=(this.keys.has('ArrowRight')||this.keys.has('KeyD')?1:0)-(this.keys.has('ArrowLeft')||this.keys.has('KeyA')?1:0),y=(this.keys.has('ArrowDown')||this.keys.has('KeyS')?1:0)-(this.keys.has('ArrowUp')||this.keys.has('KeyW')?1:0);this.cam.x+=x*step;this.cam.y+=y*step/SY;this.dirty=true;}
    for(const [id,a]of this.animations){if(this.time-a.started>=.55||!this.game.units.some(u=>u.id===id))this.animations.delete(id);this.dirty=true;}
    if(this.targetCam){this.applyCameraBounds();this.targetZoom=Math.max(this.minimumZoom,Math.min(2.8,this.targetZoom));this.targetCam=constrainCamera(this.targetCam,this.targetZoom,this.width,this.height,this.cameraBounds,false,SY,this.chartInsets);const f=this.reduced?1:cameraEase(delta);this.cam.x+=(this.targetCam.x-this.cam.x)*f;this.cam.y+=(this.targetCam.y-this.cam.y)*f;this.zoom+=(this.targetZoom-this.zoom)*f;if(Math.abs(this.cam.x-this.targetCam.x)+Math.abs(this.cam.y-this.targetCam.y)<.7&&Math.abs(this.zoom-this.targetZoom)<.002){this.cam={...this.targetCam};this.zoom=this.targetZoom;this.targetCam=null;}this.dirty=true;}
    this.applyCameraBounds();if(!this.dirty&&!this.game.routes.length)return;this.dirty=false;
    const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);
    this.drawChartBackdrop(c);
    c.save();c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom*SY);c.translate(-this.cam.x,-this.cam.y);c.drawImage(this.base,0,0);
    const worldPaint=[];
    for(const t of this.viewportTiles()){const {x,y}=this.position(t);
      if(t.hidden){polygon(c,x,y,R-.5);c.strokeStyle='#76928c12';c.lineWidth=.6;c.stroke();continue;}
      if(t.owner!==null&&t.owner!==undefined&&this.showBorders){const color=this.game.players[t.owner]?.color||'#d6b67c';polygon(c,x,y,R);c.fillStyle=color+'14';c.fill();}
      worldPaint.push({depth:y,id:t.id,paint:()=>{
      if(t.improvement)this.drawImprovement(c,t,x,y);
      if(t.district)this.drawDistrict(c,t,x,y);else if(t.construction){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawWorldWonder(this,c,t);c.restore();}
      if(t.resource&&!t.cityId&&!t.district)this.drawResource(c,t,x,y);
      if(t.village||t.cityState){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawEncounterArt(this,c,t);drawCityStateLabel(this,c,t);c.restore();}
      if(t.ruin){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawRuin(this,c,t,this.screen(t));c.restore();}
      if(t.naturalWonder){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawNaturalWonder(this,c,t);c.restore();}
      if(t.camp){c.fillStyle='#78554b';c.beginPath();c.moveTo(x-11,y+7);c.lineTo(x,y-10);c.lineTo(x+12,y+7);c.closePath();c.fill();c.fillStyle='#b55e48';c.fillRect(x+8,y-19,1,20);c.fillRect(x+9,y-19,10,6);}
      if(t.visible===false){polygon(c,x,y,R);c.fillStyle='#0c232965';c.fill();}
      if(this.showYields&&!t.cityId&&!t.district){c.font='bold 9px Georgia';c.textAlign='center';c.fillStyle='#e0e8bd';c.fillText(this.yieldLabel(t),x,y+24);}
      }});
    }
    if(this.showBorders){c.restore();this.drawBaseBorders(c);c.save();c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom*SY);c.translate(-this.cam.x,-this.cam.y);}this.drawRoutes(c);
    this.labelBlocks=[];this.unitLabels=[];this.unitHits=[];
    for(const city of this.structureCities)if(this.inView(this.game.map.tiles[city.tile]))worldPaint.push({depth:this.position(this.game.map.tiles[city.tile]).y+.01,id:city.tile,paint:()=>{c.save();if(city.remembered)c.globalAlpha=.65;this.drawCity(c,city,'body');c.restore();}});
    for(const [tile,units]of this.unitIndex)worldPaint.push({depth:this.position(this.game.map.tiles[tile]).y+1,id:tile,paint:()=>this.drawUnits(c,tile,units)});
    worldPaint.sort((a,b)=>a.depth-b.depth||a.id-b.id);for(const item of worldPaint)item.paint();
    for(const city of this.game.cities)if(this.inView(this.game.map.tiles[city.tile]))this.drawCity(c,city,'labels');
    const highlight=this.selected?.type==='unit'?null:this.selected?.tile??this.selected;if(typeof highlight==='number'&&this.game.map.tiles[highlight]){const {x,y}=this.position(this.game.map.tiles[highlight]);polygon(c,x,y,R*.98);c.lineWidth=2/this.zoom;c.strokeStyle='#f8de99';c.stroke();}
    if(this.hovered!==null&&this.game.map.tiles[this.hovered]){const {x,y}=this.position(this.game.map.tiles[this.hovered]);polygon(c,x,y,R*.93);c.fillStyle='#fff4cf24';c.fill();c.lineWidth=1/this.zoom;c.strokeStyle='#ead9a785';c.stroke();}
    for(const id of this.orderPreview?.nuclear||[]){const t=this.game.map.tiles[id];if(t){const {x,y}=this.position(t);polygon(c,x,y,R*.94);c.fillStyle='#df764950';c.fill();c.strokeStyle='#ffd0a2';c.lineWidth=1.5/this.zoom;c.stroke();}}
    for(const order of this.orders){const tile=this.game.map.tiles[order.tile];if(!tile)continue;const {x,y}=this.position(tile);polygon(c,x,y,R*.85);c.fillStyle=['attack','attackCityState','cityAttack'].includes(order.type)?'#d76e5845':'#accaa540';c.fill();c.strokeStyle=['attack','attackCityState','cityAttack'].includes(order.type)?'#f49676':'#dbeab6';c.lineWidth=1.5/this.zoom;c.stroke();}
    c.restore();
    drawChartFog(this,c);
    const vignette=c.createRadialGradient(this.width*.5,this.height*.48,this.height*.25,this.width*.5,this.height*.48,this.width*.7);vignette.addColorStop(0,'#6c573000');vignette.addColorStop(1,'#6c573022');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
    this.drawPlanning(c,this.viewportTiles());this.drawRememberedCities(c);this.drawUnitLabels(c);this.drawCompass(c);this.drawMinimap();
  }
  drawImprovement(c,t,x,y){
    if(t.improvement==='farm'||t.improvement==='plantation'){c.save();c.translate(x,y+4);c.rotate(-.15);c.fillStyle=t.improvement==='farm'?'#bda567':'#92a26b';c.fillRect(-17,-12,34,22);for(let i=0;i<6;i++)line(c,[[-16,-10+i*4],[16,-10+i*4]],'#756c4160',1);c.restore();house(c,x+13,y+9,.65);}
    else if(t.improvement==='mine'||t.improvement==='quarry'||t.improvement==='well'){c.fillStyle='#536b61';c.beginPath();c.ellipse(x,y,13,7,0,0,Math.PI*2);c.fill();line(c,[[x-10,y+1],[x-4,y-13],[x+8,y-11],[x+12,y+1]],'#b7b294',2);if(t.improvement==='well')line(c,[[x-7,y],[x,y-23],[x+7,y],[x-7,y-14],[x+7,y-14]],'#435b55',2);else house(c,x+13,y+9,.6,'#c1b38f','#526859');}
    else if(t.improvement==='fishery'){line(c,[[x-12,y+7],[x+13,y+7],[x+16,y+1]],'#d5c299',2);line(c,[[x,y+5],[x,y-14],[x+8,y-2],[x,y-2]],'#e3d6b1',1.8);}
    else{house(c,x-3,y+5,.8);line(c,[[x-16,y-8],[x+14,y-8],[x+14,y+12],[x-16,y+12],[x-16,y-8]],'#6d7554',1);}
  }
  drawResource(c,t,x,y){const r=RESOURCES[t.resource];if(!r)return;const xx=x+19,yy=y-17;c.fillStyle='#183a337a';c.beginPath();c.arc(xx,yy,6,0,Math.PI*2);c.fill();c.fillStyle=r.category==='luxury'?'#efd69d':r.category==='strategic'?'#dae2d3':'#d1deac';c.font='9px Georgia';c.textAlign='center';c.fillText(r.icon,xx,yy+3);}
  drawDistrict(c,t,x,y){
    c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);const uniqueDrawn=drawWorldWonder(this,c,t)||drawUniqueDistrictStructure(this,c,t);c.restore();if(uniqueDrawn)return;
    if(t.district.item==='aqueduct'){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawEncounterArt(this,c,t);c.restore();return;}
    if(t.district.item==='missilesilo'){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);const drawn=drawMissileSilo(this,c,t);c.restore();if(drawn)return;}
    if(t.district.item==='airport'){c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawAirport(this,c,t);c.restore();return;}
    const item=t.district.item,color=this.game.players[t.owner]?.color||'#cbb77d';c.fillStyle='#d6caa4';c.beginPath();c.ellipse(x,y+9,21,11,0,0,Math.PI*2);c.fill();
    if(t.district.kind==='wonder'){
      if(item==='pyramids'){for(let j=0;j<2;j++){const xx=x-8+j*15,size=j?19:28;c.beginPath();c.moveTo(xx-size*.5,y+8);c.lineTo(xx,y-size*.6);c.lineTo(xx+size*.6,y+10);c.closePath();c.fillStyle='#e3c78f';c.fill();c.beginPath();c.moveTo(xx,y-size*.6);c.lineTo(xx+size*.6,y+10);c.lineTo(xx+2,y+6);c.closePath();c.fillStyle='#aa926c';c.fill();}}
      else if(item==='eiffel'){line(c,[[x-13,y+9],[x,y-38],[x+13,y+9],[x-10,y-7],[x+10,y-7],[x-7,y-19],[x+7,y-19]],'#6a7871',2.4);}
      else{house(c,x,y+6,1.7,'#e3d4b3','#8d9082');for(let j=0;j<4;j++)c.fillRect(x-13+j*8,y-10,3,17);}
    }else if(item==='campus'||item==='theater'||item==='holy'){house(c,x,y+6,1.4,'#e2d6b3',item==='holy'?'#b3ab7f':'#859780');for(let j=0;j<3;j++)house(c,x-15+j*15,y+14,.58);if(item==='holy'){c.fillStyle='#d9d0a5';c.fillRect(x-2,y-24,4,20);c.beginPath();c.arc(x,y-24,4,Math.PI,0);c.fill();}}
    else if(item==='industrial'||item==='spaceport'){house(c,x-3,y+9,1.5,'#a5b2a0','#657f73');for(let j=0;j<2;j++){c.fillStyle='#788778';c.fillRect(x+8+j*7,y-20-j*5,4,23+j*5);}if(item==='spaceport')line(c,[[x-12,y+6],[x-12,y-28],[x-17,y-19],[x-7,y-19]],'#e5dfc1',3);}
    else if(item==='harbor'){line(c,[[x-20,y+8],[x+20,y+8],[x+20,y+15]],'#c9c398',3);house(c,x,y+6,1.2);line(c,[[x+14,y+6],[x+14,y-20]],'#e9dbb3',2);}
    else{for(let j=0;j<3;j++)house(c,x+(j-1)*13,y+7+(j%2)*4,.8);}
    c.fillStyle=color;c.beginPath();c.arc(x-21,y+10,2,0,Math.PI*2);c.fill();
  }
  drawCity(c,city,phase='all'){
    const t=this.game.map.tiles[city.tile];if(t?.hidden)return;const {x,y}=this.position(t),p=this.game.players[city.owner],population=city.population;
    if(phase!=='labels'){
    c.fillStyle='#c5c0a0';c.beginPath();c.ellipse(x,y+5,24,14,0,0,Math.PI*2);c.fill();
    for(let j=0;j<Math.min(8,population+3);j++){const a=j*2.399,rad=j===0?0:10+Math.floor(j/4)*7;house(c,x+Math.cos(a)*rad,y+Math.sin(a)*rad*.55+9,.7+hash(city.id+j)*.35,'#e0d2b2',p.color);}
    house(c,x,y+4,1.3,'#e9dec3',p.color);c.fillStyle='#e8dcc0';c.fillRect(x-2,y-26,4,17);c.fillStyle=p.color;c.beginPath();c.moveTo(x+1,y-26);c.lineTo(x+13,y-22);c.lineTo(x+1,y-18);c.closePath();c.fill();
    c.save();c.setTransform(this.dpr,0,0,this.dpr,0,0);drawCityWalls(this,c,city);drawUniqueCityStructures(this,c,city);c.restore();
    }
    if(city.remembered||phase==='body')return;
    const uiScale=1/this.zoom;
    if(this.zoom<.38&&!(this.selected?.type==='city'&&this.selected.id===city.id)){c.save();c.translate(x,y);c.scale(uiScale,uiScale/SY);c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fillStyle=p.color;c.fill();c.strokeStyle='#183139';c.lineWidth=1;c.stroke();c.restore();return;}
    c.save();c.translate(x,y-35);c.scale(uiScale,uiScale/SY);const size=cityLabelSize(c,city),label=drawCityLabel(c,city,p,-size.width/2,12-size.height,()=>{this.dirty=true;});const pressure=drawCityPressure(c,city,0,65);c.restore();
    const screen=this.screen(t);this.labelBlocks.push({...label,x:screen.x-size.width/2,y:screen.y-35*this.zoom*SY+12-size.height});
    if(pressure)this.labelBlocks.push({city:city.id,tile:city.tile,x:screen.x-pressure.width/2,y:screen.y-35*this.zoom*SY+65,width:pressure.width,height:pressure.height});
  }
  drawUnits(c,tile,units){
    const t=this.game.map.tiles[tile];if(!t||t.hidden||!this.inView(t,160)&&!units.some(u=>this.animations.has(u.id)))return;
    const city=this.cityIndex.has(tile),names=this.showUnitNames&&this.zoom>=.55,badgeScale=Math.max(.35,Math.min(1,this.zoom/.65)),spread=names?62:29*badgeScale;
    for(let i=0;i<units.length;i++){
      const u=units[i],p=this.game.players[u.owner],spec=UNITS[u.type],color=p?.color||(u.cityState?'#adbdc1':'#df8875'),a=this.animations.get(u.id),f=a?Math.max(0,Math.min(1,(this.time-a.started)/.55)):1,ease=f*f*(3-2*f),pos=a?{x:a.from.x+(a.to.x-a.from.x)*ease,y:a.from.y+(a.to.y-a.from.y)*ease}:this.position(t),x=pos.x+(i-(units.length-1)/2)*spread/this.zoom,y=pos.y+(city?24:0),active=this.selected?.type==='unit'&&this.selected.id===u.id,ready=u.moves>0&&!u.acted;
      c.save();c.translate(x,y);c.scale(badgeScale/this.zoom,badgeScale/(this.zoom*SY));
      c.shadowColor='#0a202dbb';c.shadowBlur=5;c.fillStyle='#142e36f5';c.strokeStyle=active?'#ffe0a0':color;c.lineWidth=active?2.4:1.7;
      c.beginPath();if(spec.civilian)c.roundRect(-17,-20,34,36,10);else if(spec.domain==='sea')c.roundRect(-19,-19,38,34,4);else{c.moveTo(0,-22);c.lineTo(18,-13);c.lineTo(16,9);c.lineTo(0,20);c.lineTo(-16,9);c.lineTo(-18,-13);c.closePath();}c.fill();c.stroke();c.shadowBlur=0;
      c.save();c.translate(0,-1);c.scale(.87,.87);const onGreatReady=this.greatPersonReady??=()=>{this.dirty=true;},moving=!this.reduced&&(a&&f<1||u.activity?.action.type==='move'),paintedBadge=(moving?greatPersonMoveSource(u,Math.floor(this.time*6)%4,4,onGreatReady)?.canvas:null)||greatPersonSource(u,onGreatReady)||airBadge(this,u.type);if(paintedBadge)c.drawImage(paintedBadge,-20,-20,40,40);else{c.strokeStyle=ready?color:'#a8b6b0';c.lineWidth=2;c.lineCap='round';c.lineJoin='round';const [body,line,detail]=insigniaPaths[u.type]||insigniaPaths.warrior;c.fillStyle=c.strokeStyle;c.fill(body,'nonzero');c.stroke(line);if(detail){c.strokeStyle='#1e1409b8';c.lineWidth=.85;c.stroke(detail);}}c.restore();
      c.beginPath();c.arc(16,-17,4.3,0,Math.PI*2);c.fillStyle=ready?'#b8d39a':'#647e79';c.fill();c.strokeStyle='#142e36';c.lineWidth=1.3;c.stroke();
      if(u.hp<(u.maxHp||spec.maxHp||100)){c.fillStyle='#593b36';c.fillRect(-16,18,32,3);c.fillStyle=u.hp<40?'#e2977d':'#b5cf99';c.fillRect(-16,18,32*Math.max(0,u.hp)/(u.maxHp||spec.maxHp||100),3);}
      c.restore();const screen={x:(x-this.cam.x)*this.zoom+this.width/2,y:(y-this.cam.y)*this.zoom*SY+this.height/2},hit={unit:u,kind:'badge',x:screen.x-20*badgeScale,y:screen.y-24*badgeScale,width:40*badgeScale,height:45*badgeScale};this.unitHits.push(hit);this.labelBlocks.push(hit);if(names)this.unitLabels.push({unit:u,screen,color,active,ready});
    }
  }
  drawUnitLabels(c){
    drawClimateWeather(this,c);
    const overlaps=(a,b)=>a.x<b.x+b.width+3&&a.x+a.width+3>b.x&&a.y<b.y+b.height+3&&a.y+a.height+3>b.y;
    for(const label of this.unitLabels){
      const {unit:u,screen:p,color,active,ready,transport}=label;if(p.y<84||p.y>this.height-102||p.x<10||p.x>this.width-10)continue;
      c.font='10px "Microsoft YaHei",sans-serif';const width=Math.max(48,c.measureText(u.greatPersonName||UNITS[u.type].name).width+12),height=28;
      const candidates=[[p.x-width/2,p.y+25],[p.x+25,p.y-13],[p.x-width-25,p.y-13],[p.x-width/2,p.y-57],[p.x+25,p.y+24],[p.x-width-25,p.y+24],[p.x+25,p.y-55],[p.x-width-25,p.y-55],[p.x-width/2,p.y+59],[p.x+width/2+30,p.y+4],[p.x-width*1.5-30,p.y+4]];
      const options=candidates.map(([x,y])=>({x,y,width,height}));const rect=options.find(r=>r.x>=4&&r.x+width<=this.width-4&&r.y>=80&&r.y+height<=this.height-90&&!this.labelBlocks.some(b=>overlaps(r,b)));if(!rect)continue;
      this.labelBlocks.push(rect);
      if(rect!==options[0]){c.beginPath();c.moveTo(p.x,p.y+15);c.lineTo(Math.max(rect.x,Math.min(rect.x+width,p.x)),Math.max(rect.y,Math.min(rect.y+height,p.y)));c.strokeStyle=color+'99';c.lineWidth=1;c.stroke();}
      c.fillStyle='#122931f5';c.beginPath();c.roundRect(rect.x,rect.y,width,height,3);c.fill();c.fillStyle=color;c.fillRect(rect.x,rect.y+2,2,height-4);if(active){c.strokeStyle='#f2d79a';c.lineWidth=.7;c.strokeRect(rect.x+.5,rect.y+.5,width-1,height-1);}
      c.textAlign='center';c.fillStyle=active?'#ffe3ad':'#f0ebd7';c.fillText(u.greatPersonName||UNITS[u.type].name,rect.x+width/2+1,rect.y+12);c.font='8px "Microsoft YaHei",sans-serif';c.fillStyle=ready?'#b9ccaa':'#99aba7';c.fillText(this.game.realtime?(transport?(transport==='cargo'?'运输船':'木船')+' · ':u.greatPersonClass?(GREAT_PERSON_CLASS_NAMES[u.greatPersonClass]||'伟人')+' · ':'')+(u.activity?'行动中':!ready?(this.game.settings.playMode==='turns'?'本回合已行动':'恢复中'):(u.attackUntil||0)>this.actionTime?'攻击冷却':'就绪'):transport?(transport==='cargo'?'运输船':'木船')+(ready?' · '+u.moves:' · 已行动'):ready?`${u.moves} 行动力`:'已行动',rect.x+width/2+1,rect.y+23);this.unitHits.push({...rect,unit:u,kind:'label'});
    }
  }
  drawRoutes(c){
    for(const route of this.game.routes){const from=this.game.cities.find(city=>city.id===route.from),to=this.game.cities.find(city=>city.id===route.to);if(!from||!to)continue;const a=this.position(this.game.map.tiles[from.tile]),b=this.position(this.game.map.tiles[to.tile]),control={x:(a.x+b.x)/2,y:(a.y+b.y)/2-35};c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(control.x,control.y,b.x,b.y);c.strokeStyle='#e3c88855';c.lineWidth=1.2;c.setLineDash([4,5]);c.stroke();c.setLineDash([]);
      const t=this.reduced?.5:(this.time*.07+route.id*.13)%1,x=(1-t)**2*a.x+2*(1-t)*t*control.x+t*t*b.x,y=(1-t)**2*a.y+2*(1-t)*t*control.y+t*t*b.y;c.fillStyle='#f5dc9d';c.beginPath();c.arc(x,y,2.6,0,Math.PI*2);c.fill();
    }
  }
  drawCompass(c){const x=this.width>760?this.width-151:this.width-43,y=this.width>760?this.height-319:100;if(this.width<761)return;c.save();c.translate(x,y);c.strokeStyle='#c1b58a70';c.lineWidth=.8;for(let j=0;j<8;j++){const a=j*Math.PI/4,s=j%2?11:18;line(c,[[Math.cos(a)*4,Math.sin(a)*4],[Math.cos(a)*s,Math.sin(a)*s]],'#c1b58a70',.8);}c.font='9px Georgia';c.textAlign='center';c.fillStyle='#d7c899';c.fillText('N',0,-25);c.restore();}
  buildMinimap(){
    const w=this.mini.width,h=this.mini.height,b=this.chartBounds||worldBounds(this.game.map,R);this.miniBase.width=w;this.miniBase.height=h;const c=this.miniBase.getContext('2d');c.fillStyle=b.explored?'#d5c39b':'#173c49';c.fillRect(0,0,w,h);const mapW=b.right-b.left,mapH=b.bottom-b.top,scale=Math.min(w/mapW,h/(mapH*SY));this.miniScale=scale;this.miniOffset={x:(w-mapW*scale)/2-b.left*scale,y:(h-mapH*scale*SY)/2-b.top*scale*SY};c.save();c.translate(this.miniOffset.x,this.miniOffset.y);c.scale(scale,scale*SY);
    for(const t of this.game.map.tiles){if(t.hidden)continue;const {x,y}=this.position(t);polygon(c,chartX(x,b),y,R+1);c.fillStyle=t.owner!==null&&t.owner!==undefined?this.game.players[t.owner]?.color||'#a59e70':colors[this.terrainType(t)];c.fill();}
    c.restore();
  }
  drawRememberedCities(c){
    for(const city of this.game.rememberedCities||[]){const t=this.game.map.tiles[city.tile];if(!t||!this.inView(t))continue;const block=drawRememberedCityMarker(c,city,this.game.players[city.owner],this.screen(t),this.zoom);if(block)this.labelBlocks.push(block);}
  }
  fillTile(c,id,color){const t=this.game.map.tiles[id],p=this.screen(t);c.save();c.translate(p.x,p.y);c.scale(this.zoom,this.zoom*SY);polygon(c,0,0,R);c.fillStyle=color;c.fill();c.restore();}
  drawPlanning(c,tiles){
    if(this.settlementLens){c.save();c.lineJoin='round';c.lineCap='round';
      for(const tile of tiles){const site=this.settlementLens.get(tile.id);if(!site||tile.hidden||!this.inView(tile))continue;
        const q=Math.max(0,Math.min(1,((site.score||0)-25)/90)),p=this.position(tile),width=Math.max(1,Math.min(1.8,this.zoom*.7))+(site.legal?q*.5:0);
        // Ground-following inset outlines leave terrain pixels untouched and retain object occlusion.
        c.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180,x=p.x+Math.cos(a)*R*.94,z=p.y+Math.sin(a)*R*.94,h=this.surfaceHeight?.(x,z)||0,v=this.projectBorderVertex([x,h+.8,z]);(i?c.lineTo:c.moveTo).call(c,v.x,v.y);}c.closePath();
        c.setLineDash(site.legal?[]:[3,4]);c.lineWidth=width+1.4;c.strokeStyle='#0b171c66';c.stroke();c.lineWidth=width;
        c.strokeStyle=site.legal?`rgba(${Math.round(108-q*24)},${Math.round(158+q*57)},${Math.round(87+q*23)},${.65+q*.25})`:'rgba(209,89,74,.82)';c.stroke();
      }c.restore();
    }
    if(!this.showBorders)return;c.save();c.lineJoin='round';c.lineCap='round';
    for(const tile of tiles){if(tile.hidden||!tile.cityStateTerritory)continue;const p=this.position(tile);for(let i=0;i<6;i++){const [dq,dr]=DIRECTIONS[i],other=this.index.get(`${tile.q+dq},${tile.r+dr}`);if(other?.cityStateTerritory===tile.cityStateTerritory&&!other.hidden)continue;const points=[-30-i*60,30-i*60].map(a=>{const rad=a*Math.PI/180,x=p.x+Math.cos(rad)*R,z=p.y+Math.sin(rad)*R,v=this.cornerVertices?.get(`${Math.round(x*100)},${Math.round(z*100)}`);return this.projectBorderVertex([x,(v?.height||0)+.8,z]);});c.beginPath();c.moveTo(points[0].x,points[0].y);c.lineTo(points[1].x,points[1].y);c.setLineDash([]);c.strokeStyle='#0b171c';c.lineWidth=4.8;c.stroke();c.setLineDash([2.5,4]);c.strokeStyle=this.game.cityStates?.types[this.game.cityStates.states.find(s=>s.id===tile.cityStateTerritory)?.type]?.color||'#ddceb0';c.lineWidth=2.1;c.stroke();}}
    c.restore();
  }
  drawMinimap(){
    const key=[this.minimapRevision,this.cityMemoryKey,this.cam.x,this.cam.y,this.zoom,this.width,this.height].join(':');if(key===this.miniDrawKey)return;this.miniDrawKey=key;
    const c=this.mc,scale=this.miniScale;c.drawImage(this.miniBase,0,0);c.save();c.translate(this.miniOffset.x,this.miniOffset.y);c.scale(scale,scale*SY);for(const city of this.game.rememberedCities||[]){const p=this.position(this.game.map.tiles[city.tile]);c.beginPath();c.arc(chartX(p.x,this.chartBounds),p.y,(city.isCapital?2.5:1.8)/scale,0,Math.PI*2);c.strokeStyle=this.game.players[city.owner]?.color||'#c5bc93';c.lineWidth=1/scale;c.stroke();}c.strokeStyle='#f2e3b7';c.lineWidth=1/scale;c.fillStyle='#f2e3b718';const x=this.cam.x-this.width/(2*this.zoom),y=this.cam.y-this.height/(2*this.zoom*SY),w=this.width/this.zoom,h=this.height/(this.zoom*SY);c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);c.restore();
  }
}
