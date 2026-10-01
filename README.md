# Cinémathèque: curated film streaming prototype

A working prototype of the web experience described in [`docs/DESIGN.md`](docs/DESIGN.md):
a browsable catalogue with a daily pick and editorial collections, SEO-ready film pages,
and a DRM-capable player with adaptive streaming, subtitles, multiple audio tracks and
licensing per country.

```bash
pnpm install
pnpm dev                # http://localhost:3000
# or a production build (ISR behaves for real only here):
pnpm build && pnpm start
```

## What to try

| Feature | Where |
| --- | --- |
| Film of the day, collections, hover previews | `/en`. Hover a card for ~300 ms |
| Country-specific catalogue | Footer → **Country**. Try *Kiln* in the US (unavailable), *Hours of the Tide* in France (coming soon) |
| Film page with JSON-LD, hreflang, availability | `/en/films/the-salt-orchard` |
| Search with URL state | `/en/search?q=drama` |
| **DRM playback** (Clear Key) | *Night Ferry to Bari*, *The Salt Orchard*, *Monsoon Ledger*: 5 audio languages, 4 subtitle languages |
| Long clear stream with 10 subtitle languages and a 1636p ladder | *Sintel*, and the fictional titles that reuse it |
| Subtitle language + style synced to the account | Player → **CC** / **Aa**; open another film (or another browser) |
| Continue watching | Play anything, leave, and come back to `/en` |

Player shortcuts: `space`/`k` play, `←`/`→` ±10 s, `↑`/`↓` volume, `m` mute, `f` full screen, `c` subtitles.

## How it maps to the design

- **Edge step**: `src/proxy.ts` resolves locale (URL) and territory (`x-vercel-ip-country`,
  or the demo `country` cookie) and rewrites to `/[locale]/[country]/…`. The country is part
  of the route, so every page is statically prerendered and ISR-cached **per territory**
  instead of being rendered per request. The build prerenders 2 locales × 9 territories.
- **Cached vs. personal**: pages contain no user data. Watchlist, resume point and
  Continue Watching load on the client from `/api/me` (TanStack Query; refetch on window
  focus is the cross-device sync strategy).
- **Rights**: `src/lib/rights.ts` is the single source of truth, used by pages, search,
  `/api/playback/authorize` and the licence proxy. Pages only *display* availability.
  Authorize and the licence proxy *enforce* it.
- **Playback**: `src/components/player/Player.tsx` loads Shaka Player only on the watch route.
  Authorize returns the manifest, a short-lived signed token (`src/lib/playback-token.ts`) and
  the licence URL. `/api/license/clearkey` checks the token and rights again before releasing
  keys. If the browser lacks Clear Key (Safari), the player falls back to an unprotected
  HLS copy. Production would use FairPlay there, and Widevine/PlayReady elsewhere,
  behind the same proxy.
- **Subtitles**: Shaka's DOM text displayer and CSS variables drive size, font, colour,
  background and edge (`globals.css`, `subtitleStyle.ts`). Only the selected track is downloaded.
- **Progress**: heartbeat every 30 s and on pause/seek, plus `sendBeacon` on page hide
  (`useProgressReporter.ts`). The server applies last-write-wins and drops finished films.

## Prototype shortcuts

- The catalogue, rights, users and search are in-memory mocks in `src/lib`. The user store
  resets when the server restarts. Everyone is the same subscriber (`demo`) unless a `uid`
  cookie is set, which makes the cross-device sync easy to demonstrate.
- The footer country switcher stands in for travelling. Only the geo header would be
  trusted in production.
- Media: Sintel and Tears of Steel are Blender Foundation open movies. The other titles are
  fictional and play the Shaka demo streams (the DRM title uses Shaka's public Clear Key asset).
  Artwork comes from picsum.photos and preview clips from test-videos.co.uk / MDN.
- Not built: authentication and payments, concurrent-stream limits, trick-play thumbnails,
  offline mutation queue, and on-demand revalidation webhooks (pages use hourly ISR).
