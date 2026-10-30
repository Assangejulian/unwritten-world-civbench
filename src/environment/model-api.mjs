// Model transport only. Game authority stays in the seat-bound MCP adapter.
import {COMPRESSION_TOKENS, estimateTokens, digestLine} from './model-context-store.mjs';
export class ModelApiError extends Error {
  constructor(code, message) {super(message); this.code = code; this.status = 400;}
}

export function normalizeModelApi(input = {}) {
  const protocol = input.protocol || 'chat-completions';
  if (!['chat-completions', 'responses'].includes(protocol)) throw new ModelApiError('invalid_api', '请选择受支持的 API 协议。');
  let url;
  if (String(input.baseUrl || '').length > 2048) throw new ModelApiError('invalid_api', '接口地址过长。');
  try {url = new URL(String(input.baseUrl || '').trim());} catch {throw new ModelApiError('invalid_api', '请填写有效的 API 基础地址或完整接口地址。');}
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) || url.username || url.password || url.search || url.hash) throw new ModelApiError('invalid_api', '远程接口需使用 HTTPS；本机可用 HTTP。地址不能包含账号、查询参数或片段。');
  const suffix = protocol === 'responses' ? '/responses' : '/chat/completions';
  let pathname = url.pathname.replace(/\/+$/, '');
  if (/\/(?:chat\/completions|responses)$/.test(pathname) && !pathname.endsWith(suffix)) throw new ModelApiError('invalid_api', '完整接口路径与所选协议不一致。');
  if (!pathname.endsWith(suffix)) pathname += suffix;
  url.pathname = pathname;
  const model = String(input.model || '').trim(), apiKey = String(input.apiKey || '').trim();
  if (!model || model.length > 160 || /[\u0000-\u001f]/.test(model)) throw new ModelApiError('invalid_api', '请填写模型名称，最多 160 个字符。');
  if (apiKey.length > 4096 || /[\r\n]/.test(apiKey)) throw new ModelApiError('invalid_api', '请填写有效的 API Key。无鉴权服务可留空。');
  const maxOutputTokens = input.maxOutputTokens == null || input.maxOutputTokens === '' ? null : Number(input.maxOutputTokens), timeoutSeconds = Number(input.timeoutSeconds ?? 120);
  const contextTokens = Number(input.contextTokens ?? 32768);
  if (maxOutputTokens !== null && (!Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 64) || !Number.isInteger(timeoutSeconds) || timeoutSeconds < 10 || timeoutSeconds > 300 || !Number.isSafeInteger(contextTokens) || contextTokens < 4096) throw new ModelApiError('invalid_api', '可留空使用服务商默认输出长度；自定义需至少 64 Token。上下文至少 4096 Token，超时为 10–300 秒。');
  const tokenParameter = input.tokenParameter || 'max_tokens';
  if (!['max_tokens', 'max_completion_tokens'].includes(tokenParameter)) throw new ModelApiError('invalid_api', '不支持的输出上限参数。');
  const compressionTokens = Number(input.compressionTokens ?? COMPRESSION_TOKENS);
  if (!Number.isSafeInteger(compressionTokens) || compressionTokens < 1000) throw new ModelApiError('invalid_api', '压缩阈值至少为 1000 Token。');
  return {protocol, endpoint: url.href, model, apiKey, maxOutputTokens, timeoutSeconds, tokenParameter, contextTokens, compressionTokens};
}

async function request(config, payload, {fetcher = fetch, signal} = {}) {
  const abort = AbortSignal.any([AbortSignal.timeout(config.timeoutSeconds * 1000), ...(signal ? [signal] : [])]);
  let response;
  try {
    response = await fetcher(config.endpoint, {method: 'POST', redirect: 'error', signal: abort, headers: {'Content-Type': 'application/json', ...(config.apiKey ? {Authorization: `Bearer ${config.apiKey}`} : {})}, body: JSON.stringify(payload)});
  } catch {
    throw new ModelApiError(abort.aborted ? 'api_timeout' : 'api_unreachable', abort.aborted ? '模型请求已超时或取消。' : '无法连接模型接口，请检查地址、网络及重定向设置。');
  }
  if (!response.ok) {
    // Classify context errors without returning or logging reflected response bodies.
    if ([400, 413, 422].includes(response.status)) {
      const reader = response.body?.getReader(); let sample = '';
      try {while (reader && sample.length < 8192) {const part = await reader.read(); if (part.done) break; sample += new TextDecoder().decode(part.value);}} finally {await reader?.cancel().catch(() => {});}
      if (/context[_ ](?:length|window)|maximum context|too many tokens|prompt.{0,30}too long/i.test(sample) || response.status === 413) throw new ModelApiError('api_context_length', '模型上下文已满，正在压缩后重试。');
    } else await response.body?.cancel().catch(() => {});
    const message = response.status === 401 || response.status === 403 ? '模型接口拒绝鉴权，请检查 API Key 和权限。' : response.status === 429 ? '模型接口达到限流或额度限制，正在等待重试。' : `模型接口返回 HTTP ${response.status}，正在重试；可检查模型、协议和参数。`;
    throw new ModelApiError('api_http_' + response.status, message);
  }
  const chunks = []; let bytes = 0;
  try {for await (const chunk of response.body || []) {
    bytes += chunk.length;
    if (bytes > 4 * 1024 * 1024) throw new ModelApiError('api_response_large', '模型响应超过安全传输大小，正在重试。');
    chunks.push(chunk);
  }} catch (error) {if (error instanceof ModelApiError) throw error; throw new ModelApiError('api_stream_error', '模型响应传输中断，正在重试。');}
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {throw new ModelApiError('api_invalid_json', '模型接口未返回有效 JSON。请检查接口路径和协议。');}
}

function actionFact(name, raw) {
  try {return digestLine(name, {arguments: JSON.parse(String(raw || '{}'))});} catch {return name;}
}

function resultFact(raw) {
  const text = String(raw ?? '');
  try {
    const parsed = JSON.parse(text);
    const result = parsed?.result && typeof parsed.result === 'object' ? parsed.result : parsed;
    return [result?.status, result?.error].filter(Boolean).join(' ').slice(0, 180);
  } catch {return text.replace(/\s+/g, ' ').slice(0, 160);}
}

export class ModelConversation {
  constructor(config, tools, instruction, context) {
    this.config = config; this.tools = tools; this.instruction = instruction;
    this.messages = [{role: 'user', content: context}];
    this.compactions = 0;
    this.fixedTokens = estimateTokens(tools) + estimateTokens(instruction);
    this.messageTokens = [];
    this.promptTokens = this.fixedTokens;
    this.#account(this.messages[0]);
    const responses = config.protocol === 'responses';
    this.wireTools = tools.map(tool => responses ? {type: 'function', name: tool.name, description: tool.description || '', parameters: tool.inputSchema, strict: false} : {type: 'function', function: {name: tool.name, description: tool.description || '', parameters: tool.inputSchema, strict: false}});
  }

  #account(item) {
    const weight = estimateTokens(item);
    this.messageTokens.push(weight);
    this.promptTokens += weight;
    return weight;
  }

  #rebuildAccounts() {
    this.messageTokens = [];
    this.promptTokens = this.fixedTokens;
    for (const item of this.messages) this.#account(item);
  }

  compact(force = false) {
    const size = value => Buffer.byteLength(JSON.stringify(value), 'utf8');
    const promptTokens = this.promptTokens;
    // Reserve context space for generation without imposing a provider output cap.
    const contextBudget = Math.max(1000, Math.floor((Number(this.config.contextTokens) || 32768) * .75));
    const startAt = Math.min(Number(this.config.compressionTokens) || COMPRESSION_TOKENS, contextBudget);
    if (!force && promptTokens < startAt) return null;
    // Keep the newest exchanges verbatim. Older ones become action facts, not raw JSON.
    const reserve = Math.min(50_000, Math.max(800, Math.floor(startAt * 0.25)));
    const prefix = [0];
    for (const weight of this.messageTokens) prefix.push(prefix.at(-1) + weight);
    let cut = this.messages.length;
    for (let index = this.messages.length - 1; index > 1; index--) {
      const item = this.messages[index];
      const boundary = item.role === 'assistant' || item.type === 'reasoning' || item.type === 'function_call' || item.role === 'user';
      if (!boundary) continue;
      if (prefix.at(-1) - prefix[index] <= reserve) cut = index;
      else break;
    }
    // Responses reasoning and all calls in the same response form one exchange.
    while (cut > 1 && this.messages[cut]?.type && this.messages[cut - 1]?.role !== 'user' && this.messages[cut - 1]?.type !== 'function_call_output') cut--;
    if (cut <= 1) {
      if (!force) return null;
      cut = this.messages.length;
    }
    const removed = this.messages.slice(1, cut), actions = [], plans = [];
    for (const item of removed) {
      if (item.type === 'reasoning') continue;
      if (item.role === 'assistant' && typeof item.content === 'string' && item.content) plans.push(item.content.replace(/\s+/g, ' ').slice(-200));
      for (const call of item.tool_calls || []) actions.push(actionFact(call.function?.name, call.function?.arguments));
      if (item.type === 'function_call') actions.push(actionFact(item.name, item.arguments));
      if (item.role === 'tool' || item.type === 'function_call_output') actions.push(resultFact(item.content ?? item.output));
      if (item.type === 'message') for (const part of item.content || []) if (part.type === 'output_text') plans.push(String(part.text).replace(/\s+/g, ' ').slice(-200));
    }
    let first; try {first = JSON.parse(this.messages[0].content);} catch {first = {context: this.messages[0].content};}
    first.contextMemory = {compactions: ++this.compactions, plans: [...(first.contextMemory?.plans || []), ...plans].filter(Boolean).slice(-3), recentActions: [...(first.contextMemory?.recentActions || []), ...actions].filter(Boolean).slice(-16), notice: `Earlier completed exchanges were compressed with an estimated ${startAt}-token prompt budget. Initial facts may be stale; use the latest observation and token.`};
    this.messages = [{role: 'user', content: JSON.stringify(first)}, ...this.messages.slice(cut)];
    this.#rebuildAccounts();
    return {compactions: this.compactions, beforeBytes: size(removed), afterBytes: size(this.messages), tokens: promptTokens};
  }

  tokenBreakdown() {
    return {fixedPrefix:this.fixedTokens, opening:this.messageTokens[0] || 0,
      history:this.messageTokens.slice(1).reduce((sum, value) => sum + value, 0),
      latestMessage:this.messageTokens.at(-1) || 0, total:this.promptTokens};
  }

  async complete(options = {}) {
    const config = this.config, responses = config.protocol === 'responses';
    const tools = this.wireTools;
    const payload = responses
      ? {model: config.model, instructions: this.instruction, input: this.messages, tools, tool_choice: 'auto', ...(config.maxOutputTokens === null ? {} : {max_output_tokens: config.maxOutputTokens}), store: false, include: ['reasoning.encrypted_content']}
      : {model: config.model, messages: [{role: 'system', content: this.instruction}, ...this.messages], tools, tool_choice: 'auto', ...(config.maxOutputTokens === null ? {} : {[config.tokenParameter]: config.maxOutputTokens})};
    const body = await request(config, payload, options);
    if ((responses && body.status === 'incomplete' && body.incomplete_details?.reason === 'max_output_tokens') || (!responses && body.choices?.[0]?.finish_reason === 'length')) throw new ModelApiError('api_output_limit', '模型输出被服务商截断，正在移除本地输出限制后重试。');
    let calls, text, reasoning = '', reasoningKind = 'none', additions;
    if (responses) {
      if (!Array.isArray(body.output) || body.status === 'failed' || body.error) throw new ModelApiError('api_invalid_response', 'Responses 接口没有返回可用输出。');
      additions = body.output;
      calls = body.output.filter(item => item.type === 'function_call').map(item => ({id: item.call_id, name: item.name, arguments: item.arguments}));
      text = body.output.filter(item => item.type === 'message').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
      reasoning = body.output.filter(item => item.type === 'reasoning').flatMap(item => item.summary || []).filter(item => item.type === 'summary_text').map(item => item.text).join('\n');
      const encrypted = body.output.some(item => item.type === 'reasoning' && item.encrypted_content);
      reasoningKind = reasoning ? 'provider_summary' : encrypted ? 'encrypted_unavailable' : 'none';
    } else {
      const message = body.choices?.[0]?.message;
      if (!message || message.role !== 'assistant') throw new ModelApiError('api_invalid_response', 'Chat Completions 接口没有返回可用消息。');
      const kept = {role: 'assistant', content: message.content ?? null};
      if (message.tool_calls?.length) kept.tool_calls = message.tool_calls;
      // Some compatible reasoning models require this field on subsequent tool requests.
      if (message.reasoning_content !== undefined) kept.reasoning_content = message.reasoning_content;
      additions = [kept];
      calls = (message.tool_calls || []).map(item => ({id: item.id, name: item.function?.name, arguments: item.function?.arguments}));
      text = typeof message.content === 'string' ? message.content : '';
      reasoning = typeof message.reasoning_content === 'string' ? message.reasoning_content : '';
      reasoningKind = reasoning ? 'provider_reasoning_content' : 'none';
    }
    if (calls.length > 32 || calls.some(call => typeof call.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(call.name || '')) || new Set(calls.map(call => call.id)).size !== calls.length) throw new ModelApiError('api_invalid_tools', '模型返回了无效或过多的工具调用。');
    for (const item of additions) {this.messages.push(item); this.#account(item);}
    const usage = body.usage || {};
    const input = Number(usage.prompt_tokens ?? usage.input_tokens) || 0;
    const cache = usage.prompt_cache_hit_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? usage.input_tokens_details?.cached_tokens;
    const cachedInput = Number.isFinite(Number(cache)) && cache != null ? Math.max(0, Math.min(input, Number(cache))) : null;
    return {calls, text, reasoning, reasoningKind, usage: {reported: 'prompt_tokens' in usage || 'input_tokens' in usage || 'completion_tokens' in usage || 'output_tokens' in usage, input, output: Number(usage.completion_tokens ?? usage.output_tokens) || 0, cachedInput, uncachedInput:cachedInput == null ? null : input-cachedInput}};
  }

  result(call, value) {
    const output = JSON.stringify(value);
    const item = this.config.protocol === 'responses' ? {type: 'function_call_output', call_id: call.id, output} : {role: 'tool', tool_call_id: call.id, content: output};
    this.messages.push(item);
    this.#account(item);
  }

  remind(message) {const item = {role: 'user', content: message}; this.messages.push(item); this.#account(item);}
}

export async function checkModelApi(input, options) {
  const config = normalizeModelApi(input);
  const conversation = new ModelConversation(config, [{name: 'connection_ready', description: 'Confirm this connection supports function calls.', inputSchema: {type: 'object', properties: {}, additionalProperties: false}}], 'This is a tool compatibility check. Call connection_ready exactly once with an empty object. No other output is needed.', 'Check the connection now.');
  const result = await conversation.complete(options);
  const ready = result.calls.some(call => {
    if (call.name !== 'connection_ready') return false;
    try {const value = JSON.parse(call.arguments); return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;} catch {return false;}
  });
  if (!ready) throw new ModelApiError('api_tools_required', '已收到响应，但模型未按要求调用工具。请确认该模型和接口支持工具调用。');
  return {ok: true, protocol: config.protocol, model: config.model};
}
