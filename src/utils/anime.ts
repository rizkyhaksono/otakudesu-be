import scrapeSingleAnime from '@/lib/scrapeSingleAnime';
import { assertSlug } from '@/lib/env';
import { http } from '@/lib/http';
import type { anime as animeType } from '@/types/types';

const anime = async (slug: string): Promise<animeType | undefined> => {
  const safeSlug = assertSlug(slug);
  const { data } = await http().get(`/anime/${safeSlug}`);
  return scrapeSingleAnime(data);
};

export default anime;
