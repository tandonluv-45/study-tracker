import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  await initDB();
  const date = request.nextUrl.searchParams.get("date");
  const startDate = request.nextUrl.searchParams.get("start");
  const endDate = request.nextUrl.searchParams.get("end");

  let result;
  if (date) {
    result = await db.execute({ sql: "SELECT * FROM tasks WHERE date = ? ORDER BY created_at", args: [date] });
  } else if (startDate && endDate) {
    result = await db.execute({ sql: "SELECT * FROM tasks WHERE date >= ? AND date <= ? ORDER BY date, created_at", args: [startDate, endDate] });
  } else {
    result = await db.execute("SELECT * FROM tasks ORDER BY date, created_at");
  }

  const tasks = result.rows.map((r) => ({
    id: r.id,
    title: r.title,
    completed: !!r.completed,
    date: r.date,
    category: r.category,
    subject: r.subject,
    dueDate: r.due_date,
    priority: r.priority,
    createdAt: r.created_at,
  }));

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  await initDB();
  const body = await request.json();
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: "INSERT INTO tasks (id, title, completed, date, category, subject, due_date, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      id,
      body.title,
      body.completed ? 1 : 0,
      body.date,
      body.category || "daily",
      body.subject || null,
      body.dueDate || null,
      body.priority || "medium",
      createdAt,
    ],
  });

  return NextResponse.json({ id, ...body, createdAt });
}

export async function PUT(request: NextRequest) {
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
    values.push(id);
    await db.execute({ sql: `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`, args: values });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  await initDB();
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
  }
  return NextResponse.json({ ok: true });
}
