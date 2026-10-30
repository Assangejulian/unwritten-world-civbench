// Era score / ages (时代系统). Symmetric for every civilization; deterministic (no RNG); save-compatible.
import {AGE_BONUSES,AGE_TIERS,civilizationEra,gamePace,dedicationOptions,UNITS,BUILDINGS,unitTransport} from './rules.mjs';
import {baseItem,buildingOperational} from './unique-content.mjs';

export const AGE_BASE_PERIODS=60;
export function agePeriods(g){return Math.max(10,Math.round(AGE_BASE_PERIODS*(gamePace(g).factor||1)));}
export function ageThresholds(index){const dark=8+2*Math.max(0,index);return {dark,golden:dark+10};}
const CAPS={tech:6,civic:6,city:5,conquest:9};
const POINTS={eraFirst:5,era:2,tech:1,civic:1,city:1,wonder:4,greatperson:2,religion:4,conquest:3,alliance:3,space:3,dedication:1,natural:2};
const LABEL={eraFirst:'世界首个进入',era:'进入',tech:'世界首个完成科技',civic:'世界首个完成市政',city:'建立城市',wonder:'奇观落成',greatperson:'招募伟人',religion:'创立宗教',conquest:'征服城市',alliance:'结成同盟',space:'太空计划'};
const blankAge=(g,p,tier='normal')=>({tier,score:0,archivedScore:0,counts:{},moments:[],bonuses:[],pending:null,objectiveProgress:{points:0,seen:[]},era:civilizationEra(p),allies:Object.entries(p.relations||{}).filter(([,r])=>r.status==='alliance').map(([id])=>+id),religion:!!p.religion,space:p.spaceStage||0,history:[]});

export function ensureAges(g){
  if(g.ages&&g.players.every(p=>p.age))return g.ages;
  const N=agePeriods(g);
  if(!g.ages){const index=Math.max(0,Math.floor((g.turn-1)/N));
    g.ages={version:1,index,startTurn:1+index*N,length:N,lastEventId:g.eventId??0,lastCityId:Math.max(0,...g.cities.map(c=>c.id)),knownTech:{},knownCivic:{},eraFirst:{},wonders:Object.keys(g.wonders||{})};
    for(const p of g.players){for(const k of p.techs||[])g.ages.knownTech[k]=1;for(const k of p.civics||[])g.ages.knownCivic[k]=1;const e=civilizationEra(p);for(let i=1;i<=e;i++)g.ages.eraFirst[i]=1;}}
  for(const p of g.players)if(!p.age){p.age=blankAge(g,p);p.ageEffects=computeEffects(p.age.tier,p.age.bonuses);}
  return g.ages;
}
function award(g,p,key,text,emit,cap){const a=p.age;if(cap!==undefined){a.counts[key]=(a.counts[key]||0)+1;if(a.counts[key]>cap)return;}const points=POINTS[key];a.score+=points;a.moments.unshift({turn:g.turn,key,points,text});if(a.moments.length>40)a.moments.length=40;}
export function ageNaturalDiscovery(g,p,name){ensureAges(g);award(g,p,'natural','发现自然奇观：'+name);}

// Called only after an authoritative accomplishment succeeds. Bounded identities prevent
// pillage/repair, duplicate callbacks and save/reload from farming the same objective.
export function ageRecord(g,p,kinds,identity){
  const a=p?.age;if(a?.tier!=='normal'||a.pending)return;
  const bonus=AGE_BONUSES[a.bonuses[0]],goal=bonus?.objective;if(!goal)return;
  const points=Math.max(0,...kinds.map(k=>goal.events[k]||0));if(!points)return;
  const progress=a.objectiveProgress??={points:0,seen:[]},id=String(identity);
  if(progress.points>=goal.cap||progress.seen.includes(id))return;
  const earned=Math.min(points,goal.cap-progress.points);progress.points+=earned;progress.seen.push(id);
  a.score+=earned;a.moments.unshift({turn:g.turn,key:'dedication',points:earned,text:`${bonus.name}：${goal.label}`});if(a.moments.length>40)a.moments.length=40;
}

const selectedRules=p=>(p.age?.bonuses||[]).map(k=>AGE_BONUSES[k]).filter(Boolean);
const activeBuilding=(g,c,key)=>(c.buildings||[]).some(k=>baseItem(k)===key&&buildingOperational(g,c,k,BUILDINGS));
export function ageCityBonuses(g,p,c,definitions=selectedRules(p)){
  const flat={},multipliers={};
  const count=when=>{
    if(when==='river')return Number(!!g.map.tiles[c.tile]?.river);
    if(when==='largeCity')return Number(c.population>=10);
    if(['route','foreignRoute','domesticRoute'].includes(when))return Math.min(4,g.routes.filter(r=>r.owner===p.id&&r.from===c.id&&g.cities.some(o=>o.id===r.to&&(when==='route'||(o.owner===p.id)===(when==='domesticRoute')))).length);
    if(when==='workedMine'||when==='workedImprovement')return Math.min(4,(c.worked||[]).filter(id=>{const t=g.map.tiles[id];return t?.owner===p.id&&!t.pillaged&&t.improvement&&(when!=='workedMine'||t.improvement==='mine');}).length);
    return Number(activeBuilding(g,c,when));
  };
  for(const b of definitions)for(const rule of b.cities||[]){const n=count(rule.when);for(const [k,v]of Object.entries(rule.flat||{}))flat[k]=(flat[k]||0)+n*v;for(const [k,v]of Object.entries(rule.multipliers||{}))multipliers[k]=(multipliers[k]||0)+n*v;}
  return {flat,multipliers};
}
export function ageUnitBonus(g,u,defending=false){
  const p=g.players[u.owner],s=UNITS[u.type],t=g.map.tiles[u.tile];if(!p||!s||s.civilian||unitTransport(u,t))return 0;
  const conditions={homeDefense:defending&&t.owner===p.id,siegeAttack:!defending&&!!s.siege};
  return selectedRules(p).flatMap(b=>b.units||[]).reduce((n,r)=>n+(conditions[r.when]?r.combat:0),0);
}

// Save validation (R3). Missing fields of an otherwise valid age state get defaults; present-but-malformed values are rejected,
// matching restore()'s convention for other systems. Derived effects (p.ageEffects) are never trusted: they are recomputed from
// the validated tier + bonuses, so restoring the same save any number of times yields the same state.
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),isInt=(v,lo=0,hi=Number.MAX_SAFE_INTEGER)=>Number.isInteger(v)&&v>=lo&&v<=hi;
const poolOf=tier=>tier==='heroic'?'golden':tier,countOf=tier=>tier==='heroic'?3:1;
const bad=what=>{throw new Error('Invalid age state: '+what+'.');};
const flagMap=(v,what)=>{if(v===undefined||v===null)return {};if(!isObj(v)||Object.values(v).some(x=>x!==1))bad(what);return v;};
function validMoments(v,max,turn,what){if(v===undefined||v===null)return [];if(!Array.isArray(v)||v.length>max)bad(what);
  for(const m of v)if(!isObj(m)||!isInt(m.turn,0,turn+1)||!Object.hasOwn(POINTS,m.key)||(m.key==='dedication'?!isInt(m.points,1,3):m.points!==POINTS[m.key])||typeof m.text!=='string'||m.text.length>500)bad(what);return v;}
// Legacy worlds (saved before the age system) are migrated exactly once, at the first mutation entry point
// (applyAction / finishTurn / event) after restore, so the baseline is taken BEFORE any new accomplishment.
const LEGACY=new WeakSet();
export function migrateLegacyAges(g){if(LEGACY.has(g)){LEGACY.delete(g);ensureAges(g);}}
export function validateAges(g){
  if(g.ages===undefined||g.ages===null){  // legacy save: keep restore byte-minimal, migrate before the first new work (see migrateLegacyAges)
    delete g.ages;for(const p of g.players){if('age' in p)delete p.age;if('ageEffects' in p)delete p.ageEffects;}LEGACY.add(g);return null;}
  const A=g.ages,turn=g.turn;if(!isObj(A)||A.version!==1)bad('version');
  if(!isInt(A.length,10,600)||!isInt(A.index,0,10000)||!isInt(A.startTurn,1,turn+1))bad('timing');  // elapsed time beyond one age is legal (e.g. turn advanced by tools); the next settlement rolls the boundary
  if(!isInt(A.lastEventId,0,Math.max(0,g.eventId??0))||!isInt(A.lastCityId,0,Math.max(0,g.nextId??0)))bad('cursor');
  A.knownTech=flagMap(A.knownTech,'knownTech');A.knownCivic=flagMap(A.knownCivic,'knownCivic');A.eraFirst=flagMap(A.eraFirst,'eraFirst');
  if(A.wonders===undefined||A.wonders===null)A.wonders=Object.keys(g.wonders||{});
  if(!Array.isArray(A.wonders)||A.wonders.some(k=>typeof k!=='string')||new Set(A.wonders).size!==A.wonders.length)bad('wonders');
  for(const p of g.players){
    if(p.age===undefined||p.age===null){p.age=blankAge(g,p);}
    const a=p.age;if(!isObj(a)||!Object.hasOwn(AGE_TIERS,a.tier))bad('tier');
    if(!Number.isFinite(a.score)||a.score<0||a.score>100000)bad('score');a.archivedScore??=0;if(!Number.isFinite(a.archivedScore)||a.archivedScore<0||a.archivedScore>1e8)bad('archived score');
    if(a.counts===undefined||a.counts===null)a.counts={};
    if(!isObj(a.counts)||Object.entries(a.counts).some(([k,n])=>!Object.hasOwn(CAPS,k)||!isInt(n,0,100000)))bad('counts');
    a.moments=validMoments(a.moments,40,turn,'moments');
    if(a.bonuses===undefined||a.bonuses===null)a.bonuses=[];
    if(!Array.isArray(a.bonuses)||a.bonuses.length>countOf(a.tier)||new Set(a.bonuses).size!==a.bonuses.length||a.bonuses.some(k=>AGE_BONUSES[k]?.tier!==poolOf(a.tier)))bad('bonuses');
    if(a.pending===undefined)a.pending=null;
    if(a.pending!==null){const pd=a.pending,pool=Object.entries(AGE_BONUSES).filter(([,b])=>b.tier===poolOf(pd?.tier)).map(([k])=>k);
      if(!isObj(pd)||pd.tier!==a.tier||pd.count!==countOf(pd.tier)||!Array.isArray(pd.options)||!pd.options.length||new Set(pd.options).size!==pd.options.length||pd.options.some(k=>!pool.includes(k))||pd.options.length<pd.count
        ||!isInt(pd.deadline,1,turn+10)||!isInt(pd.index,0,10001)||a.bonuses.length)bad('pending');
      pd.era??=Math.min(8,civilizationEra(p));if(!isInt(pd.era,0,8))bad('pending era');
      if(pd.options.some(k=>AGE_BONUSES[k].generation===2)){
        const expected=dedicationOptions(pd.tier,pd.era);if(pd.options.length!==4||pd.options.some(k=>!expected.includes(k)))bad('pending era pool');
      }else if(pd.options.length>4)pd.options=pd.options.slice(0,4);  // One-time legacy pending migration; selected bonuses are untouched.
    }
    if(a.objectiveProgress===undefined||a.objectiveProgress===null)a.objectiveProgress={points:0,seen:[]};
    const op=a.objectiveProgress,goal=AGE_BONUSES[a.bonuses[0]]?.objective;
    if(!isObj(op)||!isInt(op.points,0,goal?.cap||0)||!Array.isArray(op.seen)||op.seen.length>(goal?.cap||0)||new Set(op.seen).size!==op.seen.length||op.seen.some(k=>typeof k!=='string'||k.length>200)||op.points<op.seen.length||(op.points>0&&!op.seen.length))bad('objective progress');
    if(a.era===undefined||a.era===null)a.era=civilizationEra(p);if(!isInt(a.era,0,20))bad('era');
    if(a.allies===undefined||a.allies===null)a.allies=[];
    if(!Array.isArray(a.allies)||new Set(a.allies).size!==a.allies.length||a.allies.some(id=>!isInt(id,0,g.players.length-1)||id===p.id))bad('allies');
    a.religion??=!!p.religion;if(typeof a.religion!=='boolean')bad('religion');
    a.space??=p.spaceStage||0;if(!isInt(a.space,0,100))bad('space');
    if(a.history===undefined||a.history===null)a.history=[];
    if(!Array.isArray(a.history)||a.history.length>24)bad('history');
    for(const h of a.history){if(!isObj(h)||!isInt(h.index,0,10000)||!Object.hasOwn(AGE_TIERS,h.tier)||!Number.isFinite(h.score)||h.score<0)bad('history');h.moments=validMoments(h.moments,10,turn,'history moments');}
    p.ageEffects=computeEffects(a.tier,a.bonuses);  // derived, recomputed idempotently
  }
  return A;
}

export function computeEffects(tier,bonuses){const e={...(AGE_TIERS[tier]?.effects||{})};for(const k of bonuses){for(const [x,n] of Object.entries(AGE_BONUSES[k]?.effects||{}))e[x]=Math.round(((e[x]||0)+n)*1000)/1000;}return e;}
function weights(p){const f=p.focus||'balanced',s=p.strategy||'adaptive',w={science:1,culture:1,gold:1,production:1,food:.8,faith:.6,combat:.8,tourism:.5,housing:.6,xpMultiplier:.4,upgradeDiscount:.3,congressVotes:.4,builderCharges:.4};
  const boost={science:['science'],culture:['culture','tourism'],gold:['gold'],growth:['food','housing'],industry:['production','builderCharges'],military:['combat','xpMultiplier','upgradeDiscount'],naval:['combat','production'],faith:['faith','culture']}[f]||[];for(const k of boost)w[k]=(w[k]||1)+1.2;
  if(/war|conquest|military/.test(s)){w.combat+=1;w.xpMultiplier+=.5;}if(Object.values(p.relations||{}).some(r=>r.status==='war')){w.combat+=.8;}return w;}
export function autoPick(p,tier,count,g=null,options=p.age?.pending?.options||dedicationOptions(tier,civilizationEra(p))){const pool=poolOf(tier),w=weights(p);
  const cities=g?g.cities.filter(c=>c.owner===p.id):[],units=g?g.units.filter(u=>u.owner===p.id&&u.hp>0):[],war=Object.values(p.relations||{}).some(r=>r.status==='war'),queued=cities.map(c=>c.production?.item).filter(Boolean);
  const stressed=(p.militaryArrears||0)>0||(p.gold||0)<30;if(stressed)w.gold+=3;
  const ranked=options.filter(k=>AGE_BONUSES[k]?.tier===pool).map(k=>{const b=AGE_BONUSES[k];let v=0;for(const [x,n] of Object.entries(b.effects)){const scale=['combat','housing','congressVotes','builderCharges','missionaryCharges','tradeCapacity'].includes(x)?.12:1;let utility=w[x]??.5;
      if(/Production$/.test(x)){const kind=x.slice(0,-10);const fits=queued.filter(item=>kind==='military'?UNITS[item]&&!UNITS[item].civilian:kind==='naval'?UNITS[item]?.domain==='sea':kind==='district'?BUILDINGS[item]?.kind==='district':kind==='project'?['research','festival','prayer','satellite','moon','colony'].includes(item):item===kind).length;utility=.3+fits/Math.max(1,cities.length)*2;}
      if(x==='xpMultiplier')utility=war?1.5:.3;if(x==='upgradeDiscount')utility=units.length?1:.1;v+=utility*n*scale;}
    if(g){for(const c of cities){const local=ageCityBonuses(g,p,c,[b]);for(const [k,n]of Object.entries(local.flat))v+=(w[k]??.5)*n*.04/Math.max(1,cities.length);for(const [k,n]of Object.entries(local.multipliers))v+=(w[k]??.5)*n/Math.max(1,cities.length);}
      for(const r of b.units||[])v+=r.combat*.035*(war?1.6:.2)*Math.min(1,units.filter(u=>!UNITS[u.type].civilian&&(r.when!=='siegeAttack'||UNITS[u.type].siege)).length/3);
      if(b.objective){const e=b.objective.events,potential={ownTech:p.research?3:1,ownCivic:p.civic?3:1,city:units.some(u=>u.type==='settler')?2:.1,improvement:units.some(u=>u.type==='builder')?4:.2,route:units.filter(u=>u.type==='trader').length,foreignRoute:units.filter(u=>u.type==='trader').length*.7,greatperson:p.focus==='faith'?1.5:.5,conquest:war?1.5:0,alliance:Object.values(p.relations||{}).filter(r=>r.status==='peace').length*.2,space:p.spaceStage>0?1:0};
        for(const item of queued){const base=baseItem(item),kind=BUILDINGS[item]?.kind;potential[base]=(potential[base]||0)+1;if(kind)potential[kind]=(potential[kind]||0)+1;if(UNITS[item]&&!UNITS[item].civilian){potential.military=(potential.military||0)+1;if(UNITS[item].domain==='sea')potential.naval=(potential.naval||0)+1;}}
        v+=Math.min(b.objective.cap,Object.entries(e).reduce((n,[key,pts])=>n+pts*(potential[key]||0),0))*.12;
      }
    }return [k,v];}).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));
  return ranked.slice(0,count).map(([k])=>k);}
function apply(p,items){const a=p.age;a.bonuses=items;a.pending=null;a.objectiveProgress={points:0,seen:[]};p.ageEffects=computeEffects(a.tier,items);p.planRevision=(p.planRevision||0)+1;}

export function chooseAgeBonus(g,p,items){ensureAges(g);const a=p.age,pd=a?.pending;if(!pd)throw new Error('当前没有待选择的时代加成。');
  if(!Array.isArray(items)||items.length!==pd.count||new Set(items).size!==items.length||items.some(k=>!pd.options.includes(k)))throw new Error(`请从可选加成中选择 ${pd.count} 项。`);
  apply(p,items.slice());}

export function ageTurn(g,{event}={}){
  const A=ensureAges(g),emit=event||(()=>{});
  // moments from new world events since last period
  const fresh=(g.events||[]).filter(e=>e.id>=A.lastEventId);A.lastEventId=g.eventId??A.lastEventId;
  for(const e of fresh){const p=g.players[e.player];if(!p?.alive||!p.age)continue;
    if(e.type==='greatperson'&&/加入了/.test(e.text))award(g,p,'greatperson',e.text,emit);
    else if(e.type==='conquest'&&/占领了/.test(e.text))award(g,p,'conquest',e.text,emit,CAPS.conquest);}
  for(const c of g.cities)if(c.id>A.lastCityId){const p=g.players[c.originalOwner];if(p?.alive&&p.age&&c.owner===c.originalOwner)award(g,p,'city',`建立 ${c.name}`,emit,CAPS.city);}
  A.lastCityId=Math.max(A.lastCityId,...g.cities.map(c=>c.id));
  for(const [k,w] of Object.entries(g.wonders||{}))if(!A.wonders.includes(k)){A.wonders.push(k);const p=g.players[w.owner];if(p?.alive&&p.age)award(g,p,'wonder',`奇观落成：${k}`,emit);}
  for(const p of g.players){if(!p.alive||!p.age)continue;const a=p.age;
    for(const k of p.techs||[])if(!A.knownTech[k]){A.knownTech[k]=1;award(g,p,'tech',k,emit,CAPS.tech);}
    for(const k of p.civics||[])if(!A.knownCivic[k]){A.knownCivic[k]=1;award(g,p,'civic',k,emit,CAPS.civic);}
    const era=civilizationEra(p);while(a.era<era){a.era++;if(!A.eraFirst[a.era]){A.eraFirst[a.era]=1;award(g,p,'eraFirst',String(a.era),emit);}else award(g,p,'era',String(a.era),emit);}
    if(p.religion&&!a.religion){a.religion=true;award(g,p,'religion','创立宗教',emit);}
    if((p.spaceStage||0)>a.space){a.space=p.spaceStage;award(g,p,'space','太空计划阶段',emit);}
    for(const [id,r] of Object.entries(p.relations||{}))if(r.status==='alliance'&&!a.allies.includes(+id)){a.allies.push(+id);award(g,p,'alliance',String(id),emit);}
    a.allies=a.allies.filter(id=>p.relations?.[id]?.status==='alliance');
    if(a.pending&&g.turn>=a.pending.deadline)apply(p,autoPick(p,a.pending.tier,a.pending.count,g));
  }
  // age boundary
  if(g.turn-A.startTurn<A.length)return;
  const {dark,golden}=ageThresholds(A.index);
  for(const p of g.players){if(!p.alive||!p.age)continue;const a=p.age;
    if(a.pending)apply(p,autoPick(p,a.pending.tier,a.pending.count,g));
    const tier=a.score>=golden?(a.tier==='dark'?'heroic':'golden'):a.score<dark?'dark':'normal';
    a.history.push({index:A.index,tier:a.tier,score:a.score,moments:a.moments.slice(0,10)});if(a.history.length>24)a.archivedScore=(a.archivedScore||0)+a.history.shift().score;
    const count=countOf(tier),era=Math.min(8,civilizationEra(p)),options=dedicationOptions(tier,era);
    a.tier=tier;a.score=0;a.counts={};a.moments=[];a.bonuses=[];p.ageEffects=computeEffects(tier,[]);
    a.objectiveProgress={points:0,seen:[]};a.pending={tier,count,options,era,deadline:g.turn+3,index:A.index+1};
    if(!p.manual)apply(p,autoPick(p,tier,count,g));
    emit(g,'age',`${p.short} 进入${AGE_TIERS[tier].name}。`,p.id);
  }
  A.index++;A.startTurn=g.turn;
}

export function agesView(g){const A=g.ages,N=A?.length??agePeriods(g),index=A?.index??Math.max(0,Math.floor((g.turn-1)/N)),start=A?.startTurn??1+index*N;return {index,startTurn:start,length:N,nextTurn:start+N,thresholds:ageThresholds(index)};}
export function ageView(p,full){const a=p.age;if(!a)return {tier:'normal'};if(!full)return {tier:a.tier};const b=AGE_BONUSES[a.bonuses[0]];return {tier:a.tier,score:a.score,moments:a.moments.slice(0,24),bonuses:a.bonuses,pending:a.pending,objective:b?.objective?{points:a.objectiveProgress?.points||0,cap:b.objective.cap,label:b.objective.label}:null,history:a.history.map(h=>({index:h.index,tier:h.tier,score:h.score,moments:h.moments})),effects:p.ageEffects||{}};}
