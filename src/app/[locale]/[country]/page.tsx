import Image from "next/image";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/catalogue/AvailabilityBadge";
import { FilmCard } from "@/components/catalogue/FilmCard";
import { Rail, RailItem } from "@/components/catalogue/Rail";
import { ContinueWatchingRail } from "@/components/user/ContinueWatchingRail";
import { COLLECTIONS, getFilmById, summarize } from "@/lib/catalogue";
import type { Country, Locale } from "@/lib/geo";
import { still } from "@/lib/images";
import { getDictionary, href } from "@/lib/i18n";
import { availability, filmOfTheDay } from "@/lib/rights";

// Static per (locale, country). Hourly regeneration picks up the daily film
// change; editorial edits would call revalidatePath/Tag on publish.
export const revalidate = 3600;

export default async function HomePage({ params }: PageProps<"/[locale]/[country]">) {
  const { locale: l, country: c } = await params;
  const locale = l as Locale;
  const country = c as Country;
  const t = getDictionary(locale);
  const featured = filmOfTheDay(country);

  const collections = COLLECTIONS.map((collection) => ({
    ...collection,
    films: collection.filmIds
      .flatMap((id) => {
        const film = getFilmById(id);
        return film ? [{ film, availability: availability(film, country) }] : [];
      })
      .filter((entry) => entry.availability.status !== "unavailable"),
  })).filter((collection) => collection.films.length > 0);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={still(featured, 0, 1920)}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />
        </div>
        <div className="mx-auto flex min-h-[72vh] max-w-[1440px] flex-col justify-end px-4 pb-14 pt-32 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">{t.filmOfTheDay}</p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl leading-none sm:text-7xl">{featured.title}</h1>
          {featured.originalTitle !== featured.title && (
            <p className="mt-2 font-display text-2xl italic text-paper/70">{featured.originalTitle}</p>
          )}
          <p className="mt-4 text-sm uppercase tracking-wider text-paper/80">
            {featured.directors.join(", ")} · {featured.countries.join(", ")} · {featured.year} ·{" "}
            {featured.runtimeMin} {t.minutes}
          </p>
          <p className="mt-4 max-w-xl text-lg text-paper/90">{featured.logline}</p>
          <div className="mt-8 flex gap-3">
            <Link
              href={href(locale, `/watch/${featured.slug}`)}
              className="rounded-sm bg-paper px-6 py-3 text-sm font-semibold text-ink hover:bg-white"
            >
              ▶ {t.play}
            </Link>
            <Link
              href={href(locale, `/films/${featured.slug}`)}
              className="rounded-sm border border-paper/40 px-6 py-3 text-sm font-semibold hover:border-paper"
            >
              {t.more}
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-16">
        <ContinueWatchingRail locale={locale} />
        {collections.map((collection) => (
          <Rail
            key={collection.slug}
            title={collection.title}
            description={collection.description}
            moreHref={href(locale, `/collections/${collection.slug}`)}
            moreLabel={t.more}
          >
            {collection.films.map(({ film, availability }) => (
              <RailItem key={film.id}>
                <FilmCard
                  film={summarize(film)}
                  href={href(locale, `/films/${film.slug}`)}
                  badge={<AvailabilityBadge locale={locale} availability={availability} />}
                />
              </RailItem>
            ))}
          </Rail>
        ))}
      </div>
    </>
  );
}
