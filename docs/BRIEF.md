# Product brief

## Project and owner context

- Working name: **StepTrace**. Local folder/package identifiers are internal, not a chosen public brand or slug.
- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- User-supplied GitHub: [Nile54](https://github.com/Nile54), whose public profile displays Nilesh Nandakumar. Public profile viewed September 14, 2026; repository code was not audited.
- Target: tech/AI jobs and internships, supplied by the user September 14, 2026. Emphasize explainable software design and tested behavior; do not invent AI capabilities.
- Verified profile skills carried from the supplied research: JavaScript, HTML, CSS (and Java, unused here). The research verified the skills from LinkedIn, not GitHub code. No framework or backend skill is presumed.
- Budget: zero. Session 1 is local only.

## Problem and hypothesis

Adults managing college scholarship applications can struggle to keep instructions, tasks, and completed work aligned, especially after interruptions. A person should be able to link a task to its exact source passage and understand what to revisit when that passage changes.

The hypothesis is that a small, accessible consumer workflow makes source-linked preparation and change review useful without requiring engineering expertise. Requirements traceability and downstream review have prior art in IBM DOORS and Jama. There is no verified market gap, exclusivity, measured outcome improvement, or proven demand.

The person resolves applicability and uncertainty. The app does not decide eligibility, promise completeness, or submit applications. Completion history survives review. Accessibility is a design objective to test with people, not a medical or clinical claim.

## Scope

Session 1: a runnable, fictional, read-only scholarship example with three source-linked tasks and a scripted 500-to-400-word essay-limit change. Display two review reasons while keeping the draft, proofreading, and recommendation completion dates visible. A 380-word draft may already meet the new limit. No real tasks or documents are entered.

Planned core: one person/device, pasted text or plain-text files, immutable source versions, exact anchors, user-authored tasks and applicability, conservative comparison, explained dependency review, completion/work history, reliable local storage, and versioned JSON backup/restore.

Outside the core: eligibility decisions, application submission, completeness guarantees, OCR/scanned PDF ingestion, automatic web monitoring, email ingestion, real recommendation-letter handling, multi-user editing, AI-generated completeness claims, or an unjustified backend. AI, public release, career-profile changes, and commercialization are not Session 1 work.

## Architecture boundaries

| Module | Session 1 state | Future responsibility |
| --- | --- | --- |
| `dist/src/demo.js` | Fictional fixtures only | Keep public demo data synthetic |
| `dist/src/app.js` | Render fixtures and show/hide preview | Interface orchestration |
| `dist/src/storage.js` | Not created | Session 2: persistence, validation, backup/restore boundary |
| `dist/src/comparison.js` | Not created | Session 3: deterministic differences and conservative matching |
| `dist/src/dependencies.js` | Not created | Session 4: graph validation and explained review propagation |

Do not scatter future comparison, graph, or storage implementations through UI handlers. Source versions, completion records, and uniquely identified review reasons will be distinct data. Two work edits under one source version must remain separately reviewable. Do not design those engines in Session 1.

## Known overlap and prior art

These are documented overlaps from the supplied September 13 research, not a hands-on audit or proof that competitors lack other features. The original research is retained under `docs/references/`.

| Existing approach | Relevant overlap |
| --- | --- |
| [Goblin Tools Compiler](https://goblin.tools/Compiler) and Magic ToDo | Convert text to tasks and break work down |
| [Visualping scholarship alerts](https://visualping.io/blog/how-to-get-scholarships-alerts) | Monitor scholarship-page changes |
| [ScholarshipOwl](https://intercom.help/scholarshipowl/en/articles/4143280-how-do-i-apply-for-scholarships) | Application requirements and status |
| [SLiMS tracker](https://slims.pk/scholarship-application-tracker/) | Readiness tracking; describes local storage and backups |
| [AI-Scholar-Hunt](https://github.com/Asad-Aziz-001/AI-Scholar-Hunt) and [funded](https://github.com/SubarnaZen/funded) | Scholarship planning/checklists; funded includes a local browser approach |
| [IBM DOORS suspect links](https://www.ibm.com/docs/en/engineering-lifecycle-management-suite/doors/9.7.2?topic=data-suspect-links-changed-objects) and [Jama suspect links](https://help.jamasoftware.com/en/manage-content/coverage-and-traceability/relationships/clear-suspect-links.html) | Established traceability, change impact, and downstream review |
| Ordinary checklist or spreadsheet | Baseline to compare setup effort and usefulness against |

## Working-name check — September 14, 2026

An obvious-conflict web search found [StepTrace crypto AI agents](https://steptrace.dev/), a [StepTrace browser-testing extension](https://chromewebstore.google.com/detail/steptrace/kjgggipjlffblobkealmgbbgeggfomlp?hl=en), and a [StepTrace fitness app](https://play.google.com/store/apps/details?id=com.hiredintech.steptrace). These are name conflicts, distinct from workflow competitors. Keep the name provisional. No public slug, domain, remote repository, or hosting project was chosen or reserved. Revisit the name before public release; this was a quick conflict check, not an exhaustive availability search.

## Assumptions and unresolved questions

1. Do instruction changes occur often enough to justify a return workflow? This is the weakest demand assumption.
2. Does source-linked planning help even when instructions do not change?
3. Is creating/maintaining the plan less work than using an ordinary checklist or spreadsheet?
4. Can people explain why completed work needs review without thinking it has been erased or declared wrong?
5. Which accessibility needs and terminology emerge from actual adult applicants? No diagnosis is required or assumed.
6. Which internship role within tech/AI should later career material target? Current stack remains JavaScript/HTML/CSS until a concrete need justifies more.
7. What working name should replace StepTrace before a public slug is chosen?

No interviews, participant results, market validation, or revenue exist. The prepared questions are in `INTERVIEWS.md`.
