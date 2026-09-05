import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { loginWithPassword, AuthError } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  await initDB();

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const password = body.password || "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  try {
    const user = await loginWithPassword(email, password);
    const cookie = createSessionCookie(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture, isOwner: user.isOwner },
    });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
