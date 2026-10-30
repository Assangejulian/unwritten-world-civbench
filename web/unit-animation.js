// Painted poses take precedence; original artwork rigs supply fallback animation.
import {PaintedUnitAtlas} from './painted-actions.js';
import {PaintedTransportAtlas} from './transport-art.js';
import {uniqueMotionBases} from './visuals.js';
import {greatPersonArtClass,greatPersonSource,greatPersonMoveSource} from './great-person-art.js';
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const leg=(x,hip=.63,width=.11,phase=0)=>({x,hip,width,phase});
const pair=(x,hip=.64,width=.085)=>[leg(x-width,hip,width,0),leg(x+width,hip,width,Math.PI)];
// Height affects the aircraft sprite only; the ground marker stays on its tile.
export function aircraftAltitude(type,{time=0,stage='idle',attack=null,ghost=null,reduced=false}={}){
  if(type!=='drone'){
    if(!['bomber','stealthbomber','fighter','jetfighter','stealthfighter'].includes(type))return 0;
    if(ghost?.kind==='death')return reduced?0:32*(1-smooth((time-ghost.started)/ghost.duration));
    return stage==='move'||attack?32:0;
  }
  if(ghost?.kind==='death')return reduced?0:64*(1-smooth((time-ghost.started)/ghost.duration));
  if(reduced||!attack)return 64;
  const phase=clamp((time-attack.started)/Math.max(.001,attack.duration));
  return 64-22*Math.sin(phase*Math.PI)**2;
}
const walk=(legs,speed=1,extra={})=>({kind:'walk',legs,speed,baseSign:1,...extra});
const ride=(legs,speed=1.25,extra={})=>({kind:'mounted',legs,speed,baseSign:1,...extra});
const wheels=(parts,legs=[])=>({kind:'wheeled',wheels:parts,legs,speed:.85,baseSign:1});
const ship=(kind,baseSign)=>({kind,baseSign,speed:.85,legs:[]});

// Coordinates refer to each atlas cell, including its transparent margin.
export const UNIT_RIGS={
  great_person:walk(pair(.5,.69,.08),.9),
  great_admiral:ship('sail',1),
  infantry:walk(pair(.5,.69,.08),1),
  mechanized:{kind:'wheeled',speed:1,baseSign:1,legs:[],wheels:[]},
  modernarmor:{kind:'tracked',speed:1,baseSign:1,legs:[],wheels:[]},
  rocketartillery:{kind:'tracked',speed:.9,baseSign:1,legs:[],wheels:[]},
  missilecruiser:ship('steam',1),
  assaultship:ship('steam',1),
  drone:{kind:'aircraft',speed:2,baseSign:1,legs:[]},
  apostle:walk(pair(.5,.69,.08),.9),
  inquisitor:walk(pair(.5,.69,.08),.9),
  herbalist:walk(pair(.5,.69,.08),.9),
  surgeon:walk(pair(.5,.69,.08),.9),
  fieldmedic:walk(pair(.5,.69,.08),1),
  ambulance:wheels([[.26,.79,.08,.10],[.75,.81,.08,.10]]),
  bomber:{kind:'aircraft',speed:2,baseSign:1,legs:[]},
  trebuchet:wheels([[.24,.86,.09,.10],[.66,.86,.09,.10]],[...pair(.12,.7,.05),...pair(.80,.7,.05)]),
  envoy:walk(pair(.5,.69,.08),.9),
  settler:walk([...pair(.25,.63,.055),...pair(.57,.72,.055),...pair(.83,.78,.045)],.86,{baseSign:-1}),
  builder:walk([...pair(.27,.63,.08),...pair(.69,.68,.07)],.9),
  scout:walk(pair(.55,.62,.12),1.25),
  warrior:walk([...pair(.26,.64,.08),...pair(.70,.63,.07)]),
  archer:walk([...pair(.24,.66,.055),...pair(.68,.62,.06)]),
  spearman:walk([...pair(.30,.60,.05),...pair(.76,.65,.06)],.95,{baseSign:-1}),
  swordsman:walk([...pair(.29,.61,.08),...pair(.75,.67,.065)]),
  horseman:ride([leg(.23,.71,.075),leg(.37,.69,.065,Math.PI),leg(.69,.75,.075,Math.PI),leg(.83,.73,.07)]),
  catapult:wheels([[.49,.83,.085,.12],[.85,.78,.075,.11]],[...pair(.13,.69,.05),...pair(.83,.70,.05)]),
  crossbow:walk([...pair(.23,.68,.06),...pair(.79,.80,.07)],.94),
  knight:ride([leg(.23,.69,.07),leg(.39,.70,.07,Math.PI),leg(.70,.73,.075,Math.PI),leg(.88,.75,.06)],1.15,{baseSign:-1}),
  musket:walk([...pair(.27,.71,.07),...pair(.79,.74,.07)],.96),
  cannon:wheels([[.37,.75,.125,.19],[.71,.81,.055,.085]],[...pair(.14,.69,.05),...pair(.78,.69,.055)]),
  tank:{kind:'tracked',speed:.96,baseSign:-1,legs:[],wheels:[[.55,.85,.039,.04],[.66,.81,.04,.041],[.78,.76,.04,.043],[.88,.72,.038,.045]]},
  galley:ship('oared',-1),
  frigate:ship('sail',-1),
  missionary:walk([...pair(.26,.73,.05),...pair(.67,.75,.065)],.86,{baseSign:-1}),
  rifleman:walk([...pair(.27,.67,.07),...pair(.73,.81,.07)],1.02),
  bombard:wheels([[.54,.86,.073,.105],[.85,.77,.078,.095]],[...pair(.16,.74,.05),...pair(.69,.77,.035)]),
  destroyer:ship('steam',-1),
  slinger:walk(pair(.51,.61,.27),1.06),
  pikeman:walk(pair(.42,.61,.15),.94),
  manatarms:walk(pair(.52,.63,.15),.94),
  courser:ride([leg(.36,.67,.10),leg(.54,.70,.10,Math.PI),leg(.72,.64,.09,Math.PI),leg(.84,.72,.09)],1.35),
  cuirassier:ride([leg(.29,.65,.10),leg(.44,.69,.09,Math.PI),leg(.74,.68,.09,Math.PI),leg(.86,.64,.085)],1.20),
  cavalry:ride([leg(.19,.68,.09),leg(.39,.74,.085,Math.PI),leg(.66,.67,.09,Math.PI),leg(.80,.73,.095)],1.35),
  artillery:wheels([[.78,.77,.135,.16]],[...pair(.20,.70,.04),...pair(.47,.83,.05)]),
  battleship:ship('steam',1)
};

export function angleDelta(from,to){return Math.atan2(Math.sin(to-from),Math.cos(to-from));}
for(const type of ['submarine','nuclearsubmarine'])UNIT_RIGS[type]=ship('naval',1);
UNIT_RIGS.aircraftcarrier=ship('naval',1);
for(const type of ['fighter','jetfighter','stealthfighter','stealthbomber'])UNIT_RIGS[type]={kind:'aircraft',speed:2,baseSign:1,legs:[]};
for(const type of ['antiair','sam'])UNIT_RIGS[type]={kind:'tracked',speed:1,baseSign:1,legs:[],wheels:[]};
for(const [type,base]of Object.entries(uniqueMotionBases))UNIT_RIGS[type]={...UNIT_RIGS[base],baseSign:1};
for(const type of ['hwacha','scythed_chariot','maryannu_chariot'])UNIT_RIGS[type]={...UNIT_RIGS.catapult,baseSign:1};
export function initialHeading(type){return UNIT_RIGS[type].baseSign<0?Math.PI:0;}
export function createJourney(type,points,heading,started){
  const route=points.filter((p,i)=>!i||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)>.001);
  if(route.length<2)return null;
  const lengths=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.y-route[i].y)),distance=lengths.reduce((a,b)=>a+b,0);
  const headings=route.slice(1).map((p,i)=>Math.atan2(p.y-route[i].y,p.x-route[i].x));
  const turn=clamp(Math.abs(angleDelta(heading,headings[0]))*.12,.12,.32),travel=clamp((.48+distance/61*.27)/UNIT_RIGS[type].speed,.58,2.4),stop=.18;
  return {type,points:route,lengths,headings,distance,heading,started,turn,travel,stop,duration:turn+travel+stop};
}
export function sampleJourney(journey,time){
  const j=journey,elapsed=Math.max(0,time-j.started),first=j.points[0],last=j.points.at(-1);
  if(elapsed<j.turn)return {position:first,heading:j.heading+angleDelta(j.heading,j.headings[0])*smooth(elapsed/j.turn),stage:'turn',weight:0,phase:0,segment:0,done:false};
  if(elapsed>=j.turn+j.travel)return {position:last,heading:j.headings.at(-1),stage:elapsed<j.duration?'stop':'idle',weight:0,phase:0,settle:elapsed<j.duration?Math.sin((elapsed-j.turn-j.travel)/j.stop*Math.PI):0,done:elapsed>=j.duration};
  const progress=(elapsed-j.turn)/j.travel,distance=smooth(progress)*j.distance;
  let segment=0,offset=distance;while(segment<j.lengths.length-1&&offset>j.lengths[segment])offset-=j.lengths[segment++];
  const f=clamp(offset/j.lengths[segment]),a=j.points[segment],b=j.points[segment+1];
  let heading=j.headings[segment];
  if(segment&&f<.22)heading=j.headings[segment-1]+angleDelta(j.headings[segment-1],heading)*smooth(f/.22);
  return {position:{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},heading,stage:'move',weight:Math.min(smooth(progress/.14),smooth((1-progress)/.14)),phase:distance/61*TAU*1.7,segment,done:false};
}
export function facingTransform(type,heading,baseSign=UNIT_RIGS[type].baseSign){
  const cos=Math.cos(heading),sign=cos<0?-1:1;
  return {scaleX:sign*baseSign*(.24+.76*Math.abs(cos)),shear:Math.sin(heading)*.075};
}

export function deformVertex(type,x,y,phase){
  const rig=UNIT_RIGS[type];let dx=0,dy=0;
  for(const part of rig.legs){
    const influence=Math.exp(-Math.pow((x-part.x)/part.width,2)*1.7)*smooth((y-part.hip)/(.96-part.hip));
    const stride=rig.kind==='mounted'?.057:.046,step=phase+part.phase;
    dx+=Math.sin(step)*stride*influence;dy-=Math.max(0,Math.cos(step))*(rig.kind==='mounted'?.047:.035)*influence;
  }
  if(rig.kind==='mounted'){const headX=rig.baseSign<0?1-x:x,neck=smooth((headX-.52)/.34)*(1-smooth((y-.34)/.32));dx+=Math.sin(phase)*.009*neck*rig.baseSign;dy+=Math.cos(phase)*.007*neck;}
  if(rig.kind==='sail'||rig.kind==='oared')dx+=Math.sin(phase)*.009*(1-smooth((y-.15)/.55));
  if(rig.kind==='oared'){const oars=smooth((x-.3)/.35)*smooth((y-.69)/.2);dx+=Math.cos(phase)*.009*oars;dy+=Math.sin(phase)*.016*oars;}
  return {x:x+dx,y:y+dy};
}

const archers=new Set(['archer','crossbow','slinger']);
const firearms=new Set(['musket','rifleman']);
export function actionVertex(type,x,y,phase,action){
  if(action==='move')return deformVertex(type,x,y,phase);
  const rig=UNIT_RIGS[type],upper=1-smooth((y-.48)/.23),head=Math.exp(-(((y-.29)/.20)**2));
  let dx=0,dy=0;
  if(action==='idle'){
    dy=Math.sin(phase)*.007*upper;dx=Math.sin(phase*.5)*.004*head;
    if(rig.kind==='mounted'){const front=rig.baseSign<0?1-x:x,neck=smooth((front-.52)/.34)*(1-smooth((y-.34)/.32));dy+=Math.sin(phase)*.014*neck;dx+=Math.cos(phase)*.012*neck*rig.baseSign;}
    if(rig.kind==='tracked'){dx=Math.sin(phase)*.014*Math.exp(-(((y-.43)/.15)**2));dy=0;}
    if(['sail','oared','steam'].includes(rig.kind)){dx=Math.sin(phase)*.008*upper;dy=0;}
  }else {
    const f=phase/TAU,pulse=Math.sin(Math.PI*f),draw=f<.34?smooth(f/.34):1-smooth((f-.34)/.38);
    if(archers.has(type)){dx=-rig.baseSign*.055*draw*upper;dy=-.025*draw*upper;}
    else if(firearms.has(type)||['tracked','wheeled','steam','sail'].includes(rig.kind)){const recoil=f<.32?0:Math.sin(clamp((f-.32)/.38)*Math.PI);dx=-rig.baseSign*.040*recoil*upper;dy=-.012*recoil*upper;}
    else {dx=rig.baseSign*.055*pulse*upper;dy=-.055*pulse*upper;}
  }
  return {x:x+dx,y:y+dy};
}

function polygon(c,points,fill,stroke='#263d3f'){
  c.beginPath();points.forEach(([x,y],i)=>(i?c.lineTo:c.moveTo).call(c,x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
}
// Original canvas artwork: a shallow wooden troop boat and a steel cargo transport.
// The carried unit remains visible on deck; these vessels are visual states, not units.
function transportArt(c,source,kind,phase,action){
  const cargo=kind==='cargo',wave=Math.sin(phase);
  if(cargo)polygon(c,[[12,76],[99,54],[119,75],[34,97]],'#99957c');
  else {c.beginPath();c.moveTo(12,76);c.quadraticCurveTo(20,59,99,54);c.quadraticCurveTo(117,57,121,74);c.quadraticCurveTo(112,91,34,99);c.quadraticCurveTo(13,95,12,76);c.fillStyle='#b7a071';c.fill();c.strokeStyle='#514535';c.stroke();}
  for(let i=0;i<8;i++){c.strokeStyle=cargo?'#6e796c':'#816b4c';c.beginPath();c.moveTo(22+i*9,75-i*2.2);c.lineTo(39+i*9,91-i*2.2);c.stroke();}
  if(cargo){
    polygon(c,[[16,68],[16,33],[35,28],[41,60]],'#b6bab0');polygon(c,[[35,28],[45,35],[45,65],[35,72]],'#798c8b');
    polygon(c,[[16,33],[35,28],[45,35],[25,40]],'#c9c7b5');c.fillStyle='#293f49';c.fillRect(20,43,7,6);c.fillRect(29,40,5,6);
    c.fillStyle='#485456';c.fillRect(29,19,7,13);c.fillStyle='#aa7456';c.fillRect(29,18,7,3);
    c.drawImage(source,42,0,72,72);
  }else c.drawImage(source,28,-1,76,76);
  if(cargo){polygon(c,[[12,76],[34,97],[119,75],[107,95],[40,111],[18,95]],'#465e63');polygon(c,[[12,76],[34,97],[40,111],[18,95]],'#344c54');}
  else {c.beginPath();c.moveTo(12,76);c.quadraticCurveTo(15,96,34,99);c.quadraticCurveTo(100,92,121,74);c.quadraticCurveTo(113,100,40,111);c.quadraticCurveTo(17,111,12,76);c.fillStyle='#735942';c.fill();c.strokeStyle='#514535';c.stroke();}
  c.strokeStyle=cargo?'#b6c5bd':'#dfc28a';c.lineWidth=2;c.beginPath();c.moveTo(13,77);if(cargo){c.lineTo(34,97);c.lineTo(117,76);}else{c.quadraticCurveTo(15,94,34,99);c.quadraticCurveTo(107,88,120,75);}c.stroke();
  for(let i=0;i<5;i++){c.strokeStyle=cargo?'#617478':'#9c8056';c.lineWidth=1;c.beginPath();c.moveTo(39,100+i*1.7);c.lineTo(106,83+i*1.7);c.stroke();}
  if(!cargo){for(let i=0;i<3;i++){const swing=action==='move'?wave*7:0,x=45+i*19,y=98-i*5;c.strokeStyle='#b3a583';c.lineWidth=2;c.beginPath();c.moveTo(x,y-4);c.lineTo(x-10+swing,y+10);c.stroke();polygon(c,[[x-13+swing,y+7],[x-6+swing,y+9],[x-12+swing,y+16],[x-17+swing,y+13]],'#998965',null);}}
  else smoke(c,{x:32/128,y:19/128},phase,action==='move'?1:.45);
}
function smoke(c,funnel,phase,strength=1){
  const n=128;
  for(let i=0;i<5;i++){const f=(phase/TAU+i/5)%1;c.globalAlpha=(1-f)*.34*strength;c.fillStyle=i%2?'#b1b9b5':'#5f6b6a';c.beginPath();c.ellipse((funnel.x-f*.065)*n,(funnel.y-f*.20)*n,(.019+f*.040)*n,(.020+f*.030)*n,-.3,0,TAU);c.fill();}c.globalAlpha=1;
}

function texturedTriangle(ctx,image,src,dst){
  const [a,b,c]=src,[p,q,r]=dst,det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
  const m11=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,m21=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/det;
  const m12=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/det,m22=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/det;
  const cx=(p.x+q.x+r.x)/3,cy=(p.y+q.y+r.y)/3;
  ctx.save();ctx.beginPath();for(let i=0;i<3;i++){const v=dst[i],x=cx+(v.x-cx)*1.045,y=cy+(v.y-cy)*1.045;(i?ctx.lineTo:ctx.moveTo).call(ctx,x,y);}ctx.closePath();ctx.clip();
  ctx.transform(m11,m21,m12,m22,p.x-m11*a.x-m12*a.y,p.y-m21*a.x-m22*a.y);ctx.drawImage(image,0,0);ctx.restore();
}

export class UnitSpriteLibrary{
  constructor(animate=true){this.animate=animate;this.sources=new Map();this.frames=new Map();this.frameCount=16;this.resolution=128;this.warmQueue=[];this.painted=new PaintedUnitAtlas();this.transports=new PaintedTransportAtlas();this.onGreatPersonReady=()=>{for(const key of this.frames.keys())if(key.startsWith('great_'))this.frames.delete(key);this.onReady?.();};}
  register(atlas,types,columns,rows){
    const sw=atlas.width/columns,sh=atlas.height/rows;
    types.forEach((type,i)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=this.resolution;canvas.getContext('2d',{willReadFrequently:true}).drawImage(atlas,i%columns*sw,Math.floor(i/columns)*sh,sw,sh,0,0,this.resolution,this.resolution);this.sources.set(type,canvas);});
    // Fallback artwork is sampled only if an on-screen unit needs it.
    // Eagerly deforming every fallback duplicates the painted atlas work and
    // creates hundreds of temporary canvases during loading.
  }
  warm(){
    if(this.warming||!this.warmQueue.length)return;this.warming=true;
    const schedule=globalThis.requestIdleCallback?fn=>requestIdleCallback(fn,{timeout:1000}):fn=>setTimeout(fn,50);
    schedule(()=>{const start=performance.now();while(this.warmQueue.length&&performance.now()-start<6){const [type,index,action]=this.warmQueue.shift();this.frame(type,index,action);}this.warming=false;this.warm();});
  }
  frame(type,index=-1,action='move',transport=null,unit=null){
    const identity=unit||{type},personClass=greatPersonArtClass(identity),personMove=personClass&&action==='move'&&index>=0&&!transport?greatPersonMoveSource(identity,index,this.frameCount,this.onGreatPersonReady):null,personArt=personMove?.canvas||(personClass?greatPersonSource(identity,this.onGreatPersonReady):null),personSourceKey='great:'+personClass+(personMove?':move:'+personMove.pose:':idle');
    if(personArt&&!this.sources.has(personSourceKey)){const source=document.createElement('canvas');source.width=source.height=this.resolution;source.getContext('2d').drawImage(personArt,0,0,this.resolution,this.resolution);this.sources.set(personSourceKey,source);}
    if(!transport){const painted=this.painted.frame(type,index,action,this.frameCount);if(painted)return painted;}
    const paintedPortrait=transport?this.painted.frame(type,-1,'idle',this.frameCount):null;
    const preparedTransport=transport&&this.transports.ready,pose=preparedTransport?(index<0?0:Math.floor(index/4)%4):index,state=preparedTransport?(action==='move'?'move':'idle'):action;
    const key=type+':'+(personClass||'base')+(personMove?':painted-move:'+personMove.pose:'')+':'+state+':'+(transport||'land')+':'+pose+(paintedPortrait?':painted':'')+(preparedTransport?':new-hull':'');if(this.frames.has(key))return {...this.frames.get(key),index,action};
    let source=paintedPortrait?.canvas||this.sources.get(personSourceKey)||this.sources.get(type)||this.sources.get(uniqueMotionBases[type])||(personClass?this.sources.get(type==='great_admiral'?'galley':'missionary'):null);
    if(!source&&['submarine','nuclearsubmarine'].includes(type)){
      source=document.createElement('canvas');source.width=source.height=this.resolution;const ctx=source.getContext('2d');ctx.fillStyle=type==='submarine'?'#65777a':'#344c57';ctx.strokeStyle='#c6c1aa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(64,91,48,13,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillRect(49,71,18,19);ctx.fillRect(55,60,3,12);this.sources.set(type,source);
    }
    if(!source&&['fighter','jetfighter','stealthfighter','stealthbomber','antiair','sam'].includes(type)){
      source=document.createElement('canvas');source.width=source.height=this.resolution;const ctx=source.getContext('2d');ctx.translate(64,64);ctx.strokeStyle='#d7ceb4';ctx.lineWidth=2;ctx.fillStyle=type.startsWith('stealth')?'#3b454c':'#748984';
      const plane=UNIT_RIGS[type].kind==='aircraft';ctx.beginPath();
      const points=type==='stealthfighter'?[[45,0],[12,-9],[-12,-28],[-27,-28],[-17,-9],[-36,-8],[-45,-25],[-52,-20],[-46,20],[-45,25],[-36,8],[-17,9],[-27,28],[-12,28],[12,9]]:type==='stealthbomber'?[[50,0],[-32,-42],[-17,-7],[-32,42]]:type==='fighter'?[[46,0],[8,-7],[2,-42],[-13,-42],[-10,-6],[-38,-3],[-35,-20],[-44,-20],[-42,20],[-35,20],[-38,3],[-10,6],[-13,42],[2,42],[8,7]]:[[50,0],[2,-10],[-22,-37],[-32,-37],[-20,-7],[-40,-5],[-42,-21],[-49,-21],[-47,21],[-42,21],[-40,5],[-20,7],[-32,37],[-22,37],[2,10]];
      if(plane){for(const [i,[x,y]]of points.entries())(i?ctx.lineTo:ctx.moveTo).call(ctx,x,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#a8c1cb';ctx.fillRect(13,-4,15,8);if(type==='fighter'){ctx.strokeStyle='#c5b994';ctx.beginPath();ctx.moveTo(47,-13);ctx.lineTo(47,13);ctx.stroke();}}
      else {ctx.fillRect(-38,-4,70,26);ctx.strokeRect(-38,-4,70,26);ctx.fillStyle='#333f3f';ctx.fillRect(-41,20,77,8);ctx.fillStyle='#99a49a';for(let i=0;i<(type==='sam'?4:2);i++){ctx.save();ctx.translate(-10+i*10,-2);ctx.rotate(-.6);ctx.fillRect(-4,-37,8,37);ctx.strokeRect(-4,-37,8,37);ctx.restore();}}
      this.sources.set(type,source);
    }
    if(!source)return null;
    const n=this.resolution,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const c=canvas.getContext('2d',{willReadFrequently:true});
    if(transport){if(!this.transports.draw(c,source,transport,index,action))transportArt(c,source,transport,index<0?0:index/this.frameCount*TAU,index<0?'still':action);}
    else if(index<0||personMove)c.drawImage(source,0,0);
    else {
      const phase=index/(action==='attack'?this.frameCount-1:this.frameCount)*TAU,columns=12,rows=16,points=[];
      for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){const src={x:x/columns*n,y:y/rows*n},p=actionVertex(type,x/columns,y/rows,phase,action);points.push({src,dst:{x:p.x*n,y:p.y*n}});}
      for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=points[y*(columns+1)+x],b=points[y*(columns+1)+x+1],d=points[(y+1)*(columns+1)+x],e=points[(y+1)*(columns+1)+x+1];texturedTriangle(c,source,[a.src,b.src,e.src],[a.dst,b.dst,e.dst]);texturedTriangle(c,source,[a.src,e.src,d.src],[a.dst,e.dst,d.dst]);}
      for(const [x,y,rx,ry]of action==='move'?UNIT_RIGS[type].wheels||[]:[]){
        c.save();c.translate(x*n,y*n);c.scale(rx*n,ry*n);c.beginPath();c.arc(0,0,1,0,TAU);c.clip();c.rotate(phase*2);c.drawImage(source,(x-rx)*n,(y-ry)*n,rx*n*2,ry*n*2,-1,-1,2,2);c.restore();
      }
      if(UNIT_RIGS[type].kind==='tracked'&&action==='move'){
        c.save();c.globalCompositeOperation='source-atop';c.strokeStyle='#b6ad80aa';c.lineWidth=1.1;
        for(let i=0;i<12;i++){const f=((i/12+index/this.frameCount*.22)%1),x=(.45+f*.47)*n,y=(.89-f*.20)*n;c.beginPath();c.moveTo(x-2,y-1);c.lineTo(x+1,y+2);c.stroke();}c.restore();
      }
      if(UNIT_RIGS[type].kind==='steam'){c.save();smoke(c,type==='battleship'?{x:.34,y:.37}:{x:.53,y:.42},phase,action==='idle'?.45:1);c.restore();}
      if(type==='tank'){c.save();smoke(c,{x:.85,y:.59},phase,action==='move'?.3:.10);c.restore();}
      if(action==='attack'&&type==='archer'){
        const f=index/(this.frameCount-1),draw=f<.34?smooth(f/.34):1-smooth((f-.34)/.38);
        c.strokeStyle='#e7d4a5aa';c.lineWidth=.8;for(const x of [.40,.85]){c.beginPath();c.moveTo(x*n,.29*n);c.lineTo((x-.035-.045*draw)*n,.44*n);c.lineTo(x*n,.58*n);c.stroke();}
      }
    }
    const rgba=c.getImageData(0,0,n,n).data,alpha=new Uint8Array(n*n);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
    const result={canvas,alpha,resolution:n,index,action,transport,...(personArt&&!transport?{asset:"great-people/"+personClass+(personMove?"-move":"")+".webp",...(personMove?{painted:true,paintedIndex:personMove.pose}:{}),greatPersonClass:personClass,baseSign:1,baseline:.88,size:44}:{}),...(!transport&&uniqueMotionBases[type]?{baseSign:UNIT_RIGS[uniqueMotionBases[type]].baseSign}:{}),...(transport&&this.transports.ready?{painted:true,baseSign:1,baseline:.88,asset:'transports-painted-v2.png'}:{})};this.frames.set(key,result);if(this.frames.size>256)this.frames.delete(this.frames.keys().next().value);return result;
  }
}

export function drawTravelEffects(c,p,type,pose,scale,water,vfx=null){
  if(UNIT_RIGS[type]?.kind==='aircraft'||pose.stage!=='move'||pose.weight<.05)return;
  const rig=UNIT_RIGS[type],dx=Math.cos(pose.heading),dy=Math.sin(pose.heading)*.6,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
  c.save();c.translate(p.x,p.y+3*scale);c.rotate(Math.atan2(uy,ux));c.scale(scale,scale);
  if(water){
    c.strokeStyle='#d3ece18a';c.lineWidth=1;c.globalAlpha=pose.weight*.6;
    for(const side of [-1,1]){c.beginPath();c.moveTo(-7,side*4);c.quadraticCurveTo(-22,side*9,-37,side*12);c.stroke();}
  }else {
    if(rig.kind==='mounted'&&vfx?.ready){const f=(pose.phase/TAU)%1;c.globalAlpha=pose.weight*(1-f)*.5;c.save();c.translate(-8-f*16,0);c.rotate(-Math.atan2(uy,ux));vfx.draw(c,'dust',{x:0,y:0},17+f*7,f,0,[.5,.88]);c.restore();}
    else {c.fillStyle='#c4aa774d';c.globalAlpha=pose.weight;for(let i=0;i<4;i++){const f=(pose.phase/TAU+i*.25)%1;c.beginPath();c.ellipse(-8-f*22,Math.sin(i*2.8)*5,2+f*3,1+f*2,0,0,TAU);c.fill();}}
    if(rig.kind==='tracked'){c.strokeStyle='#524c3855';c.lineWidth=1.7;for(const y of [-5,5]){c.beginPath();c.moveTo(-8,y);c.lineTo(-30,y);c.stroke();}}
  }c.restore();
}
