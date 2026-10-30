// Regression cases from the two real MCP players; no production saves are touched.
import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';
import {cityStateOwner} from '../src/city-states.mjs';
import {TECHS} from '../src/rules.mjs';
import {congressPlayerActions, congressActions, castCongressVote, extraVoteCost} from '../src/congress.mjs';
import {pageSummary, readSection, summarize, cleanActions} from '../src/environment/projection.mjs';
import {GameSimulation} from '../src/turns.mjs';
import {playerTasks} from '../src/player-tasks.mjs';
import {field} from './imperial-fixture.mjs';

{
  const g = E.createGame({players: 2, size: 'small', seed: 'CAPTURE-SAVE-REGRESSION'});
  const state = g.cityStates.states[0]; assert.ok(state);
  const unit = g.units.find(u => u.owner === 0);
  unit.capturedFrom = cityStateOwner(state.id); unit.captureTurn = g.turn;
  assert.equal(E.restore(E.serialize(g)).units.find(u => u.id === unit.id).capturedFrom, unit.capturedFrom);
  // Historical provenance remains valid after the city-state is annexed.
  state.capturedBy = 1;
  assert.doesNotThrow(() => E.restore(E.serialize(g)));
  for (const invalid of [-9999, 9999, 0.5, '0']) {
    const bad = JSON.parse(E.serialize(g)); bad.units.find(u => u.id === unit.id).capturedFrom = invalid;
    assert.throws(() => E.restore(JSON.stringify(bad)), /Invalid civilian capture record/);
  }
  state.capturedBy = null;
  const trained = E.addUnit(g, cityStateOwner(state.id), 'archer', unit.tile);
  trained.cityState = state.id;
  trained.level = 1; trained.xp = 25; trained.veteranTraits = ['assault'];
  assert.equal(E.restore(E.serialize(g)).units.find(u => u.id === trained.id).veteranTraits[0], 'assault');
  trained.veteranTraits = ['assault', 'bastion'];
  assert.throws(() => E.restore(E.serialize(g)), /Invalid veteran training/);
  console.log('PASS city-state capture provenance and returned levy traits round-trip without accepting invalid owners or excess traits');
}
{
  const tasks = Array.from({length: 74}, (_, i) => ({id: 'unit:' + i, kind: 'unit', unit: i}));
  tasks.push({id: 'research', kind: 'research'}, {id: 'prod', kind: 'production', city: 1});
  const projected = {turn: 84, maxTurns: 240, settings: {gameSpeed: 'blitz'}, playerTasks: {tasks}};
  const summary = summarize(projected), original = JSON.stringify(summary), collected = [];
  let cursor = 0;
  do {
    const page = readSection(projected, 'summary', cursor, 6).value;
    assert.ok(page.tasks.length <= 6);
    assert.equal(page.tasksPage.counts.unit, 74);
    assert.equal(page.tasksPage.total, 76);
    collected.push(...page.tasks); cursor = page.tasksPage.next;
  } while (cursor !== null);
  assert.deepEqual(collected, summary.tasks);
  assert.equal(collected[0].kind, 'research');
  assert.deepEqual(readSection(projected, 'tasks', 6, 6).items, summary.tasks.slice(6, 12));
  assert.equal(pageSummary(summary).tasks.length, 12);
  assert.equal(JSON.stringify(summary), original);
  assert.equal(summary.pace.maxTurns, 240); assert.equal(summary.pace.defaultMaxTurns, 163);
  console.log('PASS bounded summary pages preserve every prioritized task and report the actual custom turn limit');
}
{
  const {g, p, q} = field();
  g.congress.current = {id: 1, closesTurn: g.turn + 4, participants: [p.id, q.id], weights: {[p.id]: 2, [q.id]: 1}, agenda: [{topic: 'trade', ballots: {}}, {topic: 'leadership', ballots: {}}]};
  p.diplomaticFavor = 30;
  const actions = congressPlayerActions(g, p);
  assert.ok(actions.some(a => a.choice === 'oppose' && a.extra === 2));
  assert.ok(actions.some(a => a.choice === 'lose' && a.target === q.id));
  assert.ok(actions.some(a => a.choice === 'gain' && a.target === p.id));
  assert.equal(actions.filter(a => a.choice === 'abstain').length, 2);
  assert.equal(congressActions(g, p).length, 2, 'Native recommendations remain a shortlist');
  for (const action of actions) {
    assert.equal(action.hint.currency, 'diplomaticFavor');
    assert.equal(action.hint.favorCost, extraVoteCost(action.extra));
    const gold = p.gold, balance = p.diplomaticFavor;
    castCongressVote(g, p, action);
    assert.equal(p.diplomaticFavor, balance - action.hint.favorCost); assert.equal(p.gold, gold);
    delete g.congress.current.agenda.find(a => a.topic === action.topic).ballots[p.id]; p.diplomaticFavor = balance;
  }
  const projected = cleanActions(g, p).filter(a => a.type === 'voteCongress');
  assert.equal(projected.length, actions.length);
  assert.equal(projected[0].preview.currency, 'diplomaticFavor');
  g.congress.current.agenda[0].ballots[p.id] = {choice: 'abstain', extra: 0, cost: 0};
  assert.ok(congressPlayerActions(g, p).every(a => a.topic !== 'trade'));
  console.log('PASS every affordable congress vote, side and public target executes with the advertised diplomatic-favor cost');
}
{
  const {g, p, home} = field();
  p.techs = Object.keys(TECHS);
  assert.ok(!E.productionOptions(g, p, home).some(a => a.item === 'bank'));
  const before = E.serialize(g);
  assert.throws(() => E.applyAction(g, p, {type: 'produce', city: home.id, item: 'bank'}), /需要前置建筑：市场/);
  assert.equal(E.serialize(g), before);
  console.log('PASS missing production prerequisites are filtered and explain the missing building without applying the command');
}
{
  const {g, p, tile} = field();
  const u = E.addUnit(g, p.id, 'warrior', tile(8, 8).id);
  const sim = new GameSimulation(g);
  try {
    assert.ok(cleanActions(g, p).some(a => a.type === 'alert' && a.unit === u.id));
    sim.command(p, {type: 'alert', unit: u.id});
    sim.beginPlayer();
    assert.equal(u.stance, 'alert'); assert.equal(u.acted, true); assert.equal(u.moves, 0);
    assert.ok(!playerTasks(g, p.id).tasks.some(t => t.unit === u.id));
    assert.ok(cleanActions(g, p).some(a => a.type === 'wake' && a.unit === u.id));
    sim.command(p, {type: 'wake', unit: u.id}); sim.beginPlayer();
    assert.ok(playerTasks(g, p.id).tasks.some(t => t.unit === u.id));
  } finally {sim.dispose();}
  console.log('PASS existing alert stays asleep across turns, suppresses routine tasks and can be explicitly woken');
}
console.log('PLAYER FEEDBACK CHECK PASSED');
