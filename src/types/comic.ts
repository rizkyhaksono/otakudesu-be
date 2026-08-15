export type ComicGenre = {
  name: string;
  slug: string;
  icon: string | null;
};

export type ComicChapterRef = {
  title: string | null;
  slug: string | null;
  chapter_number: number | null;
  released_at: string | null;
};

/** Card shape used by every listing on the comic home page. */
export type ComicSummary = {
  title: string | null;
  slug: string | null;
  poster: string | null;
  type: string | null;
  status: string | null;
  rating: number | null;
  release_year: number | null;
  views_count: number | null;
  synopsis: string | null;
  genres: ComicGenre[];
  latest_chapter: ComicChapterRef | null;
};

export type ComicHome = {
  popular_manga: ComicSummary[];
  trending_manga: ComicSummary[];
  latest_manga: ComicSummary[];
  popular_novels: ComicSummary[];
  latest_novels: ComicSummary[];
};

export type ComicDetail = ComicSummary & {
  author: string | null;
  artist: string | null;
  rank: number | null;
  total_raters: number | null;
  chapters: ComicChapterRef[];
  first_chapter: ComicChapterRef | null;
  related: ComicSummary[];
};

export type ComicChapter = {
  comic: {
    title: string | null;
    slug: string | null;
    poster: string | null;
  };
  title: string | null;
  slug: string | null;
  chapter_number: number | null;
  released_at: string | null;
  /** Page images, ordered. This is the reader payload. */
  images: string[];
  prev: ComicChapterRef | null;
  next: ComicChapterRef | null;
  chapters: ComicChapterRef[];
};
