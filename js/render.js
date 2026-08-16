/**
 * VEDAMITRA 3.0 — Rendering
 * ---------------------------
 * Every view is a pure function of `App.getState()` that returns an HTML
 * string, swapped into #app-root on every state change (see app.js).
 *
 * ONE DELIBERATE EXCEPTION: chapter expand/collapse. That interaction is
 * handled entirely in app.js via direct DOM class toggling — it never calls
 * an App.action or App.setView, so it never triggers a re-render. This is
 * both how the CSS grid expand animation is able to play at all (a freshly
 * rebuilt element can't transition from a "before" state) and, as a side
 * effect, why the old "editing a field inside an open chapter collapses it"
 * bug structurally cannot happen here — the chapter's open/closed state
 * lives only in the DOM and in `state._openChapters` (a same-session,
 * never-persisted convenience map used purely to re-apply the right class
 * when a *different* action does cause a full re-render).
 */

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function formatDateLong(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function priorityChip(p) {
  const cls = { High: "chip-high", Medium: "chip-medium", Low: "chip-low" }[p] || "chip-medium";
  return `<span class="chip ${cls}">${escapeHtml(p || "Medium")}</span>`;
}
function progressBar(pct, color) {
  return `<div class="progress-track"><div class="progress-fill" style="width:${pct}%; ${color ? `background:${color};` : ""}"></div></div>`;
}
function emptyState(icon, title, subtitle) {
  return `<div class="empty-state">${iconEl(icon, "empty-icon")}<p class="empty-title">${escapeHtml(title)}</p><p class="empty-subtitle">${escapeHtml(subtitle)}</p></div>`;
}
function sectionHeader(title, action) {
  return `<div class="section-header"><h3>${escapeHtml(title)}</h3>${action || ""}</div>`;
}
function arcSvg(pct, size, strokeW) {
  const r = (size - strokeW) / 2, c = 2 * Math.PI * r, offset = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
  const cx = size / 2;
  return `<svg viewBox="0 0 ${size} ${size}" class="arc">
    <circle cx="${cx}" cy="${cx}" r="${r}" class="arc-track" stroke-width="${strokeW}" />
    <circle cx="${cx}" cy="${cx}" r="${r}" class="arc-fill" stroke-width="${strokeW}" stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
  </svg>`;
}

// Independent, persistent chapter checklist items — ticking one never
// affects the others.
const CHAPTER_CHECK_FIELDS = [
  ["theory", "Theory"],
  ["exercises", "Exercises"],
  ["revision", "Revision"],
  ["pyqs", "PYQs"],
  ["educart1", "Educart Worksheet 1"],
  ["educart2", "Educart Worksheet 2"],
  ["educart3", "Educart Worksheet 3"],
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Schedule", icon: "dashboard" },
  { id: "subjects", label: "Subjects", icon: "subjects" },
  { id: "batch", label: "Classes", icon: "cap" },
  { id: "revision", label: "Revision", icon: "revision" },
  { id: "weekly-target", label: "Weekly Target", icon: "target" },
  { id: "homework", label: "Homework", icon: "homework" },
  { id: "exams", label: "Tests", icon: "exams" },
  { id: "notes", label: "Notes", icon: "notes" },
  { id: "resources", label: "Resources", icon: "compass" },
  { id: "settings", label: "Settings", icon: "settings" },
];
const TAB_ITEMS = ["dashboard", "subjects", "batch", "revision"];

// ---------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------
function renderShell() {
  const state = App.getState();
  if (!state.onboarded) return renderOnboarding();

  const view = App.getView();
  const initials = (state.profile.studentName || "S").trim().slice(0, 1).toUpperCase();
  const isSubjectDetail = view.startsWith("subject:");

  return `
    <div class="app-shell">
      <header class="top-bar">
        <div class="top-bar-avatar">${initials}</div>
        <div class="top-bar-greeting">${isSubjectDetail ? "VEDAMITRA" : (NAV_ITEMS.find((n) => n.id === view)?.label === "Schedule" ? `Hi, ${escapeHtml(state.profile.studentName || "Student")}` : NAV_ITEMS.find((n) => n.id === view)?.label || "VEDAMITRA")}</div>
        <button class="top-bar-icon-btn" data-action="navigate" data-view="settings" aria-label="Settings">${Icon.settings}</button>
      </header>
      <main class="main">
        <div class="view-root" id="view-root">${renderView(view)}</div>
      </main>
      ${renderTabBar(view)}
      <div class="modal-layer" id="modal-layer"></div>
    </div>
  `;
}

function renderTabBar(view) {
  return `<nav class="tab-bar">
    ${TAB_ITEMS.map((id) => {
      const item = NAV_ITEMS.find((n) => n.id === id);
      return `<button class="tab-bar-item ${view === id ? "active" : ""}" data-action="navigate" data-view="${id}">
        ${iconEl(item.icon)}<span>${item.label}</span>
      </button>`;
    }).join("")}
    <button class="tab-bar-item ${!TAB_ITEMS.includes(view) ? "active" : ""}" data-action="open-more">${iconEl("menu")}<span>More</span></button>
  </nav>`;
}

function renderMoreSheet(view) {
  const rest = NAV_ITEMS.filter((n) => !TAB_ITEMS.includes(n.id));
  return `
    <div class="sheet-grabber"></div>
    <h3>More</h3>
    <div class="more-sheet-list">
      ${rest.map(
        (item) => `<button class="more-sheet-item ${view === item.id ? "active" : ""}" data-action="navigate" data-view="${item.id}">
          ${iconEl(item.icon)}<span>${item.label}</span>${iconEl("chevronRight", "more-caret")}
        </button>`
      ).join("")}
    </div>
  `;
}

function renderView(view) {
  switch (view) {
    case "dashboard": return renderDashboard();
    case "subjects": return renderSubjects();
    case "batch": return renderBatch();
    case "revision": return renderRevision();
    case "weekly-target": return renderWeeklyTargets();
    case "homework": return renderHomework();
    case "exams": return renderExams();
    case "notes": return renderNotes();
    case "resources": return renderResources();
    case "settings": return renderSettings();
    default:
      if (view.startsWith("subject:")) return renderSubjectDetail(view.split(":")[1]);
      return renderDashboard();
  }
}

// ---------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------
const ONBOARDING_STEPS = ["About You", "Your Subjects", "Your Batch", "Upcoming Tests", "Study Routine", "Finish"];

function renderOnboarding() {
  const state = App.getState();
  const step = state._onboardingStep || 0;
  const draft = state._onboardingDraft || { ...state.profile, exams: [] };
  state._onboardingDraft = draft;

  return `
    <div class="onboarding">
      <div class="onboarding-card">
        <div class="onboarding-brand"><img src="assets/logo.svg" alt="VEDAMITRA" /><span>VEDAMITRA</span></div>
        <div class="onboarding-progress">
          ${ONBOARDING_STEPS.map((s, i) => `<span class="ob-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}"></span>`).join("")}
        </div>
        <p class="onboarding-step-label">Step ${step + 1} of ${ONBOARDING_STEPS.length} · ${ONBOARDING_STEPS[step]}</p>
        <div class="onboarding-body">${renderOnboardingStep(step, draft)}</div>
      </div>
    </div>
  `;
}

function renderOnboardingStep(step, d) {
  if (step === 0) {
    return `
      <h2>About you</h2>
      <p class="muted">A little context helps VEDAMITRA tailor your plan.</p>
      <label class="field-block">Your name<input type="text" data-ob-field="studentName" value="${escapeHtml(d.studentName)}" placeholder="e.g. Aarav" /></label>
      <div class="field-row">
        <label>Class<input type="text" data-ob-field="className" value="${escapeHtml(d.className)}" /></label>
        <label>Board<input type="text" data-ob-field="board" value="${escapeHtml(d.board)}" /></label>
      </div>
      <div class="field-row">
        <label>Academic year<input type="text" data-ob-field="academicYear" value="${escapeHtml(d.academicYear)}" /></label>
        <label>School / coaching name<input type="text" data-ob-field="schoolName" value="${escapeHtml(d.schoolName)}" placeholder="Optional" /></label>
      </div>
      ${obNav(0)}
    `;
  }
  if (step === 1) {
    return `
      <h2>Your subjects</h2>
      <p class="muted">Uncheck anything you're not studying this year.</p>
      <div class="ob-subject-grid">
        ${SUBJECTS.map((s) => `
          <label class="check-pill ${d.subjects.includes(s.id) ? "picked" : ""}">
            <input type="checkbox" data-ob-subject="${s.id}" ${d.subjects.includes(s.id) ? "checked" : ""} />
            <span>${s.name}</span>
          </label>`).join("")}
      </div>
      ${obNav(1)}
    `;
  }
  if (step === 2) {
    return `
      <h2>Your batch</h2>
      <p class="muted">Optional — note your coaching/batch schedule. Add individual classes and lecture counts anytime from Batch Classes and each Subject page.</p>
      <label class="field-block">Batch schedule notes<textarea rows="4" data-ob-field="batchScheduleNote" placeholder="e.g. Physics batch — Mon/Wed/Fri 6-7pm">${escapeHtml(d.batchScheduleNote)}</textarea></label>
      ${obNav(2)}
    `;
  }
  if (step === 3) {
    return `
      <h2>Upcoming tests</h2>
      <p class="muted">Add any exams you already know about. You can add more later.</p>
      <div class="ob-exam-rows">
        ${(d.exams || []).map((e, i) => `
          <div class="ob-exam-row">
            <span>${escapeHtml(e.name)} · ${escapeHtml(e.subject)} · ${formatDateShort(e.date)}</span>
            <button type="button" class="icon-btn xs" data-ob-remove-exam="${i}">${Icon.trash}</button>
          </div>`).join("") || `<p class="muted">No exams added yet.</p>`}
      </div>
      <div class="field-row">
        <label>Exam name<input type="text" id="ob-exam-name" placeholder="e.g. Mid-term" /></label>
        <label>Subject<select id="ob-exam-subject">${SUBJECTS.map((s) => `<option value="${s.name}">${s.name}</option>`).join("")}</select></label>
      </div>
      <div class="field-row">
        <label>Date<input type="date" id="ob-exam-date" /></label>
        <label>&nbsp;<button type="button" class="btn-ghost sm" data-action="ob-add-exam">${iconEl("plus")}Add</button></label>
      </div>
      ${obNav(3)}
    `;
  }
  if (step === 4) {
    return `
      <h2>Study routine</h2>
      <label class="field-block">Daily study time available (minutes)<input type="number" min="30" step="15" data-ob-field="dailyStudyMinutes" value="${d.dailyStudyMinutes}" /></label>
      <label class="field-block">Preferred study days</label>
      <div class="ob-days">
        ${WEEKDAYS.map((day) => `
          <label class="check-pill ${d.preferredDays.includes(day) ? "picked" : ""}">
            <input type="checkbox" data-ob-day="${day}" ${d.preferredDays.includes(day) ? "checked" : ""} />
            <span>${day}</span>
          </label>`).join("")}
      </div>
      ${obNav(4)}
    `;
  }
  return `
    <h2>You're all set, ${escapeHtml(d.studentName || "there")}</h2>
    <p class="muted">Here's a quick summary — you can change any of this later in Settings.</p>
    <ul class="ob-summary">
      <li><strong>${escapeHtml(d.className)}</strong> · ${escapeHtml(d.board)} · ${escapeHtml(d.academicYear)}</li>
      <li>${d.subjects.length} subjects selected</li>
      <li>${d.dailyStudyMinutes} minutes/day · ${d.preferredDays.length} study days/week</li>
      <li>${(d.exams || []).length} exam(s) added</li>
    </ul>
    <div class="modal-actions">
      <button type="button" class="btn-ghost sm" data-action="ob-back">${iconEl("chevronLeft")}Back</button>
      <button type="button" class="btn-primary sm" data-action="ob-finish">${iconEl("check")}Go to Dashboard</button>
    </div>
  `;
}
function obNav(step) {
  return `<div class="modal-actions">
    ${step > 0 ? `<button type="button" class="btn-ghost sm" data-action="ob-back">${iconEl("chevronLeft")}Back</button>` : "<span></span>"}
    <button type="button" class="btn-primary sm" data-action="ob-next">Continue${iconEl("chevronRight")}</button>
  </div>`;
}

// ---------------------------------------------------------------------
// Dashboard — hero + dominant focus card + compact plan strip, then a
// two-column composition (progress/upcoming) on wide screens.
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// Dashboard — "Your Learning Hub"
// ---------------------------------------------------------------------
function weekRangeLabel() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `Week ${week}: ${monday.getDate()}-${fmt(sunday)}`;
}

const TASK_CAT_ICONS = { Revision: "revision", DPP: "layers", Homework: "homework", Lecture: "cap", Theory: "book" };

function renderDashboard() {
  const state = App.getState();
  const s = App.selectors;
  const overall = s.overallProgress();
  const name = state.profile.studentName || "Student";
  const plan = state.todayPlan.date === App.todayISO() ? state.todayPlan.tasks : null;
  const nextExam = s.upcomingExams(1)[0];
  const dueRevisions = s.revisionsDueToday();

  return `
    <div>
      <p class="hub-eyebrow">Welcome back to VEDAMITRA</p>
      <h1 class="hub-title">Your Learning Hub</h1>
      <span class="hub-week-pill">${iconEl("calendar")}${weekRangeLabel()}</span>
    </div>

    <div class="card">
      ${sectionHeader("Today's Scheduled Work", plan && plan.length ? `<span class="pill-badge">${plan.length} Tasks</span>` : "")}
      ${plan && plan.length ? renderTaskList(plan) : `<div class="empty-state">${iconEl("sparkle", "empty-icon")}<p class="empty-title">No plan generated yet</p><p class="empty-subtitle">Build today's plan from batch classes, revisions, homework and weak chapters.</p><button class="btn-primary sm" data-action="generate-plan">${iconEl("sparkle")}Generate Today's Plan</button></div>`}
      ${plan && plan.length ? `<div style="margin-top:12px; text-align:right;"><button class="btn-ghost xs" data-action="generate-plan">${iconEl("sparkle")}Regenerate</button></div>` : ""}
    </div>

    <div class="boards-card">
      <p class="boards-eyebrow">${iconEl("exams")}ICSE 2027 Boards</p>
      <div class="boards-days-row">
        <div><div class="boards-days">${nextExam ? s.daysUntil(nextExam.date) : (state.settings.boardExamDate ? s.daysUntil(state.settings.boardExamDate) : "—")}</div><div class="boards-days-label">Days Remaining</div></div>
      </div>
      <div class="boards-progress-row"><span>Class 10 Syllabus Progress</span><span>${overall.pct}%</span></div>
      <div class="progress-track on-navy"><div class="progress-fill" style="width:${overall.pct}%"></div></div>
    </div>

    <h3 class="qa-heading">Quick Access</h3>
    <div class="nav-cards">
      <button class="nav-card nc-lavender" data-action="navigate" data-view="weekly-target">Weekly Schedule<span class="nav-card-icon">${iconEl("target")}</span></button>
      <button class="nav-card nc-amber" data-action="navigate" data-view="subjects">Subjects<span class="nav-card-icon">${iconEl("subjects")}</span></button>
      <button class="nav-card nc-navy" data-action="navigate" data-view="revision">Revision${dueRevisions.length ? `<span class="chip chip-high" style="align-self:flex-start;">${dueRevisions.length} Due</span>` : ""}<span class="nav-card-icon">${iconEl("revision")}</span></button>
      <button class="nav-card nc-emerald" data-action="navigate" data-view="homework">Homework<span class="nav-card-icon">${iconEl("homework")}</span></button>
      <button class="nav-card nc-crimson" data-action="navigate" data-view="exams">Tests<span class="nav-card-icon">${iconEl("exams")}</span></button>
      <button class="nav-card nc-blue" data-action="navigate" data-view="resources">Resources<span class="nav-card-icon">${iconEl("compass")}</span></button>
    </div>
  `;
}

function renderTaskList(plan) {
  return `<div class="task-list">
    ${plan.map((t, i) => `
      <div class="task-card task-cat-${i % 4} ${t.done ? "done" : ""}">
        <span class="task-card-icon">${iconEl(TASK_CAT_ICONS[t.type] || "book")}</span>
        <div class="task-card-body">
          <p class="task-card-title">${escapeHtml(t.subject)}: ${escapeHtml(t.chapter)}</p>
          <p class="task-card-cat"><span class="dot" style="background:currentColor;width:5px;height:5px;"></span>${escapeHtml(t.subject)}</p>
        </div>
        <div class="task-card-right">
          <span class="task-card-duration">${t.duration} min</span>
          <button class="check-circle ${t.done ? "checked" : ""}" data-action="toggle-plan-task" data-index="${i}">${t.done ? Icon.check : ""}</button>
        </div>
      </div>`).join("")}
  </div>`;
}

function renderWeeklyTargetSummary(targets) {
  if (!targets.length) return emptyState("target", "No target set", "Create one from the Weekly Target tab.");
  const t = targets[0];
  const pct = t.goal ? Math.min(100, Math.round((t.current / t.goal) * 100)) : 0;
  return `
    <p style="font-weight:700; font-size:0.92rem; margin-bottom:6px;">${escapeHtml(t.label)}</p>
    ${progressBar(pct)}
    <p class="muted">${t.current} / ${t.goal} · due ${formatDateShort(t.deadline)}</p>
  `;
}


// ---------------------------------------------------------------------
// Batch Classes
// ---------------------------------------------------------------------
function renderBatch() {
  const today = App.selectors.todaysBatchClasses();
  const upcoming = App.selectors.upcomingBatchClasses(20);
  return `
    <div class="list-header">
      <h2>Batch Classes</h2>
      <button class="btn-primary sm" data-action="open-add-batch">${iconEl("plus")}Add Class</button>
    </div>
    <div class="card">
      ${sectionHeader("Today")}
      ${today.length ? renderBatchRows(today, true) : emptyState("cap", "No classes today", "Add today's batch lecture to see it here.")}
    </div>
    <div class="card">
      ${sectionHeader("Upcoming")}
      ${upcoming.length ? renderBatchRows(upcoming, true) : emptyState("calendar", "Nothing scheduled", "Add upcoming batch classes to plan ahead.")}
    </div>
  `;
}
function renderBatchRows(list, withDelete) {
  return `<ul class="task-rows">
    ${list.map((c) => `
      <li class="task-row">
        <button class="check-circle ${c.completed ? "checked" : ""}" data-action="toggle-batch-class" data-id="${c.id}">${c.completed ? Icon.check : ""}</button>
        <div class="task-row-body">
          <p class="${c.completed ? "strike" : ""}">${escapeHtml(c.subject)} — ${escapeHtml(c.chapter)} <span class="chip chip-status">Lecture ${c.lectureNumber}</span></p>
          <p class="muted">${formatDateShort(c.date)}${c.time ? " · " + escapeHtml(c.time) : ""}${c.teacher ? " · " + escapeHtml(c.teacher) : ""}</p>
        </div>
        ${withDelete ? `<button class="icon-btn xs" data-action="delete-batch-class" data-id="${c.id}">${Icon.trash}</button>` : ""}
      </li>`).join("")}
  </ul>`;
}

// ---------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------
function renderSubjects() {
  const state = App.getState();
  const query = (state._subjectQuery || "").toLowerCase();
  const active = SUBJECTS.filter((s) => state.profile.subjects.includes(s.id) && (!query || s.name.toLowerCase().includes(query)));
  return `
    <h2 style="margin-bottom:14px;">Subjects</h2>
    <div class="search-box">${iconEl("search")}<input type="search" placeholder="Search subjects…" value="${escapeHtml(state._subjectQuery || "")}" data-action="search-subjects" /></div>
    <div class="subject-grid">
      ${active.map((s, i) => {
        const p = App.selectors.subjectProgress(s.id);
        const started = Object.values(App.getState().subjects[s.id].chapters).filter((c) => c.status !== "not-started").length;
        return `
        <button class="subject-card card ${i % 3 === 0 ? "tint" : ""}" data-action="navigate" data-view="subject:${s.id}">
          <div>
            <h3>${escapeHtml(s.name)}</h3>
            <p class="mono-label">${started}/${p.total} CHAPTERS STARTED</p>
          </div>
          <span class="subject-card-arrow">${iconEl("chevronRight")}</span>
        </button>`;
      }).join("")}
    </div>
  `;
}

function renderSubjectDetail(subjectId) {
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  if (!subject) return emptyState("subjects", "Subject not found", "");
  const state = App.getState();
  const p = App.selectors.subjectProgress(subjectId);

  return `
    <button class="back-link" data-action="navigate" data-view="subjects">${iconEl("chevronLeft")}All subjects</button>
    <div class="subject-header">
      <p class="mono-label">${p.completed} of ${p.total} chapters completed</p>
      <h2>${escapeHtml(subject.name)}</h2>
    </div>
    <div class="chapter-list">
      ${subject.chapters.map((c) => renderChapterCard(subject, c, state.subjects[subjectId].chapters[c.id])).join("")}
    </div>
  `;
}

// Purely a display-time calculation combining every independent completion
// signal into one glanceable percentage.
function chapterOverallPct(chapter, lecP, dppP) {
  const flags = CHAPTER_CHECK_FIELDS.map(([f]) => (chapter[f] ? 1 : 0));
  let sum = flags.reduce((a, b) => a + b, 0);
  let count = flags.length;
  if (lecP.total > 0) { sum += lecP.completed / lecP.total; count += 1; }
  if (dppP.total > 0) { sum += dppP.completed / dppP.total; count += 1; }
  return count ? Math.round((sum / count) * 100) : 0;
}

function renderChapterCard(subject, chapterMeta, chapter) {
  const statusLabel = { "not-started": "Not Started", "in-progress": "In Progress", completed: "Completed" }[chapter.status];
  const lecP = App.selectors.lectureProgress(subject.id, chapterMeta.id);
  const dppP = App.selectors.dppProgress(subject.id, chapterMeta.id);
  const nextRevision = (chapter.revisionSchedule || []).find((r) => !r.done);
  const openKey = subject.id + ":" + chapterMeta.id;
  const isOpen = !!(App.getState()._openChapters || {})[openKey];
  const pct = chapterOverallPct(chapter, lecP, dppP);
  const nextLectureIdx = (chapter.lectures || []).findIndex((l) => !l.completed);

  return `
    <div class="chapter-card status-${chapter.status} ${isOpen ? "expanded" : ""}" data-subject="${subject.id}" data-chapter="${chapterMeta.id}">
      <button type="button" class="chapter-summary" data-action="toggle-chapter">
        <span class="status-dot"></span>
        <span class="chapter-name">${escapeHtml(chapterMeta.name)}</span>
        <span class="chip-row">
          ${lecP.total ? `<span class="chip chip-status">Lec ${lecP.completed}/${lecP.total}</span>` : ""}
          <span class="chip chip-status">${statusLabel}</span>
        </span>
        ${iconEl("chevronRight", "summary-caret")}
      </button>
      <div class="chapter-body-track">
        <div class="chapter-body">
          <div class="chapter-progress-card">
            <div class="chapter-progress-row"><span class="mono-label">OVERALL COMPLETION</span><span class="chapter-progress-pct">${pct}%</span></div>
            ${progressBar(pct)}
          </div>

          <div class="status-toggle" role="group">
            ${["not-started", "in-progress", "completed"].map(
              (st) => `<button class="status-btn ${chapter.status === st ? "active" : ""}" data-action="set-chapter-status" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-status="${st}">${{ "not-started": "Not Started", "in-progress": "In Progress", completed: "Completed" }[st]}</button>`
            ).join("")}
          </div>

          <div>
            <div class="subsection-header"><span class="subsection-title">Batch Lectures</span><span class="pill-badge">${lecP.completed}/${lecP.total} Completed</span></div>
            <div class="lecture-count-row"><span class="muted">Lectures in batch</span><input type="number" min="0" max="60" value="${lecP.total}" data-action="set-lecture-count" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" /></div>
            ${lecP.total ? `<div class="lecture-list">
              ${chapter.lectures.map((l, i) => `
                <div class="lecture-row ${l.completed ? "done" : ""}">
                  <button class="lecture-checkbox ${l.completed ? "done" : ""}" data-action="toggle-lecture" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">${l.completed ? Icon.check : ""}</button>
                  <div class="lecture-row-body">
                    <p class="lecture-row-title">Lecture ${i + 1}: ${escapeHtml(chapterMeta.name)}</p>
                    <p class="lecture-row-meta">${l.completed ? "Recorded" : i === nextLectureIdx ? "Up Next" : "Scheduled"}</p>
                  </div>
                  ${!l.completed && i === nextLectureIdx ? `<span class="lecture-today-pill">Next</span>` : ""}
                </div>`).join("")}
            </div>` : `<p class="muted">Set the lecture count above once your batch tells you how many lectures this chapter has.</p>`}
          </div>

          <div>
            <div class="subsection-header"><span class="subsection-title">DPPs</span><span class="pill-badge">${dppP.completed}/${dppP.total} Completed</span></div>
            ${chapter.dpps && chapter.dpps.length ? `<div class="dpp-full-list">
              ${chapter.dpps.map((d, i) => `
                <div class="dpp-full-row">
                  <button class="lecture-checkbox ${d.status === "completed" ? "done" : ""}" data-action="toggle-dpp" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">${d.status === "completed" ? Icon.check : ""}</button>
                  <div class="lecture-row-body"><p class="lecture-row-title ${d.status === "completed" ? "" : ""}">DPP ${i + 1}</p></div>
                  <input type="number" class="dpp-score-input" placeholder="Score" value="${d.score ?? ""}" data-action="set-dpp-score" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}" />
                  <button class="icon-btn xs" data-action="delete-dpp" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">${Icon.trash}</button>
                </div>`).join("")}
            </div>` : `<p class="muted">No DPPs added yet.</p>`}
            <button class="btn-ghost xs" style="margin-top:8px;" data-action="add-dpp" data-subject="${subject.id}" data-chapter="${chapterMeta.id}">${iconEl("plus")}Add DPP</button>
          </div>

          <div>
            <div class="subsection-header"><span class="subsection-title">Study Work</span></div>
            <div class="folder-grid">
              ${CHAPTER_CHECK_FIELDS.map(
                ([field, label]) => `<button class="folder-card ${chapter[field] ? "done" : ""}" data-action="toggle-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="${field}" data-value="${!chapter[field]}">
                  <div class="folder-card-top"><span class="folder-icon">${iconEl("book")}</span><span class="folder-status-dot"></span></div>
                  <div><p class="folder-title">${label}</p><p class="folder-caption">${chapter[field] ? "Completed" : "Not Started"}</p></div>
                </button>`
              ).join("")}
            </div>
          </div>

          <div>
            <div class="subsection-header"><span class="subsection-title">Confidence &amp; Difficulty</span></div>
            <div class="confidence-row">
              ${[1, 2, 3, 4, 5].map(
                (n) => `<button class="confidence-dot ${n <= chapter.confidence ? "filled" : ""}" data-action="set-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="confidence" data-numeric="1" data-value="${n}" aria-label="Confidence ${n}"></button>`
              ).join("")}
            </div>
            <div class="difficulty-row" style="margin-top:10px;">
              ${["Easy", "Medium", "Hard"].map(
                (d) => `<button class="difficulty-btn ${chapter.difficulty === d ? "active" : ""}" data-action="set-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="difficulty" data-value="${d}">${d}</button>`
              ).join("")}
            </div>
          </div>

          <label class="field-block">Mistakes / things to revisit
            <textarea data-action="set-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="mistakes" rows="2" placeholder="e.g. sign errors in factorisation">${escapeHtml(chapter.mistakes)}</textarea>
          </label>

          <div class="chapter-footer">
            <span class="muted">${chapter.studyMinutes || 0} min studied</span>
            <button class="btn-ghost sm" data-action="log-time" data-subject="${subject.id}" data-chapter="${chapterMeta.id}">${iconEl("clock")}Log 25 min</button>
          </div>

          ${chapter.status === "completed" ? renderRevisionMini(subject, chapterMeta, chapter, nextRevision) : ""}
        </div>
      </div>
    </div>
  `;
}

function renderRevisionMini(subject, chapterMeta, chapter, nextRevision) {
  if (!chapter.revisionSchedule?.length) return "";
  return `<div class="revision-mini">
    <p class="mono-label">Revision schedule ${nextRevision ? `· next: ${formatDateShort(nextRevision.date)}` : "· all done"}</p>
    <div class="revision-chips">
      ${chapter.revisionSchedule.map((r, i) => `
        <button class="rev-chip ${r.done ? "done" : ""}" data-action="complete-revision" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">
          ${r.label} · ${formatDateShort(r.date)} ${r.done ? "✓" : ""}
        </button>`).join("")}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// Revision Center
// ---------------------------------------------------------------------
function renderRevision() {
  const due = App.selectors.revisionsDueToday();
  const upcoming = App.selectors.upcomingRevisions(21);
  return `
    <div class="section-title-flag"><span class="dot-flag"></span><h2 style="font-size:1.1rem;">Due Today</h2><span class="mono-label" style="margin-left:auto;">${due.length} TASKS</span></div>
    ${due.length ? `<div class="task-list" style="margin-bottom:24px;">${due.map((r) => renderRevisionDueCard(r)).join("")}</div>` : `<div class="card">${emptyState("check", "Nothing due", "You're fully caught up on revisions today.")}</div>`}
    <h2 style="font-size:1.05rem; margin-bottom:12px;">Upcoming</h2>
    <div class="card">
      ${upcoming.length ? renderRevisionRows(upcoming) : emptyState("revision", "Nothing scheduled", "Complete chapters to build your revision queue.")}
    </div>
  `;
}
function renderRevisionDueCard(r) {
  return `<div class="revision-due-card">
    <span class="chip chip-info" style="background:var(--lavender-tint); color:var(--lavender-deep);">${escapeHtml(r.subjectName).toUpperCase()}</span>
    <h3 style="margin-top:8px;">${escapeHtml(r.chapterName)}</h3>
    <div class="revision-due-meta-row">
      <div class="revision-due-meta"><span class="mono-label">Cycle</span><strong>${escapeHtml(r.label)}</strong></div>
      <div class="revision-due-meta"><span class="mono-label">Due</span><strong>${formatDateShort(r.date)}</strong></div>
    </div>
    <div class="revision-due-foot">
      <span class="dot" style="background:${r.color}"></span>
      <button class="btn-mark-revised" data-action="complete-revision" data-subject="${r.subjectId}" data-chapter="${r.chapterId}" data-index="${r.index}">${iconEl("check")}Mark Revised</button>
    </div>
  </div>`;
}
function renderRevisionRows(list) {
  return `<ul class="revision-rows">
    ${list.map((r) => `
      <li><span class="dot" style="background:${r.color}"></span>
        <div class="revision-row-body"><p>${escapeHtml(r.subjectName)} — ${escapeHtml(r.chapterName)}</p><p class="muted">${r.label} · ${formatDateLong(r.date)}</p></div>
        <button class="btn-ghost sm" data-action="complete-revision" data-subject="${r.subjectId}" data-chapter="${r.chapterId}" data-index="${r.index}">${iconEl("check")}Done</button>
      </li>`).join("")}
  </ul>`;
}

// ---------------------------------------------------------------------
// Weekly Target
// ---------------------------------------------------------------------
function renderWeeklyTargets() {
  const targets = App.getState().weeklyTargets;
  return `
    <div class="list-header"><h2>Weekly Target</h2><button class="btn-primary sm" data-action="open-add-target">${iconEl("plus")}New Target</button></div>
    ${targets.length ? `<div class="target-grid">${targets.map(renderTargetCard).join("")}</div>` : emptyState("target", "No weekly targets yet", "Set a target like \u201cComplete 5 chapters\u201d to stay on track.")}
  `;
}
function renderTargetCard(t) {
  const pct = t.goal ? Math.min(100, Math.round((t.current / t.goal) * 100)) : 0;
  return `<div class="card target-card">
    <div class="target-card-top"><h4>${escapeHtml(t.label)}</h4><button class="icon-btn xs" data-action="delete-target" data-id="${t.id}">${Icon.trash}</button></div>
    ${progressBar(pct)}
    <div class="target-card-foot"><span>${t.current} / ${t.goal}</span><span class="muted">by ${formatDateShort(t.deadline)}</span></div>
    <div class="target-controls">
      <button class="btn-ghost xs" data-action="target-increment" data-id="${t.id}" data-delta="-1">−</button>
      <button class="btn-ghost xs" data-action="target-increment" data-id="${t.id}" data-delta="1">+</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// Homework
// ---------------------------------------------------------------------
function renderHomework() {
  const s = App.selectors;
  const tabs = [
    { key: "today", label: "Today", items: s.todaysHomework() },
    { key: "upcoming", label: "Upcoming", items: s.upcomingHomework() },
    { key: "pending", label: "Pending", items: s.pendingHomework() },
    { key: "completed", label: "Completed", items: s.completedHomework() },
  ];
  const active = App.getState()._hwTab || "today";
  const activeTab = tabs.find((t) => t.key === active) || tabs[0];
  return `
    <div class="list-header">
      <div class="tabs">${tabs.map((t) => `<button class="tab ${t.key === active ? "active" : ""}" data-action="set-hw-tab" data-tab="${t.key}">${t.label}${t.items.length ? ` <span class="tab-count">${t.items.length}</span>` : ""}</button>`).join("")}</div>
      <button class="btn-primary sm" data-action="open-add-homework">${iconEl("plus")}Add Homework</button>
    </div>
    ${activeTab.items.length ? `<ul class="task-rows">${activeTab.items.map(renderHomeworkRow).join("")}</ul>` : emptyState("homework", "Nothing here", "Add homework to see it in this list.")}
  `;
}
function renderHomeworkRow(h) {
  return `<li class="task-row">
    <button class="check-circle ${h.completed ? "checked" : ""}" data-action="toggle-homework" data-id="${h.id}">${h.completed ? Icon.check : ""}</button>
    <div class="task-row-body">
      <p class="${h.completed ? "strike" : ""}">${escapeHtml(h.subject)}${h.chapter ? " — " + escapeHtml(h.chapter) : ""}</p>
      <p class="muted">${escapeHtml(h.description)}</p>
    </div>
    ${priorityChip(h.priority)}
    <span class="muted due-date">${formatDateShort(h.dueDate)}</span>
    <button class="icon-btn xs" data-action="delete-homework" data-id="${h.id}">${Icon.trash}</button>
  </li>`;
}

// ---------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------
function renderExams() {
  const exams = App.selectors.upcomingExams();
  return `
    <div class="list-header"><h2>Upcoming Exams</h2><button class="btn-primary sm" data-action="open-add-exam">${iconEl("plus")}Add Exam</button></div>
    ${exams.length ? `<ul class="task-rows">${exams.map(renderExamRow).join("")}</ul>` : emptyState("exams", "No exams added", "Add your upcoming exams to track the countdown.")}
  `;
}
function renderExamRow(e) {
  const days = App.selectors.daysUntil(e.date);
  return `<li class="task-row">
    <div class="exam-days">${days}<span>days</span></div>
    <div class="task-row-body">
      <p>${escapeHtml(e.name)} <span class="muted">· ${escapeHtml(e.subject)} · ${escapeHtml(e.type || "Other")}</span></p>
      <p class="muted">${formatDateLong(e.date)}${e.importantChapters ? " · " + escapeHtml(e.importantChapters) : ""}</p>
    </div>
    ${priorityChip(e.priority)}
    <select class="prep-select" data-action="set-exam-prep" data-id="${e.id}">
      ${["Not Started", "In Progress", "Ready"].map((st) => `<option ${e.prepStatus === st ? "selected" : ""}>${st}</option>`).join("")}
    </select>
    <button class="icon-btn xs" data-action="delete-exam" data-id="${e.id}">${Icon.trash}</button>
  </li>`;
}

// ---------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------
function renderNotes() {
  const state = App.getState();
  const query = (state._noteQuery || "").toLowerCase();
  let notes = state.notes.filter((n) => !query || n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query));
  notes = [...notes].sort((a, b) => (b.pinned - a.pinned) || b.updatedAt - a.updatedAt);
  return `
    <div class="list-header">
      <div class="search-box">${iconEl("search")}<input type="search" placeholder="Search notes…" value="${escapeHtml(state._noteQuery || "")}" data-action="search-notes" /></div>
      <button class="btn-primary sm" data-action="open-add-note">${iconEl("plus")}New Note</button>
    </div>
    ${notes.length ? `<div class="notes-grid">${notes.map(renderNoteCard).join("")}</div>` : emptyState("notes", "No notes yet", "Capture a quick note against any subject or chapter.")}
  `;
}
function renderNoteCard(n) {
  const subj = SUBJECTS.find((s) => s.id === n.subject);
  return `<div class="note-card ${n.pinned ? "pinned" : ""}">
    <div class="note-card-top"><span class="chip chip-status">${escapeHtml(subj?.name || "General")}</span><button class="icon-btn xs ${n.pinned ? "active" : ""}" data-action="toggle-pin-note" data-id="${n.id}">${Icon.pin}</button></div>
    <h4>${escapeHtml(n.title)}</h4>
    <p class="note-body">${escapeHtml(n.body)}</p>
    <div class="note-card-foot"><button class="icon-btn xs" data-action="open-edit-note" data-id="${n.id}">${Icon.edit}</button><button class="icon-btn xs" data-action="delete-note" data-id="${n.id}">${Icon.trash}</button></div>
  </div>`;
}

// ---------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------
function renderResources() {
  return `
    <h2 style="margin-bottom:14px;">Resources</h2>
    <div class="card">
      ${sectionHeader("Official CISCE Resources")}
      <div class="resource-rows">
        ${Object.values(RESOURCES).map((r) => `
          <a class="resource-row" href="${r.url}" target="_blank" rel="noopener noreferrer">
            <div><p class="resource-title">${escapeHtml(r.label)} <span class="chip chip-info">Official</span></p><p class="muted">${escapeHtml(r.note)}</p></div>
            ${iconEl("external")}
          </a>`).join("")}
      </div>
    </div>
    <div class="card">
      ${sectionHeader("AI Paper Generator")}
      ${AI_PAPER_GENERATOR_URL
        ? `<p class="muted">Opens your configured AI-based paper generator in a new tab.</p>
           <a class="btn-primary sm" href="${AI_PAPER_GENERATOR_URL}" target="_blank" rel="noopener noreferrer">${iconEl("sparkle")}Open AI Paper Generator</a>`
        : `<div class="empty-state">${iconEl("sparkle", "empty-icon")}
             <p class="empty-title">Not configured yet</p>
             <p class="empty-subtitle">Set AI_PAPER_GENERATOR_URL in js/data.js. No API key needed here — it's a link-out only.</p>
           </div>`}
    </div>
  `;
}

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------
function renderSettings() {
  const { profile, settings } = App.getState();
  return `
    <h2 style="margin-bottom:14px;">Settings</h2>
    <div class="card settings-card">
      ${sectionHeader("Profile")}
      <label class="field-block">Your name<input type="text" value="${escapeHtml(profile.studentName)}" data-action="profile-field" data-field="studentName" /></label>
      <div class="field-row">
        <label>Class<input type="text" value="${escapeHtml(profile.className)}" data-action="profile-field" data-field="className" /></label>
        <label>Board<input type="text" value="${escapeHtml(profile.board)}" data-action="profile-field" data-field="board" /></label>
      </div>
      <div class="field-row">
        <label>Academic year<input type="text" value="${escapeHtml(profile.academicYear)}" data-action="profile-field" data-field="academicYear" /></label>
        <label>School / coaching<input type="text" value="${escapeHtml(profile.schoolName)}" data-action="profile-field" data-field="schoolName" /></label>
      </div>
      <label class="field-block">Board exam date (first ICSE 2027 paper)<input type="date" value="${settings.boardExamDate}" data-action="setting-field" data-field="boardExamDate" /></label>
      <label class="field-block">Daily study time available (minutes)<input type="number" min="30" step="15" value="${profile.dailyStudyMinutes}" data-action="profile-field" data-field="dailyStudyMinutes" /></label>
      <label class="field-block">Batch schedule notes<textarea rows="3" data-action="profile-field" data-field="batchScheduleNote">${escapeHtml(profile.batchScheduleNote)}</textarea></label>
      <button class="btn-ghost sm" data-action="reopen-onboarding">${iconEl("edit")}Redo setup wizard</button>
    </div>

    <div class="card settings-card">
      ${sectionHeader("About")}
      <div class="about-row">
        <img src="assets/logo.svg" class="about-logo" alt="VEDAMITRA" />
        <div><p style="font-weight:800;">VEDAMITRA</p><p class="muted">Your Personal AI Study Companion — built for ICSE 2027.</p></div>
      </div>
    </div>

    <div class="card settings-card">
      ${sectionHeader("Data")}
      <p class="muted">Everything is stored privately in this browser. Export a backup regularly.</p>
      <div class="settings-actions">
        <button class="btn-ghost sm" data-action="export-data">${iconEl("export")}Export backup (.json)</button>
        <label class="btn-ghost sm file-btn">${iconEl("plus")}Import backup<input type="file" accept="application/json" data-action="import-data" hidden /></label>
        <button class="btn-danger sm" data-action="reset-data">${iconEl("trash")}Reset all data</button>
      </div>
    </div>
  `;
}
