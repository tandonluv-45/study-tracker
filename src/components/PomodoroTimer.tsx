"use client";

import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { usePomodoroContext, DURATIONS, MODE_LABELS, type TimerMode } from "@/lib/PomodoroContext";

export default function PomodoroTimer() {
  const { mode, timeLeft, isRunning, sessionsToday, sessionCount, label, setLabel, toggleRunning, reset, switchMode } = usePomodoroContext();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;
  const modeColors: Record<TimerMode, string> = { work: "text-accent", break: "text-green", longBreak: "text-blue" };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold mb-6">Pomodoro Timer</h2>
      <div className="max-w-md mx-auto">
        <div className="flex gap-1.5 sm:gap-2 mb-8 justify-center">
          {(["work", "break", "longBreak"] as TimerMode[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === m ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text hover:bg-surface-hover"}`}>
              {m === "work" ? <Brain size={14} className="inline mr-1" /> : <Coffee size={14} className="inline mr-1" />}
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="relative flex flex-col items-center mb-8">
          <svg width={240} height={240} className="transform -rotate-90">
            <circle cx={120} cy={120} r={108} strokeWidth={6} fill="none" stroke="var(--color-border)" />
            <circle cx={120} cy={120} r={108} strokeWidth={6} fill="none"
              stroke={mode === "work" ? "var(--color-accent)" : mode === "break" ? "var(--color-green)" : "var(--color-blue)"}
              strokeDasharray={108 * 2 * Math.PI} strokeDashoffset={108 * 2 * Math.PI - (progress / 100) * 108 * 2 * Math.PI}
              strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-mono font-bold tracking-wider ${modeColors[mode]} ${isRunning && timeLeft <= 60 ? "timer-pulse" : ""}`}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-text-muted mt-2">{MODE_LABELS[mode]}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={reset} className="p-3 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
            <RotateCcw size={20} />
          </button>
          <button onClick={toggleRunning}
            className="w-16 h-16 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-colors shadow-lg shadow-accent/20">
            {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <div className="w-11" />
        </div>

        {mode === "work" && (
          <div className="mb-6">
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What are you working on?"
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors" />
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold">{sessionsToday}</p><p className="text-xs text-text-muted">Sessions today</p></div>
            <div className="h-8 w-px bg-border" />
            <div><p className="text-2xl font-bold">{Math.round((sessionsToday * 25) / 60 * 10) / 10}h</p><p className="text-xs text-text-muted">Focus time</p></div>
            <div className="h-8 w-px bg-border" />
            <div><p className="text-2xl font-bold">{sessionCount % 4}/4</p><p className="text-xs text-text-muted">Until long break</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
