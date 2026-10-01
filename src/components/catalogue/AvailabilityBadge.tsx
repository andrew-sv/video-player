import type { Locale } from "@/lib/geo";
import { formatDate, getDictionary } from "@/lib/i18n";
import type { Availability } from "@/lib/rights";
import { Badge } from "./FilmCard";

export function AvailabilityBadge({ locale, availability }: { locale: Locale; availability: Availability }) {
  const t = getDictionary(locale);
  if (availability.status === "coming") {
    return <Badge>{t.comingOn} {formatDate(locale, new Date(availability.from))}</Badge>;
  }
  if (availability.status === "available" && availability.leavingSoon) {
    return <Badge tone="accent">{t.availableUntil} {formatDate(locale, new Date(availability.until))}</Badge>;
  }
  return null;
}
