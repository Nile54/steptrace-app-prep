# Product brief

## Project and owner context

- Working name: **StepTrace**. Local folder/package identifiers are internal, not a chosen public brand or slug.
- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- User-supplied GitHub: [Nile54](https://github.com/Nile54), whose public profile displays Nilesh Nandakumar. Public profile viewed September 14, 2026; repository code was not audited.
- Target: tech/AI jobs and internships, supplied by the user September 14, 2026. Emphasize explainable software design and tested behavior; do not invent AI capabilities.
- Verified profile skills carried from the supplied research: JavaScript, HTML, CSS (and Java, unused here). The research verified the skills from LinkedIn, not GitHub code. No framework or backend skill is presumed.
- Budget: zero. Sessions 1–6 are local only.

## Problem and hypothesis

Adults managing college scholarship applications can struggle to keep instructions, tasks, and completed work aligned, especially after interruptions. A person should be able to link a task to its exact source passage and understand what to revisit when that passage changes.

The hypothesis is that a small, accessible consumer workflow makes source-linked preparation and change review useful without requiring engineering expertise. Requirements traceability and downstream review have prior art in IBM DOORS and Jama. There is no verified market gap, exclusivity, measured outcome improvement, or proven demand.

The person resolves applicability and uncertainty. The app does not decide eligibility, promise completeness, or submit applications. Completion history survives review. Accessibility is a design objective to test with people, not a medical or clinical claim.

## Scope

Session 1 established a runnable fictional preview, retained at `/preview.html`. Its 500-to-400-word essay change and two review reasons are scripted and do not affect the working workspace.

Session 2 established source-linked tasks, manual tasks, applicability choices, completion history, local storage, and previewed JSON restore. Session 3 adds immutable source versions, deterministic before/after paragraphs, conservative task mappings, and resolutions tied to individual source versions. Original sources, exact anchors, and completion records remain intact. Session 4 adds human-confirmed dependencies, separate downstream review reasons, explicit work-change reports, and recorded blockers. Session 5 improves keyboard/focus behavior, offers one-step and full checklist views, preserves same-tab drafts, and caches app files for offline loading after setup. The working interface is `/`; use fictional information during development. Actual checks and limitations are recorded in CHECKS, ACCESSIBILITY and PRIVACY.

Session 6 adds a separate local evaluation kit: matched fictional briefs, a simple manual checklist, an independent affected-task answer key, synthetic integration checks and a counterbalanced adult-volunteer protocol. Human sample size is zero; no consented participant feedback was supplied. Each matched brief produces the expected three review flags with no misses or extra flags, while adjacent-context and duplicate-phrase stress cases each produce one extra recommendation review. Those unfavorable cases expose a cost of conservative matching. They do not establish whether people perform better with StepTrace. See [EVALUATION](EVALUATION.md) for the tested version, reproducible commands and actual observations.

The scope remains source-linked preparation with optional confirmed dependencies and explained change review. Session 6 clarifies “Source-link review” and that completed work may still satisfy the instructions; it also corrects a validation mismatch in the evaluation checklist. Comparison semantics and source history are unchanged. No participant evidence justifies expansion or a market claim. A single consenting adult completing both assigned blocks is the smallest next feedback action; four complete assignment sequences are needed for balanced interface/brief order.

Automatic mapping requires a unique unchanged paragraph and selected phrase, with unchanged immediate neighboring paragraphs or document boundaries. Other mappings require a person. New unlinked text remains visible even inside partially linked paragraphs. Older acknowledgments cannot clear newer reviews. Details, limitations, and migration rules are in [COMPARISON](COMPARISON.md).

Planned core: one person/device, pasted text or plain-text files, immutable source versions, exact anchors, user-authored tasks and applicability, conservative comparison, explained dependency review, completion/work history, reliable local storage, and versioned JSON backup/restore.

Outside the core: eligibility decisions, application submission, completeness guarantees, OCR/scanned PDF ingestion, automatic web monitoring, email ingestion, real recommendation-letter handling, multi-user editing, AI-generated completeness claims, or an unjustified backend. AI, public release, career-profile changes and commercialization are outside Session 6. Prepared volunteer materials do not authorize outreach or substitute for consent.

## Architecture boundaries

| Module | Session 6 state | Responsibility |
| --- | --- | --- |
| `dist/src/demo.js` | Fictional fixtures only | Keep public demo data synthetic |
| `dist/src/app.js` | Working creation/edit/restore UI | Interface orchestration and accurate saved/unsaved feedback |
| `dist/src/model.js` | Validated immutable records | Multiple source snapshots, original anchors, mappings, independent histories and version-specific resolutions |
| `dist/src/source-selection.js` | Exact selection mapping | Map textarea LF display offsets to preserved CRLF/CR source offsets |
| `dist/src/storage.js` | Local persistence and versioned backups | Migration, explicit failures, strict validation, conflict checks, additive restore |
| `dist/src/schema-v1.js` | Retained legacy reader | Validate old records before migration |
| `dist/src/preview.js` | Earlier scripted preview only | Keep simulated future behavior distinct from saved work |
| `dist/src/comparison.js` | Implemented | Deterministic paragraph differences and conservative exact-context matching |
| `dist/src/review-ui.js` | Implemented | Old/new excerpts, unlinked spans, explicit resolution forms |
| `dist/src/dependencies.js` | Implemented | Cycle checks, historical causal propagation, and recorded blockers |
| `dist/src/dependency-ui.js` | Implemented | Confirmed linear dependencies, independent review forms, and reported work edits |
| `dist/src/dependency-demo.js` | Opt-in working example | Fictional 500→400 change through the real model |
| `dist/src/schema-v2.js` | Retained legacy reader | Preserve source and review semantics through schema-3 migration |
| `dist/src/drafts.js` | Same-tab recovery | Form drafts, view preferences and journal before workspace writes |
| `dist/src/offline.js`, `dist/sw.js` | App-file caching | Offline status, complete revisioned shell, explicit guarded updates |
| `evaluation/`, `scripts/evaluate.mjs` | Separate development evaluation kit | Matched fictional briefs, ordinary manual checklist, independent scoring and synthetic reports; no participant telemetry |

Comparison stays separate from UI and storage. Source snapshots, completion events, and review records are distinct data. Dependency and work-edit reasons remain separate from completion, with two work reports under one source version separately reviewable. Confirmed edges and recorded work changes have histories. Each downstream reason identifies its cause and one linear causal path; removing a link does not erase history. See DEPENDENCIES.md.

Storage uses schema-3 JSON under the retained `steptrace.workspace.v1` key. Schema-1/2 opening migrates in memory without writing; old bytes remain recoverable until the next successful save. Exact anchors carry source IDs, UTF-16 offsets, and quotes. Import rejects mismatched quotes, split character/newline boundaries, duplicate IDs, invalid histories, invented comparison descriptors, and unsupported schemas. Records are copied and deeply frozen. Completion and applicability have independent histories; source resolutions are version-specific. Historical resolutions do not rewrite current applicability.

Future comparison algorithm or reason-string changes require schema compatibility work: preserve an old reader/engine or explicitly migrate existing records without erasing their histories. The preserved schema-2 reader and current validation recompute the original deterministic descriptors using source versions and the decisions known at the update time.

The app writes one validated workspace per localStorage operation and only reports success after that succeeds. Quota/unavailable/conflict errors leave current work exportable in memory. Unreadable preexisting storage is preserved for recovery. Read-before-write conflict detection is not atomic cross-tab locking: use one editing tab. Prepared backups are invalidated after edits. Browser storage is not a backup or encryption. Bounds: 100 applications, 2,000 tasks, 100,000 characters per source, 50 source versions per application, and 2 MiB JSON with envelope space reserved. No deletion, replacement restore, or correction of a recorded source resolution is provided in this milestone.

Form drafts, view preferences, and an interrupted-save copy use sessionStorage separately from the saved workspace. Drafts survive redraw and ordinary reload when that storage succeeds; closing the tab, clearing storage, or a browser failure can remove them. They are not included in workspace exports. Pending workspace recovery validates the backup and checks the previous stored bytes before reopening it; conflicting saved work remains untouched. App updates wait for an explicit action and successful save/draft checks. This is best-effort recovery, not durable transactional storage. See [privacy and recovery limits](PRIVACY.md).

Offline loading requires a successful initial online setup in a supported secure context, including the local server address. The service worker caches only the complete, versioned static app shell. It does not store workspace content in its cache. Browser eviction can remove that shell. Application text is processed locally, but app files and update checks use network requests; zero network traffic is not claimed.

File downloads were verified in Chrome. The Codex in-app browser did not expose a completed download in this test; its read-only backup JSON can be copied and saved manually. Files and paste-based restoration were verified without sending text to a third-party service. Browser extensions and browser-sync behavior are outside the app's control.

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

Human usefulness and accessibility benefit remain pending. The [evaluation protocol](EVALUATION-PROTOCOL.md) separates static source lookup, setup effort and return/change review, preserves missing measurements as missing, and requires honest reporting if the checklist performs better. Passing fictional checks supports only the tested engineering behavior, not the product hypothesis.
