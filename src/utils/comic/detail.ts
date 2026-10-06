import { NotFoundError, UpstreamError } from "@/lib/shared/errors";
import { assertSlug, getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapDetail } from "@/lib/comic/mappers";
import type { ComicDetail } from "@/types/comic";

const comicDetail = async (slug: string): Promise<ComicDetail | null> => {
  const safeSlug = assertSlug(slug, "comic slug");
  const baseUrl = getComicBaseUrl();

  try {
    const html = await fetchHtml(`${baseUrl}/manga/${safeSlug}`, { revalidate: 1800 });
    const props = expectComponent(parseInertia(html), "Manga/Show") as Record<string, unknown>;
    return mapDetail(props);
  } catch (error) {
    if (!(error instanceof NotFoundError || error instanceof UpstreamError)) throw error;
  }

  const html = await fetchHtml(`${baseUrl}/novel/${safeSlug}`, { revalidate: 1800 });
  const props = expectComponent(parseInertia(html), ["Novel/Show", "Novel/Detail"]) as Record<
    string,
    unknown
  >;
  return mapDetail(props);
};

export default comicDetail;
