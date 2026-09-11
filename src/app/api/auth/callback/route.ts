import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser } from "@/lib/auth";
import { createSessionCookie, getSession } from "@/lib/session";
import { initDB } from "@/lib/db";
import { saveGoogleTokens, parseCalendarState } from "@/lib/googleTokens";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") || "login";

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?error=missing_config", request.url));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/?error=token_failed", request.url));
  }

  const tokens = await tokenRes.json();

  if (state.startsWith("calendar")) {
    // Calendar linking — attach to the right account. Prefer the session cookie
    // (web); otherwise fall back to the signed user id carried in `state` (app,
    // where the flow finished in an external browser without our cookie).
    const sessionUser = await getSession();
    const userId = sessionUser?.id || parseCalendarState(state);
    if (!userId) {
      return NextResponse.redirect(new URL("/?error=login_first", request.url));
    }
    await saveGoogleTokens(userId, tokens);
    return NextResponse.redirect(new URL("/?calendar=connected", request.url));
  }

  // Login mode — get user info and create session
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL("/?error=userinfo_failed", request.url));
  }

  const userInfo = await userInfoRes.json();

  // Initialize DB tables if needed
  await initDB();

  // Find or create user
  const user = await findOrCreateUser(
    userInfo.email,
    userInfo.name || userInfo.email.split("@")[0],
    userInfo.picture
  );

  // Set session cookie
  const session = createSessionCookie(user.id);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(session.name, session.value, session.options as Parameters<typeof response.cookies.set>[2]);

  return response;
}
