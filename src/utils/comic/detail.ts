import { assertSlug, getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { expectComponent, parseInertia } from "@/lib/comic/inertia";
import { mapDetail } from "@/lib/comic/mappers";
import type { ComicDetail } from "@/types/comic";

const comicDetail = async (slug: string): Promise<ComicDetail | null> => {
  const safeSlug = assertSlug(slug, "comic slug");
  const html = await fetchHtml(`${getComicBaseUrl()}/manga/${safeSlug}`, { revalidate: 1800 });
  const props = expectComponent(parseInertia(html), "Manga/Show") as Record<string, unknown>;
  return mapDetail(props);
};

export default comicDetail;
