import {cityHasNaturalWonder,naturalTileProjection} from './natural-wonders.mjs';
import {awardDiplomaticPoints} from './victory-rules.mjs';
import {affiliationError,affiliateReligion,worshipOperational,religionTileYield,independentReligions,religionCapacity} from './religion.mjs';
import {retreatDestination,movementBlocked} from './movement-rules.mjs';
import {improvementTourism} from './rules.mjs';
import {HERITAGE_DESIGN,HERITAGE_WONDERS,GREAT_PEOPLE,GREAT_PERSON_CLASSES} from './heritage-data.mjs';
import {UNITS,BUILDINGS,IMPROVEMENTS,TECHS,CIVICS,POLICIES,RELIGIONS,POWER_PLANTS,VETERAN_TRAITS,assignPolicyCards,productionCost,canonicalTileKey,dist,isWater,gamePace,civilizationEra} from './rules.mjs';
import {baseItem,hasBuilding,buildingOperational} from './unique-content.mjs';
import {neighbors,tilesInRange,gameRandom,tileYield} from './world.mjs';

export {HERITAGE_WONDERS,GREAT_PEOPLE,GREAT_PERSON_CLASSES};
const people=new Map(GREAT_PEOPLE.map(p=>[p.key,p]));
export function heritageUnitIdentity(u){const p=people.get(u.greatPerson);return p?{greatPersonClass:p.classKey,greatPersonName:p.name}:{};}
const wonders=new Map(HERITAGE_WONDERS.map(w=>[w.key,w]));
const classes=new Map(GREAT_PERSON_CLASSES.map(c=>[c.key,c]));
export const HERITAGE_COMMANDER_STACKING='highest';
const unitLists=new WeakMap();
function heritageUnits(g){let value=unitLists.get(g);if(!value||value.source!==g.units||value.length!==g.units.length){value={source:g.units,length:g.units.length,units:g.units.filter(u=>UNITS[u.type]?.heritage)};unitLists.set(g,value);}return value.units;}
const time=g=>g.realtime?.time??g.turn*20;
const ownCities=(g,p)=>g.cities.filter(c=>c.owner===p.id);
const alive=u=>u.hp>0;
const empty=()=>({points:{},passed:[],owned:[],retired:[],effects:{}});

// This feature version is deliberately independent of historical leader rules.
export function initializeHeritage(g){
 const upgrading=!g.heritage;
 g.heritage??={version:1,recruited:{},skipped:[],allPassed:{},works:[],nextWork:1};
 if(g.heritage.version!==1)throw Error('Unsupported heritage version.');
 for(const p of g.players){p.greatPeople??=empty();if(p.politics)p.politics.suspendedCards??=[];}
 normalizeWonderState(g);
 if(upgrading){g.heritage.legacyOrders={};for(const c of g.cities)if(['pyramids','greatlibrary','colosseum','oracle','observatory','forbidden','eiffel','oxford'].includes(c.production?.item))g.heritage.legacyOrders[c.id]={owner:c.owner,item:c.production.item,tile:c.production.tile};}
}
export function normalizeWonderState(g){
 // Completed wonders survive warfare. Retire obsolete repair orders on load.
 for(const w of Object.values(g.wonders)){w.birthGranted??=true;const tile=g.map.tiles[w.tile];if(tile)tile.pillaged=false;}
 for(const c of g.cities)if(c.production?.repair&&wonders.has(c.production.item)&&g.wonders[c.production.item]?.city===c.id){c.storedProduction=(c.storedProduction||0)+c.production.progress;c.production=null;}
 if(g.realtime?.queues)for(const [owner,queue]of Object.entries(g.realtime.queues))g.realtime.queues[owner]=queue.filter(q=>q.action.type!=='repairWonder');
}
export function legacyWonderOrder(g,p,c,key,tile){const legacy=g.heritage?.legacyOrders?.[c.id];return !!legacy&&legacy.owner===p.id&&legacy.item===key&&legacy.tile===tile&&c.production?.item===key&&c.production.tile===tile;}
export function reconcileHeritagePolicies(g){for(const p of g.players){if(!p.politics||!Array.isArray(p.policies))continue;const pending=p.politics.suspendedCards||[];if(!Array.isArray(pending)||pending.length>Object.keys(POLICIES).length||new Set(p.policies).size!==p.policies.length||[...p.policies,...pending].some(k=>!POLICIES[k]||!p.civics.includes(POLICIES[k].civic)))throw Error('Invalid political policy state.');const all=[...new Set([...p.policies,...pending])],assignment=assignPolicyCards(g,p,all);p.policies=all.filter(k=>!assignment.remaining.includes(k));p.politics.suspendedCards=assignment.remaining;}}
export function operationalWonder(g,key,owner){const w=g.wonders[key],c=w&&g.cities.find(c=>c.id===w.city);return !!w&&!!c&&c.owner===owner;}
export function wonderEffects(g,p){const result={};for(const w of HERITAGE_WONDERS)if(operationalWonder(g,w.key,p.id))for(const [key,value]of Object.entries(w.passiveEffects||{}))if(typeof value==='number')result[key]=(result[key]||0)+value;return result;}
function operational(g,c,key){return key==='palace'?c.isCapital:buildingOperational(g,c,key,BUILDINGS);}
export function greatPersonRate(g,p,classKey){
 const cls=classes.get(classKey);if(!cls)return 0;
 let n=0;
 for(const c of ownCities(g,p))for(const source of cls.pointSources){
  if(source.type==='wonder'){if(g.wonders[source.key]?.city===c.id&&operationalWonder(g,source.key,p.id))n+=source.points;}
  else if(operational(g,c,source.key)){n+=source.points;if(source.type==='district'&&operationalWonder(g,'oracle',p.id)&&g.wonders.oracle.city===c.id)n++;}
 }
 if(p.pantheon==='divine_spark'){const district={scientist:'campus',prophet:'holy',writer:'theater'}[classKey];if(district)n+=ownCities(g,p).filter(c=>operational(g,c,district)).length;}
 const pointField='great'+classKey[0].toUpperCase()+classKey.slice(1)+'Points';
 for(const wonder of HERITAGE_WONDERS)if(!cls.pointSources.some(source=>source.type==='wonder'&&source.key===wonder.key)&&operationalWonder(g,wonder.key,p.id))n+=wonder.passiveEffects?.[pointField]||0;
 return n;
}
export function greatPersonCandidate(g,classKey){
 const era=Math.max(0,...g.players.filter(p=>p.alive).map(civilizationEra));
 return GREAT_PEOPLE.find(p=>p.classKey===classKey&&!g.heritage.recruited[p.key]&&!g.heritage.skipped.includes(p.key)&&p.era<=era);
}
export function recruitmentTerms(g,p,key){
 const person=people.get(key);if(!person||greatPersonCandidate(g,person.classKey)?.key!==key)return null;
 const threshold=Math.round(person.baseThreshold*gamePace(g).factor),points=p.greatPeople.points[person.classKey]||0,remaining=Math.max(0,threshold-points);
 return {threshold,points,gold:Math.round(remaining*4.5),faith:Math.round(remaining*(operationalWonder(g,'oracle',p.id)?2.25:3)),passed:p.greatPeople.passed.includes(key)};
}
export function workSlots(g,c){
 const result=[];
 const add=(host,spec)=>{for(const [type,count]of Object.entries(spec||{}))for(let i=0;i<count;i++)result.push({id:`${c.id}:${host}:${type}:${i}`,city:c.id,host,type,active:operational(g,c,host)});};
 for(const [host,spec]of Object.entries(HERITAGE_DESIGN.greatWorkSlotRules.buildingSlots))if(host==='palace'?c.isCapital:hasBuilding(c,host))add(host,spec);
 for(const [host,w]of Object.entries(g.wonders))if(w.city===c.id){const effects=wonders.get(host)?.passiveEffects||{},inferred=Object.fromEntries([['Writing','writing'],['Art','art'],['Music','music'],['Relic','relic']].map(([label,type])=>[type,effects['greatWork'+label+'Slots']||0]));add(host,{...inferred,...HERITAGE_DESIGN.greatWorkSlotRules.wonderSlots[host]});for(const s of result.filter(s=>s.host===host))s.active=operationalWonder(g,host,c.owner);}
 if(c.worship==='cathedral')result.push({id:c.id+':cathedral:religious:0',city:c.id,host:'cathedral',type:'religious',active:worshipOperational(g,c)});
 return result;
}
function vacantSlot(g,c,type){return workSlots(g,c).find(s=>s.active&&(s.type===type||s.type==='wildcard'||s.type==='religious'&&['art','relic'].includes(type))&&!g.heritage.works.some(w=>w.slot===s.id||w.transfer?.slot===s.id));}
export function greatWorkYields(g,c){
 const y={};for(const slot of workSlots(g,c).filter(s=>s.active))for(const w of g.heritage?.works||[])if(w.slot===slot.id&&!w.transfer)for(const k of ['culture','faith','tourism'])y[k]=(y[k]||0)+(w[k]||0)*(k==='tourism'&&g.players[c.owner].techs.includes('radio')?2:1);return y;
}
export function heritageView(g,p,includeCatalogue=false){
 const candidates=GREAT_PERSON_CLASSES.map(c=>{const candidate=greatPersonCandidate(g,c.key);return {classKey:c.key,key:candidate?.key,...(candidate?recruitmentTerms(g,p,candidate.key):{}),rate:greatPersonRate(g,p,c.key),points:p.greatPeople.points[c.key]||0};});
 return {version:1,...(includeCatalogue?{catalogue:GREAT_PEOPLE.map(v=>({...v,category:v.classKey,description:v.effectDescription,history:v.historicalBiography}))}:{}),candidates,owned:p.greatPeople.owned,retired:p.greatPeople.retired,works:g.heritage.works.filter(w=>g.cities.some(c=>c.id===w.city&&c.owner===p.id)),slots:ownCities(g,p).flatMap(c=>workSlots(g,c))};
}
function spawnLocation(g,p,sea){if(g.units.length>=2000)return;for(const city of ownCities(g,p)){const tile=[g.map.tiles[city.tile],...tilesInRange(g.map,g.map.tiles[city.tile],2)].find(t=>t.owner===p.id&&t.terrain!=='mountain'&&isWater(t)===sea&&!g.units.some(u=>alive(u)&&u.tile===t.id));if(tile)return {city,tile};}}
export function recruitGreatPerson(g,p,key,currency,ctx){
 const person=people.get(key),terms=recruitmentTerms(g,p,key);if(!terms||terms.passed)throw Error('此伟人当前不可招募。');
 if(currency&&!['gold','faith'].includes(currency))throw Error('Invalid patronage currency.');
 if(!currency&&terms.points<terms.threshold)throw Error('伟人点数不足。');
 if(currency&&(!Number.isFinite(p[currency])||p[currency]<terms[currency]))throw Error('赞助资源不足。');
 const location=spawnLocation(g,p,person.classKey==='admiral');if(!location)throw Error('没有可供伟人到达的位置。');const {tile,city}=location;
 if(currency)p[currency]-=terms[currency];
 p.greatPeople.points[person.classKey]=Math.max(0,terms.points-terms.threshold);
 const u=ctx.addUnit(g,p.id,person.classKey==='admiral'?'great_admiral':'great_person',tile.id);
 u.greatPerson=key;u.recruitmentCity=city.id;u.charges=person.charges+(person.classKey==='engineer'&&operationalWonder(g,'halicarnassus',p.id)?1:0);u.activations=0;
 p.greatPeople.owned.push({key,unit:u.id});g.heritage.recruited[key]={owner:p.id,turn:g.turn,city:city.id};
 ctx.event(g,'greatperson',`${person.name} 加入了 ${p.short}。`,p.id,u.tile);return u;
}
export function passGreatPerson(g,p,key){const person=people.get(key),terms=recruitmentTerms(g,p,key);if(!terms||terms.passed)throw Error('此伟人当前不可放弃。');p.greatPeople.points[person.classKey]=Math.max(0,terms.points-Math.ceil(terms.threshold*.2));p.greatPeople.passed.push(key);}
export function heritagePeriod(g,ctx){
 initializeHeritage(g);
 for(const p of g.players.filter(p=>p.alive))for(const cls of GREAT_PERSON_CLASSES)p.greatPeople.points[cls.key]=(p.greatPeople.points[cls.key]||0)+greatPersonRate(g,p,cls.key);
 for(const cls of GREAT_PERSON_CLASSES){const candidate=greatPersonCandidate(g,cls.key);if(!candidate)continue;const all=g.players.filter(p=>p.alive).every(p=>p.greatPeople.passed.includes(candidate.key));if(all){g.heritage.allPassed[candidate.key]??=g.turn;if(g.turn-g.heritage.allPassed[candidate.key]>=2)g.heritage.skipped.push(candidate.key);}else delete g.heritage.allPassed[candidate.key];}
 for(const w of g.heritage.works)if(w.transfer&&time(g)>=w.transfer.arrives){const c=g.cities.find(c=>c.id===w.transfer.city),slot=c&&workSlots(g,c).find(s=>s.id===w.transfer.slot);if(c&&slot){w.city=c.id;w.slot=slot.id;}delete w.transfer;}
 for(const w of Object.values(g.wonders)){const c=g.cities.find(c=>c.id===w.city);if(c)w.owner=c.owner;}
 if(ctx)g.heritage.pendingGrants=(g.heritage.pendingGrants||[]).filter(v=>{const p=g.players[v.owner],c=g.cities.find(c=>c.id===v.city&&c.owner===v.owner);if(!c||!p?.alive)return false;const u=grantUnit(g,p,c,v.type,ctx,v.carrier);if(u&&v.copy){Object.assign(u,structuredClone(v.copy),{isDuplicated:true});}return !u;});
}
export function moveGreatWork(g,p,workId,slotId){
 const work=g.heritage.works.find(w=>w.id===workId),source=work&&g.cities.find(c=>c.id===work.city),slot=ownCities(g,p).flatMap(c=>workSlots(g,c)).find(s=>s.id===slotId);
 if(!source||source.owner!==p.id||work.transfer||!slot?.active||slot.type!==work.type&&slot.type!=='wildcard'&&!(slot.type==='religious'&&['art','relic'].includes(work.type))||g.heritage.works.some(w=>w.slot===slotId||w.transfer?.slot===slotId))throw Error('巨作目标槽位不可用。');
 work.transfer={city:slot.city,slot:slot.id,arrives:time(g)+20};
}
export function validWonderPlacement(g,p,c,key,t){
 const spec=wonders.get(key);if(!spec||!t)return false;const r=spec.placement,adjacent=neighbors(g.map,t);
 if(r.requiresDistrictBuilding&&!r.requiresAdjacentDistrict&&!operational(g,c,r.requiresDistrictBuilding))return false;
 if(t.owner!==p.id||t.cityId!==null||t.district||t.fort||dist(t,g.map.tiles[c.tile],g.map)>r.maxCityDistance)return false;
 if(!r.validTerrains.includes(t.terrain)||t.terrain!=='mountain'&&r.hill!==null&&r.hill!==undefined&&!!t.hill!==r.hill||r.requiresRiver&&!t.river)return false;
 const district=key=>adjacent.some(t=>t.owner===p.id&&t.district&&baseItem(t.district.item)===key&&!t.pillaged&&g.cities.some(c=>c.id===t.district.city&&c.owner===p.id&&(!r.requiresDistrictBuilding||operational(g,c,r.requiresDistrictBuilding))));
 if(r.requiresAdjacentDistrict&&!district(r.requiresAdjacentDistrict))return false;
 if(r.requiresAdjacentResource&&!adjacent.some(t=>t.resource===r.requiresAdjacentResource))return false;
 if(r.requiresAdjacentFeature&&!adjacent.some(t=>t.feature===r.requiresAdjacentFeature||t.terrain===r.requiresAdjacentFeature))return false;
 if(r.requiresAdjacentAny?.length&&!r.requiresAdjacentAny.some(v=>v.type==='district'?district(v.key):adjacent.some(t=>t.feature===v.key||t.terrain===v.key||v.key==='hill'&&t.hill)))return false;
 if(r.requiresAdjacentLand&&!adjacent.some(t=>!isWater(t)&&t.terrain!=='mountain'))return false;
 if(r.requiresAdjacentCityCenter&&!adjacent.some(t=>g.cities.some(c=>c.tile===t.id&&c.owner===p.id)))return false;
 if(r.requiresWaterTransit&&(key==='golden_gate'?adjacent.filter(t=>!isWater(t)&&t.terrain!=='mountain').length<2:adjacent.filter(isWater).length<2))return false;
 return true;
}
export function heritageActions(g,p){
 const actions=[];for(const cls of GREAT_PERSON_CLASSES){const person=greatPersonCandidate(g,cls.key);if(!person)continue;const terms=recruitmentTerms(g,p,person.key);if(terms.passed)continue;if(terms.points>=terms.threshold&&spawnLocation(g,p,cls.key==='admiral'))actions.push({type:'recruitGreatPerson',item:person.key});for(const currency of ['gold','faith'])if(p[currency]>=terms[currency]&&spawnLocation(g,p,cls.key==='admiral'))actions.push({type:'patronizeGreatPerson',item:person.key,currency});actions.push({type:'passGreatPerson',item:person.key});}
 for(const u of g.units.filter(u=>u.owner===p.id&&u.greatPerson&&alive(u)&&!u.activity&&!u.acted&&u.moves>0)){
  for(const c of ownCities(g,p).filter(c=>dist(g.map.tiles[c.tile],g.map.tiles[u.tile],g.map)<=1)){
   const person=people.get(u.greatPerson),targets=['general','admiral'].includes(person.classKey)?g.units.filter(t=>t.owner===p.id&&alive(t)&&!UNITS[t.type].civilian&&dist(g.map.tiles[t.tile],g.map.tiles[u.tile],g.map)<=1).map(t=>t.id):[undefined];
   for(const target of new Set([...targets,undefined])){const a={type:'activateGreatPerson',unit:u.id,city:c.id,...(target!==undefined?{targetUnit:target}:{})};if(person.recipeParams.freeReligionFounding&&!p.religion&&independentReligions(g).length>=religionCapacity(g)){for(const parent of independentReligions(g)){const b={...a,religionParent:parent.id};if(!activationError(g,p,u,b))actions.push(b);}}else if(person.recipeParams.freeReligionFounding&&!p.religion){for(const religion of Object.keys(RELIGIONS).filter(k=>!g.players.some(p=>p.religion===k))){const b={...a,religion};if(!activationError(g,p,u,b))actions.push(b);}}else if(!activationError(g,p,u,a))actions.push(a);}
  }
  if(['general','admiral'].includes(people.get(u.greatPerson)?.classKey))for(const target of g.units.filter(t=>t.owner===p.id&&alive(t)&&!UNITS[t.type].civilian&&dist(g.map.tiles[t.tile],g.map.tiles[u.tile],g.map)<=1)){const a={type:'activateGreatPerson',unit:u.id,targetUnit:target.id};if(!activationError(g,p,u,a))actions.push(a);}
 }
 return actions;
}
export function heritageDestinations(g,p,u){
 const person=people.get(u.greatPerson);if(!person)return [];
 if(['general','admiral'].includes(person.classKey))return g.units.filter(t=>t.owner===p.id&&alive(t)&&retirementTargetMatches(person,t)).map(t=>({tile:t.tile,range:1}));
 const religion=Object.keys(RELIGIONS).find(k=>!g.players.some(p=>p.religion===k));
 return ownCities(g,p).filter(c=>!activationError(g,p,{...u,tile:c.tile,moves:3,acted:false,activity:undefined},{city:c.id,religion})).map(c=>({tile:c.tile,range:1}));
}
export function heritageAuraCombat(g,u,defending,opponent,viewer=null){const s=UNITS[u.type],tile=g.map.tiles[u.tile],foe=UNITS[opponent?.type];return Math.max(0,...eligibleCommanderAuras(g,u,viewer).map(a=>{let n=a.combatStrength||0;if(s.class==='cavalry')n+=a.cavalryCombatBonus||0;if(defending){n+=(a.defenseBonus||0)+(s.domain==='sea'?a.navalArmorBonus||0:0);if(tile.fort?.owner===u.owner&&tile.fort.hp>0)n+=a.fortressDefenseBonus||0;if(s.siege||['tank','modernarmor'].includes(baseItem(u.type)))n+=a.siegeArmorBonus||0;if(tile.owner===u.owner)n+=a.homeTerritoryBonus||0;}if(foe&&!foe.civilian&&!foe.ranged&&!foe.siege&&foe.class!=='cavalry'&&!['sea','air'].includes(foe.domain))n+=a.antiInfantryCombatBonus||0;return n;}));}
export function repairWonder(){throw Error('奇观建成后永久保留，无需修复。');}

export function validateHeritage(g){
 if(!g.heritage){initializeHeritage(g);return;}
 const h=g.heritage,object=v=>!!v&&typeof v==='object'&&!Array.isArray(v),number=(v,max=1e9)=>Number.isFinite(v)&&v>=0&&v<=max,integer=v=>Number.isSafeInteger(v)&&v>=0;
 if(h.version!==1||!Array.isArray(h.works)||h.works.length>500||!object(h.recruited)||!object(h.allPassed)||!Array.isArray(h.skipped)||h.skipped.length>GREAT_PEOPLE.length||new Set(h.skipped).size!==h.skipped.length||h.skipped.some(k=>!people.has(k)||h.recruited[k])||!integer(h.nextWork)||h.nextWork<1)throw Error('Invalid heritage state.');
 for(const [key,value]of Object.entries(h.recruited))if(!people.has(key)||!object(value)||!g.players[value.owner]||!integer(value.turn)||value.turn>g.turn||value.city!==undefined&&!integer(value.city))throw Error('Invalid recruited Great Person.');
 for(const [key,value]of Object.entries(h.allPassed))if(!people.has(key)||!integer(value)||value>g.turn)throw Error('Invalid passed candidate clock.');
 const effects=entity=>{if(entity?.heritageEffects===undefined)return;if(!object(entity.heritageEffects)||Object.keys(entity.heritageEffects).length>GREAT_PEOPLE.length*4)throw Error('Invalid heritage effects.');for(const [key,values]of Object.entries(entity.heritageEffects))if(!key||key.length>128||!object(values)||Object.entries(values).some(([k,n])=>['__proto__','prototype','constructor'].includes(k)||!number(n,k==='until'?1e9:10000)))throw Error('Invalid heritage effect values.');};
 for(const p of g.players){const s=p.greatPeople;if(!object(s)||!object(s.points)||!Array.isArray(s.owned)||!Array.isArray(s.retired)||!Array.isArray(s.passed)||s.owned.length>GREAT_PEOPLE.length||s.retired.length>GREAT_PEOPLE.length||s.passed.length>GREAT_PEOPLE.length||new Set(s.passed).size!==s.passed.length||s.passed.some(k=>!people.has(k))||Object.entries(s.points).some(([k,n])=>!classes.has(k)||!number(n)))throw Error('Invalid Great People state.');
  if(new Set([...s.owned,...s.retired].map(v=>v.key)).size!==s.owned.length+s.retired.length||s.retired.some(v=>!people.has(v.key)||!integer(v.turn)||v.turn>g.turn)||s.owned.some(v=>!people.has(v.key)||!g.units.some(u=>u.id===v.unit&&u.owner===p.id&&u.greatPerson===v.key)))throw Error('Invalid Great Person ownership.');
  for(const key of ['heritageScienceReserve','heritageCultureReserve','heritageEraScore'])if(p[key]!==undefined&&!number(p[key]))throw Error('Invalid gifted reserve.');if(s.moments!==undefined&&(!Array.isArray(s.moments)||s.moments.length>10000||new Set(s.moments).size!==s.moments.length||s.moments.some(k=>typeof k!=='string'||k.length>128)))throw Error('Invalid heritage milestones.');effects(p);
 }
 const live=g.units.filter(u=>UNITS[u.type]?.heritage||u.greatPerson);if(new Set(live.map(u=>u.greatPerson)).size!==live.length)throw Error('Duplicate Great Person entity.');
 for(const u of live){if(u.recruitmentCity!==undefined&&!integer(u.recruitmentCity)||u.returnSequence!==undefined&&!integer(u.returnSequence))throw Error('Invalid Great Person return state.');normalizeGreatPersonHome(g,u);}
 for(const u of live)if(!people.has(u.greatPerson)||!UNITS[u.type]?.heritage||!integer(u.activations)||!Number.isInteger(u.charges)||u.charges<1||u.charges>8||u.activations+u.charges>people.get(u.greatPerson).charges+(people.get(u.greatPerson).classKey==='engineer'?1:0)||u.type!==(people.get(u.greatPerson).classKey==='admiral'?'great_admiral':'great_person')||h.recruited[u.greatPerson]?.owner!==u.owner||!g.players[u.owner]?.greatPeople.owned.some(v=>v.unit===u.id&&v.key===u.greatPerson))throw Error('Invalid Great Person unit.');
 for(const entity of [...g.units,...g.cities])effects(entity);
 for(const u of g.units)if(u.heritageShieldUsed!==undefined&&typeof u.heritageShieldUsed!=='boolean'||u.heritageShieldUntil!==undefined&&!number(u.heritageShieldUntil)||u.isDuplicated!==undefined&&typeof u.isDuplicated!=='boolean')throw Error('Invalid unit heritage trigger.');
 const occupied=new Set();
 for(const w of h.works){const c=g.cities.find(c=>c.id===w.city),slot=c&&workSlots(g,c).find(s=>s.id===w.slot);if(!integer(w.id)||w.id<1||w.id>=h.nextWork||!slot||slot.type!==w.type&&slot.type!=='wildcard'&&!(slot.type==='religious'&&['art','relic'].includes(w.type))||occupied.has(w.slot)||typeof w.title!=='string'||w.title.length>200||!['writing','art','music','relic'].includes(w.type)||!['culture','tourism','faith'].every(k=>w[k]===undefined||number(w[k],100)))throw Error('Invalid Great Work.');occupied.add(w.slot);}
 if(new Set(h.works.map(w=>w.id)).size!==h.works.length)throw Error('Duplicate Great Work.');
 for(const w of h.works)if(w.transfer){const c=g.cities.find(c=>c.id===w.transfer.city),slot=c&&workSlots(g,c).find(s=>s.id===w.transfer.slot);if(!slot||occupied.has(slot.id)||slot.type!==w.type&&slot.type!=='wildcard'&&!(slot.type==='religious'&&['art','relic'].includes(w.type))||!number(w.transfer.arrives))throw Error('Invalid Great Work transfer.');occupied.add(slot.id);}
 if(h.pendingGrants!==undefined&&(!Array.isArray(h.pendingGrants)||h.pendingGrants.length>128))throw Error('Invalid gifted unit queue.');
 for(const v of h.pendingGrants||[]){if(!g.players[v.owner]||!g.cities.some(c=>c.id===v.city)||!UNITS[v.type]||UNITS[v.type].heritage)throw Error('Invalid gifted unit.');if(v.copy){const allowed=['level','xp','training','veteranTraits','innateTraits','heritageEffects','movementBonus'];if(!object(v.copy)||Object.keys(v.copy).some(k=>!allowed.includes(k))||['level','xp','training','movementBonus'].some(k=>v.copy[k]!==undefined&&!number(v.copy[k]))||['veteranTraits','innateTraits'].some(k=>v.copy[k]!==undefined&&(!Array.isArray(v.copy[k])||v.copy[k].length>8||v.copy[k].some(k=>!VETERAN_TRAITS[k]))))throw Error('Invalid naval copy template.');effects(v.copy);}}
 for(const [id,v]of Object.entries(h.legacyOrders||{}))if(!g.cities.some(c=>c.id===+id)||!g.players[v.owner]||!wonders.has(v.item)||!integer(v.tile)||!g.map.tiles[v.tile])throw Error('Invalid legacy wonder order.');
 for(const r of g.routes)if(r.path!==undefined&&(!Array.isArray(r.path)||r.path.length>256||r.path.some(id=>!integer(id)||!g.map.tiles[id])))throw Error('Invalid trade corridor.');
}

function addEffect(entity,key,effects,until){if(!Object.keys(effects).length)return;entity.heritageEffects??={};if(entity.heritageEffects[key]&&!until)return;entity.heritageEffects[key]={...effects,...(until?{until}:{})};}
export function heritageEffects(g,entity){const result={},commanders={};for(const [source,value]of Object.entries(entity?.heritageEffects||{})){if(value.until!==undefined&&value.until<=time(g))continue;const commander=['general','admiral'].includes(people.get(source.split(':')[0])?.classKey);for(const [key,n]of Object.entries(value))if(typeof n==='number'&&key!=='until'){if(commander)commanders[key]=Math.max(commanders[key]||0,n);else result[key]=(result[key]||0)+n;}}for(const [key,n]of Object.entries(commanders))result[key]=(result[key]||0)+n;return result;}
const add=(a,k,n)=>{if(n)a[k]=(a[k]||0)+n;};
export function heritageTileModifiers(g,c){const p=g.players[c.owner];return {local:heritageEffects(g,c),empire:heritageEffects(g,p),petra:g.wonders.petra?.city===c.id&&operationalWonder(g,'petra',p.id),chichen:g.wonders.chichen_itza?.city===c.id&&operationalWonder(g,'chichen_itza',p.id),ruhr:g.wonders.ruhr_valley?.city===c.id&&operationalWonder(g,'ruhr_valley',p.id)};}
export function heritageTileYield(t,base,mods){const y={...base},e=mods.empire,l=mods.local;if(mods.petra&&t.terrain==='desert'&&t.feature!=='floodplain'){add(y,'food',2);add(y,'production',2);add(y,'gold',2);}if(mods.chichen&&t.feature==='jungle'){add(y,'culture',2);add(y,'production',1);}if(t.river){add(y,'production',l.riverProduction);add(y,'gold',l.riverGold);}if(!t.pillaged){if(mods.ruhr&&['mine','quarry'].includes(t.improvement))add(y,'production',2);if(t.improvement==='mine')add(y,'production',e.mineProduction);if(t.improvement&&t.resource==='oil'){add(y,'production',e.oilProduction);add(y,'gold',e.oilGold);}}return y;}
export function heritageCityBonuses(g,c){
 const p=g.players[c.owner],local=heritageEffects(g,c),empire=heritageEffects(g,p),flat=greatWorkYields(g,c),multipliers={};
 for(const key of ['libraryScience','universityScience','universityProduction','campusScience','campusFaith','labScience','workshopCulture','factoryProduction','bankGold','exchangeGold','commercialProduction','holyCulture','holyScience','powerplantProduction','powerplantScience'])add(empire,key,local[key]);
 for(const k of ['food','production','gold','science','culture','faith','tourism']){add(flat,k,local[k]);add(flat,k,empire[k]);add(multipliers,k,local[k+'Multiplier']);add(multipliers,k,empire[k+'Multiplier']);}
 let housing=(local.housing||0)+(empire.housing||0),amenities=(local.amenity||0)+(empire.nationalAmenities||0),loyalty=(local.loyaltyBonus||0)+(empire.loyaltyBonus||0)+(Object.values(p.relations).some(r=>r.status==='war'&&Number.isInteger(r.aggressor)&&r.aggressor!==p.id)?local.defensiveLoyalty||0:0);
 const worked=(c.worked||[]).map(id=>g.map.tiles[id]).filter(t=>t&&!t.pillaged);
 const buildingYield=(key,yieldKey,bonus,multiplier=0)=>{if(!operational(g,c,key))return;add(flat,yieldKey,bonus+(BUILDINGS[c.buildings.find(k=>baseItem(k)===key)]?.yields?.[yieldKey]||0)*multiplier);};
 buildingYield('library','science',empire.libraryScience||0,local.campusBuildingScienceMultiplier||0);
 buildingYield('university','science',empire.universityScience||0,local.campusBuildingScienceMultiplier||0);
 buildingYield('university','production',empire.universityProduction||0);
 buildingYield('campus','science',empire.campusScience||0);
 buildingYield('campus','faith',empire.campusFaith||0);
 buildingYield('lab','science',empire.labScience||0);
 for(const host of POWER_PLANTS){buildingYield(host,'science',empire.powerplantScience||0);buildingYield(host,'production',empire.powerplantProduction||0);}
 if(operational(g,c,'industrial')){add(flat,'science',local.industrialScience);add(flat,'production',local.industrialProduction);}
 add(flat,'production',c.districts.filter(d=>!g.map.tiles[d.tile].pillaged).length*(local.districtProduction||0));
 if(operational(g,c,'harbor'))add(flat,'gold',(empire.harborCityGold||0)+(local.harborCityGold||0));
 buildingYield('workshop','culture',empire.workshopCulture||0);
 buildingYield('factory','production',empire.factoryProduction||0);
 buildingYield('bank','gold',empire.bankGold||0);
 buildingYield('exchange','gold',empire.exchangeGold||0,local.exchangeGoldMultiplier||0);
 buildingYield('commercial','production',empire.commercialProduction||0);
 buildingYield('barracks','culture',(empire.barracksCulture||0)+(local.barracksCulture||0));
 buildingYield('holy','culture',empire.holyCulture||0);buildingYield('holy','science',empire.holyScience||0);
 if(operational(g,c,'commercial'))add(multipliers,'gold',local.commercialGoldMultiplier||0);
 for(const w of HERITAGE_WONDERS){if(!operationalWonder(g,w.key,p.id))continue;const e=w.passiveEffects,here=g.wonders[w.key].city===c.id;
  housing+=(e.empireCityHousingBonus||0)+(e.empireAllCitiesHousingBonus||0);
  amenities+=(e.nationalAmenities||0)+(e.empireCityAmenityBonus||0);
  add(multipliers,'tourism',e.empireTourismMultiplier);add(multipliers,'culture',e.empireCultureMultiplier);add(multipliers,'faith',e.nationalFaithMultiplier);
  if(e.regionalLoyaltyRadius6&&dist(g.map.tiles[c.tile],g.map.tiles[g.wonders[w.key].tile],g.map)<=6)loyalty+=e.regionalLoyaltyRadius6;
  if(e.relicTourismMultiplier)for(const work of g.heritage.works)if(work.city===c.id&&work.type==='relic'&&!work.transfer&&workSlots(g,c).some(s=>s.id===work.slot&&s.active))add(flat,'tourism',work.tourism*(p.techs.includes('radio')?2:1)*e.relicTourismMultiplier);
  if(w.key==='st_peters')for(const host of ['holy','temple'])buildingYield(host,'faith',0,.2);
  if(!here)continue;
  housing+=e.cityHousingBonus||0;amenities+=e.cityAmenityBonus||0;
  for(const k of ['science','production','culture'])add(multipliers,k,e['city'+k[0].toUpperCase()+k.slice(1)+'Multiplier']);
  if(e.adjacentMountainScienceBonus)add(flat,'science',neighbors(g.map,g.map.tiles[c.tile]).filter(t=>t.terrain==='mountain').length*e.adjacentMountainScienceBonus);
  if(e.cityTheaterCultureMultiplier)buildingYield('theater','culture',0,e.cityTheaterCultureMultiplier);
  if(e.cityTheaterAndMuseumCultureMultiplier)for(const host of ['theater','museum'])buildingYield(host,'culture',0,e.cityTheaterAndMuseumCultureMultiplier);
  if(e.cityHolySiteFaithMultiplier)for(const host of ['holy','temple'])buildingYield(host,'faith',0,e.cityHolySiteFaithMultiplier);
  if(e.cityTileImprovementTourismMultiplier)for(const t of worked.filter(t=>t.improvement))add(flat,'tourism',(religionTileYield(g,p,t,heritageTileYield(t,tileYield(t,p),heritageTileModifiers(g,c))).tourism||0)*e.cityTileImprovementTourismMultiplier);
 }
 return {flat,multipliers,housing,amenities,loyalty};
}
export function heritageProductionMultiplier(g,c,work){const e=heritageEffects(g,c),p=heritageEffects(g,g.players[c.owner]);return 1+(work?.item&&wonders.has(work.item)?e.wonderProductionMultiplier||0:0)+(UNITS[work?.item]&&!UNITS[work.item].civilian?Math.max(p.militaryProductionMultiplier||0,e.militaryProductionMultiplier||0):0)+(work?.item&&['satellite','moon','colony'].includes(work.item)?(p.spaceRaceProductionMultiplier||0)+(e.spaceRaceProductionMultiplier||0):0);}
function freeTechs(g,p,count,eras,ctx){for(let i=0;i<count;i++){const eligible=Object.entries(TECHS).filter(([key,t])=>!p.techs.includes(key)&&(!eras||eras.includes(t.era))&&(t.requires||[]).every(k=>p.techs.includes(k)));if(!eligible.length)break;const [key]=eligible[Math.floor(gameRandom(g)*eligible.length)];p.techs.push(key);delete p.researchProgress[key];if(p.research===key)p.research=null;ctx.event(g,'science',`${p.short} 获得科技：${TECHS[key].name}。`,p.id);}}
function grantUnit(g,p,c,type,ctx,carrierId){const domain=UNITS[type]?.domain;if(!UNITS[type])throw Error('Unknown granted unit.');if(g.units.length>=2000)return null;const carrier=g.units.find(u=>(carrierId!==undefined?u.id===carrierId:dist(g.map.tiles[c.tile],g.map.tiles[u.tile],g.map)<=2)&&u.owner===p.id&&alive(u)&&!u.activity&&UNITS[u.type].airCapacity>g.units.filter(t=>t.carrierId===u.id&&alive(t)).length);if(domain==='air'&&carrier){const u=ctx.addUnit(g,p.id,type,carrier.tile);u.carrierId=carrier.id;return u;}const t=[g.map.tiles[c.tile],...tilesInRange(g.map,g.map.tiles[c.tile],2)].find(t=>t.owner===p.id&&t.terrain!=='mountain'&&(domain==='sea'?isWater(t):domain==='air'?t.district?.item==='airport'&&!t.pillaged:!isWater(t))&&!g.units.some(u=>alive(u)&&u.tile===t.id));return t?ctx.addUnit(g,p.id,type,t.id):null;}
export function heritageCompleted(g,p,c,key,ctx){
 if(operationalWonder(g,'taj_mahal',p.id)&&(wonders.has(key)||BUILDINGS[key]?.kind==='district')){p.greatPeople.moments??=[];const moment=c.id+':'+key;if(!p.greatPeople.moments.includes(moment)){p.greatPeople.moments.push(moment);p.gold+=15;p.heritageCultureReserve=(p.heritageCultureReserve||0)+15;p.heritageEraScore=(p.heritageEraScore||0)+2;}}
 const spec=wonders.get(key),w=g.wonders[key];if(!spec||!w||w.birthGranted)return;w.birthGranted=true;const e=spec.instantGrants;if(e.diplomaticPoints)awardDiplomaticPoints(g,p,e.diplomaticPoints,'wonder:'+key,spec.name);
 p.gold+=(e.gold||0)+Math.min(e.treasuryPercentageCap??Infinity,p.gold*(e.treasuryPercentageBonus||0));p.faith+=e.faith||0;p.envoys=Math.min(100,(p.envoys||0)+(e.envoys||0));
 if(e.empireAllCitiesPopulationBonus)for(const city of ownCities(g,p))city.population+=e.empireAllCitiesPopulationBonus;
 if(e.allCurrentLandUnitsFreePromotion)for(const u of g.units)if(u.owner===p.id&&alive(u)&&!UNITS[u.type].civilian&&!['sea','air'].includes(UNITS[u.type].domain)){u.level++;u.xp=Math.max(u.xp,u.level*25);}
 for(const free of e.freeUnits||[])for(let i=0;i<free.count;i++)if(!grantUnit(g,p,c,free.unitType,ctx)){g.heritage.pendingGrants??=[];g.heritage.pendingGrants.push({owner:p.id,city:c.id,type:free.unitType});}
 if(e.randomEurekas){const eligible=Object.keys(TECHS).filter(k=>TECHS[k].era<=1&&!p.techs.includes(k)&&!p.boosts.includes(k));for(const k of eligible.slice(0,e.randomEurekas))ctx.boost(g,p,k);}
 if(e.renaissanceScienceEurekas)for(const [k,t]of Object.entries(TECHS))if([3,4].includes(t.era)&&!p.techs.includes(k))ctx.boost(g,p,k);
 if(e.freeTechs)freeTechs(g,p,e.freeTechs,[civilizationEra(p)],ctx);
 if(e.freeRandomCivicAtomicEra)for(const [k,v]of Object.entries(CIVICS).filter(([k,v])=>v.era===6&&!p.civics.includes(k)&&!p.inspirations.includes(k)).slice(0,e.freeRandomCivicAtomicEra))ctx.inspire(g,p,k);for(const city of ownCities(g,p))city.loyalty=Math.max(city.loyalty,heritageLoyaltyFloor(g,city));
}

function targetCity(g,p,u,action){const near=ownCities(g,p).find(c=>c.id===action.city&&dist(g.map.tiles[c.tile],g.map.tiles[u.tile],g.map)<=1);if(near||action.city!==undefined)return near;const spec=people.get(u.greatPerson);if(!['general','admiral'].includes(spec?.classKey)||action.targetUnit===undefined||['barracks_district','harbor_district','coastal_city_or_harbor','defending_city_or_unit'].includes(spec.targetRequirement))return;return ownCities(g,p).sort((a,b)=>dist(g.map.tiles[a.tile],g.map.tiles[u.tile],g.map)-dist(g.map.tiles[b.tile],g.map.tiles[u.tile],g.map))[0];}
function retirementTargetMatches(person,target){const s=UNITS[target.type],r=person.targetRequirement;if(s.civilian)return false;if(person.classKey==='admiral'){if(s.domain!=='sea')return false;if(r==='naval_submarine_or_destroyer')return !!s.submarine||['destroyer','assaultship'].includes(baseItem(target.type));if(r==='naval_ironclad_or_cruiser')return ['destroyer','assaultship','battleship','missilecruiser'].includes(baseItem(target.type));if(r==='carrier_or_naval_base')return !!s.airCapacity;return true;}if(['sea','air'].includes(s.domain))return false;const cavalry=s.class==='cavalry',melee=!s.ranged&&!s.siege&&!cavalry;if(r==='cavalry_unit')return cavalry;if(['cavalry_or_melee_unit','cavalry_or_infantry_unit','melee_or_cavalry_unit'].includes(r))return cavalry||melee;if(r==='ranged_or_siege_unit')return !!s.ranged||!!s.siege;if(r==='siege_or_artillery_unit')return !!s.siege;if(r==='tank_or_artillery_unit')return s.siege||['tank','modernarmor','mechanized'].includes(baseItem(target.type));return true;}
export function activationError(g,p,u,action){
 const person=people.get(u?.greatPerson);if(!person||movementBlocked(g,u)||u.owner!==p.id||u.hp<=0||u.charges<1||u.activity||g.realtime&&(u.cooldownUntil||0)>time(g)||u.acted||u.moves<=0)return '此伟人当前无法激活。';
 const c=targetCity(g,p,u,action);if(!c)return '请将伟人移至己方城市附近。';
 const requirement=person.targetRequirement;
 const has=key=>operational(g,c,key),coastal=neighbors(g.map,g.map.tiles[c.tile]).some(isWater),buildingWonder=wonders.has(c.production?.item);
 const conditions={city_with_campus:()=>has('campus'),campus_district:()=>has('campus'),campus_with_university:()=>has('university'),campus_with_lab:()=>has('lab'),adjacent_mountain_or_campus:()=>has('campus')||neighbors(g.map,g.map.tiles[u.tile]).some(t=>t.terrain==='mountain'),natural_wonder_or_coast_campus:()=>has('campus')&&(coastal||cityHasNaturalWonder(g,p,c)),city_center_or_industrial:()=>true,city_with_district:()=>c.districts.some(d=>!g.map.tiles[d.tile].pillaged),river_or_district_tile:()=>g.map.tiles[u.tile].river||c.districts.some(d=>!g.map.tiles[d.tile].pillaged),city_with_library_or_workshop:()=>has('library')||has('workshop'),city_with_wonder_or_industrial:()=>buildingWonder||has('industrial'),city_with_wonder:()=>buildingWonder,industrial_district:()=>has('industrial'),city_with_entertainment_or_industrial:()=>has('entertainment')||has('industrial'),industrial_or_powerplant:()=>has('industrial')||POWER_PLANTS.some(has),city_with_spaceport_or_industrial:()=>has('spaceport')||has('industrial'),city_center:()=>true,commercial_hub:()=>has('commercial'),commercial_or_capital:()=>has('commercial')||c.isCapital,commercial_or_harbor:()=>has('commercial')||has('harbor'),city_with_bank_or_commercial:()=>has('bank')||has('commercial'),oil_city_or_exchange:()=>has('exchange')||g.map.tiles.some(t=>t.owner===p.id&&t.territoryCity===c.id&&t.resource==='oil'),industrial_or_commercial:()=>has('industrial')||has('commercial'),commercial_with_exchange:()=>has('exchange'),barracks_district:()=>has('barracks'),harbor_district:()=>has('harbor'),holy_site_district:()=>has('holy'),holy_site_or_capital:()=>has('holy')||c.isCapital,holy_site_or_campus:()=>has('holy')||has('campus')};
 if(conditions[requirement]&&!conditions[requirement]())return '此城市缺少所需的完好区域或地形。';
 const params=person.recipeParams;
 const requirements={commercial_with_exchange:'exchange',commercial_with_bank:'bank',city_with_library:'library',campus_with_library:'library',campus_with_university:'university',campus_with_lab:'lab',city_with_holy_site:'holy',barracks_district:'barracks',harbor_district:'harbor'};
 if(requirements[requirement]&&!operational(g,c,requirements[requirement]))return '此城市缺少所需的完好建筑。';
 if(params.workType&&!vacantSlot(g,c,params.workType))return '此城已无可用对应巨作槽位，请将伟人转移至有空槽的城市。';
 if(params.relicGrant&&!vacantSlot(g,c,'relic'))return '此城没有可用的圣物槽位。';
 if(params.freeReligionFounding&&!p.religion&&action.religionParent!==undefined){const error=affiliationError(g,p,action.religionParent,c,{free:true});if(error)return error;}
 if(params.freeReligionFounding&&!p.religion&&action.religionParent===undefined&&(independentReligions(g).length>=religionCapacity(g)||!RELIGIONS[action.religion]||g.players.some(p=>p.religion===action.religion)))return '没有可供此行动创立的宗教名额。';
 if(params.wonderProductionRush&&!wonders.has(c.production?.item))return '请先在此城开始建造奇观。';
 const cityAlternative={carrier_or_naval_base:()=>has('harbor')||has('airport'),airfield_or_military_unit:()=>has('airport'),harbor_or_naval_unit:()=>has('harbor'),land_military_unit_or_barracks:()=>has('barracks'),coastal_barracks_or_unit:()=>coastal&&has('barracks'),naval_unit_or_coastal_city:()=>coastal,coastal_city_or_harbor:()=>coastal||has('harbor')};
 if(action.targetUnit===undefined&&cityAlternative[requirement]&&!cityAlternative[requirement]())return '此城市缺少所需的完好军事基地或海岸。';
 if(['general','admiral'].includes(person.classKey)&&!requirement.includes('harbor')&&!requirement.includes('city')&&!requirement.includes('district')&&!cityAlternative[requirement]){
  const t=g.units.find(t=>t.id===action.targetUnit&&t.owner===p.id&&alive(t)&&!UNITS[t.type].civilian&&(person.classKey==='admiral'?UNITS[t.type].domain==='sea':!['sea','air'].includes(UNITS[t.type].domain))&&dist(g.map.tiles[t.tile],g.map.tiles[u.tile],g.map)<=1);if(!t)return '请选择相邻的己方作战单位。';
 }
 if(['general','admiral'].includes(person.classKey)&&action.targetUnit!==undefined){const target=g.units.find(t=>t.id===action.targetUnit&&t.owner===p.id&&alive(t)&&dist(g.map.tiles[t.tile],g.map.tiles[u.tile],g.map)<=1);if(!target||!retirementTargetMatches(person,target))return '此作战单位不符合伟人的退役条件。';}
 return null;
}
export function activateGreatPerson(g,p,action,ctx){
 const u=g.units.find(u=>u.id===action.unit),error=activationError(g,p,u,action);if(error)throw Error(error);
 const person=people.get(u.greatPerson),c=targetCity(g,p,u,action),v=person.recipeParams,key=person.key,target=g.units.find(t=>t.id===action.targetUnit&&t.owner===p.id),empire={},city={},unit={},area={};
 const duration=v.durationCycles??person.runtimeRules?.durationCycles,until=duration?time(g)+duration*20:undefined;
 const route=(parameter,effect,value,fallback)=>{if(!value)return;if(parameter==='barracksInitialXpBonus'&&person.key==='qi_jiguang')effect='infantryInitialXp';const scope=person.effectScopes?.[parameter]||fallback;if(scope==='activation_city')add(city,effect,value);else if(scope==='empire')add(empire,effect,value);else if(scope==='target_unit')add(unit,effect,value);else {area[scope]??={};add(area[scope],effect,value);}};
 // Validate slot and all target prerequisites before consuming resources or charges.
 if(v.freeReligionFounding&&!p.religion&&action.religionParent===undefined){const available=Object.keys(RELIGIONS).filter(k=>!g.players.some(p=>p.religion===k));if(!available.includes(action.religion)||independentReligions(g).length>=religionCapacity(g))throw Error('请选择仍可创立的宗教。');}
 if(v.relicGrant&&!vacantSlot(g,c,'relic'))throw Error('此城没有可用的圣物槽位。');
 for(const tech of v.eurekaTechs||[])ctx.boost(g,p,tech);
 if(v.allModernAndAtomicEurekas)for(const [k,t]of Object.entries(TECHS))if([5,6].includes(t.era)&&!p.techs.includes(k))ctx.boost(g,p,k);
 if(v.freeCivicInspiration)ctx.inspire(g,p,v.freeCivicInspiration);
 if(v.freeRandomTechCount)freeTechs(g,p,v.freeRandomTechCount,v.targetEras,ctx);
 if(u.activations===0&&v.envoys)p.envoys=Math.min(100,(p.envoys||0)+v.envoys);if(v.levyCostDiscount)addEffect(p,key+':levy',{levyCostDiscount:v.levyCostDiscount});
 p.gold+=(v.instantGold||0);p.faith+=v.instantFaith||0;p.heritageCultureReserve=(p.heritageCultureReserve||0)+(v.instantCulture||0);
 p.heritageScienceReserve=(p.heritageScienceReserve||0)+(v.instantScienceBurst||0)+(v.flatScienceBonus||0)+(v.scienceBonusPerDiscoveredCiv||0)*p.met.length+(v.scienceBurstPerAdjacentMountain||0)*neighbors(g.map,g.map.tiles[u.tile]).filter(t=>t.terrain==='mountain').length;
 if(v.freeBuilding){if(hasBuilding(c,v.freeBuilding))p.heritageScienceReserve+=(v.scienceReserveFallback||0);else c.buildings.push(v.freeBuilding);}
 let rush=(v.instantCityProduction||0)+(v.wonderProductionRush||0)+(v.cityProjectProductionRush||0)+(v.cityProjectProductionBurst||0)+(v.chargeProductionRush||0);
 if(v.modernEraWonderRushBonus&&wonders.get(c.production?.item)?.era>=5)rush+=v.modernEraWonderRushBonus;
 if(v.charge1ProductionRush&&u.activations===0)rush+=v.charge1ProductionRush;
 if(c.production)c.production.progress+=rush;else c.storedProduction+=rush;
 const cityKeys={commercialSpecialistGoldBonus:'commercialSpecialistGold',cityPermanentScience:'science',cityScienceBonus:'science',cityPermanentCulture:'culture',cityFaithBonus:'faith',cityAmenityBonus:'amenity',cityHousingBonus:'housing',cityTourismBonus:'tourism',cityLoyaltyBonus:'loyaltyBonus',campusBuildingScienceMultiplier:'campusBuildingScienceMultiplier',cityCommercialGoldMultiplier:'commercialGoldMultiplier',cityExchangeGoldMultiplier:'exchangeGoldMultiplier',cityDistrictProductionBonus:'districtProduction',wallCapacityBonus:'wallCapacity'};
 for(const [from,to]of Object.entries(cityKeys))route(from,to,v[from],'activation_city');
 add(city,'amenity',v.chargeAmenity);add(city,'housing',v.chargeHousing);
 if(u.activations>=1){add(city,'riverProduction',v.charge2RiverTileProductionBonus);add(city,'riverGold',v.charge2RiverTileGoldBonus);}
 const empireKeys={empireLibraryScienceBonus:'libraryScience',empireCampusScienceBonus:'campusScience',empireLabScienceBonus:'labScience',allLabsScienceBonus:'labScience',nuclearLabScienceBonus:'labScience',universityScienceBonus:'universityScience',universityProductionBonus:'universityProduction',empireFactoriesProductionBonus:'factoryProduction',workshopCultureBonus:'workshopCulture',tradeCapacityBonus:'tradeCapacity',foreignRouteGoldBonus:'foreignRouteGold',waterRouteGoldBonus:'waterRouteGold',bankGoldBonus:'bankGold',oilResourceProductionBonus:'oilProduction',oilResourceGoldBonus:'oilGold',domesticRouteProductionBonus:'domesticRouteProduction',domesticRouteGoldBonus:'domesticRouteGold',civilianUnitUpkeepDiscount:'civilianUpkeepDiscount',empireMinesProductionBonus:'mineProduction',empireCityCultureBonus:'culture',empireExchangeGoldBonus:'exchangeGold',goldDiscountPurchaseCivilians:'civilianPurchaseDiscount',allCommercialHubsProductionBonus:'commercialProduction',spaceRaceProductionMultiplier:'spaceRaceProductionMultiplier',barracksCultureBonus:'barracksCulture',barracksInitialXpBonus:'barracksInitialXp',militaryProductionMultiplier:'militaryProductionMultiplier',empireMilitaryProductionBonus:'militaryProductionMultiplier',empireLandMilitaryCombatBonus:'armyCombatBonus',unitUpkeepDiscount:'unitUpkeepDiscount',navalUpkeepDiscount:'navalUpkeepDiscount',holySiteCultureBonus:'holyCulture',campusFaithBonus:'campusFaith',holySiteScienceBonus:'holyScience',warWearinessReduction:'warWearinessReduction'};
 for(const [from,to]of Object.entries(empireKeys))route(from,to,v[from],'empire');
 const unitKeys={targetUnitCombatBonus:'combat',targetUnitAttackStrengthBonus:'attack',targetUnitsDefensiveBonus:'defense',targetUnitMovementBonus:'movement',targetNavalCombatBonus:'combat',targetNavalUnitCombatBonus:'combat',targetNavalCombatPermanentBonus:'combat',targetNavalSpeedBonus:'movement',targetArmorDefenseBonus:'defense',targetUnitsCombatBonus:'combat',targetArmySpeedBonus:'movement',siegeCombatStrengthBonus:'siegeCombat',enemyCitySiegeCombatBonus:'cityCombat',targetCavalryAttackBonus:'cavalryCombat',targetCavalryMoveBonus:'cavalryMovement',targetArtilleryCombatBonus:'rangedCombat',targetUnitsDefenseWallBonus:'cityCombat',harborBombardStrengthBonus:'harborCombat',fleetMovementBonus:'movement',navalRammingAttackBonus:'rammingCombat',killEnemyNavalGoldBonus:'navalKillGold',warKillGoldBonus:'killGold'};
 for(const [from,to]of Object.entries(unitKeys))route(from,to,v[from],'target_unit');
 if(target){if(v.targetFullHeal)target.hp=100;else if(person.effectScopes?.targetUnitsHeal!=='target_units_within_radius')target.hp=Math.min(100,target.hp+(v.targetUnitsHeal||0));if(v.targetPromotion||v.freeNavalPromotion){target.level+=(v.targetPromotion||v.freeNavalPromotion);target.xp=Math.max(target.xp,target.level*25);}if(v.flagshipOncePerLifetimeShield)unit.shieldSeconds=v.deathDefyingShieldSeconds;}
 if(v.targetAndAdjacentMovement||v.targetAndAdjacentAttackStrength)for(const t of g.units.filter(t=>t.owner===p.id&&alive(t)&&!UNITS[t.type].civilian&&target&&dist(g.map.tiles[t.tile],g.map.tiles[target.tile],g.map)<=1))addEffect(t,key,{movement:v.targetAndAdjacentMovement||0,attack:v.targetAndAdjacentAttackStrength||0},time(g)+(v.durationCycles||1)*20);
 if(v.cityLoyaltyRestoreMax)c.loyalty=100;c.loyalty=Math.min(100,c.loyalty+(v.cityLoyaltyRestored||0));if(v.cityWallRepairHp)c.walls=Math.min(Math.max(c.wallMax||0,...c.buildings.map(k=>BUILDINGS[k]?.defense||0)),c.walls+v.cityWallRepairHp);
 if(v.warWearinessReductionInstant)p.warWeariness=(p.warWeariness||0)*(1-v.warWearinessReductionInstant);
 if(v.freeReligionFounding&&!p.religion&&action.religionParent!==undefined)affiliateReligion(g,p,action.religionParent,c,{free:true});
 if(v.freeReligionFounding&&!p.religion&&action.religionParent===undefined){p.religion=action.religion;c.faithPressure??={secular:30};c.faithPressure[p.id]=Math.max(180,c.population*80);ctx.updateFollowers(g,c);}
 if(v.workType){const slot=vacantSlot(g,c,v.workType),work=v.works[u.activations];if(!work)throw Error('此伟人的巨作已经全部完成。');g.heritage.works.push({id:g.heritage.nextWork++,creator:key,type:v.workType,...work,city:c.id,slot:slot.id});}
 const bonus=v.bonusEffect;if(bonus&&u.activations===0)addEffect(bonus.scope==='activation_city'?c:p,key+':cultural',bonus.effects,bonus.durationCycles?time(g)+bonus.durationCycles*20:undefined);
 if(v.targetCityIndustrialProductionBonus)city.industrialProduction=v.targetCityIndustrialProductionBonus;
 if(v.targetCityIndustrialScienceBonus)city.industrialScience=v.targetCityIndustrialScienceBonus;
 if(v.regionalBonusDistance)for(const other of ownCities(g,p).filter(other=>other!==c&&dist(g.map.tiles[other.tile],g.map.tiles[c.tile],g.map)<=v.regionalBonusDistance))addEffect(other,key+':regional',{production:v.regionalCityProductionBonus||0,science:v.regionalCityScienceBonus||0});
 if(v.empirePowerplantsProductionBonus)empire.powerplantProduction=v.empirePowerplantsProductionBonus;
 if(v.empirePowerplantsScienceBonus)empire.powerplantScience=v.empirePowerplantsScienceBonus;
 for(const [from,to]of Object.entries({defensiveLoyaltyBonus:'defensiveLoyalty',coastalCityDefenseBonus:'coastalCityDefense',harborCityDefenseStrength:'harborCityDefense',harborCityGoldBonus:'harborCityGold',militaryPolicyEffectiveness:'militaryPolicyEffectiveness',airSupportRangeBonus:'airSupportRange',carrierBomberDamageMultiplier:'carrierBomberDamageMultiplier',boardingCaptureChance:'boardingCaptureChance',submarineSpeedBonus:'submarineMovement',submarineStealthBonus:'submarineStealth'}))if(v[from])route(from,to,Number(v[from]),'empire');
 for(const [from,to]of Object.entries({ignoreZoc:'ignoreZoc',pillageYieldMultiplier:'pillageYieldMultiplier',coastalRaidGoldBonus:'coastalRaidGold',lowHpEvasionChance:'lowHpEvasionChance',ignoreEnemyTerritoryWaterPenalty:'ignoreEnemyTerritoryWaterPenalty'}))if(v[from])route(from,to,Number(v[from]),'target_unit');
 if(v.carrierBomberDamageMultiplier&&target&&UNITS[target.type].airCapacity){unit.carrierBomberDamageMultiplier=v.carrierBomberDamageMultiplier;delete city.carrierBomberDamageMultiplier;}
 if(target)addEffect(target,key,unit,key==='subutai'?undefined:until);
 const nearby=g.units.filter(t=>t.owner===p.id&&alive(t)&&!UNITS[t.type].civilian&&!['sea','air'].includes(UNITS[t.type].domain)&&dist(g.map.tiles[t.tile],g.map.tiles[u.tile],g.map)<=(v.radius??person.runtimeRules?.radius??2));
 if(person.effectScopes?.targetUnitsHeal==='target_units_within_radius')for(const t of nearby)t.hp=Math.min(100,t.hp+v.targetUnitsHeal);
 for(const t of nearby)if(area.target_units_within_radius&&retirementTargetMatches(person,t))addEffect(t,key,area.target_units_within_radius,until);
 if(area.all_naval_units)for(const t of g.units.filter(t=>t.owner===p.id&&alive(t)&&UNITS[t.type].domain==='sea'&&!UNITS[t.type].civilian))addEffect(t,key,area.all_naval_units,until);
 if(v.coastalRaidGoldAndCultureBurst){p.gold+=v.coastalRaidGoldAndCultureBurst;p.heritageCultureReserve+=v.coastalRaidGoldAndCultureBurst;}
 if(v.annexUnownedAdjacentTilesCount){for(const t of neighbors(g.map,g.map.tiles[c.tile]).filter(t=>t.owner===null).slice(0,v.annexUnownedAdjacentTilesCount)){t.owner=p.id;t.territoryCity=c.id;}}
 const reveal=v.revealTilesRadius||v.revealWaterRadius;if(reveal){const ids=tilesInRange(g.map,g.map.tiles[u.tile],reveal).filter(t=>!v.revealWaterRadius||isWater(t)).map(t=>t.id);p.explored=[...new Set([...p.explored,...ids])];for(const id of ids){p.knownTiles??={};p.knownTiles[id]={...structuredClone(g.map.tiles[id]),...naturalTileProjection(g,p,g.map.tiles[id])};}}
 if(v.relicGrant){const slot=vacantSlot(g,c,'relic');g.heritage.works.push({id:g.heritage.nextWork++,creator:key,type:'relic',title:person.name+'的圣物',faith:4,tourism:4,city:c.id,slot:slot.id});}
 if(v.religionPressureRadius4||v.spreadForeignCitiesInstant){const targets=g.cities.filter(other=>p.explored.includes(other.tile)&&(!v.spreadForeignCitiesInstant||other.owner!==p.id)).filter(other=>!v.religionPressureRadius4||dist(g.map.tiles[c.tile],g.map.tiles[other.tile],g.map)<=4).slice(0,v.spreadForeignCitiesInstant||Infinity);for(const other of targets){other.faithPressure??={secular:30};other.faithPressure[p.id]=(other.faithPressure[p.id]||0)+180;ctx.updateFollowers(g,other);}}
 addEffect(c,v.chargeAmenity?key+':'+u.activations:key,city,until);addEffect(p,key,empire,until);
 if(v.freeFighterAircraft)if(!grantUnit(g,p,c,'fighter',ctx,target?.id)){g.heritage.pendingGrants??=[];g.heritage.pendingGrants.push({owner:p.id,city:c.id,type:'fighter',...(target&&UNITS[target.type].airCapacity?{carrier:target.id}:{})});}
 if(v.freeNavalUnit)if(!grantUnit(g,p,c,v.freeNavalUnit,ctx)){g.heritage.pendingGrants??=[];g.heritage.pendingGrants.push({owner:p.id,city:c.id,type:v.freeNavalUnit});}
 u.activations++;u.charges--;u.acted=true;u.moves=0;u.cooldownUntil=time(g)+1.25;
 if(u.charges===0){g.units=g.units.filter(t=>t.id!==u.id);p.greatPeople.owned=p.greatPeople.owned.filter(t=>t.unit!==u.id);p.greatPeople.retired.push({key,turn:g.turn});}
 ctx.event(g,'greatperson',`${person.name} 在 ${c.name} ${v.workType?'创作了巨作':'发挥了才能'}。`,p.id,c.tile);ctx.refreshVisibility?.(g);
}

function eligibleCommanderAuras(g,u,viewer=null){const unit=UNITS[u.type];if(!g.heritage||unit?.civilian)return [];const sea=unit.domain==='sea',era=TECHS[unit.tech]?.era??CIVICS[unit.civic]?.era??0;return heritageUnits(g).filter(general=>general.greatPerson&&general.owner===u.owner&&alive(general)&&(viewer===null||viewer===u.owner||g.players[viewer]?.visible.includes(general.tile))).map(general=>({general,spec:people.get(general.greatPerson)})).filter(({general,spec})=>spec?.aura&&sea===(spec.classKey==='admiral')&&(sea||unit.domain!=='air')&&spec.aura.applicableEras.includes(era)&&dist(g.map.tiles[general.tile],g.map.tiles[u.tile],g.map)<=(spec.aura.radius??2)).map(({spec})=>spec.aura);}
export function heritageAura(g,u,viewer=null){const result={combat:0,movement:0,range:0},unit=UNITS[u.type],sea=unit.domain==='sea';for(const aura of eligibleCommanderAuras(g,u,viewer)){result.combat=Math.max(result.combat,aura.combatStrength||0);result.movement=Math.max(result.movement,(aura.movement||0)+(unit.class==='cavalry'?aura.cavalrySpeedBonus||0:0)+(sea?aura.navalSpeedBonus||0:0)+(isWater(g.map.tiles[u.tile])&&g.map.tiles[u.tile].terrain==='coast'?aura.shallowWaterMoveBonus||0:0)+(aura.supplyMoveBonus||0));if(unit.siege)result.range=Math.max(result.range,aura.artilleryBombardRange||aura.artilleryRange||0);for(const [key,value]of Object.entries(aura))if(typeof value==='number'||typeof value==='boolean')result[key]=Math.max(result[key]||0,Number(value));}return result;}
const auraBonus=heritageAura;
function governorDefenseAura(g,u,defending){if(!defending)return 0;const r=g.players[u.owner]?.governors?.roster?.gov_warlord,c=r?.city!==null&&g.cities.find(c=>c.id===r?.city&&c.owner===u.owner);return c&&r.establishedAt<=time(g)&&r.promotions.includes('aa')&&dist(g.map.tiles[u.tile],g.map.tiles[c.tile],g.map)<=3?3:0;}
export function heritageCombatBonus(g,u,defending,opponent,viewer=null){if(UNITS[u.type]?.civilian)return 0;const spec=UNITS[u.type],land=!['sea','air'].includes(spec.domain),home=g.map.tiles[u.tile]?.owner===u.owner,city=opponent&&!UNITS[opponent.type]&&!defending,ship=!defending&&opponent&&UNITS[opponent.type]?.domain==='sea'&&dist(g.map.tiles[u.tile],g.map.tiles[opponent.tile],g.map)<=1;
 const contribution=e=>(e.combat||0)+(defending?e.defense||0:e.attack||0)+(land?e.armyCombatBonus||0:0)+(spec.siege?e.siegeCombat||0:0)+(spec.ranged?e.rangedCombat||0:0)+(spec.class==='cavalry'?e.cavalryCombat||0:0)+(city?(e.cityCombat||0)+(operational(g,opponent,'harbor')||g.map.tiles[opponent.tile]?.fort?e.harborCombat||0:0):0)+(ship?e.rammingCombat||0:0)+(defending&&home?e.homeDefenseCombatBonus||0:0);
 const sources=new Map(),other={};for(const entity of [u,g.players[u.owner]])for(const [key,e]of Object.entries(entity?.heritageEffects||{})){if(e.until!==undefined&&e.until<=time(g))continue;const commander=['general','admiral'].includes(people.get(key.split(':')[0])?.classKey);if(commander){const id=key.split(':')[0],combined=sources.get(id)||{};for(const [k,v]of Object.entries(e))if(typeof v==='number'&&k!=='until')combined[k]=Math.max(combined[k]||0,v);sources.set(id,combined);}else for(const [k,v]of Object.entries(e))if(typeof v==='number'&&k!=='until')other[k]=(other[k]||0)+v;}
 return contribution(other)+Math.max(heritageAuraCombat(g,u,defending,opponent,viewer),governorDefenseAura(g,u,defending),0,...[...sources.values()].map(contribution))+(home&&land&&operationalWonder(g,'mount_rushmore',u.owner)?4:0);}
export function heritageMovementBonus(g,u){const e=heritageEffects(g,u),spec=UNITS[u.type],p=heritageEffects(g,g.players[u.owner]),aura=auraBonus(g,u,null);return Math.max(e.movement||0,spec.class==='cavalry'?e.cavalryMovement||0:0,spec.submarine?p.submarineMovement||0:0,aura.movement,spec.siege?aura.artilleryMovementBonus||0:0)+(operationalWonder(g,'great_lighthouse',u.owner)&&(spec.domain==='sea'||isWater(g.map.tiles[u.tile]))?1:0);}
export function heritageRangeBonus(g,u,viewer=null){const carrier=u.carrierId===undefined?null:g.units.find(c=>c.id===u.carrierId&&c.owner===u.owner);return Math.max(auraBonus(g,u,viewer).range,UNITS[u.type]?.domain==='air'?heritageEffects(g,g.players[u.owner]).airSupportRange||0:0,UNITS[u.type]?.domain==='air'&&carrier?heritageAura(g,carrier,viewer).aircraftStrikeRangeBonus||0:0);}
export function heritageDamage(g,target,amount,source){
 if(target.greatPerson||UNITS[target.type]?.heritage)return 0;
 const own=heritageEffects(g,target),empire=heritageEffects(g,g.players[source?.owner]);
 if((target.heritageShieldUntil||0)>time(g))return 0;
 if(source&&UNITS[source.type]?.domain==='air'&&!UNITS[source.type].airOnly){const carrier=source.carrierId===undefined?null:g.units.find(u=>u.id===source.carrierId&&u.owner===source.owner),base=!carrier&&g.cities.find(c=>c.owner===source.owner&&c.districts.some(d=>d.item==='airport'&&d.tile===source.tile&&!g.map.tiles[d.tile].pillaged));amount*=1+Math.max(empire.carrierBomberDamageMultiplier||0,heritageEffects(g,carrier||base).carrierBomberDamageMultiplier||0);}
 const evasion=Math.max(own.lowHpEvasionChance||0,UNITS[target.type]?.domain==='sea'?heritageEffects(g,g.players[target.owner]).lowHpEvasionChance||0:0,0);if(target.hp<50&&evasion&&gameRandom(g)<evasion)return 0;
 const retreat=heritageAura(g,target).retreatSafeRate||0,destination=target.hp<50&&retreat?retreatDestination(g,target,source):null;
 if(destination&&gameRandom(g)<retreat){target.tile=destination.id;target.moves=0;target.acted=true;target.moveUntil=time(g)+3;target.revealedUntil=time(g)+3;return 0;}
 const before=target.hp;
 if(amount>=before&&own.shieldSeconds&&!target.heritageShieldUsed){target.heritageShieldUsed=true;target.heritageShieldUntil=time(g)+own.shieldSeconds;target.hp=1;return before-1;}
 const capture=Math.max(empire.boardingCaptureChance||0,UNITS[source?.type]?.domain==='sea'?heritageAura(g,source).boardingCaptureBonus||0:0);
 if(source&&amount>=before&&UNITS[source.type]?.domain==='sea'&&UNITS[target.type]?.domain==='sea'&&!UNITS[target.type].civilian&&target.owner!==source.owner&&capture&&gameRandom(g)<capture){target.owner=source.owner;target.hp=30;target.acted=true;target.moves=0;delete target.activity;return Math.max(0,before-30);}
 target.hp-=Math.round(amount);return Math.min(before,Math.round(amount));
}
export function heritageKillReward(g,p,u,enemy){const e=heritageEffects(g,u),nation=heritageEffects(g,p);p.gold+=Math.max(e.killGold||0,nation.killGold||0,UNITS[enemy.type]?.domain==='sea'?e.navalKillGold||0:0,UNITS[enemy.type]?.domain==='sea'?nation.navalKillGold||0:0);}
export function heritageCityDefense(g,c){const empire=heritageEffects(g,g.players[c.owner]),local=heritageEffects(g,c),e={coastalCityDefense:Math.max(empire.coastalCityDefense||0,local.coastalCityDefense||0),harborCityDefense:Math.max(empire.harborCityDefense||0,local.harborCityDefense||0)};let n=0;n=Math.max(neighbors(g.map,g.map.tiles[c.tile]).some(isWater)?e.coastalCityDefense||0:0,operational(g,c,'harbor')?e.harborCityDefense||0:0);if(operationalWonder(g,'alhambra',c.owner)&&g.wonders.alhambra.city===c.id&&g.units.some(u=>u.owner===c.owner&&u.tile===c.tile&&!UNITS[u.type].civilian))n+=5;return n;}
export function heritageWarWearinessReduction(g,p){return Math.min(.9,(heritageEffects(g,p).warWearinessReduction||0)+(operationalWonder(g,'mount_rushmore',p.id)?.5:0));}
export function heritageTradePath(g,from,to){
 const a=g.map.tiles[from.tile],b=g.map.tiles[to.tile],norm=q=>(Math.abs(q-a.q)+Math.abs(b.r-a.r)+Math.abs(q+b.r-a.q-a.r))/2,q=g.map.wrapX?[b.q-g.map.width,b.q,b.q+g.map.width].sort((x,y)=>norm(x)-norm(y))[0]:b.q,count=Math.max(1,norm(q)),path=[];
 for(let i=0;i<=count;i++){const f=i/count,x=a.q+(q-a.q)*f,z=a.r+(b.r-a.r)*f,y=-x-z;let rx=Math.round(x),rz=Math.round(z),ry=Math.round(y);const dx=Math.abs(rx-x),dz=Math.abs(rz-z),dy=Math.abs(ry-y);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dz>dy)rz=-rx-ry;const tile=g.map.index[canonicalTileKey(rx,rz,g.map)];if(tile&&!path.includes(tile.id))path.push(tile.id);}return path;
}
export function heritageRouteGold(g,p,route,base){const from=g.cities.find(c=>c.id===route.from),to=g.cities.find(c=>c.id===route.to),e=heritageEffects(g,p);if(!from||!to)return base;const local=heritageEffects(g,from),path=route.path||((e.waterRouteGold||local.waterRouteGold||operationalWonder(g,'panama_canal',p.id))?heritageTradePath(g,from,to):[]);let n=base+(to.owner===p.id?(e.domesticRouteGold||0)+(local.domesticRouteGold||0):(e.foreignRouteGold||0)+(local.foreignRouteGold||0));if(path.some(id=>isWater(p.knownTiles?.[id])))n+=(e.waterRouteGold||0)+(local.waterRouteGold||0);if(g.wonders.torre_de_belem?.city===from.id&&operationalWonder(g,'torre_de_belem',p.id)&&to.owner!==p.id)n+=4;if(operationalWonder(g,'panama_canal',p.id)&&(g.wonders.panama_canal.city===from.id||path.includes(g.wonders.panama_canal.tile)))n=(n+10)*2;return n;}
export function heritageLoyaltyFloor(g,c){const p=g.players[c.owner],liberty=g.wonders.statue_of_liberty;if(liberty&&operationalWonder(g,'statue_of_liberty',p.id)&&dist(g.map.tiles[c.tile],g.map.tiles[liberty.tile],g.map)<=6)return 100;return Number(operationalWonder(g,'mount_rushmore',p.id)&&Object.values(p.relations).some(r=>r.status==='war'&&Number.isInteger(r.aggressor)&&r.aggressor!==p.id));}
export function wonderAIUtility(g,p,c,key){
 const w=wonders.get(key);if(!w)return 0;const e=w.passiveEffects||{},y=w.recurringYields||{},goal=p.focus;
 const weights={science:goal==='science'?2:1,culture:goal==='culture'?2:1,tourism:goal==='culture'?1.5:.5,faith:goal==='religion'?2:.6,production:1.2,gold:1};
 let value=Object.entries(y).reduce((n,[k,v])=>n+v*(weights[k]||.5),0);
 if(p.strategy==='diplomacy')value+=(w.instantGrants.diplomaticPoints||0)*12;
 value+=(e.cityScienceMultiplier||0)*(operational(g,c,'campus')?35:5)+(e.cityProductionMultiplier||0)*(operational(g,c,'industrial')?30:5);
 value+=(e.greatScientistPoints||0)*(goal==='science'?4:1)+(e.greatWriterPoints||0)*(goal==='culture'?4:1)+(e.greatProphetPoints||0)*(!p.religion?4:1);
 if(e.duplicateNavalUnits)value+=g.units.some(u=>u.owner===p.id&&UNITS[u.type].domain==='sea')?18:2;
 if(e.builderChargeBonus)value+=g.units.filter(u=>u.owner===p.id&&u.type==='builder').length*3;
 if(e.regionalLoyaltyAbsoluteRadius6)value+=ownCities(g,p).filter(v=>v.loyalty<75&&dist(g.map.tiles[c.tile],g.map.tiles[v.tile],g.map)<=6).length*8;
 return Math.min(45,Math.max(0,value));
}
export function heritageAIOrders(obs,{faithBudget=obs.player.faith}={}){
 const choices=obs.legalActions||[],orders=[];let faith=Math.max(0,faithBudget||0);
 for(const c of obs.greatPeople?.candidates||[]){const a=choices.find(a=>a.type==='recruitGreatPerson'&&a.item===c.key);
  if(a)orders.push({...a,priority:1000});else if(c.points>=c.threshold*.65&&c.faith<=faith){const sponsor=choices.find(a=>a.type==='patronizeGreatPerson'&&a.item===c.key&&a.currency==='faith');if(sponsor){faith-=c.faith;orders.push({...sponsor,hint:{...sponsor.hint,faithCost:c.faith},priority:500});}}
 }
 for(const u of obs.units.filter(u=>u.greatPerson)){
  const person=people.get(u.greatPerson),targets=choices.filter(a=>a.type==='activateGreatPerson'&&a.unit===u.id);
  const value=a=>{const target=obs.units.find(v=>v.id===a.targetUnit),city=obs.cities.find(v=>v.id===a.city);let n=0;
   if(target){n+=Math.max(UNITS[target.type]?.strength||0,UNITS[target.type]?.ranged||0);n+=(100-target.hp)*.1;if(person?.recipeParams.targetUnitCombatBonus){const current=heritageEffects({realtime:{time:obs.realtime?.time??obs.turn*20}},target).combat||0;n+=Math.max(0,person.recipeParams.targetUnitCombatBonus-current)*5;if(current>=person.recipeParams.targetUnitCombatBonus)n-=60;}}
   if(city)n+=(city.yields?.production||0)+(city.production?5:0);
   return n;
  };
  targets.sort((a,b)=>value(b)-value(a));if(targets[0])orders.push({...targets[0],priority:1000});else{
   const candidates=choices.filter(a=>a.type==='move'&&a.unit===u.id&&(a.hint?.danger||0)===0&&(a.hint?.rangedThreat||0)===0);
   candidates.sort((a,b)=>(b.hint?.greatPersonProgress||0)-(a.hint?.greatPersonProgress||0));if(candidates[0]?.hint?.greatPersonProgress>0)orders.push({...candidates[0],priority:600});
  }
 }
 return orders;
}
export function evacuateGreatPeople(g){
 const removed=new Set();let changed=false;
 for(const u of g.units.filter(u=>u.greatPerson)){
  const p=g.players[u.owner];normalizeGreatPersonHome(g,u);const cities=ownCities(g,p).sort((a,b)=>(a.id!==u.recruitmentCity)-(b.id!==u.recruitmentCity)||(a.id!==p.capital)-(b.id!==p.capital)||dist(g.map.tiles[u.tile],g.map.tiles[a.tile],g.map)-dist(g.map.tiles[u.tile],g.map.tiles[b.tile],g.map)||a.id-b.id);
  if(!cities.length){removed.add(u.id);changed=true;p.greatPeople.owned=p.greatPeople.owned.filter(v=>v.unit!==u.id);p.greatPeople.retired.push({key:u.greatPerson,turn:g.turn,dispersed:true});continue;}
  const hostile=g.units.some(t=>t.id!==u.id&&alive(t)&&t.tile===u.tile&&displacesGreatPerson(t)&&(t.owner===-1||p.relations[t.owner]?.status==='war'));if(!hostile)continue;
  const safe=t=>t&&!g.units.some(v=>v!==u&&alive(v)&&v.tile===t.id&&displacesGreatPerson(v)&&(v.owner===-1||p.relations[v.owner]?.status==='war'));
  let tile;
  for(const c of cities){if(UNITS[u.type].domain!=='sea'){if(safe(g.map.tiles[c.tile])){tile=g.map.tiles[c.tile];break;}}else{const harbor=c.districts.find(d=>baseItem(d.item)==='harbor'),sites=[harbor&&g.map.tiles[harbor.tile],g.map.tiles[c.tile],...tilesInRange(g.map,g.map.tiles[c.tile],2)];tile=sites.find(t=>t&&t.owner===u.owner&&isWater(t)&&safe(t));if(tile)break;}}
  tile??=g.map.tiles[cities[0].tile];
  const partner=g.units.find(v=>v.id===u.linkedUnit&&v.linkedUnit===u.id);if(partner)delete partner.linkedUnit;
  u.tile=tile.id;u.returnSequence=(u.returnSequence||0)+1;u.moves=0;u.acted=true;u.cooldownUntil=Math.max(u.cooldownUntil||0,time(g)+.4);delete u.activity;delete u.linkedUnit;
  p.planRevision=(p.planRevision||0)+1;
  if(g.realtime?.queues)for(const [owner,queue]of Object.entries(g.realtime.queues))g.realtime.queues[owner]=queue.filter(q=>q.action.unit!==u.id);
  changed=true;
 }
 if(removed.size)g.units=g.units.filter(u=>!removed.has(u.id));
 return changed;
}
export function displacesGreatPerson(u){const spec=UNITS[u.type];return !!spec&&!spec.civilian&&spec.domain!=='air'&&Math.max(spec.strength||0,spec.ranged||0)>0;}
function normalizeGreatPersonHome(g,u){
 if(u.recruitmentCity!==undefined)return;
 const record=g.heritage?.recruited?.[u.greatPerson],p=g.players[u.owner],cities=ownCities(g,p);
 // Old saves did not record an origin. Bind once to the owned capital or nearest owned city.
 u.recruitmentCity=record?.city??cities.find(c=>c.id===p.capital)?.id??cities.sort((a,b)=>dist(g.map.tiles[u.tile],g.map.tiles[a.tile],g.map)-dist(g.map.tiles[u.tile],g.map.tiles[b.tile],g.map)||a.id-b.id)[0]?.id;
}
export function heritageRelicsOnDeath(g,ctx){
 for(const u of g.units.filter(u=>u.hp<=0&&UNITS[u.type]?.religious&&!u.relicGranted&&operationalWonder(g,'mont_saint_michel',u.owner))){
  u.relicGranted=true;const p=g.players[u.owner],cities=ownCities(g,p).sort((a,b)=>dist(g.map.tiles[u.tile],g.map.tiles[a.tile],g.map)-dist(g.map.tiles[u.tile],g.map.tiles[b.tile],g.map)),c=cities.find(c=>vacantSlot(g,c,'relic'));if(!c)continue;const slot=vacantSlot(g,c,'relic');g.heritage.works.push({id:g.heritage.nextWork++,creator:'martyr:'+u.id,type:'relic',title:UNITS[u.type].name+'的圣物',faith:4,tourism:4,city:c.id,slot:slot.id});ctx.event(g,'religion',c.name+' 收藏了一件殉道圣物。',p.id,c.tile);
 }
}
export function duplicateHeritageNavy(g,p,c,source,ctx){
 if(source.isDuplicated||!operationalWonder(g,'venetian_arsenal',p.id)||UNITS[source.type].domain!=='sea'||UNITS[source.type].civilian)return;
 const copy=Object.fromEntries(['level','xp','training','veteranTraits','innateTraits','heritageEffects','movementBonus'].filter(k=>source[k]!==undefined).map(k=>[k,structuredClone(source[k])])),unit=grantUnit(g,p,c,source.type,ctx);
 if(unit)Object.assign(unit,copy,{isDuplicated:true,moves:0,acted:true});else {g.heritage.pendingGrants??=[];g.heritage.pendingGrants.push({owner:p.id,city:c.id,type:source.type,copy});}
}
