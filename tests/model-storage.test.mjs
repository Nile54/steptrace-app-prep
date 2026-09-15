import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspace, createApplication, createTask, updateTask,
  validateWorkspace, isTaskCompleted, LIMITS,
} from '../dist/src/model.js';
import {
  createStorage, STORAGE_KEY, serializeBackup, parseBackup, mergeWorkspaces,
} from '../dist/src/storage.js';

const SOURCE = 'Fictional award only. 🧭 Write 400 words.\nIf you work, include a schedule.\nWrite 400 words.\n<img src=x onerror="globalThis.injectionRan=true">';

function application(text = SOURCE) {
  return createApplication(createWorkspace(), { title: 'Fictional award', text, label: 'Fictional pasted instructions' });
}

function linkedWorkspace() {
  const workspace = application();
  const quote = 'Write 400 words.';
  const start = SOURCE.lastIndexOf(quote);
  return createTask(workspace, workspace.applications[0].id, {
    title: 'Draft my essay', anchor: { start, end: start + quote.length, quote }, applicability: 'applies',
  });
}

function memoryStorage(initial = null) {
  let raw = initial;
  const adapter = {
    getItem(key) { assert.equal(key, STORAGE_KEY); return raw; },
    setItem(key, value) { assert.equal(key, STORAGE_KEY); raw = value; adapter.writes += 1; },
    writes: 0,
    get raw() { return raw; },
    replace(value) { raw = value; },
  };
  return adapter;
}

function mutate(workspace, fn) {
  const candidate = structuredClone(workspace);
  fn(candidate);
  return candidate;
}

test('source snapshots preserve every character and are deeply immutable without freezing caller input', () => {
  const text = '\r\n  Fictional 🧭  instruction.\n\tKeep these spaces.  ';
  const empty = createWorkspace();
  const workspace = application(text);
  assert.equal(empty.applications.length, 0);
  assert.equal(workspace.applications[0].sources[0].text, text);
  assert.throws(() => { workspace.applications[0].sources[0].text = 'changed'; }, TypeError);
  assert.throws(() => workspace.applications.push({}), TypeError);
  const input = structuredClone(workspace);
  const validated = validateWorkspace(input);
  assert.notEqual(input, validated);
  assert.equal(Object.isFrozen(input), false);
  input.applications[0].sources[0].text = 'Caller edit';
  assert.equal(validated.applications[0].sources[0].text, text);
});

test('an exact anchor identifies the selected repeated occurrence after emoji using UTF-16 offsets', () => {
  const workspace = linkedWorkspace();
  const app = workspace.applications[0];
  const { anchor } = app.tasks[0];
  assert.equal(anchor.start, SOURCE.lastIndexOf('Write 400 words.'));
  assert.notEqual(anchor.start, SOURCE.indexOf('Write 400 words.'));
  assert.equal(anchor.sourceVersionId, app.sources[0].id);
  assert.equal(app.sources[0].text.slice(anchor.start, anchor.end), anchor.quote);
  const emojiStart = SOURCE.indexOf('🧭');
  const withEmoji = createTask(workspace, app.id, {
    title: 'Keep selected symbol', anchor: { start: emojiStart, end: emojiStart + 2, quote: '🧭' },
  });
  assert.equal(withEmoji.applications[0].tasks[1].anchor.end - emojiStart, 2);
});

test('manual tasks retain a null source and human-selected applicability', () => {
  const workspace = application();
  const next = createTask(workspace, workspace.applications[0].id, { title: '  Ask myself what is missing  ' });
  const task = next.applications[0].tasks[0];
  assert.equal(task.title, 'Ask myself what is missing');
  assert.equal(task.anchor, null);
  assert.equal(task.applicability, 'not-decided');
  assert.equal(task.applicabilityHistory[0].value, 'not-decided');
  assert.deepEqual(task.completionHistory, []);
  assert.equal(isTaskCompleted(task), false);
  assert.equal(task.reviewState, 'not-reviewed');
});

test('source anchors reject either boundary inside CRLF while preserving whole line breaks', () => {
  const text = 'A\r\nB';
  const workspace = application(text);
  const applicationId = workspace.applications[0].id;
  for (const [start, end] of [[0, 2], [2, 4]]) {
    const anchor = { start, end, quote: text.slice(start, end) };
    assert.throws(() => createTask(workspace, applicationId, { title: 'Partial line break', anchor }), /must not split a CRLF line break/);
  }
  const valid = createTask(workspace, applicationId, { title: 'Whole line break', anchor: { start: 0, end: 3, quote: 'A\r\n' } });
  assert.equal(valid.applications[0].tasks[0].anchor.quote, 'A\r\n');
  const damagedBackup = JSON.parse(serializeBackup(valid));
  damagedBackup.workspace.applications[0].tasks[0].anchor.end = 2;
  damagedBackup.workspace.applications[0].tasks[0].anchor.quote = 'A\r';
  assert.throws(() => parseBackup(JSON.stringify(damagedBackup)), /must not split a CRLF line break/);
});

test('source anchors reject either boundary inside a surrogate pair and accept the complete character', () => {
  const text = 'A🧭B';
  const workspace = application(text);
  const applicationId = workspace.applications[0].id;
  for (const [start, end] of [[0, 2], [2, 4]]) {
    const anchor = { start, end, quote: text.slice(start, end) };
    assert.throws(() => createTask(workspace, applicationId, { title: 'Partial symbol', anchor }), /must not split a UTF-16 surrogate pair/);
  }
  const valid = createTask(workspace, applicationId, { title: 'Whole symbol', anchor: { start: 1, end: 3, quote: '🧭' } });
  assert.equal(valid.applications[0].tasks[0].anchor.quote, '🧭');
  const damagedBackup = JSON.parse(serializeBackup(valid));
  damagedBackup.workspace.applications[0].tasks[0].anchor.start = 2;
  damagedBackup.workspace.applications[0].tasks[0].anchor.quote = text.slice(2, 3);
  assert.throws(() => parseBackup(JSON.stringify(damagedBackup)), /must not split a UTF-16 surrogate pair/);
});

test('editing wording, applicability, and completion appends only changes and leaves source/review intact', () => {
  const original = linkedWorkspace();
  const initial = validateWorkspace(mutate(original, value => { value.applications[0].tasks[0].reviewState = 'needs-review'; }));
  const app = initial.applications[0];
  const taskId = app.tasks[0].id;
  let next = updateTask(initial, app.id, taskId, { title: 'Check my essay', completed: true, applicability: 'does-not-apply' });
  const firstCompletion = next.applications[0].tasks[0].completionHistory[0];
  const firstApplicability = next.applications[0].tasks[0].applicabilityHistory[0];
  next = updateTask(next, app.id, taskId, { completed: true, applicability: 'does-not-apply' });
  assert.equal(next.applications[0].tasks[0].completionHistory.length, 1);
  assert.equal(next.applications[0].tasks[0].applicabilityHistory.length, 2);
  next = updateTask(next, app.id, taskId, { completed: false, applicability: 'not-decided' });
  next = updateTask(next, app.id, taskId, { completed: true });
  const result = next.applications[0].tasks[0];
  assert.equal(result.title, 'Check my essay');
  assert.deepEqual(result.completionHistory.map(event => event.completed), [true, false, true]);
  assert.deepEqual(result.completionHistory[0], firstCompletion);
  assert.deepEqual(result.applicabilityHistory[0], firstApplicability);
  assert.deepEqual(result.applicabilityHistory.map(event => event.value), ['applies', 'does-not-apply', 'not-decided']);
  assert.equal(result.reviewState, 'needs-review');
  assert.equal(isTaskCompleted(result), true);
  assert.deepEqual(result.anchor, app.tasks[0].anchor);
  assert.deepEqual(next.applications[0].sources, app.sources);
  assert.deepEqual(initial.applications[0].tasks[0].completionHistory, []);
  assert.equal(initial.applications[0].tasks[0].title, 'Draft my essay');
});

test('updates cannot change source anchors, review flags, or histories through an unsupported patch', () => {
  const workspace = linkedWorkspace();
  const app = workspace.applications[0];
  for (const changes of [{ anchor: null }, { reviewState: 'needs-review' }, { completionHistory: [] }, { completed: 'yes' }]) {
    assert.throws(() => updateTask(workspace, app.id, app.tasks[0].id, changes));
  }
  assert.throws(() => updateTask(workspace, 'missing', app.tasks[0].id, { title: 'Edit' }), /no longer exists/);
  assert.throws(() => updateTask(workspace, app.id, 'missing', { title: 'Edit' }), /no longer exists/);
});

test('reload and versioned export/import preserve source IDs, exact anchors, and both histories', () => {
  const initial = linkedWorkspace();
  const app = initial.applications[0];
  const workspace = updateTask(initial, app.id, app.tasks[0].id, { completed: true, applicability: 'not-decided' });
  const adapter = memoryStorage();
  const storage = createStorage(() => adapter);
  const empty = storage.load();
  assert.deepEqual(empty.workspace, createWorkspace());
  assert.equal(empty.raw, null);
  const saved = storage.save(workspace, empty.raw);
  assert.equal(saved.ok, true);
  const reloaded = createStorage(() => adapter).load();
  assert.equal(reloaded.blocked, false);
  assert.deepEqual(reloaded.workspace, workspace);
  const json = serializeBackup(reloaded.workspace);
  assert.equal(JSON.parse(json).format, 'steptrace-backup');
  assert.equal(JSON.parse(json).schemaVersion, 1);
  const restored = parseBackup(json);
  assert.deepEqual(restored, workspace);
  assert.equal(Object.isFrozen(restored.applications[0].tasks[0].anchor), true);
  assert.equal(adapter.writes, 1);
});

test('HTML-like untrusted content is stored and restored exactly as text, without execution', () => {
  globalThis.injectionRan = false;
  const workspace = linkedWorkspace();
  const restored = parseBackup(serializeBackup(workspace));
  assert.equal(restored.applications[0].sources[0].text, SOURCE);
  assert.equal(globalThis.injectionRan, false);
  delete globalThis.injectionRan;
  // Real DOM inertness is checked separately through the browser interface.
});

test('restore merges disjoint applications without altering either input or current data', () => {
  const existing = linkedWorkspace();
  const incoming = application('Another fictional award instruction.');
  const merged = mergeWorkspaces(existing, incoming);
  assert.equal(merged.applications.length, 2);
  assert.equal(existing.applications.length, 1);
  assert.equal(incoming.applications.length, 1);
  assert.deepEqual(merged.applications[0], existing.applications[0]);
  assert.deepEqual(merged.applications[1], incoming.applications[0]);
});

test('restore rejects ID collisions even when only a source or a history event collides', () => {
  const existing = linkedWorkspace();
  assert.throws(() => mergeWorkspaces(existing, existing), /Duplicate ID/);
  const sourceCollision = mutate(application(), incoming => {
    incoming.applications[0].sources[0].id = existing.applications[0].sources[0].id;
  });
  assert.throws(() => mergeWorkspaces(existing, sourceCollision), /Duplicate ID/);
  const eventCollision = mutate(linkedWorkspace(), incoming => {
    incoming.applications[0].tasks[0].applicabilityHistory[0].id = existing.applications[0].tasks[0].applicabilityHistory[0].id;
  });
  assert.throws(() => mergeWorkspaces(existing, eventCollision), /Duplicate ID/);
  assert.equal(existing.applications.length, 1);
});

test('validation rejects duplicate global IDs within and across entity types', () => {
  const valid = linkedWorkspace();
  for (const corrupt of [
    value => { value.applications[0].sources[0].id = value.applications[0].id; },
    value => { value.applications[0].tasks[0].id = value.applications[0].id; },
    value => { value.applications[0].tasks[0].applicabilityHistory[0].id = value.applications[0].id; },
    value => { value.applications.push(structuredClone(value.applications[0])); },
  ]) assert.throws(() => validateWorkspace(mutate(valid, corrupt)), /Duplicate ID/);
});

test('validation rejects missing, cross-application, inaccurate, or empty source references', () => {
  const valid = linkedWorkspace();
  for (const corrupt of [
    task => { task.anchor.sourceVersionId = 'missing'; },
    task => { task.anchor.start = -1; },
    task => { task.anchor.start = 1.5; },
    task => { task.anchor.end = SOURCE.length + 1; },
    task => { task.anchor.end = task.anchor.start; },
    task => { task.anchor.quote = 'Different quote'; },
    task => { task.anchor.quote = ''; },
    task => { task.anchor = { sourceVersionId: task.anchor.sourceVersionId, start: 9, end: 10, quote: ' ' }; },
  ]) assert.throws(() => validateWorkspace(mutate(valid, value => corrupt(value.applications[0].tasks[0]))));
  const other = application('Different fictional source');
  const merged = mergeWorkspaces(valid, other);
  const foreignReference = mutate(merged, value => {
    value.applications[0].tasks[0].anchor.sourceVersionId = value.applications[1].sources[0].id;
  });
  assert.throws(() => validateWorkspace(foreignReference), /missing source in this application/);
});

test('validation rejects unknown or missing fields, future schemas, bad enums, and malformed timestamps', () => {
  const valid = linkedWorkspace();
  const cases = [
    value => { value.schemaVersion = 2; },
    value => { value.schemaVersion = '1'; },
    value => { value.extra = true; },
    value => { delete value.applications[0].title; },
    value => { value.applications[0].sources[0].html = '<p>no</p>'; },
    value => { value.applications[0].createdAt = '2026-02-30T00:00:00.000Z'; },
    value => { value.applications[0].sources[0].createdAt = 'not-a-date'; },
    value => { value.applications[0].tasks[0].applicability = 'eligible'; },
    value => { value.applications[0].tasks[0].reviewState = 'complete'; },
    value => { value.applications[0].tasks[0].applicabilityHistory[0].at = '2026-09-14'; },
    value => { value.applications[0].tasks[0].applicabilityHistory[0].value = 'does-not-apply'; },
    value => { value.applications[0].tasks[0].applicabilityHistory = []; },
    value => { value.applications[0].tasks[0].id = '<script>'; },
    value => { value.applications[0].sources.push(structuredClone(value.applications[0].sources[0])); },
  ];
  for (const corrupt of cases) assert.throws(() => validateWorkspace(mutate(valid, corrupt)));
});

test('validation rejects histories with invalid types, ordering, or duplicate unchanged events', () => {
  const base = linkedWorkspace();
  const app = base.applications[0];
  const completed = updateTask(base, app.id, app.tasks[0].id, { completed: true });
  const cases = [
    task => { task.completionHistory[0].completed = 'true'; },
    task => { task.completionHistory[0].completed = false; },
    task => { task.completionHistory[0].at = '2000-01-01T00:00:00.000Z'; },
    task => { task.completionHistory.push({ ...task.completionHistory[0], id: 'unique-completion-event' }); },
    task => { task.applicabilityHistory.push({ ...task.applicabilityHistory[0], id: 'unique-applicability-event' }); },
  ];
  for (const corrupt of cases) {
    assert.throws(() => validateWorkspace(mutate(completed, value => corrupt(value.applications[0].tasks[0]))));
  }
});

test('input and import size limits reject blank or oversized material before it can become stored work', () => {
  assert.throws(() => application(' \r\n\t'), /nonempty/);
  assert.throws(() => application('x'.repeat(LIMITS.sourceChars + 1)), /at most/);
  assert.throws(() => createApplication(createWorkspace(), { title: 'x'.repeat(LIMITS.titleChars + 1), text: SOURCE }), /at most/);
  assert.throws(() => parseBackup(' '.repeat(LIMITS.payloadBytes + 1)), /2 MiB/);
  const tooMany = { schemaVersion: 1, applications: Array.from({ length: LIMITS.applications + 1 }, () => ({})) };
  assert.throws(() => validateWorkspace(tooMany), /0–100/);
});

test('backup parser rejects malformed input, unknown envelopes, and invalid embedded data', () => {
  const valid = JSON.parse(serializeBackup(linkedWorkspace()));
  for (const value of [null, [], { ...valid, format: 'another-app' }, { ...valid, schemaVersion: 99 },
    { ...valid, extra: 'data' }, { ...valid, exportedAt: '2026-02-30T00:00:00.000Z' },
    { ...valid, workspace: { ...valid.workspace, schemaVersion: 99 } }]) {
    assert.throws(() => parseBackup(JSON.stringify(value)));
  }
  assert.throws(() => parseBackup('{unfinished'), /not valid JSON/);
  assert.throws(() => parseBackup(JSON.stringify(valid.workspace)), /fields/);
});

test('corrupt or unsupported stored data is left untouched and blocks all writes', () => {
  for (const raw of ['{broken', JSON.stringify({ schemaVersion: 99, applications: [] }), ' '.repeat(LIMITS.payloadBytes + 1)]) {
    const adapter = memoryStorage(raw);
    const storage = createStorage(() => adapter);
    const loaded = storage.load();
    assert.equal(loaded.blocked, true);
    assert.match(loaded.error, /left untouched/);
    assert.equal(loaded.raw, raw);
    assert.deepEqual(loaded.workspace, createWorkspace());
    const saved = storage.save(application(), loaded.raw);
    assert.equal(saved.ok, false);
    assert.equal(saved.blocked, true);
    assert.equal(adapter.raw, raw);
    assert.equal(adapter.writes, 0);
  }
});

test('unavailable storage getter, read failure, and missing API report failure without writes', () => {
  for (const getter of [
    () => { throw new DOMException('Blocked', 'SecurityError'); },
    () => ({ getItem() { throw new DOMException('Blocked', 'SecurityError'); }, setItem() { assert.fail('must not write'); } }),
    () => undefined,
  ]) {
    const storage = createStorage(getter);
    const loaded = storage.load();
    assert.equal(loaded.blocked, true);
    assert.match(loaded.error, /unavailable/);
    assert.equal(storage.save(application(), loaded.raw).ok, false);
  }
});

test('quota failure is not reported as saved and leaves prior content and last saved raw intact', () => {
  const original = linkedWorkspace();
  const previousRaw = JSON.stringify(original);
  const adapter = memoryStorage(previousRaw);
  const storage = createStorage(() => adapter);
  const loaded = storage.load();
  adapter.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  const updated = createTask(original, original.applications[0].id, { title: 'Unsaved manual work' });
  const result = storage.save(updated, loaded.raw);
  assert.equal(result.ok, false);
  assert.match(result.error, /storage is full/);
  assert.equal(result.raw, previousRaw);
  assert.equal(adapter.raw, previousRaw);
  assert.deepEqual(parseBackup(serializeBackup(updated)), updated, 'unsaved in-memory changes remain exportable');
  assert.equal(createStorage(() => adapter).load().workspace.applications[0].tasks.length, 1);
});

test('security and read errors during save are failures, never silent successes', () => {
  const workspace = application();
  for (const phase of ['read', 'write']) {
    const adapter = memoryStorage();
    const storage = createStorage(() => adapter);
    const loaded = storage.load();
    if (phase === 'read') adapter.getItem = () => { throw new DOMException('Denied', 'SecurityError'); };
    else adapter.setItem = () => { throw new DOMException('Denied', 'SecurityError'); };
    const result = storage.save(workspace, loaded.raw);
    assert.equal(result.ok, false);
    assert.match(result.error, /unavailable/);
    assert.equal(adapter.raw, null);
    assert.equal(adapter.writes, 0);
  }
});

test('optimistic save detects another tab and refuses to replace its workspace', () => {
  const adapter = memoryStorage();
  const first = createStorage(() => adapter);
  const second = createStorage(() => adapter);
  const firstLoad = first.load();
  const secondLoad = second.load();
  const secondWorkspace = application('Other tab fictional text');
  assert.equal(second.save(secondWorkspace, secondLoad.raw).ok, true);
  const result = first.save(application(), firstLoad.raw);
  assert.equal(result.ok, false);
  assert.equal(result.blocked, true);
  assert.match(result.error, /another tab/);
  assert.equal(adapter.writes, 1);
  assert.deepEqual(JSON.parse(adapter.raw), secondWorkspace);
});

test('a save requires prior load and rejects invalid work without replacing a valid workspace', () => {
  const original = application();
  const previousRaw = JSON.stringify(original);
  const adapter = memoryStorage(previousRaw);
  const storage = createStorage(() => adapter);
  assert.equal(storage.save(createWorkspace(), previousRaw).ok, false);
  const loaded = storage.load();
  const bad = mutate(original, value => { value.applications[0].sources[0].text = ''; });
  assert.equal(storage.save(bad, loaded.raw).ok, false);
  assert.equal(adapter.raw, previousRaw);
  assert.equal(adapter.writes, 0);
});
