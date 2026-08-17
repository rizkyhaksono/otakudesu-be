/** One OP/ED track for an anime. */
export type AnimeTheme = {
  id: number;
  /** "OP" or "ED". */
  type: "OP" | "ED";
  sequence: number;
  title: string | null;
  artists: string[];
  /** Direct, playable audio URL — no video, no transcoding needed client-side. */
  audioUrl: string | null;
  /** Episodes this version covers, as the upstream describes them, e.g. "1-25". */
  episodes: string | null;
};

export type AnimeThemeSet = {
  /** The AnimeThemes.moe title actually matched — may differ slightly from ours. */
  matchedTitle: string;
  cover: string | null;
  themes: AnimeTheme[];
};
