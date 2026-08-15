import scrapeAnimeByGenre from "@/lib/anime/scrapeAnimeByGenre";
import { assertSlug, getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";

const animeByGenre = async (genre: string, page: number | string = 1) => {
  const baseUrl = getAnimeBaseUrl();
  const safeGenre = assertSlug(genre, "genre");
  const html = await fetchHtml(`${baseUrl}/genres/${safeGenre}/page/${page}`, {
    revalidate: 1800,
  });
  return scrapeAnimeByGenre(html, baseUrl);
};

export default animeByGenre;
