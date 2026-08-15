import { fetchHtml } from "@/lib/shared/http";
import { text } from "@/lib/shared/sanitize";

/**
 * Muse Indonesia as a fallback anime source.
 *
 * Muse is the official licensor that publishes subtitled anime on YouTube, so
 * unlike the scraped mirrors it is legal, stable and never geo-blocks us. There
 * is no website to scrape — `museindonesia.com` no longer resolves — but the
 * channel's playlist page embeds `ytInitialData`, which carries every playlist
 * id and title. No API key needed.
 *
 * Each anime is one playlist, so a match yields a playable embed for the whole
 * series.
 */

const CHANNEL = "https://www.youtube.com/@MuseIndonesia/playlists";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const TTL_MS = 6 * 60 * 60 * 1000;

export type MusePlaylist = {
  id: string;
  title: string;
  /** Title reduced to comparable tokens. */
  tokens: Set<string>;
};

export type MuseMatch = {
  playlist_id: string;
  title: string;
  url: string;
  /** 0–1. Only high-confidence matches are returned. */
  score: number;
};

let cached: { at: number; value: Promise<MusePlaylist[]> } | null = null;

/**
 * Muse localises titles ("Kesatria Tengkorak Berkelana di Dunia Lain") and tags
 * every one with a subtitle marker, so both sides are stripped down to
 * meaningful tokens before comparing.
 */
const NOISE = new Set([
  "takarir",
  "indonesia",
  "bahasa",
  "sub",
  "indo",
  "subtitle",
  "season",
  "the",
  "a",
  "an",
  "of",
  "no",
  "wa",
  "ga",
  "ni",
  "to",
  "de",
  "movie",
  "part",
  "final",
  "tv",
]);

export function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1 && !NOISE.has(word)),
  );
}

function parsePlaylists(html: string): MusePlaylist[] {
  const match = /var ytInitialData = (\{.*?\});<\/script>/s.exec(html);
  if (!match?.[1]) return [];

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const out = new Map<string, MusePlaylist>();

  // YouTube's current shape nests each card in a `lockupViewModel`.
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const lockup = record.lockupViewModel as Record<string, unknown> | undefined;

    if (lockup) {
      const id = text(lockup.contentId);
      const metadata = (lockup.metadata as Record<string, unknown> | undefined)
        ?.lockupMetadataViewModel as Record<string, unknown> | undefined;
      const titleNode = metadata?.title as Record<string, unknown> | undefined;
      const title = text(titleNode?.content);

      if (id && title && !out.has(id)) {
        out.set(id, { id, title, tokens: tokenize(title) });
      }
    }

    for (const value of Object.values(record)) walk(value);
  };

  walk(data);
  return [...out.values()];
}

export function getMuseIndex(): Promise<MusePlaylist[]> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.value;

  const value = fetchHtml(CHANNEL, {
    revalidate: 0,
    timeoutMs: 30_000,
    headers: { "User-Agent": UA, "Accept-Language": "id,en;q=0.8" },
  })
    .then(parsePlaylists)
    .catch(() => {
      cached = null;
      return [] as MusePlaylist[];
    });

  cached = { at: now, value };
  return value;
}

/**
 * Match an anime title to a Muse playlist.
 *
 * Deliberately conservative: a wrong match sends someone to a different show,
 * which is worse than offering no fallback at all. Requires both a high overlap
 * with the candidate and that most of the query's own tokens are covered.
 */
export function matchPlaylist(title: string, playlists: MusePlaylist[]): MuseMatch | null {
  const wanted = tokenize(title);
  if (wanted.size === 0) return null;

  let best: { playlist: MusePlaylist; score: number } | null = null;

  for (const playlist of playlists) {
    if (playlist.tokens.size === 0) continue;

    let shared = 0;
    for (const token of wanted) if (playlist.tokens.has(token)) shared += 1;
    if (shared === 0) continue;

    // Jaccard, plus how much of the query we actually covered.
    const union = new Set([...wanted, ...playlist.tokens]).size;
    const jaccard = shared / union;
    const coverage = shared / wanted.size;
    const score = jaccard * 0.4 + coverage * 0.6;

    if (!best || score > best.score) best = { playlist, score };
  }

  // Both thresholds must hold: a single shared word like "gakuen" is not a match.
  if (!best || best.score < 0.6) return null;

  return {
    playlist_id: best.playlist.id,
    title: best.playlist.title,
    url: `https://www.youtube.com/embed/videoseries?list=${best.playlist.id}`,
    score: Number(best.score.toFixed(3)),
  };
}

/** Test seam. */
export function __resetMuse() {
  cached = null;
}
