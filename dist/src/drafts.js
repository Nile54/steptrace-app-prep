// Same-tab recovery is a convenience, not a separate backup. Never overwrite a
// malformed journal. The workspace schema and exported backup remain unchanged.
export const DRAFT_KEY = 'steptrace.tab-drafts.v1';
export const RECOVERY_KEY = 'steptrace.interrupted-save.v1';
const MAX_BYTES = 3 * 1024 * 1024;
const bytes = text => new TextEncoder().encode(text).length;

// Preferences are optional. A malformed preference value must never prevent
// opening or exporting a valid saved workspace or discard other form drafts.
export function readTabPreferences(journal) {
  try {
    const value = JSON.parse(journal.get('ui') || '{}');
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function createTabJournal(getStorage = () => globalThis.sessionStorage) {
  const entries = new Map();
  let blocked = false;
  let error = '';
  try {
    const raw = getStorage().getItem(DRAFT_KEY);
    if (raw !== null) {
      if (bytes(raw) > MAX_BYTES) throw new Error('Draft recovery is too large.');
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 500) throw new Error('Draft recovery has an unsupported format.');
      for (const pair of data.entries) {
        if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || typeof pair[1] !== 'string' || entries.has(pair[0])) throw new Error('Draft recovery is malformed.');
        entries.set(...pair);
      }
    }
  } catch {
    entries.clear(); blocked = true;
    error = 'Draft recovery is unavailable or unreadable. Existing recovery data was left untouched. Keep this tab open until you have saved or copied your drafts.';
  }
  function flush() {
    if (blocked) return false;
    try {
      const raw = JSON.stringify({ version: 1, entries: [...entries] });
      if (entries.size > 500 || bytes(raw) > MAX_BYTES) throw new Error('Too large');
      getStorage().setItem(DRAFT_KEY, raw); error = ''; return true;
    } catch {
      error = 'Drafts could not be saved for reload. They remain in this tab; save or copy them before leaving.';
      return false;
    }
  }
  return {
    get: key => entries.get(key),
    set(key, value) { entries.set(key, value); return flush(); },
    delete(key) { entries.delete(key); return flush(); },
    keys: () => [...entries.keys()],
    flush,
    get error() { return error; },
  };
}

// Journal before the primary write. On reload, the caller compares expectedRaw
// with the primary workspace and validates the backup before offering recovery.
export function createSaveRecovery(getStorage = () => globalThis.sessionStorage) {
  return {
    read() {
      try {
        const raw = getStorage().getItem(RECOVERY_KEY);
        if (raw === null) return { pending: null };
        if (bytes(raw) > 6 * 1024 * 1024) throw new Error('Too large');
        const pending = JSON.parse(raw);
        if (pending?.version !== 1 || typeof pending.backup !== 'string' || !(pending.expectedRaw === null || typeof pending.expectedRaw === 'string')) throw new Error('Malformed');
        return { pending };
      } catch { return { pending: null, error: 'An interrupted-save copy could not be read. It was left untouched; do not clear browser data if you need to recover it.' }; }
    },
    write(backup, expectedRaw) {
      try { getStorage().setItem(RECOVERY_KEY, JSON.stringify({ version: 1, backup, expectedRaw })); return true; }
      catch { return false; }
    },
    clear() { try { getStorage().removeItem(RECOVERY_KEY); return true; } catch { return false; } },
  };
}

// Form keys include the application ID. Restoring a draft never submits it or
// confirms a source mapping. Inputs are applied only to known, matching fields.
export function createFormDrafts(journal, { onStatus = () => {} } = {}) {
  const bindings = new WeakMap();
  const unreadableForms = new Set();
  const fields = form => [...form.querySelectorAll('input[id], textarea[id], select[id]')]
    .filter(input => !input.readOnly && !['file', 'submit', 'button'].includes(input.type));
  const values = form => fields(form).map(input => [input.id, input.type === 'checkbox' ? input.checked : input.value]);
  function applyValues(form, serialized) {
    const pairs = JSON.parse(serialized);
    if (!Array.isArray(pairs) || pairs.some(pair => !Array.isArray(pair) || pair.length !== 2
      || typeof pair[0] !== 'string' || !['string', 'boolean'].includes(typeof pair[1]))
      || new Set(pairs.map(pair => pair[0])).size !== pairs.length) throw new Error('Malformed form draft');
    const byId = new Map(pairs);
    for (const input of fields(form)) {
      const value = byId.get(input.id);
      if (input.type === 'checkbox' && typeof value === 'boolean') input.checked = value;
      else if (input.type !== 'checkbox' && typeof value === 'string') input.value = value;
    }
  }
  const recoveryError = () => journal.error || (unreadableForms.size
    ? 'A form draft could not be restored. Its stored copy remains unchanged. Review or copy your current forms before reloading.' : '');
  const tell = () => onStatus(recoveryError() || (journal.keys().some(key => key.startsWith('form:'))
    ? 'Unsubmitted drafts are kept for reload in this tab. They are not included in workspace backups. Save each form to include it in a backup.'
    : 'Form drafts can recover after reload in this tab. Closing the tab or clearing browser data can remove them.'));
  function remember(form) {
    const binding = bindings.get(form);
    if (!binding) return;
    const current = JSON.stringify(values(form));
    if (current === binding.baseline) { if (journal.get(binding.key)) journal.delete(binding.key); }
    else if (journal.set(binding.key, current)) unreadableForms.delete(binding.key);
    tell();
  }
  return {
    bind(root, applicationId) {
      for (const form of root.querySelectorAll('form[id]')) {
        const key = `form:${form.dataset.globalDraft === 'true' ? 'global' : applicationId}:${form.id}`;
        const previous = bindings.get(form);
        if (previous?.key === key) continue;
        // Reused task/version forms must not carry one application's values into
        // another. Preserve the old journal entry, then restore the form baseline.
        if (previous) applyValues(form, previous.baseline);
        // Global and application-level forms retain their HTML defaults. Dynamic
        // task forms are recreated with current saved values as their baseline.
        const baseline = JSON.stringify(values(form));
        bindings.set(form, { key, baseline });
        const saved = journal.get(key);
        if (saved) {
          try {
            applyValues(form, saved);
            unreadableForms.delete(key);
            form.dispatchEvent(new Event('draft-restored'));
            for (let parent = form.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
          } catch { unreadableForms.add(key); }
        } else if (previous) form.dispatchEvent(new Event('draft-restored'));
        if (!form.dataset.draftListening) {
          form.addEventListener('input', () => remember(form));
          form.addEventListener('change', () => remember(form));
          form.dataset.draftListening = 'true';
        }
      }
      tell();
    },
    remember,
    clear(form) {
      const binding = bindings.get(form);
      if (binding) { journal.delete(binding.key); unreadableForms.delete(binding.key); }
      // Forget before reset so a successful form is not recovered on redraw.
      bindings.delete(form); form.reset();
      if (binding) applyValues(form, binding.baseline);
      tell();
    },
    // All input events save synchronously; this final flush checks availability.
    canReload() { const saved = journal.flush(); tell(); return saved && unreadableForms.size === 0; },
    refreshStatus: tell,
    hasDrafts: () => journal.keys().some(key => key.startsWith('form:')),
    get error() { return recoveryError(); },
  };
}
