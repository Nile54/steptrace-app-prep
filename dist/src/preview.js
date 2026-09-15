import { passages, tasks, changePreview } from './demo.js';

// Build text nodes so future pasted content cannot become executable HTML.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const sourceContainer = document.querySelector('#source-passages');
for (const passage of passages) {
  const section = element('section', null, 'passage');
  section.id = `source-${passage.id}`;
  section.tabIndex = -1;
  const heading = element('h3', passage.label);
  heading.id = `heading-${passage.id}`;
  section.setAttribute('aria-labelledby', heading.id);
  section.append(heading, element('blockquote', passage.text));
  sourceContainer.append(section);
}

const taskList = document.querySelector('#task-list');
const reviewNodes = [];
for (const task of tasks) {
  const item = element('li', null, 'task');
  item.id = `task-${task.id}`;
  const icon = element('span', '✓', 'completion-icon');
  icon.setAttribute('aria-hidden', 'true');
  const completion = element('p', 'Completed · ', 'completion');
  const date = element('time', `${task.completedLabel}, 2026 (sample)`);
  date.dateTime = task.completedAt;
  completion.append(date);
  const sourceLink = element('a', `Source · ${task.sourceLabel}`, 'source-link');
  sourceLink.href = `#source-${task.sourceId}`;
  item.append(icon, element('h3', task.title), completion, sourceLink);
  if (task.dependencyNote) item.append(element('p', task.dependencyNote, 'dependency-note'));

  if (changePreview.reasons[task.id]) {
    const reason = element('p', null, 'review-reason');
    reason.hidden = true;
    reason.append(element('strong', 'Needs review · preview'), document.createTextNode(changePreview.reasons[task.id]));
    item.append(reason);
    reviewNodes.push(reason);
  }
  taskList.append(item);
}

document.querySelector('#before-quote').textContent = changePreview.before;
document.querySelector('#after-quote').textContent = changePreview.after;

const previewButton = document.querySelector('#preview-toggle');
const previewPanel = document.querySelector('#change-preview');
const previewStatus = document.querySelector('#preview-status');

// The only mutable state is whether the scripted preview is visible.
// Completion records stay untouched; this is not a comparison or storage engine.
previewButton.addEventListener('click', () => {
  const showPreview = previewPanel.hidden;
  previewPanel.hidden = !showPreview;
  for (const reason of reviewNodes) reason.hidden = !showPreview;
  previewButton.setAttribute('aria-expanded', String(showPreview));
  previewButton.textContent = showPreview ? 'Hide change preview' : 'Preview instruction change';
  previewStatus.textContent = showPreview
    ? 'Preview shown: draft and proofreading need review. All 3 sample completion records are retained.'
    : 'Preview hidden. Showing the original sample checklist.';
});
