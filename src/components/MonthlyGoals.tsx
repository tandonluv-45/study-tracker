"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, Zap, BookOpen, Cpu, Target } from "lucide-react";
import { roadmap } from "@/lib/roadmap-data";
import { fetchGoals, toggleGoal as apiToggleGoal } from "@/lib/api";

export default function MonthlyGoals() {
  const [monthIndex, setMonthIndex] = useState(0);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const currentMonth = roadmap[monthIndex];
  const monthKey = `${currentMonth.shortMonth}-${currentMonth.year}`;

  useEffect(() => {
    const now = new Date();
    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];
    const idx = roadmap.findIndex(
      (m) => m.month === monthNames[now.getMonth()] && m.year === now.getFullYear()
    );
    if (idx !== -1) setMonthIndex(idx);
  }, []);

  const loadGoals = useCallback(async () => {
    const all = await fetchGoals();
    const map: Record<number, boolean> = {};
    currentMonth.goals.forEach((_, i) => {
      map[i] = all.some((g) => g.monthKey === monthKey && g.goalIndex === i && g.completed);
    });
    setCompletions(map);
  }, [monthKey, currentMonth.goals]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const handleToggle = async (goalIndex: number) => {
    setCompletions((prev) => ({ ...prev, [goalIndex]: !prev[goalIndex] }));
    await apiToggleGoal(monthKey, goalIndex);
  };

  const completedCount = Object.values(completions).filter(Boolean).length;
  const progress = currentMonth.goals.length > 0
    ? Math.round((completedCount / currentMonth.goals.length) * 100) : 0;

  const phaseColors: Record<string, string> = {
    P0: "bg-red-muted text-red", P1: "bg-amber-muted text-amber",
    P2: "bg-accent-muted text-accent", P3: "bg-blue-muted text-blue",
    "P3→4": "bg-green-muted text-green", P4: "bg-green-muted text-green",
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Monthly Goals</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setMonthIndex((i) => Math.max(0, i - 1))} disabled={monthIndex === 0}
            className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {currentMonth.month} {currentMonth.year}
          </span>
          <button onClick={() => setMonthIndex((i) => Math.min(roadmap.length - 1, i + 1))}
            disabled={monthIndex === roadmap.length - 1}
            className="p-1.5 rounded-lg hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-muted hover:text-text transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <InfoCard icon={<Target size={16} />} label="Theme" value={currentMonth.theme}
          badge={currentMonth.phase} badgeClass={phaseColors[currentMonth.phase] || "bg-accent-muted text-accent"} />
        <InfoCard icon={<Zap size={16} />} label="Hours/Week" value={currentMonth.hrsPerWeek} />
        <InfoCard icon={<BookOpen size={16} />} label="Month-end Goal" value={currentMonth.monthEndGoal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <TrackCard icon={<Cpu size={14} />} title="DSA" content={currentMonth.dsa} color="accent" />
        <TrackCard icon={<Cpu size={14} />} title="AI & Projects" content={currentMonth.ai} color="green" />
        <TrackCard icon={<BookOpen size={14} />} title="Core CS / Other" content={currentMonth.coreCS} color="amber" />
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Goals Checklist</h3>
          <span className="text-sm text-text-muted">{completedCount}/{currentMonth.goals.length} done</span>
        </div>
        <div className="w-full bg-border rounded-full h-2 mb-5">
          <div className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: progress >= 80 ? "var(--color-green)" : progress >= 50 ? "var(--color-accent)" : "var(--color-amber)" }} />
        </div>
        <div className="space-y-2">
          {currentMonth.goals.map((goal, i) => (
            <button key={i} onClick={() => handleToggle(i)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${completions[i] ? "bg-green-muted" : "hover:bg-surface-hover"}`}>
              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${completions[i] ? "bg-green border-green" : "border-border-light"}`}>
                {completions[i] && <Check size={12} className="text-white" />}
              </div>
              <span className={`text-sm ${completions[i] ? "text-text-muted line-through" : "text-text"}`}>{goal}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, badge, badgeClass }: {
  icon: React.ReactNode; label: string; value: string; badge?: string; badgeClass?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {badge && <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-md ${badgeClass}`}>{badge}</span>}
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function TrackCard({ icon, title, content, color }: {
  icon: React.ReactNode; title: string; content: string; color: string;
}) {
  const colorMap: Record<string, string> = { accent: "border-l-accent", green: "border-l-green", amber: "border-l-amber", blue: "border-l-blue" };
  return (
    <div className={`bg-surface border border-border border-l-2 ${colorMap[color]} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
      </div>
      <p className="text-sm text-text">{content}</p>
    </div>
  );
}
