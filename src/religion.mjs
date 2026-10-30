import {governorHas} from './governors.mjs';
import {operationalWonder} from './heritage.mjs';
import {BUILDINGS} from './rules.mjs';
import {operationalBuilding} from './leader-events.mjs';
import {UNITS,RELIGIONS,dist,gamePace} from './rules.mjs';
import {TECHS} from './rules.mjs';
import {PANTHEONS,BELIEFS} from './religion-data.mjs';
import {RESOURCES,YIELD_KEYS,productionCost,WONDERS} from './rules.mjs';
import {neighbors,tilesInRange} from './world.mjs';
import {baseItem,replacementFor,contentEligible} from './unique-content.mjs';
export {PANTHEONS,BELIEFS};
const categories=Object.keys(BELIEFS);
const beliefByKey=new Map(categories.flatMap(k=>BELIEFS[k]).map(b=>[b.key,b]));
export function religionBelief(g,p,category){
 if(!p?.religion)return null;
 const inherited=p.religionParent!=null?g.players[p.religionParent]:null;
 const source=inherited&&['follower','worship'].includes(category)?inherited:p;
 return beliefByKey.get(source.beliefs?.[category])||null;
}
export function pantheonEffect(p){return PANTHEONS.find(x=>x.key===p.pantheon)?.effects||{};}
export function holyPantheonAdjacency(g,p,t){const e=pantheonEffect(p);return neighbors(g.map,t).reduce((n,a)=>n+(e.holySiteAdjacentTerrainBonus?.terrain===a.terrain?e.holySiteAdjacentTerrainBonus.faith:0)+(e.holySiteAdjacentFeatureBonus?.feature===a.feature?e.holySiteAdjacentFeatureBonus.faith:0),0);}
export function religionTileYield(g,p,t,base){
 const y={...base},e=pantheonEffect(p),bonus=e.workedImprovementBonus,resource=RESOURCES[t.resource];
 if(!t.pillaged&&bonus?.improvements.includes(t.improvement)&&(!bonus.requiresResources||bonus.requiresResources.includes(t.resource))&&(!bonus.requiresResourceCategory||bonus.requiresResourceCategory.includes(resource?.category)&&(!resource.tech||p.techs.includes(resource.tech))))for(const k of YIELD_KEYS)y[k]=(y[k]||0)+(bonus[k]||0);
 if(e.workedTerrainBonus?.terrainHill&&t.hill)for(const k of YIELD_KEYS)y[k]=(y[k]||0)+(e.workedTerrainBonus[k]||0);
 if(p.techs.includes('flight')&&t.improvement&&!t.pillaged)y.tourism=Math.max(1,y.tourism||0,y.culture||0);
 return y;
}
export function worshipOperational(g,c){return !!c.worship&&operationalBuilding(g,c,'temple');}
export function religionCityBonuses(g,c,adjacency){
 const p=g.players[c.owner],majority=g.players[c.religion],b=religionBelief(g,majority,'follower'),e=b?.effects||{},pantheon=pantheonEffect(p),flat={};let housing=0,amenities=0,loyalty=0;
 const add=(k,n)=>{flat[k]=(flat[k]||0)+(n||0);};
 if(pantheon.riverHolySiteCityBonus&&c.districts.some(d=>baseItem(d.item)==='holy'&&!g.map.tiles[d.tile].pillaged&&g.map.tiles[d.tile].river)){housing+=pantheon.riverHolySiteCityBonus.housing;amenities+=pantheon.riverHolySiteCityBonus.amenities;}
 if(e.holySiteProductionEqualsFaithAdjacency)for(const d of c.districts)if(baseItem(d.item)==='holy'&&!g.map.tiles[d.tile].pillaged)add('production',adjacency(g,p,g.map.tiles[d.tile],'holy'));
 for(const key of ['shrine','temple'])if(operationalBuilding(g,c,key)){add('food',e[key+'Food']);add('culture',e[key+'Culture']);housing+=e[key+'Housing']||0;}
 if(e.minimumSpecialtyDistricts&&c.districts.filter(d=>!g.map.tiles[d.tile].pillaged&&!['aqueduct','spaceport','airport','neighborhood'].includes(baseItem(d.item))).length>=e.minimumSpecialtyDistricts){amenities+=e.amenities||0;add('faith',e.faith);}
 if(e.originRouteGoldPerHolySiteBuilding){const count=Number(operationalBuilding(g,c,'shrine'))+Number(operationalBuilding(g,c,'temple'))+Number(worshipOperational(g,c)),routes=g.routes.filter(r=>r.from===c.id&&r.owner===c.owner).length;add('gold',count*routes*e.originRouteGoldPerHolySiteBuilding);add('production',count*routes*e.originRouteProductionPerHolySiteBuilding);}
 if(worshipOperational(g,c)){const w=beliefByKey.get(c.worship)?.buildingSpec;for(const [k,n]of Object.entries(w?.yields||{}))add(k,n);housing+=w?.housing||0;amenities+=w?.amenities||0;loyalty+=w?.cityLoyaltyBonus||0;}
 // Founder revenues settle once, through the actual national capital only.
 if(c.id===p.capital){const f=religionBelief(g,p,'founder')?.effects||{},foreign=g.cities.filter(v=>v.owner!==p.id),majorities=g.cities.filter(v=>v.religion===p.id);if(f.followersPerStep)add('gold',Math.floor(worldFollowers(g,p.id)/f.followersPerStep)*f.goldPerStep);if(f.foreignFollowersPerStep){const count=foreign.reduce((n,v)=>n+(v.followers?.[p.id]||0),0);add('science',Math.floor(count/f.foreignFollowersPerStep)*(f.sciencePerStep||0));add('culture',Math.floor(count/f.foreignFollowersPerStep)*(f.culturePerStep||0));}for(const v of majorities){if(v.owner!==p.id){if(operationalBuilding(g,v,'campus'))add('science',f.foreignCityWithCampusScience);if(operationalBuilding(g,v,'commercial'))add('gold',f.foreignCityWithCommercialGold);add('faith',f.faithPerForeignMajorityCity);}if(v.owner===p.id||p.relations[v.owner]?.status==='alliance'){if(operationalBuilding(g,v,'holy'))add('faith',f.faithPerHolySite);if(operationalBuilding(g,v,'theater'))add('culture',f.culturePerTheater);}}}
 return {flat,housing,amenities,loyalty};
}
export function religionCombatBonus(g,u,opponent){const p=g.players[u.owner],e=religionBelief(g,p,'enhancer')?.effects||{},t=g.map.tiles[u.tile],c=g.cities.find(c=>c.id===t.territoryCity||c.tile===t.id);if(!c||c.religion!==p?.id||!opponent||UNITS[u.type]?.civilian)return 0;return c.owner===p.id||p.relations[c.owner]?.status==='alliance'?e.friendlyTerritoryCombatBonus||0:e.enemyTerritoryCombatBonus||0;}
export function religionMovement(g,u){return UNITS[u.type]?.religious?religionBelief(g,unitReligionSource(g,u),'enhancer')?.effects?.movementBonus||0:0;}
export function religionIgnoresTerrain(g,u,to){return !!UNITS[u.type]?.religious&&religionBelief(g,unitReligionSource(g,u),'enhancer')?.effects?.ignoreTerrainCost?.some(k=>k==='hill'?to.hill:to.feature===k);}
export function religionWonderMultiplier(g,p,item){const spec=pantheonEffect(p).wonderProductionMultiplier;return WONDERS[item]&&spec?.applicableEras.includes(WONDERS[item].era)?1+spec.multiplier:1;}
function beliefCost(g,p,category){return p.beliefs?.[category]?250*gamePace(g).factor:['enhancer','worship'].includes(category)?100*gamePace(g).factor:0;}
export function religionActions(g,p){
 const actions=[],holy=g.cities.filter(c=>c.owner===p.id&&operationalBuilding(g,c,'holy'));
 if(!p.pantheon&&p.faith>=30)for(const item of PANTHEONS)if(!g.players.some(o=>o.pantheon===item.key))actions.push({type:'pantheon',item:item.key,hint:{utility:religionChoiceUtility(g,p,item)}});
 if(p.religion&&p.religionParent==null)for(const category of categories){if(['enhancer','worship'].includes(category)&&!p.civics.includes('theology')||p.beliefs?.[category]&&(!p.civics.includes('reform')||(p.reformationReadyAt||0)>(g.realtime?.time??g.turn*20)))continue;for(const b of BELIEFS[category])if(p.beliefs?.[category]!==b.key&&p.faith>=beliefCost(g,p,category))actions.push({type:'belief',item:b.key,category,hint:{faithCost:beliefCost(g,p,category),utility:religionChoiceUtility(g,p,b)}});}
 for(const c of g.cities.filter(c=>c.owner===p.id)){const majority=g.players[c.religion],w=religionBelief(g,majority,'worship');if(w&&!c.worship&&operationalBuilding(g,c,'temple')&&p.faith>=Math.ceil(w.buildingSpec.cost*gamePace(g).factor))actions.push({type:'worship',city:c.id,item:w.key,hint:{faithCost:Math.ceil(w.buildingSpec.cost*gamePace(g).factor)}});const f=religionBelief(g,majority,'follower');for(const key of f?.effects?.allowFaithPurchaseBuildings||[]){const item=replacementFor(p,key),b=BUILDINGS[item],cost=Math.ceil(productionCost(g,item)*2);if(b&&contentEligible(p,b)&&!c.buildings.some(k=>baseItem(k)===key)&&(!b.building||operationalBuilding(g,c,b.building))&&(!b.tech||p.techs.includes(b.tech))&&(!b.civic||p.civics.includes(b.civic))&&p.faith>=cost)actions.push({type:'faithBuilding',city:c.id,item,hint:{faithCost:cost}});}}
 return actions;
}
export function applyReligionAction(g,p,action,ctx){
 const legal=religionActions(g,p).find(a=>a.type===action.type&&a.item===action.item&&a.city===action.city&&a.category===action.category);if(!legal)throw Error('宗教选择当前不可用。');const c=g.cities.find(c=>c.id===action.city);
 if(action.type==='pantheon'){const e=PANTHEONS.find(b=>b.key===action.item).effects;let tile;if(e.instantUnitGrant){const capital=g.cities.find(c=>c.id===p.capital&&c.owner===p.id);tile=capital&&tilesInRange(g.map,g.map.tiles[capital.tile],2).find(t=>t.owner===p.id&&!['coast','ocean','mountain'].includes(t.terrain)&&!g.units.some(u=>u.tile===t.id||u.activity?.to===t.id));if(!tile||g.units.length>=2000)throw Error('首都附近没有建造者部署空间。');}p.pantheon=action.item;p.faith+=e.instantFaithOnAdoption||0;if(tile)ctx.addUnit(g,p.id,e.instantUnitGrant.unitKey,tile.id);}
 else if(action.type==='belief'){const replacing=!!p.beliefs[action.category];p.faith-=legal.hint.faithCost;p.beliefs[action.category]=action.item;if(replacing)p.reformationReadyAt=(g.realtime?.time??g.turn*20)+240;}
 else {p.faith-=legal.hint.faithCost;if(action.type==='worship')c.worship=action.item;else {c.buildings.push(action.item);if(c.production&&baseItem(c.production.item)===baseItem(action.item)){c.storedProduction+=c.production.progress;c.production=null;}}}
 ctx.refreshVisibility?.(g);
}
export function religionChoiceUtility(g,p,b){
 const e=b.effects||{},weights=b.aiUtility?.preferenceWeights||{},cities=g.cities.filter(c=>c.owner===p.id),tiles=cities.flatMap(c=>(c.worked||[]).map(id=>g.map.tiles[id])).filter(t=>!t.pillaged);
 const holy=cities.flatMap(c=>c.districts.filter(d=>baseItem(d.item)==='holy'&&!g.map.tiles[d.tile].pillaged).map(d=>g.map.tiles[d.tile]));
 let value=Object.values(weights).reduce((a,n)=>a+n,0);
 if(e.workedImprovementBonus){const v=e.workedImprovementBonus;value+=tiles.filter(t=>v.improvements.includes(t.improvement)&&(!v.requiresResourceCategory||v.requiresResourceCategory.includes(RESOURCES[t.resource]?.category))&&(!v.requiresResources||v.requiresResources.includes(t.resource))&&(!RESOURCES[t.resource]?.tech||p.techs.includes(RESOURCES[t.resource].tech))).length*3;}
 if(e.holySiteAdjacentTerrainBonus)value+=holy.reduce((n,t)=>n+neighbors(g.map,t).filter(v=>v.terrain===e.holySiteAdjacentTerrainBonus.terrain).length,0)*3;
 if(e.holySiteAdjacentFeatureBonus)value+=holy.reduce((n,t)=>n+neighbors(g.map,t).filter(v=>v.feature===e.holySiteAdjacentFeatureBonus.feature).length,0)*3;
 if(e.riverHolySiteCityBonus)value+=holy.filter(t=>t.river).length*5;
 if(e.holySiteProductionEqualsFaithAdjacency)value+=holy.reduce((n,t)=>{const ring=neighbors(g.map,t);return n+ring.filter(v=>v.terrain==='mountain').length*2+Math.floor(ring.filter(v=>v.feature==='forest').length/2)+holyPantheonAdjacency(g,p,t);},0)*3;
 for(const key of ['shrine','temple'])value+=cities.filter(c=>operationalBuilding(g,c,key)).length*((e[key+'Food']||0)+(e[key+'Culture']||0)+(e[key+'Housing']||0)*2);
 if(e.originRouteGoldPerHolySiteBuilding)value+=g.routes.filter(r=>r.owner===p.id).length*3;
 const war=Object.values(p.relations).some(r=>r.status==='war');
 if(e.friendlyTerritoryCombatBonus)value+=cities.filter(c=>c.religion===p.id).length*(war?6:1);
 if(e.enemyTerritoryCombatBonus)value+=war&&p.focus==='domination'?8:0;
 if(b.buildingSpec?.cityLoyaltyBonus)value+=cities.filter(c=>c.loyalty<75).length*5;
 const focus={science:'science',culture:'culture',religion:'faith',domination:'military',economy:'commerce'}[p.focus];return value+(weights[focus]||0)*5;
}
export function religionAIOrders(obs){
 const actions=obs.legalActions||[],orders=[];let faith=obs.player.faith||0;
 const reserve=(action,cost=action?.hint?.faithCost||0,priority=700)=>{if(action&&cost<=faith){faith-=cost;orders.push({...action,hint:{...action.hint,faithCost:cost},priority});return true;}return false;};
 for(const type of ['pantheon','affiliateReligion']){const choices=actions.filter(a=>a.type===type).sort((a,b)=>(b.hint?.utility||0)-(a.hint?.utility||0));reserve(choices[0],type==='affiliateReligion'?120:0);}
 for(const category of categories)if(!obs.player.beliefs?.[category]){const choices=actions.filter(a=>a.type==='belief'&&a.category===category).sort((a,b)=>(b.hint?.utility||0)-(a.hint?.utility||0));reserve(choices[0]);}
 reserve(actions.find(a=>a.type==='worship'),undefined,400);
 const building=actions.find(a=>a.type==='faithBuilding'&&faith>=(a.hint.faithCost||0)+120);reserve(building,undefined,350);
 return orders;
}

export const religionCapacity=g=>Math.min(Object.keys(RELIGIONS).length,Math.ceil(g.players.length/2)+1);
export const independentReligions=g=>g.players.filter(p=>p.religion&&p.religionParent==null);
export const worldFollowers=(g,id)=>g.cities.reduce((n,c)=>n+(c.followers?.[id]||0),0);
const techEra=p=>Math.max(0,...p.techs.map(k=>TECHS[k]?.era||0));
export function affiliationStatus(g,p){
 const parent=g.players[p?.religionParent];if(!p?.religion||!parent?.religion||!parent.alive||!p.alive||parent.religionParent!=null)return null;
 const own=worldFollowers(g,p.id),mother=worldFollowers(g,parent.id),active=techEra(p)<5&&techEra(parent)<5;
 return {parent:parent.id,ownFollowers:own,parentFollowers:mother,active,disclose:active&&own<mother,canRevolt:active&&own>mother};
}
export const religionIntelAllowed=(g,viewer,owner)=>viewer!==owner&&affiliationStatus(g,g.players[owner])?.disclose===true&&g.players[owner].religionParent===viewer;
export function affiliationError(g,p,parentId,city,{free=false}={}){
 const parent=g.players[parentId];return p.religion||!free&&p.faith<120||independentReligions(g).length<religionCapacity(g)||!parent?.alive||!parent.religion||parent.religionParent!=null||p.id===parentId||!city||city.owner!==p.id||!operationalBuilding(g,city,'holy')?'附属宗教需要宗教名额已满、己方圣地与一个独立母宗；普通创立需 120 信仰。':null;
}
export function affiliateReligion(g,p,parentId,city,{free=false}={}){
 const error=affiliationError(g,p,parentId,city,{free});if(error)throw Error(error);const parent=g.players[parentId];if(!free)p.faith-=120;
 p.religion=parent.religion;p.religionParent=parent.id;p.inheritedBeliefs=Object.fromEntries(['follower','worship'].filter(k=>parent.beliefs?.[k]).map(k=>[k,parent.beliefs[k]]));
 city.faithPressure??={secular:30};city.faithPressure[p.id]=Math.max(180,city.population*80);updateFollowers(g,city);
 if(!p.met.includes(parent.id))p.met.push(parent.id);if(!parent.met.includes(p.id))parent.met.push(p.id);
}
export function religionWarBonus(g,u,opponent){
 const p=g.players[u.owner],status=p&&affiliationStatus(g,p),r=p?.relations[opponent?.owner];
 return status?.canRevolt&&status.parent===opponent?.owner&&r?.status==='war'&&r.warKind==='religious'&&r.aggressor===p.id?5:0;
}
export function religionIntelligence(g,viewer,ctx={}){return g.players.filter(p=>religionIntelAllowed(g,viewer,p.id)).map(p=>({player:p.id,gold:p.gold,faith:p.faith,resources:ctx.resources?.(g,p),finance:ctx.finance?.(g,p),yields:ctx.empireYields?.(g,p),techs:[...p.techs],civics:[...p.civics],research:p.research,researchProgress:{...p.researchProgress},civic:p.civic,civicProgress:{...p.civicProgress},government:p.government,policies:[...p.policies],religion:p.religion,units:g.units.filter(u=>u.owner===p.id).map(u=>structuredClone(u)),cities:g.cities.filter(c=>c.owner===p.id).map(c=>({...structuredClone(c),yields:ctx.cityYields?.(g,c)})),routes:g.routes.filter(r=>r.owner===p.id).map(r=>structuredClone(r))}));}

export function initializeReligion(g){
  for(const p of g.players){
    p.faithOrdersByType??=Object.fromEntries(['missionary','apostle','inquisitor'].map(k=>[k,p.faithOrders||0]));
    if(!p.faithOrdersByType||typeof p.faithOrdersByType!=='object'||Array.isArray(p.faithOrdersByType)||Object.keys(p.faithOrdersByType).some(k=>!['missionary','apostle','inquisitor','guru','naturalist','rockband','warriormonk'].includes(k)||!Number.isSafeInteger(p.faithOrdersByType[k])||p.faithOrdersByType[k]<0)||['missionary','apostle','inquisitor'].some(k=>!Number.isSafeInteger(p.faithOrdersByType[k])||p.faithOrdersByType[k]<0))throw Error('Invalid per-type faith recruitment count.');
  }
  for(const u of g.units)if(u.religionOwner!==undefined&&(!Number.isInteger(u.religionOwner)||!UNITS[u.type]?.religious||!g.players[u.religionOwner]?.religion))throw Error('Invalid recruited unit religion.');

  for(const p of g.players){p.faithOrders??=0;if(!Number.isInteger(p.faithOrders)||p.faithOrders<0||p.religion!=null&&!RELIGIONS[p.religion])throw Error('Invalid faith recruitment count or belief.');}
  for(const p of g.players)if(p.inheritedBeliefs!==undefined&&(!p.inheritedBeliefs||typeof p.inheritedBeliefs!=='object'||Array.isArray(p.inheritedBeliefs)||Object.entries(p.inheritedBeliefs).some(([category,key])=>!['follower','worship'].includes(category)||beliefByKey.get(key)?.category!==category)))throw Error('Invalid inherited beliefs.');
  const claimed=new Set();for(const p of g.players){p.pantheon??=null;p.beliefs??={};if(p.pantheon&&(!PANTHEONS.some(b=>b.key===p.pantheon)||claimed.has(p.pantheon)))throw Error('Invalid or duplicate pantheon.');if(p.pantheon)claimed.add(p.pantheon);if(!p.beliefs||typeof p.beliefs!=='object'||Array.isArray(p.beliefs)||Object.entries(p.beliefs).some(([category,key])=>!categories.includes(category)||beliefByKey.get(key)?.category!==category)||p.reformationReadyAt!==undefined&&(!Number.isFinite(p.reformationReadyAt)||p.reformationReadyAt<0))throw Error('Invalid religious belief selection.');}
  for(const c of g.cities)if(c.worship!==undefined&&beliefByKey.get(c.worship)?.category!=='worship')throw Error('Invalid worship building.');
  for(const p of g.players)if(p.religionParent!=null&&(!Number.isInteger(p.religionParent)||p.id===p.religionParent||!g.players[p.religionParent]?.religion||g.players[p.religionParent].religionParent!=null||!p.religion||p.religion!==g.players[p.religionParent].religion))throw Error('Invalid affiliated religion.');
  for(const c of g.cities){
    c.faithPressure??=c.religion!=null?{secular:30,[c.religion]:Math.max(100,c.religionPressure||0)}:{secular:Math.max(60,c.population*30)};
    if(typeof c.faithPressure!=='object'||Array.isArray(c.faithPressure))throw Error('Invalid religious pressure record.');
    c.faithPressure.secular??=0;
    for(const [id,n]of Object.entries(c.faithPressure))if(id!=='secular'&&(!g.players[+id]||id!==String(+id))||!Number.isFinite(n)||n<0||n>100000)throw Error('Invalid religious pressure.');
    updateFollowers(g,c);
  }
}
export function updateFollowers(g,c){
  if(!Object.values(c.faithPressure).some(n=>n>0))c.faithPressure={secular:Math.max(60,c.population*30)};
  const entries=Object.entries(c.faithPressure),total=entries.reduce((s,[,n])=>s+n,0)||1,shares=entries.map(([id,n])=>({id,n:c.population*n/total}));
  const followers=Object.fromEntries(shares.map(x=>[x.id,Math.floor(x.n)]));let remaining=c.population-Object.values(followers).reduce((a,b)=>a+b,0);
  for(const x of [...shares].sort((a,b)=>(b.n%1)-(a.n%1)||String(a.id).localeCompare(String(b.id))))if(remaining-->0)followers[x.id]++;
  c.followers=followers;const majority=shares.find(x=>x.id!=='secular'&&followers[x.id]>c.population/2&&g.players[+x.id]?.religion);c.religion=majority?+majority.id:null;
  c.religionPressure=c.religion!=null?c.faithPressure[c.religion]:0;
}
export function religionTargets(g,p,u){
  const spec=UNITS[u.type],source=unitReligionSource(g,u);if(!spec?.religious||spec.religiousHealer||!source||u.charges<=0)return [];
  const visible=new Set(p.visible);
  return g.cities.filter(c=>visible.has(c.tile)&&dist(g.map.tiles[u.tile],g.map.tiles[c.tile],g.map)<=1&&(u.type==='inquisitor'?c.owner===p.id&&Object.keys(c.faithPressure).some(id=>id!=='secular'&&+id!==source.id&&c.faithPressure[id]>0):c.religion!==source.id));
}
export function spreadReligion(g,p,u,c){
  const source=unitReligionSource(g,u);if(!source)throw Error('Religious unit has no valid faith.');
  const cleanse=religionBelief(g,source,'enhancer')?.effects?.opposingPressureEliminationPercent;if(cleanse&&['apostle','inquisitor'].includes(u.type))for(const id of Object.keys(c.faithPressure))if(id!=='secular'&&+id!==source.id)c.faithPressure[id]*=1-cleanse;
  if(u.type==='inquisitor')for(const id of Object.keys(c.faithPressure))if(id!=='secular'&&+id!==source.id)c.faithPressure[id]*=.25;
  c.faithPressure[source.id]=(c.faithPressure[source.id]||0)+(UNITS[u.type].conversion||100)*(source.id!==c.owner&&governorHas(g,c,'gov_theologian','bb')?.5:1)*(c.owner!==p.id&&operationalWonder(g,'potala_palace',c.owner)&&g.wonders.potala_palace.city===c.id?.5:1);c.faithPressure.secular*=.8;updateFollowers(g,c);
}
// A religious unit retains the city faith it was recruited into, even after conversion.
export function unitReligionSource(g,u){const p=g.players[u?.religionOwner??u?.owner];return p?.religion?p:null;}
export function canRecruitReligious(g,p,type,city){
 const spec=UNITS[type],source=g.players[city?.religion];
 return !!(spec?.religious||spec?.faithOnly)&&city?.owner===p.id&&(!spec.religious||!!source?.religion)&&(!spec.tech||p.techs.includes(spec.tech))&&(!spec.civic||p.civics.includes(spec.civic))&&(!spec.religious||operationalBuilding(g,city,type==='missionary'?'shrine':'temple'))&&(!spec.building||operationalBuilding(g,city,spec.building));
}
export function religiousRecruitmentCost(g,p,type,city){
 const discount=city?Math.max(0,...city.buildings.filter(k=>operationalBuilding(g,city,k)).map(k=>BUILDINGS[k]?.religiousDiscount||0)):0;
 const source=g.players[city?.religion]||p,count=p.faithOrdersByType?.[type]??(['missionary','apostle','inquisitor'].includes(type)?p.faithOrders||0:0);
 return Math.ceil((UNITS[type]?.cost||0)*3*(1+count*.12)*gamePace(g).factor*(governorHas(g,city,'gov_theologian')?.8:1)*(1-Math.min(.2,discount))*(1-(['missionary','apostle'].includes(type)?religionBelief(g,source,'enhancer')?.effects?.missionaryAndApostleDiscount||0:0)));
}
export function religionTurn(g){
  for(const p of g.players)if(p.religionParent!=null){const parent=g.players[p.religionParent];if(parent?.alive&&parent.religion===p.religion){p.inheritedBeliefs=Object.fromEntries(['follower','worship'].filter(k=>parent.beliefs?.[k]).map(k=>[k,parent.beliefs[k]]));}else {Object.assign(p.beliefs,p.inheritedBeliefs||{});delete p.religionParent;}}
  // Simultaneous pressure avoids city iteration order deciding religious wars.
  const gains=new Map(g.cities.map(c=>[c.id,{}]));
  for(const source of g.cities)if(source.religion!=null)for(const target of g.cities)if(target.id!==source.id&&dist(g.map.tiles[source.tile],g.map.tiles[target.tile],g.map)<=(religionBelief(g,g.players[source.religion],'enhancer')?.effects?.radiationRadiusTiles||4)){const n=2+Math.min(4,source.followers[source.religion]||0);gains.get(target.id)[source.religion]=(gains.get(target.id)[source.religion]||0)+n;}
  for(const r of g.routes){const from=g.cities.find(c=>c.id===r.from),to=g.cities.find(c=>c.id===r.to);if(from?.religion!=null&&to)gains.get(to.id)[from.religion]=(gains.get(to.id)[from.religion]||0)+4;}
  for(const c of g.cities){for(const [id,n]of Object.entries(gains.get(c.id)))c.faithPressure[id]=(c.faithPressure[id]||0)+n*(+id!==c.owner&&operationalWonder(g,'potala_palace',c.owner)&&g.wonders.potala_palace.city===c.id?.5:1)*(+id===c.owner?1:1-Math.max(0,...c.buildings.filter(k=>operationalBuilding(g,c,k)).map(k=>BUILDINGS[k]?.religiousResistance||0)));const total=Object.values(c.faithPressure).reduce((a,b)=>a+b,0);if(total>5000)for(const id of Object.keys(c.faithPressure))c.faithPressure[id]*=5000/total;updateFollowers(g,c);}
}
export function religionView(g){return {pantheons:PANTHEONS,beliefs:BELIEFS,capacity:religionCapacity(g),religions:g.players.filter(p=>p.religion).map(p=>({founder:p.id,name:RELIGIONS[p.religion].name+(p.religionParent!=null?' · '+p.short+'支派':''),key:p.religion,parent:p.religionParent,beliefs:{...p.beliefs},affiliation:affiliationStatus(g,p),cities:g.cities.filter(c=>c.religion===p.id).length,followers:g.cities.reduce((n,c)=>n+(c.followers?.[p.id]||0),0)}))};}
