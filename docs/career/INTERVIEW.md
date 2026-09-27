# Origin Scholar interview preparation

September 26, 2026 · formerly StepTrace · general software/tech/AI internship preparation. The product uses JavaScript, HTML and CSS; it has no AI feature.

[Fictional demo](https://originscholar.pages.dev) · [Source repository](https://github.com/Nile54/steptrace-app-prep)

**Contribution statement:** “I selected the project's scope and design direction and authorized publication. Implementation and testing were extensively Codex-assisted.” The explanations below describe verified project behavior. They do not establish that you personally wrote the code, ran the checks, or already understand every implementation detail. Rehearse the personal-understanding guide before using them in an interview.

## Five interview questions and answers

### 1. How does the app match instructions when a source changes?

It uses deterministic text rules. Automatic matching requires a selection within one unique, identical paragraph, a phrase unique across both sources after whitespace normalization, unchanged immediate neighbors or document edges, and an existing mapping to the immediately previous version when the update arrived. Formatting changes, repeated text and uncertain context require human confirmation. Original snapshots and exact offsets stay intact. These rules check local text, not meaning: a distant condition can still matter, so the app cannot establish eligibility or checklist completeness.

Sources: [comparison.js](../../dist/src/comparison.js), [model.js](../../dist/src/model.js), [COMPARISON](../COMPARISON.md), [comparison tests](../../tests/comparison.test.mjs).

### 2. How does dependency review work without erasing completed work?

People confirm which predecessor tasks a task depends on. The app rejects cycles, reverses that directed graph and traverses downstream from a nonexact source review or a reported work edit. Each affected task receives a reason tied to that event and a causal path; a diamond keeps one reason per cause/task pair. Completion is separate history. Acknowledging one reason cannot clear a newer event or another task's review. Missing links and external document edits are outside what the app observes.

Sources: [dependencies.js](../../dist/src/dependencies.js), [DEPENDENCIES](../DEPENDENCIES.md), [dependency tests](../../tests/dependencies.test.mjs).

### 3. What accessibility choices were implemented, and what evidence supports them?

The interface uses native labeled controls, visible focus, text status alongside color, keyboard source selection, and full-checklist or one-step views. Successful task edits and review decisions return focus to the task heading; errors receive focus with a route back to the control. The recorded design checks covered narrow layouts at 320/375 pixels and axe scans with zero violations on the tested landing and changed-work views. Some scan checks remained incomplete. This is bounded engineering evidence; a full WCAG audit, spoken screen-reader session and demonstrated accessibility benefit remain unverified.

Sources: [workspace.html](../../dist/workspace.html), [app.js](../../dist/src/app.js), [ACCESSIBILITY](../ACCESSIBILITY.md), [CHECKS](../CHECKS.md).

### 4. How are local data and save failures handled?

The workspace uses validated, versioned JSON in localStorage. Saving checks the previous stored bytes before writing; failure stays visibly unsaved while current in-memory work remains exportable. Schema-1/2 data migrates in memory and preserves old stored bytes until a successful save. JSON restore is previewed and additive, with conflicting IDs rejected. Separate sessionStorage holds same-tab drafts and interrupted-save recovery; drafts are excluded from backups. Browser storage is origin-specific, unencrypted and not a separate backup. Conflict detection is not atomic locking, so the workflow requires one editing tab.

Sources: [storage.js](../../dist/src/storage.js), [drafts.js](../../dist/src/drafts.js), [PRIVACY](../PRIVACY.md), [storage failure tests](../../tests/session5-storage.test.mjs).

### 5. What is the main tradeoff, and what has actually been demonstrated?

Conservative matching preserves uncertainty but can add review work. Two matched fictional evaluation scenarios flagged their three expected affected tasks with no misses or extras; two stress scenarios each added one unnecessary recommendation review. The design milestone recorded 134 passing automated tests; the historical Session 6 evaluation recorded 126. Neither count measures usefulness. Human evaluation is pending, N=0: no speed improvement, demand, user outcome or checklist advantage has been established. A consenting adult trying the prepared paired protocol is the next evidence step before expanding scope.

Sources: [EVALUATION](../EVALUATION.md), [CHECKS](../CHECKS.md), [evaluation tests](../../tests/evaluation.test.mjs), [evaluation protocol](../EVALUATION-PROTOCOL.md).

## What to understand personally

These are rehearsal tasks, not claims of demonstrated mastery. Use fictional data and explain each result in your own words.

| Topic | Practical rehearsal |
| --- | --- |
| Matching | Walk through `matchAnchor` and the model's previous-version guard. Explain why duplicate text, changed neighbors and a missing previous mapping prevent automatic confirmation. Distinguish a display pairing from a confirmed link. |
| Dependencies | Draw Draft → Proofread → Package. Trace one source-review cause, then a separate reported work change. Explain why completing or acknowledging one task leaves other event-specific reasons intact. |
| Accessibility | Navigate the fictional flow with Tab/Shift+Tab, select a source excerpt, trigger an error and return to a task. Identify intended focus/status behavior and the checks still missing. Do not claim this rehearsal until performed. |
| Persistence | Trace model validation → recovery journal → storage comparison → write → saved status. Explain a quota failure, an origin change and why a downloaded workspace backup excludes form drafts. |
| Evidence and ownership | Explain the favorable fixtures and extra-review cost together. State the contribution disclosure, N=0 and missing outcomes. Name only code decisions you can explain; describe unfamiliar parts as areas you are still learning. |

## What automation implemented or verified

Codex-assisted work produced the matching/model/storage/dependency modules, interface, regression tests, evaluation kit and release artifacts. Recorded agent-operated checks include source-history preservation, dependency propagation, validation/recovery cases, selected browser flows, responsive layout and accessibility scans. [CHECKS](../CHECKS.md) and its linked history identify the environments and omissions; [EVALUATION](../EVALUATION.md) separates synthetic results from absent participant measurements.

The user's verified role is scope/design selection and publication authorization. Automation output and passing tests do not demonstrate personal coding fluency. The app's local text processing also does not mean zero network traffic or complete privacy: static files and update checks use the network, and hosting can receive request metadata. Describe it as a fictional alpha with explained review behavior, without AI, security-certification, performance or outcome claims.
