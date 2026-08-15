import { tmdbImage } from "@/lib/movie/tmdb";
import { num, text } from "@/lib/shared/sanitize";
import type {
  MediaType,
  MovieDetail,
  MovieEpisode,
  MovieSeasonRef,
  MovieSummary,
} from "@/types/movie";

type Raw = Record<string, unknown>;

const asRecord = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** TMDB uses `title`/`release_date` for movies and `name`/`first_air_date` for TV. */
export function mapSummary(raw: unknown, fallbackType?: MediaType): MovieSummary | null {
  const item = asRecord(raw);
  const id = num(item.id);
  if (id === null) return null;

  const rawType = text(item.media_type);
  const media_type: MediaType =
    rawType === "movie" || rawType === "tv" ? rawType : (fallbackType ?? "movie");

  const release_date = text(item.release_date) ?? text(item.first_air_date);
  const year = release_date ? Number.parseInt(release_date.slice(0, 4), 10) : NaN;

  return {
    id,
    media_type,
    title: text(item.title) ?? text(item.name),
    original_title: text(item.original_title) ?? text(item.original_name),
    poster: tmdbImage(item.poster_path, "w500"),
    backdrop: tmdbImage(item.backdrop_path, "w1280"),
    overview: text(item.overview),
    release_date,
    release_year: Number.isFinite(year) ? year : null,
    rating: num(item.vote_average),
    vote_count: num(item.vote_count),
    genre_ids: asArray(item.genre_ids)
      .map((g) => num(g))
      .filter((g): g is number => g !== null),
  };
}

export function mapSummaries(raw: unknown, fallbackType?: MediaType): MovieSummary[] {
  return asArray(raw)
    .map((entry) => mapSummary(entry, fallbackType))
    .filter((entry): entry is MovieSummary => entry !== null)
    // People show up in /search/multi results; this domain only serves titles.
    .filter((entry) => entry.title !== null);
}

export function mapSeason(raw: unknown): MovieSeasonRef | null {
  const season = asRecord(raw);
  const season_number = num(season.season_number);
  if (season_number === null) return null;

  return {
    season_number,
    name: text(season.name),
    episode_count: num(season.episode_count),
    air_date: text(season.air_date),
    poster: tmdbImage(season.poster_path, "w300"),
  };
}

export function mapEpisode(raw: unknown): MovieEpisode | null {
  const episode = asRecord(raw);
  const episode_number = num(episode.episode_number);
  if (episode_number === null) return null;

  return {
    episode_number,
    name: text(episode.name),
    overview: text(episode.overview),
    air_date: text(episode.air_date),
    still: tmdbImage(episode.still_path, "w300"),
    runtime: num(episode.runtime),
  };
}

export function mapDetail(raw: unknown, mediaType: MediaType): MovieDetail | null {
  const item = asRecord(raw);
  const summary = mapSummary({ ...item, media_type: mediaType }, mediaType);
  if (!summary) return null;

  const credits = asRecord(item.credits);
  const crew = asArray(credits.crew).map(asRecord);
  const director = crew.find((member) => text(member.job) === "Director");

  const videos = asArray(asRecord(item.videos).results).map(asRecord);
  const trailer = videos.find(
    (video) => text(video.site) === "YouTube" && text(video.type) === "Trailer",
  );
  const trailerKey = trailer ? text(trailer.key) : null;

  const runtime =
    num(item.runtime) ??
    num(asArray(item.episode_run_time).find((value) => num(value) !== null));

  return {
    ...summary,
    tagline: text(item.tagline),
    status: text(item.status),
    runtime,
    genres: asArray(item.genres)
      .map(asRecord)
      .map((genre) => ({ id: num(genre.id), name: text(genre.name) }))
      .filter((genre): genre is { id: number; name: string } =>
        genre.id !== null && genre.name !== null,
      ),
    countries: asArray(item.production_countries)
      .map(asRecord)
      .map((country) => text(country.name))
      .filter((name): name is string => name !== null),
    director: director ? text(director.name) : null,
    cast: asArray(credits.cast)
      .slice(0, 15)
      .map(asRecord)
      .map((member) => ({
        name: text(member.name),
        character: text(member.character),
        profile: tmdbImage(member.profile_path, "w300"),
      }))
      .filter((member): member is { name: string; character: string | null; profile: string | null } =>
        member.name !== null,
      ),
    trailer: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
    homepage: text(item.homepage),
    imdb_id: text(item.imdb_id) ?? text(asRecord(item.external_ids).imdb_id),
    seasons: asArray(item.seasons)
      .map(mapSeason)
      .filter((season): season is MovieSeasonRef => season !== null)
      .filter((season) => season.season_number > 0),
  };
}
