import { getFilmById } from "@/lib/catalogue";
import { verifyToken } from "@/lib/playback-token";
import { isPlayable } from "@/lib/rights";
import { STREAMS } from "@/lib/streams";

// Licence proxy. Same shape as the Widevine/PlayReady/FairPlay proxies in
// production: verify the playback token, re-check rights, then release keys.
// Clear Key is the W3C test key system; its request/response bodies are JSON.
const hexToB64url = (hex: string) => Buffer.from(hex, "hex").toString("base64url");
const b64urlToHex = (b64: string) => Buffer.from(b64, "base64url").toString("hex");

export async function POST(request: Request) {
  const claims = verifyToken(request.headers.get("x-playback-token"));
  if (!claims) return new Response("Invalid or expired playback token", { status: 401 });

  const film = getFilmById(claims.filmId);
  if (!film || !isPlayable(film, claims.country)) {
    return new Response("Not licensed", { status: 403 });
  }
  const drm = STREAMS[film.stream].drm;
  if (!drm) return new Response("Film is not encrypted", { status: 400 });

  const { kids } = (await request.json()) as { kids: string[] };
  const keys = kids.flatMap((kid) => {
    const key = drm.keys[b64urlToHex(kid)];
    return key ? [{ kty: "oct", kid, k: hexToB64url(key) }] : [];
  });
  if (!keys.length) return new Response("Unknown key id", { status: 404 });

  return Response.json({ keys, type: "temporary" }, { headers: { "Cache-Control": "no-store" } });
}
