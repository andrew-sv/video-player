import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_PREFS, type ProgressEntry, type ProgressReport, type UserPrefs } from "./user-types";

// Mock user service. Production: a KV / wide-column store behind an API shared
// by web, mobile and TV. Kept on globalThis so it survives dev hot reloads.
interface UserRecord {
  watchlist: Map<string, number>; // filmId → addedAt
  progress: Map<string, ProgressEntry>;
  prefs: UserPrefs;
}

const store: Map<string, UserRecord> = ((globalThis as { __userStore?: Map<string, UserRecord> }).__userStore ??=
  new Map());

function record(uid: string): UserRecord {
  let r = store.get(uid);
  if (!r) {
    r = { watchlist: new Map(), progress: new Map(), prefs: structuredClone(DEFAULT_PREFS) };
    store.set(uid, r);
  }
  return r;
}

/**
 * No auth in the prototype: everyone is the same demo subscriber, which also
 * makes "sync across devices" easy to see. A `uid` cookie can override it.
 */
export async function currentUserId(): Promise<string> {
  return (await cookies()).get("uid")?.value ?? "demo";
}

export const userStore = {
  watchlist(uid: string): string[] {
    return [...record(uid).watchlist.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  },
  addToWatchlist(uid: string, filmId: string) {
    const list = record(uid).watchlist;
    if (!list.has(filmId)) list.set(filmId, Date.now());
  },
  removeFromWatchlist(uid: string, filmId: string) {
    record(uid).watchlist.delete(filmId);
  },
  progress(uid: string): ProgressEntry[] {
    return [...record(uid).progress.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  },
  progressFor(uid: string, filmId: string): ProgressEntry | undefined {
    return record(uid).progress.get(filmId);
  },
  /** Last write wins, ordered by server receive time. */
  reportProgress(uid: string, report: ProgressReport) {
    const finished = report.durationSec > 0 && report.positionSec / report.durationSec > 0.95;
    if (finished) {
      record(uid).progress.delete(report.filmId);
      return;
    }
    record(uid).progress.set(report.filmId, {
      filmId: report.filmId,
      positionSec: Math.max(0, report.positionSec),
      durationSec: report.durationSec,
      updatedAt: Date.now(),
    });
  },
  prefs(uid: string): UserPrefs {
    return record(uid).prefs;
  },
  updatePrefs(uid: string, patch: Partial<UserPrefs>) {
    const r = record(uid);
    r.prefs = {
      ...r.prefs,
      ...patch,
      subtitleStyle: { ...r.prefs.subtitleStyle, ...patch.subtitleStyle },
    };
  },
};
