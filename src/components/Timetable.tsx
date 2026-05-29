"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { fetchTimetable, createTimetableSlot, deleteTimetableSlot, type TimetableSlot } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TYPES: TimetableSlot["type"][] = ["lecture", "lab", "tutorial"];
const typeColors: Record<string, string> = {
  lecture: "bg-accent-muted border-accent text-accent",
  lab: "bg-green-muted border-green text-green",
  tutorial: "bg-amber-muted border-amber text-amber",
};

export default function Timetable() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ day: "Monday", startTime: "09:00", endTime: "10:00", subject: "", room: "", type: "lecture" as TimetableSlot["type"] });

  const reload = async () => setSlots(await fetchTimetable());
  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    if (!form.subject.trim()) return;
    await createTimetableSlot({ day: form.day, startTime: form.startTime, endTime: form.endTime, subject: form.subject.trim(), room: form.room.trim() || undefined, type: form.type });
    setForm({ ...form, subject: "", room: "" });
    setShowAdd(false);
    reload();
  };

  const handleDelete = async (id: string) => { await deleteTimetableSlot(id); reload(); };

  const getSlotsByDay = (day: string) => slots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">College Timetable</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-muted text-accent hover:bg-accent/20 transition-colors">
          <Plus size={14} /> Add Class
        </button>
      </div>

      {showAdd && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-5 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">Add a Class</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent">
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent" />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent" />
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject name"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
            <input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Room (optional)"
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TimetableSlot["type"] })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent">
              {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={handleAdd}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">Add to Timetable</button>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Clock size={40} className="mx-auto text-text-dim mb-3" />
          <p className="text-sm text-text-muted mb-1">No classes added yet.</p>
          <p className="text-xs text-text-dim">Click &ldquo;Add Class&rdquo; to set up your timetable.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySlots = getSlotsByDay(day);
            if (daySlots.length === 0) return null;
            return (
              <div key={day}>
                <h3 className="text-sm font-semibold text-text-muted mb-2">{day}</h3>
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div key={slot.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border-l-2 ${typeColors[slot.type]} bg-surface border border-border`}>
                      <div className="text-xs sm:text-sm font-mono text-text-muted min-w-[90px]">{slot.startTime} - {slot.endTime}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{slot.subject}</p>
                        {slot.room && <p className="text-xs text-text-muted">Room: {slot.room}</p>}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{slot.type}</span>
                      <button onClick={() => handleDelete(slot.id)}
                        className="p-1 rounded hover:bg-red-muted text-text-dim hover:text-red transition-colors shrink-0"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
