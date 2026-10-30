// Unified native strategy: attitudes, war commitment, operations, personality and acquired intelligence.
// Legacy algorithm identifiers are accepted only at input/save boundaries.
// Inputs are limited to legitimate knowledge: own state, relations, knownCities memory, cityAppearances, visible
// units/cities, public score/era, the public victory aggregate of MET civilizations (main-project contract), and
// gradually acquired intelligence in p.intel (rules in acquireIntel). No unlearned current hidden state is read.
import {UNITS,dist,isWater,occupationUnit,siegeMatchesWall,cityWallTier,WALL_TIERS} from './rules.mjs';
import {unitDetected} from './movement-rules.mjs';
import {victoryEnabled} from './victory-rules.mjs';

export const AI_ALGORITHM = 'unified';
export function normalizeAiAlgorithm(value = AI_ALGORITHM) {
  if (![AI_ALGORITHM, 'A', 'B'].includes(value)) throw new Error('Invalid AI algorithm.');
  return AI_ALGORITHM;
}
export function migrateAiState(player) {
  if (player.aiState === undefined && player.aiV2 !== undefined) player.aiState = player.aiV2;
  delete player.aiV2;
}
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const r2=n=>Math.round(n*10)/10;

// ---------- personality ----------
const NEUTRAL={aggression:1,expansion:1,science:1,culture:1,gold:1,faith:1,growth:1,industry:1,naval:1,risk:.5,grudge:.5,forgiveness:.5,trust:.5,competitiveness:1,commitment:.5,victory:'any',units:{melee:1,ranged:1,siege:1,cavalry:1,naval:1,air:1}};
const BASES={
  astra:{science:1.5,aggression:.75,risk:.35,competitiveness:1.25,victory:'science',units:{ranged:1.2,air:1.15}},
  legion:{aggression:1.6,expansion:1.15,risk:.75,grudge:.75,forgiveness:.3,trust:.35,victory:'domination',units:{melee:1.25,siege:1.3,cavalry:1.15}},
  verdant:{growth:1.4,expansion:1.4,aggression:.8,forgiveness:.65,trust:.6,victory:'any'},
  merchant:{gold:1.5,aggression:.65,trust:.7,forgiveness:.6,victory:'economy',units:{naval:1.1}},
  muse:{culture:1.5,aggression:.7,trust:.6,competitiveness:1.15,victory:'culture'},
  mariner:{naval:1.5,gold:1.2,aggression:1,risk:.6,victory:'any',units:{naval:1.35}},
  oracle:{faith:1.6,culture:1.15,aggression:.7,grudge:.65,victory:'religion'},
  foundry:{industry:1.5,science:1.2,aggression:1.05,risk:.55,victory:'any',units:{siege:1.15,ranged:1.1}}};
function hash(text){let x=2166136261;for(let i=0;i<text.length;i++){x^=text.charCodeAt(i);x=Math.imul(x,16777619);}x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;return (x>>>0)/4294967295;}
export const jitter=(seed,id,key)=>1+(hash(`${seed}|${id}|${key}`)*2-1)*.08;
export function stemOf(p){const f=String(p.driver?.file||p.driverFile||'');const m=f.match(/^\d+_([a-z]+)/i);return m?m[1].toLowerCase():String(p.leaderKey||'neutral');}
export function personality(g,p){
  const base=BASES[stemOf(p)]||{},out={};
  for(const [k,v]of Object.entries(NEUTRAL)){if(k==='units'||k==='victory')continue;const b=base[k]??v,j=jitter(g.seed,p.id,k);out[k]=['risk','grudge','forgiveness','trust','commitment'].includes(k)?clamp(Math.round(b*j*100)/100,0,1):Math.round(b*j*1000)/1000;}
  out.units={};for(const [k,v]of Object.entries(NEUTRAL.units))out.units[k]=Math.round((base.units?.[k]??v)*jitter(g.seed,p.id,'unit:'+k)*1000)/1000;
  out.victory=base.victory||'any';return out;
}

// ---------- gradual intelligence (symmetric for players and AI) ----------
// Acquisition rules (evaluated once per economic period for every alive player, human or AI):
//  government is (re)learned from civilization o when, at that moment, p has an alliance or open borders with o,
//  or currently sees at least one city owned by o. Otherwise the last learned value is kept unchanged with its
//  learnedAt period; nothing is ever learned from unseen state. Age = current period - learnedAt.
export const INTEL={fields:['government'],staleAfter:20};
export function acquireIntel(g){
  for(const p of g.players){if(!p.alive)continue;const visible=new Set(p.visible||[]);p.intel??={};
    for(const id of p.met){const o=g.players[id],r=p.relations[id];if(!o?.alive||!r)continue;
      const contact=r.status==='alliance'||!!r.openBorders||g.cities.some(c=>c.owner===id&&visible.has(c.tile));
      if(contact){const rec=p.intel[id]??={};rec.government={value:o.government??null,learnedAt:g.turn};}}}
}
export function knownGovernment(g,p,id){const k=p.intel?.[id]?.government;return k?{value:k.value,learnedAt:k.learnedAt,age:g.turn-k.learnedAt}:null;}

// ---------- victory threat from the public aggregate of met civilizations ----------
export function victoryThreat(g,p,o,ctx){
  const v=ctx.victory(o)||{},alive=g.players.filter(x=>x.alive);
  const domination=v.domination?.total?(v.domination.owned||0)/v.domination.total:0;
  const science=v.science?.total?(v.science.stage||0)/v.science.total:0;
  const culture=v.culture?.target?clamp((v.culture.tourism||0)/v.culture.target,0,1):0;
  const religion=v.religion?.total?(v.religion.converted||0)/v.religion.total:0;
  const met=alive.filter(x=>x.id===p.id||p.met.includes(x.id)),scores=met.map(x=>ctx.score(g,x)),total=scores.reduce((a,b)=>a+b,0)||1;
  const lead=clamp((ctx.score(g,o)/total-1/Math.max(2,met.length))*2.2,0,1);
  const parts={science,domination,culture,religion,diplomacy:v.diplomacy?.target?(v.diplomacy.points||0)/v.diplomacy.target:0,score:lead};
  for(const key of Object.keys(parts))parts[key]=victoryEnabled(g,key)?clamp(parts[key],0,1):0;
  const [kind,value]=Object.entries(parts).sort((a,b)=>b[1]-a[1])[0];
  const fewLeft=alive.length<=3?1.5:alive.length<=5?1.2:1;
  return {kind,value:Math.round(clamp(value*fewLeft,0,1)*100)/100,parts,alive:alive.length};
}
const VICTORY_LABEL={science:'接近科技胜利',domination:'控制多个首都',culture:'文化影响力领先',religion:'宗教扩张',diplomacy:'接近外交胜利',score:'国力遥遥领先'};

// ---------- attitude ----------
export function attitudeOf(p,id){return p.attitudes?.[id]||null;}
function record(p,id){p.attitudes??={};const rec=p.attitudes[id]??={opinion:0,mods:[],mem:{},prev:null,streak:{war:0,peace:0},warValue:0,intent:'none'};
  rec.mem={war:0,declared:0,betrayal:0,denied:0,denouncedBy:0,friendBy:0,...rec.mem};rec.seen??={denounce:0,friend:0,proposals:[]};return rec;}

export function computeAttitude(g,p,o,ctx){
  const pers=ctx.personality(p),r=p.relations[o.id]||{},rec=record(p,o.id),mem=rec.mem,mods=[];
  const add=(key,label,value)=>{value=r2(value);if(Math.abs(value)>=.5)mods.push({key,label,value});};
  add('border','边境接壤',-Math.min(25,(r.borderPressure||0)*.6));
  add('troops','边境驻军',-Math.min(20,(r.militaryPressure||0)*.5));
  add('grievance','历史积怨',-Math.min(40,(r.grievances||0)*.4)*(.6+pers.grudge*.8));
  const ownCities=g.cities.filter(c=>c.owner===p.id),theirs=Object.values(p.knownCities||{}).filter(c=>c.owner===o.id);
  const close=theirs.filter(c=>ownCities.some(m=>dist(g.map.tiles[m.tile],g.map.tiles[c.tile],g.map)<=6)).length;
  add('settled','在我方附近建城',-Math.min(20,close*5));
  const lost=g.cities.filter(c=>c.originalOwner===p.id&&c.owner===o.id&&p.knownCities?.[c.id]?.owner===o.id).length;
  add('captured','占领我方城市',-Math.min(45,lost*15));
  add('war','战争记忆',-mem.war);add('declared','对我宣战',-mem.declared);add('betrayal','背弃盟约',-mem.betrayal);add('denied','拒绝我的请求',-mem.denied);
  add('delegation','接待友好使团',o.relations?.[p.id]?.embassy?9:o.relations?.[p.id]?.delegation?5:0);
  add('denounced','公开谴责我方',-mem.denouncedBy);add('friend','宣布与我友好',mem.friendBy);
  // Religion: the player's OWN cities (authoritative own state) converted to o's religion; no foreign city religion read.
  if(o.religion!==undefined&&o.religion!==null){const converted=ownCities.filter(c=>c.religion===o.id).length;add('missionary','我方城市被其宗教转化',-Math.min(20,converted*5));
    if(p.religion!==undefined&&p.religion!==null&&p.religion!==o.id&&converted>0)add('religion','信仰冲突',-6);}
  // Government only through acquired intelligence; stale knowledge counts half.
  const gov=knownGovernment(g,p,o.id);
  if(gov&&gov.value&&p.government){const w=gov.age>INTEL.staleAfter?.5:1;add('government',gov.value===p.government?'政体相同':'政体不同',(gov.value===p.government?4:-4)*w);}
  if(r.status==='alliance')add('alliance','同盟',25);else if(r.openBorders)add('borders','开放边界',8);
  const trade=g.routes?.some(t=>(t.owner===p.id&&g.cities.find(c=>c.id===t.to)?.owner===o.id)||(t.owner===o.id&&g.cities.find(c=>c.id===t.to)?.owner===p.id));if(trade)add('trade','贸易往来',10);
  const shared=Object.entries(p.relations).some(([id,x])=>+id!==o.id&&x.status==='war'&&o.relations[+id]?.status==='war');if(shared)add('sharedEnemy','共同敌人',15);
  const threat=victoryThreat(g,p,o,ctx);
  if(pers.victory!=='any'&&threat.parts[pers.victory==='economy'?'score':pers.victory]>.15)add('rivalGoal','追求同一胜利',-8*pers.competitiveness);
  const assess=ctx.assess(p,o),national=(assess.ourPower||0)/Math.max(1,assess.theirPower||1);
  if(pers.aggression>1.2&&national>1.6)add('weak','看起来软弱可欺',-6);
  if(pers.aggression<.85&&!Object.values(o.relations).some(x=>x.status==='war'))add('peaceful','爱好和平',4);
  add('leader','领先者威胁：'+VICTORY_LABEL[threat.kind],-threat.value*55*pers.competitiveness);
  const opinion=clamp(mods.reduce((s,m)=>s+m.value,0),-100,100);
  mods.sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
  const relationshipOpinion=clamp(mods.filter(m=>m.key!=='leader').reduce((s,m)=>s+m.value,0),-100,100);
  return {opinion:r2(opinion),relationshipOpinion:r2(relationshipOpinion),mods,threat,assess,national};
}

// ---------- war value: national strength + prospective recruitment, no existing-army requirement ----------
export function warValue(g,p,o,att,ctx){
  const pers=ctx.personality(p),r=p.relations[o.id],a=att.assess,fin=ctx.finance?.(p)||{},arrears=(fin.arrears||0)>.01||(fin.unpaidPeriods||0)>0;
  const reachable=a.landTarget||a.seaTarget&&pers.naval>=1;
  const otherWars=Object.entries(p.relations).filter(([id,x])=>+id!==o.id&&x.status==='war').length;
  // Prospective power: current national army plus what ~3 periods of production can recruit (rough strength/production).
  const production=Math.max(0,ctx.yields?.(p)?.production||0),prospective=(a.ourPower||0)+production*3*.35;
  const ratio=prospective/Math.max(1,a.theirPower||1),power=clamp((ratio-1)*30,-40,30);
  const income=(fin.grossGold??0)-(fin.projectedUpkeep??0);
  let v=-(att.relationshipOpinion??att.opinion)*.5+att.threat.value*60*pers.competitiveness+power-(p.warWeariness||0)*.8-otherWars*25+(pers.aggression-1)*20-12+clamp(income,-20,10)*.5;
  if(r?.status!=='war'){v-=Math.min(30,Math.max(0,a.distance-8)*1.2);if(!reachable)v=Math.min(v,-50);if(arrears)v-=40;}
  else v+=8;
  return {value:r2(v),ratio:Math.round(ratio*100)/100};
}

// Commitment semantics (consecutive): a declaration needs `need` CONSECUTIVE positive periods; any non-positive
// period resets the streak to 0. At war: no peace intent before minWar unless national collapse; peace intent needs
// `peacePeriods` consecutive negative periods; once seeking peace the intent is sticky until value > +20 twice.
export const COMMIT={declarePeriods:3,urgentPeriods:2,minWarBase:6,peacePeriods:2,resumeValue:20,collapseRatio:.35};
export function updateIntent(g,p,o,rec,ctx){
  const pers=ctx.personality(p),r=p.relations[o.id],v=rec.warValue;
  if(r.status==='war'){
    rec.streak.war=0;const duration=g.turn-r.since,minWar=Math.max(3,Math.round(COMMIT.minWarBase+(pers.aggression-1)*4));rec.minWar=minWar;
    rec.streak.peace=v<0?rec.streak.peace+1:0;rec.streak.resume=v>COMMIT.resumeValue?(rec.streak.resume||0)+1:0;
    const lostCities=rec.mods?.some(m=>m.key==='captured'),collapse=rec.national<COMMIT.collapseRatio&&lostCities;
    if(rec.intent==='peace')rec.intent=rec.streak.resume>=2?'fight':'peace';
    else rec.intent=collapse||(duration>=minWar&&rec.streak.peace>=COMMIT.peacePeriods)?'peace':'fight';
  }else{
    rec.streak.peace=0;rec.streak.resume=0;rec.streak.war=v>0?rec.streak.war+1:0;
    const need=rec.threatValue>=.6?COMMIT.urgentPeriods:COMMIT.declarePeriods;
    rec.intent=rec.streak.war>=need?'declare':rec.streak.war>0?'prepare':'none';
  }
}
function casusBelli(rec){const m=rec.mods||[],has=k=>m.find(x=>x.key===k&&x.value<0);
  if(has('captured'))return '收复失地';if(has('declared')||has('war'))return '报复战争';if(has('betrayal'))return '惩罚背盟';if(has('denounced'))return '回应谴责';
  const lead=has('leader');if(lead&&rec.threatValue>=.4)return '阻止'+lead.label.replace('领先者威胁：','');if(has('missionary')||has('religion'))return '宗教战争';if(has('settled')||has('border'))return '领土争端';return '扩张';}

// Once per economic period. Phase 1 reads every observable event with stable identities (declaration sequence
// numbers, proposal ids), so processing order between players cannot drop same-period events. Phase 2 computes
// attitudes and intents. Phase 3 emits new declarations, which phase 1 of the next period reads.
export function attitudeTurn(g,ctx){
  const time=g.realtime?.time??g.turn*20;acquireIntel(g);
  const alive=g.players.filter(p=>p.alive);
  for(const p of alive){const pers=ctx.personality(p),decay=1-(.03+pers.forgiveness*.05);
    for(const id of p.met){const o=g.players[id],r=p.relations[id];if(!o?.alive||!r)continue;const rec=record(p,id),mem=rec.mem,seen=rec.seen;
      for(const k of Object.keys(mem))mem[k]=r2(mem[k]*decay);
      const prev=rec.prev;
      if(r.status==='war'){mem.war=Math.max(mem.war,20);if(prev&&prev!=='war'&&r.aggressor===o.id)mem.declared=Math.max(mem.declared,30);}
      if(prev==='alliance'&&r.status!=='alliance'&&r.allianceEndedBy===o.id)mem.betrayal=Math.max(mem.betrayal,35);
      for(const offer of g.diplomacy?.proposals||[])if(offer.from===p.id&&offer.to===id&&offer.status==='rejected'&&!seen.proposals.includes(offer.id)){mem.denied=Math.min(30,mem.denied+10);seen.proposals.push(offer.id);}
      // Retention mirrors the ledger: ids evicted from g.diplomacy.proposals never return (ids are monotonic),
      // so pruning to ledger ids can never re-consume history and survives save/restore.
      {const ledger=new Set((g.diplomacy?.proposals||[]).map(o=>o.id));seen.proposals=seen.proposals.filter(x=>ledger.has(x));}
      const theirs=o.attitudes?.[p.id];
      if((theirs?.denounceSeq||0)>seen.denounce){mem.denouncedBy=Math.max(mem.denouncedBy,25);seen.denounce=theirs.denounceSeq;}
      if((theirs?.friendSeq||0)>seen.friend){mem.friendBy=Math.max(mem.friendBy,20);seen.friend=theirs.friendSeq;}
      rec.prev=r.status;}}
  for(const p of alive)for(const id of p.met){const o=g.players[id];if(!o?.alive||!p.relations[id])continue;const rec=record(p,id);
    const att=computeAttitude(g,p,o,ctx);rec.opinion=att.opinion;rec.mods=att.mods.slice(0,8);rec.threatValue=att.threat.value;rec.threatKind=att.threat.kind;rec.national=Math.round(att.national*100)/100;
    const wv=warValue(g,p,o,att,ctx);rec.warValue=wv.value;rec.prospectiveRatio=wv.ratio;updateIntent(g,p,o,rec,ctx);rec.casusBelli=casusBelli(rec);}
  // Bilateral friendship and denouncement are resolved by the authoritative court.
  for(const p of alive){if(p.manual)continue;updateStrategy(g,p,ctx);updateOperations(g,p,ctx);}
}

// ---------- strategy commitment (hysteresis) ----------
export function updateStrategy(g,p,ctx){
  const st=p.aiState??={},plan=ctx.plan(p),raw=plan.rawGoal||plan.goal,threat=plan.frontierThreat||0;
  st.alert=st.alert?threat>20:threat>35;
  if(!st.goal){st.goal=raw;st.goalSince=g.turn;st.pending=0;return;}
  if(raw===st.goal){st.pending=0;return;}
  const need=Math.round(3+ctx.personality(p).commitment*4);
  st.pending=(st.pendingGoal===raw?st.pending:0)+1;st.pendingGoal=raw;
  if(st.pending>=need){st.goal=raw;st.goalSince=g.turn;st.pending=0;p.planRevision=(p.planRevision||0)+1;}
}

// ---------- operations (<=2 campaigns, bounded, with home reserve) ----------
// Reserve: every own city keeps its nearest healthy land defender (within 4), and at least 35% of the healthy land
// army stays home. Each operation takes at most maxMembers. Rally routing radius matches gather counting radius.
export const OPS={max:2,maxMembers:12,minMembers:3,reserveShare:.35,cityGuardRadius:4,gatherShare:.6,rallyRange:2,gatherRadius:3,maxGatherPeriods:3};
const landArmy=(g,p)=>g.units.filter(u=>u.owner===p.id&&u.hp>40&&!UNITS[u.type].civilian&&(UNITS[u.type].domain||'land')==='land'&&!UNITS[u.type].airOnly&&u.type!=='scout');
export function homeReserve(g,p,army){
  const tileOf=u=>g.map.tiles[u.tile],keep=new Set();
  // Only healthy fighting land units actually standing on land can guard: no units at sea, embarked or carried.
  army=army.filter(u=>u.owner===p.id&&u.hp>40&&!UNITS[u.type]?.civilian&&(UNITS[u.type]?.domain||'land')==='land'&&!UNITS[u.type]?.airOnly&&tileOf(u)&&!isWater(tileOf(u))&&!u.embarked&&(u.transport===undefined||u.transport===null));
  for(const c of g.cities.filter(c=>c.owner===p.id)){const ct=g.map.tiles[c.tile];const best=army.filter(u=>!keep.has(u.id)&&dist(tileOf(u),ct,g.map)<=OPS.cityGuardRadius).sort((a,b)=>dist(tileOf(a),ct,g.map)-dist(tileOf(b),ct,g.map)||a.id-b.id)[0];if(best)keep.add(best.id);}
  const share=Math.ceil(army.length*OPS.reserveShare);
  for(const u of [...army].sort((a,b)=>a.id-b.id)){if(keep.size>=share)break;keep.add(u.id);}
  return keep;
}
// Estimates use only own troops, visible detected enemies and remembered city appearance.
export function operationReadiness(g,p,op){
  const members=op.members.map(id=>g.units.find(u=>u.id===id&&u.owner===p.id&&u.hp>0)).filter(Boolean),visible=new Set(p.visible||[]);
  const live=visible.has(op.tile)?g.cities.find(c=>c.id===op.city&&c.owner===op.enemy):null,appearance=p.cityAppearances?.[op.city];
  const wallLevel=live?Math.max(0,WALL_TIERS.indexOf(cityWallTier(live))):appearance?.wallLevel||0;
  const breached=!!live&&live.hp<=0&&live.walls<=0,wall=wallLevel>0&&(live?live.walls>0:appearance?.wallIntegrity!==0);
  const power=u=>Math.max(UNITS[u.type].strength||0,UNITS[u.type].ranged||0)*u.hp/(UNITS[u.type].maxHp||100);
  const strength=members.reduce((n,u)=>n+power(u),0),capture=members.some(u=>occupationUnit(u.type)&&!u.embarked&&(u.transport==null));
  const defenders=g.units.filter(u=>u.owner===op.enemy&&u.hp>0&&visible.has(u.tile)&&unitDetected(g,u,p.id)&&!UNITS[u.type].civilian&&dist(g.map.tiles[u.tile],g.map.tiles[op.tile],g.map)<=4);
  const opposition=Math.max(20+wallLevel*12,defenders.reduce((n,u)=>n+power(u),0));
  const breaker=members.some(u=>siegeMatchesWall(u.type,{wallLevel},p));
  // Overwhelming equipment can replace a dedicated siege unit; ordinary ranged fire cannot.
  const wallReady=!wall||breaker||strength>=opposition*2.5;
  return {members:members.length,strength,capture,wallReady,breached,opposition,ready:capture&&(breached||members.length>=OPS.minMembers&&wallReady&&strength>=opposition*.8)};
}
export function updateOperations(g,p,ctx){
  const st=p.aiState??={},own=g.cities.filter(c=>c.owner===p.id),tileOf=u=>g.map.tiles[u.tile];
  st.operationCooldowns??={};st.fallbackUnits??={};
  for(const [city,until]of Object.entries(st.operationCooldowns))if(until<=g.turn||!p.knownCities?.[city])delete st.operationCooldowns[city];
  for(const [id,entry]of Object.entries(st.fallbackUnits))if(entry.until<=g.turn||!g.units.some(u=>u.id===+id&&u.owner===p.id&&u.hp>0)||!own.some(c=>c.tile===entry.rally))delete st.fallbackUnits[id];
  const retreat=(op,reason)=>{
    st.operationCooldowns[op.city]=g.turn+4;
    for(const id of op.members)if(Object.keys(st.fallbackUnits).length<128&&g.units.some(u=>u.id===id&&u.owner===p.id&&u.hp>0))st.fallbackUnits[id]={state:'retreat',rally:op.rally,until:g.turn+4,reason};
  };
  st.ops=(st.ops||[]).filter(op=>p.relations[op.enemy]?.status==='war'&&p.knownCities?.[op.city]?.owner===op.enemy&&own.some(c=>c.tile===op.rally));
  const army=landArmy(g,p),ids=new Set(army.map(u=>u.id)),reserve=homeReserve(g,p,army);
  const retained=[];
  for(const op of st.ops){
    const original=[...op.members];op.members=op.members.filter(id=>ids.has(id)&&!reserve.has(id)).slice(0,OPS.maxMembers);
    const ready=operationReadiness(g,p,op);
    if(op.state!=='gather'&&(!ready.capture||ready.strength<(op.initialStrength||ready.strength)*.5||ready.strength<ready.opposition*.6||g.turn-(op.marchedAt||op.since)>20)){
      op.members=original;retreat(op,'losses_or_unviable_target');continue;
    }
    retained.push(op);
  }
  st.ops=retained;
  const wars=Object.entries(p.relations).filter(([,r])=>r.status==='war').map(([id])=>+id).filter(id=>g.players[id]?.alive).sort((a,b)=>(p.attitudes?.[b]?.warValue||0)-(p.attitudes?.[a]?.warValue||0)||a-b);
  const caps=new Set(Object.values(p.knownCities||{}).filter(c=>c.isCapital).map(c=>c.id));
  for(const enemy of wars){
    if(st.ops.length>=OPS.max||!own.length)break;if(st.ops.some(op=>op.enemy===enemy))continue;
    const targets=Object.values(p.knownCities||{}).filter(c=>c.owner===enemy&&!st.operationCooldowns[c.id]);if(!targets.length)continue;
    const pick=targets.map(c=>{const near=own.reduce((b,m)=>{const d=dist(tileOf(m),g.map.tiles[c.tile],g.map);return !b||d<b.d?{m,d}:b;},null);return {c,near,score:near.d-(caps.has(c.id)?2:0)+(p.cityAppearances?.[c.id]?.wallLevel||0)*1.5};}).sort((a,b)=>a.score-b.score||a.c.id-b.c.id)[0];
    st.ops.push({id:(st.opSeq=(st.opSeq||0)+1),enemy,city:pick.c.id,tile:pick.c.tile,rally:pick.near.m.tile,state:'gather',since:g.turn,members:[]});
  }
  const used=new Set(st.ops.flatMap(op=>op.members)),available=army.filter(u=>!reserve.has(u.id)&&!st.fallbackUnits[u.id]).length;
  for(const op of st.ops){
    const want=Math.min(OPS.maxMembers,Math.max(OPS.minMembers,Math.ceil(available/Math.max(1,st.ops.length)))),rally=g.map.tiles[op.rally];
    // Replace losses while gathering, not by feeding isolated replacements into a broken assault.
    if(op.state==='gather'){
      const free=army.filter(u=>!used.has(u.id)&&!reserve.has(u.id)&&!st.fallbackUnits[u.id]&&!u.embarked&&u.transport==null&&!isWater(tileOf(u))).sort((a,b)=>dist(tileOf(a),rally,g.map)-dist(tileOf(b),rally,g.map)||a.id-b.id);
      while(op.members.length<want&&free.length){const u=free.shift();op.members.push(u.id);used.add(u.id);}
    }
    const ready=operationReadiness(g,p,op);op.readiness=ready;
    if(op.state==='gather'){
      const units=op.members.map(id=>g.units.find(u=>u.id===id)),near=units.filter(u=>dist(tileOf(u),rally,g.map)<=OPS.gatherRadius).length;
      op.gatherDeadline??=g.turn+Math.max(3,Math.min(10,Math.ceil(Math.max(0,...units.map(u=>dist(tileOf(u),rally,g.map)/Math.max(1,UNITS[u.type].moves||2))))+2));
      if(ready.ready&&(ready.breached||near>=Math.ceil(op.members.length*OPS.gatherShare))){op.state='march';op.marchedAt=g.turn;op.initialStrength=ready.strength;}
      else if(g.turn>=op.gatherDeadline){retreat(op,'gather_timeout');op.cancelled=true;}
    }else if(op.members.some(id=>dist(tileOf(g.units.find(u=>u.id===id)),g.map.tiles[op.tile],g.map)<=3))op.state='siege';
  }
  st.ops=st.ops.filter(op=>!op.cancelled);
}
// Failed operations return to home coverage; manual seats never receive native assignments.
export function reserveFor(g,p){
  if(p.manual)return null;const army=landArmy(g,p),keep=homeReserve(g,p,army);
  if(Object.values(p.relations).some(r=>r.status==='war')&&!p.aiState?.ops?.length)for(const u of army)keep.add(u.id);
  return keep;
}
export function operationFor(g,p,unitId){
  if(p.manual)return null;
  const fallback=p.aiState?.fallbackUnits?.[unitId];if(fallback&&fallback.until>g.turn)return fallback;
  for(const op of p.aiState?.ops||[])if(op.members.includes(unitId))return op;return null;
}

// ---------- hints for drivers (read by the SDK only when present) ----------
export function warHint(g,p,id){const rec=p.attitudes?.[id];if(!rec)return null;return {declare:rec.intent==='declare',intent:rec.intent,value:rec.warValue,opinion:rec.opinion,casusBelli:rec.casusBelli};}
export function peaceHint(g,p,id){const rec=p.attitudes?.[id];if(!rec)return null;return rec.intent==='peace';}
export function opinionHint(g,p,id){const rec=p.attitudes?.[id];if(!rec)return null;return rec.opinion;}
// Engine-decided proposal answers. Hard vetoes (unpayable terms, arrears/insolvency, readiness, feasibility,
// agreement rules) always stand; attitude only shifts the remaining discretionary score. Returns null when no attitude assessment is available.
export const ACCEPT={peaceThreshold:8,peaceWant:12,peaceHold:-20,jointThreshold:30,jointBias:15};
export function proposalAcceptance(g,p,offer,assessment){
  const rec=p.attitudes?.[offer.from];if(!rec)return null;
  if(offer.kind==='peace'){if(!assessment||assessment.payable===false)return false;
    const duration=g.turn-(p.relations[offer.from]?.since??g.turn),bias=rec.intent==='peace'?ACCEPT.peaceWant:rec.intent==='fight'&&duration<(rec.minWar??6)?ACCEPT.peaceHold:0;
    return assessment.score+bias>=ACCEPT.peaceThreshold;}
  if(offer.kind==='jointWar'){if(!assessment||assessment.score<=-1000)return false;const fin=p.militaryArrears||0;if(fin>.01)return false;
    const enemy=p.attitudes?.[offer.enemy],bias=clamp(((rec.opinion||0)-(enemy?.opinion||0))*.15,-ACCEPT.jointBias,ACCEPT.jointBias);
    return assessment.score+bias>=ACCEPT.jointThreshold;}
  if(offer.kind==='alliance')return rec.opinion>=35&&!Object.values(p.relations).some(r=>r.status==='war');
  if(offer.kind==='openBorders')return rec.opinion>=5;
  return null;
}
export function unitPreference(pers,spec){if(!spec||spec.civilian)return 1;const u=pers.units;if(spec.domain==='sea')return u.naval;if(spec.domain==='air')return u.air;if(spec.siege)return u.siege;if(spec.ranged)return u.ranged;if(spec.class==='cavalry')return u.cavalry;return u.melee;}
export function attitudeView(g,o,view){const rec=o.attitudes?.[view];if(!rec)return undefined;return {opinion:rec.opinion,mods:rec.mods.map(m=>({label:m.label,value:m.value})),denounced:(o.relations[view]?.denouncedUntil||0)>(g.realtime?.time??g.turn*20),friend:(o.relations[view]?.friendUntil||0)>(g.realtime?.time??g.turn*20)};}
export function intelView(g,p){if(!p?.intel)return undefined;const out={};for(const [id,rec]of Object.entries(p.intel))if(rec.government)out[id]={government:{value:rec.government.value,learnedAt:rec.government.learnedAt,age:g.turn-rec.government.learnedAt}};return out;}
