import { v4 as uuidv4 } from "uuid";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  category: "daily" | "roadmap" | "assignment" | "custom";
  subject?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  createdAt: string;
}

export interface GoalCompletion {
  monthKey: string; // "Jun-2026"
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
  duration: number; // minutes
  completedAt: string;
  label?: string;
}

const KEYS = {
  TASKS: "tracker_tasks",
  GOALS: "tracker_goals",
  TIMETABLE: "tracker_timetable",
  POMODORO: "tracker_pomodoro",
  SETTINGS: "tracker_settings",
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Tasks
export function getTasks(date?: string): Task[] {
  const all = getItem<Task[]>(KEYS.TASKS, []);
  if (date) return all.filter((t) => t.date === date);
  return all;
}

export function getTasksByDateRange(start: string, end: string): Task[] {
  const all = getItem<Task[]>(KEYS.TASKS, []);
  return all.filter((t) => t.date >= start && t.date <= end);
}

export function addTask(task: Omit<Task, "id" | "createdAt">): Task {
  const all = getItem<Task[]>(KEYS.TASKS, []);
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  all.push(newTask);
  setItem(KEYS.TASKS, all);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const all = getItem<Task[]>(KEYS.TASKS, []);
  const idx = all.findIndex((t) => t.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    setItem(KEYS.TASKS, all);
  }
}

export function deleteTask(id: string): void {
  const all = getItem<Task[]>(KEYS.TASKS, []);
  setItem(
    KEYS.TASKS,
    all.filter((t) => t.id !== id)
  );
}

// Goal completions
export function getGoalCompletions(): GoalCompletion[] {
  return getItem<GoalCompletion[]>(KEYS.GOALS, []);
}

export function toggleGoal(monthKey: string, goalIndex: number): void {
  const all = getItem<GoalCompletion[]>(KEYS.GOALS, []);
  const existing = all.find(
    (g) => g.monthKey === monthKey && g.goalIndex === goalIndex
  );
  if (existing) {
    existing.completed = !existing.completed;
  } else {
    all.push({ monthKey, goalIndex, completed: true });
  }
  setItem(KEYS.GOALS, all);
}

export function isGoalCompleted(
  monthKey: string,
  goalIndex: number
): boolean {
  const all = getItem<GoalCompletion[]>(KEYS.GOALS, []);
  const found = all.find(
    (g) => g.monthKey === monthKey && g.goalIndex === goalIndex
  );
  return found?.completed ?? false;
}

export function getMonthProgress(monthKey: string, totalGoals: number): number {
  const all = getItem<GoalCompletion[]>(KEYS.GOALS, []);
  const completed = all.filter(
    (g) => g.monthKey === monthKey && g.completed
  ).length;
  return totalGoals > 0 ? Math.round((completed / totalGoals) * 100) : 0;
}

// Timetable
export function getTimetable(): TimetableSlot[] {
  return getItem<TimetableSlot[]>(KEYS.TIMETABLE, []);
}

export function addTimetableSlot(
  slot: Omit<TimetableSlot, "id">
): TimetableSlot {
  const all = getItem<TimetableSlot[]>(KEYS.TIMETABLE, []);
  const newSlot: TimetableSlot = { ...slot, id: uuidv4() };
  all.push(newSlot);
  setItem(KEYS.TIMETABLE, all);
  return newSlot;
}

export function deleteTimetableSlot(id: string): void {
  const all = getItem<TimetableSlot[]>(KEYS.TIMETABLE, []);
  setItem(
    KEYS.TIMETABLE,
    all.filter((s) => s.id !== id)
  );
}

// Pomodoro
export function getPomodoroSessions(date?: string): PomodoroSession[] {
  const all = getItem<PomodoroSession[]>(KEYS.POMODORO, []);
  if (date) return all.filter((s) => s.date === date);
  return all;
}

export function addPomodoroSession(
  session: Omit<PomodoroSession, "id">
): void {
  const all = getItem<PomodoroSession[]>(KEYS.POMODORO, []);
  all.push({ ...session, id: uuidv4() });
  setItem(KEYS.POMODORO, all);
}
