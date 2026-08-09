# VEDAMITRA — Your Personal AI Study Companion

**VEDAMITRA 2.0.** A premium, single-page study companion for ICSE Class 10 (2027 exams). Plain HTML/CSS/JS — no build step, no npm install, no framework. Upload this folder to GitHub and it runs as-is.

## What's new in 2.0

- **First-time onboarding wizard** (About You → Subjects → Batch → Upcoming Tests → Study Routine → Finish). Runs once; skipped automatically afterwards. Redo it anytime from Settings.
- **Batch/coaching lecture tracking** — set a lecture count per chapter, mark individual lectures done; completed lectures stay visible (separate from chapter status).
- **Daily Batch Classes** — add/edit/delete/complete your scheduled batch lectures; today's and upcoming classes surface on the dashboard and their own **Batch Classes** tab.
- **DPP tracker** — add DPPs per chapter, mark pending/completed, record a score; kept fully separate from lectures.
- **Exams** now support a type (School Test / Batch Test / Unit Test / Pre-Board / Board Examination / Other) and important chapters.
- **Resources tab** — a verified official CISCE link for the ICSE 2027 Regulations & Syllabuses, plus a configurable **AI Paper Generator** link-out (no API key ever touches the frontend).
- **Redesigned dashboard** with progressive disclosure (Weekly Target and Subject Progress collapse behind `<details>`) so only what matters today is visible up front.
- **Mobile-first pass**: a bottom tab bar under 640px, tightened spacing/typography down to 320px, no horizontal scroll.
- **Refreshed color system + splash animation**: forest green ↔ deep blue gradient, smoother logo/name/tagline entrance, respects `prefers-reduced-motion`.
- Old v1 saves migrate automatically — nothing is lost when this replaces your existing files.

## Run it locally

```bash
# from inside the vedamitra/ folder
python3 -m http.server 8000
# then open http://localhost:8000
```
Opening `index.html` directly (double-click) also works — no build step.

## Deploy on GitHub Pages

1. Push this folder's contents to the **root** of your repository (overwrite the existing files — see "Upgrading from 1.0" below).
2. **Settings → Pages → Source** → select your branch.
3. Live at `https://<username>.github.io/<repo>/` within a minute or two.

## Upgrading from 1.0 (your existing repo)

This is an in-place upgrade, not a rewrite — every file keeps its path:

```
index.html          (unchanged)
css/style.css        updated: new color tokens, onboarding/batch/DPP/resources styles, bottom nav, tighter mobile breakpoints
js/data.js           extended: EXAM_TYPES, TASK_TYPES, WEEKDAYS, RESOURCES, AI_PAPER_GENERATOR_URL — syllabus itself unchanged
js/storage.js         extended default state (profile, batchClasses, lectures/dpps per chapter) + migration for old saves
js/state.js           new actions/selectors for profile, lectures, DPPs, batch classes
js/planner.js         now factors in batch classes and pending DPPs
js/render.js          rewritten: onboarding, redesigned dashboard, batch/resources views, chapter Lectures/DPP sections
js/app.js             rewritten: onboarding wizard logic + new event handlers
js/icons.js           added: calendar, external-link, layers, cap, compass icons
assets/logo.svg        unchanged — your logo is untouched
```

Just replace the files above with the versions in this zip. **`assets/logo.svg` is included unchanged** so your existing logo is preserved exactly.

**Your existing data is safe.** `storage.js` detects a v1 save (from before this upgrade) and migrates it automatically the first time the page loads: existing chapter progress, homework, exams, and notes all carry over, and empty `lectures`/`dpps` arrays are backfilled per chapter. You'll still see the onboarding wizard once (since `onboarded` name/date now lives under `profile`), but declining is fine — just fill it in and continue; nothing is deleted.

## Replacing the placeholder logo

If you're still using the placeholder mark from v1, drop your real file in as `assets/logo.svg` (or update the four `<img src="assets/logo.svg">` references if yours is a `.png`). If you already swapped in your real logo, this upgrade leaves it untouched.

## Editing the syllabus

All subjects and chapters live in **`js/data.js`** in the `SUBJECTS` array — nothing else needs to change when the syllabus is updated. Chapter `id`s are permanent keys progress is stored against — don't rename an existing chapter's `id`.

**Important:** verify every subject against the official CISCE syllabus PDF, linked directly from the app's new **Resources** tab (`https://cisce.org/icse-regulations-and-syllabuses-2027/`), and adjust `js/data.js` if anything has changed for your specific curriculum.

## Configuring the AI Paper Generator link

In `js/data.js`, set:

```js
const AI_PAPER_GENERATOR_URL = "https://your-generator-url-here";
```

Leave it empty (`""`) and the Resources tab shows a clean "not configured" placeholder instead of a broken link. Never put an API key here or anywhere in the frontend — this is a link-out only.

## How data is stored

Everything (profile, onboarding status, chapter/lecture/DPP progress, batch classes, homework, exams, notes, weekly targets, settings) is saved to the browser's `localStorage` under the key `vedamitra_state_v1` — private to that browser, free, no account needed. Use **Settings → Export backup** regularly, and **Import backup** to restore or move to another device/browser.

## Wiring a real AI planner later

`js/planner.js` currently generates Today's Study Plan with a local, rule-based engine (no network call, no API key — see the comment at the top of that file). It now also factors in today's batch classes and pending DPPs. When you're ready to connect a real AI model:

1. Deploy a small serverless function (Vercel, Cloudflare Worker, Supabase Edge Function, etc.) that holds your AI API key **server-side only**.
2. Have it accept the same shape `Planner.buildPlannerContext(state)` produces, and return a task array shaped like what `generateTodayPlan` returns.
3. In `generateTodayPlan`, call that endpoint with `fetch`, and fall back to the existing local logic if the request fails — so the app keeps working offline.

Never put an API key in any frontend file.

## Project structure

```
index.html
css/style.css        design system + all component styles (v2 tokens: forest/blue gradient)
js/data.js            syllabus, subject data, exam types, resources, AI paper generator URL
js/storage.js         localStorage read/write, versioned schema (v2), migration from v1, backup export/import
js/state.js           app state, actions (mutations incl. lectures/DPPs/batch), selectors (derived data)
js/planner.js         local rule-based Today's Plan generator (batch- and DPP-aware)
js/icons.js           inline SVG icon set
js/render.js          all view templates incl. onboarding wizard, batch, resources
js/app.js             boot, event delegation, onboarding logic, modals, splash screen
assets/logo.svg       your VEDAMITRA logo
```

## Testing checklist

Splash → onboarding (first run only) → dashboard → Subjects → a subject → a chapter (toggle status, set lecture count, tick lectures, add/toggle a DPP, log time) → Revision → Weekly Target → Homework (all four tabs) → Upcoming Exams → Notes (search/pin) → Resources (both links open in a new tab) → Settings (edit profile, export/import backup) → refresh the page and confirm everything persisted → resize down to ~320px and confirm the bottom nav appears with no horizontal scroll.

## Known limitations

- Syllabus chapter lists should be verified against the official CISCE 2027 PDF (linked from Resources).
- The AI planner is local/rule-based until you wire the serverless endpoint described above; `AI_PAPER_GENERATOR_URL` is a link-out only, not an embedded generator.
- Data lives in one browser's `localStorage` — no cross-device sync until a backend (Firebase/Supabase) is added; `Store` is the single place that would need to change for that.
- The official CISCE "specimen/sample papers" link points to the CISCE homepage (Library → Publications) rather than a specific PDF, since CISCE doesn't publish a single stable direct link for those — the Regulations & Syllabuses link, by contrast, is a verified direct URL.

