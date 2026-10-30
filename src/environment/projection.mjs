import {createHash} from 'node:crypto';
import {snapshot, legalActions, productionOptions} from '../engine.mjs';
import {publicControllers} from './controllers.mjs';
import {TECHS,CIVICS,PRODUCTION,TERRAINS,RESOURCES,UNITS,researchCost,gamePace} from '../rules.mjs';
import {congressPlayerActions} from '../congress.mjs';

const SECTIONS = ['summary', 'tasks', 'empire', 'map', 'units', 'cities', 'research', 'religion', 'diplomacy', 'world', 'heritage', 'congress', 'climate', 'natural_wonders', 'events', 'full'];
const SUMMARY_TASK_PRIORITY = {capture: 0, research: 1, civic: 2, production: 3, congress: 4, pantheon: 5, defense: 6, unit: 7};

export function prioritizeSummary(summary) {
  const {id, turn, tasks, ...rest} = summary;
  return {id, turn, tasks: [...(tasks || [])].sort((a, b) => (SUMMARY_TASK_PRIORITY[a.kind] ?? 99) - (SUMMARY_TASK_PRIORITY[b.kind] ?? 99)), ...rest};
}

export function pageSummary(summary, cursor = 0, limit = 12) {
  const ordered = prioritizeSummary(summary), tasks = ordered.tasks;
  const start = Math.max(0, cursor), size = Math.max(1, Math.min(200, limit));
  const page = tasks.slice(start, start + size), next = start + page.length < tasks.length ? start + page.length : null;
  const counts = tasks.reduce((out, task) => ({...out, [task.kind]: (out[task.kind] || 0) + 1}), {});
  return {...ordered, tasks: page, tasksPage: {cursor: start, limit: size, total: tasks.length, next, truncated: next !== null, counts}};
}

// Human-verifiable quote and preview fields. Native scores stay off this list.
export const HUMAN_PREVIEW_KEYS = new Set([
  'cost', 'baseCost', 'progress', 'boosted', 'era', 'goldCost', 'faithCost', 'production', 'healing', 'health', 'currency',
  'seconds', 'turns', 'remaining', 'upkeep', 'upkeepDelta', 'incomingDamage', 'currentIncomingDamage', 'localCombat',
  'homeTerritory', 'defenseBonus', 'path', 'distance', 'foreign', 'followers', 'resource', 'strategicResource',
  'strategicDeposit', 'first', 'capital', 'blockedEvacuation', 'interception', 'favorCost', 'votes', 'strengthGain',
  'healingGain', 'free', 'slots', 'reason', 'wallMatch', 'oldWallMatch', 'unit', 'civilian', 'city', 'tourism',
  'religionOwner', 'religionParent', 'effects', 'baseLost', 'currentlyPatrolling', 'jointWar', 'unblocksImprovement',
  'targetPlayer', 'tile', 'legal', 'score', 'arrivals', 'destination', 'knownOnly', 'name', 'label', 'description',
  'food', 'science', 'culture', 'faith', 'gold', 'yields', 'hp', 'strength', 'damage', 'cityDamage', 'wallDamage',
  'blocked', 'message', 'domain', 'military', 'fortressBonus', 'baseItem', 'type', 'item', 'targetUnit', 'targetCity',
  'hazardDamage', 'category', 'player', 'enemy', 'zoc', 'terrain', 'feature', 'hill', 'defense',
  'attackModifiers', 'defenseModifiers', 'expectedDamage', 'retaliation', 'ranged', 'cityDamageMultiplier',
  'wallMultiplier', 'wallTier', 'walls', 'cityHp', 'occupationEligible', 'captureNow', 'key', 'value'
]);

const PRIVATE_PLAYER_KEYS = [
  'gold', 'faith', 'techs', 'civics', 'research', 'civic', 'researchProgress', 'civicProgress', 'strategy', 'doctrine',
  'memory', 'beliefs', 'pantheon', 'religion', 'government', 'policies', 'focus', 'scienceTotal', 'cultureTotal',
  'tourism', 'nuclearStockpile', 'envoys', 'planRevision', 'plan'
];

function strip(value, inHint = false) {
  if (Array.isArray(value)) return value.map(item => strip(item, inHint));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const key of Object.keys(value)) {
    if (key === 'memory' || key === 'plan') continue;
    if (inHint && !HUMAN_PREVIEW_KEYS.has(key)) continue;
    out[key] = strip(value[key], inHint || key === 'hint' || key === 'preview');
  }
  return out;
}

export function publicPreview(value) {
  return strip(value, true);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
}

export function observationToken(payload) {
  return 'ot1_' + createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');
}

export function projectSeat(game, view, {profile = 'interactive', session = null} = {}) {
  const raw = JSON.parse(JSON.stringify(snapshot(game, view, {manualOptionsOnly: true})));
  const projected = strip(raw);
  if (profile === 'benchmark') {
    projected.seed = null;
    if (projected.settings) projected.settings = {...projected.settings, seedHidden: true};
    if (projected.map) delete projected.map.seed;
  }
  const met = view >= 0 ? new Set(game.players[view]?.met || []) : null;
  for (const player of projected.players || []) {
    if (view < 0 && player.driver) {
      player.driver = {status: player.driver.status, calls: player.driver.calls, failures: player.driver.failures, lastMs: player.driver.lastMs};
    } else {
      delete player.driver;
    }
    if (view >= 0 && player.id !== view && !met.has(player.id)) {
      for (const key of PRIVATE_PLAYER_KEYS) delete player[key];
      delete player.leader;
      delete player.leaderKey;
      delete player.leaderRulesVersion;
      delete player.manual;
    }
  }
  projected.controllers = publicControllers(game, view);
  projected.environment = {
    profile,
    seat: view,
    activePlayer: session?.activePlayer ?? null,
    phase: session?.phase ?? null,
    canAct: !!session?.canAct
  };
  return projected;
}

export function summarize(projected) {
  const self = projected.players?.find(player => player.id === projected.environment?.seat);
  // Keep decisions before the potentially long unit list without omitting any task.
  const tasks = (projected.playerTasks?.tasks || []).map(task => ({
    id: task.id,
    kind: task.kind,
    title: task.title,
    subtitle: task.subtitle,
    city: task.city,
    unit: task.unit,
    tile: task.tile,
    ...(Array.isArray(task.choices) ? {choices: task.choices.map(choice => ({label: choice.label, type: choice.action?.type, ...(choice.disabled ? {disabled: true} : {})}))} : {})
  }));
  return prioritizeSummary({
    id: projected.id,
    turn: projected.turn,
    tasks,
    maxTurns: projected.maxTurns,
    gameSpeed: projected.settings?.gameSpeed,
    pace: {...gamePace(projected), defaultMaxTurns: gamePace(projected).maxTurns, maxTurns: projected.maxTurns},
    winner: projected.winner,
    seed: projected.seed === undefined ? undefined : projected.seed,
    profile: projected.environment?.profile,
    activePlayer: projected.environment?.activePlayer,
    phase: projected.environment?.phase,
    map: projected.map ? {width: projected.map.width, height: projected.map.height, type: projected.map.type, wrapX: projected.map.wrapX, tiles: projected.map.tiles?.length} : null,
    self: self ? {id: self.id, name: self.name, alive: self.alive, leader: self.leader, leaderKey: self.leaderKey, trait: self.trait, description: self.description, gold: self.gold, faith: self.faith, science: self.yields?.science, culture: self.yields?.culture,research:researchStatus(projected,self,false),civic:researchStatus(projected,self,true)} : null,
    naturalWonders: projected.naturalWonders ? {enabled:projected.naturalWonders.enabled,discovered:projected.naturalWonders.discovered} : undefined,
    climate: projected.climate ? {enabled:projected.climate.enabled,phase:projected.climate.phase,temperatureRise:projected.climate.temperatureRise,emissionsPerTurn:projected.climate.emissionsPerTurn,rainfall:projected.climate.rainfall,disasters:projected.climate.disasters?.map(d=>({id:d.id,type:d.type,tiles:d.tiles,remaining:d.remaining}))} : null,
    recentEvents: (projected.events || []).slice(0, 5).map(event => ({id: event.id, text: event.text})),
    counts: {
      units: projected.units?.length || 0,
      cities: projected.cities?.length || 0,
      visibleUnits: projected.units?.length || 0,
      ownUnits: self ? projected.units.filter(unit => unit.owner === self.id).length : null,
      visibleCities: projected.cities?.length || 0,
      ownCities: self ? projected.cities.filter(city => city.owner === self.id).length : null,
      rememberedCities: projected.rememberedCities?.length || 0,
      events: projected.events?.length || 0
    },
    controllers: projected.controllers
  });
}

export function readSection(projected, section, cursor = 0, limit = 40) {
  if (!SECTIONS.includes(section)) throw new Error('未知的观察分区。');
  if (section === 'summary') return {section, cursor: 0, limit, total: 1, truncated: false, next: null, value: pageSummary(summarize(projected), cursor, limit)};
  const source = {
    summary: summarize(projected),
    tasks: summarize(projected).tasks,
    empire: projected.players,
    map: projected.map?.tiles,
    units: projected.units,
    cities: projected.cities,
    research: {techs: projected.players?.map(player => ({id: player.id, research: player.research, techs: player.techs, civic: player.civic, civics: player.civics, government: player.government, policies: player.policies,...(player.id===projected.environment?.seat?{science:researchStatus(projected,player,false),culture:researchStatus(projected,player,true)}:{})}))},
    religion: {religions: projected.religions, religionIntelligence: projected.religionIntelligence},
    diplomacy: projected.diplomacy,
    world: {naturalWonders:projected.naturalWonders,climate: projected.climate, governors: projected.governors, cityStates: projected.cityStates, espionage: projected.espionage, tourism: projected.tourism},
    natural_wonders: projected.naturalWonders,
    climate: projected.climate,
    heritage: projected.greatPeople,
    congress: {congress: projected.congress, ages: projected.ages},
    events: projected.events,
    full: projected
  }[section];
  if (!Array.isArray(source)) return {section, cursor: 0, limit, total: source == null ? 0 : 1, truncated: false, next: null, value: source};
  const start = Math.max(0, cursor);
  const size = Math.max(1, Math.min(200, limit));
  const items = source.slice(start, start + size);
  const next = start + items.length < source.length ? start + items.length : null;
  return {section, cursor: start, limit: size, total: source.length, truncated: next != null, next, items};
}

function researchStatus(game,player,civic){
 const key=player[civic?'civic':'research'],catalogue=civic?CIVICS:TECHS,income=player.yields?.[civic?'culture':'science']||0;
 if(!key||!catalogue[key])return {current:null,income,needsChoice:true};
 const boosted=(player[civic?'inspirations':'boosts']||[]).includes(key),cost=researchCost(game,key,civic,boosted),progress=player[civic?'civicProgress':'researchProgress']?.[key]||0,remaining=Math.max(0,cost-progress);
 return {current:key,name:catalogue[key].name,progress,cost,remaining,income,boosted,turns:income>0?Math.ceil(remaining/income):null,needsChoice:false};
}

export function cleanActions(game, player, options={}) {
  const actions = legalActions(game, player, options).filter(action => action.type !== 'voteCongress');
  actions.push(...congressPlayerActions(game, player));
  // Standby is handled by the turn controller, outside the native engine shortlist.
  for (const action of actions.filter(action => action.type === 'fortify')) {
    const unit = game.units.find(unit => unit.id === action.unit && unit.owner === player.id);
    if (unit && !UNITS[unit.type].civilian && !unit.moveOrder && unit.stance !== 'alert') actions.push({type: 'alert', unit: unit.id, hint: {name: '警戒待命', description: '持续待命；发现附近可见敌军时唤醒。'}});
  }
  for (const unit of game.units.filter(unit => unit.owner === player.id && unit.hp > 0 && unit.stance === 'alert')) actions.push({type: 'wake', unit: unit.id, hint: {name: '解除警戒'}});
  const productionKeys = new Set(actions.filter(action => action.type === 'produce').map(action => `${action.city}:${action.item}:${action.tile ?? ''}`));
  // Native queue-switch heuristics are not the player's legal production menu.
  // Supplement from the same authoritative options shown in the city workshop.
  for (const city of game.cities.filter(city => city.owner === player.id)) for (const row of productionOptions(game, player, city)) {
    const key = `${city.id}:${row.item}:${row.tile ?? ''}`;
    if (productionKeys.has(key)) continue;
    productionKeys.add(key);
    actions.push({type:'produce', city:city.id, item:row.item, ...(row.tile == null ? {} : {tile:row.tile}), hint:{cost:row.cost, turns:row.turns}});
  }
  return strip(actions).map(action => {
    const {hint, ...command} = action;
    const preview={...hint},spec=PRODUCTION[action.item];
    if(spec&&['produce','purchase','recruitFaith'].includes(action.type)){preview.name=spec.name;preview.category=spec.kind||'unit';}
    if(['move','route','rebase','jump'].includes(action.type)&&Number.isInteger(action.tile)){
      const tile=player.visible.includes(action.tile)?game.map.tiles[action.tile]:player.knownTiles?.[action.tile];
      if(tile){preview.terrain=TERRAINS[tile.terrain]?.name||tile.terrain;preview.hill=!!tile.hill;preview.feature=tile.feature;const resource=RESOURCES[tile.resource];if(resource&&(!resource.tech||player.techs.includes(resource.tech)))preview.resource=resource.name;}
    }
    return Object.keys(preview).length ? {...command, preview} : command;
  });
}
