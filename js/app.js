/**
 * VEDAMITRA — App bootstrap & interactivity
 * --------------------------------------------
 * One delegated listener per event type reads `data-action` off the
 * clicked/changed element and dispatches to a handler below. This keeps
 * render.js free of inline JS and means re-rendering never needs to
 * re-attach listeners.
 */

function renderApp() {
  const root = document.getElementById("app-root");
  root.innerHTML = renderShell();
}

function closeModal() {
  document.getElementById("modal-layer").innerHTML = "";
}

function openModal(html) {
  document.getElementById("modal-layer").innerHTML = `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal glass" data-stop>
        ${html}
      </div>
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
      <label class="field-block">Subject<select name="subject" required>${subjectNameOptions()}</select></label>
      <label class="field-block">Date<input type="date" name="date" required /></label>
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

// ---------------------------------------------------------------------
// Event delegation
// ---------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const state = App.getState();

  switch (action) {
    case "navigate":
      App.setView(el.dataset.view);
      document.getElementById("sidebar")?.classList.remove("open");
      document.querySelector(".scrim")?.classList.remove("show");
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;
    case "open-sidebar":
      document.getElementById("sidebar").classList.add("open");
      document.querySelector(".scrim").classList.add("show");
      break;
    case "close-sidebar":
      document.getElementById("sidebar").classList.remove("open");
      document.querySelector(".scrim").classList.remove("show");
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
});

document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const state = App.getState();

  switch (action) {
    case "toggle-chapter-field":
      App.actions.setChapterField(el.dataset.subject, el.dataset.chapter, el.dataset.field, el.checked);
      break;
    case "set-chapter-field": {
      const value = el.dataset.numeric ? Number(el.value) : el.value;
      App.actions.setChapterField(el.dataset.subject, el.dataset.chapter, el.dataset.field, value);
      break;
    }
    case "set-exam-prep":
      App.actions.updateExam(el.dataset.id, { prepStatus: el.value });
      break;
    case "setting-field": {
      const field = el.dataset.field;
      const value = field === "dailyStudyMinutes" ? Number(el.value) : el.value;
      App.actions.saveSettings({ [field]: value });
      break;
    }
    case "search-notes":
      state._noteQuery = el.value;
      App.setView("notes");
      break;
    case "import-data": {
      const file = el.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          App.actions.importState(JSON.parse(reader.result));
        } catch (err) {
          alert("That file doesn't look like a valid VEDAMITRA backup.");
        }
      };
      reader.readAsText(file);
      break;
    }
    default:
      break;
  }
});

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
      App.actions.addExam({ name: val("name"), subject: val("subject"), date: val("date"), priority: val("priority") });
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
}

document.addEventListener("DOMContentLoaded", boot);
