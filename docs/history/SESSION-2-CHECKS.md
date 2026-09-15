# Session 2 checks

Run from the repository:

```sh
./run.sh check
./run.sh
```

Open [the local workspace](http://127.0.0.1:4173). All checked content is fictional. Session 3 comparison and dependency behavior must not be inferred from these results.

## Automated checks — September 14, 2026

`./run.sh check` passed with the existing Node v24.19.0 runtime and no installed packages. It checks JavaScript syntax, required assets, and the retained Session 1 fixture, then runs **26 tests**:

- **23 model/storage tests:** immutable source retention, repeated/Unicode quote offsets, manual tasks, separate applicability/completion/review, append-only history, exact reload and backup roundtrip, safe text retention, additive restore, global ID collisions, invalid references/fields/enums/timestamps/histories, size limits, corrupt/unavailable storage, quota/security/read failures, and optimistic conflicts. CRLF and surrogate-pair splits are rejected in direct creation and import.
- **3 source-selection tests:** repeated text after Unicode and mixed line endings, multiline CRLF selection retained through backup/restore, and invalid/empty selections.

With Node 22+ on PATH, run those tests directly:

```sh
node --test tests/model-storage.test.mjs tests/source-selection.test.mjs
```

On this Mac without Node on PATH:

```sh
/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/model-storage.test.mjs tests/source-selection.test.mjs
```

The automated text-retention test does not prove DOM inertness. That behavior was checked through the real browser interface below.

## Manual browser verification — September 14, 2026

Primary browser: Codex in-app browser. Supplementary browser: Chrome for native backup download and restore by pasted JSON. Browser engine versions were not recorded.

| Scenario | Observed result |
| --- | --- |
| Create/edit/link | Created fictional Maple Grove from the supplied example, linked its essay passage, edited task wording/applicability, and retained completion. View exact source selected offsets 0–105. |
| Manual and conditional tasks | No-source task displayed its explicit label. A conditional task retained **Does not apply**, independent of completion. |
| Reload and export | Exported workspace data remained byte-equivalent after reload; only a newly generated backup export timestamp differed. Source links still worked. |
| Restore by pasted JSON | Restored into an isolated browser origin with identical workspace data. Duplicate/current IDs and malformed JSON were rejected; existing work stayed unchanged. |
| Additive restore | Preview stated that the original application would remain. Applying a distinct second application left the original application exactly unchanged. |
| Plain-text file | Loaded `tests/fixtures/fictional-instructions.txt` through the in-app file chooser. Export retained its CRLF line breaks. The selected second `Include a study plan.` matched raw offsets 126–147. |
| Untrusted content | HTML-looking source and task text remained inert. Inspection found zero image or script elements inside the main content. |
| Quota failure and retry | The real UI with an injected quota-once adapter showed **Not saved**. Export contained the unsaved application; retry subsequently saved it. |
| Unavailable storage | UI reported the load error. New work remained unsaved and could be exported. |
| Actual downloaded backup | Chrome created `/Users/nileshnandakumar/Downloads/steptrace-backup.json`. The file passed `parseBackup`, was copied to ignored `work/browser-export.json`, and was restored through the in-app file chooser on port 4177 with working source links. |
| Layout | Inspected desktop width 1280 visually. Narrow width 360 had no measured horizontal document overflow. |
| Final handoff | Reopened the saved three-task example, followed the essay link to offsets 0–105, and observed no warning/error console entries. App assets returned HTTP 200, repository/test paths 404, and POST 405. |

The in-app browser's native download did not expose an observable completed file during testing. Its visible JSON copy fallback worked. Chrome's actual download was validated; no backup corruption was observed. Chrome automation's file chooser required its extension's **Allow access to file URLs** setting, which was not enabled; file selection was tested in the in-app browser instead. These are tool/browser limitations, not completed cross-browser coverage.

## Repeat the browser checks

1. Create the fictional example, select an exact passage, add a task, edit it, choose applicability, and mark it completed. Add a no-source task. Check the separate labels and history.
2. Export and reload on the same browser/host/port. Return to the original source and compare the workspace data, allowing the backup envelope's export timestamp to change.
3. Preview and cancel a restore; confirm no existing work changes. Preview duplicate IDs and malformed JSON; confirm rejection. Restore a disjoint backup and compare the original application before and after.
4. Load `tests/fixtures/fictional-instructions.txt`. Select the second repeated study-plan instruction, export, and confirm its quote, raw offsets, and unchanged CRLF text. Inspect source/task rendering for inert HTML-looking content.
5. Download a backup in Chrome and verify that the file arrived. Restore that real file into an isolated empty workspace, then follow an exact source link. A separate test port intentionally has separate storage.
6. Use the fault harness below to check **Not saved**, export of unsaved work, and retry. Keep test tabs separate from the normal editing workspace.

The browser harness is development-only and is not exposed by the normal server's asset allowlist. With Node on PATH, run one command per terminal and stop each with Ctrl+C:

```sh
PORT=4177 node tests/browser-server.mjs
STEPTRACE_STORAGE_FAULT=quota-once PORT=4175 node tests/browser-server.mjs
STEPTRACE_STORAGE_FAULT=unavailable PORT=4176 node tests/browser-server.mjs
```

On this Mac, replace `node` with `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. Open the corresponding `http://127.0.0.1:PORT` URL. The normal harness uses real browser storage; fault modes use a synthetic in-memory adapter that resets on reload. `quota` and `corrupt` are also available for further manual checks; only quota-once and unavailable UI checks are claimed above. Corrupt storage protection is covered by the automated tests.

## Retained preview and limits

`/preview.html` retains the Session 1 scripted 500-to-400-word example. Its prior source navigation, keyboard show/hide, three unchanged fixture completion dates, and two authored review reasons were checked in Session 1. The fixture is still checked automatically. Those reasons are not outputs of an implemented comparison or dependency engine.

Local storage checks detect an already-written change from another tab; they do not provide atomic multi-tab transactions. Use one editing tab and keep downloaded backups. Form drafts that have not been submitted are not workspace records or part of a backup.

No real applicants, interviews, or human understandability study were involved. No full screen-reader, zoom, automated accessibility, offline/service-worker, or broad cross-browser audit was performed. Do not claim WCAG conformance, measured usability benefit, or working change-analysis algorithms. No remote repository, deployment, AI feature, billing, or third-party text upload was added.
