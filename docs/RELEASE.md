# Origin Scholar release

Design milestone, September 24, 2026. Package `0.7.1-alpha.1`.

**Live:** https://originscholar.pages.dev · [Workspace](https://originscholar.pages.dev/workspace). Cloudflare Pages project `originscholar` in the user’s account. Successful deployment `6f327e85-b654-48a6-a4f3-6ae60126b111` / https://6f327e85.originscholar.pages.dev.

Deployed source: **ce37bc712db76e0fab59d39179107834f2d27858** (clean). The manifest and all 23 public asset hashes match the local artifact, including HTML. Artifact digest: `458a6139971ced9c6d98a5314775298b3bbb5cf59df87d2537780a10aa8b2c09`. The ZIP (138,658 bytes, includes MIT notice) has SHA-256 `f2272da82f1efced39f4e3320fe0caf3bd20cfc250c86fa8bb2787851661db21`.

[GitHub prerelease](https://github.com/Nile54/steptrace-app-prep/releases/tag/v0.7.1-alpha.1) includes ZIP and digest. [CI](https://github.com/Nile54/steptrace-app-prep/actions/runs/36015906951) passed 134 tests on both Node 22 and Node 24. Later documentation-only commits do not change this deployed source.

Fresh public visit confirmed landing and canonical `/workspace` routing, working before/after change flow (3 completions retained, 2 tasks flagged), unchanged recommendation, added Not decided condition, exact old 500-word quote, backup/reload equality and offline setup. No app console errors/warnings observed. Public response headers include CSP, no-referrer and nosniff. See CHECKS for scope and limits.

The source remains https://github.com/Nile54/steptrace-app-prep. Prior StepTrace release and Sites provenance are preserved in [SESSION-7-RELEASE](history/SESSION-7-RELEASE.md). The MIT license is unchanged. No domain, paid plan or payment details.

Build a reviewed clean commit with `./run.sh build --out build`, then ZIP the allowlisted output at archive root for Cloudflare Pages Direct Upload. Do not upload the repository or local backups. `release.json` records exact commit, clean status and asset hashes. The dashboard upload flow is intentional; GitHub pushes do not automatically deploy this project.

The old Sites origin is retained for recovery. Export any old browser workspace and preview/restore it at the new address; browser-origin storage does not migrate automatically.
