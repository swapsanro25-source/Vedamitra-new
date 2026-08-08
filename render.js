/**
 * VEDAMITRA — Rendering
 * -----------------------
 * Every view is a pure function of `App.getState()` that returns an HTML
 * string. `renderApp()` swaps #view-root's innerHTML on every state change
 * (App.subscribe). Interactivity is handled by a single delegated
 * click/change/submit listener in app.js reading `data-action` attributes —
 * no per-element listeners are attached here, so re-rendering is cheap and
 * there is nothing to "clean up".
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

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "subjects", label: "Subjects", icon: "subjects" },
  { id: "revision", label: "Revision", icon: "revision" },
  { id: "weekly-target", label: "Weekly Target", icon: "target" },
  { id: "homework", label: "Homework", icon: "homework" },
  { id: "exams", label: "Upcoming Exams", icon: "exams" },
  { id: "notes", label: "Notes", icon: "notes" },
  { id: "settings", label: "Settings", icon: "settings" },
];

// ---------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------
function renderShell() {
  const state = App.getState();
  const view = App.getView();
  return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <img src="assets/logo.svg" alt="VEDAMITRA" class="brand-logo" />
        <div class="brand-text">
          <span class="brand-name">VEDAMITRA</span>
          <span class="brand-tagline">AI Study Companion</span>
        </div>
      </div>
      <nav class="nav">
        ${NAV_ITEMS.map(
          (item) => `
          <button class="nav-item ${view === item.id ? "active" : ""}" data-action="navigate" data-view="${item.id}">
            ${iconEl(item.icon)}<span>${item.label}</span>
          </button>`
        ).join("")}
      </nav>
      <div class="sidebar-footer">
        ${examCountdownMini(state)}
      </div>
    </aside>
    <div class="scrim" data-action="close-sidebar"></div>
    <main class="main">
      <header class="topbar">
        <button class="icon-btn only-mobile" data-action="open-sidebar">${Icon.menu}</button>
        <h1 class="topbar-title">${NAV_ITEMS.find((n) => n.id === view)?.label || ""}</h1>
        <img src="assets/logo.svg" alt="" class="topbar-logo only-mobile" />
      </header>
      <div class="view-root" id="view-root">
        ${renderView(view)}
      </div>
    </main>
    <div class="modal-layer" id="modal-layer"></div>
  `;
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
    case "revision": return renderRevision();
    case "weekly-target": return renderWeeklyTargets();
    case "homework": return renderHomework();
    case "exams": return renderExams();
    case "notes": return renderNotes();
    case "settings": return renderSettings();
    default:
      if (view.startsWith("subject:")) return renderSubjectDetail(view.split(":")[1]);
      return renderDashboard();
  }
}

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
function renderDashboard() {
  const state = App.getState();
  const s = App.selectors;
  const overall = s.overallProgress();
  const dueToday = s.revisionsDueToday();
  const hwToday = s.todaysHomework();
  const exams = s.upcomingExams(3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = state.settings.studentName || "there";
  const plan = state.todayPlan.date === App.todayISO() ? state.todayPlan.tasks : null;
  const recentLog = s.recentlyStudied(4);

  return `
    <section class="greeting-card glass">
      <div>
        <p class="greeting-eyebrow">${greeting}</p>
        <h2 class="greeting-name">${escapeHtml(name)}</h2>
        <p class="greeting-sub">${overall.completed} of ${overall.total} chapters complete · ${overall.pct}% through the ICSE 2027 syllabus</p>
      </div>
      ${examCountdownCard(state)}
    </section>

    <div class="dash-grid">
      <section class="card glass span-2">
        ${sectionHeader("Today's AI Study Plan", `<button class="btn-ghost sm" data-action="generate-plan">${iconEl("sparkle")}Regenerate</button>`)}
        ${plan && plan.length ? renderPlanTasks(plan) : renderPlanEmpty()}
      </section>

      <section class="card glass">
        ${sectionHeader("Weekly Target")}
        ${renderWeeklyTargetSummary(state.weeklyTargets)}
      </section>

      <section class="card glass">
        ${sectionHeader("Overall Progress")}
        <div class="ring-wrap">
          ${progressRing(overall.pct)}
        </div>
        <p class="muted center">${overall.completed}/${overall.total} chapters</p>
      </section>

      <section class="card glass">
        ${sectionHeader("Revision Due", dueToday.length ? `<span class="count-badge">${dueToday.length}</span>` : "")}
        ${dueToday.length
          ? `<ul class="mini-list">${dueToday.slice(0, 4).map((r) => `
              <li>
                <span class="dot" style="background:${r.color}"></span>
                <span class="mini-list-text">${escapeHtml(r.subjectName)} · ${escapeHtml(r.chapterName)}</span>
                <button class="icon-btn xs" data-action="complete-revision" data-subject="${r.subjectId}" data-chapter="${r.chapterId}" data-index="${r.index}">${Icon.check}</button>
              </li>`).join("")}</ul>`
          : emptyState("check", "All caught up", "No revisions due today.")}
      </section>

      <section class="card glass">
        ${sectionHeader("Today's Homework", hwToday.length ? `<span class="count-badge">${hwToday.length}</span>` : "")}
        ${hwToday.length
          ? `<ul class="mini-list">${hwToday.map((h) => `
              <li>
                <span class="dot" style="background:var(--gold)"></span>
                <span class="mini-list-text">${escapeHtml(h.subject)} — ${escapeHtml(h.description)}</span>
                <button class="icon-btn xs" data-action="complete-homework" data-id="${h.id}">${Icon.check}</button>
              </li>`).join("")}</ul>`
          : emptyState("homework", "Nothing due today", "Add homework from the Homework tab.")}
      </section>

      <section class="card glass">
        ${sectionHeader("Upcoming Exams", `<button class="btn-ghost sm" data-action="navigate" data-view="exams">View all</button>`)}
        ${exams.length
          ? `<ul class="mini-list">${exams.map((e) => `
              <li>
                <span class="dot" style="background:var(--forest)"></span>
                <span class="mini-list-text">${escapeHtml(e.name)} · ${escapeHtml(e.subject)}</span>
                <span class="muted">${s.daysUntil(e.date)}d</span>
              </li>`).join("")}</ul>`
          : emptyState("exams", "No exams added", "Add your next exam to see the countdown.")}
      </section>

      <section class="card glass span-2">
        ${sectionHeader("Continue Studying")}
        ${recentLog.length ? renderContinueStudying(recentLog) : emptyState("book", "Start a chapter", "Open any subject and mark a chapter in progress.")}
      </section>

      <section class="card glass quick-actions">
        ${sectionHeader("Quick Actions")}
        <div class="qa-grid">
          <button class="qa-btn" data-action="navigate" data-view="subjects">${iconEl("subjects")}Subjects</button>
          <button class="qa-btn" data-action="open-add-homework">${iconEl("plus")}Homework</button>
          <button class="qa-btn" data-action="open-add-exam">${iconEl("plus")}Exam</button>
          <button class="qa-btn" data-action="open-add-note">${iconEl("plus")}Note</button>
        </div>
      </section>
    </div>
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
          <p class="plan-item-sub">${escapeHtml(t.task)} ${t.carriedOver ? '<span class="chip chip-high">Carried over</span>' : ""}</p>
        </div>
        <span class="muted">${t.duration}m</span>
      </li>`).join("")}
  </ul>`;
}

function renderPlanEmpty() {
  return `<div class="empty-state">
    ${iconEl("sparkle", "empty-icon")}
    <p class="empty-title">No plan generated yet</p>
    <p class="empty-subtitle">VEDAMITRA can build today's plan from your revisions, homework and weak chapters.</p>
    <button class="btn-primary sm" data-action="generate-plan">${iconEl("sparkle")}Generate Today's Plan</button>
  </div>`;
}

function renderWeeklyTargetSummary(targets) {
  if (!targets.length) return emptyState("target", "No target set", "Create a weekly target to track it here.");
  const t = targets[0];
  const pct = t.goal ? Math.min(100, Math.round((t.current / t.goal) * 100)) : 0;
  return `
    <p class="target-label">${escapeHtml(t.label)}</p>
    ${progressBar(pct)}
    <p class="muted">${t.current} / ${t.goal} · due ${formatDateShort(t.deadline)}</p>
  `;
}

function progressRing(pct) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return `
    <svg viewBox="0 0 100 100" class="ring">
      <circle cx="50" cy="50" r="${r}" class="ring-track" />
      <circle cx="50" cy="50" r="${r}" class="ring-fill" stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
      <text x="50" y="55" text-anchor="middle" class="ring-text">${pct}%</text>
    </svg>`;
}

function renderContinueStudying(logs) {
  return `<ul class="continue-list">
    ${logs.map((l) => {
      const subj = SUBJECTS.find((s) => s.id === l.subjectId);
      const ch = subj?.chapters.find((c) => c.id === l.chapterId);
      return `<li class="continue-item" data-action="navigate" data-view="subject:${l.subjectId}">
        <span class="dot" style="background:${subj?.color}"></span>
        <div class="continue-body">
          <p>${escapeHtml(subj?.name || "")} — ${escapeHtml(ch?.name || "")}</p>
          <p class="muted">${formatDateShort(l.date)} · ${l.minutes}m logged</p>
        </div>
        ${iconEl("chevronRight")}
      </li>`;
    }).join("")}
  </ul>`;
}

// ---------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------
function renderSubjects() {
  return `
    <div class="subject-grid">
      ${SUBJECTS.map((s) => {
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
  const nextRevision = (chapter.revisionSchedule || []).find((r) => !r.done);
  return `
    <details class="chapter-card glass status-${chapter.status}">
      <summary>
        <span class="status-dot"></span>
        <span class="chapter-name">${escapeHtml(chapterMeta.name)}</span>
        <span class="chip chip-status">${statusLabel}</span>
        ${iconEl("chevronRight", "summary-caret")}
      </summary>
      <div class="chapter-body">
        <div class="status-toggle" role="group">
          ${["not-started", "in-progress", "completed"].map(
            (st) => `<button class="status-btn ${chapter.status === st ? "active" : ""}" data-action="set-chapter-status" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-status="${st}">${{ "not-started": "Not Started", "in-progress": "In Progress", completed: "Completed" }[st]}</button>`
          ).join("")}
        </div>

        <div class="check-grid">
          ${["theory", "exercises", "revision", "pyqs"].map(
            (field) => `<label class="check-pill">
              <input type="checkbox" data-action="toggle-chapter-field" data-subject="${subject.id}" data-chapter="${chapterMeta.id}" data-field="${field}" ${chapter[field] ? "checked" : ""} />
              <span>${field[0].toUpperCase() + field.slice(1)}</span>
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

        <div class="chapter-footer">
          <span class="muted">${chapter.studyMinutes || 0} min studied</span>
          <button class="btn-ghost sm" data-action="log-time" data-subject="${subject.id}" data-chapter="${chapterMeta.id}">${iconEl("clock")}Log 25 min</button>
        </div>

        ${chapter.status === "completed" ? renderRevisionMini(subject, chapterMeta, chapter) : ""}
      </div>
    </details>
  `;
}

function renderRevisionMini(subject, chapterMeta, chapter) {
  if (!chapter.revisionSchedule?.length) return "";
  return `<div class="revision-mini">
    <p class="muted">Revision schedule</p>
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
      <li>
        <span class="dot" style="background:${r.color}"></span>
        <div class="revision-row-body">
          <p>${escapeHtml(r.subjectName)} — ${escapeHtml(r.chapterName)}</p>
          <p class="muted">${r.label} · ${formatDateLong(r.date)}</p>
        </div>
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
    <div class="list-header">
      <button class="btn-primary sm" data-action="open-add-target">${iconEl("plus")}New Target</button>
    </div>
    ${targets.length ? `<div class="target-grid">${targets.map(renderTargetCard).join("")}</div>` : emptyState("target", "No weekly targets yet", "Set a target like \u201cComplete 5 chapters\u201d to stay on track.")}
  `;
}

function renderTargetCard(t) {
  const pct = t.goal ? Math.min(100, Math.round((t.current / t.goal) * 100)) : 0;
  return `<div class="card glass target-card">
    <div class="target-card-top">
      <h4>${escapeHtml(t.label)}</h4>
      <button class="icon-btn xs" data-action="delete-target" data-id="${t.id}">${Icon.trash}</button>
    </div>
    ${progressBar(pct)}
    <div class="target-card-foot">
      <span>${t.current} / ${t.goal}</span>
      <span class="muted">by ${formatDateShort(t.deadline)}</span>
    </div>
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
      <div class="tabs">
        ${tabs.map((t) => `<button class="tab ${t.key === active ? "active" : ""}" data-action="set-hw-tab" data-tab="${t.key}">${t.label}${t.items.length ? ` <span class="tab-count">${t.items.length}</span>` : ""}</button>`).join("")}
      </div>
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
    <div class="list-header">
      <button class="btn-primary sm" data-action="open-add-exam">${iconEl("plus")}Add Exam</button>
    </div>
    ${exams.length ? `<ul class="task-rows">${exams.map(renderExamRow).join("")}</ul>` : emptyState("exams", "No exams added", "Add your upcoming exams to track the countdown.")}
  `;
}

function renderExamRow(e) {
  const days = App.selectors.daysUntil(e.date);
  return `<li class="task-row">
    <div class="exam-days">${days}<span>days</span></div>
    <div class="task-row-body">
      <p>${escapeHtml(e.name)} <span class="muted">· ${escapeHtml(e.subject)}</span></p>
      <p class="muted">${formatDateLong(e.date)}</p>
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
      <div class="search-box">
        ${iconEl("search")}
        <input type="search" placeholder="Search notes…" value="${escapeHtml(state._noteQuery || "")}" data-action="search-notes" />
      </div>
      <button class="btn-primary sm" data-action="open-add-note">${iconEl("plus")}New Note</button>
    </div>
    ${notes.length ? `<div class="notes-grid">${notes.map(renderNoteCard).join("")}</div>` : emptyState("notes", "No notes yet", "Capture a quick note against any subject or chapter.")}
  `;
}

function renderNoteCard(n) {
  const subj = SUBJECTS.find((s) => s.id === n.subject);
  return `<div class="note-card glass ${n.pinned ? "pinned" : ""}">
    <div class="note-card-top">
      <span class="chip chip-status">${escapeHtml(subj?.name || "General")}</span>
      <button class="icon-btn xs ${n.pinned ? "active" : ""}" data-action="toggle-pin-note" data-id="${n.id}">${Icon.pin}</button>
    </div>
    <h4>${escapeHtml(n.title)}</h4>
    <p class="note-body">${escapeHtml(n.body)}</p>
    <div class="note-card-foot">
      <button class="icon-btn xs" data-action="open-edit-note" data-id="${n.id}">${Icon.edit}</button>
      <button class="icon-btn xs" data-action="delete-note" data-id="${n.id}">${Icon.trash}</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------
function renderSettings() {
  const { settings } = App.getState();
  return `
    <section class="card glass settings-card">
      ${sectionHeader("Profile")}
      <label class="field-block">Your name
        <input type="text" value="${escapeHtml(settings.studentName)}" data-action="setting-field" data-field="studentName" placeholder="e.g. Aarav" />
      </label>
      <label class="field-block">Board exam date (first ICSE 2027 paper)
        <input type="date" value="${settings.boardExamDate}" data-action="setting-field" data-field="boardExamDate" />
      </label>
      <label class="field-block">Daily study time available (minutes)
        <input type="number" min="30" step="15" value="${settings.dailyStudyMinutes}" data-action="setting-field" data-field="dailyStudyMinutes" />
      </label>
    </section>

    <section class="card glass settings-card">
      ${sectionHeader("About")}
      <div class="about-row">
        <img src="assets/logo.svg" class="about-logo" alt="VEDAMITRA" />
        <div>
          <p class="brand-name">VEDAMITRA</p>
          <p class="muted">Your Personal AI Study Companion — built for ICSE 2027.</p>
        </div>
      </div>
    </section>

    <section class="card glass settings-card">
      ${sectionHeader("Data")}
      <p class="muted">Everything is stored privately in this browser. Export a backup regularly.</p>
      <div class="settings-actions">
        <button class="btn-ghost sm" data-action="export-data">${iconEl("export")}Export backup (.json)</button>
        <label class="btn-ghost sm file-btn">${iconEl("plus")}Import backup
          <input type="file" accept="application/json" data-action="import-data" hidden />
        </label>
        <button class="btn-danger sm" data-action="reset-data">${iconEl("trash")}Reset all data</button>
      </div>
    </section>
  `;
}
