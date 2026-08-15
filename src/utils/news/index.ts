import { fetchHtml } from "@/lib/shared/http";
import { getNewsFeedUrl } from "@/lib/shared/env";
import { parseFeed } from "@/lib/news/rss";
import type { NewsItem } from "@/types/news";

export const news = async (): Promise<NewsItem[]> => {
  const xml = await fetchHtml(getNewsFeedUrl(), {
    revalidate: 1800,
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  return parseFeed(xml);
};
