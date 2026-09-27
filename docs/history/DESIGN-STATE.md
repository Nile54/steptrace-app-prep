# Origin Scholar state

Updated September 24, 2026. **Design milestone complete: Origin Scholar is live on its free branded subdomain. Stop before Session 8.**

Repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`. Continue this repository. GitHub owner **Nile54**, remote `https://github.com/Nile54/steptrace-app-prep.git`. MIT unchanged. Prior state and release details preserved in `docs/history/SESSION-7-*`.

## Authorized scope / outcome

User chose **Origin Scholar**, navy/cream/gold, a landing page AND redesigned workspace, simple wordmark plus actual screenshots, and **See how it works**. User subsequently chose a professional free subdomain with **no domain purchase** and completed Cloudflare sign-in. No Session 8, profile/resume, paid plan, payment entry, monetization or AI work.

Landing `/` is static and script-free. Workspace `/workspace.html` (canonical `/workspace`) retains all source, task, comparison, dependencies, completion, review, storage and recovery behavior. Separate completion/review counters, readable task cards, narrow stacking and genuine screenshot. Original `steptrace.*` keys, schema 1–3 readers and backup format identifiers remain intact. No data deletion or schema change.

## Checks and evidence

134 local tests pass; real 500→400 flow retains 3 completions / 2 reviewed tasks, original exact quote, export/reload/restore equality. Responsive checks at 320/375px; landing and changed-work workspace axe scans have zero violations after fixing a contrast/landmark issue. Incomplete symbol/textarea checks remain; no full conformance or screen-reader claim. See DESIGN and CHECKS. Human evaluation is still pending, N=0; historical synthetic outcomes are unchanged.

## Publication and next step

Live landing: **https://originscholar.pages.dev**. Workspace: **https://originscholar.pages.dev/workspace**. Cloudflare Pages project `originscholar`, deployment `6f327e85-b654-48a6-a4f3-6ae60126b111`, deployment URL https://6f327e85.originscholar.pages.dev. Dashboard reports success; a fresh public browser visit and the working example were verified.

Deployed source: **ce37bc712db76e0fab59d39179107834f2d27858**, clean build. `release.json` matches; all 23 public app assets match local SHA-256, including HTML. CSP, no-referrer and nosniff headers are applied on Pages. Public 500→400 review, added condition undecided, exact original source, backup/reload equality and offline setup verified. No app console warnings/errors observed.

GitHub main contains the source; CI passed on Node 22/24: https://github.com/Nile54/steptrace-app-prep/actions/runs/36015906951. Release: https://github.com/Nile54/steptrace-app-prep/releases/tag/v0.7.1-alpha.1. A later documentation-only commit records deployment evidence; do not confuse it with the deployed source. Source-hosting repo retains its original slug. `.openai/hosting.json` refers to the legacy Sites project and is preserved for recovery; it is not the selected new host.

A new hostname has separate storage: export from the old StepTrace address and preview/restore on Origin Scholar. Do not silently transfer data or clear old storage. Direct Upload projects do not auto-deploy from GitHub pushes.

## Commands / tooling

`./run.sh` → localhost:4173 landing and /workspace.html. `./run.sh check`, `./run.sh evaluate`, `./run.sh evaluate-ui`, `./run.sh build --out build`. No npm install. Node 22+. Bundled Node/Git paths are documented in SESSION-7-STATE. Local diagnostics: PORT=4198 node tests/accessibility-server.mjs, /landing and /workspace.html; ordinary server excludes diagnostics. Supporting fictional backups/reports remain ignored under work/. Development servers are stopped at handoff; restart with ./run.sh. Public screenshot evidence is docs/images/origin-public-landing.jpg and origin-public-workspace.jpg.

Later sessions read AGENTS, BRIEF, ROADMAP, STATE, EVALUATION and DESIGN, inspect actual git changes, preserve user work, implement only requested scope, run relevant checks, update STATE and commit logically. Stop after this design milestone.

## Remaining limits and next action

No domain ownership was purchased: the professional address is a provider subdomain. Free limits/terms can change; no future paid-hosting promise. GitHub project identity is retained, and its homepage now points to Origin Scholar. The old Sites origin stays available for backup migration and is not silently redirected or erased. Source content/storage/comparison algorithms are unchanged.

No new participant testing, full WCAG audit, spoken screen-reader session, disconnected-browser reload or conversion study. Human N=0. The smallest feedback action remains one consenting adult trying both evaluation blocks; no recruitment is authorized. Future design feedback can use the live page; do not begin Session 8 automatically.
