import { getTmdbApiUrl, getTmdbLanguage, getTmdbToken } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbImage(path: unknown, size: "w300" | "w500" | "w780" | "w1280" | "original") {
  if (typeof path !== "string" || !path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path.startsWith("/") ? path : `/${path}`}`;
}

/** TMDB is optional: without a token the movie domain degrades to empty results. */
export function isTmdbConfigured(): boolean {
  return getTmdbToken() !== null;
}

export async function tmdb<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate = 3600,
): Promise<T | null> {
  const token = getTmdbToken();
  if (!token) return null;

  const url = new URL(`${getTmdbApiUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("language", getTmdbLanguage());
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  return fetchJson<T>(url.toString(), {
    revalidate,
    headers: { Authorization: `Bearer ${token}` },
  });
}
