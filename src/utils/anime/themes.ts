import { getAnimeThemesUrl } from "@/lib/shared/env";
import { fetchJson } from "@/lib/shared/http";
import { text, url as safeUrl } from "@/lib/shared/sanitize";
import { tokenize } from "@/lib/anime/muse";
import type { AnimeTheme, AnimeThemeSet } from "@/types/music";

/**
 * Opening/ending themes from AnimeThemes.moe — an open, unauthenticated
 * database of anime song audio, no scraping involved.
 *
 * Matching is a two-step lookup, the same shape as the Muse Indonesia
 * fallback: `/search` resolves a free-text title to *a* result (their search
 * is fuzzy and can return something plausible-but-wrong for an obscure or
 * misspelled title), then `tokenize()` from the Muse matcher checks that
 * result's name actually overlaps enough with what was asked for before it is
 * trusted. A title that fails that check returns `null`, not a wrong anime's
 * songs.
 */

const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: Promise<AnimeThemeSet | null> }>();

const MIN_COVERAGE = 0.6;

/**
 * Coverage of the query's words in the candidate name, penalized for extra
 * words the candidate has that the query didn't ask for.
 *
 * Coverage alone is not enough: searching "One Piece" also matches "ONE PIECE
 * HEROINES", a one-off special with no theme songs, and coverage treats it as
 * as good a match as the real series because both of the query's words are
 * present. The penalty is what ranks the plain, unqualified title above a
 * spin-off — it is usually what the query actually meant.
 */
function matchScore(query: string, candidate: string): number {
  const wanted = tokenize(query);
  if (wanted.size === 0) return 0;

  const found = tokenize(candidate);
  let hits = 0;
  for (const word of wanted) if (found.has(word)) hits++;

  const coverage = hits / wanted.size;
  const extraWords = Math.max(0, found.size - hits);
  return coverage - extraWords * 0.15;
}

type RawSong = { title?: string; artists?: { name?: string }[] };
type RawAudio = { link?: string };
type RawVideo = { audio?: RawAudio };
type RawEntry = { episodes?: string; videos?: RawVideo[] };
type RawTheme = {
  id?: number;
  type?: string;
  sequence?: number;
  song?: RawSong;
  animethemeentries?: RawEntry[];
};
type RawAnime = {
  id?: number;
  name?: string;
  slug?: string;
  images?: { facet?: string; link?: string }[];
  animethemes?: RawTheme[];
};

function mapTheme(raw: RawTheme): AnimeTheme | null {
  const type = raw.type === "OP" || raw.type === "ED" ? raw.type : null;
  if (!type) return null;

  // The same song sometimes ships several video cuts (TV size, BD, versioned
  // openings); any one of them points at the same audio file, so the first is
  // enough — this is a song list, not a video catalogue.
  const entry = raw.animethemeentries?.[0];
  const audioUrl = safeUrl(entry?.videos?.[0]?.audio?.link);

  return {
    id: raw.id ?? 0,
    type,
    sequence: raw.sequence ?? 1,
    title: text(raw.song?.title),
    artists: (raw.song?.artists ?? []).map((a) => text(a.name)).filter((n): n is string => Boolean(n)),
    audioUrl,
    episodes: text(entry?.episodes),
  };
}

/** Confident candidates, best match first. */
async function search(query: string): Promise<RawAnime[]> {
  const searchUrl = new URL(`${getAnimeThemesUrl()}/search`);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("fields[search]", "anime");
  searchUrl.searchParams.set("limit", "5");

  const raw = await fetchJson<{ search?: { anime?: RawAnime[] } }>(searchUrl.toString(), {
    revalidate: TTL_MS / 1000,
    timeoutMs: 10_000,
  });

  return (raw.search?.anime ?? [])
    .filter((a) => a.slug && matchScore(query, text(a.name) ?? "") >= MIN_COVERAGE)
    .sort((a, b) => matchScore(query, text(b.name) ?? "") - matchScore(query, text(a.name) ?? ""));
}

async function fetchThemeSet(slug: string, fallbackTitle: string): Promise<AnimeThemeSet | null> {
  const detailUrl = new URL(`${getAnimeThemesUrl()}/anime/${slug}`);
  detailUrl.searchParams.set(
    "include",
    "animethemes.animethemeentries.videos.audio,animethemes.song.artists,images",
  );

  const raw = await fetchJson<{ anime?: RawAnime }>(detailUrl.toString(), {
    revalidate: TTL_MS / 1000,
    timeoutMs: 10_000,
  });

  const anime = raw.anime;
  if (!anime) return null;

  const seen = new Set<string>();
  const themes = (anime.animethemes ?? [])
    .map(mapTheme)
    .filter((theme): theme is AnimeTheme => theme !== null && theme.audioUrl !== null)
    // Some songs ship as separate JP/EN-dub theme records; a playlist wants
    // one entry per song, not both versions back to back.
    .filter((theme) => {
      const key = `${theme.type}${theme.sequence}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.type.localeCompare(b.type) || a.sequence - b.sequence);

  if (!themes.length) return null;

  const cover =
    anime.images?.find((i) => i.facet === "Large Cover")?.link ??
    anime.images?.find((i) => i.facet === "Small Cover")?.link ??
    null;

  return { matchedTitle: text(anime.name) ?? fallbackTitle, cover: safeUrl(cover), themes };
}

async function buildThemeSet(title: string): Promise<AnimeThemeSet | null> {
  const candidates = await search(title);

  // The best-scoring name is not always the one with songs attached — a
  // special or a movie can outrank the TV series in the search results and
  // have no theme songs at all. Fall through to the next candidate instead
  // of reporting "no themes" when a better answer is one slug away.
  for (const candidate of candidates) {
    if (!candidate.slug) continue;
    const themeSet = await fetchThemeSet(candidate.slug, title);
    if (themeSet) return themeSet;
  }

  return null;
}

export function animeThemes(title: string): Promise<AnimeThemeSet | null> {
  const key = title.trim().toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < TTL_MS) return cached.value;

  const value = buildThemeSet(title).catch(() => null);
  cache.set(key, { at: now, value });
  return value;
}

/** Test seam. */
export function __resetThemes() {
  cache.clear();
}
