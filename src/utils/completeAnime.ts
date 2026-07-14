import { load } from 'cheerio';
import pagination from '@/lib/pagination';
import scrapeCompleteAnime from '@/lib/scrapeCompleteAnime';
import { http } from '@/lib/http';

const completeAnime = async (page: number | string = 1) => {
  const { data } = await http().get(`/complete-anime/page/${page}`);
  const $ = load(data);
  const completeAnimeEls = $('.venutama .rseries .rapi .venz ul li').toString();
  const completeAnimeData = scrapeCompleteAnime(completeAnimeEls);
  const paginationData = pagination($('.pagination').toString());

  return {
    paginationData,
    completeAnimeData
  };
};

export default completeAnime;
