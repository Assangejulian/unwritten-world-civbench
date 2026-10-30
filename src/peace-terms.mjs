import {villageSupplies} from './encounters.mjs';
import {heritageRouteGold} from './heritage.mjs';
import {BUILDINGS,traditionIndex} from './rules.mjs';
import {operationalBuilding} from './leader-events.mjs';
import {initializeTerritories,transferCityTerritory} from './territory.mjs';
import {geopoliticalPressure,strategicBalance} from './geopolitics.mjs';
import {UNITS,RESOURCES,dist} from './rules.mjs';
import {committedMilitaryUpkeep} from './military-economy.mjs';

export const PEACE_RULES={envoyLimit:3,envoyCooldown:200,proposalSeconds:200,maxGold:5000,maxCities:3,maxTradeShare:40,maxTotalShare:60,minDuration:10,maxDuration:30};
const time=g=>g.realtime?.time??g.turn*20;
const pair=(a,b)=>[Math.min(a,b),Math.max(a,b)];
const active=(g,pact)=>pact.status==='active'&&time(g)>=pact.startsAt&&time(g)<pact.endsAt&&g.players[pact.from]?.alive&&g.players[pact.to]?.alive&&g.players[pact.from].relations[pact.to]?.status!=='war'&&(pact.kind!=='jointWar'||g.players[pact.from].relations[pact.enemy]?.status==='war'&&g.players[pact.to].relations[pact.enemy]?.status==='war');
const validNumber=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
export const jointWarPassage=(g,a,b)=>(g.diplomacy?.pacts||[]).some(p=>p.kind==='jointWar'&&active(g,p)&&(p.from===a&&p.to===b||p.from===b&&p.to===a));

export function normalizeTerms(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('议和条款格式无效。');
 const terms={mode:input.mode??'white',gold:input.gold??0,cities:input.cities??[],tradeShare:input.tradeShare??0,resource:input.resource||null,resourceAmount:input.resourceAmount??0,durationTurns:input.durationTurns??20,message:input.message??''};
 if(!['white','concession','demand','surrender'].includes(terms.mode)||!validNumber(terms.gold,0,PEACE_RULES.maxGold)||!Array.isArray(terms.cities)||terms.cities.length>3||new Set(terms.cities).size!==terms.cities.length||terms.cities.some(id=>!validNumber(id,1,1e9))||!validNumber(terms.tradeShare,0,40)||!validNumber(terms.resourceAmount,0,3)||!validNumber(terms.durationTurns,10,30)||terms.resource!==null&&!RESOURCES[terms.resource]||typeof terms.message!=='string'||terms.message.length>240)throw Error('议和条款超出允许范围。');
 if((terms.resource===null)!==(terms.resourceAmount===0))throw Error('资源及供应数量必须同时指定。');
 if(terms.mode==='white'&&(terms.gold||terms.cities.length||terms.tradeShare||terms.resource))throw Error('无条件停战不能包含赔付。');
 if(terms.mode==='surrender'&&(terms.tradeShare<20||terms.durationTurns<20))throw Error('投降至少承担 20% 贸易分成及 20 个周期的条约。');
 return {...terms,cities:[...terms.cities],message:terms.message.trim()};
}
export const termParties=offer=>offer.terms?.mode==='demand'?{payer:offer.to,recipient:offer.from}:{payer:offer.from,recipient:offer.to};

export function initializePeaceRecords(g){
 const d=g.diplomacy;d.wars??=[];d.pacts??=[];
 if(!Array.isArray(d.wars)||d.wars.length>160||!Array.isArray(d.pacts)||d.pacts.length>64)throw Error('Invalid negotiation records.');
 const keys=new Set(),ids=new Set();
 for(const w of d.wars){const key=w.from+':'+w.to;if(keys.has(key)||!g.players[w.from]||!g.players[w.to]||w.from>=w.to||!validNumber(w.id,1,1e9)||!validNumber(w.uses,0,3)||![w.startedAt,w.nextEnvoyAt].every(n=>Number.isFinite(n)&&n>=0)||w.closedAt!==undefined&&(!Number.isFinite(w.closedAt)||w.closedAt<w.startedAt)||!['active','closed'].includes(w.status))throw Error('Invalid shared envoy campaign.');keys.add(key);}
 for(const p of d.pacts){if(ids.has(p.id)||!validNumber(p.from,0,g.players.length-1)||!validNumber(p.to,0,g.players.length-1)||p.from===p.to||!validNumber(p.id,1,1e9)||![p.startsAt,p.endsAt].every(n=>Number.isFinite(n)&&n>=0)||p.endsAt<=p.startsAt||!validNumber(p.tradeShare,0,40)||!validNumber(p.resourceAmount,0,3)||p.resource!==null&&!RESOURCES[p.resource]||(p.resource===null)!==(p.resourceAmount===0)||typeof p.surrender!=='boolean'||!['active','ended'].includes(p.status))throw Error('Invalid peace obligation.');ids.add(p.id);}
 for(const p of g.players)if(d.pacts.filter(v=>active(g,v)&&v.from===p.id).reduce((n,v)=>n+v.tradeShare,0)>60)throw Error('Peace obligations exceed the outgoing income limit.');
 for(const a of g.players)for(const b of g.players.filter(b=>b.id>a.id))if(a.relations[b.id]?.status==='war'&&!d.wars.some(w=>w.from===a.id&&w.to===b.id&&w.status==='active')){
  const envoys=g.units.filter(u=>u.type==='envoy'&&[a.id,b.id].includes(u.owner)&&[a.id,b.id].includes(u.envoy?.target));
  const w={id:d.nextId++,from:a.id,to:b.id,status:'active',startedAt:a.relations[b.id].warStartedAt??time(g),uses:Math.min(3,envoys.length),nextEnvoyAt:Math.max(0,...envoys.map(u=>(u.envoy.sentAt||0)+200))};d.wars=d.wars.filter(old=>old.from!==a.id||old.to!==b.id);d.wars.push(w);for(const u of envoys){u.envoy.warId??=w.id;u.envoy.terms??=normalizeTerms();}
 }
 for(const o of d.proposals)if(o.terms){if(!['peace','jointWar'].includes(o.kind))throw Error('Non-negotiation proposal carries terms.');normalizeTerms(o.terms);if(o.kind==='jointWar'&&o.terms.mode!=='concession')throw Error('Invalid joint war compensation.');}
 for(const u of g.units)if(u.type==='envoy'&&u.envoy?.terms)normalizeTerms(u.envoy.terms);
}
export function campaignFor(g,a,b){const [from,to]=pair(a,b);return g.diplomacy?.wars?.find(w=>w.from===from&&w.to===to&&w.status==='active');}
export function startCampaign(g,a,b){const [from,to]=pair(a,b),d=g.diplomacy;d.wars=d.wars.filter(w=>w.from!==from||w.to!==to);const record={id:d.nextId++,from,to,status:'active',startedAt:time(g),uses:0,nextEnvoyAt:time(g)};d.wars.push(record);return record;}
export function envoyBudget(g,a,b){const w=campaignFor(g,a,b);return {warId:w?.id??null,used:w?.uses??0,remaining:w?3-w.uses:0,readyAt:w?.nextEnvoyAt??0,cooldown:Math.max(0,(w?.nextEnvoyAt||0)-time(g))};}

function depositSupply(g,t){const r=RESOURCES[t.resource];if(r?.category!=='strategic')return 1;const city=g.cities.find(c=>c.owner===t.owner&&c.id===t.territoryCity);return 1+(city?Math.max(0,...city.buildings.filter(k=>operationalBuilding(g,city,k)).map(k=>BUILDINGS[k]?.strategicSupply||0)):0);}
export function effectiveSupplies(g,excludeTiles=new Set()){
 const raw=g.players.map(()=>({}));
 for(const t of g.map.tiles){const r=RESOURCES[t.resource],p=g.players[t.owner];if(p&&r&&!excludeTiles.has(t.id)&&!t.pillaged&&t.improvement===r.improvement&&(!r.tech||p.techs.includes(r.tech)||p.civics.includes(r.tech)))raw[p.id][t.resource]=(raw[p.id][t.resource]||0)+depositSupply(g,t);}
 const remaining=raw.map(r=>({...r})),result=raw.map(r=>({...r}));
 for(const pact of g.diplomacy?.pacts||[])if(active(g,pact)&&pact.resource){const n=Math.min(pact.resourceAmount,remaining[pact.from][pact.resource]||0);remaining[pact.from][pact.resource]=(remaining[pact.from][pact.resource]||0)-n;result[pact.from][pact.resource]=(result[pact.from][pact.resource]||0)-n;result[pact.to][pact.resource]=(result[pact.to][pact.resource]||0)+n;}
 for(const pact of g.court?.deals||[])if(pact.status==='active'&&time(g)<pact.endsAt&&g.players[pact.from]?.alive&&g.players[pact.to]?.alive&&g.players[pact.from].relations[pact.to]?.status!=='war')for(const r of pact.resources){const n=Math.min(r.amount,remaining[pact.from][r.key]||0);remaining[pact.from][r.key]=(remaining[pact.from][r.key]||0)-n;result[pact.from][r.key]=(result[pact.from][r.key]||0)-n;result[pact.to][r.key]=(result[pact.to][r.key]||0)+n;}
 for(const p of g.players)for(const [key,n]of Object.entries(villageSupplies(p)))result[p.id][key]=(result[p.id][key]||0)+n;
 return result.map(r=>Object.fromEntries(Object.entries(r).filter(([,n])=>n>0)));
}
export function lendableSupply(g,payer,resource,excluded=new Set()){
 const p=g.players[payer],r=RESOURCES[resource];if(r.tech&&!p.techs.includes(r.tech)&&!p.civics.includes(r.tech))return 0;
 const owned=g.map.tiles.filter(t=>t.owner===payer&&!excluded.has(t.id)&&t.resource===resource&&!t.pillaged&&t.improvement===r.improvement).reduce((n,t)=>n+depositSupply(g,t),0);
 const committed=(g.diplomacy?.pacts||[]).filter(v=>active(g,v)&&v.from===payer&&v.resource===resource).reduce((n,v)=>n+v.resourceAmount,0);const courtCommitted=(g.court?.deals||[]).filter(v=>v.status==='active'&&time(g)<v.endsAt&&v.from===payer&&g.players[v.to]?.alive&&g.players[payer].relations[v.to]?.status!=='war').reduce((n,v)=>n+v.resources.filter(r=>r.key===resource).reduce((v,r)=>v+r.amount,0),0);return Math.max(0,owned-committed-courtCommitted);
}
export function routeGold(g,p,route){const other=g.cities.find(c=>c.id===route.to);if(!other)return 0;return heritageRouteGold(g,p,route,(other.owner===p.id?0:5)+((p.leaderRulesVersion===2?traditionIndex(p)===3:p.id===3)?3:0)+(p.policies.includes('caravans')?3:0)+(p.techs.includes('steam')?2:0)+(p.techs.includes('globalization')?4:0));}
export function tradeIncome(g,p){return g.routes.filter(r=>r.owner===p.id&&g.cities.some(c=>c.id===r.from&&c.owner===p.id)).reduce((n,r)=>n+routeGold(g,p,r),0);}
export function treatyGoldDelta(g,id,{includeIncoming=true}={}){let delta=0;for(const pact of g.diplomacy?.pacts||[])if(active(g,pact)&&(pact.from===id||includeIncoming&&pact.to===id)){const value=Math.round(tradeIncome(g,g.players[pact.from])*pact.tradeShare/10)/10;delta+=pact.to===id?value:-value;}return delta;}

export function cessionTiles(g,ids,payer){
 const owned=g.cities.filter(c=>c.owner===payer),selected=new Set(ids),result=new Set();
 for(const t of g.map.tiles)if(t.owner===payer){if(t.territoryCity!=null){if(selected.has(t.territoryCity))result.add(t.id);continue;}if(t.cityId!==null&&t.cityId!==undefined){if(selected.has(t.cityId))result.add(t.id);continue;}let closest=null,distance=Infinity;for(const c of owned){const d=dist(t,g.map.tiles[c.tile],g.map);if(d<distance||d===distance&&c.id<closest.id){closest=c;distance=d;}}if(distance<=3&&selected.has(closest?.id))result.add(t.id);}
 for(const c of owned.filter(c=>selected.has(c.id)))for(const d of c.districts||[])if(g.map.tiles[d.tile]?.owner===payer)result.add(d.tile);
 return result;
}
export function validateTerms(g,offer,{accept=false}={}){
 const terms=normalizeTerms(offer.terms),{payer,recipient}=termParties({...offer,terms});
 if(offer.kind==='jointWar'&&terms.mode!=='concession')throw Error('求援只能提供本国补偿，不能索取赔付或要求投降。');
 if(!g.players[payer]?.alive||!g.players[recipient]?.alive)throw Error('条约中的国家已不存在。');
 if(terms.cities.some(id=>{const c=g.cities.find(c=>c.id===id);return !c||c.owner!==payer||c.isCapital||g.players.some(p=>p.capital===id)||!accept&&payer!==offer.from&&!g.players[offer.from].knownCities?.[id];}))throw Error('割让城池必须为已知的非首都城市，且仍属于赔付方。');
 if(g.cities.filter(c=>c.owner===payer).length<=terms.cities.length)throw Error('条约须保留赔付方至少一座城市。');
 if(accept||payer===offer.from){
  const senderFee=accept?0:10;if(g.players[payer].gold<terms.gold+senderFee)throw Error('赔付方当前金币不足。');
  const commitments=(g.diplomacy?.pacts||[]).filter(p=>active(g,p)),share=commitments.filter(p=>p.from===payer).reduce((n,p)=>n+p.tradeShare,0);if(share+terms.tradeShare>60)throw Error('现有与新增贸易分成合计不能超过 60%。');if((terms.tradeShare||terms.resource||terms.mode==='surrender'||offer.kind==='jointWar')&&commitments.length>=64)throw Error('现有条约数量已达上限。');
  if(terms.resource&&lendableSupply(g,payer,terms.resource,cessionTiles(g,terms.cities,payer))<terms.resourceAmount)throw Error('割城及现有条约扣除后，本土资源供应不足；借入资源不能转供。');
 }
 return terms;
}

function militaryContext(g,p,other){
 const own=g.units.filter(u=>u.owner===p.id&&!UNITS[u.type].civilian),seen=g.units.filter(u=>u.owner===other.id&&!UNITS[u.type].civilian&&p.visible.includes(u.tile));
 const balance=strategicBalance(g,p,other);
 return {own,seen,ratio:balance.powerRatio,empireRatio:balance.empireRatio,confidence:balance.confidence,uncertain:seen.length===0};
}
export function recommendedTerms(g,p,to){
 const ctx=militaryContext(g,p,g.players[to]);
 if(ctx.ratio<.8||p.warWeariness>=18)return normalizeTerms({mode:'concession',gold:Math.min(80,Math.max(0,Math.floor((p.gold-10)*.12))),tradeShare:10,message:'愿以赔付结束战争，让双方恢复发展。'});
 if(ctx.ratio>1.6&&!ctx.uncertain){const cities=Object.values(p.knownCities||{}).filter(c=>c.owner===to&&!g.players.some(o=>o.capital===c.id));return normalizeTerms({mode:'demand',gold:80,tradeShare:10,cities:ctx.ratio>2.8&&cities.length?[cities[0].id]:[],message:'停止抵抗并接受条款，双方军队将停止交战。'});}
 return normalizeTerms({message:'提议停止交战，保留双方目前控制的城池。'});
}
export function recommendedAidTerms(g,p){
 const reserve=Math.max(40,committedMilitaryUpkeep(g,p)*6+(p.militaryArrears||0)),available=Math.max(0,p.gold-reserve-10);
 const availableResources={};for(const t of g.map.tiles){const spec=RESOURCES[t.resource];if(t.owner===p.id&&spec&&!t.pillaged&&t.improvement===spec.improvement&&(!spec.tech||p.techs.includes(spec.tech)||p.civics.includes(spec.tech)))availableResources[t.resource]=(availableResources[t.resource]||0)+1;}
 for(const pact of g.diplomacy?.pacts||[])if(active(g,pact)&&pact.from===p.id&&pact.resource)availableResources[pact.resource]=(availableResources[pact.resource]||0)-pact.resourceAmount;
 const resources=Object.entries(availableResources).map(([key,spare])=>({key,spec:RESOURCES[key],spare})).filter(r=>r.spare>=2).sort((a,b)=>(a.spec.category==='luxury'?3:a.spec.category==='bonus'?2:1)-(b.spec.category==='luxury'?3:b.spec.category==='bonus'?2:1)).reverse();
 const resource=resources[0]?.key||null;
 return normalizeTerms({mode:'concession',gold:Math.min(400,Math.floor(Math.min(available,p.gold*.2))),resource,resourceAmount:resource?1:0,tradeShare:0,durationTurns:20,message:'愿提供补偿，请共同对敌作战。'});
}
export function peaceAssessment(g,p,offer){
 const other=g.players[offer.from],ctx=militaryContext(g,p,other),t=offer.terms||normalizeTerms(),{payer}=termParties({...offer,terms:t}),capital=g.cities.find(c=>c.id===p.capital&&c.owner===p.id),wars=Object.values(p.relations).filter(r=>r.status==='war').length;
 const injury=ctx.own.length?ctx.own.filter(u=>u.hp<50).length/ctx.own.length:1,threat=capital?ctx.seen.filter(u=>dist(g.map.tiles[u.tile],g.map.tiles[capital.tile],g.map)<=3).length:0;
 const geopolitics=geopoliticalPressure(g,p,other);
 let score=-18-(geopolitics.nearbyWeakRival&&ctx.ratio>1.1?45:0)+(p.warWeariness||0)*2+injury*65+(ctx.own.length<4?32:0)+Math.max(0,wars-1)*20+threat*8+(capital?Math.max(0,150-capital.hp)*.3:30)+(ctx.ratio<.85?25:ctx.ratio>1.8?-25:0)-(p.strategy==='domination'?12:0);
 const leverage=Math.max(0,Math.log2(Math.max(1,ctx.ratio)))*24+Math.max(0,Math.log2(Math.max(1,ctx.empireRatio)))*18;
 score-=Math.min(100,leverage);
 const value=Math.min(240,80*Math.log1p(t.gold/Math.max(50,p.gold*.15)))+t.cities.reduce((n,id)=>{const c=g.cities.find(c=>c.id===id),population=c?.owner===p.id||p.visible.includes(c?.tile)?c?.population:p.cityAppearances?.[id]?.population;return n+32+(population||1)*2;},0)+t.tradeShare*(payer===p.id?.6+Math.min(1,tradeIncome(g,p)/25):1)+t.resourceAmount*12+(t.mode==='surrender'?35:0);
 score+=payer===p.id?-value:value;
 let payable=true;try{validateTerms(g,{...offer,terms:t},{accept:true});}catch{payable=false;}
 return {accept:payable&&score>=8,payable,score:Math.round(score),advantage:Math.round(leverage),compensation:Math.round(value),reason:!payable?'目前无法兑现条款。':score>=8?payer===p.id?'战线压力与国内疲劳已高于继续作战的收益。':'补偿与恢复发展的收益足以接受停战。':payer===p.id?'赔付与领土要求超过本国能够接受的代价。':'军事与综合实力优势尚未得到足够补偿，继续作战更有利。'};
}

export function fulfillTerms(g,offer){
 initializeTerritories(g);const t=validateTerms(g,offer,{accept:true}),{payer,recipient}=termParties({...offer,terms:t}),tiles=cessionTiles(g,t.cities,payer),d=g.diplomacy;
 // All prerequisites are checked before any gold, territory or treaty changes.
 g.players[payer].gold-=t.gold;g.players[recipient].gold+=t.gold;
 for(const id of tiles){const tile=g.map.tiles[id];tile.owner=recipient;if(tile.fort)tile.fort.owner=recipient;}
 for(const id of t.cities){const c=g.cities.find(c=>c.id===id);c.owner=recipient;transferCityTerritory(g,c,recipient);c.production=null;c.activity=null;c.occupation=0;c.loyalty=Math.max(70,c.loyalty);c.worked=(c.worked||[]).filter(id=>g.map.tiles[id].owner===recipient);for(const w of Object.values(g.wonders).filter(w=>w.city===id))w.owner=recipient;}
 for(const c of g.cities)c.worked=(c.worked||[]).filter(id=>g.map.tiles[id].owner===c.owner);
 g.routes=g.routes.filter(r=>g.cities.find(c=>c.id===r.from)?.owner===r.owner);
 if(t.tradeShare||t.resource||t.mode==='surrender'||offer.kind==='jointWar'){
  const pact={id:d.nextId++,from:payer,to:recipient,tradeShare:t.tradeShare,resource:t.resource,resourceAmount:t.resourceAmount,surrender:t.mode==='surrender',startsAt:time(g),endsAt:time(g)+t.durationTurns*20,status:'active',proposal:offer.id};
  if(offer.kind==='jointWar')Object.assign(pact,{kind:'jointWar',enemy:offer.enemy});
  d.pacts=d.pacts.filter(p=>p.status==='active'||time(g)-p.endsAt<400).slice(-63);d.pacts.push(pact);
  if(pact.surrender)for(const [a,b]of [[payer,recipient],[recipient,payer]])g.players[a].relations[b].truceUntil=Math.max(g.players[a].relations[b].truceUntil||0,pact.endsAt);
 }
 offer.terms=t;offer.cityNames=t.cities.map(id=>({id,name:g.cities.find(c=>c.id===id).name}));
}
export function expirePacts(g){for(const p of g.diplomacy?.pacts||[])if(p.status==='active'&&!active(g,p)){p.status='ended';if(p.kind==='jointWar')for(const u of g.units)if(u.owner===p.from&&g.map.tiles[u.tile].owner===p.to||u.owner===p.to&&g.map.tiles[u.tile].owner===p.from){const other=g.map.tiles[u.tile].owner,r=g.players[u.owner].relations[other];if(r.status==='peace'&&!r.openBorders)u.borderExitOwner=other;}}}
export function negotiationOptions(g,p,supplies=effectiveSupplies(g)){return {player:p.id,budgets:g.players.filter(o=>o.id!==p.id&&p.met.includes(o.id)&&p.relations[o.id]?.status==='war').map(o=>({other:o.id,...envoyBudget(g,p.id,o.id),recommended:recommendedTerms(g,p,o.id)})),cities:g.cities.filter(c=>c.owner===p.id&&!c.isCapital&&!g.players.some(p=>p.capital===c.id)).map(c=>({id:c.id,name:c.name,owner:c.owner})),knownCities:Object.values(p.knownCities||{}).filter(c=>!g.players.some(p=>p.capital===c.id)),resources:supplies[p.id]};}
