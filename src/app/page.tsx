"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import MonthlyGoals from "@/components/MonthlyGoals";
import DailyTasks from "@/components/DailyTasks";
import PomodoroTimer from "@/components/PomodoroTimer";
import CalendarView from "@/components/CalendarView";
import Timetable from "@/components/Timetable";
import ExpenseTracker from "@/components/ExpenseTracker";
import { getSessionUser, type UserSession } from "@/lib/api";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionUser().then((u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center mx-auto mb-3 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </div>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} user={user} />;
      case "goals":
        return <MonthlyGoals user={user} />;
      case "tasks":
        return <DailyTasks />;
      case "pomodoro":
        return <PomodoroTimer />;
      case "calendar":
        return <CalendarView />;
      case "timetable":
        return <Timetable />;
      case "expenses":
        return <ExpenseTracker />;
      default:
        return <Dashboard onNavigate={setActiveTab} user={user} />;
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
      <main data-layout="main" className="flex-1 min-w-0 overflow-x-hidden ml-0 md:ml-[220px] p-4 sm:p-8 max-w-5xl pt-[72px] md:pt-8 pb-20 md:pb-8">
        {renderContent()}
      </main>
    </div>
  );
}
