import type { MetadataRoute } from "next";
import { COLLECTIONS, FILMS } from "@/lib/catalogue";
import { LOCALES } from "@/lib/geo";

// Every film is listed for every locale, whatever its territory rights: the
// page exists everywhere, only its availability block differs.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const paths = ["", ...FILMS.map((f) => `/films/${f.slug}`), ...COLLECTIONS.map((c) => `/collections/${c.slug}`)];
  return paths.map((path) => ({
    url: `${base}/en${path}`,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`])) },
  }));
}
