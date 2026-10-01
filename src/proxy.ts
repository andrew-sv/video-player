import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE, isLocale, pickLocale, resolveCountry } from "@/lib/geo";

// Edge step from the design: resolve locale (URL) and territory (geo header),
// then rewrite to an internal path that includes the country. That makes the
// country part of the page cache key, so pages stay ISR-cacheable per territory
// instead of becoming per-request dynamic.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, first, ...rest] = pathname.split("/");

  if (!first || !isLocale(first)) {
    const locale = pickLocale(request.headers.get("accept-language"));
    const target = new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url);
    return NextResponse.redirect(target);
  }

  const country = resolveCountry({
    geoHeader: request.headers.get("x-vercel-ip-country"),
    cookie: request.cookies.get(COUNTRY_COOKIE)?.value,
  });
  const internal = new URL(`/${first}/${country}/${rest.join("/")}${search}`, request.url);
  const response = NextResponse.rewrite(internal);
  response.headers.set("x-territory", country);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
