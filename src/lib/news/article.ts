import { decodeEntities, stripHtml, text, url as safeUrl } from "@/lib/shared/sanitize";
import type { NewsArticle, NewsBlock } from "@/types/news";

/**
 * Article body parser for Anime News Network.
 *
 * The output is a list of typed blocks — paragraphs, headings, quotes, images —
 * not HTML. That is deliberate: the client renders each block with its own JSX,
 * so there is no `dangerouslySetInnerHTML` anywhere in the chain and no way for
 * markup from a third-party page to reach the DOM as markup.
 *
 * The page structure is stable: `div.intro` holds the standfirst and `div.meat`
 * the body. Everything outside those two is chrome (ads, audio player, related
 * links) and is dropped.
 */

/** Grab a `<div class="x">…</div>` including nested divs. */
function extractDiv(html: string, className: string): string | null {
  const open = new RegExp(`<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, "i");
  const match = open.exec(html);
  if (!match) return null;

  let depth = 1;
  let index = match.index + match[0].length;
  const start = index;
  const tag = /<\/?div\b[^>]*>/gi;
  tag.lastIndex = index;

  let token: RegExpExecArray | null;
  while ((token = tag.exec(html)) !== null) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(start, token.index);
    index = tag.lastIndex;
  }

  return html.slice(start);
}

const BLOCK = /<(p|h2|h3|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const IMG = /<img\b[^>]*>/gi;

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`${name}="([^"]*)"`, "i").exec(tag);
  return match?.[1] ? decodeEntities(match[1]) : null;
}

function parseBlocks(html: string): NewsBlock[] {
  const blocks: NewsBlock[] = [];

  // Images are pulled first so their position in the source is known, then the
  // two lists are merged by offset — the body interleaves them with prose.
  const positioned: { at: number; block: NewsBlock }[] = [];

  IMG.lastIndex = 0;
  let image: RegExpExecArray | null;
  while ((image = IMG.exec(html)) !== null) {
    const src = safeUrl(attribute(image[0], "src"));
    if (!src) continue;
    // ANN serves thumbnails and spacers from the same host; skip the tiny ones.
    const width = Number(attribute(image[0], "width") ?? 0);
    if (width && width < 200) continue;
    positioned.push({
      at: image.index,
      block: { type: "image", src, alt: text(attribute(image[0], "alt")) },
    });
  }

  BLOCK.lastIndex = 0;
  let node: RegExpExecArray | null;
  while ((node = BLOCK.exec(html)) !== null) {
    const body = stripHtml(node[2]);
    if (!body) continue;

    const tag = node[1]!.toLowerCase();
    positioned.push({
      at: node.index,
      block:
        tag === "blockquote"
          ? { type: "quote", text: body }
          : tag === "p"
            ? { type: "paragraph", text: body }
            : { type: "heading", text: body },
    });
  }

  positioned.sort((a, b) => a.at - b.at);
  for (const entry of positioned) blocks.push(entry.block);

  return blocks;
}

export function parseArticle(html: string): Pick<NewsArticle, "intro" | "blocks" | "image"> {
  const kona = extractDiv(html, "KonaBody") ?? html;

  const intro = stripHtml(extractDiv(kona, "intro") ?? "") || null;
  const meat = extractDiv(kona, "meat");

  const ogImage = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i.exec(html);

  return {
    intro,
    blocks: meat ? parseBlocks(meat) : [],
    image: safeUrl(ogImage?.[1] ? decodeEntities(ogImage[1]) : null),
  };
}
