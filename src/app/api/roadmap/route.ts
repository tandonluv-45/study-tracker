import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const result = await db.execute({
    sql: "SELECT * FROM user_roadmap WHERE user_id = ? ORDER BY month_index",
    args: [user.id],
  });

  const months = result.rows.map((r) => ({
    id: String(r.id),
    monthIndex: Number(r.month_index),
    month: String(r.month),
    theme: r.theme ? String(r.theme) : "",
    goals: JSON.parse(String(r.goals)),
  }));

  return NextResponse.json(months);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const { month, theme, goals } = await request.json();
  const id = uuidv4();
  const now = new Date().toISOString();

  const existing = await db.execute({
    sql: "SELECT id FROM user_roadmap WHERE user_id = ? AND month = ?",
    args: [user.id, month],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: "UPDATE user_roadmap SET theme = ?, goals = ? WHERE user_id = ? AND month = ?",
      args: [theme || "", JSON.stringify(goals || []), user.id, month],
    });
    return NextResponse.json({ id: String(existing.rows[0].id), month, theme, goals });
  }

  const countResult = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM user_roadmap WHERE user_id = ?",
    args: [user.id],
  });
  const monthIndex = Number(countResult.rows[0].cnt);

  await db.execute({
    sql: "INSERT INTO user_roadmap (id, user_id, month_index, month, theme, goals, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, user.id, monthIndex, month, theme || "", JSON.stringify(goals || []), now],
  });

  return NextResponse.json({ id, month, theme, goals });
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    await db.execute({ sql: "DELETE FROM user_roadmap WHERE id = ? AND user_id = ?", args: [id, user.id] });
  }
  return NextResponse.json({ ok: true });
}
