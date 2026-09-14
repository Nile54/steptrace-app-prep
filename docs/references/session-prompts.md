# StepTrace session prompts

Use these in order, one at a time, after the previous session finishes. You can space them roughly five hours apart or use any slower schedule that suits you. Each prompt authorizes one milestone, not continuous work until the next prompt. No scheduled automation is needed.

The recommendation is provisional: StepTrace helps adult applicants turn instructions into source-linked tasks and understand what to revisit when instructions change. It applies established requirements-traceability ideas to an accessible consumer workflow. It is not a claim of a globally new invention or a proven business.

Default stack: JavaScript, HTML, CSS, and local browser storage. Default spending: zero. Java is optional if a concrete requirement warrants it. Eight sessions target a credible portfolio release; sessions nine and ten explore commercialization. A session may need a follow-up if its checks do not pass.

Before session one, supplying your GitHub URL and target internship/job would improve tailoring. Neither is needed to start local work. If you choose a different project after reading the research, revise the plan before using these prompts.

## Session 1 — Establish the project and a runnable example

~~~text
Start session 1 of StepTrace. Work only on this milestone, then stop.

StepTrace is an accessible, local-first application-preparation tool for adults managing college scholarship applications. A person creates tasks linked to exact source instructions. When they paste updated instructions, the app explains which tasks and dependent completed work need review. Completion history survives. A person resolves uncertainty; the app does not decide eligibility, promise completeness, or submit applications. Its underlying traceability idea has prior art in Jama/IBM; the distinctive hypothesis is the consumer workflow.

Read the project research and session-prompt files from this task if available. Use my verified JavaScript, HTML, and CSS skills. Inspect the current workspace before creating anything. If an existing StepTrace repository is present, continue it. Otherwise create a separate local project directory and initialize git; preserve unrelated files. Check the working name for obvious conflicts before choosing a public slug. Do not spend money.

Create AGENTS.md, docs/BRIEF.md, docs/ROADMAP.md, and docs/STATE.md. Save the actual repository path, scope, known competitors, assumptions, commands, current milestone, checks, unresolved questions, and next step. Record that later sessions must read these files, preserve user changes, implement only their milestone, run relevant checks, update STATE, and make a logical local commit when appropriate. Keep tool-specific instructions subordinate to the user's later choices.

Build the smallest runnable browser interface with a clearly fictional application, source passage, linked checklist, and planned change-review example. Label simulated behavior as a preview. Keep comparison, dependencies, and storage in separate modules as they arrive; don't build their full implementations now. Prefer a small dependency set. Prepare five short interview questions about actual application difficulties, frequency of instruction changes, and existing tools; do not contact anyone.

Verify that the app starts and the example is understandable. Finish with the repository path, how to run it, what works versus what is simulated, and a short explanation of the code I should understand. Update STATE and stop before session 2. Do not create a remote repository, deploy, add billing, or build AI features in this session.
~~~

## Session 2 — Source-linked tasks and reliable storage

~~~text
Run only session 2 of StepTrace. Locate the repository from this task's saved notes and read AGENTS.md, docs/BRIEF.md, docs/ROADMAP.md, and docs/STATE.md. If the path is ambiguous, ask for it instead of creating a duplicate. Inspect the current code and preserve existing changes.

Implement creating an application from pasted text or a plain-text file, retaining an immutable source snapshot, selecting a source excerpt to create a task, editing the task wording, and returning to its exact source. Support manually entered tasks with an explicit no-source label. Retain conditional requirements as Applies / Does not apply / Not decided, chosen by the person. Keep task completion distinct from review state. Do not infer eligibility or silently claim all source requirements were captured.

Add local persistence plus versioned JSON export/import. Make backup and restore available before relying on browser storage. Validate imported data and preview the restore without overwriting existing work silently. Handle unavailable storage, quota errors, malformed imports, and duplicate IDs clearly. Render pasted content as untrusted text. No real application documents, analytics, or third-party text uploads.

Verify that source references survive reload and export/import, selected quotes are correct, unsafe text stays inert, and a failed save is not shown as successful. Use meaningful tests for those behaviors. Demonstrate the actual working flow in the browser. Update STATE, make a logical local commit, explain the key storage and source-linking decisions, and stop before implementing version comparison.
~~~

## Session 3 — Compare instructions without false certainty

~~~text
Run only session 3 of StepTrace. Read the repository's AGENTS.md and BRIEF, ROADMAP, and STATE documents first. Continue the existing implementation and repair prerequisite defects only as needed.

Implement adding a new immutable source version and reviewing its differences from the previous version. Use deterministic text comparison and conservative source matching. Preserve original text and keep exact version-specific anchors. Show old and new excerpts. Changed, removed, added, or ambiguous content must remain visible for human review. Repeated phrases or uncertain matches must never silently transfer a previous confirmation to a different requirement.

Flag directly linked tasks for review while preserving completion history. New source material without linked tasks must be visible as unreviewed material; do not imply that an old checklist covers it. Let the person confirm mappings and record a resolution tied to the specific version. A later update must not be cleared by an acknowledgment of an earlier one. Leave transitive dependency propagation for session 4.

Use fictional fixtures covering unchanged content, harmless formatting changes, duplicate phrases, paragraph moves, added/removed requirements, changed numbers, and negation. Explain which changes are automatically matched and which require confirmation. Test correctness, persistence, and recovery through the real interface. Do not add OCR, scraping, or an LLM.

Finish with a working before/after demonstration, actual check results, remaining limitations, an updated STATE, and a logical local commit. Explain the matching tradeoff in language I could use in an interview. Stop at this milestone.
~~~

## Session 4 — Explain which dependent work needs review

~~~text
Run only session 4 of StepTrace. First read AGENTS.md and the BRIEF, ROADMAP, and STATE documents. Keep completion status and review status separate throughout.

Implement user-confirmed task dependencies with a plain 'This step depends on...' interaction. Reject cycles and invalid references. When source-linked work changes, propagate review reasons to dependent tasks, retain the original completion records, and explain the causal chain. Show a short reason such as 'Review proofreading because the essay requirement changed.' A graph may be optional; the core interaction must work as a linear list.

Support multiple simultaneous review reasons with unique change-event/work-revision IDs. Clearing one reviewed change must not clear unrelated reasons, a newer source update, or a later work edit under the same source version. Add an explicit 'I changed this work' action that can flag downstream proofreading even when source instructions remain unchanged; do not claim to observe edits to external files. Keep unaffected tasks untouched. Unknown conditions or conflicting instructions remain unresolved until the person decides or obtains clarification. Incomplete required predecessors, unresolved applicability, and open review reasons block ready-to-proceed labels. Completion must not silently clear review. Retain Does not apply decisions in history and re-review them if their source condition changes.

Use this fictional demo: the essay maximum changes from 500 to 400 words after drafting and proofreading. Essay and proofreading need review, the unchanged recommendation remains complete, and an added conditional requirement is undecided. The app must not assume an existing 380-word essay is invalid or erase prior progress.

Test direct and transitive effects, unrelated tasks, cycles, multiple changed ancestors, review acknowledgments across versions, two work edits under the same source version, readiness gating, and export/import of the resulting state. Verify the demo in the browser. Update STATE, commit the milestone, explain the dependency algorithm and its limits, then stop.
~~~

## Session 5 — Accessibility, offline use, and recovery

~~~text
Run only session 5 of StepTrace. Read AGENTS.md and the project BRIEF, ROADMAP, and STATE. Improve the current workflow without adding a new product area.

Make creating a plan, checking sources, recording progress, comparing updates, resolving review reasons, and restoring a backup usable with a keyboard and clear focus. Use semantic controls, visible labels, readable errors, text status alongside color, comfortable text sizing, and restrained announcements. Provide a calm one-step view and a full checklist. Never require interpreting a dependency diagram. Do not use forced animation, countdowns, or shame-based streaks.

Add offline behavior if feasible for the current architecture, and test it after an initial online load. Handle reloads, interrupted saves, and service-worker updates without losing work. Keep export accessible and disclose browser-storage limitations accurately. Do not claim encryption or zero network traffic unless verified. Verify that application text does not leave the device during core use and that sample/demo content is fictional.

Run appropriate automated accessibility checks plus manual keyboard, narrow-screen, zoom, and available screen-reader checks. Record exactly what was tested and what was not; do not claim complete WCAG conformance from an automated scan. Test storage failures and malformed restore files against existing data. Fix meaningful issues discovered by these checks.

Create concise accessibility and privacy notes reflecting actual behavior. Finish with the checked user flows, unresolved limitations, updated STATE, and a logical local commit. Give me a short explanation of the accessibility choices and stop before evaluation or deployment work.
~~~

## Session 6 — Evaluate usefulness and fix observed problems

~~~text
Run only session 6 of StepTrace. Read AGENTS.md and the BRIEF, ROADMAP, and STATE. Review any interview notes or user feedback I have supplied. Do not invent participants, quotes, outcomes, or revenue.

Create a reproducible evaluation comparing StepTrace with a simple checklist on matched fictional application briefs. Include a static conditional requirement and a source-change scenario. Counterbalance interface and brief order for real participants. Measure missed affected tasks, unnecessary reviews, source-lookup time, setup effort, and whether users understand why completed work is flagged. Also test whether conflicting labeled instructions stay unresolved instead of the app guessing precedence.

Run the engineering fixtures and automated integration checks. Analyze real feedback only if available and consented for this use. If no participant evidence exists, label human evaluation pending, prepare a short test script I can run with adult volunteers, and continue with clearly labeled synthetic correctness results. Do not treat passing fixtures as proof of accessibility benefit or market demand. Do not send recruitment messages.

Fix the most consequential observed usability or correctness issues within this milestone. Record the tested version, protocol, actual sample size, observations, limitations, and reproducible commands in docs/EVALUATION.md. Explain whether the evidence supports source-linked preparation, whether change review is valuable, and what remains unknown. If a simple checklist performs better, report that honestly and simplify where justified rather than manufacturing positive results. If findings change the scope, update BRIEF, ROADMAP, the demo, README, and the remaining milestone instructions as well as STATE so future sessions follow the revised product.

Finish with actual results, the smallest remaining user-feedback action, updated STATE, and a logical local commit. Stop; leave public release and monetization for their sessions.
~~~

## Session 7 — Publish a credible repository and live demo

~~~text
Run only session 7 of StepTrace. Read AGENTS.md and the BRIEF, ROADMAP, STATE, and EVALUATION documents. Inspect actual git state and verify the intended GitHub owner from my supplied account information or available authenticated account. If ownership is unclear, ask for my GitHub URL while completing local release work. Never guess an account or overwrite another repository.

Prepare the real release: clear README, genuine screenshots, a short demo walkthrough, setup and test commands, architecture, known limitations, source citations and prior art, accessibility/privacy notes, and accurate evaluation status. Use a suitable open-source license after explaining its practical implication; preserve any existing license. Remove accidental secrets or private fixture data without rewriting unrelated history. Do not fabricate badges, users, test counts, or impact claims.

I authorize creating or updating a public StepTrace repository in my verified GitHub account and pushing the reviewed project source. Confirm the resulting files and CI status through the remote. Publish a public demo with fictional sample data on an available no-cost host whose current terms fit the app. Keep GitHub source hosting separate from the commercial hosting decision; do not assume GitHub Pages permits a future paid SaaS. Follow the applicable hosting tools and instructions. Do not purchase a domain, enroll in a paid plan, or enter payment details.

Verify the public URL on a fresh visit, complete the main demo flow, check for console/runtime failures, and record the deployed commit. If authentication, account setup, or deployment blocks publication, finish a release-ready artifact and give me the exact remaining action; do not say it is live. Create an appropriately labeled release, update STATE, and stop before editing my profile or resume.
~~~

## Session 8 — GitHub presentation, resume, and LinkedIn

~~~text
Run only session 8 of StepTrace. Read the saved project documents and inspect the actual public repository, deployment, and evaluation. Base every claim on verified implementation or results.

Review my existing GitHub profile in the verified account. Improve its project presentation, add or update a concise profile README without replacing unrelated content, and feature/pin StepTrace where supported. I authorize these profile changes. Avoid manufactured contribution activity, excessive badges, and skills not demonstrated by my work. Preserve other projects.

Draft two or three truthful project bullets tailored to my stated target roles. If I have not supplied a role, use general software-internship wording and label that assumption. If a resume is available, integrate the project while preserving verified history; otherwise provide a ready-to-paste project entry and list the information needed for a full resume revision. Do not invent work experience, users, revenue, performance numbers, or accessibility outcomes.

Create a short LinkedIn project description and a Featured entry linking the verified demo and repository. I authorize adding those project links to my LinkedIn profile; preserve the rest of the profile. Preview the wording and follow any action-time confirmation requirements. Do not post a feed announcement or send messages. If profile editing is unavailable, deliver the exact text and a short placement guide, and clearly say it has not been published.

Prepare five interview questions about this project and concise answers grounded in the code, especially source matching, dependency review, accessibility, local persistence, and tradeoffs. Distinguish what I should understand personally from what automation implemented. Save the career material, update STATE with the actual remote/profile outcomes, and stop. Do not start payment integration.
~~~

## Optional session 9 — Test a paid offer

Use this after the core product works. A usable portfolio release does not require it.

~~~text
Run only the optional commercialization session 9 for StepTrace. Read the project documents and available real feedback. First decide whether the evidence supports investing more. If changing instructions rarely matter, setup effort outweighs value, or no individual wants a specific paid convenience, recommend a bounded validation experiment or stop commercialization. Do not build billing just to create the appearance of a business.

Keep source-linked preparation, core change review, accessibility, local storage, and basic export free. Choose one optional individual-paid capability based on evidence, such as reusable workspaces or a managed backup service. Compare it with current alternatives. Treat a $12–$24 application-season package as a test hypothesis, not proven pricing. Explain what customers would pay for despite the open-source core.

Create a concrete offer page or clearly labeled mockup, an interview script, and a go/no-go rule based on observable interest and expected operating cost. Separate stated interest from actual purchase evidence. Do not invent demand, testimonials, or conversion figures; do not accept payments for unavailable functionality. Do not publish outreach, send messages, start paid services, or collect personal data without the required authorization.

Document the proposed free/paid boundary, maintenance obligations, current provider-cost sources if relevant, and the one smallest implementation justified by the evidence. Finish with a recommendation and updated STATE. Leave implementation to session 10.
~~~

## Optional session 10 — Implement only the justified paid capability

~~~text
Run only the optional commercialization session 10 of StepTrace. Read the project documents and the session 9 decision. Implement the single paid capability only if that decision and available evidence support it. If validation is still pending, finish the smallest validation asset and report what decision remains instead of building speculative infrastructure.

Preserve the useful free core and existing data. Make the paid capability work before adding checkout. Use minimal architecture; add a Java backend only if it has a justified role and the operating burden fits the agreed scope. If payment integration is warranted, use the selected provider's current official documentation and test mode. Keep secrets server-side; validate signed webhooks, handle retries idempotently, enforce entitlements appropriately, and test cancellation/failure paths. Never rely solely on browser flags to authorize a paid hosted service.

Do not collect real payments, activate live billing, accept contractual account terms, or create paid infrastructure without the required specific approval. Prepare all reviewable implementation and test results first. If the optional feature involves sync or backups, verify access control, restore behavior, deletion, and accurate privacy wording before proposing launch.

Finish with a working test-mode demonstration, current cost estimate with assumptions, actual tests, updated documentation and STATE, and the exact remaining live-launch decision. Report observed revenue only if real transactions actually exist. Stop at this milestone.
~~~

## Recovery prompt — Resume an interrupted milestone

~~~text
Resume the existing StepTrace project without starting a new milestone. Locate the repository from this task's saved notes and read AGENTS.md, docs/BRIEF.md, docs/ROADMAP.md, and docs/STATE.md. Inspect git status, recent commits, and the working app. Determine what the last session actually completed and what remains; do not trust a completion label without evidence.

Finish only the unfinished work for that milestone, preserve my changes, and run the relevant checks. If the remaining work is larger than one reasonable session, choose a coherent smaller boundary and record the remainder. Do not expand scope, repeat the entire research, recreate the repository, or automatically begin the following session. Update STATE with exact next steps and end with a concise outcome and any concrete blocker.
~~~
