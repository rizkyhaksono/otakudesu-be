/**
 * One normalized shape across every searchable domain, so the client renders
 * a single result list instead of four differently-shaped ones.
 */
export type SearchHit = {
  kind: "anime" | "comic" | "movie" | "tv_series" | "radio";
  title: string;
  href: string;
  poster: string | null;
  meta: string | null;
};

export type SearchResult = {
  query: string;
  total: number;
  hits: SearchHit[];
  /** Per-domain counts, for a tabbed or grouped UI. */
  counts: Record<SearchHit["kind"], number>;
};
