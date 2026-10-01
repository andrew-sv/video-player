import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Country } from "./geo";

// Short-lived token minted by /api/playback/authorize and checked by the
// licence proxy. Production would use a KMS-managed key.
const SECRET = process.env.PLAYBACK_TOKEN_SECRET ?? "dev-only-playback-secret";

export interface PlaybackClaims {
  uid: string;
  filmId: string;
  country: Country;
  exp: number; // epoch seconds
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function mintToken(claims: Omit<PlaybackClaims, "exp">, ttlSeconds = 15 * 60): string {
  const body: PlaybackClaims = { ...claims, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | null): PlaybackClaims | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as PlaybackClaims;
  return claims.exp > Date.now() / 1000 ? claims : null;
}
