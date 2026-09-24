# StepTrace state

Updated September 23, 2026. **Session 7 complete: public source, verified fictional demo and labeled alpha release. Stop before Session 8. Human evaluation pending (N=0).**

## Repository and release identity

- Actual repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`.
- Local branch `codex/session-7` tracks `origin/main`. Session 7 started from a clean `4a2ebcd`; user work and history were preserved.
- Verified owner: **Nile54**, from the supplied URL, signed-in browser and authenticated CLI. `origin`: https://github.com/Nile54/steptrace-app-prep.git. Public visibility/default `main` confirmed through GitHub. The repository was absent before creation; nothing was overwritten.
- Public demo: https://steptrace-app-prep.ninandak.chatgpt.site
- Published prerelease: https://github.com/Nile54/steptrace-app-prep/releases/tag/v0.7.0-alpha.1 (not a draft).
- Tagged/deployed source: **`fad309656719cbd1a28eef2d167123287196a9ec`**. A later documentation-only commit records the completed verification; it does not change the deployed app. Read `git log -1` for that commit.
- Sites project `appgprj_6ab363105d748191a690c53ff5af2e3e`; saved version `appgprj_6ab363105d748191a690c53ff5af2e3e~appgver_575195336180819196cd6adf073c3d45` (version 2); successful public deployment `appgdep_6ab443a5d3c4819192f73be9df2f0900`. Reuse `.openai/hosting.json`; never create a duplicate Site. Credentials must remain out of files and output.

## Delivered and checked

- MIT license, public README, genuine local/public screenshots, short demo, architecture, sources/prior art and honest privacy/accessibility/evaluation notes. StepTrace remains provisional because of unrelated naming conflicts; descriptive slug `steptrace-app-prep` does not establish trademark clearance.
- Portable app allowlist, generated worker revision, clean source/asset manifest and static-host header file. `dist/` remains authored source; output is ignored `work/release/` or `build/`. Package `0.7.0-alpha.1`; no runtime/package dependencies.
- **133 tests passed locally; 133 passed on each Node 22 and 24 remote CI job** for the deployed source. [Verified CI run](https://github.com/Nile54/steptrace-app-prep/actions/runs/35922194997). Synthetic evaluation retains favorable matched cases and the two extra-review stress costs. EVALUATION's historical Session 6 results remain unchanged.
- Public before/after flow: 500→400, essay/proofreading reviews, all three original completions retained, unchanged recommendation untouched, added condition undecided. Exact version-1 lookup, independent mapping/downstream acknowledgments and a new reported-work-change reason verified.
- Exact workspace equality after public reload and restore into another browser profile. Malformed/duplicate imports preserve work. Offline setup succeeds in both tested browsers. No app console errors observed; Chrome extension warnings are separately recorded.
- Public `release.json` exactly matches the clean artifact; all 18 JS/CSS/worker hashes match. GitHub release ZIP upload digest matches local SHA-256. See CHECKS and RELEASE for actual observations, checks and limits.
- Three broken archive links repaired. Prior notes retained in `docs/history/SESSION-6-*`. Bounded audits found no high-confidence secrets/private fixtures; no unrelated history rewrite.

## Hosting fix and limitations

The first deployment exposed canonical HTML redirects that prevented offline installation. The narrow worker fix accepts only `/index.html` → `/` and `/preview.html` → `/preview` with the exact same origin and HTML content type; arbitrary redirects remain rejected. Schema 3, legacy readers, source anchors, comparison descriptors, completion and review histories are unchanged.

Sites adds a Cloudflare security script to HTML and does not apply the packaged `_headers` rules. No hosted CSP header was observed; full served-HTML integrity is not claimed. The local server's CSP is separate. Use fictional information only and read PRIVACY. The existing account's included beta hosting was used without a new paid plan, domain or payment details; limits may change. GitHub source hosting is separate from any future commercial-host decision.

Actual human sample is zero. Setup/lookup times, comprehension, accessibility benefit, demand and revenue are unknown. No new spoken screen-reader, disconnected-browser reload or browser-crash study was performed in this release. Use one editing tab and separate JSON backups. Browser storage/drafts are not durable backups or encryption. No replacement restore, deletion, automatic eligibility, completeness guarantee or application submission.

## Commands and local tooling

```sh
./run.sh                  # http://127.0.0.1:4173
./run.sh check
./run.sh evaluate
./run.sh evaluate-ui      # http://127.0.0.1:4196/evaluation/
./run.sh build            # ignored work/release/
./run.sh build --out build
```

Node 22+; no npm install. Original Mac runtime: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (24.19.0). Git: `/Users/nileshnandakumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git`. Avoid triggering system git's installer; no global git identity was changed. Official GitHub CLI v2.101.0 is under ignored `work/release-tools/`, verified against its published SHA-256. The user approved Workflow scope and completed its browser authorization. Do not expose stored credentials.

Released static ZIP plus SHA-256 are in GitHub Releases and locally under ignored `work/`. It includes the built app and MIT notice; host at an HTTPS origin root. The separate build manifest describes the app assets. Local testing logs/backups remain ignored. The release test server is stopped at handoff; restart explicitly. Public demo tabs retain fictional browser-local data; no user storage was cleared.

## Next action and boundary

Smallest remaining product-feedback action: one consenting adult completes both assigned fictional blocks using EVALUATION-PROTOCOL, with local nonidentifying notes. Four complete sessions form a balanced order batch. Do not recruit automatically or turn synthetic fixtures into user outcomes; report checklist advantages honestly.

Later sessions must read AGENTS, BRIEF, ROADMAP, STATE and EVALUATION; inspect actual git/user changes; preserve work; implement only the requested milestone; run relevant checks; update STATE and commit logically. Later user choices supersede saved/tool-specific instructions. **Stop here. Profile/resume changes, recruitment, monetization, billing and AI features require their own explicit scope.**
