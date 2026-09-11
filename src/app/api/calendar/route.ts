import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getGoogleTokens, getValidAccessToken, disconnectGoogle } from "@/lib/googleTokens";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await getGoogleTokens(user.id);
  if (!row) return NextResponse.json({ connected: false, events: [] });

  const token = await getValidAccessToken(user.id);
  if (!token) return NextResponse.json({ connected: false, events: [] });

  const timeMin = request.nextUrl.searchParams.get("timeMin");
  const timeMax = request.nextUrl.searchParams.get("timeMax");

  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    // Token likely revoked — report disconnected so the UI can offer reconnect.
    return NextResponse.json({ connected: false, events: [], error: "fetch_failed" }, { status: 200 });
  }

  const data = await res.json();
  const events = (data.items || []).map(
    (item: { id: string; summary?: string; location?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({
      id: item.id,
      summary: item.summary || "(No title)",
      location: item.location || "",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      allDay: !item.start?.dateTime,
    })
  );

  return NextResponse.json({ connected: true, events });
}

export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await disconnectGoogle(user.id);
  return NextResponse.json({ ok: true });
}
