import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { makeCalendarState } from "@/lib/googleTokens";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback`;

  // Check if this is for calendar linking or login
  const mode = request.nextUrl.searchParams.get("mode") || "login";

  if (!clientId) {
    return NextResponse.json(
      { error: "Google Client ID not configured" },
      { status: 500 }
    );
  }

  const scopes = mode === "calendar"
    ? "https://www.googleapis.com/auth/calendar.readonly"
    : "openid email profile";

  // For calendar linking, stamp the logged-in user's id into `state` here (this
  // request runs where the session cookie exists — the WebView) so the callback
  // can attach the calendar to the right account even if it finishes in another browser.
  let state = mode;
  if (mode === "calendar") {
    const user = await getSession();
    state = user ? makeCalendarState(user.id) : "calendar";
  }

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  return NextResponse.redirect(authUrl);
}
