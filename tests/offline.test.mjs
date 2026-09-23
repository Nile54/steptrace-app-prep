import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const workerSource = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const uiSource = (await readFile(new URL('../dist/src/offline.js', import.meta.url), 'utf8')).replace('export function', 'function');
const origin = 'http://127.0.0.1:4173';

function workerHarness({ failPath, failPut, failBodyPath, redirects = {}, redirectType = 'text/html; charset=utf-8', connectionLimit = Infinity, revision = 'test-v5', initial = new Map() } = {}) {
  const handlers = new Map();
  const requests = [];
  const stores = initial;
  let activated = 0;
  let claimed = 0;
  let updates = 0;
  let activeConnections = 0;
  let peakConnections = 0;
  let drainedBodies = 0;
  const connectionQueue = [];
  const takeConnection = () => new Promise(resolve => {
    const start = () => { activeConnections += 1; peakConnections = Math.max(peakConnections, activeConnections); resolve(); };
    if (activeConnections < connectionLimit) start(); else connectionQueue.push(start);
  });
  const releaseConnection = () => { activeConnections -= 1; connectionQueue.shift()?.(); };
  const keyFor = request => new URL(typeof request === 'string' ? request : request.url, origin).href;
  const context = vm.createContext({
    URL, Request, Response, Set, Error,
    self: {
      location: { origin },
      addEventListener: (type, callback) => handlers.set(type, callback),
      skipWaiting: async () => { activated += 1; },
      clients: { claim: async () => { claimed += 1; } },
      registration: { update: async () => { updates += 1; } },
    },
    fetch: async request => {
      await takeConnection();
      requests.push({ url: request.url, credentials: request.credentials, cache: request.cache });
      const path = new URL(request.url).pathname;
      const response = new Response(path === '/sw.js' ? workerSource.replace('__STEPTRACE_SHELL_REVISION__', revision) : path, { status: path === failPath ? 500 : 200, headers: redirects[path] ? { 'Content-Type': redirectType } : {} });
      if (redirects[path]) Object.defineProperties(response, {
        redirected: { value: true }, url: { value: new URL(redirects[path], origin).href },
      });
      const readBody = response.arrayBuffer.bind(response);
      response.arrayBuffer = async () => {
        try {
          if (path === failBodyPath) throw new Error('Interrupted response body');
          const bytes = await readBody();
          drainedBodies += 1;
          return bytes;
        } finally { releaseConnection(); }
      };
      return response;
    },
    caches: {
      open: async name => {
        if (!stores.has(name)) stores.set(name, new Map());
        const store = stores.get(name);
        return {
          put: async (request, response) => {
            if (new URL(request.url).pathname === failPut) throw new Error('Quota');
            store.set(keyFor(request), response);
          },
          match: async request => store.get(keyFor(request))?.clone(),
        };
      },
      keys: async () => [...stores.keys()],
      delete: async name => stores.delete(name),
    },
  });
  vm.runInContext(workerSource.replace('__STEPTRACE_SHELL_REVISION__', 'test-v5'), context);
  const fire = async (type, extra = {}) => {
    let pending;
    handlers.get(type)({ ...extra, waitUntil: promise => { pending = promise; }, respondWith: promise => { pending = promise; } });
    return pending;
  };
  return { fire, stores, requests, paths: Array.from(vm.runInContext('ASSETS', context)), name: vm.runInContext('CACHE_NAME', context), activated: () => activated, claimed: () => claimed, updates: () => updates, peakConnections: () => peakConnections, drainedBodies: () => drainedBodies };
}

test('Offline installation caches every shipped module and both app entry points without workspace data', async () => {
  const harness = workerHarness();
  await harness.fire('install');
  const modules = (await readdir(new URL('../dist/src/', import.meta.url))).filter(name => name.endsWith('.js')).map(name => `/src/${name}`).sort();
  assert.deepEqual(harness.paths.filter(path => path.startsWith('/src/')).sort(), modules);
  assert.ok(harness.paths.includes('/') && harness.paths.includes('/index.html') && harness.paths.includes('/preview.html'));
  assert.equal(harness.stores.get(harness.name).size, harness.paths.length);
  assert.equal(harness.activated(), 0, 'Installation must not force an update on an open form');
  assert.ok(harness.requests.every(request => request.credentials === 'omit' && request.cache === 'reload' && new URL(request.url).origin === origin && !new URL(request.url).search));
});

test('Offline installation drains bodies before waiting for remaining requests on a three-connection browser pool', { timeout: 2000 }, async () => {
  const harness = workerHarness({ connectionLimit: 3 });
  await harness.fire('install');
  assert.equal(harness.peakConnections(), 3);
  assert.equal(harness.drainedBodies(), harness.paths.length);
  assert.equal(harness.stores.get(harness.name).size, harness.paths.length);
});

test('Known same-origin HTML canonical redirects keep both URL forms available offline and during repair', async () => {
  const harness = workerHarness({ redirects: { '/index.html': '/', '/preview.html': '/preview' }, connectionLimit: 3 });
  await harness.fire('install');
  assert.equal(harness.stores.get(harness.name).size, harness.paths.length);
  const installedRequests = harness.requests.length;
  for (const [path, body] of [['/', '/'], ['/index.html', '/index.html'], ['/preview.html', '/preview.html'], ['/preview', '/preview.html']]) {
    const response = await harness.fire('fetch', { request: new Request(`${origin}${path}`) });
    assert.equal(await response.text(), body);
  }
  assert.equal(harness.requests.length, installedRequests, 'Canonical navigation uses the cached file, not a new network request');
  harness.stores.delete(harness.name);
  const repaired = await harness.fire('fetch', { request: new Request(`${origin}/preview`) });
  assert.equal(await repaired.text(), '/preview.html');
  assert.equal(harness.activated(), 0, 'Canonical support must not force activation over open work');
});

test('Unrecognized redirects and non-HTML canonical responses fail without replacing the previous shell', async () => {
  for (const options of [
    { redirects: { '/index.html': 'https://example.invalid/' } },
    { redirects: { '/index.html': '/?login=1' } },
    { redirects: { '/index.html': '/#login' } },
    { redirects: { '/index.html': '/login' } },
    { redirects: { '/preview.html': '/' } },
    { redirects: { '/': '/index.html' } },
    { redirects: { '/src/model.js': '/model' } },
    { redirects: { '/styles.css': '/styles' } },
    { redirects: { '/index.html': '/' }, redirectType: 'text/plain' },
  ]) {
    const previous = new Map([['kept', 'old shell']]);
    const harness = workerHarness({ ...options, initial: new Map([['steptrace-shell-old', previous]]) });
    await assert.rejects(harness.fire('install'), /Incomplete app shell/);
    assert.equal(harness.stores.get('steptrace-shell-old'), previous);
    assert.equal(harness.stores.has(harness.name), false);
    assert.equal(harness.activated(), 0);
  }
});

test('Missing file, interrupted body or cache quota failure rejects installation and preserves the prior complete shell', async () => {
  for (const options of [{ failPath: '/src/model.js' }, { failBodyPath: '/src/model.js' }, { failPut: '/styles.css' }]) {
    const previous = new Map([['kept', 'old shell']]);
    const harness = workerHarness({ ...options, initial: new Map([['steptrace-shell-old', previous]]) });
    await assert.rejects(harness.fire('install'));
    assert.equal(harness.stores.get('steptrace-shell-old'), previous);
    assert.equal(harness.stores.has(harness.name), false);
    assert.equal(harness.activated(), 0);
  }
});

test('Installed shell serves offline navigation and static modules without network; arbitrary or text-bearing URLs are not cached', async () => {
  const harness = workerHarness();
  await harness.fire('install');
  const installedRequests = harness.requests.length;
  for (const path of ['/', '/index.html', '/src/model.js', '/src/drafts.js']) {
    const response = await harness.fire('fetch', { request: new Request(`${origin}${path}`) });
    assert.equal(await response.text(), path);
  }
  assert.equal(harness.requests.length, installedRequests);
  for (const url of [`${origin}/private-backup.json`, `${origin}/?source=pasted-text`, 'https://example.invalid/']) {
    assert.equal(await harness.fire('fetch', { request: new Request(url) }), undefined);
  }
  assert.equal(await harness.fire('fetch', { request: new Request(`${origin}/`, { method: 'POST', body: 'fictional source' }) }), undefined);
  assert.equal(harness.requests.length, installedRequests);
});

test('Only the explicit update message activates waiting worker; activation removes only old StepTrace caches', async () => {
  const harness = workerHarness({ initial: new Map([['steptrace-shell-old', new Map()], ['unrelated-cache', new Map()]]) });
  await harness.fire('install');
  await harness.fire('message', { data: { type: 'OTHER' } });
  assert.equal(harness.activated(), 0);
  await harness.fire('message', { data: { type: 'ACTIVATE_UPDATE' } });
  assert.equal(harness.activated(), 1);
  await harness.fire('activate');
  assert.equal(harness.claimed(), 1);
  assert.ok(harness.stores.has('unrelated-cache'));
  assert.ok(harness.stores.has(harness.name));
  assert.equal(harness.stores.has('steptrace-shell-old'), false);
});

test('An evicted app-file cache repairs online without mixing new modules or changing workspace storage', async () => {
  const harness = workerHarness();
  await harness.fire('install');
  harness.stores.delete(harness.name);
  const repaired = await harness.fire('fetch', { request: new Request(`${origin}/`) });
  assert.equal(repaired.status, 200);
  assert.equal(await repaired.text(), '/');
  assert.equal(harness.stores.get(harness.name).size, harness.paths.length);
  for (const options of [{ failPath: '/sw.js' }, { revision: 'newer-v6' }]) {
    const unavailable = workerHarness(options);
    const response = await unavailable.fire('fetch', { request: new Request(`${origin}/`) });
    assert.equal(response.status, 503);
    assert.match(await response.text(), /save or copy any form drafts/);
    assert.equal(unavailable.activated(), 0, 'Repair never forces a new app over an open form');
    assert.equal(unavailable.stores.get(unavailable.name).size, 0, 'A newer module is never inserted into an old shell');
  }
});

function eventTarget(extra = {}) {
  const callbacks = new Map();
  return {
    ...extra,
    addEventListener(type, callback) { callbacks.set(type, [...(callbacks.get(type) ?? []), callback]); },
    async emit(type) { for (const callback of callbacks.get(type) ?? []) await callback(); },
  };
}
const settled = () => new Promise(resolve => setImmediate(resolve));
function uiHarness({ waiting = true, allow = () => true, active = true, disabled = false } = {}) {
  const controls = Object.fromEntries(['offline-status', 'update-app', 'retry-offline'].map(id => [id, eventTarget({ textContent: '', hidden: false, disabled: false })]));
  let reloads = 0;
  const messages = [];
  const worker = eventTarget({ postMessage: message => messages.push(message) });
  const registration = eventTarget({ waiting: waiting ? worker : null, active: active ? worker : null, installing: null });
  const serviceWorker = eventTarget({ controller: active ? worker : null, register: async () => registration });
  const window = eventTarget({ location: { reload: () => { reloads += 1; } } });
  const context = vm.createContext({
    navigator: { onLine: true, serviceWorker }, window,
    document: { getElementById: id => controls[id] },
    isSecureContext: true, STEPTRACE_DISABLE_OFFLINE: disabled, allow,
  });
  vm.runInContext(`${uiSource}\ninitOffline({canReload: allow});`, context);
  return { controls, registration, serviceWorker, window, messages, reloads: () => reloads };
}

test('Initial worker control and updates in another tab never automatically reload an open page', async () => {
  const harness = uiHarness({ waiting: false, active: false });
  await settled();
  await harness.serviceWorker.emit('controllerchange');
  assert.equal(harness.reloads(), 0);
  assert.match(harness.controls['offline-status'].textContent, /ready for offline/);
});

test('Explicit update is blocked with unsaved work and checks safety again after activation', async () => {
  let allowed = false;
  const harness = uiHarness({ allow: () => allowed });
  await settled();
  await harness.controls['update-app'].emit('click');
  assert.equal(harness.messages.length, 0);
  assert.equal(harness.reloads(), 0);
  assert.match(harness.controls['offline-status'].textContent, /Update paused/);
  allowed = true;
  await harness.controls['update-app'].emit('click');
  assert.equal(harness.messages[0].type, 'ACTIVATE_UPDATE');
  allowed = false; // A draft appeared while the worker was activating.
  await harness.serviceWorker.emit('controllerchange');
  await settled();
  assert.equal(harness.reloads(), 0);
  assert.equal(harness.controls['update-app'].hidden, false);
  allowed = true;
  await harness.controls['update-app'].emit('click');
  await settled();
  assert.equal(harness.reloads(), 1);
});

test('A safe explicit update reloads once, and recovery harness never registers a worker', async () => {
  const harness = uiHarness();
  await settled();
  await harness.controls['update-app'].emit('click');
  await harness.serviceWorker.emit('controllerchange');
  await harness.serviceWorker.emit('controllerchange');
  await settled();
  assert.equal(harness.reloads(), 1);
  const disabled = uiHarness({ disabled: true });
  await settled();
  assert.equal(disabled.controls['update-app'].hidden, true);
  assert.match(disabled.controls['offline-status'].textContent, /disabled/);
});

test('The served worker revision changes with an app asset and the server exposes only static GET/HEAD assets', async t => {
  const { mkdtemp, cp, mkdir, writeFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawn } = await import('node:child_process');
  const { createServer } = await import('node:net');
  const temporary = await mkdtemp(join(tmpdir(), 'steptrace-offline-test-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await mkdir(join(temporary, 'scripts'));
  await cp(new URL('../dist/', import.meta.url), join(temporary, 'dist'), { recursive: true });
  await cp(new URL('../scripts/serve.mjs', import.meta.url), join(temporary, 'scripts/serve.mjs'));
  const reservation = createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const server = spawn(process.execPath, [join(temporary, 'scripts/serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { server.kill(); });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Static test server exited ${code}`)));
    server.stdout.once('data', resolve);
  });
  const address = `http://127.0.0.1:${port}`;
  const first = await fetch(`${address}/sw.js`);
  const firstBody = await first.text();
  assert.equal(first.status, 200);
  assert.ok(!firstBody.includes('__STEPTRACE_SHELL_REVISION__'));
  assert.match(first.headers.get('content-security-policy'), /worker-src 'self'/);
  assert.match(first.headers.get('content-security-policy'), /connect-src 'self'/);
  const again = await (await fetch(`${address}/sw.js`)).text();
  assert.equal(again, firstBody, 'An unchanged shell must retain its revision');
  await writeFile(join(temporary, 'dist/styles.css'), '/* Fictional update-protocol test asset. */');
  const changed = await (await fetch(`${address}/sw.js`)).text();
  assert.notEqual(changed, firstBody, 'Changing an app file must produce a waiting worker with a new cache name');
  for (const path of workerHarness().paths) assert.equal((await fetch(`${address}${path}`)).status, 200, path);
  assert.equal((await fetch(`${address}/`, { method: 'POST', body: 'fictional application text' })).status, 405);
  assert.equal((await fetch(`${address}/docs/STATE.md`)).status, 404);
  assert.equal((await fetch(`${address}/tests/browser-server.mjs`)).status, 404);
});
