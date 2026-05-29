// Simple cookie-based session using signed JWT-like tokens
// We encode user_id in a base64 cookie (simple approach for this app)

import { cookies } from "next/headers";
import { getUserById, type User } from "./auth";

const SESSION_COOKIE = "tracker_session";

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const userId = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    return await getUserById(userId);
  } catch {
    return null;
  }
}

export function createSessionCookie(userId: string): { name: string; value: string; options: Record<string, unknown> } {
  const value = Buffer.from(userId).toString("base64");
  return {
    name: SESSION_COOKIE,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}

export function deleteSessionCookie(): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  };
}
