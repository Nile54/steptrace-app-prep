import { createTabJournal, createFormDrafts, createSaveRecovery, readTabPreferences } from './drafts.js';
import { initOffline } from './offline.js';
import { createApplication, createTask, updateTask, isTaskCompleted, addSourceVersion, resolveSourceReview, getTaskAnchor, getTaskReviewState, LIMITS } from './model.js';
import { createStorage, serializeBackup, parseBackup, mergeWorkspaces, STORAGE_KEY } from './storage.js';
import { anchorFromSelection, selectionFromAnchor } from './source-selection.js';
import { passages } from './demo.js';
import { renderComparison, renderTaskReviews } from './review-ui.js';
import { setTaskDependencies, recordWorkChange, acknowledgeDependencyReview } from './model.js';
import { renderDependencies } from './dependency-ui.js';
import { createDependencyDemo, addDemoCondition, demoBefore, demoAfter, conditionalQuote } from './dependency-demo.js';

// Never interpret application content, task wording, or imported labels as HTML.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = element('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const labels = { 'not-decided': 'Not decided', applies: 'Applies', 'does-not-apply': 'Does not apply' };
const dateLabel = value => new Date(value).toLocaleString();

// Injecting the storage adapter lets tests exercise failures in the real UI.
export function startApp(storage = createStorage()) {
  const $ = selector => document.querySelector(selector);
  const initial = storage.load();
  const journal = createTabJournal();
  const drafts = createFormDrafts(journal, { onStatus: text => { $('#draft-status').textContent = text; } });
  const recovery = createSaveRecovery();
  const recovered = recovery.read();
  let recoveryWritable = !recovered.error;
  let recoveredUnsaved = false;
  let recoveredWorkspace = null;
  let recoveryMessage = recovered.error || '';
  if (recovered.pending) {
    try {
      const candidate = parseBackup(recovered.pending.backup);
      if (JSON.stringify(candidate) === JSON.stringify(initial.workspace) && !initial.blocked) {
        if (!recovery.clear()) recoveryMessage = 'Saved work is intact, but its same-tab recovery copy could not be removed. It may appear again after reload.';
      }
      else {
        $('#download-recovery').hidden = false;
        $('#download-recovery').addEventListener('click', () => download(recovered.pending.backup, 'steptrace-interrupted-work.json'));
        if (!initial.blocked && initial.raw === recovered.pending.expectedRaw) {
          recoveredWorkspace = candidate; recoveredUnsaved = true;
          recoveryMessage = 'Recovered interrupted changes in this tab. They are not saved to the workspace yet. Retry saving or export a backup.';
        } else {
          recoveryWritable = false;
          recoveryMessage = 'An interrupted-work copy differs from current storage. Current saved work was opened unchanged. Download the interrupted-work backup to keep both copies; no automatic merge was performed.';
        }
      }
    } catch { recoveryWritable = false; recoveryMessage = 'An interrupted-work copy could not be validated. It was left untouched. Current saved work is unchanged.'; }
  }
  $('#recovery-status').textContent = recoveryMessage;
  const preferences = readTabPreferences(journal);
  let viewMode = preferences.viewMode === 'one' ? 'one' : 'full';
  let stepId = typeof preferences.stepId === 'string' ? preferences.stepId : null;
  let returningTaskId = null;
  let submittingForm = null;
  let storageConflict = false;
  let errorControl = null;
  document.addEventListener('submit', event => { submittingForm = event.target; queueMicrotask(() => { submittingForm = null; }); }, true);

  let workspace = recoveredWorkspace || initial.workspace;
  let expectedRaw = initial.raw;
  let storageBlocked = initial.blocked;
  let activeId = workspace.applications.some(app => app.id === preferences.activeId) ? preferences.activeId : workspace.applications[0]?.id ?? null;
  let renderedApplicationId = null;
  let selectedAnchor = null;
  let restoreCandidate = null;
  let unsaved = recoveredUnsaved;
  let originalFileText = null;
  let sourceReadSequence = 0;
  let restoreReadSequence = 0;
  let viewedSourceId = null;
  let comparedSourceId = null;
  let versionCandidate = null;
  const activeApplication = () => workspace.applications.find(app => app.id === activeId);
  function report(message) { $('#action-error').hidden = true; $('#return-to-control').hidden = true; $('#action-status').textContent = message; }
  function reportError(error) {
    errorControl = document.activeElement; $('#return-to-control').hidden = !errorControl || errorControl === document.body;
    $('#action-status').textContent = '';
    $('#action-error').textContent = error.message ?? String(error);
    $('#action-error').hidden = false;
    $('#action-error').focus();
  }
  function showSaveStatus(message, failed = false) {
    $('#save-status').textContent = message;
    $('#save-status').closest('section').classList.toggle('save-failed', failed);
  }
  function persist() {
    unsaved = true;
    let journaled = false;
    if (recoveryWritable) {
      try { journaled = recovery.write(serializeBackup(workspace), expectedRaw); } catch { /* export/save will show validation errors */ }
    }
    $('#recovery-status').textContent = journaled ? 'A same-tab recovery copy protects this pending write. Keep separate backups.'
      : `${!recoveryWritable && recoveryMessage ? `${recoveryMessage} ` : ''}A reload recovery copy of the latest changes is unavailable. Keep this tab open if saving fails and export your current work.`;
    if (storageBlocked) {
      showSaveStatus('Not saved. Storage could not be safely read. Keep this tab open and export a JSON backup. Existing stored data has not been replaced.', true);
      return;
    }
    const result = storage.save(workspace, expectedRaw);
    if (result.ok) {
      expectedRaw = result.raw; unsaved = false;
      if (recoveryWritable) {
        const cleared = recovery.clear(); $('#download-recovery').hidden = true;
        $('#recovery-status').textContent = cleared ? '' : 'Workspace saved. A same-tab recovery copy could not be removed; an older copy may appear again after reload.';
      } else $('#recovery-status').textContent = recoveryMessage;
      $('#retry-save').hidden = true;
      showSaveStatus(`Saved on this device at ${new Date().toLocaleTimeString()}. Download a backup for a separate copy.`);
    } else {
      storageBlocked = result.blocked;
      showSaveStatus(`Not saved. ${result.error} Latest changes are only in this tab. Keep it open and export a JSON backup.`, true);
      $('#retry-save').hidden = Boolean(storageBlocked);
    }
  }
  function accept(next, message, completedForm = submittingForm) {
    if (completedForm) drafts.clear(completedForm);
    workspace = next;
    $('#backup-preview').hidden = true;
    persist(); renderWorkspace();
    if (restoreCandidate) renderRestorePreview();
    report(`${message}${unsaved ? ' These changes are not saved; use Backup & restore.' : ''}`);
  }
  function clearSelection() {
    selectedAnchor = null;
    $('#selected-excerpt').hidden = true;
    $('#no-source-notice').hidden = false;
    $('#selected-quote').textContent = ''; $('#task-anchor').value = '';
  }
  function makeSelect(id, value) {
    const select = element('select'); select.id = id;
    for (const [key, label] of Object.entries(labels)) { const option = element('option', label); option.value = key; select.append(option); }
    select.value = value;
    return select;
  }
  function renderSource() {
    const app = activeApplication();
    const source = app.sources.find(source => source.id === viewedSourceId) ?? app.sources.at(-1);
    viewedSourceId = source.id;
    $('#source-version-select').value = source.id;
    $('#source-snapshot').value = source.text;
    $('#source-version-label').textContent = `Version ${app.sources.indexOf(source) + 1} · Read-only`;
    $('#source-meta').textContent = `${source.label} · Captured ${dateLabel(source.createdAt)}`;
    $('#use-selection').disabled = source.id !== app.sources.at(-1).id;
    $('#source-location').textContent = ''; $('#located-quote').hidden = true;
  }
  function showAnchor(anchor, title, taskId) {
    returningTaskId = taskId; $('#return-to-task').hidden = false; $('#return-to-task').textContent = `Return to task: ${title}`;
    viewedSourceId = anchor.sourceVersionId; renderSource();
    const source = activeApplication().sources.find(source => source.id === viewedSourceId);
    const range = selectionFromAnchor(source.text, anchor);
    $('#source-snapshot').focus(); $('#source-snapshot').setSelectionRange(range.start, range.end);
    $('#located-quote').hidden = false; $('#located-quote-text').textContent = anchor.quote;
    $('#source-location').textContent = `Showing the exact source excerpt for “${title}”, version ${activeApplication().sources.indexOf(source) + 1}.`;
  }
  function renderSavedComparison() {
    const app = activeApplication();
    const index = app.sources.findIndex(source => source.id === comparedSourceId);
    if (index < 1) {
      $('#saved-comparison').textContent = 'One source version is saved. Add updated instructions to compare versions.';
      return;
    }
    renderComparison($('#saved-comparison'), app.sources[index - 1], app.sources[index], app);
  }
  function renderTask(task) {
    const item = element('li', null, 'saved-task'); item.id = `task-${task.id}`;
    const heading = element('h3', task.title); heading.id = `task-heading-${task.id}`; heading.tabIndex = -1;
    const completed = isTaskCompleted(task);
    const state = getTaskReviewState(task);
    item.append(heading, element('p', completed ? 'Completed' : 'Not completed', 'completion-state'), element('p', `Applicability: ${labels[task.applicability]}`, 'helper'), element('p', state === 'needs-review' ? 'Review: Needs review — completion is retained. Check the effect on this work; previously completed work may still satisfy the instructions.' : state === 'reviewed' ? 'Review: No open recorded reviews. This does not establish checklist completeness.' : 'Review: No change reviews recorded.', 'review-state'));
    if (task.reviewState === 'needs-review') item.append(element('p', 'An earlier backup retained a review flag without a version-specific reason. It remains separate from the source reviews below.', 'helper'));
    if (task.anchor) {
      item.append(element('blockquote', task.anchor.quote, 'task-quote'));
      const sourceButton = element('button', 'View exact source', 'secondary'); sourceButton.type = 'button';
      sourceButton.setAttribute('aria-label', `View exact source for ${task.title}`);
      sourceButton.addEventListener('click', () => {
        showAnchor(task.anchor, task.title, task.id);
      });
      item.append(sourceButton);
      const latestAnchor = getTaskAnchor(task, activeApplication().sources.at(-1).id);
      if (latestAnchor && latestAnchor.sourceVersionId !== task.anchor.sourceVersionId) {
        const latestButton = element('button', 'View latest mapped source', 'secondary'); latestButton.type = 'button';
        latestButton.setAttribute('aria-label', `View latest mapped source for ${task.title}`);
        latestButton.addEventListener('click', () => showAnchor(latestAnchor, task.title, task.id)); item.append(latestButton);
      } else if (!latestAnchor) item.append(element('p', 'No confirmed mapping to the latest source version. Inspect the source reviews below.', 'helper'));
    } else item.append(element('p', 'No source linked · Manually entered task', 'no-source-label'));
    const checkboxRow = element('label', null, 'checkbox-row');
    const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = completed; checkbox.id = `complete-${task.id}`;
    checkbox.setAttribute('aria-label', `Completed: ${task.title}`);
    checkbox.addEventListener('change', () => {
      try {
        accept(updateTask(workspace, activeId, task.id, { completed: checkbox.checked }), 'Completion recorded. Review and applicability are unchanged.');
        document.getElementById(`complete-${task.id}`).focus();
      } catch (error) { checkbox.checked = completed; reportError(error); }
    });
    checkboxRow.append(checkbox, document.createTextNode('Mark completed')); item.append(checkboxRow);
    const editor = element('details', null, 'task-editor'); editor.append(element('summary', 'Edit wording or applicability'));
    const form = element('form'); form.id = `task-edit-form-${task.id}`; form.setAttribute('aria-labelledby', heading.id);
    const titleLabel = element('label', 'Task wording'); titleLabel.htmlFor = `title-${task.id}`;
    const titleInput = element('input'); titleInput.id = titleLabel.htmlFor; titleInput.value = task.title; titleInput.required = true; titleInput.maxLength = LIMITS.titleChars;
    const applyLabel = element('label', 'Applicability — your decision'); applyLabel.htmlFor = `applicability-${task.id}`;
    const applySelect = makeSelect(applyLabel.htmlFor, task.applicability);
    const save = element('button', 'Save task changes', 'secondary'); save.type = 'submit';
    form.append(titleLabel, titleInput, applyLabel, applySelect, save);
    form.addEventListener('submit', event => {
      event.preventDefault();
      try {
        accept(updateTask(workspace, activeId, task.id, { title: titleInput.value, applicability: applySelect.value }), 'Task wording and applicability recorded. Source and completion history are unchanged.');
        focusTask(task.id);
      } catch (error) { reportError(error); }
    });
    editor.append(form); item.append(editor);
    const history = element('details', null, 'task-history'); history.append(element('summary', 'Completion & decision history'));
    const historyList = element('ul');
    const events = [...task.completionHistory.map(event => ({ at: event.at, text: event.completed ? 'Marked completed' : 'Marked not completed' })), ...task.applicabilityHistory.map(event => ({ at: event.at, text: `Applicability: ${labels[event.value]}` }))].sort((a, b) => a.at.localeCompare(b.at));
    for (const event of events) historyList.append(element('li', `${event.text} · ${dateLabel(event.at)}`));
    history.append(historyList);
    if (!task.completionHistory.length) history.append(element('p', 'No completion recorded yet.', 'helper'));
    item.append(history);
    if (task.sourceReviews.length) item.append(renderTaskReviews(task, activeApplication(), {
      report, reportError,
      onResolve(taskId, reviewId, resolution) {
        accept(resolveSourceReview(workspace, activeId, taskId, reviewId, resolution), 'Resolution recorded for the selected version. Other reviews and completion history are unchanged.');
        focusTask(taskId);
      },
    }));
    item.append(renderDependencies(task, activeApplication(), {
      reportError,
      onDependencies(taskId, dependencyIds) {
        accept(setTaskDependencies(workspace, activeId, taskId, dependencyIds), 'Dependencies confirmed. Existing review reasons and completion history are retained.');
        focusTask(taskId);
      },
      onWorkChange(taskId, change) {
        accept(recordWorkChange(workspace, activeId, taskId, change), 'Your work change was recorded as a new event. Dependent tasks have separate review reasons; completion is retained.');
        focusTask(taskId);
      },
      onAcknowledge(taskId, reviewId, resolution) {
        accept(acknowledgeDependencyReview(workspace, activeId, taskId, reviewId, resolution), 'Reviewed this one change for this task. Other reasons and completion history are retained.');
        focusTask(taskId);
      },
    }));
    return item;
  }
  function savePreferences() {
    journal.set('ui', JSON.stringify({ activeId, viewMode, stepId, textSize: $('#text-size').value }));
    drafts.refreshStatus();
  }
  function applyTaskView() {
    const app = activeApplication(); if (!app) return;
    if (!app.tasks.some(task => task.id === stepId)) stepId = app.tasks[0]?.id ?? null;
    const index = app.tasks.findIndex(task => task.id === stepId);
    for (const task of app.tasks) document.getElementById(`task-${task.id}`).hidden = viewMode === 'one' && task.id !== stepId;
    $('#step-navigation').hidden = viewMode !== 'one' || !app.tasks.length;
    $('#step-select').replaceChildren(...app.tasks.map((task, i) => { const option = element('option', `${i + 1}. ${task.title}`); option.value = task.id; return option; }));
    $('#step-select').value = stepId;
    $('#step-position').textContent = `Step ${index + 1} of ${app.tasks.length}. Choose when to move; completing a step never moves you automatically.`;
    $('#previous-step').disabled = index <= 0; $('#next-step').disabled = index >= app.tasks.length - 1;
    document.querySelector(`input[name="task-view"][value="${viewMode}"]`).checked = true;
  }
  function focusTask(id) { stepId = id; applyTaskView(); savePreferences(); document.getElementById(`task-heading-${id}`)?.focus(); }
  function bindDrafts() {
    for (const control of document.querySelectorAll('input, textarea, form')) { control.setAttribute('autocomplete', 'off'); control.setAttribute('spellcheck', 'false'); }
    drafts.bind(document, activeId);
  }
  function syncTaskAnchor() {
    selectedAnchor = null;
    try { if ($('#task-anchor').value) selectedAnchor = JSON.parse($('#task-anchor').value); } catch { $('#task-anchor').value = ''; }
    $('#selected-quote').textContent = selectedAnchor?.quote || '';
    $('#selected-excerpt').hidden = !selectedAnchor; $('#no-source-notice').hidden = Boolean(selectedAnchor);
  }
  $('#application-form').addEventListener('draft-restored', () => { originalFileText = $('#original-source-text').value || null; });
  $('#task-form').addEventListener('draft-restored', syncTaskAnchor);
  $('#return-to-control').addEventListener('click', () => { if (errorControl?.isConnected) errorControl.focus(); else $('#current-application-title').focus(); });
  $('#return-to-task').addEventListener('click', () => { if (returningTaskId) focusTask(returningTaskId); });
  for (const radio of document.querySelectorAll('input[name="task-view"]')) radio.addEventListener('change', () => { viewMode = radio.value; applyTaskView(); savePreferences(); report(viewMode === 'one' ? 'Showing one step at a time. Other tasks and their drafts are retained.' : 'Showing the full checklist.'); });
  $('#step-select').addEventListener('change', () => focusTask($('#step-select').value));
  for (const [id, delta] of [['previous-step', -1], ['next-step', 1]]) $( `#${id}`).addEventListener('click', () => { const app = activeApplication(); const index = app.tasks.findIndex(task => task.id === stepId); if (app.tasks[index + delta]) focusTask(app.tasks[index + delta].id); });
  $('#text-size').value = preferences.textSize === 'large' ? 'large' : 'standard';
  document.documentElement.classList.toggle('large-text', $('#text-size').value === 'large');
  $('#text-size').addEventListener('change', () => { document.documentElement.classList.toggle('large-text', $('#text-size').value === 'large'); savePreferences(); });
  for (const link of document.querySelectorAll('.workspace-nav a')) link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target.tagName === 'DETAILS') { target.open = true; target.querySelector('summary').focus(); }
    else { target.tabIndex = -1; target.focus(); }
  });
  function renderWorkspace() {
    if (renderedApplicationId !== activeId) {
      returningTaskId = null; $('#return-to-task').hidden = true; renderedApplicationId = activeId;
    }
    const app = activeApplication(); $('#application-workspace').hidden = !app;
    $('#application-select').replaceChildren();
    for (const application of workspace.applications) { const option = element('option', application.title); option.value = application.id; $('#application-select').append(option); }
    for (const link of document.querySelectorAll('.workspace-nav a')) if (['#source-heading', '#checklist-heading', '#source-changes'].includes(link.getAttribute('href'))) link.hidden = !app;
    if (!app) { bindDrafts(); return; }
    $('#application-select').value = app.id; $('#current-application-title').textContent = app.title;
    $('#source-version-select').replaceChildren(...app.sources.map((source, index) => { const option = element('option', `Version ${index + 1} · ${source.label}${index === app.sources.length - 1 ? ' · Latest' : ''}`); option.value = source.id; return option; }));
    renderSource();
    if (!app.sources.some(source => source.id === comparedSourceId)) comparedSourceId = app.sources.at(-1).id;
    $('#comparison-version').replaceChildren(...app.sources.slice(1).map((source, index) => { const option = element('option', `Version ${index + 2} compared with version ${index + 1}`); option.value = source.id; return option; }));
    $('#comparison-version').disabled = app.sources.length < 2; $('#comparison-version').value = comparedSourceId;
    renderSavedComparison();
    const pending = app.tasks.reduce((count, task) => count + task.sourceReviews.filter(review => review.kind !== 'exact' && !review.resolution).length, 0);
    const downstream = app.tasks.reduce((count, task) => count + task.dependencyReviews.filter(review => !review.resolution).length, 0);
    $('#review-overview').textContent = `${app.sources.length} source version(s) · ${pending} open task source review(s) · ${downstream} open dependent-work review(s). Compare saved versions to inspect new or unlinked material. Completion history is preserved.`;
    $('#fill-dependency-update').disabled = app.sources.at(-1).text !== demoBefore;
    $('#add-demo-condition').disabled = app.sources.at(-1).text !== demoAfter || app.tasks.some(task => task.anchor?.quote === conditionalQuote);
    const legacyFlags = app.tasks.filter(task => task.reviewState === 'needs-review').length;
    if (legacyFlags) $('#review-overview').textContent += ` ${legacyFlags} earlier review flag(s) also retained.`;
    if (versionCandidate && (versionCandidate.applicationId !== app.id || versionCandidate.sourceId !== app.sources.at(-1).id)) clearVersionPreview();
    $('#task-count').textContent = `${app.tasks.length} task${app.tasks.length === 1 ? '' : 's'}`;
    $('#task-list').replaceChildren(...app.tasks.map(renderTask)); $('#empty-tasks').hidden = app.tasks.length > 0;
    applyTaskView(); bindDrafts(); savePreferences();
  }
  $('#application-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const next = createApplication(workspace, { title: $('#application-title').value, text: originalFileText ?? $('#source-input').value, label: $('#source-label').value });
      activeId = next.applications.at(-1).id; viewedSourceId = null; comparedSourceId = null; clearSelection(); accept(next, 'Application created with a read-only source snapshot.');
      $('#application-form').reset(); originalFileText = null; sourceReadSequence += 1;
      $('#new-application').open = false; $('#current-application-title').focus();
    } catch (error) { reportError(error); }
  });
  $('#fill-example').addEventListener('click', () => {
    sourceReadSequence += 1; originalFileText = null; $('#source-file').value = ''; $('#application-form button[type="submit"]').disabled = false;
    $('#application-title').value = 'Maple Grove Scholarship (fictional)'; $('#source-label').value = 'Fictional scholarship instructions';
    $('#source-input').value = `${passages.map(p => p.text).join('\n\n')}\n\nIf you are applying as a part-time student, include a study plan.`;
    $('#original-source-text').value = ''; drafts.remember($('#application-form'));
    report('Fictional draft filled. Review it and choose Create application.');
  });
  $('#create-dependency-demo').addEventListener('click', () => {
    try {
      const next = createDependencyDemo(workspace);
      activeId = next.applications.at(-1).id; viewedSourceId = null; comparedSourceId = null;
      clearSelection(); clearVersionPreview(); $('#version-form').reset();
      accept(next, 'Fictional plan created: three completed tasks and a confirmed proofreading → essay dependency. The sample 380-word draft has not been inspected by this app.');
      $('#new-application').open = false; $('#current-application-title').focus();
    } catch (error) { reportError(error); }
  });
  $('#fill-dependency-update').addEventListener('click', () => {
    if (activeApplication()?.sources.at(-1).text !== demoBefore) return;
    clearVersionPreview(); $('#version-label').value = 'Fictional update: 400-word maximum'; $('#version-input').value = demoAfter;
    drafts.remember($('#version-form')); $('#new-version').open = true; $('#version-input').focus();
    report('Fictional update filled. Preview and save it using the normal source-version controls. A 380-word essay is not automatically invalid under a 400-word maximum.');
  });
  $('#add-demo-condition').addEventListener('click', () => {
    try {
      accept(addDemoCondition(workspace, activeId), 'Conditional sample task linked with applicability Not decided. You decide whether it applies.');
      focusTask(activeApplication().tasks.at(-1).id);
    } catch (error) { reportError(error); }
  });
  $('#source-input').addEventListener('input', () => { originalFileText = null; $('#original-source-text').value = ''; sourceReadSequence += 1; $('#application-form button[type="submit"]').disabled = false; });
  $('#source-file').addEventListener('change', async () => {
    const sequence = ++sourceReadSequence; const file = $('#source-file').files[0];
    $('#application-form button[type="submit"]').disabled = Boolean(file); if (!file) return;
    $('#application-form button[type="submit"]').disabled = true; report('Reading the plain-text file…');
    try {
      if (!/\.txt$/i.test(file.name)) throw new Error('Choose a .txt file containing UTF-8 plain text.');
      if (file.size > LIMITS.payloadBytes) throw new Error('This file is too large. Use up to 100,000 characters of plain text.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (sequence !== sourceReadSequence) return;
      if (text.length > LIMITS.sourceChars) throw new Error('Source instructions must be at most 100,000 characters.');
      $('#source-input').value = text; originalFileText = text; $('#original-source-text').value = text; $('#source-label').value = file.name.slice(0, LIMITS.titleChars);
      drafts.remember($('#application-form')); report('Plain-text file loaded into the draft. Review it before creating the application.');
    } catch (error) { if (sequence === sourceReadSequence) reportError(error); }
    finally { if (sequence === sourceReadSequence) $('#application-form button[type="submit"]').disabled = false; }
  });
  $('#application-select').addEventListener('change', () => { activeId = $('#application-select').value; viewedSourceId = null; comparedSourceId = null; clearVersionPreview(); $('#version-form').reset(); clearSelection(); $('#task-form').reset(); renderWorkspace(); $('#current-application-title').focus(); });
  $('#source-version-select').addEventListener('change', () => { returningTaskId = null; $('#return-to-task').hidden = true; viewedSourceId = $('#source-version-select').value; renderSource(); });
  $('#comparison-version').addEventListener('change', () => { comparedSourceId = $('#comparison-version').value; renderSavedComparison(); });
  $('#use-selection').addEventListener('click', () => {
    try {
      if (viewedSourceId !== activeApplication().sources.at(-1).id) throw new Error('Choose the latest source version before linking a new task.');
      const input = $('#source-snapshot'); selectedAnchor = { ...anchorFromSelection(activeApplication().sources.at(-1).text, input.selectionStart, input.selectionEnd), sourceVersionId: viewedSourceId };
      $('#task-anchor').value = JSON.stringify(selectedAnchor); drafts.remember($('#task-form'));
      $('#selected-quote').textContent = selectedAnchor.quote; $('#selected-excerpt').hidden = false; $('#no-source-notice').hidden = true;
      report('Exact source excerpt selected. Add your task wording below.'); $('#task-title').focus();
    } catch (error) { reportError(error); }
  });
  $('#clear-selection').addEventListener('click', () => { clearSelection(); drafts.remember($('#task-form')); report('New task will have no source link.'); $('#task-title').focus(); });
  $('#task-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      if (selectedAnchor && selectedAnchor.sourceVersionId !== activeApplication().sources.at(-1).id) throw new Error('This draft excerpt belongs to an earlier source version. Select its current passage or choose no source before adding the task.');
      const next = createTask(workspace, activeId, { title: $('#task-title').value, anchor: selectedAnchor ? { start: selectedAnchor.start, end: selectedAnchor.end, quote: selectedAnchor.quote } : null, applicability: $('#task-applicability').value });
      clearSelection(); accept(next, 'Task added. Review is separate from completion.'); $('#task-form').reset(); $('#task-title').focus();
    } catch (error) { reportError(error); }
  });
  function clearVersionPreview() { versionCandidate = null; $('#version-preview').hidden = true; $('#version-preview-diff').replaceChildren(); }
  $('#version-form').addEventListener('input', clearVersionPreview);
  $('#version-form').addEventListener('submit', event => {
    event.preventDefault(); clearVersionPreview();
    try {
      const app = activeApplication(); const text = $('#version-input').value; const label = $('#version-label').value.trim();
      if (!text.trim() || text.length > LIMITS.sourceChars || !label || label.length > LIMITS.titleChars) throw new Error('Enter a source label and complete instructions of up to 100,000 characters.');
      versionCandidate = { applicationId: app.id, sourceId: app.sources.at(-1).id, text, label };
      renderComparison($('#version-preview-diff'), app.sources.at(-1), { text, label });
      $('#version-preview').hidden = false; $('#version-preview-heading').focus(); report('Preview only. Save the new source version to retain it and open task reviews.');
    } catch (error) { clearVersionPreview(); reportError(error); }
  });
  $('#save-version').addEventListener('click', () => {
    try {
      if (!versionCandidate || versionCandidate.applicationId !== activeId || versionCandidate.sourceId !== activeApplication().sources.at(-1).id) throw new Error('Preview these instructions again before saving the version.');
      const next = addSourceVersion(workspace, activeId, { text: versionCandidate.text, label: versionCandidate.label });
      viewedSourceId = next.applications.find(app => app.id === activeId).sources.at(-1).id; comparedSourceId = viewedSourceId;
      // Keep an unsubmitted task's selected excerpt. The task submit guard asks
      // the person to reselect or choose no source if that version is now older.
      clearVersionPreview(); accept(next, 'New immutable source version added. Inspect the comparison and task reviews. Completion history is unchanged.', $('#version-form'));
      $('#version-form').reset(); $('#new-version').open = false; $('#source-changes').open = true; $('#review-overview').focus();
    } catch (error) { reportError(error); }
  });
  $('#retry-save').addEventListener('click', () => { persist(); if (!unsaved) report('Previously unsaved work is now saved on this device.'); });
  $('#prepare-backup').addEventListener('click', () => {
    try {
      $('#backup-json').value = serializeBackup(workspace);
      $('#backup-summary').textContent = `Prepared at ${new Date().toLocaleTimeString()}: ${workspace.applications.length} application(s), including any changes not saved locally. Download this file to keep a separate copy.`;
      $('#backup-preview').hidden = false; $('#backup-json').focus(); report('Backup prepared. Download it to keep a separate copy. Unsubmitted form drafts are not included.');
    } catch (error) { reportError(error); }
  });
  $('#download-backup').addEventListener('click', () => { try { download($('#backup-json').value, 'steptrace-backup.json'); report('Backup download requested. Check that the file arrived in your downloads.'); } catch (error) { reportError(error); } });
  $('#download-original').addEventListener('click', () => download(initial.raw, 'steptrace-unreadable-storage.json'));
  function clearRestore() { restoreCandidate = null; $('#restore-preview').hidden = true; }
  function renderRestorePreview() {
    $('#restore-preview').hidden = false;
    $('#restore-summary').textContent = `${restoreCandidate.applications.length} application(s), ${restoreCandidate.applications.reduce((sum, app) => sum + app.tasks.length, 0)} task(s). Current workspace: ${workspace.applications.length} application(s), which will remain.`;
    $('#restore-applications').replaceChildren(...restoreCandidate.applications.map(app => element('li', `${app.title} — ${app.tasks.length} task(s); ${app.sources.length} source version(s), including mappings, dependencies, work changes, and individual review resolutions`)));
    let problem = ''; try { mergeWorkspaces(workspace, restoreCandidate); } catch (error) { problem = error.message; }
    if (!restoreCandidate.applications.length) problem = 'This backup has no applications to add.';
    $('#restore-problem').textContent = problem; $('#restore-problem').hidden = !problem; $('#apply-restore').disabled = Boolean(problem);
  }
  $('#restore-json').addEventListener('input', () => { restoreReadSequence += 1; clearRestore(); $('#restore-form button[type="submit"]').disabled = false; });
  $('#restore-file').addEventListener('change', async () => {
    const sequence = ++restoreReadSequence; clearRestore(); const file = $('#restore-file').files[0];
    $('#restore-form button[type="submit"]').disabled = Boolean(file); if (!file) return;
    $('#restore-form button[type="submit"]').disabled = true; report('Reading the backup file…');
    try {
      if (file.size > LIMITS.payloadBytes) throw new Error('Backup files must be at most 2 MB.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); if (sequence !== restoreReadSequence) return;
      clearRestore();
      $('#restore-json').value = text; drafts.remember($('#restore-form')); report('Backup file loaded. Choose Preview restore to validate and inspect it.');
    } catch (error) { if (sequence === restoreReadSequence) reportError(error); }
    finally { if (sequence === restoreReadSequence) $('#restore-form button[type="submit"]').disabled = false; }
  });
  $('#restore-form').addEventListener('submit', event => {
    event.preventDefault(); restoreReadSequence += 1; clearRestore();
    try { restoreCandidate = parseBackup($('#restore-json').value); renderRestorePreview(); $('#restore-preview-heading').focus(); report('Restore preview only. Existing work has not changed.'); } catch (error) { reportError(error); }
  });
  $('#apply-restore').addEventListener('click', () => {
    try {
      const next = mergeWorkspaces(workspace, restoreCandidate); if (!activeId) activeId = restoreCandidate.applications[0]?.id ?? null;
      clearRestore(); accept(next, 'Restored applications added. Previous applications were preserved.', $('#restore-form')); $('#restore-form').reset(); restoreReadSequence += 1;
      $('#new-application').open = false; $('#current-application-title').focus();
    } catch (error) { reportError(error); }
  });
  $('#cancel-restore').addEventListener('click', () => { clearRestore(); report('Restore canceled. Existing work is unchanged.'); $('#restore-form button[type="submit"]').focus(); });
  window.addEventListener('beforeunload', event => { if (unsaved || (drafts.hasDrafts() && drafts.error)) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('storage', event => { if ((event.key === STORAGE_KEY || event.key === null) && event.newValue !== expectedRaw) { storageConflict = true; showSaveStatus('Storage changed in another tab. Export this tab’s work before reloading. Further saves are checked for conflicts.', true); } });
  if (initial.error) {
    showSaveStatus(`Local storage could not be loaded. ${initial.error} New work will stay only in this tab; export a backup before leaving.`, true);
    $('#download-original').hidden = typeof initial.raw !== 'string';
  } else if (initial.migrated) {
    showSaveStatus('Earlier saved data opened safely in the new format. Original stored data is unchanged until your next save. Prepare a JSON backup before editing.');
    $('#download-original').hidden = false; $('#download-original').textContent = 'Download original stored data';
  } else showSaveStatus(initial.raw === null ? 'No work saved yet. Backup & restore is available below.' : 'Loaded saved work from this device. Download backups regularly.');
  $('#new-application').open = !workspace.applications.length; renderWorkspace();
  if (recoveredUnsaved) { showSaveStatus('Not saved. Interrupted work was recovered in this tab. Retry saving or prepare a backup before leaving.', true); $('#retry-save').hidden = false; }
  initOffline({ canReload: () => !unsaved && !storageConflict
    && !$('#application-form button[type="submit"]').disabled && !$('#restore-form button[type="submit"]').disabled
    && drafts.canReload() });
}
