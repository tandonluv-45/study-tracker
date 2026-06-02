"use client";

import { useEffect, useRef, useCallback } from "react";

interface PiPState {
  mode: "work" | "break" | "longBreak";
  timeLeft: number;
  isRunning: boolean;
  toggleRunning: () => void;
  reset: () => void;
}

const MODE_LABELS = { work: "Focus", break: "Short Break", longBreak: "Long Break" };
const DURATIONS = { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };

function getThemeColors() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    return {
      bg: "#1E1E1E", surface: "#2A2A2A", border: "#333333",
      text: "#E8E8E8", textMuted: "#A0A0A0",
      accent: "#9AB87A", accentHover: "#AACA8E",
      green: "#8BBF6A", blue: "#96ADBE",
    };
  }
  return {
    bg: "#FEFEFE", surface: "#F5F5F0", border: "#E0E0D8",
    text: "#2A2A2A", textMuted: "#6B6B6B",
    accent: "#7A8F5C", accentHover: "#6B7F4D",
    green: "#6B8F4E", blue: "#7A8FA5",
  };
}

function getStrokeColor(mode: PiPState["mode"], colors: ReturnType<typeof getThemeColors>) {
  return mode === "work" ? colors.accent : mode === "break" ? colors.green : colors.blue;
}

function buildPiPHTML(state: PiPState, colors: ReturnType<typeof getThemeColors>) {
  const { mode, timeLeft, isRunning } = state;
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;
  const strokeColor = getStrokeColor(mode, colors);
  const r = 40;
  const circumference = r * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    background: ${colors.bg}; color: ${colors.text};
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 100vh; gap: 12px;
    user-select: none; overflow: hidden;
  }
  .timer-ring { position: relative; width: 100px; height: 100px; }
  .timer-ring svg { transform: rotate(-90deg); }
  .timer-text {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .time { font-size: 22px; font-weight: 700; font-family: ui-monospace, monospace; color: ${strokeColor}; letter-spacing: 1px; }
  .mode-label { font-size: 11px; color: ${colors.textMuted}; margin-top: 2px; }
  .controls { display: flex; gap: 8px; align-items: center; }
  button {
    border: none; cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: background 0.15s, transform 0.1s;
  }
  button:active { transform: scale(0.93); }
  .btn-main {
    width: 40px; height: 40px; border-radius: 50%;
    background: ${colors.accent}; color: white;
  }
  .btn-main:hover { background: ${colors.accentHover}; }
  .btn-secondary {
    width: 32px; height: 32px; border-radius: 50%;
    background: ${colors.surface}; color: ${colors.textMuted};
    border: 1px solid ${colors.border};
  }
  .btn-secondary:hover { background: ${colors.border}; color: ${colors.text}; }
  .status { font-size: 10px; color: ${colors.textMuted}; }
</style></head><body>
  <div class="timer-ring">
    <svg width="100" height="100">
      <circle cx="50" cy="50" r="${r}" stroke-width="5" fill="none" stroke="${colors.border}" />
      <circle cx="50" cy="50" r="${r}" stroke-width="5" fill="none" stroke="${strokeColor}"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" id="progress" style="transition: stroke-dashoffset 1s linear" />
    </svg>
    <div class="timer-text">
      <span class="time" id="time">${minutes}:${seconds}</span>
      <span class="mode-label" id="modeLabel">${MODE_LABELS[mode]}</span>
    </div>
  </div>
  <div class="controls">
    <button class="btn-secondary" id="resetBtn" title="Reset">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    </button>
    <button class="btn-main" id="toggleBtn" title="${isRunning ? "Pause" : "Resume"}">
      ${isRunning
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>'
      }
    </button>
  </div>
  <span class="status" id="status">${isRunning ? "Running" : "Paused"}</span>
</body></html>`;
}

const PLAY_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
const PAUSE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

export function usePomodoroPiP(state: PiPState) {
  const pipWindowRef = useRef<Window | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const closePiP = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    pipWindowRef.current = null;
  }, []);

  const updatePiPContent = useCallback(() => {
    const win = pipWindowRef.current;
    if (!win || win.closed) {
      pipWindowRef.current = null;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    const { timeLeft, mode, isRunning } = stateRef.current;
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;
    const r = 40;
    const circumference = r * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const timeEl = win.document.getElementById("time");
    const progressEl = win.document.getElementById("progress");
    const statusEl = win.document.getElementById("status");
    const toggleBtn = win.document.getElementById("toggleBtn");

    if (timeEl) timeEl.textContent = `${minutes}:${seconds}`;
    if (progressEl) progressEl.setAttribute("stroke-dashoffset", String(offset));
    if (statusEl) statusEl.textContent = isRunning ? "Running" : "Paused";
    if (toggleBtn) {
      toggleBtn.innerHTML = isRunning ? PAUSE_SVG : PLAY_SVG;
      toggleBtn.title = isRunning ? "Pause" : "Resume";
    }
  }, []);

  const openPiP = useCallback(async () => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }

    if (!("documentPictureInPicture" in window)) {
      alert("Picture-in-Picture is not supported in this browser. Try Chrome 116+.");
      return;
    }

    try {
      const pip: Window = await (window as any).documentPictureInPicture.requestWindow({
        width: 180,
        height: 240,
      });
      pipWindowRef.current = pip;

      const colors = getThemeColors();
      const html = buildPiPHTML(stateRef.current, colors);
      pip.document.write(html);
      pip.document.close();

      pip.document.getElementById("toggleBtn")?.addEventListener("click", () => {
        stateRef.current.toggleRunning();
      });
      pip.document.getElementById("resetBtn")?.addEventListener("click", () => {
        stateRef.current.reset();
      });

      updateIntervalRef.current = setInterval(updatePiPContent, 500);

      pip.addEventListener("pagehide", () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
        pipWindowRef.current = null;
      });
    } catch {
      // user cancelled or API error
    }
  }, [updatePiPContent]);

  useEffect(() => {
    return () => closePiP();
  }, [closePiP]);

  const isPiPSupported = typeof window !== "undefined" && "documentPictureInPicture" in window;

  return { openPiP, closePiP, isPiPSupported };
}
