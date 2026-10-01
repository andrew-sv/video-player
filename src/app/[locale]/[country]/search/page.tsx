import type { Metadata } from "next";
import { SearchClient } from "@/components/catalogue/SearchClient";
import { GENRES } from "@/lib/catalogue";
import type { Country, Locale } from "@/lib/geo";
import { getDictionary } from "@/lib/i18n";
import { DECADES, searchFilms } from "@/lib/search";

type Props = PageProps<"/[locale]/[country]/search">;

// Free-text result pages are thin, duplicate content: keep them out of the index.
// (A genre landing page would be its own static, indexable route.)
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `“${q}”` : "Library", robots: { index: !q, follow: true } };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale: l, country } = await params;
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const initial = { q: first(sp.q), genre: first(sp.genre), decade: first(sp.decade), coming: first(sp.coming) === "1" };
  const locale = l as Locale;

  // First page of results is server-rendered; the client takes over from there.
  const hits = searchFilms(country as Country, {
    q: initial.q,
    genre: initial.genre || undefined,
    decade: initial.decade || undefined,
    includeComing: initial.coming,
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-14 sm:px-8">
      <h1 className="font-display text-6xl">{getDictionary(locale).library}</h1>
      <SearchClient locale={locale} initial={initial} initialHits={hits} genres={GENRES} decades={DECADES} />
    </div>
  );
}
