import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Player } from "@/components/player/Player";
import { getFilmBySlug } from "@/lib/catalogue";
import type { Locale } from "@/lib/geo";
import { href } from "@/lib/i18n";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Thin shell: entitlement, rights and stream URLs are resolved client-side by
// the authorize call, so this page itself carries nothing per-user or secret.
export default async function WatchPage({ params }: PageProps<"/[locale]/[country]/watch/[slug]">) {
  const { locale, slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) notFound();
  return (
    <>
      <title>{`Watching ${film.title}`}</title>
      <Player
        filmId={film.id}
        title={film.title}
        locale={locale as Locale}
        backHref={href(locale as Locale, `/films/${film.slug}`)}
      />
    </>
  );
}
