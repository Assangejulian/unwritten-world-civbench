import {NATURAL_WONDERS,naturalTileBonus,WORLD_RAINFALL,RESOURCE_ABUNDANCE,resourceRevealed} from './rules.mjs';
import {initializeNaturalWonders,validateNaturalWonders,discoverNaturalWonders,naturalTileProjection,naturalWonderView,naturalAdjacency} from './natural-wonders.mjs';
import {VICTORY_NAMES,VICTORY_TYPES,victoryOptions,victoryEnabled,initializeVictoryRules,awardDiplomaticPoints,settleDiplomaticMilestones,diplomaticProgress,diplomaticLedger,DIPLOMATIC_RESEARCH} from './victory-rules.mjs';
import {unitHasRanged} from './rules.mjs';
import {assignCivPalette,deriveSecondary} from './civ-colours.mjs';
import {civilianMissionGoals,civilianMissionActions,applyCivilianMission,siegeSupport} from './civilian-missions.mjs';
import {initializeGovernors,governorTitles,governorAt,governorHas,activeGovernor,governorLoyalty,governorBonus,governorProduction,governorActions,applyGovernorAction,governorsTurn,governorView} from './governors.mjs';
import {SPECIALISTS,specialistSlots,assignSpecialists,setSpecialists,initializeTourism,tourismTurn,tourismView,visitingTourists,domesticTourists} from './citizens-tourism.mjs';
import {ownersAtWar,cityStateOwner,stateForOwner,initializeCityStates,discoverCityStates,suzerain,cityStateBonuses,cityStateActions,applyCityStateAction,cityStatesTurn,cityStatesView} from './city-states.mjs';
import {initializeEspionage,spyCapacity,spyActions,applySpyAction,espionageTurn,espionageView} from './espionage.mjs';
import {plunderOptions,plunderTrade,visibleTradeRoutes} from './trade-security.mjs';
import {initializeCourt,courtView,courtActions,courtTurn,applyCourtAction,isFriend,allianceCityBonus,allianceCombat} from './court.mjs';
import {initializeEncounters,validateEncounters,publicEncounterTile,encountersTurn,clearEmptyCamps,isCampGuard,barbarianPlayer,visitVillage,spendVillageReserves} from './encounters.mjs';
import {religionActions,pantheonEffect,applyReligionAction,religionTileYield,holyPantheonAdjacency,religionCityBonuses,religionCombatBonus,religionMovement,religionIgnoresTerrain,religionWonderMultiplier,worshipOperational,religionChoiceUtility,religionBelief,canRecruitReligious,unitReligionSource} from './religion.mjs';
import {religionCapacity,independentReligions,affiliateReligion,affiliationStatus,religionIntelAllowed,religionIntelligence,religionWarBonus} from './religion.mjs';
import {riverBlocks,unitDetected,withTacticalCache,zocField,zocSources,stopInZoc,movementBlocked,hostileSeaCost,cityUnderSiege} from './movement-rules.mjs';
import {initializeHeritage,heritageUnitIdentity,displacesGreatPerson,normalizeWonderState,legacyWonderOrder,reconcileHeritagePolicies,validateHeritage,heritageView,heritageEffects,heritageTradePath,heritageLoyaltyFloor,heritagePeriod,heritageActions,heritageDestinations,recruitGreatPerson,passGreatPerson,moveGreatWork,repairWonder,validWonderPlacement,greatWorkYields,heritageCityBonuses,heritageTileModifiers,heritageTileYield,heritageDamage,heritageKillReward,heritageCityDefense,heritageProductionMultiplier,heritageCompleted,activateGreatPerson,heritageCombatBonus,heritageAura,heritageMovementBonus,evacuateGreatPeople,wonderAIUtility,duplicateHeritageNavy,heritageRelicsOnDeath,operationalWonder} from './heritage.mjs';
import {baseItem,hasBuilding,contentEligible,replacementFor,UNIQUE_UNITS,uniqueEnabled} from './unique-content.mjs';
import {militaryPolicyMultiplier,traditionIndex,unitMovement,siegeMatchesWall,veteranCombatBonus,combatDamage} from './rules.mjs';
import {leaderInstant,uniqueCityBonuses,productionCompleted,unitProduced,conquestEffects,killEffects,uniquePeriod,operationalBuilding,healEligible,uniqueCombatBonus} from './leader-events.mjs';
import {maxUnitHp,attackRange,canAttackUnit,nuclearStock,nuclearRange,nuclearFootprint,nuclearPreview,airDefenders} from './air-warfare.mjs';
import {invalidateFleets,carrierFor,deckAircraft,deckAvailable,carrierBusy,groupFor,fleetReach,fleetRange,fleetStrength,fleetStatus,validateDecks} from './carrier-groups.mjs';
import {routeKnowledgeChanged} from './campaign.mjs';
import {productionUpkeep,militaryCosts,militaryFinance as financeState,settleMilitaryPay} from './military-economy.mjs';
import {unitUpkeep,movementStepLimit} from './rules.mjs';
import {retireEliminatedDiplomacy} from './warfare.mjs';
import {diplomaticIntelligence,repairCongressContacts,rememberCityAppearance,validateCityAppearances} from './intelligence.mjs';
import {initializePolitics,politicalStatus,changePolitics,politicsContext,politicalActions,validatePolitics} from './politics.mjs';
import {initializeCongress,congressTurn,congressEffects,congressActions,castCongressVote,congressView,validateCongress,diplomaticFavorIncome,settleDiplomaticFavor} from './congress.mjs';
import {governmentSlots,MAX_CIVILIZATIONS,civilizationTemplate,eraScore,purchaseCost} from './rules.mjs';
import {initializeTerritories,transferCityTerritory} from './territory.mjs';
import {initializeReligion,updateFollowers,religionTargets,spreadReligion,religiousRecruitmentCost,religionTurn,religionView} from './religion.mjs';
import {VERSION,MAP_SIZES,CIVS,TECHS,CIVICS,UNITS,BUILDINGS,WONDERS,PROJECTS,PRODUCTION,POLICIES,GOVERNMENTS,RELIGIONS,RESOURCES,IMPROVEMENTS,YIELD_KEYS,ERAS,dist,isWater,GAME_SPEEDS,gamePace,researchCost,productionCost,improvementFor,canChop,districtStage,civilizationEra,POWER_PLANTS,canEmbark,unitTransport} from './rules.mjs';
export {improvementFor} from './rules.mjs';
import {CITY_MAX_HP,cityWallCapacity,cityWallTier,WALL_TIERS,cityAttackDamage,cityDamageMultiplier,wallDamageMultiplier,occupationUnit,canonicalTileKey,DIRECTIONS} from './rules.mjs';
import {VETERAN_TRAITS,veteranCapacity,veteranChoices,VETERAN_TRAINING_SECONDS} from './rules.mjs';
import {generateMap,neighbors,tilesInRange,tileYield,seedNumber,gameRandom,indexMap} from './world.mjs';
import {cityGrowth,movementDuration,leaderFor,nationalEffects,LEADERS,LEGACY_LEADERS,selectLeaderKeys,NATIONAL_POLICIES,NATIONAL_STRATEGIES} from './rules.mjs';
import {developmentPlan,militaryAssessment} from './strategy.mjs';
import {normalizeAiAlgorithm,migrateAiState,attitudeTurn,personality,operationFor,warHint,peaceHint,opinionHint,unitPreference,attitudeView,intelView,OPS,reserveFor} from './ai.mjs';
import {geopoliticalContext,publicEmpireScore,scoreBreakdown,compareEmpireScore,strategicBalance} from './geopolitics.mjs';
import {defenseSituation,campaignPosture,routeGuidance,settlementGuidance} from './campaign.mjs';
import {improvementName} from './rules.mjs';
import {migrateController} from './environment/controllers.mjs';
import {ageNaturalDiscovery,ageTurn,chooseAgeBonus,ensureAges,validateAges,migrateLegacyAges,agesView,ageView,ageRecord,ageCityBonuses,ageUnitBonus} from './ages.mjs';
import {domesticSituation,localRecruitment,operationalFortress,citizenPressures,loyaltyStatus,loyaltyView} from './domestic.mjs';
import {historicalIdentity,historicalNation} from './nations.mjs';
import {envoyBudget,effectiveSupplies,routeGold,treatyGoldDelta,recommendedAidTerms,recommendedTerms,normalizeTerms,campaignFor} from './peace-terms.mjs';
import {initializeWarfare,cityAttacked,canEnterTerritory,protectedEnvoy,peaceRemaining,truceRemaining,WAR_RULES,diplomaticSummary,publicDiplomacy,beginWar,propose,answerProposal,sendEnvoy,envoyArrival,envoyKilled,capitalAgenda,diplomacyTurn,fortressStatus,fieldActions,applyFieldAction,roadMultiplier,timeOf,aidAssessment,voteAid,connectRoad,allowBorderExit,aidMissionOptions,jointWarAssessment,jointWarAllowed} from './warfare.mjs';

import {initializeClimate,validateClimate,settleClimate,climateView,climateTileState,climateTileYield,climateCityYield,climateBuildReason,climateProductionUtility,climateSitePenalty,climateDanger,recaptureCarbon,recordDeforestation,coastalWorkBlocked} from './climate.mjs';

const gameTime=g=>g.realtime?.time??g.turn*20;
const distance=(g,a,b)=>dist(a,b,g.map);
const round=n=>Math.round(n*100)/100;
const sum=(a,k)=>a.reduce((s,v)=>s+(v[k]||0),0);
const aliveUnits=g=>g.units.filter(u=>u.hp>0);
const has=(p,k)=>p.techs.includes(k)||p.civics.includes(k);
const ownedCities=(g,p)=>g.cities.filter(c=>c.owner===p.id);
const ownedUnits=(g,p)=>g.units.filter(u=>u.owner===p.id&&u.hp>0);
const eligible=(p,item)=>!((item.tech&&!has(p,item.tech))||(item.civic&&!has(p,item.civic)));
const advances=p=>[...p.techs.map(k=>TECHS[k]),...p.civics.map(k=>CIVICS[k])].filter(Boolean);
const wallCapacity=cityWallCapacity;
const tileOf=(g,entity)=>g.map.tiles[entity.tile];
// Per-search occupancy index. Valid only while no unit moves (inside reachable/evaluation scopes).
let occupancyScope=null;
function occupancyFor(g){return occupancyScope&&occupancyScope.g===g&&occupancyScope.units===g.units?occupancyScope:null;}
function buildOccupancy(g){const byTile=new Map(),reserved=new Map(),byId=new Map();for(const v of g.units){if(!byId.has(v.id))byId.set(v.id,v);if(!(v.hp>0))continue;let here=byTile.get(v.tile);if(!here)byTile.set(v.tile,here=[]);here.push(v);if(['move','rebase'].includes(v.activity?.action.type)){let r=reserved.get(v.activity.to);if(!r)reserved.set(v.activity.to,r=[]);r.push(v);}}return {g,units:g.units,byTile,reserved,byId};}
const visibleSets=new WeakMap();
// p.visible is replaced, never mutated in place, so the array identity keys the set.
function visibleSet(p){let set=visibleSets.get(p.visible);if(!set){set=new Set(p.visible);visibleSets.set(p.visible,set);}return set;}
export function linkedPartner(g,u){if(u?.linkedUnit!==undefined){const index=occupancyFor(g);if(index){const v=index.byId.get(u.linkedUnit);return v&&v.linkedUnit===u.id&&v.owner===u.owner&&v.hp>0&&u.hp>0?v:undefined;}}return u?.linkedUnit===undefined?undefined:g.units.find(v=>v.id===u.linkedUnit&&v.linkedUnit===u.id&&v.owner===u.owner&&v.hp>0&&u.hp>0);}
export function clearBrokenLinks(g){for(const u of g.units)if(u.linkedUnit!==undefined&&!linkedPartner(g,u))delete u.linkedUnit;}
export function movementAllowance(g,u){const partner=linkedPartner(g,u);return (u.greatPerson&&tileOf(g,u)?.road?4:unitMovement(u,g.players[u.owner],gameTime(g),partner?.tile===u.tile?partner:null))+heritageMovementBonus(g,u)+religionMovement(g,u);}
function unlinkUnit(g,u){const partner=linkedPartner(g,u);if(partner){delete partner.linkedUnit;if(partner.activity?.action.type==='move'&&u.activity?.action.type==='move'&&partner.activity.from===u.activity.from&&partner.activity.to===u.activity.to){delete partner.activity;partner.cooldownUntil=Math.max(partner.cooldownUntil||0,gameTime(g)+.5);}}delete u.linkedUnit;}
export function canLinkUnits(g,u,v){return !!u&&!!v&&u.id!==v.id&&u.owner===v.owner&&u.hp>0&&v.hp>0&&u.linkedUnit===undefined&&v.linkedUnit===undefined&&!u.activity&&!v.activity&&!u.acted&&!v.acted&&u.moves>0&&v.moves>0&&!receivingTreatment(g,u)&&!receivingTreatment(g,v)&&![u,v].some(x=>['sea','air'].includes(UNITS[x.type].domain)||x.type==='envoy'||unitTransport(x,tileOf(g,x)))&&!!UNITS[u.type].civilian!==!!UNITS[v.type].civilian&&distance(g,tileOf(g,u),tileOf(g,v))<=1;}
export function tileReserved(g,tile,except=[]){const index=occupancyFor(g);if(index){const list=index.reserved.get(tile);return !!list&&list.some(v=>!except.includes(v.id));}return g.units.some(v=>v.hp>0&&!except.includes(v.id)&&['move','rebase'].includes(v.activity?.action.type)&&v.activity.to===tile);}
export function deploymentFree(g,tile){return !g.units.some(v=>v.hp>0&&v.tile===tile)&&!tileReserved(g,tile);}
export function operationalAirport(g,p,t){return !!t&&t.owner===p.id&&t.district?.item==='airport'&&!t.pillaged&&g.cities.some(c=>c.id===t.district.city&&c.owner===p.id&&hasBuilding(c,'airport'));}
export function operationalAirBase(g,p,u){const carrier=carrierFor(g,u);return carrier?!carrier.activity:operationalAirport(g,p,tileOf(g,u));}
// Air missions cross terrain but still respect neutral airspace and cylindrical seams.
export function flightAllowed(g,p,u,target,knownOnly=false){
 const from=tileOf(g,u),n=distance(g,from,target);let endQ=target.q;
 if(g.map.wrapX)endQ=[target.q-g.map.width,target.q,target.q+g.map.width].sort((a,b)=>(Math.abs(a-from.q)+Math.abs(a+target.r-from.q-from.r))-(Math.abs(b-from.q)+Math.abs(b+target.r-from.q-from.r)))[0];
 for(let i=1;i<=n;i++){const f=i/n,q=from.q+(endQ-from.q)*f,r=from.r+(target.r-from.r)*f,y=-q-r;let x=Math.round(q),z=Math.round(r),yy=Math.round(y);const dx=Math.abs(x-q),dz=Math.abs(z-r),dy=Math.abs(yy-y);if(dx>dy&&dx>dz)x=-yy-z;else if(dz>dy)z=-x-yy;const actual=g.map.index[canonicalTileKey(x,z,g.map)];if(!actual)return false;const t=knownOnly&&!p.visible.includes(actual.id)?p.knownTiles?.[actual.id]:actual;if(t&&!canEnterTerritory(g,u,t))return false;}
 return true;
}
export function rebaseTargets(g,p,u){
 if(UNITS[u.type]?.domain!=='air'||u.acted||u.moves<=0||g.realtime&&(u.moveUntil||0)>gameTime(g)||carrierFor(g,u)?.activity)return [];
 const bases=g.map.tiles.filter(t=>t.id!==u.tile&&operationalAirport(g,p,t)&&deploymentFree(g,t.id)).map(t=>({tile:t.id}));
 bases.push(...ownedUnits(g,p).filter(c=>c.id!==u.carrierId&&deckAvailable(g,c,u.id)).map(c=>({tile:c.tile,carrier:c.id})));
 return bases.filter(base=>distance(g,tileOf(g,u),g.map.tiles[base.tile])<=UNITS[u.type].rebaseRange&&flightAllowed(g,p,u,g.map.tiles[base.tile],true)).map(base=>({...base,seconds:Math.max(2,distance(g,tileOf(g,u),g.map.tiles[base.tile])*.4)}));
}
function leaderParts(p,time,forceActive=false){const leader=leaderFor(p);return [leader.passive,(forceActive||(p.leaderAbility?.activeUntil||0)>time)?leader.active:null].filter(Boolean);}
export function leaderCityBonuses(g,p,c,forceActive=false){
  const flat={},multipliers={},t=tileOf(g,c),peace=!Object.values(p.relations).some(r=>r.status==='war');
  const count=when=>{
    if(when==='capital')return Number(c.isCapital&&c.originalOwner===p.id);
    if(when==='river')return Number(t.river);if(when==='coast')return Number(neighbors(g.map,t).some(isWater));
    if(when==='capitalOrWalls')return Number(c.isCapital&&c.originalOwner===p.id||hasBuilding(c,'walls'));if(when==='war')return Number(!peace);if(when==='peace')return Number(peace);if(when==='religion')return Number(!!p.religion&&c.religion===p.id);
    if(['campus','holy','industrial','commercial','theater','harbor','walls'].includes(when))return Number(hasBuilding(c,when));
    if(['route','domesticRoute','foreignRoute'].includes(when))return Math.min(4,g.routes.filter(r=>r.from===c.id&&r.owner===p.id&&g.cities.some(other=>other.id===r.to&&(when==='route'||(other.owner===p.id)===(when==='domesticRoute')))).length);
    const match={workedMine:n=>n.improvement==='mine',workedPasture:n=>n.improvement==='pasture',workedHillFarm:n=>n.hill&&n.improvement==='farm',workedHill:n=>n.hill}[when];
    return match?Math.min(4,(c.worked||[]).filter(id=>match(g.map.tiles[id])).length):0;
  };
  for(const part of leaderParts(p,gameTime(g),forceActive))for(const rule of part.cities||[]){const n=count(rule.when);for(const [key,value]of Object.entries(rule.flat))flat[key]=(flat[key]||0)+n*value;for(const [key,value]of Object.entries(rule.multipliers))multipliers[key]=(multipliers[key]||0)+n*value;}
  return {flat,multipliers};
}
export function leaderUnitBonus(g,u,defending=false,forceActive=false){
  const p=g.players[u.owner];if(!p||UNITS[u.type].civilian||unitTransport(u,tileOf(g,u)))return 0;
  const s=UNITS[u.type],t=tileOf(g,u),cavalry=s.class==='cavalry',melee=s.domain!=='sea'&&!s.ranged&&!s.siege&&!cavalry&&u.type!=='scout',home=t.owner===p.id;
  const conditions={cavalry,cavalryOpen:cavalry&&!isWater(t)&&!t.hill&&!t.feature,melee,meleeOrCavalry:melee||cavalry,assault:!defending&&(melee||cavalry),homeDefense:defending&&home,cavalryHomeDefense:defending&&home&&cavalry,siege:!!s.siege,cavalryOrSiege:cavalry||s.siege,hillDefense:defending&&t.hill};
  return leaderParts(p,gameTime(g),forceActive).flatMap(part=>part.units||[]).reduce((sum,rule)=>sum+(conditions[rule.when]?rule.combat:0),0);
}
export function leaderAbilityUtility(g,p){
  const leader=leaderFor(p);if(!leader.active)return ownedCities(g,p).length?120:-100;
  let utility=0;const time=gameTime(g),base=nationalEffects(p,time),active=leader.effects;
  for(const c of ownedCities(g,p)){
    const y=cityYields(g,c),before=leaderCityBonuses(g,p,c),after=leaderCityBonuses(g,p,c,true);
    for(const key of [...YIELD_KEYS,'tourism'])utility+=Math.max(0,(after.flat[key]||0)-(before.flat[key]||0))+y[key]*Math.max(0,(active[key]||0)+(after.multipliers[key]||0)-(before.multipliers[key]||0))/Math.max(.5,1+(base[key]||0));
    if(c.production)utility+=Math.max(0,productionMultiplier(p,c.production.item,time,true)-productionMultiplier(p,c.production.item,time))*y.production*2;
    if(c.occupation>0&&leader.active.instant?.occupationRelief)utility+=12;
    if(uniqueEnabled(p)){const instant=leader.active.instant;if(instant?.loyalty&&(!instant.occupationRelief||c.occupation>0))utility+=Math.min(instant.loyalty,100-c.loyalty)*.5;if(instant?.wonderAndWallProgressCycles&&c.production&&(PRODUCTION[c.production.item]?.kind==='wonder'||['walls','medievalwalls','renaissancewalls','steelwalls'].includes(baseItem(c.production.item))))utility+=Math.min(Math.max(0,orderCost(g,c)-c.production.progress),y.production*instant.wonderAndWallProgressCycles)*.6;}
  }
  const war=Object.values(p.relations).some(r=>r.status==='war');
  for(const u of ownedUnits(g,p).filter(u=>(!UNITS[u.type].civilian||uniqueEnabled(p)&&leader.active.instant?.unitClass==='cavalryOrMedical'&&UNITS[u.type].medical)&&!unitTransport(u,tileOf(g,u)))){
    if(war)utility+=Math.max(0,leaderUnitBonus(g,u,false,true)-leaderUnitBonus(g,u))+Math.max(0,leaderUnitBonus(g,u,true,true)-leaderUnitBonus(g,u,true))+(active.combat||0)+(UNITS[u.type].domain==='sea'?active.navalCombat||0:0);
    const instant=leader.active.instant;if(instant?.heal&&(!instant.homeOnly||tileOf(g,u).owner===p.id)&&(!uniqueEnabled(p)||healEligible(g,p,u,instant)))utility+=Math.min(instant.heal,maxUnitHp(u.type)-u.hp);
  }
  if(uniqueEnabled(p)){const instant=leader.active.instant;if(instant?.scienceBurst&&p.research)utility+=instant.scienceBurst*(1+civilizationEra(p)*.35)*.4;if(instant?.tourismPerTheater)utility+=Math.min(8,ownedCities(g,p).filter(c=>hasBuilding(c,'theater')).length)*instant.tourismPerTheater*.2;if(active.congressVotes&&g.congress&&!g.congress.current&&g.congress.nextTurn-g.turn<=leader.duration/20)utility+=20;}
  return utility>0?Math.min(150,30+utility*3):-100;
}
// Presentation events are transient and never change saves or combat randomness.
const visualJournals=new WeakMap();
let visualEpoch=0;
function visualJournal(g){if(!visualJournals.has(g))visualJournals.set(g,{epoch:++visualEpoch,sequence:0,events:[]});return visualJournals.get(g);}
export function visual(g,kind,actor,details={}){
  const journal=visualJournal(g),entities=[actor,details.target].filter(Boolean);
  const audience=g.players.filter(p=>entities.every(e=>e.owner===p.id||p.visible.includes(e.tile)&&unitDetected(g,e,p.id))&&(kind!=='move'||actor.owner===p.id||[details.from,...(details.path||[])].every(id=>p.visible.includes(id)))).map(p=>p.id);
  const {activity:ignoredActorActivity,...safeActor}=actor;const safeDetails={...details};if(details.target){const {activity:ignoredTargetActivity,...target}=details.target;safeDetails.target=target;}
  journal.events.push({id:++journal.sequence,kind,actor:{...safeActor,...(UNITS[actor.type]?.rangedTech?{ranged:unitHasRanged(g.players[actor.owner],actor.type)}:{})},turn:g.turn,time:g.realtime?.time,...safeDetails,audience});
  journal.events=journal.events.slice(-256);
}
function visualSnapshot(g,view,visible){const journal=visualJournal(g);return {...journal,view,events:journal.events.filter(e=>view<0||e.audience.includes(view)&&[e.actor,e.target].filter(Boolean).every(u=>u.owner===view||visible.has(u.tile)&&unitDetected(g,u,view))).map(({audience,...e})=>({...e,actor:projectUnit(g,e.actor,view),...(e.target?{target:projectUnit(g,e.target,view)}:{})}))};}
export function event(g,type,text,player=null,tile=null){migrateLegacyAges(g);
  const p=player===null?null:g.players[player];
  const goal=type==='city'?'city':type==='greatperson'&&/加入了/.test(text)?'greatperson':type==='conquest'&&/占领了/.test(text)?'conquest':type==='wonder'&&/建成了世界奇观/.test(text)?'wonder':type==='religion'&&/创立了/.test(text)?'religion':null;
  if(p&&goal)ageRecord(g,p,[goal],`${goal}:${goal==='religion'?p.id:goal==='greatperson'?text:tile??text}`);
  g.events.unshift({id:g.eventId++,turn:g.turn,type,text,player,tile});g.events=g.events.slice(0,220);}

export function createGame(options={}) {
  if(options.playMode!==undefined&&!['turns','realtime'].includes(options.playMode))throw Error('Invalid play mode.');
  if(options.leaderRulesVersion!==undefined&&![1,2].includes(options.leaderRulesVersion))throw Error('Invalid leader rules version.');
  normalizeAiAlgorithm(options.aiAlgorithm);
  for(const [key,table]of [['rainfall',WORLD_RAINFALL],['resourceAbundance',RESOURCE_ABUNDANCE]])if(options[key]!==undefined&&(typeof options[key]!=='string'||!Object.hasOwn(table,options[key])))throw Error('Invalid world generation setting: '+key);
  if(options.barbarians!==undefined&&typeof options.barbarians!=='boolean')throw Error('Invalid barbarian setting.');
  if(options.naturalWondersEnabled!==undefined&&typeof options.naturalWondersEnabled!=='boolean')throw Error('Invalid natural wonder setting.');
  if(options.climateEnabled!==undefined&&typeof options.climateEnabled!=='boolean')throw Error('Invalid climate setting.');
  if(options.disasterIntensity!==undefined&&(!Number.isInteger(options.disasterIntensity)||options.disasterIntensity<0||options.disasterIntensity>4))throw Error('Invalid disaster intensity.');
  const count=Math.max(1,Math.min(MAX_CIVILIZATIONS,Math.floor(Number(options.players)||(MAP_SIZES[options.size]||MAP_SIZES.huge).players)));
  const seed=String(options.seed||`WORLD-${Date.now().toString(36).toUpperCase()}`);
  const sizeKey=Object.hasOwn(MAP_SIZES,options.size)?options.size:'huge',dimensions=MAP_SIZES[sizeKey],size=[dimensions.width,dimensions.height];
  const g={version:VERSION,id:`${Date.now().toString(36)}-${seedNumber(seed).toString(36)}`,seed,turn:1,maxTurns:Math.max(40,Math.min(2000,Math.floor(Number(options.maxTurns))||GAME_SPEEDS[options.gameSpeed||'standard']?.maxTurns||650)),rngState:seedNumber(seed+'combat'),map:generateMap(seed,...size,count,options.mapType||'random',options.wrapX!==false,{rainfall:options.rainfall||'standard',resourceAbundance:options.resourceAbundance||'standard'}),players:[],units:[],cities:[],routes:[],wonders:{},events:[],eventId:1,nextId:1,winner:null,history:[],victoryRules:{version:1,migratedAt:1,awards:{}},settings:{rainfall:options.rainfall||'standard',resourceAbundance:options.resourceAbundance||'standard',naturalWondersEnabled:options.naturalWondersEnabled!==false,climateEnabled:options.climateEnabled!==false,disasterIntensity:options.disasterIntensity??2,contactRulesVersion:2,playMode:options.playMode||'realtime',leaderRulesVersion:options.leaderRulesVersion??2,aiAlgorithm:normalizeAiAlgorithm(options.aiAlgorithm),gameSpeed:Object.hasOwn(GAME_SPEEDS,options.gameSpeed)?options.gameSpeed:'standard',barbarians:options.barbarians!==false,autosaveEnabled:options.autosaveEnabled!==false,autosaveEvery:[3,5,10].includes(options.autosaveEvery)?options.autosaveEvery:3,victories:victoryOptions(options.victories),balanceVersion:2,size:sizeKey},lastActions:[]};
  const leaderKeys=selectLeaderKeys(count,options.leaders);
  for(let i=0;i<count;i++){
    const p={...civilizationTemplate(i),alive:true,gold:60,faith:0,techs:[],civics:[],research:null,researchProgress:{},civic:'code',civicProgress:{},boosts:[],inspirations:[],government:'chiefdom',policies:[],met:[],relations:{},explored:[],visible:[],scienceTotal:0,cultureTotal:0,tourism:0,spaceStage:0,spaceLaunchDone:false,capital:null,citySequence:0,religion:null,driver:{file:civilizationTemplate(i).file,status:'ready',calls:0,failures:0,lastMs:0,message:''},memory:null,manual:options.playMode==='turns'&&i===0,leaderKey:leaderKeys[i],leader:leaderFor({id:i,leaderKey:leaderKeys[i]}).name,doctrine:Object.hasOwn(NATIONAL_POLICIES,options.doctrines?.[i])?options.doctrines[i]:'balanced',strategy:Object.hasOwn(NATIONAL_STRATEGIES,options.strategies?.[i])?options.strategies[i]:'adaptive',planRevision:0};
    p.leaderRulesVersion=g.settings.leaderRulesVersion;Object.assign(p,historicalIdentity(p.leaderKey,traditionIndex(p)));p.trait=['学术传统','军务传统','农耕传统','商贸传统','艺文传统','航海传统','信仰传统','工造传统'][traditionIndex(p)];if(uniqueEnabled(p))p.description=CIVS[traditionIndex(p)].description.replace('战斗力 +4','战斗力 +2').replace('军事单位生产 +20%','军事单位生产 +10%');
    g.players.push(p);
    const start=g.map.starts[i];
    const founder=addUnit(g,i,'settler',start),guard=addUnit(g,i,'warrior',start);founder.linkedUnit=guard.id;guard.linkedUnit=founder.id;
    const scoutTile=tilesInRange(g.map,g.map.tiles[start],2).find(t=>!isWater(t)&&t.terrain!=='mountain'&&deploymentFree(g,t.id));
    if(scoutTile)addUnit(g,i,'scout',scoutTile.id);
  }
  {const pal=assignCivPalette(g.players.length,(i,j)=>distance(g,g.map.tiles[g.map.starts[i]],g.map.tiles[g.map.starts[j]]));g.players.forEach((p,i)=>{if(pal[i]){p.color=pal[i].color;p.secondaryColor=pal[i].secondaryColor;}});}
  for(const p of g.players)for(const other of g.players)if(p.id!==other.id)p.relations[other.id]={status:'peace',since:1,grievances:0};
  if(g.settings.barbarians){for(const t of g.map.tiles.filter(t=>t.camp).slice(0,10))addUnit(g,-1,'warrior',t.id);}
  else for(const t of g.map.tiles)t.camp=false;
  initializeEncounters(g,{populate:true});refreshVisibility(g);event(g,'world',`新的世界已生成。${count} 个文明正走向未知的地平线。`);
  g.map.roadRules=1;initializeTerritories(g);initializeReligion(g);initializeWarfare(g);initializeCourt(g);for(const p of g.players)initializePolitics(g,p);initializeCongress(g);initializeHeritage(g);initializeGovernors(g);initializeTourism(g);initializeEspionage(g);initializeCityStates(g,{seed:true});initializeVictoryRules(g);initializeNaturalWonders(g,{populate:true});initializeClimate(g);ensureAges(g);refreshVisibility(g);recordHistory(g);return g;
}
export function addUnit(g,owner,type,tile){
  const spec=UNITS[type],p=g.players[owner];
  const u={id:g.nextId++,owner,type,tile,hp:maxUnitHp(type),moves:spec.moves,charges:spec.charges||0,xp:0,level:0,fortified:false,acted:false};
  if(type==='builder'&&p){if(p.policies.includes('serfdom'))u.charges+=2;if(operationalWonder(g,'pyramids',owner))u.charges++;}
  if(spec.initialTraits){u.veteranTraits=[...spec.initialTraits];u.innateTraits=[...spec.initialTraits];}if(spec.initialLevel){u.level=spec.initialLevel;u.xp=u.level*25;}
  if(p)u.charges+=(type==='builder'?nationalEffects(p,gameTime(g)).builderCharges||0:type==='missionary'?nationalEffects(p,gameTime(g)).missionaryCharges||0:0);
  g.units.push(u);return u;
}
const visibilityBatches=new WeakSet(),dirtyVisibility=new WeakSet();
const visionGeometry=new WeakMap();
function sameVisibleMetadata(a,b){
 if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(key=>sameVisibleMetadata(a[key],b[key]));
}
function visionCells(g,tile,range){
 const geometry=g.map.width+':'+g.map.height+':'+g.map.wrapX;let cache=visionGeometry.get(g.map);
 if(!cache||cache.geometry!==geometry){cache={geometry,fields:new Map()};visionGeometry.set(g.map,cache);}
 const key=tile+':'+range;if(!cache.fields.has(key)){if(cache.fields.size>=6000)cache.fields.delete(cache.fields.keys().next().value);cache.fields.set(key,tilesInRange(g.map,g.map.tiles[tile],range).map(t=>t.id));}return cache.fields.get(key);
}
export function withVisibilityBatch(g,work){
  if(visibilityBatches.has(g))return work();visibilityBatches.add(g);
  try{return work();}finally{visibilityBatches.delete(g);if(dirtyVisibility.has(g)){dirtyVisibility.delete(g);refreshVisibility(g);}}
}
export function refreshVisibility(g){
  if(visibilityBatches.has(g)){dirtyVisibility.add(g);return;}
  invalidateFleets(g);
  const territories=new Map(g.players.map(p=>[p.id,[]]));for(const t of g.map.tiles)territories.get(t.owner)?.push(t.id);
  for(const p of g.players){
    const visible=new Set(),explored=new Set(p.explored);
    const sources=[...ownedUnits(g,p).map(u=>({tile:u.tile,range:(UNITS[u.type].vision||2)+(heritageAura(g,u).waterSight||0)})),...ownedCities(g,p).map(c=>({tile:c.tile,range:operationalWonder(g,'great_lighthouse',p.id)&&g.wonders.great_lighthouse.city===c.id?4:3}))];
    for(const id of territories.get(p.id)||[])visible.add(id);
    for(const other of g.players)if(religionIntelAllowed(g,p.id,other.id)){for(const id of territories.get(other.id)||[])visible.add(id);for(const unit of ownedUnits(g,other))for(const id of visionCells(g,unit.tile,(UNITS[unit.type].vision||2)+(heritageAura(g,unit).waterSight||0)))visible.add(id);for(const city of ownedCities(g,other))for(const id of visionCells(g,city.tile,operationalWonder(g,'great_lighthouse',other.id)&&g.wonders.great_lighthouse.city===city.id?4:3))visible.add(id);}
    for(const source of sources)for(const id of visionCells(g,source.tile,source.range))visible.add(id);
    const visibleIds=[...visible].sort((a,b)=>a-b);for(const id of visibleIds)explored.add(id);
    if(p.visible.length!==visibleIds.length||p.visible.some((id,i)=>id!==visibleIds[i]))p.visible=visibleIds;
    if(p.explored.length!==explored.size)p.explored=[...explored];p.knownTiles??={};p.knownCities??={};
    discoverNaturalWonders(g,p,explored,{event,era:(world,player,key)=>ageNaturalDiscovery(world,player,NATURAL_WONDERS[key].name)});
    let routeChanged=false;
    for(const id of visible){const t=g.map.tiles[id],old=p.knownTiles[id];
      if(!old||old.terrain!==t.terrain||old.owner!==t.owner||old.cityId!==t.cityId||old.hill!==t.hill||old.feature!==t.feature||old.river!==t.river||old.road!==t.road||old.roadPillaged!==t.roadPillaged||old.cityStateTerritory!==t.cityStateTerritory)routeChanged=true;
      const district=visibleDistrict(g,t.district);
      if(!old||old.naturalWonder!==t.naturalWonder||old.terrain!==t.terrain||old.owner!==t.owner||old.cityId!==t.cityId||old.hill!==t.hill||old.feature!==t.feature||old.resource!==t.resource||old.improvement!==t.improvement||old.ruin!==t.ruin||old.village!==t.village||old.camp!==t.camp||old.road!==t.road||old.roadPillaged!==t.roadPillaged||old.pillaged!==t.pillaged||old.territoryCity!==t.territoryCity||old.cityStateTerritory!==t.cityStateTerritory||old.cityState!==t.cityState||old.river!==t.river||!sameVisibleMetadata(old.riverEdges,t.riverEdges)||!sameVisibleMetadata(old.district,district)||!sameVisibleMetadata(old.fort,t.fort||null)||!sameVisibleMetadata(old.fortRuin,t.fortRuin||null))p.knownTiles[id]={...publicEncounterTile(t),...naturalTileProjection(g,p,t),riverEdges:t.riverEdges?.slice(),district,fort:t.fort?{...t.fort}:null,fortRuin:t.fortRuin?{...t.fortRuin}:null};
    }
    if(routeChanged)routeKnowledgeChanged(g,p);
    for(const c of g.cities.filter(c=>visible.has(c.tile))){if(!p.knownCities[c.id]&&c.owner!==p.id&&neighbors(g.map,tileOf(g,c)).some(isWater)){const reward=Math.max(0,...g.units.filter(u=>u.owner===p.id&&u.hp>0&&UNITS[u.type].discoveryReward&&distance(g,tileOf(g,u),tileOf(g,c))<=(UNITS[u.type].vision||2)).map(u=>UNITS[u.type].discoveryReward));p.gold+=reward;p.faith+=reward;}p.knownCities[c.id]={id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:!!c.isCapital};rememberCityAppearance(g,p,c);}
    for(const other of g.players){if(other.id===p.id||p.met.includes(other.id))continue;
      if(g.cities.some(c=>c.owner===other.id&&visible.has(c.tile))||g.units.some(u=>u.owner===other.id&&visible.has(u.tile)&&unitDetected(g,u,p.id))){p.met.push(other.id);if(!other.met.includes(p.id))other.met.push(p.id);boost(g,p,'writing');boost(g,other,'writing');event(g,'diplomacy',`${p.name} 与 ${other.name} 首次相遇。`,p.id);}
    }
  }
  discoverCityStates(g,event);diplomaticIntelligence(g);
}
function rememberedTile(p,t){return visibleSet(p).has(t.id)?t:p.knownTiles?.[t.id]||{...t,owner:null,cityId:null,district:null,improvement:null,camp:false,village:false,ruin:false,resource:null,feature:null,fort:null,fortRuin:null,road:false,roadPillaged:false,pillaged:false};}
function planningTile(g,p,t){const memory=rememberedTile(p,t);return {...memory,...naturalTileProjection(g,p,memory),weather:visibleSet(p).has(t.id)||t.owner===p.id?climateTileState(g,t):undefined};}
export function boost(g,p,key){if(!p.boosts.includes(key)){p.boosts.push(key);if(activeGovernor(g,p,'gov_educator','aa'))p.scienceBank=(p.scienceBank||0)+(TECHS[key]?.cost||0)*.15;if(p.research===key)event(g,'science',`${p.short} 触发尤里卡：${TECHS[key].name}。`,p.id);}}
function inspire(g,p,key){if(!p.inspirations.includes(key)){p.inspirations.push(key);if(p.civic===key)event(g,'culture',`${p.short} 获得市政灵感：${CIVICS[key].name}。`,p.id);}}
export function canSettle(g,p,t){return t&&!t.naturalWonder&&!t.cityState&&!t.cityStateTerritory&&!t.fort&&!t.district&&!isWater(t)&&t.terrain!=='mountain'&&(t.owner===null||t.owner===p.id)&&g.cities.every(c=>distance(g,t,tileOf(g,c))>=4)&&(g.cityStates?.states||[]).filter(st=>st.capturedBy===null).every(st=>distance(g,t,g.map.tiles[st.tile])>=4);}
function canSettleRemembered(g,p,t){return t&&!t.naturalWonder&&!t.cityState&&!t.fort&&!t.district&&!isWater(t)&&t.terrain!=='mountain'&&(t.owner===null||t.owner===p.id)&&[...ownedCities(g,p),...Object.values(p.knownCities||{})].every(c=>distance(g,t,tileOf(g,c))>=4)&&(g.cityStates?.states||[]).filter(st=>st.capturedBy===null&&st.met.includes(p.id)).every(st=>distance(g,t,g.map.tiles[st.tile])>=4);}
export function settlementValue(g,p,t,known=new Set(p.explored),remembered=false){
  if(!(remembered?canSettleRemembered(g,p,t):canSettle(g,p,t)))return -100;
  const near=tilesInRange(g.map,t,2).filter(n=>known.has(n.id)).map(n=>planningTile(g,p,n));
  let score=near.reduce((s,n)=>{const y=tileYield(n,p),natural=naturalTileBonus(n,p),resource=RESOURCES[n.resource];return s+y.food*2+y.production*1.4+y.gold*.4+(natural.science||0)*1.5+(natural.culture||0)*1.2+(natural.faith||0)+(resource&&(!resource.tech||has(p,resource.tech))?1.4:0);},0);
  if(t.river)score+=10;if(neighbors(g.map,t).some(n=>known.has(n.id)&&isWater(remembered?rememberedTile(p,n):n)))score+=3;
  const own=ownedCities(g,p);if(own.length){const d=Math.min(...own.map(c=>distance(g,t,tileOf(g,c))));score-=Math.max(0,d-6)*2;}
  if(t.terrain==='desert'||t.terrain==='snow')score-=20;
  const districtSites=near.filter(n=>n.cityId==null&&!n.naturalWonder&&!n.district&&!isWater(n)&&n.terrain!=='mountain'&&(n.owner==null||n.owner===p.id));
  score+=Math.min(18,Object.entries({campus:2.5,theater:2,holy:1.5,industrial:2}).reduce((sum,[item,weight])=>sum+weight*Math.max(0,...districtSites.map(n=>naturalAdjacency(g,p,n,item))),0));
  score-=climateSitePenalty(g,p,t,known);
  return round(score);
}
function claimCityTile(g,t,c){
  if(t.cityStateTerritory)return;t.owner=c.owner;t.territoryCity=c.id;
  for(const u of g.units)if(u.tile===t.id&&u.owner>=0&&u.owner!==c.owner&&!canEnterTerritory(g,u,t))u.borderExitOwner=c.owner;
}
export function foundCity(g,p,u){
  const t=tileOf(g,u);if(u.type!=='settler'||!canSettle(g,p,t))throw new Error('无法在此建城，城市之间需要至少四格距离。');
  const nation=historicalNation(p),names=nation?.cityNames||civilizationTemplate(p.id).cityNames;
  const c={id:g.nextId++,owner:p.id,originalOwner:p.id,name:p.citySequence===0?p.capital===null?p.capitalName||nation?.capital||civilizationTemplate(p.id).capital:names[0]:names[(p.citySequence-1)%names.length]+(p.citySequence>6?String(p.citySequence):''),tile:t.id,population:1+(u.governorNewPopulation||0),food:0,culture:0,production:null,storedProduction:0,buildings:[],districts:[],hp:200,walls:0,loyalty:100,occupation:0,religion:null,religionPressure:0,isCapital:p.capital===null,attacked:false};
  p.citySequence++;if(p.capital===null)p.capital=c.id;
  recordDeforestation(g,p,t.feature);g.cities.push(c);t.cityId=c.id;t.owner=p.id;t.feature=null;t.ruin=false;t.village=false;t.improvement=null;
  for(const n of tilesInRange(g.map,t,1))if(n.owner===null||n.cityId===c.id)claimCityTile(g,n,c);initializeReligion(g);
  if(nationalEffects(p,gameTime(g)).freeMonumentOnFound)c.buildings.push(replacementFor(p,'monument'));
  g.units=g.units.filter(x=>x.id!==u.id);
  boost(g,p,'pottery');if(neighbors(g.map,t).some(isWater))boost(g,p,'sailing');
  if(ownedCities(g,p).filter(x=>neighbors(g.map,tileOf(g,x)).some(isWater)).length>=2)boost(g,p,'celestial');
  if(ownedCities(g,p).length>=2&&!p.inspirations.includes('empire'))p.inspirations.push('empire');
  event(g,'city',`${p.short} 建立了 ${c.name}。`,p.id,t.id);return c;
}
function governorTrained(g,p,c,u){if(governorHas(g,c,'gov_agrarian','aa')&&u.type==='builder')u.charges++;if(governorHas(g,c,'gov_agrarian','b')&&u.type==='settler')u.governorNewPopulation=1;if(governorHas(g,c,'gov_warlord','a')&&!UNITS[u.type].civilian)u.xp+=10;}
function annexCityState(g,p,s){for(const tile of g.map.tiles)if(tile.cityStateTerritory===s.id)delete tile.cityStateTerritory;const t=g.map.tiles[s.tile],c={id:g.nextId++,owner:p.id,originalOwner:p.id,name:s.name,tile:s.tile,population:3,food:0,culture:0,production:null,storedProduction:0,buildings:['monument'],districts:[],hp:100,walls:0,loyalty:70,occupation:3,religion:null,religionPressure:0,isCapital:false,attacked:false,cityStateOrigin:s.id};recordDeforestation(g,p,t.feature);g.cities.push(c);t.cityId=c.id;for(const n of tilesInRange(g.map,t,1))if(n.owner===null)claimCityTile(g,n,c);t.owner=p.id;for(const id of s.territory||[])if(g.map.tiles[id].owner===null)claimCityTile(g,g.map.tiles[id],c);initializeReligion(g);c.capturePending={previousOwner:null,previousState:s.id,turn:g.turn};if(!p.manual)resolveCityDisposition(g,p,{type:'keepCity',city:c.id});}
function liberateCityState(g,p,s){const c=g.cities.find(c=>c.cityStateOrigin===s.id&&c.owner===p.id);if(!c)throw Error('城邦城市已不存在。');if(g.cities.filter(c=>c.owner===p.id).length<2)throw Error('不能释放本国最后一城。');if(Object.values(g.wonders).some(w=>w.city===c.id)||g.heritage.works.some(w=>w.city===c.id||w.transfer?.city===c.id))throw Error('请先迁出巨作；建有奇观的城邦城市不可释放。');for(const t of g.map.tiles)if(t.territoryCity===c.id){t.owner=null;t.territoryCity=null;t.cityId=null;t.district=null;delete t.fort;}g.cities=g.cities.filter(v=>v!==c);g.routes=g.routes.filter(r=>r.from!==c.id&&r.to!==c.id);g.map.tiles[s.tile].cityState=s.id;for(const r of Object.values(p.governors.roster))if(r.city===c.id)r.city=null;}
const evaluationCaches=new WeakMap();
function currentLoyaltyView(g,c,view){if(!c.loyaltyStatus){const cache=evaluationCaches.get(g);let pressures=cache?.loyaltyPressures;if(!pressures){pressures=citizenPressures(g);if(cache)cache.loyaltyPressures=pressures;}c.loyaltyStatus=loyaltyStatus(g,c,cityYields(g,c),pressures.get(c.id));}return loyaltyView(g,c,view);}
function domesticState(g,p,defenses){const cache=evaluationCaches.get(g);if(cache){cache.domestic??=new Map();if(!cache.domestic.has(p.id))cache.domestic.set(p.id,domesticSituation(g,p,defenses,developmentPlan(g,p)));return cache.domestic.get(p.id);}return domesticSituation(g,p,defenses,developmentPlan(g,p));}
function evaluate(g,work){if(evaluationCaches.has(g))return work();evaluationCaches.set(g,{resources:new Map()});try{return withTacticalCache(g,work);}finally{evaluationCaches.delete(g);}}
export function playerResources(g,p){
  const cache=evaluationCaches.get(g);if(cache?.supplies)return cache.supplies[p.id];const supplies=effectiveSupplies(g);if(cache)cache.supplies=supplies;return supplies[p.id];
}
export function housing(g,c){return 3+(nationalEffects(g.players[c.owner],gameTime(g)).housing||0)+(tileOf(g,c).river?2:neighbors(g.map,tileOf(g,c)).some(isWater)?1:0)+c.buildings.reduce((s,k)=>s+(BUILDINGS[k]?.housing||0)+(baseItem(k)==='university'&&!BUILDINGS[k]?.housing?1:0),0)+advances(g.players[c.owner]).reduce((s,a)=>s+(a.housing||0),0);}
export function adjacency(g,p,t,item){
  item=baseItem(item);const ns=neighbors(g.map,t),natural=naturalAdjacency(g,p,t,item);
  if(item==='campus')return natural+ns.filter(n=>n.terrain==='mountain').length*2+Math.floor(ns.filter(n=>n.feature==='jungle').length/2);
  if(item==='holy')return natural+ns.filter(n=>n.terrain==='mountain').length*2+Math.floor(ns.filter(n=>n.feature==='forest').length/2)+holyPantheonAdjacency(g,p,t);
  if(item==='industrial')return natural+ns.filter(n=>n.improvement==='mine'||n.improvement==='quarry').length+ns.reduce((sum,n)=>sum+((n.owner===p.id&&!n.pillaged&&BUILDINGS[n.district?.item]?.industrialAdjacency)||0),0);
  if(item==='commercial')return (t.river?2:0)+(ns.some(n=>baseItem(n.district?.item)==='harbor')?2:0)+ns.reduce((sum,n)=>sum+((n.owner===p.id&&!n.pillaged&&BUILDINGS[n.district?.item]?.industrialAdjacency)||0),0);
  if(item==='theater')return natural+ns.filter(n=>n.district?.kind==='wonder').length*2;
  if(item==='harbor')return ns.filter(n=>n.resource==='fish').length+(ns.some(n=>n.cityId!==null)?2:0);
  return 0;
}
export function cityYields(g,c){
  const p=g.players[c.owner],t=tileOf(g,c),y={food:3,production:2,gold:2+(p.capital===c.id?6:0),science:1+c.population*.7,culture:1+c.population*.3,faith:0,tourism:0};
  Object.assign(y,climateCityYield(g,c,y));
  const religious= religionCityBonuses(g,c,adjacency),heritage=heritageCityBonuses(g,c),terrainBonuses=heritageTileModifiers(g,c),cityHousing=housing(g,c)+heritage.housing+religious.housing+governorBonus(g,{...c,worked:[]}).housing;
  const workable=tilesInRange(g.map,t,3).filter(n=>n.owner===p.id&&n.id!==t.id&&n.terrain!=='mountain'&&!n.cityId&&!n.district);
  const occupied=new Set(g.cities.filter(x=>x.id!==c.id&&x.owner===c.owner).flatMap(x=>x.worked||[]));
  // Tile yields are pure within this assignment. Compute them once rather
  // than repeatedly during sort comparisons; do not cache across mutations.
  const evaluated=new Map(workable.map(n=>{const value=religionTileYield(g,p,n,heritageTileYield(n,climateTileYield(g,n,tileYield(n,p)),terrainBonuses));return [n.id,{value,score:value.food*(c.population>=cityHousing?.8:1.5)+value.production*1.3+value.gold*.4+value.science+value.culture*.8+(value.tourism||0)*.8}];}));
  workable.sort((a,b)=>evaluated.get(b.id).score-evaluated.get(a.id).score||a.id-b.id);
  const specialists=assignSpecialists(g,c,workable.filter(n=>!occupied.has(n.id)).map(n=>evaluated.get(n.id).score));for(const [k,n]of Object.entries(specialists.flat))y[k]+=n;
  c.worked=workable.filter(n=>!occupied.has(n.id)).slice(0,specialists.remaining).map(n=>n.id);
  for(const id of c.worked){const v=evaluated.get(id).value;for(const k of [...YIELD_KEYS,'tourism'])y[k]+=v[k]||0;}
  if(g.wonders.golden_gate?.city===c.id)heritage.flat.tourism=heritageCityBonuses(g,c).flat.tourism;
  const unavailable=new Set(c.districts.filter(d=>g.map.tiles[d.tile].pillaged).flatMap(d=>[d.item,baseItem(d.item)]));
  for(let i=0;i<c.buildings.length;i++)for(const item of c.buildings)if(unavailable.has(BUILDINGS[item]?.building))unavailable.add(item);
  for(const item of c.buildings){const b=BUILDINGS[item]||WONDERS[item];if(WONDERS[item]&&!operationalWonder(g,item,p.id)||unavailable.has(item)||POWER_PLANTS.includes(item)&&POWER_PLANTS.some(key=>POWER_PLANTS.indexOf(key)>POWER_PLANTS.indexOf(item)&&hasBuilding(c,key)&&!unavailable.has(key)))continue;if(b)for(const k of [...YIELD_KEYS,'tourism'])y[k]+=b.yields?.[k]||0;}
  for(const d of c.districts){if(g.map.tiles[d.tile].pillaged)continue;const role=baseItem(d.item),bonus=adjacency(g,p,g.map.tiles[d.tile],role);const key={campus:'science',holy:'faith',industrial:'production',commercial:'gold',theater:'culture',harbor:'gold'}[role];if(key)y[key]+=bonus*(d.item==='campus'&&p.policies.includes('natural')?2:1);if(p.policies.includes('specialists')){y.science++;y.culture++;}}
  for(const w of Object.values(g.wonders).filter(w=>w.city===c.id&&operationalWonder(g,w.item,p.id))){if(!g.heritage)y.tourism+=4;if(traditionIndex(p)===4)y.tourism+=2;}
  for(const route of g.routes.filter(r=>r.from===c.id)){
    const other=g.cities.find(x=>x.id===route.to);if(!other)continue;
    if(other.owner===p.id){y.food+=3;y.production+=2+(heritageEffects(g,p).domesticRouteProduction||0);}else {y.science+=1;y.culture+=1;}y.gold+=routeGold(g,p,route);
  }
  if(traditionIndex(p)===0&&hasBuilding(c,'campus'))y.science+=2;
  if(traditionIndex(p)===5&&neighbors(g.map,t).some(isWater))y.production+=2;
  if(traditionIndex(p)===6&&hasBuilding(c,'holy'))y.culture+=2;
  if(has(p,'astronomy')&&hasBuilding(c,'campus'))y.science+=2;
  if(has(p,'industrial')&&hasBuilding(c,'industrial'))y.production+=2;
  if(has(p,'electricity'))y.science+=2;
  if(p.policies.includes('urban'))y.production+=2;if(p.policies.includes('agriculture'))y.food+=2;if(p.policies.includes('revelation'))y.faith+=2;
  const faithPlayer=g.players.find(o=>o.id===c.religion);if(faithPlayer?.religion)y[RELIGIONS[faithPlayer.religion].yield||'faith']+=3;
  const luxuries=Object.keys(playerResources(g,p)).filter(k=>RESOURCES[k].category==='luxury').length;
  const unique=uniqueCityBonuses(g,p,c,adjacency);for(const [key,n]of Object.entries(unique.flat))y[key]=(y[key]||0)+n;
  for(const [k,n]of Object.entries(religious.flat))y[k]=(y[k]||0)+n;
  const govBonus=governorBonus(g,c,y.faith);for(const [key,n]of Object.entries({...govBonus.flat}))y[key]=(y[key]||0)+n;for(const [key,n]of Object.entries(cityStateBonuses(g,c)))y[key]=(y[key]||0)+n;
  const amenities=2+govBonus.amenities+religious.amenities+heritage.amenities+unique.amenities+luxuries+(p.government==='republic'?1:0)-Math.floor(c.population/2);
  for(const item of [...advances(p),...p.policies.map(k=>POLICIES[k])])for(const [key,value] of Object.entries(item?.effects||{}))y[key]+=value*(item.type==='military'?militaryPolicyMultiplier(p):1);
  for(const [k,n]of Object.entries(heritage.flat))y[k]=(y[k]||0)+n;
  const leaderBonus=leaderCityBonuses(g,p,c),ageBonus=ageCityBonuses(g,p,c),national=nationalEffects(p,gameTime(g));
  for(const [key,n]of Object.entries(ageBonus.flat))y[key]=(y[key]||0)+n;
  for(const [key,n]of Object.entries(leaderBonus.flat))y[key]+=n;
  for(const [key,n]of Object.entries(allianceCityBonus(g,c)))y[key]=(y[key]||0)+n;
  const government=GOVERNMENTS[p.government],congress=congressEffects(g);
  for(const k of YIELD_KEYS){let multiplier=1+(govBonus.multipliers[k]||0)+(heritage.multipliers[k]||0)+(congress[k]||0)+(government[k]||0)+(national[k]||0)+(leaderBonus.multipliers[k]||0)+(ageBonus.multipliers[k]||0);if((traditionIndex(p)===0&&k==='science')||(traditionIndex(p)===2&&k==='food')||(traditionIndex(p)===7&&k==='production'))multiplier+=.2;if(traditionIndex(p)===3&&k==='gold'||traditionIndex(p)===4&&k==='culture')multiplier+=.25;if(traditionIndex(p)===6&&k==='faith')multiplier+=.3;if(k==='gold'&&p.policies.includes('capitalism'))multiplier+=.25;if(k==='science'&&p.policies.includes('rationalism'))multiplier+=.25;if(k==='science'&&has(p,'computers'))multiplier+=.2;if(k==='culture'&&has(p,'media'))multiplier+=.2;
    y[k]*=multiplier*Math.max(.65,1+Math.max(-4,Math.min(3,amenities))*.03)*(c.occupation>0?.55:1)*(c.loyalty<25?.25:c.loyalty<50?.5:c.loyalty<75?.75:1);
    y[k]=round(y[k]);
  }
  y.tourism*=(1+(govBonus.multipliers.tourism||0))*(1+(heritage.multipliers.tourism||0))*(1+(congress.tourism||0))*(1+(national.tourism||0)+(leaderBonus.multipliers.tourism||0)+(ageBonus.multipliers.tourism||0))*(1+(has(p,'printing')?.25:0)+(has(p,'flight')?1:0)+(has(p,'computers')?.5:0)+(has(p,'media')?.25:0)+(p.policies.includes('heritage')?.4:0));
  return {...y,tourism:round(y.tourism),housing:cityHousing,amenities,religionLoyalty:religious.loyalty,netFood:round(y.food-c.population*2)};
}
export function empireYields(g,p){return evaluate(g,()=>empireYieldsInternal(g,p));}
function empireYieldsInternal(g,p){const city=ownedCities(g,p).map(c=>cityYields(g,c));const y=Object.fromEntries([...YIELD_KEYS,'tourism'].map(k=>[k,round(sum(city,k))])),costs=militaryCosts(g,p);y.domesticGold=round(y.gold+treatyGoldDelta(g,p.id,{includeIncoming:false}));y.grossGold=round(y.gold+treatyGoldDelta(g,p.id));y.militarySalary=costs.salary;y.militaryMaintenance=costs.maintenance;y.militaryUpkeep=costs.upkeep;y.gold=round(y.grossGold-costs.upkeep);return y;}
export function militaryFinance(g,p){return financeState(g,p,empireYields(g,p));}
export function productionMultiplier(p,item,time=0,forceActive=false){const effects={...nationalEffects(p,time)};if(forceActive&&!(p.leaderAbility?.activeUntil>time))for(const [k,n]of Object.entries(leaderFor(p).effects))effects[k]=(effects[k]||0)+n;let value=1;if(item==='settler'&&p.policies.includes('colonization'))value+=.5;if(item==='builder'&&p.policies.includes('craftsmen'))value+=.5;if(UNITS[item]&&!UNITS[item].civilian){if(traditionIndex(p)===1)value+=uniqueEnabled(p)?.1:.2;value+=(effects.militaryProduction||0)+(UNITS[item].domain==='sea'?effects.navalProduction||0:0);if(p.policies.includes('grandarmy'))value+=.35*militaryPolicyMultiplier(p);value+=p.policies.reduce((s,k)=>s+(POLICIES[k]?.productionMilitary||0),0)*militaryPolicyMultiplier(p);}const category=UNITS[item]?.class==='cavalry'?'cavalry':item==='builder'?'builder':item==='settler'?'settler':null;if(category)value+=effects[category+'Production']||0;const kind=PRODUCTION[item]?.kind;if(['district','wonder','project'].includes(kind))value+=effects[kind+'Production']||0;if(['commercial','harbor'].includes(item))value+=effects[item+'Production']||0;return Math.max(.1,value);}
export function buildable(g,p,c,item,target){
  const spec=PRODUCTION[item];if(item==='envoy'||spec?.heritage||!spec||!eligible(p,spec)||!contentEligible(p,spec))return false;const replacement=replacementFor(p,item);if(replacement!==item&&eligible(p,PRODUCTION[replacement])&&c.production?.item!==item)return false;
  if(UNITS[item]&&retiredUnit(p,item)&&!(uniqueEnabled(p)&&replacementFor(p,item)!==item&&c.production?.item===item))return false;
  if(item==='atomicbomb'&&nuclearStock(p)>=3)return false;
  if(spec.building&&!hasBuilding(c,spec.building))return false;
  if(climateBuildReason(g,p,c,item))return false;
  if(spec.resource&&!playerResources(g,p)[spec.resource])return false;
  if(spec.domain==='air'&&!c.districts.some(d=>operationalAirport(g,p,g.map.tiles[d.tile])&&deploymentFree(g,d.tile)))return false;
  if(BUILDINGS[item]&&hasBuilding(c,item))return false;
  if(POWER_PLANTS.includes(item)&&POWER_PLANTS.some(key=>POWER_PLANTS.indexOf(key)>POWER_PLANTS.indexOf(item)&&hasBuilding(c,key)))return false;
  if(item==='settler'&&(c.population<2||ownedCities(g,p).length>=10))return false;
  if((spec.religious||spec.faithOnly)&&c.production?.item!==item)return false;
  if(spec.domain==='sea'&&!neighbors(g.map,tileOf(g,c)).some(isWater))return false;
  if(PROJECTS[item]?.stage&&(PROJECTS[item].stage!==p.spaceStage+1||!operationalSpaceport(g,p,c)))return false;
  if(WONDERS[item]&&g.wonders[item])return false;
  if(spec.kind==='district'||spec.kind==='wonder'){
    const t=g.map.tiles[target];if(!t||t.naturalWonder||coastalWorkBlocked(g,t)||t.owner!==p.id||distance(g,t,tileOf(g,c))>2||t.cityId!==null||t.district||t.fort||t.terrain==='mountain'&&!WONDERS[item])return false;
    if(WONDERS[item]){if(!validWonderPlacement(g,p,c,item,t)&&!legacyWonderOrder(g,p,c,item,t.id))return false;}else if(Boolean(spec.water)!==Boolean(isWater(t)))return false;
    if(spec.kind==='district'&&!['aqueduct','spaceport','airport'].includes(baseItem(item))&&c.districts.filter(d=>!['aqueduct','spaceport','airport'].includes(baseItem(d.item))).length>=1+Math.floor(c.population/3))return false;
    if(g.cities.some(other=>other.id!==c.id&&other.production?.tile===t.id))return false;
  }
  return true;
}
export const UNIT_SUCCESSORS={scout:['skirmisher'],skirmisher:['ranger'],ranger:['specops'],specops:[],heavychariot:['knight'],quadrireme:['frigate'],privateer:['submarine'],batteringram:['siegetower'],balloon:['observationdrone'],infantry:['mechanized'],mechanized:[],modernarmor:[],rocketartillery:[],missilecruiser:[],assaultship:[],drone:[],rifleman:['infantry'],herbalist:['surgeon'],surgeon:['fieldmedic'],fieldmedic:['ambulance'],warrior:['swordsman'],slinger:['archer'],spearman:['pikeman'],pikeman:['pikeandshot'],pikeandshot:['atcrew'],atcrew:['modernat'],modernat:[],archer:['crossbow'],crossbow:['cannon'],horseman:['courser','knight'],courser:['cavalry'],knight:['cuirassier'],cuirassier:['cavalry'],cavalry:['helicopter'],helicopter:[],swordsman:['manatarms'],manatarms:['musket'],musket:['rifleman'],catapult:['trebuchet'],trebuchet:['bombard'],bombard:['artillery'],cannon:['machinegun'],machinegun:[],tank:['modernarmor'],artillery:['rocketartillery'],destroyer:['assaultship'],battleship:['missilecruiser'],bomber:['stealthbomber'],stealthbomber:[],fighter:['jetfighter'],jetfighter:['stealthfighter'],stealthfighter:[],antiair:['sam'],sam:[],galley:['caravel'],caravel:['ironclad'],ironclad:['destroyer'],frigate:['battleship'],submarine:['nuclearsubmarine'],nuclearsubmarine:[]};
export function successorsFor(p,type){return (UNIT_SUCCESSORS[baseItem(type)]||[]).map(key=>replacementFor(p,key)).filter(key=>contentEligible(p,UNITS[key]));}
export function retiredUnit(p,type){return successorsFor(p,type).some(next=>eligible(p,UNITS[next])||retiredUnit(p,next));}
export const UNIT_UPGRADE_SECONDS=4;
export function unitUpgradeCost(g,from,to,player){const base=Math.ceil(Math.max(0,productionCost(g,to)-productionCost(g,from))*2+25*gamePace(g).factor),discount=player?Math.min(.4,(nationalEffects(player,gameTime(g)).upgradeDiscount||0)+(UNITS[from]?.upgradeDiscount||0)):0;return Math.ceil(base*(1-discount));}
// Quotes use only the owner's information and are revalidated at admission and completion.
export function unitUpgradeOptions(g,p,u){
  if(!p||!u||u.owner!==p.id||u.hp<=0)return [];
  const t=tileOf(g,u),resources=playerResources(g,p),time=gameTime(g);
  return successorsFor(p,u.type).map(item=>{
    const spec=UNITS[item],goldCost=unitUpgradeCost(g,u.type,item,p),requirements=[],reasons=[];
    if(spec.tech){requirements.push(TECHS[spec.tech].name);if(!has(p,spec.tech))reasons.push('需要科技：'+TECHS[spec.tech].name);}
    if(spec.civic){requirements.push(CIVICS[spec.civic].name);if(!has(p,spec.civic))reasons.push('需要市政：'+CIVICS[spec.civic].name);}
    if(spec.resource){requirements.push(RESOURCES[spec.resource].name);if(!resources[spec.resource])reasons.push('缺少战略资源：'+RESOURCES[spec.resource].name);}
    requirements.push(spec.domain==='air'?'可用机场':'己方领土');
    if(t?.owner!==p.id)reasons.push('需要返回己方领土');
    if(unitTransport(u,t))reasons.push('需要先登陆');
    if(spec.domain==='air'&&!operationalAirBase(g,p,u))reasons.push('需要可用机场或航母');
    if(u.activity||u.acted||u.moves<=0||(u.cooldownUntil||0)>time||receivingTreatment(g,u))reasons.push('等待当前行动或冷却结束');
    if(p.gold<goldCost)reasons.push('金币不足：还差 '+Math.ceil(goldCost-p.gold));
    const old=UNITS[u.type];
    return {item,goldCost,seconds:UNIT_UPGRADE_SECONDS,requirements,reasons,available:!reasons.length,strengthGain:Math.max(spec.strength-old.strength,(spec.ranged||spec.strength)-(old.ranged||old.strength)),healingGain:(spec.medical||0)-(old.medical||0)};
  });
}
export function productionOptions(g,p,c){
  const result=[],production=cityYields(g,c).production,nearby=tilesInRange(g.map,tileOf(g,c),2),known=new Set(p.explored);
  for(const [item,spec] of Object.entries(PRODUCTION)){
    if(spec.kind==='district'||spec.kind==='wonder'){
      const frontier=item==='airport'?Object.values(p.knownCities||{}).filter(other=>other.owner!==p.id&&atWar(g,p.id,other.owner)).map(other=>g.map.tiles[other.tile]).filter(Boolean):[];
      const airPosition=frontier.length?new Map(nearby.map(t=>[t.id,Math.min(...frontier.map(target=>distance(g,t,target)))])):null;
      const possible=nearby.filter(t=>buildable(g,p,c,item,t.id)).map(t=>{const resource=RESOURCES[rememberedTile(p,t).resource];return {tile:t.id,adjacency:adjacency(g,p,t,item),placementLoss:placementLoss(g,p,c,t),siteRisk:climateSitePenalty(g,p,t,known),strategicDeposit:resource?.category==='strategic'&&(!resource.tech||has(p,resource.tech))};}).sort((a,b)=>(!p.manual?Number(a.strategicDeposit)-Number(b.strategicDeposit):0)||(airPosition?airPosition.get(a.tile)-airPosition.get(b.tile):0)||(p.manual?b.adjacency-a.adjacency:(b.adjacency-b.placementLoss*.75-b.siteRisk*.125)-(a.adjacency-a.placementLoss*.75-a.siteRisk*.125))||a.tile-b.tile).slice(0,3);
      for(const t of possible)result.push({item,...t,cost:productionCost(g,item),turns:Math.ceil(Math.max(0,productionCost(g,item)-c.storedProduction)/productionRate(g,c,{item},production))});
    }else if(buildable(g,p,c,item))result.push({item,cost:productionCost(g,item),turns:Math.ceil(Math.max(0,productionCost(g,item)-c.storedProduction)/productionRate(g,c,{item},production))});
  }
  const available=new Set(result.map(op=>op.item));
  const modern=key=>successorsFor(p,key).some(next=>available.has(next)||modern(next));
  return result.map(op=>({...op,obsolete:!!UNITS[op.item]&&!UNITS[op.item].siege&&modern(op.item)}));
}
// Natural auras and visible fertility are lost when a district occupies an ordinary plot.
function placementLoss(g,p,c,t){
  const tile=planningTile(g,p,t),natural=naturalTileBonus(tile,p),withWeather=tileYield(tile,p),withoutWeather=tileYield({...tile,weather:undefined},p);
  const weights={food:2,production:1.4,gold:.4,science:1.5,culture:1.2,faith:1};
  return round(Object.entries(weights).reduce((sum,[key,weight])=>sum+weight*((natural[key]||0)+Math.max(0,withWeather[key]-withoutWeather[key])),0)*(c.worked?.includes(t.id)?1:.5));
}
export function unitDeployment(g,p,c,item,work={}){
  const spec=UNITS[item];if(!spec||g.units.length>=2000)return null;
  const center=work.fortress!==undefined&&operationalFortress(g,c,work.fortress)?g.map.tiles[work.fortress]:tileOf(g,c);
  return spec.domain==='air'?c.districts.map(d=>g.map.tiles[d.tile]).find(t=>operationalAirport(g,p,t)&&deploymentFree(g,t.id)):
    [center,...tilesInRange(g.map,center,2).filter(t=>t.owner===p.id)].find(t=>t.terrain!=='mountain'&&(spec.domain==='sea'?isWater(t):!isWater(t))&&deploymentFree(g,t.id));
}
// Quotes and execution share the same rules. Only owned city projections include quotes.
export function cityPurchases(g,p,c){
  if(c.owner!==p.id)return [];
  const rows=[];
  for(const [item,spec]of Object.entries(PRODUCTION)){
    if(!(UNITS[item]||BUILDINGS[item]?.kind==='building')||spec.heritage||spec.religious||spec.faithOnly||item==='envoy'||!eligible(p,spec)||!contentEligible(p,spec))continue;
    if(UNITS[item]&&retiredUnit(p,item)||replacementFor(p,item)!==item&&eligible(p,PRODUCTION[replacementFor(p,item)])||BUILDINGS[item]&&hasBuilding(c,item))continue;
    const cost=purchaseCost(g,item,p,c),reasons=[];
    if(spec.building&&!hasBuilding(c,spec.building))reasons.push('需要'+(BUILDINGS[spec.building]?.name||spec.building));
    if(spec.resource&&!playerResources(g,p)[spec.resource])reasons.push('需要'+RESOURCES[spec.resource].name+'供应');
    if(item==='settler'&&(c.population<2||ownedCities(g,p).length>=10))reasons.push(c.population<2?'需要至少 2 人口':'已达城市上限');
    if(UNITS[item]&&!unitDeployment(g,p,c,item))reasons.push(spec.domain==='air'?'需要完好且空闲的机场':'没有合法部署空间');
    if(!buildable(g,p,c,item)&&!reasons.length)continue;
    if(p.gold<cost)reasons.push('金币不足：还差 '+Math.ceil(cost-p.gold));
    rows.push({item,currency:'gold',cost,available:!reasons.length,reasons,action:{type:'purchase',city:c.id,item}});
  }
  for(const item of ['missionary','apostle','inquisitor','guru','naturalist','rockband','warriormonk']){
    const spec=UNITS[item],cost=religiousRecruitmentCost(g,p,item,c),reasons=[];
    if(spec.religious&&!g.players[c.religion]?.religion)reasons.push('需要城市主流宗教');
    const building=spec.religious?(item==='missionary'?'shrine':'temple'):spec.building;if(building&&!operationalBuilding(g,c,building))reasons.push('需要完好的'+BUILDINGS[building].name);
    if(spec.civic&&!p.civics.includes(spec.civic))reasons.push('需要'+CIVICS[spec.civic].name);
    if(!canRecruitReligious(g,p,item,c)&&!reasons.length)reasons.push('尚不满足宗教招募条件');
    if(!tilesInRange(g.map,tileOf(g,c),2).some(t=>t.owner===p.id&&!isWater(t)&&t.terrain!=='mountain'&&deploymentFree(g,t.id)))reasons.push('没有合法部署空间');
    if(p.faith<cost)reasons.push('信仰不足：还差 '+Math.ceil(cost-p.faith));
    rows.push({item,currency:'faith',cost,available:!reasons.length,reasons,religionOwner:c.religion,action:{type:'recruitFaith',city:c.id,item}});
  }
  for(const a of religionActions(g,p).filter(a=>a.city===c.id&&['faithBuilding','worship'].includes(a.type)))rows.push({item:a.item,currency:'faith',cost:a.hint.faithCost,available:true,reasons:[],action:{type:a.type,city:c.id,item:a.item}});
  const reasons=[];if(!spyCapacity(p,g))reasons.push('需要外交部门市政');else if((g.espionage?.agents||[]).filter(a=>a.owner===p.id&&a.status!=='dead').length>=spyCapacity(p,g))reasons.push('间谍名额已满');if(p.gold<120)reasons.push('需要 120 金币');rows.push({item:'spy',currency:'gold',cost:120,available:!reasons.length,reasons,action:{type:'recruitSpy'}});
  return rows;
}
export function orderCost(g,c,work=c.production){return work?.cost??productionCost(g,work?.item);}
export function operationalSpaceport(g,p,c){return c.owner===p.id&&c.districts.some(d=>d.item==='spaceport'&&g.map.tiles[d.tile]?.owner===p.id&&!g.map.tiles[d.tile].pillaged);}
export function productionRate(g,c,work=c.production,baseProduction){const p=g.players[c.owner],effects=leaderFor(p).passive?.effects||{},echo=work&&c.id!==p.capital&&BUILDINGS[work.item]&&g.cities.some(cap=>cap.id===p.capital&&cap.owner===p.id&&hasBuilding(cap,baseItem(work.item)))?1+(effects.capitalBuildingEcho||0):1,local=work&&UNITS[work.item]&&operationalBuilding(g,c,'harbor')&&operationalBuilding(g,c,'workshop')&&(UNITS[work.item].domain==='sea'||['bombard','cannon','artillery','rocketartillery'].includes(baseItem(work.item)))?1+c.buildings.reduce((n,k)=>Math.max(n,BUILDINGS[k]?.harborMilitaryProduction||0),0):1,conference=work&&UNITS[work.item]&&!UNITS[work.item].civilian?1+(congressEffects(g).militaryProduction||0):1,fort=work?.fortress!==undefined&&operationalFortress(g,c,work.fortress)&&!!UNITS[work.item]&&!UNITS[work.item].civilian&&(UNITS[work.item].domain||'land')==='land'?(domesticState(g,g.players[c.owner]).invaded?2:1.25):1;return work?(baseProduction??cityYields(g,c).production)*productionMultiplier(g.players[c.owner],work.item,gameTime(g))*echo*local*conference*(work.funded?1.5+(leaderFor(g.players[c.owner]).passive?.effects?.purchaseSpeedBonus||0):1)*fort*heritageProductionMultiplier(g,c,work)*religionWonderMultiplier(g,p,work.item)*governorProduction(g,c,work):0;}
export function fortressRecruitment(g,c){const cache=evaluationCaches.get(g);let forts=cache?.forts;if(!forts){forts=new Map();for(const t of g.map.tiles)if(t.fort&&t.territoryCity!=null){const list=forts.get(t.territoryCity)||[];list.push(t);forts.set(t.territoryCity,list);}if(cache)cache.forts=forts;}const bonus=domesticState(g,g.players[c.owner]).invaded?100:25;return (forts.get(c.id)||[]).filter(t=>operationalFortress(g,c,t.id)).map(t=>({tile:t.id,city:c.id,bonus}));}
export function healingTargets(g,p,u){
  if(!u||u.owner!==p.id||u.hp<=0||!UNITS[u.type]?.medical||unitTransport(u,tileOf(g,u))||(u.supportUntil||0)>gameTime(g))return [];
  return g.units.filter(v=>v.owner===p.id&&v.hp>0&&v.hp<100&&!UNITS[v.type].civilian&&!['sea','air'].includes(UNITS[v.type].domain)&&!v.activity&&!unitTransport(v,tileOf(g,v))&&(v.medicalUntil||0)<=gameTime(g)&&distance(g,tileOf(g,u),tileOf(g,v))<=1&&!g.units.some(other=>other.id!==u.id&&other.activity?.action.type==='heal'&&other.activity.action.targetUnit===v.id)).map(v=>({targetUnit:v.id,health:v.hp,healing:Math.min(Math.round(UNITS[u.type].medical*(operationalWonder(g,'hagia_sophia',p.id)?1.25:1)),100-v.hp),tile:v.tile}));
}
export function receivingTreatment(g,u){if(!u)return false;const cache=evaluationCaches.get(g);let patients=cache?.treatmentPatients;if(!patients){patients=new Map(g.units.filter(actor=>actor.activity?.action.type==='heal').map(actor=>[actor.activity.action.targetUnit,actor.owner]));if(cache)cache.treatmentPatients=patients;}return patients.get(u.id)===u.owner;}
export function canOccupyCity(g,u,city){
  const tile=g.map.tiles[city?.tile],spec=UNITS[u.type],p=g.players[u.owner];
  return !!tile&&!!p&&city.owner!==u.owner&&atWar(g,u.owner,city.owner)&&p.visible.includes(city.tile)&&city.hp<=0&&city.walls<=0&&u.hp>0&&occupationUnit(u.type)&&!unitTransport(u,tileOf(g,u))&&(spec.domain==='sea'?isWater(tile)||neighbors(g.map,tile).some(isWater):!isWater(tile))&&!g.units.some(other=>other.id!==u.id&&other.hp>0&&other.tile===city.tile&&other.id!==linkedPartner(g,u)?.id&&(other.owner!==city.owner||protectedEnvoy(other)));
}
export function cityDispositionOptions(g,p){return g.cities.filter(c=>c.owner===p.id&&c.capturePending).map(c=>{const reason=c.isCapital?'原始首都必须保留。':Object.values(g.wonders).some(w=>w.city===c.id)?'拥有不可摧毁的奇观，必须保留。':'';return {city:c.id,tile:c.tile,name:c.name,canRaze:!reason,reason};});}
export function resolveCityDisposition(g,p,action){
 if(!['keepCity','razeCity'].includes(action.type))throw Error('Invalid city disposition.');
 const c=g.cities.find(c=>c.id===action.city&&c.owner===p.id&&c.capturePending);if(!c)throw Error('此城市没有待处理的占领决定。');
 if(action.type==='keepCity'){delete c.capturePending;event(g,'conquest',p.short+' 决定保留 '+c.name+'。',p.id,c.tile);return;}
 const option=cityDispositionOptions(g,p).find(v=>v.city===c.id);if(!option.canRaze)throw Error(option.reason);
 const state=c.cityStateOrigin&&g.cityStates.states.find(s=>s.id===c.cityStateOrigin);if(state){state.razed=true;state.capturedBy=p.id;state.hp=0;delete g.map.tiles[c.tile].cityState;}const tile=c.tile;for(const t of g.map.tiles)if(t.territoryCity===c.id||t.cityId===c.id||t.district?.city===c.id){t.owner=null;delete t.territoryCity;if(t.cityId===c.id)t.cityId=null;if(t.district?.city===c.id)t.district=null;if(t.fort){delete t.fort;t.fortRuin=true;}if(t.improvement)t.pillaged=true;}
 if(g.heritage){g.heritage.works=g.heritage.works.filter(w=>w.city!==c.id);for(const w of g.heritage.works)if(w.transfer?.city===c.id)delete w.transfer;g.heritage.pendingGrants=(g.heritage.pendingGrants||[]).filter(v=>v.city!==c.id);delete g.heritage.legacyOrders?.[c.id];}
 for(const o of g.players)for(const r of Object.values(o.governors?.roster||{}))if(r.city===c.id){r.city=null;r.establishedAt=0;}for(const agent of g.espionage?.agents||[])if(agent.city===c.id){agent.city=null;agent.mission=null;if(agent.status==='mission')agent.status='idle';}for(const unit of g.units)if(unit.airPatrolCity===c.id)delete unit.airPatrolCity;
 g.cities=g.cities.filter(v=>v!==c);g.routes=g.routes.filter(r=>r.from!==c.id&&r.to!==c.id);for(const o of g.players)if(o.id===p.id||o.visible.includes(tile)){delete o.knownCities?.[c.id];delete o.cityAppearances?.[c.id];}
 p.planRevision=(p.planRevision||0)+1;event(g,'conquest',p.short+' 摧毁了 '+c.name+'，原有领土恢复无主状态。',p.id,tile);refreshVisibility(g);
}
function occupyCity(g,p,u,city){
  if(!canOccupyCity(g,u,city))return false;
  initializeTerritories(g);const old=city.owner,defender=g.players[old];capitalAgenda(g,p.id,old,city,event);
  delete city.loyaltyStatus;u.tile=city.tile;city.owner=p.id;city.hp=100;city.walls=0;city.loyalty=65;city.loyalty=Math.max(city.loyalty,heritageLoyaltyFloor(g,city));city.occupation=Math.max(0,3-(nationalEffects(p,gameTime(g)).captureRelief||0));city.production=null;delete city.activity;delete city.lastAttackedAt;city.attacked=false;city.cooldownUntil=city.attackUntil=0;
  transferCityTerritory(g,city,p.id);const state=city.cityStateOrigin&&g.cityStates.states.find(s=>s.id===city.cityStateOrigin);if(state)state.capturedBy=p.id;conquestEffects(g,p,city);
  for(const district of city.districts)g.map.tiles[district.tile].owner=p.id;
  for(const tile of g.map.tiles)if(tile.owner===p.id&&tile.fort?.owner===old)tile.fort.owner=p.id;
  for(const wonder of Object.values(g.wonders).filter(w=>w.city===city.id))wonder.owner=p.id;
  for(const displaced of g.units.filter(other=>other.hp>0&&other.tile===city.tile&&other.owner===old&&!other.greatPerson&&!protectedEnvoy(other)))envoyKilled(g,displaced,p.id,event);
  const captives=g.units.filter(other=>other.tile===city.tile&&other.owner===old&&['settler','builder','militaryengineer'].includes(baseItem(other.type)));g.units=g.units.filter(other=>other.tile!==city.tile||other.owner!==old||other.greatPerson||protectedEnvoy(other)||captives.includes(other));
  for(const captive of captives){if(canCaptureCivilian(g,u,captive))captureCivilian(g,p,u,captive);else{const place=g.map.tiles.filter(t=>!isWater(t)&&t.terrain!=='mountain'&&(t.owner===null||t.owner===p.id)&&deploymentFree(g,t.id)).sort((a,b)=>distance(g,a,tileOf(g,city))-distance(g,b,tileOf(g,city))||a.id-b.id)[0];if(place){unlinkUnit(g,captive);captive.owner=p.id;captive.tile=place.id;captive.moves=0;captive.acted=true;captive.capturedFrom=old;captive.captureTurn=g.turn;delete captive.activity;delete captive.moveOrder;event(g,'capture',p.short+' 俘虏了 '+UNITS[captive.type].name+'。',old,city.tile);}else g.units=g.units.filter(v=>v!==captive);}}
  g.routes=g.routes.filter(route=>g.cities.find(c=>c.id===route.from)?.owner===route.owner);
  for(const other of g.players)if(other.alive&&other.id!==p.id&&!atWar(g,other.id,p.id))allowBorderExit(g,other.id,p.id);
  city.capturePending={previousOwner:old,turn:g.turn};p.planRevision++;defender.planRevision++;event(g,'conquest',`${p.short} 占领了 ${defender.short} 的 ${city.name}！`,p.id,city.tile);if(!p.manual){const option=cityDispositionOptions(g,p).find(v=>v.city===city.id),near=ownedCities(g,p).filter(c=>c!==city).reduce((n,c)=>Math.min(n,distance(g,tileOf(g,c),tileOf(g,city))),Infinity);resolveCityDisposition(g,p,{type:option.canRaze&&p.strategy==='domination'&&city.population<=2&&near>12?'razeCity':'keepCity',city:city.id});}return true;
}
export function jumpTargets(g,p,u){
  if(!UNITS[u.type]?.jumpTech||!has(p,UNITS[u.type].jumpTech)||u.hp<=0||u.acted||u.moves<2||u.activity||linkedPartner(g,u)||movementBlocked(g,u)||(u.moveUntil||0)>gameTime(g)||(u.cooldownUntil||0)>gameTime(g))return [];
  const from=tileOf(g,u),visible=new Set(p.visible);return g.map.tiles.filter(t=>visible.has(t.id)&&distance(g,from,t)===2&&!isWater(t)&&t.terrain!=='mountain'&&t.cityId===null&&Number.isFinite(movementCost(g,p,u,from,t))).map(t=>({tile:t.id}));
}
export function movementCost(g,p,u,from,to){
  const spec=UNITS[u.type];if(to.cityState&&cityStateOwner(to.cityState)!==u.owner)return Infinity;if(spec.domain==='air')return Infinity;if(to.terrain==='mountain'||!canEnterTerritory(g,u,to))return Infinity;
  if(spec.domain==='sea'){if(!isWater(to)&&!(to.district?.item==='panama_canal'&&!to.pillaged)&&!(to.cityId!==null&&neighbors(g.map,to).some(isWater)))return Infinity;if(to.terrain==='ocean'&&(!p||!has(p,'celestial')))return Infinity;}
  else if(isWater(to)&&!(to.district?.item==='golden_gate'&&!to.pillaged)){if(!canEmbark(p,u.type)||to.terrain==='ocean'&&!has(p,'celestial'))return Infinity;}
  const city=to.cityId!==null?g.cities.find(c=>c.id===to.cityId):null,capture=city&&canOccupyCity(g,u,city);
  if(capture&&spec.domain!=='sea'&&isWater(from))return Infinity;
  if(to.cityId!==null&&to.owner!==u.owner&&!capture&&!(u.type==='envoy'&&u.envoy?.capital===to.cityId))return Infinity;
  const partner=linkedPartner(g,u);
  const index=occupancyFor(g);
  if((index?index.byTile.get(to.id)||[]:g.units).some(x=>x.id!==u.id&&x.id!==partner?.id&&x.tile===to.id&&x.hp>0&&!(x.greatPerson&&displacesGreatPerson(u)&&atWar(g,u.owner,x.owner))&&!(capture&&x.owner===city.owner&&!protectedEnvoy(x))&&!canCaptureCivilian(g,u,x)))return Infinity;
  if(tileReserved(g,to.id,[u.id,...(partner?[partner.id]:[])]))return Infinity;
  const terrainCost=(to.hill||to.feature)&&!UNITS[u.type].ignoreTerrain&&!u.veteranTraits?.includes('terrain')&&!heritageAura(g,u).ignoreTerrainPenalty&&!religionIgnoresTerrain(g,u,to)?1:0;
  const crossing=(from.river||to.river)&&(Array.isArray(from.riverEdges)&&Array.isArray(to.riverEdges)?riverBlocks(g,from,to):to.river&&!from.river);
  const riverPenalty=crossing&&p&&!has(p,'engineering')&&!heritageAura(g,u).ignoreTerrainPenalty;
  const cost=isWater(to)?1+hostileSeaCost(g,u,to):(1+terrainCost+(riverPenalty?1:0))*roadMultiplier(g,p,u,from,to);
  // A rough riverbank may consume a full movement allowance, never require more than one.
  // Keep this in the shared cost authority so paths, linked units and timed orders agree.
  return riverPenalty?Math.min(cost,movementAllowance(g,u),partner?.tile===u.tile?movementAllowance(g,partner):Infinity):cost;
}
export function reachable(g,p,u,includePaths=false,escort=true){
  if(occupancyFor(g))return reachableInternal(g,p,u,includePaths,escort);
  const outer=occupancyScope,cache=evaluationCaches.get(g);let scope=cache?.occupancy;if(!scope||scope.units!==g.units){scope=buildOccupancy(g);if(cache)cache.occupancy=scope;}
  occupancyScope=scope;try{return reachableInternal(g,p,u,includePaths,escort);}finally{occupancyScope=outer;}
}
function reachableInternal(g,p,u,includePaths,escort){
  if(movementBlocked(g,u)||g.realtime&&(u.moveUntil||0)>g.realtime.time)return [];
  if(UNITS[u.type].airCapacity&&carrierBusy(g,u))return [];
  if(UNITS[u.type].domain==='air'||u.type==='envoy'&&u.envoy?.state!=='travelling')return [];
  const partner=escort?linkedPartner(g,u):null,together=partner?.tile===u.tile;
  if(together&&(partner.activity||partner.acted||partner.moves<=0||(partner.moveUntil||0)>gameTime(g)||receivingTreatment(g,partner)))return [];
  const ownLimit=movementAllowance(g,u),otherLimit=together?movementAllowance(g,partner):Infinity;
  const limit=Math.min(ownLimit,otherLimit),budget=Math.min(u.moves,ownLimit,together?Math.min(partner.moves,otherLimit):Infinity);
  if(!Number.isFinite(budget)||budget<=0)return [];
  const controls=zocField(g,u),partnerControls=together?zocField(g,partner):new Set(),captureTiles=new Set(!UNITS[u.type].civilian&&!partner?g.units.filter(v=>canCaptureCivilian(g,u,v)).map(v=>v.tile):[]);
  const start={tile:u.tile,cost:0,steps:0,parent:null},found=new Map(),labels=new Map([[u.tile+':0',start]]),frontiers=new Map([[u.tile,[start]]]),queue=[start];
  // Retain a label per cell and step count: a cheaper road detour must not discard
  // a shorter route that can still reach a destination within the cell limit.
  for(let head=0;head<queue.length;head++){
    const current=queue[head],from=g.map.tiles[current.tile];
    if(labels.get(current.tile+':'+current.steps)!==current||current.steps>=limit||current.stopped||current.tile!==u.tile&&from.cityId!==null&&from.owner!==u.owner)continue;
    for(const t of neighbors(g.map,from)){
      if(t.id===u.tile)continue;
      const step=movementCost(g,p,u,from,t),cost=current.cost+(together?Math.max(step,movementCost(g,p,partner,from,t)):step),steps=current.steps+1,key=t.id+':'+steps;
      const frontier=frontiers.get(t.id)||[];
      if(cost>budget+1e-9||!Number.isFinite(cost)||frontier.some(record=>record.steps<=steps&&record.cost<=cost+1e-9))continue;
      const next={tile:t.id,cost,steps,stopped:controls.has(t.id)||partnerControls.has(t.id)||captureTiles.has(t.id),parent:includePaths?current:null};
      const retained=frontier.filter(record=>{if(steps<=record.steps&&cost<=record.cost+1e-9){labels.delete(t.id+':'+record.steps);return false;}return true;});
      retained.push(next);frontiers.set(t.id,retained);labels.set(key,next);queue.push(next);
      const best=found.get(t.id);if(!best||cost<best.cost-1e-9||Math.abs(cost-best.cost)<=1e-9&&steps<best.steps)found.set(t.id,next);
    }
  }
  return [...found.values()].map(({tile,cost,...record})=>{
    if(!includePaths)return {tile,cost,zoc:!!record.stopped};
    const path=[tile];for(let parent=record.parent;parent;parent=parent.parent)path.unshift(parent.tile);
    return {tile,cost,path,zoc:!!record.stopped};
  });
}
export function atWar(g,a,b){return ownersAtWar(g,a,b);}
export function canTrainVeteran(g,p,u,item){const t=u&&tileOf(g,u);return !!u&&u.owner===p.id&&u.hp>0&&!u.activity&&!u.acted&&u.moves>0&&t?.owner===p.id&&!unitTransport(u,t)&&veteranChoices(u).includes(item)&&(UNITS[u.type].domain!=='air'||operationalAirBase(g,p,u));}
const groundDomain=u=>UNITS[u.type]?.domain||'land';
const fieldMilitary=(g,u)=>u.hp>0&&!UNITS[u.type]?.civilian&&groundDomain(u)!=='air'&&!unitTransport(u,tileOf(g,u));
const viewerCanSee=(g,viewer,u)=>viewer===null||u.owner===viewer||g.players[viewer]?.visible.includes(u.tile);
function nearbyMilitary(g,t){
  const cache=evaluationCaches.get(g);
  if(!cache)return g.units.filter(u=>distance(g,t,tileOf(g,u))===1);
  if(!cache.combatCells){cache.combatCells=new Map();for(const u of g.units){const at=cache.combatCells.get(u.tile)||[];at.push(u);cache.combatCells.set(u.tile,at);}}
  return neighbors(g.map,t).flatMap(n=>cache.combatCells.get(n.id)||[]);
}
export function riverBetween(g,from,to){
  if(!from||!to||isWater(from)||isWater(to))return false;
  const direction=DIRECTIONS.findIndex(([dq,dr])=>g.map.index[canonicalTileKey(from.q+dq,from.r+dr,g.map)]?.id===to.id);
  return direction>=0&&(from.riverEdges?.includes(direction)||to.riverEdges?.includes((direction+3)%6))||false;
}
function formationBonus(g,u,t,flanking,viewer=null){
  const p=g.players[u.owner];if(!p?.civics.includes('militarytradition')||!fieldMilitary(g,u))return 0;
  const occupied=new Set(nearbyMilitary(g,t).filter(v=>v.id!==u.id&&v.owner===u.owner&&fieldMilitary(g,v)&&groundDomain(v)===groundDomain(u)&&(!flanking||!UNITS[v.type].ranged)&&viewerCanSee(g,viewer,v)).map(v=>v.tile));
  return Math.min(6,occupied.size*2);
}
function intelligenceLevel(g,owner,other,t,viewer){
  const p=g.players[owner];if(!p||!g.players[other]||!p.met.includes(other))return 0;
  let level=((p.relations[other]?.embassy||p.relations[other]?.delegation)?1:0)+((viewer===null||viewer===owner)&&g.espionage?.agents.some(a=>a.owner===owner&&a.listeningOwner===other&&a.listeningUntil>gameTime(g))?1:0)+(nationalEffects(p,gameTime(g)).intelligenceBonus||0)+['printing','computers','telecommunications'].filter(k=>p.techs.includes(k)).length;
  const cache=evaluationCaches.get(g);
  if(cache&&!cache.reconUnits)cache.reconUnits=g.units.filter(u=>u.type==='scout'||UNITS[u.type]?.recon||UNITS[u.type]?.airOnly&&groundDomain(u)==='air');
  const scouts=cache?.reconUnits||g.units;
  if(scouts.some(u=>{
    if(u.owner!==owner||u.hp<=0||!viewerCanSee(g,viewer,u))return false;
    const base=tileOf(g,u);
    if(u.type==='scout'||UNITS[u.type]?.recon)return !unitTransport(u,base)&&distance(g,t,base)<=(UNITS[u.type].vision||2);
    if(!UNITS[u.type]?.airOnly||groundDomain(u)!=='air'||!operationalAirport(g,p,base)||distance(g,t,base)>attackRange(g,u))return false;
    // A visible hostile fighter is possible reconnaissance; never expose its private patrol assignment.
    if(viewer!==null&&viewer!==owner)return true;
    return g.cities.some(c=>c.id===u.airPatrolCity&&c.owner===owner&&distance(g,t,tileOf(g,c))<=3&&distance(g,base,tileOf(g,c))<=attackRange(g,u));
  }))level++;
  return Math.min(4,level);
}
function intelligenceBonus(g,owner,other,t,viewer=null){return Math.max(0,intelligenceLevel(g,owner,other,t,viewer)-intelligenceLevel(g,other,owner,t,viewer))*3;}
// Public previews use remembered ownership for unseen destinations.
export function homelandCombatBonus(g,u,viewer=null){const p=g.players[u.owner],t=tileOf(g,u);if(!UNITS[u.type]||!p||civilizationEra(p)>3)return 0;const observer=g.players[viewer],owner=viewer===null||observer?.visible.includes(t.id)?t.owner:observer?rememberedTile(observer,t).owner:null;return owner===u.owner?5:0;}
export function unitCombatProfile(g,u,defending=false,opponent=null,{viewer=null,ranged=false}={}){
  const p=g.players[u.owner],s=UNITS[u.type],t=tileOf(g,u),modifiers=[];
  const add=(key,value)=>{if(value)modifiers.push({key,value});};
  let base=s.strength;add('training',u.training||0);add('experience',veteranCombatBonus(u));add('wounded',s.ignoreWounds||heritageAura(g,u,viewer).woundedCombatPenaltyImmunity?0:-Math.floor((maxUnitHp(u.type)-u.hp)/20));
  if(unitTransport(u,t)){const strength=Math.max(5,Math.min(18,(base+sum(modifiers,'value'))*.22));add('embarked',strength-base-sum(modifiers,'value'));add('homeland',homelandCombatBonus(g,u,viewer));return {base,strength:base+sum(modifiers,'value'),modifiers};}
  if(ranged)base=s.ranged||base;
  if(!defending&&u.veteranTraits?.includes('assault'))add('assault',2);
  if(defending&&u.veteranTraits?.includes('bastion')&&t.owner===u.owner)add('bastion',3);
  if(defending&&groundDomain(u)==='land'&&u.veteranTraits?.includes('terrain')&&(t.hill||['forest','jungle'].includes(t.feature)))add('terrainTraining',2);
  if(p){add('leader',leaderUnitBonus(g,u,defending));add('dedication',ageUnitBonus(g,u,defending));const effects=nationalEffects(p,gameTime(g));add('national',(effects.combat||0)+(s.domain==='sea'?effects.navalCombat||0:0));add('civilization',(traditionIndex(p)===1?(uniqueEnabled(p)?2:4):0)+(traditionIndex(p)===5&&s.domain==='sea'?5:0));add('government',GOVERNMENTS[p.government].combat||0);if(defending&&t.owner===p.id)add('homePolicy',p.policies.reduce((n,key)=>n+(POLICIES[key]?.homeCombat||0),0)*militaryPolicyMultiplier(p));if(has(p,'nationalism'))add('nationalism',5);add('advances',advances(p).reduce((v,a)=>v+(a.combat||0),0));}
  add('religionBelief',religionCombatBonus(g,u,opponent));add('religiousWar',religionWarBonus(g,u,opponent));add('heritage',heritageCombatBonus(g,u,defending,opponent,viewer));add('homeland',homelandCombatBonus(g,u,viewer));add('unique',uniqueCombatBonus(g,u,defending,opponent,viewer,ranged));
  if(opponent&&(UNITS[opponent.type]?.class==='cavalry'||['tank','modernarmor'].includes(baseItem(opponent.type))))add('antiCavalry',s.antiCavalry||0);
  if(opponent)add('militaryAlliance',allianceCombat(g,p,opponent.owner));
  add('carrierGroup',fleetStrength(g,u,viewer));
  if(opponent&&UNITS[opponent.type]?.submarine)add('antiSubmarine',defending?s.antiSubmarine||0:0);
  if(opponent&&!defending&&(UNITS[opponent.type]?.domain==='sea'||unitTransport(opponent,tileOf(g,opponent))))add('antiNaval',s.antiNaval||0);
  if(defending&&groundDomain(u)==='land'&&!isWater(t)){if(t.fort?.owner===u.owner&&t.fort.hp>0)add('fort',6);if(t.hill)add('hill',3);if(['forest','jungle'].includes(t.feature))add('woods',3);if(u.fortified)add('fortified',5);}
  if(opponent){
    const target=tileOf(g,opponent),melee=!unitHasRanged(p,u.type)&&fieldMilitary(g,u),enemyMelee=UNITS[opponent.type]&&!unitHasRanged(g.players[opponent.owner],opponent.type)&&fieldMilitary(g,opponent);
    if(!defending&&melee&&groundDomain(u)==='land'&&riverBetween(g,t,target))add('river',-5);
    if(!defending&&melee&&UNITS[opponent.type]&&fieldMilitary(g,opponent)&&groundDomain(u)===groundDomain(opponent)&&distance(g,t,target)===1)add('flanking',Math.min(s.flankingCap||9,formationBonus(g,u,target,true,viewer)*(1+(s.flankingMultiplier||0)+(heritageAura(g,u,viewer).flankBonusMultiplier||heritageAura(g,u,viewer).flankingBonusMultiplier||0)+(p?nationalEffects(p,gameTime(g)).flankingMultiplier||0:0))));
    if(defending&&enemyMelee&&fieldMilitary(g,u)&&groundDomain(u)===groundDomain(opponent))add('support',formationBonus(g,u,t,false,viewer));
    if(!s.civilian)add('intelligence',intelligenceBonus(g,u.owner,opponent.owner,defending?t:target,viewer));
  }
  return {base,strength:base+sum(modifiers,'value'),modifiers};
}
export function unitStrength(g,u,defending=false,opponent=null){return unitCombatProfile(g,u,defending,opponent).strength;}
function combatStrengths(g,u,enemy,viewer=null){
  const ranged=(unitHasRanged(g.players[u.owner],u.type)||distance(g,tileOf(g,u),tileOf(g,enemy))>1&&!!groupFor(g,u,viewer))&&!unitTransport(u,tileOf(g,u)),attack=unitCombatProfile(g,u,false,enemy,{viewer,ranged});
  if(enemy.owner===-1&&g.players[u.owner]?.policies.includes('discipline')){const bonus=8*militaryPolicyMultiplier(g.players[u.owner]);attack.strength+=bonus;attack.modifiers.push({key:'discipline',value:bonus});}
  if(UNITS[enemy.type])return {attack,defense:unitCombatProfile(g,enemy,true,u,{viewer}),ranged};
  const base=26,modifiers=[{key:'population',value:enemy.population*2},{key:'cityAdvances',value:g.players[enemy.owner].techs.length*.8}];
  if(governorHas(g,enemy,'gov_warlord'))modifiers.push({key:'governor',value:5});
  if(heritageCityDefense(g,enemy))modifiers.push({key:'heritage',value:heritageCityDefense(g,enemy)});if(enemy.walls>0)modifiers.push({key:'walls',value:9});if(tileOf(g,enemy).hill)modifiers.push({key:'hill',value:3});const intel=intelligenceBonus(g,enemy.owner,u.owner,tileOf(g,enemy),viewer);if(intel)modifiers.push({key:'intelligence',value:intel});
  return {attack,defense:{base,strength:base+sum(modifiers,'value'),modifiers},ranged};
}
function damage(g,attack,defense){return Math.round(combatDamage(attack,defense,.9+gameRandom(g)*.2));}
function gainExperience(g,u,n){const p=g.players[u.owner];u.xp+=Math.round(n*(1+(p?nationalEffects(p,gameTime(g)).xpMultiplier||0:0)+(UNITS[u.type].xpMultiplier||0)));if(u.hp<=0)return;const level=Math.floor(u.xp/25);if(level>u.level){u.level=level;u.hp=Math.min(maxUnitHp(u.type),u.hp+15);event(g,'military',`${u.owner>=0?g.players[u.owner].short:'蛮族'} 的 ${UNITS[u.type].name} 晋升至 ${level} 级。`,u.owner,u.tile);}}
function cleanUnits(g,clearedBy=null){
 const clearedTiles=new Set(g.units.filter(u=>u.hp<=0&&u.owner===-1&&g.map.tiles[u.tile]?.camp).map(u=>u.tile));
 heritageRelicsOnDeath(g,{event});
 for(const plane of g.units.filter(u=>u.carrierId!==undefined)){const carrier=g.units.find(c=>c.id===plane.carrierId&&c.owner===plane.owner&&c.hp>0&&UNITS[c.type]?.airCapacity);if(carrier)plane.tile=carrier.tile;}
 for(const plane of g.units.filter(u=>u.hp>0&&u.carrierId!==undefined&&!carrierFor(g,u))){
  // Losing the flight deck forces a legal emergency landing, without free healing.
  delete plane.carrierId;delete plane.activity;delete plane.airPatrolCity;
  const base=rebaseTargets(g,g.players[plane.owner],{...plane,acted:false,moves:1,moveUntil:0}).filter(b=>flightAllowed(g,g.players[plane.owner],plane,g.map.tiles[b.tile])).sort((a,b)=>distance(g,tileOf(g,plane),g.map.tiles[a.tile])-distance(g,tileOf(g,plane),g.map.tiles[b.tile])||a.tile-b.tile)[0];
  if(base){plane.tile=base.tile;if(base.carrier!==undefined)plane.carrierId=base.carrier;plane.acted=true;plane.moves=0;plane.cooldownUntil=gameTime(g)+2;event(g,'military','航母沉没，舰载机紧急转场。',plane.owner,plane.tile);}
  else {visual(g,'death',{...plane});plane.hp=0;event(g,'military','航母沉没，舰载机因无处降落而损失。',plane.owner,plane.tile);}
 }
 g.units=g.units.filter(u=>u.hp>0);clearBrokenLinks(g);invalidateFleets(g);clearEmptyCamps(g,{event,credit:clearedBy===null?null:{owner:clearedBy,tiles:clearedTiles}});
}
export function citySheltersUnit(g,target){const tile=g.map.tiles[target.tile];return tile?.cityId!=null&&tile.owner===target.owner&&g.cities.some(c=>c.id===tile.cityId&&c.owner===target.owner);}
export function canCaptureCivilian(g,u,target){
 const spec=UNITS[u.type];return !!target&&target.owner!==u.owner&&atWar(g,u.owner,target.owner)&&['settler','builder','militaryengineer'].includes(baseItem(target.type))&&!(u.owner<=-2&&baseItem(target.type)==='settler')&&!target.greatPerson&&!protectedEnvoy(target)&&!citySheltersUnit(g,target)&&!spec.civilian&&!['sea','air'].includes(spec.domain)&&!unitTransport(u,tileOf(g,u))&&!linkedPartner(g,u)&&!g.units.some(v=>v.hp>0&&v.tile===target.tile&&v.id!==target.id&&v.id!==u.id);
}
function captureCivilian(g,p,u,target){
 if(!canCaptureCivilian(g,u,target))throw Error('此平民受到保护或俘虏位置被占用。');
 const old=target.owner;unlinkUnit(g,target);delete target.activity;delete target.moveOrder;target.owner=p.id;if(p.id<=-2)target.cityState=stateForOwner(g,p.id).id;target.capturedFrom=old;target.captureTurn=g.turn;target.moves=0;target.acted=true;target.fortified=false;u.tile=target.tile;u.linkedUnit=target.id;target.linkedUnit=u.id;
 event(g,'capture',`${p.short} 俘虏了 ${old<0?'蛮族':g.players[old].short} 的 ${UNITS[target.type].name}。`,old>=0?old:p.id,target.tile);
}
export function canTargetUnit(g,u,target){return !citySheltersUnit(g,target)&&!target.greatPerson&&!UNITS[target.type]?.heritage&&(!UNITS[target.type]?.civilian||!g.units.some(v=>v.id!==target.id&&v.owner===target.owner&&v.tile===target.tile&&v.hp>0&&!UNITS[v.type].civilian&&UNITS[v.type].domain!=='air'))&&canAttackUnit(u.type,target.type)&&(!UNITS[u.type].navalOnly||isWater(tileOf(g,target)));}
export function canCityAttackUnit(g,p,c,enemy){
  return !!(c&&c.owner===p.id&&!c.attacked&&c.walls>0&&enemy&&enemy.hp>0&&!citySheltersUnit(g,enemy)&&!enemy.greatPerson&&!UNITS[enemy.type]?.heritage&&UNITS[enemy.type].domain!=='air'&&!UNITS[enemy.type].submarine&&!protectedEnvoy(enemy)&&atWar(g,p.id,enemy.owner)&&p.visible.includes(enemy.tile)&&unitDetected(g,enemy,p.id)&&distance(g,tileOf(g,c),tileOf(g,enemy))<=(governorHas(g,c,'gov_warlord','b')?3:2)&&(distance(g,tileOf(g,c),tileOf(g,enemy))<=2||heritageTradePath(g,c,enemy).slice(1,-1).every(id=>g.map.tiles[id].terrain!=='mountain'&&!g.map.tiles[id].hill)));
}
export function attackTargets(g,p,u){
  if((u.heritageShieldUntil||0)>gameTime(g)||UNITS[u.type].civilian||u.acted||u.moves<=0||g.realtime&&(u.attackUntil||0)>g.realtime.time )return [];
  if(UNITS[u.type].domain==='air'&&!operationalAirBase(g,p,u))return [];
  const air=UNITS[u.type].domain==='air',allowed=t=>(!UNITS[u.type].navalOnly||isWater(t))&&(!air||flightAllowed(g,p,u,t,true));
  const s=tileOf(g,u),embarked=!!unitTransport(u,s),range=embarked?1:attackRange(g,u),visible=new Set(p.visible),ranged=!embarked&&(unitHasRanged(p,u.type)||!!groupFor(g,u,p.id)),domain=unit=>UNITS[unit.type].domain==='sea'||unitTransport(unit,tileOf(g,unit))?'sea':'land';
  return [...g.units.filter(t=>!t.greatPerson&&!protectedEnvoy(t)&&t.owner!==p.id&&atWar(g,p.id,t.owner)&&visible.has(t.tile)&&unitDetected(g,t,p.id)&&canTargetUnit(g,u,t)&&(embarked?distance(g,s,tileOf(g,t))<=range:fleetReach(g,u,tileOf(g,t),p.id))&&allowed(tileOf(g,t))&&(ranged||air||domain(u)===domain(t))).map(t=>({targetUnit:t.id,enemy:t.owner,health:t.hp,distance:distance(g,s,tileOf(g,t))})),...g.cities.filter(c=>!UNITS[u.type].airOnly&&!UNITS[u.type].navalOnly&&c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)&&(embarked?distance(g,s,tileOf(g,c))<=range:fleetReach(g,u,tileOf(g,c),p.id))&&allowed(tileOf(g,c))&&(!embarked&&(ranged||air||UNITS[u.type].domain!=='sea'||neighbors(g.map,tileOf(g,c)).some(isWater)))&&(c.hp>0||c.walls>0||canOccupyCity(g,u,c))).map(c=>({targetCity:c.id,enemy:c.owner,health:c.hp+c.walls,distance:distance(g,s,tileOf(g,c))}))];
}

export function patrolTargets(g,p,u){
  if(!UNITS[u?.type]?.airOnly||UNITS[u.type].domain!=='air'||!operationalAirBase(g,p,u))return [];
  return ownedCities(g,p).filter(c=>distance(g,tileOf(g,u),tileOf(g,c))<=attackRange(g,u)&&flightAllowed(g,p,u,tileOf(g,c),true));
}
function committedNuclearCells(g,p){
  const actions=[...ownedUnits(g,p),...ownedCities(g,p)].flatMap(e=>e.activity?.action.type==='nuke'?[e.activity.action]:[]).concat((g.realtime?.queues?.[p.id]||[]).filter(q=>q.action.type==='nuke').map(q=>q.action));
  return [...new Set(actions.flatMap(action=>nuclearFootprint(g,action.tile)))];
}
function nuclearCarrierRange(g,p,carrier){return carrier?.owner===p.id?(UNITS[carrier.type]?nuclearRange(carrier.type):hasBuilding(carrier,'missilesilo')&&carrier.districts.some(d=>d.item==='missilesilo'&&g.map.tiles[d.tile]?.owner===p.id&&!g.map.tiles[d.tile].pillaged)?24:0):0;}
export function nuclearTargets(g,p,carrier,{reserved=false}={}){
  const isUnit=!!UNITS[carrier?.type],range=nuclearCarrierRange(g,p,carrier);
  if(!range||carrier.owner!==p.id||(!reserved&&nuclearStock(p)<=0)||(carrier.attackUntil||0)>gameTime(g)||isUnit&&(carrier.acted||carrier.moves<=0||UNITS[carrier.type].domain==='air'&&!operationalAirBase(g,p,carrier)))return [];
  const targets=new Set([...g.cities.filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&p.visible.includes(c.tile)).map(c=>c.tile),...g.units.filter(u=>UNITS[u.type].domain!=="air"&&!protectedEnvoy(u)&&u.owner!==p.id&&atWar(g,p.id,u.owner)&&p.visible.includes(u.tile)&&unitDetected(g,u,p.id)).map(u=>u.tile)]);
  return [...targets].filter(id=>distance(g,tileOf(g,carrier),g.map.tiles[id])<=range&&(!isUnit||UNITS[carrier.type].domain!=='air'||flightAllowed(g,p,carrier,g.map.tiles[id],true))).map(tile=>({tile,hint:{...nuclearPreview(g,p,tile),interception:airDefenders(g,p.id,g.map.tiles[tile],{visibleOnly:true,ballistic:!isUnit||UNITS[carrier.type].domain!=='air'}).length}}));
}
function interceptAir(g,p,u,target,{ballistic=false}={}){
  for(const defender of airDefenders(g,p.id,target,{ballistic})){
    const strength=UNITS[defender.type].ranged+fleetStrength(g,defender)+homelandCombatBonus(g,defender),hit=damage(g,strength,(UNITS[u.type]?.strength||70)+fleetStrength(g,u)+homelandCombatBonus(g,u));
    u.hp-=Math.round(hit*(UNITS[u.type]?.stealth?.55:1));defender.attackUntil=gameTime(g)+12;
    visual(g,'attack',defender,{target:{...u,tile:target.id}});event(g,'battle',UNITS[defender.type].name+' 拦截空中目标。',defender.owner,target.id);
    if(u.hp<=0)break;
  }
  return u.hp<=0;
}
function resolveNuclear(g,p,carrier,tile){
  const target=g.map.tiles[tile],air=UNITS[carrier.type]?.domain==='air';
  const missile=air?carrier:{type:'nuclearMissile',hp:120,owner:p.id,tile:carrier.tile};
  if(interceptAir(g,p,missile,target,{ballistic:!air})){if(air)cleanUnits(g);event(g,'battle','核打击被防空系统拦截。',p.id,tile);return;}
  const cells=nuclearFootprint(g,tile),inner=id=>{const t=g.map.tiles[id];let dc=Math.abs(t.col-target.col);if(g.map.wrapX)dc=Math.min(dc,g.map.width-dc);return dc<=1&&Math.abs(t.row-target.row)<=1;};
  for(const unit of g.units)if(cells.includes(unit.tile)&&!unit.greatPerson&&!protectedEnvoy(unit)&&UNITS[unit.type].domain!=='air')heritageDamage(g,unit,inner(unit.tile)?150:65,carrier);
  for(const city of g.cities)if(cells.includes(city.tile)){const strong=inner(city.tile);city.hp=Math.max(0,city.hp-(strong?150:70));city.walls=Math.max(0,city.walls-(strong?450:180));city.population=Math.max(1,Math.floor(city.population*(strong?.5:.8)));city.lastAttackedAt=gameTime(g);cityAttacked(g,p.id,city,event);}
  for(const id of cells){const t=g.map.tiles[id];if(t.district?.kind!=='wonder'&&(t.improvement||t.district))t.pillaged=true;if(t.fort)t.fort.hp=0;}
  visual(g,'nuke',{...carrier,type:carrier.type||'city'},{target:{type:'city',owner:p.id,tile},duration:3});
  event(g,'battle',p.short+' 发动核打击，爆炸覆盖 '+cells.length+' 格。',p.id,tile);cleanUnits(g);refreshVisibility(g);
}

const chopCity=(g,p,t)=>ownedCities(g,p).filter(c=>distance(g,tileOf(g,c),t)<=3).sort((a,b)=>distance(g,tileOf(g,a),t)-distance(g,tileOf(g,b),t)||a.id-b.id)[0];
const chopYield=(g,p,t)=>Math.ceil((t.feature==='forest'?20:16)*gamePace(g).factor*(1+Math.max(0,...p.techs.map(k=>TECHS[k]?.era||0))*.15)*(1+(nationalEffects(p,gameTime(g)).chopMultiplier||0)));
export function policySlots(g,p){return governmentSlots(g,p).length;}
export function tradeCapacity(g,p){return 1+(activeGovernor(g,p,'gov_merchant')?1:0)+(heritageEffects(g,p).tradeCapacity||0)+(operationalWonder(g,'colossus',p.id)?1:0)+(p.uniqueTradeBonus||0)+(nationalEffects(p,gameTime(g)).tradeCapacity||0)+ownedCities(g,p).reduce((s,c)=>s+Number(hasBuilding(c,'commercial'))+Number(hasBuilding(c,'harbor')),0)+(p.government==='merchant'?2:0);}
function researchRelevance(p,item,civic,weights){
  let value=0;
  for(const [key,spec]of Object.entries(BUILDINGS))if(contentEligible(p,spec)&&replacementFor(p,key)===key&&spec[civic?'civic':'tech']===item){for(const [k,n]of Object.entries(spec.yields||{}))value+=n*(weights[{gold:'commerce',production:'industry',food:'growth',faith:'faith',culture:'culture',science:'science'}[k]]||1);if(spec.housing)value+=spec.housing*weights.growth;}
  if(!civic)for(const [key,spec]of Object.entries(UNITS))if(contentEligible(p,spec)&&replacementFor(p,key)===key&&spec.tech===item&&!spec.civilian)value+=Math.max(spec.strength||0,spec.ranged||0)*.07*(spec.domain==='sea'?weights.naval:weights.aggression);
  if(civic)for(const spec of Object.values(POLICIES))if(spec.civic===item)value+=2;
  return Math.min(35,value);
}
function combatEstimate(g,p,u,target){
  const spec=UNITS[u.type],enemy=target.targetUnit!==undefined?g.units.find(e=>e.id===target.targetUnit):g.cities.find(c=>c.id===target.targetCity),ranged=(!!spec.ranged||distance(g,tileOf(g,u),tileOf(g,enemy))>1&&!!groupFor(g,u,p.id))&&!unitTransport(u,tileOf(g,u));
  const pair=combatStrengths(g,u,enemy,p.id),attack=pair.attack.strength,defense=pair.defense.strength;
  const typical=combatDamage;
  const wallContext={...siegeSupport(g,u,p.id),wallSpecialty:tileOf(g,u).owner===p.id||neighbors(g.map,tileOf(g,u)).some(t=>t.fort?.owner===p.id&&t.fort.hp>0)};
  const rawDamage=typical(attack,Math.max(8,defense));let expectedDamage=rawDamage*(spec.consumable?1.5:1);if(target.targetCity!==undefined){const first=cityAttackDamage(u.type,enemy,rawDamage,p,wallContext);expectedDamage=first.total;if(spec.consumable)expectedDamage+=cityAttackDamage(u.type,{...enemy,hp:Math.max(0,enemy.hp-first.cityDamage),walls:Math.max(0,enemy.walls-first.wallDamage)},Math.round(rawDamage*.5)).total;}
  const retaliation=ranged||target.targetCity!==undefined&&enemy.hp<=0&&enemy.walls<=0||target.targetUnit!==undefined&&UNITS[enemy.type].civilian?0:typical(defense,attack);
  const city=target.targetCity!==undefined,occupationEligible=city&&canOccupyCity(g,u,{...enemy,hp:0,walls:0}),supportCapturers=city?g.units.filter(other=>other.owner===p.id&&other.hp>25&&occupationUnit(other.type)&&(UNITS[other.type].domain!=='sea'||isWater(tileOf(g,enemy))||neighbors(g.map,tileOf(g,enemy)).some(isWater))&&!unitTransport(other,tileOf(g,other))&&distance(g,tileOf(g,other),tileOf(g,enemy))<=4).length:0;
  return {civilianCapture:target.targetUnit!==undefined&&!ranged&&canCaptureCivilian(g,u,enemy),attackModifiers:pair.attack.modifiers,defenseModifiers:pair.defense.modifiers,consumable:!!spec.consumable,interception:spec.domain==='air'?airDefenders(g,p.id,tileOf(g,enemy),{visibleOnly:true}).reduce((n,v)=>n+Math.round(Math.round(combatDamage((UNITS[v.type].ranged||0)+fleetStrength(g,v,p.id)+homelandCombatBonus(g,v,p.id),spec.strength+fleetStrength(g,u,p.id)+homelandCombatBonus(g,u,p.id)))*(spec.stealth?.55:1)),0):0,strength:attack,defense,expectedDamage:city?Math.min(expectedDamage,enemy.hp+enemy.walls):expectedDamage,retaliation,ranged,siege:!!spec.siege,cityDamageMultiplier:city?cityDamageMultiplier(u.type):1,wallMultiplier:city&&enemy.walls>0?wallDamageMultiplier(u.type,enemy,p,wallContext):0,wallTier:city?WALL_TIERS.indexOf(cityWallTier(enemy)):0,walls:city?enemy.walls:0,cityHp:city?enemy.hp:undefined,occupationEligible,danger:g.units.filter(other=>other.owner!==p.id&&other.hp>0&&atWar(g,p.id,other.owner)&&p.visible.includes(other.tile)&&!UNITS[other.type].civilian&&distance(g,tileOf(g,u),tileOf(g,other))<=1).length,captureNow:city&&enemy.hp<=0&&enemy.walls<=0&&occupationEligible,supportCapturers};
}
export function legalActions(g,p,options={}){return evaluate(g,()=>legalActionsInternal(g,p,options));}
function visibleIncomingDamage(g,p,u,destination,enemies,cities){
  const projected={...u,tile:destination.id,fortified:destination.id===u.tile&&u.fortified},water=isWater(destination);
  const typical=combatDamage;
  let incoming=0;
  for(const e of enemies){const spec=UNITS[e.type];if(spec.civilian||!canTargetUnit(g,e,projected))continue;const transported=!!unitTransport(e,tileOf(g,e)),ranged=(!!spec.ranged||!!groupFor(g,e,p.id))&&!transported;
    if(!(transported?distance(g,destination,tileOf(g,e))<=1:fleetReach(g,e,destination,p.id))||!ranged&&spec.domain!=='air'&&water!==(spec.domain==='sea'||transported))continue;
    const pair=combatStrengths(g,e,projected,p.id);incoming+=typical(pair.attack.strength,pair.defense.strength);
  }
  // City fire uses a conservative public technology-era estimate, not hidden research counts.
  if(UNITS[u.type].domain!=='air'&&!UNITS[u.type].submarine)for(const c of cities)if(c.walls>0&&distance(g,destination,tileOf(g,c))<=2)incoming+=typical(35+Math.max(0,...g.players[c.owner].techs.map(k=>TECHS[k]?.era||0))*6+intelligenceBonus(g,c.owner,p.id,destination,p.id),unitCombatProfile(g,projected,true,c,{viewer:p.id}).strength);
  return round(incoming);
}
// Prioritize revealed, developable supplies that block currently researched models.
function missingStrategicResources(p,supplies){return new Set(Object.entries(PRODUCTION).filter(([item,spec])=>spec.resource&&RESOURCES[spec.resource]?.category==='strategic'&&!supplies[spec.resource]&&eligible(p,spec)&&(!UNITS[item]||!retiredUnit(p,item))).map(([,spec])=>spec.resource));}
function strategicResourceSites(g,p,known){
  const needed=missingStrategicResources(p,playerResources(g,p));
  return g.map.tiles.filter(t=>known.has(t.id)).map(t=>rememberedTile(p,t)).filter(t=>t.owner===p.id&&needed.has(t.resource)&&(!RESOURCES[t.resource].tech||has(p,RESOURCES[t.resource].tech))&&!t.district&&!t.fort&&t.cityId==null&&(improvementFor(p,t)||t.pillaged&&t.improvement===RESOURCES[t.resource].improvement||t.feature&&canChop(p,t)&&improvementFor(p,{...t,feature:null})));
}
// Value actual improvement gains and extracted supplies using owner information only.
function builderProjects(g,p,own,known,plan){
  const projects=new Map(),visible=new Set(p.visible),supplies=playerResources(g,p),needed=missingStrategicResources(p,supplies),cities=own.map(c=>({city:c,tile:tileOf(g,c),yields:cityYields(g,c)}));
  const unhappy=cities.filter(c=>c.yields.amenities<0),amenityNeed=Math.min(20,Math.max(0,...unhappy.map(c=>-c.yields.amenities))*5);
  for(const real of g.map.tiles){
    if(!known.has(real.id))continue;
    if(!visible.has(real.id)&&!p.knownTiles?.[real.id])continue;const memory=planningTile(g,p,real);
    const revealed=RESOURCES[memory.resource]&&(!RESOURCES[memory.resource].tech||has(p,RESOURCES[memory.resource].tech)),t=revealed?memory:{...memory,resource:null};
    if(t.owner!==p.id||coastalWorkBlocked(g,t))continue;
    if(t.district||t.fort||t.cityId!=null){if(t.pillaged||t.roadPillaged||t.fort&&t.fort.hp<160)projects.set(t.id,{tile:t.id,charges:1,value:38,resourceFirstValue:0});continue;}
    const repair=!!(t.pillaged&&t.improvement),direct=improvementFor(p,t),cleared=!direct&&canChop(p,t)?improvementFor(p,{...t,feature:null}):null,item=repair?t.improvement:direct||cleared;
    if(!item){if(t.roadPillaged)projects.set(t.id,{tile:t.id,charges:1,value:38,resourceFirstValue:0});continue;}
    const requiresClear=!repair&&!direct&&!!cleared,after={...t,improvement:item,pillaged:false,feature:requiresClear?null:t.feature},beforeYield=tileYield(t,p),afterYield=tileYield({...after,...naturalTileProjection(g,p,after)},p);
    const city=cities.find(c=>c.city.id===t.territoryCity)||cities.reduce((best,c)=>distance(g,c.tile,t)<=3&&(!best||distance(g,c.tile,t)<distance(g,best.tile,t))?c:best,null),local=city&&distance(g,city.tile,t)<=3;
    const plotScore=y=>y.food*(city?.city.population>=city?.yields.housing?.8:1.5)+y.production*1.3+y.gold*.4+y.science+y.culture*.8;
    const useful=local&&(city.city.worked?.includes(t.id)||city.city.worked?.length<city.city.population||plotScore(afterYield)>=Math.min(...(city.city.worked||[]).map(id=>plotScore(tileYield(g.map.tiles[id],p)))));
    const foodNeed=!!(local&&city.yields.netFood<0),foodWeight=foodNeed?12:local&&city.yields.netFood<2&&city.city.population<city.yields.housing?4:1.5;
    const weights={food:foodWeight,production:3*Math.max(.75,Math.min(1.75,plan.weights.industry)),gold:1.5*Math.max(.75,Math.min(1.75,plan.weights.commerce)),science:2,culture:1.5,faith:1};
    const yieldValue=Math.max(0,YIELD_KEYS.reduce((n,k)=>n+(afterYield[k]-beforeYield[k])*weights[k],0)*3*(useful?1:.35)),resource=RESOURCES[t.resource],extracts=resource&&item===resource.improvement,copies=extracts?supplies[t.resource]||0:0;
    let resourceValue=0,resourceFirstValue=0;
    if(extracts&&resource.category==='strategic'){resourceFirstValue=needed.has(t.resource)?80:copies===0?24:0;resourceValue=resourceFirstValue+(copies>0?10/(copies+1):0);}
    else if(extracts&&resource.category==='luxury'){resourceFirstValue=copies===0?55+Math.min(40,unhappy.length*8)+amenityNeed:0;resourceValue=resourceFirstValue+(copies>0?8/(copies+1):0);}
    else if(extracts&&resource.category==='bonus')resourceValue=8;
    projects.set(t.id,{tile:t.id,charges:requiresClear?2:1,requiresClear,value:round(Math.min(180,yieldValue+resourceValue)),resourceFirstValue,resourceType:extracts?t.resource:null,resourceCategory:extracts?resource.category:null,resourceCopies:copies,foodNeed,foodGain:afterYield.food-beforeYield.food});
  }
  return projects;
}
function legalActionsInternal(g,p,{pathsForUnit,nativeRoutes=false}={}){
  if(!p.alive||g.winner)return [];
  const geoContext=geopoliticalContext(g,p,{cached:true}),actions=heritageActions(g,p),plan=developmentPlan(g,p),own=ownedCities(g,p),units=ownedUnits(g,p),known=new Set(p.explored),visible=new Set(p.visible);
  const posture=campaignPosture(g,p,plan),defenses=new Map(own.map(c=>[c.id,defenseSituation(g,p,c,visible)]));
  const domestic=domesticState(g,p,defenses),spaceBuilt=own.filter(c=>operationalSpaceport(g,p,c)).length,spacePending=own.filter(c=>c.production?.item==='spaceport').length;
  const guardUnit=u=>u.hp>=60&&!UNITS[u.type].civilian&&!UNITS[u.type].siege&&!UNITS[u.type].airOnly&&u.type!=='scout'&&(UNITS[u.type].domain||'land')==='land'&&!unitTransport(u,tileOf(g,u));
  const preparationCity=posture.stance==='peace'&&!domestic.invaded&&!domestic.threatened.length&&domestic.regional.risk>=.5?own.find(c=>c.id===domestic.regional.frontierCity):null;
  const preparingUnits=new Set();
  if(preparationCity){const guards=units.filter(guardUnit),near=guards.filter(u=>distance(g,tileOf(g,u),tileOf(g,preparationCity))<=2).length;for(const u of guards.filter(u=>!u.activity&&distance(g,tileOf(g,u),tileOf(g,preparationCity))>2).sort((a,b)=>distance(g,tileOf(g,a),tileOf(g,preparationCity))-distance(g,tileOf(g,b),tileOf(g,preparationCity))||a.id-b.id).slice(0,Math.max(0,2-near)))preparingUnits.add(u.id);}
  const spaceLimit=plan.goal==='science'&&own.length>=8&&p.spaceStage>0?2:1;
  const spaceCapacity=new Map(own.map(c=>[c.id,cityYields(g,c).production/(1+(defenses.get(c.id)?.urgency||0)*3)]));
  // A productive but fully built-up city must not monopolize the spaceport slot.
  // Rank real legal sites first, preserving the existing revealed-resource safeguard.
  const spaceSites=new Map(own.map(c=>[c.id,tilesInRange(g.map,tileOf(g,c),2).filter(t=>buildable(g,p,c,'spaceport',t.id))]));
  const safeSpace=c=>spaceSites.get(c.id).some(t=>{const resource=RESOURCES[rememberedTile(p,t).resource];return resource?.category!=='strategic'||resource.tech&&!has(p,resource.tech);});
  const spaceCandidates=own.filter(c=>!operationalSpaceport(g,p,c)&&spaceSites.get(c.id).length).sort((a,b)=>Number(safeSpace(b))-Number(safeSpace(a))||spaceCapacity.get(b.id)-spaceCapacity.get(a.id)||a.id-b.id);
  // Aircraft fill a bounded independent role only when an actual visible mission is reachable.
  const fleetCarriers=units.filter(u=>UNITS[u.type].airCapacity),freeDecks=fleetCarriers.filter(c=>deckAvailable(g,c));
  const airBases=[...own.flatMap(c=>c.districts.filter(d=>operationalAirport(g,p,g.map.tiles[d.tile])&&deploymentFree(g,d.tile)).map(d=>g.map.tiles[d.tile])),...freeDecks.map(c=>g.map.tiles[c.tile])];
  const airMissions=[...g.units.filter(u=>u.hp>0&&u.owner!==p.id&&atWar(g,p.id,u.owner)&&visible.has(u.tile)&&unitDetected(g,u,p.id)&&!UNITS[u.type].civilian).map(u=>g.map.tiles[u.tile]),...g.cities.filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)&&(c.hp>0||c.walls>0)).map(c=>g.map.tiles[c.tile]),...Object.values(p.knownCities||{}).filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&!visible.has(c.tile)).map(c=>g.map.tiles[c.tile]).filter(Boolean)];
  const airReach=new Map();
  const airTargetsFor=(type,c)=>{
    if(UNITS[type]?.domain!=='air')return 0;
    const spec=UNITS[type];if(!airReach.has(type))airReach.set(type,new Map(airBases.map(base=>[base.id,new Set(airMissions.filter(target=>distance(g,base,target)<=attackRange(g,{type,owner:p.id})&&flightAllowed(g,p,{type,owner:p.id,tile:base.id},target,true)).map(t=>t.id))])));
    const missions=new Set(),coverage=airReach.get(type);
    for(const from of airBases.filter(base=>base.district?.city===c.id))for(const base of airBases)if(from.id===base.id||distance(g,from,base)<=spec.rebaseRange&&flightAllowed(g,p,{type,owner:p.id,tile:from.id},base,true))for(const id of coverage.get(base.id))missions.add(id);
    return missions.size;
  };
  const finance=militaryFinance(g,p);
  const researchIncome=empireYields(g,p),bestLandStrength=Math.max(0,...units.filter(u=>!UNITS[u.type].civilian&&(UNITS[u.type].domain||'land')==='land').map(u=>Math.max(UNITS[u.type].strength||0,UNITS[u.type].ranged||0)));
  const researchUrgency=(item,civic)=>{
    if(!domestic.invaded&&!domestic.threatened.length)return 0;
    const income=civic?researchIncome.culture:researchIncome.science,cost=researchCost(g,item,civic,(civic?p.inspirations:p.boosts).includes(item)),progress=(civic?p.civicProgress:p.researchProgress)[item]||0;
    if((cost-progress)/Math.max(.01,income)>8)return 0;
    const supplies=playerResources(g,p),gain=Math.max(0,...Object.entries(UNITS).filter(([key,s])=>contentEligible(p,s)&&replacementFor(p,key)===key&&s[civic?'civic':'tech']===item&&!s.civilian&&(s.domain||'land')==='land'&&(!s.resource||supplies[s.resource]>0)).map(([,s])=>Math.max(s.strength||0,s.ranged||0)-bestLandStrength));
    return gain>0?Math.min(90,40+gain):0;
  };
  const bestAircraft=['drone','stealthbomber','bomber'].filter(type=>eligible(p,UNITS[type])).sort((a,b)=>attackRange(g,{type:b,owner:p.id})-attackRange(g,{type:a,owner:p.id})||(UNITS[b].ranged-UNITS[a].ranged))[0]||null;
  const airportTargetsFor=base=>bestAircraft&&playerResources(g,p).oil&&base?airMissions.filter(target=>distance(g,base,target)<=attackRange(g,{type:bestAircraft,owner:p.id})&&flightAllowed(g,p,{type:bestAircraft,owner:p.id,tile:base.id},target,true)).length:0;
  const airBaseNeeded=!airBases.some(base=>airportTargetsFor(base)>0);
  const airInfrastructurePending=own.filter(c=>c.production?.item==='airport'&&airportTargetsFor(g.map.tiles[c.production.tile])>0).length;
  // Recruitment routes use remembered water only; a disconnected lake is not an ocean mission.
  const seaEnemies=g.units.filter(u=>u.hp>0&&u.owner!==p.id&&atWar(g,p.id,u.owner)&&visible.has(u.tile)&&unitDetected(g,u,p.id)&&isWater(tileOf(g,u))&&!protectedEnvoy(u));
  const coastalEnemies=Object.values(p.knownCities||{}).filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&neighbors(g.map,g.map.tiles[c.tile]).some(n=>isWater(p.knownTiles?.[n.id])));
  const navalReach=new Map();
  const navalTargetsFor=(type,c)=>{
    const spec=UNITS[type];if(spec?.domain!=='sea')return 0;
    const key=type+':'+c.id;if(navalReach.has(key))return navalReach.get(key);
    const nuclear=!!nuclearRange(type)&&(nuclearStock(p)>0||own.some(city=>city.production?.item==='atomicbomb'));
    const goals=[...seaEnemies.map(u=>({tile:u.tile,range:spec.range||1})),...(!spec.navalOnly||nuclear?coastalEnemies.map(city=>({tile:city.tile,range:spec.navalOnly?nuclearRange(type):spec.range||1})):[])];
    const route=routeGuidance(g,p,{type,owner:p.id,tile:c.tile},goals,{explore:false});
    const targets=route&&route.distance(c.tile)<18?goals.length:0;navalReach.set(key,targets);return targets;
  };
  const military=units.filter(u=>!UNITS[u.type].civilian),enemies=g.units.filter(u=>!protectedEnvoy(u)&&u.owner!==p.id&&atWar(g,p.id,u.owner)&&visible.has(u.tile)&&unitDetected(g,u,p.id));
  const resourceSites=strategicResourceSites(g,p,known).filter(t=>!enemies.some(e=>!UNITS[e.type].civilian&&!UNITS[e.type].airOnly&&!UNITS[e.type].navalOnly&&distance(g,t,tileOf(g,e))<=4)&&!g.cities.some(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)&&c.walls>0&&distance(g,t,tileOf(g,c))<=2));
  const builders=units.filter(u=>u.type==='builder'),pendingBuilders=finance.cityCommitments.filter(c=>c.item==='builder').map(c=>own.find(city=>city.id===c.id)),manualWorkers=new Set((g.realtime?.queues?.[p.id]||[]).filter(q=>q.manual).map(q=>q.action.unit));
  // A worker on a disconnected island or without enough charges cannot supply this deposit.
  const uncoveredResources=new Set([...new Set(resourceSites.map(t=>t.resource))].filter(resource=>{
    const sites=resourceSites.filter(t=>t.resource===resource),route=routeGuidance(g,p,{type:'builder',owner:p.id,tile:own[0]?.tile},sites.map(t=>({tile:t.id})),{explore:false});
    const singleCharge=sites.filter(t=>!t.feature||improvementFor(p,t)||t.pillaged&&t.improvement===RESOURCES[resource].improvement),singleRoute=singleCharge.length===sites.length?route:singleCharge.length&&builders.some(u=>u.charges===1)?routeGuidance(g,p,{type:'builder',owner:p.id,tile:own[0]?.tile},singleCharge.map(t=>({tile:t.id})),{explore:false}):null;
    return !pendingBuilders.some(c=>c&&route?.distance(c.tile)<900)&&!builders.some(u=>u.charges>0&&!manualWorkers.has(u.id)&&(u.charges>=2?route:singleRoute)?.distance(u.tile)<900);
  }));
  const workerGoals=resourceSites.filter(t=>uncoveredResources.has(t.resource)).map(t=>({tile:t.id})),workerRoute=own.length&&workerGoals.length?routeGuidance(g,p,{type:'builder',owner:p.id,tile:own[0].tile},workerGoals,{explore:false}):null;
  const resourceWorkers=builders.length+pendingBuilders.length,resourceWorkerTarget=resourceWorkers+Math.min(3,uncoveredResources.size);
  const rescueCities=route=>route?own.filter(c=>route.distance(c.tile)<900&&defenses.get(c.id).urgency===0&&!c.production?.funded&&(!c.production||!UNITS[c.production.item]&&!WONDERS[c.production.item]&&!PROJECTS[c.production.item]?.stage&&c.production.item!=='spaceport'&&c.production.progress<orderCost(g,c)*.5)).sort((a,b)=>route.distance(a.tile)-route.distance(b.tile)||a.id-b.id):[];
  const resourceCities=rescueCities(workerRoute);
  const resourceRescue=resourceWorkers<resourceWorkerTarget?resourceCities[0]?.id:null;
  const projects=builderProjects(g,p,own,known,plan),economicProjects=resourceRescue!=null?[]:[...projects.values()].filter(project=>(project.resourceCategory==='luxury'&&project.resourceCopies===0||project.foodNeed&&project.foodGain>0)&&!enemies.some(e=>!UNITS[e.type].civilian&&!UNITS[e.type].airOnly&&!UNITS[e.type].navalOnly&&distance(g,g.map.tiles[project.tile],tileOf(g,e))<=4)&&!g.cities.some(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)&&c.walls>0&&distance(g,g.map.tiles[project.tile],tileOf(g,c))<=2));
  const economicRoute=own.length&&economicProjects.length?routeGuidance(g,p,{type:'builder',owner:p.id,tile:own[0].tile},economicProjects.map(project=>({tile:project.tile})),{explore:false}):null;
  const singleChargeProjects=economicProjects.filter(project=>project.charges===1),economicSingleRoute=singleChargeProjects.length===economicProjects.length?economicRoute:singleChargeProjects.length&&builders.some(u=>u.charges===1)?routeGuidance(g,p,{type:'builder',owner:p.id,tile:own[0]?.tile},singleChargeProjects.map(project=>({tile:project.tile})),{explore:false}):null;
  const economicCovered=pendingBuilders.some(c=>economicRoute?.distance(c.tile)<900)||builders.some(u=>u.charges>0&&!manualWorkers.has(u.id)&&(u.charges>=2?economicRoute:economicSingleRoute)?.distance(u.tile)<900);
  const economicWorkerTarget=resourceWorkers+(economicRoute&&!economicCovered?1:0),economicRescue=economicWorkerTarget>resourceWorkers?rescueCities(economicRoute)[0]?.id:null;
  // Replan one unfinished development queue only while no guard is committed.
  // Preserve essential income, funded work and scientific completion projects.
  const reserveCommitments=finance.cityCommitments.filter(c=>UNITS[c.item]&&!UNITS[c.item].civilian&&(UNITS[c.item].domain||'land')==='land'&&!UNITS[c.item].siege&&!UNITS[c.item].airOnly&&c.item!=='scout').length;
  const readinessRescue=!p.manual&&preparationCity&&domestic.reserveReady+reserveCommitments<domestic.reserveTarget&&!reserveCommitments&&finance.arrears<=.01&&(finance.projectedNet>=0||p.gold>=Math.max(100,finance.reserve*5))&&!own.some(c=>!c.production)?own.filter(c=>!c.production.funded&&!UNITS[c.production.item]&&!WONDERS[c.production.item]&&!PROJECTS[c.production.item]?.stage&&!['spaceport','commercial','market','bank','stock','harbor'].includes(c.production.item)&&c.production.progress<orderCost(g,c)*.4&&c.id!==resourceRescue&&c.id!==economicRescue).sort((a,b)=>distance(g,tileOf(g,a),tileOf(g,preparationCity))-distance(g,tileOf(g,b),tileOf(g,preparationCity))||productionRate(g,b)-productionRate(g,a)||a.id-b.id)[0]?.id:null;
  const wonderKeepers=new Map();
  for(const c of own)if(WONDERS[c.production?.item]&&!g.wonders[c.production.item]){const remaining=Math.max(0,orderCost(g,c)-c.production.progress)/Math.max(.01,productionRate(g,c)),old=wonderKeepers.get(c.production.item);if(!old||remaining<old.remaining||remaining===old.remaining&&c.id<old.city)wonderKeepers.set(c.production.item,{city:c.id,remaining});}
  if((p.leaderAbility?.readyAt||0)<=gameTime(g))actions.push({type:'leaderAbility',hint:{effects:leaderFor(p).effects,goal:plan.goal,utility:leaderAbilityUtility(g,p)}});
  for(const [item,spec] of Object.entries(TECHS))if(!p.techs.includes(item)&&spec.requires.every(k=>has(p,k)))actions.push({type:'research',item,hint:{strategicValue:researchRelevance(p,item,false,plan.weights),progress:p.researchProgress[item]||0,boosted:p.boosts.includes(item),cost:researchCost(g,item,false),effectiveCost:researchCost(g,item,false,p.boosts.includes(item)),urgentValue:researchUrgency(item,false),baseCost:spec.cost,era:spec.era}});
  for(const [item,spec] of Object.entries(CIVICS))if(!p.civics.includes(item)&&spec.requires.every(k=>has(p,k)))actions.push({type:'civic',item,hint:{strategicValue:researchRelevance(p,item,true,plan.weights),progress:p.civicProgress[item]||0,boosted:p.inspirations.includes(item),cost:researchCost(g,item,true),effectiveCost:researchCost(g,item,true,p.inspirations.includes(item)),urgentValue:researchUrgency(item,true),baseCost:spec.cost,era:spec.era}});
  actions.push(...politicalActions(g,p,politicsContext(g,p,plan,empireYields(g,p))),...congressActions(g,p));
  if(!p.religion&&p.faith>=120&&g.players.filter(o=>o.religion).length<Math.min(Object.keys(RELIGIONS).length,Math.ceil(g.players.length/2)+1)&&own.some(c=>hasBuilding(c,'holy')))for(const item of Object.keys(RELIGIONS).filter(k=>!g.players.some(o=>o.religion===k)))actions.push({type:'religion',item});
  if(!p.religion&&p.faith>=120&&independentReligions(g).length>=religionCapacity(g)&&own.some(c=>operationalBuilding(g,c,'holy')))for(const parent of independentReligions(g).filter(o=>o.alive))actions.push({type:'affiliateReligion',player:parent.id,hint:{religionParent:parent.id,faithCost:120,utility:religionChoiceUtility(g,p,religionBelief(g,parent,'follower')||{})+religionChoiceUtility(g,p,religionBelief(g,parent,'worship')||{})}});
  const religious=affiliationStatus(g,p);if(religious?.canRevolt&&p.relations[religious.parent]?.status==='peace'&&truceRemaining(g,p.id,religious.parent)<=0)actions.push({type:'war',player:religious.parent,warKind:'religious',hint:{religiousIndependence:true}});
  actions.push(...religionActions(g,p));
  const breachedCities=g.cities.filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)&&c.hp<=0&&c.walls<=0);
  const groundCapturers=units.filter(u=>u.hp>25&&occupationUnit(u.type)&&(UNITS[u.type].domain||'land')==='land'&&!unitTransport(u,tileOf(g,u)));
  for(const c of own){
    for(const target of nuclearTargets(g,p,c))actions.push({type:'nuke',city:c.id,...target});
    const defense=defenses.get(c.id),emergency=defense.urgency>=1;
    const captureTargets=breachedCities.filter(target=>distance(g,tileOf(g,c),tileOf(g,target))<=12&&!groundCapturers.some(u=>distance(g,tileOf(g,u),tileOf(g,target))<=8)&&!own.some(city=>occupationUnit(city.production?.item)&&(UNITS[city.production.item].domain||'land')==='land'&&distance(g,tileOf(g,city),tileOf(g,target))<=12)).map(target=>target.id);
    const captureNeeded=captureTargets.length>0;
    const currentUnit=UNITS[c.production?.item],recruitment=localRecruitment(g,c,domestic);
    const surplusSpace=c.production?.item==='spaceport'&&spaceCandidates.findIndex(o=>o.id===c.id)>=Math.max(0,spaceLimit-spaceBuilt)||!!PROJECTS[c.production?.item]?.stage&&PROJECTS[c.production.item].stage<=p.spaceStage;
    const unavailableNuclear=c.production?.item==='atomicbomb'&&(nuclearStock(p)>=3||c.production.progress>=orderCost(g,c)&&!buildable(g,p,c,'atomicbomb'));
    const obsoleteWonder=!!WONDERS[c.production?.item]&&(!!g.wonders[c.production.item]||wonderKeepers.get(c.production.item)?.city!==c.id);
    const unavailableRecruitment=!!currentUnit&&(retiredUnit(p,c.production.item)||c.production.progress>=orderCost(g,c)&&!buildable(g,p,c,c.production.item,c.production.tile));
    const surplusMilitary=!p.manual&&!!currentUnit&&!currentUnit.civilian&&!c.production.funded&&c.production.progress<orderCost(g,c)*.5&&(domestic.ready>=domestic.target||finance.projectedNet<0&&(p.gold<Math.max(40,finance.reserve)||p.militaryArrears>0))&&defense.urgency===0&&!captureNeeded;
    const preparationSwitch=c.id===readinessRescue,militarySwitch=preparationSwitch||emergency&&!!c.production&&(!currentUnit||currentUnit.civilian)||captureNeeded&&!!c.production&&(!occupationUnit(c.production.item)||(currentUnit?.domain||'land')!=='land'),climateStalled=!!c.production&&(c.production.tile!=null&&coastalWorkBlocked(g,g.map.tiles[c.production.tile])||PROJECTS[c.production.item]?.stage&&c.districts.some(d=>d.item==='spaceport'&&coastalWorkBlocked(g,g.map.tiles[d.tile]))),switchOrder=militarySwitch||climateStalled||surplusSpace||obsoleteWonder||unavailableRecruitment||unavailableNuclear||surplusMilitary||!p.manual&&(c.id===resourceRescue||c.id===economicRescue)&&!captureNeeded;
    if(!c.production||switchOrder)for(const op of productionOptions(g,p,c)){const spec=PRODUCTION[op.item];if(militarySwitch&&(!UNITS[op.item]||spec.civilian||spec.domain==='sea'||spec.domain==='air'))continue;actions.push({type:'produce',city:c.id,item:op.item,...(op.tile!==undefined?{tile:op.tile}:{}),hint:{baseItem:baseItem(op.item),placementLoss:op.placementLoss||0,siteRisk:op.siteRisk||0,climateUtility:climateProductionUtility(g,c,op.item),...(WONDERS[op.item]?{wonderUtility:wonderAIUtility(g,p,c,op.item)}:{}),...(UNITS[op.item]?{unitPreference:unitPreference(personality(g,p),UNITS[op.item])}:{}),economicFoodNeed:economicProjects.some(project=>project.foodNeed&&project.foodGain>0),economicWorkerTarget,economicDistance:economicRoute?.distance(c.tile)??999,resourceWorkerTarget,resourceDistance:workerRoute?.distance(c.tile)??999,strategicDeposit:!!op.strategicDeposit,emergency,captureNeeded,captureTargets,recruitment,militaryTarget:domestic.target,reserveTarget:domestic.reserveTarget,preparation:domestic.preparation,regionalRisk:domestic.regional.risk,preparationSwitch,surplusMilitary,spaceBuilt,spacePending,spaceLimit,spaceRank:spaceCandidates.findIndex(o=>o.id===c.id),scienceGoal:plan.goal==='science',homelandInvaded:domestic.invaded,defenseUrgency:defense.urgency,defenseShortfall:defense.shortfall,frontlineNeeded:defense.frontline===0,minDefenseStrength:defense.minStrength,switchOrder,upkeep:productionUpkeep(g,p,op.item),currentUpkeep:productionUpkeep(g,p,c.production?.item),support:spec.support||'',civilian:!!spec.civilian,recon:!!spec.recon,specialty:!!spec.support||spec.engineer||op.item==='archaeologist',knownRuins:Object.values(p.knownTiles||{}).filter(t=>t.ruin&&(t.owner===null||t.owner===p.id)).length,kind:spec.kind||'unit',strength:spec.strength||0,ranged:spec.ranged||0,siege:!!spec.siege,siegeTier:spec.siegeTier||0,medical:!!spec.medical,medicalTier:spec.medical||0,wounded:units.filter(u=>!UNITS[u.type].civilian&&UNITS[u.type].domain!=='air'&&u.hp<maxUnitHp(u.type)*.8).length,wallMatch:spec.siegeTier?g.cities.some(enemy=>enemy.owner!==p.id&&atWar(g,p.id,enemy.owner)&&visible.has(enemy.tile)&&unitDetected(g,enemy,p.id)&&enemy.walls>0&&siegeMatchesWall(op.item,enemy,p)):false,airfield:op.item==='airport'&&!!bestAircraft&&!!playerResources(g,p).oil,canCapture:occupationUnit(op.item),domain:spec.domain||'land',nuclearLaunchers:units.filter(unit=>nuclearRange(unit.type)).length+own.filter(city=>hasBuilding(city,"missilesilo")).length,antiAir:!!spec.antiAir,airOnly:!!spec.airOnly,submarine:!!spec.submarine,antiSubmarine:spec.antiSubmarine||0,carrier:!!spec.airCapacity,carrierAirReady:units.some(u=>UNITS[u.type].domain==='air'&&!UNITS[u.type].consumable),carrierSlots:freeDecks.reduce((n,c)=>n+UNITS[c.type].airCapacity-deckAircraft(g,c).length,0),carrierTech:p.techs.includes('combinedarms'),navalTargets:navalTargetsFor(op.item,c),submarineThreat:seaEnemies.some(e=>UNITS[e.type].submarine&&distance(g,tileOf(g,e),tileOf(g,c))<=18),airThreat:g.units.some(enemy=>enemy.owner!==p.id&&atWar(g,p.id,enemy.owner)&&visible.has(enemy.tile)&&unitDetected(g,enemy,p.id)&&UNITS[enemy.type].domain==='air'&&distance(g,tileOf(g,enemy),tileOf(g,c))<=24),airTargets:op.item==='airport'?airportTargetsFor(g.map.tiles[op.tile]):airTargetsFor(op.item,c),airBaseNeeded,airInfrastructurePending,military:!!UNITS[op.item]&&!spec.civilian,obsolete:op.obsolete,turns:op.turns,adjacency:op.adjacency||0,population:c.population,food:cityYields(g,c).netFood,housing:housing(g,c)}});}
    const fort=fortressRecruitment(g,c).filter(f=>deploymentFree(g,f.tile)).sort((a,b)=>distance(g,g.map.tiles[a.tile],tileOf(g,c))-distance(g,g.map.tiles[b.tile],tileOf(g,c)))[0];
    if(fort)for(const action of actions.filter(a=>a.type==='produce'&&a.city===c.id&&a.hint.military&&a.hint.domain==='land'))actions.push({...action,fortress:fort.tile,hint:{...action.hint,fortressBonus:fort.bonus,turns:Math.ceil(Math.max(0,productionCost(g,action.item)-c.storedProduction)/productionRate(g,c,{item:action.item,fortress:fort.tile}))}});
    if(has(p,'trade')&&g.routes.filter(r=>r.owner===p.id).length<tradeCapacity(g,p)&&!g.routes.some(r=>r.from===c.id)){
      for(const target of g.cities.filter(t=>t.id!==c.id&&(t.owner===p.id||p.met.includes(t.owner)&&!atWar(g,p.id,t.owner))&&(t.owner===p.id||p.knownCities?.[t.id])&&known.has(t.tile)&&distance(g,tileOf(g,t),tileOf(g,c))<=18))actions.push({type:'trade',city:c.id,targetCity:target.id,hint:{foreign:target.owner!==p.id}});
    }
    if(c.walls>0&&!c.attacked)for(const u of g.units.filter(u=>canCityAttackUnit(g,p,c,u)))actions.push({type:'cityAttack',city:c.id,targetUnit:u.id});
  }
  for(const c of own){const work=c.production;if(work&&buildable(g,p,c,work.item)&&!UNITS[work.item]?.religious&&!UNITS[work.item]?.faithOnly&&(UNITS[work.item]?!!unitDeployment(g,p,c,work.item):BUILDINGS[work.item]?.kind==='building')&&p.gold>=purchaseCost(g,work.item,p,c))actions.push({type:'purchase',city:c.id,item:work.item,hint:{baseItem:baseItem(work.item),domain:UNITS[work.item]?.domain||'land',canCapture:occupationUnit(work.item),siege:!!UNITS[work.item]?.siege,unit:!!UNITS[work.item],civilian:!!UNITS[work.item]?.civilian,upkeep:productionUpkeep(g,p,work.item),goldCost:purchaseCost(g,work.item,p,c),remaining:Math.ceil(Math.max(0,orderCost(g,c)-work.progress)/Math.max(.01,productionRate(g,c))),defenseUrgency:defenses.get(c.id).urgency,military:!!UNITS[work.item]&&!UNITS[work.item].civilian}});for(const [item,spec]of Object.entries(UNITS))if(canRecruitReligious(g,p,item,c)&&p.faith>=religiousRecruitmentCost(g,p,item,c)&&tilesInRange(g.map,tileOf(g,c),2).some(t=>t.owner===p.id&&!isWater(t)&&t.terrain!=='mountain'&&deploymentFree(g,t.id)))actions.push({type:'recruitFaith',city:c.id,item,hint:{religionOwner:spec.religious?c.religion:p.id,faithOnly:!!spec.faithOnly,upkeep:productionUpkeep(g,p,item),defenseUrgency:defenses.get(c.id).urgency,faithCost:religiousRecruitmentCost(g,p,item,c),religiousUnits:units.filter(u=>UNITS[u.type].religious).length,converted:ownedCities(g,p).filter(c=>c.religion===p.id).length,cities:own.length}});}

  const recruitmentThreats=enemies.filter(e=>!UNITS[e.type].civilian).map(e=>({tile:tileOf(g,e),range:Math.max(2,unitTransport(e,tileOf(g,e))?1:UNITS[e.type].range||1)}));
  for(const c of g.cities)if(c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)&&c.walls>0)recruitmentThreats.push({tile:tileOf(g,c),range:2});
  const recruitmentThreatened=tile=>recruitmentThreats.some(threat=>distance(g,tile,threat.tile)<=threat.range);
  const blockedRecruitments=own.flatMap(c=>{
    const work=c.production,spec=UNITS[work?.item];
    if(!spec||(spec.domain||'land')!=='land'||work.progress<orderCost(g,c)||!buildable(g,p,c,work.item,work.tile))return [];
    const center=work.fortress!==undefined&&operationalFortress(g,c,work.fortress)?g.map.tiles[work.fortress]:tileOf(g,c);
    const cells=[center,...tilesInRange(g.map,center,2).filter(t=>t.owner===p.id)].filter(t=>!isWater(t)&&t.terrain!=='mountain');
    return cells.some(t=>deploymentFree(g,t.id))?[]:[new Set(cells.map(t=>t.id))];
  });
  const enemyCities=Object.values(p.knownCities||{}).filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner));
  const siegeCities=g.cities.filter(c=>c.owner!==p.id&&atWar(g,p.id,c.owner)&&visible.has(c.tile)),threatenedCities=own.filter(c=>enemies.some(e=>!UNITS[e.type].civilian&&distance(g,tileOf(g,e),tileOf(g,c))<=3));
  // Native home reserve (absent for human/API seats): reserve units keep home duty instead of joining expeditions.
  const homeReserveSet=reserveFor(g,p),homeCovered=tile=>own.some(c=>distance(g,tile,tileOf(g,c))<=OPS.cityGuardRadius);
  const settlementSites=units.some(u=>u.type==='settler'&&!u.acted)?g.map.tiles.filter(t=>known.has(t.id)).map(t=>rememberedTile(p,t)).filter(t=>canSettleRemembered(g,p,t)).map(t=>({t,score:settlementValue(g,p,t,known,true)})):[];
  const claimedProjects=new Set(),plannedResources=new Set();
  for(const unit of units)if(unit.type==='builder'&&['improve','chop','repair'].includes(unit.activity?.action.type))claimedProjects.add(unit.tile);
  for(const entry of g.realtime?.queues?.[p.id]||[]){const unit=units.find(u=>u.id===entry.action.unit);if(unit?.type==='builder'&&['improve','chop','repair'].includes(entry.action.type))claimedProjects.add(unit.tile);}
  for(const id of claimedProjects)if(projects.get(id)?.resourceType)plannedResources.add(projects.get(id).resourceType);
  const committedResources=new Set(plannedResources);
  const projectHint=(id,type)=>{const project=projects.get(id),discount=committedResources.has(project?.resourceType)?project.resourceFirstValue:0;return project?{...project,resourceFirstValue:discount?0:project.resourceFirstValue,improvementValue:type==='chop'&&!project.requiresClear||type==='repair'&&!g.map.tiles[id].pillaged?0:project.value-discount}:{};};
  for(const u of units){
    const actionStart=actions.length;const specialtyGoals=civilianMissionGoals(g,p,u,{buildable}),specialtyRoute=specialtyGoals.length?routeGuidance(g,p,u,specialtyGoals,{explore:false}):null;
    const rawSpec=UNITS[u.type],spec=rawSpec.rangedTech&&!unitHasRanged(p,u.type)?{...rawSpec,ranged:0,range:1}:rawSpec,t=tileOf(g,u),embarked=!!unitTransport(u,t),combatRange=embarked?1:attackRange(g,u);if(u.type==='envoy')actions.push({type:'recallEnvoy',unit:u.id,hint:{blockedEvacuation:protectedEnvoy(u)&&!u.acted&&u.moves>0&&(u.moveUntil||0)<=gameTime(g)&&own.some(c=>c.tile===u.tile&&c.hp<=0&&c.walls<=0)&&enemies.some(e=>!UNITS[e.type].civilian&&distance(g,t,tileOf(g,e))<=2)&&reachable(g,p,u).length===0}});if(u.acted||u.moves<=0||receivingTreatment(g,u))continue;
    for(const target of nuclearTargets(g,p,u))actions.push({type:'nuke',unit:u.id,...target});
    if(u.airPatrolCity!==undefined)actions.push({type:'cancelPatrol',unit:u.id});
    for(const city of patrolTargets(g,p,u))if(city.id!==u.airPatrolCity)actions.push({type:'patrol',unit:u.id,targetCity:city.id,hint:{currentlyPatrolling:own.some(c=>c.id===u.airPatrolCity),airThreat:enemies.some(e=>UNITS[e.type].domain==='air'&&distance(g,tileOf(g,e),tileOf(g,city))<=24),capital:city.id===p.capital}});
    const partner=linkedPartner(g,u);
    if(!partner){for(const v of units)if(canLinkUnits(g,u,v))actions.push({type:'linkUnits',unit:u.id,targetUnit:v.id,hint:{escort:true}});}
    else if(!partner.activity&&!receivingTreatment(g,partner)){if(partner.tile!==u.tile)actions.push({type:'unlinkUnits',unit:u.id});else for(const m of reachable(g,p,u,pathsForUnit===u.id,false).filter(m=>m.tile!==partner.tile))actions.push({type:'separate',unit:u.id,...m});}
    actions.push(...fieldActions(g,p,u).map(action=>({...action,hint:{...action.hint,...(action.type==='repair'?{...projectHint(t.id,'repair'),strategicResource:resourceSites.some(site=>site.id===t.id)}:{})}})));
    actions.push(...civilianMissionActions(g,p,u,{buildable}));
    for(const target of healingTargets(g,p,u))actions.push({type:'heal',unit:u.id,targetUnit:target.targetUnit,hint:{healing:target.healing,health:target.health,seconds:2,danger:enemies.filter(e=>distance(g,t,tileOf(g,e))<=1).length}});
    if(t.owner===p.id&&!unitTransport(u,t)&&u.hp>0&&(spec.domain!=='air'||operationalAirBase(g,p,u)))for(const item of veteranChoices(u))actions.push({type:'trainVeteran',unit:u.id,item,hint:{seconds:VETERAN_TRAINING_SECONDS,ranged:!!spec.ranged,siege:!!spec.siege,health:u.hp,terrain:!!(t.hill||t.feature),danger:enemies.some(e=>distance(g,t,tileOf(g,e))<=(UNITS[e.type].range||1)),homeDefense:!!(t.cityId!==null||t.fort)&&p.strategy!=='adaptive'&&p.strategy!=='domination',strategy:p.strategy}});
    for(const base of rebaseTargets(g,p,u)){const enemiesInRange=siegeCities.filter(c=>c.hp+c.walls>0&&distance(g,g.map.tiles[base.tile],tileOf(g,c))<=attackRange(g,u)).length,currentTargets=siegeCities.filter(c=>c.hp+c.walls>0&&distance(g,t,tileOf(g,c))<=attackRange(g,u)).length;actions.push({type:'rebase',unit:u.id,tile:base.tile,...(base.carrier!==undefined?{carrier:base.carrier}:{}),hint:{carrierDeck:base.carrier!==undefined&&u.carrierId===undefined,carrierGroupReady:base.carrier!==undefined&&ownedUnits(g,p).some(ship=>ship.id!==base.carrier&&UNITS[ship.type].submarine),seconds:base.seconds,airTargets:enemiesInRange,airProgress:enemiesInRange-currentTargets,baseLost:!operationalAirBase(g,p,u),health:u.hp}});}
    if(u.type==='settler'&&canSettle(g,p,t))actions.push({type:'found',unit:u.id,hint:{settlement:settlementValue(g,p,t,known),first:own.length===0}});
    if(u.type==='builder'&&u.charges>0&&t.owner===p.id){const item=improvementFor(p,t);if(item)actions.push({type:'improve',unit:u.id,item,hint:{...projectHint(t.id,'improve'),strategicResource:resourceSites.some(site=>site.id===t.id),resource:!!RESOURCES[t.resource]&&(!RESOURCES[t.resource].tech||has(p,RESOURCES[t.resource].tech))}});if(canChop(p,t)&&chopCity(g,p,t))actions.push({type:'chop',unit:u.id,hint:{...projectHint(t.id,'chop'),production:chopYield(g,p,t),city:chopCity(g,p,t).id,strategicResource:resourceSites.some(site=>site.id===t.id),unblocksImprovement:!!improvementFor(p,{...t,feature:null})}});}
    for(const target of attackTargets(g,p,u))actions.push({type:'attack',unit:u.id,...target,hint:combatEstimate(g,p,u,target)});
    for(const c of religionTargets(g,p,u))actions.push({type:'spread',unit:u.id,targetCity:c.id,hint:{foreign:c.owner!==p.id,followers:c.followers?.[p.id]||0}});
    const settlementPlan=u.type==='settler'?settlementGuidance(g,p,u,settlementSites):null;
    const availableProjects=u.type==='builder'&&!manualWorkers.has(u.id)?[...projects.values()].filter(project=>project.charges<=u.charges&&!claimedProjects.has(project.tile)):[];
    const criticalGoals=resourceSites.filter(site=>availableProjects.some(project=>project.tile===site.id)).map(site=>({tile:site.id}));
    const criticalRoute=criticalGoals.length?routeGuidance(g,p,u,criticalGoals,{explore:false}):null;
    const resourceTarget=criticalRoute?.distance(u.tile)<900?resourceSites.find(site=>site.id===criticalRoute.target(u.tile)):null;
    const workerRouteForUnit=resourceTarget?criticalRoute:availableProjects.length?routeGuidance(g,p,u,availableProjects.map(project=>({tile:project.tile,cost:(180-project.value+(plannedResources.has(project.resourceType)?project.resourceFirstValue:0))/4})),{explore:false}):null;
    const selectedProject=workerRouteForUnit?.distance(u.tile)<900?projects.get(workerRouteForUnit.target(u.tile)):null;
    const discountedProject=plannedResources.has(selectedProject?.resourceType);
    const bestImprove=selectedProject?{...selectedProject,value:selectedProject.value-(discountedProject?selectedProject.resourceFirstValue:0),resourceFirstValue:discountedProject?0:selectedProject.resourceFirstValue}:null;
    if(bestImprove){claimedProjects.add(bestImprove.tile);if(bestImprove.resourceType)plannedResources.add(bestImprove.resourceType);}
    const targetEnemies=[...enemies.filter(e=>canTargetUnit(g,u,e)),...(!spec.navalOnly?enemyCities:[])];
    const trafficCity=!embarked&&!occupationUnit(u.type)?siegeCities.find(c=>c.hp<=0&&c.walls<=0&&distance(g,t,tileOf(g,c))<=1&&units.some(v=>v.hp>25&&occupationUnit(v.type)&&(UNITS[v.type].domain||'land')==='land'&&distance(g,tileOf(g,v),tileOf(g,c))<=3)):null;
    // Clear a completed recruitment cell only when a safe adjacent exit exists.
    const recruitmentExits=!recruitmentThreatened(t)?blockedRecruitments.filter(cells=>cells.has(u.tile)):[];
    const envoyEvacuation=protectedEnvoy(u)?own.find(c=>c.tile===u.tile&&c.hp<=40&&c.walls<=0&&enemies.some(e=>!UNITS[e.type].civilian&&distance(g,tileOf(g,e),t)<=2)):null;
    const envoyPassage=t.cityId===p.capital&&g.units.some(v=>v.owner!==p.id&&protectedEnvoy(v)&&v.envoy.capital===p.capital&&visible.has(v.tile)&&unitDetected(g,v,p.id)&&distance(g,t,tileOf(g,v))<=2);
    const patients=spec.medical?military.filter(v=>v.hp<90&&!['air','sea'].includes(UNITS[v.type].domain)&&!unitTransport(v,tileOf(g,v))):[];
    const medicalGoal=patients.length?patients.reduce((best,v)=>{const d=distance(g,t,tileOf(g,v)),priority=d*7+v.hp*.2;return !best||priority<best.priority?{unit:v,distance:d,priority}:best;},null):null;
    const unitOp=operationFor(g,p,u.id),onReserve=!!homeReserveSet?.has(u.id)&&!unitOp,reserveHome=onReserve?(()=>{const h=own.reduce((b,c)=>{const d=distance(g,t,tileOf(g,c));return !b||d<b.d?{city:c,d}:b;},null);return h&&h.d>OPS.cityGuardRadius-1?{city:h.city,station:true}:null;})():null,siegeTarget=!spec.civilian&&!spec.navalOnly?(onReserve?siegeCities.filter(c=>homeCovered(tileOf(g,c))):unitOp&&unitOp.state!=='gather'&&siegeCities.some(c=>c.id===unitOp.city)?siegeCities.filter(c=>c.id===unitOp.city):siegeCities).reduce((best,c)=>{const d=distance(g,t,tileOf(g,c)),priority=d*4+(!unitOp&&p.memory?.objectives?.[u.id]?.city===c.id&&p.memory.objectives[u.id].until>=g.turn?-12:0)+(c.hp<=0&&c.walls<=0?(occupationUnit(u.type)?-18:24):0)+(spec.siege&&c.walls>0?-8:0);return !best||priority<best.priority?{city:c,distance:d,priority}:best;},null):null,homeThreat=!spec.civilian?threatenedCities.reduce((best,c)=>{const d=distance(g,t,tileOf(g,c));return !best||d<best.distance?{city:c,distance:d}:best;},null):null;
    const airDefenseCity=spec.airOnly&&spec.domain!=="air"?own.filter(city=>enemies.some(enemy=>UNITS[enemy.type].domain==="air"&&distance(g,tileOf(g,enemy),tileOf(g,city))<=24)).sort((a,b)=>Number(b.id===p.capital)-Number(a.id===p.capital)||distance(g,t,tileOf(g,a))-distance(g,t,tileOf(g,b)))[0]:null;
    const retreatCity=unitOp?.state==='retreat'?own.find(c=>c.tile===unitOp.rally):null;
    const defenseTarget=(retreatCity?{city:retreatCity,preparing:true}:airDefenseCity?{city:airDefenseCity}:preparingUnits.has(u.id)?{city:preparationCity,preparing:true}:homeThreat&&military.filter(v=>v.hp>25&&UNITS[v.type].domain!=='air').sort((a,b)=>(distance(g,tileOf(g,a),tileOf(g,homeThreat.city))+(UNITS[a.type].siege?4:0))-(distance(g,tileOf(g,b),tileOf(g,homeThreat.city))+(UNITS[b.type].siege?4:0))).slice(0,defenses.get(homeThreat.city.id).required).some(v=>v.id===u.id)?homeThreat:null)||reserveHome;
    // Embarked troops must reach remembered land before resuming a city assault.
    let siegeGoals=spec.navalOnly?(nuclearRange(u.type)&&nuclearStock(p)>0?enemyCities.filter(c=>visible.has(c.tile)).map(c=>({tile:c.tile,range:nuclearRange(u.type)})):[]):embarked?enemyCities.flatMap(c=>neighbors(g.map,g.map.tiles[c.tile]).filter(n=>known.has(n.id)&&!isWater(rememberedTile(p,n))&&rememberedTile(p,n).terrain!=='mountain').map(n=>({tile:n.id,range:0}))):enemyCities.map(c=>({tile:c.tile,range:visible.has(c.tile)?combatRange:Math.min(combatRange,spec.vision||2)}));
    // Campaign operation: members gather at the rally city, then march on the single campaign target.
    // Reserve: only local counterattack goals inside home coverage; return-to-station goes through defenseTarget (reserveHome).
    if(onReserve){const local=siegeGoals.filter(s=>homeCovered(g.map.tiles[s.tile]));siegeGoals=local;}
    if(unitOp&&!spec.navalOnly&&!embarked){const focus=['gather','retreat'].includes(unitOp.state)?[{tile:unitOp.rally,range:OPS.rallyRange}]:siegeGoals.filter(s=>s.tile===unitOp.tile);if(focus.length)siegeGoals=focus;}
    const captureGoals=!embarked&&occupationUnit(u.type)?siegeCities.filter(c=>canOccupyCity(g,u,c)&&(!(onReserve||['gather','retreat'].includes(unitOp?.state))||homeCovered(tileOf(g,c)))).map(c=>({tile:c.tile,capture:true})):[],captureRoute=captureGoals.length?routeGuidance(g,p,u,captureGoals,{avoidOccupied:true}):null;
    const siegeRoute=!spec.civilian&&!spec.airOnly?routeGuidance(g,p,u,siegeGoals,{avoidOccupied:true}):null;
    const homeRoute=defenseTarget&&!spec.navalOnly?routeGuidance(g,p,u,[{tile:defenseTarget.city.tile,range:defenseTarget.preparing?2:1}]):null;
    const enemyRoute=!spec.civilian&&enemies.length&&!['gather','retreat'].includes(unitOp?.state)?routeGuidance(g,p,u,enemies.filter(e=>canTargetUnit(g,u,e)&&!UNITS[e.type].civilian&&(spec.ranged&&!embarked||(spec.domain==='sea'||embarked)===(UNITS[e.type].domain==='sea'||!!unitTransport(e,tileOf(g,e))))).map(e=>({tile:e.tile,range:combatRange}))):null;
    const envoyCity=u.type==='envoy'?p.knownCities?.[u.envoy?.capital]:null;
    const envoyRoute=envoyCity?routeGuidance(g,p,u,[{tile:envoyCity.tile}]):null;
    const settleRoute=settlementPlan?.route;
    const improveRoute=bestImprove?workerRouteForUnit:null;
    const patientRoute=medicalGoal?routeGuidance(g,p,u,[{tile:medicalGoal.unit.tile,range:1}]):null;
    const targetCity=enemyCities.find(c=>c.tile===siegeRoute?.target(u.tile)),observedTarget=targetCity&&visible.has(targetCity.tile)?g.cities.find(c=>c.id===targetCity.id):null;
    const missionaryTargets=spec.religious?g.cities.filter(c=>known.has(c.tile)&&(visible.has(c.tile)?c.religion!==unitReligionSource(g,u)?.id:true)&&(u.type!=='inquisitor'||c.owner===p.id)&&!atWar(g,p.id,c.owner)):[];const religionRoute=spec.religious?routeGuidance(g,p,u,missionaryTargets.map(c=>({tile:c.tile,range:1}))):null;
    for(const move of [...reachable(g,p,u,nativeRoutes||u.id===pathsForUnit),...jumpTargets(g,p,u).map(v=>({...v,cost:2,jump:true}))]){
      const dest=g.map.tiles[move.tile];if(!visible.has(dest.id))continue;
      // Reveal a preview only when every waypoint is currently visible.
      const clearRoute=move.path?.every(id=>visible.has(id));
      const preview=clearRoute&&u.id===pathsForUnit?{path:move.path,seconds:move.path.slice(1).reduce((s,id,i)=>s+Math.max(movementDuration(u.type,movementCost(g,p,u,g.map.tiles[move.path[i]],g.map.tiles[id]),partner?.tile===u.tile&&(spec.escortMovement||UNITS[partner.type].escortMovement)?movementAllowance(g,u):spec.moves),partner?.tile===u.tile?movementDuration(partner.type,movementCost(g,p,partner,g.map.tiles[move.path[i]],g.map.tiles[id]),spec.escortMovement||UNITS[partner.type].escortMovement?movementAllowance(g,partner):UNITS[partner.type].moves):0),0)}:{};
      if(nativeRoutes&&clearRoute)preview.transit=move.path;
      const exploration=tilesInRange(g.map,dest,spec.vision||2).filter(n=>!known.has(n.id)).length;
      actions.push({type:move.jump?'jump':'move',unit:u.id,tile:dest.id,hint:{hazardDamage:climateDanger(g,p,dest),captureCivilian:g.units.find(v=>v.tile===dest.id&&canCaptureCivilian(g,u,v))?.type||'',specialty:!!spec.support||['guru','naturalist','archaeologist','rockband'].includes(u.type),specialtyDistance:specialtyRoute?.distance(dest.id)??999,specialtyProgress:specialtyRoute?.progress(u.tile,dest.id)||0,siegeCity:siegeTarget?.city.id??-1,carrierAwaitingAircraft:!!spec.airCapacity&&deckAircraft(g,u).length===0&&units.some(plane=>UNITS[plane.type].domain==='air'&&plane.carrierId===undefined&&distance(g,t,tileOf(g,plane))<=UNITS[plane.type].rebaseRange),fleetProgress:spec.domain==='sea'&&!spec.airCapacity&&['battleship','missilecruiser','destroyer','assaultship','submarine','nuclearsubmarine'].includes(u.type)&&fleetCarriers.length?Math.min(...fleetCarriers.map(c=>distance(g,t,tileOf(g,c))))-Math.min(...fleetCarriers.map(c=>distance(g,dest,tileOf(g,c)))):0,fleetDistance:fleetCarriers.length?Math.min(...fleetCarriers.map(c=>distance(g,dest,tileOf(g,c)))):999,fleetActive:!!groupFor(g,u,p.id),airDefenseDuty:!!airDefenseCity,landingCapturer:embarked&&occupationUnit(u.type)&&!isWater(dest),trafficYield:distance(g,t,dest)===1&&(recruitmentExits.some(cells=>!cells.has(dest.id))&&!recruitmentThreatened(dest)||!!(trafficCity||envoyEvacuation)&&(envoyEvacuation||distance(g,dest,tileOf(g,trafficCity))>1)),yieldWater:!!envoyEvacuation&&isWater(dest),temperature:posture.temperature,defenseDuty:!!defenseTarget,routeProgress:enemyRoute?.progress(u.tile,dest.id)||0,envoyPassage:envoyPassage&&distance(g,t,dest)===1,medical:!!spec.medical,patientDistance:patientRoute?.distance(dest.id)??50,patientProgress:patientRoute?.progress(u.tile,dest.id)||0,cost:move.cost,...preview,captureDistance:captureRoute?.distance(dest.id)??999,captureProgress:captureRoute?.progress(u.tile,dest.id)||0,captureCity:dest.cityId!==null&&canOccupyCity(g,u,g.cities.find(c=>c.id===dest.cityId))?dest.cityId:null,siegeDistance:siegeRoute?.distance(dest.id)??999,siegeProgress:siegeRoute?.progress(u.tile,dest.id)||0,siegeWalls:observedTarget?.walls||0,firingPosition:!!spec.ranged&&!spec.navalOnly&&!unitTransport(u,dest)&&!!observedTarget&&observedTarget.hp+observedTarget.walls>0&&distance(g,dest,tileOf(g,observedTarget))<=(spec.range||1),homeThreatDistance:homeRoute?.distance(dest.id)??50,homeDefenseProgress:homeRoute?.progress(u.tile,dest.id)||0,envoyDistance:envoyRoute?.distance(dest.id)??999,envoyProgress:envoyRoute?.progress(u.tile,dest.id)||0,exploration,ruin:dest.ruin||dest.village,village:!!dest.village,camp:dest.camp,settlement:canSettle(g,p,dest)?settlementValue(g,p,dest,known):-100,settleDistance:settleRoute?.distance(dest.id)??999,settleProgress:settleRoute?.progress(u.tile,dest.id)||0,settleExploring:!!settlementPlan?.exploring,improveTarget:bestImprove?.tile,improvementValue:bestImprove?.value||0,resourceCategory:bestImprove?.resourceCategory,resourceType:bestImprove?.resourceType,resourceFirstValue:bestImprove?.resourceFirstValue||0,improveDistance:improveRoute?Math.max(0,improveRoute.distance(dest.id)-(resourceTarget?0:(180-bestImprove.value)/4)):999,improveProgress:bestImprove?.tile===u.tile?0:improveRoute?.progress(u.tile,dest.id)||0,enemyDistance:targetEnemies.length?Math.min(...targetEnemies.map(e=>distance(g,dest,tileOf(g,e)))):50,religionDistance:religionRoute?.distance(dest.id)??999,religionProgress:religionRoute?.progress(u.tile,dest.id)||0,homeDistance:own.length?Math.min(...own.map(c=>distance(g,dest,tileOf(g,c)))):0,defenseBonus:(dest.hill?3:0)+(dest.feature?3:0),rangedThreat:enemies.filter(e=>canTargetUnit(g,e,{...u,tile:dest.id})&&UNITS[e.type].ranged&&distance(g,dest,tileOf(g,e))<=(UNITS[e.type].range||2)).length,danger:enemies.filter(e=>distance(g,dest,tileOf(g,e))<=1).length,strategicResource:!!resourceTarget,strategicProgress:resourceTarget?(improveRoute?.progress(u.tile,dest.id)||0):0,improvable:dest.owner===p.id&&(u.type==='builder'?!!projects.get(dest.id)&&projects.get(dest.id).charges<=u.charges:!!(improvementFor(p,dest)||dest.pillaged||dest.roadPillaged||dest.fort&&dest.fort.hp<160))}});
    }
    for(const op of unitUpgradeOptions(g,p,u).filter(op=>op.available))actions.push({type:'upgrade',unit:u.id,item:op.item,hint:{upkeepDelta:unitUpkeep(op.item,p).total-unitUpkeep(u.type,p).total,goldCost:op.goldCost,strengthGain:op.strengthGain,healingGain:op.healingGain,wallMatch:UNITS[op.item].siegeTier?siegeCities.some(c=>c.walls>0&&siegeMatchesWall(op.item,c,p)):false,oldWallMatch:spec.siegeTier?siegeCities.some(c=>c.walls>0&&siegeMatchesWall(u.type,c,p)):false,defenseDuty:!!defenseTarget,danger:enemies.some(e=>distance(g,t,tileOf(g,e))<=2)}});
    if((spec.domain!=='air'||operationalAirport(g,p,t))&&(!g.realtime||(u.healUntil||0)<=g.realtime.time))actions.push({type:'fortify',unit:u.id,hint:{health:u.hp,siegeStation:!!siegeTarget&&siegeTarget.distance<=(spec.range||1),temperature:posture.temperature,defenseDuty:!!defenseTarget,danger:enemies.some(e=>distance(g,t,tileOf(g,e))<=2)}});
    if(!spec.civilian){const currentIncomingDamage=visibleIncomingDamage(g,p,u,t,enemies,siegeCities),localCombat=enemies.some(e=>!UNITS[e.type].civilian&&distance(g,t,tileOf(g,e))<=4&&(tileOf(g,e).owner===p.id||currentIncomingDamage>0));
      const exposure=new Map([[t.id,currentIncomingDamage]]);
      for(let i=actionStart;i<actions.length;i++){const a=actions[i];if(a.unit!==u.id)continue;const destination=a.type==='move'?g.map.tiles[a.tile]:t;if(!exposure.has(destination.id))exposure.set(destination.id,visibleIncomingDamage(g,p,u,destination,enemies,siegeCities));a.hint={...a.hint,currentIncomingDamage,incomingDamage:exposure.get(destination.id),localCombat,homeTerritory:t.owner===p.id};
        if(a.type==='move'){
          const projected={...u,tile:destination.id,fortified:false};
          a.hint.defenseBonus=groundDomain(u)==='land'&&!isWater(destination)?(destination.hill?3:0)+(['forest','jungle'].includes(destination.feature)?3:0)+(destination.fort?.owner===p.id&&destination.fort.hp>0?6:0):0;
          a.hint.flankingGain=!spec.ranged&&!embarked?Math.max(0,...enemies.filter(e=>fieldMilitary(g,e)&&groundDomain(e)===groundDomain(u)&&distance(g,destination,tileOf(g,e))===1).map(e=>formationBonus(g,projected,tileOf(g,e),true,p.id)-(distance(g,t,tileOf(g,e))===1?formationBonus(g,u,tileOf(g,e),true,p.id):0))):0;
          a.hint.supportGain=localCombat?formationBonus(g,projected,destination,false,p.id)-formationBonus(g,u,t,false,p.id):0;
        }
      }
    }
  }
  for(const id of p.met){const other=g.players[id];if(!other?.alive)continue;const relation=p.relations[id];const assessment=militaryAssessment(g,p,other,u=>unitStrength(g,u));
    const publicVictory=victoryProgress(g,other),aVictoryThreat=Math.max(publicVictory.science.stage/3,publicVictory.culture.tourism/Math.max(1,publicVictory.culture.target),publicVictory.religion.converted/Math.max(1,publicVictory.religion.total));
    const diplomacy=diplomaticSummary(g,p,other,geoContext),hint={...assessment,...diplomacy,...strategicBalance(g,p,other),duration:g.turn-relation.since,turn:g.turn,warPlan:warHint(g,p,other.id),opinion:opinionHint(g,p,other.id),peaceIntent:peaceHint(g,p,other.id)};if(relation.status==='alliance')actions.push({type:'endAlliance',player:other.id,hint});
    if(relation.status==='peace'&&!isFriend(g,p.id,id)&&truceRemaining(g,p.id,id)===0&&(hint.colonialEligible||g.turn-relation.since>=4))actions.push({type:'war',player:id,...(hint.colonialEligible?{warKind:'colonial'}:{declaration:(relation.denouncedUntil||0)>gameTime(g)&&gameTime(g)-(relation.denouncedAt??gameTime(g))>=100?'formalWar':'surpriseWar'}),hint});
    if(relation.status==='war'){
      if(p.gold>=10&&envoyBudget(g,p.id,id).remaining>0&&envoyBudget(g,p.id,id).cooldown===0&&!g.units.some(u=>u.owner===p.id&&u.type==='envoy'&&u.envoy.target===id)&&g.cities.some(c=>c.id===other.capital&&c.owner===id&&p.knownCities?.[c.id]))actions.push({type:'sendEnvoy',player:id,hint});
    }
    if(relation.status==='peace'&&!g.diplomacy?.proposals.some(o=>o.from===p.id&&o.to===id&&o.status==='pending')){
      if(!relation.openBorders)actions.push({type:'openBorders',player:id,hint});

    }
    if(relation.openBorders&&relation.status==='peace')actions.push({type:'closeBorders',player:id,hint});
  }
  const aidRequests=aidMissionOptions(g,p),aidTerms=aidRequests.length?recommendedAidTerms(g,p):null;
  for(const request of aidRequests){const enemy=g.players[request.enemy],helper=g.players[request.to],balance=strategicBalance(g,p,enemy),assistance=strategicBalance(g,p,helper),capital=p.knownCities[helper.capital],aidDistance=own.length?Math.min(...own.map(c=>distance(g,tileOf(g,c),g.map.tiles[capital.tile]))):99;
    if(aidDistance>40)continue;
    const invasion=g.units.filter(u=>u.owner===enemy.id&&p.visible.includes(u.tile)&&unitDetected(g,u,p.id)&&!UNITS[u.type].civilian&&own.some(c=>distance(g,tileOf(g,c),tileOf(g,u))<=4)).length;
    actions.push({type:'sendEnvoy',player:helper.id,enemy:enemy.id,terms:aidTerms,hint:{jointWar:true,needAid:balance.powerRatio<1.1||invasion>0,aidPriority:Math.max(0,1.2-balance.powerRatio)*45+Math.min(45,invasion*15)+Math.min(25,assistance.estimatedPower/balance.estimatedPower*15)+(p.relations[helper.id].status==='alliance'?20:0)-aidDistance*.4,helperEstimate:assistance.estimatedPower,warWeariness:p.warWeariness||0,goldCost:10+aidTerms.gold}});
  }
  actions.push(...cityDispositionOptions(g,p).flatMap(o=>[{type:'keepCity',city:o.city},...(o.canRaze?[{type:'razeCity',city:o.city}]:[])]));
  actions.push(...courtActions(g,p),...governorActions(g,p),...cityStateActions(g,p),...spyActions(g,p));
  for(const unit of units)actions.push(...plunderOptions(g,p,unit));
  for(const offer of g.court?.offers||[])if(offer.to===p.id&&offer.status==='pending'&&offer.expiresAt>gameTime(g))for(const type of ['acceptCourt','rejectCourt'])actions.push({type,offer:offer.id});
  for(const offer of g.diplomacy?.proposals||[])if(offer.to===p.id&&offer.status==='pending'&&offer.expiresAt>=gameTime(g)){const hint=offer.kind==='jointWar'?jointWarAssessment(g,p,offer,militaryFinance(g,p)):undefined;actions.push({type:'rejectDiplomacy',proposal:offer.id,hint});if(offer.kind==='jointWar'?jointWarAllowed(g,offer.from,p.id,offer.enemy,offer.warId):offer.kind!=='peace'||peaceRemaining(g,p.id,offer.from)===0)actions.push({type:'acceptDiplomacy',proposal:offer.id,hint});}
  for(const agenda of g.diplomacy?.agendas||[])if(agenda.status==='voting'&&gameTime(g)<agenda.endsAt&&p.id!==agenda.attacker&&p.id!==agenda.defender&&!agenda.votes[p.id]&&p.met.includes(agenda.attacker)&&p.met.includes(agenda.defender))for(const choice of ['observe',...(p.gold>=30?['aid']:[]),...(p.relations[agenda.attacker]?.status==='peace'&&truceRemaining(g,p.id,agenda.attacker)===0?['join']:[])])actions.push({type:'voteAid',agenda:agenda.id,choice,hint:aidAssessment(g,p,agenda)});
  for(const u of units.filter(u=>u.greatPerson)){const goals=heritageDestinations(g,p,u),guide=goals.length?routeGuidance(g,p,u,goals,{explore:false}):null;for(const action of actions.filter(a=>a.type==='move'&&a.unit===u.id)){action.hint??={};action.hint.greatPersonProgress=guide?.progress(u.tile,action.tile)||0;}}
  const submergedWorkers=new Set(units.filter(unit=>coastalWorkBlocked(g,tileOf(g,unit))).map(unit=>unit.id));
  const weatherExposure=new Map(units.map(unit=>[unit.id,climateDanger(g,p,tileOf(g,unit))]));
  for(const action of actions){const current=weatherExposure.get(action.unit)||0,travel=['move','separate','jump','rebase'].includes(action.type)&&g.map.tiles[action.tile],destination=travel?climateDanger(g,p,travel):0;if(!current&&!destination)continue;action.hint??={};action.hint.currentHazardDamage=current;action.hint.currentIncomingDamage=(action.hint.currentIncomingDamage||0)+current;if(travel){action.hint.hazardDamage=destination;action.hint.incomingDamage=(action.hint.incomingDamage||0)+destination;}}
  return actions.filter(action=>!submergedWorkers.has(action.unit)||!['repair','improve','chop'].includes(action.type));
}

export function applyAction(g,p,action,{presentation=true,nuclearReserved=false}={}){migrateLegacyAges(g);
  if(action?.type==='separate')action={...action,type:'move',detach:true};
  const relevant=['excavate','establishPark','concert','religiousHeal','move','attack','cityAttack','found','improve','chop','fortify','upgrade','spread','heal'].includes(action?.type);
  const combat=['attack','cityAttack'].includes(action?.type),references=new Map(relevant?g.units.filter(u=>combat||u.id===action?.unit||action.type==='move'&&g.map.tiles[action.tile]?.cityId!=null&&u.tile===action.tile).map(u=>[u.id,u]):[]),before=[...references.values()].map(u=>({...u})),actor=before.find(u=>u.id===action?.unit),target=before.find(u=>u.id===action?.targetUnit)||g.cities.filter(c=>c.id===action?.targetCity).map(c=>({...c}))[0];
  const move=action?.type==='move'&&actor?reachable(g,p,actor,true,!action.detach).find(move=>move.tile===action.tile):undefined,path=move?.path;
  const result=applyActionInternal(g,p,action,move,{nuclearReserved});
  clearBrokenLinks(g);
  if(evacuateGreatPeople(g))refreshVisibility(g);clearBrokenLinks(g);reconcileHeritagePolicies(g);if(!relevant)return result;
  const after=new Map(g.units.filter(u=>references.has(u.id)).map(u=>[u.id,u]));
  if(['attack','cityAttack'].includes(action.type)){
    const source=actor||{...g.cities.find(c=>c.id===action.city),type:'city'};
    if(target&&presentation)visual(g,'attack',source,{target:{...target}});
    for(const old of before){const next=after.get(old.id),damaged=next||references.get(old.id);if(damaged.hp<old.hp)visual(g,'hurt',damaged,{damage:old.hp-damaged.hp});if(!next)visual(g,'death',old);}
  }else if(actor){
    const next=after.get(actor.id);
    if(presentation){if(action.type==='move'&&next&&actor.returnSequence===next.returnSequence)visual(g,'move',next,{from:actor.tile,path});
    else visual(g,'work',next||actor,{action:action.type,retired:!next,...(action.type==='heal'?{target:{...g.units.find(u=>u.id===action.targetUnit)},duration:2}:{})});}
  }
  return result;
}
function applyActionInternal(g,p,action,plannedMove,{nuclearReserved=false}={}){
  if(!p.alive||g.winner)throw new Error('本局已结束或文明已覆灭。');
  if(!action||typeof action!=='object'||typeof action.type!=='string')throw new Error('行动格式无效。');
  const heritageContext={addUnit,event,boost,inspire,updateFollowers,refreshVisibility};
  if(['keepCity','razeCity'].includes(action.type))return resolveCityDisposition(g,p,action);
  if(action.type==='ageBonus')return chooseAgeBonus(g,p,action.items);
  if(action.type==='recruitGreatPerson')return recruitGreatPerson(g,p,action.item,null,heritageContext);
  if(action.type==='patronizeGreatPerson')return recruitGreatPerson(g,p,action.item,action.currency,heritageContext);
  if(action.type==='passGreatPerson')return passGreatPerson(g,p,action.item);
  if(action.type==='repairWonder')return repairWonder(g,p,action);
  if(action.type==='moveGreatWork')return moveGreatWork(g,p,action.work,action.slot);
  if(action.type==='activateGreatPerson')return activateGreatPerson(g,p,action,heritageContext);
  const {type,item}=action,u=g.units.find(x=>x.id===action.unit&&x.owner===p.id),c=g.cities.find(x=>x.id===action.city&&x.owner===p.id);
  const checkUnit=()=>{if(!u||u.hp<=0||u.acted||u.moves<=0||UNITS[u.type].civilian&&movementBlocked(g,u)||g.realtime&&(u.cooldownUntil||0)>gameTime(g))throw new Error('此单位本回合无法行动。');};
  const checkCity=()=>{if(!c)throw new Error('城市不属于此玩家。');};
  if(type==='cancelPatrol'){if(!u)throw Error('战斗机不存在。');delete u.airPatrolCity;return;}
  if(type==='patrol'){checkUnit();if(!patrolTargets(g,p,u).some(city=>city.id===action.targetCity))throw Error('城市不在战斗机巡逻范围内。');const city=g.cities.find(c=>c.id===action.targetCity);if(!flightAllowed(g,p,u,tileOf(g,city)))throw Error('巡逻路线经过未开放领空。');u.airPatrolCity=action.targetCity;return;}
  if(type==='nuke'){
    const carrier=u||c;if(u)checkUnit();else checkCity();
    if(nuclearReserved){const range=u?nuclearRange(u.type):24,target=g.map.tiles[action.tile];if(!range||!target||distance(g,tileOf(g,carrier),target)>range||(carrier.attackUntil||0)>gameTime(g))throw Error('核弹载具或固定目标坐标无效。');}
    else if(!nuclearTargets(g,p,carrier).some(t=>t.tile===action.tile))throw Error('核弹库存、载具或目标无效。');
    if(u&&UNITS[u.type].domain==='air'&&!flightAllowed(g,p,u,g.map.tiles[action.tile]))throw Error('飞行路线经过未开放领空。');
    if([...g.cities,...g.units.filter(unit=>UNITS[unit.type].domain!=='air'&&!protectedEnvoy(unit)),...g.map.tiles.filter(t=>t.improvement||t.district||t.fort).map(t=>({owner:t.owner,tile:t.id}))].some(entity=>nuclearFootprint(g,action.tile).includes(entity.tile)&&entity.owner>=0&&entity.owner!==p.id&&!atWar(g,p.id,entity.owner)))throw Error('核打击范围涉及未交战国家。');
    if(!nuclearReserved)p.nuclearStockpile=nuclearStock(p)-1;
    resolveNuclear(g,p,carrier,action.tile);if(u){u.moves=0;u.acted=true;}else c.attacked=true;carrier.attackUntil=gameTime(g)+20;return;
  }
  if(type==='linkUnits'){checkUnit();const v=g.units.find(v=>v.id===action.targetUnit);if(!canLinkUnits(g,u,v))throw Error('只能链接相邻空闲的己方陆军与支援单位，编队最多两人。');u.linkedUnit=v.id;v.linkedUnit=u.id;return;}
  if(type==='unlinkUnits'){checkUnit();const v=linkedPartner(g,u);if(!v||v.activity||v.tile===u.tile)throw Error('同格编队需要先分离移动。');delete u.linkedUnit;delete v.linkedUnit;return;}
  if(['buildFort','buildRoad','repair','pillage','destroyRoad','destroyFort'].includes(type)){checkUnit();if(tileOf(g,u).naturalWonder)throw Error('自然奇观不能开发或破坏。');if(type==='repair'&&coastalWorkBlocked(g,tileOf(g,u)))throw Error('需要防洪屏障才能修复受淹地块。');applyFieldAction(g,p,u,type,event);refreshVisibility(g);return;}
  if(type==='setSpecialists'){setSpecialists(g,p,action);return;}
  if(type==='plunderTrade'){plunderTrade(g,p,action,event);return;}
  if(applyGovernorAction(g,p,action,event)||applySpyAction(g,p,action,event)){refreshVisibility(g);return;}
  if(applyCityStateAction(g,p,action,{addUnit,deploymentFree,event,damage,annex:s=>annexCityState(g,p,s),liberate:s=>liberateCityState(g,p,s)})){refreshVisibility(g);return;}
  if(applyCourtAction(g,p,action,{emit:event,beginWar,allowBorderExit})){refreshVisibility(g);return;}
  if(type==='recallEnvoy'){if(!u||u.type!=='envoy')throw new Error('来使不存在。');for(const offer of g.diplomacy.proposals)if(offer.envoy===u.id&&offer.status==='pending'){offer.status='expired';offer.reason='recalled';}g.units=g.units.filter(x=>x!==u);p.planRevision++;refreshVisibility(g);event(g,'diplomacy',p.short+' 撤回了和谈使团。',p.id);return;}
  if(type==='sendEnvoy'||type==='peace'){if(type==='peace'&&action.enemy!==undefined)throw Error('求援必须使用派遣来使行动。');if(type==='peace'&&peaceRemaining(g,p.id,action.player)>0)throw new Error('战争尚未满八个经济周期。');sendEnvoy(g,p,action.player,addUnit,event,action.terms,action.enemy);refreshVisibility(g);return;}
  if(type==='acceptDiplomacy'||type==='rejectDiplomacy'){answerProposal(g,p,action.proposal,type==='acceptDiplomacy',event);refreshVisibility(g);return;}
  if(type==='voteAid'){voteAid(g,p,action.agenda,action.choice,event);return;}
  if(type==='endAlliance'){const r=p.relations[action.player],other=g.players[action.player];if(!r||r.status!=='alliance')throw new Error('双方没有联盟。');for(const [a,b]of [[p,other],[other,p]]){Object.assign(a.relations[b.id],{status:'peace',openBorders:false,since:g.turn,truceUntil:Math.max(a.relations[b.id].truceUntil||0,b.relations[a.id].truceUntil||0,gameTime(g)+WAR_RULES.allianceBreakSeconds)});a.planRevision++;allowBorderExit(g,a.id,b.id);}other.relations[p.id].allianceEndedBy=p.id;other.relations[p.id].grievances=Math.min(200,other.relations[p.id].grievances+15);event(g,'diplomacy',p.short+' 解除与 '+other.short+' 的联盟，双方进入 80 秒停战保护。',null);return;}
  if(type==='closeBorders'){const r=p.relations[action.player];if(!r||r.status!=='peace'||!r.openBorders)throw new Error('没有可撤销的开放边界协议。');r.openBorders=false;g.players[action.player].relations[p.id].openBorders=false;allowBorderExit(g,p.id,action.player);allowBorderExit(g,action.player,p.id);p.planRevision++;g.players[action.player].planRevision++;return;}
  if(type==='leaderAbility'){
    const time=gameTime(g);if((p.leaderAbility?.readyAt||0)>time)throw new Error('领袖技能仍在冷却。');
    const leader=leaderFor(p);p.leaderAbility={activeUntil:time+(leader.duration||40),readyAt:time+(leader.cooldown||120)};
    const instant=leader.active?.instant;leaderInstant(g,p,instant,cityYields,orderCost);
    event(g,'leader',`${p.short} 的 ${leaderFor(p).name} 发动了「${leaderFor(p).skill}」。`,p.id);return;
  }
  if(type==='research'||type==='civic'){
    const catalog=type==='research'?TECHS:CIVICS,done=type==='research'?p.techs:p.civics;if(!catalog[item]||done.includes(item)||!catalog[item].requires.every(k=>has(p,k)))throw new Error('研究项目尚未解锁。');p[type]=item;return;
  }
  if(type==='government'||type==='policies'){changePolitics(g,p,action,event);if(action.items)p.politics.suspendedCards=[];return;}
  if(type==='voteCongress'){castCongressVote(g,p,action);return;}
  if(['excavate','establishPark','concert','religiousHeal'].includes(type)){checkUnit();applyCivilianMission(g,p,action,{buildable,completeProduction,event});cleanUnits(g);refreshVisibility(g);return;}
  if(type==='produce'||type==='purchase'){
    checkCity();if(!buildable(g,p,c,item,action.tile)){
      const spec=PRODUCTION[item],reason=spec?.tech&&!has(p,spec.tech)?'需要科技：'+TECHS[spec.tech].name:spec?.civic&&!has(p,spec.civic)?'需要市政：'+CIVICS[spec.civic].name:spec?.building&&!hasBuilding(c,spec.building)?'需要前置建筑：'+(BUILDINGS[spec.building]?.name||spec.building):climateBuildReason(g,p,c,item)||'请重新查询该城市的可生产项目与合法选址。';
      throw new Error('此城市无法生产该项目。'+reason);
    }
    if(action.fortress!==undefined&&(!Number.isInteger(action.fortress)||!operationalFortress(g,c,action.fortress)||!UNITS[item]||UNITS[item].civilian||(UNITS[item].domain||'land')!=='land'))throw Error('堡垒只能使用所属城市的队列训练陆军，且必须完好并属于本国。');
    const same=c.production?.item===item&&c.production.tile===(action.tile??null);
    if(type==='purchase'){
      if(!UNITS[item]&&!BUILDINGS[item]||BUILDINGS[item]?.kind==='district'||UNITS[item]?.religious||UNITS[item]?.faithOnly)throw new Error('只能用金币购买非宗教单位和普通建筑。');
      if(action.fortress!==undefined)throw Error('金币购买从城市部署。');
      const cost=purchaseCost(g,item,p,c);if(p.gold<cost)throw new Error('金币不足。');
      if(!completeProduction(g,p,c,{item,tile:null}))throw new Error('没有合法部署空间或建造条件已变化，未扣除金币。');
      p.gold-=cost;if(BUILDINGS[item]&&same)c.production=null;
      refreshVisibility(g);return;
    }
    else if(same){if(action.fortress!==undefined)c.production.fortress=action.fortress;else delete c.production.fortress;return;}
    if(!same){delete g.heritage?.legacyOrders?.[c.id];if(c.production)c.storedProduction+=c.production.progress*.5;c.production={item,tile:action.tile??null,progress:c.storedProduction,cost:productionCost(g,item)};c.storedProduction=0;}
    if(action.fortress!==undefined)c.production.fortress=action.fortress;
    return;
  }
  if(type==='found'){checkUnit();foundCity(g,p,u);refreshVisibility(g);return;}
  if(type==='move'){
    checkUnit();const move=plannedMove;if(!move)throw new Error('目的地不可到达。');const partner=linkedPartner(g,u),escort=partner?.tile===u.tile&&!action.detach;if(action.detach&&(!partner||partner.activity||move.tile===partner.tile))throw Error('编队无法在此处分离。');
    if(escort){if(partner.acted||partner.activity||receivingTreatment(g,partner)||!reachable(g,p,partner,true).some(m=>m.tile===move.tile))throw Error('编队成员尚未就绪。');partner.tile=move.tile;partner.moves=Math.max(0,partner.moves-move.cost);partner.fortified=false;partner.acted=true;}
    const captive=g.units.find(v=>v.tile===move.tile&&canCaptureCivilian(g,u,v));if(captive)captureCivilian(g,p,u,captive);
    const deck=UNITS[u.type].airCapacity?deckAircraft(g,u):[];
    if(UNITS[u.type].airCapacity&&carrierBusy(g,u))throw Error('舰载机正在出击或转场，请等待甲板空闲。');
    u.tile=move.tile;if(captive)u.moves=move.cost;for(const plane of deck)plane.tile=u.tile;if(action.detach){delete u.linkedUnit;delete partner.linkedUnit;}if(g.map.tiles[u.tile].owner!==u.borderExitOwner)delete u.borderExitOwner;u.moves-=move.cost;u.fortified=false;u.acted=true;stopInZoc(g,u);if(escort)stopInZoc(g,partner);
    const tile=tileOf(g,u),city=g.cities.find(c=>c.tile===u.tile&&c.owner!==p.id);if(city&&occupyCity(g,p,u,city))u.moves=0;envoyArrival(g,u,event);if(tile.ruin&&p.id>=0&&u.type!=='archaeologist'){tile.ruin=false;const reward=Math.floor(gameRandom(g)*3);if(reward===0){p.gold+=45;event(g,'explore',`${p.short} 探索遗迹，获得 45 金币。`,p.id,tile.id);}else if(reward===1){p.researchProgress[p.research]=(p.researchProgress[p.research]||0)+20;event(g,'explore',`${p.short} 从遗迹中发现古老知识。`,p.id,tile.id);}else{p.faith+=30;event(g,'explore',`${p.short} 在遗迹中获得 30 信仰。`,p.id,tile.id);}}
    visitVillage(g,p,u,encounterContext);clearEmptyCamps(g,{event});
    refreshVisibility(g);return;
  }
  if(type==='jump'){checkUnit();const target=jumpTargets(g,p,u).find(t=>t.tile===action.tile);if(!target)throw Error('动力跳跃未解锁、移动力不足或落点不合法。');const from=u.tile;u.tile=target.tile;u.moves-=2;u.acted=u.moves<=0;u.fortified=false;stopInZoc(g,u);visitVillage(g,p,u,encounterContext);refreshVisibility(g);if(!unitTransport(u,tileOf(g,u)))delete u.borderExitOwner;visual(g,'move',u,{from,path:[from,u.tile],jump:true,duration:1.1});return;}
  if(type==='rebase'){checkUnit();const base=rebaseTargets(g,p,u).find(t=>t.tile===action.tile&&t.carrier===action.carrier);if(!base||!flightAllowed(g,p,u,g.map.tiles[action.tile]))throw new Error('机场或航母不可用、已满或超出转场距离。');u.tile=action.tile;delete u.carrierId;if(base.carrier!==undefined)u.carrierId=base.carrier;delete u.airPatrolCity;u.acted=true;u.moves=0;u.fortified=false;refreshVisibility(g);return;}
  if(type==='trainVeteran'){checkUnit();const t=tileOf(g,u);if(!canTrainVeteran(g,p,u,item))throw new Error('训练需要可用专长名额、空闲部队及本国领土。');u.veteranTraits=[...(u.veteranTraits||[]),item];u.acted=true;u.moves=0;event(g,'military',`${p.short} 的 ${UNITS[u.type].name} 完成${VETERAN_TRAITS[item].name}。`,p.id,u.tile);return;}
  if(type==='heal'){checkUnit();const target=healingTargets(g,p,u).find(v=>v.targetUnit===action.targetUnit);if(!target)throw new Error('需要相邻、空闲且可接受治疗的己方陆军。');const patient=g.units.find(v=>v.id===target.targetUnit);patient.hp=Math.min(100,patient.hp+target.healing);patient.medicalUntil=gameTime(g)+12;u.supportUntil=gameTime(g)+12;u.acted=true;u.moves=0;event(g,'military',`${UNITS[u.type].name} 为 ${UNITS[patient.type].name} 恢复 ${target.healing} 生命。`,p.id,patient.tile);return;}
  if(type==='fortify'){checkUnit();if(UNITS[u.type].domain==='air'&&!operationalAirBase(g,p,u))throw new Error('需要可用机场维修飞机。');u.fortified=true;u.acted=true;u.moves=0;u.hp=Math.min(maxUnitHp(u.type),u.hp+(tileOf(g,u).owner===p.id?18:10)+(!unitTransport(u,tileOf(g,u))&&u.veteranTraits?.includes('medicine')?6:0));return;}
  if(type==='improve'){
    checkUnit();if(coastalWorkBlocked(g,tileOf(g,u)))throw Error('需要防洪屏障才能改良受淹地块。');const tile=tileOf(g,u);if(u.type!=='builder'||u.charges<=0||tile.owner!==p.id||improvementFor(p,tile)!==item)throw new Error('无法在此改良地块。请检查资源、地貌与所需科技。');tile.improvement=item;ageRecord(g,p,['improvement'],`improvement:${tile.id}`);u.charges--;u.acted=true;u.moves=0;
    boost(g,p,'irrigation');if(item==='mine')boost(g,p,'mining');if(tile.resource==='horses'&&resourceRevealed(tile.resource,p))boost(g,p,'horseback');if(tile.resource==='iron'&&resourceRevealed(tile.resource,p))boost(g,p,'ironwork');
    if(g.map.tiles.filter(t=>t.owner===p.id&&t.improvement==='mine').length>=3)boost(g,p,'apprenticeship');
    if(u.charges===0){g.units=g.units.filter(x=>x.id!==u.id);event(g,'build',p.short+' 的建造者次数用尽，已完成任务并退役。',p.id,tile.id);}event(g,'build',`${p.short} 完成了 ${improvementName(tile,item)}。`,p.id,tile.id);return;
  }
  if(type==='chop'){
    checkUnit();if(coastalWorkBlocked(g,tileOf(g,u)))throw Error('需要防洪屏障才能开发受淹地块。');const tile=tileOf(g,u),city=chopCity(g,p,tile);
    if(u.type!=='builder'||u.charges<=0||tile.owner!==p.id||!canChop(p,tile)||!city)throw new Error('此地无法砍伐，或所需科技尚未解锁。森林需要采矿业，雨林需要青铜铸造。');
    const label=tile.feature==='forest'?'森林':'雨林',production=chopYield(g,p,tile);recordDeforestation(g,p,tile.feature);tile.feature=null;u.charges--;u.acted=true;u.moves=0;
    if(city.production){city.production.progress+=production;if(city.production.progress>=orderCost(g,city)&&completeProduction(g,p,city,city.production)){city.storedProduction+=Math.max(0,city.production.progress-orderCost(g,city));city.production=null;}}
    else city.storedProduction+=production;
    if(u.charges===0)g.units=g.units.filter(x=>x.id!==u.id);refreshVisibility(g);event(g,'build',`${p.short} 清理了${label}，为 ${city.name} 提供 ${production} 生产力。地块尚未建造改良设施。`,p.id,tile.id);return;
  }
  if(type==='upgrade'){
    checkUnit();const op=unitUpgradeOptions(g,p,u).find(o=>o.item===item);if(!op?.available)throw new Error(op?.reasons.join('；')||'不能跳级或跨兵种路线升级。');if(action.expectedCost!==undefined&&action.expectedCost!==op.goldCost)throw Error('升级价格已变化，请重新选择。');p.gold-=op.goldCost;u.type=item;ageRecord(g,p,['upgrade'],`upgrade:${u.id}:${item}`);u.fortified=false;u.moves=0;u.acted=true;event(g,'military',`${p.short} 的部队升级为 ${UNITS[item].name}（${op.goldCost} 金币）。`,p.id,u.tile);return;
  }
  if(type==='attack'){
    checkUnit();const target=attackTargets(g,p,u).find(a=>(a.targetUnit!==undefined&&a.targetUnit===action.targetUnit)||(a.targetCity!==undefined&&a.targetCity===action.targetCity));if(!target)throw new Error('目标不在射程内，或尚未宣战。');
    const spec=UNITS[u.type];const impactTarget=target.targetUnit!==undefined?g.units.find(e=>e.id===target.targetUnit):g.cities.find(e=>e.id===target.targetCity);if(spec.domain==='air'&&interceptAir(g,p,u,tileOf(g,impactTarget))){cleanUnits(g);refreshVisibility(g);return;}if(spec.domain==='air'&&!flightAllowed(g,p,u,tileOf(g,impactTarget)))throw new Error('飞行路线经过未开放的中立领空。');if(spec.submarine)u.revealedUntil=gameTime(g)+20;const pair=combatStrengths(g,u,impactTarget),ranged=pair.ranged,strength=pair.attack.strength,defense=pair.defense.strength;
    if(target.targetUnit!==undefined){const enemy=impactTarget;if(!ranged&&canCaptureCivilian(g,u,enemy)){captureCivilian(g,p,u,enemy);u.moves=0;u.acted=true;refreshVisibility(g);return;}const enemyStart=enemy.tile;const dealt=heritageDamage(g,enemy,damage(g,strength,Math.max(8,defense))*(spec.consumable?1.5:1),u);
      if(!ranged&&enemy.tile===enemyStart&&!UNITS[enemy.type].civilian)heritageDamage(g,u,damage(g,defense,strength),enemy);
      gainExperience(g,u,enemy.hp<=0?12:Math.min(6,dealt));if(enemy.hp<=0){envoyKilled(g,enemy,p.id,event);if(!UNITS[enemy.type].civilian){const rewards=nationalEffects(p,gameTime(g));killEffects(g,p,u,enemy);heritageKillReward(g,p,u,enemy);p.faith+=Math.floor(Math.max(UNITS[enemy.type].strength||0,UNITS[enemy.type].ranged||0)*(pantheonEffect(p).killFaithRatio||0));}boost(g,p,'archery');if(!ranged&&u.hp>0){const city=g.cities.find(c=>c.tile===enemy.tile&&c.owner!==p.id);if(city)occupyCity(g,p,u,city);else if(Number.isFinite(movementCost(g,p,u,tileOf(g,u),tileOf(g,enemy)))){const captive=g.units.find(v=>v.hp>0&&v.tile===enemy.tile&&canCaptureCivilian(g,u,v));if(captive)captureCivilian(g,p,u,captive);else u.tile=enemy.tile;}}event(g,'battle',`${p.short} 的 ${spec.name} 击败了 ${stateForOwner(g,enemy.owner)?.name||(enemy.owner<0?'蛮族':g.players[enemy.owner].short)} 的 ${UNITS[enemy.type].name}。`,p.id,enemy.tile);}else event(g,'battle',`${p.short} 的 ${spec.name} 造成 ${dealt} 点伤害。`,p.id,enemy.tile);
    }else {
      const enemy=impactTarget,alreadyBreached=enemy.hp<=0&&enemy.walls<=0;const hit=cityAttackDamage(u.type,enemy,damage(g,strength,defense),p,{...siegeSupport(g,u),wallSpecialty:tileOf(g,u).owner===p.id||neighbors(g.map,tileOf(g,u)).some(t=>t.fort?.owner===p.id&&t.fort.hp>0)}),dealt=hit.total;enemy.walls-=hit.wallDamage;enemy.hp-=hit.cityDamage;if(spec.consumable){const secondary=cityAttackDamage(u.type,enemy,Math.round(damage(g,strength,defense)*.5));enemy.walls-=secondary.wallDamage;enemy.hp-=secondary.cityDamage;}
      cityAttacked(g,p.id,enemy,event);enemy.hp=Math.max(u.owner<0&&enemy.isCapital?1:0,enemy.hp);enemy.lastAttackedAt=gameTime(g);if(!ranged&&!alreadyBreached)u.hp-=damage(g,defense,strength);if(u.hp>0&&dealt>1)gainExperience(g,u,8);
      if((ranged||distance(g,tileOf(g,u),tileOf(g,enemy))>1||!occupyCity(g,p,u,enemy)))event(g,'battle',`${p.short} 攻击 ${enemy.name}，造成 ${dealt} 点城市伤害。`,p.id,enemy.tile);
    }
    if(spec.consumable){u.hp=0;event(g,'battle','无人机投弹后自爆，造成二次伤害。',p.id,impactTarget.tile);}u.moves=0;u.acted=true;u.fortified=false;cleanUnits(g,p.id);if(u.hp>0)visitVillage(g,p,u,encounterContext);refreshVisibility(g);return;
  }
  if(type==='cityAttack'){
    checkCity();const enemy=g.units.find(e=>e.id===action.targetUnit);if(!canCityAttackUnit(g,p,c,enemy))throw new Error('城市无法攻击此目标。');heritageDamage(g,enemy,damage(g,35+p.techs.length+(governorHas(g,c,'gov_warlord')?5:0)+(governorHas(g,c,'gov_warlord','c')?5:0)+intelligenceBonus(g,p.id,enemy.owner,tileOf(g,enemy)),unitStrength(g,enemy,true,c)),c);c.attacked=true;if(enemy.hp<=0)envoyKilled(g,enemy,p.id,event);cleanUnits(g,p.id);refreshVisibility(g);return;
  }
  if(type==='trade'){
    checkCity();const target=g.cities.find(x=>x.id===action.targetCity);if(!target||!legalActions(g,p).some(a=>a.type==='trade'&&a.city===c.id&&a.targetCity===target.id))throw new Error('无法建立这条贸易路线。');
    g.routes.push({id:g.nextId++,owner:p.id,from:c.id,to:target.id,remaining:25,path:heritageTradePath(g,c,target)});ageRecord(g,p,['route',...(target.owner!==p.id?['foreignRoute']:[])],`route:${g.routes.at(-1).id}`);connectRoad(g,c.tile,target.tile,p.id);boost(g,p,'currency');event(g,'trade',`${c.name} 与 ${target.name} 建立贸易航路。`,p.id,c.tile);return;
  }
  if(['war','peace','alliance','openBorders'].includes(type)){
    const remaining=type==='war'?truceRemaining(g,p.id,action.player):0;
    if(remaining>0)throw new Error(`双方处于停战保护期，还需 ${Math.ceil(remaining/20)} 周期（${Math.ceil(remaining)} 游戏秒）。`);
    const other=g.players[action.player];if(!other||!legalActions(g,p).some(a=>a.type===type&&a.player===other.id))throw new Error('此外交行动当前不可用。');
    if(type==='war'){if(['formalWar','surpriseWar'].includes(action.declaration))applyCourtAction(g,p,{type:action.declaration,player:other.id},{emit:event,beginWar,allowBorderExit});else beginWar(g,p,other,event,{kind:action.warKind||'standard'});const cb=!p.manual&&p.attitudes?.[other.id]?.casusBelli;if(cb)event(g,'diplomacy',`${p.short} 对 ${other.short} 的宣战理由：${cb}。`,null);}else propose(g,p,other.id,type,event);return;
  }
  if(type==='recruitFaith'){checkCity();const cost=religiousRecruitmentCost(g,p,item,c),spec=UNITS[item];if(!canRecruitReligious(g,p,item,c)||p.faith<cost)throw Error('Faith recruitment unavailable.');const spawn=tilesInRange(g.map,tileOf(g,c),2).find(t=>t.owner===p.id&&!isWater(t)&&t.terrain!=='mountain'&&deploymentFree(g,t.id));if(!spawn||g.units.length>=2000)throw Error('No religious recruitment space.');p.faith-=cost;p.faithOrders++;p.faithOrdersByType[item]=(p.faithOrdersByType[item]||0)+1;const unit=addUnit(g,p.id,item,spawn.id);if(spec.religious)unit.religionOwner=c.religion;if(governorHas(g,c,'gov_theologian','b')&&['missionary','apostle'].includes(item))unit.charges++;if(['missionary','apostle'].includes(item)&&worshipOperational(g,c)&&c.worship==='mosque')unit.charges++;return;}
  if(['pantheon','belief','worship','faithBuilding'].includes(type)){applyReligionAction(g,p,action,{addUnit,refreshVisibility});return;}
  if(type==='affiliateReligion'){const city=ownedCities(g,p).find(c=>operationalBuilding(g,c,'holy'));affiliateReligion(g,p,action.player,city);event(g,'religion',`${p.short} 创立了 ${g.players[action.player].short} 宗教的支派。`,p.id,city.tile);refreshVisibility(g);return;}
  if(type==='religion'){if(p.religion||g.players.some(o=>o.religion===item)||independentReligions(g).length>=religionCapacity(g)||p.faith<120||!RELIGIONS[item]||!ownedCities(g,p).some(c=>hasBuilding(c,'holy')))throw new Error('创立信条需要圣地和 120 信仰。');p.faith-=120;p.religion=item;const capital=ownedCities(g,p).find(c=>hasBuilding(c,'holy'));capital.faithPressure={secular:30,[p.id]:Math.max(180,capital.population*80)};updateFollowers(g,capital);event(g,'religion',`${p.short} 创立了 ${RELIGIONS[item].name}。`,p.id,capital.tile);return;}
  if(type==='spread'){checkUnit();const target=g.cities.find(c=>c.id===action.targetCity);if(!target||!religionTargets(g,p,u).some(c=>c.id===target.id))throw new Error('无法在此传播信条。');spreadReligion(g,p,u,target);u.charges--;u.moves=0;u.acted=true;if(u.charges===0)g.units=g.units.filter(x=>x.id!==u.id);const source=unitReligionSource(g,u);event(g,'religion',`${target.name} 获得 ${RELIGIONS[source.religion].name} 的传播压力，信众 ${target.followers[source.id]||0} / ${target.population}。`,p.id,target.tile);return;}
  throw new Error(`未知行动：${type}`);
}

export function applyOrders(g,p,orders){
  if(!Array.isArray(orders))return {accepted:0,rejected:[{reason:'orders must be an array'}]};
  const report={accepted:0,rejected:[]};for(const order of orders.slice(0,128)){try{applyAction(g,p,order);report.accepted++;}catch(e){report.rejected.push({type:order?.type,reason:e.message});}}
  g.lastActions.push({turn:g.turn,player:p.id,...report});g.lastActions=g.lastActions.slice(-32);return report;
}

function completeProduction(g,p,c,work){
  const {item}=work,spec=PRODUCTION[item];
  if(work.tile!==null&&work.tile!==undefined&&g.map.tiles[work.tile]&&coastalWorkBlocked(g,g.map.tiles[work.tile])&&(spec.kind==='district'||spec.kind==='wonder'))return false;
  if(work.repair&&WONDERS[item])return false;
  if(UNITS[item]){
    if(UNITS[item].domain==='sea'&&operationalWonder(g,'venetian_arsenal',p.id)&&(g.heritage.pendingGrants?.length||0)>=64)return false;
    if(!buildable(g,p,c,item,work.tile))return false;
    const spawn=unitDeployment(g,p,c,item,work);
    if(!spawn)return false;
    if(item==='settler'){if(c.population<2)return false;if(!governorHas(g,c,'gov_agrarian','b'))c.population--;}
    const u=addUnit(g,p.id,item,spawn.id);governorTrained(g,p,c,u);if(!spec.civilian&&!['sea','air'].includes(spec.domain)&&operationalBuilding(g,c,'barracks'))u.training=3;unitProduced(g,p,c,u);if(!spec.civilian&&!['sea','air'].includes(spec.domain)&&operationalBuilding(g,c,'barracks'))u.xp+=(heritageEffects(g,p).barracksInitialXp||0)+(heritageEffects(g,c).barracksInitialXp||0)+(!spec.ranged&&!spec.siege&&spec.class!=='cavalry'?heritageEffects(g,c).infantryInitialXp||0:0);duplicateHeritageNavy(g,p,c,u,{addUnit});u.moves=0;u.acted=true;
  }else if(PROJECTS[item]){
    if(item==='atomicbomb'){if(!buildable(g,p,c,item))return false;p.nuclearStockpile=nuclearStock(p)+1;}
    if(item==='carbonrecapture'){if(!buildable(g,p,c,item))return false;recaptureCarbon(g,p);}
    if(item==='research')p.scienceBank=(p.scienceBank||0)+45;
    if(item==='research'&&governorHas(g,c,'gov_educator','bb'))p.scienceBank=(p.scienceBank||0)+25;
    if(item==='festival'&&governorHas(g,c,'gov_curator','aa')){p.cultureBank=(p.cultureBank||0)+25;p.tourism+=20;p.gold+=60;}
    if(item==='festival'){p.cultureBank=(p.cultureBank||0)+40;p.tourism+=25;}
    if(item==='prayer')p.faith+=65;
    if(PROJECTS[item].stage){if(!operationalSpaceport(g,p,c)||PROJECTS[item].stage!==p.spaceStage+1)return false;p.spaceStage=PROJECTS[item].stage;ageRecord(g,p,['space'],`space:${p.spaceStage}`);const launchTile=c.districts.find(d=>d.item==='spaceport')?.tile??c.tile;if(!p.spaceLaunchDone){p.spaceLaunchDone=true;visual(g,'launch',{id:c.id,owner:p.id,type:'spaceport',tile:launchTile},{project:item,duration:12});event(g,'space',`${p.short} 完成 ${spec.name}，火箭升空！`,null,null);}else event(g,'science',`${p.short} 完成 ${spec.name}。`,null,null);if(item==='moon')boost(g,p,'nanotech');}
  }else if(WONDERS[item]){
    if(g.wonders[item]){work.raceRefund=true;delete g.heritage.legacyOrders?.[c.id];event(g,'wonder',`${c.name} 的 ${spec.name} 竞建失败，生产投入全额返还为城市储备。`,p.id,c.tile);return true;}
    const t=g.map.tiles[work.tile];if(!validWonderPlacement(g,p,c,item,t)&&!legacyWonderOrder(g,p,c,item,work.tile))return false;delete g.heritage.legacyOrders?.[c.id];
    recordDeforestation(g,p,t.feature);t.territoryCity=c.id;t.district={item,city:c.id,kind:'wonder'};t.pillaged=false;t.improvement=null;t.feature=null;c.buildings.push(item);if(governorHas(g,c,'gov_engineer','a'))p.cultureBank=(p.cultureBank||0)+productionCost(g,item)*.25;g.wonders[item]={item,owner:p.id,city:c.id,tile:t.id};
    event(g,'wonder',`${p.short} 在 ${c.name} 建成了世界奇观：${spec.name}！`,p.id,t.id);boost(g,p,'flight');
  }else if(BUILDINGS[item]){
    if(climateBuildReason(g,p,c,item))return false;
    if(hasBuilding(c,item))return true;
    if(spec.kind==='district'){
      const t=g.map.tiles[work.tile];if(!t||t.owner!==p.id||t.district||t.cityId!==null)return false;
      recordDeforestation(g,p,t.feature);t.territoryCity=c.id;t.district={item,city:c.id,kind:'district'};t.improvement=null;t.feature=null;c.districts.push({item,tile:t.id});connectRoad(g,c.tile,t.id,p.id);
    }
    c.buildings.push(item);if(spec.defense)c.walls=wallCapacity(c);if(baseItem(item)==='walls')boost(g,p,'engineering');if(baseItem(item)==='workshop')boost(g,p,'gunpowder');if(item==='harbor')boost(g,p,'steam');if(item==='lab')boost(g,p,'rocketry');
    if(item==='campus'&&work.tile!==null&&neighbors(g.map,g.map.tiles[work.tile]).some(t=>t.terrain==='mountain'))boost(g,p,'astronomy');
  }
  ageRecord(g,p,UNITS[item]?(UNITS[item].civilian?[]:['military',...(UNITS[item].domain==='sea'?['naval']:[])]):BUILDINGS[item]?['building',...(spec.kind==='district'?['district']:[]),baseItem(item)]:PROJECTS[item]?['project']:[],UNITS[item]?`unit:${g.nextId}`:PROJECTS[item]?`project:${c.id}:${g.turn}:${item}`:`building:${c.id}:${baseItem(item)}`);
  productionCompleted(g,p,c,item);heritageCompleted(g,p,c,item,{addUnit,event,boost,inspire});
  if(!WONDERS[item]&&!PROJECTS[item]?.stage)event(g,'production',`${c.name} 完成 ${spec.name}。`,p.id,c.tile);return true;
}
function progressResearch(g,p,type,income){
  const catalog=type==='research'?TECHS:CIVICS,progress=type==='research'?p.researchProgress:p.civicProgress,done=type==='research'?p.techs:p.civics,boosts=type==='research'?p.boosts:p.inspirations,bank=type==='research'?'scienceBank':'cultureBank',key=p[type];
  const amount=income+(p[bank]||0);p[bank]=0;
  if(!key||!catalog[key]||done.includes(key)){p[bank]=gamePace(g).legacy?amount:Math.min(amount,income*2);return;}
  const reserve=type==='research'?'heritageScienceReserve':'heritageCultureReserve',credit=p[reserve]||0,cost=researchCost(g,key,type==='civic',boosts.includes(key)),used=Math.min(credit,Math.max(0,cost-(progress[key]||0)-amount));p[reserve]=credit-used;
  progress[key]=(progress[key]||0)+amount+used;
  if(progress[key]>=cost){p[bank]=gamePace(g).legacy?progress[key]-cost:Math.min(progress[key]-cost,cost*.5);progress[key]=cost;done.push(key);if(key===DIPLOMATIC_RESEARCH[type])awardDiplomaticPoints(g,p,1,type+':'+p.id+':'+key,catalog[key].name);ageRecord(g,p,[type==='research'?'ownTech':'ownCivic'],`${type}:${key}`);p[type]=null;if(type==='civic'){if(key==='empire')for(const other of g.players)if(other.id!==p.id)allowBorderExit(g,other.id,p.id);initializePolitics(g,p);p.politics.freeTurn=g.turn+1;}event(g,type==='research'?'science':'culture',`${p.short} 完成了 ${type==='research'?'科技':'市政'}：${catalog[key].name}。`,p.id);}
}
const encounterContext={addUnit,deploymentFree,event,boost,inspire,gainExperience,maxUnitHp,updateFollowers,ageRecord,
 freeUpgrades:(g,p,u)=>successorsFor(p,u.type).filter(key=>{const spec=UNITS[key];return spec&&!spec.civilian&&eligible(p,spec)&&(spec.domain||'land')===(UNITS[u.type].domain||'land')&&(!spec.resource||playerResources(g,p)[spec.resource]);})};
function spawnBarbarians(g){encountersTurn(g,encounterContext);}
function barbarianTurn(g){
  if(!g.settings.barbarians&&!g.units.some(u=>u.owner===-1&&u.mutiny))return;
  spawnBarbarians(g);
  for(const u of g.units.filter(u=>u.owner===-1&&(g.settings.barbarians||u.mutiny))){
    if(u.hp<=0||UNITS[u.type].civilian)continue;u.moves=movementAllowance(g,u);u.acted=false;
    const p=barbarianPlayer(g,u),here=tileOf(g,u),targets=attackTargets(g,p,u);
    if(targets.length){const target=targets.sort((a,b)=>a.health-b.health)[0];applyAction(g,p,{type:'attack',unit:u.id,...target});}
    else if(!isCampGuard(g,u)){const prey=g.units.filter(t=>!t.greatPerson&&!protectedEnvoy(t)&&t.owner>=0&&distance(g,here,tileOf(g,t))<=6),moves=reachable(g,p,u,true);if(moves.length){moves.sort((a,b)=>{const score=t=>prey.length?Math.min(...prey.map(e=>distance(g,g.map.tiles[t.tile],tileOf(g,e)))):distance(g,g.map.tiles[t.tile],here)+Math.sin(g.turn+t.tile);return score(a)-score(b);});u.tile=moves[0].tile;visual(g,'move',u,{from:here.id,path:moves[0].path});}}

  }
  cleanUnits(g);
}
export function score(g,p){return publicEmpireScore(g,p);}
export function victoryProgress(g,p){
  const capitals=g.players.filter(o=>o.capital!==null).map(o=>g.cities.find(c=>c.id===o.capital));
  const pace=gamePace(g),cultureTarget=Math.max((pace.legacy?1500:4000)*pace.factor,...g.players.filter(o=>o.id!==p.id&&o.alive).map(o=>o.cultureTotal*(pace.legacy?.8:1.5)));
  const converted=g.players.filter(o=>o.alive&&ownedCities(g,o).length&&ownedCities(g,o).filter(c=>c.religion===p.id).length>ownedCities(g,o).length/2).length;
  return {domination:{owned:capitals.filter(c=>c?.owner===p.id).length,total:g.players.length},science:{stage:p.spaceStage,total:3},culture:{tourism:visitingTourists(p),target:Math.max(1,...g.players.filter(o=>o.id!==p.id&&o.alive).map(o=>domesticTourists(o,g)+1)),influence:Math.floor(p.tourism)},religion:{converted,total:g.players.filter(o=>o.alive).length},diplomacy:diplomaticProgress(g,p),score:score(g,p),scoreDetails:scoreBreakdown(g,p),scoreLimit:{enabled:victoryEnabled(g,'score'),completedRounds:Math.max(0,g.turn-1),limit:g.maxTurns,remaining:Math.max(0,g.maxTurns-g.turn+1)}};
}
function checkVictory(g){
  if(g.winner)return;
  const candidates=g.players.filter(p=>p.alive),completed=Math.max(0,g.turn-1);
  // Settle the entire congress first; transient points never trigger a victory.
  for(const p of candidates){const v=victoryProgress(g,p);let type=null;
    if(victoryEnabled(g,'science')&&p.spaceStage===3)type='science';
    else if(victoryEnabled(g,'domination')&&g.players.length>1&&g.players.every(o=>o.capital!==null)&&v.domination.owned===g.players.length)type='domination';
    else if(victoryEnabled(g,'culture')&&g.turn>=70*gamePace(g).factor&&g.players.length>1&&v.culture.tourism>=v.culture.target)type='culture';
    else if(victoryEnabled(g,'religion')&&g.turn>=50*gamePace(g).factor&&g.players.length>1&&p.religion&&v.religion.total>0&&v.religion.converted===v.religion.total)type='religion';
    else if(victoryEnabled(g,'diplomacy')&&g.players.length>1&&v.diplomacy.points>=v.diplomacy.target)type='diplomacy';
    if(type){g.winner={player:p.id,type,turn:completed,score:score(g,p)};break;}
  }
  if(!g.winner&&victoryEnabled(g,'domination')&&g.players.length>1&&candidates.length===1&&g.turn>4)g.winner={player:candidates[0].id,type:'domination',turn:completed,score:score(g,candidates[0])};
  if(!g.winner&&victoryEnabled(g,'score')&&completed>=g.maxTurns&&candidates.length){const best=[...candidates].sort((a,b)=>compareEmpireScore(g,a,b))[0];g.winner={player:best.id,type:'score',turn:completed,score:score(g,best)};}
  if(g.winner)event(g,'victory',`${g.players[g.winner.player].name} 赢得了 ${VICTORY_NAMES[g.winner.type]}！`,g.winner.player);
}
export function finishTurn(g,{actions=true}={}){migrateLegacyAges(g);
  if(g.winner)return;
  reconcileHeritagePolicies(g);heritagePeriod(g,{addUnit});evacuateGreatPeople(g);
  if(actions)barbarianTurn(g);else spawnBarbarians(g);
  const settlements=new Map(g.players.filter(p=>p.alive).map(p=>[p.id,empireYields(g,p)]));
  const pressures=citizenPressures(g),loyaltyTransfers=[];
  for(const p of g.players)for(const r of Object.values(p.relations))r.loyaltyPressure=0;
  for(const p of g.players){if(!p.alive)continue;
    const invasion=domesticSituation(g,p);for(const u of invasion.invaders)if(p.relations[u.owner])p.relations[u.owner].lastInvasionAt=gameTime(g);
    const yields=settlements.get(p.id);settleMilitaryPay(g,p,yields,{event,visual,unlink:unlinkUnit});cleanUnits(g);p.faith=round(p.faith+yields.faith);p.scienceTotal+=yields.science;p.cultureTotal+=yields.culture;p.tourism+=yields.tourism;
    uniquePeriod(g,p);progressResearch(g,p,'research',yields.science);progressResearch(g,p,'civic',yields.culture);
    for(const c of ownedCities(g,p)){
      const y=cityYields(g,c),status=cityGrowth(g,c,y),growth=status.capacity;c.food+=Math.max(-c.food,status.rate);
      if(c.food>=growth){c.food-=growth*(governorHas(g,c,'gov_agrarian')?.7:1);c.population++;event(g,'growth',`${c.name} 人口增长至 ${c.population}。`,p.id,c.tile);}
      else if(c.food<=0&&y.netFood<0&&c.population>1){c.population--;c.food=5;}
      if(c.production){c.production.progress+=productionRate(g,c,c.production,y.production);if(c.production.progress>=orderCost(g,c)){const work=c.production;if(completeProduction(g,p,c,work)){c.storedProduction=(work.raceRefund?orderCost(g,c,work):0)+Math.max(0,work.progress-orderCost(g,c,work));c.production=null;}}}
      c.culture+=y.culture;
      const nearby=tilesInRange(g.map,tileOf(g,c),3),threshold=(18+nearby.filter(t=>t.owner===p.id).length*2)*gamePace(g).factor;
      if(c.culture>=threshold){const options=nearby.filter(t=>t.owner===null&&!t.cityStateTerritory);options.sort((a,b)=>{const val=t=>distance(g,t,tileOf(g,c))*-5+(t.resource?3:0)+tileYield(t,p).food+tileYield(t,p).production;return val(b)-val(a)||a.id-b.id;});if(options[0]){claimCityTile(g,options[0],c);c.culture-=threshold;}}
      const besieged=cityUnderSiege(g,c)||(c.lastAttackedAt!==undefined&&gameTime(g)-c.lastAttackedAt<20)||g.units.some(u=>u.hp>0&&!UNITS[u.type].civilian&&atWar(g,c.owner,u.owner)&&!unitTransport(u,tileOf(g,u))&&distance(g,tileOf(g,u),tileOf(g,c))<=1);if(!besieged){c.hp=Math.min(CITY_MAX_HP,c.hp+10);if(hasBuilding(c,'walls'))c.walls=Math.min(wallCapacity(c),c.walls+5);}if(actions)c.attacked=false;if(c.occupation>0)c.occupation--;
      c.loyaltyStatus=loyaltyStatus(g,c,y,pressures.get(c.id));
      if(c.loyaltyStatus.change<0&&c.loyaltyStatus.foreign>0){
        const contributions=(c.loyaltyStatus.foreignPressures||[]).filter(x=>p.met.includes(x.owner)&&g.players[x.owner]?.alive),total=contributions.reduce((n,x)=>n+x.pressure,0);
        for(const x of contributions){const r=p.relations[x.owner];if(!r)continue;const amount=Math.min(Math.max(0,8-r.loyaltyPressure),(.5+Math.min(4,-c.loyaltyStatus.change*.25))*x.pressure/Math.max(1,total));if(amount>0){r.loyaltyPressure+=amount;r.loyaltyGrievances=Math.min(200,(r.loyaltyGrievances||0)+amount);r.grievances=Math.min(200,r.grievances+amount);}}
      }
      c.loyalty=Math.max(0,Math.min(100,c.loyalty+c.loyaltyStatus.change+(heritageCityBonuses(g,c).loyalty||0)));
      const liberty=g.wonders.statue_of_liberty;c.loyalty=Math.max(c.loyalty,heritageLoyaltyFloor(g,c));
      if(c.loyalty===0&&c.loyaltyStatus.foreignOwner!==null)loyaltyTransfers.push({city:c,target:c.loyaltyStatus.foreignOwner});


    }
    const own=ownedCities(g,p),units=ownedUnits(g,p);
    if(units.filter(u=>!UNITS[u.type].civilian).length>=3)boost(g,p,'bronze');
    if(units.filter(u=>u.type==='archer').length>=3)boost(g,p,'machinery');if(units.filter(u=>u.type==='horseman').length>=2)boost(g,p,'stirrups');if(units.some(u=>u.type==='cannon'))boost(g,p,'combustion');
    for(const [item,key] of [['campus','education'],['university','printing'],['workshop','industrial'],['factory','electricity']])if(own.filter(c=>hasBuilding(c,item)).length>=2)boost(g,p,key);
    if(own.filter(c=>hasBuilding(c,'lab')).length>=3)boost(g,p,'atomic');if(yields.culture>=50)boost(g,p,'computers');
    const improvements=g.map.tiles.filter(t=>t.owner===p.id&&t.improvement),population=sum(own,'population');
    if(improvements.length>=3)inspire(g,p,'craftsmanship');if(p.met.length)inspire(g,p,'trade');if(population>=6)inspire(g,p,'empire');if(p.met.length>=3)inspire(g,p,'state');
    if(Object.values(g.wonders).some(w=>w.owner===p.id))inspire(g,p,'drama');if(p.religion)inspire(g,p,'theology');if(improvements.filter(t=>t.improvement==='farm').length>=6)inspire(g,p,'feudalism');
    if(own.some(c=>c.population>=10))inspire(g,p,'civilservice');if(own.filter(c=>hasBuilding(c,'harbor')).length>=2)inspire(g,p,'exploration');if(own.filter(c=>hasBuilding(c,'museum')).length>=2)inspire(g,p,'humanism');
    if(units.filter(u=>!UNITS[u.type].civilian).length>=7)inspire(g,p,'nationalism');if(yields.gold>=50)inspire(g,p,'economy');if(own.filter(c=>hasBuilding(c,'factory')).length>=2)inspire(g,p,'ideology');if(yields.culture>=40)inspire(g,p,'media');if(g.routes.filter(r=>r.owner===p.id).length>=4)inspire(g,p,'globalization');
    for(const id of p.visible){const t=g.map.tiles[id];if(resourceRevealed(t.resource,p)&&(t.resource==='horses'||t.resource==='cattle'))boost(g,p,'animal');if(t.resource==='stone')boost(g,p,'masonry');}
    if(!own.length&&!units.some(u=>u.type==='settler')){p.alive=false;g.units=g.units.filter(u=>u.owner!==p.id);retireEliminatedDiplomacy(g);event(g,'eliminated',`${p.name} 已退出历史舞台。`,p.id);}
  }
  if(loyaltyTransfers.length)initializeTerritories(g);
  for(const {city:c,target}of loyaltyTransfers){const floor=heritageLoyaltyFloor(g,c);if(floor){c.loyalty=Math.max(c.loyalty,floor);continue;}const old=c.owner;c.owner=target;transferCityTerritory(g,c,target);c.loyalty=70;c.production=null;c.occupation=3;delete c.loyaltyStatus;for(const p of g.players)if(p.alive&&p.id!==target&&!atWar(g,p.id,target))allowBorderExit(g,p.id,target);g.players[old].planRevision=(g.players[old].planRevision||0)+1;g.players[target].planRevision=(g.players[target].planRevision||0)+1;event(g,'conquest',`${c.name} 因忠诚度崩溃转向了 ${g.players[target].short}。`,target,c.tile);}
  g.routes=g.routes.filter(r=>{r.remaining--;const from=g.cities.find(c=>c.id===r.from),to=g.cities.find(c=>c.id===r.to);return r.remaining>0&&from&&to&&from.owner===r.owner&&!atWar(g,from.owner,to.owner);});
  spendVillageReserves(g);g.turn++;
  settleClimate(g,{event});cleanUnits(g);
  for(const u of aliveUnits(g)){if(actions){u.moves=movementAllowance(g,u);u.acted=false;}if(u.fortified&&(UNITS[u.type].domain!=='air'||operationalAirBase(g,g.players[u.owner],u)))u.hp=Math.min(maxUnitHp(u.type),u.hp+5+(!unitTransport(u,tileOf(g,u))&&u.veteranTraits?.includes('medicine')?3:0));}
  governorsTurn(g,event);cityStatesTurn(g,{addUnit,deploymentFree,event,damage,applyAction,attackTargets,reachable,movementAllowance,visual});cleanUnits(g);espionageTurn(g,event);tourismTurn(g);religionTurn(g);courtTurn(g,event,{allowBorderExit});diplomacyTurn(g,event,{finance:p=>militaryFinance(g,p)});{const pc=new Map(),pl=new Map();attitudeTurn(g,{emit:event,score,finance:p=>militaryFinance(g,p),personality:p=>{if(!pc.has(p.id))pc.set(p.id,personality(g,p));return pc.get(p.id);},plan:p=>{if(!pl.has(p.id))pl.set(p.id,developmentPlan(g,p));return pl.get(p.id);},assess:(p,o)=>militaryAssessment(g,p,o,u=>unitStrength(g,u)),victory:o=>victoryProgress(g,o),yields:p=>empireYields(g,p)});}settleDiplomaticMilestones(g);settleDiplomaticFavor(g,suzerain);congressTurn(g,event);refreshVisibility(g);ageTurn(g,{event});checkVictory(g);recordHistory(g);
}
function recordHistory(g){g.history.push({turn:g.turn,players:g.players.map(p=>({id:p.id,score:score(g,p),cities:ownedCities(g,p).length,population:sum(ownedCities(g,p),'population'),science:empireYields(g,p).science,culture:empireYields(g,p).culture,gold:Math.round(p.gold),military:ownedUnits(g,p).filter(u=>!UNITS[u.type].civilian).length,alive:p.alive}))});}

function projectUnit(g,u,view=-1){
  const safe={...u,...heritageUnitIdentity(u)};if(view>=0&&u.owner!==view)delete safe.moveOrder;if(view>=0&&u.owner!==view)delete safe.recruitmentCity;if(view>=0&&u.owner!==view)delete safe.heritageEffects;if(view>=0&&u.owner!==view)delete safe.airPatrolCity;if(view>=0&&u.owner!==view&&u.linkedUnit!==undefined&&!visibleSet(g.players[view]).has(linkedPartner(g,u)?.tile))delete safe.linkedUnit;if(view>=0&&u.owner!==view&&u.envoy)safe.envoy={protected:u.envoy.protected,state:u.envoy.state};const activity=u.activity;if(!activity||view<0||u.owner===view)return safe;
  const visible=visibleSet(g.players[view]);
  if(['move','rebase'].includes(activity.action.type))return {...safe,activity:visible.has(activity.from)&&visible.has(activity.to)?{action:{type:activity.action.type},from:activity.from,to:activity.to,started:activity.started,ends:activity.ends}:null};
  return {...safe,activity:null};
}
const transportStatus=(g,u)=>{const transport=unitTransport(u,tileOf(g,u));return {embarked:!!transport,transport};};
export function observation(g,p,options={}){return evaluate(g,()=>observationInternal(g,p,{nativeRoutes:true,...options}));}
function committedUpgradeGold(g,p){
  const pending=new Map();
  for(const u of ownedUnits(g,p))if(u.activity?.action.type==='upgrade')pending.set(u.id,u.activity.action);
  for(const entry of g.realtime?.queues?.[p.id]||[])if(entry.action.type==='upgrade'&&!pending.has(entry.action.unit))pending.set(entry.action.unit,entry.action);
  let total=0;for(const [id,a]of pending){const u=g.units.find(u=>u.id===id&&u.owner===p.id);if(u&&successorsFor(p,u.type).includes(a.item))total+=unitUpgradeCost(g,u.type,a.item,p);}
  return total;
}
function committedDiplomacyGold(g,p){
  // Reserve voluntary outgoing quotes, never an unaccepted foreign demand.
  const envoys=new Map(ownedUnits(g,p).filter(u=>u.type==='envoy'&&u.hp>0).map(u=>[u.id,u])),counted=new Set();
  const quote=terms=>['concession','surrender'].includes(terms?.mode)&&Number.isFinite(terms.gold)?Math.max(0,terms.gold):0;
  const valid=u=>{
    const e=u?.envoy,opponent=e?.purpose==='jointWar'?e.enemy:e?.target,capital=g.cities.find(c=>c.id===e?.capital);
    return e&&g.players[e.target]?.alive&&capital?.owner===e.target&&campaignFor(g,p.id,opponent)?.id===e.warId&&(e.purpose==='jointWar'?jointWarAllowed(g,p.id,e.target,e.enemy,e.warId):p.relations[e.target]?.status==='war');
  };
  let total=0;
  for(const offer of g.diplomacy?.proposals||[]){
    const u=envoys.get(offer.envoy);
    if(offer.from!==p.id||offer.status!=='pending'||offer.expiresAt<gameTime(g)||!u||counted.has(u.id)||u.envoy?.state!=='arrived'||u.envoy.target!==offer.to||u.tile!==g.cities.find(c=>c.id===u.envoy.capital)?.tile||!valid(u))continue;
    total+=quote(offer.terms);counted.add(u.id);
  }
  for(const u of envoys.values())if(valid(u)&&!counted.has(u.id)&&(u.envoy?.state==='travelling'||u.envoy?.state==='arrived'&&!u.envoy.proposal&&u.tile===g.cities.find(c=>c.id===u.envoy.capital)?.tile))total+=quote(u.envoy.terms);
  for(const {action:a}of g.realtime?.queues?.[p.id]||[]){
    if(!['sendEnvoy','peace'].includes(a.type))continue;
    const other=g.players[a.player],opponent=a.enemy??a.player,budget=envoyBudget(g,p.id,opponent);
    if(!other?.alive||!budget.remaining||budget.cooldown>0||p.relations[opponent]?.status!=='war'||a.enemy!==undefined&&!jointWarAllowed(g,p.id,a.player,a.enemy,budget.warId))continue;
    try{total+=10+quote(normalizeTerms(a.terms??(a.enemy===undefined?recommendedTerms(g,p,a.player):recommendedAidTerms(g,p))));}catch{}
  }
  return total;
}
function observationInternal(g,p,options){
  const visible=new Set(p.visible),known=new Set(p.explored);
  return {naturalWonders:naturalWonderView(g,p.id),climate:climateView(g,p.id),greatPeople:heritageView(g,p),congress:congressView(g,p.id),governors:governorView(g,p.id),cityStates:cityStatesView(g,p.id),espionage:espionageView(g,p.id),tourism:tourismView(g,p.id),court:courtView(g,p.id),diplomacy:publicDiplomacy(g,p.id),fortresses:fortressStatus(g,p),realtime:g.realtime?{time:g.realtime.time,period:g.realtime.period,nextEconomy:g.realtime.nextEconomy}:undefined,religions:religionView(g),religionIntelligence:religionIntelligence(g,p?.id??-1,{cityYields,empireYields,resources:playerResources,finance:militaryFinance}),protocol:VERSION,turn:g.turn,maxTurns:g.maxTurns,seed:g.seed,world:{width:g.map.width,height:g.map.height,wrapX:!!g.map.wrapX},player:{id:p.id,naturalDiscoveries:p.naturalDiscoveries,name:p.name,diplomaticFavor:p.diplomaticFavor,diplomaticFavorIncome:diplomaticFavorIncome(g,p,suzerain),diplomaticLedger:diplomaticLedger(g,p),aiAlgorithm:g.settings.aiAlgorithm,eraScore:eraScore(p),focus:p.focus,leaderKey:leaderFor(p).key,leaderRulesVersion:p.leaderRulesVersion,leaderAbility:p.leaderAbility,doctrine:p.doctrine||'balanced',strategy:p.strategy||'adaptive',plan:{...developmentPlan(g,p),campaign:campaignPosture(g,p,developmentPlan(g,p))},gold:p.gold,finance:militaryFinance(g,p),committedGold:committedUpgradeGold(g,p)+committedDiplomacyGold(g,p),faith:p.faith,techs:p.techs,civics:p.civics,research:p.research,researchProgress:p.researchProgress,civic:p.civic,civicProgress:p.civicProgress,government:p.government,policies:p.policies,politics:politicalStatus(g,p),resources:playerResources(g,p),villageResources:{...p.villageResources},pantheon:p.pantheon,beliefs:p.beliefs,religion:p.religion,religionParent:p.religionParent,affiliation:affiliationStatus(g,p),spaceStage:p.spaceStage,victory:victoryProgress(g,p),nuclearStockpile:nuclearStock(p),pendingNuclearCells:committedNuclearCells(g,p),committedNukes:(g.realtime?.queues?.[p.id]||[]).filter(q=>q.action.type==="nuke").length,tradeCapacity:tradeCapacity(g,p),tradeRoutes:g.routes.filter(r=>r.owner===p.id).length,yields:empireYields(g,p)},cities:ownedCities(g,p).map(c=>{const yields=cityYields(g,c);return {...c,growthStatus:cityGrowth(g,c,yields),loyaltyStatus:currentLoyaltyView(g,c,p.id),yields,productionBaseItem:baseItem(c.production?.item),productionMilitary:!!UNITS[c.production?.item]&&!UNITS[c.production.item].civilian,productionCapture:!!UNITS[c.production?.item]&&occupationUnit(c.production.item),productionDomain:UNITS[c.production?.item]?.domain||'land',productionSiege:!!UNITS[c.production?.item]?.siege};}),units:ownedUnits(g,p).map(u=>({...u,baseItem:baseItem(u.type),citySheltered:citySheltersUnit(g,u),garrisonThreat:citySheltersUnit(g,u)&&g.units.some(e=>e.owner!==u.owner&&p.visible.includes(e.tile)&&atWar(g,p.id,e.owner)&&!UNITS[e.type].civilian&&distance(g,tileOf(g,u),tileOf(g,e))<=3),...transportStatus(g,u),domain:UNITS[u.type].domain||'land',ranged:unitHasRanged(p,u.type)&&!unitTransport(u,tileOf(g,u)),movementAllowance:movementAllowance(g,u),siege:!!UNITS[u.type].siege,siegeTier:UNITS[u.type].siegeTier||0,range:unitTransport(u,tileOf(g,u))?1:attackRange(g,u),maxHp:maxUnitHp(u.type),canCapture:occupationUnit(u.type)&&!unitTransport(u,tileOf(g,u)),fleet:fleetStatus(g,u,p.id),deck:UNITS[u.type].airCapacity?deckAircraft(g,u).map(v=>v.id):undefined,strength:unitStrength(g,u)})),tiles:g.map.tiles.filter(t=>known.has(t.id)).map(real=>{const t=rememberedTile(p,real),projected={...publicEncounterTile(t),...naturalTileProjection(g,p,t),weather:visible.has(t.id)?climateTileState(g,real):undefined};return {...projected,resource:resourceRevealed(t.resource,p)?t.resource:null,visible:visible.has(t.id),yields:tileYield(projected,p)};}),opponents:g.players.filter(o=>p.met.includes(o.id)).map(o=>({id:o.id,name:o.name,alive:o.alive,score:score(g,o),victory:victoryProgress(g,o),eraScore:eraScore(o),era:civilizationEra(o),relation:p.relations[o.id],cities:g.cities.filter(c=>c.owner===o.id&&visible.has(c.tile)).map(c=>({id:c.id,name:c.name,tile:c.tile,population:c.population,hp:c.hp,walls:c.walls,wallLevel:WALL_TIERS.indexOf(cityWallTier(c)),wallMax:wallCapacity(c)}))})),rememberedCities:Object.values(p.knownCities||{}).map(c=>({...c,...(p.cityAppearances?.[c.id]?{appearance:{...p.cityAppearances[c.id]}}:{})})),enemies:g.units.filter(u=>u.owner!==p.id&&visible.has(u.tile)&&unitDetected(g,u,p.id)).map(u=>({...projectUnit(g,u,p.id),...transportStatus(g,u),strength:unitCombatProfile(g,u,true,null,{viewer:p.id}).strength})),legalActions:legalActions(g,p,options),memory:p.memory};
}
function relationViews(g,p){const context=geopoliticalContext(g,p,{cached:true});return Object.fromEntries(Object.entries(p.relations).map(([id,r])=>[id,p.met.includes(+id)&&g.players[id]?.alive?{...r,bordersClosed:g.players[id].civics.includes('empire'),...diplomaticSummary(g,p,g.players[id],context)}:{...r}]));}
function publicCapital(g,viewer,other){
  const known=viewer&&viewer.id!==other.id?(Object.values(viewer.knownCities||{}).find(c=>c.owner===other.id&&c.isCapital)||viewer.knownCities?.[other.capital]):g.cities.find(c=>c.id===other.capital);
  return known?{tile:known.tile,name:known.name,owner:known.owner}:null;
}
function visibleDistrict(g,district){return district?{...district,stage:districtStage(district.item,g.cities.find(c=>c.id===district.city))}:district;}
// Only physical, visible building stages are public; costs and queues stay private.
function wonderConstructionTiles(g){
 const result=new Map();
 for(const c of g.cities){const work=c.production,t=work&&g.map.tiles[work.tile];if(!work||work.repair||!WONDERS[work.item]||g.wonders[work.item]||!t||t.owner!==c.owner||t.district)continue;
  result.set(t.id,{item:work.item,city:c.id,kind:'wonder',stage:work.progress/Math.max(1,work.cost)<.25?'started':'building'});
 }
 return result;
}
export function snapshot(g,view=-1,options={}){return evaluate(g,()=>snapshotInternal(g,view,options));}
function snapshotInternal(g,view=-1,{manualOptionsOnly=false,memo=null}={}){
  const M=(key,fn)=>{if(!memo)return fn();if(memo.has(key))return memo.get(key);const value=fn();memo.set(key,value);return value;};
  // Yield evaluation assigns worked tiles; capture both after evaluation, including on memo hits.
  const cityDetails=c=>M('city:'+c.id+':'+c.owner+':'+(c.production?.item??'')+':'+!!c.production?.funded,()=>{
    const yields=cityYields(g,c),worked=[...c.worked];
    return {yields,worked,growthStatus:cityGrowth(g,c,yields),options:manualOptionsOnly&&!g.players[c.owner].manual?[]:productionOptions(g,g.players[c.owner],c),purchases:manualOptionsOnly&&!g.players[c.owner].manual?[]:cityPurchases(g,g.players[c.owner],c),productionStatus:c.production?{cost:orderCost(g,c),rate:productionRate(g,c),funded:!!c.production.funded,turns:Math.ceil(Math.max(0,orderCost(g,c)-c.production.progress)/Math.max(.01,productionRate(g,c)))}:null};
  });
  const p=g.players[view],visible=p?new Set(p.visible):null,known=p?new Set(p.explored):null,constructions=wonderConstructionTiles(g);
  const resourceViewer=p||{techs:[...new Set(g.players.flatMap(player=>player.techs))]};
  const rememberedCities=p?Object.values(p.knownCities||{}).filter(c=>Number.isInteger(c.tile)&&g.map.tiles[c.tile]&&c.owner!==view&&!visible.has(c.tile)).map(c=>({id:c.id,name:c.name,owner:c.owner,tile:c.tile,isCapital:!!c.isCapital,remembered:true,...(p.cityAppearances?.[c.id]?{appearance:{...p.cityAppearances[c.id]}}:{})})):[];
  return {naturalWonders:naturalWonderView(g,view),climate:climateView(g,view),ages:agesView(g),greatPeople:p?heritageView(g,p,true):{catalogue:heritageView(g,g.players[0],true).catalogue},rememberedCities,congress:congressView(g,view),governors:governorView(g,view),cityStates:cityStatesView(g,view),espionage:espionageView(g,view),tourism:tourismView(g,view),tradeRoutes:visibleTradeRoutes(g,view),court:courtView(g,view),diplomacy:publicDiplomacy(g,view),realtime:g.realtime?{version:1,time:g.realtime.time,period:g.realtime.period,nextEconomy:g.realtime.nextEconomy}:undefined,religions:religionView(g),religionIntelligence:religionIntelligence(g,p?.id??-1,{cityYields,empireYields,resources:playerResources,finance:militaryFinance}),visuals:visualSnapshot(g,view,visible),version:g.version,id:g.id,seed:g.seed,turn:g.turn,maxTurns:g.maxTurns,winner:g.winner,map:{roadRules:g.map.roadRules,width:g.map.width,height:g.map.height,type:g.map.type,riverVersion:g.map.riverVersion,wrapX:g.map.wrapX,tiles:g.map.tiles.map(t=>!p?{...publicEncounterTile(t),...naturalTileProjection(g,null,t),resource:resourceRevealed(t.resource,resourceViewer)?t.resource:null,weather:climateTileState(g,t),district:visibleDistrict(g,t.district),construction:constructions.get(t.id)}:!known.has(t.id)?{id:t.id,q:t.q,r:t.r,col:t.col,row:t.row,hidden:true}:((memory=>({...publicEncounterTile(memory),...naturalTileProjection(g,p,memory),weather:visible.has(t.id)?climateTileState(g,t):undefined,construction:visible.has(t.id)?constructions.get(t.id):undefined,district:visible.has(t.id)?visibleDistrict(g,memory.district):memory.district,resource:resourceRevealed(memory.resource,p)?memory.resource:null,visible:visible.has(t.id)}))(rememberedTile(p,t))))},players:g.players.map(o=>({id:o.id,name:o.name,short:o.short,leader:leaderFor(o).name,leaderKey:leaderFor(o).key,leaderRulesVersion:o.leaderRulesVersion,color:o.color,secondaryColor:o.secondaryColor||deriveSecondary(o.color),symbol:o.symbol,trait:o.trait,description:o.description,focus:o.focus,alive:o.alive,...(!p||o.id===view||p.met.includes(o.id)?{score:M('score:'+o.id,()=>score(g,o)),victory:M('victory:'+o.id,()=>victoryProgress(g,o)),eraScore:eraScore(o),era:civilizationEra(o),age:ageView(o,!p||o.id===view),capitalIntelligence:M('capital:'+o.id,()=>publicCapital(g,p,o))}:{}),...(!p||o.id===view?{fortresses:M('forts:'+o.id,()=>fortressStatus(g,o)),tradeCapacity:M('tradecap:'+o.id,()=>tradeCapacity(g,o)),warWeariness:o.warWeariness||0,envoyReadyAt:o.envoyReadyAt||0,greatPeople:heritageView(g,o),heritageEffects:o.heritageEffects,diplomaticFavor:o.diplomaticFavor,diplomaticFavorIncome:diplomaticFavorIncome(g,o,suzerain),diplomaticLedger:diplomaticLedger(g,o),leaderAbility:o.leaderAbility,doctrineReadyAt:o.doctrineReadyAt||0,doctrine:o.doctrine||'balanced',strategy:o.strategy||'adaptive',plan:M('plan:'+o.id,()=>({...developmentPlan(g,o),campaign:campaignPosture(g,o,developmentPlan(g,o))})),naturalDiscoveries:o.naturalDiscoveries,gold:o.gold,finance:M('finance:'+o.id,()=>militaryFinance(g,o)),spaceStage:o.spaceStage,spaceLaunchDone:o.spaceLaunchDone,nuclearStockpile:nuclearStock(o),faith:o.faith,techs:o.techs,civics:o.civics,research:o.research,researchProgress:o.researchProgress,civic:o.civic,civicProgress:o.civicProgress,scienceBank:(o.scienceBank||0)+(o.heritageScienceReserve||0),cultureBank:(o.cultureBank||0)+(o.heritageCultureReserve||0),boosts:o.boosts,inspirations:o.inspirations,government:o.government,policies:o.policies,politics:M('politics:'+o.id,()=>politicalStatus(g,o)),met:o.met,relations:M('relations:'+o.id,()=>relationViews(g,o)),pantheon:o.pantheon,beliefs:o.beliefs,religion:o.religion,religionParent:o.religionParent,affiliation:affiliationStatus(g,o),yields:M('yields:'+o.id,()=>empireYields(g,o)),resources:M('resources:'+o.id,()=>playerResources(g,o)),...(o.intel?{intel:intelView(g,o)}:{})}:{}),driver:o.driver,manual:o.manual,...(p&&o.id!==view&&o.attitudes?.[view]?{attitudeToward:attitudeView(g,o,view)}:{}),explored:p&&o.id!==view?undefined:o.explored,visible:p&&o.id!==view?undefined:o.visible})),cities:g.cities.filter(c=>!p||c.owner===view||visible.has(c.tile)).map(c=>({...c,specialistSlots:!p||c.owner===view?specialistSlots(g,c):undefined,loyaltyStatus:M('loyalty:'+c.id+':'+c.owner,()=>currentLoyaltyView(g,c,view)),fortressRecruitment:!p||c.owner===view?M('recruit:'+c.id+':'+c.owner,()=>fortressRecruitment(g,c)):[],visualEra:civilizationEra(g.players[c.owner]),wallLevel:Math.max(0,WALL_TIERS.indexOf(cityWallTier(c))),wallMax:wallCapacity(c),...(!p||c.owner===view?cityDetails(c):{production:null,heritageEffects:undefined,buildings:[],districts:[],worked:[],food:null,culture:null,activity:null})})),units:g.units.filter(u=>!p||u.owner===view||visible.has(u.tile)&&unitDetected(g,u,p.id)).map(u=>({...projectUnit(g,u,view),ranged:unitHasRanged(g.players[u.owner],u.type),...transportStatus(g,u),receivingTreatment:view<0||u.owner===view?receivingTreatment(g,u):undefined,...(view<0||u.owner===view?{upgradeOptions:unitUpgradeOptions(g,g.players[u.owner],u)}:{}),maxHp:maxUnitHp(u.type),movementAllowance:u.owner===view||view<0?movementAllowance(g,u):undefined,range:fleetRange(g,u,view<0?null:view),fleet:fleetStatus(g,u,view<0?null:view),deck:UNITS[u.type].airCapacity?(view<0||u.owner===view?deckAircraft(g,u).map(v=>v.id):undefined):undefined,strength:unitCombatProfile(g,u,false,null,{viewer:view<0?null:view}).strength})),routes:g.routes.filter(r=>!p||r.owner===view),wonders:!p?g.wonders:Object.fromEntries(Object.entries(g.wonders).filter(([key,w])=>visible.has(w.tile)||known.has(w.tile)&&rememberedTile(p,g.map.tiles[w.tile]).district?.item===key).map(([key,w])=>[key,visible.has(w.tile)?{...w,owner:g.cities.find(c=>c.id===w.city)?.owner??w.owner}:{...w,owner:rememberedTile(p,g.map.tiles[w.tile]).owner}])),events:g.events.filter(e=>!p||e.player===view||e.player===null||e.tile!==null&&visible.has(e.tile)).slice(0,80),history:p?g.history.map(h=>({turn:h.turn,players:h.players.filter(o=>o.id===view)})):g.history,settings:g.settings,lastActions:!p?g.lastActions:g.lastActions.filter(a=>a.player===view)};
}
export function serialize(g){const {index,...map}=g.map;return JSON.stringify({...g,map,cities:g.cities.map(c=>{if(!Object.hasOwn(c,'loyaltyStatus'))return c;const {loyaltyStatus,...rest}=c;return rest;})});}
export function serializeLegacy(g){const {index,...map}=g.map;return JSON.stringify({...g,map},(key,value)=>key==='loyaltyStatus'?undefined:value);}
export function restore(text){
  const g=JSON.parse(text);if(g.version!==VERSION||!Array.isArray(g.players)||!g.players.length||g.players.length>MAX_CIVILIZATIONS||!Array.isArray(g.map?.tiles)||g.map.tiles.length>12000||!Array.isArray(g.units)||!Array.isArray(g.cities)||!Number.isFinite(g.turn))throw new Error('存档格式不受支持。');
  if(!Number.isInteger(g.map.width)||!Number.isInteger(g.map.height)||g.map.width<1||g.map.width>150||g.map.height<1||g.map.height>100||g.map.width*g.map.height!==g.map.tiles.length)throw new Error('存档地图大小无效。');
  if(!g.history||!Array.isArray(g.history)||!Array.isArray(g.events)||!g.settings||!Number.isFinite(g.rngState)||g.units.length>2000||g.cities.length>320)throw new Error('存档缺少必要字段。');
  for(const [key,table]of [['rainfall',WORLD_RAINFALL],['resourceAbundance',RESOURCE_ABUNDANCE]])if(g.settings[key]!==undefined&&(typeof g.settings[key]!=='string'||!Object.hasOwn(table,g.settings[key])))throw Error('Invalid saved world generation setting: '+key);
  if(g.settings.barbarians!==undefined&&typeof g.settings.barbarians!=='boolean')throw Error('Invalid saved barbarian setting.');
  if(g.settings.leaderRulesVersion!==undefined&&![1,2].includes(g.settings.leaderRulesVersion))throw Error('Invalid leader rules version.');g.settings.leaderRulesVersion??=1;
  reconcileHeritagePolicies(g);validatePolitics(g);validateCongress(g);validateCityAppearances(g);
  validateDecks(g);validateClimate(g);
  const validTile=id=>Number.isInteger(id)&&id>=0&&id<g.map.tiles.length;
  for(const u of g.units)if(['zocUntil','revealedUntil'].some(k=>u[k]!==undefined&&(!Number.isFinite(u[k])||u[k]<0||u[k]>gameTime(g)+20.1)))throw Error('Invalid tactical movement expiry.');
  const validCaptureOwner=id=>Number.isInteger(id)&&(id===-1||id>=0&&!!g.players[id]||id<=-2&&g.cityStates?.states.some(s=>cityStateOwner(s.id)===id));
  for(const u of g.units)if(u.capturedFrom!==undefined&&(!validCaptureOwner(u.capturedFrom)||!Number.isInteger(u.captureTurn)||u.captureTurn<1||u.captureTurn>g.turn))throw Error('Invalid civilian capture record.');
  for(const u of g.units)if(u.stance!==undefined&&u.stance!=='alert')throw Error('Invalid unit stance.');
  for(const u of g.units)if(u.moveOrder&&(!g.settings||g.settings.playMode!=='turns'||!validTile(u.moveOrder.destination)||!Number.isInteger(u.moveOrder.issuedTurn)||u.moveOrder.issuedTurn<1||u.moveOrder.issuedTurn>g.turn))throw Error('Invalid saved movement order.');
  for(const u of g.units)if(u.innateTraits!==undefined&&(!Array.isArray(u.innateTraits)||u.innateTraits.length>2||new Set(u.innateTraits).size!==u.innateTraits.length||u.innateTraits.some(k=>!['assault','terrain'].includes(k))))throw Error('Invalid innate veteran traits.');
  for(const u of g.units)if(u.trainedTrait!==undefined&&u.trainedTrait!=='terrain')throw Error('Invalid granted veteran trait.');
  for(const u of g.units)if(u.movementBonus!==undefined&&(!Number.isInteger(u.movementBonus)||u.movementBonus<0||u.movementBonus>1))throw Error('Invalid trained movement bonus.');
  for(const u of g.units)if(u.mutiny!==undefined&&(u.mutiny!==true||u.owner!==-1||UNITS[u.type]?.civilian||(UNITS[u.type]?.domain||'land')!=='land'||UNITS[u.type]?.ranged))throw Error('Invalid military mutiny.');
  // Returning a levied army preserves earned traits; training permission is not a save invariant.
  for(const u of g.units)if(u.veteranTraits!==undefined&&(!Array.isArray(u.veteranTraits)||new Set(u.veteranTraits).size!==u.veteranTraits.length||u.veteranTraits.length>veteranCapacity(u.owner<0?{...u,owner:0}:u)||u.veteranTraits.some(key=>!Object.hasOwn(VETERAN_TRAITS,key)||key==='terrain'&&['sea','air'].includes(UNITS[u.type]?.domain))))throw Error('Invalid veteran training.');
  if(g.map.tiles.some((t,i)=>t.id!==i||!Number.isFinite(t.q)||!Number.isFinite(t.r))||g.players.some((p,i)=>p.id!==i||!Array.isArray(p.techs)||!Array.isArray(p.civics)||!Array.isArray(p.policies)||!p.driver)||g.units.some(u=>!UNITS[u.type]||!validTile(u.tile)||!Number.isFinite(u.hp))||g.cities.some(c=>!validTile(c.tile)||!g.players[c.owner]||!Array.isArray(c.buildings)||!Array.isArray(c.districts)))throw new Error('存档实体数据无效。');
  for(const c of g.cities){if(c.production){c.production.cost??=productionCost(g,c.production.item);if(c.production.fortress!==undefined&&(!validTile(c.production.fortress)||!UNITS[c.production.item]||UNITS[c.production.item].civilian||(UNITS[c.production.item].domain||'land')!=='land'))throw Error('Invalid fortress recruitment order.');if(!Number.isFinite(c.production.progress)||c.production.progress<0)throw Error('Invalid production progress.');if(!Number.isFinite(c.production.cost)||c.production.cost<=0||c.production.cost>1e7)throw Error('Invalid locked production cost.');}}
  for(const c of g.cities)if(c.capturePending&&((c.capturePending.previousOwner===null?!(c.cityStateOrigin===c.capturePending.previousState&&g.cityStates?.states.some(s=>s.id===c.cityStateOrigin&&s.capturedBy===c.owner)):!g.players[c.capturePending.previousOwner])||!Number.isInteger(c.capturePending.turn)||c.capturePending.turn<1||c.capturePending.turn>g.turn||c.capturePending.previousOwner===c.owner))throw Error('Invalid city capture decision.');
  for(const c of g.cities)if(!Number.isFinite(c.loyalty)||c.loyalty<0||c.loyalty>100||!Number.isInteger(c.population)||c.population<1||!Number.isFinite(c.hp)||c.hp<0||c.hp>CITY_MAX_HP||!Number.isFinite(c.walls)||c.walls<0||c.lastAttackedAt!==undefined&&(!Number.isFinite(c.lastAttackedAt)||c.lastAttackedAt<0))throw Error('Invalid city population or defense state.');
  for(const unit of g.units){if(unit.airPatrolCity!==undefined&&(!Number.isInteger(unit.airPatrolCity)||!UNITS[unit.type].airOnly||UNITS[unit.type].domain!=='air'))throw Error('Invalid air patrol.');if(unit.type==='drone')unit.hp=Math.min(maxUnitHp(unit.type),unit.hp);}
  for(const p of g.players){
    if(p.uniqueTradeBonus!==undefined&&(!Number.isInteger(p.uniqueTradeBonus)||p.uniqueTradeBonus<0||p.uniqueTradeBonus>1))throw Error('Invalid unique trade capacity.');
    if(p.militaryArrears!==undefined&&(!Number.isFinite(p.militaryArrears)||p.militaryArrears<0)||p.unpaidPeriods!==undefined&&(!Number.isSafeInteger(p.unpaidPeriods)||p.unpaidPeriods<0))throw Error('Invalid military pay state.');
    if(p.nuclearStockpile!==undefined&&(!Number.isInteger(p.nuclearStockpile)||p.nuclearStockpile<0||p.nuclearStockpile>3))throw Error('Invalid nuclear stockpile.');
    if(p.spaceLaunchDone!==undefined&&typeof p.spaceLaunchDone!=='boolean'||p.contacts!==undefined&&(typeof p.contacts!=='object'||Array.isArray(p.contacts)||p.contacts===null||Object.entries(p.contacts).some(([id,t])=>!g.players[id]||+id===p.id||!Number.isInteger(t)||t<1||t>g.turn)))throw Error('Invalid public intelligence or space launch state.');
    if(p.leaderRulesVersion!==undefined&&p.leaderRulesVersion!==g.settings.leaderRulesVersion)throw Error('Mismatched player leader rules version.');p.leaderRulesVersion=g.settings.leaderRulesVersion;
    if(!/^#[0-9a-f]{6}$/i.test(p.secondaryColor||''))p.secondaryColor=deriveSecondary(p.color);
    migrateController(p);migrateAiState(p);initializePolitics(g,p);p.leaderKey??=LEGACY_LEADERS[p.id%8].key;Object.assign(p,historicalIdentity(p.leaderKey,traditionIndex(p)));if(uniqueEnabled(p))p.description=CIVS[traditionIndex(p)].description.replace('战斗力 +4','战斗力 +2').replace('军事单位生产 +20%','军事单位生产 +10%');p.strategy??='adaptive';p.doctrine??='balanced';p.planRevision??=0;
    if((!LEADERS.some(l=>l.key===p.leaderKey)&&p.leaderKey!==LEGACY_LEADERS[p.id%8].key)||!Object.hasOwn(NATIONAL_POLICIES,p.doctrine)||!Object.hasOwn(NATIONAL_STRATEGIES,p.strategy)||!Number.isInteger(p.planRevision)||p.planRevision<0)throw new Error('Invalid national strategy or leader.');
    if(p.leaderAbility&&(['activeUntil','readyAt'].some(k=>!Number.isFinite(p.leaderAbility[k])||p.leaderAbility[k]<0)||p.leaderAbility.readyAt<p.leaderAbility.activeUntil))throw new Error('Invalid leader cooldown.');
    if(p.doctrineReadyAt!==undefined&&(!Number.isFinite(p.doctrineReadyAt)||p.doctrineReadyAt<0))throw new Error('Invalid national policy cooldown.');
  }
  if(new Set(g.players.map(p=>p.leaderKey)).size!==g.players.length)throw new Error('Duplicate leader identities.');
  g.settings.aiAlgorithm=normalizeAiAlgorithm(g.settings.aiAlgorithm);
  if(g.settings.autosaveEnabled!==undefined&&typeof g.settings.autosaveEnabled!=='boolean'||g.settings.autosaveEvery!==undefined&&![3,5,10].includes(g.settings.autosaveEvery))throw new Error('Invalid autosave settings.');
  for(const u of g.units)if(u.linkedUnit!==undefined&&(!Number.isInteger(u.linkedUnit)||!linkedPartner(g,u)||u.id===u.linkedUnit||!!UNITS[u.type].civilian===!!UNITS[linkedPartner(g,u).type].civilian||[u,linkedPartner(g,u)].some(v=>['sea','air'].includes(UNITS[v.type].domain)||v.type==='envoy')))throw Error('Invalid linked formation.');
  initializeCongress(g);if(g.map.wrapX===undefined)g.map.wrapX=true;if(typeof g.map.wrapX!=='boolean')throw new Error('Invalid world topology.');indexMap(g.map);validateNaturalWonders(g);if(!g.naturalWonders)initializeNaturalWonders(g,{legacy:true});if((g.settings.balanceVersion||0)<2){const previous={standard:500,epic:750,marathon:1500}[g.settings.gameSpeed];if(previous===g.maxTurns)g.maxTurns=GAME_SPEEDS[g.settings.gameSpeed].maxTurns;}g.settings.balanceVersion=2;initializeTerritories(g);initializeReligion(g);for(const p of g.players)p.spaceLaunchDone??=p.spaceStage>0;initializeWarfare(g);initializeCourt(g);for(const u of g.units){const t=g.map.tiles[u.tile];if(Number.isInteger(t.owner)&&t.owner>=0&&t.owner!==u.owner&&!canEnterTerritory(g,u,t))u.borderExitOwner=t.owner;}if(!g.map.roadRules){for(const c of g.cities)for(const d of c.districts)connectRoad(g,c.tile,d.tile,c.owner);for(const r of g.routes){const a=g.cities.find(c=>c.id===r.from),b=g.cities.find(c=>c.id===r.to);if(a&&b)connectRoad(g,a.tile,b.tile,r.owner);}g.map.roadRules=1;}validateHeritage(g);normalizeWonderState(g);validateAges(g);validateEncounters(g);initializeGovernors(g);initializeTourism(g);initializeEspionage(g);initializeCityStates(g,{seed:true});initializeEncounters(g,{populate:true});repairCongressContacts(g);initializeVictoryRules(g);initializeClimate(g);refreshVisibility(g);return g;
}
