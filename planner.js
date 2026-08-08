/**
 * VEDAMITRA — Study planner
 * ---------------------------
 * `Planner.generateTodayPlan(state)` builds Today's Study Plan from local
 * data alone (revisions due, homework due, weak/incomplete chapters,
 * available daily minutes). This runs entirely client-side — no network
 * call, no API key.
 *
 * WIRING A REAL AI PLANNER LATER:
 * Do NOT put an API key in this file or anywhere in the frontend. Instead,
 * deploy a small serverless endpoint (Vercel/Cloudflare Worker/Supabase
 * Edge Function) that holds the key server-side, accepts the same
 * `buildPlannerContext(state)` payload below as its POST body, and returns
 * a task list in the same shape `generateTodayPlan` returns. Then swap the
 * body of `generateTodayPlan` for a `fetch('/api/plan', {method:'POST',
 * body: JSON.stringify(buildPlannerContext(state))})` call, keeping this
 * function's fallback as a catch-block so the app still works offline or
 * if the API errors.
 */

const Planner = (() => {
  function buildPlannerContext(state) {
    const s = App.selectors;
    return {
      dailyMinutes: state.settings.dailyStudyMinutes,
      revisionsDueToday: s.revisionsDueToday(),
      homeworkToday: s.todaysHomework(),
      weakChapters: s.weakChapters(8),
      incompleteChapters: s.incompleteChapters(),
      upcomingExams: s.upcomingExams(3),
      weeklyTargets: state.weeklyTargets,
    };
  }

  function generateTodayPlan(state) {
    const ctx = buildPlannerContext(state);
    const tasks = [];
    let minutesLeft = ctx.dailyMinutes;

    const push = (task) => {
      if (minutesLeft <= 0) return;
      const duration = Math.min(task.duration, Math.max(minutesLeft, 15));
      tasks.push({ ...task, duration, done: false });
      minutesLeft -= duration;
    };

    // 1. Revisions due today — always prioritised (spaced repetition works
    //    only if it happens on schedule).
    ctx.revisionsDueToday.slice(0, 4).forEach((r) => {
      push({
        subjectId: r.subjectId,
        subject: r.subjectName,
        chapter: r.chapterName,
        task: `Revision — ${r.label}`,
        duration: 25,
        priority: "High",
        type: "revision",
      });
    });

    // 2. Homework due today.
    ctx.homeworkToday.forEach((h) => {
      push({
        subjectId: h.subject,
        subject: h.subject,
        chapter: h.chapter || "",
        task: `Homework — ${h.description}`,
        duration: 30,
        priority: h.priority || "Medium",
        type: "homework",
      });
    });

    // 3. Exam-driven urgency — if an exam is within 7 days, pull in its
    //    weakest incomplete chapters.
    const urgentExam = ctx.upcomingExams.find((e) => App.selectors.daysUntil(e.date) <= 7);
    if (urgentExam) {
      ctx.incompleteChapters
        .filter((c) => c.subjectName === urgentExam.subject)
        .slice(0, 2)
        .forEach((c) => {
          push({
            subjectId: c.subjectId,
            subject: c.subjectName,
            chapter: c.name,
            task: c.status === "in-progress" ? "Finish chapter" : "Start chapter",
            duration: 45,
            priority: "High",
            type: "exam-prep",
          });
        });
    }

    // 4. Weak chapters (low confidence / hard difficulty) fill remaining time.
    ctx.weakChapters.forEach((c) => {
      if (tasks.some((t) => t.chapter === c.name)) return;
      push({
        subjectId: c.subjectId,
        subject: c.subjectName,
        chapter: c.name,
        task: "Focused practice — weak area",
        duration: 40,
        priority: "Medium",
        type: "practice",
      });
    });

    // 5. If still time left, pull in fresh incomplete chapters in round-robin.
    let i = 0;
    while (minutesLeft > 15 && i < ctx.incompleteChapters.length) {
      const c = ctx.incompleteChapters[i];
      i += 1;
      if (tasks.some((t) => t.chapter === c.name)) continue;
      push({
        subjectId: c.subjectId,
        subject: c.subjectName,
        chapter: c.name,
        task: c.status === "in-progress" ? "Continue chapter" : "Start chapter",
        duration: 45,
        priority: "Low",
        type: "new",
      });
    }

    return tasks;
  }

  // Rearranges an existing (partially incomplete) plan into today, used
  // when the student missed a day — undone tasks roll forward and are
  // merged with anything freshly generated for today.
  function rearrangeMissedTasks(oldPlan, freshTasks) {
    const missed = (oldPlan?.tasks || []).filter((t) => !t.done);
    const merged = [...missed.map((t) => ({ ...t, priority: "High", carriedOver: true })), ...freshTasks];
    // De-duplicate by chapter+task text, keep the carried-over (higher priority) copy.
    const seen = new Set();
    return merged.filter((t) => {
      const key = t.subject + "|" + t.chapter + "|" + t.task.replace(/^Revision.*/, "Revision");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return { generateTodayPlan, rearrangeMissedTasks, buildPlannerContext };
})();
