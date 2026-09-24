import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Serve only the demo assets, never repository metadata or local documents.
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/workspace', ['workspace.html', 'text/html; charset=utf-8']],
  ['/workspace.html', ['workspace.html', 'text/html; charset=utf-8']],
  ['/preview', ['preview.html', 'text/html; charset=utf-8']],
  ['/landing.css', ['landing.css', 'text/css; charset=utf-8']],
  ['/workspace-demo.jpg', ['workspace-demo.jpg', 'image/jpeg']],
  ['/preview.html', ['preview.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/sw.js', ['sw.js', 'text/javascript; charset=utf-8']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
  ['/src/demo.js', ['src/demo.js', 'text/javascript; charset=utf-8']],
  ...['bootstrap', 'preview', 'model', 'storage', 'source-selection', 'schema-v1', 'schema-v2', 'comparison', 'review-ui', 'dependencies', 'dependency-ui', 'dependency-demo', 'drafts', 'offline'].map(name => [`/src/${name}.js`, [`src/${name}.js`, 'text/javascript; charset=utf-8']]),
]);
// An asset change always produces a different worker and immutable cache name.
// The same server must serve the complete shell; it accepts no content uploads.
async function shellRevision() {
  const hash = createHash('sha256');
  for (const asset of [...new Set([...routes.values()].map(route => route[0]))].sort()) {
    hash.update(asset);
    hash.update(await readFile(new URL(`../dist/${asset}`, import.meta.url)));
  }
  return hash.digest('hex').slice(0, 24);
}
const port = Number(process.env.PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const route = routes.get(pathname);
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  if (!route) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    let body = await readFile(new URL(`../dist/${route[0]}`, import.meta.url));
    if (pathname === '/sw.js') body = body.toString('utf8').replace('__STEPTRACE_SHELL_REVISION__', await shellRevision());
    response.writeHead(200, {
      'Content-Type': route[1],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    }).end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end('Could not load a demo asset. Check that dist/ is present.');
  }
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is in use. Try PORT=4174 node scripts/serve.mjs.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Origin Scholar: http://127.0.0.1:${port}`));
