# StepTrace versus a simple checklist: pilot protocol

Protocol version 1, September 22, 2026. **Human evaluation pending: actual human sample size is 0.** This is a runnable plan, not a study result. No participants, quotations, preferences, accessibility outcomes or revenue are represented here. Read [EVALUATION](EVALUATION.md) for the tested software version and actual synthetic checks.

## Question and comparison

Does recording exact instruction links help a person prepare and return to fictional application work, and does explained downstream review help after instructions change enough to justify its setup effort?

Each consenting adult tries both interfaces, using a different matched fictional brief in each. StepTrace is the existing application. The baseline is an ordinary editable checklist with manually entered tasks, completion, review status and notes; the same complete original and updated instructions are available. It has no automatic source links, comparison or dependency propagation. Participants may use notes and browser Find in either interface. Do not remove baseline features to make StepTrace look better.

Both briefs contain six initial task roles: drafting, proofreading, packaging, recommendation, a static condition whose applicability is unknown, and a conflict between two labeled instructions. The first four have previously been completed. The later update changes a maximum and adds a different conditional requirement. A fictional existing draft remains under the new maximum. Participants are not asked to write an essay, determine eligibility or submit anything.

The source wording, work context and task cards are in `evaluation/fixtures.js`. Those files are fictional and must remain fixed within a pilot batch. Before the first participant, record the commit, protocol version, browser/version, operating system, viewport/zoom, input method, any chosen assistance and the exact fixture revision. A fix starts a new version stratum: do not silently pool observations across versions.

## Prepare locally

```sh
./run.sh check
./run.sh evaluate
./run.sh evaluate-ui
```

Open `http://127.0.0.1:4196/evaluation/` for participant materials and the simple checklist. Its StepTrace link opens the real application on the same local server. Use a dedicated test browser profile with fictional data; never clear an existing personal workspace. Use one editing tab for StepTrace. Export only fictional workspace records if useful for scoring; the observer's timings are recorded manually. The kit does not collect participant telemetry.

The facilitator keeps the answer key, scorer output and this protocol out of the participant's view until both blocks finish. Do not preload the scripted StepTrace demo or prebuild source links for the timed setup: that would hide setup cost. Begin each block with an empty evaluation checklist/application. Give both interfaces the same task card and full source text.

## Consent and short read-aloud script

Plan about 35–45 minutes, with breaks or an early stop whenever the volunteer prefers. A partial session is useful and remains partial. The suggested time windows below are administrative limits, not speed targets. Do not display a countdown.

Read before starting:

> We are trying two ways of organizing fictional scholarship work. We are testing the tools, not you. There are no real application documents or eligibility decisions. This is for adults who are at least 18. You can skip any question, take a break or stop without giving a reason. I would like to keep anonymous task observations and your optional comments locally to improve this project. I will not collect your name, application details or a diagnosis, and I will not record audio or video. Is it okay to proceed and use those observations for that purpose?

Record consent and adult confirmation without a name or exact age. If either is absent, do not collect or analyze observations. Use a nonidentifying session code such as `P001`, with no identity lookup list. Offer that code for later withdrawal. Before consent, the facilitator must specify a real retention deadline and who may read the notes; a suggested small-pilot default is deletion of raw notes 30 days after the local report. Do not claim consent to publication, quotations or unrelated research. Ask separately before retaining a verbatim quote; default to nonidentifying paraphrases. Never record sensitive information volunteered incidentally.

Then read:

> You will try both tools with different fictional briefs. Set up the supplied work plan as you normally would, using the instructions and work context. Record what is already complete and anything you cannot yet decide. You may use the source text, notes and browser Find. Tell me when your plan is ready for you to return to later. I can explain the study instructions, but I will record help with the tool separately.

For the source lookup, read the brief's lookup prompt verbatim, then:

> Please show me the instruction you used and explain what you can decide from the information available.

After setup and lookup, take a 30-second pause in each block with the source sheet and plan out of view. Do not discuss the task or reveal the update during the pause. Record the actual pause length in `facilitatorDeviations`, including an extension if the person needs a longer break; breaks are always allowed. The pause is outside setup, lookup and update timing. Then read:

> Imagine you have returned to this work. Here is the updated instruction sheet. Update your plan to show what, if anything, you would revisit, what can remain as it was, and anything you cannot yet decide. You are not being asked to redo the fictional work now. Tell me when you are finished.

After their final plan, ask without showing the answer key:

1. “What would you do next, and why?”
2. “What does this plan say about the work you had already completed?”
3. “Does it tell you that any completed work is wrong? What makes you say that?”
4. “How would you handle the two differently labeled instructions?”

For StepTrace only, after those answers, point neutrally to one flagged completed task and ask “What does this message mean to you?” Record the response before explaining anything. For the checklist, ask the equivalent question about a completed task they marked for review, or record that none was marked. A missing flag must not erase the missed-task score.

After each block ask: “How much effort did setting up this plan take?” Record an optional 1–7 answer, with 1 = very little effort and 7 = very much effort, plus their reason. This is a custom descriptive question, not a validated scale.

After both blocks ask: “Which, if either, would you choose for instructions that stay the same? Which for instructions that change? Why?” Optionally ask the five experience questions in [INTERVIEWS](INTERVIEWS.md), accepting “this has never happened.” Separate reported past experience from observed task behavior and stated future preference. Do not pitch the product or ask for a payment commitment.

## Balanced order and equal practice

Assign successive consenting sessions to the next row before seeing their performance. Repeat complete blocks of four when practical. Do not choose an easier sequence for a preferred participant or discard a partial session. If fewer than four finish, report the resulting imbalance.

| Sequence | First block | Second block |
| --- | --- | --- |
| 1 | StepTrace, brief A | Checklist, brief B |
| 2 | Checklist, brief A | StepTrace, brief B |
| 3 | StepTrace, brief B | Checklist, brief A |
| 4 | Checklist, brief B | StepTrace, brief A |

This balances interface order, brief order and interface/brief pairing across four complete sessions. The static phase necessarily precedes its update within each block; that order is not counterbalanced. Learning, fatigue and the matching assumptions can still affect results.

Before timing each interface, allow up to three minutes of practice using the same card below. Record practice duration and help; if more time is needed for access, allow it and note the deviation. Use the participant's chosen text size, input method and assistive technology consistently where possible; note differences without requesting medical details. Do not reveal the evaluation update or its expected affected tasks.

**Practice card — fictional, not scored**

> Garden Club practice exercise.
>
> Write a two-sentence welcome note.
>
> Place a checked copy of the welcome note in an envelope.
>
> The note is already written. The envelope step is not complete and uses the note. Both steps apply. Nothing changes in this practice exercise.

Show this identical card separately from briefs A/B (a local copy or paper is sufficient). Give the same sequence of practice instructions in both interfaces:

1. Create “Write welcome note” and “Prepare envelope” using the card.
2. Record that both apply, the note is complete and the envelope is incomplete.
3. Find the instruction supporting the note. If the tool has an exact-source control, try it; otherwise locate the passage on the card and optionally record it in notes.
4. Record that preparing the envelope uses the note. Show StepTrace's “This step depends on…” control or the checklist's notes field, respectively.
5. Locate where review information appears and where a record can be prepared for copying/export. Explain each interface's actual saving behavior; the checklist keeps rows only in its current tab. No changed-source example or review answer is supplied in practice.

Keep practice separate from scored work without deleting application data. In StepTrace, create a new application named “Practice — not scored” from the practice card, then leave it intact and create a separate new application for the assigned brief. Use one StepTrace editing tab. For the checklist, use a separate temporary tab at `/evaluation/#checklist`, with the checklist heading in view; do not use or read its A/B source panels during practice. After practice, close only that temporary checklist tab and open a fresh evaluation page for the assigned brief. Closing this known practice-only tab discards only its in-memory practice rows; it does not clear browser storage or any scored/personally saved work. For a later checklist block, again open a fresh page with empty rows. Confirm the scored interface is empty before starting setup timing; do not transfer practice tasks or prebuild the scored plan.

## Observe and score

Use [the blank observation template](evaluation/blank-observation.json). The independent fixture answer key determines task membership, not the app's flags. Capture the participant's final decisions before scoring. Allow synonymous task names by mapping them to task roles and retaining the original wording. A missing task still counts when it is affected. Record ambiguous role mappings for adjudication rather than guessing.

| Measure | Start/end and scoring rule |
| --- | --- |
| Setup effort | Start when the participant can first read the assigned source and work card in the empty interface; stop when they say their initial plan is ready. Include reading, task entry, source links/dependencies, applicability and completion decisions, and help time. Record elapsed seconds, assistance episodes, and the optional 1–7 effort answer separately. |
| Source-lookup time | After setup, start when the entire lookup prompt has been read; stop when the participant displays the correct source passage supporting the recommendation task, or explicitly gives up. Record elapsed seconds and correctness independently. If they show the wrong passage and say they are done, retain the elapsed time as an incorrect response, not a successful lookup. |
| Missed affected tasks | After the update, count expected affected original task roles absent from the participant's final set of work needing recheck. There are three expected affected roles per brief. Report the count and denominator, including missing setup tasks; also report an exploratory count restricted to correctly represented setup tasks to expose setup/return differences. |
| Unnecessary reviews | Count original unaffected task roles newly designated for recheck *because of this update*. There are three unaffected roles. An already-undecided condition or unresolved conflict remaining open is not an extra review. Report the recommendation separately: it is the originally complete unaffected task. Mere reading/comparing an instruction is not unnecessary review. When intent is unclear, ask “What work would you recheck?” without suggesting a task. |
| Understanding completed-work flags | Score each of three concepts independently from unprompted/post-task explanations: prior completion is retained; a source change can affect downstream work through its dependency; review requests a check and does not establish that the work is invalid. Use demonstrated / contradicted / not demonstrated, retaining a nonidentifying paraphrase. Do not turn silence into agreement. |
| Static condition | Before and after the update, record whether applicability is undecided, guessed, or explicitly dependent on getting missing information. No provided fact determines applicability. |
| Added material | Record whether the new conditional requirement is noticed and kept undecided. This is separate from the three affected old tasks and from unnecessary reviews. |
| Labeled conflict | Record whether the conflict remains unresolved with clarification needed, or the participant/app chooses an unsupported precedence. Neither label establishes authority. Record the actual choice and any tool message that encouraged it. |
| Update effort | Secondary descriptive measure: start when the complete new source is revealed; stop at the participant's final updated plan. Include lookup and rework. Keep this separate from setup and static lookup. |

The lookup target is the recommendation in both briefs. Read: “Please find and show the original instruction that supports your recommendation step.” The exact passage is “Provide one recommendation.” Record the passage selected, not just “correct.” Conditional understanding is scored separately from lookup speed.

Use suggested administrative limits of 10 minutes for setup, 3 minutes for lookup, and 8 minutes for update. These can be extended for access needs; record the extension and use it consistently across that person's blocks. A timeout or stop is censored: store the observed elapsed time and `timed_out` or `stopped`, never zero or a fabricated finish time. Keep unsatisfied task counts as observed-at-stop, clearly distinguished from completed-block scores. Pause the timing for facilitator interruptions unrelated to the task and record the excluded duration; tool confusion, errors and requested help remain in elapsed time. Think-aloud speech can alter timing, so do not require continuous narration. Log each assistance episode, what prompted it, and whether it supplied procedural or substantive help.

## Facilitator answer key — do not show during tasks

Verify these expectations against the committed fictional fixtures before the first session. Human scoring must not derive its expected set by calling StepTrace's matching or propagation functions.

| Role | Before update | Expected after update |
| --- | --- | --- |
| `draft` | Complete; fictional draft is 380 words in A, 330 in B | Recheck changed maximum: A 500→400, B 450→350. Do not assume the shorter existing draft is invalid. Completion remains recorded. |
| `proofread` | Complete; depends on draft | Recheck because its drafting prerequisite is affected. Completion remains recorded. |
| `package` | Complete; depends on proofreading | Recheck through the drafting → proofreading → packaging chain. Completion remains recorded. |
| `recommendation` | Complete; independent | Remains complete, with no new review caused by this update. |
| `staticCondition` | Not decided; part-time status in A, distance-learning status in B is unavailable | Remains undecided. Its unchanged uncertainty is not a new update review. |
| `conflict` | Not decided; Portal checklist says include an item while Guide says do not include it | Remains unresolved; seek clarification. Neither label establishes precedence. A concerns a budget; B concerns a timetable. |
| `addedCondition` | Not present in original source | Notice new material and leave applicability undecided because the relevant fact is missing. Do not assume the old checklist covers it. |

Expected affected original set: `draft`, `proofread`, `package`. Expected unaffected original set: `recommendation`, `staticCondition`, `conflict`. Preserve completion separately from all review/applicability decisions. If the application adds a conservative contextual-review flag outside this semantic oracle, count it as extra product review burden; do not rewrite the oracle to excuse it. Document why the algorithm did so separately.

## Analysis and honest decisions

Analyze only records with consent for this use. Currently there are none. Keep the denominator for every metric: consented, started, completed, timed out, stopped, missing and assisted observations. Missing values are `null`, not zero. Report each person's paired outcomes, sequence and brief; show ranges and small-sample descriptive summaries only when data exist. Do not claim statistical superiority or generalize from a convenience pilot. Do not average censored times together with successful completion times as though they were equivalent.

Before observing anyone, use these pragmatic decision rules, not purported validated thresholds:

- Any observed data loss, unsafe inference of precedence, hidden uncertainty or erased completion warrants investigating and fixing that defect before another participant. Preserve the original observation and software version.
- Compare static preparation separately from change review. If source lookup is easier but dependency setup costs more than it saves, consider keeping source-linked preparation while simplifying optional change tracking. Do not amortize setup against an invented frequency of future updates.
- If the checklist has fewer misses, less unnecessary review, lower effort or clearer understanding, report the result and its context. Do not select only favorable measures. Examine whether StepTrace should be simplified before expanding it.
- Repeated confusion across people is a reason to revise wording or flow, not proof of population prevalence. Record isolated issues too, especially those preventing completion.
- Positive synthetic checks establish only that the fictional invariants hold in the tested implementation. Positive volunteer performance is preliminary usability evidence, not proof of accessibility benefit, market demand, repeated use, willingness to pay or revenue.

An observation that changes product scope requires aligned updates to BRIEF, ROADMAP, demo, README, remaining milestone instructions and STATE. If no human data exist, retain the hypotheses as untested rather than manufacturing a product verdict. Keep public release and monetization outside this milestone.

The smallest next feedback action is one consenting adult completing both assigned blocks, with the resulting paired observations retained locally under this protocol. That checks the script and exposes friction; it does not complete a balanced batch or validate demand. No recruitment messages are authorized or sent by this protocol.
