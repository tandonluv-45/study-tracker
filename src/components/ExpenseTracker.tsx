"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fetchExpenses, createExpense, deleteExpense, fetchIncomes, createIncome, deleteIncome, type Expense, type Income } from "@/lib/api";

const CATEGORIES = [
  { key: "food", label: "Food" },
  { key: "shopping", label: "Shopping" },
  { key: "bills", label: "Bills & Recharges" },
  { key: "travel", label: "Travel" },
  { key: "entertainment", label: "Entertainment" },
  { key: "other", label: "Other" },
];

const categoryColors: Record<string, string> = {
  food: "bg-amber-muted text-amber",
  shopping: "bg-accent-muted text-accent",
  bills: "bg-red-muted text-red",
  travel: "bg-blue-muted text-blue",
  entertainment: "bg-rose-muted text-rose",
  other: "bg-sage-muted text-sage",
};

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [expForm, setExpForm] = useState({ title: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), category: "food" });
  const [incForm, setIncForm] = useState({ title: "", amount: "", date: format(new Date(), "yyyy-MM-dd") });

  const reload = useCallback(async () => {
    const [e, i] = await Promise.all([fetchExpenses(), fetchIncomes()]);
    setExpenses(e);
    setIncomes(i);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleAddExpense = async () => {
    if (!expForm.title.trim() || !expForm.amount) return;
    await createExpense({ title: expForm.title.trim(), amount: parseFloat(expForm.amount), date: expForm.date, category: expForm.category });
    setExpForm({ title: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), category: "food" });
    setShowExpenseForm(false);
    reload();
  };

  const handleAddIncome = async () => {
    if (!incForm.title.trim() || !incForm.amount) return;
    await createIncome({ title: incForm.title.trim(), amount: parseFloat(incForm.amount), date: incForm.date });
    setIncForm({ title: "", amount: "", date: format(new Date(), "yyyy-MM-dd") });
    setShowIncomeForm(false);
    reload();
  };

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const byCategory: Record<string, number> = {};
    CATEGORIES.forEach(c => byCategory[c.key] = 0);
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return { totalExpenses, totalIncome, balance: totalIncome - totalExpenses, byCategory };
  }, [expenses, incomes]);

  const recentItems = useMemo(() => {
    const all = [
      ...expenses.map(e => ({ ...e, type: "expense" as const })),
      ...incomes.map(i => ({ ...i, type: "income" as const, category: "income" })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return all.slice(0, 15);
  }, [expenses, incomes]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Expense Tracker</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowExpenseForm(!showExpenseForm); setShowIncomeForm(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-muted text-red hover:opacity-80 transition-colors">
            <TrendingDown size={14} /> Add Expense
          </button>
          <button onClick={() => { setShowIncomeForm(!showIncomeForm); setShowExpenseForm(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-muted text-green hover:opacity-80 transition-colors">
            <TrendingUp size={14} /> Add Income
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green" />
            <span className="text-xs font-medium text-text-muted">Income</span>
          </div>
          <p className="text-xl font-bold text-green">&#8377;{totals.totalIncome.toFixed(0)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-red" />
            <span className="text-xs font-medium text-text-muted">Expenses</span>
          </div>
          <p className="text-xl font-bold text-red">&#8377;{totals.totalExpenses.toFixed(0)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className={totals.balance >= 0 ? "text-green" : "text-red"} />
            <span className="text-xs font-medium text-text-muted">Balance</span>
          </div>
          <p className={`text-xl font-bold ${totals.balance >= 0 ? "text-green" : "text-red"}`}>
            &#8377;{totals.balance.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Add expense form */}
      {showExpenseForm && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">New Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input type="text" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
              placeholder="What did you spend on?" className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent sm:col-span-2" />
            <input type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
              placeholder="Amount" step="0.01" className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
            <input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent" />
            <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent sm:col-span-2">
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <button onClick={handleAddExpense}
              className="px-4 py-2 bg-red text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors sm:col-span-2">
              Add Expense
            </button>
          </div>
        </div>
      )}

      {/* Add income form */}
      {showIncomeForm && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">New Income</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input type="text" value={incForm.title} onChange={(e) => setIncForm({ ...incForm, title: e.target.value })}
              placeholder="Income source (e.g. Salary)" className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent sm:col-span-2" />
            <input type="number" value={incForm.amount} onChange={(e) => setIncForm({ ...incForm, amount: e.target.value })}
              placeholder="Amount" step="0.01" className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
            <input type="date" value={incForm.date} onChange={(e) => setIncForm({ ...incForm, date: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent sm:col-span-2" />
            <button onClick={handleAddIncome}
              className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
              Add Income
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-muted mb-3">Spending by Category</h3>
          {totals.totalExpenses === 0 ? (
            <p className="text-sm text-text-dim py-6 text-center">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map(c => {
                const val = totals.byCategory[c.key] || 0;
                if (val === 0) return null;
                const pct = totals.totalExpenses ? (val / totals.totalExpenses * 100) : 0;
                return (
                  <div key={c.key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-sm text-text-muted">&#8377;{val.toFixed(0)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-muted mb-3">Recent Activity</h3>
          {recentItems.length === 0 ? (
            <p className="text-sm text-text-dim py-6 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === "income" ? "bg-green" : "bg-red"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-text-dim">
                      {format(new Date(item.date), "MMM d")}
                      {item.type === "expense" && ` · ${CATEGORIES.find(c => c.key === item.category)?.label || item.category}`}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${item.type === "income" ? "text-green" : "text-red"}`}>
                    {item.type === "income" ? "+" : "-"}&#8377;{item.amount.toFixed(0)}
                  </span>
                  <button onClick={() => item.type === "expense" ? deleteExpense(item.id).then(reload) : deleteIncome(item.id).then(reload)}
                    className="p-1 rounded hover:bg-red-muted text-text-dim hover:text-red transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
