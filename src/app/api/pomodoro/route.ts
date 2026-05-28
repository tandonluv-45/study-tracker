import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  await initDB();
  const date = request.nextUrl.searchParams.get("date");

  let result;
  if (date) {
    result = await db.execute({ sql: "SELECT * FROM pomodoro_sessions WHERE date = ? ORDER BY completed_at", args: [date] });
  } else {
    result = await db.execute("SELECT * FROM pomodoro_sessions ORDER BY completed_at DESC");
  }

  const sessions = result.rows.map((r) => ({
    id: r.id,
    date: r.date,
    duration: Number(r.duration),
    completedAt: r.completed_at,
    label: r.label,
  }));

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  await initDB();
  const body = await request.json();
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO pomodoro_sessions (id, date, duration, completed_at, label) VALUES (?, ?, ?, ?, ?)",
    args: [id, body.date, body.duration, body.completedAt, body.label || null],
  });

  return NextResponse.json({ id, ...body });
}
