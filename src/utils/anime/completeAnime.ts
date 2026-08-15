import { load } from "cheerio";
import pagination from "@/lib/anime/pagination";
import scrapeCompleteAnime from "@/lib/anime/scrapeCompleteAnime";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";

const completeAnime = async (page: number | string = 1) => {
  const html = await fetchHtml(`${getAnimeBaseUrl()}/complete-anime/page/${page}`, {
    revalidate: 300,
  });
  const $ = load(html);
  const completeAnimeEls = $(".venutama .rseries .rapi .venz ul li").toString();

  return {
    paginationData: pagination($(".pagination").toString()),
    completeAnimeData: scrapeCompleteAnime(completeAnimeEls),
  };
};

export default completeAnime;
