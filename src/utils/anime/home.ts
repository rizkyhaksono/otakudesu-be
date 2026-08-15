import { load } from "cheerio";
import scrapeOngoingAnime from "@/lib/anime/scrapeOngoingAnime";
import scrapeCompleteAnime from "@/lib/anime/scrapeCompleteAnime";
import { getAnimeBaseUrl } from "@/lib/shared/env";
import { fetchHtml } from "@/lib/shared/http";
import type {
  ongoingAnime as ongoingAnimeType,
  completeAnime as completeAnimeType,
} from "@/types/anime";

const home = async (): Promise<{
  ongoing_anime: ongoingAnimeType[];
  complete_anime: completeAnimeType[];
}> => {
  const html = await fetchHtml(`${getAnimeBaseUrl()}/`, { revalidate: 300 });
  const $ = load(html);

  return {
    ongoing_anime: scrapeOngoingAnime($(".venutama .rseries .rapi:first .venz ul li").toString()),
    complete_anime: scrapeCompleteAnime($(".venutama .rseries .rapi:last .venz ul li").toString()),
  };
};

export default home;
