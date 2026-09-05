// Bridge to the native FocusLock Capacitor plugin (Android/Orbit app only).
// Every call safely no-ops on the web, so the same site runs everywhere.

interface FocusLockPlugin {
  hasUsageAccess(): Promise<{ granted: boolean }>;
  requestUsageAccess(): Promise<void>;
  canDrawOverlays(): Promise<{ granted: boolean }>;
  requestOverlay(): Promise<void>;
  start(opts: { apps: string[] }): Promise<void>;
  stop(): Promise<void>;
  isActive(): Promise<{ active: boolean }>;
}

function getPlugin(): FocusLockPlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: { Plugins?: { FocusLock?: FocusLockPlugin } } }).Capacitor;
  return cap?.Plugins?.FocusLock ?? null;
}

/** True only inside the native Orbit app where the plugin exists. */
export function isNativeApp(): boolean {
  return getPlugin() !== null;
}

// Apps offered in the block-list picker (package name → label).
export const BLOCKABLE_APPS: { pkg: string; label: string }[] = [
  { pkg: "com.instagram.android", label: "Instagram" },
  { pkg: "com.google.android.youtube", label: "YouTube" },
  { pkg: "com.zhiliaoapp.musically", label: "TikTok" },
  { pkg: "com.whatsapp", label: "WhatsApp" },
  { pkg: "com.snapchat.android", label: "Snapchat" },
  { pkg: "com.twitter.android", label: "X (Twitter)" },
  { pkg: "com.reddit.frontpage", label: "Reddit" },
  { pkg: "com.discord", label: "Discord" },
  { pkg: "com.netflix.mediaclient", label: "Netflix" },
  { pkg: "com.android.chrome", label: "Chrome" },
];

const LS_ENABLED = "orbit_lock_enabled";
const LS_APPS = "orbit_lock_apps";

export function getLockEnabled(): boolean {
  try { return localStorage.getItem(LS_ENABLED) === "1"; } catch { return false; }
}
export function setLockEnabled(v: boolean): void {
  try { localStorage.setItem(LS_ENABLED, v ? "1" : "0"); } catch { /* ignore */ }
}
export function getLockApps(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_APPS) || "[]"); } catch { return []; }
}
export function setLockApps(apps: string[]): void {
  try { localStorage.setItem(LS_APPS, JSON.stringify(apps)); } catch { /* ignore */ }
}

export async function startLock(apps: string[]): Promise<void> {
  const p = getPlugin();
  if (!p || apps.length === 0) return;
  try { await p.start({ apps }); } catch { /* ignore */ }
}

export async function stopLock(): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try { await p.stop(); } catch { /* ignore */ }
}

export async function getPermissions(): Promise<{ usage: boolean; overlay: boolean }> {
  const p = getPlugin();
  if (!p) return { usage: false, overlay: false };
  try {
    const [u, o] = await Promise.all([p.hasUsageAccess(), p.canDrawOverlays()]);
    return { usage: u.granted, overlay: o.granted };
  } catch {
    return { usage: false, overlay: false };
  }
}

export async function requestUsageAccess(): Promise<void> {
  const p = getPlugin();
  if (p) { try { await p.requestUsageAccess(); } catch { /* ignore */ } }
}
export async function requestOverlay(): Promise<void> {
  const p = getPlugin();
  if (p) { try { await p.requestOverlay(); } catch { /* ignore */ } }
}

/** Starts the lock if enabled + apps chosen; called when a focus session begins. */
export async function armLockForFocus(): Promise<void> {
  if (!isNativeApp() || !getLockEnabled()) return;
  await startLock(getLockApps());
}
