// Authoritative, complete-round climate settlement with a private weather RNG.
import {CLIMATE_VERSION, CLIMATE_PHASES, DISASTERS, CLEAN_POWER, CLIMATE_BUILDINGS} from './climate-data.mjs';
import {UNITS, BUILDINGS, POWER_PLANTS, NATURAL_WONDERS, WORLD_RAINFALL, gamePace, isWater, dist, applyClimateTileYield} from './rules.mjs';
import {neighbors, tilesInRange, seedNumber} from './world.mjs';
import {operationalBuilding} from './leader-events.mjs';

const round = value => Math.round(value * 100) / 100;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const visibleArrays = new WeakMap();
function visibleSet(player) {let set=visibleArrays.get(player.visible);if(!set){set=new Set(player.visible);visibleArrays.set(player.visible,set);}return set;}
const emptySources = () => ({coal: 0, oil: 0, industry: 0, units: 0, deforestation: 0});
const inRange = (g, a, b, range) => dist(g.map.tiles[a], g.map.tiles[b], g.map) <= range;
const operational = (g, c, key) => !g.map.tiles[c.tile].pillaged && operationalBuilding(g,c,key);

function geography(g) {
  const rainfall = [], coastal = [], volcanoes = [], floodplains = [];
  for (const t of g.map.tiles) {
    const hash = seedNumber(g.seed + ':climate:' + t.id), ns = neighbors(g.map, t);
    const base = ({desert: 14, plains: 43, grass: 64, tundra: 32, snow: 24, mountain: 40, coast: 67, ocean: 72})[t.terrain] ?? 50;
    rainfall.push(clamp(base + (hash % 19) - 9 + (t.feature === 'jungle' ? 16 : 0), 0, 100));
    if (!isWater(t) && !t.hill && t.terrain !== 'mountain' && ns.some(isWater)) coastal.push([t.id, hash % 3 + 1]);
    if (t.terrain === 'mountain' && (NATURAL_WONDERS[t.naturalWonder] ? NATURAL_WONDERS[t.naturalWonder].volcano === true : hash % 31 === 0)) volcanoes.push(t.id);
    if (t.river && !isWater(t) && !t.hill && t.terrain !== 'mountain') floodplains.push(t.id);
  }
  return {rainfall, coastal, volcanoes, floodplains};
}

export function initializeClimate(g) {
  validateSettings(g);
  if (g.climate) return g.climate;
  const intensity = g.settings.disasterIntensity ?? 2;
  g.climate = {
    version: CLIMATE_VERSION, enabled: g.settings.climateEnabled !== false,
    lastTurn: g.turn, rng: seedNumber(g.seed + ':weather'), nextId: 1,
    phase: 0, co2: 0, totalEmissions: 0, current: 0, rainfall: WORLD_RAINFALL[g.settings.rainfall||'standard'].rainfall,
    temperatureRise: 0, seaLevel: 0, intensity,
    sources: emptySources(),
    geography: geography(g), accounts: g.players.map(p => ({player: p.id, current: 0, total: 0, captured: 0, pendingDeforestation: 0, sources: emptySources(), totals: emptySources()})),
    disasters: [], recent: [], history: [], fertility: {}, inundated: []
  };
  return g.climate;
}

function validateSettings(g) {
  if(g.settings.rainfall!==undefined&&(typeof g.settings.rainfall!=='string'||!Object.hasOwn(WORLD_RAINFALL,g.settings.rainfall)))throw Error('Invalid saved rainfall setting.');
  if (g.settings.climateEnabled !== undefined && typeof g.settings.climateEnabled !== 'boolean') throw Error('Invalid saved climate settings.');
  if (g.settings.disasterIntensity !== undefined && (!Number.isInteger(g.settings.disasterIntensity) || g.settings.disasterIntensity < 0 || g.settings.disasterIntensity > 4)) throw Error('Invalid saved climate intensity.');
}

function random(c) {
  let value = c.rng = (c.rng + 0x6D2B79F5) >>> 0;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
}

export function climateCityEmissions(g, city) {
  const sources = emptySources();
  if (!g.climate?.enabled || !city || !g.players[city.owner]?.alive) return {current: 0, sources};
  const plant = [...POWER_PLANTS].reverse().find(key => operational(g, city, key));
  if (plant === 'coalplant') sources.coal = 8;
  if (plant === 'oilplant') sources.oil = 5;
  if (operational(g, city, 'factory')) sources.industry = CLEAN_POWER.includes(plant) ? .5 : 2;
  return {current: round(Object.values(sources).reduce((n, v) => n + v, 0)), sources};
}

export function climateCityRisk(g, city) {
  const geo = g.climate?.geography;
  if (!geo) return {flood: false, coast: false, drought: false};
  const owned = new Set(tilesInRange(g.map, g.map.tiles[city.tile], 3).filter(t => t.owner === city.owner).map(t => t.id));
  return {flood: geo.floodplains.some(id => owned.has(id)), coast: geo.coastal.some(([id]) => owned.has(id)),
    drought: [...owned].some(id => geo.rainfall[id] < 40 && !isWater(g.map.tiles[id]))};
}

export function climateBuildReason(g, p, city, item) {
  if (!CLIMATE_BUILDINGS.includes(item) && item !== 'carbonrecapture') return null;
  if (!g.climate?.enabled) return '气候系统未启用';
  const nearby = tilesInRange(g.map, g.map.tiles[city.tile], 3).filter(t => t.owner === p.id);
  if (['dam', 'reservoir'].includes(item) && !nearby.some(t => t.river)) return '需要城市范围内的河流';
  if (item === 'floodbarrier' && !climateCityRisk(g, city).coast) return '需要城市范围内的低洼海岸';
  if (item === 'hydroplant' && !operational(g, city, 'dam')) return '需要完好的水坝';
  return null;
}

export function climateProductionUtility(g, city, item) {
  if (!g.climate?.enabled || !CLIMATE_BUILDINGS.includes(item) && !POWER_PLANTS.includes(item) && item !== 'carbonrecapture') return 0;
  const c = g.climate, phase = c.phase;
  if (POWER_PLANTS.includes(item)) {
    const current = [...POWER_PLANTS].reverse().find(key => operational(g, city, key));
    if (current && POWER_PLANTS.indexOf(item) <= POWER_PLANTS.indexOf(current)) return -140;
    const gain = (BUILDINGS[item].yields.production || 0) - (BUILDINGS[current]?.yields.production || 0);
    const after = (item === 'coalplant' ? 8 : item === 'oilplant' ? 5 : 0) + (operational(g, city, 'factory') ? CLEAN_POWER.includes(item) ? .5 : 2 : 0);
    const avoided = climateCityEmissions(g, city).current - after;
    if (gain <= 0 && avoided <= 0) return -100;
    return round(25 + gain * 6 + avoided * (3 + phase * 2));
  }
  const risk = climateCityRisk(g, city), managed = new Set(tilesInRange(g.map, g.map.tiles[city.tile], 3).filter(t => t.owner === city.owner && (t.territoryCity == null || t.territoryCity === city.id)).map(t => t.id));
  const active = type => c.disasters.some(d => d.type === type && d.tiles.some(id => managed.has(id)));
  if (item === 'dam') return (risk.flood ? 90 + city.population * 2 : 5) + (active('flood') ? 60 : 0);
  if (item === 'floodbarrier') return risk.coast ? 45 + phase * 18 + (c.inundated.some(id => managed.has(id)) ? 60 : 0) : 0;
  if (item === 'reservoir') return (risk.drought && !operational(g, city, 'dam') ? 85 : 30) + (active('drought') && !operational(g, city, 'dam') ? 45 : 0);
  if (c.co2 <= 0) return -140;
  return round(-10 + phase * 12 + Math.min(25, (c.accounts[city.owner]?.current || 0) * 2) + (risk.coast ? 15 : 0));
}

const riskIndices = new WeakMap();
// Static risk is public only for explored terrain; active weather needs current visibility or ownership.
export function climateSitePenalty(g, player, tile, known = new Set(player.explored)) {
  const c = g.climate, geo = c?.geography;
  if (!c?.enabled || !geo || !known.has(tile.id)) return 0;
  let index = riskIndices.get(geo);
  if (!index || index.floodSource !== geo.floodplains || index.coastSource !== geo.coastal || index.volcanoSource !== geo.volcanoes || index.volcanoCount !== geo.volcanoes.length) {
    index = {floodSource:geo.floodplains,coastSource:geo.coastal,volcanoSource:geo.volcanoes,volcanoCount:geo.volcanoes.length,flood:new Set(geo.floodplains),coast:new Map(geo.coastal),volcano:new Set(geo.volcanoes)};
    riskIndices.set(geo, index);
  }
  const flood = index.flood.has(tile.id) && !climateProtection(g, tile, 'flood');
  const coast = index.coast.get(tile.id), exposedCoast = coast && !climateProtection(g, tile, 'coast');
  const volcano = neighbors(g.map, tile).some(n => known.has(n.id) && index.volcano.has(n.id));
  const intensity = c.intensity / 2;
  return round((flood ? 6 * intensity : 0) + (volcano ? 12 * intensity : 0) + (exposedCoast ? c.seaLevel >= coast ? 30 : 2 + c.phase * 3 : 0) + Math.min(35, climateDanger(g, player, tile)));
}

export function climateDanger(g, player, tile) {
  if (!g.climate?.enabled || !g.climate.disasters.length || tile.owner !== player.id && !visibleSet(player).has(tile.id)) return 0;
  return g.climate.disasters.filter(disaster => disaster.tiles.includes(tile.id) && !climateProtection(g, tile, disaster.type))
    .reduce((total, disaster) => total + DISASTERS[disaster.type].damage * disaster.severity, 0);
}

export function recaptureCarbon(g, player, amount = 80) {
  const c = initializeClimate(g);
  if (!c.enabled) return 0;
  const removed = Math.min(c.co2, amount / gamePace(g).factor);
  c.co2 = round(c.co2 - removed);
  c.accounts[player.id].captured = round(c.accounts[player.id].captured + removed);
  return removed;
}

export function recordDeforestation(g, player, feature) {
  const c = g.climate;
  if (!c?.enabled || !['forest', 'jungle'].includes(feature)) return;
  c.accounts[player.id].pendingDeforestation = (c.accounts[player.id].pendingDeforestation || 0) + (feature === 'jungle' ? 4 : 3);
}

function protectingCity(g, tile) {
  if (!Number.isInteger(tile.owner) || tile.owner < 0) return null;
  const byTerritory = g.cities.find(city => city.owner === tile.owner &&
    (city.id === tile.territoryCity || city.id === tile.cityId || city.id === tile.district?.city));
  return byTerritory || g.cities.filter(city => city.owner === tile.owner && inRange(g, city.tile, tile.id, 3))
    .sort((a, b) => dist(g.map.tiles[a.tile], tile, g.map) - dist(g.map.tiles[b.tile], tile, g.map) || a.id - b.id)[0];
}

export function climateProtection(g, tile, type) {
  const city = protectingCity(g, tile);
  if (!city) return false;
  if (type === 'flood') return operational(g, city, 'dam');
  if (type === 'coast') return operational(g, city, 'floodbarrier');
  if (type === 'drought') return operational(g, city, 'reservoir') || operational(g, city, 'dam');
  return false;
}

export function coastalWorkBlocked(g, tile) {
  return !!g.climate?.enabled && g.climate.inundated.includes(tile.id) && !climateProtection(g, tile, 'coast');
}

function hazardTiles(g, type, center, severity) {
  const tile = g.map.tiles[center];
  if (type === 'flood') {
    const selected = new Set([center]), pending = [tile];
    while (pending.length && selected.size < 4 + severity * 2) {
      const current = pending.shift();
      for (const next of neighbors(g.map, current)) if (next.river && !isWater(next) && !next.hill && next.terrain !== 'mountain' && !selected.has(next.id)) {
        selected.add(next.id); pending.push(next);
      }
    }
    return [...selected];
  }
  return tilesInRange(g.map, tile, type === 'hurricane' ? 2 : 1).filter(t =>
    type === 'eruption' ? !isWater(t) : type === 'hurricane' ? t.terrain !== 'mountain' :
    type === 'blizzard' ? ['snow', 'tundra'].includes(t.terrain) :
    type === 'duststorm' ? t.terrain === 'desert' :
    !isWater(t) && !['snow', 'tundra', 'mountain'].includes(t.terrain)).map(t => t.id).slice(0, 19);
}

function eligibleCenter(g, type, tile) {
  const c = g.climate;
  if (type === 'flood') return c.geography.floodplains.includes(tile.id);
  if (type === 'eruption') return c.geography.volcanoes.includes(tile.id);
  if (type === 'hurricane') return isWater(tile);
  if (type === 'blizzard') return ['snow', 'tundra'].includes(tile.terrain);
  if (type === 'duststorm') return tile.terrain === 'desert';
  return !isWater(tile) && !['snow', 'tundra', 'mountain'].includes(tile.terrain) && c.geography.rainfall[tile.id] + c.rainfall - 50 < 52;
}

// This is a host-side simulation primitive, never an exposed player command.
export function startDisaster(g, type, center, {severity = 1} = {}) {
  const c = initializeClimate(g);
  if (!DISASTERS[type] || !Number.isInteger(center) || !g.map.tiles[center] || !eligibleCenter(g, type, g.map.tiles[center])) throw Error('Invalid disaster geography.');
  if (!Number.isInteger(severity) || severity < 1 || severity > 3) throw Error('Invalid disaster severity.');
  if (!c.enabled || c.disasters.length >= 6) return null;
  const disaster = {id: c.nextId++, type, severity, center, tiles: hazardTiles(g, type, center, severity),
    started: g.turn, remaining: DISASTERS[type].duration, lastApplied: g.turn - 1, direction: Math.floor(random(c) * 6)};
  c.disasters.push(disaster);
  return disaster;
}

function damageFootprint(g, disaster, emit) {
  const spec = DISASTERS[disaster.type], warnings = new Map();
  for (const id of disaster.tiles) {
    const tile = g.map.tiles[id];
    if (climateProtection(g, tile, disaster.type)) continue;
    const damage = spec.damage * disaster.severity;
    if (spec.damage && (tile.improvement || tile.district && tile.district.kind !== 'wonder')) tile.pillaged = true;
    if (spec.damage && tile.road) tile.roadPillaged = true;
    if (tile.fort && spec.damage) tile.fort.hp = Math.min(tile.fort.hp, Math.max(1, tile.fort.hp - damage));
    const city = g.cities.find(city => city.tile === id);
    if (city && spec.damage) {
      city.hp = Math.min(city.hp, Math.max(1, city.hp - damage));
      // Catastrophic losses are bounded: never delete a city or its last citizen.
      if (disaster.severity === 3 && disaster.lastApplied < disaster.started && city.population > 2) city.population--;
    }
    const state = g.cityStates?.states.find(state => state.tile === id && state.capturedBy === null);
    if (state && spec.damage) {
      state.hp = Math.min(state.hp, Math.max(1, state.hp - damage));
      if (disaster.severity === 3 && disaster.lastApplied < disaster.started && state.population > 2) state.population--;
    }
    for (const unit of g.units.filter(unit => unit.tile === id && unit.hp > 0)) {
      if (spec.damage) unit.hp = Math.max(unit.greatPerson || unit.envoy ? 1 : 0, unit.hp - damage);
      if (unit.owner >= 0) warnings.set(unit.owner, id);
    }
    if (tile.owner >= 0 && Number.isInteger(tile.owner)) warnings.set(tile.owner, id);
    // Fertility is rare, bounded and awarded once, not every storm frame.
    if (spec.fertility && disaster.lastApplied < disaster.started && !isWater(tile) && tile.terrain !== 'mountain' && random(g.climate) < .22) {
      const fertility = g.climate.fertility[id] ||= {food: 0, production: 0};
      if (fertility.food + fertility.production < 2) fertility[disaster.type === 'eruption' ? 'production' : 'food']++;
    }
  }
  if (disaster.lastApplied < disaster.started) for (const [owner, tile] of warnings) emit?.(g, 'disaster', `${DISASTERS[disaster.type].name}影响了你的领土或部队。`, owner, tile);
  disaster.lastApplied = g.turn;
}

function moveStorm(g, disaster) {
  if (!DISASTERS[disaster.type].moving || disaster.started === g.turn) return;
  const candidates = neighbors(g.map, g.map.tiles[disaster.center]).filter(tile => eligibleCenter(g, disaster.type, tile));
  if (!candidates.length) return;
  const next = candidates[(disaster.direction + disaster.remaining) % candidates.length];
  disaster.center = next.id;
  disaster.tiles = hazardTiles(g, disaster.type, next.id, disaster.severity);
}

export function settleClimate(g, {event: emit} = {}) {
  const c = initializeClimate(g);
  if (!c.enabled || c.lastTurn >= g.turn) return false;
  c.lastTurn = g.turn;
  let emissions = 0;
  for (const account of c.accounts) {
    const sources = emptySources(), player = g.players[account.player];
    if (player.alive) {
      for (const city of g.cities.filter(city => city.owner === player.id)) {
        const local = climateCityEmissions(g, city).sources;
        for (const key of Object.keys(sources)) sources[key] += local[key];
      }
      for (const unit of g.units.filter(unit => unit.owner === player.id && unit.hp > 0)) {
        if (['oil', 'uranium'].includes(UNITS[unit.type]?.resource) && UNITS[unit.type].resource !== 'uranium') sources.units += .25;
      }
    }
    sources.deforestation = account.pendingDeforestation || 0; account.pendingDeforestation = 0;
    account.sources = Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, round(value)]));
    account.totals ||= emptySources();
    for (const key of Object.keys(sources)) account.totals[key] = round((account.totals[key] || 0) + sources[key]);
    account.current = round(Object.values(sources).reduce((n, value) => n + value, 0));
    account.total = round(account.total + account.current); emissions += account.current;
  }
  c.current = round(emissions); c.totalEmissions = round(c.totalEmissions + emissions);
  c.sources = Object.fromEntries(Object.keys(emptySources()).map(key => [key, round(c.accounts.reduce((sum, account) => sum + (account.totals[key] || 0), 0))]));
  c.co2 = round(c.co2 + emissions / gamePace(g).factor);
  const perPlayer = c.co2 / Math.max(1, g.players.length), thresholds = [150, 350, 600, 900, 1300, 1800, 2400];
  const nextPhase = thresholds.filter(value => perPlayer >= value).length;
  if (nextPhase > c.phase) { c.phase = nextPhase; emit?.(g, 'climate', `世界气候进入${CLIMATE_PHASES[c.phase]}阶段。`); }
  c.temperatureRise = round(c.phase * .4); c.seaLevel = Math.max(0, c.phase - 1) * .5;
  c.rainfall = clamp(Math.round(WORLD_RAINFALL[g.settings.rainfall||'standard'].rainfall + (random(c) - .5) * 24 - c.phase * 2), 5, 95);
  // No occupied-land conversion: inundation damages exposed infrastructure instead.
  c.inundated = c.geography.coastal.filter(([, level]) => c.seaLevel >= level).map(([id]) => id);
  for (const id of c.inundated) {
    const tile = g.map.tiles[id];
    if (!climateProtection(g, tile, 'coast') && (tile.improvement || tile.district && tile.district.kind !== 'wonder')) tile.pillaged = true;
  }
  if (c.intensity > 0 && g.turn >= 8 && c.disasters.length < 4 && random(c) < .035 * c.intensity * (1 + c.phase * .12)) {
    const kinds = [...Object.keys(DISASTERS), ...(c.rainfall > 55 ? ['flood', 'flood'] : c.rainfall < 45 ? ['drought', 'drought'] : [])];
    const type = kinds[Math.floor(random(c) * kinds.length)];
    const candidates = g.map.tiles.filter(tile => eligibleCenter(g, type, tile));
    if (candidates.length) startDisaster(g, type, candidates[Math.floor(random(c) * candidates.length)].id, {severity: 1 + Math.floor(random(c) * Math.min(3, 1 + c.intensity / 2))});
  }
  for (const disaster of c.disasters) {
    moveStorm(g, disaster); damageFootprint(g, disaster, emit); disaster.remaining--;
    if (disaster.remaining <= 0) c.recent.push({id: disaster.id, type: disaster.type, turn: g.turn, tiles: [...disaster.tiles]});
  }
  c.disasters = c.disasters.filter(disaster => disaster.remaining > 0);
  c.recent = c.recent.slice(-24);
  c.history.push({turn: g.turn, co2: c.co2, emissions: c.current, emissionsPerTurn: c.current, totalEmissions: c.totalEmissions, temperatureRise: c.temperatureRise, rainfall: c.rainfall});
  c.history = c.history.slice(-64);
  return true;
}

export function climateTileState(g, tile) {
  const c = g.climate;
  if (!c?.enabled) return undefined;
  const fertility = c.fertility[tile.id], drought = c.disasters.some(disaster => disaster.type === 'drought' && disaster.tiles.includes(tile.id));
  const inundated = c.inundated.includes(tile.id) && !climateProtection(g, tile, 'coast');
  if (!fertility && !drought && !inundated) return undefined;
  return {fertility: fertility ? {...fertility} : undefined, drought: drought && !climateProtection(g, tile, 'drought'), inundated};
}

export function climateTileYield(g, tile, base) {
  return applyClimateTileYield({...tile, weather: climateTileState(g, tile)}, base);
}

export function climateCityYield(g, city, base) {
  const c = g.climate;
  if (!c?.enabled || !c.disasters.some(disaster => disaster.type === 'drought' && disaster.tiles.includes(city.tile)) || climateProtection(g, g.map.tiles[city.tile], 'drought')) return base;
  return {...base, food: Math.max(0, base.food - 2)};
}

export function climateView(g, view = -1) {
  const c = g.climate;
  if (!c) return null;
  if (!c.enabled) return {version: 1, enabled: false};
  const player = g.players[view], visible = player ? new Set(player.visible) : null, known = player ? new Set(player.explored) : null;
  const currentTile = id => !player || visible.has(id) || g.map.tiles[id]?.owner === view;
  const knownTile = id => !player || known.has(id);
  const projectDisaster = disaster => {
    const tiles = disaster.tiles.filter(currentTile);
    return tiles.length ? {id: disaster.id, type: disaster.type, name: DISASTERS[disaster.type].name, severity: disaster.severity,
      started: disaster.started, remaining: disaster.remaining, tiles, center: tiles.includes(disaster.center) ? disaster.center : tiles[0]} : null;
  };
  const own = player ? c.accounts[view] : null;
  return {
    version: 1, enabled: true, turn: c.lastTurn, phase: c.phase, phaseName: CLIMATE_PHASES[c.phase],
    temperatureRise: c.temperatureRise, seaLevel: c.seaLevel, co2: c.co2, emissionsPerTurn: c.current,
    totalEmissions: c.totalEmissions, rainfall: c.rainfall, disasterIntensity: c.intensity,
    history: c.history.map(row => ({...row})), sources: c.sources ? {...c.sources} : undefined,
    own: own ? {player: own.player, current: own.current, total: own.total, captured: own.captured, sources: {...own.sources}, cities: g.cities.filter(city => city.owner === view).map(city => ({id: city.id, name: city.name,
      tile: city.tile, emissions: climateCityEmissions(g, city).current, protections: ['dam', 'reservoir', 'floodbarrier'].filter(key => operational(g, city, key)), risk: climateCityRisk(g, city)}))} : null,
    contributors: [...c.accounts.filter(account => !player || account.player === view).map(account => ({player: account.player,
      name: g.players[account.player].name, color: g.players[account.player].color, current: account.current, total: account.total})),
      ...(own ? [{player: null, name: '其他文明', color: '#7d8d91', current: round(Math.max(0, c.current - own.current)), total: round(Math.max(0, c.totalEmissions - own.total))}] : [])],
    disasters: c.disasters.map(projectDisaster).filter(Boolean),
    recent: c.recent.map(row => ({...row, name: DISASTERS[row.type].name, tiles: row.tiles.filter(currentTile)})).filter(row => row.tiles.length),
    risks: projectRisks(c, knownTile),
    inundated: c.inundated.filter(id => currentTile(id) && !climateProtection(g, g.map.tiles[id], 'coast'))
  };
}

function projectRisks(c, allowed) {
  const risks = new Map();
  const add = id => {
    if (!allowed(id)) return null;
    if (!risks.has(id)) risks.set(id, {tile: id, flood: false, coastalLevel: 0, volcano: false});
    return risks.get(id);
  };
  for (const id of c.geography.floodplains) {const row = add(id); if (row) row.flood = true;}
  for (const [id, level] of c.geography.coastal) {const row = add(id); if (row) row.coastalLevel = level;}
  for (const id of c.geography.volcanoes) {const row = add(id); if (row) row.volcano = true;}
  return [...risks.values()].sort((a, b) => a.tile - b.tile);
}

export function validateClimate(g) {
  validateSettings(g);
  const c = g.climate;
  if (!c) return;
  const invalid = () => {throw Error('Invalid saved climate state.');};
  const tile = id => Number.isInteger(id) && id >= 0 && id < g.map.tiles.length;
  const bounded = (n, lo, hi) => finite(n) && n >= lo && n <= hi;
  if (c.version !== 1 || typeof c.enabled !== 'boolean' || !Number.isInteger(c.lastTurn) || c.lastTurn < 1 || c.lastTurn > g.turn || !Number.isInteger(c.rng) || !bounded(c.rng, 0, 0xffffffff) || !Number.isInteger(c.nextId) || c.nextId < 1) invalid();
  if (!Number.isInteger(c.phase) || !bounded(c.phase, 0, 7) || !Number.isInteger(c.intensity) || !bounded(c.intensity, 0, 4) || !bounded(c.co2, 0, 1e12) || !bounded(c.totalEmissions, 0, 1e12) || !bounded(c.current, 0, 1e9) || !bounded(c.rainfall, 0, 100) || !bounded(c.temperatureRise, 0, 2.8) || !bounded(c.seaLevel, 0, 3)) invalid();
  if (!Array.isArray(c.geography?.rainfall) || c.geography.rainfall.length !== g.map.tiles.length || c.geography.rainfall.some(n => !bounded(n, 0, 100))) invalid();
  for (const key of ['volcanoes', 'floodplains']) if (!Array.isArray(c.geography[key]) || c.geography[key].length > g.map.tiles.length || new Set(c.geography[key]).size !== c.geography[key].length || c.geography[key].some(id => !tile(id))) invalid();
  if (!Array.isArray(c.geography.coastal) || c.geography.coastal.length > g.map.tiles.length || c.geography.coastal.some(row => !Array.isArray(row) || row.length !== 2 || !tile(row[0]) || !Number.isInteger(row[1]) || !bounded(row[1], 1, 3))) invalid();
  if (!Array.isArray(c.accounts) || c.accounts.length !== g.players.length || c.accounts.some((row, i) => row.player !== i || !['current', 'total', 'captured'].every(k => bounded(row[k], 0, 1e12)) || !Object.keys(emptySources()).every(k => bounded(row.sources?.[k] ?? (k === 'deforestation' ? 0 : undefined), 0, 1e9)) || !bounded(row.pendingDeforestation ?? 0, 0, 1e9) || row.totals && !Object.keys(emptySources()).every(k => bounded(row.totals[k], 0, 1e12)))) invalid();
  if (c.sources && !Object.keys(emptySources()).every(k => bounded(c.sources[k], 0, 1e12))) invalid();
  if (!Array.isArray(c.disasters) || c.disasters.length > 6 || new Set(c.disasters.map(d => d.id)).size !== c.disasters.length) invalid();
  for (const d of c.disasters) if (!DISASTERS[d.type] || !Number.isInteger(d.id) || d.id < 1 || d.id >= c.nextId || !tile(d.center) || !Array.isArray(d.tiles) || d.tiles.length < 1 || d.tiles.length > 19 || d.tiles.some(id => !tile(id)) || new Set(d.tiles).size !== d.tiles.length || !Number.isInteger(d.severity) || !bounded(d.severity, 1, 3) || !Number.isInteger(d.remaining) || !bounded(d.remaining, 1, DISASTERS[d.type].duration) || !Number.isInteger(d.started) || !bounded(d.started, 1, g.turn) || !Number.isInteger(d.lastApplied) || !bounded(d.lastApplied, d.started - 1, g.turn) || !Number.isInteger(d.direction) || !bounded(d.direction, 0, 5)) invalid();
  if (!Array.isArray(c.history) || c.history.length > 64 || c.history.some(row => !Number.isInteger(row.turn) || !bounded(row.turn, 1, g.turn) || !['co2', 'emissions', 'temperatureRise', 'rainfall'].every(k => bounded(row[k], 0, 1e12)))) invalid();
  if (!Array.isArray(c.recent) || c.recent.length > 24 || c.recent.some(row => !DISASTERS[row.type] || !Number.isInteger(row.id) || !Number.isInteger(row.turn) || !bounded(row.turn, 1, g.turn) || !Array.isArray(row.tiles) || row.tiles.length > 19 || row.tiles.some(id => !tile(id)))) invalid();
  if (!Array.isArray(c.inundated) || c.inundated.length > g.map.tiles.length || c.inundated.some(id => !tile(id))) invalid();
  if (!c.fertility || Array.isArray(c.fertility) || typeof c.fertility !== 'object' || Object.keys(c.fertility).length > g.map.tiles.length || Object.entries(c.fertility).some(([id, value]) => !tile(Number(id)) || !Number.isInteger(value.food) || !Number.isInteger(value.production) || !bounded(value.food, 0, 2) || !bounded(value.production, 0, 2) || value.food + value.production > 2)) invalid();
}
