// P1 selected-force panel: Ctrl/Cmd+click own units to add/remove; ordinary click still selects map targets.
// Shows truthful execution status from /api/execution (player perspective only) and submits /api/batch.
const ACTION={move:'移动',attack:'攻击',cityAttack:'城市攻击',fortify:'驻防',heal:'治疗',rebase:'转场',upgrade:'升级',trainVeteran:'专长训练',buildFort:'修筑要塞',destroyFort:'拆除要塞',nuke:'核打击',found:'建城',improve:'改良',chop:'砍伐',spread:'传教',buildRoad:'修路',repair:'修复',pillage:'掠夺',destroyRoad:'拆路'};
const COOL={general:'通用',move:'移动',attack:'攻击',fortify:'驻防',heal:'治疗支援'};
const WAIT={nationalLimit:'等待：本国行动上限',cooldown:'等待：本单位冷却',ownReservation:'等待：本国单位已预约目的地',currentAction:'等待：当前动作完成',treatment:'等待：治疗结束',scheduling:'等待调度'};
const REASON={malformed:'格式无效',duplicate:'重复选择',notOwnUnit:'不是本国单位',targetNotVisible:'目标不在当前视野',noVisibleDestination:'视野内无可达目的地',unitBusy:'单位正忙或冷却中',cannotMove:'该单位不能这样移动',queueFull:'本国指令队列已满',notPlanned:'未处理'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAGE={admission:'入场时',impact:'生效时',linkedImpact:'编队生效时'};
const sec=n=>(Math.round(n*10)/10).toFixed(1)+' 模拟秒';
export const FORCE_LIMIT=64;
export class ForcePanel{
  constructor(el,{api,toast,refresh,context}){this.el=el;this.api=api;this.toast=toast;this.refresh=refresh;this.context=context;this.fetchedAt=0;this.fetching=false;this.bound=null;this.gen=0;this.pending=null;this.reset();
    el.addEventListener('click',e=>{const b=e.target.closest('[data-force]');if(!b||b.disabled)return;const k=b.dataset.force;if(k==='clear')this.reset();else this.submit(k);});}
  keyOf(){const c=this.context(),manual=c.game?.players?.find(p=>p.id===c.selectedPlayer)?.manual;return [c.session?.world,c.game?.id,c.selectedPlayer,c.view,manual].join(':');}
  // Read-only inspection: only the selected country's units, and only under that country's actual view or explicit observer.
  canInspect(){const c=this.context();return !!c.game&&Number.isInteger(c.selectedPlayer)&&(c.view<0||c.view===c.selectedPlayer);}
  canSubmit(){const c=this.context();return this.canInspect()&&!!c.canControl?.(c.selectedPlayer)&&this.pending===null;}
  // Any reset/selection change bumps the generation; stale completions are ignored.
  reset(){this.gen++;this.pending=null;this.ids=new Set();this.status=null;this.last=null;this.results=null;this.render();}
  sync(){const c=this.context(),k=this.keyOf();
    if(this.bound!==k){this.bound=k;if(this.ids.size||this.last)this.reset();return;}
    if(this.ids.size&&!this.canInspect()){this.reset();return;}
    for(const id of [...this.ids])if(!c.game.units.some(u=>u.id===id&&u.owner===c.selectedPlayer))this.ids.delete(id);
    if(this.ids.size)this.poll();this.render();}
  toggleAt(tile,hit){const c=this.context();if(!this.canInspect())return false;
    const u=hit&&hit.owner===c.selectedPlayer?hit:c.game.units.find(v=>v.tile===tile.id&&v.owner===c.selectedPlayer);if(!u)return false;
    this.bound=this.keyOf();if(this.ids.has(u.id))this.ids.delete(u.id);else if(this.ids.size<FORCE_LIMIT)this.ids.add(u.id);else this.toast('最多选择 '+FORCE_LIMIT+' 个单位。',true);
    this.gen++;this.status=null;this.last=null;this.results=null;this.poll(true);this.render();return true;}
  async poll(now=false){if(!this.ids.size||this.fetching||!this.canInspect())return;const t=performance.now();if(!now&&t-this.fetchedAt<500)return;this.fetching=true;this.fetchedAt=t;const k=this.keyOf(),gen=this.gen,c=this.context();
    // Always the selected country's own perspective (== actual view, or explicit observer inspecting it).
    try{const r=await this.api('execution?view='+c.selectedPlayer+'&units='+[...this.ids].join(','));if(gen===this.gen&&k===this.keyOf()&&r.world===this.context().session?.world)this.status=r;}catch{}finally{this.fetching=false;this.render();}}
  async submit(kind){const c=this.context();if(!this.ids.size||!this.canSubmit())return;const intent={kind,units:[...this.ids]};
    if(kind==='move'){const t=c.selection?.tile;if(!Number.isInteger(t)){this.toast('请先用普通点击在地图上选择目标地块。',true);return;}intent.tile=t;}
    const gen=this.gen,k=this.keyOf();this.pending=gen;this.render();let r,err;
    try{r=await this.api('batch',{player:c.selectedPlayer,game:c.game.id,world:c.session.world,intent});}catch(e){err=e;}
    const current=()=>gen===this.gen&&k===this.keyOf();
    if(!current()){ // Drop stale results, but release only this request's pending marker.
      if(this.pending===gen)this.pending=null;
      this.render();return;
    }
    this.pending=null;if(err)this.toast(err.message,true);else{this.last=r.summary;this.results=r.results;}
    await this.refresh();if(current())this.poll(true);this.render();}
  row(s){const head=`${esc(s.name)} #${s.id}`;let a='',b='';
    if(s.state==='queued'){a=`排队中；本国当前优先序 #${s.queue.nationalPriority}`;b=WAIT[s.queue.waiting]||'等待调度';}
    else if(s.state==='active'&&s.activity.segment){a=`行进中，第 ${s.activity.segment.index}/${s.activity.segment.total} 段`;b='当前段剩余 '+sec(s.activity.segmentRemaining);}
    else if(s.state==='active'){a=`执行${ACTION[s.activity.type]||s.activity.type}`;b='剩余 '+sec(s.activity.remaining);}
    else if(s.state==='treatment'){a='接受治疗';b='剩余 '+sec(s.treatment.remaining);}
    else if(s.state==='cooling'){const c=s.cooldowns[0];a=`${COOL[c.action]||c.action}冷却 ${sec(c.remaining)}`;b=c.action==='general'?'全部动作暂停':'其他动作单独判定';}
    else if(s.state==='spent')a='本回合已行动';
    else if(s.state==='waitingTurn')a='等待该文明回合';
    else a='空闲';
    const partner=s.partner!==undefined?` · 编队 #${s.partner}`:'';
    return `<li data-unit="${s.id}" data-state="${s.state}"><b>${head}</b>：${esc(a)}${partner}${b?`<br><span>${esc(b)}</span>`:''}</li>`;}
  render(){const el=this.el;if(!el)return;if(!this.ids.size&&!this.last){el.hidden=true;el.innerHTML='';return;}el.hidden=false;
    const units=(this.status?.units||[]).filter(s=>this.ids.has(s.id)),count=k=>units.filter(s=>s.state===k).length,c=this.context(),control=!!c.canControl?.(c.selectedPlayer),can=this.ids.size&&this.pending===null?'':'disabled';
    const recent=(Array.isArray(this.status?.rejections)?this.status.rejections:[]).filter(x=>this.ids.has(x.unit)||this.ids.has(x.partner)).slice(-5).reverse();
    const rej=recent.length?`<p class="force-last">最近拒绝：</p>${recent.map(x=>`<p class="force-reject">#${Number(x.unit)} ${esc(ACTION[x.type]||x.type)}（${esc(STAGE[x.stage]||x.stage)}，${sec(Number(x.time)||0).replace(' 模拟秒','')} 模拟秒）：${esc(x.reason)}</p>`).join('')}`:'';
    const last=this.last?`<p class="force-last">上次批量：已入队 ${this.last.queued||0}，拒绝 ${this.last.rejected||0}${this.last.merged?`，编队合并 ${this.last.merged}`:''}${this.last.cancelled?`，取消 ${this.last.cancelled}`:''}</p>${(this.results||[]).filter(r=>r.status==='rejected').slice(0,4).map(r=>`<p class="force-reject">#${r.unit??'?'}：${esc(REASON[r.reason]||r.reason)}</p>`).join('')}<p class="force-note">已入队的指令在开始前可能被重新校验</p>`:'';
    el.innerHTML=`<div class="force-head"><b>已选：${this.ids.size} 个单位</b><button data-force="clear" type="button">清除选择</button></div>
<div class="force-actions">${control?`<button data-force="move" type="button" ${can}>移动到所选地块</button><button data-force="fortify" type="button" ${can}>驻防</button><button data-force="cancel" type="button" ${can}>取消</button>${this.pending!==null?'<span class="force-note">提交中…</span>':''}`:'<span class="force-note">只读查看（未接管此国家，不能下达批量指令）</span>'}</div>
<div class="force-counts">执行中 ${count('active')} | 排队 ${count('queued')} | 冷却 ${count('cooling')} | 治疗 ${count('treatment')} | 空闲 ${count('idle')} | 已行动 ${count('spent')} | 等待回合 ${count('waitingTurn')}</div>
<ul class="force-list">${units.map(s=>this.row(s)).join('')}</ul>${rej}${last}<p class="force-help">Ctrl/⌘ + 点击己方单位加入或移出；普通点击选择目标地块</p>`;}
}
