# Origin Scholar release

Design milestone, September 24, 2026. Package `0.7.1-alpha.1`.

Cloudflare Pages project **originscholar** is reserved in the user’s signed-in account. Intended public URL returned by the dashboard: `https://originscholar.pages.dev`. Upload/public verification is pending at this commit; do not treat reservation as a successful deployment.

The source remains https://github.com/Nile54/steptrace-app-prep. Prior StepTrace release and Sites provenance are preserved in [SESSION-7-RELEASE](history/SESSION-7-RELEASE.md). The MIT license is unchanged. No domain, paid plan or payment details.

Build a reviewed clean commit with `./run.sh build --out build`, then ZIP the allowlisted output at archive root for Cloudflare Pages Direct Upload. Do not upload the repository or local backups. `release.json` records exact commit, clean status and asset hashes. The dashboard upload flow is intentional; GitHub pushes do not automatically deploy this project.

The old Sites origin is retained for recovery. Export any old browser workspace and preview/restore it at the new address; browser-origin storage does not migrate automatically.
