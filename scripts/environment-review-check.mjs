// Independent R1-R6 probes. A pass is an isolated generated match, not Grok-model gameplay.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {MatchRuntime} from '../src/environment/match.mjs';
import {HUMAN_PREVIEW_KEYS} from '../src/environment/projection.mjs';
import {religionActions} from '../src/religion.mjs';
import {restore, serialize} from '../src/engine.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {ObservationPool} from '../src/observation-pool.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'output/player-mcp-review-20261019/probe-results.json');
const stub = async () => ({orders: [], memory: null, ms: 0, stderr: ''});
const seats = [{seat: 0, kind: 'agent', displayName: 'Review A'}, {seat: 1, kind: 'agent', displayName: 'Review B'}];
const make = () => MatchRuntime.create({profile: 'benchmark', players: 2, size: 'small', seed: 'INDEPENDENT-MCP-REVIEW', barbarians: false, seats, execute: stub});
const results = {};

function pass(name) {
  console.log(`PASS ${name}`);
}

const runtime = await make();
const token = runtime.connectionCard().seats.find(seat => seat.seat === 0).token;

const opts = await runtime.options(token, {limit: 100, include_catalogue: true});
const types = new Set();
const previewKeys = new Set();
let cursor = 0;
do {
  const page = await runtime.options(token, {limit: 100, cursor});
  for (const action of page.actions) {
    types.add(action.type);
    for (const key of Object.keys(action.preview || {})) previewKeys.add(key);
  }
  cursor = page.next;
} while (cursor != null);
const undocumented = [...types].filter(type => !opts.catalogue.some(item => item.type === type));
assert.deepEqual(undocumented, []);
const attack = opts.catalogue.find(item => item.type === 'attack');
for (const field of ['targetUnit', 'targetCity', 'enemy', 'health', 'distance']) assert.equal(attack.fields.includes(field), true);
const leakedPreview = [...previewKeys].filter(key => !HUMAN_PREVIEW_KEYS.has(key));
assert.deepEqual(leakedPreview, []);
results.catalogue = {generatedButUndocumented: undocumented, attackFields: attack.fields, previewKeys: [...previewKeys]};
pass('catalogue covers generated actions and strips private previews');

const tech = runtime.rules(token, {kind: 'tech', limit: 5});
assert.equal(tech.entries.length, 5);
assert.equal(tech.total > 5, true);
assert.equal(tech.truncated, true);
assert.equal(tech.next, 5);
results.ruleEnumeration = {total: tech.total, page: tech.entries.length, truncated: tech.truncated};
pass('technology rules paginate');

const beforeBlocked = runtime.gameplayHash();
const fresh = await runtime.observe(token);
await assert.rejects(
  () => runtime.act(token, {observation_token: fresh.observation_token, request_id: 'review-surprise', action: {type: 'research', item: 'pottery', surprise: true}}),
  error => error.code === 'invalid_action' && /不能识别的行动字段 surprise/.test(error.message)
);
const afterSurprise = await runtime.observe(token);
await assert.rejects(
  () => runtime.act(token, {observation_token: afterSurprise.observation_token, request_id: 'review-category', action: {type: 'research', item: 'pottery', category: 'founder'}}),
  error => error.code === 'invalid_action' && /不能识别的行动字段 category/.test(error.message)
);
assert.equal(runtime.gameplayHash(), beforeBlocked);
results.blockedShapes = {surprise: 'invalid_action', categoryOnResearch: 'invalid_action', hashUnchanged: true};
pass('unknown action fields stay rejected');

const seen = await runtime.observe(token, {section: 'full'});
assert.equal(seen.value.players[1].driver, undefined);
const tokenBefore = seen.observation_token;
runtime.game.players[1].driver.calls += 1;
const tokenAfterCalls = (await runtime.observe(token, {section: 'full'})).observation_token;
assert.equal(tokenAfterCalls, tokenBefore);
const unmet = !runtime.game.players[0].met.includes(1);
let privateStable = null;
if (unmet) {
  const gold = runtime.game.players[1].gold;
  const research = runtime.game.players[1].research;
  runtime.game.players[1].gold += 40;
  runtime.game.players[1].research = research === 'mining' ? 'pottery' : 'mining';
  privateStable = (await runtime.observe(token, {section: 'full'})).observation_token === tokenBefore;
  assert.equal(privateStable, true);
  runtime.game.players[1].gold = gold;
  runtime.game.players[1].research = research;
}
const hidden = runtime.game.units.find(unit => unit.owner !== 0 && !runtime.game.players[0].visible.includes(unit.tile));
assert.ok(hidden, 'expected a unit outside seat 0 vision');
const origin = hidden.tile;
const destination = runtime.game.map.tiles.find(tile => tile.id !== origin && !runtime.game.players[0].visible.includes(tile.id) && !runtime.game.units.some(unit => unit.tile === tile.id));
assert.ok(destination);
const tokenBeforeHidden = (await runtime.observe(token)).observation_token;
hidden.tile = destination.id;
const tokenAfterHidden = (await runtime.observe(token)).observation_token;
assert.equal(tokenAfterHidden, tokenBeforeHidden);
hidden.tile = origin;
results.hiddenTelemetry = {unmet, driverStripped: true, callsChangedToken: false, privateFieldsChangedToken: privateStable === null ? null : !privateStable, hiddenUnitChangedToken: false};
pass('seated projection ignores stripped driver telemetry and hidden units');

const self = runtime.game.players[0];
self.religion = 'harmony';
self.religionParent = null;
self.faith = 500;
const beliefAction = religionActions(runtime.game, self).find(action => action.type === 'belief');
assert.ok(beliefAction, 'expected a legal belief');
const {hint, ...belief} = beliefAction;
const clone = restore(serialize(runtime.game));
new GameSimulation(clone, {execute: stub, onChange() {}, onEconomy() {}}).command(clone.players[0], belief);
assert.equal(clone.players[0].beliefs[belief.category], belief.item);
const beliefView = await runtime.observe(token);
const applied = await runtime.act(token, {observation_token: beliefView.observation_token, request_id: 'review-belief', action: belief});
assert.equal(applied.status, 'applied', applied.error);
assert.equal(runtime.game.players[0].beliefs[belief.category], belief.item);
results.belief = {humanPath: 'applied', environmentPath: applied.status, action: belief};
pass('belief category is accepted and applied');

const forfeited = await make();
await forfeited.forfeit(forfeited.connectionCard().hostToken, 0);
const record = forfeited.replayRecord();
const replayed = await MatchRuntime.replay(record, stub);
assert.equal(replayed.gameplayHash(), record.gameplayHash);
assert.equal(forfeited.game.players[0].controller.kind, 'inactive');
assert.equal(replayed.game.players[0].controller.kind, 'inactive');
results.forfeitReplay = {
  commandsRecorded: record.commands.length,
  hashEqual: true,
  originalController: forfeited.game.players[0].controller.kind,
  replayController: replayed.game.players[0].controller.kind
};
pass('forfeit replay keeps the inactive controller and the gameplay hash');

const native = new NativeDriverPool();
const observation = new ObservationPool(2);
try {
  const match = await MatchRuntime.create({
    profile: 'benchmark',
    players: 2,
    size: 'small',
    seed: 'MCP-REAL-NATIVE-REVIEW',
    barbarians: false,
    seats: [{seat: 1, kind: 'agent', displayName: 'Review AI'}],
    execute: (player, observed) => native.execute(player, observed),
    prepareObservation: (game, player) => observation.prepare(game, player)
  });
  const seat = match.connectionCard().seats[0].token;
  const actions = [];
  for (let round = 0; round < 10; round++) {
    assert.equal(match.simulation.activePlayer, 1);
    for (const type of ['found', 'research', 'civic', 'produce']) {
      const options = await match.options(seat, {type, limit: 100});
      const action = options.actions.find(item => type !== 'produce' || !match.game.cities.find(city => city.id === item.city)?.production);
      if (!action) continue;
      const {preview, ...command} = action;
      const result = await match.act(seat, {observation_token: options.observation_token, request_id: `review-${round}-${type}`, action: command});
      assert.equal(result.status, 'applied', result.error);
      actions.push(type);
    }
    const state = await match.observe(seat);
    await match.endTurn(seat, {observation_token: state.observation_token, request_id: `review-end-${round}`, force: true});
    console.log(`NATIVE ROUND ${round + 1}: turn ${match.game.turn}`);
  }
  const opponent = match.game.players[0];
  assert.equal(opponent.driver.failures, 0, opponent.driver.message);
  assert.equal(opponent.driver.calls >= 10, true);
  const nativeRecord = match.replayRecord();
  const nativeReplay = await MatchRuntime.replay(nativeRecord, (player, observed) => native.execute(player, observed));
  const hashEqual = nativeRecord.gameplayHash === nativeReplay.gameplayHash();
  const replayNativeCalls = nativeReplay.game.players[0].driver.calls;
  results.nativeTenRounds = {
    rounds: 10,
    turn: match.game.turn,
    nativeCalls: opponent.driver.calls,
    nativeFailures: opponent.driver.failures,
    submittedTypes: [...new Set(actions)],
    nativeProcesses: native.spawnCount
  };
  results.nativeReplay = {hashEqual, originalNativeCalls: opponent.driver.calls, replayNativeCalls, replayFailures: nativeReplay.game.players[0].driver.failures};
  assert.equal(hashEqual, true);
  assert.equal(replayNativeCalls, opponent.driver.calls);
  pass('ten real native rounds replay to the same gameplay hash');
} finally {
  native.dispose();
  observation.dispose();
  await mkdir(path.dirname(OUT), {recursive: true});
  await writeFile(OUT, JSON.stringify(results, null, 2));
}

console.log('ENVIRONMENT REVIEW CHECK PASSED');
