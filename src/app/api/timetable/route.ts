import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getSession } from "@/lib/session";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const result = await db.execute({
    sql: "SELECT * FROM timetable WHERE user_id = ? ORDER BY day, start_time",
    args: [user.id],
  });
  const slots = result.rows.map((r) => ({
    id: r.id, day: r.day, startTime: r.start_time, endTime: r.end_time,
    subject: r.subject, room: r.room, type: r.type,
  }));
  return NextResponse.json(slots);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const body = await request.json();
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO timetable (id, user_id, day, start_time, end_time, subject, room, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, user.id, body.day, body.startTime, body.endTime, body.subject, body.room || null, body.type || "lecture"],
  });

  return NextResponse.json({ id, ...body });
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await initDB();

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    await db.execute({ sql: "DELETE FROM timetable WHERE id = ? AND user_id = ?", args: [id, user.id] });
  }
  return NextResponse.json({ ok: true });
}
