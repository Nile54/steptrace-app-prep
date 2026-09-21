# StepTrace — Session 4

A local application-preparation workspace with immutable instructions, exact source links, confirmed task dependencies, human review, completion history, and JSON backups. Use fictional information in this development version. StepTrace remains a provisional name with documented conflicts.

## Run

Repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.

```sh
./run.sh
./run.sh check
```

Open [the workspace](http://127.0.0.1:4173). No install or build step; the launcher uses Node on PATH or this Mac's bundled runtime. Other machines need Node 22+. There are no package dependencies. `dist/` contains authored source. Stop a server started in your terminal with Ctrl+C.

Use the same browser/profile, host, and port to reopen saved work, and one editing tab. A different port, hostname, or browser has separate storage. Browser storage is not a backup or encryption.

## Try the working before/after example

1. Open **Try a fictional dependency example** and choose **Create and confirm fictional plan**. This creates a separate sample application and explicitly confirms that proofreading depends on the essay. Three tasks start completed; the fictional draft is described as 380 words.
2. Inspect **This step depends on…** in the proofreading task. Prepare a JSON backup before changing the instructions.
3. Choose **Fill fictional 400-word update**, then **Preview changes** and **Save new source version**. Inspect the old/new essay instruction and added conditional study-plan text.
4. The essay has a direct source review; proofreading has its own causal review. All original completion records survive. The unchanged recommendation remains complete without an open review. The app does not declare the 380-word draft invalid.
5. The new conditional text is visible as unreviewed material. **Add undecided conditional task** creates an exact source link with applicability **Not decided**. A person decides whether it applies.
6. Use the essay's source review to confirm a new excerpt and applicability. Review proofreading separately and record what you checked. Acknowledging one task or event does not clear the others.
7. Under the essay, open **I changed this work**, describe a fictional revision and record it. Proofreading receives another reason even without new instructions. Repeat to create a second independent reason; review only one and inspect the other.
8. Export, reload, and preview the export on a separate test origin to restore it. Dependencies, exact sources, work reports, review decisions, and completion history survive.

The example uses the same model and save operations as other applications. Its data is fictional. The separate `/preview.html` page remains the original scripted Session 1 preview.

## Dependencies and review

Choose predecessors using **This step depends on…**, then **Confirm dependencies**. Circular, missing, and cross-application references are rejected. Source changes that require human review flag downstream tasks through the confirmed links. Each reason retains its originating event and a linear causal chain. A diamond-shaped dependency produces one reason per task for that event, rather than duplicate copies.

Removing links does not erase previous reasons. New links account for still-open related changes. A source acknowledgment, a downstream acknowledgment, and a completion event are distinct decisions. Two work reports under the same source version remain separate events. The app knows about external work changes only when a person reports them.

Unknown applicability, open review reasons, and incomplete applicable predecessors remain visible as blockers. **No recorded blockers for this step** refers only to the recorded plan; it never means eligible, complete, or ready to submit. When instructions conflict, leave the review open until you decide or obtain clarification. **Does not apply** decisions remain in history and receive review when their linked source changes.

See [dependency design](docs/DEPENDENCIES.md) for the algorithm, migration rules, limits, and an interview explanation.

## Source matching

Automatic source mapping requires a unique identical paragraph and selected phrase plus unchanged immediate neighbors or document boundaries. Formatting, duplicate text, changed context, uncertain matches, and multi-paragraph selections need human confirmation. Matching uses text structure, not meaning or distant conditions.

Every nonblank passage stays visible. Positional changed pairs are reading aids, not proven equivalents. Exact snapshots preserve whitespace and offsets. Unlinked spans remain unreviewed even inside partly linked paragraphs. Historical source decisions cannot clear newer reviews or overwrite current applicability. See [comparison design](docs/COMPARISON.md).

## Storage and recovery

Schema-3 data uses the existing `steptrace.workspace.v1` key. Schema-1 and schema-2 workspaces and backups are strictly validated and migrated in memory. Opening old work does not write storage; original bytes remain available until the next successful save. Prepare a separate JSON backup before editing.

A failed save displays **Not saved** and leaves current work exportable in the tab. Quota failures offer retry. Invalid data is preserved and blocks writes. A completed write from another tab is detected before saving; simultaneous edits are not atomically locked.

Restore validates exact quotes, IDs, versions, histories, dependency graphs, event causes and causal paths. It previews before adding disjoint applications. Replacement restore, deletion, and deduplication are not implemented. The visible JSON field provides a copy fallback if downloading does not complete. Confirm that a backup file arrived; a prepared field alone is not a separate backup.

Limits include 100 applications, 2,000 tasks, 100,000 characters per source, 50 source versions per application, 1,000 characters per review note, and 2 MiB JSON. Unsubmitted forms are not saved/exported and other task changes can discard drafts. Source versions accept pasted text; initial applications also accept UTF-8 `.txt` files.

## Code to understand

| File | Responsibility |
| --- | --- |
| `dist/src/comparison.js` | Deterministic paragraph comparison and conservative exact matching |
| `dist/src/dependencies.js` | Cycle checks, graph traversal and causal propagation |
| `dist/src/model.js` | Validated immutable records and explicit human actions |
| `dist/src/schema-v1.js`, `schema-v2.js` | Preserved legacy readers |
| `dist/src/storage.js` | Local saves, migration, backups and additive restore |
| `dist/src/source-selection.js` | Textarea positions mapped to preserved source offsets |
| `dist/src/review-ui.js`, `dependency-ui.js` | Source decisions, dependency controls, causal lists and separate reviews |
| `dist/src/dependency-demo.js` | Opt-in fictional scenario through the real domain API |
| `dist/src/app.js` | Interface orchestration and honest save feedback |

Actual automated and browser results are recorded in [CHECKS](docs/CHECKS.md) and [STATE](docs/STATE.md). No usability improvement, complete accessibility conformance, market demand, or semantic eligibility accuracy is claimed.

Session 4 stops after dependency review. No OCR, scraping, LLM, remote repository, deployment, billing, spending or outreach. Later sessions must read AGENTS, BRIEF, ROADMAP, and STATE, preserve user changes and data, implement only the requested milestone, run relevant checks, update STATE, and make a logical local commit.
