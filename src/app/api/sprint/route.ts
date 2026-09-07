import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";

const DEFAULT = { startDate: "2026-09-14", daysOff: [], overrides: {}, statuses: {} };

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();
  const res = await db.execute({ sql: "SELECT data FROM sprint_state WHERE user_id = ?", args: [user.id] });
  if (res.rows.length === 0) return NextResponse.json(DEFAULT);
  try {
    return NextResponse.json({ ...DEFAULT, ...JSON.parse(String(res.rows[0].data)) });
  } catch {
    return NextResponse.json(DEFAULT);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const body = await request.json();
  // Load current, merge shallow, save.
  const res = await db.execute({ sql: "SELECT data FROM sprint_state WHERE user_id = ?", args: [user.id] });
  let current = { ...DEFAULT };
  if (res.rows.length > 0) { try { current = { ...DEFAULT, ...JSON.parse(String(res.rows[0].data)) }; } catch { /* keep default */ } }
  const merged = { ...current, ...body };
  const now = new Date().toISOString();
  await db.execute({
    sql: "INSERT INTO sprint_state (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    args: [user.id, JSON.stringify(merged), now],
  });
  return NextResponse.json(merged);
}
