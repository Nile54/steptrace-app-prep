# StepTrace — Session 1

A fictional browser preview of a source-linked scholarship checklist. StepTrace is a working name with known conflicts; no public slug has been chosen.

## Run locally

From this repository:

```sh
./run.sh
```

Open **http://127.0.0.1:4173**. Stop the server with **Ctrl+C**. To use a different port: `PORT=4174 ./run.sh`.

The launcher uses Node on your PATH or the existing bundled Codex runtime on this Mac. On another machine, install Node.js 22 or later. There are **no package dependencies** and no install/build step. With Node on PATH, `node scripts/serve.mjs` also works; with npm installed, `npm start` is equivalent. Opening `index.html` directly as a file is not supported because the app uses JavaScript modules.

## Try the example

1. Read the fictional Maple Grove Scholarship instructions.
2. Follow a task's **Source** link. It takes you to the exact passage in version 1.
3. Choose **Preview instruction change**. The essay maximum changes from 500 to 400 words in a scripted before/after example.
4. Drafting and proofreading show **Needs review · preview**. All three previous completion dates remain visible; the recommendation is unaffected.
5. Hide the preview or reload to return to the initial view.

A 380-word essay might already comply. The person would decide what needs editing. Proofreading is a personal preparation step, not a requirement claimed to appear in the source. The deadline has no linked task, illustrating why this sample is not a completeness claim.

## What works / what is simulated

| Working now | Preview or deferred |
| --- | --- |
| Local browser server and static UI | No application creation, editing, or pasted instructions |
| Three exact links to displayed fictional passages | Tasks and completion dates are fixed fixtures |
| Keyboard-operable show/hide and source navigation | Before/after text and two review reasons are manually authored |
| Completion text retained while showing/hiding review | No real comparison, dependency traversal, or review resolution |
| Responsive layout, semantic controls, visible focus | No persistence, backup/restore, or installed offline support |

The browser loads only local demo assets. There are no accounts, analytics, remote API calls, AI features, or uploads. Local-first storage is a later milestone; this version does not save application data.

## Code to understand

- `dist/index.html` defines the semantic page sections and preview control.
- `dist/styles.css` controls layout, readable text, responsive stacking, and keyboard focus.
- `dist/src/demo.js` contains fictional passages, tasks, dates, and scripted review reasons. Each task's `sourceId` points to a passage's `id`.
- `dist/src/app.js` imports those fixtures, builds DOM nodes with `textContent`, and handles one button. The click listener changes visibility and `aria-expanded`; it never modifies a completion record.
- `scripts/serve.mjs` uses Node's built-in HTTP module and serves only five explicit routes on `127.0.0.1`. `dist/` contains authored source files, not generated build output.

An honest explanation for a tech/AI interview: “This milestone makes the interaction and state distinction inspectable. The future comparison will be deterministic; this demo uses authored examples. I can explain source IDs, DOM rendering, and why review must not erase completion.” This is not evidence of an implemented AI system.

## Checks and next step

Run `./run.sh check`. See `docs/CHECKS.md` for the browser walkthrough and actual verification. Start later sessions with `AGENTS.md`, `docs/BRIEF.md`, `docs/ROADMAP.md`, and `docs/STATE.md`.

Session 2 is source-linked task creation and reliable storage. It has **not** started. No remote repository or deployment exists. Five interview questions are in `docs/INTERVIEWS.md`; no one has been contacted.
