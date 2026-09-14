// Authored fictional fixtures, not extracted requirements or engine output.
export const passages = [
  { id: 'essay', label: '01 · Essay', text: 'Write an essay of no more than 500 words about a learning goal and how this scholarship would support it.' },
  { id: 'recommendation', label: '02 · Recommendation', text: 'Include one recommendation letter from a teacher, mentor, or supervisor.' },
  { id: 'deadline', label: '03 · Submission date', text: 'Submit the application by October 30, 2026.' },
];

export const tasks = [
  { id: 'draft', title: 'Draft the essay', sourceId: 'essay', sourceLabel: 'Essay instructions', completedAt: '2026-09-12', completedLabel: 'September 12', dependencyNote: null },
  { id: 'proofread', title: 'Proofread the essay', sourceId: 'essay', sourceLabel: 'Essay instructions', completedAt: '2026-09-13', completedLabel: 'September 13', dependencyNote: 'Planned dependency: Draft the essay. Proofreading is a personal preparation step, not an explicit source requirement.' },
  { id: 'recommendation', title: 'Prepare the recommendation letter', sourceId: 'recommendation', sourceLabel: 'Recommendation instructions', completedAt: '2026-09-13', completedLabel: 'September 13', dependencyNote: null },
];

export const changePreview = {
  before: passages[0].text,
  after: 'Write an essay of no more than 400 words about a learning goal and how this scholarship would support it.',
  // Manually authored reasons. Real comparison and graph traversal arrive later.
  reasons: {
    draft: 'The linked essay maximum changes from 500 to 400 words. Check the existing draft against the new limit.',
    proofread: 'Proofreading depends on the draft. Review it because the essay instruction changed; edits may require another proofread.',
  },
};
