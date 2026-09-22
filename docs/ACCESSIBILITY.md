# Accessibility notes

Session 5, September 22, 2026. These notes describe the implemented interface. [CHECKS](CHECKS.md) records the actual automated and manual checks, environments, and omissions. This is not a claim of complete WCAG conformance or a measured accessibility benefit.

## Using the workspace

- Use the skip link or **Workspace sections** links to reach creation, sources, tasks, comparison, and backup. Tab and Shift+Tab move through native controls; Enter or Space activate buttons and disclosures. Native radio groups and selects support their browser's arrow-key behavior.
- Source instructions are a labeled read-only text area. Select text with Shift+arrow keys, then use **Use selected excerpt**. **View exact source** focuses that source and selects the saved range. **Return to task** returns focus to the task heading.
- **Full checklist** shows every task. **One step at a time** shows the selected task with a chooser and Previous/Next controls. Completion never moves to another step automatically. The same source, history, and review controls remain available in both views.
- Dependencies are named checkboxes and linear causal lists. No diagram is required. Completion, applicability, saved/unsaved state, and open review reasons have text labels as well as visual styling.
- Labels stay visible. Errors receive focus and provide **Return to the control**. Successful task edits/reviews return to the task heading; source-version and restore previews receive focus before a separate apply action.
- **Text size → Larger** increases the root text size to 125%; browser zoom remains available. Layouts stack at narrow widths and long text wraps. Native text fields remain resizable. There is no forced motion, countdown, automatic step advance, or streak mechanism.
- **Prepare JSON backup** focuses a labeled read-only text area. Use the download button or select and copy the JSON into a separate UTF-8 file. Restore accepts a native file chooser or pasted JSON and requires a preview before adding applications.

## Focus, feedback, and interrupted work

Focus outlines are visible for keyboard and programmatic focus. Task controls have task-specific accessible names where their repeated purpose would otherwise be ambiguous. Native `details`, `button`, `input`, `select`, `fieldset`, and `legend` elements provide their own interaction semantics.

One polite action status reports completed actions; offline status announces changes separately. Save details, selected quotes, and entire task lists are not live regions. Errors receive focus instead of being announced simultaneously as an alert. Actual spoken behavior varies by browser and screen reader; the tools and flows that were checked are listed in CHECKS.

Unsubmitted forms are saved to same-tab recovery storage when available, so another task action or a normal reload can preserve them. Recovered drafts are not submitted or acknowledged automatically. Drafts are excluded from workspace backups; submit each form or copy its text separately. Storage failures remain visible, and unresolved workspace saving blocks the app's update/reload action. See [PRIVACY](PRIVACY.md) for the limits.

## Remaining limits

The full checklist can be lengthy. Hidden one-step tasks remain part of the saved plan; the overview and dependency text can still refer to other tasks. Exact text selection may take practice with assistive technology. There are no custom shortcut keys or specialized reading engine.

Automated checks cannot establish usable keyboard order, understandable review decisions, or complete screen-reader support. CHECKS distinguishes accessibility-tree inspection from an actual spoken screen-reader session and records what could not be tested. No participant study or broad browser/assistive-technology certification has been performed.
