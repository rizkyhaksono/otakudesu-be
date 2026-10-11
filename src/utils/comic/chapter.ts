import { NotFoundError } from "@/lib/shared/errors";
import { getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { buildChapter, parseChapterImages } from "@/lib/comic/komiku";
import comicDetail from "./detail";
import type { ComicChapter } from "@/types/comic";

/**
 * The public API addresses chapters by `chapter_number`, but Komiku addresses
 * them by slug (`/black-clover-chapter-392/`), and slugs are not derivable from
 * the number (`…-chapter-01-1`, `…-chapter-79-2`). Resolve the number against
 * the detail page's chapter list — already cached — then fetch the reader.
 */
const comicChapter = async (slug: string, chapterNumber: number): Promise<ComicChapter | null> => {
  const detail = await comicDetail(slug);
  const ref = detail.chapters.find((chapter) => chapter.chapter_number === chapterNumber);
  if (!ref?.slug) throw new NotFoundError("Chapter not found");

  const baseUrl = getComicBaseUrl();
  const html = await fetchHtml(`${baseUrl}/${ref.slug}/`, { revalidate: 3600 });
  return buildChapter(detail, ref, parseChapterImages(html, baseUrl));
};

export default comicChapter;
