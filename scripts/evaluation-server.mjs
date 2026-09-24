// Local evaluation kit only. No participant upload endpoint, telemetry, worker,
// fixture seeding or answers shown in the participant interface.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([
  ['/', 'dist/workspace.html'], ['/index.html', 'dist/workspace.html'], ['/styles.css', 'dist/styles.css'],
  ['/preview.html', 'dist/preview.html'],
  ...['app', 'bootstrap', 'demo', 'preview', 'model', 'storage', 'source-selection', 'schema-v1', 'schema-v2', 'comparison', 'review-ui', 'dependencies', 'dependency-ui', 'dependency-demo', 'drafts', 'offline'].map(name => [`/src/${name}.js`, `dist/src/${name}.js`]),
  ['/evaluation/', 'evaluation/index.html'],
  ...['checklist.js', 'checklist-model.js', 'fixtures.js', 'styles.css'].map(name => [`/evaluation/${name}`, `evaluation/${name}`]),
]);
export function createEvaluationServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end('GET/HEAD only'); return; }
    const file = !url.search && routes.get(url.pathname);
    if (!file) { response.writeHead(404).end('Not found'); return; }
    try {
      let body = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
      if (file === 'dist/src/bootstrap.js') body = `globalThis.STEPTRACE_DISABLE_OFFLINE = true;\n${body}`;
      const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html';
      response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'" }).end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(500).end('Evaluation asset unavailable.'); }
  });
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const port = Number(process.env.PORT ?? 4196);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535.');
  createEvaluationServer().listen(port, '127.0.0.1', () => console.log(`Local evaluation kit: http://127.0.0.1:${port}/evaluation/ ; StepTrace: http://127.0.0.1:${port}/`));
}
