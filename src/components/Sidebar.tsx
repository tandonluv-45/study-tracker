"use client";

import {
  LayoutDashboard, Target, Clock, CalendarDays, BookOpen,
  ClipboardList, ChevronLeft, ChevronRight, Wallet, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import type { UserSession } from "@/lib/api";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "goals", label: "Monthly Goals", icon: Target },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "pomodoro", label: "Pomodoro", icon: Clock },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "timetable", label: "Timetable", icon: BookOpen },
  { id: "expenses", label: "Expenses", icon: Wallet },
];

// Bottom nav shows only 5 items on mobile
const mobileNavItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "pomodoro", label: "Timer", icon: Clock },
  { id: "expenses", label: "Money", icon: Wallet },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserSession | null;
}

export default function Sidebar({ activeTab, onTabChange, user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`desktop-sidebar fixed left-0 top-0 h-full bg-surface border-r border-border z-40 flex flex-col transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[220px]"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
          {!collapsed && (
            <h1 className="text-lg font-bold tracking-tight text-accent">Tracker</h1>
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

        <div className="px-3 py-3 border-t border-border">
          {user && !collapsed && (
            <div className="flex items-center gap-2 mb-3">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent-muted flex items-center justify-center text-xs font-bold text-accent">
                  {user.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-text-dim truncate">{user.email}</p>
              </div>
            </div>
          )}
          <a
            href="/api/auth/logout"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-surface-hover hover:text-red transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </a>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-nav fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-50 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold text-accent">Tracker</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile full menu overlay */}
      {mobileOpen && (
        <div className="mobile-nav fixed inset-0 bg-bg/95 z-40 pt-16 px-4 animate-fade-in">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          {user && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-3 px-4 py-2">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center text-sm font-bold text-accent">
                    {user.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-text-dim">{user.email}</p>
                </div>
              </div>
              <a href="/api/auth/logout"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-muted hover:bg-surface-hover hover:text-red mt-2">
                <LogOut size={20} /> Sign Out
              </a>
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom nav bar */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-50 flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                isActive ? "text-accent" : "text-text-dim"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-text-dim"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
