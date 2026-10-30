// Only the desktop main process reads operator links. Never expose them over HTTP.
const fs = require('node:fs');
const path = require('node:path');

function validOperatorLink(value, origin) {
  try {
    const url = new URL(value);
    return url.origin === new URL(origin).origin && url.pathname === '/' && /^#setup=[a-fA-F0-9]{48}$/.test(url.hash) ? url.href : null;
  } catch {return null;}
}

async function existingOperatorLink(root, origin, request = fetch) {
  for (const name of ['desktop-server.log', 'server-error.log']) {
    let text;
    try {text = fs.readFileSync(path.join(root, 'logs', name), 'utf8');} catch {continue;}
    const links = [...text.matchAll(/http:\/\/[^\s]+\/#setup=[a-fA-F0-9]{48}/g)].reverse();
    for (const match of links.slice(0, 3)) {
      const candidate = validOperatorLink(match[0], origin);
      if (!candidate) continue;
      const token = new URL(candidate).hash.slice('#setup='.length);
      try {
        const response = await request(new URL('/api/lobby', origin), {headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(1500)});
        if (response.ok) return candidate;
      } catch {}
    }
  }
  return null;
}

async function authorizedMatchNavigation(origin, operator, target, request = fetch) {
  try {
    const destination = new URL(target), source = new URL(origin);
    if (destination.protocol !== 'http:' || destination.hostname !== '127.0.0.1' || destination.pathname !== '/' || destination.username || destination.password) return false;
    const capability = new URL(operator).hash.slice('#setup='.length);
    if (!/^[a-fA-F0-9]{48}$/.test(capability) || destination.hash !== `#setup=${capability}`) return false;
    const response = await request(new URL('/api/lobby', source), {headers: {Authorization: `Bearer ${capability}`}, signal: AbortSignal.timeout(1500)});
    if (!response.ok) return false;
    const lobby = await response.json();
    return lobby.started === true && new URL(lobby.url).origin === destination.origin;
  } catch {return false;}
}

module.exports = {validOperatorLink, existingOperatorLink, authorizedMatchNavigation};
