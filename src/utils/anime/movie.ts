import scrapeAnimeEpisodes from "@/lib/anime/scrapeAnimeEpisodes";
import scrapeMovie from "@/lib/anime/scrapeMovie";
import { assertSlug, getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import type { movie as movieType } from "@/types/anime";

const movie = async (slug: string): Promise<movieType | undefined> => {
  const baseUrl = getAnimeBaseUrl();
  const safeSlug = assertSlug(slug);

  const animeHtml = await fetchHtml(`${baseUrl}/anime/${safeSlug}`, { revalidate: 1800 });
  const episodeSlug = scrapeAnimeEpisodes(animeHtml)?.[0]?.slug;
  if (!episodeSlug) return undefined;

  const episodeHtml = await fetchHtml(`${baseUrl}/episode/${episodeSlug}`, { revalidate: 1800 });
  return scrapeMovie(episodeHtml);
};

export default movie;
