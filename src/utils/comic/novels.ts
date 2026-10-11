import type { ComicBrowse } from "@/types/comic";

/**
 * Komiku carries no novels. The route stays so existing clients get an empty
 * list rather than a 404.
 */
const comicNovels = async (_options: { page?: number; search?: string } = {}): Promise<ComicBrowse> => ({
  pagination: { current_page: 1, last_page: 1, per_page: 0, total: 0 },
  genres: [],
  comics: [],
});

export default comicNovels;
