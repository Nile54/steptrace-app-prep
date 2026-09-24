# Origin Scholar design checks

September 24, 2026 · package 0.7.1-alpha.1 · agent-operated engineering checks, **0 human participants**. Current working tree derives from Session 7 commit f0e19bb; release metadata identifies the exact clean deployed commit. Earlier evidence is preserved in [SESSION-7-CHECKS](history/SESSION-7-CHECKS.md).

## Reproducible automated checks

- `./run.sh check`: **134 passed, 0 failed** on Node 24.19.0. JS syntax, fictional fixtures, source/model/storage/dependency/evaluation regressions, safe release packaging, one new real-HTTP landing/workspace resource/navigation test.
- Offline tests now cover `/workspace.html` → `/workspace`, both cached URL forms, unexpected destination rejection, original update guards and preservation of prior shell on failure.
- `./run.sh evaluate`: matched A and B still flag the expected 3 affected tasks with 0 misses/extra flags; adjacent-context and duplicate-phrase cases each retain 1 extra review. These are synthetic correctness results, not user performance.
- Git diff whitespace check passes. Local Markdown file links resolve. No runtime dependencies added, no model/comparison/storage schema or identifiers changed.

## Actual browser checks

Codex in-app browser; local real app at port 4188, isolated diagnostics at 4198. The latter disables its service worker and serves a locally pinned axe-core 4.10.3 only for testing. Neither diagnostics nor backups are in the production asset allowlist.

- Landing **See how it works** reaches the three-step explanation. **Explore the fictional plan** reaches and opens the working sample disclosure without silently creating data.
- Fictional Cedar plan: 3 completed tasks, 0 task reviews, 1 source version. Saving 500→400 changes this to 3 completed tasks, 2 tasks needing review, 2 versions. Overview explains 1 direct and 1 dependent review. The original 500-word quote is still exact.
- Backup export, reload and restore into an empty diagnostic origin yield exact workspace JSON equality. Malformed import produces a visible validation error; existing work remains. Existing automated checks cover quota/unavailable/conflicting saves and duplicate IDs.
- New shell offers an explicit update. Choosing it retains the 3 completions / 2 review tasks / 2 versions. Offline setup reports ready. No new disconnected-browser reload or browser-crash study performed.
- Desktop tested at requested 1265×714 (actual screenshot 1250×706), mobile 375×812 and 320×740. No horizontal page overflow; at 320 and 375 the measured layout/content widths both match 305 and 360 pixels, respectively. Larger-text workspace reflows at 320. Source/task columns stack. Landing keyboard Tab reaches visible skip link.
- axe initially detected a low-contrast navy callout and nested aside. Corrected CSS specificity and landmark. Landing and restored changed-work workspace scans at 320px: **0 violations**. Incomplete checks remain for decorative marks/arrows and textarea backgrounds. This is not WCAG conformance, spoken screen-reader verification or measured accessibility benefit.
- No app console errors/warnings observed in the tested real local flow. Public checks are recorded below after deployment.

## Performance constraints

Landing loads no JavaScript, external font or video. One genuine 81,429-byte JPEG uses explicit 1250×706 dimensions and high-priority loading. System fonts, static HTML/CSS and the existing modular workspace avoid framework/runtime additions. No Lighthouse score or real-user speed metric was measured. Design rules and remaining limits are in [DESIGN](DESIGN.md).

## Public release

Verified live https://originscholar.pages.dev and canonical `/workspace`, source `ce37bc712db76e0fab59d39179107834f2d27858`. Fresh visit in the in-app browser: landing image/CTA, actual Cedar creation, source preview/save, 3 completions retained / 2 tasks flagged, recommendation unaffected, added condition Not decided, original 500-word source lookup, export/reload workspace equality, offline setup ready. No app console warnings/errors observed. Screenshots `images/origin-public-landing.jpg` and `images/origin-public-workspace.jpg` are genuine public captures.

The public manifest equals the clean local build. All **23** non-configuration public app files match SHA-256, including HTML, CSS, JavaScript, service worker and JPEG. Pages applies the packaged CSP, no-referrer, nosniff and no-cache headers. `_headers` is a host configuration file, not counted as an app byte-match. No runtime application-data upload service is added. Cloudflare may still receive request metadata and browser network-error reporting; this is not a provider privacy certification.

[Remote CI](https://github.com/Nile54/steptrace-app-prep/actions/runs/36015906951) passed on Node 22 and Node 24 for the exact source. The 24 manifest-listed files total 307,134 uncompressed bytes; landing HTML/CSS/image total 114,522 bytes. The full ZIP with MIT license is 138,658 bytes. No real-user timing or Lighthouse score measured.
