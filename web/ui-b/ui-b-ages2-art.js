// AGES2 art (frontend only): era bas-relief plates for the tree background and 16 dedication-card emblems.
// All inline SVG (stroke = currentColor, fill none). Strings are built ONCE at module load; nothing here runs per frame.
const f=n=>+n.toFixed(1);
const L=(x1,y1,x2,y2)=>`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
// --- engraving helpers: hatching as explicit segments (no clipPath ids, safe to repeat) ---
function hatchRect(x,y,w,h,s=4,dir=1){let d='';for(let k=-h;k<w;k+=s){const t0=Math.max(0,-k),t1=Math.min(h,w-k);if(t1<=t0)continue;
  d+=dir>0?L(x+k+t0,y+h-t0,x+k+t1,y+h-t1):L(x+w-(k+t0),y+h-t0,x+w-(k+t1),y+h-t1);}return d;}
function hatchCircle(cx,cy,r,s=4,rot=0){let d='';const c=Math.cos(rot),n=Math.sin(rot);for(let dy=-r+s/2;dy<r;dy+=s){const dx=Math.sqrt(r*r-dy*dy);
  const p=(u,v)=>[cx+u*c-v*n,cy+u*n+v*c];const [a,b]=p(-dx,dy),[e,g]=p(dx,dy);d+=L(a,b,e,g);}return d;}
function hlines(x1,x2,y0,y1,s){let d='';for(let y=y0;y<=y1;y+=s)d+=L(x1,y,x2,y);return d;}
function vlines(y1,y2,x0,x1,s){let d='';for(let x=x0;x<=x1;x+=s)d+=L(x,y1,x,y2);return d;}
const circ=(cx,cy,r)=>`M${f(cx-r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2*r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2*r)} 0`;
function ticks(cx,cy,r1,r2,n,a0=0,a1=Math.PI*2){let d='';for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n;d+=L(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1,cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);}return d;}
function gear(cx,cy,r,teeth,depth=4){let d='';const n=teeth*2;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rr=i%2?r:r+depth,b=(i+1)/n*Math.PI*2;
  d+=(i?'L':'M')+f(cx+Math.cos(a)*rr)+' '+f(cy+Math.sin(a)*rr)+'L'+f(cx+Math.cos(b)*rr)+' '+f(cy+Math.sin(b)*rr);}return d+'Z';}
const P=(d,cls='')=>`<path${cls?` class="${cls}"`:''} d="${d}"/>`;
const H=d=>P(d,'h');       // hatching (thinner, set in CSS)
const C=d=>P(d,'c');       // construction lines (dashed, set in CSS)
// museum plate frame + ground
const plate=(w=480,h=320)=>C(`M14 14H${w-14}V${h-14}H14Z`)+P(`M8 8H${w-8}V${h-8}H8Z`)+P(ticks(w/2,h/2,0,0,0))+P(`M8 30H22M8 ${h-30}H22M${w-8} 30H${w-22}M${w-8} ${h-30}H${w-22}M30 8V22M${w-30} 8V22M30 ${h-8}V${h-22}M${w-30} ${h-8}V${h-22}`);
const ground=(y,x1=34,x2=446)=>P(L(x1,y,x2,y))+H(hlines(x1+10,x2-10,y+5,y+5,6)+L(x1+30,y+10,x2-30,y+10));

// era friezes: a decorative band under the top rule of each plate
function frieze(kind){const y=22,h=14;let d='';const x0=40,x1=440;
  if(kind==='chevron')for(let x=x0;x<x1;x+=16)d+=`M${x} ${y+h}L${x+8} ${y}L${x+16} ${y+h}`;
  if(kind==='meander')for(let x=x0;x<x1;x+=20)d+=`M${x} ${y+h}V${y}H${x+14}V${y+10}H${x+6}V${y+5}`;
  if(kind==='quatrefoil')for(let x=x0+8;x<x1;x+=24)d+=circ(x,y+7,3.5)+L(x-7,y+7,x-3.5,y+7)+L(x+3.5,y+7,x+7,y+7)+L(x,y,x,y+3.5)+L(x,y+10.5,x,y+14);
  if(kind==='laurel')for(let x=x0;x<x1;x+=14)d+=`M${x} ${y+7}q5-7 10 0q-5 7-10 0`;
  if(kind==='rivet')for(let x=x0+6;x<x1;x+=18)d+=circ(x,y+7,2.5);
  if(kind==='deco')for(let x=x0;x<x1;x+=28)d+=`M${x} ${y+h}L${x+14} ${y}L${x+28} ${y+h}M${x+14} ${y+h}V${y+3}M${x+7} ${y+h}L${x+14} ${y+4}M${x+21} ${y+h}L${x+14} ${y+4}`;
  if(kind==='orbit')for(let x=x0+10;x<x1;x+=30)d+=`M${x-10} ${y+7}a10 4 0 1 0 20 0a10 4 0 1 0-20 0`+circ(x,y+7,1.5);
  if(kind==='circuit')for(let x=x0;x<x1;x+=26)d+=`M${x} ${y+12}H${x+8}V${y+3}H${x+18}V${y+12}H${x+26}`+circ(x+18,y+3,1.6);
  if(kind==='hex')for(let x=x0;x<x1;x+=18)d+=`M${x} ${y+7}l4.5-7h9l4.5 7l-4.5 7h-9z`;
  return P(`M34 ${y-3}H446M34 ${y+h+3}H446`)+P(d,'h');}
/* ===================== ERA RELIEFS (viewBox 0 0 480 320) ===================== */
const amphora=(x,y,s=1)=>{const t=(a,b)=>`${f(x+a*s)} ${f(y+b*s)}`;return P(`M${t(-9,0)}C${t(-9,8)} ${t(-30,20)} ${t(-32,48)}C${t(-34,80)} ${t(-14,104)} ${t(-6,114)}L${t(-4,124)}H${t(4,124).split(' ')[0]}L${t(6,114)}C${t(14,104)} ${t(34,80)} ${t(32,48)}C${t(30,20)} ${t(9,8)} ${t(9,0)}Z`)
  +P(`M${t(-12,-2)}H${t(12,-2).split(' ')[0]}M${t(-9,4)}C${t(-26,0)} ${t(-30,14)} ${t(-22,24)}M${t(9,4)}C${t(26,0)} ${t(30,14)} ${t(22,24)}`)
  +P(`M${t(-31,44)}C${t(-10,50)} ${t(10,50)} ${t(31,44)}M${t(-30,66)}C${t(-10,72)} ${t(10,72)} ${t(30,66)}`)+H(`M${t(-24,50)}L${t(-18,62)}M${t(-12,52)}L${t(-6,64)}M${t(0,52)}L${t(6,64)}M${t(12,52)}L${t(18,62)}`)
  +H(hatchRect(x+14*s,y+72*s,14*s,34*s,3.5));};
// distant background layer (dashed construction weight) to give each plate layered depth
const DIST=[
 'M40 252l30-40 30 40M70 212l-8 40M120 252l16-22 16 22M300 252h60v-14h-8v-10h-8v-8h-12v8h-8v10h-8v14',
 'M40 252q40-36 90-20q40-14 80 6M330 252v-30h70v30M326 222l39-16 39 16M338 252v-26M352 252v-26M366 252v-26M380 252v-26M394 252v-26',
 'M36 252v-24h14v-8h8v8h12v-14l8-10 8 10v14h12v-8h8v8h14v24M300 252v-40l8-14 8 14v40M330 252v-26h40v26M340 226l10-12 10 12',
 'M40 252v-22q20-26 40 0v22M60 204v-8M56 200h8M300 252q14-8 30-4l4-20h4v20q20-6 40 4M120 252v-16h40v16',
 'M40 252v-50h8v50M60 252v-36h8v36M80 252v-24l14-10v10l14-10v10l14-10v34M330 252v-60h8v60M350 252v-40h8v40',
 'M36 252v-60h20v60M60 252v-80h18v80M82 252v-50h16v50M330 252v-70h22v70M356 252v-46h18v46M380 252v-90l6-10 6 10v90',
 'M36 252q10-50 30-52q-6 30 6 52M80 252v-40h30v40M330 252v-60h40v60M350 192v-20',
 'M36 252v-70h14v70M54 252v-100h12v100M70 252v-60h16v60M330 252v-84h14v84M348 252v-56h20v56M60 152l0-14',
 'M40 252a50 50 0 0 1 100 0M70 202v-20M330 252a40 40 0 0 1 80 0M360 212l-10-30h20l-10 30',
];
function relief0(){ // ANCIENT: bronze axe & sickle, bow, spear, amphora, carved stele, quern — museum plate
  let s=plate()+frieze('chevron')+C(DIST[0])+ground(268);
  s+=P('M190 268V88Q190 70 240 62Q290 70 290 88V268')+P('M198 102H282M198 122H282M198 196H282')+H(hlines(204,276,108,118,3.4))+P('M210 140h60v44h-60z')+P('M222 150l8 12 8-12 8 12 8-12M222 172h36');
  s+=H(hatchRect(282,90,8,178,3.5));
  s+=amphora(108,140,1);
  s+=P('M70 40L156 262')+P('M66 30L76 54L62 50Z')+P('M150 246l12 4M148 252l12 4');
  s+=P('M332 128q22-14 34 6q-8 18-30 16q8-10-4-22z')+P('M352 136L338 262')+H('M338 132q12-4 20 6M336 140q10-2 16 6')+P('M330 252h16');                  // socketed bronze axe
  s+=P('M386 112q44 2 46 44q-6-26-40-30')+P('M390 124l-4 8L372 262')+H('M396 116q22 4 30 22M398 122q18 4 24 18');                                       // bronze sickle
  s+=P('M420 60q30 60 0 120M420 60L420 180')+P('M404 70L446 160M444 154l2 8-8-2')+H('M422 66q20 54 0 108');                                                 // bow & arrow
  s+=P('M332 262q12-20 40-20q30 0 42 20z')+H(hlines(342,404,250,258,4))+P(circ(372,232,9));
  s+=P('M44 262h46v-14h-46z')+H(hatchRect(46,250,42,10,3));
  return s;}
function relief1(){ // CLASSICAL: Ionic column, aqueduct arches, laurel, scroll, coin
  let s=plate()+frieze('meander')+C(DIST[1])+ground(268);
  for(let i=0;i<4;i++){const x=200+i*58;s+=P(`M${x} 268V170a29 29 0 0 1 58 0V268`);s+=H(vlines(160,166,x+2,x+56,4));}
  s+=P('M196 150H436M196 160H436')+H(hlines(200,432,152,158,3));
  for(let i=0;i<8;i++){const x=200+i*29;s+=P(`M${x} 150V128a14 14 0 0 1 29 0V150`);}
  s+=P('M196 120H436')+C('M196 112H436');
  s+=P('M78 268V110M114 268V110')+vlines(112,262,84,108,6).replace(/M/g,'M')+'';
  s=s.replace(/$/,'');s+=H(vlines(116,262,86,106,6));
  s+=P('M66 268h60v-8H66zM70 260h52M70 110h52v-10H70zM62 100c-10 0-12-18 2-18c10 0 10 12 2 12M130 100c10 0 12-18-2-18c-10 0-10 12-2 12M66 90h60');
  s+=P('M60 82h72l-6-8H66z');
  s+=P('M150 236c18 0 30-6 40-16M150 236c-2-16 6-26 18-30M160 218c-4-10 0-20 10-24M174 202c-2-10 4-18 12-20')+H('M152 230c6-2 10-6 12-10M164 214c4-2 8-6 8-10M178 198c4-2 6-6 6-10');
  s+=P('M356 196h70v34h-70z')+P(circ(356,213,6)+circ(426,213,6))+H(hlines(364,418,202,224,5));
  s+=P(circ(300,226,18)+circ(300,226,13))+P('M292 220c4-6 12-6 16 0c2 6-2 12-8 12');
  return s;}
function relief2(){ // MEDIEVAL: castle keep, trebuchet, heater shield & sword, banner, rose window
  let s=plate()+frieze('quatrefoil')+C(DIST[2])+ground(268)+P(circ(150,60,16)+circ(150,60,6))+P(ticks(150,60,6,16,8))+H(hatchCircle(150,60,5,2.5));
  s+=P('M180 268V120H300V268M180 120v-14h14v10h14v-10h14v10h14v-10h14v10h14v-10h14v10h14v-10h14v14')+P('M226 268v-40a14 14 0 0 1 28 0v40')+P('M204 150h14v22h-14zM262 150h14v22h-14z');
  s+=H(hatchRect(282,124,18,144,4))+H(hlines(184,280,190,262,12).replace(/M/g,'M'));
  s+=P('M240 106V54')+P('M240 56l34 8-34 10')+H('M244 60l24 6M244 66l20 4');
  s+=P('M340 268L380 150L420 268M352 230h56')+P('M380 150L330 104M380 150L438 132')+P(circ(380,150,5))+P('M432 132v26h14v-26z')+H(hatchRect(434,136,10,20,3))+P('M330 104q-8 22 6 40');
  s+=P('M58 150h70v40c0 34-20 56-35 64c-15-8-35-30-35-64z')+P('M93 150v118M58 190h70')+H(hatchRect(60,152,32,36,4))+H(hatchRect(94,192,32,44,4,-1));
  s+=P('M150 90L150 262M138 104h24M146 262h8')+P('M150 90l-3 8h6z');
  return s;}
function relief3(){ // RENAISSANCE: astrolabe, caravel, dividers, open book, globe arc
  let s=plate()+frieze('laurel')+C(DIST[3])+ground(268);
  s+=P(circ(220,150,74)+circ(220,150,64)+circ(220,150,30))+P(ticks(220,150,64,74,72))+P(ticks(220,150,58,64,24));
  s+=C('M146 150H294M220 76V224')+P('M166 116C190 136 250 136 274 116M160 168C190 190 250 190 280 168')+P('M220 150L270 98')+P('M214 70h12l-6-12z')+P(circ(220,52,6));
  s+=H(hatchCircle(220,150,26,4,.6));
  s+=P('M330 230h110l-18 28h-74z')+H(hatchRect(342,234,90,20,4))+P('M380 230V100M410 230V128M350 230V140')+P('M380 108q26 22 0 50q-26-22 0-50zM410 134q20 18 0 40q-18-18 0-40zM350 146q18 16 0 36q-16-16 0-36z')+P('M330 230q-12-14-22-14M440 230q10-20 20-22');
  s+=P('M70 100L96 240M70 100L44 240M70 100v-8')+P(circ(70,92,6))+P('M52 200q18 10 36 0');
  s+=P('M100 262q30-14 60 0q30-14 60 0v-38q-30-14-60 0q-30-14-60 0z')+P('M160 224v38')+H(hlines(108,152,236,254,5))+H(hlines(168,212,236,254,5));
  s+=C('M300 40a160 160 0 0 1 140 90');
  return s;}
function relief4(){ // INDUSTRIAL: beam engine, flywheel, meshing gears, chimney, rail
  let s=plate()+frieze('rivet')+C(DIST[4])+ground(268);
  s+=P(circ(300,170,62)+circ(300,170,8))+P(ticks(300,170,8,58,12));
  s+=P('M150 268v-80h70v80')+H(hatchRect(152,190,66,76,4))+P('M185 188V120h0M168 120h34')+P('M185 120L300 170');
  s+=P('M110 124L270 104')+P(circ(190,114,6))+P('M190 120V188');
  s+=P(gear(90,206,26,12,6)+circ(90,206,8))+P(gear(122,166,16,8,5)+circ(122,166,5));
  s+=P('M390 268V60h26v208')+H(hatchRect(392,62,22,204,5))+P('M384 60h38v-8h-38z')+C('M400 48q-20-18 0-30q20-14 4-30');
  s+=P('M40 258H440M40 264H440')+H(vlines(258,264,46,436,12));
  return s;}
function relief5(){ // MODERN: biplane, candlestick telephone, gramophone, early motor car, radio mast, light bulb
  let s=plate()+frieze('deco')+C(DIST[5])+ground(268);
  s+=P('M150 70H330M160 96H320')+P('M180 70v26M300 70v26M200 70l20 26M280 70l-20 26')+P('M220 83q20-18 60 0q-20 16-60 0z')+P('M330 83l30-12v24z')+P('M220 83h-46')+P(circ(170,83,5))+P('M166 70v26')+H(hlines(152,328,72,76,3)+hlines(162,318,98,100,3));
  s+=P('M58 268h40l-5-10H63zM78 258V170M70 170h16l-3-16H73zM72 154h12M86 196q18 0 18 18v20q0 10-10 10')+P('M92 244h12v-8H92z');
  s+=P('M118 268v-26h40v26M138 242v-18q30-8 46-34q-30 6-48 30')+H(hatchRect(120,246,36,20,4))+P(circ(138,226,4));
  s+=P('M196 262v-24h22l12-20h40l16 20h18v24')+P(circ(214,262,10)+circ(286,262,10)+circ(214,262,3)+circ(286,262,3))+P('M232 238h30M246 218v20')+H(hatchRect(200,240,108,10,4));
  s+=P('M380 268L404 120L428 268M386 230h36M392 190h24M398 150h12M388 230L420 190M420 230L388 190M394 190L414 150M414 190L394 150')+C('M380 120a24 24 0 0 1 48 0M364 120a40 40 0 0 1 80 0');
  s+=P('M340 176c-12-9-16-17-16-26a16 16 0 0 1 32 0c0 9-4 17-16 26zM334 176h12v8h-12z')+P('M336 152q4-6 8 0');
  return s;}
function relief6(){ // ATOMIC: atom, jet, radar dish, rocket, cooling tower
  let s=plate()+frieze('orbit')+C(DIST[6])+ground(268);
  s+=P(circ(240,150,8))+`<g transform="rotate(0 240 150)">${P('M168 150a72 26 0 1 0 144 0a72 26 0 1 0-144 0')}</g><g transform="rotate(60 240 150)">${P('M168 150a72 26 0 1 0 144 0a72 26 0 1 0-144 0')}</g><g transform="rotate(-60 240 150)">${P('M168 150a72 26 0 1 0 144 0a72 26 0 1 0-144 0')}</g>`+P(circ(312,150,4)+circ(204,88,4)+circ(204,212,4));
  s+=P('M320 70l90-26 10 6-88 32zM360 60l10-24h8l-6 30M346 74l20 22h8l-10-26')+H('M330 72l70-20M334 76l66-18');
  s+=P('M72 268V140l14-34 14 34v128M72 230l-14 30h14M100 230l14 30h-14M78 150h16')+H(hatchRect(88,142,10,124,4));
  s+=P('M150 268q16-70 0-120h64q-16 50 0 120z')+H(hatchRect(158,152,48,112,5))+C('M160 140q10-14 22-6q12-12 24 2');
  s+=P('M360 268v-40h40v40M380 228l-36-44q36-12 72 0zM380 228V196')+H(hatchRect(362,230,36,36,4));
  return s;}
function relief7(){ // INFORMATION: satellite, circuit traces, microchip, globe, dish
  let s=plate()+frieze('circuit')+C(DIST[7])+ground(268);
  s+=P('M200 70h40v26h-40z')+P('M120 74h70v18h-70zM250 74h70v18h-70z')+H(vlines(76,90,124,186,8)+vlines(76,90,254,316,8))+P('M220 96v16M210 112h20')+C('M150 120q70 40 140 0');
  s+=P('M190 170h100v70H190z')+H(hatchRect(196,176,88,58,5))+P(vlines(160,170,198,282,12)+vlines(240,250,198,282,12)+hlines(180,190,180,232,12)+hlines(290,300,180,232,12));
  s+=P('M60 250H140V200H170M60 230H110V180H170M300 200H360V150H420M300 216H380V240H430')+P(circ(60,250,4)+circ(60,230,4)+circ(420,150,4)+circ(430,240,4));
  s+=P(circ(90,120,40))+P('M50 120h80M90 80v80M62 92q28 28 56 0M62 148q28-28 56 0')+P('M90 80q-24 40 0 80M90 80q24 40 0 80');
  s+=P('M370 110a40 40 0 0 1 60 40zM400 130l18-24M400 130v40h-10h20');
  return s;}
function relief8(){ // FUTURE: ringed station, habitat domes, solar arrays, orbit paths
  let s=plate()+frieze('hex')+C(DIST[8])+ground(268);
  s+=P('M150 120a90 30 0 1 0 180 0a90 30 0 1 0-180 0M170 120a70 22 0 1 0 140 0a70 22 0 1 0-140 0')+P(circ(240,120,18))+P('M240 102V40M240 138V186M226 40h28')+H(hatchCircle(240,120,14,3.5,.3));
  s+=P('M60 70h70v26H60zM350 70h70v26h-70z')+H(vlines(72,94,64,126,6)+vlines(72,94,354,416,6))+P('M130 83h80M270 83h80');
  s+=P('M60 268a50 50 0 0 1 100 0M86 268a24 24 0 0 1 48 0M330 268a60 60 0 0 1 120 0')+P('M330 268q60-24 120 0M342 240q48-14 96 0');
  s+=C('M40 200q200-80 400 0M60 230q180-50 360 0');
  s+=P('M200 268v-40h80v40M210 228l30-22 30 22')+H(hatchRect(204,232,72,34,5));
  return s;}
export const ERA_RELIEFS=[relief0(),relief1(),relief2(),relief3(),relief4(),relief5(),relief6(),relief7(),relief8()].map(s=>`<g class="rl">${s}</g>`);
export const RELIEF_VIEWBOX='0 0 480 320';

/* ===================== DEDICATION CARD ART (viewBox 0 0 120 84) ===================== */
const frame=()=>C('M4 4H116V80H4Z');
// --- card-scene helpers (compact engraved scenes, 120×84) ---
const wheel=(cx,cy,r,n=8)=>circ(cx,cy,r)+circ(cx,cy,r*.22)+ticks(cx,cy,r*.22,r,n);
const bale=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}z`+L(x+w*.35,y,x+w*.35,y+h)+L(x+w*.7,y,x+w*.7,y+h);
const bookStack=(x,y,w)=>`M${x} ${y}h${w}v-4h${-w}zM${x+2} ${y-4}h${w-3}v-4h${-(w-3)}zM${x-1} ${y-8}h${w}v-4h${-w}z`;
const flask=(x,y,s=1)=>`M${f(x-3*s)} ${f(y-18*s)}h${f(6*s)}M${f(x-2*s)} ${f(y-18*s)}v${f(7*s)}L${f(x-9*s)} ${f(y)}h${f(18*s)}L${f(x+2*s)} ${f(y-11*s)}v${f(-7*s)}`;
const node=(x,y,r=2.6)=>circ(x,y,r);
const A={
 // temple front on a stepped stylobate, scaffold + ladder, squared blocks, mason's square & plumb line
 foundations:()=>P('M20 66h56M18 70h60M16 74h64M24 66V38M34 66V38M62 66V38M72 66V38M20 38h56M22 34h52L48 20z')+H(vlines(40,64,26,32,2)+vlines(40,64,36,40,2)+vlines(40,64,64,68,2)+vlines(40,64,74,74,2)+hatchRect(30,26,36,7,2.6))
  +P('M44 66V46h8v20')+P('M86 74V18M104 74V18M86 30h18M86 46h18M86 62h18M86 30l18 16M104 46L86 62')+P('M92 74V52M98 74V52M92 58h6M92 64h6M92 70h6')
  +P('M8 74v-8h12v8M10 66v-6h9v6')+H(hatchRect(8,66,12,8,2.5))+P('M108 12h6M111 12v18M109 30h4l-2 4z')+P('M6 50h10v-10'),
 // slanted lectern with open codex, quill in inkpot, candle, book stack, astrolabe on a stand
 scholastic:()=>P('M18 74l6-26h46l6 26M24 48l-2-6h50l-2 6M30 48v26M64 48v26')+P('M26 42q11-6 22 0q11-6 22 0v-14q-11-6-22 0q-11-6-22 0z')+P('M48 28v14')+H(hlines(29,45,31,39,2.6)+hlines(51,67,31,39,2.6))
  +P('M76 46h8v-6h-8zM80 40L92 18q-6 4-8 10')+H('M83 26l4 3M85 22l4 3')+P('M10 74V58h4v16M9 58h6M12 58v-4q-2-2 0-5q2 3 0 5')+P(bookStack(88,74,18))+H(hlines(89,105,66,66,4))
  +P(circ(100,32,10)+circ(100,32,6))+P(ticks(100,32,8,10,16))+P('M92 24l16 16M100 22v-4M97 18h6M100 42v8M94 54h12l-6-4z'),
 // pointed market arch behind, loaded dromedary with bales & lead rope, second beast, milestone & route
 caravan:()=>C('M8 54V20q14-14 28 0v34')+H(hatchRect(10,30,6,22,2.5)+hatchRect(28,30,6,22,2.5))+P('M14 54V26q8-8 16 0v28')
  +P('M40 58C40 50 45 47 51 47C54 38 63 38 66 47C70 47 73 49 75 50L81 37C82 34 86 33 88 35L92 37L90 40L87 39L83 54C81 58 78 60 75 60M45 61H75M40 58C40 60 42 61 45 61M75 60L74 72M70 61L69 72M49 61L47 72M54 61L55 72M40 55q-4 3-2 9')
  +P(bale(50,40,8,7)+bale(59,40,8,7))+H(hatchRect(50,40,17,7,2.4))+P('M88 38q8 6 16 10')+P('M6 72v-9h3l2-3h3l2 3h3v9')+P('M100 62h4v10h-4zM98 62h8')+C('M2 76q30-6 58 0q30-6 58 0'),
 // hilltop chapel with bell-cote, pilgrim with staff, gourd and scallop shell, lantern-lit path
 pilgrimage:()=>P('M58 40V24h26v16M54 24L71 12L88 24M66 40V32a5 5 0 0 1 10 0v8M71 12V6M68 8h6')+H(hatchRect(58,26,6,14,2.4)+hatchRect(78,26,6,14,2.4))+P(circ(71,19,2))
  +P('M40 40q30-6 60 0')+C('M14 76q22-16 44-26q12-6 26-10')+P('M26 74l4-18h8l3 18M30 56a4 4 0 1 1 8 0M34 50v-4M22 74L28 36')+P('M27 37q-3-3 0-6q3 3 0 6')+P('M40 62q4-2 6 2q-2 4-6 2z')+H('M41 62l2 4M43 62l1 4')
  +P('M96 74V54M92 54h8l-1 8h-6z')+H(hatchRect(93,55,6,6,2))+P('M6 74h28'),
 // planked caravel: castles, two masts with square + lateen sails, rigging, flag; compass rose & rolled chart
 ocean_charter:()=>P('M14 56h62l-8 14H26z')+P('M14 56l-4-8h12v8M76 56l6-10H66v10')+H(hlines(20,72,60,68,2.6))+P('M40 56V12M60 56V22M40 16h-14q4 14 0 26h14M40 16h14q-4 14 0 26H40M60 24q14 10 0 26')
  +H('M30 20v18M34 18v22M46 18v22M50 20v18')+P('M40 12l6 2-6 2')+P('M14 48L40 14L66 46L60 22')+P('M40 42L22 50M40 42l20 6')
  +P(circ(98,24,11)+'M98 10v28M84 24h28M98 13l3 11-3 11-3-11zM87 24l11-3 11 3-11 3z')+P(ticks(98,24,11,13,16))+P('M86 54h24v16H86zM86 54q-4 8 0 16M110 54q4 8 0 16')+C('M90 60h16M90 64q8-3 14 2')+C('M4 76q8-4 16 0t16 0t16 0t16 0t16 0'),
 // wooden screw press: uprights, head beam, screw, bar lever, platen & bed; type case and paper stack
 printing:()=>P('M20 74V10h8v64M60 74V10h8v64M16 10h56v8H16zM16 74h56')+H(vlines(12,72,22,26,2)+vlines(12,72,62,66,2))+P('M44 18v14M38 20l12 2M38 24l12 2M38 28l12 2M30 22h28')+P('M36 34h16v4H36zM28 50h32v6H28zM26 56h36v4H26z')+H(hatchRect(30,50,28,6,2.2))+P('M44 38v12M56 22l16-10')
  +P('M78 38h32v18H78zM78 44h32M78 50h32M86 38v18M94 38v18M102 38v18')+H('M80 40h4M88 40h4M96 46h4M104 52h4')+P('M78 74h30l-2-4H80zM80 70h26l-2-4H82zM82 66h22')+H(hlines(84,102,68,72,4))+C('M80 34q14-8 30 0'),
 // anvil on a stump, hammer & tongs, accordion bellows, bench with vise, wall cog with rivets
 workshops:()=>P('M22 50h34q-2 6-10 6v6h6l2 4H24l2-4h6v-6q-12 0-10-6zM22 50q-10 0-12-4h12')+H(hatchRect(24,51,28,5,2.2))+P('M26 66h24v8H26z')+H(hlines(28,48,69,72,3))
  +P('M50 46L68 26M64 22l8 4-3 5-8-4z')+P('M30 46L14 30M14 30l-4 2M14 30l2-4')+P('M74 74V56h40v18M72 56h44M80 56v-6h10v6M78 50h14')+H(hatchRect(76,58,36,14,3.2))
  +P('M8 74l6-14h14l-4 14zM28 60l8-6')+H('M12 68h12M14 64h12')+P(gear(96,28,10,10,3)+circ(96,28,4))+P(circ(80,14,1.2)+circ(112,14,1.2)+circ(80,42,1.2)+circ(112,42,1.2))+P('M80 14h32v28H80z'),
 // brick forge arch with glow, banded barrel on a wooden carriage, spoked wheel, shot pyramid, rammer
 gunfoundry:()=>P('M72 74V34a20 20 0 0 1 40 0v40M80 74V40a12 12 0 0 1 24 0v34')+H(hlines(73,79,40,72,4)+hlines(105,111,40,72,4)+hatchRect(82,52,20,20,3))+C('M86 60q6-10 12 0')
  +P('M10 50l50-14 4 12-50 14z')+P('M18 48v12M30 44v12M46 40v12M60 36l6-2 2 10-6 2')+H(hatchRect(18,44,26,10,2.6))+P('M14 62l34 6 6 6H16z')+H(hatchRect(18,63,30,9,2.6))
  +P(wheel(28,64,10,10))+P(circ(52,72,3.5)+circ(59,72,3.5)+circ(55.5,66,3.5))+P('M4 30l60 44M2 28l4-2')+C('M62 26q4-6 0-12'),
 // lab bench: flask, retort on stand, brass microscope; network of linked research nodes above
 research_network:()=>P('M8 66h104M12 66v10M108 66v10')+H(hlines(10,110,69,73,4))+P(flask(28,66,1.1))+H(hatchRect(20,56,16,9,2.3))
  +P('M48 66V40M44 40h8M48 46l10 4M60 56a8 8 0 1 0 0-1M66 50l18-10')+P('M84 66h16M92 66l-6-8h12M90 58l4-18 6 2-4 18zM98 38l4-4 4 4M94 50h-6')+H(hatchRect(88,42,8,14,2.2))
  +P(node(20,16)+node(46,10)+node(72,18)+node(100,12)+node(60,30))+P('M23 17l20-6M49 11l20 6M75 17l22-4M47 13l11 15M70 20l-8 8')+C('M20 19v20M100 15v10'),
 // rising tower with crane jib, factory saw-tooth roof, bunting flags, megaphone and crowd heads
 civic_mobilization:()=>P('M18 74V30h20v44M18 40h20M18 50h20M18 60h20M28 30V14M14 14h44M28 14l-14 0M28 14l20 16M48 14v10')+H(vlines(32,72,20,24,2)+'M50 26v6M46 32h6')
  +P('M44 74V52l10-8v8l10-8v8l10-8v8l10-8v30')+H(hatchRect(46,58,36,14,3))+P('M56 64h6v10h-6zM70 64h6v10h-6z')
  +P('M90 74V22M90 22h18l-4 6 4 6H90M90 40l24-6')+H(hatchRect(92,24,12,8,2.4))+P('M96 40l4 2-4 2M106 37l4 2-4 2')
  +P('M6 62l10-4v10z')+P('M4 74h112'),
 // iron-and-glass exhibition hall with ribbed barrel vault, globe on a stand, flags, steamer
 world_exchange:()=>P('M10 70V44q50-36 100 0v26M10 70h100')+P('M20 70V38M40 70V28M60 70V24M80 70V28M100 70V38')+C('M10 52h100M14 46q46-30 92 0')+H(vlines(30,68,22,98,10))
  +P('M50 70V58q10-10 20 0v12')+P(circ(60,12,7)+'M53 12h14M60 5v14M56 6q4 6 0 12M64 6q-4 6 0 12M60 19v3M55 22h10')+H(hatchCircle(60,12,6,2.6,.6))+P('M30 26V10l8 3-8 3M90 26V10l-8 3 8 3')
  +P('M2 76h22l4-6H4zM10 70v-6h6v6M12 64v-4')+C('M96 76q8-3 20 0'),
 // crossed rifle and sabre behind a shield, steel helmet, ammunition crate, small tank on the ground line
 arsenal_reform:()=>P('M16 66L84 14M84 14l6-2-2 6M20 62l-6 4 4 2 4-4')+P('M28 14l64 52M28 14q-6-2-8 2l4 4M88 62l6 6')+H('M70 26l6 6')
  +P('M40 30h30v14c0 12-8 18-15 22c-7-4-15-10-15-22z')+H(hatchRect(42,32,26,12,2.6))+P('M48 50l7-5 7 5M48 56l7-5 7 5')
  +P('M86 44q0-12 12-12t12 12h4v3H82v-3z')+H('M90 42q2-6 8-8M96 42q1-5 6-6')+P('M8 74V62h20v12zM8 66h20M18 62v12')+H(hatchRect(9,67,8,6,2))
  +P('M76 74h30l4-6H72zM80 68v-6h16v6M96 64h14')+P(circ(80,74,2)+circ(88,74,2)+circ(96,74,2)+circ(104,74,2)),
 // planet limb with clouds, truss station with solar wings, satellite, launch pad with rocket, orbits
 orbital_systems:()=>P('M4 80a70 40 0 0 1 112 0')+H(hatchRect(8,62,104,16,3.5))+C('M14 74q20-8 40-4M64 70q20-6 40 2')
  +P('M40 26h40M52 22v8M60 20v12M68 22v8M56 20h8v12h-8z')+P('M28 18h12v16H28zM80 18h12v16H80z')+H(vlines(19,33,30,38,2.4)+vlines(19,33,82,90,2.4))+P(circ(60,40,4))
  +P('M98 46h6v6h-6zM92 48h6M104 48h6M101 46v-5')+C('M6 40q54-36 108 6')+P('M14 62V40l3-6 3 6v22M12 62h10M14 54l-4 8M20 54l4 8')+C('M17 30v-6'),
 // classical portico framing glowing screens, server racks behind, bust on plinth, data threads
 digital_museums:()=>P('M14 30L60 10L106 30zM18 30h84M18 34h84M22 34v34M32 34v34M88 34v34M98 34v34M12 68h96M10 72h100')+H(hatchRect(30,16,60,11,2.8)+vlines(36,66,24,28,2)+vlines(36,66,90,94,2))
  +P('M40 40h40v22H40zM44 44h14v8H44zM62 44h14v8H62zM44 56h32')+H(hlines(45,57,46,50,2)+hlines(63,75,46,50,2))
  +P('M8 76V44h8v32M104 76V44h8v32')+H(hlines(9,15,48,72,4)+hlines(105,111,48,72,4))+P('M56 66a4 4 0 1 1 8 0v2h-8z')
  +C('M60 10V2M44 14L36 4M76 14l8-10'),
 // geodesic domes, wind turbines, solar array rows, raised maglev with pylons and pipeline
 planetary_infrastructure:()=>P('M8 66a20 20 0 0 1 40 0zM12 56h32M18 48l10 18M38 48l-10 18M28 46v20M16 56l12-10 12 10')+H('M14 62h28')
  +P('M60 66V24M60 24l-12-6M60 24l12-6M60 24v-12')+P(circ(60,24,1.5))+P('M80 66V34M80 34l-8-5M80 34l8-5M80 34v-8')
  +P('M88 66l6-10h18l-6 10zM90 62h18M96 56l-4 10M104 56l-4 10')+H(hatchRect(90,57,18,8,2.4))
  +P('M4 40h112M4 44h112M20 44v22M50 44v22M100 44v12')+H(hlines(4,116,41,43,2))+P('M4 72h112M4 76h112')+H(vlines(73,75,6,114,6)),
 // radar dish on a lattice tower, command table with gridded map & arrows, linked nodes to a satellite
 strategic_networks:()=>P('M14 34a20 20 0 0 1 30-16zM29 26l12-12M29 26l-2 6')+P('M22 74l6-40h4l6 40M24 60h12M26 48h8M24 60l10-12M36 60l-10-12')+C('M44 14a24 24 0 0 1 10 14M48 8a32 32 0 0 1 12 18')
  +P('M48 74l6-22h50l6 22zM54 52h50')+H(hatchRect(56,54,46,18,4))+P('M64 66l10-6 8 4 12-8M90 56l4 0 0 4')+P('M60 74v4M98 74v4')
  +P(node(70,20)+node(92,10)+node(108,28)+node(84,36))+P('M73 19l16-8M95 11l11 15M106 30l-19 6M72 22l10 12')+P('M88 6h8M92 2v8')+C('M108 31v20'),
};
export const AGE_ART_KEYS=Object.keys(A);
export const AGE_ART=Object.fromEntries(Object.entries(A).map(([k,fn])=>[k,`<g class="ca">${frame()}${fn()}</g>`]));
export const AGE_ART_VIEWBOX='0 0 120 84';
