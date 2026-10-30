import auditBrowserRuntime from './browser-runtime.cjs';
// Isolated process-control, authorization and actual browser regression checks.
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {spawn} from 'node:child_process';
import {PassThrough} from 'node:stream';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {AgentLauncher, readClientCompletion} from '../src/environment/agent-launcher.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.env.UI_CHECK_OUTPUT || path.join(root, 'output/managed-agent-check-20261020'));
mkdirSync(output, {recursive: true});
const require = createRequire(import.meta.url);
const {validOperatorLink, existingOperatorLink, authorizedMatchNavigation} = require('../desktop/operator-link.cjs');
const {chromium} = auditBrowserRuntime.load('playwright');
const children = [];
const launcher = new AgentLauncher({executable: process.execPath, outputRoot: path.join(output, 'clients'), spawnClient(command, args, options) {
  const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.kill = () => {child.killed = true; child.emit('exit', 0);}; child.args = args; child.options = options;
  children.push(child); return child;
}});
const lobby = new Lobby({stub: true, launcher});
const host = await listen(null, {port: 0, lobby}); lobby.server = host.server; lobby.url = host.url;
const request = async (route, token, body = {}) => {
  const response = await fetch(host.url + route, {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`}, body: JSON.stringify(body)});
  return {status: response.status, value: await response.json()};
};
const config = {players: 2, size: 'small', seed: 'MANAGED-CHECK', barbarians: false, seats: [0,1].map(seat => ({seat, kind: 'agent', displayName: `Agent ${seat}`}))};
await lobby.prepare(config);
let browser;
try {
  const [seat0, seat1] = [lobby.runtime.seatTokens.get(0), lobby.runtime.seatTokens.get(1)];
  for (const token of ['', seat0, lobby.runtime.observerToken]) {
    for (const route of ['/api/lobby/agent/start', '/api/lobby/agent/stop']) assert.equal((await request(route, token, {seat: 1, rounds: 3})).status, 401);
  }
  assert.equal(children.length, 0);
  console.log('PASS only the operator can start or stop local model processes');
  const missing = new AgentLauncher({executable: path.join(output, 'missing-grok.exe')});
  await assert.rejects(() => missing.start(lobby, {seat: 0}), error => error.code === 'client_missing');
  const started = await request('/api/lobby/agent/start', lobby.hostCapability, {seat: 0, rounds: 3});
  assert.equal(started.status, 200);
  await request('/api/lobby/agent/start', lobby.hostCapability, {seat: 0, rounds: 3});
  assert.equal((await request('/api/lobby/agent/start', lobby.hostCapability, {seat: 0, rounds: 4})).status, 409);
  assert.equal(children.length, 1);
  let client = launcher.runs.get(0);
  const localConfig = readFileSync(path.join(client.directory, '.grok/config.toml'), 'utf8');
  assert.ok(localConfig.includes(seat0));
  for (const secret of [seat1, lobby.hostCapability, lobby.runtime.observerToken, lobby.runtime.hostToken]) assert.equal(localConfig.includes(secret), false);
  assert.equal(JSON.stringify(started.value).includes(seat0), false);
  assert.ok(children[0].args.includes('--disallowed-tools'));
  console.log('PASS one-click launch is idempotent and exports exactly one seat credential');
  await lobby.start({waitPolicy: 'wait', observer: true});
  for (let index = 0; index < 3; index++) {
    const body = {force: true, request_id: `managed-${index}`, observation_token: (await lobby.runtime.observe(seat0)).observation_token};
    await lobby.runtime.endTurn(seat0, body);
    await lobby.runtime.endTurn(seat0, body);
    assert.equal(lobby.runtime.managedPlayProgress(0).completed, index + 1);
    await lobby.runtime.endTurn(seat1, {force: true, request_id: `other-${index}`, observation_token: (await lobby.runtime.observe(seat1)).observation_token});
    if (index === 0) {
      launcher.stop(0);
      await assert.rejects(() => lobby.runtime.act(seat0, {action: {type: 'research', item: 'pottery'}}), error => error.code === 'managed_paused');
      await launcher.start(lobby, {seat: 0, rounds: 3});
      client = launcher.runs.get(0);
      assert.equal(lobby.runtime.managedPlayProgress(0).completed, 1);
    }
  }
  await assert.rejects(() => lobby.runtime.endTurn(seat0, {force: true, request_id: 'too-far'}), error => error.code === 'managed_complete');
  await assert.rejects(() => lobby.runtime.act(seat0, {action: {type: 'research', item: 'pottery'}}), error => error.code === 'managed_complete');
  launcher.tick(client);
  assert.equal(launcher.status(0).state, 'completed');
  assert.equal(children[0].killed, true);
  console.log('PASS goal counts actual seat turns, retries do not count twice, and extra actions are blocked');
  await launcher.start(lobby, {seat: 0, rounds: 3});
  const idle = launcher.runs.get(0); idle.lastActivity = Date.now() - 700000;
  launcher.tick(idle); assert.equal(launcher.status(0).state, 'failed');
  const completion = path.join(output, 'completion.jsonl');
  const event = {timestamp: Math.floor(Date.now() / 1000), params: {sessionId: 'owned', update: {sessionUpdate: 'turn_completed', stop_reason: 'cancelled'}, _meta: {cancellationCategory: 'max_turns_reached'}}};
  writeFileSync(completion, JSON.stringify(event) + '\n');
  assert.equal(readClientCompletion(completion, 'other', new Date().toISOString()), null);
  assert.equal(readClientCompletion(completion, 'owned', new Date().toISOString()).category, 'max_turns_reached');
  await launcher.start(lobby, {seat: 0, rounds: 3});
  const finishedEarly = launcher.runs.get(0); finishedEarly.sessionLog = completion; finishedEarly.sessionId = 'owned';
  launcher.tick(finishedEarly); assert.equal(launcher.status(0).state, 'failed');
  console.log('PASS reconnect preserves completed turns; missing clients, idle workers and logical CLI completion fail visibly');
  lobby.runtime.started = false;
  await lobby.cancel();
  assert.equal(validOperatorLink('http://127.0.0.1:1234/#setup=' + 'a'.repeat(48), 'http://127.0.0.1:1234/'), 'http://127.0.0.1:1234/#setup=' + 'a'.repeat(48));
  assert.equal(validOperatorLink('http://evil.example/#setup=' + 'a'.repeat(48), host.url), null);
  assert.equal(await existingOperatorLink(root, host.url, async () => ({ok: false})), null);
  const operator = `${host.url}/#setup=${lobby.hostCapability}`;
  const target = `http://127.0.0.1:12567/?access=${'a'.repeat(48)}#setup=${lobby.hostCapability}`;
  assert.equal(await authorizedMatchNavigation(host.url, operator, target, async () => ({ok: true, json: async () => ({started: true, url: 'http://127.0.0.1:12567'})})), true);
  assert.equal(await authorizedMatchNavigation(host.url, operator, target, async () => ({ok: true, json: async () => ({started: true, url: 'http://127.0.0.1:12568'})})), false);
  assert.equal(await authorizedMatchNavigation(host.url, operator, target.replace('127.0.0.1', 'evil.example')), false);
  console.log('PASS desktop operator links are origin-bound and stale links are rejected');
  browser = await chromium.launch({headless: true, executablePath: auditBrowserRuntime.chromiumExecutable(), args: ['--use-angle=swiftshader']});
  for (const style of ['B']) for (const width of [1440, 390]) {
    const context = await browser.newContext({viewport: {width, height: 1000}});
    await context.addInitScript(value => localStorage.setItem('hex.uiStyle', value), style);
    const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${host.url}/#setup=${lobby.hostCapability}`, {waitUntil: 'domcontentloaded'});
    await page.locator('#menu-new').click();
    await page.locator('#setup-count').selectOption('2');
    if (width < 900) await page.locator('[data-setup-tab="leaders"]').click();
    await page.locator('[data-controller="1"]').selectOption('agent');
    assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'),'');
    await page.locator('#setup-prepare').click();
    await page.waitForFunction(() => document.getElementById('setup-mcp-readiness')?.textContent.includes('就绪'));
    await launcher.start(lobby,{seat:1,rounds:50});
    const status = launcher.status(1); assert.equal(status.target, 50);
    const bounds = await page.locator('#setup-prepare').boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    if (width === 390) {
      assert.ok((await page.locator('[data-setup-leader="1"]').boundingBox()).width >= 90);
      assert.ok((await page.locator('[data-controller="1"]').boundingBox()).width >= 70);
      assert.ok((await page.locator('[data-ai-name="1"]').boundingBox()).width > 80);
    }
    await page.screenshot({path: path.join(output, `setup-${style}-${width}.png`)});
    launcher.stop(1);
    assert.equal(launcher.status(1).state, 'stopped'); assert.deepEqual(errors, []);
    await context.close(); await lobby.cancel();
    console.log(`PASS ${style}/${width}: generic connection controls and legacy bounded launcher remain separate`);
  }
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
  const page = await context.newPage();
  await page.goto(`${host.url}/#setup=${lobby.hostCapability}`, {waitUntil: 'domcontentloaded'});
  await page.locator('#menu-new').click();
  await page.locator('#setup-size').selectOption('small');
  await page.locator('#setup-count').selectOption('2');
  await page.locator('[data-controller="0"]').selectOption('native');
  await page.locator('#setup-play-mode').selectOption('realtime');
  await page.locator('#setup-observer').check();
  await page.locator('#setup-play-mode').selectOption('turns');
  await page.locator('[data-controller="1"]').selectOption('agent');
  assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'),'');
  await page.locator('#setup-prepare').click();
  await page.waitForFunction(() => document.getElementById('setup-mcp-readiness')?.textContent.includes('就绪'));
  await launcher.start(lobby,{seat:1,rounds:50});
  assert.equal(await page.locator('#setup-play-mode').inputValue(), 'turns');
  assert.equal(await page.locator('[data-controller="1"]').inputValue(), 'agent');
  await lobby.runtime.session(lobby.runtime.seatTokens.get(1));
  await page.locator('#create-world').click();
  await page.waitForFunction(() => window.__hexUiState?.session?.role === 'observer' && window.__civ?.session?.managedRuns?.some(run=>run.target===50));
  await page.waitForFunction(() => {
    const canvas = document.getElementById('minimap');
    const context = canvas?.getContext('2d');
    if (!context || canvas.width < 100) return false;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set();
    for (let offset = 0; offset < pixels.length; offset += 80) if (pixels[offset + 3]) colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
    return colors.size > 8;
  }, null, {timeout: 120000});
  assert.equal(await page.evaluate(cap => document.documentElement.innerHTML.includes(cap), lobby.hostCapability), false);
  assert.equal(new URL(page.url()).hash, '');
  if (!await page.locator('#perspective').isVisible()) await page.locator('[data-b4-roster]').click();
  await page.locator('#perspective').selectOption('1');
  await page.waitForFunction(() => window.__hexUiState?.view === 1 && window.__hexUiState?.selectedPlayer === 1 && !!window.__hexUiState?.selection);
  assert.equal(await page.evaluate(() => window.__hexUi.canControl(1)), false);
  assert.equal(await page.locator('#play').isDisabled(), true);
  assert.equal(await page.locator('#takeover').isDisabled(), true);
  assert.equal(await page.locator('#player-task-dock').isVisible(), false);
  const beforeStop = lobby.runtime.gameplayHash();
  await page.locator('#model-observer-toggle').click();await page.locator('#model-observer-civ').selectOption('1');await page.locator('#model-observer-menu>summary').click();await page.locator('[data-managed-stop="1"]').click();
  await page.waitForFunction(() => window.__civ?.session?.managedRuns?.some(run=>run.paused));
  assert.equal(lobby.runtime.gameplayHash(), beforeStop);
  await page.screenshot({path: path.join(output, 'in-game-progress.png')});
  await context.close();
  console.log('PASS generic setup renders the map, preserves operator access and stops a managed client in-game without a gameplay mutation');
  const fixture = path.join(output, 'owned-process-fixture.cjs');
  writeFileSync(fixture, `const {spawn}=require('node:child_process');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});console.log(JSON.stringify({parent:process.pid,child:child.pid}));setInterval(()=>{},1000);`);
  const processLauncher = new AgentLauncher({executable: process.execPath, outputRoot: path.join(output, 'process-client'), spawnClient: (_command, _args, options) => spawn(process.execPath, [fixture], options)});
  try {
    await processLauncher.start(lobby, {seat: 1, rounds: 50});
    const owned = processLauncher.runs.get(1);
    let pids;
    for (let attempts = 0; attempts < 50 && !pids; attempts++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      try {pids = JSON.parse(readFileSync(path.join(owned.directory, 'transcript.jsonl'), 'utf8').trim());} catch {}
    }
    assert.ok(pids?.parent && pids?.child);
    processLauncher.stop(1);
    const alive = pid => {try {process.kill(pid, 0); return true;} catch {return false;}};
    for (let attempts = 0; attempts < 50 && (alive(pids.parent) || alive(pids.child)); attempts++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(alive(pids.parent), false); assert.equal(alive(pids.child), false);
    console.log('PASS stopping a real owned Windows process also closes its owned child process');
  } finally {processLauncher.dispose();}
} finally {await browser?.close(); lobby.dispose();}
console.log('MANAGED AGENT CHECK PASSED');
