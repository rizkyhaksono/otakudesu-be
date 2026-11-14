import { matchScore } from "@/lib/anime/muse";
import { text } from "@/lib/shared/sanitize";

/**
 * Picks an anime's official YouTube trailer out of an AniList media search.
 * Pure: the caller fetches.
 *
 * AniList's search is fuzzy, so a candidate is trusted only when one of its
 * titles scores as a confident match for what was asked (same scorer as the
 * theme-song lookup). The YouTube id is validated here because it ends up in
 * an iframe URL on the frontend.
 */

export type AnimeTrailer = { youtubeId: string; matchedTitle: string };

export type RawMedia = {
  title?: { romaji?: string | null; english?: string | null };
  synonyms?: string[] | null;
  trailer?: { id?: string | null; site?: string | null } | null;
};

const MIN_SCORE = 0.6;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function youtubeId(trailer: RawMedia["trailer"]): string | null {
  const id = trailer?.site === "youtube" ? trailer.id : null;
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function bestScore(query: string, media: RawMedia): number {
  const titles = [media.title?.romaji, media.title?.english, ...(media.synonyms ?? [])];
  return Math.max(0, ...titles.map((title) => (title ? matchScore(query, title) : 0)));
}

export function pickTrailer(media: RawMedia[], query: string): AnimeTrailer | null {
  const ranked = media
    .map((entry) => ({ entry, score: bestScore(query, entry) }))
    .filter((candidate) => candidate.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  // The best-matching title may have no trailer (a recap or mini anime); the
  // next confident match is still the same show far more often than not.
  for (const { entry } of ranked) {
    const id = youtubeId(entry.trailer);
    if (id) {
      return { youtubeId: id, matchedTitle: text(entry.title?.romaji ?? entry.title?.english) ?? query };
    }
  }
  return null;
}
