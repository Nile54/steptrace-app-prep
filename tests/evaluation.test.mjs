import test from 'node:test';
import assert from 'node:assert/strict';
import { briefs, stressBriefs, unresolvedScenarios, assignments } from '../evaluation/fixtures.js';
import { scoreReviewSelection } from '../evaluation/scoring.js';
import { evaluateScenario, prepareScenario, advanceScenario, checkUnresolvedScenario } from '../scripts/evaluate.mjs';
import { getTaskAnchor, getTaskBlockers, updateTask, resolveSourceReview } from '../dist/src/model.js';
import { parseBackup, serializeBackup } from '../dist/src/storage.js';

test('matched fictional briefs have equal task/dependency/decision complexity and counterbalanced assignments', () => {
  const structure = brief => brief.taskSpecs.map(({ key, quote, applicability, completed, dependsOn }) => ({ key, linked: quote !== null, applicability, completed, dependsOn }));
  assert.deepEqual(structure(briefs[0]), structure(briefs[1]));
  assert.equal(briefs[0].initialText.split('\n\n').length, briefs[1].initialText.split('\n\n').length);
  assert.deepEqual(briefs[0].expectedAffectedKeys, ['draft', 'proofread', 'package']);
  for (const interfaceName of ['StepTrace', 'Checklist']) for (const brief of ['A', 'B']) for (const period of [0, 1]) {
    assert.equal(assignments.filter(assignment => assignment.periods[period].interface === interfaceName && assignment.periods[period].brief === brief).length, 1);
  }
});

test('independent scorer counts missed and unnecessary choices without overlap, and rejects malformed observations', () => {
  const input = { taskKeys: ['draft', 'proofread', 'recommendation'], expectedAffectedKeys: ['draft', 'proofread'], selectedKeys: ['draft', 'recommendation'] };
  const scored = scoreReviewSelection(input);
  assert.deepEqual(scored.missedAffectedKeys, ['proofread']);
  assert.deepEqual(scored.unnecessaryReviewKeys, ['recommendation']);
  assert.equal(scored.missedAffectedCount, 1);
  assert.equal(scored.unnecessaryReviewCount, 1);
  assert.deepEqual(scoreReviewSelection({ ...input, selectedKeys: [] }).missedAffectedKeys, ['draft', 'proofread']);
  assert.equal(scoreReviewSelection({ ...input, selectedKeys: ['draft', 'proofread'] }).unnecessaryReviewCount, 0);
  assert.throws(() => scoreReviewSelection({ ...input, selectedKeys: ['unknown'] }), /Unknown/);
  assert.throws(() => scoreReviewSelection({ ...input, selectedKeys: ['draft', 'draft'] }), /repeat/);
  assert.throws(() => scoreReviewSelection({ ...input, expectedAffectedKeys: ['unknown'] }), /Unknown/);
});

for (const brief of briefs) test(`brief ${brief.id}: actual model/storage integration retains histories and flags only oracle affected tasks`, () => {
  const result = evaluateScenario(brief);
  assert.equal(result.stepTraceAutomaticReview.missedAffectedCount, 0);
  assert.equal(result.stepTraceAutomaticReview.unnecessaryReviewCount, 0);
  assert.deepEqual(result.stepTraceAutomaticReview.correctlySelectedKeys, ['draft', 'proofread', 'package']);
  assert.deepEqual(result.setupDomainActions, { createApplication: 1, createTask: 6, recordCompletion: 4, confirmDependencySelection: 2 });
});

for (const brief of stressBriefs) test(`${brief.id}: conservative burden is reported as an extra review, not hidden from the oracle`, () => {
  const result = evaluateScenario(brief).stepTraceAutomaticReview;
  assert.equal(result.missedAffectedCount, 0);
  assert.deepEqual(result.unnecessaryReviewKeys, ['recommendation']);
  assert.equal(result.unnecessaryReviewCount, 1);
});

for (const scenario of unresolvedScenarios) test(`${scenario.id}: unresolved human choice and review survive save/restore without app precedence`, () => {
  assert.equal(checkUnresolvedScenario(scenario).sourceReview, 'open');
});

test('only an explicit person choice changes unknown applicability; acknowledging a mapping does not settle a conflict', () => {
  const brief = briefs[0];
  const prepared = prepareScenario(brief);
  let workspace = updateTask(prepared.workspace, prepared.applicationId, prepared.ids.staticCondition, { applicability: 'does-not-apply' });
  let app = workspace.applications[0];
  assert.equal(app.tasks.find(task => task.id === prepared.ids.staticCondition).applicability, 'does-not-apply');
  assert.equal(app.tasks.find(task => task.id === prepared.ids.conflict).applicability, 'not-decided');
  assert.ok(getTaskBlockers(app, prepared.ids.conflict).some(reason => reason.kind === 'applicability'));
  const scenario = unresolvedScenarios.find(item => item.id === 'labeled-conflict-update');
  const changed = advanceScenario({ ...brief, updatedText: scenario.updatedText, addedTaskSpecs: [] }, { ...prepared, workspace });
  app = changed.workspace.applications[0];
  const task = app.tasks.find(item => item.id === prepared.ids.conflict);
  const quote = scenario.updatedText.split('\n\n').find(text => text.startsWith('Portal checklist:'));
  const start = scenario.updatedText.indexOf(quote);
  workspace = resolveSourceReview(changed.workspace, prepared.applicationId, task.id, task.sourceReviews[0].id,
    { anchor: { start, end: start + quote.length, quote }, applicability: 'not-decided', note: 'Both labeled instructions are present; awaiting clarification.' });
  app = workspace.applications[0];
  assert.equal(app.tasks.find(item => item.id === task.id).applicability, 'not-decided');
  assert.ok(getTaskBlockers(app, task.id).some(reason => reason.kind === 'applicability'));
  assert.deepEqual(parseBackup(serializeBackup(workspace)), workspace);
});

test('source lookup returns the exact original and current recommendation quote after round trip', () => {
  for (const brief of briefs) {
    const updated = advanceScenario(brief, prepareScenario(brief));
    const app = parseBackup(serializeBackup(updated.workspace)).applications[0];
    const task = app.tasks.find(item => item.id === updated.ids[brief.sourceLookup.taskKey]);
    for (const source of app.sources) {
      const anchor = getTaskAnchor(task, source.id);
      assert.equal(anchor.sourceVersionId, source.id);
      assert.equal(anchor.quote, brief.sourceLookup.quote);
      assert.equal(source.text.slice(anchor.start, anchor.end), brief.sourceLookup.quote);
    }
  }
});
