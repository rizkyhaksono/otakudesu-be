# Architecture

## Layers

```
src/app/api/v1/<domain>/…   route handlers — thin, validate params, call a util
src/utils/<domain>/…        I/O layer — fetches upstream, calls a parser
src/lib/<domain>/…          pure parsers — data in, data out, no network
src/lib/shared/…            http · env · errors · sanitize · validate · rateLimit · ssrf
src/proxy.ts                rate limiting (renamed from middleware in Next.js 16)
```

The rule that keeps this maintainable: **parsers never do I/O and never read `process.env`.** They
take their inputs as arguments, which is why every one of them is unit-testable against a checked-in
fixture with no setup.

## Why each source

### Anime — scraped from Otakudesu

Inherited from the original service and still healthy. Cheerio selectors are inherently fragile, so
`bun run test:live` exists to detect breakage before users report it.

### Comic — Kiryuu ID via Inertia props, not CSS selectors

The comic upstream is a Laravel + Inertia.js app. Every page embeds its complete server state as
HTML-escaped JSON in the root element's `data-page` attribute, so the adapter parses **structured
JSON** instead of guessing at markup. This survives redesigns that would break a selector-based
scraper.

Requesting with the `X-Inertia: true` header (the "official" JSON channel) answers `409` because we
cannot know the asset version ahead of time, so reading `data-page` from the HTML is the supported
path.

Chapters are addressed by `chapter_number`, not slug: `/manga/{slug}/chapter/43` returns 200,
`/manga/{slug}/chapter-43` returns 404.

### Movie — TMDB, not a scraped streaming site

The previous movie source (idlix) is gone: `idlix.my` no longer resolves, and every surviving mirror
sits behind a Cloudflare **managed challenge** that a plain HTTP client cannot pass. Beating that
needs a headless browser with stealth patches or a FlareSolverr sidecar — heavy, slow, and broken by
every Cloudflare update. (That is also why the old service carried a `puppeteer` dependency it never
actually called.)

TMDB gives better metadata than scraping ever did — official, structured, multilingual, with a
stable image CDN. Playback comes from **embed providers keyed by TMDB id**
(`src/lib/movie/providers.ts`), which is pure URL construction: no scraping, nothing to break when a
streaming site rotates its domain. Multiple providers are returned at once so the UI can offer a
"Server 1 / 2 / 3" switcher.

### Live TV — iptv-org

An open, well-maintained dataset of public streams. `channels.json` is ~10 MB and `guides.json`
~25 MB, so the raw documents are fetched once, reduced to the configured country, and memoised in
module scope for six hours.

Two practical wrinkles drive the design:

- **Mixed CORS.** Some streams send `Access-Control-Allow-Origin: *` and play directly in the
  browser; others do not.
- **Some need headers.** A stream may require a specific `User-Agent` or `Referer`, which a browser
  cannot set. `streams.json` provides both.

So the API exposes `url` (direct, when safe) *and* `proxy_url` for every stream, and only proxies
what actually needs it — proxying everything would put all live-TV bandwidth through this server.

Roughly a third of indexed streams are dead at any moment, so a background liveness pass probes each
one after the index is built and hides channels whose streams are all confirmed dead. It runs
*after* the first response so no request ever waits on ~130 round-trips.

## Security notes

- **SSRF.** The HLS proxy is the only place that fetches a URL not derived from a hard-coded base.
  It never accepts a URL from the caller: mode 1 takes a channel id and looks the URL up in the
  index; mode 2 accepts only URLs this server **HMAC-signed** itself while rewriting a manifest.
  `assertPublicUrl` then re-resolves the host and rejects private ranges (including cloud metadata
  at `169.254.169.254`) as a second layer.
- **Ports are deliberately unrestricted** in that check. Many regional Indonesian channels serve HLS
  from Wowza on `:1935`; blocking non-standard ports broke real streams without adding protection,
  because reaching an internal service requires a private address, which is already blocked.
- **XSS.** Upstream text is untrusted and sometimes contains raw HTML — Kiryuu ships `<p>` markup
  inside novel synopses. `sanitize.ts` strips tags at the mapper boundary so every consumer of the
  API is protected by one fix.
- **Rate limiting** lives in `src/proxy.ts`. Each request fans out to a third party, so an
  unthrottled client can get this server's IP banned upstream.
