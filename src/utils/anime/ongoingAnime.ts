import { load } from "cheerio";
import pagination from "@/lib/anime/pagination";
import scrapeOngoingAnime from "@/lib/anime/scrapeOngoingAnime";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";

const ongoingAnime = async (page: number | string = 1) => {
  const html = await fetchHtml(`${getAnimeBaseUrl()}/ongoing-anime/page/${page}`, {
    revalidate: 300,
  });
  const $ = load(html);
  const ongoingAnimeEls = $(".venutama .rseries .rapi .venz ul li").toString();

  return {
    paginationData: pagination($(".pagination").toString()),
    ongoingAnimeData: scrapeOngoingAnime(ongoingAnimeEls),
  };
};

export default ongoingAnime;
