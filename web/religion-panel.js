import {RELIGIONS} from '/rules.mjs';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function religionMarkup(game,p){
 const records=game.religions?.religions||[],progress=p.victory?.religion;
 return `<section class="religion-overview"><h3 class="section-label">信仰与宗教胜利</h3><p class="modal-intro">每座城市超过半数人口信仰同一宗教，才成为主流宗教。传播、邻城与商路会持续改变信仰压力。让所有存活文明（包括本国）超过半数城市信仰你的宗教，即可获胜。</p>${progress?`<p>本国已影响 ${progress.converted} / ${progress.total} 个文明 · 信仰 ${Math.floor(p.faith||0)}</p>`:''}<div class="government-list">${records.map(r=>`<article class="government-option"><strong>${escape(r.name)}</strong><small>${escape(game.players[r.founder]?.name)} · ${r.cities} 座主流城市 · ${r.followers} 位信众<br>${escape(RELIGIONS[r.key]?.description)}</small></article>`).join('')||'<p>还没有文明创立宗教。</p>'}</div><p class="inspector-note">信仰是独立积累的资源，也可用于万神殿、信条、礼拜建筑与伟人赞助。城市须有主流宗教：神社解锁传教士，寺庙解锁使徒和审判官（仍需对应市政）；招募价格按兵种分别递增。单位传播招募城市的宗教，即使本国未创教也能招募；审判官只清理己方城市。</p></section>`;
}
export function cityReligionMarkup(game,c){
 const rows=Object.entries(c.followers||{});if(!rows.length)return '';
 return `<section class="city-religion"><h3 class="section-label">本城信众 · 人口 ${c.population}</h3><p class="inspector-note">${rows.map(([id,n])=>`${id==='secular'?'世俗人口':escape(game.religions?.religions.find(r=>r.founder===+id)?.name||RELIGIONS[game.players[+id]?.religion]?.name||'未定信仰')} ${n}`).join(' · ')}<br>主流：${c.religion!=null?escape(game.religions?.religions.find(r=>r.founder===c.religion)?.name||RELIGIONS[game.players[c.religion]?.religion]?.name):'暂无'}</p></section>`;
}
