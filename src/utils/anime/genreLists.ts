import scrapeGenreLists from "@/lib/anime/scrapeGenreLists";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import type { genre as genreType } from "@/types/anime";

const genreLists = async (): Promise<genreType[]> => {
  const baseUrl = getAnimeBaseUrl();
  const html = await fetchHtml(`${baseUrl}/genre-list`, { revalidate: 86_400 });
  return scrapeGenreLists(html, baseUrl);
};

export default genreLists;
