# Confirmed dependencies and independent review reasons

Session 4 adds user-confirmed task relationships and explained review propagation. It uses ordinary JavaScript records and graph traversal, without observing external files or deciding whether work satisfies an application. Source comparison remains unchanged; see [COMPARISON](COMPARISON.md).

## The person's interaction

On each task, **This step depends on…** presents other tasks in the same application as a checklist. The person selects the predecessor work this task uses and confirms the selection. Confirming an empty selection removes current links. No relationship is inferred from task wording, source proximity, completion, or applicability.

Each change to that selection appends a dependency decision. Reconfirming the same set is a no-op. Missing tasks, references to another application, repeated IDs, self-dependencies and cycles are rejected before anything is saved. Both direct and indirect cycles are invalid: if proofreading depends on drafting, drafting cannot also depend on proofreading or on a later step that depends on proofreading.

**I changed this work** records a required note and a unique work-change event. It means the person reports an edit; StepTrace has not inspected an essay, document, or external editor. The report flags dependent tasks while leaving the reported task's completion and source reviews unchanged. Two reports under the same source version remain two separate events.

The interface uses linear task lists and ordered causal chains. A graph visualization is not required.

## Three independent records

| Record | What it means |
| --- | --- |
| Completion history | The person's previous complete/not-complete choices. A change or review never erases these records. |
| Source review | An exact source-version mapping or a human decision about a nonexact mapping. Each update has its own review ID. |
| Dependency review | The effect of one particular source review or reported work change on one dependent task, with its own acknowledgment. |

A task can therefore be **Complete** and **Needs review** at the same time. Changing a title, applicability or completion checkbox does not acknowledge any review. An unchanged unrelated task receives no dependency reason.

A nonexact source review is a cause even if it represents formatting, ambiguity or uncertain context rather than a proven substantive change. Exact mappings are not causes. The conservative policy asks a person to check potentially affected work instead of declaring it incorrect. The same applies to an existing 380-word essay after a maximum changes from 500 to 400 words: the app requests review and retains its completed record; it does not count the essay or declare it invalid.

## How propagation works

`dist/src/dependencies.js` stores the graph in the direction the person describes: a task points to its required predecessors. The latest recorded selection for each task determines the current graph.

Before accepting a selection, an iterative traversal follows its proposed predecessors. If it can reach the task being edited, the selection would form a cycle and is rejected. Iterative traversal avoids using the JavaScript call stack for long dependency chains.

For propagation, the module reverses the graph so an upstream task can find the tasks that use its work. A breadth-first traversal visits all reachable dependents. Each receives one review for that cause, containing:

- Its own unique review ID.
- The unique cause ID: a nonexact source-review ID or a work-change ID.
- The time the reason first reached this task.
- A path of task IDs from the original changed task to this task.
- Either no resolution or a separate acknowledgment ID, time and required note.

A diamond-shaped graph can offer more than one route to the same task. The traversal retains one deterministic, shortest route for that propagation and one reason per cause/task pair. It does not duplicate the reason for every possible path. Two changed ancestors have different cause IDs and generate separate reasons even when they affect the same dependent task. Later source versions also create new IDs, so acknowledging an older update cannot clear a newer one.

An explanation reads, for example, “Review Proofread the essay because the source instructions linked to Draft the essay changed or need confirmation.” The ordered list shows the intervening tasks for longer chains. Paths retain task IDs; displayed names use the tasks' current titles.

## Historical links and acknowledgments

Removing a dependency changes future relationships, but leaves earlier review reasons and causal paths intact. An old path explains how review reached a task at the time; it need not match the graph today.

Adding a relationship also checks relevant review already open at that time:

1. An unresolved source review can reach newly connected downstream tasks.
2. An open dependency review can carry its original cause and historical path onward through newly connected work.
3. A path cannot repeat a task. Previously recorded tasks are excluded when extending that historical chain.

This prevents adding a link from hiding an existing upstream review. Causes already recorded on a target task are not duplicated or reopened merely because links change. A different source update or work report is a new cause and requires its own review.

There is a deliberate boundary for work reports: **a report made before any dependent task was linked remains history and is not automatically backfilled when a link is created later.** Unlike an unresolved source review, a work report is not a pending review on the reported task itself. An existing open downstream reason can carry that work report onward; a report with no such reason does not. The person should confirm links before reporting edits whose effects they want tracked.

Acknowledgment applies only to the selected dependency review. It does not acknowledge an ancestor, another dependent, another source version, or another work report. Resolving the originating source mapping likewise does not automatically acknowledge downstream work. A person may record a dependent's review while an ancestor's review remains open; the ancestor still appears among that task's recorded blockers.

Acknowledgments and source resolutions cannot be replaced in this milestone. If instructions conflict, the interface asks the person to leave the relevant review open while deciding or obtaining clarification. The app cannot determine from free-text notes whether a conflict has actually been resolved.

## Recorded blockers

The interface deliberately says **No recorded blockers for this step**, never that the whole application is ready or complete. The check traverses the task and its current predecessors, deduplicating tasks reached through multiple paths. It reports:

- **Not decided** applicability on the task or an encountered predecessor.
- Open source/dependency review reasons or retained legacy review flags.
- A predecessor marked **Applies** that is not recorded complete.

The target task's own incomplete status is not a predecessor blocker; this check describes whether recorded upstream work allows that step to proceed. Its completion remains visible separately.

A person's **Does not apply** choice skips that predecessor branch's completion requirement and further ancestors. Its own open reviews are checked first, so a changed source condition still demands review. The earlier applicability choice and its history survive the change. Nothing automatically changes an unknown condition to Applies or Does not apply.

## Schema 3 and recovery

`dist/src/model.js` keeps the schema-2 source and task fields and adds:

| Location | Added data |
| --- | --- |
| Application | `dependencyHistory`: uniquely identified, ordered snapshots of a task's confirmed predecessor IDs |
| Application | `workChanges`: uniquely identified reports with task ID, time, then-current source version and note |
| Task | `dependencyReviews`: cause IDs, historical paths, arrival times and independent acknowledgments |

Every mutation returns a validated, deeply frozen copy. Action times advance strictly within an application even when the clock moves backward or several actions occur in one millisecond. Source causes from one update can share the source's time; their stable order follows application task order.

Validation first projects unchanged source/history fields through the preserved `schema-v2.js` validator. It then checks global ID uniqueness, bounds, task ownership, chronological decisions, graph cycles, source versions current at reported work times, and acknowledgment records. Finally, it replays source causes, work reports and dependency decisions in time order to reconstruct the expected dependent reasons. Acknowledgment times determine whether an earlier reason was still open when a later link was confirmed. Imported reasons must have exactly the expected cause, arrival time, order and path. Missing reasons, fabricated causes and invented paths are rejected instead of silently accepted or repaired.

Replay validates the recorded history's internal consistency; it does not authenticate who made an edit or prove the truth of a note.

`dist/src/storage.js` exports schema-3 envelopes and accepts matching schema-1, schema-2 and schema-3 backups. Older workspaces are validated before migration. Migration adds empty dependency/work histories and reason lists without inventing old relationships or changing exact anchors, IDs, source resolutions, applicability or completion records.

The storage key remains `steptrace.workspace.v1`. Opening an older workspace migrates in memory only; original stored bytes remain until an explicit action saves successfully. Restore is previewed and additive, and duplicate IDs cannot silently overwrite work. A failed save leaves current work exportable and does not claim success. Browser storage remains local to its browser/profile/origin and is not a separate backup; use one editing tab.

## Boundaries and checks

Propagation covers only the relationships a person recorded. Missing dependencies, remote document edits and the meaning of instructions are outside the algorithm. A preserved historical path explains one route, not every route. The app neither measures word counts nor verifies eligibility, checklist completeness or application readiness.

The existing limits still apply: up to 2,000 tasks across the workspace, 2,000 dependency decisions and work reports each per application, 2,000 dependency reviews per task, notes up to 1,000 characters, and a 2 MiB JSON payload with export-envelope space reserved. Full history replay prioritizes validation and explainability for a small local workspace; it is not a benchmarked large-project graph service.

`tests/dependencies.test.mjs` exercises direct/transitive effects, unaffected work, invalid references and cycles, multiple ancestors and diamond paths, separate work reports under one source version, acknowledgments across versions, edge changes and historical paths, readiness blockers, long iterative traversal, strict restore validation, schema-2 migration, reload/export/import, and quota failure. The fictional demo is also checked through its model operations. Actual run results and browser observations belong in [CHECKS](CHECKS.md) and [STATE](STATE.md); this document describes the implemented behavior.

## Interview explanation

“I model each task's confirmed predecessors as a directed graph. When a source requirement needs review, or a person reports editing work, I walk downstream and attach a separate reason to every affected task. Each reason keeps its original event ID and a readable causal path, so checking one change cannot hide a newer change. Completion is a different history and never gets erased. The tradeoff is that the app can only follow relationships the person recorded, and conservative source matching can create extra review work. It explains what to revisit; it does not decide whether someone's application is correct.”
