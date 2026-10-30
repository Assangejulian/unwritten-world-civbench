import auditBrowserRuntime from './browser-runtime.cjs';
// Browser check for the isolated match host. It does not start the desktop server or write production saves.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {MatchRuntime} from '../src/environment/match.mjs';
import {listen} from '../src/environment/http.mjs';

const require = createRequire(import.meta.url);
const {chromium} = auditBrowserRuntime.load('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'output/player-mcp-20261019/ui');
const CHROME = auditBrowserRuntime.chromiumExecutable();
const empty = {player: {faith: 0, beliefs: {}}, legalActions: [], units: [], cities: [], greatPeople: {candidates: []}};

await mkdir(OUT, {recursive: true});
const runtime = await MatchRuntime.create({
  profile: 'benchmark',
  players: 2,
  size: 'small',
  seed: 'UI-CHECK',
  barbarians: false,
  seats: [
    {seat: 0, kind: 'agent', displayName: 'Grok', agentId: 'grok'},
    {seat: 1, kind: 'agent', displayName: 'Other', agentId: 'other'}
  ],
  execute: async () => ({orders: [], memory: null, ms: 0, stderr: ''}),
  prepareObservation: async () => empty
});
runtime.game.players[0].research = null;
runtime.game.players[0].civic = null;
const host = await listen(runtime, {port: 0});
assert.notEqual(host.port, 43821);
const card = runtime.connectionCard();
const seatToken = card.seats.find(seat => seat.seat === 0).token;
const otherLeader = runtime.game.players[1].leader;
const browser = await chromium.launch({headless: true, executablePath: CHROME, args: ['--use-angle=swiftshader', '--disable-dev-shm-usage']});

async function showTask(page, kind) {
  await page.locator('#player-task-dock .pt-main').waitFor({state: 'visible', timeout: 20000});
  for (let attempt = 0; attempt < 12; attempt++) {
    if (await page.locator('.pt-main.k-' + kind).count()) return;
    await page.locator('[data-pt-cycle="1"]').click();
  }
  throw new Error('Missing task ' + kind);
}

async function openSeat(token, {style = 'B', viewport = {width: 1440, height: 900}} = {}) {
  const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
  await context.addInitScript(value => localStorage.setItem('hex.uiStyle', value), style);
  const page = await context.newPage();
  const errors = [];
  const calls = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => {
    if (!request.url().includes('/api/')) return;
    calls.push({url: request.url(), method: request.method(), authorization: request.headers().authorization || '', body: request.postData()});
  });
  await page.goto(`${host.url}/?access=${encodeURIComponent(token)}`, {waitUntil: 'domcontentloaded', timeout: 60000});
  await page.waitForFunction(() => document.querySelector('#map-seed')?.textContent?.includes('种子已隐藏'), null, {timeout: 60000});
  await page.waitForFunction(() => window.__civ?.renderer?.renderedFrames > 0, null, {timeout: 120000});
  // Keep the rendered map still while two seat pages exercise shared commands and controls.
  await page.evaluate(() => {window.__civ.renderer.menuOpen = true; window.__civ.renderer.reduced = true;});
  return {context, page, errors, calls};
}

try {
  const seat = await openSeat(seatToken);
  assert.equal(seat.errors.length, 0, seat.errors.join('\n'));
  assert.equal(new URL(seat.page.url()).searchParams.has('access'), false);
  assert.equal(await seat.page.locator('#start-menu').isHidden(), true);
  assert.equal(await seat.page.locator('#app').evaluate(node => node.classList.contains('menu-open')), false);
  assert.equal(await seat.page.locator('#map-seed').innerText(), '随机世界 · 种子已隐藏');
  assert.equal(await seat.page.locator('#perspective').isDisabled(), true);
  assert.equal(await seat.page.locator('#perspective').inputValue(), '0');
  const roster = await seat.page.locator('#players').innerHTML();
  assert.equal(roster.includes('leader-ai-badge'), true);
  assert.equal(roster.includes('【Grok】'), true);
  assert.equal(roster.includes('【Other】'), false);
  assert.equal(roster.includes(otherLeader), false);
  assert.equal(seat.calls.some(call => call.url.includes('/api/state') && call.authorization === `Bearer ${seatToken}`), true);
  const beforeModal = runtime.gameplayHash();
  await showTask(seat.page, 'civic');
  await seat.page.locator('.pt-main').click();
  await seat.page.locator('#b4-codex .b5-node').first().waitFor({timeout: 15000});
  await seat.page.screenshot({path: path.join(OUT, 'universe-civic-task.png')});
  await seat.page.locator('[data-b4-close]').click();
  assert.equal(runtime.gameplayHash(), beforeModal);
  await showTask(seat.page, 'research');
  await seat.page.locator('.pt-main').click();
  const researchNode = seat.page.locator('#b4-codex .b5-node.s-avail').first();
  await researchNode.waitFor({timeout: 15000});
  const researchKey = await researchNode.getAttribute('data-b4-item');
  await researchNode.click();
  await seat.page.locator('[data-b4-research]').click();
  await seat.page.waitForFunction(key => window.__hexUiState?.game?.players?.[0]?.research === key, researchKey);
  assert.equal(runtime.game.players[0].research, researchKey);
  const researchAct = seat.calls.filter(call => call.method === 'POST' && call.url.includes('/api/action')).map(call => JSON.parse(call.body));
  assert.equal(researchAct.some(call => call.action?.type === 'research' && call.action.item === researchKey && typeof call.observation_token === 'string'), true);
  await seat.page.locator('[data-b4-close]').click();

  const presentation = await openSeat(seatToken, {style: 'B'});
  assert.equal(presentation.errors.length, 0, presentation.errors.join('\n'));
  await presentation.page.locator('[data-b4-roster]').click();
  await presentation.page.locator('#b-rows .leader-ai-badge').first().waitFor({state: 'visible', timeout: 20000});
  const brows = await presentation.page.locator('#b-rows').innerHTML();
  assert.equal(brows.includes('【Grok】'), true);
  assert.equal(brows.includes('【Other】'), false);
  assert.equal(brows.includes(otherLeader), false);
  const beforeCodex = runtime.gameplayHash();
  await showTask(presentation.page, 'civic');
  await presentation.page.locator('.pt-main').click();
  await presentation.page.locator('#b4-codex').waitFor({timeout: 15000});
  assert.equal(await presentation.page.locator('#modal[open] .tree-node').count(), 0);
  const civicKey = await presentation.page.locator('.b5-node.s-avail').first().getAttribute('data-b4-item');
  await presentation.page.locator('.b5-node.s-avail').first().click();
  await presentation.page.locator('[data-b4-research]').click();
  await presentation.page.waitForFunction(key => window.__hexUiState?.game?.players?.[0]?.civic === key, civicKey);
  assert.equal(runtime.game.players[0].civic, civicKey);
  assert.notEqual(runtime.gameplayHash(), beforeCodex);
  const civicAct = presentation.calls.filter(call => call.method === 'POST' && call.url.includes('/api/action')).map(call => JSON.parse(call.body));
  assert.equal(civicAct.length >= 1, true);
  assert.equal(typeof civicAct.at(-1).observation_token, 'string');
  assert.equal(civicAct.at(-1).action.type, 'civic');
  await presentation.page.screenshot({path: path.join(OUT, 'ui-b-civic.png')});
  await presentation.page.setViewportSize({width: 390, height: 844});
  const bBadge = presentation.page.locator('#b-rows .leader-ai-badge').first();
  const bNarrow = await bBadge.evaluate(element => {
    const box = element.getBoundingClientRect();
    return {overflow: getComputedStyle(element).textOverflow, right: box.right, viewport: window.innerWidth};
  });
  assert.equal(bNarrow.overflow, 'ellipsis');
  assert.equal(bNarrow.right <= bNarrow.viewport + 1, true);
  await presentation.page.screenshot({path: path.join(OUT, 'ui-b-mobile.png')});

  await seat.page.locator('#player-task-dock .pt-end:not([disabled])').click();
  await seat.page.waitForFunction(() => document.querySelector('#phase-title')?.textContent?.includes('等待'), null, {timeout: 30000});
  const ended = seat.calls.filter(call => call.method === 'POST' && call.url.includes('/api/end-turn')).map(call => JSON.parse(call.body));
  assert.equal(ended.length, 1);
  assert.equal(typeof ended[0].observation_token, 'string');
  assert.equal(typeof ended[0].request_id, 'string');
  assert.equal(ended[0].player, 0);
  await seat.page.screenshot({path: path.join(OUT, 'ui-a-desktop.png')});
  await seat.page.setViewportSize({width: 390, height: 844});
  await seat.page.locator('[data-b4-roster]').click();
  const badge = seat.page.locator('#b-rows .leader-ai-badge').first();
  await badge.waitFor();
  const narrow = await badge.evaluate(element => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {overflow: style.textOverflow, maxWidth: parseFloat(style.maxWidth), fontSize: parseFloat(style.fontSize), right: box.right, width: box.width, viewport: window.innerWidth};
  });
  assert.equal(narrow.overflow, 'ellipsis');
  assert.equal(narrow.width <= narrow.viewport, true);
  assert.equal(narrow.right <= narrow.viewport + 1, true);
  await seat.page.screenshot({path: path.join(OUT, 'ui-a-mobile.png')});

  await runtime.observe(seatToken, {section: 'summary'});
  const settled = await runtime.observe(seatToken, {section: 'summary'});
  const watcher = await openSeat(card.observerToken);
  assert.equal(watcher.errors.length, 0, watcher.errors.join('\n'));
  await watcher.page.locator('[data-b4-roster]').click();
  assert.equal(await watcher.page.locator('#perspective').isDisabled(), false);
  const watching = await watcher.page.locator('#players').innerHTML();
  assert.equal(watching.includes('【Grok】'), true);
  assert.equal(watching.includes('【Other】'), true);
  await watcher.page.screenshot({path: path.join(OUT, 'ui-observer.png')});
  await watcher.page.locator('#perspective').selectOption('1');
  await watcher.page.waitForFunction(() => document.querySelector('#perspective')?.value === '1');
  const afterCamera = await runtime.observe(seatToken, {section: 'summary'});
  assert.equal(afterCamera.observation_token, settled.observation_token);
  assert.equal(runtime.simulation.activePlayer, 1);

  console.log('UI CHECK PASSED');
} finally {
  await browser.close();
  await new Promise(resolve => host.server.close(resolve));
}
