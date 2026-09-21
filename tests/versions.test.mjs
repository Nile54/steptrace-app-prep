import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspace, createApplication, createTask, updateTask, addSourceVersion,
  resolveSourceReview, getTaskAnchor, getTaskReviewState, isTaskCompleted,
  validateWorkspace, migrateWorkspace, LIMITS, jsonByteLength,
} from '../dist/src/model.js';
import { validateWorkspace as validateVersionOne } from '../dist/src/schema-v1.js';
import { createStorage, STORAGE_KEY, parseBackup, serializeBackup, mergeWorkspaces } from '../dist/src/storage.js';

const appOf = workspace => workspace.applications[0];
const taskOf = workspace => appOf(workspace).tasks[0];
const localAnchor = anchor => anchor === null ? null : { start: anchor.start, end: anchor.end, quote: anchor.quote };
function anchor(text, quote = text, occurrence = 'first') {
  const start = occurrence === 'last' ? text.lastIndexOf(quote) : text.indexOf(quote);
  assert.ok(start >= 0);
  return { start, end: start + quote.length, quote };
}
function setup(text = 'Write 500 words.', quote = text, occurrence = 'first') {
  let workspace = createApplication(createWorkspace(), { title: 'Fictional version test', text });
  workspace = createTask(workspace, appOf(workspace).id,
    { title: 'Prepare the fictional response', anchor: anchor(text, quote, occurrence), applicability: 'applies' });
  return updateTask(workspace, appOf(workspace).id, taskOf(workspace).id, { completed: true });
}
function add(workspace, text) {
  return addSourceVersion(workspace, appOf(workspace).id, { text, label: 'Fictional update' });
}
function resolve(workspace, index, excerpt, applicability = 'applies', note = '') {
  return resolveSourceReview(workspace, appOf(workspace).id, taskOf(workspace).id,
    taskOf(workspace).sourceReviews[index].id, { anchor: excerpt, applicability, note });
}
function changed(workspace, edit) {
  const next = structuredClone(workspace);
  edit(next);
  return next;
}
function memory(initial = null) {
  let raw = initial;
  return {
    writes: 0,
    getItem(key) { assert.equal(key, STORAGE_KEY); return raw; },
    setItem(key, value) { assert.equal(key, STORAGE_KEY); raw = value; this.writes++; },
    get raw() { return raw; },
  };
}
function legacyFixture() {
  const text = 'Fictional award — 🧭\r\nIf studying part-time, include a study plan.\r\nKeep <img src=x onerror=alert(1)> literal.';
  return {
    schemaVersion: 1,
    applications: [{ id: 'legacy-app', title: 'Fictional saved application', createdAt: '2026-09-14T00:00:00.000Z',
      sources: [{ id: 'legacy-source', text, label: 'Fictional original.txt', createdAt: '2026-09-14T00:00:00.000Z' }],
      tasks: [{ id: 'legacy-task', title: 'Prepare my study plan', createdAt: '2026-09-14T00:00:00.001Z',
        anchor: { sourceVersionId: 'legacy-source', ...anchor(text, 'If studying part-time, include a study plan.') },
        applicability: 'does-not-apply',
        applicabilityHistory: [
          { id: 'legacy-applicability-1', at: '2026-09-14T00:00:00.001Z', value: 'applies' },
          { id: 'legacy-applicability-2', at: '2026-09-14T00:00:00.002Z', value: 'does-not-apply' },
        ],
        completionHistory: [
          { id: 'legacy-completion-1', at: '2026-09-14T00:00:00.003Z', completed: true },
          { id: 'legacy-completion-2', at: '2026-09-14T00:00:00.004Z', completed: false },
          { id: 'legacy-completion-3', at: '2026-09-14T00:00:00.005Z', completed: true },
        ], reviewState: 'needs-review' }],
    }],
  };
}

test('a new version retains original text/anchors/history; a unique unchanged paragraph maps exactly', () => {
  const initial = setup('Write 500 words.\r\nKeep the exact punctuation.');
  const updated = add(initial, appOf(initial).sources[0].text);
  const oldApp = appOf(initial);
  const newApp = appOf(updated);
  assert.equal(newApp.sources.length, 2);
  assert.deepEqual(newApp.sources[0], oldApp.sources[0]);
  assert.deepEqual(taskOf(updated).anchor, taskOf(initial).anchor);
  assert.deepEqual(taskOf(updated).completionHistory, taskOf(initial).completionHistory);
  assert.deepEqual(taskOf(updated).applicabilityHistory, taskOf(initial).applicabilityHistory);
  assert.equal(newApp.sources[1].text, oldApp.sources[0].text);
  assert.notEqual(newApp.sources[1].id, newApp.sources[0].id);
  assert.equal(taskOf(updated).sourceReviews[0].kind, 'exact');
  assert.equal(getTaskAnchor(taskOf(updated), newApp.sources[1].id).sourceVersionId, newApp.sources[1].id);
  assert.equal(getTaskReviewState(taskOf(updated)), 'reviewed');
  assert.equal(isTaskCompleted(taskOf(updated)), true);
  assert.throws(() => { newApp.sources[0].text = 'rewritten'; }, TypeError);
  assert.equal(oldApp.sources.length, 1);
});

test('whitespace-only differences offer an exact new range but require a recorded human confirmation', () => {
  const initial = setup('Write 500 words.\r\nKeep the exact punctuation.');
  const nextText = 'Write   500 words.\nKeep the exact punctuation.';
  const updated = add(initial, nextText);
  const review = taskOf(updated).sourceReviews[0];
  assert.equal(review.kind, 'formatting');
  assert.equal(getTaskAnchor(taskOf(updated), appOf(updated).sources[1].id), null);
  assert.equal(getTaskReviewState(taskOf(updated)), 'needs-review');
  assert.equal(review.suggestedAnchor.quote, nextText);
  const confirmed = resolve(updated, 0, localAnchor(review.suggestedAnchor));
  assert.equal(getTaskReviewState(taskOf(confirmed)), 'reviewed');
  assert.deepEqual(getTaskAnchor(taskOf(confirmed), appOf(confirmed).sources[1].id), review.suggestedAnchor);
  assert.equal(taskOf(confirmed).sourceReviews[0].resolution.anchor.sourceVersionId, appOf(confirmed).sources[1].id);
  assert.deepEqual(taskOf(confirmed).completionHistory, taskOf(initial).completionHistory);
});

test('duplicate phrases cannot silently transfer a prior confirmation to the remaining occurrence', () => {
  const initial = setup('Include a study plan.\n\nInclude a study plan.', 'Include a study plan.', 'last');
  const updated = add(initial, 'Include a study plan.');
  const review = taskOf(updated).sourceReviews[0];
  assert.equal(review.kind, 'ambiguous');
  assert.equal(review.suggestedAnchor, null);
  assert.equal(getTaskAnchor(taskOf(updated), appOf(updated).sources[1].id), null);
  assert.equal(getTaskReviewState(taskOf(updated)), 'needs-review');
  const confirmed = resolve(updated, 0, anchor('Include a study plan.'));
  assert.equal(taskOf(confirmed).anchor.start, initial.applications[0].tasks[0].anchor.start);
  assert.equal(getTaskAnchor(taskOf(confirmed), appOf(confirmed).sources[1].id).start, 0);
});

test('paragraph moves that change adjacent context require confirmation despite identical requirement text', () => {
  const initial = setup('Fictional introduction.\n\nWrite 500 words.\n\nA separate fictional instruction.', 'Write 500 words.');
  const updated = add(initial, 'Write 500 words.\n\nFictional introduction.\n\nA separate fictional instruction.');
  assert.equal(taskOf(updated).sourceReviews[0].kind, 'unmatched');
  assert.equal(getTaskReviewState(taskOf(updated)), 'needs-review');
});

test('changed numbers, negation, and removal flag completed work without changing human applicability', () => {
  for (const nextText of ['Write 400 words.', 'Do not write 500 words.', 'Include a study plan instead.']) {
    let initial = setup();
    initial = updateTask(initial, appOf(initial).id, taskOf(initial).id, { applicability: 'does-not-apply' });
    const updated = add(initial, nextText);
    assert.equal(getTaskReviewState(taskOf(updated)), 'needs-review');
    assert.equal(taskOf(updated).sourceReviews[0].kind, 'unmatched');
    assert.equal(taskOf(updated).applicability, 'does-not-apply');
    assert.deepEqual(taskOf(updated).completionHistory, taskOf(initial).completionHistory);
    assert.equal(isTaskCompleted(taskOf(updated)), true);
    assert.equal(getTaskAnchor(taskOf(updated), appOf(updated).sources[1].id), null);
  }
});

test('a no-excerpt resolution requires a note and retains removed work and independent completion', () => {
  const initial = setup();
  const updated = add(initial, 'Include a fictional study plan.');
  assert.throws(() => resolve(updated, 0, null, 'does-not-apply', ''), /nonempty/);
  const resolved = resolve(updated, 0, null, 'does-not-apply', 'The essay instruction was removed. Keep my earlier work.');
  assert.equal(getTaskReviewState(taskOf(resolved)), 'reviewed');
  assert.equal(getTaskAnchor(taskOf(resolved), appOf(resolved).sources[1].id), null);
  assert.equal(taskOf(resolved).sourceReviews[0].resolution.anchor, null);
  assert.equal(taskOf(resolved).applicability, 'does-not-apply');
  assert.deepEqual(taskOf(resolved).completionHistory, taskOf(initial).completionHistory);
  assert.equal(appOf(resolved).tasks.length, 1);
  assert.equal(taskOf(add(resolved, 'Include a fictional study plan.')).sourceReviews[1].kind, 'unresolved');
});

test('resolving an earlier version after a later update cannot acknowledge or remap the later review', () => {
  const initial = setup();
  const second = add(initial, 'Write 400 words.');
  const third = add(second, 'Write 300 words.');
  const laterReview = taskOf(third).sourceReviews[1];
  assert.equal(laterReview.kind, 'unresolved');
  const olderResolved = resolve(third, 0, anchor('Write 400 words.'), 'does-not-apply');
  assert.deepEqual(taskOf(olderResolved).sourceReviews[1], laterReview);
  assert.equal(getTaskReviewState(taskOf(olderResolved)), 'needs-review');
  assert.equal(getTaskAnchor(taskOf(olderResolved), appOf(olderResolved).sources[2].id), null);
  assert.equal(taskOf(olderResolved).applicability, 'applies', 'historical resolution must not change current applicability');
  assert.equal(taskOf(olderResolved).sourceReviews[0].resolution.applicability, 'does-not-apply');
  const allResolved = resolve(olderResolved, 1, anchor('Write 300 words.'), 'not-decided');
  assert.equal(getTaskReviewState(taskOf(allResolved)), 'reviewed');
  assert.equal(taskOf(allResolved).applicability, 'not-decided');
  assert.deepEqual(parseBackup(serializeBackup(allResolved)), allResolved);
});

test('resolving a newer version first leaves earlier uncertainty visible and cannot be resolved twice', () => {
  const third = add(add(setup(), 'Write 400 words.'), 'Write 300 words.');
  const latestResolved = resolve(third, 1, anchor('Write 300 words.'), 'not-decided');
  assert.equal(getTaskReviewState(taskOf(latestResolved)), 'needs-review');
  assert.equal(taskOf(latestResolved).sourceReviews[0].resolution, null);
  assert.throws(() => resolve(latestResolved, 1, null, 'applies', 'Replace my decision'), /already has/);
  const previousHistory = taskOf(latestResolved).applicabilityHistory;
  const allResolved = resolve(latestResolved, 0, anchor('Write 400 words.'), 'does-not-apply');
  assert.equal(getTaskReviewState(taskOf(allResolved)), 'reviewed');
  assert.equal(taskOf(allResolved).applicability, 'not-decided');
  assert.deepEqual(taskOf(allResolved).applicabilityHistory, previousHistory);
  assert.deepEqual(parseBackup(serializeBackup(allResolved)), allResolved);
});

test('reverting to original wording does not bypass an unresolved intervening version', () => {
  const initial = setup();
  const reverted = add(add(initial, 'Write 400 words.'), 'Write 500 words.');
  const review = taskOf(reverted).sourceReviews[1];
  assert.equal(review.kind, 'unresolved');
  assert.equal(review.suggestedAnchor.quote, 'Write 500 words.');
  assert.equal(getTaskAnchor(taskOf(reverted), appOf(reverted).sources[2].id), null);
  const oldResolved = resolve(reverted, 0, anchor('Write 400 words.'));
  assert.deepEqual(taskOf(oldResolved).sourceReviews[1], review);
  assert.equal(getTaskReviewState(taskOf(oldResolved)), 'needs-review');
});

test('future comparison uses a confirmed new mapping and preserves its original task anchor forever', () => {
  const initial = setup();
  const confirmed = resolve(add(initial, 'Write 400 words.'), 0, anchor('Write 400 words.'));
  const third = add(confirmed, 'Write 400 words.');
  const review = taskOf(third).sourceReviews[1];
  assert.equal(review.kind, 'exact');
  assert.equal(review.basisAnchor.sourceVersionId, appOf(third).sources[1].id);
  assert.equal(getTaskAnchor(taskOf(third), appOf(third).sources[2].id).quote, 'Write 400 words.');
  assert.deepEqual(taskOf(third).anchor, taskOf(initial).anchor);
});

test('new tasks link the current version only; manual tasks are not given invented source reviews', () => {
  let workspace = setup();
  workspace = createTask(workspace, appOf(workspace).id, { title: 'My unlinked reminder' });
  workspace = add(workspace, 'Write 400 words.\n\nProvide a fictional budget.');
  const before = taskOf(workspace);
  workspace = createTask(workspace, appOf(workspace).id,
    { title: 'Prepare my budget', anchor: anchor(appOf(workspace).sources[1].text, 'Provide a fictional budget.') });
  assert.deepEqual(appOf(workspace).tasks[0], before);
  assert.equal(appOf(workspace).tasks[1].anchor, null);
  assert.deepEqual(appOf(workspace).tasks[1].sourceReviews, []);
  assert.equal(appOf(workspace).tasks[2].anchor.sourceVersionId, appOf(workspace).sources[1].id);
  assert.deepEqual(appOf(workspace).tasks[2].sourceReviews, []);
  const third = add(workspace, appOf(workspace).sources[1].text);
  assert.equal(appOf(third).tasks[2].sourceReviews.length, 1);
  assert.equal(appOf(third).tasks[1].sourceReviews.length, 0);
});

test('schema-1 migration preserves every source, original anchor, ID, history, and legacy flag', () => {
  const legacy = legacyFixture();
  const migrated = migrateWorkspace(legacy);
  assert.equal(migrated.schemaVersion, 3);
  const reverted = structuredClone(migrated);
  reverted.schemaVersion = 1;
  reverted.applications.forEach(app => {
    delete app.dependencyHistory;
    delete app.workChanges;
    app.tasks.forEach(task => { delete task.sourceReviews; delete task.dependencyReviews; });
  });
  assert.deepEqual(reverted, legacy);
  assert.equal(Object.isFrozen(legacy), false);
  assert.equal(Object.isFrozen(migrated), true);
  assert.equal(getTaskReviewState(taskOf(migrated)), 'needs-review');
  const envelope = { format: 'steptrace-backup', schemaVersion: 1,
    exportedAt: '2026-09-14T00:00:00.006Z', workspace: legacy };
  assert.deepEqual(parseBackup(JSON.stringify(envelope)), migrated);
  assert.equal(JSON.parse(serializeBackup(migrated)).schemaVersion, 3);
});

test('storage migration is read-only until save and uses the same key and original raw conflict token', () => {
  const raw = JSON.stringify(legacyFixture(), null, 2);
  const adapter = memory(raw);
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  assert.equal(loaded.migrated, true);
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.raw, raw);
  assert.equal(adapter.raw, raw);
  assert.equal(adapter.writes, 0);
  const updated = add(loaded.workspace, 'A fictional changed instruction.');
  const saved = storage.save(updated, loaded.raw);
  assert.equal(saved.ok, true);
  assert.equal(JSON.parse(adapter.raw).schemaVersion, 3);
  const reloaded = createStorage(() => adapter).load();
  assert.equal(reloaded.migrated, false);
  assert.deepEqual(reloaded.workspace, updated);
});

test('malformed schema-1 data and mismatched envelopes fail migration without rewriting raw storage', () => {
  for (const corrupt of [
    value => { value.applications[0].tasks[0].anchor.quote = 'Inaccurate quote'; },
    value => { value.applications[0].tasks[0].sourceReviews = []; },
    value => { value.applications[0].tasks[0].completionHistory[1].at = '2000-01-01T00:00:00.000Z'; },
  ]) {
    const invalid = changed(legacyFixture(), corrupt);
    assert.throws(() => migrateWorkspace(invalid), /migration failed/);
    const raw = JSON.stringify(invalid);
    const adapter = memory(raw);
    const storage = createStorage(() => adapter);
    const loaded = storage.load();
    assert.equal(loaded.blocked, true);
    assert.equal(loaded.raw, raw);
    assert.equal(storage.save(createWorkspace(), raw).ok, false);
    assert.equal(adapter.raw, raw);
    assert.equal(adapter.writes, 0);
  }
  const backup = JSON.parse(serializeBackup(setup()));
  backup.schemaVersion = 1;
  assert.throws(() => parseBackup(JSON.stringify(backup)), /must agree/);
});

test('quota failure after migration keeps legacy bytes recoverable and the new version exportable', () => {
  const raw = JSON.stringify(legacyFixture());
  const adapter = memory(raw);
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  adapter.setItem = () => { throw new DOMException('Synthetic full storage', 'QuotaExceededError'); };
  const updated = add(loaded.workspace, 'A fictional changed instruction.');
  const saved = storage.save(updated, loaded.raw);
  assert.equal(saved.ok, false);
  assert.match(saved.error, /storage is full/);
  assert.equal(saved.raw, raw);
  assert.equal(adapter.raw, raw);
  assert.deepEqual(parseBackup(serializeBackup(updated)), updated);
  assert.equal(createStorage(() => adapter).load().workspace.applications[0].sources.length, 1);
});

test('review resolutions and immutable descriptors survive save/reload and additive backup restore', () => {
  const workspace = resolve(add(setup(), 'Write 400 words.'), 0, anchor('Write 400 words.'), 'not-decided', 'Confirmed changed word count.');
  const adapter = memory();
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  assert.equal(storage.save(workspace, loaded.raw).ok, true);
  assert.deepEqual(createStorage(() => adapter).load().workspace, workspace);
  const restored = parseBackup(serializeBackup(workspace));
  assert.deepEqual(restored, workspace);
  assert.deepEqual(mergeWorkspaces(createWorkspace(), restored), workspace);
  assert.throws(() => mergeWorkspaces(workspace, restored), /Duplicate ID/);
});

test('import rejects invented automatic matches, missing/reordered reviews, duplicate IDs, and wrong-version decisions', () => {
  const unresolved = add(add(setup(), 'Write 400 words.'), 'Write 300 words.');
  const resolved = resolve(unresolved, 1, anchor('Write 300 words.'));
  const cases = [
    workspace => { taskOf(workspace).sourceReviews[0].kind = 'exact'; },
    workspace => { taskOf(workspace).sourceReviews.pop(); },
    workspace => { taskOf(workspace).sourceReviews.reverse(); },
    workspace => { taskOf(workspace).sourceReviews[0].reason = 'Invented reassurance'; },
    workspace => { taskOf(workspace).sourceReviews[0].id = taskOf(workspace).completionHistory[0].id; },
    workspace => { taskOf(workspace).sourceReviews[1].resolution.id = appOf(workspace).id; },
    workspace => { taskOf(workspace).sourceReviews[1].resolution.anchor = taskOf(workspace).anchor; },
    workspace => { taskOf(workspace).sourceReviews[1].resolution.at = appOf(workspace).sources[2].createdAt; },
    workspace => { taskOf(workspace).sourceReviews[1].resolution.applicability = 'does-not-apply'; },
    workspace => { appOf(workspace).sources[1].createdAt = appOf(workspace).sources[0].createdAt; },
    workspace => { taskOf(workspace).anchor = { sourceVersionId: appOf(workspace).sources[2].id, ...anchor('Write 300 words.') }; },
  ];
  for (const corrupt of cases) {
    const invalid = changed(resolved, corrupt);
    assert.throws(() => validateWorkspace(invalid));
    const backup = JSON.parse(serializeBackup(resolved));
    backup.workspace = invalid;
    assert.throws(() => parseBackup(JSON.stringify(backup)));
  }
});

test('version limits, invalid excerpts, and invalid decisions fail without mutating current work', () => {
  const initial = setup();
  assert.throws(() => add(initial, ' \n\t'), /nonempty/);
  assert.throws(() => add(initial, 'x'.repeat(LIMITS.sourceChars + 1)), /at most/);
  const updated = add(initial, 'Write 400 words.');
  assert.throws(() => resolve(updated, 0, { start: 0, end: 4, quote: 'nope' }), /does not match/);
  assert.throws(() => resolve(updated, 0, anchor('Write 400 words.'), 'eligible'), /unsupported/);
  assert.throws(() => resolve(updated, 0, null, 'applies', 'x'.repeat(LIMITS.reviewNoteChars + 1)), /at most/);
  assert.equal(appOf(initial).sources.length, 1);
  assert.equal(taskOf(updated).sourceReviews[0].resolution, null);
  let maximum = createApplication(createWorkspace(), { title: 'Fictional version limit', text: 'Fictional instruction.' });
  for (let count = 1; count < LIMITS.sourceVersions; count++) maximum = add(maximum, 'Fictional instruction.');
  assert.equal(appOf(maximum).sources.length, 50);
  assert.throws(() => add(maximum, 'One more fictional instruction.'), /at most 50/);
});

test('near-capacity schema-1 data is preserved when migration overhead cannot fit the data limit', () => {
  const legacy = { schemaVersion: 1, applications: [] };
  for (let index = 0; index < 21; index++) {
    const suffix = String(index);
    legacy.applications.push({ id: `app-${suffix}`, title: 'Fictional capacity fixture', createdAt: '2026-09-14T00:00:00.000Z',
      sources: [{ id: `source-${suffix}`, text: 'A'.repeat(100_000), label: 'Fictional instructions', createdAt: '2026-09-14T00:00:00.000Z' }],
      tasks: [{ id: `task-${suffix}`, title: 'Fictional task', createdAt: '2026-09-14T00:00:00.001Z',
        anchor: { sourceVersionId: `source-${suffix}`, start: 0, end: 1, quote: 'A' }, applicability: 'not-decided',
        applicabilityHistory: [{ id: `choice-${suffix}`, at: '2026-09-14T00:00:00.001Z', value: 'not-decided' }],
        completionHistory: [], reviewState: 'not-reviewed' }],
    });
  }
  const excess = jsonByteLength(legacy) - (LIMITS.workspaceBytes - 1);
  legacy.applications.at(-1).sources[0].text = 'A'.repeat(100_000 - excess);
  assert.equal(jsonByteLength(legacy), LIMITS.workspaceBytes - 1);
  assert.doesNotThrow(() => validateVersionOne(legacy));
  assert.throws(() => migrateWorkspace(legacy), /migration failed.*2 MiB/);
  const raw = JSON.stringify(legacy);
  const adapter = memory(raw);
  const loaded = createStorage(() => adapter).load();
  assert.equal(loaded.blocked, true);
  assert.equal(loaded.raw, raw);
  assert.equal(adapter.raw, raw);
  assert.equal(adapter.writes, 0);
});
