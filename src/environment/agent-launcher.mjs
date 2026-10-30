// Host-owned local clients. Each process receives exactly one seat credential.
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync, openSync, readSync, closeSync, fstatSync} from 'node:fs';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {EnvironmentError} from './match.mjs';
import {normalizeModelApi, checkModelApi} from './model-api.mjs';
import {ModelContextStore, contextPath} from './model-context-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BLOCKED_BUILTINS = 'run_terminal_command,read_file,search_replace,list_dir,grep,kill_command_or_subagent,get_command_or_subagent_output,scheduler_create,scheduler_delete,scheduler_list,monitor,workflow,enter_plan_mode,exit_plan_mode,ask_user_question,send_feedback,web_search,web_fetch,image_gen,image_edit,image_to_video,reference_to_video,write';

export function readClientCompletion(file, sessionId, startedAt) {
  let descriptor;
  try {
    descriptor = openSync(file, 'r');
    const size = fstatSync(descriptor).size;
    const bytes = Buffer.alloc(Math.min(size, 1024 * 1024));
    readSync(descriptor, bytes, 0, bytes.length, Math.max(0, size - bytes.length));
    for (const line of bytes.toString('utf8').split('\n').reverse()) {
      let event; try {event = JSON.parse(line);} catch {continue;}
      if (event.params?.sessionId !== sessionId || event.params?.update?.sessionUpdate !== 'turn_completed') continue;
      if (Number(event.timestamp) * 1000 < Date.parse(startedAt) - 1000) continue;
      return {reason: event.params.update.stop_reason, category: event.params._meta?.cancellationCategory || null};
    }
  } catch {} finally {if (descriptor !== undefined) closeSync(descriptor);}
  return null;
}

export class AgentLauncher {
  #apiSettings = new WeakMap();
  constructor({executable = path.join(homedir(), '.grok/bin/grok.exe'), spawnClient = spawn, outputRoot = path.join(ROOT, 'output/managed-agents')} = {}) {
    this.executable = executable;
    this.spawnClient = spawnClient;
    this.outputRoot = outputRoot;
    this.runs = new Map();
  }

  async start(lobby, {seat, rounds = 50, provider = 'grok', api, resumeOnly = false} = {}) {
    if (!['grok', 'api'].includes(provider)) throw new EnvironmentError('invalid_action', '请选择 Grok Build 或模型 API；其他 MCP 客户端可手动连接。');
    if (provider === 'grok' && rounds === null) throw new EnvironmentError('invalid_action', '持续对局请通过通用 MCP 连接；本机 Grok 启动器仅保留有界测试用途。');
    const modelApi = provider === 'api' ? normalizeModelApi(api) : null;
    if (!Number.isInteger(seat) || rounds !== null && (!Number.isInteger(rounds) || rounds < 1 || rounds > 500)) throw new EnvironmentError('invalid_action', '请使用有效的文明和回合设置。');
    const runtime = lobby.runtime;
    if (!runtime || runtime.game.players[seat]?.controller?.kind !== 'agent') throw new EnvironmentError('not_started', '请先准备一个外部 AI 席位。');
    const existing = this.runs.get(seat);
    if (existing && ['starting', 'running'].includes(existing.state)) {
      if (existing.runtime === runtime && existing.token === runtime.seatTokens.get(seat)) {
        const changedApi = modelApi && ['model', 'endpoint', 'protocol', 'apiKey', 'maxOutputTokens', 'timeoutSeconds', 'tokenParameter'].some(key => this.#apiSettings.get(existing)?.[key] !== modelApi[key]);
        if (existing.provider !== provider || changedApi) throw new EnvironmentError('client_running', '该席位已有运行中的客户端，请先停止再更换接入配置。', 409);
        if (existing.target !== rounds) throw new EnvironmentError('client_running', '该席位正在试玩，请先停止，再更改目标回合。', 409);
        return this.status(seat);
      }
      this.finish(existing, 'failed', '原有席位已失效。');
    }
    if (existing?.child?.exitCode === null) await this.waitForExit(existing);
    if (lobby.runtime !== runtime) throw new EnvironmentError('not_started', '准备中的对局已更换，请重新接入。');
    if (this.runs.get(seat) !== existing) return this.start(lobby, {seat, rounds, provider, api, resumeOnly});
    if (resumeOnly && runtime.managedPlayProgress(seat)?.complete) throw new EnvironmentError('managed_complete', '已完成本次目标回合。');
    if (modelApi) return this.startApi(lobby, {seat, rounds, modelApi, existing});
    if (!existsSync(this.executable)) throw new EnvironmentError('client_missing', '未找到本机 Grok Build，请先安装并登录。');
    const card = lobby.copy(seat);
    const id = randomUUID();
    const directory = path.join(this.outputRoot, id);
    mkdirSync(path.join(directory, '.grok'), {recursive: true});
    // Disable inherited MCP servers only inside this generated client directory.
    let disabled = '';
    try {
      const globalConfig = readFileSync(path.join(homedir(), '.grok/config.toml'), 'utf8');
      const names = [...globalConfig.matchAll(/^\[mcp_servers\.([A-Za-z0-9_-]+)\]\s*$/gm)].map(match => match[1]);
      // A disabled definition must still have a transport to pass Grok validation.
      disabled = names.filter(name => name !== `hex_seat_${seat}`).map(name => `\n[mcp_servers.${name}]\ncommand = ${JSON.stringify(process.execPath)}\nargs = ["-e", "process.exit(0)"]\nenabled = false\n`).join('');
    } catch {}
    writeFileSync(path.join(directory, '.grok/config.toml'), card.toml + '\n' + disabled, {mode: 0o600});
    const prompt = `你通过 MCP hex_seat_${seat} 下自己的这一席，目标是完成 ${rounds} 个自己的回合，不是 ${rounds} 次工具调用。\n` +
      '对局还没开始时，用 game_events 等待，不要结束这次回复。开始后直接看 summary，用 game_act 或 game_batch 做合法行动，再 game_end_turn。需要时再按类型查 game_options，或用 game_rules 查一条规则。不要翻整本目录、整张地图或浏览器点击。\n' +
      '提交时去掉 preview。多回合移动用 route。沿用 next_observation_token。不是你的回合就等。managedPlay.complete、终局或被淘汰时停，并用中文如实说明实际决定。\n';
    writeFileSync(path.join(directory, 'prompt.txt'), prompt);
    const run = {id, seat, provider, target: rounds, directory, runtime, token: card.env.CIV_MATCH_TOKEN, state: 'starting', error: null, startedAt: new Date().toISOString(), lastActivity: Date.now(), lastProgress: Date.now(), completed: 0, sessionId: id,
      sessionLog: path.join(homedir(), '.grok/sessions', encodeURIComponent(directory), id, 'updates.jsonl')};
    runtime.setManagedPlay(seat, rounds, !!existing && existing.runtime === runtime && existing.token === card.env.CIV_MATCH_TOKEN);
    this.runs.set(seat, run);
    const args = ['--cwd', directory, '--session-id', id, '--prompt-file', path.join(directory, 'prompt.txt'), '--output-format', 'streaming-json', '--no-subagents', '--disable-web-search', '--disallowed-tools', BLOCKED_BUILTINS, '--reasoning-effort', 'medium', '--always-approve', '--max-turns', String(Math.min(1500, rounds * 24 + 40))];
    try {
      const env = {...process.env};
      delete env.CIV_MATCH_TOKEN; delete env.CIV_MATCH_URL;
      run.child = this.spawnClient(this.executable, args, {cwd: directory, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
      run.child.stdout.on('data', chunk => {
        run.lastActivity = Date.now();
        appendFileSync(path.join(directory, 'transcript.jsonl'), chunk);
      });
      run.child.stderr.on('data', chunk => appendFileSync(path.join(directory, 'stderr.log'), String(chunk).split(run.token).join('[redacted]')));
      run.child.once('error', error => this.finish(run, 'failed', `Grok 启动失败：${error.code || 'unknown'}`));
      run.child.once('exit', () => {
        if (['starting', 'running'].includes(run.state)) {
          const progress = runtime.managedPlayProgress(seat);
          this.finish(run, progress?.complete ? 'completed' : 'failed', progress?.complete ? null : 'Grok 已停止，尚未完成目标回合；可重新接入继续。');
        }
      });
      run.timer = setInterval(() => this.tick(run), 1000);
      run.timer.unref();
      this.persist(run);
      return this.status(seat);
    } catch (error) {
      this.finish(run, 'failed', '无法启动 Grok，请检查安装和登录状态。');
      throw new EnvironmentError('client_failed', run.error);
    }
  }

  checkApi(api, {lobby, seat, keepExistingKey = false} = {}) {
    return checkModelApi(this.apiInput(lobby, seat, api, keepExistingKey));
  }

  waitForExit(run) {
    if (run.child?.exitCode !== null) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const done = () => {clearTimeout(timer); run.child.removeListener('exit', done); resolve();};
      const timer = setTimeout(() => {run.child.removeListener('exit', done); reject(new EnvironmentError('client_stopping', '原客户端仍在退出，请稍后继续接入。'));}, 5000);
      run.child.once('exit', done);
      if (run.child.exitCode !== null) done();
    });
  }

  apiInput(lobby, seat, api, keepExistingKey) {
    if (!keepExistingKey || api?.apiKey) return api;
    const run = this.runs.get(seat);
    if (!run || run.provider !== 'api' || run.runtime !== lobby?.runtime || run.token !== lobby?.runtime?.seatTokens.get(seat)) throw new EnvironmentError('not_started', '原 API 席位已失效，请重新填写密钥。');
    return {...api, apiKey: this.#apiSettings.get(run)?.apiKey || ''};
  }

  apiProfile(lobby, seat) {
    const run = this.runs.get(seat);
    if (!run || run.provider !== 'api' || run.runtime !== lobby.runtime || run.token !== lobby.runtime?.seatTokens.get(seat)) throw new EnvironmentError('not_started', '找不到当前 API 席位。');
    const config = this.#apiSettings.get(run);
    if (!config) throw new EnvironmentError('not_started', '连接配置已释放，请重新准备席位。');
    return {seat, rounds: run.target, hasKey: !!config.apiKey, api: {baseUrl: config.endpoint.replace(/\/(?:chat\/completions|responses)$/, ''), model: config.model, protocol: config.protocol, maxOutputTokens: config.maxOutputTokens, timeoutSeconds: config.timeoutSeconds, tokenParameter: config.tokenParameter, contextTokens: config.contextTokens}};
  }

  async updateApi(lobby, {seat, api, keepExistingKey = true}) {
    const run = this.runs.get(seat);
    this.apiProfile(lobby, seat);
    if (run.runtime.managedPlayProgress(seat)?.complete) throw new EnvironmentError('managed_complete', '已完成本次目标回合。');
    const modelApi = normalizeModelApi(this.apiInput(lobby, seat, api, keepExistingKey));
    // Validate before stopping an existing client; an invalid edit leaves the current one running.
    this.stop(seat);
    return this.start(lobby, {seat, rounds: run.target, provider: 'api', api: {...modelApi, baseUrl: modelApi.endpoint}, resumeOnly: true});
  }

  startApi(lobby, {seat, rounds, modelApi, existing}) {
    if (!existsSync(path.join(ROOT, 'environment/mcp/node_modules/@modelcontextprotocol/sdk/package.json'))) throw new EnvironmentError('mcp_missing', 'MCP 依赖尚未安装，请先在 environment/mcp 目录执行 npm install。');
    const runtime = lobby.runtime, card = lobby.copy(seat), id = randomUUID(), directory = path.join(this.outputRoot, id);
    mkdirSync(directory, {recursive: true});
    const run = {id, seat, provider: 'api', model: modelApi.model, endpoint: modelApi.endpoint, protocol: modelApi.protocol, target: rounds, directory, runtime, token: card.env.CIV_MATCH_TOKEN, state: 'starting', error: null, startedAt: new Date().toISOString(), lastActivity: Date.now(), lastProgress: Date.now(), completed: 0, requests: 0, inputTokens: 0, outputTokens: 0};
    runtime.setManagedPlay(seat, rounds, !!existing && existing.runtime === runtime && existing.token === run.token);
    this.runs.set(seat, run);
    this.#apiSettings.set(run, {...modelApi, baseUrl: modelApi.endpoint});
    try {
      const env = {...process.env};
      delete env.CIV_MATCH_TOKEN; delete env.CIV_MATCH_URL;
      // A private pipe carries credentials; neither argv nor a generated configuration contains them.
      run.child = this.spawnClient(process.execPath, [path.join(ROOT, 'environment/mcp/api-player.mjs')], {cwd: ROOT, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
      run.child.stdin.on('error', () => {});
      if (existing?.runtime === runtime && existing.token === run.token) run.memory = existing.memory;
      run.child.stdin.end(JSON.stringify({api: {...modelApi, baseUrl: modelApi.endpoint}, url: card.env.CIV_MATCH_URL, token: run.token, target: rounds, memory:run.memory}));
      let pending = '';
      run.child.stdout.setEncoding('utf8');
      run.child.stdout.on('data', chunk => {
        if (!['starting', 'running'].includes(run.state)) return;
        run.lastActivity = Date.now(); pending += chunk.toString('utf8');
        const lines = pending.split('\n'); pending = lines.pop();
        if (pending.length > 65536) {pending = ''; this.finish(run, 'failed', 'API 玩家返回了过大的状态消息。'); return;}
        for (const line of lines) {
          let value; try {value = JSON.parse(line);} catch {continue;}
          if (value.type === 'usage') for (const field of ['requests', 'inputTokens', 'outputTokens']) if (Number.isSafeInteger(value[field]) && value[field] >= 0) run[field] = value[field];
          if (value.type === 'usage' && typeof value.usageReported === 'boolean') run.usageReported = value.usageReported;
          if (value.type === 'failed') {
            // Errors emitted by our worker are fixed user-facing messages, never provider response bodies.
            this.finish(run, 'failed', typeof value.error === 'string' ? value.error.slice(0, 200) : 'API 玩家运行失败。');
          }
          if (value.type === 'connected') run.state = 'running';
          if (value.type === 'checkpoint' && value.memory && typeof value.memory === 'object') run.memory = value.memory;
          if (value.type === 'recovering') {run.error = String(value.error || '模型连接异常，正在重试。').slice(0, 200); run.recovering = true;}
          if (value.type === 'recovered') {run.error = null; run.recovering = false; run.lastProgress = Date.now();}
          if (['dialogue', 'reasoning', 'tool', 'context', 'recovering'].includes(value.type)) this.recordTrace(run, value);
          if (['usage', 'completed', 'ended'].includes(value.type)) appendFileSync(path.join(directory, 'activity.jsonl'), JSON.stringify(value) + '\n');
          if (['connected','recovering','recovered','usage'].includes(value.type)) this.persist(run);
        }
      });
      // Only fixed worker status is recorded. Stderr from SDK/provider internals is intentionally not persisted.
      run.child.stderr.on('data', () => {run.lastActivity = Date.now();});
      run.child.once('error', () => this.finish(run, 'failed', '无法启动 API 玩家进程。'));
      run.child.once('exit', () => {
        if (!['starting', 'running'].includes(run.state)) return;
        const progress = runtime.managedPlayProgress(seat);
        const terminal = runtime.game.winner || !runtime.game.players[seat].alive;
        this.finish(run, progress?.complete ? 'completed' : terminal ? 'ended' : 'failed', progress?.complete || terminal ? null : 'API 玩家已退出，可重新接入当前对局。');
      });
      run.timer = setInterval(() => this.tick(run), 1000); run.timer.unref();
      this.persist(run); return this.status(seat);
    } catch {
      this.finish(run, 'failed', '无法启动 API 玩家，请检查接口配置。');
      throw new EnvironmentError('client_failed', run.error);
    }
  }

  tick(run) {
    if (!['starting', 'running'].includes(run.state)) return;
    if (run.runtime.seatTokens.get(run.seat) !== run.token) return this.finish(run, 'failed', '席位凭证已失效，请重新接入。');
    const progress = run.runtime.managedPlayProgress(run.seat);
    if (!run.runtime.started) run.lastProgress = Date.now();
    if (progress?.completed !== run.completed) {run.completed = progress.completed; run.lastProgress = Date.now(); this.persist(run);}
    if (progress?.complete) return this.finish(run, 'completed');
    if (run.runtime.game.winner || !run.runtime.game.players[run.seat].alive) return this.finish(run, 'ended');
    const completion = run.provider === 'grok' && readClientCompletion(run.sessionLog, run.sessionId, run.startedAt);
    if (completion) return this.finish(run, 'failed', completion.category === 'max_turns_reached' ? 'Grok 达到本次调用上限；可一键接入继续剩余回合。' : `Grok 已结束本次运行，完成 ${run.completed} / ${run.target} 回合；可一键接入继续。`);
    if (run.runtime.connectionState(run.seat).state === 'connected') run.state = 'running';
    const ownTurn = run.provider !== 'api' || run.runtime.simulation.activePlayer === run.seat;
    if (Date.now() - run.lastActivity > 600000 || (run.runtime.started && ownTurn && !run.recovering && Date.now() - run.lastProgress > 1200000)) return this.finish(run, 'failed', 'AI 长时间没有进展，已停止；可重新接入。');
    if (run.target !== null && Date.now() - Date.parse(run.startedAt) > 10800000) return this.finish(run, 'failed', '达到三小时运行上限，已停止。');
    this.persist(run);
  }

  finish(run, state, error = null) {
    if (!['starting', 'running'].includes(run.state)) return;
    run.completed = run.runtime.managedPlayProgress(run.seat)?.completed || 0;
    run.state = state; run.error = error; run.endedAt = new Date().toISOString();
    clearInterval(run.timer);
    run.contextStore?.close();
    run.contextStore = null;
    run.runtime.pauseManagedPlay(run.seat);
    if (run.child && run.child.exitCode == null && !run.child.killed) {
      if (process.platform === 'win32' && Number.isInteger(run.child.pid)) {
        // Only this owned child tree is terminated; never target a global Grok leader.
        const stop = spawn('taskkill.exe', ['/PID', String(run.child.pid), '/T', '/F'], {windowsHide: true, stdio: 'ignore'});
        stop.on('error', () => run.child.kill());
      } else run.child.kill();
    }
    this.persist(run);
  }

  status(seat, expectedRuntime = null) {
    const run = this.runs.get(seat);
    if (!run || (expectedRuntime && run.runtime !== expectedRuntime)) return null;
    const completed = run.runtime.managedPlayProgress(seat)?.completed ?? run.completed;
    return {id: run.id, seat, provider: run.provider, ...(run.provider === 'api' ? {match_id: run.runtime.id, model: run.model, protocol: run.protocol, requests: run.requests, inputTokens: run.inputTokens, outputTokens: run.outputTokens, usageReported: !!run.usageReported} : {}), state: run.state, completed, target: run.target, error: run.error, startedAt: run.startedAt, endedAt: run.endedAt || null};
  }

  persist(run) {
    const managed = run.runtime.managedPlay.get(run.seat);
    if (managed && run.provider === 'api') managed.client = {provider: 'api', model: run.model, state: run.state, error: run.error, requests: run.requests, inputTokens: run.inputTokens, outputTokens: run.outputTokens, usageReported: !!run.usageReported};
    writeFileSync(path.join(run.directory, 'status.json'), JSON.stringify(this.status(run.seat), null, 2));
  }

  recordTrace(run, value) {
    // This host-only ring is never part of saves, seat observations or game UI tools.
    let text = String(value.text || value.error || (value.type === 'context' ? '已整理较早的对话与工具记录，保留当前局面及近期操作。' : ''));
    for (const secret of [run.token, this.#apiSettings.get(run)?.apiKey]) if (secret) text = text.split(secret).join('[redacted]');
    text = text.replace(/("(?:observation_token|next_observation_token|access_token|apiKey|token)"\s*:\s*")[^"]*"/g, '$1[redacted]"');
    run.traceSequence = (run.traceSequence || 0) + 1;
    (run.trace ||= []).push({id: run.traceSequence, type: value.type, turn: value.turn, name: value.name, ok: value.ok, fidelity: value.fidelity || null, text, time: new Date().toISOString()});
    if (run.trace.length > 256) run.trace.splice(0, run.trace.length - 256);
  }

  trace(lobby, seat, after = 0) {
    const run = this.runs.get(seat);
    if (!run || run.runtime !== lobby.runtime) return {run: null, entries: [], next: 0, source: 'external'};
    try {
      const file = contextPath(ROOT, run.runtime.id);
      if (existsSync(file)) {
        run.contextStore ||= new ModelContextStore(file);
        const stats = run.contextStore.stats(seat);
        if (stats.events) {
          const entries = run.contextStore.events(seat, after);
          return {run: run.id, entries, next: entries.at(-1)?.id || Number(after) || stats.events, source: run.provider};
        }
      }
    } catch {}
    return {run: run.id, entries: (run.trace || []).filter(item => item.id > Number(after || 0)), next: run.traceSequence || 0, source: run.provider};
  }

  resume(lobby, seat) {
    const run = this.runs.get(seat);
    if (!run || run.runtime !== lobby.runtime) return this.controlExternal(lobby, seat, false);
    if (!run || run.runtime !== lobby.runtime || run.token !== lobby.runtime?.seatTokens.get(seat)) throw new EnvironmentError('not_started', '原席位已失效，请重新准备连接。');
    if (run.runtime.managedPlayProgress(seat)?.complete) throw new EnvironmentError('managed_complete', '已完成本次目标回合。');
    return this.start(lobby, {seat, rounds: run.target, provider: run.provider, resumeOnly: true, ...(run.provider === 'api' ? {api: this.#apiSettings.get(run)} : {})});
  }

  controlExternal(lobby, seat, paused) {
    const runtime = lobby?.runtime;
    if (!Number.isInteger(seat) || runtime?.game.players[seat]?.controller?.kind !== 'agent') throw new EnvironmentError('invalid_action', '请选择一个外部 AI 文明。');
    runtime.setManagedPlay(seat, null, true);
    const managed = runtime.managedPlay.get(seat);
    managed.paused = paused;
    managed.client = {...managed.client, provider: 'mcp', state: paused ? 'stopped' : 'running'};
    return runtime.managedPlayProgress(seat);
  }

  stop(seat, lobby = null) {
    const run = this.runs.get(seat);
    if (lobby && (!run || run.runtime !== lobby.runtime)) return this.controlExternal(lobby, seat, true);
    if (run) this.finish(run, 'stopped');
    return this.status(seat);
  }

  dispose() {for (const seat of this.runs.keys()) this.stop(seat); this.#apiSettings = new WeakMap();}
}
