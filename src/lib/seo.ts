import type { Metadata } from "next";
import type { Film } from "./catalogue";
import { LOCALES, type Locale } from "./geo";
import { still } from "./images";

export function alternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])),
      "x-default": `/en${path}`,
    },
  };
}

/** schema.org Movie + trailer VideoObject. Identical in every territory. */
export function movieJsonLd(film: Film, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: film.title,
    alternateName: film.originalTitle,
    url,
    image: [0, 1, 2].map((i) => still(film, i, 1600)),
    description: film.synopsis,
    dateCreated: String(film.year),
    duration: `PT${film.runtimeMin}M`,
    genre: film.genres,
    inLanguage: film.originalLanguage,
    countryOfOrigin: film.countries.map((name) => ({ "@type": "Country", name })),
    director: film.directors.map((name) => ({ "@type": "Person", name })),
    actor: film.cast.map((c) => ({ "@type": "Person", name: c.name })),
    trailer: {
      "@type": "VideoObject",
      name: `${film.title} — trailer`,
      description: film.logline,
      thumbnailUrl: still(film, 0, 1280),
      contentUrl: film.trailerUrl,
      uploadDate: `${film.year}-01-01`,
    },
  };
}

/** Serialise for a <script> tag without letting data close the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
