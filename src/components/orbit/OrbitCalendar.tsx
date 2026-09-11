"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTasks, type Task } from "@/lib/api";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import s from "./orbit.module.css";

interface CalEvent { id: string; summary: string; start: string; end: string }

export default function OrbitCalendar({ onClose }: { onClose: () => void }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => { try { setConnected(!!localStorage.getItem("google_access_token")); } catch { /* ignore */ } }, []);

  useEffect(() => {
    const start = format(startOfMonth(month), "yyyy-MM-dd");
    const end = format(endOfMonth(month), "yyyy-MM-dd");
    fetchTasks().then((all) => setTasks(all.filter((t) => t.date >= start && t.date <= end)));
  }, [month]);

  const loadEvents = useCallback(async () => {
    let token = ""; try { token = localStorage.getItem("google_access_token") || ""; } catch { /* ignore */ }
    if (!token) return;
    try {
      const res = await fetch(`/api/calendar?timeMin=${startOfMonth(month).toISOString()}&timeMax=${endOfMonth(month).toISOString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setEvents(d.events || []); }
    } catch { /* ignore */ }
  }, [month]);
  useEffect(() => { if (connected) loadEvents(); }, [connected, loadEvents]);

  const tasksOn = (d: Date) => tasks.filter((t) => t.date === format(d, "yyyy-MM-dd"));
  const eventsOn = (d: Date) => events.filter((e) => isSameDay(new Date(e.start), d));

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
            const has = tasksOn(d).length + eventsOn(d).length > 0;
            return (
              <button key={i} onClick={() => setSelected(d)}
                className={`${s.calCell} ${!inMonth ? s.calCellMuted : ""} ${isSel ? s.calCellSel : ""}`}
                style={isToday ? { fontWeight: 700 } : undefined}>
                {format(d, "d")}
                {has && <span className={s.calDot} />}
              </button>
            );
          })}
        </div>

        <div className={s.sec}><h3>{format(selected, "EEE, dd MMM")}</h3></div>
        {!connected && (
          <a className={s.moreRow} href="/api/auth/google?mode=calendar">Connect Google Calendar <span>Sync events ›</span></a>
        )}
        {selEvents.map((e) => (
          <div key={e.id} className={s.finRow} style={{ marginTop: 8 }}>
            <div style={{ flex: 1 }}><div className={s.pT}>{e.summary}</div><div className={s.pSub}>{format(new Date(e.start), "HH:mm")} · Google</div></div>
          </div>
        ))}
        {selTasks.map((t) => (
          <div key={t.id} className={s.finRow} style={{ marginTop: 8 }}>
            <div style={{ flex: 1 }}><div className={s.pT} style={t.completed ? { textDecoration: "line-through", color: "var(--dim)" } : undefined}>{t.title}</div><div className={s.pSub}>Task{t.subject ? ` · ${t.subject}` : ""}</div></div>
          </div>
        ))}
        {selTasks.length === 0 && selEvents.length === 0 && <p className={s.appEmpty}>Nothing on this day.</p>}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
