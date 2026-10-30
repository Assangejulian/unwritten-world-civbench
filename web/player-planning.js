export class PlayerPlanning{
 constructor(ctx){this.ctx=ctx;this.key='';this.hoverKey='';this.sequence=0;this.timer=null;this.route=null;}
 sync(){
  const {game,session,view,selection,renderer}=this.ctx.state(),u=selection?.type==='unit'?game?.units.find(u=>u.id===selection.id&&u.owner===view):null;
  const active=u?.type==='settler'&&view>=0&&game.players[view]?.manual&&session.mode==='turns',key=active?[game.id,session.world,u.id,u.tile,game.turn,game.players[view].explored.length,game.cities.map(c=>c.id+':'+c.tile+':'+c.owner).join(',')].join(':'):'';
  if(key===this.key)return;this.key=key;renderer.settlementLens=null;renderer.dirty=true;this.ctx.legend(active);
  if(!key)return;this.ctx.api('unit-plan?view='+view+'&unit='+u.id).then(data=>{if(this.key!==key)return;renderer.settlementLens=new Map(data.sites.map(s=>[s.tile,s]));renderer.dirty=true;}).catch(()=>{});
 }
 siteText(tile){const lens=this.ctx.state().renderer.settlementLens,s=tile&&lens?.get(tile.id);return s?s.legal?'可建城 · 选址收益 '+s.score+'（绿边越亮越好）':'不可建城 · '+s.reason:'';}
 preview(tile,mode){
  const {game,session,view,selection}=this.ctx.state();if(!tile||mode?.label!=='move'||selection?.type!=='unit'||view<0||session.mode!=='turns'){this.cancelPreview();return;}
  const immediate=mode.actions?.find(a=>a.type==='move'&&a.tile===tile.id);
  if(immediate?.hint?.path){this.cancelPreview();this.showRoute({path:immediate.hint.path,arrivals:immediate.hint.path.map(()=>1),turns:1,cost:immediate.hint.cost},tile);return;}
  const key=[game.id,game.turn,selection.id,tile.id,session.revision].join(':');if(key===this.hoverKey){if(this.route)this.showRoute(this.route,tile);return;}this.hoverKey=key;this.route=null;clearTimeout(this.timer);const serial=++this.sequence;
  this.timer=setTimeout(async()=>{try{const data=await this.ctx.api('unit-plan?view='+view+'&unit='+selection.id+'&tile='+tile.id);if(serial!==this.sequence||this.hoverKey!==key||this.ctx.state().selection?.id!==selection.id)return;if(data.route){this.route=data.route;this.showRoute(data.route,tile);}}catch{}},180);
 }
 showRoute(route,tile){const {renderer}=this.ctx.state();renderer.orderPreview=route;renderer.dirty=true;this.ctx.hint((route.turns===1?'本回合可到达'+(route.cost!==undefined?' · 消耗 '+Number(route.cost.toFixed(1))+' 移动力':''):'预计 '+route.turns+' 回合到达')+' · 右键下令 · 左键 / Esc 取消'+(this.siteText(tile)?' · '+this.siteText(tile):''));}
 cancelPreview(){clearTimeout(this.timer);this.sequence++;this.hoverKey='';this.route=null;}
}
