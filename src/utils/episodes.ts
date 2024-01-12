import axios from 'axios';
import scrapeAnimeEpisodes from '@/lib/scrapeAnimeEpisodes';
import type { episode_list } from '@/types/types';

const { BASEURL } = process.env;
const episodes = async (slug: string): Promise<episode_list[] | undefined> => {
  const { data } = await axios.get(`${BASEURL}/anime/${slug}`);
  const result = scrapeAnimeEpisodes(data);

  return result;
};

export default episodes;
