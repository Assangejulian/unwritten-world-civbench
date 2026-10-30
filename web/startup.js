// A failed module import must leave an actionable screen rather than an empty map shell.
import('/ui-b/ui-b.js').then(interfaceModule=>{
  interfaceModule.mount();
  return import('/app.js');
}).catch(error=>{
  console.error('Game interface startup failed:',error);
  const panel=document.createElement('section');panel.id='startup-error';panel.setAttribute('role','alert');
  panel.style.cssText='position:fixed;inset:0;z-index:10000;display:grid;place-content:center;gap:18px;padding:32px;background:#102321;color:#ead7a4;font:16px Georgia,serif';
  const heading=document.createElement('h1');heading.textContent='界面载入失败';
  const text=document.createElement('p');text.textContent='界面模块未能完成加载。可以重新载入；无需删除或重置存档。';
  const detail=document.createElement('pre');detail.textContent=String(error.message||error);detail.style.cssText='max-width:80vw;white-space:pre-wrap;font-size:12px;opacity:.7';
  const retry=document.createElement('button');retry.textContent='重新载入界面';retry.onclick=()=>location.reload();retry.style.cssText='padding:14px 24px;border:1px solid #b89b56;background:#d8bd7d;color:#25342b;cursor:pointer';
  panel.append(heading,text,detail,retry);document.body.append(panel);
});
