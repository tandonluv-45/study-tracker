"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Unlink } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fetchTasks, type Task } from "@/lib/api";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsConnected(!!localStorage.getItem("google_access_token"));
  }, []);

  const fetchEvents = useCallback(async () => {
    const token = localStorage.getItem("google_access_token");
    if (!token) return;
    setLoading(true);
    try {
      const timeMin = startOfMonth(currentMonth).toISOString();
      const timeMax = endOfMonth(currentMonth).toISOString();
      const res = await fetch(`/api/calendar?timeMin=${timeMin}&timeMax=${timeMax}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setEvents(data.events || []); }
      else if (res.status === 401) { localStorage.removeItem("google_access_token"); setIsConnected(false); }
    } catch { /* silently fail */ }
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { if (isConnected) fetchEvents(); }, [isConnected, fetchEvents]);

  useEffect(() => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    fetchTasks().then((all) => setTasks(all.filter((t) => t.date >= start && t.date <= end)));
  }, [currentMonth]);

  const handleConnect = () => { window.location.href = "/api/auth/google?mode=calendar"; };
  const handleDisconnect = () => { localStorage.removeItem("google_access_token"); localStorage.removeItem("google_refresh_token"); setIsConnected(false); setEvents([]); };

  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(endOfMonth(currentMonth));
    const rows: React.ReactNode[] = [];
    let day = calStart;
    while (day <= calEnd) {
      const week: React.ReactNode[] = [];
      for (let i = 0; i < 7; i++) {
        const d = day;
        const dateStr = format(d, "yyyy-MM-dd");
        const dayTasks = tasks.filter((t) => t.date === dateStr);
        const dayEvents = events.filter((e) => isSameDay(new Date(e.start), d));
        week.push(
          <button key={dateStr} onClick={() => setSelectedDate(d)}
            className={`relative p-2 min-h-[80px] text-left rounded-lg border transition-all ${
              isSameDay(d, selectedDate) ? "border-accent bg-accent-muted" : "border-transparent hover:bg-surface-hover"
            } ${!isSameMonth(d, currentMonth) ? "opacity-30" : ""}`}>
            <span className={`text-xs font-medium ${isSameDay(d, new Date()) ? "bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-text-muted"}`}>
              {format(d, "d")}
            </span>
            <div className="mt-1 space-y-0.5">
              {dayTasks.slice(0, 2).map((t) => (
                <div key={t.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${t.completed ? "bg-green-muted text-green" : "bg-accent-muted text-accent"}`}>{t.title}</div>
              ))}
              {dayEvents.slice(0, 2).map((e) => (
                <div key={e.id} className="text-[10px] px-1 py-0.5 rounded truncate bg-blue-muted text-blue">{e.summary}</div>
              ))}
              {dayTasks.length + dayEvents.length > 4 && <span className="text-[10px] text-text-dim">+{dayTasks.length + dayEvents.length - 4} more</span>}
            </div>
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toISOString()} className="grid grid-cols-7 gap-1">{week}</div>);
    }
    return rows;
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedTasks = tasks.filter((t) => t.date === selectedDateStr);
  const selectedEvents = events.filter((e) => isSameDay(new Date(e.start), selectedDate));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Calendar</h2>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button onClick={fetchEvents} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green bg-green-muted hover:bg-green/20 transition-colors">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Google Connected
              </button>
              <button onClick={handleDisconnect} className="p-1.5 rounded-lg text-text-dim hover:text-red hover:bg-red-muted transition-colors"><Unlink size={14} /></button>
            </>
          ) : (
            <button onClick={handleConnect}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-muted text-blue hover:bg-blue/20 transition-colors">
              <ExternalLink size={14} /> Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><ChevronLeft size={18} /></button>
          <span className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="text-[10px] font-semibold text-text-dim text-center py-1 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {renderDays()}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-muted mb-3">{format(selectedDate, "EEEE, MMMM d")}</h3>
        {selectedTasks.length === 0 && selectedEvents.length === 0 ? (
          <p className="text-sm text-text-dim py-4 text-center">Nothing scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-muted">
                <div className="w-2 h-2 rounded-full bg-blue shrink-0" />
                <span className="text-sm text-blue">{e.summary}</span>
                <span className="text-xs text-text-dim ml-auto">{format(new Date(e.start), "h:mm a")}</span>
              </div>
            ))}
            {selectedTasks.map((t) => (
              <div key={t.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t.completed ? "bg-green-muted" : "bg-accent-muted"}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.completed ? "bg-green" : "bg-accent"}`} />
                <span className={`text-sm ${t.completed ? "text-green line-through" : "text-accent"}`}>{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
