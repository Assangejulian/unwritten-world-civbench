// Real Grok-model play against native C++ opponents on an isolated host.
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Lobby} from '../src/environment/lobby.mjs';
import {listDrivers} from '../src/drivers.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {serialize} from '../src/engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv[2] === '--verify') {
  const output = path.resolve(root, process.argv[3] || 'output/grok-50-rounds-20261020-attempt2');
  const status = JSON.parse(readFileSync(path.join(output, 'status.json'), 'utf8'));
  const run = JSON.parse(readFileSync(path.join(output, 'run.json'), 'utf8'));
  const record = JSON.parse(readFileSync(path.join(output, 'replay.json'), 'utf8'));
  assert.equal(status.state, 'completed');
  assert.equal(status.completed, run.target);
  const commands = record.commands.filter(command => command.seat === status.seat);
  const turns = commands.filter(command => command.kind === 'end-turn' && command.status === 'applied');
  assert.equal(turns.length, run.target);
  const transcript = readFileSync(path.join(run.directory, 'transcript.jsonl'), 'utf8').split('\n').flatMap(line => {try {return [JSON.parse(line)];} catch {return [];}});
  const calls = transcript.filter(event => event.type === 'tool_call');
  const used = calls.filter(event => event.toolName === 'use_tool');
  const rpcErrors = new Map();
  for (const event of transcript.filter(event => event.type === 'tool_call_update')) {
    const output = event.rawOutput?.output;
    const text = output?.Error ?? output?.ErrorOutput ?? output?.OkayOutput;
    if (typeof text !== 'string') continue;
    let result; try {result = JSON.parse(text);} catch {continue;}
    if (result.error || result.code || result.status === 'rejected') rpcErrors.set(event.toolCallId, {code: result.code || 'action_rejected', error: result.error || null});
    for (const rejected of result.results || []) if (rejected.status === 'rejected') rpcErrors.set(`${event.toolCallId}:${rejected.request_id}`, {code: rejected.code || 'action_rejected', error: rejected.error || null});
  }
  assert.ok(used.some(event => event.rawInput?.tool_name?.endsWith('__game_session')));
  assert.ok(used.some(event => event.rawInput?.tool_name?.endsWith('__game_end_turn')));
  assert.ok(used.every(event => event.rawInput?.tool_name?.startsWith(`hex_seat_${status.seat}__`)));
  assert.ok(calls.every(event => ['search_tool', 'use_tool', 'todo_write'].includes(event.toolName)));
  const replayed = await MatchRuntime.replay(record, async () => {throw new Error('Replay must consume recorded native decisions, not generate new ones.');});
  assert.equal(replayed.gameplayHash(), record.gameplayHash);
  assert.equal(replayed.game.players[status.seat].driver.calls, 0);
  const natives = replayed.game.players.filter(player => player.controller.kind === 'native').map(player => ({seat: player.id, calls: player.driver.calls, failures: player.driver.failures}));
  assert.ok(natives.every(player => player.calls > 0 && player.failures === 0));
  const actions = commands.filter(command => command.kind === 'act' && command.status === 'applied');
  const byType = {};
  for (const command of actions) byType[command.action.type] = (byType[command.action.type] || 0) + 1;
  assert.ok(byType.found > 0 && byType.produce > 0 && byType.research > 0 && byType.civic > 0);
  const result = {actualModelPlay: true, completed: turns.length, target: run.target, matchTurn: replayed.game.turn, appliedActions: actions.length,
    rejectedActions: commands.filter(command => command.status === 'rejected').length, rpcErrors: [...rpcErrors.values()], actionsByType: byType, toolCalls: calls.length,
    nativeOpponents: natives, grokNativeCalls: 0, replayHashMatches: true, gameplayHash: record.gameplayHash,
    cities: replayed.game.cities.filter(city => city.owner === status.seat).length, units: replayed.game.units.filter(unit => unit.owner === status.seat).length,
    techs: replayed.game.players[status.seat].techs, civics: replayed.game.players[status.seat].civics, startedAt: run.startedAt, endedAt: status.endedAt};
  writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
  writeFileSync(path.join(output, 'verified-final-save.json'), serialize(replayed.game));
  const dialogue = transcript.filter(event => event.type === 'text').map(event => event.data || '').join('');
  writeFileSync(path.join(output, 'grok-visible-dialogue.txt'), dialogue);
  writeFileSync(path.join(output, 'REPORT.md'), `# Grok ${run.target}-turn model playtest\n\nActual Grok MCP play completed ${turns.length}/${run.target} turns, stopping at the start of world turn ${replayed.game.turn}. This is not a reference-client simulation.\n\nApplied actions: ${actions.length}. Rejected actions: ${result.rejectedActions}. RPC errors: ${rpcErrors.size}. Cities: ${result.cities}. Units: ${result.units}.\n\nActions by type: ${JSON.stringify(byType)}.\n\nReal native opponents: ${JSON.stringify(natives)}. Grok's own native-driver calls: 0.\n\nIndependent replay hash matched the original without generating fresh native decisions. All observed model tool calls were game MCP discovery/use or the harmless task list. No terminal, file, browser, web-search or other-server gameplay calls were observed.\n\nThis single ancient-era match does not validate every game action, later-era systems, full UI parity or overall strategic strength.\n`);
  replayed.simulation.dispose();
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
const target = Number(process.argv[2] || 50);
const out = path.join(root, process.argv[3] || 'output/grok-50-rounds-20261020');
mkdirSync(out, {recursive: true});
const ready = (await listDrivers()).filter(driver => driver.status === 'ready');
if (!ready.length) throw new Error('No ready native C++ drivers.');
const lobby = new Lobby();
await lobby.prepare({players: 4, size: 'small', playMode: 'turns', seed: 'GROK-FIFTY-20261020', barbarians: true,
  drivers: Array.from({length: 4}, (_, index) => ready[index % ready.length].file),
  seats: Array.from({length: 4}, (_, seat) => seat === 1 ? {seat, kind: 'agent', displayName: 'Grok', agentId: 'grok-playtest'} : {seat, kind: 'native'})});
const launched = await lobby.launcher.start(lobby, {seat: 1, rounds: target});
const privateCard = {url: lobby.url, observerUrl: `${lobby.url}/?access=${lobby.runtime.observerToken}`};
writeFileSync(path.join(out, 'observer-private.json'), JSON.stringify(privateCard, null, 2), {mode: 0o600});
await lobby.start({waitPolicy: 'wait', observer: true});
writeFileSync(path.join(out, 'run.json'), JSON.stringify({pid: process.pid, runId: launched.id, directory: lobby.launcher.runs.get(1).directory, startedAt: new Date().toISOString(), target}, null, 2));
console.log(`Real Grok match started: ${launched.id}, ${target} turns, four civilizations, real native opponents.`);
let previous = -1;
const timer = setInterval(async () => {
  const status = lobby.launcher.status(1);
  const commands = lobby.runtime.commands.filter(command => command.seat === 1);
  const report = {...status, matchTurn: lobby.runtime.game.turn, activePlayer: lobby.runtime.simulation.activePlayer,
    actionsApplied: commands.filter(command => command.kind === 'act' && command.status === 'applied').length,
    actionsRejected: commands.filter(command => command.status === 'rejected').length,
    cities: lobby.runtime.game.cities.filter(city => city.owner === 1).length,
    alive: lobby.runtime.game.players[1].alive,
    nativeCalls: lobby.runtime.game.players.filter(player => player.controller?.kind === 'native').reduce((total, player) => total + (player.driver?.calls || 0), 0)};
  writeFileSync(path.join(out, 'status.json'), JSON.stringify(report, null, 2));
  if (status.completed !== previous) {console.log(`Grok progress ${status.completed}/${target}; match turn ${report.matchTurn}; cities ${report.cities}`); previous = status.completed;}
  if (!['starting', 'running'].includes(status.state)) {
    clearInterval(timer);
    writeFileSync(path.join(out, 'replay.json'), JSON.stringify(lobby.runtime.replayRecord()));
    writeFileSync(path.join(out, 'seat-commands.json'), JSON.stringify(commands, null, 2));
    console.log(`Match stopped: ${status.state}; ${status.completed}/${target}; ${status.error || ''}`);
    lobby.dispose();
    process.exitCode = status.state === 'completed' ? 0 : 1;
    setTimeout(() => process.exit(process.exitCode), 1500).unref();
  }
}, 1000);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {clearInterval(timer); lobby.dispose(); process.exit(1);});
