import {UNIT_SYMBOLS} from '/map.js';
import {EXPANSION_SYMBOLS,UNIT_ETCHINGS,insigniaMarkup} from '/unit-etchings.js';
import {researchUnlocks,RESEARCH_EFFECTS,PROJECTS} from '/rules.mjs';
import {CIVIC_PLATES,CIVIC_PLATE_SYMBOLS} from '/ui-b/ui-b-civic-plates.js';
// Universe "Epic Chronicle" presentation: Civ6-like top strip, World Tracker, diplomacy ribbon, notification feed,
// minimap search, swimlane tech/civic trees, government cards and the ages (era score) UI.
// Reads only the client snapshot already published by app.js (hex:rendered); acts only through window.__hexUi (existing legal routes).
import {TECHS,CIVICS,ERAS,UNITS,BUILDINGS,WONDERS,POLICIES,GOVERNMENTS,POLICY_TYPES,RESOURCES,TERRAINS,IMPROVEMENTS,AGE_BONUSES,AGE_TIERS,governmentSlots,assignPolicyCards,researchCost,leaderFor,LEADERS} from '/rules.mjs';
import {ICON_SYMBOLS,chipIcon} from '/ui-b/ui-b-icons.js';
import {PICTO_SYMBOLS,pictoId} from '/ui-b/ui-b-picto.js';
import {PLATE_SYMBOLS,TECH_PLATES} from '/ui-b/ui-b-plates.js';
import {ERA_RELIEFS,RELIEF_VIEWBOX,AGE_ART,AGE_ART_VIEWBOX} from '/ui-b/ui-b-ages2-art.js';
import {ageChoiceModel,tagLabel,selectionError,ageObjective} from '/age-cards.js';
import {gpHtml,gpAct,GP_SYMBOLS} from '/ui-b/ui-b-gp.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=n=>{if(n===undefined||n===null||Number.isNaN(+n))return '—';const a=Math.abs(+n);return a>=1e6?(+n/1e6).toFixed(1)+'M':a>=1e4?(+n/1e3).toFixed(1)+'k':(Math.round(+n*10)/10).toLocaleString('zh-CN');};
const sgn=n=>(+n>=0?'+':'')+num(n);
const set=(el,html)=>{if(el&&el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}};
const ic=(k,cls='')=>`<svg class="b4i ${cls}" aria-hidden="true"><use href="#b4-${k}"/></svg>`;
const UI=()=>window.__hexUi||{};
let rosterOpen=false,on=false,S=null,codex=null,codexTab='tech',govDraft=null,ageDismissed=new Set(),feedOpen=false,chronicleOpen=false,trackerOpen=true,searchIndex=null,searchKey='',lastAgeShown='',ribbonResize=null;

/* ---------------- icon sprite (inline SVG, engraved line style) ---------------- */
const P={
 flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
 lyre:'<path d="M7 4c-2 4-2 9 1 13M17 4c2 4 2 9-1 13M7 17h10M8 21h8M10 8v9M14 8v9M6 4h3M15 4h3"/>',
 coin:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6"/>',
 faith:'<path d="M12 3v18M7 8h10M8 21h8"/>',
 route:'<path d="M3 17c4 0 4-10 9-10s5 10 9 10"/><circle cx="3" cy="17" r="1.6"/><circle cx="21" cy="17" r="1.6"/><path d="M12 4v3"/>',
 sword:'<path d="M14.5 4H20v5.5L9 20.5 3.5 15z"/><path d="M6 13l5 5M3 21l2.5-2.5"/>',
 swords:'<path d="M4 4l11 11M20 4L9 15M14 15l3 3 2-2-3-3M10 15l-3 3-2-2 3-3"/>',
 ship:'<path d="M3 16h18l-3 4H6zM12 3v13M12 4l6 8h-6M12 6l-5 6h5"/>',
 gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
 atom:'<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>',
 book:'<path d="M4 5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0zM20 5c-3-1.5-5.5-1.5-8 0v14c2.5-1.5 5-1.5 8 0z"/>',
 wheat:'<path d="M12 21V8M12 8c-3-1-4-3-4-5 3 0 4 2 4 5zM12 8c3-1 4-3 4-5-3 0-4 2-4 5zM12 13c-3-1-4-3-4-5 3 0 4 2 4 5zM12 13c3-1 4-3 4-5-3 0-4 2-4 5zM12 18c-3-1-4-3-4-5 3 0 4 2 4 5zM12 18c3-1 4-3 4-5-3 0-4 2-4 5z"/>',
 horse:'<path d="M6 21v-6l-2-3 3-6 3-1 2-3 1 3 4 2 3 5-2 1-3-2-1 4 2 6"/>',
 pick:'<path d="M4 8c4-4 12-4 16 0M12 6l-8 15"/>',
 wheel:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.8"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13.2 13.2 8.5 15.5l2.3-4.7z"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
 plane:'<path d="M2.5 13l8-1.5L15 4h2l-2 7.5 5.5 1-1 2-5.5-.5-3 6.5h-2l1-6.5-7 .5z"/>',
 rocket:'<path d="M12 2c3 3 4.5 7 4 12l-4 3-4-3c-.5-5 1-9 4-12zM8 14l-3 3v3l3-2M16 14l3 3v3l-3-2M12 17v4"/><circle cx="12" cy="9" r="1.6"/>',
 bolt:'<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
 crown:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5zM5 21h14"/>',
 scales:'<path d="M12 3v18M7 21h10M4 7h16M6 7l-3 7c0 1.5 6 1.5 6 0zM18 7l-3 7c0 1.5 6 1.5 6 0z"/>',
 temple:'<path d="M3 9l9-6 9 6zM5 9v10M9 9v10M15 9v10M19 9v10M3 21h18"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9.5C7.5 20 4 17 4 12V6z"/><path d="M12 7v10M8 11h8"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 column:'<path d="M5 4h14M6 6h12M8 6v13M12 6v13M16 6v13M5 19h14M4 21h16"/>',
 cannon:'<circle cx="7" cy="16" r="3.5"/><path d="M8 13l12-6 1 2-11 7"/><circle cx="7" cy="16" r="1"/>',
 house:'<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>',
 pyramid:'<path d="M3 20h18M5 20l1.6-4h10.8l1.6 4M6.6 16l1.6-4h7.6l1.6 4M8.2 12l1.6-4h4.4l1.6 4M11 8V5h2v3"/>',
 card:'<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 8h6M9 12h6M9 16h3"/>',
 flag:'<path d="M5 21V3M5 4h12l-2.5 4L17 12H5"/>',
 gem:'<path d="M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16 3-16"/>',
 hammer:'<path d="M14 4l6 6-2 2-6-6zM12.5 7.5L4 16l4 4 8.5-8.5"/>',
 seal:'<circle cx="12" cy="12" r="8"/><path d="M12 7l1.5 3 3.3.5-2.4 2.3.6 3.2L12 14.5 9 16l.6-3.2-2.4-2.3 3.3-.5z"/>',
 envoy:'<path d="M3 6h18v12H3z"/><path d="M3 6l9 7 9-7"/><circle cx="17" cy="16" r="3" fill="currentColor"/>',
 hourglass:'<path d="M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9s10 3 10 9"/>',
 skull:'<path d="M5 11a7 7 0 1 1 14 0c0 3-2 4-2 6H7c0-2-2-3-2-6z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 20v-3M14 20v-3"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 bell:'<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
 clasp:'<path d="M3 12l4-4 4 2 3-2 7 5-4 4-3-2-2 2-3-2-2 1z"/><path d="M11 10l3 3"/>',
 laurel:'<path d="M12 21C6 19 3 13 4 5M12 21c6-2 9-8 8-16"/><path d="M5 9c2 0 3 1 3 3M6 14c2 0 3 1 3 3M19 9c-2 0-3 1-3 3M18 14c-2 0-3 1-3 3"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 moon:'<path d="M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10z"/>',
 oil:'<path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>',
 iron:'<path d="M4 15l4-8h8l4 8-4 4H8z"/><path d="M8 7l4 8 4-8"/>',
 uranium:'<circle cx="12" cy="12" r="2"/><path d="M12 10L8 3a9 9 0 0 1 8 0zM13.7 13l7.6 1a9 9 0 0 1-4 7zM10.3 13l-3.6 8a9 9 0 0 1-4-7z"/>'
};
function sprite(){if($('b4-sprite'))return;const d=document.createElement('div');d.id='b4-sprite';d.hidden=true;d.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg">${Object.entries({...P,...EXPANSION_SYMBOLS,...GP_SYMBOLS,...ICON_SYMBOLS,...PICTO_SYMBOLS,...PLATE_SYMBOLS,...CIVIC_PLATE_SYMBOLS,...Object.fromEntries(Object.entries(UNIT_SYMBOLS).map(([key,v])=>['unit-'+key,`<g transform="translate(12 12) scale(.5)">${insigniaMarkup(key)}</g>`]))}).map(([k,v])=>`<symbol id="b4-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')}</svg>`;document.body.append(d);}
const ICON_RULES=[[/sail|ship|navig|cartog|steam|naval|shipbuild/,'ship'],[/flight|aero|plane|radar/,'plane'],[/rocket|space|satell/,'rocket'],[/electric|radio|telecom|comput|laser|robot|nano|digital/,'bolt'],[/atomic|nuclear|fission|fusion|physics|chem|science|theory|quantum/,'atom'],[/astro|math|calend/,'compass'],[/animal|horse|stirrup|caval/,'horse'],[/mining|mine/,'pick'],[/wheel/,'wheel'],[/gunpow|cannon|ballist|artill|siege/,'cannon'],[/bronze|iron|steel|tactic|armor|machin|archery|military|mobil|defens|training|nationalism|conscript|war/,'sword'],[/writing|educat|print|literacy|philo|recorded|enlight|scholar/,'book'],[/currency|bank|econom|trade|guild|merchant|capital|globaliz|commerce/,'coin'],[/mason|engineer|construct|architect|industr|factory|combust|replace|plastic|corps/,'gear'],[/pottery|agri|irrig|farm|craft|feudal|husband/,'wheat'],[/code|law|state|politic|civil|govern|monarchy|empire|suffrage|ideology|class/,'crown'],[/diplom|congress|league|alliance/,'scales'],[/myst|religio|divine|theo|reform|pantheon/,'temple'],[/drama|human|art|media|cultur|music|opera/,'lyre'],[/explor|colon/,'compass']];
const itemIcon=k=>CIVIC_PLATES[k]?'v-'+k:TECH_PLATES[k]?'p-'+k:'t-'+k;   // r6: technologies use their engraved plate drawing

/* ---------------- helpers ---------------- */
function viewer(){const g=S?.game;if(!g)return null;const id=S.view>=0?S.view:S.selectedPlayer;return g.players.find(p=>p.id===id)||g.players[0];}
function control(p){try{return !!UI().canControl?.(p.id);}catch{return false;}}
function portrait(o,cls=''){const has=LEADERS.some(l=>l.key===o.leaderKey);return has?`<img class="b4-face ${cls}" src="/assets/leaders/${esc(o.leaderKey)}-small.webp" alt="" loading="lazy" decoding="async">`:`<span class="b4-face b4-sigil ${cls}" style="--civ:${esc(o.color)}">${esc(o.symbol||o.short?.[0]||'?')}</span>`;}
const unlocks=researchUnlocks;
const UKN={effect:'能力与加成',project:'项目',unit:'单位',building:'建筑',wonder:'奇观',policy:'政策卡',gov:'政体',res:'资源',imp:'改良设施'};
const chipSym=u=>u.k==='effect'?(RESEARCH_EFFECTS[u.id]?.icon||'gear'):u.k==='unit'&&UNIT_SYMBOLS[u.id]?'unit-'+u.id:pictoId(u.k,u.id)||'c-'+chipIcon(u.k,u.id||'');
const chip=(u,cls='')=>`<i class="b4-u ${u.k} ${u.t||''} ${cls}" data-tip="${u.k}|${esc(u.id||'')}|${esc(u.n)}" aria-label="${esc(UKN[u.k]||'')} · ${esc(u.n)}">${ic(chipSym(u))}</i>`;
const unlockRow=(list,max=6)=>list.slice(0,max).map(u=>chip(u)).join('')+(list.length>max?`<i class="b4-u more" title="${esc(list.slice(max).map(u=>u.n).join('、'))}">+${list.length-max}</i>`:'');
function progressOf(p,key,civic){const g=S.game,cat=civic?CIVICS:TECHS,spec=cat[key];if(!spec)return null;const boost=(civic?p.inspirations:p.boosts)?.includes(key),cost=researchCost(g,key,civic,boost)||1,prog=(civic?p.civicProgress:p.researchProgress)?.[key]||0,rate=p.yields?.[civic?'culture':'science']||0,bank=(civic?p.cultureBank:p.scienceBank)||0;return {spec,cost,prog,pct:Math.min(100,prog/cost*100),turns:rate>0?Math.max(1,Math.ceil((cost-prog-bank)/rate)):null,boost};}

/* ---------------- scaffolding ---------------- */
function build(){
  sprite();const app=$('app');if(!app||$('b4-left'))return;
  const left=document.createElement('div');left.id='b4-left';left.className='b-layer';left.innerHTML='<section id="b4-tracker"></section>';
  const ribbon=document.createElement('nav');ribbon.id='b4-ribbon';ribbon.className='b-layer';ribbon.setAttribute('aria-label','外交丝带');
  const feed=document.createElement('aside');feed.id='b4-feed';feed.className='b-layer';
  const codexEl=document.createElement('section');codexEl.id='b4-codex';codexEl.hidden=true;codexEl.setAttribute('role','dialog');codexEl.setAttribute('aria-modal','true');
  const menu=document.createElement('dialog');menu.id='b4-mainmenu-dlg';
  menu.innerHTML=`<div class="b4-dlg"><i class="b4-orn-top"></i><small>THE GRAND COUNCIL</small><h2>返回主菜单？</h2><p>对局将暂停。快速保存会写入一个新的手动存档，不覆盖自动存档。</p><div class="b4-dlg-actions"><button data-b4-menu="back" class="b4-btn">返回游戏</button><button data-b4-menu="save" class="b4-btn gold">快速保存并回到菜单</button><button data-b4-menu="leave" class="b4-btn ghost">回到菜单</button></div><p class="b4-dlg-msg" role="status"></p></div>`;
  const age=document.createElement('dialog');age.id='b4-age';
  const mms=document.createElement('div');mms.id='b4-mmsearch';mms.className='b-layer';mms.innerHTML=`<label>${ic('search')}<input id="b4-mm-input" placeholder="搜索单位、资源、地形、城市" autocomplete="off" aria-label="小地图搜索"></label><ul id="b4-mm-results" role="listbox"></ul>`;
  const pulse=document.createElement('div');pulse.id='b4-pulse';pulse.hidden=true;const tip=document.createElement('div');tip.id='b4-tip';tip.hidden=true;tip.setAttribute('role','tooltip');document.body.append(tip);const rp=document.createElement('aside');rp.id='b4-rpanel';rp.className='b-layer';rp.setAttribute('aria-label','列国');
  const ageDock=document.createElement('aside');ageDock.id='b4-age-dock';ageDock.className='b-layer';ageDock.setAttribute('aria-label','时代进度');
  const clock=$('b-hud')?.querySelector('.b-clock');if(clock)ageDock.append(clock);
  app.append(left,ribbon,feed,rp,codexEl,mms,pulse,ageDock);document.body.append(menu,age);
  ribbonResize?.disconnect();ribbonResize=new ResizeObserver(()=>{app.style.setProperty('--b4-ribbon-bottom',Math.ceil(ribbon.getBoundingClientRect().bottom-app.getBoundingClientRect().top+10)+'px');});ribbonResize.observe(ribbon);
  const roster=$('b-roster');if(roster)rp.append(roster);
  $('b4-mm-input').addEventListener('input',onSearch);$('b4-mm-input').addEventListener('keydown',e=>{if(e.key==='Enter'){$('b4-mm-results').querySelector('[data-b4-tile]')?.click();}if(e.key==='Escape'){e.target.value='';onSearch();}});
}

/* ---------------- top strip ---------------- */
const STRAT=Object.keys(RESOURCES).filter(k=>RESOURCES[k].category==='strategic').sort((a,b)=>{const order=['horses','iron','oil','uranium'];return (order.includes(a)?order.indexOf(a):order.length)-(order.includes(b)?order.indexOf(b):order.length);});
const YI=[['science','科技','#7f9fbf'],['culture','文化','#a48bbf'],['gold','国库','#c9a85c'],['faith','信仰','#b9a0a8']],SPARK=new Map();
const oic=k=>`<svg class="b-ic" aria-hidden="true"><use href="#i-${k}"/></svg>`;
function spark(key,val){const g=S.game,k=g.id+':'+key;let h=SPARK.get(k);if(!h){h=[];SPARK.set(k,h);}const last=h[h.length-1];if(!last||last.t!==g.turn)h.push({t:g.turn,v:+val||0});else last.v=+val||0;if(h.length>24)h.shift();
  if(h.length<2)return '<svg class="b-spark" viewBox="0 0 60 16"></svg>';const vs=h.map(x=>x.v),lo=Math.min(...vs),r=(Math.max(...vs)-lo)||1;return `<svg class="b-spark" viewBox="0 0 60 16" preserveAspectRatio="none"><polyline points="${vs.map((v,i)=>(i/(vs.length-1)*60).toFixed(1)+','+(15-(v-lo)/r*14).toFixed(1)).join(' ')}"/></svg>`;}
// Original v3b yield cells (#i-* icons the user liked) + new cells drawn in the same engraved line style.
function yieldsHtml(p){const g=S.game,y=p.yields||{},routes=(g.routes||[]).filter(r=>r.owner===p.id).length,res=p.resources||{},known=p.resources!=null,lux=Object.entries(res).filter(([k,n])=>RESOURCES[k]?.category==='luxury'&&n>0);
  const main=YI.map(([k,label,col])=>{const v=y[k],stock=k==='gold'?p.gold:k==='faith'?p.faith:null,neg=k==='gold'&&((v??0)<0||(p.finance?.arrears||0)>0);
    return `<div class="b-y${neg?' neg':''}" style="--c:${col}" title="${label}${stock!==null?' 储备 '+num(stock):''} · 每周期 ${sgn(v||0)}">${oic(k)}<div><b>${stock!==null?num(stock):sgn(v||0)}</b>${stock!==null?`<small>${sgn(v||0)}</small>`:`<small class="b4-ylabel">${label}</small>`}</div>${spark(k+':'+p.id,stock!==null?stock:v)}</div>`;}).join('');
  const routeCell=`<div class="b-y b4-yx" style="--c:#9fb38a" title="贸易路线 已用 / 容量">${ic('route','b-ic')}<div><b>${routes}${p.tradeCapacity!==undefined?'<small class="cap">/'+p.tradeCapacity+'</small>':''}</b><small class="b4-ylabel">商路</small></div></div>`;
  const strat=`<div class="b-y b4-yx b4-ystrat" style="--c:#c9b48a" aria-label="战略资源"><div class="b4-strat-items">${STRAT.map(k=>`<span class="${(res[k]||0)>0?'':'zero'}" title="${esc(RESOURCES[k].name)}：${known?res[k]??0:'情报未知'}">${P[k==='horses'?'horse':k]?ic(k==='horses'?'horse':k,'b-ic'):`<i class="b4-resource-glyph" aria-hidden="true">${esc(RESOURCES[k].icon||'◇')}</i>`}<b>${known?res[k]??0:'—'}</b></span>`).join('')}</div></div>`;
  const luxCell=`<div class="b-y b4-yx b4-ylux ${lux.length?'':'zero'}" style="--c:#c48aa8" tabindex="0" aria-label="奢侈品明细" aria-describedby="b4-lux-pop">${ic('gem','b-ic')}<div><b class="b4-lux-total">${known?lux.reduce((n,[,v])=>n+v,0):'—'}</b><small class="b4-ylabel">奢侈品</small></div><div class="b4-lux-pop" id="b4-lux-pop" role="tooltip"><strong>奢侈品</strong>${known?(lux.length?`<ul>${lux.map(([k,n])=>`<li><span>${esc(RESOURCES[k].icon)} ${esc(RESOURCES[k].name)}</span><b>${num(n)}</b></li>`).join('')}</ul>`:'<p>暂无可用奢侈品</p>'):'<p>情报未知</p>'}</div></div>`;
  return main+routeCell+strat+luxCell;}
function ageMeter(p){const g=S.game,A=g.ages,a=p.age;if(!A||!a)return '';const th=A.thresholds,full=a.score!==undefined,score=full?a.score:null,max=Math.max(th.golden+4,score||0),pct=score===null?0:Math.min(1,score/max),dPct=th.dark/max,gPct=th.golden/max;
  const arc=(f)=>{const ang=Math.PI*(1-f),x=20+16*Math.cos(ang),y=20-16*Math.sin(ang);return `${x.toFixed(2)} ${y.toFixed(2)}`;};
  const left=Math.max(0,A.nextTurn-g.turn),tier=a.tier||'normal';
  return `<button class="b4-age t-${tier}" data-b4-agehist title="${esc(AGE_TIERS[tier]?.name||'')} · 本时代得分 ${score??'—'}（黑暗 < ${th.dark} · 黄金 ≥ ${th.golden}）· ${left} 周期后时代更替"><svg viewBox="0 0 40 24" class="b4-gauge"><path d="M4 20A16 16 0 0 1 36 20" class="trk"/><path d="M4 20A16 16 0 0 1 ${arc(pct)}" class="val"/><circle r="1.6" cx="${arc(dPct).split(' ')[0]}" cy="${arc(dPct).split(' ')[1]}" class="tk d"/><circle r="1.6" cx="${arc(gPct).split(' ')[0]}" cy="${arc(gPct).split(' ')[1]}" class="tk g"/></svg><span><b>${score??'—'}</b><small>/${th.golden}</small></span><em>${esc(AGE_TIERS[tier]?.name||'')}</em>${agObjMini(p)}</button>`;}
function agObjMini(p){const o=ageObjective(p);if(!o)return '';return `<i class="b4-agobj ${o.done?'done':''}" title="本时代目标：${esc(o.label)} · ${o.points}/${o.cap} 时代分" aria-label="本时代目标 ${o.points}/${o.cap}">${AG_MARK_T}<u><s style="width:${(o.pct*100).toFixed(1)}%"></s></u><b>${o.points}/${o.cap}</b></i>`;}
function agObjPanel(p){const o=ageObjective(p);if(!o)return '';return `<div class="ag-objpanel ${o.done?'done':''}">${AG_MARK_T}<span><small>本时代目标 · 时代分</small><strong>${esc(o.label)}</strong><u role="progressbar" aria-valuemin="0" aria-valuemax="${o.cap}" aria-valuenow="${o.points}"><s style="width:${(o.pct*100).toFixed(1)}%"></s>${Array.from({length:o.cap-1},(_,i)=>`<i style="left:${((i+1)/o.cap*100).toFixed(2)}%"></i>`).join('')}</u></span><b>${o.points}<small>/${o.cap}</small></b></div>`;}

/* ---------------- world tracker ---------------- */
function tracker(p){const g=S.game,row=(civic)=>{const key=civic?p.civic:p.research,pr=key&&progressOf(p,key,civic);const icon=civic?'lyre':'flask';
    if(!pr)return `<button class="b4-tr ${civic?'civic':'tech'} idle" data-b4-codex="${civic?'civic':'tech'}">${ic(icon,'b4-tr-ic')}<div><strong>${civic?'选择市政':'选择科技'}</strong><small>${control(p)?'等待你的决策':'自动研究中'}</small></div></button>`;
    return `<button class="b4-tr ${civic?'civic':'tech'}" data-b4-codex="${civic?'civic':'tech'}" title="${esc(pr.spec.description)}">${ic(itemIcon(key,pr.spec),'b4-tr-ic')}<div><strong>${esc(pr.spec.name)}${pr.boost?' <i class="b4-boost">✦</i>':''}</strong><small>${pr.turns?pr.turns+' 周期':'—'}</small><i class="b4-bar" role="progressbar" aria-label="${civic?'市政':'科技'}投入 ${num(pr.prog)} / ${num(pr.cost)}" aria-valuemin="0" aria-valuemax="${pr.cost}" aria-valuenow="${pr.prog}" title="已投入 ${num(pr.prog)} / ${num(pr.cost)} · 每回合 +${num(p.yields?.[civic?'culture':'science']||0)}"><em style="width:${pr.pct.toFixed(1)}%"></em></i><span class="b4-urow">${unlockRow(unlocks(key,civic),5)}</span></div></button>`;};
  const c=g.congress?.current,cg=g.congress;
  const congress=`<button class="b4-tr congress" data-b4-modal="congress">${ic('scales','b4-tr-ic')}<div><strong>世界议会</strong><small>${c?'第 '+c.id+' 届 · 投票剩 '+Math.max(0,c.closesTurn-g.turn)+' 周期':'下次召开 第 '+(cg?.nextTurn??'—')+' 周期'}</small></div></button>`;
  return `<header><button class="b4-tr-toggle" data-b4-tracker aria-expanded="${trackerOpen}">${ic('compass')}<span>世界进程</span><i></i></button></header>${trackerOpen?`<div class="b4-tr-body">${row(false)}${row(true)}${congress}</div>`:''}`;}

/* ---------------- diplomacy ribbon ---------------- */
function mood(me,o){const r=me?.relations?.[o.id],att=o.attitudeToward,op=att?+att.opinion:null,gr=r?.grievances||0;
  if(r?.status==='war')return {k:'war',t:'交战中'};if(r?.status==='alliance')return {k:'ally',t:'同盟'};
  if(gr>=70||(op!==null&&op<=-45)||att?.denounced)return {k:'red',t:'非常不满'+(op!==null?` · 态度 ${Math.round(op)}`:'')+` · 不满度 ${Math.round(gr)}`};
  if(gr>=40||(op!==null&&op<=-15))return {k:'yellow',t:'不满'+(op!==null?` · 态度 ${Math.round(op)}`:'')+` · 不满度 ${Math.round(gr)}`};
  if((op!==null&&op>=25)||att?.friend)return {k:'green',t:'友善'+(op!==null?` · 态度 +${Math.round(op)}`:'')};
  return {k:'neutral',t:'中立'+(op!==null?` · 态度 ${Math.round(op)}`:'')};}
const face=k=>k==='war'?`<svg viewBox="0 0 24 24" class="b4-mood war"><use href="#b4-swords"/></svg>`:k==='ally'?`<svg viewBox="0 0 24 24" class="b4-mood ally"><use href="#b4-clasp"/></svg>`:`<svg viewBox="0 0 24 24" class="b4-mood ${k}"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1" class="e"/><circle cx="15" cy="10" r="1.1" class="e"/><path d="${k==='green'?'M8 14c2 2.5 6 2.5 8 0':k==='neutral'?'M8.5 15h7':'M8 16c2-2.2 6-2.2 8 0'}" class="m"/>${k==='red'?'<path d="M7 7.5l3 1.3M17 7.5l-3 1.3" class="m"/>':''}</svg>`;
function ribbon(me){const g=S.game,runs=S.session?.managedRuns||[],list=g.players.filter(o=>o.alive&&(o.id!==me?.id||runs.some(run=>run.seat===o.id))&&(S.view<0||o.id===me?.id||me?.met?.includes(o.id)));
  return list.map(o=>{const m=mood(me,o),age=o.age?.tier,run=runs.find(run=>run.seat===o.id),broken=run&&(run.state==='failed'||!run.paused&&(run.error||run.connection==='disconnected'));return `<button class="b4-rb m-${m.k}" data-b4-leader="${o.id}" style="--civ:${esc(o.color)}" title="${esc(o.name)} · ${esc(leaderFor(o).name)} · ${esc(m.t)}${age&&age!=='normal'?' · '+esc(AGE_TIERS[age]?.name):''}">${portrait(o)}${face(m.k)}${broken?'<span class="b4-model-error" title="模型连接或输出异常，打开模型观察查看">!</span>':''}${age==='golden'||age==='heroic'?'<i class="b4-rb-age g"></i>':age==='dark'?'<i class="b4-rb-age d"></i>':''}</button>`;}).join('');}

/* ---------------- notification feed ---------------- */
const EV={science:'flask',culture:'lyre',battle:'swords',military:'sword',conquest:'swords',wonder:'pyramid',greatperson:'star',age:'hourglass',religion:'temple',congress:'scales',diplomacy:'seal',city:'house',growth:'wheat',eliminated:'skull',trade:'route',space:'rocket',victory:'laurel',explore:'compass',build:'hammer',production:'hammer',world:'compass',leader:'crown'};
// World Chronicle as a compact strip of category medallions; details only in a hover/focus popover.
const CHRON=[['war','战争',['battle','military','conquest','eliminated'],'swords'],['diplo','外交',['diplomacy','congress','trade','alliance'],'seal'],['envoy','来使',['envoy','peace'],'envoy'],['science','科技',['science'],'flask'],['culture','文化',['culture'],'lyre'],['religion','宗教',['religion'],'temple'],['wonder','奇观',['wonder'],'pyramid'],['gp','伟人',['greatperson'],'star'],['city','城市',['city','growth','production','build'],'house'],['other','其他',null,'hourglass']];
const CHRON_OF=(()=>{const m={};for(const [k,,ts] of CHRON)for(const t of ts||[])m[t]=k;return m;})();
function chronicle(me,props){const g=S.game,evs=(g.events||[]).filter(e=>e.type!=='order'),by={};for(const [k] of CHRON)by[k]=[];for(const e of evs)by[CHRON_OF[e.type]||'other'].push(e);
  const recent=g.turn-4;
  return `<div class="b4-chron2"><span class="b4-ch-t" title="世界纪事" aria-label="世界纪事">${ic('book')}</span><div class="b4-ch-row">${CHRON.map(([k,name,,icon])=>{const list=by[k],env=k==='envoy'?props:[],n=list.filter(e=>e.turn>=recent).length+env.length,last=list.find(e=>e.tile!==null&&e.tile!==undefined);
    const rows=env.map(o=>{const f=g.players[o.from];return `<button class="b4-chr hot" data-b4-offer="${o.id}"><small>待复</small>${esc(f?.short||f?.name||'')} · ${o.kind==='jointWar'?'联合战争会谈':'议和文书'}</button>`;}).join('')+list.slice(0,8).map(e=>`<button class="b4-chr" ${e.tile!==null&&e.tile!==undefined?`data-b4-tile="${e.tile}"`:'disabled'}><small>${e.turn}</small>${esc(e.text)}</button>`).join('');
    return `<div class="b4-chc c-${k} ${n?'':'zero'}"><button class="b4-chb" ${env.length?`data-b4-offer="${env[0].id}"`:last?`data-b4-tile="${last.tile}"`:''} aria-label="${name}：最近 ${n} 条">${ic(icon)}${n?`<b>${n>99?'99+':n}</b>`:''}</button><div class="b4-chpop" role="tooltip"><header>${ic(icon)}<strong>${name}</strong><small>近 5 周期 ${n} 条 · 共 ${list.length+env.length} 条</small></header>${rows||'<p>暂无记录</p>'}</div></div>`;}).join('')}</div></div>`;}
function feed(me){const g=S.game,items=[];for(const o of g.court?.offers||[])if(o.status==='pending'&&o.to===me?.id&&S.view>=0){const from=g.players[o.from];items.push(`<button class="b4-n hot" data-b4-leader="${o.from}">${ic('seal')}<span><strong>${esc(from?.short)} · 文书待复</strong><small>${esc({friendship:'友谊',typedAlliance:'同盟',delegation:'使团',embassy:'大使馆',tradeDeal:'交易',demand:'索取'}[o.kind]||'外交')}</small></span></button>`);}
  if(me?.age?.pending&&control(me))items.push(`<button class="b4-n hot age" data-b4-ageopen>${ic('hourglass')}<span><strong>${esc(AGE_TIERS[me.age.pending.tier]?.name)}来临</strong><small>选择 ${me.age.pending.count} 项时代加成</small></span></button>`);
  const props=(g.diplomacy?.proposals||[]).filter(o=>o.envoy&&o.status==='pending'&&(S.view<0?true:o.to===me?.id||o.from===me?.id));
  for(const o of props.slice(0,3)){const from=g.players[o.from],to=g.players[o.to];items.push(`<button class="b4-n hot envoy" data-b4-offer="${o.id}" style="--civ:${esc(from?.color)}">${ic('envoy')}<span><strong>来使 · ${esc(from?.short||from?.name)}${o.to!==me?.id?' → '+esc(to?.short):''}</strong><small>${o.kind==='jointWar'?'联合战争会谈':'议和文书'} · 点击查看</small></span></button>`);}
  return `<header><button class="b4-feed-toggle" data-b4-feed title="通知">${ic('bell')}<span>通知</span>${items.length?`<b>${items.length}</b>`:''}</button></header>${chronicle(me,props)}<div class="b4-feed-body">${items.join('')}</div>`;}

/* ---------------- minimap search ---------------- */
const FEATURE_NAMES={forest:'森林',jungle:'雨林',marsh:'沼泽',reef:'珊瑚礁',oasis:'绿洲',floodplain:'泛滥平原',hills:'丘陵',ice:'冰原'};
function onSearch(){const q=$('b4-mm-input').value.trim(),ul=$('b4-mm-results');if(!q){ul.innerHTML='';ul.hidden=true;return;}const g=S?.game;if(!g)return;const me=viewer(),out=[];
  for(const c of g.cities)if(c.name?.includes(q))out.push({t:c.tile,n:c.name,s:'城市 · '+(g.players[c.owner]?.short||''),i:'house'});
  for(const u of g.units){const s=UNITS[u.type];if(!s)continue;if(s.name.includes(q))out.push({t:u.tile,n:s.name,s:(u.owner===me?.id?'己方':g.players[u.owner]?.short||'蛮族')+' 单位',i:s.domain==='sea'?'ship':s.domain==='air'?'plane':s.civilian?'hammer':'sword'});if(out.length>40)break;}
  const seen=new Set();for(const t of g.map.tiles){if(t.hidden)continue;const names=[t.village&&'部落村庄',t.ruin&&'古代遗迹',t.camp&&'蛮族营寨',t.resource&&RESOURCES[t.resource]?.name,t.feature&&(FEATURE_NAMES[t.feature]||t.feature),TERRAINS[t.terrain]?.name].filter(Boolean);const hit=names.find(n=>n.includes(q));if(hit){const key=hit;const count=(seen[key]=(seen[key]||0)+1);if(count<=6)out.push({t:t.id,n:hit,s:`格 ${t.q},${t.r}${t.owner!==null&&t.owner!==undefined&&g.players[t.owner]?' · '+g.players[t.owner].short:''}`,i:t.resource&&RESOURCES[t.resource]?.name===hit?'gem':'compass'});}if(out.length>60)break;}
  ul.hidden=!out.length;ul.innerHTML=out.slice(0,12).map(r=>`<li><button data-b4-tile="${r.t}" data-b4-pulse="1">${ic(r.i)}<span>${esc(r.n)}</span><small>${esc(r.s)}</small></button></li>`).join('')||'';}
function jump(tile,pulse){UI().focusTile?.(tile);if(pulse){UI().selectTile?.(tile);const p=$('b4-pulse');if(p){p.hidden=false;p.classList.remove('go');void p.offsetWidth;p.classList.add('go');clearTimeout(jump.t);jump.t=setTimeout(()=>{p.hidden=true;},1800);}}}

/* ---------------- codex: tech / civic — lane grid (r3) ---------------- */
// Stable branch lanes (rows) × prerequisite-depth columns. Connectors are orthogonal with rounded elbows and
// run only in the column gutters and the gaps between rows, so they never cross a card.
const LANES={
  t:[['sea','航海 · 航空',/^(sailing|celestial|shipbuilding|cartography|flight|advflight|rocketry|satellites)$/],
     ['mil','军事',/^(archery|horseback|bronze|ironwork|stirrups|militarytactics|castles|siege|gunpowder|ballistics|militaryscience|rifling|steel|combinedarms|advballistics|composites|guidance)$/],
     ['ind','生产 · 工程',/^(mining|masonry|wheel|engineering|construction|buttress|machinery|massproduction|metalcasting|industrial|steam|combustion|refining|robotics|nanotech)$/],
     ['sci','科学 · 信息',/./],
     ['eco','经济 · 民生',/^(pottery|animal|irrigation|currency|apprenticeship|banking|economics|sanitation)$/]],
  c:[['mil','军事',/^(militarytradition|training|defensive|mercenaries|navaltradition|nationalism|mobilization|coldwar|rapiddeployment)$/],
     ['pol','政治 · 政体',/^(code|empire|state|civilservice|monarchy|divine|feudalism|ideology|suffrage|classstruggle|totalitarian|nearfuture|futurecivic)$/],
     ['dip','外交 · 探索',/^(exploration|diplomacy|colonialism|globalization)$/],
     ['eco','经济 · 社会',/^(craftsmanship|workforce|trade|guilds|economy|urbanization|engineeringcorps|conservation|environmentalism)$/],
     ['cul','文化 · 信仰',/./]]};
const LAYOUT=new Map(),CARDW=206,CARDH=58,MED=22,GUT=74,COLW=CARDW+MED+GUT,ROWH=CARDH+20,LANEPAD=26,PADX=36,PADY=58,LANE_ROWS={t:[1,2,2,2,1],c:[2,2,1,2,2]};
function laneOf(civic,key){const L=LANES[civic?'c':'t'];const spec=L.find(l=>l[2].source!=='.'&&l[2].test(key))||L.find(l=>l[2].source==='.');return L.indexOf(spec);}
function rpath(pts,r=10){pts=pts.filter((p,i)=>!i||p[0]!==pts[i-1][0]||p[1]!==pts[i-1][1]);pts=pts.filter((p,i)=>i===0||i===pts.length-1||!((pts[i-1][0]===p[0]&&p[0]===pts[i+1][0])||(pts[i-1][1]===p[1]&&p[1]===pts[i+1][1])));
  let d=`M${pts[0][0]} ${pts[0][1]}`;for(let i=1;i<pts.length-1;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],[x2,y2]=pts[i+1],l1=Math.hypot(x1-x0,y1-y0),l2=Math.hypot(x2-x1,y2-y1),rr=Math.min(r,l1/2,l2/2);
    if(rr<1){d+=`L${x1} ${y1}`;continue;}d+=`L${(x1-(x1-x0)/l1*rr).toFixed(1)} ${(y1-(y1-y0)/l1*rr).toFixed(1)}Q${x1} ${y1} ${(x1+(x2-x1)/l2*rr).toFixed(1)} ${(y1+(y2-y1)/l2*rr).toFixed(1)}`;}
  const e=pts[pts.length-1];return d+`L${e[0]} ${e[1]}`;}
function layout(civic){const k=civic?'c':'t',viewport=$('b4-codex')?.querySelector('.b4-cx-body'),budget=Math.max(140,Math.floor(viewport?.clientHeight||innerHeight-180)-2);
  const compact=PADY+LANE_ROWS[k].reduce((a,n)=>a+n*ROWH+LANEPAD,0)+10>budget;
  const head=compact?52:PADY,bottom=8,cardH=compact?Math.max(16,Math.min(CARDH,Math.floor((budget-head-bottom)/5)-4)):CARDH;
  const gap=compact?Math.max(0,Math.min(20,(budget-head-bottom-5*cardH)/10)):20,lanePad=compact?gap:LANEPAD,rowH=cardH+gap;
  const cacheKey=k+':'+budget;if(LAYOUT.has(cacheKey))return LAYOUT.get(cacheKey);const cat=civic?CIVICS:TECHS,keys=Object.keys(cat),lanes=LANES[k];
  const req=key=>(cat[key].requires||[]).filter(r=>cat[r]),depth={},dep=key=>depth[key]??(depth[key]=Math.max(0,...req(key).map(r=>dep(r)+1)));keys.forEach(dep);
  const lane=Object.fromEntries(keys.map(key=>[key,laneOf(civic,key)])),col={},row={},occ=new Set(),lim=compact?[1,1,1,1,1]:LANE_ROWS[k];
  // Each lane has a fixed number of rows; when a lane's column is full the card steps one column forward
  // (children then follow), which staggers cards while keeping them on a stable grid.
  for(const x of keys.slice().sort((a,b)=>depth[a]-depth[b]||cat[a].era-cat[b].era||cat[a].cost-cat[b].cost)){const ps=req(x),same=ps.filter(r=>lane[r]===lane[x]);
    const want=same.length?Math.round(same.reduce((a,r)=>a+row[r],0)/same.length):ps.length&&ps.reduce((a,r)=>a+lane[r],0)/ps.length>lane[x]?lim[lane[x]]-1:0;
    let c=Math.max(0,...ps.map(r=>col[r]+1)),r=-1;while(r<0){const cand=[...Array(lim[lane[x]]).keys()].sort((a,b)=>Math.abs(a-want)-Math.abs(b-want));r=cand.find(rr=>!occ.has(lane[x]+':'+rr+':'+c))??-1;if(r<0)c++;}
    col[x]=c;row[x]=r;occ.add(lane[x]+':'+r+':'+c);}
  const maxC=Math.max(...Object.values(col));
  const laneRows=lim.slice();let top=head;const laneTop=laneRows.map(n=>{const t=top;top+=n*rowH+lanePad;return t;});
  const pos={};for(const x of keys)pos[x]={x:PADX+col[x]*COLW+MED,y:laneTop[lane[x]]+row[x]*rowH,c:col[x],l:lane[x],r:row[x]};
  const width=PADX+(maxC+1)*COLW+40,height=top+bottom,cellBusy=(l,r,c)=>occ.has(l+':'+r+':'+c);
  const gx=c=>PADX+c*COLW+MED+CARDW+GUT/2;
  const links=[];for(const x of keys)for(const r of req(x)){const a=pos[r],b=pos[x],xs=a.x+CARDW,xe=b.x-MED-3,ya=a.y+cardH/2,yb=b.y+cardH/2;let pts;
    const freeRow=(l,rr,c0,c1)=>{for(let c=c0;c<=c1;c++)if(cellBusy(l,rr,c))return false;return true;};
    if(b.c===a.c+1)pts=[[xs,ya],[gx(a.c),ya],[gx(a.c),yb],[xe,yb]];
    else if(freeRow(b.l,b.r,a.c+1,b.c-1))pts=[[xs,ya],[gx(a.c),ya],[gx(a.c),yb],[xe,yb]];
    else if(freeRow(a.l,a.r,a.c+1,b.c-1))pts=[[xs,ya],[gx(b.c-1),ya],[gx(b.c-1),yb],[xe,yb]];
    else{const ch=b.y-(rowH-cardH)/2;pts=[[xs,ya],[gx(a.c),ya],[gx(a.c),ch],[gx(b.c-1),ch],[gx(b.c-1),yb],[xe,yb]];}
    links.push({from:r,to:x,d:rpath(pts)});}
  // era headers: the column's median era; a header starts where it changes
  const eraOf=c=>{const es=keys.filter(x=>col[x]===c).map(x=>cat[x].era).sort((a,b)=>a-b);return es[Math.floor(es.length/2)];};
  const eras=[];let run=0;for(let c=0;c<=maxC;c++){const e=run=Math.max(run,eraOf(c)??run);if(!eras.length||eras[eras.length-1].e!==e)eras.push({e,name:ERAS[e],x:PADX+c*COLW});else continue;}
  eras.forEach((b,i)=>b.w=(eras[i+1]?.x??width)-b.x);
  const L={pos,links,eras,lanes:lanes.map((l,i)=>({k:l[0],name:l[1],y:laneTop[i]-lanePad/2,h:laneRows[i]*rowH+lanePad})),width,height,cardH,compact,budget};
  if(LAYOUT.size>=8)LAYOUT.clear();LAYOUT.set(cacheKey,L);return L;}
function chainOf(cat,key){const s=new Set(),v=x=>{if(s.has(x)||!cat[x])return;s.add(x);for(const r of cat[x].requires||[])v(r);};v(key);return s;}
// r5 "Neo-Classical" tree: flat hairline nodes with four explicit states, quiet orthogonal links, era zones.
const ERA_EN=['ANCIENT','CLASSICAL','MEDIEVAL','RENAISSANCE','INDUSTRIAL','MODERN','ATOMIC','INFORMATION','FUTURE'],ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX'];
const SV=(d,cls)=>`<svg class="b5g ${cls}" viewBox="0 0 16 16" aria-hidden="true" width="12" height="12">${d}</svg>`;
const G_CHECK=SV('<path d="M3.5 8.4l3 3 6-6.6"/>','ck'),G_LOCK=SV('<rect x="3.5" y="7.2" width="9" height="6.3" rx="1.2"/><path d="M5.6 7.2V5.3a2.4 2.4 0 0 1 4.8 0v1.9"/><path d="M8 9.6v1.6"/>','lk'),G_DOT=SV('<circle cx="8" cy="8" r="2.6"/>','dt');
const ST_LABEL={done:'已完成',cur:'研究中',avail:'可研究',locked:'未解锁'};
function nodeState(p,civic,k){const cat=civic?CIVICS:TECHS,done=new Set(civic?p.civics:p.techs),cur=civic?p.civic:p.research;return done.has(k)?'done':k===cur?'cur':cat[k].requires.every(r=>done.has(r))?'avail':'locked';}
function treeHtml(p,civic){const g=S.game,cat=civic?CIVICS:TECHS,L=layout(civic),done=new Set(civic?p.civics:p.techs),q=(codex?.q||'').trim(),sel=codex?.sel&&cat[codex.sel]?codex.sel:null,chain=sel?chainOf(cat,sel):null;
  const links=L.links.map(l=>{const s=done.has(l.to)?'done':done.has(l.from)?'open':'';const c=chain?(chain.has(l.from)&&chain.has(l.to)?' chain':' fade'):'';return `<path d="${l.d}" pathLength="1" class="${s}${c}" data-f="${l.from}" data-t="${l.to}"/>`;}).join('');
  const cards=Object.entries(cat).map(([k,s])=>{const pos=L.pos[k],st=nodeState(p,civic,k),pr=st==='done'?null:progressOf(p,k,civic),u=unlocks(k,civic),match=!q||`${s.name}${s.description}${u.map(x=>x.n).join('')}`.includes(q),c=chain?(k===sel?' sel':chain.has(k)?' chain':' fade'):'';
    const pct=pr?Math.round(pr.pct):0,turns=pr?.turns?`<b>${pr.turns}</b> 周期`:pr?`<b>${Math.ceil(pr.cost)}</b>`:'';
    const meta=st==='done'?`${G_CHECK}<span>已完成</span>`:st==='cur'?`${G_DOT}<span><b>${pct}%</b>${pr?.turns?' · '+pr.turns+' 周期':''}</span>`:st==='avail'?`<span>${turns}</span>`:`${G_LOCK}<span>${turns}</span>`;
    return `<button class="b5-node s-${st}${c}${match?(q?' hit':''):' dim'}" style="left:${pos.x-MED}px;top:${pos.y}px" data-b4-item="${k}" aria-pressed="${k===sel}" aria-label="${esc(s.name)} · ${ST_LABEL[st]}${k===sel?' · 已选中':''} · ${esc(s.description)}"><i class="b5-selring" aria-hidden="true"></i><i class="b5-ic">${ic(itemIcon(k))}</i><span class="b5-name">${esc(s.name)}${pr?.boost?`<i class="b5-boost" title="${civic?'灵感':'尤里卡'}已触发">✦</i>`:''}</span><span class="b5-st">${meta}</span><span class="b5-unl">${unlockRow(u,6)}</span>${st==='cur'||(pr&&pr.prog>0)?`<i class="b5-bar"><em style="width:${pr.pct.toFixed(1)}%"></em></i>`:''}</button>`;}).join('');
  const eras=L.eras.map((b,i)=>`<div class="b5-era ${i%2?'odd':'even'}" style="left:${b.x}px;width:${b.w}px"><em class="b5-era-big" aria-hidden="true">${esc((b.name||'').replace('时代',''))}</em><header><i>${ROMAN[b.e]||''}</i><b>${esc(b.name)}</b><small>${ERA_EN[b.e]||''} ERA</small></header></div>`).join('');
  const lanes=L.lanes.map((l,i)=>`<div class="b5-lane ${i%2?'odd':'even'}" style="top:${l.y}px;height:${l.h}px;width:${L.width}px"></div>`).join('');
  // lane labels live in a separate rail outside the scroll body (never covers cards); it follows scrollTop
  lastRail=`<div class="b5-rail-in" style="height:${L.height}px">${L.lanes.map((l,i)=>`<div class="b5-rl ${i%2?'odd':'even'}" style="top:${l.y}px;height:${l.h}px"><span>${esc(l.name)}</span></div>`).join('')}</div>`;lastEras=L.eras;
  lastStrip=`<div class="b4-cs-in" style="width:${L.width}px">${progressStrip(p,civic,L)}</div>`;
  return `<div class="b5-tree${chain?' has-sel':''}${L.compact?' compact':''}${L.cardH<46?' dense':''}" data-height-budget="${L.budget}" style="width:${L.width}px;height:${L.height}px;--tree-card-height:${L.cardH}px">${eras}${lanes}<svg class="b5-links" width="${L.width}" height="${L.height}" style="width:${L.width}px;height:${L.height}px" viewBox="0 0 ${L.width} ${L.height}">${links}</svg>${cards}</div>`;}
let lastStrip='',lastRail='',lastEras=[];
// Civ progress strip: civs at the same era collapse into one marker (portrait, or a count medallion);
// markers keep a minimum spacing and a hover/focus popover lists who is there. Rivals expose only their era.
function progressStrip(p,civic,L){const g=S.game,full=S.view<0,known=g.players.filter(o=>o.alive&&(full||o.id===p.id||p.met?.includes(o.id))),groups=new Map();
  for(const o of known){const era=o.era??0;if(!groups.has(era))groups.set(era,[]);groups.get(era).push(o);}
  const MIN=96,marks=[...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([era,list])=>{const band=L.eras.filter(x=>x.e<=era).pop()||L.eras[0];return {era,list,x:band.x+20};});
  for(let i=1;i<marks.length;i++)marks[i].x=Math.max(marks[i].x,marks[i-1].x+MIN);
  // r6b: ruled track with era segments aligned to the tree's era columns
  const myEra=p.era??0,segs=L.eras.map(b=>`<div class="b6-seg${b.e===myEra?' cur':''}" style="left:${b.x}px;width:${b.w}px"><span><i>${ROMAN[b.e]||''}</i>${esc((b.name||'').replace('时代',''))}</span></div>`).join('');
  const pins=marks.map(m=>{const me=m.list.some(o=>o.id===p.id),n=m.list.length,list=me?[m.list.find(o=>o.id===p.id),...m.list.filter(o=>o.id!==p.id)]:m.list;
    const rows=list.map(o=>{const cnt=o.id===p.id||full?((civic?o.civics:o.techs)?.length):null;return `<li class="${o.id===p.id?'me':''}" style="--civ:${esc(o.color)}">${portrait(o)}<span><b>${esc(o.name)}${o.id===p.id?' <em>（你）</em>':''}</b><small>${esc(ERAS[o.era??0]||'')}${cnt!==null&&cnt!==undefined?' · 已完成 '+cnt+(civic?' 项市政':' 项科技'):' · 具体进度未知'}</small></span></li>`;}).join('');
    const faces=list.slice(0,3).map((o,i)=>`<i class="b6-f${o.id===p.id?' me':''}" style="--civ:${esc(o.color)};z-index:${4-i}">${portrait(o)}</i>`).join('');
    return `<div class="b4-pm b6 ${me?'me':''} ${n>1?'multi':''}" style="left:${m.x}px" tabindex="0" aria-label="${esc(ERAS[m.era]||'')}：${n} 个文明${me?'（含你）':''}"><span class="b6-plq">${faces}${n>3?`<b>+${n-3}</b>`:n>1?`<b>${n}</b>`:''}${me?'<em class="b6-you">你</em>':''}</span><div class="b4-pm-pop" role="tooltip"><header><small>${ROMAN[m.era]||''} · ${esc(ERA_EN[m.era]||'')} ERA</small><strong>${esc(ERAS[m.era]||'')}</strong><span>${n} 个文明</span></header><ul>${rows}</ul></div></div>`;}).join('');
  return `<div class="b6-track" aria-hidden="true">${segs}</div>${pins}`;}
// r6 detail panel: identity | direct prerequisites + collapsible full chain (grouped by era) | unlocks | cost + action.
function detailHtml(p,civic){const cat=civic?CIVICS:TECHS,sel=codex?.sel;if(!sel||!cat[sel])return '';const s=cat[sel],done=new Set(civic?p.civics:p.techs),ctl=control(p);
  const st=nodeState(p,civic,sel),chain=chainOf(cat,sel),order=[],seen=new Set(),v=x=>{if(seen.has(x))return;seen.add(x);for(const r of cat[x].requires||[])if(chain.has(r))v(r);if(!done.has(x)&&x!==sel)order.push(x);};v(sel);
  const pr=st==='done'?null:progressOf(p,sel,civic),u=unlocks(sel,civic),boost=civic?s.inspiration:s.eureka,unit=civic?'文化':'科技',direct=(s.requires||[]).filter(r=>cat[r]);
  const glyph=x=>x==='done'?G_CHECK:x==='locked'?G_LOCK:x==='cur'?G_DOT:SV('<path d="M5 8h6M8.5 5.5L11 8l-2.5 2.5"/>','av');
  const dirDone=direct.filter(r=>done.has(r)).length;
  const dirHtml=direct.length?`<ul class="b5-dir">${direct.map(r=>{const rs=nodeState(p,civic,r);return `<li><button class="b4-dt-step s-${rs}" data-b4-item="${r}"><i class="b5-ic sm">${ic(itemIcon(r))}</i><span><b>${esc(cat[r].name)}</b><small>${glyph(rs)}${ST_LABEL[rs]}</small></span></button></li>`;}).join('')}</ul>`:'<p class="b5-none">无前置 · 起始项目</p>';
  // the rest of the chain (beyond direct prerequisites), still unfinished, grouped by era
  const deeper=order.filter(x=>!direct.includes(x)),byEra=new Map();for(const x of deeper){const e=cat[x].era;if(!byEra.has(e))byEra.set(e,[]);byEra.get(e).push(x);}
  const open=!!codex.chainOpen&&deeper.length;
  const chainHtml=deeper.length?`<div class="b5-chain${open?' open':''}"><button class="b5-chain-t" data-b5-chain aria-expanded="${open}">${SV('<path d="M6 4l4 4-4 4"/>','cv')}完整前置链 · 另需 <b>${deeper.length}</b> 项${byEra.size>1?' · 跨 '+byEra.size+' 个时代':''}</button>${open?`<div class="b5-chain-b">${[...byEra.entries()].sort((a,b)=>a[0]-b[0]).map(([e,xs])=>`<div><small>${esc(ERAS[e]||'')}</small><p>${xs.map(x=>`<button class="b4-dt-step s-${nodeState(p,civic,x)}" data-b4-item="${x}">${esc(cat[x].name)}</button>`).join('<i>·</i>')}</p></div>`).join('')}</div>`:''}</div>`:(direct.length&&st!=='done'?`<p class="b5-chain-ok">${dirDone===direct.length?'前置已全部完成':'更早的前置均已完成'}</p>`:'');
  const action=st==='avail'?`<button class="b5-btn" data-b4-research="${sel}" ${ctl?'':'disabled'}>${ctl?(civic?'开始研究此市政':'开始研究此科技'):'观战只读'}</button>`
    :st==='locked'?`<p class="b5-act-note s-locked">${G_LOCK}需先完成 ${direct.length-dirDone} 项直接前置${deeper.length?`<small>（全链共 ${order.length} 项）</small>`:''}</p>`
    :st==='cur'?`<p class="b5-act-note s-cur">${G_DOT}正在研究${pr?` · ${Math.round(pr.pct)}%`:''}</p>`:`<p class="b5-act-note s-done">${G_CHECK}已完成</p>`;
  return `<div class="b5-detail s-${st}">
   <section class="b5-d-id"><i class="b5-ic big">${ic(itemIcon(sel))}</i><div><small class="b5-eyebrow">${civic?'市政':'科技'} · ${esc(ERAS[s.era]||'')} · ${esc(ERA_EN[s.era]||'')} ERA</small><h3>${esc(s.name)}<span class="b5-pill s-${st}">${glyph(st)}${ST_LABEL[st]}</span></h3><p>${esc(s.description)}</p>${boost?`<p class="b5-boost-line"><i>✦</i>${civic?'灵感':'尤里卡'}：${esc(boost)}${pr?.boost?' <b>已触发</b>':''}</p>`:''}</div></section>
   <section class="b5-d-pre"><h6>直接前置 <span>${dirDone}/${direct.length}</span></h6>${dirHtml}${chainHtml}</section>
   <section class="b5-d-unl"><h6>解锁 <span>${u.length}</span></h6>${u.length?`<ul>${u.map(x=>`<li>${chip(x)}<span>${esc(x.n)}</span><small>${esc(UKN[x.k]||'')}</small></li>`).join('')}</ul>`:'<p class="b5-none">无直接解锁</p>'}</section>
   <section class="b5-d-cost">${pr?`<div class="b5-cost"><small>研究花费</small><strong>${num(Math.ceil(pr.cost))}</strong><em>${unit}</em></div><dl><div><dt>预计</dt><dd>${pr.turns?`<b>${pr.turns}</b> 周期`:'—'}</dd></div>${pr.prog>0?`<div><dt>进度</dt><dd><b>${Math.round(pr.pct)}%</b></dd></div>`:''}</dl>`:`<div class="b5-cost done"><small>研究花费</small><strong>—</strong><em>已完成</em></div>`}${action}<button class="b5-x" data-b4-desel aria-label="清除选择"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></section></div>`;}

/* ---------------- codex: government ---------------- */
function govHtml(p){const g=S.game,ctl=control(p);if(!p.government||!Array.isArray(p.policies))return '<p class="b4-note">他国政体与政策卡属于私人情报。请切换至全知观战或本国视野。</p>';
  if(!govDraft||govDraft.pid!==p.id||govDraft.base!==p.government+'|'+p.policies.join(','))govDraft={pid:p.id,base:p.government+'|'+p.policies.join(','),gov:p.government,cards:[...p.policies]};
  const gov=govDraft.gov,asg=assignPolicyCards(g,p,govDraft.cards,gov),status=p.politics||{cost:0,governmentCost:0,free:false,governmentReadyTurn:g.turn},changed=gov!==p.government||asg.slots.map(s=>s.card).filter(Boolean).sort().join()!==[...p.policies].sort().join(),cost=gov===p.government?status.cost:status.governmentCost;
  govDraft.cards=asg.slots.map(s=>s.card).filter(Boolean);
  const types=Object.keys(POLICY_TYPES),slotsBy=t=>asg.slots.map((s,i)=>({...s,i})).filter(s=>s.type===t);
  const card=(k,extra='',cls='')=>{const s=POLICIES[k];return `<span class="b4-pc ${s.type} ${cls}" ${extra}><i>${ic(pictoId('policy',k)||(s.type==='military'?'sword':s.type==='diplomatic'?'scales':s.type==='wildcard'?'star':'coin'))}</i><strong>${esc(s.name)}</strong><small>${esc(s.description)}</small></span>`;};
  const govs=Object.entries(GOVERNMENTS).filter(([,s])=>!s.civic||p.civics.includes(s.civic));
  return `<div class="b4-gov-head"><div class="b4-govs">${govs.map(([k,s])=>`<button class="b4-govc ${k===gov?'sel':''} ${k===p.government?'cur':''}" data-b4-gov="${k}" ${k!==p.government&&g.turn<status.governmentReadyTurn?'aria-disabled="true"':''} title="${esc(s.description)}">${ic(pictoId('gov',k)||'flag')}<strong>${esc(s.name)}</strong><small>${types.map(t=>s.slotTypes?.[t]?`<i class="d ${t}">${s.slotTypes[t]}</i>`:'').join('')}</small></button>`).join('')}</div>
   <div class="b4-gov-sum"><p>${esc(GOVERNMENTS[gov]?.description||'')}${g.turn<status.governmentReadyTurn?` · 第 ${status.governmentReadyTurn} 周期可更换政体`:''}</p><span>${ctl?'国库 '+num(p.gold)+' 金币':'观战只读 · 接管后可调整'}</span><button class="b4-btn gold" data-b4-govapply ${!ctl||!changed||(!status.free&&p.gold<cost)?'disabled':''}>${status.free?'提交 · 本次免费':'提交 · '+cost+' 金币'}</button></div></div>
   <div class="b4-gov-body"><div class="b4-slots">${types.map(t=>{const ss=slotsBy(t);if(!ss.length)return '';return `<div class="b4-slotrow ${t}"><h4>${POLICY_TYPES[t]}</h4><div>${ss.map(s=>s.card?card(s.card,`data-b4-unslot="${s.card}" role="button" tabindex="0" title="点击取下"`):`<span class="b4-pc empty ${t}"><small>空槽</small></span>`).join('')}</div></div>`;}).join('')}</div>
   <div class="b4-library">${types.map(t=>{const ks=Object.entries(POLICIES).filter(([,s])=>s.type===t&&p.civics.includes(s.civic)).map(([k])=>k);if(!ks.length)return '';return `<h4 class="${t}">${POLICY_TYPES[t]}</h4><div class="b4-lib">${ks.map(k=>card(k,`data-b4-slot="${k}" role="button" tabindex="0" title="${govDraft.cards.includes(k)?'已装备 · 点击取下':'点击装备'}"`,govDraft.cards.includes(k)?'in':'')).join('')}</div>`;}).join('')}</div></div>`;}

// Scroll sync (rAF-throttled): strip follows scrollLeft, lane rail follows scrollTop, and the era emblem behind
// the viewport crossfades between the eras under the view centre with a slight parallax. Only opacity/transform
// of a handful of fixed elements are written; nothing is re-rendered.
let scrollRaf=0;const embState=new Map(),RM=matchMedia('(prefers-reduced-motion: reduce)');
function syncScroll(el,b,force){const sl=b.scrollLeft,st=b.scrollTop,i=el.querySelector('.b4-cs-in'),r=el.querySelector('.b5-rail-in');if(i)i.style.transform=`translateX(${-sl}px)`;if(r)r.style.transform=`translateY(${-st}px)`;
  const svgs=el.querySelectorAll('.b5-emb-i');if(!svgs.length||!lastEras.length)return;const cx=sl+b.clientWidth*.5,F=Math.max(160,b.clientWidth*.22);
  if(force)embState.clear();
  lastEras.forEach((band,k)=>{const sv=svgs[k];if(!sv)return;const inside=Math.min(cx-band.x,band.x+band.w-cx),w=Math.max(0,Math.min(1,.5+inside/F)),dx=RM.matches?0:(band.x+band.w/2-cx)*.06;
    const key=w.toFixed(3)+'|'+dx.toFixed(1),prev=embState.get(sv);if(prev===key)return;embState.set(sv,key);sv.style.opacity=w.toFixed(3);sv.style.transform=`translate3d(${dx.toFixed(1)}px,0,0)`;});}
// R4: narrow viewports collapse the legend into a <details>; repaint when crossing the breakpoint (event-driven, not per frame).
const NARROW=matchMedia('(max-width:760px)');NARROW.addEventListener?.('change',()=>{const el=document.getElementById('b4-codex');if(el&&!el.hidden&&el.querySelector('.b4-cx-headwrap'))codexPaint(viewer());});
let treeResizeObserver=null;
function treeWheel(e){const el=$('b4-codex'),b=el?.querySelector('.b4-cx-body');
  if(!on||el.hidden||e.ctrlKey||!['tech','civic'].includes(codexTab)||e.target.closest('.b4-pm-pop,.b4-cx-detail')||!e.target.closest('.b5-mid,.b4-civstrip'))return;
  const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(!delta)return;
  e.preventDefault();b.scrollLeft+=delta*(e.deltaMode===1?32:e.deltaMode===2?b.clientWidth:1);}
function codexPaint(p){const el=$('b4-codex');if(!el||el.hidden||!p)return;const civicTab=codexTab==='civic'||codexTab==='gov',gpTab=codexTab.startsWith('gp');
  const head=`<header class="b4-cx-head"><small>${codexTab==='tech'?'THE PURSUIT OF KNOWLEDGE':codexTab==='civic'?'THE CIVIC TRADITION':gpTab?'THE PANTHEON OF GREAT MINDS':'THE CHARTER OF GOVERNMENT'}</small><h2>${codexTab==='tech'?'科技树':codexTab==='civic'?'市政树':gpTab?'伟人':'政体与政策'}</h2>${gpTab?`<div class="b4-tabs"><button data-b4-tab="gp" class="${codexTab==='gp'?'on':''}">${ic('star')}伟人</button><button data-b4-tab="gphist" class="${codexTab==='gphist'?'on':''}">${ic('book')}先前招募记录</button><button data-b4-tab="gpover" class="${codexTab==='gpover'?'on':''}">${ic('scales')}概览</button></div>`:''}${civicTab?`<div class="b4-tabs"><button data-b4-tab="civic" class="${codexTab==='civic'?'on':''}">${ic('lyre')}市政树</button><button data-b4-tab="gov" class="${codexTab==='gov'?'on':''}">${ic('card')}政体与政策</button></div>`:''}${codexTab==='tech'||codexTab==='civic'?`<label class="b4-find">${ic('search')}<input id="b4-find" value="${esc(codex?.q||'')}" placeholder="查找名称或解锁内容" aria-label="查找"></label><details class="b4-keyd"${NARROW.matches?'':' open'}><summary>图例</summary><span class="b4-key"><i class="s-done"></i>已完成<i class="s-avail"></i>可研究<i class="s-cur"></i>研究中<i class="s-locked"></i>未解锁<i class="s-sel"></i>选中</span></details>`:''}<button class="b4-x" data-b4-close aria-label="关闭">${ic('menu')}</button></header>`;
  const body=gpTab?gpHtml(S,p,codexTab,control(p),portrait):codexTab==='gov'?govHtml(p):treeHtml(p,codexTab==='civic');
  let h=el.querySelector('.b4-cx-headwrap'),b=el.querySelector('.b4-cx-body'),dt=el.querySelector('.b4-cx-detail');if(!h||!dt){el.innerHTML='<div class="b4-cx-headwrap"></div><div class="b5-mid"><div class="b5-emb" aria-hidden="true"></div><div class="b5-rail" aria-hidden="true"><header>分支</header><div class="b5-rail-clip"></div></div><div class="b4-cx-body" tabindex="0"></div></div><div class="b4-civstrip" aria-label="列国进度"><small><b>列国进度</b><i>仅已相遇</i></small><div class="b4-cs-clip"></div></div><div class="b4-cx-detail"></div>';h=el.querySelector('.b4-cx-headwrap');b=el.querySelector('.b4-cx-body');dt=el.querySelector('.b4-cx-detail');
    // the strip lives outside the scroll body (so it never covers cards) and follows its horizontal scroll
    b.addEventListener('scroll',()=>{if(!scrollRaf)scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;syncScroll(el,b);});},{passive:true});
    el.addEventListener('wheel',treeWheel,{passive:false});treeResizeObserver?.disconnect();treeResizeObserver=new ResizeObserver(()=>{
      if(!on||el.hidden||!['tech','civic'].includes(codexTab))return;const t=b.querySelector('.b5-tree');
      if(t&&+t.dataset.heightBudget!==Math.max(140,Math.floor(b.clientHeight)-2)){
        codexPaint(viewer());const node=codex?.sel&&b.querySelector(`[data-b4-item="${codex.sel}"]`);node?.scrollIntoView({block:'nearest',inline:'nearest'});b.scrollTop=0;}
    });treeResizeObserver.observe(b);}
  const active=document.activeElement?.id==='b4-find';if(!active)set(h,head);const tree=codexTab==='tech'||codexTab==='civic',cs=el.querySelector('.b4-civstrip');set(b,body);cs.hidden=!tree;const mid=el.querySelector('.b5-mid');mid.classList.toggle('is-tree',tree);
  if(tree){set(cs.querySelector('.b4-cs-clip'),lastStrip);set(el.querySelector('.b5-rail-clip'),lastRail);set(el.querySelector('.b5-emb'),lastEras.map(b=>`<svg class="b5-emb-i" data-e="${b.e}" viewBox="${RELIEF_VIEWBOX}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:0">${ERA_RELIEFS[b.e]||''}</svg>`).join(''));syncScroll(el,b,true);
    if(codex.fresh){codex.fresh=false;const t=b.querySelector('.b5-tree');t?.classList.add('fresh');clearTimeout(codexPaint.ft);codexPaint.ft=setTimeout(()=>t?.classList.remove('fresh'),900);}}set(dt,codexTab==='tech'||codexTab==='civic'?detailHtml(p,codexTab==='civic'):'');}
export function openCodex(tab){const el=$('b4-codex');if(!el)return;codexTab=tab;codex={q:'',sel:null};govDraft=null;el.hidden=false;document.documentElement.classList.add('b4-codex-open');el.dataset.tab=tab;const h=el.querySelector('.b4-cx-headwrap');if(h)h.dataset.h='';codexPaint(viewer());requestAnimationFrame(()=>{const cur=el.querySelector('.b5-node.s-cur')||el.querySelector('.b5-node.s-avail');cur?.scrollIntoView({block:'center',inline:'center'});});}
function closeCodex(){const el=$('b4-codex');if(!el)return;el.hidden=true;document.documentElement.classList.remove('b4-codex-open');}

/* ---------------- ages dialog ---------------- */
const AGE_IC={g_inquiry:'flask',g_monument:'column',g_pax:'scales',g_valor:'swords',g_caravan:'coin',g_abundance:'wheat',n_steady:'gear',n_scholar:'book',n_patron:'lyre',n_treasury:'coin',n_garrison:'shield',d_isolation:'hammer',d_warlords:'sword',d_monastic:'temple',d_hoard:'gem',d_resolve:'shield'};
const MOMENT={eraFirst:'世界首个进入新时代',era:'进入新时代',tech:'世界首个完成科技',civic:'世界首个完成市政',city:'建立城市',wonder:'奇观落成',greatperson:'招募伟人',religion:'创立宗教',conquest:'征服城市',alliance:'结成同盟',space:'太空计划',dedication:'献礼目标达成'};
const momentText=m=>{if(m.key==='dedication')return '献礼目标达成'+(m.text?' · '+String(m.text):'');const name=m.key==='tech'?TECHS[m.text]?.name:m.key==='civic'?CIVICS[m.text]?.name:m.key==='wonder'?WONDERS[m.text.replace('奇观落成：','')]?.name:m.key==='eraFirst'||m.key==='era'?ERAS[+m.text]:m.key==='alliance'?S.game.players[+m.text]?.short:null;return (MOMENT[m.key]||m.key)+(name?' · '+name:m.key==='city'||m.key==='conquest'||m.key==='greatperson'?' · '+m.text.replace(/^建立 /,''):'');};
const AG_MARK={target:'<svg class="ag-g" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="3.4"/><circle cx="8" cy="8" r=".9" fill="currentColor"/></svg>',
 condition:'<svg class="ag-g" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.6 9.4l2.8-2.8M5.4 7.6l-1.6 1.6a2.3 2.3 0 0 0 3.2 3.2l1.6-1.6M10.6 8.4l1.6-1.6a2.3 2.3 0 0 0-3.2-3.2L7.4 5.2"/></svg>',
 cost:'<svg class="ag-g" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M4 13.5h8M2.5 5.5h11M4.5 5.5L2.6 10h3.8zM11.5 5.5L9.6 10h3.8z"/></svg>'};
const AG_MARK_T='<svg class="ag-g" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><circle cx="8" cy="8" r="3.4"/><circle cx="8" cy="8" r=".9" fill="currentColor"/></svg>';
function agCard(c,i,t,m){const on=agePick.includes(c.key),tier=c.tier||t,art=AGE_ART[c.artKey],sem=c.semantic||m.semantic,did='ag-d-'+i,eN=e=>String(ERAS[e]??e).replace(/时代$/,''),sub=c.themeLabel&&c.themeLabel!==c.name?c.themeLabel:String(AGE_TIERS[tier]?.name||'').replace(/时代$/,'')+(c.eraMin!=null?' · '+eN(c.eraMin)+(c.eraMax!=null&&c.eraMax!==c.eraMin?'–'+eN(c.eraMax):''):'');
  return `<button type="button" class="b4-bonus ag-card ${esc(tier)} ${on?'on':''}" data-b4-bonus="${esc(c.key)}" aria-pressed="${on}" aria-describedby="${did}">
<span class="ag-art" aria-hidden="true">${art?`<svg viewBox="${AGE_ART_VIEWBOX}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${art}</svg>`:`<i>${ic(AGE_IC[c.key]||'star')}</i>`}<span class="ag-check"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span></span>
<span class="ag-theme">${esc(sub)}</span><strong>${esc(c.name)}</strong><span class="ag-sum">${esc(c.summary)}</span>${c.objective?`<span class="ag-obj" title="${esc(c.objective.label)}">${AG_MARK_T}<span>${esc(c.objective.label)}</span>${c.objective.cap?`<u aria-label="上限 ${c.objective.cap} 时代分">${Array.from({length:Math.min(12,c.objective.cap)},()=>'<i></i>').join('')}</u>`:''}</span>`:''}
<span class="ag-tags">${c.tags.map(x=>`<i>${esc(tagLabel(x))}</i>`).join('')}<b class="ag-mark m-${sem}" title="${esc(m.semanticLabel)}">${AG_MARK[sem]}${esc(c.mark||(sem==='target'?'时代分':sem==='cost'?'代价':'条件'))}</b></span>
<span class="ag-more" id="${did}" role="tooltip"><b>${esc(c.name)}</b>${esc(c.description)}${c.eraMin!=null?`<small>适用：${esc(ERAS[c.eraMin]||c.eraMin)}${c.eraMax!=null&&c.eraMax!==c.eraMin?' – '+esc(ERAS[c.eraMax]||c.eraMax):''}</small>`:''}</span></button>`;}
// test/preview only: renders arbitrary card keys with the production card markup (no state, no actions)
export function ages2CardSheet(keys){const keep=agePick;agePick=[];try{return keys.map((k,i)=>{const c=ageChoiceModel({age:{pending:{tier:'normal',count:1,options:[k]}}},AGE_BONUSES,AGE_TIERS).cards[0];return c?agCard(c,100+i,c.tier||'normal',{semantic:c.semantic,semanticLabel:''}):'';}).join('');}finally{agePick=keep;}}
let agePick=[];
function ageDialog(me,mode){const d=$('b4-age');if(!d)return;const g=S.game,a=me.age,A=g.ages;
  if(mode==='pick'&&a.pending){const m=ageChoiceModel(me,AGE_BONUSES,AGE_TIERS),t=m.tier,keys=m.cards.map(c=>c.key);agePick=agePick.filter(k=>keys.includes(k));
    if(m.overflow||m.countMismatch)console.warn('[AGES2] pending contract violation',{options:a.pending.options,count:a.pending.count});
    const era=m.era??me.era??0,picked=m.cards.filter(c=>agePick.includes(c.key)),err=selectionError(m,agePick);
    d.className='ag2 t-'+t;d.dataset.era=era;
    d.innerHTML=`<div class="b4-dlg age ag2-dlg" role="document"><header class="ag-head"><span class="ag-medal" aria-hidden="true"><svg viewBox="${RELIEF_VIEWBOX}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${ERA_RELIEFS[era]||''}</svg></span><span class="ag-title"><small>${t==='heroic'?'A HEROIC AGE':t==='golden'?'A GOLDEN AGE':t==='dark'?'A DARK AGE':'A NEW AGE'} · ${esc(ERAS[era]||'')}</small><h2>${esc(me.name)}进入${esc(m.tierName)}</h2><span class="ag-rule"><b class="ag-tierbadge">${esc(m.tierName)}</b><b>选择 ${m.count} 项</b><b class="ag-sem m-${m.semantic}">${AG_MARK[m.semantic]}${esc(m.semanticLabel)}</b><b>持续至下次时代更替</b></span></span></header>
<div class="b4-bonuses ag-cards n${m.cards.length}" role="group" aria-label="时代献礼候选（${m.count===3?'多选 3 项':'单选'}）">${m.cards.map((c,i)=>agCard(c,i,t,m)).join('')}</div>
<footer class="ag-foot"><span class="ag-picked" aria-live="polite"><span class="b4-pick">${agePick.length} / ${m.count}</span>${picked.map(c=>`<i class="ag-chip">${esc(c.name)}</i>`).join('')||'<i class="ag-chip none">尚未选择</i>'}</span>${m.countMismatch?'<span class="ag-warn">候选数量不足，等待服务器数据</span>':''}<span class="b4-dlg-actions"><button class="b4-btn ghost" data-b4-agelater>稍后（${Math.max(0,m.deadline-g.turn)} 周期内）</button><button class="b4-btn gold" data-b4-ageconfirm ${err||!control(me)?'disabled':''}>确认献礼</button></span></footer></div>`;
  }else{const hist=[...(a.history||[]),{index:A.index,tier:a.tier,score:a.score,moments:a.moments,current:true}];
    d.className='t-hist';d.innerHTML=`<div class="b4-dlg hist"><small>THE CHRONICLE OF AGES</small><h2>时代史册 · ${esc(me.name)}</h2><p>每 ${A.length} 个经济周期为一个时代。本时代：黑暗 &lt; ${A.thresholds.dark} ≤ 普通 &lt; ${A.thresholds.golden} ≤ 黄金；黑暗时代中达到黄金门槛将迎来英雄时代。当前加成：${(a.bonuses||[]).map(k=>esc(AGE_BONUSES[k]?.name||k)).join('、')||'无'}。</p>${agObjPanel(me)}<ol class="b4-timeline">${hist.map(h=>`<li class="t-${h.tier} ${h.current?'cur':''}"><i class="b4-wax">${ic(h.tier==='dark'?'moon':h.tier==='normal'?'hourglass':'sun')}</i><strong>第 ${h.index+1} 时代 · ${esc(AGE_TIERS[h.tier]?.name)}</strong><b>${h.score??'—'} 分${h.current?' · 进行中':''}</b><ul>${(h.moments||[]).slice(0,6).map(m=>`<li><em>+${m.points}</em>${esc(momentText(m))}</li>`).join('')||'<li class="none">暂无历史时刻</li>'}</ul></li>`).join('')}</ol><div class="b4-dlg-actions">${a.pending&&control(me)?'<button class="b4-btn gold" data-b4-ageopen>选择时代加成</button>':''}<button class="b4-btn" data-b4-ageclose>合上史册</button></div></div>`;}
  if(!d.open)d.showModal();}

/* ---------------- events ---------------- */
function onOpenPanel(e){
  if(!on||!S?.game)return;
  const name=e.detail?.name,tab={tech:'tech',civic:'civic',greatpeople:'gp'}[name],me=viewer();
  // Shared pages must also dismiss the codex instead of leaving it behind a modal.
  closeCodex();$('b4-age')?.close();
  if(!tab&&!(name==='age'&&me?.age))return;
  e.preventDefault();UI().closeModal?.();build();
  if(tab)openCodex(tab);else ageDialog(me,me.age.pending&&control(me)?'pick':'hist');
}
async function onClick(e){const t=e.target;
  const modelError=t.closest?.('.b4-model-error');if(modelError){e.preventDefault();e.stopPropagation();document.dispatchEvent(new CustomEvent('hex:model-observe',{detail:{seat:Number(modelError.closest('[data-b4-leader]').dataset.b4Leader)}}));return;}
  const close=t.closest('[data-b4-close]');if(close){closeCodex();return;}
  const rm=t.closest('[data-research-modal]');if(rm){e.preventDefault();e.stopPropagation();UI().openModal?.(rm.dataset.researchModal);return;}
  const cx=t.closest('[data-b4-codex]');if(cx){e.preventDefault();e.stopPropagation();UI().openModal?.(cx.dataset.b4Codex==='gp'?'greatpeople':cx.dataset.b4Codex);return;}
  const tab=t.closest('[data-b4-tab]');if(tab){codexTab=tab.dataset.b4Tab;if(codex)codex.sel=null;$('b4-codex').dataset.tab=codexTab;govDraft=null;codexPaint(viewer());return;}
  if(t.closest('[data-b5-chain]')&&codex){codex.chainOpen=!codex.chainOpen;codexPaint(viewer());return;}
  const item=t.closest('[data-b4-item]');if(item&&codex){const k=item.dataset.b4Item;const was=codex.sel;codex.sel=codex.sel===k&&!item.classList.contains('b4-dt-step')?null:k;if(codex.sel!==was){codex.fresh=!!codex.sel;codex.chainOpen=false;}codexPaint(viewer());if(codex.sel)requestAnimationFrame(()=>$('b4-codex')?.querySelector(`.b5-node[data-b4-item="${codex.sel}"]`)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'}));return;}
  const rs=t.closest('[data-b4-research]');if(rs){const p=viewer();if(rs.disabled||!p||!control(p))return;rs.disabled=true;try{await UI().act?.({type:codexTab==='tech'?'research':'civic',item:rs.dataset.b4Research},p.id);}finally{if(codex)codex.sel=null;codexPaint(viewer());}return;}
  if(t.closest('[data-b4-desel]')||(codex?.sel&&t.closest('#b4-codex .b4-cx-body'))){if(codex)codex.sel=null;codexPaint(viewer());return;}
  const gv=t.closest('[data-b4-gov]');if(gv){if(gv.getAttribute('aria-disabled')==='true')return;govDraft.gov=gv.dataset.b4Gov;codexPaint(viewer());return;}
  const sl=t.closest('[data-b4-slot]');if(sl){const k=sl.dataset.b4Slot,p=viewer();if(!control(p))return;if(govDraft.cards.includes(k))govDraft.cards=govDraft.cards.filter(x=>x!==k);else{const next=[...govDraft.cards,k],asg=assignPolicyCards(S.game,p,next,govDraft.gov);if(!asg.remaining.length)govDraft.cards=next;else UI().toast?.('没有可容纳此卡的空槽。',true);}codexPaint(p);return;}
  const us=t.closest('[data-b4-unslot]');if(us){if(!control(viewer()))return;govDraft.cards=govDraft.cards.filter(x=>x!==us.dataset.b4Unslot);codexPaint(viewer());return;}
  const ap=t.closest('[data-b4-govapply]');if(ap){const p=viewer(),st=p.politics||{};ap.disabled=true;const gov=govDraft.gov;try{await UI().act?.({type:gov===p.government?'policies':'government',...(gov!==p.government?{item:gov}:{}),items:govDraft.cards.slice(),expectedCost:gov===p.government?st.cost:st.governmentCost},p.id);}finally{govDraft=null;codexPaint(viewer());}return;}
  const gpb=t.closest('[data-b4-gp]');if(gpb){const me=viewer();if(!me||gpb.disabled)return;gpb.disabled=true;try{await gpAct(UI,me,gpb.dataset.b4Gp,gpb.dataset.k);}finally{if(gpb.isConnected)gpb.disabled=false;}return;}
  const leader=t.closest('[data-b4-leader]');if(leader){e.preventDefault();UI().openLeader?.(+leader.dataset.b4Leader);return;}
  const md=t.closest('[data-b4-modal]');if(md){if(!$('b4-codex')?.hidden)closeCodex();UI().openModal?.(md.dataset.b4Modal);return;}
  const tk=t.closest('[data-b4-tracker]');if(tk){trackerOpen=!trackerOpen;try{localStorage.setItem('hex.uiB.tracker',trackerOpen?'1':'0');}catch{}paint(S,true);return;}
  const rt=t.closest('[data-b4-roster]');if(rt){rosterOpen=!rosterOpen;try{localStorage.setItem('hex.uiB.roster',rosterOpen?'1':'0');}catch{}paint(S,true);return;}
  const fd=t.closest('[data-b4-feed]');if(fd){feedOpen=!feedOpen;document.documentElement.classList.toggle('b4-feed-collapsed',!feedOpen);try{localStorage.setItem('hex.uiB.feed',feedOpen?'1':'0');}catch{}return;}
  const ch=t.closest('[data-b4-chron]');if(ch){chronicleOpen=!chronicleOpen;paint(S,true);return;}
  const of=t.closest('[data-b4-offer]');if(of){UI().openOffer?.(+of.dataset.b4Offer);return;}
  const tl=t.closest('[data-b4-tile]');if(tl){jump(+tl.dataset.b4Tile,!!tl.dataset.b4Pulse);if(tl.dataset.b4Pulse){$('b4-mm-results').hidden=true;}return;}
  const mm=t.closest('[data-b4-mainmenu]');if(mm){e.preventDefault();e.stopPropagation();const d=$('b4-mainmenu-dlg'),connected=!!S?.session?.role;d.querySelector('.b4-dlg-msg').textContent='';d.querySelector('.b4-dlg>p').textContent=connected?'对局将继续运行；可在菜单中调整界面与声音。':'对局将暂停。快速保存会写入一个新的手动存档，不覆盖自动存档。';d.querySelector('[data-b4-menu="save"]').disabled=connected;d.showModal();return;}
  const mo=t.closest('[data-b4-menu]');if(mo){const d=$('b4-mainmenu-dlg'),msg=d.querySelector('.b4-dlg-msg'),k=mo.dataset.b4Menu;if(k==='back'){d.close();return;}
    if(k==='save'){d.querySelectorAll('button').forEach(b=>b.disabled=true);msg.textContent='正在快速保存…';try{const r=await UI().api('save',{label:`快速保存 · 第 ${S.game.turn} 周期`});msg.textContent='已保存：'+(r?.file||'');d.close();await UI().showStartMenu?.();}catch(err){msg.textContent='保存失败：'+err.message;}finally{d.querySelectorAll('button').forEach(b=>b.disabled=false);}return;}
    if(k==='leave'){d.close();await UI().showStartMenu?.();return;}}
  const ah=t.closest('[data-b4-agehist]');if(ah){const me=viewer();if(me?.age)ageDialog(me,'hist');return;}
  const ao=t.closest('[data-b4-ageopen]');if(ao){const me=viewer();if(me)ageDialog(me,'pick');return;}
  const bn=t.closest('[data-b4-bonus]');if(bn){const me=viewer(),pd=me?.age?.pending;if(!pd)return;const k=bn.dataset.b4Bonus;agePick=agePick.includes(k)?agePick.filter(x=>x!==k):pd.count===1?[k]:[...agePick,k].slice(-pd.count);ageDialog(me,'pick');$('b4-age')?.querySelector(`[data-b4-bonus="${CSS.escape(k)}"]`)?.focus({preventScroll:true});return;}
  const ac=t.closest('[data-b4-ageconfirm]');if(ac){const me=viewer();ac.disabled=true;try{await UI().act?.({type:'ageBonus',items:agePick.slice()},me.id);agePick=[];$('b4-age').close();}catch{ac.disabled=false;}return;}
  const al=t.closest('[data-b4-agelater]');if(al){const me=viewer();ageDismissed.add(me.id+':'+me.age.pending?.index);$('b4-age').close();return;}
  if(t.closest('[data-b4-ageclose]')){$('b4-age').close();return;}
  if(!t.closest('#b4-mmsearch'))$('b4-mm-results')&&($('b4-mm-results').hidden=true);
}
function onInput(e){if(e.target.id==='b4-find'){codex.q=e.target.value;const b=$('b4-codex').querySelector('.b4-cx-body');const p=viewer();set(b,treeHtml(p,codexTab==='civic'));const hit=b.querySelector('.b5-node.hit');hit?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}}
function onKey(e){if(e.key==='Escape'&&!$('b4-codex')?.hidden){e.stopPropagation();if(codex?.sel){codex.sel=null;codexPaint(viewer());return;}closeCodex();}}
// Hover preview: light up only the hovered card's direct connectors (class toggles, no re-render).
const TIP_SRC={effect:RESEARCH_EFFECTS,project:PROJECTS,unit:UNITS,building:BUILDINGS,wonder:WONDERS,imp:IMPROVEMENTS,policy:POLICIES,gov:GOVERNMENTS,res:RESOURCES};
function chipTip(e){const c=e.target.closest?.('.b4-u[data-tip]'),t=$('b4-tip');if(!t)return;if(!c){if(!t.hidden){t.hidden=true;t.dataset.k='';}return;}const k=c.dataset.tip;if(t.dataset.k!==k){t.dataset.k=k;const [kind,id,name]=k.split('|'),spec=TIP_SRC[kind]?.[id]||{},u={k:kind,id,n:name,t:spec.type};
    const extra=kind==='unit'&&spec.strength?`战斗力 ${spec.strength}${spec.moves?' · 移动 '+spec.moves:''}`:kind==='wonder'&&spec.englishName?esc(spec.englishName):kind==='policy'?esc(POLICY_TYPES[spec.type]||''):'';
    t.innerHTML=`${chip(u,'xl')}<div><small>${esc(UKN[kind]||'')}${extra?' · '+extra:''}</small><strong>${esc(name)}</strong>${spec.description?`<p>${esc(spec.description)}</p>`:''}</div>`;}
  t.hidden=false;const r=c.getBoundingClientRect(),w=t.offsetWidth,h=t.offsetHeight;let x=r.left+r.width/2-w/2,y=r.top-h-10;if(y<8)y=r.bottom+10;x=Math.max(8,Math.min(innerWidth-w-8,x));t.style.left=x+'px';t.style.top=y+'px';}
let hovKey=null;function onOver(e){chipTip(e);const c=e.target.closest?.('#b4-codex .b5-node');const k=c?.dataset.b4Item||null;if(k===hovKey)return;const svg=$('b4-codex')?.querySelector('.b5-links');if(!svg){hovKey=null;return;}
  if(hovKey)svg.querySelectorAll('path.pv').forEach(x=>x.classList.remove('pv'));hovKey=k;if(k)svg.querySelectorAll(`path[data-t="${k}"],path[data-f="${k}"]`).forEach(x=>x.classList.add('pv'));}

/* ---------------- public ---------------- */
export function mount(){if(on)return;on=true;try{trackerOpen=localStorage.getItem('hex.uiB.tracker')!=='0';rosterOpen=localStorage.getItem('hex.uiB.roster')==='1';feedOpen=localStorage.getItem('hex.uiB.feed')!=='0';}catch{}document.documentElement.classList.toggle('b4-feed-collapsed',!feedOpen);document.addEventListener('hex:open-panel',onOpenPanel);document.addEventListener('hex:close-panel',()=>{closeCodex();$('b4-age')?.close();});document.addEventListener('click',onClick,true);document.addEventListener('input',onInput);document.addEventListener('keydown',onKey,true);document.addEventListener('mouseover',onOver);
}
export function paint(state,force){if(!on||!state?.game)return;S=state;build();const me=viewer();if(!me)return;
  const roster=$('b-roster'),rp=$('b4-rpanel');if(roster&&rp&&roster.parentNode!==rp)rp.append(roster);document.documentElement.classList.toggle('b4-roster-open',rosterOpen);
  set($('b-yields'),yieldsHtml(me));
  let am=$('b4-agemeter');if(!am){const dock=$('b4-age-dock');if(dock){am=document.createElement('div');am.id='b4-agemeter';dock.append(am);}}set(am,ageMeter(me));
  set($('b4-tracker'),tracker(me));set($('b4-ribbon'),ribbon(me));set($('b4-feed'),feed(me));
  codexPaint(me);
  const pd=me.age?.pending,key=me.id+':'+pd?.index;if(pd&&control(me)&&!ageDismissed.has(key)&&lastAgeShown!==key&&!$('b4-age')?.open&&!document.querySelector('#modal[open],#peace-audience[open]')&&$('start-menu')?.hidden!==false){lastAgeShown=key;agePick=[];ageDialog(me,'pick');}
  if(force)return;}
