import scrapeSingleAnime from "@/lib/anime/scrapeSingleAnime";
import { assertSlug, getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import type { anime as animeType } from "@/types/anime";

const anime = async (slug: string): Promise<animeType | undefined> => {
  const baseUrl = getAnimeBaseUrl();
  const safeSlug = assertSlug(slug);
  const html = await fetchHtml(`${baseUrl}/anime/${safeSlug}`, { revalidate: 1800 });
  return scrapeSingleAnime(html, baseUrl);
};

export default anime;
