import { tokenize } from "@/lib/anime/muse";
import type { NewsItem } from "@/types/news";

/**
 * Pick the news items that are actually about a given title.
 *
 * The same scoring problem as the Muse playlist match, and the same answer:
 * coverage of the title's words matters more than overall similarity, because a
 * headline is far longer than a title and Jaccard alone would reject every
 * genuine hit. A title must be essentially fully present in the headline —
 * "Frieren" must not pull in every article that happens to say "anime".
 */
const MIN_COVERAGE = 0.85;

export function matchNews(title: string, items: readonly NewsItem[], limit = 6): NewsItem[] {
  const wanted = tokenize(title);
  // One short word is not enough evidence; it would match half the feed.
  if (wanted.size === 0) return [];

  const scored: { item: NewsItem; score: number }[] = [];

  for (const item of items) {
    const haystack = tokenize(`${item.title} ${item.summary ?? ""}`);
    let hits = 0;
    for (const word of wanted) if (haystack.has(word)) hits++;

    const coverage = hits / wanted.size;
    if (coverage < MIN_COVERAGE) continue;

    scored.push({ item, score: coverage });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(b.item.published_at ?? "") - Date.parse(a.item.published_at ?? ""),
    )
    .slice(0, limit)
    .map((entry) => entry.item);
}
