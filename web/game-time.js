// Game timers keep their legacy 20-second representation in saves and native observations.
// Present them as rounds in human games, including shared A/B council markup and tooltips.
export function gameTimeText(text,turnBased){
  if(!turnBased)return text;
  return text.replace(/经济周期/g,'回合').replace(/周期/g,'回合')
    .replace(/(\d[\d,]*(?:\.\d+)?)\s*(?:游戏|模拟)?秒/g,(_,n)=>Math.ceil(Number(n.replaceAll(',',''))/20)+' 回合');
}
export function installGameTimeLabels(context){
  const originals=new WeakMap();let pending=false;
  const excluded=el=>el?.closest('script,style,textarea,input,pre,code,.driver-table,.driver-error,#audio-now,.audio-credits,.audio-settings')||el?.closest('#toast')&&/编译|毫秒/.test(el.textContent);
  const rewrite=()=>{
    pending=false;const turns=context()?.mode==='turns';
    for(const root of [document.body]){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
      while(node=walker.nextNode()){
        if(excluded(node.parentElement))continue;
        const old=originals.get(node),raw=old&&node.data===old.shown?old.raw:node.data,shown=gameTimeText(raw,turns);
        originals.set(node,{raw,shown});if(node.data!==shown)node.data=shown;
      }
      for(const el of root.querySelectorAll('[title],[aria-label]')){
        if(excluded(el))continue;
        for(const attr of ['title','aria-label']){if(!el.hasAttribute(attr))continue;const key=attr==='title'?'gameTimeTitle':'gameTimeAria',old=el[key],current=el.getAttribute(attr),raw=old&&current===old.shown?old.raw:current,shown=gameTimeText(raw,turns);el[key]={raw,shown};if(shown!==current)el.setAttribute(attr,shown);}
      }
    }
  };
  const schedule=()=>{if(pending)return;pending=true;queueMicrotask(rewrite);};
  const observer=new MutationObserver(schedule);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label']});
  document.addEventListener('hex:rendered',schedule);schedule();return {refresh:schedule,dispose:()=>observer.disconnect()};
}
