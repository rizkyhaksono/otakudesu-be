import { getAniListApiUrl } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";
import { pickTrailer, type AnimeTrailer, type RawMedia } from "@/lib/anime/trailer";

/**
 * Official trailer for a title, from AniList's public GraphQL API.
 *
 * GraphQL is a POST, which http.ts does not cache, so lookups are memoised
 * here for six hours. Only answers are memoised (a trailer or a confirmed
 * "none"); a failed request is retried next time. Any failure is "no
 * trailer", never an error: the trailer is an extra on the homepage hero.
 */

const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: AnimeTrailer | null }>();

const QUERY = `query ($search: String) {
  Page(perPage: 5) {
    media(search: $search, type: ANIME) {
      title { romaji english }
      synonyms
      trailer { id site }
    }
  }
}`;

export async function animeTrailer(title: string): Promise<AnimeTrailer | null> {
  const key = title.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const raw = await fetchJson<{ data?: { Page?: { media?: RawMedia[] } } }>(getAniListApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { search: title } }),
      timeoutMs: 10_000,
    });
    const value = pickTrailer(raw.data?.Page?.media ?? [], title);
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

/** Test seam. */
export function __resetTrailers() {
  cache.clear();
}
