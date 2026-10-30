import assert from 'node:assert/strict';
import {writeFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as R from '../src/rules.mjs';
import {replacementFor} from '../src/unique-content.mjs';
import * as W from '../src/warfare.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {RealtimeSimulation} from '../src/realtime.mjs';
import {tilesInRange, neighbors} from '../src/world.mjs';

const pool = new NativeDriverPool(), checks = [], failures = [], metrics = {};
const saveUrl = new URL('../saves/autosave.json', import.meta.url);
const saveHash = createHash('sha256').update(await readFile(saveUrl)).digest('hex');
function field() {
  const g = E.createGame({players: 2, size: 'small', seed: 'AI-COORDINATION', barbarians: false});
  g.units = [];
  for (const t of g.map.tiles) Object.assign(t, {terrain: 'grass', hill: false, feature: null, resource: null, improvement: null, district: null, cityId: null, territoryCity: null, owner: null, river: false, riverEdges: [], camp: false, ruin: false});
  const tile = (x, y) => g.map.tiles[y * g.map.width + x];
  for (const p of g.players) Object.assign(p, {manual: true, gold: 2000, techs: Object.keys(R.TECHS), civics: ['empire', 'training', 'civilservice'], met: [1 - p.id]});
  const p = g.players[0], q = g.players[1];
  const cities = [10, 17, 24].map(x => E.foundCity(g, p, E.addUnit(g, 0, 'settler', tile(x, 12).id)));
  for (const c of cities) c.population = 6;
  Object.assign(tile(9,12),{owner:0,resource:'oil',improvement:'well'});
  const enemy = E.foundCity(g, q, E.addUnit(g, 1, 'settler', tile(17, 19).id));
  g.units = []; g.turn = 30;
  const sim = new RealtimeSimulation(g);
  see(g);
  return {g, p, q, cities, enemy, tile, sim};
}
function see(g) {
  E.refreshVisibility(g);
  for (const p of g.players) {
    p.visible = g.map.tiles.map(t => t.id); p.explored = [...p.visible];
    p.knownTiles = Object.fromEntries(g.map.tiles.map(t => [t.id, structuredClone(t)]));
    p.knownCities = Object.fromEntries(g.cities.map(c => [c.id, {id: c.id, owner: c.owner, name: c.name, tile: c.tile}]));
  }
}
async function decide(g, p, file, filter) {
  p.driver.file = file;
  const obs = E.observation(g, p);
  if (filter) obs.legalActions = obs.legalActions.filter(filter);
  return (await pool.execute(p, obs)).orders;
}
async function check(name, fn) {
  try { await fn(); checks.push(name); console.log('PASS ' + name); }
  catch (e) { failures.push({name, error: e.message}); console.log('FAIL ' + name + ': ' + e.message); }
}
try {
  await check('Pending civilian production consumes all eight native population and worker budgets', async () => {
    for (const civ of R.CIVS) {
      const {g, p, cities, sim} = field();
      try {
        E.applyAction(g, p, {type: 'produce', city: cities[0].id, item: 'settler'});
        E.applyAction(g, p, {type: 'produce', city: cities[1].id, item: 'builder'});
        const orders = await decide(g, p, civ.file, a => a.type === 'produce' && ['settler', 'builder'].includes(a.item));
        assert.equal(orders.length, 0, civ.file + ' must account for the existing civilian pipelines');
      } finally { sim.dispose(); }
    }
  });
  await check('One breached-city shortage reserves one actual land recruitment per native batch', async () => {
    metrics.capturers = [];
    for (const civ of R.CIVS) {
      const {g, p, q, enemy, sim} = field();
      try {
        W.beginWar(g, p, q, E.event); enemy.hp = 0; enemy.walls = 0; see(g);
        for (const city of g.cities.filter(c => c.owner === p.id)) E.applyAction(g, p, {type: 'produce', city: city.id, item: 'granary'});
        const orders = await decide(g, p, civ.file, a => a.type === 'produce');
        const recruits = orders.filter(a => R.UNITS[a.item] && R.occupationUnit(a.item) && (R.UNITS[a.item].domain || 'land') === 'land');
        assert.equal(recruits.length, 1, civ.file + ' must reserve the local occupation shortage');
        for (const a of orders) E.applyAction(g, p, a);
        assert(!E.observation(g, p).legalActions.some(a => a.type === 'produce' && a.hint.captureNeeded));
        metrics.capturers.push({driver: civ.file, item: recruits[0].item});
      } finally { sim.dispose(); }
    }
  });
  await check('New native fortress training selects a free deployment cell', async () => {
    for (const civ of R.CIVS) {
      const {g, p, cities, tile, sim} = field(), home = cities[0];
      try {
        // This placement fixture needs real income for its modern recruitment.
        for (const city of cities) city.buildings.push('commercial', 'market', 'bank', 'exchange');
        const occupied = tile(11, 12), free = tile(10, 14);
        for (const t of [occupied, free]) Object.assign(t, {owner: 0, territoryCity: home.id, fort: {owner: 0, hp: 160}});
        E.addUnit(g, 0, 'warrior', occupied.id); see(g);
        const orders = await decide(g, p, civ.file, a => a.type === 'produce' && a.city === home.id && a.hint.military && a.hint.domain === 'land');
        assert.equal(orders[0]?.fortress, free.id, civ.file + ' must avoid the occupied nearest fortress');
      } finally { sim.dispose(); }
    }
  });
  await check('Independent visible occupation fronts retain separate recruitment budgets', async () => {
    for (const civ of R.CIVS) {
      const {g, p, q, enemy, tile, sim} = field();
      try {
        const rear = E.foundCity(g, p, E.addUnit(g, 0, 'settler', tile(38, 5).id)); rear.population = 6;
        const second = E.foundCity(g, q, E.addUnit(g, 1, 'settler', tile(38, 12).id));
        g.units = []; W.beginWar(g, p, q, E.event);
        for (const c of [enemy, second]) { c.hp = 0; c.walls = 0; }
        for (const c of g.cities.filter(c => c.owner === 0)) E.applyAction(g, p, {type: 'produce', city: c.id, item: 'granary'});
        see(g);
        const orders = await decide(g, p, civ.file, a => a.type === 'produce');
        assert.equal(orders.length, 2, civ.file + ' must cover both distant fronts');
        assert(orders.some(a => a.city === rear.id));
      } finally { sim.dispose(); }
    }
  });
  await check('Hidden breaches cannot create recruitment hints and threatened fortress guards do not yield', async () => {
    const {g, p, q, cities, enemy, tile, sim} = field(), home = cities[0];
    try {
      W.beginWar(g, p, q, E.event); enemy.hp = 0; enemy.walls = 0; see(g);
      p.visible = p.visible.filter(id => id !== enemy.tile);
      assert(!E.observation(g, p).legalActions.some(a => a.type === 'produce' && a.hint.captureTargets.length));
      const fort = tile(11, 12);
      Object.assign(fort, {owner: 0, territoryCity: home.id, fort: {owner: 0, hp: 160}});
      p.techs=p.techs.filter(k=>!['ballistics','steel','rocketry','advballistics'].includes(k));E.applyAction(g, p, {type: 'produce', city: home.id, item: replacementFor(p,'crossbow'), fortress: fort.id});
      home.production.progress = E.orderCost(g, home);
      const ids = new Set([fort.id, ...tilesInRange(g.map, fort, 2).filter(t => t.owner === 0).map(t => t.id)]);
      for (const id of ids) E.addUnit(g, 0, 'warrior', id);
      const guard = g.units.find(u => neighbors(g.map, g.map.tiles[u.tile]).some(t => !ids.has(t.id)));
      see(g);
      assert(E.observation(g, p).legalActions.some(a => a.unit === guard.id && a.hint?.trafficYield));
      const adjacent = neighbors(g.map, g.map.tiles[guard.tile]).find(t => !ids.has(t.id));
      const attacker = E.addUnit(g, 1, 'warrior', adjacent.id); see(g);
      assert(!E.observation(g, p).legalActions.some(a => a.unit === guard.id && a.hint?.trafficYield));
      attacker.type = 'artillery';
      attacker.tile = g.map.tiles.find(t => !ids.has(t.id) && R.dist(t, g.map.tiles[guard.tile]) === 3).id;
      see(g);
      assert(!E.observation(g, p).legalActions.some(a => a.unit === guard.id && a.hint?.trafficYield));
      g.units = g.units.filter(u => u !== attacker);
      const oldTile = enemy.tile; g.map.tiles[oldTile].cityId = null;
      enemy.tile = adjacent.id; g.map.tiles[adjacent.id].cityId = enemy.id; g.map.tiles[adjacent.id].owner = 1;
      enemy.walls = 100; enemy.buildings.push('walls'); see(g);
      assert(!E.observation(g, p).legalActions.some(a => a.unit === guard.id && a.hint?.trafficYield));
    } finally { sim.dispose(); }
  });
  await check('A safe own garrison yields through timed movement and completed training actually deploys', async () => {
    for (const civ of R.CIVS) {
      const {g, p, cities, tile, sim} = field(), home = cities[0];
      try {
        const fort = tile(11, 12);
        Object.assign(fort, {owner: 0, territoryCity: home.id, fort: {owner: 0, hp: 160}});
        p.techs=p.techs.filter(k=>!['ballistics','steel','rocketry','advballistics'].includes(k));E.applyAction(g, p, {type: 'produce', city: home.id, item: replacementFor(p,'crossbow'), fortress: fort.id});
        home.production.progress = E.orderCost(g, home);
        const cells = [fort, ...tilesInRange(g.map, fort, 2).filter(t => t.owner === 0)];
        const ids = new Set(cells.map(t => t.id));
        for (const id of ids) E.addUnit(g, 0, 'warrior', id);
        const blocker = g.units.find(u => neighbors(g.map, g.map.tiles[u.tile]).some(t => !ids.has(t.id)));
        blocker.hp = 65; blocker.fortified = true; see(g);
        const orders = await decide(g, p, civ.file, a => a.unit === blocker.id);
        assert.equal(orders[0]?.type, 'move', civ.file + ' must clear a completed recruitment cell');
        sim.enqueue(p, orders);
        for (let i = 0; i < 84; i++) sim.tick(.25);
        assert(!ids.has(blocker.tile));
        assert(g.units.some(u => u.type === replacementFor(p,'crossbow') && ids.has(u.tile)));
        assert.equal(home.production, null);
      } finally { sim.dispose(); }
    }
  });
  assert.equal(createHash('sha256').update(await readFile(saveUrl)).digest('hex'), saveHash);
  const report = {passed: failures.length === 0, checks, failures, metrics, activeSaveWritten: false, gameLaunched: false, saveHash};
  await writeFile(new URL('../output/ai-coordination-checks.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  if (failures.length) process.exitCode = 1;
} finally { pool.dispose(); }
