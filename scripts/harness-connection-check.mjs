// Disposable profiles and real stdio clients; never modify an installed client's configuration.
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, writeFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {HarnessConnections} from '../src/environment/harnesses.mjs';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';
import {MatchRuntime} from '../src/environment/match.mjs';
import browserRuntime from './browser-runtime.cjs';
const sdk = createRequire(path.resolve('environment/mcp/package.json'));
const {Client} = sdk('@modelcontextprotocol/sdk/client/index.js');
const {StdioClientTransport} = sdk('@modelcontextprotocol/sdk/client/stdio.js');
const output = path.resolve(process.env.UI_CHECK_OUTPUT || 'output/harness-connection-20261027');
await mkdir(path.join(output,'private'),{recursive:true});
const home = await mkdtemp(path.join(output,'private','home-')), dataRoot = path.join(home,'.civbench','connections');
await mkdir(path.join(home, '.workbuddy'), {recursive: true});
await mkdir(path.join(home, '.gemini', 'config'), {recursive: true});
for (const directory of ['.claude', '.kimi-code', '.zcode', '.dsh']) await mkdir(path.join(home, directory), {recursive: true});
const detectedIds = ['workbuddy', 'antigravity', 'claude-code', 'kimi-code', 'zcode', 'deepseek-harness'];
const wbConfig = path.join(home, '.workbuddy', 'mcp.json');
const agConfig = path.join(home, '.gemini', 'config', 'mcp_config.json');
const original = {mcpServers: {unrelated: {command: 'unrelated-server', env: {TOKEN: 'TEST_OTHER_CREDENTIAL'}}}, preference: 'preserved'};
for (const file of [wbConfig, agConfig]) await writeFile(file, JSON.stringify(original));
const opened = [], checks = [], clients = [], lobbies = [];
const pass = label => {checks.push(label); console.log('PASS ' + label);};
const manager = new HarnessConnections({home, dataRoot, env: {}, discoverExecutables: async () => ({'workbuddy.exe': process.execPath, 'antigravity.exe': process.execPath}), openClient: async file => opened.push(file)});
const config = {players: 2, size: 'small', seed: 'HARNESS-MULTI', barbarians: false, seats: [{seat: 0, kind: 'agent', displayName: 'WorkBuddy'}, {seat: 1, kind: 'agent', displayName: 'Antigravity'}]};
async function fixture() {
  const lobby = new Lobby({stub: true, harnesses: manager}); lobbies.push(lobby);
  await lobby.prepare(config);
  return lobby;
}
async function request(lobby, route, body, token = lobby.hostCapability) {
  const response = await fetch(lobby.url + '/api/lobby/' + route, {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token}, body: JSON.stringify(body)});
  return {status: response.status, value: await response.json()};
}
async function tool(client, name, args = {}) {
  const response = await client.callTool({name, arguments: args});
  return {error: response.isError, value: JSON.parse(response.content[0].text)};
}
async function attach(file, name) {
  const saved = JSON.parse(await readFile(file, 'utf8')).mcpServers.civbench_game;
  assert.equal(saved.env.CIV_MATCH_TOKEN, undefined);
  const client = new Client({name, version: 'integration-check'}); clients.push(client);
  await client.connect(new StdioClientTransport({...saved, stderr: 'pipe'}));
  return client;
}
let browser;
try {
  const firstScan = await manager.scan({runtime: null});
  assert.deepEqual(firstScan.clients.map(client => client.id), detectedIds);
  assert.ok(firstScan.clients.every(client => client.seat === null));
  pass('First discovery before creating a world handles missing bindings and returns all six installed profiles');
  const lobby = await fixture();
  assert.equal((await request(lobby, 'harness/scan', {}, lobby.runtime.seatTokens.get(0))).status, 401);
  const scan = await request(lobby, 'harness/scan', {});
  assert.deepEqual(scan.value.clients.map(client => client.id), detectedIds);
  assert.equal(JSON.stringify(scan.value).includes(home), false);
  assert.equal((await request(lobby, 'harness/open', {harness: 'workbuddy'})).status, 200);
  assert.equal(opened.length, 1);
  assert.equal((await request(lobby, 'harness/open', {harness: '../arbitrary.exe'})).status, 400);
  pass('Host-only discovery exposes client names and readiness, never paths or arbitrary executable launch');
  const backupCount = (await readdir(dataRoot).catch(() => [])).filter(name => name.endsWith('.backup.json')).length;
  const legacy = {...original, mcpServers: {...original.mcpServers, previous_civbench: {command: process.execPath, args: [path.resolve('environment/mcp/server.mjs')], env: lobby.copy(0).env}}};
  await writeFile(agConfig, JSON.stringify(legacy));
  assert.equal((await request(lobby, 'harness/bind', {harness: 'antigravity', seat: 1})).status, 409);
  assert.deepEqual(JSON.parse(await readFile(agConfig, 'utf8')), legacy, 'A live legacy connection must remain untouched');
  await writeFile(agConfig, JSON.stringify(original));
  await writeFile(wbConfig, JSON.stringify(legacy));
  for (const [harness, seat, file] of [['workbuddy', 0, wbConfig], ['antigravity', 1, agConfig]]) {
    const result = await request(lobby, 'harness/bind', {harness, seat});
    assert.equal(result.status, 200, JSON.stringify(result.value));
    assert.equal(result.value.connected, false);
    const saved = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(saved.mcpServers.unrelated, original.mcpServers.unrelated);
    assert.equal(saved.preference, original.preference);
    assert.equal(saved.mcpServers.previous_civbench, undefined, 'The same seat migrates to one persistent server without duplicate old-world tools');
    const binding = JSON.parse(await readFile(saved.mcpServers.civbench_game.env.CIV_BINDING_FILE, 'utf8'));
    assert.equal(binding.token, lobby.runtime.seatTokens.get(seat));
    assert.equal(binding.token === lobby.hostCapability || binding.token === lobby.runtime.observerToken || binding.token === lobby.runtime.hostToken, false);
    assert.equal(JSON.stringify(result.value).includes(binding.token), false);
  }
  assert.equal((await readdir(dataRoot)).filter(name => name.endsWith('.backup.json')).length, backupCount + 2);
  assert.equal((await request(lobby, 'harness/bind', {harness: 'workbuddy', seat: 1})).status, 409);
  pass('Configuration merges and exact backups preserve unrelated MCPs; each harness receives only its own seat and cannot double-bind');
  const wb = await attach(wbConfig, 'WorkBuddy integration'), ag = await attach(agConfig, 'Antigravity integration');
  const a = await tool(wb, 'game_session'), b = await tool(ag, 'game_session');
  await tool(wb, 'game_session', {model: 'reported-model-for-manual-seat'});
  assert.equal(lobby.runtime.game.players[0].controller.displayName, 'WorkBuddy', 'Legacy manually named seats must remain unchanged');
  assert.equal(a.value.match_id, b.value.match_id); assert.equal(a.value.seat, 0); assert.equal(b.value.seat, 1);
  assert.equal((await tool(wb, 'game_observe', {view: 1})).value.code, 'forbidden');
  await lobby.start({observer: true});
  for (let round = 0; round < 3; round++) for (const client of [wb, ag]) {
    let observed = (await tool(client, 'game_observe', {})).value;
    if (!round) {
      const options = (await tool(client, 'game_options', {type: 'found', limit: 1})).value;
      assert.ok(options.actions.length);
      const {preview, ...action} = options.actions[0];
      const applied = await tool(client, 'game_act', {action, observation_token: options.observation_token});
      assert.equal(applied.value.status, 'applied');
      observed = {observation_token: applied.value.next_observation_token};
    }
    assert.equal((await tool(client, 'game_end_turn', {force: true, observation_token: observed.observation_token})).value.status, 'applied');
  }
  assert.equal(lobby.runtime.game.turn, 4);
  pass('Two real initialized MCP clients control different civilizations, found cities and alternate three rounds with fog enforced');

  const oldView = (await tool(wb, 'game_observe', {})).value;
  const oldObservation = oldView.observation_token;
  const second = await fixture();
  assert.equal((await request(second, 'harness/bind', {harness: 'workbuddy', seat: 0})).status, 409, 'A live game cannot be silently stolen');
  lobby.runtime.game.players[0].alive = false;
  const configBefore = await readFile(wbConfig, 'utf8');
  const configModifiedBefore = (await stat(wbConfig)).mtimeMs;
  assert.equal((await request(second, 'harness/bind', {harness: 'workbuddy', seat: 0})).status, 200);
  assert.equal(await readFile(wbConfig, 'utf8'), configBefore, 'New games keep the same persistent client entry');
  assert.equal((await stat(wbConfig)).mtimeMs, configModifiedBefore, 'Changing worlds must not rewrite the client config or trigger its file watcher');
  const switched = (await tool(wb, 'game_session')).value;
  assert.equal(switched.match_id, second.runtime.id);
  assert.notEqual(switched.match_id, a.value.match_id);
  await second.start({waitPolicy: 'wait', observer: true});
  const hash = second.runtime.gameplayHash();
  assert.equal((await tool(wb, 'game_act', {action: {type: 'research', item: 'mining'}, observation_token: oldObservation})).value.code, 'stale_observation');
  assert.equal((await tool(wb, 'game_act', {action: {type: 'research', item: 'mining'}, observation_token: oldView.observation_ref})).value.code, 'unknown_observation_reference');
  assert.equal(second.runtime.gameplayHash(), hash);
  await request(second, 'harness/unbind', {harness: 'workbuddy'});
  assert.equal((await tool(wb, 'game_session')).error, true);
  assert.equal((await tool(ag, 'game_session')).value.match_id, lobby.runtime.id);
  pass('A persistent client survives world changes, refuses live reassignment and stale orders, and unbinding leaves the other harness untouched');

  const third = await fixture();
  await writeFile(wbConfig, '{ broken JSON');
  assert.equal((await request(third, 'harness/bind', {harness: 'workbuddy', seat: 0})).status, 409);
  assert.equal(await readFile(wbConfig, 'utf8'), '{ broken JSON');
  await writeFile(wbConfig, JSON.stringify(original));
  await request(third, 'harness/bind', {harness: 'workbuddy', seat: 0});
  await third.cancel();
  assert.equal((await tool(wb, 'game_session')).error, true);
  pass('Invalid client JSON stays untouched and canceled lobbies revoke their automatic bindings');
  await Promise.all(clients.map(client => client.close()));

  const ui = new Lobby({stub: true, harnesses: manager}); lobbies.push(ui);
  for (const directory of ['.codex','.continue']) await mkdir(path.join(home,directory),{recursive:true});
  const uiHost = await listen(null, {port: 0, lobby: ui}); ui.server = uiHost.server; ui.url = uiHost.url;
  browser = await browserRuntime.load('playwright').chromium.launch({headless: true, executablePath: browserRuntime.chromiumExecutable(), args: ['--use-angle=swiftshader']});
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}}), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(ui.url + '/#setup=' + ui.hostCapability);
  await page.locator('#menu-new').click();
  await page.locator('#setup-count').selectOption('2');
  await page.locator('[data-controller="0"]').selectOption('agent');
  await page.locator('[data-controller="1"]').selectOption('agent');
  assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'),'');
  await page.locator('[data-setup-client="0"]').click();
  await page.waitForFunction(() => document.querySelector('#setup-harness option[value="workbuddy"]'));
  for (const id of ['claude-code', 'kimi-code', 'zcode', 'deepseek-harness']) {
    await page.locator('#setup-harness').selectOption(id);
    assert.equal(await page.locator('#setup-harness-bind').innerText(), id === 'deepseek-harness' ? '生成接入补丁' : '配置连接');
    assert.equal(await page.locator('#setup-harness-open').isVisible(), false);
    assert.equal(ui.runtime, null, 'Choosing a harness cannot create a game or start a model');
  }
  pass('The real setup lists four new clients, labels the DSH patch action and hides unavailable GUI launches');
  await page.locator('#setup-harness').selectOption('continue');
  assert.equal(await page.locator('#setup-mcp-manual').isVisible(),true);
  assert.equal(await page.locator('#setup-harness-bind').isVisible(),false);
  await page.locator('#setup-harness').selectOption('codex');
  assert.equal(await page.locator('#setup-harness-scope').inputValue(),'isolated');
  assert.equal(await page.locator('#setup-harness-bind').isVisible(),true);
  assert.equal(await page.locator('#setup-harness-scope option[value="shared"]').isDisabled(),true);
  pass('Discovery-only clients retain manual exports, while Codex offers a generated isolated workspace without editing global TOML');
  await page.locator('#setup-harness').selectOption('workbuddy');
  await page.locator('#setup-harness-scope').selectOption('shared');
  assert.equal(ui.runtime, null, 'Client discovery must work before preparing a world');
  assert.equal(await page.locator('[data-ai-name="0"]').inputValue(), '待识别');
  await page.locator('#setup-harness-bind').click();
  await page.locator('#setup-harness-status').filter({hasText: '已配置'}).waitFor();
  assert.equal(await page.locator('#setup-mcp-manual').isVisible(), false);
  assert.equal(await page.locator('#setup-mcp-readiness').isVisible(), false);
  assert.equal(ui.runtime.connectionState(0).state, 'waiting');
  const uiClient = await attach(wbConfig, 'WorkBuddy UI check');
  await tool(uiClient, 'game_session');
  assert.equal(ui.runtime.game.players[0].controller.displayName, '待识别', 'Client branding must not become the model name');
  const beforeIdentity = ui.runtime.gameplayHash(), identityToken = ui.runtime.seatTokens.get(0);
  const invalidIdentity = await tool(uiClient, 'game_session', {model: 'invalid\nmodel'});
  assert.equal(invalidIdentity.error, true);
  assert.equal(ui.runtime.gameplayHash(), beforeIdentity);
  const firstModel = await tool(uiClient, 'game_session', {model: 'gemini-test-model'});
  assert.equal(firstModel.value.controllers.find(controller => controller.seat === 0).displayName, 'gemini-test-model');
  assert.equal(ui.runtime.seatTokens.get(0), identityToken, 'Renaming must not reissue control credentials');
  assert.notEqual(ui.runtime.gameplayHash(), beforeIdentity);
  const pendingId = ui.runtime.id;
  await page.waitForFunction(() => document.querySelector('[data-ai-name="0"]').value === 'gemini-test-model');
  assert.equal(await page.locator('[data-ai-name="0"]').getAttribute('readonly'), '');
  await tool(uiClient, 'game_session', {model: 'replacement-test-model'});
  await page.waitForFunction(() => document.querySelector('[data-ai-name="0"]').value === 'replacement-test-model');
  assert.equal(ui.runtime.id, pendingId, 'Model-name synchronization cannot recreate the pending world');
  assert.equal((await tool(uiClient, 'game_session')).value.controllers.find(controller => controller.seat === 0).displayName, 'replacement-test-model');
  const identityRecord=ui.runtime.replayRecord(),identityHash=ui.runtime.gameplayHash();
  const replayedIdentity = await MatchRuntime.replay(identityRecord);
  assert.equal(replayedIdentity.gameplayHash(), identityHash, 'Model identity must survive deterministic replay of the captured state');
  const foreignView = await ui.runtime.observe(ui.runtime.seatTokens.get(1));
  assert.equal(foreignView.value.controllers.find(controller => controller.seat === 0).known, false);
  assert.equal(JSON.stringify(foreignView.value).includes('replacement-test-model'), false);
  pass('Reported models automatically rename MCP civilizations and readonly fields, switch without rebinding, preserve replay and stay hidden before contact');
  await page.locator('[data-setup-client="0"] .setup-client-state').filter({hasText: '已连接'}).waitFor();
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 1000});
    if (width === 390) await page.locator('[data-setup-tab="leaders"]').click();
    await page.locator('#setup-harness').scrollIntoViewIfNeeded();
    const bounds = await page.locator('.setup-harness-actions').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    await page.screenshot({path: path.join(output, 'harness-' + width + '.png')});
  }
  await page.locator('#setup-harness').selectOption('');
  assert.equal(await page.locator('#setup-mcp-manual').isVisible(), true);
  const scanRoute = '**/api/lobby/harness/scan';
  await page.route(scanRoute, route => route.fulfill({status: 500, contentType: 'application/json', body: JSON.stringify({error: 'Synthetic discovery failed'})}));
  await page.locator('#setup-harness').selectOption('_scan');
  await page.locator('#setup-harness-status').filter({hasText: '扫描失败：Synthetic discovery failed'}).waitFor();
  assert.equal((await page.locator('#setup-harness-status').innerText()).includes('完整重启'), false);
  await page.unroute(scanRoute);
  await page.route(scanRoute, route => route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({clients: [], modelSelection: 'client'})}));
  await page.locator('#setup-harness').selectOption('_scan');
  await page.locator('#setup-harness-status').filter({hasText: '未发现支持的客户端'}).waitFor();
  await page.unroute(scanRoute);
  await page.locator('#setup-harness').selectOption('_scan');
  await page.waitForFunction(() => document.querySelector('#setup-harness option[value="workbuddy"]') && !document.querySelector('#setup-harness-status').textContent.includes('未发现'));
  assert.deepEqual(errors, []);
  await page.locator('[data-controller="1"]').selectOption('api');
  await page.locator('[data-ai-name="1"]').fill('My API label');
  await page.locator('[data-setup-client="1"]').click();
  await page.locator('#setup-api-model').fill('different-api-model');
  await page.locator('#setup-api-model').dispatchEvent('change');
  assert.equal(await page.locator('[data-ai-name="1"]').inputValue(), 'My API label');
  assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'), null);
  pass('API display names remain editable and never follow the provider model input automatically');
  pass('Discovery errors, genuine empty results and successful retries have distinct visible states');
  pass('Real setup UI discovers, binds and distinguishes configured from connected, keeps manual/API paths and fits 1440/390px');
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-controller="1"]').selectOption('agent');
  const isolatedClients=[],workspaces=[];
  for(const seat of [0,1]){
    await page.locator('[data-setup-client="'+seat+'"]').click();
    await page.locator('#setup-harness').selectOption('workbuddy');
    await page.locator('#setup-harness-scope').selectOption('isolated');
    await page.locator('#setup-harness-bind').click();
    await page.locator('#setup-harness-status').filter({hasText:'独立会话已配置'}).waitFor();
    const workspace=await page.locator('#setup-harness-workspace').inputValue();workspaces.push(workspace);
    assert.equal(await page.locator('#setup-harness-workspace').getAttribute('readonly'),'');
    assert.equal(await page.locator('#setup-harness-copy').isVisible(),true);
    isolatedClients.push(await attach(path.join(workspace,'.workbuddy','mcp.json'),'WorkBuddy identical UI brand'));
    assert.equal((await tool(isolatedClients.at(-1),'game_session',{model:seat?'kimi-fixture':'deepseek-fixture'})).value.seat,seat);
  }
  assert.notEqual(workspaces[0],workspaces[1]);
  assert.equal((await tool(isolatedClients[0],'game_session')).value.seat,0);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    await page.locator('#setup-harness-workspace').scrollIntoViewIfNeeded();
    const bounds=await page.locator('.setup-harness-workspace').boundingBox();
    assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);
    await page.screenshot({path:path.join(output,'instances-'+width+'.png')});
  }
  await page.locator('[data-setup-client="0"]').click();
  await page.locator('#setup-harness-unbind').click();
  await page.locator('#setup-harness-status').filter({hasText:'已解除文明绑定'}).waitFor();
  assert.equal((await tool(isolatedClients[0],'game_session')).error,true);
  assert.equal((await tool(isolatedClients[1],'game_session')).value.seat,1);
  assert.deepEqual(errors,[]);
  pass('The actual setup configures two same-brand WorkBuddy workspaces in one match, fits 1440/390px and selectively unbinds without moving the sibling session');
  await writeFile(path.join(output, 'checks.json'), JSON.stringify({passed: true, checks, realClients: true, clientProfiles: 'disposable only', paidModelCalls: false, productionSaveWrites: false}, null, 2));
} finally {
  await Promise.all(clients.map(client => client.close().catch(() => {})));
  if (browser) await browser.close();
  for (const lobby of lobbies) lobby.dispose();
}
