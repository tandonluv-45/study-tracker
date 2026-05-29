import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const result = await db.execute({
    sql: "SELECT * FROM goal_completions WHERE user_id = ? AND completed = 1",
    args: [user.id],
  });
  const completions = result.rows.map((r) => ({
    monthKey: r.month_key,
    goalIndex: Number(r.goal_index),
    completed: !!r.completed,
  }));
  return NextResponse.json(completions);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const { monthKey, goalIndex } = await request.json();

  const existing = await db.execute({
    sql: "SELECT completed FROM goal_completions WHERE user_id = ? AND month_key = ? AND goal_index = ?",
    args: [user.id, monthKey, goalIndex],
  });

  if (existing.rows.length > 0) {
    const wasCompleted = !!existing.rows[0].completed;
    if (wasCompleted) {
      await db.execute({
        sql: "DELETE FROM goal_completions WHERE user_id = ? AND month_key = ? AND goal_index = ?",
        args: [user.id, monthKey, goalIndex],
      });
    } else {
      await db.execute({
        sql: "UPDATE goal_completions SET completed = 1 WHERE user_id = ? AND month_key = ? AND goal_index = ?",
        args: [user.id, monthKey, goalIndex],
      });
    }
    return NextResponse.json({ completed: !wasCompleted });
  } else {
    await db.execute({
      sql: "INSERT INTO goal_completions (user_id, month_key, goal_index, completed) VALUES (?, ?, ?, 1)",
      args: [user.id, monthKey, goalIndex],
    });
    return NextResponse.json({ completed: true });
  }
}
