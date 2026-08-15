import { tmdb } from "@/lib/movie/tmdb";
import { mapSummaries } from "@/lib/movie/mappers";
import type { MovieSummary } from "@/types/movie";

const movieSearch = async (
  query: string,
  page = 1,
): Promise<{ page: number; total_pages: number; results: MovieSummary[] }> => {
  const raw = await tmdb<{ page?: number; total_pages?: number; results?: unknown[] }>(
    "/search/multi",
    { query, page, include_adult: "false" },
    300,
  );

  return {
    page: raw?.page ?? page,
    total_pages: raw?.total_pages ?? 0,
    results: mapSummaries(raw?.results),
  };
};

export default movieSearch;
