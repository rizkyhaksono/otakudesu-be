import search from "@/utils/anime/search";
import movieSearch from "@/utils/movie/search";
import comicBrowse from "@/utils/comic/browse";
import { radioStations } from "@/utils/radio/stations";
import type { SearchHit, SearchResult } from "@/types/search";

const LIMIT_PER_DOMAIN = 6;

/**
 * One query, four independent upstreams, in parallel.
 *
 * Each domain already has its own full-featured search (with pagination,
 * filters, etc.) behind its own endpoint — this is deliberately not a
 * replacement for those, just a fast fan-out that answers "does this exist
 * anywhere on the site" for the omnibox. A failure in any one domain must not
 * take the others down, so each call is wrapped rather than run inside a
 * single `Promise.all`.
 */
async function safely<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export async function omniSearch(query: string): Promise<SearchResult> {
  const [anime, movies, comics, radios] = await Promise.all([
    safely(search(query), []),
    safely(movieSearch(query, 1), { page: 1, total_pages: 0, results: [] }),
    safely(comicBrowse({ search: query }), {
      pagination: { current_page: 1, last_page: 1, per_page: 24, total: 0 },
      genres: [],
      comics: [],
    }),
    safely(radioStations({ q: query }), { total: 0, stations: [] }),
  ]);

  const hits: SearchHit[] = [
    ...anime.slice(0, LIMIT_PER_DOMAIN).map(
      (item): SearchHit => ({
        kind: "anime",
        title: item.title ?? "—",
        href: `/anime/${item.slug}`,
        poster: item.poster ?? null,
        meta: item.status ?? null,
      }),
    ),
    ...comics.comics.slice(0, LIMIT_PER_DOMAIN).map(
      (item): SearchHit => ({
        kind: "comic",
        title: item.title ?? "—",
        href: `/comic/${item.slug}`,
        poster: item.poster,
        meta: item.type,
      }),
    ),
    ...movies.results.slice(0, LIMIT_PER_DOMAIN).map(
      (item): SearchHit => ({
        kind: item.media_type === "tv" ? "tv_series" : "movie",
        title: item.title ?? "—",
        href: item.media_type === "tv" ? `/movie/tv/${item.id}` : `/movie/${item.id}`,
        poster: item.poster,
        meta: item.release_year ? String(item.release_year) : null,
      }),
    ),
    ...radios.stations.slice(0, LIMIT_PER_DOMAIN).map(
      (item): SearchHit => ({
        kind: "radio",
        title: item.name,
        href: `/radio/${item.id}`,
        poster: item.favicon,
        meta: item.state,
      }),
    ),
  ];

  // Full per-domain totals, not the capped preview count — this is what a
  // "15 movies match" badge or a "see all in Movies" link wants, and it will
  // legitimately be larger than how many of that kind appear in `hits`.
  const counts: SearchResult["counts"] = {
    anime: anime.length,
    comic: comics.comics.length,
    movie: movies.results.filter((r) => r.media_type === "movie").length,
    tv_series: movies.results.filter((r) => r.media_type === "tv").length,
    radio: radios.stations.length,
  };

  return {
    query,
    total: hits.length,
    hits,
    counts,
  };
}
