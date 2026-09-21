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
  let workspace = initial.workspace;
  let expectedRaw = initial.raw;
  let storageBlocked = initial.blocked;
  let activeId = workspace.applications[0]?.id ?? null;
  let selectedAnchor = null;
  let restoreCandidate = null;
  let unsaved = false;
  let originalFileText = null;
  let sourceReadSequence = 0;
  let restoreReadSequence = 0;
  let viewedSourceId = null;
  let comparedSourceId = null;
  let versionCandidate = null;
  const activeApplication = () => workspace.applications.find(app => app.id === activeId);
  function report(message) { $('#action-error').hidden = true; $('#action-status').textContent = message; }
  function reportError(error) {
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
    if (storageBlocked) {
      showSaveStatus('Not saved. Storage could not be safely read. Keep this tab open and export a JSON backup. Existing stored data has not been replaced.', true);
      return;
    }
    const result = storage.save(workspace, expectedRaw);
    if (result.ok) {
      expectedRaw = result.raw; unsaved = false;
      $('#retry-save').hidden = true;
      showSaveStatus(`Saved on this device at ${new Date().toLocaleTimeString()}. Download a backup for a separate copy.`);
    } else {
      storageBlocked = result.blocked;
      showSaveStatus(`Not saved. ${result.error} Latest changes are only in this tab. Keep it open and export a JSON backup.`, true);
      $('#retry-save').hidden = Boolean(storageBlocked);
    }
  }
  function accept(next, message) {
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
    $('#selected-quote').textContent = '';
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
  function showAnchor(anchor, title) {
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
    item.append(heading, element('p', completed ? 'Completed' : 'Not completed', 'completion-state'), element('p', `Applicability: ${labels[task.applicability]}`, 'helper'), element('p', state === 'needs-review' ? 'Review: Needs review — completion is retained.' : state === 'reviewed' ? 'Review: No open recorded reviews. This does not establish checklist completeness.' : 'Review: No change reviews recorded.', 'review-state'));
    if (task.reviewState === 'needs-review') item.append(element('p', 'An earlier backup retained a review flag without a version-specific reason. It remains separate from the source reviews below.', 'helper'));
    if (task.anchor) {
      item.append(element('blockquote', task.anchor.quote, 'task-quote'));
      const sourceButton = element('button', 'View exact source', 'secondary'); sourceButton.type = 'button';
      sourceButton.setAttribute('aria-label', `View exact source for ${task.title}`);
      sourceButton.addEventListener('click', () => {
        showAnchor(task.anchor, task.title);
      });
      item.append(sourceButton);
      const latestAnchor = getTaskAnchor(task, activeApplication().sources.at(-1).id);
      if (latestAnchor && latestAnchor.sourceVersionId !== task.anchor.sourceVersionId) {
        const latestButton = element('button', 'View latest mapped source', 'secondary'); latestButton.type = 'button';
        latestButton.setAttribute('aria-label', `View latest mapped source for ${task.title}`);
        latestButton.addEventListener('click', () => showAnchor(latestAnchor, task.title)); item.append(latestButton);
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
    const form = element('form'); form.setAttribute('aria-labelledby', heading.id);
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
        document.getElementById(`task-heading-${task.id}`).focus();
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
        document.getElementById(`task-heading-${taskId}`).focus();
      },
    }));
    item.append(renderDependencies(task, activeApplication(), {
      reportError,
      onDependencies(taskId, dependencyIds) {
        accept(setTaskDependencies(workspace, activeId, taskId, dependencyIds), 'Dependencies confirmed. Existing review reasons and completion history are retained.');
        document.getElementById(`task-heading-${taskId}`).focus();
      },
      onWorkChange(taskId, change) {
        accept(recordWorkChange(workspace, activeId, taskId, change), 'Your work change was recorded as a new event. Dependent tasks have separate review reasons; completion is retained.');
        document.getElementById(`task-heading-${taskId}`).focus();
      },
      onAcknowledge(taskId, reviewId, resolution) {
        accept(acknowledgeDependencyReview(workspace, activeId, taskId, reviewId, resolution), 'Reviewed this one change for this task. Other reasons and completion history are retained.');
        document.getElementById(`task-heading-${taskId}`).focus();
      },
    }));
    return item;
  }
  function renderWorkspace() {
    const app = activeApplication(); $('#application-workspace').hidden = !app;
    $('#application-select').replaceChildren();
    for (const application of workspace.applications) { const option = element('option', application.title); option.value = application.id; $('#application-select').append(option); }
    if (!app) return;
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
    $('#new-version').open = true; $('#version-input').focus();
    report('Fictional update filled. Preview and save it using the normal source-version controls. A 380-word essay is not automatically invalid under a 400-word maximum.');
  });
  $('#add-demo-condition').addEventListener('click', () => {
    try {
      accept(addDemoCondition(workspace, activeId), 'Conditional sample task linked with applicability Not decided. You decide whether it applies.');
      document.getElementById(`task-heading-${activeApplication().tasks.at(-1).id}`).focus();
    } catch (error) { reportError(error); }
  });
  $('#source-input').addEventListener('input', () => { originalFileText = null; sourceReadSequence += 1; $('#application-form button[type="submit"]').disabled = false; });
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
      $('#source-input').value = text; originalFileText = text; $('#source-label').value = file.name.slice(0, LIMITS.titleChars);
      report('Plain-text file loaded into the draft. Review it before creating the application.');
    } catch (error) { if (sequence === sourceReadSequence) reportError(error); }
    finally { if (sequence === sourceReadSequence) $('#application-form button[type="submit"]').disabled = false; }
  });
  $('#application-select').addEventListener('change', () => { activeId = $('#application-select').value; viewedSourceId = null; comparedSourceId = null; clearVersionPreview(); $('#version-form').reset(); clearSelection(); $('#task-form').reset(); renderWorkspace(); });
  $('#source-version-select').addEventListener('change', () => { viewedSourceId = $('#source-version-select').value; clearSelection(); renderSource(); });
  $('#comparison-version').addEventListener('change', () => { comparedSourceId = $('#comparison-version').value; renderSavedComparison(); });
  $('#use-selection').addEventListener('click', () => {
    try {
      if (viewedSourceId !== activeApplication().sources.at(-1).id) throw new Error('Choose the latest source version before linking a new task.');
      const input = $('#source-snapshot'); selectedAnchor = anchorFromSelection(activeApplication().sources.at(-1).text, input.selectionStart, input.selectionEnd);
      $('#selected-quote').textContent = selectedAnchor.quote; $('#selected-excerpt').hidden = false; $('#no-source-notice').hidden = true;
      report('Exact source excerpt selected. Add your task wording below.'); $('#task-title').focus();
    } catch (error) { reportError(error); }
  });
  $('#clear-selection').addEventListener('click', () => { clearSelection(); report('New task will have no source link.'); });
  $('#task-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const next = createTask(workspace, activeId, { title: $('#task-title').value, anchor: selectedAnchor, applicability: $('#task-applicability').value });
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
      clearVersionPreview(); clearSelection(); accept(next, 'New immutable source version added. Inspect the comparison and task reviews. Completion history is unchanged.');
      $('#version-form').reset(); $('#new-version').open = false; $('#source-changes').open = true; $('#review-overview').focus();
    } catch (error) { reportError(error); }
  });
  $('#retry-save').addEventListener('click', () => { persist(); if (!unsaved) report('Previously unsaved work is now saved on this device.'); });
  $('#prepare-backup').addEventListener('click', () => {
    try {
      $('#backup-json').value = serializeBackup(workspace);
      $('#backup-summary').textContent = `Prepared at ${new Date().toLocaleTimeString()}: ${workspace.applications.length} application(s), including any changes not saved locally. Download this file to keep a separate copy.`;
      $('#backup-preview').hidden = false; report('Backup prepared. Download it to keep a separate copy.');
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
      $('#restore-json').value = text; report('Backup file loaded. Choose Preview restore to validate and inspect it.');
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
      clearRestore(); accept(next, 'Restored applications added. Previous applications were preserved.'); $('#restore-form').reset(); restoreReadSequence += 1;
      $('#new-application').open = false; $('#current-application-title').focus();
    } catch (error) { reportError(error); }
  });
  $('#cancel-restore').addEventListener('click', () => { clearRestore(); report('Restore canceled. Existing work is unchanged.'); });
  window.addEventListener('beforeunload', event => { if (unsaved) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('storage', event => { if ((event.key === STORAGE_KEY || event.key === null) && event.newValue !== expectedRaw) showSaveStatus('Storage changed in another tab. Export this tab’s work before reloading. Further saves are checked for conflicts.', true); });
  if (initial.error) {
    showSaveStatus(`Local storage could not be loaded. ${initial.error} New work will stay only in this tab; export a backup before leaving.`, true);
    $('#download-original').hidden = typeof initial.raw !== 'string';
  } else if (initial.migrated) {
    showSaveStatus('Earlier saved data opened safely in the new format. Original stored data is unchanged until your next save. Prepare a JSON backup before editing.');
    $('#download-original').hidden = false; $('#download-original').textContent = 'Download original stored data';
  } else showSaveStatus(initial.raw === null ? 'No work saved yet. Backup & restore is available below.' : 'Loaded saved work from this device. Download backups regularly.');
  $('#new-application').open = !workspace.applications.length; renderWorkspace();
}
