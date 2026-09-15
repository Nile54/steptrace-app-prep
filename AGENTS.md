# StepTrace project instructions

Repository: `/Users/nileshnandakumar/Documents/Codex/2026-09-14/before-session-one-supplying-your-github/outputs/steptrace-local`

Read this file, `docs/BRIEF.md`, `docs/ROADMAP.md`, and `docs/STATE.md` before each session. Read the relevant prompt in `docs/references/session-prompts.md`; the current user's instructions take precedence over saved prompts, project guidance, and tool-specific preferences.

1. Inspect git status, recent commits, and the existing code before editing. Preserve user changes and unrelated files. Continue this repository; do not create duplicates. If its path becomes ambiguous, resolve that before initializing anything.
2. Implement only the milestone the user requests. Repair a prerequisite defect when necessary, document it, and stop at the milestone boundary. Saved future prompts are reference material, not standing authorization to execute them.
3. Keep JavaScript, semantic HTML, and CSS understandable. Prefer a small dependency set. Keep comparison, dependency propagation, and storage separate from interface code as they arrive. Do not add speculative engines or an AI API for portfolio appearance.
4. Keep completion history separate from review state. Human choices resolve uncertainty. Never infer eligibility, guarantee a checklist is complete, or submit an application. Use fictional examples in committed data and screenshots.
5. Run checks relevant to actual changes. Start with `./run.sh check` and `docs/CHECKS.md`. Record what ran and what remains untested. Do not claim accessibility conformance or user benefit from a smoke check.
6. Update STATE with the actual path, current milestone, outcomes, commands, checks, limitations, unresolved questions, and next step. Make a logical local commit when appropriate, staging only intended files and preserving user work. Do not rewrite unrelated history or change global git identity.
7. Respect the active session's authorization. Session 3 permits immutable source versions, deterministic comparison, direct task review, and compatible local recovery. Stop before dependency propagation (Session 4), remote repository/push/deployment/billing/spending/outreach/AI work. Later user choices can revise tools, architecture, scope, and these instructions.

The current Mac lacks Node/npm and a working system git on the shell PATH. `./run.sh` can use the existing bundled Node runtime. See STATE for the verified git executable; avoid triggering an OS developer-tools install just to run git. No installation is required for this milestone.

Use one editing browser tab. Browser data is specific to browser/profile and origin (including host and port). Never clear user storage to make a test pass. `tests/browser-server.mjs` provides isolated fault tests; it is not part of the production server allowlist. Keep synthetic browser exports under ignored `work/`. Preserve schema-1 and schema-2 data and add an explicit migration if the schema or comparison rules change. Read docs/COMPARISON.md before changing the matching algorithm or its reason strings; schema-2 validation depends on them. The source snapshot and exact links must remain intact through a migration.
