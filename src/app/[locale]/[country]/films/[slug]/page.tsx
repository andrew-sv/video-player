import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FilmCard } from "@/components/catalogue/FilmCard";
import { FilmActions } from "@/components/film/FilmActions";
import { StillsGallery } from "@/components/film/StillsGallery";
import { TrailerFacade } from "@/components/film/TrailerFacade";
import { FILMS, getFilmBySlug, summarize } from "@/lib/catalogue";
import { COUNTRIES, type Country, type Locale } from "@/lib/geo";
import { STILL_COUNT, still } from "@/lib/images";
import { formatDate, getDictionary, href, languageName } from "@/lib/i18n";
import { availability, similarAvailable } from "@/lib/rights";
import { alternates, jsonLdScript, movieJsonLd } from "@/lib/seo";
import { STREAMS } from "@/lib/streams";

// ISR per (locale, country, film). Rights changes would trigger an on-demand
// revalidation for the affected film; hourly regeneration is the safety net.
export const revalidate = 3600;

export function generateStaticParams() {
  return FILMS.map((film) => ({ slug: film.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[country]/films/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const film = getFilmBySlug(slug);
  if (!film) return {};
  const title = `${film.title} (${film.year}), directed by ${film.directors.join(", ")}`;
  return {
    title,
    description: film.synopsis.slice(0, 155),
    alternates: alternates(locale as Locale, `/films/${film.slug}`),
    openGraph: {
      type: "video.movie",
      title,
      description: film.logline,
      images: [{ url: still(film, 0, 1200), width: 1200, height: 675 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function FilmPage({ params }: PageProps<"/[locale]/[country]/films/[slug]">) {
  const { locale: l, country: c, slug } = await params;
  const locale = l as Locale;
  const country = c as Country;
  const film = getFilmBySlug(slug);
  if (!film) notFound();

  const t = getDictionary(locale);
  const avail = availability(film, country);
  const stream = STREAMS[film.stream];
  const stills = Array.from({ length: STILL_COUNT }, (_, i) => i);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(movieJsonLd(film, `/${locale}/films/${film.slug}`)) }}
      />

      <header className="relative isolate">
        <div className="relative aspect-[16/9] max-h-[78vh] w-full overflow-hidden sm:aspect-[21/9]">
          <Image
            src={still(film, 0, 1920)}
            alt={`Still from ${film.title}`}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
        </div>
        <div className="relative mx-auto -mt-28 max-w-[1440px] px-4 sm:-mt-40 sm:px-8">
          <h1 className="font-display text-5xl leading-none sm:text-7xl">{film.title}</h1>
          {film.originalTitle !== film.title && (
            <p lang={film.originalLanguage} className="mt-2 font-display text-2xl italic text-paper/70">
              {film.originalTitle}
            </p>
          )}
          <p className="mt-4 text-sm uppercase tracking-wider text-paper/80">
            {film.directors.join(", ")} · {film.countries.join(", ")} · {film.year} · {film.runtimeMin} {t.minutes}
            {" · "}
            {film.genres.join(", ")}
          </p>
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-[1440px] gap-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <AvailabilityBlock locale={locale} country={country} availability={avail} />
          <div className="mt-6">
            <FilmActions film={summarize(film)} locale={locale} playable={avail.status === "available"} />
          </div>
          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-paper/90">{film.synopsis}</p>

          <dl className="mt-10 grid max-w-2xl grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            <dt className="text-muted">{t.director}</dt>
            <dd>{film.directors.join(", ")}</dd>
            <dt className="text-muted">{t.cast}</dt>
            <dd>
              <ul>
                {film.cast.map((member) => (
                  <li key={member.name}>
                    {member.name} <span className="text-muted">— {member.role}</span>
                  </li>
                ))}
              </ul>
            </dd>
            <dt className="text-muted">{t.audio}</dt>
            <dd>{stream.audio.map((code) => languageName(locale, code)).join(", ")}</dd>
            <dt className="text-muted">{t.subtitles}</dt>
            <dd>{stream.subtitles.map((code) => languageName(locale, code)).join(", ")}</dd>
          </dl>
        </div>

        <aside className="flex flex-col gap-4">
          <h2 className="font-display text-2xl">{t.trailer}</h2>
          <TrailerFacade src={film.trailerUrl} poster={still(film, 1, 1280)} label={t.trailer} />
        </aside>
      </div>

      <section className="mx-auto mt-16 max-w-[1440px] px-4 sm:px-8" aria-labelledby="stills">
        <h2 id="stills" className="mb-5 font-display text-2xl">{t.stills}</h2>
        <StillsGallery
          title={film.title}
          stills={stills.map((i) => still(film, i, 640))}
          large={stills.map((i) => still(film, i, 1920))}
        />
      </section>

      {avail.status === "unavailable" && (
        <section className="mx-auto mt-16 max-w-[1440px] px-4 sm:px-8">
          <h2 className="font-display text-2xl">{t.notAvailableHint}</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similarAvailable(film, country).map((other) => (
              <li key={other.id}>
                <FilmCard film={summarize(other)} href={href(locale, `/films/${other.slug}`)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function AvailabilityBlock({
  locale,
  country,
  availability: avail,
}: {
  locale: Locale;
  country: Country;
  availability: ReturnType<typeof availability>;
}) {
  const t = getDictionary(locale);
  const where = COUNTRIES[country];
  const text =
    avail.status === "available"
      ? `${t.availableUntil} ${formatDate(locale, new Date(avail.until))}`
      : avail.status === "coming"
        ? `${t.comingOn} ${formatDate(locale, new Date(avail.from))}`
        : t.notAvailable;
  const tone =
    avail.status === "available" ? (avail.leavingSoon ? "text-accent" : "text-emerald-400") : "text-muted";
  return (
    <p className={`text-sm font-medium ${tone}`}>
      {text} <span className="text-muted">· {where}</span>
    </p>
  );
}
