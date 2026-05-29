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

let _initialized = false;

export async function initDB() {
  if (_initialized) return;

  // Check if we need migration by looking for users table
  const check = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
  const hasUsers = check.rows.length > 0;

  if (!hasUsers) {
    // Drop old tables without user_id (fresh start - no user data to preserve)
    await db.execute("DROP TABLE IF EXISTS goal_completions");
    await db.execute("DROP TABLE IF EXISTS tasks");
    await db.execute("DROP TABLE IF EXISTS timetable");
    await db.execute("DROP TABLE IF EXISTS pomodoro_sessions");
  }

  // Create all tables
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    is_owner INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    category TEXT DEFAULT 'daily',
    subject TEXT,
    due_date TEXT,
    priority TEXT DEFAULT 'medium',
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS goal_completions (
    user_id TEXT NOT NULL DEFAULT '',
    month_key TEXT NOT NULL,
    goal_index INTEGER NOT NULL,
    completed INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, month_key, goal_index)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS timetable (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject TEXT NOT NULL,
    room TEXT,
    type TEXT DEFAULT 'lecture'
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TEXT NOT NULL,
    label TEXT
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS incomes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS user_roadmap (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    month_index INTEGER NOT NULL,
    month TEXT NOT NULL,
    theme TEXT,
    goals TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  // Indexes (IF NOT EXISTS is safe)
  await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_pomodoro_date ON pomodoro_sessions(date)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_pomodoro_user ON pomodoro_sessions(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");

  _initialized = true;
}
