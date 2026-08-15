export type NewsItem = {
  id: string;
  title: string;
  /** Canonical URL at the source, kept for attribution. */
  link: string;
  summary: string | null;
  published_at: string | null;
  category: string | null;
};

/**
 * Article body as typed blocks rather than HTML.
 *
 * Clients render each block with their own markup, so third-party content can
 * never reach the DOM as markup — no `dangerouslySetInnerHTML` in the chain.
 */
export type NewsBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string | null };

export type NewsArticle = NewsItem & {
  /** Standfirst, shown above the body. */
  intro: string | null;
  image: string | null;
  blocks: NewsBlock[];
  source: { name: string; url: string };
};
