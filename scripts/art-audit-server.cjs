// Static-only isolated renderer fixture. No engine, drivers or save writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = route === '/' ? path.join(root, 'output/playwright/unit-animation-preview.html')
    : ['/rules.mjs', '/river-network.mjs', '/nations.mjs', '/congress.mjs'].includes(route) ? path.join(root, 'src', route.slice(1))
    : path.resolve(root, 'web', '.' + route);
  if (!file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.png':'image/png', '.jpg':'image/jpeg', '.json':'application/json'}[path.extname(file)] || 'application/octet-stream');
    res.end(bytes);
  });
});
server.listen(0, '127.0.0.1', () => console.log(server.address().port));
