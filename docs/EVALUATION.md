# Session 6 evaluation

September 22, 2026 · protocol version 1 · package 0.6.0 · **Human evaluation pending; actual participant sample size: 0.**

## Evidence and tested version

No interview answers, consented participant observations, or user feedback records were supplied in the repository or task research files. INTERVIEWS contains prepared questions only. The retained research discusses other work; it is not participant evidence for StepTrace. No participants were contacted, no quotations were invented, and no revenue was observed.

This report covers the Session 6 working tree based on commit `862291e`, on `codex/session-6`. The logical local milestone commit includes this report. Its exact engineering inputs are identified by the SHA-256 in [the committed synthetic result](evaluation/synthetic-results.json): `944131bfc824be4f9763c78d433678581a8bba666297a5f8a26ce63d9adf9fd1`. The report's `gitRevision` deliberately names the base plus working tree, not an uncommitted future hash. The runner hashes sorted paths and contents of both interfaces, fixtures, scripts, tests, package metadata and launcher; its file list is in the JSON. Documentation and generated reports are excluded to avoid a self-referential digest.

Environment: macOS, bundled Node v24.19.0; real-interface checks used the Codex in-app browser on isolated loopback origins 4196 and 4197. This was an agent-operated engineering walkthrough, not an adult volunteer session. Browser version and assistive-technology performance were not measured. Session 5's separate accessibility/offline evidence is preserved in [its checks](history/SESSION-5-CHECKS.md).

## Reproduce

From the repository root:

```sh
./run.sh check
STEPTRACE_TESTED_REVISION=862291e+session6-working-tree ./run.sh evaluate
./run.sh evaluate-ui
```

The kit opens at `http://127.0.0.1:4196/evaluation/`; its StepTrace link opens the same application modules at `/`. The kit is a separate development server, with no upload endpoint, telemetry or service worker. The regular `./run.sh` app remains at port 4173 and does not expose evaluation files. There are no added package dependencies.

Optional engineering-only before/after backups:

```sh
./run.sh evaluate --backups work/new-fictional-evaluation
```

Use a new directory each time: existing files are never overwritten. It creates A-before, A-after, B-before and B-after JSON backups using the actual model. Fresh UUIDs and timestamps vary; the scored results and source texts do not. Never use these prebuilt plans in a participant's timed setup.

[The protocol](EVALUATION-PROTOCOL.md) is the facilitator's runnable script. [The blank observation record](evaluation/blank-observation.json) contains no observations. Keep consenting participants' future raw records outside git and the served directories.

## Matched comparison and measures

Two authored fictional briefs have equal task/dependency structure: Maple (A), 500→400 words with a 380-word draft, and Willow (B), 450→350 with a 330-word draft. Each starts with six task roles, four completed records, a static undecided condition and conflicting Portal checklist/Guide instructions. The update changes the essay maximum and adds a different conditional requirement. No provided fact determines either condition, and no label establishes precedence.

Each adult volunteer will try both tools with different briefs. Four sequences counterbalance interface order, brief order and interface/brief pairing across a complete batch of four. Both tools receive the same source sheet, work context, fixed practice example and 30-second pause before the update. Participants start scored work empty; StepTrace's link/dependency setup cost is included. The simple checklist permits editable tasks, completion, manually chosen review, applicability, notes and browser Find. Its worksheet is explicitly in-memory and can be copied as JSON; reload loses it.

The protocol defines starts, stops, denominators, assistance, censoring and neutral prompts for:

- Missed affected original tasks and unnecessary update-attributed reviews, scored against an authored answer key independent of StepTrace's flags.
- Source-lookup time and correctness for the original recommendation instruction.
- Setup time, assistance and optional effort rating; update effort separately.
- Understanding that completion survives, dependencies explain review, and a flag does not prove work is invalid.
- Static/added conditions remaining undecided, and conflicting labeled instructions remaining unresolved.

Human measurements for both tools are **not available**: misses, unnecessary reviews, setup/lookup time, effort, comprehension, preference and accessibility benefit remain unmeasured (`null`, not zero). A checklist's lack of automatic flags is not a measured human failure.

## Actual synthetic results

Final automated run: **126 tests passed, 0 failed**, plus JavaScript syntax, asset and fictional preview checks. This includes 114 prior regression tests, 10 evaluation tests and 2 manual-checklist/server tests. The model/storage integrations exercise real modules; they are not browser timing studies.

| Authored scenario | Expected affected original tasks | Automatically flagged by StepTrace | Missed | Extra reviews |
| --- | ---: | ---: | ---: | ---: |
| Matched A | 3 | 3 | 0 | 0 |
| Matched B | 3 | 3 | 0 | 0 |
| Adjacent context changes, recommendation unchanged | 3 | 4 | 0 | 1 recommendation |
| Duplicate phrase, recommendation unchanged | 3 | 4 | 0 | 1 recommendation |

These are four scripted scenarios, not four participants or population estimates. Expected affected roles are draft, proofreading and packaging. The extra recommendation flags are counted as review burden under the semantic fixture answer key. The matcher requires a unique exact passage in stable local context, so it intentionally does not silently transfer confirmation in these stress cases. The oracle was not changed to hide the extra work.

Both matched fixtures and both stress fixtures preserve original completion histories and exact source anchors, survive backup parsing/additive restore and simulated storage reload, and report a simulated quota failure as unsuccessful without changing saved bytes. The scorer is tested with deliberate wrong, missing, duplicate and unknown choices.

Two additional unresolved-choice fixtures pass: a negated static condition and a revised label on conflicting instructions. Each retains Not decided and an open source review through export/import; no precedence is inferred. A separate test confirms that acknowledging a source mapping while choosing Not decided leaves the applicability blocker intact. Existing comparison/dependency fixtures cover formatting, moves, duplicate text, changed numbers, negation, cycles, multiple ancestors and older acknowledgments versus newer events.

Scripted setup operations for each matched brief were 13 StepTrace domain calls (application + six tasks + four completions + two dependency confirmations), versus 11 checklist calls (checklist + six tasks + four completions). These are **API operation counts only**, excluding real reading, selecting, typing and human decisions. They do not measure effort or establish a winner.

## Real-interface observations

The walkthrough used generated fictional setup data to test integration, explicitly outside participant setup timing.

1. The manual checklist accepted a task, retained completion when updated instructions were revealed, and changed review only when explicitly selected. Its exported record retained independent completion/review/applicability. An invalid blank wording edit reverted to the actual retained title and showed an error.
2. Loaded A-before through the real file chooser, inspected its six-task restore preview, then applied it to an empty test origin. Exact-source lookup selected “Provide one recommendation.” from version 1.
3. Pasted the matched A update, inspected old/new 500/400 excerpts and added conditional text, and saved version 2. The UI showed one direct and two dependent reviews. Four completion records survived; the recommendation had no open review; the original condition and conflict remained Not decided.
4. The added return-plan text appeared as unreviewed material before a task was made. Selected its exact excerpt and created an explicitly undecided task.
5. Malformed JSON produced an error; exports before/after had exactly equal workspace objects. Reload also produced exactly equal workspace objects, retaining four completed and three undecided tasks. A duplicate backup preview rejected the colliding IDs without applying changes.
6. Added a third source version changing “Guide” to “Guide (revised edition)” while preserving the conflict. It opened a conflict source review and kept Not decided. The unresolved earlier essay link also produced a newer review event; older open reviews and completion records survived.
7. Exported that three-version state, previewed and restored it on a second empty origin, then re-exported. Workspace objects were exactly equal. The original recommendation excerpt remained reachable in version 1.
8. Inspected the participant page visually: fictional/pending notice, assigned brief, work context and copyable source were readable at the tested desktop size.

These observations do not provide setup/lookup times, participant comprehension, mobile certification or screen-reader evidence. Ordinary reload and validation recovery were checked here; new real-browser quota/crash/offline fault injection was not repeated. Automated failure tests ran; earlier actual offline/interrupted-save browser checks remain documented separately. No storage was cleared to make a test pass.

## Fixes justified by the observations

- The stress fixtures expose extra review burden even when a recommendation is semantically unchanged. The related-work cause label formerly said “Source instruction change”; it now says **“Source-link review.”** The task status explains that completed work may still satisfy the instructions. This removes an overstatement in the authored interface. It is not a demonstrated improvement in participant understanding.
- The baseline's blank wording edit could display an empty value while its model retained the previous title. It now reverts a rejected edit to the retained wording. Notes no longer announce saving on every keystroke. These avoid a misleading comparison worksheet; no participant failure rate is claimed.
- The protocol audit supplied a fixed practice card, isolated practice-only checklist tab and recorded 30-second pause, so facilitators need not invent different practice conditions.

No matching-rule, schema, dependency or eligibility behavior changed. Conservative matching was retained because automatic reassignment of uncertain instructions would weaken the central invariant. The existing fictional product demo remains accurate.

## What the evidence supports

**Source-linked preparation:** engineering evidence supports that exact instruction links and progress records remain usable across source versions, reload and restore. It does not show that people find sources faster or that setup is worth the effort.

**Change review:** engineering evidence supports the recorded dependency chain and preservation of unresolved conditions. The stress fixtures establish a concrete cost: an unchanged task can receive an extra review. Whether change review is valuable in actual applications is unknown, including how often instructions change and whether people notice/understand the reasons.

**Simple checklist:** there is no human performance comparison or winner. It has fewer scripted setup operations and could perform better for stable instructions or sparse dependencies. Passing fixtures is not proof of accessibility benefit, market demand, retention, willingness to pay or revenue. Do not expand the product or manufacture a positive verdict from these results.

The matched briefs use deliberately stable paragraph boundaries around independent instructions. They do not represent arbitrary real documents; the stress cases illustrate where that favorable structure breaks down. The fixtures and semantic oracle are author-created, not externally validated. Missing user-created links, distant conditions and external edits remain outside what the app can observe. The app does not interpret labels as authority or automatically understand contradiction; the person records and resolves uncertainty.

Scope is unchanged. BRIEF, ROADMAP and README now record the pending evaluation and its limits; the demo and saved future milestone prompts need no scope rewrite. Future scope changes must still update them together.

## Smallest remaining feedback action

Run one consenting adult through the two assigned blocks using the protocol, with local nonidentifying notes and no real documents. Record the paired misses, extra reviews, lookup/setup measures and explanation of flags before offering an explanation. This first pilot checks the script and finds friction; four complete sessions are needed for one balanced order batch. Report a checklist advantage honestly and simplify StepTrace if observed costs outweigh its value. No recruitment messages were sent.

Session 6 stops here. Public release, profile work, monetization and further features require their own user-requested sessions.
