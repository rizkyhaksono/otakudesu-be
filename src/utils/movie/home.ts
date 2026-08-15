import { tmdb } from "@/lib/movie/tmdb";
import { mapSummaries } from "@/lib/movie/mappers";
import type { MovieHome } from "@/types/movie";

const movieHome = async (): Promise<MovieHome> => {
  const [trending, movies, tv] = await Promise.all([
    tmdb<{ results: unknown[] }>("/trending/all/week"),
    tmdb<{ results: unknown[] }>("/movie/popular"),
    tmdb<{ results: unknown[] }>("/tv/popular"),
  ]);

  return {
    trending: mapSummaries(trending?.results),
    popular_movies: mapSummaries(movies?.results, "movie"),
    popular_tv: mapSummaries(tv?.results, "tv"),
  };
};

export default movieHome;
