// Public presentation constants; no simulation state or hidden geography.
export const CLIMATE_VERSION = 1;
export const CLIMATE_PHASES = ['稳定', '初步变暖', '持续升温', '冰川消退', '海岸受淹', '极端气候', '气候危机', '高温世界'];
export const DISASTERS = {
  flood: {name: '洪水', duration: 2, damage: 12, fertility: true},
  drought: {name: '干旱', duration: 4, damage: 0},
  blizzard: {name: '暴风雪', duration: 3, damage: 14, moving: true},
  duststorm: {name: '沙尘暴', duration: 3, damage: 10, moving: true, fertility: true},
  hurricane: {name: '飓风', duration: 3, damage: 18, moving: true, fertility: true},
  eruption: {name: '火山喷发', duration: 2, damage: 22, fertility: true}
};
export const CLIMATE_BUILDINGS = ['dam', 'floodbarrier', 'reservoir', 'hydroplant', 'windplant', 'solarplant'];
export const CLEAN_POWER = ['hydroplant', 'windplant', 'solarplant'];
export const CLIMATE_ART = {
  overview: '/assets/climate/world-climate.webp',
  flood: '/assets/climate/flood.webp', drought: '/assets/climate/drought.webp',
  blizzard: '/assets/climate/blizzard.webp', duststorm: '/assets/climate/duststorm.webp',
  hurricane: '/assets/climate/hurricane.webp', eruption: '/assets/climate/eruption.webp'
};
