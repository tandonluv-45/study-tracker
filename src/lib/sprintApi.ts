import type { SprintState } from "@/lib/sprint-plan";

export async function fetchSprintState(): Promise<SprintState> {
  const res = await fetch("/api/sprint");
  if (!res.ok) return { startDate: "2026-09-14", daysOff: [], overrides: {}, statuses: {} };
  return res.json();
}

// Persists a partial patch (merged server-side) and returns the merged state.
export async function saveSprintState(patch: Partial<SprintState>): Promise<void> {
  await fetch("/api/sprint", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}
