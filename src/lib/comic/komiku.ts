import { load, type Cheerio, type CheerioAPI } from "cheerio";
// Type-only: cheerio's own declarations are built on domhandler's node types.
import type { AnyNode } from "domhandler";
import { num, text, url } from "@/lib/shared/sanitize";
import type {
  ComicChapter,
  ComicChapterRef,
  ComicDetail,
  ComicGenre,
  ComicHome,
  ComicSummary,
} from "@/types/comic";

/**
 * Pure parsers for Komiku (komiku.org). HTML in, API shape out — no fetch, no
 * env. Every function takes `baseUrl` so relative links resolve against the
 * configured origin and the fixtures in `tests/fixtures` stay meaningful.
 *
 * Komiku is a WordPress theme. Its own listing pages (`/pustaka/`, search) are
 * shells that pull bare HTML fragments from `api.komiku.org` over htmx; the
 * fragment parser below reads those directly.
 */

const TYPES = ["Manga", "Manhwa", "Manhua"] as const;
const FLAG_TYPES: Record<string, string> = { jp: "Manga", kr: "Manhwa", cn: "Manhua" };

/** Resolve a possibly relative href and run it through the URL allowlist. */
function absolute(href: string | undefined, baseUrl: string): string | null {
  if (!href) return null;
  try {
    return url(new URL(href, `${baseUrl}/`).toString());
  } catch {
    return null;
  }
}

/** `/manga/<slug>/` → `<slug>`. */
export function mangaSlug(href: string | undefined): string | null {
  const match = href?.match(/\/manga\/([a-zA-Z0-9][a-zA-Z0-9_-]*)\/?/);
  return match?.[1] ?? null;
}

/** `/black-clover-chapter-392/` → `black-clover-chapter-392`. */
function chapterSlug(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const segment = new URL(href, "https://x/").pathname.split("/").filter(Boolean).pop();
    return segment && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(segment) ? segment : null;
  } catch {
    return null;
  }
}

/**
 * "Chapter 79.2" and "Chapter 01.1" carry the number in the label. When the
 * label has none ("Oneshot"), the slug suffix `-chapter-79-2` still might.
 */
export function chapterNumber(label: string | null, slug: string | null): number | null {
  const fromLabel = label?.match(/chapter\s*(\d+(?:\.\d+)?)/i)?.[1];
  if (fromLabel) return Number.parseFloat(fromLabel);
  const fromSlug = slug?.match(/-chapter-(\d+)(?:-(\d+))?$/i);
  if (fromSlug) return Number.parseFloat(fromSlug[2] ? `${fromSlug[1]}.${fromSlug[2]}` : fromSlug[1]);
  return null;
}

/** `01/05/2026` (DD/MM/YYYY) → `2026-05-01`. */
function isoDate(value: string | null): string | null {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function chapterRef(anchor: Cheerio<AnyNode>, released_at: string | null = null): ComicChapterRef | null {
  if (!anchor.length) return null;
  const slug = chapterSlug(anchor.attr("href"));
  // The list fragments prefix the label with "Awal: " / "Terbaru: ".
  const title = text(anchor.find("span").last().text() || anchor.text());
  const chapter_number = chapterNumber(title, slug);
  if (chapter_number === null && !slug) return null;
  return { title, slug, chapter_number, released_at };
}

/** Komiku has no explicit type on ranking cards; the flag icon or cover filename carries it. */
function typeFrom(...hints: (string | undefined)[]): string | null {
  for (const hint of hints) {
    if (!hint) continue;
    const flag = hint.match(/\/(jp|kr|cn)\.png/)?.[1];
    if (flag) return FLAG_TYPES[flag];
    const named = TYPES.find((type) => new RegExp(`[-_/ ]${type}[-_ ]`, "i").test(hint));
    if (named) return named;
  }
  return null;
}

function summary(fields: Partial<ComicSummary> & { title: string | null; slug: string | null }): ComicSummary | null {
  if (!fields.title || !fields.slug) return null;
  return {
    poster: null,
    type: null,
    status: null,
    rating: null,
    release_year: null,
    views_count: null,
    synopsis: null,
    genres: [],
    latest_chapter: null,
    ...fields,
  };
}

/** `article.ls2`: latest updates, new titles and per-genre rails on the home page. */
function parseLs2($: CheerioAPI, el: AnyNode, baseUrl: string): ComicSummary | null {
  const item = $(el);
  const link = item.find(".ls2j h3 a");
  const cover = item.find(".ls2v img.lazy");
  return summary({
    title: text(link.text()),
    slug: mangaSlug(link.attr("href")),
    poster: absolute(cover.attr("data-src") ?? cover.attr("src"), baseUrl),
    type:
      text(item.attr("data-tipe")) ??
      typeFrom(item.find(".ls2v img.flag").attr("src"), cover.attr("alt")),
    latest_chapter: chapterRef(item.find("a.ls2l")),
  });
}

/** `article.ls4`: the daily / weekly ranking. */
function parseLs4($: CheerioAPI, el: AnyNode, baseUrl: string): ComicSummary | null {
  const item = $(el);
  const link = item.find(".ls4j h4 a");
  const cover = item.find(".ls4v img");
  const coverUrl = cover.attr("data-src") ?? cover.attr("src");
  // "Aksi · 59,227 views"
  const views = item.find("span.ls4s").text().split("·")[1];
  return summary({
    title: text(link.text()),
    slug: mangaSlug(link.attr("href")),
    poster: absolute(coverUrl, baseUrl),
    type: typeFrom(coverUrl),
    views_count: views ? num(views.replace(/,/g, "")) : null,
    latest_chapter: chapterRef(item.find("a.ls24")),
  });
}

export function parseHome(html: string, baseUrl: string): ComicHome {
  const $ = load(html);
  const pick = (selector: string, parse: typeof parseLs2) =>
    $(selector)
      .toArray()
      .map((el) => parse($, el, baseUrl))
      .filter(isPresent);

  return {
    popular_manga: pick("#rank-mingguan article.ls4", parseLs4),
    trending_manga: pick("#rank-harian article.ls4", parseLs4),
    latest_manga: pick("section#Terbaru article.ls2", parseLs2),
    // Komiku carries no novels.
    popular_novels: [],
    latest_novels: [],
  };
}

export type ComicListPage = { comics: ComicSummary[]; hasNext: boolean };

/**
 * `div.bge` fragments from `api.komiku.org` — the catalogue, genre pages and
 * search all share this markup. The catalogue ends with an htmx "load more"
 * span when another page exists; search has none, so a full page stands in.
 */
export function parseList(html: string, baseUrl: string, pageSize = 10): ComicListPage {
  const $ = load(html);
  const comics = $("div.bge")
    .toArray()
    .map((el) => {
      const item = $(el);
      const link = item.find(".bgei a").first();
      const chapters = item.find(".kan .new1 a");
      const synopsis = text(item.find(".kan p").first().text());
      return summary({
        title: text(item.find(".kan h3").first().text()),
        slug: mangaSlug(link.attr("href")),
        poster: absolute(item.find(".bgei img").first().attr("src"), baseUrl),
        type: text(item.find(".tpe1_inf b").first().text()),
        // Search results put "Update 1 tahun lalu." where the synopsis goes.
        synopsis: synopsis && !/^update\b/i.test(synopsis) ? synopsis : null,
        latest_chapter: chapterRef(chapters.last()),
      });
    })
    .filter(isPresent);

  const loadMore = $('[hx-trigger="revealed"][hx-get]').length > 0;
  return { comics, hasNext: loadMore || comics.length >= pageSize };
}

/** The genre `<select>` on the home page: `Action (4.146)` → `Action`. */
export function parseGenres(html: string): ComicGenre[] {
  const $ = load(html);
  const seen = new Map<string, ComicGenre>();
  $('select[name="genre"] option').each((_, el) => {
    const slug = text($(el).attr("value"));
    const name = text($(el).text().replace(/\s*\([\d.,]+\)\s*$/, ""));
    if (!slug || !name || seen.has(slug) || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) return;
    seen.set(slug, { name, slug, icon: null });
  });
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/** Rows of the first `table.inftable`, keyed by label without the colon. */
function infoTable($: CheerioAPI): Map<string, Cheerio<AnyNode>> {
  const rows = new Map<string, Cheerio<AnyNode>>();
  $("table.inftable")
    .first()
    .find("tr")
    .each((_, tr) => {
      const cells = $(tr).find("td");
      const key = cells.first().text().replace(/:\s*$/, "").trim().toLowerCase();
      if (key) rows.set(key, cells.eq(1));
    });
  return rows;
}

export function parseDetail(html: string, baseUrl: string, slug: string): ComicDetail | null {
  const $ = load(html);
  const info = infoTable($);
  const title = text($("#Judul h1 span[itemprop=name]").first().text()) ?? text(info.get("judul")?.text());
  if (!title) return null;

  const genres = (info.get("genre")?.find("a").toArray() ?? [])
    .map((a) => {
      const genreSlug = $(a).attr("href")?.match(/\/genre\/([^/]+)/)?.[1] ?? null;
      const name = text($(a).text());
      return genreSlug && name ? { name, slug: genreSlug, icon: null } : null;
    })
    .filter(isPresent);

  const chapters = $("#daftarChapter tr[itemprop=itemListElement]")
    .toArray()
    .map((tr) =>
      chapterRef(
        $(tr).find("td.judulseries a").first(),
        isoDate(text($(tr).find("td.tanggalseries").text())),
      ),
    )
    .filter(isPresent);
  // Upstream order is newest-first; keep it, but make it deterministic.
  chapters.sort((a, b) => (b.chapter_number ?? 0) - (a.chapter_number ?? 0));

  return {
    title,
    slug,
    poster: absolute($("#Informasi .ims img").first().attr("src"), baseUrl),
    type: text(info.get("tipe")?.text()),
    status: text(info.get("status")?.text()),
    // "Rating" on Komiku is an age rating ("13+"), not a score.
    rating: null,
    release_year: null,
    views_count: null,
    synopsis: text($("p.desc").first().text()),
    genres,
    latest_chapter: chapters[0] ?? null,
    author: text(info.get("author")?.text()),
    artist: null,
    rank: null,
    total_raters: null,
    chapters,
    first_chapter: chapters.at(-1) ?? null,
    related: [],
  };
}

/**
 * The reader page. Only `img.klazy` are pages — the first, class-less image is
 * a site promo. `prev` / `next` come from the caller, which already holds the
 * full chapter list from the detail page.
 */
export function parseChapterImages(html: string, baseUrl: string): { title: string | null; images: string[] } {
  const $ = load(html);
  const images = $("#Baca_Komik img.klazy")
    .toArray()
    .map((el, index) => ({
      src: absolute($(el).attr("src") ?? $(el).attr("data-src"), baseUrl),
      order: num($(el).attr("id")) ?? index,
    }))
    .filter((image): image is { src: string; order: number } => image.src !== null)
    .sort((a, b) => a.order - b.order)
    .map((image) => image.src);

  return { title: text($("#Judul h1").first().text()), images };
}

/** Assemble the reader payload from the detail page and the chapter's own page. */
export function buildChapter(
  detail: ComicDetail,
  ref: ComicChapterRef,
  page: { title: string | null; images: string[] },
): ComicChapter | null {
  if (!page.images.length) return null;
  const index = detail.chapters.indexOf(ref);
  return {
    comic: { title: detail.title, slug: detail.slug, poster: detail.poster },
    title: page.title ?? ref.title,
    slug: ref.slug,
    chapter_number: ref.chapter_number,
    released_at: ref.released_at,
    images: page.images,
    // Chapters are newest-first, so the older chapter sits after this one.
    prev: detail.chapters[index + 1] ?? null,
    next: index > 0 ? detail.chapters[index - 1] : null,
    chapters: detail.chapters,
  };
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
