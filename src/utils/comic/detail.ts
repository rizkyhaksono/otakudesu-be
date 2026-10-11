import { NotFoundError } from "@/lib/shared/errors";
import { assertSlug, getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { parseDetail } from "@/lib/comic/komiku";
import type { ComicDetail } from "@/types/comic";

const comicDetail = async (slug: string): Promise<ComicDetail> => {
  const safeSlug = assertSlug(slug, "comic slug");
  const baseUrl = getComicBaseUrl();

  const html = await fetchHtml(`${baseUrl}/manga/${safeSlug}/`, { revalidate: 1800 });
  const detail = parseDetail(html, baseUrl, safeSlug);
  // Komiku can answer 200 with a generic page for an unknown slug.
  if (!detail) throw new NotFoundError("Comic not found");
  return detail;
};

export default comicDetail;
