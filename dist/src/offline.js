// App-file caching only. This module never reads application text or backups.
export function initOffline({ canReload = () => false } = {}) {
  const status = document.getElementById('offline-status');
  const update = document.getElementById('update-app');
  const retry = document.getElementById('retry-offline');
  if (!status || !update || !retry) return;
  let registration;
  let hasOfflineCopy = false;
  let activating = false;
  let needsReload = false;
  let reloading = false;
  let busy = false;
  const say = message => { if (status.textContent !== message) status.textContent = message; };
  const describe = () => {
    if (activating) return say('Preparing the updated app. Your current page stays open.');
    if (registration?.waiting || needsReload) return say('An app update is ready. Save your work before choosing Update app.');
    if (hasOfflineCopy) return say(navigator.onLine
      ? 'App files are ready for offline use in this browser. Keep a separate exported backup.'
      : 'You are offline. This cached app can use your browser workspace. Keep a separate exported backup.');
    say(navigator.onLine ? 'Preparing app files for offline use…' : 'Offline app setup is incomplete. Reconnect, then retry.');
  };
  const showUpdate = () => {
    update.hidden = !(registration?.waiting || needsReload);
    update.disabled = busy;
    describe();
  };
  const safeReload = async () => {
    if (reloading) return;
    reloading = true;
    let safe = false;
    try { safe = (await canReload()) === true; } catch { /* Remain on the page. */ }
    if (!safe) {
      reloading = false;
      busy = false;
      activating = false;
      needsReload = true;
      showUpdate();
      say('Update paused. Save your workspace and finish or preserve your form drafts before reloading.');
      return;
    }
    window.location.reload();
  };
  const watch = worker => {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        hasOfflineCopy = true;
        retry.hidden = true;
        // The registration.waiting pointer may update after this event.
        if (navigator.serviceWorker.controller) { update.hidden = false; say('An app update is ready. Save your work before choosing Update app.'); }
        else describe();
      }
      if (worker.state === 'redundant' && !hasOfflineCopy) {
        retry.hidden = false;
        say('Offline setup did not finish. You can keep working while online; reconnect and retry.');
      }
    });
  };
  const setup = async () => {
    retry.disabled = true;
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      hasOfflineCopy = Boolean(registration.active);
      registration.addEventListener('updatefound', () => watch(registration.installing));
      watch(registration.installing);
      retry.hidden = hasOfflineCopy;
      showUpdate();
    } catch {
      retry.hidden = false;
      say('Offline setup is unavailable. You can keep working in this open page. Export a separate backup.');
    } finally { retry.disabled = false; }
  };
  update.hidden = true;
  retry.hidden = true;
  if (globalThis.STEPTRACE_DISABLE_OFFLINE) {
    say('Offline setup is disabled on this isolated recovery-test server.');
    return;
  }
  if (!('serviceWorker' in navigator) || !globalThis.isSecureContext) {
    say('Offline app loading is unavailable in this browser or address. Keep a separate exported backup.');
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    hasOfflineCopy = true;
    retry.hidden = true;
    if (activating) { activating = false; needsReload = true; void safeReload(); }
    else describe(); // First installation must not reload an open form.
  });
  window.addEventListener('online', describe);
  window.addEventListener('offline', describe);
  retry.addEventListener('click', () => void setup());
  update.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    update.disabled = true;
    let safe = false;
    try { safe = (await canReload()) === true; } catch { /* Remain on the page. */ }
    if (!safe) {
      busy = false;
      update.disabled = false;
      say('Update paused. Save your workspace and finish or preserve your form drafts before reloading.');
      return;
    }
    if (needsReload) { void safeReload(); return; }
    const waiting = registration?.waiting;
    if (!waiting) { busy = false; showUpdate(); return; }
    activating = true;
    describe();
    waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  });
  void setup();
}
