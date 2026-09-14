# Session 1 checks

Run from the repository:

```sh
./run.sh check
./run.sh
```

Open `http://127.0.0.1:4173`. The check script uses Node's built-in assertions to check JavaScript syntax, required HTML/CSS files, unique fixture IDs, all task/source mappings, completion dates, and the intended fictional 500-to-400 change affecting exactly draft/proofread. It does not test a real comparison, dependency, or storage engine.

## Browser walkthrough

1. On first load, find the fictional/no-save notice, three original source passages, three sample completions, and a collapsed preview.
2. Activate source links using the keyboard. Drafting/proofreading target `#source-essay`; the recommendation targets `#source-recommendation`. The target passage receives focus and a visible highlight.
3. Activate Preview instruction change with Enter. It exposes the 500/400 before/after, two visible review reasons, and an expanded button state. All three completion labels/dates stay identical. Recommendation has no review reason.
4. Activate Hide change preview with Space. Review reasons disappear, completion labels stay, and the button reports collapsed.
5. Reload while the preview is open. It resets to the original fixed sample; there is no saved user data.
6. Use Skip to example and Tab through controls; inspect focus. Check narrow and desktop layouts for readable wrapping and horizontal overflow.
7. Inspect browser errors. A visible result alone does not prove there were no console errors.

## Actual verification — September 14, 2026

- Node v24.19.0, already bundled on this machine; no packages installed.
- Syntax and fixture check: passed.
- Local server root: HTTP 200, correct HTML content type, local-only binding.
- Browser: Codex in-app browser (engine/version not recorded).
- Source navigation: essay and recommendation links landed on exact passages and moved keyboard focus.
- Enter to expand and Space to collapse: passed. Exactly two review reasons appeared; all three completion strings were identical before, during, and after the preview. Recommendation stayed unaffected.
- Skip link focused main content. Visible keyboard outline inspected.
- Desktop 1280×900 and narrow 360×800 layouts inspected; document width equaled viewport width in both checks. Long labels wrapped at the narrow width.
- Console error/warning inspection after initial load and interactions: no entries.
- Independent static review: no blocking scope, source-linking, completion-preservation, or accessibility-structure issues.

Final checks also passed: launcher check/start, shell syntax, HTTP allowlist for all demo assets, 404 for missing/private paths, POST rejection, reload reset, and keyboard tab order through the three links then preview button. Final browser logs contained no warnings/errors. Temporary viewport overrides were reset. See STATE for environment and handoff details.

## Limits

This is a smoke check of a fictional preview. No adult applicants have tested understandability. No full screen-reader, browser-zoom, automated accessibility, offline/service-worker, or cross-browser audit was performed. Do not claim WCAG conformance, usability benefit, local persistence, or working change-analysis algorithms. Broader accessibility and recovery checks are planned for their milestones.
