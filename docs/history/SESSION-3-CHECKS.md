# Session 3 checks

All inputs and examples were fictional. Session 2 evidence is preserved in [history/SESSION-2-CHECKS.md](history/SESSION-2-CHECKS.md).

## Automated verification — September 15, 2026

Run `./run.sh check` from the repository. The bundled Node v24.19.0 runtime passed syntax/asset/retained-preview checks and **66 tests**:

- 19 comparison tests: exact ranges, whitespace/CRLF, duplicate paragraphs and phrases, moves, adjacent heading/context changes, additions/removals, number changes, negation, multi-paragraph selections, Unicode boundaries, complete deterministic passage coverage and a large fixture.
- 19 version/migration tests: immutable snapshots, automatic and human mappings, historical/current resolution ordering, reversion through unresolved versions, explicit no-mapping decisions, completion/applicability preservation, schema-1 fidelity, quota recovery, strict imports, version limits and near-capacity migration failure.
- 23 model/storage tests: original source invariants, independent histories, JSON roundtrip, global IDs, malformed fields, corrupt/unavailable storage, quota/security/read failures and conflicting writes. Literal stored JSON `null` is rejected and left untouched.
- 3 source-selection tests: exact repeated/Unicode/mixed-newline selections and invalid ranges.
- 2 unlinked-span tests: partially linking a paragraph cannot hide a newly added requirement; overlapping links cover only their exact union.

With Node on PATH, individual files run through `node --test tests/<name>.test.mjs`. No packages were installed. Automated tests do not establish usability, accessibility conformance, or semantic correctness.

## Actual browser verification

Used the Codex in-app browser at the normal origin `http://127.0.0.1:4173` and isolated test origins. Existing fictional Session 2 data remained in place; no browser storage was cleared.

| Check | Observed result |
| --- | --- |
| Legacy workspace opening | Schema-1 saved Maple Grove workspace opened with a migration notice, three tasks, original source and prior completion records. Migration export used schema 2. |
| Preview and immutable version | Pasted complete updated instructions: 500→400-word essay maximum and a budget statement. Preview retained one saved version until Save; saving added version 2 and flagged directly linked tasks. |
| Newer update before resolution | Added version 3 with a 350-word maximum and a transcript sentence. Both affected linked tasks had two distinct pending reviews; manual proofreading had none. |
| Historical resolution | Mapped essay version 2 to its exact 400-word excerpt and chose Applies. Version 3 remained pending; current applicability remained Not decided. Completion stayed true. |
| Current resolution | Mapped only the essay sentence in version 3 and recorded Applies. Its version 2 and 3 resolutions persisted independently; other tasks' open reviews remained. |
| Partial paragraph link | The additional “Include a transcript.” sentence remained explicitly displayed as unreviewed after the essay sentence was mapped. Other unlinked passages also remained visible. |
| Exact source and history | Original 500-word source and completion history were identical to the pre-update exported records. Latest source navigation displayed the exact 350-word excerpt at version 3. |
| Reload | Reloaded and exported. Entire workspace JSON was identical, excluding the backup envelope's fresh export timestamp. |
| Restore | Pasted the real UI's schema-2 export into empty origin 4183. Preview showed three versions without applying; applying and re-exporting yielded identical workspace data. |
| Rejected restores | Duplicate IDs disabled Add restored applications. Malformed JSON showed an error. The existing three-version workspace remained intact. |
| Quota failure/retry | At fault origin 4184, restoring the versioned backup showed Not saved after a synthetic write failure. Export still exactly matched the workspace. Retry showed saved only after the adapter's write succeeded. |
| Final UI/server checks | Original source navigation returned to version 1 and disabled new-task linking on that older snapshot. The narrow in-app before/after layout was inspected visually. No warning/error console entries were observed. App assets returned HTTP 200; repository/test paths 404; POST 405. |

No new native file-download claim is made for Session 3; Session 2's Chrome download and real file-restore evidence remains in the historical checks. This session tested migration and versioned restore through the actual paste interface. Browser selectors sometimes timed out; accessibility controls were used to complete the flow.

## Reproduce the demonstrated scenario

1. Follow README's fictional 500→400-word flow, adding `Include a short budget statement.` as a new paragraph.
2. Before resolving the essay review, add a third version changing 400→350 and appending `Include a transcript.` to the essay paragraph.
3. Resolve version 2 first; observe version 3 remains open. Then resolve only the essay sentence in version 3, retaining the transcript as unreviewed material.
4. Prepare a backup; reload and compare workspace data. Restore it on a separate empty test origin; compare again.
5. Run the development harness for quota recovery. It is excluded from the normal server's allowlist:

```sh
PORT=4183 node tests/browser-server.mjs
STEPTRACE_STORAGE_FAULT=quota-once PORT=4184 node tests/browser-server.mjs
```

On this Mac replace `node` with `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. The normal harness uses storage for its separate origin; quota-once uses synthetic in-memory storage. Stop each server with Ctrl+C.

## Limits

Matching checks immediate text context, not distant headings or global conditions. Positional changed pairs are not semantic matches. Blank-line separators are preserved but not separate diff rows. Source review does not compare actual essay files or determine whether work satisfies instructions.

Only directly linked tasks receive source reviews. There is no graph, transitive review, OCR, scraping, AI, or application submission. A no-source manual task is outside source impact detection.

Forms must be submitted to become saved records. Updating another task can discard unsubmitted drafts. Browser-local data is tied to the same browser/profile/origin; use one editing tab and separate backups. These tests do not prove transactionally safe multi-tab edits or installed offline operation.

No full screen-reader, browser-zoom, automated accessibility, or broad cross-browser audit was performed. No participant evidence or measured benefit is claimed.
