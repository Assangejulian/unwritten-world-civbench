// Host-only client setup. Persistent MCP entries contain a binding path, never a match credential.
import {readFile, writeFile, mkdir, rename, unlink, stat, readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID, createHash} from 'node:crypto';
import {EnvironmentError} from './match.mjs';
import {HARNESS_CLIENTS as CLIENTS} from './harness-catalog.mjs';

const exec = promisify(execFile);
const ADAPTER = fileURLToPath(new URL('../../environment/mcp/server.mjs', import.meta.url));
const SERVER_KEY = 'civbench_game';
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const digest = text => createHash('sha256').update(text).digest('hex');
const instanceId = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);

function serversIn(config, client) {
  if (client.patch) {
    if (object(config) && !Object.keys(config).length) return {};
    const entries = Array.isArray(config) && config.length === 1 && config[0]?.insert;
    if (!Array.isArray(entries) || entries.length !== 1 || entries[0]?.id !== 'civbench-mcp' || entries[0]?.name !== '@deepseek-ai/dsh-mcp-client' || entries[0]?.config?.serverName !== SERVER_KEY) throw new EnvironmentError('client_config_conflict', '独立接入补丁已有其他内容，未覆盖。', 409);
    const {command, args, env} = entries[0].config;
    return {[SERVER_KEY]: {command, args, env}};
  }
  if (!object(config)) throw new EnvironmentError('client_config_invalid', '客户端配置需要是 JSON 对象。', 409);
  let section = config;
  for (const key of client.serverPath || ['mcpServers']) {
    if (section[key] === undefined) return {};
    if (!object(section[key])) throw new EnvironmentError('client_config_invalid', '客户端 MCP 配置需要是 JSON 对象。', 409);
    section = section[key];
  }
  return section;
}

function withServers(config, client, servers) {
  if (client.patch) return [{insert: [{id: 'civbench-mcp', name: '@deepseek-ai/dsh-mcp-client', config: {serverName: SERVER_KEY, transport: 'stdio', ...servers[SERVER_KEY]}}]}];
  const copy = {...config}; let section = copy;
  const keys = client.serverPath || ['mcpServers'];
  for (const key of keys.slice(0, -1)) section = section[key] = {...section[key]};
  section[keys.at(-1)] = servers;
  return copy;
}

async function json(file, fallback) {
  try {return JSON.parse(await readFile(file, 'utf8'));}
  catch (error) {if (error.code === 'ENOENT') return fallback; throw new EnvironmentError('client_config_invalid', '客户端配置无法解析，请先在客户端修复 JSON。', 409);}
}

async function atomicText(file, text) {
  await mkdir(path.dirname(file), {recursive: true, mode: 0o700});
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {await writeFile(temporary, text, {mode: 0o600}); await rename(temporary, file);}
  finally {await unlink(temporary).catch(() => {});}
}
const atomic = (file, value) => atomicText(file, JSON.stringify(value, null, 2) + '\n');

async function existingSession(url, token) {
  try {
    const target = new URL(url);
    if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(target.hostname) || !target.port || target.port === '43821') return null;
    const response = await fetch(target.origin + '/v1/session', {headers: {Authorization: 'Bearer ' + token, 'X-CivBench-Probe': '1'}, signal: AbortSignal.timeout(1500)});
    return response.ok ? await response.json() : null;
  } catch {return null;}
}

export class HarnessConnections {
  constructor({home = homedir(), dataRoot, env = process.env, discoverExecutables, openClient} = {}) {
    this.home = home;
    this.env = env;
    this.dataRoot = dataRoot || path.join(home, '.civbench', 'connections');
    this.discoverExecutables = discoverExecutables || (() => this.#windowsExecutables());
    this.openClient = openClient || (executable => new Promise((resolve, reject) => {
      const child = spawn(executable, [], {detached: true, stdio: 'ignore', windowsHide: false});
      child.once('error', reject); child.once('spawn', () => {child.unref(); resolve();});
    }));
    this.executables = {};
    this.queue = Promise.resolve();
  }

  #client(id) {
    const client = CLIENTS.find(client => client.id === id);
    if (!client) throw new EnvironmentError('unknown_harness', '这个客户端尚未支持自动配置，请使用手动 MCP 配置。');
    return client;
  }

  #binding(id) {return path.join(this.dataRoot, id + '.json');}

  #directory(client) {
    const override = client.id === 'claude-code' ? this.env.CLAUDE_CONFIG_DIR : client.id === 'kimi-code' ? this.env.KIMI_CODE_HOME : client.patch ? this.env.DSH_HOME : null;
    return override ? path.resolve(override) : path.join(this.home, client.directory);
  }

  #configFile(client) {
    if (client.patch) return path.join(this.dataRoot, client.id + '.patch.json');
    if (client.manual || client.workspaceOnly) return null;
    if (client.id === 'kimi-code') return path.join(this.#directory(client), 'mcp.json');
    if (client.id === 'claude-code' && this.env.CLAUDE_CONFIG_DIR) return path.join(this.#directory(client), '.claude.json');
    return path.join(this.home, ...client.config);
  }

  #cliInstalled(client) {
    if (!client.cli) return false;
    const directories = [...(this.env.PATH || this.env.Path || '').split(path.delimiter), path.join(this.home, '.local', 'bin'), path.join(this.home, 'AppData', 'Roaming', 'npm')].filter(Boolean);
    return directories.some(directory => [client.cli, client.cli + '.exe', client.cli + '.cmd'].some(name => existsSync(path.join(directory, name))));
  }

  async #servers(config, client) {
    const servers = serversIn(config, client);
    // ZCode stops loading .agents fallback entries once native servers exist.
    // Carry those entries forward instead of silently disabling unrelated tools.
    if (client.id === 'zcode' && !Object.keys(servers).length) return serversIn(await json(path.join(this.home, '.agents', 'mcp.json'), {}), {});
    return servers;
  }

  #instanceFiles(id) {
    if (!instanceId(id)) throw new EnvironmentError('invalid_instance', '独立会话标识无效。');
    const root = path.join(this.dataRoot, 'instances', id);
    return {root, metadata:path.join(root,'instance.json'), binding:path.join(root,'binding.json'), workspace:path.join(root,'workspace')};
  }

  async #instances() {
    const names = await readdir(path.join(this.dataRoot, 'instances')).catch(error => {if (error.code === 'ENOENT') return []; throw error;});
    const rows = [];
    for (const id of names.filter(instanceId).sort()) {
      const files = this.#instanceFiles(id), record = await json(files.metadata, null).catch(() => null);
      const client = CLIENTS.find(client => client.id === record?.harness && client.workspace);
      if (!client || record.id !== id || record.version !== 1) continue;
      const config = await readFile(path.join(files.workspace, client.workspace), 'utf8').catch(() => null);
      rows.push({...record, configured:config !== null && digest(config) === record.configHash, binding:await json(files.binding, null).catch(() => null)});
    }
    return rows;
  }

  #instanceConfig(client, binding) {
    const server = {command:process.execPath,args:[ADAPTER],env:{CIV_BINDING_FILE:binding}};
    if (client.format === 'codex') return `[mcp_servers.${SERVER_KEY}]\ncommand = ${JSON.stringify(server.command)}\nargs = ${JSON.stringify(server.args)}\n\n[mcp_servers.${SERVER_KEY}.env]\nCIV_BINDING_FILE = ${JSON.stringify(binding)}\n`;
    if (client.format === 'opencode') return JSON.stringify({mcp:{[SERVER_KEY]:{type:'local',command:[server.command,...server.args],environment:server.env,enabled:true}}},null,2)+'\n';
    if (['claude-code','vscode','codebuddy'].includes(client.id)) server.type = 'stdio';
    return JSON.stringify(withServers({},client,{[SERVER_KEY]:server}),null,2)+'\n';
  }

  async #bindInstance(lobby, client, {seat, instance}) {
    if (!client.workspace) throw new EnvironmentError('instance_not_supported', '这个客户端暂未验证独立会话配置，请使用默认或手动连接。');
    if (!Number.isInteger(seat)) throw new EnvironmentError('invalid_action', '请选择要交给客户端的文明。');
    if (instance !== undefined && !instanceId(instance)) throw new EnvironmentError('invalid_instance', '独立会话标识无效。');
    const card = lobby.copy(seat), matchId = lobby.runtime.id, epoch = lobby.runtime.epoch;
    const rows = await this.#instances();
    const record = instance ? rows.find(row=>row.id === instance) : rows.find(row=>row.harness === client.id && row.binding?.match_id === matchId && row.binding.seat === seat);
    if (instance && (!record || record.harness !== client.id)) throw new EnvironmentError('invalid_instance', '找不到该客户端的独立会话。');
    const id = record?.id || randomUUID(), files = this.#instanceFiles(id);
    const previous = await json(files.binding, null);
    if (previous && (previous.match_id !== matchId || previous.seat !== seat)) {
      const session = await existingSession(previous.url, previous.token);
      if (previous.match_id === matchId || session && !session.terminal && !session.eliminated) throw new EnvironmentError('harness_in_use', '该独立会话仍绑定另一文明，请先解除。', 409);
    }
    const configFile = path.join(files.workspace,client.workspace), content = this.#instanceConfig(client,files.binding);
    if (record && (!record.configured || record.configHash !== digest(content))) throw new EnvironmentError('client_config_conflict', '独立会话配置已被修改，未覆盖。请使用手动配置或恢复原文件。', 409);
    const current = () => lobby.runtime?.id === matchId && lobby.runtime?.epoch === epoch;
    if (!current()) throw new EnvironmentError('stale_lobby', '对局设置已改变，请重新配置连接。', 409);
    if (!record) {
      await mkdir(files.workspace,{recursive:true,mode:0o700});
      await atomicText(configFile,content);
      await atomic(files.metadata,{version:1,id,harness:client.id,label:client.name+' · '+id.slice(0,6),configHash:digest(content)});
    }
    if (client.id === 'codex') {
        const overrides = [
          'mcp_servers.'+SERVER_KEY+'.command='+JSON.stringify(process.execPath),
          'mcp_servers.'+SERVER_KEY+'.args='+JSON.stringify([ADAPTER]),
          'mcp_servers.'+SERVER_KEY+'.env.CIV_BINDING_FILE='+JSON.stringify(files.binding)
        ];
        const cliArguments = overrides.flatMap(value=>['-c',value]);
        const launcher = "// Preserve embedded TOML quotes on Windows PowerShell 5 and PowerShell 7.\nimport {spawn} from 'node:child_process';\nconst child=spawn('codex',"+JSON.stringify(cliArguments)+".concat(process.argv.slice(2)),{stdio:'inherit',windowsHide:true});\nchild.on('error',()=>{console.error('Unable to start Codex CLI. Check that it is installed on PATH.');process.exitCode=1;});\nchild.on('exit',code=>{process.exitCode=code??1;});\n";
        const nodeLauncher = path.join(files.workspace,'Start-Codex.mjs');
        const savedNodeLauncher = await readFile(nodeLauncher,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
        if (savedNodeLauncher !== null && savedNodeLauncher !== launcher) throw new EnvironmentError('client_config_conflict','独立会话启动脚本已被修改，未覆盖。',409);
        if (savedNodeLauncher === null) await atomicText(nodeLauncher,launcher);
        const psFile = path.join(files.workspace,'Start-Codex.ps1');
        const argumentsList = cliArguments.map(value=>"  '"+value.replaceAll("'","''")+"'").join(',\n');
        const legacy = "# Explicit per-process MCP overrides; no shared configuration is modified.\nSet-Location -LiteralPath $PSScriptRoot\n$civArgs = @(\n"+argumentsList+"\n)\n& codex @civArgs @args\n";
        const saved = await readFile(psFile,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
        if (saved === null || saved === legacy) await atomicText(psFile,"# No shared configuration is modified; model options can be passed as arguments.\nSet-Location -LiteralPath $PSScriptRoot\n& '"+process.execPath.replaceAll("'","''")+"' (Join-Path $PSScriptRoot 'Start-Codex.mjs') @args\nexit $LASTEXITCODE\n");
    }
    await atomic(files.binding,{version:1,url:card.url,token:card.env.CIV_MATCH_TOKEN,match_id:matchId,world_epoch:epoch,seat,name:card.displayName});
    if (!current()) {await unlink(files.binding).catch(()=>{});throw new EnvironmentError('stale_lobby','对局设置已改变，请重新配置连接。',409);}
    const message = client.patch
      ? '独立补丁已生成。用原启动命令追加 --patch 和此目录中的 deepseek-harness.patch.json。'
      : client.id === 'codex'
        ? '独立会话已配置。请打开此目录并信任项目，或在终端运行 Start-Codex.ps1。'
      : client.id === 'claude-code'
        ? '独立会话已配置。请在此目录启动 claude --strict-mcp-config --mcp-config .mcp.json。'
        : '独立会话已配置。请在客户端打开此工作目录并新建对话，按提示信任目录、启用 MCP 后调用 game_session。';
    return {harness:client.id,name:client.name,seat,instance:id,isolated:true,workspace:files.workspace,configured:true,connected:lobby.runtime.connectionState(seat).state === 'connected',message};
  }

  async #unbindInstance(lobby, {harness, instance, seat}) {
    this.#client(harness);
    const record = (await this.#instances()).find(row=>row.id === instance && row.harness === harness);
    if (!record || !record.binding || record.binding.match_id !== lobby.runtime?.id || Number.isInteger(seat) && record.binding.seat !== seat) throw new EnvironmentError('harness_in_use','这不是当前文明的独立会话连接。',409);
    await unlink(this.#instanceFiles(instance).binding);
    lobby.disconnect(record.binding.seat);
    return {harness,instance,configured:record.configured,bound:false};
  }

  async #windowsExecutables() {
    if (process.platform !== 'win32') return {};
    const names = [...new Set(CLIENTS.map(client => client.executable).filter(Boolean))].map(name => "'" + name + "'").join(',');
    const script = "Get-CimInstance Win32_Process | Where-Object { $_.Name -in @(" + names + ") } | Select-Object Name,ExecutablePath | ConvertTo-Json -Compress";
    try {
      const {stdout} = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {windowsHide: true, timeout: 5000, maxBuffer: 65536});
      const parsed = stdout.trim() ? JSON.parse(stdout) : [];
      return Object.fromEntries((Array.isArray(parsed) ? parsed : [parsed]).filter(row => row.ExecutablePath && path.basename(row.ExecutablePath).toLowerCase() === row.Name.toLowerCase()).map(row => [row.Name.toLowerCase(), row.ExecutablePath]));
    } catch {return {};}
  }

  async scan(lobby) {
    this.executables = await this.discoverExecutables();
    const instances = await this.#instances();
    const clients = [];
    for (const client of CLIENTS) {
      const configFile = this.#configFile(client);
      const executable = this.executables[client.executable?.toLowerCase()];
      const installed = !!executable || !!configFile && existsSync(configFile) || !client.fileOnly && existsSync(this.#directory(client)) || (client.traces || []).some(parts => existsSync(path.join(this.home, ...parts))) || this.#cliInstalled(client);
      const ownInstances = instances.filter(row => row.harness === client.id);
      if (!installed && !ownInstances.length) continue;
      let configured = false, configError = false;
      try {
        if (configFile) {
          const config = await json(configFile, {});
          configured = (await this.#servers(config, client))[SERVER_KEY]?.env?.CIV_BINDING_FILE === this.#binding(client.id);
        }
      } catch {configError = true;}
      const binding = await json(this.#binding(client.id), null).catch(() => null);
      const current = !!binding && !!lobby.runtime && binding.match_id === lobby.runtime.id;
      clients.push({id: client.id, name: client.name, installed: !!installed, running: !!executable, canOpen: !!executable && !client.cli, configured, configError, setup: client.patch ? 'patch' : client.workspaceOnly ? 'workspace' : client.manual ? 'manual' : 'config', canIsolate: !!client.workspace, instances: ownInstances.map(row => ({id: row.id, label: row.label, configured: row.configured, seat: row.binding?.match_id === lobby.runtime?.id ? row.binding?.seat ?? null : null})), seat: current ? binding.seat : null});
    }
    return {clients, modelSelection: 'client'};
  }

  bind(lobby, input) {
    const next = this.queue.then(() => this.#bind(lobby, input));
    this.queue = next.catch(() => {});
    return next;
  }

  async #bind(lobby, {harness, seat, isolated = false, instance} = {}) {
    const client = this.#client(harness);
    if (typeof isolated !== 'boolean') throw new EnvironmentError('invalid_action', '独立会话选项无效。');
    if (isolated || instance !== undefined) return this.#bindInstance(lobby, client, {seat, instance});
    if (client.workspaceOnly || client.manual) throw new EnvironmentError('client_manual_required', client.workspace ? '请选择独立会话，或使用手动 MCP 配置。' : '已识别此客户端，请使用手动 MCP 配置。');
    if (!Number.isInteger(seat)) throw new EnvironmentError('invalid_action', '请选择要交给客户端的文明。');
    const card = lobby.copy(seat);
    const matchId = lobby.runtime.id;
    const bindingFile = this.#binding(client.id);
    const previous = await json(bindingFile, null);
    if (previous && (previous.match_id !== lobby.runtime.id || previous.seat !== seat)) {
      const session = await existingSession(previous.url, previous.token);
      if (previous.match_id === lobby.runtime.id || session && !session.terminal && !session.eliminated) throw new EnvironmentError('harness_in_use', '这个客户端已经绑定另一个文明或对局，请先解除原连接。', 409);
    }
    const configFile = this.#configFile(client);
    const config = await json(configFile, {});
    const servers = {...await this.#servers(config, client)};
    const existing = servers[SERVER_KEY];
    if (existing && (!Array.isArray(existing.args) || path.resolve(existing.args[0] || '') !== path.resolve(ADAPTER))) throw new EnvironmentError('client_config_conflict', '客户端已有同名 MCP，请先处理 civbench_game 名称冲突。', 409);
    // Retire only this adapter's old per-match entries, preventing duplicate old-world tools.
    for (const [name, entry] of Object.entries(servers)) {
      if (!Array.isArray(entry?.args) || typeof entry.args[0] !== 'string' || path.resolve(entry.args[0]) !== path.resolve(ADAPTER)) continue;
      if (entry.env?.CIV_BINDING_FILE === bindingFile) continue;
      if (entry.env?.CIV_BINDING_FILE) throw new EnvironmentError('client_config_conflict', '客户端已有另一个 CivBench 绑定，请先解除它。', 409);
      const sameSeat = entry.env?.CIV_MATCH_URL === card.url && entry.env?.CIV_MATCH_TOKEN === card.env.CIV_MATCH_TOKEN;
      const session = sameSeat ? null : await existingSession(entry.env?.CIV_MATCH_URL, entry.env?.CIV_MATCH_TOKEN);
      if (session && !session.terminal && !session.eliminated && !sameSeat) throw new EnvironmentError('harness_in_use', '客户端还连接着另一个 CivBench 文明，请先结束或移除原连接。', 409);
      delete servers[name];
    }
    servers[SERVER_KEY] = {...(client.id === 'claude-code' ? {type: 'stdio'} : {}), command: process.execPath, args: [ADAPTER], env: {CIV_BINDING_FILE: bindingFile}};
    const nextConfig = withServers(config, client, servers);
    const configChanged = JSON.stringify(nextConfig) !== JSON.stringify(config);
    // Back up exact bytes before changing any existing client configuration.
    try {
      if (configChanged) {
        const info = await stat(configFile);
        if (!info.isFile()) throw Error('not file');
        await mkdir(this.dataRoot, {recursive: true, mode: 0o700});
        await writeFile(path.join(this.dataRoot, client.id + '-' + randomUUID() + '.backup.json'), await readFile(configFile), {mode: 0o600});
      }
    } catch (error) {if (error.code !== 'ENOENT') throw new EnvironmentError('client_config_write', '无法备份客户端配置，原配置未改动。', 409);}
    if (lobby.runtime?.id !== matchId) throw new EnvironmentError('stale_lobby', '对局设置已改变，请重新配置连接。', 409);
    const binding = {version: 1, url: card.url, token: card.env.CIV_MATCH_TOKEN, match_id: matchId, world_epoch: lobby.runtime.epoch, seat, name: card.displayName};
    await atomic(bindingFile, binding);
    try {
      const latest = await json(configFile, {});
      if (JSON.stringify(latest) !== JSON.stringify(config)) throw Error('configuration changed');
      if (configChanged) await atomic(configFile, nextConfig);
    }
    catch {
      if (previous) await atomic(bindingFile, previous); else await unlink(bindingFile).catch(() => {});
      throw new EnvironmentError('client_config_write', '客户端配置写入失败，请关闭该配置编辑框后重试。', 409);
    }
    if (lobby.runtime?.id !== matchId) {await this.releaseMatch(matchId); throw new EnvironmentError('stale_lobby', '对局设置已改变，请重新配置连接。', 409);}
    const message = client.patch
      ? '已生成独立补丁：~/.civbench/connections/deepseek-harness.patch.json。请给原 dsh 启动命令追加 --patch 和此文件的完整路径，再新建对话。'
      : client.cli
        ? '已配置。请在终端启动 ' + client.cli + '，选择模型并新建对话，启用 CivBench MCP。'
        : '已配置。请在客户端选择模型并新建对话，启用 CivBench MCP。';
    return {harness: client.id, name: client.name, seat, configured: true, connected: lobby.runtime.connectionState(seat).state === 'connected', message};
  }

  unbind(lobby, input = {}) {
    const next = this.queue.then(() => this.#unbind(lobby,input));
    this.queue = next.catch(() => {});
    return next;
  }

  async #unbind(lobby, {harness, instance, seat}) {
    if (instance !== undefined) return this.#unbindInstance(lobby, {harness, instance, seat});
    const client = this.#client(harness), file = this.#binding(client.id);
    const binding = await json(file, null);
    if (binding?.match_id !== lobby.runtime?.id) throw new EnvironmentError('harness_in_use', '这不是当前对局的客户端连接。', 409);
    await unlink(file);
    lobby.disconnect(binding.seat);
    return {harness, configured: true, bound: false};
  }

  async releaseMatch(matchId) {
    for (const client of CLIENTS) {
      const file = this.#binding(client.id), binding = await json(file, null).catch(() => null);
      if (binding?.match_id === matchId) await unlink(file).catch(() => {});
    }
    for (const row of await this.#instances()) if (row.binding?.match_id === matchId) await unlink(this.#instanceFiles(row.id).binding).catch(() => {});
  }

  async open({harness} = {}) {
    const client = this.#client(harness);
    if (client.cli) throw new EnvironmentError('client_terminal_required', '请在终端启动 ' + client.cli + '，游戏不会代你创建终端会话。', 409);
    const executable = this.executables[client.executable?.toLowerCase()];
    if (!executable || !existsSync(executable)) throw new EnvironmentError('client_not_running', '暂未找到客户端启动位置，请从桌面打开它。', 409);
    try {await this.openClient(executable);}
    catch {throw new EnvironmentError('client_open_failed', '客户端未能启动，请从桌面打开它。', 409);}
    return {opened: true, harness: client.id};
  }
}
