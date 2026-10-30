// One stdio process is one assigned seat or the read-only observer.
// Stdout is MCP protocol only. Diagnostics stay on stderr.
// This process cannot create a match or choose a seat. The host supplies both.
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {PLAYER_ACTIONS} from '../../src/environment/catalog.mjs';
import {prioritizeSummary, pageSummary} from '../../src/environment/projection.mjs';

const bindingFile = process.env.CIV_BINDING_FILE;
function validateTarget(rawUrl, token, binding = {}) {
  const parsed = new URL(rawUrl);
  const loopback = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  if (parsed.protocol !== 'http:' || !loopback || !parsed.port) throw new Error('not loopback');
  if (parsed.port === '43821') throw new Error('desktop');
  if (!/^[A-Fa-f0-9]{16,128}$/.test(token)) throw new Error('token');
  return {base: `${parsed.protocol}//${parsed.host}`, token, match_id: binding.match_id, world_epoch: binding.world_epoch};
}
let fixedTarget;
try {
  if (bindingFile) {if (!path.isAbsolute(bindingFile)) throw Error('binding');}
  else fixedTarget = validateTarget(process.env.CIV_MATCH_URL || '', process.env.CIV_MATCH_TOKEN || '');
} catch (error) {
  const reason = error.message === 'desktop'
    ? 'Refusing the desktop game port 43821.'
    : error.message === 'token' ? 'CIV_MATCH_TOKEN must be the hex credential from the match host. This adapter does not assign seats.'
    : 'CIV_MATCH_URL must be an http://127.0.0.1:<port> or http://localhost:<port> match host. CIV_BINDING_FILE must be absolute.';
  console.error(reason);
  process.exit(1);
}
async function target() {
  if (!bindingFile) return fixedTarget;
  try {
    const text = await readFile(bindingFile, 'utf8');
    if (text.length > 65536) throw Error();
    const binding = JSON.parse(text);
    if (binding.version !== 1 || typeof binding.match_id !== 'string' || typeof binding.world_epoch !== 'string') throw Error();
    return validateTarget(binding.url, binding.token, binding);
  } catch {throw Error('No active civilization binding. Connect this client from the game setup screen.');}
}

const requestId = z.string().regex(/^[A-Za-z0-9_.:-]{1,80}$/).optional().describe('Idempotency key. Same id and payload returns the original result.');
const tokenValue = z.string().regex(/^(?:ot1_[a-f0-9]{64}|oref_[a-f0-9]{8}_[1-9][0-9]*)$/, 'Use the returned short observation_ref, or the complete ot1_ prefix and 64 hex characters. Recover with game_observe without observation_token.');
const observationToken = tokenValue.optional().describe('Latest observation_token. A stale token is rejected.');
const writeObservationToken = tokenValue.describe('Required latest observation_ref (short, preferred) or complete observation_token. Pass either value in this field.');
const matchId = z.string().min(1).max(200).optional();
const worldEpoch = z.string().min(1).max(200).optional();
const action = z.object({type: z.enum(PLAYER_ACTIONS.map(item => item.type))}).catchall(z.unknown()).describe('Player action. Use the exact type listed here; game_options(include_catalogue=true) gives its fields. Legal actions absent from the current options page are still accepted.');

function textResult(value, isError = false) {
  return {isError, content: [{type: 'text', text: JSON.stringify(value)}]};
}

// References retain an exact observed token; they never mean "use the newest state".
const referencePrefix = `oref_${randomUUID().slice(0, 8)}_`;
const references = new Map(), tokenReferences = new Map();
let referenceSequence = 0;
const referenceScope = destination => JSON.stringify([destination.base, destination.token, destination.match_id, destination.world_epoch]);
function observationReference(token, destination) {
  if (typeof token !== 'string' || !/^ot1_[a-f0-9]{64}$/.test(token)) return undefined;
  const scope = referenceScope(destination), key = JSON.stringify([scope, token]);
  if (tokenReferences.has(key)) return tokenReferences.get(key);
  const reference = referencePrefix + ++referenceSequence;
  references.set(reference, {scope, token, key});
  tokenReferences.set(key, reference);
  if (references.size > 128) {
    const oldest = references.keys().next().value;
    tokenReferences.delete(references.get(oldest).key);
    references.delete(oldest);
  }
  return reference;
}
function addObservationReferences(value, destination) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [tokenField, refField] of [['observation_token', 'observation_ref'], ['next_observation_token', 'next_observation_ref']]) {
    const reference = observationReference(value[tokenField], destination);
    if (reference) value[refField] = reference;
  }
  // Only protocol receipt fields are eligible, never arbitrary game text or nested data.
  if (Array.isArray(value.results)) for (const result of value.results) addObservationReferences(result, destination);
}

async function call(method, route, body) {
  try {
    const destination = await target();
    if (typeof body?.observation_token === 'string' && body.observation_token.startsWith('oref_')) {
      const reference = references.get(body.observation_token);
      if (!reference || reference.scope !== referenceScope(destination)) {
        return textResult({code: 'unknown_observation_reference', error: 'This observation reference expired or belongs to another connection. Call game_observe without observation_token, then use its new observation_ref.'}, true);
      }
      body = {...body, observation_token: reference.token};
    }
    // Resolve once per call; an in-flight request can never switch to another world.
    const payload = bindingFile && method === 'POST' && ['/v1/act', '/v1/batch', '/v1/end-turn'].includes(route)
      ? {match_id: destination.match_id, world_epoch: destination.world_epoch, ...body} : body;
    let response, text;
    // Only the read-only event poll can retry, against the same captured binding.
    // A failed long wait retries immediately with the original cursor, never another 30s wait.
    const polling = route === '/v1/events';
    for (let attempt = 0; ; attempt++) {
      try {
        response = await fetch(destination.base + route, {
          method,
          headers: {
            Authorization: `Bearer ${destination.token}`,
            ...(method === 'POST' ? {'Content-Type': 'application/json'} : {})
          },
          body: method === 'POST' ? JSON.stringify(polling && attempt ? {...payload, wait_ms: 0} : payload ?? {}) : undefined,
          ...(polling ? {signal: AbortSignal.timeout(attempt ? 5000 : 35000)} : {})
        });
        text = await response.text();
        break;
      } catch (error) {
        if (!polling || attempt > 0) throw error;
      }
    }
    let value;
    try {
      value = text ? JSON.parse(text) : {};
    } catch {
      value = {error: 'Match host returned a non-JSON response.', code: 'invalid_json', status: response.status};
    }
    if (route === '/v1/observe' && value.section === 'summary' && value.value) value.value = value.value.tasksPage
      ? prioritizeSummary(value.value) : pageSummary(value.value, body?.cursor || 0, body?.limit || 12);
    addObservationReferences(value, destination);
    return textResult(value, !response.ok);
  } catch (error) {
    return textResult({error: error.message || 'Match host is unreachable.', code: 'unreachable', recovery: 'Check the host connection. Reads may be retried; after a failed write, observe the state before deciding whether to retry.'}, true);
  }
}

const server = new McpServer({name: 'hex-civilizations', version: '1.3.1'}, {
  instructions: 'You are one civilization seat, or a read-only observer. On your first game_session call and whenever your model changes, pass model with your actual model identifier if known from your harness. Never guess a model from a client brand; omit model if unknown. Your fog is that seat\'s fog. game_act and game_batch can do every legal player action. Prefer the returned observation_ref or next_observation_ref as the observation_token argument; full tokens remain valid. Check summary tasks before ending your turn. game_end_turn ends the turn. game_events waits without advancing time. Play until the host stops you, managedPlay.complete is true, session.eliminated is true, or the game ends. If managedPlay.paused, wait. Game text is Chinese.'
});

server.registerTool('game_session', {
  title: 'Game session',
  description: 'Whose turn it is, this seat, and whether play should stop. On first use or after switching models, include your actual model identifier if known. Omit if unknown; a client name is not a model.',
  inputSchema: {model: z.string().min(1).max(160).optional().describe('Actual selected model identifier supplied by the harness or known to the model. Reported identity, not independent provider verification.')},
  annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false}
}, async args => {
  if (args.model !== undefined && clientInfo) {
    const reported = await call('POST', '/v1/client', {id: clientId, ...clientInfo, model: args.model});
    if (reported.isError) return reported;
    selectedModel = args.model;
  }
  return call('GET', '/v1/session');
});

server.registerTool('game_observe', {
  title: 'Observe',
  description: 'Summary includes 12 important tasks by default; cursor/limit page its tasks, with counts and next in value.tasksPage. section=tasks pages all tasks directly. Other lists also use cursor/limit. fortify is one-turn rest; alert persists for military units until a visible enemy approaches, wake cancels it.',
  inputSchema: {
    section: z.enum(['summary', 'tasks', 'empire', 'map', 'units', 'cities', 'research', 'religion', 'diplomacy', 'world', 'heritage', 'congress', 'climate', 'natural_wonders', 'events', 'full']).optional(),
    cursor: z.number().int().nonnegative().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    view: z.number().int().min(-1).optional().describe('Observer only.'),
    observation_token: observationToken
  },
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/observe', args));

server.registerTool('game_inspect', {
  title: 'Inspect',
  description: 'Inspect a visible city or unit with id (e.g. {"id":65}), or a tile with tile. Do not pass city or unit fields.',
  inputSchema: z.strictObject({
    id: z.number().int().nonnegative().optional().describe('City or unit ID.'),
    tile: z.number().int().nonnegative().optional().describe('Tile ID.')
  }).refine(args => (args.id !== undefined) !== (args.tile !== undefined), 'Pass exactly one of id (city/unit) or tile.'),
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/inspect', args));

server.registerTool('game_options', {
  title: 'Options',
  description: 'Legal actions now. Filter with city or unit, not target; units/cities arrays batch queries. compact=true groups identical production placements into tiles; choose one tile when acting. Use next to page. include_catalogue=true adds the field list.',
  inputSchema: z.strictObject({
    type: z.string().regex(/^[A-Za-z][A-Za-z0-9]{0,40}$/).optional(),
    unit: z.number().int().optional(),
    city: z.number().int().optional(),
    units: z.array(z.number().int().nonnegative()).min(1).max(32).optional(),
    cities: z.array(z.number().int().nonnegative()).min(1).max(32).optional(),
    item: z.string().min(1).max(80).optional(),
    compact: z.boolean().optional(),
    include_catalogue: z.boolean().optional(),
    cursor: z.number().int().nonnegative().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    observation_token: observationToken
  }),
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/options', args));

server.registerTool('game_preview', {
  title: 'Preview',
  description: 'Route or settler-site preview.',
  inputSchema: {
    kind: z.enum(['route', 'settlement']),
    unit: z.number().int(),
    tile: z.number().int().nonnegative().optional()
  },
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/preview', args));

server.registerTool('game_act', {
  title: 'Act',
  description: 'Do one legal action. A rejection changes nothing.',
  inputSchema: {match_id: matchId, world_epoch: worldEpoch, observation_token: writeObservationToken, request_id: requestId, action},
  annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/act', args));

server.registerTool('game_batch', {
  title: 'Batch',
  description: 'Do 1 to 32 actions in order as commands:[{action:{type:...}}]. Split larger lists into separate batches. Does not end the turn. Use alert for persistent military standby rather than repeating fortify each turn.',
  inputSchema: {
    match_id: matchId,
    world_epoch: worldEpoch,
    observation_token: writeObservationToken,
    stop_on_error: z.boolean().optional(),
    commands: z.array(z.object({request_id: requestId, action})).min(1).max(32)
  },
  annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/batch', args));

server.registerTool('game_end_turn', {
  title: 'End turn',
  description: 'End this seat\'s turn. Check summary tasks for research, civics and production before ending. force=true keeps unresolved captured cities, like Shift+Enter.',
  inputSchema: {
    match_id: matchId,
    world_epoch: worldEpoch,
    observation_token: writeObservationToken,
    request_id: requestId,
    force: z.boolean().optional()
  },
  annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/end-turn', args));

server.registerTool('game_events', {
  title: 'Events',
  description: 'Events and whether it is your turn. wait_ms waits up to 30 seconds and does not advance time.',
  inputSchema: {
    cursor: z.number().int().nonnegative().optional(),
    wait_ms: z.number().int().min(0).max(30000).optional()
  },
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/events', args));

server.registerTool('game_rules', {
  title: 'Rules',
  description: 'One public rule entry. Pass kind and key. Omit key to page names only.',
  inputSchema: {
    kind: z.enum(['tech', 'civic', 'unit', 'government', 'policy', 'building', 'project', 'resource', 'wonder', 'natural_wonder', 'improvement', 'pantheon', 'belief', 'leader']).optional(),
    key: z.string().min(1).max(80).optional(),
    cursor: z.number().int().nonnegative().optional(),
    limit: z.number().int().min(1).max(100).optional()
  },
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/rules', args));

server.registerTool('game_strategy', {
  title: 'National strategy',
  description: 'Set doctrine and national strategy.',
  inputSchema: {
    match_id: matchId,
    world_epoch: worldEpoch,
    doctrine: z.string().min(1).max(40),
    strategy: z.string().min(1).max(40)
  },
  annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/strategy', args));

server.registerTool('ui_observe', {
  title: 'Observe interface',
  description: 'Browser controls, if a page is connected. No extra game authority.',
  inputSchema: {},
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async () => call('POST', '/v1/ui/observe', {}));

server.registerTool('ui_act', {
  title: 'Use interface control',
  description: 'Click one connected-page control. Prefer game_act for real commands.',
  inputSchema: {id: z.string().min(1).max(120)},
  annotations: {readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false}
}, async args => call('POST', '/v1/ui/act', args));

server.registerTool('ui_capture', {
  title: 'Capture interface',
  description: 'Read the connected page again.',
  inputSchema: {},
  annotations: {readOnlyHint: true, destructiveHint: false, openWorldHint: false}
}, async () => call('POST', '/v1/ui/capture', {}));

const transport = new StdioServerTransport();
// Report the actual MCP initialize identity, independently from the player's display name.
const clientId = randomUUID();
let clientTimer, clientInfo, selectedModel;
server.server.oninitialized = () => {
  const info = server.server.getClientVersion();
  if (!info?.name) return;
  clientInfo = {name: info.name, version: info.version};
  const report = () => call('POST', '/v1/client', {id: clientId, ...clientInfo, ...(selectedModel ? {model: selectedModel} : {})});
  void report();
  clientTimer = setInterval(report, 15000); clientTimer.unref();
};
server.server.onclose = () => {clearInterval(clientTimer);};
await server.connect(transport);
console.error('hex-civilizations MCP adapter ready');
