"use client";

import { usePathname, useRouter } from "next/navigation";
import { COUNTRIES, COUNTRY_COOKIE, LOCALES, type Country, type Locale } from "@/lib/geo";
import { getDictionary } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Demo control. In production the territory comes only from the CDN geo
 * header; this cookie stands in for "travelling to another country".
 */
export function TerritorySwitcher({ locale, country }: { locale: Locale; country: Country }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const t = getDictionary(locale);

  function changeCountry(next: string) {
    document.cookie = `${COUNTRY_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    queryClient.invalidateQueries();
    router.refresh();
  }

  function changeLocale(next: string) {
    router.push(pathname.replace(/^\/[a-z]{2}(?=\/|$)/, `/${next}`));
  }

  const select = "h-9 rounded-md border border-line bg-panel px-2 text-paper";
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2">
        {t.country}
        <select className={select} value={country} onChange={(e) => changeCountry(e.target.value)}>
          {Object.entries(COUNTRIES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        {t.language}
        <select className={select} value={locale} onChange={(e) => changeLocale(e.target.value)}>
          {LOCALES.map((l) => (
            <option key={l} value={l}>{l === "en" ? "English" : "Français"}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
