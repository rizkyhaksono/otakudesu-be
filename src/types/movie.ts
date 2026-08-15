export type MovieGenre = { id: number; name: string };

export type MediaType = "movie" | "tv";

export type MovieSummary = {
  id: number;
  media_type: MediaType;
  title: string | null;
  original_title: string | null;
  poster: string | null;
  backdrop: string | null;
  overview: string | null;
  release_date: string | null;
  release_year: number | null;
  rating: number | null;
  vote_count: number | null;
  genre_ids: number[];
};

export type MovieSeasonRef = {
  season_number: number;
  name: string | null;
  episode_count: number | null;
  air_date: string | null;
  poster: string | null;
};

export type MovieEpisode = {
  episode_number: number;
  name: string | null;
  overview: string | null;
  air_date: string | null;
  still: string | null;
  runtime: number | null;
};

export type MovieDetail = MovieSummary & {
  tagline: string | null;
  status: string | null;
  runtime: number | null;
  genres: MovieGenre[];
  countries: string[];
  director: string | null;
  cast: { name: string; character: string | null; profile: string | null }[];
  trailer: string | null;
  homepage: string | null;
  imdb_id: string | null;
  seasons: MovieSeasonRef[];
};

export type MovieHome = {
  trending: MovieSummary[];
  popular_movies: MovieSummary[];
  popular_tv: MovieSummary[];
};
