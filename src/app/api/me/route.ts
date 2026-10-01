import { getFilmById, summarize } from "@/lib/catalogue";
import { requestCountry } from "@/lib/request-country";
import { isPlayable } from "@/lib/rights";
import { currentUserId, userStore } from "@/lib/user-store";
import type { MeResponse } from "@/lib/user-types";

export async function GET() {
  const [uid, country] = await Promise.all([currentUserId(), requestCountry()]);

  const watchlist = userStore
    .watchlist(uid)
    .flatMap((id) => {
      const film = getFilmById(id);
      return film ? [summarize(film)] : [];
    });

  const progressEntries = userStore.progress(uid);
  const continueWatching = progressEntries.flatMap((p) => {
    const film = getFilmById(p.filmId);
    if (!film || !isPlayable(film, country)) return [];
    return [{ ...summarize(film), positionSec: p.positionSec, durationSec: p.durationSec }];
  });

  const body: MeResponse = {
    watchlist,
    continueWatching,
    progress: Object.fromEntries(progressEntries.map((p) => [p.filmId, p])),
    prefs: userStore.prefs(uid),
  };
  return Response.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
