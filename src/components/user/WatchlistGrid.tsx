"use client";

import { FilmCard } from "@/components/catalogue/FilmCard";
import type { Locale } from "@/lib/geo";
import { getDictionary, href } from "@/lib/i18n";
import { useMe } from "./hooks";

export function WatchlistGrid({ locale }: { locale: Locale }) {
  const { data, isPending } = useMe();
  const t = getDictionary(locale);
  if (isPending) return <div className="mt-12 h-64 animate-pulse rounded-sm bg-panel" />;
  if (!data?.watchlist.length) return <p className="mt-8 text-muted">{t.emptyWatchlist}</p>;
  return (
    <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.watchlist.map((film) => (
        <li key={film.id}>
          <FilmCard film={film} href={href(locale, `/films/${film.slug}`)} />
        </li>
      ))}
    </ul>
  );
}
