// Fictional briefs and an independently authored answer key. No participant data.
// The answer key describes this exercise, not semantic judgments made by the app.
function brief({ id, name, before, after, draftWords, staticQuote, addedQuote, document }) {
  const essayQuote = `Write an essay of at most ${before} words.`;
  const conflictQuote = `Portal checklist: Include a ${document}. Guide: Do not include a ${document}. Neither instruction states that it supersedes the other.`;
  const initialText = [
    `${name} Scholarship. Fictional evaluation exercise only.`,
    essayQuote,
    'Essay section ends here.',
    'Conditional documents section.',
    staticQuote,
    'Conditional documents section ends here.',
    'Recommendation section.',
    'Provide one recommendation.',
    'Recommendation section ends here.',
    'Conflicting instructions section.',
    conflictQuote,
    'Conflicting instructions section ends here.',
  ].join('\n\n');
  return {
    id, title: `${name} Scholarship (fictional brief ${id})`, initialText,
    updatedText: `${initialText.replace(essayQuote, `Write an essay of at most ${after} words.`)}\n\n${addedQuote}`,
    initialLabel: `${name} original instructions`, updatedLabel: `${name} updated instructions`,
    participantContext: `A fictional ${draftWords}-word essay has already been drafted, proofread and placed in the application package. The recommendation is complete. The person's status for either conditional document is not provided. No instruction establishes precedence between the Portal checklist and Guide.`,
    taskSpecs: [
      { key: 'draft', title: `Draft the essay (${draftWords}-word fictional draft)`, quote: essayQuote, applicability: 'applies', completed: true, dependsOn: [] },
      { key: 'proofread', title: 'Proofread the essay', quote: null, applicability: 'applies', completed: true, dependsOn: ['draft'] },
      { key: 'package', title: 'Place the proofread essay in the application package', quote: null, applicability: 'applies', completed: true, dependsOn: ['proofread'] },
      { key: 'recommendation', title: 'Request the recommendation', quote: 'Provide one recommendation.', applicability: 'applies', completed: true, dependsOn: [] },
      { key: 'staticCondition', title: 'Decide whether the original conditional document applies', quote: staticQuote, applicability: 'not-decided', completed: false, dependsOn: [] },
      { key: 'conflict', title: `Obtain clarification about the ${document} instructions`, quote: conflictQuote, applicability: 'not-decided', completed: false, dependsOn: [] },
    ],
    addedTaskSpecs: [
      { key: 'addedCondition', title: 'Decide whether the added conditional document applies', quote: addedQuote, applicability: 'not-decided', completed: false, dependsOn: [] },
    ],
    // Only substantive affected existing tasks count in this oracle. Newly added
    // tasks, unknown applicability and unresolved conflicts are scored separately.
    expectedAffectedKeys: ['draft', 'proofread', 'package'],
    expectedUnaffectedKeys: ['recommendation', 'staticCondition', 'conflict'],
    expectedUndecidedKeys: ['staticCondition', 'conflict', 'addedCondition'],
    sourceLookup: { taskKey: 'recommendation', quote: 'Provide one recommendation.' },
    comprehensionAnswer: 'Completion is a retained history. A changed requirement may affect draft, proofreading and packaged copy; review does not declare the existing draft invalid.',
    conflictAnswer: 'Leave the conflict Not decided and obtain clarification; neither label establishes precedence.',
  };
}

export const briefs = [
  brief({ id: 'A', name: 'Maple', before: 500, after: 400, draftWords: 380,
    staticQuote: 'If you are studying part-time, include a study plan.',
    addedQuote: 'If you are returning after a study break, include a return plan.', document: 'budget' }),
  brief({ id: 'B', name: 'Willow', before: 450, after: 350, draftWords: 330,
    staticQuote: 'If you are studying through distance learning, include a learning plan.',
    addedQuote: 'If you are transferring from another college, include a transfer plan.', document: 'timetable' }),
];

// Four assignments counterbalance interface order and brief order. Assign in
// this fixed rotation before observing performance; do not cherry-pick a group.
export const assignments = [
  { id: '1', periods: [{ interface: 'StepTrace', brief: 'A' }, { interface: 'Checklist', brief: 'B' }] },
  { id: '2', periods: [{ interface: 'Checklist', brief: 'A' }, { interface: 'StepTrace', brief: 'B' }] },
  { id: '3', periods: [{ interface: 'StepTrace', brief: 'B' }, { interface: 'Checklist', brief: 'A' }] },
  { id: '4', periods: [{ interface: 'Checklist', brief: 'B' }, { interface: 'StepTrace', brief: 'A' }] },
];

const adjacentText = 'Write an essay of at most 500 words.\n\nProvide one recommendation.\n\nFictional exercise ends here.';
const duplicateText = 'Write an essay of at most 500 words.\n\nEssay section ends here.\n\nProvide one recommendation.\n\nRepeated reference section.\n\nProvide one recommendation.\n\nFictional exercise ends here.';
function stress(id, initialText) {
  return { id, title: `Fictional matching stress: ${id}`, initialText,
    updatedText: initialText.replace('500', '400'),
    taskSpecs: briefs[0].taskSpecs.slice(0, 4), addedTaskSpecs: [],
    expectedAffectedKeys: ['draft', 'proofread', 'package'], expectedUnaffectedKeys: ['recommendation'],
    expectedUndecidedKeys: [],
  };
}
export const stressBriefs = [stress('adjacent-context', adjacentText), stress('duplicate-phrase', duplicateText)];

// Different from the matched primary exercise: these deliberately change an
// unresolved condition or labeled conflict while leaving the decision unknown.
export const unresolvedScenarios = [
  { id: 'negated-condition', taskKey: 'staticCondition', initialText: briefs[0].initialText,
    updatedText: briefs[0].initialText.replace('If you are studying part-time,', 'If you are not studying part-time,') },
  { id: 'labeled-conflict-update', taskKey: 'conflict', initialText: briefs[0].initialText,
    updatedText: briefs[0].initialText.replace('Guide: Do not include a budget.', 'Guide, revised edition: Do not include a budget.') },
];
