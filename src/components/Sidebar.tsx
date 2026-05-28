"use client";

import {
  LayoutDashboard,
  Target,
  Clock,
  CalendarDays,
  BookOpen,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "goals", label: "Monthly Goals", icon: Target },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "pomodoro", label: "Pomodoro", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "timetable", label: "Timetable", icon: BookOpen },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-surface border-r border-border z-40 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
        {!collapsed && (
          <h1 className="text-lg font-bold tracking-tight text-accent">
            Tracker
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors ${
            collapsed ? "mx-auto" : "ml-auto"
          }`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-muted hover:bg-surface-hover hover:text-text"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        {!collapsed && (
          <p className="text-xs text-text-dim text-center">
            Jun &apos;26 → May &apos;27
          </p>
        )}
      </div>
    </aside>
  );
}
