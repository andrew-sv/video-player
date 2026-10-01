# Curated Film Streaming — Web Experience Design

## Context
We need a frontend system design for a MUBI-like service: browsing a curated catalogue, SEO-critical film detail pages, and DRM-protected full-length playback in the browser. It must also handle per-country licensing, subtitles in many languages, cross-device sync, and 15M MAU across 190+ countries with evening and release-day peaks.

---

## 1. High-level architecture

```
Browser ──► CDN / edge (geo → country, locale, cache key, auth cookie check)
              │
              ├─ HTML  ──► Web app (Next.js App Router, SSR/ISR, Node runtime)
              │                 └─► BFF / GraphQL-or-REST aggregation
              │                        ├─ Catalogue service (films, collections, people)
              │                        ├─ Rights/Availability service (film × country × window)
              │                        ├─ Search service (Typesense/Elastic, territory-filtered)
              │                        └─ User service (watchlist, progress, prefs, entitlements)
              ├─ Static assets (hashed, immutable)
              ├─ Images (image CDN: AVIF/WebP, responsive sizes)
              └─ Video (multi-CDN: CMAF segments, manifests, subtitles, preview clips)
Player ──► Playback API (authorize → signed manifest URL + DRM token)
       ──► License proxy (Widevine / PlayReady / FairPlay)
       ──► Progress API (heartbeats) · QoE beacon
```

Key principle: **public, cacheable content and per-user, dynamic data are kept apart.** HTML is cached per `(route, country, locale)`. Anything about the user (watchlist state, resume point, subscription) is loaded on the client or streamed into dynamic slots. This keeps CDN hit rates high and pages fast.

### Routes
| Route | Rendering | Cache key | Indexable |
|---|---|---|---|
| `/{locale}` Home (film of the day, collections) | ISR / PPR static shell | country + locale; revalidate at local midnight + tag purge | yes |
| `/{locale}/collections/{slug}` | ISR | country + locale | yes |
| `/{locale}/films/{slug}` Film detail | ISR + streamed dynamic slots | country + locale; tag `film:{id}` | yes |
| `/{locale}/search?q=` | SSR first page, then client | not cached for `q`; facets cached | `noindex` (browse/genre pages *are* indexable) |
| `/{locale}/watch/{id}` | Client-only player shell | no-store | `noindex` |
| `/{locale}/account/*` | Client / SSR private | no-store | no |

UI locale (from the URL) is kept separate from the **country** (from edge geo). Rights depend on country. Language depends on the user.

---

## 2. Browsing the catalogue

### Home
- **Film of the day:** chosen editorially per territory and day. The page is rendered statically per country, with revalidation at local midnight (scheduled per time zone) and an on-demand tag purge if editors change it.
- **Editorial collections:** horizontal rails. Above-the-fold rails are SSR'd and the rest are lazy-loaded with IntersectionObserver. A personalized "Continue watching" rail is a client-rendered dynamic slot with a skeleton, so it never blocks or busts the cache.
- Rails are keyboard-navigable (roving tabindex, arrow keys) with ARIA `list`/`listitem` semantics and visible focus.

### Searchable library
- A search service with an index per film. Territory availability is stored as a filterable attribute, so results are always pre-filtered by country server-side.
- Client: 200 ms debounced input, `AbortController` cancels stale requests, query/filter state lives in the URL (shareable, back button works), and results use TanStack Query with keepPreviousData.
- Facets: genre, country of origin, decade, director, language, available-now vs. coming soon. Genre and director browse pages are SSR'd and indexable. Free-text result pages are `noindex`.
- Long result lists: paginated "load more" with virtualization once more than ~200 cards are in the DOM.

### Film cards with hover trailer preview
- Previews are separate assets: 10–15 s clips, muted, ~480p, ~300–600 kbps, H.264 MP4 (no DRM, so no license round trip and they play everywhere), on the video CDN.
- **One shared, pooled `<video muted playsinline>`** moves into whichever card is active. Only one preview plays at a time.
- **Hover intent:** start loading after ~300 ms of hover/focus, cancel on leave (clear `src`, `load()` to stop the download). Show the poster until the `playing` event, then crossfade.
- Turned off for `prefers-reduced-motion`, `navigator.connection.saveData` / slow effective type, touch devices (a tap opens the detail page), and remotely through a feature flag during load spikes.
- Keyboard focus triggers the same preview. The preview is decorative (`aria-hidden`), and the card is a link to the detail page.

---

## 3. Film detail page (fast + SEO)

**Rendering:** ISR HTML per `(film, country, locale)`, served from the CDN. Updates come from tag-based purge (`film:{id}`, `film:{id}:{country}`) when catalogue or rights data changes, plus a TTL capped at the next rights-window boundary, so "available from Friday" flips on time without a manual purge.

**Static (cached) content:** title, original title, synopsis, director, cast and crew links, year, runtime, countries, languages, subtitle languages, stills, trailer facade, availability state for the country ("Available until 12 Nov", "Coming 3 Dec", "Not available in your country").

**Dynamic slots (client or streamed, skeletons that reserve space so there is no CLS):** watchlist button state, resume position ("Resume 1:12:40"), and the primary CTA, which depends on subscription status: Play / Subscribe / Rent.

**Performance budget:** LCP < 2.0 s at p75 and CLS < 0.05.
- The hero still uses the image CDN with `srcset`, AVIF/WebP, `fetchpriority="high"`, and a preload. Other stills are lazy-loaded and open in a lightbox.
- The trailer is a **facade** (poster + play button) and loads the player only on click. Trailers are non-DRM HLS played with a light hls.js chunk, not the full DRM player.
- JS stays under ~120 KB gzip for this route. The player bundle never loads here. Fonts are subset and use `font-display: swap`.

**SEO**
- `schema.org/Movie` JSON-LD (director, actor, datePublished, duration, image, aggregateRating if available) + `VideoObject` for the trailer.
- Canonical URL per locale, `hreflang` alternates across all locales + `x-default`, localized `<title>`/meta description, Open Graph/Twitter cards.
- **Every film page is indexable in every territory**, including unlicensed ones. Only the availability block differs, so content stays the same for crawlers and users (no cloaking risk; Googlebot mostly crawls from the US). An unavailable page still has value: it shows "Not available in your country" plus similar available films.
- Sitemaps are split by locale and include `lastmod`. Stable slugs, and 301s on renames.

---

## 4. Playback

### Player stack
- **Shaka Player** (one engine for DASH + HLS, EME, ABR, multi-audio, text tracks), code-split and loaded only on `/watch`. The custom UI is React controls over the Shaka API.
- **Packaging:** a single CMAF/fMP4 ladder with **CBCS** encryption, exposed through **both** a DASH MPD and an HLS m3u8. That means one set of segments on the CDN serves every DRM system.

### DRM matrix
| Browser | Key system | Manifest | Notes |
|---|---|---|---|
| Chrome, Firefox (desktop) | Widevine (L3 in browser) | DASH | Cap resolution for L3 per studio rules (e.g. ≤1080p/720p) |
| Edge (Windows) | PlayReady (SL3000 where available) → Widevine fallback | DASH | PlayReady HW can unlock higher quality |
| Safari macOS | FairPlay | HLS | Via Shaka (MSE + FairPlay) or native |
| Safari iOS/iPadOS | FairPlay | HLS | **Native `<video>` HLS** (most robust; ManagedMediaSource only on newer iOS) |

- Capability detection: probe `navigator.requestMediaKeySystemAccess` in order, then request the matching manifest.
- The **license proxy** is our own service in front of the DRM vendor. It validates a short-lived playback token (user, film, country, device, expiry) and applies output policy (HDCP, resolution caps by security level). It never trusts the client's own report of entitlement.
- **Long sessions (up to 4 h):** the license duration covers the film plus margin, or renewal/key-rotation is supported. The playback token is refreshed in the background before expiry. Concurrent-stream limits are enforced via the heartbeat.

### Start-up, ABR, seeking
1. `/watch/{id}` → `POST /playback/authorize` → entitlement + rights check for the **current** country → returns signed manifest URL (CDN token), DRM token, license URL, text/audio track list, resume position.
2. Start playback at the resume position, beginning at a lower rendition for fast start. Target time-to-first-frame < 2 s.
- **ABR:** Shaka's bandwidth estimator, capped to player size/devicePixelRatio (no 4K into a 400 px window). Buffer goal is ~30 s ahead, and the back buffer is capped at ~30 s so memory stays flat over a 4-hour film.
- **Manual quality:** menu shows "Auto (1080p)" + available heights. Picking one sets `abr.enabled=false` and selects that variant, and the choice is kept for the session. Safari's native HLS on iOS gives the web no API for choosing a rendition, so there the menu shows Auto only.
- **Seeking:** 4–6 s segments. Trick-play thumbnails come from a WebVTT thumbnail sprite track and show on scrubber hover. ±10 s keys, chapter-less timeline, keyboard shortcuts (space, ←/→, F, M, C for captions).
- **Errors:** typed handling for network (retry with backoff, CDN failover by switching to an alternate base URL), DRM (show which browser/OS is unsupported), and rights changes (friendly "no longer available in your country").

### Subtitles & audio
- Sidecar **WebVTT** per language (or IMSC/TTML where the source requires positioning), up to 20+ per film. The track list arrives with the manifest, and **only the selected track is fetched**.
- **Custom subtitle renderer** (Shaka's UI text displayer / our own overlay) instead of native `::cue`, which is inconsistent across browsers. Users get size (5 steps), font, text color, background box/opacity, and edge style (outline/shadow). The settings live in a CSS-variable theme, preview live, and persist in user prefs synced across devices.
- iOS native fullscreen falls back to the system caption renderer, which respects iOS accessibility caption styles. That is documented as a platform limitation.
- Script coverage: font stack with Noto subsets for CJK/Arabic/Hebrew/Devanagari etc., loaded on demand per selected language, plus `dir="auto"` for RTL cues.
- **Default selection logic:** audio = original language (or the user's preferred dub if they opted in). Subtitles = the user's preferred language if it differs from the audio, else off, plus **forced-narrative** subs always on for foreign-dialogue passages.
- Multiple audio tracks (original, dubs, audio description) are DASH adaptation sets / HLS `EXT-X-MEDIA` groups and switch without a restart.
- Accessibility: SDH captions labeled as such, audio description tracks, full keyboard + screen-reader operable controls, and captions are visible when the controls fade.

---

## 5. Territory licensing

- The **Rights service** is the single source of truth: `(film_id, country, window_start, window_end, offer_type)`. It changes daily via ingestion from licensing.
- **Country resolution at the edge:** the CDN geo header becomes a request header and cache-key component. VPN/proxy detection happens on the server (playback authorize), not in the page. The account's home country may restrict further (e.g. the subscription country for travel rules).
- **Catalogue, search and pages** are all filtered server-side by country. The client never filters rights.
- **Change propagation:** a rights change emits an event, which (a) reindexes search docs, (b) purges the CDN tags `film:{id}:{country}` and the affected `collection:*`/home, and (c) is reflected immediately by the playback authorize check. Page TTLs are also clamped to the next window boundary as a safety net.
- **Enforcement points:** the page shows availability, but **playback authorize** and the **license proxy** enforce it. A stale cached page can at worst show a Play button that results in a polite "no longer available" message, never unlicensed playback.
- Mid-session expiry: let the current viewing finish within a grace period per contract terms. The next authorize call (resume) is denied.

---

## 6. Continue watching & watchlist sync

- **Server is the source of truth** (User service). All apps (web, mobile, TV) use the same API.
- **Progress:** the player sends a heartbeat every 30 s and on pause/seek/ended/`visibilitychange`. On `pagehide` it uses `navigator.sendBeacon`. Payload: `{filmId, positionSec, durationSec, deviceId, clientTs, sessionId}`.
  - Server merge = **last-write-wins by server receive time** per `(user, film)`. Fully watched (>~95% or credits marker) is removed from Continue Watching. Writes are cheap upserts to a KV/wide-column store and fanned out asynchronously.
- **Watchlist:** idempotent `PUT/DELETE /watchlist/{filmId}` with optimistic UI (TanStack Query mutation + rollback). Ordering is by added time. Conflicts are trivially resolved because the operations are set operations.
- **Freshness on web:** refetch on window focus / page load / after playback ends. Real-time push (SSE) isn't needed. Cross-device latency of seconds to minutes is acceptable, and polling on focus is cheaper at 15M MAU.
- Offline/flaky network: queue mutations in IndexedDB and replay on reconnect.

---

## 7. Scale & peaks (15M MAU, 190+ countries)

- **CDN does nearly everything.** Hashed static assets are immutable, HTML is ISR'd per country/locale behind an origin shield, and the image CDN serves resized artwork. Video uses **multi-CDN with steering** (by RUM/QoE + cost), and segments are cached for a long time.
- **Evening peaks** roll across time zones, which naturally spreads load. Origin services autoscale on schedule (pre-scale ahead of each region's evening) + reactive metrics.
- **Big release drops:**
  - Pre-render and pre-warm: build film page, home and collection HTML for all countries ahead of time, and pre-position the first N minutes of segments + manifests + subtitles on CDN edges before the go-live time.
  - Go-live is a rights window flip, so no deploy is needed. Purge tags at T-0.
  - Protect the hot paths: playback authorize + license proxy are horizontally scaled, rate-limited per user, with circuit breakers. Non-essential features degrade first through flags (hover previews off, personalized rails fall back to editorial, progress heartbeats stretched to 60 s).
  - A waiting room is held in reserve but should not be needed if the CDN absorbs the load.
- **Observability:** RUM Core Web Vitals per route/country, plus player QoE beacons (startup time, rebuffer ratio, average bitrate, DRM/license errors, by browser × CDN × country). These drive alerts and CDN steering.

---

## 8. Frontend code organization (for the eventual build)

```
app/[locale]/(browse)/page.tsx                 Home
app/[locale]/(browse)/films/[slug]/page.tsx    Detail (ISR + dynamic slots)
app/[locale]/(browse)/search/page.tsx
app/[locale]/watch/[id]/page.tsx               Client player shell
middleware/proxy.ts                            country + locale resolution, cache key
components/catalogue/  FilmCard, PreviewVideoPool, Rail, FilmOfTheDay
components/player/     Player (Shaka adapter), Controls, QualityMenu, TrackMenu,
                       SubtitleRenderer, SubtitleStyleSettings, ThumbnailScrubber
lib/drm/               keySystemDetection, licenseRequestFilters (per DRM)
lib/sync/              progressReporter (heartbeat + sendBeacon), watchlist mutations
lib/seo/               jsonLd(Movie, VideoObject), hreflang, sitemaps
```

Stack: Next.js (App Router, ISR/PPR), React, TanStack Query, Shaka Player, hls.js (trailers only), a CSS-variable design system.

---

## 9. Verification

- **Browser/DRM matrix:** automated playback smoke tests (Playwright with branded Chrome/Edge, Firefox, WebKit + real-device BrowserStack runs for Safari macOS/iOS, since DRM won't run in headless) covering: start, seek, quality switch, audio switch, subtitle switch, resume.
- **Detail page:** Lighthouse CI budgets (LCP, CLS, JS size), Rich Results test for JSON-LD, hreflang validation, and a check that HTML is identical across countries except the availability block.
- **Rights:** contract tests where a film unavailable in country X → no search hit, the page shows "not available", authorize returns 403, and the license is denied. Also a window-flip test with a fake clock.
- **Sync:** two-client test that progresses on A, then checks that B shows the resume point after focus. Watchlist optimistic rollback on a 500.
- **Load:** a release-drop simulation (k6) against authorize/license/progress at, e.g., 5× evening peak, plus a CDN pre-warm verification.

## Next step
Scaffold a Next.js prototype of the browse → detail → watch flow with mock catalogue data and Clear Key DRM.
