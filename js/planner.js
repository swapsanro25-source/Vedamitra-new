/**
 * VEDAMITRA — Study planner
 * ---------------------------
 * `Planner.generateTodayPlan(state)` builds Today's Study Plan from local
 * data alone — no network call, no API key (see wiring notes below).
 *
 * HOW THIS AVOIDS THE "ONLY ONE SUBJECT" BUG:
 * Every candidate task gets a numeric score (overdue revision, exam
 * urgency, weak/hard chapters, neglect, pending DPPs, etc). Tasks are then
 * picked greedily by score, but after each pick from a subject, a
 * *balancing penalty* is subtracted from every remaining candidate in that
 * same subject before the next pick. A subject with a lot of genuinely
 * urgent work can still win several slots, but it has to keep earning them
 * — it can no longer silently eat the whole plan just because it happened
 * to have the most incomplete chapters. Fixed commitments (batch classes,
 * homework due today) are exempt from scoring/penalty — they're
 * obligations, not flexible practice, so they're always included first.
 *
 * WIRING A REAL AI PLANNER LATER:
 * Do NOT put an API key in this file or anywhere in the frontend. Instead,
 * deploy a small serverless endpoint (Vercel/Cloudflare Worker/Supabase
 * Edge Function) that holds the key server-side, accepts the same
 * `buildPlannerContext(state)` payload below as its POST body, and returns
 * a task list shaped like what `generateTodayPlan` returns. Then swap the
 * body of `generateTodayPlan` for a `fetch('/api/plan', {...})` call,
 * keeping this function's logic as a catch-block fallback so the app keeps
 * working offline or if the API errors.
 */

const Planner = (() => {
  const SUBJECT_BALANCE_PENALTY = 35; // subtracted per already-picked task from the same subject

  function buildPlannerContext(state) {
    const s = App.selectors;
    return {
      dailyMinutes: state.profile.dailyStudyMinutes,
      revisionsDueToday: s.revisionsDueToday(),
      homeworkToday: s.todaysHomework(),
      allChapters: s.allChapters(),
      incompleteChapters: s.incompleteChapters(),
      upcomingExams: s.upcomingExams(5),
      weeklyTargets: state.weeklyTargets,
      batchClassesToday: s.todaysBatchClasses(),
      studyLog: state.studyLog,
    };
  }

  function daysSinceLastStudied(ctx, subjectId) {
    const entry = ctx.studyLog.find((l) => l.subjectId === subjectId);
    if (!entry) return 21; // never studied → treat as maximally neglected (capped below)
    const diff = (new Date(App.todayISO() + "T00:00:00") - new Date(entry.date + "T00:00:00")) / 86400000;
    return Math.max(0, diff);
  }

  function examUrgencyBySubject(ctx) {
    const map = {};
    ctx.upcomingExams.forEach((e) => {
      const days = App.selectors.daysUntil(e.date);
      if (days <= 10) {
        const boost = days <= 3 ? 60 : days <= 7 ? 45 : 25;
        map[e.subject] = Math.max(map[e.subject] || 0, boost);
      }
    });
    return map;
  }

  function buildCandidates(ctx) {
    const candidates = [];
    const examBoost = examUrgencyBySubject(ctx);

    // Revisions due (today or overdue) — the highest-value flexible work,
    // since spaced repetition only works if it happens close to schedule.
    ctx.revisionsDueToday.forEach((r) => {
      const overdue = r.date < App.todayISO();
      candidates.push({
        subjectId: r.subjectId,
        subject: r.subjectName,
        chapter: r.chapterName,
        task: `Revision — ${r.label}${overdue ? " (overdue)" : ""}`,
        duration: 25,
        priority: overdue ? "High" : "Medium",
        type: "Revision",
        score: (overdue ? 100 : 80) + (examBoost[r.subjectName] || 0),
      });
    });

    // Pending DPPs, one candidate per chapter that has at least one.
    ctx.allChapters.forEach((c) => {
      const pending = (c.dpps || []).filter((d) => d.status !== "completed").length;
      if (pending > 0) {
        candidates.push({
          subjectId: c.subjectId,
          subject: c.subjectName,
          chapter: c.name,
          task: `Solve pending DPP${pending > 1 ? `s (${pending})` : ""}`,
          duration: 20,
          priority: "Medium",
          type: "DPP",
          score: 35 + Math.min(pending * 5, 20) + (examBoost[c.subjectName] || 0),
        });
      }
    });

    // Pending lectures already scheduled but not yet marked complete.
    ctx.allChapters.forEach((c) => {
      const pendingLectures = (c.lectures || []).filter((l) => !l.completed).length;
      if (pendingLectures > 0 && c.status !== "not-started") {
        candidates.push({
          subjectId: c.subjectId,
          subject: c.subjectName,
          chapter: c.name,
          task: `Catch up on ${pendingLectures} pending lecture${pendingLectures > 1 ? "s" : ""}`,
          duration: 30,
          priority: "Medium",
          type: "Lecture",
          score: 30 + (examBoost[c.subjectName] || 0),
        });
      }
    });

    // Incomplete chapters — weighted by status, confidence, difficulty,
    // exam urgency and how long the subject has been neglected.
    ctx.incompleteChapters.forEach((c) => {
      const neglect = Math.min(daysSinceLastStudied(ctx, c.subjectId) * 2.5, 25);
      const confidencePenalty = (5 - (c.confidence || 3)) * 6; // low confidence -> higher score
      const difficultyBonus = { Hard: 15, Medium: 5, Easy: 0 }[c.difficulty] || 0;
      const statusBase = c.status === "in-progress" ? 45 : 22;
      candidates.push({
        subjectId: c.subjectId,
        subject: c.subjectName,
        chapter: c.name,
        task: c.status === "in-progress" ? "Continue chapter" : "Start chapter",
        duration: 45,
        priority: c.status === "in-progress" ? "Medium" : "Low",
        type: "Theory",
        score: statusBase + confidencePenalty + difficultyBonus + neglect + (examBoost[c.subjectName] || 0),
      });
    });

    return candidates;
  }

  function generateTodayPlan(state) {
    const ctx = buildPlannerContext(state);
    const tasks = [];
    let minutesLeft = ctx.dailyMinutes;

    const commit = (task) => {
      if (minutesLeft <= 0) return false;
      const duration = Math.min(task.duration, Math.max(minutesLeft, 15));
      tasks.push({ ...task, duration, done: false });
      minutesLeft -= duration;
      return true;
    };

    // Fixed commitments first — not subject to scoring or balancing, since
    // these are obligations rather than flexible study choices.
    ctx.batchClassesToday.filter((c) => !c.completed).forEach((c) => {
      commit({
        subjectId: c.subject, subject: c.subject, chapter: c.chapter,
        task: `Batch Lecture ${c.lectureNumber}${c.time ? " · " + c.time : ""}`,
        duration: 45, priority: "High", type: "Lecture",
      });
    });
    ctx.homeworkToday.forEach((h) => {
      commit({
        subjectId: h.subject, subject: h.subject, chapter: h.chapter || "",
        task: `Homework — ${h.description}`, duration: 30, priority: h.priority || "Medium", type: "Homework",
      });
    });

    // Flexible work: score every candidate, then greedily pick, applying a
    // balancing penalty to a subject each time it's chosen so meaningful
    // pending work in OTHER subjects doesn't get crowded out.
    let candidates = buildCandidates(ctx).filter(
      (c) => !tasks.some((t) => t.subject === c.subject && t.chapter === c.chapter && t.type === c.type)
    );
    const perSubjectPicks = {};

    while (minutesLeft > 10 && candidates.length) {
      let bestIdx = 0;
      let bestEffective = -Infinity;
      candidates.forEach((c, i) => {
        const penalty = (perSubjectPicks[c.subjectId] || 0) * SUBJECT_BALANCE_PENALTY;
        const effective = c.score - penalty;
        if (effective > bestEffective) { bestEffective = effective; bestIdx = i; }
      });
      const chosen = candidates[bestIdx];
      candidates.splice(bestIdx, 1);
      const added = commit(chosen);
      if (!added) break;
      perSubjectPicks[chosen.subjectId] = (perSubjectPicks[chosen.subjectId] || 0) + 1;
      // Drop any other candidate for the exact same chapter+type now that
      // it's scheduled, so the same chapter isn't queued twice in one plan.
      candidates = candidates.filter((c) => !(c.subject === chosen.subject && c.chapter === chosen.chapter && c.type === chosen.type));
    }

    return tasks;
  }

  // Rearranges an existing (partially incomplete) plan into today, used
  // when the student missed a day — undone tasks roll forward and are
  // merged with anything freshly generated for today.
  function rearrangeMissedTasks(oldPlan, freshTasks) {
    const missed = (oldPlan?.tasks || []).filter((t) => !t.done);
    const merged = [...missed.map((t) => ({ ...t, priority: "High", carriedOver: true })), ...freshTasks];
    const seen = new Set();
    return merged.filter((t) => {
      const key = t.subject + "|" + t.chapter + "|" + t.type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return { generateTodayPlan, rearrangeMissedTasks, buildPlannerContext };
})();
