import {createHash, randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createGame, restore, serialize} from '../engine.mjs';
import {GameSimulation} from '../turns.mjs';
import {unitRoute, settlementLens} from '../player-planning.mjs';
import {TECHS, CIVICS, UNITS, GOVERNMENTS, POLICIES, BUILDINGS, PROJECTS, RESOURCES, WONDERS, NATURAL_WONDERS, IMPROVEMENTS, NATIONAL_POLICIES, NATIONAL_STRATEGIES, LEADERS, leaderFor, gamePace} from '../rules.mjs';
import {PANTHEONS, BELIEFS} from '../religion-data.mjs';
import {assignController, isDecisionSeat, publicControllers, validateModelName} from './controllers.mjs';
import {PLAYER_ACTIONS, NOT_IN_GAME, actionSpec} from './catalog.mjs';
import {projectSeat, summarize, readSection, cleanActions, observationToken, publicPreview} from './projection.mjs';
import {playerTasks} from '../player-tasks.mjs';

const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
const CONTRACT = 'civbench-environment/1';

export class EnvironmentError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function gameplayHash(game) {
  const data = JSON.parse(serialize(game));
  for (const player of data.players) if (player.driver) {
    player.driver.lastMs = 0;
    player.driver.message = '';
  }
  // Read-only city inspection can hydrate these deterministic yield caches.
  // Canonical specialist choices remain in specialistMode/specialists.
  for(const city of data.cities){delete city.worked;delete city.specialistsAssigned;}
  return digest(data);
}

function checkActionShape(action) {
  if (!action || typeof action !== 'object' || Array.isArray(action) || typeof action.type !== 'string' || !action.type) throw new EnvironmentError('invalid_action', '行动缺少 type。');
  if (!/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(action.type)) throw new EnvironmentError('invalid_action', '行动类型无效。');
  const spec = actionSpec(action.type);
  if (!spec) {
    const retired = NOT_IN_GAME.find(item => item.type === action.type);
    throw new EnvironmentError('invalid_action', retired ? retired.reason : `不能识别的行动 ${action.type}。`);
  }
  for (const key of Object.keys(action)) {
    if (key === 'type') continue;
    if (!spec.fields.includes(key)) throw new EnvironmentError('invalid_action', `不能识别的行动字段 ${key}。`);
  }
  return action;
}

function ruleEntries(kind, version = 2) {
  if (kind === 'leader') return LEADERS.map(leader => {
    const source = leaderFor({leaderKey: leader.key, leaderRulesVersion: version});
    const rule = Object.fromEntries(['key', 'name', 'origin', 'trait', 'title', 'passiveName', 'activeName', 'skill', 'passiveDescription', 'description', 'passive', 'active', 'duration', 'cooldown', 'uniqueUnit', 'uniqueBuilding'].filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]]));
    return [leader.key, rule];
  });
  if (kind === 'pantheon') return PANTHEONS.map(item => [item.key, item]);
  if (kind === 'belief') {
    const entries = [];
    for (const [category, list] of Object.entries(BELIEFS)) {
      if (Array.isArray(list)) for (const item of list) entries.push([`${category}/${item.key}`, item]);
      else if (list && typeof list === 'object' && list.key) entries.push([`${category}/${list.key}`, list]);
    }
    return entries;
  }
  const tables = {tech: TECHS, civic: CIVICS, unit: UNITS, government: GOVERNMENTS, policy: POLICIES, building: BUILDINGS, project: PROJECTS, resource: RESOURCES, wonder: WONDERS, natural_wonder:NATURAL_WONDERS, improvement: IMPROVEMENTS};
  const table = tables[kind];
  if (!table) return null;
  return Object.entries(table);
}

// Compact only identical production placements; no legal target or preview is lost.
function compactPlacements(actions) {
  const rows = [], groups = new Map();
  for (const action of actions) {
    if (!['produce', 'purchase', 'recruitFaith'].includes(action.type) || !Number.isInteger(action.tile)) {
      rows.push(action); continue;
    }
    const {tile, ...shared} = action, key = JSON.stringify(shared);
    const group = groups.get(key);
    if (group) group.tiles.push(tile);
    else { const row = {...shared, tiles: [tile]}; groups.set(key, row); rows.push(row); }
  }
  return rows;
}

export class MatchRuntime {
  static async create(options = {}) {
    if(options.naturalWondersEnabled!==undefined&&typeof options.naturalWondersEnabled!=='boolean')throw new EnvironmentError('invalid_match','自然奇观选项必须是布尔值。');
    const runtime = new MatchRuntime();
    await runtime.#open(options);
    return runtime;
  }

  constructor() {
    this.queue = Promise.resolve();
    this.grants = new Map();
    this.ledger = new Map();
    this.commands = [];
    this.closed = false;
    this.started = true;
    this.presence = new Map();
    this.nativeBuffer = [];
    this.uiViews = new Map();
    this.managedPlay = new Map();
    this.actionRevision = 0;
    this.actionCaches = new Map();
  }

  setManagedPlay(seat, target, resume = false) {
    const previous = this.managedPlayProgress(seat);
    if (resume && previous?.target === target && !previous.complete) {this.managedPlay.get(seat).paused = false; return;}
    const baseline = this.commands.filter(command => command.kind === 'end-turn' && command.seat === seat && command.status === 'applied').length;
    this.managedPlay.set(seat, {target, baseline, paused: false});
  }

  managedPlayProgress(seat) {
    const run = this.managedPlay.get(seat);
    if (!run) return null;
    const count = this.commands.filter(command => command.kind === 'end-turn' && command.seat === seat && command.status === 'applied').length;
    const completed = Math.max(0, count - run.baseline);
    return {...(run.client || {}), target: run.target, completed, complete: run.target !== null && completed >= run.target, paused: run.paused};
  }

  pauseManagedPlay(seat) {const run = this.managedPlay.get(seat); if (run) run.paused = true;}

  #checkManaged(grant) {
    const progress = this.managedPlayProgress(grant.seat);
    if (progress?.complete) throw new EnvironmentError('managed_complete', '已完成本次试玩的目标回合。', 409);
    if (progress?.paused) throw new EnvironmentError('managed_paused', 'AI 已停止下令，等待主机继续。', 409);
  }

  async #open(options) {
    const profile = options.profile === 'benchmark' ? 'benchmark' : options.profile === 'interface_qa' ? 'interface_qa' : 'interactive';
    const count = Math.max(2, Math.min(16, Math.floor(Number(options.players) || 4)));
    const seats = options.seats || [{seat: 1, kind: 'agent', displayName: 'Agent'}];
    if (!Array.isArray(seats) || !seats.length) throw new EnvironmentError('invalid_match', '至少要分配一个外部座位。');
    const seen = new Set();
    for (const seat of seats) {
      if (!Number.isInteger(seat.seat) || seat.seat < 0 || seat.seat >= count || seen.has(seat.seat)) throw new EnvironmentError('invalid_match', '座位分配无效。');
      if (!['human', 'agent', 'native', 'inactive'].includes(seat.kind)) throw new EnvironmentError('invalid_match', '座位类型无效。');
      seen.add(seat.seat);
    }
    const seed = String(options.seed || `BENCH-${randomBytes(8).toString('hex')}`);
    const game = createGame({
      seed,
      players: count,
      size: options.size || 'small',
      playMode: 'turns',
      autosaveEnabled: false,
      barbarians: options.barbarians,
      gameSpeed: options.gameSpeed || 'standard',
      rainfall: options.rainfall,
      resourceAbundance: options.resourceAbundance,
      naturalWondersEnabled: options.naturalWondersEnabled !== false,
      climateEnabled: options.climateEnabled !== false,
      disasterIntensity: options.disasterIntensity ?? 2,
      mapType: options.mapType || 'random',
      leaders: options.leaders,
      victories: options.victories,
      maxTurns: options.maxTurns,
      aiAlgorithm: options.aiAlgorithm,
      doctrines: options.doctrines,
      strategies: options.strategies
    });
    if (Array.isArray(options.drivers)) {
      for (let index = 0; index < game.players.length; index++) if (options.drivers[index]) game.players[index].driver.file = options.drivers[index];
    }
    game.settings.autosaveEnabled = false;
    game.settings.informationProfile = profile === 'interface_qa' ? 'interactive' : profile;
    for (const player of game.players) assignController(player, 'native');
    for (const seat of seats) {
      if (seat.kind === 'native') continue;
      assignController(game.players[seat.seat], seat.kind, {displayName: seat.autoName ? '待识别' : seat.displayName, agentId: seat.agentId || `seat-${seat.seat}`, bump: true, autoName: seat.autoName});
    }
    this.game = game;
    this.id = `match-${randomBytes(8).toString('hex')}`;
    this.epoch = `epoch-${randomBytes(8).toString('hex')}`;
    this.profile = profile;
    this.assistance = {legalEnumeration: true, routePreview: true, settlementPreview: true, strategyHints: false};
    this.initial = serialize(game);
    this.simulation = new GameSimulation(game, {
      execute: options.execute,
      prepareObservation: options.prepareObservation || (async () => ({player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}})),
      onChange: () => {},
      onRejected: () => {},
      onEconomy: () => {}
    });
    this.started = options.pending !== true;
    this.savedExecute = options.execute;
    this.savedPrepare = options.prepareObservation || (async () => ({player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}}));
    this.simulation.onNative = entry => this.nativeBuffer.push(entry);
    this.hostToken = this.#issue('host', null, 0, 'host');
    this.observerToken = this.#issue('observer', null, 0, 'observer');
    this.seatTokens = new Map();
    for (const player of game.players) if (isDecisionSeat(player)) this.seatTokens.set(player.id, this.#issue('seat', player.id, player.controller.generation, player.controller.agentId));
    this.ready = true;
  }

  #issue(role, seat, generation, agentId) {
    const token = randomBytes(24).toString('hex');
    this.grants.set(token, {role, seat, generation, agentId});
    return token;
  }

  #grant(token, {touch = true} = {}) {
    const grant = this.grants.get(token);
    if (!grant) throw new EnvironmentError('unauthorized', '连接凭证无效。', 401);
    if (grant.role === 'seat') {
      const player = this.game.players[grant.seat];
      if (!player || player.controller?.generation !== grant.generation || !isDecisionSeat(player)) throw new EnvironmentError('stale_controller', '这个座位的控制权已经更换。', 401);
      if (touch) {
        const previous = this.presence.get(grant.seat);
        this.presence.set(grant.seat, {...(previous?.generation === grant.generation ? previous : {}), connected: true, seen: Date.now(), generation: grant.generation});
      }
    }
    return grant;
  }

  #requireStarted() {
    if (!this.started) throw new EnvironmentError('not_started', '对局尚未开始。');
  }

  #exclusive(work) {
    const run = this.queue.then(work, work);
    this.queue = run.then(() => {}, () => {});
    return run;
  }

  #sessionFor(grant) {
    const view = grant.role === 'seat' ? grant.seat : -1;
    const state = this.simulation.state(view);
    return {
      contract: CONTRACT,
      gameVersion: PACKAGE_VERSION,
      profile: this.profile,
      assistance: this.assistance,
      gameSpeed: this.game.settings.gameSpeed,
      climate: {enabled:this.game.climate?.enabled??false,disasterIntensity:this.game.climate?.intensity??0},
      pace: gamePace(this.game),
      maxTurns: this.game.maxTurns,
      match_id: this.id,
      world_epoch: this.epoch,
      role: grant.role,
      seat: grant.role === 'seat' ? grant.seat : null,
      activePlayer: state.activePlayer,
      phase: state.phase,
      started: this.started,
      turn: this.game.turn,
      yourTurn: this.started && grant.role === 'seat' && !!this.game.players[grant.seat]?.alive && state.activePlayer === grant.seat && state.phase !== 'ai' && !this.game.winner,
      eliminated: grant.role === 'seat' && !this.game.players[grant.seat]?.alive,
      terminal: this.game.winner || null,
      managedPlay: grant.role === 'seat' ? this.managedPlayProgress(grant.seat) : null,
      controllers: publicControllers(this.game, view)
    };
  }

  projection(view) {
    return this.#exclusive(() => this.#projected(view));
  }

  read(work) {
    return this.#exclusive(() => work());
  }

  #projected(view) {
    const grantView = view;
    const session = this.simulation.state(grantView);
    session.canAct = grantView >= 0 && !!this.game.players[grantView]?.alive && session.activePlayer === grantView && session.phase !== 'ai' && !this.game.winner;
    const projected = projectSeat(this.game, grantView, {profile: this.profile, session});
    if(grantView>=0)projected.playerTasks=playerTasks(this.game,grantView);
    return {projected, token: observationToken(projected)};
  }

  connectionCard() {
    return {
      contract: CONTRACT,
      gameVersion: PACKAGE_VERSION,
      match_id: this.id,
      world_epoch: this.epoch,
      profile: this.profile,
      seed: this.profile === 'benchmark' ? null : this.game.seed,
      hostToken: this.hostToken,
      observerToken: this.observerToken,
      seats: [...this.seatTokens].map(([seat, token]) => ({
        seat,
        token,
        kind: this.game.players[seat].controller.kind,
        displayName: this.game.players[seat].controller.displayName,
        agentId: this.game.players[seat].controller.agentId,
        leader: this.game.players[seat].leader,
        name: this.game.players[seat].name
      }))
    };
  }

  session(token, {touch = true} = {}) {
    return this.#exclusive(() => this.#sessionFor(this.#grant(token, {touch})));
  }

  observe(token, query = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      const view = grant.role === 'seat' ? grant.seat : Number.isInteger(query.view) ? query.view : -1;
      if (grant.role === 'seat' && query.view !== undefined && query.view !== grant.seat) throw new EnvironmentError('forbidden', '不能改用其他座位的视野。', 403);
      if (view < -1 || view >= this.game.players.length) throw new EnvironmentError('invalid_action', '视野无效。');
      const {projected, token: observation} = this.#projected(view);
      if (query.observation_token && query.observation_token !== observation) throw new EnvironmentError('stale_observation', '观察已经过期，请重新获取。', 409);
      const section = query.section || 'summary';
      let page;
      try {
        page = readSection(projected, section, query.cursor || 0, query.limit || (section === 'summary' ? 12 : 40));
      } catch (error) {
        throw new EnvironmentError('invalid_action', error.message || '未知的观察分区。');
      }
      return {match_id: this.id, world_epoch: this.epoch, role: grant.role, seat: grant.role === 'seat' ? grant.seat : null, observation_token: observation, ...page};
    });
  }

  inspect(token, query = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      const unknown = Object.keys(query).filter(key => !['id', 'tile'].includes(key));
      if (unknown.length || Number.isInteger(query.id) === Number.isInteger(query.tile)) {
        throw new EnvironmentError('invalid_action', '请只传 id（城市或单位编号）或 tile（地块编号），例如 {"id":65}；不支持 city 字段。');
      }
      const view = grant.role === 'seat' ? grant.seat : -1;
      const {projected, token: observation} = this.#projected(view);
      const found = ['units', 'cities', 'rememberedCities'].map(key => (projected[key] || []).find(item => item.id === query.id)).find(Boolean)
        || (Number.isInteger(query.tile) ? projected.map?.tiles?.[query.tile] : null);
      if (!found) throw new EnvironmentError('not_visible', '看不到该对象。', 404);
      return {match_id: this.id, world_epoch: this.epoch, observation_token: observation, entity: found};
    });
  }

  options(token, query = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '观察者没有可执行的行动。', 403);
      const player = this.game.players[grant.seat];
      const cached = this.actionCaches.get(grant.seat);
      let actions = cached?.revision === this.actionRevision ? cached.actions : null;
      if (!actions) {
        actions = cleanActions(this.game, player);
        this.actionCaches.set(grant.seat, {revision: this.actionRevision, actions});
      }
      if (query.type) actions = actions.filter(action => action.type === query.type);
      if (Number.isInteger(query.unit)) actions = actions.filter(action => action.unit === query.unit);
      if (Number.isInteger(query.city)) actions = actions.filter(action => action.city === query.city);
      for (const [key, field] of [['units', 'unit'], ['cities', 'city']]) if (query[key] !== undefined) {
        if (!Array.isArray(query[key]) || !query[key].length || query[key].length > 32 || query[key].some(id => !Number.isInteger(id) || id < 0)) throw new EnvironmentError('invalid_action', `${key} 需要 1 到 32 个非负整数编号。`);
        const ids = new Set(query[key]); actions = actions.filter(action => ids.has(action[field]));
      }
      if (query.item) actions = actions.filter(action => action.item === query.item);
      const rows = query.compact === true ? compactPlacements(actions) : actions;
      const start = Math.max(0, query.cursor || 0);
      const limit = Math.max(1, Math.min(100, query.limit || 40));
      const {token: observation} = this.#projected(grant.seat);
      if (query.observation_token && query.observation_token !== observation) throw new EnvironmentError('stale_observation', '观察已经过期，请重新获取。', 409);
      return {
        match_id: this.id,
        world_epoch: this.epoch,
        observation_token: observation,
        types: [...actions.reduce((counts, action) => counts.set(action.type, (counts.get(action.type) || 0) + 1), new Map())].map(([type, count]) => ({type, count})),
        catalogue: query.include_catalogue === true ? PLAYER_ACTIONS.map(({type, fields, group}) => ({type, fields, group})) : [],
        catalogue_omitted: query.include_catalogue !== true,
        ...(query.include_catalogue === true ? {notInGame: NOT_IN_GAME} : {}),
        cursor: start,
        total: rows.length,
        ...(query.compact === true ? {action_total: actions.length, format: 'compact'} : {}),
        truncated: start + limit < rows.length,
        next: start + limit < rows.length ? start + limit : null,
        actions: rows.slice(start, start + limit),
        note: query.compact === true ? 'tiles 为等价选址；提交时删除 tiles 并选一个 tile。分页不影响合法性。' : '分页不影响合法性。需要动作字段表时再传 include_catalogue=true。'
      };
    });
  }

  preview(token, query = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '观察者不能请求座位预览。', 403);
      const player = this.game.players[grant.seat];
      const unit = this.game.units.find(item => item.id === query.unit && item.owner === player.id);
      let value = null;
      if (query.kind === 'route') {
        if (!unit || !Number.isInteger(query.tile)) throw new EnvironmentError('not_visible', '看不到该对象。', 404);
        value = unitRoute(this.game, player, unit, query.tile);
      } else if (query.kind === 'settlement') {
        if (!unit || unit.type !== 'settler') throw new EnvironmentError('invalid_action', '只有开拓者可以查看定居适宜度。');
        value = settlementLens(this.game, player);
      } else throw new EnvironmentError('invalid_action', '未知的预览类型。');
      const {token: observation} = this.#projected(grant.seat);
      return {match_id: this.id, world_epoch: this.epoch, observation_token: observation, kind: query.kind, preview: publicPreview(value)};
    });
  }

  act(token, body = {}) {
    return this.#exclusive(() => this.#act(this.#grant(token), body));
  }

  #act(grant, body) {
    if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '观察者不能下达命令。', 403);
    this.#requireStarted();
    this.#envelope(body);
    const action = checkActionShape(body.action);
    const key = `${grant.seat}:${body.request_id}`;
    const hash = digest(action);
    const prior = body.request_id ? this.ledger.get(key) : null;
    if (prior && prior.hash !== hash) throw new EnvironmentError('request_conflict', '同一个请求编号对应了不同的行动。', 409);
    if (prior) return prior.result;
    this.#checkManaged(grant);
    this.#fresh(grant, body.observation_token);
    const player = this.game.players[grant.seat];
    if (!player?.alive) throw new EnvironmentError('eliminated', '该文明已被淘汰，不能继续下令。', 409);
    if (this.game.winner) throw new EnvironmentError('terminal', '本局已经结束。', 409);
    if (this.simulation.phase === 'ai' || this.simulation.activePlayer !== grant.seat) throw new EnvironmentError('out_of_turn', '现在不是该文明的回合。', 409);
    const before = gameplayHash(this.game),eventCursor=Math.max(0,...this.game.events.map(e=>e.id||0)),actor=Number.isInteger(action.unit)?this.game.units.find(u=>u.id===action.unit&&u.owner===grant.seat):null;
    let status = 'applied', error = null;
    try {
      if (action.type === 'setStrategy') this.#applyStrategy(player, action);
      else this.simulation.command(player, action);
    } catch (failure) {
      status = 'rejected';
      error = failure.message || '行动被拒绝。';
      if (gameplayHash(this.game) !== before) throw new EnvironmentError('state_leaked', '被拒绝的行动改变了局面，已停止继续提交。', 500);
    }
    if (status === 'applied') this.actionRevision++;
    const {token: next,projected} = this.#projected(grant.seat),current=actor&&this.game.units.find(u=>u.id===actor.id);
    const city = projected.cities?.find(city => city.id === action.city && city.owner === grant.seat);
    const alternatives = status === 'rejected' && (actor || city) ? cleanActions(this.game, player).filter(option => actor ? option.unit === actor.id : option.city === city.id) : [];
    const result = {status, request_id: body.request_id || null, turn: this.game.turn, next_observation_token: next, result: {activePlayer: this.simulation.activePlayer,...(actor?{unit:current?{id:current.id,tile:current.tile,moves:current.moves,acted:current.acted,hp:current.hp,charges:current.charges}:{id:actor.id,retired:true}}:{}),...(city?{city:{id:city.id,production:city.production,productionStatus:city.productionStatus},balance:{gold:player.gold,faith:player.faith}}:{})},...(alternatives.length?{alternatives:alternatives.slice(0,6),alternatives_truncated:alternatives.length>6}:{}), events: (projected.events||[]).filter(e=>e.id>eventCursor), error};
    if (body.request_id) this.ledger.set(key, {hash, result});
    this.commands.push({kind: 'act', seat: grant.seat, action, requestId: body.request_id || null, status});
    return result;
  }

  batch(token, body = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '观察者不能下达命令。', 403);
      this.#requireStarted();
      const commands = body.commands;
      if (!Array.isArray(commands) || !commands.length || commands.length > 32) throw new EnvironmentError('invalid_action', '批量命令需要 1 到 32 条。');
      const results = [];
      let observation = body.observation_token;
      for (let index = 0; index < commands.length; index++) {
        const item = commands[index];
        try {
          const result = this.#act(grant, {request_id: item.request_id, observation_token: observation, action: item.action, match_id: body.match_id, world_epoch: body.world_epoch});
          results.push(result);
          observation = result.next_observation_token;
          if (result.status !== 'applied' && body.stop_on_error !== false) break;
        } catch (error) {
          results.push({status: 'rejected', request_id: item?.request_id || null, error: error.message, code: error.code || 'invalid_action'});
          break;
        }
      }
      return {match_id: this.id, world_epoch: this.epoch, stop_on_error: body.stop_on_error !== false, results};
    });
  }

  endTurn(token, body = {}) {
    return this.#exclusive(async () => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '观察者不能结束回合。', 403);
      this.#requireStarted();
      this.#envelope(body);
      const marker = {type: 'end-turn', force: body.force === true};
      const key = `${grant.seat}:${body.request_id}`;
      const hash = digest(marker);
      const prior = body.request_id ? this.ledger.get(key) : null;
      if (prior && prior.hash !== hash) throw new EnvironmentError('request_conflict', '同一个请求编号对应了不同的行动。', 409);
      if (prior) return prior.result;
      this.#checkManaged(grant);
      this.#fresh(grant, body.observation_token);
      if (!this.game.players[grant.seat]?.alive) throw new EnvironmentError('eliminated', '该文明已被淘汰，不能继续结束回合。', 409);
      if (this.game.winner) throw new EnvironmentError('terminal', '本局已经结束。', 409);
      this.nativeBuffer.splice(0);
      try {
        await this.simulation.endTurn(grant.seat, {force: body.force === true});
      } catch (failure) {
        throw new EnvironmentError('invalid_action', failure.message || '无法结束当前回合。');
      }
      this.actionRevision++;
      const {token: next} = this.#projected(grant.seat);
      const result = {status: 'applied', request_id: body.request_id || null, turn: this.game.turn, activePlayer: this.simulation.activePlayer, next_observation_token: next, error: null};
      if (body.request_id) this.ledger.set(key, {hash, result});
      this.commands.push({kind: 'end-turn', seat: grant.seat, force: body.force === true, requestId: body.request_id || null, status: 'applied', nativeScript: this.nativeBuffer.splice(0)});
      return result;
    });
  }

  events(token, query = {}) {
    const grant = this.#grant(token);
    const cursor = Math.max(0, query.cursor || 0);
    const view = grant.role === 'seat' ? grant.seat : -1;
    const {projected, token: observation} = this.#projected(view);
    const events = (projected.events || []).filter(event => event.id > cursor).sort((a, b) => a.id - b.id).slice(0, 50);
    const session = this.#sessionFor(grant);
    return {match_id: this.id, world_epoch: this.epoch, observation_token: observation, cursor, next: events.at(-1)?.id || cursor, yourTurn: session.yourTurn, activePlayer: session.activePlayer, terminal: session.terminal, eliminated: session.eliminated, events};
  }

  rules(token, query = {}) {
    const grant = this.#grant(token);
    const kinds = ['tech', 'civic', 'unit', 'government', 'policy', 'building', 'project', 'resource', 'wonder', 'natural_wonder', 'improvement', 'pantheon', 'belief', 'leader'];
    if (!query.kind) return {contract: CONTRACT, gameVersion: PACKAGE_VERSION, kinds, actions: PLAYER_ACTIONS.map(action => action.type), notInGame: NOT_IN_GAME};
    const entries = ruleEntries(query.kind, this.game.players[grant.seat ?? 0]?.leaderRulesVersion);
    if (!entries) throw new EnvironmentError('not_visible', '规则目录里没有这一条。', 404);
    if (query.key) {
      const found = entries.find(([key]) => key === query.key);
      if (!found) throw new EnvironmentError('not_visible', `规则目录里没有 ${query.kind}/${query.key}；省略 key 可列出有效名称。`, 404);
      return {kind: query.kind, key: query.key, rule: found[1]};
    }
    const cursor = Math.max(0, query.cursor || 0);
    const limit = Math.max(1, Math.min(100, query.limit || 40));
    const page = entries.slice(cursor, cursor + limit);
    const next = cursor + page.length < entries.length ? cursor + page.length : null;
    return {kind: query.kind, cursor, limit, total: entries.length, truncated: next != null, next, entries: page.map(([key, rule]) => ({key, rule}))};
  }

  forfeit(token, seat) {
    return this.#exclusive(async () => {
      const grant = this.#grant(token);
      if (grant.role !== 'host') throw new EnvironmentError('forbidden', '只有主机可以判定弃权。', 403);
      const player = this.game.players[seat];
      if (!player || !isDecisionSeat(player)) throw new EnvironmentError('invalid_action', '这个座位没有可弃权的控制者。');
      const active = this.simulation.activePlayer === seat;
      this.nativeBuffer.splice(0);
      assignController(player, 'inactive', {bump: true});
      if (active && !this.game.winner) await this.simulation.endTurn(seat, {force: true, system: true});
      this.actionRevision++;
      this.commands.push({kind: 'forfeit', seat, nativeScript: this.nativeBuffer.splice(0)});
      return this.#sessionFor(grant);
    });
  }

  replayRecord() {
    return {
      contract: 'civbench-replay/1',
      gameVersion: PACKAGE_VERSION,
      profile: this.profile,
      assistance: this.assistance,
      match_id: this.id,
      world_epoch: this.epoch,
      initial: this.initial,
      commands: this.commands,
      gameplayHash: gameplayHash(this.game),
      winner: this.game.winner
    };
  }

  gameplayHash() {
    return gameplayHash(this.game);
  }

  #applyStrategy(player, action) {
    if (!player?.alive || !Object.hasOwn(NATIONAL_POLICIES, action.doctrine) || !Object.hasOwn(NATIONAL_STRATEGIES, action.strategy)) throw new Error('国家战略或国策无效。');
    const time = this.game.realtime.time;
    if (player.doctrine !== action.doctrine && (player.doctrineReadyAt || 0) > time) throw new Error('国策调整仍在冷却。');
    if (player.doctrine !== action.doctrine) player.doctrineReadyAt = time + 60;
    player.doctrine = action.doctrine;
    player.strategy = action.strategy;
    player.planRevision = (player.planRevision || 0) + 1;
    this.actionRevision++;
  }

  strategy(token, body = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '观察者不能更改国策。', 403);
      this.#requireStarted();
      this.#checkManaged(grant);
      this.#envelope(body);
      const player = this.game.players[grant.seat];
      try {
        this.#applyStrategy(player, body);
      } catch (failure) {
        throw new EnvironmentError('invalid_action', failure.message || '国家战略或国策无效。');
      }
      this.commands.push({kind: 'strategy', seat: grant.seat, doctrine: body.doctrine, strategy: body.strategy});
      return {status: 'applied', turn: this.game.turn, doctrine: player.doctrine, strategy: player.strategy};
    });
  }

  begin() {
    return this.#exclusive(() => {
      if (this.started) return {started: true};
      this.started = true;
      this.commands.push({kind: 'start'});
      return {started: true};
    });
  }

  #modelName(seat, model, {record = true} = {}) {
    const controller = this.game.players[seat]?.controller;
    if (!controller?.autoName || controller.kind !== 'agent') return;
    const modelId = model === null ? null : validateModelName(model);
    if ((controller.modelId || null) === modelId) return;
    if (modelId) controller.modelId = modelId; else delete controller.modelId;
    controller.displayName = modelId ? [...modelId].slice(0, 24).join('') : '待识别';
    this.actionRevision++;
    if (record) this.commands.push({kind: 'model-identity', seat, model: modelId});
  }

  registerClient(token, body = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat' || this.game.players[grant.seat]?.controller?.kind !== 'agent') throw new EnvironmentError('forbidden', '只有外部 AI 可以上报客户端。', 403);
      const clean = (value, max) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
      const name = clean(body.name, 80), version = clean(body.version, 40), id = clean(body.id, 80);
      if (!name || !/^[A-Za-z0-9_-]{8,80}$/.test(id)) throw new EnvironmentError('invalid_action', '客户端标识无效。');
      let model;
      try {if (body.model !== undefined) model = validateModelName(body.model);}
      catch {throw new EnvironmentError('invalid_action', '模型标识无效。');}
      const presence = this.presence.get(grant.seat);
      if (body.connected === false && presence.client?.id !== id) return {ok: true};
      if (model === undefined && presence.client?.id === id) model = presence.client.model;
      presence.client = {name, version, id, seen: Date.now(), connected: body.connected !== false, ...(model ? {model} : {})};
      if (body.connected !== false && this.managedPlay.get(grant.seat)?.client?.provider !== 'api') this.#modelName(grant.seat, model || null);
      if (!this.managedPlay.has(grant.seat)) this.setManagedPlay(grant.seat, null);
      const managed = this.managedPlay.get(grant.seat);
      if (!managed.client?.provider || managed.client.provider === 'mcp') managed.client = {provider: 'mcp', state: managed.paused ? 'stopped' : 'running', clientName: name};
      return {ok: true};
    });
  }

  connectionState(seat) {
    const player = this.game.players[seat];
    if (!player || player.controller?.kind !== 'agent') return {seat, state: 'not_configured', label: '未配置'};
    const presence = this.presence.get(seat);
    if (!presence) return {seat, state: 'waiting', label: '等待连接'};
    if (presence.generation !== player.controller.generation) return {seat, state: 'rebind', label: '需要重新绑定'};
    if (presence.client) {
      const {name, version, seen, connected, model} = presence.client;
      const online = connected && Date.now() - seen < 45000;
      return {seat, state: online ? 'connected' : 'disconnected', label: online ? '已连接' : '已断开', client: {name, version, ...(model ? {model} : {})}};
    }
    if (presence.connected) return {seat, state: 'connected', label: '已连接'};
    return {seat, state: 'disconnected', label: '已断开'};
  }

  disconnect(seat) {
    const player = this.game.players[seat];
    if (!player || player.controller?.kind !== 'agent') throw new EnvironmentError('invalid_action', '这个座位没有外部连接。');
    const presence = this.presence.get(seat);
    this.presence.set(seat, {connected: false, seen: Date.now(), generation: presence?.generation || player.controller.generation});
    this.#dropUi(`seat:${seat}`);
    return this.connectionState(seat);
  }

  #uiKey(grant) {
    if (grant.role === 'seat') return `seat:${grant.seat}`;
    if (grant.role === 'observer') return 'observer';
    return null;
  }

  #dropUi(key) {
    if (key) this.uiViews.delete(key);
    else this.uiViews.clear();
  }

  #uiSlot(grant, create) {
    const key = this.#uiKey(grant);
    if (!key) throw new EnvironmentError('forbidden', '这个身份没有自己的界面。', 403);
    let slot = this.uiViews.get(key);
    const generation = grant.role === 'seat' ? grant.generation : 0;
    if (slot && slot.generation !== generation) {
      this.uiViews.delete(key);
      slot = null;
    }
    if (!slot && create) {
      slot = {generation, pageInstance: null, connected: false, controls: [], page: null, click: null};
      this.uiViews.set(key, slot);
    }
    return slot;
  }

  uiExchange(token, body = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      const slot = this.#uiSlot(grant, true);
      const pageInstance = typeof body.pageInstance === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(body.pageInstance) ? body.pageInstance : null;
      if (!pageInstance) throw new EnvironmentError('unauthorized', '界面还没有绑定到这个凭证。', 401);
      if (slot.pageInstance && slot.pageInstance !== pageInstance) slot.click = null;
      slot.pageInstance = pageInstance;
      slot.generation = grant.role === 'seat' ? grant.generation : slot.generation;
      slot.connected = true;
      slot.page = typeof body.page === 'string' ? body.page.slice(0, 80) : null;
      const controls = Array.isArray(body.controls) ? body.controls : [];
      slot.controls = controls.slice(0, 200).map(control => ({
        id: typeof control?.id === 'string' ? control.id.slice(0, 120) : '',
        label: typeof control?.label === 'string' ? control.label.slice(0, 80) : '',
        disabled: !!control?.disabled
      })).filter(control => control.id);
      let click = null;
      if (slot.click && slot.click.pageInstance === pageInstance && slot.click.generation === slot.generation) {
        click = {id: slot.click.id};
        slot.click = null;
      }
      return {ok: true, click};
    });
  }

  uiObserve(token) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      const slot = this.#uiSlot(grant, false);
      if (!slot?.connected) throw new EnvironmentError('ui_unavailable', '尚未连接界面。');
      return {connected: true, page: slot.page, controls: slot.controls.map(control => ({...control}))};
    });
  }

  uiAct(token, body = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'seat') throw new EnvironmentError('forbidden', '只有该座位自己的界面可以接收点击。', 403);
      this.#checkManaged(grant);
      const slot = this.#uiSlot(grant, false);
      if (!slot?.connected) throw new EnvironmentError('ui_unavailable', '尚未连接界面。');
      const id = body.id;
      if (typeof id !== 'string' || !slot.controls.some(control => control.id === id)) throw new EnvironmentError('invalid_action', '界面上没有这个控件。');
      slot.click = {id, pageInstance: slot.pageInstance, generation: slot.generation};
      return {status: 'queued', id};
    });
  }

  uiCapture(token) {
    return this.uiObserve(token);
  }

  hostSave(token) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'host') throw new EnvironmentError('forbidden', '只有主机可以读取存档。', 403);
      return {save: JSON.parse(serialize(this.game))};
    });
  }

  #mountSimulation(game) {
    this.game = game;
    this.simulation = new GameSimulation(game, {
      execute: this.savedExecute,
      prepareObservation: this.savedPrepare,
      onChange() {},
      onRejected() {},
      onEconomy() {}
    });
    this.simulation.onNative = entry => this.nativeBuffer.push(entry);
  }

  #reissueSeats() {
    // A loaded world keeps controller generations, so dropping the view map is not enough.
    // Old seat and observer grants are revoked or a stale page could publish into the new match.
    this.#dropUi();
    for (const [token, grant] of this.grants) {
      if (grant.role === 'seat' || grant.role === 'observer') this.grants.delete(token);
    }
    this.seatTokens = new Map();
    for (const player of this.game.players) if (isDecisionSeat(player)) this.seatTokens.set(player.id, this.#issue('seat', player.id, player.controller.generation, player.controller.agentId));
    this.observerToken = this.#issue('observer', null, 0, 'observer');
    this.epoch = `epoch-${randomBytes(8).toString('hex')}`;
  }

  hostLoad(token, save, {record = true} = {}) {
    return this.#exclusive(async () => {
      const grant = this.#grant(token);
      if (grant.role !== 'host') throw new EnvironmentError('forbidden', '只有主机可以载入存档。', 403);
      const loaded = restore(typeof save === 'string' ? save : JSON.stringify(save));
      if (record) this.commands.push({kind: 'load', save: JSON.parse(serialize(loaded))});
      this.#mountSimulation(loaded);
      this.actionRevision++;
      this.managedPlay.clear();
      this.#reissueSeats();
      return this.#sessionFor(grant);
    });
  }

  reassign(token, seat, spec = {}, {record = true} = {}) {
    return this.#exclusive(() => {
      const grant = this.#grant(token);
      if (grant.role !== 'host') throw new EnvironmentError('forbidden', '只有主机可以改派座位。', 403);
      const player = this.game.players[seat];
      if (!player) throw new EnvironmentError('invalid_action', '座位不存在。');
      this.managedPlay.delete(seat);
      assignController(player, spec.kind, {displayName: spec.autoName ? '待识别' : spec.displayName, agentId: spec.agentId || player.controller?.agentId || `seat-${seat}`, bump: true, autoName: spec.autoName});
      this.actionRevision++;
      this.#dropUi(`seat:${seat}`);
      if (isDecisionSeat(player)) this.seatTokens.set(player.id, this.#issue('seat', player.id, player.controller.generation, player.controller.agentId));
      else this.seatTokens.delete(player.id);
      this.epoch = `epoch-${randomBytes(8).toString('hex')}`;
      if (record) this.commands.push({kind: 'reassign', seat, spec: {kind: player.controller.kind, displayName: player.controller.displayName, agentId: player.controller.agentId, ...(player.controller.autoName ? {autoName: true} : {})}});
      return {seat, controller: publicControllers(this.game, -1).find(item => item.seat === seat), token: this.seatTokens.get(seat) || null};
    });
  }

  #envelope(body) {
    if (body.match_id !== undefined && body.match_id !== this.id) throw new EnvironmentError('stale_match', '对局编号不匹配。', 409);
    if (body.world_epoch !== undefined && body.world_epoch !== this.epoch) throw new EnvironmentError('stale_match', '世界世代不匹配。', 409);
    if (body.request_id !== undefined && (typeof body.request_id !== 'string' || !/^[A-Za-z0-9_.:-]{1,80}$/.test(body.request_id))) throw new EnvironmentError('invalid_action', '请求编号无效。');
  }

  #fresh(grant, token) {
    if (token === undefined || token === null || token === '') throw new EnvironmentError('missing_observation', '缺少 observation_token；请先读取 game_observe 或 game_options，并传入最新令牌。', 400);
    const current = this.#projected(grant.seat).token;
    if (token !== current) throw new EnvironmentError('stale_observation', '观察已经过期，请重新获取。', 409);
  }

  static async replay(record, execute) {
    const game = restore(record.initial);
    const runtime = new MatchRuntime();
    runtime.game = game;
    runtime.id = record.match_id;
    runtime.epoch = record.world_epoch;
    runtime.profile = record.profile;
    runtime.assistance = record.assistance;
    runtime.initial = record.initial;
    runtime.savedExecute = execute;
    runtime.savedPrepare = async () => ({player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}});
    runtime.simulation = new GameSimulation(game, {
      execute,
      prepareObservation: runtime.savedPrepare,
      onChange() {},
      onRejected() {},
      onEconomy() {}
    });
    runtime.simulation.onNative = entry => runtime.nativeBuffer.push(entry);
    runtime.hostToken = runtime.#issue('host', null, 0, 'host');
    runtime.observerToken = runtime.#issue('observer', null, 0, 'observer');
    runtime.seatTokens = new Map();
    for (const player of game.players) if (isDecisionSeat(player)) runtime.seatTokens.set(player.id, runtime.#issue('seat', player.id, player.controller.generation, player.controller.agentId));
    const bind = script => {
      let index = 0;
      const list = Array.isArray(script) ? script : [];
      runtime.simulation.replayNative = seat => {
        const next = list[index];
        if (!next || next.seat !== seat) return null;
        index += 1;
        return next;
      };
    };
    for (const step of record.commands) {
      if (step.kind === 'start') continue;
      if (step.kind === 'model-identity') {runtime.#modelName(step.seat, step.model, {record: false}); continue;}
      if (step.kind === 'forfeit') {
        bind(step.nativeScript || []);
        await runtime.forfeit(runtime.hostToken, step.seat);
        continue;
      }
      if (step.kind === 'strategy') {
        const token = runtime.seatTokens.get(step.seat);
        await runtime.strategy(token, {doctrine: step.doctrine, strategy: step.strategy});
        continue;
      }
      if (step.kind === 'reassign') {
        await runtime.reassign(runtime.hostToken, step.seat, step.spec, {record: false});
        continue;
      }
      if (step.kind === 'load') {
        await runtime.hostLoad(runtime.hostToken, step.save, {record: false});
        continue;
      }
      const token = runtime.seatTokens.get(step.seat);
      const observation = runtime.#projected(step.seat).token;
      if (step.kind === 'end-turn') {
        bind(step.nativeScript || []);
        await runtime.endTurn(token, {observation_token: observation, force: step.force});
      } else {
        runtime.simulation.replayNative = null;
        await runtime.act(token, {observation_token: observation, action: step.action});
      }
    }
    return runtime;
  }
}
