# Session 7 release checks

September 23, 2026. Released and deployed source: `fad309656719cbd1a28eef2d167123287196a9ec`, tag `v0.7.0-alpha.1`. These are engineering checks, not a human study. Human sample size remains **0**. Prior [Session 6 checks](../history/SESSION-6-CHECKS.md) and [evaluation](../EVALUATION.md) retain their historical results.

## Automated results

- `./run.sh check`: **133 passed, 0 failed, 0 skipped**, plus JavaScript syntax, assets and fictional fixture checks. Local Node v24.19.0 on macOS.
- [Remote GitHub CI](https://github.com/Nile54/steptrace-app-prep/actions/runs/35922194997): both `check (22)` and `check (24)` succeeded on the exact deployed commit. Logs confirm 133 passed and zero failures in each job, successful synthetic evaluation and a clean portable build.
- Five release tests cover public asset allowlisting, complete worker/import assets, integrity, repeatable builds/cache revisions, rejection of incomplete shells and preservation of unrelated output/symlinks.
- Two hosted-routing regressions cover the exact same-origin HTML aliases, cached canonical navigation and evicted-cache repair. Cross-origin, query-bearing, fragment-bearing, wrong-target, non-HTML and root/JS/CSS redirects reject installation without replacing the previous cache. Existing guarded-update and limited-connection tests also pass.
- `./run.sh evaluate`: matched A/B each retain 3 expected reviews, 0 misses, 0 extras. Context/duplicate stress cases each retain 1 extra unchanged recommendation review. Conditions/conflicts remain human decisions. Local release output is in ignored `work/session7-synthetic-results.json`; the committed Session 6 fingerprint is not rewritten as new evidence.
- `./run.sh build --out build`: clean manifest names `fad3096`; artifact SHA-256 `9b4babc9b7a2d4aebf47ae87e16fbff28d724d3a30417ecffe37ce2b8489195b`.

## Public interface verification

Fresh visits to [the public demo](https://steptrace-app-prep.ninandak.chatgpt.site) loaded the app without an app account. The in-app browser and a separate Chrome profile were used, with fictional data only. Browser version and assistive-technology behavior were not measured.

1. Created the real Cedar example with three completed tasks and a confirmed proofreading dependency; prepared/exported its JSON.
2. Used the normal source preview and save controls for 500→400 words. Old/new excerpts and the added conditional study plan were visible. One direct and one dependent review opened, all three completion records remained, and the unchanged recommendation had no open review. The described 380-word draft was not declared invalid.
3. Added the conditional task as Not decided. It retained its exact version-2 source and an undecided applicability blocker. Original draft lookup still showed its exact version-1 500-word quote.
4. Prepared a backup, copied its actual JSON into an ignored local file and reloaded. Re-exported workspace objects were exactly equal.
5. Restored that backup through preview and explicit apply into the empty Chrome profile. Its re-exported workspace was exactly equal to the original. Malformed JSON and a duplicate-ID preview showed clear errors, and another export confirmed the workspace remained exactly equal.
6. Selected the exact new 400-word excerpt and confirmed its mapping/Applies decision. The direct review cleared while proofreading's review stayed open. Recorded the proofreading decision separately; then used **I changed this work**. A new downstream reason appeared under the same source version, with earlier decisions and completion preserved.
7. Offline setup reached **App files are ready for offline use** in both tested browsers after the hosting fix. Ordinary reload preserved work. A physically disconnected browser reload and new browser crash/quota injection were not repeated for this release; automatic offline/cache and failure tests ran, and earlier real-browser fault evidence remains separately dated.
8. Console inspection found no app errors in either browser and no warnings in the in-app browser. Chrome had three warnings from its installed Grammarly extension, not StepTrace. Occasional automation selector timeouts were resolved using the current accessibility state; they are not recorded as app failures.

`docs/images/demo-before.png` and `demo-after.png` are genuine local viewport captures from September 22. `public-demo.png` is a genuine capture of the deployed application on September 23. None was generated or reconstructed.

## Hosting behavior and repair

The initial deployed `beb27db` loaded online but reported failed offline setup. Sites redirects `/index.html` to `/` and `/preview.html` to `/preview` with 307. The earlier worker rejected all redirected responses. The release repair accepts only those two exact, same-origin HTML destinations and serves `/preview` from the existing preview cache key. Other redirects still fail; no domain-model or workspace-schema behavior changed.

Anonymous HTTP verification retrieved the exact clean `release.json` and matched all **18 JS/CSS/worker asset hashes**. Sites adds a Cloudflare security script to HTML, so delivered HTML is not byte-identical to the artifact. `_headers` is served as an ordinary asset, not applied; no CSP header was observed. Cache control was `public, max-age=0, must-revalidate`. The local server's stricter policy is not claimed for the host. See [PRIVACY](../PRIVACY.md).

The public GitHub API confirms the repository owner, public visibility, `main`, source commit and release assets. The uploaded ZIP's GitHub-reported SHA-256 matches the local checksum. No secrets/private application records were found in the bounded release audit. Three broken archived-document links were repaired; history was not rewritten.

## Reproduce and limits

```sh
./run.sh check
./run.sh evaluate
./run.sh build
./run.sh
```

Follow [DEMO](../DEMO.md) through source updates, independent decisions and backup/restore. Use one editing tab per browser profile and an empty test origin/profile for restore; never clear existing work to make a test pass. `release.json` on the public origin identifies the deployed commit. The release ZIP has a separate SHA-256 file.

No human accessibility, screen-reader speech, mobile certification, real application, privacy/security certification, market demand or outcome benefit was established. Source matching intentionally has extra-review costs. Provider/CDN behavior and browser extensions are outside the authored app's control. No recruitment occurred.
