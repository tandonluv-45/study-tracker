import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  await initDB();
  const result = await db.execute("SELECT * FROM timetable ORDER BY day, start_time");
  const slots = result.rows.map((r) => ({
    id: r.id,
    day: r.day,
    startTime: r.start_time,
    endTime: r.end_time,
    subject: r.subject,
    room: r.room,
    type: r.type,
  }));
  return NextResponse.json(slots);
}

export async function POST(request: NextRequest) {
  await initDB();
  const body = await request.json();
  const id = uuidv4();

  await db.execute({
    sql: "INSERT INTO timetable (id, day, start_time, end_time, subject, room, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, body.day, body.startTime, body.endTime, body.subject, body.room || null, body.type || "lecture"],
  });

  return NextResponse.json({ id, ...body });
}

export async function DELETE(request: NextRequest) {
  await initDB();
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    await db.execute({ sql: "DELETE FROM timetable WHERE id = ?", args: [id] });
  }
  return NextResponse.json({ ok: true });
}
