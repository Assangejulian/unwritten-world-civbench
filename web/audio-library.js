import {TRACKS,PLAYLISTS} from './audio-catalogue.js';

const CULTURES={china:'中国',korea:'朝鲜',japan:'日本',classical:'希腊 / 罗马',persia:'波斯',egypt:'埃及',india:'印度',arabia:'阿拉伯',ottoman:'奥斯曼',steppe:'蒙古 / 草原',mali:'马里',zulu:'祖鲁',england:'英格兰',russia:'俄罗斯',andes:'印加'};
const MOODS={soft:'柔和',majestic:'壮阔',heroic:'激昂'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
const uses=track=>Object.entries(PLAYLISTS).flatMap(([culture,moods])=>Object.entries(moods).filter(([,keys])=>keys.includes(track.key)).map(([mood])=>({culture,mood})));

export function mountTrackLibrary(root,audio){
  if(!document.getElementById('audio-library-css')){const css=document.createElement('link');css.id='audio-library-css';css.rel='stylesheet';css.href='/audio-library.css';document.head.append(css);}
  root.innerHTML=`<section class="music-library" aria-labelledby="music-library-title"><header><h3 id="music-library-title">配乐试听</h3><small>${TRACKS.length} 首完整曲目</small></header><p class="inspector-note">按文明、情绪或曲名查找。试听结束、停止或关闭面板后恢复原配乐。</p><div class="music-library-filters"><label>查找<input type="search" data-music-search placeholder="曲名、作者、文明或乐器"></label><label>文明曲库<select data-music-culture><option value="">全部文明</option>${Object.entries(CULTURES).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label><label>情绪<select data-music-mood><option value="">全部情绪</option>${Object.entries(MOODS).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label></div><div class="music-library-player"><p data-music-status role="status" aria-live="polite"></p><button class="button-secondary" data-music-stop disabled>停止试听</button><label class="music-library-progress"><span>试听进度</span><input data-music-seek type="range" min="0" max="1" value="0" step="1" disabled aria-label="试听进度"><output data-music-time>0:00 / 0:00</output></label></div><p class="music-library-count" data-music-count></p><div class="music-library-list" data-music-list></div></section>`;
  const query=root.querySelector('[data-music-search]'),culture=root.querySelector('[data-music-culture]'),mood=root.querySelector('[data-music-mood]'),list=root.querySelector('[data-music-list]'),seek=root.querySelector('[data-music-seek]');
  function render(){
    const q=query.value.trim().toLowerCase();const rows=TRACKS.map(track=>({track,regions:uses(track)})).filter(({track,regions})=>{
      const matches=regions.filter(r=>(!culture.value||r.culture===culture.value)&&(!mood.value||r.mood===mood.value));
      const text=[track.title,track.artist,track.key,track.instruments||'',/piano/i.test(track.instruments||'')?'钢琴':'',...regions.map(r=>CULTURES[r.culture])].join(' ').toLowerCase();
      return (!(culture.value||mood.value)||matches.length)&&(!q||text.includes(q));
    });
    root.querySelector('[data-music-count]').textContent=`显示 ${rows.length} / ${TRACKS.length} 首`;
    list.innerHTML=rows.map(({track,regions})=>{const countries=[...new Set(regions.map(r=>CULTURES[r.culture]))],moods=[...new Set(regions.map(r=>MOODS[r.mood]))];return `<article class="music-library-row" data-music-row="${track.key}"><div><strong>${escape(track.title)}</strong><small>${escape(track.artist)} · ${escape(track.license)}</small><p>${escape(countries.length?countries.join('、')+' · '+moods.join(' / '):'曲库收藏 · 未用于当前文明自动轮播')}</p>${track.instruments?`<small class="music-library-instruments">乐器：${escape(track.instruments)}</small>`:''}</div><button class="button-secondary" data-music-play="${track.key}" aria-pressed="false">试听</button></article>`;}).join('')||'<p class="inspector-note">没有匹配的曲目，试试其他文明或曲名。</p>';
    updateTrackLibrary(root,audio);
  }
  for(const el of [query,culture,mood])el.addEventListener(el===query?'input':'change',render);
  list.onclick=e=>{const button=e.target.closest('[data-music-play]');if(!button)return;if(audio.preview?.key===button.dataset.musicPlay)audio.stopPreview();else void audio.previewTrack(button.dataset.musicPlay);};
  root.querySelector('[data-music-stop]').onclick=()=>audio.stopPreview();
  seek.oninput=()=>{if(audio.preview&&Number.isFinite(audio.music.duration)&&audio.music.duration>0)audio.music.currentTime=Math.min(+seek.value,audio.music.duration);};
  render();
}

export function updateTrackLibrary(root,audio){
  if(!root)return;const key=audio.preview?.key,seek=root.querySelector('[data-music-seek]');if(!seek)return;
  const status=root.querySelector('[data-music-status]'),text=audio.previewError||(!key?'选择一首曲目试听':audio.preferences.muted?'试听已静音':!audio.preferences.music?'音乐音量为零':audio.previewLoading?'正在载入：'+audio.preview.title:'正在试听：'+audio.preview.title+' · '+audio.preview.artist);
  if(status.textContent!==text)status.textContent=text;
  root.querySelector('[data-music-stop]').disabled=!key;
  const duration=key&&Number.isFinite(audio.music.duration)?audio.music.duration:0;seek.disabled=!key||!duration;seek.max=String(duration||1);if(document.activeElement!==seek)seek.value=String(key?audio.music.currentTime:0);
  root.querySelector('[data-music-time]').textContent=time(key?audio.music.currentTime:0)+' / '+time(duration);
  for(const button of root.querySelectorAll('[data-music-play]')){const active=button.dataset.musicPlay===key,label=active?'停止':'试听';if(button.textContent!==label)button.textContent=label;button.setAttribute('aria-pressed',String(active));button.closest('.music-library-row').classList.toggle('is-playing',active);}
}
