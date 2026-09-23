# Session 5 checks

Checked September 20–22, 2026. This is an engineering check of selected states, not complete WCAG conformance, security certification, or a participant evaluation. Session 4 evidence is preserved in `history/SESSION-4-CHECKS.md`.

## Automated checks

Run `./run.sh check` from the repository. The final test count is recorded in STATE. It checks JavaScript syntax, assets, fictional fixtures, domain invariants, and the Node test suites.

Session 5 adds coverage for:

- Same-tab draft round trips, application-specific keys, rebinding shared forms, hidden-field clearing, malformed journals without partial restoration, denied/quota storage, failed draft removal, and reload guards.
- Interrupted writes before and after the primary write, exact recovery data, additive schema-1/2/3 restores, conflicting/malformed batches with existing data unchanged, and conflict detection after preview.
- Complete-shell install, failed install/body read with the previous cache retained, offline allowlisted requests, explicit worker activation, update/reload save guards, cache repair, server revision changes, and GET/HEAD allowlisting. A three-connection simulation verifies that response bodies drain before waiting for all assets; this fixes the browser installation stall found during this session.

### Axe scan

Pinned **axe-core 4.10.3**, SHA256 checked by the test server, was run in the Codex in-app browser on the actual interface (September 21), with a final Chrome scan on September 22:

| Visible state | Viewport | Result |
| --- | --- | --- |
| Create form and populated restore preview | 1280 × 720 | 0 violations; 47 rules passed, 43 inapplicable |
| Full checklist, open source review and saved comparison | 1280 × 720 | 0 violations; 47 rules passed, 43 inapplicable |
| One-step view with Larger text | 320 × 740 | 0 violations; 47 rules passed, 43 inapplicable |
| Final Chrome checklist, resolved review, comparison and export | 1512 × 700 | 0 violations; 47 rules passed, 43 inapplicable |

Scope: WCAG 2 A/AA, 2.1 A/AA, 2.2 AA and best-practice tags, excluding the test diagnostics panel. All four scans left `color-contrast` incomplete for visible textareas: the engine reported a partially obscured background. These were **not** converted into automated passes. Visual inspection found readable text and no covering app overlay. A separate calculation of the authored opaque colors gives text `#20334c` on white **12.81:1**, on snapshot background `#f7f9fc` **12.15:1**, helper text `#526379` on white **6.14:1**, and blue focus `#096bbe` on white **5.44:1**. This is a limited color check, not a complete contrast audit of every state.

Reproduce the scan with fictional data:

```sh
mkdir -p work/axe-core-4.10.3
curl --fail https://registry.npmjs.org/axe-core/-/axe-core-4.10.3.tgz -o work/axe-core.tgz
tar -xzf work/axe-core.tgz -C work/axe-core-4.10.3
PORT=4191 node tests/accessibility-server.mjs
```

Open `http://127.0.0.1:4191/?diagnostics=1`, prepare the desired visible state, and choose **Run axe accessibility scan**. Engine files stay in ignored `work/`; no third-party script is added to production. On this Mac use the bundled Node path in STATE if `node` is unavailable.

## Manual browser checks

Tools: real Chrome on macOS and the Codex in-app browser, with semantic UI automation, native keyboard events, accessibility-tree inspection, and screenshots. Fixtures were fictional. Tests used separate origins (4190 initially, then 4191/4193/4194); the user's earlier 4173 workspace was not cleared or edited. These were selected keyboard flow checks, not a continuous audit of every possible Tab order.

| Flow | Observed result |
| --- | --- |
| Create a plan | Entered name/source, reloaded before submission, recovered both fields, submitted with Enter; application heading received focus. |
| Link a task | Keyboard selected source text, Tab → Use selected excerpt → task wording, chose applicability, added task. Exact text was retained. |
| Check sources | View exact source focused the read-only textarea and selected the excerpt. Return to task focused its heading with a visible outline. A stale return link after application changes was found and fixed. |
| Record progress | Space toggled completion. Completion text and checkbox state agreed. One-step view stayed on the same task. |
| Navigate views | Full checklist and One step at a time used native radios; Next step focused the new task heading. No diagram or timed transition was needed. |
| Compare updates | Preview heading received focus; saving an updated version opened the comparison and review overview while completion remained recorded. |
| Resolve source review | Selected a passage, confirmed applicability, entered a note, and recorded the resolution with the keyboard. Focus returned to the task; completion remained. |
| Resolve dependent review | Entered a note and recorded one reason for proofreading. The essay's independent source review remained open. Causal path was an ordered text list. |
| Preserve a linked draft during an update | An unsent 500-word source excerpt and task title survived saving a 400-word version. Add task then refused the old anchor with a focused explanation; selecting the current excerpt allowed submission. |
| Correct a selection error | Empty selection produced a readable error with focus; Return to the control restored focus to Use selected passage. |
| Export and restore | Prepare JSON backup focused the read-only JSON. Pasted export was previewed and restored on a separate origin. Existing records retained their IDs, sources, mappings and histories. |
| Reject malformed input | Malformed pasted JSON produced a focused readable error. Workspace exports before/after had exactly equal workspace objects. Automated tests also cover malformed/conflicting backup batches against existing data. |
| Narrow screen | At 320 × 740 with 125% text, one-step controls wrapped vertically, the task heading remained visible, and diagnostics reported scroll width = layout width (305 CSS pixels) with no overflowing app elements. |
| Zoom | Native Chrome zoom checked at 200% and 400%. Panels stacked and backup remained keyboard-reachable; at 400%, page scroll width = layout width (374 CSS pixels). Zoom was restored to 100%. |

### Failure recovery in Chrome

On isolated origin 4194, seeded a normal saved workspace, restarted the fault server with `STEPTRACE_STORAGE_FAULT=interrupt-once STEPTRACE_FAULT_ID=session5-case1`, reloaded, and added a fictional task. The primary write failed before mutation and the UI said **Not saved**. Export still contained the pending task. A same-tab reload recovered a workspace exactly equal to that export. Retry saving succeeded; another reload retained the task and removed the pending-recovery notice.

Restarting the same harness with `STEPTRACE_SESSION_FAULT=unavailable` left primary workspace saving functional. Editing showed the explicit draft-recovery warning; submitting saved successfully and export remained reachable. This simulated denied storage, not a browser quota filled with real user data. The Node tests separately exercise quota, unreadable storage, interrupted writes, and conflicting data.

### Offline and app update in Chrome

After an initial online load on **4193**, the UI reported that app files were ready. Stopped the verified local app-server process and confirmed that nothing listened on that port. Reload succeeded from the cached shell; saved workspace equality and the unsubmitted `Fictional offline reload draft` were preserved. Added and completed that task, opened comparison, exported, and reloaded again with the server still stopped: the resulting workspace was exactly equal.

Restarted the server with a changed shell revision (a CSS comment change). The new worker offered **Update app and reload**, without automatically reloading the page. Chose it while an unsubmitted fictional task draft existed. After activation/reload, the draft remained and exported workspace objects were exactly equal. The UI again reported offline readiness. Save-denied and recheck-before-reload branches are additionally covered by automated protocol tests.

This is a real-browser **app-origin outage** check. Wi-Fi/OS-wide networking was not disabled, so `navigator.onLine` could remain true. Actual device power loss, process termination at every possible instruction, browser cache eviction, OS low-storage eviction, private browsing, multiple simultaneous editors, mobile browsers and Safari/Firefox were not exercised end to end.

The first test port, 4190, is on the browser Fetch blocked-port list and must not be used for offline verification. A later genuine install stall on 4193 exposed unread response bodies holding connections; the code was fixed and the successful checks above used the correction.

## Privacy and assistive-technology limits

Static audit of production sources found no app-content fetch/XHR/beacon/WebSocket/EventSource calls or external assets. Local files use File/ArrayBuffer and TextDecoder; export uses Blob/object URLs. The server serves allowlisted static assets on loopback, with no upload endpoint. Runtime diagnostics on the audit origin observed only same-origin static scripts/styles and **no fetch/XHR/beacon calls** during checked creation, source selection, completion, version comparison, review resolution, export, restore and application switching. A final Chrome diagnostic also recorded no page script errors. Production offline operations above worked without the app server. This evidence supports local processing by StepTrace; it does not inspect browser/OS/extension traffic or certify that all device traffic is absent. A Grammarly integration was present in Chrome's accessibility tree; extensions were not disabled or audited. See PRIVACY.

The optional `STEPTRACE_SW_TRACE=1` harness was used only on isolated 4195 to locate the installation stall. It modifies the diagnostic worker and sends app-file metadata to its local test server. That trace mode is not production and is not evidence for production network claims. The successful offline/update checks used the uninstrumented production worker on 4193.

Accessibility-tree checks confirmed labels, headings, checkbox/radio state, named regions and focus targets. **No spoken VoiceOver, NVDA or other screen-reader session was verified**; the testing tools did not capture speech output. Live-region timing, virtual-cursor reading order and exact-text selection with a screen reader remain unverified. No blind-user testing or complete WCAG conformance is claimed.

Malformed file-picker testing was attempted in Chrome: the extension refused setting a local file because file-URL access was disabled, and the native picker fallback did not complete. No extension permission was changed. Pasted malformed JSON and parser unit checks were completed; this session does not claim a successful native malformed-file selection or a newly verified download-to-disk. The copyable JSON export path was checked; earlier file input/download evidence remains in the archived checks.

No participant evaluation, benefit measurement, market study, public repository, deployment, profile update, payment or outreach was performed.
