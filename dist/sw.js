/* The local server replaces the revision marker with a digest of the complete
 * shell. Each successful installation owns an immutable cache. Workspaces and
 * drafts remain in browser storage: this cache contains public app files only. */
const CACHE_NAME = 'steptrace-shell-__STEPTRACE_SHELL_REVISION__';
const ASSETS = [
  '/', '/index.html', '/preview.html', '/styles.css',
  ...['bootstrap', 'app', 'demo', 'preview', 'model', 'storage', 'source-selection',
    'schema-v1', 'schema-v2', 'comparison', 'review-ui', 'dependencies',
    'dependency-ui', 'dependency-demo', 'drafts', 'offline'].map(name => `/src/${name}.js`),
];
const PATHS = new Set(ASSETS);
let repairPromise;

async function cacheShell() {
    // Fetch every file first. A missing file must fail installation, leaving the
    // previous active worker and its complete cache untouched.
    const requests = ASSETS.map(path => new Request(new URL(path, self.location.origin), {
      cache: 'reload', credentials: 'omit',
    }));
    const responses = await Promise.all(requests.map(async request => {
      const response = await fetch(request);
      if (!response.ok || response.redirected) throw new Error('Incomplete app shell');
      // Consume each response as soon as its headers arrive. Waiting for every
      // fetch before draining bodies can exhaust a browser's connection pool:
      // the remaining requests wait for connections held by unread bodies.
      const body = await response.arrayBuffer();
      return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    }));
    const cache = await caches.open(CACHE_NAME);
    try {
      await Promise.all(requests.map((request, index) => cache.put(request, responses[index])));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    return cache;
}

self.addEventListener('install', event => {
  // Do not skip waiting: the page offers an explicit, save-checked update.
  event.waitUntil(cacheShell());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    for (const name of await caches.keys()) {
      if (name.startsWith('steptrace-shell-') && name !== CACHE_NAME) await caches.delete(name);
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Only known, same-origin, query-free app assets enter the cache. No pasted
  // text, imported file, backup, form value, or arbitrary URL is sent here.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.search || !PATHS.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url.pathname);
    if (response) return response;
    // Repair an evicted app-file cache only when the server still has the same
    // complete shell revision. Never mix a cached version with newer modules.
    try {
      repairPromise ??= (async () => {
        const current = await fetch(new Request(new URL('/sw.js', self.location.origin), { cache: 'reload', credentials: 'omit' }));
        if (!current.ok || !(await current.text()).includes(`const CACHE_NAME = '${CACHE_NAME}';`)) {
          await self.registration.update();
          throw new Error('A different app version must finish installing');
        }
        return cacheShell();
      })().finally(() => { repairPromise = undefined; });
      const repaired = await repairPromise;
      const restored = await repaired.match(url.pathname);
      if (restored) return restored;
    } catch { /* No workspace or draft data is read or changed by repair. */ }
    return new Response('This app file is unavailable offline. Reconnect and reload to repair the app copy. If an update is waiting, save or copy any form drafts in other open StepTrace tabs, then close all StepTrace tabs and reopen. Your saved workspace is stored separately from the app-file cache; keep an exported backup.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
