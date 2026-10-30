// Line engravings extend the existing brass-and-parchment interface.
import {controlGlyph} from './ui-b/ui-b-icons.js';
const paths={
 alert:'M12 2l9 5v7c0 5-9 9-9 9S3 19 3 14V7z M12 7v8 M12 18v1',
 unit:'M10 2H14L13 16H11Z M10 20H14V22H10Z',
 pantheon:'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M7 10L1 4v5l5 5 M17 10l6-6v5l-5 5 M2 10l4 7 M22 10l-4 7 M9 19l3 3 3-3',
 capture:'M2 22h20 M4 22V10l8-6 8 6v12 M8 22v-7h8v7 M3 10h18 M7 10v3 M17 10v3 M12 4V1h7l-2 2-5 1',
 defense:'M3 22C2 9 8 3 20 4 M15 1l6 3-4 6 M3 22l7-7',
 upgrade:'M4 17l8-9 8 9 M4 10l8-9 8 9 M12 10v13',
 promotion:'M12 1l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z',
 work:'M3 22L20 3 M15 2l7 7 M3 3l18 18 M1 7l6-6 M17 23l6-6',
 jump:'M2 21Q12-14 22 21 M16 16l6 5 1-8',
 research:'M8 2h8 M10 2v8L3 22h18l-7-12V2 M7 16h10',
 congress:'M2 21h20 M4 10h16 M5 10v9 M12 10v9 M19 10v9 M2 7l10-5 10 5',
 civic:'M3 8l9-6 9 6 M3 10h18 M5 10v11 M12 10v11 M19 10v11 M2 22h20',
 end:'M2 12h18 M13 5l7 7-7 7',
 battle:'M3 3l18 18 M4 1l-3 3 5 5 3-3 M21 3L3 21 M20 1l3 3-5 5-3-3'
};
export const taskIcon=kind=>kind==='production'?controlGlyph(kind):`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path ${kind==='unit'?'fill="currentColor" stroke="none"':''} d="${paths[kind]||paths.unit}"/></svg>`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function incomingBattles(previous,game,view){
 if(!previous||previous.id!==game.id||previous.visuals?.epoch!==game.visuals?.epoch||previous.visuals?.view!==game.visuals?.view)return [];
 const last=previous.visuals?.sequence||0,alerts=new Map();
 for(const e of game.visuals?.events||[]){if(e.id<=last)continue;let victim;
  if(['hurt','death'].includes(e.kind)&&e.actor.owner===view)victim=e.actor;
  else if(e.kind==='attack'&&e.target?.owner===view&&e.actor.owner!==view)victim=e.target;
  if(!victim)continue;const key=(victim.type==='city'?'c:':'u:')+victim.id,old=alerts.get(key);alerts.set(key,{id:e.id,tile:victim.tile,unit:victim.id,name:victim.name||victim.type,dead:e.kind==='death'||old?.dead,damage:(old?.damage||0)+(e.kind==='hurt'?e.damage||0:0)});
 }
 const eventId=Math.max(0,...(previous.events||[]).map(e=>e.id||0));for(const e of game.events||[])if(e.id>eventId&&e.type==='capture'&&e.player===view)alerts.set('capture:'+e.id,{id:e.id,tile:e.tile,name:'平民单位',captured:true});
 return [...alerts.values()].slice(-12);
}

// The first task may introduce the view. After that, an automatic unit task never
// moves the camera: finishing a move, a new turn, or the orb advancing to another
// unit leaves the player where they are. Capture, production and defense still focus.
// Cycle buttons and the task button pass manual=true.
export function shouldMoveCameraToTask(previous,task,manual){
 if(manual||!previous)return true;
 return task.kind!=='unit';
}
export class PlayerTaskDock{
 constructor(root,ctx){this.ctx=ctx;this.root=root;this.data=null;this.key='';this.loading=null;this.index=0;this.stamp='';this.battles=[];root.className='pt-dock';root.id='player-task-dock';root.hidden=true;}
 sync(){
  const {game,session,view,menuShown}=this.ctx.state(),human=session?.role!=='observer'&&session?.role!=='host'&&view>=0&&game?.players[view]?.manual&&session?.mode==='turns';
  document.getElementById('app').classList.toggle('player-controls',human);this.root.hidden=!human||menuShown;
  const identity=[game?.id,session?.world,view].join(':');if(this.identity!==identity){this.identity=identity;this.data=null;this.key='';this.index=0;this.battles=[];this.focusStamp='';this.focusTask=null;this.stamp='';}
  if(!human){this.data=null;this.key='';return;}
  const key=[game.id,session.world,session.revision,view].join(':');if(this.key!==key&&!this.loading){this.key=key;this.loading=this.ctx.api('tasks?view='+view).then(data=>{const now=this.ctx.state();if(data.game===now.game.id&&data.world===now.session.world&&data.player===now.view){const current=this.data?.tasks[this.index]?.id,urgent=data.tasks.findIndex(t=>t.kind==='capture'&&!this.data?.tasks.some(old=>old.id===t.id)),same=data.tasks.findIndex(t=>t.id===current);this.data=data;this.index=urgent>=0?urgent:same>=0?same:Math.min(this.index,Math.max(0,data.tasks.length-1));this.stamp='';this.render();this.focusCurrent();}}).catch(()=>{this.key='';}).finally(()=>{this.loading=null;if(this.key!==[this.ctx.state().game.id,this.ctx.state().session.world,this.ctx.state().session.revision,this.ctx.state().view].join(':'))this.sync();});}
  this.render();this.focusCurrent();
 }
 focusCurrent(manual=false){
  const {game,session,menuShown}=this.ctx.state();if(menuShown||!this.data?.active||session.busy||document.querySelector("dialog[open]"))return;const tasks=this.data.tasks,task=tasks[this.index]?.tile!==undefined?tasks[this.index]:tasks.find(t=>t.tile!==undefined);if(!task)return;const stamp=[game.id,game.turn,task.id].join(":");
  if(!shouldMoveCameraToTask(this.focusTask,task,manual)){this.focusStamp=stamp;this.focusTask={id:task.id,kind:task.kind};return;}
  if(this.focusStamp===stamp&&!manual)return;this.focusStamp=stamp;this.focusTask={id:task.id,kind:task.kind};this.ctx.focusTask(task);
 }
 render(){
  const {game,session,view,selection}=this.ctx.state(),data=this.data,tasks=data?.tasks||[],task=tasks[this.index],unit=selection?.type==='unit'?game.units.find(u=>u.id===selection.id&&u.owner===view):null;
  const quick=unit?(data?.unitActions?.[unit.id]||[]).filter(a=>['alert','wake','cancelRoute'].includes(a.action?.type)||a.command==='trainVeteran').filter((a,i,all)=>a.command!=='trainVeteran'||all.findIndex(v=>v.command==='trainVeteran')===i):[];
  // Transport revisions alone do not change the task UI or justify replacing focused controls.
  const {revision:transportRevision,...taskState}=data||{};
  const stamp=JSON.stringify([taskState,unit?.id,session.busy,session.canEndTurn,this.index,this.battles.at(-1)]);if(this.stamp===stamp)return;this.stamp=stamp;
  const disabled=session.busy||!session.canEndTurn,endDisabled=disabled||tasks.some(t=>t.kind==='capture'),icon=task?.kind||'end';
  this.root.innerHTML=`${this.battles.length?`<button class="pt-battle" title="定位最近受袭地点">${taskIcon('battle')}<span>${this.battles.at(-1).captured?'单位被俘':this.battles.at(-1).dead?'单位阵亡':'部队受袭'}</span></button>`:''}<div class="pt-quick">${quick.map((a,i)=>`<button data-pt-quick="${i}" title="${esc(a.label)}" aria-label="${esc(a.label)}" ${disabled?'disabled':''}>${taskIcon(a.icon)}</button>`).join('')}</div><div class="pt-mainrow">${tasks.length>1?'<button class="pt-cycle" data-pt-cycle="-1" aria-label="上一个待办">'+controlGlyph('prev')+'</button>':''}<button class="pt-main k-${icon}" ${disabled?'disabled':''} aria-label="${esc(task?.title||'结束回合')}">${taskIcon(icon)}<span>${esc(task?.title||'结束回合')}<small>${tasks.length?(this.index+1)+' / '+tasks.length:''}</small></span></button>${tasks.length>1?'<button class="pt-cycle" data-pt-cycle="1" aria-label="下一个待办">'+controlGlyph('next')+'</button>':''}</div>${tasks.length?`<button class="pt-end" title="结束回合" aria-label="结束回合" ${endDisabled?'disabled':''}>${taskIcon('end')}</button>`:''}<div class="pt-choices"></div>`;
  this.root.querySelector('.pt-main').onclick=()=>task?this.open(task):this.ctx.endTurn();this.root.querySelector('.pt-end')?.addEventListener('click',()=>this.ctx.endTurn());
  this.root.querySelectorAll('[data-pt-cycle]').forEach(b=>b.onclick=()=>{this.index=(this.index+Number(b.dataset.ptCycle)+tasks.length)%tasks.length;this.render();this.focusCurrent(true);});
  this.root.querySelectorAll('[data-pt-quick]').forEach(b=>b.onclick=()=>this.perform(unit,quick[Number(b.dataset.ptQuick)]));
  this.root.querySelector('.pt-battle')?.addEventListener('click',()=>this.ctx.focusBattle(this.battles.at(-1)));
 }
 async perform(unit,item){this.ctx.selectUnit(unit.id);if(item.action)await this.ctx.act(item.action);else if(item.command==='trainVeteran')this.ctx.promote(unit);else await this.ctx.command(unit,item.command,item.item);}
 open(task){
  if(task.modal){this.ctx.modal(task.modal);return;}
  if(task.city)this.ctx.selectCity(task.city);else if(task.unit)this.ctx.selectUnit(task.unit);
  if(task.kind==='production')this.ctx.workshop(task.city);
  else if(task.kind==='defense'){if(task.targets.length)this.ctx.cityAttack(task.city);else this.ctx.defenseWarning();}
  else if(task.kind==='unit'){
   const unit=this.ctx.state().game.units.find(u=>u.id===task.unit);if(!unit)return;
   const special=task.actions.find(a=>a.action?.type==='found');if(special)this.render();else this.ctx.command(unit,'move');
  }else if(task.kind==='capture'){
   const area=this.root.querySelector('.pt-choices');area.innerHTML=task.choices.map((c,i)=>`<button data-pt-choice="${i}" ${c.disabled?'disabled':''} title="${esc(c.reason)}">${esc(c.label)}</button>`).join('');
   area.querySelectorAll('[data-pt-choice]').forEach(b=>b.onclick=()=>this.ctx.act(task.choices[Number(b.dataset.ptChoice)].action));
  }
 }
 notify(alerts){if(!alerts.length)return;this.battles=[...this.battles,...alerts].slice(-16);this.stamp='';this.render();}
}
