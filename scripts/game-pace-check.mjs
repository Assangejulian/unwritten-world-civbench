import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import * as E from '../src/engine.mjs';
import {GAME_SPEEDS, gamePace, researchCost, productionCost, purchaseCost, cityGrowth, unitMovement} from '../src/rules.mjs';
import {agePeriods} from '../src/ages.mjs';
import {greatPersonCandidate, recruitmentTerms} from '../src/heritage.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';

const results = [];
const reference = E.createGame({players: 2, size: 'small', seed: 'PACE-CHECK', barbarians: false, gameSpeed: 'standard'});
reference.turn = 121;
const nearScaled = (actual, expected, label, rounding = 2) => assert.ok(Math.abs(actual - expected) <= rounding, `${label}: ${actual} vs ${expected}`);
for (const [key, pace] of Object.entries(GAME_SPEEDS)) {
  const game = E.createGame({players: 2, size: 'small', seed: 'PACE-CHECK', barbarians: false, gameSpeed: key});
  assert.equal(game.maxTurns, pace.maxTurns);
  game.turn = 1 + 120 * pace.factor;
  assert.ok(Number.isInteger(game.turn));
  assert.equal(gamePace(game).factor, pace.factor);
  for (const tech of ['mining', 'writing', 'computers']) nearScaled(researchCost(game, tech), researchCost(reference, tech) * pace.factor, key + '/' + tech);
  for (const civic of ['code', 'empire']) nearScaled(researchCost(game, civic, true), researchCost(reference, civic, true) * pace.factor, key + '/' + civic);
  for (const item of ['warrior', 'granary', 'campus', 'pyramids', 'satellite']) {
    assert.ok(productionCost(reference, item) > 0, item + ' must be a real production key');
    nearScaled(productionCost(game, item), productionCost(reference, item) * pace.factor, key + '/' + item);
  }
  nearScaled(purchaseCost(game, 'warrior'), purchaseCost(reference, 'warrior') * pace.factor, key + '/purchase', 5 * Math.max(1, pace.factor));
  const city = {owner: 0, population: 3, food: 0}, yields = {netFood: 5, housing: 10};
  assert.equal(cityGrowth(game, city, yields).capacity, cityGrowth(reference, city, yields).capacity * pace.factor);
  assert.equal(agePeriods(game), Math.round(60 * pace.factor));
  const candidate = greatPersonCandidate(game, 'scientist');
  assert.ok(candidate);
  nearScaled(recruitmentTerms(game, game.players[0], candidate.key).threshold, recruitmentTerms(reference, reference.players[0], candidate.key).threshold * pace.factor, key + '/great-person');
  const unit = game.units.find(unit => unit.owner === 0 && unit.type === 'warrior');
  const originalUnit = reference.units.find(unit => unit.owner === 0 && unit.type === 'warrior');
  assert.equal(unitMovement(unit, game.players[0]), unitMovement(originalUnit, reference.players[0]));
  assert.ok(game.encounters.nextCampTurn - 1 >= Math.max(1, Math.round(18 * pace.factor)));
  assert.ok(game.encounters.nextCampTurn - 1 <= Math.round(30 * pace.factor));
  const restored = E.restore(E.serialize(game));
  assert.equal(restored.settings.gameSpeed, key);
  assert.equal(restored.maxTurns, game.maxTurns);
  results.push({key, factor: pace.factor, defaultRounds: pace.maxTurns, passed: true});
}
const runtime = await MatchRuntime.create({players: 2, size: 'small', seed: 'PACE-ENV', gameSpeed: 'blitz', maxTurns: 200, barbarians: false, seats: [{seat: 0, kind: 'agent', displayName: 'Pace test'}]});
assert.equal(runtime.game.maxTurns, 200);
const card = runtime.connectionCard(), token = card.seats[0].token;
const session = await runtime.session(token);
assert.equal(session.pace.factor, .25);
assert.equal(session.maxTurns, 200);
const self = runtime.game.players[0];
const foreignTile = runtime.game.map.tiles.find(tile => self.visible.includes(tile.id) && !['ocean', 'coast', 'mountain'].includes(tile.terrain) && !runtime.game.units.some(unit => unit.tile === tile.id));
E.addUnit(runtime.game, 1, 'warrior', foreignTile.id);
E.refreshVisibility(runtime.game);
const observed = await runtime.observe(token);
assert.equal(observed.value.counts.ownUnits, runtime.game.units.filter(unit => unit.owner === 0).length);
assert.ok(observed.value.counts.visibleUnits > observed.value.counts.ownUnits);
const observer = await runtime.observe(card.observerToken);
assert.equal(observer.value.counts.ownUnits, null);
await mkdir(new URL('../output/game-pace-20261027/', import.meta.url), {recursive: true});
await writeFile(new URL('../output/game-pace-20261027/rules.json', import.meta.url), JSON.stringify({passed: true, profiles: results, customRoundLimit: 200, ownershipCounts: true, productionSavesWritten: false}, null, 2));
console.log('PASS six pace profiles, equivalent-age costs, growth, great people, eras, encounters, unchanged movement, save restore, custom score limit and private ownership counts');
