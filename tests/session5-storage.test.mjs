import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspace, createApplication, createTask, updateTask, addSourceVersion,
  migrateWorkspace,
} from '../dist/src/model.js';
import {
  createStorage, STORAGE_KEY, parseBackup, serializeBackup, mergeWorkspaces,
} from '../dist/src/storage.js';
import * as versionTwo from '../dist/src/schema-v2.js';

// These adapters test interruptions at the synchronous write boundary. They do
// not simulate a browser process crash, disk corruption, or power-loss durability.
function memory(initial) {
  let raw = initial;
  return {
    failure: null,
    writes: 0,
    getItem(key) { assert.equal(key, STORAGE_KEY); return raw; },
    setItem(key, value) {
      assert.equal(key, STORAGE_KEY);
      if (this.failure) throw new DOMException('Synthetic interrupted write', this.failure);
      raw = value;
      this.writes += 1;
    },
    get raw() { return raw; },
    replace(value) { raw = value; },
  };
}

function fixture(api = { createWorkspace, createApplication, createTask, updateTask }) {
  const text = 'Fictional Tamarack Award — 🧭\r\nWrite 500 words.\r\nKeep the original punctuation.';
  let workspace = api.createApplication(api.createWorkspace(), { title: 'Fictional recovery plan', text });
  const appId = workspace.applications[0].id;
  const quote = 'Write 500 words.';
  const start = text.indexOf(quote);
  workspace = api.createTask(workspace, appId, {
    title: 'Prepare the fictional essay', applicability: 'applies',
    anchor: { start, end: start + quote.length, quote },
  });
  return api.updateTask(workspace, appId, workspace.applications[0].tasks[0].id, { completed: true });
}

function envelope(workspace) {
  return JSON.stringify({ format: 'steptrace-backup', schemaVersion: workspace.schemaVersion,
    exportedAt: '2026-09-20T00:00:00.000Z', workspace });
}

function changed(workspace) {
  return addSourceVersion(workspace, workspace.applications[0].id, {
    text: workspace.applications[0].sources[0].text.replace('500', '400'), label: 'Fictional update',
  });
}

test('interrupted write preserves the saved plan; the complete newer plan remains exportable and retryable', () => {
  const original = fixture();
  const before = JSON.stringify(original, null, 2);
  const adapter = memory(before);
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  const next = changed(original);
  adapter.failure = 'AbortError';
  const failed = storage.save(next, loaded.raw);
  assert.equal(failed.ok, false);
  assert.equal(failed.raw, before);
  assert.equal(adapter.writes, 0);
  assert.equal(adapter.raw, before);
  assert.deepEqual(createStorage(() => adapter).load().workspace, original);
  assert.deepEqual(parseBackup(serializeBackup(next)), next);

  adapter.failure = null;
  const saved = storage.save(next, failed.raw);
  assert.equal(saved.ok, true);
  const reopened = createStorage(() => adapter).load();
  assert.deepEqual(reopened.workspace, next);
  assert.deepEqual(reopened.workspace.applications[0].tasks[0].completionHistory,
    original.applications[0].tasks[0].completionHistory);
  assert.equal(adapter.writes, 1);
});

test('reload after a completed synchronous write recovers the full plan without depending on page acknowledgment', () => {
  const original = fixture();
  const next = changed(original);
  const adapter = memory(JSON.stringify(original));
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  // Deliberately discard the returned status to model a page disappearing after
  // setItem completed and before the UI could announce success.
  storage.save(next, loaded.raw);
  const reopened = createStorage(() => adapter).load();
  assert.equal(reopened.blocked, false);
  assert.deepEqual(reopened.workspace, next);
  assert.deepEqual(parseBackup(serializeBackup(reopened.workspace)), next);
});

test('a malformed later record or conflicting restore never partially adds earlier valid applications', () => {
  const existing = changed(fixture());
  const originalBytes = JSON.stringify(existing, null, 2);
  const adapter = memory(originalBytes);
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  const first = fixture();
  const validBatch = mergeWorkspaces(first, fixture());
  const badLaterRecord = structuredClone(validBatch);
  badLaterRecord.applications[1].tasks[0].anchor.quote = 'Fictional quote that does not occur';
  const collidingBatch = mergeWorkspaces(first, existing);
  const malformed = [
    '{"format":"steptrace-backup",',
    envelope(badLaterRecord),
    envelope(collidingBatch),
    JSON.stringify({ ...JSON.parse(envelope(validBatch)), schemaVersion: 99 }),
  ];
  for (const backup of malformed) {
    assert.throws(() => {
      const candidate = mergeWorkspaces(loaded.workspace, parseBackup(backup));
      storage.save(candidate, loaded.raw);
    });
    assert.equal(adapter.raw, originalBytes);
    assert.equal(adapter.writes, 0);
    assert.deepEqual(loaded.workspace, existing);
    assert.deepEqual(parseBackup(serializeBackup(loaded.workspace)), existing);
  }
  const restored = mergeWorkspaces(loaded.workspace, parseBackup(envelope(validBatch)));
  assert.equal(storage.save(restored, loaded.raw).ok, true);
  assert.equal(restored.applications.length, 3);
  assert.deepEqual(restored.applications[0], existing.applications[0]);
  assert.deepEqual(createStorage(() => adapter).load().workspace, restored);
});

test('another tab changing storage after restore preview blocks apply and retry while keeping both copies exportable', () => {
  const existing = fixture();
  const adapter = memory(JSON.stringify(existing));
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  const incoming = parseBackup(serializeBackup(fixture()));
  const preview = mergeWorkspaces(loaded.workspace, incoming);
  const otherTab = changed(existing);
  const otherBytes = JSON.stringify(otherTab);
  adapter.replace(otherBytes);

  const failed = storage.save(preview, loaded.raw);
  assert.equal(failed.ok, false);
  assert.equal(failed.blocked, true);
  assert.equal(storage.save(preview, failed.raw).ok, false);
  assert.equal(adapter.raw, otherBytes);
  assert.equal(adapter.writes, 0);
  assert.deepEqual(parseBackup(serializeBackup(preview)), preview);
  const reopened = createStorage(() => adapter).load();
  assert.deepEqual(parseBackup(serializeBackup(reopened.workspace)), otherTab);
  // Explicitly rebuild from the reloaded workspace; never reuse the stale preview.
  const recovered = mergeWorkspaces(reopened.workspace, incoming);
  assert.deepEqual(recovered.applications[0], otherTab.applications[0]);
});

for (const schemaVersion of [1, 2, 3]) {
  test(`schema-${schemaVersion} additive restore survives quota failure and retry without replacing existing data`, () => {
    const existing = changed(fixture());
    let legacy = fixture(versionTwo);
    if (schemaVersion === 1) {
      legacy = structuredClone(legacy);
      legacy.schemaVersion = 1;
      for (const app of legacy.applications) for (const task of app.tasks) delete task.sourceReviews;
    } else if (schemaVersion === 2) {
      legacy = versionTwo.addSourceVersion(legacy, legacy.applications[0].id,
        { text: legacy.applications[0].sources[0].text.replace('500', '400') });
    } else {
      legacy = changed(fixture());
    }
    const originalBytes = JSON.stringify(existing, null, 2);
    const adapter = memory(originalBytes);
    const storage = createStorage(() => adapter);
    const loaded = storage.load();
    const incoming = parseBackup(envelope(legacy));
    assert.deepEqual(incoming, migrateWorkspace(legacy));
    const candidate = mergeWorkspaces(loaded.workspace, incoming);
    adapter.failure = 'QuotaExceededError';
    const failed = storage.save(candidate, loaded.raw);
    assert.equal(failed.ok, false);
    assert.equal(adapter.raw, originalBytes);
    assert.deepEqual(createStorage(() => adapter).load().workspace, existing);
    assert.deepEqual(parseBackup(serializeBackup(candidate)), candidate);

    adapter.failure = null;
    assert.equal(storage.save(candidate, failed.raw).ok, true);
    const reloaded = createStorage(() => adapter).load();
    assert.equal(reloaded.workspace.applications.length, 2);
    assert.deepEqual(reloaded.workspace.applications[0], existing.applications[0]);
    assert.deepEqual(reloaded.workspace.applications[1], incoming.applications[0]);
    assert.equal(adapter.writes, 1);
  });
}
