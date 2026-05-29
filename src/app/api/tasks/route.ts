import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

async function requireAuth() {
  const user = await getSession();
  if (!user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const date = request.nextUrl.searchParams.get("date");
  const startDate = request.nextUrl.searchParams.get("start");
  const endDate = request.nextUrl.searchParams.get("end");

  let result;
  if (date) {
    result = await db.execute({ sql: "SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY created_at", args: [user.id, date] });
  } else if (startDate && endDate) {
    result = await db.execute({ sql: "SELECT * FROM tasks WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date, created_at", args: [user.id, startDate, endDate] });
  } else {
    result = await db.execute({ sql: "SELECT * FROM tasks WHERE user_id = ? ORDER BY date, created_at", args: [user.id] });
  }

  const tasks = result.rows.map((r) => ({
    id: r.id, title: r.title, completed: !!r.completed, date: r.date,
    category: r.category, subject: r.subject, dueDate: r.due_date,
    priority: r.priority, createdAt: r.created_at,
  }));

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const body = await request.json();
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: "INSERT INTO tasks (id, user_id, title, completed, date, category, subject, due_date, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, user.id, body.title, body.completed ? 1 : 0, body.date, body.category || "daily", body.subject || null, body.dueDate || null, body.priority || "medium", createdAt],
  });

  return NextResponse.json({ id, ...body, createdAt });
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const body = await request.json();
  const { id, ...updates } = body;
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.completed !== undefined) { fields.push("completed = ?"); values.push(updates.completed ? 1 : 0); }
  if (updates.date !== undefined) { fields.push("date = ?"); values.push(updates.date); }
  if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
  if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority); }

  if (fields.length > 0) {
    values.push(id, user.id);
    await db.execute({ sql: `UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, args: values });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    await db.execute({ sql: "DELETE FROM tasks WHERE id = ? AND user_id = ?", args: [id, user.id] });
  }
  return NextResponse.json({ ok: true });
}
