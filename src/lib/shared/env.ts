import { ConfigError, ValidationError } from "@/lib/shared/errors";

const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/** Read an env var that must be an absolute http(s) URL. Trailing slash stripped. */
function readUrl(names: string[], label: string, fallback?: string): string {
  let raw: string | undefined;
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      raw = value;
      break;
    }
  }

  const value = raw ?? fallback;

  if (!value) {
    throw new ConfigError(
      `${names[0]} is required. Set it in .env or the container environment (${label}).`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConfigError(`${names[0]} must be a valid absolute URL (e.g. https://example.com/).`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigError(`${names[0]} must use http or https.`);
  }

  return value.replace(/\/+$/, "");
}

/** Upstream Otakudesu origin. `BASEURL` is kept as a legacy alias. */
export function getAnimeBaseUrl(): string {
  return readUrl(["ANIME_BASE_URL", "BASEURL"], "anime source");
}

/** Upstream comic origin (Laravel + Inertia). */
export function getComicBaseUrl(): string {
  return readUrl(["COMIC_BASE_URL"], "comic source", "https://kiryuuid.net");
}

/** iptv-org API root serving channels.json / streams.json / logos.json. */
export function getIptvApiUrl(): string {
  return readUrl(["IPTV_API_URL"], "live TV index", "https://iptv-org.github.io/api");
}

/** radio-browser API mirror. */
export function getRadioApiUrl(): string {
  return readUrl(["RADIO_API_URL"], "radio index", "https://de1.api.radio-browser.info");
}

/** RSS feed for the news section. */
export function getNewsFeedUrl(): string {
  return readUrl(
    ["NEWS_FEED_URL"],
    "news feed",
    "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=w",
  );
}

/** ISO 3166-1 alpha-2 country used to filter the live TV index. */
export function getTvCountry(): string {
  return (process.env.TV_COUNTRY?.trim() || "ID").toUpperCase();
}

/**
 * TMDB v4 read access token. Optional by design: when it is missing the movie
 * endpoints return empty results instead of crashing the whole API.
 */
export function getTmdbToken(): string | null {
  return process.env.TMDB_ACCESS_TOKEN?.trim() || null;
}

export function getTmdbApiUrl(): string {
  return readUrl(["TMDB_API_URL"], "TMDB API", "https://api.themoviedb.org/3");
}

export function getTmdbLanguage(): string {
  return process.env.TMDB_LANGUAGE?.trim() || "id-ID";
}

/** Optional third-party MovieBox adapter. Disabled when unset. */
export function getMovieBoxApiUrl(): string | null {
  const value = process.env.MOVIEBOX_API_URL?.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return value.replace(/\/+$/, "");
}

/** Ordered list of enabled embed providers. */
export function getEnabledEmbedProviders(): string[] {
  const raw = process.env.MOVIE_EMBED_PROVIDERS?.trim();
  if (!raw) return ["2embed", "videasy", "vidsrc", "vidsrccc", "vidlink", "embedsu", "autoembed"];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Reject anything that could escape the upstream path (traversal, absolute
 * paths, encoded separators). Shared by every slug-taking endpoint.
 */
export function assertSlug(value: string, label = "slug"): string {
  const slug = value.trim();
  if (!slug || slug.includes("..") || slug.includes("/") || !SLUG_PATTERN.test(slug)) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return slug;
}
