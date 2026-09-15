import test from 'node:test';
import assert from 'node:assert/strict';
import { unlinkedExcerpts } from '../dist/src/review-ui.js';

test('linking an old sentence leaves a new requirement in the same paragraph visibly unlinked', () => {
  const quote = 'Write an essay. Include a transcript.';
  const passage = { start: 10, end: 10 + quote.length, quote };
  assert.deepEqual(unlinkedExcerpts(passage, [{ start: 10, end: 25 }]), [{ start: 25, end: passage.end, quote: ' Include a transcript.' }]);
});

test('overlapping exact links cover only their union; whitespace gaps do not invent requirements', () => {
  const passage = { start: 0, end: 13, quote: 'One. Two. End' };
  assert.deepEqual(unlinkedExcerpts(passage, [{ start: 0, end: 4 }, { start: 2, end: 9 }, { start: 10, end: 13 }]), []);
  assert.deepEqual(unlinkedExcerpts(passage, [null, { start: 100, end: 105 }]), [passage]);
});
