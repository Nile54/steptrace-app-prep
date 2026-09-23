# Session 7 alpha release

Release label: `v0.7.0-alpha.1` — fictional demonstration, human evaluation pending (N=0). This is an experimental release, not a production application service or a promise of eligibility/completeness.

## Publication record

Release preparation is in progress. The GitHub owner is **Nile54**, verified against the user's supplied profile and the signed-in browser account. No StepTrace remote repository has yet been created or overwritten. The intended descriptive slug is `steptrace-app-prep`; the working name has known conflicts.

Sites project `appgprj_6ab363105d748191a690c53ff5af2e3e` has been provisioned. Provisioning is not deployment. A public URL and deployed commit will be recorded only after successful publication and a fresh browser check. GitHub source publication and remote CI are pending authenticated CLI access; a browser sign-in alone does not authenticate Git pushes.

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

See [CHECKS](CHECKS.md) for actual check results, [DEMO](DEMO.md) for the working flow and genuine screenshots, [PRIVACY](PRIVACY.md) for storage/network limits and [EVALUATION](EVALUATION.md) for pending human evidence. Public release does not complete human evaluation or authorize profile edits, recruitment or monetization.
