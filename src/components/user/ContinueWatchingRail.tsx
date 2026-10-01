"use client";

import { FilmCard } from "@/components/catalogue/FilmCard";
import { Rail, RailItem } from "@/components/catalogue/Rail";
import type { Locale } from "@/lib/geo";
import { getDictionary, href } from "@/lib/i18n";
import { useMe } from "./hooks";

/**
 * Personalised, so it is rendered on the client and never part of the cached
 * page. It sits below the hero, so it never shifts the LCP element.
 */
export function ContinueWatchingRail({ locale }: { locale: Locale }) {
  const { data, isPending } = useMe();
  const t = getDictionary(locale);
  // Reserve the rail's height while loading; most returning viewers have one.
  if (isPending) return <div aria-hidden className="mx-auto h-[min(26vw,320px)] w-full max-w-[1440px]" />;
  const items = data?.continueWatching ?? [];
  if (!items.length) return null;
  return (
    <Rail title={t.continueWatching}>
      {items.map((film) => (
        <RailItem key={film.id}>
          <FilmCard
            film={film}
            href={href(locale, `/watch/${film.slug}`)}
            progress={film.durationSec ? film.positionSec / film.durationSec : 0}
          />
        </RailItem>
      ))}
    </Rail>
  );
}
