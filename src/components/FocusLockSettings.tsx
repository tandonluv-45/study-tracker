"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Check, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import {
  isNativeApp, BLOCKABLE_APPS, getLockEnabled, setLockEnabled,
  getLockApps, setLockApps, getPermissions, requestUsageAccess, requestOverlay,
} from "@/lib/focusLock";

export default function FocusLockSettings() {
  const [native, setNative] = useState(false);
  const [open, setOpen] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [apps, setApps] = useState<string[]>([]);
  const [perms, setPerms] = useState({ usage: false, overlay: false });

  const refreshPerms = useCallback(() => { getPermissions().then(setPerms); }, []);

  useEffect(() => {
    if (!isNativeApp()) return;
    setNative(true);
    setEnabled(getLockEnabled());
    setApps(getLockApps());
    refreshPerms();
  }, [refreshPerms]);

  if (!native) return null;

  const toggleEnabled = () => { const v = !enabled; setEnabled(v); setLockEnabled(v); if (v) refreshPerms(); };

  const toggleApp = (pkg: string) => {
    const next = apps.includes(pkg) ? apps.filter((p) => p !== pkg) : [...apps, pkg];
    setApps(next);
    setLockApps(next);
  };

  const permsReady = perms.usage && perms.overlay;

  return (
    <div className="mt-6 bg-surface border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4">
        <span className="flex items-center gap-2.5 text-sm font-semibold">
          <Shield size={16} className="text-accent" /> Focus Lock
        </span>
        <span className="flex items-center gap-2">
          <span className={`text-xs ${enabled ? "text-accent" : "text-text-dim"}`}>{enabled ? "On" : "Off"}</span>
          {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">Lock distracting apps</p>
              <p className="text-xs text-text-muted mt-0.5">Blocks the chosen apps while a focus timer runs.</p>
            </div>
            <button
              onClick={toggleEnabled}
              role="switch" aria-checked={enabled}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? "bg-accent" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {enabled && (
            <>
              {!permsReady && (
                <div className="mb-4 rounded-lg border border-amber/40 bg-amber-muted p-3">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber mb-2">
                    <AlertCircle size={13} /> Two one-time permissions needed
                  </p>
                  <div className="flex flex-col gap-2">
                    <button onClick={requestUsageAccess}
                      className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${perms.usage ? "border-green/40 text-green" : "border-border text-text"}`}>
                      Usage access {perms.usage ? <Check size={13} /> : <span className="text-accent">Grant →</span>}
                    </button>
                    <button onClick={requestOverlay}
                      className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${perms.overlay ? "border-green/40 text-green" : "border-border text-text"}`}>
                      Display over other apps {perms.overlay ? <Check size={13} /> : <span className="text-accent">Grant →</span>}
                    </button>
                  </div>
                  <button onClick={refreshPerms} className="text-xs text-text-muted mt-2 underline">Re-check permissions</button>
                </div>
              )}

              <p className="text-xs font-medium text-text-muted mb-2">Apps to block ({apps.length})</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCKABLE_APPS.map((a) => {
                  const on = apps.includes(a.pkg);
                  return (
                    <button key={a.pkg} onClick={() => toggleApp(a.pkg)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
                        on ? "border-accent bg-accent-muted text-accent" : "border-border text-text hover:bg-surface-hover"}`}>
                      <span className={`w-3.5 h-3.5 rounded border grid place-items-center shrink-0 ${on ? "bg-accent border-accent" : "border-text-dim"}`}>
                        {on && <Check size={10} className="text-white" />}
                      </span>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
