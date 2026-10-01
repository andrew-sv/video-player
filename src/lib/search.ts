// Mock search service. Territory is a filter applied server-side, so results
// never include films the user can't see in their country.

import { FILMS, summarize, type FilmSummary } from "./catalogue";
import type { Country } from "./geo";
import { availability, type Availability } from "./rights";

export interface SearchParams {
  q?: string;
  genre?: string;
  decade?: string;
  includeComing?: boolean;
}

export interface SearchHit extends FilmSummary {
  availability: Availability;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function searchFilms(country: Country, params: SearchParams): SearchHit[] {
  const terms = normalize(params.q ?? "").split(/\s+/).filter(Boolean);
  const decade = params.decade ? Number(params.decade) : null;

  return FILMS.flatMap((film) => {
    const avail = availability(film, country);
    if (avail.status === "unavailable") return [];
    if (avail.status === "coming" && !params.includeComing) return [];
    if (params.genre && !film.genres.includes(params.genre)) return [];
    if (decade && Math.floor(film.year / 10) * 10 !== decade) return [];

    let score = 1;
    if (terms.length) {
      const fields = [
        [film.title, 5],
        [film.originalTitle, 4],
        [film.directors.join(" "), 3],
        [film.cast.map((c) => c.name).join(" "), 2],
        [`${film.genres.join(" ")} ${film.countries.join(" ")}`, 1],
        [film.logline, 1],
      ] as const;
      score = 0;
      for (const term of terms) {
        const matched = fields.filter(([text]) => normalize(text).includes(term));
        if (!matched.length) return [];
        score += Math.max(...matched.map(([, weight]) => weight));
      }
    }
    return [{ hit: { ...summarize(film), availability: avail }, score }];
  })
    .sort((a, b) => b.score - a.score || b.hit.year - a.hit.year)
    .map(({ hit }) => hit);
}

export const DECADES = [...new Set(FILMS.map((f) => Math.floor(f.year / 10) * 10))].sort();
