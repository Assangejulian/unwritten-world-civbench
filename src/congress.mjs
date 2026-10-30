import {activeGovernor} from './governor-data.mjs';
import {POLICIES,UNITS,leaderFor,nationalEffects,civilizationEra} from './rules.mjs';
import {awardDiplomaticPoints,victoryEnabled} from './victory-rules.mjs';

export const CONGRESS_RULES={interval:40,votingPeriods:4,effectPeriods:20,history:4,maxExtraVotes:10};
export const CONGRESS_TOPICS={
  science:{name:'国际科研协作',description:'所有国家科技 +15%，生产力 -5%，持续 20 个经济周期。',effects:{science:.15,production:-.05}},
  trade:{name:'全球贸易协定',description:'所有国家城市金币产出 +15%，持续 20 个经济周期。不会取消战争或强制开放边界。',effects:{gold:.15}},
  heritage:{name:'世界文化交流',description:'所有国家文化 +15%、旅游 +10%，持续 20 个经济周期。',effects:{culture:.15,tourism:.1}},
  relief:{name:'民生重建计划',description:'所有国家食物 +15%，军事单位生产 -10%，持续 20 个经济周期。',effects:{food:.15,militaryProduction:-.1}}
};
export const extraVoteCost=n=>5*n*(n+1);
const ballot=v=>typeof v==='string'?{choice:v,extra:0,cost:0}:v;
export function initializeCongress(g){
 g.congress??={version:1,sequence:0,nextTurn:g.turn+40,current:null,resolutions:[],history:[]};
 for(const c of [g.congress.current,...g.congress.history].filter(Boolean))for(const a of c.agenda)for(const [id,v]of Object.entries(a.ballots))a.ballots[id]=ballot(v);
 return g.congress;
}
export function congressEffects(g){const effects={};for(const r of g.congress?.resolutions||[])if(r.expires>g.turn)for(const [key,n]of Object.entries(CONGRESS_TOPICS[r.topic]?.effects||{}))effects[key]=(effects[key]||0)+n;return effects;}
export function diplomaticFavorIncome(g,p,suzerain=()=>null){
 const time=g.realtime?.time??g.turn*20;
 const tiers={chiefdom:0,republic:1,oligarchy:1,autocracy:1,merchant:2,monarchy:2,theocracy:2,democracy:3,communism:3,fascism:3,digital:4,synthetic:4};
 const government=tiers[p.government]||0,cityStates=(g.cityStates?.states||[]).filter(s=>suzerain(g,s)===p.id).length;
 const alliances=Object.entries(p.relations).filter(([id,r])=>g.players[id]?.alive&&r.status==='alliance'&&r.allianceUntil>time).reduce((n,[,r])=>n+Math.min(3,1+Math.floor((r.alliancePoints||0)/30)),0);
 const occupiedCapitals=g.players.filter(o=>o.id!==p.id&&o.capital!==null&&g.cities.find(c=>c.id===o.capital)?.owner===p.id).length,occupation=occupiedCapitals?-5*occupiedCapitals:0;
 return {government,cityStates,alliances,occupation,total:government+cityStates+alliances+occupation};
}
export function settleDiplomaticFavor(g,suzerain){for(const p of g.players)if(p.alive)p.diplomaticFavor=Math.min(1e7,Math.max(0,(p.diplomaticFavor||0)+diplomaticFavorIncome(g,p,suzerain).total));}
function votePreference(g,p,topic){
 const wars=Object.values(p.relations).filter(r=>r.status==='war').length,units=g.units.filter(u=>u.owner===p.id&&!UNITS[u.type].civilian),wounded=units.filter(u=>u.hp<65).length,cities=g.cities.filter(c=>c.owner===p.id),goal=p.strategy==='adaptive'?p.focus:p.strategy,bonuses=leaderFor(p).effects||{};
 let score=1;
 if(topic==='science')score+=['science','scientific'].includes(goal)?6:0,score-=wars?4:0,score+=(bonuses.science||0)*5;
 if(topic==='trade')score+=p.gold<100?5:1,score+=['gold','commerce','economy','diplomacy'].includes(goal)?5:0,score+=(bonuses.gold||0)*5;
 if(topic==='heritage')score+=['culture','diplomacy'].includes(goal)?6:0,score+=(bonuses.culture||0)*5;
 if(topic==='relief')score+=cities.some(c=>c.food<5)||wounded>units.length*.35?5:0,score-=wars&&wounded<units.length*.25?6:0;
 return score>0?'support':score<0?'oppose':'abstain';
}
function recommend(g,p,c,a,budget){
 let choice=votePreference(g,p,a.topic),target;
 if(a.topic==='leadership'){
  const leader=c.participants.filter(id=>g.players[id].alive&&id!==p.id).sort((a,b)=>(g.players[b].diplomaticPoints||0)-(g.players[a].diplomaticPoints||0)||a-b)[0];
  const threat=leader!==undefined&&(g.players[leader].diplomaticPoints||0)>=14;
  choice=threat?'lose':'gain';target=threat?leader:p.id;
 }
 const goal=p.strategy==='diplomacy',desired=a.topic==='leadership'?goal||choice==='lose'?4:2:goal?2:1;
 let extra=0;while(extra<desired&&extraVoteCost(extra+1)<=budget)extra++;
 if(choice==='abstain')extra=0;
 return {type:'voteCongress',congress:c.id,topic:a.topic,choice,...(target!==undefined?{target}:{}),extra,hint:{votes:c.weights[p.id]+extra,favorCost:extraVoteCost(extra),utility:a.topic==='leadership'?160:80}};
}
export function congressActions(g,p){
 const c=g.congress?.current;if(!c||c.closesTurn<=g.turn||!p.alive||!c.participants.includes(p.id))return [];
 let budget=p.diplomaticFavor||0;return c.agenda.filter(a=>a.ballots[p.id]===undefined).map(a=>{const v=recommend(g,p,c,a,budget);budget-=v.hint.favorCost;return v;});
}
// The player menu enumerates legal choices; native recommendations stay separate.
export function congressPlayerActions(g,p){
 const c=g.congress?.current;if(!c||c.closesTurn<=g.turn||!p.alive||!c.participants.includes(p.id))return [];
 const actions=[];
 for(const a of c.agenda.filter(a=>a.ballots[p.id]===undefined)){
  actions.push({type:'voteCongress',congress:c.id,topic:a.topic,choice:'abstain',extra:0,hint:{votes:c.weights[p.id],favorCost:0,currency:'diplomaticFavor'}});
  const lead=a.topic==='leadership',targets=lead?c.participants.filter(id=>g.players[id].alive):[undefined];
  for(const choice of lead?['gain','lose']:['support','oppose'])for(const target of targets)for(let extra=0;extra<=CONGRESS_RULES.maxExtraVotes&&extraVoteCost(extra)<=(p.diplomaticFavor||0);extra++){
   actions.push({type:'voteCongress',congress:c.id,topic:a.topic,choice,...(target===undefined?{}:{target}),extra,hint:{votes:c.weights[p.id]+extra,favorCost:extraVoteCost(extra),currency:'diplomaticFavor'}});
  }
 }
 return actions;
}
function commit(g,p,c,agenda,a){
 const extra=a.extra??0,choices=agenda.topic==='leadership'?['gain','lose','abstain']:['support','oppose','abstain'];
 if(!choices.includes(a.choice)||!Number.isInteger(extra)||extra<0||extra>CONGRESS_RULES.maxExtraVotes||a.choice==='abstain'&&extra!==0||agenda.topic==='leadership'&&a.choice!=='abstain'&&(!Number.isInteger(a.target)||!c.participants.includes(a.target)||!g.players[a.target].alive))throw Error('大会投票选项无效。');
 if(agenda.ballots[p.id]!==undefined)throw Error('本项议题已经投票。');
 const cost=extraVoteCost(extra);if(cost>(p.diplomaticFavor||0))throw Error('外交支持不足。');
 p.diplomaticFavor-=cost;agenda.ballots[p.id]={choice:a.choice,extra,cost,...(agenda.topic==='leadership'&&a.choice!=='abstain'?{target:a.target}:{})};
}
export function castCongressVote(g,p,a){
 const c=g.congress?.current,agenda=c?.agenda.find(x=>x.topic===a.topic);
 if(!c||c.id!==a.congress||!c.participants.includes(p.id)||!p.alive||g.turn>=c.closesTurn||!agenda)throw Error('大会投票无效或已经截止。');
 commit(g,p,c,agenda,a);
}
function resolveAgenda(g,c,a,event){
 const eligible=c.participants.filter(id=>g.players[id].alive),lead=a.topic==='leadership',sides=lead?['gain','lose']:['support','oppose'],tally=Object.fromEntries([...sides,'abstain'].map(k=>[k,0]));
 let total=0;
 for(const id of eligible){const v=ballot(a.ballots[id]),weight=c.weights[id]+(v?.extra||0);total+=weight;tally[v?.choice||'abstain']+=weight;}
 const cast=tally[sides[0]]+tally[sides[1]],quorum=total>0&&cast>=Math.ceil(total/2),choice=quorum&&tally[sides[0]]!==tally[sides[1]]?(tally[sides[0]]>tally[sides[1]]?sides[0]:sides[1]):null;
 let target=null;
 if(lead&&choice){
  const targets=new Map();for(const id of eligible){const v=ballot(a.ballots[id]);if(v?.choice===choice&&eligible.includes(v.target)){const n=targets.get(v.target)||{votes:0,nations:0};n.votes+=c.weights[id]+v.extra;n.nations++;targets.set(v.target,n);}}
  target=[...targets].sort((a,b)=>b[1].votes-a[1].votes||b[1].nations-a[1].nations||a[0]-b[0])[0]?.[0]??null;
  if(target!==null)awardDiplomaticPoints(g,g.players[target],choice==='gain'?2:-2,'congress:'+c.id+':leadership:target','世界领袖决议');
 }
 const passed=choice===sides[0]&&(!lead||target!==null);Object.assign(a,{tally,passed,result:{choice,target,quorum}});
 if(!lead&&passed)g.congress.resolutions.push({congress:c.id,topic:a.topic,expires:g.turn+20});
 for(const id of eligible){const v=ballot(a.ballots[id]);if(!v||v.choice==='abstain')continue;const won=choice!==null&&v.choice===choice&&(!lead||v.target===target);
  if(won)awardDiplomaticPoints(g,g.players[id],1,'congress:'+c.id+':'+a.topic+':'+id,'大会同案投票');
  else if(v.cost){const refund=lead&&v.choice===choice?Math.floor(v.cost/2):v.cost;g.players[id].diplomaticFavor=Math.min(1e7,g.players[id].diplomaticFavor+refund);v.refund=refund;}
 }
 event(g,'congress',lead?`世界领袖决议：${choice&&target!==null?(choice==='gain'?'授予':'扣除')+'匿名代表团 #'+(target+1)+' 2 点外交胜利积分':'未形成有效结果'}。`:`国际大会：${CONGRESS_TOPICS[a.topic].name}${passed?'通过':'未通过'}（赞成 ${tally.support} / 反对 ${tally.oppose} / 弃权 ${tally.abstain}）。`,null);
}
export function congressTurn(g,event){
 const state=initializeCongress(g);state.resolutions=state.resolutions.filter(r=>r.expires>g.turn);const current=state.current;
 if(current&&g.turn>=current.closesTurn){
  for(const id of current.participants){const p=g.players[id];if(p.alive&&!p.manual)for(const a of current.agenda)if(a.ballots[id]===undefined)commit(g,p,current,a,recommend(g,p,current,a,p.diplomaticFavor||0));}
  for(const a of current.agenda)resolveAgenda(g,current,a,event);
  state.history.unshift({...current,finishedTurn:g.turn});state.history=state.history.slice(0,4);state.current=null;
 }
 if(!state.current&&g.turn>=state.nextTurn){
  state.nextTurn=g.turn+40;const participants=g.players.filter(p=>p.alive&&g.cities.some(c=>c.owner===p.id)).map(p=>p.id);if(participants.length<2)return;
  const id=++state.sequence,keys=Object.keys(CONGRESS_TOPICS),start=((id-1)*2)%keys.length,topics=[keys[start],keys[(start+1)%keys.length]];
  if(victoryEnabled(g,'diplomacy')&&participants.some(id=>civilizationEra(g.players[id])>=5))topics.push('leadership');
  state.current={id,openedTurn:g.turn,closesTurn:g.turn+4,participants,weights:Object.fromEntries(participants.map(id=>[id,Math.min(8,1+(activeGovernor(g,g.players[id],'gov_diplomat','aa')?2:0)+(nationalEffects(g.players[id],g.realtime?.time??g.turn*20).congressVotes||0)+(g.wonders.potala_palace&&g.cities.some(c=>c.id===g.wonders.potala_palace.city&&c.owner===id)?1:0)+g.players[id].policies.reduce((s,k)=>s+(POLICIES[k]?.congressVotes||0),0))])),agenda:topics.map(topic=>({topic,ballots:{}}))};
  event(g,'congress',`第 ${id} 届国际大会召开，${participants.length} 国代表出席；第 ${g.turn+4} 回合投票截止。`,null);
 }
}
export function congressView(g,view=-1){
 const s=g.congress||{version:1,sequence:0,nextTurn:g.turn+40,current:null,resolutions:[],history:[]};
 return {...s,current:s.current?{...s.current,standings:Object.fromEntries(s.current.participants.map(id=>[id,g.players[id].diplomaticPoints||0])),agenda:s.current.agenda.map(a=>({...a,ballots:view<0?{...a.ballots}:a.ballots[view]===undefined?{}:{[view]:ballot(a.ballots[view])},submitted:Object.keys(a.ballots).length}))}:null};
}
export function validateCongress(g){
 const s=g.congress;if(s===undefined)return;const period=n=>Number.isInteger(n)&&n>=1&&n<=g.turn+60,player=id=>Number.isInteger(id)&&!!g.players[id];
 const validVote=(a,id,raw,c)=>{const v=ballot(raw),lead=a.topic==='leadership';return c.participants.includes(+id)&&v&&typeof v==='object'&&(lead?['gain','lose','abstain']:['support','oppose','abstain']).includes(v.choice)&&Number.isInteger(v.extra)&&v.extra>=0&&v.extra<=10&&v.cost===extraVoteCost(v.extra)&&(v.choice!=='abstain'||v.extra===0)&&(!lead||v.choice==='abstain'||c.participants.includes(v.target))&&(v.refund===undefined||Number.isInteger(v.refund)&&v.refund>=0&&v.refund<=v.cost);};
 const validSession=(c,finished=false)=>c&&Number.isInteger(c.id)&&c.id>0&&c.id<=s.sequence&&period(c.openedTurn)&&period(c.closesTurn)&&c.closesTurn===c.openedTurn+4&&Array.isArray(c.participants)&&c.participants.length>=2&&c.participants.length<=16&&new Set(c.participants).size===c.participants.length&&c.participants.every(player)&&c.weights&&Object.keys(c.weights).length===c.participants.length&&c.participants.every(id=>Number.isInteger(c.weights[id])&&c.weights[id]>=1&&c.weights[id]<=8)&&Array.isArray(c.agenda)&&[2,3].includes(c.agenda.length)&&new Set(c.agenda.map(a=>a.topic)).size===c.agenda.length&&c.agenda.every(a=>(CONGRESS_TOPICS[a.topic]||a.topic==='leadership')&&a.ballots&&typeof a.ballots==='object'&&!Array.isArray(a.ballots)&&Object.entries(a.ballots).every(([id,v])=>validVote(a,id,v,c)))&&(!finished||period(c.finishedTurn));
 if(!s||s.version!==1||!Number.isInteger(s.sequence)||s.sequence<0||!period(s.nextTurn)||s.current&&!validSession(s.current)||!Array.isArray(s.history)||s.history.length>4||s.history.some(c=>!validSession(c,true))||!Array.isArray(s.resolutions)||s.resolutions.length>4||s.resolutions.some(r=>!CONGRESS_TOPICS[r.topic]||!Number.isInteger(r.congress)||r.congress<1||r.congress>s.sequence||!period(r.expires))||new Set(s.resolutions.map(r=>r.topic)).size!==s.resolutions.length)throw Error('Invalid world congress state.');
}
