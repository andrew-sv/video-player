import { requestCountry } from "@/lib/request-country";
import { searchFilms } from "@/lib/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = await requestCountry();
  const hits = searchFilms(country, {
    q: url.searchParams.get("q") ?? undefined,
    genre: url.searchParams.get("genre") ?? undefined,
    decade: url.searchParams.get("decade") ?? undefined,
    includeComing: url.searchParams.get("coming") === "1",
  });
  // Results depend on country, so shared caches must key on it.
  return Response.json(
    { country, hits },
    { headers: { "Cache-Control": "public, max-age=60", Vary: "x-vercel-ip-country, Cookie" } },
  );
}
