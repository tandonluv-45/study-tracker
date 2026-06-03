"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import type { Expense, Income } from "@/lib/api";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Category {
  key: string;
  label: string;
}

interface Props {
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  byCategory: Record<string, number>;
  totalExpenses: number;
}

// Resolve a CSS custom property to its computed color value
function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Distinct color per category, pulled from the app's theme tokens
const CATEGORY_VARS: Record<string, [string, string]> = {
  food: ["--color-amber", "#B8956A"],
  shopping: ["--color-accent", "#7A8F5C"],
  bills: ["--color-red", "#C47070"],
  travel: ["--color-blue", "#7A8FA5"],
  entertainment: ["--color-rose", "#BA9A91"],
  other: ["--color-sage", "#B7C396"],
};

function getLastNMonths(n: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleString("default", { month: "short" }) });
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

function sumByMonth(items: { date: string; amount: number }[], monthKeys: string[]): number[] {
  const sums = monthKeys.map(() => 0);
  items.forEach((it) => {
    const mk = it.date.slice(0, 7); // YYYY-MM
    const idx = monthKeys.indexOf(mk);
    if (idx >= 0) sums[idx] += it.amount;
  });
  return sums;
}

export default function ExpenseCharts({ expenses, incomes, categories, byCategory, totalExpenses }: Props) {
  // Track theme so charts recolor on light/dark toggle
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((t) => t + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const colors = useMemo(() => {
    void themeTick; // recompute when theme changes
    return {
      text: cssVar("--color-text", "#2A2A2A"),
      textMuted: cssVar("--color-text-muted", "#6B6B6B"),
      border: cssVar("--color-border", "#E0E0D8"),
      surface: cssVar("--color-surface", "#FFFFFF"),
      green: cssVar("--color-green", "#6B8F4E"),
      red: cssVar("--color-red", "#C47070"),
    };
  }, [themeTick]);

  const months = useMemo(() => getLastNMonths(6), []);
  const monthKeys = months.map((m) => m.key);

  const pieData = useMemo(() => {
    void themeTick;
    const active = categories.filter((c) => (byCategory[c.key] || 0) > 0);
    return {
      labels: active.map((c) => c.label),
      datasets: [
        {
          data: active.map((c) => byCategory[c.key] || 0),
          backgroundColor: active.map((c) => {
            const [varName, fallback] = CATEGORY_VARS[c.key] || ["--color-sage", "#B7C396"];
            return cssVar(varName, fallback);
          }),
          borderWidth: 2,
          borderColor: cssVar("--color-surface", "#FFFFFF"),
        },
      ],
    };
  }, [categories, byCategory, themeTick]);

  const barData = useMemo(() => {
    void themeTick;
    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: "Income",
          data: sumByMonth(incomes, monthKeys),
          backgroundColor: colors.green,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
        },
        {
          label: "Expenses",
          data: sumByMonth(expenses, monthKeys),
          backgroundColor: colors.red,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.7,
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, incomes, colors, themeTick]);

  const pieOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { color: colors.textMuted, boxWidth: 12, padding: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { label?: string; raw: unknown }) => {
              const val = Number(ctx.raw || 0);
              const pct = totalExpenses ? ((val / totalExpenses) * 100).toFixed(0) : "0";
              return ` ${ctx.label}: ₹${val.toFixed(0)} (${pct}%)`;
            },
          },
        },
      },
    }),
    [colors, totalExpenses]
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { color: colors.textMuted, boxWidth: 12, padding: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
              ` ${ctx.dataset.label}: ₹${Number(ctx.raw || 0).toFixed(0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, color: colors.border },
          ticks: { color: colors.textMuted, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: colors.border },
          ticks: {
            color: colors.textMuted,
            font: { size: 11 },
            callback: (val: string | number) => `₹${val}`,
          },
        },
      },
    }),
    [colors]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* Pie: spending by category */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-muted mb-3">Spending by Category</h3>
        {totalExpenses === 0 ? (
          <p className="text-sm text-text-dim py-16 text-center">No expenses recorded yet.</p>
        ) : (
          <div style={{ height: 260 }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        )}
      </div>

      {/* Bar: income vs expenses, last 6 months */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-muted mb-3">Income vs Expenses (last 6 months)</h3>
        <div style={{ height: 260 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
