import assert from 'node:assert/strict';
import {createGame, restore, serialize} from '../src/engine.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {MatchRuntime, EnvironmentError} from '../src/environment/match.mjs';
import {assignController, isDecisionSeat} from '../src/environment/controllers.mjs';
import {agentBadgeText, formatLeaderIdentity, leaderBadgeHtml} from '../src/leader-badge.mjs';

const emptyObs = {player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}};
const stubExecute = async () => ({orders: [], memory: null, ms: 7, stderr: 'hidden-driver-text'});

function nativeObservation(game, player) {
  if (isDecisionSeat(player)) throw new Error(`native preparation was asked for decision seat ${player.id}`);
  return emptyObs;
}

async function rejects(work, code) {
  try {
    await work();
  } catch (error) {
    assert.equal(error.code, code, error.message);
    assert.ok(error instanceof EnvironmentError);
    return;
  }
  assert.fail(`expected ${code}`);
}

function check(name) {
  console.log(`PASS ${name}`);
}

const legacy = createGame({seed: 'ENV-LEGACY', players: 2, size: 'small', playMode: 'turns', autosaveEnabled: false, barbarians: false});
const legacyText = serialize(legacy);
assert.equal(legacyText.includes('"controller"'), false);
const loaded = restore(legacyText);
assert.equal(loaded.players[0].controller, undefined);
assert.equal(loaded.players[0].manual, true);
assert.equal(loaded.players[1].manual, false);
assignController(legacy.players[0], 'agent', {displayName: 'Grok', agentId: 'grok', bump: true});
const poisoned = JSON.parse(serialize(legacy));
poisoned.players[0].controller.token = 'must-not-load';
assert.throws(() => restore(JSON.stringify(poisoned)), /Invalid controller/);
check('old saves restore and controller secrets are rejected');

assert.equal(formatLeaderIdentity('秦始皇', {kind: 'agent', displayName: 'Grok'}), '秦始皇【Grok】');
assert.equal(formatLeaderIdentity('秦始皇【Grok】', {kind: 'agent', displayName: 'Grok'}), '秦始皇【Grok】');
assert.equal(agentBadgeText({kind: 'agent', displayName: 'Grok'}, {reveal: false}), '');
assert.equal(formatLeaderIdentity('拿破仑', {kind: 'human'}), '拿破仑');
assert.equal(leaderBadgeHtml('秦始皇', {kind: 'agent', displayName: 'A&B'}, {esc: value => String(value).replaceAll('&', '&amp;')}).includes('A&amp;B'), true);
assert.throws(() => assignController(legacy.players[1], 'agent', {displayName: '坏【名】'}));
check('leader badge formatter');

const control = createGame({seed: 'ENV-CONTROL', players: 2, size: 'small', playMode: 'turns', autosaveEnabled: false, barbarians: false});
assignController(control.players[0], 'human', {bump: true});
assignController(control.players[1], 'agent', {displayName: 'Keep', agentId: 'keep', bump: true});
const controlSim = new GameSimulation(control, {execute: stubExecute, prepareObservation: nativeObservation, onChange() {}, onEconomy() {}, onRejected() {}});
assert.equal(controlSim.activePlayer, 0);
controlSim.setControl(control.players[0], false);
assert.equal(control.settings.playMode, 'turns');
assert.equal(isDecisionSeat(control.players[1]), true);
await assert.rejects(() => controlSim.endTurn(1), /无法结束当前回合/);
controlSim.setControl(control.players[1], false);
assert.equal(control.settings.playMode, 'realtime');
assert.equal(control.turnOrder, undefined);
check('releasing the last decision seat returns a desktop match to realtime');

console.log('Creating the two-agent match...');
const runtime = await MatchRuntime.create({
  profile: 'benchmark',
  players: 4,
  size: 'small',
  seed: 'ENV-CHECK-1',
  barbarians: false,
  seats: [
    {seat: 1, kind: 'agent', displayName: 'Grok', agentId: 'grok'},
    {seat: 2, kind: 'agent', displayName: 'Other', agentId: 'other'}
  ],
  execute: stubExecute,
  prepareObservation: nativeObservation
});
assert.equal(runtime.simulation.activePlayer, 1);
assert.equal(runtime.game.players[1].manual, true);
assert.equal(runtime.game.players[2].manual, true);
assert.equal(runtime.game.players[0].controller.kind, 'native');
assert.equal(runtime.game.players[3].controller.kind, 'native');
const card = runtime.connectionCard();
assert.equal(card.seed, null);
assert.equal(card.seats.length, 2);
const token1 = card.seats.find(seat => seat.seat === 1).token;
const token2 = card.seats.find(seat => seat.seat === 2).token;
const savedText = serialize(runtime.game);
assert.equal(savedText.includes(token1), false);
assert.equal(savedText.includes(card.hostToken), false);
assert.equal(savedText.includes(card.observerToken), false);
check('two agents are seated before the first turn and saves contain no tokens');

const seen = await runtime.observe(token1, {section: 'full'});
assert.equal(JSON.stringify(seen).includes('ENV-CHECK-1'), false);
assert.equal(seen.value.environment.seat, 1);
assert.equal(seen.value.environment.canAct, true);
assert.equal(seen.value.players[1].leader.length > 0, true);
assert.equal(seen.value.players[1].strategy !== undefined, true);
for (const player of seen.value.players) {
  if (player.id === 1) continue;
  assert.equal(player.leader, undefined);
  assert.equal(player.leaderKey, undefined);
  assert.equal(player.manual, undefined);
}
for (const controller of seen.value.controllers) {
  if (controller.seat === 1) assert.equal(controller.displayName, 'Grok');
  else assert.deepEqual(controller, {seat: controller.seat, known: false});
}
assert.equal(seen.value.players[1].driver, undefined);
const watchedFull = await runtime.observe(card.observerToken, {section: 'full', view: -1});
assert.deepEqual(Object.keys(watchedFull.value.players[1].driver).sort(), ['calls', 'failures', 'lastMs', 'status']);
await rejects(() => runtime.observe(token1, {view: 0}), 'forbidden');
const omniscient = await runtime.observe(card.observerToken, {section: 'summary', view: -1});
assert.equal(omniscient.value.controllers.find(controller => controller.seat === 2).displayName, 'Other');
await rejects(() => runtime.act(card.observerToken, {action: {type: 'research', item: 'mining'}}), 'forbidden');
await rejects(() => runtime.act('not-a-token', {action: {type: 'research', item: 'mining'}}), 'unauthorized');
check('benchmark fog hides the seed, unmet leaders and other seats');

const seat2 = await runtime.observe(token2);
await rejects(() => runtime.act(token2, {observation_token: seat2.observation_token, action: {type: 'research', item: 'mining'}}), 'out_of_turn');
const beforeStale = runtime.gameplayHash();
await rejects(() => runtime.act(token1, {observation_token: 'ot1_stale', action: {type: 'research', item: 'mining'}}), 'stale_observation');
assert.equal(runtime.gameplayHash(), beforeStale);
const fresh = await runtime.observe(token1);
const rejected = await runtime.act(token1, {observation_token: fresh.observation_token, request_id: 'bad-1', action: {type: 'research', item: 'not-a-tech'}});
assert.equal(rejected.status, 'rejected');
const repeated = await runtime.act(token1, {observation_token: 'ignored-because-the-ledger-hits', request_id: 'bad-1', action: {type: 'research', item: 'not-a-tech'}});
assert.deepEqual(repeated, rejected);
await rejects(() => runtime.act(token1, {observation_token: seen.observation_token, request_id: 'bad-1', action: {type: 'research', item: 'mining'}}), 'request_conflict');
assert.equal(runtime.gameplayHash(), beforeStale);
check('stale tokens, conflicts and rejected actions do not change the match');

const hidden = runtime.game.units.find(unit => unit.owner !== 1 && !runtime.game.players[1].visible.includes(unit.tile));
assert.ok(hidden, 'expected a unit outside seat 1 vision');
const origin = hidden.tile;
const destination = runtime.game.map.tiles.find(tile => tile.id !== origin && !runtime.game.players[1].visible.includes(tile.id) && !runtime.game.units.some(unit => unit.tile === tile.id));
assert.ok(destination);
const tokenBeforeHidden = (await runtime.observe(token1)).observation_token;
hidden.tile = destination.id;
const tokenAfterHidden = (await runtime.observe(token1)).observation_token;
assert.equal(tokenAfterHidden, tokenBeforeHidden);
hidden.tile = origin;
check('a hidden unit move leaves the seated projection unchanged');

const firstView = await runtime.observe(token1);
const firstEnd = await runtime.endTurn(token1, {observation_token: firstView.observation_token, request_id: 'end-0-1'});
assert.equal(runtime.simulation.activePlayer, 2);
const replayedEnd = await runtime.endTurn(token1, {observation_token: 'stale-but-deduped', request_id: 'end-0-1'});
assert.deepEqual(replayedEnd, firstEnd);
assert.equal(runtime.simulation.activePlayer, 2);
await rejects(() => runtime.endTurn(token1, {observation_token: firstView.observation_token, request_id: 'end-0-1', force: true}), 'request_conflict');
const secondView = await runtime.observe(token2);
await runtime.endTurn(token2, {observation_token: secondView.observation_token, request_id: 'end-0-2'});
assert.equal(runtime.game.turn, 2);
assert.equal(runtime.simulation.activePlayer, 1);
check('request ids make end-turn retry safe and one lap settles once');

for (let round = 1; round < 10; round++) {
  for (const seat of [1, 2]) {
    assert.equal(runtime.simulation.activePlayer, seat);
    const view = await runtime.observe(seat === 1 ? token1 : token2);
    await runtime.endTurn(seat === 1 ? token1 : token2, {observation_token: view.observation_token, request_id: `end-${round}-${seat}`});
  }
  assert.equal(runtime.game.turn, round + 2);
  console.log(`round ${round + 1} turn ${runtime.game.turn}`);
}
assert.equal(runtime.game.turn, 11);
assert.equal(runtime.game.players[1].driver.calls, 0);
assert.equal(runtime.game.players[2].driver.calls, 0);
assert.ok(runtime.game.players[0].driver.calls > 0);
assert.ok(runtime.game.players[3].driver.calls > 0);
assert.equal(runtime.game.winner, null);
check('ten rounds alternate the two agents and do not call their drivers');

const record = runtime.replayRecord();
const replayed = await MatchRuntime.replay(record, stubExecute);
assert.equal(replayed.gameplayHash(), record.gameplayHash);
assert.equal(replayed.game.turn, 11);
check('replay reproduces the gameplay hash');

console.log('Creating the forfeit match...');
const doomed = await MatchRuntime.create({
  profile: 'benchmark',
  players: 2,
  size: 'small',
  seed: 'ENV-FORFEIT',
  barbarians: false,
  seats: [{seat: 0, kind: 'agent', displayName: 'Solo', agentId: 'solo'}],
  execute: stubExecute,
  prepareObservation: nativeObservation
});
assert.equal(doomed.simulation.activePlayer, 0);
const beforeForfeit = doomed.game.players[0].driver.calls;
await doomed.forfeit(doomed.hostToken, 0);
assert.equal(doomed.game.players[0].controller.kind, 'inactive');
assert.equal(doomed.game.players[0].driver.calls, beforeForfeit);
assert.equal(doomed.game.players[0].driver.failures, 0);
assert.equal(doomed.game.turn, 2);
assert.equal(doomed.game.settings.playMode, 'turns');
assert.equal(doomed.game.players[1].driver.calls > 0, true);
await rejects(() => doomed.act(doomed.connectionCard().seats[0].token, {action: {type: 'research', item: 'mining'}}), 'stale_controller');
check('forfeit skips the built-in AI and invalidates the old seat token');

console.log('ENVIRONMENT CHECK PASSED');
