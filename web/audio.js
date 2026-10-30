import {historicalNation} from '/nations.mjs';
import {TRACKS,PLAYLISTS,SOUND_SETS} from './audio-catalogue.js';

export const AUDIO_LIMITS=Object.freeze({voices:6,pending:2,buffers:24,pcmBytes:8*1024*1024,eventsPerSnapshot:2});
const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
const shuffled=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
export function encounteredMusicPlayers(game,view){
  if(view===-1)return game.players.filter(p=>p.alive!==false);
  const own=game.players.find(p=>p.id===view);if(!own)return [];
  const ids=[own.id,...(own.met||[])];
  return [...new Set(ids)].map(id=>game.players.find(p=>p.id===id)).filter(p=>p&&(p.id===own.id||p.alive!==false));
}
export class GameAudio {
  constructor(){
    this.preferences={music:.25,effects:.55,muted:false,mood:'auto'};
    try{const saved=JSON.parse(localStorage.getItem('hex-civilizations-audio'));if(saved){this.preferences.music=clamp(saved.music);this.preferences.effects=clamp(saved.effects);this.preferences.muted=!!saved.muted;if(['auto','soft','majestic','heroic'].includes(saved.mood))this.preferences.mood=saved.mood;}}catch{}
    this.context=null;this.unlocked=false;this.unlocking=null;this.voices=new Set();this.uiVoices=new Set();this.uiPlayed=0;this.lastUiSound=-Infinity;this.buffers=new Map();this.pending=new Map();this.lastVariant=new Map();this.cooldowns=new Map();this.bufferBytes=0;this.played=0;this.dropped=0;this.failed=new Set();this.music=new Audio();this.music.preload='none';this.music.volume=0;this.track=null;this.desired=null;this.worldKey=null;this.sequence=0;this.menuShown=true;this.hidden=document.hidden;this.fadeTimer=null;this.switchTimer=null;this.transition=0;
    this.preview=null;this.previewResume=null;this.previewError='';this.previewSerial=0;this.previewLoading=false;
    this.music.addEventListener('ended',()=>this.preview?this.stopPreview():this.nextTrack());
    for(const event of ['timeupdate','loadedmetadata'])this.music.addEventListener(event,()=>{if(this.preview)this.onChange?.();});
    this.nations=[];this.nationBag=[];this.contactQueue=[];this.trackBags=new Map();this.musicScope=null;
    this.music.addEventListener('error',()=>{if(this.preview){this.previewError='此曲暂时无法播放，请换一首重试。';this.music.pause();this.onChange?.();return;}if(this.track){this.failed.add(this.track.key);this.nextTrack();this.onChange?.();}});
    document.addEventListener('visibilitychange',()=>{
      this.hidden=document.hidden;this.transition++;clearInterval(this.fadeTimer);clearTimeout(this.switchTimer);
      if(this.hidden){this.music.pause();this.stopVoices();void this.context?.suspend().catch(()=>{});}
      else if(this.unlocked&&!this.preferences.muted){void this.context?.resume().catch(()=>{});this.updateMusic();}
    });
  }
  async unlock(){
    if(this.preferences.muted||this.hidden)return;
    if(this.unlocking)return this.unlocking;
    this.unlocking=(async()=>{
      try{
        if(this.preferences.effects>0){const Context=window.AudioContext||window.webkitAudioContext;if(Context){this.context??=new Context({latencyHint:'interactive'});await this.context.resume();}}
        this.unlocked=true;this.updateMusic();
      }catch{this.unlocked=false;}
    })();
    try{await this.unlocking;}finally{this.unlocking=null;}
  }
  setPreferences(next){
    for(const key of ['music','effects'])if(key in next)this.preferences[key]=clamp(next[key]);
    if('muted' in next)this.preferences.muted=!!next.muted;
    const moodChanged=next.mood&&next.mood!==this.preferences.mood;
    if(['auto','soft','majestic','heroic'].includes(next.mood))this.preferences.mood=next.mood;
    try{localStorage.setItem('hex-civilizations-audio',JSON.stringify(this.preferences));}catch{}
    if(this.preferences.muted||this.preferences.effects===0){this.stopVoices();void this.context?.suspend().catch(()=>{});}
    if(!this.preferences.muted&&(!this.unlocked||this.preferences.effects>0&&this.context?.state!=='running'))void this.unlock();
    if(this.world)this.sync(this.world,this.session,this.player,this.menuShown,this.renderer,this.view);
    if(moodChanged)this.updateMusic(true);else this.updateMusic();
    this.onChange?.();
  }
  sync(game,session,player,menuShown,renderer,view=game.visuals?.view??player){
    this.world=game;this.session=session;this.player=player;this.menuShown=menuShown;this.renderer=renderer;this.view=view;
    if(menuShown||!session?.running)this.stopVoices({ui:false});
    const p=game.players.find(p=>p.id===(view>=0?view:player))||game.players[0];
    const war=Object.values(p.relations||{}).some(r=>r.status==='war');
    const mood=this.preferences.mood==='auto'?(war&&!menuShown?'heroic':game.cities.filter(c=>c.owner===p.id).length>=5?'majestic':'soft'):this.preferences.mood;
    const scope=[game.id,session?.world,view].join(':'),nations=encounteredMusicPlayers(game,view);
    const reset=this.musicScope!==scope,previous=new Set(this.nations.map(p=>p.id)),eligible=new Set(nations.map(p=>p.id));
    if(reset){this.stopPreview({resume:false});this.transition++;clearTimeout(this.switchTimer);clearInterval(this.fadeTimer);this.music.pause();this.music.volume=0;this.track=null;this.musicScope=scope;this.nationBag=[];this.contactQueue=[];this.trackBags.clear();this.failed.clear();}
    else {
      this.contactQueue=this.contactQueue.filter(id=>eligible.has(id));
      this.contactQueue.push(...nations.filter(p=>!previous.has(p.id)).map(p=>p.id));
      this.nationBag=this.nationBag.filter(id=>eligible.has(id));
    }
    this.nations=nations;
    const desired={mood,menu:menuShown},changed=reset||this.desired?.menu!==menuShown||this.track?.nationId!==undefined&&!eligible.has(this.track.nationId);
    this.desired=desired;if(changed)this.updateMusic(true);this.onChange?.();
    const journal=game.visuals,key=[game.id,journal?.epoch,journal?.view].join(':');
    const events=this.worldKey===key?(journal?.events||[]).filter(e=>e.id>this.sequence):[];
    const chronicleKey=game.id+':'+journal?.view,newest=game.events?.[0]?.id||0;
    const notices=this.chronicleKey===chronicleKey?(game.events||[]).filter(e=>e.id>(this.noticeSequence||0)&&(e.player===p.id||e.type==='space'&&e.player===null)):[];
    this.chronicleKey=chronicleKey;this.noticeSequence=newest;
    this.worldKey=key;this.sequence=journal?.sequence||0;
    if(!menuShown&&!this.hidden&&this.unlocked&&session?.running&&notices.some(e=>e.type==='space'))void this.play('launch',{gain:1,pan:0,valid:()=>this.worldKey===key&&!this.menuShown&&!this.hidden&&this.session?.running});
    if(!menuShown&&!this.hidden&&this.unlocked&&session?.running)for(const notice of notices.filter(e=>e.type!=='space').slice(0,1)){
      const kind={tech:'research',civic:'research',leader:'ability',trade:'trade',religion:'faith',wonder:'ability',victory:'ability'}[notice.type];
      if(kind)void this.play(kind,{gain:.5,valid:()=>this.worldKey===key&&!this.menuShown&&!this.hidden&&this.session?.running});
    }
    // Consume every sequence, including muted/hidden/menu events. Never replay a backlog.
    if(menuShown||this.hidden||!session?.running||!renderer||!this.unlocked)return;
    let admitted=0;
    for(const event of events){
      if(admitted>=AUDIO_LIMITS.eventsPerSnapshot)break;
      const tile=game.map.tiles[event.actor?.tile];if(!tile||tile.hidden||journal.view>=0&&tile.visible===false)continue;
      const center={x:renderer.width/2,y:renderer.height/2},screen=renderer.screenNear?renderer.screenNear(tile,center):renderer.screen(tile);
      if(screen.x<0||screen.y<0||screen.x>renderer.width||screen.y>renderer.height)continue;
      if(Number.isFinite(event.time)&&Math.abs((session.time||0)-event.time)>1.5)continue;
      const kind=soundForEvent(event);if(!kind)continue;
      const distance=Math.hypot((screen.x-center.x)/renderer.width,(screen.y-center.y)/renderer.height);
      const valid=()=>this.worldKey===key&&!this.menuShown&&!this.hidden&&this.session?.running;
      void this.play(kind,{gain:Math.max(.25,.8-distance),pan:Math.max(-.8,Math.min(.8,(screen.x-center.x)/center.x)),valid});admitted++;
    }
  }
  async buffer(file){
    if(this.buffers.has(file)){const record=this.buffers.get(file);this.buffers.delete(file);this.buffers.set(file,record);return record.buffer;}
    if(this.pending.has(file))return this.pending.get(file);
    if(this.pending.size>=AUDIO_LIMITS.pending)return null;
    const task=(async()=>{
      try{
        const response=await fetch('/assets/audio/sfx/'+file,{cache:'force-cache'});if(!response.ok)throw new Error('Sound unavailable');
        const buffer=await this.context.decodeAudioData(await response.arrayBuffer()),bytes=buffer.length*buffer.numberOfChannels*4;
        if(bytes>AUDIO_LIMITS.pcmBytes)return null;
        while(this.buffers.size&&(this.buffers.size>=AUDIO_LIMITS.buffers||this.bufferBytes+bytes>AUDIO_LIMITS.pcmBytes)){const first=this.buffers.keys().next().value;this.bufferBytes-=this.buffers.get(first).bytes;this.buffers.delete(first);}
        this.buffers.set(file,{buffer,bytes});this.bufferBytes+=bytes;return buffer;
      }catch{return null;}finally{this.pending.delete(file);}
    })();this.pending.set(file,task);return task;
  }
  async play(kind,{gain=1,pan=0,valid=()=>true}={}){
    const spec=SOUND_SETS[kind],now=performance.now();
    if(!spec||!this.unlocked||!this.context||this.context.state!=='running'||this.hidden||this.preferences.muted||!this.preferences.effects||!valid())return false;
    if(kind==='launch'&&this.voices.size+this.uiVoices.size+this.pending.size>=AUDIO_LIMITS.voices){const oldest=this.voices.values().next().value;if(oldest){try{oldest.stop();}catch{}this.voices.delete(oldest);}}
    if(this.voices.size+this.uiVoices.size+this.pending.size>=AUDIO_LIMITS.voices||now-(this.cooldowns.get(kind)||-Infinity)<spec.cooldown||this.pending.size>=AUDIO_LIMITS.pending){this.dropped++;return false;}
    const candidates=spec.files.filter(file=>file!==this.lastVariant.get(kind)),file=(candidates.length?candidates:spec.files)[Math.floor(Math.random()*(candidates.length||spec.files.length))];
    this.lastVariant.set(kind,file);this.cooldowns.set(kind,now);
    const buffer=await this.buffer(file);
    if(!buffer||!valid()||this.hidden||this.preferences.muted||!this.preferences.effects||this.context.state!=='running'||this.voices.size+this.uiVoices.size>=AUDIO_LIMITS.voices)return false;
    const source=this.context.createBufferSource(),volume=this.context.createGain(),panner=this.context.createStereoPanner();source.buffer=buffer;source.playbackRate.value=.97+Math.random()*.06;volume.gain.value=this.preferences.effects*spec.volume*clamp(gain);panner.pan.value=pan;source.connect(volume);volume.connect(panner);panner.connect(this.context.destination);
    this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();volume.disconnect();panner.disconnect();};source.start();this.played++;return true;
  }
  async feedback(kind='click'){
    const requested=performance.now();if(this.hidden||this.preferences.muted||!this.preferences.effects||requested-this.lastUiSound<75)return false;
    this.lastUiSound=requested;await this.unlock();
    if(performance.now()-requested>300||!this.context||this.context.state!=='running'||this.hidden||this.preferences.muted||!this.preferences.effects)return false;
    // Quiet sine notes, soft attacks and no high-frequency click or hover noise.
    const notes=kind==='confirm'?[[392,0],[523.25,.055]]:kind==='decline'||kind==='error'?[[293.66,0],[261.63,.06]]:[[kind==='select'?349.23:329.63,0]];
    let admitted=0;for(const [frequency,delay]of notes){if(this.uiVoices.size>=4||this.voices.size+this.uiVoices.size>=AUDIO_LIMITS.voices)break;const source=this.context.createOscillator(),volume=this.context.createGain(),start=this.context.currentTime+delay,duration=kind==='click'?.09:.16;
      source.type='sine';source.frequency.value=frequency;volume.gain.setValueAtTime(0,start);volume.gain.linearRampToValueAtTime(this.preferences.effects*.038,start+.012);volume.gain.exponentialRampToValueAtTime(.0001,start+duration);source.connect(volume);volume.connect(this.context.destination);this.uiVoices.add(source);source.onended=()=>{this.uiVoices.delete(source);source.disconnect();volume.disconnect();};source.start(start);source.stop(start+duration+.01);admitted++;
    }
    if(!admitted)return false;this.uiPlayed++;return true;
  }
  stopVoices({ui=true}={}){for(const voice of this.voices)try{voice.stop();}catch{}this.voices.clear();if(ui){for(const voice of this.uiVoices)try{voice.stop();}catch{}this.uiVoices.clear();}}
  playlist(){
    if(!this.desired)return [];
    const ids=this.desired.menu?['lake-aria','angevin','temple-of-the-manes']:this.nations.flatMap(p=>this.nationTracks(p).map(t=>t.key));
    return [...new Set(ids)].map(id=>TRACKS.find(t=>t.key===id)).filter(t=>t&&!this.failed.has(t.key));
  }
  nationTracks(p){
    const regional=PLAYLISTS[historicalNation(p)?.culture]||PLAYLISTS.classical;
    const available=ids=>[...new Set(ids)].map(id=>TRACKS.find(t=>t.key===id)).filter(t=>t&&!this.failed.has(t.key));
    const preferred=available(regional[this.desired?.mood]||regional.soft);
    return preferred.length?preferred:available(Object.values(regional).flat());
  }
  chooseTrack(){
    let nation=null,tracks=this.playlist();if(!tracks.length)return null;
    if(!this.desired.menu){
      const candidates=this.nations.filter(p=>this.nationTracks(p).length),ids=new Set(candidates.map(p=>p.id));
      this.contactQueue=this.contactQueue.filter(id=>ids.has(id));this.nationBag=this.nationBag.filter(id=>ids.has(id));
      if(!this.nationBag.length){this.nationBag=shuffled([...ids]);if(this.nationBag[0]===this.track?.nationId&&this.nationBag.length>1)[this.nationBag[0],this.nationBag[1]]=[this.nationBag[1],this.nationBag[0]];}
      const id=this.contactQueue.length?this.contactQueue.shift():this.nationBag[0];this.nationBag=this.nationBag.filter(n=>n!==id);
      nation=candidates.find(p=>p.id===id);tracks=this.nationTracks(nation);
    }
    const bagKey=(nation?.id??'menu')+':'+this.desired.mood,allowed=new Set(tracks.map(t=>t.key));
    let bag=(this.trackBags.get(bagKey)||[]).filter(id=>allowed.has(id));
    if(!bag.length)bag=shuffled([...allowed]);
    let index=bag.findIndex(id=>id!==this.track?.key);
    if(index<0&&tracks.length>1){bag=shuffled([...allowed]);index=bag.findIndex(id=>id!==this.track?.key);}
    const [id]=bag.splice(Math.max(0,index),1);this.trackBags.set(bagKey,bag);
    return {...tracks.find(t=>t.key===id),...(nation?{nationId:nation.id,nationName:nation.short||nation.name}: {})};
  }
  async previewTrack(key){
    const track=TRACKS.find(t=>t.key===key);if(!track)return false;
    if(this.preferences.muted||!this.preferences.music){this.previewError='请先取消静音，并调高音乐音量。';this.onChange?.();return false;}
    if(!this.preview)this.previewResume={track:this.track,time:this.music.currentTime,scope:this.musicScope,menu:this.desired?.menu,mood:this.desired?.mood};
    const serial=++this.previewSerial;this.transition++;clearTimeout(this.switchTimer);clearInterval(this.fadeTimer);
    this.preview=track;this.previewError='';this.previewLoading=true;this.music.pause();this.track={...track,preview:true};this.music.src='/assets/audio/music/'+track.key+'.ogg';this.music.volume=this.preferences.music;this.onChange?.();
    try{
      await this.unlock();
      if(serial!==this.previewSerial||!this.preview||this.hidden||this.preferences.muted||!this.preferences.music)return false;
      await this.music.play();return serial===this.previewSerial;
    }catch{if(serial===this.previewSerial)this.previewError='此曲暂时无法播放，请换一首重试。';return false;}
    finally{if(serial===this.previewSerial){this.previewLoading=false;this.onChange?.();}}
  }
  stopPreview({resume=true}={}){
    if(!this.preview){this.previewError='';return false;}
    const saved=this.previewResume;this.preview=null;this.previewResume=null;this.previewError='';this.previewLoading=false;this.previewSerial++;
    const token=++this.transition;clearTimeout(this.switchTimer);clearInterval(this.fadeTimer);this.music.pause();this.track=null;
    if(resume){
      if(saved?.track&&saved.scope===this.musicScope&&saved.menu===this.desired?.menu&&saved.mood===this.desired?.mood&&!this.failed.has(saved.track.key)){
        this.track=saved.track;this.music.src='/assets/audio/music/'+saved.track.key+'.ogg';
        this.music.addEventListener('loadedmetadata',()=>{if(token===this.transition&&!this.preview&&this.track?.key===saved.track.key)this.music.currentTime=Math.min(saved.time||0,Math.max(0,(this.music.duration||0)-.1));},{once:true});
        this.updateMusic();
      }else this.updateMusic(true);
    }
    this.onChange?.();return true;
  }
  nextTrack(){this.stopPreview({resume:false});this.updateMusic(true);}
  updateMusic(force=false){
    if(!this.unlocked||this.hidden||this.preferences.muted||!this.preferences.music){this.transition++;clearTimeout(this.switchTimer);clearInterval(this.fadeTimer);this.music.pause();return;}
    // Manual listening shares the existing decoder and never consumes civilization shuffle bags.
    if(this.preview){this.music.volume=this.preferences.music;if(!this.previewLoading&&!this.previewError&&this.music.paused&&!this.music.ended)void this.music.play().catch(()=>{});return;}
    if(!this.desired)return;
    const list=this.playlist();if(!list.length){this.transition++;clearTimeout(this.switchTimer);clearInterval(this.fadeTimer);this.music.pause();this.track=null;this.onChange?.();return;}
    if(!force&&this.track&&!this.music.ended&&!this.failed.has(this.track.key)){this.music.volume=this.preferences.music;if(this.music.paused)void this.music.play().catch(()=>{});return;}
    clearTimeout(this.switchTimer);const token=++this.transition;
    // A single media element is faded down and reused; no second decoder/stream.
    this.switchTimer=setTimeout(()=>{
      if(token!==this.transition)return;
      this.fadeTo(0,token,()=>{
        if(token!==this.transition)return;const next=this.chooseTrack();if(!next)return;
        this.music.pause();this.track=next;this.music.src='/assets/audio/music/'+next.key+'.ogg';
        void this.music.play().then(()=>{if(token===this.transition)this.fadeTo(this.preferences.music,token);}).catch(()=>{});this.onChange?.();
      });
    },force?180:0);
  }
  fadeTo(target,token,done){
    clearInterval(this.fadeTimer);const start=this.music.volume,time=performance.now();
    this.fadeTimer=setInterval(()=>{if(token!==this.transition){clearInterval(this.fadeTimer);return;}const f=Math.min(1,(performance.now()-time)/250);this.music.volume=clamp(start+(target-start)*f);if(f===1){clearInterval(this.fadeTimer);done?.();}},25);
  }
  get diagnostics(){return {uiPlayed:this.uiPlayed,uiVoices:this.uiVoices.size,unlocked:this.unlocked,contextState:this.context?.state||'absent',voices:this.voices.size,pending:this.pending.size,buffers:this.buffers.size,pcmBytes:this.bufferBytes,played:this.played,dropped:this.dropped,track:this.track?.key||null,failed:[...this.failed],limits:AUDIO_LIMITS};}
}
export function soundForEvent(event){
  const type=event.actor?.type;
  if(event.kind==='attack'){
    if(['rocketartillery','missilecruiser','drone'].includes(type))return 'missile';
    if(['modernarmor','assaultship'].includes(type))return 'cannon';
    if(['infantry','mechanized'].includes(type))return 'gun';
    if(['catapult'].includes(type))return 'siege';
    if(['cannon','bombard','artillery','tank','frigate','destroyer','battleship','city'].includes(type))return 'cannon';
    if(['musket','rifleman'].includes(type))return 'gun';
    if(['archer','crossbow','slinger'].includes(type))return 'bow';
    return 'melee';
  }
  if(event.kind==='move'){
    if(event.actor?.transport||['galley','frigate','destroyer','battleship','missilecruiser','assaultship'].includes(type))return 'water';
    if(['horseman','knight','courser','cuirassier','cavalry'].includes(type))return 'horse';
    if(['tank','catapult','cannon','bombard','artillery','mechanized','modernarmor','rocketartillery'].includes(type))return 'wheels';
    return 'footsteps';
  }
  if(event.kind==='work')return event.action==='leaderAbility'?'ability':event.action==='religion'||event.action==='spread'?'faith':'build';
  if(event.kind==='hurt')return 'impact';
  return null;
}

export {TRACKS};
