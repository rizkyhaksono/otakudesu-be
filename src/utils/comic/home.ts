import { getComicBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import { parseHome } from "@/lib/comic/komiku";
import type { ComicHome } from "@/types/comic";

const comicHome = async (): Promise<ComicHome> => {
  const baseUrl = getComicBaseUrl();
  const html = await fetchHtml(`${baseUrl}/`, { revalidate: 300 });
  return parseHome(html, baseUrl);
};

export default comicHome;
