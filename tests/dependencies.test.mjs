import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspace, createApplication, createTask, updateTask, addSourceVersion,
  resolveSourceReview, setTaskDependencies, recordWorkChange, acknowledgeDependencyReview,
  getTaskDependencies, getDependencyReviews, getTaskBlockers, getTaskReviewState,
  describeDependencyReview, isTaskCompleted, validateWorkspace, migrateWorkspace,
} from '../dist/src/model.js';
import { validateDependencyChange } from '../dist/src/dependencies.js';
import * as versionTwo from '../dist/src/schema-v2.js';
import { createStorage, STORAGE_KEY, serializeBackup, parseBackup, mergeWorkspaces } from '../dist/src/storage.js';

const appOf = workspace => workspace.applications[0];
const taskOf = (workspace, index) => appOf(workspace).tasks[index];
const initialText = 'Essay maximum: 500 words.\n\nRecommendation section.\n\nRequest one recommendation.\n\nFictional ending.';
function anchor(text, quote) {
  const start = text.indexOf(quote);
  return { start, end: start + quote.length, quote };
}
function setup() {
  let workspace = createApplication(createWorkspace(), { title: 'Fictional dependency checks', text: initialText });
  const appId = appOf(workspace).id;
  for (const [title, quote] of [['Draft essay', 'Essay maximum: 500 words.'], ['Proofreading', null],
    ['Final formatting', null], ['Recommendation', 'Request one recommendation.']]) {
    workspace = createTask(workspace, appId, { title, applicability: 'applies', anchor: quote ? anchor(initialText, quote) : null });
    workspace = updateTask(workspace, appId, appOf(workspace).tasks.at(-1).id, { completed: true });
  }
  workspace = dependencies(workspace, 1, [0]);
  return dependencies(workspace, 2, [1]);
}
function dependencies(workspace, index, predecessors) {
  return setTaskDependencies(workspace, appOf(workspace).id, taskOf(workspace, index).id,
    predecessors.map(previous => taskOf(workspace, previous).id));
}
function work(workspace, index, note = 'I revised the fictional wording.') {
  return recordWorkChange(workspace, appOf(workspace).id, taskOf(workspace, index).id, { note });
}
function add(workspace, words) {
  return addSourceVersion(workspace, appOf(workspace).id, { text: initialText.replace('500', String(words)) });
}
function acknowledge(workspace, index, reasonIndex = 0) {
  return acknowledgeDependencyReview(workspace, appOf(workspace).id, taskOf(workspace, index).id,
    taskOf(workspace, index).dependencyReviews[reasonIndex].id, { note: 'I checked this specific fictional change against my work.' });
}
function resolve(workspace, index = 0, reviewIndex = 0) {
  const review = taskOf(workspace, index).sourceReviews[reviewIndex];
  const source = appOf(workspace).sources.find(item => item.id === review.sourceVersionId);
  return resolveSourceReview(workspace, appOf(workspace).id, taskOf(workspace, index).id, review.id,
    { anchor: anchor(source.text, source.text.split('\n')[0]), applicability: 'applies', note: 'Reviewed the maximum; 380 words still fits.' });
}
function changed(workspace, mutate) {
  const clone = structuredClone(workspace);
  mutate(clone);
  return clone;
}
function memory(raw = null) {
  return { raw, writes: 0,
    getItem(key) { assert.equal(key, STORAGE_KEY); return this.raw; },
    setItem(key, next) { assert.equal(key, STORAGE_KEY); this.raw = next; this.writes++; },
  };
}

test('changed source flags direct and transitive dependents with causal paths, preserving completed unrelated work', () => {
  const before = setup();
  const after = add(before, 400);
  for (let index = 0; index < 4; index++) {
    assert.deepEqual(taskOf(after, index).completionHistory, taskOf(before, index).completionHistory);
    assert.deepEqual(taskOf(after, index).applicabilityHistory, taskOf(before, index).applicabilityHistory);
    assert.equal(isTaskCompleted(taskOf(after, index)), true);
  }
  assert.equal(getTaskReviewState(taskOf(after, 0)), 'needs-review');
  const causeId = taskOf(after, 0).sourceReviews[0].id;
  assert.equal(taskOf(after, 1).dependencyReviews[0].causeId, causeId);
  assert.deepEqual(taskOf(after, 2).dependencyReviews[0].path, [0, 1, 2].map(index => taskOf(after, index).id));
  assert.equal(taskOf(after, 3).sourceReviews[0].kind, 'exact');
  assert.deepEqual(taskOf(after, 3).dependencyReviews, []);
  assert.equal(getTaskReviewState(taskOf(after, 3)), 'reviewed');
  const description = describeDependencyReview(appOf(after), taskOf(after, 2), taskOf(after, 2).dependencyReviews[0]);
  assert.match(description.reason, /Final formatting.*Draft essay/);
  assert.deepEqual(description.chain, ['Draft essay', 'Proofreading', 'Final formatting']);
  assert.equal(description.sourceVersionId, appOf(after).sources[1].id);
});

test('self, missing, cross-application, duplicate, direct and transitive cycles fail without changing work', () => {
  let workspace = setup();
  workspace = createApplication(workspace, { title: 'Separate fictional app', text: 'Separate instructions.' });
  workspace = createTask(workspace, workspace.applications[1].id, { title: 'Other task' });
  const original = JSON.stringify(workspace);
  assert.throws(() => dependencies(workspace, 0, [0]), /itself/);
  assert.throws(() => dependencies(workspace, 0, [1]), /cycle/);
  assert.throws(() => dependencies(workspace, 0, [2]), /cycle/);
  assert.throws(() => dependencies(workspace, 1, [0, 0]), /only once/);
  for (const ids of [['missing'], [workspace.applications[1].tasks[0].id], ['__proto__'], [3]]) {
    assert.throws(() => setTaskDependencies(workspace, appOf(workspace).id, taskOf(workspace, 0).id, ids), /missing/);
  }
  assert.throws(() => setTaskDependencies(workspace, appOf(workspace).id, taskOf(workspace, 0).id, null), /plain list/);
  assert.equal(JSON.stringify(workspace), original);
});

test('multiple changed ancestors produce independent reasons; diamond paths produce one reason per event', () => {
  let workspace = setup();
  workspace = dependencies(workspace, 2, [0, 1, 3]);
  workspace = work(workspace, 0, 'Changed the fictional draft.');
  workspace = work(workspace, 3, 'Changed the fictional recommendation request.');
  const reasons = taskOf(workspace, 2).dependencyReviews;
  assert.equal(reasons.length, 2);
  assert.deepEqual(reasons[0].path, [taskOf(workspace, 0).id, taskOf(workspace, 2).id], 'breadth-first selects a short deterministic explanation');
  const after = acknowledge(workspace, 2, 0);
  assert.equal(taskOf(after, 2).dependencyReviews[0].resolution.note.length > 0, true);
  assert.deepEqual(taskOf(after, 2).dependencyReviews[1], reasons[1]);
  assert.equal(getTaskReviewState(taskOf(after, 2)), 'needs-review');
  assert.equal(taskOf(after, 1).dependencyReviews[0].resolution, null, 'acknowledgment is not shared between dependent tasks');
});

test('two explicit work edits under the same source version keep distinct events and independent acknowledgments', () => {
  const before = setup();
  let workspace = work(before, 0);
  workspace = work(workspace, 0);
  assert.equal(appOf(workspace).sources.length, 1);
  assert.equal(appOf(workspace).workChanges.length, 2);
  assert.notEqual(appOf(workspace).workChanges[0].id, appOf(workspace).workChanges[1].id);
  assert.equal(appOf(workspace).workChanges[0].sourceVersionId, appOf(workspace).workChanges[1].sourceVersionId);
  assert.equal(taskOf(workspace, 1).dependencyReviews.length, 2);
  assert.deepEqual(taskOf(workspace, 0), taskOf(before, 0), 'reporting an external work edit does not invent source review or change its completion');
  workspace = acknowledge(workspace, 1, 0);
  assert.equal(getTaskReviewState(taskOf(workspace, 1)), 'needs-review');
  assert.equal(taskOf(workspace, 1).dependencyReviews[1].resolution, null);
  assert.throws(() => acknowledge(workspace, 1, 0), /already/);
  assert.deepEqual(parseBackup(serializeBackup(workspace)), workspace);
});

test('acknowledgments across source versions never clear a newer event or another task review', () => {
  const before = setup();
  let workspace = add(add(before, 400), 350);
  const laterDirect = taskOf(workspace, 0).sourceReviews[1];
  const laterDependent = taskOf(workspace, 1).dependencyReviews[1];
  workspace = resolve(workspace, 0, 0);
  assert.equal(taskOf(workspace, 1).dependencyReviews[0].resolution, null);
  workspace = acknowledge(workspace, 1, 0);
  assert.deepEqual(taskOf(workspace, 0).sourceReviews[1], laterDirect);
  assert.deepEqual(taskOf(workspace, 1).dependencyReviews[1], laterDependent);
  assert.equal(getTaskReviewState(taskOf(workspace, 0)), 'needs-review');
  assert.equal(getTaskReviewState(taskOf(workspace, 1)), 'needs-review');
  assert.equal(taskOf(workspace, 2).dependencyReviews.every(reason => reason.resolution === null), true);
  assert.deepEqual(taskOf(workspace, 1).completionHistory, taskOf(before, 1).completionHistory);
  assert.deepEqual(parseBackup(serializeBackup(workspace)), workspace);
});

test('source and work reasons coexist; completion and task wording changes do not acknowledge either', () => {
  let workspace = work(add(setup(), 400), 0);
  const reasons = taskOf(workspace, 1).dependencyReviews;
  workspace = updateTask(workspace, appOf(workspace).id, taskOf(workspace, 1).id,
    { title: 'Proofread the revised essay', completed: false, applicability: 'does-not-apply' });
  workspace = updateTask(workspace, appOf(workspace).id, taskOf(workspace, 1).id, { completed: true });
  assert.deepEqual(taskOf(workspace, 1).dependencyReviews, reasons);
  assert.equal(getTaskReviewState(taskOf(workspace, 1)), 'needs-review');
  assert.equal(getTaskBlockers(appOf(workspace), taskOf(workspace, 1).id).some(blocker => blocker.kind === 'review'), true);
});

test('new edges propagate currently open source and inherited work reasons; removing edges preserves historical explanations', () => {
  let workspace = setup();
  workspace = dependencies(workspace, 1, []);
  workspace = add(workspace, 400);
  assert.equal(taskOf(workspace, 1).dependencyReviews.length, 0);
  workspace = dependencies(workspace, 1, [0]);
  assert.equal(taskOf(workspace, 1).dependencyReviews.length, 1);
  assert.equal(taskOf(workspace, 2).dependencyReviews.length, 1);
  const historical = taskOf(workspace, 1).dependencyReviews;
  workspace = dependencies(workspace, 1, []);
  assert.deepEqual(taskOf(workspace, 1).dependencyReviews, historical);
  assert.deepEqual(getTaskDependencies(appOf(workspace), taskOf(workspace, 1).id), []);
  assert.deepEqual(parseBackup(serializeBackup(workspace)), workspace);
  workspace = dependencies(workspace, 1, [0]);
  workspace = work(workspace, 0);
  workspace = dependencies(workspace, 3, [1]);
  assert.equal(taskOf(workspace, 3).dependencyReviews.length, 2);
  assert.deepEqual(taskOf(workspace, 3).dependencyReviews[1].path, [0, 1, 3].map(index => taskOf(workspace, index).id));
});

test('a report before any downstream dependency is historical, while an unchanged dependency selection is a no-op', () => {
  let workspace = setup();
  workspace = dependencies(workspace, 1, []);
  workspace = work(workspace, 0);
  workspace = dependencies(workspace, 1, [0]);
  assert.equal(taskOf(workspace, 1).dependencyReviews.length, 0);
  const repeated = dependencies(workspace, 1, [0]);
  assert.deepEqual(repeated, workspace);
  assert.deepEqual(getDependencyReviews(appOf(repeated), taskOf(repeated, 1).id), []);
});

test('historical paths cannot loop when later dependency decisions reverse an earlier direction', () => {
  let workspace = work(setup(), 0);
  workspace = dependencies(workspace, 1, []);
  workspace = dependencies(workspace, 0, [2]);
  workspace = dependencies(workspace, 3, [0]);
  for (const task of appOf(workspace).tasks) {
    for (const review of task.dependencyReviews) assert.equal(new Set(review.path).size, review.path.length);
  }
  assert.deepEqual(parseBackup(serializeBackup(workspace)), workspace);
});

test('readiness remains blocked by unknown choices, incomplete required ancestors and open reviews until human decisions', () => {
  let workspace = setup();
  const appId = appOf(workspace).id;
  const targetId = taskOf(workspace, 2).id;
  assert.deepEqual(getTaskBlockers(appOf(workspace), targetId), []);
  workspace = updateTask(workspace, appId, taskOf(workspace, 0).id, { completed: false, applicability: 'not-decided' });
  assert.equal(getTaskBlockers(appOf(workspace), targetId).some(reason => reason.kind === 'applicability'), true);
  workspace = updateTask(workspace, appId, taskOf(workspace, 0).id, { applicability: 'applies' });
  assert.equal(getTaskBlockers(appOf(workspace), targetId).some(reason => reason.kind === 'incomplete'), true);
  workspace = updateTask(workspace, appId, taskOf(workspace, 0).id, { applicability: 'does-not-apply' });
  assert.deepEqual(getTaskBlockers(appOf(workspace), targetId), []);
  const choices = taskOf(workspace, 0).applicabilityHistory;
  workspace = add(workspace, 400);
  assert.deepEqual(taskOf(workspace, 0).applicabilityHistory, choices);
  assert.equal(taskOf(workspace, 0).applicability, 'does-not-apply');
  assert.equal(getTaskBlockers(appOf(workspace), targetId).some(reason => reason.kind === 'review'), true);
});

test('deep dependency traversal and cycle checks are iterative and deduplicate ancestor blockers', () => {
  const count = 2_000;
  const tasks = Array.from({ length: count }, (_, index) => ({ id: `task-${index}`, title: `Fictional task ${index}`,
    applicability: index === 0 ? 'not-decided' : 'applies', reviewState: 'not-reviewed', sourceReviews: [],
    dependencyReviews: [], completionHistory: [{ completed: true }] }));
  const dependencyHistory = tasks.slice(1).map((task, index) => ({ taskId: task.id, dependencyIds: [tasks[index].id] }));
  const application = { tasks, dependencyHistory };
  const graph = new Map(tasks.map((task, index) => [task.id, index ? [tasks[index - 1].id] : []]));
  assert.throws(() => validateDependencyChange(graph, tasks[0].id, [tasks.at(-1).id]), /cycle/);
  assert.equal(getTaskBlockers(application, tasks.at(-1).id).length, 1);
});

test('restoring rejects missing reasons, fabricated paths, causes, decisions, IDs and acknowledgment times', () => {
  const workspace = acknowledge(work(add(setup(), 400), 0), 1, 0);
  const mutations = [
    value => { taskOf(value, 1).dependencyReviews.pop(); },
    value => { taskOf(value, 1).dependencyReviews[0].causeId = 'missing-event'; },
    value => { taskOf(value, 1).dependencyReviews[0].id = appOf(value).id; },
    value => { taskOf(value, 1).dependencyReviews[0].path = [taskOf(value, 0).id, taskOf(value, 3).id, taskOf(value, 1).id]; },
    value => { taskOf(value, 1).dependencyReviews[0].resolution.at = taskOf(value, 1).dependencyReviews[0].at; },
    value => { taskOf(value, 1).dependencyReviews[0].resolution.note = ''; },
    value => { appOf(value).dependencyHistory[0].dependencyIds = [taskOf(value, 2).id]; },
    value => { appOf(value).dependencyHistory.shift(); },
    value => { appOf(value).workChanges[0].sourceVersionId = appOf(value).sources[0].id; },
    value => { appOf(value).workChanges[0].id = taskOf(value, 0).id; },
  ];
  for (const mutate of mutations) {
    const invalid = changed(workspace, mutate);
    assert.throws(() => validateWorkspace(invalid));
    const raw = JSON.stringify(invalid);
    const adapter = memory(raw);
    const storage = createStorage(() => adapter);
    const loaded = storage.load();
    assert.equal(loaded.blocked, true);
    assert.match(loaded.error, /could not be opened/);
    assert.equal(storage.save(createWorkspace(), raw).ok, false);
    assert.equal(adapter.raw, raw);
    assert.equal(adapter.writes, 0);
  }
});

test('schema-2 migration preserves source mappings and histories without inventing old dependencies', () => {
  let old = versionTwo.createApplication(versionTwo.createWorkspace(), { title: 'Fictional schema two', text: initialText });
  old = versionTwo.createTask(old, appOf(old).id, { title: 'Earlier essay', applicability: 'applies',
    anchor: anchor(initialText, 'Essay maximum: 500 words.') });
  old = versionTwo.updateTask(old, appOf(old).id, taskOf(old, 0).id, { completed: true });
  old = versionTwo.addSourceVersion(old, appOf(old).id, { text: initialText.replace('500', '400') });
  const migrated = migrateWorkspace(old);
  const projected = structuredClone(migrated);
  projected.schemaVersion = 2;
  for (const application of projected.applications) {
    delete application.dependencyHistory;
    delete application.workChanges;
    for (const task of application.tasks) delete task.dependencyReviews;
  }
  assert.deepEqual(projected, old);
  assert.deepEqual(appOf(migrated).dependencyHistory, []);
  assert.deepEqual(appOf(migrated).workChanges, []);
  const raw = JSON.stringify(old, null, 2);
  const adapter = memory(raw);
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  assert.equal(loaded.migrated, true);
  assert.equal(adapter.raw, raw);
  assert.equal(adapter.writes, 0);
  assert.deepEqual(loaded.workspace, migrated);
  const envelope = { format: 'steptrace-backup', schemaVersion: 2, exportedAt: '2026-09-15T00:00:00.000Z', workspace: old };
  assert.deepEqual(parseBackup(JSON.stringify(envelope)), migrated);
  assert.equal(storage.save(migrated, raw).ok, true);
  assert.equal(JSON.parse(adapter.raw).schemaVersion, 3);
});

test('resulting graph, both event kinds and acknowledgments survive reload/export/import; quota failure stays unsaved', () => {
  const workspace = acknowledge(work(add(setup(), 400), 0), 1, 0);
  const restored = parseBackup(serializeBackup(workspace));
  assert.deepEqual(restored, workspace);
  assert.deepEqual(mergeWorkspaces(createWorkspace(), restored), workspace);
  assert.throws(() => mergeWorkspaces(workspace, restored), /Duplicate ID/);
  const adapter = memory();
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  const saved = storage.save(workspace, loaded.raw);
  assert.equal(saved.ok, true);
  assert.deepEqual(createStorage(() => adapter).load().workspace, workspace);
  const unsaved = work(workspace, 0, 'Second fictional edit, still same source version.');
  adapter.setItem = () => { throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); };
  const failed = storage.save(unsaved, saved.raw);
  assert.equal(failed.ok, false);
  assert.match(failed.error, /storage is full/);
  assert.equal(adapter.raw, saved.raw);
  assert.deepEqual(parseBackup(serializeBackup(unsaved)), unsaved);
});

test('work/acknowledgment validation rejects blank reports and incorrect task references', () => {
  const workspace = work(setup(), 0);
  assert.throws(() => work(workspace, 0, '  '), /nonempty/);
  assert.throws(() => recordWorkChange(workspace, appOf(workspace).id, 'missing', { note: 'Changed work.' }), /no longer exists/);
  assert.throws(() => acknowledgeDependencyReview(workspace, appOf(workspace).id, taskOf(workspace, 1).id,
    taskOf(workspace, 1).dependencyReviews[0].id, { note: '' }), /nonempty/);
  assert.throws(() => acknowledgeDependencyReview(workspace, appOf(workspace).id, taskOf(workspace, 3).id,
    taskOf(workspace, 1).dependencyReviews[0].id, { note: 'Wrong task' }), /no longer exists/);
});
