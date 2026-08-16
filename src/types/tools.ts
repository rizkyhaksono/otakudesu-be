// ── AnimeChan quotes ────────────────────────────────────────────────────────

export type AnimeQuote = {
  content: string;
  anime: string;
  character: string;
};

// ── trace.moe reverse image search ─────────────────────────────────────────

export type SceneMatch = {
  /** 0–1, how confident the match is. */
  similarity: number;
  anilistId: number | null;
  title: string;
  titleNative: string | null;
  episode: string | null;
  /** Seconds into the episode. */
  from: number;
  to: number;
  /** A short preview clip trace.moe generates on the fly. */
  preview: string | null;
  image: string | null;
};

export type SceneSearchResult = {
  matches: SceneMatch[];
  quotaRemaining: number | null;
};
