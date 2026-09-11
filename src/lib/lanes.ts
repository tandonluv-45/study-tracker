// Unified "lanes" model — the single source of truth for the boarding pass and
// star chart. DSA + AI progress is DERIVED from the Plan tab's per-problem
// statuses (sprint-plan); Core CS is a small set of manual monthly milestones.

import { SPRINT_ITEMS, schedule, type SprintItem, type SprintState, type SprintStatus } from "./sprint-plan";

export type LaneKey = "dsa" | "ai" | "core";

export interface Checkpoint {
  key: string;      // stable id (topic slug / item id / core key)
  title: string;
  sub?: string;
  solved: number;
  total: number;
  done: boolean;
}

export interface Lane {
  key: LaneKey;
  label: string;
  checkpoints: Checkpoint[];
  currentIdx: number;   // first not-done checkpoint (or last, if all done)
  solved: number;
  total: number;
  pct: number;
}

// A problem counts as cleared for progress if solved or reviewed (looked up).
export const isCleared = (s?: SprintStatus) => s === "solved" || s === "looked_up";

// Core-CS milestones per month (no per-problem source — ticked manually).
export const CORE_BY_MONTH: Record<string, { key: string; title: string }[]> = {
  "2026-09": [{ key: "core-2026-09", title: "Sem 5 coursework — assignments up to date" }],
  "2026-10": [{ key: "core-2026-10", title: "Sem 5 mid-sems (Oct 12–19) — protect CGPA" }],
  "2026-11": [{ key: "core-2026-11", title: "Sem 5 coursework — assignments up to date" }],
  "2026-12": [{ key: "core-2026-12", title: "Sem 5 end-sems (Dec 1–15) — protect CGPA" }],
  "2027-01": [{ key: "core-2027-01", title: "Sem 6 begins — settle into new courses" }],
  "2027-02": [{ key: "core-2027-02", title: "Sem 6 coursework — assignments up to date" }],
};

/** Sprint items scheduled within a given yyyy-MM, in schedule order. */
export function monthItems(state: SprintState, yyyyMM: string): SprintItem[] {
  const sched = schedule(state);
  const out: { date: string; item: SprintItem }[] = [];
  for (const [date, items] of sched.byDate) {
    if (date.startsWith(yyyyMM)) for (const item of items) out.push({ date, item });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out.map((o) => o.item);
}

function laneFrom(key: LaneKey, label: string, checkpoints: Checkpoint[]): Lane {
  const solved = checkpoints.reduce((a, c) => a + c.solved, 0);
  const total = checkpoints.reduce((a, c) => a + c.total, 0);
  let currentIdx = checkpoints.findIndex((c) => !c.done);
  if (currentIdx < 0) currentIdx = Math.max(0, checkpoints.length - 1);
  return { key, label, checkpoints, currentIdx, solved, total, pct: total ? Math.round((solved / total) * 100) : 0 };
}

export function buildLanes(
  state: SprintState,
  yyyyMM: string,
  coreDone: (key: string) => boolean
): { lanes: Lane[]; solved: number; total: number; pct: number } {
  const items = monthItems(state, yyyyMM);
  const statuses = state.statuses || {};

  // DSA — group the month's items by topic, in first-appearance order.
  const dsaItems = items.filter((i) => i.track === "dsa");
  const order: string[] = [];
  const byTopic = new Map<string, SprintItem[]>();
  for (const it of dsaItems) {
    if (!byTopic.has(it.topic)) { byTopic.set(it.topic, []); order.push(it.topic); }
    byTopic.get(it.topic)!.push(it);
  }
  const dsaCp: Checkpoint[] = order.map((topic) => {
    const its = byTopic.get(topic)!;
    const solved = its.filter((i) => isCleared(statuses[i.id])).length;
    return { key: `dsa:${topic}`, title: topic, sub: `${solved}/${its.length} problems`, solved, total: its.length, done: solved >= its.length };
  });

  // AI — one checkpoint per scheduled week.
  const aiItems = items.filter((i) => i.track === "ai");
  const aiCp: Checkpoint[] = aiItems.map((i) => {
    const done = isCleared(statuses[i.id]);
    return { key: `ai:${i.id}`, title: i.title, sub: i.sub, solved: done ? 1 : 0, total: 1, done };
  });

  // Core CS — manual monthly milestones.
  const coreCp: Checkpoint[] = (CORE_BY_MONTH[yyyyMM] || []).map((m) => {
    const done = coreDone(m.key);
    return { key: m.key, title: m.title, solved: done ? 1 : 0, total: 1, done };
  });

  const lanes = [
    laneFrom("dsa", "DSA", dsaCp),
    laneFrom("ai", "AI · 100x", aiCp),
    laneFrom("core", "Core CS", coreCp),
  ].filter((l) => l.checkpoints.length > 0);

  // Overall "charted" reflects the real work — DSA + AI problems (not manual core).
  const workLanes = lanes.filter((l) => l.key !== "core");
  const solved = workLanes.reduce((a, l) => a + l.solved, 0);
  const total = workLanes.reduce((a, l) => a + l.total, 0);
  return { lanes, solved, total, pct: total ? Math.round((solved / total) * 100) : 0 };
}
