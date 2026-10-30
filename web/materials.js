// Materials layer: shared SVG paint servers (patinated brass, ivory metal) used by rich icons.
// Code-only (no raster). Idempotent.
const NS='http://www.w3.org/2000/svg';
export function mountMaterialDefs(){
 if(document.getElementById('hm-defs'))return;
 const s=document.createElementNS(NS,'svg');s.id='hm-defs';s.setAttribute('aria-hidden','true');s.setAttribute('width','0');s.setAttribute('height','0');s.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
 s.innerHTML=`<defs>
 <linearGradient id="hm-ivory-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e7c8"/><stop offset=".45" stop-color="#d4c09a"/><stop offset=".55" stop-color="#a99067"/><stop offset="1" stop-color="#c9b38a"/></linearGradient>
 <linearGradient id="hm-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b39a64"/><stop offset=".5" stop-color="#6b5530"/><stop offset=".52" stop-color="#4a3a1d"/><stop offset="1" stop-color="#7d6537"/></linearGradient>
 </defs>`;
 document.body.prepend(s);
}
if(document.body)mountMaterialDefs();else document.addEventListener('DOMContentLoaded',mountMaterialDefs,{once:true});
