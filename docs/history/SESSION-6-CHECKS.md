# Checks — Session 6

September 22, 2026. These are engineering checks; **human evaluation is pending (N=0)**. See [EVALUATION](../EVALUATION.md) for version, protocol, observations and limits. Previous accessibility/offline checks remain in [history/SESSION-5-CHECKS.md](SESSION-5-CHECKS.md).

## Actual automated results

```sh
./run.sh check
STEPTRACE_TESTED_REVISION=862291e+session6-working-tree ./run.sh evaluate
```

**126 tests passed, 0 failed, 0 skipped**, plus JavaScript syntax, assets and fictional preview assertions. Node v24.19.0 on macOS. Local output: ignored `work/session6-final-checks.txt`. Structured result: `docs/evaluation/synthetic-results.json`.

- 114 existing regressions: source selection/comparison/coverage, dependency and version-specific review, migration/import/storage, draft recovery and offline behavior.
- 10 new evaluation tests: matched complexity and balanced sequences; independent scoring with wrong/missing/duplicate/unknown choices; actual A/B model/storage integrations; context/duplicate stress burden; negation and labeled conflicts; explicit applicability versus mapping acknowledgment; original/current exact lookup after restore.
- 2 baseline/server tests: separate manual statuses, inert notes and invalid operations; actual HTTP assets, model-byte equality, refused uploads and unserved worker/docs/scorer/query routes.
- A/B each catch all 3 affected roles, with 0 misses and 0 extra reviews. Each stress fixture adds 1 unchanged recommendation review, counted as burden.
- Simulated quota save returns failure and preserves saved bytes; histories, sources and unresolved choices survive storage/JSON round trips.
- `git diff --check` clean. No matching-rule, schema or dependency addition.

## Actual real-interface checks

Used Codex in-app browser, fictional data and separate origins 4196/4197. Run `./run.sh evaluate-ui`; for the second origin, `PORT=4197 ./run.sh evaluate-ui`. The kit disables offline setup visibly. No user storage was cleared.

1. Manual checklist: create row, complete, reveal update. Review remains unchecked until chosen. Selecting review retains completion. Invalid blank wording reverts to retained title with an error; exported record agrees.
2. Load generated A-before backup through the actual file chooser, preview six tasks, then restore. This engineering shortcut is forbidden during participant timed setup. Exact-source lookup selects “Provide one recommendation.” in version 1.
3. Paste A's update, preview 500/400 and added condition, save version 2. UI shows 1 direct/2 dependent reviews. Four completion records survive; recommendation is unaffected; original condition and conflict remain Not decided.
4. Added return-plan text is unreviewed before a task is created. Select its exact excerpt, add task without deciding applicability: 7 tasks, 3 undecided choices.
5. Malformed restore shows an error. Workspace objects in exports before/after are exactly equal. Reload/export also compares exactly equal, with 4 completed and 3 undecided tasks. Duplicate-ID preview rejects the repeated backup.
6. Add version 3 with “Guide (revised edition)” in the conflicting budget passage. Conflict remains Not decided with a new open source review. The unresolved essay mapping also gets a newer event; earlier reasons/completion remain.
7. Export that state, preview/apply on empty origin 4197, re-export. Entire workspace objects compare exactly equal. Original version-1 recommendation source remains reachable.
8. Visually inspect participant page: fictional/pending notice, assigned brief, context and copyable source readable at desktop size.

Test/session handles expired during an interruption; restarting and reopening the same origin recovered saved work without recreation. A browser automation selector timed out reading the backup after reload; the visible read-only JSON was read through its accessibility tree instead. Neither issue was treated as a passed assertion without checking the result.

## Observed fixes and limits

Conservative stress flags can concern uncertain links without changed meaning. Related-work labels now say **Source-link review**; task status explains that completed work may still satisfy instructions. Matching descriptors remain unchanged for schema compatibility. This is a wording correction, not measured comprehension improvement.

Baseline invalid wording now reverts to its retained value; notes announce on leaving the field rather than every keystroke. Protocol practice text, practice isolation and a 30-second pause are fixed and reproducible.

No participant outcomes, new screen-reader/axe/zoom/mobile study, timing/effort advantage, demand or willingness to pay were measured. B was exercised automatically, not as another full browser walkthrough. No fresh browser quota/crash/offline injection or download-to-disk verification in Session 6; automated failure tests ran and earlier browser evidence remains separately dated.

Test servers are stopped at handoff. Restart with commands above; keep one editing tab and separate backups. Public release and monetization were not performed.
