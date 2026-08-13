# VEDAMITRA — Your Personal AI Study Companion

**VEDAMITRA 2.2 — No-sidebar minimal redesign.** A single-page study companion for ICSE Class 10 (2027 exams). Plain HTML/CSS/JS — no build step, no npm install, no framework. Upload this folder to GitHub and it runs as-is.

## What's new in this round (2.2)

- **Sidebar removed entirely.** Navigation is now a slim top bar with horizontally-scrollable nav pills on tablet/desktop, plus the existing bottom tab bar on mobile. A "More" button opens a lightweight sheet for the sections that don't fit in the bottom bar's 4 quick slots.
- **New color system, based on your reference image**: warm orange (primary actions, active/selected states, badges — matching the orange notification-dot accent in your reference) + sky blue (headings, information, progress, resources) + white/off-white neutrals. **Green is now reserved for exactly five literal touch-toggle controls** — the checkmark you tap to complete something, a done lecture pill, a done revision chip, a picked onboarding pill, and the native checkbox tick color — and appears nowhere else in the app (audited: zero other green references remain in the stylesheet).
- Subject accent colors (the 10 per-subject dot/border colors) were also updated from green shades to a blue/orange/neutral set, since those appear all over subject cards and would have broken the "no green except touch areas" rule otherwise.
- A soft two-tone pastel card pairing (sky-blue tint / orange tint) on the dashboard's Homework/Revision pair, echoing the reference image's pastel accent-card layout.

### About the reference image

Your uploaded photo was very small (103×127px, a screenshot-of-a-screenshot of what looks like a "LuxQue" shopping app) — I upscaled it to read the layout clearly: white background, two rounded pastel/white cards side-by-side, small circular icon buttons, an orange notification badge, generous spacing. That layout language (rounded duo-cards, circular icon buttons, orange accent badge, breathing room) is what's reflected above — I did not copy LuxQue's branding, text, or content, per your instruction to only take inspiration from the design quality.

## What was new in the previous round (2.1)

- **Fixed the chapter-collapse bug.** Editing anything inside an open chapter (PYQs, confidence, difficulty, lecture count, a DPP score, an Educart worksheet) used to snap the chapter shut and feel like you'd been sent back to the dashboard. Root cause and fix are documented at the top of `js/app.js` — short version: every state change fully rebuilds the page's HTML, and a freshly-built `<details>` element always starts closed. The app now remembers which chapter is open (and your scroll position) across every rebuild, so you stay exactly where you were.
- **Three independent Educart Worksheet checkboxes** (1/2/3) per chapter, alongside Theory/Exercises/Revision/PYQs — completing one never affects the others, and all three persist through refresh/reopen.
- **Smarter "Today's Study Plan."** The planner used to sometimes fill the whole plan from one subject. It now scores every candidate task (overdue revision, exam urgency, weak/hard chapters, neglected subjects, pending DPPs/lectures) and applies a balancing penalty each time it picks from the same subject again — so multiple subjects with real pending work actually show up together. Details and the exact scoring in the comment at the top of `js/planner.js`.
- **Refined color system**: forest green/emerald for primary actions and progress, sky blue for resources/information, warm amber for exams/deadlines/priority — replacing the old blue-green-everywhere gradient approach. Neutrals moved to warm white/off-white instead of cold grey.
- **Toned-down glassmorphism.** Cards are now solid "layered surfaces" (subtle border + controlled shadow) rather than heavy frosted glass — chrome elements (sidebar, topbar, modals) keep a touch of blur, content cards don't.
- **Typography refresh**: Plus Jakarta Sans for body/section headings, Fraunces reserved for a few large premium moments (greeting name, splash, onboarding) instead of every heading.
- **Micro-interactions**: button press feedback, a small "pop" on completing a lecture/DPP/checkbox, card hover lift, smooth view-fade on navigation — all disabled automatically under `prefers-reduced-motion`.
- **Basic PWA support added**: `manifest.json` + `sw.js` (a small runtime-caching service worker) so the app can be added to a phone's home screen and used offline. Registration is wrapped defensively — if the browser doesn't support it, or GitHub Pages serves it oddly, the app just runs normally without it.

### About the reference images and logo PNG

You mentioned two reference screenshots and an uploaded VEDAMITRA PNG logo — **none of these actually came through in the message**, only the text brief. I built the new color system, typography, and layout entirely from your detailed written spec (which was specific enough to work from directly). `assets/logo.svg` is still the same placeholder mark from before. If you upload the real reference images and PNG logo in a follow-up, I can adjust the visual details to match and swap the logo in immediately — the manifest, splash screen, and every branding location already point at one single file (`assets/logo.svg`), so replacing it is a one-file swap.

## Run it locally

```bash
# from inside the vedamitra/ folder
python3 -m http.server 8000
# then open http://localhost:8000
```
Opening `index.html` directly (double-click) also works for everything except the service worker, which requires being served over http(s).

## Deploy on GitHub Pages

1. Push this folder's contents to the **root** of your repository (overwrite your existing files — every path stays the same as before, plus two new files: `manifest.json` and `sw.js`).
2. **Settings → Pages → Source** → select your branch.
3. Live at `https://<username>.github.io/<repo>/` within a minute or two.

Your existing data is untouched by this upgrade — no schema/version bump this round, only new fields that default safely on old saves (see "Persistence" below).

## Replacing the placeholder logo

Drop your real file in as `assets/logo.svg` (or update the `<img src="assets/logo.svg">` references across `index.html`/`js/render.js` and `manifest.json`'s `icons` array if yours is a `.png`). Every branding location — splash, sidebar, topbar, onboarding, Settings → About, manifest icons — points at this one file.

## Editing the syllabus

All subjects and chapters live in **`js/data.js`** in the `SUBJECTS` array. Verify against the official CISCE syllabus PDF, linked directly from the app's **Resources** tab (`https://cisce.org/icse-regulations-and-syllabuses-2027/`).

## Configuring the AI Paper Generator link

In `js/data.js`:
```js
const AI_PAPER_GENERATOR_URL = "https://your-generator-url-here";
```
Leave empty (`""`) for a clean "not configured" placeholder. Never put an API key here or anywhere in the frontend.

## How data is stored

Everything (profile, onboarding, chapter/lecture/DPP/Educart progress, batch classes, homework, exams, notes, weekly targets, settings) saves to the browser's `localStorage` under `vedamitra_state_v1`. Use **Settings → Export backup** regularly; **Import backup** to restore or move devices.

## Wiring a real AI planner later

`js/planner.js` runs entirely locally today (no network call, no API key). See the comment at the top of that file for exactly how to swap in a serverless-backed LLM planner later without breaking the offline fallback.

## Project structure

```
index.html
manifest.json         PWA manifest (installable home-screen app)
sw.js                  minimal runtime-caching service worker
css/style.css          design system: forest/blue/amber palette, layered surfaces, micro-interactions
js/data.js             syllabus, subjects, exam types, resources, AI paper generator URL
js/storage.js          localStorage read/write, versioned schema, migration, backup export/import
js/state.js            app state, actions (incl. lectures/DPPs/batch/Educart), selectors
js/planner.js          scored, multi-subject-balanced Today's Plan generator
js/icons.js            inline SVG icon set
js/render.js            all view templates, chapter open-state tracking (bug fix)
js/app.js               boot, event delegation, onboarding, PWA registration, scroll/open-state preservation
assets/logo.svg         your VEDAMITRA logo (still the placeholder — see note above)
```

## Testing checklist (matches the 15 scenarios from the brief)

Open a chapter → toggle PYQs → adjust confidence → change difficulty → tick Theory/Exercises/Revision/PYQs/Educart 1/2/3 in sequence → change lecture count → add a DPP → edit mistakes — **you should stay on that exact chapter, expanded, at the same scroll position, through every one of those.** Then: refresh the page (progress remains) → navigate away and back to the chapter (still expanded, still correct) → go to Dashboard → Regenerate Today's Plan with 3+ subjects having pending work (plan should include multiple subjects, not just one) → resize to ~320px/375px/390px/430px/768px/1024px and confirm no horizontal scroll and the bottom nav appears under 640px.

## Known limitations

- No reference images or logo PNG were received this round (see note above) — the visual direction follows your written spec only.
- Syllabus chapter lists should still be verified against the official CISCE 2027 PDF.
- The AI planner is local/rule-based until the serverless endpoint described in `js/planner.js` is wired up.
- The service worker does basic runtime caching (visited pages/assets become available offline); it does not pre-cache the entire app on first load, so the very first visit still needs a network connection.
- Data lives in one browser's `localStorage` — no cross-device sync until a backend is added.


