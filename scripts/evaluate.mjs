import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { briefs, stressBriefs, unresolvedScenarios } from '../evaluation/fixtures.js';
import { scoreReviewSelection } from '../evaluation/scoring.js';
import { createChecklist, addChecklistTask, updateChecklistTask } from '../evaluation/checklist-model.js';
import { createWorkspace, createApplication, createTask, updateTask, setTaskDependencies,
  addSourceVersion, getTaskReviewState, getTaskAnchor, getTaskBlockers, isTaskCompleted } from '../dist/src/model.js';
import { createStorage, serializeBackup, parseBackup, mergeWorkspaces, STORAGE_KEY } from '../dist/src/storage.js';

export function excerpt(text, quote) {
  const start = text.indexOf(quote);
  assert.notEqual(start, -1, 'Fixture quote must exist; repeated stress quotes deliberately select the first occurrence.');
  return { start, end: start + quote.length, quote };
}

export function prepareScenario(brief) {
  let workspace = createApplication(createWorkspace(), { title: brief.title, text: brief.initialText, label: brief.initialLabel || 'Fictional original' });
  const applicationId = workspace.applications[0].id;
  const ids = {};
  const setupDomainActions = { createApplication: 1, createTask: 0, recordCompletion: 0, confirmDependencySelection: 0 };
  for (const spec of brief.taskSpecs) {
    workspace = createTask(workspace, applicationId, { title: spec.title, applicability: spec.applicability,
      anchor: spec.quote ? excerpt(brief.initialText, spec.quote) : null });
    ids[spec.key] = workspace.applications[0].tasks.at(-1).id;
    setupDomainActions.createTask++;
    if (spec.completed) {
      workspace = updateTask(workspace, applicationId, ids[spec.key], { completed: true });
      setupDomainActions.recordCompletion++;
    }
  }
  for (const spec of brief.taskSpecs) if (spec.dependsOn.length) {
    workspace = setTaskDependencies(workspace, applicationId, ids[spec.key], spec.dependsOn.map(key => ids[key]));
    setupDomainActions.confirmDependencySelection++;
  }
  return { workspace, applicationId, ids, setupDomainActions };
}

export function advanceScenario(brief, prepared) {
  let workspace = addSourceVersion(prepared.workspace, prepared.applicationId,
    { text: brief.updatedText, label: brief.updatedLabel || 'Fictional update' });
  const ids = { ...prepared.ids };
  for (const spec of brief.addedTaskSpecs) {
    workspace = createTask(workspace, prepared.applicationId, { title: spec.title, applicability: spec.applicability,
      anchor: spec.quote ? excerpt(brief.updatedText, spec.quote) : null });
    ids[spec.key] = workspace.applications[0].tasks.at(-1).id;
  }
  return { ...prepared, workspace, ids };
}

export function evaluateScenario(brief) {
  const before = prepareScenario(brief);
  const after = advanceScenario(brief, before);
  const app = after.workspace.applications[0];
  const byKey = key => app.tasks.find(task => task.id === after.ids[key]);
  const selectedKeys = brief.taskSpecs.filter(spec => getTaskReviewState(byKey(spec.key)) === 'needs-review').map(spec => spec.key);
  for (const spec of brief.taskSpecs) {
    const original = before.workspace.applications[0].tasks.find(task => task.id === before.ids[spec.key]);
    assert.deepEqual(byKey(spec.key).completionHistory, original.completionHistory);
    assert.equal(isTaskCompleted(byKey(spec.key)), spec.completed);
    if (spec.quote) {
      const anchor = getTaskAnchor(byKey(spec.key), app.sources[0].id);
      assert.equal(app.sources[0].text.slice(anchor.start, anchor.end), spec.quote);
    }
  }
  for (const key of brief.expectedUndecidedKeys) {
    assert.equal(byKey(key).applicability, 'not-decided');
    assert.ok(getTaskBlockers(app, byKey(key).id).some(reason => reason.kind === 'applicability'));
  }
  const backup = serializeBackup(after.workspace);
  assert.deepEqual(parseBackup(backup), after.workspace);
  assert.deepEqual(mergeWorkspaces(createWorkspace(), parseBackup(backup)), after.workspace);
  let stored = null;
  const adapter = { getItem(key) { assert.equal(key, STORAGE_KEY); return stored; },
    setItem(key, value) { assert.equal(key, STORAGE_KEY); stored = value; } };
  const storage = createStorage(() => adapter);
  const opened = storage.load();
  assert.equal(storage.save(after.workspace, opened.raw).ok, true);
  assert.deepEqual(createStorage(() => adapter).load().workspace, after.workspace);
  adapter.setItem = () => { throw new DOMException('Fictional quota fault', 'QuotaExceededError'); };
  const savedBytes = stored;
  assert.equal(storage.save(after.workspace, savedBytes).ok, false);
  assert.equal(stored, savedBytes);
  let checklist = createChecklist();
  const baselineSetupDomainActions = { createChecklist: 1, addChecklistTask: 0, recordCompletion: 0 };
  for (const spec of brief.taskSpecs) {
    checklist = addChecklistTask(checklist, { title: spec.title, applicability: spec.applicability });
    baselineSetupDomainActions.addChecklistTask++;
    if (spec.completed) {
      checklist = updateChecklistTask(checklist, checklist.tasks.at(-1).id, { completed: true });
      baselineSetupDomainActions.recordCompletion++;
    }
  }
  // No source text goes into this ordinary checklist engine. Revealing a new
  // brief cannot itself change a task; a participant must choose edits/reviews.
  assert.equal(checklist.tasks.filter(task => task.review).length, 0);
  assert.deepEqual(checklist.tasks.map(task => task.completed), brief.taskSpecs.map(spec => spec.completed));
  return {
    briefId: brief.id,
    stepTraceAutomaticReview: scoreReviewSelection({ taskKeys: brief.taskSpecs.map(spec => spec.key), expectedAffectedKeys: brief.expectedAffectedKeys, selectedKeys }),
    checklistAutomaticReview: { automaticReviewSupported: false, automaticFlagCount: 0,
      interpretation: 'The simple checklist requires a person to choose review tasks. Zero automatic flags are not a measured human miss rate.' },
    setupDomainActions: before.setupDomainActions, baselineSetupDomainActions,
    checks: { completionHistoryPreserved: true, originalExactSourceLookup: true, unknownDecisionsRetained: true, exportImport: true, storageReload: true, failedSaveNotSuccessful: true },
  };
}

export function checkUnresolvedScenario(scenario) {
  const base = briefs[0];
  const fixture = { ...base, initialText: scenario.initialText, updatedText: scenario.updatedText, addedTaskSpecs: [] };
  const before = prepareScenario(fixture);
  const after = advanceScenario(fixture, before);
  const app = after.workspace.applications[0];
  const task = app.tasks.find(item => item.id === after.ids[scenario.taskKey]);
  assert.equal(task.applicability, 'not-decided');
  assert.equal(getTaskReviewState(task), 'needs-review');
  assert.ok(task.sourceReviews.some(review => review.kind !== 'exact' && review.resolution === null));
  const blockers = getTaskBlockers(app, task.id);
  assert.ok(blockers.some(item => item.kind === 'applicability'));
  assert.ok(blockers.some(item => item.kind === 'review'));
  assert.deepEqual(parseBackup(serializeBackup(after.workspace)), after.workspace);
  return { id: scenario.id, humanDecision: 'not-decided', sourceReview: 'open', guessedPrecedence: false, exportImport: true };
}

export async function runEvaluation() {
  // Fingerprint both interfaces, the server/launcher, model, fixtures and tests.
  // Workspaces/reports and participant records are deliberately not inputs.
  const files = ['package.json', 'run.sh'];
  for (const directory of ['dist', 'evaluation', 'scripts', 'tests']) {
    const entries = await readdir(new URL(`../${directory}/`, import.meta.url), { recursive: true });
    files.push(...entries.filter(file => /\.(?:js|mjs|html|css|txt)$/.test(file)).map(file => `${directory}/${file}`));
  }
  files.sort();
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(await readFile(new URL(`../${file}`, import.meta.url))).update('\0');
  return {
    evidenceType: 'synthetic engineering correctness only', protocolVersion: 1,
    testedVersion: { gitRevision: process.env.STEPTRACE_TESTED_REVISION || null, engineeringFilesSha256: hash.digest('hex'), files },
    humanEvaluation: { status: 'pending', consentedParticipantCount: 0, sourceLookupSeconds: null, setupSeconds: null, setupErrors: null, comprehensionScore: null },
    matchedBriefs: briefs.map(evaluateScenario), conservativeMatchingStress: stressBriefs.map(evaluateScenario),
    unresolvedConditionsAndConflicts: unresolvedScenarios.map(checkUnresolvedScenario),
    limits: ['Domain action counts are scripted API operations, not clicks, timing or participant effort.',
      'Automatic flags are not participant outcomes or evidence of accessibility benefit, usefulness or market demand.',
      'The fixture oracle is authored for these fictional exercises; the app does not infer semantic affectedness.',
      'No human performance comparison is available. A checklist may require less setup and may perform better.'],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--backups')) throw new Error('Usage: node scripts/evaluate.mjs [--backups directory]');
  if (args[0] === '--backups') {
    const directory = resolve(args[1]);
    await mkdir(directory, { recursive: true });
    for (const brief of briefs) {
      const before = prepareScenario(brief);
      const after = advanceScenario(brief, before);
      // Exclusive writes protect an earlier synthetic export or user file.
      await writeFile(resolve(directory, `${brief.id}-before.json`), serializeBackup(before.workspace), { flag: 'wx' });
      await writeFile(resolve(directory, `${brief.id}-after.json`), serializeBackup(after.workspace), { flag: 'wx' });
    }
  }
  console.log(JSON.stringify(await runEvaluation(), null, 2));
}
