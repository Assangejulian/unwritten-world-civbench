// Paid, isolated seat-turn audit. Secrets stay in RAM; only usage metadata is logged.
import {createServer} from 'node:http';
import {mkdir, readFile, writeFile, appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Lobby} from '../src/environment/lobby.mjs';
import {AgentLauncher} from '../src/environment/agent-launcher.mjs';
import {ModelContextStore, contextPath, estimateTokens} from '../src/environment/model-context-store.mjs';
import {CIVS} from '../src/rules.mjs';
import * as E from '../src/engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(ROOT, process.env.AUDIT_OUTPUT || 'output/deepseek-50-20261021');
const source = process.env.CIV_AUDIT_KEY_FILE ? await readFile(process.env.CIV_AUDIT_KEY_FILE, 'utf8') : '';
const apiKey = process.env.DEEPSEEK_API_KEY || source.split(/\r?\n/).find(line => /^deepseek\s*[:：]/i.test(line.trim()))?.replace(/^\s*deepseek\s*[:：]\s*/i, '').trim();
if (!apiKey || /[\r\n]/.test(apiKey)) throw new Error('Set DEEPSEEK_API_KEY or explicitly provide CIV_AUDIT_KEY_FILE for this paid audit.');
await mkdir(OUT, {recursive: true});
const safeWrite = async (file, value) => {
  const text = JSON.stringify(value, null, 2);
  if (text.includes(apiKey)) throw new Error('Secret detected in audit output.');
  await writeFile(path.join(OUT, file), text);
};
const wire = [], turns = [], errors = [], started = Date.now();
const launcher = new AgentLauncher({outputRoot: path.join(OUT, 'clients')});
const lobby = new Lobby({launcher});
let nativeCalls = 0, completed = -1, requests = 0;
const measure = () => {
  const game = lobby.runtime.game;
    return structuredClone({turn: game.turn, players: game.players.map(player => ({
    id: player.id, name: player.name, alive: player.alive, gold: player.gold,
    techs: player.techs, civics: player.civics, research: player.research,
    researchProgress: player.researchProgress, civic: player.civic,
    civicProgress: player.civicProgress, explored: player.explored?.length,
    score: E.score(game, player),
    cities: game.cities.filter(city => city.owner === player.id).map(city => ({id: city.id, name: city.name, tile: city.tile, population: city.population ?? city.pop, production: city.production, buildings: city.buildings, districts: city.districts})),
    units: game.units.filter(unit => unit.owner === player.id).map(unit => ({id: unit.id, type: unit.type, tile: unit.tile, hp: unit.hp, route: unit.route})),
    improvements: game.map.tiles.filter(tile => tile.owner === player.id && tile.improvement).length
  }))});
};
// The loopback metering relay forwards the unmodified payload and records no headers or text.
const relay = createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/chat/completions') {res.writeHead(404).end(); return;}
  const id = ++requests, at = Date.now();
  let payload;
  try {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    let opening = {}; try {opening = JSON.parse(payload.messages.find(item => item.role === 'user')?.content || '{}');} catch {}
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`},
      body: JSON.stringify(payload), signal: AbortSignal.timeout(300000)
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    let body = {}; try {body = JSON.parse(bytes.toString('utf8'));} catch {}
    const item = {id, turn: opening.session?.turn, status: response.status,
      seconds: (Date.now() - at) / 1000, requestBytes: Buffer.byteLength(JSON.stringify(payload)),
      estimatedPromptTokens: estimateTokens(payload), historyMessages: payload.messages?.length,
      availableActions: opening.choices?.total, usage: body.usage || null,
      responseModel: body.model, finishReason: body.choices?.[0]?.finish_reason,
      calls: body.choices?.[0]?.message?.tool_calls?.map(call => call.function?.name) || [],
      hasContextSummary: !!opening.contextMemory,
      recalledSummaryChars: opening.memory?.summary?.length || 0,
      recentRecords: opening.memory?.recent?.length || 0};
    wire.push(item);
    await appendFile(path.join(OUT, 'wire-usage.jsonl'), JSON.stringify(item) + '\n');
    res.writeHead(response.status, {'Content-Type': 'application/json'}); res.end(bytes);
  } catch {
    errors.push({request: id, code: 'metering_relay_or_network_failure', seconds: (Date.now() - at) / 1000});
    if (!res.headersSent) res.writeHead(502, {'Content-Type': 'application/json'});
    res.end('{"error":{"message":"Provider connection failed"}}');
  }
});
await new Promise(resolve => relay.listen(0, '127.0.0.1', resolve));
let timer;
try {
  const sourceHashes = {};
  for (const file of ['environment/mcp/api-player.mjs', 'src/environment/model-api.mjs', 'src/environment/model-context-store.mjs']) sourceHashes[file] = createHash('sha256').update(await readFile(path.join(ROOT, file))).digest('hex');
  await safeWrite('config.json', {model: 'deepseek-chat', targetSeatTurns: 50, seed: 'DEEPSEEK-50-20261021', size: 'small', players: 4, barbarians: true, nativeOpponents: true, maxOutputTokens: null, compressionTokens: 200000, productionSave: false, sourceHashes});
  await lobby.prepare({players: 4, size: 'small', seed: 'DEEPSEEK-50-20261021', barbarians: true,
    drivers: CIVS.slice(0, 4).map(civ => civ.file),
    seats: [{seat: 0, kind: 'agent', displayName: 'DeepSeek Audit'}, ...[1, 2, 3].map(seat => ({seat, kind: 'native'}))]});
  const execute = lobby.pool.execute.bind(lobby.pool);
  lobby.pool.execute = async (...args) => {nativeCalls++; return execute(...args);};
  await safeWrite('initial-world.json', JSON.parse(E.serialize(lobby.runtime.game)));
  await launcher.start(lobby, {seat: 0, rounds: 50, provider: 'api', api: {
    baseUrl: `http://127.0.0.1:${relay.address().port}`, model: 'deepseek-chat', protocol: 'chat-completions',
    apiKey: '', timeoutSeconds: 300, contextTokens: 32768
  }});
  const readyEnd = Date.now() + 30000;
  while (lobby.status().externalConnected !== 1 && Date.now() < readyEnd) await new Promise(resolve => setTimeout(resolve, 250));
  if (lobby.status().externalConnected !== 1) throw new Error('MCP player did not connect.');
  await lobby.start({waitPolicy: 'wait', observer: true});
  console.log('AUDIT_STARTED: deepseek-chat; 50 seat turns; three real C++ opponents.');
  const checkpoint = async () => {
    const progress = lobby.runtime.managedPlayProgress(0), status = launcher.status(0);
    const brief = {completed: progress?.completed || 0, state: status.state, requests,
      inputTokens: wire.reduce((sum, item) => sum + (item.usage?.prompt_tokens || 0), 0),
      outputTokens: wire.reduce((sum, item) => sum + (item.usage?.completion_tokens || 0), 0),
      cacheHitTokens: wire.reduce((sum, item) => sum + (item.usage?.prompt_cache_hit_tokens || 0), 0),
      seconds: Math.round((Date.now() - started) / 1000), error: status.error || null};
    await safeWrite('progress.json', brief);
    if (brief.completed !== completed) {completed = brief.completed; turns.push({...brief, world: measure()}); await safeWrite('turns.json', turns);}
    return brief;
  };
  timer = setInterval(() => {void checkpoint().then(brief => console.log(JSON.stringify(brief)));}, 30000);
  while (Date.now() - started < 10200000) {
    const brief = await checkpoint();
    if (['completed', 'failed', 'stopped', 'ended'].includes(brief.state)) break;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  clearInterval(timer);
  const status = launcher.status(0), progress = lobby.runtime.managedPlayProgress(0);
  launcher.stop(0);
  const owned = launcher.runs.get(0); if (owned?.child?.exitCode === null) await launcher.waitForExit(owned);
  const store = new ModelContextStore(contextPath(ROOT, lobby.runtime.id));
  const events = store.events(0), stats = store.stats(0), recalled = store.workingSet(0);
  const compactions = store.db.prepare('SELECT COUNT(*) AS count FROM summaries WHERE seat=0').get().count;
  store.close();
  await safeWrite('events.json', events);
  await safeWrite('commands.json', lobby.runtime.commands);
  await safeWrite('final-world.json', JSON.parse(E.serialize(lobby.runtime.game)));
  await safeWrite('result.json', {state: status.state, progress, seconds: Math.round((Date.now() - started) / 1000), nativeCalls,
    requests, wire, errors, world: measure(), sqlite: {messages: stats.messages, gzipBytes: stats.gzipBytes, hot: stats.hot, events: stats.events, eventTextBytes: stats.eventTextBytes, compactions, compression: recalled.compression},
    worker: {requests: status.requests, inputTokens: status.inputTokens, outputTokens: status.outputTokens, error: status.error}});
  console.log('AUDIT_FINISHED: ' + JSON.stringify({state: status.state, completed: progress?.completed, requests, nativeCalls, compactions}));
} catch {
  await safeWrite('failure.json', {code: 'audit_failed', completed, requests, errors});
  console.log('AUDIT_FAILED: inspect sanitized progress and failure artifacts.');
  process.exitCode = 1;
} finally {
  clearInterval(timer); launcher.dispose(); lobby.dispose(); relay.closeAllConnections(); await new Promise(resolve => relay.close(resolve));
}
