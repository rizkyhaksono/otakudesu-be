/**
 * OpenAPI description of the public API.
 *
 * The two Elysia services this project absorbed shipped Swagger UI; keeping a
 * machine-readable spec means external consumers did not lose that when the
 * services moved to Next.js route handlers.
 */

type Op = {
  path: string;
  summary: string;
  tag: "Anime" | "Comic" | "Movie" | "Live TV" | "Radio" | "News" | "Search" | "Tools" | "Meta";
  params?: { name: string; in: "path" | "query"; required?: boolean; description: string }[];
};

const OPERATIONS: Op[] = [
  { path: "/api", summary: "Service index", tag: "Meta" },
  { path: "/api/health", summary: "Liveness probe and per-domain configuration status", tag: "Meta" },

  { path: "/api/v1/anime/home", summary: "Ongoing and completed anime from the homepage", tag: "Anime" },
  { path: "/api/v1/anime/list", summary: "A–Z anime directory", tag: "Anime" },
  { path: "/api/v1/anime/genres", summary: "All anime genres", tag: "Anime" },
  {
    path: "/api/v1/anime/genres/{slug}",
    summary: "Anime in a genre",
    tag: "Anime",
    params: [
      { name: "slug", in: "path", required: true, description: "Genre slug, e.g. `action`" },
      { name: "page", in: "query", description: "Page number, defaults to 1" },
    ],
  },
  { path: "/api/v1/anime/schedule", summary: "Weekly release schedule", tag: "Anime" },
  {
    path: "/api/v1/anime/search/{keyword}",
    summary: "Search anime by keyword",
    tag: "Anime",
    params: [{ name: "keyword", in: "path", required: true, description: "URL-encoded search term" }],
  },
  {
    path: "/api/v1/anime/ongoing/{page}",
    summary: "Paginated ongoing anime",
    tag: "Anime",
    params: [{ name: "page", in: "path", required: true, description: "Page number" }],
  },
  {
    path: "/api/v1/anime/complete/{page}",
    summary: "Paginated completed anime",
    tag: "Anime",
    params: [{ name: "page", in: "path", required: true, description: "Page number" }],
  },
  {
    path: "/api/v1/anime/detail/{slug}",
    summary: "Full anime detail, episodes and recommendations",
    tag: "Anime",
    params: [{ name: "slug", in: "path", required: true, description: "Anime slug" }],
  },
  {
    path: "/api/v1/anime/detail/{slug}/episodes",
    summary: "Episode list for an anime",
    tag: "Anime",
    params: [{ name: "slug", in: "path", required: true, description: "Anime slug" }],
  },
  {
    path: "/api/v1/anime/detail/{slug}/episodes/{episode}",
    summary: "One episode, resolved by episode number",
    tag: "Anime",
    params: [
      { name: "slug", in: "path", required: true, description: "Anime slug" },
      { name: "episode", in: "path", required: true, description: "Episode number" },
    ],
  },
  {
    path: "/api/v1/anime/episode/{slug}",
    summary: "One episode, resolved by episode slug",
    tag: "Anime",
    params: [{ name: "slug", in: "path", required: true, description: "Episode slug" }],
  },
  {
    path: "/api/v1/anime/batch/{slug}",
    summary: "Batch download links",
    tag: "Anime",
    params: [{ name: "slug", in: "path", required: true, description: "Batch slug" }],
  },
  {
    path: "/api/v1/anime/movie/{slug}",
    summary: "Anime movie stream and downloads",
    tag: "Anime",
    params: [{ name: "slug", in: "path", required: true, description: "Anime slug" }],
  },

  {
    path: "/api/v1/anime/muse",
    summary: "Official Muse Indonesia playlist matching an anime title, when one exists",
    tag: "Anime",
    params: [{ name: "title", in: "query", required: true, description: "Anime title to match" }],
  },

  { path: "/api/v1/comic/home", summary: "Popular, trending and latest comics and novels", tag: "Comic" },
  {
    path: "/api/v1/comic/{slug}",
    summary: "Comic detail with the full chapter list",
    tag: "Comic",
    params: [{ name: "slug", in: "path", required: true, description: "Comic slug" }],
  },
  {
    path: "/api/v1/comic/{slug}/chapter/{chapter}",
    summary: "Reader payload: ordered page images plus prev/next navigation",
    tag: "Comic",
    params: [
      { name: "slug", in: "path", required: true, description: "Comic slug" },
      { name: "chapter", in: "path", required: true, description: "Chapter *number*, not slug" },
    ],
  },

  { path: "/api/v1/movie/home", summary: "Trending and popular movies and series", tag: "Movie" },
  {
    path: "/api/v1/movie/search",
    summary: "Search movies and series",
    tag: "Movie",
    params: [
      { name: "q", in: "query", required: true, description: "Search term" },
      { name: "page", in: "query", description: "Page number" },
    ],
  },
  { path: "/api/v1/movie/genres", summary: "Movie and TV genres", tag: "Movie" },
  {
    path: "/api/v1/movie/genres/{id}",
    summary: "Discover titles by genre",
    tag: "Movie",
    params: [
      { name: "id", in: "path", required: true, description: "TMDB genre id" },
      { name: "type", in: "query", description: "`movie` (default) or `tv`" },
      { name: "page", in: "query", description: "Page number" },
    ],
  },
  {
    path: "/api/v1/movie/{id}",
    summary: "Movie detail",
    tag: "Movie",
    params: [{ name: "id", in: "path", required: true, description: "TMDB movie id" }],
  },
  {
    path: "/api/v1/movie/{id}/sources",
    summary: "Embed player URLs for a movie",
    tag: "Movie",
    params: [{ name: "id", in: "path", required: true, description: "TMDB movie id" }],
  },
  {
    path: "/api/v1/movie/tv/{id}",
    summary: "Series detail including seasons",
    tag: "Movie",
    params: [{ name: "id", in: "path", required: true, description: "TMDB series id" }],
  },
  {
    path: "/api/v1/movie/tv/{id}/season/{season}",
    summary: "Episodes in a season",
    tag: "Movie",
    params: [
      { name: "id", in: "path", required: true, description: "TMDB series id" },
      { name: "season", in: "path", required: true, description: "Season number" },
    ],
  },
  {
    path: "/api/v1/movie/tv/{id}/sources",
    summary: "Embed player URLs for one episode",
    tag: "Movie",
    params: [
      { name: "id", in: "path", required: true, description: "TMDB series id" },
      { name: "season", in: "query", description: "Season number, defaults to 1" },
      { name: "episode", in: "query", description: "Episode number, defaults to 1" },
    ],
  },

  {
    path: "/api/v1/tv/channels",
    summary: "Indonesian live TV channels with playable streams",
    tag: "Live TV",
    params: [
      { name: "category", in: "query", description: "Filter by category slug" },
      { name: "q", in: "query", description: "Search by channel name" },
    ],
  },
  { path: "/api/v1/tv/categories", summary: "Channel categories with counts", tag: "Live TV" },
  {
    path: "/api/v1/tv/channels/{id}",
    summary: "One channel and its streams",
    tag: "Live TV",
    params: [{ name: "id", in: "path", required: true, description: "Channel id, e.g. `TVRI.id`" }],
  },
  {
    path: "/api/v1/tv/channels/{id}/stream",
    summary: "HLS proxy for channels that cannot be played directly",
    tag: "Live TV",
    params: [
      { name: "id", in: "path", required: true, description: "Channel id" },
      { name: "s", in: "query", description: "Stream index, defaults to 0" },
    ],
  },

  {
    path: "/api/v1/radio/stations",
    summary: "Indonesian radio stations that passed the upstream liveness check",
    tag: "Radio",
    params: [
      { name: "tag", in: "query", description: "Filter by tag slug, e.g. `dangdut`" },
      { name: "q", in: "query", description: "Search by station name" },
    ],
  },
  { path: "/api/v1/radio/tags", summary: "Station tags with counts", tag: "Radio" },
  {
    path: "/api/v1/radio/stations/{id}",
    summary: "One station",
    tag: "Radio",
    params: [{ name: "id", in: "path", required: true, description: "radio-browser station UUID" }],
  },
  {
    path: "/api/v1/radio/stations/{id}/stream",
    summary: "Audio proxy for stations the browser cannot reach directly",
    tag: "Radio",
    params: [{ name: "id", in: "path", required: true, description: "radio-browser station UUID" }],
  },

  {
    path: "/api/v1/news",
    summary: "Latest anime news headlines",
    tag: "News",
    params: [
      { name: "q", in: "query", description: "Only items about this title, e.g. an anime name" },
      { name: "limit", in: "query", description: "Maximum items to return" },
    ],
  },
  {
    path: "/api/v1/news/{id}",
    summary: "One article, parsed into typed blocks",
    tag: "News",
    params: [{ name: "id", in: "path", required: true, description: "Article id from the listing" }],
  },

  {
    path: "/api/v1/comic/shinigami",
    summary: "Shinigami's current domain, resolved live from their own link portal",
    tag: "Comic",
  },

  {
    path: "/api/v1/search",
    summary: "Cross-domain search — anime, comics, movies/TV and radio in one call",
    tag: "Search",
    params: [{ name: "q", in: "query", required: true, description: "Search term" }],
  },

  {
    path: "/api/v1/anime/schedule.ics",
    summary: "Weekly release schedule as a subscribable iCalendar feed",
    tag: "Anime",
  },
  {
    path: "/api/v1/anime/quotes",
    summary: "A random anime quote, or quotes from one title",
    tag: "Tools",
    params: [{ name: "anime", in: "query", description: "Title to find quotes from, e.g. `One Piece`" }],
  },
  {
    path: "/api/v1/anime/identify",
    summary: "Reverse image search — which anime a screenshot is from (GET by URL, POST an upload)",
    tag: "Tools",
    params: [{ name: "url", in: "query", description: "Public image URL (GET only)" }],
  },
  {
    path: "/api/v1/anime/themes",
    summary: "OP/ED theme songs for a title, matched by name, with direct playable audio",
    tag: "Tools",
    params: [{ name: "title", in: "query", required: true, description: "Anime title, e.g. `One Piece`" }],
  },
];

export function operations() {
  return OPERATIONS;
}

export function buildOpenApiDocument(origin: string) {
  const paths: Record<string, unknown> = {};

  for (const operation of OPERATIONS) {
    paths[operation.path] = {
      get: {
        summary: operation.summary,
        tags: [operation.tag],
        parameters: (operation.params ?? []).map((param) => ({
          name: param.name,
          in: param.in,
          required: param.required ?? false,
          description: param.description,
          schema: { type: "string" },
        })),
        responses: {
          200: {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { description: "Endpoint payload" } },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/Error" },
          404: { $ref: "#/components/responses/Error" },
          429: { $ref: "#/components/responses/Error" },
          502: { $ref: "#/components/responses/Error" },
        },
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Otakudesu Community API",
      version: "3.0.0",
      description:
        "Anime, comics, movies and Indonesian live TV in one read-only public API. " +
        "Every successful response is `{ data }`; every failure is `{ error }`. " +
        "Rate limited per IP.",
      license: { name: "MIT", identifier: "MIT" },
    },
    servers: [{ url: origin }],
    paths,
    components: {
      responses: {
        Error: {
          description: "Error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { error: { type: "string" } },
                required: ["error"],
              },
            },
          },
        },
      },
    },
  };
}
