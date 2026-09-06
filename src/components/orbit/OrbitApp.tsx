"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { roadmap } from "@/lib/roadmap-data";
import {
  fetchGoals, toggleGoal, fetchTasks, updateTask, createTask,
  type GoalCompletion, type Task, type UserSession,
} from "@/lib/api";
import { usePomodoroContext } from "@/lib/PomodoroContext";
import {
  isNativeApp, BLOCKABLE_APPS, getLockEnabled, setLockEnabled,
  getLockApps, setLockApps, getPermissions, requestUsageAccess, requestOverlay,
} from "@/lib/focusLock";
import { format } from "date-fns";
import s from "./orbit.module.css";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// A real constellation per calendar month.
const CONSTELLATION: Record<string, string> = {
  January:"Gemini", February:"Cancer", March:"Leo", April:"Virgo", May:"Boötes",
  June:"Orion", July:"Lyra", August:"Cygnus", September:"Aquila",
  October:"Pegasus", November:"Andromeda", December:"Taurus",
};

type Tab = "pass" | "chart" | "tasks" | "you";
type CkStatus = "done" | "current" | "next";

const monthKeyOf = (m: { shortMonth: string; year: number }) => `${m.shortMonth}-${m.year}`;

function gateOf(text: string): string {
  const t = text.toLowerCase();
  if (/hugging|rag|neural|vector|context|100x|history|\bai\b/.test(t)) return "AI";
  if (/linalg|linear algebra|\bos\b|dbms|network|core cs/.test(t)) return "Core CS";
  return "DSA";
}

function layoutStars(n: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const y = 30 + t * 280;
    const x = 170 + Math.sin(i * 1.7) * 95 + Math.cos(i * 0.7) * 28;
    pts.push([Math.max(46, Math.min(294, x)), y]);
  }
  return pts;
}

export default function OrbitApp({ user }: { user: UserSession | null }) {
  const pomo = usePomodoroContext();
  const [tab, setTab] = useState<Tab>("pass");
  const [focusOpen, setFocusOpen] = useState(false);
  const [goals, setGoals] = useState<GoalCompletion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  const reloadGoals = useCallback(() => { fetchGoals().then(setGoals); }, []);
  const reloadTasks = useCallback(() => { fetchTasks(today).then(setTasks); }, [today]);
  useEffect(() => { reloadGoals(); reloadTasks(); }, [reloadGoals, reloadTasks]);

  // ---- focus-lock settings ----
  const [lockEnabled, setLockEnabledS] = useState(false);
  const [lockApps, setLockAppsS] = useState<string[]>([]);
  const [perms, setPerms] = useState({ usage: false, overlay: false });
  useEffect(() => {
    if (!isNativeApp()) return;
    setLockEnabledS(getLockEnabled());
    setLockAppsS(getLockApps());
    getPermissions().then(setPerms);
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

  const tasksDone = tasks.filter((t) => t.completed).length;

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

  // ---- task actions ----
  const toggleTask = async (t: Task) => {
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, completed: !x.completed } : x));
    await updateTask(t.id, { completed: !t.completed });
  };
  const addTask = async () => {
    const title = newTask.trim(); if (!title) return;
    setNewTask("");
    await createTask({ title, completed: false, date: today, category: "daily", priority: "medium" });
    reloadTasks();
  };

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
                <div className={`${s.c} ${s.r}`}><div className={s.gk}>Boarding · today</div><div className={s.gv}>{tasksDone}/{tasks.length} tasks · {pomo.sessionsToday} burns</div></div>
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
        </div>
      )}

      {/* ============ CHART ============ */}
      {tab === "chart" && (
        <ChartView chartIdx={chartIdx} setChartIdx={setChartIdx} isDone={isDone} onToggle={async (mk, i) => { await toggleGoal(mk, i); reloadGoals(); }} />
      )}

      {/* ============ TASKS ============ */}
      {tab === "tasks" && (
        <div className={s.view}>
          <div className={s.label} style={{ marginBottom: 8 }}>Today · {format(now, "EEE dd MMM")}</div>
          <h2 className={s.h2}>Manifest</h2>
          <p className={s.pLead}>Objectives for <b>{CONSTELLATION[cur.month] || cur.theme}</b>.</p>
          <div className={s.mprog}>
            <div className={s.mprogLab}><span>CLEARED TODAY</span><span>{tasksDone} / {tasks.length || 0}</span></div>
            <div className={s.mprogBar}><i style={{ width: `${tasks.length ? (tasksDone / tasks.length) * 100 : 0}%` }} /></div>
          </div>
          {tasks.length === 0 ? (
            <p className={s.empty}>No objectives logged today.</p>
          ) : (
            <div className={s.manifest}>
              {tasks.map((t) => (
                <button key={t.id} className={s.task} onClick={() => toggleTask(t)}>
                  <span className={`${s.chk} ${t.completed ? s.chkOn : ""}`}>
                    {t.completed && <Check />}
                  </span>
                  <span className={`${s.tName} ${t.completed ? s.tDone : ""}`}>{t.title}</span>
                  {t.subject && <span className={s.tMeta}>{t.subject}</span>}
                </button>
              ))}
            </div>
          )}
          <div className={s.addRow}>
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add an objective…"
              onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} />
            <button onClick={addTask}>Add</button>
          </div>
        </div>
      )}

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
                  <div className={s.chips}>
                    {BLOCKABLE_APPS.map((a) => {
                      const on = lockApps.includes(a.pkg);
                      return (
                        <button key={a.pkg} className={`${s.chip} ${on ? s.chipOn : ""}`} onClick={() => toggleLockApp(a.pkg)}>
                          <span className={`${s.chipBox} ${on ? s.chipBoxOn : ""}`}>{on && <Check />}</span>{a.label}
                        </button>
                      );
                    })}
                  </div>
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
            <div className={s.fDest}>Approaching checkpoint</div>
            <div className={s.fDestN}>{nextIdx >= 0 ? nextCheckpoint : "Free flight"}</div>
            <div className={s.fClock}>{mm}:{ss}</div>
            <div className={s.fMode}>{pomo.mode === "work" ? "Focus burn" : pomo.mode === "break" ? "Short break" : "Long break"} · {pomo.isRunning ? "engines on" : "idle"}</div>
            <div className={s.fBtns}>
              <button className={s.fBtn} onClick={pomo.reset}>Reset</button>
              <button className={`${s.fBtn} ${s.fBtnPrimary}`} onClick={pomo.toggleRunning}>{pomo.isRunning ? "Pause" : "Launch"}</button>
              <button className={s.fBtn} onClick={() => setFocusOpen(false)}>Close</button>
            </div>
            {pomo.mode === "work" && isNativeApp() && (
              lockEnabled && lockApps.length > 0
                ? (pomo.isRunning && <div className={s.fLock}>◆ distractions locked ◆</div>)
                : <button className={s.recheck} style={{ marginTop: 24 }} onClick={() => goTab("you")}>Set up Focus Lock in “You” →</button>
            )}
          </div>
        </div>
      )}

      {/* ============ NAV ============ */}
      <nav className={s.nav}>
        <button className={`${s.navBtn} ${tab === "pass" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("pass")}>
          <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /></svg>Pass
        </button>
        <button className={`${s.navBtn} ${tab === "chart" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("chart")}>
          <svg viewBox="0 0 24 24"><path d="M5 19 9 8l5 6 3-9 2 5" /><circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" /><circle cx="9" cy="8" r="1.3" fill="currentColor" stroke="none" /><circle cx="14" cy="14" r="1.3" fill="currentColor" stroke="none" /><circle cx="17" cy="5" r="1.3" fill="currentColor" stroke="none" /></svg>Chart
        </button>
        <button className={`${s.navBtn} ${s.fab}`} onClick={() => setFocusOpen(true)}>
          <span className={s.fabCircle}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.2" fill="#000" stroke="none" /></svg></span>Focus
        </button>
        <button className={`${s.navBtn} ${tab === "tasks" && !focusOpen ? s.navOn : ""}`} onClick={() => goTab("tasks")}>
          <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6l1 1 1.5-2M4.5 12l1 1 1.5-2M4.5 18l1 1 1.5-2" /></svg>Tasks
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
  const pts = useMemo(() => layoutStars(month.goals.length), [month.goals.length]);
  const nextIdx = month.goals.findIndex((_, i) => !isDone(mk, i));
  const statusOf = (i: number): CkStatus => isDone(mk, i) ? "done" : i === nextIdx ? "current" : "next";
  const color = { done: "#c9ced8", current: "#ffffff", next: "#3a3d44" };
  const rOf = { done: 4, current: 6, next: 3.2 };

  return (
    <svg viewBox="0 0 340 340" preserveAspectRatio={interactive ? "xMidYMid meet" : "xMidYMid slice"}>
      {pts.slice(1).map((p, i) => {
        const a = pts[i], b = p;
        const bright = isDone(mk, i) && isDone(mk, i + 1);
        return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={bright ? "#5a5f69" : "#20242b"} strokeWidth={1} strokeDasharray={bright ? "" : "3 5"} />;
      })}
      {pts.map((p, i) => {
        const st = statusOf(i);
        const above = p[1] > 40;
        return (
          <g key={i} onClick={() => interactive && onStar?.(i)} style={{ cursor: interactive ? "pointer" : "default" }}>
            {st === "current" && <circle cx={p[0]} cy={p[1]} r={9} fill="none" stroke="#fff" strokeWidth={1} opacity={0.5}><animate attributeName="r" values="9;15;9" dur="2.6s" repeatCount="indefinite" /><animate attributeName="opacity" values=".55;0;.55" dur="2.6s" repeatCount="indefinite" /></circle>}
            <circle cx={p[0]} cy={p[1]} r={rOf[st]} fill={color[st]} />
            {interactive && (
              <text className={s.clabel} x={p[0]} y={above ? p[1] - 12 : p[1] + 17} textAnchor="middle"
                fill={st === "current" ? "#F3F4F6" : st === "done" ? "#9096a0" : "#4d515a"} fontWeight={st === "current" ? 700 : 400}>
                {shortLabel(month.goals[i])}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function shortLabel(goal: string): string {
  return goal.replace(/^(Complete|Start|Watch|Build and DEPLOY|Build|Scaffold)\s+/i, "").split(/[(,]/)[0].trim().slice(0, 22);
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
