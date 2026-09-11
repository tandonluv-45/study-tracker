"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { roadmap } from "@/lib/roadmap-data";
import {
  fetchGoals, toggleGoal, fetchExpenses, fetchIncomes,
  type GoalCompletion, type UserSession, type Expense, type Income,
} from "@/lib/api";
import SprintPlan from "./SprintPlan";
import OrbitTimetable from "./OrbitTimetable";
import OrbitCalendar from "./OrbitCalendar";
import OrbitFinances from "./OrbitFinances";
import { usePomodoroContext } from "@/lib/PomodoroContext";
import {
  isNativeApp, BLOCKABLE_APPS, getLockEnabled, setLockEnabled,
  getLockApps, setLockApps, getPermissions, requestUsageAccess, requestOverlay,
  listInstalledApps, type InstalledApp,
} from "@/lib/focusLock";
import { CONSTELLATIONS, overflowPoint } from "@/lib/constellations";
import { fetchSprintState } from "@/lib/sprintApi";
import type { SprintState } from "@/lib/sprint-plan";
import { buildLanes, type Lane, type LaneKey } from "@/lib/lanes";
import { format } from "date-fns";
import s from "./orbit.module.css";

const LANE_COLOR: Record<LaneKey, string> = { dsa: "#8FA6C0", ai: "#C9A6FF", core: "#E0B15E" };
type FlatCk = { key: string; title: string; sub?: string; done: boolean; lane: LaneKey };

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// A real constellation per calendar month.
// Sprint months → a real constellation we have a silhouette for.
const CONSTELLATION: Record<string, string> = {
  September: "Orion", October: "Scorpius", November: "Leo",
  December: "Cygnus", January: "Gemini", February: "Pegasus",
  // other months (outside the sprint) still map to a drawable shape
  March: "Leo", April: "Pegasus", May: "Cygnus", June: "Orion", July: "Gemini", August: "Scorpius",
};

type Tab = "pass" | "chart" | "tasks" | "you";
type CkStatus = "done" | "current" | "next";

export default function OrbitApp({ user }: { user: UserSession | null }) {
  const pomo = usePomodoroContext();
  const [tab, setTab] = useState<Tab>("pass");
  const [focusOpen, setFocusOpen] = useState(false);
  const [goals, setGoals] = useState<GoalCompletion[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [financesOpen, setFinancesOpen] = useState(false);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sprint, setSprint] = useState<SprintState | null>(null);
  const reloadGoals = useCallback(() => { fetchGoals().then(setGoals); }, []);
  const reloadSprint = useCallback(() => { fetchSprintState().then(setSprint); }, []);
  const reloadFinance = useCallback(() => {
    const m = format(new Date(), "yyyy-MM"); // current month only
    fetchExpenses(m).then(setExpenses); fetchIncomes(m).then(setIncomes);
  }, []);
  useEffect(() => { reloadGoals(); reloadSprint(); reloadFinance(); }, [reloadGoals, reloadSprint, reloadFinance]);

  // Core-CS milestones are stored in the goals table (monthKey = core key, index 0).
  const coreDone = useCallback(
    (key: string) => goals.some((g) => g.monthKey === key && g.goalIndex === 0 && g.completed),
    [goals]
  );
  const toggleCore = useCallback(async (key: string) => { await toggleGoal(key, 0); reloadGoals(); }, [reloadGoals]);

  const totalIncome = incomes.reduce((a, i) => a + i.amount, 0);
  const totalSpent = expenses.reduce((a, e) => a + e.amount, 0);
  const balance = totalIncome - totalSpent;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "Commander";

  // ---- focus-lock settings ----
  const [lockEnabled, setLockEnabledS] = useState(false);
  const [lockApps, setLockAppsS] = useState<string[]>([]);
  const [perms, setPerms] = useState({ usage: false, overlay: false });
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [appQuery, setAppQuery] = useState("");
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  useEffect(() => {
    if (!isNativeApp()) return;
    setLockEnabledS(getLockEnabled());
    setLockAppsS(getLockApps());
    getPermissions().then(setPerms);
    listInstalledApps().then(setInstalledApps);
  }, []);
  const toggleLock = () => { const v = !lockEnabled; setLockEnabledS(v); setLockEnabled(v); if (v) getPermissions().then(setPerms); };
  const toggleLockApp = (pkg: string) => {
    const next = lockApps.includes(pkg) ? lockApps.filter((p) => p !== pkg) : [...lockApps, pkg];
    setLockAppsS(next); setLockApps(next);
  };
  const goTab = (t: Tab) => {
    setFocusOpen(false); setTab(t);
    if (t === "pass" || t === "chart") { reloadSprint(); reloadGoals(); } // pick up Plan progress
  };

  const now = new Date();
  const curIdx = Math.max(0, roadmap.findIndex(
    (m) => m.month === MONTH_NAMES[now.getMonth()] && m.year === now.getFullYear()
  ));
  const [chartIdx, setChartIdx] = useState(curIdx);

  // ---- current month → boarding pass (three lanes, derived from the Plan) ----
  const cur = roadmap[curIdx];
  const monthISO = format(now, "yyyy-MM");
  const laneData = sprint ? buildLanes(sprint, monthISO, coreDone) : null;
  const lanes: Lane[] = laneData?.lanes ?? [];
  const curDone = laneData?.solved ?? 0;
  const curTotal = laneData?.total ?? 0;
  const pct = laneData?.pct ?? 0;
  // flattened checkpoints (dsa → ai → core) for the constellation
  const flatCks: FlatCk[] = lanes.flatMap((l) =>
    l.checkpoints.map((c) => ({ key: c.key, title: c.title, sub: c.sub, done: c.done, lane: l.key }))
  );

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.max(0, Math.ceil((monthEnd.getTime() - now.getTime()) / 86400000));
  const elapsedFrac = (now.getTime() - monthStart.getTime()) / (monthEnd.getTime() - monthStart.getTime());
  const onTrack = curTotal === 0 || curDone / curTotal >= elapsedFrac - 0.15;

  // ---- starfield background ----
  const skyRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = skyRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const r = c.getBoundingClientRect(); c.width = r.width; c.height = r.height;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * c.width, y = Math.random() * c.height, z = Math.random();
      ctx.globalAlpha = 0.14 + z * 0.5; ctx.fillStyle = z > 0.85 ? "#cdd6e6" : "#fff";
      ctx.beginPath(); ctx.arc(x, y, z * 1.05 + 0.2, 0, 7); ctx.fill();
    }
  }, [tab]);

  // ---- focus approach animation (full-screen starfield, content floats over it) ----
  const apRef = useRef<HTMLCanvasElement>(null);
  const pomoRef = useRef(pomo); pomoRef.current = pomo;
  useEffect(() => {
    if (!focusOpen) return;
    const c = apRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    let W = 0, H = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth || window.innerWidth;
      H = c.clientHeight || window.innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ps = Array.from({ length: 170 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), sp: 0.003 + Math.random() * 0.004 }));
    let raf = 0;
    const loop = () => {
      const p2 = pomoRef.current;
      ctx.fillStyle = "rgba(3,4,8,.32)"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      for (const p of ps) {
        if (p2.isRunning) { p.z -= p.sp; if (p.z < 0.02) { p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; p.z = 1; } }
        const sx = cx + (p.x / p.z) * cx, sy = cy + (p.y / p.z) * cy, rr = (1 - p.z) * 1.7 + 0.2;
        if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) continue;
        ctx.globalAlpha = Math.min(1, (1 - p.z) + 0.15); ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const prog = p2.mode === "work" ? 1 - p2.timeLeft / (25 * 60) : 0.4;
      const dr = 4 + Math.max(0, prog) * 30;
      const dy = cy - H * 0.16;
      ctx.fillStyle = "#e8ebf2"; ctx.beginPath(); ctx.arc(cx, dy, dr, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(cx, dy, dr + 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(() => { resize(); loop(); });
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [focusOpen]);

  const mm = String(Math.floor(pomo.timeLeft / 60)).padStart(2, "0");
  const ss = String(pomo.timeLeft % 60).padStart(2, "0");
  const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);
  const focusStr = hm(pomo.sessionsToday * 25);
  const breakStr = hm(pomo.sessionsToday * 5);

  // "Arrival" moment: flag when a focus session completes while the screen is open.
  const [justArrived, setJustArrived] = useState(false);
  const prevSessions = useRef(0);
  useEffect(() => {
    if (prevSessions.current !== 0 && pomo.sessionsToday > prevSessions.current && focusOpen) {
      setJustArrived(true);
      const t = setTimeout(() => setJustArrived(false), 4500);
      prevSessions.current = pomo.sessionsToday;
      return () => clearTimeout(t);
    }
    prevSessions.current = pomo.sessionsToday;
  }, [pomo.sessionsToday, focusOpen]);

  return (
    <div className={s.shell}>
    <div className={s.root}>
      <canvas ref={skyRef} className={s.stars} />

      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside className={s.side}>
        <div className={s.sideWm}>/ORBIT<span>.</span></div>
        <div className={s.sideNav}>
          <button className={`${s.sideBtn} ${tab === "pass" && !focusOpen ? s.sideOn : ""}`} onClick={() => goTab("pass")}>
            <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /></svg>Home
          </button>
          <button className={`${s.sideBtn} ${tab === "chart" && !focusOpen ? s.sideOn : ""}`} onClick={() => goTab("chart")}>
            <svg viewBox="0 0 24 24"><path d="M5 19 9 8l5 6 3-9 2 5" /><circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" /><circle cx="17" cy="5" r="1.3" fill="currentColor" stroke="none" /></svg>Star Chart
          </button>
          <button className={`${s.sideBtn} ${tab === "tasks" && !focusOpen ? s.sideOn : ""}`} onClick={() => goTab("tasks")}>
            <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6l1 1 1.5-2M4.5 12l1 1 1.5-2M4.5 18l1 1 1.5-2" /></svg>Plan
          </button>
          <button className={`${s.sideBtn} ${tab === "you" && !focusOpen ? s.sideOn : ""}`} onClick={() => goTab("you")}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /></svg>You
          </button>
        </div>
        <button className={`${s.sideFocus} ${focusOpen ? s.sideOn : ""}`} onClick={() => setFocusOpen(true)}>
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></svg>
          Focus session
        </button>
        <div className={s.sideFoot}>Cmdr. {firstName}<span>Sector ECE-3</span></div>
      </aside>

      {/* ============ PASS ============ */}
      {tab === "pass" && (
        <div className={s.view}>
          <div className={s.mast}>
            <div className={s.bars}><i style={{ height: 24 }} /><i style={{ height: 13 }} /><i style={{ height: 20 }} /><i style={{ height: 9 }} /><i style={{ height: 17 }} /></div>
            <div className={s.code}>MISSION<b>{cur.phase}</b></div>
            <div className={s.wm}>/ORBIT<span>.</span></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "2px 0 6px" }}>
            <div className={s.label}>{greeting}, {firstName}</div>
            <div className={s.label} style={{ color: "var(--dim)" }}>{format(now, "EEE dd MMM")}</div>
          </div>

          <div className={s.deskCols}>
          <div className={s.colA}>
          <div className={s.hero}>
            <ConstellationSvg monthName={cur.month} cks={flatCks} interactive={false} />
            <div className={s.heroCap}><div className={s.label}>Now charting</div><h2>{CONSTELLATION[cur.month] || cur.theme}</h2></div>
            <div className={s.heroName}>{cur.month} mission</div>
          </div>

          <div className={s.sec}><h3>Boarding pass · {format(now, "MMMM")}</h3><span className={s.n}>{daysLeft} days left</span></div>
          <div className={s.pass}>
            <div className={s.passTop}>
              <div className={s.passR1}>
                <div className={s.fl}>FLIGHT <b>ORB-{String(curIdx + 1).padStart(2, "0")}</b> · {CONSTELLATION[cur.month] || cur.theme}</div>
                <div className={`${s.pill} ${onTrack ? s.pillOk : s.pillWarn}`}><span className={s.d} /> {onTrack ? "On track" : "Behind"}</div>
              </div>
              {!laneData ? (
                <div className={s.ckSub} style={{ padding: "14px 0" }}>Charting your plan…</div>
              ) : lanes.length === 0 ? (
                <div className={s.ckSub} style={{ padding: "14px 0" }}>No checkpoints scheduled this month.</div>
              ) : (
                <div className={s.lanes}>
                  {lanes.map((l) => (
                    <LaneRow key={l.key} lane={l} onOpen={() => goTab("tasks")} onToggleCore={toggleCore} />
                  ))}
                </div>
              )}
            </div>
            <div className={s.perf}><div className={s.perfDash} /></div>
            <div className={s.passBottom}>
              <div className={s.meter}><div className={`${s.meterLay} ${s.meterBg}`} /><div className={`${s.meterLay} ${s.meterFg}`} style={{ width: `${pct}%` }} /></div>
              <div className={s.bl}><b>{pct}%</b>Charted</div>
            </div>
          </div>
          </div>

          <div className={s.colB}>
          <div className={s.sec}><h3>Finances · {format(now, "MMMM")}</h3><button className={s.n} style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setFinancesOpen(true)}>Manage ›</button></div>
          <button className={s.finCard} style={{ width: "100%", cursor: "pointer" }} onClick={() => setFinancesOpen(true)}>
            <div><div className={s.finK}>Income</div><div className={s.finV} style={{ color: "var(--ok)" }}>₹{totalIncome.toFixed(0)}</div></div>
            <div><div className={s.finK}>Spent</div><div className={s.finV} style={{ color: "var(--red)" }}>₹{totalSpent.toFixed(0)}</div></div>
            <div><div className={s.finK}>Balance</div><div className={s.finV}>₹{balance.toFixed(0)}</div></div>
          </button>
          </div>
          </div>
        </div>
      )}

      {/* ============ CHART ============ */}
      {tab === "chart" && (
        <ChartView chartIdx={chartIdx} setChartIdx={setChartIdx} sprint={sprint} coreDone={coreDone} onToggleCore={toggleCore} onOpenPlan={() => goTab("tasks")} />
      )}

      {/* ============ PLAN ============ */}
      {tab === "tasks" && <SprintPlan />}

      {/* ============ YOU ============ */}
      {tab === "you" && (
        <div className={s.view}>
          <div className={s.label}>Flight record</div>
          <h2 className={s.h2}>Cmdr. {user?.name?.split(" ")[0] || "Commander"}</h2>
          <p className={s.pLead}>{user?.isOwner ? "Commander" : "Cadet"} · Sector ECE-3</p>
          <div className={s.stats}>
            <div className={s.stat}><div className={s.statK}>Burns today</div><div className={s.statV}>{pomo.sessionsToday}</div></div>
            <div className={s.stat}><div className={s.statK}>Focus today</div><div className={s.statV}>{Math.round((pomo.sessionsToday * 25) / 60 * 10) / 10} <small>h</small></div></div>
            <div className={s.stat}><div className={s.statK}>Checkpoints</div><div className={s.statV}>{curDone} <small>/ {curTotal}</small></div></div>
            <div className={s.stat}><div className={s.statK}>Constellation</div><div className={s.statV} style={{ fontSize: 18 }}>{CONSTELLATION[cur.month] || cur.theme}</div></div>
          </div>

          <div className={s.sec}><h3>More</h3></div>
          <div className={s.moreGrid}>
          <button className={s.moreRow} onClick={() => setFinancesOpen(true)}>Finances <span>₹{balance.toFixed(0)} ›</span></button>
          <button className={s.moreRow} onClick={() => setCalendarOpen(true)}>Calendar <span>›</span></button>
          <button className={s.moreRow} onClick={() => setTimetableOpen(true)}>Timetable <span>›</span></button>
          <a className={s.moreRow} href="/?classic=1" style={{ opacity: 0.6 }}>Classic tracker <span>›</span></a>
          </div>

          {isNativeApp() && (
            <div className={s.lockSec}>
              <div className={s.lockHead}>
                <div>
                  <div className={s.lockTitle}>Focus Lock</div>
                  <div className={s.lockDesc}>Blocks these apps while a focus burn runs.</div>
                </div>
                <button className={`${s.toggle} ${lockEnabled ? s.toggleOn : ""}`} onClick={toggleLock} aria-label="Toggle focus lock"><span className={s.knob} /></button>
              </div>

              {lockEnabled && (
                <>
                  {(!perms.usage || !perms.overlay) && (
                    <div className={s.permWrap}>
                      <button className={`${s.permBtn} ${perms.usage ? s.permOk : ""}`} onClick={requestUsageAccess}>
                        Usage access {perms.usage ? "✓ granted" : <span className={s.permGrant}>Grant →</span>}
                      </button>
                      <button className={`${s.permBtn} ${perms.overlay ? s.permOk : ""}`} onClick={requestOverlay}>
                        Display over apps {perms.overlay ? "✓ granted" : <span className={s.permGrant}>Grant →</span>}
                      </button>
                      <button className={s.recheck} onClick={() => getPermissions().then(setPerms)}>Re-check permissions</button>
                    </div>
                  )}
                  <button className={s.permBtn} style={{ marginTop: 14 }} onClick={() => setAppPickerOpen(true)}>
                    Blocked apps <span className={s.permGrant}>{lockApps.length} selected  ›</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ FOCUS OVERLAY ============ */}
      {focusOpen && (
        <div className={s.focus}>
          <canvas ref={apRef} className={s.approach} />
          <div className={s.fc}>
            <div className={s.fDest}>{pomo.mode === "work" ? "Deep focus" : pomo.mode === "break" ? "Short break" : "Long break"}</div>
            <div className={s.fClock}>{mm}:{ss}</div>
            <div className={s.fMode}>{pomo.isRunning ? "drifting through deep space" : "ready to launch"}</div>
            <div className={s.fBtns}>
              <button className={s.fBtn} onClick={pomo.reset}>Reset</button>
              <button className={`${s.fBtn} ${s.fBtnPrimary}`} onClick={pomo.toggleRunning}>{pomo.isRunning ? "Pause" : "Launch"}</button>
              <button className={s.fBtn} onClick={() => setFocusOpen(false)}>Close</button>
            </div>
            {pomo.mode === "work" && isNativeApp() && (
              lockEnabled && lockApps.length > 0
                ? (pomo.isRunning && <div className={s.fLock}>◆ distractions locked ◆</div>)
                : <button className={s.recheck} style={{ marginTop: 22 }} onClick={() => goTab("you")}>Set up Focus Lock in “You” →</button>
            )}
            <div className={s.fStats}>
              <div><b>{pomo.sessionsToday}</b><span>sessions</span></div>
              <div><b>{focusStr}</b><span>focus</span></div>
              <div><b>{breakStr}</b><span>breaks</span></div>
            </div>
            {justArrived && <div className={s.fArrived}>✦ Arrived — session logged</div>}
          </div>
        </div>
      )}

      {/* ============ APP PICKER POPUP ============ */}
      {appPickerOpen && (() => {
        const options = installedApps.length ? installedApps : BLOCKABLE_APPS;
        const q = appQuery.trim().toLowerCase();
        const filtered = q ? options.filter((a) => a.label.toLowerCase().includes(q)) : options;
        return (
          <div className={s.modal}>
            <div className={s.modalHead}>
              <div className={s.modalTitle}>Block apps<small>{lockApps.length} selected</small></div>
              <button className={s.modalDone} onClick={() => setAppPickerOpen(false)}>Done</button>
            </div>
            <div className={s.modalBody}>
              <input className={s.appSearch} style={{ marginTop: 0 }} value={appQuery} onChange={(e) => setAppQuery(e.target.value)} placeholder="Search your apps…" />
              {filtered.length === 0 ? (
                <p className={s.appEmpty}>{installedApps.length ? "No apps match." : "Loading your apps… if this stays empty, reinstall the latest app build."}</p>
              ) : (
                <div className={s.modalList}>
                  {filtered.map((a) => {
                    const on = lockApps.includes(a.pkg);
                    return (
                      <button key={a.pkg} className={`${s.appRow} ${on ? s.appRowOn : ""}`} onClick={() => toggleLockApp(a.pkg)}>
                        <span className={`${s.chipBox} ${on ? s.chipBoxOn : ""}`}>{on && <Check />}</span>
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ============ FINANCES POPUP ============ */}
      {financesOpen && <OrbitFinances onClose={() => setFinancesOpen(false)} onChange={reloadFinance} />}

      {timetableOpen && <OrbitTimetable onClose={() => setTimetableOpen(false)} />}
      {calendarOpen && <OrbitCalendar onClose={() => setCalendarOpen(false)} />}

      {/* ============ NAV ============ */}
      <nav className={s.nav}>
        <button className={`${s.navBtn} ${tab === "pass" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("pass")}>
          <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /></svg>Home
        </button>
        <button className={`${s.navBtn} ${tab === "chart" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("chart")}>
          <svg viewBox="0 0 24 24"><path d="M5 19 9 8l5 6 3-9 2 5" /><circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="8" r="1.3" fill="currentColor" stroke="none" /><circle cx="14" cy="14" r="1.3" fill="currentColor" stroke="none" /><circle cx="17" cy="5" r="1.3" fill="currentColor" stroke="none" /></svg>Chart
        </button>
        <button className={`${s.navBtn} ${s.fab}`} onClick={() => setFocusOpen(true)}>
          <span className={s.fabCircle}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.2" fill="#000" stroke="none" /></svg></span>Focus
        </button>
        <button className={`${s.navBtn} ${tab === "tasks" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("tasks")}>
          <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6l1 1 1.5-2M4.5 12l1 1 1.5-2M4.5 18l1 1 1.5-2" /></svg>Plan
        </button>
        <button className={`${s.navBtn} ${tab === "you" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("you")}>
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /></svg>You
        </button>
      </nav>
    </div>
    </div>
  );
}

function Check() {
  return <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

// ---- one lane row on the boarding pass ----
function LaneRow({ lane, onOpen, onToggleCore }: {
  lane: Lane; onOpen: () => void; onToggleCore: (key: string) => void;
}) {
  const ck = lane.checkpoints[lane.currentIdx];
  const allDone = lane.total > 0 && lane.solved >= lane.total;
  return (
    <div className={s.lane}>
      <div className={s.laneTop}>
        <span className={s.laneName}><i style={{ background: LANE_COLOR[lane.key] }} />{lane.label}</span>
        <span className={s.laneCount}>{lane.solved}/{lane.total}</span>
      </div>
      <div className={s.laneMid}>
        {lane.key === "core" && ck && (
          <button className={`${s.laneChk} ${ck.done ? s.laneChkOn : ""}`} onClick={() => onToggleCore(ck.key)} aria-label="Toggle milestone">{ck.done && <Check />}</button>
        )}
        <div className={s.laneCk}>
          {allDone ? <span className={s.laneDoneMsg}>Lane cleared ✦</span> : ck ? <>{ck.title}{ck.sub && <small> · {ck.sub}</small>}</> : "—"}
        </div>
        {lane.key !== "core" && <button className={s.laneAct} onClick={onOpen}>Open →</button>}
      </div>
      <div className={s.laneBar}><i style={{ width: `${lane.pct}%`, background: LANE_COLOR[lane.key] }} /></div>
    </div>
  );
}

// ---- constellation renderer (stars coloured by lane, filled = cleared) ----
function ConstellationSvg({ monthName, cks, interactive, onStar, selIdx }: {
  monthName: string;
  cks: FlatCk[];
  interactive: boolean;
  onStar?: (i: number) => void;
  selIdx?: number;
}) {
  const shape = CONSTELLATIONS[CONSTELLATION[monthName]];
  const n = cks.length;
  const currentIdx = cks.findIndex((c) => !c.done);
  const activeIdx = selIdx ?? (currentIdx >= 0 ? currentIdx : 0);
  const rOf = { done: 4, current: 6, next: 3.4 };
  const statusOf = (i: number): CkStatus => cks[i]?.done ? "done" : i === currentIdx ? "current" : "next";
  const fillOf = (i: number) => {
    const st = statusOf(i);
    if (st === "current") return "#ffffff";
    if (st === "done") return LANE_COLOR[cks[i].lane];
    return "#565b66";
  };

  const cp: [number, number][] = [];
  for (let i = 0; i < n; i++) cp.push(shape?.stars[i] ?? overflowPoint(i));
  const decorative = shape ? shape.stars.slice(n) : [];
  const allStars = shape ? shape.stars : cp;

  return (
    <svg viewBox="0 0 300 320" preserveAspectRatio={interactive ? "xMidYMid meet" : "xMidYMid slice"}>
      {(shape?.lines ?? []).map(([a, b], i) => {
        const pa = allStars[a], pb = allStars[b]; if (!pa || !pb) return null;
        const bright = a < n && b < n && !!cks[a]?.done && !!cks[b]?.done;
        return <line key={i} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={bright ? "#6a6f79" : "#2a2f38"} strokeWidth={1} strokeDasharray={bright ? "" : "3 5"} />;
      })}
      {decorative.map((p, j) => <circle key={`d${j}`} cx={p[0]} cy={p[1]} r={2.6} fill="#3a3f48" />)}
      {cp.map((p, i) => {
        const st = statusOf(i);
        const r = interactive ? rOf[st] : rOf[st] * 0.85;
        const isSel = interactive && i === activeIdx;
        return (
          <g key={i} onClick={() => interactive && onStar?.(i)} style={{ cursor: interactive ? "pointer" : "default" }}>
            {interactive && <circle cx={p[0]} cy={p[1]} r={16} fill="transparent" />}
            {isSel && <circle cx={p[0]} cy={p[1]} r={10} fill="none" stroke="#fff" strokeWidth={1} opacity={0.85} />}
            {st === "current" && !isSel && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke="#fff" strokeWidth={1} opacity={0.5}><animate attributeName="r" values="9;15;9" dur="2.6s" repeatCount="indefinite" /><animate attributeName="opacity" values=".55;0;.55" dur="2.6s" repeatCount="indefinite" /></circle>}
            <circle cx={p[0]} cy={p[1]} r={r} fill={fillOf(i)} />
          </g>
        );
      })}
    </svg>
  );
}

const LANE_LABEL: Record<LaneKey, string> = { dsa: "DSA", ai: "AI · 100x", core: "Core CS" };

function ChartView({ chartIdx, setChartIdx, sprint, coreDone, onToggleCore, onOpenPlan }: {
  chartIdx: number;
  setChartIdx: (i: number) => void;
  sprint: SprintState | null;
  coreDone: (key: string) => boolean;
  onToggleCore: (key: string) => void;
  onOpenPlan: () => void;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const month = roadmap[chartIdx];
  const monthISO = `${month.year}-${String(MONTH_NAMES.indexOf(month.month) + 1).padStart(2, "0")}`;
  const laneData = sprint ? buildLanes(sprint, monthISO, coreDone) : null;
  const cks: FlatCk[] = laneData
    ? laneData.lanes.flatMap((l) => l.checkpoints.map((c) => ({ key: c.key, title: c.title, sub: c.sub, done: c.done, lane: l.key })))
    : [];
  const currentIdx = cks.findIndex((c) => !c.done);
  const selIdx = sel ?? (currentIdx >= 0 ? currentIdx : 0);
  const selCk = cks[selIdx];
  const statusLabel = selCk?.done ? "Cleared" : selIdx === currentIdx ? "In transit" : "Upcoming";

  return (
    <div className={s.view}>
      <div className={s.label} style={{ marginBottom: 8 }}>The voyage</div>
      <h2 className={s.h2}>Star Chart</h2>
      <p className={s.pLead}>Two lanes run in parallel — DSA and AI advance as you clear problems in the Plan; Core CS you tick yourself. Tap a star to inspect.</p>
      <div className={s.mtabs}>
        {roadmap.map((m, i) => (
          <button key={i} className={`${s.mtab} ${i === chartIdx ? s.mtabOn : ""}`} onClick={() => { setChartIdx(i); setSel(null); }}>
            {m.shortMonth} · {CONSTELLATION[m.month] || m.theme}
          </button>
        ))}
      </div>
      <div className={s.legend}>
        <span><i style={{ background: LANE_COLOR.dsa }} />DSA</span>
        <span><i style={{ background: LANE_COLOR.ai }} />AI</span>
        <span><i style={{ background: LANE_COLOR.core }} />Core CS</span>
        <span><i style={{ background: "#ffffff" }} />Current</span>
      </div>
      <div className={s.deskCols}>
        <div className={s.colA}>
          <div className={s.constel}>
            {cks.length > 0
              ? <ConstellationSvg monthName={month.month} cks={cks} interactive onStar={setSel} selIdx={selIdx} />
              : <p className={s.appEmpty} style={{ paddingTop: 60 }}>Charting…</p>}
          </div>
        </div>
        <div className={s.colB}>
          <div className={s.cdetail}>
            {selCk ? (
              <>
                <div className={s.cdM}><span style={{ color: LANE_COLOR[selCk.lane] }}>{LANE_LABEL[selCk.lane]} · {month.month}</span><span>★ {selIdx + 1}</span></div>
                <div className={s.cdT}>{selCk.title}</div>
                <div className={s.cdD}>{selCk.sub ? `${selCk.sub} · ` : ""}{statusLabel}</div>
                {selCk.lane === "core"
                  ? <button className={s.cdSt} onClick={() => onToggleCore(selCk.key)}>{selCk.done ? "Cleared — tap to reopen" : "Mark milestone done"}</button>
                  : <button className={s.cdSt} onClick={onOpenPlan}>Open in Plan →</button>}
              </>
            ) : <div className={s.cdD}>Select a checkpoint.</div>}
          </div>
        </div>
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}
