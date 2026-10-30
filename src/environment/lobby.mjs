// One pending match for the New Game screen. Credentials shown here are the match Start joins.
import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {driverInfo} from '../drivers.mjs';
import {NativeDriverPool} from '../driver-pool.mjs';
import {ObservationPool} from '../observation-pool.mjs';
import {validateDisplayName} from './controllers.mjs';
import {EnvironmentError, MatchRuntime} from './match.mjs';
import {AgentLauncher} from './agent-launcher.mjs';
import {normalizeAiAlgorithm} from '../ai.mjs';
import {WORLD_RAINFALL,RESOURCE_ABUNDANCE} from '../rules.mjs';
import {HarnessConnections} from './harnesses.mjs';

const ADAPTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../environment/mcp/server.mjs');
const EMPTY_OBS = {player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}};

function stable(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function normalize(config = {}) {
  for(const [key,table]of [['rainfall',WORLD_RAINFALL],['resourceAbundance',RESOURCE_ABUNDANCE]])if(config[key]!==undefined&&(typeof config[key]!=='string'||!Object.hasOwn(table,config[key])))throw new EnvironmentError('invalid_match','世界生成选项无效：'+key);
  if(config.barbarians!==undefined&&typeof config.barbarians!=='boolean')throw new EnvironmentError('invalid_match','蛮族选项必须是布尔值。');
  if(config.naturalWondersEnabled!==undefined&&typeof config.naturalWondersEnabled!=='boolean')throw new EnvironmentError('invalid_match','自然奇观选项必须是布尔值。');
  const players = Math.max(2, Math.min(16, Math.floor(Number(config.players) || 2)));
  if (config.playMode === 'realtime') throw new EnvironmentError('invalid_match', '外部 AI 需要回合制。实时观战不能接入 MCP。');
  const seats = Array.isArray(config.seats) ? config.seats : [];
  if (!seats.length) throw new EnvironmentError('invalid_match', '请为每个文明选择控制者。');
  const seen = new Set();
  const normalizedSeats = seats.map(seat => {
    const id = Number(seat.seat);
    if (!Number.isInteger(id) || id < 0 || id >= players || seen.has(id)) throw new EnvironmentError('invalid_match', '座位分配无效。');
    seen.add(id);
    if (!['human', 'agent', 'native', 'inactive'].includes(seat.kind)) throw new EnvironmentError('invalid_match', '座位类型无效。');
    const autoName = seat.kind === 'agent' && seat.autoName === true;
    const displayName = seat.kind === 'agent' ? autoName ? '待识别' : validateDisplayName(seat.displayName || '') : null;
    const agentId = seat.kind === 'agent' ? (seat.agentId || `seat-${id}`) : null;
    return {seat: id, kind: seat.kind, displayName, agentId, ...(autoName ? {autoName: true} : {})};
  });
  if (!normalizedSeats.some(seat => seat.kind === 'agent' || seat.kind === 'human' || seat.kind === 'inactive')) {
    throw new EnvironmentError('invalid_match', '至少保留一个人类、外部 AI 或弃权席位。');
  }
  return {
    players,
    seed: String(config.seed || ''),
    size: config.size || 'small',
    mapType: config.mapType || 'random',
    gameSpeed: config.gameSpeed || 'standard',
    rainfall: config.rainfall || 'standard',
    resourceAbundance: config.resourceAbundance || 'standard',
    naturalWondersEnabled: config.naturalWondersEnabled !== false,
    climateEnabled: config.climateEnabled !== false,
    disasterIntensity: config.disasterIntensity ?? 2,
    maxTurns: config.maxTurns,
    barbarians: config.barbarians !== false,
    victories: config.victories,
    aiAlgorithm: normalizeAiAlgorithm(config.aiAlgorithm),
    leaders: config.leaders,
    doctrines: config.doctrines,
    strategies: config.strategies,
    drivers: config.drivers,
    seats: normalizedSeats
  };
}

export class Lobby {
  constructor({stub = false, launcher = new AgentLauncher(), harnesses = new HarnessConnections()} = {}) {
    this.stub = stub === true;
    this.runtime = null;
    this.hash = null;
    this.server = null;
    this.url = null;
    this.pool = null;
    this.observations = null;
    this.launcher = launcher;
    this.harnesses = harnesses;
    // Operator capability for lobby management. It is not a seat or observer token,
    // and no HTTP response or static page is allowed to reveal it.
    this.hostCapability = randomBytes(24).toString('hex');
  }

  authorize(token) {
    const expected = Buffer.from(this.hostCapability);
    const given = Buffer.from(typeof token === 'string' ? token : '');
    if (given.length !== expected.length) {
      timingSafeEqual(expected, expected);
      return false;
    }
    return timingSafeEqual(given, expected);
  }

  async prepare(config) {
    if (this.runtime?.started) throw new EnvironmentError('live_match', '对局已经开始。返回或修改设置不会结束它。', 409);
    const normalized = normalize(config);
    const hash = stable(normalized);
    if (this.runtime && this.hash === hash) return this.status();
    await this.#dropPending();
    if (!this.stub) await this.#assertNatives(normalized);
    if (!this.stub) {
      this.pool = new NativeDriverPool();
      this.observations = new ObservationPool(2);
    }
    this.runtime = await MatchRuntime.create({
      pending: true,
      profile: 'interactive',
      players: normalized.players,
      size: normalized.size,
      seed: normalized.seed || undefined,
      barbarians: normalized.barbarians,
      gameSpeed: normalized.gameSpeed,
      rainfall: normalized.rainfall,
      resourceAbundance: normalized.resourceAbundance,
      naturalWondersEnabled: normalized.naturalWondersEnabled,
      climateEnabled: normalized.climateEnabled,
      disasterIntensity: normalized.disasterIntensity,
      mapType: normalized.mapType,
      leaders: normalized.leaders,
      victories: normalized.victories,
      maxTurns: normalized.maxTurns,
      aiAlgorithm: normalized.aiAlgorithm,
      doctrines: normalized.doctrines,
      strategies: normalized.strategies,
      drivers: normalized.drivers,
      seats: normalized.seats,
      execute: this.stub ? async () => ({orders: [], memory: null, ms: 0, stderr: ''}) : (player, observation) => this.pool.execute(player, observation),
      prepareObservation: this.stub ? async () => EMPTY_OBS : (game, player) => this.observations.prepare(game, player)
    });
    this.hash = hash;
    if (!this.server) {
      const {listen} = await import('./http.mjs');
      const host = await listen(null, {port: 0, lobby: this});
      this.server = host.server;
      this.url = host.url;
    }
    return this.status();
  }

  status() {
    if (!this.runtime) return {prepared: false, started: false, stub: this.stub, nativeMode: this.nativeMode(), url: this.url, seats: []};
    const card = this.runtime.connectionCard();
    const seats = card.seats.map(seat => ({
      seat: seat.seat,
      kind: seat.kind,
      displayName: seat.displayName,
      agentId: seat.agentId,
      leader: seat.leader,
      name: seat.name,
      connection: this.runtime.connectionState(seat.seat),
      managed: this.launcher.status(seat.seat, this.runtime)
    }));
    const agents = seats.filter(seat => seat.kind === 'agent');
    const connected = agents.filter(seat => seat.connection.state === 'connected').length;
    return {
      prepared: true,
      started: !!this.runtime.started,
      stub: this.stub,
      nativeMode: this.nativeMode(),
      match_id: card.match_id,
      url: this.url,
      profile: card.profile,
      seats,
      externalConnected: connected,
      externalTotal: agents.length,
      waiting: this.externalWaiting()
    };
  }

  nativeMode() {
    return this.stub ? '测试桩，不是实战内置 AI' : '内置对手使用真实 C++ 驱动';
  }

  externalWaiting() {
    if (!this.runtime) return [];
    return this.runtime.game.players.filter(player => player.controller?.kind === 'agent' && this.runtime.connectionState(player.id).state !== 'connected').map(player => `${player.name} / 座位 ${player.id} / ${player.controller.displayName}`);
  }

  copy(seat) {
    if (!this.runtime || !this.url) throw new EnvironmentError('not_started', '请先准备连接。');
    const player = this.runtime.game.players[seat];
    const token = this.runtime.seatTokens.get(seat);
    if (!player || player.controller?.kind !== 'agent' || !token) throw new EnvironmentError('invalid_action', '这个座位没有外部连接配置。');
    const node = process.execPath;
    const toml = [
      `[mcp_servers.hex_seat_${seat}]`,
      `command = ${JSON.stringify(node)}`,
      `args = [${JSON.stringify(ADAPTER)}]`,
      `env = { CIV_MATCH_URL = ${JSON.stringify(this.url)}, CIV_MATCH_TOKEN = ${JSON.stringify(token)} }`
    ].join('\n');
    return {
      seat,
      displayName: player.controller.displayName,
      name: player.name,
      leader: player.leader,
      url: this.url,
      command: `"${node}" "${ADAPTER}"`,
      env: {CIV_MATCH_URL: this.url, CIV_MATCH_TOKEN: token},
      toml,
      json: JSON.stringify({mcpServers: {[`hex_seat_${seat}`]: {command: node, args: [ADAPTER], env: {CIV_MATCH_URL: this.url, CIV_MATCH_TOKEN: token}}}}, null, 2),
      note: '只包含这个座位的凭证。不含观察者或主机凭证。'
    };
  }

  async start({waitPolicy = 'refuse', observer = false} = {}) {
    if (!this.runtime) throw new EnvironmentError('not_started', '请先准备连接。');
    if (this.runtime.started) throw new EnvironmentError('live_match', '对局已经开始。', 409);
    const waiting = this.externalWaiting();
    if (waiting.length && waitPolicy !== 'wait') {
      throw new EnvironmentError('waiting_client', `这些外部席位还没有连接：${waiting.join('、')}。没有把它们换成内置 AI。`);
    }
    await this.runtime.begin();
    const humans = this.runtime.game.players.filter(player => player.controller?.kind === 'human' && player.alive);
    const watch = observer || !humans.length;
    const access = watch ? this.runtime.observerToken : this.runtime.seatTokens.get(humans[0].id);
    return {started: true, url: this.url, access, role: watch ? 'observer' : 'seat', nativeMode: this.nativeMode()};
  }

  async cancel() {
    if (this.runtime?.started) throw new EnvironmentError('live_match', '对局已经开始。返回或修改设置不会结束它。', 409);
    await this.#dropPending();
    return {prepared: false, started: false, stub: this.stub};
  }

  disconnect(seat) {
    if (!this.runtime) throw new EnvironmentError('not_started', '请先准备连接。');
    this.launcher.stop(seat);
    return this.runtime.disconnect(seat);
  }

  async #assertNatives(config) {
    for (const seat of config.seats) {
      if (seat.kind !== 'native') continue;
      const file = config.drivers?.[seat.seat];
      if (!file) throw new EnvironmentError('native_missing', `座位 ${seat.seat} 没有指定内置驱动。`);
      const info = await driverInfo(file);
      if (info.status !== 'ready') throw new EnvironmentError('native_missing', `内置对手 ${file} 没有可用的真实 C++ 驱动。`);
    }
  }

  async #dropPending() {
    if (this.runtime?.started) return;
    if (this.runtime) await this.harnesses.releaseMatch(this.runtime.id);
    this.launcher.dispose();
    this.pool?.dispose();
    this.observations?.dispose();
    this.pool = null;
    this.observations = null;
    this.runtime = null;
    this.hash = null;
  }

  dispose() {
    this.launcher.dispose();
    this.pool?.dispose();
    this.observations?.dispose();
    this.server?.close();
  }
}
