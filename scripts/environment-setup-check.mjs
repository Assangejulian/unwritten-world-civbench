import auditBrowserRuntime from './browser-runtime.cjs';
// Browser check for New Game MCP seats. Isolated stub lobby only. Not Grok-model gameplay.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';

const require = createRequire(import.meta.url);
const {chromium} = auditBrowserRuntime.load('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.env.UI_CHECK_OUTPUT || path.join(ROOT, 'output/player-mcp-20261019'));
const CHROME = auditBrowserRuntime.chromiumExecutable();
const SDK = path.join(ROOT, 'environment/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm');
const ADAPTER = path.join(ROOT, 'environment/mcp/server.mjs');
const {Client} = await import(pathToFileURL(path.join(SDK, 'client/index.js')).href);
const {StdioClientTransport} = await import(pathToFileURL(path.join(SDK, 'client/stdio.js')).href);

await mkdir(OUT, {recursive: true});
const clients = [];

function childEnv(extra) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (typeof value === 'string') env[key] = value;
  delete env.CIV_MATCH_URL;
  delete env.CIV_MATCH_TOKEN;
  return {...env, ...extra};
}

function payload(result) {
  assert.equal(result.content?.[0]?.type, 'text');
  return JSON.parse(result.content[0].text);
}

async function connect(url, token, model = 'Grok') {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [ADAPTER],
    cwd: path.dirname(ADAPTER),
    stderr: 'pipe',
    env: childEnv({CIV_MATCH_URL: url, CIV_MATCH_TOKEN: token})
  });
  const client = new Client({name: 'hex-setup-check', version: '1.0.0'});
  await client.connect(transport);
  await client.callTool({name: 'game_session', arguments: {model}});
  clients.push(client);
  return client;
}

function tokenFrom(toml) {
  const found = toml.match(/CIV_MATCH_TOKEN[" ]*[:=]\s*"([a-f0-9]+)"/);
  assert.ok(found, 'selected seat export did not contain its token');
  return found[1];
}

async function openHost() {
  const lobby = new Lobby({stub: true});
  const host = await listen(null, {port: 0, lobby});
  lobby.server = host.server;
  lobby.url = host.url;
  assert.notEqual(host.port, 43821);
  return {lobby, host};
}

const browser = await chromium.launch({headless: true, executablePath: CHROME, args: ['--use-angle=swiftshader', '--disable-dev-shm-usage']});

async function newPage(host, capability, {style = 'B', viewport = {width: 1440, height: 900}} = {}) {
  const context = await browser.newContext({viewport});
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: host.url});
  await context.addInitScript(value => {localStorage.setItem('hex.uiStyle', value);Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__testMcpExport=text;}}});}, style);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('requestfailed', request => {
    if (/\.(?:mjs|js)(?:$|\?)/.test(request.url())) errors.push(`failed ${request.url()}`);
  });
  await page.goto(`${host.url}/#setup=${capability}`, {waitUntil: 'domcontentloaded', timeout: 60000});
  await page.waitForFunction(value => sessionStorage.getItem('hex-civ-host') === value && !location.hash.includes('setup='), capability);
  await page.locator('#menu-new').click();
  await page.locator('#setup-count').waitFor({timeout: 20000});
  return {context, page, errors};
}

async function configure(page, {seed, names}) {
  const narrow = (page.viewportSize()?.width || 1440) <= 900;
  if (narrow) await page.locator('button[data-setup-tab="world"]').click();
  await page.locator('#setup-size').selectOption('small');
  await page.locator('#setup-count').selectOption('2');
  await page.locator('#setup-seed').fill(seed);
  await page.locator('#setup-barbarians').uncheck();
  if (narrow) await page.locator('button[data-setup-tab="leaders"]').click();
  await page.locator('[data-controller="0"]').selectOption(names[0] ? 'agent' : 'native');
  if (names[0]) assert.equal(await page.locator('[data-ai-name="0"]').getAttribute('readonly'),'');
  await page.locator('[data-controller="1"]').selectOption(names[1] ? 'agent' : 'native');
  if (names[1]) assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'),'');
  await page.locator('#setup-observer').check();
}

async function prepare(page) {
  await page.locator('#setup-prepare').click();
  await page.waitForFunction(() => {
    const button = document.getElementById('setup-prepare');
    const text = document.getElementById('setup-mcp-readiness')?.textContent || '';
    return !!button && !button.disabled && text.includes('就绪');
  }, null, {timeout: 120000});
}

const first = await openHost();
try {
  await first.lobby.prepare({
    players: 2,
    size: 'small',
    seed: 'QUIET-UI',
    barbarians: false,
    seats: [{seat: 0, kind: 'native'}, {seat: 1, kind: 'agent', displayName: 'Quiet', agentId: 'seat-1'}]
  });
  await assert.rejects(
    () => first.lobby.runtime.uiObserve(first.lobby.runtime.seatTokens.get(1)),
    error => error.code === 'ui_unavailable' && /尚未连接界面/.test(error.message)
  );
  await first.lobby.cancel();
  assert.equal(first.lobby.runtime, null);
  console.log('PASS quiet lobby rejects ui_observe before a page connects');

  const shots = [
    ['setup-b-1440.png', 'B', {width: 1440, height: 900}],
    ['setup-b-390.png', 'B', {width: 390, height: 844}]
  ];
  for (const [file, style, viewport] of shots) {
    const shot = await newPage(first.host, first.lobby.hostCapability, {style, viewport});
    await configure(shot.page, {seed: 'SETUP-UI', names: [null, 'Grok']});
    await shot.page.screenshot({path: path.join(OUT, file)});
    assert.equal(shot.errors.length, 0, shot.errors.join('\n'));
    await shot.context.close();
  }
  console.log('PASS Universe setup screenshots at 1440 and 390');

  const main = await newPage(first.host, first.lobby.hostCapability);
  await configure(main.page, {seed: 'SETUP-UI', names: [null, 'Grok']});
  await prepare(main.page);
  const roster = await main.page.locator('#setup-roster').innerText();
  assert.equal(/[0-9a-f]{32}/i.test(roster), false);
  await main.page.locator('#setup-copy').click();
  await main.page.waitForFunction(() => (window.__testMcpExport || document.getElementById('setup-mcp-export')?.textContent || '').includes('CIV_MATCH_TOKEN'), null, {timeout: 10000});
  const toml = await main.page.evaluate(()=>window.__testMcpExport || document.getElementById('setup-mcp-export')?.textContent || '');
  const seatToken = tokenFrom(toml);
  assert.equal(toml.includes(first.lobby.runtime.observerToken), false);
  assert.equal(toml.includes(first.lobby.runtime.hostToken), false);
  assert.equal(toml.includes(first.lobby.hostCapability), false);
  assert.equal(toml.includes(JSON.stringify(process.execPath)), true);
  assert.equal(toml.includes(JSON.stringify(ADAPTER)), true);
  assert.equal(toml.includes(first.host.url), true);
  const visible = await main.page.locator('#modal').innerText();
  assert.equal(visible.includes(seatToken), false);
  const client = await connect(first.host.url, seatToken);
  const session = payload(await client.callTool({name: 'game_session', arguments: {}}));
  assert.equal(session.seat, 1);
  assert.equal(session.started, false);
  assert.equal(session.yourTurn, false);
  const earlyObservation = payload(await client.callTool({name: 'game_observe', arguments: {section: 'summary'}}));
  await main.page.waitForFunction(() => document.querySelectorAll('.setup-client-dot.online').length>0, null, {timeout: 8000});
  const hash = first.lobby.runtime.gameplayHash();
  const early = await client.callTool({name: 'game_act', arguments: {observation_token: earlyObservation.observation_token, request_id: 'setup-early', action: {type: 'research', item: 'pottery'}}});
  assert.equal(early.isError, true);
  assert.match(payload(early).error, /对局尚未开始/);
  assert.equal(first.lobby.runtime.gameplayHash(), hash);
  assert.equal(first.lobby.runtime.started, false);
  console.log('PASS nonzero seat connects without showing its token or mutating the match');

  await main.page.locator('#setup-seed').fill('SETUP-UI-NEXT');
  await prepare(main.page);
  const stale = await client.callTool({name: 'game_session', arguments: {}});
  assert.equal(stale.isError, true);
  assert.equal(payload(stale).code, 'unauthorized');
  await main.page.locator('#setup-copy').click();
  await main.page.waitForTimeout(300);
  const nextToken = tokenFrom(await main.page.evaluate(()=>window.__testMcpExport || document.getElementById('setup-mcp-export')?.textContent || ''));
  assert.notEqual(nextToken, seatToken);
  const next = await connect(first.host.url, nextToken);
  const nextSession = payload(await next.callTool({name: 'game_session', arguments: {}}));
  assert.equal(nextSession.seat, 1);
  console.log('PASS replacing the prepared world invalidates the old credential');

  await main.page.locator('#setup-back').click();
  await main.page.waitForFunction(async () => {
    const token = sessionStorage.getItem('hex-civ-host');
    const response = await fetch('/api/lobby', {headers: {Authorization: `Bearer ${token}`}});
    const status = await response.json();
    return response.ok && status.prepared === false;
  }, null, {timeout: 10000});
  await main.page.locator('#menu-new').click();
  await main.page.locator('#setup-count').waitFor({timeout: 20000});
  await configure(main.page, {seed: 'SETUP-UI-START', names: [null, 'Grok']});
  await prepare(main.page);
  await main.page.locator('#create-world').click();
  await main.page.waitForFunction(() => (document.getElementById('toast')?.textContent || '').includes('没有把它们换成内置 AI'), null, {timeout: 20000});
  assert.equal(first.lobby.runtime.started, false);
  await main.page.locator('#setup-copy').click();
  await main.page.waitForTimeout(300);
  const liveToken = tokenFrom(await main.page.evaluate(()=>window.__testMcpExport || document.getElementById('setup-mcp-export')?.textContent || ''));
  const live = await connect(first.host.url, liveToken);
  payload(await live.callTool({name: 'game_session', arguments: {}}));
  await main.page.waitForFunction(() => document.querySelectorAll('.setup-client-dot.online').length>0, null, {timeout: 8000});
  const tokensBefore = [...first.lobby.runtime.seatTokens.entries()];
  await main.page.locator('#create-world').click();
  // The setup itself now contains the badge: wait for the actual destination render.
  await main.page.waitForFunction(() => window.__hexUiState?.session?.role === 'observer' && document.getElementById('players')?.innerText.includes('【Grok】'), null, {timeout: 120000});
  assert.equal(new URL(main.page.url()).searchParams.has('access'), false);
  assert.equal(main.errors.length, 0, main.errors.join('\n'));
  const options = payload(await live.callTool({name: 'game_options', arguments: {type: 'research', limit: 5}}));
  assert.equal(options.actions.length > 0, true);
  const {preview, ...action} = options.actions[0];
  const acted = payload(await live.callTool({name: 'game_act', arguments: {observation_token: options.observation_token, request_id: 'setup-research', action}}));
  assert.equal(acted.status, 'applied', acted.error);
  const observed = payload(await live.callTool({name: 'game_observe', arguments: {}}));
  const ended = payload(await live.callTool({name: 'game_end_turn', arguments: {observation_token: observed.observation_token, request_id: 'setup-end', force: true}}));
  assert.equal(ended.status, 'applied', ended.error);
  const rosterProbe = await main.page.evaluate(() => ({
    roster: (document.getElementById('players')?.innerText || '').replace(/[0-9a-f]{16,}/gi, '[hex]').slice(0, 300),
    badges: [...document.querySelectorAll('.leader-ai-badge')].map(node => node.textContent).slice(0, 6),
    role: window.__hexUiState?.session?.role || '',
    view: window.__hexUiState?.view,
    known: (window.__hexUiState?.session?.controllers || []).map(item => [item.seat, item.kind, item.known, item.displayName || ''])
  }));
  assert.equal(rosterProbe.roster.includes('【Grok】'), true, JSON.stringify(rosterProbe));
  const cancel = await fetch(`${first.host.url}/api/lobby/cancel`, {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${first.lobby.hostCapability}`}, body: '{}'});
  assert.equal(cancel.status, 409);
  assert.equal(first.lobby.runtime.started, true);
  const still = payload(await live.callTool({name: 'game_observe', arguments: {}}));
  assert.equal(typeof still.observation_token, 'string');
  const ui = await live.callTool({name: 'ui_observe', arguments: {}});
  assert.equal(ui.isError, true);
  assert.match(payload(ui).error, /尚未连接界面/);
  const beforeUi = first.lobby.runtime.gameplayHash();
  const missing = await live.callTool({name: 'ui_act', arguments: {id: 'missing-control'}});
  assert.equal(missing.isError, true);
  assert.match(payload(missing).error, /尚未连接界面|只有该座位自己的界面可以接收点击/);
  assert.equal(first.lobby.runtime.gameplayHash(), beforeUi);
  if (!await main.page.locator('#perspective').isVisible()) await main.page.locator('[data-b4-roster]').click();
  await main.page.locator('#perspective').selectOption('0');
  await main.page.waitForTimeout(600);
  assert.deepEqual([...first.lobby.runtime.seatTokens.entries()], tokensBefore);
  console.log('PASS observer start plays one external seat and keeps credentials stable');
  await main.context.close();
} finally {
  await Promise.all(clients.splice(0).map(client => client.close().catch(() => {})));
  first.lobby.dispose();
}

const second = await openHost();
const secondPage = await newPage(second.host, second.lobby.hostCapability);
try {
  await configure(secondPage.page, {seed: 'SETUP-UI-TWO', names: ['Grok', 'Gemini']});
  await prepare(secondPage.page);
  await secondPage.page.locator('[data-setup-client="0"]').click();
  await secondPage.page.locator('#setup-copy').click();
  await secondPage.page.waitForTimeout(300);
  const firstToml = await secondPage.page.evaluate(()=>window.__testMcpExport || document.getElementById('setup-mcp-export')?.textContent || '');
  await secondPage.page.locator('[data-setup-client="1"]').click();
  await secondPage.page.locator('#setup-copy').click();
  await secondPage.page.waitForTimeout(300);
  const secondToml = await secondPage.page.evaluate(()=>window.__testMcpExport || document.getElementById('setup-mcp-export')?.textContent || '');
  const alpha = tokenFrom(firstToml);
  const beta = tokenFrom(secondToml);
  assert.notEqual(alpha, beta);
  assert.equal(firstToml.includes(second.lobby.runtime.observerToken), false);
  assert.equal(secondToml.includes(second.lobby.runtime.observerToken), false);
  const alphaClient = await connect(second.host.url, alpha);
  const betaClient = await connect(second.host.url, beta, 'Gemini');
  const alphaSession = payload(await alphaClient.callTool({name: 'game_session', arguments: {}}));
  const betaSession = payload(await betaClient.callTool({name: 'game_session', arguments: {}}));
  assert.equal(alphaSession.seat, 0);
  assert.equal(betaSession.seat, 1);
  assert.equal(alphaSession.started, false);
  assert.equal(alphaSession.yourTurn, false);
  assert.equal(betaSession.yourTurn, false);
  await secondPage.page.waitForFunction(() => document.querySelectorAll('.setup-client-dot.online').length===2, null, {timeout: 8000});
  const held = [...second.lobby.runtime.seatTokens.entries()];
  await secondPage.page.locator('#create-world').click();
  await secondPage.page.waitForFunction(() => window.__hexUiState?.session?.role === 'observer' && document.getElementById('players')?.innerText.includes('【Grok】') && document.getElementById('players')?.innerText.includes('【Gemini】'), null, {timeout: 120000});
  if (!await secondPage.page.locator('#perspective').isVisible()) await secondPage.page.locator('[data-b4-roster]').click();
  await secondPage.page.locator('#perspective').selectOption('1');
  await secondPage.page.waitForTimeout(600);
  assert.deepEqual([...second.lobby.runtime.seatTokens.entries()], held);
  const betaView = payload(await betaClient.callTool({name: 'game_observe', arguments: {}}));
  const blocked = await betaClient.callTool({name: 'game_act', arguments: {observation_token: betaView.observation_token, request_id: 'two-early', action: {type: 'research', item: 'pottery'}}});
  assert.equal(blocked.isError, true);
  assert.equal(payload(blocked).code, 'out_of_turn');
  assert.equal(secondPage.errors.length, 0, secondPage.errors.join('\n'));
  console.log('PASS two external clients share one match under a read-only observer');
} finally {
  await Promise.all(clients.splice(0).map(client => client.close().catch(() => {})));
  await secondPage.context.close().catch(() => {});
  await browser.close();
  second.lobby.dispose();
}

console.log('ENVIRONMENT SETUP CHECK PASSED');
