import { getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { parseGenres } from "@/lib/comic/komiku";
import type { ComicGenre } from "@/types/comic";

/** Komiku has no genre index; the filter `<select>` on its home page is the full list. */
const comicGenres = async (): Promise<ComicGenre[]> => {
  const html = await fetchHtml(`${getComicBaseUrl()}/`, { revalidate: 86400 });
  return parseGenres(html);
};

export default comicGenres;
