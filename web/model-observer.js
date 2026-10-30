// Optional host observation. Never exported through the player-equivalent UI bridge.
export function createModelObserver({api, configure, refresh, toast, onOpen}) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const root = document.createElement('section'); root.id = 'model-observer'; root.hidden = true;
  root.innerHTML = `<button id="model-observer-toggle" aria-expanded="false" aria-controls="model-observer-panel" title="模型观察" aria-label="模型观察">◈</button>
    <section id="model-observer-panel" aria-label="模型观察" hidden>
      <header><select id="model-observer-civ" aria-label="选择观察文明"></select><select id="model-observer-mode" aria-label="观察内容"><option value="dialogue">对话</option><option value="reasoning">推理</option><option value="tool">操作</option></select><details id="model-observer-menu"><summary aria-label="模型管理" title="模型管理">⋯</summary><div id="model-observer-controls"></div></details><button id="model-observer-close" aria-label="关闭模型观察">×</button></header>
      <p id="model-observer-health" role="status"></p>
      <div id="model-observer-entries" tabindex="0" aria-label="模型记录"></div>
    </section>`;
  document.getElementById('app').append(root);
  const $ = id => root.querySelector('#'+id), cache = new Map();
  let snapshot, seat = null, tab = 'dialogue', busy = false, lastPoll = 0, match = null;
  function open(value) {
    onOpen?.();
    if (Number.isInteger(value)) {seat = value; $('model-observer-civ').value = String(value);}
    $('model-observer-panel').hidden = false; $('model-observer-toggle').setAttribute('aria-expanded', 'true');
    lastPoll = 0; paint(); void poll();
  }
  function close(focus = true) {$('model-observer-panel').hidden = true; $('model-observer-toggle').setAttribute('aria-expanded', 'false'); if(focus)$('model-observer-toggle').focus();}
  $('model-observer-toggle').onclick = () => $('model-observer-panel').hidden ? open() : close();
  $('model-observer-close').onclick = () => close();
  $('model-observer-civ').onchange = event => {seat = Number(event.target.value); lastPoll = 0; paint(); void poll();};
  $('model-observer-mode').onchange = event => {tab=event.target.value;paint();};
  root.addEventListener('click', async event => {
    const target = event.target.closest('button'); if (!target) return;
    $('model-observer-menu').open=false;
    if (target.dataset.managedConfig !== undefined) configure(Number(target.dataset.managedConfig));
    for (const [key, action] of [['managedStop','stop'],['managedResume','resume']]) if (target.dataset[key] !== undefined) {
      target.disabled = true; try {await api('lobby/agent/'+action, {seat:Number(target.dataset[key])}); await refresh(true);} catch (error) {toast(error.message,true); target.disabled = false;}
    }
  });
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && !$('model-observer-panel').hidden) {close(); event.preventDefault(); event.stopImmediatePropagation();}}, true);
  document.addEventListener('hex:model-observe', event => open(Number(event.detail.seat)));
  function runs() {return (snapshot?.session?.managedRuns || []).filter(run => snapshot.view < 0 || run.seat === snapshot.view);}
  function paint() {
    const run = runs().find(item => item.seat === seat), operator = !!sessionStorage.getItem('hex-civ-host');
    const controls = run && operator ? `${run.provider === 'api' && !run.complete && run.state !== 'ended' ? `<button data-managed-config="${seat}">API 设置</button>` : ''}${!run.complete && run.state !== 'ended' ? run.paused ? `<button data-managed-resume="${seat}">继续 AI</button>` : `<button data-managed-stop="${seat}">停止 AI</button>` : ''}` : '';
    if ($('model-observer-controls').innerHTML !== controls) $('model-observer-controls').innerHTML = controls;
    $('model-observer-menu').hidden=!controls;
    $('model-observer-health').textContent = run?.error || (run?.paused ? '已停止，可继续当前对局。' : '');
    $('model-observer-health').classList.toggle('model-error',!!run?.error);
    const data = cache.get(seat), entries = (data?.entries || []).filter(item => item.type === tab || tab === 'tool' && ['context','recovering'].includes(item.type));
    const box = $('model-observer-entries'), opened = new Set([...box.querySelectorAll('details[open]')].map(item=>item.dataset.entry));
    const fidelity = {provider_text:'原文', provider_reasoning_content:'服务商推理字段', provider_summary:'服务商摘要', encrypted_unavailable:'加密不可读', tool_result:'工具回执', compressed_summary:'压缩摘要'};
    const html = entries.length ? entries.slice(-60).reverse().map((item,index) => `<details data-entry="${item.id}" ${opened.has(String(item.id)) || box.dataset.viewKey !== seat+':'+tab && index === 0 ? 'open' : ''}><summary>第 ${esc(item.turn ?? '—')} 回合 · ${esc(item.name || ({dialogue:'对话',reasoning:'推理',context:'上下文整理',recovering:'连接恢复'}[item.type] || '操作'))}${fidelity[item.fidelity] ? ' · ' + fidelity[item.fidelity] : ''}${item.ok === false ? ' · 未执行' : ''}</summary><pre>${esc(item.text)}</pre></details>`).join('') : `<p class="model-observer-empty">${!operator ? '当前凭证可观战，模型记录由房主查看。' : !window.__modelObserverAvailable ? '完整重启后台后可加载模型记录；当前对局仍可继续。' : data?.source === 'external' ? '外部 MCP 客户端未向游戏提供对话或推理。游戏无法读取客户端内部记录。' : tab === 'reasoning' ? '这里显示服务商实际返回的推理字段。若只有加密推理或服务商摘要，会标明，不会编造思维链。' : '等待模型返回记录。'}</p>`;
    const key = seat+':'+tab+':'+(data?.next || 0)+':'+operator;
    if (box.dataset.key !== key) {box.dataset.key = key; box.dataset.viewKey=entries.length?seat+':'+tab:''; box.innerHTML = html;}
  }
  async function poll() {
    if (busy || root.hidden || $('model-observer-panel').hidden || !sessionStorage.getItem('hex-civ-host') || !window.__modelObserverAvailable || Date.now() - lastPoll < 1500 || seat === null) return;
    busy = true; lastPoll = Date.now(); const selected = seat, world = match, old = cache.get(selected);
    try {
      const data = await api('lobby/agent/trace', {seat:selected, after:old?.next || 0});
      if (match !== world) return;
      // A replaced worker has its own cursor; refetch rather than mixing sessions.
      if (old?.run && old.run !== data.run) {cache.delete(selected); lastPoll = 0; return;}
      cache.set(selected, {...data, entries:[...(old?.entries || []), ...data.entries].slice(-256)});
      if (seat === selected) paint();
    } catch {if (seat === selected) $('model-observer-health').textContent = '观察记录暂不可用；完整重启后台后可加载新版观察功能。';}
    finally {busy = false;}
  }
  return {close,update(value) {
    snapshot = value;
    if (match !== value.game?.id) {match = value.game?.id; cache.clear(); seat = null;}
    const list = runs(); root.hidden = !list.length;
    const html = list.map(run => `<option value="${run.seat}">${esc(value.game.players.find(player=>player.id===run.seat)?.name)}【${esc(run.displayName || 'AI')}】</option>`).join('');
    if ($('model-observer-civ').innerHTML !== html) $('model-observer-civ').innerHTML = html;
    if (!list.some(run=>run.seat===seat)) seat = list[0]?.seat ?? null;
    $('model-observer-civ').value = String(seat); paint(); void poll();
  }};
}
