import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

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

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
