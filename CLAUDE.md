# CLAUDE.md

Guidance for AI agents working in this repository.

## Commands

```bash
bun run dev         # Hono server on :3000, restarts on change
bun run start       # same, without the watcher (production: `bun src/server.ts`)
bun run lint        # eslint flat config (typescript-eslint)
bun run typecheck   # tsc --noEmit
bun test <dirs>     # unit tests — fixture-based, never touch the network
bun run test:live   # opt-in suite that hits real upstreams
```

Package manager is **bun**. There is no `package-lock.json`.

There is no build step: Bun runs the TypeScript source directly, in dev and in the Docker image.
TypeScript is pinned to 5.9 (typescript-eslint does not support TS 7).

## Environment

See `.env.example`. Only `ANIME_BASE_URL` is required (`BASEURL` is a legacy alias). Every other
domain degrades on its own: no `TMDB_ACCESS_TOKEN` means the movie endpoints return empty results
rather than failing the service.

## Architecture

Eight domains — anime, comic, movie, live TV, radio, news, cross-domain search, and a handful of small
open-API tools (quotes, reverse image search, theme song playlists) — behind one API. The layering is strict:

```
src/server.ts               Hono app: CORS/security headers, rate limit, legacy aliases, /docs,
                            and auto-mounts every src/app/api/**/route.ts
src/app/api/v1/<domain>/…   route handlers: validate params, call a util, return via apiHandler
src/utils/<domain>/…        I/O layer: fetch upstream, hand the body to a parser
src/lib/<domain>/…          pure parsers: data in, data out
src/lib/shared/…            http · env · errors · sanitize · validate · rateLimit · ssrf · apiHandler
```

### Rules that must survive edits

- **Parsers are pure.** No `fetch`, no `process.env`. If a parser needs the upstream origin, it
  takes `baseUrl` as an argument — that is what makes every one of them testable against a fixture.
- **`apiHandler` owns the response shape.** Success is `{ data }`, failure is `{ error }`. Never
  build an error response by hand; throw a typed error from `src/lib/shared/errors.ts`.
- **All upstream text goes through `sanitize.ts`.** Scraped content is untrusted — a former comic
  upstream shipped raw `<p>` markup inside novel synopses.
- **Validate every route param** with a schema from `src/lib/shared/validate.ts`, so bad input is a
  400 rather than a 500 further down.
- **Route files keep the `GET(request, { params })` shape** with `params` as a Promise;
  `src/server.ts` maps `[slug]` folders to `:slug` and registers literal segments before
  parameters. A new endpoint is a new `route.ts` file plus an entry in `src/lib/openapi.ts`.
- **Upstream caching lives in `src/lib/shared/http.ts`.** `revalidate` is seconds in an in-memory
  LRU (64 MB); concurrent misses share one request and a failed refresh serves the stale copy.
  `revalidate: 0` means uncached — use it for multi-MB indexes that are memoised in reduced form.
- **Unit tests never hit the network.** Network checks belong in `tests/live/`.

### Domain specifics

- **Comic** is Komiku, scraped with cheerio (`src/lib/comic/komiku.ts`). Pages come from
  `komiku.org`; catalogue, genre and search listings are htmx fragments from `api.komiku.org`
  (`COMIC_LIST_URL`), ten per page with no total. The API addresses chapters by `chapter_number`;
  the reader resolves that to Komiku's chapter slug through the detail page's chapter list, and
  takes `prev`/`next` from the same list. No novels — those endpoints return empty lists. Kiryuu
  was dropped: `kiryuuid.net` and its new domain sit behind a Cloudflare managed challenge.
- **Movie** uses TMDB for metadata plus a registry of embed providers keyed by TMDB id
  (`src/lib/movie/providers.ts`) — pure URL construction, no scraping. idlix was dropped: the
  domain is gone and every mirror sits behind a Cloudflare managed challenge.
- **Live TV** reads the iptv-org JSON index, memoised for six hours. A background pass probes each
  stream and hides channels whose streams are all dead.
- **Radio** mirrors the live TV design: a memoised public index, `lastcheckok` from the upstream
  standing in for our own liveness probe, and a proxy that takes a station id rather than a URL.
  Plain-HTTP streams are surfaced with `direct: null` so the client never fires a request the
  browser will block on an HTTPS page.
- **News** is RSS parsed with regex, deliberately: the shape is fixed and shallow, and an XML
  library would be the only one in the project.
- **Search** (`src/utils/search`) fans one query out to the other domains in parallel and normalizes
  the results into one shape. Each domain call is individually wrapped so one upstream failing
  degrades that domain's results, not the whole search.
- **Tools** (`src/utils/anime/quotes.ts`, `src/utils/anime/identify.ts`, `src/utils/anime/themes.ts`)
  wrap small, open, unauthenticated third-party APIs — AnimeChan for quotes, trace.moe for reverse
  image search, AnimeThemes.moe for OP/ED songs. All degrade quietly: a title with no quotes, or no
  confident theme-song match, is a normal empty result, not an error.
- **Never derive a public URL from `request.url`.** Behind the reverse proxy the server
  reports its bind address, so the OpenAPI document advertised `https://0.0.0.0:3000` as its server.
  Use `publicOrigin(request)` (`src/lib/shared/publicOrigin.ts`), which reads `x-forwarded-*`.
- **Shinigami is a link resolver, not a scraper.** Its content domain sits behind a Cloudflare
  managed challenge (verified: full browser headers still get a 403 interstitial), the same wall
  that got idlix dropped. What *is* reachable is `shinigami.to/links.json`, whose **first** entry is
  always the live domain — that ordering is the contract, not the label text, which is localised
  prose they may reword.
- **`/docs` is a self-hosted Scalar API reference**, not a hand-rolled page. The renderer bundle is
  vendored at `public/vendor/scalar-standalone.js` rather than pulled from Scalar's CDN — this
  project treats "no third-party script on our own pages" as a rule that applies to the docs page
  too. Adding an endpoint means registering it in `src/lib/openapi.ts`'s `OPERATIONS` array; nothing
  else needs touching for it to show up.
- **Route params must be validated *inside* the `apiHandler` callback, not before it.** A `parse()`
  call made before `apiHandler(() => ...)` throws outside its `try`, which turns bad input into an
  uncaught 500 instead of the intended 400. This was a real, recurring bug — check new routes
  against it.
- **The HLS and radio proxies are the SSRF-sensitive routes.** Neither ever accepts a
  caller-supplied URL: they take a channel or station id, or a URL this server HMAC-signed itself
  while rewriting a manifest. `assertPublicUrl` re-resolves the host and rejects private ranges.
  Do not relax either layer.

## Backwards compatibility

Pre-v1 paths still work via the `LEGACY` alias table in `src/server.ts`. Add new endpoints under `/api/v1/`
and register them in `src/lib/openapi.ts` so they show up at `/docs`.

## Disclaimer

This is an index/aggregator for third-party sources; it hosts no media. Do not add anything that
hammers an upstream (no prefetch loops, no unthrottled fan-out).
