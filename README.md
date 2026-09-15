# StepTrace — Session 2

A local application-preparation workspace with exact source links, human decisions, completion history, and JSON backups. Use fictional information in this development version. StepTrace remains a working name with known conflicts; no public slug has been chosen.

## Run locally

Repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.

From this repository:

```sh
./run.sh
```

Open [the local workspace](http://127.0.0.1:4173). Stop with **Ctrl+C**. `PORT=4174 ./run.sh` uses another port, with a separate browser workspace.

The launcher uses Node on PATH or this Mac's existing bundled Codex runtime. Other machines need Node.js 22 or later. There are **no package dependencies** and no install/build step. With Node on PATH, `node scripts/serve.mjs` also works. Opening the HTML directly as a file is unsupported because the app uses JavaScript modules.

Keep using the **same browser, host, and port** to find saved work. `localhost` and `127.0.0.1`, different ports, and different browsers have separate storage. Use one editing tab. Browser storage is not a backup and is not encrypted by this app.

## Try the working flow

1. Choose **Fill fictional example**, review the instructions, and choose **Create application**. Alternatively paste text or load a UTF-8 `.txt` file. The snapshot is read-only after creation.
2. Highlight a passage in **Source snapshot**, then choose **Use selected excerpt**. Enter your own task wording, choose **Applies / Does not apply / Not decided**, and add the task.
3. Choose **View exact source** to highlight the original excerpt. **Edit wording or applicability** changes the task without changing its source link or completion history.
4. Add a task without selecting an excerpt to create an explicitly labeled **No source linked** task. Mark tasks completed and inspect **Completion & decision history**. Applicability and review remain separate from completion.
5. Choose **Prepare JSON backup**, then **Download JSON backup**. The visible read-only JSON also provides a copy fallback. Export includes any changes that failed to save locally.
6. Paste a backup or choose its JSON file, then **Preview restore**. Review its applications before choosing **Add restored applications**. Existing work stays intact; an application already present is rejected by ID, even when names differ.
7. Reload and return to an exact source link. To verify restoration, use an empty workspace on a separate test port; importing into the original workspace correctly reports duplicate IDs.

The committed `tests/fixtures/fictional-instructions.txt` contains repeated passages, CRLF line breaks, a condition, and harmless HTML-looking text for testing. No real application documents are included. A checklist does not establish eligibility or prove that every source requirement was captured.

## Storage and recovery

Valid changes save to this browser's `localStorage`. A successful status appears only after the storage write succeeds. If a save fails, the latest changes remain in this open tab with a **Not saved** message; prepare and download a backup before leaving. Quota failures offer **Retry saving**.

Unreadable or unavailable storage blocks writes instead of replacing existing data. When unreadable bytes are available, **Download unreadable stored data** preserves them separately. A valid backup can still be inspected and restored into memory, then exported, while saving is blocked.

Backups have a named format and schema version. Import validates sizes, IDs, timestamps, fields, source references, quotes, and histories. Restore adds disjoint applications only; it does not replace existing applications or merge their histories. Duplicate IDs are rejected, and the merge is checked again when applied. Save checks detect storage changes already written by another tab; `localStorage` cannot guarantee atomic simultaneous edits across tabs.

Chrome successfully downloaded a JSON backup during verification. The in-app browser did not expose an observable completed native download in that check; use the visible JSON copy fallback or open the workspace in Chrome when making a downloaded backup. Confirm that the file arrived. This browser limitation did not indicate corrupted backup data.

Limits: 100,000 UTF-16 code units per source, 200 per title/label, 100 applications, 2,000 tasks in total, 2,000 events per history, and a 2 MiB JSON payload. Saved work reserves space for its backup envelope.

## Code to understand

| File | Responsibility |
| --- | --- |
| `dist/index.html`, `dist/styles.css` | Semantic forms, source/task layout, status messages, and focus styles |
| `dist/src/app.js`, `bootstrap.js` | UI orchestration; render user content with `textContent` or input values; show save results and restore previews |
| `dist/src/model.js` | Validate and return fresh, deeply frozen workspaces; retain one immutable snapshot per application; append decision/completion events |
| `dist/src/source-selection.js` | Map textarea selections to untouched source text, including CRLF/CR normalization |
| `dist/src/storage.js` | Local save/load boundary, versioned JSON backup validation, conflict detection, and additive restore |
| `dist/src/demo.js`, `preview.js`, `dist/preview.html` | Preserved Session 1 fictional data and scripted change-review example |
| `scripts/serve.mjs` | Node's built-in HTTP server, bound to `127.0.0.1`, serving an explicit asset allowlist |

A source link stores a snapshot ID, UTF-16 start/end offsets, and the exact quote. Validation checks `source.text.slice(start, end) === quote`; repeated text is identified by its selected position. Offsets cannot split a CRLF pair or a Unicode surrogate pair. Source text stays unchanged even when a textarea displays normalized line breaks.

An honest interview explanation: “I made source links verifiable and storage failures visible. Task wording can change while its source reference stays fixed. Completion is an append-only history, separate from applicability and review. Restore validates a preview and never silently overwrites current applications.”

## Checks and milestone boundary

```sh
./run.sh check
```

This passes syntax/fixture checks and **26 automated tests**. Actual browser flow, file restore, inert text, save-failure/retry, and layout checks are recorded separately in `docs/CHECKS.md`; they are not automated end-to-end tests or accessibility certification.

Session 2 is complete. [The earlier change-review example](http://127.0.0.1:4173/preview.html) remains **scripted**. Version comparison, dependency propagation, and review resolution are not implemented; Session 3 has not started. There are no accounts, analytics, third-party text uploads, AI features, billing, remote repository, or deployment.

Later sessions must read `AGENTS.md`, `docs/BRIEF.md`, `docs/ROADMAP.md`, and `docs/STATE.md`. Five interview questions remain in `docs/INTERVIEWS.md`; no participants have been contacted and no usability or demand results are claimed.
