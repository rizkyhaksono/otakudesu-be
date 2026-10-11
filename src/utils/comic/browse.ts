import { getComicListUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { parseList } from "@/lib/comic/komiku";
import comicGenres from "./genres";
import type { ComicBrowse } from "@/types/comic";

/**
 * The upstream catalogue, filterable by genre and type and searchable. Komiku
 * serves listings as htmx fragments from a separate host (`api.komiku.org`),
 * ten titles per page, with no total count.
 */
export type BrowseOptions = {
  page?: number;
  genre?: string;
  search?: string;
  /** Manga · Manhwa · Manhua. */
  type?: string;
  sort?: string;
};

const PAGE_SIZE = 10;

// `meta_value_num` is the view counter; the site's own form only offers update order.
const ORDER_BY: Record<string, string> = { latest: "modified", popular: "meta_value_num" };

const comicBrowse = async (options: BrowseOptions = {}): Promise<ComicBrowse> => {
  const page = options.page && options.page > 1 ? options.page : 1;
  const pagePath = page > 1 ? `page/${page}/` : "";

  let url: URL;
  if (options.search) {
    url = new URL(`${getComicListUrl()}/${pagePath}`);
    url.searchParams.set("post_type", "manga");
    url.searchParams.set("s", options.search);
  } else {
    url = new URL(`${getComicListUrl()}/manga/${pagePath}`);
    url.searchParams.set("orderby", ORDER_BY[options.sort ?? "latest"] ?? ORDER_BY.latest);
    if (options.type) url.searchParams.set("tipe", options.type.toLowerCase());
    if (options.genre) url.searchParams.set("genre", options.genre);
  }

  const [html, genres] = await Promise.all([
    fetchHtml(url.toString(), { revalidate: options.search ? 300 : 1800 }),
    comicGenres(),
  ]);
  const { comics, hasNext } = parseList(html, getComicListUrl(), PAGE_SIZE);

  return {
    pagination: {
      current_page: page,
      // No total upstream: expose one page of look-ahead.
      last_page: hasNext ? page + 1 : page,
      per_page: PAGE_SIZE,
      total: (page - 1) * PAGE_SIZE + comics.length,
    },
    genres,
    comics,
  };
};

export default comicBrowse;
