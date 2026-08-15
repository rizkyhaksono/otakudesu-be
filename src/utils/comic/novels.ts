import { getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapSummaries } from "@/lib/comic/mappers";
import { num } from "@/lib/shared/sanitize";
import type { ComicBrowse } from "@/types/comic";

type Raw = Record<string, unknown>;
const asRecord = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});

/**
 * Novels are a separate model upstream (`/novel`, component `Novel/Index`), not
 * a `type` filter on the manga catalogue — `?type=Novel` returns zero rows.
 */
const comicNovels = async (options: { page?: number; search?: string } = {}): Promise<ComicBrowse> => {
  const url = new URL(`${getComicBaseUrl()}/novel`);
  if (options.page && options.page > 1) url.searchParams.set("page", String(options.page));
  if (options.search) url.searchParams.set("search", options.search);

  const html = await fetchHtml(url.toString(), { revalidate: options.search ? 300 : 1800 });
  const props = expectComponent(parseInertia(html), "Novel/Index") as Raw;

  // The paginator key differs between the two indexes.
  const paginator = asRecord(props.novels ?? props.mangas);

  return {
    pagination: {
      current_page: num(paginator.current_page) ?? 1,
      last_page: num(paginator.last_page) ?? 1,
      per_page: num(paginator.per_page) ?? 24,
      total: num(paginator.total) ?? 0,
    },
    genres: [],
    comics: mapSummaries(paginator.data),
  };
};

export default comicNovels;
