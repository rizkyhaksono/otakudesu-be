import { tmdb } from "@/lib/movie/tmdb";
import { mapEpisode } from "@/lib/movie/mappers";
import type { MovieEpisode } from "@/types/movie";

const movieSeason = async (
  id: number,
  season: number,
): Promise<{ season_number: number; episodes: MovieEpisode[] } | null> => {
  const raw = await tmdb<{ episodes?: unknown[] }>(`/tv/${id}/season/${season}`);
  if (!raw) return null;

  return {
    season_number: season,
    episodes: (raw.episodes ?? [])
      .map(mapEpisode)
      .filter((episode): episode is MovieEpisode => episode !== null),
  };
};

export default movieSeason;
