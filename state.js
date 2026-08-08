/**
 * VEDAMITRA — App state & selectors
 * -----------------------------------
 * `App.state` is the single source of truth in memory. Every mutation goes
 * through `App.actions`, which updates state, persists it via Store, then
 * re-renders. Selectors compute derived data (progress %, revisions due,
 * dashboard summaries) so components never duplicate this logic.
 */

const App = (() => {
  let state = Store.load();
  let currentView = "dashboard";
  let subscribers = [];

  function getState() {
    return state;
  }

  function setView(view) {
    currentView = view;
    notify();
  }

  function getView() {
    return currentView;
  }

  function subscribe(fn) {
    subscribers.push(fn);
  }

  function notify() {
    subscribers.forEach((fn) => fn());
  }

  function persistAndNotify() {
    Store.save(state);
    notify();
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(iso, days) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // ---------- Actions ----------
  const actions = {
    saveSettings(patch) {
      state.settings = { ...state.settings, ...patch };
      state.onboarded = true;
      persistAndNotify();
    },

    setChapterField(subjectId, chapterId, field, value) {
      const ch = state.subjects[subjectId].chapters[chapterId];
      ch[field] = value;
      persistAndNotify();
    },

    setChapterStatus(subjectId, chapterId, status) {
      const ch = state.subjects[subjectId].chapters[chapterId];
      const wasCompleted = ch.status === "completed";
      ch.status = status;

      if (status === "completed" && !wasCompleted) {
        ch.completedDate = todayISO();
        ch.revisionSchedule = REVISION_INTERVALS_DAYS.map((days, i) => ({
          date: addDays(todayISO(), days),
          label: `Day ${days}`,
          done: false,
        }));
      }
      if (status !== "completed") {
        ch.completedDate = null;
        ch.revisionSchedule = [];
      }
      persistAndNotify();
    },

    logStudyTime(subjectId, chapterId, minutes) {
      const ch = state.subjects[subjectId].chapters[chapterId];
      ch.studyMinutes = (ch.studyMinutes || 0) + minutes;
      state.studyLog.unshift({ date: todayISO(), subjectId, chapterId, minutes });
      state.studyLog = state.studyLog.slice(0, 50);
      persistAndNotify();
    },

    completeRevision(subjectId, chapterId, index) {
      const ch = state.subjects[subjectId].chapters[chapterId];
      if (ch.revisionSchedule[index]) {
        ch.revisionSchedule[index].done = true;
        ch.revisionSchedule[index].completedOn = todayISO();
      }
      persistAndNotify();
    },

    rescheduleRevision(subjectId, chapterId, index, newDate) {
      const ch = state.subjects[subjectId].chapters[chapterId];
      if (ch.revisionSchedule[index]) {
        ch.revisionSchedule[index].date = newDate;
      }
      persistAndNotify();
    },

    addHomework(hw) {
      state.homework.unshift({ id: crypto.randomUUID(), completed: false, ...hw });
      persistAndNotify();
    },
    updateHomework(id, patch) {
      state.homework = state.homework.map((h) => (h.id === id ? { ...h, ...patch } : h));
      persistAndNotify();
    },
    deleteHomework(id) {
      state.homework = state.homework.filter((h) => h.id !== id);
      persistAndNotify();
    },

    addExam(exam) {
      state.exams.unshift({ id: crypto.randomUUID(), prepStatus: "Not Started", ...exam });
      persistAndNotify();
    },
    updateExam(id, patch) {
      state.exams = state.exams.map((e) => (e.id === id ? { ...e, ...patch } : e));
      persistAndNotify();
    },
    deleteExam(id) {
      state.exams = state.exams.filter((e) => e.id !== id);
      persistAndNotify();
    },

    addNote(note) {
      state.notes.unshift({ id: crypto.randomUUID(), pinned: false, updatedAt: Date.now(), ...note });
      persistAndNotify();
    },
    updateNote(id, patch) {
      state.notes = state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
      persistAndNotify();
    },
    deleteNote(id) {
      state.notes = state.notes.filter((n) => n.id !== id);
      persistAndNotify();
    },

    addWeeklyTarget(target) {
      state.weeklyTargets.unshift({ id: crypto.randomUUID(), current: 0, ...target });
      persistAndNotify();
    },
    updateWeeklyTarget(id, patch) {
      state.weeklyTargets = state.weeklyTargets.map((t) => (t.id === id ? { ...t, ...patch } : t));
      persistAndNotify();
    },
    deleteWeeklyTarget(id) {
      state.weeklyTargets = state.weeklyTargets.filter((t) => t.id !== id);
      persistAndNotify();
    },

    setTodayPlan(tasks) {
      state.todayPlan = { date: todayISO(), tasks };
      persistAndNotify();
    },
    toggleTodayTask(index) {
      state.todayPlan.tasks[index].done = !state.todayPlan.tasks[index].done;
      persistAndNotify();
    },

    importState(json) {
      state = { ...Store.defaultState(), ...json };
      persistAndNotify();
    },
    resetAll() {
      Store.reset();
      state = Store.defaultState();
      persistAndNotify();
    },
  };

  // ---------- Selectors ----------
  const selectors = {
    allChapters() {
      const out = [];
      SUBJECTS.forEach((s) => {
        Object.keys(state.subjects[s.id].chapters).forEach((cid) => {
          const chapterMeta = s.chapters.find((c) => c.id === cid);
          out.push({ subjectId: s.id, subjectName: s.name, color: s.color, chapterId: cid, name: chapterMeta.name, ...state.subjects[s.id].chapters[cid] });
        });
      });
      return out;
    },

    subjectProgress(subjectId) {
      const chapters = Object.values(state.subjects[subjectId].chapters);
      const total = chapters.length;
      const completed = chapters.filter((c) => c.status === "completed").length;
      const inProgress = chapters.filter((c) => c.status === "in-progress").length;
      return { total, completed, inProgress, pct: total ? Math.round((completed / total) * 100) : 0 };
    },

    overallProgress() {
      let total = 0;
      let completed = 0;
      SUBJECTS.forEach((s) => {
        const p = selectors.subjectProgress(s.id);
        total += p.total;
        completed += p.completed;
      });
      return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
    },

    revisionsDueToday() {
      const today = todayISO();
      return selectors.allChapters().flatMap((ch) =>
        (ch.revisionSchedule || [])
          .map((r, i) => ({ ...r, index: i, subjectId: ch.subjectId, subjectName: ch.subjectName, chapterId: ch.chapterId, chapterName: ch.name, color: ch.color }))
          .filter((r) => !r.done && r.date <= today)
      );
    },

    upcomingRevisions(daysAhead = 14) {
      const today = todayISO();
      const limit = addDays(today, daysAhead);
      return selectors
        .allChapters()
        .flatMap((ch) =>
          (ch.revisionSchedule || [])
            .map((r, i) => ({ ...r, index: i, subjectId: ch.subjectId, subjectName: ch.subjectName, chapterId: ch.chapterId, chapterName: ch.name, color: ch.color }))
            .filter((r) => !r.done && r.date > today && r.date <= limit)
        )
        .sort((a, b) => a.date.localeCompare(b.date));
    },

    weakChapters(limit = 5) {
      return selectors
        .allChapters()
        .filter((c) => c.status !== "not-started")
        .sort((a, b) => a.confidence - b.confidence || (a.difficulty === "Hard" ? -1 : 1))
        .slice(0, limit);
    },

    incompleteChapters() {
      return selectors.allChapters().filter((c) => c.status !== "completed");
    },

    todaysHomework() {
      const today = todayISO();
      return state.homework.filter((h) => !h.completed && h.dueDate === today);
    },
    upcomingHomework() {
      const today = todayISO();
      return state.homework.filter((h) => !h.completed && h.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    },
    pendingHomework() {
      const today = todayISO();
      return state.homework.filter((h) => !h.completed && h.dueDate < today);
    },
    completedHomework() {
      return state.homework.filter((h) => h.completed);
    },

    upcomingExams(limit) {
      const today = todayISO();
      const list = state.exams
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
      return limit ? list.slice(0, limit) : list;
    },

    daysUntil(dateStr) {
      if (!dateStr) return null;
      const diff = (new Date(dateStr + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000;
      return Math.ceil(diff);
    },

    recentlyStudied(limit = 5) {
      return state.studyLog.slice(0, limit);
    },
  };

  return { getState, setView, getView, subscribe, actions, selectors, todayISO, addDays };
})();
