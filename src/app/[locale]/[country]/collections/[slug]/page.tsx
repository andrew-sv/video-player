import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AvailabilityBadge } from "@/components/catalogue/AvailabilityBadge";
import { FilmCard } from "@/components/catalogue/FilmCard";
import { COLLECTIONS, getCollection, getFilmById, summarize } from "@/lib/catalogue";
import type { Country, Locale } from "@/lib/geo";
import { href } from "@/lib/i18n";
import { availability } from "@/lib/rights";
import { alternates } from "@/lib/seo";

export const revalidate = 3600;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[country]/collections/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.description,
    alternates: alternates(locale as Locale, `/collections/${slug}`),
  };
}

export default async function CollectionPage({ params }: PageProps<"/[locale]/[country]/collections/[slug]">) {
  const { locale: l, country: c, slug } = await params;
  const locale = l as Locale;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const films = collection.filmIds.flatMap((id) => {
    const film = getFilmById(id);
    if (!film) return [];
    const avail = availability(film, c as Country);
    return avail.status === "unavailable" ? [] : [{ film, avail }];
  });

  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-14 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">Collection</p>
      <h1 className="mt-3 font-display text-6xl">{collection.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-paper/80">{collection.description}</p>
      <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {films.map(({ film, avail }) => (
          <li key={film.id}>
            <FilmCard
              film={summarize(film)}
              href={href(locale, `/films/${film.slug}`)}
              badge={<AvailabilityBadge locale={locale} availability={avail} />}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
