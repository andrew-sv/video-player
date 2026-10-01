// Locale (UI language, from the URL) and country (rights territory, from the
// edge) are deliberately independent. Pure module: safe to import from proxy.

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

// Territories we model explicitly; everything else falls into "rest of world".
export const COUNTRIES = {
  GB: "United Kingdom",
  US: "United States",
  FR: "France",
  DE: "Germany",
  TR: "Türkiye",
  JP: "Japan",
  BR: "Brazil",
  IN: "India",
  ZZ: "Rest of world",
} as const;
export type Country = keyof typeof COUNTRIES;
export const DEFAULT_COUNTRY: Country = "GB";

export function isCountry(value: string): value is Country {
  return value in COUNTRIES;
}

/** Normalises a raw ISO code from a geo header into a rights territory. */
export function toTerritory(raw: string | null | undefined): Country {
  const code = raw?.toUpperCase();
  if (!code) return DEFAULT_COUNTRY;
  return isCountry(code) ? code : "ZZ";
}

/** Demo override cookie; in production only the CDN geo header is trusted. */
export const COUNTRY_COOKIE = "country";

export function resolveCountry(input: {
  geoHeader?: string | null;
  cookie?: string | null;
}): Country {
  if (input.cookie && isCountry(input.cookie)) return input.cookie;
  return toTerritory(input.geoHeader);
}

export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}
