# Origin Scholar design milestone

September 24, 2026. User-requested work between Sessions 7 and 8. No participant study or conversion experiment.

## Stage 1 — confirmed direction

Navy / cream / gold with subtle warmth; dedicated welcoming landing page plus redesigned workspace; simple wordmark inspired by the supplied rough SVG and real interface screenshots; main CTA “See how it works.” The later explicit decision is a professional subdomain with **no domain purchase**. Cloudflare account sign-in was completed by the user.

## Stage 2 — structural blueprint

- **Identity:** navy `#142b43`, cream `#fbf8f0`, gold accents `#c29a4b` / `#d8b86e`, readable dark gold `#795a24`. Georgia editorial headings paired with system sans-serif controls. An arched origin-point mark and simple Origin Scholar wordmark replace the rough reference’s multiple variants. Gold is an accent, not small low-contrast body text.
- **Navigation:** linked wordmark, How it works, Your work/decisions, Open workspace. On mobile the secondary section link is omitted while the main explanation and working route remain available.
- **Hero:** “Your next chapter. One clear step at a time.” Explain source-linked scholarship preparation; primary “See how it works” anchors to the walkthrough. A genuine, fictional source/task screenshot shows the product. No autoplay video or decorative stock images.
- **Trust:** three verifiable principles—original sources, completion history, human decisions. There are no participant testimonials or adoption counts. A visible early-version note states human evaluation is pending and names the app’s limits.
- **Features / explanation:** Collect → Connect → Revisit, followed by the real 500→400 scenario. “Explore the fictional plan” opens its controls without silently creating records. Distinguish review from invalid work.
- **Privacy / judgment:** exact-source return, separate backups and browser-local processing, with short limitations and links to full notes.
- **Closing CTA:** Open your workspace after the explanation, then transparent evaluation and open-source links. No email capture, analytics or fabricated urgency.
- **Workspace:** quiet header, concise fictional-data notice, visible save status, linear navigation, optional sample/new-plan disclosures, separate completed/review/source counts, source/task columns that stack on mobile, warm task cards and gold review cues backed by text. All existing source, completion, dependency, backup and recovery controls are retained.

## Stage 3 — optimization and validation rules

- Reuse existing model/storage/evaluation tests. Add navigation coverage for the split routes and extend canonical-URL offline tests. Preserve `steptrace.*` storage and JSON identities; no schema migration is needed for a display name.
- Mobile: inspect landing and changed-work state at 320 and 375 pixels; check page-width overflow, wrapped labels/buttons, source selection, task navigation and larger-text mode. Inspect desktop at 1265 pixels. Keep touch controls around 44px or more, labels visible and statuses readable without color.
- Speed: no dependencies, external fonts, hero video or landing JavaScript. One 81,429-byte real JPEG, intrinsic image dimensions, high-priority hero image; keep public files on the explicit allowlist. Cache complete versioned shell only after workspace setup. Measure actual asset sizes rather than claim a performance score.
- Accessibility target: WCAG 2.2 AA design practices—semantic landmarks, heading order, contrast, keyboard operation, visible focus, skip links, readable labels/errors, text resizing/reflow and reduced motion. Use axe-core plus manual checks; do not claim conformance or screen-reader certification.

## Actual observations

- Local regression run: **134 passed, 0 failed**. Includes one new real-HTTP route/resource test; offline regression now covers workspace canonical redirects and rejects wrong destinations.
- Real fictional UI: 500→400 produces one direct and one dependent review, with all three completions retained. Exact original 500-word quote remains available. Export, reload and restore to a fresh local origin preserve exact workspace JSON. Malformed restore shows an error.
- No horizontal page overflow at requested 375px or 320px widths, including workspace Larger text mode (actual content widths 360/305px because of the browser scrollbar). Desktop source/task columns are visible.
- axe-core 4.10.3 initially found a low-contrast callout and nested complementary landmark. Fixed the CSS specificity and landmark. Rechecks of landing and restored changed-work workspace at 320px show **0 violations**. Incomplete checks remain for decorative symbols and offscreen textarea backgrounds; this is not a full accessibility audit.
- Human evaluation remains **N=0**. No measured conversion lift, preference, source-lookup improvement, demand or accessibility benefit is claimed.

Current screenshots: `images/origin-landing.jpg` and `../dist/workspace-demo.jpg`. Supporting diagnostic reports are under ignored `work/`. Publication and remote checks belong in RELEASE / CHECKS / STATE.

## Address and data continuity

Cloudflare published https://originscholar.pages.dev; use RELEASE for exact provenance. Direct Upload keeps GitHub source/CI separate from hosting. An old origin’s work stays at that origin; manually export and preview a restore on the new address. Never clear it to make a screenshot or test pass. Legacy Sites metadata and historical release notes are preserved.

Public before/after flow and response/header/integrity verification passed; see CHECKS. The explicit pending app update was also accepted locally with completion/review state retained. The live address was obtained without a domain purchase or paid plan.
