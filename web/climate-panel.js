// climate-panel.js — isolated candidate r14 (r11 base), contract game.climate v1.
// Visual r14: r11 flat Art Deco + 'thermal narrative': heat-ramp phase chevrons with icons, icon medallions + sparklines on the stat trio, heraldic civ seals,
// and three illustrated meter windows (thermometer / rain cloud / skyline drowning in rising sea). Read-only; never submits commands.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=0)=>Number.isFinite(v)?v.toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const sign=(v,d=1)=>Number.isFinite(v)?(v>0?'+':v<0?'−':'')+num(Math.abs(v),d):'—';
const pct=v=>Number.isFinite(v)?(v*100).toLocaleString('zh-CN',{maximumFractionDigits:1})+'%':'—';
const PHASES=8;const ROMAN=['I','II','III','IV','V','VI','VII','VIII'];
export const roman=p=>Number.isInteger(p)&&p>=0&&p<PHASES?ROMAN[p]:'—';
// Low-saturation mineral pigments: ochre gold, celadon, Roman red, amethyst, Aegean blue, …  (fallback only)
const MINERAL=['#b8893a','#7c9f8a','#8e3b2e','#6d4c7d','#3f6d93','#a0673a','#4f7a72','#7a5a3a','#5a6a8f','#9a7d4a','#6a3a4a','#5f7f5a'];
const safeColor=c=>typeof c==='string'&&/^(#[0-9a-f]{3,8}|rgb\([\d\s.,%]+\)|hsl\([\d\s.,%deg]+\))$/i.test(c.trim())?c.trim():null;
export const softMax=(v,min)=>{const t=Math.max(min,Math.abs(v||0)*1.5),p=10**Math.floor(Math.log10(t)),n=[1,2,2.5,5,10].find(k=>k*p>=t);return n*p;};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const F=n=>n.toFixed(2);
const pol=(c,r,t)=>[c+r*Math.cos(t),c+r*Math.sin(t)];

/* ---------- icons (24 viewBox native stroke glyphs) + heat ramp ---------- */
const IC={
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>',
 cloud:'<path d="M7.5 18.5h9.8a3.9 3.9 0 0 0 .5-7.8 5.6 5.6 0 0 0-10.9 1.3 3.3 3.3 0 0 0 .6 6.5Z"/>',
 factory:'<path d="M3 20.5V12l5.5 3.2V12l5.5 3.2V6.5h4.5v14Z"/><path d="M15.5 3.5c1.3-1 2.4.3 3.7-.5"/>',
 hourglass:'<path d="M6.5 3h11M6.5 21h11M8 3v3.5L12 12l-4 5.5V21M16 3v3.5L12 12l4 5.5V21"/>',
 leaf:'<path d="M5 19C4.5 10 10 4.5 19.5 4.5 20 14 14.5 19.5 5 19Z"/><path d="M5 19c3-5 6.5-8.5 10-10.5"/>',
 sun:'<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
 drop:'<path d="M12 3c3.6 4.6 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.4-6.4 6-11Z"/>',
 heat:'<path d="M6.5 20c-1.5-2-1.5-4 0-6s1.5-4 0-6M12 20c-1.5-2-1.5-4 0-6s1.5-4 0-6M17.5 20c-1.5-2-1.5-4 0-6s1.5-4 0-6"/>',
 storm:'<path d="M7 15.5a3.8 3.8 0 0 1-.4-7.5A5.5 5.5 0 0 1 17 9a3.4 3.4 0 0 1 .5 6.5"/><path d="M12.5 11l-2.5 4.5h3.5L11.5 20"/>',
 flame:'<path d="M12 3c.8 3.8 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-2 1-3.5 2.2-4.5.1 1.8.9 2.8 1.8 3C10 9.5 10.5 6 12 3Z"/>',
 skull:'<path d="M5.5 12a6.5 6.5 0 0 1 13 0v3l-2 1.2V19h-9v-2.8l-2-1.2Z"/><circle cx="9.5" cy="12" r="1.2"/><circle cx="14.5" cy="12" r="1.2"/><path d="M12 14.5V16"/>',
 wave:'<path d="M3 9.5c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0M3 15c2-1.8 4-1.8 6 0s4 1.8 6 0 4-1.8 6 0"/>',
 tree:'<path d="M12 2.5 7 10h3l-4 6h12l-4-6h3Z"/><path d="M12 16v5"/>',
 trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
 flag:'<path d="M6 21V3.5M6 4.5h11l-2.5 3.5 2.5 3.5H6"/>'
};
const ico=(n,cls='clp-ic')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${IC[n]}</svg>`;
const PH_ICONS=['leaf','sun','drop','heat','storm','flame','wave','skull'];
const HEAT=['#3f8a7e','#b88a2c','#c0592a','#8f1f27'];
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const heatAt=f=>{f=Math.max(0,Math.min(1,f||0))*3;const i=Math.min(2,Math.floor(f)),t=f-i,a=hx(HEAT[i]),b=hx(HEAT[i+1]);return '#'+a.map((v,k)=>Math.round(v+(b[k]-v)*t).toString(16).padStart(2,'0')).join('');};
// history entries: a number (= emissionsPerTurn) or an object with co2 / emissionsPerTurn / totalEmissions
const hv=(e,k)=>typeof e==='number'?(k==='emissionsPerTurn'?e:NaN):e?.[k];
const series=(c,k)=>{const h=Array.isArray(c?.history)?c.history:[],v=h.map(e=>hv(e,k)).filter(Number.isFinite).slice(-24),cur=c?.[k];if(Number.isFinite(cur)&&(!v.length||v[v.length-1]!==cur))v.push(cur);return v;};
const prevEP=c=>{const h=Array.isArray(c?.history)?c.history:[];return h.length>1?hv(h[h.length-2],'emissionsPerTurn'):NaN;};
const spark=v=>{if(v.length<3)return '';const mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1,W=120,H=26,l=v.map((y,i)=>(i?'L':'M')+F(i*W/(v.length-1))+' '+F(H-3-(y-mn)/r*(H-8))).join('');
 return `<svg class="clp-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${l}L${W} ${H}L0 ${H}Z"/><path class="l" d="${l}"/></svg>`;};

export function climateState(snap){
 const c=snap?.climate;
 if(c==null)return {ok:false,reason:'missing'};
 if(c.enabled===false)return {ok:false,reason:'disabled'};
 if(c.version!==1)return {ok:false,reason:'version'};
 return {ok:true,c};
}
const UNAVAIL={missing:'气候数据不可用',disabled:'本局未启用气候',version:'气候数据版本不兼容'};

/* ---------- shared SVG ornaments ---------- */
const DECO_CORNER='<svg class="clp-corner" viewBox="0 0 40 40" aria-hidden="true"><path d="M.5 22V.5H22"/><path d="M4.5 14V4.5H14"/><path d="M4.5 4.5l6 6"/><path d="M8 .5v4M.5 8h4"/></svg>';
const corners=()=>['tl','tr','bl','br'].map(k=>`<span class="clp-c clp-c-${k}">${DECO_CORNER}</span>`).join('');
const card=(cls,inner,label)=>`<section class="clp-card clp-plate ${cls}"${label?` aria-label="${esc(label)}"`:''}>${corners()}${inner}</section>`;
function roseSVG(r,cls,spikes=16){let o=`<g class="${cls}">`;
 for(let i=0;i<spikes;i++){const a=i*2*Math.PI/spikes-Math.PI/2,L=i%4?(i%2?.45:.68):1,w=i%4?.07:.12;const [x,y]=pol(0,r*L,a),[lx,ly]=pol(0,r*w,a-Math.PI/2),[rx,ry]=pol(0,r*w,a+Math.PI/2);
  o+=`<path class="rl" d="M${F(x)} ${F(y)}L${F(lx)} ${F(ly)}L0 0Z"/><path class="rd" d="M${F(x)} ${F(y)}L${F(rx)} ${F(ry)}L0 0Z"/>`;}
 return o+'</g>';}

/* ---------- background ---------- */
const PHI=1.618;
const BG=(()=>{let s=`<svg class="clp-deco" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>
<radialGradient id="clp-glow" cx="30%" cy="34%" r="45%"><stop offset="0" stop-color="#e8c77a" stop-opacity=".22"/><stop offset=".5" stop-color="#c5a059" stop-opacity=".07"/><stop offset="1" stop-color="#c5a059" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="1000" fill="url(#clp-glow)"/><g class="clp-d-guides" transform="translate(470 330)">`;
 let r=40;for(let i=0;i<7;i++){s+=`<circle r="${F(r)}"/>`;r*=PHI;}
 for(let i=0;i<24;i++){const [x,y]=pol(0,1400,i*Math.PI/12);s+=`<line x1="0" y1="0" x2="${F(x)}" y2="${F(y)}"/>`;}
 // golden spiral (quarter arcs)
 let a=34,x=0,y=0,d='M0 0',dirs=[[1,1],[ -1,1],[-1,-1],[1,-1]];
 for(let i=0;i<9;i++){const [dx,dy]=dirs[i%4];x+=dx*a;y+=dy*a;d+=`A${F(a)} ${F(a)} 0 0 1 ${F(x)} ${F(y)}`;a*=PHI;}
 s+=`<path class="sp" d="${d}"/></g><g class="clp-d-current">`;
 for(let i=0;i<9;i++){const b=520+i*58;s+=`<path d="M-40 ${b}C200 ${b-60-i*6} 380 ${b+50} 640 ${b-10}S1060 ${b-90+i*4} 1300 ${b-30}S1560 ${b+30} 1660 ${b-20}"/>`;}
 s+=`</g><g class="clp-d-zodiac" transform="translate(470 330)">`;
 for(const r of [380,410,560]){s+=`<circle r="${r}"/>`;}
 for(let i=0;i<12;i++){const t=i*Math.PI/6,[x1,y1]=pol(0,380,t),[x2,y2]=pol(0,410,t),[mx,my]=pol(0,395,t+Math.PI/12);s+=`<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}"/><circle class="zm" cx="${F(mx)}" cy="${F(my)}" r="4"/>`;}
 s+=`</g><g class="clp-d-tracks" transform="translate(1250 -120)">`;
 for(let i=0;i<10;i++){const r=180+i*46,a0=.35+i*.03,a1=a0+.9;const [x0,y0]=pol(0,r,a0+Math.PI/2),[x1,y1]=pol(0,r,a1+Math.PI/2);s+=`<path d="M${F(x0)} ${F(y0)}A${r} ${r} 0 0 1 ${F(x1)} ${F(y1)}"/>`;}
 s+=`</g><g class="clp-d-contour" transform="translate(1180 760)">`;
 for(let k=0;k<6;k++){let d='';for(let j=0;j<=36;j++){const t=j*Math.PI/18,r=(60+k*34)*(1+.18*Math.sin(3*t+k*.7)+.08*Math.cos(5*t));const [x,y]=pol(0,r,t);d+=(j?'L':'M')+F(x*1.5)+' '+F(y);}s+=`<path d="${d}Z"/>`;}
 s+=`</g><g class="clp-d-meridian"><line x1="40" y1="330" x2="1560" y2="330"/><line x1="40" y1="336" x2="1560" y2="336" class="th"/><text x="20" y="340">W</text><text x="1570" y="340">E</text><path d="M800 318l12 15-12 15-12-15Z"/><line x1="470" y1="20" x2="470" y2="980" class="th"/></g><g class="clp-d-stars">`;
 for(let i=0;i<70;i++){const px=(i*389)%1600,py=(i*211)%480,rr=(i%5===0)?1.6:.8;s+=`<circle cx="${px}" cy="${py}" r="${rr}"/>`;}
 return s+`</g></svg>`;})();

/* ---------- astrolabe ---------- */
const abbr=n=>[...String(n??'')].slice(0,2).join('');
const plaque=(x,y,name,p)=>`<g class="clp-badge" transform="translate(${F(x)} ${F(y)})"><rect x="-34" y="-21" width="68" height="40" rx="2"/><text class="ab" text-anchor="middle" y="-4">${esc(abbr(name))}</text><text text-anchor="middle" y="13">${p}</text></g>`;
function astrolabe(c){
 const list=(c.contributors||[]).filter(o=>Number.isFinite(o?.total));
 const sum=list.reduce((a,o)=>a+Math.max(0,o.total),0),own=c.own?.player;
 const ep=c.emissionsPerTurn,pv=prevEP(c),dl=Number.isFinite(ep)&&Number.isFinite(pv)&&ep!==pv?`<em class="clp-dlt ${ep>pv?'up':'dn'}" title="较上回合">${ep>pv?'▲':'▼'} ${num(Math.abs(ep-pv))}</em>`:'';
 const totals=`<div class="clp-totals">${cell('cloud','CO₂ 总量',num(c.co2),'指数','',spark(series(c,'co2')))}<i></i>${cell('factory','每回合排放',num(ep),'指数',dl,spark(series(c,'emissionsPerTurn')))}<i></i>${cell('hourglass','累计排放',num(c.totalEmissions),'指数','',spark(series(c,'totalEmissions')))}</div>`;
 if(!list.length)return `<section class="clp-astro-panel clp-card">${corners()}<div class="clp-pie-wrap"><div class="clp-pie-empty" role="status">暂无排放数据</div></div>${totals}</section>`+archive([],0,c);
 const C=360,R1=300,R0=128;
 let a=-Math.PI/2;
 // thermal bezel inside the hub: 72 ticks lit up to the same fraction the temperature ruler uses
 const tmx=Number.isFinite(c.temperatureRise)?3:null,tf=tmx?Math.max(0,Math.min(1,c.temperatureRise/tmx)):null;
 let bz='';if(tf!==null)for(let i=0;i<72;i++){const t=-Math.PI/2+i*2*Math.PI/72,[x1,y1]=pol(C,97,t),[x2,y2]=pol(C,i%6?105:110,t),on=(i+.5)/72<=tf;bz+=`<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}"${on?` class="on" style="stroke:${heatAt(i/72)}"`:''}/>`;}
 const slices=list.map((o,i)=>{const share=sum>0?Math.max(0,o.total)/sum:null,col=safeColor(o.color)||MINERAL[i%MINERAL.length];
  const label=`${o.name}：当前 ${num(o.current)} 指数，累计 ${num(o.total)} 指数，占比 ${pct(share)}`;
  const data=`data-name="${esc(o.name)}" data-cur="${esc(num(o.current))}" data-tot="${esc(num(o.total))}" data-pct="${esc(pct(share))}" data-col="${esc(col)}"`;
  let shape='',badge='',div='';
  if(share>=0.9999){shape=`<circle class="ann" cx="${C}" cy="${C}" r="${(R0+R1)/2}" stroke-width="${R1-R0}"/>`;badge=plaque(C,C-(R0+R1)/2,o.name,'100%');}
  else if(share>0){const b=a+share*2*Math.PI,l=share>.5?1:0,[x0,y0]=pol(C,R1,a),[x1,y1]=pol(C,R1,b),[x2,y2]=pol(C,R0,b),[x3,y3]=pol(C,R0,a);
   shape=`<path d="M${F(x0)} ${F(y0)}A${R1} ${R1} 0 ${l} 1 ${F(x1)} ${F(y1)}L${F(x2)} ${F(y2)}A${R0} ${R0} 0 ${l} 0 ${F(x3)} ${F(y3)}Z"/>`;
   const m=(a+b)/2;
   if(share>=.05){const [bx,by]=pol(C,(R0+R1)/2+10,m);badge=plaque(bx,by,o.name,pct(share));}
   else{const [lx,ly]=pol(C,R1-6,m),[ex,ey]=pol(C,R1+64,m),right=Math.cos(m)>=0,hx=ex+(right?36:-36);badge=`<g class="clp-leader"><path d="M${F(lx)} ${F(ly)}L${F(ex)} ${F(ey)}H${F(hx)}"/><circle cx="${F(lx)}" cy="${F(ly)}" r="2"/><text x="${F(hx+(right?6:-6))}" y="${F(ey+5)}" text-anchor="${right?'start':'end'}">${esc(abbr(o.name))} ${pct(share)}</text></g>`;}
   const [px,py]=pol(C,R1,a),[qx,qy]=pol(C,R0,a);div=`<path class="clp-divider" d="M${F(qx)} ${F(qy)}L${F(px)} ${F(py)}"/>`;a=b;}
  return {o,share,col,label,data,shape,badge,div,isOwn:own!=null&&o.player===own};});
 let ticks='';for(let i=0;i<360;i++){const t=i*Math.PI/180-Math.PI/2,L=i%30===0?18:i%10===0?11:i%5===0?7:4,[x1,y1]=pol(C,350,t),[x2,y2]=pol(C,350-L,t);ticks+=`<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}"${i%30?(i%10?'':' class="mid"'):' class="maj"'}/>`;}
 const WIND={0:'N',90:'E',180:'S',270:'W'};let nums='';
 for(let d=0;d<360;d+=30){const t=d*Math.PI/180-Math.PI/2,[x,y]=pol(C,318,t),w=WIND[d];nums+=`<text x="${F(x)}" y="${F(y)}" text-anchor="middle" dominant-baseline="central" class="${w?'wind':''}" transform="rotate(${d} ${F(x)} ${F(y)})">${w||d+'°'}</text>`;}
 for(const [d,w] of [[45,'NE'],[135,'SE'],[225,'SW'],[315,'NW']]){const t=d*Math.PI/180-Math.PI/2,[x,y]=pol(C,318,t);nums+=`<text x="${F(x)}" y="${F(y)}" text-anchor="middle" dominant-baseline="central" class="ic" transform="rotate(${d} ${F(x)} ${F(y)})">${w}</text>`;}
 let grid='';for(let r=R0+18;r<R1;r+=18)grid+=`<circle cx="${C}" cy="${C}" r="${r}"/>`;for(let i=0;i<24;i++){const t=i*Math.PI/12,[a1,b1]=pol(C,R0,t),[a2,b2]=pol(C,R1,t);grid+=`<line x1="${F(a1)}" y1="${F(b1)}" x2="${F(a2)}" y2="${F(b2)}"/>`;}
 const svg=`<svg class="clp-pie clp-astro" viewBox="-16 -16 752 752" role="group" aria-label="各文明累计排放占比（星盘）">
 <circle cx="${C}" cy="${C}" r="356" class="clp-ring-o"/><circle cx="${C}" cy="${C}" r="350" class="clp-hair"/><circle cx="${C}" cy="${C}" r="306" class="clp-hair"/>
 <g class="clp-ticks">${ticks}</g><g class="clp-numerals">${nums}</g>
 ${sum>0?'':`<circle class="clp-pie-zero" cx="${C}" cy="${C}" r="${(R0+R1)/2}" stroke-width="${R1-R0}"/>`}
 <g class="clp-sectors">${slices.filter(s=>s.shape).map(s=>`<g class="clp-slice${s.isOwn?' clp-own':''}" tabindex="0" role="img" aria-label="${esc(s.label)}" style="--c:${esc(s.col)}" ${s.data}><title>${esc(s.label)}</title>${s.shape}</g>`).join('')}</g>
 <g class="clp-armill" pointer-events="none">${grid}</g>
 <circle cx="${C}" cy="${C}" r="${R1-5}" class="clp-bevel"/><circle cx="${C}" cy="${C}" r="${R0+5}" class="clp-bevel"/>
 <circle cx="${C}" cy="${C}" r="${R1}" class="clp-hair2"/><circle cx="${C}" cy="${C}" r="${R0}" class="clp-hair2"/>
 <g class="clp-dividers" pointer-events="none">${slices.map(s=>s.div).join('')}</g>
 <circle cx="${C}" cy="${C}" r="${R0-6}" class="clp-hub"/>${Number.isFinite(c.temperatureRise)?`<circle cx="${C}" cy="${C}" r="${R0-9}" class="clp-halo" style="--hc:${heatAt(c.temperatureRise/softMax(c.temperatureRise,2))}"/>`:''}
 <g class="clp-bezel" pointer-events="none">${bz}</g>
 <g transform="translate(${C} ${C}) scale(.8)" pointer-events="none">${roseSVG(R0-14,'clp-hubrose')}<circle r="6" class="clp-hubpin"/></g>
 <g class="clp-badges" pointer-events="none">${slices.map(s=>s.badge).join('')}</g></svg>`;
 return `<section class="clp-astro-panel clp-card" aria-label="排放星盘">${corners()}<div class="clp-pie-wrap">${svg}${flanks(c,slices,sum)}<div class="clp-tip" role="status" aria-live="polite" hidden></div></div>${totals}</section>`+archive(slices,sum,c);
}
/* ---------- astrolabe flanks (only drawn when the card is wide enough; CSS container query) ---------- */
function flanks(c,slices,sum){
 let L='',R='';const di=c.disasterIntensity,own=c.own;
 if(Number.isFinite(di)&&di>=0){
  const f=Math.min(1,di/softMax(di,5)),lit=Math.round(f*10),band=f<.25?'平静':f<.5?'多发':f<.75?'频发':'肆虐',v=num(di,di%1?1:0);let bars='';
  for(let i=0;i<10;i++)bars+=`<i class="${i<lit?'on':''}" style="height:${24+i*8}%;--h:${heatAt(i/9)}"></i>`;
  L=`<aside class="clp-fl clp-fl-l" aria-label="灾害烈度 ${v}"><span class="clp-fl-ic">${ico('storm')}</span><span class="clp-k">灾害烈度</span><div class="clp-bars" aria-hidden="true">${bars}</div><b class="n">${v}</b><em class="clp-chip" style="--zc:${heatAt(f)}">${band}</em></aside>`;
 }
 const top=slices.filter(s=>s.share!=null).sort((x,y)=>y.share-x.share)[0];
 const osh=own?sharev(own.total,sum):null;
 if(osh!=null){
  const sh=Math.min(1,osh),CF=2*Math.PI*34,oc=slices.find(s=>s.isOwn)?.col||'#c2a661';
  R=`<aside class="clp-fl clp-fl-r" aria-label="本国占比 ${pct(sh)}"><span class="clp-fl-ic">${ico('flag')}</span><span class="clp-k">本国占比</span><svg class="clp-ring" style="--oc:${esc(oc)}" viewBox="-44 -44 88 88" aria-hidden="true"><circle r="34" class="tr"/><circle r="34" class="ar" stroke-dasharray="${F(sh*CF)} ${F(CF)}" transform="rotate(-90)"/><circle r="27" class="in"/><text class="n" text-anchor="middle" dominant-baseline="central">${pct(sh)}</text></svg>${Number.isFinite(own.captured)?`<em class="clp-chip" style="--zc:#7fc4b4">${ico('leaf')}已捕获 ${num(own.captured)}</em>`:''}</aside>`;
 } else if(top){
  R=`<aside class="clp-fl clp-fl-r" aria-label="排放领跑 ${esc(top.o.name)} ${pct(top.share)}"><span class="clp-fl-ic">${ico('flag')}</span><span class="clp-k">排放领跑</span><span class="clp-seal clp-seal-l" style="--c:${esc(top.col)}"><b>${esc([...String(top.o.name??'')][0]||'?')}</b></span><b class="n clp-fl-nm">${esc(top.o.name)}</b><em class="clp-chip" style="--zc:${esc(top.col)}">${pct(top.share)}</em></aside>`;
 }
 return L+R;
}
/* ---------- archive: heraldic civ seals, share bars, ledger with icons ---------- */
const WM=(()=>{let t='';for(let i=0;i<48;i++){const a=i*Math.PI/24,[x1,y1]=pol(100,94,a),[x2,y2]=pol(100,i%4?89:83,a);t+=`<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}"/>`;}
 return `<svg class="clp-wm" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="76" stroke-dasharray="3 5"/><circle cx="100" cy="100" r="52"/>${t}<path d="M100 14l7 79 79 7-79 7-7 79-7-79-79-7 79-7Z"/><circle cx="100" cy="100" r="5"/></svg>`;})();
function archive(slices,sum,c){
 const rows=slices.slice().sort((x,y)=>(y.share??0)-(x.share??0));
 const li=(s,i)=>`<li ${s.data} tabindex="0" aria-label="${esc(s.label)}" class="clp-row${s.isOwn?' clp-own-row':''}" style="--c:${esc(s.col)}"><span class="clp-rank n">${i+1}</span><span class="clp-seal"><b>${esc([...String(s.o.name??'')][0]||'?')}</b></span><span class="clp-rn"><span class="clp-civ-n">${esc(s.o.name)}${s.isOwn?'<em class="clp-me">本国</em>':''}</span><i class="clp-mb"><u style="width:${((s.share??0)*100).toFixed(1)}%"></u></i></span><span class="n clp-lt">${num(s.o.total)}</span><b class="n">${pct(s.share)}</b></li>`;
 return card('clp-archive clp-legend-wrap',`<header class="clp-scroll-h"><span class="clp-hico">${ico('globe')}</span><h3>各文明排放档案</h3><span class="clp-k">累计</span><b class="n">${num(sum)}</b><small>指数</small></header>
 <div class="clp-lbox">${WM}<ol class="clp-legend">${rows.map(li).join('')}</ol></div>
 ${ledger(c)}`,'各文明累计排放档案');
}
const sharev=(part,tot)=>Number.isFinite(part)&&Number.isFinite(tot)&&tot>0?part/tot:null;
function ledger(c){
 // Binds only to snapshot fields when present (c.sources.{coal,deforestation}); otherwise an explicit placeholder, never a number.
 const src=c?.sources||{},tot=c?.totalEmissions;
 const coal=sharev(src.coal,tot),forest=sharev(src.deforestation,tot);
 const pv=prevEP(c),ep=c?.emissionsPerTurn;
 const trend=Number.isFinite(ep)?(Number.isFinite(pv)?sign(ep-pv,0)+' 较上回合':'+'+num(ep)+' / 回合'):null;
 const epShare=sharev(ep,tot);
 const row=(icn,t,sub,frac,v,note)=>`<div class="clp-ls"><span class="clp-lico">${ico(icn)}</span><div class="clp-ls-t"><span class="clp-ins">${t}</span><small>${sub}</small></div><div class="clp-lb"><div class="clp-bar${frac!=null?'':' clp-empty'}" aria-hidden="true">${frac!=null?`<i style="width:${(Math.min(1,frac)*100).toFixed(1)}%"></i>`:''}</div>${v?'':`<em class="clp-note">${note}</em>`}</div><b class="n${v?'':' clp-ph'}">${v||'—'}</b></div>`;
 return `<div class="clp-ledger-sum"><div class="clp-dbl" aria-hidden="true"></div><h3><i></i>排放来源</h3>
 ${coal!=null?row('factory','工业燃煤','占累计排放',coal,pct(coal),''):''}${forest!=null?row('tree','森林砍伐','折算占累计',forest,pct(forest),''):''}${row('trend','本回合排放','全球 · 指数',epShare,trend,'暂无数据')}</div>`;
}
/* ---------- phase plaque: segmented heat medal + icon chevrons ---------- */
function medal(p){
 const arcs=ROMAN.map((_,i)=>{const a0=-Math.PI/2+i*Math.PI/4+.08,a1=-Math.PI/2+(i+1)*Math.PI/4-.08,[x0,y0]=pol(0,44,a0),[x1,y1]=pol(0,44,a1);
  return `<path class="${p!==null&&i<=p?'on':''}" style="--h:${heatAt(i/7)}" d="M${F(x0)} ${F(y0)}A44 44 0 0 1 ${F(x1)} ${F(y1)}"/>`;}).join('');
 return `<svg class="clp-medal" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="49.2" class="rim"/><g class="arcs">${arcs}</g><circle r="38" class="rim2"/><circle r="34.5" class="inner"/>${p!==null?`<svg class="clp-medal-ic" x="-11" y="-31" width="22" height="22" viewBox="0 0 24 24">${IC[PH_ICONS[p]]}</svg>`:''}<text class="clp-roman" text-anchor="middle" y="19">${roman(p)}</text></svg>`;
}
function phase(c){
 const p=Number.isInteger(c.phase)&&c.phase>=0&&c.phase<PHASES?c.phase:null;
 return card('clp-phase',`<div class="clp-phase-id" style="--hc:${p===null?'#735c36':heatAt(p/7)}">${medal(p)}<div><span class="clp-k">气候阶段</span><strong>${esc(c.phaseName||'—')}</strong><span class="clp-of n">${roman(p)} / VIII</span></div></div>
 <div class="clp-track" aria-hidden="true"><ol class="clp-steps">${ROMAN.map((r,i)=>`<li class="${p!==null&&i<=p?'on':''}${i===p?' cur':''}" style="--h:${heatAt(i/7)}"><span class="cs">${ico(PH_ICONS[i])}<b>${r}</b></span></li>`).join('')}</ol></div>`,`气候阶段 ${p===null?'不可用':roman(p)+' / VIII'}`);
}
/* ---------- illustrated meter windows (decorative, aria-hidden) ---------- */
const frame=()=>'<rect class="frm" x="3.5" y="3.5" width="93" height="113"/><path class="wf" d="M50 .5l3.5 3.5-3.5 3.5-3.5-3.5zM50 119.5l3.5-3.5-3.5-3.5-3.5 3.5z"/>';
const waveD=(y,amp,close=true)=>`M0 ${F(y)}q12.5 ${-amp} 25 0${'t25 0'.repeat(7)}${close?'V120H0Z':''}`;
function winTemp(f,ok){
 const yT=84-f*51,col=heatAt(f);let tk='';
 for(let i=0;i<=10;i++){const y=84-i*5.1;tk+=`<path d="M62 ${F(y)}h${i%5?4:9}"/>`;}
 return `<svg class="clp-wsvg" viewBox="0 0 100 120" aria-hidden="true" focusable="false"><defs><radialGradient id="clp-hg"><stop offset="0" stop-color="${col}" stop-opacity=".6"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient><linearGradient id="clp-merc" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8f1f27"/><stop offset="1" stop-color="${col}"/></linearGradient></defs>
 ${ok?`<circle class="clp-hglow" cx="50" cy="96" r="40" fill="url(#clp-hg)"/>`:''}<g class="tk">${tk}</g>
 <path class="tube" d="M43 83.9V33a7 7 0 0 1 14 0v50.9A14 14 0 1 1 43 83.9Z"/>
 ${ok?`<circle cx="50" cy="96" r="9.5" fill="#8f1f27"/><rect class="merc" x="46.5" y="${F(yT)}" width="7" height="${F(96-yT)}" fill="url(#clp-merc)"/><path class="ptr" d="M31 ${F(yT-3.5)}L39 ${F(yT)}L31 ${F(yT+3.5)}Z"/>`:''}${frame()}</svg>`;
}
function winRain(){
 return `<svg class="clp-wsvg" viewBox="0 0 100 120" aria-hidden="true" focusable="false">
 <path class="rain-cloud" d="M28 62a11 11 0 0 1-1.1-21.9 16 16 0 0 1 29.9-5.3 12 12 0 0 1 19.9 10.1A8.6 8.6 0 0 1 74 62Z"/>
 <path class="rain-detail" d="M31 40a10 10 0 0 1 17-4M57 42a8 8 0 0 1 11-2M24 56h47"/>
 <path class="rain-streak" d="M31 72l-4 8m20-8-4 8m20-8-4 8m20-8-4 8M35 88l-4 8m20-8-4 8m20-8-4 8"/>
 <path class="rain-detail" d="M26 104h48M37 108h26"/>${frame()}</svg>`;
}
const SKY=[[10,8,26],[19,7,40],[27,10,32],[38,8,54],[47,9,36],[57,7,46],[65,10,30],[76,8,42],[85,6,22]];
function winSea(f,ok){
 const y=100-f*62;let b='',wd='';
 for(const [x,w,h] of SKY){b+=`<rect x="${x}" y="${100-h}" width="${w}" height="${h}"/>`;for(let yy=100-h+5;yy<94;yy+=7)for(let xx=x+2;xx<x+w-1.5;xx+=3.6)wd+=`<path d="M${F(xx)} ${F(yy)}h1.4"/>`;}
 return `<svg class="clp-wsvg" viewBox="0 0 100 120" aria-hidden="true" focusable="false"><defs><clipPath id="clp-wclip"><rect x="4" y="4" width="92" height="112"/></clipPath><linearGradient id="clp-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86a8" stop-opacity=".75"/><stop offset="1" stop-color="#14304c" stop-opacity=".95"/></linearGradient></defs>
 <path class="sun" d="M70 30a8 8 0 1 0 .01 0Z"/><g class="sky">${b}</g><g class="win">${wd}</g><rect class="earth" x="4" y="100" width="92" height="16"/><path class="gnd" d="M4 100h92"/>
 ${ok&&f>0?`<g clip-path="url(#clp-wclip)"><g class="wv"><path fill="url(#clp-sea)" d="${waveD(y,2.5)}"/><path class="crest" d="${waveD(y,2.5,false)}"/></g></g>`:''}${frame()}</svg>`;
}
/* ---------- unified metric cards: illustrated window + zoned ruler ---------- */
function metric({cls,title,sub,val,valTxt,unit,max,tickCls='',tickFmt=v=>+v.toFixed(2),label,extra='',inslot='',win,zones={cuts:[],names:[],tints:['rgba(59,98,128,.14)']}}){
 const ok=Number.isFinite(val),f=ok?Math.max(0,Math.min(1,val/max)):0;
 let fine='';for(let i=0;i<=40;i++)fine+=`<span class="${i%10===0?'L':i%5===0?'M':''}" style="left:${(i*2.5).toFixed(1)}%"></span>`;
 const labs=[0,.25,.5,.75,1].map(k=>`<span class="${tickCls}" style="left:${k*100}%">${tickFmt(k*max)}</span>`).join('');
 const b=[0,...zones.cuts.map(x=>Math.min(1,x/max)),1],zi=ok?zones.cuts.filter(x=>val>=x).length:-1;
 const bg=zones.tints.map((t,i)=>`${t} ${(b[i]*100).toFixed(1)}% ${(b[i+1]*100).toFixed(1)}%`).join(',');
 const caps=zones.names.map((n,i)=>b[i+1]-b[i]>.06?`<span class="${i===zi?'on':''}" style="left:${(b[i]*100).toFixed(1)}%;width:${((b[i+1]-b[i])*100).toFixed(1)}%">${n}</span>`:'').join('');
 const mks=zones.cuts.filter(x=>x>0&&x<max).map(x=>`<b class="clp-mk" style="left:${(x/max*100).toFixed(1)}%"></b>`).join('');
 const fillSz=f>0?`;background-size:${(100/f).toFixed(1)}% 100%`:'';
 return card(`clp-metric ${cls}`,`${extra}<div class="clp-m-grid"><figure class="clp-win" aria-hidden="true">${win(f,ok)}</figure><div class="clp-m-main"><div class="clp-m-head"><div><h3>${title}</h3>${ok&&sub&&sub(val)?`<p class="clp-motto">${esc(sub(val))}</p>`:''}</div><div class="clp-m-val"><b class="n">${ok?valTxt(val):'—'}</b><small>${unit}</small></div></div>
 <div class="clp-ruler" aria-hidden="true"><div class="clp-zones">${caps}</div><div class="clp-slot" style="background:linear-gradient(90deg,${bg})"><i class="clp-fill" style="width:${(f*100).toFixed(1)}%${fillSz}">${ok?inslot:''}</i>${mks}</div>${ok?`<div class="clp-needle" style="left:${(f*100).toFixed(1)}%"></div>`:''}<div class="clp-fine">${fine}</div><div class="clp-scale">${labs}</div></div></div></div>`,label(ok));
}
const WAVE='<svg class="clp-wavewm" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">'+[0,1,2,3,4].map(k=>{let d=`M0 ${20+k*12}`;for(let x=0;x<=600;x+=20)d+=`L${x} ${F(20+k*12+Math.sin(x/38+k)*5)}`;return `<path d="${d}"/>`;}).join('')+'</svg>';
const SURF=(()=>{let d='M0 4';for(let x=0;x<=400;x+=8)d+=`L${x} ${F(4+Math.sin(x/14)*2.2)}`;return `<svg class="clp-surf" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;})();
const cell=(ic,l,v,u,extra='',sp='')=>`<div class="clp-cell"><span class="clp-cico">${ico(ic)}</span><div class="clp-ct"><span class="clp-k">${l}</span><span class="clp-cv"><b class="n">${v}</b><small>${u}</small>${extra}</span></div>${sp}</div>`;
function view(c){
 const tmax=3,smax=3;
 return `<div class="clp-top">${astrolabe(c)}</div><div class="clp-bottom">
 ${phase(c)}<div class="clp-metrics">
 ${metric({cls:'clp-temp',title:'全球升温',sub:()=>'',val:c.temperatureRise,valTxt:v=>sign(v,1),unit:'°C',max:tmax,win:winTemp,zones:{cuts:[1,2],names:['稳定','加速','危急'],tints:['rgba(63,138,126,.2)','rgba(184,138,44,.22)','rgba(143,31,39,.2)']},label:ok=>`全球升温 ${ok?sign(c.temperatureRise,1)+' °C':'不可用'}`})}
 ${metric({cls:'clp-rain',title:'降水量',sub:()=>'',val:c.rainfall,valTxt:v=>num(v),unit:'/ 100',max:100,tickFmt:v=>Math.round(v),win:winRain,zones:{cuts:[30,60.01],names:['偏旱','失衡','多雨'],tints:['rgba(184,137,58,.24)','rgba(63,138,126,.16)','rgba(44,110,122,.26)']},label:ok=>`降水 ${ok?num(c.rainfall)+' / 100':'不可用'}`})}
 ${metric({cls:'clp-sea',title:'海平面上升',sub:()=>'',val:c.seaLevel,valTxt:v=>sign(v,2),unit:'m',max:smax,tickCls:'clp-sea-tick',tickFmt:v=>v.toFixed(2)+'m',extra:WAVE,inslot:SURF,win:winSea,label:ok=>`海平面 ${ok?sign(c.seaLevel,2)+' m':'不可用'}`})}
 </div></div>`;
}

export function createClimatePanel({getSnapshot,focusTile,artBase='/assets/climate/',mount=document.body}={}){
 // focusTile accepted for API compatibility; no tiles are shown, so it is never called.
 let snap=null,opener=null;
 const dlg=document.createElement('dialog');dlg.className='clp';dlg.setAttribute('aria-labelledby','clp-title');dlg.dataset.artBase=artBase;
 dlg.innerHTML=`<div class="clp-shell">${BG}<header class="clp-head"><div class="clp-brand"><span class="clp-emb">${ico('globe')}</span><div><h2 id="clp-title">气候</h2></div></div><div class="clp-head-r"><span class="clp-turn n"><span class="clp-tu-i">${ico('hourglass')}</span><span class="t"></span></span><button type="button" class="clp-close" aria-label="关闭气候面板"><svg class="clp-g" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div></header><div class="clp-body" tabindex="-1"></div></div>`;
 mount.appendChild(dlg);
 const body=dlg.querySelector('.clp-body');
 function render(){
  const st=climateState(snap);
  dlg.querySelector('.clp-turn .t').textContent=st.ok&&Number.isFinite(st.c.turn)?`第 ${st.c.turn} 回合`:'';
  dlg.classList.toggle('clp-observer',!!st.ok&&!st.c.own);

  body.innerHTML=st.ok?view(st.c):`<div class="clp-unavail" role="status"><strong>${UNAVAIL[st.reason]}</strong></div>`;
  if(st.ok&&!reduced()){body.classList.remove('clp-in');void body.offsetWidth;body.classList.add('clp-in');}
 }
 const tip=e=>{const s=e.target.closest?.('[data-name]'),t=body.querySelector('.clp-tip');if(!t)return;
  body.querySelectorAll('.clp-hot').forEach(n=>n.classList.remove('clp-hot'));
  if(!s){t.hidden=true;return;}
  body.querySelectorAll(`[data-name="${CSS.escape(s.dataset.name)}"]`).forEach(n=>n.classList.add('clp-hot'));
  t.innerHTML=`<strong><i style="background:${esc(s.dataset.col)}"></i>${esc(s.dataset.name)}</strong><dl><dt>当前</dt><dd class="n">${esc(s.dataset.cur)}</dd><dt>累计</dt><dd class="n">${esc(s.dataset.tot)}</dd><dt>占比</dt><dd class="n">${esc(s.dataset.pct)}</dd></dl><small>排放指数</small>`;t.hidden=false;};
 body.addEventListener('pointerover',tip);body.addEventListener('focusin',tip);
 body.addEventListener('pointerleave',()=>tip({target:body}));body.addEventListener('focusout',e=>{if(!body.contains(e.relatedTarget))tip({target:body});});
 dlg.addEventListener('click',e=>{if(e.target.closest('.clp-close')||e.target===dlg)api.close();});
 dlg.addEventListener('cancel',e=>{e.preventDefault();api.close();});
 const api={
  open(o){opener=o||document.activeElement;snap=getSnapshot?.()??snap;render();if(!dlg.open)dlg.showModal();dlg.querySelector('.clp-close').focus();},
  close(){if(!dlg.open)return;dlg.close();const o=opener;opener=null;if(o&&o.isConnected&&typeof o.focus==='function')o.focus();},
  update(s){const changed=JSON.stringify(snap?.climate)!==JSON.stringify(s?.climate);snap=s;if(!dlg.open||!changed)return;const f=document.activeElement?.dataset?.name,scroll=body.scrollTop;render();body.scrollTop=scroll;if(f)body.querySelector(`.clp-slice[data-name="${CSS.escape(f)}"]`)?.focus();},
  destroy(){if(dlg.open)dlg.close();dlg.remove();},
  get element(){return dlg;},get isOpen(){return dlg.open;}
 };
 snap=getSnapshot?.()??null;render();
 return api;
}
