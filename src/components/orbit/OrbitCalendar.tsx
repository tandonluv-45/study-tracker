"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTasks, fetchCalendar, disconnectCalendar, type Task, type CalEvent } from "@/lib/api";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import s from "./orbit.module.css";

export default function OrbitCalendar({ onClose }: { onClose: () => void }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const start = format(startOfMonth(month), "yyyy-MM-dd");
    const end = format(endOfMonth(month), "yyyy-MM-dd");
    fetchTasks().then((all) => setTasks(all.filter((t) => t.date >= start && t.date <= end)));
  }, [month]);

  const loadEvents = useCallback(async () => {
    const { connected, events } = await fetchCalendar(
      startOfWeek(startOfMonth(month)).toISOString(),
      endOfWeek(endOfMonth(month)).toISOString()
    );
    setConnected(connected);
    setEvents(events);
  }, [month]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  const tasksOn = (d: Date) => tasks.filter((t) => t.date === format(d, "yyyy-MM-dd"));
  const eventsOn = (d: Date) => events.filter((e) => e.start && isSameDay(new Date(e.start), d));

  const cells: Date[] = [];
  let day = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  while (day <= end) { cells.push(day); day = addDays(day, 1); }

  const selTasks = tasksOn(selected);
  const selEvents = eventsOn(selected);

  return (
    <div className={s.modal}>
      <div className={s.modalHead}>
        <div className={s.modalTitle}>Calendar<small>{format(month, "MMMM yyyy")}</small></div>
        <button className={s.modalDone} onClick={onClose}>Done</button>
      </div>
      <div className={s.modalBody}>
        <div className={s.calHead}>
          <button className={s.calNav} onClick={() => setMonth(subMonths(month, 1))}>‹</button>
          <span style={{ fontFamily: "var(--fontD)", fontWeight: 600 }}>{format(month, "MMMM yyyy")}</span>
          <button className={s.calNav} onClick={() => setMonth(addMonths(month, 1))}>›</button>
        </div>
        <div className={s.calGrid}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className={s.calDow}>{d}</div>)}
          {cells.map((d, i) => {
            const inMonth = isSameMonth(d, month);
            const isSel = isSameDay(d, selected);
            const isToday = isSameDay(d, new Date());
            const nTask = tasksOn(d).length;
            const nEv = eventsOn(d).length;
            return (
              <button key={i} onClick={() => setSelected(d)}
                className={`${s.calCell} ${!inMonth ? s.calCellMuted : ""} ${isSel ? s.calCellSel : ""}`}
                style={isToday ? { fontWeight: 700, borderColor: "var(--muted)" } : undefined}>
                {format(d, "d")}
                <span className={s.calDots}>
                  {nTask > 0 && <span className={s.calDot} />}
                  {nEv > 0 && <span className={s.calDot} style={{ background: "var(--violet)" }} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className={s.sec}><h3>{format(selected, "EEE, dd MMM")}</h3>{connected && <span className={s.n} style={{ color: "var(--ok)" }}>✓ Google synced</span>}</div>
        {!connected && (
          <a className={s.moreRow} href="/api/auth/google?mode=calendar">Connect Google Calendar <span>Sync events ›</span></a>
        )}
        {selEvents.map((e) => (
          <div key={e.id} className={s.finRow} style={{ marginTop: 8 }}>
            <div style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: "var(--violet)" }} />
            <div style={{ flex: 1 }}>
              <div className={s.pT}>{e.summary}</div>
              <div className={s.pSub}>{e.allDay ? "All day" : format(new Date(e.start), "HH:mm")}{e.location ? ` · ${e.location}` : ""} · Google</div>
            </div>
          </div>
        ))}
        {selTasks.map((t) => (
          <div key={t.id} className={s.finRow} style={{ marginTop: 8 }}>
            <div style={{ flex: 1 }}><div className={s.pT} style={t.completed ? { textDecoration: "line-through", color: "var(--dim)" } : undefined}>{t.title}</div><div className={s.pSub}>Task{t.subject ? ` · ${t.subject}` : ""}</div></div>
          </div>
        ))}
        {selTasks.length === 0 && selEvents.length === 0 && <p className={s.appEmpty}>Nothing on this day.</p>}
        {connected && (
          <button className={s.recheck} style={{ marginTop: 18 }} onClick={async () => { await disconnectCalendar(); loadEvents(); }}>Disconnect Google Calendar</button>
        )}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
