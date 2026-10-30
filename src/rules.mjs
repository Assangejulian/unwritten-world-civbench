import {GOVERNOR_TITLE_CIVICS} from './governor-data.mjs';
import {HERITAGE_WONDERS,GREAT_PEOPLE} from './heritage-data.mjs';
import {REWORKED_LEADERS,HISTORICAL_TRADITIONS} from './leader-rework.mjs';
import {registerUniqueUnits,registerUniqueBuildings,baseItem,hasBuilding,UNIQUE_BUILDINGS,buildingOperational} from './unique-content.mjs';
export const VERSION = 1;
// Content capability ledger is shared by both research interfaces.
export const RESEARCH_FEATURES={
 't:futuretech':['首次完成获得 1 点外交胜利积分。','巨型战斗机甲解锁远程火炮：射程 3 格。','巨型战斗机甲解锁动力跳跃：跨越两格内障碍，消耗 2 移动力。'],
 't:mining':['建造者可砍伐森林，向附近城市投入生产力。'],
 't:bronze':['建造者可清理雨林。'],
 't:sailing':['轻型陆军获得木船运输能力。'],
 't:engineering':['过河不再额外消耗移动力。'],
 't:celestial':['开放现有陆军深海运输。'],
 't:apprenticeship':['矿山额外 +1 生产力。'],
 't:printing':['改善外交能见度；文化改良设施开始产生旅游。'],
 't:astronomy':['拥有学院的城市 +2 科技。'],
 't:industrial':['拥有工业区的城市 +2 生产力。'],
 't:electricity':['每座城市额外 +2 科技。'],
 't:steam':['重型地面装备获得蒸汽运输能力。'],
 't:computers':['全国科技产出 +20%；改善外交能见度。'],
 't:telecommunications':['改善外交能见度。'],
 't:flight':['有文化的改良设施产生旅游。'],
 't:satellites':['完成实际卫星发射后，攻击无人机基础射程提升至 24。'],
 'c:trade':['建立真实贸易路线；商人以路线系统管理。'],
 'c:militarytradition':['解锁陆军侧翼与支援战斗加成，每类最多 +6。'],
 'c:feudalism':['农场 +1 食物。'],
 'c:civilservice':['可以提议双边同盟，须由对方同意。'],
 'c:diplomacy':['开启战略间谍名册，获得 1 个间谍名额；派遣任务与反间谍。'],
 'c:ideology':['间谍名额 +1。'],
 'c:coldwar':['间谍名额 +1。'],
 'c:media':['全国文化产出 +20%，旅游 +25%。'],
 'c:futurecivic':['首次完成获得 1 点外交胜利积分。'],
 'c:globalization':['每条贸易路线额外 +4 金币。']
};
// Equipment strength remains decisive even for long-lived veteran units.
export function veteranCombatBonus(unit){return Math.min(5,Math.max(0,Math.floor(unit.level||0)))*3;}
// Shared by authoritative hits, public combat estimates and movement risk.
export function combatDamage(attack,defense,variation=1){return Math.max(1,Math.min(90,27*Math.exp((attack-defense)/27)*variation));}
export const traditionIndex=p=>p?.leaderRulesVersion===2?(HISTORICAL_TRADITIONS[p.leaderKey]??p.id%8):p.id%8;
export const MAP_SIZES = {
  small: {name:'小型',width:74,height:46,players:6},
  standard: {name:'标准',width:84,height:54,players:8},
  large: {name:'大型',width:96,height:60,players:10},
  huge: {name:'极大 · CIV VI 尺寸',width:106,height:66,players:12},
  massive: {name:'超大',width:128,height:80,players:16},
};
export const MAX_CIVILIZATIONS=16;
export const WORLD_RAINFALL={dry:{name:'干旱',moistureShift:-.14,rainfall:35,riverDensity:.7},standard:{name:'标准',moistureShift:0,rainfall:50,riverDensity:1},wet:{name:'湿润',moistureShift:.14,rainfall:65,riverDensity:1.3}};
export const RESOURCE_ABUNDANCE={sparse:{name:'稀少',retention:.35},standard:{name:'标准',retention:.6},abundant:{name:'丰富',retention:1}};
export function civilizationTemplate(id){const template=CIVS[id%8],colors=['#bb627c','#59bea8','#a79bc8','#bdb780','#7997df','#ddad7f','#aececa','#cfaace'];return {...template,id,...(id>=8?{color:colors[id-8]}:{})};}
export function eraScore(player){return civilizationEra(player)*20+(player.techs?.length||0)*2+(player.civics?.length||0)+(player.heritageEraScore||0);}
export const ERAS = ['远古时代', '古典时代', '中古时代', '文艺复兴', '工业时代', '现代', '原子能时代', '信息时代', '未来时代'];
export const YIELD_KEYS = ['food', 'production', 'gold', 'science', 'culture', 'faith'];
export const YIELD_LABELS = {food:'食物', production:'生产力', gold:'金币', science:'科技', culture:'文化', faith:'信仰'};
export const CIVS = [
  {id:0,name:'苍穹学邦',short:'苍穹',leader:'星河议长',color:'#6fc1d0',symbol:'✦',trait:'大学之光',description:'科技产出 +20%，学院额外 +2 科技。',focus:'science',capital:'观星城',cityNames:['天文港','镜湖','白塔','弦月','北辰','星门'],file:'01_astra.cpp'},
  {id:1,name:'赤金军团',short:'赤金',leader:'奥勒将军',color:'#dd806e',symbol:'⚔',trait:'军团意志',description:'战斗力 +4，军事单位生产 +20%。',focus:'military',capital:'赤金城',cityNames:['铁壁','凯旋','烽火','雄关','战旗','鹰巢'],file:'02_legion.cpp'},
  {id:2,name:'翡翠王庭',short:'翡翠',leader:'叶岚女王',color:'#9dc47f',symbol:'❧',trait:'沃土之约',description:'城市食物 +20%，农场额外 +1 食物。',focus:'growth',capital:'翠庭',cityNames:['溪谷','麦原','林海','春望','丰穗','绿湾'],file:'03_verdant.cpp'},
  {id:3,name:'琥珀商盟',short:'琥珀',leader:'弥达会长',color:'#dfba69',symbol:'◆',trait:'黄金航路',description:'金币产出 +25%，贸易路线额外 +3 金币。',focus:'gold',capital:'琥珀港',cityNames:['香料湾','金桥','商海','银泉','锦市','灯塔'],file:'04_merchant.cpp'},
  {id:4,name:'紫鸢艺国',short:'紫鸢',leader:'伊莲执政',color:'#b09bd5',symbol:'✿',trait:'永恒回响',description:'文化产出 +25%，奇观旅游 +50%。',focus:'culture',capital:'紫鸢城',cityNames:['诗廊','暮歌','画岸','琉璃','琴台','月剧场'],file:'05_muse.cpp'},
  {id:5,name:'银帆联邦',short:'银帆',leader:'海泽舰长',color:'#78adcf',symbol:'⚓',trait:'海风与远方',description:'沿海城市 +2 生产力，海军战斗力 +5。',focus:'naval',capital:'银帆港',cityNames:['蔚蓝','风角','远潮','珍珠','海门','晨帆'],file:'06_mariner.cpp'},
  {id:6,name:'白曜教国',short:'白曜',leader:'瑟拉圣使',color:'#dfd8bb',symbol:'☼',trait:'黎明祷歌',description:'信仰产出 +30%，圣地额外 +2 文化。',focus:'faith',capital:'白曜城',cityNames:['朝圣','圣泉','日轮','曙光','钟楼','天阶'],file:'07_oracle.cpp'},
  {id:7,name:'铜山工社',short:'铜山',leader:'石衡总工',color:'#c39264',symbol:'⚒',trait:'铸造未来',description:'生产力 +20%，矿山额外 +1 生产力。',focus:'industry',capital:'铜山城',cityNames:['锻炉','钢谷','机枢','烟峰','齿轮','炉心'],file:'08_foundry.cpp'}
];
export const LEGACY_LEADERS = [
  {key:'astral',civ:0,name:'星河议长',skill:'群星议会',description:'40 游戏秒内科技产出 +25%。',effects:{science:.25}},
  {key:'legion',civ:1,name:'奥勒将军',skill:'军团号令',description:'40 游戏秒内军队战斗力 +4，军事生产 +20%。',effects:{combat:4,militaryProduction:.2}},
  {key:'verdant',civ:2,name:'叶岚女王',skill:'丰收盟约',description:'40 游戏秒内食物产出 +25%，城市住房 +1。',effects:{food:.25,housing:1}},
  {key:'merchant',civ:3,name:'弥达会长',skill:'商路繁荣',description:'40 游戏秒内金币产出 +35%，贸易容量 +1。',effects:{gold:.35,tradeCapacity:1}},
  {key:'muse',civ:4,name:'伊莲执政',skill:'黄金艺季',description:'40 游戏秒内文化产出 +30%，旅游产出 +25%。',effects:{culture:.3,tourism:.25}},
  {key:'mariner',civ:5,name:'海泽舰长',skill:'银帆远征',description:'40 游戏秒内海军战斗力 +5，海军生产 +30%。',effects:{navalCombat:5,navalProduction:.3}},
  {key:'oracle',civ:6,name:'瑟拉圣使',skill:'黎明祈愿',description:'40 游戏秒内信仰产出 +35%。',effects:{faith:.35}},
  {key:'foundry',civ:7,name:'石衡总工',skill:'熔炉动员',description:'40 游戏秒内生产力 +25%。',effects:{production:.25}}
];
export const NATIONAL_POLICIES = {
  balanced:{name:'均衡国策',description:'保持均衡，不额外调整产出。',weights:{}},
  academy:{name:'学术立国',description:'城市科技 +10%，优先研究与教育。',effects:{science:.1},weights:{science:.6}},
  mobilization:{name:'军备动员',description:'军事单位生产 +15%，优先军备。',effects:{militaryProduction:.15},weights:{aggression:.7,industry:.2}},
  frontier:{name:'拓土兴农',description:'城市食物 +10%，优先扩张和住房。',effects:{food:.1},weights:{growth:.7}},
  commerce:{name:'开放商路',description:'城市金币 +10%，优先贸易。',effects:{gold:.1},weights:{commerce:.7}},
  heritage:{name:'文化传承',description:'城市文化 +10%，优先文化与奇观。',effects:{culture:.1},weights:{culture:.7}},
  devotion:{name:'信仰凝聚',description:'城市信仰 +10%，优先宗教传播。',effects:{faith:.1},weights:{faith:.7}},
  industry:{name:'工业建设',description:'城市生产力 +8%，优先改良与工业。',effects:{production:.08},weights:{industry:.7}}
};
export const NATIONAL_STRATEGIES = {
  diplomacy:{name:'外交协调',description:'发展政体、文化与贸易，争取城邦宗主权和大会共识，累积外交胜利积分。',weights:{culture:.8,commerce:.7,growth:.2}},
  adaptive:{name:'因地制宜',description:'根据地形、资源、压力和胜利进度调整发展。',weights:{}},
  science:{name:'科技飞跃',description:'科技胜利；优先教育、工业与航天。',weights:{science:1.4,industry:.45,aggression:-.2}},
  domination:{name:'军事征服',description:'征服胜利；优先近邻弱敌与军队协同。',weights:{aggression:1.4,industry:.5}},
  culture:{name:'文化盛世',description:'文化胜利；优先市政、奇观与旅游。',weights:{culture:1.4,commerce:.25,aggression:-.2}},
  religion:{name:'信仰传播',description:'宗教胜利；优先圣地和传教。',weights:{faith:1.6,culture:.3}},
  economy:{name:'繁荣发展',description:'积累经济、贸易与生产，为后续胜利铺路。',weights:{commerce:1.25,growth:.3,industry:.35}},
  naval:{name:'海洋强国',description:'发展沿海城市、海军与海上探索。',weights:{naval:1.5,commerce:.4,aggression:.3}}
};
// Conditional bonuses are additive; worked-tile and route rules are capped at four.
const cityRule=(when,flat={},multipliers={})=>({when,flat,multipliers});
const unitRule=(when,combat)=>({when,combat});
const historicalLeader=(key,name,origin,passiveName,passiveDescription,passive,skill,description,active,weights,duration=40,cooldown=140)=>({key,name,origin,passiveName,passiveDescription,passive,skill,description,active,effects:active.effects||{},weights,duration,cooldown});
export const LEADERS = [
  historicalLeader('qin','秦始皇','中国 · 秦','一统法度','建造者多 1 次使用次数；奇观生产 +15%，首都 +2 文化。',{effects:{builderCharges:1,wonderProduction:.15},cities:[cityRule('capital',{culture:2})]},'六合营造','奇观生产额外 +35%，建造者生产 +30%；拥有城墙的城市 +2 生产力。',{effects:{wonderProduction:.35,builderProduction:.3},cities:[cityRule('walls',{production:2})]},{industry:.4,culture:.5},50,160),
  historicalLeader('han-wudi','汉武帝','中国 · 西汉','盐铁与开边','每个正在工作的矿山 +1 金币；骑兵在无丘陵、无树林的陆地上战斗力 +3。',{cities:[cityRule('workedMine',{gold:1})],units:[unitRule('cavalryOpen',3)]},'北疆动员','军事生产 +30%；骑兵战斗力额外 +4，有商业中心的城市 +2 生产力。',{effects:{militaryProduction:.3},units:[unitRule('cavalry',4)],cities:[cityRule('commercial',{production:2})]},{aggression:.6,industry:.3}),
  historicalLeader('taizong','唐太宗','中国 · 唐','贞观之治','和平时城市食物 +12%、文化 +10%；国内商路每条 +1 食物。',{cities:[cityRule('peace',{}, {food:.12,culture:.1}),cityRule('domesticRoute',{food:1})]},'府兵整备','近战与骑兵战斗力 +4；国内商路每条额外 +2 生产力。',{units:[unitRule('meleeOrCavalry',4)],cities:[cityRule('domesticRoute',{production:2})]},{growth:.5,commerce:.3}),
  historicalLeader('wu-zetian','武则天','中国 · 武周','制举选才','有学院的城市 +2 文化，有圣地的城市 +1 科技；城市项目生产 +15%。',{effects:{projectProduction:.15},cities:[cityRule('campus',{culture:2}),cityRule('holy',{science:1})]},'明堂礼制','有圣地的城市信仰 +30%、文化 +20%；有学院的城市科技 +20%。',{cities:[cityRule('holy',{}, {faith:.3,culture:.2}),cityRule('campus',{}, {science:.2})]},{faith:.4,culture:.4,science:.3}),
  historicalLeader('sejong','世宗','朝鲜 · 朝鲜王朝','集贤殿','有学院的城市科技 +15%、文化 +2；首都 +1 科技。',{cities:[cityRule('campus',{culture:2},{science:.15}),cityRule('capital',{science:1})]},'训民与实学','科技 +20%；有学院的城市额外 +15% 科技，文化 +20%。',{effects:{science:.2},cities:[cityRule('campus',{}, {science:.15,culture:.2})]},{science:.7,culture:.3}),
  historicalLeader('tokugawa','德川家康','日本 · 江户幕府','幕藩秩序','国内商路每条 +1 科技、+1 文化；在本国领土防御时战斗力 +3。',{cities:[cityRule('domesticRoute',{science:1,culture:1})],units:[unitRule('homeDefense',3)]},'天下安定','和平时城市生产 +25%、文化 +20%；在本国领土防御时额外战斗力 +4。',{cities:[cityRule('peace',{}, {production:.25,culture:.2})],units:[unitRule('homeDefense',4)]},{industry:.4,commerce:.4,aggression:-.3},50,150),
  historicalLeader('alexander','亚历山大','马其顿','远征与求知','近战、骑兵进攻时战斗力 +3；部队攻击击败非平民单位获得 8 科技储备。',{effects:{killScience:8},units:[unitRule('assault',3)]},'东方远征','近战、骑兵战斗力额外 +5，军事生产 +20%；发动时存活且未登船的军事单位恢复 12 生命，不重置行动。',{effects:{militaryProduction:.2},units:[unitRule('meleeOrCavalry',5)],instant:{heal:12}},{aggression:.7,science:.2},35,150),
  historicalLeader('caesar','尤利乌斯·凯撒','罗马 · 共和国','军团与战利品','陆地近战单位战斗力 +3；部队攻击击败非平民单位获得 12 金币。',{effects:{killGold:12},units:[unitRule('melee',3)]},'渡过卢比孔','陆地近战单位额外战斗力 +5、军事生产 +25%；占领城市的占领惩罚缩短 1 个经济周期。',{effects:{militaryProduction:.25,captureRelief:1},units:[unitRule('melee',5)]},{aggression:.7,industry:.2},35,150),
  historicalLeader('augustus','奥古斯都','罗马 · 帝国','罗马和平','和平时城市生产 +12%；首都 +2 文化、+2 金币；开拓者生产 +15%。',{effects:{settlerProduction:.15},cities:[cityRule('peace',{}, {production:.12}),cityRule('capital',{culture:2,gold:2})]},'大理石之城','区域生产 +35%、奇观生产 +25%；和平城市额外 +15% 文化。',{effects:{districtProduction:.35,wonderProduction:.25},cities:[cityRule('peace',{}, {culture:.15})]},{industry:.5,culture:.4},50,150),
  historicalLeader('pericles','伯里克利','希腊 · 雅典','公民与剧场','有剧院广场的城市文化 +20%；首都 +2 科技。',{cities:[cityRule('theater',{}, {culture:.2}),cityRule('capital',{science:2})]},'雅典黄金时代','文化 +20%，有剧院广场的城市额外 +20% 文化和 +30% 旅游；奇观生产 +20%。',{effects:{culture:.2,wonderProduction:.2},cities:[cityRule('theater',{}, {culture:.2,tourism:.3})]},{culture:.7,science:.2},50,150),
  historicalLeader('cyrus','居鲁士','波斯 · 阿契美尼德','帝国整合','占领城市的占领惩罚缩短 1 个经济周期；国外商路每条 +2 金币、+1 文化。',{effects:{captureRelief:1},cities:[cityRule('foreignRoute',{gold:2,culture:1})]},'诸地之王','近战与骑兵战斗力 +4；发动时占领中的城市忠诚 +15，占领惩罚再缩短 1 个周期。',{units:[unitRule('meleeOrCavalry',4)],instant:{loyalty:15,occupationRelief:1}},{aggression:.4,commerce:.5}),
  historicalLeader('darius','大流士一世','波斯 · 阿契美尼德','王家道路','国内商路每条 +2 金币、+1 生产力；商业中心生产 +20%。',{effects:{commercialProduction:.2},cities:[cityRule('domesticRoute',{gold:2,production:1})]},'行省赋税','金币 +25%；每条国内外商路额外 +2 生产力，贸易容量临时 +1。',{effects:{gold:.25,tradeCapacity:1},cities:[cityRule('route',{production:2})]},{commerce:.7,industry:.3},50,150),
  historicalLeader('cleopatra','克娄巴特拉七世','埃及 · 托勒密','尼罗河与外交','沿河城市食物 +10%、金币 +10%；国外商路每条 +2 金币。',{cities:[cityRule('river',{}, {food:.1,gold:.1}),cityRule('foreignRoute',{gold:2})]},'尼罗河粮仓','沿河城市食物额外 +30%、生产 +20%；国外商路每条额外 +2 金币、+1 文化。',{cities:[cityRule('river',{}, {food:.3,production:.2}),cityRule('foreignRoute',{gold:2,culture:1})]},{growth:.4,commerce:.6},50,150),
  historicalLeader('hatshepsut','哈特谢普苏特','埃及 · 新王国','远航与神庙','国外商路每条 +1 信仰、+1 生产力；奇观生产 +15%。',{effects:{wonderProduction:.15},cities:[cityRule('foreignRoute',{faith:1,production:1})]},'蓬特远航','沿海城市金币 +25%；国外商路每条额外 +3 金币、+2 信仰，港口生产 +30%。',{effects:{harborProduction:.3},cities:[cityRule('coast',{}, {gold:.25}),cityRule('foreignRoute',{gold:3,faith:2})]},{commerce:.5,faith:.4,naval:.3},50,150),
  historicalLeader('ramesses','拉美西斯二世','埃及 · 新王国','纪念与王权','有城墙的城市 +2 文化；奇观生产 +15%，攻城单位战斗力 +2。',{effects:{wonderProduction:.15},cities:[cityRule('walls',{culture:2})],units:[unitRule('siege',2)]},'永恒纪念碑','奇观生产额外 +35%；有圣地的城市 +3 文化、+3 信仰；攻城单位额外战斗力 +4。',{effects:{wonderProduction:.35},cities:[cityRule('holy',{culture:3,faith:3})],units:[unitRule('siege',4)]},{culture:.4,faith:.3,industry:.3},50,160),
  historicalLeader('ashoka','阿育王','印度 · 孔雀王朝','法敕与慈悲','和平城市信仰 +15%、食物 +10%；传教士多 1 次传播次数。',{effects:{missionaryCharges:1},cities:[cityRule('peace',{}, {faith:.15,food:.1})]},'达摩巡行','有圣地的城市信仰额外 +35%、文化 +20%；发动时本国领土上未登船的军事单位恢复 10 生命。',{cities:[cityRule('holy',{}, {faith:.35,culture:.2})],instant:{heal:10,homeOnly:true}},{faith:.7,growth:.3,aggression:-.3},50,150),
  historicalLeader('chandragupta','旃陀罗笈多','印度 · 孔雀王朝','统一与治国','首都生产 +15%；军事生产 +10%，攻城单位战斗力 +2。',{effects:{militaryProduction:.1},cities:[cityRule('capital',{}, {production:.15})],units:[unitRule('siege',2)]},'孔雀军阵','骑兵与攻城单位额外战斗力 +5；军事生产额外 +30%；沿河城市 +2 生产力。',{effects:{militaryProduction:.3},units:[unitRule('cavalryOrSiege',5)],cities:[cityRule('river',{production:2})]},{aggression:.6,industry:.4},35,150),
  historicalLeader('saladin','萨拉丁','埃及与叙利亚 · 阿尤布','学问与信仰','有圣地的城市 +2 科技；信奉本国宗教的城市信仰 +15%；骑兵在本国领土防御时 +3 战斗力。',{cities:[cityRule('holy',{science:2}),cityRule('religion',{}, {faith:.15})],units:[unitRule('cavalryHomeDefense',3)]},'守护与复兴','信奉本国宗教的城市科技 +25%、信仰 +30%；骑兵战斗力额外 +4。',{cities:[cityRule('religion',{}, {science:.25,faith:.3})],units:[unitRule('cavalry',4)]},{faith:.6,science:.4}),
  historicalLeader('suleiman','苏莱曼一世','奥斯曼帝国','法典与炮兵','攻城单位战斗力 +3；有商业中心的城市 +2 生产力；占领惩罚缩短 1 个周期。',{effects:{captureRelief:1},cities:[cityRule('commercial',{production:2})],units:[unitRule('siege',3)]},'帝国围城','攻城单位战斗力额外 +6、军事生产 +25%；有港口的城市金币 +20%。',{effects:{militaryProduction:.25},units:[unitRule('siege',6)],cities:[cityRule('harbor',{}, {gold:.2})]},{aggression:.6,commerce:.3},35,150),
  historicalLeader('genghis','成吉思汗','蒙古帝国','草原军制','骑兵在开阔陆地上战斗力 +4；军事生产 +10%；部队攻击击败非平民单位获得 10 金币。',{effects:{militaryProduction:.1,killGold:10},units:[unitRule('cavalryOpen',4)]},'大汗号令','骑兵战斗力额外 +6，骑兵生产 +35%；有牧场的工作地块每块 +1 生产力。',{effects:{cavalryProduction:.35},units:[unitRule('cavalry',6)],cities:[cityRule('workedPasture',{production:1})]},{aggression:.8,growth:.2},30,150),
  historicalLeader('mansa-musa','曼萨·穆萨','马里帝国','黄金与学府','每个正在工作的矿山 +2 金币；有圣地的城市 +2 科技；普通军事单位生产 -10%。',{effects:{militaryProduction:-.1},cities:[cityRule('workedMine',{gold:2}),cityRule('holy',{science:2})]},'朝觐商队','金币 +30%；国外商路每条额外 +3 信仰、+2 文化；商业中心生产 +25%。',{effects:{gold:.3,commercialProduction:.25},cities:[cityRule('foreignRoute',{faith:3,culture:2})]},{commerce:.7,faith:.4},50,160),
  historicalLeader('shaka','沙卡','南非 · 祖鲁','伊克尔瓦军阵','陆地近战与反骑兵单位战斗力 +3；在本国领土防御时再 +2。',{units:[unitRule('melee',3),unitRule('homeDefense',2)]},'牛角阵','陆地近战与反骑兵单位额外战斗力 +5；军事生产 +25%；发动时本国领土上未登船的军事单位恢复 12 生命。',{effects:{militaryProduction:.25},units:[unitRule('melee',5)],instant:{heal:12,homeOnly:true}},{aggression:.7,industry:.2},35,150),
  historicalLeader('elizabeth','伊丽莎白一世','英格兰 · 都铎','航海特许','沿海城市 +2 金币；国外商路每条 +1 文化；海军战斗力 +2。',{effects:{navalCombat:2},cities:[cityRule('coast',{gold:2}),cityRule('foreignRoute',{culture:1})]},'皇家舰队','海军战斗力额外 +5、海军生产 +35%；有港口的城市金币 +25%。',{effects:{navalCombat:5,navalProduction:.35},cities:[cityRule('harbor',{}, {gold:.25})]},{naval:.7,commerce:.4}),
  historicalLeader('peter','彼得一世','俄罗斯帝国','改革与造船','有工业区的城市 +2 科技；港口生产 +20%；国外商路每条 +1 科技。',{effects:{harborProduction:.2},cities:[cityRule('industrial',{science:2}),cityRule('foreignRoute',{science:1})]},'大使团改革','区域生产 +30%；有工业区的城市科技 +25%，有港口的城市生产 +25%；海军生产 +20%。',{effects:{districtProduction:.3,navalProduction:.2},cities:[cityRule('industrial',{}, {science:.25}),cityRule('harbor',{}, {production:.25})]},{industry:.5,science:.4,naval:.4},50,150),
  historicalLeader('pachacuti','帕查库特克','南美 · 印加','安第斯梯田','每块正在工作的丘陵农场 +2 食物；丘陵上防御战斗力 +3，建造者生产 +15%。',{effects:{builderProduction:.15},cities:[cityRule('workedHillFarm',{food:2})],units:[unitRule('hillDefense',3)]},'米塔营建','每块正在工作的丘陵 +1 生产力；国内商路每条 +2 食物，区域生产 +25%。',{effects:{districtProduction:.25},cities:[cityRule('workedHill',{production:1}),cityRule('domesticRoute',{food:2})]},{growth:.6,industry:.5},50,150)
];
export const DEFAULT_LEADER_KEYS=['sejong','alexander','taizong','mansa-musa','pericles','elizabeth','ashoka','peter'];
const reworkedLeaderCache=new Map();
export function leaderFor(player){const original=LEADERS.find(l=>l.key===player.leaderKey)||LEGACY_LEADERS.find(l=>l.key===player.leaderKey)||LEADERS.find(l=>l.key===DEFAULT_LEADER_KEYS[player.id])||LEADERS[0];if(player.leaderRulesVersion!==2||!REWORKED_LEADERS[original.key])return original;if(!reworkedLeaderCache.has(original.key)){const next=REWORKED_LEADERS[original.key];reworkedLeaderCache.set(original.key,{...original,...next,effects:next.active?.effects||{}});}return reworkedLeaderCache.get(original.key);}
export function selectLeaderKeys(count,requested){
  if(requested!==undefined&&(!Array.isArray(requested)||requested.length!==count||requested.some(k=>!LEADERS.some(l=>l.key===k))||new Set(requested).size!==count))throw new Error('每个国家需要选择一位不同的历史领袖。');
  return requested?[...requested]:[...DEFAULT_LEADER_KEYS,...LEADERS.map(l=>l.key).filter(k=>!DEFAULT_LEADER_KEYS.includes(k))].slice(0,count);
}
export function leaderEffects(player,time){const leader=leaderFor(player),effects={...leader.passive?.effects};if((player.leaderAbility?.activeUntil||0)>time)for(const [key,n]of Object.entries(leader.effects))effects[key]=(effects[key]||0)+n;return effects;}
export function nationalEffects(player,time){const effects={...NATIONAL_POLICIES[player.doctrine||'balanced']?.effects};for(const [k,n]of Object.entries(leaderEffects(player,time)))effects[k]=(effects[k]||0)+n;if(player.ageEffects)for(const [k,n]of Object.entries(player.ageEffects))effects[k]=(effects[k]||0)+n;return effects;}
export const TERRAINS = {
  ocean:{name:'深海',color:'#193e53',food:1,production:0,gold:0},
  coast:{name:'浅海',color:'#459f9f',food:1,production:0,gold:1},
  grass:{name:'草原',color:'#74946b',food:2,production:0,gold:0},
  plains:{name:'平原',color:'#aaa078',food:1,production:1,gold:0},
  desert:{name:'沙漠',color:'#c4ad7d',food:0,production:0,gold:0},
  tundra:{name:'冻土',color:'#8b9791',food:1,production:0,gold:0},
  snow:{name:'雪原',color:'#c5d0ce',food:0,production:0,gold:0},
  mountain:{name:'山脉',color:'#838c87',food:0,production:0,gold:0}
};
export const RESOURCES = {
  wheat:{name:'小麦',icon:'♣',food:1,improvement:'farm',category:'bonus'},
  cattle:{name:'牛群',icon:'♉',food:1,production:1,improvement:'pasture',category:'bonus'},
  deer:{name:'鹿群',icon:'♧',food:1,production:1,improvement:'camp',category:'bonus'},
  fish:{name:'鱼群',icon:'≈',food:2,improvement:'fishery',category:'bonus'},
  stone:{name:'石材',icon:'▰',production:1,improvement:'quarry',category:'bonus'},
  iron:{name:'铁矿',icon:'⬡',production:1,improvement:'mine',category:'strategic',tech:'bronze'},
  horses:{name:'马匹',icon:'♞',food:1,production:1,improvement:'pasture',category:'strategic',tech:'animal'},
  gold:{name:'黄金',icon:'◆',gold:3,improvement:'mine',category:'luxury'},
  gems:{name:'宝石',icon:'♦',gold:2,improvement:'mine',category:'luxury'},
  spices:{name:'香料',icon:'✤',food:1,gold:2,improvement:'plantation',category:'luxury'},
  silk:{name:'丝绸',icon:'❦',culture:1,gold:2,improvement:'plantation',category:'luxury'},
  oil:{name:'石油',icon:'●',production:2,improvement:'well',category:'strategic',tech:'combustion'},
  uranium:{name:'铀矿',icon:'☢',science:1,production:2,improvement:'mine',category:'strategic',tech:'atomic'}
};
export function resourceRevealed(resource,player){const spec=RESOURCES[resource];return !!spec&&(!spec.tech||(player?.techs||[]).includes(spec.tech));}
export const IMPROVEMENTS = {
  farm:{name:'农场',food:2,production:0},mine:{name:'矿山',production:2,tech:'mining'},
  pasture:{name:'牧场',food:1,production:1,tech:'animal'},camp:{name:'营地',food:1,gold:1,tech:'animal'},
  quarry:{name:'采石场',production:2,tech:'masonry'},plantation:{name:'种植园',gold:2,culture:1,tech:'irrigation'},
  fishery:{name:'渔场',food:2,gold:1,tech:'sailing'},well:{name:'油井',production:3,gold:2,tech:'combustion'},
  lumbermill:{name:'伐木场',production:2,tech:'machinery'}
};
// Flight opens rural tourism; cultural plantations also attract visitors earlier.
export function improvementTourism(tile,player){if(tile.pillaged||!tile.improvement)return 0;const imp=IMPROVEMENTS[tile.improvement];return player.techs.includes('flight')?Math.max(1,imp?.culture||0):player.techs.includes('printing')?imp?.culture||0:0;}
export function improvementName(tile,item=tile?.improvement){
  if(item==='pasture'&&tile?.resource==='horses')return '养马场';
  if(item==='plantation'&&tile?.resource==='silk')return '桑园与蚕舍';
  return IMPROVEMENTS[item]?.name||item||'';
}
const tech = (name,cost,era,requires,description,eureka) => ({name,cost,era,requires,description,eureka});
export const TECHS = {
  pottery:tech('制陶术',22,0,[],'解锁粮仓。','建造第一座城市'),
  animal:tech('畜牧业',24,0,[],'解锁牧场、营地，揭示马匹。','发现牛群'),
  mining:tech('采矿业',26,0,[],'解锁矿山；建造者可以砍伐森林。','建造第一座矿山'),
  sailing:tech('航海术',30,0,[],'解锁桨帆船、渔场；轻型陆军可乘木船渡海。','在沿海建立城市'),
  writing:tech('文字',38,0,['pottery'],'解锁学院与图书馆。','遇见另一文明'),
  archery:tech('弓箭',35,0,['animal'],'解锁弓箭手。','击败一个单位'),
  irrigation:tech('灌溉',34,0,['pottery'],'解锁种植园。','改良一块资源'),
  masonry:tech('砌砖',42,0,['mining'],'解锁城墙、采石场与金字塔。','发现石材'),
  bronze:tech('青铜铸造',48,0,['mining'],'解锁矛兵，揭示铁矿；建造者可以清理雨林。','拥有三个军事单位'),
  currency:tech('货币',65,1,['writing'],'解锁商业中心与市场。','运行一条贸易路线'),
  horseback:tech('骑马',65,1,['animal','archery'],'解锁骑手。','改良马匹'),
  ironwork:tech('炼铁',75,1,['bronze'],'解锁剑士。','改良铁矿'),
  engineering:tech('工程',80,1,['masonry','archery'],'解锁水渠与投石机，过河无额外耗费。','建造城墙'),
  celestial:tech('天文导航',70,1,['sailing','writing'],'解锁港口、灯塔，所有单位可穿越深海。','建立两座沿海城市'),
  education:tech('教育',110,2,['currency','engineering'],'解锁大学。','拥有两座学院'),
  apprenticeship:tech('学徒',100,2,['currency','bronze'],'解锁披甲战士、工业区和工坊；矿山 +1 生产力。','拥有三个矿山'),
  machinery:tech('机械',110,2,['engineering','ironwork'],'解锁弩手与森林伐木场；保留树木并增加生产力。','拥有三个弓箭手'),
  stirrups:tech('马镫',115,2,['horseback','ironwork'],'解锁骑士。','拥有两个骑手'),
  printing:tech('印刷术',145,3,['education','machinery'],'文化旅游 +25%，解锁艺术馆。','拥有两座大学'),
  gunpowder:tech('火药',150,3,['apprenticeship','stirrups'],'解锁火枪手。','建造工坊'),
  astronomy:tech('天文学',160,3,['education','celestial'],'学院 +2 科技，解锁大观星台。','拥有山脉相邻的学院'),
  industrial:tech('工业化',195,4,['massproduction','scientifictheory'],'解锁工厂；工业区 +2 生产力。','拥有两座工坊'),
  ballistics:tech('弹道学',185,4,['gunpowder','machinery'],'解锁野战炮与胸甲骑兵。','拥有两个弩手'),
  steam:tech('蒸汽动力',195,4,['industrial','metalcasting'],'解锁护卫舰与重型海运；坦克、重炮可乘运输船渡海，贸易收益提升。','建造港口'),
  electricity:tech('电力',230,5,['steam','scientifictheory'],'解锁战列舰、潜艇、研究实验室，城市 +2 科技。','拥有两座工厂'),
  combustion:tech('内燃机',240,5,['steam','metalcasting'],'揭示石油，解锁坦克。','拥有野战炮'),
  flight:tech('飞行',250,5,['electricity','combustion'],'旅游翻倍，解锁机场、老式战斗机、老式轰炸机与高射炮。','建造奇观'),
  rocketry:tech('火箭学',280,6,['flight','refining'],'解锁火箭炮与航天中心；卫星项目还需卫星技术。','拥有研究实验室'),
  atomic:tech('原子理论',285,6,['electricity','scientifictheory'],'揭示铀矿，解锁核能实验室。','拥有三个研究实验室'),
  computers:tech('计算机',310,6,['radio','mathematics'],'科技 +20%，旅游 +50%，解锁机械化步兵。','文化每经济周期达到 50'),
  nanotech:tech('纳米技术',360,8,['rocketry','atomic','computers','robotics'],'解锁外星殖民项目。','完成登月项目'),
  astrology:{...tech('占星术',28,0,[],'每座城市 +1 信仰。',''),effects:{faith:1}},
  wheel:{...tech('轮子',38,0,['mining'],'每座城市 +1 生产力。',''),effects:{production:1}},
  mathematics:{...tech('数学',65,1,['writing','wheel'],'每座城市 +1 科技，解锁水磨。',''),effects:{science:1}},
  construction:{...tech('建造',72,1,['masonry','horseback'],'每座城市 +1 住房。',''),housing:1},
  shipbuilding:{...tech('造船',78,1,['sailing','bronze'],'每座城市 +1 金币。',''),effects:{gold:1}},
  militarytactics:{...tech('军事战术',98,2,['mathematics','bronze'],'解锁长枪兵；军事单位战斗力 +2。',''),combat:2},
  buttress:{...tech('扶壁',105,2,['construction','engineering'],'每座城市 +1 住房，解锁中世纪城墙。',''),housing:1},
  castles:{...tech('城堡',120,2,['buttress','ironwork'],'解锁追猎者与投石车；军事单位战斗力 +2。',''),combat:2},
  cartography:{...tech('制图学',135,3,['shipbuilding','education'],'每座城市 +2 金币。',''),effects:{gold:2}},
  banking:{...tech('银行业',145,3,['currency','education'],'每座城市 +3 金币，解锁银行。',''),effects:{gold:3}},
  massproduction:{...tech('批量生产',165,3,['apprenticeship','machinery'],'每座城市 +2 生产力，解锁造船厂与雨林伐木场（还需机械）。',''),effects:{production:2}},
  siege:{...tech('攻城战术',170,3,['castles','gunpowder'],'解锁射石炮与文艺复兴城墙。','')},
  metalcasting:{...tech('金属铸造',175,3,['gunpowder','machinery'],'每座城市 +2 生产力。',''),effects:{production:2}},
  scientifictheory:{...tech('科学理论',190,4,['printing','astronomy'],'每座城市 +2 科技。',''),effects:{science:2}},
  militaryscience:{...tech('军事科学',205,4,['ballistics','militarytactics'],'解锁近代骑兵；军事单位战斗力 +2。',''),combat:2},
  sanitation:{...tech('卫生设备',200,4,['scientifictheory','construction'],'每座城市 +2 食物、+2 住房，解锁下水道。',''),effects:{food:2},housing:2},
  rifling:{...tech('膛线',215,4,['militaryscience','metalcasting'],'解锁步枪兵。','')},
  economics:{...tech('经济学',210,4,['banking','scientifictheory'],'每座城市 +4 金币，解锁证券交易所。',''),effects:{gold:4}},
  steel:{...tech('钢铁',235,5,['rifling','industrial'],'每座城市 +3 生产力，解锁重型火炮。',''),effects:{production:3}},
  refining:{...tech('精炼技术',245,5,['combustion','scientifictheory'],'每座城市 +2 生产力。',''),effects:{production:2}},
  radio:{...tech('无线电',245,5,['electricity','scientifictheory'],'每座城市 +3 文化，解锁广播中心。',''),effects:{culture:3}},
  advflight:{...tech('高级航空',275,6,['flight','radio','refining'],'每座城市 +2 科技、+2 生产力，解锁喷气战斗机。',''),effects:{science:2,production:2}},
  combinedarms:{...tech('联合作战',290,6,['steel','refining'],'军事单位战斗力 +3，解锁混凝土军事化城墙。',''),combat:3},
  advballistics:{...tech('高级弹道学',300,6,['ballistics','combinedarms'],'军事单位战斗力 +3，解锁混凝土军事化城墙。',''),combat:3},
  nuclearfission:{...tech('核裂变',315,6,['atomic','scientifictheory'],'每座城市 +4 生产力，解锁核电站、原子弹与核弹发射井。',''),effects:{production:4}},
  telecommunications:{...tech('电信',330,7,['computers','satellites'],'每座城市 +4 科技。',''),effects:{science:4}},
  satellites:{...tech('卫星技术',340,6,['rocketry','computers'],'每座城市 +3 科技，解锁人造卫星与载人登月项目；实际发射卫星后无人机射程提升。',''),effects:{science:3}},
  lasers:{...tech('激光',350,7,['atomic','computers'],'军事单位战斗力 +4。',''),combat:4},
  robotics:{...tech('机器人技术',360,7,['computers','steel','guidance','advflight'],'每座城市 +4 生产力，解锁一次性攻击无人机、隐身战斗机与隐身轰炸机。',''),effects:{production:4}},
  fusion:{...tech('核聚变',380,8,['nuclearfission','lasers'],'每座城市 +5 生产力、+3 科技。',''),effects:{production:5,science:3}},
  futuretech:{...tech('未来科技',420,8,['nanotech','fusion','telecommunications'],'每座城市 +8 科技、+4 生产力；机甲解锁三格远程火炮与动力跳跃。',''),effects:{science:8,production:4}}
};
const civic = (name,cost,era,requires,description) => ({name,cost,era,requires,description});
TECHS.composites=tech('复合装甲',310,6,['combustion','atomic'],'解锁主战坦克。','');
TECHS.guidance=tech('精确制导',340,7,['rocketry','telecommunications'],'解锁导弹巡洋舰、核潜艇与防空导弹。','');
export const CIVICS = {
  code:civic('法典',18,0,[],'解锁纪律、城市规划政策。'),
  craftsmanship:civic('技艺',30,0,['code'],'解锁农业、工匠政策。'),
  trade:civic('对外贸易',30,0,['code'],'解锁商队、贸易政策。'),
  mysticism:civic('神秘主义',32,0,['code'],'解锁圣地、神谕政策。'),
  empire:civic('早期帝国',46,0,['craftsmanship','trade'],'解锁殖民政策并开始管理边境。此后外国单位需要开放边界、联盟或战争通行。'),
  state:civic('政治哲学',65,1,['empire','mysticism'],'解锁三种政府。'),
  drama:civic('戏剧诗歌',62,1,['craftsmanship','mysticism'],'解锁剧院、圆形剧场。'),
  theology:civic('神学',88,2,['state','mysticism'],'解锁寺庙、传教士。'),
  feudalism:civic('封建主义',98,2,['state','drama'],'农场 +1 食物，解锁农奴制政策。'),
  civilservice:civic('行政制度',110,2,['state','trade'],'解锁联盟、专家政策。'),
  exploration:civic('探索',135,3,['feudalism','civilservice'],'解锁商人共和国。'),
  humanism:civic('人文主义',150,3,['drama','civilservice'],'解锁艺术馆、旅游项目。'),
  nationalism:civic('民族主义',180,4,['exploration','humanism'],'解锁民族动员，军事 +5 战斗力。'),
  economy:civic('政治经济学',195,4,['exploration','feudalism'],'解锁资本主义政策。'),
  ideology:civic('意识形态',235,5,['nationalism','economy'],'解锁民主、共产主义、法西斯政府。'),
  media:civic('大众传媒',245,5,['humanism','economy'],'文化 +20%，旅游 +25%。'),
  globalization:civic('全球化',300,7,['ideology','media'],'贸易 +4 金币，解锁全球文化节。'),
  militarytradition:{...civic('军事传统',35,0,['craftsmanship'],'军事单位战斗力 +1。'),combat:1},
  workforce:{...civic('国家劳动力',40,0,['craftsmanship'],'每座城市 +1 生产力。'),effects:{production:1}},
  games:{...civic('游戏与娱乐',65,1,['state'],'每座城市 +1 文化，解锁娱乐中心。'),effects:{culture:1}},
  defensive:{...civic('防御战术',75,1,['games','militarytradition'],'军事单位战斗力 +1。'),combat:1},
  recordedhistory:{...civic('历史记录',75,1,['drama','state'],'每座城市 +1 科技、+1 文化。'),effects:{science:1,culture:1}},
  training:{...civic('军事训练',85,1,['militarytradition','state'],'解锁常备军政策。')},
  navaltradition:{...civic('海军传统',110,2,['defensive','trade'],'每座城市 +2 金币。'),effects:{gold:2}},
  mercenaries:{...civic('雇佣兵',120,2,['feudalism','training'],'军事单位战斗力 +2。'),combat:2},
  guilds:{...civic('行会',125,2,['feudalism','civilservice'],'每座城市 +2 生产力、+1 金币。'),effects:{production:2,gold:1}},
  monarchy:civic('君主制',140,3,['theology','civilservice'],'解锁君主政体。'),
  divine:civic('王权神授',145,3,['monarchy','theology'],'解锁神权政体。'),
  reform:{...civic('宗教改革',150,3,['divine','exploration'],'每座城市 +3 信仰。'),effects:{faith:3}},
  diplomacy:{...civic('外交部门',155,3,['civilservice','guilds'],'每座城市 +2 文化。'),effects:{culture:2}},
  enlightenment:{...civic('启蒙运动',170,3,['humanism','diplomacy'],'每座城市 +2 科技，解锁公共教育政策。'),effects:{science:2}},
  opera:{...civic('歌剧与芭蕾',175,4,['humanism','enlightenment'],'每座城市 +3 文化，解锁歌剧院。'),effects:{culture:3}},
  colonialism:{...civic('殖民主义',185,4,['exploration','diplomacy'],'每座城市 +3 金币。'),effects:{gold:3}},
  urbanization:{...civic('城市化',195,4,['economy','guilds'],'每座城市 +2 住房，解锁社区。'),housing:2},
  engineeringcorps:{...civic('土木工程',205,4,['urbanization','nationalism'],'每座城市 +3 生产力。'),effects:{production:3}},
  conservation:{...civic('自然保护',215,4,['enlightenment','urbanization'],'每座城市 +2 文化，解锁国家公园。'),effects:{culture:2}},
  mobilization:{...civic('动员',245,5,['nationalism','engineeringcorps'],'军事单位战斗力 +3。'),combat:3},
  suffrage:{...civic('选举权',250,5,['ideology','urbanization'],'每座城市 +3 文化。'),effects:{culture:3}},
  classstruggle:{...civic('阶级斗争',250,5,['ideology','guilds'],'每座城市 +3 生产力。'),effects:{production:3}},
  totalitarian:{...civic('极权主义',250,5,['ideology','mobilization'],'军事单位战斗力 +3。'),combat:3},
  coldwar:{...civic('冷战',275,6,['ideology','mobilization'],'每座城市 +2 科技、+2 文化。'),effects:{science:2,culture:2}},
  professional:{...civic('职业体育',285,6,['media','conservation'],'每座城市 +3 文化，解锁体育场。'),effects:{culture:3}},
  rapiddeployment:{...civic('快速部署',290,6,['coldwar','engineeringcorps'],'军事单位战斗力 +3。'),combat:3},
  socialmedia:{...civic('社交媒体',310,7,['media','coldwar'],'每座城市 +5 文化。'),effects:{culture:5}},
  environmentalism:{...civic('环境保护',320,7,['conservation','globalization'],'每座城市 +2 食物、+3 文化。'),effects:{food:2,culture:3}},
  nearfuture:civic('近未来治理',345,8,['globalization','socialmedia'],'解锁数字民主与合成政体。'),
  futurecivic:{...civic('未来市政',400,8,['nearfuture','environmentalism','rapiddeployment'],'每座城市 +6 文化、+3 科技。'),effects:{culture:6,science:3}}
};
export const GOVERNMENTS = {
  chiefdom:{name:'酋邦',slots:2,description:'两个政策槽位。'},
  republic:{name:'古典共和',slots:3,civic:'state',culture:0.15,description:'文化 +15%，每城 +1 宜居度。'},
  oligarchy:{name:'寡头政体',slots:3,civic:'state',combat:4,description:'军事单位战斗力 +4。'},
  autocracy:{name:'独裁政体',slots:3,civic:'state',production:0.15,description:'生产力 +15%。'},
  merchant:{name:'商人共和国',slots:4,civic:'exploration',gold:0.2,description:'金币 +20%，贸易容量 +2。'},
  democracy:{name:'民主主义',slots:5,civic:'ideology',culture:0.25,gold:0.2,description:'文化 +25%，金币 +20%。'},
  communism:{name:'共产主义',slots:5,civic:'ideology',science:0.15,production:0.25,description:'科技 +15%，生产力 +25%。'},
  fascism:{name:'法西斯主义',slots:5,civic:'ideology',combat:8,description:'军事单位战斗力 +8。'},
  monarchy:{name:'君主制',slots:4,civic:'monarchy',production:.2,description:'生产力 +20%。'},
  theocracy:{name:'神权政体',slots:4,civic:'divine',faith:.3,description:'信仰 +30%。'},
  digital:{name:'数字民主',slots:6,civic:'nearfuture',science:.2,culture:.35,description:'科技 +20%，文化 +35%。'},
  synthetic:{name:'合成政体',slots:6,civic:'nearfuture',production:.35,gold:.2,description:'生产力 +35%，金币 +20%。'}
};
export const POLICIES = {
  urban:{name:'城市规划',civic:'code',description:'每座城市 +2 生产力。'},
  discipline:{name:'纪律',civic:'code',description:'对蛮族 +8 战斗力。'},
  agriculture:{name:'农业',civic:'craftsmanship',description:'每座城市 +2 食物。'},
  craftsmen:{name:'工匠',civic:'craftsmanship',description:'建造者生产 +50%。'},
  caravans:{name:'商旅',civic:'trade',description:'每条贸易路线 +3 金币。'},
  revelation:{name:'神谕',civic:'mysticism',description:'每座城市 +2 信仰。'},
  colonization:{name:'殖民',civic:'empire',description:'开拓者生产 +50%。'},
  conscription:{name:'征兵',civic:'state',description:'军事单位维护费减半。'},
  natural:{name:'自然哲学',civic:'state',description:'学院相邻加成翻倍。'},
  serfdom:{name:'农奴制',civic:'feudalism',description:'新建造者额外两次使用次数。'},
  specialists:{name:'专家',civic:'civilservice',description:'每座区域 +1 科技与 +1 文化。'},
  grandarmy:{name:'民族动员',civic:'nationalism',description:'军事单位生产 +35%。'},
  capitalism:{name:'资本主义',civic:'economy',description:'金币 +25%。'},
  heritage:{name:'文化遗产',civic:'humanism',description:'旅游 +40%。'},
  rationalism:{name:'理性主义',civic:'ideology',description:'科技 +25%。'},
  standingarmy:{name:'常备军',civic:'training',productionMilitary:.2,description:'军事单位生产 +20%。'},
  publiceducation:{name:'公共教育',civic:'enlightenment',effects:{science:3},description:'每座城市 +3 科技。'},
  publicworks:{name:'公共工程',civic:'engineeringcorps',effects:{production:3},description:'每座城市 +3 生产力。'},
  broadcasts:{name:'公共广播',civic:'media',effects:{culture:3},description:'每座城市 +3 文化。'},
  welfare:{name:'社会福利',civic:'suffrage',effects:{food:3},description:'每座城市 +3 食物。'},
  internationaltrade:{name:'国际贸易',civic:'globalization',effects:{gold:5},description:'每座城市 +5 金币。'},
  bastions:{name:'边境防卫',civic:'defensive',homeCombat:3,description:'军事单位在本国领土防御时 +3 战斗力。'},
  logistics:{name:'军事后勤',civic:'mobilization',productionMilitary:.15,effects:{production:1},description:'军事生产 +15%，每城 +1 生产力。'},
  embassies:{name:'使馆网络',civic:'trade',effects:{culture:1},description:'每座城市 +1 文化。外交槽政策。'},
  diplomaticleague:{name:'外交联盟',civic:'state',congressVotes:1,description:'国际大会每项议题额外获得 1 票。'},
  mediation:{name:'常设调停',civic:'diplomacy',effects:{faith:2,culture:1},description:'每座城市 +2 信仰、+1 文化。外交槽政策。'},
  collectiveaction:{name:'集体行动',civic:'globalization',congressVotes:1,effects:{gold:1},description:'国际大会每项议题额外获得 1 票，每城 +1 金币。'},
  publicresearch:{name:'学术自由',civic:'recordedhistory',effects:{science:2},description:'每座城市 +2 科技。通配政策。'}
};
export const POLICY_TYPES={military:'军事',economic:'经济',diplomatic:'外交',wildcard:'通配'};
const policyKinds={military:['discipline','conscription','grandarmy','standingarmy','bastions','logistics'],diplomatic:['embassies','diplomaticleague','mediation','collectiveaction'],wildcard:['publicresearch']};
for(const [key,spec]of Object.entries(POLICIES))spec.type=Object.entries(policyKinds).find(([,keys])=>keys.includes(key))?.[0]||'economic';
const governmentKinds={chiefdom:[1,1,0,0],republic:[0,2,0,1],oligarchy:[1,1,0,1],autocracy:[2,1,0,0],merchant:[1,2,1,0],monarchy:[2,1,0,1],theocracy:[1,2,0,1],democracy:[1,2,1,1],communism:[2,2,0,1],fascism:[3,1,0,1],digital:[1,2,1,2],synthetic:[2,2,0,2]};
for(const [key,spec]of Object.entries(GOVERNMENTS))spec.slotTypes=Object.fromEntries(Object.keys(POLICY_TYPES).map((type,i)=>[type,governmentKinds[key][i]]));
export function governmentSlots(game,player,government=player.government){const types=GOVERNMENTS[government]?.slotTypes;if(!types)return [];const slots=Object.entries(types).flatMap(([type,n])=>Array(n).fill(type));for(const [key,type]of [['forbidden','wildcard'],['alhambra','military'],['potala_palace','diplomatic'],['big_ben','economic']]){const w=game.wonders?.[key];if(w&&game.cities.some(c=>c.id===w.city&&c.owner===player.id)&&!game.map.tiles[w.tile]?.pillaged)slots.push(type);}return slots;}
export function assignPolicyCards(game,player,items,government=player.government){const slots=governmentSlots(game,player,government),remaining=[...items],assigned=slots.map(type=>({type,card:null}));for(const slot of assigned.filter(s=>s.type!=='wildcard')){const i=remaining.findIndex(k=>POLICIES[k]?.type===slot.type);if(i>=0)slot.card=remaining.splice(i,1)[0];}for(const slot of assigned.filter(s=>s.type==='wildcard'))if(remaining.length)slot.card=remaining.shift();return {slots:assigned,remaining};}
export const CITY_MAX_HP=200;
export const WALL_TIERS=[null,{key:'ancient',name:'远古城墙',building:'walls'},{key:'medieval',name:'中世纪城墙',building:'medievalwalls'},{key:'renaissance',name:'文艺复兴城墙',building:'renaissancewalls'},{key:'concrete',name:'混凝土军事化城墙',building:'steelwalls'}];
export function cityWallTier(city){const level=Math.max(0,Math.min(4,city.wallLevel||0),...(city.buildings||[]).map(key=>BUILDINGS[key]?.wallLevel||0));return WALL_TIERS[level]||((city.walls||0)>0?WALL_TIERS[1]:null);}
export function cityWallCapacity(city){const base=Math.max(city.wallMax||0,(city.buildings||[]).reduce((n,key)=>n+(BUILDINGS[key]?.defense||0),0));return base?base+Object.values(city.heritageEffects||{}).reduce((n,e)=>n+(e.wallCapacity||0),0):0;}
export function cityDefense(city){const hp=Math.max(0,Math.min(CITY_MAX_HP,city.hp)),walls=Math.max(0,city.walls||0),maxWalls=Math.max(walls,cityWallCapacity(city)),tier=cityWallTier(city);return {hp,maxHp:CITY_MAX_HP,walls,maxWalls,hasWalls:maxWalls>0,tier};}
// Early ranged models retain their field damage but have weaker city bombardment.
export function cityDamageMultiplier(type){const spec=UNITS[type],era=TECHS[spec?.tech]?.era??CIVICS[spec?.civic]?.era??0;return spec?.ranged&&era<=3?(spec.siege?.75:.5):1;}
// Apply the early-model reduction once, retaining wall specialties and tier mismatch.
export function siegeMatchesWall(type,city,player){const spec=UNITS[type],tier=cityWallTier(city),level=tier?WALL_TIERS.indexOf(tier):1,flex=player?leaderFor(player).passive?.effects?.siegeTierFlex||0:0;return !!spec?.siegeTier&&(spec.siegeTier===level||level===spec.siegeTier+1&&!!flex);}
export function wallDamageMultiplier(type,city,player,context={}){const spec=UNITS[type],tier=cityWallTier(city),level=tier?WALL_TIERS.indexOf(tier):1;if(spec?.siege&&spec.siegeTier)return 1.75*(siegeMatchesWall(type,city,player)?1:.5)*cityDamageMultiplier(type);if(context.ram&&level===1)return 1;return spec?.ancientWallDamage&&level===1&&context.wallSpecialty?spec.ancientWallDamage*cityDamageMultiplier(type):0;}
export function cityAttackDamage(type,city,raw,player,context={}){if(city.walls>0&&context.tower&&WALL_TIERS.indexOf(cityWallTier(city))<=2){const cityDamage=Math.min(city.hp,raw);return {wallDamage:0,cityDamage,total:cityDamage};}if(city.walls<=0){const multiplier=cityDamageMultiplier(type),dealt=multiplier===1?raw:Math.max(1,Math.round(raw*multiplier)),cityDamage=Math.min(city.hp,dealt);return {wallDamage:0,cityDamage,total:cityDamage};}const multiplier=wallDamageMultiplier(type,city,player,context),dealt=multiplier?Math.max(1,Math.round(raw*multiplier)):1,wallDamage=Math.min(city.walls,dealt),cityDamage=multiplier?Math.min(city.hp,Math.max(0,dealt-city.walls)):0;return {wallDamage,cityDamage,total:wallDamage+cityDamage};}
export function unitHasRanged(player,type){const s=UNITS[type];return !!s?.ranged&&(!s.rangedTech||!!player?.techs?.includes(s.rangedTech));}
export function occupationUnit(type){const spec=UNITS[type];return !!spec&&!spec.civilian&&(!spec.ranged||!!spec.canCapture)&&spec.strength>0;}
export const UNITS = {
  herbalist:{name:'草药医师',cost:46,moves:2,strength:0,civilian:true,medical:12,tech:'pottery',icon:'❧',description:'远古医疗支援：相邻己方陆军恢复 12 生命，施术 2 秒、冷却 12 秒。不能攻击或占城。'},
  surgeon:{name:'随军外科医师',cost:78,moves:2,strength:0,civilian:true,medical:18,tech:'education',icon:'❧',description:'中古医疗支援：相邻己方陆军恢复 18 生命，施术 2 秒、冷却 12 秒。不能攻击或占城。'},
  fieldmedic:{name:'战地医疗队',cost:115,moves:3,strength:0,civilian:true,medical:24,tech:'scientifictheory',icon:'❧',description:'工业医疗支援：相邻己方陆军恢复 24 生命，施术 2 秒、冷却 12 秒。不能攻击或占城。'},
  ambulance:{name:'机械化医疗车',cost:165,moves:4,strength:0,civilian:true,medical:32,tech:'combustion',resource:'oil',icon:'❧',description:'现代医疗支援：相邻己方陆军恢复 32 生命，施术 2 秒、冷却 12 秒。需要石油，不能攻击或占城。'},
  envoy:{name:'来使',cost:0,moves:3,strength:0,civilian:true,vision:2,icon:'☀'},
  settler:{name:'开拓者',cost:54,moves:2,strength:0,civilian:true,icon:'⚑'},
  builder:{name:'建造者',cost:32,moves:2,strength:0,civilian:true,charges:3,icon:'⚒'},
  scout:{name:'侦察兵',cost:24,moves:3,strength:12,vision:3,icon:'⌖'},
  warrior:{name:'勇士',cost:30,moves:2,strength:23,icon:'⚔'},
  archer:{name:'弓箭手',cost:42,moves:2,strength:15,ranged:22,range:2,tech:'archery',icon:'➶'},
  spearman:{name:'矛兵',cost:42,moves:2,strength:29,antiCavalry:14,tech:'bronze',icon:'↑'},
  swordsman:{name:'剑士',cost:58,moves:2,strength:38,tech:'ironwork',resource:'iron',icon:'⚔'},
  horseman:{name:'骑手',cost:58,moves:4,strength:36,class:'cavalry',tech:'horseback',resource:'horses',icon:'♞'},
  catapult:{name:'投石机',cost:68,moves:2,strength:20,ranged:42,range:2,siege:true,siegeTier:1,tech:'engineering',icon:'♜'},
  trebuchet:{name:'投石车',cost:88,moves:2,strength:28,ranged:50,range:2,siege:true,siegeTier:2,tech:'castles',icon:'♜'},
  crossbow:{name:'弩手',cost:76,moves:2,strength:29,ranged:43,range:2,tech:'machinery',icon:'➶'},
  knight:{name:'骑士',cost:90,moves:4,strength:50,class:'cavalry',tech:'stirrups',resource:'horses',icon:'♞'},
  musket:{name:'火枪手',cost:95,moves:2,strength:57,tech:'gunpowder',icon:'⚔'},
  cannon:{name:'野战炮',cost:130,moves:2,strength:42,ranged:62,range:3,tech:'ballistics',icon:'⊕'},
  tank:{name:'坦克',cost:175,moves:4,strength:82,tech:'combustion',resource:'oil',icon:'▰'},
  galley:{name:'桨帆船',cost:45,moves:3,strength:30,domain:'sea',tech:'sailing',icon:'⚓'},
  frigate:{name:'护卫舰',cost:125,moves:4,strength:55,ranged:68,range:3,domain:'sea',tech:'steam',icon:'⚓'},
  missionary:{name:'传教士',cost:48,moves:3,strength:0,civilian:true,charges:3,icon:'☼'},
  rifleman:{name:'步枪兵',cost:140,moves:2,strength:68,tech:'rifling',icon:'⚔'},
  bombard:{name:'射石炮',cost:108,moves:2,strength:34,ranged:57,range:2,siege:true,siegeTier:3,tech:'siege',icon:'⊕'},
  destroyer:{name:'驱逐舰',cost:190,moves:5,strength:82,antiSubmarine:20,domain:'sea',tech:'steel',resource:'oil',icon:'⚓',description:'海军近战与护航，对潜艇防守 +20 战斗力；可用反潜武器攻击已探测潜艇，可占领已攻破的沿海城市。'},
  slinger:{name:'投石兵',cost:22,moves:2,strength:8,ranged:15,range:1,icon:'➶'},
  pikeman:{name:'长枪兵',cost:74,moves:2,strength:46,antiCavalry:14,tech:'militarytactics',icon:'↑'},
  manatarms:{name:'披甲战士',cost:78,moves:2,strength:47,tech:'apprenticeship',resource:'iron',icon:'⚔'},
  courser:{name:'追猎者',cost:82,moves:5,strength:46,class:'cavalry',tech:'castles',resource:'horses',icon:'♞'},
  cuirassier:{name:'胸甲骑兵',cost:125,moves:4,strength:65,class:'cavalry',tech:'ballistics',resource:'horses',icon:'♞'},
  cavalry:{name:'近代骑兵',cost:138,moves:5,strength:70,class:'cavalry',tech:'militaryscience',resource:'horses',icon:'♞'},
  artillery:{name:'重型火炮',cost:190,moves:2,strength:55,ranged:84,range:4,siege:true,siegeTier:4,tech:'steel',resource:'oil',icon:'⊕'},
  bomber:{name:'老式轰炸机',cost:240,moves:1,strength:65,ranged:95,range:8,rebaseRange:12,domain:'air',siege:true,siegeTier:4,tech:'flight',building:'airport',resource:'oil',icon:'✈',description:'驻扎机场，射程 8 格；转场 12 格。专攻混凝土军事化城墙，其他等级破墙伤害减半，不能占城。'},
  battleship:{name:'战列舰',cost:230,moves:4,strength:78,ranged:92,range:5,domain:'sea',tech:'electricity',resource:'oil',icon:'⚓'},
  infantry:{name:'现代步兵',cost:185,moves:3,strength:84,tech:'combinedarms',icon:'⚔'},
  mechanized:{name:'机械化步兵',cost:240,moves:4,strength:98,tech:'computers',resource:'oil',icon:'▰'},
  modernarmor:{name:'主战坦克',cost:295,moves:5,strength:110,tech:'composites',resource:'oil',icon:'▰'},
  rocketartillery:{name:'火箭炮',cost:310,moves:3,strength:62,ranged:104,range:4,siege:true,siegeTier:4,tech:'rocketry',resource:'oil',icon:'⊕'},
  missilecruiser:{name:'导弹巡洋舰',cost:325,moves:5,strength:90,ranged:118,range:6,domain:'sea',tech:'guidance',resource:'oil',icon:'⚓'},
  assaultship:{name:'两栖突击舰',cost:285,moves:5,strength:105,antiSubmarine:20,domain:'sea',tech:'combinedarms',resource:'oil',icon:'⚓',description:'现代海军近战与登陆舰，对潜艇防守 +20 战斗力；可用反潜武器攻击已探测潜艇，可占领已攻破的沿海城市。'},
  submarine:{name:'潜艇',cost:190,moves:4,strength:65,ranged:78,range:2,domain:'sea',navalOnly:true,submarine:true,antiNaval:12,tech:'electricity',resource:'oil',icon:'⚓',description:'鱼雷射程 2 格，对舰船与水上运输队攻击 +12 战斗力。不能用鱼雷攻击陆地或城市；保持隐蔽；普通敌军相邻可发现，反潜舰艇可在 2 格探测，开火后暴露 20 秒。'},
  nuclearsubmarine:{name:'核潜艇',cost:350,moves:5,strength:88,ranged:106,range:3,domain:'sea',navalOnly:true,submarine:true,antiNaval:12,tech:'guidance',resource:'uranium',icon:'⚓',description:'鱼雷射程 3 格，对舰船与水上运输队攻击 +12 战斗力。可消耗原子弹库存执行 24 格核打击；不能用鱼雷攻击陆地或城市。'},
  drone:{name:'一次性攻击无人机',cost:95,maxHp:40,consumable:true,moves:1,strength:32,ranged:50,range:8,rebaseRange:16,domain:'air',siege:true,siegeTier:4,tech:'robotics',building:'airport',resource:'oil',icon:'✈'},
  apostle:{name:'使徒',cost:80,moves:3,strength:0,civilian:true,religious:true,charges:4,conversion:180,civic:'theology',icon:'☼'},
  inquisitor:{name:'宗教审判官',cost:70,moves:3,strength:0,civilian:true,religious:true,charges:3,conversion:150,civic:'reform',icon:'☼'}
};
Object.assign(UNITS,{
  skirmisher:{name:'散兵',cost:70,moves:3,strength:24,ranged:34,range:1,vision:3,recon:true,ignoreTerrain:true,tech:'machinery',icon:'⌖',description:'侦察兵升级；森林、雨林和丘陵不增加移动耗费。'},
  ranger:{name:'游骑侦察兵',cost:135,moves:3,strength:52,ranged:64,range:1,vision:4,recon:true,ignoreTerrain:true,tech:'rifling',icon:'⌖',description:'工业侦察部队，视野 4，穿行崎岖地形。'},
  specops:{name:'特种作战部队',cost:230,moves:4,strength:74,ranged:88,range:2,vision:4,recon:true,ignoreTerrain:true,tech:'advflight',icon:'⌖',description:'现代侦察与渗透，视野 4，穿行崎岖地形。'},
  machinegun:{name:'机关枪',cost:210,moves:2,strength:70,ranged:92,range:2,tech:'advballistics',icon:'➶',description:'野战炮的现代远程升级，擅长阵地火力支援。'},
  heavychariot:{name:'重型战车',cost:50,moves:3,strength:31,class:'cavalry',tech:'wheel',resource:'horses',icon:'♞',description:'轮式重骑兵先驱，升级为骑士。'},
  pikeandshot:{name:'枪刺与火铳',cost:95,moves:2,strength:55,antiCavalry:18,tech:'gunpowder',icon:'↑',description:'反骑兵 +18，承接长枪兵的文艺复兴升级。'},
  atcrew:{name:'反坦克组',cost:165,moves:2,strength:75,antiCavalry:25,tech:'combustion',icon:'↑',description:'对骑兵、坦克与主战坦克 +25 战斗力。'},
  modernat:{name:'现代反坦克组',cost:255,moves:3,strength:92,antiCavalry:32,tech:'composites',icon:'↑',description:'制导反坦克武器，对骑兵与装甲 +32 战斗力。'},
  quadrireme:{name:'四列桨战船',cost:58,moves:3,strength:22,ranged:28,range:2,domain:'sea',tech:'shipbuilding',icon:'⚓',description:'古典海军远程舰，升级为护卫舰。'},
  caravel:{name:'轻快帆船',cost:85,moves:4,strength:48,domain:'sea',tech:'cartography',icon:'⚓',description:'文艺复兴远洋近战舰，承接桨帆船与铁甲舰。'},
  privateer:{name:'私掠船',cost:110,moves:4,strength:42,ranged:50,range:2,domain:'sea',navalOnly:true,civic:'mercenaries',icon:'⚓',description:'海上突袭舰，只能攻击水上目标；可掠夺敌对商路，升级为潜艇。'},
  ironclad:{name:'铁甲舰',cost:145,moves:4,strength:66,domain:'sea',tech:'steam',resource:'iron',icon:'⚓',description:'工业蒸汽装甲近战舰，升级为驱逐舰。'},
  batteringram:{name:'攻城锤',cost:45,moves:2,strength:0,civilian:true,support:'ram',tech:'masonry',icon:'♜',description:'相邻己方近战和反骑兵攻击远古城墙时，恢复正常破墙伤害；不叠加。'},
  siegetower:{name:'攻城塔',cost:75,moves:2,strength:0,civilian:true,support:'tower',tech:'construction',icon:'♜',description:'相邻己方近战和反骑兵可绕过一、二级城墙，直接攻击城内；不能绕过三级以上城墙。'},
  militaryengineer:{name:'军工兵',cost:85,moves:2,strength:0,civilian:true,engineer:true,charges:3,tech:'apprenticeship',building:'barracks',icon:'⚒',description:'三次工务次数：修复、铺路、建造堡垒；沿用实际工务耗时与金币。'},
  balloon:{name:'观察气球',cost:120,moves:2,strength:0,civilian:true,support:'spotter',vision:3,tech:'flight',icon:'⌖',description:'一格内己方陆地攻城炮兵 +1 射程，取最高不叠加。'},
  observationdrone:{name:'侦察无人机',cost:180,moves:3,strength:0,civilian:true,support:'spotter',vision:4,tech:'robotics',icon:'⌖',description:'数字化炮兵侦校：一格内陆地攻城炮兵 +1 射程，视野 4；与攻击无人机分属不同单位。'},
  helicopter:{name:'直升机',cost:265,moves:6,strength:96,class:'cavalry',ignoreTerrain:true,tech:'composites',resource:'oil',icon:'✈',description:'轻骑兵终代，低空伴随地面部队，忽略崎岖地形；属于陆地战斗单位，仍受国境与水域规则约束。'},
  giantdeathrobot:{name:'巨型战斗机甲',cost:650,moves:4,strength:135,ranged:135,range:3,rangedTech:'futuretech',jumpTech:'futuretech',canCapture:true,tech:'fusion',resource:'uranium',icon:'▰',description:'核聚变解锁重型近战机甲；未来科技解锁三格远程火炮与动力跳跃。跳跃消耗 2 移动力，可跨越山水但只能落在合法陆地；远程攻击不能占城。'},
  archaeologist:{name:'考古学家',cost:150,moves:3,strength:0,civilian:true,charges:3,civic:'humanism',building:'museum',icon:'⚒',description:'在本国或无主古代遗迹发掘文物，放入有空位的本国艺术馆；消耗一次次数。'},
  naturalist:{name:'自然学家',cost:180,moves:3,strength:0,civilian:true,charges:1,faithOnly:true,civic:'conservation',icon:'♧',description:'以信仰招募，在本国合法空地建立国家公园，消耗此单位。公园沿用本项目单格区域规则。'},
  rockband:{name:'摇滚乐队',cost:200,moves:3,strength:0,civilian:true,charges:3,faithOnly:true,civic:'coldwar',icon:'♫',description:'以信仰招募，在已知非交战外邦城市或其剧院、娱乐区、奇观举办演出；每场向该国提供定向旅游影响。'},
  guru:{name:'上师',cost:90,moves:3,strength:0,civilian:true,religious:true,religiousHealer:true,charges:3,civic:'theology',icon:'☼',description:'以信仰招募，消耗一次次数为相邻同信仰宗教单位恢复 40 生命；两秒施术，十二秒治疗间隔。'},
  warriormonk:{name:'武僧',cost:90,moves:3,strength:42,faithOnly:true,civic:'theology',building:'temple',icon:'⚔',description:'寺庙城市以信仰招募的近战单位；本项目采用寺庙解锁，不额外占用既有宗教信条。'},
  fighter:{name:'老式战斗机',cost:180,moves:1,strength:58,ranged:80,range:6,rebaseRange:12,domain:'air',antiAir:true,airOnly:true,tech:'flight',building:'airport',resource:'oil',icon:'✈'},
  jetfighter:{name:'喷气战斗机',cost:260,moves:1,strength:76,ranged:100,range:12,rebaseRange:20,domain:'air',antiAir:true,airOnly:true,tech:'advflight',building:'airport',resource:'oil',icon:'✈'},
  stealthfighter:{name:'隐身战斗机',cost:340,moves:1,strength:94,ranged:120,range:12,rebaseRange:24,domain:'air',antiAir:true,airOnly:true,stealth:true,tech:'robotics',building:'airport',resource:'oil',icon:'✈'},
  stealthbomber:{name:'隐身轰炸机',cost:400,moves:1,strength:86,ranged:115,range:16,rebaseRange:24,domain:'air',siege:true,siegeTier:4,stealth:true,tech:'robotics',building:'airport',resource:'oil',icon:'✈'},
  antiair:{name:'高射炮',cost:140,moves:2,strength:45,ranged:72,range:4,antiAir:true,airOnly:true,tech:'flight',icon:'⊕'},
  sam:{name:'防空导弹',cost:220,moves:3,strength:65,ranged:105,range:6,antiAir:true,airOnly:true,missileDefense:true,tech:'guidance',icon:'⊕'},
  aircraftcarrier:{name:'航空母舰',cost:360,moves:4,strength:70,domain:'sea',tech:'combinedarms',resource:'oil',airCapacity:2,icon:'⚓',description:'联合作战解锁，可搭载两架飞机。与主力舰、护航舰、潜艇及舰载机在三格内组成战斗群：攻防 +20、射程 +2，重叠射程共享。'}
});
UNITS.missionary.religious=true;UNITS.missionary.conversion=100;
// Maintenance follows the model's equipment, not the owner's current era.
registerUniqueUnits(UNITS);
const equipmentCosts={aircraftcarrier:120,fighter:50,jetfighter:70,stealthfighter:100,bomber:65,stealthbomber:120,drone:6,antiair:30,sam:55,tank:50,modernarmor:80,mechanized:70,artillery:50,rocketartillery:65,galley:.72,frigate:15,destroyer:50,battleship:70,missilecruiser:100,assaultship:80,submarine:50,nuclearsubmarine:100,herbalist:0,surgeon:.96,fieldmedic:2.4,ambulance:30};
for(const [type,spec]of Object.entries(UNITS)){const era=TECHS[spec.tech]?.era??CIVICS[spec.civic]?.era??0;spec.salary=!spec.civilian||spec.medical?[3.6,4.2,5,6,8,10,12,14,16][era]:0;spec.maintenance=spec.salary?Math.round((equipmentCosts[baseItem(type)]??[0,.6,1.2,1.92,3.12,4.8,6.72,8.88,10.8][era])*100)/100:0;}
const heritageCommanderKeys=new Set(GREAT_PEOPLE.filter(p=>['general','admiral'].includes(p.classKey)).map(p=>p.key));
export function militaryPolicyMultiplier(player){return 1+Math.max(0,...Object.values(player?.heritageEffects||{}).map(e=>e.militaryPolicyEffectiveness||0));}
export function unitUpkeep(type,player={}){const spec=UNITS[type],effects=leaderFor(player).passive?.effects||{},war=Object.values(player.relations||{}).some(r=>r.status==='war'),land=(spec?.domain||'land')==='land',melee=land&&!spec?.civilian&&!spec?.ranged&&!spec?.siege&&spec?.class!=='cavalry'&&baseItem(type)!=='scout';let leaderDiscount=spec?.class==='cavalry'?effects.cavalryUpkeepDiscount||0:melee?effects.meleeUpkeepDiscount||0:spec?.domain==='sea'?effects.navalUpkeepDiscount||0:0;if(war&&land&&!spec?.civilian&&(melee||spec?.class==='cavalry'))leaderDiscount=1-(1-leaderDiscount)*(1-(effects.wartimeLandUpkeepDiscount||0));const discounts=Object.entries(player.heritageEffects||{}).reduce((totals,[key,e])=>{const value=(e.unitUpkeepDiscount||0)+(spec?.civilian?e.civilianUpkeepDiscount||0:0)+(spec?.domain==='sea'?e.navalUpkeepDiscount||0:0);if(heritageCommanderKeys.has(key.split(':')[0]))totals.commander=Math.max(totals.commander,value);else totals.other+=value;return totals;},{commander:0,other:0}),heritage=discounts.commander+discounts.other;leaderDiscount=1-(1-leaderDiscount)*(1-Math.min(.6,heritage));const multiplier=Math.max(.2,Math.max(.4,(spec?.upkeepMultiplier||1)*(1-Math.min(.6,leaderDiscount)))*(player.policies?.includes('conscription')?Math.max(0,1-.5*militaryPolicyMultiplier(player)):1)),salary=Math.round((spec?.salary||0)*multiplier*100)/100,maintenance=Math.round((spec?.maintenance||0)*multiplier*100)/100;return {salary,maintenance,total:Math.round((salary+maintenance)*100)/100};}
const district=(name,cost,yields,requires,description) => ({name,cost,kind:'district',yields,...requires,description});
const building=(name,cost,yields,requires,description) => ({name,cost,kind:'building',yields,...requires,description});
export const BUILDINGS = {
  missilesilo:district('核弹发射井',280,{}, {tech:'nuclearfission'},'消耗原子弹库存进行 24 格核打击。'),
  barracks:district('军营',65,{production:2},{tech:'bronze'},'军事训练区域；此城新训练陆军获得 +3 战斗力。可被掠夺并修复。'),
  monument:building('纪念碑',25,{culture:2},{},'每经济周期 +2 文化。'),
  granary:building('粮仓',34,{food:2},{tech:'pottery',housing:2},'+2 食物，+2 住房。'),
  walls:building('远古城墙',46,{}, {tech:'masonry',defense:100,wallLevel:1},'一级城墙，100 生命；投石机同级特攻，普通单位每击仅造成 1 点墙伤。'),
  campus:district('学院',55,{science:2},{tech:'writing'},'山脉相邻 +2 科技，雨林每两块 +1。'),
  holy:district('圣地',48,{faith:3},{civic:'mysticism'},'山脉、树林提供信仰相邻加成。'),
  theater:district('剧院广场',55,{culture:3},{civic:'drama'},'奇观相邻 +2 文化。'),
  commercial:district('商业中心',58,{gold:4},{tech:'currency'},'河流相邻 +2 金币，贸易容量 +1。'),
  harbor:district('港口',60,{food:1,gold:3},{tech:'celestial',water:true},'必须建在海岸，贸易容量 +1。'),
  industrial:district('工业区',68,{production:3},{tech:'apprenticeship'},'矿山、采石场相邻 +1 生产力。'),
  aqueduct:district('水渠',54,{food:1},{tech:'engineering',housing:4},'增加 4 住房。'),
  spaceport:district('航天中心',160,{science:3},{tech:'rocketry'},'建造太空任务的必备区域。'),
  airport:district('机场',105,{tourism:6},{tech:'flight'},'每经济周期 +6 旅游；可驻扎一架轰炸机，训练、转场和出击需要未被掠夺的机场。'),
  library:building('图书馆',36,{science:3},{building:'campus'},'学院建筑，+3 科技。'),
  university:building('大学',62,{science:5},{tech:'education',building:'library'},'+5 科技，+1 住房。'),
  lab:building('研究实验室',100,{science:8},{tech:'electricity',building:'university'},'+8 科技。'),
  nuclear:building('核能实验室',115,{science:7,production:3},{tech:'atomic',building:'lab'},'+7 科技，+3 生产力。'),
  shrine:building('神社',30,{faith:3},{building:'holy'},'+3 信仰。'),
  temple:building('寺庙',56,{faith:5,culture:2},{civic:'theology',building:'shrine'},'+5 信仰，+2 文化。'),
  amphitheater:building('圆形剧场',40,{culture:4,tourism:2},{building:'theater'},'+4 文化，+2 旅游。'),
  museum:building('艺术馆',75,{culture:5,tourism:6},{civic:'humanism',building:'amphitheater'},'+5 文化，+6 旅游。'),
  market:building('市场',42,{gold:5},{building:'commercial'},'+5 金币。'),
  bank:building('银行',72,{gold:8},{tech:'banking',building:'market'},'+8 金币。'),
  lighthouse:building('灯塔',38,{food:2,gold:2},{building:'harbor',housing:2},'+2 食物，+2 金币，+2 住房。'),
  workshop:building('工坊',48,{production:4},{building:'industrial'},'+4 生产力。'),
  factory:building('工厂',85,{production:7},{tech:'industrial',building:'workshop'},'+7 生产力；运行时每回合排放 2 指数，改用可再生能源后降至 0.5。'),
  watermill:building('水磨',42,{food:2,production:2},{tech:'mathematics'},'+2 食物、+2 生产力。'),
  medievalwalls:building('中世纪城墙',90,{culture:1},{tech:'buttress',building:'walls',defense:100,wallLevel:2},'二级城墙，累计 200 生命；投石车同级特攻，+1 文化。'),
  renaissancewalls:building('文艺复兴城墙',115,{culture:1},{tech:'siege',building:'medievalwalls',defense:100,wallLevel:3},'三级城墙，累计 300 生命；射石炮同级特攻，+1 文化。'),
  shipyard:building('造船厂',90,{production:5},{tech:'massproduction',building:'lighthouse'},'+5 生产力。'),
  sewer:building('下水道',85,{food:2},{tech:'sanitation',housing:3},'+3 住房、+2 食物。'),
  exchange:building('证券交易所',110,{gold:12},{tech:'economics',building:'bank'},'+12 金币。'),
  steelwalls:building('混凝土军事化城墙',170,{production:2},{tech:'combinedarms',building:'renaissancewalls',defense:150,wallLevel:4},'四级城墙，累计 450 生命；轰炸机同级特攻，+2 生产力。旧档已建防御保留。'),
  broadcast:building('广播中心',110,{culture:8,tourism:8},{tech:'radio',building:'museum'},'+8 文化、+8 旅游。'),
  powerplant:building('核电站',160,{production:12},{tech:'nuclearfission',building:'factory'},'+12 生产力，无发电排放；替代旧发电站收益。'),
  coalplant:building('燃煤发电站',115,{production:8},{tech:'steam',building:'factory'},'+8 生产力；运行时每回合产生 8 发电排放指数，同城仅最高级发电站生效。'),
  oilplant:building('燃油发电站',135,{production:10},{tech:'combustion',building:'factory',resource:'oil'},'+10 生产力；运行时每回合产生 5 发电排放指数，替代旧发电站收益。'),
  dam:building('水坝',100,{food:1},{tech:'buttress',housing:3},'需要本城范围内的河流。保护本城管理的河流地块免受洪灾，缓解干旱，+3 住房。'),
  reservoir:building('蓄水库',70,{food:2},{tech:'engineering',housing:2},'需要本城范围内的河流。保护本城地块免受干旱减产，+2 住房、+2 食物。'),
  floodbarrier:building('防洪屏障',150,{}, {tech:'computers'},'需要本城范围内的低洼海岸。阻止海平面上升对本城地块的侵袭；已有设施仍需建造者维修。'),
  hydroplant:building('水力发电站',175,{production:14},{tech:'electricity',building:'factory'},'需要完好的水坝和工厂。+14 生产力，替代旧发电站收益，无发电排放。'),
  windplant:building('风力发电站',185,{production:14},{tech:'computers',building:'factory'},'+14 生产力，替代旧发电站收益，无发电排放。'),
  solarplant:building('太阳能发电站',195,{production:15},{tech:'satellites',building:'factory'},'+15 生产力，替代旧发电站收益，无发电排放。'),
  seaport:building('海港码头',125,{gold:6,production:3},{tech:'electricity',building:'shipyard'},'+6 金币、+3 生产力。港口第四级建筑。'),
  entertainment:district('娱乐中心',65,{culture:3},{civic:'games'},'+3 文化。'),
  opera:building('歌剧院',90,{culture:7,tourism:5},{civic:'opera',building:'amphitheater'},'+7 文化、+5 旅游。'),
  neighborhood:district('社区',100,{food:2},{civic:'urbanization',housing:5},'+5 住房、+2 食物。'),
  nationalpark:district('国家公园',120,{culture:4,tourism:12},{civic:'conservation'},'+4 文化、+12 旅游。'),
  stadium:building('体育场',120,{culture:8,tourism:6},{civic:'professional',building:'entertainment'},'+8 文化、+6 旅游。')
};
export const WONDERS = {
  pyramids:{name:'金字塔',cost:100,kind:'wonder',tech:'masonry',yields:{culture:2},description:'新建造者 +1 使用次数，+2 文化、+4 旅游。'},
  greatlibrary:{name:'大图书馆',cost:125,kind:'wonder',tech:'writing',building:'campus',yields:{science:6,culture:2},description:'+6 科技，+2 文化、+4 旅游。'},
  colosseum:{name:'大竞技场',cost:130,kind:'wonder',civic:'drama',yields:{culture:5},description:'全国每城 +2 宜居度，+5 文化、+4 旅游。'},
  oracle:{name:'神谕殿',cost:110,kind:'wonder',civic:'mysticism',yields:{faith:6,culture:3},description:'+6 信仰，+3 文化、+4 旅游。'},
  observatory:{name:'大观星台',cost:180,kind:'wonder',tech:'astronomy',yields:{science:10},description:'+10 科技，+4 旅游。'},
  forbidden:{name:'紫禁宫',cost:190,kind:'wonder',civic:'exploration',yields:{culture:8},description:'额外一个政策槽位，+8 文化、+4 旅游。'},
  eiffel:{name:'天穹铁塔',cost:230,kind:'wonder',tech:'industrial',yields:{culture:5,tourism:15},description:'+5 文化，+19 旅游。'},
  oxford:{name:'寰宇大学',cost:210,kind:'wonder',tech:'education',building:'university',yields:{science:12},description:'+12 科技，+4 旅游。'}
};
for(const w of HERITAGE_WONDERS)WONDERS[w.key]={...w,kind:'wonder',yields:w.recurringYields,description:w.passiveEffects.description,history:w.historicalBackground,water:w.placement.validTerrains.every(t=>['coast','ocean'].includes(t))};
UNITS.great_person={name:'伟人',cost:0,kind:'unit',civilian:true,heritage:true,moves:3,strength:0,domain:'land',description:'历史伟人；前往适宜的城市激活能力。'};
UNITS.great_admiral={...UNITS.great_person,name:'大海军家',domain:'sea'};
export const PROJECTS = {
  carbonrecapture:{name:'碳捕集',cost:120,kind:'project',tech:'computers',civic:'conservation',building:'factory',description:'从大气中移除 80 标准速度单位的累计碳；已发生的海平面上升不会倒退。可重复进行。'},
  atomicbomb:{name:'原子弹',cost:700,kind:'project',tech:'nuclearfission',resource:'uranium',description:'增加一枚核弹头，最多储备三枚；杀伤范围 5×5 格。'},
  research:{name:'科研资助',cost:45,kind:'project',building:'campus',description:'完成获得 45 科技。'},
  festival:{name:'文化节',cost:45,kind:'project',building:'theater',description:'完成获得 40 文化和 25 旅游积累。'},
  prayer:{name:'朝圣仪式',cost:40,kind:'project',building:'holy',description:'完成获得 65 信仰。'},
  satellite:{name:'发射人造卫星',cost:150,kind:'project',tech:'satellites',building:'spaceport',stage:1,description:'科技胜利第一步；实际完成发射后无人机射程提升至 24 格。'},
  moon:{name:'载人登月',cost:220,kind:'project',tech:'satellites',building:'spaceport',stage:2,description:'科技胜利第二步；必须先实际发射人造卫星。'},
  colony:{name:'外星殖民',cost:300,kind:'project',tech:'nanotech',building:'spaceport',stage:3,description:'完成后赢得科技胜利。'}
};
export const RELIGIONS = {harvest:{name:'丰收信条',yield:'food',description:'主流信仰城市 +3 食物。'},wisdom:{name:'智慧信条',yield:'science',description:'主流信仰城市 +3 科技。'},art:{name:'艺术信条',yield:'culture',description:'主流信仰城市 +3 文化。'},industry:{name:'勤勉信条',yield:'production',description:'主流信仰城市 +3 生产力。'},sea:{name:'海洋信条',yield:'gold',description:'主流信仰城市 +3 金币。'},healing:{name:'仁爱信条',yield:'faith',description:'主流信仰城市 +3 信仰。'},ancestors:{name:'先祖信条',yield:'culture',description:'主流信仰城市 +3 文化。'},stars:{name:'群星信条',yield:'science',description:'主流信仰城市 +3 科技。'},harmony:{name:'和合信条',yield:'food',description:'主流信仰城市 +3 食物。'},craft:{name:'匠心信条',yield:'production',description:'主流信仰城市 +3 生产力。'}};
registerUniqueBuildings(BUILDINGS);
export const PRODUCTION = {...UNITS,...BUILDINGS,...WONDERS,...PROJECTS};
export const isWater = t => t && (t.terrain === 'ocean' || t.terrain === 'coast');
const HEAVY_TRANSPORT_UNITS=new Set(['tank','artillery','ambulance','mechanized','modernarmor','rocketartillery']);
export function transportKind(type){return ['sea','air'].includes(UNITS[type]?.domain)?null:HEAVY_TRANSPORT_UNITS.has(type)?'cargo':'wood';}
export function canEmbark(player,type){const techs=player?.techs||[];return UNITS[type]?.domain!=='air'&&!!player&&techs.includes('sailing')&&(!HEAVY_TRANSPORT_UNITS.has(type)||techs.includes('steam'));}
// Derive transport state instead of mutating units or introducing independent ships.
// Existing embarked units can always land, even when a legacy save lacks the new prerequisite.
export function unitTransport(unit,tile){return isWater(tile)&&!(tile.district?.item==='golden_gate'&&!tile.pillaged)?transportKind(unit.type):null;}
export const SHALLOW_WATER_LIMIT=.24;
export const VETERAN_TRAITS={
  assault:{name:'进攻训练',description:'主动攻击时战斗力 +2；对完整城墙仍遵守兵种伤害规则。'},
  bastion:{name:'阵地训练',description:'在本国领土防御时战斗力 +3。'},
  terrain:{name:'地形训练',description:'陆军丘陵或森林地形移动消耗减少 1，最低为 1；在这些地形防御时战斗力 +2。'},
  medicine:{name:'救护训练',description:'休整即时恢复额外 6 生命；持续驻防每个经济周期额外恢复 3 生命。'}
};
export const VETERAN_TRAINING_SECONDS=6;
export function veteranCapacity(unit){const free=new Set([...(unit.innateTraits||UNITS[unit.type]?.initialTraits||[]),...(unit.trainedTrait?[unit.trainedTrait]:[])]).size;return !UNITS[unit.type]?.civilian&&unit.owner>=0?Math.min(3,free+Math.max(0,Math.ceil((unit.level||0)/2))):0;}
export function veteranChoices(unit){return (unit.veteranTraits?.length||0)<veteranCapacity(unit)?Object.keys(VETERAN_TRAITS).filter(key=>!unit.veteranTraits?.includes(key)&&(key!=='terrain'||UNITS[unit.type].domain!=='sea'&&UNITS[unit.type].domain!=='air')):[];}
// Derive depth from known land, without changing terrain or exposing hidden coastlines.
export function waterDepths(map){
  const tiles=map.tiles,index=new Map(tiles.map(t=>[tileKey(t.q,t.r),t])),distances=new Map(),queue=[];
  for(const tile of tiles)if(!tile.hidden&&!isWater(tile)){distances.set(tile.id,0);queue.push(tile);}
  for(let i=0;i<queue.length;i++){
    const tile=queue[i],distance=distances.get(tile.id);if(distance>=4)continue;
    for(const [dq,dr]of DIRECTIONS){const next=index.get(canonicalTileKey(tile.q+dq,tile.r+dr,map));if(!next||next.hidden||!isWater(next)||distances.has(next.id))continue;distances.set(next.id,distance+1);queue.push(next);}
  }
  const levels=[0,.05,SHALLOW_WATER_LIMIT,.58,1];
  return new Map(tiles.filter(t=>!t.hidden&&isWater(t)).map(t=>[t.id,levels[distances.get(t.id)??4]]));
}
export function districtStage(item,city){
  const buildings=city?.buildings||[],levels=DISTRICT_LEVELS[item]||[];
  for(let i=levels.length-1;i>=0;i--)for(const key of [...levels[i]].reverse())if(buildings.includes(key))return key;
  return item;
}
// Completed stages are independent of technology availability; power choices share a tier.
export const POWER_PLANTS=['coalplant','oilplant','powerplant','hydroplant','windplant','solarplant'];
export const DISTRICT_LEVELS={campus:[['campus'],['library'],['university'],['lab'],['nuclear']],holy:[['holy'],['shrine'],['temple']],industrial:[['industrial'],['workshop'],['factory'],POWER_PLANTS],commercial:[['commercial'],['market'],['bank'],['exchange']],harbor:[['harbor'],['lighthouse'],['shipyard'],['seaport']],theater:[['theater'],['amphitheater'],['museum','opera'],['broadcast']],entertainment:[['entertainment'],['stadium']]};
for(const [key,spec]of Object.entries(UNIQUE_BUILDINGS))for(const levels of Object.values(DISTRICT_LEVELS))for(const group of levels)if(group.includes(spec.replaces))group.push(key);
export function districtStatus(item,city,district){
  const levels=DISTRICT_LEVELS[item],stage=district?.stage||districtStage(item,city),level=levels?levels.findIndex(group=>group.includes(stage))+1:1;
  return {item,stage,level:Math.max(1,level),name:BUILDINGS[stage]?.name||BUILDINGS[item]?.name||item,chain:levels?.map(group=>group.map(key=>BUILDINGS[key].name).join(' / '))||[],built:city?.buildings?.filter(key=>levels?.some(group=>group.includes(key)))||[]};
}
export function civilizationEra(player){return Math.max(0,...(player?.techs||[]).map(k=>TECHS[k]?.era||0),...(player?.civics||[]).map(k=>CIVICS[k]?.era||0));}
export function cityEraStyle(era){return era<1?'ancient':era<2?'classical':era<4?'medieval':era<5?'industrial':era<7?'modern':'information';}
// Shared builder rules keep native orders and the manual inspector in agreement.
export function improvementFor(player,tile){
  if(!tile||tile.hidden||tile.naturalWonder||tile.district||tile.fort||tile.cityId!=null||tile.terrain==='mountain')return null;
  const techs=player?.techs||[],resource=RESOURCES[tile.resource],revealed=resourceRevealed(tile.resource,player);
  let item=null;
  if(isWater(tile))item=revealed&&tile.resource==='fish'?'fishery':null;
  else if(tile.feature){
    if(revealed&&resource.improvement==='camp')item='camp';
    else if(!revealed&&(tile.feature==='forest'||techs.includes('massproduction')))item='lumbermill';
  }else if(revealed&&resource.improvement!=='fishery')item=resource.improvement;
  else if(tile.hill)item='mine';
  else if(['grass','plains'].includes(tile.terrain))item='farm';
  if(!item||IMPROVEMENTS[item].tech&&!techs.includes(IMPROVEMENTS[item].tech)||tile.improvement===item)return null;
  if(tile.improvement&&!(revealed&&item===resource.improvement))return null;
  return item;
}
export const chopTechnology = tile => tile?.feature==='forest'?'mining':tile?.feature==='jungle'?'bronze':null;
export function canChop(player,tile){
  const technology=chopTechnology(tile);
  return !!technology&&!!tile&&!tile.hidden&&!tile.naturalWonder&&!isWater(tile)&&tile.terrain!=='mountain'&&tile.cityId==null&&!tile.district&&!tile.improvement&&(player?.techs||[]).includes(technology);
}
export function dist(a,b,map){
  const measure=shift=>(Math.abs(a.q-b.q-shift)+Math.abs(a.r-b.r)+Math.abs(a.q+a.r-b.q-b.r-shift))/2;
  return map?.wrapX?Math.min(measure(0),measure(map.width),measure(-map.width)):measure(0);
}
export function canonicalTileKey(q,r,map){if(map.wrapX)q=((q+Math.floor(r/2))%map.width+map.width)%map.width-Math.floor(r/2);return `${q},${r}`;}

export const DIRECTIONS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export const tileKey = (q,r) => `${q},${r}`;
export const costOf = key => PRODUCTION[key]?.cost ?? 0;

export const GAME_SPEEDS={blitz:{name:'极速',factor:.25,maxTurns:163},online:{name:'联机',factor:.5,maxTurns:325},quick:{name:'快速',factor:2/3,maxTurns:433},standard:{name:'标准',factor:1,maxTurns:650},epic:{name:'史诗',factor:1.5,maxTurns:975},marathon:{name:'马拉松',factor:3,maxTurns:1950}};
export const NATURAL_WONDERS = {
  "zhangjiajie": {
    "name": "张家界峰林",
    "englishName": "Zhangjiajie Pillars",
    "origin": "real",
    "region": "China (Hunan)",
    "reference": "https://whc.unesco.org/en/list/640",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 2,
      "minTemperate": 1
    },
    "aura": {
      "filter": "woodlandOrHill",
      "culture": 1
    },
    "adjacency": {
      "theater": 2,
      "holy": 1
    },
    "description": "相邻森林、雨林或丘陵 +1 文化；相邻剧院 +2 文化；相邻圣地 +1 信仰。"
  },
  "great_barrier_reef": {
    "name": "大堡礁",
    "englishName": "Great Barrier Reef",
    "origin": "real",
    "region": "Australia (Coral Sea)",
    "reference": "https://whc.unesco.org/en/list/154",
    "terrains": [
      "coast"
    ],
    "workable": true,
    "yields": {
      "food": 1,
      "science": 2
    },
    "placement": {
      "minLand": 1,
      "minWater": 2
    },
    "adjacency": {
      "campus": 2
    },
    "description": "本格 +1 食物、+2 科研；相邻学院 +2 科研。"
  },
  "iguazu_falls": {
    "name": "伊瓜苏瀑布",
    "englishName": "Iguazu Falls",
    "origin": "real",
    "region": "Argentina / Brazil",
    "reference": "https://whc.unesco.org/en/list/303",
    "terrains": [
      "grass",
      "plains"
    ],
    "workable": true,
    "yields": {
      "food": 2,
      "culture": 1
    },
    "placement": {
      "hill": false,
      "river": true,
      "connectedRiver": true
    },
    "description": "本格 +2 食物、+1 文化；仍受普通河流洪水影响。"
  },
  "eye_of_the_sahara": {
    "name": "撒哈拉之眼",
    "englishName": "Eye of the Sahara",
    "origin": "real",
    "region": "Mauritania",
    "reference": "https://www.nasa.gov/image-article/richat-structure-mauritania-2/",
    "terrains": [
      "desert"
    ],
    "workable": true,
    "yields": {
      "science": 2,
      "gold": 2
    },
    "placement": {
      "noWater": true
    },
    "adjacency": {
      "campus": 2
    },
    "description": "本格 +2 科研、+2 金币；相邻学院 +2 科研。"
  },
  "mount_everest": {
    "name": "珠穆朗玛峰",
    "englishName": "Mount Everest",
    "origin": "real",
    "region": "Nepal / China (Himalayas)",
    "reference": "https://whc.unesco.org/en/list/120",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minRock": 3,
      "noWater": true
    },
    "aura": {
      "filter": "woodlandOrHill",
      "faith": 1
    },
    "adjacency": {
      "holy": 2,
      "campus": 1
    },
    "description": "相邻森林、雨林或丘陵 +1 信仰；相邻圣地 +2 信仰；相邻学院 +1 科研。"
  },
  "mount_kilimanjaro": {
    "name": "乞力马扎罗山",
    "englishName": "Mount Kilimanjaro",
    "origin": "real",
    "region": "Tanzania (East Africa)",
    "reference": "https://whc.unesco.org/en/list/403",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 3,
      "minFlat": 3,
      "minTemperate": 2
    },
    "aura": {
      "filter": "land",
      "food": 1,
      "culture": 1
    },
    "adjacency": {
      "holy": 1,
      "theater": 1
    },
    "description": "相邻普通陆地 +1 食物、+1 文化；相邻圣地 +1 信仰；相邻剧院 +1 文化。"
  },
  "mount_fuji": {
    "name": "富士山",
    "englishName": "Mount Fuji",
    "origin": "real",
    "region": "Japan (Honshu)",
    "reference": "https://whc.unesco.org/en/list/1418",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 2,
      "coastWithin": 3
    },
    "aura": {
      "filter": "land",
      "culture": 1
    },
    "adjacency": {
      "holy": 2,
      "theater": 2
    },
    "volcano": true,
    "description": "相邻普通陆地 +1 文化；相邻圣地 +2 信仰；相邻剧院 +2 文化；可能喷发，造成损害并留下肥力。"
  },
  "uluru": {
    "name": "乌鲁鲁",
    "englishName": "Uluru",
    "origin": "real",
    "region": "Australia (Northern Territory)",
    "reference": "https://whc.unesco.org/en/list/447",
    "terrains": [
      "desert"
    ],
    "workable": true,
    "yields": {
      "faith": 2,
      "culture": 2
    },
    "placement": {
      "hill": false,
      "noWater": true
    },
    "adjacency": {
      "holy": 2
    },
    "description": "本格 +2 信仰、+2 文化；相邻圣地 +2 信仰。"
  },
  "grand_canyon": {
    "name": "科罗拉多大峡谷",
    "englishName": "Grand Canyon",
    "origin": "real",
    "region": "United States (Arizona)",
    "reference": "https://whc.unesco.org/en/list/75",
    "terrains": [
      "desert",
      "plains"
    ],
    "workable": true,
    "yields": {
      "gold": 2,
      "science": 1,
      "culture": 1
    },
    "placement": {
      "hill": true,
      "nearRiver": true
    },
    "adjacency": {
      "theater": 1,
      "campus": 1
    },
    "description": "本格 +2 金币、+1 科研、+1 文化；相邻剧院 +1 文化；相邻学院 +1 科研。"
  },
  "grand_prismatic_spring": {
    "name": "大棱镜温泉",
    "englishName": "Grand Prismatic Spring",
    "origin": "real",
    "region": "United States (Wyoming, Yellowstone)",
    "reference": "https://www.nps.gov/places/000/grand-prismatic-spring.htm",
    "terrains": [
      "plains",
      "grass"
    ],
    "workable": true,
    "yields": {
      "science": 2,
      "faith": 2
    },
    "placement": {
      "minRock": 1,
      "minLand": 2,
      "noWater": true
    },
    "adjacency": {
      "campus": 2
    },
    "description": "本格 +2 科研、+2 信仰；相邻学院 +2 科研。"
  },
  "yosemite_valley": {
    "name": "约塞米蒂谷",
    "englishName": "Yosemite Valley",
    "origin": "real",
    "region": "United States (California, Sierra Nevada)",
    "reference": "https://www.nps.gov/yose/learn/nature/geology.htm",
    "terrains": [
      "grass",
      "plains"
    ],
    "workable": true,
    "yields": {
      "culture": 2,
      "gold": 1,
      "science": 1
    },
    "placement": {
      "hill": false,
      "minRock": 2,
      "nearValley": true
    },
    "adjacency": {
      "theater": 2,
      "campus": 1
    },
    "description": "本格 +2 文化、+1 金币、+1 科研；相邻剧院 +2 文化；相邻学院 +1 科研。"
  },
  "victoria_falls": {
    "name": "维多利亚瀑布",
    "englishName": "Victoria Falls",
    "origin": "real",
    "region": "Zambia / Zimbabwe",
    "reference": "https://whc.unesco.org/en/list/509",
    "terrains": [
      "grass",
      "plains"
    ],
    "workable": true,
    "yields": {
      "food": 2,
      "gold": 2
    },
    "placement": {
      "hill": false,
      "river": true,
      "connectedRiver": true
    },
    "adjacency": {
      "theater": 1
    },
    "description": "本格 +2 食物、+2 金币；相邻剧院 +1 文化；仍受普通河流洪水影响。"
  },
  "niagara_falls": {
    "name": "尼亚加拉瀑布",
    "englishName": "Niagara Falls",
    "origin": "real",
    "region": "Canada / United States",
    "reference": "https://www.niagaraparks.com/visit/attractions/journey-behind-the-falls/",
    "terrains": [
      "grass",
      "plains"
    ],
    "workable": true,
    "yields": {
      "food": 1,
      "production": 2,
      "gold": 1
    },
    "placement": {
      "hill": false,
      "river": true,
      "connectedRiver": true
    },
    "adjacency": {
      "industrial": 2
    },
    "description": "本格 +1 食物、+2 生产、+1 金币；相邻工业区 +2 生产；仍受普通河流洪水影响。"
  },
  "mount_roraima": {
    "name": "罗赖马山",
    "englishName": "Mount Roraima",
    "origin": "real",
    "region": "Venezuela / Brazil / Guyana",
    "reference": "https://whc.unesco.org/en/list/701",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minTemperate": 2
    },
    "aura": {
      "filter": "woodlandOrHill",
      "science": 1,
      "faith": 1
    },
    "adjacency": {
      "campus": 2,
      "holy": 1
    },
    "description": "相邻森林、雨林或丘陵 +1 科研、+1 信仰；相邻学院 +2 科研；相邻圣地 +1 信仰。"
  },
  "torres_del_paine": {
    "name": "百内山群",
    "englishName": "Torres del Paine",
    "origin": "real",
    "region": "Chile (Patagonia)",
    "reference": "https://www.unesco.org/en/mab/torres-del-paine",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 2,
      "nearCold": true
    },
    "aura": {
      "filter": "land",
      "production": 1,
      "culture": 1
    },
    "adjacency": {
      "theater": 2,
      "campus": 1
    },
    "description": "相邻普通陆地 +1 生产、+1 文化；相邻剧院 +2 文化；相邻学院 +1 科研。"
  },
  "ha_long_bay": {
    "name": "下龙湾",
    "englishName": "Ha Long Bay",
    "origin": "real",
    "region": "Vietnam (Gulf of Tonkin)",
    "reference": "https://whc.unesco.org/en/list/672",
    "terrains": [
      "coast"
    ],
    "workable": true,
    "yields": {
      "food": 1,
      "culture": 2,
      "gold": 1
    },
    "placement": {
      "minLand": 1,
      "minWater": 2
    },
    "adjacency": {
      "theater": 2
    },
    "description": "本格 +1 食物、+2 文化、+1 金币；相邻剧院 +2 文化。"
  },
  "li_river_karst": {
    "name": "桂林漓江",
    "englishName": "Li River Karst",
    "origin": "real",
    "region": "China (Guangxi)",
    "reference": "https://whc.unesco.org/en/list/1248",
    "terrains": [
      "grass",
      "plains"
    ],
    "workable": true,
    "yields": {
      "food": 1,
      "culture": 2,
      "gold": 1
    },
    "placement": {
      "river": true,
      "minRock": 1
    },
    "adjacency": {
      "theater": 2,
      "holy": 1
    },
    "description": "本格 +1 食物、+2 文化、+1 金币；相邻剧院 +2 文化；相邻圣地 +1 信仰。"
  },
  "milford_sound": {
    "name": "米尔福德峡湾",
    "englishName": "Milford Sound",
    "origin": "real",
    "region": "New Zealand (South Island)",
    "reference": "https://whc.unesco.org/en/list/551",
    "terrains": [
      "coast"
    ],
    "workable": true,
    "yields": {
      "food": 1,
      "production": 1,
      "culture": 2
    },
    "placement": {
      "minLand": 2,
      "minRock": 2
    },
    "adjacency": {
      "theater": 1,
      "campus": 1
    },
    "description": "本格 +1 食物、+1 生产、+2 文化；相邻剧院 +1 文化；相邻学院 +1 科研。"
  },
  "lake_baikal": {
    "name": "贝加尔湖",
    "englishName": "Lake Baikal",
    "origin": "real",
    "region": "Russia (Siberia)",
    "reference": "https://whc.unesco.org/en/list/754",
    "terrains": [
      "coast"
    ],
    "workable": true,
    "yields": {
      "food": 2,
      "science": 2
    },
    "placement": {
      "minLand": 3,
      "nearCold": true
    },
    "adjacency": {
      "campus": 2
    },
    "description": "本格 +2 食物、+2 科研；相邻学院 +2 科研。"
  },
  "lake_titicaca": {
    "name": "的的喀喀湖",
    "englishName": "Lake Titicaca",
    "origin": "real",
    "region": "Peru / Bolivia (Andes)",
    "reference": "https://rsis.ramsar.org/ris/959",
    "terrains": [
      "coast"
    ],
    "workable": true,
    "yields": {
      "food": 2,
      "faith": 2
    },
    "placement": {
      "minLand": 3,
      "minRock": 1
    },
    "adjacency": {
      "holy": 2
    },
    "description": "本格 +2 食物、+2 信仰；相邻圣地 +2 信仰。"
  },
  "dead_sea": {
    "name": "死海",
    "englishName": "Dead Sea",
    "origin": "real",
    "region": "Jordan / Israel / Palestine",
    "reference": "https://science.nasa.gov/earth/earth-observatory/dead-sea-6136/",
    "terrains": [
      "coast"
    ],
    "workable": true,
    "yields": {
      "faith": 2,
      "gold": 2
    },
    "placement": {
      "minLand": 2,
      "nearDesert": true
    },
    "adjacency": {
      "holy": 1,
      "campus": 1
    },
    "description": "本格 +2 信仰、+2 金币；相邻圣地 +1 信仰；相邻学院 +1 科研。"
  },
  "salar_de_uyuni": {
    "name": "乌尤尼盐沼",
    "englishName": "Salar de Uyuni",
    "origin": "real",
    "region": "Bolivia (Altiplano)",
    "reference": "https://science.nasa.gov/earth/earth-observatory/salt-flats-mountains-and-moisture-144826/",
    "terrains": [
      "desert",
      "plains"
    ],
    "workable": true,
    "yields": {
      "production": 2,
      "science": 2
    },
    "placement": {
      "hill": false,
      "noWater": true
    },
    "adjacency": {
      "industrial": 2,
      "campus": 1
    },
    "description": "本格 +2 生产、+2 科研；相邻工业区 +2 生产；相邻学院 +1 科研。"
  },
  "pamukkale": {
    "name": "棉花堡",
    "englishName": "Pamukkale Travertines",
    "origin": "real",
    "region": "Turkey (Denizli)",
    "reference": "https://whc.unesco.org/en/list/485",
    "terrains": [
      "plains",
      "grass"
    ],
    "workable": true,
    "yields": {
      "culture": 2,
      "faith": 1,
      "food": 1
    },
    "placement": {
      "hill": true,
      "minTemperate": 1
    },
    "adjacency": {
      "holy": 2,
      "theater": 1
    },
    "description": "本格 +2 文化、+1 信仰、+1 食物；相邻圣地 +2 信仰；相邻剧院 +1 文化。"
  },
  "chocolate_hills": {
    "name": "巧克力山",
    "englishName": "Chocolate Hills",
    "origin": "real",
    "region": "Philippines (Bohol)",
    "reference": "https://www.unesco.org/en/iggp/geoparks/bohol-island",
    "terrains": [
      "grass",
      "plains"
    ],
    "workable": true,
    "yields": {
      "food": 2,
      "production": 1,
      "culture": 1
    },
    "placement": {
      "hill": true,
      "minTemperate": 2
    },
    "description": "本格 +2 食物、+1 生产、+1 文化。"
  },
  "giants_causeway": {
    "name": "巨人堤道",
    "englishName": "Giant's Causeway",
    "origin": "real",
    "region": "United Kingdom (Northern Ireland)",
    "reference": "https://whc.unesco.org/en/list/369",
    "terrains": [
      "coast",
      "plains"
    ],
    "workable": true,
    "yields": {
      "production": 2,
      "culture": 2
    },
    "placement": {
      "minLand": 1,
      "minWater": 1
    },
    "adjacency": {
      "industrial": 1,
      "theater": 1
    },
    "description": "本格 +2 生产、+2 文化；相邻工业区 +1 生产；相邻剧院 +1 文化。"
  },
  "lena_pillars": {
    "name": "勒拿河柱",
    "englishName": "Lena Pillars",
    "origin": "real",
    "region": "Russia (Sakha / Yakutia)",
    "reference": "https://whc.unesco.org/en/list/1299/",
    "terrains": [
      "tundra",
      "plains"
    ],
    "workable": true,
    "yields": {
      "science": 2,
      "production": 1,
      "culture": 1
    },
    "placement": {
      "river": true,
      "nearWoodOrHill": true
    },
    "adjacency": {
      "campus": 2
    },
    "description": "本格 +2 科研、+1 生产、+1 文化；相邻学院 +2 科研。"
  },
  "tsingy_de_bemaraha": {
    "name": "贝马拉哈石林",
    "englishName": "Tsingy de Bemaraha",
    "origin": "real",
    "region": "Madagascar",
    "reference": "https://whc.unesco.org/en/list/494",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 2
    },
    "aura": {
      "filter": "woodlandOrHill",
      "science": 1,
      "production": 1
    },
    "adjacency": {
      "campus": 1,
      "industrial": 1
    },
    "description": "相邻森林、雨林或丘陵 +1 科研、+1 生产；相邻学院 +1 科研；相邻工业区 +1 生产。"
  },
  "namib_sand_sea": {
    "name": "纳米布沙海",
    "englishName": "Namib Sand Sea",
    "origin": "real",
    "region": "Namibia",
    "reference": "https://whc.unesco.org/en/list/1430",
    "terrains": [
      "desert"
    ],
    "workable": true,
    "yields": {
      "gold": 2,
      "food": 1,
      "science": 1
    },
    "placement": {
      "coastWithin": 1
    },
    "adjacency": {
      "campus": 1
    },
    "description": "本格 +2 金币、+1 食物、+1 科研；相邻学院 +1 科研。"
  },
  "dallol": {
    "name": "达洛尔热泉",
    "englishName": "Dallol Hydrothermal Field",
    "origin": "real",
    "region": "Ethiopia (Danakil Depression)",
    "reference": "https://volcano.si.edu/volcano.cfm?vn=221041",
    "terrains": [
      "desert"
    ],
    "workable": true,
    "yields": {
      "production": 2,
      "science": 2
    },
    "placement": {
      "hill": false,
      "noWater": true
    },
    "adjacency": {
      "industrial": 2
    },
    "description": "本格 +2 生产、+2 科研；相邻工业区 +2 生产。"
  },
  "lencois_maranhenses": {
    "name": "伦索伊斯沙丘",
    "englishName": "Lencois Maranhenses",
    "origin": "real",
    "region": "Brazil (Maranhao)",
    "reference": "https://whc.unesco.org/en/list/1611/",
    "terrains": [
      "desert",
      "plains"
    ],
    "workable": true,
    "yields": {
      "food": 2,
      "culture": 2
    },
    "placement": {
      "hill": false,
      "coastWithin": 2
    },
    "adjacency": {
      "theater": 2
    },
    "description": "本格 +2 食物、+2 文化；相邻剧院 +2 文化。"
  },
  "blyde_river_canyon": {
    "name": "布莱德河峡谷",
    "englishName": "Blyde River Canyon",
    "origin": "real",
    "region": "South Africa (Mpumalanga)",
    "reference": "https://www.dffe.gov.za/kruger-canyons-biosphere-reserve",
    "terrains": [
      "plains",
      "grass"
    ],
    "workable": true,
    "yields": {
      "food": 1,
      "production": 1,
      "culture": 2
    },
    "placement": {
      "hill": true,
      "river": true
    },
    "adjacency": {
      "theater": 2
    },
    "description": "本格 +1 食物、+1 生产、+2 文化；相邻剧院 +2 文化。"
  },
  "mount_bromo": {
    "name": "婆罗摩火山",
    "englishName": "Mount Bromo",
    "origin": "real",
    "region": "Indonesia (East Java)",
    "reference": "https://www.unesco.org/en/mab/bromo-tengger-semeru-arjuno",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 3
    },
    "aura": {
      "filter": "land",
      "production": 1,
      "faith": 1
    },
    "adjacency": {
      "holy": 2,
      "industrial": 1
    },
    "volcano": true,
    "description": "相邻普通陆地 +1 生产、+1 信仰；相邻圣地 +2 信仰；相邻工业区 +1 生产；可能喷发，造成损害并留下肥力。"
  },
  "mount_vesuvius": {
    "name": "维苏威火山",
    "englishName": "Mount Vesuvius",
    "origin": "real",
    "region": "Italy (Campania)",
    "reference": "https://www.unesco.org/en/mab/somma-vesuvio-and-miglio-doro",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 2,
      "coastWithin": 2
    },
    "aura": {
      "filter": "land",
      "food": 1,
      "culture": 1
    },
    "adjacency": {
      "theater": 2,
      "campus": 1
    },
    "volcano": true,
    "description": "相邻普通陆地 +1 食物、+1 文化；相邻剧院 +2 文化；相邻学院 +1 科研；可能喷发，造成损害并留下肥力。"
  },
  "mount_etna": {
    "name": "埃特纳火山",
    "englishName": "Mount Etna",
    "origin": "real",
    "region": "Italy (Sicily)",
    "reference": "https://whc.unesco.org/en/list/1427",
    "terrains": [
      "mountain"
    ],
    "workable": false,
    "yields": {},
    "placement": {
      "minLand": 2,
      "coastWithin": 2
    },
    "aura": {
      "filter": "land",
      "food": 1,
      "production": 1
    },
    "adjacency": {
      "industrial": 2,
      "holy": 1
    },
    "volcano": true,
    "description": "相邻普通陆地 +1 食物、+1 生产；相邻工业区 +2 生产；相邻圣地 +1 信仰；可能喷发，造成损害并留下肥力。"
  },
  "vatnajokull_glacier": {
    "name": "瓦特纳冰原",
    "englishName": "Vatnajokull Glacier",
    "origin": "real",
    "region": "Iceland",
    "reference": "https://whc.unesco.org/en/list/1604/",
    "terrains": [
      "snow",
      "tundra"
    ],
    "workable": true,
    "yields": {
      "science": 2,
      "production": 1,
      "faith": 1
    },
    "placement": {
      "nearCold": true
    },
    "aura": {
      "filter": "polar",
      "food": 1
    },
    "adjacency": {
      "campus": 2
    },
    "description": "本格 +2 科研、+1 生产、+1 信仰；相邻雪原或冻土 +1 食物；相邻学院 +2 科研。"
  }
};

export function naturalAuraYield(tile,player={}) {
  if (tile.cityId!=null||tile.district||tile.naturalWonder||isWater(tile)||tile.terrain==='mountain') return {};
  if (tile.naturalYield) return {...tile.naturalYield};
  const result={};
  for(const key of tile.naturalAuras||[]){
    if(Array.isArray(player.naturalDiscoveries)&&!player.naturalDiscoveries.includes(key))continue;
    const aura=NATURAL_WONDERS[key]?.aura;if(!aura)continue;
    if(aura.filter==='polar'&&!['snow','tundra'].includes(tile.terrain)||aura.filter==='woodlandOrHill'&&!tile.hill&&!['forest','jungle'].includes(tile.feature))continue;
    for(const kind of YIELD_KEYS)if(aura[kind])result[kind]=Math.min(2,(result[kind]||0)+aura[kind]);
  }
  return result;
}

export function naturalTileBonus(tile,player={}) {
  const spec=NATURAL_WONDERS[tile.naturalWonder];
  if(tile.cityId!=null||tile.district)return {};
  return spec?{...spec.yields}:naturalAuraYield(tile,player);
}

// Use the same yields in simulation, map labels and tile inspection.
// Identical arithmetic for engine settlement and projected human tile labels.
export function applyClimateTileYield(tile, base) {
  const weather = tile.weather;
  if (!weather || tile.district) return base;
  const y = {...base};
  y.food = Math.max(0, (y.food || 0) + (weather.fertility?.food || 0));
  y.production = Math.max(0, (y.production || 0) + (weather.fertility?.production || 0));
  if (weather.drought) y.food = Math.max(0, y.food - 2);
  if (weather.inundated) {y.food *= .5; y.production *= .5;}
  return y;
}

export function tileYield(tile,player={techs:[],civics:[],id:-1}) {
  const techs=player.techs||[],civics=player.civics||[];
  const y=Object.fromEntries(YIELD_KEYS.map(k=>[k,TERRAINS[tile.terrain]?.[k]||0]));
  if(tile.hill)y.production++;
  if(tile.feature==='forest')y.production++;
  if(tile.feature==='jungle')y.food++;
  if(tile.river)y.gold++;
  const resource=tile.pillaged?null:RESOURCES[tile.resource],imp=tile.pillaged?null:IMPROVEMENTS[tile.improvement];
  if(resource&&resourceRevealed(tile.resource,player))for(const k of YIELD_KEYS)y[k]+=resource[k]||0;
  if(imp){for(const k of YIELD_KEYS)y[k]+=imp[k]||0;y.tourism=improvementTourism(tile,player);}
  if(!tile.pillaged&&tile.improvement==='farm'){if(civics.includes('feudalism'))y.food++;if(traditionIndex(player)===2)y.food++;}
  if(!tile.pillaged&&tile.improvement==='mine'){if(techs.includes('apprenticeship'))y.production++;if(traditionIndex(player)===7)y.production++;}
  if(player.leaderRulesVersion===2&&tile.terrain==='tundra'){const n=leaderFor(player).passive?.effects?.tundraBonus||0;y.production+=n;y.faith+=n;}
  const natural=NATURAL_WONDERS[tile.naturalWonder];
  if(natural&&!natural.workable)return Object.fromEntries(YIELD_KEYS.map(key=>[key,0]));
  for(const [key,value]of Object.entries(naturalTileBonus(tile,player)))y[key]+=value;
  if(tile.district){y.food=0;y.production=0;}
  return applyClimateTileYield(tile,y);
}
// A movement order has both an action-point budget and a model-specific cell limit.
// Aircraft use their separate transfer radius rather than ordinary ground movement.
export function movementStepLimit(type){return UNITS[type]?.domain==='air'?0:UNITS[type]?.moves||0;}
export function unitMovement(unit,player,time=0,partner=null){const spec=UNITS[unit.type],effects=player?nationalEffects(player,time):{},land=(spec?.domain||'land')==='land',moves=(spec?.moves||0)+(unit.movementBonus||0)+(land&&!spec?.civilian?(effects.landMove||0)+(spec.class==='cavalry'?(effects.cavalryMove||0):0):0);return spec?.civilian&&partner&&UNITS[partner.type]?.escortMovement?Math.max(moves,unitMovement(partner,player,time)):moves;}
export function movementDuration(type,cost,moves=UNITS[type].moves){return Math.max(.4,Math.min(2.5,cost*2.1/moves));}
export function cityGrowth(g,city,yields){
  const capacity=(14+city.population*8)*gamePace(g).factor;
  const multiplier=city.population>=yields.housing?.35:city.population>=yields.housing-1?.7:1;
  const gardens=g.wonders?.hanging_gardens,growthBonus=gardens&&g.cities.some(c=>c.id===gardens.city&&c.owner===city.owner)&&!g.map.tiles[gardens.tile]?.pillaged?.15:0;const rate=yields.netFood*multiplier*(1+growthBonus+(g.players[city.owner].pantheon==='fertility_rites'?.1:0)),food=city.food||0;
  return {capacity,multiplier,rate,turns:rate>0?Math.max(1,Math.ceil((capacity-food)/rate)):null,starvationTurns:rate<0&&city.population>1?Math.max(1,Math.ceil(food/-rate)):null};
}
export function gamePace(g){return GAME_SPEEDS[g.settings?.gameSpeed]||{name:'旧版快速',factor:1,maxTurns:g.maxTurns,legacy:true};}
export function researchCost(g,key,civic=false,boosted=false){const spec=(civic?CIVICS:TECHS)[key];if(!spec)return 0;const pace=gamePace(g);if(pace.legacy)return spec.cost*(boosted?.65:1);const age=(g.turn-1)/pace.factor,expected=[0,45,100,160,230,290,350,410,470][spec.era]||0,ahead=g.settings?.balanceVersion>=2?1+Math.min(7,Math.max(0,expected-age)/65)**1.5:1,slow=g.settings?.balanceVersion>=2?(civic?2.1+spec.era*.14:2.2+spec.era*.18):1;return Math.ceil(spec.cost*(1.65+spec.era*.95)*pace.factor*slow*ahead*(boosted?.65:1));}
export function productionCost(g,key){
  const spec=PRODUCTION[key];if(!spec)return 0;const pace=gamePace(g);if(pace.legacy)return spec.cost;
  const era=Math.max(0,TECHS[spec.tech]?.era||0,CIVICS[spec.civic]?.era||0),kind=spec.kind;
  let curve=kind==='wonder'?2.8+era*.55:kind==='district'?2.2+era*.5:kind==='building'?1.9+era*.4:kind==='project'?2.1+era*.45:1.6+era*.32;
  if(PROJECTS[key]?.stage)curve={satellite:9,moon:10,colony:12}[key];
  if(g.settings?.balanceVersion>=2)curve*=1.25+era*.1+Math.min(1.2,(g.turn-1)/gamePace(g).factor/400)*(kind==='district'?1.4:.5);
  return Math.ceil(spec.cost*curve*pace.factor);
}
export function purchaseCost(g,key,player,city){const effects=player?leaderFor(player).passive?.effects||{}:{},discount=Math.min(.4,effects.purchaseDiscount||0),local=city?.buildings.reduce((m,k)=>Math.max(m,buildingOperational(g,city,k,BUILDINGS)?BUILDINGS[k]?.purchaseDiscount||0:0),0)||0;return Math.ceil(productionCost(g,key)*(g.settings?.balanceVersion>=2?4.5:4)*(1-discount)*(1-Math.min(.2,local))*(UNITS[key]?.civilian?1-Math.min(.8,Object.values(player?.heritageEffects||{}).reduce((n,e)=>n+(e.civilianPurchaseDiscount||0),0)):1));}
export function calendarYear(g){const pace=gamePace(g),turn=(g.turn-1)/pace.factor;if(pace.legacy)return -4000+Math.min(turn,50)*50+Math.max(0,Math.min(turn-50,60))*35+Math.max(0,turn-110)*25;const stops=[[0,-4000],[80,-1000],[140,0],[230,1400],[300,1800],[380,2000],[500,2050]];for(let i=1;i<stops.length;i++)if(turn<=stops[i][0]){const [a,year]=stops[i-1],[b,next]=stops[i];return Math.round((year+(next-year)*(turn-a)/(b-a))/5)*5;}return 2050+Math.floor((turn-500)/4);}

// Ages (时代系统): tiers and dedications. Effects merge into nationalEffects() so every existing yield/combat path applies them symmetrically.
export const AGE_TIERS={
  dark:{name:'黑暗时代',effects:{culture:-.05}},
  normal:{name:'普通时代',effects:{}},
  golden:{name:'黄金时代',effects:{culture:.05}},
  heroic:{name:'英雄时代',effects:{culture:.05}}
};
import {ERA_DEDICATIONS} from './age-data.mjs';
export {AGE_THEMES,dedicationOptions} from './age-data.mjs';
export const AGE_BONUSES={
  ...ERA_DEDICATIONS,
  g_inquiry:{tier:'golden',name:'自由探索',icon:'inquiry',effects:{science:.15},description:'科技 +15%。'},
  g_monument:{tier:'golden',name:'丰碑工程',icon:'monument',effects:{production:.12,builderCharges:1},description:'生产力 +12%，新建造者 +1 次使用。'},
  g_pax:{tier:'golden',name:'万国和平',icon:'pax',effects:{culture:.12,faith:.1,congressVotes:1},description:'文化 +12%，信仰 +10%，世界议会每议题 +1 票。'},
  g_valor:{tier:'golden',name:'武德昭彰',icon:'valor',effects:{combat:4,xpMultiplier:.5},description:'军事单位战斗力 +4，经验 +50%。'},
  g_caravan:{tier:'golden',name:'黄金商路',icon:'caravan',effects:{gold:.2,tourism:.15},description:'金币 +20%，旅游 +15%。'},
  g_abundance:{tier:'golden',name:'丰饶盛世',icon:'abundance',effects:{food:.12,housing:1},description:'食物 +12%，每城住房 +1。'},
  n_steady:{tier:'normal',name:'稳步发展',icon:'steady',effects:{food:.05,production:.05},description:'食物 +5%，生产力 +5%。'},
  n_scholar:{tier:'normal',name:'学术传承',icon:'scholar',effects:{science:.06},description:'科技 +6%。'},
  n_patron:{tier:'normal',name:'艺术赞助',icon:'patron',effects:{culture:.08},description:'文化 +8%。'},
  n_treasury:{tier:'normal',name:'国库充盈',icon:'treasury',effects:{gold:.1},description:'金币 +10%。'},
  n_garrison:{tier:'normal',name:'戍边',icon:'garrison',effects:{combat:2,housing:1},description:'战斗力 +2，每城住房 +1。'},
  d_isolation:{tier:'dark',name:'闭关自守',icon:'isolation',effects:{production:.1,gold:-.1},description:'生产力 +10%，金币 −10%。'},
  d_warlords:{tier:'dark',name:'绿林豪强',icon:'warlords',effects:{combat:4,culture:-.1},description:'战斗力 +4，文化 −10%。'},
  d_monastic:{tier:'dark',name:'修院学风',icon:'monastic',effects:{science:.1,faith:.15,food:-.06},description:'科技 +10%，信仰 +15%，食物 −6%。'},
  d_hoard:{tier:'dark',name:'窖藏',icon:'hoard',effects:{gold:.15,science:-.08},description:'金币 +15%，科技 −8%。'},
  d_resolve:{tier:'dark',name:'坚忍图存',icon:'resolve',effects:{xpMultiplier:.25,upgradeDiscount:.2,housing:1},description:'经验 +25%，升级花费 −20%，每城住房 +1。'}
};

// Derive reward text from authoritative catalogues instead of maintaining a second tree.
export const RESEARCH_EFFECTS={};
for(const [civic,cat]of [[false,TECHS],[true,CIVICS]])for(const [key,spec]of Object.entries(cat)){
 const prefix=(civic?'c:':'t:')+key,texts=[...(RESEARCH_FEATURES[prefix]||[])];
 for(const [yieldKey,value]of Object.entries(spec.effects||{}))texts.push('每座城市 '+(YIELD_LABELS[yieldKey]||yieldKey)+' +'+value+'。');
 if(spec.combat)texts.push('军事单位战斗力 +'+spec.combat+'。');if(spec.housing)texts.push('每座城市住房 +'+spec.housing+'。');
 if(civic&&GOVERNOR_TITLE_CIVICS.includes(key))texts.push('获得 1 个总督头衔，可招募或晋升总督。');
 texts.forEach((description,i)=>{RESEARCH_EFFECTS[prefix+':'+i]={name:description,description,icon:civic?'scales':'gear'};});
}
const researchRewardCache=new Map();
export function researchUnlocks(key,civic=false){const cacheKey=(civic?'c:':'t:')+key;if(researchRewardCache.has(cacheKey))return researchRewardCache.get(cacheKey);const field=civic?'civic':'tech',out=[];
 for(const [kind,cat]of [['unit',UNITS],['building',BUILDINGS],['wonder',WONDERS],['project',PROJECTS]])for(const [id,s]of Object.entries(cat))if(s[field]===key&&!s.unique&&!s.replaces)out.push({k:kind,id,n:s.name,description:s.description});
 if(civic){for(const [kind,cat]of [['policy',POLICIES],['gov',GOVERNMENTS]])for(const [id,s]of Object.entries(cat))if(s.civic===key)out.push({k:kind,id,n:s.name,t:s.type,description:s.description});}
 else{for(const [kind,cat]of [['res',RESOURCES],['imp',IMPROVEMENTS]])for(const [id,s]of Object.entries(cat))if(s.tech===key)out.push({k:kind,id,n:(kind==='res'?'揭示':'')+s.name});}
 for(const [id,s]of Object.entries(RESEARCH_EFFECTS))if(id.startsWith(cacheKey+':'))out.push({k:'effect',id,n:s.name,description:s.description});
 researchRewardCache.set(cacheKey,out);return out;
}
