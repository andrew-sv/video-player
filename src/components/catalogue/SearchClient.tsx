"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/geo";
import { getDictionary, href } from "@/lib/i18n";
import type { SearchHit } from "@/lib/search";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { FilmCard } from "./FilmCard";

interface Filters {
  q: string;
  genre: string;
  decade: string;
  coming: boolean;
}

function toQueryString(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.genre) sp.set("genre", f.genre);
  if (f.decade) sp.set("decade", f.decade);
  if (f.coming) sp.set("coming", "1");
  return sp.toString();
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function SearchClient({
  locale,
  initial,
  initialHits,
  genres,
  decades,
}: {
  locale: Locale;
  initial: Filters;
  initialHits: SearchHit[];
  genres: string[];
  decades: number[];
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(initial);
  const debounced = useDebounced(filters, 200);
  const qs = toQueryString(debounced);

  // URL is the source of truth for shareable state; replace avoids history spam.
  useEffect(() => {
    const target = qs ? `${pathname}?${qs}` : pathname;
    if (target !== `${location.pathname}${location.search}`) router.replace(target, { scroll: false });
  }, [qs, pathname, router]);

  const { data: hits = initialHits, isFetching } = useQuery({
    queryKey: ["search", qs],
    // React Query passes an AbortSignal: stale in-flight requests are cancelled.
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/search?${qs}`, { signal });
      if (!res.ok) throw new Error(`search: ${res.status}`);
      return ((await res.json()) as { hits: SearchHit[] }).hits;
    },
    initialData: qs === toQueryString(initial) ? initialHits : undefined,
    placeholderData: keepPreviousData,
  });

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const control = "h-10 rounded-md border border-line bg-panel px-3 text-sm";

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="library-q">{t.searchPlaceholder}</label>
        <input
          id="library-q"
          type="search"
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder={t.searchPlaceholder}
          className={`${control} w-full max-w-md`}
          autoFocus={!!initial.q}
        />
        <select aria-label="Genre" className={control} value={filters.genre} onChange={(e) => set({ genre: e.target.value })}>
          <option value="">{t.allGenres}</option>
          {genres.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select aria-label="Decade" className={control} value={filters.decade} onChange={(e) => set({ decade: e.target.value })}>
          <option value="">All decades</option>
          {decades.map((d) => <option key={d} value={d}>{d}s</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={filters.coming} onChange={(e) => set({ coming: e.target.checked })} />
          {t.includeComingSoon}
        </label>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {hits.length} {t.results}
        {isFetching && " …"}
      </p>

      {hits.length === 0 ? (
        <p className="mt-10 text-lg text-muted">{t.noResults}</p>
      ) : (
        <ul className={`mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? "opacity-70" : ""}`}>
          {hits.map((hit) => (
            <li key={hit.id}>
              <FilmCard
                film={hit}
                href={href(locale, `/films/${hit.slug}`)}
                badge={<AvailabilityBadge locale={locale} availability={hit.availability} />}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
