// Civ-style HUD additions: selected-unit command dock and World Rankings drawer.
// The dock never issues gameplay itself: every round icon proxies the authoritative
// inspector button that app.js already rendered (and gated) for the selected unit.
// The drawer reads only victory data the server already shares with this perspective.
import {VICTORY_NAMES,DIPLOMATIC_TARGET} from '/victory-rules.mjs';
import {LEADERS,PROJECTS,leaderFor} from '/rules.mjs';

const svg=(d,extra='')=>`<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}><path d="${d}"/></svg>`;
const ICONS={
 found:'M2 21V10l6-7 6 7v11h-4v-7H6v7zm14 0V9l4-4 4 4v12h-3v-8h-2v8z',
 fortify:'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z',
 heal:'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
 attack:'M2 2l5 1 13 14-3 3L3 7zm20 0-5 1-5 5 3 3 6-4zM2 19l3 3 7-7-3-3zM2 16l6 6 2-2-6-6zm12-12 6 6 2-2-6-6z',
 attackCityState:'M2 22V7h3V3h3v4h3V3h3v4h3v15h-5v-6H7v6zm16-20 6 6h-4v7h-3V8h-4z',
 improve:'M14 3 9 8l2 2-8 8 3 3 8-8 2 2 5-5z',
 chop:'M13 3c4 0 7 3 7 7l-5-1-9 12-3-2 9-12z',
 spread:'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v4h-2zm0 18h2v4h-2zM1 11h4v2H1zm18 0h4v2h-4z',
 buildFort:'M3 21V9h3V6h3v3h2V6h2v3h2V6h3v3h3v12h-7v-5h-4v5z',
 buildRoad:'M9 2h2l-1 20H6zm4 0h2l3 20h-4zM11.5 5h1v3h-1zm0 6h1v3h-1z',
 repair:'M21 7a5 5 0 0 1-7 4.6L6 19.6 4.4 18l8-8A5 5 0 0 1 17 3l-3 3 1 3 3 1z',
 pillage:'M12 2c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3 1-5 1-7z',
 plunderTrade:'M10 2a8 8 0 0 0-8 8h4a4 4 0 0 1 8 0h4a8 8 0 0 0-8-8zM2 14h13v-4l8 7-8 7v-5H2z',
 jump:'M12 2 5 12h5l-2 10 9-12h-5l2-8z',
 move:'M12 1l5 5h-3v4h4V7l5 5-5 5v-3h-4v4h3l-5 5-5-5h3v-4H6v3l-5-5 5-5v3h4V6H7z',
 upgrade:'M12 3 4 12h5v9h6v-9h5z',
 cancel:'M6 4 4 6l6 6-6 6 2 2 6-6 6 6 2-2-6-6 6-6-2-2-6 6z',
 patrol:'M12 3a9 9 0 1 0 9 9h-3a6 6 0 1 1-6-6V3zm2 0v6l5-3z',
 cancelPatrol:'M6 4 4 6l6 6-6 6 2 2 6-6 6 6 2-2-6-6 6-6-2-2-6 6z',
 nuke:'M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 2a10 10 0 0 1 8.7 5l-6 3.4A3 3 0 0 0 12 9zM3.3 7A10 10 0 0 1 12 2v7a3 3 0 0 0-2.6 1.5zM12 22a10 10 0 0 1-8.7-5l6-3.4a3 3 0 0 0 5.4 0l6 3.4A10 10 0 0 1 12 22z',
 recallEnvoy:'M10 4 2 12l8 8v-5h10V9H10z',
 destroyFort:'M3 21V9h3V6h3v3h2V6h2v3h2V6h3v3h3v12zM5 5l14 14',
 destroyRoad:'M9 2h2l-1 20H6zm4 0h2l3 20h-4z',
 mission:'M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z',
 greatPerson:'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-7 18c0-4 3-7 7-7s7 3 7 7z',
 eye:'M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z'
};
const LINE_ICONS={
 linkUnits:'M10 7L13 4A5 5 0 0 1 20 11L17 14M14 17L11 20A5 5 0 0 1 4 13L7 10M8 16L16 8',
 unlinkUnits:'M10 5L12 3A5 5 0 0 1 21 10L19 12M5 10L3 12A5 5 0 0 0 10 21L12 19M3 3L21 21',
 separate:'M10 4L3 10 10 16M3 10H12M14 8L21 14 14 20M21 14H12',
 rebase:'M2 18H22M12 3V14M5 8L12 4 19 8M8 13L12 11 16 13',
 buildTunnel:'M3 21V10A9 9 0 0 1 21 10V21M7 21V11A5 5 0 0 1 17 11V21M9 21L10 15M15 21L14 15',
 buildAirstrip:'M3 21L7 3H17L21 21ZM12 5V8M12 12V15M12 19V21',
 buildMissileSilo:'M3 20H21M8 20V9Q8 4 12 1Q16 4 16 9V20M8 13H16M11 6H13'
};
// Rich multi-part icon: cast shadow, ivory-metal body (paint server #hm-ivory-metal from materials.js), specular rim, engraved bezel ring.
const icon=k=>{const line=!!LINE_ICONS[k],d=LINE_ICONS[k]||ICONS[k]||ICONS.mission,cap=line?' stroke-linecap="round" stroke-linejoin="round"':'';return `<svg viewBox="0 0 24 24" aria-hidden="true" class="hm-ic${line?' hm-line':''}"><circle class="hm-ring" cx="12" cy="12" r="11.2"/><path class="hm-sh" d="${d}" transform="translate(.55 .85)"${cap}/><path class="hm-body" d="${d}"${cap}/>${line?'':`<path class="hm-hl" d="${d}" transform="translate(-.25 -.35)" clip-path="inset(0 0 55% 0)"/>`}</svg>`;};
const dockEl=()=>{let d=document.getElementById('civ-unit-dock');if(!d){d=document.createElement('section');d.id='civ-unit-dock';d.setAttribute('aria-label','选中单位指令');d.hidden=true;(document.getElementById('app')||document.body).append(d);}return d;};

function positionUnitDock(){
 const d=document.getElementById('civ-unit-dock');if(!d||d.hidden)return;
 const task=document.querySelector('.pt-dock'),hasTask=task&&!task.hidden&&getComputedStyle(task).display!=='none',narrow=innerWidth<620;
 d.style.right=hasTask?(narrow?'132px':'188px'):'26px';
 const otherTops=[...document.querySelectorAll('#city-workshop-launcher,#b4-age-dock')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>r.top);
 d.style.bottom=hasTask?'92px':(otherTops.length?Math.max(120,innerHeight-Math.min(...otherTops)+12):190)+'px';
 d.style.maxWidth=hasTask?(narrow?'calc(100vw - 148px)':'calc(100vw - 220px)'):'calc(100vw - 32px)';
}
addEventListener('resize',()=>requestAnimationFrame(positionUnitDock));
/** Render or hide the dock. `u` is the selected unit (or null); `inspector` the freshly rendered inspector node. */
export function updateUnitDock(u,options={}){
 const {spec,glyph,name,control,esc,ownerColor,allowance,loadActions,actionKey}=options;
 const d=dockEl();document.getElementById('app')?.classList.toggle('has-unit-command',!!(u&&spec));
 if(!u||!spec){document.getElementById('app')?.classList.remove('unit-details-open');d.hidden=true;d.innerHTML='';delete d.dataset.sig;return;}
 d.currentUnit=u?.id;if(!control){d.actionKey=null;d.legalActions=null;}
 if(control&&loadActions&&actionKey!==d.actionKey){
  d.actionKey=actionKey;d.legalActions=null;
  loadActions().then(obs=>{if(d.actionKey!==actionKey||d.currentUnit!==u.id||d.hidden)return;d.legalActions=obs.legalActions.filter(a=>a.unit===u.id);updateUnitDock(u,options);}).catch(()=>{if(d.actionKey===actionKey){d.actionKey=null;d.legalActions=null;}});
 }
 const allowed=b=>{if(b.disabled)return false;if(!loadActions)return true;const list=d.legalActions;if(!list)return false;
  const action=b.dataset.unitAction||b.dataset.engineerAction||(b.dataset.unitUpgrade?'upgrade':null);
  if(b.id==='cancel-unit-order')return true;
  if(b.hasAttribute('data-open-great-person'))return true;
  if(b.hasAttribute('data-civilian-mission'))return list.some(a=>['excavate','establishPark','concert','religiousHeal'].includes(a.type));
  return list.some(a=>(a.type===action||action==='attack'&&a.type==='attackCityState')&&(!b.dataset.unitUpgrade||a.item===b.dataset.unitUpgrade));
 };
 const inspector=document.getElementById('inspector'),maxHp=u.maxHp||spec.maxHp||100,hp=Math.round(u.hp),pct=Math.max(0,Math.min(100,hp/maxHp*100));
 const sources=control&&inspector?[...inspector.querySelectorAll('[data-unit-action],[data-unit-upgrade],[data-engineer-action],[data-civilian-mission],[data-open-great-person],#cancel-unit-order')]:[];
 const keyOf=b=>b.dataset.unitAction?'a:'+b.dataset.unitAction:b.dataset.engineerAction?'e:'+b.dataset.engineerAction:b.dataset.unitUpgrade?'u:'+b.dataset.unitUpgrade:b.hasAttribute('data-civilian-mission')?'m':b.hasAttribute('data-open-great-person')?'g':'c',iconOf=b=>b.dataset.unitAction||b.dataset.engineerAction||(b.dataset.unitUpgrade?'upgrade':b.hasAttribute('data-civilian-mission')?'mission':b.hasAttribute('data-open-great-person')?'greatPerson':'cancel');
 const seen=new Set(),buttons=sources.filter(allowed).filter(b=>b.dataset.unitAction!=='attackCityState'||!sources.some(s=>s.dataset.unitAction==='attack')).filter(b=>{const k=keyOf(b);if(seen.has(k))return false;seen.add(k);return true;});
 const stats=[['hp',`${hp}/${maxHp}`,'生命值'],['mv',`${Math.max(0,Math.round((u.moves??0)*10)/10)}/${allowance??'—'}`,'移动力 / 单次上限'],spec.strength?['st',spec.strength,'近战强度']:null,spec.ranged&&u.ranged!==false?['rg',spec.ranged,'远程强度']:null,spec.defense?['df',spec.defense,'防御']:null].filter(Boolean);
 const html=`<div class="cud-medal" title="${esc(name)}">${glyph}</div><div class="cud-body"><header><strong>${esc(name)}</strong><small title="单位 #${u.id}">${u.level?'★ '+u.level:''}</small></header><div class="cud-health" title="生命值 ${hp} / ${maxHp}"><span style="width:${pct}%;--hpc:${pct>60?'#5f9c6a':pct>30?'#c9a24a':'#b7412e'}"></span></div><dl class="cud-stats">${stats.map(([k,v,t])=>`<div class="cud-${k}" title="${t}"><dt>${{hp:'♥',mv:'➜',st:'⚔',rg:'➶',df:'⛨'}[k]}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="cud-actions" role="toolbar" aria-label="单位指令">${buttons.map(b=>{const key=iconOf(b),label=(b.textContent||'').replace(/^[^\p{L}\p{N}]+/u,'').trim();return `<button type="button" class="cud-act cud-${key}" data-cud-key="${esc(keyOf(b))}" title="${esc(label)}" aria-label="${esc(label)}" ${b.disabled?'disabled':''}>${icon(key)}</button>`;}).join('')||`<span class="cud-readonly" title="${control?'当前没有可用指令':'只读视角 · 不能下达指令'}">${icon('eye')}</span>`}<button type="button" class="cud-details" data-cud-details title="单位详情" aria-label="单位详情">${svg('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM11 10h2v7h-2zm0-5h2v2h-2z')}</button></div></div>`;
 d.style.setProperty('--civ',ownerColor||'#a7834f');d.style.setProperty('--hp-angle',(pct*3.6)+'deg');d.style.setProperty('--hp-color',pct>60?'#89c78e':pct>30?'#d9b061':'#df7562');
 // Keyed, diffed update: unchanged heartbeat renders keep DOM, focus and hover intact.
 if(d.dataset.sig!==html){d.dataset.sig=html;d.innerHTML=html;d.querySelectorAll('[data-cud-key]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.cudKey,src=[...(document.getElementById('inspector')?.querySelectorAll('[data-unit-action],[data-unit-upgrade],[data-engineer-action],[data-civilian-mission],[data-open-great-person],#cancel-unit-order')||[])].find(b=>keyOf(b)===k);if(src&&!src.disabled)src.click();});}
 const detail=d.querySelector('[data-cud-details]');if(detail)detail.onclick=()=>document.getElementById('app')?.classList.toggle('unit-details-open');
 d.hidden=false;requestAnimationFrame(positionUnitDock);
}

/* ---------------- World Rankings: one readable ledger, details on demand ---------------- */
const TABS=[['overview','总览','laurel'],['science','科技','flask'],['culture','文化','lyre'],['domination','征服','swords'],['religion','宗教','faith'],['diplomacy','外交','scales'],['score','分数','crown']];
const ACCENT={science:'#8ab4d8',culture:'#c299c0',domination:'#d9917c',religion:'#d4c599',diplomacy:'#87bdb4',score:'#d3b882'};
const REQ={science:'依次完成发射人造卫星、载人登月、外星殖民三阶段太空计划。',culture:'入境游客达到当前胜利目标，超过其他文明的国内游客；实际胜利还需满足本局的回合门槛。',domination:'控制全部文明的原始首都，并保有自己的首都。',religion:'让每个存活文明中超过半数的城市信仰你的宗教。',diplomacy:`获得 ${DIPLOMATIC_TARGET} 点外交胜利积分，在完整结算后判定胜利。`,score:'在分数截止回合完整结算后总分最高；其他已启用胜利优先判定。'};
const SCORE_LABELS={cities:'城市',population:'人口',districts:'区域',uniqueDistricts:'特色区域',buildings:'建筑',technologies:'科技',civics:'市政',wonders:'奇观',greatPeople:'伟人',religion:'创立宗教',foreignReligion:'外国信教城市',era:'时代得分'};
const METRIC={score:o=>[o.score??0,null],science:o=>[o.victory.science.stage,o.victory.science.total||3],culture:o=>[o.victory.culture.tourism,o.victory.culture.target],domination:o=>[o.victory.domination.owned,o.victory.domination.total],religion:o=>[o.victory.religion.converted,o.victory.religion.total],diplomacy:o=>o.victory.diplomacy?[o.victory.diplomacy.points,DIPLOMATIC_TARGET]:null};
const rankIcon=(key,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="${key==='chevron'?'#i-arrow':'#b4-'+key}"/></svg>`;
const VICTORY_GLYPHS={
 science:'<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
 culture:'<path d="M5 3Q2 12 8 15V19H16V15Q22 12 19 3M5 3L9 6H15L19 3M9 6V15M12 6V15M15 6V15M7 21H17"/>',
 domination:'<path d="M4 3L8 4 20 18 18 20 4 8ZM3 18L6 21M4 20L9 15M20 3L16 4 14 8M4 18L10 11M15 15L20 20M17 21L21 17"/>',
 religion:'<circle cx="12" cy="12" r="4"/><path d="M12 1V5M12 19V23M1 12H5M19 12H23M4 4L7 7M17 17L20 20M4 20L7 17M17 7L20 4"/>',
 diplomacy:'<path d="M12 3V20M6 21H18M3 7H21M5 7L1 15H9ZM19 7L15 15H23ZM1 15Q5 21 9 15M15 15Q19 21 23 15"/><circle cx="12" cy="3" r="2"/>',
 score:'<path d="M3 6L8 10 12 3 16 10 21 6 18 18H6ZM6 21H18M8 14H16"/>'
};
const STAGE_GLYPHS=[
 '<path d="M9 8L16 15 12 19 5 12ZM5 3L9 7 5 11 1 7ZM19 13L23 17 19 21 15 17M11 6L17 1M16 3L21 8M14 7Q19 7 19 12"/>',
 '<path d="M16 2A10 10 0 1 0 22 17A10 10 0 0 1 16 2Z"/><path d="M16 11L18 9 20 11 18 13Z"/>',
 '<path d="M2 20H22M4 20V13A8 8 0 0 1 20 13V20M4 13H20M10 20V15H14V20M12 5V1L19 3 12 5"/>'
];
const stageIcon=i=>`<svg viewBox="0 0 24 24" aria-hidden="true">${STAGE_GLYPHS[i]||STAGE_GLYPHS[2]}</svg>`;
const victoryGlyph=key=>`<svg class="cr-crest-icon" viewBox="0 0 24 24" aria-hidden="true">${VICTORY_GLYPHS[key]||''}</svg>`;
function victoryMedal(key){
 const branch='<path d="M22 66Q2 40 23 14M17 57Q4 57 5 44Q16 45 17 57ZM12 43Q0 40 4 29Q15 31 12 43ZM14 29Q5 21 14 13Q23 20 14 29ZM22 17Q17 6 28 3Q33 12 22 17Z"/>';
 return `<span class="cr-medallion" aria-hidden="true"><i class="cr-pennant"></i><svg class="cr-wreath" viewBox="0 0 100 80">${branch}<g transform="translate(100 0) scale(-1 1)">${branch}</g></svg><span class="cr-medallion-face">${victoryGlyph(key)}</span></span>`;
}
const rankNumber=n=>Number(n??0).toLocaleString('zh-CN',{maximumFractionDigits:0});
const shortVictory=key=>VICTORY_NAMES[key]?.replace('胜利','')||key;
const metricRatio=m=>m?.[1]?m[0]/m[1]:m?.[0]??0;
function rankingRows(g,key){return g.players.filter(o=>o.victory).map(o=>({o,m:METRIC[key](o)})).filter(r=>r.m).sort((a,b)=>metricRatio(b.m)-metricRatio(a.m)||(b.o.score??0)-(a.o.score??0)||a.o.id-b.o.id);}
function rankPortrait(o,esc){return LEADERS.some(l=>l.key===o.leaderKey)?`<img class="cr-face" src="/assets/leaders/${esc(o.leaderKey)}-small.webp" alt="${esc(leaderFor(o).name)}" decoding="async">`:`<span class="cr-face cr-sigil" aria-hidden="true">${rankIcon('crown')}</span>`;}
function nextStep(k,p){
 const v=p?.victory;if(!v)return '选择一种胜利，查看各文明进度';
 if(k==='science'){const stage=v.science.stage;return stage>=3?'太空计划已完成':Object.values(PROJECTS).find(s=>s.stage===stage+1)?.name||'推进太空计划';}
 if(k==='culture')return `还需 ${rankNumber(Math.max(0,Math.ceil(v.culture.target-v.culture.tourism)))} 名入境游客`;
 if(k==='domination')return `还需控制 ${Math.max(0,v.domination.total-v.domination.owned)} 座原始首都`;
 if(k==='religion')return `还需影响 ${Math.max(0,v.religion.total-v.religion.converted)} 个文明`;
 if(k==='diplomacy')return `还需 ${Math.max(0,DIPLOMATIC_TARGET-(v.diplomacy?.points??0))} 点胜利积分`;
 return v.scoreLimit?.enabled?`距离结算还有 ${v.scoreLimit.remaining} 个${drawerCtx?.g.settings.playMode==='turns'?'回合':'经济周期'}`:'本局未启用分数截止';
}
function rankTrack(m,key){
 if(key==='science')return `<span class="cr-stage-line" aria-label="已完成 ${m[0]} / ${m[1]} 阶段">${Array.from({length:m[1]},(_,i)=>`<i class="${i<m[0]?'complete':''}" title="${Object.values(PROJECTS).find(s=>s.stage===i+1)?.name||'太空阶段'}">${stageIcon(i)}</i>`).join('')}</span>`;
 if(!m[1])return '';
 const pct=Math.max(0,Math.min(100,metricRatio(m)*100));return `<span class="cr-track" role="progressbar" aria-valuemin="0" aria-valuemax="${m[1]}" aria-valuenow="${Math.max(0,m[0])}"><i style="width:${pct}%"></i></span>`;
}
function rulesMarkup(key,p,esc){
 let extra='';
 if(key==='score')extra='<p>金币与信仰储备不计入总分。同分依次比较市政、城市、区域、人口、伟人、宗教、科技与奇观。</p>';
 if(key==='diplomacy')extra='<p>积分来自世界大会、指定奇观及首次完成未来科技／市政。外交支持用于大会投票，不等同于胜利积分。</p>';
 if(key==='science')extra='<p>需要航天中心。项目解锁与执行条件以城市生产列表为准。</p>';
 return `<details class="cr-rules" data-cr-disclosure="rules"><summary>胜利条件${rankIcon('chevron')}</summary><div><p>${esc(REQ[key])}</p>${extra}${key==='culture'&&p?.victory?`<p>当前目标：${rankNumber(p.victory.culture.target)} 名入境游客。</p>`:''}</div></details>`;
}
function breakdownMarkup(key,p,esc){
 if(key==='score'&&p?.victory?.scoreDetails){const parts=p.victory.scoreDetails.parts.filter(a=>a.score>0).sort((a,b)=>b.score-a.score),max=Math.max(1,...parts.map(a=>a.score));return `<details class="cr-breakdown" data-cr-disclosure="breakdown"><summary>分数来源 ${rankIcon('chevron')}</summary><div class="cr-score-parts">${parts.map(a=>`<div><span>${esc(SCORE_LABELS[a.key]||a.key)}</span><small>${a.count} × ${a.weight}</small><b>${rankNumber(a.score)}</b><i><em style="width:${a.score/max*100}%"></em></i></div>`).join('')||'<p>尚无计分项目</p>'}</div></details>`;}
 if(key==='diplomacy'&&p){const entries=p.diplomaticLedger||[];return `<details class="cr-breakdown" data-cr-disclosure="breakdown"><summary>积分来源 ${rankIcon('chevron')}</summary><ol class="cr-awards">${entries.map(a=>`<li><span>${esc(a.label)}</span><small>第 ${a.turn} ${drawerCtx.g.settings.playMode==='turns'?'回合':'周期'}</small><b>${a.delta>=0?'+':''}${a.delta}</b></li>`).join('')||'<li>尚未获得积分</li>'}</ol></details>`;}
 return '';
}
let drawerTab='overview',drawerCtx=null,returnFocus=null;
const disclosures=new Map();
export function rankingsOpen(){return !!document.getElementById('civ-rankings')?.classList.contains('open');}
export function closeRankings(){const d=document.getElementById('civ-rankings');if(!d)return;d.classList.remove('open');d.setAttribute('aria-hidden','true');d.inert=true;document.getElementById('civ-rankings-btn')?.setAttribute('aria-expanded','false');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
function drawerEl(){
 let d=document.getElementById('civ-rankings');if(d)return d;
 d=document.createElement('aside');d.id='civ-rankings';d.setAttribute('role','dialog');d.setAttribute('aria-label','世界排名');d.setAttribute('aria-hidden','true');d.inert=true;
 d.innerHTML=`<header class="cr-head"><span class="cr-seal">${rankIcon('laurel')}</span><div><h2>世界排名</h2></div><button type="button" class="cr-close" data-cr-close aria-label="关闭世界排名" title="关闭 · Esc">×</button></header><nav class="cr-tabs" role="tablist" aria-label="胜利类型">${TABS.map(([k,label,icon])=>`<button type="button" role="tab" data-cr-tab="${k}" class="cr-t-${k}" title="${label}" aria-label="${label}">${VICTORY_GLYPHS[k]?victoryGlyph(k):rankIcon(icon)}<span>${label}</span></button>`).join('')}</nav><div class="cr-body" role="tabpanel"></div>`;
 document.body.append(d);
 d.addEventListener('click',e=>{if(e.target.closest('[data-cr-close]'))closeRankings();const tab=e.target.closest('[data-cr-tab]');if(tab){drawerTab=tab.dataset.crTab;renderDrawer();}});
 d.querySelector('.cr-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...d.querySelectorAll('.cr-tabs button')],at=tabs.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(at+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&rankingsOpen()){e.preventDefault();e.stopImmediatePropagation();closeRankings();}},true);
 return d;
}
function bindDisclosures(body){for(const detail of body.querySelectorAll('[data-cr-disclosure]')){const key=drawerTab+':'+detail.dataset.crDisclosure;detail.open=disclosures.get(key)||false;detail.addEventListener('toggle',()=>disclosures.set(key,detail.open));}}
function renderDrawer(force=false){
 const d=drawerEl(),body=d.querySelector('.cr-body');if(!drawerCtx)return;
 const {g,p,esc,observer,openCongress}=drawerCtx,enabled=g.settings.victories||Object.keys(VICTORY_NAMES);
 const sig=JSON.stringify([drawerTab,observer,p?.id,enabled,g.settings.playMode,p?.diplomaticFavor,p?.diplomaticLedger,g.players.map(o=>[o.id,o.alive,o.score,o.victory,o.leaderKey,o.name,o.controller?.displayName])]);
 if(!force&&d.dataset.sig===sig)return;d.dataset.sig=sig;const scroll=body.scrollTop,same=d.dataset.tab===drawerTab;
 d.querySelectorAll('.cr-tabs button').forEach(b=>{const selected=b.dataset.crTab===drawerTab,off=b.dataset.crTab!=='overview'&&!enabled.includes(b.dataset.crTab);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;b.classList.toggle('cr-off',off);b.title=b.getAttribute('aria-label')+(off?' · 本局未启用':'');});
 d.dataset.tab=drawerTab;d.style.setProperty('--cr-accent',ACCENT[drawerTab]||'#c6ae7d');
 const unknown=g.players.filter(o=>!o.victory).length;

 if(drawerTab==='overview'){
  body.innerHTML=`<div class="cr-overview">${TABS.filter(([k])=>k!=='overview'&&enabled.includes(k)).map(([key,label,icon])=>{const rows=rankingRows(g,key),leading=rows[0]?.m?.[0]>0?rows[0]:null,front=leading?.o,m=leading?.m||(p?.victory?METRIC[key](p):null);return `<button type="button" class="cr-race" data-cr-tab="${key}" style="--race:${ACCENT[key]}">${victoryMedal(key)}<span class="cr-race-main"><strong>${label}</strong><small title="${unknown?'已知文明中的领先者':'当前领先者'}">${front?esc(front.short||front.name):'—'}</small>${m?rankTrack(m,key):''}</span><span class="cr-race-value">${m?rankNumber(m[0]):'—'}${m?.[1]?`<small> / ${rankNumber(m[1])}</small>`:'<small> 分</small>'}</span>${front?rankPortrait(front,esc):''}<span class="cr-race-arrow">›</span></button>`;}).join('')}</div>${unknown?`<p class="cr-unmet-note">未相遇文明 × ${unknown}</p>`:''}`;
 }else{
  const key=drawerTab,rows=rankingRows(g,key),own=p?.victory?METRIC[key](p):null,off=!enabled.includes(key),icon=TABS.find(t=>t[0]===key)[2];
  body.innerHTML=`<section class="cr-req"><div class="cr-req-top">${victoryMedal(key)}<div>${off?'<small>本局未启用</small>':''}<h3>${shortVictory(key)}</h3></div><b title="${esc(p?.short||p?.name||'所选文明')}的进度">${own?rankNumber(own[0]):'—'}<small>${own?.[1]?` / ${rankNumber(own[1])}`:key==='score'?' 分':''}</small></b></div><p class="cr-next" aria-label="下一步"><span aria-hidden="true">↗</span><strong>${esc(nextStep(key,p))}</strong></p></section>${key==='science'?`<div class="cr-milestones">${Object.values(PROJECTS).filter(s=>s.stage).sort((a,b)=>a.stage-b.stage).map(s=>`<span class="${s.stage<=(own?.[0]??0)?'complete':''}"><i>${stageIcon(s.stage-1)}</i>${esc(s.name.replace('发射人造卫星','卫星').replace('载人登月','登月').replace('外星殖民','殖民'))}</span>`).join('')}</div>`:''}<div class="cr-section-title"><h4>文明</h4><span>${key==='score'?'分数':'进度'}</span></div><ol class="cr-rank">${rows.map(({o,m},i)=>`<li style="--civ:${esc(o.color)}" class="${o.id===p?.id?'cr-self':''}${o.alive?'':' cr-gone'}"><i class="cr-place">${String(i+1).padStart(2,'0')}</i>${rankPortrait(o,esc)}<div class="cr-identity" title="${esc(LEADERS.some(l=>l.key===o.leaderKey)?leaderFor(o).name:'')}${o.controller?.displayName?' · '+esc(o.controller.displayName):''}"><strong><span>${esc(o.short||o.name)}</span>${o.id===p?.id?`<small>${observer?'所选':'你'}</small>`:''}</strong>${o.controller?.displayName||!o.alive?`<span>${esc(o.controller?.displayName||'')}${o.alive?'':' · 已退场'}</span>`:''}${rankTrack(m,key)}</div><b class="cr-value">${rankNumber(m[0])}${m[1]?`<small> / ${rankNumber(m[1])}</small>`:''}</b></li>`).join('')}${unknown?`<li class="cr-unknown" data-count="${unknown}"><span class="cr-unknown-seal">${rankIcon('compass')}</span><div><strong>未相遇文明 × ${unknown}</strong></div><b>—</b></li>`:''}</ol>${rulesMarkup(key,p,esc)}${breakdownMarkup(key,p,esc)}${key==='diplomacy'&&!observer?`<button type="button" class="cr-congress" data-cr-congress>${rankIcon('scales')}前往世界大会<span>↗</span></button>`:''}`;
 }
 bindDisclosures(body);body.querySelector('[data-cr-congress]')?.addEventListener('click',()=>{closeRankings();openCongress();});body.scrollTop=same?scroll:0;
}
export function openRankings(ctx){drawerCtx=ctx;returnFocus=document.activeElement;const d=drawerEl();renderDrawer(true);d.classList.add('open');d.setAttribute('aria-hidden','false');d.inert=false;document.getElementById('civ-rankings-btn')?.setAttribute('aria-expanded','true');d.querySelector(`.cr-tabs [data-cr-tab="${drawerTab}"]`)?.focus({preventScroll:true});}
export function refreshRankings(ctx){if(!rankingsOpen())return;drawerCtx=ctx;renderDrawer();}
export function mountRankingsButton(onOpen){if(document.getElementById('civ-rankings-btn'))return;const b=document.createElement('button');b.id='civ-rankings-btn';b.type='button';b.title='世界排名';b.setAttribute('aria-label','世界排名');b.setAttribute('aria-expanded','false');b.innerHTML=rankIcon('laurel');b.onclick=()=>rankingsOpen()?closeRankings():onOpen();(document.getElementById('app')||document.body).append(b);}
