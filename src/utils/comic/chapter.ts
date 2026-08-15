import { assertSlug, getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapChapter } from "@/lib/comic/mappers";
import type { ComicChapter } from "@/types/comic";

/**
 * Chapters are addressed by `chapter_number`, not by slug — the upstream
 * answers 404 for `/manga/{slug}/chapter-43` but 200 for
 * `/manga/{slug}/chapter/43`.
 */
const comicChapter = async (
  slug: string,
  chapterNumber: number,
): Promise<ComicChapter | null> => {
  const safeSlug = assertSlug(slug, "comic slug");
  const html = await fetchHtml(
    `${getComicBaseUrl()}/manga/${safeSlug}/chapter/${chapterNumber}`,
    { revalidate: 3600 },
  );
  const props = expectComponent(parseInertia(html), "Manga/Read") as Record<string, unknown>;
  return mapChapter(props);
};

export default comicChapter;
