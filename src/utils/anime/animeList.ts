import scrapeAnimeList from "@/lib/anime/scrapeAnimeList";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import type { animeListGroup } from "@/types/anime";

const animeList = async (): Promise<animeListGroup[]> => {
  const html = await fetchHtml(`${getAnimeBaseUrl()}/anime-list`, { revalidate: 86_400 });
  return scrapeAnimeList(html);
};

export default animeList;
