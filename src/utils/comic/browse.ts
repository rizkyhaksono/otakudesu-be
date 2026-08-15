import { getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapGenre, mapSummaries } from "@/lib/comic/mappers";
import { num } from "@/lib/shared/sanitize";
import type { ComicBrowse, ComicGenre } from "@/types/comic";

type Raw = Record<string, unknown>;

const asRecord = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});

/**
 * The upstream catalogue: 7,000+ titles across ~300 pages, filterable by genre
 * and searchable. This is what makes the comic section as complete as the anime
 * one, rather than just the handful of cards on its home page.
 */
const comicBrowse = async (options: {
  page?: number;
  genre?: string;
  search?: string;
} = {}): Promise<ComicBrowse> => {
  const url = new URL(`${getComicBaseUrl()}/manga`);
  if (options.page && options.page > 1) url.searchParams.set("page", String(options.page));
  if (options.genre) url.searchParams.set("genre", options.genre);
  if (options.search) url.searchParams.set("search", options.search);

  const html = await fetchHtml(url.toString(), { revalidate: options.search ? 300 : 1800 });
  const props = expectComponent(parseInertia(html), "Manga/Index") as Raw;

  const paginator = asRecord(props.mangas);

  return {
    pagination: {
      current_page: num(paginator.current_page) ?? 1,
      last_page: num(paginator.last_page) ?? 1,
      per_page: num(paginator.per_page) ?? 24,
      total: num(paginator.total) ?? 0,
    },
    genres: uniqueGenres(props.genres),
    comics: mapSummaries(paginator.data),
  };
};

/**
 * The upstream's genre table is mostly SEO keyword spam: ~1,550 rows, of which
 * only 18 are real genres. The real ones are the only entries with an `icon`
 * — everything else is a manga title reused as a tag ("… bahasa Indonesia",
 * "… Sub Indo"). Filtering on the icon is what separates them.
 */
function uniqueGenres(raw: unknown): ComicGenre[] {
  const seen = new Map<string, ComicGenre>();

  for (const entry of Array.isArray(raw) ? raw : []) {
    const genre = mapGenre(entry);
    if (!genre?.icon) continue;
    if (!seen.has(genre.slug)) seen.set(genre.slug, genre);
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export default comicBrowse;
