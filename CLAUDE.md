# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the dev server with Turbopack (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run `next lint` (extends `next/core-web-vitals`)

There is no test runner configured.

## Environment

`BASEURL` (in `.env`) is **required** — it is the upstream Otakudesu site origin (e.g. `https://otakudesu.cloud`) that every scraper hits via `` axios.get(`${BASEURL}/...`) ``. Most utils will throw on `undefined` rather than fail loudly. Copy `.env.example` to `.env` before running.

## Architecture

This is a Next.js 15 App Router project used **as an API-only backend** — `src/app/page.tsx` is a placeholder; all real surface area is under `src/app/api/*`. CORS is opened to `*` for all paths in `next.config.js`.

Every endpoint follows the same three-layer pattern:

1. **Route handler** (`src/app/api/<resource>/route.ts`) — thin Next.js handler. Awaits `props.params` (Next 15 makes params a Promise), calls the matching util, wraps the result in `NextResponse.json({ data }, { status })`. Errors typically become a generic 500.
2. **Util** (`src/utils/<resource>.ts`) — fetches HTML from `${BASEURL}/...` with `axios` and hands the body to a scraper in `lib/`. Some utils also parse pagination via `src/lib/pagination.ts`.
3. **Lib scraper** (`src/lib/scrape*.ts`) — pure functions that take an HTML string, load it with `cheerio`, and return typed data. No I/O.

Shared TypeScript types (`anime`, `episode`, `searchResultAnime`, `ongoingAnime`, `completeAnime`, `genre`, `batch`, `ScheduleByDay`, `animeListGroup`, `movie`) live in `src/types/types.ts` and are imported via the `@/*` path alias (mapped to `./src/*` in `tsconfig.json`).

### Endpoint map

| Route | Util | Notes |
| --- | --- | --- |
| `GET /api/home` | `utils/home.ts` | Scrapes ongoing + complete from the homepage in one request. |
| `GET /api/anime/[slug]` | `utils/anime.ts` → `lib/scrapeSingleAnime.ts` | Composes `scrapeAnimeEpisodes`, `getBatch`, `mapGenres`, recommendations. |
| `GET /api/anime/[slug]/episodes` | `utils/episodes.ts` | |
| `GET /api/anime/[slug]/episodes/[episode]` | `utils/episode.ts` | Resolves episode-number → episode-slug by reading the anime's episode list (handles 0- vs 1-indexed series). |
| `GET /api/episode/[slug]` | `utils/episode.ts` | Direct slug variant. |
| `GET /api/ongoing-anime/[id]` | `utils/ongoingAnime.ts` | `id` is the page number; returns `{ paginationData, ongoingAnimeData }`. |
| `GET /api/complete-anime/[page]` | `utils/completeAnime.ts` | |
| `GET /api/genre/[slug]` | `utils/animeByGenre.ts` | Also reads `?page=` query param. |
| `GET /api/search/[keyword]` | `utils/search.ts` | |
| `GET /api/schedule` | `utils/schedule.ts` | |
| `GET /api/batch/[slug]` | `utils/batch.ts` → `lib/scrapeBatch.ts` | Returns 404 when no batch exists for the slug. |
| `GET /api/movie/[slug]` | `utils/movie.ts` → `lib/scrapeMovie.ts` | `slug` is the anime slug; util resolves the single episode and scrapes its iframe + downloads. |
| `GET /api/anime-list` | `utils/animeList.ts` → `lib/scrapeAnimeList.ts` | A–Z directory grouped by letter. |

### Conventions to preserve when editing

- **Async params**: route handlers use the Next 15 signature `props: { params: Promise<{ ... }> }` and `await props.params`. Don't regress to the synchronous form.
- **Util signature**: utils are the I/O boundary; lib scrapers stay pure (HTML in, data out) so they remain unit-testable in isolation.
- **Pagination**: anything paged must use `lib/pagination.ts` and return both `paginationData` and the data array — match the existing shape.
- **Selectors**: scrapers depend on Otakudesu's exact CSS structure (e.g. `.infozin .infozingle p:nth-child(N) span`). When upstream HTML changes, fix the selector in the relevant `lib/scrape*.ts` rather than working around it in the route or util.
- **TypeScript**: `strict` is on; prefer extending the existing types in `src/types/types.ts` over inlining new shapes.

## Disclaimer

The scraper targets a third-party site for educational purposes — see `README.md`. Don't add features that hammer the upstream (no aggressive prefetch/loops in route handlers).
