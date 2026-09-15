import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anchorFromSelection, selectionFromAnchor } from '../dist/src/source-selection.js';
import { createWorkspace, createApplication, createTask } from '../dist/src/model.js';
import { serializeBackup, parseBackup } from '../dist/src/storage.js';

test('A textarea selection maps to the second repeated instruction, including Unicode and mixed newlines', () => {
  const text = '🎓 Example\r\nInclude a plan.\rOther text\nInclude a plan.';
  const displayed = text.replace(/\r\n?/g, '\n');
  const start = displayed.lastIndexOf('Include a plan.');
  const anchor = anchorFromSelection(text, start, start + 'Include a plan.'.length);
  assert.equal(anchor.start, text.lastIndexOf('Include a plan.'));
  assert.equal(anchor.quote, 'Include a plan.');
  assert.deepEqual(selectionFromAnchor(text, anchor), { start, end: displayed.length });
});
test('Multiline CRLF quote and immutable source survive backup/restore with the same selection', () => {
  const text = 'One\r\nTwo\rThree\n🎓';
  const anchor = anchorFromSelection(text, 0, 7);
  assert.equal(anchor.quote, 'One\r\nTwo');
  let workspace = createApplication(createWorkspace(), { title: 'Fictional', text });
  workspace = createTask(workspace, workspace.applications[0].id, { title: 'Read both lines', anchor });
  const restored = parseBackup(serializeBackup(workspace));
  assert.equal(restored.applications[0].sources[0].text, text);
  assert.deepEqual(selectionFromAnchor(text, restored.applications[0].tasks[0].anchor), { start: 0, end: 7 });
});
test('Empty, whitespace-only, reversed, fractional, and out-of-range selections are rejected', () => {
  for (const range of [[0, 0], [0, 2], [4, 3], [-1, 3], [0, 99], [0.5, 3]]) assert.throws(() => anchorFromSelection('  text', ...range));
});
