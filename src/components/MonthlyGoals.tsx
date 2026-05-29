"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, Zap, BookOpen, Cpu, Target, Plus, X } from "lucide-react";
import { roadmap } from "@/lib/roadmap-data";
import {
  fetchGoals, toggleGoal as apiToggleGoal,
  fetchUserRoadmap, saveUserRoadmap,
  type UserSession, type UserRoadmapMonth,
} from "@/lib/api";

interface MonthlyGoalsProps {
  user: UserSession | null;
}

export default function MonthlyGoals({ user }: MonthlyGoalsProps) {
  const isOwner = user?.isOwner ?? false;

  if (isOwner) return <OwnerGoals />;
  return <UserGoals />;
}

function OwnerGoals() {
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
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

      <GoalChecklist goals={currentMonth.goals} completions={completions} onToggle={handleToggle}
        completedCount={completedCount} progress={progress} />
    </div>
  );
}

function UserGoals() {
  const [userMonths, setUserMonths] = useState<UserRoadmapMonth[]>([]);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [newGoal, setNewGoal] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const [monthOffset, setMonthOffset] = useState(0);

  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const currentMonthLabel = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

  const currentUserMonth = userMonths.find((m) => m.month === currentMonthLabel);
  const goals = currentUserMonth?.goals || [];

  const loadData = useCallback(async () => {
    const [roadmapData, goalData] = await Promise.all([
      fetchUserRoadmap(),
      fetchGoals(),
    ]);
    setUserMonths(roadmapData);

    const map: Record<number, boolean> = {};
    const currentMonth = roadmapData.find((m) => m.month === currentMonthLabel);
    if (currentMonth) {
      currentMonth.goals.forEach((_, i) => {
        map[i] = goalData.some((g) => g.monthKey === currentMonthLabel && g.goalIndex === i && g.completed);
      });
      setTheme(currentMonth.theme);
    } else {
      setTheme("");
    }
    setCompletions(map);
    setLoading(false);
  }, [currentMonthLabel]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;
    const updatedGoals = [...goals, newGoal.trim()];
    await saveUserRoadmap(currentMonthLabel, theme, updatedGoals);
    setNewGoal("");
    await loadData();
  };

  const handleRemoveGoal = async (index: number) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    await saveUserRoadmap(currentMonthLabel, theme, updatedGoals);
    await loadData();
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    await saveUserRoadmap(currentMonthLabel, newTheme, goals);
  };

  const handleToggle = async (goalIndex: number) => {
    setCompletions((prev) => ({ ...prev, [goalIndex]: !prev[goalIndex] }));
    await apiToggleGoal(currentMonthLabel, goalIndex);
  };

  if (loading) return null;

  const completedCount = Object.values(completions).filter(Boolean).length;
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-xl font-bold">Monthly Goals</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">{currentMonthLabel}</span>
          <button onClick={() => setMonthOffset((o) => o + 1)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
          Theme / Focus
        </label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onBlur={(e) => handleThemeChange(e.target.value)}
          placeholder="e.g. DSA Sprint, Interview Prep, Project Build..."
          className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-accent placeholder:text-text-dim"
        />
      </div>

      {/* Add goal */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Add a Goal</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
            placeholder="What do you want to achieve this month?"
            className="flex-1 min-w-0 px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-accent placeholder:text-text-dim"
          />
          <button onClick={handleAddGoal} disabled={!newGoal.trim()}
            className="px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Goals checklist */}
      {goals.length > 0 ? (
        <GoalChecklist goals={goals} completions={completions} onToggle={handleToggle}
          completedCount={completedCount} progress={progress} onRemove={handleRemoveGoal} />
      ) : (
        <div className="bg-surface border border-border rounded-xl p-8 sm:p-12 text-center">
          <Target size={32} className="mx-auto text-text-dim mb-3" />
          <p className="text-sm text-text-muted mb-1">No goals yet for {currentMonthLabel}</p>
          <p className="text-xs text-text-dim">Add your first goal above to get started!</p>
        </div>
      )}
    </div>
  );
}

function GoalChecklist({ goals, completions, onToggle, completedCount, progress, onRemove }: {
  goals: string[];
  completions: Record<number, boolean>;
  onToggle: (i: number) => void;
  completedCount: number;
  progress: number;
  onRemove?: (i: number) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Goals Checklist</h3>
        <span className="text-sm text-text-muted">{completedCount}/{goals.length} done</span>
      </div>
      <div className="w-full bg-border rounded-full h-2 mb-5">
        <div className="h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: progress >= 80 ? "var(--color-green)" : progress >= 50 ? "var(--color-accent)" : "var(--color-amber)" }} />
      </div>
      <div className="space-y-2">
        {goals.map((goal, i) => (
          <div key={i} className="flex items-start gap-1">
            <button onClick={() => onToggle(i)}
              className={`flex-1 min-w-0 flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${completions[i] ? "bg-green-muted" : "hover:bg-surface-hover"}`}>
              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${completions[i] ? "bg-green border-green" : "border-border-light"}`}>
                {completions[i] && <Check size={12} className="text-white" />}
              </div>
              <span className={`text-sm break-words ${completions[i] ? "text-text-muted line-through" : "text-text"}`}>{goal}</span>
            </button>
            {onRemove && (
              <button onClick={() => onRemove(i)}
                className="p-2 rounded-lg text-text-dim hover:text-red hover:bg-red-muted transition-colors shrink-0 mt-0.5">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
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
