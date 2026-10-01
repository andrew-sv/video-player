import type { Metadata } from "next";
import { WatchlistGrid } from "@/components/user/WatchlistGrid";
import type { Locale } from "@/lib/geo";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = { title: "Watchlist", robots: { index: false } };

export default async function WatchlistPage({ params }: PageProps<"/[locale]/[country]/watchlist">) {
  const locale = (await params).locale as Locale;
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-14 sm:px-8">
      <h1 className="font-display text-6xl">{getDictionary(locale).watchlist}</h1>
      <WatchlistGrid locale={locale} />
    </div>
  );
}
