"use client";

import { useEffect } from "react";
import { usePomodoroContext } from "@/lib/PomodoroContext";
import { usePomodoroPiP } from "@/lib/usePomodoroPiP";

export default function PomodoroPiPBridge() {
  const { mode, timeLeft, isRunning, toggleRunning, reset, setOpenPiP, setIsPiPSupported } = usePomodoroContext();
  const { openPiP, isPiPSupported } = usePomodoroPiP({ mode, timeLeft, isRunning, toggleRunning, reset });

  useEffect(() => {
    setOpenPiP(openPiP);
    setIsPiPSupported(isPiPSupported);
    return () => setOpenPiP(null);
  }, [openPiP, isPiPSupported, setOpenPiP, setIsPiPSupported]);

  return null;
}
