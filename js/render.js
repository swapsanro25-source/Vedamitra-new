/**
 * VEDAMITRA 2.0 — Rendering
 * ---------------------------
 * Every view is a pure function of `App.getState()` that returns an HTML
 * string. `renderApp()` swaps #app-root's innerHTML on every state change.
 * Interactivity is handled by delegated listeners in app.js reading
 * `data-action` attributes.
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

// Independent, persistent chapter checklist items. Each is its own boolean
// field on the chapter object — ticking one never affects the others.
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
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "subjects", label: "Subjects", icon: "subjects" },
  { id: "batch", label: "Batch Classes", icon: "cap" },
  { id: "revision", label: "Revision", icon: "revision" },
  { id: "weekly-target", label: "Weekly Target", icon: "target" },
  { id: "homework", label: "Homework", icon: "homework" },
  { id: "exams", label: "Upcoming Exams", icon: "exams" },
  { id: "notes", label: "Notes", icon: "notes" },
  { id: "resources", label: "Resources", icon: "compass" },
  { id: "settings", label: "Settings", icon: "settings" },
];
const BOTTOM_NAV_ITEMS = ["dashboard", "subjects", "batch", "homework"];

// ---------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------
function renderShell() {
  const state = App.getState();
  if (!state.onboarded) return renderOnboarding();

  const view = App.getView();
  return `
    <div class="app-shell">
      <header class="topbar-new">
        <div class="brand-mini">
          <img src="assets/logo.svg" alt="VEDAMITRA" />
          <span>VEDAMITRA</span>
        </div>
        <nav class="top-nav only-wide">
          ${NAV_ITEMS.map(
            (item) => `
            <button class="top-nav-item ${view === item.id ? "active" : ""}" data-action="navigate" data-view="${item.id}">
              ${iconEl(item.icon)}<span>${item.label}</span>
            </button>`
          ).join("")}
        </nav>
        <div class="topbar-right">
          ${examCountdownMini(state)}
          <button class="icon-btn only-narrow" data-action="open-more">${Icon.menu}</button>
        </div>
      </header>
      <main class="main">
        <div class="view-root" id="view-root">${renderView(view)}</div>
        ${renderBottomNav(view)}
      </main>
      <div class="modal-layer" id="modal-layer"></div>
    </div>
  `;
}

function renderMoreSheet(view) {
  const rest = NAV_ITEMS.filter((n) => !BOTTOM_NAV_ITEMS.includes(n.id));
  return `
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

function renderBottomNav(view) {
  return `<nav class="bottom-nav only-narrow">
    ${BOTTOM_NAV_ITEMS.map((id) => {
      const item = NAV_ITEMS.find((n) => n.id === id);
      return `<button class="bottom-nav-item ${view === id ? "active" : ""}" data-action="navigate" data-view="${id}">
        ${iconEl(item.icon)}<span>${item.label.split(" ")[0]}</span>
      </button>`;
    }).join("")}
    <button class="bottom-nav-item" data-action="open-more">${iconEl("menu")}<span>More</span></button>
  </nav>`;
}

function examCountdownMini(state) {
  const exams = App.selectors.upcomingExams(1);
  if (!exams.length) return "";
  const days = App.selectors.daysUntil(exams[0].date);
  return `<div class="mini-countdown">
    <span class="mini-countdown-label">Next Exam</span>
    <span class="mini-countdown-days">${days}d</span>
    <span class="mini-countdown-name">${escapeHtml(exams[0].name)}</span>
  </div>`;
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
  state._onboardingDraft = draft; // keep reference stable across re-renders

  return `
    <div class="onboarding">
      <div class="onboarding-card glass">
        <div class="onboarding-brand">
          <img src="assets/logo.svg" alt="VEDAMITRA" />
          <span>VEDAMITRA</span>
        </div>
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
      ${obNav(0, true)}
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
      ${obNav(1, true)}
    `;
  }
  if (step === 2) {
    return `
      <h2>Your batch</h2>
      <p class="muted">Optional — note your coaching/batch schedule. You can add individual classes and lecture counts anytime from Batch Classes and each Subject page.</p>
      <label class="field-block">Batch schedule notes<textarea rows="4" data-ob-field="batchScheduleNote" placeholder="e.g. Physics batch — Mon/Wed/Fri 6-7pm">${escapeHtml(d.batchScheduleNote)}</textarea></label>
      ${obNav(2, true)}
    `;
  }
  if (step === 3) {
    return `
      <h2>Upcoming tests</h2>
      <p class="muted">Add any exams you already know about. You can add more later from Upcoming Exams.</p>
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
      ${obNav(3, false)}
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
      ${obNav(4, true)}
    `;
  }
  // step 5 — finish
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

function obNav(step, showNext) {
  return `<div class="modal-actions">
    ${step > 0 ? `<button type="button" class="btn-ghost sm" data-action="ob-back">${iconEl("chevronLeft")}Back</button>` : "<span></span>"}
    <button type="button" class="btn-primary sm" data-action="ob-next">Continue${iconEl("chevronRight")}</button>
  </div>`;
}

// ---------------------------------------------------------------------
// Dashboard — redesigned hierarchy with progressive disclosure
// ---------------------------------------------------------------------
function renderDashboard() {
  const state = App.getState();
  const s = App.selectors;
  const overall = s.overallProgress();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = state.profile.studentName || "there";
  const plan = state.todayPlan.date === App.todayISO() ? state.todayPlan.tasks : null;
  const batchToday = s.todaysBatchClasses();
  const hwToday = s.todaysHomework();
  const dueRevisions = s.revisionsDueToday();
  const exams = s.upcomingExams(2);

  return `
    <section class="greeting-card glass">
      <div>
        <p class="greeting-eyebrow">${greeting}</p>
        <h2 class="greeting-name">${escapeHtml(name)}</h2>
        <p class="greeting-sub">Your study overview for today</p>
      </div>
      ${examCountdownCard(state)}
    </section>

    <section class="card glass">
      ${sectionHeader("Today's Study Plan", `<button class="btn-ghost sm" data-action="generate-plan">${iconEl("sparkle")}Regenerate</button>`)}
      ${plan && plan.length ? renderPlanTasks(plan) : renderPlanEmpty()}
    </section>

    <section class="card glass">
      ${sectionHeader("Today's Batch Classes", `<button class="btn-ghost sm" data-action="navigate" data-view="batch">${iconEl("plus")}Manage</button>`)}
      ${batchToday.length ? renderBatchRows(batchToday) : emptyState("cap", "No classes today", "Add today's batch schedule from Batch Classes.")}
    </section>

    <div class="dash-grid-2">
      <section class="card glass">
        ${sectionHeader("Pending Homework", hwToday.length ? `<span class="count-badge">${hwToday.length}</span>` : "")}
        ${hwToday.length
          ? `<ul class="mini-list">${hwToday.map((h) => `
              <li><span class="dot" style="background:var(--gold)"></span>
                <span class="mini-list-text">${escapeHtml(h.subject)} — ${escapeHtml(h.description)}</span>
                <button class="icon-btn xs" data-action="complete-homework" data-id="${h.id}">${Icon.check}</button></li>`).join("")}</ul>`
          : emptyState("homework", "Nothing due today", "")}
      </section>
      <section class="card glass">
        ${sectionHeader("Revision Due", dueRevisions.length ? `<span class="count-badge">${dueRevisions.length}</span>` : "")}
        ${dueRevisions.length
          ? `<ul class="mini-list">${dueRevisions.slice(0, 4).map((r) => `
              <li><span class="dot" style="background:${r.color}"></span>
                <span class="mini-list-text">${escapeHtml(r.subjectName)} · ${escapeHtml(r.chapterName)}</span>
                <button class="icon-btn xs" data-action="complete-revision" data-subject="${r.subjectId}" data-chapter="${r.chapterId}" data-index="${r.index}">${Icon.check}</button></li>`).join("")}</ul>`
          : emptyState("check", "All caught up", "")}
      </section>
    </div>

    <section class="card glass">
      ${sectionHeader("Upcoming Test / Exam", `<button class="btn-ghost sm" data-action="navigate" data-view="exams">View all</button>`)}
      ${exams.length
        ? `<ul class="mini-list">${exams.map((e) => `
            <li><span class="dot" style="background:var(--forest)"></span>
              <span class="mini-list-text">${escapeHtml(e.name)} · ${escapeHtml(e.subject)} <span class="muted">(${escapeHtml(e.type || "Exam")})</span></span>
              <span class="muted">${s.daysUntil(e.date)}d</span></li>`).join("")}</ul>`
        : emptyState("exams", "No exams added", "")}
    </section>

    <details class="card glass disclosure">
      <summary>${sectionHeader("Weekly Target")}</summary>
      ${renderWeeklyTargetSummary(state.weeklyTargets)}
    </details>

    <details class="card glass disclosure">
      <summary>${sectionHeader("Subject Progress", `<span class="muted">${overall.pct}% overall</span>`)}</summary>
      <div class="subject-progress-list">
        ${SUBJECTS.filter((s2) => state.profile.subjects.includes(s2.id)).map((s2) => {
          const p = s.subjectProgress(s2.id);
          return `<div class="subject-progress-row" data-action="navigate" data-view="subject:${s2.id}">
            <span class="dot" style="background:${s2.color}"></span>
            <span class="subject-progress-name">${escapeHtml(s2.name)}</span>
            ${progressBar(p.pct, s2.color)}
            <span class="muted">${p.pct}%</span>
          </div>`;
        }).join("")}
      </div>
    </details>

    <section class="card glass quick-actions">
      ${sectionHeader("Quick Actions")}
      <div class="qa-grid">
        <button class="qa-btn" data-action="open-add-batch">${iconEl("plus")}Batch Class</button>
        <button class="qa-btn" data-action="open-add-homework">${iconEl("plus")}Homework</button>
        <button class="qa-btn" data-action="open-add-exam">${iconEl("plus")}Exam</button>
        <button class="qa-btn" data-action="open-add-note">${iconEl("plus")}Note</button>
      </div>
    </section>
  `;
}

function examCountdownCard(state) {
  const exams = App.selectors.upcomingExams(1);
  if (!exams.length) {
    return `<div class="countdown-pill muted">${state.settings.boardExamDate ? `Boards in ${App.selectors.daysUntil(state.settings.boardExamDate)} days` : "Add your board exam date in Settings"}</div>`;
  }
  const days = App.selectors.daysUntil(exams[0].date);
  return `<div class="countdown-pill"><span class="countdown-num">${days}</span><span>days to ${escapeHtml(exams[0].name)}</span></div>`;
}

function renderPlanTasks(tasks) {
  return `<ul class="plan-list">
    ${tasks.map((t, i) => `
      <li class="plan-item ${t.done ? "done" : ""}">
        <button class="check-circle" data-action="toggle-plan-task" data-index="${i}">${t.done ? Icon.check : ""}</button>
        <div class="plan-item-body">
          <p class="plan-item-title">${escapeHtml(t.subject)} — ${escapeHtml(t.chapter)}</p>
          <p class="plan-item-sub"><span class="chip chip-type">${escapeHtml(t.type || "")}</span> ${escapeHtml(t.task)} ${t.carriedOver ? '<span class="chip chip-high">Carried over</span>' : ""}</p>
        </div>
        <span class="muted">${t.duration}m</span>
      </li>`).join("")}
  </ul>`;
}
function renderPlanEmpty() {
  return `<div class="empty-state">
    ${iconEl("sparkle", "empty-icon")}
    <p class="empty-title">No plan generated yet</p>
    <p class="empty-subtitle">VEDAMITRA can build today's plan from batch classes, revisions, homework and weak chapters.</p>
    <button class="btn-primary sm" data-action="generate-plan">${iconEl("sparkle")}Generate Today's Plan</button>
  </div>`;
}
function renderWeeklyTargetSummary(targets) {
  if (!targets.length) return emptyState("target", "No target set", "Create a weekly target from the Weekly Target tab.");
  return `<div class="target-grid compact">${targets.slice(0, 3).map(renderTargetCard).join("")}</div>`;
}
function progressRing(pct) {
  const r = 42, c = 2 * Math.PI * r, offset = c - (pct / 100) * c;
  return `<svg viewBox="0 0 100 100" class="ring">
      <circle cx="50" cy="50" r="${r}" class="ring-track" />
      <circle cx="50" cy="50" r="${r}" class="ring-fill" stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
      <text x="50" y="55" text-anchor="middle" class="ring-text">${pct}%</text>
    </svg>`;
}

// ---------------------------------------------------------------------
// Batch Classes
// ---------------------------------------------------------------------
function renderBatch() {
  const today = App.selectors.todaysBatchClasses();
  const upcoming = App.selectors.upcomingBatchClasses(20);
  return `
    <div class="list-header">
      <button class="btn-primary sm" data-action="open-add-batch">${iconEl("plus")}Add Class</button>
    </div>
    <section class="card glass">
      ${sectionHeader("Today")}
      ${today.length ? renderBatchRows(today, true) : emptyState("cap", "No classes today", "Add today's batch lecture to see it here.")}
    </section>
    <section class="card glass">
      ${sectionHeader("Upcoming")}
      ${upcoming.length ? renderBatchRows(upcoming, true) : emptyState("calendar", "Nothing scheduled", "Add upcoming batch classes to plan ahead.")}
    </section>
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
function renderSubjects() {
  const state = App.getState();
  const active = SUBJECTS.filter((s) => state.profile.subjects.includes(s.id));
  return `
    <div class="subject-grid">
      ${active.map((s) => {
        const p = App.selectors.subjectProgress(s.id);
        return `
        <button class="subject-card glass" data-action="navigate" data-view="subject:${s.id}" style="--accent:${s.color}">
          <div class="subject-card-top">
            <span class="subject-dot" style="background:${s.color}"></span>
            <span class="muted">${p.completed}/${p.total}</span>
          </div>
          <h3>${escapeHtml(s.name)}</h3>
          ${progressBar(p.pct, s.color)}
          <p class="muted subject-card-foot">${p.pct}% complete</p>
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
    <section class="subject-header glass" style="--accent:${subject.color}">
      <div>
        <h2>${escapeHtml(subject.name)}</h2>
        <p class="muted">${p.completed} of ${p.total} chapters completed</p>
      </div>
      <div class="ring-wrap sm">${progressRing(p.pct)}</div>
    </section>
    <div class="chapter-list">
      ${subject.chapters.map((c) => renderChapterCard(subject, c, state.subjects[subjectId].chapters[c.id])).join("")}
    </div>
  `;
}

function renderChapterCard(subject, chapterMeta, chapter) {
  const statusLabel = { "not-started": "Not Started", "in-progress": "In Progress", completed: "Completed" }[chapter.status];
  const lecP = App.selectors.lectureProgress(subject.id, chapterMeta.id);
  const dppP = App.selectors.dppProgress(subject.id, chapterMeta.id);
  const nextRevision = (chapter.revisionSchedule || []).find((r) => !r.done);
  const openKey = subject.id + ":" + chapterMeta.id;
  const isOpen = !!(App.getState()._openChapters || {})[openKey];

  return `
    <details class="chapter-card surface status-${chapter.status}" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" ${isOpen ? "open" : ""}>
      <summary>
        <span class="status-dot"></span>
        <span class="chapter-name">${escapeHtml(chapterMeta.name)}</span>
        <span class="chip-row">
          ${lecP.total ? `<span class="chip chip-status">Lec ${lecP.completed}/${lecP.total}</span>` : ""}
          ${dppP.total ? `<span class="chip chip-status">DPP ${dppP.completed}/${dppP.total}</span>` : ""}
          <span class="chip chip-status">${statusLabel}</span>
        </span>
        ${iconEl("chevronRight", "summary-caret")}
      </summary>
      <div class="chapter-body">
        <div class="status-toggle" role="group">
          ${["not-started", "in-progress", "completed"].map(
            (st) => `<button class="status-btn ${chapter.status === st ? "active" : ""}" data-action="set-chapter-status" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-status="${st}">${{ "not-started": "Not Started", "in-progress": "In Progress", completed: "Completed" }[st]}</button>`
          ).join("")}
        </div>

        <div class="chapter-section">
          <p class="chapter-section-title">${iconEl("cap")}Lectures <span class="muted">${lecP.completed}/${lecP.total}</span></p>
          <div class="lecture-count-row">
            <label class="muted">Lectures in batch
              <input type="number" min="0" max="60" value="${lecP.total}" data-action="set-lecture-count" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" />
            </label>
          </div>
          ${lecP.total ? `<div class="lecture-grid">
            ${chapter.lectures.map((l, i) => `
              <button class="lecture-pill ${l.completed ? "done" : ""}" data-action="toggle-lecture" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">
                ${l.completed ? Icon.check : ""} L${i + 1}
              </button>`).join("")}
          </div>` : `<p class="muted">Set the lecture count above once your batch tells you how many lectures this chapter has.</p>`}
        </div>

        <div class="chapter-section">
          <p class="chapter-section-title">${iconEl("layers")}DPP <span class="muted">${dppP.completed}/${dppP.total}</span></p>
          ${chapter.dpps && chapter.dpps.length ? `<div class="dpp-list">
            ${chapter.dpps.map((d, i) => `
              <div class="dpp-row">
                <button class="check-circle ${d.status === "completed" ? "checked" : ""}" data-action="toggle-dpp" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">${d.status === "completed" ? Icon.check : ""}</button>
                <span class="dpp-label">DPP ${i + 1}</span>
                <input type="number" class="dpp-score" placeholder="Score" value="${d.score ?? ""}" data-action="set-dpp-score" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}" />
                <button class="icon-btn xs" data-action="delete-dpp" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">${Icon.trash}</button>
              </div>`).join("")}
          </div>` : `<p class="muted">No DPPs added yet.</p>`}
          <button class="btn-ghost xs" data-action="add-dpp" data-subject="${subject.id}" data-chapter="${chapterMeta.id}">${iconEl("plus")}Add DPP</button>
        </div>

        <div class="chapter-section">
          <p class="chapter-section-title">${iconEl("book")}Theory &amp; Practice</p>
          <div class="check-grid">
            ${CHAPTER_CHECK_FIELDS.map(
              ([field, label]) => `<label class="check-pill">
                <input type="checkbox" data-action="toggle-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="${field}" ${chapter[field] ? "checked" : ""} />
                <span>${label}</span>
              </label>`
            ).join("")}
          </div>
          <div class="field-row">
            <label>Confidence
              <input type="range" min="1" max="5" value="${chapter.confidence}" data-action="set-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="confidence" data-numeric="1" />
            </label>
            <label>Difficulty
              <select data-action="set-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="difficulty">
                ${["Easy", "Medium", "Hard"].map((d) => `<option ${chapter.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}
              </select>
            </label>
          </div>
          <label class="field-block">Mistakes / things to revisit
            <textarea data-action="set-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="mistakes" rows="2" placeholder="e.g. sign errors in factorisation">${escapeHtml(chapter.mistakes)}</textarea>
          </label>
        </div>

        <div class="chapter-footer">
          <span class="muted">${chapter.studyMinutes || 0} min studied</span>
          <button class="btn-ghost sm" data-action="log-time" data-subject="${subject.id}" data-chapter="${chapterMeta.id}">${iconEl("clock")}Log 25 min</button>
        </div>

        ${chapter.status === "completed" ? renderRevisionMini(subject, chapterMeta, chapter, nextRevision) : ""}
      </div>
    </details>
  `;
}

function renderRevisionMini(subject, chapterMeta, chapter, nextRevision) {
  if (!chapter.revisionSchedule?.length) return "";
  return `<div class="revision-mini">
    <p class="muted">Revision schedule ${nextRevision ? `· next: ${formatDateShort(nextRevision.date)}` : "· all done"}</p>
    <div class="revision-chips">
      ${chapter.revisionSchedule.map((r, i) => `
        <button class="rev-chip ${r.done ? "done" : ""}" data-action="complete-revision" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-index="${i}">
          ${r.label} · ${formatDateShort(r.date)} ${r.done ? "✓" : ""}
        </button>`).join("")}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// Revision
// ---------------------------------------------------------------------
function renderRevision() {
  const due = App.selectors.revisionsDueToday();
  const upcoming = App.selectors.upcomingRevisions(21);
  return `
    <section class="card glass">
      ${sectionHeader("Due Today", due.length ? `<span class="count-badge">${due.length}</span>` : "")}
      ${due.length ? renderRevisionRows(due) : emptyState("check", "Nothing due", "You're fully caught up on revisions today.")}
    </section>
    <section class="card glass">
      ${sectionHeader("Upcoming (next 21 days)")}
      ${upcoming.length ? renderRevisionRows(upcoming) : emptyState("revision", "Nothing scheduled", "Complete chapters to build your revision queue.")}
    </section>
  `;
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
    <div class="list-header"><button class="btn-primary sm" data-action="open-add-target">${iconEl("plus")}New Target</button></div>
    ${targets.length ? `<div class="target-grid">${targets.map(renderTargetCard).join("")}</div>` : emptyState("target", "No weekly targets yet", "Set a target like \u201cComplete 5 chapters\u201d to stay on track.")}
  `;
}
function renderTargetCard(t) {
  const pct = t.goal ? Math.min(100, Math.round((t.current / t.goal) * 100)) : 0;
  return `<div class="card glass target-card">
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
    <div class="list-header"><button class="btn-primary sm" data-action="open-add-exam">${iconEl("plus")}Add Exam</button></div>
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
  return `<div class="note-card glass ${n.pinned ? "pinned" : ""}">
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
    <section class="card glass">
      ${sectionHeader("Official CISCE Resources")}
      <div class="resource-rows">
        ${Object.values(RESOURCES).map((r) => `
          <a class="resource-row" href="${r.url}" target="_blank" rel="noopener noreferrer">
            <div>
              <p class="resource-title">${escapeHtml(r.label)} <span class="chip chip-info">Official</span></p>
              <p class="muted">${escapeHtml(r.note)}</p>
            </div>
            ${iconEl("external")}
          </a>`).join("")}
      </div>
    </section>
    <section class="card glass">
      ${sectionHeader("AI Paper Generator")}
      ${AI_PAPER_GENERATOR_URL
        ? `<p class="muted">Opens your configured AI-based paper generator in a new tab.</p>
           <a class="btn-primary sm" href="${AI_PAPER_GENERATOR_URL}" target="_blank" rel="noopener noreferrer">${iconEl("sparkle")}Open AI Paper Generator</a>`
        : `<div class="empty-state">${iconEl("sparkle", "empty-icon")}
             <p class="empty-title">Not configured yet</p>
             <p class="empty-subtitle">Set AI_PAPER_GENERATOR_URL in js/data.js to your Gemini-based generator link. No API key needed here — it's just a link-out.</p>
           </div>`}
    </section>
  `;
}

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------
function renderSettings() {
  const { profile, settings } = App.getState();
  return `
    <section class="card glass settings-card">
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
    </section>

    <section class="card glass settings-card">
      ${sectionHeader("About")}
      <div class="about-row">
        <img src="assets/logo.svg" class="about-logo" alt="VEDAMITRA" />
        <div><p class="brand-name">VEDAMITRA</p><p class="muted">Your Personal AI Study Companion — built for ICSE 2027.</p></div>
      </div>
    </section>

    <section class="card glass settings-card">
      ${sectionHeader("Data")}
      <p class="muted">Everything is stored privately in this browser. Export a backup regularly.</p>
      <div class="settings-actions">
        <button class="btn-ghost sm" data-action="export-data">${iconEl("export")}Export backup (.json)</button>
        <label class="btn-ghost sm file-btn">${iconEl("plus")}Import backup<input type="file" accept="application/json" data-action="import-data" hidden /></label>
        <button class="btn-danger sm" data-action="reset-data">${iconEl("trash")}Reset all data</button>
      </div>
    </section>
  `;
}
