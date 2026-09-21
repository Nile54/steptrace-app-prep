# StepTrace state

Updated September 20, 2026. **Session 4 — complete. Stop before Session 5.**

## Repository and scope

- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- Branch: `codex/session-4`, started from `4b1d27d` (Session 3). Initial working tree was clean. Earlier files, exact source data and saved fictional browser work were preserved.
- Prior STATE and CHECKS are archived in `docs/history/SESSION-3-STATE.md` and `SESSION-3-CHECKS.md`. Original research/session prompts remain in `docs/references/`.
- User: GitHub [Nile54](https://github.com/Nile54), targeting tech/AI jobs and internships. Stack remains JavaScript, HTML and CSS with no package dependencies added.
- StepTrace is still a provisional name with documented conflicts. No public slug was selected. Competitors/prior art and demand assumptions remain in BRIEF.
- Only Session 4 was implemented: confirmed dependencies, explained review propagation, reported work edits and compatible persistence. No Session 5 offline/accessibility expansion, OCR, scraping, LLM, real application documents, outreach, remote repository, push, deployment, billing or spending.

## Implemented

- Plain **This step depends on…** checklist interaction with explicit confirmation. Empty confirmation removes current links; all decisions retain history. Self, duplicate, missing, cross-application and cyclic references are rejected.
- Direct and transitive dependency reviews from each nonexact source review. Each affected task receives one reason per unique cause with its own ID, arrival time, historical causal path and optional acknowledgment. Diamond paths do not duplicate the same cause.
- **I changed this work** requires a person's note and creates a unique work event. Two edits under one source version remain separately reviewable. No external-file observation is claimed.
- Source reviews, downstream reviews, applicability and completion remain distinct. Acknowledging one event on one task leaves other events, other tasks and newer source versions open. Completion history is never reset by a change/review.
- Removing links preserves already-recorded reasons. New links account for unresolved source and inherited dependency reasons. Historical paths remain understandable if current edges differ.
- Recorded blockers show unknown applicability, open reviews and incomplete applicable predecessors. Does not apply skips a branch's completion requirement while its own changed-condition review still blocks. Conflicts remain for the person to resolve; the app does not infer precedence from notes.
- Schema 3 retains schema-1/2 compatibility. Opening older data migrates in memory, preserving old stored bytes until a successful save. Imports validate historical graph decisions and replay expected cause/path records, rejecting missing/invented reasons and invalid acknowledgments.
- Opt-in working Cedar fixture: completed fictional 380-word essay, proofreading and recommendation; confirmed essay dependency; real preview/save of 500→400 words and added condition; explicit creation of that condition as Not decided. Existing work is not declared invalid.

## Architecture and decisions

- `dist/src/dependencies.js`: iterative cycle detection, reversed-graph traversal, historical event replay, causal descriptions and recorded blockers.
- `dist/src/model.js`: validated immutable records and explicit dependency/work/review actions. `schema-v2.js` preserves the old validator alongside `schema-v1.js`.
- `dist/src/storage.js`: schema-3 export, schema-1/2/3 import, read-only migration and honest local-save recovery.
- `dist/src/dependency-ui.js`: linear controls, individual review forms and histories; `app.js` orchestrates saves and focus.
- `dist/src/dependency-demo.js`: fictional example through the real domain API, with a model test.
- `dist/src/comparison.js` is unchanged. Original text, exact anchors and comparison reason semantics remain intact. See COMPARISON before modifying them.
- Read `docs/DEPENDENCIES.md` for the algorithm, schema, edge-history behavior, tradeoffs and interview explanation.

## Actual checks

- `./run.sh check`: **82 passed, 0 failed**, plus syntax/assets/scripted-fixture checks. 66 existing tests + 15 dependency tests + 1 working-demo test.
- Covered direct/transitive effects, unaffected work, cycles/invalid references, multiple ancestors/diamonds, two same-version work edits, version-isolated acknowledgments, edge changes, historical path loops, blockers, strict restore validation, migration and quota failures.
- Main real-browser demonstration: one direct essay review, one proofreading reason, all three completion histories retained, recommendation unchanged/no open review, added condition Not decided. Existing Session 3 application's exported record and original Cedar source/completion histories compared exactly equal.
- Full workspace equality verified after reload and UI export/import to isolated origin `4185`. In that restored copy, a cycle was rejected; two work reports produced distinct reasons; acknowledging the first left the second and source review open. Completion remained unchanged. The resulting workspace survived another reload exactly.
- The event-rich export restored in the quota-once harness at `4186`: failed save showed Not saved, unsaved export equaled the input workspace, retry reported success only when the write succeeded.
- Linear causal-review layout visually inspected. No warning/error console entries appeared in the three checked tabs. Detailed procedure and limits: `docs/CHECKS.md`. No new full cross-browser, screen-reader, accessibility-conformance or offline audit. No participants, interviews, measured user benefit or market validation.

## Run and handoff

```sh
cd /Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local
./run.sh
./run.sh check
```

Open `http://127.0.0.1:4173`. Choose **Cedar Scholarship — dependency example (fictional)** in the saved demo browser, or create your own fictional example using **Try a fictional dependency example**. README has the full before/after sequence. The app uses actual saved data; only `/preview.html` remains the earlier scripted preview.

The main server is left running for the demonstration; use `./run.sh` if it later stops. Ctrl+C stops a server started in your terminal. Test servers are stopped at handoff. Different browser/profile, host or port means different saved data. Use one editing tab; the user's separate Chrome workspace was not edited.

- Node: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (v24.19.0). Other machines need Node 22+.
- Git: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git`.
- No installation is needed. Avoid triggering an OS developer-tools install just to run system git/python.
- Milestone commit subject: `Add confirmed dependencies and independent work review`. Use the verified git executable with `log -1 --oneline` for its ID. Command-scoped `Codex <codex@local.invalid>` identity; no global identity changes.

## Limits and unresolved questions

- Propagation follows only confirmed relationships. Missing links, semantic instruction conflicts and remote-file edits are not detected. Conservative matching may request extra review; it cannot prove eligibility or completeness.
- A work report made before any downstream link exists remains historical, without retroactive flags when links are later added. Existing open downstream reasons can propagate to newly linked work. Confirm dependencies before reporting edits to track their effects.
- One historical path is retained per cause/task, not every possible route. Names displayed along a path use current task titles. Full event replay favors correctness for small local workspaces; large dense histories are not performance-benchmarked.
- Resolutions/acknowledgments cannot be corrected or reopened in this milestone. New updates/reports get new reasons. Legacy review flags remain visible without an invented cause or automatic resolution.
- Applicability/conflict decisions rely on the person. The app cannot determine whether an acknowledgment note actually resolves uncertainty. No-recorded-blockers is limited to the recorded plan, not readiness to submit.
- Unsubmitted form drafts are not persisted/exported; another action can discard them. Browser storage can be cleared and is not encryption, atomic multi-tab locking or installed offline support. Back up separately.
- Additive restore only; no replacement/deletion/deduplication. Bounds: 100 applications, 2,000 tasks across the workspace, 50 source versions/application, 100,000 characters/source, 2,000 dependency decisions and work reports each/application, 2,000 dependency reviews/task, 1,000 characters/note and 2 MiB JSON with envelope space reserved.
- Instruction-change frequency, setup effort, accessibility needs, source-link usefulness, exact target role and replacement public name remain unresolved. Five interview questions are prepared; nobody was contacted.

Only on a new Session 5 request: read AGENTS, BRIEF, ROADMAP, STATE and the saved prompt; preserve user changes/data; address the authorized accessibility, offline and recovery milestone; run relevant checks, update STATE, commit logically, then stop.

**Session 4 is the stopping point.**
