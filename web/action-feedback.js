// Presentation receipts use the refreshed player view, never infer acceptance from a click.
import {TECHS,CIVICS,PRODUCTION,UNITS} from '/rules.mjs';
const courtNames={friendship:'友谊',delegation:'使团',embassy:'大使馆',typedAlliance:'同盟',tradeDeal:'交易',demand:'索取'};
export function actionReceipt(action,before,after,player,queued=false){
 if(queued)return {message:queued==='running'?'命令已提交，等待执行。':'命令已排队，继续后执行。',tone:'confirm'};
 const name=PRODUCTION[action.item]?.name||action.item||'',other=after.players.find(p=>p.id===action.player);
 if(courtNames[action.type]){
  const previous=new Set((before.court?.offers||[]).map(o=>o.id));
  const offer=(after.court?.offers||[]).findLast(o=>o.from===player&&o.to===action.player&&o.kind===action.type&&!previous.has(o.id));
  if(offer)return {message:offer.status==='accepted'?`${other?.short||'对方'}接受了${courtNames[action.type]}`:offer.status==='rejected'?`${other?.short||'对方'}拒绝了${courtNames[action.type]}`:`${courtNames[action.type]}申请已送达，等待对方答复`,tone:offer.status==='rejected'?'decline':'confirm'};
 }
 if(['acceptCourt','rejectCourt'].includes(action.type))return {message:action.type==='acceptCourt'?'已接受外交提议':'已拒绝外交提议',tone:'confirm'};
 const messages={produce:`当前生产：${name}`,research:`开始研究：${TECHS[action.item]?.name||name}`,civic:`开始研究：${CIVICS[action.item]?.name||name}`,buy:`已购买${name}`,purchase:`已购买${name}`,faithPurchase:`已招募${name}`,recruitFaith:`已招募${name}`,trainSpy:'间谍已招募',found:'城市已建立',denounce:'已公开谴责',formalWar:'已正式宣战',surpriseWar:'已宣战',fortify:'单位已驻防',alert:'单位已进入警戒',sleep:'单位已休眠',skip:'单位本回合待命',improve:'地块已改良',chop:'地块已清理',repair:'设施已修复',upgrade:`单位已升级${UNITS[action.item]?'：'+UNITS[action.item].name:''}`,route:'连续行军已安排',cancelRoute:'已取消连续行军',move:'移动命令已执行',attack:'攻击命令已执行',cityAttack:'城防攻击已执行',rebase:'转场命令已执行',link:'编队已建立',unlink:'编队已解除'};
 return {message:messages[action.type]||'命令已执行',tone:'confirm'};
}

export function markCommandPending(button){
 if(!button?.isConnected)return ()=>{};
 const disabled=button.disabled;button.disabled=true;button.setAttribute('aria-busy','true');button.classList.add('command-pending');
 return success=>{if(!button.isConnected)return;button.disabled=disabled;button.removeAttribute('aria-busy');button.classList.remove('command-pending');if(success){button.classList.add('command-confirmed');setTimeout(()=>button.classList.remove('command-confirmed'),550);}};
}
