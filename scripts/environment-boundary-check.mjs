import auditBrowserRuntime from './browser-runtime.cjs';
// Isolated lobby-authorization and per-view UI checks. Not Grok-model gameplay.
// Does not print credentials, start the desktop server, or write production saves.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Lobby} from '../src/environment/lobby.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';

const require = createRequire(import.meta.url);
const {chromium} = auditBrowserRuntime.load('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = auditBrowserRuntime.chromiumExecutable();
const secrets = [];
const closers = [];

function track(value) {
  if (typeof value === 'string' && value) secrets.push(value);
  return value;
}

function redact(error) {
  let message = String(error?.stack || error);
  for (const secret of secrets) if (secret.length >= 8) message = message.split(secret).join('[redacted]');
  return message;
}

function containsSecret(text, hidden) {
  return hidden.some(secret => secret && text.includes(secret));
}

async function request(url, route, {method = 'POST', token = '', body = {}} = {}) {
  const headers = {'Content-Type': 'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${url}${route}`, {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify(body)
  });
  return {status: response.status, text: await response.text()};
}

function assertClosed(result, hidden, label) {
  assert.equal(result.status, 401, `${label} status ${result.status}`);
  assert.equal(containsSecret(result.text, hidden), false, `${label} response included a credential`);
  const parsed = JSON.parse(result.text);
  assert.equal(parsed.code, 'unauthorized');
  assert.match(parsed.error, /只有主机可以管理准备中的对局/);
}

const checked = spawnSync(process.execPath, ['--check', path.join(ROOT, 'server.mjs')], {encoding: 'utf8'});
assert.equal(checked.status, 0, checked.stderr || 'server.mjs failed to parse');
console.log('PASS server.mjs parses; desktop process was not started');

const lobbyConfig = {
  players: 2,
  size: 'small',
  seed: 'BOUNDARY-LOBBY',
  barbarians: false,
  seats: [
    {seat: 0, kind: 'agent', displayName: 'Grok', agentId: 'seat-0'},
    {seat: 1, kind: 'agent', displayName: 'Other', agentId: 'seat-1'}
  ]
};

async function openLobby() {
  const lobby = new Lobby({stub: true});
  track(lobby.hostCapability);
  const host = await listen(null, {port: 0, lobby});
  lobby.server = host.server;
  lobby.url = host.url;
  assert.notEqual(host.port, 43821);
  closers.push(() => new Promise(resolve => host.server.close(resolve)));
  return {lobby, host};
}

const first = await openLobby();
try {
  const planted = `secret-control-${randomBytes(6).toString('hex')}`;
  const before = await request(first.host.url, '/api/ui-bridge', {token: '', body: {pageInstance: 'unbound-page-01', page: 'diplomacy', controls: [{id: planted, label: 'hidden'}]}});
  assert.equal(before.status, 200);
  assert.equal(JSON.parse(before.text).ok, false);
  assert.match(JSON.parse(before.text).error, /尚未连接界面/);
  assert.equal(before.text.includes(planted), false);
  assert.equal(first.lobby.runtime, null);

  const unauthPrepare = await request(first.host.url, '/api/lobby/prepare', {token: '', body: lobbyConfig});
  assertClosed(unauthPrepare, [first.lobby.hostCapability], 'prepare without a token');
  assert.equal(first.lobby.runtime, null);

  const forged = await request(first.host.url, '/api/lobby/prepare', {token: 'a'.repeat(48), body: {...lobbyConfig, role: 'host'}});
  assertClosed(forged, [first.lobby.hostCapability], 'prepare with a forged token');
  assert.equal(first.lobby.runtime, null);

  const home = await request(first.host.url, '/', {method: 'GET'});
  const health = await request(first.host.url, '/health', {method: 'GET'});
  assert.equal(home.status, 200);
  assert.equal(health.status, 200);
  assert.equal(home.text.includes(first.lobby.hostCapability), false);
  assert.equal(health.text.includes(first.lobby.hostCapability), false);
  assert.equal(JSON.parse(health.text).service, 'match-host');

  const prepared = await request(first.host.url, '/api/lobby/prepare', {token: first.lobby.hostCapability, body: lobbyConfig});
  assert.equal(prepared.status, 200, `authorized prepare status ${prepared.status}`);
  const preparedBody = JSON.parse(prepared.text);
  assert.equal(preparedBody.prepared, true);
  assert.equal(preparedBody.seats.every(seat => seat.token === undefined), true);
  const runtime = first.lobby.runtime;
  const seat0 = track(runtime.seatTokens.get(0));
  const seat1 = track(runtime.seatTokens.get(1));
  const observer = track(runtime.observerToken);
  const hostToken = track(runtime.hostToken);
  const capability = first.lobby.hostCapability;
  const hidden = [seat0, seat1, observer, hostToken, capability];
  assert.equal(containsSecret(prepared.text, hidden), false);

  const callers = [
    ['no token', ''],
    ['seat token', seat0],
    ['observer token', observer],
    ['runtime host token', hostToken]
  ];
  for (const [label, token] of callers) {
    assertClosed(await request(first.host.url, '/api/lobby', {method: 'GET', token}), hidden, `status ${label}`);
    assertClosed(await request(first.host.url, '/api/lobby/copy', {token, body: {seat: 1, role: 'host'}}), hidden, `copy ${label}`);
    assertClosed(await request(first.host.url, '/api/lobby/start', {token, body: {waitPolicy: 'wait', observer: true, role: 'host'}}), hidden, `start ${label}`);
    assertClosed(await request(first.host.url, '/api/lobby/cancel', {token, body: {role: 'host'}}), hidden, `cancel ${label}`);
    assertClosed(await request(first.host.url, '/api/lobby/disconnect', {token, body: {seat: 1, role: 'host'}}), hidden, `disconnect ${label}`);
    assertClosed(await request(first.host.url, '/api/lobby/prepare', {token, body: {...lobbyConfig, role: 'host', seat: 1}}), hidden, `prepare ${label}`);
  }
  assert.equal(runtime.started, false);
  console.log('PASS unprivileged lobby routes withhold seat, observer, and host credentials');

  const status = await request(first.host.url, '/api/lobby', {method: 'GET', token: capability});
  assert.equal(status.status, 200);
  assert.equal(containsSecret(status.text, hidden), false);
  assert.equal(JSON.parse(status.text).seats.length, 2);

  for (const [seat, token] of [[0, seat0], [1, seat1]]) {
    const copied = await request(first.host.url, '/api/lobby/copy', {token: capability, body: {seat, role: 'observer'}});
    assert.equal(copied.status, 200, `copy seat ${seat} status ${copied.status}`);
    const body = JSON.parse(copied.text);
    assert.equal(body.seat, seat);
    assert.equal(body.env.CIV_MATCH_TOKEN, token);
    const others = hidden.filter(secret => secret !== token);
    assert.equal(containsSecret(copied.text, others), false, `copy seat ${seat} included another credential`);
  }

  const started = await request(first.host.url, '/api/lobby/start', {token: capability, body: {waitPolicy: 'wait', observer: true}});
  assert.equal(started.status, 200, `start status ${started.status}`);
  const startedBody = JSON.parse(started.text);
  assert.equal(startedBody.started, true);
  assert.equal(startedBody.role, 'observer');
  assert.equal(startedBody.access, observer);
  assert.equal(containsSecret(started.text, [seat0, seat1, hostToken, capability]), false);
  const blocked = await request(first.host.url, '/api/lobby/cancel', {token: capability, body: {}});
  assert.equal(blocked.status, 409);
  assert.equal(runtime.started, true);
  console.log('PASS host capability can prepare, copy one seat, and start without leaking other credentials');

  const bridge = await request(first.host.url, '/api/ui-bridge', {token: '', body: {pageInstance: 'unbound-page-02', page: 'diplomacy', controls: [{id: planted, label: 'hidden'}]}});
  assert.equal(bridge.status, 401);
  assert.equal(bridge.text.includes(planted), false);
  await assert.rejects(() => runtime.uiObserve(seat0), error => error.code === 'ui_unavailable' && /尚未连接界面/.test(error.message));
  await assert.rejects(() => runtime.uiObserve(observer), error => error.code === 'ui_unavailable');
  console.log('PASS unauthenticated UI publication stores nothing after the runtime exists');

  const empty = {player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}};
  const match = await MatchRuntime.create({
    profile: 'benchmark',
    players: 2,
    size: 'small',
    seed: 'BOUNDARY-UI',
    barbarians: false,
    seats: [
      {seat: 0, kind: 'agent', displayName: 'Grok', agentId: 'grok'},
      {seat: 1, kind: 'agent', displayName: 'Other', agentId: 'other'}
    ],
    execute: async () => ({orders: [], memory: null, ms: 0, stderr: ''}),
    prepareObservation: async () => empty
  });
  const uiHost = await listen(match, {port: 0});
  assert.notEqual(uiHost.port, 43821);
  closers.push(() => new Promise(resolve => uiHost.server.close(resolve)));
  const uiSeat0 = track(match.seatTokens.get(0));
  const uiSeat1 = track(match.seatTokens.get(1));
  const uiObserver = track(match.observerToken);
  const uiHostToken = track(match.hostToken);
  const browser = await chromium.launch({headless: true, executablePath: CHROME, args: ['--use-angle=swiftshader', '--disable-dev-shm-usage']});
  closers.push(() => browser.close());

  async function openAccess(token) {
    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    await context.addInitScript(() => localStorage.setItem('hex.uiStyle', 'A'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${uiHost.url}/?access=${encodeURIComponent(token)}`, {waitUntil: 'domcontentloaded', timeout: 60000});
    await page.waitForFunction(() => document.querySelector('#map-seed')?.textContent?.includes('种子已隐藏'), null, {timeout: 60000});
    await page.waitForFunction(() => window.__civ?.renderer?.renderedFrames > 0, null, {timeout: 120000});
    await page.evaluate(() => {window.__civ.renderer.menuOpen = true; window.__civ.renderer.reduced = true;});
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(await page.evaluate(() => sessionStorage.getItem('hex-civ-host')), null);
    return {context, page};
  }

  async function openPanel(page, name) {
    // Exercise shared pages through the public opener; retired navigation is hidden.
    await page.evaluate(name => window.__civ.openModal(name), name);
    await page.locator(`#modal[open][data-page="${name}"]`).waitFor({timeout: 20000});
  }

  async function published(token, pageName, accept = view => view.controls.length > 0) {
    const startedAt = Date.now();
    let latest = null;
    while (Date.now() - startedAt < 20000) {
      try {
        latest = await match.uiObserve(token);
      } catch {
        latest = null;
      }
      if (latest?.page === pageName && accept(latest)) return latest;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`view did not publish ${pageName}`);
  }

  const seatPage0 = await openAccess(uiSeat0);
  const seatPage1 = await openAccess(uiSeat1);
  const observerPage = await openAccess(uiObserver);
  await openPanel(seatPage0.page, 'diplomacy');
  await openPanel(seatPage1.page, 'help');
  await openPanel(observerPage.page, 'saves');
  const hasContent = view => view.controls.some(control => control.label === '外交关系' || control.id === 'help-saves');
  const view0 = await published(uiSeat0, 'diplomacy', hasContent);
  const view1 = await published(uiSeat1, 'help', hasContent);
  const viewObserver = await published(uiObserver, 'saves');
  const civicIds = new Set(view1.controls.map(control => control.id));
  const observerIds = new Set(viewObserver.controls.map(control => control.id));
  const privateControl = view0.controls.find(control => control.label === '外交关系' && !civicIds.has(control.id) && !observerIds.has(control.id));
  assert.ok(privateControl, 'seat 0 did not publish a control absent from the other views');
  assert.equal(view0.page, 'diplomacy');
  assert.equal(view1.page, 'help');
  assert.equal(viewObserver.page, 'saves');
  console.log('PASS simultaneous seat and observer pages keep separate control trees');

  const beforeClick = match.gameplayHash();
  await match.uiAct(uiSeat0, {id: 'close-modal'});
  await seatPage0.page.waitForFunction(() => !document.getElementById('modal').open, null, {timeout: 8000});
  assert.equal(await seatPage1.page.locator('#modal').evaluate(node => node.open && node.dataset.page), 'help');
  assert.equal(await observerPage.page.locator('#modal').evaluate(node => node.open && node.dataset.page), 'saves');
  assert.equal(match.gameplayHash(), beforeClick);
  console.log('PASS a queued click reaches only the seat that owns that page');

  await openPanel(seatPage0.page, 'diplomacy');
  const reopened = await published(uiSeat0, 'diplomacy', hasContent);
  assert.equal(reopened.controls.some(control => control.id === privateControl.id), true);
  await assert.rejects(
    () => match.uiAct(uiSeat1, {id: privateControl.id}),
    error => error.status === 400 && /界面上没有这个控件/.test(error.message)
  );
  assert.equal(await seatPage0.page.locator('#modal').evaluate(node => node.open && node.dataset.page), 'diplomacy');
  await assert.rejects(
    () => match.uiAct(uiObserver, {id: 'close-modal'}),
    error => error.status === 403 && /只有该座位自己的界面可以接收点击/.test(error.message)
  );
  await assert.rejects(
    () => match.uiAct(uiHostToken, {id: 'close-modal'}),
    error => error.status === 403 && /只有该座位自己的界面可以接收点击/.test(error.message)
  );
  const hostBridge = await request(uiHost.url, '/api/ui-bridge', {token: uiHostToken, body: {pageInstance: 'host-page-0001', page: 'diplomacy', controls: [{id: 'host-only-control', label: 'hidden'}]}});
  assert.equal(hostBridge.status, 403);
  assert.match(JSON.parse(hostBridge.text).error, /这个身份没有自己的界面/);
  assert.equal(await seatPage0.page.locator('#modal').evaluate(node => node.dataset.page), 'diplomacy');
  assert.equal(await seatPage1.page.locator('#modal').evaluate(node => node.dataset.page), 'help');
  assert.equal(match.gameplayHash(), beforeClick);
  console.log('PASS observer and host credentials cannot click another page');

  const leakedId = `secret-control-${randomBytes(6).toString('hex')}`;
  const unauthenticated = await request(uiHost.url, '/api/ui-bridge', {token: '', body: {view: 0, pageInstance: 'spoof-page-unauth', page: 'diplomacy', controls: [{id: leakedId, label: 'hidden'}]}});
  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.text.includes(leakedId), false);
  const spoofId = `spoof-control-${randomBytes(6).toString('hex')}`;
  const spoof = await request(uiHost.url, '/api/ui-bridge', {
    token: uiSeat1,
    body: {view: 0, role: 'seat', seat: 0, pageInstance: 'spoof-page-0001', page: 'diplomacy', controls: [{id: spoofId, label: 'spoof'}]}
  });
  assert.equal(spoof.status, 200);
  const afterSpoof = await match.uiObserve(uiSeat0);
  assert.equal(afterSpoof.page, 'diplomacy');
  assert.equal(afterSpoof.controls.some(control => control.id === spoofId || control.id === leakedId), false);
  assert.equal((await match.uiObserve(uiObserver)).controls.some(control => control.id === spoofId), false);
  const restoredAt = Date.now();
  let restored = null;
  while (Date.now() - restoredAt < 8000) {
    restored = await match.uiObserve(uiSeat1);
    if (restored.page === 'help' && !restored.controls.some(control => control.id === spoofId)) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.equal(restored.page, 'help');
  assert.equal(restored.controls.some(control => control.id === spoofId), false);
  console.log('PASS rejected and cross-seat UI posts do not enter another view');

  await seatPage0.page.evaluate(() => clearInterval(window.__uiBridge));
  await match.uiAct(uiSeat0, {id: 'close-modal'});
  match.disconnect(0);
  await assert.rejects(() => match.uiObserve(uiSeat0), error => error.code === 'ui_unavailable' && /尚未连接界面/.test(error.message));
  const pageInstance = await seatPage0.page.evaluate(() => sessionStorage.getItem('hex-civ-page'));
  const dropped = await request(uiHost.url, '/api/ui-bridge', {
    token: uiSeat0,
    body: {pageInstance, page: 'diplomacy', controls: [{id: 'close-modal', label: '关闭窗口'}]}
  });
  assert.equal(dropped.status, 200);
  assert.equal(JSON.parse(dropped.text).click, null);
  assert.equal(await seatPage0.page.locator('#modal').evaluate(node => node.open), true);
  console.log('PASS disconnect drops the queued click and the stale view');

  const previousSeat = uiSeat0;
  const rebound = await match.reassign(uiHostToken, 0, {kind: 'agent', displayName: 'Rebound', agentId: 'grok'});
  track(rebound.token);
  await assert.rejects(() => match.uiObserve(previousSeat), error => error.status === 401);
  await assert.rejects(() => match.uiObserve(rebound.token), error => error.code === 'ui_unavailable' && /尚未连接界面/.test(error.message));
  const previousObserver = uiObserver;
  const previousSeat1 = uiSeat1;
  const save = await match.hostSave(uiHostToken);
  await match.hostLoad(uiHostToken, save.save);
  track(match.observerToken);
  track(match.seatTokens.get(0));
  track(match.seatTokens.get(1));
  await assert.rejects(() => match.uiObserve(previousObserver), error => error.status === 401);
  await assert.rejects(() => match.uiObserve(previousSeat1), error => error.status === 401);
  await assert.rejects(() => match.uiObserve(match.observerToken), error => error.code === 'ui_unavailable');
  await assert.rejects(() => match.uiObserve(match.seatTokens.get(1)), error => error.code === 'ui_unavailable');
  await new Promise(resolve => setTimeout(resolve, 700));
  await assert.rejects(() => match.uiObserve(match.observerToken), error => error.code === 'ui_unavailable');
  await assert.rejects(() => match.uiObserve(match.seatTokens.get(0)), error => error.code === 'ui_unavailable');
  console.log('PASS reassign and load invalidate stale views and queued credentials');

  const operator = await browser.newContext({viewport: {width: 1440, height: 900}});
  const operatorPage = await operator.newPage();
  await operatorPage.goto(`${uiHost.url}/#setup=${encodeURIComponent(first.lobby.hostCapability)}`, {waitUntil: 'domcontentloaded', timeout: 60000});
  await operatorPage.waitForFunction(value => sessionStorage.getItem('hex-civ-host') === value && !location.hash.includes('setup='), first.lobby.hostCapability);
  assert.equal(await operatorPage.evaluate(() => document.documentElement.innerHTML.includes(sessionStorage.getItem('hex-civ-host'))), false);
  await operator.close();
  const queryPageContext = await browser.newContext({viewport: {width: 1440, height: 900}});
  const queryPage = await queryPageContext.newPage();
  await queryPage.goto(`${uiHost.url}/?setup=${encodeURIComponent(first.lobby.hostCapability)}`, {waitUntil: 'domcontentloaded', timeout: 60000});
  await queryPage.waitForFunction(() => document.getElementById('menu-new'), null, {timeout: 20000});
  assert.equal(await queryPage.evaluate(() => sessionStorage.getItem('hex-civ-host')), null);
  await queryPageContext.close();
  console.log('PASS the host capability arrives only through the operator fragment');

  const second = await openLobby();
  const secondPrepared = await request(second.host.url, '/api/lobby/prepare', {token: second.lobby.hostCapability, body: {...lobbyConfig, seed: 'BOUNDARY-CANCEL'}});
  assert.equal(secondPrepared.status, 200);
  const cancelled = await request(second.host.url, '/api/lobby/cancel', {token: second.lobby.hostCapability, body: {}});
  assert.equal(cancelled.status, 200);
  assert.equal(JSON.parse(cancelled.text).prepared, false);
  assert.equal(second.lobby.runtime, null);
  const seatCancel = await request(second.host.url, '/api/lobby/cancel', {token: seat0, body: {}});
  assertClosed(seatCancel, [second.lobby.hostCapability, seat0], 'cancel with a seat token after the lobby is empty');
  console.log('PASS an authorized host can cancel a match that has not started');
} catch (error) {
  throw new Error(redact(error));
} finally {
  for (const close of closers.reverse()) await close().catch(() => {});
}

console.log('ENVIRONMENT BOUNDARY CHECK PASSED');
