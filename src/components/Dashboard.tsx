"use client";

import { useState, useEffect } from "react";
import {
  Target, Zap, TrendingUp, Clock, ArrowRight, CheckCircle2, Circle, Wallet, TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { getCurrentMonthData, getNextMonthData, roadmap } from "@/lib/roadmap-data";
import {
  fetchTasks, fetchGoals, fetchPomodoro, fetchExpenses, fetchIncomes,
  fetchUserRoadmap, initDatabase, type UserSession, type UserRoadmapMonth,
} from "@/lib/api";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  user: UserSession | null;
}

export default function Dashboard({ onNavigate, user }: DashboardProps) {
  const [mounted, setMounted] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const isOwner = user?.isOwner ?? false;

  const [todayTasks, setTodayTasks] = useState({ total: 0, completed: 0 });
  const [pomodoroToday, setPomodoroToday] = useState(0);
  const [financials, setFinancials] = useState({ income: 0, expenses: 0, balance: 0 });

  // Owner-only state
  const [monthProgress, setMonthProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [monthProgresses, setMonthProgresses] = useState<Record<string, number>>({});

  // Non-owner state
  const [userGoalCount, setUserGoalCount] = useState(0);
  const [userGoalCompleted, setUserGoalCompleted] = useState(0);

  const currentMonth = isOwner ? getCurrentMonthData() : null;
  const nextMonth = isOwner ? getNextMonthData() : null;
  const monthKey = currentMonth ? `${currentMonth.shortMonth}-${currentMonth.year}` : "";

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

      if (isOwner && currentMonth) {
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
      } else {
        const userRoadmap = await fetchUserRoadmap();
        const now = new Date();
        const currentMonthLabel = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
        const currentUserMonth = userRoadmap.find((m) => m.month === currentMonthLabel);
        if (currentUserMonth) {
          const goalCount = currentUserMonth.goals.length;
          const mKey = currentMonthLabel;
          const completedCount = completions.filter((c) => c.monthKey === mKey && c.completed).length;
          setUserGoalCount(goalCount);
          setUserGoalCompleted(Math.min(completedCount, goalCount));
        }
      }
    }
    load();
  }, [today, monthKey, currentMonth?.goals.length, currentMonthStr, isOwner]);

  if (!mounted) return null;

  const greeting = getGreeting();
  const displayName = user?.name?.split(" ")[0] || "there";

  const phaseColors: Record<string, string> = {
    P0: "bg-red-muted text-red", P1: "bg-amber-muted text-amber",
    P2: "bg-accent-muted text-accent", P3: "bg-blue-muted text-blue",
    "P3→4": "bg-green-muted text-green", P4: "bg-green-muted text-green",
  };

  return (
    <div className="animate-fade-in space-y-5 sm:space-y-6 min-w-0 w-full overflow-hidden">
      {/* Greeting */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Good {greeting}, {displayName}</h1>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <p className="text-xs sm:text-sm text-text-muted">
            {format(new Date(), "EEE, MMM d, yyyy")}
            {isOwner && currentMonth && <> &middot; {currentMonth.theme}</>}
          </p>
          {isOwner && currentMonth && (
            <span className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md ${phaseColors[currentMonth.phase] || "bg-accent-muted text-accent"}`}>
              {currentMonth.phase}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {isOwner ? (
          <StatCard icon={<Target size={16} />} label="Month" value={`${monthProgress}%`}
            sub={`${currentMonth!.month} goals`} color="accent" onClick={() => onNavigate("goals")} />
        ) : (
          <StatCard icon={<Target size={16} />} label="Goals" value={userGoalCount > 0 ? `${userGoalCompleted}/${userGoalCount}` : "—"}
            sub={userGoalCount > 0 ? "this month" : "Set goals"} color="accent" onClick={() => onNavigate("goals")} />
        )}
        <StatCard icon={<CheckCircle2 size={16} />} label="Tasks" value={`${todayTasks.completed}/${todayTasks.total}`}
          sub={todayTasks.total === 0 ? "No tasks" : "completed"} color="green" onClick={() => onNavigate("tasks")} />
        <StatCard icon={<Clock size={16} />} label="Pomodoros" value={String(pomodoroToday)}
          sub={`${Math.round((pomodoroToday * 25) / 60 * 10) / 10}h focus`} color="amber" onClick={() => onNavigate("pomodoro")} />
        {isOwner ? (
          <StatCard icon={<TrendingUp size={16} />} label="Overall" value={`${overallProgress}%`}
            sub="All months" color="blue" />
        ) : (
          <StatCard icon={<Wallet size={16} />} label="Balance" value={`₹${financials.balance.toFixed(0)}`}
            sub="this month" color="blue" onClick={() => onNavigate("expenses")} />
        )}
      </div>

      {/* Finance summary */}
      <button onClick={() => onNavigate("expenses")} className="w-full text-left">
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 hover:border-border-light transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">Finances</h3>
            <span className="text-xs text-accent font-medium flex items-center gap-1">
              View <ArrowRight size={12} />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={12} className="text-green shrink-0" />
                <span className="text-[10px] sm:text-xs text-text-muted">Income</span>
              </div>
              <p className="text-sm sm:text-lg font-bold text-green truncate">&#8377;{financials.income.toFixed(0)}</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown size={12} className="text-red shrink-0" />
                <span className="text-[10px] sm:text-xs text-text-muted">Spent</span>
              </div>
              <p className="text-sm sm:text-lg font-bold text-red truncate">&#8377;{financials.expenses.toFixed(0)}</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <Wallet size={12} className={`shrink-0 ${financials.balance >= 0 ? "text-green" : "text-red"}`} />
                <span className="text-[10px] sm:text-xs text-text-muted">Balance</span>
              </div>
              <p className={`text-sm sm:text-lg font-bold truncate ${financials.balance >= 0 ? "text-green" : "text-red"}`}>
                &#8377;{financials.balance.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Owner-only: Focus + Next month */}
      {isOwner && currentMonth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">This Month</h3>
              <button onClick={() => onNavigate("goals")}
                className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1">
                Goals <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <FocusItem icon={<Zap size={14} />} label="DSA" value={currentMonth.dsa} />
              <FocusItem icon={<Zap size={14} />} label="AI" value={currentMonth.ai} />
              <FocusItem icon={<Zap size={14} />} label="Core CS" value={currentMonth.coreCS} />
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-text-muted mb-1">Month-end goal:</p>
              <p className="text-xs sm:text-sm font-medium text-accent">{currentMonth.monthEndGoal}</p>
            </div>
          </div>

          {nextMonth && (
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">Next: {nextMonth.month}</h3>
                <span className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md ${phaseColors[nextMonth.phase] || "bg-accent-muted text-accent"}`}>
                  {nextMonth.phase}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text mb-3">{nextMonth.theme}</p>
              <div className="space-y-2">
                {nextMonth.goals.slice(0, 4).map((goal, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Circle size={6} className="text-text-dim mt-1.5 shrink-0" />
                    <span className="text-xs sm:text-sm text-text-muted">{goal}</span>
                  </div>
                ))}
                {nextMonth.goals.length > 4 && (
                  <p className="text-xs text-text-dim ml-4">+{nextMonth.goals.length - 4} more</p>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-border">
                <p className="text-xs text-text-muted">{nextMonth.hrsPerWeek} hrs/week</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Non-owner: Quick actions */}
      {!isOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => onNavigate("goals")}
            className="bg-surface border border-border rounded-xl p-4 sm:p-5 text-left hover:border-border-light transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-accent" />
              <h3 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">Monthly Goals</h3>
            </div>
            <p className="text-sm text-text-muted">
              {userGoalCount > 0
                ? `${userGoalCompleted} of ${userGoalCount} goals completed this month`
                : "Set up your goals for this month"}
            </p>
            <span className="text-xs text-accent font-medium flex items-center gap-1 mt-3">
              {userGoalCount > 0 ? "View goals" : "Get started"} <ArrowRight size={12} />
            </span>
          </button>
          <button onClick={() => onNavigate("tasks")}
            className="bg-surface border border-border rounded-xl p-4 sm:p-5 text-left hover:border-border-light transition-all">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-green" />
              <h3 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider">Today&apos;s Tasks</h3>
            </div>
            <p className="text-sm text-text-muted">
              {todayTasks.total > 0
                ? `${todayTasks.completed} of ${todayTasks.total} tasks done today`
                : "No tasks yet. Add your first task!"}
            </p>
            <span className="text-xs text-accent font-medium flex items-center gap-1 mt-3">
              {todayTasks.total > 0 ? "View tasks" : "Add tasks"} <ArrowRight size={12} />
            </span>
          </button>
        </div>
      )}

      {/* Owner-only: Year overview */}
      {isOwner && (
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Year Overview</h3>
          <div className="overflow-x-auto -mx-4 px-4 sm:-mx-5 sm:px-5">
            <div className="flex gap-1.5 sm:gap-2 pb-2 min-w-max">
              {roadmap.map((m) => {
                const mKey = `${m.shortMonth}-${m.year}`;
                const isCurrent = mKey === monthKey;
                return (
                  <button key={mKey} onClick={() => onNavigate("goals")}
                    className={`shrink-0 flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
                      isCurrent ? "bg-accent-muted border border-accent" : "hover:bg-surface-hover border border-transparent"
                    }`}>
                    <span className={`text-[10px] sm:text-xs font-semibold ${isCurrent ? "text-accent" : "text-text-muted"}`}>{m.shortMonth}</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-border flex items-center justify-center">
                      <span className="text-[9px] sm:text-[10px] font-bold">{monthProgresses[mKey] || 0}%</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-text-dim">{m.phase}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
    <button onClick={onClick} className="bg-surface border border-border rounded-xl p-3 text-left hover:border-border-light transition-all min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>{icon}</div>
        <span className="text-[10px] sm:text-xs font-medium text-text-muted truncate">{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs text-text-dim mt-0.5 truncate">{sub}</p>
    </button>
  );
}

function FocusItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="mt-0.5 text-text-dim shrink-0">{icon}</div>
      <div className="min-w-0">
        <span className="text-[10px] sm:text-xs font-semibold text-text-muted">{label}</span>
        <p className="text-xs sm:text-sm break-words">{value}</p>
      </div>
    </div>
  );
}
