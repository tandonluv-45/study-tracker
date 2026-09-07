"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SPRINT_ITEMS, TOPICS, schedule, iso, addDays,
  type SprintState, type SprintStatus, type SprintItem,
} from "@/lib/sprint-plan";
import { fetchSprintState, saveSprintState } from "@/lib/sprintApi";
import { format } from "date-fns";
import s from "./orbit.module.css";

const CYCLE: SprintStatus[] = ["none", "solved", "struggled", "looked_up", "attempted"];
const STATUS_UI: Record<SprintStatus, { label: string; bg: string; border: string; color: string }> = {
  none: { label: "", bg: "transparent", border: "var(--dim)", color: "var(--muted)" },
  solved: { label: "✓", bg: "var(--ok)", border: "var(--ok)", color: "#04120a" },
  struggled: { label: "S", bg: "rgba(255,126,130,.15)", border: "var(--red)", color: "var(--red)" },
  looked_up: { label: "L", bg: "rgba(224,177,94,.15)", border: "#E0B15E", color: "#E0B15E" },
  attempted: { label: "A", bg: "rgba(143,166,192,.15)", border: "#8FA6C0", color: "#8FA6C0" },
};

const DEFAULT_STATE: SprintState = { startDate: "2026-09-14", daysOff: [], overrides: {}, statuses: {} };

export default function SprintPlan() {
  const [state, setState] = useState<SprintState>(DEFAULT_STATE);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const today = iso(new Date());

  useEffect(() => { fetchSprintState().then((st) => setState({ ...DEFAULT_STATE, ...st })); }, []);

  const sched = useMemo(() => schedule(state), [state]);

  const statusOf = useCallback((id: string): SprintStatus => state.statuses[id] || "none", [state.statuses]);
  const isDone = (st: SprintStatus) => st === "solved" || st === "looked_up";

  const patch = (p: Partial<SprintState>) => { setState((prev) => ({ ...prev, ...p })); saveSprintState(p); };

  const cycleStatus = (id: string) => {
    const curi = CYCLE.indexOf(statusOf(id));
    const next = CYCLE[(curi + 1) % CYCLE.length];
    patch({ statuses: { ...state.statuses, [id]: next } });
  };
  const shiftTomorrow = (id: string) => {
    const cur = sched.byId.get(id) || today;
    patch({ overrides: { ...state.overrides, [id]: addDays(cur, 1) } });
  };
  const toggleDayOff = () => {
    const off = state.daysOff.includes(today) ? state.daysOff.filter((d) => d !== today) : [...state.daysOff, today];
    patch({ daysOff: off });
  };

  const totals = useMemo(() => {
    let solved = 0;
    for (const it of SPRINT_ITEMS) if (isDone(statusOf(it.id))) solved++;
    return { solved, total: SPRINT_ITEMS.length };
  }, [statusOf]);

  const grouped = useMemo(() => {
    const map: Record<string, SprintItem[]> = {};
    for (const it of SPRINT_ITEMS) (map[it.topic] ||= []).push(it);
    return map;
  }, []);

  const todayItems = sched.byDate.get(today) || [];
  // If nothing today (e.g. before the sprint starts), show the next scheduled day.
  let nextDay = "";
  if (todayItems.length === 0) {
    for (const d of [...sched.byDate.keys()].sort()) { if (d >= today) { nextDay = d; break; } }
  }
  const upcoming = nextDay ? sched.byDate.get(nextDay) || [] : [];
  const dayOffOn = state.daysOff.includes(today);

  const Row = ({ it }: { it: SprintItem }) => {
    const st = statusOf(it.id);
    const ui = STATUS_UI[st];
    const d = sched.byId.get(it.id);
    return (
      <div className={s.pItem}>
        <button className={s.pStat} onClick={() => cycleStatus(it.id)} style={{ background: ui.bg, borderColor: ui.border, color: ui.color }} title={st}>{ui.label}</button>
        <div className={s.pMid}>
          <div className={s.pT} style={isDone(st) ? { color: "var(--dim)", textDecoration: "line-through" } : undefined}>{it.title}</div>
          <div className={s.pSub}>{it.track === "ai" ? it.sub : `${it.topic} · ${it.sub}`}</div>
        </div>
        {d && <div className={s.pDate}>{format(new Date(d.replace(/-/g, "/")), "dd MMM")}</div>}
        <button className={s.pShift} onClick={() => shiftTomorrow(it.id)} title="Shift to next day">→</button>
      </div>
    );
  };

  return (
    <div className={s.view}>
      <div className={s.planTop}>
        <div>
          <div className={s.label}>Flight plan · {format(new Date(), "EEE dd MMM")}</div>
          <h2 className={s.h2} style={{ marginTop: 6 }}>Today</h2>
        </div>
        <button className={`${s.dayoff} ${dayOffOn ? s.dayoffOn : ""}`} onClick={toggleDayOff}>{dayOffOn ? "Day off ✓" : "Day off"}</button>
      </div>

      <div className={s.mprog}>
        <div className={s.mprogLab}><span>SPRINT CLEARED</span><span>{totals.solved} / {totals.total}</span></div>
        <div className={s.mprogBar}><i style={{ width: `${(totals.solved / totals.total) * 100}%` }} /></div>
      </div>

      {todayItems.length > 0 ? (
        <div className={s.planGroup} style={{ marginTop: 16 }}>
          {todayItems.map((it) => <Row key={it.id} it={it} />)}
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p className={s.pLead}>{dayOffOn ? "Day off — enjoy it. The timeline shifted forward." : "Nothing scheduled today."}
            {nextDay && ` Next up: ${format(new Date(nextDay.replace(/-/g, "/")), "EEE dd MMM")}.`}</p>
          {upcoming.length > 0 && (
            <div className={s.planGroup} style={{ marginTop: 12 }}>{upcoming.map((it) => <Row key={it.id} it={it} />)}</div>
          )}
        </div>
      )}

      <div className={s.sec}><h3>Full plan</h3><span className={s.n}>{totals.total} items</span></div>
      {TOPICS.map((topic) => {
        const items = grouped[topic] || [];
        if (items.length === 0) return null;
        const done = items.filter((it) => isDone(statusOf(it.id))).length;
        const isOpen = open[topic];
        return (
          <div key={topic} className={s.planGroup}>
            <button className={s.planGH} onClick={() => setOpen((o) => ({ ...o, [topic]: !o[topic] }))}>
              <span className={s.planGT}>{topic}</span>
              <span className={s.planGN}>{done}/{items.length} {isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && items.map((it) => <Row key={it.id} it={it} />)}
          </div>
        );
      })}
      <div style={{ height: 80 }} />
    </div>
  );
}
