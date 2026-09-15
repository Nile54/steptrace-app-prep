import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitPassages, compareSources, matchAnchor } from '../dist/src/comparison.js';

function anchor(text, quote, occurrence = 0) {
  let start = -1;
  for (let index = 0; index <= occurrence; index++) start = text.indexOf(quote, start + 1);
  assert.notEqual(start, -1);
  return { start, end: start + quote.length, quote };
}

function coversEveryPassage(oldText, newText, rows = compareSources(oldText, newText)) {
  for (const [side, text] of [['oldExcerpt', oldText], ['newExcerpt', newText]]) {
    const excerpts = rows.map(row => row[side]).filter(Boolean).sort((a, b) => a.start - b.start);
    assert.deepEqual(excerpts, splitPassages(text));
    for (const excerpt of excerpts) assert.equal(text.slice(excerpt.start, excerpt.end), excerpt.quote);
  }
}

test('Passages preserve exact indentation, Unicode, CRLF and CR offsets while separating blank lines', () => {
  const text = '\r\n  🎓 Fictional award\r\nInclude a plan.  \r\n \t\r\nSecond requirement.\r\rThird.\n';
  const passages = splitPassages(text);
  assert.deepEqual(passages.map(item => item.quote), ['  🎓 Fictional award\r\nInclude a plan.  ', 'Second requirement.', 'Third.']);
  for (const passage of passages) assert.equal(text.slice(passage.start, passage.end), passage.quote);
  assert.deepEqual(splitPassages(' \r\n\t\n'), []);
});

test('Unchanged unique paragraph automatically matches its exact selected range', () => {
  const text = 'Fictional award.\n\nWrite a 500-word essay about your studies.';
  const selected = anchor(text, '500-word essay');
  const match = matchAnchor(text, text, selected);
  assert.equal(match.kind, 'exact');
  assert.deepEqual(match.suggestedAnchor, selected);
  assert.deepEqual(compareSources(text, text).map(row => row.kind), ['unchanged', 'unchanged']);
});

test('Paragraph moves expose order crossings but changed neighbors require a human mapping', () => {
  const oldText = 'Write an essay.\n\nInclude a study plan.\n\nSend a transcript.';
  const newText = 'Send a transcript.\n\nWrite an essay.\n\nInclude a study plan.';
  const match = matchAnchor(oldText, newText, anchor(oldText, 'Include a study plan.'));
  assert.equal(match.kind, 'unmatched');
  assert.deepEqual(match.suggestedAnchor, anchor(newText, 'Include a study plan.'));
  assert.match(match.reason, /adjacent paragraph/);
  assert.ok(compareSources(oldText, newText).every(row => row.kind === 'moved'));
  coversEveryPassage(oldText, newText);
});

test('A paragraph moving together with unchanged neighbors can retain an exact range mapping', () => {
  const oldText = 'Fictional introduction.\n\nStudy instructions.\n\nInclude a study plan.\n\nStudy guidance.\n\nContact details.';
  const newText = 'Fictional introduction.\n\nContact details.\n\nStudy instructions.\n\nInclude a study plan.\n\nStudy guidance.';
  const match = matchAnchor(oldText, newText, anchor(oldText, 'Include a study plan.'));
  assert.equal(match.kind, 'exact');
  assert.deepEqual(match.suggestedAnchor, anchor(newText, 'Include a study plan.'));
});

test('Changed separate eligibility headings never automatically confirm an unchanged requirement', () => {
  const oldText = 'Part-time applicants:\n\nInclude a study plan.';
  const newText = 'Full-time applicants:\n\nInclude a study plan.';
  for (const quote of ['Include a study plan.', 'study plan']) {
    const match = matchAnchor(oldText, newText, anchor(oldText, quote));
    assert.equal(match.kind, 'unmatched');
    assert.deepEqual(match.suggestedAnchor, anchor(newText, quote));
    assert.match(match.reason, /new context/);
  }
  assert.equal(compareSources(oldText, newText).find(row => row.newExcerpt.quote === 'Include a study plan.').kind, 'unchanged');
});

test('Changed following instructions and newly adjacent material also require contextual review', () => {
  for (const [oldText, newText] of [
    ['Include a plan.\n\nOnly for part-time applicants.', 'Include a plan.\n\nOnly for full-time applicants.'],
    ['Include a plan.', 'Full-time applicants:\n\nInclude a plan.'],
    ['Include a plan.', 'Include a plan.\n\nOptional for full-time applicants.'],
  ]) {
    const match = matchAnchor(oldText, newText, anchor(oldText, 'Include a plan.'));
    assert.equal(match.kind, 'unmatched');
    assert.deepEqual(match.suggestedAnchor, anchor(newText, 'Include a plan.'));
  }
});

test('Added paragraphs do not falsely mark the existing unchanged paragraphs as moved', () => {
  const oldText = 'Write an essay.\n\nInclude a plan.';
  const newText = 'Fictional updated instructions.\n\nWrite an essay.\n\nInclude a plan.';
  assert.deepEqual(compareSources(oldText, newText).map(row => row.kind), ['added', 'unchanged', 'unchanged']);
  coversEveryPassage(oldText, newText);
});

test('Whitespace and line-ending changes suggest original new text but require confirmation', () => {
  const oldText = 'Write a 500-word essay.\r\nInclude your study goals.';
  const newText = '  Write a  500-word essay.\nInclude your study goals.  ';
  const match = matchAnchor(oldText, newText, anchor(oldText, '500-word essay.\r\nInclude your study goals.'));
  assert.equal(match.kind, 'formatting');
  assert.equal(match.suggestedAnchor.quote, '500-word essay.\nInclude your study goals.');
  assert.equal(newText.slice(match.suggestedAnchor.start, match.suggestedAnchor.end), match.suggestedAnchor.quote);
  assert.equal(compareSources(oldText, newText)[0].kind, 'formatting');
});

test('Duplicate phrases in distinct paragraphs never automatically transfer confirmation', () => {
  const oldText = 'Part-time applicants: Include a plan.\n\nFull-time applicants: Include a plan.';
  const newText = 'Part-time applicants: Include a plan.';
  for (const occurrence of [0, 1]) {
    const match = matchAnchor(oldText, newText, anchor(oldText, 'Include a plan.', occurrence));
    assert.equal(match.kind, 'ambiguous');
    assert.equal(match.suggestedAnchor, null);
  }
});

test('Removing one identical duplicate paragraph leaves both old occurrences ambiguous', () => {
  const oldText = 'Include a plan.\n\nInclude a plan.';
  const newText = 'Include a plan.';
  assert.equal(matchAnchor(oldText, newText, anchor(oldText, 'Include a plan.', 1)).kind, 'ambiguous');
  const rows = compareSources(oldText, newText);
  assert.deepEqual(rows.map(row => row.kind), ['ambiguous', 'ambiguous']);
  assert.equal(rows.filter(row => row.newExcerpt).length, 1);
  coversEveryPassage(oldText, newText, rows);
});

test('Whitespace variants of repeated paragraphs and phrases remain ambiguous', () => {
  const oldText = 'Include a plan.\n\nInclude  a plan.';
  const newText = 'Include a plan.';
  assert.equal(matchAnchor(oldText, newText, anchor(oldText, 'Include a plan.')).kind, 'ambiguous');
  assert.ok(compareSources(oldText, newText).every(row => row.kind === 'ambiguous'));
  const contexts = 'Part-time: Include a plan.\n\nFull-time: Include  a plan.';
  assert.equal(matchAnchor(contexts, contexts, anchor(contexts, 'Include a plan.')).kind, 'ambiguous');
});

test('A newly duplicated phrase blocks automatic matching even when the old paragraph is unchanged', () => {
  const oldText = 'Part-time applicants: Include a plan.';
  const newText = `${oldText}\n\nFull-time applicants: Include a plan.`;
  assert.equal(matchAnchor(oldText, newText, anchor(oldText, 'Include a plan.')).kind, 'ambiguous');
});

test('Changed numbers and negation never become formatting or exact matches', () => {
  for (const [oldText, newText, selected] of [
    ['Write a 500-word essay.', 'Write a 400-word essay.', 'Write a 500-word essay.'],
    ['You must include a transcript.', 'You must not include a transcript.', 'include a transcript.'],
    ['If studying part-time, include a plan.', 'If studying full-time, include a plan.', 'include a plan.'],
  ]) {
    const match = matchAnchor(oldText, newText, anchor(oldText, selected));
    assert.equal(match.kind, 'unmatched');
    assert.equal(match.suggestedAnchor, null);
    assert.equal(compareSources(oldText, newText)[0].kind, 'changed');
    coversEveryPassage(oldText, newText);
  }
});

test('Added and removed requirements remain visible, including completely empty sides', () => {
  const oldText = 'Write an essay.\n\nSend a transcript.';
  const newText = 'Write an essay.';
  assert.deepEqual(compareSources(oldText, newText).map(row => row.kind), ['unchanged', 'removed']);
  assert.deepEqual(compareSources(newText, oldText).map(row => row.kind), ['unchanged', 'added']);
  assert.ok(compareSources(oldText, '').every(row => row.kind === 'removed'));
  assert.ok(compareSources('', oldText).every(row => row.kind === 'added'));
  assert.deepEqual(compareSources('', ''), []);
  coversEveryPassage(oldText, newText);
});

test('Unrelated leftovers use visible positional candidate pairs without automatic anchor matches', () => {
  const oldText = 'Old fictional requirement.\n\nRetained passage.\n\nAnother old requirement.';
  const newText = 'Retained passage.\n\nUnrelated new requirement.';
  const rows = compareSources(oldText, newText);
  assert.deepEqual(rows.map(row => row.kind), ['unchanged', 'changed', 'removed']);
  assert.equal(matchAnchor(oldText, newText, anchor(oldText, 'Old fictional requirement.')).kind, 'unmatched');
  coversEveryPassage(oldText, newText, rows);
});

test('Selections across paragraphs conservatively require a human mapping', () => {
  const text = 'First instruction.\n\nSecond instruction.';
  const match = matchAnchor(text, text, anchor(text, text));
  assert.equal(match.kind, 'unmatched');
  assert.equal(match.suggestedAnchor, null);
});

test('Unicode and CRLF offsets survive a moved candidate without splitting characters', () => {
  const oldText = '🎓 Fictional award.\r\n\r\nWrite an essay 📝 about goals.\r\nExplain your plans.';
  const newText = 'Write an essay 📝 about goals.\r\nExplain your plans.\r\n\r\n🎓 Fictional award.';
  const quote = '📝 about goals.\r\nExplain';
  const match = matchAnchor(oldText, newText, anchor(oldText, quote));
  assert.equal(match.kind, 'unmatched');
  assert.deepEqual(match.suggestedAnchor, anchor(newText, quote));
});

test('Malformed anchors, split character/newline boundaries, and oversized sources fail clearly', () => {
  const text = '🎓\r\nFictional.';
  for (const selected of [
    { start: 0, end: 1, quote: text.slice(0, 1) },
    { start: 3, end: text.length, quote: text.slice(3) },
    { start: 0, end: 2, quote: 'wrong' },
    { start: -1, end: 2, quote: '🎓' },
  ]) assert.throws(() => matchAnchor(text, text, selected), /anchor/);
  assert.throws(() => splitPassages('x'.repeat(100_001)), /100,000/);
  assert.throws(() => compareSources(null, ''), /string/);
});

test('Large fictional input has deterministic complete coverage without a quadratic diff matrix', () => {
  const oldText = Array.from({ length: 2_000 }, (_, index) => `Fictional requirement ${index}.`).join('\n\n');
  const newText = splitPassages(oldText).map(item => item.quote).reverse().join('\n\n');
  const first = compareSources(oldText, newText);
  assert.deepEqual(compareSources(oldText, newText), first);
  assert.equal(first.length, 2_000);
  coversEveryPassage(oldText, newText, first);
});
