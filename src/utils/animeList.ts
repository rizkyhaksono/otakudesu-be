import axios from 'axios';
import scrapeAnimeList from '@/lib/scrapeAnimeList';
import type { animeListGroup } from '@/types/types';

const { BASEURL } = process.env;
const animeList = async (): Promise<animeListGroup[]> => {
  const { data } = await axios.get(`${BASEURL}/anime-list`);
  return scrapeAnimeList(data);
};

export default animeList;
