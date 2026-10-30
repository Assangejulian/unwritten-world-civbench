// Reference client for the loopback match host. It uses the same contract as MCP.
const url = process.env.CIV_MATCH_URL;
const token = process.env.CIV_MATCH_TOKEN;
const command = process.argv[2];
if (!url || !token || !command) {
  console.error('Usage: CIV_MATCH_URL=... CIV_MATCH_TOKEN=... node scripts/environment-cli.mjs <session|observe|inspect|options|preview|act|batch|end-turn|events|rules> [json]');
  process.exit(1);
}
const body = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const routes = {session: ['GET', '/v1/session'], observe: ['POST', '/v1/observe'], inspect: ['POST', '/v1/inspect'], options: ['POST', '/v1/options'], preview: ['POST', '/v1/preview'], act: ['POST', '/v1/act'], batch: ['POST', '/v1/batch'], 'end-turn': ['POST', '/v1/end-turn'], events: ['POST', '/v1/events'], rules: ['POST', '/v1/rules']};
const route = routes[command];
if (!route) {
  console.error('Unknown command.');
  process.exit(1);
}
const response = await fetch(url + route[1], {method: route[0], headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'}, body: route[0] === 'POST' ? JSON.stringify(body) : undefined});
const result = await response.json();
if (!response.ok) {
  console.error(JSON.stringify(result));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
