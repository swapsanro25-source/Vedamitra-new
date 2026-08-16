# VEDAMITRA — Your Personal AI Study Companion

**"Academic Serenity" edition** — visual design taken directly from your uploaded Stitch reference (`DESIGN.md` + the dashboard/subjects/chapter-detail/revision/welcome screens). Same underlying app, new interface. Plain HTML/CSS/JS — no build step, upload to GitHub Pages as-is.

## What changed

Only the presentation layer. `js/state.js`, `js/storage.js`, `js/planner.js`, and `js/data.js` are untouched — same actions, selectors, localStorage schema, scored multi-subject planner, and syllabus data as before. `css/style.css`, `js/render.js`, `js/app.js`, and `index.html`/`manifest.json` (fonts/theme-color) were rebuilt to match the reference:

- **Palette**: Deep Navy (`#1E293B`) primary, Soft Lavender (`#D8D2FF`) secondary, warm amber / emerald / soft crimson as semantic status colors (pending / completed / needs revision), off-white background — taken directly from the reference `DESIGN.md` tokens.
- **Typography**: Hanken Grotesk for headlines, Inter for body text, JetBrains Mono for metadata labels (durations, cycle days, category tags) — exactly the three-font system specified in the reference.
- **Navigation**: a real bottom tab bar (Schedule / Subjects / Classes / Revision + More), matching the reference exactly, replacing the floating-dock/no-nav experiments from earlier rounds.
- **Dashboard → "Your Learning Hub"**: greeting header, colored Today's Scheduled Work task cards, a dark Navy "ICSE 2027 Boards" countdown card with a linear progress bar, and a six-tile Quick Access grid — same layout the reference dashboard screen shows.
- **Subjects**: search bar + alternating lavender/white cards with a "X/Y chapters started" caption and circular arrow button, matching the reference subjects screen.
- **Chapter detail**: a "Chapter Progress" card with a linear bar, a "Batch Lectures" checklist (checkbox + Recorded/Up Next/Scheduled meta, exactly like the reference), and a "Study Work" folder-card grid for Theory/Exercises/PYQs/Educart 1-2-3/Revision — matching the reference's physics_force_details screen. DPPs get their own equivalent list (the reference shows them as one folder tile, but DPPs have per-item add/score/delete in this app, so they get a proper list here rather than losing that functionality).
- **Revision Center**: "Due Today" cards with CYCLE/DUE metadata and a dark "MARK REVISED" pill button, matching the reference revision_center screen.
- **Onboarding/Splash**: rounded logo tile, bold Hanken Grotesk wordmark, soft lavender radial background — matching the reference welcome screen, applied to the existing step-based setup wizard.
- Progress indicators are **linear bars only, no rings** — the reference design doc explicitly calls this out ("Avoid circular 'rings' which can feel like fitness trackers").

Every screen the reference didn't cover (Homework, Exams, Notes, Weekly Target, Batch Classes, Resources, Settings) was styled in the same system — navy/lavender/amber/emerald tokens, the same card/chip/button components, Hanken Grotesk + Inter + JetBrains Mono — so the whole app feels like one coherent product rather than a few matched screens bolted onto the old one.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

Push this folder's contents to your repo root, enable Pages in Settings. Existing saved data carries over — same storage schema as before.

## Project structure

```
index.html
manifest.json         PWA manifest
sw.js                  runtime-caching service worker
css/style.css          Academic Serenity design system: tokens, tab-bar nav, Learning Hub dashboard, folder-card chapter UI
js/data.js              syllabus, subjects, exam types, resources (unchanged)
js/storage.js           localStorage schema + migration (unchanged)
js/state.js             actions & selectors (unchanged)
js/planner.js           scored, multi-subject-balanced planner (unchanged)
js/icons.js             inline SVG icon set (unchanged)
js/render.js            all view templates — Learning Hub dashboard, subjects search, chapter folder-grid, revision due-today cards
js/app.js               boot, event delegation, tab-bar/sheet nav, DOM-only chapter expand, folder-card + subject-search wiring
assets/logo.svg         still the placeholder mark — the Stitch reference's "SH" monogram logo was not extracted/uploaded as a usable image file
```

## Testing

I ran an automated 14-point regression suite before finalizing: onboarding → all 10 views render → dashboard composition (Learning Hub + Boards card) → lectures/DPP/Theory/Exercises/PYQs/Educart 1-2-3 (independently)/confidence/difficulty → chapter detail sections → revision auto-schedule + completion → Regenerate Today's Plan (spans 6 subjects) → dashboard reflects the generated plan → weekly targets/batch classes/homework/exams/notes CRUD → Revision Center renders → Subjects search+cards render → chapter stays open across re-renders (the earlier collapse-bug fix is architecturally unchanged — expand/collapse is still a pure DOM operation, see the comment at the top of `js/render.js`) → full persistence through a simulated reload. All 14 passed.

## Known limitations

- The reference's "SH" circular monogram (visible in the top-bar avatar in the screens) wasn't provided as a separate image asset — the top-bar avatar uses the student's initial instead, and `assets/logo.svg` is still the original placeholder mark from the first version.
- The reference's Revision Center shows a "Day 3 Cycle / Day 7 Cycle" tab split and "last revised X days ago" tracking; this build keeps the simpler Due Today / Upcoming split from the existing data model rather than adding new state to track cycle-tabs and last-revised timestamps, to avoid touching `state.js`/`storage.js` per your instruction to preserve the functional layer as-is.
- Syllabus chapter lists still follow the standard ICSE curriculum structure in `js/data.js`.
