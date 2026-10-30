// Universe presentation: layout and views use the shared game command bridge.
// Data source: the published client snapshot and shared control DOM. No additional requests.
// Shared controls are delegated or moved into the Universe layout.
import {UNITS,BUILDINGS,WONDERS,PROJECTS} from '/rules.mjs';
import {GREAT_PEOPLE} from '/heritage-data.mjs';
import * as V4 from '/ui-b/ui-b-v4.js';
const itemName=k=>{for(const T of [UNITS,BUILDINGS,WONDERS,PROJECTS]){const v=T&&T[k];if(v)return v.name||k;}return k;};
let on=false,state=null,raf=0,observers=[],history=new Map(),built=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const num=n=>{if(n===undefined||n===null||Number.isNaN(+n))return '—';const a=Math.abs(+n);return a>=1e6?(+n/1e6).toFixed(1)+'M':a>=1e4?(+n/1e3).toFixed(1)+'k':(Math.round(+n*10)/10).toLocaleString('zh-CN');};
const icon=k=>`<svg class="b-ic"><use href="#i-${k}"/></svg>`;
const set=(el,html)=>{if(el&&el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html;}};
const VIC=[['domination','征服',v=>v?.domination&&[v.domination.owned,v.domination.total]],['science','科技',v=>v?.science&&[v.science.stage||0,v.science.total||3]],['culture','文化',v=>v?.culture&&[v.culture.tourism,v.culture.target]],['religion','宗教',v=>v?.religion&&[v.religion.converted,v.religion.total]],['diplomacy','外交',v=>v?.diplomacy&&[v.diplomacy.points,v.diplomacy.target]]];
const YIELDS=[['science','科技','#7f9fbf'],['culture','文化','#a48bbf'],['gold','国库','#c9a85c'],['faith','信仰','#b9a0a8']];
function focus(){const g=state?.game;if(!g)return null;const id=state.view>=0?state.view:state.selectedPlayer;return g.players.find(p=>p.id===id)||g.players[0];}
function lead(v){let best=null;for(const [k,label,f] of VIC){if(state?.game?.settings?.victories&&!state.game.settings.victories.includes(k))continue;const r=f(v);if(!r||!r[1])continue;const pct=r[0]/r[1];if(!best||pct>best.pct)best={k,label,pct};}return best;}

/* ---------- scaffolding ---------- */
function build(){
  if(built)return;built=true;const app=$('app');
  const hud=document.createElement('header');hud.id='b-hud';hud.className='b-layer';
  hud.innerHTML=`<button class="b-mark" data-b4-mainmenu title="主菜单"><svg class="b4i b-burger" aria-hidden="true"><use href="#b4-menu"/></svg><img src="/assets/branding/favicon.png" width="26" height="26" alt=""><span>诸文明</span></button>
<div class="b-clock"><small id="b-era"></small><strong id="b-turn"></strong><small id="b-year"></small></div>
<i class="b-orn" aria-hidden="true">❖</i><div class="b-yields" id="b-yields"></div><i class="b-orn" aria-hidden="true">❖</i><div class="b-victory" id="b-victory"></div>
<nav class="b-nav"><button data-b4-roster title="列国" aria-label="列国"><svg class="b-ic"><use href="#i-diplomacy"/></svg><span>列国</span></button>${[['leaders','crown','领袖与国家战略'],['tech','science','科技树'],['civic','culture','市政树 · 政体'],['governors','crown','行省总督'],['worldsystems','world','城邦 · 密使 · 游观'],['greatpeople','quill','伟人名录'],['wonders','monument','世界奇观'],['diplomacy','diplomacy','外交 · 世界议会']].map(([m,i,t])=>m==='tech'||m==='civic'||m==='greatpeople'?`<button data-b4-codex="${m==='greatpeople'?'gp':m}" title="${t}">${icon(i)}<span>${t}</span></button>`:`<button data-b-click='button[data-modal="${m}"]' title="${t}">${icon(i)}<span>${t}</span></button>`).join('')}<div class="b-menu" id="b-menu"><button class="b-menu-btn" data-b-menu title="更多">${'<i></i>'.repeat(3)}<span>更多</span></button><div class="b-menu-pop" role="menu">${[['button[data-modal="religion"]','faith','信仰议会'],['button[data-modal="congress"]','world','世界大会'],['button[data-modal="climate"]','world','气候与灾害'],['button[data-modal="drivers"]','code','C++ 驱动'],['button[data-modal="saves"]','save','存档'],['button[data-modal="audio"]','audio','音乐与声音'],['#toggle-panels','eye','隐藏面板 · Tab'],['#fullscreen','','全屏 · F11'],['button[data-modal="help"]','help','说明']].map(([sel,i,t])=>`<button data-b-click='${sel}' role="menuitem">${i?icon(i):'<b class="b-glyph">⛶</b>'}<span>${t}</span></button>`).join('')}</div></div></nav>`;
  const roster=document.createElement('aside');roster.id='b-roster';roster.className='b-layer';
  roster.innerHTML=`<button class="b-rtoggle" data-b-roster title="收起 / 展开列国" aria-label="收起 / 展开列国"><i></i></button><header><h2>列国</h2><small id="b-alive"></small></header><div class="b-cols"><span>#</span><span>文明</span><span>分数</span><span title="对你的态度">态度</span></div><ol id="b-rows"></ol><footer id="b-roster-foot"></footer>`;
  app.append(hud,roster);
  const mt=document.querySelector('.map-tools');if(mt&&!mt.querySelector('.b-mt-handle')){const h=document.createElement('button');h.className='b-mt-handle';h.dataset.bMaptools='1';h.title='收起 / 展开地图工具';h.textContent='';mt.prepend(h);}
  hud.addEventListener('click',forward);roster.addEventListener('click',e=>{const row=e.target.closest('[data-b-player]');if(row){document.querySelector(`#players [data-player="${row.dataset.bPlayer}"]`)?.click();}});
  // Move the shared perspective controls into the roster footer.
  for(const sel of ['.perspective','#takeover','#rankings']){const el=document.querySelector('#council '+sel)||document.querySelector(sel);if(el){$('b-roster-foot').append(el);}}
}
function forward(e){const b=e.target.closest('[data-b-click]');if(!b)return;document.querySelector(b.dataset.bClick)?.click();}
/* ---------- HUD ---------- */
function spark(key,val){const g=state.game,k=g.id+':'+key;let h=history.get(k);if(!h){h=[];history.set(k,h);}const last=h[h.length-1];if(!last||last.t!==g.turn)h.push({t:g.turn,v:+val||0});else last.v=+val||0;if(h.length>24)h.shift();
  if(h.length<2)return '<svg class="b-spark" viewBox="0 0 60 16"></svg>';const vs=h.map(x=>x.v),lo=Math.min(...vs),hi=Math.max(...vs),r=hi-lo||1;return `<svg class="b-spark" viewBox="0 0 60 16" preserveAspectRatio="none"><polyline points="${vs.map((v,i)=>(i/(vs.length-1)*60).toFixed(1)+','+(15-(v-lo)/r*14).toFixed(1)).join(' ')}"/></svg>`;}
const laurel=()=>`<svg class="b-lau" viewBox="0 0 44 32" aria-hidden="true"><path d="M22 30C10 28 4 18 6 6M22 30c12-2 18-12 16-24" fill="none" stroke="currentColor" stroke-width="1.3"/><g fill="currentColor"><ellipse cx="7" cy="10" rx="1.7" ry="3.4" transform="rotate(-20 7 10)"/><ellipse cx="9" cy="17" rx="1.7" ry="3.4" transform="rotate(-40 9 17)"/><ellipse cx="14" cy="23" rx="1.7" ry="3.4" transform="rotate(-60 14 23)"/><ellipse cx="37" cy="10" rx="1.7" ry="3.4" transform="rotate(20 37 10)"/><ellipse cx="35" cy="17" rx="1.7" ry="3.4" transform="rotate(40 35 17)"/><ellipse cx="30" cy="23" rx="1.7" ry="3.4" transform="rotate(60 30 23)"/></g></svg>`;
function mapTools(){const b=$('toggle-borders');if(b){const m=b.textContent.trim();if(b.dataset.bMode!==m)b.dataset.bMode=m;b.title='国家边界：'+(m==='隐藏'?'隐藏':'粗虚线')+'（点击显示 / 隐藏）';}for(const [id,t] of [['zoom-in','放大'],['zoom-out','缩小']]){const e=$(id);if(e&&!e.title)e.title=t;}}
function hud(){
  const p=focus();if(!p)return;const g=state.game;
  set($('b-era'),esc($('era')?.textContent||''));set($('b-turn'),'第 <b>'+g.turn+'</b> 周期');set($('b-year'),esc($('year')?.textContent||''));
  // yields strip is rendered by the v4 layer (Civ6-like currencies + resources)

  const v=p.victory,rows=v?VIC.map(([k,label,f])=>{if(!g.settings.victories.includes(k))return null;const r=f(v);if(!r)return null;return {k,label,pct:clamp(r[1]?r[0]/r[1]*100:0),r};}).filter(Boolean):[],best=rows.reduce((m,x)=>!m||x.pct>m.pct?x:m,null);
  set($('b-victory'),`<button class="b-laurel" data-b-vic title="世界排名" aria-label="世界排名">${laurel()}<b>${best?Math.round(best.pct)+'%':'—'}</b><small>${best?best.label:'胜利'}</small></button>`);
}

/* ---------- roster ---------- */
function roster(){
  const g=state.game,sorted=[...g.players].sort((a,b)=>(b.alive-a.alive)||(b.score||0)-(a.score||0)||a.id-b.id),viewer=state.view,me=viewer>=0?g.players[viewer]:null;
  set($('b-alive'),g.players.filter(p=>p.alive).length+' / '+g.players.length);
  const rows=sorted.map(p=>{const a=document.querySelector(`#players [data-player="${p.id}"]`),sig=a?.querySelector('.player-sigil')?.innerHTML||esc(p.symbol),att=p.attitudeToward,rel=me?.relations?.[p.id]?.status,active=p.id===state.selectedPlayer;
    const op=att?clamp(att.opinion,-100,100):null,cls=op===null?'':op>=10?'pos':op<=-10?'neg':'mid';
    const known=viewer<0||p.id===viewer||!!me?.met?.includes(p.id),controller=(state.session?.controllers||g.controllers||[]).find(item=>item.seat===p.id),badge=known&&controller?.known!==false&&controller?.kind==='agent'&&controller.displayName?`<span class="leader-ai-badge" title="${esc((p.leader||'')+'【'+controller.displayName+'】')}">【${esc(controller.displayName)}】</span>`:'';
    const tip=esc(p.name)+(badge?'':'')+(p.alive?'':' · 已覆灭')+(known&&p.leader?' · '+esc(p.leader):'')+(rel==='war'?' · 交战':rel==='alliance'?' · 同盟':'')+(att?' · 态度 '+(op>0?'+':'')+Math.round(op)+(att.denounced?' · 已谴责':att.friend?' · 友好':''):'');
    return `<li data-b-player="${p.id}" class="${active?'active':''} ${p.alive?'':'gone'} ${rel==='war'?'war':rel==='alliance'?'ally':''}" style="--civ:${esc(p.color)}" title="${tip}"><span class="b-sig">${known?sig:esc(p.symbol)}</span><span class="b-name"><span class="b-civ">${esc(p.name)}</span>${badge}</span>${p.alive?`<span class="b-score">${num(p.score||0)}</span>${op!==null?`<i class="b-att ${cls}"><em style="left:${((op+100)/2).toFixed(0)}%"></em></i>`:'<i class="b-att none"></i>'}`:''}</li>`;}).join('');
  set($('b-rows'),rows);
}

/* ---------- dossier (unit / city): 2-4 key numbers, rest behind "⋯" ---------- */
function bar(label,v,max,cls=''){const pct=clamp(max?v/max*100:0);return `<div class="b-meter ${cls}" title="${label} ${num(v)} / ${num(max)}"><span>${label}</span><i><em style="width:${pct.toFixed(1)}%"></em></i><b>${num(v)}</b></div>`;}
let lastSel='';
let dbox=null;
function morph(a,b){ // patch a's children to match b's in place: text/attrs only, no rebuild when structure is unchanged
  const an=[...a.childNodes],bn=[...b.childNodes];
  for(let i=0;i<bn.length;i++){const x=an[i],y=bn[i];
    if(!x){a.appendChild(y.cloneNode(true));continue;}
    if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName){a.replaceChild(y.cloneNode(true),x);continue;}
    if(x.nodeType===3){if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue;continue;}
    if(x.nodeType!==1)continue;
    for(const at of [...x.attributes])if(!y.hasAttribute(at.name))x.removeAttribute(at.name);
    for(const at of [...y.attributes])if(x.getAttribute(at.name)!==at.value)x.setAttribute(at.name,at.value);
    morph(x,y);}
  for(let i=an.length-1;i>=bn.length;i--)an[i].remove();
}
function reattach(){const ins=$('inspector');if(on&&dbox&&ins&&ins.classList.contains('b-has-dossier')&&dbox.parentNode!==ins)ins.prepend(dbox);}
function dossier(){
  const ins=$('inspector'),g=state.game,sel=state.selection;if(!ins)return;let box=dbox;
  const key=sel?sel.type+':'+sel.id:'';if(key!==lastSel){lastSel=key;ins.classList.remove('b-expanded');}
  let html='';const more='<button class="b-more" data-b-more title="展开全部详情">⋯</button>';
  if(sel?.type==='unit'){const u=g.units.find(x=>x.id===sel.id),spec=u&&UNITS[u.type];if(u&&spec){const o=g.players[u.owner]||g.cityStates?.states.find(s=>-s.id-1===u.owner),hp=u.hp??100,person=GREAT_PEOPLE.find(p=>p.key===u.greatPerson);
    const busy=u.activity?.action?.type||u.receivingTreatment||u.acted;
    html=`<h2>${esc(person?.name||spec.name)}</h2><p class="b-owner" style="--civ:${esc(o?.color||(u.cityState?'#adbdc1':'#a55'))}" title="${esc(o?.name||(u.mutiny?'叛军':'蛮族'))}"><i class="b-dot"></i>${esc(o?.short||o?.name||'—')}${u.level?`<span class="b-pips" title="晋升 ${u.level} 级">${'▴'.repeat(Math.min(5,u.level))}</span>`:''}<span class="b-state ${busy?'busy':'ready'}" title="${busy?'行动中 / 冷却':'待命'}"></span>${more}</p>
${bar('生命',hp,100,hp<34?'bad':hp<67?'warn':'ok')}<dl class="b-stats">${[['战力',spec.strength??spec.combat],['远程',u.ranged===false?0:spec.ranged],['移动',u.moves!==undefined?u.moves+'/'+(u.movementAllowance??spec.moves??'—'):spec.moves]].filter(([,v])=>v!==undefined&&v!==null&&v!==0).slice(0,3).map(([k,v])=>`<div><dd>${esc(v)}</dd><dt>${k}</dt></div>`).join('')}</dl>${(u.zocUntil||0)>(g.realtime?.time??g.turn*20)?'<p class="b-person-charge">控制区停步 · '+num(u.zocUntil-(g.realtime?.time??g.turn*20))+' 秒</p>':''}${ins.querySelector('[data-civilian-mission]')?'<p class="b-person-charge">剩余 '+u.charges+' 次任务</p><button class="b-person-activate" data-b-mission>'+esc(ins.querySelector('[data-civilian-mission]').textContent)+'</button>':''}${u.type==='giantdeathrobot'?'<p class="b-person-charge">'+(u.ranged?'远程火炮 · 3 格':'远程火炮与跳跃 · 未来科技解锁')+'</p><button class="b-person-activate" data-b-jump '+(!ins.querySelector('[data-unit-action="jump"]')||ins.querySelector('[data-unit-action="jump"]').disabled?'disabled':'')+'>动力跳跃 · 2 移动力</button>':''}${spec.engineer?'<p class="b-person-charge">工务次数 '+u.charges+'</p><div>'+[['buildFort','建造堡垒'],['buildRoad','铺路'],['repair','修复']].map(([key,n])=>'<button class="b-person-activate" data-b-engineer="'+key+'">'+n+'</button>').join('')+'</div>':''}${person?'<p class="b-person-charge">剩余 '+u.charges+' 次能力</p>'+(ins.querySelector('[data-open-great-person]')?'<button class="b-person-activate" data-b-great-person>能力档案 · 激活</button>':''):''}`;}}
  else if(sel?.type==='city'){const c=g.cities.find(x=>x.id===sel.id);if(c){const o=g.players[c.owner],y=c.yields||{},w=c.production,spec=w&&(c.productionStatus?.cost??w.cost),mhp=c.maxHp||200;
    html=`<h2>${esc(c.name)}${c.isCapital?'<span class="b-cap" title="首都">★</span>':''}</h2><p class="b-owner" style="--civ:${esc(o?.color||'#888')}" title="${esc(o?.name||'')}"><i class="b-dot"></i>${esc(o?.short||o?.name||'')}<span class="b-pop" title="人口">${c.population??'—'}</span>${more}</p>
<dl class="b-yrow">${[['food','食物'],['production','生产'],['gold','金币'],['science','科技']].map(([k,l])=>y[k]!==undefined?`<div title="${l}">${icon(k)}<dd>${num(y[k])}</dd></div>`:'').join('')}</dl>
${w&&spec?bar(esc(w.name||itemName(w.item)),w.progress||0,spec,'prod'):''}${c.hp!==undefined&&c.hp<mhp?bar('城防',c.hp,mhp,c.hp<mhp/3?'bad':'warn'):''}`;}}
  if(!html){box?.remove();ins.classList.remove('b-has-dossier','b-expanded');return;}
  if(!box){box=dbox=document.createElement('section');box.id='b-dossier';}
  if(box.parentNode!==ins)ins.prepend(box);ins.classList.add('b-has-dossier');
  if(box.dataset.h!==html){box.dataset.h=html;const t=document.createElement('template');t.innerHTML=html;morph(box,t.content);}
}

/* ---------- modal: text status -> visual status ---------- */
const openRows=new Set();
function diploRow(row){
  const h=row.querySelector('h3'),name=h?.textContent||'',p=row.querySelector(':scope>div>p'),t=p?.textContent||'',attEl=row.querySelector('.diplomatic-attitude'),att=attEl?.textContent||'',all=row.textContent||'';
  const sig=name+'|'+all.length+'|'+t;if(row.dataset.bSig===sig)return;row.dataset.bSig=sig;
  const st=/已覆灭/.test(t)?'dead':/尚未相遇/.test(t)?'unmet':/战争/.test(t)?'war':/联盟/.test(t)?'ally':'peace';row.dataset.bState=st;
  row.classList.toggle('b-open',openRows.has(name));
  const era=(t.match(/时代分 (\d+)/)||[])[1],ten=+((t.match(/不满度 (\d+)/)||[])[1]||0),op=attEl?clamp(+attEl.dataset.opinion||0,-100,100):null;
  const env=all.match(/共享来使：剩余 (\d+) \/ (\d+)/),noIntel=!!row.querySelector('.diplomatic-intel:not([data-intel-age])'),intelAge=row.querySelector('.diplomatic-intel[data-intel-age]')?.dataset.intelAge;
  const ic=[];
  if(st==='war')ic.push('<b class="b-i war" title="交战中">⚔</b>');
  if(st==='ally')ic.push('<b class="b-i ally" title="同盟">⛉</b>');
  if(/已公开谴责/.test(att))ic.push('<b class="b-i den" title="已公开谴责你">✕</b>');
  else if(/已宣布友好/.test(att))ic.push('<b class="b-i fr" title="已宣布友好">✦</b>');
  if(/正在谴责此国/.test(all))ic.push('<b class="b-i den2" title="你正在谴责此国">✕</b>');
  if(/停战保护/.test(all))ic.push('<b class="b-i truce" title="停战保护中">⏸</b>');
  if(st!=='dead'&&st!=='unmet'&&noIntel)ic.push('<b class="b-i unk" title="政体：尚未获取情报">?</b>');
  if(intelAge!==undefined)ic.push(`<b class="b-i intel" title="政体情报 ${intelAge} 周期前">◉</b>`);
  if(env)ic.push(`<span class="b-dots" title="共享来使 剩余 ${env[1]} / ${env[2]}">${Array.from({length:+env[2]},(_,i)=>`<i class="${i<+env[1]?'on':''}"></i>`).join('')}</span>`);
  const nums=st==='dead'||st==='unmet'?'':`${era!==undefined?`<span class="b-k" title="时代分"><b>${era}</b><small>时代</small></span>`:''}<span class="b-k ${ten>=70?'neg':ten>=40?'warn':''}" title="不满度 ${ten}"><b>${ten}</b><small>不满</small></span>`;
  const gauge=op===null?'':`<span class="b-mark ${op>=10?'pos':op<=-10?'neg':''}" title="对你的态度 ${op>0?'+':''}${Math.round(op)}"><i><em style="left:${((op+100)/2).toFixed(0)}%"></em></i><b>${op>0?'+':''}${Math.round(op)}</b></span>`;
  row.querySelector(':scope .b-dsum')?.remove();
  const d=document.createElement('div');d.className='b-dsum';d.innerHTML=`<span class="b-icons">${ic.join('')}</span>${gauge}${nums}`;h?.after(d);
}
function modal(){
  const mb=$('modal-body');if(!mb)return;
  for(const row of mb.querySelectorAll('.diplomatic-row'))diploRow(row);
  const G=state?.game;if(G)for(const b of mb.querySelectorAll('[data-leader]')){const pl=G.players[+b.dataset.leader];const gone=!!pl&&!pl.alive;if(b.classList.contains('b-gone')!==gone)b.classList.toggle('b-gone',gone);}
  for(const el of mb.querySelectorAll('.diplomatic-attitude[data-opinion]')){if(el.querySelector('.b-gauge'))continue;const text=el.textContent||'';
    const reasons=(text.split(/[：:]/).slice(1).join('：')).split(/[，,]/).map(s=>s.trim()).filter(Boolean).map(s=>{const m=s.match(/^(.*?)\s*([+-]?\d+(?:\.\d+)?)$/);return m?{l:m[1],v:+m[2]}:{l:s,v:0};});
    const w=document.createElement('div');w.className='b-gauge';w.innerHTML=`<ul class="b-reasons">${reasons.map(r=>`<li><span>${esc(r.l)}</span><b class="${r.v<0?'neg':r.v>0?'pos':''}">${r.v>0?'+':''}${r.v||'—'}</b></li>`).join('')}</ul>`;el.prepend(w);}
  for(const el of mb.querySelectorAll('.diplomatic-intel[data-intel-age]')){const a=+el.dataset.intelAge||0,s=a<=5?'fresh':a<=15?'mid':'old';if(el.dataset.bStale!==s)el.dataset.bStale=s;}
}
const RKEY='hex.uiB.rosterCollapsed';
function rosterState(v){const r=document.documentElement;if(v===undefined){try{v=localStorage.getItem(RKEY)==='1';}catch(e){v=false;}}r.classList.toggle('b-roster-collapsed',v);try{localStorage.setItem(RKEY,v?'1':'0');}catch(e){}}
function onDocClick(e){
  if(e.target.closest('[data-b-roster]')){rosterState(!document.documentElement.classList.contains('b-roster-collapsed'));return;}
  if(e.target.closest('[data-b-victory-detail]')){$('rankings')?.click();$('b-victory')?.classList.remove('open');return;}
  const mb=e.target.closest('[data-b-menu]'),vb=e.target.closest('[data-b-vic]');
  if(mb){$('b-menu')?.classList.toggle('open');}else if(!e.target.closest('#b-menu'))$('b-menu')?.classList.remove('open');
  if(vb){$('rankings')?.click();}else if(!e.target.closest('#b-victory'))$('b-victory')?.classList.remove('open');
  if(e.target.closest('.b-menu-pop [data-b-click]'))$('b-menu')?.classList.remove('open');
  if(e.target.closest('[data-b-maptools]')){document.querySelector('.map-tools')?.classList.toggle('b-collapsed');return;}
  const mission=e.target.closest('[data-b-mission]');if(mission){$('inspector')?.querySelector('[data-civilian-mission]')?.click();return;}
  const engineer=e.target.closest('[data-b-engineer]');if(engineer){$('inspector')?.querySelector('[data-engineer-action="'+engineer.dataset.bEngineer+'"]')?.click();return;}
  const gp=e.target.closest('[data-b-great-person]');if(gp){$('inspector')?.querySelector('[data-open-great-person]')?.click();return;}
  const j=e.target.closest('[data-b-jump]');if(j){$('inspector')?.querySelector('[data-unit-action="jump"]')?.click();return;}
  const m=e.target.closest('[data-b-more]');if(m){$('inspector')?.classList.toggle('b-expanded');return;}
  const row=e.target.closest('#modal-body .diplomatic-row');if(row&&!e.target.closest('button,a,input,select')){const n=row.querySelector('h3')?.textContent||'';row.classList.toggle('b-open');row.classList.contains('b-open')?openRows.add(n):openRows.delete(n);}
}

function paint(){raf=0;if(!on||!state?.game)return;try{build();mapTools();hud();roster();dossier();modal();V4.paint(state);}catch(e){console.warn('[ui-b]',e);}}
function schedule(){if(on&&!raf)raf=requestAnimationFrame(paint);}
function onRendered(e){state=e.detail;if(on&&state?.game){try{dossier();}catch(err){}}schedule();}
export function mount(){if(on)return;on=true;V4.mount();window.addEventListener('hex:rendered',onRendered);document.addEventListener('click',onDocClick);rosterState();if(window.__hexUiState)state=window.__hexUiState;
  for(const [id,sub] of [['players',false],['inspector',false],['modal-body',true]]){const el=$(id);if(!el)continue;const mo=new MutationObserver(id==='inspector'?()=>{reattach();schedule();}:schedule);mo.observe(el,{childList:true,subtree:sub});observers.push(mo);}schedule();}
