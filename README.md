# VEDAMITRA — Your Personal AI Study Companion

A premium, single-page study companion for ICSE Class 10 (2027 exams). Plain HTML/CSS/JS — no build step, no npm install, no framework. Upload this folder to GitHub and it runs as-is.

## Run it locally

Because the app uses ES-module-free classic scripts, you can just open `index.html` directly in a browser and it will work. For the smoothest experience (and required if you later switch anything to `fetch`), serve it locally instead:

```bash
# from inside the vedamitra/ folder
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

1. Push this folder's contents to the **root** of your repository (or to a `docs/` folder).
2. In your repo: **Settings → Pages → Source** → select the branch (and `/docs` if used).
3. Your app will be live at `https://<username>.github.io/<repo>/` within a minute or two.

No environment variables, no backend, and no cost — everything runs in the browser and saves to `localStorage`.

## Replacing the placeholder logo

`assets/logo.svg` is a placeholder mark (forest-green circle with a leaf/gold motif) so the app is fully functional out of the box. To use your real VEDAMITRA logo:

1. Replace `assets/logo.svg` with your actual logo file. If yours is a `.png`, either convert it to SVG or keep the filename `logo.png` and update the four `src="assets/logo.svg"` references in `index.html` and `js/render.js` to `assets/logo.png`.
2. The logo is used in: splash screen, sidebar, mobile topbar, and Settings → About. No other changes needed — it's referenced from one place conceptually (just multiple `<img>` tags pointing at the same file).

## Editing the syllabus

All subjects and chapters live in **`js/data.js`** — nothing else needs to change when the syllabus is updated. Each subject has an `id`, `name`, `color`, and a `chapters` array of `{ id, name }`. Chapter `id`s are permanent keys progress is stored against — don't rename an existing chapter's `id` (renaming `name` is safe).

**Important:** the chapter lists shipped here follow the standard, long-stable ICSE Class 10 curriculum structure. Before relying on this for real exam prep, cross-check every subject against the official CISCE syllabus PDF at [cisce.org](https://cisce.org) (Publications → Syllabus, 2026-27 session / ICSE 2027 exam) and adjust `js/data.js` if anything has changed.

## How data is stored

Everything (chapter progress, revisions, homework, exams, notes, weekly targets, settings) is saved to the browser's `localStorage` under the key `vedamitra_state_v1` — private to that browser, free, no account needed. Use **Settings → Export backup** regularly, and **Import backup** to restore or move to another device/browser.

## Wiring a real AI planner later

`js/planner.js` currently generates Today's Study Plan with a local, rule-based engine (no network call, no API key — see the comment at the top of that file). When you're ready to connect a real AI model:

1. Deploy a small serverless function (Vercel, Cloudflare Worker, Supabase Edge Function, etc.) that holds your AI API key **server-side only**.
2. Have it accept the same shape `Planner.buildPlannerContext(state)` produces, and return a task array shaped like what `generateTodayPlan` returns.
3. In `generateTodayPlan`, call that endpoint with `fetch`, and fall back to the existing local logic if the request fails — so the app keeps working offline.

Never put an API key in any frontend file.

## Project structure

```
index.html
css/style.css        design system + all component styles
js/data.js            syllabus & subject data (edit this for syllabus changes)
js/storage.js         localStorage read/write, versioned schema, backup export/import
js/state.js           app state, actions (mutations), selectors (derived data)
js/planner.js         local rule-based Today's Plan generator
js/icons.js           inline SVG icon set
js/render.js          all view templates (dashboard, subjects, revision, etc.)
js/app.js             boot, event delegation, modals, splash screen
assets/logo.svg       placeholder logo — replace with your real one
```

## Known limitations

- Syllabus chapter lists should be verified against the official CISCE 2027 PDF (see above).
- The AI planner is currently rule-based/local; real LLM-generated plans need the serverless wiring described above.
- Data lives in one browser's `localStorage` — it does not sync across devices until a backend (Firebase/Supabase) is added; the `Store` module is the single place that would need to change for that.
