// Load only structures that enter the viewport. No per-frame asset requests.
import {LEADERS,DEFAULT_LEADER_KEYS} from '/rules.mjs';
import {uniqueDistrictKey} from './unique-structures.js';
const images=new Map();
export function drawFortification(renderer,c,t){
 if(!t.fort&&t.district?.item==='barracks'&&uniqueDistrictKey(t,renderer.game.cities.find(city=>city.id===t.district.city)))return;
 const style=t.fort?.style,key=t.fort?(LEADERS.some(l=>l.key===style)?style:DEFAULT_LEADER_KEYS[t.fort.owner]||'qin'):(t.district?.item==='barracks'?'barracks':null);if(!key)return;
 let image=images.get(key);if(image===undefined){image=new Image();images.set(key,image);image.onload=()=>{renderer.dirty=true;};image.onerror=()=>images.set(key,null);image.src='/assets/fortifications/'+encodeURIComponent(key)+'.webp';}
 if(!image?.complete||!image.naturalWidth)return;
 const p=renderer.screen(t),width=48*renderer.zoom,height=width*image.naturalHeight/image.naturalWidth;c.save();if(t.pillaged)c.filter='grayscale(1) brightness(.55)';c.globalAlpha=t.visible===false?.65:1;c.drawImage(image,p.x-width/2,p.y-height*.82,width,height);c.restore();
 if(t.fort){c.fillStyle='#142a31';c.fillRect(p.x-width*.3,p.y+5,width*.6,3);c.fillStyle='#cdb47e';c.fillRect(p.x-width*.3,p.y+5,width*.6*t.fort.hp/160,3);}
}
