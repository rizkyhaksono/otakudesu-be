import scrapeAnimeList from '@/lib/scrapeAnimeList';
import { http } from '@/lib/http';
import type { animeListGroup } from '@/types/types';

const animeList = async (): Promise<animeListGroup[]> => {
  const { data } = await http().get('/anime-list');
  return scrapeAnimeList(data);
};

export default animeList;
