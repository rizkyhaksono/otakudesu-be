import { tmdb } from "@/lib/movie/tmdb";
import { mapSummaries } from "@/lib/movie/mappers";
import type { MediaType, MovieGenre, MovieSummary } from "@/types/movie";

export const movieGenres = async (): Promise<{ movie: MovieGenre[]; tv: MovieGenre[] }> => {
  const [movie, tv] = await Promise.all([
    tmdb<{ genres?: MovieGenre[] }>("/genre/movie/list", {}, 86_400),
    tmdb<{ genres?: MovieGenre[] }>("/genre/tv/list", {}, 86_400),
  ]);

  return { movie: movie?.genres ?? [], tv: tv?.genres ?? [] };
};

export const discoverByGenre = async (
  genreId: number,
  page = 1,
  mediaType: MediaType = "movie",
): Promise<{ page: number; total_pages: number; results: MovieSummary[] }> => {
  const raw = await tmdb<{ page?: number; total_pages?: number; results?: unknown[] }>(
    `/discover/${mediaType}`,
    { with_genres: genreId, page, sort_by: "popularity.desc" },
  );

  return {
    page: raw?.page ?? page,
    total_pages: raw?.total_pages ?? 0,
    results: mapSummaries(raw?.results, mediaType),
  };
};
