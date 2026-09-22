// Development-only browser harness. Never served by the production allowlist.
// Examples: node tests/browser-server.mjs (real isolated storage at port 4174)
// STEPTRACE_STORAGE_FAULT=quota PORT=4175 node tests/browser-server.mjs
// Seed a fictional plan in normal mode, then restart the same isolated origin:
// STEPTRACE_STORAGE_FAULT=interrupt-once STEPTRACE_FAULT_ID=case1 PORT=4194 node tests/browser-server.mjs
// One aborted write is remembered across same-tab reloads. Retry then saves to
// real localStorage. Use a new fault ID for another case; never clear user data.
// STEPTRACE_SESSION_FAULT=unavailable independently denies draft/recovery access.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT ?? 4174);
const fault = process.env.STEPTRACE_STORAGE_FAULT ?? '';
const sessionFault = process.env.STEPTRACE_SESSION_FAULT ?? '';
const faultId = process.env.STEPTRACE_FAULT_ID ?? 'session5';
if (!['', 'quota', 'unavailable', 'corrupt', 'quota-once', 'interrupt-once'].includes(fault)) throw new Error('Unsupported test fault');
if (!['', 'unavailable'].includes(sessionFault)) throw new Error('Unsupported session-storage test fault');
if (!/^[a-zA-Z0-9_-]{1,80}$/.test(faultId)) throw new Error('Test fault ID must contain 1–80 letters, digits, underscores, or hyphens');
const assets = new Map([['/', 'index.html'], ['/styles.css', 'styles.css'], ...['app', 'bootstrap', 'demo', 'model', 'storage', 'source-selection', 'schema-v1', 'schema-v2', 'comparison', 'review-ui', 'dependencies', 'dependency-ui', 'dependency-demo', 'drafts', 'offline'].map(name => [`/src/${name}.js`, `src/${name}.js`])]);
createServer(async (request, response) => {
  const asset = assets.get(new URL(request.url, 'http://127.0.0.1').pathname);
  if (!asset) { response.writeHead(404).end(); return; }
  try {
    let body = await readFile(new URL(`../dist/${asset}`, import.meta.url), 'utf8');
    if (asset === 'src/bootstrap.js' && fault === 'interrupt-once') body = `
import { startApp } from './app.js';
import { createStorage } from './storage.js';
const markerKey = ${JSON.stringify(`steptrace.test.interrupt-once.${faultId}`)};
// Capture only this test marker store before optional sessionStorage denial.
const markerStorage = globalThis.sessionStorage;
const store = {
  getItem(key) { return globalThis.localStorage.getItem(key); },
  setItem(key, value) {
    if (markerStorage.getItem(markerKey) !== 'failed') {
      markerStorage.setItem(markerKey, 'failed');
      throw new DOMException('Synthetic interrupted write before commit', 'AbortError');
    }
    globalThis.localStorage.setItem(key, value);
  }
};
${sessionFault === 'unavailable' ? `Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new DOMException('Synthetic recovery storage denial', 'SecurityError'); } });` : ''}
startApp(createStorage(() => store));`;
    else if (asset === 'src/bootstrap.js' && fault) body = `
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
    if (asset === 'src/bootstrap.js' && sessionFault && fault !== 'interrupt-once') body = `
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new DOMException('Synthetic recovery storage denial', 'SecurityError'); } });
${body}`;
    // Never let synthetic storage or injected test behavior enter an app shell
    // cache. Real offline checks use the production server on an unused origin.
    if (asset === 'src/bootstrap.js') body = `globalThis.STEPTRACE_DISABLE_OFFLINE = true;\n${body}`;
    response.writeHead(200, { 'Content-Type': asset.endsWith('.js') ? 'text/javascript' : asset.endsWith('.css') ? 'text/css' : 'text/html', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'" }).end(body);
  } catch { response.writeHead(500).end(); }
}).listen(port, '127.0.0.1', () => console.log(`StepTrace browser test (${fault || 'normal storage'}${fault === 'interrupt-once' ? `; case ${faultId}` : ''}${sessionFault ? '; recovery storage denied' : ''}): http://127.0.0.1:${port}`));
