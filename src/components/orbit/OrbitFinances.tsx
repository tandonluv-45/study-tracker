"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchExpenses, fetchIncomes, fetchExpensesRange, fetchIncomesRange,
  createExpense, createIncome, type Expense, type Income,
} from "@/lib/api";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import s from "./orbit.module.css";

export const EXP_CATS = [
  { key: "food", label: "Food" }, { key: "shopping", label: "Shopping" }, { key: "bills", label: "Bills" },
  { key: "travel", label: "Travel" }, { key: "entertainment", label: "Fun" }, { key: "other", label: "Other" },
];
const catLabel = (k?: string) => EXP_CATS.find((c) => c.key === k)?.label || k || "Other";

export default function OrbitFinances({ onClose, onChange }: { onClose: () => void; onChange?: () => void }) {
  const [mode, setMode] = useState<"month" | "range">("month");
  const [month, setMonth] = useState(new Date());
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);

  const load = useCallback(() => {
    if (mode === "month") {
      const m = format(month, "yyyy-MM");
      fetchExpenses(m).then(setExpenses); fetchIncomes(m).then(setIncomes);
    } else {
      fetchExpensesRange(from, to).then(setExpenses); fetchIncomesRange(from, to).then(setIncomes);
    }
  }, [mode, month, from, to]);
  useEffect(() => { load(); }, [load]);

  const totalIncome = incomes.reduce((a, i) => a + i.amount, 0);
  const totalSpent = expenses.reduce((a, e) => a + e.amount, 0);
  const balance = totalIncome - totalSpent;

  const byCategory = EXP_CATS.map((c) => ({
    ...c, amount: expenses.filter((e) => e.category === c.key).reduce((a, e) => a + e.amount, 0),
  })).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

  const recent = [
    ...expenses.map((e) => ({ ...e, kind: "expense" as const })),
    ...incomes.map((i) => ({ ...i, kind: "income" as const })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);

  // add form
  const [finType, setFinType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("food");
  const todayISO = format(new Date(), "yyyy-MM-dd");
  const add = async () => {
    const amt = parseFloat(amount);
    if (!title.trim() || !amt) return;
    if (finType === "expense") await createExpense({ title: title.trim(), amount: amt, date: todayISO, category: cat });
    else await createIncome({ title: title.trim(), amount: amt, date: todayISO });
    setTitle(""); setAmount("");
    load(); onChange?.();
  };

  const spanLabel = mode === "month"
    ? format(month, "MMMM yyyy")
    : `${format(new Date(from.replace(/-/g, "/")), "dd MMM")} – ${format(new Date(to.replace(/-/g, "/")), "dd MMM yyyy")}`;
  const nDays = mode === "range"
    ? Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1)
    : endOfMonth(month).getDate();

  return (
    <div className={s.modal}>
      <div className={s.modalHead}>
        <div className={s.modalTitle}>Finances<small>{spanLabel}</small></div>
        <button className={s.modalDone} onClick={onClose}>Done</button>
      </div>
      <div className={s.modalBody}>
        {/* mode switch */}
        <div className={s.finToggle} style={{ marginBottom: 14 }}>
          <button className={mode === "month" ? s.finTogOn : ""} onClick={() => setMode("month")}>By month</button>
          <button className={mode === "range" ? s.finTogOn : ""} onClick={() => setMode("range")}>Date range</button>
        </div>

        {mode === "month" ? (
          <div className={s.calHead} style={{ marginTop: 0 }}>
            <button className={s.calNav} onClick={() => setMonth(subMonths(month, 1))}>‹</button>
            <span style={{ fontFamily: "var(--fontD)", fontWeight: 600 }}>{format(month, "MMMM yyyy")}</span>
            <button className={s.calNav} onClick={() => setMonth(addMonths(month, 1))}>›</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <label style={{ flex: 1 }}><span className={s.finK}>From</span><input className={s.field} type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
            <label style={{ flex: 1 }}><span className={s.finK}>To</span><input className={s.field} type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
        )}

        <div className={s.finCard} style={{ marginTop: 14 }}>
          <div><div className={s.finK}>Income</div><div className={s.finV} style={{ color: "var(--ok)" }}>₹{totalIncome.toFixed(0)}</div></div>
          <div><div className={s.finK}>Spent</div><div className={s.finV} style={{ color: "var(--red)" }}>₹{totalSpent.toFixed(0)}</div></div>
          <div><div className={s.finK}>Balance</div><div className={s.finV} style={{ color: balance < 0 ? "var(--red)" : "var(--text)" }}>₹{balance.toFixed(0)}</div></div>
        </div>
        <div className={s.finMeta}>{recent.length} entries · {nDays} days · avg spend ₹{(totalSpent / nDays).toFixed(0)}/day</div>

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
          <input className={s.appSearch} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={finType === "expense" ? "What did you spend on?" : "Income source"} />
          {finType === "expense" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {EXP_CATS.map((c) => (
                <button key={c.key} className={`${s.chip} ${cat === c.key ? s.chipOn : ""}`} style={{ flex: "0 0 auto", padding: "7px 11px" }} onClick={() => setCat(c.key)}>{c.label}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input className={s.appSearch} style={{ marginTop: 0, flex: 1 }} value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount ₹" />
            <button className={s.modalDone} onClick={add}>Add</button>
          </div>
        </div>

        <div className={s.sec}><h3>Transactions</h3></div>
        {recent.length === 0 ? <p className={s.appEmpty}>Nothing in this {mode === "month" ? "month" : "range"}.</p> : (
          <div className={s.modalList}>
            {recent.map((item) => (
              <div key={`${item.kind}-${item.id}`} className={s.finRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.pT}>{item.title}</div>
                  <div className={s.pSub}>{format(new Date(item.date.replace(/-/g, "/")), "dd MMM")}{item.kind === "expense" && "category" in item ? ` · ${catLabel((item as Expense).category)}` : ""}</div>
                </div>
                <div style={{ fontFamily: "var(--fontM)", fontWeight: 700, fontSize: 13, color: item.kind === "income" ? "var(--ok)" : "var(--red)" }}>
                  {item.kind === "income" ? "+" : "-"}₹{item.amount.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
