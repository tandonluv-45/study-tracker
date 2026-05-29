import { NextRequest, NextResponse } from "next/server";
import { deleteSessionCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = deleteSessionCookie();
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(session.name, session.value, session.options as Parameters<typeof response.cookies.set>[2]);
  return response;
}
