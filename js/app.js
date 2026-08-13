/**
 * VEDAMITRA 2.0 — App bootstrap & interactivity
 * --------------------------------------------
 * One delegated listener per event type reads `data-action` off the
 * clicked/changed element and dispatches to a handler below.
 */

/**
 * VEDAMITRA 2.0 — App bootstrap & interactivity
 * --------------------------------------------
 * One delegated listener per event type reads `data-action` off the
 * clicked/changed element and dispatches to a handler below.
 *
 * WHY CHAPTERS USED TO COLLAPSE (fixed below):
 * Every state change causes a full innerHTML rebuild of #app-root (there's
 * no virtual DOM / diffing here — see render.js). A freshly-built <details>
 * element always starts closed, so editing anything inside an open chapter
 * (a checkbox, the confidence slider, lecture count, a DPP score) rebuilt
 * the page and the chapter you were editing snapped shut — which reads as
 * "got sent back to the main page" even though you never left the subject
 * view. The fix has two parts: (1) `_openChapters` below remembers which
 * chapter <details> are open across rebuilds, independent of localStorage,
 * and render.js re-applies `open` to the right ones; (2) scroll position is
 * saved/restored around every rebuild that isn't an explicit navigation.
 */

function renderApp() {
  const root = document.getElementById("app-root");
  const scrollY = window.scrollY;
  root.innerHTML = renderShell();
  if (!App._justNavigated) window.scrollTo(0, scrollY);
  App._justNavigated = false;
}

// Remembers which chapter <details> are expanded across re-renders. Never
// written to localStorage — purely a same-session UI convenience.
document.addEventListener(
  "toggle",
  (e) => {
    const el = e.target;
    if (!el.classList || !el.classList.contains("chapter-card")) return;
    const state = App.getState();
    state._openChapters = state._openChapters || {};
    state._openChapters[el.dataset.subject + ":" + el.dataset.chapter] = el.open;
  },
  true // 'toggle' does not bubble in all browsers — must listen on capture
);

function closeModal() {
  document.getElementById("modal-layer").innerHTML = "";
}
function openModal(html) {
  document.getElementById("modal-layer").innerHTML = `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal glass" data-stop>${html}</div>
    </div>`;
}

// ---------------------------------------------------------------------
// Modal forms
// ---------------------------------------------------------------------
function subjectOptions(selected) {
  return SUBJECTS.map((s) => `<option value="${s.id}" ${selected === s.id ? "selected" : ""}>${s.name}</option>`).join("");
}
function subjectNameOptions(selected) {
  return SUBJECTS.map((s) => `<option value="${s.name}" ${selected === s.name ? "selected" : ""}>${s.name}</option>`).join("");
}
function chapterNameOptions(subjectName, selected) {
  const subj = SUBJECTS.find((s) => s.name === subjectName) || SUBJECTS[0];
  return subj.chapters.map((c) => `<option value="${c.name}" ${selected === c.name ? "selected" : ""}>${c.name}</option>`).join("");
}

function openAddHomeworkModal() {
  openModal(`
    <h3>Add Homework</h3>
    <form data-action="submit-homework">
      <label class="field-block">Subject<select name="subject" required>${subjectNameOptions()}</select></label>
      <label class="field-block">Description<input name="description" required placeholder="e.g. Solve Ex 6B, Q1-10" /></label>
      <label class="field-block">Due date<input type="date" name="dueDate" required value="${App.todayISO()}" /></label>
      <label class="field-block">Priority<select name="priority">${PRIORITY_LEVELS.map((p) => `<option ${p === "Medium" ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <div class="modal-actions">
        <button type="button" class="btn-ghost sm" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn-primary sm">Add Homework</button>
      </div>
    </form>`);
}

function openAddExamModal() {
  openModal(`
    <h3>Add Exam</h3>
    <form data-action="submit-exam">
      <label class="field-block">Exam name<input name="name" required placeholder="e.g. Mid-term" /></label>
      <div class="field-row">
        <label>Subject<select name="subject" required>${subjectNameOptions()}</select></label>
        <label>Type<select name="type">${EXAM_TYPES.map((t) => `<option>${t}</option>`).join("")}</select></label>
      </div>
      <label class="field-block">Date<input type="date" name="date" required /></label>
      <label class="field-block">Important chapters (optional)<input name="importantChapters" placeholder="e.g. Quadratic Equations, Circles" /></label>
      <label class="field-block">Priority<select name="priority">${PRIORITY_LEVELS.map((p) => `<option ${p === "High" ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <div class="modal-actions">
        <button type="button" class="btn-ghost sm" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn-primary sm">Add Exam</button>
      </div>
    </form>`);
}

function openAddNoteModal(existing) {
  openModal(`
    <h3>${existing ? "Edit Note" : "New Note"}</h3>
    <form data-action="submit-note" data-id="${existing?.id || ""}">
      <label class="field-block">Subject<select name="subject">${subjectOptions(existing?.subject)}</select></label>
      <label class="field-block">Title<input name="title" required value="${escapeHtml(existing?.title || "")}" /></label>
      <label class="field-block">Note<textarea name="body" rows="5" required>${escapeHtml(existing?.body || "")}</textarea></label>
      <div class="modal-actions">
        <button type="button" class="btn-ghost sm" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn-primary sm">${existing ? "Save" : "Add Note"}</button>
      </div>
    </form>`);
}

function openAddTargetModal() {
  openModal(`
    <h3>New Weekly Target</h3>
    <form data-action="submit-target">
      <label class="field-block">Label<input name="label" required placeholder="e.g. Complete 5 chapters" /></label>
      <label class="field-block">Goal (number)<input type="number" name="goal" min="1" required value="5" /></label>
      <label class="field-block">Deadline<input type="date" name="deadline" required /></label>
      <div class="modal-actions">
        <button type="button" class="btn-ghost sm" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn-primary sm">Create Target</button>
      </div>
    </form>`);
}

function openAddBatchModal() {
  const firstSubject = SUBJECTS[0].name;
  openModal(`
    <h3>Add Batch Class</h3>
    <form data-action="submit-batch">
      <label class="field-block">Subject<select name="subject" id="batch-subject" required>${subjectNameOptions()}</select></label>
      <label class="field-block">Chapter<select name="chapter" id="batch-chapter" required>${chapterNameOptions(firstSubject)}</select></label>
      <div class="field-row">
        <label>Lecture number<input type="number" name="lectureNumber" min="1" required value="1" /></label>
        <label>Date<input type="date" name="date" required value="${App.todayISO()}" /></label>
      </div>
      <div class="field-row">
        <label>Time (optional)<input type="time" name="time" /></label>
        <label>Teacher/batch label (optional)<input name="teacher" placeholder="e.g. Mr Rao" /></label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-ghost sm" data-action="close-modal">Cancel</button>
        <button type="submit" class="btn-primary sm">Add Class</button>
      </div>
    </form>`);
  document.getElementById("batch-subject").addEventListener("change", (e) => {
    document.getElementById("batch-chapter").innerHTML = chapterNameOptions(e.target.value);
  });
}

// ---------------------------------------------------------------------
// Onboarding helpers
// ---------------------------------------------------------------------
function obGoStep(delta) {
  const state = App.getState();
  state._onboardingStep = Math.max(0, (state._onboardingStep || 0) + delta);
  App.setView(App.getView());
}

// ---------------------------------------------------------------------
// Event delegation — click
// ---------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const state = App.getState();

  switch (action) {
    case "navigate":
      App._justNavigated = true;
      App.setView(el.dataset.view);
      closeModal();
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "open-more":
      openModal(renderMoreSheet(App.getView()));
      break;

    // ---- Onboarding ----
    case "ob-next": obGoStep(1); break;
    case "ob-back": obGoStep(-1); break;
    case "ob-add-exam": {
      const name = document.getElementById("ob-exam-name").value.trim();
      const subject = document.getElementById("ob-exam-subject").value;
      const date = document.getElementById("ob-exam-date").value;
      if (!name || !date) { alert("Enter an exam name and date."); break; }
      state._onboardingDraft.exams = state._onboardingDraft.exams || [];
      state._onboardingDraft.exams.push({ name, subject, date });
      App.setView(App.getView());
      break;
    }
    case "ob-remove-exam":
      break; // handled via change delegation below (data-ob-remove-exam is on click too, see fallthrough)
    case "ob-finish": {
      const draft = state._onboardingDraft;
      const { exams, ...profile } = draft;
      App.actions.completeOnboarding(profile);
      (exams || []).forEach((ex) => App.actions.addExam({ name: ex.name, subject: ex.subject, date: ex.date, type: "Other", priority: "Medium", importantChapters: "" }));
      state._onboardingStep = 0;
      state._onboardingDraft = null;
      App.setView("dashboard");
      break;
    }
    case "reopen-onboarding":
      App.actions.reopenOnboarding();
      break;

    case "set-chapter-status":
      App.actions.setChapterStatus(el.dataset.subject, el.dataset.chapter, el.dataset.status);
      break;
    case "log-time":
      App.actions.logStudyTime(el.dataset.subject, el.dataset.chapter, 25);
      break;
    case "complete-revision":
      App.actions.completeRevision(el.dataset.subject, el.dataset.chapter, Number(el.dataset.index));
      break;
    case "toggle-lecture":
      App.actions.toggleLecture(el.dataset.subject, el.dataset.chapter, Number(el.dataset.index));
      break;
    case "add-dpp":
      App.actions.addDpp(el.dataset.subject, el.dataset.chapter);
      break;
    case "toggle-dpp":
      App.actions.toggleDpp(el.dataset.subject, el.dataset.chapter, Number(el.dataset.index));
      break;
    case "delete-dpp":
      App.actions.deleteDpp(el.dataset.subject, el.dataset.chapter, Number(el.dataset.index));
      break;

    case "generate-plan": {
      const fresh = Planner.generateTodayPlan(state);
      const wasStale = state.todayPlan.date && state.todayPlan.date !== App.todayISO();
      const tasks = wasStale ? Planner.rearrangeMissedTasks(state.todayPlan, fresh) : fresh;
      App.actions.setTodayPlan(tasks);
      break;
    }
    case "toggle-plan-task":
      App.actions.toggleTodayTask(Number(el.dataset.index));
      break;

    case "complete-homework":
      App.actions.updateHomework(el.dataset.id, { completed: true });
      break;
    case "toggle-homework": {
      const hw = state.homework.find((h) => h.id === el.dataset.id);
      App.actions.updateHomework(el.dataset.id, { completed: !hw.completed });
      break;
    }
    case "delete-homework":
      App.actions.deleteHomework(el.dataset.id);
      break;
    case "set-hw-tab":
      state._hwTab = el.dataset.tab;
      App.setView("homework");
      break;

    case "delete-exam":
      App.actions.deleteExam(el.dataset.id);
      break;

    case "toggle-batch-class":
      App.actions.toggleBatchClass(el.dataset.id);
      break;
    case "delete-batch-class":
      App.actions.deleteBatchClass(el.dataset.id);
      break;

    case "toggle-pin-note": {
      const note = state.notes.find((n) => n.id === el.dataset.id);
      App.actions.updateNote(el.dataset.id, { pinned: !note.pinned });
      break;
    }
    case "delete-note":
      App.actions.deleteNote(el.dataset.id);
      break;
    case "open-edit-note":
      openAddNoteModal(state.notes.find((n) => n.id === el.dataset.id));
      break;

    case "delete-target":
      App.actions.deleteWeeklyTarget(el.dataset.id);
      break;
    case "target-increment": {
      const t = state.weeklyTargets.find((t) => t.id === el.dataset.id);
      const next = Math.max(0, (t.current || 0) + Number(el.dataset.delta));
      App.actions.updateWeeklyTarget(el.dataset.id, { current: next });
      break;
    }

    case "open-add-homework": openAddHomeworkModal(); break;
    case "open-add-exam": openAddExamModal(); break;
    case "open-add-note": openAddNoteModal(); break;
    case "open-add-target": openAddTargetModal(); break;
    case "open-add-batch": openAddBatchModal(); break;
    case "close-modal": closeModal(); break;

    case "export-data": Store.exportJSON(state); break;
    case "reset-data":
      if (confirm("This clears all VEDAMITRA data in this browser. This cannot be undone. Continue?")) {
        App.actions.resetAll();
      }
      break;

    default:
      break;
  }

  // data-ob-remove-exam is easiest handled here since it's plain click, no data-action.
  const removeBtn = e.target.closest("[data-ob-remove-exam]");
  if (removeBtn) {
    const idx = Number(removeBtn.dataset.obRemoveExam);
    state._onboardingDraft.exams.splice(idx, 1);
    App.setView(App.getView());
  }
});

// ---------------------------------------------------------------------
// Event delegation — change
// ---------------------------------------------------------------------
document.addEventListener("change", (e) => {
  const el = e.target;
  const state = App.getState();

  // Onboarding field bindings (no data-action, just data-ob-*)
  if (el.dataset.obField) {
    const field = el.dataset.obField;
    const value = field === "dailyStudyMinutes" ? Number(el.value) : el.value;
    state._onboardingDraft[field] = value;
    return;
  }
  if (el.dataset.obSubject) {
    const id = el.dataset.obSubject;
    const list = state._onboardingDraft.subjects;
    state._onboardingDraft.subjects = el.checked ? [...new Set([...list, id])] : list.filter((s) => s !== id);
    App.setView(App.getView());
    return;
  }
  if (el.dataset.obDay) {
    const day = el.dataset.obDay;
    const list = state._onboardingDraft.preferredDays;
    state._onboardingDraft.preferredDays = el.checked ? [...new Set([...list, day])] : list.filter((d) => d !== day);
    App.setView(App.getView());
    return;
  }

  const actionEl = el.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  switch (action) {
    case "toggle-chapter-field":
      App.actions.setChapterField(actionEl.dataset.subject, actionEl.dataset.chapter, actionEl.dataset.field, actionEl.checked);
      break;
    case "set-chapter-field": {
      const value = actionEl.dataset.numeric ? Number(actionEl.value) : actionEl.value;
      App.actions.setChapterField(actionEl.dataset.subject, actionEl.dataset.chapter, actionEl.dataset.field, value);
      break;
    }
    case "set-lecture-count":
      App.actions.setLectureCount(actionEl.dataset.subject, actionEl.dataset.chapter, actionEl.value);
      break;
    case "set-dpp-score":
      App.actions.updateDpp(actionEl.dataset.subject, actionEl.dataset.chapter, Number(actionEl.dataset.index), { score: actionEl.value === "" ? null : Number(actionEl.value) });
      break;
    case "set-exam-prep":
      App.actions.updateExam(actionEl.dataset.id, { prepStatus: actionEl.value });
      break;
    case "setting-field":
      App.actions.saveSettings({ [actionEl.dataset.field]: actionEl.value });
      break;
    case "profile-field": {
      const field = actionEl.dataset.field;
      const value = field === "dailyStudyMinutes" ? Number(actionEl.value) : actionEl.value;
      App.actions.saveProfile({ [field]: value });
      break;
    }
    case "search-notes":
      state._noteQuery = actionEl.value;
      App.setView("notes");
      break;
    case "import-data": {
      const file = actionEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { App.actions.importState(JSON.parse(reader.result)); }
        catch (err) { alert("That file doesn't look like a valid VEDAMITRA backup."); }
      };
      reader.readAsText(file);
      break;
    }
    default:
      break;
  }
});

// ---------------------------------------------------------------------
// Event delegation — submit
// ---------------------------------------------------------------------
document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-action]");
  if (!form) return;
  e.preventDefault();
  const action = form.dataset.action;
  const fd = new FormData(form);
  const val = (k) => fd.get(k);

  switch (action) {
    case "submit-homework":
      App.actions.addHomework({ subject: val("subject"), description: val("description"), dueDate: val("dueDate"), priority: val("priority") });
      closeModal();
      break;
    case "submit-exam":
      App.actions.addExam({ name: val("name"), subject: val("subject"), type: val("type"), date: val("date"), importantChapters: val("importantChapters"), priority: val("priority") });
      closeModal();
      break;
    case "submit-note": {
      const id = form.dataset.id;
      const payload = { subject: val("subject"), title: val("title"), body: val("body") };
      if (id) App.actions.updateNote(id, payload);
      else App.actions.addNote(payload);
      closeModal();
      break;
    }
    case "submit-target":
      App.actions.addWeeklyTarget({ label: val("label"), goal: Number(val("goal")), deadline: val("deadline") });
      closeModal();
      break;
    case "submit-batch":
      App.actions.addBatchClass({
        subject: val("subject"), chapter: val("chapter"), lectureNumber: Number(val("lectureNumber")),
        date: val("date"), time: val("time"), teacher: val("teacher"),
      });
      closeModal();
      break;
    default:
      break;
  }
});

// Click outside modal content closes it.
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) closeModal();
});

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
function boot() {
  App.subscribe(renderApp);
  renderApp();

  const splash = document.getElementById("splash");
  const state = App.getState();
  const boardDate = state.settings.boardExamDate ? formatDateLong(state.settings.boardExamDate) : "";
  document.getElementById("splash-status").textContent = boardDate ? `ICSE 2027 · Boards on ${boardDate}` : "ICSE 2027 preparation";

  window.setTimeout(() => {
    splash.classList.add("splash-hide");
    window.setTimeout(() => splash.remove(), 700);
  }, 1400);

  // PWA: safe, best-effort registration — never blocks the app if it fails
  // (unsupported browser, disallowed scope, offline-only preview, etc.).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}

document.addEventListener("DOMContentLoaded", boot);
