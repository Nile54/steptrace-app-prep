# Origin Scholar state

Updated September 24, 2026. **Design milestone before Session 8: implementation and local checks complete; professional-subdomain publication in progress.**

Repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`. Continue this repository. GitHub owner **Nile54**, remote `https://github.com/Nile54/steptrace-app-prep.git`. MIT unchanged. Prior state and release details preserved in `docs/history/SESSION-7-*`.

## Authorized scope / outcome

User chose **Origin Scholar**, navy/cream/gold, a landing page AND redesigned workspace, simple wordmark plus actual screenshots, and **See how it works**. User subsequently chose a professional free subdomain with **no domain purchase** and completed Cloudflare sign-in. No Session 8, profile/resume, paid plan, payment entry, monetization or AI work.

Landing `/` is static and script-free. Workspace `/workspace.html` (canonical `/workspace`) retains all source, task, comparison, dependencies, completion, review, storage and recovery behavior. Separate completion/review counters, readable task cards, narrow stacking and genuine screenshot. Original `steptrace.*` keys, schema 1–3 readers and backup format identifiers remain intact. No data deletion or schema change.

## Checks and evidence

134 local tests pass; real 500→400 flow retains 3 completions / 2 reviewed tasks, original exact quote, export/reload/restore equality. Responsive checks at 320/375px; landing and changed-work workspace axe scans have zero violations after fixing a contrast/landmark issue. Incomplete symbol/textarea checks remain; no full conformance or screen-reader claim. See DESIGN and CHECKS. Human evaluation is still pending, N=0; historical synthetic outcomes are unchanged.

## Publication and next step

Cloudflare Pages project `originscholar` is reserved, with dashboard-provided URL `https://originscholar.pages.dev`. **Not deployed yet at this commit.** Finish clean artifact upload, verify public routes / main demo / console and runtime / response headers / deployed commit, then record actual results, push reviewed source and confirm CI. Source-hosting repo retains its original slug. `.openai/hosting.json` refers to the legacy Sites project and is preserved for recovery; it is not the selected new host.

A new hostname has separate storage: export from the old StepTrace address and preview/restore on Origin Scholar. Do not silently transfer data or clear old storage. Direct Upload projects do not auto-deploy from GitHub pushes.

## Commands / tooling

`./run.sh` → localhost:4173 landing and /workspace.html. `./run.sh check`, `./run.sh evaluate`, `./run.sh evaluate-ui`, `./run.sh build --out build`. No npm install. Node 22+. Bundled Node/Git paths are documented in SESSION-7-STATE. Local diagnostics: PORT=4198 node tests/accessibility-server.mjs, /landing and /workspace.html; ordinary server excludes diagnostics. Supporting fictional backups/reports remain ignored under work/.

Later sessions read AGENTS, BRIEF, ROADMAP, STATE, EVALUATION and DESIGN, inspect actual git changes, preserve user work, implement only requested scope, run relevant checks, update STATE and commit logically. Stop after this design milestone.
