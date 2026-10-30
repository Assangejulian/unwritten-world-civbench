import auditBrowserRuntime from './browser-runtime.cjs';
// Exercise real cross-origin lobby navigation without touching the desktop or launching a model.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Lobby} from '../src/environment/lobby.mjs';
import {listen} from '../src/environment/http.mjs';

const require = createRequire(import.meta.url);
const {chromium} = auditBrowserRuntime.load('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/playwright/universe-only-20261020');
await mkdir(output, {recursive: true});
const checks = [];
const browser = await chromium.launch({headless: true, executablePath: auditBrowserRuntime.chromiumExecutable(), args: ['--use-angle=swiftshader']});
try {
  for (const [style, observer] of [['A', true], [null, true], ['B', false]]) {
    const lobby = new Lobby({stub: true});
    // Deliberately keep this front door separate from the match listener created by prepare().
    const front = await listen(null, {port: 0, lobby});
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
    context.setDefaultTimeout(90000);
    if (style) await context.addInitScript(value => localStorage.setItem('hex.uiStyle', value), style);
    try {
      const page = await context.newPage(), errors = [], posts = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {if (request.method() === 'POST') posts.push(new URL(request.url()).pathname);});
      await page.goto(`${front.url}/?ui=A#setup=${lobby.hostCapability}`, {waitUntil: 'domcontentloaded'});
      assert.equal(await page.locator('html').getAttribute('data-ui'), 'b');
      assert.equal(await page.locator('#menu-ui-style').count(), 0);
      assert.equal(await page.evaluate(() => typeof window.hexUiStyle), 'undefined');
      await page.locator('#menu-new').click();
      await page.locator('#setup-count').selectOption('2');
      await page.locator('#setup-size').selectOption('small');
      await page.locator('[data-controller="0"]').selectOption(observer ? 'agent' : 'human');
      if (observer) assert.equal(await page.locator('[data-ai-name="0"]').getAttribute('readonly'),'');
      await page.locator('[data-controller="1"]').selectOption(observer ? 'native' : 'agent');
      if (!observer) assert.equal(await page.locator('[data-ai-name="1"]').getAttribute('readonly'),'');
      await page.locator('#setup-observer').setChecked(observer);
      await page.locator('#setup-wait-policy').selectOption('wait');
      await page.locator('#setup-prepare').click();
      await page.waitForFunction(() => document.getElementById('setup-mcp-readiness')?.textContent.includes('0 / 1'));
      assert.notEqual(lobby.url, front.url, 'The regression must cross real local origins');
      const seed = await context.newPage();
      await seed.goto(lobby.url, {waitUntil: 'domcontentloaded'});
      await seed.evaluate(value => localStorage.setItem('hex.uiStyle', value), style === 'B' ? 'A' : 'B');
      await seed.close();
      await page.locator('#create-world').click();
      await page.waitForURL(url => url.origin === lobby.url, {timeout: 30000});
      await page.waitForFunction(role => window.__hexUiState?.session?.role === role, observer ? 'observer' : 'seat', {timeout: 60000});
      console.log('REACHED ' + style + '/' + (observer ? 'observer' : 'human'));
      const expected = 'b';
      assert.equal(await page.locator('html').getAttribute('data-ui'), expected, 'Every entry must use Universe, including retired preferences');
      assert.equal(await page.locator('#menu-ui-style').count(), 0);
      assert.equal(new URL(page.url()).searchParams.has('ui'), false);
      assert.equal(new URL(page.url()).searchParams.has('access'), false);
      const world = lobby.runtime.game.id;
      await page.reload({waitUntil: 'domcontentloaded'});
      await page.waitForFunction(role => window.__hexUiState?.session?.role === role, observer ? 'observer' : 'seat', {timeout: 60000});
      await page.waitForFunction(() => window.__civ?.renderer?.renderedFrames > 0 && !window.__civ.renderer.menuOpen, null, {timeout: 120000});
      assert.equal(await page.locator('html').getAttribute('data-ui'), expected);
      assert.equal(lobby.runtime.game.id, world);
      await page.locator('#b-hud').waitFor({state: 'attached', timeout: 60000});
      if (observer) {
        const hash = lobby.runtime.gameplayHash(), before = posts.filter(route => route === '/api/pause').length;
        await page.locator('#b-hud [data-b4-mainmenu]').click();
        assert.equal(await page.locator('#b4-mainmenu-dlg [data-b4-menu="save"]').isDisabled(), true);
        await page.locator('#b4-mainmenu-dlg [data-b4-menu="leave"]').click();
        await page.locator('#start-menu').waitFor({state: 'visible', timeout: 15000});
        assert.equal(await page.locator('#menu-ui-style').count(), 0);
        await page.locator('#menu-continue').click();
        await page.locator('#start-menu').waitFor({state: 'hidden', timeout: 60000});
        assert.equal(posts.filter(route => route === '/api/pause').length, before);
        assert.equal(lobby.runtime.gameplayHash(), hash);
        assert.equal(await page.evaluate(() => window.__hexUi.canControl(0)), false);
      }
      await page.screenshot({path: path.join(output, `${style}-${observer ? 'observer' : 'human'}.png`)});
      assert.deepEqual(errors, []);
      const name = `${style || 'fresh'}/${observer ? 'observer' : 'human'}: Universe only, retired query/storage ignored, cross-origin navigation, reload, access and presentation`;
      checks.push(name); console.log('PASS ' + name);
    } finally {
      await context.close(); lobby.dispose();
      await new Promise(resolve => front.server.close(resolve));
    }
  }
  await writeFile(path.join(output, 'checks.json'), JSON.stringify({passed: true, checks}, null, 2));
} finally {await browser.close();}
