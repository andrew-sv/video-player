import Link from "next/link";
import type { Locale } from "@/lib/geo";
import { getDictionary, href } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/85 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 sm:px-8">
        <Link href={href(locale)} className="font-display text-2xl tracking-tight">
          Cinémathèque
        </Link>
        <nav aria-label="Primary" className="hidden gap-5 text-sm text-muted md:flex">
          <Link href={href(locale)} className="hover:text-paper">{t.nowShowing}</Link>
          <Link href={href(locale, "/search")} className="hover:text-paper">{t.library}</Link>
          <Link href={href(locale, "/watchlist")} className="hover:text-paper">{t.watchlist}</Link>
        </nav>
        {/* Plain GET form: works before hydration, enhanced on the search page. */}
        <form action={href(locale, "/search")} role="search" className="ml-auto w-full max-w-xs">
          <label htmlFor="site-search" className="sr-only">{t.searchPlaceholder}</label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder={t.searchPlaceholder}
            className="h-9 w-full rounded-full border border-line bg-panel px-4 text-sm placeholder:text-muted focus:border-paper/50 focus:outline-none"
          />
        </form>
      </div>
    </header>
  );
}
