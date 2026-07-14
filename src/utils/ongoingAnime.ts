import { load } from 'cheerio';
import pagination from '@/lib/pagination';
import scrapeOngoingAnime from '@/lib/scapeOngoingAnime';
import { http } from '@/lib/http';

const ongoingAnime = async (page: number | string = 1) => {
  const { data } = await http().get(`/ongoing-anime/page/${page}`);
  const $ = load(data);
  const ongoingAnimeEls = $('.venutama .rseries .rapi .venz ul li').toString();
  const ongoingAnimeData = scrapeOngoingAnime(ongoingAnimeEls);
  const paginationData = pagination($('.pagination').toString());

  return {
    paginationData,
    ongoingAnimeData
  };
};

export default ongoingAnime;
