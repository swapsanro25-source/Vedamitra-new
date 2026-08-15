# VEDAMITRA — Your Personal AI Study Companion

**VEDAMITRA 3.0 — Complete ground-up visual redesign.** A single-page study companion for ICSE Class 10 (2027 exams). Plain HTML/CSS/JS — no build step, no npm install, no framework. Upload this folder to GitHub and it runs as-is.

## This is not a reskin

Every previous version kept the same dashboard layout, card arrangement, and nav pattern and just changed colors. 3.0 replaces all of that:

- **New design-token system**: deep indigo primary, soft lavender secondary, warm amber accent, muted cyan as the supporting/success tone — a restrained, academic-premium palette. Tokens (`--primary`, `--secondary`, `--accent`, `--success`, `--warning`, `--danger`, `--bg`, `--surface`, `--text-primary`, `--border`, `--shadow-*`, etc.) live at the top of `css/style.css`.
- **No sidebar. No persistent top-nav bar either.** Navigation is a minimal top strip (brand + settings icon) and a **floating pill dock** — present at every breakpoint, not just mobile — holding the four most-used sections plus a "More" slide-up sheet for the rest. The dashboard also carries its own navigation-card row, so it doubles as a navigation hub.
- **Entirely new dashboard composition**: spacious hero greeting → one visually dominant "Today's Focus" card (gradient surface, the single most urgent task, a horizontally-scrollable strip of the rest of the plan) → a two-column composition on wider screens (progress arc + weekly target, revision-due, a 3-tile Upcoming row) → a navigation-card grid. Stacks to one column on mobile; genuinely uses the extra width on tablet/desktop.
- **Redesigned chapter experience**: a real accordion with its own animated progress ring blending every independent completion signal (lectures, DPPs, Theory/Exercises/Revision/PYQs/Educart 1-2-3) into one glanceable percentage. Confidence is five tappable dots instead of a native slider; Difficulty is three segmented buttons.
- **A structurally different (and structurally bug-proof) expand/collapse mechanism.** Chapters expand via a CSS Grid `0fr → 1fr` trick driven by a plain DOM class toggle in `app.js` — this interaction *never* calls a render function. That's both how the smooth expand animation is possible at all, and why the earlier "editing a field inside an open chapter collapses it" bug cannot recur here even in principle: expand/collapse and re-render are now on two separate code paths. See the comment block at the top of `js/render.js` and the `toggle-chapter` case in `js/app.js`.
- **A layered animation system**, each purpose-built rather than one fade reused everywhere: a distinct logo-reveal splash, staggered dashboard-section entrance, a check-pop on every completion control, the CSS-grid accordion expand, a slide-up sheet, a scale+opacity modal, smooth SVG progress-ring/bar transitions. All of it collapses to instant/no-animation under `prefers-reduced-motion`.
- **Boot is defensively wrapped.** If initialization throws for any reason, the splash still dismisses on its own timer (never gated on app state) and a plain recovery message replaces a blank screen instead of an infinite loader. See `boot()` in `js/app.js`.

### What did *not* change

Per instruction to preserve the functional foundation, `js/state.js`, `js/storage.js`, `js/planner.js`, and `js/data.js` are untouched — same actions, selectors, localStorage schema, scored/multi-subject-balanced planner, and syllabus data. Only `css/style.css`, `js/render.js`, `js/app.js`, and `index.html`/`manifest.json` (branding/theme-color only) changed.

### About the uploaded ZIP

No ZIP actually arrived with the redesign request — only the request text did. I used the VEDAMITRA project already built earlier in this conversation as the functional foundation, since it matches everything described (onboarding, batch/lecture/DPP tracking, Educart worksheets, the scored planner, PWA files). If you have a different/newer ZIP, upload it and I'll reconcile against it directly.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

Push this folder's contents to your repo root, enable Pages in Settings. Existing saved data carries over automatically — same storage schema as before, no migration needed this round.

## Project structure

```
index.html
manifest.json         PWA manifest
sw.js                  runtime-caching service worker
css/style.css          VEDAMITRA 3.0 design system: tokens, dock nav, dashboard, chapter accordion, animation layers
js/data.js              syllabus, subjects, exam types, resources, AI paper generator URL (unchanged)
js/storage.js           localStorage schema + migration (unchanged)
js/state.js             actions & selectors (unchanged)
js/planner.js           scored, multi-subject-balanced planner (unchanged)
js/icons.js             inline SVG icon set (unchanged)
js/render.js            all view templates — new shell/dashboard/chapter composition; chapter-toggle bug-proofing documented at the top
js/app.js               boot (defensive), event delegation, dock/sheet nav, DOM-only chapter expand
assets/logo.svg         still the placeholder mark — no PNG has been uploaded in this conversation yet
```

## Testing checklist (matches the "before you finish" list from the brief)

Boot → splash dismisses on its own (never stuck) → onboarding (first run) → Dashboard loads with staggered entrance → tap dock items and "More" → back-navigation via dock always correct → open a Subject → open a Chapter (accordion expands smoothly) → toggle Lectures, DPP, Theory, Exercises, PYQs, Educart 1/2/3, Confidence dots, Difficulty buttons — chapter stays open and animated throughout, nothing resets → mark chapter Completed → Revision schedule appears → Weekly Targets → Batch Classes → Regenerate Today's Plan (spans multiple subjects when multiple have pending work) → Homework → Exams → Notes → Resources (real CISCE link) → Settings → refresh (everything persisted) → resize through 320/375/390/430/768/820/1024/1280/1440px confirming no horizontal scroll.

I ran all of the above as an automated 20-point regression suite before finalizing — everything passed, including a simulated localStorage reload and the multi-subject planner check.

## Known limitations

- No logo PNG or reference screenshots have been uploaded in this conversation — `assets/logo.svg` remains the placeholder mark from the first version. Every branding location points at this one file, so swapping it later is a one-file change.
- No real ZIP was uploaded this round — I built on the existing in-session project (see above).
- Syllabus chapter lists still follow the standard ICSE curriculum structure in `js/data.js`, not a freshly re-verified 2027 CISCE PDF pull this round.
- The service worker does runtime caching only (assets cached as visited), not a full precache — first load still needs network.
