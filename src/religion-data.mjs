// Gemini religion design v1.0.1; engineering adaptations are recorded in the release review.
export const RELIGION_DESIGN = {
  "version": "1.0.1",
  "gameVersionContract": "2.26.0",
  "project": "Hex Civilizations: Epochs (诸文明·六角纪元)",
  "documentId": "CIV-HEX-REL-MOV-DESIGN-v1.0.1",
  "date": "2026-10-15",
  "author": "Antigravity (Google DeepMind)",
  "implementer": "Codex",
  "briefReference": "RELIGION_MOVEMENT_REVIEW_BRIEF.md & RELIGION_MOVEMENT_INTEGRATION_REVIEW.md",
  "overview": {
    "summary": "本规范为 v1.0.1 工程审查对接修订版：(1) 明确万神殿首占全局唯一，创教初始追随者与创教者信条免费选择，强化与礼拜信条需神学与 100*pace 信仰，替换信条需改革市政与 250*pace 信仰并引入 12 周期共享冷却；明确信条在文明间非排他互斥，支持多国选择相同信条；(2) 明确耶稣会教育信仰直购建筑成本为 2*pace 生产力成本，受常规科技/建筑前置制约，单建筑限购 1 次；(3) 纠正工匠之神文案，移除石材误称，严格限定为矿山+战略+已探明资源；(4) 删去未存在的国家公园/度假区承诺，对齐印刷术种植园与飞行后改良设施旅游实装，金门大桥(golden_gate)倍增改良基础旅游；(5) 撤退严格定义为后撤至离攻击者更远的相邻空闲合法水域地块；(6) 统帅光环准确采用 ignoreEnemyTerritoryWaterPenalty、ignoreZoc 与 artilleryMovementBonus:1，移除 seaMines 与 moveAndShoot；(7) 审慎修订诃利色那、哈尔帕哥斯、芒达瓦等生平传记，避免夸大与无据官衔；(8) 附属宗教明确母国死亡或国教Key实质变更触发解放，普通信条产出在现代后永久保留。",
    "pantheonsCount": 16,
    "beliefsCategoriesCount": 4,
    "beliefsCountTotal": 24,
    "leaderReplacementsCount": 8,
    "preservedWondersCount": 64,
    "preservedGreatPeopleCount": 256
  },
  "beliefSelectionAndReformationRules": {
    "pantheonRules": {
      "thresholdFaith": 30,
      "costFaith": 0,
      "exclusivity": "globally_unique_first_come_first_served",
      "description": "万神殿在文明信仰达到 30 点时解锁，采纳消耗 0 信仰。全图 16 项万神殿为全局唯一互斥项，先到先得。"
    },
    "initialBeliefsRules": {
      "unlockedOnFounding": [
        "follower",
        "founder"
      ],
      "costFaith": 0,
      "exclusivity": "non_exclusive_across_religions",
      "description": "创立宗教时（大预言家激活或消耗 120 信仰圣地创教），立即免费选择 1 项追随者信条与 1 项创教者信条（消耗 0 信仰）。信条在文明之间【非排他互斥】，不同宗教允许选择相同信条，支持 16 人局 9 独立宗教的充足选择。"
    },
    "secondaryBeliefsRules": {
      "enhancer": {
        "prerequisiteCivic": "theology",
        "baseCostFaith": 100,
        "costFormula": "Math.round(100 * gamePace(g).factor)",
        "exclusivity": "non_exclusive_across_religions",
        "description": "需解锁【神学】市政，消耗 100 * 游戏速度系数（标准100、史诗150、马拉松300）的信仰值选择强化信条。"
      },
      "worship": {
        "prerequisiteCivic": "theology",
        "baseCostFaith": 100,
        "costFormula": "Math.round(100 * gamePace(g).factor)",
        "exclusivity": "non_exclusive_across_religions",
        "description": "需解锁【神学】市政，消耗 100 * 游戏速度系数（标准100、史诗150、马拉松300）的信仰值选择礼拜信条。"
      }
    },
    "reformationRules": {
      "prerequisiteCivic": "reform",
      "baseCostFaith": 250,
      "costFormula": "Math.round(250 * gamePace(g).factor)",
      "sharedCooldownCycles": 12,
      "cooldownSeconds": 240,
      "description": "需解锁【宗教改革】市政，每次替换已拥有的某一类别信条消耗 250 * 游戏速度系数（标准250、史诗375、马拉松750）的信仰值。全类别共享 12 个经济周期（240 游戏秒）的改革冷却期。"
    },
    "jesuitEducationPurchasingRule": {
      "costFormula": "Math.ceil(2 * productionCost(g, city, buildingKey))",
      "currency": "faith",
      "prerequisiteGates": "normal_tech_civic_and_building_dependencies",
      "maxPurchasesPerBuilding": 1,
      "description": "耶稣会教育允许以信仰购买学院与剧场建筑，即时造价等于 2 倍按游戏速度缩放后的建造生产力消耗（productionCost）。严格遵循前置科技、市政与建筑层级依赖，每座真实建筑限购 1 次（不可重复购买）。"
    }
  },
  "pantheons": [
    {
      "key": "god_of_craftsmen",
      "name": "工匠之神",
      "englishName": "God of Craftsmen",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "mine"
          ],
          "requiresResourceCategory": [
            "strategic"
          ],
          "requiresRevealed": true,
          "production": 1,
          "faith": 1
        }
      },
      "description": "开发已探明战略资源（铁矿、铀矿等战略资源矿山）的已工作矿山地块提供 +1 生产力与 +1 信仰。",
      "aiUtility": {
        "preferenceWeights": {
          "industry": 0.8,
          "faith": 0.5
        },
        "condition": "has_strategic_mine"
      }
    },
    {
      "key": "monument_to_gods",
      "name": "神圣纪念碑",
      "englishName": "Monument to the Gods",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "wonder_production",
      "effects": {
        "wonderProductionMultiplier": {
          "applicableEras": [
            0,
            1
          ],
          "multiplier": 0.15
        }
      },
      "description": "建造远古与古典时代奇观时，生产力提升 15%。",
      "aiUtility": {
        "preferenceWeights": {
          "wonderRush": 0.85
        },
        "condition": "aims_for_early_wonder"
      }
    },
    {
      "key": "dance_of_the_aurora",
      "name": "极光之舞",
      "englishName": "Dance of the Aurora",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "district_adjacency",
      "targetType": "holy_site",
      "effects": {
        "holySiteAdjacentTerrainBonus": {
          "terrain": "tundra",
          "faith": 1
        }
      },
      "description": "圣地区域从每个相邻的冻土地块获得 +1 信仰相邻加成。",
      "aiUtility": {
        "preferenceWeights": {
          "faith": 0.9
        },
        "condition": "has_tundra_tiles"
      }
    },
    {
      "key": "desert_folklore",
      "name": "沙漠民俗",
      "englishName": "Desert Folklore",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "district_adjacency",
      "targetType": "holy_site",
      "effects": {
        "holySiteAdjacentTerrainBonus": {
          "terrain": "desert",
          "faith": 1
        }
      },
      "description": "圣地区域从每个相邻的沙漠地块获得 +1 信仰相邻加成。",
      "aiUtility": {
        "preferenceWeights": {
          "faith": 0.9
        },
        "condition": "has_desert_tiles"
      }
    },
    {
      "key": "sacred_path",
      "name": "圣日之道",
      "englishName": "Sacred Path",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "district_adjacency",
      "targetType": "holy_site",
      "effects": {
        "holySiteAdjacentFeatureBonus": {
          "feature": "forest",
          "faith": 1
        }
      },
      "description": "圣地区域从每个相邻的树林地块获得 +1 信仰相邻加成。",
      "aiUtility": {
        "preferenceWeights": {
          "faith": 0.8
        },
        "condition": "has_forest_tiles"
      }
    },
    {
      "key": "river_goddess",
      "name": "河流女神",
      "englishName": "River Goddess",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "city_with_district",
      "targetType": "holy_site_on_river",
      "effects": {
        "riverHolySiteCityBonus": {
          "amenities": 2,
          "housing": 2
        }
      },
      "description": "紧邻河流建造的圣地区域为其所在城市提供 +2 宜居度与 +2 住房容量。",
      "aiUtility": {
        "preferenceWeights": {
          "growth": 0.85,
          "amenities": 0.7
        },
        "condition": "has_river_holy_site"
      }
    },
    {
      "key": "earth_goddess",
      "name": "大地女神",
      "englishName": "Earth Goddess",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_terrain",
      "effects": {
        "workedTerrainBonus": {
          "terrainHill": true,
          "faith": 1
        }
      },
      "description": "所有被市民工作的丘陵地块额外提供 +1 信仰。",
      "aiUtility": {
        "preferenceWeights": {
          "faith": 0.8
        },
        "condition": "has_worked_hills"
      }
    },
    {
      "key": "god_of_the_sea",
      "name": "海洋之神",
      "englishName": "God of the Sea",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "fishery"
          ],
          "production": 1
        }
      },
      "description": "所有水产渔场（渔船）地块额外提供 +1 生产力。",
      "aiUtility": {
        "preferenceWeights": {
          "naval": 0.85,
          "industry": 0.75
        },
        "condition": "coastal_civilization"
      }
    },
    {
      "key": "god_of_the_open_sky",
      "name": "广袤天空之神",
      "englishName": "God of the Open Sky",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "pasture"
          ],
          "culture": 1
        }
      },
      "description": "所有牧场地块（牛、马等）额外提供 +1 文化。",
      "aiUtility": {
        "preferenceWeights": {
          "culture": 0.85
        },
        "condition": "has_pasture_resources"
      }
    },
    {
      "key": "goddess_of_the_hunt",
      "name": "狩猎女神",
      "englishName": "Goddess of the Hunt",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "camp"
          ],
          "food": 1,
          "production": 1
        }
      },
      "description": "所有营地地块（鹿等）额外提供 +1 食物与 +1 生产力。",
      "aiUtility": {
        "preferenceWeights": {
          "growth": 0.75,
          "industry": 0.7
        },
        "condition": "has_camp_resources"
      }
    },
    {
      "key": "goddess_of_festivals",
      "name": "节庆女神",
      "englishName": "Goddess of Festivals",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "plantation"
          ],
          "culture": 1,
          "gold": 1
        }
      },
      "description": "所有种植园地块（香料、丝绸等）额外提供 +1 文化与 +1 金币。",
      "aiUtility": {
        "preferenceWeights": {
          "culture": 0.8,
          "commerce": 0.6
        },
        "condition": "has_plantation_resources"
      }
    },
    {
      "key": "stone_circles",
      "name": "巨石神圈",
      "englishName": "Stone Circles",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "quarry"
          ],
          "faith": 2
        }
      },
      "description": "所有采石场地块额外提供 +2 信仰。",
      "aiUtility": {
        "preferenceWeights": {
          "faith": 0.85
        },
        "condition": "has_quarries"
      }
    },
    {
      "key": "religious_idols",
      "name": "金银圣像",
      "englishName": "Religious Idols",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "worked_improvements",
      "effects": {
        "workedImprovementBonus": {
          "improvements": [
            "mine"
          ],
          "requiresResources": [
            "gold",
            "gems"
          ],
          "faith": 2,
          "gold": 1
        }
      },
      "description": "黄金与宝石矿山地块额外提供 +2 信仰与 +1 金币。",
      "aiUtility": {
        "preferenceWeights": {
          "faith": 0.8,
          "commerce": 0.6
        },
        "condition": "has_gold_or_gems"
      }
    },
    {
      "key": "fertility_rites",
      "name": "丰产祭礼",
      "englishName": "Fertility Rites",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "growth_and_grant",
      "effects": {
        "cityGrowthMultiplier": 0.1,
        "instantUnitGrant": {
          "unitKey": "builder",
          "targetCity": "capital"
        }
      },
      "description": "所有城市人口增长速率提升 10%；采纳时在首都立即免费获赠 1 名建造者。",
      "aiUtility": {
        "preferenceWeights": {
          "growth": 0.9,
          "expansion": 0.8
        },
        "condition": "general_early_expansion"
      }
    },
    {
      "key": "initiation_rites",
      "name": "授戒武礼",
      "englishName": "Initiation Rites",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "combat_kill_faith",
      "effects": {
        "killFaithRatio": 0.5,
        "instantFaithOnAdoption": 50
      },
      "description": "采纳时立即获得 50 信仰；击败蛮族或敌方军事单位时，获得等同于该单位战斗力 50% 的信仰值。",
      "aiUtility": {
        "preferenceWeights": {
          "military": 0.85,
          "faith": 0.6
        },
        "condition": "active_barbarians_or_early_war"
      }
    },
    {
      "key": "divine_spark",
      "name": "神圣火花",
      "englishName": "Divine Spark",
      "prerequisiteFaith": 30,
      "prerequisiteCivic": null,
      "cost": 0,
      "scope": "empire",
      "targetType": "district_specialist_points",
      "effects": {
        "districtGreatPersonPoints": {
          "holy": {
            "greatProphetPoints": 1
          },
          "campus": {
            "greatScientistPoints": 1
          },
          "theater": {
            "greatWriterPoints": 1
          }
        }
      },
      "description": "圣地区域额外提供 +1 大预言家点数，学院区域额外提供 +1 大科学家点数，剧场区域额外提供 +1 大作家点数。",
      "aiUtility": {
        "preferenceWeights": {
          "science": 0.85,
          "culture": 0.8,
          "greatPeopleRush": 0.9
        },
        "condition": "aims_for_great_people"
      }
    }
  ],
  "beliefs": {
    "follower": [
      {
        "key": "work_ethic",
        "name": "职业道德",
        "englishName": "Work Ethic",
        "category": "follower",
        "scope": "city_majority",
        "recipeType": "holy_site_production_mirror",
        "effects": {
          "holySiteProductionEqualsFaithAdjacency": true
        },
        "description": "本宗教为主流信仰的城市，其圣地区域提供等同于其信仰相邻加成的生产力（+100% 邻接转化）。",
        "aiUtility": {
          "preferenceWeights": {
            "industry": 0.95,
            "holySiteFocus": 0.9
          },
          "condition": "has_high_adjacency_holy_sites"
        }
      },
      {
        "key": "feed_the_world",
        "name": "哺育世界",
        "englishName": "Feed the World",
        "category": "follower",
        "scope": "city_majority",
        "recipeType": "religious_building_food_and_housing",
        "effects": {
          "shrineFood": 3,
          "shrineHousing": 1,
          "templeFood": 5,
          "templeHousing": 1
        },
        "description": "本宗教为主流信仰的城市，神社提供 +3 食物与 +1 住房，寺庙提供 +5 食物与 +1 住房。",
        "aiUtility": {
          "preferenceWeights": {
            "growth": 0.9,
            "housing": 0.8
          },
          "condition": "tall_city_growth"
        }
      },
      {
        "key": "choral_music",
        "name": "合唱圣咏",
        "englishName": "Choral Music",
        "category": "follower",
        "scope": "city_majority",
        "recipeType": "religious_building_culture",
        "effects": {
          "shrineCulture": 3,
          "templeCulture": 5
        },
        "description": "本宗教为主流信仰的城市，神社额外提供 +3 文化，寺庙额外提供 +5 文化。",
        "aiUtility": {
          "preferenceWeights": {
            "culture": 0.95,
            "civicsRush": 0.85
          },
          "condition": "aims_for_civic_advancement"
        }
      },
      {
        "key": "zen_meditation",
        "name": "禅修静观",
        "englishName": "Zen Meditation",
        "category": "follower",
        "scope": "city_majority",
        "recipeType": "district_threshold_amenity",
        "effects": {
          "minimumSpecialtyDistricts": 2,
          "amenities": 1,
          "faith": 2
        },
        "description": "本宗教为主流信仰且建有至少 2 个专业化区域的城市，获得 +1 宜居度与 +2 信仰。",
        "aiUtility": {
          "preferenceWeights": {
            "amenities": 0.8,
            "faith": 0.6
          },
          "condition": "multi_district_empire"
        }
      },
      {
        "key": "jesuit_education",
        "name": "耶稣会教育",
        "englishName": "Jesuit Education",
        "category": "follower",
        "scope": "city_majority",
        "recipeType": "faith_purchase_science_culture_buildings",
        "effects": {
          "allowFaithPurchaseBuildings": [
            "library",
            "university",
            "lab",
            "amphitheater",
            "museum",
            "broadcast"
          ],
          "costFormula": "2 * actual pace-scaled productionCost"
        },
        "description": "本宗教为主流信仰的城市，允许直接使用信仰值购买学院与剧场区域的科技与文化建筑（造价为 2 倍按速度缩放的生产力成本，需满足常规科技/建筑前置，每种建筑限购 1 次）。",
        "aiUtility": {
          "preferenceWeights": {
            "science": 0.9,
            "culture": 0.9,
            "faithEconomy": 0.95
          },
          "condition": "high_faith_income"
        }
      },
      {
        "key": "religious_community",
        "name": "宗教社群",
        "englishName": "Religious Community",
        "category": "follower",
        "scope": "city_majority",
        "recipeType": "trade_route_district_yield",
        "effects": {
          "originRouteGoldPerHolySiteBuilding": 2,
          "originRouteProductionPerHolySiteBuilding": 1
        },
        "description": "本宗教为主流信仰的城市向外派出的国内外贸易路线，该城每有一座圣地建筑（神社、寺庙、礼拜建筑），商路额外提供 +2 金币与 +1 生产力。",
        "aiUtility": {
          "preferenceWeights": {
            "commerce": 0.85,
            "industry": 0.75
          },
          "condition": "trade_route_heavy"
        }
      }
    ],
    "founder": [
      {
        "key": "tithe",
        "name": "什一奉献",
        "englishName": "Tithe",
        "category": "founder",
        "scope": "founder_empire",
        "recipeType": "global_follower_gold",
        "effects": {
          "followersPerStep": 4,
          "goldPerStep": 3
        },
        "description": "全球范围内本宗教每拥有 4 位信众，创教国每周期获得 +3 金币财政收入。",
        "aiUtility": {
          "preferenceWeights": {
            "commerce": 0.95
          },
          "condition": "global_evangelism"
        }
      },
      {
        "key": "stewardship",
        "name": "管家信托",
        "englishName": "Stewardship",
        "category": "founder",
        "scope": "founder_empire",
        "recipeType": "foreign_city_district_yield",
        "effects": {
          "foreignCityWithCampusScience": 2,
          "foreignCityWithCommercialGold": 2
        },
        "description": "以本宗教为主流信仰的外国城市中，若建有学院则为创教国提供 +2 科技，若建有商业中心则提供 +2 金币。",
        "aiUtility": {
          "preferenceWeights": {
            "science": 0.85,
            "commerce": 0.8
          },
          "condition": "foreign_majority_cities"
        }
      },
      {
        "key": "cross_cultural_dialogue",
        "name": "跨文化交流",
        "englishName": "Cross-Cultural Dialogue",
        "category": "founder",
        "scope": "founder_empire",
        "recipeType": "foreign_follower_science",
        "effects": {
          "foreignFollowersPerStep": 4,
          "sciencePerStep": 1
        },
        "description": "其他文明城市中每有 4 位信奉本宗教的信众，创教国每周期获得 +1 科技点数。",
        "aiUtility": {
          "preferenceWeights": {
            "science": 0.95
          },
          "condition": "aggressive_foreign_spread"
        }
      },
      {
        "key": "world_church",
        "name": "普世教会",
        "englishName": "World Church",
        "category": "founder",
        "scope": "founder_empire",
        "recipeType": "foreign_follower_culture",
        "effects": {
          "foreignFollowersPerStep": 4,
          "culturePerStep": 1
        },
        "description": "其他文明城市中每有 4 位信奉本宗教的信众，创教国每周期获得 +1 文化点数。",
        "aiUtility": {
          "preferenceWeights": {
            "culture": 0.95
          },
          "condition": "aggressive_foreign_spread"
        }
      },
      {
        "key": "pilgrimage",
        "name": "圣地朝圣",
        "englishName": "Pilgrimage",
        "category": "founder",
        "scope": "founder_empire",
        "recipeType": "foreign_majority_city_faith",
        "effects": {
          "faithPerForeignMajorityCity": 3
        },
        "description": "外国以本宗教为主流信仰的城市，每座为创教国每周期提供 +3 信仰点数。",
        "aiUtility": {
          "preferenceWeights": {
            "faithSnowball": 0.95
          },
          "condition": "convert_foreign_cities"
        }
      },
      {
        "key": "lay_ministry",
        "name": "平信徒宣讲",
        "englishName": "Lay Ministry",
        "category": "founder",
        "scope": "founder_empire",
        "recipeType": "majority_city_district_yield",
        "effects": {
          "faithPerHolySite": 2,
          "culturePerTheater": 2
        },
        "description": "以本宗教为主流信仰的己方与盟友城市中，每处圣地区域提供 +2 信仰，每处剧场区域提供 +2 文化。",
        "aiUtility": {
          "preferenceWeights": {
            "culture": 0.85,
            "faith": 0.8
          },
          "condition": "domestic_and_allied_spread"
        }
      }
    ],
    "enhancer": [
      {
        "key": "itinerant_preachers",
        "name": "巡回布道",
        "englishName": "Itinerant Preachers",
        "category": "enhancer",
        "scope": "religion_pressure",
        "recipeType": "passive_pressure_distance_expand",
        "effects": {
          "radiationRadiusTiles": 6,
          "baselineRadiusTiles": 4
        },
        "description": "主流信仰城市的被动宗教辐射距离提升至 6 格（基线为 4 格，辐射半径扩大 50%）。",
        "aiUtility": {
          "preferenceWeights": {
            "religiousSpread": 0.9
          },
          "condition": "dense_city_cluster"
        }
      },
      {
        "key": "holy_order",
        "name": "神圣修会",
        "englishName": "Holy Order",
        "category": "enhancer",
        "scope": "religious_recruitment",
        "recipeType": "faith_recruitment_discount",
        "effects": {
          "missionaryAndApostleDiscount": 0.3
        },
        "description": "使用信仰招募传教士与使徒时，消耗的信仰值降低 30%。",
        "aiUtility": {
          "preferenceWeights": {
            "religiousVictory": 0.95
          },
          "condition": "aims_for_religious_victory"
        }
      },
      {
        "key": "defender_of_the_faith",
        "name": "信仰守卫者",
        "englishName": "Defender of the Faith",
        "category": "enhancer",
        "scope": "military_combat",
        "recipeType": "territory_combat_bonus",
        "effects": {
          "friendlyTerritoryCombatBonus": 5,
          "requiresFriendlyCityReligionMajority": true
        },
        "description": "本国军队在信奉本宗教的友方城市领土内作战时，全军单位战斗力 +5。",
        "aiUtility": {
          "preferenceWeights": {
            "defense": 0.95
          },
          "condition": "surrounded_by_hostiles"
        }
      },
      {
        "key": "crusade",
        "name": "圣战远征",
        "englishName": "Crusade",
        "category": "enhancer",
        "scope": "military_combat",
        "recipeType": "territory_combat_bonus",
        "effects": {
          "enemyTerritoryCombatBonus": 7,
          "requiresForeignCityReligionMajority": true
        },
        "description": "本国军队在信奉本宗教的外国城市领土内作战时，全军单位战斗力 +7。",
        "aiUtility": {
          "preferenceWeights": {
            "aggression": 0.95
          },
          "condition": "offensive_warmonger"
        }
      },
      {
        "key": "missionary_zeal",
        "name": "传教热忱",
        "englishName": "Missionary Zeal",
        "category": "enhancer",
        "scope": "religious_units",
        "recipeType": "religious_unit_mobility",
        "effects": {
          "movementBonus": 1,
          "ignoreTerrainCost": [
            "hill",
            "forest"
          ]
        },
        "description": "所有宗教单位（传教士、使徒、审判官）移动力 +1，且在丘陵与森林地形上移动无视额外移动力消耗。",
        "aiUtility": {
          "preferenceWeights": {
            "fastConversion": 0.85
          },
          "condition": "rough_terrain_continent"
        }
      },
      {
        "key": "religious_unity",
        "name": "原道归一",
        "englishName": "Religious Unity",
        "category": "enhancer",
        "scope": "religious_units",
        "recipeType": "theological_elimination_boost",
        "effects": {
          "opposingPressureEliminationPercent": 1,
          "baselineEliminationPercent": 0.75
        },
        "description": "使徒与审判官在传教与审判时，清除目标城市中其他宗教的全部残留压力（由基线清除 75% 提升为 100% 根除）。",
        "aiUtility": {
          "preferenceWeights": {
            "counterHeretics": 0.9
          },
          "condition": "facing_active_heresy"
        }
      }
    ],
    "worship": [
      {
        "key": "cathedral",
        "name": "主教大教堂",
        "englishName": "Cathedral",
        "category": "worship",
        "scope": "holy_site_building",
        "recipeType": "worship_building_grant",
        "buildingSpec": {
          "cost": 120,
          "currency": "faith",
          "prerequisiteBuilding": "temple",
          "yields": {
            "faith": 4
          },
          "greatWorkSlots": {
            "religiousArtOrRelic": 1
          },
          "description": "+4 信仰，提供 1 个宗教艺术或圣物巨作槽位。"
        },
        "description": "解锁在圣地建造“主教大教堂”：花费 120 信仰购买，提供 +4 信仰与 1 个宗教艺术/圣物巨作槽位。",
        "aiUtility": {
          "preferenceWeights": {
            "tourism": 0.85,
            "culture": 0.8
          },
          "condition": "aims_for_cultural_victory"
        }
      },
      {
        "key": "gurdwara",
        "name": "锡克御殿",
        "englishName": "Gurdwara",
        "category": "worship",
        "scope": "holy_site_building",
        "recipeType": "worship_building_grant",
        "buildingSpec": {
          "cost": 120,
          "currency": "faith",
          "prerequisiteBuilding": "temple",
          "yields": {
            "faith": 3,
            "food": 2
          },
          "housing": 1,
          "description": "+3 信仰，+2 食物，+1 住房。"
        },
        "description": "解锁在圣地建造“锡克御殿”：花费 120 信仰购买，提供 +3 信仰、+2 食物与 +1 住房容量。",
        "aiUtility": {
          "preferenceWeights": {
            "growth": 0.9,
            "housing": 0.85
          },
          "condition": "population_focused"
        }
      },
      {
        "key": "mosque",
        "name": "宣礼清真寺",
        "englishName": "Mosque",
        "category": "worship",
        "scope": "holy_site_building",
        "recipeType": "worship_building_grant",
        "buildingSpec": {
          "cost": 120,
          "currency": "faith",
          "prerequisiteBuilding": "temple",
          "yields": {
            "faith": 3
          },
          "cityTrainedReligiousUnitsExtraCharge": 1,
          "description": "+3 信仰，所在城市训练的传教士与使徒传教次数 +1。"
        },
        "description": "解锁在圣地建造“宣礼清真寺”：花费 120 信仰购买，提供 +3 信仰，且本城训练的传教士与使徒传教次数永久 +1。",
        "aiUtility": {
          "preferenceWeights": {
            "religiousVictory": 0.95
          },
          "condition": "spread_priority"
        }
      },
      {
        "key": "pagoda",
        "name": "七级佛塔",
        "englishName": "Pagoda",
        "category": "worship",
        "scope": "holy_site_building",
        "recipeType": "worship_building_grant",
        "buildingSpec": {
          "cost": 120,
          "currency": "faith",
          "prerequisiteBuilding": "temple",
          "yields": {
            "faith": 3
          },
          "amenities": 1,
          "cityLoyaltyBonus": 3,
          "description": "+3 信仰，+1 宜居度，所在城忠诚度 +3。"
        },
        "description": "解锁在圣地建造“七级佛塔”：花费 120 信仰购买，提供 +3 信仰、+1 宜居度与 +3 城市固着忠诚度。",
        "aiUtility": {
          "preferenceWeights": {
            "amenities": 0.85,
            "stability": 0.8
          },
          "condition": "border_pressure_or_amenity_deficit"
        }
      },
      {
        "key": "synagogue",
        "name": "祈祷会堂",
        "englishName": "Synagogue",
        "category": "worship",
        "scope": "holy_site_building",
        "recipeType": "worship_building_grant",
        "buildingSpec": {
          "cost": 120,
          "currency": "faith",
          "prerequisiteBuilding": "temple",
          "yields": {
            "faith": 7
          },
          "description": "+7 信仰（最高基础信仰产出）。"
        },
        "description": "解锁在圣地建造“祈祷会堂”：花费 120 信仰购买，提供高达 +7 信仰的巨额每周期产出。",
        "aiUtility": {
          "preferenceWeights": {
            "faithEconomy": 0.95
          },
          "condition": "pure_faith_rush"
        }
      },
      {
        "key": "wat",
        "name": "高棉精舍",
        "englishName": "Wat",
        "category": "worship",
        "scope": "holy_site_building",
        "recipeType": "worship_building_grant",
        "buildingSpec": {
          "cost": 120,
          "currency": "faith",
          "prerequisiteBuilding": "temple",
          "yields": {
            "faith": 3,
            "science": 2
          },
          "description": "+3 信仰，+2 科技。"
        },
        "description": "解锁在圣地建造“高棉精舍”：花费 120 信仰购买，提供 +3 信仰与 +2 科技点数。",
        "aiUtility": {
          "preferenceWeights": {
            "science": 0.9
          },
          "condition": "science_faith_hybrid"
        }
      }
    ]
  },
  "affiliatedReligionSystem": {
    "activationCondition": {
      "rule": "root_founding_slots_full",
      "formula": "activeRootReligions >= Math.min(Object.keys(RELIGIONS).length, Math.ceil(totalPlayers / 2) + 1)",
      "description": "当全图独立创教名额已满，尚未创教的文明（拥有圣地且信仰达到 120 点）可选择转为建立附属宗派（Affiliated Religion）。"
    },
    "hierarchyConstraint": {
      "maxDepth": 1,
      "cyclesAllowed": false,
      "description": "严格单层树状结构（母宗教 -> 附属宗教），禁止嵌套附属（附属宗教不可再被附属），零环路引用。"
    },
    "beliefInheritanceRule": {
      "sharedBeliefs": [
        "follower",
        "worship"
      ],
      "description": "附属宗教全额继承并共享母宗教的普通信条增益：包括追随者信条（Follower Beliefs）的城市主流产出加成，以及礼拜信条（Worship Beliefs）解锁的特色宗教建筑购买权。"
    },
    "asymmetricFollowerMechanics": {
      "strictlyLowerFollowers": {
        "condition": "affiliateFollowers < parentFollowers",
        "mechanic": "full_intelligence_disclosure",
        "effectDescription": "当附属宗教的世界总信众人数严格少于母宗教时，附属国对母宗教创教国公开全部战场与内政情报（母国获得该附属国的全图迷雾视野共享、城市产出明细与部队实时动向）。",
        "targetEntity": "affiliate_player",
        "beneficiary": "parent_founder_player"
      },
      "strictlyHigherFollowers": {
        "condition": "affiliateFollowers > parentFollowers",
        "mechanic": "religious_independence_war_cb",
        "combatBonusAgainstParent": 5,
        "casusBelliKey": "religious_independence_war",
        "diplomaticRules": "遵循正规宣战与和谈准入检查：不可违反既有休战期（truce）、同盟条约（alliance）或基本宣战冷却限制；战争状态下通过正常外交提议和平谈判（propose peace）结束战争，不设强制自动停火倒计时。",
        "effectDescription": "当附属宗教的世界总信众人数严格超过母宗教时，附属国获得专属宣战理由【宗教独立战争】。在对母国宣战期间，附属国全军部队在攻击或防守母国部队与城市时获得 +5 军事战斗力加成（仅针对母国生效，不对其他文明生效）。"
      },
      "strictEquality": {
        "condition": "affiliateFollowers === parentFollowers",
        "effectDescription": "当双方信众人数严格相等时，处于势均力敌均势状态，情报公开与独立宣战 +5 战力加成均不激活。"
      },
      "modernEraCutoff": {
        "condition": "affiliateTechEra >= 5 || parentTechEra >= 5",
        "effectDescription": "当母国或附属国任一方的科技时代达到或超过第 5 时代（现代，Modern Era）时，世俗化进程确立：全面情报公开与宗教独立战争 +5 战力加成永久停用；双方保留普通信条产出与礼拜建筑共享。",
        "modernEraIndex": 5
      }
    },
    "religiousVictoryAccounting": {
      "doubleCountingAllowed": false,
      "identityRule": "附属宗教拥有独立的教派标识符（如 `p.affiliatedReligion = { parentReligionKey, affiliateKey, customName }`），其信众人数由独立计数器统计。在宗教胜利（使自身宗教成为所有文明的主流宗教）判定中，附属宗教与母宗教各自独立核算，严禁将附属教派信众双重计入母宗教胜利门槛。",
      "description": "附属宗教具有独立教派身份与会众归属，母宗教无法借助附属宗教的信众自动达成宗教胜利。"
    },
    "edgeCasesAndFailureModes": {
      "motherNationDestroyedOrReligionKeyChanged": {
        "resolution": "auto_emancipation",
        "action": "当母国文明被灭亡，或母国发生实质性国家宗教Key变更（g.players[parentFounder].religion !== parentReligionKey）时，附属国自动出籍解放为独立实体，永久固化继承既有的追随者信条与礼拜建筑权限；情报公开与从属约束永久解除。在当前引擎中，仅失去首都或首都局部信仰变动不会改变创教国自身的国家宗教Key。"
      },
      "holyCityPillageOrConquest": {
        "resolution": "pressure_preservation",
        "action": "圣地区域受损或被掠夺仅暂停当期产出与新单位招募，已散布的宗教压力与信众数量不灭；城市收复或修复后立即恢复结算。"
      },
      "saveMigrationAndTamperProofing": {
        "schemaValidation": "存档迁移时自动补充 `p.affiliatedReligion ??= null`；反序列化时严格校验 `parentFounder != null && parentFounder !== p.id && !g.players[parentFounder].affiliatedReligion`，防止锻造存档注入循环嵌套或自引用崩溃。"
      }
    }
  },
  "leaderOverlappingGreatPeopleReplacements": [
    {
      "oldKey": "ramesses_ii",
      "oldName": "拉美西斯二世",
      "oldEnglishName": "Ramesses II",
      "newName": "阿蒙涅姆赫卜",
      "newEnglishName": "Amenemheb",
      "canonicalAlias": "amenemheb",
      "overlappingLeader": "拉美西斯二世 (ramesses, 埃及法老)",
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
      "effectDescription": "常态光环：2格范围内远古与古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：先锋战车突击——目标部队及其1格相邻友军获得机动力 +1 与进攻战力 +4 爆发，持续 6 周期（120秒）。",
      "historicalBiography": "古埃及新王国第十八王朝军官与将军，随图特摩斯三世参加叙利亚战役，其在底比斯陵墓（TT85）自传中记载了在美吉多前哨战及叙利亚作战中的英勇战功。"
    },
    {
      "oldKey": "alexander_the_great",
      "oldName": "亚历山大大帝",
      "oldEnglishName": "Alexander the Great",
      "newName": "帕曼纽",
      "newEnglishName": "Parmenion",
      "canonicalAlias": "parmenion",
      "overlappingLeader": "亚历山大 (alexander, 马其顿国王)",
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
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：重装骑兵破阵——目标部队及相邻友军机动力 +1、进攻战力 +5，持续 6 周期（120秒）。",
      "historicalBiography": "马其顿王国资深将领，腓力二世与亚历山大大帝时期的首席副帅，在格拉尼库斯河战役、伊苏斯战役与高加米拉战役中指挥联军骑兵与左翼部队。"
    },
    {
      "oldKey": "julius_caesar",
      "oldName": "尤利乌斯·恺撒",
      "oldEnglishName": "Julius Caesar",
      "newName": "马尔库斯·克劳狄·马塞卢斯",
      "newEnglishName": "Marcus Claudius Marcellus",
      "canonicalAlias": "marcus_claudius_marcellus",
      "overlappingLeader": "尤利乌斯·凯撒 (caesar, 罗马执政官)",
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
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：罗马军团筑垒防卫——2格范围内友军恢复 30 生命值且机动力 +1 持续 4 周期，防守时城市忠诚度 +3。",
      "historicalBiography": "罗马共和国将领与执政官，获誉“罗马之剑”。在第二次布匿战争中直面汉尼拔，并在阿基米德协助城防的叙拉古围城战中攻破要塞叙拉古。"
    },
    {
      "oldKey": "cyrus_the_great",
      "oldName": "居鲁士二世（居鲁士大帝）",
      "oldEnglishName": "Cyrus the Great",
      "newName": "哈尔帕哥斯",
      "newEnglishName": "Harpagus",
      "canonicalAlias": "harpagus",
      "overlappingLeader": "居鲁士 (cyrus, 波斯开国皇帝)",
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
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：不死军誓约——目标陆军部队满血恢复并免费晋升 1 次；所在城军营新编部队初始经验 +6、文化 +2。",
      "historicalBiography": "米底贵族与居鲁士大帝麾下重要将领。在波斯帝国建立过程中统领大军平定小亚细亚诸城邦，以使用土坡堆垒攻破围城工事著称于希罗多德记载。"
    },
    {
      "oldKey": "chandragupta_maurya",
      "oldName": "旃陀罗笈多·孔雀",
      "oldEnglishName": "Chandragupta Maurya",
      "newName": "诃利色那",
      "newEnglishName": "Harishena",
      "canonicalAlias": "harishena",
      "overlappingLeader": "旃陀罗笈多 (chandragupta, 孔雀帝国君主)",
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
      "effectDescription": "常态光环：2格范围内古典陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：目标部队战力永久 +5、移动力 +1，且行动无视敌方控制区（ZOC）。",
      "historicalBiography": "印度笈多帝国宫廷诗人兼高级官员，历任和战大臣（Sandhivigrahika）并兼领军事官阶（Mahadandanayaka），在著名的安拉阿巴德阿育王石柱上撰写了记录沙姆陀罗笈多征战伟绩的铭文颂辞。"
    },
    {
      "oldKey": "mansa_musa",
      "oldName": "曼萨·穆萨",
      "oldEnglishName": "Mansa Musa",
      "newName": "弗朗切斯科·达蒂尼",
      "newEnglishName": "Francesco Datini",
      "canonicalAlias": "francesco_datini",
      "overlappingLeader": "曼萨·穆萨 (mansa-musa, 马里君主)",
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
      "historicalBiography": "中世纪晚期意大利普拉托商人与金融家，在阿维尼翁、比萨、佛罗伦萨等地建立商业网络，广泛使用汇票并完整保存了反映中世纪地中海商业活动的庞大私人账簿文书。"
    },
    {
      "oldKey": "saladin",
      "oldName": "萨拉丁",
      "oldEnglishName": "Saladin",
      "newName": "塔里克·伊本·齐亚德",
      "newEnglishName": "Tariq ibn Ziyad",
      "canonicalAlias": "tariq_ibn_ziyad",
      "overlappingLeader": "萨拉丁 (saladin, 阿尤布苏丹)",
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
      "effectDescription": "常态光环：2格范围内中古陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：圣城宽厚之誓——目标城市忠诚度瞬时回满，城墙修复 100 生命值，获得 150 信仰储备。",
      "historicalBiography": "倭马亚王朝将领，公元711年率军渡过直布罗陀海峡（直布罗陀即源自其名），在瓜达莱特战役中击败西哥特国王罗德里克，拉开穆斯林经略伊比利亚半岛的序幕。"
    },
    {
      "oldKey": "shaka_zulu",
      "oldName": "夏卡·祖鲁",
      "oldEnglishName": "Shaka Zulu",
      "newName": "芒达瓦",
      "newEnglishName": "Mdlaka kaNcidi",
      "canonicalAlias": "mdlaka_kancidi",
      "overlappingLeader": "沙卡 (shaka, 祖鲁君主)",
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
      "effectDescription": "常态光环：2格范围内工业陆军战力 +5，移动力 +1（最高取一，不叠加）。退役激活：牛角突击阵——目标陆军战力永久 +6，攻城战力额外 +4，消灭敌军获 10 金币战利品。",
      "historicalBiography": "祖鲁王国早期资深军政头领（Induna）与前线将领，在沙卡统一祖鲁各部期间担任主力军团指挥官，多次统率伊布托军团执行作战任务。"
    }
  ],
  "movementAndWarfareRefinements": {
    "gustavusAdolphusAuraAdjustment": {
      "targetKey": "gustavus_adolphus",
      "previousAuraField": "artilleryMoveAndShoot (redundant in engine where all units move and shoot)",
      "updatedAura": {
        "applicableEras": [
          3,
          4
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 0,
        "artilleryMovementBonus": 1,
        "artilleryRange": 0,
        "domain": "land",
        "special": "none"
      },
      "description": "常态光环：2格范围内文艺复兴与工业火器攻城部队战力 +5、移动力 +1（最高取一，不叠加）。保留原有退役参数与其它既有数值强度。",
      "historicalRationale": "古斯塔夫·阿道夫改良了三磅团属野战火炮，使炮兵具备随步骑同速机动能力。赋予攻城火炮 +1 移动力直接提升战术机动性，且无需引入全局削弱规则。"
    },
    "davidFarragutAuraAdjustment": {
      "targetKey": "david_farragut",
      "removedDormantField": "ignoreSeaMines (sea mines were never implemented in engine)",
      "actualEngineAura": {
        "applicableEras": [
          4,
          5
        ],
        "radius": 2,
        "combatStrength": 5,
        "movement": 0,
        "artilleryRange": 0,
        "ignoreEnemyTerritoryWaterPenalty": true,
        "ignoreZoc": true,
        "domain": "sea",
        "special": "ignoreEnemyTerritoryWaterPenaltyAndZoc"
      },
      "description": "常态光环：2格范围内工业与现代海军战力 +5，舰队航行无视敌方领海减速惩罚与敌舰控制区（ZOC）（同类不叠加）。保留原有退役港口炮轰战力 +8 与舰队移动 +1 持续 5 周期全额强度。",
      "historicalRationale": "法拉格特在莫比尔湾海战中强行突入敌方水域并突破封锁，对应游戏内无视敌方领海减速惩罚与无视控制区（ZOC）拦截。"
    },
    "preservedMechanicsVerification": {
      "civ6ZocSystem": "陆地与海军单位控制区（ZOC）拦截行动力消耗机制由 Codex 实装，诃利色那（原旃陀罗笈多）与指定特种部队保留无视 ZOC（`ignoreZoc: true`）的战术特性。",
      "hostileTerritorialSeaPenalty": "进入敌对文明领海地块默认扣除额外移动力，法拉格特与特定海军名将提供领海减速豁免（`ignoreEnemyTerritoryWaterPenalty: true`）。",
      "submarineConcealmentAndDetection": "潜艇单位默认在未进入相邻 1 格时不被敌方普通舰船感知，仅驱逐舰、巡洋舰与相邻 1 格单位能揭示其潜行坐标。",
      "navalRetreatRelocation": "受致命重创的海军战舰在满足撤退判定时，自动后撤至离攻击者更远的相邻空闲合法水域地块（不传送至港口；严格沿用现有大将撤退概率与低生命阈值，不发生航母拆分）。",
      "improvementTourism": "改良设施旅游产出机制：在市政【印刷术】（printing）后种植园每处产出 1 旅游；在科技【飞行】（flight）后全图所有正在工作且未被掠夺的改良设施产出至少 1 旅游（文化产出更高者取文化值）。金门大桥（wonder key: `golden_gate`）使所在城市改良地块基础旅游业绩翻倍（cityTileImprovementTourismMultiplier: 1）。原有全局飞行旅游系数保留，不凭空添加国家公园或滨海度假区实体。",
      "nationwideArsenalTwoShips": "威尼斯军械库（`venetian_arsenal`）全国所有沿海城市训练海军单位一式双份且维护费正常结算。",
      "mausoleumEngineerCharges": "摩索拉斯王陵墓（`mausoleum_halicarnassus`）招募的大工程师免费额外获得 +1 次激活次数。",
      "oxfordUniversityFreeTechs": "牛津大学（`oxford_university`）建成时立即赠予 2 项随机免费科技并提供大学科技产出提升。",
      "commandersHighestOnlyRule": "所有大统帅与大海军家的常态光环、退役攻击力、移动力、射程加成同属性一律取最高生效值，严格不叠加。",
      "wonderAbsoluteLoyalty": "自由女神像（`statue_of_liberty`）6 格半径内城市 100% 绝对忠诚度与拉什莫尔山（`mount_rushmore`）绝对反叛乱免疫权威保留。"
    }
  },
  "saveMigrationContract": {
    "playerStateFields": {
      "pantheon": "string | null",
      "beliefs": "string[]",
      "affiliatedReligion": {
        "isAffiliated": "boolean",
        "parentFounderId": "number | null",
        "parentReligionKey": "string | null",
        "affiliateKey": "string | null",
        "customName": "string | null",
        "independenceWarDeclared": "boolean",
        "independenceWarDeclaredCycle": "number | null"
      }
    },
    "migrationRules": [
      "旧存档中 `p.religion` 为纯字符串（如 'harvest'）的文明，自动迁移至新结构，默认赋予对应名称并保留其原版 +3 主流产出兼容。",
      "未创教文明反序列化时自动补齐 `p.pantheon = null`, `p.beliefs = []`, `p.affiliatedReligion = null`。",
      "8 位重名伟人旧存档中的 `key` 保持 100% 相同（如 `ramesses_ii`, `alexander_the_great`），展示名与传记在加载时平滑映射为新历史伟人，正在生效的光环与退役 Recipe 参数零损耗继续生效。"
    ]
  }
};
export const PANTHEONS = RELIGION_DESIGN.pantheons;
export const BELIEFS = RELIGION_DESIGN.beliefs;
