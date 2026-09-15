# StepTrace state

Updated September 14, 2026. **Session 2 — complete. Stop before Session 3.**

## Repository and retained context

- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- Branch: `codex/session-2`, created from Session 1 commit `07eb46e`. The initial working tree was clean. No unrelated files or user changes were replaced.
- Session 1 state is retained in `docs/history/SESSION-1-STATE.md`; original research/session prompts remain in `docs/references/`. The earlier scripted demo is at `/preview.html`, separate from the working workspace at `/`.
- User GitHub: [Nile54](https://github.com/Nile54). Target: tech/AI jobs and internships. Stack remains JavaScript, HTML, CSS and built-in Node modules; no dependency installation.
- StepTrace remains a working name with known conflicts. Public slug deferred; competitors, prior art, assumptions, and name-search sources remain in BRIEF.
- No remote repository, push, deployment, domain, paid service, billing, AI feature, outreach, or real application document was added.

## Implemented this milestone

- Create applications from pasted text or UTF-8 `.txt` files. Review the draft, then retain one immutable source snapshot.
- Select exact source excerpts with pointer or keyboard, create linked tasks, and return to the selected occurrence. Links store source-version ID, UTF-16 offsets, and exact quote. File CRLF/CR text remains intact despite the textarea's LF display.
- Add explicitly labeled no-source tasks; edit wording; retain Applies / Does not apply / Not decided choices without deciding eligibility.
- Completion and applicability have distinct append-only histories. Review state is separate and is not cleared by completion or wording/applicability edits. No real change analysis or review resolution exists yet.
- Local persistence and versioned JSON export/import. The full workspace can be exported, including in-memory work after a failed save. Prepared backups are invalidated by later workspace edits.
- Strict import validation: format/version, size, required fields, types, timestamps, history consistency, unique global IDs, source references, exact quotes and ranges, whole newline/character boundaries.
- Restore previews list incoming applications/counts and current work. Applying adds only disjoint applications; duplicate IDs or malformed material are rejected without replacing current work. Same-ID older backups cannot overwrite a current application in this session.
- Quota/unavailable/read/conflict failures are visible. Existing corrupt/unknown stored data is preserved, new work stays in memory, and the original raw data can be downloaded for recovery. Another tab's completed write is detected before saving; simultaneous writes are not transactionally coordinated.
- Asynchronous file reads use generation guards and disable submission while reading. Stale reads cannot change an already prepared restore. Damaged UTF-8 is rejected instead of silently replacing source characters.

## Commands and environment

```sh
cd /Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local
./run.sh
./run.sh check
```

Open `http://127.0.0.1:4173`. Stop with Ctrl+C. `PORT=4174 ./run.sh` changes the port, but also changes the browser storage origin. Use the same browser/profile, hostname, and port to reopen saved work. Use one editing tab. Chrome is the verified browser for downloading backup files.

No install/build step. `dist/` contains authored source. The shell still has no normal Node/npm toolchain on PATH; the launcher uses the existing bundled Node v24.19.0 (Node 22+ on another machine).

- Node: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
- Git: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git`

Do not trigger a system developer-tools install just to use git. Runtime/tool choices remain subordinate to later user choices.

## Verification

- `./run.sh check`: **26 tests passed**, plus JavaScript syntax and static fixture checks. Tests cover immutable sources, repeated/Unicode/CRLF anchors, preserved histories/review state, JSON roundtrip, invalid import variants, duplicate IDs, safe additive merge, unavailable storage, quota failures, corrupt stored data, and read-before-write conflicts.
- Real in-app browser workflow: created fictional application, selected excerpt, added linked/manual/conditional tasks, edited wording/applicability, completed a task, reloaded, and returned to exact source. Re-exported workspace matched the original after reload (export timestamp excluded).
- Backup restored by paste in an isolated origin: exact workspace equality. Duplicate and malformed restores were rejected; existing records were unchanged. A second, disjoint application restored additively while the original application remained identical.
- Real UTF-8 text-file chooser flow: `tests/fixtures/fictional-instructions.txt`. Export retained CRLF. The second repeated “Include a study plan.” linked to raw offsets 126–147. Markup-like source/task text remained text; no image/script nodes were created in the app's main content.
- Actual Chrome JSON download produced a valid backup in Downloads. Its contents were validated with `parseBackup`, copied to ignored `work/browser-export.json`, and restored through the in-app browser file chooser. Exact source link and completion records survived.
- Browser fault harness: quota failure showed “Not saved” and allowed exporting the unsaved application; retry then showed success only when a write succeeded. Unavailable storage showed a clear error and still allowed export. No user browser settings or real stored data were cleared for these tests.
- Desktop 1280px layout inspected; 360px narrow viewport had no horizontal overflow; source focus and semantic controls checked. Full screen-reader, browser-zoom, automated accessibility, and broad cross-browser audits are not claimed.
- Final recovery check: reopening the browser retained the saved three-task example and selected its exact essay source at offsets 0–105; no warning/error console entries were observed. HTTP checks confirmed app assets return 200, repository/test paths return 404, and POST returns 405. Independent read-only code review found no milestone blockers.
- Details and reproducible procedures: `docs/CHECKS.md`. Tests use fictional data only. No adult participants, usability outcomes, market validation, or revenue are claimed.

The logical local commit is named `Implement source-linked tasks and reliable local backups`; inspect its exact ID with the verified git executable and `log -1 --oneline`. It uses the same command-scoped `Codex <codex@local.invalid>` identity as Session 1, without changing global git settings.

## Current limits

- Session 3 comparison and Session 4 dependencies are not implemented. No automatic extraction, coverage/completeness claims, eligibility decisions, or submission.
- One immutable source per application in schema 1. A later source-version schema needs explicit migration while preserving these records and backups.
- Browser storage can be cleared/evicted and is not encryption. Save failure keeps work only in the current page until the person downloads/copies a backup. Form drafts are not persisted until submitted.
- Restore adds only applications with noncolliding IDs; replacement, deduplication, and application deletion are deferred. Current bounds: 100 applications, 2,000 tasks, 100,000 characters per source, and 2 MiB JSON with backup-envelope space reserved.
- The Codex in-app browser did not expose a completed file download during this check. Its visible backup JSON can be copied to a UTF-8 `.json` file; Chrome download was verified. Chrome automation file selection was blocked by its extension's file-access setting, which was left unchanged; actual file restore was verified in the in-app browser instead.
- LocalStorage conflict detection is read-before-write, not an atomic multi-tab transaction. Use one editing tab. This milestone has no service worker or installed offline mode.
- Primary local preview and temporary test servers are stopped after handoff checks. Run the launcher to resume. Synthetic browser records remain at the test origins; no real application data was used.

## Unresolved questions and next step

Instruction-change frequency, source-link value without changes, plan setup effort versus a checklist, understanding review versus completion, actual accessibility needs, narrower target internship role, and replacement public name remain open. The five interview questions are still in INTERVIEWS; no one was contacted.

Only on a new Session 3 request: read AGENTS, BRIEF, ROADMAP, STATE, inspect git/user changes, and read the saved Session 3 prompt. Implement new immutable versions, deterministic comparison and conservative exact-source matching, direct task review reasons and version-specific resolutions. Preserve schema-1 data with a tested migration if needed. Do not implement transitive dependency propagation until Session 4. Run relevant checks, update STATE, make a logical local commit, then stop.

**Session 2 is the stopping point.**
