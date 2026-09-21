import test from 'node:test';
import assert from 'node:assert/strict';
import { createDependencyDemo, demoBefore, demoAfter, addDemoCondition, conditionalQuote } from '../dist/src/dependency-demo.js';
import { createWorkspace, addSourceVersion, isTaskCompleted, getTaskReviewState, getTaskDependencies, getTaskBlockers } from '../dist/src/model.js';
import { parseBackup, serializeBackup } from '../dist/src/storage.js';

test('working fictional 500→400 example preserves 380-word draft progress and isolates recommendation', () => {
  let workspace = createDependencyDemo(createWorkspace());
  const before = workspace.applications[0];
  const [essay, proofreading, recommendation] = before.tasks;
  assert.deepEqual(getTaskDependencies(before, proofreading.id), [essay.id]);
  assert.ok(before.tasks.every(isTaskCompleted));
  assert.equal(before.sources[0].text, demoBefore);
  workspace = addSourceVersion(workspace, before.id, { text: demoAfter, label: 'Fictional 400-word update' });
  const after = workspace.applications[0];
  assert.deepEqual(after.sources[0], before.sources[0]);
  after.tasks.forEach((task, index) => {
    assert.deepEqual(task.completionHistory, before.tasks[index].completionHistory);
    assert.equal(isTaskCompleted(task), true);
    assert.equal(task.applicability, 'applies');
  });
  assert.equal(getTaskReviewState(after.tasks[0]), 'needs-review');
  assert.equal(getTaskReviewState(after.tasks[1]), 'needs-review');
  assert.equal(after.tasks[1].dependencyReviews.length, 1);
  assert.notEqual(getTaskReviewState(after.tasks[2]), 'needs-review');
  assert.equal(after.tasks[2].sourceReviews[0].kind, 'exact');
  assert.deepEqual(after.tasks[2].dependencyReviews, []);
  assert.equal(after.tasks[2].id, recommendation.id);
  workspace = addDemoCondition(workspace, before.id);
  const condition = workspace.applications[0].tasks.at(-1);
  assert.equal(condition.anchor.quote, conditionalQuote);
  assert.equal(condition.applicability, 'not-decided');
  assert.equal(isTaskCompleted(condition), false);
  assert.ok(getTaskBlockers(workspace.applications[0], condition.id).length);
  assert.deepEqual(parseBackup(serializeBackup(workspace)), workspace);
  assert.throws(() => addDemoCondition(workspace, before.id), /already linked/);
});
