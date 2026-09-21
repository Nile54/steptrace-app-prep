// Fictional, opt-in fixtures use the same domain operations as a person's plan.
import { createApplication, createTask, updateTask, setTaskDependencies } from './model.js';

export const demoBefore = [
  'Fictional Cedar Scholarship. For demonstration only.',
  'Write an essay of at most 500 words.',
  'Essay section ends here.',
  'Recommendation section.',
  'Provide one recommendation.',
  'Recommendation section ends here.',
].join('\n\n');
export const conditionalQuote = 'If you are applying part-time, include a study plan.';
export const demoAfter = `${demoBefore.replace('500', '400')}\n\n${conditionalQuote}`;

function excerpt(text, quote) {
  const start = text.indexOf(quote);
  if (start < 0) throw new Error('The fictional excerpt is not present in this source.');
  return { start, end: start + quote.length, quote };
}

export function createDependencyDemo(workspace) {
  let next = createApplication(workspace, { title: 'Cedar Scholarship — dependency example (fictional)', text: demoBefore, label: 'Fictional original: 500-word maximum' });
  const appId = next.applications.at(-1).id;
  const specs = [
    ['Draft the essay (fictional 380-word draft)', 'Write an essay of at most 500 words.'],
    ['Proofread the essay', null],
    ['Request recommendation', 'Provide one recommendation.'],
  ];
  const taskIds = [];
  for (const [title, quote] of specs) {
    next = createTask(next, appId, { title, anchor: quote ? excerpt(demoBefore, quote) : null, applicability: 'applies' });
    const taskId = next.applications.at(-1).tasks.at(-1).id;
    taskIds.push(taskId);
    next = updateTask(next, appId, taskId, { completed: true });
  }
  next = setTaskDependencies(next, appId, taskIds[1], [taskIds[0]]);
  return next;
}

export function addDemoCondition(workspace, appId) {
  const app = workspace.applications.find(item => item.id === appId);
  if (!app || app.sources.at(-1).text !== demoAfter) throw new Error('Save the fictional 400-word update first.');
  if (app.tasks.some(task => task.anchor?.quote === conditionalQuote)) throw new Error('This fictional conditional task is already linked.');
  return createTask(workspace, appId, { title: 'Prepare a study plan if the condition applies', anchor: excerpt(demoAfter, conditionalQuote), applicability: 'not-decided' });
}
