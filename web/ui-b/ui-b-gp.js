// UI B v4 — Great People screen (Civ6-like columns). Pure view over existing snapshot data:
// game.greatPeople (viewer heritageView + catalogue), player.greatPeople (own / full view only), game.events (visible to the viewer).
// Actions go through the existing legal actions recruitGreatPerson / patronizeGreatPerson / passGreatPerson.
import {GREAT_PEOPLE,GREAT_PERSON_CLASSES} from '/heritage-data.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=(k,cls='')=>`<svg class="b4i ${cls}" aria-hidden="true"><use href="#b4-${k}"/></svg>`;
export const GP_ORDER=['general','admiral','engineer','merchant','scientist','writer','artist','musician','prophet'];
export const GP_ICON={general:'swords',admiral:'anchor',engineer:'gear',merchant:'coin',scientist:'atom',writer:'quill',artist:'palette',musician:'note',prophet:'faith'};
export const GP_SYMBOLS={
 anchor:'<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8M4 13c0 4.5 3.5 8 8 8s8-3.5 8-8M4 13l-1.5 1.5M4 13l2 1M20 13l1.5 1.5M20 13l-2 1"/>',
 quill:'<path d="M20 3c-7 1-12 6-14 14l-2 4M20 3c0 6-4 11-10 12M8 13c3 0 6-1 8-4"/>',
 palette:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/>',
 note:'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'
};
const CLASS_NAME=Object.fromEntries(GREAT_PERSON_CLASSES.map(c=>[c.key,c.name]));
const PEOPLE=new Map(GREAT_PEOPLE.map(p=>[p.key,p]));
const KEYWORD_ICONS=[[/科技|尤里卡|学院|研究/,'flask'],[/文化|灵感|著作|剧院/,'lyre'],[/金币|贸易|商路/,'coin'],[/信仰|宗教|圣地/,'faith'],[/生产力|工业|奇观/,'hammer'],[/战斗力|单位|军/,'sword'],[/海军|舰|港/,'ship'],[/音乐|乐/,'note'],[/艺术|画/,'palette']];
const abilityIcons=t=>KEYWORD_ICONS.filter(([re])=>re.test(t||'')).slice(0,3).map(([,k])=>ic(k,'gp-ki')).join('');
export function medal(cls,size=78){return `<svg class="gp-medal ${cls}" viewBox="0 0 80 80" width="${size}" height="${size}" style="width:${size}px;height:${size}px;min-width:${size}px" aria-hidden="true"><defs><radialGradient id="gpm-${cls}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#f6e4b0"/><stop offset=".45" stop-color="#c9a45a"/><stop offset="1" stop-color="#5a3f16"/></radialGradient></defs><circle cx="40" cy="40" r="37" fill="#1a1208"/><circle cx="40" cy="40" r="34" fill="url(#gpm-${cls})"/><circle cx="40" cy="40" r="28" fill="none" stroke="#5a3f16" stroke-width="1.2" stroke-dasharray="1.5 3"/><circle cx="40" cy="40" r="24" fill="rgba(60,40,12,.25)" stroke="rgba(255,240,200,.5)" stroke-width=".8"/><use href="#b4-${GP_ICON[cls]||'star'}" x="21" y="21" width="38" height="38" style="color:#2a1a06"/></svg>`;}
function rows(g,me,cls,cand,full,portrait){
 const metIds=new Set(me?.met||[]),out=[];
 for(const o of g.players.filter(o=>o.alive)){
  const st=o.greatPeople?.candidates?.find(c=>c.classKey===cls);
  if(o.id===me?.id||full){out.push({o,pts:st?.points??null,thr:st?.threshold??cand?.threshold??null,rate:st?.rate??null,mine:o.id===me?.id});}
  else if(metIds.has(o.id))out.push({o,pts:null,known:true});
  else out.push({o:null});
 }
 out.sort((a,b)=>(b.mine?1:0)-(a.mine?1:0)||(b.pts??-1)-(a.pts??-1)||(a.o?0:1)-(b.o?0:1));
 // Unmet civilizations collapse into one row: their identities and points are private anyway.
 const hidden=out.filter(r=>!r.o).length;
 return out.filter(r=>r.o).map(r=>`<li class="${r.mine?'mine':''}" style="--civ:${esc(r.o.color)}">${portrait(r.o,'gp-face')}<span title="${esc(r.o.name)}">${esc(r.o.name)}</span>${r.pts===null?'<b title="他国伟人点数属于私人情报">?</b>':`<b>${Math.floor(r.pts)}<small>/${r.thr??'—'}</small>${r.rate!==null?`<em>+${r.rate}</em>`:''}</b>`}${r.pts!==null&&r.thr?`<i class="gp-bar"><em style="width:${Math.min(100,r.pts/r.thr*100).toFixed(1)}%"></em></i>`:''}</li>`).join('')+(hidden?`<li class="unmet" title="未相遇的文明 ${hidden} 个"><span class="gp-q">?</span><span>未相遇 × ${hidden}</span><b>—</b></li>`:'');
}
function columns(S,me,ctl,portrait){const g=S.game,full=S.view<0,state=me?.greatPeople||g.greatPeople,cands=new Map((state?.candidates||[]).map(c=>[c.classKey,c]));
 return `<div class="gp-cols">${GP_ORDER.map(cls=>{const c=cands.get(cls),person=c?.key?PEOPLE.get(c.key):null;
  if(!person)return `<section class="gp-col empty ${cls}"><header><h3>${esc(CLASS_NAME[cls])}</h3><p>暂无候选</p></header>${medal(cls)}<div class="gp-ab"><p class="gp-muted">本时代的候选已全部被招募或略过，待世界进入下一时代。</p></div></section>`;
  const own=me?.greatPeople?.candidates?.find(x=>x.classKey===cls),ready=own&&own.points>=own.threshold&&!own.passed;
  return `<section class="gp-col ${cls} ${ready?'ready':''}"><header><h3>${esc(CLASS_NAME[cls])}</h3><strong>${esc(person.name)}</strong><small>${esc(person.eraName||'')}</small></header>${medal(cls)}<div class="gp-ab" title="${esc(person.historicalBiography||'')}"><span class="gp-kis">${abilityIcons(person.effectDescription)}</span><p>${esc(person.effectDescription)}</p>${person.charges>1?`<small class="gp-ch">可使用 ${person.charges} 次</small>`:''}</div>
   <div class="gp-prog"><h4>招募进度</h4><ol>${rows(g,me,cls,c,full,portrait)}</ol></div>
   <footer>${own?(own.passed?'<span class="gp-passed">已放弃此人选</span>':ready?`<button class="gp-btn rec" data-b4-gp="recruit" data-k="${person.key}" ${ctl?'':'disabled'}>${ic('star')}招募</button>`:`<button class="gp-btn" data-b4-gp="gold" data-k="${person.key}" ${ctl&&me.gold>=own.gold?'':'disabled'} title="以金币赞助招募">${own.gold}${ic('coin')}</button><button class="gp-btn faith" data-b4-gp="faith" data-k="${person.key}" ${ctl&&me.faith>=own.faith?'':'disabled'} title="以信仰赞助招募">${own.faith}${ic('faith')}</button>`)+(!own.passed&&ctl?`<button class="gp-pass" data-b4-gp="pass" data-k="${person.key}" title="放弃：保留 80% 点数，等待下一位">放弃</button>`:''):'<span class="gp-muted">观战只读</span>'}</footer></section>`;}).join('')}</div>`;}
function history(S,me,portrait){const g=S.game,evs=(g.events||[]).filter(e=>e.type==='greatperson'&&/加入了/.test(e.text));
 const byName=new Map(GREAT_PEOPLE.map(p=>[p.name,p]));
 const items=evs.map(e=>{const name=e.text.split(' 加入了 ')[0],p=byName.get(name),owner=g.players[e.player];return {turn:e.turn,p,name,owner,tile:e.tile};});
 const seen=new Set(items.map(r=>r.p?.key)),state=me?.greatPeople||g.greatPeople,cur=new Map((state?.candidates||[]).map(c=>[c.classKey,c.key]));
 for(const cls of GP_ORDER){const list=GREAT_PEOPLE.filter(p=>p.classKey===cls),ci=cur.get(cls)?list.findIndex(p=>p.key===cur.get(cls)):-1;if(ci>0)for(const p of list.slice(0,ci))if(!seen.has(p.key))items.push({turn:null,p,name:p.name,owner:null,anon:true});}
 const ownSet=new Set([...(me?.greatPeople?.owned||[]),...(me?.greatPeople?.retired||[])].map(x=>x.key));for(const r of items)if(r.anon&&ownSet.has(r.p.key))r.owner=me;
 const own=[...(me?.greatPeople?.owned||[]).map(x=>({...x,state:'在役'})),...(me?.greatPeople?.retired||[]).map(x=>({...x,state:'载入史册'}))];
 return `<div class="gp-hist"><section><h3>世界招募记录 <small>· 纪事所见 + 已离开名录的人选（招募者仅在可见时显示）</small></h3>${items.length?`<ol>${items.map(r=>`<li class="${r.p?.classKey||''}">${medal(r.p?.classKey||'prophet',40)}<span><strong>${esc(r.name)}</strong><small>${esc(CLASS_NAME[r.p?.classKey]||'伟人')} · ${esc(r.p?.eraName||'')}</small></span><span class="gp-who">${r.owner?portrait(r.owner,'gp-face')+esc(r.owner.name):r.anon?'已被招募或略过':'未知文明'}</span><b>${r.turn!==null?'第 '+r.turn+' 周期':esc(r.p?.eraName||'')}</b></li>`).join('')}</ol>`:'<p class="gp-muted">纪事中尚无伟人招募记录（较早的纪事可能已滚出记录窗口）。</p>'}</section>
 <section><h3>本国伟人</h3>${own.length?`<ol>${own.map(x=>{const p=PEOPLE.get(x.key);return `<li class="${p?.classKey||''}">${medal(p?.classKey||'prophet',40)}<span><strong>${esc(p?.name||x.key)}</strong><small>${esc(CLASS_NAME[p?.classKey]||'')} · ${esc(x.state)}</small></span><span class="gp-who">${esc(p?.effectDescription||'').slice(0,60)}</span></li>`;}).join('')}</ol>`:'<p class="gp-muted">'+(me?.greatPeople?'尚未招募伟人。':'他国伟人属于私人情报。')+'</p>'}</section></div>`;}
function overview(S,me){const g=S.game,st=me?.greatPeople;if(!st)return '<p class="b4-note">他国伟人点数属于私人情报。请切换至本国视野或全知观战。</p>';
 const cands=new Map(st.candidates.map(c=>[c.classKey,c]));
 return `<div class="gp-over"><table><thead><tr><th>类别</th><th>当前候选</th><th>点数</th><th>每周期</th><th>预计</th><th>金币赞助</th><th>信仰赞助</th></tr></thead><tbody>${GP_ORDER.map(cls=>{const c=cands.get(cls),p=c?.key?PEOPLE.get(c.key):null,left=c?Math.max(0,c.threshold-c.points):0;return `<tr class="${cls}"><td>${medal(cls,30)}${esc(CLASS_NAME[cls])}</td><td>${esc(p?.name||'—')}</td><td>${c?Math.floor(c.points)+' / '+c.threshold:'—'}</td><td>${c?'+'+c.rate:'—'}</td><td>${c?(left<=0?'可招募':c.rate>0?Math.ceil(left/c.rate)+' 周期':'—'):'—'}</td><td>${c?c.gold:'—'}</td><td>${c?c.faith:'—'}</td></tr>`;}).join('')}</tbody></table><p class="gp-muted">点数来源：学院/图书馆/大学（科学家）、工业区/工坊/工厂（工程师）、商业中心/市场/银行（商人）、兵营与奇观（统帅）、港口/灯塔/船坞（海军家）等。<button class="b4-btn ghost" data-b4-modal="greatpeople">打开完整伟人名录</button></p></div>`;}
export function gpHtml(S,me,tab,ctl,portrait){return tab==='gphist'?history(S,me,portrait):tab==='gpover'?overview(S,me):columns(S,me,ctl,portrait);}
export async function gpAct(UI,me,kind,key){const a=kind==='recruit'?{type:'recruitGreatPerson',item:key}:kind==='pass'?{type:'passGreatPerson',item:key}:{type:'patronizeGreatPerson',item:key,currency:kind};return UI().act?.(a,me.id);}
