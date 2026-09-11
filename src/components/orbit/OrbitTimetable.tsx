"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTimetable, createTimetableSlot, deleteTimetableSlot, type TimetableSlot } from "@/lib/api";
import s from "./orbit.module.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPES: TimetableSlot["type"][] = ["lecture", "lab", "tutorial"];
const typeColor: Record<string, string> = {
  lecture: "#8FA6C0", lab: "#7CE7A6", tutorial: "#E0B15E",
};

export default function OrbitTimetable({ onClose }: { onClose: () => void }) {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ day: "Monday", startTime: "09:00", endTime: "10:00", subject: "", room: "", type: "lecture" as TimetableSlot["type"] });

  const reload = useCallback(() => { fetchTimetable().then(setSlots); }, []);
  useEffect(() => { reload(); }, [reload]);

  const add = async () => {
    if (!form.subject.trim()) return;
    await createTimetableSlot({ day: form.day, startTime: form.startTime, endTime: form.endTime, subject: form.subject.trim(), room: form.room.trim() || undefined, type: form.type });
    setForm({ ...form, subject: "", room: "" });
    setShowAdd(false);
    reload();
  };
  const del = async (id: string) => { await deleteTimetableSlot(id); reload(); };
  const byDay = (d: string) => slots.filter((x) => x.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className={s.modal}>
      <div className={s.modalHead}>
        <div className={s.modalTitle}>Timetable<small>{slots.length} classes</small></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={s.modalDone} style={{ background: "none", color: "var(--text)", border: "1px solid var(--line)" }} onClick={() => setShowAdd((v) => !v)}>{showAdd ? "Cancel" : "+ Add"}</button>
          <button className={s.modalDone} onClick={onClose}>Done</button>
        </div>
      </div>
      <div className={s.modalBody}>
        {showAdd && (
          <div className={s.finForm} style={{ marginTop: 0 }}>
            <input className={s.field} style={{ marginTop: 0 }} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" />
            <div style={{ display: "flex", gap: 8 }}>
              <select className={s.field} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
              <select className={s.field} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TimetableSlot["type"] })}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className={s.field} type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              <input className={s.field} type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className={s.field} style={{ flex: 1 }} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Room (optional)" />
              <button className={s.modalDone} style={{ marginTop: 8 }} onClick={add}>Save</button>
            </div>
          </div>
        )}
        {DAYS.map((d) => {
          const list = byDay(d);
          if (list.length === 0) return null;
          return (
            <div key={d} className={s.ttDay}>
              <div className={s.ttDayName}>{d}</div>
              {list.map((sl) => (
                <div key={sl.id} className={s.ttSlot}>
                  <div className={s.ttTime}>{sl.startTime}–{sl.endTime}</div>
                  <div className={s.ttSub}>{sl.subject}{sl.room && <small>Room {sl.room}</small>}</div>
                  <div className={s.ttType} style={{ color: typeColor[sl.type], border: `1px solid ${typeColor[sl.type]}44` }}>{sl.type}</div>
                  <button className={s.ttDel} onClick={() => del(sl.id)}>×</button>
                </div>
              ))}
            </div>
          );
        })}
        {slots.length === 0 && <p className={s.appEmpty}>No classes yet — tap “+ Add”.</p>}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
