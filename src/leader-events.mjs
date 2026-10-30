// Bounded event hooks. They never reset movement, actions, cooldowns or identities.
import {UNITS,BUILDINGS,PRODUCTION,RESOURCES,dist,leaderFor,civilizationEra,nationalEffects} from './rules.mjs';
import {baseItem,hasBuilding,uniqueEnabled,buildingOperational} from './unique-content.mjs';
import {neighbors} from './world.mjs';
const time=g=>g.realtime?.time??g.turn*20;
const distance=(g,a,b)=>dist(g.map.tiles[a],g.map.tiles[b],g.map);
export function operationalBuilding(g,c,key){
 return buildingOperational(g,c,key,BUILDINGS);
}
export function activeUniqueBuildings(g,c){return c.buildings.filter(k=>BUILDINGS[k]?.leader&&operationalBuilding(g,c,k)).map(k=>BUILDINGS[k]);}
export function uniqueCityBonuses(g,p,c,adjacency){
 if(!uniqueEnabled(p)&&!c.buildings.some(k=>BUILDINGS[k]?.leader))return {flat:{},amenities:0};
 const flat={},add=(key,n)=>flat[key]=(flat[key]||0)+n,t=g.map.tiles[c.tile],specs=activeUniqueBuildings(g,c);
 const routes=g.routes.filter(r=>r.owner===p.id&&r.from===c.id&&g.cities.some(o=>o.id===r.to&&o.owner!==p.id)).slice(0,4);
 const needsPlots=specs.some(s=>s.resourceGold||s.luxuryWonderYields||s.luxuryGold);
 const plots=needsPlots?g.map.tiles.filter(n=>n.owner===p.id&&n.territoryCity===c.id&&!n.pillaged):[];
 let amenities=0;
 for(const spec of specs){
  if(spec.flightTourism&&p.techs.includes('flight'))add('tourism',spec.flightTourism);
  if(spec.fortYields){const n=(c.worked||[]).filter(id=>g.map.tiles[id].fort?.owner===p.id&&g.map.tiles[id].fort.hp>0&&!g.map.tiles[id].pillaged).length;for(const [k,value]of Object.entries(spec.fortYields))add(k,n*value);}
  if(spec.gardenAdjacency){const d=c.districts.find(d=>d.item===Object.keys(BUILDINGS).find(k=>BUILDINGS[k]===spec));if(d&&neighbors(g.map,g.map.tiles[d.tile]).some(t=>['commercial','theater'].includes(baseItem(t.district?.item))&&t.owner===p.id&&!t.pillaged)){add('gold',spec.gardenAdjacency);add('culture',spec.gardenAdjacency);}}
  if(spec.resourceGold)add('gold',Math.min(3,plots.filter(n=>n.improvement==='mine'||n.improvement&&RESOURCES[n.resource]?.category==='strategic').length)*spec.resourceGold);
  if(spec.diplomaticYields){const n=Math.min(3,p.met.filter(id=>p.relations[id]?.status==='alliance'||p.relations[id]?.openBorders).length);add('science',n*spec.diplomaticYields);add('culture',n*spec.diplomaticYields);}
  if(spec.districtYields){const n=c.districts.filter(d=>['campus','holy','industrial','commercial','theater'].includes(baseItem(d.item))&&!g.map.tiles[d.tile].pillaged).length;add('culture',n*spec.districtYields);add('production',n*spec.districtYields);}
  for(const [district,key,scale]of [['campus','culture',spec.campusCulture],['holy','science',spec.holyScience]])if(scale){const d=c.districts.find(d=>baseItem(d.item)===district&&!g.map.tiles[d.tile].pillaged);if(d)add(key,adjacency(g,p,g.map.tiles[d.tile],district)*scale);}
  if(spec.foreignRouteScience)add('science',routes.length*spec.foreignRouteScience);
  if(spec.foreignRouteCulture)add('culture',routes.length*spec.foreignRouteCulture);
  if(spec.hillCulture&&c.districts.some(d=>baseItem(d.item)==='theater'&&!g.map.tiles[d.tile].pillaged&&(g.map.tiles[d.tile].hill||distance(g,d.tile,c.tile)===1))){add('culture',spec.hillCulture);add('gold',spec.hillGold||0);}
  if(spec.holyOrRiverScience&&(t.river||neighbors(g.map,t).some(n=>n.owner===p.id&&!n.pillaged&&baseItem(n.district?.item)==='holy')))add('science',spec.holyOrRiverScience);
  if(spec.luxuryWonderYields&&(Object.values(g.wonders).some(w=>w.city===c.id)||plots.some(n=>n.improvement&&RESOURCES[n.resource]?.category==='luxury'))){add('production',spec.luxuryWonderYields);add('tourism',spec.luxuryWonderYields);}
  if(spec.riverYields&&t.river)for(const [k,n]of Object.entries(spec.riverYields))add(k,n);
  if(spec.luxuryGold)add('gold',plots.filter(n=>n.improvement&&RESOURCES[n.resource]?.category==='luxury').length*spec.luxuryGold);
  amenities+=(spec.amenities||0)+(spec.populationAmenities&&c.population>=spec.populationAmenities?1:0);
 }
 const garrison=g.units.filter(u=>u.owner===p.id&&u.hp>0&&u.tile===c.tile);
 add('culture',Math.max(0,...garrison.map(u=>UNITS[u.type].garrisonCulture||0)));
 const ships=neighbors(g.map,t).some(n=>['coast','ocean'].includes(n.terrain))?g.units.filter(u=>u.owner===p.id&&u.hp>0&&UNITS[u.type].nearbyCulture&&distance(g,u.tile,c.tile)<=2):[];add('culture',Math.min(2,ships.length));
 return {flat,amenities};
}
export function healEligible(g,p,u,instant){
 const s=UNITS[u.type];if(u.owner!==p.id||u.hp<=0||['coast','ocean'].includes(g.map.tiles[u.tile].terrain)&&s.domain!=='sea')return false;
 if(instant.homeOnly&&g.map.tiles[u.tile].owner!==p.id)return false;
 if(instant.unitClass==='cavalry')return s.class==='cavalry';
 if(instant.unitClass==='cavalryOrMedical')return s.class==='cavalry'||!!s.medical;
 return !s.civilian;
}
export function leaderInstant(g,p,instant,yields,orderCost){
 if(!instant)return;
 if(instant.heal)for(const u of g.units)if(healEligible(g,p,u,instant))u.hp=Math.min(UNITS[u.type].maxHp||100,u.hp+instant.heal);
 for(const c of g.cities.filter(c=>c.owner===p.id)){
  if(instant.loyalty&&(!instant.occupationRelief||c.occupation>0))c.loyalty=Math.min(100,c.loyalty+instant.loyalty);
  if(instant.occupationRelief&&c.occupation>0)c.occupation=Math.max(0,c.occupation-instant.occupationRelief);
  if(instant.wonderAndWallProgressCycles&&c.production&&(PRODUCTION[c.production.item]?.kind==='wonder'||['walls','medievalwalls','renaissancewalls','steelwalls'].includes(baseItem(c.production.item))))c.production.progress=Math.min(orderCost(g,c),c.production.progress+yields(g,c).production*instant.wonderAndWallProgressCycles);
 }
 if(instant.scienceBurst)p.scienceBank=(p.scienceBank||0)+instant.scienceBurst*(1+civilizationEra(p)*.5);
 if(instant.tourismPerTheater)p.tourism+=g.cities.filter(c=>c.owner===p.id&&operationalBuilding(g,c,'theater')).length*instant.tourismPerTheater;
}
export function productionCompleted(g,p,c,item){
 const spec=PRODUCTION[item],effects=nationalEffects(p,time(g)),buildings=activeUniqueBuildings(g,c);
 if(UNITS[item]&&!spec.civilian){const refund=Math.max(0,...buildings.map(b=>b.militaryScienceRefund||0));p.scienceBank=(p.scienceBank||0)+(spec.cost||0)*refund;}
 if(spec.kind==='project'&&!spec.stage){p.gold+=buildings.reduce((n,b)=>n+(b.projectGold||0),0);p.cultureBank=(p.cultureBank||0)+buildings.reduce((n,b)=>n+(b.projectCulture||0),0);}
 if(effects.wonderCultureRefund&&['wonder','district'].includes(spec.kind))p.cultureBank=(p.cultureBank||0)+spec.cost*effects.wonderCultureRefund;
 if(spec.firstTradeCapacity)p.uniqueTradeBonus=Math.max(p.uniqueTradeBonus||0,1);
}
export function unitProduced(g,p,c,u){
 const spec=UNITS[u.type],buildings=activeUniqueBuildings(g,c);
 const experience=buildings.reduce((n,b)=>n+(spec.class==='cavalry'?b.cavalryExperience||0:spec.domain==='sea'?b.navalExperience||0:0),0);
 u.xp+=experience;u.level=Math.max(u.level||0,Math.floor(u.xp/25));
 if(spec.class==='cavalry'&&buildings.some(b=>b.cavalryMove))u.movementBonus=1;
 if(spec.domain==='sea'&&buildings.some(b=>b.navalMove))u.movementBonus=1;
 if((spec.domain||'land')==='land'&&!spec.civilian)for(const b of buildings)if(b.trainedTrait){u.trainedTrait=b.trainedTrait;u.veteranTraits??=[];if(!u.veteranTraits.includes(b.trainedTrait))u.veteranTraits.push(b.trainedTrait);}
}
export function conquestEffects(g,p,c){
 const n=leaderFor(p).passive?.effects?.captureHeal||0;
 if(n)for(const u of g.units)if(healEligible(g,p,u,{unitClass:'military'})&&distance(g,u.tile,c.tile)<=3)u.hp=Math.min(UNITS[u.type].maxHp||100,u.hp+n);
 for(const city of g.cities.filter(city=>city.owner===p.id&&city.production)){const progress=activeUniqueBuildings(g,city).reduce((n,b)=>n+(b.captureProgress||0),0);city.production.progress+=progress;}
}
export function killEffects(g,p,u,enemy){
 const effects=nationalEffects(p,time(g)),s=UNITS[u.type],victim=UNITS[enemy.type];
 const scale=uniqueEnabled(p)?1+civilizationEra(p)*.5:1;
 // Keep the accepted Sea Dog reward prohibition, including leader-wide bounties.
 const goldEligible=p.leaderKey!=='elizabeth'||!uniqueEnabled(p)||s.domain==='sea'&&u.type!=='sea_dog';
 p.gold+=(goldEligible?effects.killGold||0:0)*scale;p.scienceBank=(p.scienceBank||0)+(effects.killScience||0)*scale;
 if(s.homeKillGold&&g.map.tiles[u.tile].owner===p.id)p.gold+=Math.min(60,victim.strength||0);
 if(s.killStrengthGold&&!victim.civilian)p.gold+=victim.strength||0;
 if(s.nearbyKillHeal&&healEligible(g,p,u,{unitClass:'military'}))for(const friend of g.units)if(healEligible(g,p,friend,{unitClass:'military'})&&(UNITS[friend.type].domain||'land')==='land'&&distance(g,friend.tile,u.tile)<=1)friend.hp=Math.min(UNITS[friend.type].maxHp||100,friend.hp+s.nearbyKillHeal);
}
export function uniquePeriod(g,p){
 const troops=g.units.filter(u=>u.owner===p.id&&u.hp>0),sources=troops.filter(u=>UNITS[u.type].nearbyPeriodHeal&&!['coast','ocean'].includes(g.map.tiles[u.tile].terrain));
 for(const u of troops){const s=UNITS[u.type];if(s.civilian||['coast','ocean'].includes(g.map.tiles[u.tile].terrain)&&s.domain!=='sea')continue;const nearby=Math.max(0,...sources.filter(o=>o.id!==u.id&&distance(g,o.tile,u.tile)<=1).map(o=>UNITS[o.type].nearbyPeriodHeal));u.hp=Math.min(s.maxHp||100,u.hp+(s.periodHeal||0)+nearby);}
}
export function uniqueCombatBonus(g,u,defending,opponent,viewer,ranged){
 const s=UNITS[u.type],p=g.players[u.owner],t=g.map.tiles[u.tile];if(!p||s.civilian||!uniqueEnabled(p)&&!s.leader)return 0;
 const privateContext=viewer===null||viewer===u.owner,cityKnown=c=>privateContext||g.players[viewer]?.visible.includes(c.tile);
 const seen=v=>viewer===null||g.players[viewer]?.visible.includes(v.tile);
 const friend=v=>v.owner===u.owner&&v.id!==u.id&&v.hp>0&&!UNITS[v.type].civilian&&seen(v);
 let n=0;
 if(!defending&&s.foreignAssault&&t.owner!==p.id)n+=s.foreignAssault;
 if(s.coastalCombat&&t.terrain==='coast')n+=s.coastalCombat;
 if(defending&&s.homeDefense&&t.owner===p.id)n+=s.homeDefense;
 if(!defending&&ranged&&s.homeOrHillRanged&&UNITS[opponent?.type]&&(UNITS[opponent.type].domain||'land')==='land'&&(t.owner===p.id||t.hill))n+=s.homeOrHillRanged;
 if(ranged&&s.hillRanged&&t.hill)n+=s.hillRanged;
 if(!defending&&s.roadOrOpenAssault&&(t.road&&!t.roadPillaged||!t.hill&&!t.feature))n+=s.roadOrOpenAssault;
 if(s.borderCombat&&(t.owner===p.id||neighbors(g.map,t).some(n=>n.owner===p.id)))n+=s.borderCombat;
 const infantry=v=>(UNITS[v.type].domain||'land')==='land'&&!UNITS[v.type].ranged&&!UNITS[v.type].siege&&UNITS[v.type].class!=='cavalry'&&baseItem(v.type)!=='scout';
 if(!defending){let cohesion=0;if(s.cohesion&&(!s.cohesionRanged||ranged)&&g.units.some(v=>friend(v)&&distance(g,u.tile,v.tile)===1&&infantry(v)))cohesion=s.cohesion;if(infantry(u))cohesion=Math.max(cohesion,...g.units.filter(v=>friend(v)&&UNITS[v.type].cohesionBoth&&distance(g,u.tile,v.tile)===1).map(v=>UNITS[v.type].cohesion||0));n+=cohesion;}
 if(defending&&s.capitalGuard&&g.cities.some(c=>c.owner===p.id&&cityKnown(c)&&(c.isCapital||Object.values(g.wonders).some(w=>w.city===c.id&&(privateContext||g.players[viewer]?.visible.includes(w.tile))))&&distance(g,u.tile,c.tile)<=3))n+=s.capitalGuard;
 if(s.scholarGuard&&g.cities.some(c=>c.owner===p.id&&cityKnown(c)&&(privateContext?(hasBuilding(c,'campus')||hasBuilding(c,'holy')):c.districts.some(d=>g.players[viewer]?.visible.includes(d.tile)&&['campus','holy'].includes(baseItem(d.item))))&&distance(g,u.tile,c.tile)<=3))n+=s.scholarGuard;
 if(defending&&s.religiousDefense&&(t.owner===p.id||g.cities.some(c=>cityKnown(c)&&c.religion===p.id&&distance(g,u.tile,c.tile)<=3)))n+=s.religiousDefense;
 if(s.siegeSupport&&g.units.some(v=>friend(v)&&UNITS[v.type].siege&&distance(g,u.tile,v.tile)<=2))n+=s.siegeSupport;
 if(s.enemyCityCombat&&g.cities.some(c=>p.relations[c.owner]?.status==='war'&&(viewer===null||(privateContext?p.visible.includes(c.tile)||p.knownCities[c.id]?.owner===c.owner:cityKnown(c)))&&distance(g,u.tile,c.tile)<=2))n+=s.enemyCityCombat;
 if(defending&&(s.domain==='sea'||['coast','ocean'].includes(t.terrain)))n+=Math.max(0,...g.units.filter(v=>UNITS[v.type].navalSupport&&friend(v)&&distance(g,u.tile,v.tile)<=1).map(v=>UNITS[v.type].navalSupport||0));
 if((s.domain||'land')==='land')n-=Math.max(0,...g.units.filter(v=>UNITS[v.type].enemyAura&&v.hp>0&&v.owner!==u.owner&&p.relations[v.owner]?.status==='war'&&seen(v)&&distance(g,u.tile,v.tile)<=1).map(v=>UNITS[v.type].enemyAura||0));
 return n;
}
