import http from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {playerTasks} from '../player-tasks.mjs';
import {unitRoute, settlementLens} from '../player-planning.mjs';
import {listDrivers} from '../drivers.mjs';
import {EnvironmentError} from './match.mjs';
import {cleanActions,projectSeat} from './projection.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BODY_LIMIT = 1024 * 1024;
const SOURCE_FILES = ['heritage-data.mjs', 'age-data.mjs', 'governor-data.mjs',  'rules.mjs', 'river-network.mjs', 'nations.mjs', 'congress.mjs', 'victory-rules.mjs', 'leader-rework.mjs', 'unique-content.mjs', 'leader-badge.mjs'];

function fail(code, message, status = 400) {
  const error = new EnvironmentError(code, message, status);
  return error;
}

function bearer(req) {
  const match = /^Bearer ([A-Fa-f0-9]{16,128})$/.exec(req.headers.authorization || '');
  if (!match) throw fail('unauthorized', '需要持有连接凭证。', 401);
  return match[1];
}

async function readBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    chunks.push(chunk);
    bytes += chunk.length;
    if (bytes > BODY_LIMIT) throw fail('invalid_action', '请求超过 1 MB 上限。');
  }
  if (!bytes) return {};
  const text = Buffer.concat(chunks.map(chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw fail('invalid_action', '请求不是有效的 JSON。');
  }
}

function send(res, status, value) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  res.end(JSON.stringify(value));
}

function localRequest(req, host, port) {
  const expected = [`${host}:${port}`, host === '127.0.0.1' ? `localhost:${port}` : null].filter(Boolean);
  if (!expected.includes(req.headers.host)) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  return [`http://${host}:${port}`, host === '127.0.0.1' ? `http://localhost:${port}` : null].filter(Boolean).includes(origin);
}

async function serveStatic(req, res, route) {
  const staticPath = route === '/' ? 'web/index.html' : SOURCE_FILES.includes(route.slice(1)) ? 'src' + route : 'web' + decodeURIComponent(route);
  const file = path.resolve(ROOT, staticPath);
  const allowedSource = SOURCE_FILES.some(name => file === path.join(ROOT, 'src', name));
  if (!file.startsWith(path.join(ROOT, 'web') + path.sep) && !allowedSource) {
    send(res, 404, {error: 'Not found'});
    return;
  }
  const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2'}[path.extname(file)] || 'application/octet-stream';
  const headers = {'Content-Type': mime, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'"};
  if (mime.startsWith('audio/')) {
    const info = await stat(file);
    headers['Accept-Ranges'] = 'bytes';
    headers['Content-Length'] = info.size;
    res.writeHead(200, headers);
    createReadStream(file).pipe(res);
    return;
  }
  const content = await readFile(file);
  res.writeHead(200, headers);
  res.end(content);
}

async function browserSession(runtime, view, token) {
  const {projected, token: observation} = await runtime.projection(view);
  const state = await runtime.read(() => runtime.simulation.state(view));
  return {
    game: projected,
    session: {
      ...state,
      canEndTurn: token.role === 'seat' && !!runtime.game.players[token.seat]?.alive && state.canEndTurn,
      canAct: token.role === 'seat' && !!runtime.game.players[token.seat]?.alive && runtime.started && state.activePlayer === token.seat && state.phase !== 'ai' && !runtime.game.winner,
      eliminated: token.role === 'seat' && !runtime.game.players[token.seat]?.alive,
      busy: false,
      speed: 1,
      revision: runtime.browserRevision || 1,
      world: 1,
      lastError: '',
      lastSaved: null,
      nextTurnAt: null,
      lastRound: null,
      observationToken: observation,
      controllers: projected.controllers,
      role: token.role,
      seat: token.role === 'seat' ? token.seat : null,
      contract: 'civbench-environment/1',
      match_id: runtime.id,
      world_epoch: runtime.epoch,
      profile: runtime.profile,
      managedRuns: [...runtime.managedPlay.keys()].filter(seat => token.role !== 'seat' || seat === token.seat).map(seat => ({seat, displayName: runtime.game.players[seat].controller.displayName, ...runtime.managedPlayProgress(seat), connection: runtime.connectionState(seat).state}))
    }
  };
}

export async function listen(runtime, {host = '127.0.0.1', port = 0, lobby = null} = {}) {
  if (port === 43821) throw new Error('Refusing the desktop game port 43821.');
  if (runtime) runtime.browserRevision = 1;
  const server = http.createServer((req, res) => {
    handle(runtime, server, req, res, lobby).catch(error => {
      if (res.headersSent) return;
      const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
      send(res, status, {error: error.message || '请求失败。', code: error.code || 'internal'});
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const bound = server.address().port;
  if (bound === 43821) {
    server.close();
    throw new Error('Refusing the desktop game port 43821.');
  }
  return {server, host, port: bound, url: `http://${host}:${bound}`};
}

async function handle(runtime, server, req, res, lobby = null) {
  const bound = server.address();
  if (!bound || !localRequest(req, bound.address, bound.port)) {
    send(res, 403, {error: 'This match host accepts loopback requests only.'});
    return;
  }
  const url = new URL(req.url, `http://${bound.address}:${bound.port}`);
  const route = url.pathname;
  const active = () => lobby?.runtime || runtime;
  if (req.method === 'GET' && route === '/health') {
    send(res, 200, {ok: true, contract: 'civbench-environment/1', service: 'match-host', features: {modelApi: true, mcpClients: true, unboundedAgents: true, modelObserver: true}});
    return;
  }
  if (req.method === 'GET' && !route.startsWith('/v1/') && !route.startsWith('/api/')) {
    await serveStatic(req, res, route);
    return;
  }
  if (lobby && route.startsWith('/api/lobby')) {
    await lobbyRoute(lobby, req, res, route);
    return;
  }
  if (req.method === 'POST' && route === '/api/ui-bridge') {
    const body = await readBody(req);
    const match = active();
    if (!match) {
      send(res, 200, {ok: false, error: '尚未连接界面'});
      return;
    }
    const header = /^Bearer ([A-Fa-f0-9]{16,128})$/.exec(req.headers.authorization || '');
    if (!header) {
      send(res, 401, {ok: false, error: '需要持有连接凭证。', code: 'unauthorized'});
      return;
    }
    send(res, 200, await match.uiExchange(header[1], body));
    return;
  }
  if (req.method === 'GET' && route === '/api/drivers') {
    send(res, 200, {drivers: await listDrivers()});
    return;
  }
  const match = active();
  if (!match) {
    if (req.method === 'GET' && route === '/api/state') {
      send(res, 200, {idle: true, prepared: false, started: false});
      return;
    }
    send(res, 400, {error: '对局尚未准备', code: 'not_started'});
    return;
  }
  if (req.method === 'GET' && route === '/api/state' && !req.headers.authorization) {
    send(res, 200, {idle: true, prepared: true, started: !!match.started});
    return;
  }
  const token = bearer(req);
  if (route.startsWith('/v1/')) {
    await environmentRoute(match, req, res, route, token);
    return;
  }
  await browserRoute(match, req, res, url, token);
}

function presentedBearer(req) {
  const match = /^Bearer ([A-Fa-f0-9]{16,128})$/.exec(req.headers.authorization || '');
  return match ? match[1] : '';
}

async function lobbyRoute(lobby, req, res, route) {
  if (!lobby.authorize(presentedBearer(req))) throw fail('unauthorized', '只有主机可以管理准备中的对局。', 401);
  if (req.method === 'GET' && route === '/api/lobby') {
    send(res, 200, lobby.status());
    return;
  }
  if (req.method !== 'POST') throw fail('invalid_action', 'Method not allowed', 405);
  const body = await readBody(req);
  if (route === '/api/lobby/prepare') send(res, 200, await lobby.prepare(body));
  else if (route === '/api/lobby/start') send(res, 200, await lobby.start(body));
  else if (route === '/api/lobby/cancel') send(res, 200, await lobby.cancel());
  else if (route === '/api/lobby/copy') send(res, 200, lobby.copy(Number(body.seat)));
  else if (route === '/api/lobby/harness/scan') send(res, 200, await lobby.harnesses.scan(lobby));
  else if (route === '/api/lobby/harness/bind') send(res, 200, await lobby.harnesses.bind(lobby, body));
  else if (route === '/api/lobby/harness/unbind') send(res, 200, await lobby.harnesses.unbind(lobby, body));
  else if (route === '/api/lobby/harness/open') send(res, 200, await lobby.harnesses.open(body));
  else if (route === '/api/lobby/disconnect') send(res, 200, lobby.disconnect(Number(body.seat)));
  else if (route === '/api/lobby/agent/start') send(res, 200, await lobby.launcher.start(lobby, body));
  else if (route === '/api/lobby/agent/check') send(res, 200, await lobby.launcher.checkApi(body.api, {lobby, seat: Number(body.seat), keepExistingKey: body.keepExistingKey === true}));
  else if (route === '/api/lobby/agent/profile') send(res, 200, lobby.launcher.apiProfile(lobby, Number(body.seat)));
  else if (route === '/api/lobby/agent/trace') send(res, 200, lobby.launcher.trace(lobby, Number(body.seat), body.after));
  else if (route === '/api/lobby/agent/update') send(res, 200, await lobby.launcher.updateApi(lobby, body));
  else if (route === '/api/lobby/agent/resume') send(res, 200, await lobby.launcher.resume(lobby, Number(body.seat)));
  else if (route === '/api/lobby/agent/stop') send(res, 200, lobby.launcher.stop(Number(body.seat), lobby));
  else throw fail('invalid_action', 'Unknown lobby route', 404);
}

async function environmentRoute(runtime, req, res, route, token) {
  if (req.method === 'GET' && route === '/v1/session') {
    send(res, 200, await runtime.session(token, {touch: req.headers['x-civbench-probe'] !== '1'}));
    return;
  }
  if (req.method === 'GET' && route === '/v1/connection') {
    const session = await runtime.session(token);
    if (session.role !== 'host') throw fail('forbidden', '只有主机可以读取连接卡。', 403);
    send(res, 200, runtime.connectionCard());
    return;
  }
  if (req.method === 'GET' && route === '/v1/replay') {
    const session = await runtime.session(token);
    if (session.role !== 'host') throw fail('forbidden', '只有主机可以导出回放。', 403);
    send(res, 200, runtime.replayRecord());
    return;
  }
  if (req.method !== 'POST') throw fail('invalid_action', 'Method not allowed', 405);
  const body = await readBody(req);
  if (route === '/v1/client') send(res, 200, await runtime.registerClient(token, body));
  else if (route === '/v1/observe') send(res, 200, await runtime.observe(token, body));
  else if (route === '/v1/inspect') send(res, 200, await runtime.inspect(token, body));
  else if (route === '/v1/options') send(res, 200, await runtime.options(token, body));
  else if (route === '/v1/preview') send(res, 200, await runtime.preview(token, body));
  else if (route === '/v1/act') send(res, 200, await runtime.act(token, body));
  else if (route === '/v1/batch') send(res, 200, await runtime.batch(token, body));
  else if (route === '/v1/end-turn') send(res, 200, await runtime.endTurn(token, body));
  else if (route === '/v1/events') send(res, 200, await waitForEvents(runtime, token, body));
  else if (route === '/v1/rules') send(res, 200, runtime.rules(token, body));
  else if (route === '/v1/strategy') send(res, 200, await runtime.strategy(token, body));
  else if (route === '/v1/ui/observe') send(res, 200, await runtime.uiObserve(token));
  else if (route === '/v1/ui/act') send(res, 200, await runtime.uiAct(token, body));
  else if (route === '/v1/ui/capture') send(res, 200, await runtime.uiCapture(token));
  else if (route === '/v1/disconnect') {
    const session = await runtime.session(token);
    if (session.role !== 'host') throw fail('forbidden', '只有主机可以断开座位。', 403);
    send(res, 200, runtime.disconnect(body.seat));
  } else if (route === '/v1/reassign') send(res, 200, await runtime.reassign(token, body.seat, body));
  else if (route === '/v1/save') send(res, 200, await runtime.hostSave(token));
  else if (route === '/v1/load') send(res, 200, await runtime.hostLoad(token, body.save));
  else if (route === '/v1/start') {
    const session = await runtime.session(token);
    if (session.role !== 'host') throw fail('forbidden', '只有主机可以开始对局。', 403);
    send(res, 200, await runtime.begin());
  } else if (route === '/v1/forfeit') {
    const session = await runtime.session(token);
    if (session.role !== 'host') throw fail('forbidden', '只有主机可以判定弃权。', 403);
    send(res, 200, await runtime.forfeit(token, body.seat));
  } else throw fail('invalid_action', 'Unknown environment route', 404);
}

async function waitForEvents(runtime, token, body) {
  const wait = Math.max(0, Math.min(30000, Number(body.wait_ms) || 0));
  const started = Date.now();
  let page = runtime.events(token, body);
  while (wait && !page.events.length && !page.yourTurn && !page.terminal && !page.eliminated && Date.now() - started < wait) {
    await new Promise(resolve => setTimeout(resolve, 200));
    page = runtime.events(token, body);
  }
  return page;
}

async function browserRoute(runtime, req, res, url, tokenText) {
  const session = await runtime.session(tokenText);
  const seatLocked = session.role === 'seat';
  const requested = Number(url.searchParams.get('view') ?? (seatLocked ? session.seat : -1));
  const view = seatLocked ? session.seat : requested;
  if (!Number.isInteger(view) || view < -1 || view >= runtime.game.players.length) throw fail('invalid_action', '无效的玩家视野。');
  if (req.method === 'GET' && url.pathname === '/api/state') {
    runtime.browserRevision = (runtime.browserRevision || 1) + 1;
    send(res, 200, await browserSession(runtime, view, session));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/tasks') {
    if (view < 0) throw fail('forbidden', '任务仅对玩家视角开放。', 403);
    const tasks = await runtime.read(() => playerTasks(runtime.game, view));
    send(res, 200, {game: runtime.game.id, world: 1, revision: runtime.browserRevision || 1, ...tasks});
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/unit-plan') {
    const id = Number(url.searchParams.get('unit'));
    const destination = url.searchParams.has('tile') ? Number(url.searchParams.get('tile')) : null;
    const plan = await runtime.read(() => {
      const player = runtime.game.players[view];
      const unit = runtime.game.units.find(item => item.id === id && item.owner === view);
      if (view < 0 || !player || !unit) return null;
      return {game: runtime.game.id, unit: id, ...(destination === null ? {sites: unit.type === 'settler' ? settlementLens(runtime.game, player) : []} : {route: unitRoute(runtime.game, player, unit, destination)})};
    });
    if (!plan) throw fail('forbidden', '只能规划己方单位。', 403);
    send(res, 200, plan);
    return;
  }
  if(req.method==='GET'&&url.pathname==='/api/observation'){
    if(!seatLocked||view<0)throw fail('forbidden','观察者不能请求可执行命令。',403);
    const owner=url.searchParams.get('player');if(owner!==null&&Number(owner)!==session.seat)throw fail('forbidden','不能查询其他座位的命令。',403);
    const raw=url.searchParams.get('unit'),unit=raw===null?undefined:Number(raw);
    const result=await runtime.read(()=>{
      const p=runtime.game.players[view];if(raw!==null&&(!Number.isInteger(unit)||!runtime.game.units.some(u=>u.id===unit&&u.owner===view)))throw fail('invalid_action','单位不存在。');
      const projected=projectSeat(runtime.game,view,{profile:runtime.profile});
      return {...projected,player:projected.players.find(p=>p.id===view),legalActions:cleanActions(runtime.game,p,{pathsForUnit:unit,nativeRoutes:false}).map(({preview,...action})=>({...action,...(preview?{hint:preview}:{})}))};
    });send(res,200,result);return;
  }
  if (req.method !== 'POST') throw fail('invalid_action', 'Method not allowed', 405);
  const body = await readBody(req);
  if (url.pathname === '/api/action') {
    if (session.role !== 'seat') throw fail('forbidden', '观察者不能下达命令。', 403);
    if (body.player !== undefined && body.player !== session.seat) throw fail('forbidden', '不能改用其他座位的命令。', 403);
    const result = await runtime.act(tokenText, {match_id: runtime.id, world_epoch: runtime.epoch, observation_token: body.observation_token, request_id: body.request_id, action: body.action});
    if (result.status !== 'applied') throw fail('invalid_action', result.error || '行动被拒绝。');
    send(res, 200, {ok: true, immediate: true, ...result});
    return;
  }
  if (url.pathname === '/api/end-turn') {
    if (session.role !== 'seat') throw fail('forbidden', '观察者不能结束回合。', 403);
    const result = await runtime.endTurn(tokenText, {match_id: runtime.id, world_epoch: runtime.epoch, observation_token: body.observation_token, request_id: body.request_id, force: body.force === true});
    send(res, 200, {ok: true, ...result});
    return;
  }
  if (url.pathname === '/api/strategy') {
    if (session.role !== 'seat') throw fail('forbidden', '观察者不能更改国策。', 403);
    const result = await runtime.strategy(tokenText, {match_id: runtime.id, world_epoch: runtime.epoch, doctrine: body.doctrine, strategy: body.strategy});
    send(res, 200, {ok: true, ...result});
    return;
  }
  throw fail('forbidden', '这场隔离对局没有开放该桌面操作。', 403);
}
