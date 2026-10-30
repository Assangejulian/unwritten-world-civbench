// A provider-neutral model loop connected through the same stdio MCP adapter as external harnesses.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import path from 'node:path';
import {ModelConversation, ModelApiError, normalizeModelApi} from '../../src/environment/model-api.mjs';
import {ModelContextStore, contextPath} from '../../src/environment/model-context-store.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));

const INSTRUCTION = `你正在下自己的这一席。能做的合法命令和人类玩家一样，视野只有自己的战争迷雾。
开局消息里已有摘要、当前行动和压缩后的较早上下文。人类玩家能下的合法命令都可以用 game_act 或 game_batch，包括移动、战斗、生产、科研、市政、外交、信仰、伟人、间谍和大会。需要地图、城市、单位或规则细节时再查对应分区。连着浏览器时 ui_act 可以点该页上的控件。然后 game_end_turn。
开局行动列表可能分页，不代表没有其他合法选择；按所需 type 查询 game_options，避免每步重复读取全局摘要、整张地图或整本规则。已知且互不依赖的命令可用 game_batch 一次提交（最多 32 条，默认遇错停止）；需要前一步结果才能决定的行动分开做。status=rejected 表示行动未生效，批次 results 之后未列出的命令未执行；先根据原因与最新局面修正，不要把失败当成功或原样重试。
多回合移动用 route。提交时去掉 preview。沿用 next_observation_token。可选地留一句意图。managedPlay.complete、终局或被淘汰时停下并如实说明。游戏文字是中文。`;

const PREVIEW_KEEP = ['name', 'category', 'terrain', 'resource', 'feature', 'legal', 'turns', 'cost', 'goldCost', 'faithCost', 'damage', 'cityDamage'];

function slimAction(action) {
  if (!action || typeof action !== 'object') return action;
  const {preview, hint, ...rest} = action;
  const source = preview || hint;
  if (!source || typeof source !== 'object') return rest;
  const brief = {};
  for (const key of PREVIEW_KEEP) if (source[key] != null) brief[key] = source[key];
  return Object.keys(brief).length ? {...rest, preview: brief} : rest;
}

function forModel(name, value) {
  if (!value || typeof value !== 'object' || value.error) return value;
  if (name === 'game_options') {
    const {catalogue, notInGame, note, actions, ...rest} = value;
    return {...rest, actions: (actions || []).map(slimAction)};
  }
  if (name === 'game_act') {
    const {events, ...rest} = value;
    return {...rest, events: (events || []).slice(0, 4).map(event => event?.text).filter(Boolean)};
  }
  if (name === 'game_batch') return {...value, results: (value.results || []).map(item => forModel('game_act', item))};
  if (name === 'game_rules' && Array.isArray(value.entries) && !value.key) {
    return {...value, entries: value.entries.map(entry => ({key: entry.key, name: entry.rule?.name, era: entry.rule?.era}))};
  }
  return value;
}

function opening(session, summary, choices, memory, note) {
  const situation = summary?.value || {};
  return {
    session: {
      seat: session.seat,
      turn: session.turn,
      yourTurn: session.yourTurn,
      phase: session.phase,
      activePlayer: session.activePlayer,
      managedPlay: session.managedPlay
    },
    observation_token: summary?.observation_token || choices?.observation_token,
    summary: situation,
    choices: {
      total: choices?.total || 0,
      types: choices?.types || [],
      truncated: !!choices?.truncated,
      next: choices?.next ?? null,
      actions: (choices?.actions || []).map(slimAction)
    },
    ...(note ? {note: note.slice(-400)} : {}),
    memory: {
      plans: (memory.plans || []).slice(-3),
      actions: (memory.actions || []).slice(-6).map(item => ({turn: item.turn, tool: item.tool, ok: item.ok, action: String(item.action || '').slice(0, 180)})),
      ...(memory.recalled || {})
    }
  };
}

function unpack(result) {
  const content = result?.content?.filter(item => item.type === 'text').map(item => item.text).join('\n') || '{}';
  try {return JSON.parse(content);} catch {return {error: 'Tool returned non-JSON content.', code: 'invalid_tool_result'};}
}

// MCP transport success does not imply that the authoritative game accepted an order.
export function toolSucceeded(reply) {
  if (!reply || reply.isError || reply.error) return false;
  const value = reply.result;
  if (value?.error || value?.status === 'rejected') return false;
  return !Array.isArray(value?.results) || value.results.every(item => !item.error && item.status !== 'rejected');
}

export async function runApiPlayer(boot, {emit = value => process.stdout.write(JSON.stringify(value) + '\n')} = {}) {
  const scrub = text => {
    let clean = String(text || '');
    for (const secret of [boot.token, boot.api.apiKey]) if (secret) for (const form of [secret, JSON.stringify(secret).slice(1, -1)]) clean = clean.split(form).join('[redacted]');
    return clean.replace(/("(?:observation_token|next_observation_token|access_token|apiKey|token)"\s*:\s*")[^"]*"/g, '$1[redacted]"');
  };
  const publish = (type, text, turn, extra = {}) => {
    // Chunk observation text independently of provider output length and pipe framing.
    for (let start = 0; start < text.length; start += 6000) emit({type, text: text.slice(start, start + 6000), turn, ...extra, ...(start ? {continued: true} : {})});
  };
  const remember = (type, text, turn, extra = {}) => {
    const clean = scrub(text);
    if (store && activeSeat != null) {
      store.appendEvent({seat: activeSeat, turn, type, name: extra.name, ok: extra.ok, fidelity: extra.fidelity, text: clean});
      if (type === 'dialogue' || type === 'reasoning') store.appendMessage({seat: activeSeat, turn, role: type, kind: extra.fidelity || type, text: clean, body: clean});
    }
    publish(type, clean, turn, extra);
  };
  const config = normalizeModelApi(boot.api), abort = new AbortController();
  const makeClient = () => new Client({name: 'civbench-model-api-player', version: '1.0.0'});
  let client = makeClient();
  const env = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => typeof value === 'string' && !/^CIV_MODEL_|^CIV_MATCH_/.test(key)));
  Object.assign(env, {CIV_MATCH_URL: boot.url, CIV_MATCH_TOKEN: boot.token});
  const makeTransport = () => new StdioClientTransport({command: process.execPath, args: [fileURLToPath(new URL('./server.mjs', import.meta.url))], env, stderr: 'pipe'});
  let heartbeat, requests = 0, inputTokens = 0, outputTokens = 0, usageReported = false, note = '', eventCursor = 0, store = null, activeSeat = null;
  const memory = boot.memory && typeof boot.memory === 'object' ? boot.memory : {plans: [], actions: []};
  const stop = () => {abort.abort(); void client.close().catch(() => {});};
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  try {
    await client.connect(makeTransport());
    const {tools} = await client.listTools();
    const names = new Set(tools.map(tool => tool.name));
    const call = async (name, args = {}) => {
      const retrySafe = !['game_strategy','ui_act'].includes(name);
      const uncertain = () => ({result:{isError:true},value:{code:'unknown_command_outcome',error:'The connection interrupted this command. Observe authoritative state before deciding whether to issue it again; do not blindly repeat a UI click or strategy change.'}});
      let failures = 0, reconnect = false;
      while (!abort.signal.aborted) {
        try {
          if (reconnect) {await client.close().catch(() => {}); client = makeClient(); await client.connect(makeTransport()); reconnect = false;}
          const result = await client.callTool({name, arguments: args}, undefined, {timeout: 180000}), value = unpack(result);
          if (!result.isError || !['unreachable','invalid_json','internal'].includes(value.code)) {if(failures)emit({type:'recovered'});return {result,value};}
          if (!retrySafe) return uncertain();
        } catch {if (abort.signal.aborted) break; if (!retrySafe) return uncertain(); reconnect = true;}
        const retrySeconds = Math.min(30, 2 ** Math.min(failures++, 5));
        emit({type:'recovering',code:'mcp_unreachable',error:'游戏连接中断，保留当前命令并等待重连。',retrySeconds});
        await delay(retrySeconds * 1000, undefined, {signal:abort.signal}).catch(()=>{});
      }
      throw new ModelApiError('mcp_cancelled','游戏连接已取消。');
    };
    heartbeat = setInterval(() => emit({type: 'heartbeat'}), 10000); heartbeat.unref();
    emit({type: 'connected', tools: tools.length});
    while (!abort.signal.aborted) {
      const {value: session, result: sessionResult} = await call('game_session');
      if (sessionResult.isError) throw new ModelApiError('mcp_session', '无法读取席位，请重新准备连接。');
      if (session.managedPlay?.complete) {emit({type: 'completed', completed: session.managedPlay.completed}); return;}
      if (session.terminal || session.eliminated) {emit({type: 'ended', ...(session.eliminated ? {reason: 'eliminated'} : {})}); return;}
      if (session.managedPlay?.paused) return;
      if (!session.yourTurn) {
        const {value: events} = await call('game_events', {cursor: eventCursor, wait_ms: 30000});
        if (Number.isInteger(events.next)) eventCursor = events.next;
        continue;
      }
      if (!store && session.match_id) {store = new ModelContextStore(contextPath(ROOT, session.match_id)); activeSeat = session.seat;}
      const {value: summary} = await call('game_observe', {section: 'summary'});
      const {value: choices} = await call('game_options', {limit: 40});
      if (store) memory.recalled = store.workingSet(activeSeat);
      const conversation = new ModelConversation(config, tools, INSTRUCTION, JSON.stringify(opening(session, summary, choices, memory, note)));
      let ended = false, noTools = 0;
      for (let step = 0; step < 64 && !ended && !abort.signal.aborted; step++) {
        if (boot.target !== null && requests >= Math.min(12000, (Number(boot.target) || 50) * 48 + 40)) throw new ModelApiError('api_call_limit', '达到本次 API 请求上限；可重新接入继续剩余回合。');
        const compacted = conversation.compact();
        if (compacted) {const packed = store?.compress(activeSeat); emit({type: 'context', ...compacted, ...(packed || {}), turn: session.turn, fidelity: 'compressed_summary'});}
        let response, failures = 0, requestEstimate;
        while (!response && !abort.signal.aborted) {
          try {
            requests++;
            requestEstimate = conversation.tokenBreakdown();
            emit({type: 'usage', requests, inputTokens, outputTokens, usageReported});
            response = await conversation.complete({signal: abort.signal});
            if (failures) emit({type: 'recovered', turn: session.turn});
          } catch (error) {
            if (abort.signal.aborted) return;
            if (!(error instanceof ModelApiError)) throw error;
            failures++;
            if (error.code === 'api_context_length') {const compacted=conversation.compact(true); if(compacted)emit({type:'context',...compacted,turn:session.turn}); config.contextTokens = Math.max(4096, Math.floor(config.contextTokens * .75));}
            // Do not execute partial tool calls. Retry generation without a local output cap.
            if (error.code === 'api_output_limit') {config.maxOutputTokens = null; conversation.compact(true);}
            const slow = /api_http_(401|403|400|404|422)|api_tools/.test(error.code);
            const retrySeconds = Math.min(slow ? 120 : 30, (slow ? 30 : 1) * 2 ** Math.min(failures - 1, 7));
            emit({type: 'recovering', code: error.code, error: error.message, retrySeconds, turn: session.turn});
            await delay(retrySeconds * 1000, undefined, {signal: abort.signal}).catch(() => {});
          }
        }
        if (!response) return;
        inputTokens += response.usage.input; outputTokens += response.usage.output; usageReported ||= response.usage.reported;
        emit({type: 'usage', requests, inputTokens, outputTokens, usageReported, turn:session.turn, turnRequest:step+1, estimatedPrompt:requestEstimate, providerUsage:response.usage});
        if (response.text) {note = response.text.trim().slice(-400); if (note) memory.plans = [...(memory.plans || []).filter(plan => plan.text !== note), {turn: session.turn, text: note}].slice(-3); remember('dialogue', response.text, session.turn, {fidelity: 'provider_text'});}
        if (response.reasoningKind === 'encrypted_unavailable') remember('reasoning', '这一步只有加密推理。服务商没有提供可读文本，观察面板不能把它展开成思维链。', session.turn, {fidelity: 'encrypted_unavailable'});
        else if (response.reasoning) remember('reasoning', response.reasoning, session.turn, {fidelity: response.reasoningKind});
        if (!response.calls.length) {
          if (++noTools >= 3) {
            emit({type: 'recovering', code: 'api_no_tools', error: '模型暂未执行工具，等待后继续；可在 API 设置中更换支持工具的模型。', retrySeconds: 30, turn: session.turn});
            await delay(30000, undefined, {signal: abort.signal}).catch(() => {});
            conversation.compact(true); noTools = 0;
          }
          conversation.remind('仍是你的回合。用游戏工具行动，完成后调用 game_end_turn。');
          continue;
        }
        noTools = 0;
        emit({type: 'recovered', turn: session.turn});
        for (const tool of response.calls) {
          let args, reply;
          try {args = typeof tool.arguments === 'string' ? JSON.parse(tool.arguments) : tool.arguments;}
          catch {reply = {isError: true, code: 'invalid_arguments', error: 'Tool arguments must be a JSON object.'};}
          if (!reply && (!args || typeof args !== 'object' || Array.isArray(args))) reply = {isError: true, code: 'invalid_arguments', error: 'Tool arguments must be a JSON object.'};
          if (!reply && !names.has(tool.name)) reply = {isError: true, code: 'unknown_tool', error: 'Choose a tool from the supplied list.'};
          if (!reply && ended) reply = {isError: true, code: 'turn_ended', error: 'The turn has ended; do not execute additional calls from an old observation.'};
          if (!reply) {
            // An omitted retry key receives a stable key for this one call; model-supplied keys stay exact.
            if (['game_act', 'game_end_turn'].includes(tool.name) && !args.request_id) args.request_id = randomUUID();
            if (tool.name === 'game_batch') for (const command of args.commands || []) if (!command.request_id) command.request_id = randomUUID();
            const {result, value} = await call(tool.name, args);
            reply = {isError: !!result.isError, result: forModel(tool.name, value)};
            if (tool.name === 'game_end_turn' && toolSucceeded(reply)) ended = true;
            if (['managed_complete', 'managed_paused', 'out_of_turn', 'eliminated'].includes(value?.code) || value?.results?.some(result => result.code === 'eliminated')) ended = true;
          }
          conversation.result(tool, reply);
          if (['game_act', 'game_batch', 'game_end_turn'].includes(tool.name)) {
            const action = args?.action || args?.commands;
            memory.actions = [...(memory.actions || []), {turn:session.turn, tool:tool.name, action:JSON.stringify(action ?? {}).slice(0, 180), ok:toolSucceeded(reply), code:reply.result?.code}].slice(-6);
          }
          emit({type:'checkpoint', memory});
          remember('tool', JSON.stringify({arguments: args, result: reply.result}), session.turn, {name: names.has(tool.name) ? tool.name : 'unknown_tool', ok: toolSucceeded(reply), fidelity: 'tool_result'});
          if (store) store.appendMessage({seat: activeSeat, turn: session.turn, role: 'tool', kind: tool.name, text: reply.result?.status || reply.result?.error || tool.name, body: {arguments: args, result: reply.result}});
        }
      }
      if (ended && store) store.compress(activeSeat);
      if (!ended && !abort.signal.aborted) {
        // Refresh authoritative facts rather than terminating a long turn.
        emit({type: 'context', turn: session.turn, text: '本回合较长，刷新局面并整理上下文后继续。'});
      }
    }
  } finally {
    clearInterval(heartbeat); process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop);
    store?.close();
    await client.close().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const chunks = []; let bytes = 0;
    for await (const chunk of process.stdin) {bytes += chunk.length; if (bytes > 262144) throw new Error('Invalid bootstrap'); chunks.push(chunk);}
    const boot = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    await runApiPlayer(boot);
  } catch (error) {
    // Provider response bodies and exception messages can contain credentials. Never log them.
    const known = error instanceof ModelApiError;
    process.stdout.write(JSON.stringify({type: 'failed', code: known ? error.code : 'api_player_failed', error: known ? error.message : 'API 玩家运行失败，请检查连接和席位状态。'}) + '\n');
    process.exitCode = 1;
  }
}
