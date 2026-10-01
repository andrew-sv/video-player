import type { Country, Locale } from "@/lib/geo";
import { TerritorySwitcher } from "./TerritorySwitcher";

export function SiteFooter({ locale, country }: { locale: Locale; country: Country }) {
  return (
    <footer className="mt-24 border-t border-line/60">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-md">
          A prototype. Sintel and Tears of Steel are Blender open movies. Other titles are fictional
          and play public test streams.
        </p>
        <TerritorySwitcher locale={locale} country={country} />
      </div>
    </footer>
  );
}
