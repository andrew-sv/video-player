import { getFilmById } from "@/lib/catalogue";
import { currentUserId, userStore } from "@/lib/user-store";
import type { ProgressReport } from "@/lib/user-types";

// Heartbeats from the player. Also receives navigator.sendBeacon payloads,
// which arrive as text/plain, so the body is parsed manually.
export async function POST(request: Request) {
  let report: ProgressReport;
  try {
    report = JSON.parse(await request.text());
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!getFilmById(report.filmId) || !Number.isFinite(report.positionSec)) {
    return new Response("Invalid report", { status: 400 });
  }
  userStore.reportProgress(await currentUserId(), report);
  return new Response(null, { status: 204 });
}
