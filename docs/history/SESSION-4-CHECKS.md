# Session 4 checks

Completed September 20, 2026 (initial implementation and demo checks September 15; continued recovery checks September 20). Only fictional records were used. Earlier evidence is preserved in `docs/history/SESSION-3-CHECKS.md` and Session 2 history files.

## Automated checks

Run `./run.sh check` from the repository. The command checks JavaScript syntax, required assets, the retained scripted fixture, and Node's meaningful domain tests.

**82 tests passed, 0 failed.** The earlier 66 comparison, source, selection, version and storage tests remain; 15 dependency tests and 1 working-demo test were added.

New coverage:

- Direct and transitive source effects; unchanged unrelated work and completion records.
- Missing, self, duplicate and cross-application references; direct and indirect cycles.
- Multiple changed ancestors, diamond deduplication and readable causal paths.
- Two work reports under one source version, independent acknowledgments, source/work coexistence and completion separation.
- Acknowledgments across source versions and across dependent tasks.
- Open reasons when confirming later edges; removed-edge history and reversed historical paths without loops.
- Unknown applicability, incomplete required predecessors, changed Does not apply conditions and open-review blockers.
- Long iterative traversal; strict import rejection of missing/fabricated causes, paths, IDs, decisions and times.
- Schema-2 migration, original mapping/history preservation, save/reload/export/import and failed quota writes.
- Actual fictional demo operations: 500→400 words, completed fictional 380-word draft, proofreading review, unchanged recommendation and undecided added condition.

These are engineering correctness fixtures, not participant results or proof of application completeness.

## Actual browser verification

Used the real served interface in the Codex in-app browser. Used origin `127.0.0.1:4173` for the main fictional demonstration, `4185` for a separate restore, and the development-only quota-once harness at `4186`. No browser storage was cleared. Existing Session 3 sample work was preserved. The user's separate Chrome workspace was not edited.

1. Opened schema-2 data in Session 4. The UI reported migration in memory and offered original stored data. Prepared the backup through the visible UI before editing.
2. Created and confirmed the separate Cedar fictional plan. It contained three completed tasks and an explicit proofreading-to-essay dependency. The preexisting application's entire exported record was unchanged.
3. Filled the fictional 400-word update, previewed old/new passages and the added conditional study-plan instruction, then saved through the normal source-version control.
4. Verified one direct essay review and one proofreading dependency review. Both tasks remained completed. The recommendation had an exact source mapping, remained complete and had no open review. The added condition stayed visibly unreviewed until explicitly linked, then remained Not decided with an applicability blocker.
5. Compared exported records: original source snapshot and all three original completion histories were exactly equal before/after. Reloaded and compared the entire workspace from the UI backup field: equal.
6. Previewed and applied that export at the empty `4185` origin. Prepared another UI export and compared complete workspace JSON: equal, including IDs, sources, links, decisions and histories.
7. In this restored test copy, tried to make the essay depend on proofreading. The interface rejected the cycle with a focused error; no dependency decision was saved.
8. Used **I changed this work** twice on the essay, under source version 2. Proofreading showed three reasons: the source change plus two distinct work reports. Acknowledged only the first work report with a note. The source reason and second work report remained open. All completion histories remained exactly equal to the earlier backup.
9. Reloaded that copy and compared the full exported workspace again: equal, including both unique work-event IDs and the single acknowledgment.
10. Restored the resulting event-rich backup into the quota-once harness. The failed write displayed **Not saved**, preserved the full workspace in memory, and exported JSON exactly equal to the input workspace. **Retry saving** reported success only after the retry succeeded.
11. Visually inspected the linear proofreading reason, version label, causal list, blockers and independent acknowledgment form. Main demonstration remains saved with the 400-word version, essay/proofreading reviews open, recommendation complete and conditional task undecided.

Browser tests used native accessibility controls and inspected the visible backup JSON rather than injecting application state. No new native download, full accessibility audit, screen-reader audit, offline-install test or broad cross-browser certification is claimed. File-download evidence from Session 2 remains separately documented. Console observations and final command checks are recorded in STATE.

## Reproduce

```sh
./run.sh
./run.sh check
```

In the main interface follow README's **Try the working before/after example**. For isolated recovery tests, use the bundled Node path in STATE, or a working Node 22+:

```sh
PORT=4185 node tests/browser-server.mjs
STEPTRACE_STORAGE_FAULT=quota-once PORT=4186 node tests/browser-server.mjs
```

The harness is not served by the production asset allowlist. Stop its servers after checking. Use a fresh unused test origin or inspect existing data rather than clearing it. Only synthetic fixtures belong in tests and exports.
