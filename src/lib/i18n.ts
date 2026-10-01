import type { Locale } from "./geo";

const en = {
  nowShowing: "Now showing",
  library: "Library",
  watchlist: "Watchlist",
  searchPlaceholder: "Search films, directors, actors",
  filmOfTheDay: "Film of the day",
  continueWatching: "Continue watching",
  play: "Play",
  resume: "Resume",
  addToWatchlist: "Watchlist",
  inWatchlist: "In watchlist",
  trailer: "Trailer",
  stills: "Stills",
  cast: "Cast",
  director: "Director",
  availableUntil: "Available until",
  comingOn: "Coming",
  notAvailable: "Not available in your country",
  notAvailableHint: "Licensing differs by country. Here are similar films you can watch.",
  audio: "Audio",
  subtitles: "Subtitles",
  minutes: "min",
  results: "results",
  noResults: "No films match your search.",
  allGenres: "All genres",
  availableNow: "Available now",
  includeComingSoon: "Include coming soon",
  emptyWatchlist: "Your watchlist is empty. Add films from any film page.",
  country: "Country",
  language: "Language",
  more: "More",
};

const fr: typeof en = {
  nowShowing: "À l'affiche",
  library: "Catalogue",
  watchlist: "Ma liste",
  searchPlaceholder: "Rechercher films, réalisateurs, acteurs",
  filmOfTheDay: "Le film du jour",
  continueWatching: "Reprendre",
  play: "Regarder",
  resume: "Reprendre",
  addToWatchlist: "Ma liste",
  inWatchlist: "Dans ma liste",
  trailer: "Bande-annonce",
  stills: "Photos",
  cast: "Distribution",
  director: "Réalisation",
  availableUntil: "Disponible jusqu'au",
  comingOn: "Disponible le",
  notAvailable: "Non disponible dans votre pays",
  notAvailableHint: "Les droits varient selon les pays. Voici des films similaires disponibles.",
  audio: "Audio",
  subtitles: "Sous-titres",
  minutes: "min",
  results: "résultats",
  noResults: "Aucun film ne correspond à votre recherche.",
  allGenres: "Tous les genres",
  availableNow: "Disponible",
  includeComingSoon: "Inclure les prochaines sorties",
  emptyWatchlist: "Votre liste est vide. Ajoutez des films depuis leur page.",
  country: "Pays",
  language: "Langue",
  more: "Plus",
};

export type Dictionary = typeof en;
const dictionaries: Record<Locale, Dictionary> = { en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function href(locale: Locale, path = ""): string {
  return `/${locale}${path}`;
}

export function formatDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(date);
}

export function languageName(locale: Locale, code: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}
