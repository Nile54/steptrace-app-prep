// Read-only diagnostics of DOM, app-origin requests and worker/cache metadata.
// No workspace values are read or transmitted. This file is never shipped.
(() => {
  const requests = [];
  const errors = [];
  const originalFetch = window.fetch.bind(window);
  const bodySize = body => typeof body === 'string' ? new TextEncoder().encode(body).length : body?.size ?? (body ? 'present; size not read' : 0);
  window.fetch = function(input, options) {
    requests.push({ kind: 'fetch', url: input instanceof Request ? input.url : String(input), method: options?.method ?? (input instanceof Request ? input.method : 'GET'), bodyBytes: options?.body !== undefined ? bodySize(options.body) : input instanceof Request && input.body ? 'Request body present; not read' : 0 });
    return originalFetch(input, options);
  };
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) { this.__diagnosticRequest = { kind: 'xhr', method, url: String(url) }; return open.call(this, method, url, ...rest); };
  XMLHttpRequest.prototype.send = function(body) { requests.push({ ...this.__diagnosticRequest, bodyBytes: bodySize(body) }); return send.call(this, body); };
  if (navigator.sendBeacon) {
    const beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, body) => { requests.push({ kind: 'beacon', url: String(url), method: 'POST', bodyBytes: bodySize(body) }); return beacon(url, body); };
  }
  window.addEventListener('error', event => errors.push({ kind: 'error', message: event.message, file: event.filename, line: event.lineno }));
  window.addEventListener('unhandledrejection', event => errors.push({ kind: 'promise', message: String(event.reason?.message ?? event.reason) }));
  document.addEventListener('securitypolicyviolation', event => errors.push({ kind: 'csp', directive: event.violatedDirective, blocked: event.blockedURI }));
  const identifier = element => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.name ? `[name=${element.name}]` : ''}`;
  async function workerTrace(registration) {
    const worker = registration.installing ?? registration.waiting ?? registration.active;
    if (!worker) return [];
    return new Promise(resolve => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); resolve('Worker did not return a diagnostic trace within 2 seconds (normal for an uninstrumented worker).'); }, 2000);
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
      worker.postMessage({ type: 'STEPTRACE_DIAGNOSTIC_TRACE' }, [channel.port2]);
    });
  }
  async function snapshot() {
    const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : [];
    let cached = [];
    try { cached = await Promise.all((await caches.keys()).map(async name => ({ name, paths: (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname) }))); } catch (error) { cached = [{ error: error.message }]; }
    const outside = [...document.querySelectorAll('body *')].filter(element => !element.closest('#test-diagnostics') && element.getClientRects().length && getComputedStyle(element).position !== 'fixed').filter(element => { const box = element.getBoundingClientRect(); return box.width > 0 && (box.left < -1 || box.right > document.documentElement.clientWidth + 1); }).map(identifier);
    return {
      measuredAt: new Date().toISOString(), secureContext: window.isSecureContext, onlineHint: navigator.onLine,
      viewport: { innerWidth, innerHeight, layoutWidth: document.documentElement.clientWidth, pageScrollWidth: document.documentElement.scrollWidth, devicePixelRatio, visualViewportScale: window.visualViewport?.scale, overflowElements: outside.slice(0, 40) },
      focus: document.activeElement ? identifier(document.activeElement) : null,
      serviceWorker: { supported: 'serviceWorker' in navigator, controller: navigator.serviceWorker?.controller?.scriptURL ?? null, registrations: await Promise.all(registrations.map(async reg => ({ scope: reg.scope, installing: reg.installing?.state ?? null, waiting: reg.waiting?.state ?? null, active: reg.active?.state ?? null, scriptURL: reg.active?.scriptURL ?? reg.installing?.scriptURL ?? null, trace: await workerTrace(reg) }))) },
      cacheMetadataOnly: cached,
      networkApiCalls: requests,
      resourceRequests: performance.getEntriesByType('resource').map(entry => ({ url: entry.name, type: entry.initiatorType, transferBytes: entry.transferSize })),
      scriptErrors: errors,
      limits: 'Metadata observed for this page since load. No request bodies or workspace values read. Does not inspect browser/OS traffic or prove encryption. Production offline behavior must be checked separately.',
    };
  }
  document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('test-browser-output');
    const refresh = async () => { try { output.value = JSON.stringify(await snapshot(), null, 2); } catch (error) { output.value = `Diagnostic error: ${error.message}`; } };
    document.getElementById('test-refresh-diagnostics')?.addEventListener('click', refresh);
    document.getElementById('test-run-axe')?.addEventListener('click', async event => {
      const result = document.getElementById('test-axe-output');
      event.currentTarget.disabled = true;
      result.value = 'Running axe-core 4.10.3…';
      try {
        const audit = await axe.run({ exclude: [['#test-diagnostics']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        const summarize = rules => rules.map(rule => ({ id: rule.id, impact: rule.impact, help: rule.help, helpUrl: rule.helpUrl, nodes: rule.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) }));
        result.value = JSON.stringify({ engine: audit.testEngine, timestamp: audit.timestamp, viewport: { width: innerWidth, height: innerHeight }, violations: summarize(audit.violations), incomplete: summarize(audit.incomplete), passedRuleCount: audit.passes.length, inapplicableRuleCount: audit.inapplicable.length, limit: 'Current visible page state only. This automated result is not complete WCAG conformance or a screen-reader test.' }, null, 2);
      } catch (error) { result.value = `Axe failed: ${error.message}`; }
      document.getElementById('test-run-axe').disabled = false;
      await refresh();
    });
    if (output) void refresh();
  });
})();
