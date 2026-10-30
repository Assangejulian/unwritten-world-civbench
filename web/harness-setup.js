// The game configures the local MCP connection; model choice stays with its client.
export function mountHarnessSetup(root, ctx) {
  root.className = 'setup-harness'; root.hidden = true;
  root.innerHTML = '<div class="setup-harness-actions"><select id="setup-harness" aria-label="MCP 客户端"><option value="">手动配置</option></select><select id="setup-harness-scope" aria-label="会话配置" hidden><option value="isolated">独立会话</option><option value="shared">默认配置</option></select><button type="button" id="setup-harness-bind" class="button-primary">配置连接</button><button type="button" id="setup-harness-open" class="button-secondary">打开客户端</button><button type="button" id="setup-harness-unbind" class="button-secondary" hidden>解除</button></div><div class="setup-harness-workspace" hidden><input id="setup-harness-workspace" aria-label="独立会话工作目录" readonly><button type="button" id="setup-harness-copy" class="button-secondary">复制目录</button></div><p id="setup-harness-status" role="status" aria-live="polite"></p>';
  const $ = id => root.querySelector('#' + id), choices = new Map(), messages = new Map(), scopes = new Map(), instances = new Map(), directories = new Map();
  let clients = [], scanned = false, scanning = false, busy = false, scanMessage = '';
  const choice = () => clients.find(client => client.id === choices.get(ctx.seat()));
  const key = (seat, client) => seat + ':' + client?.id;
  const scope = (seat, client) => scopes.get(key(seat,client)) || (client?.canIsolate && client.seat !== seat ? 'isolated' : 'shared');
  const boundInstance = (seat, client) => client?.instances?.find(row => row.seat === seat);
  async function scan() {
    if (scanning) return;
    scanning = true;
    scanMessage = '';
    try {
      const result = await ctx.api('lobby/harness/scan', {});
      if (!Array.isArray(result.clients)) throw Error('客户端扫描返回格式无效。');
      clients = result.clients; scanned = true;
      if (!clients.length) scanMessage = '未发现支持的客户端；可打开客户端后重新扫描，或使用手动配置。';
    }
    catch (error) {
      scanned = true;
      scanMessage = /Unknown.*route|尚未加载/i.test(error.message)
        ? '当前后台尚未加载自动配置，请完整重启游戏。'
        : '扫描失败：' + (error.message || '请重新扫描。');
    }
    finally {scanning = false; sync();}
  }
  function sync() {
    const seat = ctx.seat(), visible = Number.isInteger(seat) && ctx.isMcp(seat);
    root.hidden = !visible;
    if (!visible) return;
    if (!scanned && !scanning) void scan();
    const bound = clients.find(client => client.seat === seat || boundInstance(seat,client));
    if (!choices.has(seat) && bound) choices.set(seat, bound.id);
    const selected = choices.get(seat) || '';
    const options = [{id: '', name: scanning ? '正在扫描客户端…' : '手动配置'}, ...clients, {id: '_scan', name: '重新扫描…'}];
    if ($('setup-harness').dataset.options !== JSON.stringify(options)) {
      $('setup-harness').replaceChildren(...options.map(client => new Option(client.name + (client.running ? ' · 运行中' : ''), client.id)));
      $('setup-harness').dataset.options = JSON.stringify(options);
    }
    $('setup-harness').value = selected;
    const client = choice();
    const isolated = scope(seat,client) === 'isolated', configurable = !!client && (isolated ? client.canIsolate : !['manual','workspace'].includes(client.setup));
    const instance = boundInstance(seat,client);
    if (instance) instances.set(key(seat,client),instance.id);
    $('setup-harness-scope').hidden = !client?.canIsolate;
    $('setup-harness-scope').value = isolated ? 'isolated' : 'shared';
    $('setup-harness-scope').querySelector('[value="shared"]').disabled = ['manual','workspace'].includes(client?.setup);
    $('setup-harness-bind').textContent = client?.setup === 'patch' ? '生成接入补丁' : '配置连接';
    ctx.manual.hidden = configurable;
    ctx.readiness.hidden = configurable;
    $('setup-harness-bind').hidden = !configurable;
    $('setup-harness-open').hidden = !client || !client.canOpen;
    $('setup-harness-unbind').hidden = !client || !(isolated ? instance : client.seat === seat);
    const directory = isolated && directories.get(key(seat,client));
    $('setup-harness-workspace').parentElement.hidden = !directory;
    $('setup-harness-workspace').value = directory || '';
    $('setup-harness').disabled = busy;
    $('setup-harness-scope').disabled = busy;
    $('setup-harness-bind').disabled = busy;
    $('setup-harness-open').disabled = busy || !client?.canOpen;
    $('setup-harness-unbind').disabled = busy;
    $('setup-harness-status').textContent = scanning ? '正在扫描客户端…' : scanMessage || messages.get(seat) || (client ? configurable ? isolated ? '为此文明生成独立工作目录，在客户端打开后新建对话。' : '在客户端选择模型并新建对话，启用 CivBench MCP。' : '已发现客户端，请使用手动配置。' : '');
  }
  $('setup-harness').onchange = () => {
    if ($('setup-harness').value === '_scan') {void scan(); sync(); return;}
    choices.set(ctx.seat(), $('setup-harness').value);
    messages.delete(ctx.seat());
    const client = choice();
    if (client) ctx.name(client.name);
    sync();
  };
  $('setup-harness-scope').onchange = () => {
    scopes.set(key(ctx.seat(),choice()),$('setup-harness-scope').value);
    messages.delete(ctx.seat());sync();
  };
  async function run(operation) {
    if (busy || !choice()) return;
    const seat = ctx.seat(), client = choice(); busy = true; sync();
    const isolated = scope(seat,client) === 'isolated', instance = instances.get(key(seat,client));
    try {
      if (operation === 'bind') {
        await ctx.prepare();
        const result = await ctx.api('lobby/harness/bind', {seat, harness: client.id, ...(isolated ? {isolated:true, ...(instance ? {instance} : {})} : {})});
        if (result.instance) instances.set(key(seat,client),result.instance);
        if (result.workspace) directories.set(key(seat,client),result.workspace);
        messages.set(seat, result.message);
      } else {
        await ctx.api('lobby/harness/' + operation, {harness: client.id, ...(operation === 'unbind' && isolated ? {instance,seat} : {})});
        if (operation === 'unbind') {messages.set(seat, '已解除文明绑定。');directories.delete(key(seat,client));instances.delete(key(seat,client));}
      }
      if (operation !== 'open') {await scan(); await ctx.refresh();}
    } catch (error) {messages.set(seat, error.message); ctx.toast(error.message, true);}
    finally {busy = false; sync();}
  }
  $('setup-harness-bind').onclick = () => run('bind');
  $('setup-harness-open').onclick = () => run('open');
  $('setup-harness-unbind').onclick = () => run('unbind');
  $('setup-harness-copy').onclick = async () => {
    try {await navigator.clipboard.writeText($('setup-harness-workspace').value);messages.set(ctx.seat(),'工作目录已复制。');}
    catch { $('setup-harness-workspace').select();messages.set(ctx.seat(),'请复制已选中的工作目录。');}
    sync();
  };
  return {sync};
}
