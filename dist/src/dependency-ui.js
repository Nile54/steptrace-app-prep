import {
  describeDependencyReview,
  getDependencyReviews,
  getTaskBlockers,
  getTaskDependencies,
  getTaskReviewState,
  isTaskCompleted,
} from './model.js';

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

const applicabilityLabels = {
  'not-decided': 'Not decided',
  applies: 'Applies',
  'does-not-apply': 'Does not apply',
};
const dateLabel = at => new Date(at).toLocaleString();
const taskTitle = (application, taskId) => application.tasks.find(task => task.id === taskId)?.title ?? 'Unavailable step';
const versionLabel = (application, sourceId) => `Version ${application.sources.findIndex(source => source.id === sourceId) + 1}`;

function noteField(id, labelText) {
  const label = node('label', labelText);
  label.htmlFor = id;
  const input = node('textarea');
  input.id = id;
  input.rows = 2;
  input.maxLength = 1000;
  input.required = true;
  return { label, input };
}

function renderBlockers(task, application) {
  const section = node('section', undefined, 'dependency-blockers');
  section.setAttribute('aria-label', `Recorded blockers for ${task.title}`);
  const blockers = getTaskBlockers(application, task.id);
  if (blockers.length) {
    section.append(node('h4', `${blockers.length} recorded blocker(s) for this step`));
    const list = node('ul');
    for (const blocker of blockers) list.append(node('li', blocker.message));
    section.append(list);
  } else {
    section.append(node('h4', 'No recorded blockers for this step'));
  }
  section.append(node('p', 'This checks recorded dependencies, applicability and review reasons. It does not establish eligibility or a complete application checklist.', 'helper'));
  return section;
}

function renderDependencyChoices(task, application, { onDependencies, reportError }) {
  const dependencyIds = getTaskDependencies(application, task.id);
  const details = node('details', undefined, 'dependency-editor');
  details.append(node('summary', `This step depends on… · ${dependencyIds.length} confirmed`));
  if (dependencyIds.length) {
    const list = node('ul', undefined, 'confirmed-dependencies');
    for (const dependencyId of dependencyIds) {
      const predecessor = application.tasks.find(candidate => candidate.id === dependencyId);
      const completion = isTaskCompleted(predecessor) ? 'Complete' : 'Not complete';
      const review = getTaskReviewState(predecessor) === 'needs-review' ? ' · Needs review' : '';
      list.append(node('li', `${predecessor.title} · ${completion} · ${applicabilityLabels[predecessor.applicability]}${review}`));
    }
    details.append(list);
  } else {
    details.append(node('p', 'No dependencies have been confirmed for this step.', 'helper'));
  }

  const form = node('form'); form.id = `dependencies-form-${task.id}`;
  form.setAttribute('aria-label', `Choose dependencies for ${task.title}`);
  const fieldset = node('fieldset');
  fieldset.append(node('legend', 'This step depends on…'));
  const choices = [];
  for (const predecessor of application.tasks.filter(candidate => candidate.id !== task.id)) {
    const label = node('label', undefined, 'checkbox-row dependency-choice');
    const input = node('input');
    input.type = 'checkbox';
    input.id = `depends-${task.id}-${predecessor.id}`;
    input.checked = dependencyIds.includes(predecessor.id);
    label.htmlFor = input.id;
    label.append(input, node('span', predecessor.title));
    fieldset.append(label);
    choices.push({ input, taskId: predecessor.id });
  }
  if (!choices.length) fieldset.append(node('p', 'Create another task before confirming a dependency.', 'helper'));
  const help = node('p', 'Select the steps whose work this step uses. Confirm an empty selection to remove current links. Circular links are rejected. Removing a link keeps previous review reasons and history.', 'helper');
  help.id = `dependency-help-${task.id}`;
  fieldset.setAttribute('aria-describedby', help.id);
  const submit = node('button', 'Confirm dependencies');
  submit.type = 'submit';
  submit.disabled = choices.length === 0;
  form.append(fieldset, help, submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      onDependencies(task.id, choices.filter(choice => choice.input.checked).map(choice => choice.taskId));
    } catch (error) { reportError(error); }
  });
  details.append(form);

  const history = application.dependencyHistory.filter(event => event.taskId === task.id);
  if (history.length) {
    const records = node('details', undefined, 'dependency-history');
    records.append(node('summary', `Dependency history · ${history.length} record(s)`));
    const list = node('ul');
    for (const record of [...history].reverse()) {
      const titles = record.dependencyIds.map(id => taskTitle(application, id)).join('; ') || 'No dependencies';
      list.append(node('li', `${dateLabel(record.at)} · ${titles}`));
    }
    records.append(list);
    details.append(records);
  }
  return details;
}

function renderEffectReviews(task, application, { onAcknowledge, reportError }) {
  const reviews = getDependencyReviews(application, task.id);
  if (!reviews.length) return null;
  const details = node('details', undefined, 'dependency-reviews');
  const pending = reviews.filter(review => !review.resolution).length;
  details.open = pending > 0;
  details.append(node('summary', `Reviews from related work · ${pending} need review · ${reviews.length} change record(s)`));
  details.append(node('p', 'Each change has its own review. Recording one decision keeps other changes, later updates and completion history intact.', 'helper'));
  for (const review of [...reviews].reverse()) {
    const description = describeDependencyReview(application, task, review);
    const record = node('details', undefined, 'dependency-review');
    record.dataset.reviewId = review.id;
    record.dataset.causeId = review.causeId;
    record.open = !review.resolution;
    record.append(node('summary', `${review.resolution ? 'Review recorded' : 'Needs review'} · ${description.reason}`));
    const label = description.causeKind === 'work' ? 'Reported work change' : 'Source-link review';
    record.append(node('p', `${label} · ${versionLabel(application, description.sourceVersionId)} · ${dateLabel(review.at)}`, 'helper'));
    if (description.note) record.append(node('p', description.note, 'resolution-note'));
    record.append(node('p', 'One recorded path for this review (current links may differ):', 'comparison-label'));
    const chain = node('ol', undefined, 'causal-chain');
    description.chain.forEach((title, index) => chain.append(node('li', index === 0 ? `${title} — change began here` : `${title} — review reached this step from the previous step`)));
    record.append(chain);
    if (review.resolution) {
      record.append(node('p', `Reviewed ${dateLabel(review.resolution.at)}.`, 'helper'), node('p', review.resolution.note, 'resolution-note'));
    } else {
      const form = node('form'); form.id = `dependency-review-form-${review.id}`;
      form.setAttribute('aria-label', `Review related change for ${task.title}`);
      const { label: noteLabel, input } = noteField(`dependency-review-note-${review.id}`, 'What did you check or decide? (required)');
      const help = node('p', 'Read the effect on this step before recording a decision. If instructions conflict or applicability is unknown, leave the review open while you decide or obtain clarification. A review record does not complete work or resolve an ancestor’s review.', 'helper');
      help.id = `dependency-review-help-${review.id}`;
      input.setAttribute('aria-describedby', help.id);
      const submit = node('button', 'Record review for this change');
      submit.type = 'submit';
      form.append(noteLabel, input, help, submit);
      form.addEventListener('submit', event => {
        event.preventDefault();
        try { onAcknowledge(task.id, review.id, { note: input.value }); }
        catch (error) { reportError(error); }
      });
      record.append(form);
    }
    details.append(record);
  }
  return details;
}

function renderWorkChanges(task, application, { onWorkChange, reportError }) {
  const details = node('details', undefined, 'work-change-editor');
  details.append(node('summary', 'I changed this work'));
  const form = node('form'); form.id = `work-change-form-${task.id}`;
  form.setAttribute('aria-label', `Report changed work for ${task.title}`);
  const { label, input } = noteField(`work-change-note-${task.id}`, 'What did you change? (required)');
  const help = node('p', 'This records your report and flags dependent work for review. Origin Scholar does not observe edits to external files. Each report creates a separate change record, even when the instructions stay the same. Completion records are retained.', 'helper');
  help.id = `work-change-help-${task.id}`;
  input.setAttribute('aria-describedby', help.id);
  const submit = node('button', 'Record work change');
  submit.type = 'submit';
  form.append(label, input, help, submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try { onWorkChange(task.id, { note: input.value }); }
    catch (error) { reportError(error); }
  });
  details.append(form);
  const changes = application.workChanges.filter(change => change.taskId === task.id);
  if (changes.length) {
    const history = node('details', undefined, 'work-change-history');
    history.append(node('summary', `Reported work history · ${changes.length} change(s)`));
    const list = node('ol');
    for (const change of [...changes].reverse()) {
      const item = node('li');
      item.append(node('p', `${dateLabel(change.at)} · ${versionLabel(application, change.sourceVersionId)}`, 'helper'), node('p', change.note, 'resolution-note'));
      list.append(item);
    }
    history.append(list);
    details.append(history);
  }
  return details;
}

// Every control records an explicit person-made decision. Rendering never
// acknowledges a change, infers a dependency or alters completion history.
export function renderDependencies(task, application, callbacks) {
  const section = node('section', undefined, 'task-dependencies');
  section.setAttribute('aria-label', `Dependencies and work changes for ${task.title}`);
  section.append(renderBlockers(task, application), renderDependencyChoices(task, application, callbacks));
  const reviews = renderEffectReviews(task, application, callbacks);
  if (reviews) section.append(reviews);
  section.append(renderWorkChanges(task, application, callbacks));
  return section;
}
