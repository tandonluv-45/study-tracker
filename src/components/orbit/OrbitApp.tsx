"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { roadmap } from "@/lib/roadmap-data";
import {
  fetchGoals, toggleGoal, fetchExpenses, fetchIncomes, createExpense, createIncome,
  type GoalCompletion, type UserSession, type Expense, type Income,
} from "@/lib/api";
import SprintPlan from "./SprintPlan";
import OrbitTimetable from "./OrbitTimetable";
import OrbitCalendar from "./OrbitCalendar";
import { usePomodoroContext } from "@/lib/PomodoroContext";
import {
  isNativeApp, BLOCKABLE_APPS, getLockEnabled, setLockEnabled,
  getLockApps, setLockApps, getPermissions, requestUsageAccess, requestOverlay,
  listInstalledApps, type InstalledApp,
} from "@/lib/focusLock";
import { CONSTELLATIONS, overflowPoint } from "@/lib/constellations";
import { format } from "date-fns";
import s from "./orbit.module.css";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// A real constellation per calendar month.
// Sprint months → a real constellation we have a silhouette for.
const CONSTELLATION: Record<string, string> = {
  September: "Orion", October: "Scorpius", November: "Leo",
  December: "Cygnus", January: "Gemini", February: "Pegasus",
  // other months (outside the sprint) still map to a drawable shape
  March: "Leo", April: "Pegasus", May: "Cygnus", June: "Orion", July: "Gemini", August: "Scorpius",
};

const EXP_CATS = [
  { key: "food", label: "Food" }, { key: "shopping", label: "Shopping" }, { key: "bills", label: "Bills" },
  { key: "travel", label: "Travel" }, { key: "entertainment", label: "Fun" }, { key: "other", label: "Other" },
];

type Tab = "pass" | "chart" | "tasks" | "you";
type CkStatus = "done" | "current" | "next";

const monthKeyOf = (m: { shortMonth: string; year: number }) => `${m.shortMonth}-${m.year}`;

function gateOf(text: string): string {
  const t = text.toLowerCase();
  if (/hugging|rag|neural|vector|context|100x|history|\bai\b/.test(t)) return "AI";
  if (/linalg|linear algebra|\bos\b|dbms|network|core cs/.test(t)) return "Core CS";
  return "DSA";
}

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
  const reloadGoals = useCallback(() => { fetchGoals().then(setGoals); }, []);
  const reloadFinance = useCallback(() => {
    const m = format(new Date(), "yyyy-MM"); // current month only
    fetchExpenses(m).then(setExpenses); fetchIncomes(m).then(setIncomes);
  }, []);
  useEffect(() => { reloadGoals(); reloadFinance(); }, [reloadGoals, reloadFinance]);

  const totalIncome = incomes.reduce((a, i) => a + i.amount, 0);
  const totalSpent = expenses.reduce((a, e) => a + e.amount, 0);
  const balance = totalIncome - totalSpent;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "Commander";
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const [finType, setFinType] = useState<"expense" | "income">("expense");
  const [finTitle, setFinTitle] = useState("");
  const [finAmount, setFinAmount] = useState("");
  const [finCat, setFinCat] = useState("food");
  const addFinance = async () => {
    const amt = parseFloat(finAmount);
    if (!finTitle.trim() || !amt) return;
    if (finType === "expense") await createExpense({ title: finTitle.trim(), amount: amt, date: todayISO, category: finCat });
    else await createIncome({ title: finTitle.trim(), amount: amt, date: todayISO });
    setFinTitle(""); setFinAmount(""); reloadFinance();
  };
  const recentFinance = [
    ...expenses.map((e) => ({ ...e, kind: "expense" as const })),
    ...incomes.map((i) => ({ ...i, kind: "income" as const })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const byCategory = EXP_CATS.map((c) => ({
    ...c, amount: expenses.filter((e) => e.category === c.key).reduce((a, e) => a + e.amount, 0),
  })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

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
  const goTab = (t: Tab) => { setFocusOpen(false); setTab(t); };

  const now = new Date();
  const curIdx = Math.max(0, roadmap.findIndex(
    (m) => m.month === MONTH_NAMES[now.getMonth()] && m.year === now.getFullYear()
  ));
  const [chartIdx, setChartIdx] = useState(curIdx);

  const isDone = useCallback(
    (mk: string, i: number) => goals.some((g) => g.monthKey === mk && g.goalIndex === i && g.completed),
    [goals]
  );

  // ---- current month → boarding pass ----
  const cur = roadmap[curIdx];
  const curKey = monthKeyOf(cur);
  const curDone = cur.goals.filter((_, i) => isDone(curKey, i)).length;
  const curTotal = cur.goals.length;
  const nextIdx = cur.goals.findIndex((_, i) => !isDone(curKey, i));
  const nextCheckpoint = nextIdx >= 0 ? cur.goals[nextIdx] : "All checkpoints cleared";
  const pct = curTotal ? Math.round((curDone / curTotal) * 100) : 0;

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
    <div className={s.root}>
      <canvas ref={skyRef} className={s.stars} />

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

          <div className={s.hero}>
            <ConstellationSvg month={cur} isDone={isDone} interactive={false} />
            <div className={s.heroCap}><div className={s.label}>Now charting</div><h2>{CONSTELLATION[cur.month] || cur.theme}</h2></div>
            <div className={s.heroName}>{cur.month} mission</div>
          </div>

          <div className={s.sec}><h3>Boarding pass — next checkpoint</h3></div>
          <div className={s.pass}>
            <div className={s.passTop}>
              <div className={s.passR1}>
                <div className={s.fl}>FLIGHT <b>ORB-{String(curIdx + 1).padStart(2, "0")}</b> · {CONSTELLATION[cur.month] || cur.theme}</div>
                <div className={`${s.pill} ${onTrack ? s.pillOk : s.pillWarn}`}><span className={s.d} /> {onTrack ? "On track" : "Behind"}</div>
              </div>
              <div className={s.ckwrap}>
                <div>
                  <div className={s.ckK}>Next checkpoint</div>
                  <div className={s.ckV}>{nextCheckpoint}</div>
                  <div className={s.ckSub}>{nextIdx >= 0 ? `due ${format(monthEnd, "dd MMM")} · ${daysLeft} days left` : "voyage complete"}</div>
                </div>
                <div className={s.idx}><div className={s.idxBig}>{String(Math.min(nextIdx < 0 ? curTotal : nextIdx + 1, curTotal)).padStart(2, "0")}</div><div className={s.idxOf}>of {String(curTotal).padStart(2, "0")}</div></div>
              </div>
              <div className={s.ckbar}><i style={{ width: `${pct}%` }} /></div>
              <div className={s.grid2}>
                <div className={s.c}><div className={s.gk}>Gate</div><div className={s.gv}>{nextIdx >= 0 ? gateOf(nextCheckpoint) : "—"}</div></div>
                <div className={`${s.c} ${s.r}`}><div className={s.gk}>Boarding · today</div><div className={s.gv}>{pomo.sessionsToday} focus burns</div></div>
              </div>
            </div>
            <div className={s.perf}><div className={s.perfDash} /></div>
            <div className={s.passBottom}>
              <div className={s.meter}><div className={`${s.meterLay} ${s.meterBg}`} /><div className={`${s.meterLay} ${s.meterFg}`} style={{ width: `${pct}%` }} /></div>
              <div className={s.bl}><b>{pct}%</b>Charted</div>
            </div>
          </div>

          {nextIdx >= 0 && cur.goals[nextIdx + 1] && (
            <>
              <div className={s.sec}><h3>After that</h3><span className={s.n}>CKPT {String(nextIdx + 2).padStart(2, "0")}</span></div>
              <div className={s.nextrow}>
                <div><div className={s.t}>{cur.goals[nextIdx + 1]}</div><div className={s.s}>{gateOf(cur.goals[nextIdx + 1])} · {cur.month}</div></div>
                <div className={s.lk}>{cur.shortMonth.toUpperCase()}</div>
              </div>
            </>
          )}

          <div className={s.sec}><h3>Finances · {format(now, "MMMM")}</h3><button className={s.n} style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setFinancesOpen(true)}>Manage ›</button></div>
          <button className={s.finCard} style={{ width: "100%", cursor: "pointer" }} onClick={() => setFinancesOpen(true)}>
            <div><div className={s.finK}>Income</div><div className={s.finV} style={{ color: "var(--ok)" }}>₹{totalIncome.toFixed(0)}</div></div>
            <div><div className={s.finK}>Spent</div><div className={s.finV} style={{ color: "var(--red)" }}>₹{totalSpent.toFixed(0)}</div></div>
            <div><div className={s.finK}>Balance</div><div className={s.finV}>₹{balance.toFixed(0)}</div></div>
          </button>
        </div>
      )}

      {/* ============ CHART ============ */}
      {tab === "chart" && (
        <ChartView chartIdx={chartIdx} setChartIdx={setChartIdx} isDone={isDone} onToggle={async (mk, i) => { await toggleGoal(mk, i); reloadGoals(); }} />
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
          <button className={s.moreRow} onClick={() => setFinancesOpen(true)}>Finances <span>₹{balance.toFixed(0)} ›</span></button>
          <button className={s.moreRow} onClick={() => setCalendarOpen(true)}>Calendar <span>›</span></button>
          <button className={s.moreRow} onClick={() => setTimetableOpen(true)}>Timetable <span>›</span></button>
          <a className={s.moreRow} href="/?classic=1" style={{ opacity: 0.6 }}>Classic tracker <span>›</span></a>

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
      {financesOpen && (
        <div className={s.modal}>
          <div className={s.modalHead}>
            <div className={s.modalTitle}>Finances<small>{format(now, "MMMM yyyy")}</small></div>
            <button className={s.modalDone} onClick={() => setFinancesOpen(false)}>Done</button>
          </div>
          <div className={s.modalBody}>
            <div className={s.finCard} style={{ marginTop: 0 }}>
              <div><div className={s.finK}>Income</div><div className={s.finV} style={{ color: "var(--ok)" }}>₹{totalIncome.toFixed(0)}</div></div>
              <div><div className={s.finK}>Spent</div><div className={s.finV} style={{ color: "var(--red)" }}>₹{totalSpent.toFixed(0)}</div></div>
              <div><div className={s.finK}>Balance</div><div className={s.finV}>₹{balance.toFixed(0)}</div></div>
            </div>

            {byCategory.length > 0 && (
              <>
                <div className={s.sec}><h3>Where it went</h3><span className={s.n}>₹{totalSpent.toFixed(0)}</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {byCategory.map((c) => {
                    const pct = totalSpent ? Math.round((c.amount / totalSpent) * 100) : 0;
                    return (
                      <div key={c.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                          <span>{c.label}</span><span style={{ color: "var(--muted)", fontFamily: "var(--fontM)", fontSize: 11 }}>₹{c.amount.toFixed(0)} · {pct}%</span>
                        </div>
                        <div className={s.mprogBar}><i style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className={s.finForm}>
              <div className={s.finToggle}>
                <button className={finType === "expense" ? s.finTogOn : ""} onClick={() => setFinType("expense")}>Expense</button>
                <button className={finType === "income" ? s.finTogOn : ""} onClick={() => setFinType("income")}>Income</button>
              </div>
              <input className={s.appSearch} value={finTitle} onChange={(e) => setFinTitle(e.target.value)} placeholder={finType === "expense" ? "What did you spend on?" : "Income source"} />
              {finType === "expense" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {EXP_CATS.map((c) => (
                    <button key={c.key} className={`${s.chip} ${finCat === c.key ? s.chipOn : ""}`} style={{ flex: "0 0 auto", padding: "7px 11px" }} onClick={() => setFinCat(c.key)}>{c.label}</button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input className={s.appSearch} style={{ marginTop: 0, flex: 1 }} value={finAmount} onChange={(e) => setFinAmount(e.target.value)} type="number" placeholder="Amount ₹" />
                <button className={s.modalDone} onClick={addFinance}>Add</button>
              </div>
            </div>
            <div className={s.sec}><h3>Recent</h3></div>
            {recentFinance.length === 0 ? <p className={s.appEmpty}>No transactions yet.</p> : (
              <div className={s.modalList}>
                {recentFinance.map((item) => (
                  <div key={`${item.kind}-${item.id}`} className={s.finRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={s.pT}>{item.title}</div>
                      <div className={s.pSub}>{format(new Date(item.date.replace(/-/g, "/")), "dd MMM")}{item.kind === "expense" && item.category ? ` · ${EXP_CATS.find((c) => c.key === item.category)?.label || item.category}` : ""}</div>
                    </div>
                    <div style={{ fontFamily: "var(--fontM)", fontWeight: 700, fontSize: 13, color: item.kind === "income" ? "var(--ok)" : "var(--red)" }}>
                      {item.kind === "income" ? "+" : "-"}₹{item.amount.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
  );
}

function Check() {
  return <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

// ---- constellation renderer ----
function ConstellationSvg({ month, isDone, interactive, onStar }: {
  month: (typeof roadmap)[number];
  isDone: (mk: string, i: number) => boolean;
  interactive: boolean;
  onStar?: (i: number) => void;
}) {
  const mk = monthKeyOf(month);
  const shape = CONSTELLATIONS[CONSTELLATION[month.month]];
  const n = month.goals.length;
  const nextIdx = month.goals.findIndex((_, i) => !isDone(mk, i));
  const statusOf = (i: number): CkStatus => isDone(mk, i) ? "done" : i === nextIdx ? "current" : "next";
  const color = { done: "#c9ced8", current: "#ffffff", next: "#565b66" };
  const rOf = { done: 4, current: 6, next: 3.4 };

  // Checkpoint positions come from the real figure; overflow falls back to a scatter.
  const cp: [number, number][] = [];
  for (let i = 0; i < n; i++) cp.push(shape?.stars[i] ?? overflowPoint(i));
  const decorative = shape ? shape.stars.slice(n) : [];
  const allStars = shape ? shape.stars : cp;

  return (
    <svg viewBox="0 0 300 320" preserveAspectRatio={interactive ? "xMidYMid meet" : "xMidYMid slice"}>
      {(shape?.lines ?? []).map(([a, b], i) => {
        const pa = allStars[a], pb = allStars[b]; if (!pa || !pb) return null;
        const bright = a < n && b < n && isDone(mk, a) && isDone(mk, b);
        return <line key={i} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={bright ? "#6a6f79" : "#2a2f38"} strokeWidth={1} strokeDasharray={bright ? "" : "3 5"} />;
      })}
      {decorative.map((p, j) => <circle key={`d${j}`} cx={p[0]} cy={p[1]} r={2.6} fill="#3a3f48" />)}
      {cp.map((p, i) => {
        const st = statusOf(i);
        const r = interactive ? rOf[st] : rOf[st] * 0.85;
        return (
          <g key={i} onClick={() => interactive && onStar?.(i)} style={{ cursor: interactive ? "pointer" : "default" }}>
            {interactive && <circle cx={p[0]} cy={p[1]} r={16} fill="transparent" />}
            {st === "current" && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke="#fff" strokeWidth={1} opacity={0.5}><animate attributeName="r" values="9;15;9" dur="2.6s" repeatCount="indefinite" /><animate attributeName="opacity" values=".55;0;.55" dur="2.6s" repeatCount="indefinite" /></circle>}
            <circle cx={p[0]} cy={p[1]} r={r} fill={color[st]} />
          </g>
        );
      })}
    </svg>
  );
}

function ChartView({ chartIdx, setChartIdx, isDone, onToggle }: {
  chartIdx: number;
  setChartIdx: (i: number) => void;
  isDone: (mk: string, i: number) => boolean;
  onToggle: (mk: string, i: number) => void;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const month = roadmap[chartIdx];
  const mk = monthKeyOf(month);
  const nextIdx = month.goals.findIndex((_, i) => !isDone(mk, i));
  const selIdx = sel ?? (nextIdx >= 0 ? nextIdx : 0);
  const selStatus: CkStatus = isDone(mk, selIdx) ? "done" : selIdx === nextIdx ? "current" : "next";
  const statusLabel = { done: "Cleared", current: "In transit", next: "Upcoming" }[selStatus];

  return (
    <div className={s.view}>
      <div className={s.label} style={{ marginBottom: 8 }}>The voyage</div>
      <h2 className={s.h2}>Star Chart</h2>
      <p className={s.pLead}>Every month is a real constellation. Each star is a checkpoint — tap to inspect or clear.</p>
      <div className={s.mtabs}>
        {roadmap.map((m, i) => (
          <button key={i} className={`${s.mtab} ${i === chartIdx ? s.mtabOn : ""}`} onClick={() => { setChartIdx(i); setSel(null); }}>
            {m.shortMonth} · {CONSTELLATION[m.month] || m.theme}
          </button>
        ))}
      </div>
      <div className={s.constel}>
        <ConstellationSvg month={month} isDone={isDone} interactive onStar={setSel} />
      </div>
      <div className={s.cdetail}>
        <div className={s.cdM}><span>{CONSTELLATION[month.month] || month.theme} · {month.month}</span><span>★ {selIdx + 1}</span></div>
        <div className={s.cdT}>{month.goals[selIdx]}</div>
        <div className={s.cdD}>{gateOf(month.goals[selIdx])} checkpoint · month goal {selIdx + 1} of {month.goals.length}</div>
        <button className={s.cdSt} onClick={() => onToggle(mk, selIdx)}>{statusLabel} — tap to {isDone(mk, selIdx) ? "reopen" : "clear"}</button>
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}
