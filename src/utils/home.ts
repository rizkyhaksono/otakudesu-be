import { load } from 'cheerio';
import scrapeOngoingAnime from '@/lib/scapeOngoingAnime';
import scrapeCompleteAnime from '@/lib/scrapeCompleteAnime';
import { http } from '@/lib/http';
import { ongoingAnime as ongoingAnimeType, completeAnime as completeAnimeType } from '@/types/types';

const home = async (): Promise<{ ongoing_anime: ongoingAnimeType[], complete_anime: completeAnimeType[] }> => {
  const { data } = await http().get('/');
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
