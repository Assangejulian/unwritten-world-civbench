// Proves the stdio adapter against the installed MCP SDK and an isolated match.
// A passing run is a reference client, not evidence that a Grok host is connected.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {MatchRuntime} from '../../src/environment/match.mjs';
import {listen} from '../../src/environment/http.mjs';
import * as E from '../../src/engine.mjs';
import * as H from '../../src/heritage.mjs';
import {actionSpec} from '../../src/environment/catalog.mjs';
import {summarize} from '../../src/environment/projection.mjs';
import {neighbors} from '../../src/world.mjs';
import {TECHS} from '../../src/rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, 'server.mjs');
const TOOLS = ['game_session', 'game_observe', 'game_inspect', 'game_options', 'game_preview', 'game_act', 'game_batch', 'game_end_turn', 'game_events', 'game_rules', 'game_strategy', 'ui_observe', 'ui_act', 'ui_capture'];
const empty = {player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}};

function childEnv(extra) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (typeof value === 'string') env[key] = value;
  delete env.CIV_MATCH_URL;
  delete env.CIV_MATCH_TOKEN;
  return {...env, ...extra};
}

function spawnClosed(extra) {
  return spawnSync(process.execPath, [SERVER], {encoding: 'utf8', cwd: HERE, env: childEnv(extra), timeout: 15000});
}

const missing = spawnClosed({});
assert.notEqual(missing.status, 0);
assert.equal(missing.stdout, '');
assert.match(missing.stderr, /CIV_MATCH_URL/);
const desktop = spawnClosed({CIV_MATCH_URL: 'http://127.0.0.1:43821', CIV_MATCH_TOKEN: 'ab'.repeat(16)});
assert.notEqual(desktop.status, 0);
assert.equal(desktop.stdout, '');
assert.match(desktop.stderr, /43821/);

const runtime = await MatchRuntime.create({
  profile: 'benchmark',
  players: 2,
  size: 'small',
  seed: 'MCP-CHECK',
  barbarians: false,
  seats: [
    {seat: 0, kind: 'agent', displayName: 'Grok', agentId: 'grok'},
    {seat: 1, kind: 'agent', displayName: 'Other', agentId: 'other'}
  ],
  execute: async () => ({orders: [], memory: null, ms: 0, stderr: ''}),
  prepareObservation: async () => empty
});
const host = await listen(runtime, {port: 0});
assert.notEqual(host.port, 43821);
const card = runtime.connectionCard();
const seat0 = card.seats.find(seat => seat.seat === 0).token;
const seat1 = card.seats.find(seat => seat.seat === 1).token;
const clients = [];

function payload(result) {
  assert.equal(result.content?.[0]?.type, 'text');
  return JSON.parse(result.content[0].text);
}

async function connect(token, url = host.url) {
  const stderr = [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER],
    cwd: HERE,
    stderr: 'pipe',
    env: childEnv({CIV_MATCH_URL: url, CIV_MATCH_TOKEN: token})
  });
  transport.stderr?.on('data', chunk => stderr.push(String(chunk)));
  const client = new Client({name: 'hex-civilizations-mcp-check', version: '1.0.0'});
  await client.connect(transport);
  clients.push(client);
  return {client, stderr};
}

try {
  const first = await connect(seat0);
  const listed = await first.client.listTools();
  assert.deepEqual(listed.tools.map(tool => tool.name).sort(), [...TOOLS].sort());
  for (const tool of listed.tools) assert.equal(typeof tool.description, 'string');
  for (const name of ['game_act', 'game_batch', 'game_end_turn']) assert.ok(listed.tools.find(tool => tool.name === name).inputSchema.required.includes('observation_token'));

  const session = payload(await first.client.callTool({name: 'game_session', arguments: {}}));
  assert.equal(session.role, 'seat');
  assert.equal(session.seat, 0);
  assert.equal(session.yourTurn, true);
  assert.equal(session.profile, 'benchmark');
  assert.equal(session.contract, 'civbench-environment/1');
  assert.equal(JSON.stringify(session).includes('MCP-CHECK'), false);
  assert.equal(session.controllers.find(item => item.seat === 0).displayName, 'Grok');

  const observed = payload(await first.client.callTool({name: 'game_observe', arguments: {section: 'summary'}}));
  assert.equal(typeof observed.observation_token, 'string');
  assert.match(observed.observation_ref, /^oref_[a-f0-9]{8}_[1-9][0-9]*$/);
  const sameReference = payload(await first.client.callTool({name: 'game_observe', arguments: {section: 'units'}}));
  assert.equal(sameReference.observation_ref, observed.observation_ref);
  const climate = payload(await first.client.callTool({name: 'game_observe', arguments: {section: 'climate'}}));
  assert.equal(climate.value.version, 1);
  assert.equal(climate.value.enabled, true);
  assert.equal(climate.value.own.player, 0);
  assert.equal(climate.value.contributors.find(row => row.player === null)?.name, '其他文明');
  assert.equal(climate.value.rng, undefined);
  assert.equal(climate.value.geography, undefined);
  const natural = payload(await first.client.callTool({name: 'game_observe', arguments: {section: 'natural_wonders'}}));
  assert.equal(natural.value.enabled, true);
  assert.equal(natural.value.landmarks.length, 0);
  const naturalRules = payload(await first.client.callTool({name: 'game_rules', arguments: {kind: 'natural_wonder', limit: 40}}));
  assert.equal(naturalRules.total, 35);
  assert.equal(naturalRules.entries.length, 35);
  assert.ok(naturalRules.entries.every(entry => entry.rule.origin === 'real'));
  assert.ok(JSON.stringify(naturalRules).includes('mount_etna'));
  assert.equal(observed.value.tasks[0].kind, 'research');
  assert.ok(observed.value.tasks.some(task => task.kind === 'unit'));
  assert.ok(Object.keys(observed.value).indexOf('tasks') < Object.keys(observed.value).indexOf('map'));
  const summaryPage = payload(await first.client.callTool({name: 'game_observe', arguments: {section: 'summary', limit: 1}}));
  assert.equal(summaryPage.value.tasks.length, 1);
  assert.ok(summaryPage.value.tasksPage.total > 1);
  const taskPage = payload(await first.client.callTool({name: 'game_observe', arguments: {section: 'tasks', limit: 1}}));
  assert.equal(taskPage.items.length, 1);
  assert.equal(taskPage.items[0].id, summaryPage.value.tasks[0].id);
  const taskFixture = {playerTasks: {tasks: [{id: 'u1', kind: 'unit'}, {id: 'c', kind: 'civic'}, {id: 'u2', kind: 'unit'}, {id: 'p', kind: 'production'}]}};
  const taskOrder = JSON.stringify(taskFixture);
  assert.deepEqual(summarize(taskFixture).tasks.map(task => task.id), ['c', 'p', 'u1', 'u2']);
  assert.equal(JSON.stringify(taskFixture), taskOrder);
  assert.equal(JSON.stringify(observed).includes('MCP-CHECK'), false);
  assert.equal(JSON.stringify(observed).includes(seat0), false);
  for (const controller of observed.value.controllers) {
    if (controller.seat === 0) assert.equal(controller.displayName, 'Grok');
    else assert.deepEqual(controller, {seat: controller.seat, known: false});
  }

  const rules = payload(await first.client.callTool({name: 'game_rules', arguments: {}}));
  assert.ok(rules.kinds.includes('leader'));
  const leader = payload(await first.client.callTool({name: 'game_rules', arguments: {kind: 'leader', key: 'sejong'}}));
  assert.ok(leader.rule.passiveDescription);
  assert.equal(leader.rule.weights, undefined);
  assert.equal(observed.value.counts.ownUnits, runtime.game.units.filter(unit => unit.owner === 0).length);
  assert.equal(observed.value.counts.visibleUnits, observed.value.counts.units);
  const beforeInvalid = runtime.gameplayHash();
  for (const [name, args] of [
    ['game_act', {action: {type: 'research', item: 'mining'}}],
    ['game_batch', {commands: [{action: {type: 'research', item: 'mining'}}]}],
    ['game_end_turn', {}]
  ]) {
    const malformed = await first.client.callTool({name, arguments: {...args, observation_token: observed.observation_token.slice(0, -1)}});
    assert.equal(malformed.isError, true);
    assert.match(malformed.content.map(item => item.text || '').join(' '), /64 hex characters/);
  }
  const ignoredFilter = await first.client.callTool({name: 'game_options', arguments: {type: 'move', target: 999999}});
  assert.equal(ignoredFilter.isError, true);
  assert.match(ignoredFilter.content.map(item => item.text || '').join(' '), /target/);
  const missingCity = payload(await first.client.callTool({name: 'game_options', arguments: {city: 999999, observation_token: observed.observation_token}}));
  assert.equal(missingCity.total, 0);
  const referenceOptions = payload(await first.client.callTool({name: 'game_options', arguments: {city: 999999, observation_token: observed.observation_ref}}));
  assert.equal(referenceOptions.total, 0);
  const unknownReference = payload(await first.client.callTool({name: 'game_end_turn', arguments: {observation_token: 'oref_deadbeef_999'}}));
  assert.equal(unknownReference.code, 'unknown_observation_reference');
  const staleOptions = payload(await first.client.callTool({name: 'game_options', arguments: {observation_token: 'ot1_' + '0'.repeat(64)}}));
  assert.equal(staleOptions.code, 'stale_observation');
  assert.equal(runtime.gameplayHash(), beforeInvalid);
  for (const args of [{city: 65}, {}, {id: 1, tile: 1}]) {
    const invalid = await first.client.callTool({name: 'game_inspect', arguments: args});
    assert.equal(invalid.isError, true);
    assert.match(invalid.content.map(item => item.text || '').join(' '), /city|exactly one|id/);
  }
  const ownUnit = runtime.game.units.find(unit => unit.owner === 0);
  assert.equal(payload(await first.client.callTool({name: 'game_inspect', arguments: {id: ownUnit.id}})).entity.id, ownUnit.id);
  assert.equal(runtime.gameplayHash(), beforeInvalid);
  const missing = await first.client.callTool({name: 'game_batch', arguments: {commands: [{action: {type: 'research', item: 'mining'}}]}});
  assert.equal(missing.isError, true);
  assert.match(missing.content.map(item => item.text || '').join(' '), /observation_token/);
  await assert.rejects(runtime.act(seat0, {action: {type: 'research', item: 'mining'}}), {code: 'missing_observation'});
  await assert.rejects(runtime.act(seat0, {observation_token: 'expired', action: {type: 'research', item: 'mining'}}), {code: 'stale_observation'});
  await assert.rejects(runtime.inspect(seat0, {city: 65}), {code: 'invalid_action'});
  assert.equal(runtime.gameplayHash(), beforeInvalid);
  assert.equal(rules.actions.includes('research'), true);
  assert.equal(rules.notInGame.some(item => item.type === 'repairWonder'), true);
  const brief = payload(await first.client.callTool({name: 'game_options', arguments: {limit: 5}}));
  assert.equal(brief.catalogue_omitted, true);
  assert.equal(brief.catalogue.length, 0);
  assert.equal(brief.notInGame, undefined);
  assert.equal(Array.isArray(brief.types), true);
  const options = payload(await first.client.callTool({name: 'game_options', arguments: {limit: 5, include_catalogue: true}}));
  assert.equal(options.catalogue.some(item => item.type === 'move'), true);
  assert.equal(options.notInGame.some(item => item.type === 'repairWonder'), true);
  assert.match(options.note, /分页/);
  const events = payload(await first.client.callTool({name: 'game_events', arguments: {wait_ms: 0}}));
  assert.equal(events.yourTurn, true);

  const wrongView = await first.client.callTool({name: 'game_observe', arguments: {view: 1}});
  assert.equal(wrongView.isError, true);
  assert.equal(payload(wrongView).code, 'forbidden');
  const unknown = await first.client.callTool({name: 'game_act', arguments: {observation_token: observed.observation_token, request_id: 'mcp-bad-field', action: {type: 'research', surprise: true}}});
  assert.equal(unknown.isError, true);
  assert.equal(payload(unknown).code, 'invalid_action');
  const noPage = await first.client.callTool({name: 'ui_observe', arguments: {}});
  assert.equal(noPage.isError, true);
  assert.match(payload(noPage).error, /尚未连接界面/);
  const techPage = payload(await first.client.callTool({name: 'game_rules', arguments: {kind: 'tech', limit: 5}}));
  assert.ok(techPage.entries?.length);

  const other = await connect(seat1);
  const foreignReference = payload(await other.client.callTool({name: 'game_end_turn', arguments: {observation_token: observed.observation_ref}}));
  assert.equal(foreignReference.code, 'unknown_observation_reference');
  const otherView = payload(await other.client.callTool({name: 'game_observe', arguments: {section: 'summary'}}));
  const early = await other.client.callTool({name: 'game_act', arguments: {observation_token: otherView.observation_token, request_id: 'mcp-early', action: {type: 'research', item: 'mining'}}});
  assert.equal(early.isError, true);
  assert.equal(payload(early).code, 'out_of_turn');
  const watcher = await connect(card.observerToken);
  const blocked = await watcher.client.callTool({name: 'game_act', arguments: {observation_token: observed.observation_token, action: {type: 'research', item: 'mining'}}});
  assert.equal(blocked.isError, true);
  assert.equal(payload(blocked).code, 'forbidden');
  const watched = payload(await watcher.client.callTool({name: 'game_observe', arguments: {section: 'summary', view: -1}}));
  assert.equal(watched.value.controllers.find(item => item.seat === 1).displayName, 'Other');

  const ended = payload(await first.client.callTool({name: 'game_end_turn', arguments: {observation_token: observed.observation_ref, request_id: 'mcp-end-0'}}));
  assert.equal(ended.status, 'applied');
  assert.equal(ended.activePlayer, 1);
  const retried = payload(await first.client.callTool({name: 'game_end_turn', arguments: {observation_token: observed.observation_token, request_id: 'mcp-end-0'}}));
  assert.deepEqual(retried, ended);
  const retriedReference = payload(await first.client.callTool({name: 'game_end_turn', arguments: {observation_token: observed.observation_ref, request_id: 'mcp-end-0'}}));
  assert.deepEqual(retriedReference, ended);
  assert.equal(runtime.simulation.activePlayer, 1);

  await first.client.close();
  const reconnected = await connect(seat0);
  const after = payload(await reconnected.client.callTool({name: 'game_session', arguments: {}}));
  assert.equal(after.yourTurn, false);
  assert.equal(after.turn, ended.turn);

  const secondView = payload(await other.client.callTool({name: 'game_observe', arguments: {section: 'summary'}}));
  const finished = payload(await other.client.callTool({name: 'game_end_turn', arguments: {observation_token: secondView.observation_token, request_id: 'mcp-end-1'}}));
  assert.equal(finished.turn, ended.turn + 1);
  assert.equal(finished.activePlayer, 0);

  const settler = runtime.game.units.find(unit => unit.owner === 0 && unit.type === 'settler');
  const ready = payload(await reconnected.client.callTool({name: 'game_observe', arguments: {section: 'summary'}}));
  const oldProcessReference = payload(await reconnected.client.callTool({name: 'game_end_turn', arguments: {observation_token: observed.observation_ref}}));
  assert.equal(oldProcessReference.code, 'unknown_observation_reference');
  const founded = payload(await reconnected.client.callTool({name: 'game_act', arguments: {observation_token: ready.observation_ref, action: {type: 'found', unit: settler.id}}}));
  assert.match(founded.next_observation_ref, /^oref_/);
  const staleReference = payload(await reconnected.client.callTool({name: 'game_options', arguments: {observation_token: ready.observation_ref}}));
  assert.equal(staleReference.code, 'stale_observation');
  assert.equal(founded.status, 'applied');
  const city = runtime.game.cities.find(city => city.owner === 0);
  runtime.game.players[0].techs.push('mining', 'pottery', 'writing', 'masonry', 'bronze');
  city.population = 4;
  runtime.actionRevision++;
  async function allOptions(compact) {
    const actions = []; let cursor = 0;
    do {
      const page = payload(await reconnected.client.callTool({name: 'game_options', arguments: {cities: [city.id], type: 'produce', compact, limit: 100, cursor}}));
      actions.push(...page.actions); cursor = page.next;
    } while (cursor !== null);
    return actions;
  }
  const full = await allOptions(false), compact = await allOptions(true);
  const expanded = compact.flatMap(row => {
    if (!row.tiles) return [row];
    const {tiles, ...command} = row; return tiles.map(tile => ({...command, tile}));
  });
  const canonical = value => value && typeof value === 'object' ? Array.isArray(value) ? value.map(canonical) : Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  assert.deepEqual(expanded.map(action => JSON.stringify(canonical(action))).sort(), full.map(action => JSON.stringify(canonical(action))).sort());
  assert.ok(compact.length < full.length, 'Equivalent placements should be grouped without dropping legal targets');
  assert.ok(JSON.stringify(compact).length < JSON.stringify(full).length);
  console.log(JSON.stringify({compactOptions: {fullRows: full.length, compactRows: compact.length, fullBytes: Buffer.byteLength(JSON.stringify(full)), compactBytes: Buffer.byteLength(JSON.stringify(compact)), lossless: true}}));
  const filtered = payload(await reconnected.client.callTool({name: 'game_options', arguments: {cities: [city.id], type: 'produce', item: 'warrior'}}));
  assert.ok(filtered.actions.length && filtered.actions.every(action => action.city === city.id && action.item === 'warrior'));
  console.log('PASS strict inspect input, required/fresh write tokens, public leader rules, explicit ownership counts, and lossless compact/bulk options');

  // Exercise the advertised full activation command through the real stdio boundary.
  const player = runtime.game.players[0];
  player.techs = Object.keys(TECHS);
  city.buildings.push('campus', 'library');
  const districtTile = neighbors(runtime.game.map, runtime.game.map.tiles[city.tile]).find(tile => !tile.district && tile.cityId === null);
  assert.ok(districtTile);
  districtTile.owner = 0;
  districtTile.district = {item: 'campus', city: city.id, kind: 'district'};
  city.districts.push({item: 'campus', tile: districtTile.id});
  const scientist = H.GREAT_PEOPLE.find(person => person.key === 'zhang_heng');
  runtime.game.heritage.skipped = H.GREAT_PEOPLE.slice(0, H.GREAT_PEOPLE.indexOf(scientist)).filter(person => person.classKey === scientist.classKey).map(person => person.key);
  player.greatPeople.points.scientist = 10000;
  E.applyAction(runtime.game, player, {type: 'recruitGreatPerson', item: scientist.key});
  const person = runtime.game.units.find(unit => unit.greatPerson === scientist.key);
  person.tile = city.tile; person.moves = 3; person.acted = false;
  runtime.actionRevision++;
  const activationOptions = payload(await reconnected.client.callTool({name: 'game_options', arguments: {type: 'activateGreatPerson', unit: person.id}}));
  assert.ok(activationOptions.actions.length);
  const {preview, ...activation} = activationOptions.actions[0];
  assert.equal(activation.city, city.id);
  for (const field of Object.keys(activation)) assert.ok(field === 'type' || actionSpec(activation.type).fields.includes(field), field);
  for (const field of ['city', 'targetUnit', 'religion', 'religionParent']) assert.ok(actionSpec(activation.type).fields.includes(field));
  const beforeActivation = runtime.gameplayHash();
  const rejectedCity = payload(await reconnected.client.callTool({name: 'game_act', arguments: {observation_token: activationOptions.observation_token, action: {...activation, city: -1}}}));
  assert.equal(rejectedCity.status, 'rejected');
  assert.equal(runtime.gameplayHash(), beforeActivation);
  const unknownActivation = await reconnected.client.callTool({name: 'game_act', arguments: {observation_token: activationOptions.observation_token, action: {...activation, tile: city.tile}}});
  assert.equal(payload(unknownActivation).code, 'invalid_action');
  assert.equal(runtime.gameplayHash(), beforeActivation);
  const science = E.cityYields(runtime.game, city).science;
  const activated = payload(await reconnected.client.callTool({name: 'game_act', arguments: {observation_token: activationOptions.observation_token, action: activation}}));
  assert.equal(activated.status, 'applied');
  assert.ok(player.boosts.includes('engineering'));
  assert.ok(E.cityYields(runtime.game, city).science > science);
  assert.ok(!runtime.game.units.includes(person));
  console.log('PASS Great Person options round-trip through MCP, real science effect, retirement, and atomic invalid targets');

  const guard = runtime.game.units.find(unit => unit.owner === 0 && unit.type === 'warrior');
  assert.ok(guard); guard.moves = 2; guard.acted = false; delete guard.moveOrder;
  runtime.actionRevision++;
  const standby = payload(await reconnected.client.callTool({name: 'game_options', arguments: {type: 'alert', unit: guard.id}}));
  assert.ok(standby.actions.some(action => action.type === 'alert' && action.unit === guard.id));
  const resting = payload(await reconnected.client.callTool({name: 'game_act', arguments: {observation_token: standby.observation_ref, action: {type: 'alert', unit: guard.id}}}));
  assert.equal(resting.status, 'applied'); assert.equal(guard.stance, 'alert');
  const waking = payload(await reconnected.client.callTool({name: 'game_options', arguments: {type: 'wake', unit: guard.id}}));
  assert.ok(waking.actions.some(action => action.type === 'wake' && action.unit === guard.id));
  const awake = payload(await reconnected.client.callTool({name: 'game_act', arguments: {observation_token: waking.observation_ref, action: {type: 'wake', unit: guard.id}}}));
  assert.equal(awake.status, 'applied'); assert.equal(guard.stance, undefined);
  console.log('PASS persistent standby and wake options execute through the actual MCP boundary');

  // Defeat is local to a seat; opponents may continue without a global winner.
  player.alive = false;
  runtime.actionRevision++;
  const defeated = payload(await reconnected.client.callTool({name: 'game_session', arguments: {}}));
  assert.equal(defeated.eliminated, true);
  assert.equal(defeated.yourTurn, false);
  assert.equal(defeated.terminal, null);
  const waitStarted = Date.now();
  const defeatEvents = payload(await reconnected.client.callTool({name: 'game_events', arguments: {cursor: 99999999, wait_ms: 30000}}));
  assert.equal(defeatEvents.eliminated, true);
  assert.ok(Date.now() - waitStarted < 2000, 'Eliminated seats must not wait for another turn');
  const defeatHash = runtime.gameplayHash();
  for (const [name, args] of [['game_act', {action: {type: 'research', item: 'mining'}}], ['game_end_turn', {force: true}]]) {
    const rejected = await reconnected.client.callTool({name, arguments: {...args, observation_token: defeatEvents.observation_token}});
    assert.equal(payload(rejected).code, 'eliminated');
    assert.equal(runtime.gameplayHash(), defeatHash);
  }
  console.log('PASS local defeat flag, no false turn, immediate event wait and mutation refusal without ending the world');

  const expiredReference = defeatEvents.observation_ref, goldBeforeCacheCheck = player.gold;
  let newestReference;
  for (let index = 1; index <= 140; index++) {
    player.gold = goldBeforeCacheCheck + index;
    newestReference = payload(await reconnected.client.callTool({name: 'game_observe', arguments: {limit: 1}})).observation_ref;
  }
  const evicted = payload(await reconnected.client.callTool({name: 'game_options', arguments: {observation_token: expiredReference}}));
  assert.equal(evicted.code, 'unknown_observation_reference');
  const retained = await reconnected.client.callTool({name: 'game_options', arguments: {observation_token: newestReference, limit: 1}});
  assert.equal(retained.isError, false);
  player.gold = goldBeforeCacheCheck;
  console.log('PASS bounded short references reject evicted observations and retain the current exact observation');

  // Inject a connection reset, not a game-state failure. No command may auto-retry.
  const polls = [], writes = [];
  let failedRead = false;
  const flaky = http.createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (req.url === '/v1/events') {
      polls.push(body);
      if (!failedRead) {failedRead = true; req.socket.destroy(); return;}
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({events: [], next: body.cursor, yourTurn: false})); return;
    }
    if (req.url === '/v1/act') {writes.push(body); req.socket.destroy(); return;}
    res.writeHead(200, {'content-type': 'application/json'}); res.end('{}');
  });
  await new Promise(resolve => flaky.listen(0, '127.0.0.1', resolve));
  let flakyClient;
  try {
    flakyClient = await connect('ab'.repeat(24), `http://127.0.0.1:${flaky.address().port}`);
    const poll = await flakyClient.client.callTool({name: 'game_events', arguments: {cursor: 6847, wait_ms: 30000}});
    assert.equal(poll.isError, false);
    assert.deepEqual(polls, [{cursor: 6847, wait_ms: 30000}, {cursor: 6847, wait_ms: 0}]);
    const failedWrite = await flakyClient.client.callTool({name: 'game_act', arguments: {observation_token: 'ot1_' + '0'.repeat(64), action: {type: 'fortify', unit: 1}}});
    assert.equal(payload(failedWrite).code, 'unreachable'); assert.equal(writes.length, 1);
    assert.match(payload(failedWrite).recovery, /observe the state/);
  } finally {
    await flakyClient?.client.close();
    await new Promise(resolve => flaky.close(resolve));
  }
  console.log('PASS broken event connections retry once without a second long wait; failed writes never replay automatically');

  const logs = [first, other, watcher, reconnected].flatMap(item => item.stderr).join('');
  assert.equal(logs.includes(seat0), false);
  assert.equal(logs.includes(seat1), false);
  assert.equal(logs.includes(card.observerToken), false);
  assert.match(logs, /MCP adapter ready/);
  console.log('MCP CHECK PASSED');
} finally {
  await Promise.all(clients.map(client => client.close().catch(() => {})));
  await new Promise(resolve => host.server.close(resolve));
}
