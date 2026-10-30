// Public seat controllers. Credentials never live on the player or in a save.
const KINDS = new Set(['human', 'agent', 'native', 'inactive']);

export function isDecisionSeat(player) {
  const kind = player?.controller?.kind;
  if (kind === 'human' || kind === 'agent') return true;
  if (kind === 'native' || kind === 'inactive') return false;
  return !!player?.manual;
}

export function isInactiveSeat(player) {
  return player?.controller?.kind === 'inactive';
}

export function validateDisplayName(name) {
  if (typeof name !== 'string') throw new Error('AI 名称必须是文本。');
  const trimmed = name.trim();
  const length = [...trimmed].length;
  if (!length || length > 24) throw new Error('AI 名称需要 1 到 24 个字符。');
  if (/[\u0000-\u001f【】]/.test(trimmed)) throw new Error('AI 名称不能包含换行或中文方括号。');
  return trimmed;
}

export function validateModelName(value) {
  if (typeof value !== 'string' || !value.trim() || [...value.trim()].length > 160 || /[\u0000-\u001f\u007f【】]/.test(value)) throw new Error('模型标识无效。');
  return value.trim();
}

export function assignController(player, kind, {displayName = null, agentId = null, bump = false, autoName = false} = {}) {
  if (!KINDS.has(kind)) throw new Error('Invalid controller.');
  const label = kind === 'agent' ? validateDisplayName(displayName) : null;
  if (agentId != null && (typeof agentId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(agentId))) throw new Error('Invalid agent id.');
  const previous = player.controller?.generation || 0;
  const generation = Math.max(1, previous + (bump || !player.controller ? 1 : 0));
  player.controller = {version: 1, kind, agentId: agentId || null, displayName: label, generation};
  if (kind === 'agent' && autoName) player.controller.autoName = true;
  player.manual = kind === 'human' || kind === 'agent';
  return player.controller;
}

export function migrateController(player) {
  if (player.controller === undefined) return;
  const controller = player.controller;
  if (!controller || typeof controller !== 'object' || Array.isArray(controller)) throw new Error('Invalid controller.');
  if (controller.version !== 1 || !KINDS.has(controller.kind)) throw new Error('Invalid controller.');
  if (controller.autoName !== undefined && typeof controller.autoName !== 'boolean') throw new Error('Invalid controller.');
  if (controller.modelId !== undefined) controller.modelId = validateModelName(controller.modelId);
  if ('token' in controller || 'secret' in controller || 'credential' in controller) throw new Error('Invalid controller.');
  if (controller.kind === 'agent') controller.displayName = validateDisplayName(controller.displayName);
  else controller.displayName = null;
  if (controller.agentId != null && (typeof controller.agentId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(controller.agentId))) throw new Error('Invalid controller.');
  if (!Number.isInteger(controller.generation) || controller.generation < 1 || controller.generation > 1e9) throw new Error('Invalid controller.');
  player.manual = controller.kind === 'human' || controller.kind === 'agent';
}

// Seated clients learn an unmet opponent's agent label only after contact.
export function publicControllers(game, view) {
  const self = view >= 0 ? game.players[view] : null;
  return game.players.map(player => {
    const reveal = view < 0 || player.id === view || !!self?.met?.includes(player.id);
    if (!reveal) return {seat: player.id, known: false};
    const controller = player.controller;
    const kind = controller?.kind || (player.manual ? 'human' : 'native');
    return {
      seat: player.id,
      known: true,
      kind,
      displayName: kind === 'agent' ? controller.displayName : null,
      generation: controller?.generation || 0
    };
  });
}
