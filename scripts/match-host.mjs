// Isolated match host. It never binds the desktop game port and never writes production saves.
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';
import {NativeDriverPool} from '../src/driver-pool.mjs';
import {ObservationPool} from '../src/observation-pool.mjs';

function args(argv) {
  const options = {profile: 'interactive', players: 4, size: 'small', native: false, port: 0, seats: [], barbarians: false};
  for (let index = 2; index < argv.length; index++) {
    const key = argv[index];
    if (key === '--native') {options.native = true; continue;}
    if (key === '--barbarians') {options.barbarians = true; continue;}
    const value = argv[++index];
    if (key === '--profile') options.profile = value;
    else if (key === '--players') options.players = Number(value);
    else if (key === '--size') options.size = value;
    else if (key === '--seed') options.seed = value;
    else if (key === '--port') options.port = Number(value);
    else if (key === '--card') options.card = value;
    else if (key === '--seat') {
      const parsed = /^(\d+)=(human|agent|native|inactive)(?::([^:]*))?(?::([A-Za-z0-9_-]+))?$/.exec(value || '');
      if (!parsed) throw new Error('Seat format is 1=agent:Grok:grok');
      options.seats.push({seat: Number(parsed[1]), kind: parsed[2], displayName: parsed[3] || null, agentId: parsed[4] || null});
    } else throw new Error('Unknown argument ' + key);
  }
  if (!options.seats.length) options.seats.push({seat: 1, kind: 'agent', displayName: 'Agent', agentId: 'agent'});
  if (options.port === 43821) throw new Error('Refusing the desktop game port 43821.');
  return options;
}

const options = args(process.argv);
const pool = options.native ? new NativeDriverPool() : null;
const observations = options.native ? new ObservationPool(2) : null;
const runtime = await MatchRuntime.create({
  profile: options.profile,
  players: options.players,
  size: options.size,
  seed: options.seed,
  barbarians: options.barbarians,
  seats: options.seats,
  execute: pool ? (player, observation) => pool.execute(player, observation) : async () => ({orders: [], memory: null, ms: 0, stderr: ''}),
  prepareObservation: observations ? (game, player) => observations.prepare(game, player) : async () => ({player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}})
});
const host = await listen(runtime, {port: options.port});
const card = {...runtime.connectionCard(), url: host.url};
if (options.card) {
  await mkdir(path.dirname(options.card), {recursive: true});
  await writeFile(options.card, JSON.stringify(card, null, 2));
}
console.error(`Match host ready at ${host.url}`);
console.log(JSON.stringify(card, null, 2));
function shutdown() {
  host.server.close();
  pool?.dispose();
  observations?.dispose();
}
process.on('SIGINT', () => {shutdown(); process.exit(0);});
process.on('SIGTERM', () => {shutdown(); process.exit(0);});
