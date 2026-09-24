# Session 7 alpha release

Release label: `v0.7.0-alpha.1` — fictional demonstration, human evaluation pending (N=0). This is an experimental release, not a production application service or a promise of eligibility/completeness.

## Publication record

Public demo: https://steptrace-app-prep.ninandak.chatgpt.site

Public source: https://github.com/Nile54/steptrace-app-prep

Published prerelease: [v0.7.0-alpha.1](https://github.com/Nile54/steptrace-app-prep/releases/tag/v0.7.0-alpha.1), September 23, 2026. GitHub confirms it is public, not a draft, and labeled prerelease.

The owner **Nile54** was verified against the supplied profile, signed-in browser and authenticated CLI. The repository was absent before creation; nothing was overwritten. The user approved the additional Workflow scope needed for CI. Source is on `main`.

Tagged and deployed source: **`fad309656719cbd1a28eef2d167123287196a9ec`**. [Remote CI](https://github.com/Nile54/steptrace-app-prep/actions/runs/35922194997) passed all 133 tests, synthetic evaluation and packaging under both Node 22 and 24. The final documentation-only commit on main records verification without changing the deployed application.

Sites project `appgprj_6ab363105d748191a690c53ff5af2e3e`, saved version `appgprj_6ab363105d748191a690c53ff5af2e3e~appgver_575195336180819196cd6adf073c3d45` (version 2), deployment `appgdep_6ab443a5d3c4819192f73be9df2f0900` succeeded with public access. Fresh public visits in two browser profiles verified the main flow, backup/reload/restore, human decisions, offline setup and absence of app console errors. See [CHECKS](../CHECKS.md) for the actual steps and omissions.

The clean app artifact SHA-256 is `9b4babc9b7a2d4aebf47ae87e16fbff28d724d3a30417ecffe37ce2b8489195b`. The public `release.json` exactly matches it. All 18 JS/CSS/worker file hashes match; delivered HTML includes host-controlled security code and is not byte-identical.

The release ZIP includes that static artifact plus the MIT notice. Its uploaded GitHub digest matches the local SHA-256: `4773b6eb93caa59335e56cbe3842430dbb3c3b0a7755028b874e3d09b4fbedc6`. A separate checksum file is attached. Extract at an HTTPS origin root. GitHub also provides source archives for the exact tag; source archives require the documented local commands.

## Reproducible artifact

```sh
./run.sh check
./run.sh evaluate
./run.sh build
# Sites packaging uses the supported static directory:
./run.sh build --out build
```

Build from a clean, reviewed commit. `release.json` records that source commit, dirty status, the immutable app-shell revision and individual SHA-256 hashes. Generated artifacts are ignored. The artifact contains only public app assets; it excludes evaluation materials, repository notes, local backups, credentials and test endpoints. `dist/` is authored source and must not be deployed without injecting the worker revision. The app requires an HTTPS origin root, rather than a repository subpath.

The source CI matrix runs Node 22 and 24 on standard GitHub-hosted Ubuntu runners: syntax/regression tests, synthetic evaluation and build. No deployment secrets, paid runner, package installation or artifact-storage job is configured. A local check is not remote CI evidence.

## Hosting decision, checked September 22, 2026

[ChatGPT Sites](https://help.openai.com/en/articles/20001339) includes beta usage within plan-specific limits for eligible existing accounts. Limits can change or suspend high-usage public availability. This deployment uses the already available Sites account with no new subscription, domain, API key, database or payment details. [Sites terms](https://openai.com/policies/chatgpt-sites-terms/) cover hosting rights, responsibilities and restrictions; this adult-facing fictional static demo includes no sensitive application records or payment processing. No guarantee of permanent free hosting is made.

GitHub is the intended public **source** host. [Standard Actions compute for public repositories is free](https://docs.github.com/en/billing/concepts/product-billing/github-actions); larger runners and other metered services are separate. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) restrict commercial SaaS/e-commerce uses, so a future paid product must not assume Pages suitability. MIT permission does not override hosting terms.

Cloudflare Pages was considered: [static-asset requests are free](https://developers.cloudflare.com/pages/functions/pricing/) and [Free limits](https://developers.cloudflare.com/pages/platform/limits/) cover this small static artifact. The browser required account sign-in; no Cloudflare account or terms acceptance was performed. Sites provides the available deployment path for this session.

## Review and limits

The release audit inspected 6 pre-release commits, 141 unique historical blobs and 77 then-tracked files. It found no high-confidence credentials, private keys, credential-bearing URLs, participant records or real application documents. This is a bounded review, not a security certification. Public profile research and machine-specific paths are retained as historical context; no unrelated history was rewritten. Runtime/public packaging uses an explicit allowlist.

The MIT license permits others to reuse, change and redistribute the software commercially while retaining its notices, with no warranty. There was no existing license to preserve. The app's data model, matching rules and schema remain unchanged in this release. New behavior is limited to portable release packaging and accurate alpha labels.

See [CHECKS](../CHECKS.md) for actual check results, [DEMO](../DEMO.md) for the working flow and genuine screenshots, [PRIVACY](../PRIVACY.md) for storage/network limits and [EVALUATION](../EVALUATION.md) for pending human evidence. Public release does not complete human evaluation or authorize profile edits, recruitment or monetization.

## Observed hosting behavior and release repair

September 23, 2026: anonymous requests returned the application and matching clean source metadata. All authored JS, CSS and the worker matched their manifest hashes. The host redirects `/index.html` to `/` and `/preview.html` to `/preview` with 307; it adds a Cloudflare security script to delivered HTML. It serves `_headers` as a file rather than applying its directives: no CSP header was observed, and cache control was `public, max-age=0, must-revalidate`. Full delivered-HTML integrity is therefore not claimed.

The original strict worker rejected both HTML redirects and reported incomplete offline setup. The repair accepts only those two exact same-origin, query-free HTML destinations, keeps all other redirects rejected, and maps canonical `/preview` to the same cached preview. Tests retain the prior cache on invalid redirects, exercise offline navigation and repair, and preserve guarded updates. No source, task, comparison or storage schema semantics changed. The final public run reached offline-ready status in both tested browsers. A physically disconnected-browser reload was not repeated for this release.
