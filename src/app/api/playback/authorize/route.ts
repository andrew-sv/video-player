import { getFilmById } from "@/lib/catalogue";
import { mintToken } from "@/lib/playback-token";
import { requestCountry } from "@/lib/request-country";
import { availability } from "@/lib/rights";
import { STREAMS } from "@/lib/streams";
import { currentUserId, userStore } from "@/lib/user-store";
import type { AuthorizeResponse } from "@/lib/playback-types";

// The real gate: entitlement + rights for the *current* country, checked at
// play time. A stale cached page can only ever lead to a polite refusal here.
export async function POST(request: Request) {
  const { filmId } = (await request.json()) as { filmId: string };
  const film = getFilmById(filmId);
  if (!film) return Response.json({ error: "not_found" }, { status: 404 });

  const [uid, country] = await Promise.all([currentUserId(), requestCountry()]);
  const avail = availability(film, country);
  if (avail.status !== "available") {
    return Response.json({ error: "not_available_in_country", country, availability: avail }, { status: 403 });
  }
  // Every demo user is a subscriber; a real check would read entitlements here.

  const stream = STREAMS[film.stream];
  const progress = userStore.progressFor(uid, film.id);
  const body: AuthorizeResponse = {
    filmId: film.id,
    title: film.title,
    manifestUrl: stream.dash,
    hlsFallbackUrl: stream.hlsFallback,
    drm: stream.drm && {
      keySystem: stream.drm.keySystem,
      licenseUrl: "/api/license/clearkey",
      token: mintToken({ uid, filmId: film.id, country }),
    },
    resumeAt: progress?.positionSec ?? 0,
    originalLanguage: film.originalLanguage,
    subtitleLanguage: userStore.prefs(uid).subtitleLanguage,
  };
  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
