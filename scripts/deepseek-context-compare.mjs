// Same-seed DeepSeek comparison. The key stays in the operator file and never enters this report.
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Lobby} from '../src/environment/lobby.mjs';
import {AgentLauncher} from '../src/environment/agent-launcher.mjs';
import {ModelContextStore, contextPath} from '../src/environment/model-context-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY_FILE = process.env.CIV_AUDIT_KEY_FILE;
const SEED = 'DEEPSEEK-SAME-SEED';
const OUT = path.join(ROOT, 'output', 'deepseek-compare-20261019');
const line = (KEY_FILE ? await readFile(KEY_FILE, 'utf8') : '').split(/\r?\n/).find(item => item.toLowerCase().startsWith('deepseek'));
const apiKey = process.env.DEEPSEEK_API_KEY || line?.split(':').slice(1).join(':').trim();
if (!apiKey || /[\r\n]/.test(apiKey)) throw new Error('Set DEEPSEEK_API_KEY or explicitly provide CIV_AUDIT_KEY_FILE for this paid comparison.');

function scrub(value) {
  const text = JSON.stringify(value).replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
  return JSON.parse(text);
}

async function waitFor(test, label, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await test()) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(label);
}

async function play(model) {
  const launcher = new AgentLauncher({outputRoot: path.join(OUT, model)});
  const lobby = new Lobby({stub: true, launcher});
  const started = Date.now();
  try {
    await lobby.prepare({players: 2, size: 'small', seed: SEED, barbarians: false, seats: [{seat: 0, kind: 'agent', displayName: model}, {seat: 1, kind: 'native'}]});
    await launcher.start(lobby, {seat: 0, rounds: 1, provider: 'api', api: {baseUrl: 'https://api.deepseek.com', model, protocol: 'chat-completions', apiKey, maxOutputTokens: 4096, timeoutSeconds: 180, contextTokens: 32768, tokenParameter: 'max_tokens'}});
    await waitFor(() => lobby.status().externalConnected === 1, `${model} did not connect`, 30000);
    await lobby.start({waitPolicy: 'wait', observer: true});
    await waitFor(() => {
      const status = launcher.status(0);
      return status && ['completed', 'failed', 'stopped'].includes(status.state);
    }, `${model} did not finish`, 300000);
    const status = launcher.status(0);
    const store = new ModelContextStore(contextPath(ROOT, lobby.runtime.id));
    const events = store.events(0, 0);
    const stats = store.stats(0);
    const recalled = store.workingSet(0);
    store.close();
    const commands = lobby.runtime.commands.filter(command => command.seat === 0).map(command => ({kind: command.kind, type: command.action?.type || null, status: command.status}));
    return scrub({
      model,
      seed: SEED,
      opponent: '测试桩，不是实战内置 AI',
      state: status?.state,
      error: status?.error || null,
      requests: status?.requests || 0,
      inputTokens: status?.inputTokens || 0,
      outputTokens: status?.outputTokens || 0,
      usageReported: !!status?.usageReported,
      completedTurns: lobby.runtime.managedPlayProgress(0)?.completed || 0,
      commands,
      seconds: Math.round((Date.now() - started) / 1000),
      sqlite: {messages: stats.messages, gzipBytes: stats.gzipBytes, hot: stats.hot, events: stats.events, eventTextBytes: stats.eventTextBytes, compression: recalled.compression},
      dialogue: events.filter(item => item.type === 'dialogue').map(item => ({fidelity: item.fidelity, chars: item.text.length, clippedAt1500: item.text.length === 1500})),
      reasoning: events.filter(item => item.type === 'reasoning').map(item => ({fidelity: item.fidelity, chars: item.text.length, head: item.text.slice(0, 80)})),
      tools: events.filter(item => item.type === 'tool').map(item => item.name)
    });
  } finally {
    launcher.dispose();
    lobby.dispose();
  }
}

await mkdir(OUT, {recursive: true});
const results = [];
const models = (process.env.COMPARE_MODELS || 'deepseek-chat,deepseek-reasoner').split(',').map(item => item.trim()).filter(Boolean);
for (const model of models) {
  try {results.push(await play(model));}
  catch (error) {results.push(scrub({model, seed: SEED, state: 'failed', error: error.message || 'compare failed'}));}
}
const report = {seed: SEED, paidModel: true, productionSave: false, sameSeed: true, results};
if (JSON.stringify(report).includes(apiKey)) throw new Error('Report contained the API key.');
await writeFile(path.join(OUT, process.env.COMPARE_REPORT || 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(results.map(item => ({model: item.model, state: item.state, error: item.error, requests: item.requests, inputTokens: item.inputTokens, outputTokens: item.outputTokens, completedTurns: item.completedTurns, dialogue: item.dialogue, reasoning: item.reasoning?.map(entry => ({fidelity: entry.fidelity, chars: entry.chars})), sqlite: item.sqlite, commands: item.commands})), null, 2));
