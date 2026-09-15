// Development-only browser harness. Never served by the production allowlist.
// Examples: node tests/browser-server.mjs (real isolated storage at port 4174)
// STEPTRACE_STORAGE_FAULT=quota PORT=4175 node tests/browser-server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT ?? 4174);
const fault = process.env.STEPTRACE_STORAGE_FAULT ?? '';
if (!['', 'quota', 'unavailable', 'corrupt', 'quota-once'].includes(fault)) throw new Error('Unsupported test fault');
const assets = new Map([['/', 'index.html'], ['/styles.css', 'styles.css'], ...['app', 'bootstrap', 'demo', 'model', 'storage', 'source-selection', 'schema-v1', 'comparison', 'review-ui'].map(name => [`/src/${name}.js`, `src/${name}.js`])]);
createServer(async (request, response) => {
  const asset = assets.get(new URL(request.url, 'http://127.0.0.1').pathname);
  if (!asset) { response.writeHead(404).end(); return; }
  try {
    let body = await readFile(new URL(`../dist/${asset}`, import.meta.url), 'utf8');
    if (asset === 'src/bootstrap.js' && fault) body = `
import { startApp } from './app.js';
import { createStorage } from './storage.js';
let raw = ${fault === 'corrupt' ? JSON.stringify('{broken') : 'null'};
let writes = 0;
const store = {
  getItem() { return raw; },
  setItem(key, value) {
    writes += 1;
    if (${JSON.stringify(fault)} === 'quota' || (${JSON.stringify(fault)} === 'quota-once' && writes === 1)) throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
    raw = value;
  }
};
startApp(createStorage(() => {
  if (${JSON.stringify(fault)} === 'unavailable') throw new DOMException('Synthetic storage denial', 'SecurityError');
  return store;
}));`;
    response.writeHead(200, { 'Content-Type': asset.endsWith('.js') ? 'text/javascript' : asset.endsWith('.css') ? 'text/css' : 'text/html', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'" }).end(body);
  } catch { response.writeHead(500).end(); }
}).listen(port, '127.0.0.1', () => console.log(`StepTrace browser test (${fault || 'normal storage'}): http://127.0.0.1:${port}`));
