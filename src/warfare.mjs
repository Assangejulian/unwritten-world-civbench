import {ownersAtWar,stateForOwner,suzerain,cityStateOwner,cityStateBordersClosed} from './city-states.mjs';
import {isFriend} from './court.mjs';
import {ageRecord} from './ages.mjs';
import {heritageEffects,heritageAura,heritageWarWearinessReduction} from './heritage.mjs';
import {affiliationStatus} from './religion.mjs';
import {UNITS,TECHS,CIVICS,RESOURCES,dist,isWater,canonicalTileKey} from './rules.mjs';
import {BUILDINGS} from './rules.mjs';
import {buildingOperational} from './unique-content.mjs';
import {proposalAcceptance} from './ai.mjs';
import {neighbors} from './world.mjs';
import {geopoliticalContext,geopoliticalPressure,technologyEra,strategicBalance} from './geopolitics.mjs';
import {committedMilitaryUpkeep} from './military-economy.mjs';
import {PEACE_RULES,normalizeTerms,initializePeaceRecords,campaignFor,startCampaign,envoyBudget,lendableSupply,recommendedTerms,recommendedAidTerms,validateTerms,peaceAssessment,fulfillTerms,expirePacts,negotiationOptions,effectiveSupplies,jointWarPassage} from './peace-terms.mjs';

export const WAR_RULES={minimumWarSeconds:160,trucePeriods:20,truceSeconds:400,allianceBreakSeconds:80,envoyCooldown:PEACE_RULES.envoyCooldown,envoyLimit:PEACE_RULES.envoyLimit,proposalSeconds:80,agendaSeconds:60};
export const ACTION_LIMITS={active:24,moving:16,perNation:4};
export const timeOf=g=>g.realtime?.time??g.turn*20;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const war=ownersAtWar;
export const protectedEnvoy=u=>u.type==='envoy'&&u.envoy?.protected===true;
export function unitCooldown(type,action){
  const s=UNITS[type]||{};
  if(action==='rebase')return 4;
  if(action==='move')return type==='scout'?.8:s.class==='cavalry'?1:s.civilian?2:s.domain==='sea'?1.4:1.8;
  if(action==='attack'||action==='cityAttack')return s.domain==='air'?12:s.siege?7:s.ranged?4.5:type==='tank'?5.5:3.5;
  return action==='buildFort'?4:2;
}
export function canEnterTerritory(g,u,t){
  if(t.cityState){const state=g.cityStates?.states.find(s=>s.id===t.cityState);if(state?.capturedBy===null&&u.owner!==cityStateOwner(state.id))return false;}
  const state=t.cityStateTerritory&&g.cityStates?.states.find(s=>s.id===t.cityStateTerritory&&s.capturedBy===null);
  if(state&&u.owner!==cityStateOwner(state.id)){
    if(!cityStateBordersClosed(state)||state.wars.includes(u.owner)||suzerain(g,state)===u.owner)return true;
    // Units already inside may leave after the city-state starts enforcing borders.
    return g.map.tiles[u.tile]?.cityStateTerritory===state.id;
  }
  if(t.owner==null||t.owner===u.owner||u.owner===-1)return true;
  // Border enforcement belongs to the territorial owner, not the visitor.
  if(!g.players[t.owner]?.civics.includes('empire'))return true;
  if(stateForOwner(g,u.owner))return ownersAtWar(g,u.owner,t.owner);
  if(protectedEnvoy(u)&&u.envoy.target===t.owner)return true;
  const relation=g.players[u.owner]?.relations[t.owner];
  if(UNITS[u.type]?.religious&&u.type!=='inquisitor'&&relation?.status!=='war')return true;
  if(u.borderExitOwner===t.owner&&g.map.tiles[u.tile].owner===t.owner)return true;
  return relation?.status==='war'||relation?.status==='alliance'||relation?.openBorders===true||jointWarPassage(g,u.owner,t.owner);
}
export function peaceRemaining(g,a,b){const r=g.players[a]?.relations[b];return r?.status==='war'?Math.max(0,(r.warStartedAt??Math.max(0,timeOf(g)-(g.turn-r.since)*20))+WAR_RULES.minimumWarSeconds-timeOf(g)):0;}
export function truceRemaining(g,a,b){return Math.max(0,Math.max(g.players[a]?.relations[b]?.truceUntil||0,g.players[b]?.relations[a]?.truceUntil||0)-timeOf(g));}
export function initializeWarfare(g){
  g.diplomacy??={proposals:[],agendas:[],nextId:1};
  const d=g.diplomacy;if(!Array.isArray(d.proposals)||d.proposals.length>64||!Array.isArray(d.agendas)||d.agendas.length>52||!Number.isInteger(d.nextId)||d.nextId<1)throw new Error('Invalid diplomatic save.');
  if(d.proposals.some(o=>!Number.isInteger(o.id)||!g.players[o.from]||!g.players[o.to]||o.from===o.to||!['peace','alliance','openBorders','jointWar'].includes(o.kind)||!['pending','accepted','rejected','expired'].includes(o.status)||![o.createdAt,o.expiresAt].every(Number.isFinite)||o.expiresAt<o.createdAt||o.kind==='jointWar'&&(!Number.isInteger(o.enemy)||!g.players[o.enemy]||[o.from,o.to].includes(o.enemy)||!Number.isInteger(o.warId)||!Number.isInteger(o.envoy)||!o.terms)))throw new Error('Invalid diplomatic proposal.');
  if(d.agendas.some(a=>!Number.isInteger(a.id)||!g.players[a.attacker]||!g.players[a.defender]||a.attacker===a.defender||!g.cities.some(c=>c.id===a.city)||!['voting','resolved'].includes(a.status)||![a.createdAt,a.endsAt].every(Number.isFinite)||!a.votes||typeof a.votes!=='object'||Array.isArray(a.votes)||Object.entries(a.votes).some(([id,v])=>!g.players[id]||!['join','aid','observe'].includes(v.choice))))throw new Error('Invalid diplomatic agenda.');
  if(d.cityIncidents!==undefined&&(!d.cityIncidents||typeof d.cityIncidents!=='object'||Array.isArray(d.cityIncidents)||Object.entries(d.cityIncidents).some(([key,at])=>!/^\d+:\d+$/.test(key)||!Number.isFinite(at)||at<0)))throw Error('Invalid city attack records.');
  for(const p of g.players){
    p.fortsDestroyed??=0;p.warWeariness??=0;
    if(p.defensePreparationUntil!==undefined&&(!Number.isFinite(p.defensePreparationUntil)||p.defensePreparationUntil<0))throw Error('Invalid defensive recovery state.');
    for(const r of Object.values(p.relations))if(r.lastInvasionAt!==undefined&&(!Number.isFinite(r.lastInvasionAt)||r.lastInvasionAt<0))throw Error('Invalid invasion record.');
    for(const r of Object.values(p.relations))if(['loyaltyPressure','loyaltyGrievances'].some(k=>r[k]!==undefined&&(!Number.isFinite(r[k])||r[k]<0||r[k]>200))||r.warKind!==undefined&&!['standard','colonial','religious'].includes(r.warKind))throw Error('Invalid loyalty diplomacy or war kind.');
    if(!Number.isInteger(p.fortsDestroyed)||p.fortsDestroyed<0||p.fortsDestroyed>40||!Number.isFinite(p.warWeariness)||p.warWeariness<0||p.warWeariness>65||p.envoyReadyAt!==undefined&&(!Number.isFinite(p.envoyReadyAt)||p.envoyReadyAt<0))throw new Error('Invalid national military state.');
    for(const r of Object.values(p.relations)){if(!['peace','war','alliance'].includes(r.status)||!Number.isFinite(r.grievances)||r.grievances<0||['warStartedAt','truceUntil','borderPressure','militaryPressure','condemnedUntil'].some(k=>r[k]!==undefined&&(!Number.isFinite(r[k])||r[k]<0)))throw new Error('Invalid diplomatic relation.');if(r.openBorders!==undefined&&typeof r.openBorders!=='boolean')throw new Error('Invalid border agreement.');if(r.status==='war')r.warStartedAt??=Math.max(0,timeOf(g)-(g.turn-r.since)*20);}
  }
  for(const t of g.map.tiles){if(t.fort&&(!g.players[t.fort.owner]||!Number.isFinite(t.fort.hp)||t.fort.hp<0||t.fort.hp>160))throw new Error('Invalid fortress.');}
  enforceAllianceCap(g);
  for(const u of g.units)if(u.type==='envoy'&&(!u.envoy||!g.players[u.envoy.target]||u.owner===u.envoy.target||typeof u.envoy.protected!=='boolean'||!['travelling','arrived','cancelled'].includes(u.envoy.state)||!g.cities.some(c=>c.id===u.envoy.capital)))throw new Error('Invalid envoy.');
  for(const u of g.units)if(u.type==='envoy'&&u.envoy.purpose!==undefined&&(u.envoy.purpose!=='jointWar'||!Number.isInteger(u.envoy.enemy)||!g.players[u.envoy.enemy]||[u.owner,u.envoy.target].includes(u.envoy.enemy)||!Number.isInteger(u.envoy.warId)||u.envoy.terms?.mode!=='concession'))throw Error('Invalid aid mission.');
  for(const pact of d.pacts||[])if(pact.kind!==undefined&&(pact.kind!=='jointWar'||!Number.isInteger(pact.enemy)||!g.players[pact.enemy]||[pact.from,pact.to].includes(pact.enemy)))throw Error('Invalid joint war obligation.');
  initializePeaceRecords(g);
  retireEliminatedDiplomacy(g);
  // Upgrade recorded old peace agreements in memory without changing saved geography.
  for(const campaign of d.wars)if(campaign.status==='closed'&&campaign.closedAt!==undefined){
    for(const [a,b]of [[campaign.from,campaign.to],[campaign.to,campaign.from]]){
      const r=g.players[a].relations[b];if(r&&r.status!=='war')r.truceUntil=Math.max(r.truceUntil||0,campaign.closedAt+WAR_RULES.truceSeconds);
    }
  }
  return g;
}
export function retireEliminatedDiplomacy(g){
  const dead=new Set(g.players.filter(p=>!p.alive).map(p=>p.id));if(!dead.size)return;
  for(const p of g.players)for(const [id,r]of Object.entries(p.relations))if((dead.has(p.id)||dead.has(+id))&&(r.status!=='peace'||r.openBorders)){
    Object.assign(r,{status:'peace',openBorders:false,since:g.turn});p.planRevision++;
  }
  for(const w of g.diplomacy?.wars||[])if(w.status==='active'&&(dead.has(w.from)||dead.has(w.to))){w.status='closed';w.closedAt=timeOf(g);for(const [a,b]of [[w.from,w.to],[w.to,w.from]])g.players[a].relations[b].truceUntil=Math.max(g.players[a].relations[b].truceUntil||0,w.closedAt+WAR_RULES.truceSeconds);}
  for(const o of g.diplomacy?.proposals||[])if(o.status==='pending'&&(dead.has(o.from)||dead.has(o.to)||o.kind==='jointWar'&&dead.has(o.enemy)))o.status='expired';
  for(const p of g.diplomacy?.pacts||[])if(p.status==='active'&&(dead.has(p.from)||dead.has(p.to)))p.status='ended';
  for(const a of g.diplomacy?.agendas||[])if(a.status==='voting'&&(dead.has(a.attacker)||dead.has(a.defender))){a.status='resolved';a.result='civilizationEliminated';}
  g.units=g.units.filter(u=>u.type!=='envoy'||!(dead.has(u.owner)||dead.has(u.envoy?.target)||u.envoy.purpose==='jointWar'&&dead.has(u.envoy.enemy)));
  for(const id of dead)if(g.realtime?.queues)g.realtime.queues[id]=[];
}
export function publicDiplomacy(g,view=-1){const d=g.diplomacy||{proposals:[],agendas:[]},known=id=>view<0||id===view||g.players[view]?.met.includes(id),treaties=g.players.flatMap(a=>g.players.filter(b=>b.id>a.id&&known(a.id)&&known(b.id)).flatMap(b=>{const r=a.relations[b.id];return r&&(r.status!=='peace'||r.openBorders||truceRemaining(g,a.id,b.id)>0)?[{from:a.id,to:b.id,status:r.status,openBorders:!!r.openBorders,truceUntil:Math.max(r.truceUntil||0,b.relations[a.id]?.truceUntil||0)}]:[];}));const supplies=effectiveSupplies(g);return {rules:WAR_RULES,limits:ACTION_LIMITS,treaties,wars:(d.wars||[]).filter(w=>view<0||w.from===view||w.to===view),pacts:(d.pacts||[]).filter(w=>view<0||w.from===view||w.to===view),negotiators:g.players.filter(p=>view<0||p.id===view).map(p=>{const requests=aidMissionOptions(g,p),recommended=requests.length?recommendedAidTerms(g,p):null;return {...negotiationOptions(g,p,supplies),aidRequests:requests.map(r=>({...r,recommended}))};}),proposals:d.proposals.filter(p=>view<0||p.from===view||p.to===view),agendas:d.agendas.map(a=>({...a,votes:view<0?a.votes:Object.fromEntries(Object.entries(a.votes).filter(([id])=>+id===view))}))};}
export function diplomaticSummary(g,p,other,context){const r=p.relations[other.id]||{},geo=geopoliticalPressure(g,p,other,context);return {grievances:r.grievances||0,loyaltyPressure:r.loyaltyPressure||0,loyaltyGrievances:r.loyaltyGrievances||0,...geo,discontent:clamp((r.grievances||0)+geo.borderPressure+geo.militaryPressure,0,100),warWeariness:p.warWeariness||0,peaceRemaining:peaceRemaining(g,p.id,other.id),truceRemaining:truceRemaining(g,p.id,other.id),envoyBudget:envoyBudget(g,p.id,other.id),openBorders:r.status==='alliance'||!!r.openBorders};}
export function changeGrievances(g,victim,against,amount){const r=g.players[victim]?.relations[against];if(r)r.grievances=clamp((r.grievances||0)+amount,0,200);}
export function cityAttacked(g,attacker,city,emit){
  const defender=city.owner,r=g.players[attacker]?.relations[defender];if(attacker<0||!r)return;
  g.players[defender].relations[attacker].lastInvasionAt=timeOf(g);
  const time=timeOf(g),d=g.diplomacy,key=attacker+':'+city.id;d.cityIncidents??={};if(time-(d.cityIncidents[key]??-Infinity)<400)return;d.cityIncidents[key]=time;
  for(const p of g.players)if(p.alive&&p.id!==attacker&&p.met.includes(attacker)){const allied=p.relations[defender]?.status==='alliance';changeGrievances(g,p.id,attacker,p.id===defender?25:allied?45:25);if(p.id!==defender)p.relations[attacker].condemnedUntil=time+800;}
  if(!d.agendas.some(a=>a.attacker===attacker&&a.defender===defender&&a.status==='voting'))d.agendas.push({id:d.nextId++,city:city.id,attacker,defender,reason:'cityAttack',status:'voting',createdAt:time,endsAt:time+WAR_RULES.agendaSeconds,votes:{}});
  d.agendas=d.agendas.slice(-32);for(const [id,at]of Object.entries(d.cityIncidents))if(time-at>2400)delete d.cityIncidents[id];
  emit(g,'diplomacy',`${g.players[attacker].short} 攻打 ${city.name}，各国谴责并启动联合援助会议。`,null);
}
export function beginWar(g,p,other,emit,{defensive=false,kind='standard'}={}){
  initializeWarfare(g);const time=timeOf(g),a=p.relations[other.id],b=other.relations[p.id],remaining=truceRemaining(g,p.id,other.id);
  if(remaining>0)throw new Error(`双方处于停战保护期，还需 ${Math.ceil(remaining/20)} 周期（${Math.ceil(remaining)} 游戏秒）。`);
  if(isFriend(g,p.id,other.id))throw Error('友谊有效期内不能宣战。');
  if(!a||a.status!=='peace'||b?.status!=='peace'||!p.met.includes(other.id))throw new Error('此国当前不能宣战。');
  if(!['standard','colonial','religious'].includes(kind)||kind==='colonial'&&technologyEra(p)-technologyEra(other)<3)throw Error('殖民战争需要领先对方至少三个科技时代。');
  if(kind==='religious'&&(!affiliationStatus(g,p)?.canRevolt||p.religionParent!==other.id))throw Error('宗教战争需要支派信徒超过母宗，且双方都未进入现代。');
  startCampaign(g,p.id,other.id);for(const r of [a,b]){r.status='war';r.since=g.turn;r.warStartedAt=time;r.openBorders=false;r.aggressor=defensive?other.id:p.id;}expirePacts(g);
  for(const r of [a,b])r.warKind=kind;
  if(!defensive){changeGrievances(g,other.id,p.id,35);for(const o of g.players)if(o.id!==p.id&&o.id!==other.id&&o.alive&&o.met.includes(p.id))changeGrievances(g,o.id,p.id,6);}
  g.routes=g.routes.filter(r=>{const a=g.cities.find(c=>c.id===r.from),b=g.cities.find(c=>c.id===r.to);return !a||!b||!((a.owner===p.id&&b.owner===other.id)||(a.owner===other.id&&b.owner===p.id));});
  for(const o of [p,other])o.planRevision=(o.planRevision||0)+1;
  emit(g,'diplomacy',`${p.short} ${defensive?'决定援助受侵略国，向':'向'} ${other.short} ${kind==='colonial'?'宣布殖民战争':'宣战'}。`,null);return true;
}
function settlePeace(g,a,b,emit){
  if(peaceRemaining(g,a,b)>0||!war(g,a,b))return false;
  for(const [x,y]of [[a,b],[b,a]]){const p=g.players[x],r=p.relations[y];if(r.lastInvasionAt!==undefined&&r.lastInvasionAt>=(r.warStartedAt||0))p.defensePreparationUntil=Math.max(p.defensePreparationUntil||0,timeOf(g)+400);}
  for(const [x,y]of [[a,b],[b,a]]){const r=g.players[x].relations[y];Object.assign(r,{status:'peace',since:g.turn,openBorders:false,truceUntil:Math.max(r.truceUntil||0,timeOf(g)+WAR_RULES.truceSeconds)});r.grievances=Math.max(0,r.grievances-10);g.players[x].planRevision++;}
  const campaign=campaignFor(g,a,b);if(campaign){campaign.status='closed';campaign.closedAt=timeOf(g);}for(const offer of g.diplomacy.proposals)if(offer.status==='pending'&&[a,b].includes(offer.from)&&[a,b].includes(offer.to))offer.status='expired';
  allowBorderExit(g,a,b);allowBorderExit(g,b,a);
  g.units=g.units.filter(u=>u.type!=='envoy'||!((u.owner===a&&u.envoy.target===b)||(u.owner===b&&u.envoy.target===a)));
  const remaining=truceRemaining(g,a,b);emit(g,'diplomacy',`${g.players[a].short} 与 ${g.players[b].short} 达成和约，双方 ${Math.ceil(remaining/20)} 周期（${Math.ceil(remaining)} 游戏秒）内不得再次宣战或攻击。`,null);return true;
}
export function propose(g,p,to,kind,emit,details={}){
  initializeWarfare(g);const d=g.diplomacy,time=timeOf(g);
  if(kind==='jointWar'&&(!jointWarAllowed(g,p.id,to,details.enemy,details.warId)||!g.units.some(u=>u.id===details.envoy&&u.owner===p.id&&u.envoy?.purpose==='jointWar'&&u.envoy.enemy===details.enemy&&u.envoy.warId===details.warId&&u.envoy.state==='arrived'&&u.envoy.target===to)))throw Error('求援须由有效的来使抵达首都后提出。');
  if(kind==='alliance'&&[p,g.players[to]].some(o=>!o||Object.values(o.relations).filter(r=>r.status==='alliance').length>=5))throw Error('联盟上限为五个文明。');
  if(d.proposals.some(x=>x.from===p.id&&x.to===to&&x.kind===kind&&x.status==='pending'))throw new Error('已有同类提议等待答复。');
  const proposal={id:d.nextId++,from:p.id,to,kind,createdAt:time,expiresAt:time+(details.envoy?peaceRemaining(g,p.id,to)+PEACE_RULES.proposalSeconds:WAR_RULES.proposalSeconds),status:'pending',...(kind==='jointWar'?{enemy:details.enemy}:{}),...(details.envoy?{envoy:details.envoy,warId:details.warId,terms:normalizeTerms(details.terms),cityNames:(details.terms?.cities||[]).map(id=>({id,name:g.cities.find(c=>c.id===id)?.name||'城池'}))}:{})};d.proposals.push(proposal);d.proposals=d.proposals.slice(-64);emit(g,'diplomacy',`${p.short} 向 ${g.players[to].short} 提议${{peace:'和谈',alliance:'联盟',openBorders:'相互开放边界',jointWar:'联合对敌'}[kind]}。`,p.id);return proposal;
}
function enforceAllianceCap(g){
  if(!g.players.some(p=>Object.values(p.relations).filter(r=>r.status==='alliance').length>5))return;
  // Keep the strongest established bilateral bonds. Excess old alliances become
  // peace with exit permission and a grace period, never an immediate war.
  const edges=[];for(const a of g.players)for(const b of g.players)if(b.id>a.id&&a.relations[b.id]?.status==='alliance')edges.push({a,b,cost:(a.relations[b.id].grievances||0)+(b.relations[a.id]?.grievances||0)});
  edges.sort((x,y)=>x.cost-y.cost||x.a.id-y.a.id||x.b.id-y.b.id);const count=new Map();let removed=0;
  for(const {a,b}of edges){if((count.get(a.id)||0)<5&&(count.get(b.id)||0)<5){count.set(a.id,(count.get(a.id)||0)+1);count.set(b.id,(count.get(b.id)||0)+1);continue;}
    for(const [p,q]of [[a,b],[b,a]])Object.assign(p.relations[q.id],{status:'peace',openBorders:false,since:g.turn,truceUntil:Math.max(p.relations[q.id].truceUntil||0,timeOf(g)+WAR_RULES.allianceBreakSeconds)});
    allowBorderExit(g,a.id,b.id);allowBorderExit(g,b.id,a.id);a.planRevision=(a.planRevision||0)+1;b.planRevision=(b.planRevision||0)+1;removed++;
  }
  g.diplomacy.allianceAdjustment={turn:g.turn,removed};
}
export function jointWarAllowed(g,from,to,enemy,warId){
 const a=g.players[from],b=g.players[to],e=g.players[enemy],campaign=campaignFor(g,from,enemy);
 return !!(a?.alive&&b?.alive&&e?.alive&&new Set([from,to,enemy]).size===3&&a.met.includes(to)&&a.met.includes(enemy)&&b.met.includes(enemy)&&war(g,from,enemy)&&campaign&&(warId===undefined||campaign.id===warId)&&['peace','alliance'].includes(a.relations[to]?.status)&&['peace','alliance'].includes(b.relations[from]?.status)&&b.relations[enemy]?.status==='peace'&&e.relations[to]?.status==='peace'&&truceRemaining(g,to,enemy)===0&&!isFriend(g,to,enemy));
}
export function aidMissionOptions(g,p){
 const requests=[];
 for(const enemy of p.met.filter(id=>p.relations[id]?.status==='war')){const budget=envoyBudget(g,p.id,enemy);if(!budget.remaining||budget.cooldown>0||p.gold<10)continue;
  for(const to of p.met)if(jointWarAllowed(g,p.id,to,enemy,budget.warId)&&g.cities.some(c=>c.id===g.players[to].capital&&c.owner===to&&p.knownCities?.[c.id])&&!g.units.some(u=>u.owner===p.id&&u.type==='envoy'&&u.envoy.target===to)&&!g.diplomacy.proposals.some(o=>o.from===p.id&&o.to===to&&o.kind==='jointWar'&&o.enemy===enemy&&o.status==='pending'))requests.push({to,enemy,...budget});
 }
 return requests;
}
export function jointWarAssessment(g,p,offer,finance){
 const reject=reason=>({accept:false,score:-1000,compensation:0,reason});
 if(offer.to!==p.id||!jointWarAllowed(g,offer.from,p.id,offer.enemy,offer.warId))return reject('联盟、停战保护或原战争状态阻止参战。');
 let terms;try{terms=validateTerms(g,offer,{accept:true});if(terms.mode!=='concession')throw Error();}catch{return reject('目前无法兑现求援报价。');}
 const enemy=g.players[offer.enemy],sender=g.players[offer.from],own=g.units.filter(u=>u.owner===p.id&&u.hp>0&&!UNITS[u.type].civilian),cities=g.cities.filter(c=>c.owner===p.id),wars=Object.values(p.relations).filter(r=>r.status==='war').length;
 const ready=own.length?own.reduce((n,u)=>n+u.hp,0)/(own.length*100):0,balance=strategicBalance(g,p,enemy),partner=strategicBalance(g,p,sender),coalition=(balance.ourPower+partner.estimatedPower*.7+10)/(balance.estimatedPower+10);
 const known=Object.values(p.knownCities||{}).filter(c=>c.owner===enemy.id),distance=known.length&&cities.length?Math.min(...known.flatMap(k=>cities.map(c=>dist(g.map.tiles[k.tile],g.map.tiles[c.tile],g.map)))):99;
 const bill=finance?.projectedUpkeep??committedMilitaryUpkeep(g,p),cash=p.gold+terms.gold,reserve=Math.max(40,bill*3+(p.militaryArrears||0)),deficit=finance?Math.max(0,bill-finance.grossGold):bill*.5;
 if(own.length<3||ready<.55||wars>=2||(p.warWeariness||0)>=48||coalition<.8||distance>40)return reject('兵力、战线距离或国内战争压力不足以承担新的战争。');
 if((p.militaryArrears||0)>.01||cash<reserve+deficit*4)return reject('补偿仍不足以维持本国军费与作战储备。');
 const supplies=effectiveSupplies(g)[p.id],resourceValue=terms.resourceAmount*(supplies[terms.resource]?10:RESOURCES[terms.resource]?.category==='strategic'?24:RESOURCES[terms.resource]?.category==='luxury'?22:14)*terms.durationTurns/20;
 const cityValue=terms.cities.length*55,tradeValue=terms.tradeShare*.7,compensation=Math.min(150,35*Math.log1p(terms.gold/Math.max(40,bill*3))+resourceValue+cityValue+tradeValue);
 const score=10+(p.relations[sender.id]?.status==='alliance'?28:0)+Math.min(32,(p.relations[enemy.id]?.grievances||0)*.35)+clamp(Math.log2(coalition)*28,-20,40)+compensation-Math.min(30,distance*.6)-(p.warWeariness||0)*1.2-wars*24-(p.strategy==='science'?12:0);
 return {accept:score>=30,score:Math.round(score),compensation:Math.round(compensation),powerRatio:Number(coalition.toFixed(2)),distance,reason:score>=30?'补偿、共同敌人和可见战力足以承担联合战争。':'补偿不足以弥补新战线与军费风险。'};
}
function missionValid(g,offer){if(!offer.envoy)return true;const u=g.units.find(u=>u.id===offer.envoy),c=g.cities.find(c=>c.id===u?.envoy?.capital);return u?.type==='envoy'&&u.owner===offer.from&&u.envoy?.target===offer.to&&u.envoy.state==='arrived'&&c?.owner===offer.to&&u.tile===c.tile&&(offer.kind!=='jointWar'||u.envoy.purpose==='jointWar'&&u.envoy.enemy===offer.enemy&&u.envoy.warId===offer.warId&&jointWarAllowed(g,offer.from,offer.to,offer.enemy,offer.warId));}
function agreementAllowed(g,offer){const a=g.players[offer.from],b=g.players[offer.to],r=a?.relations[b?.id];if(offer.kind==='jointWar')return missionValid(g,offer)&&jointWarAllowed(g,offer.from,offer.to,offer.enemy,offer.warId);if(offer.kind==='alliance'&&([a,b].some(p=>Object.values(p.relations).filter(r=>r.status==='alliance').length>=5)))return false;return a?.alive&&b?.alive&&missionValid(g,offer)&&(offer.kind==='peace'?r?.status==='war'&&peaceRemaining(g,a.id,b.id)===0:r?.status==='peace'&&(offer.kind!=='alliance'||a.civics.includes('civilservice')&&b.civics.includes('civilservice')));}
export function answerProposal(g,p,id,accept,emit){const offer=g.diplomacy?.proposals.find(o=>o.id===id&&o.to===p.id&&o.status==='pending');if(!offer||offer.expiresAt<timeOf(g))throw new Error('外交提议已失效。');if(accept&&!agreementAllowed(g,offer))throw new Error('尚未满足和谈或条约条件。');if(accept&&offer.terms)validateTerms(g,offer,{accept:true});offer.status=accept?'accepted':'rejected';offer.answeredAt=timeOf(g);
  if(accept){if(offer.kind==='jointWar'){beginWar(g,p,g.players[offer.enemy],emit,{defensive:g.players[offer.enemy].relations[offer.from]?.aggressor===offer.enemy});fulfillTerms(g,offer);g.units=g.units.filter(u=>u.id!==offer.envoy);g.players[offer.from].planRevision++;}else if(offer.kind==='peace'){if(offer.terms)fulfillTerms(g,offer);settlePeace(g,offer.from,offer.to,emit);}else for(const [x,y]of [[offer.from,offer.to],[offer.to,offer.from]]){const r=g.players[x].relations[y];r.openBorders=true;if(offer.kind==='alliance'){r.status='alliance';r.since=g.turn;ageRecord(g,g.players[x],['alliance'],`alliance:${y}`);}r.grievances=Math.max(0,r.grievances-8);g.players[x].planRevision++;}}
  if(!accept&&offer.envoy)g.units=g.units.filter(u=>u.id!==offer.envoy);
  emit(g,'diplomacy',`${p.short} ${accept?'接受':'拒绝'}了 ${g.players[offer.from].short} 的${{peace:'和谈',alliance:'联盟',openBorders:'开放边界',jointWar:'联合战争'}[offer.kind]}提议。`,null);
}
export function sendEnvoy(g,p,target,addUnit,emit,input,enemy){initializeWarfare(g);const joint=enemy!==undefined,opponent=joint?enemy:target,other=g.players[target],time=timeOf(g),budget=envoyBudget(g,p.id,opponent);if(!other?.alive||!p.met.includes(target)||!(joint?jointWarAllowed(g,p.id,target,enemy,budget.warId):war(g,p.id,target))||budget.remaining<=0||budget.cooldown>0||p.gold<10||g.units.some(u=>u.owner===p.id&&u.type==='envoy'&&u.envoy.target===target))throw new Error('来使暂不可派遣：求援和议和共用每场战争 3 次来使及 200 秒冷却；派遣需 10 金币，参战须遵守联盟与停战保护。');
  const terms=validateTerms(g,{from:p.id,to:target,...(joint?{kind:'jointWar'}:{}),terms:input??(joint?recommendedAidTerms(g,p):recommendedTerms(g,p,target))});
  const home=g.cities.find(c=>c.id===p.capital&&c.owner===p.id)||g.cities.find(c=>c.owner===p.id),capital=g.cities.find(c=>c.id===other.capital&&c.owner===target);if(!home||!capital||!p.knownCities?.[capital.id])throw new Error('双方首都必须存在，且对方首都已被发现。');
  const spawn=[g.map.tiles[home.tile],...neighbors(g.map,g.map.tiles[home.tile])].find(t=>!isWater(t)&&t.owner===p.id&&!g.units.some(u=>u.hp>0&&(u.tile===t.id||['move','rebase'].includes(u.activity?.action.type)&&u.activity.to===t.id)));if(!spawn)throw new Error('首都附近无来使部署位置。');
  const u=addUnit(g,p.id,'envoy',spawn.id);u.envoy={target,capital:capital.id,protected:true,state:'travelling',sentAt:time,warId:budget.warId,terms,...(joint?{purpose:'jointWar',enemy}:{})};const campaign=campaignFor(g,p.id,opponent);campaign.uses++;campaign.nextEnvoyAt=time+WAR_RULES.envoyCooldown;p.gold-=10;emit(g,'diplomacy',`${p.short} 派遣金光来使前往 ${other.short} 首都${joint?'请求联合攻打 '+g.players[enemy].short:'和谈'}。`,p.id,spawn.id);return u;
}
function proposeEnvoy(g,u,emit){const e=u.envoy,joint=e.purpose==='jointWar';if(joint?jointWarAllowed(g,u.owner,e.target,e.enemy,e.warId):war(g,u.owner,e.target))e.proposal=propose(g,g.players[u.owner],e.target,joint?'jointWar':'peace',emit,{envoy:u.id,warId:e.warId,terms:e.terms??normalizeTerms(),...(joint?{enemy:e.enemy}:{})}).id;}
export function envoyArrival(g,u,emit){if(u.type!=='envoy'||!u.envoy?.protected)return;const c=g.cities.find(c=>c.id===u.envoy.capital);if(!c||c.owner!==u.envoy.target||u.envoy.purpose==='jointWar'&&!jointWarAllowed(g,u.owner,u.envoy.target,u.envoy.enemy,u.envoy.warId)){u.envoy.protected=false;u.envoy.state='cancelled';return;}if(u.tile!==c.tile)return;u.envoy.protected=false;u.envoy.state='arrived';u.envoy.arrivedAt=timeOf(g);if(!canEnterTerritory(g,u,g.map.tiles[u.tile]))u.borderExitOwner=u.envoy.target;try{proposeEnvoy(g,u,emit);}catch{}emit(g,'diplomacy',`${g.players[u.owner].short} 的来使已抵达 ${c.name}，金光保护结束。`,null,c.tile);}
export function envoyKilled(g,u,killer,emit){if(u.type!=='envoy')return;const offer=g.diplomacy?.proposals.find(o=>o.envoy===u.id&&o.status==='pending');if(offer){offer.status='expired';offer.reason='envoyKilled';}changeGrievances(g,u.owner,killer,80);for(const p of g.players)if(p.alive&&p.id!==killer&&p.id!==u.owner&&p.met.includes(killer))changeGrievances(g,p.id,killer,12);emit(g,'diplomacy',`${g.players[u.owner].short} 的来使遭 ${g.players[killer]?.short||'蛮族'} 杀害，不满度大幅增加。`,null,u.tile);}
export function capitalAgenda(g,attacker,defender,city,emit){const aggressor=g.players[attacker]?.relations[defender]?.aggressor;if(!city.isCapital||city.originalOwner!==defender||aggressor!==undefined&&aggressor!==attacker)return;initializeWarfare(g);if(g.diplomacy.agendas.some(a=>a.attacker===attacker&&a.defender===defender&&a.status==='voting'))return;g.diplomacy.agendas.push({id:g.diplomacy.nextId++,city:city.id,attacker,defender,status:'voting',createdAt:timeOf(g),endsAt:timeOf(g)+WAR_RULES.agendaSeconds,votes:{}});g.diplomacy.agendas=g.diplomacy.agendas.slice(-32);for(const p of g.players)if(p.id!==attacker&&p.id!==defender&&p.met.includes(attacker))changeGrievances(g,p.id,attacker,10);emit(g,'diplomacy',`${g.players[defender].short} 的首都被占领，国际援助议程已启动。`,null);}
export function aidAssessment(g,p,a){
  const own=g.units.filter(u=>u.owner===p.id&&!UNITS[u.type].civilian),cities=g.cities.filter(c=>c.owner===p.id),known=Object.values(p.knownCities||{}).filter(c=>c.owner===a.attacker||c.owner===a.defender),distance=known.length&&cities.length?Math.min(...known.flatMap(k=>cities.map(c=>dist(g.map.tiles[k.tile],g.map.tiles[c.tile],g.map)))):60;
  const ready=own.length?own.reduce((n,u)=>n+u.hp,0)/(own.length*100):0,domestic=clamp(50-(p.warWeariness||0)-cities.filter(c=>c.loyalty<60).length*10,0,100),wars=Object.values(p.relations).filter(r=>r.status==='war').length;
  const alliance=p.relations[a.defender]?.status==='alliance',hostility=p.relations[a.attacker]?.grievances||0;
  const score=(alliance?38:0)+Math.max(0,22-distance*1.3)+Math.min(25,hostility*.35)+domestic*.35+ready*20-wars*25-(own.length<4?35:0)-(p.gold<40?20:0)-(p.strategy==='domination'?5:0);
  return {score:Math.round(score),readiness:Math.round(ready*100),domestic,distance,choice:score>=70&&ready>.55&&own.length>=4?'join':score>=32&&p.gold>=30?'aid':'observe'};
}
export function voteAid(g,p,id,choice,emit){const a=g.diplomacy?.agendas.find(a=>a.id===id&&a.status==='voting');if(!a||timeOf(g)>=a.endsAt||p.id===a.attacker||p.id===a.defender||!['join','aid','observe'].includes(choice)||a.votes[p.id])throw new Error('议程或选择不可用。');if(!p.met.includes(a.attacker)||!p.met.includes(a.defender))throw new Error('尚未认识议程中的文明。');if(choice==='aid'&&p.gold<30)throw new Error('援助需要 30 金币。');if(choice==='join'&&(p.relations[a.attacker].status!=='peace'||truceRemaining(g,p.id,a.attacker)>0))throw new Error('联盟、现有战争或停战保护阻止参战。');a.votes[p.id]={choice,...aidAssessment(g,p,a),choice};emit(g,'diplomacy',`${p.short} 对援助议程作出了${{join:'军事干预',aid:'经济援助',observe:'观望'}[choice]}决定。`,p.id);}
export function diplomacyTurn(g,emit,{finance}={}){
  initializeWarfare(g);expirePacts(g);const time=timeOf(g);
  // Relations use remembered borders and visible troops, never hidden opponent armies.
  for(const p of g.players){if(!p.alive)continue;const context=geopoliticalContext(g,p,{cached:true});
    const fighting=Object.values(p.relations).some(r=>r.status==='war');p.warWeariness=clamp((p.warWeariness||0)+(fighting?1.5*(1-heritageWarWearinessReduction(g,p)):-3),0,65);
    for(const id of p.met){const r=p.relations[id];if(!r||!g.players[id]?.alive)continue;const geo=geopoliticalPressure(g,p,g.players[id],context);r.borderPressure=geo.borderPressure;r.militaryPressure=geo.militaryPressure;
      const trade=g.routes.some(route=>route.owner===p.id&&g.cities.some(c=>c.id===route.to&&c.owner===id)),tension=r.borderPressure+r.militaryPressure;
      const growth=r.status==='war'?0:clamp((tension-12)*.07,0,3.5),recovery=(r.status==='alliance'?.4:.25)+(trade?.65:0);
      r.grievances=clamp(r.grievances+growth-recovery,0,200);
    }
  }
  for(const u of g.units.filter(u=>u.type==='envoy')){const e=u.envoy;if(e.purpose==='jointWar'&&!jointWarAllowed(g,u.owner,e.target,e.enemy,e.warId)){e.protected=false;e.state='cancelled';}if(e.protected)envoyArrival(g,u,emit);if(e.state==='arrived'&&!e.proposal){try{proposeEnvoy(g,u,emit);}catch{}}}
  g.units=g.units.filter(u=>u.type!=='envoy'||u.envoy.state!=='cancelled');
  for(const offer of g.diplomacy.proposals){if(offer.status!=='pending')continue;if(offer.expiresAt<time||!missionValid(g,offer)){offer.status='expired';offer.reason=offer.expiresAt<time?'timeout':'missionLost';if(offer.envoy)g.units=g.units.filter(u=>u.id!==offer.envoy);continue;}const p=g.players[offer.to],r=p.relations[offer.from];if(p.manual||!agreementAllowed(g,offer))continue;
    const assessment=offer.kind==='peace'?peaceAssessment(g,p,offer):offer.kind==='jointWar'?jointWarAssessment(g,p,offer,finance?.(p)):null;
    const ruleDecision=assessment?assessment.accept:(r.grievances+r.borderPressure+r.militaryPressure<=(offer.kind==='alliance'?35:55)&&!Object.values(p.relations).some(r=>r.status==='war'));
    const attitudeDecision=proposalAcceptance(g,p,offer,assessment),accept=attitudeDecision===null?ruleDecision:attitudeDecision;
    if(assessment)offer.decisionReason=assessment.reason;answerProposal(g,p,offer.id,accept,emit);
  }
  for(const a of g.diplomacy.agendas){if(a.status!=='voting')continue;if(!g.players[a.defender].alive||(a.reason!=='cityAttack'&&g.cities.find(c=>c.id===a.city)?.owner!==a.attacker)||(a.reason==='cityAttack'&&g.players[a.attacker].relations[a.defender]?.status!=='war')){a.status='resolved';a.result='noLongerOccupied';continue;}for(const p of g.players)if(p.alive&&!p.manual&&p.id!==a.attacker&&p.id!==a.defender&&!a.votes[p.id]&&p.met.includes(a.attacker)&&p.met.includes(a.defender)&&time<a.endsAt){let choice=aidAssessment(g,p,a).choice;if(choice==='join'&&(p.relations[a.attacker].status!=='peace'||truceRemaining(g,p.id,a.attacker)>0))choice=p.gold>=30?'aid':'observe';voteAid(g,p,a.id,choice,emit);}
    if(time>=a.endsAt){a.status='resolved';for(const [id,vote]of Object.entries(a.votes)){const p=g.players[id];if(!p.alive)continue;if(vote.choice==='aid'&&p.gold>=30){const amount=Math.min(150,Math.max(30,Math.floor(p.gold*.12)));p.gold-=amount;g.players[a.defender].gold+=amount;vote.deliveredGold=amount;vote.result='delivered';const resource=['iron','horses','oil'].find(key=>lendableSupply(g,p.id,key)>1);if(resource&&g.diplomacy.pacts.length<64){g.diplomacy.pacts.push({id:g.diplomacy.nextId++,from:p.id,to:a.defender,resource,resourceAmount:1,tradeShare:0,surrender:false,status:'active',startsAt:time,endsAt:time+400});vote.deliveredResource=resource;}}if(vote.choice==='join')try{beginWar(g,p,g.players[a.attacker],emit,{defensive:true});}catch{vote.result='blocked';}}emit(g,'diplomacy','国际援助议程已结束，各国按决定执行援助。',null);}
  }
}
export function fortressLimit(p){return 5+3*Math.max(0,...p.techs.map(k=>TECHS[k]?.era||0),...p.civics.map(k=>CIVICS[k]?.era||0));}
export function fortressStatus(g,p){const destroyed=p.fortsDestroyed||0;return {used:g.map.tiles.filter(t=>t.fort?.owner===p.id&&t.fort.hp>0).length,limit:fortressLimit(p),destroyed,goldCost:Math.ceil(45*(1+destroyed*.3)),seconds:Math.min(172,12+destroyed*4)};}
export function fortConstructionSeconds(g,p,u){const tile=g.map.tiles[u.tile],city=g.cities.find(c=>c.id===tile.territoryCity&&c.owner===p.id),multiplier=u.type==='builder'&&city?Math.min(1,...city.buildings.filter(k=>buildingOperational(g,city,k,BUILDINGS)).map(k=>BUILDINGS[k]?.fortConstructionMultiplier||1)):1;return fortressStatus(g,p).seconds*multiplier;}
export function canBuildFort(g,p,u,t){if(u.type!=='builder'&&!UNITS[u.type]?.engineer||u.charges<=0||!p.techs.includes('masonry')||t.owner!==p.id||isWater(t)||t.terrain==='mountain'||t.cityId!==null||t.district||t.improvement||t.fort||t.naturalWonder)return false;const status=fortressStatus(g,p);return status.used<status.limit&&p.gold>=status.goldCost;}
export function fortressZone(g,t,owner){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const row=t.row+dy,col=g.map.wrapX?(t.col+dx+g.map.width)%g.map.width:t.col+dx;if(row<0||row>=g.map.height||col<0||col>=g.map.width)continue;const f=g.map.tiles[row*g.map.width+col];if(f?.fort?.owner===owner&&f.fort.hp>0)return true;}return false;}
export function roadMultiplier(g,p,u,from,to){if(!from.road||!to.road||from.roadPillaged||to.roadPillaged)return 1;return fortressZone(g,to,p?.id??u.owner)?.35:.6;}
export function fieldActions(g,p,u){if(UNITS[u.type].domain==='air'||g.map.tiles[u.tile].naturalWonder)return [];const t=g.map.tiles[u.tile],actions=[];if((u.type==='builder'||UNITS[u.type]?.engineer)&&u.charges>0&&t.owner===p.id){if(t.pillaged||t.roadPillaged||t.fort&&t.fort.hp<160)actions.push({type:'repair',unit:u.id,hint:{utility:230}});if(canBuildFort(g,p,u,t))actions.push({type:'buildFort',unit:u.id,hint:{...fortressStatus(g,p),seconds:fortConstructionSeconds(g,p,u),resource:!!t.resource,frontier:neighbors(g.map,t).some(n=>n.owner>=0&&n.owner!==p.id&&p.relations[n.owner]?.status!=='alliance'),danger:Object.values(p.relations).some(r=>r.status==='war')}});if(!isWater(t)&&!t.road)actions.push({type:'buildRoad',unit:u.id,hint:{utility:80}});}
  if(!UNITS[u.type].civilian&&UNITS[u.type].strength>0&&(!isWater(t)||UNITS[u.type].domain==='sea')&&t.owner>=0&&t.owner!==p.id&&war(g,p.id,t.owner)){if(t.district?.kind!=='wonder'&&(t.improvement||t.resource||t.district)&&!t.pillaged)actions.push({type:'pillage',unit:u.id,hint:{utility:145,resource:!!t.resource}});if(t.road&&!t.roadPillaged)actions.push({type:'destroyRoad',unit:u.id,hint:{utility:130}});if(t.fort?.hp>0)actions.push({type:'destroyFort',unit:u.id,hint:{utility:160}});}return actions;
}
export function applyFieldAction(g,p,u,type,emit){const t=g.map.tiles[u.tile];if(!fieldActions(g,p,u).some(a=>a.type===type))throw new Error('此地块不满足建造、掠夺或修复条件。');
  if(type==='buildFort'){const s=fortressStatus(g,p);p.gold-=s.goldCost;t.fort={owner:p.id,hp:160,style:p.leaderKey};delete t.fortRuin;u.charges--;}
  if(type==='buildRoad'){t.road=true;t.roadPillaged=false;u.charges--;}
  if(type==='repair'){t.pillaged=false;t.roadPillaged=false;if(t.fort)t.fort.hp=160;u.charges--;}
  if(type==='pillage'){t.pillaged=true;p.gold+=(t.resource?35:20)*(1+(heritageEffects(g,p).pillageYieldMultiplier||0)+(heritageEffects(g,u).pillageYieldMultiplier||0));if(isWater(t)||neighbors(g.map,t).some(isWater))p.gold+=(heritageEffects(g,p).coastalRaidGold||0)+(heritageEffects(g,u).coastalRaidGold||0);u.hp=Math.min(100,u.hp+10);changeGrievances(g,t.owner,p.id,5);}
  if(type==='destroyRoad')t.roadPillaged=true;
  if(type==='destroyFort'){const owner=t.fort.owner;t.fort.hp=0;g.players[owner].fortsDestroyed=Math.min(40,(g.players[owner].fortsDestroyed||0)+1);t.fortRuin={owner,style:t.fort.style};delete t.fort;p.gold+=25;}
  if(type==='pillage'&&UNITS[u.type].class==='cavalry'&&heritageAura(g,u).cavalryPillageFreeMove){u.acted=false;}else {u.moves=0;u.acted=true;}if(u.charges===0&&u.type==='builder')g.units=g.units.filter(x=>x.id!==u.id);emit(g,'build',`${p.short} 完成${{buildFort:'堡垒建造',buildRoad:'道路铺设',repair:'设施修复',pillage:'物资掠夺',destroyRoad:'道路破坏',destroyFort:'堡垒摧毁'}[type]}。`,p.id,t.id);
}
export function maintainFortresses(g){let changed=false;for(const u of g.units){if(u.hp>=100||u.activity||UNITS[u.type].civilian||UNITS[u.type].domain==='air'||isWater(g.map.tiles[u.tile])||!fortressZone(g,g.map.tiles[u.tile],u.owner))continue;u.hp=Math.min(100,u.hp+1);changed=true;}return changed;}
export function connectRoad(g,start,end,owner){const previous=new Map([[start,null]]),queue=[start],unit={owner,tile:start};for(let head=0;head<queue.length&&head<700;head++){const id=queue[head];if(id===end)break;for(const t of neighbors(g.map,g.map.tiles[id]))if(!previous.has(t.id)&&!isWater(t)&&t.terrain!=='mountain'&&!t.naturalWonder&&canEnterTerritory(g,unit,t)){previous.set(t.id,id);queue.push(t.id);}}if(!previous.has(end))return;for(let id=end;id!==null;id=previous.get(id))g.map.tiles[id].road=true;}
export function allowBorderExit(g,owner,target){for(const u of g.units)if(u.owner===owner&&g.map.tiles[u.tile].owner===target)u.borderExitOwner=target;}
