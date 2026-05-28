import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";

export async function GET() {
  await initDB();
  const result = await db.execute("SELECT * FROM goal_completions WHERE completed = 1");
  const completions = result.rows.map((r) => ({
    monthKey: r.month_key,
    goalIndex: Number(r.goal_index),
    completed: !!r.completed,
  }));
  return NextResponse.json(completions);
}

export async function POST(request: NextRequest) {
  await initDB();
  const { monthKey, goalIndex } = await request.json();

  // Check if exists
  const existing = await db.execute({
    sql: "SELECT completed FROM goal_completions WHERE month_key = ? AND goal_index = ?",
    args: [monthKey, goalIndex],
  });

  if (existing.rows.length > 0) {
    const wasCompleted = !!existing.rows[0].completed;
    if (wasCompleted) {
      await db.execute({
        sql: "DELETE FROM goal_completions WHERE month_key = ? AND goal_index = ?",
        args: [monthKey, goalIndex],
      });
    } else {
      await db.execute({
        sql: "UPDATE goal_completions SET completed = 1 WHERE month_key = ? AND goal_index = ?",
        args: [monthKey, goalIndex],
      });
    }
    return NextResponse.json({ completed: !wasCompleted });
  } else {
    await db.execute({
      sql: "INSERT INTO goal_completions (month_key, goal_index, completed) VALUES (?, ?, 1)",
      args: [monthKey, goalIndex],
    });
    return NextResponse.json({ completed: true });
  }
}
