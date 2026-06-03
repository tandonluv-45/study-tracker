// Client-side API helpers

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  category: "daily" | "roadmap" | "assignment" | "custom";
  subject?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  createdAt: string;
}

export interface GoalCompletion {
  monthKey: string;
  goalIndex: number;
  completed: boolean;
}

export interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  room?: string;
  type: "lecture" | "lab" | "tutorial";
}

export interface PomodoroSession {
  id: string;
  date: string;
  duration: number;
  completedAt: string;
  label?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  createdAt: string;
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  picture?: string;
  isOwner: boolean;
}

const BASE = "";

// Auth
export async function getSessionUser(): Promise<UserSession | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/session`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

// Tasks
export async function fetchTasks(date?: string): Promise<Task[]> {
  const url = date ? `${BASE}/api/tasks?date=${date}` : `${BASE}/api/tasks`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return res.json();
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await fetch(`${BASE}/api/tasks`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await fetch(`${BASE}/api/tasks?id=${id}`, { method: "DELETE" });
}

// Goals
export async function fetchGoals(): Promise<GoalCompletion[]> {
  const res = await fetch(`${BASE}/api/goals`);
  if (!res.ok) return [];
  return res.json();
}

export async function toggleGoal(monthKey: string, goalIndex: number): Promise<{ completed: boolean }> {
  const res = await fetch(`${BASE}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthKey, goalIndex }),
  });
  return res.json();
}

// Timetable
export async function fetchTimetable(): Promise<TimetableSlot[]> {
  const res = await fetch(`${BASE}/api/timetable`);
  if (!res.ok) return [];
  return res.json();
}

export async function createTimetableSlot(slot: Omit<TimetableSlot, "id">): Promise<TimetableSlot> {
  const res = await fetch(`${BASE}/api/timetable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slot),
  });
  return res.json();
}

export async function deleteTimetableSlot(id: string): Promise<void> {
  await fetch(`${BASE}/api/timetable?id=${id}`, { method: "DELETE" });
}

// Pomodoro
export async function fetchPomodoro(date?: string): Promise<PomodoroSession[]> {
  const url = date ? `${BASE}/api/pomodoro?date=${date}` : `${BASE}/api/pomodoro`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function createPomodoro(session: Omit<PomodoroSession, "id">): Promise<void> {
  await fetch(`${BASE}/api/pomodoro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
}

// Expenses
export async function fetchExpenses(month?: string): Promise<Expense[]> {
  const url = month ? `${BASE}/api/expenses?month=${month}` : `${BASE}/api/expenses`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function createExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
  const res = await fetch(`${BASE}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  return res.json();
}

export async function updateExpense(id: string, updates: Omit<Expense, "id" | "createdAt">): Promise<void> {
  await fetch(`${BASE}/api/expenses`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await fetch(`${BASE}/api/expenses?id=${id}`, { method: "DELETE" });
}

// Incomes
export async function fetchIncomes(month?: string): Promise<Income[]> {
  const url = month ? `${BASE}/api/incomes?month=${month}` : `${BASE}/api/incomes`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function createIncome(income: Omit<Income, "id" | "createdAt">): Promise<Income> {
  const res = await fetch(`${BASE}/api/incomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(income),
  });
  return res.json();
}

export async function updateIncome(id: string, updates: Omit<Income, "id" | "createdAt">): Promise<void> {
  await fetch(`${BASE}/api/incomes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
}

export async function deleteIncome(id: string): Promise<void> {
  await fetch(`${BASE}/api/incomes?id=${id}`, { method: "DELETE" });
}

// User Roadmap (custom goals for non-owner users)
export interface UserRoadmapMonth {
  id: string;
  monthIndex: number;
  month: string;
  theme: string;
  goals: string[];
}

export async function fetchUserRoadmap(): Promise<UserRoadmapMonth[]> {
  const res = await fetch(`${BASE}/api/roadmap`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveUserRoadmap(month: string, theme: string, goals: string[]): Promise<UserRoadmapMonth> {
  const res = await fetch(`${BASE}/api/roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, theme, goals }),
  });
  return res.json();
}

// Init DB
export async function initDatabase(): Promise<void> {
  await fetch(`${BASE}/api/init`, { method: "POST" });
}
