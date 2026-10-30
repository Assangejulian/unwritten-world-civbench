const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function edit(file,fn){const destination=path.join(root,file);fs.writeFileSync(destination,fn(fs.readFileSync(destination,'utf8')));}
function replace(s,from,to){if(!s.includes(from))throw new Error('Missing source anchor: '+from.slice(0,90));return s.replace(from,to);}
edit('src/engine.mjs',s=>{
  s=replace(s,"  const c={id:g.nextId++,owner:p.id,originalOwner:p.id,name:","  const nation=historicalNation(p),names=nation?.cityNames||CIVS[p.id].cityNames;\n  const c={id:g.nextId++,owner:p.id,originalOwner:p.id,name:");
  s=replace(s,"p.capitalName||CIVS[p.id].capital:CIVS[p.id].cityNames[0]:CIVS[p.id].cityNames[(p.citySequence-1)%CIVS[p.id].cityNames.length]","p.capitalName||nation?.capital||CIVS[p.id].capital:names[0]:names[(p.citySequence-1)%names.length]");
  return replace(s,"    p.leaderKey??=LEGACY_LEADERS[p.id].key;p.strategy", "    p.leaderKey??=LEGACY_LEADERS[p.id].key;Object.assign(p,historicalIdentity(p.leaderKey));p.strategy");
});
for(const file of ['server.mjs','scripts/art-audit-server.cjs'])edit(file,s=>s.replaceAll("['/rules.mjs','/river-network.mjs']","['/rules.mjs','/river-network.mjs','/nations.mjs']").replaceAll("['/rules.mjs', '/river-network.mjs']","['/rules.mjs', '/river-network.mjs', '/nations.mjs']").replaceAll("['rules.mjs','river-network.mjs']","['rules.mjs','river-network.mjs','nations.mjs']").replace("'.png':'image/png'","'.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.png':'image/png'"));
edit('web/map3d.js',s=>{
  const from=s.indexOf('    if(this.menuOpen){const key='),to=s.indexOf('\n',from);
  if(from<0)throw new Error('Missing menu draw guard');
  return s.slice(0,from)+'    if(this.menuOpen)return;'+s.slice(to);
});
edit('web/lazy-map.js',s=>replace(s,"  pick(...args){return this.instance?.pick(...args);}","  pick(...args){return this.instance?.pick(...args);}\n  setBorderStyle(style){this.options.borderStyle=['solid','soft','hidden'].includes(style)?style:'solid';this.options.showBorders=this.options.borderStyle!=='hidden';this.instance?.setBorderStyle(style);}"));
edit('web/app.js',s=>{
  s=replace(s,"import {MapRenderer,UNIT_SYMBOLS,unitGlyph} from './map3d.js';","import {UNIT_SYMBOLS,unitGlyph} from './map.js';\nimport {LazyMapRenderer} from './lazy-map.js';\nimport {historicalNation} from '/nations.mjs';\nimport {GameAudio} from './audio.js';");
  s=replace(s,"const renderer=new MapRenderer($('map'),$('minimap'),selectTile,hoverTile);","const renderer=new LazyMapRenderer($('map'),$('minimap'),selectTile,hoverTile);\nconst audio=new GameAudio();\nconst portrait=(leader,small=false)=>LEADERS.some(l=>l.key===leader.key)?`<img class=\"leader-${small?'avatar':'portrait'}\" src=\"/assets/leaders/${leader.key}${small?'-small':''}.webp\" alt=\"${esc(leader.name)}\" width=\"${small?128:640}\" height=\"${small?128:800}\" decoding=\"async\" ${small?'':'loading=\"lazy\"'}>`:'';\nconst syncAudio=()=>{if(game)audio.sync(game,session,selectedPlayer,menuShown,renderer.instance);};");
  s=replace(s,"    renderTransport();if(game.winner","    syncAudio();renderTransport();if(game.winner");
  s=replace(s,'<span class="player-sigil"><span>${p.symbol}</span></span>','<span class="player-sigil">${portrait(leaderFor(p),true)||`<span>${p.symbol}</span>`}</span>');
  s=replace(s,"function focusPlayer(id){selectedPlayer=id;", "function focusPlayer(id){selectedPlayer=id;syncAudio();");
  s=replace(s,"if(activeModal==='leaders')renderLeaders();else", "if(activeModal==='audio')renderAudio();else if(activeModal==='leaders')renderLeaders();else");
  s=replace(s,"const d=draft[p.id],leader=leaderFor({leaderKey:d.leader});return", "const d=draft[p.id],leader=leaderFor({leaderKey:d.leader}),nation=historicalNation(d.leader);return");
  s=replace(s,'<span class="symbol">${p.symbol}</span><span>${p.name}<small>国家特性：${p.trait}</small></span>','<span class="symbol">${portrait(leader,true)}</span><span>${esc(nation.name)}<small>发展传统：${p.trait}</small></span>');
  s=s.replaceAll('aria-label="${p.name}的C++驱动"','aria-label="${esc(nation.name)}的C++驱动"').replaceAll('aria-label="${p.name}的历史领袖"','aria-label="${esc(nation.name)}的历史领袖"');
  s=replace(s,'<span>${o.symbol}</span><strong>${esc(o.name)}</strong><small>${esc(leaderFor(o).name)}</small>','<span>${portrait(leaderFor(o),true)||o.symbol}</span><strong>${esc(o.name)}</strong><small>${esc(leaderFor(o).name)}</small>');
  s=replace(s,'<span class="leader-seal" style="color:${p.color}">${p.symbol}</span>','${portrait(leader)}');
  s=replace(s,'当前旧存档保留原有领袖与技能。','国家名称对应领袖所属的历史政权。');
  s=replace(s,"$('historical-profile').innerHTML=leaderProfile(leaderFor({leaderKey:$('historical-preview').value}));","const leader=leaderFor({leaderKey:$('historical-preview').value});$('historical-profile').innerHTML=`${portrait(leader)}<div><h3>${esc(leader.name)}</h3><p class=\"leader-origin\">${esc(historicalNation(leader.key).name)}</p>${leaderProfile(leader)}</div>`;");
  s=s.replaceAll('closeModal();hideStartMenu();await refresh(true);','closeModal();await refresh(true);await hideStartMenu();').replaceAll('closeModal();hideStartMenu();focusPlayer(0);','closeModal();await hideStartMenu();focusPlayer(0);');
  s=replace(s,"function hideStartMenu(){menuShown=false;renderer.menuOpen=false;renderer.keys.clear();renderer.dirty=true;$('start-menu').hidden=true;$('app').classList.remove('menu-open');}","async function hideStartMenu(){const button=$('menu-continue');button.disabled=true;$('menu-loading').hidden=false;try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await renderer.ensure();menuShown=false;renderer.menuOpen=false;renderer.keys.clear();renderer.dirty=true;$('start-menu').hidden=true;$('app').classList.remove('menu-open');syncAudio();}catch(error){toast('地图载入失败：'+error.message,true);}finally{button.disabled=false;$('menu-loading').hidden=true;}}");
  s=replace(s,"updateMenu();$('menu-continue').focus();}","updateMenu();syncAudio();$('menu-continue').focus();}");
  s=replace(s,"$('menu-continue').onclick=hideStartMenu;", "$('menu-audio').onclick=()=>openModal('audio');\n$('menu-continue').onclick=hideStartMenu;");
  s=replace(s,'},renderer,refresh,api,focusPlayer', '},get renderer(){return renderer.instance||renderer;},audio,refresh,api,focusPlayer');
  s=replace(s,"renderPanels();await refresh(true);", "menuShown=true;$('start-menu').hidden=false;$('app').classList.add('menu-open');\nrenderPanels();await refresh(true);");
  s=replace(s,"document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedulePoll(0);});","document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedulePoll(0);});\ndocument.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});\ndocument.addEventListener('keydown',event=>{if(!event.repeat)audio.unlock();},{capture:true});\ndocument.addEventListener('click',event=>{if(event.target.closest('button:not(:disabled)'))audio.play('ui');});");
  return s;
});
edit('web/index.html',s=>{
  s=replace(s,'href="/favicon.svg" type="image/svg+xml"','href="/assets/branding/favicon.png" type="image/png"');
  s=replace(s,'aria-label="游戏主菜单" hidden>','aria-label="游戏主菜单" hidden>\n      <img class="menu-cover" src="/assets/branding/cover.webp" alt="" width="1672" height="941" fetchpriority="high">');
  s=replace(s,'<div class="menu-content"><span', '<div class="menu-content"><img class="menu-emblem" src="/assets/branding/game-icon.png" width="80" height="80" alt=""><span');
  s=replace(s,'领袖与国家战略</button></nav>','领袖与国家战略</button><button id="menu-audio">音乐与声音</button></nav><p id="menu-loading" class="menu-loading" role="status" hidden>正在载入山河与军队…</p>');
  s=replace(s,'<svg><use href="#i-crown"/></svg><span>诸文明','<img src="/assets/branding/favicon.png" width="36" height="36" alt=""><span>诸文明');
  s=replace(s,'<symbol id="i-flag"', '<symbol id="i-audio" viewBox="0 0 24 24"><path d="M3 9h4l5-5v16l-5-5H3V9Zm13-2c4 3 4 7 0 10m3-13c6 4 6 12 0 16"/></symbol>\n    <symbol id="i-flag"');
  return replace(s,'<button id="toggle-panels"','<button data-modal="audio" title="音乐与声音"><svg><use href="#i-audio"/></svg><span>声音</span></button><button id="toggle-panels"');
});
edit('desktop/main.cjs',s=>replace(s,"title:'诸文明 · 六角纪元',","title:'诸文明 · 六角纪元',icon:path.join(ROOT,'web/assets/branding/game-icon.ico'),"));
console.log('Historical identities, portraits, static cover and deferred WebGL integrated.');
