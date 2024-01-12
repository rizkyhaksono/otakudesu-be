import axios from 'axios';
import scrapeSingleAnime from '@/lib/scrapeSingleAnime';
import type { anime as animeType } from '@/types/types';

const { BASEURL } = process.env;
const anime = async (slug: string): Promise<animeType | undefined> => {
  const { data } = await axios.get(`${BASEURL}/anime/${slug}`);
  const result = scrapeSingleAnime(data);

  return result;
};

export default anime;