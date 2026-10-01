// Mock rights/availability service: (film × territory × window).
// Every surface (pages, search, playback, licence) goes through here so the
// answer is consistent; the client never decides availability itself.

import { FILMS, type Film, type RightsWindow } from "./catalogue";
import type { Country } from "./geo";

const DAY = 24 * 60 * 60 * 1000;

function today(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function covers(window: RightsWindow, country: Country): boolean {
  if (window.except?.includes(country)) return false;
  return window.territories === "ALL" || window.territories.includes(country);
}

export type Availability =
  | { status: "available"; until: string; leavingSoon: boolean }
  | { status: "coming"; from: string }
  | { status: "unavailable" };

export function availability(film: Film, country: Country, now = new Date()): Availability {
  const base = today(now);
  const windows = film.rights
    .filter((w) => covers(w, country))
    .map((w) => ({ from: base + w.fromDay * DAY, to: base + w.toDay * DAY }));

  const current = windows.find((w) => w.from <= now.getTime() && now.getTime() < w.to);
  if (current) {
    return {
      status: "available",
      until: new Date(current.to).toISOString(),
      leavingSoon: current.to - now.getTime() < 7 * DAY,
    };
  }
  const upcoming = windows
    .filter((w) => w.from > now.getTime())
    .sort((a, b) => a.from - b.from)[0];
  if (upcoming) return { status: "coming", from: new Date(upcoming.from).toISOString() };
  return { status: "unavailable" };
}

export function isPlayable(film: Film, country: Country, now = new Date()): boolean {
  return availability(film, country, now).status === "available";
}

export function availableFilms(country: Country, now = new Date()): Film[] {
  return FILMS.filter((f) => isPlayable(f, country, now));
}

/** Films that are available now or coming soon: what browse surfaces show. */
export function visibleFilms(country: Country, now = new Date()): Film[] {
  return FILMS.filter((f) => availability(f, country, now).status !== "unavailable");
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Editorially this is a per-territory schedule; here a stable daily pick. */
export function filmOfTheDay(country: Country, now = new Date()): Film {
  const pool = availableFilms(country, now).filter((f) => f.runtimeMin > 60);
  const day = new Date(today(now)).toISOString().slice(0, 10);
  return pool[hash(`${day}:${country}`) % pool.length] ?? FILMS[0];
}

/** Films similar to `film` that are playable here, for the unavailable state. */
export function similarAvailable(film: Film, country: Country, limit = 4): Film[] {
  return availableFilms(country)
    .filter((f) => f.id !== film.id)
    .map((f) => ({ f, score: f.genres.filter((g) => film.genres.includes(g)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ f }) => f);
}
