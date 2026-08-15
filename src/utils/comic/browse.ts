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
export type BrowseOptions = {
  page?: number;
  genre?: string;
  search?: string;
  /** Manga · Manhwa · Manhua. Novels live on their own route. */
  type?: string;
  sort?: string;
};

const comicBrowse = async (options: BrowseOptions = {}): Promise<ComicBrowse> => {
  const url = new URL(`${getComicBaseUrl()}/manga`);
  if (options.page && options.page > 1) url.searchParams.set("page", String(options.page));
  if (options.genre) url.searchParams.set("genre", options.genre);
  if (options.search) url.searchParams.set("search", options.search);
  if (options.type) url.searchParams.set("type", options.type);
  if (options.sort) url.searchParams.set("sort", options.sort);

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
 * Separate the curated genre list from the upstream's keyword spam.
 *
 * The genre table holds ~1,550 rows but only ~90 are genres. The rest were
 * inserted in a single bulk import — manga titles reused as tags, including
 * "… Sub Indo" and "… bahasa Indonesia" variants — and they all share one
 * `created_at` date.
 *
 * Detecting that batch beats the obvious heuristics: filtering on the presence
 * of an icon drops real genres (only 18 have one, so Harem, Isekai and School
 * life all disappeared), and filtering on name length keeps junk like
 * "Manager Kim". Finding the dominant creation date is self-adjusting if the
 * upstream ever re-imports.
 */
function uniqueGenres(raw: unknown): ComicGenre[] {
  const entries = (Array.isArray(raw) ? raw : []).map(mapGenre).filter(isPresent);
  if (!entries.length) return [];

  const byDate = new Map<string, number>();
  for (const genre of entries) {
    const day = genre.created_at?.slice(0, 10) ?? "";
    byDate.set(day, (byDate.get(day) ?? 0) + 1);
  }

  const [bulkDay, bulkCount] = [...byDate.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
  // Only treat it as an import when it dominates; otherwise keep everything.
  const isBulk = bulkCount > entries.length / 2;

  const seen = new Map<string, ComicGenre>();
  for (const genre of entries) {
    if (isBulk && genre.created_at?.slice(0, 10) === bulkDay) continue;
    if (/(sub indo|bahasa indonesia)/i.test(genre.name)) continue;
    if (seen.has(genre.slug)) continue;

    // `created_at` is an implementation detail of this filter, not public data.
    seen.set(genre.slug, { name: genre.name, slug: genre.slug, icon: genre.icon });
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

export default comicBrowse;
