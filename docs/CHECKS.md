# Session 7 release checks

September 22, 2026. This record covers the release working tree based on `4a2ebcd`; the final release commit and publication evidence are recorded in STATE/RELEASE. Prior Session 6 evidence is preserved in [SESSION-6-CHECKS](history/SESSION-6-CHECKS.md); human evaluation remains pending, N=0.

## Actual automated checks

- `./run.sh check`: **131 passed, 0 failed, 0 skipped**, plus JavaScript syntax, assets and fictional fixture checks. Node v24.19.0 on macOS.
- The five new release tests cover the public allowlist, complete service-worker/import assets, SHA-256 integrity, deterministic rebuilds and cache revision changes, rejection of incomplete shells, and preservation of unrelated output/symlinks.
- `./run.sh evaluate`: synthetic matched A/B and conservative stress results remain unchanged; no human measures are supplied. The release run is saved locally in ignored `work/session7-synthetic-results.json`. The committed Session 6 report retains its historical fingerprint.
- `./run.sh build --out build`: succeeds. The pre-commit artifact truthfully identifies its dirty tree; publication must rebuild after the source commit.
- GitHub CI is configured for Node 22/24 but has not yet run remotely. Do not infer CI status from local tests.

## Actual interface checks

On a fresh isolated in-app-browser origin, `http://127.0.0.1:4207/`, the real fictional plan created three completed tasks and the confirmed proofreading dependency. The normal preview displayed old 500-word and new 400-word excerpts and the added conditional requirement. Saving produced one direct source review and one dependent review, kept all three completion records, and left the recommendation without an open review. The app did not declare the described 380-word draft invalid.

`docs/images/demo-before.png` and `demo-after.png` are genuine 1280×720 viewport captures of those states. They were not generated or reconstructed. The displayed source and original task quote identify their separate versions.

Public visit, hosted headers/integrity, runtime log inspection and the remainder of the hosted backup/reload flow are pending deployment; append actual observations after running them. Prior accessibility checks are historical and are not reclassified as release-wide conformance. No human screen-reader, participant, mobile certification, demand or outcome claims are made.
