# Otakudesu Community API

[![CI](https://github.com/rizkyhaksono/otakudesu-be/actions/workflows/ci.yml/badge.svg)](https://github.com/rizkyhaksono/otakudesu-be/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-bun%201.3-black)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/next.js-16-black)](https://nextjs.org)

One read-only public API for **anime**, **comics**, **movies & series**, and **Indonesian live TV**.

This service replaces three separate backends (`otakudesu-be`, `nateegami-api`, `nateeflix-api`)
with a single Next.js App Router deployment. Community-built, community-maintained, MIT licensed.

## What it serves

| Domain | Source | What you get |
| --- | --- | --- |
| **Anime** | Otakudesu (scraped) | Ongoing / completed listings, A–Z directory, detail, episodes, batches, genres, schedule, search |
| **Comic** | Kiryuu ID (Laravel + Inertia JSON) | Listings, detail with full chapter list, and the **reader payload** — ordered page images with prev/next |
| **Movie & series** | [TMDB](https://www.themoviedb.org/) + embed providers | Metadata, cast, seasons, search, genres, and playable embed sources |
| **Live TV** | [iptv-org](https://github.com/iptv-org/iptv) | Indonesian channels, categories, and a CORS-safe HLS proxy |
| **Radio** | [radio-browser](https://www.radio-browser.info/) | Indonesian stations, tags, and an audio proxy for streams the browser cannot reach |
| **News** | [Anime News Network](https://www.animenewsnetwork.com/) | Latest anime headlines from the public RSS feed |
| **Search** | — | Fans out one query to anime, comics, movies/TV and radio in parallel |
| **Tools** | [AnimeChan](https://github.com/RocktimSaikia/anime-chan) · [trace.moe](https://github.com/soruly/trace.moe) · [AnimeThemes.moe](https://animethemes.moe) | Anime quotes, reverse image search ("which anime is this screenshot from"), and OP/ED theme song playlists |

Every successful response is `{ data }`. Every failure is `{ error }`. All endpoints are `GET`.

**Browse the reference at `/docs`, or grab the OpenAPI 3.1 spec at `/api/openapi.json`.**

## Quick start

```bash
bun install
cp .env.example .env      # fill in the values you need
bun run dev               # http://localhost:3000
```

Only `ANIME_BASE_URL` is strictly required. Each domain degrades independently — a missing
`TMDB_ACCESS_TOKEN` makes the movie endpoints return empty results rather than breaking the service.

### Environment

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `ANIME_BASE_URL` | ✅ | — | Upstream anime site origin (`BASEURL` still works as a legacy alias) |
| `COMIC_BASE_URL` | | `https://kiryuuid.net` | Upstream comic site origin |
| `TMDB_ACCESS_TOKEN` | | — | TMDB **v4 API Read Access Token** — themoviedb.org → Settings → API |
| `TMDB_LANGUAGE` | | `id-ID` | Metadata language |
| `MOVIE_EMBED_PROVIDERS` | | `2embed,videasy,vidsrc` | Ordered list of enabled embed players |
| `IPTV_API_URL` | | `https://iptv-org.github.io/api` | Live TV index |
| `RADIO_API_URL` | | `https://de1.api.radio-browser.info` | Radio station index |
| `NEWS_FEED_URL` | | ANN weekly feed | RSS source for the news endpoint |
| `SITE_URL` | | `https://otakudesu.natee.my.id` | Used to build absolute links, e.g. the schedule `.ics` feed |
| `ANIMECHAN_API_URL` | | `https://api.animechan.io/v1` | Quote source |
| `TRACEMOE_API_URL` | | `https://api.trace.moe` | Reverse image search source |
| `ANIMETHEMES_API_URL` | | `https://api.animethemes.moe` | Theme song source |
| `TV_COUNTRY` | | `ID` | ISO country filter for live TV |
| `MOVIEBOX_API_URL` | | — | Optional extra adapter; disabled when empty |
| `RATE_LIMIT_PER_MINUTE` | | `120` | Per-IP request budget |
| `HLS_PROXY_SECRET` | | random per process | Set this only when running multiple replicas |

## Scripts

```bash
bun run dev         # dev server
bun run build       # production build (standalone output)
bun run start       # run the build
bun run lint        # eslint (flat config)
bun run typecheck   # tsc --noEmit
bun test            # unit tests — fixture-based, no network
bun run test:live   # opt-in suite that hits the real upstreams
```

## Architecture in one paragraph

`src/lib/shared/` is the only I/O boundary: `http.ts` wraps native `fetch` (not axios — Next.js
only applies its Data Cache to `fetch`), `env.ts` validates configuration, `sanitize.ts` strips
HTML out of everything scraped, and `apiHandler.ts` is the single place that maps a domain function
to an HTTP response. Each domain then has pure parsers in `src/lib/<domain>/`, an I/O layer in
`src/utils/<domain>/`, and thin route handlers in `src/app/api/v1/<domain>/`. See
[ARCHITECTURE.md](ARCHITECTURE.md) for why each source was chosen.

## Backwards compatibility

The pre-v1 paths (`/api/home`, `/api/anime/:slug`, `/api/ongoing-anime/:page`, …) still work.
They are mapped onto `/api/v1/anime/*` by `rewrites()` in `next.config.ts` — rewrites, not
redirects, so existing consumers need no changes.

## Contributing

Upstream sites change their markup without warning; that is the single most common reason something
here breaks, and the most common kind of contribution. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) — it walks through adding a source adapter and capturing a test
fixture. Security issues go to [SECURITY.md](SECURITY.md).

## Disclaimer

This project is an **index and aggregator**. It hosts no media, stores no copyrighted content, and
serves only links and metadata that are already publicly accessible. All content belongs to its
respective owners. Provided for educational purposes.

## License

[MIT](LICENSE)
