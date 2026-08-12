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
          educart1: false,
          educart2: false,
          educart3: false,
          confidence: 3, // 1-5
          difficulty: "Medium", // Easy | Medium | Hard
          studyMinutes: 0,
          mistakes: "",
          completedDate: null,
          revisionSchedule: [], // [{ date: 'YYYY-MM-DD', label:'Day 1', done:false }]
          // --- VEDAMITRA 2.0 ---
          lectures: [], // [{ completed:false, completedDate:null }] — length = batch lecture count
          dpps: [], // [{ status:'pending'|'completed', date:null, score:null, remarks:'' }]
        };
      });
    });

    return {
      version: 2,
      onboarded: false,
      profile: {
        studentName: "",
        className: "10",
        board: "ICSE",
        academicYear: "2026-27",
        schoolName: "",
        subjects: SUBJECTS.map((s) => s.id), // which subjects the student is actually taking
        dailyStudyMinutes: 120,
        preferredDays: [...WEEKDAYS],
        batchScheduleNote: "",
      },
      settings: {
        boardExamDate: "", // first ICSE 2027 paper date
      },
      subjects,
      homework: [],
      exams: [], // { id, name, subject, date, type, importantChapters, priority, prepStatus }
      notes: [],
      weeklyTargets: [],
      batchClasses: [], // { id, subject, chapter, lectureNumber, date, time, teacher, completed }
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
      // first save (keeps old progress, adds new chapter shells), and to
      // backfill v2 fields (lectures/dpps/profile) onto a v1 save.
      const base = defaultState();
      Object.keys(base.subjects).forEach((sid) => {
        if (!parsed.subjects || !parsed.subjects[sid]) return;
        Object.keys(base.subjects[sid].chapters).forEach((cid) => {
          const savedChapter = parsed.subjects[sid].chapters[cid];
          if (savedChapter) {
            base.subjects[sid].chapters[cid] = {
              ...base.subjects[sid].chapters[cid], // provides lectures:[] / dpps:[] if missing
              ...savedChapter,
            };
          }
        });
      });

      // v1 stored the student's name/exam date directly on `settings`;
      // v2 moves the name into `profile`. Carry it forward either way.
      const legacySettings = parsed.settings || {};
      const migratedProfile = {
        ...base.profile,
        ...(parsed.profile || {}),
        studentName: (parsed.profile && parsed.profile.studentName) || legacySettings.studentName || base.profile.studentName,
      };

      return {
        ...base,
        ...parsed,
        profile: migratedProfile,
        settings: { ...base.settings, boardExamDate: legacySettings.boardExamDate || base.settings.boardExamDate },
        subjects: base.subjects,
        batchClasses: parsed.batchClasses || [],
        version: 2,
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
