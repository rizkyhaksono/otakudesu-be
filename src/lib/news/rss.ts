import { stripHtml, text, url as safeUrl } from "@/lib/shared/sanitize";
import type { NewsItem } from "@/types/news";

/**
 * Anime news from the Anime News Network feed.
 *
 * RSS is parsed with regex rather than an XML library on purpose: the shape is
 * fixed and shallow, and pulling in a parser for six fields would be the only
 * XML dependency in the project. Every field still goes through the shared
 * sanitiser, since this is third-party markup like any other upstream.
 */

const ITEM = /<item>([\s\S]*?)<\/item>/g;

function field(block: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
  if (!match?.[1]) return null;
  return text(match[1].replace("<![CDATA[", "").replace("]]>", ""));
}

/** RSS dates are free-form enough that `new Date` can hand back NaN. */
function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseFeed(xml: string, limit = 60): NewsItem[] {
  const items: NewsItem[] = [];
  ITEM.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = ITEM.exec(xml)) !== null && items.length < limit) {
    const block = match[1]!;
    const title = field(block, "title");
    const link = safeUrl(field(block, "link"));
    if (!title || !link) continue;

    const published = field(block, "pubDate");

    items.push({
      // The upstream guid is stable; fall back to the link.
      id: field(block, "guid") ?? link,
      title,
      link,
      summary: stripHtml(field(block, "description")) || null,
      published_at: toIso(published),
      category: field(block, "category"),
    });
  }

  return items;
}
