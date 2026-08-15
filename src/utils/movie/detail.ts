import { tmdb } from "@/lib/movie/tmdb";
import { mapDetail } from "@/lib/movie/mappers";
import type { MediaType, MovieDetail } from "@/types/movie";

const movieDetail = async (id: number, mediaType: MediaType): Promise<MovieDetail | null> => {
  const raw = await tmdb<Record<string, unknown>>(`/${mediaType}/${id}`, {
    append_to_response: "credits,videos,external_ids",
  });
  if (!raw) return null;
  return mapDetail(raw, mediaType);
};

export default movieDetail;
