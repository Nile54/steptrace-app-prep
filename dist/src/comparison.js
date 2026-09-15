// Deterministic comparison, deliberately without semantic guesses or fuzzy scores.
// Paragraphs are consecutive nonblank lines. All offsets refer to original UTF-16
// text, including CRLF; whitespace normalization is only a review suggestion.
const MAX_SOURCE_CHARS = 100_000;

function sourceText(value) {
  if (typeof value !== 'string') throw new TypeError('Source text must be a string.');
  if (value.length > MAX_SOURCE_CHARS) throw new RangeError('Source text exceeds 100,000 characters.');
  return value;
}

export function splitPassages(text) {
  sourceText(text);
  const passages = [];
  let lineStart = 0;
  let passageStart = null;
  let passageEnd = 0;
  function line(end) {
    if (text.slice(lineStart, end).trim()) {
      passageStart ??= lineStart;
      passageEnd = end;
    } else if (passageStart !== null) {
      passages.push({ start: passageStart, end: passageEnd, quote: text.slice(passageStart, passageEnd) });
      passageStart = null;
    }
  }
  for (const newline of text.matchAll(/\r\n|\r|\n/g)) {
    line(newline.index);
    lineStart = newline.index + newline[0].length;
  }
  line(text.length);
  if (passageStart !== null) {
    passages.push({ start: passageStart, end: passageEnd, quote: text.slice(passageStart, passageEnd) });
  }
  return passages;
}

function normalized(text) {
  return text.replace(/\s+/gu, ' ').trim();
}

function groups(passages) {
  const result = new Map();
  passages.forEach((passage, index) => {
    const key = normalized(passage.quote);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(index);
  });
  return result;
}

// Every nonblank passage appears exactly once on each side. Rows with a new
// passage follow its document order; old-only rows follow in original order.
// "changed" is a positional display pairing of leftovers, not a proven mapping.
export function compareSources(oldText, newText) {
  const oldPassages = splitPassages(oldText);
  const newPassages = splitPassages(newText);
  const oldGroups = groups(oldPassages);
  const newGroups = groups(newPassages);
  const oldUsed = new Set();
  const newUsed = new Set();
  const rows = [];
  function add(kind, oldIndex, newIndex) {
    if (oldIndex !== undefined) oldUsed.add(oldIndex);
    if (newIndex !== undefined) newUsed.add(newIndex);
    rows.push({ kind, oldIndex, newIndex });
  }

  for (const key of new Set([...oldGroups.keys(), ...newGroups.keys()])) {
    const oldIndexes = oldGroups.get(key) ?? [];
    const newIndexes = newGroups.get(key) ?? [];
    if (oldIndexes.length > 1 || newIndexes.length > 1) {
      // Even if one duplicate vanished, there is no evidence which survived.
      for (let index = 0; index < Math.max(oldIndexes.length, newIndexes.length); index++) {
        add('ambiguous', oldIndexes[index], newIndexes[index]);
      }
    } else if (oldIndexes.length === 1 && newIndexes.length === 1) {
      const oldIndex = oldIndexes[0];
      const newIndex = newIndexes[0];
      add(oldPassages[oldIndex].quote === newPassages[newIndex].quote ? 'unchanged' : 'formatting', oldIndex, newIndex);
    }
  }

  // Detect order crossings among exact matches in linear time after sorting.
  // Inserting a paragraph above an unchanged one does not label it as moved.
  const exactRows = rows.filter(row => row.kind === 'unchanged').sort((a, b) => a.oldIndex - b.oldIndex);
  let maximumBefore = -1;
  for (const row of exactRows) {
    if (row.newIndex < maximumBefore) row.kind = 'moved';
    maximumBefore = Math.max(maximumBefore, row.newIndex);
  }
  let minimumAfter = Infinity;
  for (let index = exactRows.length - 1; index >= 0; index--) {
    const row = exactRows[index];
    if (row.newIndex > minimumAfter) row.kind = 'moved';
    minimumAfter = Math.min(minimumAfter, row.newIndex);
  }

  const oldLeft = oldPassages.map((_, index) => index).filter(index => !oldUsed.has(index));
  const newLeft = newPassages.map((_, index) => index).filter(index => !newUsed.has(index));
  for (let index = 0; index < Math.max(oldLeft.length, newLeft.length); index++) {
    add(oldLeft[index] === undefined ? 'added' : newLeft[index] === undefined ? 'removed' : 'changed', oldLeft[index], newLeft[index]);
  }
  rows.sort((a, b) => (a.newIndex ?? Infinity) - (b.newIndex ?? Infinity)
    || (a.oldIndex ?? Infinity) - (b.oldIndex ?? Infinity));
  return rows.map(({ kind, oldIndex, newIndex }) => ({
    kind,
    oldExcerpt: oldIndex === undefined ? null : oldPassages[oldIndex],
    newExcerpt: newIndex === undefined ? null : newPassages[newIndex],
  }));
}

function uniqueOccurrence(text, quote) {
  const first = text.indexOf(quote);
  return first !== -1 && first === text.lastIndexOf(quote);
}

function wholeBoundary(text, index) {
  if (text[index - 1] === '\r' && text[index] === '\n') return false;
  const before = text.charCodeAt(index - 1);
  const after = text.charCodeAt(index);
  return !(before >= 0xD800 && before <= 0xDBFF && after >= 0xDC00 && after <= 0xDFFF);
}

function validAnchor(text, anchor) {
  if (!anchor || !Number.isSafeInteger(anchor.start) || !Number.isSafeInteger(anchor.end)
    || anchor.start < 0 || anchor.end <= anchor.start || anchor.end > text.length
    || typeof anchor.quote !== 'string' || !anchor.quote.trim()
    || text.slice(anchor.start, anchor.end) !== anchor.quote
    || !wholeBoundary(text, anchor.start) || !wholeBoundary(text, anchor.end)) {
    throw new TypeError('The anchor must select exact, nonblank source text at whole character and line-break boundaries.');
  }
}

// Map each normalized UTF-16 unit to its original range. This map is used only
// for a person-confirmed formatting suggestion, never to rewrite saved text.
function normalizedWithOffsets(text) {
  let value = '';
  const starts = [];
  const ends = [];
  for (let index = 0; index < text.length;) {
    if (/\s/u.test(text[index])) {
      const start = index;
      while (index < text.length && /\s/u.test(text[index])) index++;
      if (value.length && index < text.length) {
        value += ' ';
        starts.push(start);
        ends.push(index);
      }
    } else {
      value += text[index];
      starts.push(index);
      ends.push(++index);
    }
  }
  return { value, starts, ends };
}

function sameNeighbors(oldPassages, newPassages, oldPassage, newPassage) {
  const oldIndex = oldPassages.indexOf(oldPassage);
  const newIndex = newPassages.indexOf(newPassage);
  return [-1, 1].every(direction =>
    (oldPassages[oldIndex + direction]?.quote ?? null)
      === (newPassages[newIndex + direction]?.quote ?? null));
}

export function matchAnchor(oldText, newText, anchor) {
  sourceText(oldText);
  sourceText(newText);
  validAnchor(oldText, anchor);
  const result = (kind, reason, suggestedAnchor = null) => ({ kind, suggestedAnchor, reason });
  const oldPassages = splitPassages(oldText);
  const newPassages = splitPassages(newText);
  const oldPassage = oldPassages.find(passage => anchor.start >= passage.start && anchor.end <= passage.end);
  if (!oldPassage) {
    return result('unmatched', 'The selection spans paragraph boundaries. Choose a new excerpt explicitly.');
  }
  const paragraphKey = normalized(oldPassage.quote);
  const oldCandidates = oldPassages.filter(passage => normalized(passage.quote) === paragraphKey);
  const newCandidates = newPassages.filter(passage => normalized(passage.quote) === paragraphKey);
  if (oldCandidates.length > 1 || newCandidates.length > 1) {
    return result('ambiguous', 'The containing paragraph repeats, including whitespace variants. A person must identify the intended requirement.');
  }
  const quoteKey = normalized(anchor.quote);
  if (!uniqueOccurrence(normalized(oldText), quoteKey)) {
    return result('ambiguous', 'The selected phrase repeats in the old source. A person must identify the intended requirement.');
  }
  if (newCandidates.length === 0) {
    return result('unmatched', 'No unique unchanged or whitespace-only containing paragraph was found. Changed context requires a new human mapping.');
  }
  if (!uniqueOccurrence(normalized(newText), quoteKey)) {
    return result('ambiguous', 'The selected phrase is not unique in the new source. A person must identify the intended requirement.');
  }
  const newPassage = newCandidates[0];
  const contextUnchanged = sameNeighbors(oldPassages, newPassages, oldPassage, newPassage);
  const contextualReason = 'The containing paragraph matches, but an adjacent paragraph or document boundary changed. Confirm the intended requirement in its new context.';
  if (oldPassage.quote === newPassage.quote) {
    const start = newPassage.start + anchor.start - oldPassage.start;
    const end = start + anchor.quote.length;
    return result(contextUnchanged ? 'exact' : 'unmatched', contextUnchanged
      ? 'The selected phrase and its entire containing paragraph are unique and unchanged, with unchanged adjacent paragraphs or document boundaries.'
      : contextualReason,
      { start, end, quote: newText.slice(start, end) });
  }
  const mapped = normalizedWithOffsets(newPassage.quote);
  const index = mapped.value.indexOf(quoteKey);
  if (index === -1 || index !== mapped.value.lastIndexOf(quoteKey)) {
    return result('ambiguous', 'Whitespace comparison did not produce one exact candidate range. Choose a new excerpt explicitly.');
  }
  const start = newPassage.start + mapped.starts[index];
  const end = newPassage.start + mapped.ends[index + quoteKey.length - 1];
  return result(contextUnchanged ? 'formatting' : 'unmatched', contextUnchanged
    ? 'Only whitespace differs in a unique containing paragraph. Confirm the suggested excerpt; formatting is not automatically accepted.'
    : contextualReason,
    { start, end, quote: newText.slice(start, end) });
}
