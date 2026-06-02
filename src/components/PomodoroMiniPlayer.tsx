"use client";

import { Play, Pause, RotateCcw, PictureInPicture2, X } from "lucide-react";
import { useState } from "react";
import { usePomodoroContext, DURATIONS, MODE_LABELS } from "@/lib/PomodoroContext";

interface Props {
  onGoToPomodoro: () => void;
}

export default function PomodoroMiniPlayer({ onGoToPomodoro }: Props) {
  const { mode, timeLeft, isRunning, toggleRunning, reset, openPiP, isPiPSupported } = usePomodoroContext();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!isRunning && timeLeft === DURATIONS[mode])) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;
  const strokeColor = mode === "work" ? "var(--color-accent)" : mode === "break" ? "var(--color-green)" : "var(--color-blue)";
  const r = 18;
  const circumference = r * 2 * Math.PI;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/20 p-3 flex items-center gap-3 backdrop-blur-sm">
        <button onClick={onGoToPomodoro} className="relative flex items-center justify-center w-12 h-12 shrink-0 group" title="Go to Pomodoro">
          <svg width={48} height={48} className="absolute inset-0 transform -rotate-90">
            <circle cx={24} cy={24} r={r} strokeWidth={3} fill="none" stroke="var(--color-border)" />
            <circle cx={24} cy={24} r={r} strokeWidth={3} fill="none" stroke={strokeColor}
              strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
              strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
          </svg>
          <span className={`text-xs font-mono font-bold ${isRunning ? "text-accent" : "text-text-muted"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </button>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-medium text-text truncate">{MODE_LABELS[mode]}</span>
          <span className="text-[10px] text-text-muted">{isRunning ? "Running" : "Paused"}</span>
        </div>

        <div className="flex items-center gap-1 ml-1">
          <button onClick={toggleRunning}
            className="w-8 h-8 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-colors"
            title={isRunning ? "Pause" : "Resume"}>
            {isRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
          <button onClick={reset}
            className="w-8 h-8 rounded-full hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors"
            title="Reset">
            <RotateCcw size={14} />
          </button>
          {isPiPSupported && openPiP && (
            <button onClick={openPiP}
              className="w-8 h-8 rounded-full hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors"
              title="Pop out">
              <PictureInPicture2 size={14} />
            </button>
          )}
          <button onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded-full hover:bg-surface-hover text-text-dim hover:text-text-muted flex items-center justify-center transition-colors"
            title="Dismiss">
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
