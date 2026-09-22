# Privacy, offline use, and recovery

Session 5, September 22, 2026. This describes the local development app served by `scripts/serve.mjs`. A future hosted version would need its own verified hosting/network disclosures. Use fictional information during development. Actual runtime checks and limitations are in [CHECKS](CHECKS.md).

## Where content goes

Core operations process pasted instructions, selected local files, task wording, comparisons, and backup JSON inside the browser. File input uses `File.arrayBuffer()` and UTF-8 decoding; it does not upload the chosen file. Backup download uses a browser `Blob`, object URL, and download link. User content is rendered as text, not executable HTML.

The saved workspace is in `localStorage` under `steptrace.workspace.v1`. Same-tab form drafts and view preferences use `sessionStorage` under `steptrace.tab-drafts.v1`; an interrupted workspace write uses `steptrace.interrupted-save.v1`. All are scoped to the browser/profile and origin, including host and port. These stores and exported JSON are not encrypted by StepTrace.

The app has no account, analytics, advertising, remote text API, or automatic cloud backup. The source audit found no application-content `fetch`, XMLHttpRequest, beacon, WebSocket, or EventSource calls. App-network code is limited to service-worker registration/update and fetching static app files. Autocomplete and spellcheck are disabled on editing fields, but the app cannot control browser extensions, browser/OS assistance, sync settings, screenshots, clipboard tools, or downloaded-file backups. Therefore it does not promise that every component of a user's device is offline or private.

## Network requests and cached files

Initial loading and update checks request static assets from the app's origin. The local server listens only on `127.0.0.1`, accepts GET/HEAD, and serves an explicit asset allowlist. It has no form-upload endpoint. Its Content Security Policy restricts scripts and workers to the same origin, permits same-origin connections, and blocks form submission. The code, rather than that policy alone, establishes that core application text is not put into network requests.

The service worker caches `/`, `/index.html`, `/preview.html`, `/styles.css`, and the named JavaScript modules listed in `dist/sw.js`. `/sw.js` is requested for registration and version checks. Only same-origin, query-free GET requests for those known shell assets are intercepted. Cache keys begin `steptrace-shell-` and contain a digest derived from the complete shell. Workspace text, file contents, and backup JSON are never put in this app-file cache.

Offline loading requires a successful initial online load/setup at a supported secure address; the local loopback address supports this. The page reports whether setup finished. An open page can continue processing local text when disconnected, but a new load needs a complete cached shell. Browser eviction or clearing site data can remove it. Reconnect to repair an incomplete cache. Zero network traffic is not claimed: the browser may check for an app update even during otherwise local use.

New app versions wait for **Update app and reload**. Before activation and reload, the page checks that workspace saves are resolved, no storage conflict is recorded, file reading is finished, and drafts can be retained. A failed install leaves the previous shell available. The worker never writes workspace or draft storage. Use one editing tab; another tab can activate a shared worker and simultaneous workspace writes are not atomically locked.

## Limits and recovery

- Browser storage can be denied, fill up, be evicted, or be cleared. Private browsing and tab/session restoration policies vary. Same-tab recovery is a convenience, not a durable backup; closing a tab, process failure, or device failure may lose it.
- Saving journals pending workspace data before the main write when session storage allows it. On reload, a validated pending copy is recovered only when the previous saved bytes still match. A conflicting copy is offered for download while current saved work remains unchanged. Unreadable copies are left untouched.
- A failed workspace save shows **Not saved** and keeps current in-memory work exportable. Keep the tab open, prepare a backup, and verify the file was downloaded or copied. Native leave-page warnings are best effort and may not appear in every browser or shutdown situation.
- Workspace exports include saved model records and any pending workspace changes in memory. They exclude unsubmitted form drafts and view preferences. Submit forms or copy their text separately before closing the tab.
- Restore is validated and previewed before adding disjoint applications. Malformed data or conflicting IDs cannot partially replace existing work. No replacement restore, deduplication, individual deletion, or encrypted backup is implemented.

There is no in-app data deletion control. Browser site-data controls can remove workspace, recovery, and cached app files for this origin; that action is destructive. Downloaded backups remain where you saved them and must be managed separately.

## Fictional content and evidence

`dist/src/demo.js`, `dist/src/dependency-demo.js`, the earlier scripted preview, and test fixtures are authored synthetic examples. Maple Grove and Cedar are fictional scholarships in these scenarios; dates, requirements, completed work, and the described 380-word essay are not real applicant records or verified scholarship rules. The working demo uses normal model operations; `/preview.html` remains explicitly scripted. No actual recommendation letter or essay is bundled.

Static source inspection supports the app-content flow described above. CHECKS records the distinct runtime network observations, selected browser flows, failure simulations, and any untested operating-system/browser behavior. Neither inspection nor a scan establishes security certification or complete privacy against software outside the app.
