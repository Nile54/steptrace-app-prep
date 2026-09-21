# StepTrace state

Updated September 15, 2026. **Session 3 — complete. Stop before Session 4.**

## Repository and scope

- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- Branch: `codex/session-3`, started from `20b56d2` (Session 2). Initial working tree was clean. Existing files and saved fictional browser work were preserved.
- Prior STATE and CHECKS retained in `docs/history/SESSION-2-STATE.md` and `SESSION-2-CHECKS.md`. Original research and session prompts remain in `docs/references/`.
- User: GitHub [Nile54](https://github.com/Nile54), targeting tech/AI jobs and internships. Continue the verified JavaScript, HTML, CSS stack; no package dependencies added.
- StepTrace is still a working name with documented conflicts. Public slug deferred. Competitors/prior art and unresolved demand assumptions remain in BRIEF.
- Only Session 3 was implemented. No dependency graph/propagation, work-edit tracking, OCR, scraping, LLM, real application documents, outreach, remote repository, push, deployment, billing, or spending.

## Implemented

- New immutable source versions from complete pasted instructions, with before-save comparison preview and version navigation. Initial application creation still accepts pasted text or UTF-8 `.txt` files.
- Deterministic paragraph differences: unchanged, moved, whitespace, repeated/ambiguous, changed display candidates, additions and removals. Old/new exact text remains available; blank-line separators remain in full snapshots.
- Conservative exact mappings require unique paragraph and selected phrase plus unchanged immediate neighbors or document edges. Formatting, repeated phrases, changed context and uncertain mappings need explicit confirmation. Multi-paragraph selections require manual mapping.
- Original task anchors never change. Later automatic/confirmed anchors carry their own source version IDs and exact UTF-16 positions/quotes.
- Each linked task receives a distinct review for each later version. Resolutions store exact target mappings or an explicit no-mapping decision, applicability and a note. No-mapping decisions require a note. Completion histories are untouched.
- Older review acknowledgments cannot clear newer updates. A later version created while the previous mapping was unresolved remains separately unresolved, even after older confirmation or a reversion to original wording.
- Historical applicability resolution is stored for that version only; current-version resolution appends current applicability history when changed. Old legacy review flags remain separately labeled.
- Unlinked source spans stay visible as unreviewed material, including a new sentence inside a partially mapped paragraph. Overlap is never a completeness claim.
- Schema 2 with strict schema-1 migration. Same storage key `steptrace.workspace.v1`; load migration is in memory without writes. Schema-1/2 backups restore additively with preview; incompatible/corrupt data is preserved.
- Fixed a migration edge case: a stored JSON `null` is invalid data, not an empty key, and cannot be silently overwritten.
- Clear save failures and export of unsaved versioned work remain available. No source or task text is interpreted as HTML.

## Architecture to read

- `dist/src/comparison.js`: pure deterministic comparison and source matching.
- `dist/src/model.js`: schema-2 validation, append-only source/review histories, migration and domain operations.
- `dist/src/schema-v1.js`: strict legacy validation retained for migration.
- `dist/src/storage.js`: read-only migration, conflict-aware saves, versioned JSON validation and additive restore.
- `dist/src/review-ui.js`: before/after display, exact unlinked spans, human resolutions.
- `dist/src/app.js` and `source-selection.js`: UI orchestration and original-text source navigation.
- Full tradeoffs and compatibility obligations: `docs/COMPARISON.md`.

Schema-2 validation depends on the current comparison algorithm and deterministic reason strings. Later algorithm changes must retain an appropriate legacy reader/engine or explicitly migrate records. Never recompute or delete past review descriptors silently.

## Verification

- `./run.sh check`: **66 tests passed**, plus syntax, required assets, and retained Session 1 fixture checks. Counts: 19 comparison, 19 versions/migration, 23 model/storage, 3 selection, 2 unlinked-span tests.
- Fictional fixtures cover unchanged text, formatting/CRLF, duplicate paragraphs/phrases, paragraph moves, additions/removals, changed numbers, negation, changed separate headings, Unicode, uncertain multi-paragraph links, historical resolutions, migration limits, malformed imports and save failures.
- Real browser: opened prior Session 2 data, exported schema 2, added 500→400-word version 2 with a budget instruction, then 350-word version 3 with a transcript sentence before resolving the older review.
- Confirming version 2 did not clear version 3 or change the latest applicability. Confirming only the essay sentence in version 3 left the transcript explicitly unreviewed. Other task reviews stayed open; manual proofreading received no invented dependency review.
- Original source record and completion history compared exactly equal to their pre-update exports. Full workspace equality verified after reload and after restoring the UI export into isolated origin 4183.
- Duplicate restore disabled Apply; malformed JSON showed an error while existing work stayed intact. Quota-once origin 4184 reported Not saved, exported the entire versioned workspace unchanged, then reported success only after retry succeeded.
- Original and latest mapped source navigation worked. Earlier snapshot views disable linking new tasks. Narrow in-app comparison layout inspected visually; no warning/error console entries observed in the checked main tab.
- Browser controls used accessibility actions after some selector reads timed out. No new Session 3 native download or full cross-browser/zoom/screen-reader audit is claimed. Session 2 native-file evidence is preserved separately.
- Detailed procedures: `docs/CHECKS.md`. No real participants, interviews, usability benefit, eligibility accuracy or market validation is claimed.

## Run and handoff

```sh
cd /Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local
./run.sh
./run.sh check
```

Open `http://127.0.0.1:4173`. The local preview server was left running for the browser demonstration; if unavailable later, use `./run.sh`. Ctrl+C stops a server started in your terminal. Temporary recovery-test servers were stopped. Changing browser/profile, hostname or port changes the saved workspace; use one editing tab.

- Node runtime: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (v24.19.0). Other machines need Node 22+.
- Git: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git`.
- No installation is needed. The normal shell lacks a working system Node/git toolchain; avoid OS developer-tools installation just to run commands.
- Milestone commit subject: `Add immutable source versions and version-specific review`. Use the verified git executable with `log -1 --oneline` for its exact ID. Command-scoped `Codex <codex@local.invalid>` identity; no global git changes.

## Limits and unresolved questions

- Matching checks nearby textual context, not meaning or distant document-wide conditions. A person reads the complete instructions. Extra review is an intentional tradeoff.
- The paragraph display pairs unmatched leftovers by order; changed pairs are not proven equivalents. Blank-line separators are not independent diff rows.
- A resolution is permanent in this milestone; correction/reopening is not implemented. New updates receive new review records. Legacy flags without version reasons remain separate and cannot be resolved by newer source-review actions.
- Unsubmitted form drafts are not saved/exported; changing another task can discard drafts. Forms should be submitted one at a time. LocalStorage can be cleared and is not encryption, atomic multi-tab coordination, or an installed offline mode.
- Restore adds disjoint applications only; no replacement, deduplication or deletion. Bounds: 50 versions/application, 100 applications, 2,000 tasks, 100,000 characters/source, 1,000 characters/review note, 2 MiB JSON with backup space reserved.
- New source versions currently accept paste only; initial applications also accept text files.
- Instruction-change frequency, setup effort, source-link usefulness, accessibility needs, exact target role and a replacement public name remain unresolved. Five interview questions are in INTERVIEWS; no one was contacted.

Only on a new Session 4 request: read AGENTS, BRIEF, ROADMAP, STATE, COMPARISON and the saved Session 4 prompt; inspect user changes and current data. Implement user-confirmed acyclic dependencies and independent direct/transitive source/work-change reasons while retaining completion, original mappings and version-specific resolutions. Preserve schema-1/2 compatibility. Run relevant checks, update STATE, make a logical local commit, then stop.

**Session 3 is the stopping point.**
