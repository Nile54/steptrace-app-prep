// Development diagnostics only; never on the production asset allowlist.
// Pinned engine: axe-core 4.10.3 (https://github.com/dequelabs/axe-core/releases/tag/v4.10.3).
// Fetch once: curl --fail https://registry.npmjs.org/axe-core/-/axe-core-4.10.3.tgz -o work/axe-core.tgz
// mkdir -p work/axe-core-4.10.3 && tar -xzf work/axe-core.tgz -C work/axe-core-4.10.3
// Engine SHA256: 880970c081707360e64f34cea25ff91892f5bc95675b0776925b9709dd8a68bb
// PORT=4191 node tests/accessibility-server.mjs ; visit /?diagnostics=1
// STEPTRACE_DIAGNOSTIC_SW=1 preserves the production shell/worker, injecting
// diagnostics ONLY at /?diagnostics=1. Use this at an existing test origin only
// after stopping its server. The worker never caches this query URL or harness.
// STEPTRACE_SW_TRACE=1 additionally modifies the test worker script and accepts
// local POSTs at /__test/sw-trace containing worker/cache stages and asset URLs.
// This trace mode is not production privacy evidence: the browser can retain
// the instrumented worker until it is replaced or unregistered. Normal production
// scripts/serve.mjs has neither the tracing code nor that diagnostic endpoint.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const port = Number(process.env.PORT ?? 4191);
const enableWorker = process.env.STEPTRACE_DIAGNOSTIC_SW === '1';
const traceWorker = process.env.STEPTRACE_SW_TRACE === '1';
const routes = new Map([
  ['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']],
  ['/preview.html', ['preview.html', 'text/html']], ['/styles.css', ['styles.css', 'text/css']],
  ['/sw.js', ['sw.js', 'text/javascript']],
  ...['app', 'bootstrap', 'demo', 'preview', 'model', 'storage', 'source-selection', 'schema-v1', 'schema-v2', 'comparison', 'review-ui', 'dependencies', 'dependency-ui', 'dependency-demo', 'drafts', 'offline'].map(name => [`/src/${name}.js`, [`src/${name}.js`, 'text/javascript']]),
]);
const engine = await readFile(new URL('../work/axe-core-4.10.3/package/axe.min.js', import.meta.url));
if (createHash('sha256').update(engine).digest('hex') !== '880970c081707360e64f34cea25ff91892f5bc95675b0776925b9709dd8a68bb') throw new Error('Pinned axe engine checksum mismatch');
async function revision() {
  const hash = createHash('sha256');
  for (const asset of [...new Set([...routes.values()].map(route => route[0]))].sort()) {
    hash.update(asset); hash.update(await readFile(new URL(`../dist/${asset}`, import.meta.url)));
  }
  return hash.digest('hex').slice(0, 24);
}
const diagnosticsMarkup = `<section id="test-diagnostics" class="panel" aria-labelledby="test-diagnostics-heading"><h2 id="test-diagnostics-heading">Development accessibility and privacy checks</h2><p>Test-only controls. Use fictional information. Results cover this current page state; automated checks do not prove WCAG conformance. Browser extensions and operating-system traffic are outside these observations.</p><div class="button-row"><button type="button" id="test-run-axe">Run axe accessibility scan</button><button type="button" id="test-refresh-diagnostics">Refresh browser diagnostics</button></div><label for="test-axe-output">Accessibility scan results</label><textarea readonly id="test-axe-output" rows="9">Not run.</textarea><label for="test-browser-output">Browser, layout, and network observations</label><textarea readonly id="test-browser-output" rows="12">Not checked.</textarea></section>`;
createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (traceWorker) console.log(`[request] ${request.method} ${url.pathname} destination=${request.headers['sec-fetch-dest'] ?? '-'} mode=${request.headers['sec-fetch-mode'] ?? '-'}`);
  if (traceWorker && url.pathname === '/__test/sw-trace' && request.method === 'POST') {
    let text = '';
    for await (const chunk of request) { text += chunk; if (text.length > 65536) { response.writeHead(413).end(); return; } }
    try { for (const entry of JSON.parse(text)) console.log(`[worker] ${entry.time} ${entry.stage} ${entry.detail}`); } catch { console.log('[worker] invalid diagnostic message'); }
    response.writeHead(204, { 'Cache-Control': 'no-store' }).end(); return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end('GET/HEAD only'); return; }
  let body, type = 'text/javascript';
  try {
    if (url.pathname === '/__test/axe.min.js') body = engine;
    else if (url.pathname === '/__test/diagnostics.js') body = await readFile(new URL('./accessibility-diagnostics.js', import.meta.url));
    else {
      const route = routes.get(url.pathname);
      if (!route || (url.pathname === '/sw.js' && !enableWorker)) { response.writeHead(404).end('Not found'); return; }
      [ , type ] = route;
      body = await readFile(new URL(`../dist/${route[0]}`, import.meta.url), 'utf8');
      if (route[0] === 'index.html' && (!enableWorker || url.searchParams.has('diagnostics'))) {
        body = body.replace('<head>', '<head><script src="/__test/diagnostics.js"></script><script src="/__test/axe.min.js"></script>');
        body = body.replace('</main>', `${diagnosticsMarkup}</main>`);
      }
      if (route[0] === 'src/bootstrap.js' && !enableWorker) body = `globalThis.STEPTRACE_DISABLE_OFFLINE = true;\n${body}`;
      if (route[0] === 'sw.js') {
        body = body.replace('__STEPTRACE_SHELL_REVISION__', await revision());
        if (traceWorker) body = `${await readFile(new URL('./service-worker-diagnostics.js', import.meta.url), 'utf8')}\n${body}`;
      }
    }
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" }).end(request.method === 'HEAD' ? undefined : body);
  } catch (error) { response.writeHead(500).end(error.message); }
}).listen(port, '127.0.0.1', () => console.log(`StepTrace diagnostics (worker ${traceWorker ? 'enabled with test-only tracing' : enableWorker ? 'enabled' : 'disabled'}): http://127.0.0.1:${port}/?diagnostics=1`));
