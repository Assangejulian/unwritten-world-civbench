// Versioned historical leader rules. Legacy worlds retain the original catalogue.
// Descriptions are derived below from the same values used by the engine.
export const LEADER_RULES_VERSION=2;
export const REWORKED_LEADERS={
  "qin": {
    "key": "qin",
    "passive": {
      "effects": {
        "builderCharges": 1,
        "wonderProduction": 0.15,
        "chopMultiplier": 0.25
      },
      "cities": [
        {
          "when": "capitalOrWalls",
          "flat": {
            "culture": 2,
            "production": 1
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "wonderProduction": 0.35,
        "districtProduction": 0.2,
        "builderProduction": 0.4
      },
      "cities": [
        {
          "when": "walls",
          "flat": {
            "production": 3
          },
          "multipliers": {}
        }
      ],
      "instant": {
        "wonderAndWallProgressCycles": 1.5
      }
    },
    "uniqueUnit": "qin_crossbow",
    "uniqueBuilding": "great_wall_bastion",
    "weights": {
      "industry": 0.5,
      "culture": 0.5
    },
    "duration": 50,
    "cooldown": 160
  },
  "han-wudi": {
    "key": "han-wudi",
    "passive": {
      "effects": {
        "cavalryUpkeepDiscount": 0.15
      },
      "cities": [
        {
          "when": "workedMine",
          "flat": {
            "gold": 2
          },
          "multipliers": {}
        },
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 2
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "cavalryOpen",
          "combat": 4
        }
      ]
    },
    "active": {
      "effects": {
        "militaryProduction": 0.3,
        "killGold": 15
      },
      "units": [
        {
          "when": "cavalry",
          "combat": 4
        }
      ],
      "cities": [
        {
          "when": "commercial",
          "flat": {
            "production": 2
          },
          "multipliers": {
            "production": 0.2
          }
        }
      ]
    },
    "uniqueUnit": "han_cavalry",
    "uniqueBuilding": "salt_iron_office",
    "weights": {
      "aggression": 0.65,
      "industry": 0.3,
      "commerce": 0.25
    },
    "duration": 40,
    "cooldown": 140
  },
  "taizong": {
    "key": "taizong",
    "passive": {
      "cities": [
        {
          "when": "peace",
          "flat": {},
          "multipliers": {
            "food": 0.15,
            "culture": 0.12
          }
        },
        {
          "when": "war",
          "flat": {},
          "multipliers": {
            "production": 0.1
          }
        },
        {
          "when": "route",
          "flat": {
            "food": 1,
            "culture": 1
          },
          "multipliers": {}
        }
      ],
      "effects": {
        "wartimeLandUpkeepDiscount": 0.2
      }
    },
    "active": {
      "units": [
        {
          "when": "meleeOrCavalry",
          "combat": 5
        }
      ],
      "cities": [
        {
          "when": "domesticRoute",
          "flat": {
            "production": 2,
            "gold": 2
          },
          "multipliers": {}
        }
      ],
      "instant": {
        "heal": 10,
        "homeOnly": true,
        "unitClass": "military"
      }
    },
    "uniqueUnit": "xuanjia_knight",
    "uniqueBuilding": "honglu_pavilion",
    "weights": {
      "growth": 0.5,
      "commerce": 0.35,
      "culture": 0.3
    },
    "duration": 40,
    "cooldown": 140
  },
  "wu-zetian": {
    "key": "wu-zetian",
    "passive": {
      "effects": {
        "projectProduction": 0.25,
        "intelligenceBonus": 1
      },
      "cities": [
        {
          "when": "campus",
          "flat": {
            "culture": 2
          },
          "multipliers": {}
        },
        {
          "when": "holy",
          "flat": {
            "science": 2
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "congressVotes": 1
      },
      "cities": [
        {
          "when": "holy",
          "flat": {},
          "multipliers": {
            "faith": 0.3,
            "culture": 0.25
          }
        },
        {
          "when": "campus",
          "flat": {},
          "multipliers": {
            "science": 0.25
          }
        }
      ],
      "instant": {
        "loyalty": 10
      }
    },
    "uniqueUnit": "wuju_guard",
    "uniqueBuilding": "mingtang_hall",
    "weights": {
      "faith": 0.4,
      "culture": 0.45,
      "science": 0.4
    },
    "duration": 40,
    "cooldown": 140
  },
  "sejong": {
    "key": "sejong",
    "passive": {
      "cities": [
        {
          "when": "campus",
          "flat": {
            "culture": 2,
            "food": 2
          },
          "multipliers": {
            "science": 0.15
          }
        },
        {
          "when": "capital",
          "flat": {
            "science": 3
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "science": 0.2
      },
      "cities": [
        {
          "when": "campus",
          "flat": {},
          "multipliers": {
            "science": 0.15,
            "culture": 0.25
          }
        }
      ],
      "instant": {
        "scienceBurst": 25
      }
    },
    "uniqueUnit": "hwacha",
    "uniqueBuilding": "jiphyeonjeon",
    "weights": {
      "science": 0.75,
      "culture": 0.35
    },
    "duration": 40,
    "cooldown": 140
  },
  "tokugawa": {
    "key": "tokugawa",
    "passive": {
      "effects": {
        "foreignPressureReduction": 0.5
      },
      "cities": [
        {
          "when": "domesticRoute",
          "flat": {
            "science": 2,
            "culture": 2,
            "gold": 1
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "homeDefense",
          "combat": 4
        }
      ]
    },
    "active": {
      "cities": [
        {
          "when": "peace",
          "flat": {},
          "multipliers": {
            "production": 0.25,
            "culture": 0.2
          }
        }
      ],
      "units": [
        {
          "when": "homeDefense",
          "combat": 5
        }
      ],
      "instant": {
        "heal": 10,
        "homeOnly": true,
        "unitClass": "military"
      }
    },
    "uniqueUnit": "hatamoto_samurai",
    "uniqueBuilding": "tenshu_keep",
    "weights": {
      "industry": 0.45,
      "commerce": 0.4,
      "culture": 0.3,
      "aggression": -0.3
    },
    "duration": 50,
    "cooldown": 150
  },
  "alexander": {
    "key": "alexander",
    "passive": {
      "effects": {
        "killScience": 10,
        "cityWearinessImmunity": 1,
        "captureHeal": 12
      },
      "units": [
        {
          "when": "assault",
          "combat": 3
        }
      ]
    },
    "active": {
      "effects": {
        "militaryProduction": 0.25
      },
      "units": [
        {
          "when": "meleeOrCavalry",
          "combat": 5
        }
      ],
      "instant": {
        "heal": 15,
        "unitClass": "military"
      }
    },
    "uniqueUnit": "hetairoi",
    "uniqueBuilding": "basilikoi_paides",
    "weights": {
      "aggression": 0.8,
      "science": 0.25
    },
    "duration": 35,
    "cooldown": 140
  },
  "caesar": {
    "key": "caesar",
    "passive": {
      "effects": {
        "killGold": 15,
        "xpMultiplier": 0.35,
        "upgradeDiscount": 0.25
      },
      "units": [
        {
          "when": "melee",
          "combat": 3
        }
      ]
    },
    "active": {
      "effects": {
        "militaryProduction": 0.25,
        "captureRelief": 2
      },
      "units": [
        {
          "when": "melee",
          "combat": 5
        },
        {
          "when": "siege",
          "combat": 4
        }
      ],
      "instant": {
        "loyalty": 20,
        "occupationRelief": 1
      }
    },
    "uniqueUnit": "roman_legion",
    "uniqueBuilding": "triumphal_forum",
    "weights": {
      "aggression": 0.75,
      "industry": 0.25
    },
    "duration": 35,
    "cooldown": 140
  },
  "augustus": {
    "key": "augustus",
    "passive": {
      "effects": {
        "settlerProduction": 0.2,
        "capitalBuildingEcho": 0.2,
        "freeMonumentOnFound": 1
      },
      "cities": [
        {
          "when": "peace",
          "flat": {},
          "multipliers": {
            "production": 0.12
          }
        },
        {
          "when": "capital",
          "flat": {
            "culture": 3,
            "gold": 3
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "districtProduction": 0.35,
        "wonderProduction": 0.3
      },
      "cities": [
        {
          "when": "peace",
          "flat": {},
          "multipliers": {
            "culture": 0.2,
            "gold": 0.2
          }
        }
      ]
    },
    "uniqueUnit": "praetorian_guard",
    "uniqueBuilding": "roman_bath",
    "weights": {
      "industry": 0.55,
      "culture": 0.45
    },
    "duration": 50,
    "cooldown": 150
  },
  "pericles": {
    "key": "pericles",
    "passive": {
      "effects": {
        "congressVotes": 1
      },
      "cities": [
        {
          "when": "theater",
          "flat": {
            "science": 2
          },
          "multipliers": {
            "culture": 0.2
          }
        },
        {
          "when": "capital",
          "flat": {
            "science": 2,
            "culture": 2
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "culture": 0.2,
        "wonderProduction": 0.25
      },
      "cities": [
        {
          "when": "theater",
          "flat": {},
          "multipliers": {
            "culture": 0.2,
            "tourism": 0.35
          }
        }
      ],
      "instant": {
        "tourismPerTheater": 25
      }
    },
    "uniqueUnit": "athenian_trireme",
    "uniqueBuilding": "acropolis_odeon",
    "weights": {
      "culture": 0.75,
      "science": 0.25,
      "naval": 0.25
    },
    "duration": 50,
    "cooldown": 150
  },
  "cyrus": {
    "key": "cyrus",
    "passive": {
      "effects": {
        "captureRelief": 2
      },
      "cities": [
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 2,
            "culture": 2
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "landMove": 1
      },
      "units": [
        {
          "when": "meleeOrCavalry",
          "combat": 4
        }
      ],
      "instant": {
        "loyalty": 20,
        "occupationRelief": 2
      }
    },
    "uniqueUnit": "persian_immortal",
    "uniqueBuilding": "pairidaeza_garden",
    "weights": {
      "aggression": 0.55,
      "commerce": 0.5,
      "culture": 0.3
    },
    "duration": 40,
    "cooldown": 140
  },
  "darius": {
    "key": "darius",
    "passive": {
      "effects": {
        "commercialProduction": 0.25,
        "purchaseDiscount": 0.15
      },
      "cities": [
        {
          "when": "route",
          "flat": {
            "gold": 2,
            "production": 1
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "gold": 0.25,
        "tradeCapacity": 2
      },
      "cities": [
        {
          "when": "route",
          "flat": {
            "production": 2,
            "culture": 1
          },
          "multipliers": {}
        }
      ]
    },
    "uniqueUnit": "scythed_chariot",
    "uniqueBuilding": "satraps_court",
    "weights": {
      "commerce": 0.75,
      "industry": 0.35
    },
    "duration": 50,
    "cooldown": 150
  },
  "cleopatra": {
    "key": "cleopatra",
    "passive": {
      "cities": [
        {
          "when": "river",
          "flat": {},
          "multipliers": {
            "food": 0.15,
            "gold": 0.15
          }
        },
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 3,
            "culture": 1
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "cities": [
        {
          "when": "river",
          "flat": {},
          "multipliers": {
            "food": 0.3,
            "production": 0.2,
            "science": 0.15
          }
        },
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 2,
            "culture": 2
          },
          "multipliers": {}
        }
      ]
    },
    "uniqueUnit": "ptolemaic_flagship",
    "uniqueBuilding": "ptolemaic_mouseion",
    "weights": {
      "growth": 0.45,
      "commerce": 0.65,
      "culture": 0.35
    },
    "duration": 50,
    "cooldown": 150
  },
  "hatshepsut": {
    "key": "hatshepsut",
    "passive": {
      "effects": {
        "wonderProduction": 0.15
      },
      "cities": [
        {
          "when": "foreignRoute",
          "flat": {
            "faith": 2,
            "production": 1,
            "gold": 1
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "harborProduction": 0.35,
        "tradeCapacity": 1
      },
      "cities": [
        {
          "when": "coast",
          "flat": {},
          "multipliers": {
            "gold": 0.25
          }
        },
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 3,
            "faith": 2,
            "culture": 1
          },
          "multipliers": {}
        }
      ]
    },
    "uniqueUnit": "punt_expedition_ship",
    "uniqueBuilding": "mortuary_temple",
    "weights": {
      "commerce": 0.55,
      "faith": 0.45,
      "naval": 0.35
    },
    "duration": 50,
    "cooldown": 150
  },
  "ramesses": {
    "key": "ramesses",
    "passive": {
      "effects": {
        "wonderProduction": 0.2,
        "wonderCultureRefund": 0.2
      },
      "cities": [
        {
          "when": "walls",
          "flat": {
            "culture": 2,
            "production": 1
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "cavalryOrSiege",
          "combat": 2
        }
      ]
    },
    "active": {
      "effects": {
        "wonderProduction": 0.35
      },
      "cities": [
        {
          "when": "holy",
          "flat": {
            "culture": 3,
            "faith": 3
          },
          "multipliers": {
            "tourism": 0.25
          }
        }
      ],
      "units": [
        {
          "when": "cavalryOrSiege",
          "combat": 4
        }
      ]
    },
    "uniqueUnit": "maryannu_chariot",
    "uniqueBuilding": "obelisk",
    "weights": {
      "culture": 0.5,
      "faith": 0.35,
      "industry": 0.35
    },
    "duration": 50,
    "cooldown": 160
  },
  "ashoka": {
    "key": "ashoka",
    "passive": {
      "effects": {
        "missionaryCharges": 1,
        "housing": 1
      },
      "cities": [
        {
          "when": "peace",
          "flat": {},
          "multipliers": {
            "faith": 0.15,
            "food": 0.12
          }
        },
        {
          "when": "religion",
          "flat": {
            "faith": 2
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "cities": [
        {
          "when": "holy",
          "flat": {},
          "multipliers": {
            "faith": 0.35,
            "culture": 0.25
          }
        }
      ],
      "instant": {
        "heal": 15,
        "homeOnly": true,
        "unitClass": "military"
      }
    },
    "uniqueUnit": "dharma_elephant",
    "uniqueBuilding": "edict_pillar",
    "weights": {
      "faith": 0.75,
      "growth": 0.35,
      "aggression": -0.3
    },
    "duration": 50,
    "cooldown": 150
  },
  "chandragupta": {
    "key": "chandragupta",
    "passive": {
      "effects": {
        "militaryProduction": 0.12
      },
      "cities": [
        {
          "when": "capital",
          "flat": {},
          "multipliers": {
            "production": 0.15
          }
        },
        {
          "when": "river",
          "flat": {
            "production": 2
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "cavalryOrSiege",
          "combat": 3
        }
      ]
    },
    "active": {
      "effects": {
        "militaryProduction": 0.3,
        "captureRelief": 1,
        "landMove": 1
      },
      "units": [
        {
          "when": "cavalryOrSiege",
          "combat": 5
        }
      ],
      "cities": [
        {
          "when": "river",
          "flat": {
            "production": 2
          },
          "multipliers": {}
        }
      ]
    },
    "uniqueUnit": "maurya_war_elephant",
    "uniqueBuilding": "maurya_stepwell",
    "weights": {
      "aggression": 0.65,
      "industry": 0.45
    },
    "duration": 35,
    "cooldown": 140
  },
  "saladin": {
    "key": "saladin",
    "passive": {
      "cities": [
        {
          "when": "holy",
          "flat": {
            "science": 2,
            "culture": 2
          },
          "multipliers": {}
        },
        {
          "when": "religion",
          "flat": {},
          "multipliers": {
            "faith": 0.15,
            "science": 0.1
          }
        }
      ],
      "units": [
        {
          "when": "cavalry",
          "combat": 3
        }
      ]
    },
    "active": {
      "cities": [
        {
          "when": "religion",
          "flat": {},
          "multipliers": {
            "science": 0.25,
            "faith": 0.3
          }
        }
      ],
      "units": [
        {
          "when": "cavalry",
          "combat": 5
        }
      ],
      "instant": {
        "heal": 12,
        "unitClass": "cavalryOrMedical"
      }
    },
    "uniqueUnit": "mamluk_knight",
    "uniqueBuilding": "ayyubid_madrasa",
    "weights": {
      "faith": 0.6,
      "science": 0.45,
      "aggression": 0.35
    },
    "duration": 40,
    "cooldown": 140
  },
  "suleiman": {
    "key": "suleiman",
    "passive": {
      "effects": {
        "captureRelief": 1,
        "siegeTierFlex": 1
      },
      "cities": [
        {
          "when": "commercial",
          "flat": {
            "production": 2,
            "gold": 2
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "siege",
          "combat": 4
        }
      ]
    },
    "active": {
      "effects": {
        "militaryProduction": 0.25,
        "navalCombat": 6
      },
      "units": [
        {
          "when": "siege",
          "combat": 6
        },
        {
          "when": "melee",
          "combat": 3
        }
      ],
      "cities": [
        {
          "when": "harbor",
          "flat": {},
          "multipliers": {
            "gold": 0.25
          }
        }
      ]
    },
    "uniqueUnit": "janissary",
    "uniqueBuilding": "grand_bazaar",
    "weights": {
      "aggression": 0.65,
      "commerce": 0.35,
      "naval": 0.3
    },
    "duration": 35,
    "cooldown": 140
  },
  "genghis": {
    "key": "genghis",
    "passive": {
      "effects": {
        "militaryProduction": 0.1,
        "killGold": 15,
        "intelligenceBonus": 1,
        "cavalryUpkeepDiscount": 0.1
      },
      "cities": [
        {
          "when": "workedPasture",
          "flat": {
            "production": 1,
            "gold": 1
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "cavalry",
          "combat": 2
        },
        {
          "when": "cavalryOpen",
          "combat": 1
        }
      ]
    },
    "active": {
      "effects": {
        "cavalryProduction": 0.4,
        "cavalryMove": 1
      },
      "units": [
        {
          "when": "cavalry",
          "combat": 4
        }
      ],
      "instant": {
        "heal": 8,
        "unitClass": "cavalry"
      }
    },
    "uniqueUnit": "keshig",
    "uniqueBuilding": "mongol_ordu",
    "weights": {
      "aggression": 0.85,
      "growth": 0.2
    },
    "duration": 30,
    "cooldown": 135
  },
  "mansa-musa": {
    "key": "mansa-musa",
    "passive": {
      "effects": {
        "militaryProduction": -0.1,
        "purchaseDiscount": 0.25,
        "purchaseSpeedBonus": 0.5
      },
      "cities": [
        {
          "when": "workedMine",
          "flat": {
            "gold": 3
          },
          "multipliers": {}
        },
        {
          "when": "holy",
          "flat": {
            "science": 2
          },
          "multipliers": {}
        },
        {
          "when": "commercial",
          "flat": {
            "faith": 2
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "gold": 0.35,
        "commercialProduction": 0.3,
        "tradeCapacity": 1
      },
      "cities": [
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 4,
            "faith": 3,
            "culture": 2
          },
          "multipliers": {}
        }
      ]
    },
    "uniqueUnit": "mandekalu_cavalry",
    "uniqueBuilding": "suguba_market",
    "weights": {
      "commerce": 0.8,
      "faith": 0.45
    },
    "duration": 50,
    "cooldown": 160
  },
  "shaka": {
    "key": "shaka",
    "passive": {
      "effects": {
        "meleeUpkeepDiscount": 0.25,
        "flankingMultiplier": 0.5
      },
      "units": [
        {
          "when": "melee",
          "combat": 3
        },
        {
          "when": "homeDefense",
          "combat": 2
        }
      ]
    },
    "active": {
      "effects": {
        "militaryProduction": 0.3,
        "landMove": 1
      },
      "units": [
        {
          "when": "melee",
          "combat": 5
        }
      ],
      "instant": {
        "heal": 14,
        "unitClass": "military"
      }
    },
    "uniqueUnit": "zulu_impi",
    "uniqueBuilding": "ikanda",
    "weights": {
      "aggression": 0.8,
      "industry": 0.25
    },
    "duration": 35,
    "cooldown": 140
  },
  "elizabeth": {
    "key": "elizabeth",
    "passive": {
      "effects": {
        "navalCombat": 3,
        "navalUpkeepDiscount": 0.2,
        "killGold": 15
      },
      "cities": [
        {
          "when": "coast",
          "flat": {
            "gold": 3,
            "production": 1
          },
          "multipliers": {}
        },
        {
          "when": "foreignRoute",
          "flat": {
            "gold": 2,
            "culture": 1
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "navalCombat": 6,
        "navalProduction": 0.4,
        "tradeCapacity": 1
      },
      "cities": [
        {
          "when": "harbor",
          "flat": {},
          "multipliers": {
            "gold": 0.3,
            "production": 0.15
          }
        }
      ]
    },
    "uniqueUnit": "sea_dog",
    "uniqueBuilding": "royal_dockyard",
    "weights": {
      "naval": 0.8,
      "commerce": 0.45
    },
    "duration": 40,
    "cooldown": 140
  },
  "peter": {
    "key": "peter",
    "passive": {
      "effects": {
        "harborProduction": 0.25,
        "tundraBonus": 1
      },
      "cities": [
        {
          "when": "industrial",
          "flat": {
            "science": 2,
            "culture": 1
          },
          "multipliers": {}
        },
        {
          "when": "foreignRoute",
          "flat": {
            "science": 3,
            "culture": 1
          },
          "multipliers": {}
        }
      ]
    },
    "active": {
      "effects": {
        "districtProduction": 0.3,
        "navalProduction": 0.25
      },
      "cities": [
        {
          "when": "industrial",
          "flat": {},
          "multipliers": {
            "science": 0.25
          }
        },
        {
          "when": "harbor",
          "flat": {},
          "multipliers": {
            "production": 0.25
          }
        }
      ]
    },
    "uniqueUnit": "cossack",
    "uniqueBuilding": "peter_arsenal",
    "weights": {
      "industry": 0.55,
      "science": 0.45,
      "naval": 0.4
    },
    "duration": 50,
    "cooldown": 150
  },
  "pachacuti": {
    "key": "pachacuti",
    "passive": {
      "effects": {
        "builderProduction": 0.2
      },
      "cities": [
        {
          "when": "workedHill",
          "flat": {
            "food": 2,
            "production": 1
          },
          "multipliers": {}
        }
      ],
      "units": [
        {
          "when": "hillDefense",
          "combat": 4
        }
      ]
    },
    "active": {
      "effects": {
        "districtProduction": 0.3
      },
      "cities": [
        {
          "when": "workedHill",
          "flat": {
            "production": 2,
            "gold": 1
          },
          "multipliers": {}
        },
        {
          "when": "domesticRoute",
          "flat": {
            "food": 3,
            "gold": 2
          },
          "multipliers": {}
        }
      ]
    },
    "uniqueUnit": "warakaq",
    "uniqueBuilding": "inca_tambo",
    "weights": {
      "growth": 0.65,
      "industry": 0.55
    },
    "duration": 50,
    "cooldown": 150
  }
};
export const HISTORICAL_TRADITIONS={
  "qin": 7,
  "han-wudi": 1,
  "taizong": 2,
  "wu-zetian": 6,
  "sejong": 0,
  "tokugawa": 7,
  "alexander": 1,
  "caesar": 1,
  "augustus": 4,
  "pericles": 4,
  "cyrus": 3,
  "darius": 3,
  "cleopatra": 2,
  "hatshepsut": 5,
  "ramesses": 4,
  "ashoka": 6,
  "chandragupta": 1,
  "saladin": 0,
  "suleiman": 1,
  "genghis": 1,
  "mansa-musa": 3,
  "shaka": 1,
  "elizabeth": 5,
  "peter": 5,
  "pachacuti": 7
};

const cityLabels={capital:'原始首都',capitalOrWalls:'原始首都或有远古城墙的城市',peace:'本国没有对外战争时的城市',war:'本国处于战争时的城市',river:'沿河城市',coast:'沿海城市',religion:'信奉本国宗教的城市',campus:'有学院的城市',holy:'有圣地的城市',industrial:'有工业区的城市',commercial:'有商业中心的城市',theater:'有剧院广场的城市',harbor:'有港口的城市',walls:'有远古城墙的城市',route:'每条商路',domesticRoute:'每条国内商路',foreignRoute:'每条国外商路',workedMine:'每块工作的矿山',workedPasture:'每块工作的牧场',workedHillFarm:'每块工作的丘陵农场',workedHill:'每块工作的丘陵'};
const yieldLabels={food:'食物',production:'生产力',gold:'金币',science:'科技',culture:'文化',faith:'信仰',tourism:'旅游'};
const unitLabels={cavalry:'骑兵',cavalryOpen:'开阔地骑兵',melee:'陆地近战及反骑兵',meleeOrCavalry:'陆地近战及骑兵',assault:'陆地近战及骑兵进攻',homeDefense:'本国领土防守',cavalryHomeDefense:'本国骑兵防守',siege:'攻城单位',cavalryOrSiege:'骑兵及攻城单位',hillDefense:'丘陵防守'};
const percent=n=>Math.round(n*100)+'%';
function effectDescription(key,n){
 const yields=yieldLabels[key];if(yields)return yields+' '+(n>=0?'+':'')+percent(n);
 const production={militaryProduction:'军事单位',navalProduction:'海军',cavalryProduction:'骑兵',builderProduction:'建造者',settlerProduction:'开拓者',wonderProduction:'奇观',districtProduction:'区域',projectProduction:'城市项目',commercialProduction:'商业中心',harborProduction:'港口'};
 if(production[key])return production[key]+'生产 '+(n>=0?'+':'')+percent(n);
 const labels={builderCharges:'建造者使用次数 +',missionaryCharges:'传教士传播次数 +',housing:'每城住房 +',navalCombat:'海军战力 +',intelligenceBonus:'已遇到文明的情报等级 +',captureRelief:'占领惩罚缩短经济周期数 ',landMove:'陆地军事单位单次移动上限与预算 +',cavalryMove:'骑兵单次移动上限与预算 +',tradeCapacity:'临时贸易容量 +'};
 if(labels[key])return labels[key]+n;
 const discounts={cavalryUpkeepDiscount:'骑兵总军费降低 ',meleeUpkeepDiscount:'陆地近战总军费降低 ',navalUpkeepDiscount:'海军总军费降低 ',wartimeLandUpkeepDiscount:'战时陆地近战与骑兵总军费降低 ',purchaseDiscount:'金币资助费用降低 ',upgradeDiscount:'升级金币费用降低 '};
 if(discounts[key])return discounts[key]+percent(n);
 if(key==='foreignPressureReduction')return '有本土驻军或国内商路时，负向外国人口忠诚压力减少 '+percent(n);
 if(key==='cityWearinessImmunity')return '免除城市厌战忠诚惩罚；外交厌战仍然累计';
 if(key==='captureHeal')return '占城后，三格内未登船军事单位恢复 '+n+' 生命';
 if(key==='killGold'||key==='killScience')return '主动击杀非平民单位获得 '+n+' '+(key==='killGold'?'金币':'科技储备')+' ×（1 + 时代 × 0.5）';
 if(key==='chopMultiplier')return '砍伐生产收益 +'+percent(n);
 if(key==='xpMultiplier')return '战斗经验 +'+percent(n);
 if(key==='capitalBuildingEcho')return '其他城市建造首都已有建筑时生产 +'+percent(n);
 if(key==='freeMonumentOnFound')return '新建城市自带纪念碑';
 if(key==='congressVotes')return '大会开幕时额外 +'+n+' 投票权（总票数最多四票）';
 if(key==='wonderCultureRefund')return '完成区域或奇观返还基础造价的 '+percent(n)+' 为文化储备';
 if(key==='siegeTierFlex')return '攻城兵攻击高一阶城墙时不受错阶减半';
 if(key==='purchaseSpeedBonus')return '资助生产额外加速 '+percent(n)+'（总加速 '+percent(.5+n)+'）';
 if(key==='flankingMultiplier')return '夹击收益 +'+percent(n)+'（总战力最多九点）';
 if(key==='tundraBonus')return '工作冻土地块 +'+n+' 生产力、+'+n+' 信仰';
 throw Error('Missing effect description: '+key);
}
function describe(part){
 const lines=Object.entries(part.effects||{}).map(([k,n])=>effectDescription(k,n));
 for(const rule of part.cities||[]){const bonus=[...Object.entries(rule.flat||{}).map(([k,n])=>yieldLabels[k]+' +'+n),...Object.entries(rule.multipliers||{}).map(([k,n])=>yieldLabels[k]+' +'+percent(n))].join('、');lines.push(cityLabels[rule.when]+'：'+bonus+(/Route|route|worked/.test(rule.when)?'（每城同类最多四处或四条）':''));}
 for(const rule of part.units||[])lines.push(unitLabels[rule.when]+'战力 +'+rule.combat);
 const instant=part.instant;if(instant){if(instant.heal)lines.push('发动时'+(instant.homeOnly?'本国领土内':'')+(instant.unitClass==='cavalry'?'骑兵':instant.unitClass==='cavalryOrMedical'?'骑兵与医疗支援':'未登船军事单位')+'恢复 '+instant.heal+' 生命，不重置行动');if(instant.loyalty)lines.push((instant.occupationRelief?'占领中城市':'所有本国城市')+'忠诚 +'+instant.loyalty);if(instant.occupationRelief)lines.push('占领惩罚立即减少 '+instant.occupationRelief+' 周期');if(instant.wonderAndWallProgressCycles)lines.push('在建奇观或城墙获得 '+instant.wonderAndWallProgressCycles+' 个经济周期的城市基础生产进度');if(instant.scienceBurst)lines.push('立即获得 '+instant.scienceBurst+' ×（1 + 时代 × 0.5）科技储备');if(instant.tourismPerTheater)lines.push('立即获得每座剧院广场 '+instant.tourismPerTheater+' 旅游');}
 return lines.join('；')+'。';
}
for(const leader of Object.values(REWORKED_LEADERS)){leader.passiveDescription=describe(leader.passive);leader.description=describe(leader.active);if(leader.key==='elizabeth')leader.passiveDescription=leader.passiveDescription.replace('主动击杀非平民单位','海军（海狗除外）主动击杀非平民单位');}
