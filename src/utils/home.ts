import axios from 'axios';
import { load } from 'cheerio';
import scrapeOngoingAnime from '@/lib/scapeOngoingAnime';
import scrapeCompleteAnime from '@/lib/scrapeCompleteAnime';
import { ongoingAnime as ongoingAnimeType, completeAnime as completeAnimeType } from '@/types/types';

const { BASEURL } = process.env;
const home = async (): Promise<{ ongoing_anime: ongoingAnimeType[], complete_anime: completeAnimeType[] }> => {
  const { data } = await axios.get(BASEURL as string, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      "Origin": ["https://otakudesu.natee.my.id", "https://otakudesu.cloud"],
    }
  });
  const $ = load(data);
  const ongoingAnimeEls = $('.venutama .rseries .rapi:first .venz ul li').toString();
  const completeAnimeEls = $('.venutama .rseries .rapi:last .venz ul li').toString();
  const ongoing_anime = scrapeOngoingAnime(ongoingAnimeEls);
  const complete_anime = scrapeCompleteAnime(completeAnimeEls);

  return {
    ongoing_anime,
    complete_anime
  };
};

export default home;
