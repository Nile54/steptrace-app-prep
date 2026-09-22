import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabJournal, createSaveRecovery, createFormDrafts, readTabPreferences, DRAFT_KEY, RECOVERY_KEY } from '../dist/src/drafts.js';
import { createWorkspace, createApplication } from '../dist/src/model.js';
import { parseBackup, serializeBackup } from '../dist/src/storage.js';

function memory(initial = []) {
  const data = new Map(initial);
  return {
    readError: null,
    writeError: null,
    removeError: null,
    writes: 0,
    removals: 0,
    getItem(key) {
      if (this.readError) throw new DOMException('Synthetic denied read', this.readError);
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      if (this.writeError) throw new DOMException('Synthetic failed write', this.writeError);
      data.set(key, value); this.writes += 1;
    },
    removeItem(key) {
      if (this.removeError) throw new DOMException('Synthetic failed removal', this.removeError);
      data.delete(key); this.removals += 1;
    },
    raw: key => data.get(key) ?? null,
  };
}

test('tab reload restores separate application and global draft keys without changing exact form text', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  const firstKey = 'form:fictional-app-a:task-form';
  const secondKey = 'form:fictional-app-b:task-form';
  const first = JSON.stringify([['task-title', 'Fictional A — 🧭\r\nKeep spacing.  ']]);
  const second = JSON.stringify([['task-title', 'Fictional B']]);
  assert.equal(journal.set(firstKey, first), true);
  assert.equal(journal.set(secondKey, second), true);
  assert.equal(journal.set('form:global:application-form', '[[]]'), true);
  const reloaded = createTabJournal(() => adapter);
  assert.equal(reloaded.error, '');
  assert.equal(reloaded.get(firstKey), first);
  assert.equal(reloaded.get(secondKey), second);
  assert.equal(reloaded.delete(firstKey), true);
  const reopened = createTabJournal(() => adapter);
  assert.equal(reopened.get(firstKey), undefined);
  assert.equal(reopened.get(secondKey), second);
  assert.equal(reopened.get('form:global:application-form'), '[[]]');
});

test('malformed optional preferences fall back safely without modifying another form draft', () => {
  for (const raw of ['null', '[]', 'true', '42', '"fictional"', '{unfinished']) {
    const adapter = memory([[DRAFT_KEY, JSON.stringify({ version: 1, entries: [
      ['ui', raw], ['form:fictional-app:task-form', '[["task-title","Fictional retained draft"]]'],
    ] })]]);
    const journal = createTabJournal(() => adapter);
    const originalBytes = adapter.raw(DRAFT_KEY);
    assert.deepEqual(readTabPreferences(journal), {});
    assert.equal(journal.get('form:fictional-app:task-form'), '[["task-title","Fictional retained draft"]]');
    assert.equal(adapter.raw(DRAFT_KEY), originalBytes);
    assert.equal(adapter.writes, 0);
  }
  const preferences = { viewMode: 'one', activeId: 'fictional-app', stepId: 'fictional-task', textSize: 'large' };
  assert.deepEqual(readTabPreferences({ get: () => JSON.stringify(preferences) }), preferences);
  assert.deepEqual(readTabPreferences({ get: () => undefined }), {});
});

test('malformed tab journals never partially load or replace unreadable stored bytes', () => {
  const cases = [
    '{unfinished', 'null', JSON.stringify({ version: 2, entries: [] }),
    JSON.stringify({ version: 1, entries: [['valid-first', 'keep'], ['invalid', false]] }),
    JSON.stringify({ version: 1, entries: [['duplicate', 'first'], ['duplicate', 'second']] }),
    JSON.stringify({ version: 1, entries: Array.from({ length: 501 }, (_, index) => [`key-${index}`, '']) }),
    ' '.repeat(3 * 1024 * 1024 + 1),
  ];
  for (const raw of cases) {
    const adapter = memory([[DRAFT_KEY, raw]]);
    const journal = createTabJournal(() => adapter);
    assert.match(journal.error, /left untouched/);
    assert.deepEqual(journal.keys(), []);
    assert.equal(journal.set('new-draft', 'Current fictional text'), false);
    assert.equal(journal.delete('valid-first'), false);
    assert.equal(journal.flush(), false);
    assert.equal(adapter.raw(DRAFT_KEY), raw);
    assert.equal(adapter.writes, 0);
    assert.equal(journal.get('new-draft'), 'Current fictional text', 'the current tab retains typed work in memory');
  }
});

test('unavailable draft storage reports no reload protection while retaining new drafts in memory', () => {
  for (const getter of [
    () => { throw new DOMException('Denied', 'SecurityError'); },
    () => undefined,
    () => ({ getItem() { throw new DOMException('Denied', 'SecurityError'); }, setItem() { assert.fail('blocked journal must not write'); } }),
  ]) {
    const journal = createTabJournal(getter);
    assert.match(journal.error, /unavailable/);
    assert.equal(journal.set('form:fictional:task', 'Unsaved fictional wording'), false);
    assert.equal(journal.get('form:fictional:task'), 'Unsaved fictional wording');
    assert.equal(journal.flush(), false);
    assert.match(journal.error, /Keep this tab open/);
  }
});

test('quota failure keeps the previous reload copy and current draft separate until a successful retry', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  assert.equal(journal.set('form:fictional:task', 'Earlier fictional wording'), true);
  const previousBytes = adapter.raw(DRAFT_KEY);
  adapter.writeError = 'QuotaExceededError';
  assert.equal(journal.set('form:fictional:task', 'Latest fictional wording'), false);
  assert.match(journal.error, /could not be saved for reload/);
  assert.equal(adapter.raw(DRAFT_KEY), previousBytes);
  assert.equal(journal.get('form:fictional:task'), 'Latest fictional wording');
  assert.equal(createTabJournal(() => adapter).get('form:fictional:task'), 'Earlier fictional wording');
  adapter.writeError = null;
  assert.equal(journal.flush(), true);
  assert.equal(journal.error, '');
  assert.equal(createTabJournal(() => adapter).get('form:fictional:task'), 'Latest fictional wording');
});

test('a failed draft deletion warns that an old reload copy remains and a later flush removes it', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  journal.set('form:fictional:task', 'Fictional draft already submitted');
  adapter.writeError = 'SecurityError';
  assert.equal(journal.delete('form:fictional:task'), false);
  assert.match(journal.error, /could not be saved for reload/);
  assert.equal(journal.get('form:fictional:task'), undefined);
  assert.equal(createTabJournal(() => adapter).get('form:fictional:task'), 'Fictional draft already submitted');
  adapter.writeError = null;
  assert.equal(journal.flush(), true);
  assert.equal(createTabJournal(() => adapter).get('form:fictional:task'), undefined);
});

test('interrupted-save recovery holds the complete valid backup and exact previous storage token across reload', () => {
  const initial = createApplication(createWorkspace(), {
    title: 'Fictional existing plan', text: 'Original fictional text — 🧭\r\nKeep this source intact.',
  });
  const next = createApplication(initial, { title: 'Fictional new plan', text: 'New fictional instructions.' });
  const backup = serializeBackup(next);
  for (const expectedRaw of [null, JSON.stringify(initial, null, 2)]) {
    const adapter = memory();
    const recovery = createSaveRecovery(() => adapter);
    assert.equal(recovery.write(backup, expectedRaw), true);
    const recovered = createSaveRecovery(() => adapter).read();
    assert.equal(recovered.error, undefined);
    assert.equal(recovered.pending.expectedRaw, expectedRaw);
    assert.equal(recovered.pending.backup, backup);
    assert.deepEqual(parseBackup(recovered.pending.backup), next);
    assert.deepEqual(parseBackup(recovered.pending.backup).applications[0], initial.applications[0]);
  }
});

test('malformed interrupted-save envelopes report an error and preserve original bytes for recovery', () => {
  for (const raw of [
    '{unfinished', 'null', JSON.stringify({ version: 99, backup: '{}', expectedRaw: null }),
    JSON.stringify({ version: 1, backup: false, expectedRaw: null }),
    JSON.stringify({ version: 1, backup: '{}', expectedRaw: 7 }),
    ' '.repeat(6 * 1024 * 1024 + 1),
  ]) {
    const adapter = memory([[RECOVERY_KEY, raw]]);
    const recovered = createSaveRecovery(() => adapter).read();
    assert.equal(recovered.pending, null);
    assert.match(recovered.error, /left untouched/);
    assert.equal(adapter.raw(RECOVERY_KEY), raw);
    assert.equal(adapter.writes, 0);
    assert.equal(adapter.removals, 0);
  }
});

test('unavailable interrupted-save storage never reports write or clear success', () => {
  const recovery = createSaveRecovery(() => { throw new DOMException('Denied', 'SecurityError'); });
  assert.match(recovery.read().error, /could not be read/);
  assert.equal(recovery.write('fictional backup', null), false);
  assert.equal(recovery.clear(), false);
});

test('failed recovery replacement or clear preserves the previous copy and can be retried', () => {
  const adapter = memory();
  const recovery = createSaveRecovery(() => adapter);
  assert.equal(recovery.write('earlier fictional backup', null), true);
  const earlierBytes = adapter.raw(RECOVERY_KEY);
  adapter.writeError = 'QuotaExceededError';
  assert.equal(recovery.write('latest fictional backup', 'original workspace bytes'), false);
  assert.equal(adapter.raw(RECOVERY_KEY), earlierBytes);
  assert.equal(createSaveRecovery(() => adapter).read().pending.backup, 'earlier fictional backup');
  adapter.writeError = null;
  assert.equal(recovery.write('latest fictional backup', 'original workspace bytes'), true);
  const latestBytes = adapter.raw(RECOVERY_KEY);
  adapter.removeError = 'SecurityError';
  assert.equal(recovery.clear(), false);
  assert.equal(adapter.raw(RECOVERY_KEY), latestBytes);
  assert.equal(createSaveRecovery(() => adapter).read().pending.backup, 'latest fictional backup');
  adapter.removeError = null;
  assert.equal(recovery.clear(), true);
  assert.deepEqual(createSaveRecovery(() => adapter).read(), { pending: null });
});

// A minimal EventTarget form fixture exercises the binding lifecycle without
// claiming a browser DOM, native validation, or keyboard interaction check.
function formFixture(id, controls, global = false) {
  const form = new EventTarget();
  form.id = id;
  form.dataset = global ? { globalDraft: 'true' } : {};
  form.parentElement = { tagName: 'DETAILS', open: false, parentElement: null };
  const fields = controls.map(control => ({ type: 'text', value: '', checked: false, readOnly: false, ...control }));
  const initial = fields.map(input => ({ value: input.value, checked: input.checked }));
  form.querySelectorAll = () => fields;
  form.reset = () => fields.forEach((input, index) => Object.assign(input, initial[index]));
  return { form, fields, root: { querySelectorAll: () => [form] } };
}

test('reusing a form for another application resets its values and restores each application draft independently', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  const drafts = createFormDrafts(journal);
  const { form, fields, root } = formFixture('task-form', [{ id: 'task-title' }, { id: 'task-anchor', type: 'hidden' }]);
  let restored = 0;
  form.addEventListener('draft-restored', () => { restored += 1; });
  drafts.bind(root, 'fictional-app-a');
  fields[0].value = 'Fictional task A'; fields[1].value = '{"quote":"A"}';
  form.dispatchEvent(new Event('input'));
  drafts.bind(root, 'fictional-app-b');
  assert.deepEqual(fields.map(field => field.value), ['', '']);
  assert.equal(restored, 1, 'resetting to another application also clears cached selection state');
  fields[0].value = 'Fictional task B'; form.dispatchEvent(new Event('input'));
  drafts.bind(root, 'fictional-app-a');
  assert.deepEqual(fields.map(field => field.value), ['Fictional task A', '{"quote":"A"}']);
  drafts.bind(root, 'fictional-app-b');
  assert.deepEqual(fields.map(field => field.value), ['Fictional task B', '']);
  assert.equal(createTabJournal(() => adapter).keys().filter(key => key.startsWith('form:')).length, 2);
});

test('successful global form submission clears its draft notice while retaining preferences and a working input listener', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  let notice;
  const drafts = createFormDrafts(journal, { onStatus: value => { notice = value; } });
  const { form, fields, root } = formFixture('application-form', [{ id: 'application-title' }], true);
  drafts.bind(root, null);
  journal.set('ui', '{"viewMode":"one"}');
  fields[0].value = 'Fictional new application'; form.dispatchEvent(new Event('input'));
  assert.match(notice, /Unsubmitted drafts/);
  drafts.clear(form);
  drafts.bind(root, 'created-fictional-app');
  assert.deepEqual(journal.keys(), ['ui']);
  assert.equal(fields[0].value, '');
  assert.doesNotMatch(notice, /Unsubmitted drafts/);
  const writes = adapter.writes;
  fields[0].value = 'Another fictional application'; form.dispatchEvent(new Event('input'));
  assert.equal(adapter.writes, writes + 1, 'clear and rebind do not duplicate the form listener');
  assert.match(journal.get('form:global:application-form'), /Another fictional application/);
});

test('clearing a completed form resets programmatic hidden values even if native reset retained their defaults', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  const drafts = createFormDrafts(journal);
  const { form, fields, root } = formFixture('application-form', [{ id: 'original-source-text', type: 'hidden' }], true);
  drafts.bind(root, null);
  fields[0].value = 'Earlier fictional file text'; drafts.remember(form);
  // For hidden inputs, changing .value also changes the native reset default.
  form.reset = () => { fields[0].value = 'Earlier fictional file text'; };
  drafts.clear(form);
  assert.equal(fields[0].value, '');
  assert.equal(journal.get('form:global:application-form'), undefined);
});

test('malformed form-level drafts do not partially apply and their warning survives status refresh', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  const invalid = JSON.stringify([['task-title', 'Partial fictional value'], ['bad-field', { nested: true }]]);
  journal.set('form:fictional-app:task-form', invalid);
  const bytes = adapter.raw(DRAFT_KEY);
  let notice;
  const drafts = createFormDrafts(journal, { onStatus: value => { notice = value; } });
  const { form, fields, root } = formFixture('task-form', [{ id: 'task-title', value: 'Saved fictional title' }]);
  drafts.bind(root, 'fictional-app');
  assert.equal(fields[0].value, 'Saved fictional title');
  assert.equal(adapter.raw(DRAFT_KEY), bytes);
  drafts.refreshStatus();
  assert.match(notice, /could not be restored/);
  assert.equal(drafts.canReload(), false);
  assert.equal(journal.get('form:fictional-app:task-form'), invalid);
  fields[0].value = 'New fictional wording'; form.dispatchEvent(new Event('input'));
  assert.equal(drafts.error, '');
  assert.equal(drafts.canReload(), true);
});

test('preference writes and reload flush failures refresh the visible draft-storage warning', () => {
  const adapter = memory();
  const journal = createTabJournal(() => adapter);
  let notice;
  const drafts = createFormDrafts(journal, { onStatus: value => { notice = value; } });
  adapter.writeError = 'QuotaExceededError';
  assert.equal(journal.set('ui', '{"textSize":"large"}'), false);
  drafts.refreshStatus();
  assert.match(notice, /could not be saved for reload/);
  assert.equal(drafts.canReload(), false);
  adapter.writeError = null;
  assert.equal(drafts.canReload(), true);
  assert.doesNotMatch(notice, /could not/);
});
