// Test-only worker prefix for a stalled installation. It is not added to the
// app-file cache, but the browser retains the instrumented worker until replaced
// or unregistered. Stage/cache/asset-URL metadata is POSTed to the local test
// server at /__test/sw-trace; no form or workspace storage is read here.
(() => {
  const nativeFetch = self.fetch.bind(self);
  const entries = [];
  let flushTimer;
  let pending = [];
  const trace = (stage, detail = '') => {
    const entry = { time: new Date().toISOString(), stage, detail: String(detail) };
    entries.push(entry); pending.push(entry);
    console.info('[StepTrace worker trace]', stage, detail);
    if (!flushTimer) flushTimer = setTimeout(() => {
      flushTimer = undefined;
      const batch = pending; pending = [];
      void nativeFetch('/__test/sw-trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch) }).catch(() => {});
    }, 100);
  };
  trace('worker script evaluated', self.location.href);
  self.addEventListener('install', () => trace('install event'));
  self.addEventListener('activate', () => trace('activate event'));
  self.addEventListener('error', event => trace('worker error', event.message));
  self.addEventListener('unhandledrejection', event => trace('worker rejection', event.reason?.message ?? event.reason));
  self.addEventListener('message', event => {
    if (event.data?.type === 'STEPTRACE_DIAGNOSTIC_TRACE') {
      const result = { type: 'STEPTRACE_DIAGNOSTIC_TRACE', entries };
      if (event.ports[0]) event.ports[0].postMessage(result);
      else event.source?.postMessage(result);
    }
  });
  self.fetch = async (input, options) => {
    const url = input instanceof Request ? input.url : String(input);
    trace('fetch start', url);
    try { const response = await nativeFetch(input, options); trace('fetch headers', `${response.status} ${url}`); return response; }
    catch (error) { trace('fetch failed', `${url}: ${error.message}`); throw error; }
  };
  const nativeOpen = caches.open.bind(caches);
  caches.open = async name => {
    trace('cache open start', name);
    try {
      const cache = await nativeOpen(name);
      trace('cache open complete', name);
      const nativePut = cache.put.bind(cache);
      cache.put = async (request, response) => {
        trace('cache put start', request.url ?? request);
        try { const result = await nativePut(request, response); trace('cache put complete', request.url ?? request); return result; }
        catch (error) { trace('cache put failed', error.message); throw error; }
      };
      return cache;
    } catch (error) { trace('cache open failed', error.message); throw error; }
  };
})();
