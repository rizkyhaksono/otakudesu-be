import { NotFoundError, UpstreamError } from "@/lib/shared/errors";
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
  const baseUrl = getComicBaseUrl();

  try {
    const html = await fetchHtml(`${baseUrl}/manga/${safeSlug}/chapter/${chapterNumber}`, {
      revalidate: 3600,
    });
    const props = expectComponent(parseInertia(html), "Manga/Read") as Record<string, unknown>;
    return mapChapter(props);
  } catch (error) {
    if (!(error instanceof NotFoundError || error instanceof UpstreamError)) throw error;
  }

  const html = await fetchHtml(`${baseUrl}/novel/${safeSlug}/chapter/${chapterNumber}`, {
    revalidate: 3600,
  });
  const props = expectComponent(parseInertia(html), "Novel/Read") as Record<string, unknown>;
  return mapChapter(props);
};

export default comicChapter;
