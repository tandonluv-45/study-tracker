"use client";

import { useState, useEffect } from "react";
import {
  Target, Zap, TrendingUp, Clock, ArrowRight, CheckCircle2, Circle, Wallet, TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { getCurrentMonthData, getNextMonthData, roadmap } from "@/lib/roadmap-data";
import { fetchTasks, fetchGoals, fetchPomodoro, fetchExpenses, fetchIncomes, initDatabase, type UserSession } from "@/lib/api";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  user: UserSession | null;
}

export default function Dashboard({ onNavigate, user }: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = getCurrentMonthData();
  const nextMonth = getNextMonthData();
  const monthKey = `${currentMonth.shortMonth}-${currentMonth.year}`;
  const currentMonthStr = format(new Date(), "yyyy-MM");

  const [todayTasks, setTodayTasks] = useState({ total: 0, completed: 0 });
  const [monthProgress, setMonthProgress] = useState(0);
  const [pomodoroToday, setPomodoroToday] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [monthProgresses, setMonthProgresses] = useState<Record<string, number>>({});
  const [financials, setFinancials] = useState({ income: 0, expenses: 0, balance: 0 });

  useEffect(() => {
    async function load() {
      await initDatabase();
      setMounted(true);

      const [tasks, completions, sessions, expenses, incomes] = await Promise.all([
        fetchTasks(today),
        fetchGoals(),
        fetchPomodoro(today),
        fetchExpenses(currentMonthStr),
        fetchIncomes(currentMonthStr),
      ]);

      setTodayTasks({ total: tasks.length, completed: tasks.filter((t) => t.completed).length });
      setPomodoroToday(sessions.length);

      const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      setFinancials({ income: totalIncome, expenses: totalExpenses, balance: totalIncome - totalExpenses });

      const completedForMonth = completions.filter((c) => c.monthKey === monthKey && c.completed).length;
      const mp = currentMonth.goals.length > 0
        ? Math.round((completedForMonth / currentMonth.goals.length) * 100) : 0;
      setMonthProgress(mp);

      let totalGoals = 0, completedGoals = 0;
      const mps: Record<string, number> = {};
      roadmap.forEach((m) => {
        totalGoals += m.goals.length;
        const mKey = `${m.shortMonth}-${m.year}`;
        const cnt = completions.filter((c) => c.monthKey === mKey && c.completed).length;
        completedGoals += cnt;
        mps[mKey] = m.goals.length > 0 ? Math.round((cnt / m.goals.length) * 100) : 0;
      });
      setOverallProgress(totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0);
      setMonthProgresses(mps);
    }
    load();
  }, [today, monthKey, currentMonth.goals.length, currentMonthStr]);

  if (!mounted) return null;

  const greeting = getGreeting();
  const displayName = user?.name?.split(" ")[0] || "there";

  const phaseColors: Record<string, string> = {
    P0: "bg-red-muted text-red", P1: "bg-amber-muted text-amber",
    P2: "bg-accent-muted text-accent", P3: "bg-blue-muted text-blue",
    "P3→4": "bg-green-muted text-green", P4: "bg-green-muted text-green",
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Good {greeting}, {displayName}</h1>
        <p className="text-sm text-text-muted">
          {format(new Date(), "EEEE, MMMM d, yyyy")} &middot; {currentMonth.theme}
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-md ${phaseColors[currentMonth.phase] || "bg-accent-muted text-accent"}`}>
            {currentMonth.phase}
          </span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Target size={18} />} label="Month Progress" value={`${monthProgress}%`}
          sub={`${currentMonth.month} goals`} color="accent" onClick={() => onNavigate("goals")} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Today's Tasks" value={`${todayTasks.completed}/${todayTasks.total}`}
          sub={todayTasks.total === 0 ? "No tasks yet" : "completed"} color="green" onClick={() => onNavigate("tasks")} />
        <StatCard icon={<Clock size={18} />} label="Pomodoros Today" value={String(pomodoroToday)}
          sub={`${Math.round((pomodoroToday * 25) / 60 * 10) / 10}h focus`} color="amber" onClick={() => onNavigate("pomodoro")} />
        <StatCard icon={<TrendingUp size={18} />} label="Overall Progress" value={`${overallProgress}%`}
          sub="All months" color="blue" />
      </div>

      {/* Finance summary */}
      <button onClick={() => onNavigate("expenses")} className="w-full text-left">
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-light transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              This Month&apos;s Finances
            </h3>
            <span className="text-xs text-accent font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={14} className="text-green" />
                <span className="text-xs text-text-muted">Income</span>
              </div>
              <p className="text-lg font-bold text-green">&#8377;{financials.income.toFixed(0)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={14} className="text-red" />
                <span className="text-xs text-text-muted">Spent</span>
              </div>
              <p className="text-lg font-bold text-red">&#8377;{financials.expenses.toFixed(0)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet size={14} className={financials.balance >= 0 ? "text-green" : "text-red"} />
                <span className="text-xs text-text-muted">Balance</span>
              </div>
              <p className={`text-lg font-bold ${financials.balance >= 0 ? "text-green" : "text-red"}`}>
                &#8377;{financials.balance.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Focus + Next month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">This Month&apos;s Focus</h3>
            <button onClick={() => onNavigate("goals")}
              className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3 mb-4">
            <FocusItem icon={<Zap size={14} />} label="DSA" value={currentMonth.dsa} />
            <FocusItem icon={<Zap size={14} />} label="AI" value={currentMonth.ai} />
            <FocusItem icon={<Zap size={14} />} label="Core CS" value={currentMonth.coreCS} />
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-text-muted mb-1">Month-end goal:</p>
            <p className="text-sm font-medium text-accent">{currentMonth.monthEndGoal}</p>
          </div>
        </div>

        {nextMonth && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Coming Up: {nextMonth.month}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${phaseColors[nextMonth.phase] || "bg-accent-muted text-accent"}`}>
                {nextMonth.phase}
              </span>
            </div>
            <p className="text-sm text-text mb-3">{nextMonth.theme}</p>
            <div className="space-y-2">
              {nextMonth.goals.slice(0, 5).map((goal, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Circle size={8} className="text-text-dim mt-1.5 shrink-0" />
                  <span className="text-sm text-text-muted">{goal}</span>
                </div>
              ))}
              {nextMonth.goals.length > 5 && (
                <p className="text-xs text-text-dim ml-4">+{nextMonth.goals.length - 5} more goals</p>
              )}
            </div>
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-text-muted">{nextMonth.hrsPerWeek} hrs/week &middot; {nextMonth.monthEndGoal}</p>
            </div>
          </div>
        )}
      </div>

      {/* Year overview */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Year Overview</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {roadmap.map((m) => {
            const mKey = `${m.shortMonth}-${m.year}`;
            const isCurrent = mKey === monthKey;
            return (
              <button key={mKey} onClick={() => onNavigate("goals")}
                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isCurrent ? "bg-accent-muted border border-accent" : "hover:bg-surface-hover border border-transparent"
                }`}>
                <span className={`text-xs font-semibold ${isCurrent ? "text-accent" : "text-text-muted"}`}>{m.shortMonth}</span>
                <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">
                  <span className="text-[10px] font-bold">{monthProgresses[mKey] || 0}%</span>
                </div>
                <span className="text-[9px] text-text-dim">{m.phase}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function StatCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; onClick?: () => void;
}) {
  const colorMap: Record<string, string> = {
    accent: "bg-accent-muted text-accent", green: "bg-green-muted text-green",
    amber: "bg-amber-muted text-amber", blue: "bg-blue-muted text-blue",
  };
  return (
    <button onClick={onClick} className="bg-surface border border-border rounded-xl p-3 sm:p-4 text-left hover:border-border-light transition-all group">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
        <span className="text-[11px] sm:text-xs font-medium text-text-muted">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
      <p className="text-[11px] sm:text-xs text-text-dim mt-0.5">{sub}</p>
    </button>
  );
}

function FocusItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-text-dim">{icon}</div>
      <div>
        <span className="text-xs font-semibold text-text-muted">{label}</span>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
