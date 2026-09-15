# StepTrace state

Updated: September 14, 2026. Current milestone: **Session 1 — complete**. Runnable fictional preview and relevant checks finished. Stop before Session 2.

## Repository and context

- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- New separate directory after inspecting the empty task workspace and Codex project files; no existing StepTrace repository was found. Unrelated files were preserved.
- Local branch: `codex/session-1`. No remote, deployment, domain, billing, AI feature, or spending.
- GitHub: user-supplied [Nile54](https://github.com/Nile54). Public profile was viewed; code was not audited. Target: tech/AI jobs and internships.
- Skills used: plain JavaScript, HTML, CSS. Skill provenance is in BRIEF.
- Working-name conflicts found; public slug deferred. See BRIEF for sources and competitors/prior art.
- Original research and full session prompts came from `/Users/nileshnandakumar/Documents/Codex/2026-09-13/ok-x20-2/outputs/`; unchanged reference copies are retained in `docs/references/`.

## What is implemented

- Fictional Maple Grove Scholarship; three exact displayed source passages and three read-only linked sample tasks.
- Real source navigation, accessible show/hide button, clear focus, responsive layout, text statuses, no auto-dismissal or animation.
- Scripted 500-to-400-word change; draft/proofread preview reasons, unchanged recommendation, and preserved sample completion dates.
- Honest copy: sample data, no saving, no actual text comparison/dependency calculation, no eligibility/completeness/submission claim, and human resolution still required.
- AGENTS, BRIEF, ROADMAP, README, CHECKS, and five interview questions. No outreach or participant evidence.

## What is not implemented

Application/task creation or edits, pasted text, real progress history, applicability decisions, persistence, backup/restore, comparison engine, dependency engine, review resolution, offline installation, AI, accounts, remote repository, hosting, and billing. Comparison/dependency/storage module responsibilities are documented; modules are intentionally not stubbed into fake engines.

## Commands and environment

```sh
cd /Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local
./run.sh
./run.sh check
```

Open `http://127.0.0.1:4173`. `Ctrl+C` stops the server. Use `PORT=4174 ./run.sh` if the port is occupied. No dependency install or build is required; `dist/` is authored source.

The shell initially had no `node` or `npm` on PATH. The launcher prefers an installed Node, then uses the existing bundled runtime. Node 22+ is required on other machines. Verification used:

- Node: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (v24.19.0).
- Git: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git`.

Use the explicit bundled git path on this Mac if system git still lacks developer tools. Do not install system tools or alter global git configuration just for this project. Tool/runtime choices can change at the user's direction.

## Checks and limitations

Primary checks passed: Node syntax/fixtures; HTTP 200 start; exact source navigation/focus; Enter/Space preview controls; exactly two reasons; unchanged three completion labels; unaffected recommendation; desktop/narrow layout with no horizontal overflow; no browser console warnings/errors observed. Detailed procedure and limitations: CHECKS.

Final checks passed: `./run.sh check`; `sh -n run.sh`; actual `PORT=4174 ./run.sh` startup; HTTP 200 for every demo asset; 404 for missing/private repository paths; GET/HEAD accepted and POST rejected. Reloading an expanded preview restored the collapsed sample and retained its three fixture completion dates. After the skip link, Tab visited the three source links and preview button in order. Final browser error/warning log was empty. Temporary viewport overrides were reset.

The milestone is recorded in the local commit named `Establish Session 1 fictional source-linked preview` (inspect with the verified git executable and `log -1 --oneline`). Commit identity uses `Codex <codex@local.invalid>` for this local setup, not a guessed personal email. No global git configuration changed. The initial system git check opened a developer-tools install prompt; it was canceled, and no software was installed. The bundled git was used instead.

Preview servers are stopped after verification. Run `./run.sh` to open the example again; the retained browser tab is a local preview, not a deployed URL.

Understandability was checked by engineering walkthrough and independent code review, not by real applicants. Full screen-reader/zoom/cross-browser/accessibility and offline/recovery checks are not done. Nothing is stored between reloads beyond the same source-code fixtures; completion retention demonstrated here is only across preview toggling.

## Unresolved questions

Instruction-change frequency; value of exact links without changes; effort compared with a simple checklist; whether people understand review versus completion; actual accessibility needs; narrower target internship role; replacement public name. No demand or outcome evidence yet. Questions to ask later are in INTERVIEWS.

## Next step — requires a new user-requested session

Session 2: read AGENTS, BRIEF, ROADMAP, STATE and the saved Session 2 prompt; inspect git and preserve user changes. Implement source-linked task creation, immutable snapshots, human applicability, reliable local persistence, and safe versioned export/import, with relevant tests. Keep storage separate. Do not implement version comparison or dependencies yet. Update STATE and make a logical local commit at that milestone's end.

**Stop after Session 1. Do not start Session 2 automatically.**
