import type { TvStream } from "@/types/tv";

/**
 * Liveness check that follows a stream far enough to know it plays.
 *
 * A master playlist answering 200 proves little: plenty of dead channels keep
 * serving the playlist while every variant or segment behind it is gone. So
 * this walks master -> variant -> first segment, at most two hops past the
 * manifest, and calls the stream alive only when the media itself answers.
 */

const TIMEOUT_MS = 2500;
const MAX_PLAYLIST_HOPS = 2;

/** First URI line of a playlist, resolved against the playlist's own URL. */
export function firstMediaUri(playlist: string, baseUrl: string): string | null {
  for (const raw of playlist.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    try {
      return new URL(line, baseUrl).toString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function probeStream(stream: TvStream, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const headers: Record<string, string> = {
    "User-Agent":
      stream.user_agent ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    Accept: "*/*",
  };
  if (stream.referrer) headers.Referer = stream.referrer;

  const get = (url: string) =>
    fetchImpl(url, { headers, redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });

  try {
    let url = stream.url;
    for (let hop = 0; hop <= MAX_PLAYLIST_HOPS; hop++) {
      const response = await get(url);
      if (!response.ok) {
        await response.body?.cancel();
        return false;
      }

      const type = response.headers.get("content-type") ?? "";
      const looksLikePlaylist = /mpegurl/i.test(type) || /\.m3u8?(\?|$)/i.test(new URL(response.url || url).pathname);
      if (!looksLikePlaylist && hop > 0) {
        await response.body?.cancel();
        return true; // a media segment answered
      }

      const body = await response.text();
      if (!body.includes("#EXTM3U")) return false;

      const next = firstMediaUri(body, response.url || url);
      if (!next) return false;
      url = next;
    }
    // Still a playlist after the hop budget: a third level is not something a
    // player follows either.
    return false;
  } catch {
    return false;
  }
}
