import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;

function getDB(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

const db = new Proxy({} as Client, {
  get(_, prop) {
    const client = getDB();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

export default db;

export async function initDB() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      category TEXT DEFAULT 'daily',
      subject TEXT,
      due_date TEXT,
      priority TEXT DEFAULT 'medium',
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS goal_completions (
      month_key TEXT NOT NULL,
      goal_index INTEGER NOT NULL,
      completed INTEGER DEFAULT 1,
      PRIMARY KEY (month_key, goal_index)
    )`,
    `CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      room TEXT,
      type TEXT DEFAULT 'lecture'
    )`,
    `CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      label TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`,
    `CREATE INDEX IF NOT EXISTS idx_pomodoro_date ON pomodoro_sessions(date)`,
  ]);
}
