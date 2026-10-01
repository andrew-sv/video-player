"use client";

import Link from "next/link";
import type { FilmSummary } from "@/lib/catalogue";
import type { Locale } from "@/lib/geo";
import { getDictionary, href } from "@/lib/i18n";
import { formatClock, useMe, useWatchlistToggle } from "@/components/user/hooks";

/**
 * The per-user part of the otherwise cached film page. Buttons render
 * immediately with neutral labels and fixed sizes, then fill in user state.
 */
export function FilmActions({ film, locale, playable }: { film: FilmSummary; locale: Locale; playable: boolean }) {
  const t = getDictionary(locale);
  const { data: me, isPending } = useMe();
  const toggle = useWatchlistToggle(film);
  const inWatchlist = me?.watchlist.some((f) => f.id === film.id) ?? false;
  const resumeAt = me?.progress[film.id]?.positionSec;

  return (
    <div className="flex flex-wrap gap-3">
      {playable && (
        <Link
          href={href(locale, `/watch/${film.slug}`)}
          className="min-w-44 rounded-sm bg-paper px-6 py-3 text-center text-sm font-semibold text-ink hover:bg-white"
        >
          ▶ {resumeAt ? `${t.resume} ${formatClock(resumeAt)}` : t.play}
        </Link>
      )}
      <button
        type="button"
        disabled={isPending}
        aria-pressed={inWatchlist}
        onClick={() => toggle.mutate(!inWatchlist)}
        className="min-w-40 rounded-sm border border-paper/40 px-6 py-3 text-sm font-semibold hover:border-paper disabled:opacity-60"
      >
        {inWatchlist ? `✓ ${t.inWatchlist}` : `+ ${t.addToWatchlist}`}
      </button>
    </div>
  );
}
