import {cityDefense,UNITS,BUILDINGS,WONDERS,PRODUCTION} from '/rules.mjs';
import {UNIT_INSIGNIA} from './unit-etchings.js';
import {PICTO_SYMBOLS,pictoId} from './ui-b/ui-b-picto.js';

const art=new Map();
export function cityBannerGrowth(city){
 const status=city.growthStatus;if(!status||!Number.isFinite(status.rate))return null;
 const growing=status.rate>0,turns=growing?status.turns:status.starvationTurns;
 if(Number.isFinite(turns)&&turns>0)return {label:(growing?'+':'−')+turns,turns,change:growing?1:-1,text:`预计 ${turns} 回合后人口 ${growing?'+1':'−1'}`};
 return {label:'—',turns:null,change:0,text:status.rate<0?'食物不足，人口已为 1，不再减少':'食物收支持平，人口暂不增长'};
}
export function cityBannerProduction(city){
 // An opponent's redacted null queue must not be presented as an idle city.
 if(!Object.hasOwn(city,'productionStatus'))return null;
 const item=city.production?.item,status=city.productionStatus;
 return {item:item||null,name:item?PRODUCTION[item]?.name||item:'选择生产',turns:status?.turns??null,progress:status?Math.max(0,Math.min(1,city.production.progress/status.cost)):0};
}
function productionIcon(c,item,x,y,ready){
 c.save();c.translate(x,y);c.fillStyle='#f3efcf';c.strokeStyle='#f3efcf';
 if(UNIT_INSIGNIA[item]){const [body,line,detail]=UNIT_INSIGNIA[item];c.scale(.52,.52);c.fill(new Path2D(body),'nonzero');if(line){c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';c.stroke(new Path2D(line));}if(detail){c.strokeStyle='#1e1409b8';c.lineWidth=1.1;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(detail));}}
 else if(item){let img=art.get(item);if(!img){img=new Image();img.onload=ready;const symbol=PICTO_SYMBOLS[pictoId(WONDERS[item]?'wonder':'building',BUILDINGS[item]?.replaces||item)]||'<path d="M12 2L15 9 22 12 15 15 12 22 9 15 2 12 9 9Z"/>';img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f3efcf" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+symbol+'</svg>');art.set(item,img);}if(img.complete&&img.naturalWidth)c.drawImage(img,-11,-11,22,22);}
 else{c.lineWidth=2;c.beginPath();for(let i=0;i<32;i++){const a=i*Math.PI/16,r=i%4<2?11:8.4;(i?c.lineTo:c.moveTo).call(c,Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.stroke();c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.stroke();}c.restore();
}
export function cityLabelSize(ctx,city){ctx.font='bold 12px "Microsoft YaHei",sans-serif';return {width:Math.max(178,ctx.measureText((city.isCapital?'✦ ':'')+city.name).width+102),height:cityDefense(city).hasWalls?53:47};}
export function drawCityLabel(ctx,city,owner,x,y,ready){
 const {width,height}=cityLabelSize(ctx,city),health=cityDefense(city),work=cityBannerProduction(city),growth=cityBannerGrowth(city),right=x+width-25,nameX=x+32;
 ctx.save();const bg=ctx.createLinearGradient(0,y,0,y+height-8);bg.addColorStop(0,'#4f6265');bg.addColorStop(.18,'#253c47');bg.addColorStop(1,'#13232d');ctx.shadowColor='#0008';ctx.shadowBlur=5;ctx.shadowOffsetY=3;ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,width-5,34,17);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#c8c2a0';ctx.lineWidth=1.2;ctx.stroke();
 ctx.fillStyle=owner?.color||'#647d86';ctx.beginPath();ctx.arc(x+17,y+17,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e7e6ce';ctx.stroke();ctx.fillStyle='#fff9e7';ctx.textAlign='center';ctx.font='bold 12px Georgia';ctx.fillText(city.population,x+17,y+21);
 if(growth){ctx.fillStyle='#15242beb';ctx.beginPath();ctx.roundRect(x+2,y+35,30,12,4);ctx.fill();ctx.fillStyle=growth.change>0?'#bde5ae':growth.change<0?'#ffb4a0':'#c6cbbd';ctx.font='bold 11px Georgia';ctx.fillText(growth.label,x+17,y+44,28);}
 ctx.textAlign='left';ctx.font='bold 12px "Microsoft YaHei",sans-serif';ctx.fillStyle='#f5efd9';ctx.fillText((city.isCapital?'✦ ':'')+city.name,nameX,y+16,width-87);
 const bar=(top,value,max,color)=>{ctx.fillStyle='#091922';ctx.fillRect(nameX,top,width-90,3);ctx.fillStyle=color;ctx.fillRect(nameX,top,(width-90)*Math.max(0,Math.min(1,value/Math.max(1,max))),3);};
 bar(y+23,health.hp,health.maxHp,health.hp<health.maxHp*.5?'#d67b65':'#9acb94');if(health.hasWalls)bar(y+28,health.walls,health.maxWalls,'#b8cedc');
 if(Number.isFinite(city.loyalty)){ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillStyle=city.loyalty<50?'#ffd0aa':'#e6e5d2';ctx.textAlign='left';const delta=city.loyaltyStatus?.change;ctx.fillStyle='#15242bdb';ctx.beginPath();ctx.roundRect(nameX,y+35,67,12,3);ctx.fill();ctx.fillStyle=city.loyalty<50?'#f8ad8f':'#d2d9bc';ctx.fillText('忠诚 '+Math.round(city.loyalty)+(delta<0?' ↓':''),nameX+4,y+44);}
 if(work){const disc=ctx.createRadialGradient(right-5,y+10,1,right,y+17,19);disc.addColorStop(0,'#8d9a8d');disc.addColorStop(.4,'#365364');disc.addColorStop(1,'#0d2434');ctx.fillStyle=disc;ctx.beginPath();ctx.arc(right,y+17,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c7ba92';ctx.lineWidth=2;ctx.stroke();if(work.item){ctx.strokeStyle='#9cd7d4';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(right,y+17,15.5,-Math.PI/2,-Math.PI/2+Math.PI*2*work.progress);ctx.stroke();}productionIcon(ctx,work.item,right,y+16,ready);
 if(work.turns!==null){ctx.fillStyle='#142833';ctx.beginPath();ctx.roundRect(right-11,y+31,22,14,5);ctx.fill();ctx.fillStyle='#f0e5c8';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(Number.isFinite(work.turns)?String(work.turns):'∞',right,y+42);}}
 ctx.restore();return {x,y,width,height,city:city.id,tile:city.tile,growth,production:work?.item||null,productionTurns:work?.turns??null};
}
export function drawCityPressure(ctx,city,center,y){
 if(!(city.loyalty<50&&city.loyaltyStatus?.source))return null;
 const text='↓ '+city.loyaltyStatus.source.name;ctx.save();ctx.font='10px "Microsoft YaHei",sans-serif';const width=ctx.measureText(text).width+18,height=19,x=center-width/2;ctx.fillStyle='#49271ee8';ctx.beginPath();ctx.roundRect(x,y,width,height,8);ctx.fill();ctx.fillStyle='#ffd3ac';ctx.textAlign='left';ctx.fillText(text,x+9,y+13);ctx.restore();return {x,y,width,height,city:city.id,tile:city.tile};
}

// Visual records retain their own last-seen appearance without reading live city state.
export function drawRememberedCityMarker(ctx,city,owner,p,zoom){
 ctx.save();ctx.strokeStyle=owner?.color||'#c5bc93';ctx.fillStyle='#1a120b';ctx.lineWidth=1.6;ctx.setLineDash([2,2]);
 if(!city.appearance||zoom<.35){ctx.beginPath();ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x+7,p.y);ctx.lineTo(p.x,p.y+7);ctx.lineTo(p.x-7,p.y);ctx.closePath();ctx.fill();ctx.stroke();}ctx.setLineDash([]);
 if(zoom<.35){ctx.restore();return null;}
 const title=(city.isCapital?'✦ ':'◇ ')+city.name;ctx.font='11px "Microsoft YaHei",sans-serif';const width=Math.max(100,ctx.measureText(title).width+18),height=34,x=p.x-width/2,y=p.y-(city.appearance?56*zoom+height+8:45);
 ctx.fillStyle='#2a1f15e8';ctx.beginPath();ctx.roundRect(x,y,width,height,2);ctx.fill();ctx.fillStyle='#e6d9b6';ctx.textAlign='left';ctx.fillText(title,x+9,y+14);ctx.font='9px "Microsoft YaHei",sans-serif';ctx.fillStyle='#b4a37e';ctx.fillText(city.isCapital?'首都 · 地图记录':'已知城市 · 地图记录',x+9,y+27);ctx.restore();
 return {x,y,width,height,city:city.id,tile:city.tile,remembered:true};
}
