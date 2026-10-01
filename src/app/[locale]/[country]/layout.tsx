import { notFound } from "next/navigation";
import { COUNTRIES, isCountry, isLocale } from "@/lib/geo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

// Pages are prerendered for every (locale, territory) pair: the same
// "pre-render everything before a big drop" step from the design.
export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((country) => ({ country }));
}

export default async function TerritoryLayout({ children, params }: LayoutProps<"/[locale]/[country]">) {
  const { locale, country } = await params;
  if (!isLocale(locale) || !isCountry(country)) notFound();
  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} country={country} />
    </>
  );
}
