# Architecture

StepTrace is a static browser application written in JavaScript modules, semantic HTML and CSS. Node.js 22+ runs development servers, tests, evaluation and release packaging. There are no package dependencies, application backend, text API or LLM. `dist/` is authored source, despite its conventional build-output name.

## Data and actions

A workspace contains applications. Each application keeps immutable source versions, tasks, dependency history and reported work changes. A task's original anchor contains a source-version ID, exact quote and UTF-16 start/end offsets. Later mappings add version-specific records instead of rewriting the original source. Source selection maps browser-normalized line endings back to original offsets.

Completion, applicability, source reviews and downstream reviews are separate histories. Recording completion cannot clear review. A resolution identifies the exact review/version or work event it addresses; it cannot acknowledge a later update. Unknown conditions and conflicting instructions stay unresolved until the person decides or obtains clarification.

| Module | Responsibility |
| --- | --- |
| `dist/src/model.js` | Validate records and implement explicit domain actions; return copied, deeply frozen data |
| `dist/src/source-selection.js` | Preserve exact source offsets across textarea line-ending normalization |
| `dist/src/comparison.js` | Paragraph differences and conservative source-anchor matching |
| `dist/src/dependencies.js` | Validate confirmed edges, propagate distinct causes and retain causal paths |
| `dist/src/storage.js` | Local saves, schema validation/migration, versioned backups and additive restore |
| `dist/src/schema-v1.js`, `schema-v2.js` | Preserve readers for previous data formats |
| `dist/src/app.js`, `review-ui.js`, `dependency-ui.js` | Render text, orchestrate human actions, manage focus and saved/unsaved feedback |
| `dist/src/drafts.js` | Same-tab form drafts and interrupted-save recovery journal |
| `dist/src/offline.js`, `dist/sw.js` | Cache a revisioned static shell and offer guarded app updates |
| `dist/src/dependency-demo.js` | Create the opt-in fictional plan through real domain operations |
| `evaluation/`, `scripts/evaluate.mjs` | Separate manual-checklist baseline, matched briefs, independent answer key and synthetic scoring |

## Matching tradeoff

The comparison splits original text into paragraphs. Every nonblank passage appears in the before/after display, including added, removed and ambiguous content. Whitespace normalization can suggest a formatting match; it does not alter source snapshots. Positional pairs of changed passages help reading and are not confirmed equivalents.

A task maps automatically only when its containing paragraph is identical, the paragraph and selected phrase are unique, and its immediate neighbors or document boundaries remain identical. Repeated text, uncertain context, formatting changes and selections spanning paragraphs need confirmation. Exact offsets remain attached to their own version.

An interview explanation: **“I chose extra review over silently attaching a completed task to the wrong requirement. Stable, unique text can carry forward automatically. Anything uncertain stays visible for a person to confirm, and their decision applies only to that update. The tradeoff is that even harmless edits can create review work.”**

The evaluation exposes this cost: an unchanged recommendation receives an extra review in both context-change and duplicate-phrase stress cases. Matching does not prove semantic equivalence or detect distant conditions. [COMPARISON](COMPARISON.md) describes the algorithm and compatibility constraints. Changing its reason descriptors requires schema compatibility work because import validation recomputes them.

## Dependency propagation

Each confirmed edge means “this task depends on that predecessor.” Validation rejects missing, cross-application, repeated, self-referential and cyclic links. Iterative traversal follows reversed edges from a change origin to its dependents. For each event, a task receives one reason with a linear causal path, including through intermediate tasks. Two changed ancestors or two reported work edits remain separate causes.

Historical event replay validates imported review paths. Removing a current edge does not erase an earlier reason. Adding an edge accounts for still-open related changes. This covers recorded links only: the application cannot observe external essay edits or infer omitted relationships. [DEPENDENCIES](DEPENDENCIES.md) gives the full rules.

## Persistence and recovery

The current workspace is schema 3 under the retained `localStorage` key `steptrace.workspace.v1`. Schema-1/2 data is validated and migrated in memory; opening it does not immediately replace its saved bytes. Imports validate exact quotes, IDs, histories, versions, graph edges and causal events before a preview, then add only disjoint applications.

A save reports success only after the validated workspace write succeeds. Failures keep current work exportable in memory. Read-before-write conflict checks detect an already completed write by another tab, but are not atomic multi-tab locking. Use one editing tab.

`sessionStorage` separately holds drafts, view choices and an interrupted-write journal. Drafts are not included in workspace backups. Browser eviction, denied storage, tab closure or failure can defeat recovery. None of these stores or exported files is encrypted by StepTrace. See [PRIVACY](PRIVACY.md) for keys, network behavior and limits.

## Development and release boundaries

`scripts/serve.mjs` serves an explicit app allowlist on loopback port 4173. The separate evaluation server uses port 4196. Test/fault endpoints and participant materials are not public app assets. The CI workflow runs source checks, synthetic evaluation and static packaging; actual results belong in [CHECKS](CHECKS.md).

`./run.sh build` writes `work/release/`. It copies an explicit asset list, replaces the worker's shell-revision marker, emits static-host header rules and writes `release.json` with the source commit, dirty-tree status and SHA-256 hashes. Packaging refuses symlink assets and unexpected files in an existing output directory. A clean release build ties the artifact to the reviewed source; a dirty build identifies that limitation instead of hiding it.

The app currently expects an origin-root deployment over HTTPS. The host must serve JavaScript with the correct content type and honor suitable cache/security headers; `_headers` is a host convention, not a universal standard. The service worker caches only known public app files, never the workspace. It accepts only two exact same-origin HTML redirects (`/index.html` to `/` and `/preview.html` to `/preview`) and serves the canonical preview from its existing cache entry. Unexpected redirects still fail installation. Actual hosted headers and CDN-added HTML are documented in RELEASE; hosted HTML bytes can differ from the authored artifact. Updates require an explicit action and recovery checks before reloading.

GitHub source hosting and demo hosting are separate choices. An open-source license does not override a host's service terms. A future commercial service needs its own hosting decision. [STATE](STATE.md) records the actual remote, deployed revision and any publication blocks; no deployment is implied by successful local packaging.

## Origin Scholar presentation and routes

`dist/index.html` is a static, script-free landing page styled by `styles.css` and `landing.css`. `dist/workspace.html` loads the original modular application through `bootstrap.js`. `workspace-demo.jpg` is a genuine fictional UI capture, not a rendered mockup. System fonts avoid external font requests.

The new workspace path shares its origin with the landing page, so same-origin existing storage is unchanged. A change of hostname still requires user-controlled export/restore. The offline shell includes the landing, workspace and screenshot; `/workspace.html` → `/workspace` is an explicit same-origin HTML alias. No arbitrary redirects are accepted. The public server and builder both enumerate these exact assets.
