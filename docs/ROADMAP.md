# Milestone roadmap

Execute one user-requested session at a time. Do not automatically advance. Read AGENTS, BRIEF, ROADMAP, and STATE, inspect git/user changes, run relevant checks, update STATE, and make a logical local commit when appropriate. Later user instructions override this plan and tool-specific preferences.

The original full prompts are in `references/session-prompts.md`. They are reference material, not present authorization for future remote/profile/payment actions.

| Session | Milestone | Exit evidence |
| --- | --- | --- |
| 1 — current, complete | Establish repository and runnable example | Project docs, fictional linked checklist, clearly scripted review preview, browser smoke check, five interview questions |
| 2 — next, not started | Source-linked tasks and reliable storage | Paste/text-file input, immutable snapshots, exact excerpts, task edits/manual no-source tasks, human applicability, local save and versioned export/import with safe validation/recovery |
| 3 | Compare instructions without false certainty | New immutable versions, deterministic differences, direct review flags, visible added/removed/ambiguous material, version-specific resolutions; preserve history |
| 4 | Explain which dependent work needs review | Cycle-safe links, direct/transitive reason chains, multiple unique change/work events, explicit work-edited action, independent acknowledgments and readiness gating |
| 5 | Accessibility, offline use, and recovery | Keyboard, one-step/full views, focus, narrow/zoom/screen-reader checks where available, failure recovery, accurate privacy/accessibility notes; offline support if feasible |
| 6 | Evaluate usefulness and fix observed problems | Reproducible comparison against a simple checklist; matched fictional briefs, counterbalancing, actual engineering results and human evaluation status; no invented evidence |
| 7 | Publish a credible repository and live demo | Later explicit session authorization, reconsidered public name/owner, release-ready docs/license/demo, no-cost hosting checks, verified remote/CI and deployed commit |
| 8 | GitHub presentation, resume, and LinkedIn | Verified claims tailored to tech/AI, accurate project explanations; profile actions only within that session's authorization |
| 9 — optional | Test a paid offer | Evidence-based go/no-go, bounded offer mockup; free core retained, no invented demand or premature billing |
| 10 — optional | Implement only the justified paid capability | One validated capability, test-mode payments only if justified; separate explicit live-payment authorization |

## Invariants for later milestones

- Review state and completion history are separate. Completing a task never silently clears a review reason.
- People decide applicability and uncertain source mappings; changed conditions require renewed review.
- Added unlinked requirements stay visible; removed requirements never silently delete work.
- Resolve one exact change/work event, not every event for a task or source version.
- Unknown applicability, incomplete required predecessors, and open review reasons block readiness claims.
- Preserve original source text and version-specific anchors. Ambiguous matches require a person.
- Save errors must never look like successful saves. Browser-local storage is not a backup or encryption; add backup/restore before depending on it.
- Keep comparison, dependencies, and storage in separate modules. Test relevant invariants as each module arrives, not as pretend implementations in the preview.
- Use fictional committed data, no external text uploads, no eligibility decisions, no submission, and no completeness guarantees.

If evidence changes the product scope, update BRIEF, ROADMAP, demo, README, remaining milestone guidance, and STATE together. A future session may stop at a coherent smaller boundary if its work is not finished; do not mark incomplete work complete.
