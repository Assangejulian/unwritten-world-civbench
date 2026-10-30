// Replacement metadata is shared by rules, native observations and artwork.
// Base keys remain stable; eligibility and successor routing are owner-specific.
export const UNIQUE_UNITS={
 qin_crossbow:{leader:'qin',replaces:'crossbow',name:'秦锐士·强弩阵',cost:72,strength:32,ranged:46,cohesion:4,cohesionRanged:true,ancientWallDamage:.2},
 han_cavalry:{leader:'han-wudi',replaces:'horseman',name:'羽林骠骑',cost:58,moves:5,strength:39,vision:3,foreignAssault:3,upgradeDiscount:.3},
 xuanjia_knight:{leader:'taizong',replaces:'knight',name:'玄甲铁骑',cost:88,strength:54,flankingMultiplier:1,flankingCap:8,nearbyKillHeal:8},
 wuju_guard:{leader:'wu-zetian',replaces:'manatarms',name:'武举神策军',cost:75,strength:49,vision:3,recon:true,scholarGuard:3},
 hwacha:{leader:'sejong',replaces:'crossbow',name:'神机箭火厢车',cost:76,strength:24,ranged:50,homeOrHillRanged:4},
 hatamoto_samurai:{leader:'tokugawa',replaces:'manatarms',name:'旗本武士',cost:78,strength:50,ignoreWounds:true},
 hetairoi:{leader:'alexander',replaces:'horseman',name:'伙友骑兵',cost:58,strength:39,initialTraits:['assault'],cohesion:3,cohesionBoth:true},
 roman_legion:{leader:'caesar',replaces:'swordsman',name:'罗马军团',cost:60,strength:42,charges:1,engineer:true},
 praetorian_guard:{leader:'augustus',replaces:'swordsman',name:'禁卫军团',cost:58,strength:40,capitalGuard:5,garrisonCulture:2,garrisonLoyalty:5},
 athenian_trireme:{leader:'pericles',replaces:'galley',name:'雅典三列桨战船',cost:44,moves:4,strength:34,coastalCombat:4,nearbyCulture:1},
 persian_immortal:{leader:'cyrus',replaces:'swordsman',name:'波斯不死军',cost:58,strength:36,ranged:32,range:2,canCapture:true},
 scythed_chariot:{leader:'darius',replaces:'horseman',name:'波斯战车骑兵',cost:56,strength:38,roadOrOpenAssault:4},
 ptolemaic_flagship:{leader:'cleopatra',replaces:'galley',name:'托勒密皇家巨舰',cost:46,strength:35,vision:3,navalSupport:4},
 punt_expedition_ship:{leader:'hatshepsut',replaces:'galley',name:'红海远航船',cost:42,moves:4,strength:31,vision:3,discoveryReward:15},
 maryannu_chariot:{leader:'ramesses',replaces:'horseman',name:'玛丽亚努战车弓手',cost:52,tech:'wheel',resource:null,strength:28,ranged:36,range:2},
 dharma_elephant:{leader:'ashoka',replaces:'pikeman',name:'法轮护法象',cost:72,strength:48,antiCavalry:16,religiousDefense:5,nearbyPeriodHeal:5},
 maurya_war_elephant:{leader:'chandragupta',replaces:'horseman',name:'孔雀装甲战象',cost:64,moves:3,resource:null,strength:43,enemyAura:3,ancientWallDamage:.3},
 mamluk_knight:{leader:'saladin',replaces:'knight',name:'马穆鲁克重骑兵',cost:90,strength:52,periodHeal:10},
 janissary:{leader:'suleiman',replaces:'musket',name:'苏丹亲兵',cost:85,strength:62,initialLevel:1,enemyCityCombat:3},
 keshig:{leader:'genghis',replaces:'courser',name:'怯薛骑射手',cost:82,moves:5,strength:42,ranged:48,range:2,escortMovement:true},
 mandekalu_cavalry:{leader:'mansa-musa',replaces:'knight',name:'曼德卡鲁骑兵',cost:88,strength:51,killStrengthGold:true},
 zulu_impi:{leader:'shaka',replaces:'pikeman',name:'祖鲁伊姆皮战士',cost:58,moves:3,strength:47,antiCavalry:16,upkeepMultiplier:.5,xpMultiplier:1},
 sea_dog:{leader:'elizabeth',replaces:'frigate',name:'海狗私掠巡航舰',moves:5,strength:57,ranged:70},
 cossack:{leader:'peter',replaces:'cavalry',name:'哥萨克骑兵',cost:135,moves:5,strength:75,borderCombat:5},
 warakaq:{leader:'pachacuti',replaces:'crossbow',name:'瓦拉卡投石手',cost:74,moves:3,strength:30,ranged:44,initialTraits:['terrain'],hillRanged:5}
};
export const UNIQUE_BUILDINGS={
 great_wall_bastion:{leader:'qin',replaces:'walls',name:'长城戍堡',cost:42,defense:130,yields:{culture:2,gold:1},fortYields:{culture:1,gold:1},fortConstructionMultiplier:.5,flightTourism:4},
 salt_iron_office:{leader:'han-wudi',replaces:'market',name:'盐铁官署',cost:40,yields:{gold:5,production:2},resourceGold:2,cavalryExperience:10},
 honglu_pavilion:{leader:'taizong',replaces:'amphitheater',name:'鸿胪寺',cost:38,yields:{culture:4,gold:3,tourism:2},diplomaticYields:2},
 mingtang_hall:{leader:'wu-zetian',replaces:'temple',name:'洛阳明堂',cost:54,yields:{faith:5,culture:4,science:2},projectGold:25,projectCulture:15},
 jiphyeonjeon:{leader:'sejong',replaces:'university',name:'集贤殿书院',cost:58,yields:{science:6,culture:2},housing:1,campusCulture:1},
 tenshu_keep:{leader:'tokugawa',replaces:'medievalwalls',name:'天守阁城町',cost:85,defense:120,yields:{culture:2,production:2},districtYields:1},
 basilikoi_paides:{leader:'alexander',replaces:'barracks',name:'皇家卫队学堂',cost:60,yields:{production:2,science:2},militaryScienceRefund:.25},
 triumphal_forum:{leader:'caesar',replaces:'monument',name:'凯旋广场',cost:25,yields:{culture:2,gold:2},captureProgress:15},
 roman_bath:{leader:'augustus',replaces:'aqueduct',name:'罗马公共浴场',cost:45,yields:{food:2,culture:2,production:1},housing:5,amenities:1,industrialAdjacency:2},
 acropolis_odeon:{leader:'pericles',replaces:'amphitheater',name:'卫城露天剧场',cost:38,yields:{culture:5,tourism:4},hillCulture:2,hillGold:2},
 pairidaeza_garden:{leader:'cyrus',replaces:'entertainment',name:'波斯天园',cost:55,yields:{culture:3,gold:3,tourism:2},amenities:1,gardenAdjacency:2},
 satraps_court:{leader:'darius',replaces:'bank',name:'总督行省宫',cost:68,yields:{gold:9,culture:2,production:2},amenities:1,firstTradeCapacity:1},
 ptolemaic_mouseion:{leader:'cleopatra',replaces:'library',name:'亚历山大缪斯学园',cost:34,yields:{science:3,culture:2,tourism:2},foreignRouteScience:1,foreignRouteCulture:1},
 mortuary_temple:{leader:'hatshepsut',replaces:'shrine',name:'阿蒙神庙香园',cost:28,yields:{faith:4,culture:2},luxuryWonderYields:2},
 obelisk:{leader:'ramesses',replaces:'monument',name:'太阳神方尖碑',cost:25,yields:{culture:2,faith:2},riverYields:{production:1,tourism:2}},
 edict_pillar:{leader:'ashoka',replaces:'monument',name:'法敕石柱',cost:25,yields:{culture:2,faith:2,food:1},religiousResistance:.25,populationAmenities:6},
 maurya_stepwell:{leader:'chandragupta',replaces:'watermill',name:'阶梯水井',cost:40,yields:{food:3,production:2,faith:1},housing:2,noRiverRequired:true},
 ayyubid_madrasa:{leader:'saladin',replaces:'university',name:'阿尤布经学院',cost:60,yields:{science:6,faith:3},housing:1,holyScience:1},
 grand_bazaar:{leader:'suleiman',replaces:'bank',name:'大巴扎集市',cost:66,yields:{gold:10,production:2},amenities:1,strategicSupply:1,luxuryGold:3},
 mongol_ordu:{leader:'genghis',replaces:'barracks',name:'斡耳朵军帐',cost:60,yields:{production:2,gold:2,culture:1},cavalryMove:1,cavalryExperience:15},
 suguba_market:{leader:'mansa-musa',replaces:'market',name:'苏古巴大巴扎',cost:38,yields:{gold:6,faith:2},purchaseDiscount:.15,religiousDiscount:.15,holyOrRiverScience:2},
 ikanda:{leader:'shaka',replaces:'barracks',name:'伊坎达王室军寨',cost:45,yields:{production:2,culture:1,gold:1},housing:2,trainedTrait:'terrain'},
 royal_dockyard:{leader:'elizabeth',replaces:'shipyard',name:'皇家海军船坞',cost:80,yields:{production:6,gold:4},navalMove:1,navalExperience:15},
 peter_arsenal:{leader:'peter',replaces:'workshop',name:'珍品院与兵工厂',cost:45,yields:{production:4,science:3,culture:2},harborMilitaryProduction:.2},
 inca_tambo:{leader:'pachacuti',replaces:'granary',name:'印加驿站粮库',cost:32,yields:{food:3,production:2},housing:3}
};
export const baseItem=key=>UNIQUE_UNITS[key]?.replaces||UNIQUE_BUILDINGS[key]?.replaces||key;
export const hasBuilding=(city,key)=>(city.buildings||[]).some(item=>baseItem(item)===baseItem(key));
export const uniqueEnabled=player=>player?.leaderRulesVersion===2;
export function replacementFor(player,key){
 if(!uniqueEnabled(player))return key;
 return Object.entries({...UNIQUE_UNITS,...UNIQUE_BUILDINGS}).find(([,spec])=>spec.leader===player.leaderKey&&spec.replaces===key)?.[0]||key;
}
export function contentEligible(player,spec){return !spec?.leader||uniqueEnabled(player)&&spec.leader===player.leaderKey;}
export function buildingOperational(g,city,key,buildings){
 const owned=city.buildings.find(k=>baseItem(k)===baseItem(key));if(!owned)return false;
 const unavailable=new Set(city.districts.filter(d=>g.map.tiles[d.tile].pillaged).map(d=>baseItem(d.item)));
 let item=owned;while(buildings[item]){const spec=buildings[item];if(unavailable.has(baseItem(item)))return false;if(!spec.building)return true;item=spec.building;}
 return true;
}
const percent=n=>Math.round(n*100)+'%';
const unitPerks={
 cohesion:(n,s)=>s.cohesionRanged?`邻接己方近战或反骑兵步兵时，远程战力 +${n}`:`与邻接己方步兵协同时，双方进攻战力 +${n}`,
 ancientWallDamage:n=>`在己方领土或邻接己方完好堡垒时，可对古代城墙造成少量伤害（系数 ${n}）`,
 foreignAssault:n=>`境外进攻战力 +${n}`,upgradeDiscount:n=>`升级费用降低 ${percent(n)}`,
 flankingMultiplier:(n,s)=>`夹击加成提高 ${percent(n)}，总夹击加成最多 ${s.flankingCap||9}`,nearbyKillHeal:n=>`击杀后自身及邻接己方陆军恢复 ${n} 生命`,
 recon:()=>`提供侦察情报`,scholarGuard:n=>`距己方学院或圣地城市 3 格内战力 +${n}`,
 homeOrHillRanged:n=>`己方领土或丘陵上攻击陆地单位时远程战力 +${n}`,ignoreWounds:()=>`忽略受伤战力惩罚`,homeDefense:n=>`己方领土防守战力 +${n}`,
 initialTraits:n=>`出生自带${n.map(k=>({assault:'突击',terrain:'地形适应'}[k]||k)).join('、')}专长`,
 engineer:()=>`有 1 次野战工程次数，施工后保留部队`,capitalGuard:n=>`距己方首都或奇观城市 3 格内防守战力 +${n}`,
 garrisonCulture:n=>`驻军城市文化 +${n}`,garrisonLoyalty:n=>`驻军城市忠诚增量 +${n}`,
 coastalCombat:n=>`浅海战力 +${n}`,nearbyCulture:()=>`距城市 2 格内每艘贡献 1 文化，最多计入 2 艘`,
 canCapture:()=>`可进入已经破城的敌方城市完成占领`,roadOrOpenAssault:n=>`道路或无丘陵植被地块上进攻战力 +${n}`,
 navalSupport:n=>`为邻接己方舰船或运输部队提供防守战力 +${n}`,
 discoveryReward:n=>`首次发现外国沿海城市时获得 ${n} 金币与 ${n} 信仰`,
 religiousDefense:n=>`己方领土或距己方宗教城市 3 格内防守战力 +${n}`,
 nearbyPeriodHeal:n=>`每个经济期为邻接己方军事部队恢复 ${n} 生命`,enemyAura:n=>`邻接交战敌方陆军战力 -${n}`,
 periodHeal:n=>`每个经济期恢复 ${n} 生命，移动或攻击后仍生效`,initialLevel:n=>`出生等级 ${n}`,siegeSupport:n=>`距己方攻城单位 2 格内战力 +${n}`,enemyCityCombat:n=>`距已宣战的敌方城市 2 格内战力 +${n}`,
 escortMovement:()=>`同格链接的平民与支援单位共享其移动力；使节不能链接`,
 homeKillGold:()=>`在己方领土击杀时按敌方基础近战战力获得金币，最多 60`,
 killStrengthGold:()=>`击杀敌方非平民单位时，获得等同于其基础近战战力的金币`,
 upkeepMultiplier:n=>`单位薪资与维护费乘以 ${n}，折扣仍受国家费用下限约束`,xpMultiplier:n=>`战斗经验额外 +${percent(n)}`,
 borderCombat:n=>`己方领土及邻接边境战力 +${n}`,hillRanged:n=>`丘陵上远程战力 +${n}`
};
const buildingPerks={
 fortYields:()=>`工作范围内每个己方完好堡垒贡献 1 文化与 1 金币`,flightTourism:n=>`掌握飞行后旅游 +${n}`,
 resourceGold:n=>`本城已开发矿山或战略资源地块各贡献 ${n} 金币，最多 ${n*3} 金币`,
 cavalryExperience:n=>`本城新招募骑兵经验 +${n}`,navalExperience:n=>`本城新招募舰船经验 +${n}`,
 diplomaticYields:n=>`每个已接触的同盟或开放边境国家贡献 ${n} 科技与 ${n} 文化，最多 3 国`,
 projectGold:n=>`完成非航天城市项目时获得 ${n} 金币`,projectCulture:n=>`完成非航天城市项目时获得 ${n} 文化`,
 campusCulture:n=>`学院邻接科学额外转化 ${percent(n)} 为文化`,holyScience:n=>`圣地邻接信仰额外转化 ${percent(n)} 为科学`,
 districtYields:n=>`每个完好的学院、圣地、工业区、商业中心或剧院广场贡献 ${n} 文化与 ${n} 生产`,
 militaryScienceRefund:n=>`完成军事单位时按其基础生产成本的 ${percent(n)} 获得科学`,
 captureProgress:n=>`本国占领城市时，本城当前生产进度 +${n}`,industrialAdjacency:n=>`为邻接工业区和商业区提供 ${n} 邻接加成`,
 hillCulture:(n,s)=>`剧场区在丘陵或紧邻市中心时文化 +${n}${s.hillGold?'、金币 +'+s.hillGold:''}`,gardenAdjacency:n=>`邻接己方未劫掠商业区或剧场区时，文化与金币各 +${n}`,
 firstTradeCapacity:()=>`本国首次完成该建筑后商路容量 +1，不重复叠加`,
 foreignRouteScience:n=>`本城出发的外国商路每条科学 +${n}，最多 4 条`,
 foreignRouteCulture:n=>`本城出发的外国商路每条文化 +${n}，最多 4 条`,
 luxuryWonderYields:n=>`本城拥有奇观或已开发奢侈资源时，生产与旅游各 +${n}`,
 riverYields:n=>`市中心临河时生产 +${n.production}、旅游 +${n.tourism}`,religiousResistance:n=>`外国被动宗教压力降低 ${percent(n)}`,
 populationAmenities:n=>`人口达到 ${n} 时额外宜居度 +1`,noRiverRequired:()=>`无需临河`,
 strategicSupply:n=>`本城已开发的自有战略资源存量额外 +${n}`,luxuryGold:n=>`本城每个已开发奢侈资源贡献 ${n} 金币`,
 cavalryMove:n=>`本城新招募骑兵永久移动力 +${n}`,purchaseDiscount:n=>`本城金币资助费用降低 ${percent(n)}`,
 religiousDiscount:n=>`本城宗教单位招募信仰费用降低 ${percent(n)}`,
 trainedTrait:()=>`本城新招募陆地军事单位自带地形适应专长`,
 navalMove:n=>`本城新造海军永久移动力 +${n}`,
 fortConstructionMultiplier:n=>`本城辖区内建造者修筑堡垒耗时乘以 ${n}`,
 holyOrRiverScience:n=>`市中心沿河或邻接完好圣地时科技 +${n}`,
 harborMilitaryProduction:n=>`本城拥有可运作港口时，海军与火炮单位生产 +${percent(n)}`
};
function abilities(extra,perks){return Object.entries(extra).filter(([key])=>perks[key]).map(([key,n])=>perks[key](n,extra)).join('；');}
function describeReplacement(extra,base,perks){const descriptions=abilities(extra,perks).split('；').filter(Boolean);if(extra.moves!==undefined)descriptions.unshift(`移动力 ${extra.moves}`);if(extra.strength!==undefined)descriptions.unshift(`近战战力 ${extra.strength}${extra.ranged!==undefined?`，远程战力 ${extra.ranged}`:''}`);if(extra.housing)descriptions.push(`住房 +${extra.housing}`);if(extra.amenities)descriptions.push(`宜居度 +${extra.amenities}`);return `替代${base.name}。`+(descriptions.length?descriptions.join('；')+'。':'');}
export function registerUniqueUnits(units){for(const [key,extra]of Object.entries(UNIQUE_UNITS))units[key]={...units[extra.replaces],...extra,abilityDescription:abilities(extra,unitPerks),description:describeReplacement(extra,units[extra.replaces],unitPerks)};}
export function registerUniqueBuildings(buildings){for(const [key,extra]of Object.entries(UNIQUE_BUILDINGS))buildings[key]={...buildings[extra.replaces],...extra,abilityDescription:abilities(extra,buildingPerks),description:describeReplacement(extra,buildings[extra.replaces],buildingPerks)};}
