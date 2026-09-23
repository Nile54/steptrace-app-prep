import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { passages, tasks, changePreview } from '../dist/src/demo.js';

const evaluationScripts = (await readdir(new URL('../evaluation/', import.meta.url))).filter(file => file.endsWith('.js')).map(file => `evaluation/${file}`);
for (const file of [...(await readdir(new URL('../dist/src/', import.meta.url))).filter(file => file.endsWith('.js')).map(file => `dist/src/${file}`), ...evaluationScripts, 'dist/sw.js', 'scripts/serve.mjs', 'scripts/check.mjs', 'scripts/evaluate.mjs', 'scripts/evaluation-server.mjs', 'tests/browser-server.mjs', 'tests/accessibility-server.mjs', 'tests/accessibility-diagnostics.js', 'tests/service-worker-diagnostics.js']) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
for (const file of ['dist/index.html', 'dist/styles.css', 'evaluation/index.html', 'evaluation/styles.css']) {
  assert.ok((await readFile(new URL(`../${file}`, import.meta.url), 'utf8')).length > 0);
}
assert.equal(new Set(passages.map(p => p.id)).size, passages.length, 'Source IDs must be unique.');
assert.equal(new Set(tasks.map(t => t.id)).size, tasks.length, 'Task IDs must be unique.');
for (const task of tasks) {
  assert.ok(passages.some(p => p.id === task.sourceId), `${task.title} needs an exact source target.`);
  assert.ok(task.completedAt, 'Every sample completion must retain its date.');
}
assert.equal(changePreview.before, passages.find(p => p.id === 'essay').text);
assert.equal(changePreview.after, changePreview.before.replace('500', '400'));
assert.deepEqual(Object.keys(changePreview.reasons).sort(), ['draft', 'proofread']);
console.log('PASS: JavaScript syntax, required assets, source links, and fictional change fixture.');
const tests = spawnSync(process.execPath, ['--test', ...(await readdir(new URL('../tests/', import.meta.url))).filter(file => file.endsWith('.test.mjs')).map(file => `tests/${file}`)], { cwd: new URL('../', import.meta.url), stdio: 'inherit' });
assert.equal(tests.status, 0, 'Project tests must pass.');
console.log('Browser checks are separate: follow docs/CHECKS.md. Dependency and work-change checks are included.');
