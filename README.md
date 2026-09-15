# StepTrace — Session 3

A local application-preparation workspace with immutable instructions, exact source links, human review, completion history, and JSON backups. Use fictional information in this development version. StepTrace remains a provisional name with known conflicts.

## Run

Repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.

```sh
./run.sh
./run.sh check
```

Open [the workspace](http://127.0.0.1:4173). Stop the server with Ctrl+C. No install or build step; the launcher uses Node on PATH or this Mac's bundled runtime. Other machines need Node 22+. There are no package dependencies. `dist/` contains authored source.

Use the same browser/profile, host, and port to reopen saved work, and one editing tab. A different port, `localhost` instead of `127.0.0.1`, or another browser has separate storage. Browser storage is not a backup or encryption.

## Try a real before/after flow

1. Create an application with **Fill fictional example**, or paste instructions/load a UTF-8 `.txt` file.
2. Select the essay instruction in the source snapshot, choose **Use selected excerpt**, and create a task. Mark it completed.
3. Prepare a JSON backup. Open **Add updated instructions** and paste the complete instructions with the essay maximum changed from 500 to 400 words. Add a new budget instruction.
4. Choose **Preview changes**, inspect the old/new passages, then **Save new source version**. The completed essay now needs source review. New and unlinked text stays visible in **Compare saved source versions**.
5. Expand the task's source review. Select the correct passage from the target version, choose **Use selected passage**, confirm applicability, and record the resolution. You can instead explicitly retain the task without a mapping and explain why.
6. To check version isolation, add another update before resolving the older one. Resolving the older review leaves the newer review open. The original source link and completion history remain.
7. Export, reload, and follow both original and latest mapped source links. Preview a restore in an empty workspace on another test port; applying restores all versions and decisions. Importing the same IDs into the original workspace is rejected.

Manual tasks retain **No source linked**. Task wording and applicability can be edited independently. These features do not determine eligibility, submit applications, or establish checklist completeness. Dependency propagation has not been implemented: an unlinked proofreading task is not automatically flagged when the essay changes.

## Matching and decisions

Automatic source matching requires a unique identical containing paragraph, a unique selected phrase in both documents, and unchanged immediate neighboring paragraphs or document boundaries. Formatting changes, duplicate text, changed context, uncertain matches, and selections across paragraphs need confirmation. The matcher uses text structure; it cannot interpret distant conditions or meaning.

Paragraph differences retain every nonblank passage. “Changed” pairs are positional reading aids, not proven requirement equivalence. Original whitespace remains in the complete snapshots; blank-line separators are not separate rows. Unlinked spans stay marked unreviewed even if another sentence in their paragraph has a task link.

A review resolution belongs to one review ID and one source version. It never clears a later update or removes completion events. A historical applicability resolution records the old-version decision without rewriting the current choice. See [the comparison and data design](docs/COMPARISON.md) for details and an interview explanation.

## Storage and recovery

The schema-2 workspace remains under the existing `steptrace.workspace.v1` storage key. Schema-1 saved work and backups are strictly validated and migrated in memory. Opening older work does not write storage. The original bytes remain until the next successful save and can be downloaded for recovery while that page is open. Prepare a regular backup before editing.

Saved status appears only after the write succeeds. On failure, work remains in the current tab with **Not saved** and can still be exported. Quota errors offer retry. Invalid/unreadable stored data, including a stored JSON `null`, is preserved and blocks writes. Another tab's completed write is detected before saving; simultaneous edits are not atomic.

Backups validate versions, IDs, exact quotes/ranges, histories, and review decisions. Restore previews before adding noncolliding applications; replacement, deduplication, and deletion are not implemented. Chrome file download was verified in Session 2. The in-app browser offers visible backup JSON to copy when its download does not complete. Confirm the backup file arrived.

Limits: 100 applications, 2,000 tasks, 100,000 UTF-16 code units per source, 50 versions per application, 2,000 events per history, 1,000 characters per review note, and 2 MiB JSON. New version input is pasted text; initial application creation also accepts `.txt` files. Unsubmitted forms are not saved or backed up, and other task changes can discard those drafts.

## Code to understand

| File | Responsibility |
| --- | --- |
| `dist/src/comparison.js` | Pure paragraph comparison and conservative exact-anchor matching |
| `dist/src/model.js` | Validated frozen records, immutable source versions, independent completion/applicability histories, version-specific resolutions |
| `dist/src/schema-v1.js` | Strict legacy reader retained for migration |
| `dist/src/storage.js` | Migration boundary, local saves, versioned backups, validation and additive restore |
| `dist/src/source-selection.js` | Map textarea positions to original UTF-16 text, including CRLF |
| `dist/src/review-ui.js` | Before/after passages, uncovered source text, and explicit review forms |
| `dist/src/app.js` | Interface state, source navigation, accurate save feedback |
| `scripts/serve.mjs` | Local Node server with explicit public-asset allowlist |

## Verified scope

`./run.sh check` passes **66 automated tests** plus syntax/asset/fixture checks. Browser checks verified migration, two successive updates, historical and current resolutions, exact links, reload/export equality, additive restore equality, malformed/duplicate rejection, and quota export/retry. See [CHECKS](docs/CHECKS.md) for evidence and limits.

Session 3 stops here. The [earlier Session 1 preview](http://127.0.0.1:4173/preview.html) remains scripted and includes future dependency behavior. The working workspace uses actual comparison. No OCR, scraping, LLM, remote repository, deployment, billing, or third-party text upload was added.

Later sessions must read AGENTS, BRIEF, ROADMAP, and STATE, preserve user changes and saved data, implement only their requested milestone, run relevant checks, update STATE, and make a logical local commit. The five interview questions remain in `docs/INTERVIEWS.md`; no one has been contacted.
