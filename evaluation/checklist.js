import { briefs } from './fixtures.js';
import { createChecklist, addChecklistTask, updateChecklistTask } from './checklist-model.js';
const $ = selector => document.querySelector(selector);
const work = new Map(briefs.map(brief => [brief.id, { checklist: createChecklist(), updated: false }]));
const labels = { 'not-decided': 'Not decided', applies: 'Applies', 'does-not-apply': 'Does not apply' };
const currentBrief = () => briefs.find(brief => brief.id === $('#brief-select').value);
const current = () => work.get(currentBrief().id);
function node(tag, text) { const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result; }
function message(text) { $('#error').hidden = true; $('#message').textContent = text; }
function error(error) { $('#message').textContent = ''; $('#error').textContent = error.message; $('#error').hidden = false; $('#error').focus(); }
function invalidateExport() { $('#export-panel').hidden = true; }
function change(id, patch, announce = true) {
  try { current().checklist = updateChecklistTask(current().checklist, id, patch); invalidateExport(); if (announce) message('Checklist change recorded in this tab.'); return true; }
  catch (problem) { error(problem); return false; }
}
function renderRows() {
  $('#rows').replaceChildren();
  for (const row of current().checklist.tasks) {
    const li = node('li');
    const titleLabel = node('label', 'Task wording'); titleLabel.htmlFor = `wording-${row.id}`;
    const title = node('input'); title.id = titleLabel.htmlFor; title.value = row.title; title.maxLength = 200; title.required = true; title.autocomplete = 'off';
    title.setAttribute('aria-label', `Task wording: ${row.title}`);
    title.addEventListener('change', () => {
      if (!change(row.id, { title: title.value })) title.value = current().checklist.tasks.find(task => task.id === row.id).title;
    });
    li.append(titleLabel, title);
    for (const [key, label] of [['completed', 'Completed'], ['review', 'Review needed — your choice']]) {
      const wrapper = node('label'); wrapper.className = 'check';
      const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = row[key]; checkbox.setAttribute('aria-label', `${label}: ${row.title}`);
      checkbox.addEventListener('change', () => change(row.id, { [key]: checkbox.checked }));
      wrapper.append(checkbox, node('span', label)); li.append(wrapper);
    }
    const applyLabel = node('label', 'Applicability'); applyLabel.htmlFor = `applicability-${row.id}`;
    const select = node('select'); select.id = applyLabel.htmlFor; select.setAttribute('aria-label', `Applicability: ${row.title}`);
    for (const [value, text] of Object.entries(labels)) { const option = node('option', text); option.value = value; select.append(option); }
    select.value = row.applicability; select.addEventListener('change', () => change(row.id, { applicability: select.value }));
    const noteLabel = node('label', 'Notes'); noteLabel.htmlFor = `notes-${row.id}`;
    const note = node('textarea'); note.id = noteLabel.htmlFor; note.value = row.note; note.rows = 2; note.maxLength = 1000; note.spellcheck = false;
    note.addEventListener('input', () => change(row.id, { note: note.value }, false));
    note.addEventListener('change', () => message('Note recorded in this tab.'));
    li.append(applyLabel, select, noteLabel, note); $('#rows').append(li);
  }
}
function renderBrief() {
  const brief = currentBrief();
  $('#brief-title').textContent = `${brief.id}: ${brief.title}`;
  $('#context').textContent = brief.participantContext;
  $('#original-source').value = brief.initialText; $('#updated-source').value = brief.updatedText;
  $('#progress-context').textContent = `For this exercise, after creating the plan record these fictional pieces of work as already completed: ${brief.taskSpecs.filter(task => task.completed).map(task => task.title).join('; ')}. Proofreading uses the draft; preparing the packet uses the proofread draft. The word count in the scenario describes fictional work, not a file this page inspects.`;
  $('#update').hidden = !current().updated; $('#show-update').disabled = current().updated;
  $('#add-task').reset(); invalidateExport(); renderRows(); message('Assigned brief opened. Your other brief’s rows remain in this tab.');
}
$('#brief-select').addEventListener('change', renderBrief);
$('#show-update').addEventListener('click', () => { current().updated = true; $('#update').hidden = false; $('#show-update').disabled = true; invalidateExport(); message('Updated source sheet revealed. Your checklist rows are unchanged.'); $('#updated-source').focus(); });
$('#add-task').addEventListener('submit', event => {
  event.preventDefault();
  try { current().checklist = addChecklistTask(current().checklist, { title: $('#row-title').value, applicability: $('#row-applicability').value }); $('#add-task').reset(); invalidateExport(); renderRows(); message('Task added to the manual checklist.'); $('#row-title').focus(); }
  catch (problem) { error(problem); }
});
$('#export-checklist').addEventListener('click', () => {
  $('#checklist-json').value = JSON.stringify({ format: 'steptrace-evaluation-checklist', schemaVersion: 1,
    briefId: currentBrief().id, updateRevealed: current().updated, checklist: current().checklist }, null, 2);
  $('#export-panel').hidden = false; message('Checklist record prepared. Copy it if needed; reloading loses this worksheet.'); $('#checklist-json').focus();
});
renderBrief();
