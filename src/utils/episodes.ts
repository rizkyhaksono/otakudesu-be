import scrapeAnimeEpisodes from '@/lib/scrapeAnimeEpisodes';
import { assertSlug } from '@/lib/env';
import { http } from '@/lib/http';
import type { episode_list } from '@/types/types';

const episodes = async (slug: string): Promise<episode_list[] | undefined> => {
  const safeSlug = assertSlug(slug);
  const { data } = await http().get(`/anime/${safeSlug}`);
  return scrapeAnimeEpisodes(data);
};

export default episodes;
