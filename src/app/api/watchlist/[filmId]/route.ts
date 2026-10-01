import { getFilmById } from "@/lib/catalogue";
import { currentUserId, userStore } from "@/lib/user-store";

type Context = { params: Promise<{ filmId: string }> };

// Idempotent set operations, so retries and multi-device races are harmless.
export async function PUT(_request: Request, { params }: Context) {
  const { filmId } = await params;
  if (!getFilmById(filmId)) return new Response("Unknown film", { status: 404 });
  userStore.addToWatchlist(await currentUserId(), filmId);
  return new Response(null, { status: 204 });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { filmId } = await params;
  userStore.removeFromWatchlist(await currentUserId(), filmId);
  return new Response(null, { status: 204 });
}
