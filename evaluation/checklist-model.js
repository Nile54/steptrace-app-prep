// Deliberately ordinary manual checklist for the evaluation, not a second
// traceability engine. No source update can change a row's review/completion.
const choices = ['applies', 'does-not-apply', 'not-decided'];
const fields = ['title', 'applicability', 'completed', 'review', 'note'];
function check(row) {
  if (typeof row.title !== 'string' || !row.title.trim() || row.title.length > 200) throw new Error('Enter task wording of 1–200 characters.');
  if (!choices.includes(row.applicability)) throw new Error('Choose an applicability decision.');
  if (typeof row.completed !== 'boolean' || typeof row.review !== 'boolean') throw new Error('Completion and review must each be true or false.');
  if (typeof row.note !== 'string' || row.note.length > 1000) throw new Error('Keep the note within 1,000 characters.');
}
export function createChecklist() { return { tasks: [] }; }
export function addChecklistTask(state, { title, applicability = 'not-decided', completed = false, review = false, note = '' }) {
  if (state.tasks.length >= 100) throw new Error('This evaluation checklist has reached 100 tasks.');
  const row = { id: crypto.randomUUID(), title: title.trim(), applicability, completed, review, note };
  check(row);
  return { tasks: [...state.tasks, row] };
}
export function updateChecklistTask(state, id, patch) {
  if (!state.tasks.some(task => task.id === id)) throw new Error('The selected checklist task is missing.');
  if (!patch || Object.keys(patch).some(key => !fields.includes(key))) throw new Error('Unsupported checklist field.');
  return { tasks: state.tasks.map(task => {
    if (task.id !== id) return task;
    const next = { ...task, ...patch }; check(next); return next;
  }) };
}
