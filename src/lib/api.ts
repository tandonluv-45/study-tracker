// Client-side API helpers — replaces direct localStorage calls

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

const BASE = "";

// Tasks
export async function fetchTasks(date?: string): Promise<Task[]> {
  const url = date ? `${BASE}/api/tasks?date=${date}` : `${BASE}/api/tasks`;
  const res = await fetch(url);
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
  return res.json();
}

export async function createPomodoro(session: Omit<PomodoroSession, "id">): Promise<void> {
  await fetch(`${BASE}/api/pomodoro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
}

// Init DB
export async function initDatabase(): Promise<void> {
  await fetch(`${BASE}/api/init`, { method: "POST" });
}
