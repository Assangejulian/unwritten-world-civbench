const fs=require('node:fs');
function edit(file,fn){let t=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');const r=(a,b)=>{if(!t.includes(a))throw new Error('Missing anchor '+file+': '+a.slice(0,60));t=t.replace(a,b);};fn(r);fs.writeFileSync(file,t);}
edit('web/app.js',r=>{
 r("import {GameAudio,TRACKS} from './audio.js';","import {GameAudio,TRACKS} from './audio.js';\nimport {diplomacyMarkup} from './diplomacy-panel.js';");
 r("function unitStateLabel(u){return", "function unitStateLabel(u){if(u.type==='envoy')return u.envoy?.protected?'金光保护 · 前往首都':'保护结束 · 谈判来使';return");
 r("function hoverTile(tile,event,unit){", `function tileTitle(tile){const city=game.cities.find(c=>c.tile===tile.id),building=city?.name||PRODUCTION[tile.district?.item]?.name||(tile.fort?'堡垒':tile.fortRuin?'堡垒遗址':IMPROVEMENTS[tile.improvement]?.name);const terrain=TERRAINS[renderer.terrainType(tile)]?.name||'未知地块',feature=tile.feature==='forest'?'森林':tile.feature==='jungle'?'雨林':tile.hill?'丘陵（'+terrain+'）':tile.river?'河流 · '+terrain:terrain;return (building||feature)+(tile.pillaged?' · 被掠夺':'');}
function hoverTile(tile,event,unit){`);
 r("esc(city?.name||TERRAINS[renderer.terrainType(tile)]?.name||'未知地块')", "esc(tileTitle(tile))");
 r("tile.hidden?'未知的土地':TERRAINS[renderer.terrainType(tile)]?.name||'未知'", "tile.hidden?'未知的土地':esc(tileTitle(tile))");
 r("${tile.hill?'丘陵':''}</h2>", "</h2>");
 r("${tile.district?'已建 '+PRODUCTION[tile.district.item].name+'<br>':''}", "${tile.district?'已建 '+PRODUCTION[tile.district.item].name+'<br>':''}${tile.fort?'堡垒：'+Math.round(tile.fort.hp)+' / 160 生命 · 周围 3×3 恢复生命<br>':''}${tile.road?'道路：'+(tile.roadPillaged?'已被摧毁':'可加速行军')+'<br>':''}${tile.pillaged?'设施已被掠夺，需要建筑工修复。<br>':''}");
 r("<div class=\"stat-pair\">战斗力<b>${u.strength}</b></div>", "<div class=\"stat-pair\">移动冷却<b>${fmt(Math.max(0,(u.moveUntil||0)-(session.time||0)))} 秒</b></div><div class=\"stat-pair\">攻击冷却<b>${fmt(Math.max(0,(u.attackUntil||0)-(session.time||0)))} 秒</b></div><div class=\"stat-pair\">战斗力<b>${u.strength}</b></div>");
 r("data-unit-action=\"move\" ${inactive?'disabled':''}","data-unit-action=\"move\" ${inactive||(u.moveUntil||0)>(session.time||0)?'disabled':''}");
 r("↑ 升级装备</button>","↑ 升级装备</button><button data-unit-action=\"pillage\" ${inactive?'disabled':''}>掠夺物资</button><button data-unit-action=\"destroyRoad\" ${inactive?'disabled':''}>摧毁道路</button><button data-unit-action=\"destroyFort\" ${inactive?'disabled':''}>摧毁堡垒</button>");
 r("${u.type==='builder'?`<button", "${u.type==='builder'?`<p class=\"inspector-note wide\">堡垒 ${owner.fortresses?.used||0} / ${owner.fortresses?.limit||5} · ${owner.fortresses?.goldCost||45} 金币 · ${owner.fortresses?.seconds||12} 秒</p><button class=\"wide\" data-unit-action=\"buildFort\" ${inactive?'disabled':''}>建造堡垒</button><button data-unit-action=\"buildRoad\" ${inactive?'disabled':''}>铺设道路</button><button data-unit-action=\"repair\" ${inactive?'disabled':''}>修复设施</button><button");
 const text=fs.readFileSync('web/app.js','utf8').replaceAll('\r\n','\n'),start=text.indexOf("  if(modalTab==='relations')"),end=text.indexOf("  else if(modalTab==='victories')",start);
 if(end<0)throw new Error('Missing diplomacy branch');r(text.slice(start,end),"  if(modalTab==='relations')$('dip-content').innerHTML=diplomacyMarkup(game,p,session,control);\n");
 r("$('modal-body').querySelectorAll('[data-diplomacy]').forEach", "$('modal-body').querySelectorAll('[data-proposal]').forEach(b=>b.onclick=()=>act({type:b.dataset.response,proposal:Number(b.dataset.proposal)}));$('modal-body').querySelectorAll('[data-agenda]').forEach(b=>b.onclick=()=>act({type:'voteAid',agenda:Number(b.dataset.agenda),choice:b.dataset.choice}));$('modal-body').querySelectorAll('[data-diplomacy]').forEach");
 r("if(activeModal==='leaders')updateLeaderClock();", "if(activeModal==='leaders')updateLeaderClock();if(activeModal==='diplomacy'&&modalTab==='relations'&&Math.floor(session.time||0)!==diplomacySecond){diplomacySecond=Math.floor(session.time||0);renderDiplomacy();}");
 r("let game=null,session=null", "let diplomacySecond=-1;\nlet game=null,session=null");
});
edit('web/map.js',r=>{
 r("export const UNIT_SYMBOLS={", "export const UNIT_SYMBOLS={\n  envoy:{role:'和谈使者',path:'M0-12V12 M-10 0H10 M-8-8L8 8 M8-8L-8 8'},");
 r("UNIT_ATLAS_TYPES.indexOf(type)","UNIT_ATLAS_TYPES.indexOf(type==='envoy'?'missionary':type)");
});
edit('web/visuals.js',r=>r("export const UNIT_MOTIONS={","export const UNIT_MOTIONS={\n  envoy:{family:'civilian',cadence:11,bob:1.4,swing:.035},"));
edit('web/unit-animation.js',r=>r("export const UNIT_RIGS={","export const UNIT_RIGS={\n  envoy:walk([...pair(.27,.63,.08),...pair(.69,.68,.07)],.9),"));
edit('web/map3d.js',r=>{
 r("import {populateStructures} from './world-buildings.js';", "import {populateStructures} from './world-buildings.js';\nimport {drawFortification} from './fortification-art.js';");
 r("const p=this.screen(t);\n      if(this.showResources", "const p=this.screen(t);drawFortification(this,c,t);\n      if(t.pillaged||t.roadPillaged){c.fillStyle='#dca38b';c.font='12px sans-serif';c.fillText('×',p.x+18*this.zoom,p.y+5);}\n      if(this.showResources");
 r("this.unitSprites.painted.sheets.has(u.type)", "this.unitSprites.painted.sheets.has(u.type==='envoy'?'missionary':u.type)");
 r("this.unitSprites.frame(u.type,frameIndex", "this.unitSprites.frame(u.type==='envoy'?'missionary':u.type,frameIndex");
 r("c.drawImage(frame.canvas,art.left,art.top,size,size);", "if(u.type==='envoy'&&u.envoy?.protected){c.shadowColor='#ffd35e';c.shadowBlur=20*scale;c.filter='brightness(1.25) sepia(.2)';}c.drawImage(frame.canvas,art.left,art.top,size,size);");
 r("${t.improvement}:${t.camp}:${t.terrain}:${t.hill}", "${t.improvement}:${t.camp}:${t.terrain}:${t.hill}:${t.road}:${t.roadPillaged}:${t.pillaged}:${t.fort?.hp}");
 r("(t.district||t.improvement||t.camp)","(t.district||t.improvement||t.camp||t.road||t.fort)");
});
edit('web/world-buildings.js',r=>{
 r("const tile=game.map.tiles[id],near=", "const tile=game.map.tiles[id];if(tile.roadPillaged)continue;const near=");
 r("t&&!t.hidden&&!isWater(t)", "t&&!t.hidden&&!t.roadPillaged&&!isWater(t)");
 r("const shapes=new Map(),roads=[]", "const shapes=new Map(),roads=[]");
 r("  const cathedral=", "  for(const t of game.map.tiles)if(!t.hidden&&t.road&&!t.roadPillaged)for(const [dq,dr]of DIRECTIONS){const n=renderer.index.get(`${t.q+dq},${t.r+dr}`);if(n&&n.id>t.id&&n.road&&!n.roadPillaged&&!n.hidden){const a=renderer.position(t),b=renderer.position(n);if(period)b.x+=Math.round((a.x-b.x)/period)*period;road({x:a.x,y:renderer.heightAt(t),z:a.y},{x:b.x,y:renderer.heightAt(n),z:b.y},2.8);}}\n  const cathedral=");
});
fs.appendFileSync('web/style.css','\n.diplomatic-pressure{font-size:10px;color:var(--muted)}.diplomatic-row .leader-avatar{width:43px;height:43px}.diplomatic-row .buttons{display:flex;flex-wrap:wrap;gap:6px;max-width:285px}.diplomatic-offer,.world-treaty{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:15px 0;border-bottom:1px solid var(--line)}.diplomatic-offer span{font-size:11px;color:var(--muted)}.world-diplomacy{margin-top:28px}.world-diplomacy h3{font-size:15px;color:var(--gold);font-weight:400}.world-diplomacy p{font-size:11px;color:var(--muted);line-height:1.8}.world-treaty{justify-content:space-between;font-size:12px}.world-treaty strong{font-weight:400;color:var(--gold)}.aid-agenda{border-top:1px solid var(--line);padding:14px 0}.aid-agenda h4{font-weight:400;color:var(--ink)}.aid-agenda button{padding:8px 12px;margin:0 6px 6px 0}@media(max-width:760px){.diplomatic-row{grid-template-columns:43px 1fr}.diplomatic-row .buttons{grid-column:2;max-width:none}.diplomatic-row .buttons button{font-size:10px}.diplomatic-offer strong{flex-basis:100%}}\n');
