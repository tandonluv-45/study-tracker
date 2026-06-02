"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPomodoro, fetchPomodoro } from "@/lib/api";
import { format } from "date-fns";

type TimerMode = "work" | "break" | "longBreak";

const DURATIONS: Record<TimerMode, number> = { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };
const MODE_LABELS: Record<TimerMode, string> = { work: "Focus", break: "Short Break", longBreak: "Long Break" };

interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  sessionsToday: number;
  sessionCount: number;
  label: string;
  setLabel: (l: string) => void;
  toggleRunning: () => void;
  reset: () => void;
  switchMode: (m: TimerMode) => void;
}

const PomodoroContext = createContext<PomodoroState | null>(null);

export function usePomodoroContext() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoroContext must be used within PomodoroProvider");
  return ctx;
}

export { DURATIONS, MODE_LABELS };
export type { TimerMode };

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [label, setLabel] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetchPomodoro(today).then((s) => setSessionsToday(s.length));
  }, [today]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setIsRunning(false);
  }, []);

  const completeSession = useCallback(async () => {
    if (mode === "work") {
      await createPomodoro({ date: today, duration: 25, completedAt: new Date().toISOString(), label: label || undefined });
      setSessionsToday((p) => p + 1);
      const next = sessionCount + 1;
      setSessionCount(next);
      switchMode(next % 4 === 0 ? "longBreak" : "break");
    } else {
      switchMode("work");
    }
  }, [mode, today, label, sessionCount, switchMode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      completeSession();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, completeSession]);

  const reset = useCallback(() => {
    setTimeLeft(DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  const toggleRunning = useCallback(() => setIsRunning((r) => !r), []);

  return (
    <PomodoroContext.Provider value={{ mode, timeLeft, isRunning, sessionsToday, sessionCount, label, setLabel, toggleRunning, reset, switchMode }}>
      {children}
    </PomodoroContext.Provider>
  );
}
