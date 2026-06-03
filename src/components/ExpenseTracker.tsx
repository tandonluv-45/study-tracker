"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Trash2, Pencil, X, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { format } from "date-fns";
import {
  fetchExpenses, createExpense, updateExpense, deleteExpense,
  fetchIncomes, createIncome, updateIncome, deleteIncome,
  type Expense, type Income,
} from "@/lib/api";
import ExpenseCharts from "./ExpenseCharts";

const CATEGORIES = [
  { key: "food", label: "Food" },
  { key: "shopping", label: "Shopping" },
  { key: "bills", label: "Bills & Recharges" },
  { key: "travel", label: "Travel" },
  { key: "entertainment", label: "Entertainment" },
  { key: "other", label: "Other" },
];

const emptyExpForm = { title: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), category: "food" };
const emptyIncForm = { title: "", amount: "", date: format(new Date(), "yyyy-MM-dd") };

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState(emptyExpForm);
  const [incForm, setIncForm] = useState(emptyIncForm);

  const reload = useCallback(async () => {
    const [e, i] = await Promise.all([fetchExpenses(), fetchIncomes()]);
    setExpenses(e);
    setIncomes(i);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const resetExpenseForm = () => { setExpForm(emptyExpForm); setEditingExpenseId(null); setShowExpenseForm(false); };
  const resetIncomeForm = () => { setIncForm(emptyIncForm); setEditingIncomeId(null); setShowIncomeForm(false); };

  const handleSubmitExpense = async () => {
    if (!expForm.title.trim() || !expForm.amount) return;
    const payload = { title: expForm.title.trim(), amount: parseFloat(expForm.amount), date: expForm.date, category: expForm.category };
    if (editingExpenseId) {
      await updateExpense(editingExpenseId, payload);
    } else {
      await createExpense(payload);
    }
    resetExpenseForm();
    reload();
  };

  const handleSubmitIncome = async () => {
    if (!incForm.title.trim() || !incForm.amount) return;
    const payload = { title: incForm.title.trim(), amount: parseFloat(incForm.amount), date: incForm.date };
    if (editingIncomeId) {
      await updateIncome(editingIncomeId, payload);
    } else {
      await createIncome(payload);
    }
    resetIncomeForm();
    reload();
  };

  const startEditExpense = (e: Expense) => {
    setEditingExpenseId(e.id);
    setExpForm({ title: e.title, amount: String(e.amount), date: e.date, category: e.category });
    setShowExpenseForm(true);
    setShowIncomeForm(false);
  };

  const startEditIncome = (i: Income) => {
    setEditingIncomeId(i.id);
    setIncForm({ title: i.title, amount: String(i.amount), date: i.date });
    setShowIncomeForm(true);
    setShowExpenseForm(false);
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
    return all.slice(0, 20);
  }, [expenses, incomes]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold">Expense Tracker</h2>
        <div className="flex gap-2">
          <button onClick={() => { resetExpenseForm(); setShowExpenseForm(true); setShowIncomeForm(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-muted text-red hover:opacity-80 transition-colors">
            <TrendingDown size={14} /> Add Expense
          </button>
          <button onClick={() => { resetIncomeForm(); setShowIncomeForm(true); setShowExpenseForm(false); }}
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

      {/* Add/Edit expense form */}
      {showExpenseForm && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{editingExpenseId ? "Edit Expense" : "New Expense"}</h3>
            <button onClick={resetExpenseForm} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
            <button onClick={handleSubmitExpense}
              className="px-4 py-2 bg-red text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors sm:col-span-2">
              {editingExpenseId ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit income form */}
      {showIncomeForm && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{editingIncomeId ? "Edit Income" : "New Income"}</h3>
            <button onClick={resetIncomeForm} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" value={incForm.title} onChange={(e) => setIncForm({ ...incForm, title: e.target.value })}
              placeholder="Income source (e.g. Salary)" className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent sm:col-span-2" />
            <input type="number" value={incForm.amount} onChange={(e) => setIncForm({ ...incForm, amount: e.target.value })}
              placeholder="Amount" step="0.01" className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
            <input type="date" value={incForm.date} onChange={(e) => setIncForm({ ...incForm, date: e.target.value })}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent sm:col-span-2" />
            <button onClick={handleSubmitIncome}
              className="px-4 py-2 bg-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
              {editingIncomeId ? "Save Changes" : "Add Income"}
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      <ExpenseCharts
        expenses={expenses}
        incomes={incomes}
        categories={CATEGORIES}
        byCategory={totals.byCategory}
        totalExpenses={totals.totalExpenses}
      />

      {/* Recent activity */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-muted mb-3">Recent Activity</h3>
        {recentItems.length === 0 ? (
          <p className="text-sm text-text-dim py-6 text-center">No transactions yet.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {recentItems.map(item => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors group">
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
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => item.type === "expense" ? startEditExpense(item) : startEditIncome(item)}
                    className="p-1 rounded hover:bg-accent-muted text-text-dim hover:text-accent transition-colors"
                    title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => item.type === "expense" ? deleteExpense(item.id).then(reload) : deleteIncome(item.id).then(reload)}
                    className="p-1 rounded hover:bg-red-muted text-text-dim hover:text-red transition-colors"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
