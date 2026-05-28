"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import MonthlyGoals from "@/components/MonthlyGoals";
import DailyTasks from "@/components/DailyTasks";
import PomodoroTimer from "@/components/PomodoroTimer";
import CalendarView from "@/components/CalendarView";
import Timetable from "@/components/Timetable";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "goals":
        return <MonthlyGoals />;
      case "tasks":
        return <DailyTasks />;
      case "pomodoro":
        return <PomodoroTimer />;
      case "calendar":
        return <CalendarView />;
      case "timetable":
        return <Timetable />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 ml-[220px] p-8 max-w-5xl">
        {renderContent()}
      </main>
    </div>
  );
}
