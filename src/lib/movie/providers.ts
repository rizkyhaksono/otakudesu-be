import { getEnabledEmbedProviders } from "@/lib/shared/env";

/**
 * Embed player registry.
 *
 * Pure URL construction — no I/O, no scraping. Each provider resolves a TMDB id
 * to a playable iframe URL, which is why this survives the constant domain
 * churn that makes scraping streaming sites unmaintainable.
 *
 * Providers are third-party and coverage differs between them, so the API
 * returns all enabled ones and the UI offers a "Server 1 / 2 / 3" switcher.
 */

export type EmbedProvider = {
  id: string;
  name: string;
  movie: (tmdbId: number) => string;
  tv: (tmdbId: number, season: number, episode: number) => string;
};

const REGISTRY: Record<string, EmbedProvider> = {
  "2embed": {
    id: "2embed",
    name: "2Embed",
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  videasy: {
    id: "videasy",
    name: "Videasy",
    movie: (id) => `https://player.videasy.net/movie/${id}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
  },
  vidsrc: {
    id: "vidsrc",
    name: "VidSrc",
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  // More providers cost nothing here — each is pure URL construction, with no
  // request at resolve time — and every extra one is another fallback when a
  // title is missing from the others.
  vidsrccc: {
    id: "vidsrccc",
    name: "VidSrc.cc",
    movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  vidlink: {
    id: "vidlink",
    name: "VidLink",
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  embedsu: {
    id: "embedsu",
    name: "Embed.su",
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  autoembed: {
    id: "autoembed",
    name: "AutoEmbed",
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
};

/** Hosts the frontend must allow in its CSP `frame-src`. */
export const EMBED_HOSTS = [
  "www.2embed.cc",
  "player.videasy.net",
  "vidsrc.to",
  "vidsrc.cc",
  "vidlink.pro",
  "embed.su",
  "player.autoembed.cc",
];

export function enabledProviders(): EmbedProvider[] {
  return getEnabledEmbedProviders()
    .map((id) => REGISTRY[id])
    .filter((provider): provider is EmbedProvider => Boolean(provider));
}

export type EmbedSource = {
  provider: string;
  name: string;
  url: string;
};

export function movieSources(tmdbId: number): EmbedSource[] {
  return enabledProviders().map((provider) => ({
    provider: provider.id,
    name: provider.name,
    url: provider.movie(tmdbId),
  }));
}

export function tvSources(tmdbId: number, season: number, episode: number): EmbedSource[] {
  return enabledProviders().map((provider) => ({
    provider: provider.id,
    name: provider.name,
    url: provider.tv(tmdbId, season, episode),
  }));
}
