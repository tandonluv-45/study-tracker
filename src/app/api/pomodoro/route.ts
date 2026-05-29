import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const date = request.nextUrl.searchParams.get("date");
  let result;
  if (date) {
    result = await db.execute({ sql: "SELECT * FROM pomodoro_sessions WHERE user_id = ? AND date = ? ORDER BY completed_at", args: [user.id, date] });
  } else {
    result = await db.execute({ sql: "SELECT * FROM pomodoro_sessions WHERE user_id = ? ORDER BY completed_at DESC", args: [user.id] });
  }

  const sessions = result.rows.map((r) => ({
    id: r.id, date: r.date, duration: Number(r.duration),
    completedAt: r.completed_at, label: r.label,
  }));

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const body = await request.json();
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO pomodoro_sessions (id, user_id, date, duration, completed_at, label) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, user.id, body.date, body.duration, body.completedAt, body.label || null],
  });

  return NextResponse.json({ id, ...body });
}
