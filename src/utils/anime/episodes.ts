import scrapeAnimeEpisodes from "@/lib/anime/scrapeAnimeEpisodes";
import { assertSlug, getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import type { episode_list } from "@/types/anime";

const episodes = async (slug: string): Promise<episode_list[] | undefined> => {
  const safeSlug = assertSlug(slug);
  const html = await fetchHtml(`${getAnimeBaseUrl()}/anime/${safeSlug}`, { revalidate: 1800 });
  return scrapeAnimeEpisodes(html);
};

export default episodes;
