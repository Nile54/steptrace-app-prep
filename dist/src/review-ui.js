import { compareSources } from './comparison.js';
import { getTaskAnchor } from './model.js';
import { anchorFromSelection, selectionFromAnchor } from './source-selection.js';

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}
const applicabilityLabels = { 'not-decided': 'Not decided', applies: 'Applies', 'does-not-apply': 'Does not apply' };
const kindLabels = { unchanged: 'Unchanged text', moved: 'Moved exact text', formatting: 'Formatting differs — confirm', changed: 'Changed or replaced — inspect both', removed: 'Removed text', added: 'Added text', ambiguous: 'Repeated text — ambiguous', exact: 'Exact source match', unmatched: 'Source changed or missing', unresolved: 'Earlier source mapping was unresolved' };
const versionNumber = (application, sourceId) => application.sources.findIndex(source => source.id === sourceId) + 1;
function excerpt(label, text) {
  const box = node('div'); box.append(node('p', label, 'comparison-label'), node('blockquote', text ?? 'No passage in this column.', 'diff-quote')); return box;
}

// Exact span subtraction keeps new, unlinked text visible even when a task links
// only one sentence of a longer paragraph. Whitespace alone is not a requirement.
export function unlinkedExcerpts(passage, anchors) {
  const ranges = anchors.filter(Boolean).map(anchor => ({ start: Math.max(passage.start, anchor.start), end: Math.min(passage.end, anchor.end) }))
    .filter(range => range.end > range.start).sort((a, b) => a.start - b.start);
  const result = []; let cursor = passage.start;
  function keep(start, end) { const quote = passage.quote.slice(start - passage.start, end - passage.start); if (quote.trim()) result.push({ start, end, quote }); }
  for (const range of ranges) { if (range.start > cursor) keep(cursor, range.start); cursor = Math.max(cursor, range.end); }
  if (cursor < passage.end) keep(cursor, passage.end);
  return result;
}

// Differences are display aids. A linked excerpt never proves a whole passage is covered.
export function renderComparison(container, before, after, application = null) {
  const rows = compareSources(before.text, after.text);
  container.replaceChildren();
  container.append(node('p', `${rows.length} passage comparison(s). Original whitespace is retained in the source snapshots. No checklist completeness is inferred.`, 'helper'));
  if (before.text !== after.text && before.text.replace(/\s+/gu, ' ').trim() === after.text.replace(/\s+/gu, ' ').trim()) container.append(node('p', 'Whitespace differs between these versions. Paragraph rows omit blank-line separators; use the saved source snapshots to inspect the original layout.', 'helper'));
  for (const row of rows) {
    const anchors = application ? application.tasks.map(task => getTaskAnchor(task, after.id)).filter(Boolean) : [];
    const unlinked = row.newExcerpt && application ? unlinkedExcerpts(row.newExcerpt, anchors) : [];
    const entry = node('details', undefined, `diff-row diff-${row.kind}`);
    entry.open = unlinked.length > 0 || !['unchanged', 'moved'].includes(row.kind);
    entry.append(node('summary', `${kindLabels[row.kind]}${unlinked.length ? ' · Unreviewed material' : ''}`));
    const columns = node('div', undefined, 'comparison');
    columns.append(excerpt(`Before · ${before.label}`, row.oldExcerpt?.quote), excerpt(`After · ${after.label}`, row.newExcerpt?.quote)); entry.append(columns);
    if (row.newExcerpt && application) {
      const linkedTasks = anchors.filter(anchor => anchor.start < row.newExcerpt.end && anchor.end > row.newExcerpt.start);
      entry.append(node('p', linkedTasks.length
        ? `${linkedTasks.length} task excerpt(s) overlap this passage. This does not establish complete coverage or resolve unrelated review.`
        : 'Unreviewed material: no confirmed task link overlaps this passage in this version. Read it and decide whether to add a task.', linkedTasks.length ? 'helper' : 'unreviewed-material'));
      if (unlinked.length) {
        const remaining = node('section', undefined, 'unreviewed-material');
        remaining.append(node('p', 'Text without a confirmed task link remains unreviewed:'));
        for (const span of unlinked) remaining.append(node('blockquote', span.quote, 'diff-quote'));
        entry.append(remaining);
      }
    }
    container.append(entry);
  }
}

export function renderTaskReviews(task, application, { onResolve, report, reportError }) {
  const details = node('details', undefined, 'source-reviews');
  const pending = task.sourceReviews.filter(review => review.kind !== 'exact' && !review.resolution).length;
  details.append(node('summary', `Source reviews · ${pending} need review · ${task.sourceReviews.length} version record(s)`));
  details.open = pending > 0;
  for (const review of [...task.sourceReviews].reverse()) {
    const source = application.sources.find(source => source.id === review.sourceVersionId);
    const number = versionNumber(application, source.id);
    const record = node('details', undefined, 'version-review');
    record.dataset.reviewId = review.id;
    record.open = review.kind !== 'exact' && !review.resolution;
    const status = review.resolution ? 'Resolution recorded' : review.kind === 'exact' ? 'Automatically matched' : 'Needs review';
    record.append(node('summary', `Version ${number} · ${status}`), node('p', `${kindLabels[review.kind]}: ${review.reason}`, 'helper'));
    const columns = node('div', undefined, 'comparison');
    columns.append(excerpt(`Earlier linked excerpt · version ${versionNumber(application, review.basisAnchor.sourceVersionId)}`, review.basisAnchor.quote), excerpt(`Version ${number} · ${review.resolution ? 'confirmed excerpt' : 'candidate only'}`, review.resolution ? review.resolution.anchor?.quote : review.suggestedAnchor?.quote)); record.append(columns);
    if (review.resolution) {
      record.append(node('p', `Recorded ${new Date(review.resolution.at).toLocaleString()} · Applicability for version ${number}: ${applicabilityLabels[review.resolution.applicability]}.`, 'helper'));
      if (!review.resolution.anchor) record.append(node('p', 'Kept the task without a source mapping for this version. Its original source and completion history remain.', 'no-source-label'));
      if (review.resolution.note) record.append(node('p', review.resolution.note, 'resolution-note'));
    } else if (review.kind !== 'exact') {
      const form = node('form'); form.setAttribute('aria-label', `Resolve version ${number} for ${task.title}`);
      const textareaId = `review-source-${review.id}`;
      const sourceLabel = node('label', `Version ${number} instructions — select the matching passage`); sourceLabel.htmlFor = textareaId;
      const sourceInput = node('textarea'); sourceInput.id = textareaId; sourceInput.value = source.text; sourceInput.readOnly = true; sourceInput.rows = 6; sourceInput.className = 'review-snapshot';
      form.append(sourceLabel, sourceInput, node('p', 'Inspect the full context. Select a passage with a pointer or Shift + arrow keys, then use the selection. A candidate is not confirmed until you record your resolution.', 'helper'));
      let chosen; // undefined: no decision yet; null: explicit no-mapping choice.
      const choiceText = node('blockquote', 'No mapping chosen yet.', 'chosen-mapping'); choiceText.setAttribute('aria-live', 'polite');
      const buttons = node('div', undefined, 'button-row');
      function choose(anchor) { chosen = anchor; choiceText.textContent = anchor ? anchor.quote : 'No source mapping for this version. Explain your decision below.'; noteInput.required = anchor === null; }
      const useSelection = node('button', 'Use selected passage', 'secondary'); useSelection.type = 'button';
      useSelection.addEventListener('click', () => { try { choose(anchorFromSelection(source.text, sourceInput.selectionStart, sourceInput.selectionEnd)); report(`Mapping selected for version ${number}. Confirm applicability and record the resolution.`); } catch (error) { reportError(error); } });
      buttons.append(useSelection);
      if (review.suggestedAnchor) {
        const useCandidate = node('button', 'Use suggested excerpt', 'secondary'); useCandidate.type = 'button';
        useCandidate.addEventListener('click', () => {
          const { start, end, quote } = review.suggestedAnchor; choose({ start, end, quote });
          const range = selectionFromAnchor(source.text, review.suggestedAnchor); sourceInput.focus(); sourceInput.setSelectionRange(range.start, range.end);
        }); buttons.append(useCandidate);
      }
      const noMapping = node('button', 'Keep task without a mapping', 'secondary'); noMapping.type = 'button'; noMapping.addEventListener('click', () => choose(null)); buttons.append(noMapping);
      form.append(buttons, node('p', 'Your selected mapping', 'comparison-label'), choiceText);
      const applyLabel = node('label', `Applicability for version ${number} — confirm your decision`); applyLabel.htmlFor = `review-apply-${review.id}`;
      const select = node('select'); select.id = applyLabel.htmlFor; select.required = true;
      const prompt = node('option', 'Choose a decision'); prompt.value = ''; select.append(prompt);
      for (const [value, label] of Object.entries(applicabilityLabels)) { const option = node('option', label); option.value = value; select.append(option); }
      const noteLabel = node('label', 'Review note (required without a mapping)'); noteLabel.htmlFor = `review-note-${review.id}`;
      const noteInput = node('textarea'); noteInput.id = noteLabel.htmlFor; noteInput.maxLength = 1000; noteInput.rows = 2;
      const submit = node('button', `Record resolution for version ${number}`); submit.type = 'submit';
      form.append(applyLabel, select, noteLabel, noteInput, node('p', 'This records your decision for this version only. Completion history and other open reviews stay intact. Resolving an older version does not change the latest applicability decision.', 'helper'), submit);
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (chosen === undefined) { reportError(new Error('Select a source mapping, or explicitly keep this task without one.')); return; }
        try { onResolve(task.id, review.id, { anchor: chosen, applicability: select.value, note: noteInput.value }); } catch (error) { reportError(error); }
      }); record.append(form);
    }
    details.append(record);
  }
  return details;
}
