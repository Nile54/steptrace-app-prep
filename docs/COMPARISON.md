# Source comparison and version-specific review

The Session 3 comparison engine uses deterministic JavaScript text rules and is unchanged in Session 4. It does not interpret eligibility, extract a complete checklist, or use an LLM. Session 4 dependency propagation is described separately in DEPENDENCIES.md.

## Two separate decisions

`dist/src/comparison.js` produces a before/after display and evaluates source anchors. A display row is a reading aid; it does not establish that two requirements are equivalent.

Paragraphs are consecutive nonblank lines. The comparison keeps exact excerpts and original UTF-16 offsets, including CRLF line endings. It groups paragraphs using whitespace normalization for lookup, while retaining the original text for display and storage.

| Display result | Meaning |
| --- | --- |
| Unchanged / moved exact text | A unique paragraph has identical text. Relative order crossings identify moves; inserted text alone does not make everything below it a move. |
| Formatting differs | A unique paragraph differs only in whitespace. A person still confirms its task mapping. |
| Repeated text — ambiguous | A paragraph repeats on either side, including whitespace variants. The display retains every occurrence without claiming which one survived. |
| Changed or replaced | Remaining old/new paragraphs are paired by their remaining order. This is a positional display pairing, not a proven mapping. |
| Added / removed | An unpaired paragraph remains visible on its respective side. Removed source text never deletes a task or its work history. |

Every nonblank paragraph appears once on each side. Blank-line separators are retained in the complete snapshots but are not separate comparison rows. A whitespace-only source difference is explicitly noted; inspect the complete snapshots for its original layout.

## When a task can automatically match

An automatic `exact` task mapping requires all of these conditions:

1. The selected excerpt fits inside one paragraph.
2. That complete paragraph has one match in each source, including when checking whitespace variants, and its original text is identical.
3. The selected phrase is unique across both complete sources after whitespace normalization.
4. Its immediate preceding and following paragraphs are identical, or the corresponding edge of the document remains the same.
5. The task already had a confirmed or exact mapping to the immediately previous version when the new version was added.

The new anchor receives the new source version's ID and exact offsets and quote. The task's original anchor is never replaced. An automatically matched record is identified as automatic, without claiming a new human confirmation or checklist completeness.

Whitespace-only candidates require confirmation. Repeated paragraphs or phrases are ambiguous. Changed numbers, negation, changed surrounding paragraphs, selections spanning paragraphs, and missing matches require a person to select an excerpt or explicitly retain the task without a mapping. A matching paragraph with changed neighbors can be offered as a candidate, but is not accepted automatically. A moved paragraph usually needs confirmation when its neighbors change; a moved block can retain an exact interior match if both immediate neighbors remain identical.

This guard checks nearby textual context, not meaning. A distant heading or document-wide condition may affect an otherwise identical paragraph. The app cannot prove that unchanged text remains applicable; the person must read the full instructions.

## Unlinked material stays visible

`dist/src/review-ui.js` subtracts confirmed task anchor ranges from each new paragraph. Any remaining nonblank spans are displayed as unreviewed material. Linking one sentence therefore cannot hide another sentence in the same paragraph. An unresolved candidate does not count as a confirmed link.

An overlap or even a link covering the whole paragraph only records selected text. It does not prove that all requirements were understood, that the task wording captures them, or that completed work satisfies them. Unlinked headings and explanatory text can also appear as unreviewed material; the app does not classify requirements semantically.

## Resolutions preserve history

`dist/src/model.js` appends an immutable source snapshot and one uniquely identified review record for each task originally linked to an earlier version. Manual no-source tasks receive no invented source reviews. Creating a new linked task uses an explicit selection in the latest source.

A review retains its target source version, earlier basis anchor, deterministic comparison kind, candidate anchor, and reason. Nonexact reviews remain open until the person records a resolution for that specific review ID. The resolution stores its own ID, timestamp, exact target-version anchor or `null`, applicability choice, and note. A note is required when retaining the task without a mapping. A recorded resolution cannot be replaced in this milestone.

Resolving a current-version review updates applicability history if the choice changed. Resolving an older version records its applicability as a historical snapshot only; it cannot change the latest applicability choice. Completion history is independent and survives either action. Existing legacy review flags are preserved.

New actions receive times strictly later than every existing event in that application, even within one clock millisecond or after a clock rollback. Validation reconstructs which earlier resolutions existed when each new source was added. A resolution recorded after version 3 cannot retroactively make version 2's mapping have been confirmed before version 3 arrived.

If the immediately preceding version lacked a mapping at update time, the newer review stays `unresolved`, even if the text reverted to the original wording. A last-known excerpt can be suggested for inspection, but the person must resolve the newer review separately. Resolving newer reviews also leaves older open reviews visible. Explicitly retaining a task without a mapping does not grant a mapping to subsequent versions.

## Storage and migration

Session 3 introduced schema 2. Session 4 uses schema 3 and preserves the schema-2 validator in `dist/src/schema-v2.js`; original sources, source-review rules and recorded decisions are unchanged. `dist/src/schema-v1.js` retains the strict schema-1 reader. Migration validates old records, adds empty review lists, and preserves original IDs, source text, anchors, applicability, completion history, and legacy flags.

The storage key remains `steptrace.workspace.v1` so an existing local workspace can be found. Opening schema-1 data migrates only in memory and offers the original stored data for recovery. The original stored bytes remain unchanged until a successful explicit save action. Failed validation, migration, quota, or storage access never counts as a successful save. Near-capacity data that cannot accommodate migration overhead is left untouched for recovery.

Backup envelopes and their embedded workspace versions must agree. Imports accept schema 1, 2 or 3, validate exact anchors and globally unique IDs, and recompute immutable review descriptors against the applicable source texts and historical decision times. Restore remains previewed and additive; collisions cannot replace existing applications silently. The existing one-editing-tab and separate-backup limitations still apply.

**Future matching changes require compatibility work.** Schema 2 validation depends on this matching algorithm and its deterministic reason strings. A later session must retain a reader/comparison engine for existing records or introduce an explicit schema migration before changing those rules. Never silently recompute, discard, or relabel saved review history merely because the engine changed.

Current bounds remain 100 applications, 2,000 tasks, 100,000 characters per source, 50 source versions per application, 1,000 characters per resolution note, and 2 MiB JSON with space reserved for the export envelope. No OCR, scraping or automatic requirement extraction is implemented. Dependency propagation remains separate from text comparison.

## Interview explanation

“I chose a conservative matcher because linking a completed task to the wrong requirement could give someone false confidence. It carries a link forward only when the exact paragraph and selected phrase are unique and the neighboring text is unchanged. Everything uncertain stays visible for a person to confirm. That creates extra review work, but every decision points to a specific source version, so acknowledging an old update cannot hide a newer one.”

Automated correctness checks are in `tests/comparison.test.mjs`, `tests/versions.test.mjs`, `tests/model-storage.test.mjs`, and the other files run by `./run.sh check`. Actual check results and browser evidence belong in CHECKS and STATE; this document describes the implemented rules, not a claim of user benefit or semantic accuracy.
