import { tmdb } from "@/lib/movie/tmdb";
import { mapSummaries } from "@/lib/movie/mappers";
import type { MovieSummary } from "@/types/movie";

export type MovieCategory = "trending" | "popular" | "top-rated" | "tv" | "tv-top-rated";

const ENDPOINTS: Record<MovieCategory, { path: string; fallback?: "movie" | "tv" }> = {
  trending: { path: "/trending/all/week" },
  popular: { path: "/movie/popular", fallback: "movie" },
  "top-rated": { path: "/movie/top_rated", fallback: "movie" },
  tv: { path: "/tv/popular", fallback: "tv" },
  "tv-top-rated": { path: "/tv/top_rated", fallback: "tv" },
};

export const MOVIE_CATEGORIES = Object.keys(ENDPOINTS) as MovieCategory[];

/**
 * Paginated category listing, so each home shelf has a real "see all" page
 * instead of being capped at whatever the shelf shows.
 */
const movieList = async (
  category: MovieCategory,
  page = 1,
): Promise<{ page: number; total_pages: number; results: MovieSummary[] }> => {
  const endpoint = ENDPOINTS[category];

  const raw = await tmdb<{ page?: number; total_pages?: number; results?: unknown[] }>(
    endpoint.path,
    { page },
  );

  return {
    page: raw?.page ?? page,
    // TMDB caps paging at 500 regardless of what it reports.
    total_pages: Math.min(raw?.total_pages ?? 0, 500),
    results: mapSummaries(raw?.results, endpoint.fallback),
  };
};

export default movieList;
