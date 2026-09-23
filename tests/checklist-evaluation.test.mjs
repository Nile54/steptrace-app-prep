import test from 'node:test';
import assert from 'node:assert/strict';
import { createChecklist, addChecklistTask, updateChecklistTask } from '../evaluation/checklist-model.js';
import { createEvaluationServer } from '../scripts/evaluation-server.mjs';

test('manual baseline retains independent completion, review, decisions and inert notes', () => {
  let state = addChecklistTask(createChecklist(), { title: 'Fictional draft', applicability: 'applies', completed: true });
  const id = state.tasks[0].id; const before = structuredClone(state);
  state = updateChecklistTask(state, id, { review: true, note: '<img src=x onerror=alert(1)>' });
  assert.deepEqual(before.tasks[0], { id, title: 'Fictional draft', applicability: 'applies', completed: true, review: false, note: '' });
  assert.equal(state.tasks[0].completed, true); assert.equal(state.tasks[0].review, true);
  state = updateChecklistTask(state, id, { completed: false }); assert.equal(state.tasks[0].review, true);
  state = updateChecklistTask(state, id, { review: false, applicability: 'not-decided' });
  assert.equal(state.tasks[0].completed, false); assert.equal(state.tasks[0].note, '<img src=x onerror=alert(1)>');
  assert.throws(() => updateChecklistTask(state, 'missing', { review: true }), /missing/);
  assert.throws(() => updateChecklistTask(state, id, { sourceVersionId: 'invented' }), /Unsupported/);
  assert.throws(() => addChecklistTask(state, { title: '  ' }), /wording/);
});

test('evaluation server exposes exact same app files, limits assets and refuses uploads or worker caching', async t => {
  const server = createEvaluationServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const requests = ['/', '/evaluation/', '/evaluation/fixtures.js', '/evaluation/checklist.js', '/src/model.js', '/src/bootstrap.js', '/sw.js', '/docs/EVALUATION.md', '/evaluation/scoring.js', '/?private=text'];
  const responses = await Promise.all(requests.map(async path => { const response = await fetch(origin + path); return { path, status: response.status, text: await response.text() }; }));
  assert.deepEqual(responses.map(response => response.status), [200,200,200,200,200,200,404,404,404,404]);
  assert.match(responses[5].text, /STEPTRACE_DISABLE_OFFLINE = true/);
  const original = await import('node:fs/promises').then(fs => fs.readFile(new URL('../dist/src/model.js', import.meta.url), 'utf8'));
  assert.equal(responses[4].text, original);
  assert.equal((await fetch(origin, { method: 'POST', body: 'fictional-only' })).status, 405);
});
