import db, { initDB } from "./db";

export interface GoogleTokenRow {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}

export async function saveGoogleTokens(
  userId: string,
  tokens: { access_token?: string; refresh_token?: string; expires_in?: number }
) {
  await initDB();
  const expiresAt = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
  // Keep an existing refresh_token if Google didn't send a new one.
  const existing = await db.execute({
    sql: "SELECT refresh_token FROM google_tokens WHERE user_id = ?",
    args: [userId],
  });
  const prevRefresh = existing.rows[0]?.refresh_token as string | undefined;
  const refresh = tokens.refresh_token || prevRefresh || null;
  await db.execute({
    sql: `INSERT INTO google_tokens (user_id, access_token, refresh_token, expires_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            expires_at = excluded.expires_at,
            updated_at = excluded.updated_at`,
    args: [userId, tokens.access_token ?? null, refresh, expiresAt, new Date().toISOString()],
  });
}

export async function getGoogleTokens(userId: string): Promise<GoogleTokenRow | null> {
  await initDB();
  const res = await db.execute({
    sql: "SELECT access_token, refresh_token, expires_at FROM google_tokens WHERE user_id = ?",
    args: [userId],
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    access_token: (r.access_token as string) ?? null,
    refresh_token: (r.refresh_token as string) ?? null,
    expires_at: r.expires_at != null ? Number(r.expires_at) : null,
  };
}

export async function disconnectGoogle(userId: string) {
  await initDB();
  await db.execute({ sql: "DELETE FROM google_tokens WHERE user_id = ?", args: [userId] });
}

/** Returns a valid access token for the user, refreshing if expired. null if not connected. */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const row = await getGoogleTokens(userId);
  if (!row) return null;

  const stillValid = row.access_token && row.expires_at && row.expires_at - 60_000 > Date.now();
  if (stillValid) return row.access_token;

  // Need to refresh.
  if (!row.refresh_token) return row.access_token; // best effort with what we have
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return row.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const t = await res.json();
  await saveGoogleTokens(userId, { access_token: t.access_token, expires_in: t.expires_in });
  return t.access_token ?? null;
}
