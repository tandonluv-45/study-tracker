import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const month = request.nextUrl.searchParams.get("month");
  let result;
  if (month) {
    result = await db.execute({
      sql: "SELECT * FROM incomes WHERE user_id = ? AND date LIKE ? ORDER BY date DESC, created_at DESC",
      args: [user.id, `${month}%`],
    });
  } else {
    result = await db.execute({
      sql: "SELECT * FROM incomes WHERE user_id = ? ORDER BY date DESC, created_at DESC",
      args: [user.id],
    });
  }

  const incomes = result.rows.map((r) => ({
    id: r.id, title: r.title, amount: Number(r.amount),
    date: r.date, createdAt: r.created_at,
  }));

  return NextResponse.json(incomes);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const body = await request.json();
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: "INSERT INTO incomes (id, user_id, title, amount, date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, user.id, body.title, body.amount, body.date, createdAt],
  });

  return NextResponse.json({ id, ...body, createdAt });
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    await db.execute({ sql: "DELETE FROM incomes WHERE id = ? AND user_id = ?", args: [id, user.id] });
  }
  return NextResponse.json({ ok: true });
}
