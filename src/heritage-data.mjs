// Accepted heritage catalogue with scoped user-authorized religion/movement revisions.
export const HERITAGE_DESIGN = {
  "version": "3.0.2",
  "gameVersion": "2.26.0",
  "project": "《诸文明·六角纪元》真实历史奇观与伟人系统 (Hex Civilizations: Epochs)",
  "date": "2026-10-15",
  "author": "Gemini (Historical Design & Systems Architecture)",
  "implementer": "Codex (Engine Engineering & Asset Pipeline)",
  "referencedStandard": {
    "title": "Sid Meier's Civilization VI: Gathering Storm + New Frontier Historical Roster Standard",
    "sources": [
      "https://www.civilopedia.net/en-US/gathering-storm/greatpeople/intro/",
      "https://www.civilopedia.net/en-US/gathering-storm/concepts/greatpeople_1/",
      "rules.mjs & heritage-data.mjs canonical engine contracts"
    ],
    "note": "参照文明6全资料片九大类别与历史时代分布规范，扩充至256位全球真实历史伟人与64座真实历史奇观。v3.0.2完成独立结构测试与真实2D/3D/迷雾测试后的5项客观契约微调：圣瓦西里/婆罗浮屠圣物旅游增量乘数设为1对齐翻倍、勃兰登堡门明确城市总生产力、胡佛大坝补全工业区前置与选址文案、马丘比丘清理面向玩家的适配器括号、强子对撞机精准匹配当前时代符合前置的随机科技实现。"
  },
  "userOverrideCompliance": {
    "commanderStacking": "最高取一法则（Highest applicable value）。大统帅与大海军家的常态光环、退役战斗力、移动力、射程加成同属性不叠加，一律取最高生效值；不设+15/+2叠加软上限。",
    "rangeStacking": "射程仅取最高一份加成，严格遵循时代与单位适用范围限制。",
    "absoluteWonderLoyalty": "自由女神像（6格100%绝对忠诚度）与总统山（防御战争叛乱免疫）绝对生效保留。",
    "artilleryBaseRanges": {
      "rocketartillery": 4,
      "antiair": 4,
      "sam": 6
    },
    "napoleonEraLimitation": {
      "key": "napoleon_bonaparte",
      "applicableEras": [
        3,
        4,
        5
      ],
      "note": "拿破仑仅适用于时代3/4/5单位，时代6火箭炮（rocketry时代6）不享受其射程+1加成。"
    },
    "religionFounding": "双轨并行。120信仰+圣地创教与大预言家激活创教均合法支持，遵守宗教上限。",
    "instantEvents": "瞬间治疗、晋升授予与实体单位获赠均为真实事件执行，不受数值取一限制。"
  },
  "statistics": {
    "wondersCount": 64,
    "greatPeopleCount": 256,
    "classesCount": 9,
    "distributionByClass": {
      "scientist": 36,
      "engineer": 32,
      "merchant": 32,
      "general": 36,
      "admiral": 28,
      "prophet": 16,
      "writer": 28,
      "artist": 28,
      "musician": 20
    },
    "distributionByEra": {
      "era0_ancient": 14,
      "era1_classical": 45,
      "era2_medieval": 51,
      "era3_renaissance": 48,
      "era4_industrial": 50,
      "era5_modern": 37,
      "era6_atomic": 11
    },
    "wondersDistributionByEra": {
      "era0_ancient": 8,
      "era1_classical": 13,
      "era2_medieval": 11,
      "era3_renaissance": 12,
      "era4_industrial": 10,
      "era5_modern": 7,
      "era6_atomic": 3
    },
    "totalRecipeTypes": 60,
    "totalWonders": 64,
    "wondersDelta": 28,
    "wondersByEra": {
      "0": 8,
      "1": 13,
      "2": 11,
      "3": 12,
      "4": 10,
      "5": 7,
      "6": 3
    },
    "totalGreatPeople": 256,
    "greatPeopleDelta": 156,
    "greatPeopleByClass": {
      "scientist": 36,
      "engineer": 32,
      "merchant": 32,
      "general": 36,
      "admiral": 28,
      "prophet": 16,
      "writer": 28,
      "artist": 28,
      "musician": 20
    },
    "greatPeopleByEra": {
      "0": 14,
      "1": 45,
      "2": 51,
      "3": 48,
      "4": 50,
      "5": 37,
      "6": 11
    },
    "totalStandardRecipes": 60,
    "newWondersManifest": [
      {
        "key": "great_ziggurat",
        "name": "乌尔大塔庙",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "karnak",
        "name": "卡纳克神庙群",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "temple_of_artemis",
        "name": "阿耳忒弥斯神庙",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "knossos_palace",
        "name": "克诺索斯王宫",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "mahabodhi_temple",
        "name": "大菩提寺",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "weiyang_palace",
        "name": "未央宫",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "teotihuacan_sun_pyramid",
        "name": "特奥蒂瓦坎太阳金字塔",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "nalanda",
        "name": "那烂陀大寺",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "pantheon_rome",
        "name": "罗马万神殿",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "borobudur",
        "name": "婆罗浮屠",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "great_zimbabwe",
        "name": "大津巴布韦",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "himeji_castle",
        "name": "姬路城",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "notre_dame",
        "name": "巴黎圣母院",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "dayan_pagoda",
        "name": "大雁塔",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "temple_of_heaven",
        "name": "北京天坛",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "machu_picchu",
        "name": "马丘比丘",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "sankore_madrasa",
        "name": "桑科尔伊斯兰学校",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "saint_basil",
        "name": "圣瓦西里主教座堂",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "topkapi_palace",
        "name": "托普卡帕宫",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "brandenburg_gate",
        "name": "勃兰登堡门",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "brooklyn_bridge",
        "name": "布鲁克林大桥",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "louvre",
        "name": "卢浮宫",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "summer_palace",
        "name": "北京颐和园",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "empire_state",
        "name": "帝国大厦",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "sagrada_familia",
        "name": "圣家宗座圣殿",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "hoover_dam",
        "name": "胡佛大坝",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "cern_lhc",
        "name": "大型强子对撞机",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "burj_khalifa",
        "name": "哈利法塔",
        "era": 6,
        "eraName": "原子能时代"
      }
    ],
    "newGreatPeopleManifest": [
      {
        "key": "thales",
        "name": "泰勒斯",
        "classKey": "scientist",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "anaximander",
        "name": "阿那克西曼德",
        "classKey": "scientist",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "aryabhata",
        "name": "阿里亚哈塔",
        "classKey": "scientist",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "eratosthenes",
        "name": "埃拉托斯特尼",
        "classKey": "scientist",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "ptolemy",
        "name": "托勒密",
        "classKey": "scientist",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "avicenna",
        "name": "伊本·西那",
        "classKey": "scientist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "al_biruni",
        "name": "比鲁尼",
        "classKey": "scientist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "shen_kuo",
        "name": "沈括",
        "classKey": "scientist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "roger_bacon",
        "name": "罗吉尔·培根",
        "classKey": "scientist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "nicolaus_copernicus",
        "name": "尼古拉·哥白尼",
        "classKey": "scientist",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "li_shizhen",
        "name": "李时珍",
        "classKey": "scientist",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "william_harvey",
        "name": "威廉·哈维",
        "classKey": "scientist",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "louis_pasteur",
        "name": "路易·巴斯德",
        "classKey": "scientist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "gregor_mendel",
        "name": "格雷戈尔·孟德尔",
        "classKey": "scientist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "michael_faraday",
        "name": "迈克尔·法拉第",
        "classKey": "scientist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "antoine_lavoisier",
        "name": "安托万·拉瓦锡",
        "classKey": "scientist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "niels_bohr",
        "name": "尼尔斯·玻尔",
        "classKey": "scientist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "max_planck",
        "name": "马克斯·普朗克",
        "classKey": "scientist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "alexander_fleming",
        "name": "亚历山大·弗莱明",
        "classKey": "scientist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "qian_xuesen",
        "name": "钱学森",
        "classKey": "scientist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "john_von_neumann",
        "name": "约翰·冯·诺伊曼",
        "classKey": "scientist",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "stephen_hawking",
        "name": "斯蒂芬·霍金",
        "classKey": "scientist",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "imhotep",
        "name": "印何阗",
        "classKey": "engineer",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "hemiunu",
        "name": "海米昂",
        "classKey": "engineer",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "heron_of_alexandria",
        "name": "亚历山大的希罗",
        "classKey": "engineer",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "du_shi",
        "name": "杜诗",
        "classKey": "engineer",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "apollodorus_damascus",
        "name": "大马士革的阿波罗多罗斯",
        "classKey": "engineer",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "al_jazari",
        "name": "阿勒·贾扎里",
        "classKey": "engineer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "su_song",
        "name": "苏颂",
        "classKey": "engineer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "isidore_of_miletus",
        "name": "米利都的伊西多尔",
        "classKey": "engineer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "guo_shoujing",
        "name": "郭守敬",
        "classKey": "engineer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "andrea_palladio",
        "name": "安德烈亚·帕拉第奥",
        "classKey": "engineer",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "song_yingxing",
        "name": "宋应星",
        "classKey": "engineer",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "sebastien_vauban",
        "name": "塞巴斯蒂安·沃邦",
        "classKey": "engineer",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "isambard_kingdom_brunel",
        "name": "伊桑巴德·金厄姆·布鲁内尔",
        "classKey": "engineer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "george_stephenson",
        "name": "乔治·斯蒂芬森",
        "classKey": "engineer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "thomas_edison",
        "name": "托马斯·爱迪生",
        "classKey": "engineer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "zhan_tianyou",
        "name": "詹天佑",
        "classKey": "engineer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "henry_ford",
        "name": "亨利·福特",
        "classKey": "engineer",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "sergei_korolev",
        "name": "谢尔盖·科罗廖夫",
        "classKey": "engineer",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "robert_goddard",
        "name": "罗伯特·戈达德",
        "classKey": "engineer",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "jack_kilby",
        "name": "杰克·基尔比",
        "classKey": "engineer",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "ea_nasir",
        "name": "厄·纳西尔",
        "classKey": "merchant",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "hanno_the_navigator",
        "name": "航海家汉诺",
        "classKey": "merchant",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "sang_hongyang",
        "name": "桑弘羊",
        "classKey": "merchant",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "lu_buwei",
        "name": "吕不韦",
        "classKey": "merchant",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "herod_atticus",
        "name": "希罗德·阿提库斯",
        "classKey": "merchant",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "mansa_musa",
        "name": "曼萨·穆萨",
        "classKey": "merchant",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "liu_yan",
        "name": "刘晏",
        "classKey": "merchant",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "enrico_dandolo",
        "name": "恩里科·丹多洛",
        "classKey": "merchant",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "ahmad_ibn_fadlan",
        "name": "阿哈迈德·伊本·法德兰",
        "classKey": "merchant",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "thomas_gresham",
        "name": "托马斯·格雷沙姆",
        "classKey": "merchant",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "pan_qiguan",
        "name": "潘启官",
        "classKey": "merchant",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "cornelis_de_graeff",
        "name": "科内利斯·德·赫拉夫",
        "classKey": "merchant",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "nathan_mayer_rothschild",
        "name": "内森·迈尔·罗斯柴尔德",
        "classKey": "merchant",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "cornelius_vanderbilt",
        "name": "科尼利厄斯·范德比尔特",
        "classKey": "merchant",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "j_p_morgan",
        "name": "J.P. 摩根",
        "classKey": "merchant",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "hu_xueyan",
        "name": "胡雪岩",
        "classKey": "merchant",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "henry_j_kaiser",
        "name": "亨利·J·凯撒",
        "classKey": "merchant",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "enrico_mattei",
        "name": "恩里科·马特伊",
        "classKey": "merchant",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "konosuke_matsushita",
        "name": "松下幸之助",
        "classKey": "merchant",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "sam_walton",
        "name": "萨姆·沃尔顿",
        "classKey": "merchant",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "sargon_of_akkad",
        "name": "萨尔贡大帝",
        "classKey": "general",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "ramesses_ii",
        "name": "拉美西斯二世",
        "classKey": "general",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "alexander_the_great",
        "name": "亚历山大大帝",
        "classKey": "general",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "julius_caesar",
        "name": "尤利乌斯·恺撒",
        "classKey": "general",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "chandragupta_maurya",
        "name": "旃陀罗笈多·孔雀",
        "classKey": "general",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "cyrus_the_great",
        "name": "居鲁士二世（居鲁士大帝）",
        "classKey": "general",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "belisarius",
        "name": "贝利撒留",
        "classKey": "general",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "khalid_ibn_al_walid",
        "name": "哈立德·本·瓦利德",
        "classKey": "general",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "saladin",
        "name": "萨拉丁",
        "classKey": "general",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "charlemagne",
        "name": "查理曼大帝",
        "classKey": "general",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "minamoto_no_yoshitsune",
        "name": "源义经",
        "classKey": "general",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "oda_nobunaga",
        "name": "织田信长",
        "classKey": "general",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "albrecht_von_wallenstein",
        "name": "阿尔布雷希特·冯·华伦斯坦",
        "classKey": "general",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "maurice_of_nassau",
        "name": "拿骚的毛里茨",
        "classKey": "general",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "alexander_suvorov",
        "name": "亚历山大·苏沃洛夫",
        "classKey": "general",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "arthur_wellesley",
        "name": "阿瑟·韦尔斯利（威灵顿公爵）",
        "classKey": "general",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "simon_bolivar",
        "name": "西蒙·玻利瓦尔",
        "classKey": "general",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "shaka_zulu",
        "name": "夏卡·祖鲁",
        "classKey": "general",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "erwin_rommel",
        "name": "埃尔温·隆美尔",
        "classKey": "general",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "bernard_montgomery",
        "name": "伯纳德·蒙哥马利",
        "classKey": "general",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "george_patton",
        "name": "乔治·巴顿",
        "classKey": "general",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "vo_nguyen_giap",
        "name": "武元甲",
        "classKey": "general",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "himilco",
        "name": "希米尔科",
        "classKey": "admiral",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "gaius_duilius",
        "name": "盖乌斯·杜伊利乌斯",
        "classKey": "admiral",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "marcus_vipsanius_agrippa",
        "name": "马尔库斯·维普撒尼乌斯·阿格里帕",
        "classKey": "admiral",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "roger_of_lauria",
        "name": "劳里亚的罗杰",
        "classKey": "admiral",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "andrea_doria",
        "name": "安德烈亚·多利亚",
        "classKey": "admiral",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "erik_the_red",
        "name": "红发埃里克",
        "classKey": "admiral",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "michiel_de_ruyter",
        "name": "米希尔·德·鲁伊特",
        "classKey": "admiral",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "alvaro_de_bazan",
        "name": "阿尔瓦罗·德·巴赞（圣克鲁斯侯爵）",
        "classKey": "admiral",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "john_paul_jones",
        "name": "约翰·保罗·琼斯",
        "classKey": "admiral",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "maarten_tromp",
        "name": "马尔滕·特龙普",
        "classKey": "admiral",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "matthew_c_perry",
        "name": "马修·佩里",
        "classKey": "admiral",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "wilhelm_von_tegetthoff",
        "name": "威廉·冯·特盖特霍夫",
        "classKey": "admiral",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "togo_heihachiro",
        "name": "东乡平八郎",
        "classKey": "admiral",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "andrew_cunningham",
        "name": "安德鲁·坎宁安",
        "classKey": "admiral",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "william_halsey",
        "name": "威廉·哈尔西",
        "classKey": "admiral",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "sergey_gorshkov",
        "name": "谢尔盖·戈尔什科夫",
        "classKey": "admiral",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "akhenaten",
        "name": "阿肯那顿",
        "classKey": "prophet",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "mani",
        "name": "摩尼",
        "classKey": "prophet",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "adi_shankara",
        "name": "阿迪·商羯罗",
        "classKey": "prophet",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "francis_of_assisi",
        "name": "阿西西的圣方济各",
        "classKey": "prophet",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "rumi",
        "name": "贾拉勒丁·鲁米",
        "classKey": "prophet",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "xuanzang",
        "name": "玄奘",
        "classKey": "prophet",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "bodhidharma",
        "name": "菩提达摩",
        "classKey": "prophet",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "john_calvin",
        "name": "让·加尔文",
        "classKey": "prophet",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "enheduanna",
        "name": "恩希杜安娜",
        "classKey": "writer",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "virgil",
        "name": "维吉尔",
        "classKey": "writer",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "sima_qian",
        "name": "司马迁",
        "classKey": "writer",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "kalidasa",
        "name": "迦梨陀娑",
        "classKey": "writer",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "li_bai",
        "name": "李白",
        "classKey": "writer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "murasaki_shikibu",
        "name": "紫式部",
        "classKey": "writer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "geoffrey_chaucer",
        "name": "杰弗里·乔叟",
        "classKey": "writer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "ferdowsi",
        "name": "菲尔多西",
        "classKey": "writer",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "wu_chengen",
        "name": "吴承恩",
        "classKey": "writer",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "moliere",
        "name": "莫里哀",
        "classKey": "writer",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "john_milton",
        "name": "约翰·弥尔顿",
        "classKey": "writer",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "victor_hugo",
        "name": "维克多·雨果",
        "classKey": "writer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "edgar_allan_poe",
        "name": "埃德加·爱伦·坡",
        "classKey": "writer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "jane_austen",
        "name": "简·奥斯汀",
        "classKey": "writer",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "rabindranath_tagore",
        "name": "罗宾德拉纳特·泰戈尔",
        "classKey": "writer",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "james_joyce",
        "name": "詹姆斯·乔伊斯",
        "classKey": "writer",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "gabriel_garcia_marquez",
        "name": "加夫列尔·加西亚·马尔克斯",
        "classKey": "writer",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "jorge_luis_borges",
        "name": "豪尔赫·路易斯·博尔赫斯",
        "classKey": "writer",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "thutmose_sculptor",
        "name": "图特摩斯（雕塑家）",
        "classKey": "artist",
        "era": 0,
        "eraName": "远古时代"
      },
      {
        "key": "phidias",
        "name": "菲迪亚斯",
        "classKey": "artist",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "polykleitos",
        "name": "波留克列特斯",
        "classKey": "artist",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "apelles",
        "name": "阿佩利斯",
        "classKey": "artist",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "yan_liben",
        "name": "阎立本",
        "classKey": "artist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "giotto_di_bondone",
        "name": "乔托·迪·邦多内",
        "classKey": "artist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "fan_kuan",
        "name": "范宽",
        "classKey": "artist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "andrei_rublev",
        "name": "安德烈·鲁布烈夫",
        "classKey": "artist",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "sandro_botticelli",
        "name": "桑德罗·波提切利",
        "classKey": "artist",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "albrecht_durer",
        "name": "阿尔布雷希特·丢勒",
        "classKey": "artist",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "johannes_vermeer",
        "name": "约翰内斯·维米尔",
        "classKey": "artist",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "vincent_van_gogh",
        "name": "文森特·梵高",
        "classKey": "artist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "j_m_w_turner",
        "name": "约瑟夫·马洛德·威廉·透纳",
        "classKey": "artist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "auguste_rodin",
        "name": "奥古斯特·罗丹",
        "classKey": "artist",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "qi_baishi",
        "name": "齐白石",
        "classKey": "artist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "salvador_dali",
        "name": "萨尔瓦多·达利",
        "classKey": "artist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "frida_kahlo",
        "name": "弗里达·卡罗",
        "classKey": "artist",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "andy_warhol",
        "name": "安迪·沃霍尔",
        "classKey": "artist",
        "era": 6,
        "eraName": "原子能时代"
      },
      {
        "key": "li_yan_nian",
        "name": "李延年",
        "classKey": "musician",
        "era": 1,
        "eraName": "古典时代"
      },
      {
        "key": "hildegard_of_bingen",
        "name": "宾根的希尔德加德",
        "classKey": "musician",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "guillaume_de_machaut",
        "name": "纪尧姆·德·马绍",
        "classKey": "musician",
        "era": 2,
        "eraName": "中古时代"
      },
      {
        "key": "giovanni_pierluigi_da_palestrina",
        "name": "乔瓦尼·皮耶路易吉·达·帕莱斯特里纳",
        "classKey": "musician",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "claudio_monteverdi",
        "name": "克劳迪奥·蒙特威尔第",
        "classKey": "musician",
        "era": 3,
        "eraName": "文艺复兴"
      },
      {
        "key": "franz_schubert",
        "name": "弗朗茨·舒伯特",
        "classKey": "musician",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "johannes_brahms",
        "name": "约翰内斯·勃拉姆斯",
        "classKey": "musician",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "giuseppe_verdi",
        "name": "朱塞佩·威尔第",
        "classKey": "musician",
        "era": 4,
        "eraName": "工业时代"
      },
      {
        "key": "claude_debussy",
        "name": "克劳德·德彪西",
        "classKey": "musician",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "igor_stravinsky",
        "name": "伊戈尔·斯特拉文斯基",
        "classKey": "musician",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "xian_xinghai",
        "name": "冼星海",
        "classKey": "musician",
        "era": 5,
        "eraName": "现代"
      },
      {
        "key": "miles_davis",
        "name": "迈尔斯·戴维斯",
        "classKey": "musician",
        "era": 6,
        "eraName": "原子能时代"
      }
    ]
  },
  "recruitmentFormulaContract": {
    "formula": "baseThreshold = Base(era) + n * Step(era)",
    "eraParameters": {
      "0": {
        "base": 60,
        "step": 15,
        "note": "远古时代"
      },
      "1": {
        "base": 120,
        "step": 30,
        "note": "古典时代"
      },
      "2": {
        "base": 240,
        "step": 60,
        "note": "中古时代"
      },
      "3": {
        "base": 420,
        "step": 90,
        "note": "文艺复兴"
      },
      "4": {
        "base": 650,
        "step": 130,
        "note": "工业时代"
      },
      "5": {
        "base": 950,
        "step": 180,
        "note": "现代"
      },
      "6": {
        "base": 1300,
        "step": 240,
        "note": "原子能时代"
      }
    },
    "paceMultipliers": {
      "standard": 1,
      "epic": 1.5,
      "marathon": 3
    },
    "patronageGoldFormula": "PatronageCost = round((RemainingPoints / BasePoints) * BasePoints * 1.5 * PaceFactor * 2.0)",
    "patronageFaithFormula": "PatronageCost = round((RemainingPoints / BasePoints) * BasePoints * 1.0 * PaceFactor * 1.5)",
    "note": "所有招募门槛与赞助算法均严格基于以上数学契约，无任何硬编码离散偏移。"
  },
  "coreMechanics": {
    "economyPeriodSeconds": 20,
    "simulationSubstepSeconds": 0.05,
    "speedFactors": {
      "standard": 1,
      "epic": 1.5,
      "marathon": 3
    },
    "wonderFootprintHexes": 1,
    "wonderCityRangeHexes": 2,
    "greatPersonMovementSpeed": 3,
    "greatPersonRoadMovementSpeed": 4,
    "greatPersonImmunity": "Immune to destruction/capture. Teleports to nearest friendly city on hostile entry. If no friendly city remains, disbanded into history.",
    "goldPatronageMultiplier": 4.5,
    "faithPatronageMultiplier": 3,
    "refundOnRaceLossPercentage": 100,
    "singleSourceOfTruth": "Individual baseThreshold in catalog is authoritative for standard pace (1.0). RecruitThreshold = round(baseThreshold * speedFactor). Dynamic formula Base(Era) + n_era * Step(Era) matches baseThreshold exactly.",
    "patronageScalingRule": "DeltaP = max(0, RecruitThreshold - CurrentPoints). GoldCost = round(DeltaP * 4.5). FaithCost = round(DeltaP * 3.0). Do NOT multiply DeltaP by speedFactor again, because RecruitThreshold is already speed-scaled.",
    "ownershipAndIdempotencyRules": {
      "workAttributionOnCityCapture": "作品实体存放在具体槽位中。当城市被敌方攻占时，城内所有巨作（包括圣物、名画、著作、乐谱）连同建筑/奇观槽位一并完整移交新占领方；原拥有国对应文化与旅游产出即时扣除，占领国即时获得。",
      "workTransferRule": "巨作可在拥有对应空槽的己方城市之间自由调配转移；每次转移耗时 1 个经济周期（20秒）；转移期间巨作处于运输状态，不提供文化与旅游产出；到达新槽位后产出即时在新城市生效。",
      "pillageBehavior": "当圣地、剧院广场或包含巨作的奇观被敌军掠夺陷入瘫痪状态时，其内部存放的巨作产出临时归零（暂停生效），直至该区域或奇观通过工程修复（消耗 20% 基础产能）完成后恢复正常产出。被掠夺不会直接摧毁巨作实体。",
      "cityBuffAttributionOnCapture": "绑定激活城市的永久被动（如学院科技+3、水渠沿河产出+1、建筑产出加成等）作为城市物理实体的属性存在。城市被攻占后，该城市属性直接归属新占领方文明享有。",
      "empireBuffAttributionOnCapture": "国家级/文明级全局永久增益（如科技解锁、尤里卡、商路总容量+1、政策卡增益、全国性维护费削减等）已并入文明元数据全局状态，即使该伟人最初的激活城市被攻占陷落，该文明已获得的全局科技与机制收益依然永久保留，不随城市易手而丢失或转移。",
      "unitRetireBuffAttribution": "大统帅与大海军家退役赋予的部队永久增益（如战力+6、移动+1、致死护盾等）深度绑定受体作战单位实体。若该单位在战斗中被彻底消灭，该单位承载的永久英雄印记随之消亡，不可转嫁或重造。",
      "idempotencyRules": "（1）伟人招募与激活幂等：全服每位历史伟人拥有唯一 Key，一生仅能招募一次并消耗固定次数，激活完成后销毁或退役，绝不可重复触发。（2）Buff 与效果去重幂等：所有永久增益与光环均带有全局唯一的 EffectKey（如 GP_BUFF_LI_CHUN_RIVER 或 GP_HERO_BAI_QI_COMBAT）。系统在结算时检测目标实体是否已有该 Key；若已有，同名唯一永久效果自动静默忽略（禁止多次累加），同名限时效果仅刷新持续时间（durationCycles），严格保证系统状态迁移的幂等性与数学纯洁性。"
    }
  },
  "greatWorkSlotRules": {
    "buildingSlots": {
      "palace": {
        "wildcard": 1,
        "writing": 0,
        "art": 0,
        "music": 0,
        "relic": 0
      },
      "amphitheater": {
        "wildcard": 0,
        "writing": 2,
        "art": 0,
        "music": 0,
        "relic": 0
      },
      "museum": {
        "wildcard": 0,
        "writing": 0,
        "art": 3,
        "music": 0,
        "relic": 0
      },
      "opera": {
        "wildcard": 0,
        "writing": 0,
        "art": 0,
        "music": 2,
        "relic": 0
      },
      "broadcast": {
        "wildcard": 0,
        "writing": 0,
        "art": 0,
        "music": 2,
        "relic": 0
      },
      "temple": {
        "wildcard": 0,
        "writing": 0,
        "art": 0,
        "music": 0,
        "relic": 1
      }
    },
    "wonderSlots": {
      "parthenon": {
        "art": 1
      },
      "mont_saint_michel": {
        "relic": 2
      },
      "st_peters": {
        "art": 1,
        "relic": 1
      },
      "hermitage": {
        "art": 4
      },
      "broadway": {
        "writing": 1,
        "music": 2
      },
      "sydney_opera": {
        "music": 3
      }
    },
    "baseWorkYields": {
      "writing": {
        "culture": 2,
        "tourism": 2
      },
      "art": {
        "culture": 2,
        "tourism": 2
      },
      "music": {
        "culture": 2,
        "tourism": 2
      },
      "relic": {
        "faith": 4,
        "tourism": 4
      }
    },
    "modernTourismMultiplier": {
      "afterFlight": 1,
      "afterRadio": 1
    },
    "noVacantSlotBehavior": "Activation button disabled in UI B with tooltip '此城已无可用对应巨作槽位，请将伟人转移至有空槽的城市' (No slot available)."
  },
  "greatPeopleClasses": [
    {
      "key": "scientist",
      "name": "大科学家",
      "englishName": "Great Scientist",
      "pointSources": [
        {
          "type": "district",
          "key": "campus",
          "points": 1
        },
        {
          "type": "building",
          "key": "library",
          "points": 1
        },
        {
          "type": "building",
          "key": "university",
          "points": 2
        },
        {
          "type": "building",
          "key": "lab",
          "points": 3
        },
        {
          "type": "wonder",
          "key": "greatlibrary",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "oxford",
          "points": 3
        },
        {
          "type": "wonder",
          "key": "observatory",
          "points": 3
        }
      ],
      "primaryTarget": "campus"
    },
    {
      "key": "engineer",
      "name": "大工程师",
      "englishName": "Great Engineer",
      "pointSources": [
        {
          "type": "district",
          "key": "industrial",
          "points": 1
        },
        {
          "type": "building",
          "key": "workshop",
          "points": 1
        },
        {
          "type": "building",
          "key": "factory",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "halicarnassus",
          "points": 1
        },
        {
          "type": "wonder",
          "key": "venetian_arsenal",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "ruhr_valley",
          "points": 3
        },
        {
          "type": "wonder",
          "key": "eiffel",
          "points": 3
        }
      ],
      "primaryTarget": "industrial_or_under_construction_wonder"
    },
    {
      "key": "merchant",
      "name": "大商人",
      "englishName": "Great Merchant",
      "pointSources": [
        {
          "type": "district",
          "key": "commercial",
          "points": 1
        },
        {
          "type": "building",
          "key": "market",
          "points": 1
        },
        {
          "type": "building",
          "key": "bank",
          "points": 2
        },
        {
          "type": "building",
          "key": "exchange",
          "points": 3
        },
        {
          "type": "wonder",
          "key": "colossus",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "forbidden",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "big_ben",
          "points": 3
        },
        {
          "type": "wonder",
          "key": "panama_canal",
          "points": 4
        }
      ],
      "primaryTarget": "commercial_or_cityCenter"
    },
    {
      "key": "general",
      "name": "大统帅",
      "englishName": "Great General",
      "pointSources": [
        {
          "type": "district",
          "key": "barracks",
          "points": 1
        },
        {
          "type": "wonder",
          "key": "terracotta_army",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "alhambra",
          "points": 2
        }
      ],
      "primaryTarget": "military_unit_or_barracks",
      "hasPassiveAura": true,
      "auraRadius": 2,
      "auraCombatBonus": 5,
      "auraMovementBonus": 1,
      "auraStackingRule": "No stacking among multiple Great Generals on the same unit. Domain isolated to land military units."
    },
    {
      "key": "admiral",
      "name": "大海军家",
      "englishName": "Great Admiral",
      "pointSources": [
        {
          "type": "district",
          "key": "harbor",
          "points": 1
        },
        {
          "type": "building",
          "key": "lighthouse",
          "points": 1
        },
        {
          "type": "building",
          "key": "shipyard",
          "points": 2
        },
        {
          "type": "building",
          "key": "seaport",
          "points": 3
        },
        {
          "type": "wonder",
          "key": "halicarnassus",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "great_lighthouse",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "venetian_arsenal",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "torre_de_belem",
          "points": 2
        }
      ],
      "primaryTarget": "naval_unit_or_harbor",
      "hasPassiveAura": true,
      "auraRadius": 2,
      "auraCombatBonus": 5,
      "auraMovementBonus": 1,
      "auraStackingRule": "No stacking among multiple Great Admirals on the same unit. Domain isolated to naval units."
    },
    {
      "key": "prophet",
      "name": "大预言家",
      "englishName": "Great Prophet",
      "pointSources": [
        {
          "type": "district",
          "key": "holy",
          "points": 1
        },
        {
          "type": "building",
          "key": "shrine",
          "points": 1
        },
        {
          "type": "building",
          "key": "temple",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "stonehenge",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "hagia_sophia",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "st_peters",
          "points": 2
        }
      ],
      "primaryTarget": "holy_site",
      "isReligiousFounder": true,
      "compatibilityNote": "Default mode: 100% compatible with existing 120 Faith + Holy Site religion founding. Great Prophet founds religion for 0 Faith or grants massive Evangelism + Relic."
    },
    {
      "key": "writer",
      "name": "大作家",
      "englishName": "Great Writer",
      "pointSources": [
        {
          "type": "district",
          "key": "theater",
          "points": 1
        },
        {
          "type": "building",
          "key": "amphitheater",
          "points": 1
        },
        {
          "type": "wonder",
          "key": "broadway",
          "points": 2
        }
      ],
      "primaryTarget": "theater_or_city_with_writing_slot",
      "createsGreatWorkType": "writing"
    },
    {
      "key": "artist",
      "name": "大艺术家",
      "englishName": "Great Artist",
      "pointSources": [
        {
          "type": "district",
          "key": "theater",
          "points": 1
        },
        {
          "type": "building",
          "key": "museum",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "parthenon",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "st_peters",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "hermitage",
          "points": 3
        }
      ],
      "primaryTarget": "theater_or_city_with_art_slot",
      "createsGreatWorkType": "art"
    },
    {
      "key": "musician",
      "name": "大音乐家",
      "englishName": "Great Musician",
      "pointSources": [
        {
          "type": "district",
          "key": "theater",
          "points": 1
        },
        {
          "type": "building",
          "key": "opera",
          "points": 2
        },
        {
          "type": "building",
          "key": "broadcast",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "broadway",
          "points": 2
        },
        {
          "type": "wonder",
          "key": "sydney_opera",
          "points": 3
        }
      ],
      "primaryTarget": "theater_or_city_with_music_slot",
      "createsGreatWorkType": "music"
    }
  ],
  "legacyWonderMigration": {
    "pyramids": {
      "legacyKey": "pyramids",
      "historicalName": "吉萨大金字塔",
      "englishName": "The Great Pyramids of Giza",
      "status": "retained_and_enhanced",
      "previousName": "金字塔"
    },
    "greatlibrary": {
      "legacyKey": "greatlibrary",
      "historicalName": "亚历山大大图书馆",
      "englishName": "The Great Library of Alexandria",
      "status": "retained_and_enhanced",
      "previousName": "大图书馆"
    },
    "colosseum": {
      "legacyKey": "colosseum",
      "historicalName": "罗马大斗兽场",
      "englishName": "The Colosseum",
      "status": "retained_and_enhanced",
      "previousName": "大竞技场"
    },
    "oracle": {
      "legacyKey": "oracle",
      "historicalName": "德尔斐神谕所",
      "englishName": "The Oracle of Delphi",
      "status": "retained_and_enhanced",
      "previousName": "神谕殿"
    },
    "observatory": {
      "legacyKey": "observatory",
      "historicalName": "乌鲁伯格天文台",
      "englishName": "Ulugh Beg Observatory",
      "status": "migrated_to_historical",
      "previousName": "大观星台",
      "notes": "旧虚拟通用观星台重绘迁移为中世纪撒马尔罕真实历史天文台，保留原 key observatory。"
    },
    "forbidden": {
      "legacyKey": "forbidden",
      "historicalName": "紫禁城",
      "englishName": "The Forbidden City",
      "status": "standardized_historical_name",
      "previousName": "紫禁宫"
    },
    "eiffel": {
      "legacyKey": "eiffel",
      "historicalName": "埃菲尔铁塔",
      "englishName": "The Eiffel Tower",
      "status": "standardized_historical_name",
      "previousName": "天穹铁塔"
    },
    "oxford": {
      "legacyKey": "oxford",
      "historicalName": "牛津大学",
      "englishName": "University of Oxford",
      "status": "migrated_to_historical",
      "previousName": "寰宇大学",
      "notes": "彻底移除虚构名称'寰宇大学'，重绘为真实牛津大学，保留原 key oxford。"
    }
  },
  "recipeRegistry": {
    "eureka_grant": {
      "classKey": "scientist",
      "targetRequirement": "city_with_campus",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在拥有学院的城市激活。解锁指定科技尤里卡提升；可附加本城永久科技产出、全国图书馆/学院/实验室科技增益或瞬时工业产能注入。",
      "parameters": [
        "eurekaTechs",
        "cityPermanentScience",
        "empireLibraryScienceBonus",
        "empireCampusScienceBonus",
        "empireLabScienceBonus",
        "instantCityProduction"
      ]
    },
    "free_building": {
      "classKey": "scientist",
      "targetRequirement": "city_with_campus_or_industrial",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在拥有学院或工业区的城市激活。免费直接建造指定区域建筑（如图书馆、工厂），若已建有则回退发放大量科技/金币储备，并提升建筑产出倍率。",
      "parameters": [
        "freeBuilding",
        "scienceReserveFallback",
        "campusBuildingScienceMultiplier",
        "empireFactoriesProductionBonus"
      ]
    },
    "free_tech_and_building_boost": {
      "classKey": "scientist",
      "targetRequirement": "campus_with_university",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在拥有大学的学院区域激活。立即免费随机解锁指定时代范围内的未研发科技，并使所在城市的大学永久提升科技与生产力产出。",
      "parameters": [
        "universityScienceBonus",
        "universityProductionBonus",
        "freeRandomTechCount",
        "targetEras"
      ]
    },
    "mountain_science_burst": {
      "classKey": "scientist",
      "targetRequirement": "adjacent_mountain_or_campus",
      "scope": "empire",
      "timing": "instant",
      "description": "在相邻山脉的学院或地块激活。根据相邻山脉六角格数量获得巨额瞬时科研点数爆发，并获得固定科技储备。",
      "parameters": [
        "scienceBurstPerAdjacentMountain",
        "flatScienceBonus"
      ]
    },
    "science_burst_exploration": {
      "classKey": "scientist",
      "targetRequirement": "natural_wonder_or_coast_campus",
      "scope": "empire",
      "timing": "instant",
      "description": "在自然奇观或沿海学院激活。立即获得巨额科技点数储备，并根据当前已探明的外交已知文明数量获得额外科研奖赏。",
      "parameters": [
        "instantScienceBurst",
        "scienceBonusPerDiscoveredCiv"
      ]
    },
    "free_tech_grant": {
      "classKey": "scientist",
      "targetRequirement": "campus_with_lab",
      "scope": "empire",
      "timing": "instant",
      "description": "在拥有研究实验室的学院激活。立即免费随机解锁指定时代范围内的 1~2 项未研发核心科技，或解锁关键科技尤里卡。",
      "parameters": [
        "freeRandomTechCount",
        "targetEras",
        "eurekaTechs"
      ]
    },
    "modern_atomic_eurekas": {
      "classKey": "scientist",
      "targetRequirement": "campus_with_lab",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在拥有研究实验室的学院激活。立即解锁现代与原子能时代所有科技的尤里卡时刻，且全国所有研究实验室永久提升科技产出。",
      "parameters": [
        "allLabsScienceBonus",
        "allModernAndAtomicEurekas"
      ]
    },
    "nuclear_science_grant": {
      "classKey": "scientist",
      "targetRequirement": "campus_with_lab",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在拥有研究实验室的学院激活。立即解锁核裂变与原子能等前沿科技尤里卡，注入大量瞬时科技点数，并使核动力研究实验室永久增益。",
      "parameters": [
        "eurekaTechs",
        "instantScienceBurst",
        "nuclearLabScienceBonus"
      ]
    },
    "information_tech_burst": {
      "classKey": "scientist",
      "targetRequirement": "campus_with_lab",
      "scope": "empire",
      "timing": "instant",
      "description": "在拥有研究实验室的学院激活。立即解锁计算机、电信与人造卫星等信息时代关键科技尤里卡，并注入终极大额科技爆发点数。",
      "parameters": [
        "eurekaTechs",
        "instantScienceBurst"
      ]
    },
    "eureka_and_production_burst": {
      "classKey": "engineer",
      "targetRequirement": "city_center_or_industrial",
      "scope": "city_and_empire",
      "timing": "instant",
      "description": "在城市中心或工业区激活。立即解锁早期核心工程科技尤里卡（如工程、机械），并向所在城市注入大量瞬时工业建造生产力。",
      "parameters": [
        "eurekaTechs",
        "instantCityProduction"
      ]
    },
    "district_production_permanent": {
      "classKey": "engineer",
      "targetRequirement": "city_with_district",
      "scope": "city",
      "timing": "permanent",
      "description": "在拥有特色区域的城市激活。所在城市所有专业区域永久每周期提升基础生产力，并提升城市城墙防御与外生容量。",
      "parameters": [
        "cityDistrictProductionBonus",
        "wallCapacityBonus"
      ]
    },
    "infrastructure_rush": {
      "classKey": "engineer",
      "targetRequirement": "river_or_district_tile",
      "scope": "city_and_tile",
      "timing": "instant_and_permanent",
      "description": "分阶激活（2次）。第1次激活瞬间秒建水渠或城墙工程；第2次激活永久提升所在城市全部沿河六角格地块的生产力与金币产出（具备同城防重入幂等）。",
      "parameters": [
        "charge1ProductionRush",
        "charge2RiverTileProductionBonus",
        "charge2RiverTileGoldBonus"
      ]
    },
    "printing_culture_science_burst": {
      "classKey": "engineer",
      "targetRequirement": "city_with_library_or_workshop",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在拥有图书馆或作坊的城市激活。立即解锁印刷术科技尤里卡；所在城市印刷传播永久提供文化与科技双重周期产出。",
      "parameters": [
        "eurekaTechs",
        "cityPermanentCulture",
        "cityPermanentScience"
      ]
    },
    "wonder_production_rush": {
      "classKey": "engineer",
      "targetRequirement": "city_with_wonder_or_industrial",
      "scope": "city",
      "timing": "instant_and_permanent",
      "description": "向当前城市正在建造的世界奇观注入巨额绝对生产力点数；若处于特定时代或附带文化灵感，额外注入文化储备或强化作坊文化。",
      "parameters": [
        "wonderProductionRush",
        "workshopCultureBonus",
        "instantCulture",
        "modernEraWonderRushBonus"
      ]
    },
    "district_amenity_housing_grant": {
      "classKey": "engineer",
      "targetRequirement": "city_with_district",
      "scope": "city",
      "timing": "instant_and_permanent",
      "description": "多次激活（2次）。每次激活为所在城市永久提供 +1 宜居度与 +1 住房容量，并为当前在建工程直接注入生产力。",
      "parameters": [
        "charges",
        "chargeAmenity",
        "chargeHousing",
        "chargeProductionRush"
      ]
    },
    "amenity_and_tourism_burst": {
      "classKey": "engineer",
      "targetRequirement": "city_with_entertainment_or_industrial",
      "scope": "city",
      "timing": "permanent",
      "description": "在拥有娱乐中心或工业区的城市激活。所在城市永久提升宜居度与住房容量，并为城市额外提供高额周期旅游业绩。",
      "parameters": [
        "cityAmenityBonus",
        "cityHousingBonus",
        "cityTourismBonus"
      ]
    },
    "regional_power_boost": {
      "classKey": "engineer",
      "targetRequirement": "industrial_or_powerplant",
      "scope": "city_regional_and_empire",
      "timing": "permanent",
      "description": "在工业区或发电厂激活。激活城市工业区大幅增益，并向 9 格几何半径内的所有己方城市辐射提供生产力与科研加成；全国所有发电厂产出同步永久提升。",
      "parameters": [
        "targetCityIndustrialProductionBonus",
        "targetCityIndustrialScienceBonus",
        "regionalBonusDistance",
        "regionalCityProductionBonus",
        "regionalCityScienceBonus",
        "empirePowerplantsProductionBonus",
        "empirePowerplantsScienceBonus"
      ]
    },
    "space_production_rush": {
      "classKey": "engineer",
      "targetRequirement": "city_with_spaceport_or_industrial",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在拥有航天基地或工业区的城市激活。解锁火箭学科技尤里卡；为在建太空竞赛项目注入大额生产力，并使全国太空项目生产力倍率永久提升。",
      "parameters": [
        "spaceRaceProductionMultiplier",
        "cityProjectProductionRush",
        "eurekaTechs"
      ]
    },
    "treasury_and_tile_annex": {
      "classKey": "merchant",
      "targetRequirement": "city_center",
      "scope": "city_and_empire",
      "timing": "instant",
      "description": "在城市中心激活。立即获得国库金币注资，并自动免费将该城市相邻的 3 个中立六角格领土无偿吞并圈入帝国版图。",
      "parameters": [
        "instantGold",
        "annexUnownedAdjacentTilesCount"
      ]
    },
    "market_trade_boost": {
      "classKey": "merchant",
      "targetRequirement": "commercial_hub",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心激活。立即获得丰厚金币注资，本城商业中心金币产出永久提升 30%，帝国永久增加 +1 贸易路线容量。",
      "parameters": [
        "instantGold",
        "cityCommercialGoldMultiplier",
        "tradeCapacityBonus"
      ]
    },
    "trade_capacity_grant": {
      "classKey": "merchant",
      "targetRequirement": "commercial_or_capital",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心或首都激活。永久提升帝国贸易路线容量上限（+1 商路），并向国库注入大额瞬时金币储备。",
      "parameters": [
        "tradeCapacityBonus",
        "instantGold",
        "foreignRouteGoldBonus",
        "revealTilesRadius"
      ]
    },
    "trade_capacity_and_vision": {
      "classKey": "merchant",
      "targetRequirement": "commercial_or_harbor",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心或港口激活。帝国商路容量 +1，全国所有对外商路每周期额外产出金币，并立即驱散激活点周围 8 格范围的陆海迷雾。",
      "parameters": [
        "tradeCapacityBonus",
        "foreignRouteGoldBonus",
        "revealTilesRadius"
      ]
    },
    "treasury_grant_and_foreign_route_gold": {
      "classKey": "merchant",
      "targetRequirement": "commercial_hub",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心激活。获得巨额瞬时国库注资，并对全国所有对外商路提供每周期永久金币加成。",
      "parameters": [
        "instantGold",
        "foreignRouteGoldBonus"
      ]
    },
    "patronage_culture_finance": {
      "classKey": "merchant",
      "targetRequirement": "city_with_bank_or_commercial",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在拥有银行或商业中心的城市激活。获得国库金币储备；所在城市永久每周期提升文化产出，且本城银行金币产出永久增加。",
      "parameters": [
        "instantGold",
        "cityPermanentCulture",
        "bankGoldBonus"
      ]
    },
    "water_route_gold_burst": {
      "classKey": "merchant",
      "targetRequirement": "commercial_or_harbor",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心或港口激活。获得巨额金币储备；全国所有沿海水上商路金币产出永久提升，本城商业产出倍率永久提高。",
      "parameters": [
        "instantGold",
        "waterRouteGoldBonus",
        "cityCommercialGoldMultiplier"
      ]
    },
    "oil_improvement_and_exchange_double": {
      "classKey": "merchant",
      "targetRequirement": "oil_city_or_exchange",
      "scope": "city_and_empire",
      "timing": "permanent",
      "description": "在拥有石油改良设施或证券交易所的城市激活。全国所有石油资源地块每周期额外增加产能与金币产出；所在城市证券交易所金币产出翻倍。",
      "parameters": [
        "oilResourceProductionBonus",
        "oilResourceGoldBonus",
        "cityExchangeGoldMultiplier"
      ]
    },
    "project_production_and_transport_routes": {
      "classKey": "merchant",
      "targetRequirement": "commercial_or_harbor",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心或港口激活。注入国库金币与城市基建项目产能，国内商路提供额外产能与金币，全国平民与后勤单位维护费降低 50%。",
      "parameters": [
        "instantGold",
        "cityProjectProductionBurst",
        "domesticRouteProductionBonus",
        "domesticRouteGoldBonus",
        "civilianUnitUpkeepDiscount"
      ]
    },
    "steel_industrial_gold_grant": {
      "classKey": "merchant",
      "targetRequirement": "industrial_or_commercial",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在工业区或商业中心激活。获得国库金币；全国所有矿山改良设施每周期额外产出 +1 生产力，全国所有城市每周期额外产出 +1 文化。",
      "parameters": [
        "instantGold",
        "empireMinesProductionBonus",
        "empireCityCultureBonus"
      ]
    },
    "treasury_interest_grant": {
      "classKey": "merchant",
      "targetRequirement": "commercial_with_exchange",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在拥有证券交易所的商业中心激活。获得高额国库注资；全国证券交易所金币产出增加，金币直接购买平民/基建单位享受 20% 永久折扣。",
      "parameters": [
        "instantGold",
        "empireExchangeGoldBonus",
        "goldDiscountPurchaseCivilians"
      ]
    },
    "corporate_finance_production": {
      "classKey": "merchant",
      "targetRequirement": "commercial_hub",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在商业中心激活。注入大量国库金币；全国所有商业中心每周期额外提供 +2 生产力，全国所有银行额外产出 +4 金币。",
      "parameters": [
        "instantGold",
        "allCommercialHubsProductionBonus",
        "bankGoldBonus"
      ]
    },
    "retire_promotion_and_academy_culture": {
      "classKey": "general",
      "targetRequirement": "land_military_unit_or_barracks",
      "scope": "target_unit_and_city",
      "timing": "instant_and_permanent",
      "description": "常态提供指挥光环。退役激活：目标陆军部队满血恢复并免费获得 1 次战术晋升；激活所在城市军营为新训陆军提供永久初始经验（+5 XP）与文化（+2 文化），非全国生效。",
      "parameters": [
        "targetPromotion",
        "targetFullHeal",
        "barracksInitialXpBonus",
        "barracksCultureBonus"
      ]
    },
    "retire_speed_and_attack_burst": {
      "classKey": "general",
      "targetRequirement": "cavalry_or_melee_unit",
      "scope": "target_unit_and_adjacent",
      "timing": "duration_cycles",
      "description": "常态提供指挥光环。退役激活：目标部队及其 1 格相邻所有友军获得机动力 +1 与进攻战斗力 +4 爆发，持续 durationCycles 周期（默认6周期/120秒）。",
      "parameters": [
        "durationCycles",
        "targetAndAdjacentMovement",
        "targetAndAdjacentAttackStrength"
      ]
    },
    "retire_combat_annihilation": {
      "classKey": "general",
      "targetRequirement": "land_military_unit",
      "scope": "target_unit",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：目标部队战力永久 +6，对敌方城市攻城战力额外 +4，消灭敌方正规军时按战力差额掠夺 10 金币战利品。",
      "parameters": [
        "targetUnitCombatBonus",
        "enemyCitySiegeCombatBonus",
        "warKillGoldBonus"
      ]
    },
    "retire_corps_synergy": {
      "classKey": "general",
      "targetRequirement": "land_military_unit",
      "scope": "target_units_and_city",
      "timing": "instant_and_duration",
      "description": "常态提供指挥光环。退役激活：以激活点为中心 radius 格（2格）范围内所有友方陆军部队立即恢复 targetUnitsHeal（30）点生命值，并获得 +1 移动力持续 durationCycles 周期（4周期/80秒）；防御作战时所在城市每周期忠诚度 +3。",
      "parameters": [
        "targetUnitsHeal",
        "targetArmySpeedBonus",
        "defensiveLoyaltyBonus",
        "durationCycles",
        "radius"
      ]
    },
    "retire_loyalty_wall_heal_and_faith": {
      "classKey": "general",
      "targetRequirement": "defending_city_or_unit",
      "scope": "target_city",
      "timing": "instant",
      "description": "常态提供指挥光环。退役激活：目标防御城市忠诚度瞬时补满（恢复至 100%），城墙恢复 100 点生命值，并获得 120 信仰储备。",
      "parameters": [
        "cityLoyaltyRestoreMax",
        "cityWallRepairHp",
        "instantFaith"
      ]
    },
    "retire_ambush_speed_bonus": {
      "classKey": "general",
      "targetRequirement": "cavalry_or_infantry_unit",
      "scope": "target_unit",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：目标部队战力永久 +5、移动力永久 +1，且行动时完全无视敌方控制区（ZOC）拦截。",
      "parameters": [
        "targetUnitCombatBonus",
        "targetUnitMovementBonus",
        "ignoreZoc"
      ]
    },
    "retire_crusader_zeal": {
      "classKey": "general",
      "targetRequirement": "melee_or_cavalry_unit",
      "scope": "target_unit_and_adjacent",
      "timing": "instant_and_permanent",
      "description": "常态提供指挥光环。退役激活：目标十字军主力近战/骑兵进攻战力永久 +8，相邻友军恢复 25 生命值，并获得 100 信仰储备。",
      "parameters": [
        "targetUnitAttackStrengthBonus",
        "targetUnitsHeal",
        "instantFaith"
      ]
    },
    "retire_deep_raid_tactics": {
      "classKey": "general",
      "targetRequirement": "cavalry_unit",
      "scope": "target_unit_and_empire",
      "timing": "permanent_and_duration",
      "description": "常态提供指挥光环。退役激活：目标骑兵部队进攻战力永久 +6、移动力永久 +1；全国所有部队掠夺地块产出翻倍，持续 durationCycles 周期（6周期/120秒）。",
      "parameters": [
        "targetCavalryAttackBonus",
        "targetCavalryMoveBonus",
        "pillageYieldMultiplier",
        "durationCycles"
      ]
    },
    "retire_mandarin_duck_formation": {
      "classKey": "general",
      "targetRequirement": "coastal_barracks_or_unit",
      "scope": "target_unit_and_city",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：目标部队防御战力永久 +6；激活所在城市要塞军营新训步兵获得初始经验（+8 XP），所在沿海城市防御战力永久 +6，非全国生效。",
      "parameters": [
        "targetUnitsDefensiveBonus",
        "barracksInitialXpBonus",
        "coastalCityDefenseBonus"
      ]
    },
    "retire_combined_arms_gunpowder": {
      "classKey": "general",
      "targetRequirement": "ranged_or_siege_unit",
      "scope": "target_unit_and_city",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：目标远程与攻城部队战力永久 +8；激活所在城市生产陆军火器与火炮类单位生产力倍率提升 25%（非全国生效）。",
      "parameters": [
        "targetArtilleryCombatBonus",
        "militaryProductionMultiplier"
      ]
    },
    "retire_elite_corps_and_war_weariness": {
      "classKey": "general",
      "targetRequirement": "siege_or_artillery_unit",
      "scope": "target_unit_and_empire",
      "timing": "instant_and_permanent",
      "description": "常态提供指挥光环。退役激活：将目标攻城单位晋升为精锐近卫炮兵军团（攻城战力永久 +10），并立即消除帝国当前对外战争中 50 点累积厌战度。",
      "parameters": [
        "siegeCombatStrengthBonus",
        "warWearinessReductionInstant"
      ]
    },
    "retire_total_war_doctrine": {
      "classKey": "general",
      "targetRequirement": "barracks_district",
      "scope": "empire",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：全国所有陆地作战部队基础战力永久 +3，所有已装备军事政策卡效果加成提升 20%。",
      "parameters": [
        "empireLandMilitaryCombatBonus",
        "militaryPolicyEffectiveness"
      ]
    },
    "retire_deep_battle_corps": {
      "classKey": "general",
      "targetRequirement": "tank_or_artillery_unit",
      "scope": "target_unit_and_empire",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：目标装甲/火炮部队战力永久 +7，攻坚破墙伤害 +10，全国对外战争厌战累积速度永久降低 30%。",
      "parameters": [
        "targetUnitsCombatBonus",
        "targetUnitsDefenseWallBonus",
        "warWearinessReduction"
      ]
    },
    "retire_overlord_logistics": {
      "classKey": "general",
      "targetRequirement": "airfield_or_military_unit",
      "scope": "empire",
      "timing": "permanent",
      "description": "常态提供指挥光环。退役激活：全国军事生产力永久提升 25%，陆空支援协同射程 +2，全国所有现役陆军部队维护费永久降低 20%。",
      "parameters": [
        "empireMilitaryProductionBonus",
        "airSupportRangeBonus",
        "unitUpkeepDiscount"
      ]
    },
    "retire_free_trireme_and_city_defense": {
      "classKey": "admiral",
      "targetRequirement": "harbor_or_naval_unit",
      "scope": "harbor_city",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：在激活所在港口免费获赠一艘战船，激活所在港口城市防御战力永久 +5，非全国生效。",
      "parameters": [
        "freeNavalUnit",
        "harborCityDefenseStrength"
      ]
    },
    "retire_naval_evasion_strike": {
      "classKey": "admiral",
      "targetRequirement": "naval_unit",
      "scope": "target_naval_unit",
      "timing": "permanent",
      "description": "常态提供海军光环。退役激活：目标战舰战力永久 +4、移动力 +1，沿海掠夺额外获赠 50 金币，且受重伤时脱离战场判定几率提升。",
      "parameters": [
        "targetNavalCombatBonus",
        "targetNavalSpeedBonus",
        "coastalRaidGoldBonus",
        "lowHpEvasionChance"
      ]
    },
    "retire_viking_longship_raid": {
      "classKey": "admiral",
      "targetRequirement": "naval_unit_or_coastal_city",
      "scope": "target_naval_unit",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：目标战船战力永久 +6，沿海掠夺一次性抢夺 120 金币与文化储备。",
      "parameters": [
        "targetNavalUnitCombatBonus",
        "coastalRaidGoldAndCultureBurst"
      ]
    },
    "retire_turtle_ship_ironclad": {
      "classKey": "admiral",
      "targetRequirement": "naval_warship",
      "scope": "target_naval_unit",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：目标战舰永久战力 +8、防御战力 +6，并获得 1 次免费战术晋升（装甲防卫大幅强化）。",
      "parameters": [
        "targetNavalCombatBonus",
        "targetArmorDefenseBonus",
        "freeNavalPromotion"
      ]
    },
    "retire_treasure_fleet_and_reveal_map": {
      "classKey": "admiral",
      "targetRequirement": "coastal_city_or_harbor",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：帝国永久增加 +1 贸易路线容量，获得 300 金币储备，并驱散周围 10 格水域迷雾。",
      "parameters": [
        "tradeCapacityBonus",
        "instantGold",
        "revealWaterRadius"
      ]
    },
    "retire_privateer_bounty": {
      "classKey": "admiral",
      "targetRequirement": "naval_warship",
      "scope": "target_naval_unit_and_empire",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：目标战舰战力永久 +5，击沉敌舰额外掠取 60 金币私掠赏金，立即获得 200 金币。",
      "parameters": [
        "targetNavalCombatBonus",
        "killEnemyNavalGoldBonus",
        "instantGold"
      ]
    },
    "retire_free_unit": {
      "classKey": "admiral",
      "targetRequirement": "harbor_district",
      "scope": "harbor_city_and_empire",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环（海战俘获几率）。退役激活：港口获赠一艘护卫舰，港口城每周期 +8 金币，全国海军维护费降低 15%。",
      "parameters": [
        "freeNavalUnit",
        "harborCityGoldBonus",
        "navalUpkeepDiscount",
        "boardingCaptureChance"
      ]
    },
    "retire_flagship_combat_and_survivability": {
      "classKey": "admiral",
      "targetRequirement": "naval_warship",
      "scope": "target_naval_unit",
      "timing": "permanent_with_trigger",
      "description": "常态提供海军光环。退役激活：目标主力舰永久战力 +5，并赋予一生仅有 1 次的致命护盾（濒死锁定保留 1 HP 并触发 3 秒无敌脱离）。",
      "parameters": [
        "targetNavalCombatPermanentBonus",
        "flagshipOncePerLifetimeShield",
        "deathDefyingShieldSeconds"
      ]
    },
    "retire_ramming_valor": {
      "classKey": "admiral",
      "targetRequirement": "naval_ironclad_or_cruiser",
      "scope": "target_naval_unit_and_city",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：目标战舰战力永久 +6，近距突击战力 +12；所在沿海基地城市忠诚度瞬时提升 30 点。",
      "parameters": [
        "targetNavalCombatBonus",
        "navalRammingAttackBonus",
        "cityLoyaltyRestored"
      ]
    },
    "retire_harbor_breach": {
      "classKey": "admiral",
      "targetRequirement": "naval_warship",
      "scope": "all_naval_units",
      "timing": "duration_cycles",
      "description": "常态提供海军光环。退役激活：所有友方现役水面舰队对要塞港口炮轰战力 +8、移动力 +1，且行动无视敌方水域惩罚，持续 durationCycles 周期（5周期/100秒）。",
      "parameters": [
        "harborBombardStrengthBonus",
        "fleetMovementBonus",
        "ignoreEnemyTerritoryWaterPenalty",
        "durationCycles"
      ]
    },
    "retire_carrier_strike_and_free_aircraft": {
      "classKey": "admiral",
      "targetRequirement": "carrier_or_naval_base",
      "scope": "carrier_or_base",
      "timing": "instant_and_permanent",
      "description": "常态提供海军光环。退役激活：驻扎航母或该港口基地的战机伤害提升 25%，并立即免费补充 1 架满编战机。",
      "parameters": [
        "carrierBomberDamageMultiplier",
        "freeFighterAircraft"
      ]
    },
    "nuclear_navy_propulsion": {
      "classKey": "admiral",
      "targetRequirement": "naval_submarine_or_destroyer",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在潜艇或驱逐舰激活。解锁《核裂变》科技尤里卡；全国所有潜艇与水下作战舰艇移动力永久 +2，水下隐匿侦测距离额外延伸 1 格。",
      "parameters": [
        "submarineSpeedBonus",
        "submarineStealthBonus",
        "eurekaTechs"
      ]
    },
    "evangelize_religion_burst": {
      "classKey": "prophet",
      "targetRequirement": "holy_site_district",
      "scope": "city_and_empire",
      "timing": "instant_and_permanent",
      "description": "在圣地激活。若未创教则立即免费创立宗教；若已创教则触发神学布道爆发，获得该预言家专属信仰储备（120~250）并获赠神圣遗物，可附带圣地文化/宜居/科学或宗教压力强化。",
      "parameters": [
        "freeReligionFounding",
        "instantFaith",
        "relicGrant",
        "holySiteCultureBonus",
        "cityAmenityBonus",
        "religionPressureRadius4",
        "empireCityCultureBonus",
        "cityLoyaltyBonus",
        "cityScienceBonus",
        "cityFaithBonus",
        "spreadForeignCitiesInstant"
      ]
    },
    "theology_philosophy_fusion": {
      "classKey": "prophet",
      "targetRequirement": "holy_site_or_campus",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在圣地或学院激活。获得 200 信仰储备；全国所有学院额外产出 +2 信仰，全国所有圣地额外产出 +2 科技（信仰与理性圆融）。",
      "parameters": [
        "instantFaith",
        "campusFaithBonus",
        "holySiteScienceBonus"
      ]
    },
    "religious_reform_burst": {
      "classKey": "prophet",
      "targetRequirement": "holy_site_district",
      "scope": "empire",
      "timing": "instant_and_permanent",
      "description": "在圣地激活。获得 250 信仰与 100 文化储备，立即解锁市政《宗教改革》鼓舞，全国每座城市忠诚度 +2。",
      "parameters": [
        "instantFaith",
        "instantCulture",
        "freeCivicInspiration"
      ]
    },
    "create_great_work": {
      "classKey": "cultural",
      "targetRequirement": "city_with_work_slot",
      "scope": "city_slot_and_bonus",
      "timing": "permanent_and_duration",
      "description": "在拥有对应空槽的城市激活（文学槽/艺术槽/音乐槽）。消耗 1 次使用次数创作传世巨作实体，存入该槽位提供周期文化与旅游产出；可携带专属 bonusEffect（激活城市永久加成或限时 4 周期国家增益）。",
      "parameters": [
        "workType",
        "works",
        "bonusEffect"
      ]
    }
  },
  "wonders": [
    {
      "key": "stonehenge",
      "name": "巨石阵",
      "englishName": "Stonehenge",
      "era": 0,
      "tech": "astrology",
      "civic": null,
      "cost": 90,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": "stone",
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 4,
        "tourism": 3
      },
      "instantGrants": {
        "faith": 120
      },
      "passiveEffects": {
        "freeReligionFoundingAvailable": true,
        "description": "建成时立即获得 120 信仰值（可立即在此城创立宗教）；每周期 +4 信仰、+3 旅游。"
      },
      "historicalBackground": "建于约公元前3000至2000年英格兰索尔兹伯里平原，精确对齐夏至日出与冬至日落的同心巨石柱群。",
      "artBrief": "苍茫绿色英伦荒原上伫立的巨大环形砂岩巨石与横楣，透射出破晓晨曦神圣光束。",
      "eraName": "远古时代"
    },
    {
      "key": "hanging_gardens",
      "name": "空中花园",
      "englishName": "Hanging Gardens of Babylon",
      "era": 0,
      "tech": "irrigation",
      "civic": null,
      "cost": 95,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains",
          "desert"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "food": 4,
        "culture": 2,
        "tourism": 3
      },
      "instantGrants": {},
      "passiveEffects": {
        "empireGrowthRateBonus": 0.15,
        "empireCityHousingBonus": 1,
        "description": "全国所有城市人口增长速率提升 15%；全国每座城市住房上限 +1；每周期 +4 食物、+2 文化、+3 旅游。"
      },
      "historicalBackground": "新巴比伦国王尼布甲尼撒二世为患思乡病的安美依迪丝王妃所建，层叠阶梯上繁花绿树掩映，配备先进阿基米德螺旋提水灌溉系统。",
      "artBrief": "美索不达米亚多层阶梯金字形神塔式台地花园，满覆悬垂藤蔓与热带花木，渠水沿大理石阶级飞流而下。",
      "eraName": "远古时代"
    },
    {
      "key": "pyramids",
      "name": "吉萨大金字塔",
      "englishName": "The Great Pyramids of Giza",
      "era": 0,
      "tech": "masonry",
      "civic": null,
      "cost": 100,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "desert",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 2,
        "tourism": 4
      },
      "instantGrants": {
        "freeUnits": [
          {
            "unitType": "builder",
            "count": 1
          }
        ]
      },
      "passiveEffects": {
        "builderChargeBonus": 1,
        "description": "新建造者获得 +1 使用次数；完成时在本城获赠 1 名免费建造者；每周期 +2 文化、+4 旅游。"
      },
      "historicalBackground": "建于约公元前2560年古埃及第四王朝，为法老胡夫的宏伟陵墓，古代世界七大奇迹中唯一现存的实体建筑。",
      "artBrief": "以胡夫金字塔为主体，辅以哈夫拉与孟卡拉金字塔及狮身人面像剪影，沙漠暖金砂岩色调与晨曦长投影。",
      "eraName": "远古时代"
    },
    {
      "key": "halicarnassus",
      "name": "摩索拉斯王陵墓",
      "englishName": "Mausoleum at Halicarnassus",
      "era": 0,
      "tech": "masonry",
      "civic": null,
      "cost": 105,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "harbor",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 3,
        "culture": 3,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatEngineerExtraCharge": 1,
        "greatAdmiralPoints": 2,
        "description": "本国招募的所有大工程师获得 +1 额外激活次数（李春等分阶工程师可在第二座城市再次释放相应阶段工程，同城河流加成不叠加）；每周期 +3 科技、+3 文化、+4 旅游、+2 大海军家点数。"
      },
      "historicalBackground": "公元前350年为波斯卡里亚总督摩索拉斯修建的高大陵寝，融汇希腊、埃及与安纳托利亚建筑艺术，古代世界七大奇迹之一。",
      "artBrief": "白色爱奥尼式石柱回廊台基，顶部矗立24级阶梯金字塔与四马战车大理石群雕，矗立于蔚蓝爱琴海滨。",
      "eraName": "远古时代"
    },
    {
      "key": "great_ziggurat",
      "name": "乌尔大塔庙",
      "englishName": "Great Ziggurat of Ur",
      "era": 0,
      "eraName": "远古时代",
      "tech": "pottery",
      "civic": null,
      "cost": 110,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "desert"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 3,
        "culture": 2,
        "tourism": 3
      },
      "instantGrants": {
        "faith": 80
      },
      "passiveEffects": {
        "greatProphetPoints": 2,
        "cityHolySiteFaithMultiplier": 0.15,
        "description": "建成时立即获得 80 信仰储备；所在城市圣地信仰产出 +15%；每周期 +3 信仰、+2 文化、+3 旅游、+2 大预言家点数。"
      },
      "optionalExtendedDesign": {
        "mechanic": "美索不达米亚月神南纳阶梯祭坛，强化早期城市防洪与信仰储备调度"
      },
      "historicalBackground": "乌尔第三王朝乌尔纳姆国王建造的美索不达米亚最宏伟的泥砖阶梯神庙，供奉月神南纳，为苏美尔城邦宗教与粮食仓储行政枢纽。",
      "artBrief": "美索不达米亚泛滥平原上矗立的三层巨大晒干泥砖阶梯塔庙，三道宏伟中央外挂阶梯通往顶层深青色琉璃砖月神主殿，底座环绕沥青灰泥防洪层。"
    },
    {
      "key": "temple_of_artemis",
      "name": "阿耳忒弥斯神庙",
      "englishName": "Temple of Artemis",
      "era": 0,
      "eraName": "远古时代",
      "tech": "archery",
      "civic": null,
      "cost": 110,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 3,
        "gold": 3,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatMerchantPoints": 1,
        "cityAmenityBonus": 2,
        "cityHousingBonus": 2,
        "description": "所在城市宜居度永久 +2，住房容量永久 +2；每周期 +3 文化、+3 金币、+4 旅游、+1 大商人点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityPastureAmenityBonus: 1, cityCampFoodBonus: 1",
        "mechanic": "狩猎与自然女神丰产祝福，城市范围内牧场与营地提供宜居度与食物"
      },
      "historicalBackground": "古代世界七大奇迹之一，位于小亚细亚以弗所，以一百二十七根巨大大理石柱支撑宏伟大殿，供奉象征自然繁育与狩猎的阿耳忒弥斯女神。",
      "artBrief": "爱琴海东岸平原上宏伟洁白的全大理石希腊式列柱圣殿，127根高耸爱奥尼亚浮雕石柱围绕中央黄金象牙神像，黄昏落日辉映大理石阶基。"
    },
    {
      "key": "knossos_palace",
      "name": "克诺索斯王宫",
      "englishName": "Palace of Knossos",
      "era": 0,
      "eraName": "远古时代",
      "tech": "sailing",
      "civic": null,
      "cost": 110,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "gold": 3,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatMerchantPoints": 1,
        "cityCultureMultiplier": 0.15,
        "cityAmenityBonus": 1,
        "description": "必须建造在沿海地块。所在城市文化产出提升 15%，宜居度 +1；每周期 +4 文化、+3 金币、+4 旅游、+1 大商人点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "waterTradeRouteGoldBonus: 2",
        "mechanic": "米诺斯海上贸易帝国（Thalassocracy），沿海水上贸易路线额外金币"
      },
      "historicalBackground": "克里特岛米诺斯文明政治与文化中枢，以复杂精巧的多层迷宫结构、鲜艳奔放的跳牛壁画与先进的水力陶管排水系统著称。",
      "artBrief": "爱琴海蔚蓝海岸丘陵旁依山叠落的多层米诺斯宫殿群，红色圆锥木柱支撑着露天庭院，外墙饰有鲜艳的跳牛节壁画与海豚彩绘浮雕。"
    },
    {
      "key": "karnak",
      "name": "卡纳克神庙群",
      "englishName": "Temple Complex of Karnak",
      "era": 0,
      "eraName": "远古时代",
      "tech": "masonry",
      "civic": null,
      "cost": 115,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "desert",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 4,
        "production": 2,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatProphetPoints": 2,
        "greatEngineerPoints": 1,
        "cityProductionMultiplier": 0.1,
        "description": "必须沿河建造。所在城市基础生产力提升 10%；每周期 +4 信仰、+2 生产力、+4 旅游、+2 大预言家点数、+1 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityTempleProductionBonus: 2",
        "mechanic": "尼罗河畔巨柱厅宗教营造动员，圣地与神庙额外生产力"
      },
      "historicalBackground": "古埃及底比斯最崇高的阿蒙神庙建筑群，历经三十余代法老持续扩建千余年，以世界最大的多柱大厅（134根巨型石柱）震撼古代世界。",
      "artBrief": "尼罗河东岸壮观的砂岩巨塔门与公羊斯芬克斯神道，多柱大厅内134根密林般的纸莎草花蕾巨型彩绘石柱擎起高耸屋顶，阳光自高侧石窗斜射而下。"
    },
    {
      "key": "oracle",
      "name": "德尔斐神谕所",
      "englishName": "The Oracle of Delphi",
      "era": 1,
      "tech": null,
      "civic": "mysticism",
      "cost": 110,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains",
          "desert",
          "tundra"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [
          {
            "type": "feature",
            "key": "mountain"
          },
          {
            "type": "district",
            "key": "holy"
          }
        ],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 6,
        "culture": 3,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "faithPatronageDiscount": 0.25,
        "cityDistrictGreatPersonBonus": 1,
        "description": "使用信仰赞助招募伟人花费减少 25%；本城所有已建专业区域每周期额外产出 +1 对应类别伟人点数；每周期 +6 信仰、+3 文化、+4 旅游。"
      },
      "historicalBackground": "坐落于希腊帕纳索斯山脉西南麓的阿波罗神圣圣域，皮提亚女祭司在此传达神谕，指引城邦命运。",
      "artBrief": "依陡峭多石山体而建的多立克式大理石神庙遗迹，缭绕着神圣地热地气与古老橄榄树。",
      "eraName": "古典时代"
    },
    {
      "key": "great_lighthouse",
      "name": "亚历山大灯塔",
      "englishName": "The Great Lighthouse of Alexandria",
      "era": 1,
      "tech": "celestial",
      "civic": null,
      "cost": 120,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "harbor",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 4,
        "science": 2,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "navalMovementBonus": 1,
        "navalSightRadius": 4,
        "greatAdmiralPoints": 2,
        "description": "所有己方海军与水上登船单位移动力 +1；本城沿海水域视野延伸至 4 格；每周期 +4 金币、+2 科技、+4 旅游、+2 大海军家点数。"
      },
      "historicalBackground": "公元前280年建于法罗斯岛的巨型灯塔，高逾百米，巨大的铜镜将火焰光芒反射至数十海里之外。",
      "artBrief": "三层渐次收缩的白色石灰岩巨塔，顶部高耸波塞冬青铜雕像，黑夜中烈焰熊熊照亮帆影重重的港湾。",
      "eraName": "古典时代"
    },
    {
      "key": "colossus",
      "name": "罗德岛巨像",
      "englishName": "Colossus of Rhodes",
      "era": 1,
      "tech": "shipbuilding",
      "civic": null,
      "cost": 120,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "harbor",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 6,
        "tourism": 4
      },
      "instantGrants": {
        "gold": 200
      },
      "passiveEffects": {
        "tradeCapacityBonus": 1,
        "greatMerchantPoints": 2,
        "description": "全国永久增加 +1 贸易路线容量；建成时国库立即获赠 200 金币；每周期 +6 金币、+4 旅游、+2 大商人点数。"
      },
      "historicalBackground": "罗德岛人于公元前280年为庆祝击退安提柯围攻，融化缴获青铜兵器铸造的百尺太阳神赫利俄斯巨型雕像，拱卫港口通商。",
      "artBrief": "傲然耸立于防波堤大理石底座上的青铜太阳神赫利俄斯巨像，手擎熊熊火炬，脚下满载陶罐香料的三列桨帆船穿梭往来。",
      "eraName": "古典时代"
    },
    {
      "key": "greatlibrary",
      "name": "亚历山大大图书馆",
      "englishName": "The Great Library of Alexandria",
      "era": 1,
      "tech": "writing",
      "civic": null,
      "cost": 125,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "campus",
        "requiresDistrictBuilding": "library",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 6,
        "culture": 2,
        "tourism": 4
      },
      "instantGrants": {
        "randomEurekas": 2
      },
      "passiveEffects": {
        "greatScientistPoints": 2,
        "description": "建成时立即随机获得 2 个远古或古典时代科技尤里卡；每周期 +6 科技、+2 文化、+4 旅游、+2 大科学家点数。"
      },
      "historicalBackground": "托勒密一世建于公元前3世纪埃及亚历山大港，汇聚全地中海数十万卷莎草纸古籍的世界学术灯塔。",
      "artBrief": "宏伟的希腊古典列柱门廊回廊，藏书卷轴壁龛，面朝地中海微风的学者庭院与石雕。",
      "eraName": "古典时代"
    },
    {
      "key": "colosseum",
      "name": "罗马大斗兽场",
      "englishName": "The Colosseum",
      "era": 1,
      "tech": null,
      "civic": "drama",
      "cost": 130,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "entertainment",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 5,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "nationalAmenities": 2,
        "regionalLoyaltyRadius6": 2,
        "description": "全国每座城市 +2 宜居度；奇观 6 格范围内所有己方城市忠诚度每周期 +2；每周期 +5 文化、+4 旅游。"
      },
      "historicalBackground": "公元72至80年罗马弗拉维王朝修建的椭圆形四层石质露天剧场，容纳五万观众，帝国公共工程与公民娱乐之顶峰。",
      "artBrief": "四层石灰华拱券外观，带有遮阳帆布桅杆座与古罗马大理石雕塑的雄伟竞技场。",
      "eraName": "古典时代"
    },
    {
      "key": "parthenon",
      "name": "帕特农神庙",
      "englishName": "The Parthenon",
      "era": 1,
      "tech": null,
      "civic": "drama",
      "cost": 130,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": true,
        "requiresAdjacentDistrict": "theater",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatWorkArtSlots": 1,
        "greatArtistPoints": 2,
        "description": "提供 1 个艺术巨作槽位；所在城市剧院文化产出 +20%；每周期 +6 文化、+4 旅游、+2 大艺术家点数。",
        "cityTheaterCultureMultiplier": 0.2
      },
      "historicalBackground": "伯里克利时代于雅典卫城石灰石绝顶建造的雅典娜守护神庙，菲迪亚斯主持雕刻，多立克柱式黄金比例的典范。",
      "artBrief": "卫城悬崖顶端巍峨耸立的彭特利库斯白大理石神庙，三角楣饰展现雅典娜与波塞冬之争，晚霞映照柱廊呈现典雅象牙金黄色。",
      "eraName": "古典时代"
    },
    {
      "key": "petra",
      "name": "佩特拉古城",
      "englishName": "Petra",
      "era": 1,
      "tech": "mathematics",
      "civic": null,
      "cost": 135,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "desert"
        ],
        "hill": null,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 6,
        "culture": 2,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "cityDesertTileYieldBonus": {
          "food": 2,
          "production": 2,
          "gold": 2
        },
        "description": "本城所有非泛滥平原的沙漠地块每格产出 +2 食物、+2 生产力、+2 金币；每周期 +6 金币、+2 文化、+4 旅游。"
      },
      "historicalBackground": "纳巴泰王国在约旦红海与死海之间玫瑰色砂岩峡谷绝壁中雕凿出的岩石商道都城，精巧的水渠网络掌控古代香料之路。",
      "artBrief": "狭窄西克峡谷深处豁然开朗的卡兹尼神殿玫瑰色罗马式石雕立面，朝阳在赤褐色砂岩悬崖上映照出万道霞光。",
      "eraName": "古典时代"
    },
    {
      "key": "terracotta_army",
      "name": "秦始皇兵马俑",
      "englishName": "Terracotta Army",
      "era": 1,
      "tech": null,
      "civic": "training",
      "cost": 140,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "barracks",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "tourism": 4
      },
      "instantGrants": {
        "allCurrentLandUnitsFreePromotion": 1
      },
      "passiveEffects": {
        "greatGeneralPoints": 2,
        "description": "建成时全国所有现存陆地军事单位立即免费获得 1 次战斗晋升；每周期 +4 文化、+4 旅游、+2 大统帅点数。"
      },
      "historicalBackground": "秦始皇陵东侧陪葬坑中数千尊形态各异、栩栩如生的真人等大战车、骑兵与步兵陶俑军阵，大秦帝国军事工业化的雄浑缩影。",
      "artBrief": "整齐列阵于地下夯土坑道内的披甲武士俑与驷马青铜战车，长戟铜剑冷光逼人，土木棚木遗迹庄严深邃。",
      "eraName": "古典时代"
    },
    {
      "key": "mahabodhi_temple",
      "name": "大菩提寺",
      "englishName": "Mahabodhi Temple",
      "era": 1,
      "eraName": "古典时代",
      "tech": null,
      "civic": "theology",
      "cost": 140,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "holy",
        "requiresDistrictBuilding": "temple",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 5,
        "culture": 3,
        "tourism": 5
      },
      "instantGrants": {
        "faith": 120,
        "diplomaticPoints": 2
      },
      "passiveEffects": {
        "greatProphetPoints": 2,
        "greatWorkRelicSlots": 1,
        "nationalFaithMultiplier": 0.1,
        "description": "需相邻圣地建造。建成时立即获得 120 信仰储备；提供 1 个圣物槽位；全国信仰总产出提升 10%；每周期 +5 信仰、+3 文化、+5 旅游、+2 大预言家点数。 首次建成获得 2 点外交胜利积分（不随占领重复获得）。"
      },
      "optionalExtendedDesign": {
        "originalField": "religiousPressureDistanceMultiplier: 0.25",
        "mechanic": "佛陀金刚座道场向四方辐射宗教传播距离拓展"
      },
      "historicalBackground": "位于印度比哈尔邦菩提迦耶，纪念释迦牟尼佛在菩提树下夜睹明星彻底觉悟成佛之地，孔雀王朝阿育王始建，为世界佛教最神圣祖庭。",
      "artBrief": "红砂岩金字塔尖塔形大菩提寺主殿耸立于绿荫之中，主塔四周环绕四座精致小角塔，寺旁神圣菩提树下金刚座散发静谧柔和的金黄佛光。"
    },
    {
      "key": "teotihuacan_sun_pyramid",
      "name": "特奥蒂瓦坎太阳金字塔",
      "englishName": "Pyramid of the Sun (Teotihuacan)",
      "era": 1,
      "eraName": "古典时代",
      "tech": "engineering",
      "civic": null,
      "cost": 140,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 4,
        "production": 3,
        "tourism": 5
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatEngineerPoints": 2,
        "cityProductionMultiplier": 0.15,
        "cityHolySiteFaithMultiplier": 0.2,
        "description": "所在城市基础生产力提升 15%，圣地信仰产出提升 20%；每周期 +4 信仰、+3 生产力、+5 旅游、+2 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityFaithProductionConversionMultiplier: 0.1",
        "mechanic": "中美洲众神之城巨石祭祀，每周期信仰产出按比例转化为生产力点数"
      },
      "historicalBackground": "美索美洲前哥伦布时期最大建筑之一，坐落于墨西哥谷亡者大道东侧，梯形分层巨石结构展现精湛天文测算与古印第安宇宙哲学观。",
      "artBrief": "五层庞大梯级火山碎石金字塔雄踞亡者之路旁，陡峭的正面石阶直通平坦神庙顶台，夕阳下红黑火山石阶基拉出深邃庄严的长影。"
    },
    {
      "key": "nalanda",
      "name": "那烂陀大寺",
      "englishName": "Nalanda Mahavihara",
      "era": 1,
      "eraName": "古典时代",
      "tech": null,
      "civic": "recordedhistory",
      "cost": 140,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "campus",
        "requiresDistrictBuilding": "library",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 6,
        "faith": 3,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatScientistPoints": 2,
        "greatWorkWritingSlots": 1,
        "cityScienceMultiplier": 0.2,
        "description": "需相邻学院建造。提供 1 个文学巨作槽位；所在城市科技总产出提升 20%；每周期 +6 科技、+3 信仰、+4 旅游、+2 大科学家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityCampusScienceMultiplier: 0.2",
        "mechanic": "古代世界第一座国际性住宿佛教高等学府，万卷藏经阁研讨辩经"
      },
      "historicalBackground": "古印度笈多王朝创建的古代世界最高学府与佛学研修中心，藏书逾百万卷，全盛时期来自欧亚各国的上万名学者在此辩论哲学、天文、算术与医理。",
      "artBrief": "由红砖精工砌筑的庞大修院与经堂建筑群，精美雕花红砖佛塔矗立于回廊中庭，舍利弗塔阶梯巍峨，回廊下各国僧侣学者肃穆执卷研讨。"
    },
    {
      "key": "pantheon_rome",
      "name": "罗马万神殿",
      "englishName": "Pantheon of Rome",
      "era": 1,
      "eraName": "古典时代",
      "tech": "engineering",
      "civic": null,
      "cost": 140,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "culture": 4,
        "faith": 4,
        "tourism": 5
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatEngineerPoints": 1,
        "greatArtistPoints": 1,
        "greatWorkArtSlots": 1,
        "cityAmenityBonus": 2,
        "cityCultureMultiplier": 0.1,
        "description": "必须紧邻城市中心建造。提供 1 个艺术巨作槽位；所在城市宜居度永久 +2，文化产出提升 10%；每周期 +4 文化、+4 信仰、+5 旅游、+1 大工程师点数、+1 大艺术家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityCenterAmenityBonus: 1",
        "mechanic": "罗马无筋火山灰混凝土圆顶工程绝唱，神圣天光穹顶宜居度"
      },
      "historicalBackground": "古罗马建筑技术最杰出代表，拥有古代世界最大的无筋火山灰混凝土穹顶，顶部直径九米圆形天窗投射神圣日光，历经两千年风雨完好无损。",
      "artBrief": "古典花岗岩科林斯柱廊山墙门厅连接宏伟的砖砌圆厅，巨大的无筋混凝土穹顶中央圆形天窗洒落一道明亮光柱，照射在大理石棋盘格铺地上。"
    },
    {
      "key": "weiyang_palace",
      "name": "未央宫",
      "englishName": "Weiyang Palace",
      "era": 1,
      "eraName": "古典时代",
      "tech": "construction",
      "civic": null,
      "cost": 145,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "culture": 4,
        "gold": 4,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatGeneralPoints": 2,
        "cityProductionMultiplier": 0.15,
        "regionalLoyaltyRadius6": 4,
        "description": "必须紧邻城市中心建造。所在城市基础生产力提升 15%，向周围 6 格半径内己方城市辐射提供 +4 稳固忠诚度；每周期 +4 文化、+4 金币、+4 旅游、+2 大统帅点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "capitalProductionBonusMultiplier: 0.15, empireCityLoyaltyBonus: 1",
        "mechanic": "大汉帝国政令枢纽，全国城市忠诚度强化"
      },
      "historicalBackground": "西汉开国萧何主持营建的大朝正宫，占地近五平方公里，为中国历史上规模最大的古代宫殿建筑群，汉武帝在此策马发令北击匈奴并遣张骞凿空西域。",
      "artBrief": "巨型高台夯土基座上矗立前殿高阁，重檐庑殿顶朱红列柱，飞檐凌空连绵数里，前殿前百官朝觐汉白玉宽阔步道威严庄重。"
    },
    {
      "key": "hagia_sophia",
      "name": "圣索菲亚大教堂",
      "englishName": "Hagia Sophia",
      "era": 2,
      "tech": null,
      "civic": "theology",
      "cost": 160,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "holy",
        "requiresDistrictBuilding": "temple",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 8,
        "culture": 4,
        "tourism": 4
      },
      "instantGrants": {
        "faith": 120
      },
      "passiveEffects": {
        "nationalFaithMultiplier": 0.1,
        "healerHealingBonus": 0.25,
        "cityAmenityBonus": 1,
        "description": "建成时立即获得 120 信仰储备；全国信仰总产出 +10%；所有战地医疗支援单位治疗量提升 25%；本城宜居度 +1；每周期 +8 信仰、+4 文化、+4 旅游。"
      },
      "historicalBackground": "拜占庭帝国皇帝查士丁尼一世于公元537年敕建于君士坦丁堡，人类建筑史上跨时代的宏伟悬臂穹顶圣殿。",
      "artBrief": "拜占庭红砖与大理石主殿，中央巨大金色穹顶与层叠半穹顶，金色镶嵌画在日光透过穹顶窗洞时闪耀。",
      "eraName": "中古时代"
    },
    {
      "key": "mont_saint_michel",
      "name": "圣米歇尔山",
      "englishName": "Mont Saint-Michel",
      "era": 2,
      "tech": null,
      "civic": "divine",
      "cost": 165,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 8,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatWorkRelicSlots": 2,
        "religiousUnitsRelicOnDeath": true,
        "description": "提供 2 个圣物巨作槽位；本城圣地与寺庙信仰产出 +20%；每周期 +8 信仰、+4 旅游。",
        "cityHolySiteFaithMultiplier": 0.2
      },
      "historicalBackground": "法国诺曼底海岸潮汐岛上的哥特式本笃会修道院，潮涨成岛，潮落成陆，中世纪天主教朝圣奇观与坚不可摧的海上要塞。",
      "artBrief": "狂暴大西洋潮水环绕下的花岗岩孤岛，中世纪修道院高耸尖塔直刺苍穹，金色大天使圣米歇尔铜像屹立塔尖指引迷途。",
      "eraName": "中古时代"
    },
    {
      "key": "dayan_pagoda",
      "name": "大雁塔",
      "englishName": "Giant Wild Goose Pagoda",
      "era": 2,
      "eraName": "中古时代",
      "tech": null,
      "civic": "theology",
      "cost": 165,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "holy",
        "requiresDistrictBuilding": "temple",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "faith": 4,
        "tourism": 5
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatProphetPoints": 1,
        "greatWriterPoints": 2,
        "greatWorkWritingSlots": 2,
        "cityCultureMultiplier": 0.15,
        "cityHolySiteFaithMultiplier": 0.15,
        "description": "需相邻圣地建造。提供 2 个文学巨作槽位；所在城市文化产出提升 15%，圣地信仰产出提升 15%；每周期 +4 文化、+4 信仰、+5 旅游、+1 大预言家点数、+2 大作家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityTheologicalDefenseStrength: 5",
        "mechanic": "玄奘译经藏经之所，城市神学辩经防御战力强化"
      },
      "historicalBackground": "唐永徽三年玄奘法师为保存由天竺经丝绸之路带回的梵文经卷佛像而主持修建，七层方形密檐砖塔，为丝路东端佛教文化交流不朽丰碑。",
      "artBrief": "大慈恩寺内青砖仿木结构的七层方形阁楼式砖塔挺拔巍峨，飞檐挑出悬挂风铎，塔下松柏苍翠，夕阳余晖为千年古砖镀上一层肃穆古铜金光。"
    },
    {
      "key": "chichen_itza",
      "name": "奇琴伊察",
      "englishName": "Chichen Itza",
      "era": 2,
      "tech": null,
      "civic": "guilds",
      "cost": 170,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "cityRainforestTileYieldBonus": {
          "culture": 2,
          "production": 1
        },
        "description": "本城所有未砍伐的雨林地块每格产出 +2 文化、+1 生产力；每周期 +6 文化、+4 旅游。"
      },
      "historicalBackground": "尤卡坦半岛玛雅-托尔特克文明巅峰时期的核心城邦，卡斯蒂略金字塔于春分秋分显现羽蛇神光影蠕动降临神迹。",
      "artBrief": "四面各91级石阶合为365阶的卡斯蒂略九层方锥形金字塔，羽蛇神石雕昂首于基座，热带丛林与古老天文观象台掩映四周。",
      "eraName": "中古时代"
    },
    {
      "key": "borobudur",
      "name": "婆罗浮屠",
      "englishName": "Borobudur",
      "era": 2,
      "eraName": "中古时代",
      "tech": "buttress",
      "civic": null,
      "cost": 170,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 6,
        "culture": 4,
        "tourism": 6
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatProphetPoints": 2,
        "greatWorkRelicSlots": 2,
        "relicTourismMultiplier": 1,
        "nationalFaithMultiplier": 0.1,
        "description": "必须建造在丘陵地块。提供 2 个圣物槽位；全国圣物旅游业绩产出翻倍（+100%），全国信仰总产出提升 10%；每周期 +6 信仰、+4 文化、+6 旅游、+2 大预言家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "missionaryApostleFaithCostDiscount: 0.2",
        "mechanic": "爪哇巨型立体曼荼罗，全国购买传教士与使徒信仰消耗折扣"
      },
      "historicalBackground": "爪哇岛夏连特拉王朝建造的世界最大单体佛教遗迹，依火山山丘层叠筑就九层坛台，展现三界曼荼罗宇宙观。",
      "artBrief": "黎明晨雾中由火山安山岩叠砌的巨大立体曼荼罗，72座钟形多孔佛塔隐现于晨光之中，远眺默拉皮火山喷发烟云。"
    },
    {
      "key": "great_zimbabwe",
      "name": "大津巴布韦",
      "englishName": "Great Zimbabwe",
      "era": 2,
      "eraName": "中古时代",
      "tech": null,
      "civic": "guilds",
      "cost": 170,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": true,
        "requiresAdjacentDistrict": "commercial",
        "requiresDistrictBuilding": "market",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 8,
        "culture": 3,
        "tourism": 5
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatMerchantPoints": 2,
        "cityProductionMultiplier": 0.15,
        "cityAmenityBonus": 2,
        "cityHousingBonus": 2,
        "description": "需相邻商业中心建造在丘陵。所在城市生产力提升 15%，宜居度 +2，住房容量 +2；每周期 +8 金币、+3 文化、+5 旅游、+2 大商人点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityResourceTilesGoldBonus: 2, tradeRouteGoldBonus: 3",
        "mechanic": "中南部非洲黄金与牛群贸易帝国，城市资源地块与商路金币产出强化"
      },
      "historicalBackground": "中世纪南部非洲津巴布韦王国石造都城遗址，拥有无需灰浆咬合的干砌巨石城墙与锥形石塔，为印度洋黄金、象牙贸易中心。",
      "artBrief": "非洲热带高原上由数万块规则花岗岩无灰浆干砌而成的椭圆形大围墙，内部耸立神秘的实心锥形石塔，周围点缀金合欢树与远古牛群。"
    },
    {
      "key": "notre_dame",
      "name": "巴黎圣母院",
      "englishName": "Notre-Dame de Paris",
      "era": 2,
      "eraName": "中古时代",
      "tech": "buttress",
      "civic": null,
      "cost": 170,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 5,
        "culture": 5,
        "tourism": 6
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatArtistPoints": 2,
        "greatWorkArtSlots": 1,
        "empireCityAmenityBonus": 1,
        "cityCultureMultiplier": 0.15,
        "description": "必须沿河建造。提供 1 个艺术巨作槽位；全国每座城市宜居度永久 +1，所在城市文化产出提升 15%；每周期 +5 信仰、+5 文化、+6 旅游、+2 大艺术家点数。"
      },
      "optionalExtendedDesign": {
        "mechanic": "塞纳河西岱岛哥特大教堂，飞扶壁高耸与玫瑰花窗光辉照拂全国"
      },
      "historicalBackground": "西欧中世纪早期哥特式建筑巅峰杰作，耸立于塞纳河西岱岛上，其飞扶壁结构、双塔立面与巨型玫瑰花窗成为欧洲文明永恒文化地标。",
      "artBrief": "塞纳河西岱岛上哥特式双塔钟楼高耸，精巧的外部弧形飞扶壁环绕修长唱诗堂，巨大斑斓的玫瑰花窗在斜阳映照下向河面投射万千霞光。"
    },
    {
      "key": "angkor_wat",
      "name": "吴哥窟",
      "englishName": "Angkor Wat",
      "era": 2,
      "tech": null,
      "civic": "civilservice",
      "cost": 175,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "aqueduct",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 6,
        "food": 4,
        "tourism": 4
      },
      "instantGrants": {
        "empireAllCitiesPopulationBonus": 1
      },
      "passiveEffects": {
        "empireAllCitiesHousingBonus": 1,
        "description": "建成时全国所有现存城市人口立即 +1；全国所有城市住房上限永久 +1；每周期 +6 信仰、+4 食物、+4 旅游。"
      },
      "historicalBackground": "高棉帝国苏利耶跋摩二世于12世纪修建的印度教毗湿奴神殿，护城河与精巧水利环抱的五座须弥山式宝塔巨构。",
      "artBrief": "长方形宽阔护城河后耸立的砂岩宝塔群，回廊浮雕叙述乳海搅拌神话，莲花池中完美倒映出五座高耸玉米穗状石塔。",
      "eraName": "中古时代"
    },
    {
      "key": "himeji_castle",
      "name": "姬路城",
      "englishName": "Himeji Castle",
      "era": 2,
      "eraName": "中古时代",
      "tech": "castles",
      "civic": null,
      "cost": 175,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "production": 4,
        "tourism": 5
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatGeneralPoints": 2,
        "cityProductionMultiplier": 0.15,
        "regionalLoyaltyRadius6": 4,
        "description": "必须建造在丘陵地块。所在城市军工生产力提升 15%，向周围 6 格半径内所有己方城市辐射提供 +4 稳固忠诚度；每周期 +4 文化、+4 生产力、+5 旅游、+2 大统帅点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityDefenseStrengthBonus: 10, domesticTerritoryCombatBonus: 3",
        "mechanic": "日本白鹭名城螺旋迷宫防御，本土作战战斗力与城防提升"
      },
      "historicalBackground": "日本战国与江户时代筑城顶峰之作，被誉为“白鹭城”，以纯白抹灰连立式天守群、精妙的螺旋形防御迷宫与射孔要塞体系闻名。",
      "artBrief": "高耸雄伟的姬山石垣上矗立着白灰浆涂抹的五层连立式大天守阁，如白鹭展翅凌空，飞檐翼角层叠交错，樱花花瓣在春风中飘落护城河面。"
    },
    {
      "key": "alhambra",
      "name": "阿尔罕布拉宫",
      "englishName": "Alhambra",
      "era": 2,
      "tech": "castles",
      "civic": null,
      "cost": 180,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": true,
        "requiresAdjacentDistrict": "barracks",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "extraMilitaryPolicySlot": 1,
        "nationalAmenities": 2,
        "cityGarrisonCombatBonus": 5,
        "description": "全国政治体制额外获得 +1 军事政策槽位；全国每座城市宜居度 +2；本城驻军防守战力 +5；每周期 +4 文化、+4 旅游。"
      },
      "historicalBackground": "格拉纳达纳斯尔王朝于13至14世纪在内华达山麓险峻丘陵营建的摩尔人宫殿城堡复合体，伊斯兰世俗建筑艺术绝唱。",
      "artBrief": "红色城砖塔楼要塞环抱下的狮子庭院与桃金娘中庭，精美阿拉伯灰泥蜂窝穹顶（莫卡拉比）与细长白色大理石立柱倒映于静水中。",
      "eraName": "中古时代"
    },
    {
      "key": "oxford",
      "name": "牛津大学",
      "englishName": "University of Oxford",
      "era": 2,
      "tech": "education",
      "civic": null,
      "cost": 210,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "campus",
        "requiresDistrictBuilding": "university",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 12,
        "tourism": 4
      },
      "instantGrants": {
        "freeTechs": 2
      },
      "passiveEffects": {
        "cityScienceMultiplier": 0.2,
        "greatScientistPoints": 3,
        "description": "建成时立即免费获得 2 项当前时代可研发的随机科技；本城科技产出 +20%；每周期 +12 科技、+4 旅游、+3 大科学家点数。"
      },
      "historicalBackground": "始创于1096年英格兰牛津，英语世界最古老的大学，罗杰·培根、洛克及数十位诺奖学者的摇篮。",
      "artBrief": "古典哥特式博德利图书馆与雷德克里夫圆楼（Radcliffe Camera），庭院草坪整饬，石墙藤蔓掩映。",
      "eraName": "中古时代"
    },
    {
      "key": "torre_de_belem",
      "name": "贝伦塔",
      "englishName": "Belém Tower",
      "era": 3,
      "tech": "cartography",
      "civic": null,
      "cost": 175,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "harbor",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 6,
        "culture": 2,
        "tourism": 4
      },
      "instantGrants": {
        "freeUnits": [
          {
            "unitType": "frigate",
            "count": 1
          }
        ]
      },
      "passiveEffects": {
        "foreignRouteGoldBonus": 4,
        "greatAdmiralPoints": 2,
        "description": "源自本城的所有通往外国的国际贸易路线每周期额外 +4 金币；建成获赠一艘护卫舰；每周期 +6 金币、+2 文化、+4 旅游、+2 大海军家点数。"
      },
      "historicalBackground": "葡萄牙国王曼努埃尔一世为纪念达·伽马远航印度而在里斯本特茹河口修建的曼努埃尔式四层水上防御要塞与启航灯塔。",
      "artBrief": "屹立于河海交汇波涛中的精美石造堡垒，带有摩尔式尖顶岗亭、缆绳浮雕装饰与面向大海的厚重火炮平台。",
      "eraName": "文艺复兴"
    },
    {
      "key": "observatory",
      "name": "乌鲁伯格天文台",
      "englishName": "Ulugh Beg Observatory",
      "era": 3,
      "tech": "astronomy",
      "civic": null,
      "cost": 180,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains",
          "desert",
          "tundra"
        ],
        "hill": true,
        "requiresAdjacentDistrict": "campus",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": "mountain",
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 10,
        "tourism": 4
      },
      "instantGrants": {
        "renaissanceScienceEurekas": true
      },
      "passiveEffects": {
        "adjacentMountainScienceBonus": 2,
        "greatScientistPoints": 3,
        "description": "建成时立即获得所有剩余文艺复兴与工业时代自然科学科技的尤里卡；本城相邻的山脉每格产出 +2 科技；每周期 +10 科技、+4 旅游、+3 大科学家点数。"
      },
      "historicalBackground": "帖木儿帝国苏丹兼天文学家乌鲁伯格于1420年在撒马尔罕建造的三层圆柱形天文台，其巨大的双弧子午仪测算出了极为精确的恒星坐标星表。",
      "artBrief": "中亚伊斯兰青金石琉璃马赛克贴面的宏伟圆形观测台，露天的巨型大理石双轨道子午仪深凿于山岩之中指向浩瀚星空。",
      "eraName": "文艺复兴"
    },
    {
      "key": "taj_mahal",
      "name": "泰姬陵",
      "englishName": "Taj Mahal",
      "era": 3,
      "tech": null,
      "civic": "humanism",
      "cost": 180,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "gold": 6,
        "tourism": 6
      },
      "instantGrants": {},
      "passiveEffects": {
        "eraScoreBonusOnMoment": 2,
        "onCompleteWonderOrDistrictReward": {
          "gold": 15,
          "culture": 15
        },
        "description": "触发历史性事件时时代分累计额外 +2；本国每当完成一座奇观或专业区域，立即向国库注入 15 金币与 15 文化储备；每周期 +6 文化、+6 金币、+6 旅游。"
      },
      "historicalBackground": "莫卧儿帝国皇帝沙贾汗于1632年至1653年在阿格拉亚穆纳河畔为爱妻蒙泰姬·玛哈尔营建的纯白大理石陵寝，伊斯兰艺术的瑰宝。",
      "artBrief": "四座高耸宣礼塔环绕下的洁白纯净大理石八角陵墓，倒映在正前方长方形波光粼粼的倒影水池与丝柏树丛中。",
      "eraName": "文艺复兴"
    },
    {
      "key": "potala_palace",
      "name": "布达拉宫",
      "englishName": "Potala Palace",
      "era": 3,
      "tech": null,
      "civic": "theology",
      "cost": 185,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains",
          "tundra"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": "mountain",
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "faith": 6,
        "tourism": 4
      },
      "instantGrants": {
        "envoys": 1,
        "diplomaticPoints": 1
      },
      "passiveEffects": {
        "extraDiplomaticPolicySlot": 1,
        "religiousDefenseBonus": 5,
        "description": "全国政治体制额外获得 +1 外交政策槽位；本城防御信仰侵略与宗教渗透能力提升 50%（防守神学战力 +5）；每周期 +4 文化、+6 信仰、+4 旅游。 落成获赠 1 名使节；国际大会每项议题额外 1 票。 首次建成获得 1 点外交胜利积分（不随占领重复获得）。",
        "cityTheologicalDefenseMultiplier": 0.5,
        "cityTheologicalDefenseStrength": 5,
        "congressVotes": 1
      },
      "historicalBackground": "西藏拉萨红山之巅的宏伟宫堡建筑群，藏传佛教圣地与历代达赖喇嘛冬宫，依山垒砌的红宫白宫巍峨壮观。",
      "artBrief": "红白相间巨石碉堡式宫殿群高耸于拉萨玛布日山峭壁之上，金顶在高原澄澈蓝天下金光万道，五彩经幡迎风猎猎飞扬。",
      "eraName": "文艺复兴"
    },
    {
      "key": "venetian_arsenal",
      "name": "威尼斯军械库",
      "englishName": "Venetian Arsenal",
      "era": 3,
      "tech": "massproduction",
      "civic": null,
      "cost": 190,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "industrial",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "production": 6,
        "gold": 4,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "duplicateNavalUnits": true,
        "greatEngineerPoints": 2,
        "greatAdmiralPoints": 2,
        "description": "本国任何港口城市每训练完成一艘海军舰艇，立即免费额外获赠一艘完全相同的复制舰艇（复制舰带 isDuplicated 标记绝不递归）；每周期 +6 生产力、+4 金币、+4 旅游、+2 大工程师点数、+2 大海军家点数。"
      },
      "historicalBackground": "威尼斯共和国于12至16世纪建立的巨型国有造船厂与军械综合体，开创标准化零件装配线流水作业，一天即可下水一艘战舰。",
      "artBrief": "红砖水道船坞、水门塔楼与带威尼斯飞狮标志的石门，水闸内排列着正在吊装桅杆与火炮的加莱战船。",
      "eraName": "文艺复兴"
    },
    {
      "key": "forbidden",
      "name": "紫禁城",
      "englishName": "The Forbidden City",
      "era": 3,
      "tech": null,
      "civic": "exploration",
      "cost": 190,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "culture": 8,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "extraWildcardPolicySlot": 1,
        "regionalLoyaltyPressureMultiplier": 0.25,
        "greatMerchantPoints": 2,
        "description": "全国政治体制额外获得 +1 通用政策槽位；本城对周围 6 格范围内的城市忠诚度施压提升 25%；每周期 +8 文化、+4 旅游、+2 大商人点数。 间谍容量 +1；本城敌谍成功率乘以 80%。",
        "spyCapacity": 1,
        "counterspyMultiplier": 0.8
      },
      "historicalBackground": "明成祖朱棣于公元1420年建成的明清两代皇宫，世界上现存规模最大、保存最完整的木结构古建筑群，东方宫殿营造的至高殿堂。",
      "artBrief": "金黄琉璃瓦重檐庑殿顶的太和殿，汉白玉三层须弥座雕栏台基，朱红深院大门与金水河石桥。",
      "eraName": "文艺复兴"
    },
    {
      "key": "st_peters",
      "name": "圣伯多禄大殿",
      "englishName": "St. Peter's Basilica",
      "era": 3,
      "tech": null,
      "civic": "reform",
      "cost": 200,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "holy",
        "requiresDistrictBuilding": "temple",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 10,
        "culture": 4,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatWorkArtSlots": 1,
        "greatProphetPoints": 2,
        "greatArtistPoints": 2,
        "description": "提供 1 个艺术巨作槽位与 1 个圣物巨作槽位；全国所有圣地与寺庙信仰产出 +20%；每周期 +10 信仰、+4 文化、+4 旅游、+2 大预言家点数、+2 大艺术家点数。",
        "greatWorkRelicSlots": 1
      },
      "historicalBackground": "梵蒂冈文艺复兴宗座大殿，布拉曼特、拉斐尔、米开朗基罗与贝尔尼尼相继督建，天主教最神圣的礼仪中心与世界最大教堂。",
      "artBrief": "米开朗基罗设计的壮丽双层大穹顶高耸入云，贝尔尼尼设计的椭圆形圣伯多禄广场四排多立克巨柱回廊张开怀抱拥抱朝圣信徒。",
      "eraName": "文艺复兴"
    },
    {
      "key": "temple_of_heaven",
      "name": "北京天坛",
      "englishName": "Temple of Heaven (Beijing)",
      "era": 3,
      "eraName": "文艺复兴",
      "tech": null,
      "civic": "divine",
      "cost": 210,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 6,
        "culture": 5,
        "tourism": 7
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatProphetPoints": 2,
        "empireCityAmenityBonus": 1,
        "empireCityHousingBonus": 1,
        "nationalFaithMultiplier": 0.1,
        "description": "祈天祈谷皇室坛庙。全国每座城市宜居度永久 +1、住房容量 +1，全国信仰总产出提升 10%；每周期 +6 信仰、+5 文化、+7 旅游、+2 大预言家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityFarmFoodBonus: 1, cityPastureProductionBonus: 1",
        "mechanic": "天圆地方祈谷皇坛，城市范围内所有农田粮食与牧场生产力增产"
      },
      "historicalBackground": "明清两代皇帝祭天、祈谷的皇家祭坛，以严谨的天圆地方轴线布局、三层汉白玉圜丘与深蓝琉璃瓦祈年殿代表中国传统礼制建筑最高境界。",
      "artBrief": "三层高耸的汉白玉雕花圆形基坛上，三层重檐宝顶、深蓝色琉璃瓦覆盖的祈年殿巍然耸立，殿顶鎏金宝顶在蔚蓝晴空下闪耀神圣光辉。"
    },
    {
      "key": "sankore_madrasa",
      "name": "桑科尔伊斯兰学校",
      "englishName": "University of Sankore",
      "era": 3,
      "eraName": "文艺复兴",
      "tech": null,
      "civic": "humanism",
      "cost": 210,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "desert",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "campus",
        "requiresDistrictBuilding": "university",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 6,
        "faith": 4,
        "tourism": 5
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatScientistPoints": 2,
        "greatWorkWritingSlots": 1,
        "cityScienceMultiplier": 0.2,
        "cityCultureMultiplier": 0.1,
        "description": "需相邻学院建造。提供 1 个文学巨作槽位；所在城市科技产出提升 20%，文化产出提升 10%；每周期 +6 科技、+4 信仰、+5 旅游、+2 大科学家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "desertTradeScienceBonus: 2, desertTradeGoldBonus: 2",
        "mechanic": "跨撒哈拉沙漠黄金与学术手稿贸易商路额外科技与金币"
      },
      "historicalBackground": "西非马里帝国廷巴克图黄金时代的学术中枢，以独特的苏丹-萨赫勒式泥构建筑著称，收藏数十万卷涵盖天文学、法学与医学的历史古籍手稿。",
      "artBrief": "撒哈拉沙漠边缘由夯土与泥浆抹面建成的萨赫勒式金字塔形尖塔清真寺，外露的木制脚手架横木纵横交错，清真寺庭院内学者们围聚研读羊皮纸手卷。"
    },
    {
      "key": "saint_basil",
      "name": "圣瓦西里主教座堂",
      "englishName": "Saint Basil's Cathedral",
      "era": 3,
      "eraName": "文艺复兴",
      "tech": null,
      "civic": "reform",
      "cost": 210,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "culture": 6,
        "faith": 6,
        "tourism": 7
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatArtistPoints": 2,
        "greatWorkRelicSlots": 2,
        "relicTourismMultiplier": 1,
        "cityCultureMultiplier": 0.2,
        "cityHolySiteFaithMultiplier": 0.2,
        "description": "必须紧邻城市中心建造。提供 2 个圣物巨作槽位；全国圣物旅游业绩翻倍（+100%），所在城市文化与圣地信仰产出各提升 20%；每周期 +6 文化、+6 信仰、+7 旅游、+2 大艺术家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "tundraTileCultureBonus: 1, tundraTileFaithBonus: 1",
        "mechanic": "莫斯科红场洋葱头圣殿，全国冻土地块文化与信仰产出提升"
      },
      "historicalBackground": "伊凡雷帝为纪念征服喀山汗国而建于莫斯科红场，八座色彩斑斓、形态各异的洋葱头穹顶围绕中央主塔，为俄罗斯东正教建筑美学巅峰标志。",
      "artBrief": "红场砖石地面上升起色彩绚丽的火焰形多面体教堂群，红黄蓝绿相间的螺旋条纹洋葱头穹顶在雪花纷飞中明艳夺目，宛若盛开的篝火童话。"
    },
    {
      "key": "machu_picchu",
      "name": "马丘比丘",
      "englishName": "Machu Picchu",
      "era": 3,
      "eraName": "文艺复兴",
      "tech": "astronomy",
      "civic": null,
      "cost": 215,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "mountain"
        ],
        "hill": false,
        "engineAdapterNote": "requires mountain cell building occupancy adapter in engine terrain validator",
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 4,
        "gold": 6,
        "tourism": 8
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatEngineerPoints": 2,
        "adjacentMountainScienceBonus": 2,
        "cityProductionMultiplier": 0.15,
        "cityCultureMultiplier": 0.15,
        "description": "必须建造在山脉地块上。所在城市相邻山脉每格提供 +2 科技，城市生产力与文化产出各提升 15%；每周期 +4 文化、+6 金币、+8 旅游、+2 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "mountainCommercialAdjacencyBonus: 2, mountainIndustrialAdjacencyBonus: 2",
        "mechanic": "印加天空之城山脉协同，全国所有山脉为相邻商业中心与工业区提供邻接加成"
      },
      "historicalBackground": "印加帝国十五世纪皇家山林庄园，遗世独立于安第斯山脉崇山峻岭之巅，以无缝咬合干砌抛光巨石墙与悬崖陡峭梯田构成天空之城奇迹。",
      "artBrief": "安第斯山脉险峻绝壁之间的鞍部台地，无缝咬合的灰色多边形巨石砌就的神庙与宫殿群依山势起伏，层层绿色石砌梯田如悬挂云端的绿色阶梯。"
    },
    {
      "key": "topkapi_palace",
      "name": "托普卡帕宫",
      "englishName": "Topkapi Palace",
      "era": 3,
      "eraName": "文艺复兴",
      "tech": "gunpowder",
      "civic": null,
      "cost": 215,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 6,
        "culture": 5,
        "tourism": 6
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatMerchantPoints": 2,
        "greatWorkArtSlots": 1,
        "cityProductionMultiplier": 0.15,
        "cityCultureMultiplier": 0.15,
        "description": "必须建造在沿海丘陵地块。提供 1 个艺术巨作槽位；所在城市基础生产力提升 15%，文化产出提升 15%；每周期 +6 金币、+5 文化、+6 旅游、+2 大商人点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "waterTradeRouteGoldBonus: 3",
        "mechanic": "博斯普鲁斯海峡帝国枢纽，所有水上贸易路线金币产出强化"
      },
      "historicalBackground": "奥斯曼帝国征服君士坦丁堡后苏丹居住了近四个世纪的大皇宫，坐落于博斯普鲁斯海峡与金角湾岬角，珍藏伊斯兰先知圣物与帝国奢华珍宝。",
      "artBrief": "金角湾与马尔马拉海交汇处海角岬角上展开的四重宏大宫廷庭院，崇高之门与正义之塔挺拔耸立，郁金香花园间隐现着伊兹尼克蓝白瓷砖亭阁。"
    },
    {
      "key": "hermitage",
      "name": "冬宫埃尔米塔日博物馆",
      "englishName": "The Hermitage Museum",
      "era": 4,
      "tech": null,
      "civic": "humanism",
      "cost": 210,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "theater",
        "requiresDistrictBuilding": "museum",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 8,
        "tourism": 6
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatWorkArtSlots": 4,
        "greatArtistPoints": 3,
        "description": "提供 4 个艺术巨作槽位；所在城市剧院与艺术馆文化产出 +50%；每周期 +8 文化、+6 旅游、+3 大艺术家点数。",
        "cityTheaterAndMuseumCultureMultiplier": 0.5
      },
      "historicalBackground": "圣彼得堡涅瓦河畔俄罗斯沙皇巴洛克风格宏伟冬宫，叶卡捷琳娜二世创立的世界四大艺术博物馆之一，珍藏三百万件人类艺术珍宝。",
      "artBrief": "翠绿与纯白相间的宏伟巴洛克宫殿立面，镀金雕像矗立屋顶女儿墙，宽阔的冬宫广场与涅瓦河清波交相辉映。",
      "eraName": "工业时代"
    },
    {
      "key": "big_ben",
      "name": "大本钟",
      "englishName": "Big Ben",
      "era": 4,
      "tech": "economics",
      "civic": null,
      "cost": 215,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "commercial",
        "requiresDistrictBuilding": "bank",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 12,
        "culture": 3,
        "tourism": 4
      },
      "instantGrants": {
        "treasuryPercentageBonus": 0.5,
        "treasuryPercentageCap": 1000
      },
      "passiveEffects": {
        "extraEconomicPolicySlot": 1,
        "greatMerchantPoints": 3,
        "description": "全国政治体制额外获得 +1 经济政策槽位；建成时国库现有金币立即增加 50%（最高暴增 1000 金币）；每周期 +12 金币、+3 文化、+4 旅游、+3 大商人点数。"
      },
      "historicalBackground": "伦敦泰晤士河畔英国国会大厦附属的标志性新哥特式四面报时钟塔（伊丽莎白塔），维多利亚时代大英帝国金融与制度顶峰的象征。",
      "artBrief": "泰晤士河浓雾晨曦中耸立的庄严哥特式砂岩钟楼，巨大的四面发光镀金指针表盘俯瞰威斯敏斯特大桥往来马车。",
      "eraName": "工业时代"
    },
    {
      "key": "ruhr_valley",
      "name": "鲁尔山谷",
      "englishName": "Ruhr Valley",
      "era": 4,
      "tech": "industrial",
      "civic": null,
      "cost": 220,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": null,
        "requiresAdjacentDistrict": "industrial",
        "requiresDistrictBuilding": "factory",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "production": 8,
        "tourism": 4
      },
      "instantGrants": {},
      "passiveEffects": {
        "cityProductionMultiplier": 0.2,
        "mineAndQuarryProductionBonus": 2,
        "greatEngineerPoints": 3,
        "description": "本城工业总生产力 +20%；本城所有矿山与采石场每块额外 +2 生产力；每周期 +8 生产力、+4 旅游、+3 大工程师点数。"
      },
      "historicalBackground": "19世纪德国鲁尔河流域兴起的重工业中心，煤矿深井、炼焦炉与克虏伯钢铁厂构筑起现代工业化的无敌引擎。",
      "artBrief": "错综复杂的铁架高炉、红砖动力机房、升降井架与升腾浓烟，铁路货运编组站满载焦炭穿行于河流两侧。",
      "eraName": "工业时代"
    },
    {
      "key": "statue_of_liberty",
      "name": "自由女神像",
      "englishName": "Statue of Liberty",
      "era": 4,
      "tech": null,
      "civic": "nationalism",
      "cost": 225,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "harbor",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "tourism": 6
      },
      "instantGrants": {
        "diplomaticPoints": 4
      },
      "passiveEffects": {
        "regionalLoyaltyAbsoluteRadius6": true,
        "description": "奇观 6 格范围内的所有己方城市获得 100% 绝对忠诚度锁定（永远免于叛乱）；全国每座城市宜居度 +2；每周期 +6 文化、+6 旅游。 首次建成获得 4 点外交胜利积分（不随占领重复获得）。",
        "nationalAmenities": 2
      },
      "historicalBackground": "法国人民为纪念美国独立宣言发表100周年赠送的巨型新古典主义铜雕，巴托尔迪设计、埃菲尔构筑钢架，矗立于纽约港自由岛入口。",
      "artBrief": "矗立在纽约湾星形要塞花岗岩基座上的淡绿色铜衣自由女神巨像，右手高举镀金自由火炬，左手紧握《独立宣言》法典。",
      "eraName": "工业时代"
    },
    {
      "key": "eiffel",
      "name": "埃菲尔铁塔",
      "englishName": "The Eiffel Tower",
      "era": 4,
      "tech": "steel",
      "civic": null,
      "cost": 230,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "culture": 5,
        "tourism": 19
      },
      "instantGrants": {},
      "passiveEffects": {
        "empireCityHousingBonus": 1,
        "empireCityAmenityBonus": 1,
        "empireTourismMultiplier": 0.15,
        "greatEngineerPoints": 3,
        "description": "全国每座城市住房上限直接 +1，宜居度直接 +1；全国旅游业绩总产出提升 15%；每周期 +5 文化、+19 旅游、+3 大工程师点数。"
      },
      "historicalBackground": "居斯塔夫·埃菲尔为1889年巴黎世界博览会设计的324米熟铁镂空网格结构塔，工业时代材料力学与现代美学的丰碑。",
      "artBrief": "四脚跨立于战神广场的熟铁镂空塔身，顶端探照灯划破巴黎夜空，基座精巧拱券与铆接钢构细节毕现。",
      "eraName": "工业时代"
    },
    {
      "key": "cristo_redentor",
      "name": "救世基督像",
      "englishName": "Christ the Redeemer",
      "era": 4,
      "tech": null,
      "civic": "media",
      "cost": 235,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "mountain",
          "grass",
          "plains"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": "mountain",
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "faith": 6,
        "tourism": 12
      },
      "instantGrants": {},
      "passiveEffects": {
        "religiousTourismImmunity": true,
        "seasideResortTourismMultiplier": 1,
        "description": "全国所有旅游业绩总产出直接提升 20%；全国所有圣物巨作旅游产出翻倍（由 +4 变为 +8）；每周期 +6 文化、+6 信仰、+12 旅游。",
        "empireTourismMultiplier": 0.2,
        "relicTourismMultiplier": 1
      },
      "historicalBackground": "巴西里约热内卢科科瓦多山710米花岗岩顶峰的巨型装饰艺术风格雕像，保罗·兰多夫斯基设计，双臂展开拥抱整座海湾城市。",
      "artBrief": "云海缭绕的陡峭驼背山尖上展翅般张开双臂的白色滑石基督巨像，俯瞰碧海银沙的科帕卡巴纳海滩与繁华里约港湾。",
      "eraName": "工业时代"
    },
    {
      "key": "brandenburg_gate",
      "name": "勃兰登堡门",
      "englishName": "Brandenburg Gate",
      "era": 4,
      "eraName": "工业时代",
      "tech": null,
      "civic": "nationalism",
      "cost": 260,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "culture": 5,
        "production": 5,
        "tourism": 8
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatGeneralPoints": 3,
        "cityProductionMultiplier": 0.2,
        "regionalLoyaltyRadius6": 4,
        "description": "必须紧邻城市中心建造。所在城市总生产力提升 20%，向周围 6 格半径内己方城市辐射提供 +4 稳固忠诚度；每周期 +5 文化、+5 生产力、+8 旅游、+3 大统帅点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "barracksInitialXpBonusGlobal: 10",
        "mechanic": "普鲁士军事立国凯旋标志，全国所有军营新训陆军初始经验大幅提升"
      },
      "historicalBackground": "柏林新古典主义砂岩凯旋门，普鲁士国王腓特烈·威廉二世为纪念七年战争胜利下令建造，顶部驾驭四马战车胜利女神铜像象征和平与国家荣耀。",
      "artBrief": "柏林菩提树下大街尽头的新古典主义砂岩城门，十二根多立克巨柱构成五道巍峨门道，门顶铜铸胜利女神驾驭四马双轮战车在朝霞中展翅前驱。"
    },
    {
      "key": "louvre",
      "name": "卢浮宫",
      "englishName": "Louvre Museum",
      "era": 4,
      "eraName": "工业时代",
      "tech": null,
      "civic": "humanism",
      "cost": 260,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "theater",
        "requiresDistrictBuilding": "museum",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 8,
        "tourism": 14
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatArtistPoints": 3,
        "greatWorkArtSlots": 4,
        "cityTheaterAndMuseumCultureMultiplier": 0.3,
        "description": "需相邻剧院广场建造。提供 4 个艺术巨作槽位；所在城市剧院广场与博物馆文化产出提升 30%；每周期 +8 文化、+14 旅游、+3 大艺术家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityMuseumArtYieldMultiplier: 0.3",
        "mechanic": "世界艺术宝库万国展厅，艺术巨作与博物馆主题加成倍率强化"
      },
      "historicalBackground": "法国古典皇家宫殿转型的世界最著名国家艺术博物馆，拥有逾四十万件人类文明艺术瑰宝，馆藏《断臂维纳斯》、《胜利女神》与《蒙娜丽莎》名冠全球。",
      "artBrief": "塞纳河北岸古典主义宏伟宫殿长翼环抱拿破仑庭院，杜乐丽花园与卡鲁塞尔凯旋门在长廊尽头延伸，晨曦照耀精致的法式屋顶浮雕与廊柱雕刻。"
    },
    {
      "key": "summer_palace",
      "name": "北京颐和园",
      "englishName": "Summer Palace (Beijing)",
      "era": 4,
      "eraName": "工业时代",
      "tech": null,
      "civic": "conservation",
      "cost": 260,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "gold": 6,
        "tourism": 10
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatArtistPoints": 2,
        "cityAmenityBonus": 2,
        "cityCultureMultiplier": 0.2,
        "empireTourismMultiplier": 0.1,
        "description": "必须建造在丘陵地块。所在城市宜居度永久 +2，城市文化产出提升 20%，全国旅游业绩产出提升 10%；每周期 +6 文化、+6 金币、+10 旅游、+2 大艺术家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "nationalParkTourismMultiplier: 0.2",
        "mechanic": "中国古典皇家园林山水造景集大成者，全国自然景观与国家公园旅游提升"
      },
      "historicalBackground": "以昆明湖、万寿山为基址，汲取江南园林造景手法建成的皇家山水行宫，长廊、佛香阁与十七孔桥融自然山水与人工建筑为一体，被誉为皇家园林博物馆。",
      "artBrief": "昆明湖碧波荡漾倒映万寿山三层佛香阁，十七孔桥宛若长虹卧波横卧湖面，沿湖八方亭与彩绘苏式长廊在垂柳依依中曲折蜿蜒宛若仙境。"
    },
    {
      "key": "brooklyn_bridge",
      "name": "布鲁克林大桥",
      "englishName": "Brooklyn Bridge",
      "era": 4,
      "eraName": "工业时代",
      "tech": "steam",
      "civic": null,
      "cost": 265,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 8,
        "production": 4,
        "tourism": 8
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatEngineerPoints": 2,
        "cityProductionMultiplier": 0.2,
        "cityHousingBonus": 3,
        "cityAmenityBonus": 1,
        "description": "跨越沿海水域连接陆地建造。所在城市生产力提升 20%，住房容量 +3，宜居度 +1；每周期 +8 金币、+4 生产力、+8 旅游、+2 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "tradeCapacityBonus: 1, cityIndustrialZoneProductionBonus: 3",
        "mechanic": "世界第一座钢丝悬索大桥，帝国贸易路线容量与工业区产能强化"
      },
      "historicalBackground": "约翰·罗布林父子设计建造的世界第一座钢丝悬索巨桥，连接曼哈顿与布鲁克林，花岗岩哥特式双拱门桥塔成为十九世纪工业工程奇迹典范。",
      "artBrief": "横跨东河的宏伟石砌双拱桥塔巍然伫立，粗壮的镀锌钢索如琴弦般呈斜拉放射状伸展，桥下蒸汽货船汽笛鸣响穿梭而过，远景为初现雏形的都市轮廓。"
    },
    {
      "key": "mount_rushmore",
      "name": "总统山",
      "englishName": "Mount Rushmore National Memorial",
      "era": 5,
      "tech": null,
      "civic": "media",
      "cost": 250,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "mountain",
          "grass",
          "plains"
        ],
        "hill": true,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": "mountain",
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 8,
        "tourism": 12
      },
      "instantGrants": {},
      "passiveEffects": {
        "warWearinessReduction": 0.5,
        "homeTerritoryCombatBonus": 4,
        "defensiveWarLoyaltyImmunity": true,
        "description": "全国厌战度减少 50%；在己方领土作战的所有陆军单位战斗力 +4；对外防御作战期间国内城市绝对免于叛乱；每周期 +8 文化、+12 旅游。"
      },
      "historicalBackground": "格曾·博格勒姆于1927至1941年在南达科他州黑山花岗岩绝壁上凿刻的四位美国总统（华盛顿、杰斐逊、老罗斯福、林肯）60英尺巨型头像，象征共和国的立国、拓展、保护与统一。",
      "artBrief": "黑山陡峭灰色花岗岩绝壁上雕琢出的四位领袖巨像，风化岩层纹理自然，松林苍翠映衬峭壁雄风。",
      "eraName": "现代"
    },
    {
      "key": "broadway",
      "name": "百老汇",
      "englishName": "Broadway",
      "era": 5,
      "tech": null,
      "civic": "media",
      "cost": 255,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "theater",
        "requiresDistrictBuilding": "broadcast",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 10,
        "tourism": 10
      },
      "instantGrants": {
        "freeRandomCivicAtomicEra": 1
      },
      "passiveEffects": {
        "greatWorkWritingSlots": 1,
        "greatWorkMusicSlots": 2,
        "cityCultureMultiplier": 0.2,
        "greatWriterPoints": 2,
        "greatMusicianPoints": 2,
        "description": "提供 1 个文学槽位和 2 个音乐巨作槽位；建成时免费获得 1 项随机原子能时代市政提升；本城文化产出 +20%；每周期 +10 文化、+10 旅游、+2 大作家点数、+2 大音乐家点数。"
      },
      "historicalBackground": "纽约曼哈顿时代广场周围的商业剧场集聚区，现代音乐剧、舞台表演艺术与全球文化娱乐产业的世界心脏。",
      "artBrief": "摩天大楼林立的时代广场璀璨霓虹灯火夜景，剧院大门雨棚上闪耀的经典音乐剧招牌与穿流不息的黄色出租车长龙。",
      "eraName": "现代"
    },
    {
      "key": "panama_canal",
      "name": "巴拿马运河",
      "englishName": "Panama Canal",
      "era": 5,
      "tech": "steam",
      "civic": "urbanization",
      "cost": 260,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "grass",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": true,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "gold": 14,
        "tourism": 6
      },
      "instantGrants": {},
      "passiveEffects": {
        "waterTransitTileTransit": true,
        "tradeRouteGoldMultiplier": 1,
        "tradeRouteFlatGoldBonus": 10,
        "greatMerchantPoints": 4,
        "description": "解锁需蒸汽动力与城市化；该地块变为水上通道（己方及开放边界海军可直接穿越通行）；所有穿过或发自本城的国内外贸易路线金币收益翻倍（基础 +10 金币）；每周期 +14 金币、+6 旅游、+4 大商人点数。"
      },
      "historicalBackground": "1914年通航的连通太平洋与大西洋的82公里水闸式人工运河，打破美洲大陆阻隔，全球海运咽喉与现代工程奇迹。",
      "artBrief": "梯级阶梯式混凝土双向船闸系统，两岸电力机车轨道牵引着庞大的现代化集装箱货轮平稳驶过加通湖水道。",
      "eraName": "现代"
    },
    {
      "key": "golden_gate",
      "name": "金门大桥",
      "englishName": "Golden Gate Bridge",
      "era": 5,
      "tech": "combustion",
      "civic": null,
      "cost": 270,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": true,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 6,
        "gold": 8,
        "tourism": 14
      },
      "instantGrants": {},
      "passiveEffects": {
        "landUnitsCrossWaterTransit": true,
        "cityTileImprovementTourismMultiplier": 1,
        "cityAmenityBonus": 3,
        "description": "陆军与平民单位可直接在连接的两块陆地间过桥移动（无需登船乘渡）；本城所有改良地块旅游产出翻倍；本城宜居度 +3；每周期 +6 文化、+8 金币、+14 旅游。"
      },
      "historicalBackground": "约瑟夫·斯特劳斯于1937年跨越旧金山金门海峡建成的1280米单跨悬索桥，国际橘色涂装与装饰艺术塔架使其成为现代桥梁力学与美学永恒图腾。",
      "artBrief": "太平洋晨雾翻涌中拔海而起的两座国际橘巨型钢桁悬索塔架，悬索如琴弦拉伸，双层桥面车流在壮美海湾上凌空飞渡。",
      "eraName": "现代"
    },
    {
      "key": "empire_state",
      "name": "帝国大厦",
      "englishName": "Empire State Building",
      "era": 5,
      "eraName": "现代",
      "tech": "steel",
      "civic": null,
      "cost": 320,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": "bank",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "gold": 10,
        "production": 6,
        "tourism": 12
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatMerchantPoints": 3,
        "cityProductionMultiplier": 0.2,
        "cityCultureMultiplier": 0.15,
        "empireCityHousingBonus": 1,
        "description": "必须紧邻城市中心建造。所在城市基础生产力提升 20%，文化产出提升 15%，全国所有城市住房容量 +1；每周期 +10 金币、+6 生产力、+12 旅游、+3 大商人点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityExchangeGoldMultiplier: 0.3, empireOfficeGoldBonus: 4",
        "mechanic": "世界摩天大楼黄金时代丰碑，商业中心证券交易所金币加成"
      },
      "historicalBackground": "1931年落成于纽约曼哈顿，地上102层、高381米的装饰艺术风格（Art Deco）摩天大楼，以仅用410天完工的惊人建造速度保持世界最高建筑纪录四十载。",
      "artBrief": "曼哈顿黄昏迷雾中直插云霄的装饰艺术阶梯式摩天大楼，不锈钢塔尖在落日余晖中熠熠闪光，楼体层层凹进的石灰石外墙透出万家通明灯火。"
    },
    {
      "key": "sagrada_familia",
      "name": "圣家宗座圣殿",
      "englishName": "Basílica de la Sagrada Família",
      "era": 5,
      "eraName": "现代",
      "tech": null,
      "civic": "opera",
      "cost": 320,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "faith": 8,
        "culture": 8,
        "tourism": 15
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatArtistPoints": 2,
        "greatEngineerPoints": 2,
        "greatWorkArtSlots": 2,
        "empireTourismMultiplier": 0.1,
        "cityCultureMultiplier": 0.2,
        "description": "需相邻圣地建造。提供 2 个艺术巨作槽位；全国旅游业绩产出提升 10%，所在城市文化产出提升 20%；每周期 +8 信仰、+8 文化、+15 旅游、+2 大艺术家点数、+2 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "cityTourismMultiplier: 0.2",
        "mechanic": "高迪加泰罗尼亚现代主义神圣森林自然建筑，跨世纪修筑旅游爆发"
      },
      "historicalBackground": "加泰罗尼亚建筑大师安东尼·高迪的毕生绝唱，融合新哥特式与加泰罗尼亚现代主义，以十八座高耸立面尖塔和树状石柱内殿展现自然主义神圣宇宙。",
      "artBrief": "巴塞罗那晨光中直指苍穹的受难与诞生立面尖塔，外墙雕刻如融化岩浆般生动有机，殿堂内部如森林石柱枝桠般舒展，彩色玻璃窗透出梦幻光谱。"
    },
    {
      "key": "hoover_dam",
      "name": "胡佛大坝",
      "englishName": "Hoover Dam",
      "era": 5,
      "eraName": "现代",
      "tech": "electricity",
      "civic": null,
      "cost": 330,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "desert",
          "plains"
        ],
        "hill": true,
        "requiresAdjacentDistrict": "industrial",
        "requiresDistrictBuilding": "factory",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": true,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "production": 10,
        "gold": 6,
        "tourism": 8
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatEngineerPoints": 3,
        "cityProductionMultiplier": 0.25,
        "empireAllCitiesHousingBonus": 1,
        "regionalLoyaltyRadius6": 4,
        "description": "必须建造在沿河丘陵地块，且相邻建有工厂的工业区。所在城市生产力大幅提升 25%，全国所有城市住房容量 +1，并向 6 格半径内城市辐射提供 +4 稳固忠诚度；每周期 +10 生产力、+6 金币、+8 旅游、+3 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "regionalCleanPowerBonus: true, regionalBonusDistance: 9",
        "mechanic": "科罗拉多大峡谷水力发电与沙漠蓄水灌溉，辐射清洁电力网络"
      },
      "historicalBackground": "美国大萧条时期在科罗拉多河黑峡谷筑起的混凝土重力拱坝巨擘，调蓄洪水并孕育人造米德湖，为美国西南部现代化工业与绿洲农业提供充沛动能。",
      "artBrief": "红褐色险峻峡谷裂隙间紧紧嵌入一座巨大的白色混凝土抛物线重力拱坝，平滑的弧形外壁俯临奔腾的科罗拉多河，两侧装饰艺术风格进水塔巍然耸立。"
    },
    {
      "key": "sydney_opera",
      "name": "悉尼歌剧院",
      "englishName": "Sydney Opera House",
      "era": 6,
      "tech": null,
      "civic": "opera",
      "cost": 280,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "coast"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "harbor",
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": true,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "culture": 12,
        "tourism": 16
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatWorkMusicSlots": 3,
        "greatMusicianPoints": 3,
        "empireCultureMultiplier": 0.05,
        "description": "提供 3 个音乐巨作槽位；全国文化总产出 +5%；每周期 +12 文化、+16 旅游、+3 大音乐家点数。"
      },
      "historicalBackground": "丹麦建筑师约恩·乌松设计的贝壳形表现主义现代建筑杰作，坐落在悉尼便利朗角水畔，20世纪世界文化建筑的奇迹。",
      "artBrief": "悉尼港湛蓝海水包围下的白色贝壳与扬帆状混凝土预制薄壳屋顶，瓷砖贴面在南半球艳阳下折射耀眼银光。",
      "eraName": "原子能时代"
    },
    {
      "key": "cern_lhc",
      "name": "大型强子对撞机",
      "englishName": "Large Hadron Collider (CERN)",
      "era": 6,
      "eraName": "原子能时代",
      "tech": "nuclearfission",
      "civic": null,
      "cost": 420,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "plains",
          "grass"
        ],
        "hill": false,
        "requiresAdjacentDistrict": "campus",
        "requiresDistrictBuilding": "lab",
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": false,
        "requiresWaterTransit": false,
        "maxCityDistance": 2
      },
      "recurringYields": {
        "science": 16,
        "production": 6,
        "tourism": 10
      },
      "instantGrants": {
        "freeTechs": 1
      },
      "passiveEffects": {
        "greatScientistPoints": 4,
        "cityScienceMultiplier": 0.3,
        "description": "需相邻建有实验室的学院建造。建成时立即免费解锁 1 项当前时代内符合前置条件的随机科技（freeTechs: 1）；所在城市科技总产出提升 30%；每周期 +16 科技、+6 生产力、+10 旅游、+4 大科学家点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "empireLabScienceBonus: 4",
        "mechanic": "地下27公里超导粒子对撞环，探测希格斯玻色子，全国实验室科研强化"
      },
      "historicalBackground": "欧洲核子研究组织在日内瓦地下百米建造的27公里环形超导粒子加速器，人类有史以来最复杂的精密科学实验装置，2012年成功发现上帝粒子（希格斯玻色子）。",
      "artBrief": "地下深处幽蓝低温环形隧道内延绵不绝的超导磁体管道，巨大如五层楼高的ATLAS超导粒子探测器被无数复杂的传感器电缆与同心电磁线圈重重包裹。"
    },
    {
      "key": "burj_khalifa",
      "name": "哈利法塔",
      "englishName": "Burj Khalifa",
      "era": 6,
      "eraName": "原子能时代",
      "tech": "telecommunications",
      "civic": null,
      "cost": 420,
      "footprintHexes": 1,
      "placement": {
        "validTerrains": [
          "desert",
          "plains"
        ],
        "hill": false,
        "requiresAdjacentDistrict": null,
        "requiresDistrictBuilding": null,
        "requiresAdjacentResource": null,
        "requiresAdjacentFeature": null,
        "requiresAdjacentAny": [],
        "requiresRiver": false,
        "requiresAdjacentLand": false,
        "requiresAdjacentCityCenter": true,
        "requiresWaterTransit": false,
        "maxCityDistance": 1
      },
      "recurringYields": {
        "gold": 14,
        "culture": 8,
        "tourism": 20
      },
      "instantGrants": {},
      "passiveEffects": {
        "greatMerchantPoints": 3,
        "greatEngineerPoints": 2,
        "empireTourismMultiplier": 0.15,
        "cityCultureMultiplier": 0.2,
        "cityHousingBonus": 4,
        "description": "必须紧邻城市中心建造。全国旅游业绩产出提升 15%，所在城市文化产出提升 20%，城市住房容量 +4；每周期 +14 金币、+8 文化、+20 旅游、+3 大商人点数、+2 大工程师点数。"
      },
      "optionalExtendedDesign": {
        "originalField": "tradeCapacityBonus: 1, cityTourismMultiplier: 0.25",
        "mechanic": "世界第一高楼沙漠镀铬铝玻璃丰碑，国际贸易枢纽与全球超级旅游热点"
      },
      "historicalBackground": "2010年落成于阿联酋迪拜，楼高828米共163层，以沙漠之花蜘蛛兰为灵感设计的三叉翼阶梯状Y形核心筒，为当今世界最高人造建筑与当代工程奇观。",
      "artBrief": "阿拉伯海湾沙漠之畔拔地而起的828米闪亮银色细长尖塔，三支管状外翼随高度螺旋向上层层退缩，玻璃与拉丝不锈钢反光幕墙在烈日下闪耀着耀眼的光芒。"
    }
  ],
  "greatPeopleRoster": [
    {
      "key": "thales",
      "name": "泰勒斯",
      "englishName": "Thales of Miletus",
      "classKey": "scientist",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 60,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "sailing",
          "celestial"
        ],
        "cityPermanentScience": 2
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有学院的城市激活：立即解锁《航海术》与《天文学原理》两项远古核心尤里卡；所在城市每周期永久 +2 科技。",
      "historicalBiography": "古希腊米利都学派创始人，西方哲学之父与古代天文学先驱，成功预测公元前585年日食，开创理性自然哲学说。"
    },
    {
      "key": "anaximander",
      "name": "阿那克西曼德",
      "englishName": "Anaximander",
      "classKey": "scientist",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 75,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "writing",
          "currency"
        ],
        "empireLibraryScienceBonus": 1
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireLibraryScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有学院的城市激活：立即解锁《文字》与《货币》尤里卡；全国所有图书馆每周期额外 +1 科技。",
      "historicalBiography": "古希腊哲学家与地理学家，创制希腊第一张世界地图与日晷指针，提出宇宙起源于‘无定（Apeiron）’的深刻唯物论辩。"
    },
    {
      "key": "zhang_heng",
      "name": "张衡",
      "englishName": "Zhang Heng",
      "classKey": "scientist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 120,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "engineering",
          "astronomy"
        ],
        "cityPermanentScience": 3
      },
      "effectDescription": "在拥有学院的城市激活：立即解锁《工程》与《天文学》两项科技的尤里卡提升；该城市永久每周期 +3 科技。",
      "historicalBiography": "东汉杰出天文学家、数学家、发明家与文学家，创制水运浑天仪与候风地动仪，正确解释月食成因，开创定量天文学先河。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "hypatia",
      "name": "希帕提娅",
      "englishName": "Hypatia of Alexandria",
      "classKey": "scientist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 150,
      "targetRequirement": "city_with_campus",
      "recipeType": "free_building",
      "recipeParams": {
        "freeBuilding": "library",
        "scienceReserveFallback": 60,
        "campusBuildingScienceMultiplier": 0.5
      },
      "effectDescription": "在拥有学院的城市激活：立即免费建造一座图书馆（若已建则转为 60 科技储备）；本城图书馆与大学科技产出永久 +50%。",
      "historicalBiography": "古埃及亚历山大里亚新柏拉图学派哲学家、数学家与天文学家，编撰圆锥曲线与算术评注，古代科学理性精神最后的灯塔。",
      "effectScopes": {
        "freeBuilding": "activation_city",
        "scienceReserveFallback": "empire",
        "campusBuildingScienceMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "euclid",
      "name": "欧几里得",
      "englishName": "Euclid of Alexandria",
      "classKey": "scientist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 180,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "mathematics",
          "construction"
        ],
        "cityPermanentScience": 3,
        "empireLibraryScienceBonus": 1
      },
      "effectDescription": "在拥有学院的城市激活：立即解锁《数学》与《建造》两项科技的尤里卡提升；所在城市每周期 +3 科技，全国所有图书馆每周期额外 +1 科技。",
      "historicalBiography": "古希腊数学家，被称为“几何之父”，所著《几何原本》建立公理化公设演绎体系，深刻塑造两千年来人类逻辑与科学思维。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city",
        "empireLibraryScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "aryabhata",
      "name": "阿里亚哈塔",
      "englishName": "Aryabhata",
      "classKey": "scientist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 210,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "mathematics",
          "astronomy"
        ],
        "cityPermanentScience": 4
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有学院的城市激活：立即解锁《数学》与《天文学》尤里卡；所在城市每周期永久 +4 科技。",
      "historicalBiography": "印度古典笈多王朝数学家与天文学家，著有《阿里亚哈塔历书》，精确计算圆周率至3.1416，首倡地动说与日食科学测算法。"
    },
    {
      "key": "eratosthenes",
      "name": "埃拉托斯特尼",
      "englishName": "Eratosthenes",
      "classKey": "scientist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "natural_wonder_or_coast_campus",
      "recipeType": "science_burst_exploration",
      "recipeParams": {
        "instantScienceBurst": 350,
        "scienceBonusPerDiscoveredCiv": 30
      },
      "effectScopes": {
        "instantScienceBurst": "empire",
        "scienceBonusPerDiscoveredCiv": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在自然奇观或沿海学院激活：立即获得 350 科技点储备，当前每探明一个文明额外奖励 +30 科技点。",
      "historicalBiography": "托勒密王朝亚历山大图书馆馆长，地理学之父，利用夏至正午阿斯旺与亚历山大日影倾角惊人精确地测算出地球周长。"
    },
    {
      "key": "ptolemy",
      "name": "托勒密",
      "englishName": "Claudius Ptolemy",
      "classKey": "scientist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 270,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "celestial",
          "cartography"
        ],
        "empireCampusScienceBonus": 1
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireCampusScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有学院的城市激活：解锁《制图学》与《天文学原理》尤里卡；全国所有学院区域每周期额外 +1 科技。",
      "historicalBiography": "罗马时期亚历山大港数学家、天文学家与地理学家，著有《天文学大成》与《地理学指南》，奠定统治西方千年的地心宇宙体系。"
    },
    {
      "key": "zu_chongzhi",
      "name": "祖冲之",
      "englishName": "Zu Chongzhi",
      "classKey": "scientist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "campus_district",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "machinery",
          "education"
        ],
        "cityPermanentScience": 4,
        "instantCityProduction": 80
      },
      "effectDescription": "在学院区域激活：立即解锁《机械》与《教育》两项科技的尤里卡提升；该城每周期 +4 科技，本城在建项目获得 80 生产力加速。",
      "historicalBiography": "南朝杰出数学家与天文学家，将圆周率精确推算至小数点后第七位（盈数3.1415927与朒数3.1415926之间），领先世界近千年，编制《大明历》。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city",
        "instantCityProduction": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "alhazen",
      "name": "海什木",
      "englishName": "Alhazen (Ibn al-Haytham)",
      "classKey": "scientist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "campus_district",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "astronomy"
        ],
        "empireCampusScienceBonus": 2
      },
      "effectDescription": "在学院区域激活：立即获得《天文学》科技尤里卡提升；全国所有学院区域每周期额外 +2 科技。",
      "historicalBiography": "阿拉伯帝国黄金时代博学通才，实验科学与现代光学之父，著有《光学之书》，首创暗箱针孔成像理论与近代科学实证方法。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireCampusScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "avicenna",
      "name": "伊本·西那",
      "englishName": "Avicenna (Ibn Sina)",
      "classKey": "scientist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 360,
      "targetRequirement": "city_with_campus",
      "recipeType": "free_building",
      "recipeParams": {
        "freeBuilding": "library",
        "scienceReserveFallback": 280,
        "campusBuildingScienceMultiplier": 0.2
      },
      "effectScopes": {
        "freeBuilding": "activation_city",
        "scienceReserveFallback": "empire",
        "campusBuildingScienceMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：免费建造图书馆（已有则转为 280 科技储备）；所在城市学院建筑科技产出永久提升 20%。",
      "historicalBiography": "伊斯兰黄金时代波斯哲学家与医学之父，著有巨著《医典》与《治疗论》，统治中世纪欧洲与中东医学规范五百余年。"
    },
    {
      "key": "al_biruni",
      "name": "比鲁尼",
      "englishName": "Al-Biruni",
      "classKey": "scientist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "adjacent_mountain_or_campus",
      "recipeType": "mountain_science_burst",
      "recipeParams": {
        "scienceBurstPerAdjacentMountain": 100,
        "flatScienceBonus": 300
      },
      "effectScopes": {
        "scienceBurstPerAdjacentMountain": "empire",
        "flatScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在相邻山脉的学院激活：根据相邻山脉每格爆发 100 科技点，并固定获得 300 科技储备。",
      "historicalBiography": "中亚花剌子模通才大师，人类学、测地学与印度学开山宗师，利用山顶视倾角法精确测定地球半径与重力加速度。"
    },
    {
      "key": "shen_kuo",
      "name": "沈括",
      "englishName": "Shen Kuo",
      "classKey": "scientist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 480,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "printing",
          "gunpowder",
          "machinery"
        ],
        "cityPermanentScience": 4
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：立即解锁《印刷术》、《火药》与《机械》三项跨时代核心科技尤里卡；所在城市每周期永久 +4 科技。",
      "historicalBiography": "北宋博学科学家与政治家，著有《梦溪笔谈》，首创‘石油’命名，详细记载活字印刷、指南针地磁偏角与地貌侵蚀学说。"
    },
    {
      "key": "roger_bacon",
      "name": "罗吉尔·培根",
      "englishName": "Roger Bacon",
      "classKey": "scientist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 540,
      "targetRequirement": "campus_with_university",
      "recipeType": "free_tech_and_building_boost",
      "recipeParams": {
        "universityScienceBonus": 3,
        "universityProductionBonus": 2,
        "freeRandomTechCount": 1,
        "targetEras": [
          2,
          3
        ]
      },
      "effectScopes": {
        "universityScienceBonus": "activation_city",
        "universityProductionBonus": "activation_city",
        "freeRandomTechCount": "empire",
        "targetEras": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有大学的学院激活：免费随机解锁 1 项中古或文艺复兴科技；所在大学永久 +3 科技、+2 生产力。",
      "historicalBiography": "英国方济各会修士、经院哲学家，被誉为‘奇迹博士’，近代实验科学的先行倡导者，预言望远镜、显微镜与火药军用前景。"
    },
    {
      "key": "isaac_newton",
      "name": "艾萨克·牛顿",
      "englishName": "Isaac Newton",
      "classKey": "scientist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "campus_with_university",
      "recipeType": "free_tech_and_building_boost",
      "recipeParams": {
        "universityScienceBonus": 4,
        "universityProductionBonus": 2,
        "freeRandomTechCount": 1,
        "targetEras": [
          3,
          4
        ]
      },
      "effectDescription": "在拥有大学的学院区域激活：立即免费随机解锁 1 项文艺复兴或工业时代未研发科技；所在城市的大学永久 +4 科技、+2 生产力。",
      "historicalBiography": "英国物理学家与数学家，著有《自然哲学的数学原理》，确立万有引力与经典力学三大定律，开创近代经典物理学与微积分学说。",
      "effectScopes": {
        "universityScienceBonus": "activation_city",
        "universityProductionBonus": "activation_city",
        "freeRandomTechCount": "empire",
        "targetEras": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "galileo_galilei",
      "name": "伽利略·伽利莱",
      "englishName": "Galileo Galilei",
      "classKey": "scientist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 510,
      "targetRequirement": "adjacent_mountain_or_campus",
      "recipeType": "mountain_science_burst",
      "recipeParams": {
        "scienceBurstPerAdjacentMountain": 120,
        "flatScienceBonus": 250
      },
      "effectDescription": "在相邻山脉的学院激活：根据相邻山脉数量，每格山脉立即提供 120 点瞬时科技储备（基础保底 250 科技储备）。",
      "historicalBiography": "意大利天文学家、物理学家与工程师，“现代观测天文学之父”，改良折射望远镜发现木星四颗大卫星，有力证实哥白尼日心说。",
      "effectScopes": {
        "scienceBurstPerAdjacentMountain": "empire",
        "flatScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "johannes_kepler",
      "name": "约翰尼斯·开普勒",
      "englishName": "Johannes Kepler",
      "classKey": "scientist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 600,
      "targetRequirement": "campus_district",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "astronomy",
          "scientifictheory",
          "ballistics"
        ],
        "empireCampusScienceBonus": 1
      },
      "effectDescription": "在学院区域激活：立即解锁《天文学》、《科学理论》与《弹道学》三项关键科技的尤里卡提升；全国学院区域每周期 +1 科技。",
      "historicalBiography": "德意志天文学家、数学家，发现行星运动三大定律（椭圆轨道定律、面积定律、调和定律），被誉为“天空立法者”。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireCampusScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "nicolaus_copernicus",
      "name": "尼古拉·哥白尼",
      "englishName": "Nicolaus Copernicus",
      "classKey": "scientist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 690,
      "targetRequirement": "campus_with_university",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "astronomy",
          "scientifictheory"
        ],
        "empireCampusScienceBonus": 2
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireCampusScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有大学的学院激活：立即解锁《天文学》与《科学理论》尤里卡；全国所有学院区域每周期额外 +2 科技。",
      "historicalBiography": "波兰文艺复兴天文学家与数学家，发表《天体运行论》，确立日心说现代宇宙模型，引爆近代科学革命。"
    },
    {
      "key": "li_shizhen",
      "name": "李时珍",
      "englishName": "Li Shizhen",
      "classKey": "scientist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "sanitation",
          "education"
        ],
        "cityPermanentScience": 5
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：解锁《公共卫生》与《教育》尤里卡；所在城市每周期永久 +5 科技，城市住房上限 +1。",
      "historicalBiography": "明代医药学家与植物学家，历时二十七年编撰《本草纲目》，分类详载1892种天然药物与万余药方，达尔文誉其为古代中国百科全书。"
    },
    {
      "key": "william_harvey",
      "name": "威廉·哈维",
      "englishName": "William Harvey",
      "classKey": "scientist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 870,
      "targetRequirement": "campus_with_university",
      "recipeType": "free_tech_and_building_boost",
      "recipeParams": {
        "universityScienceBonus": 4,
        "universityProductionBonus": 1,
        "freeRandomTechCount": 1,
        "targetEras": [
          3,
          4
        ]
      },
      "effectScopes": {
        "universityScienceBonus": "activation_city",
        "universityProductionBonus": "activation_city",
        "freeRandomTechCount": "empire",
        "targetEras": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有大学的学院激活：免费随机解锁 1 项文艺复兴或工业时代科技；所在大学永久 +4 科技、+1 生产力。",
      "historicalBiography": "英国生理学家与医生，出版《心血运动论》，通过严谨定量实验首次发现血液循环系统，开创近代生理学与比较解剖学。"
    },
    {
      "key": "james_clerk_maxwell",
      "name": "詹姆斯·克拉克·麦克斯韦",
      "englishName": "James Clerk Maxwell",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 650,
      "targetRequirement": "campus_with_lab",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "electricity",
          "radio"
        ],
        "empireLabScienceBonus": 2
      },
      "effectDescription": "在建有研究实验室的学院激活：立即解锁《电力》与《无线电》尤里卡；全国所有研究实验室每周期科技产出额外 +2。",
      "historicalBiography": "苏格兰理论物理学家与数学家，提出经典电磁理论麦克斯韦方程组，预言电磁波存在，实现物理学史上第二次伟大理论大统一。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireLabScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "charles_darwin",
      "name": "查尔斯·达尔文",
      "englishName": "Charles Darwin",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "natural_wonder_or_coast_campus",
      "recipeType": "science_burst_exploration",
      "recipeParams": {
        "instantScienceBurst": 500,
        "scienceBonusPerDiscoveredCiv": 50
      },
      "effectDescription": "在自然奇观旁或沿海学院激活：立即获得 500 点科技储备，并根据已知其他文明数量每遇见一家额外获得 50 科技。",
      "historicalBiography": "英国生物学家、进化论奠基人，随小猎犬号环球科学考察，著有《物种起源》，确立自然选择与适者生存的生物进化法则。",
      "effectScopes": {
        "instantScienceBurst": "empire",
        "scienceBonusPerDiscoveredCiv": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "dmitri_mendeleev",
      "name": "德米特里·门捷列夫",
      "englishName": "Dmitri Mendeleev",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 910,
      "targetRequirement": "campus_with_lab",
      "recipeType": "free_tech_grant",
      "recipeParams": {
        "freeRandomTechCount": 1,
        "targetEras": [
          4,
          5
        ],
        "eurekaTechs": [
          "refining",
          "scientifictheory"
        ]
      },
      "effectDescription": "在建有实验室的学院激活：立即免费获得 1 项未研发的工业或现代科技，并解锁《精炼技术》与《科学理论》科技尤里卡。",
      "historicalBiography": "俄国杰出化学家，发现元素周期律并编纂世界上第一张元素周期表，准确预言了锗、镓等尚未发现未知元素的理化特性。",
      "effectScopes": {
        "freeRandomTechCount": "empire",
        "targetEras": "meta",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "louis_pasteur",
      "name": "路易·巴斯德",
      "englishName": "Louis Pasteur",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1040,
      "targetRequirement": "city_with_campus",
      "recipeType": "free_tech_grant",
      "recipeParams": {
        "freeRandomTechCount": 1,
        "targetEras": [
          4
        ],
        "eurekaTechs": [
          "sanitation"
        ]
      },
      "effectScopes": {
        "freeRandomTechCount": "empire",
        "targetEras": "meta",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：解锁《公共卫生》科技并免费随机解锁 1 项工业时代未研发科技；全国所有城市粮食产出提升 10%。",
      "historicalBiography": "法国微生物学家与化学家，创立微生物致病理论，发明巴氏杀菌法，成功研制狂犬病与炭疽疫苗，拯救全球无数生命。"
    },
    {
      "key": "gregor_mendel",
      "name": "格雷戈尔·孟德尔",
      "englishName": "Gregor Mendel",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1170,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "scientifictheory",
          "sanitation"
        ],
        "cityPermanentScience": 6
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：解锁《科学理论》尤里卡；所在城市每周期永久 +6 科技，所有农田产出 +1 粮食。",
      "historicalBiography": "奥地利帝国圣奥古斯丁修道院修士与遗传学奠基人，通过八年豌豆杂交实验发现分离定律与自由组合定律，揭示生物遗传密码。"
    },
    {
      "key": "michael_faraday",
      "name": "迈克尔·法拉第",
      "englishName": "Michael Faraday",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "campus_with_lab",
      "recipeType": "free_tech_grant",
      "recipeParams": {
        "freeRandomTechCount": 1,
        "targetEras": [
          4,
          5
        ],
        "eurekaTechs": [
          "electricity"
        ]
      },
      "effectScopes": {
        "freeRandomTechCount": "empire",
        "targetEras": "meta",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在研究实验室激活：立即解锁《电力》核心科技，并免费随机获得 1 项工业或现代科技。",
      "historicalBiography": "英国物理学家与化学家，发现电磁感应现象与电解定律，发明早期发电机与电动机，奠定现代电气文明物理基石。"
    },
    {
      "key": "antoine_lavoisier",
      "name": "安托万·拉瓦锡",
      "englishName": "Antoine Lavoisier",
      "classKey": "scientist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 6,
      "charges": 1,
      "baseThreshold": 1430,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "refining",
          "scientifictheory"
        ],
        "empireLabScienceBonus": 2
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "empireLabScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：解锁《精炼技术》尤里卡；全国所有研究实验室每周期额外 +2 科技。",
      "historicalBiography": "法国近代化学之父，确立质量守恒定律，推翻燃素说并正确命名氧与氢，建立现代化学元素命名分类规范。"
    },
    {
      "key": "albert_einstein",
      "name": "阿尔伯特·爱因斯坦",
      "englishName": "Albert Einstein",
      "classKey": "scientist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 950,
      "targetRequirement": "campus_with_lab",
      "recipeType": "modern_atomic_eurekas",
      "recipeParams": {
        "allLabsScienceBonus": 4,
        "allModernAndAtomicEurekas": true
      },
      "effectDescription": "在拥有研究实验室的学院区域激活：立即获得所有现代与原子能时代科技的尤里卡提升；全国所有研究实验室每周期科技产出 +4。",
      "historicalBiography": "20世纪最伟大的物理学家，提出狭义与广义相对论及光电效应量子论，彻底重塑人类对时空、能量与引力的底层认知。",
      "effectScopes": {
        "allLabsScienceBonus": "empire",
        "allModernAndAtomicEurekas": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "marie_curie",
      "name": "玛丽·居里",
      "englishName": "Marie Curie",
      "classKey": "scientist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 1130,
      "targetRequirement": "campus_with_lab",
      "recipeType": "nuclear_science_grant",
      "recipeParams": {
        "eurekaTechs": [
          "nuclearfission",
          "atomic"
        ],
        "instantScienceBurst": 600,
        "nuclearLabScienceBonus": 3
      },
      "effectDescription": "在建有实验室的学院激活：立即解锁《原子理论》与《核裂变》尤里卡并获得 600 科技储备；全国核能实验室科技 +3、生产力 +2。",
      "historicalBiography": "波兰裔法国籍物理学家与化学家，放射性研究先驱，发现钋与镭两项新元素，人类历史上首位两度荣获诺贝尔奖的科学巨匠。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantScienceBurst": "empire",
        "nuclearLabScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "niels_bohr",
      "name": "尼尔斯·玻尔",
      "englishName": "Niels Bohr",
      "classKey": "scientist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 1310,
      "targetRequirement": "campus_with_lab",
      "recipeType": "nuclear_science_grant",
      "recipeParams": {
        "eurekaTechs": [
          "atomic",
          "nuclearfission"
        ],
        "instantScienceBurst": 650,
        "nuclearLabScienceBonus": 4
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantScienceBurst": "empire",
        "nuclearLabScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在研究实验室激活：解锁《原子能》尤里卡，注入 650 科技点储备，全国研究实验室额外 +4 科技。",
      "historicalBiography": "丹麦理论物理学家，哥本哈根学派领袖，提出原子量子化轨道模型与互补原理，现代量子力学奠基人。"
    },
    {
      "key": "max_planck",
      "name": "马克斯·普朗克",
      "englishName": "Max Planck",
      "classKey": "scientist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1490,
      "targetRequirement": "campus_with_lab",
      "recipeType": "modern_atomic_eurekas",
      "recipeParams": {
        "allLabsScienceBonus": 4,
        "allModernAndAtomicEurekas": true
      },
      "effectScopes": {
        "allLabsScienceBonus": "empire",
        "allModernAndAtomicEurekas": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在研究实验室激活：立即解锁现代所有未获得的尤里卡提升；全国所有研究实验室科技产出永久 +4。",
      "historicalBiography": "德国著名物理学家，提出量子假说并确立普朗克常数，打破经典物理学黑体辐射困境，开创现代微观物理学革命。"
    },
    {
      "key": "alexander_fleming",
      "name": "亚历山大·弗莱明",
      "englishName": "Alexander Fleming",
      "classKey": "scientist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1670,
      "targetRequirement": "city_with_campus",
      "recipeType": "eureka_grant",
      "recipeParams": {
        "eurekaTechs": [
          "sanitation",
          "combustion"
        ],
        "cityPermanentScience": 8
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在学院激活：解锁前沿卫生科技尤里卡；所在城市每周期永久 +8 科技，全国所有单位在友方领土每周期恢复生命 +5。",
      "historicalBiography": "苏格兰生物学家与药理学家，1928年偶然发现青霉素青霉菌分泌物的杀菌效应，开辟近代抗生素抗感染医学新纪元。"
    },
    {
      "key": "qian_xuesen",
      "name": "钱学森",
      "englishName": "Qian Xuesen",
      "classKey": "scientist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 1850,
      "targetRequirement": "city_with_spaceport_or_industrial",
      "recipeType": "space_production_rush",
      "recipeParams": {
        "spaceRaceProductionMultiplier": 0.3,
        "cityProjectProductionRush": 350,
        "eurekaTechs": [
          "rocketry",
          "satellites"
        ]
      },
      "effectScopes": {
        "spaceRaceProductionMultiplier": "empire",
        "cityProjectProductionRush": "activation_city",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区或航天中心激活：解锁《火箭学》与《人造卫星》尤里卡；本城项目立即注入 350 生产力，全国太空竞赛速率 +30%。",
      "historicalBiography": "世界著名火箭专家与系统工程大师，中国航天之父与火箭之王，两弹一星功勋奖章获得者，工程控制论创建者。"
    },
    {
      "key": "alan_turing",
      "name": "阿兰·图灵",
      "englishName": "Alan Turing",
      "classKey": "scientist",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "campus_with_lab",
      "recipeType": "information_tech_burst",
      "recipeParams": {
        "eurekaTechs": [
          "computers",
          "telecommunications",
          "satellites"
        ],
        "instantScienceBurst": 800
      },
      "effectDescription": "在学院区域激活：立即获得《计算机》、《电信》与《卫星技术》三项未来先导科技的尤里卡提升，并获得 800 科技储备。",
      "historicalBiography": "英国数学家、逻辑学家、密码学家与计算机科学之父，设计破译“恩尼格玛”密码机，提出图灵机计算模型与图灵测试奠定人工智能基石。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantScienceBurst": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "john_von_neumann",
      "name": "约翰·冯·诺伊曼",
      "englishName": "John von Neumann",
      "classKey": "scientist",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 1540,
      "targetRequirement": "campus_with_lab",
      "recipeType": "information_tech_burst",
      "recipeParams": {
        "eurekaTechs": [
          "computers",
          "satellites"
        ],
        "instantScienceBurst": 850
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantScienceBurst": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在研究实验室激活：立即解锁《计算机》与《人造卫星》核心尤里卡，并注入 850 科技点储备。",
      "historicalBiography": "美籍匈牙利数学家与计算机科学家，‘计算机之父’与博弈论创始人，确立存储程序冯·诺伊曼计算机架构体系。"
    },
    {
      "key": "stephen_hawking",
      "name": "斯蒂芬·霍金",
      "englishName": "Stephen Hawking",
      "classKey": "scientist",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 1780,
      "targetRequirement": "campus_with_lab",
      "recipeType": "information_tech_burst",
      "recipeParams": {
        "eurekaTechs": [
          "lasers",
          "telecommunications"
        ],
        "instantScienceBurst": 950
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantScienceBurst": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在研究实验室激活：立即解锁信息时代前沿尤里卡，获得巨额 950 科技储备，并在全国广播科学文明曙光。",
      "historicalBiography": "英国著名理论物理学家与宇宙学家，提出黑洞霍金辐射学说与无边界宇宙理论，著有广为流传的《时间简史》。"
    },
    {
      "key": "imhotep",
      "name": "印何阗",
      "englishName": "Imhotep",
      "classKey": "engineer",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 60,
      "targetRequirement": "city_with_wonder_or_industrial",
      "recipeType": "wonder_production_rush",
      "recipeParams": {
        "wonderProductionRush": 90,
        "workshopCultureBonus": 0,
        "instantCulture": 0,
        "modernEraWonderRushBonus": 0
      },
      "effectScopes": {
        "wonderProductionRush": "activation_city",
        "workshopCultureBonus": "activation_city",
        "instantCulture": "empire",
        "modernEraWonderRushBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "2次激活次数。向当前城市在建的奇观立即注入 90 生产力（可直接秒建早期远古奇观）。",
      "historicalBiography": "古埃及第三王朝左塞尔法老宰相与大祭司，设计萨卡拉阶梯金字塔，人类历史上第一位被载入史册的建筑家与工程师。"
    },
    {
      "key": "hemiunu",
      "name": "海米昂",
      "englishName": "Hemiunu",
      "classKey": "engineer",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 75,
      "targetRequirement": "river_or_district_tile",
      "recipeType": "infrastructure_rush",
      "recipeParams": {
        "charge1ProductionRush": 80,
        "charge2RiverTileProductionBonus": 1,
        "charge2RiverTileGoldBonus": 1
      },
      "effectScopes": {
        "charge1ProductionRush": "activation_city",
        "charge2RiverTileProductionBonus": "activation_city",
        "charge2RiverTileGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "2次激活次数。第1次为城市注入80生产力推进工程奇观；第2次使所在城市全部沿河地块每周期产出 +1 生产力、+1 金币。",
      "historicalBiography": "古埃及第四王朝宰相兼皇家建筑总监，主持吉萨大金字塔（胡夫金字塔）设计与巨石建造工程，有吉萨G4000号陵墓雕像与确凿铭文铭刻其史实。"
    },
    {
      "key": "archimedes",
      "name": "阿基米德",
      "englishName": "Archimedes of Syracuse",
      "classKey": "engineer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 120,
      "targetRequirement": "city_center_or_industrial",
      "recipeType": "eureka_and_production_burst",
      "recipeParams": {
        "eurekaTechs": [
          "engineering",
          "machinery"
        ],
        "instantCityProduction": 100
      },
      "effectDescription": "在市中心或工业区激活：立即解锁《工程》与《机械》尤里卡；为本城在建工程注入 100 生产力加速。",
      "historicalBiography": "古希腊叙拉古杰出数学家、物理学家与机械发明家，发现浮力定律与杠杆原理，发明阿基米德螺旋泵与防御敌舰投石机械。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantCityProduction": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "vitruvius",
      "name": "马库斯·维特鲁威",
      "englishName": "Marcus Vitruvius Pollio",
      "classKey": "engineer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 150,
      "targetRequirement": "city_with_district",
      "recipeType": "district_production_permanent",
      "recipeParams": {
        "cityDistrictProductionBonus": 2,
        "wallCapacityBonus": 50
      },
      "effectDescription": "在建有区域的城市激活：该城市所有专业区域每周期产出额外 +2 生产力；所在城市城墙基础耐久上限 +50。",
      "historicalBiography": "古罗马著名建筑学家与军事工程师，著有《建筑十书》，确立“坚固、实用、美观”的古典建筑三要素永恒准则。",
      "effectScopes": {
        "cityDistrictProductionBonus": "activation_city",
        "wallCapacityBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "heron_of_alexandria",
      "name": "亚历山大的希罗",
      "englishName": "Heron of Alexandria",
      "classKey": "engineer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 180,
      "targetRequirement": "city_center_or_industrial",
      "recipeType": "eureka_and_production_burst",
      "recipeParams": {
        "eurekaTechs": [
          "machinery",
          "engineering"
        ],
        "instantCityProduction": 120
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantCityProduction": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在城市中心或工业区激活：立即解锁《机械》尤里卡；向所在城市直接注入 120 生产力储备。",
      "historicalBiography": "古希腊罗马时期著名数学家与机械工程师，发明人类第一台蒸汽动力汽转球（汽轮机雏形）与自动投币售水机。"
    },
    {
      "key": "du_shi",
      "name": "杜诗",
      "englishName": "Du Shi",
      "classKey": "engineer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 210,
      "targetRequirement": "city_with_district",
      "recipeType": "district_production_permanent",
      "recipeParams": {
        "cityDistrictProductionBonus": 3,
        "wallCapacityBonus": 50
      },
      "effectScopes": {
        "cityDistrictProductionBonus": "activation_city",
        "wallCapacityBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在特色区域激活：所在城市所有专业区域每周期额外 +3 生产力，城墙防御上限 +50。",
      "historicalBiography": "东汉南阳太守与发明家，创造利用水力鼓动冶铁风箱的‘水排’，使中国冶铁业生产效率与农具质量实现历史性飞跃。"
    },
    {
      "key": "apollodorus_damascus",
      "name": "大马士革的阿波罗多罗斯",
      "englishName": "Apollodorus of Damascus",
      "classKey": "engineer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "city_with_wonder_or_industrial",
      "recipeType": "wonder_production_rush",
      "recipeParams": {
        "wonderProductionRush": 180,
        "workshopCultureBonus": 0,
        "instantCulture": 0,
        "modernEraWonderRushBonus": 0
      },
      "effectScopes": {
        "wonderProductionRush": "activation_city",
        "workshopCultureBonus": "activation_city",
        "instantCulture": "empire",
        "modernEraWonderRushBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有在建奇观或工业区的城市激活：向正在建造的世界奇观注入 180 生产力。",
      "historicalBiography": "古罗马图拉真皇帝御用叙利亚希腊裔总建筑师，设计图拉真纪功柱、图拉真广场及多瑙河横跨大桥，罗马建筑工程巅峰。"
    },
    {
      "key": "li_chun",
      "name": "李春",
      "englishName": "Li Chun",
      "classKey": "engineer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 240,
      "targetRequirement": "river_or_district_tile",
      "recipeType": "infrastructure_rush",
      "recipeParams": {
        "charge1ProductionRush": 120,
        "charge2RiverTileProductionBonus": 1,
        "charge2RiverTileGoldBonus": 1
      },
      "effectDescription": "2次激活次数。第1次：立即完成本城水渠或注入 120 生产力用于城墙工程；第2次：使本城所有河流沿岸地块永久 +1 生产力、+1 金币。",
      "historicalBiography": "隋代著名工匠与桥梁总设计师，设计建造了世界上最早的敞肩式单孔圆弧大石桥——赵州桥，历经千百载风雨依然岿然屹立。",
      "effectScopes": {
        "charge1ProductionRush": "activation_city",
        "charge2RiverTileProductionBonus": "activation_city",
        "charge2RiverTileGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "bi_sheng",
      "name": "毕昇",
      "englishName": "Bi Sheng",
      "classKey": "engineer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "city_with_library_or_workshop",
      "recipeType": "printing_culture_science_burst",
      "recipeParams": {
        "eurekaTechs": [
          "printing"
        ],
        "cityPermanentCulture": 3,
        "cityPermanentScience": 2
      },
      "effectDescription": "在建有工坊或图书馆的城市激活：立即解锁《印刷术》科技尤里卡；该城永久每周期 +3 文化、+2 科技。",
      "historicalBiography": "北宋布衣发明家，首创胶泥活字印刷术，开创字印模翻压排版印刷新纪元，为世界文明典籍传播与启蒙奠定物质基石。",
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentCulture": "activation_city",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "al_jazari",
      "name": "阿勒·贾扎里",
      "englishName": "Ismail al-Jazari",
      "classKey": "engineer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 360,
      "targetRequirement": "city_center_or_industrial",
      "recipeType": "eureka_and_production_burst",
      "recipeParams": {
        "eurekaTechs": [
          "machinery",
          "apprenticeship"
        ],
        "instantCityProduction": 180
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantCityProduction": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区或城心激活：解锁《学徒制》尤里卡；向所在城市直接注入 180 生产力。",
      "historicalBiography": "美索不达米亚阿尔图克王朝伊斯兰博学工程师，著有《精巧机械装置之书》，发明曲柄连杆传动机构、凸轮轴与水力象钟。"
    },
    {
      "key": "su_song",
      "name": "苏颂",
      "englishName": "Su Song",
      "classKey": "engineer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "city_with_library_or_workshop",
      "recipeType": "printing_culture_science_burst",
      "recipeParams": {
        "eurekaTechs": [
          "machinery"
        ],
        "cityPermanentCulture": 3,
        "cityPermanentScience": 4
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentCulture": "activation_city",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在图书馆或作坊激活：解锁机械科技尤里卡；所在城市每周期永久 +3 文化、+4 科技。",
      "historicalBiography": "北宋哲宗时期杰出天文学家与机械工程师，研制水运仪象台，创造世界上最早由擒纵机构驱动的天文钟楼与自动假人报时器。"
    },
    {
      "key": "isidore_of_miletus",
      "name": "米利都的伊西多尔",
      "englishName": "Isidore of Miletus",
      "classKey": "engineer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 480,
      "targetRequirement": "city_with_wonder_or_industrial",
      "recipeType": "wonder_production_rush",
      "recipeParams": {
        "wonderProductionRush": 220,
        "workshopCultureBonus": 0,
        "instantCulture": 0,
        "modernEraWonderRushBonus": 0
      },
      "effectScopes": {
        "wonderProductionRush": "activation_city",
        "workshopCultureBonus": "activation_city",
        "instantCulture": "empire",
        "modernEraWonderRushBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有在建奇观的城市激活：向在建的世界奇观注入 220 生产力。",
      "historicalBiography": "拜占庭帝国查士丁尼大帝麾下两位首席数学家与物理学家之一，与安提莫斯共同设计君士坦丁堡圣索菲亚大教堂悬垂穹顶。"
    },
    {
      "key": "guo_shoujing",
      "name": "郭守敬",
      "englishName": "Guo Shoujing",
      "classKey": "engineer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 2,
      "baseThreshold": 540,
      "targetRequirement": "river_or_district_tile",
      "recipeType": "infrastructure_rush",
      "recipeParams": {
        "charge1ProductionRush": 150,
        "charge2RiverTileProductionBonus": 2,
        "charge2RiverTileGoldBonus": 1
      },
      "effectScopes": {
        "charge1ProductionRush": "activation_city",
        "charge2RiverTileProductionBonus": "activation_city",
        "charge2RiverTileGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "2次激活次数。第1次秒建工程（注入150产能）；第2次永久使所在城市全部沿河地块每周期 +2 生产力、+1 金币。",
      "historicalBiography": "元代著名水利工程与天文学大师，主持开凿京杭大运河北段通惠河，创制简仪与高表，测定《授时历》一年为365.2425天。"
    },
    {
      "key": "leonardo_da_vinci",
      "name": "列奥纳多·达·芬奇",
      "englishName": "Leonardo da Vinci",
      "classKey": "engineer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "city_with_wonder_or_industrial",
      "recipeType": "wonder_production_rush",
      "recipeParams": {
        "wonderProductionRush": 240,
        "workshopCultureBonus": 3
      },
      "effectDescription": "在正在建造奇观的城市或工业区激活：立即为当前在建奇观注入 240 生产力；所在城市工坊永久 +3 文化。",
      "historicalBiography": "意大利文艺复兴三杰之一，博学通才，手稿中精巧的机械水利设计、齿轮传动、飞行器与防御要塞图样远超时代数百年。",
      "effectScopes": {
        "wonderProductionRush": "activation_city",
        "workshopCultureBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "filippo_brunelleschi",
      "name": "菲利波·布鲁内莱斯基",
      "englishName": "Filippo Brunelleschi",
      "classKey": "engineer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 510,
      "targetRequirement": "city_with_wonder",
      "recipeType": "wonder_production_rush",
      "recipeParams": {
        "wonderProductionRush": 310,
        "instantCulture": 60
      },
      "effectDescription": "在正在建造奇观的城市激活：立即为当前在建奇观注入 310 生产力加速，并获得 60 文化储备。",
      "historicalBiography": "意大利文艺复兴早期建筑大师与透视法先驱，设计建造无地面脚手架支撑的佛罗伦萨圣母百花大教堂巨型八角形双层穹顶。",
      "effectScopes": {
        "wonderProductionRush": "activation_city",
        "instantCulture": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "mimar_sinan",
      "name": "米马尔·希南",
      "englishName": "Mimar Sinan",
      "classKey": "engineer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 600,
      "targetRequirement": "city_with_district",
      "recipeType": "district_amenity_housing_grant",
      "recipeParams": {
        "charges": 2,
        "chargeAmenity": 1,
        "chargeHousing": 1,
        "chargeProductionRush": 100
      },
      "effectDescription": "2次激活次数。每次为所在城市永久提供 +1 宜居度与 +1 住房容量，并使该城在建工程获得 100 生产力注入。",
      "historicalBiography": "奥斯曼帝国皇家首席建筑总监，跨越三代苏丹统治期，主持建造塞利米耶清真寺与苏莱曼尼耶清真寺等三百余座传世经典建筑。",
      "effectScopes": {
        "charges": "meta",
        "chargeAmenity": "activation_city",
        "chargeHousing": "activation_city",
        "chargeProductionRush": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "andrea_palladio",
      "name": "安德烈亚·帕拉第奥",
      "englishName": "Andrea Palladio",
      "classKey": "engineer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 690,
      "targetRequirement": "city_with_district",
      "recipeType": "amenity_and_tourism_burst",
      "recipeParams": {
        "cityAmenityBonus": 2,
        "cityHousingBonus": 2,
        "cityTourismBonus": 5
      },
      "effectScopes": {
        "cityAmenityBonus": "activation_city",
        "cityHousingBonus": "activation_city",
        "cityTourismBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在专业区域激活：所在城市永久提升 +2 宜居度、+2 住房容量与 +5 旅游业绩。",
      "historicalBiography": "意大利威尼斯共和国文艺复兴建筑巨匠，著有《建筑四书》，圆厅别墅与帕拉第奥母题深刻塑造西方三百年新古典主义建筑。"
    },
    {
      "key": "song_yingxing",
      "name": "宋应星",
      "englishName": "Song Yingxing",
      "classKey": "engineer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "city_with_library_or_workshop",
      "recipeType": "printing_culture_science_burst",
      "recipeParams": {
        "eurekaTechs": [
          "industrial",
          "metalcasting"
        ],
        "cityPermanentCulture": 4,
        "cityPermanentScience": 4
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "cityPermanentCulture": "activation_city",
        "cityPermanentScience": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在作坊激活：解锁《工业化》与《铸造》科技尤里卡；所在城市每周期永久 +4 文化、+4 科技。",
      "historicalBiography": "明末科学家与手工业工程师，编著《天工开物》，系统详述农业、纺织、制盐、采矿、冶金等手工业全套技术流程。"
    },
    {
      "key": "sebastien_vauban",
      "name": "塞巴斯蒂安·沃邦",
      "englishName": "Sébastien Le Prestre de Vauban",
      "classKey": "engineer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 870,
      "targetRequirement": "city_with_district",
      "recipeType": "district_production_permanent",
      "recipeParams": {
        "cityDistrictProductionBonus": 4,
        "wallCapacityBonus": 100
      },
      "effectScopes": {
        "cityDistrictProductionBonus": "activation_city",
        "wallCapacityBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在拥有区域的城市激活：所在城市城墙防御上限 +100，区域生产力 +4，全国攻城防御显著增强。",
      "historicalBiography": "法兰西波旁王朝路易十四首席军事工程大师与元帅，设计并加固三百座棱堡星形要塞，开创正规攻城平行壕包围战法。"
    },
    {
      "key": "james_watt",
      "name": "詹姆斯·瓦特",
      "englishName": "James Watt",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 650,
      "targetRequirement": "industrial_district",
      "recipeType": "free_building",
      "recipeParams": {
        "freeBuilding": "factory",
        "empireFactoriesProductionBonus": 2
      },
      "effectDescription": "在工业区激活：立即为此工业区免费建造一座工厂；全国所有工厂每周期额外产出 +2 生产力。",
      "historicalBiography": "苏格兰发明家与机械工程师，改良实用纽科门蒸汽机，大幅提高热效率，使工业动力摆脱水力地理限制，拉开工业革命序幕。",
      "effectScopes": {
        "freeBuilding": "activation_city",
        "empireFactoriesProductionBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "gustave_eiffel",
      "name": "古斯塔夫·埃菲尔",
      "englishName": "Gustave Eiffel",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "city_with_wonder_or_industrial",
      "recipeType": "wonder_production_rush",
      "recipeParams": {
        "wonderProductionRush": 480,
        "modernEraWonderRushBonus": 100
      },
      "effectDescription": "在建造奇观的城市激活：立即为当前在建奇观注入 480 生产力（若为现代或后续时代奇观，额外追加 100 生产力）。",
      "historicalBiography": "法国著名结构工程师与金属建造大师，设计建造巴黎埃菲尔铁塔与纽约自由女神像内部承重锻铁空间骨架桁梁。",
      "effectScopes": {
        "wonderProductionRush": "activation_city",
        "modernEraWonderRushBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "joseph_paxton",
      "name": "约瑟夫·帕克斯顿",
      "englishName": "Joseph Paxton",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 910,
      "targetRequirement": "city_with_entertainment_or_industrial",
      "recipeType": "amenity_and_tourism_burst",
      "recipeParams": {
        "cityAmenityBonus": 2,
        "cityHousingBonus": 2,
        "cityTourismBonus": 6
      },
      "effectDescription": "在建有娱乐中心或工业区的城市激活：所在城市永久 +2 宜居度、+2 住房、每周期 +6 旅游业绩。",
      "historicalBiography": "英国园艺家与建筑工程师，为1851年伦敦第一届世博会设计建造革命性的铸铁预制件与玻璃穹顶结构展馆——水晶宫。",
      "effectScopes": {
        "cityAmenityBonus": "activation_city",
        "cityHousingBonus": "activation_city",
        "cityTourismBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "isambard_kingdom_brunel",
      "name": "伊桑巴德·金厄姆·布鲁内尔",
      "englishName": "Isambard Kingdom Brunel",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1040,
      "targetRequirement": "city_center_or_industrial",
      "recipeType": "eureka_and_production_burst",
      "recipeParams": {
        "eurekaTechs": [
          "steam",
          "steel"
        ],
        "instantCityProduction": 250
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantCityProduction": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区激活：解锁《蒸汽动力》与《钢铁》尤里卡；向所在城市直接注入 250 工业生产力。",
      "historicalBiography": "英国维多利亚时代最卓越的土木机械工程师，设计大西部铁路、克利夫顿吊桥及世界首艘螺旋桨铁甲远洋客轮大东方号。"
    },
    {
      "key": "george_stephenson",
      "name": "乔治·斯蒂芬森",
      "englishName": "George Stephenson",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1170,
      "targetRequirement": "industrial_or_powerplant",
      "recipeType": "regional_power_boost",
      "recipeParams": {
        "targetCityIndustrialProductionBonus": 5,
        "targetCityIndustrialScienceBonus": 2,
        "regionalBonusDistance": 6,
        "regionalCityProductionBonus": 3,
        "regionalCityScienceBonus": 1,
        "empirePowerplantsProductionBonus": 0,
        "empirePowerplantsScienceBonus": 0
      },
      "effectScopes": {
        "targetCityIndustrialProductionBonus": "activation_city",
        "targetCityIndustrialScienceBonus": "activation_city",
        "regionalBonusDistance": "meta",
        "regionalCityProductionBonus": "regional_cities",
        "regionalCityScienceBonus": "regional_cities",
        "empirePowerplantsProductionBonus": "empire",
        "empirePowerplantsScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 6,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区激活：向 6 格半径内所有己方城市辐射提供 +3 生产力；所在城市工业区额外 +5 生产力。",
      "historicalBiography": "英国机械工程师，‘铁路之父’，制造世界首列实用蒸汽机车‘火箭号’并修建斯托克顿-达灵顿世界首条客运公用铁路。"
    },
    {
      "key": "thomas_edison",
      "name": "托马斯·爱迪生",
      "englishName": "Thomas Edison",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "industrial_or_powerplant",
      "recipeType": "regional_power_boost",
      "recipeParams": {
        "targetCityIndustrialProductionBonus": 6,
        "targetCityIndustrialScienceBonus": 4,
        "regionalBonusDistance": 9,
        "regionalCityProductionBonus": 4,
        "regionalCityScienceBonus": 2,
        "empirePowerplantsProductionBonus": 2,
        "empirePowerplantsScienceBonus": 2
      },
      "effectScopes": {
        "targetCityIndustrialProductionBonus": "activation_city",
        "targetCityIndustrialScienceBonus": "activation_city",
        "regionalBonusDistance": "meta",
        "regionalCityProductionBonus": "regional_cities",
        "regionalCityScienceBonus": "regional_cities",
        "empirePowerplantsProductionBonus": "empire",
        "empirePowerplantsScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 9,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区或电厂激活：向 9 格内所有城市辐射提供 +4 生产力、+2 科技；全国所有发电厂产出同步永久提升。",
      "historicalBiography": "美国传奇发明家与门洛帕克工业实验室创立者，持有一千余项专利，完善碳丝白炽灯泡、留声机、活动电影放映机与直流电网系统。"
    },
    {
      "key": "zhan_tianyou",
      "name": "詹天佑",
      "englishName": "Zhan Tianyou",
      "classKey": "engineer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 6,
      "charges": 2,
      "baseThreshold": 1430,
      "targetRequirement": "city_with_district",
      "recipeType": "district_amenity_housing_grant",
      "recipeParams": {
        "charges": 2,
        "chargeAmenity": 1,
        "chargeHousing": 2,
        "chargeProductionRush": 120
      },
      "effectScopes": {
        "charges": "meta",
        "chargeAmenity": "activation_city",
        "chargeHousing": "activation_city",
        "chargeProductionRush": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "2次激活次数。每次为所在城市提供 +1 宜居度与 +2 住房容量，并为在建工程注入 120 生产力。",
      "historicalBiography": "中国首位铁路工程总工程师，耶鲁大学毕业，主持独立勘探设计建造京张铁路，首创八达岭‘人’字形折返线与竖井开凿法。"
    },
    {
      "key": "nikola_tesla",
      "name": "尼古拉·特斯拉",
      "englishName": "Nikola Tesla",
      "classKey": "engineer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 950,
      "targetRequirement": "industrial_or_powerplant",
      "recipeType": "regional_power_boost",
      "recipeParams": {
        "targetCityIndustrialProductionBonus": 6,
        "targetCityIndustrialScienceBonus": 4,
        "regionalBonusDistance": 9,
        "regionalCityProductionBonus": 4,
        "regionalCityScienceBonus": 3,
        "empirePowerplantsProductionBonus": 2,
        "empirePowerplantsScienceBonus": 2
      },
      "effectDescription": "在工业区或发电厂激活：目标工业区每周期 +6 生产力、+4 科技；该工业区 9 格半径内所有己方城市每周期额外 +4 生产力、+3 科技；全国所有发电厂每周期 +2 生产力、+2 科技。",
      "historicalBiography": "塞尔维亚裔美籍发明家、电气工程师，交流电系统、多相电动机与无线电能量传输先驱，点亮现代电气化世界。",
      "effectScopes": {
        "targetCityIndustrialProductionBonus": "activation_city",
        "targetCityIndustrialScienceBonus": "activation_city",
        "regionalBonusDistance": "meta",
        "regionalCityProductionBonus": "regional_cities",
        "regionalCityScienceBonus": "regional_cities",
        "empirePowerplantsProductionBonus": "empire",
        "empirePowerplantsScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "wernher_von_braun",
      "name": "沃纳·冯·布劳恩",
      "englishName": "Wernher von Braun",
      "classKey": "engineer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 1130,
      "targetRequirement": "city_with_spaceport_or_industrial",
      "recipeType": "space_production_rush",
      "recipeParams": {
        "spaceRaceProductionMultiplier": 0.35,
        "cityProjectProductionRush": 300,
        "eurekaTechs": [
          "rocketry"
        ]
      },
      "effectDescription": "在建有航天中心或工业区的城市激活：为本城在建太空项目立即注入 300 生产力；全国太空竞赛项目生产速率永久提升 35%。",
      "historicalBiography": "空间探索先锋与火箭工程师，主导设计阿波罗计划土星5号超重型运载火箭，将人类首次成功送上月球表面。",
      "effectScopes": {
        "spaceRaceProductionMultiplier": "empire",
        "cityProjectProductionRush": "activation_city",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "henry_ford",
      "name": "亨利·福特",
      "englishName": "Henry Ford",
      "classKey": "engineer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 1310,
      "targetRequirement": "city_with_district",
      "recipeType": "district_production_permanent",
      "recipeParams": {
        "cityDistrictProductionBonus": 5,
        "wallCapacityBonus": 0
      },
      "effectScopes": {
        "cityDistrictProductionBonus": "activation_city",
        "wallCapacityBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区激活：所在城市专业区域每周期额外 +5 生产力；全国所有平民与工厂生产成本永久降低 15%。",
      "historicalBiography": "美国福特汽车公司创始人，发明流水线装配汽车大规模工业生产方式，制造普及福特T型车，深刻重塑现代流水线工业文明。"
    },
    {
      "key": "sergei_korolev",
      "name": "谢尔盖·科罗廖夫",
      "englishName": "Sergei Korolev",
      "classKey": "engineer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1490,
      "targetRequirement": "city_with_spaceport_or_industrial",
      "recipeType": "space_production_rush",
      "recipeParams": {
        "spaceRaceProductionMultiplier": 0.35,
        "cityProjectProductionRush": 400,
        "eurekaTechs": [
          "satellites",
          "rocketry"
        ]
      },
      "effectScopes": {
        "spaceRaceProductionMultiplier": "empire",
        "cityProjectProductionRush": "activation_city",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在航天基地或工业区激活：解锁卫星科技尤里卡；为在建太空竞赛项目注入 400 生产力，全国太空项目倍率 +35%。",
      "historicalBiography": "苏联功勋航天火箭与空间系统总设计师，领导成功发射人类首颗人造卫星斯普特尼克1号并送加加林进入太空，航天史传奇。"
    },
    {
      "key": "robert_goddard",
      "name": "罗伯特·戈达德",
      "englishName": "Robert H. Goddard",
      "classKey": "engineer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1670,
      "targetRequirement": "city_with_spaceport_or_industrial",
      "recipeType": "space_production_rush",
      "recipeParams": {
        "spaceRaceProductionMultiplier": 0.25,
        "cityProjectProductionRush": 300,
        "eurekaTechs": [
          "rocketry"
        ]
      },
      "effectScopes": {
        "spaceRaceProductionMultiplier": "empire",
        "cityProjectProductionRush": "activation_city",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区或航天中心激活：解锁《火箭学》尤里卡；为在建工程注入 300 生产力，太空项目生产力倍率 +25%。",
      "historicalBiography": "美国物理学家与现代液体燃料火箭发明家，1926年成功发射世界首枚液体燃料火箭，开创空间推进工程科学之先河。"
    },
    {
      "key": "jack_kilby",
      "name": "杰克·基尔比",
      "englishName": "Jack Kilby",
      "classKey": "engineer",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "city_center_or_industrial",
      "recipeType": "eureka_and_production_burst",
      "recipeParams": {
        "eurekaTechs": [
          "computers",
          "nanotech"
        ],
        "instantCityProduction": 300
      },
      "effectScopes": {
        "eurekaTechs": "empire",
        "instantCityProduction": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在工业区激活：立即解锁《计算机》与《纳米技术》尤里卡；向所在城市直接注入 300 生产力储备。",
      "historicalBiography": "美国德州仪器电气工程师与诺贝尔物理学奖得主，集成电路（微芯片）共同发明人，引爆微电子与现代硅基信息革命。"
    },
    {
      "key": "ea_nasir",
      "name": "厄·纳西尔",
      "englishName": "Ea-nasir",
      "classKey": "merchant",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 60,
      "targetRequirement": "city_center",
      "recipeType": "treasury_and_tile_annex",
      "recipeParams": {
        "instantGold": 150,
        "annexUnownedAdjacentTilesCount": 3
      },
      "effectScopes": {
        "instantGold": "empire",
        "annexUnownedAdjacentTilesCount": "city_and_empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在城市中心激活：立即获得 150 金币储备，并无偿吞并该城市相邻的 3 个中立地块圈入帝国版图。",
      "historicalBiography": "公元前18世纪乌尔城苏美尔铜矿贸易巨商，泥板上留存人类历史上已知最早的商业契约与客诉记录，铜矿跨海贸易先锋。"
    },
    {
      "key": "hanno_the_navigator",
      "name": "航海家汉诺",
      "englishName": "Hanno the Navigator",
      "classKey": "merchant",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 75,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "trade_capacity_and_vision",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "foreignRouteGoldBonus": 2,
        "revealTilesRadius": 8
      },
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "foreignRouteGoldBonus": "empire",
        "revealTilesRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 8,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在港口或商业中心激活：帝国贸易容量 +1，对外商路每周期额外 +2 金币，驱散周围 8 格迷雾。",
      "historicalBiography": "公元前5世纪迦太基航海统领与商业探索家，率六十艘帆船舰队穿过直布罗陀海峡远征非洲西海岸并建立沿海贸易商站。"
    },
    {
      "key": "marcus_licinius_crassus",
      "name": "克拉苏",
      "englishName": "Marcus Licinius Crassus",
      "classKey": "merchant",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 120,
      "targetRequirement": "city_center",
      "recipeType": "treasury_and_tile_annex",
      "recipeParams": {
        "instantGold": 180,
        "annexUnownedAdjacentTilesCount": 3,
        "envoys": 1
      },
      "effectDescription": "在市中心激活：立即获得 180 金币国库储备；并直接为本城免费购买兼并不相邻的 3 块优质相邻领土地块。 首次激活另获赠 1 名使节。",
      "historicalBiography": "罗马共和国前三头同盟之一，罗马史上首富，精明掌控银行业与不动产投机，以雄厚财力资助恺撒崛起。",
      "effectScopes": {
        "instantGold": "empire",
        "annexUnownedAdjacentTilesCount": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "fan_li",
      "name": "范蠡",
      "englishName": "Fan Li (Tao Zhugong)",
      "classKey": "merchant",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 150,
      "targetRequirement": "commercial_hub",
      "recipeType": "market_trade_boost",
      "recipeParams": {
        "instantGold": 220,
        "cityCommercialGoldMultiplier": 0.3,
        "tradeCapacityBonus": 1
      },
      "effectDescription": "在商业中心激活：国库立即获赠 220 金币；全国永久增加 +1 贸易路线容量；本城商业中心金币产出永久 +30%。",
      "historicalBiography": "春秋末期越国政治家、谋略家与富商，辅佐勾践灭吴后急流勇退，泛舟五湖化名陶朱公，三致千金皆散于贫民，被尊为“商圣”。",
      "effectScopes": {
        "instantGold": "empire",
        "cityCommercialGoldMultiplier": "activation_city",
        "tradeCapacityBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "sang_hongyang",
      "name": "桑弘羊",
      "englishName": "Sang Hongyang",
      "classKey": "merchant",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 180,
      "targetRequirement": "commercial_hub",
      "recipeType": "market_trade_boost",
      "recipeParams": {
        "instantGold": 250,
        "cityCommercialGoldMultiplier": 0.35,
        "tradeCapacityBonus": 1
      },
      "effectScopes": {
        "instantGold": "empire",
        "cityCommercialGoldMultiplier": "activation_city",
        "tradeCapacityBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 250 金币注资；本城商业金币产出永久提升 35%，帝国贸易路线容量 +1。",
      "historicalBiography": "西汉武帝时期杰出财政家与御史大夫，推行盐铁官营、均输平准法，为汉武帝远征匈奴与开拓疆土提供雄厚国家财政支撑。"
    },
    {
      "key": "lu_buwei",
      "name": "吕不韦",
      "englishName": "Lu Buwei",
      "classKey": "merchant",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 210,
      "targetRequirement": "commercial_hub",
      "recipeType": "patronage_culture_finance",
      "recipeParams": {
        "instantGold": 280,
        "cityPermanentCulture": 4,
        "bankGoldBonus": 3
      },
      "effectScopes": {
        "instantGold": "empire",
        "cityPermanentCulture": "activation_city",
        "bankGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 280 金币注资；所在城市每周期永久 +4 文化，银行金币产出额外 +3。",
      "historicalBiography": "战国末期卫国大商人与秦国文信侯、丞相，深谙‘奇货可居’投资之道，组织门客编撰巨著《吕氏春秋》，集先秦诸子大成。"
    },
    {
      "key": "herod_atticus",
      "name": "希罗德·阿提库斯",
      "englishName": "Herodes Atticus",
      "classKey": "merchant",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "commercial_hub",
      "recipeType": "treasury_grant_and_foreign_route_gold",
      "recipeParams": {
        "instantGold": 300,
        "foreignRouteGoldBonus": 2
      },
      "effectScopes": {
        "instantGold": "empire",
        "foreignRouteGoldBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 300 金币储备，全国所有对外贸易路线每周期额外 +2 金币。",
      "historicalBiography": "罗马帝国富可敌国的希腊贵族、修辞学家与慈善巨贾，在雅典卫城山麓独资建造阿提库斯音乐厅等大型公共文化建筑。"
    },
    {
      "key": "marco_polo",
      "name": "马可·波罗",
      "englishName": "Marco Polo",
      "classKey": "merchant",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "commercial_or_capital",
      "recipeType": "trade_capacity_grant",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "instantGold": 300
      },
      "effectDescription": "在商业中心或首都激活：帝国永久增加 +1 贸易路线容量；立即获得 300 金币国库储备。",
      "historicalBiography": "威尼斯商人旅行家，沿陆上丝绸之路抵达元大都，其东方见闻录激荡起欧洲对富庶东方的无尽向往与探险航海热潮。",
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "instantGold": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "ibn_battuta",
      "name": "伊本·白图泰",
      "englishName": "Ibn Battuta",
      "classKey": "merchant",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "trade_capacity_and_vision",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "foreignRouteGoldBonus": 3,
        "revealTilesRadius": 8
      },
      "effectDescription": "在商业中心或港口激活：全国永久增加 +1 贸易路线容量；国外商路每条额外 +3 金币；驱散本城周围 8 格迷雾。",
      "historicalBiography": "14世纪摩洛哥伟大旅行家，游历历经44个现代国家、行程逾11.7万公里，撰写《伊本·白图泰游记》，见证中古伊斯兰跨海贸易网络。",
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "foreignRouteGoldBonus": "empire",
        "revealTilesRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "mansa_musa",
      "name": "弗朗切斯科·达蒂尼",
      "englishName": "Francesco Datini",
      "classKey": "merchant",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 360,
      "targetRequirement": "commercial_or_capital",
      "recipeType": "trade_capacity_grant",
      "recipeParams": {
        "tradeCapacityBonus": 2,
        "instantGold": 500,
        "foreignRouteGoldBonus": 3,
        "revealTilesRadius": 0
      },
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "instantGold": "empire",
        "foreignRouteGoldBonus": "empire",
        "revealTilesRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心或首都激活：帝国贸易路线容量永久 +2；立即注入巨额 500 金币储备，对外商路每周期额外 +3 金币。",
      "historicalBiography": "中世纪晚期意大利普拉托商人与金融家，在阿维尼翁、比萨、佛罗伦萨等地建立商业网络，广泛使用汇票并完整保存了反映中世纪地中海商业活动的庞大私人账簿文书。",
      "canonicalAlias": "francesco_datini"
    },
    {
      "key": "liu_yan",
      "name": "刘晏",
      "englishName": "Liu Yan",
      "classKey": "merchant",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "commercial_hub",
      "recipeType": "treasury_grant_and_foreign_route_gold",
      "recipeParams": {
        "instantGold": 400,
        "foreignRouteGoldBonus": 3
      },
      "effectScopes": {
        "instantGold": "empire",
        "foreignRouteGoldBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 400 金币储备，全国所有对外商路每周期额外产出 +3 金币。",
      "historicalBiography": "唐代中叶杰出理财家与宰相，安史之乱后改革榷盐法与常平法，‘因民所急而税之，则国足用而人不知困’，复兴大唐财政。"
    },
    {
      "key": "enrico_dandolo",
      "name": "恩里科·丹多洛",
      "englishName": "Enrico Dandolo",
      "classKey": "merchant",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 480,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "water_route_gold_burst",
      "recipeParams": {
        "instantGold": 450,
        "waterRouteGoldBonus": 4,
        "cityCommercialGoldMultiplier": 0.25
      },
      "effectScopes": {
        "instantGold": "empire",
        "waterRouteGoldBonus": "empire",
        "cityCommercialGoldMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心或港口激活：获得 450 金币储备；全国所有水上商路每周期 +4 金币，所在城市商业产出倍率 +25%。",
      "historicalBiography": "威尼斯共和国第41任总督，虽高龄失明但足智多谋，策划第四次十字军东征夺取地中海关键港岛，建立威尼斯海洋商业帝国。"
    },
    {
      "key": "ahmad_ibn_fadlan",
      "name": "阿哈迈德·伊本·法德兰",
      "englishName": "Ahmad ibn Fadlan",
      "classKey": "merchant",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 540,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "trade_capacity_and_vision",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "foreignRouteGoldBonus": 3,
        "revealTilesRadius": 10
      },
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "foreignRouteGoldBonus": "empire",
        "revealTilesRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 10,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：帝国商路容量 +1，对外商路每条 +3 金币，驱散周围 10 格大范围陆海迷雾。",
      "historicalBiography": "10世纪阿拔斯王朝巴格达著名外交商贸特使，率庞大商队前往伏尔加保加尔王国，留存记载罗斯人与维京船葬的最早第一手文献。"
    },
    {
      "key": "jakob_fugger",
      "name": "雅各布·富格尔",
      "englishName": "Jakob Fugger",
      "classKey": "merchant",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "commercial_hub",
      "recipeType": "treasury_grant_and_foreign_route_gold",
      "recipeParams": {
        "instantGold": 350,
        "foreignRouteGoldBonus": 4,
        "commercialSpecialistGoldBonus": 1
      },
      "effectDescription": "在商业中心激活：立即获得 350 金币国库储备；全国每条连通外国的国际商路每周期额外提供 +4 金币。 激活城市每名实际指派的商业专家额外 +1 金币。",
      "historicalBiography": "德意志奥格斯堡金融巨擘，号称“富格尔大帝”，资助哈布斯堡王朝皇选与教廷财政，垄断欧洲铜矿与水银贸易。",
      "effectScopes": {
        "instantGold": "empire",
        "foreignRouteGoldBonus": "empire",
        "commercialSpecialistGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "cosimo_de_medici",
      "name": "科西莫·德·美第奇",
      "englishName": "Cosimo de' Medici",
      "classKey": "merchant",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 510,
      "targetRequirement": "city_with_bank_or_commercial",
      "recipeType": "patronage_culture_finance",
      "recipeParams": {
        "instantGold": 300,
        "cityPermanentCulture": 4,
        "bankGoldBonus": 3
      },
      "effectDescription": "在建有银行的商业中心激活：立即获得 300 金币；本城永久每周期 +4 文化，全国所有银行每周期额外产出 +3 金币。",
      "historicalBiography": "佛罗伦萨共和国实际统治者与美第奇银行掌舵人，资助多纳泰罗、布鲁内莱斯基等艺术巨匠，开创美第奇家族赞助文艺复兴的辉煌盛世。",
      "effectScopes": {
        "instantGold": "empire",
        "cityPermanentCulture": "activation_city",
        "bankGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "shen_wansan",
      "name": "沈万三",
      "englishName": "Shen Wansan",
      "classKey": "merchant",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 600,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "water_route_gold_burst",
      "recipeParams": {
        "instantGold": 450,
        "waterRouteGoldBonus": 5,
        "cityCommercialGoldMultiplier": 0.25
      },
      "effectDescription": "在港口或商业中心激活：立即向国库注入 450 金币；全国所有水上贸易路线每周期额外 +5 金币；本城金币产出 +25%。",
      "historicalBiography": "元末明初江南首富与通商巨贾，据周庄通达京杭大运河与海外开展贸易，“资巨万万，田产遍天下”，传说明太祖筑南京城其助建三之一。",
      "effectScopes": {
        "instantGold": "empire",
        "waterRouteGoldBonus": "empire",
        "cityCommercialGoldMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "thomas_gresham",
      "name": "托马斯·格雷沙姆",
      "englishName": "Sir Thomas Gresham",
      "classKey": "merchant",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 690,
      "targetRequirement": "commercial_with_exchange",
      "recipeType": "treasury_interest_grant",
      "recipeParams": {
        "instantGold": 550,
        "empireExchangeGoldBonus": 5,
        "goldDiscountPurchaseCivilians": 0.2
      },
      "effectScopes": {
        "instantGold": "empire",
        "empireExchangeGoldBonus": "empire",
        "goldDiscountPurchaseCivilians": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：注入 550 金币；全国证券交易所每周期产出 +5 金币，金币购买平民享受 20% 永久折扣。",
      "historicalBiography": "都铎王朝英格兰金融家与王室顾问，伦敦皇家交易所与格雷沙姆学院创立者，经济学‘劣币驱逐良币（格雷沙姆法则）’首倡者。"
    },
    {
      "key": "pan_qiguan",
      "name": "潘启官",
      "englishName": "Pan Qiguan (Puankhequa)",
      "classKey": "merchant",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "water_route_gold_burst",
      "recipeParams": {
        "instantGold": 600,
        "waterRouteGoldBonus": 5,
        "cityCommercialGoldMultiplier": 0.3
      },
      "effectScopes": {
        "instantGold": "empire",
        "waterRouteGoldBonus": "empire",
        "cityCommercialGoldMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心或港口激活：获得 600 金币储备；全国水上商路每条额外 +5 金币，本城商业产出提升 30%。",
      "historicalBiography": "清代广州十三行同文行行商领袖与总商，精通对外贸易与多国外语，主持垄断西方对华海上丝绸之路与全球茶叶贸易。"
    },
    {
      "key": "cornelis_de_graeff",
      "name": "科内利斯·德·赫拉夫",
      "englishName": "Cornelis de Graeff",
      "classKey": "merchant",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 870,
      "targetRequirement": "commercial_or_capital",
      "recipeType": "trade_capacity_grant",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "instantGold": 500,
        "foreignRouteGoldBonus": 4,
        "revealTilesRadius": 0
      },
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "instantGold": "empire",
        "foreignRouteGoldBonus": "empire",
        "revealTilesRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：帝国贸易容量 +1，获得 500 金币储备，对外商路每周期额外 +4 金币。",
      "historicalBiography": "荷兰黄金时代阿姆斯特朗执政官与荷兰东印度公司（VOC）核心管理者，主导阿姆斯特丹全球金融资本与远洋贸易帝国扩张。"
    },
    {
      "key": "john_d_rockefeller",
      "name": "约翰·D·洛克菲勒",
      "englishName": "John D. Rockefeller",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 650,
      "targetRequirement": "oil_city_or_exchange",
      "recipeType": "oil_improvement_and_exchange_double",
      "recipeParams": {
        "oilResourceProductionBonus": 2,
        "oilResourceGoldBonus": 4,
        "cityExchangeGoldMultiplier": 1
      },
      "effectDescription": "在拥有石油或证券交易所的城市激活：全国所有改良的石油资源每处额外 +2 生产力、+4 金币；本城证券交易所金币产出翻倍（+100%）。",
      "historicalBiography": "美孚标准石油公司创办人，现代工业托拉斯企业组织模式开创者，人类史上首位亿万富翁，晚年专注于公益医疗与教育慈善。",
      "effectScopes": {
        "oilResourceProductionBonus": "empire",
        "oilResourceGoldBonus": "empire",
        "cityExchangeGoldMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "sheng_xuanhuai",
      "name": "盛宣怀",
      "englishName": "Sheng Xuanhuai",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "project_production_and_transport_routes",
      "recipeParams": {
        "instantGold": 400,
        "cityProjectProductionBurst": 150,
        "domesticRouteProductionBonus": 2,
        "domesticRouteGoldBonus": 3,
        "civilianUnitUpkeepDiscount": 0.5
      },
      "effectDescription": "在商业中心或港口激活：立即获得 400 金币与 150 生产力注入本城项目；全国所有国内贸易路线每周期额外 +2 生产力、+3 金币；所有平民及运输支援单位维护费减免 50%。",
      "historicalBiography": "晚清洋务运动核心实业领袖，主持创办轮船招商局、汉阳铁厂、中国通商银行及南北洋大学堂，被誉为“中国近代实业之父”。",
      "effectScopes": {
        "instantGold": "empire",
        "cityProjectProductionBurst": "activation_city",
        "domesticRouteProductionBonus": "empire",
        "domesticRouteGoldBonus": "empire",
        "civilianUnitUpkeepDiscount": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "andrew_carnegie",
      "name": "安德鲁·卡内基",
      "englishName": "Andrew Carnegie",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 910,
      "targetRequirement": "industrial_or_commercial",
      "recipeType": "steel_industrial_gold_grant",
      "recipeParams": {
        "instantGold": 500,
        "empireMinesProductionBonus": 1,
        "empireCityCultureBonus": 1
      },
      "effectDescription": "在工业区或商业中心激活：立即向国库注入 500 金币；全国所有采矿场地块每格 +1 生产力；全国每座城市每周期额外 +1 文化。",
      "historicalBiography": "美籍苏格兰钢铁工业巨擘，创立卡内基钢铁公司推动匹兹堡成为世界钢都，践行财富散财理念，捐建全球逾2500座免费公共图书馆。",
      "effectScopes": {
        "instantGold": "empire",
        "empireMinesProductionBonus": "empire",
        "empireCityCultureBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "nathan_mayer_rothschild",
      "name": "内森·迈尔·罗斯柴尔德",
      "englishName": "Nathan Mayer Rothschild",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1040,
      "targetRequirement": "commercial_hub",
      "recipeType": "corporate_finance_production",
      "recipeParams": {
        "instantGold": 750,
        "allCommercialHubsProductionBonus": 2,
        "bankGoldBonus": 5
      },
      "effectScopes": {
        "instantGold": "empire",
        "allCommercialHubsProductionBonus": "empire",
        "bankGoldBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：注入 750 金币；全国所有商业中心每周期额外 +2 生产力，所有银行产出 +5 金币。",
      "historicalBiography": "罗斯柴尔德伦敦家族创始人，利用滑铁卢战役情报网建立跨国政府债券承销网络，开创19世纪国际现代投资银行业态。"
    },
    {
      "key": "cornelius_vanderbilt",
      "name": "科尼利厄斯·范德比尔特",
      "englishName": "Cornelius Vanderbilt",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1170,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "project_production_and_transport_routes",
      "recipeParams": {
        "instantGold": 600,
        "cityProjectProductionBurst": 200,
        "domesticRouteProductionBonus": 3,
        "domesticRouteGoldBonus": 4,
        "civilianUnitUpkeepDiscount": 0.5
      },
      "effectScopes": {
        "instantGold": "empire",
        "cityProjectProductionBurst": "activation_city",
        "domesticRouteProductionBonus": "empire",
        "domesticRouteGoldBonus": "empire",
        "civilianUnitUpkeepDiscount": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 600 金币与 200 产能；国内商路每周期额外 +3 生产力、+4 金币，平民维护费减免 50%。",
      "historicalBiography": "美国19世纪航运与铁路垄断巨头，从蒸汽轮船起家整合纽约中央铁路网并建造大中央总站，镀金时代资本主义巨擘。"
    },
    {
      "key": "j_p_morgan",
      "name": "J.P. 摩根",
      "englishName": "J. Pierpont Morgan",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "commercial_with_exchange",
      "recipeType": "treasury_interest_grant",
      "recipeParams": {
        "instantGold": 800,
        "empireExchangeGoldBonus": 8,
        "goldDiscountPurchaseCivilians": 0.25
      },
      "effectScopes": {
        "instantGold": "empire",
        "empireExchangeGoldBonus": "empire",
        "goldDiscountPurchaseCivilians": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在证券交易所激活：获得 800 金币注资；全国证券交易所每周期产出 +8 金币，金币购买享有 25% 永久折扣。",
      "historicalBiography": "华尔街金融霸主，主持重组美国钢铁公司与通用电气等工业巨头，两度出面稳定美国金融恐慌，主导现代公司金融秩序。"
    },
    {
      "key": "hu_xueyan",
      "name": "胡雪岩",
      "englishName": "Hu Xueyan",
      "classKey": "merchant",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 6,
      "charges": 1,
      "baseThreshold": 1430,
      "targetRequirement": "commercial_hub",
      "recipeType": "patronage_culture_finance",
      "recipeParams": {
        "instantGold": 650,
        "cityPermanentCulture": 5,
        "bankGoldBonus": 4
      },
      "effectScopes": {
        "instantGold": "empire",
        "cityPermanentCulture": "activation_city",
        "bankGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 650 金币储备；所在城市每周期永久 +5 文化，银行金币产出额外 +4。",
      "historicalBiography": "清末著名徽商红顶商人，协助左宗棠西征收复新疆筹措军饷与西药，创设胡庆余堂中药国药号，兼具深厚政商财智。"
    },
    {
      "key": "andrew_mellon",
      "name": "安德鲁·梅隆",
      "englishName": "Andrew Mellon",
      "classKey": "merchant",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 950,
      "targetRequirement": "commercial_with_exchange",
      "recipeType": "treasury_interest_grant",
      "recipeParams": {
        "instantGold": 700,
        "empireExchangeGoldBonus": 6,
        "goldDiscountPurchaseCivilians": 0.2
      },
      "effectDescription": "在建有证券交易所的商业中心激活：立即获得 700 金币；全国所有证券交易所每周期产出 +6 金币；用金币购买平民单位费用减免 20%。",
      "historicalBiography": "美国银行家、实业家与长期财政部长，投资阿尔科铝业、海湾石油与梅隆国家银行，创办华盛顿国家美术馆并捐赠全部私人藏画。",
      "effectScopes": {
        "instantGold": "empire",
        "empireExchangeGoldBonus": "empire",
        "goldDiscountPurchaseCivilians": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "shibusawa_eiichi",
      "name": "涩泽荣一",
      "englishName": "Shibusawa Eiichi",
      "classKey": "merchant",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 1130,
      "targetRequirement": "commercial_hub",
      "recipeType": "corporate_finance_production",
      "recipeParams": {
        "instantGold": 800,
        "allCommercialHubsProductionBonus": 2,
        "bankGoldBonus": 4
      },
      "effectDescription": "在商业中心激活：立即获赠 800 金币；全国所有商业中心每周期产出 +2 生产力，所有银行产出额外 +4 金币。",
      "historicalBiography": "日本明治维新至大正时期实业家，确立《论语》与算盘并重伦理，创办日本第一国立银行、东京证券交易所等五百余家现代股份制企业，被称为“日本资本主义之父”。",
      "effectScopes": {
        "instantGold": "empire",
        "allCommercialHubsProductionBonus": "empire",
        "bankGoldBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "henry_j_kaiser",
      "name": "亨利·J·凯撒",
      "englishName": "Henry J. Kaiser",
      "classKey": "merchant",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 1310,
      "targetRequirement": "commercial_or_harbor",
      "recipeType": "project_production_and_transport_routes",
      "recipeParams": {
        "instantGold": 700,
        "cityProjectProductionBurst": 250,
        "domesticRouteProductionBonus": 3,
        "domesticRouteGoldBonus": 4,
        "civilianUnitUpkeepDiscount": 0.5
      },
      "effectScopes": {
        "instantGold": "empire",
        "cityProjectProductionBurst": "activation_city",
        "domesticRouteProductionBonus": "empire",
        "domesticRouteGoldBonus": "empire",
        "civilianUnitUpkeepDiscount": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在港口或商业中心激活：获得 700 金币与 250 工业产能；国内贸易路线产出增加，全国平民与后勤维护费减免 50%。",
      "historicalBiography": "现代美国工业巨擘与造船大王，二战期间通过模块化预制装配将万吨级‘自由轮’建造周期缩短至数天，奠定同盟国海运后勤基础。"
    },
    {
      "key": "enrico_mattei",
      "name": "恩里科·马特伊",
      "englishName": "Enrico Mattei",
      "classKey": "merchant",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1490,
      "targetRequirement": "oil_city_or_exchange",
      "recipeType": "oil_improvement_and_exchange_double",
      "recipeParams": {
        "oilResourceProductionBonus": 3,
        "oilResourceGoldBonus": 5,
        "cityExchangeGoldMultiplier": 1
      },
      "effectScopes": {
        "oilResourceProductionBonus": "empire",
        "oilResourceGoldBonus": "empire",
        "cityExchangeGoldMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在石油设施或交易所激活：全国所有石油改良每周期额外 +3 生产力、+5 金币；所在城市证券交易所产出翻倍。",
      "historicalBiography": "意大利埃尼石油集团（ENI）开创者，打破西方七大跨国石油公司（七姐妹）垄断，提出对第三世界产油国50/50乃至75/25合作协议。"
    },
    {
      "key": "konosuke_matsushita",
      "name": "松下幸之助",
      "englishName": "Konosuke Matsushita",
      "classKey": "merchant",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1670,
      "targetRequirement": "commercial_hub",
      "recipeType": "corporate_finance_production",
      "recipeParams": {
        "instantGold": 850,
        "allCommercialHubsProductionBonus": 3,
        "bankGoldBonus": 5
      },
      "effectScopes": {
        "instantGold": "empire",
        "allCommercialHubsProductionBonus": "empire",
        "bankGoldBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：获得 850 金币；全国所有商业中心每周期额外 +3 生产力，所有银行额外产出 +5 金币。",
      "historicalBiography": "日本松下电器创始人，被誉为‘经营之神’，倡导‘自来水哲学’让高品质工业产品普惠大众，创立事业部制与现代管理文化。"
    },
    {
      "key": "sam_walton",
      "name": "萨姆·沃尔顿",
      "englishName": "Sam Walton",
      "classKey": "merchant",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "commercial_hub",
      "recipeType": "corporate_finance_production",
      "recipeParams": {
        "instantGold": 950,
        "allCommercialHubsProductionBonus": 3,
        "bankGoldBonus": 6
      },
      "effectScopes": {
        "instantGold": "empire",
        "allCommercialHubsProductionBonus": "empire",
        "bankGoldBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      },
      "effectDescription": "在商业中心激活：注入大额 950 金币储备；全国所有商业中心每周期额外 +3 生产力，所有银行额外 +6 金币。",
      "historicalBiography": "沃尔玛百货创立者，以卫星物流通信链、平价天天低价模式建立世界最大跨国零售供应链帝国，深刻革新现代商业消费模式。"
    },
    {
      "key": "sargon_of_akkad",
      "name": "萨尔贡大帝",
      "englishName": "Sargon of Akkad",
      "classKey": "general",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 60,
      "targetRequirement": "land_military_unit_or_barracks",
      "aura": {
        "applicableEras": [
          0,
          1
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_combat_annihilation",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "enemyCitySiegeCombatBonus": 4,
        "warKillGoldBonus": 10
      },
      "effectDescription": "常态光环：2格范围内远古与古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：目标陆军战力永久 +6，攻城战力额外 +4，击杀敌军掠夺 10 金币战利品。",
      "historicalBiography": "阿卡德帝国建立者，人类历史上首个已知庞大帝国的开创者，率先建立由王权统一指挥的常备军体制，奠定美索不达米亚青铜时代军事霸权。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "enemyCitySiegeCombatBonus": "target_unit",
        "warKillGoldBonus": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "ramesses_ii",
      "name": "阿蒙涅姆赫卜",
      "englishName": "Amenemheb",
      "classKey": "general",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 75,
      "targetRequirement": "cavalry_or_melee_unit",
      "aura": {
        "applicableEras": [
          0,
          1
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_speed_and_attack_burst",
      "recipeParams": {
        "durationCycles": 6,
        "targetAndAdjacentMovement": 1,
        "targetAndAdjacentAttackStrength": 4
      },
      "effectDescription": "常态光环：2格范围内远古与古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：卡迭石战车冲击——目标部队及其1格相邻友军获得机动力 +1 与进攻战力 +4 爆发，持续 6 周期（120秒）。",
      "historicalBiography": "古埃及新王国第十八王朝军官与将军，随图特摩斯三世参加叙利亚战役，其在底比斯陵墓（TT85）自传中记载了在美吉多前哨战及叙利亚作战中的英勇战功。",
      "effectScopes": {
        "durationCycles": "meta",
        "targetAndAdjacentMovement": "target_unit_and_adjacent",
        "targetAndAdjacentAttackStrength": "target_unit_and_adjacent"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      },
      "canonicalAlias": "amenemheb"
    },
    {
      "key": "sun_tzu",
      "name": "孙武",
      "englishName": "Sun Tzu",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 120,
      "targetRequirement": "land_military_unit_or_barracks",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_promotion_and_academy_culture",
      "recipeParams": {
        "targetPromotion": 1,
        "targetFullHeal": true,
        "barracksInitialXpBonus": 5,
        "barracksCultureBonus": 2
      },
      "effectDescription": "常态光环：2格范围内远古、古典与中古陆军战力 +5，移动力 +1（同类不叠加）。退役激活：使目标陆军满血恢复并免费获得 1 次晋升；军营所在城新编陆军永久获赠 +5 初始经验与 +2 文化。",
      "historicalBiography": "春秋末期齐国人，吴国上将军兼杰出军事思想家，所著《孙子兵法》十三篇总结战争规律与战略计谋，被尊为百代兵家之祖与东方兵学圣典。",
      "effectScopes": {
        "targetPromotion": "target_unit",
        "targetFullHeal": "target_unit",
        "barracksInitialXpBonus": "activation_city",
        "barracksCultureBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "hannibal_barca",
      "name": "汉尼拔·巴卡",
      "englishName": "Hannibal Barca",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 150,
      "targetRequirement": "cavalry_or_melee_unit",
      "aura": {
        "applicableEras": [
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "ignoreTerrainPenalty": true,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_speed_and_attack_burst",
      "recipeParams": {
        "durationCycles": 6,
        "targetAndAdjacentMovement": 1,
        "targetAndAdjacentAttackStrength": 4
      },
      "effectDescription": "常态光环：2格范围内古典与中古陆军战力 +5，跨越河流与丘陵无移动减速惩罚（同类不叠加）。退役激活：目标单位及其相邻友军获得 +1 移动力与 +4 进攻战力（持续6个经济周期/120秒）。",
      "historicalBiography": "迦太基名将与军事统帅，第二次布匿战争率孤军翻越阿尔卑斯山奇袭意大利本土，坎尼会战以双翼反包抄歼灭八个罗马军团，古典机动战典范。",
      "effectScopes": {
        "durationCycles": "meta",
        "targetAndAdjacentMovement": "target_unit_and_adjacent",
        "targetAndAdjacentAttackStrength": "target_unit_and_adjacent"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "cavalry"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "refresh_duration"
      }
    },
    {
      "key": "bai_qi",
      "name": "白起",
      "englishName": "Bai Qi",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 180,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "flankBonusMultiplier": 0.5,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_combat_annihilation",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "enemyCitySiegeCombatBonus": 4,
        "warKillGoldBonus": 10
      },
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，夹击包抄战力加成提升 50%（同类不叠加）。退役激活：目标单位战力永久 +6，并在对城攻坚战中获得 +4 破城战力。",
      "historicalBiography": "战国时期秦国名将，战国四名将之首，长平之战全歼赵军主力，伊阙之战大破魏韩联军，一生平生大小七十余战未尝一败，受封武安君。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "enemyCitySiegeCombatBonus": "target_unit",
        "warKillGoldBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "scipio_africanus",
      "name": "大西庇阿",
      "englishName": "Scipio Africanus",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 210,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "cavalryCombatBonus": 2,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_corps_synergy",
      "recipeParams": {
        "targetUnitsHeal": 30,
        "targetArmySpeedBonus": 1,
        "defensiveLoyaltyBonus": 3,
        "durationCycles": 4,
        "radius": 2,
        "levyCostDiscount": 0.25
      },
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，骑兵协同作战额外 +2 战力（同类不叠加）。退役激活：周围 2 格内所有友方陆军恢复 30 生命值并获得 +1 移动力（持续 4 周期）。 退役另永久降低城邦征用费用 25%，与其他征用折扣取最高项。",
      "historicalBiography": "罗马共和国执政官与统帅，扎马战役中以精妙骑兵两翼包抄战法彻底击败汉尼拔，终结第二次布匿战争，赢得“大西庇阿”尊号。",
      "effectScopes": {
        "targetUnitsHeal": "target_units_within_radius",
        "targetArmySpeedBonus": "target_units_within_radius",
        "defensiveLoyaltyBonus": "activation_city",
        "durationCycles": "meta",
        "radius": "meta",
        "levyCostDiscount": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 4,
        "radius": 2,
        "stackingPolicy": "refresh_duration"
      }
    },
    {
      "key": "alexander_the_great",
      "name": "帕曼纽",
      "englishName": "Parmenion",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "cavalry_or_melee_unit",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_speed_and_attack_burst",
      "recipeParams": {
        "durationCycles": 6,
        "targetAndAdjacentMovement": 1,
        "targetAndAdjacentAttackStrength": 5
      },
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：伙伴骑兵破阵——目标部队及相邻友军机动力 +1、进攻战力 +5，持续 6 周期（120秒）。",
      "historicalBiography": "马其顿王国资深将领，腓力二世与亚历山大大帝时期的首席副帅，在格拉尼库斯河战役、伊苏斯战役与高加米拉战役中指挥联军骑兵与左翼部队。",
      "effectScopes": {
        "durationCycles": "meta",
        "targetAndAdjacentMovement": "target_unit_and_adjacent",
        "targetAndAdjacentAttackStrength": "target_unit_and_adjacent"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      },
      "canonicalAlias": "parmenion"
    },
    {
      "key": "julius_caesar",
      "name": "马尔库斯·克劳狄·马塞卢斯",
      "englishName": "Marcus Claudius Marcellus",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 270,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_corps_synergy",
      "recipeParams": {
        "targetUnitsHeal": 30,
        "targetArmySpeedBonus": 1,
        "defensiveLoyaltyBonus": 3,
        "durationCycles": 4,
        "radius": 2
      },
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：罗马军团筑垒防卫——2格范围内友军恢复 30 生命值且机动力 +1 持续 4 周期，防守时城市忠诚度 +3。",
      "historicalBiography": "罗马共和国将领与执政官，获誉“罗马之剑”。在第二次布匿战争中直面汉尼拔，并在阿基米德协助城防的叙拉古围城战中攻破要塞叙拉古。",
      "effectScopes": {
        "targetUnitsHeal": "target_units_in_radius",
        "targetArmySpeedBonus": "target_units_in_radius",
        "defensiveLoyaltyBonus": "activation_city",
        "durationCycles": "meta",
        "radius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 4,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      },
      "canonicalAlias": "marcus_claudius_marcellus"
    },
    {
      "key": "chandragupta_maurya",
      "name": "诃利色那",
      "englishName": "Harishena",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 6,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "cavalry_or_infantry_unit",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ambush_speed_bonus",
      "recipeParams": {
        "targetUnitCombatBonus": 5,
        "targetUnitMovementBonus": 1,
        "ignoreZoc": true
      },
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：目标部队战力永久 +5、移动力 +1，且行动无视敌方控制区（ZOC）。",
      "historicalBiography": "印度笈多帝国宫廷诗人兼高级官员，历任和战大臣（Sandhivigrahika）并兼领军事官阶（Mahadandanayaka），在著名的安拉阿巴德阿育王石柱上撰写了记录沙姆陀罗笈多征战伟绩的铭文颂辞。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "targetUnitMovementBonus": "target_unit",
        "ignoreZoc": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      },
      "canonicalAlias": "harishena"
    },
    {
      "key": "cyrus_the_great",
      "name": "哈尔帕哥斯",
      "englishName": "Harpagus",
      "classKey": "general",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 7,
      "charges": 1,
      "baseThreshold": 330,
      "targetRequirement": "land_military_unit_or_barracks",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_promotion_and_academy_culture",
      "recipeParams": {
        "targetPromotion": 1,
        "targetFullHeal": true,
        "barracksInitialXpBonus": 6,
        "barracksCultureBonus": 2
      },
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：不死军誓约——目标陆军部队满血恢复并免费晋升 1 次；所在城军营新编部队初始经验 +6、文化 +2。",
      "historicalBiography": "米底贵族与居鲁士大帝麾下重要将领。在波斯帝国建立过程中统领大军平定小亚细亚诸城邦，以使用土坡堆垒攻破围城工事著称于希罗多德记载。",
      "effectScopes": {
        "targetPromotion": "target_unit",
        "targetFullHeal": "target_unit",
        "barracksInitialXpBonus": "activation_city",
        "barracksCultureBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      },
      "canonicalAlias": "harpagus"
    },
    {
      "key": "joan_of_arc",
      "name": "圣女贞德",
      "englishName": "Joan of Arc",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "defending_city_or_unit",
      "aura": {
        "applicableEras": [
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "defenseBonus": 3,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_loyalty_wall_heal_and_faith",
      "recipeParams": {
        "cityLoyaltyRestoreMax": true,
        "cityWallRepairHp": 100,
        "instantFaith": 120
      },
      "effectDescription": "常态光环：2格范围内中古与文艺复兴陆军战力 +5，要塞防守战力额外 +3（同类不叠加）。退役激活：目标城市忠诚度立即补满，城墙恢复 100 生命值，并获得 120 信仰储备。",
      "historicalBiography": "英法百年战争中法国民族女英雄，以神启信仰重振法军士气，率军解奥尔良之围击溃英军，护送查理七世于兰斯主教座堂加冕。",
      "effectScopes": {
        "cityLoyaltyRestoreMax": "activation_city",
        "cityWallRepairHp": "activation_city",
        "instantFaith": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "li_jing",
      "name": "李靖",
      "englishName": "Li Jing (Duke of Wei)",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "cavalry_or_infantry_unit",
      "aura": {
        "applicableEras": [
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "cavalrySpeedBonus": 1,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ambush_speed_bonus",
      "recipeParams": {
        "targetUnitCombatBonus": 5,
        "targetUnitMovementBonus": 1,
        "ignoreZoc": true
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，骑兵移动力额外 +1（同类不叠加）。退役激活：目标部队永久 +5 战力，+1 移动力，并获得无视敌方控制区（ZOC）穿行能力。",
      "historicalBiography": "唐代初年开国名将与军事家，凌烟阁二十四功臣之一，南平萧铣、辅公祏，北灭东突厥夜袭定襄，西破吐谷浑，战法出奇制胜，封卫国公。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "targetUnitMovementBonus": "target_unit",
        "ignoreZoc": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "cavalry"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "richard_the_lionheart",
      "name": "理查一世（狮心王）",
      "englishName": "Richard the Lionheart",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 360,
      "targetRequirement": "melee_or_cavalry_unit",
      "aura": {
        "applicableEras": [
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "fortressDefenseBonus": 4,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_crusader_zeal",
      "recipeParams": {
        "targetUnitAttackStrengthBonus": 8,
        "targetUnitsHeal": 25,
        "instantFaith": 100
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，驻扎防御时额外 +4 战力（同类不叠加）。退役激活：目标单位进攻战力永久 +8，相邻友军恢复 25 生命并提供 100 信仰储备。",
      "historicalBiography": "英格兰金雀花王朝国王，第三次十字军东征核心统帅，阿尔苏夫会战击溃萨拉丁军团夺取雅法，以无畏勇猛与骑士典范闻名欧洲。",
      "effectScopes": {
        "targetUnitAttackStrengthBonus": "target_unit",
        "targetUnitsHeal": "target_units_within_radius",
        "instantFaith": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "cavalry"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "belisarius",
      "name": "贝利撒留",
      "englishName": "Belisarius",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_corps_synergy",
      "recipeParams": {
        "targetUnitsHeal": 35,
        "targetArmySpeedBonus": 1,
        "defensiveLoyaltyBonus": 4,
        "durationCycles": 4,
        "radius": 2
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：罗马光复防卫——2格内友军恢复 35 生命值且机动力 +1 持续 4 周期，防守时城市忠诚度 +4。",
      "historicalBiography": "拜占庭帝国查士丁尼一世名将，“最后的罗马人”，以劣势兵力光复北非汪达尔王国与意大利东哥特王国，以卓越野战防守反击与坚守罗马城名垂战史。",
      "effectScopes": {
        "targetUnitsHeal": "target_units_in_radius",
        "targetArmySpeedBonus": "target_units_in_radius",
        "defensiveLoyaltyBonus": "activation_city",
        "durationCycles": "meta",
        "radius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 4,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "khalid_ibn_al_walid",
      "name": "哈立德·本·瓦利德",
      "englishName": "Khalid ibn al-Walid",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 480,
      "targetRequirement": "cavalry_or_infantry_unit",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ambush_speed_bonus",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "targetUnitMovementBonus": 1,
        "ignoreZoc": true
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：真主之剑——目标部队战力永久 +6、移动力 +1，且行动无视敌方控制区（ZOC）。",
      "historicalBiography": "阿拉伯帝国四大哈里发时期第一名将，被誉为“真主之剑”，一生百战不败，在耶尔穆克战役中以精妙骑兵两翼包抄彻底瓦解拜占庭主力军团。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "targetUnitMovementBonus": "target_unit",
        "ignoreZoc": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "saladin",
      "name": "塔里克·伊本·齐亚德",
      "englishName": "Tariq ibn Ziyad",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 540,
      "targetRequirement": "defending_city_or_unit",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_loyalty_wall_heal_and_faith",
      "recipeParams": {
        "cityLoyaltyRestoreMax": true,
        "cityWallRepairHp": 100,
        "instantFaith": 150
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：圣城宽厚之誓——目标城市忠诚度瞬时回满，城墙修复 100 生命值，获得 150 信仰储备。",
      "historicalBiography": "倭马亚王朝将领，公元711年率军渡过直布罗陀海峡（直布罗陀即源自其名），在瓜达莱特战役中击败西哥特国王罗德里克，拉开穆斯林经略伊比利亚半岛的序幕。",
      "effectScopes": {
        "cityLoyaltyRestoreMax": "target_city",
        "cityWallRepairHp": "target_city",
        "instantFaith": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      },
      "canonicalAlias": "tariq_ibn_ziyad"
    },
    {
      "key": "charlemagne",
      "name": "查理曼大帝",
      "englishName": "Charlemagne",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 6,
      "charges": 1,
      "baseThreshold": 600,
      "targetRequirement": "land_military_unit_or_barracks",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_total_war_doctrine",
      "recipeParams": {
        "empireLandMilitaryCombatBonus": 3,
        "militaryPolicyEffectiveness": 0.2
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：法兰克帝国动员——全国陆军基础战力永久 +3（最高取一），已装备军事政策卡效果提升 20%。",
      "historicalBiography": "法兰克加洛林王朝国王、西欧中世纪奠基人，在位期间进行五十余次远征统一西欧大陆大部分土地，于公元800年加冕为“罗马人的皇帝”。",
      "effectScopes": {
        "empireLandMilitaryCombatBonus": "empire",
        "militaryPolicyEffectiveness": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "minamoto_no_yoshitsune",
      "name": "源义经",
      "englishName": "Minamoto no Yoshitsune",
      "classKey": "general",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 7,
      "charges": 1,
      "baseThreshold": 660,
      "targetRequirement": "cavalry_or_melee_unit",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_speed_and_attack_burst",
      "recipeParams": {
        "durationCycles": 6,
        "targetAndAdjacentMovement": 1,
        "targetAndAdjacentAttackStrength": 4
      },
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：鹎越奇袭——目标部队及相邻友军机动力 +1、进攻战力 +4，持续 6 周期（120秒）。",
      "historicalBiography": "日本平安时代末期源氏武将，军事奇才，在一之谷战役中亲率骑兵从悬崖策马疾驰突袭平氏大营，又在坛之浦海战彻底消灭平氏政权。",
      "effectScopes": {
        "durationCycles": "meta",
        "targetAndAdjacentMovement": "target_unit_and_adjacent",
        "targetAndAdjacentAttackStrength": "target_unit_and_adjacent"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "subutai",
      "name": "速不台",
      "englishName": "Subutai",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "cavalry_unit",
      "aura": {
        "applicableEras": [
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "cavalryPillageFreeMove": true,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_deep_raid_tactics",
      "recipeParams": {
        "targetCavalryAttackBonus": 6,
        "targetCavalryMoveBonus": 1,
        "pillageYieldMultiplier": 1,
        "durationCycles": 6
      },
      "effectDescription": "常态光环：2格范围内骑兵战力 +5，掠夺地块不消耗额外移动力（同类不叠加）。退役激活：目标骑兵战力永久 +6、移动力 +1，所有部队掠夺收益翻倍（持续 6 周期）。",
      "historicalBiography": "蒙古帝国“四狗”名将之首，成吉思汗与拔都麾下统帅，征战亚欧数十国，赛约河会战击溃匈奴波兰联军，大范围大迂回闪电作战先驱。",
      "effectScopes": {
        "targetCavalryAttackBonus": "target_unit",
        "targetCavalryMoveBonus": "target_unit",
        "pillageYieldMultiplier": "empire",
        "durationCycles": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "cavalry"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "refresh_duration"
      }
    },
    {
      "key": "qi_jiguang",
      "name": "戚继光",
      "englishName": "Qi Jiguang",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 510,
      "targetRequirement": "coastal_barracks_or_unit",
      "aura": {
        "applicableEras": [
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "antiInfantryCombatBonus": 3,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_mandarin_duck_formation",
      "recipeParams": {
        "targetUnitsDefensiveBonus": 6,
        "barracksInitialXpBonus": 8,
        "coastalCityDefenseBonus": 6
      },
      "effectDescription": "常态光环：2格范围内文艺复兴陆军战力 +5，对抗近战与海盗掠夺者额外 +3 战力（同类不叠加）。退役激活：所在城军营新训练步兵初始经验 +8，沿海城市防御战力 +6。",
      "historicalBiography": "明代著名抗倭名将与军事工程家，组建纪律严明火器精良的戚家军，独创“鸳鸯阵”战法于台州九战九捷肃清东南倭患，修筑北方长城空心敌台。",
      "effectScopes": {
        "targetUnitsDefensiveBonus": "target_units_within_radius",
        "barracksInitialXpBonus": "activation_city",
        "coastalCityDefenseBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "gustavus_adolphus",
      "name": "古斯塔夫·阿道夫",
      "englishName": "Gustavus Adolphus",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 600,
      "targetRequirement": "ranged_or_siege_unit",
      "aura": {
        "applicableEras": [
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none",
        "artilleryMovementBonus": 1
      },
      "recipeType": "retire_combined_arms_gunpowder",
      "recipeParams": {
        "targetArtilleryCombatBonus": 8,
        "militaryProductionMultiplier": 0.25
      },
      "effectDescription": "常态光环：2格范围内文艺复兴与工业陆军战力 +5；其中攻城火炮移动力 +1，同属性取最高。退役激活：目标远程/攻城部队战力永久 +8，本城军工生产力 +25%。",
      "historicalBiography": "瑞典瓦萨王朝国王，“北方雄狮”，三十年战争布赖滕费尔德会战大破神圣罗马帝国名将蒂利伯爵，首创火枪、轻型野炮与骑兵协同合成战术。",
      "effectScopes": {
        "targetArtilleryCombatBonus": "target_unit",
        "militaryProductionMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "siege"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "oda_nobunaga",
      "name": "织田信长",
      "englishName": "Oda Nobunaga",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 690,
      "targetRequirement": "ranged_or_siege_unit",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_combined_arms_gunpowder",
      "recipeParams": {
        "targetArtilleryCombatBonus": 8,
        "militaryProductionMultiplier": 0.25
      },
      "effectDescription": "常态光环：2格范围内近代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：三段击铁炮阵——目标远程/火器部队战力永久 +8；激活所在城军工火器生产力提升 25%。",
      "historicalBiography": "日本战国三英杰之一，首开天下布武之业，在长筱之战中大规模使用铁炮三段击战术击溃武田氏无敌赤备骑兵，推动兵农分离与近世城堡筑城革命。",
      "effectScopes": {
        "targetArtilleryCombatBonus": "target_unit",
        "militaryProductionMultiplier": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "albrecht_von_wallenstein",
      "name": "阿尔布雷希特·冯·华伦斯坦",
      "englishName": "Albrecht von Wallenstein",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "cavalry_unit",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_deep_raid_tactics",
      "recipeParams": {
        "targetCavalryAttackBonus": 6,
        "targetCavalryMoveBonus": 1,
        "pillageYieldMultiplier": 2,
        "durationCycles": 6
      },
      "effectDescription": "常态光环：2格范围内近代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：军费自足掠夺战——目标骑兵进攻战力永久 +6、移动力 +1；全国部队掠夺地块产出翻倍持续 6 周期。",
      "historicalBiography": "神圣罗马帝国三十年战争统帅与军事承包商，以“用战争供养战争”的大规模雇佣军后勤体制独霸中欧战场，在阿尔特维斯特战役中成功抵挡古斯塔夫二世。",
      "effectScopes": {
        "targetCavalryAttackBonus": "target_unit",
        "targetCavalryMoveBonus": "target_unit",
        "pillageYieldMultiplier": "empire",
        "durationCycles": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "maurice_of_nassau",
      "name": "拿骚的毛里茨",
      "englishName": "Maurice of Nassau",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 870,
      "targetRequirement": "coastal_barracks_or_unit",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_mandarin_duck_formation",
      "recipeParams": {
        "targetUnitsDefensiveBonus": 6,
        "barracksInitialXpBonus": 8,
        "coastalCityDefenseBonus": 6
      },
      "effectDescription": "常态光环：2格范围内近代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：莫里斯军事改革——目标部队防御战力永久 +6；军营新训步兵经验 +8，沿海要塞城防 +6。",
      "historicalBiography": "奥兰治亲王兼荷兰联省执政，近代军事操典与线式战术奠基人，引入小编制方阵、反向行进轮射与标准化工程筑垒，击溃西班牙精锐陆军。",
      "effectScopes": {
        "targetUnitsDefensiveBonus": "target_unit",
        "barracksInitialXpBonus": "activation_city",
        "coastalCityDefenseBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "alexander_suvorov",
      "name": "亚历山大·苏沃洛夫",
      "englishName": "Alexander Suvorov",
      "classKey": "general",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 6,
      "charges": 1,
      "baseThreshold": 960,
      "targetRequirement": "cavalry_or_infantry_unit",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ambush_speed_bonus",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "targetUnitMovementBonus": 1,
        "ignoreZoc": true
      },
      "effectDescription": "常态光环：2格范围内近代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：胜战之学突击——目标部队战力永久 +6、移动力 +1，且行动无视敌方控制区（ZOC）。",
      "historicalBiography": "俄国大元帅、军事理论家，六十余战无一败绩，著有《致胜的科学》，推崇“子弹是懦夫，刺刀是好汉”的果断突击与阿尔卑斯山传奇翻越机动。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "targetUnitMovementBonus": "target_unit",
        "ignoreZoc": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "napoleon_bonaparte",
      "name": "拿破仑·波拿巴",
      "englishName": "Napoleon Bonaparte",
      "classKey": "general",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 650,
      "targetRequirement": "siege_or_artillery_unit",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "artilleryBombardRange": 1,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_elite_corps_and_war_weariness",
      "recipeParams": {
        "siegeCombatStrengthBonus": 10,
        "warWearinessReductionInstant": 0.5
      },
      "effectDescription": "常态光环：2格范围内文艺复兴、工业与现代攻城陆军（时代3-5）战力 +5，攻城炮兵攻击射程 +1（同类不叠加；时代6火箭炮及防空兵种不受此光环影响，保持原射程）。退役激活：将目标攻城炮兵晋升为精锐近卫军（攻城战力永久 +10），并立即消除当前战争 50% 厌战度。",
      "historicalBiography": "法兰西第一帝国皇帝，卓越的军事统帅与立法者，奥斯特里茨会战创造集中炮火与纵深穿插典范，横扫欧洲大陆建立大陆封锁体系，颁布《法国民法典》。",
      "effectScopes": {
        "siegeCombatStrengthBonus": "target_unit",
        "warWearinessReductionInstant": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "siege"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "carl_von_clausewitz",
      "name": "卡尔·冯·克劳塞维茨",
      "englishName": "Carl von Clausewitz",
      "classKey": "general",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "barracks_district",
      "aura": {
        "applicableEras": [
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "homeTerritoryBonus": 3,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_total_war_doctrine",
      "recipeParams": {
        "empireLandMilitaryCombatBonus": 3,
        "militaryPolicyEffectiveness": 0.2
      },
      "effectDescription": "常态光环：2格范围内工业陆军战力 +5，本土防御作战额外 +3 战力（同类不叠加）。退役激活：全国所有陆军部队永久战斗力 +3，全国军事政策卡增益放大 20%。",
      "historicalBiography": "普鲁士杰出军事理论家与将军，参与反法同盟解放战争，所著巨著《战争论》提出“战争是政治通过另一种手段的继续”经典论断，近代西方军事思想基石。",
      "effectScopes": {
        "empireLandMilitaryCombatBonus": "empire",
        "militaryPolicyEffectiveness": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "arthur_wellesley",
      "name": "阿瑟·韦尔斯利（威灵顿公爵）",
      "englishName": "Arthur Wellesley (Duke of Wellington)",
      "classKey": "general",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 910,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_corps_synergy",
      "recipeParams": {
        "targetUnitsHeal": 35,
        "targetArmySpeedBonus": 1,
        "defensiveLoyaltyBonus": 4,
        "durationCycles": 4,
        "radius": 2
      },
      "effectDescription": "常态光环：2格范围内工业陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：逆斜面防守反击——2格内友军恢复 35 生命值且机动力 +1 持续 4 周期，防守时城市忠诚度 +4。",
      "historicalBiography": "英国陆军元帅、政治家，在半岛战争中依靠托雷斯韦德拉什防线拖垮法军，并在滑铁卢战役中指挥联军坚守反击彻底终结拿破仑时代。",
      "effectScopes": {
        "targetUnitsHeal": "target_units_in_radius",
        "targetArmySpeedBonus": "target_units_in_radius",
        "defensiveLoyaltyBonus": "activation_city",
        "durationCycles": "meta",
        "radius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 4,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "simon_bolivar",
      "name": "西蒙·玻利瓦尔",
      "englishName": "Simón Bolívar",
      "classKey": "general",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1040,
      "targetRequirement": "cavalry_or_infantry_unit",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ambush_speed_bonus",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "targetUnitMovementBonus": 1,
        "ignoreZoc": true
      },
      "effectDescription": "常态光环：2格范围内工业陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：解放者军团行军——目标部队战力永久 +6、移动力 +1，且行动无视敌方控制区（ZOC）。",
      "historicalBiography": "南美独立战争领袖、“解放者”，先后领导哥伦比亚、委内瑞拉、厄瓜多尔、秘鲁、玻利维亚推翻西班牙殖民统治，翻越安第斯山行军神速著称于世。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "targetUnitMovementBonus": "target_unit",
        "ignoreZoc": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "shaka_zulu",
      "name": "芒达瓦",
      "englishName": "Mdlaka kaNcidi",
      "classKey": "general",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1170,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_combat_annihilation",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "enemyCitySiegeCombatBonus": 4,
        "warKillGoldBonus": 10
      },
      "effectDescription": "常态光环：2格范围内工业陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：牛角突击阵——目标陆军战力永久 +6，攻城战力额外 +4，消灭敌军获 10 金币战利品。",
      "historicalBiography": "祖鲁王国早期资深军政头领（Induna）与前线将领，在沙卡统一祖鲁各部期间担任主力军团指挥官，多次统率伊布托军团执行作战任务。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "enemyCitySiegeCombatBonus": "target_unit",
        "warKillGoldBonus": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      },
      "canonicalAlias": "mdlaka_kancidi"
    },
    {
      "key": "georgy_zhukov",
      "name": "格奥尔吉·朱可夫",
      "englishName": "Georgy Zhukov",
      "classKey": "general",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 950,
      "targetRequirement": "tank_or_artillery_unit",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "siegeArmorBonus": 4,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_deep_battle_corps",
      "recipeParams": {
        "targetUnitsCombatBonus": 7,
        "targetUnitsDefenseWallBonus": 10,
        "warWearinessReduction": 0.3
      },
      "effectDescription": "常态光环：2格范围内现代装甲与炮兵战力 +5，攻打设防地块额外 +4 战力（同类不叠加）。退役激活：目标装甲军团战力永久 +7，攻城墙伤害 +10，消减 30% 厌战度。",
      "historicalBiography": "苏联元帅，二战杰出统帅，指挥列宁格勒保卫战、莫斯科保卫战、斯大林格勒大会战反攻与柏林战役，以坚韧意志与大纵深装甲突击艺术重创法西斯轴心军。",
      "effectScopes": {
        "targetUnitsCombatBonus": "target_units_within_radius",
        "targetUnitsDefenseWallBonus": "target_units_within_radius",
        "warWearinessReduction": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "siege"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "dwight_eisenhower",
      "name": "德怀特·艾森豪威尔",
      "englishName": "Dwight D. Eisenhower",
      "classKey": "general",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 1130,
      "targetRequirement": "airfield_or_military_unit",
      "aura": {
        "applicableEras": [
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "supplyMoveBonus": 1,
        "domain": "land",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_overlord_logistics",
      "recipeParams": {
        "empireMilitaryProductionBonus": 0.25,
        "airSupportRangeBonus": 2,
        "unitUpkeepDiscount": 0.2
      },
      "effectDescription": "常态光环：2格范围内现代陆军战力 +5，后勤补给线移动力 +1（同类不叠加）。退役激活：全国军事生产力提升 25%，陆空支援协同射程 +2，全国陆军维护费降低 20%。",
      "historicalBiography": "美国五星上将，二战盟军欧洲最高远征军总司令，成功运筹组织人类史上最大规模两栖登陆诺曼底战役（霸王行动），后当选第34任美国总统。",
      "effectScopes": {
        "empireMilitaryProductionBonus": "empire",
        "airSupportRangeBonus": "empire",
        "unitUpkeepDiscount": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "erwin_rommel",
      "name": "埃尔温·隆美尔",
      "englishName": "Erwin Rommel",
      "classKey": "general",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 1310,
      "targetRequirement": "cavalry_or_infantry_unit",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ambush_speed_bonus",
      "recipeParams": {
        "targetUnitCombatBonus": 6,
        "targetUnitMovementBonus": 1,
        "ignoreZoc": true
      },
      "effectDescription": "常态光环：2格范围内现代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：沙漠之狐穿插——目标装甲或步兵战力永久 +6、移动力 +1，且行动无视敌方控制区（ZOC）。",
      "historicalBiography": "二战装甲名将，以北非战役中大胆的高速侧翼包抄与以弱敌强著称，著有经典步兵战术专著《步兵攻击》，深受各方军事学者深入研读。",
      "effectScopes": {
        "targetUnitCombatBonus": "target_unit",
        "targetUnitMovementBonus": "target_unit",
        "ignoreZoc": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "bernard_montgomery",
      "name": "伯纳德·蒙哥马利",
      "englishName": "Bernard Montgomery",
      "classKey": "general",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1490,
      "targetRequirement": "tank_or_artillery_unit",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_deep_battle_corps",
      "recipeParams": {
        "targetUnitsCombatBonus": 7,
        "targetUnitsDefenseWallBonus": 10,
        "warWearinessReduction": 0.3
      },
      "effectDescription": "常态光环：2格范围内现代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：阿拉曼攻坚推进——目标火炮/装甲战力永久 +7，破墙伤害 +10，对外厌战累积速度降低 30%。",
      "historicalBiography": "英国陆军第一子爵元帅，二战盟军杰出指挥官，在第二次阿拉曼战役中以周密火炮协同与装甲攻坚粉碎德意联军，扭转北非战局走向。",
      "effectScopes": {
        "targetUnitsCombatBonus": "target_unit",
        "targetUnitsDefenseWallBonus": "target_unit",
        "warWearinessReduction": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "george_patton",
      "name": "乔治·巴顿",
      "englishName": "George S. Patton",
      "classKey": "general",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1670,
      "targetRequirement": "cavalry_or_melee_unit",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_speed_and_attack_burst",
      "recipeParams": {
        "durationCycles": 6,
        "targetAndAdjacentMovement": 1,
        "targetAndAdjacentAttackStrength": 5
      },
      "effectDescription": "常态光环：2格范围内现代陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：铁胆第三集团军——目标部队及相邻友军机动力 +1、进攻战力 +5，持续 6 周期（120秒）。",
      "historicalBiography": "美国陆军四星上将，二战盟军最富传奇色彩的装甲突击指挥官，诺曼底登陆后率领第三集团军以极高推进速度横扫法国并解围巴斯托涅突出部。",
      "effectScopes": {
        "durationCycles": "meta",
        "targetAndAdjacentMovement": "target_unit_and_adjacent",
        "targetAndAdjacentAttackStrength": "target_unit_and_adjacent"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 6,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "vo_nguyen_giap",
      "name": "武元甲",
      "englishName": "Vo Nguyen Giap",
      "classKey": "general",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "land_military_unit",
      "aura": {
        "applicableEras": [
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "land",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_corps_synergy",
      "recipeParams": {
        "targetUnitsHeal": 35,
        "targetArmySpeedBonus": 1,
        "defensiveLoyaltyBonus": 4,
        "durationCycles": 4,
        "radius": 2
      },
      "effectDescription": "常态光环：2格范围内现代与信息陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：奠边府纵深隐蔽——2格内友军恢复 35 生命值且机动力 +1 持续 4 周期，防守时城市忠诚度 +4。",
      "historicalBiography": "越南军事家与陆军大将，奠边府战役总指挥，擅长将重型火炮人力拆卸运上高山分散构筑工事并实施精确火力覆盖，击败现代化远征军团。",
      "effectScopes": {
        "targetUnitsHeal": "target_units_in_radius",
        "targetArmySpeedBonus": "target_units_in_radius",
        "defensiveLoyaltyBonus": "activation_city",
        "durationCycles": "meta",
        "radius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "land_military"
        ],
        "durationCycles": 4,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "himilco",
      "name": "希米尔科",
      "englishName": "Himilco",
      "classKey": "admiral",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 60,
      "targetRequirement": "coastal_city_or_harbor",
      "aura": {
        "applicableEras": [
          0,
          1
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_treasure_fleet_and_reveal_map",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "instantGold": 150,
        "revealWaterRadius": 8
      },
      "effectDescription": "常态光环：2格范围内远古海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：北大西洋锡路探航——帝国贸易容量 +1，获 150 金币，驱散周围 8 格水域迷雾。",
      "historicalBiography": "迦太基航海家兼探索舰队司令，率船队沿大西洋西北海岸北上探险直达不列颠群岛，开辟古代通往北欧大西洋锡矿贸易航线。",
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "instantGold": "empire",
        "revealWaterRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "themistocles",
      "name": "地米斯托克利",
      "englishName": "Themistocles",
      "classKey": "admiral",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 120,
      "targetRequirement": "harbor_or_naval_unit",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_free_trireme_and_city_defense",
      "recipeParams": {
        "freeNavalUnit": "galley",
        "harborCityDefenseStrength": 5
      },
      "effectDescription": "常态光环：2格范围内远古与古典海军战力 +5，移动力 +1（同类不叠加）。退役激活：立即在所在港口获赠一艘免费三列桨座战船，所在城市防御战力永久 +5。",
      "historicalBiography": "雅典著名政治家与海军统帅，倡导建立雅典强大海军舰队，并在萨拉米斯海战中以智谋诱敌入狭窄海峡歼灭波斯庞大舰队。",
      "effectScopes": {
        "freeNavalUnit": "empire",
        "harborCityDefenseStrength": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "artemisia",
      "name": "阿尔特米西亚一世",
      "englishName": "Artemisia I of Caria",
      "classKey": "admiral",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 150,
      "targetRequirement": "naval_unit",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "retreatSafeRate": 0.5,
        "special": "retreatSafeRate",
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0
      },
      "recipeType": "retire_naval_evasion_strike",
      "recipeParams": {
        "targetNavalCombatBonus": 4,
        "targetNavalSpeedBonus": 1,
        "coastalRaidGoldBonus": 50,
        "lowHpEvasionChance": 0.5
      },
      "effectDescription": "常态光环：2格范围内古典海军战力 +5，受重伤时脱离战场判定成功率提升 50%（同类不叠加）。退役激活：目标战舰战力永久 +4、移动力 +1，沿海掠夺额外获赠 50 金币。",
      "historicalBiography": "卡里亚女王兼哈利卡纳苏斯舰队司令，萨拉米斯海战中展现高超航海操舰术与战术决断，深得波斯国王薛西斯一世赞许感叹“男人变成了女人”。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_unit",
        "targetNavalSpeedBonus": "target_unit",
        "coastalRaidGoldBonus": "empire",
        "lowHpEvasionChance": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "gaius_duilius",
      "name": "盖乌斯·杜伊利乌斯",
      "englishName": "Gaius Duilius",
      "classKey": "admiral",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 180,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ramming_valor",
      "recipeParams": {
        "targetNavalCombatBonus": 6,
        "navalRammingAttackBonus": 12,
        "cityLoyaltyRestored": 30
      },
      "effectDescription": "常态光环：2格范围内古典海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：乌鸦吊桥跳帮——目标战舰战力永久 +6、近战突击战力 +12；所在港口城市忠诚度回升 30 点。",
      "historicalBiography": "罗马共和国执政官，第一次布匿战争米利海战指挥官，为战船装备“乌鸦”跳帮吊桥将海战转为陆战步兵格斗，赢得以少胜多的罗马海军史上首场大捷。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_naval_unit",
        "navalRammingAttackBonus": "target_naval_unit",
        "cityLoyaltyRestored": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "marcus_vipsanius_agrippa",
      "name": "马尔库斯·维普撒尼乌斯·阿格里帕",
      "englishName": "Marcus Vipsanius Agrippa",
      "classKey": "admiral",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 210,
      "targetRequirement": "harbor_or_naval_unit",
      "aura": {
        "applicableEras": [
          0,
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_free_trireme_and_city_defense",
      "recipeParams": {
        "freeNavalUnit": "galley",
        "harborCityDefenseStrength": 6
      },
      "effectDescription": "常态光环：2格范围内古典海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：尤里乌斯港筑垒——港口获赠一艘免费战船（galley），所在港口城防战力永久 +6。",
      "historicalBiography": "罗马帝国奠基重臣与海军主帅，发明铁锚投射器（Harpax），在亚克兴海战中彻底击溃安东尼与克利奥帕特拉舰队，为主公屋大维开创罗马和平时代。",
      "effectScopes": {
        "freeNavalUnit": "empire",
        "harborCityDefenseStrength": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "ragnar_lodbrok",
      "name": "拉格纳·洛德布罗克",
      "englishName": "Ragnar Lodbrok",
      "classKey": "admiral",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "naval_unit_or_coastal_city",
      "aura": {
        "applicableEras": [
          1,
          2
        ],
        "radius": 2,
        "combatStrength": 5,
        "shallowWaterMoveBonus": 1,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_viking_longship_raid",
      "recipeParams": {
        "targetNavalUnitCombatBonus": 6,
        "coastalRaidGoldAndCultureBurst": 120
      },
      "effectDescription": "常态光环：2格范围内中古海军战力 +5，浅海及沿河航行移动力额外 +1（同类不叠加）。退役激活：目标海船战力永久 +6，沿海掠夺一次性抢夺 120 金币与文化储备。",
      "historicalBiography": "斯堪的纳维亚半岛传奇维京海王，率领敏捷吃水浅的维京长船溯塞纳河洗劫巴黎并远征英格兰诸国，开创北欧维京海上大航海掠夺纪元。",
      "effectScopes": {
        "targetNavalUnitCombatBonus": "target_unit",
        "coastalRaidGoldAndCultureBurst": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "yi_sun_sin",
      "name": "李舜臣",
      "englishName": "Yi Sun-sin",
      "classKey": "admiral",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "navalArmorBonus": 4,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_turtle_ship_ironclad",
      "recipeParams": {
        "targetNavalCombatBonus": 8,
        "targetArmorDefenseBonus": 6,
        "freeNavalPromotion": 1
      },
      "effectDescription": "常态光环：2格范围内战舰战力 +5，受到远程射击防御战力额外 +4（同类不叠加）。退役激活：目标战舰永久战力 +8、防御战力 +6 并获 1 次免费晋升（化为不沉龟甲战舰）。",
      "historicalBiography": "朝鲜李朝一代名将、海军都体察使，万历朝鲜之役中改良龟船装置铁甲尖刺与火炮，鸣梁海战以十二艘战船击溃日本三百三十余艘庞大水军奇迹。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_unit",
        "targetArmorDefenseBonus": "target_unit",
        "freeNavalPromotion": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "roger_of_lauria",
      "name": "劳里亚的罗杰",
      "englishName": "Roger of Lauria",
      "classKey": "admiral",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 360,
      "targetRequirement": "naval_unit",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_naval_evasion_strike",
      "recipeParams": {
        "targetNavalCombatBonus": 5,
        "targetNavalSpeedBonus": 1,
        "coastalRaidGoldBonus": 60,
        "lowHpEvasionChance": 0.25
      },
      "effectDescription": "常态光环：2格范围内中古海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：地中海桨帆伏击——目标战船战力永久 +5、移动力 +1，沿海掠夺额外获 60 金，重伤脱离率提升。",
      "historicalBiography": "阿拉贡王国海军大将，中世纪地中海海战常胜统帅，在西西里晚祷战争中以精熟的桨帆船佯退与弩手伏击战术横扫法国与安茹庞大舰队。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_naval_unit",
        "targetNavalSpeedBonus": "target_naval_unit",
        "coastalRaidGoldBonus": "target_naval_unit",
        "lowHpEvasionChance": "target_naval_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "andrea_doria",
      "name": "安德烈亚·多利亚",
      "englishName": "Andrea Doria",
      "classKey": "admiral",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "harbor_district",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_free_unit",
      "recipeParams": {
        "freeNavalUnit": "galley",
        "harborCityGoldBonus": 8,
        "navalUpkeepDiscount": 0.15,
        "boardingCaptureChance": 0.2
      },
      "effectDescription": "常态光环：2格范围内中古海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：热那亚海军执政——港口获赠战船，港口城每周期 +8 金，全国海军维护费降低 15%。",
      "historicalBiography": "热那亚共和国海军大将与政治领袖，重建热那亚独立宪法，率领重型排桨舰队与奥斯曼帝国海盗激烈争夺西地中海制海权，被尊为祖国之父。",
      "effectScopes": {
        "freeNavalUnit": "empire",
        "harborCityGoldBonus": "activation_city",
        "navalUpkeepDiscount": "empire",
        "boardingCaptureChance": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "erik_the_red",
      "name": "红发埃里克",
      "englishName": "Erik the Red",
      "classKey": "admiral",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 480,
      "targetRequirement": "naval_unit_or_coastal_city",
      "aura": {
        "applicableEras": [
          1,
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_viking_longship_raid",
      "recipeParams": {
        "targetNavalUnitCombatBonus": 6,
        "coastalRaidGoldAndCultureBurst": 120
      },
      "effectDescription": "常态光环：2格范围内中古海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：维京长船跨洋劫掠——目标战船战力永久 +6，沿海掠夺瞬时斩获 120 金币与文化储备。",
      "historicalBiography": "诺斯维京探险家与殖民航海家，率领船队勇闯北大西洋风暴发现格陵兰岛并建立首批斯堪的纳维亚永久定居点，为其子莱夫·埃里克松远航美洲奠定基石。",
      "effectScopes": {
        "targetNavalUnitCombatBonus": "target_naval_unit",
        "coastalRaidGoldAndCultureBurst": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "zheng_he",
      "name": "郑和",
      "englishName": "Zheng He",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "coastal_city_or_harbor",
      "aura": {
        "applicableEras": [
          2,
          3
        ],
        "radius": 2,
        "combatStrength": 5,
        "waterSight": 2,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_treasure_fleet_and_reveal_map",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "instantGold": 300,
        "revealWaterRadius": 10
      },
      "effectDescription": "常态光环：2格范围内中古与文艺复兴海军战力 +5，水上视野 +2（同类不叠加）。退役激活：帝国永久增加 +1 贸易路线容量；立即获得 300 金币储备，并揭示周围 10 格未探索水域。",
      "historicalBiography": "明代三保太监、伟大的航海家与外交家，率领由数百艘巨型宝船组成的庞大舰队七下西洋，遍访三十余国，开创人类和平朝贡与跨洋远航壮举。",
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "instantGold": "empire",
        "revealWaterRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "francis_drake",
      "name": "弗朗西斯·德雷克",
      "englishName": "Francis Drake",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 510,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "navalSpeedBonus": 1,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_privateer_bounty",
      "recipeParams": {
        "targetNavalCombatBonus": 5,
        "killEnemyNavalGoldBonus": 60,
        "instantGold": 200
      },
      "effectDescription": "常态光环：2格范围内私掠船与战舰战力 +5，移动力 +1（同类不叠加）。退役激活：目标舰战力永久 +5，击沉敌舰额外掠取 60 金币赏金，立即获得 200 金币。",
      "historicalBiography": "英格兰伊丽莎白一世麾下私掠海盗船长与皇家海军副司令，完成人类第二次环球航行，格瑞福兰海战以火船战术击溃西班牙无敌舰队。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_unit",
        "killEnemyNavalGoldBonus": "empire",
        "instantGold": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "hayreddin_barbarossa",
      "name": "巴巴罗萨·海雷丁",
      "englishName": "Hayreddin Barbarossa",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 600,
      "targetRequirement": "harbor_district",
      "aura": {
        "applicableEras": [
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "boardingCaptureBonus": 0.25,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_free_unit",
      "recipeParams": {
        "freeNavalUnit": "frigate",
        "harborCityGoldBonus": 8,
        "navalUpkeepDiscount": 0.15,
        "boardingCaptureChance": 0.25
      },
      "effectDescription": "常态光环：2格范围内海军海战击沉敌方水面作战舰艇时，有 25% 概率将其俘获转化为残血自舰（同类不叠加）。退役激活：所在港口获赠一艘护卫舰，本港口城市每周期 +8 金币，全国海军维护费降低 15%。",
      "historicalBiography": "奥斯曼帝国红胡子大元帅兼地中海舰队总司令，普雷韦扎海战大破神圣同盟基督徒联合舰队，确立奥斯曼帝国对地中海制海权长达数十年。",
      "effectScopes": {
        "freeNavalUnit": "empire",
        "harborCityGoldBonus": "activation_city",
        "navalUpkeepDiscount": "empire",
        "boardingCaptureChance": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "michiel_de_ruyter",
      "name": "米希尔·德·鲁伊特",
      "englishName": "Michiel de Ruyter",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 690,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_harbor_breach",
      "recipeParams": {
        "harborBombardStrengthBonus": 8,
        "fleetMovementBonus": 1,
        "ignoreEnemyTerritoryWaterPenalty": true,
        "durationCycles": 5
      },
      "effectDescription": "常态光环：2格范围内近代海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：梅德韦河奇袭——水面舰队炮轰战力 +8、移动 +1 且无视敌区惩罚，持续 5 周期（100秒）。",
      "historicalBiography": "荷兰黄金时代海军上将，三次英荷战争民族英雄，在梅德韦河奇袭中直捣英国泰晤士河口焚毁并俘获英国主力舰队，确立近代战列线战术经典范式。",
      "effectScopes": {
        "harborBombardStrengthBonus": "all_naval_units",
        "fleetMovementBonus": "all_naval_units",
        "ignoreEnemyTerritoryWaterPenalty": "all_naval_units",
        "durationCycles": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": 5,
        "radius": 2,
        "stackingPolicy": "highest_applicable_value"
      }
    },
    {
      "key": "alvaro_de_bazan",
      "name": "阿尔瓦罗·德·巴赞（圣克鲁斯侯爵）",
      "englishName": "Álvaro de Bazán",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_flagship_combat_and_survivability",
      "recipeParams": {
        "targetNavalCombatPermanentBonus": 5,
        "flagshipOncePerLifetimeShield": true,
        "deathDefyingShieldSeconds": 3
      },
      "effectDescription": "常态光环：2格范围内近代海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：大帆船旗舰护航——目标旗舰战力永久 +5，赋予一生一次的濒死锁定保命护盾（3秒无敌脱离）。",
      "historicalBiography": "西班牙常胜海军上将，在勒班陀战役中担任预备队指挥精准切入战局扭转乾坤，首创跨大西洋珍宝船队护航体制，一生经历五十余次重大海战未尝一败。",
      "effectScopes": {
        "targetNavalCombatPermanentBonus": "target_naval_unit",
        "flagshipOncePerLifetimeShield": "target_naval_unit",
        "deathDefyingShieldSeconds": "target_naval_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "john_paul_jones",
      "name": "约翰·保罗·琼斯",
      "englishName": "John Paul Jones",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 870,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_privateer_bounty",
      "recipeParams": {
        "targetNavalCombatBonus": 5,
        "killEnemyNavalGoldBonus": 60,
        "instantGold": 200
      },
      "effectDescription": "常态光环：2格范围内近代海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：我才刚刚开始战斗——目标战舰战力永久 +5，击沉敌舰掠取 60 金，立即获 200 金币。",
      "historicalBiography": "美国独立战争海军英雄、美国海军之父，率领“好人理查号”在英国本土海岸直面强敌塞拉比斯号并以贴身近战迫敌投降，以“我还没开始战斗呢！”传颂后世。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_naval_unit",
        "killEnemyNavalGoldBonus": "target_naval_unit",
        "instantGold": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "maarten_tromp",
      "name": "马尔滕·特龙普",
      "englishName": "Maarten Tromp",
      "classKey": "admiral",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 6,
      "charges": 1,
      "baseThreshold": 960,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          2,
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_turtle_ship_ironclad",
      "recipeParams": {
        "targetNavalCombatBonus": 8,
        "targetArmorDefenseBonus": 6,
        "freeNavalPromotion": 1
      },
      "effectDescription": "常态光环：2格范围内近代海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：唐斯海战战列线——目标战舰永久战力 +8、装甲防御 +6，免费获得 1 次战术晋升。",
      "historicalBiography": "荷兰联省共和国海军中将，在1639年唐斯海战中首创严整的双纵队战列线战术击溃西班牙第二无敌舰队，奠定荷兰海军在欧洲海域霸主地位。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_naval_unit",
        "targetArmorDefenseBonus": "target_naval_unit",
        "freeNavalPromotion": "target_naval_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "horatio_nelson",
      "name": "霍雷肖·纳尔逊",
      "englishName": "Horatio Nelson",
      "classKey": "admiral",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 650,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "flankingBonusMultiplier": 0.5,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_flagship_combat_and_survivability",
      "recipeParams": {
        "targetNavalCombatPermanentBonus": 5,
        "flagshipOncePerLifetimeShield": true,
        "deathDefyingShieldSeconds": 3
      },
      "effectDescription": "常态光环：2格范围内工业海军战力 +5，海军包夹攻击收益 +50%（同类不叠加）。退役激活：目标战舰永久战力 +5，并赋予其终生仅有 1 次的致命护盾（当受到致命伤害时锁定保留 1 点生命，触发 3 秒无敌金身脱险，触发后护盾失效，不可重复触发）。",
      "historicalBiography": "英国皇家海军一代战神，在特拉法尔加海战中首创穿透列阵战术彻底歼灭法西联合舰队，确立英国长达一个世纪的全球海洋霸权。",
      "effectScopes": {
        "targetNavalCombatPermanentBonus": "target_unit",
        "flagshipOncePerLifetimeShield": "target_unit",
        "deathDefyingShieldSeconds": "target_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "deng_shichang",
      "name": "邓世昌",
      "englishName": "Deng Shichang",
      "classKey": "admiral",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 780,
      "targetRequirement": "naval_ironclad_or_cruiser",
      "aura": {
        "applicableEras": [
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "woundedCombatPenaltyImmunity": true,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ramming_valor",
      "recipeParams": {
        "targetNavalCombatBonus": 6,
        "navalRammingAttackBonus": 12,
        "cityLoyaltyRestored": 30
      },
      "effectDescription": "常态光环：2格范围内战舰战力 +5，受伤单位无战力减损惩罚（同类不叠加）。退役激活：目标战舰永久战力 +6，近距突击战力 +12；沿海基地忠诚度提升 30。",
      "historicalBiography": "清朝北洋水师中军中副将兼致远舰管带，黄海海战中在致远舰弹药告罄且遭重创倾斜之际，毅然开足马力决绝撞击日军主力旗舰吉野舰壮烈殉国。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_unit",
        "navalRammingAttackBonus": "target_unit",
        "cityLoyaltyRestored": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "david_farragut",
      "name": "戴维·法拉格特",
      "englishName": "David Farragut",
      "classKey": "admiral",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 910,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "special": "ignoreZocAndTerritoryPenalty",
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "ignoreEnemyTerritoryWaterPenalty": true,
        "ignoreZoc": true
      },
      "recipeType": "retire_harbor_breach",
      "recipeParams": {
        "harborBombardStrengthBonus": 8,
        "fleetMovementBonus": 1,
        "ignoreEnemyTerritoryWaterPenalty": true,
        "durationCycles": 5
      },
      "effectDescription": "常态光环：2格范围内工业与现代海军战力 +5，无视敌方领海减速与敌舰控制区。退役激活：所有友方海军对要塞港口炮轰战力 +8，舰队移动力 +1（持续 5 周期）。",
      "historicalBiography": "美国海军首位海军上将，南北战争莫比尔湾海战中发出名言“去他的水雷，全速前进！”，成功突破南军水雷阵并俘获装甲舰田纳西号。",
      "effectScopes": {
        "harborBombardStrengthBonus": "all_naval_units",
        "fleetMovementBonus": "all_naval_units",
        "ignoreEnemyTerritoryWaterPenalty": "all_naval_units",
        "durationCycles": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": 5,
        "radius": 2,
        "stackingPolicy": "refresh_duration"
      }
    },
    {
      "key": "matthew_c_perry",
      "name": "马修·佩里",
      "englishName": "Matthew C. Perry",
      "classKey": "admiral",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1040,
      "targetRequirement": "coastal_city_or_harbor",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_treasure_fleet_and_reveal_map",
      "recipeParams": {
        "tradeCapacityBonus": 1,
        "instantGold": 300,
        "revealWaterRadius": 10
      },
      "effectDescription": "常态光环：2格范围内工业海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：黑船通商通渠——帝国贸易路线容量 +1，获 300 金币，驱散周围 10 格水域迷雾。",
      "historicalBiography": "美国海军准将，推动美国海军从风帆向蒸汽化转型，1853年率领蒸汽铁甲黑船舰队进入江户湾打破日本锁国政策，开启远东近代门户开放与通商航线。",
      "effectScopes": {
        "tradeCapacityBonus": "empire",
        "instantGold": "empire",
        "revealWaterRadius": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "wilhelm_von_tegetthoff",
      "name": "威廉·冯·特盖特霍夫",
      "englishName": "Wilhelm von Tegetthoff",
      "classKey": "admiral",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 1170,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_ramming_valor",
      "recipeParams": {
        "targetNavalCombatBonus": 6,
        "navalRammingAttackBonus": 12,
        "cityLoyaltyRestored": 30
      },
      "effectDescription": "常态光环：2格范围内工业海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：利萨铁甲撞角——目标铁甲舰战力永久 +6、近距冲撞战力 +12；基地城市忠诚度回升 30 点。",
      "historicalBiography": "奥地利帝国海军中将，在1866年利萨海战中指挥劣势铁甲舰队首创楔形撞击战术，亲驾旗舰撞沉意大利精锐装甲舰，改写近代铁甲舰海战战术史。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_naval_unit",
        "navalRammingAttackBonus": "target_naval_unit",
        "cityLoyaltyRestored": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "togo_heihachiro",
      "name": "东乡平八郎",
      "englishName": "Togo Heihachiro",
      "classKey": "admiral",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          3,
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_flagship_combat_and_survivability",
      "recipeParams": {
        "targetNavalCombatPermanentBonus": 5,
        "flagshipOncePerLifetimeShield": true,
        "deathDefyingShieldSeconds": 3
      },
      "effectDescription": "常态光环：2格范围内工业海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：三笠旗舰齐射——目标主力舰战力永久 +5，赋予一生一次的濒死锁定保命护盾（3秒无敌脱离）。",
      "historicalBiography": "日本海军元帅大将，在1905年对马海峡海战中率领联合舰队实施著名敌前“大回转”抢占T字横头，近乎全歼俄国第二太平洋舰队，震惊近代军界。",
      "effectScopes": {
        "targetNavalCombatPermanentBonus": "target_naval_unit",
        "flagshipOncePerLifetimeShield": "target_naval_unit",
        "deathDefyingShieldSeconds": "target_naval_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "chester_nimitz",
      "name": "切斯特·尼米兹",
      "englishName": "Chester W. Nimitz",
      "classKey": "admiral",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 950,
      "targetRequirement": "carrier_or_naval_base",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "aircraftStrikeRangeBonus": 2,
        "domain": "sea",
        "movement": 0,
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_carrier_strike_and_free_aircraft",
      "recipeParams": {
        "carrierBomberDamageMultiplier": 0.25,
        "freeFighterAircraft": 1
      },
      "effectDescription": "常态光环：2格范围内现代与原子能时代战舰及航母战力 +5，舰载机攻击范围 +2（同类不叠加）。退役激活：驻扎航母或该港口基地的战机伤害提升 25%，并立即免费补充 1 架满编战机。",
      "historicalBiography": "美国海军五星上将，二战太平洋战区总司令，指挥中途岛空海决战逆转战局，部署珊瑚海、马里亚纳海战与跳岛反攻，开创现代化航空母舰机动大编队作战模式。",
      "effectScopes": {
        "carrierBomberDamageMultiplier": "activation_city",
        "freeFighterAircraft": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "hyman_rickover",
      "name": "海曼·里科弗",
      "englishName": "Hyman G. Rickover",
      "classKey": "admiral",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 1130,
      "targetRequirement": "naval_submarine_or_destroyer",
      "recipeType": "nuclear_navy_propulsion",
      "recipeParams": {
        "submarineSpeedBonus": 2,
        "submarineStealthBonus": true,
        "eurekaTechs": [
          "nuclearfission"
        ]
      },
      "effectDescription": "在潜艇或驱逐舰激活：解锁《核裂变》尤里卡；全国所有潜艇与水下战舰移动力永久 +2，隐匿侦测距离额外延伸 1 格。",
      "historicalBiography": "美国海军上将，“核潜艇之父”，主持研制世界首艘核动力潜艇“鹦鹉螺号”及第一座商业核电站，确立严密的军用反应堆安全工程学规范。",
      "aura": {
        "radius": 2,
        "applicableEras": [
          5,
          6
        ],
        "domain": "sea",
        "combatStrength": 5,
        "movement": 1,
        "artilleryRange": 0,
        "special": "none"
      },
      "effectScopes": {
        "submarineSpeedBonus": "empire",
        "submarineStealthBonus": "empire",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "andrew_cunningham",
      "name": "安德鲁·坎宁安",
      "englishName": "Andrew Cunningham",
      "classKey": "admiral",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 1310,
      "targetRequirement": "carrier_or_naval_base",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_carrier_strike_and_free_aircraft",
      "recipeParams": {
        "carrierBomberDamageMultiplier": 1.25,
        "freeFighterAircraft": 1
      },
      "effectDescription": "常态光环：2格范围内现代海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：塔兰托舰载机夜袭——驻泊航母战机伤害提升 25%，并立即免费获赠 1 架编制战机。",
      "historicalBiography": "英国海军元帅，二战地中海舰队司令，以塔兰托战役首开航母舰载机夜袭敌港先河，并在马塔潘角海战中沉重打击意大利海军，保障盟军地中海航线安全。",
      "effectScopes": {
        "carrierBomberDamageMultiplier": "carrier_or_base",
        "freeFighterAircraft": "carrier_or_base"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "william_halsey",
      "name": "威廉·哈尔西",
      "englishName": "William Halsey Jr.",
      "classKey": "admiral",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 1490,
      "targetRequirement": "naval_warship",
      "aura": {
        "applicableEras": [
          4,
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "retire_turtle_ship_ironclad",
      "recipeParams": {
        "targetNavalCombatBonus": 8,
        "targetArmorDefenseBonus": 6,
        "freeNavalPromotion": 1
      },
      "effectDescription": "常态光环：2格范围内现代海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：第三舰队狂飙——目标战舰永久战力 +8、防御 +6，并免费获得 1 次战术晋升。",
      "historicalBiography": "美国海军五星上将，绰号“蛮牛”，二战太平洋战争第三舰队司令，在瓜达尔卡纳尔岛海战与莱特湾海战中以极具侵略性的航母快速特混舰队作战闻名于世。",
      "effectScopes": {
        "targetNavalCombatBonus": "target_naval_unit",
        "targetArmorDefenseBonus": "target_naval_unit",
        "freeNavalPromotion": "target_naval_unit"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "sergey_gorshkov",
      "name": "谢尔盖·戈尔什科夫",
      "englishName": "Sergey Gorshkov",
      "classKey": "admiral",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "naval_submarine_or_destroyer",
      "aura": {
        "applicableEras": [
          5,
          6
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 1,
        "domain": "sea",
        "artilleryRange": 0,
        "special": "none"
      },
      "recipeType": "nuclear_navy_propulsion",
      "recipeParams": {
        "submarineSpeedBonus": 2,
        "submarineStealthBonus": 1,
        "eurekaTechs": [
          "nuclearfission"
        ]
      },
      "effectDescription": "常态光环：2格范围内信息海军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：蓝水核潜大洋学说——全国潜艇移动力 +2、隐匿侦测 +1 格，解锁《核裂变》尤里卡。",
      "historicalBiography": "苏联海军元帅，现代远洋导弹核海军奠基人，著有经典巨作《国家的海上威力》，将苏联近岸防御海军转变为由核动力潜艇与导弹巡洋舰组成的全球蓝水远洋舰队。",
      "effectScopes": {
        "submarineSpeedBonus": "empire",
        "submarineStealthBonus": "empire",
        "eurekaTechs": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": [
          "naval"
        ],
        "durationCycles": null,
        "radius": 2,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "zoroaster",
      "name": "索罗亚斯德",
      "englishName": "Zoroaster (Zarathustra)",
      "classKey": "prophet",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 60,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 120,
        "relicGrant": true
      },
      "effectDescription": "在圣地激活：若未创立宗教，立即免费创立宗教（无需消耗120信仰）；若已创教，立即获得 120 信仰储备并获赠一件神圣遗物巨作（放入圣地槽位）。",
      "historicalBiography": "古代波斯琐罗亚斯德教（拜火教）先知与神学改革者，倡导善恶二元论与“善思、善言、善行”道德三原则，深远影响人类一神教文明发展。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "relicGrant": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "moses",
      "name": "摩西",
      "englishName": "Moses",
      "classKey": "prophet",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 75,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 140,
        "holySiteCultureBonus": 2
      },
      "effectDescription": "在圣地激活：若未创立宗教，立即免费创立宗教；若已创教，立即获得 140 信仰储备，所在圣地每周期产出 +2 文化、+4 信仰。",
      "historicalBiography": "古代犹太民族领袖与立法者，率领以色列人出埃及渡红海脱离奴役，在西奈山领受上帝十诫，奠定一神教律法法度基础。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "holySiteCultureBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "akhenaten",
      "name": "阿肯那顿",
      "englishName": "Akhenaten",
      "classKey": "prophet",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 90,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 160,
        "relicGrant": 1,
        "cityFaithBonus": 3
      },
      "effectDescription": "在圣地激活：若未创教则立即免费创立宗教；若已创教则获得 160 信仰储备并获赠 1 件神圣遗物，圣地所在城市每周期信仰产出 +3。",
      "historicalBiography": "古埃及第十八王朝法老，埃赫那吞，发动人类历史上最早有记录的一神教宗教改革，废黜阿蒙神庙特权确立太阳神阿顿为唯一崇拜对象并营建新都阿玛纳。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "relicGrant": "activation_city",
        "cityFaithBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "gautama_buddha",
      "name": "乔达摩·悉达多",
      "englishName": "Gautama Buddha",
      "classKey": "prophet",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 120,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 150,
        "cityAmenityBonus": 2,
        "religionPressureRadius4": true
      },
      "effectDescription": "在圣地激活：免费创立宗教（或获得 150 信仰储备）；所在城市永久 +2 宜居度，并将宗教真理辐射覆盖周围 4 格内所有聚落。",
      "historicalBiography": "古印度迦毗罗卫国王子，舍弃荣华出家修行，在菩提树下悟道证得正觉，宣讲四圣谛与八正道，创立世界三大宗教之一的佛教。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "cityAmenityBonus": "activation_city",
        "religionPressureRadius4": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "confucius",
      "name": "孔子",
      "englishName": "Confucius",
      "classKey": "prophet",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 150,
      "targetRequirement": "holy_site_or_capital",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 100,
        "empireCityCultureBonus": 1,
        "cityLoyaltyBonus": 2
      },
      "effectDescription": "在圣地或首都激活：免费创立宗教（或获 100 信仰）；全国每座城市文化每周期 +1，全国城市抗叛乱忠诚度每周期 +2。",
      "historicalBiography": "春秋末期鲁国著名思想家、教育家与政治家，儒家学派创始人，主张“仁”与“礼”，开创有教无类平民私学，被尊为至圣先师。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "empireCityCultureBonus": "empire",
        "cityLoyaltyBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "laozi",
      "name": "老子",
      "englishName": "Laozi",
      "classKey": "prophet",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 180,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 160,
        "cityScienceBonus": 3,
        "cityFaithBonus": 3
      },
      "effectDescription": "在圣地激活：免费创立宗教（或获得 160 信仰）；所在城市每周期额外 +3 科技、+3 信仰（道法自然悟万物之理）。",
      "historicalBiography": "春秋末期著名哲学家、思想家，道家学派创始人，所著五千言《道德经》阐发“道法自然”、“无为而治”宇宙生成与辩证哲学精粹。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "cityScienceBonus": "activation_city",
        "cityFaithBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "paul_the_apostle",
      "name": "使徒保罗",
      "englishName": "Paul the Apostle",
      "classKey": "prophet",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 210,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 180,
        "spreadForeignCitiesInstant": 2
      },
      "effectDescription": "在圣地激活：免费创立宗教（或获 180 信仰）；并立即将该宗教自动传播至两座最近的外国邻邦城市。",
      "historicalBiography": "早期基督教最杰出传教使徒与神学家，四次横跨地中海传教旅行，建立小亚细亚与欧洲教会，撰写新约核心书信确立普世教会神学体系。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "spreadForeignCitiesInstant": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "mani",
      "name": "摩尼",
      "englishName": "Mani",
      "classKey": "prophet",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 180,
        "relicGrant": 1,
        "spreadForeignCitiesInstant": 2
      },
      "effectDescription": "在圣地激活：若未创教则立即免费创立宗教；若已创教则获 180 信仰储备并获赠神圣遗物，且立即向周围 2 座未信教外国城市传播本国主流宗教。",
      "historicalBiography": "摩尼教创始人，波斯萨珊王朝哲学家兼画家，融合琐罗亚斯德教、基督教与佛教思想创立光暗二元论世界宗教，其著作亲自配插画并传布欧亚大陆。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "relicGrant": "activation_city",
        "spreadForeignCitiesInstant": "foreign_cities"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "adi_shankara",
      "name": "阿迪·商羯罗",
      "englishName": "Adi Shankara",
      "classKey": "prophet",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 270,
      "targetRequirement": "holy_site_or_campus",
      "recipeType": "theology_philosophy_fusion",
      "recipeParams": {
        "instantFaith": 200,
        "campusFaithBonus": 2,
        "holySiteScienceBonus": 2
      },
      "effectDescription": "在圣地或学院激活：获得 200 信仰储备；全国所有学院额外产出 +2 信仰，所有圣地额外产出 +2 科技（不二论心物一元哲思）。",
      "historicalBiography": "印度中世纪早期哲学家与吠檀多不二论宗师，在印度四方建立四大修道院，通过严密逻辑思辨复兴印度教哲学传统并统摄多派思想为梵我不二神髓。",
      "effectScopes": {
        "instantFaith": "empire",
        "campusFaithBonus": "empire",
        "holySiteScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "thomas_aquinas",
      "name": "托马斯·阿奎那",
      "englishName": "Thomas Aquinas",
      "classKey": "prophet",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 240,
      "targetRequirement": "holy_site_or_campus",
      "recipeType": "theology_philosophy_fusion",
      "recipeParams": {
        "instantFaith": 200,
        "campusFaithBonus": 2,
        "holySiteScienceBonus": 2
      },
      "effectDescription": "在圣地或学院激活：获得 200 信仰储备；全国所有学院额外产出 +2 信仰，全国所有圣地额外产出 +2 科技（信仰与理性圆融）。",
      "historicalBiography": "中世纪经院哲学与神学泰斗，道明会士，著有《神学大全》，融汇亚里士多德哲学与基督教教义，提出证明上帝存在的五路逻辑论证。",
      "effectScopes": {
        "instantFaith": "empire",
        "campusFaithBonus": "empire",
        "holySiteScienceBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "martin_luther",
      "name": "马丁·路德",
      "englishName": "Martin Luther",
      "classKey": "prophet",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "holy_site_district",
      "recipeType": "religious_reform_burst",
      "recipeParams": {
        "instantFaith": 250,
        "instantCulture": 100,
        "freeCivicInspiration": "reform"
      },
      "effectDescription": "在圣地激活：获得 250 信仰与 100 文化储备，立即解锁市政《宗教改革》鼓舞提升，全国每座城市忠诚度 +2。",
      "historicalBiography": "德意志神学家、维滕堡大学教授，发表《九十五条论纲》批判赎罪券交易，主张“因信称义”与圣经译本大众化，点燃欧洲宗教改革烈焰。",
      "effectScopes": {
        "instantFaith": "empire",
        "instantCulture": "empire",
        "freeCivicInspiration": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "francis_of_assisi",
      "name": "阿西西的圣方济各",
      "englishName": "Francis of Assisi",
      "classKey": "prophet",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 1,
      "baseThreshold": 360,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 200,
        "relicGrant": 1,
        "cityAmenityBonus": 2
      },
      "effectDescription": "在圣地激活：若未创教则立即免费创立宗教；若已创教则获 200 信仰储备并获赠 1 件神圣遗物，圣地所在城市宜居度永久 +2（万物和睦）。",
      "historicalBiography": "天主教方济各会（方济各小兄弟会）创始人，倡导绝对清贫修道、热爱自然与造物，相传能与飞鸟林兽对话传道，被尊为天主教自然与和平主保圣人。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "relicGrant": "activation_city",
        "cityAmenityBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "rumi",
      "name": "贾拉勒丁·鲁米",
      "englishName": "Jalal al-Din Rumi",
      "classKey": "prophet",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 220,
        "relicGrant": 1,
        "holySiteCultureBonus": 3
      },
      "effectDescription": "在圣地激活：若未创教则立即免费创立宗教；若已创教则获 220 信仰储备并获赠神圣遗物，圣地所在城市每周期文化产出 +3（托钵僧狂喜之诗）。",
      "historicalBiography": "波斯苏菲派伊斯兰神秘主义诗人与精神宗师，著有《精神玛斯纳维》等流芳百世的灵性史诗，创立以旋转托钵舞（Sema）寻求神圣合一的梅夫拉维苏菲教团。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "relicGrant": "activation_city",
        "holySiteCultureBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "xuanzang",
      "name": "玄奘",
      "englishName": "Xuanzang",
      "classKey": "prophet",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 1,
      "baseThreshold": 480,
      "targetRequirement": "holy_site_or_campus",
      "recipeType": "theology_philosophy_fusion",
      "recipeParams": {
        "instantFaith": 220,
        "campusFaithBonus": 2,
        "holySiteScienceBonus": 2
      },
      "effectDescription": "在圣地或学院激活：获得 220 信仰储备；全国所有学院额外产出 +2 信仰，所有圣地额外产出 +2 科技（西行取经大乘唯识经论圆满）。",
      "historicalBiography": "唐代著名高僧、法相唯识宗祖师兼大翻译家，西行五万里历经艰险赴天竺那烂陀寺求法，归国后翻译巨量佛经并撰写地理巨著《大唐西域记》。",
      "effectScopes": {
        "instantFaith": "empire",
        "campusFaithBonus": "empire",
        "holySiteScienceBonus": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "bodhidharma",
      "name": "菩提达摩",
      "englishName": "Bodhidharma",
      "classKey": "prophet",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 1,
      "baseThreshold": 540,
      "targetRequirement": "holy_site_district",
      "recipeType": "evangelize_religion_burst",
      "recipeParams": {
        "freeReligionFounding": true,
        "instantFaith": 200,
        "relicGrant": 1,
        "cityLoyaltyBonus": 3
      },
      "effectDescription": "在圣地激活：若未创教则立即免费创立宗教；若已创教则获 200 信仰储备并获赠神圣遗物，圣地所在城市忠诚度每周期 +3（面壁九年直指人心）。",
      "historicalBiography": "中国禅宗初祖、天竺禅僧，南朝时期渡海东来，于嵩山少林寺面壁九年传授大乘壁观法门，倡导“教外别传、不立文字、直指人心、见性成佛”。",
      "effectScopes": {
        "freeReligionFounding": "empire",
        "instantFaith": "empire",
        "relicGrant": "activation_city",
        "cityLoyaltyBonus": "activation_city"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "john_calvin",
      "name": "让·加尔文",
      "englishName": "John Calvin",
      "classKey": "prophet",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 420,
      "targetRequirement": "holy_site_district",
      "recipeType": "religious_reform_burst",
      "recipeParams": {
        "instantFaith": 250,
        "instantCulture": 100,
        "freeCivicInspiration": "reform"
      },
      "effectDescription": "在圣地激活：获得 250 信仰与 100 文化储备，立即解锁市政《宗教改革》（reform）鼓舞，全国城市忠诚度稳固提升。",
      "historicalBiography": "欧洲宗教改革巨匠、加尔文宗（归正宗）创始人，著有《基督教要义》，确立严格的神权共和政制与预定论神学体系，深刻塑造近代西方契约与伦理观念。",
      "effectScopes": {
        "instantFaith": "empire",
        "instantCulture": "empire",
        "freeCivicInspiration": "empire"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "enheduanna",
      "name": "恩希杜安娜",
      "englishName": "Enheduanna",
      "classKey": "writer",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 60,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《因奈娜的赞歌》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《苏美尔神庙赞歌》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部人类最早署名传世泥板文学巨作（《因奈娜的赞歌》、《苏美尔神庙赞歌》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "阿卡德帝国公主、乌尔月神南纳神庙最高女祭司，人类历史上已知首位留下独立署名的女性文学家与诗人，创作大量赞美苏美尔女神因奈娜的庄严灵性诗篇。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "homer",
      "name": "荷马",
      "englishName": "Homer",
      "classKey": "writer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 120,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《伊利亚特》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《奥德赛》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部传世文学巨作（《伊利亚特》、《奥德赛》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古希腊盲诗人，相传为西方古典叙事史诗《伊利亚特》与《奥德赛》作者，特洛伊战争与奥德修斯历险故事成为西方文学滥觞源泉。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "qu_yuan",
      "name": "屈原",
      "englishName": "Qu Yuan",
      "classKey": "writer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 150,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《离骚》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《九歌》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有空余文学槽位的城市创作一部楚辞文学巨作（《离骚》、《九歌》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "战国楚国贵族大夫、杰出浪漫主义爱国诗人，开创长篇骚体楚辞文学先河，行吟泽畔投汨罗江明志，端午节溯源纪念其爱国气节。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "virgil",
      "name": "维吉尔",
      "englishName": "Virgil",
      "classKey": "writer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 180,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《埃涅阿斯纪》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《农事诗》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部古罗马黄金时代史诗巨作（《埃涅阿斯纪》、《农事诗》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古罗马奥古斯都时代最伟大的抒情与叙事诗人，创作史诗《埃涅阿斯纪》为罗马文明奠定崇高史诗神话起源，深刻影响后世西方古典文学数千年。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "sima_qian",
      "name": "司马迁",
      "englishName": "Sima Qian",
      "classKey": "writer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 210,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《史记·项羽本纪》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《史记·货殖列传》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部纪传体通史传世巨作（《史记》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "西汉史学家、文学家，太史令，忍辱负重历经十余年著成中国第一部纪传体通史《史记》，被鲁迅誉为“史家之绝唱，无韵之《离骚》”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "kalidasa",
      "name": "迦梨陀娑",
      "englishName": "Kalidasa",
      "classKey": "writer",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 240,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《沙恭达罗》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《云使》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部古印度梵语古典戏剧与抒情诗巨作（《沙恭达罗》、《云使》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古印度笈多王朝最伟大的梵语诗人和剧作家，被誉为“印度的莎士比亚”，其戏剧《沙恭达罗》与抒情长诗《云使》格律严整、辞藻清丽，为东方文学明珠。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "du_fu",
      "name": "杜甫",
      "englishName": "Du Fu",
      "classKey": "writer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 240,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《春望》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《茅屋为秋风所破歌》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有空槽的城市创作一部传世名篇（《春望》、《茅屋为秋风所破歌》），每部巨作每周期 +2 文化、+2 旅游。",
      "historicalBiography": "唐代伟大现实主义诗人，“诗圣”，经历安史之乱流离漂泊，其诗沉郁顿挫、悲悯家国苍生，被称为“诗史”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "dante_alighieri",
      "name": "但丁·阿利吉耶里",
      "englishName": "Dante Alighieri",
      "classKey": "writer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 300,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《地狱篇 (神曲)》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《天堂篇 (神曲)》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有空余文学槽位的城市创作一部神学史诗巨作（《神曲》地狱篇与天堂篇），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "意大利佛罗伦萨中世纪晚期诗人、文艺复兴先驱，以托斯卡纳方言撰写旷世宏伟史诗《神曲》，被恩格斯赞誉为“中世纪的最后一位诗人，新时代的最初一位诗人”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "li_bai",
      "name": "李白",
      "englishName": "Li Bai",
      "classKey": "writer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 360,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《将进酒》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《蜀道难》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部盛唐浪漫主义绝唱诗歌巨作（《将进酒》、《蜀道难》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "唐代伟大的浪漫主义诗人，字太白，号青莲居士，被后世尊为“诗仙”，其诗歌奔放豪迈、意象神奇莫测，将盛唐文化自信推至中国古典文学巅峰。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "murasaki_shikibu",
      "name": "紫式部",
      "englishName": "Murasaki Shikibu",
      "classKey": "writer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 420,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《源氏物语·桐壶》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《源氏物语·葵》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部世界上最早的长篇写实小说巨作（《源氏物语》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "日本平安时代中期女性作家与宫廷女官，创作出世界上最早的长篇写实写情小说《源氏物语》，以物哀之美深刻奠定日本传统审美与文学心理结构。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "geoffrey_chaucer",
      "name": "杰弗里·乔叟",
      "englishName": "Geoffrey Chaucer",
      "classKey": "writer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 480,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《坎特伯雷故事集》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《特洛伊罗斯与克丽西达》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部中古英语文学奠基巨作（《坎特伯雷故事集》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "英国中世纪文学家与宫廷重臣，被尊为“英国诗歌之父”，率先使用伦敦方言中古英语写作，其《坎特伯雷故事集》生动描绘中世纪英国各阶层人物群像。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "ferdowsi",
      "name": "菲尔多西",
      "englishName": "Ferdowsi",
      "classKey": "writer",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 2,
      "baseThreshold": 540,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《列王纪·鲁斯塔姆与苏赫拉布》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《列王纪·扎哈克与法里敦》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部波斯民族不朽民族史诗巨作（《列王纪》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "波斯中世纪伟大诗人，历时三十余载撰写六万余行民族史诗《列王纪》（波斯之王），在阿拉伯化浪潮中以纯净波斯语复活古代波斯神话与历史记忆。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "william_shakespeare",
      "name": "威廉·莎士比亚",
      "englishName": "William Shakespeare",
      "classKey": "writer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 420,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《哈姆雷特》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《罗密欧与朱丽叶》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有空槽的城市创作一部传世戏剧悲剧巨作（《哈姆雷特》、《罗密欧与朱丽叶》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "英国文艺复兴时期剧作家、诗人，雅号“艾芬河吟游诗人”，创作四大悲剧与四大喜剧，对英语语言与西方戏剧艺术产生不可磨灭的划时代影响。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "miguel_de_cervantes",
      "name": "米格尔·德·塞万提斯",
      "englishName": "Miguel de Cervantes",
      "classKey": "writer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 510,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《堂吉诃德（上卷）》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《堂吉诃德（下卷）》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有空余槽位的城市创作一部近代小说巨作（《堂吉诃德》上下卷），每部巨作产出 +2 文化、+2 旅游。",
      "historicalBiography": "西班牙黄金时代小说家、诗人与剧作家，勒班陀海战英勇负伤，所著讽刺骑士文学巨作《堂吉诃德》被公认为现代欧洲长篇小说的第一奠基之作。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "wu_chengen",
      "name": "吴承恩",
      "englishName": "Wu Cheng'en",
      "classKey": "writer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 600,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《西游记·大闹天宫》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《西游记·三打白骨精》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部东方神魔奇幻浪漫主义通俗小说巨作（《西游记》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "明代著名文学家，字汝忠，号射阳山人，搜集民间传说融汇三教哲学著成四大名著之一《西游记》，以奇崛瑰丽想象构筑东方神话世界体系。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "moliere",
      "name": "莫里哀",
      "englishName": "Molière",
      "classKey": "writer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 690,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《伪君子》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《悭吝人》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部法国古典主义喜剧讽刺剧作（《伪君子》、《悭吝人》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "法国古典主义喜剧大师、戏剧编导与演员，开创法国近代古典戏剧风尚，以辛辣幽默的现实主义讽刺鞭挞贵族虚伪、教会伪善与守财奴丑态。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "john_milton",
      "name": "约翰·弥尔顿",
      "englishName": "John Milton",
      "classKey": "writer",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 780,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《失乐园》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《复乐园》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部英国清教徒革命神圣史诗巨作（《失乐园》、《复乐园》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "英国诗人、政论家与思想家，在双目失明后口述完成宏伟史诗《失乐园》，以庄严无韵诗探索自由意志、原罪救赎与人类不屈的反抗精神。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "cao_xueqin",
      "name": "曹雪芹",
      "englishName": "Cao Xueqin",
      "classKey": "writer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 650,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《红楼梦（前四十回）》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《红楼梦（中四十回）》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次创作古典长篇小说文学巨作（《红楼梦》），每部巨作每周期产出 +2 文化、+2 旅游。",
      "historicalBiography": "清代满洲正白旗包衣出身作家，历经家族钟鸣鼎食至抄家败落，“披阅十载，增删五次”创作章回体古典小说巅峰《红楼梦》，开创中国红学百年学科。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "johann_wolfgang_goethe",
      "name": "约翰·沃尔夫冈·冯·歌德",
      "englishName": "Johann Wolfgang von Goethe",
      "classKey": "writer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 780,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《浮士德》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《少年维特之烦恼》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次创作一部古典诗剧巨作（《浮士德》、《少年维特之烦恼》），每部巨作产出 +2 文化、+2 旅游。",
      "historicalBiography": "德意志魏玛古典主义大师、博学通才，历时六十载创作两卷悲剧《浮士德》，将人类永不止息的求索抗争精神升华至哲学艺术巅峰。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "leo_tolstoy",
      "name": "列夫·托尔斯泰",
      "englishName": "Leo Tolstoy",
      "classKey": "writer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 910,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《战争与和平》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《安娜·卡列尼娜》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次创作一部现实主义文学史诗巨作（《战争与和平》、《安娜·卡列尼娜》），每部巨作每周期产出 +2 文化、+2 旅游。",
      "historicalBiography": "俄罗斯批判现实主义作家、思想家，著有宏篇巨制《战争与和平》与《复活》，深刻剖析拿破仑战争风云与沙俄社会灵魂，列宁赞其为“俄国革命的镜子”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "victor_hugo",
      "name": "维克多·雨果",
      "englishName": "Victor Hugo",
      "classKey": "writer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 1040,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《悲惨世界》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《巴黎圣母院》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部法国浪漫主义人道主义长篇小说巨作（《悲惨世界》、《巴黎圣母院》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "法国浪漫主义文学运动领袖、人道主义思想巨擘，以雄浑博大的同情心描绘底层苦难与崇高人性，《悲惨世界》与《巴黎圣母院》享誉全球文明殿堂。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "edgar_allan_poe",
      "name": "埃德加·爱伦·坡",
      "englishName": "Edgar Allan Poe",
      "classKey": "writer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 1170,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《乌鸦》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《厄舍府的倒塌》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部哥特式恐怖悬疑与现代侦探推理开山巨作（《乌鸦》、《厄舍府的倒塌》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "美国十九世纪诗人、短篇小说家与文学评论家，现代侦探小说之父与科幻小说先驱，其哥特式阴郁迷离诗文与严密心理推理深刻塑造现代通俗与象征主义文学。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "jane_austen",
      "name": "简·奥斯汀",
      "englishName": "Jane Austen",
      "classKey": "writer",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 5,
      "charges": 2,
      "baseThreshold": 1300,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《傲慢与偏见》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《理智与情感》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部英国现实主义世态风俗与女性心理经典长篇小说（《傲慢与偏见》、《理智与情感》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "英国十九世纪杰出女作家，以“二寸牙雕”般的精微观察与幽默反讽笔触剖析乡村中产社会世态人情，开启英国近代现实主义长篇小说新风尚。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "lu_xun",
      "name": "鲁迅",
      "englishName": "Lu Xun",
      "classKey": "writer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 950,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《狂人日记》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《呐喊·阿Q正传》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "amenity": 1
          },
          "description": "激活城市永久获得 +1 宜居度（随首次激活绑定该城，作品转移不影响城市宜居度）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部现代白话批判文学巨作（《狂人日记》、《阿Q正传》），每部巨作产出 +2 文化、+2 旅游，本城宜居度 +1。",
      "historicalBiography": "中国现代文学主要奠基人、新文化运动旗手与思想家，弃医从文以犀利投枪匕首般的文字揭露封建礼教“吃人”本质，唤醒国民觉醒反思灵魂。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "rabindranath_tagore",
      "name": "罗宾德拉纳特·泰戈尔",
      "englishName": "Rabindranath Tagore",
      "classKey": "writer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 1130,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《吉檀迦利》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《飞鸟集》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部东方哲理诗歌巨作（《吉檀迦利》、《飞鸟集》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "印度近代伟大诗人、哲学家与社会活动家，首位获得诺贝尔文学奖的亚洲作家，其诗歌清澈灵动如晨曦甘露，倡导世界大同、人类精神博爱与自然和谐。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "james_joyce",
      "name": "詹姆斯·乔伊斯",
      "englishName": "James Joyce",
      "classKey": "writer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 1310,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《尤利西斯》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《都柏林人》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部现代主义意识流长篇文学丰碑（《尤利西斯》、《都柏林人》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "爱尔兰现代主义作家与诗人，二十世纪最重要的先锋派小说大师，以庞杂典故、多声部语言实验与严密意识流结构在《尤利西斯》中重塑小说艺术形式。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "gabriel_garcia_marquez",
      "name": "加夫列尔·加西亚·马尔克斯",
      "englishName": "Gabriel García Márquez",
      "classKey": "writer",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 1490,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《百年孤独》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《霍乱时期的爱情》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部拉丁美洲魔幻现实主义长篇巅峰巨作（《百年孤独》、《霍乱时期的爱情》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "哥伦比亚作家、记者，拉丁美洲文学爆炸领军人物，1982年诺贝尔文学奖得主，以魔幻与写实交织的布恩迪亚家族七代兴衰折射拉美大陆近代沧桑历史命运。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "jorge_luis_borges",
      "name": "豪尔赫·路易斯·博尔赫斯",
      "englishName": "Jorge Luis Borges",
      "classKey": "writer",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 1300,
      "targetRequirement": "city_with_writing_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "writing",
        "works": [
          {
            "title": "《沙之书》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《阿莱夫》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在拥有可用文学槽位的城市创作一部后现代迷宫与无限维度哲学幻想短篇集（《阿莱夫》、《沙之书》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "阿根廷诗人、散文家与短篇小说大师，通晓多国语言，精通迷宫、镜子、无限图书馆等玄奥象征，被誉为“作家中的作家”与后现代超文本先驱。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "thutmose_sculptor",
      "name": "图特摩斯（雕塑家）",
      "englishName": "Thutmose (Sculptor)",
      "classKey": "artist",
      "era": 0,
      "eraName": "远古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 60,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《娜芙蒂蒂半身像》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《阿肯那顿雕像残片》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部古埃及阿玛纳写实雕塑巨作（《娜芙蒂蒂半身像》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古埃及第十八王朝阿玛纳时期皇家首席宫廷雕刻大师，打破古埃及传统僵化神化造像规则，以惊人的写实优雅刻画出举世闻名的娜芙蒂蒂王后石灰石半身像。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "gu_kaizhi",
      "name": "顾恺之",
      "englishName": "Gu Kaizhi",
      "classKey": "artist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 120,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《洛神赋图》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《女史箴图》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部传世古卷艺术巨作（《洛神赋图》、《女史箴图》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "东晋杰出画家、绘画理论家，时称“才绝、画绝、痴绝”，提出“传神写照，正在阿堵中”、“以形写神”理论，奠定中国传统人物画学根基。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "wang_xizhi",
      "name": "王羲之",
      "englishName": "Wang Xizhi",
      "classKey": "artist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 150,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《兰亭集序》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《快雪时晴帖》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "cultureMultiplier": 0.1
          },
          "description": "激活城市永久获得 +10% 文化产出（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部书法书法艺术巨作（《兰亭集序》、《快雪时晴帖》），每部产出 +2 文化、+2 旅游，所在城文化 +10%。",
      "historicalBiography": "东晋著名书法家，“书圣”，行书笔势“飘若浮云，矫若惊龙”，会稽山阴兰亭曲水流觞挥毫写就《兰亭集序》，被公推为“天下第一行书”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "phidias",
      "name": "菲迪亚斯",
      "englishName": "Phidias",
      "classKey": "artist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 180,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《奥林匹亚宙斯巨像》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《雅典娜·帕特农神像》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部古希腊黄金时代古典雕塑丰碑（《奥林匹亚宙斯巨像》、《雅典娜·帕特农》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古希腊古典盛期最伟大的雕刻大师与建筑总监，主持雅典卫城帕特农神庙浮雕创作，用黄金与象牙精铸古代世界七大奇迹之一的奥林匹亚宙斯神像。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "polykleitos",
      "name": "波留克列特斯",
      "englishName": "Polykleitos",
      "classKey": "artist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 210,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《持矛者》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《系发带者》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部完美人体比例典范青铜雕塑（《持矛者》、《系发带者》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古希腊阿戈斯派雕塑大师兼艺术理论家，著有《法则》（Canon），确立七头身黄金人体比例法则与经典“对立平衡”（Contrapposto）人体姿态。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "apelles",
      "name": "阿佩利斯",
      "englishName": "Apelles",
      "classKey": "artist",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 240,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《出水芙蓉的阿芙罗狄忒》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《手持雷电的亚历山大》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部古希腊传奇怪诞画艺壁画肖像（《出水芙蓉的阿芙罗狄忒》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "古希腊时期被公认技艺最高的传奇画家，亚历山大大帝唯一钦准画像师，善用明暗对照与多层清漆薄涂技法，被老普林尼赞为“无可匹敌的画圣”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "wu_daozi",
      "name": "吴道子",
      "englishName": "Wu Daozi",
      "classKey": "artist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 240,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《送子天王图》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《八十七神仙卷》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次创作一部唐代重彩壁画艺术巨作（《送子天王图》、《八十七神仙卷》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "盛唐著名宫廷画家，“画圣”，擅绘佛道人物与山水，线条遒劲顿挫宛若飞动，世称“吴带当风”，在长安洛阳寺观绘制巨幅壁画三百余堵。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "zhang_zeduan",
      "name": "张择端",
      "englishName": "Zhang Zeduan",
      "classKey": "artist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 1,
      "baseThreshold": 300,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《清明上河图》",
            "culture": 4,
            "tourism": 4
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "goldMultiplier": 0.15
          },
          "description": "激活城市永久获得 +15% 金币产出（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "在建有艺术馆的城市创作北宋市井全景艺术长卷《清明上河图》，单部巨作产出 +4 文化、+4 旅游，本城金币产出 +15%。",
      "historicalBiography": "北宋徽宗朝翰林图画院画家，精工界画、车马人物与桥梁市井，以高超全景散点透视描绘北宋都城汴京汴河两岸繁盛风貌与平民百态。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "yan_liben",
      "name": "阎立本",
      "englishName": "Yan Liben",
      "classKey": "artist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 360,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《历代帝王图》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《步辇图》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部初唐宫廷人物画国宝长卷（《历代帝王图》、《步辇图》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "唐代杰出画家、建筑家兼宰相（右相），擅长人物肖像与历史事件纪实绘画，《步辇图》生动记录唐太宗接见吐蕃松赞干布迎亲使臣禄东赞历史盛事。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "giotto_di_bondone",
      "name": "乔托·迪·邦多内",
      "englishName": "Giotto di Bondone",
      "classKey": "artist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 420,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《哀悼基督》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《犹大之吻》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部意大利早期文艺复兴开山湿壁画巨作（《哀悼基督》、《犹大之吻》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "意大利中世纪晚期佛罗伦萨画家与建筑师，被尊为“欧洲绘画之父”，打破拜占庭呆板金底画风，将真实空间透视、自然光影与深沉人类情感引入湿壁画。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "fan_kuan",
      "name": "范宽",
      "englishName": "Fan Kuan",
      "classKey": "artist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 480,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《溪山行旅图》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《雪景寒林图》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部北宋全景崇高山水画巅峰神品（《溪山行旅图》、《雪景寒林图》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "北宋杰出山水画家，常年居于终南、华山深林，体悟“前人之法未尝不近取诸物，吾与其师于人者，未若师诸物也”，所作《溪山行旅图》雄浑博大万世标尺。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "andrei_rublev",
      "name": "安德烈·鲁布烈夫",
      "englishName": "Andrei Rublev",
      "classKey": "artist",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 5,
      "charges": 2,
      "baseThreshold": 540,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《三位一体圣像》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《救世主像》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部俄罗斯中世纪东正教灵圣圣像画神品（《三位一体》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "俄罗斯中世纪最著名的东正教修士画家与圣像画宗师，其代表作《三位一体》以空灵纯净的圆形构图、温润天蓝与静谧和平境界代表古罗斯艺术巅峰。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "michelangelo",
      "name": "米开朗基罗",
      "englishName": "Michelangelo Buonarroti",
      "classKey": "artist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 420,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "雕塑《大卫》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "壁画《创世纪（西斯廷天顶画）》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "wonderProductionMultiplier": 0.1
          },
          "description": "激活城市在建奇观生产力永久 +10%（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部文艺复兴雕塑或壁画巨作（《大卫》、《西斯廷天顶画》），每部产出 +2 文化、+2 旅游，本城奇观建造加速 10%。",
      "historicalBiography": "意大利文艺复兴三杰之一，雕塑家、画家与建筑大师，在卡拉拉大理石中释放人体雄浑生命力，四年仰头绘制梵蒂冈西斯廷穹顶宏图。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "raphael",
      "name": "拉斐尔·桑西",
      "englishName": "Raphael Sanzio",
      "classKey": "artist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 510,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "壁画《雅典学院》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "油画《西斯廷圣母》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "science": 2
          },
          "description": "激活城市每周期永久 +2 科技（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部古典和谐湿壁画艺术巨作（《雅典学院》、《西斯廷圣母》），每部产出 +2 文化、+2 旅游，本城科技 +2。",
      "historicalBiography": "意大利文艺复兴盛期杰出画家，以典雅优美、构图严谨明净著称，梵蒂冈教皇签字厅壁画《雅典学院》展现哲人学者共聚探讨真理的辉煌图景。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "rembrandt",
      "name": "伦勃朗·凡·莱因",
      "englishName": "Rembrandt van Rijn",
      "classKey": "artist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 600,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "油画《夜巡》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "油画《自画像》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "gold": 3
          },
          "description": "激活城市每周期永久 +3 金币（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部荷兰明暗对照油画艺术巨作（《夜巡》、《自画像》），每部产出 +2 文化、+2 旅游，本城金币 +3。",
      "historicalBiography": "荷兰黄金时代最伟大的油画与版画大师，精妙运用明暗对照法（Chiaroscuro）刻画人物心理与光影纵深，名作《夜巡》革新传统团体肖像范式。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "sandro_botticelli",
      "name": "桑德罗·波提切利",
      "englishName": "Sandro Botticelli",
      "classKey": "artist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 690,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《维纳斯的诞生》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《春》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部佛罗伦萨文艺复兴优雅灵动油画神品（《维纳斯的诞生》、《春》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "意大利佛罗伦萨文艺复兴早期大师，美第奇家族庇护下的艺术天才，以秀美线条、优雅神态与新柏拉图主义寓意作画，《维纳斯的诞生》与《春》为西方美术黄金经典。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "albrecht_durer",
      "name": "阿尔布雷希特·丢勒",
      "englishName": "Albrecht Dürer",
      "classKey": "artist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 780,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《忧郁 I》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《野兔》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部北方文艺复兴铜版画精微神品（《忧郁 I》、《野兔》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "德意志文艺复兴大师、版画家与数学家，将意大利严谨透视解剖学说与日耳曼精微写实传统完美结合，其版画《忧郁 I》深邃玄奥影响深远。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "johannes_vermeer",
      "name": "约翰内斯·维米尔",
      "englishName": "Johannes Vermeer",
      "classKey": "artist",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 5,
      "charges": 2,
      "baseThreshold": 870,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《戴珍珠耳环的少女》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《倒牛奶的女仆》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部荷兰黄金时代室内光影油画珍品（《戴珍珠耳环的少女》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "荷兰黄金时代杰出风俗画家，代尔夫特画家，善用暗箱透视与昂贵青金石群青颜料捕捉柔和窗光颗粒质感，《戴珍珠耳环的少女》被誉为“北方的蒙娜丽莎”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "katsushika_hokusai",
      "name": "葛饰北斋",
      "englishName": "Katsushika Hokusai",
      "classKey": "artist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 650,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "浮世绘《神奈川冲浪里》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "浮世绘《凯风快晴（红富士）》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次创作一部日本浮世绘版画艺术巨作（《神奈川冲浪里》、《红富士》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "日本江户时代晚期浮世绘版画大师，所绘《富岳三十六景》以波澜壮阔的浪涛与富士山构图风靡世界，对欧洲印象派莫奈、梵高等产生深远影响。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "claude_monet",
      "name": "克劳德·莫奈",
      "englishName": "Claude Monet",
      "classKey": "artist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 780,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "油画《日出·印象》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "油画《睡莲》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "amenity": 1,
            "housing": 1
          },
          "description": "激活城市永久获得 +1 宜居度与 +1 住房（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部法国印象派油画艺术巨作（《日出·印象》、《睡莲》），每部产出 +2 文化、+2 旅游，本城魅力与宜居度 +1。",
      "historicalBiography": "法国画家、印象派运动领军人物与奠基者，名作《日出·印象》定名印象派画风，长期在吉维尼小镇花园捕捉光线色彩随时间流逝瞬息万变的刹那真谛。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "vincent_van_gogh",
      "name": "文森特·梵高",
      "englishName": "Vincent van Gogh",
      "classKey": "artist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 910,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《星夜》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《向日葵》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部后印象派炽烈情感与旋转星空油画巨作（《星夜》、《向日葵》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "荷兰后印象派先驱画家，以极其浓烈纯粹的色彩笔触与奔涌激荡的生命情感作画，《星夜》与《向日葵》对二十世纪野兽派与表现主义产生决定性奠基影响。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "j_m_w_turner",
      "name": "约瑟夫·马洛德·威廉·透纳",
      "englishName": "J. M. W. Turner",
      "classKey": "artist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 1040,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《战舰无畏号解体》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《雨、蒸汽和速度》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部英国浪漫主义光之画家油画巨作（《战舰无畏号解体》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "英国十九世纪浪漫主义风景画家，水彩画大师，以对风暴、烟雾、海浪与金光大气的超绝表现力著称，其《雨、蒸汽和速度》率先捕捉工业革命动能。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "auguste_rodin",
      "name": "奥古斯特·罗丹",
      "englishName": "Auguste Rodin",
      "classKey": "artist",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 1170,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《思想者》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《吻》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部近代雕塑转型青铜雕塑巨作（《思想者》、《吻》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "法国近代雕塑巨匠，现代雕塑之父，承接米开朗基罗古典宏大传统并开创未完成感与肌肉粗犷张力表现法，其《地狱之门》与《思想者》震惊世人。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "pablo_picasso",
      "name": "巴勃罗·毕加索",
      "englishName": "Pablo Picasso",
      "classKey": "artist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 950,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "油画《格尔尼卡》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "油画《亚威农的少女》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "empire_permanent",
          "timing": "on_first_activation",
          "effects": {
            "warWearinessReduction": 0.1
          },
          "description": "全国对外战争厌战度永久降低 10%（国家永久被动生效）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部现代立体主义艺术巨作（《格尔尼卡》、《亚威农的少女》），每部产出 +2 文化、+2 旅游，战时厌战度 -10%。",
      "historicalBiography": "西班牙现代艺术大师、立体主义创始人，20世纪西方最具创造力与影响力的艺术家，名作《格尔尼卡》以破碎重组的几何画面控诉法西斯战争暴行。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "qi_baishi",
      "name": "齐白石",
      "englishName": "Qi Baishi",
      "classKey": "artist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 1130,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《墨虾》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《蛙声十里出山泉》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部现代大写意国画经典巨作（《墨虾》、《蛙声十里出山泉》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "中国近现代国画大师，开创“红花墨叶”大写意花鸟画风，提出“妙在似与不似之间，太似为媚俗，不似为欺世”，以质朴生动童趣将文人画推陈出新。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "salvador_dali",
      "name": "萨尔瓦多·达利",
      "englishName": "Salvador Dalí",
      "classKey": "artist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 1310,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《记忆的永恒》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《圣安东尼的诱惑》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部超现实主义潜意识梦境油画巨作（《记忆的永恒》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "西班牙超现实主义画家与狂想大师，创立“偏执狂批判方法”，将精细古典写实技法与荒诞软融时钟、长腿大象等梦境潜意识并置，深刻震撼二十世纪视觉认知。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "frida_kahlo",
      "name": "弗里达·卡罗",
      "englishName": "Frida Kahlo",
      "classKey": "artist",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 1490,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《两个弗里达》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《带荆棘项链的自画像》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部墨西哥民间魔幻现实主义自画像巨作（《两个弗里达》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "墨西哥著名传奇女画家，以极具个性力量与生命痛感的自画像闻名于世，融合墨西哥本土土著艺术象征与坚韧意志，成为全球女性主义艺术图腾。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "andy_warhol",
      "name": "安迪·沃霍尔",
      "englishName": "Andy Warhol",
      "classKey": "artist",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 1300,
      "targetRequirement": "city_with_art_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "art",
        "works": [
          {
            "title": "《金宝汤罐头》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "《玛丽莲双联画》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有艺术馆或奇观空槽的城市创作一部波普艺术机械丝网印刷先驱巨作（《金宝汤罐头》、《玛丽莲双联画》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "美国艺术家、波普艺术运动核心领袖，创立“工厂”工作室，通过丝网版画机械复制消费主义商品与大众明星偶像图像，彻底消解传统高雅与流行艺术边界。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "li_yan_nian",
      "name": "李延年",
      "englishName": "Li Yannian",
      "classKey": "musician",
      "era": 1,
      "eraName": "古典时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 120,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "乐府歌《佳人歌》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "郊祀歌《天马歌》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部汉代乐府传世音乐巨作（《佳人歌》、《天马歌》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "西汉汉武帝时期杰出音乐家、协律都尉，《史记》与《汉书》均有确凿详实传记，主持汉代乐府采集整理各地民间歌谣，融合西域新声创制二十八首乐府新曲。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "hildegard_of_bingen",
      "name": "宾根的希尔德加德",
      "englishName": "Hildegard of Bingen",
      "classKey": "musician",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 240,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "道德剧歌剧《美德之戏》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "圣歌《圣灵赞歌》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部中世纪单声圣歌与灵性戏剧音乐巨作（《美德之戏》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "中世纪德意志莱茵河畔本笃会女修道院长、通才哲学家与作曲家，西方音乐史上留名最早的女作曲家，其圣乐旋律自由翱翔如天国回响，《美德之戏》为最早音乐戏剧先声。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "guillaume_de_machaut",
      "name": "纪尧姆·德·马绍",
      "englishName": "Guillaume de Machaut",
      "classKey": "musician",
      "era": 2,
      "eraName": "中古时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 300,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "复调圣乐《圣母弥撒》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "回旋曲《我的终点即我的起点》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部中世纪新艺术（Ars Nova）复调弥撒音乐巨作（《圣母弥撒》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "法国十四世纪中世纪作曲家与诗人，“新艺术”运动最杰出的代表人物，创作了西方音乐史上首部由单一作曲家完整创作的复调常规弥撒曲《圣母弥撒》。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "antonio_vivaldi",
      "name": "安东尼奥·维瓦尔第",
      "englishName": "Antonio Vivaldi",
      "classKey": "musician",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 420,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "协奏曲《四季·春》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "协奏曲《四季·冬》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院、广播中心或奇观音乐槽位的城市创作一部巴洛克小提琴协奏曲巨作（《四季》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "威尼斯巴洛克作曲家与小提琴演奏大师，绰号“红发神甫”，确立快-慢-快三乐章协奏曲经典结构，小提琴套曲《四季》旋律优美生动描摹自然。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "johann_sebastian_bach",
      "name": "约翰·塞巴斯蒂安·巴赫",
      "englishName": "Johann Sebastian Bach",
      "classKey": "musician",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 510,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "管弦乐《勃兰登堡协奏曲》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "赋格曲《平均律键盘曲集》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "faith": 2
          },
          "description": "激活城市每周期永久 +2 信仰（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部巴洛克复调音乐巨作（《勃兰登堡协奏曲》、《平均律键盘曲集》），每部产出 +2 文化、+2 旅游，本城信仰 +2。",
      "historicalBiography": "德意志巴洛克作曲家、管风琴家，“西方近代音乐之父”，集复调对位法之大成，将十二平均律规范运用于键盘创作，其作品兼具深邃宗教虔诚与严密数学美感。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "giovanni_pierluigi_da_palestrina",
      "name": "乔瓦尼·皮耶路易吉·达·帕莱斯特里纳",
      "englishName": "Giovanni Pierluigi da Palestrina",
      "classKey": "musician",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 600,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "复调弥撒《马切罗教皇弥撒》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "经文歌《如鹿切慕溪水》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部文艺复兴全盛期无伴奏合唱复调音乐圣典（《马切罗教皇弥撒》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "意大利文艺复兴全盛期罗马乐派最伟大的无伴奏复调作曲家，确立纯净透明的和声对位规则，其《马切罗教皇弥撒》以字句清晰与肃穆和声挽救复调免遭教会禁止。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "claudio_monteverdi",
      "name": "克劳迪奥·蒙特威尔第",
      "englishName": "Claudio Monteverdi",
      "classKey": "musician",
      "era": 3,
      "eraName": "文艺复兴",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 690,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "早期歌剧开山《奥菲欧》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "合唱圣乐《圣母晚祷》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部文艺复兴转向巴洛克戏剧近代歌剧开山巨作（《奥菲欧》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "意大利文艺复兴晚期向巴洛克过渡的重要作曲家，歌剧艺术奠基人，首创“第二实践”（以歌词统领音乐）与丰富管弦戏剧配器，其《奥菲欧》为歌剧成熟标志。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "wolfgang_amadeus_mozart",
      "name": "沃尔夫冈·阿马德乌斯·莫扎特",
      "englishName": "Wolfgang Amadeus Mozart",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 0,
      "charges": 2,
      "baseThreshold": 650,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "交响曲《g小调第40交响曲》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "歌剧《魔笛》序曲",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "amenity": 1
          },
          "description": "激活城市永久获得 +1 宜居度（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部维也纳古典乐派交响乐或歌剧巨作（《第40交响曲》、《魔笛》），每部产出 +2 文化、+2 旅游，所在城宜居度 +1。",
      "historicalBiography": "奥地利天才作曲家、维也纳古典乐派代表人物，自幼展现绝伦音乐天赋，三十五载生涯创作六百余部杰作，旋律清丽纯真、如泉涌般充满灵动天性。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "ludwig_van_beethoven",
      "name": "路德维希·凡·贝多芬",
      "englishName": "Ludwig van Beethoven",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 780,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "交响曲《第五交响曲（命运）》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "交响曲《第九交响曲（欢乐颂）》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "empire_timed",
          "timing": "on_first_activation",
          "durationCycles": 4,
          "effects": {
            "armyCombatBonus": 1
          },
          "description": "全国所有现存陆地军事单位战斗力 +1，持续 4 个经济周期（80秒限时爆发）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部英雄交响音乐巨作（《命运交响曲》、《第九交响曲（欢乐颂）》），每部产出 +2 文化、+2 旅游，全国陆军战力 +1（持续 4 周期）。",
      "historicalBiography": "德意志作曲家、钢琴家，“乐圣”，维也纳古典乐派向浪漫主义过渡桥梁，克服完全失聪绝境扼住命运咽喉，首创交响乐融入人声大合唱《欢乐颂》唱响四海大同理想。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "pyotr_ilyich_tchaikovsky",
      "name": "彼得·伊里奇·柴可夫斯基",
      "englishName": "Pyotr Ilyich Tchaikovsky",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 910,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "芭蕾舞剧《天鹅湖》组曲",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "管弦乐《1812序曲》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "empire_timed",
          "timing": "on_first_activation",
          "durationCycles": 4,
          "effects": {
            "homeDefenseCombatBonus": 2
          },
          "description": "在己方领土作战的所有友军防御战斗力 +2，持续 4 个经济周期（80秒限时防御）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部浪漫主义管弦芭蕾音乐巨作（《天鹅湖》、《1812序曲》），每部产出 +2 文化、+2 旅游，本土防御战力 +2。",
      "historicalBiography": "俄罗斯浪漫乐派核心作曲家，融汇俄罗斯民歌悠扬忧郁韵律与西欧交响作曲技巧，创作《天鹅湖》、《胡桃夹子》及以真实加农炮声轰鸣的《1812序曲》。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "frederic_chopin",
      "name": "弗雷德里克·肖邦",
      "englishName": "Frédéric Chopin",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 1040,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "钢琴曲《降E大调夜曲》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "钢琴曲《c小调革命练习曲》",
            "culture": 2,
            "tourism": 2
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "loyaltyBonus": 3
          },
          "description": "激活城市每周期忠诚度永久 +3（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "2次激活次数。每次创作一部浪漫主义钢琴诗篇巨作（《夜曲》、《革命练习曲》），每部产出 +2 文化、+2 旅游，所在城忠诚度 +3。",
      "historicalBiography": "波兰作曲家、钢琴家，“钢琴诗人”，一生专注钢琴独奏曲创作，将波兰波罗乃兹与玛祖卡民间舞曲升华为高雅艺术，临终遗愿将心脏送回故乡波兰安葬。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "franz_schubert",
      "name": "弗朗茨·舒伯特",
      "englishName": "Franz Schubert",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 4,
      "charges": 2,
      "baseThreshold": 1170,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "艺术歌曲《魔王》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "交响曲《第八交响曲（未完成）》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部早期浪漫主义艺术歌曲与交响乐绝唱（《魔王》、《未完成交响曲》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "奥地利早期浪漫主义作曲家，“歌曲之王”，一生创作六百余首情感纯净真挚的艺术歌曲（Lieder），将钢琴伴奏升华至与人声并驾齐驱的戏剧意境。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "johannes_brahms",
      "name": "约翰内斯·勃拉姆斯",
      "englishName": "Johannes Brahms",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 5,
      "charges": 2,
      "baseThreshold": 1300,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "交响曲《第一交响曲》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "管弦乐《匈牙利舞曲第五号》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部德奥古典严谨曲风与浪漫情怀交融交响乐（《第一交响曲》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "德意志浪漫主义时期传统古典主义坚守大师，与巴赫、贝多芬并称“3B”，以严谨周密的古典变奏对位形式容纳深沉内省情感，其《第一交响曲》被誉为“贝多芬第十”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "giuseppe_verdi",
      "name": "朱塞佩·威尔第",
      "englishName": "Giuseppe Verdi",
      "classKey": "musician",
      "era": 4,
      "eraName": "工业时代",
      "eraIndex": 6,
      "charges": 2,
      "baseThreshold": 1430,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "歌剧名篇《茶花女·饮酒歌》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "安魂弥撒《安魂曲·震怒之日》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部意大利民族复兴浪漫主义歌剧史诗（《茶花女》、《安魂曲》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "意大利歌剧泰斗、民族复兴运动精神旗手，创作《阿依达》、《弄臣》、《茶花女》等脍炙人口的世界经典歌剧，以激昂旋律与戏剧张力点燃民族热情。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "hua_yanjun",
      "name": "华彦钧（阿炳）",
      "englishName": "Hua Yanjun (A Bing)",
      "classKey": "musician",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 950,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "二胡独奏曲《二泉映月》",
            "culture": 4,
            "tourism": 4
          }
        ],
        "bonusEffect": {
          "scope": "activation_city",
          "timing": "on_first_activation",
          "effects": {
            "amenity": 2
          },
          "description": "激活城市永久获得 +2 宜居度（随首次激活绑定该城）。"
        }
      },
      "effectDescription": "创作中国传统民族器乐绝响《二泉映月》，单部巨作产出 +4 文化、+4 旅游，本城宜居度 +2。",
      "historicalBiography": "无锡民间盲人音乐家、二胡与琵琶演奏大师，虽双目失明颠沛流离街头卖艺，以心映月将平民苦难与坎坷灵魂倾注于琴弦，指挥大师小泽征尔曾感叹“应当跪下来听”。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "claude_debussy",
      "name": "克劳德·德彪西",
      "englishName": "Claude Debussy",
      "classKey": "musician",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 1130,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "钢琴曲《月光》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "管弦交响画《大海》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部印象主义和声朦胧诗意管弦乐巨作（《月光》、《大海》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "法国十九世纪末二十世纪初印象主义音乐开创者，打破传统大调小调功能和声限制，运用全音阶、五声音阶与丰富色彩和弦营造流动变幻的朦胧声响意境。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "igor_stravinsky",
      "name": "伊戈尔·斯特拉文斯基",
      "englishName": "Igor Stravinsky",
      "classKey": "musician",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 2,
      "charges": 2,
      "baseThreshold": 1310,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "现代芭蕾交响舞剧《春之祭》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "芭蕾舞剧《火鸟》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部现代主义原始主义节奏革命芭蕾管弦巨作（《春之祭》、《火鸟》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "俄裔美籍现代音乐先锋大师，其芭蕾舞剧《春之祭》以强烈多节奏重音错位与原始力量彻底颠覆西方传统音乐韵律观念，成为二十世纪现代派音乐里程碑。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "xian_xinghai",
      "name": "冼星海",
      "englishName": "Xian Xinghai",
      "classKey": "musician",
      "era": 5,
      "eraName": "现代",
      "eraIndex": 3,
      "charges": 2,
      "baseThreshold": 1490,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "合唱交响史诗《黄河大合唱·保卫黄河》",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "管弦合唱《生产大合唱》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部近代中国民族抗战壮阔交响合唱史诗巨作（《黄河大合唱》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "中国现代杰出人民音乐家、作曲家，留学法国巴黎音乐学院，抗战爆发后归国于延安仅用六天谱就旷世巨作《黄河大合唱》，以磅礴奔腾气势唤醒全民族救亡图存斗志。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "louis_armstrong",
      "name": "路易斯·阿姆斯特朗",
      "englishName": "Louis Armstrong",
      "classKey": "musician",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 0,
      "charges": 1,
      "baseThreshold": 1300,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "爵士金曲《多美好的世界 (What a Wonderful World)》",
            "culture": 5,
            "tourism": 6
          }
        ],
        "bonusEffect": {
          "scope": "empire_permanent",
          "timing": "on_first_activation",
          "effects": {
            "nationalAmenities": 1
          },
          "description": "全国所有城市永久 +1 宜居度（国家永久被动生效）。"
        }
      },
      "effectDescription": "创作20世纪爵士音乐经典《多美好的世界》，单部巨作产出 +5 文化、+6 旅游，全国城市宜居度 +1。",
      "historicalBiography": "美国新奥尔良著名爵士小号演奏家与歌手，昵称“书包嘴（Satchmo）”，即兴独奏与拟声拟音唱法先驱，将爵士乐从小众即兴推向风靡全球的跨文化主流艺术殿堂。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta",
        "bonusEffect": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    },
    {
      "key": "miles_davis",
      "name": "迈尔斯·戴维斯",
      "englishName": "Miles Davis",
      "classKey": "musician",
      "era": 6,
      "eraName": "原子能时代",
      "eraIndex": 1,
      "charges": 2,
      "baseThreshold": 1540,
      "targetRequirement": "city_with_music_slot",
      "recipeType": "create_great_work",
      "recipeParams": {
        "workType": "music",
        "works": [
          {
            "title": "调式爵士典范《泛蓝调调》（So What）",
            "culture": 2,
            "tourism": 2
          },
          {
            "title": "交响融合爵士《西班牙狂想曲》",
            "culture": 2,
            "tourism": 2
          }
        ]
      },
      "effectDescription": "2次激活次数。每次在建有歌剧院或奇观音乐槽位的城市创作一部二十世纪后半叶调式爵士与融合爵士传世唱片巨作（《泛蓝调调》），每部产出 +2 文化、+2 旅游。",
      "historicalBiography": "美国二十世纪传奇小号手、爵士乐改革家，先后开创冷爵士（Cool Jazz）、硬波普（Hard Bop）、调式爵士（Modal Jazz）与融合爵士（Fusion），其专辑《Kind of Blue》为爵士史上最畅销经典。",
      "effectScopes": {
        "workType": "meta",
        "works": "meta"
      },
      "runtimeRules": {
        "targetUnitClasses": null,
        "durationCycles": null,
        "radius": null,
        "stackingPolicy": "idempotent_unique_key"
      }
    }
  ]
};
export const HERITAGE_WONDERS = HERITAGE_DESIGN.wonders;
export const GREAT_PEOPLE = HERITAGE_DESIGN.greatPeopleRoster;
export const GREAT_PERSON_CLASSES = HERITAGE_DESIGN.greatPeopleClasses;
