# CLAUDE.md

Guidance for AI agents working in this repository.

## Commands

```bash
bun run dev         # dev server on :3000
bun run build       # production build (standalone)
bun run lint        # eslint flat config  (`next lint` was REMOVED in Next 16)
bun run typecheck   # tsc --noEmit
bun test <dirs>     # unit tests — fixture-based, never touch the network
bun run test:live   # opt-in suite that hits real upstreams
```

Package manager is **bun**. There is no `package-lock.json`.

Toolchain note: TypeScript is pinned to 5.9 and ESLint to 9, not the newest releases.
typescript-eslint does not support TS 7, and `eslint-plugin-react` (pulled in by
`eslint-config-next`) still calls `context.getFilename()`, removed in ESLint 10. Both were verified
to break; do not bump them without re-checking.

## Environment

See `.env.example`. Only `ANIME_BASE_URL` is required (`BASEURL` is a legacy alias). Every other
domain degrades on its own: no `TMDB_ACCESS_TOKEN` means the movie endpoints return empty results
rather than failing the service.

## Architecture

Eight domains — anime, comic, movie, live TV, radio, news, cross-domain search, and a handful of small
open-API tools (quotes, reverse image search) — behind one API. The layering is strict:

```
src/app/api/v1/<domain>/…   route handlers: validate params, call a util, return via apiHandler
src/utils/<domain>/…        I/O layer: fetch upstream, hand the body to a parser
src/lib/<domain>/…          pure parsers: data in, data out
src/lib/shared/…            http · env · errors · sanitize · validate · rateLimit · ssrf · apiHandler
src/proxy.ts                per-IP rate limiting (renamed from middleware in Next 16)
```

### Rules that must survive edits

- **Parsers are pure.** No `fetch`, no `process.env`. If a parser needs the upstream origin, it
  takes `baseUrl` as an argument — that is what makes every one of them testable against a fixture.
- **`apiHandler` owns the response shape.** Success is `{ data }`, failure is `{ error }`. Never
  build an error response by hand; throw a typed error from `src/lib/shared/errors.ts`.
- **All upstream text goes through `sanitize.ts`.** Scraped content is untrusted — the comic
  upstream ships raw `<p>` markup inside novel synopses.
- **Validate every route param** with a schema from `src/lib/shared/validate.ts`, so bad input is a
  400 rather than a 500 further down.
- **Async params**: handlers use `props: { params: Promise<{...}> }` and `await props.params`.
- **Unit tests never hit the network.** Network checks belong in `tests/live/`.

### Domain specifics

- **Comic** is not scraped with CSS selectors. The upstream is Laravel + Inertia; the whole page
  state lives in the `data-page` attribute as JSON. Parse that. Chapters are addressed by
  `chapter_number`, not slug.
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
- **Tools** (`src/utils/anime/quotes.ts`, `src/utils/anime/identify.ts`) wrap two small, open,
  unauthenticated third-party APIs — AnimeChan for quotes, trace.moe for reverse image search.
  Both degrade quietly: a title with no quotes is a normal empty result, not an error.
- **Route params must be validated *inside* the `apiHandler` callback, not before it.** A `parse()`
  call made before `apiHandler(() => ...)` throws outside its `try`, which turns bad input into an
  uncaught 500 instead of the intended 400. This was a real, recurring bug — check new routes
  against it.
- **The HLS and radio proxies are the SSRF-sensitive routes.** Neither ever accepts a
  caller-supplied URL: they take a channel or station id, or a URL this server HMAC-signed itself
  while rewriting a manifest. `assertPublicUrl` re-resolves the host and rejects private ranges.
  Do not relax either layer.

## Backwards compatibility

Pre-v1 paths still work via `rewrites()` in `next.config.ts`. Add new endpoints under `/api/v1/`
and register them in `src/lib/openapi.ts` so they show up at `/docs`.

## Disclaimer

This is an index/aggregator for third-party sources; it hosts no media. Do not add anything that
hammers an upstream (no prefetch loops, no unthrottled fan-out).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
