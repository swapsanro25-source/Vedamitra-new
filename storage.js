/**
 * VEDAMITRA — Storage layer
 * --------------------------
 * Wraps localStorage behind a small API so the persistence mechanism can be
 * swapped later (e.g. for Supabase/Firebase sync) without touching the rest
 * of the app. Everything else in the app talks to `Store`, never to
 * localStorage directly.
 */

const Store = (() => {
  const KEY = "vedamitra_state_v1";

  function defaultState() {
    const subjects = {};
    SUBJECTS.forEach((s) => {
      subjects[s.id] = { chapters: {} };
      s.chapters.forEach((c) => {
        subjects[s.id].chapters[c.id] = {
          status: "not-started", // not-started | in-progress | completed
          theory: false,
          exercises: false,
          revision: false,
          pyqs: false,
          confidence: 3, // 1-5
          difficulty: "Medium", // Easy | Medium | Hard
          studyMinutes: 0,
          mistakes: "",
          completedDate: null,
          revisionSchedule: [], // [{ date: 'YYYY-MM-DD', label:'Day 1', done:false }]
        };
      });
    });

    return {
      version: 1,
      onboarded: false,
      settings: {
        studentName: "",
        boardExamDate: "", // e.g. first ICSE 2027 paper date
        dailyStudyMinutes: 120,
      },
      subjects,
      homework: [],
      exams: [],
      notes: [],
      weeklyTargets: [],
      todayPlan: { date: null, tasks: [] },
      studyLog: [], // [{date, subjectId, chapterId, minutes}]
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Merge to protect against subjects/chapters added after a user's
      // first save (keeps old progress, adds new chapter shells).
      const base = defaultState();
      Object.keys(base.subjects).forEach((sid) => {
        if (!parsed.subjects || !parsed.subjects[sid]) return;
        Object.keys(base.subjects[sid].chapters).forEach((cid) => {
          if (parsed.subjects[sid].chapters[cid]) {
            base.subjects[sid].chapters[cid] = parsed.subjects[sid].chapters[cid];
          }
        });
      });
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
        subjects: base.subjects,
      };
    } catch (e) {
      console.error("VEDAMITRA: failed to load state, resetting.", e);
      return defaultState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error("VEDAMITRA: failed to save state.", e);
    }
  }

  function exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vedamitra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return { load, save, exportJSON, reset, defaultState };
})();
