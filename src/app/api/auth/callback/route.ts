import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser } from "@/lib/auth";
import { createSessionCookie } from "@/lib/session";
import { initDB } from "@/lib/db";

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

  if (state === "calendar") {
    // Calendar linking mode — store tokens in localStorage via script
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          localStorage.setItem('google_access_token', '${tokens.access_token}');
          ${tokens.refresh_token ? `localStorage.setItem('google_refresh_token', '${tokens.refresh_token}');` : ""}
          window.location.href = '/';
        </script>
      </body>
      </html>
    `;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
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
