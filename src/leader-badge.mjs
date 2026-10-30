// One formatter for the historical leader plus the public AI label.
export function agentBadgeText(controller, {reveal = true} = {}) {
  if (!reveal || controller?.kind !== 'agent') return '';
  const name = typeof controller.displayName === 'string' ? controller.displayName.trim() : '';
  if (!name || name.length > 24 || /[\u0000-\u001f【】]/.test(name)) return '';
  return `【${name}】`;
}

export function formatLeaderIdentity(leaderName, controller, options) {
  const name = String(leaderName ?? '');
  const badge = agentBadgeText(controller, options);
  if (!badge || name.endsWith(badge)) return name;
  return name + badge;
}

export function leaderBadgeHtml(leaderName, controller, {reveal = true, esc = value => String(value ?? '')} = {}) {
  const plain = String(leaderName ?? '');
  const full = formatLeaderIdentity(plain, controller, {reveal});
  if (full === plain) return esc(plain);
  return `${esc(plain)}<span class="leader-ai-badge" title="${esc(full)}">${esc(full.slice(plain.length))}</span>`;
}
