import { fetchHtml } from "@/lib/shared/http";
import { getNewsFeedUrl } from "@/lib/shared/env";
import { parseFeed } from "@/lib/news/rss";
import { parseArticle } from "@/lib/news/article";
import { matchNews } from "@/lib/news/match";
import { assertPublicUrl } from "@/lib/shared/ssrf";
import { NotFoundError } from "@/lib/shared/errors";
import type { NewsArticle, NewsItem } from "@/types/news";

const SOURCE = { name: "Anime News Network", url: "https://www.animenewsnetwork.com/" };

const INDEX_TTL_MS = 30 * 60 * 1000;

let cached: { at: number; value: Promise<NewsItem[]> } | null = null;

/**
 * The feed doubles as the id -> URL index for article pages.
 *
 * An article is only reachable through a link we published, so resolving the id
 * against this list means the fetcher never takes a URL from the caller — the
 * same rule the stream proxies follow.
 */
function getIndex(): Promise<NewsItem[]> {
  const now = Date.now();
  if (cached && now - cached.at < INDEX_TTL_MS) return cached.value;

  const value = fetchHtml(getNewsFeedUrl(), {
    revalidate: 1800,
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  })
    .then((xml) => parseFeed(xml))
    .catch((error) => {
      cached = null;
      throw error;
    });

  cached = { at: now, value };
  return value;
}

export const news = async (options: { q?: string; limit?: number } = {}): Promise<NewsItem[]> => {
  const items = await getIndex();
  if (options.q) return matchNews(options.q, items, options.limit ?? 6);
  return options.limit ? items.slice(0, options.limit) : items;
};

export const newsArticle = async (id: string): Promise<NewsArticle> => {
  const items = await getIndex();
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new NotFoundError("Article not found");

  const target = await assertPublicUrl(item.link);
  const html = await fetchHtml(target.toString(), { revalidate: 86_400 });

  return { ...item, ...parseArticle(html), source: SOURCE };
};

/** Test seam. */
export function __resetNews() {
  cached = null;
}
