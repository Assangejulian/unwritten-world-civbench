import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const empty = {player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}};
await assert.rejects(() => listen({}, {port: 43821}), /43821/);

const runtime = await MatchRuntime.create({
  profile: 'benchmark',
  players: 2,
  size: 'small',
  seed: 'HTTP-CHECK',
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

async function call(token, path, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(host.url + path, {method, headers: {...(token ? {Authorization: 'Bearer ' + token} : {}), 'Content-Type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body)});
  return {status: response.status, json: await response.json()};
}

const open = await call(null, '/health');
assert.equal(open.status, 200);
assert.equal(open.json.service, 'match-host');
const denied = await call(null, '/v1/session');
assert.equal(denied.status, 401);
const badHost = await new Promise(resolve => {
  const request = http.request({hostname: '127.0.0.1', port: host.port, path: '/health', headers: {host: '127.0.0.1:1'}}, response => {response.resume(); resolve(response.statusCode);});
  request.end();
});
assert.equal(badHost, 403);

const first = await call(seat0, '/v1/session');
assert.equal(first.status, 200);
assert.equal(first.json.seat, 0);
assert.equal(first.json.yourTurn, true);
const hidden = await call(seat0, '/v1/connection');
assert.equal(hidden.status, 403);
const seen = await call(seat0, '/v1/observe', {section: 'summary'});
assert.equal(seen.status, 200);
assert.equal(JSON.stringify(seen.json).includes('HTTP-CHECK'), false);
const other = await call(seat1, '/v1/act', {observation_token: (await call(seat1, '/v1/observe', {section: 'summary'})).json.observation_token, action: {type: 'research', item: 'mining'}});
assert.equal(other.json.code, 'out_of_turn');
const state = await call(seat0, '/api/state?view=1');
assert.equal(state.status, 200);
assert.equal(state.json.game.environment.seat, 0);
assert.equal(state.json.game.seed, null);
assert.equal(state.json.session.role, 'seat');
const observer = await call(card.observerToken, '/api/state?view=-1');
assert.equal(observer.status, 200);
assert.equal(observer.json.session.controllers.find(item => item.seat === 1).displayName, 'Other');
const blocked = await call(card.observerToken, '/api/action', {action: {type: 'research', item: 'mining'}});
assert.equal(blocked.status, 403);

const fresh = await call(seat0, '/v1/observe', {section: 'summary'});
const ended = await call(seat0, '/v1/end-turn', {observation_token: fresh.json.observation_token, request_id: 'http-end-0'});
assert.equal(ended.status, 200);
assert.equal(ended.json.activePlayer, 1);
const again = await call(seat0, '/v1/end-turn', {observation_token: 'stale', request_id: 'http-end-0'});
assert.equal(again.status, 200);
assert.deepEqual(again.json, ended.json);
const second = await call(seat1, '/v1/observe', {section: 'summary'});
const finished = await call(seat1, '/v1/end-turn', {observation_token: second.json.observation_token, request_id: 'http-end-1'});
assert.equal(finished.json.turn, 2);
assert.equal(finished.json.activePlayer, 0);

const cli = spawn(process.execPath, ['scripts/environment-cli.mjs', 'session'], {env: {...process.env, CIV_MATCH_URL: host.url, CIV_MATCH_TOKEN: seat0}, cwd: ROOT});
let cliOut = '';
cli.stdout.on('data', chunk => {cliOut += chunk;});
const cliCode = await new Promise(resolve => cli.on('exit', resolve));
assert.equal(cliCode, 0);
assert.equal(JSON.parse(cliOut).seat, 0);

await new Promise(resolve => host.server.close(resolve));
console.log('HTTP CHECK PASSED');
