import "server-only";
import { cookies, headers } from "next/headers";
import { COUNTRY_COOKIE, resolveCountry, type Country } from "./geo";

/** Country for API routes (pages get it from the URL segment the proxy adds). */
export async function requestCountry(): Promise<Country> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return resolveCountry({
    geoHeader: h.get("x-vercel-ip-country"),
    cookie: c.get(COUNTRY_COOKIE)?.value,
  });
}
